const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { db } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Configure multer for image uploads
const uploadDir = process.env.UPLOAD_DIR || './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${crypto.randomUUID()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Submit an audit (auditor only)
router.post('/', authenticate, requireRole('auditor'), (req, res) => {
  try {
    const { template_id, store_name, notes, responses } = req.body;

    if (!template_id || !responses || !Array.isArray(responses)) {
      return res.status(400).json({ error: 'template_id and responses are required' });
    }

    const template = db.prepare('SELECT * FROM audit_templates WHERE id = ?').get(template_id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const insertAudit = db.prepare(
      'INSERT INTO audits (template_id, auditor_id, store_name, notes) VALUES (?, ?, ?, ?)'
    );
    const insertResponse = db.prepare(
      'INSERT INTO audit_responses (audit_id, question_id, answer) VALUES (?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const result = insertAudit.run(template_id, req.user.id, store_name || null, notes || null);
      const auditId = result.lastInsertRowid;

      responses.forEach(r => {
        if (!r.question_id) {
          throw new Error('Each response must have a question_id');
        }
        insertResponse.run(auditId, r.question_id, r.answer || null);
      });

      return auditId;
    });

    const auditId = transaction();
    res.status(201).json({ message: 'Audit submitted successfully', audit_id: auditId });
  } catch (err) {
    console.error('Submit audit error:', err);
    res.status(400).json({ error: err.message || 'Failed to submit audit' });
  }
});

// Upload images for an audit
router.post('/:id/images', authenticate, upload.array('images', 10), (req, res) => {
  try {
    const auditId = req.params.id;
    const audit = db.prepare('SELECT * FROM audits WHERE id = ?').get(auditId);
    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const insertImage = db.prepare(
      'INSERT INTO audit_images (audit_id, filename, original_name, file_path) VALUES (?, ?, ?, ?)'
    );

    const images = req.files.map(file => {
      insertImage.run(auditId, file.filename, file.originalname, file.path);
      return {
        filename: file.filename,
        original_name: file.originalname,
        url: `/uploads/${file.filename}`
      };
    });

    res.status(201).json({ message: 'Images uploaded successfully', images });
  } catch (err) {
    console.error('Upload images error:', err);
    res.status(500).json({ error: 'Failed to upload images' });
  }
});

// Get all audits (admin sees all, auditor sees own)
router.get('/', authenticate, (req, res) => {
  try {
    let query;
    let params = [];

    if (req.user.role === 'admin') {
      query = `
        SELECT a.*, t.title as template_title, u.name as auditor_name
        FROM audits a
        JOIN audit_templates t ON a.template_id = t.id
        JOIN users u ON a.auditor_id = u.id
        ORDER BY a.submitted_at DESC
      `;
    } else {
      query = `
        SELECT a.*, t.title as template_title, u.name as auditor_name
        FROM audits a
        JOIN audit_templates t ON a.template_id = t.id
        JOIN users u ON a.auditor_id = u.id
        WHERE a.auditor_id = ?
        ORDER BY a.submitted_at DESC
      `;
      params = [req.user.id];
    }

    const audits = db.prepare(query).all(...params);
    res.json({ audits });
  } catch (err) {
    console.error('Get audits error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single audit with responses and images
router.get('/:id', authenticate, (req, res) => {
  try {
    const audit = db.prepare(`
      SELECT a.*, t.title as template_title, t.description as template_description,
             u.name as auditor_name, u.email as auditor_email
      FROM audits a
      JOIN audit_templates t ON a.template_id = t.id
      JOIN users u ON a.auditor_id = u.id
      WHERE a.id = ?
    `).get(req.params.id);

    if (!audit) {
      return res.status(404).json({ error: 'Audit not found' });
    }

    // Check access
    if (req.user.role !== 'admin' && audit.auditor_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const responses = db.prepare(`
      SELECT ar.*, tq.question_text, tq.question_type, tq.options
      FROM audit_responses ar
      JOIN template_questions tq ON ar.question_id = tq.id
      WHERE ar.audit_id = ?
      ORDER BY tq.sort_order
    `).all(req.params.id);

    const images = db.prepare(
      'SELECT * FROM audit_images WHERE audit_id = ?'
    ).all(req.params.id);

    res.json({
      audit: {
        ...audit,
        responses: responses.map(r => ({
          ...r,
          options: r.options ? JSON.parse(r.options) : null
        })),
        images: images.map(img => ({
          ...img,
          url: `/uploads/${img.filename}`
        }))
      }
    });
  } catch (err) {
    console.error('Get audit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit stats (admin only)
router.get('/stats/summary', authenticate, requireRole('admin'), (req, res) => {
  try {
    const totalAudits = db.prepare('SELECT COUNT(*) as count FROM audits').get().count;
    const totalTemplates = db.prepare('SELECT COUNT(*) as count FROM audit_templates').get().count;
    const totalAuditors = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'auditor'").get().count;

    const recentAudits = db.prepare(`
      SELECT a.submitted_at, t.title as template_title, u.name as auditor_name
      FROM audits a
      JOIN audit_templates t ON a.template_id = t.id
      JOIN users u ON a.auditor_id = u.id
      ORDER BY a.submitted_at DESC
      LIMIT 5
    `).all();

    const auditsByTemplate = db.prepare(`
      SELECT t.title, COUNT(a.id) as count
      FROM audit_templates t
      LEFT JOIN audits a ON t.id = a.template_id
      GROUP BY t.id, t.title
    `).all();

    res.json({
      stats: {
        totalAudits,
        totalTemplates,
        totalAuditors,
        recentAudits,
        auditsByTemplate
      }
    });
  } catch (err) {
    console.error('Get stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
