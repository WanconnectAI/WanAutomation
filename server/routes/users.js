const express = require('express')
const bcrypt = require('bcryptjs')
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/', authMiddleware, async (req, res) => {
  try {
    const users = await db.all('SELECT id, username, role, created_at FROM users ORDER BY created_at ASC')
    res.json(users)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load users' })
  }
})

router.post('/', authMiddleware, async (req, res) => {
  try {
    const { username, password, role = 'admin' } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })
    if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })

    const existing = await db.get('SELECT id FROM users WHERE username = ?', [username])
    if (existing) return res.status(409).json({ error: 'Username already exists' })

    const hash = bcrypt.hashSync(password, 10)
    const result = await db.insert('INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', [username, hash, role])
    res.json({ id: result.lastInsertRowid, username, role })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' })
  }
})

router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { password, role } = req.body
    const user = await db.get('SELECT id FROM users WHERE id = ?', [req.params.id])
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (password) {
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' })
      const hash = bcrypt.hashSync(password, 10)
      await db.run('UPDATE users SET password_hash = ? WHERE id = ?', [hash, req.params.id])
    }
    if (role) await db.run('UPDATE users SET role = ? WHERE id = ?', [role, req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' })
  }
})

router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const count = await db.get('SELECT COUNT(*) as c FROM users')
    if (parseInt(count.c) <= 1) return res.status(400).json({ error: 'Cannot delete the last user' })
    await db.run('DELETE FROM users WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' })
  }
})

module.exports = router
