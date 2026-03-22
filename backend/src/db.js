const Database = require('better-sqlite3');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'audit.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('admin', 'auditor')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS audit_templates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS template_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL CHECK(question_type IN ('text', 'number', 'dropdown')),
      options TEXT,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (template_id) REFERENCES audit_templates(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS audits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      template_id INTEGER NOT NULL,
      auditor_id INTEGER NOT NULL,
      store_name TEXT,
      notes TEXT,
      status TEXT DEFAULT 'submitted',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (template_id) REFERENCES audit_templates(id),
      FOREIGN KEY (auditor_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id INTEGER NOT NULL,
      question_id INTEGER NOT NULL,
      answer TEXT,
      FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE,
      FOREIGN KEY (question_id) REFERENCES template_questions(id)
    );

    CREATE TABLE IF NOT EXISTS audit_images (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      audit_id INTEGER NOT NULL,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (audit_id) REFERENCES audits(id) ON DELETE CASCADE
    );
  `);
}

module.exports = { db, initializeDatabase };
