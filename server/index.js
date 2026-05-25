require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const { initDB } = require('./database/init')
const authRoutes = require('./routes/auth')
const formsRoutes = require('./routes/forms')
const workflowsRoutes = require('./routes/workflows')
const dashboardRoutes = require('./routes/dashboard')
const formSettingsRoutes = require('./routes/formSettings')
const publicFormsRoutes = require('./routes/publicForms')
const customFormsRoutes = require('./routes/customForms')
const automationsRoutes = require('./routes/automations')
const usersRoutes = require('./routes/users')

const app = express()
const PORT = process.env.PORT || 5000

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5500', 'http://localhost:5600', 'http://localhost:7200'],
  credentials: true,
}))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Init DB then start server
initDB()
  .then(() => {
    app.use('/api/auth', authRoutes)
    app.use('/api/forms', formsRoutes)
    app.use('/api/workflows', workflowsRoutes)
    app.use('/api/dashboard', dashboardRoutes)
    app.use('/api/form-settings', formSettingsRoutes)
    app.use('/api/public/form', publicFormsRoutes)
    app.use('/api/custom-forms', customFormsRoutes)
    app.use('/api/automations', automationsRoutes)
    app.use('/api/users', usersRoutes)

    app.get('/api/health', (req, res) => res.json({ status: 'ok', db: 'postgresql' }))

    // Serve built React app (production)
    const distDir = path.join(__dirname, '../client/dist')
    if (fs.existsSync(distDir)) {
      app.use(express.static(distDir))
      app.get('*', (req, res) => res.sendFile(path.join(distDir, 'index.html')))
    }

    app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`))
  })
  .catch(err => {
    console.error('Failed to initialise database:', err.message)
    process.exit(1)
  })
