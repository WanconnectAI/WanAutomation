const express = require('express')
const router = express.Router()
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')
const { testSmtp } = require('../utils/automation')

router.get('/', authMiddleware, async (req, res) => {
  try {
    const rules = await db.all('SELECT * FROM automation_rules ORDER BY created_at DESC')
    res.json(rules.map(r => ({ ...r, action_config: JSON.parse(r.action_config || '{}') })))
  } catch (err) {
    res.status(500).json({ error: 'Failed to load rules' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { name, form_type, trigger = 'on_submit', action_type = 'email', action_config = {}, is_active = 1 } = req.body
    if (!name?.trim() || !form_type) return res.status(400).json({ error: 'name and form_type required' })
    const result = await db.insert(
      'INSERT INTO automation_rules (name, form_type, trigger, action_type, action_config, is_active) VALUES (?,?,?,?,?,?)',
      [name.trim(), form_type, trigger, action_type, JSON.stringify(action_config), is_active ? 1 : 0]
    )
    res.json({ id: result.lastInsertRowid })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create rule' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { name, form_type, trigger, action_type, action_config, is_active } = req.body
    await db.run(
      'UPDATE automation_rules SET name=?, form_type=?, trigger=?, action_type=?, action_config=?, is_active=?, updated_at=NOW() WHERE id=?',
      [name, form_type, trigger || 'on_submit', action_type || 'email', JSON.stringify(action_config || {}), is_active ? 1 : 0, req.params.id]
    )
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update rule' })
  }
})

router.patch('/:id/toggle', authMiddleware, async (req, res) => {
  try {
    const rule = await db.get('SELECT is_active FROM automation_rules WHERE id = ?', [req.params.id])
    if (!rule) return res.status(404).json({ error: 'Not found' })
    await db.run('UPDATE automation_rules SET is_active = ? WHERE id = ?', [rule.is_active ? 0 : 1, req.params.id])
    res.json({ success: true, is_active: !rule.is_active })
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle rule' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM automation_rules WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete rule' })
  }
})

router.post('/test-smtp', authMiddleware, async (req, res) => {
  try {
    await testSmtp()
    res.json({ success: true, message: 'SMTP connection successful' })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

router.get('/settings', authMiddleware, async (req, res) => {
  try {
    const rows = await db.all("SELECT key, value FROM portal_settings WHERE key LIKE 'smtp_%'")
    const settings = {}
    rows.forEach(r => { settings[r.key] = r.value })
    res.json(settings)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

router.post('/settings', authMiddleware, async (req, res) => {
  try {
    const allowed = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_from', 'smtp_secure']
    for (const k of allowed) {
      if (req.body[k] !== undefined) {
        await db.pool.query(
          'INSERT INTO portal_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
          [k, String(req.body[k])]
        )
      }
    }
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to save settings' })
  }
})

module.exports = router
