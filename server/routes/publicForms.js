const express = require('express')
const multer = require('multer')
const db = require('../database/db')
const { createMondayItem, getBoardColumns } = require('../utils/monday')
const { generateSubmissionPDF } = require('../utils/pdf')
const { runAutomations } = require('../utils/automation')
const { uploadToR2 } = require('../utils/r2')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

// GET public form config by token (no auth)
router.get('/:token', async (req, res) => {
  try {
    const settings = await db.get('SELECT * FROM form_settings WHERE public_token = ? AND is_published = 1', [req.params.token])
    if (!settings) return res.status(404).json({ error: 'Form not found or not published' })

    const response = {
      form_type: settings.form_type,
      form_name: settings.form_name,
      logo_url: settings.logo_url,
      is_published: settings.is_published,
    }
    if (settings.form_type.startsWith('custom_')) {
      const customId = settings.form_type.replace('custom_', '')
      const cf = await db.get('SELECT * FROM custom_forms WHERE id = ?', [customId])
      if (cf) {
        response.fields = JSON.parse(cf.fields || '[]')
        response.pages = JSON.parse(cf.pages || '[]')
      }
    }
    res.json(response)
  } catch (err) {
    res.status(500).json({ error: 'Failed to load form' })
  }
})

// POST public form submission (no auth required)
router.post('/:token/submit', upload.any(), async (req, res) => {
  try {
    const settings = await db.get('SELECT * FROM form_settings WHERE public_token = ? AND is_published = 1', [req.params.token])
    if (!settings) return res.status(404).json({ error: 'Form not found or not published' })

    const { form_type, data: rawData, submitted_by, ...formFields } = req.body

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

    let parsedData = {}
    if (rawData) {
      try { parsedData = JSON.parse(rawData) } catch { parsedData = { raw: rawData } }
    } else {
      parsedData = { ...formFields }
    }

    const finalData = { ...parsedData, _files: files }
    const result = await db.insert(
      'INSERT INTO form_submissions (form_type, data, submitted_by) VALUES (?, ?, ?)',
      [settings.form_type, JSON.stringify(finalData), submitted_by || 'public']
    )
    const submissionId = result.lastInsertRowid
    const submission = { id: submissionId, submitted_by: submitted_by || 'public', submitted_at: new Date().toISOString() }

    generateSubmissionPDF(settings.form_name || settings.form_type, submission, finalData)
      .then(pdfUrl => db.run('UPDATE form_submissions SET pdf_path = ? WHERE id = ?', [pdfUrl, submissionId]))
      .catch(err => console.warn('PDF generation failed:', err.message))

    runAutomations(settings.form_type, parsedData, submissionId).catch(() => {})

    if (settings.monday_api_token && settings.monday_board_id) {
      try {
        const mappings = JSON.parse(settings.monday_column_mappings || '{}')
        const { columns } = await getBoardColumns(settings.monday_api_token, settings.monday_board_id)
        const itemName = parsedData.nameNRIC || parsedData.fullName || parsedData.staffName || parsedData.clientName || `Submission #${submissionId}`
        await createMondayItem(settings.monday_api_token, settings.monday_board_id, itemName, parsedData, mappings, columns)
      } catch (err) {
        console.warn('Monday.com push failed:', err.message)
      }
    }

    res.json({ success: true, id: submissionId })
  } catch (err) {
    console.error('Public submit error:', err)
    res.status(500).json({ error: 'Submission failed' })
  }
})

module.exports = router
