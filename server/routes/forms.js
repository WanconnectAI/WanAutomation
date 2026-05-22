const express = require('express');
const multer = require('multer');
const path = require('path');
const { getDB } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

// Submit a form
router.post('/submit', upload.any(), (req, res) => {
  try {
    const { form_type, submitted_by, ...formData } = req.body;
    if (!form_type) return res.status(400).json({ error: 'form_type required' });

    const files = {};
    if (req.files && req.files.length > 0) {
      req.files.forEach(f => {
        if (!files[f.fieldname]) files[f.fieldname] = [];
        files[f.fieldname].push({ filename: f.filename, originalname: f.originalname, size: f.size });
      });
    }

    const data = JSON.stringify({ ...formData, _files: files });
    const db = getDB();
    const result = db.prepare('INSERT INTO form_submissions (form_type, data, submitted_by) VALUES (?, ?, ?)').run(form_type, data, submitted_by || 'anonymous');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Submit JSON form (no files)
router.post('/submit-json', (req, res) => {
  try {
    const { form_type, submitted_by, data: formData } = req.body;
    if (!form_type || !formData) return res.status(400).json({ error: 'form_type and data required' });

    const db = getDB();
    const dataStr = typeof formData === 'string' ? formData : JSON.stringify(formData);
    const result = db.prepare('INSERT INTO form_submissions (form_type, data, submitted_by) VALUES (?, ?, ?)').run(form_type, dataStr, submitted_by || 'anonymous');
    res.json({ success: true, id: result.lastInsertRowid });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// Get submissions by form type
router.get('/submissions/:formType', authMiddleware, (req, res) => {
  const { formType } = req.params;
  const { page = 1, limit = 10, search = '' } = req.query;
  const db = getDB();

  const offset = (parseInt(page) - 1) * parseInt(limit);
  let rows, total;

  if (search) {
    rows = db.prepare(`SELECT * FROM form_submissions WHERE form_type = ? AND (data LIKE ? OR submitted_by LIKE ?) ORDER BY submitted_at DESC LIMIT ? OFFSET ?`).all(formType, `%${search}%`, `%${search}%`, parseInt(limit), offset);
    total = db.prepare(`SELECT COUNT(*) as c FROM form_submissions WHERE form_type = ? AND (data LIKE ? OR submitted_by LIKE ?)`).get(formType, `%${search}%`, `%${search}%`).c;
  } else {
    rows = db.prepare('SELECT * FROM form_submissions WHERE form_type = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?').all(formType, parseInt(limit), offset);
    total = db.prepare('SELECT COUNT(*) as c FROM form_submissions WHERE form_type = ?').get(formType).c;
  }

  res.json({ submissions: rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
});

// Get single submission
router.get('/submission/:id', authMiddleware, (req, res) => {
  const db = getDB();
  const row = db.prepare('SELECT * FROM form_submissions WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Delete submission
router.delete('/submission/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM form_submissions WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// Export CSV
router.get('/export/:formType', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT * FROM form_submissions WHERE form_type = ? ORDER BY submitted_at DESC').all(req.params.formType);
  if (rows.length === 0) return res.status(200).send('id,form_type,submitted_by,submitted_at\n');

  const keys = ['id', 'form_type', 'submitted_by', 'submitted_at', 'data'];
  const csv = [keys.join(','), ...rows.map(r => keys.map(k => `"${String(r[k] || '').replace(/"/g, '""')}"`).join(','))].join('\n');
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${req.params.formType}-submissions.csv"`);
  res.send(csv);
});

module.exports = router;
