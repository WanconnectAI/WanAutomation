const express = require('express')
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')

const router = express.Router()

router.get('/stats', authMiddleware, async (req, res) => {
  try {
    const [totalSub, todaySub, totalWf, activeWf, recentSub, byForm] = await Promise.all([
      db.get('SELECT COUNT(*) as c FROM form_submissions'),
      db.get("SELECT COUNT(*) as c FROM form_submissions WHERE submitted_at::date = CURRENT_DATE"),
      db.get('SELECT COUNT(*) as c FROM workflows'),
      db.get("SELECT COUNT(*) as c FROM workflows WHERE status = 'Active'"),
      db.all('SELECT * FROM form_submissions ORDER BY submitted_at DESC LIMIT 10'),
      db.all('SELECT form_type, COUNT(*) as count FROM form_submissions GROUP BY form_type'),
    ])

    res.json({
      totalForms: 4,
      totalSubmissions: parseInt(totalSub.c),
      todaySubmissions: parseInt(todaySub.c),
      totalWorkflows: parseInt(totalWf.c),
      activeWorkflows: parseInt(activeWf.c),
      recentSubmissions: recentSub,
      submissionsByForm: byForm,
    })
  } catch (err) {
    console.error('Dashboard stats error:', err)
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

module.exports = router
