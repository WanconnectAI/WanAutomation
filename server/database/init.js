const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

const dbDir = path.join(__dirname, '../../database');
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

const DB_PATH = path.join(dbDir, 'portal.db');
let db;

function getDB() {
  if (!db) db = new DatabaseSync(DB_PATH);
  return db;
}

function initDB() {
  const db = getDB();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS form_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      form_type TEXT NOT NULL,
      data TEXT NOT NULL,
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      submitted_by TEXT DEFAULT 'anonymous'
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      department TEXT,
      client_name TEXT,
      url TEXT,
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'Active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed admin users
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get('admin');
  if (!existing) {
    const hash1 = bcrypt.hashSync('admin123', 10);
    const hash2 = bcrypt.hashSync('ops456', 10);
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('admin', hash1, 'admin');
    db.prepare('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)').run('opsmanager', hash2, 'admin');
    console.log('Seeded admin users: admin/admin123 and opsmanager/ops456');
  }

  // Seed sample workflows
  const wfCount = db.prepare('SELECT COUNT(*) as c FROM workflows').get();
  if (wfCount.c === 0) {
    const stmt = db.prepare(`INSERT INTO workflows (name, description, department, client_name, url, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?)`);
    stmt.run('Invoice Processing Automation', 'Automatically processes incoming invoices, extracts data via OCR, and routes for approval.', 'Finance', 'Internal', 'https://n8n.example.com/webhook/invoice-process', JSON.stringify(['Finance', 'OCR', 'Approval']), 'Active');
    stmt.run('New Employee Onboarding', 'Sends welcome emails, creates accounts, and schedules orientation upon new hire submission.', 'HR', 'Internal', 'https://n8n.example.com/webhook/onboarding', JSON.stringify(['HR', 'Email', 'Onboarding']), 'Active');
    stmt.run('Client Report Generation', 'Generates weekly performance reports and delivers to client contacts automatically.', 'Operations', 'ABC Corp', 'https://n8n.example.com/webhook/client-report', JSON.stringify(['Reports', 'Scheduled', 'Email']), 'Inactive');
    console.log('Seeded sample workflows');
  }

  console.log('Database initialized at', DB_PATH);
}

module.exports = { getDB, initDB };
