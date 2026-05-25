const nodemailer = require('nodemailer')
const db = require('../database/db')

async function getSetting(key) {
  const row = await db.get('SELECT value FROM portal_settings WHERE key = ?', [key])
  return row?.value || ''
}

async function getTransporter() {
  const host = await getSetting('smtp_host')
  const user = await getSetting('smtp_user')
  if (!host || !user) return null
  return nodemailer.createTransport({
    host,
    port: parseInt(await getSetting('smtp_port')) || 587,
    secure: (await getSetting('smtp_secure')) === 'true',
    auth: { user, pass: await getSetting('smtp_pass') },
    tls: { rejectUnauthorized: false },
  })
}

function resolveTemplate(template, data) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    const val = data[key]
    if (Array.isArray(val)) return val.join(', ')
    if (val === null || val === undefined) return ''
    return String(val)
  })
}

async function runAutomations(formType, data, submissionId) {
  const rules = await db.all(
    "SELECT * FROM automation_rules WHERE form_type = ? AND is_active = 1 AND trigger = 'on_submit'",
    [formType]
  )

  for (const rule of rules) {
    try {
      const config = JSON.parse(rule.action_config || '{}')
      if (rule.action_type === 'email') {
        const transporter = await getTransporter()
        if (!transporter) {
          console.warn(`Automation "${rule.name}" skipped: SMTP not configured`)
          continue
        }
        const from = (await getSetting('smtp_from')) || (await getSetting('smtp_user'))
        const context = { ...data, submission_id: submissionId, form_type: formType }
        const toList = Array.isArray(config.to) ? config.to.join(', ') : (config.to || '')
        await transporter.sendMail({
          from,
          to: toList,
          subject: resolveTemplate(config.subject || 'New Form Submission #{{submission_id}}', context),
          text: resolveTemplate(config.body || 'A new submission has been received.', context),
          html: resolveTemplate(config.body || 'A new submission has been received.', context).replace(/\n/g, '<br>'),
        })
        console.log(`Automation "${rule.name}": email sent to ${toList}`)
      }
    } catch (err) {
      console.warn(`Automation "${rule.name}" failed:`, err.message)
    }
  }
}

async function testSmtp() {
  const transporter = await getTransporter()
  if (!transporter) throw new Error('SMTP not configured — fill in host, user, and password first')
  await transporter.verify()
}

module.exports = { runAutomations, testSmtp }
