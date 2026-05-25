const express = require('express')
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { search = '', department = '', status = '', client = '' } = req.query
    let query = 'SELECT * FROM workflows WHERE 1=1'
    const params = []
    let i = 1

    if (search) {
      query += ` AND (name ILIKE $${i} OR description ILIKE $${i+1} OR tags ILIKE $${i+2})`
      params.push(`%${search}%`, `%${search}%`, `%${search}%`); i += 3
    }
    if (department) { query += ` AND department = $${i}`; params.push(department); i++ }
    if (status) { query += ` AND status = $${i}`; params.push(status); i++ }
    if (client) { query += ` AND client_name ILIKE $${i}`; params.push(`%${client}%`); i++ }

    query += ' ORDER BY created_at DESC'
    const rows = await db.pool.query(query, params)
    res.json(rows.rows.map(r => ({ ...r, tags: JSON.parse(r.tags || '[]') })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load workflows' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, department, client_name, url, tags, status } = req.body
    if (!name) return res.status(400).json({ error: 'Name required' })
    const result = await db.insert(
      'INSERT INTO workflows (name, description, department, client_name, url, tags, status) VALUES (?,?,?,?,?,?,?)',
      [name, description || '', department || '', client_name || '', url || '', JSON.stringify(tags || []), status || 'Active']
    )
    const row = await db.get('SELECT * FROM workflows WHERE id = ?', [result.lastInsertRowid])
    res.json({ ...row, tags: JSON.parse(row.tags || '[]') })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create workflow' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, department, client_name, url, tags, status } = req.body
    await db.run(
      'UPDATE workflows SET name=?, description=?, department=?, client_name=?, url=?, tags=?, status=? WHERE id=?',
      [name, description || '', department || '', client_name || '', url || '', JSON.stringify(tags || []), status || 'Active', req.params.id]
    )
    const row = await db.get('SELECT * FROM workflows WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json({ ...row, tags: JSON.parse(row.tags || '[]') })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update workflow' })
  }
})

router.patch('/:id/status', authMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE workflows SET status=? WHERE id=?', [req.body.status, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM workflows WHERE id=?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete workflow' })
  }
})

router.get('/meta/departments', authMiddleware, async (req, res) => {
  try {
    const rows = await db.all("SELECT DISTINCT department FROM workflows WHERE department != ''")
    res.json(rows.map(r => r.department))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load departments' })
  }
})

module.exports = router
