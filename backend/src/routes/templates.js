const express = require('express');
const { db } = require('../db');
const { authenticate, requireRole } = require('../middleware/auth');

const router = express.Router();

// Create a template (admin only)
router.post('/', authenticate, requireRole('admin'), (req, res) => {
  try {
    const { title, description, questions } = req.body;

    if (!title || !questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Title and at least one question are required' });
    }

    const insertTemplate = db.prepare(
      'INSERT INTO audit_templates (title, description, created_by) VALUES (?, ?, ?)'
    );
    const insertQuestion = db.prepare(
      'INSERT INTO template_questions (template_id, question_text, question_type, options, sort_order) VALUES (?, ?, ?, ?, ?)'
    );

    const transaction = db.transaction(() => {
      const result = insertTemplate.run(title, description || null, req.user.id);
      const templateId = result.lastInsertRowid;

      questions.forEach((q, index) => {
        if (!q.question_text || !q.question_type) {
          throw new Error('Each question must have question_text and question_type');
        }
        if (!['text', 'number', 'dropdown'].includes(q.question_type)) {
          throw new Error('question_type must be text, number, or dropdown');
        }
        const options = q.question_type === 'dropdown' && q.options
          ? JSON.stringify(q.options)
          : null;
        insertQuestion.run(templateId, q.question_text, q.question_type, options, index);
      });

      return templateId;
    });

    const templateId = transaction();
    const template = getTemplateById(templateId);

    res.status(201).json({ message: 'Template created successfully', template });
  } catch (err) {
    console.error('Create template error:', err);
    res.status(400).json({ error: err.message || 'Failed to create template' });
  }
});

// Get all templates
router.get('/', authenticate, (req, res) => {
  try {
    const templates = db.prepare(`
      SELECT t.*, u.name as creator_name
      FROM audit_templates t
      JOIN users u ON t.created_by = u.id
      ORDER BY t.created_at DESC
    `).all();

    res.json({ templates });
  } catch (err) {
    console.error('Get templates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single template with questions
router.get('/:id', authenticate, (req, res) => {
  try {
    const template = getTemplateById(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }
    res.json({ template });
  } catch (err) {
    console.error('Get template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a template (admin only)
router.delete('/:id', authenticate, requireRole('admin'), (req, res) => {
  try {
    const template = db.prepare('SELECT * FROM audit_templates WHERE id = ?').get(req.params.id);
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    db.prepare('DELETE FROM audit_templates WHERE id = ?').run(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Delete template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function getTemplateById(id) {
  const template = db.prepare(`
    SELECT t.*, u.name as creator_name
    FROM audit_templates t
    JOIN users u ON t.created_by = u.id
    WHERE t.id = ?
  `).get(id);

  if (!template) return null;

  const questions = db.prepare(
    'SELECT * FROM template_questions WHERE template_id = ? ORDER BY sort_order'
  ).all(id);

  return {
    ...template,
    questions: questions.map(q => ({
      ...q,
      options: q.options ? JSON.parse(q.options) : null
    }))
  };
}

module.exports = router;
