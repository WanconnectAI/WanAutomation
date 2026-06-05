require('dotenv').config()
const bcrypt = require('bcryptjs')
const db = require('./db')

async function initDB() {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS form_submissions (
      id SERIAL PRIMARY KEY,
      form_type TEXT NOT NULL,
      data TEXT NOT NULL,
      submitted_at TIMESTAMPTZ DEFAULT NOW(),
      submitted_by TEXT DEFAULT 'anonymous',
      pdf_path TEXT
    );

    CREATE TABLE IF NOT EXISTS workflows (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      department TEXT DEFAULT '',
      client_name TEXT DEFAULT '',
      url TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      status TEXT DEFAULT 'Active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS custom_forms (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      department TEXT DEFAULT 'Custom',
      color TEXT DEFAULT 'blue',
      icon TEXT DEFAULT '📋',
      fields TEXT DEFAULT '[]',
      pages TEXT DEFAULT '[]',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS automation_rules (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      form_type TEXT NOT NULL,
      trigger TEXT DEFAULT 'on_submit',
      action_type TEXT DEFAULT 'email',
      action_config TEXT DEFAULT '{}',
      is_active INTEGER DEFAULT 1,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS portal_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS form_settings (
      id SERIAL PRIMARY KEY,
      form_type TEXT UNIQUE NOT NULL,
      form_name TEXT DEFAULT '',
      logo_url TEXT,
      is_published INTEGER DEFAULT 0,
      public_token TEXT UNIQUE,
      monday_api_token TEXT DEFAULT '',
      monday_board_id TEXT DEFAULT '',
      monday_column_mappings TEXT DEFAULT '{}',
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)

  // Migrations — add new columns safely
  try { await db.exec(`ALTER TABLE users ADD COLUMN departments TEXT DEFAULT '[]'`) } catch {}
  try { await db.exec(`ALTER TABLE users ADD COLUMN permissions TEXT DEFAULT '{}'`) } catch {}

  // Seed admin users if none exist
  const existing = await db.get('SELECT id FROM users LIMIT 1')
  if (!existing) {
    const hash1 = bcrypt.hashSync('admin123', 10)
    const hash2 = bcrypt.hashSync('ops456', 10)
    await db.insert('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash1, 'admin'])
    await db.insert('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', ['opsmanager', hash2, 'admin'])
    console.log('Seeded admin users: admin/admin123 and opsmanager/ops456')
  }

  // Seed sample workflows if none exist
  const wfCount = await db.get('SELECT COUNT(*) as c FROM workflows')
  if (parseInt(wfCount.c) === 0) {
    const wfs = [
      ['Invoice Processing Automation', 'Automatically processes incoming invoices, extracts data via OCR, and routes for approval.', 'Finance', 'Internal', 'https://n8n.example.com/webhook/invoice-process', JSON.stringify(['Finance', 'OCR', 'Approval']), 'Active'],
      ['New Employee Onboarding', 'Sends welcome emails, creates accounts, and schedules orientation upon new hire submission.', 'HR', 'Internal', 'https://n8n.example.com/webhook/onboarding', JSON.stringify(['HR', 'Email', 'Onboarding']), 'Active'],
      ['Client Report Generation', 'Generates weekly performance reports and delivers to client contacts automatically.', 'Operations', 'ABC Corp', 'https://n8n.example.com/webhook/client-report', JSON.stringify(['Reports', 'Scheduled', 'Email']), 'Inactive'],
    ]
    for (const wf of wfs) {
      await db.insert('INSERT INTO workflows (name, description, department, client_name, url, tags, status) VALUES (?,?,?,?,?,?,?)', wf)
    }
    console.log('Seeded sample workflows')
  }

  // Seed form_settings for pre-built forms
  const formTypes = [
    ['job_application', 'Job Application Form'],
    ['seminar_registration', 'Seminar Registration Form'],
    ['staff_claim', 'Staff Claim Form'],
    ['client_request', 'Client Request Form'],
  ]
  for (const [type, name] of formTypes) {
    await db.exec(`INSERT INTO form_settings (form_type, form_name) VALUES ('${type}', '${name}') ON CONFLICT DO NOTHING`)
  }

  // Sync Supabase views for all existing custom forms (backfill on startup)
  try {
    const existingForms = await db.all('SELECT id, fields FROM custom_forms')
    for (const form of existingForms) {
      const fields = JSON.parse(form.fields || '[]')
      const viewName = `v_form_${form.id}`
      if (!fields.length) continue
      const seen = {}
      const columns = fields.map(f => {
        const rawName = f.name || f.id || f.label || 'field'
        let colName = rawName.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '').slice(0, 50)
        if (!colName) colName = 'field'
        if (seen[colName]) { seen[colName]++; colName = `${colName}_${seen[colName]}` } else { seen[colName] = 1 }
        const jsonKey = (f.name || f.id || f.label || 'field').replace(/'/g, "''")
        return `  (data::jsonb->>'${jsonKey}') AS "${colName}"`
      }).join(',\n')
      await db.pool.query(`
        CREATE OR REPLACE VIEW ${viewName} AS
        SELECT id, submitted_at, submitted_by,
        ${columns}
        FROM form_submissions WHERE form_type = 'custom_${form.id}'
        ORDER BY submitted_at DESC
      `)
    }
    if (existingForms.length) console.log(`Synced ${existingForms.length} custom form view(s)`)
  } catch (err) {
    console.warn('View sync skipped:', err.message)
  }

  console.log('Database initialised (PostgreSQL)')
}

module.exports = { initDB }
