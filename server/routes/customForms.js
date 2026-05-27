const express = require('express')
const router = express.Router()
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')

function parseForm(f) {
  return { ...f, pages: JSON.parse(f.pages || '[]'), fields: JSON.parse(f.fields || '[]') }
}

router.get('/', authMiddleware, async (req, res) => {
  try {
    const forms = await db.all('SELECT * FROM custom_forms ORDER BY created_at DESC')
    res.json(forms.map(parseForm))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load forms' })
  }
})

router.get('/:id', async (req, res) => {
  try {
    const form = await db.get('SELECT * FROM custom_forms WHERE id = ?', [req.params.id])
    if (!form) return res.status(404).json({ error: 'Not found' })
    res.json(parseForm(form))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load form' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, description, department, color, icon, fields, pages } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Form name required' })
    const flatFields = pages?.length ? pages.flatMap(p => p.fields || []) : (fields || [])
    const result = await db.insert(
      'INSERT INTO custom_forms (name, description, department, color, icon, fields, pages) VALUES (?,?,?,?,?,?,?)',
      [name.trim(), description || '', department || 'Custom', color || 'blue', icon || '📋', JSON.stringify(flatFields), JSON.stringify(pages || [])]
    )
    const formType = `custom_${result.lastInsertRowid}`
    await db.pool.query(
      'INSERT INTO form_settings (form_type, form_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [formType, name.trim()]
    )
    res.json({ id: result.lastInsertRowid, form_type: formType })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create form' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, description, department, color, icon, fields, pages } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Form name required' })
    const flatFields = pages?.length ? pages.flatMap(p => p.fields || []) : (fields || [])
    await db.run(
      'UPDATE custom_forms SET name=?, description=?, department=?, color=?, icon=?, fields=?, pages=?, updated_at=NOW() WHERE id=?',
      [name.trim(), description || '', department || 'Custom', color || 'blue', icon || '📋', JSON.stringify(flatFields), JSON.stringify(pages || []), req.params.id]
    )
    await db.run('UPDATE form_settings SET form_name=? WHERE form_type=?', [name.trim(), `custom_${req.params.id}`])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update form' })
  }
})

router.post('/duplicate-base', authMiddleware, async (req, res) => {
  try {
    const { name, description, department, color, icon, fields, pages } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Form name required' })
    const newName = `Copy of ${name.trim()}`
    const flatFields = pages?.length ? pages.flatMap(p => p.fields || []) : (fields || [])
    const result = await db.insert(
      'INSERT INTO custom_forms (name, description, department, color, icon, fields, pages) VALUES (?,?,?,?,?,?,?)',
      [newName, description || '', department || 'Custom', color || 'blue', icon || '📋', JSON.stringify(flatFields), JSON.stringify(pages || [])]
    )
    const formType = `custom_${result.lastInsertRowid}`
    await db.pool.query(
      'INSERT INTO form_settings (form_type, form_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [formType, newName]
    )
    res.json({ id: result.lastInsertRowid, form_type: formType })
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate form' })
  }
})

router.post('/:id/duplicate', authMiddleware, async (req, res) => {
  try {
    const src = await db.get('SELECT * FROM custom_forms WHERE id = ?', [req.params.id])
    if (!src) return res.status(404).json({ error: 'Not found' })
    const newName = `Copy of ${src.name}`
    const result = await db.insert(
      'INSERT INTO custom_forms (name, description, department, color, icon, fields, pages) VALUES (?,?,?,?,?,?,?)',
      [newName, src.description, src.department, src.color, src.icon, src.fields, src.pages || '[]']
    )
    const formType = `custom_${result.lastInsertRowid}`
    await db.pool.query(
      'INSERT INTO form_settings (form_type, form_name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [formType, newName]
    )
    res.json({ id: result.lastInsertRowid, form_type: formType })
  } catch (err) {
    res.status(500).json({ error: 'Failed to duplicate form' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM custom_forms WHERE id = ?', [req.params.id])
    await db.run('DELETE FROM form_settings WHERE form_type = ?', [`custom_${req.params.id}`])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete form' })
  }
})

module.exports = router
