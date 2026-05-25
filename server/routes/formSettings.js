const express = require('express')
const multer = require('multer')
const crypto = require('crypto')
const db = require('../database/db')
const { authMiddleware } = require('../middleware/auth')
const { getBoardColumns } = require('../utils/monday')
const { uploadToR2 } = require('../utils/r2')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: (req, file, cb) => cb(null, file.mimetype.startsWith('image/')) })

router.get('/:formType', authMiddleware, async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM form_settings WHERE form_type = ?', [req.params.formType])
    if (!row) return res.status(404).json({ error: 'Form settings not found' })
    res.json({ ...row, monday_column_mappings: JSON.parse(row.monday_column_mappings || '{}') })
  } catch (err) {
    res.status(500).json({ error: 'Failed to load settings' })
  }
})

router.put('/:formType', authMiddleware, async (req, res) => {
  try {
    const { form_name, monday_api_token, monday_board_id, monday_column_mappings } = req.body
    await db.run(
      'UPDATE form_settings SET form_name=?, monday_api_token=?, monday_board_id=?, monday_column_mappings=?, updated_at=NOW() WHERE form_type=?',
      [form_name || '', monday_api_token || '', monday_board_id || '', JSON.stringify(monday_column_mappings || {}), req.params.formType]
    )
    const row = await db.get('SELECT * FROM form_settings WHERE form_type = ?', [req.params.formType])
    res.json({ ...row, monday_column_mappings: JSON.parse(row.monday_column_mappings || '{}') })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update settings' })
  }
})

router.post('/:formType/logo', authMiddleware, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image uploaded' })
    const key = `logos/${Date.now()}-${req.file.originalname}`
    const logoUrl = await uploadToR2(req.file.buffer, key, req.file.mimetype)
    await db.run('UPDATE form_settings SET logo_url=?, updated_at=NOW() WHERE form_type=?', [logoUrl, req.params.formType])
    res.json({ logo_url: logoUrl })
  } catch (err) {
    res.status(500).json({ error: 'Failed to upload logo' })
  }
})

router.delete('/:formType/logo', authMiddleware, async (req, res) => {
  try {
    await db.run('UPDATE form_settings SET logo_url=NULL, updated_at=NOW() WHERE form_type=?', [req.params.formType])
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete logo' })
  }
})

router.post('/:formType/publish', authMiddleware, async (req, res) => {
  try {
    const { publish } = req.body
    const current = await db.get('SELECT * FROM form_settings WHERE form_type = ?', [req.params.formType])
    if (!current) return res.status(404).json({ error: 'Not found' })

    let token = current.public_token
    if (publish && !token) {
      token = crypto.randomUUID()
      await db.run('UPDATE form_settings SET is_published=1, public_token=?, updated_at=NOW() WHERE form_type=?', [token, req.params.formType])
    } else if (publish) {
      await db.run('UPDATE form_settings SET is_published=1, updated_at=NOW() WHERE form_type=?', [req.params.formType])
    } else {
      await db.run('UPDATE form_settings SET is_published=0, updated_at=NOW() WHERE form_type=?', [req.params.formType])
    }

    const updated = await db.get('SELECT * FROM form_settings WHERE form_type = ?', [req.params.formType])
    res.json({ is_published: updated.is_published, public_token: updated.public_token })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update publish state' })
  }
})

router.get('/:formType/monday-columns', authMiddleware, async (req, res) => {
  const { apiToken, boardId } = req.query
  if (!apiToken || !boardId) return res.status(400).json({ error: 'apiToken and boardId required' })
  try {
    const result = await getBoardColumns(apiToken, boardId)
    res.json(result)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
})

module.exports = router
