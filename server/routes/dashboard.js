const express = require('express');
const { getDB } = require('../database/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.get('/stats', authMiddleware, (req, res) => {
  const db = getDB();
  const today = new Date().toISOString().split('T')[0];

  const totalForms = 4;
  const totalSubmissions = db.prepare('SELECT COUNT(*) as c FROM form_submissions').get().c;
  const todaySubmissions = db.prepare(`SELECT COUNT(*) as c FROM form_submissions WHERE date(submitted_at) = date('now', 'localtime')`).get().c;
  const totalWorkflows = db.prepare('SELECT COUNT(*) as c FROM workflows').get().c;
  const activeWorkflows = db.prepare("SELECT COUNT(*) as c FROM workflows WHERE status = 'Active'").get().c;

  const recentSubmissions = db.prepare('SELECT * FROM form_submissions ORDER BY submitted_at DESC LIMIT 10').all();

  const submissionsByForm = db.prepare(`SELECT form_type, COUNT(*) as count FROM form_submissions GROUP BY form_type`).all();

  res.json({ totalForms, totalSubmissions, todaySubmissions, totalWorkflows, activeWorkflows, recentSubmissions, submissionsByForm });
});

module.exports = router;
