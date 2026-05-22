const express = require('express');
const { getDB } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/', authMiddleware, (req, res) => {
  const { search = '', department = '', status = '', client = '' } = req.query;
  const db = getDB();
  let query = 'SELECT * FROM workflows WHERE 1=1';
  const params = [];

  if (search) { query += ' AND (name LIKE ? OR description LIKE ? OR tags LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  if (department) { query += ' AND department = ?'; params.push(department); }
  if (status) { query += ' AND status = ?'; params.push(status); }
  if (client) { query += ' AND client_name LIKE ?'; params.push(`%${client}%`); }

  query += ' ORDER BY created_at DESC';
  const rows = db.prepare(query).all(...params);
  res.json(rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })));
});

router.post('/', authMiddleware, (req, res) => {
  const { name, description, department, client_name, url, tags, status } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });

  const db = getDB();
  const result = db.prepare('INSERT INTO workflows (name, description, department, client_name, url, tags, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, description || '', department || '', client_name || '', url || '', JSON.stringify(tags || []), status || 'Active');
  const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(result.lastInsertRowid);
  res.json({ ...row, tags: JSON.parse(row.tags || '[]') });
});

router.put('/:id', authMiddleware, (req, res) => {
  const { name, description, department, client_name, url, tags, status } = req.body;
  const db = getDB();
  db.prepare('UPDATE workflows SET name=?, description=?, department=?, client_name=?, url=?, tags=?, status=? WHERE id=?').run(name, description || '', department || '', client_name || '', url || '', JSON.stringify(tags || []), status || 'Active', req.params.id);
  const row = db.prepare('SELECT * FROM workflows WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, tags: JSON.parse(row.tags || '[]') });
});

router.patch('/:id/status', authMiddleware, (req, res) => {
  const { status } = req.body;
  const db = getDB();
  db.prepare('UPDATE workflows SET status=? WHERE id=?').run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', authMiddleware, (req, res) => {
  const db = getDB();
  db.prepare('DELETE FROM workflows WHERE id=?').run(req.params.id);
  res.json({ success: true });
});

router.get('/meta/departments', authMiddleware, (req, res) => {
  const db = getDB();
  const rows = db.prepare('SELECT DISTINCT department FROM workflows WHERE department != ""').all();
  res.json(rows.map(r => r.department));
});

module.exports = router;
