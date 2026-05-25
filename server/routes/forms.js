const express = require('express')
const multer = require('multer')
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')
const { generateSubmissionPDF } = require('../utils/pdf')
const { runAutomations } = require('../utils/automation')
const { uploadToR2 } = require('../utils/r2')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// Submit a form (multipart with files)
router.post('/submit', upload.any(), async (req, res) => {
  try {
    const { form_type, submitted_by, ...formData } = req.body
    if (!form_type) return res.status(400).json({ error: 'form_type required' })

    // Upload files to R2
    const files = {}
    if (req.files?.length) {
      for (const f of req.files) {
        const key = `uploads/${Date.now()}-${f.originalname}`
        const url = await uploadToR2(f.buffer, key, f.mimetype)
        if (!files[f.fieldname]) files[f.fieldname] = []
        files[f.fieldname].push({ url, originalname: f.originalname, size: f.size })
      }
    }

    const parsedData = {}
    Object.entries(formData).forEach(([k, v]) => {
      try { parsedData[k] = JSON.parse(v) } catch { parsedData[k] = v }
    })

    const fullData = { ...parsedData, _files: files }
    const result = await db.insert(
      'INSERT INTO form_submissions (form_type, data, submitted_by) VALUES (?, ?, ?)',
      [form_type, JSON.stringify(fullData), submitted_by || 'anonymous']
    )
    const submissionId = result.lastInsertRowid
    const submission = { id: submissionId, submitted_by: submitted_by || 'anonymous', submitted_at: new Date().toISOString() }

    const settings = await db.get('SELECT form_name FROM form_settings WHERE form_type = ?', [form_type])
    const formName = settings?.form_name || form_type

    generateSubmissionPDF(formName, submission, fullData)
      .then(pdfUrl => db.run('UPDATE form_submissions SET pdf_path = ? WHERE id = ?', [pdfUrl, submissionId]))
      .catch(err => console.warn('PDF generation failed:', err.message))

    runAutomations(form_type, parsedData, submissionId).catch(err => console.warn('Automation error:', err.message))

    res.json({ success: true, id: submissionId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to submit form' })
  }
})

// Submit JSON form (no files)
router.post('/submit-json', async (req, res) => {
  try {
    const { form_type, submitted_by, data: formData } = req.body
    if (!form_type || !formData) return res.status(400).json({ error: 'form_type and data required' })

    const parsedData = typeof formData === 'string' ? JSON.parse(formData) : formData
    const result = await db.insert(
      'INSERT INTO form_submissions (form_type, data, submitted_by) VALUES (?, ?, ?)',
      [form_type, JSON.stringify(parsedData), submitted_by || 'anonymous']
    )
    const submissionId = result.lastInsertRowid
    const submission = { id: submissionId, submitted_by: submitted_by || 'anonymous', submitted_at: new Date().toISOString() }
    const settings = await db.get('SELECT form_name FROM form_settings WHERE form_type = ?', [form_type])
    const formName = settings?.form_name || form_type

    generateSubmissionPDF(formName, submission, parsedData)
      .then(pdfUrl => db.run('UPDATE form_submissions SET pdf_path = ? WHERE id = ?', [pdfUrl, submissionId]))
      .catch(err => console.warn('PDF generation failed:', err.message))

    runAutomations(form_type, parsedData, submissionId).catch(() => {})

    res.json({ success: true, id: submissionId })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to submit form' })
  }
})

// Get submissions by form type
router.get('/submissions/:formType', authMiddleware, async (req, res) => {
  try {
    const { formType } = req.params
    const { page = 1, limit = 20, search = '' } = req.query
    const offset = (parseInt(page) - 1) * parseInt(limit)

    let rows, total
    if (search) {
      rows = await db.all(
        'SELECT * FROM form_submissions WHERE form_type = ? AND (data ILIKE ? OR submitted_by ILIKE ?) ORDER BY submitted_at DESC LIMIT ? OFFSET ?',
        [formType, `%${search}%`, `%${search}%`, parseInt(limit), offset]
      )
      const t = await db.get(
        'SELECT COUNT(*) as c FROM form_submissions WHERE form_type = ? AND (data ILIKE ? OR submitted_by ILIKE ?)',
        [formType, `%${search}%`, `%${search}%`]
      )
      total = parseInt(t.c)
    } else {
      rows = await db.all(
        'SELECT * FROM form_submissions WHERE form_type = ? ORDER BY submitted_at DESC LIMIT ? OFFSET ?',
        [formType, parseInt(limit), offset]
      )
      const t = await db.get('SELECT COUNT(*) as c FROM form_submissions WHERE form_type = ?', [formType])
      total = parseInt(t.c)
    }

    res.json({ submissions: rows, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load submissions' })
  }
})

// Get single submission
router.get('/submission/:id', authMiddleware, async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM form_submissions WHERE id = ?', [req.params.id])
    if (!row) return res.status(404).json({ error: 'Not found' })
    res.json(row)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load submission' })
  }
})

// Delete submission
router.delete('/submission/:id', authMiddleware, async (req, res) => {
  try {
    await db.run('DELETE FROM form_submissions WHERE id = ?', [req.params.id])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete submission' })
  }
})

// Export CSV
router.get('/export/:formType', authMiddleware, async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM form_submissions WHERE form_type = ? ORDER BY submitted_at DESC', [req.params.formType])
    if (rows.length === 0) return res.status(200).send('id,form_type,submitted_by,submitted_at\n')

    const allKeys = new Set()
    rows.forEach(r => {
      try { Object.keys(JSON.parse(r.data)).filter(k => !k.startsWith('_')).forEach(k => allKeys.add(k)) } catch {}
    })
    const fieldKeys = Array.from(allKeys)
    const headers = ['id', 'submitted_by', 'submitted_at', 'pdf', ...fieldKeys, 'files']
    const escape = v => `"${String(v || '').replace(/"/g, '""')}"`

    const lines = [headers.join(',')]
    rows.forEach(r => {
      let d = {}
      try { d = JSON.parse(r.data) } catch {}
      const files = d._files
        ? Object.entries(d._files).map(([k, fs]) => fs.map(f => `${k}:${f.originalname}`).join(';')).join('|')
        : ''
      const values = [r.id, r.submitted_by, r.submitted_at, r.pdf_path || '', ...fieldKeys.map(k => {
        const v = d[k]
        if (Array.isArray(v)) return Array.isArray(v[0]) ? JSON.stringify(v) : v.join('; ')
        if (typeof v === 'object' && v) return JSON.stringify(v)
        return v ?? ''
      }), files]
      lines.push(values.map(escape).join(','))
    })

    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.formType}-submissions.csv"`)
    res.send(lines.join('\n'))
  } catch (err) {
    res.status(500).json({ error: 'Failed to export' })
  }
})

module.exports = router
