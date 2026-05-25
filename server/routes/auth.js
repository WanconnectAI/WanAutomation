const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database/db')
const { JWT_SECRET } = require('../middleware/auth')

const router = express.Router()

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' })

    const user = await db.get('SELECT * FROM users WHERE username = ?', [username])
    if (!user) return res.status(401).json({ error: 'Invalid credentials' })

    const valid = bcrypt.compareSync(password, user.password_hash)
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

    const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, JWT_SECRET, { expiresIn: '8h' })
    res.json({ token, user: { id: user.id, username: user.username, role: user.role } })
  } catch (err) {
    console.error('Login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token' })
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    res.json({ user: decoded })
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
})

module.exports = router
