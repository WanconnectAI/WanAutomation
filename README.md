# Operations Portal

A full-stack internal operations portal with form management, workflow automation tracking, and a dashboard.

## Tech Stack
- **Frontend**: React 18 + Vite + Tailwind CSS + Recharts
- **Backend**: Node.js + Express
- **Database**: SQLite (better-sqlite3)
- **Auth**: JWT (8-hour sessions)
- **File Uploads**: Multer

## Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install all dependencies
```bash
npm run install:all
```

### 2. Start the app
```bash
npm run dev
```

This runs **both** frontend (http://localhost:5173) and backend (http://localhost:5000) concurrently.

## Login Credentials (pre-seeded)

| Username | Password | Role |
|---|---|---|
| admin | admin123 | admin |
| opsmanager | ops456 | admin |

## Project Structure
```
/
├── client/          # React + Vite frontend
│   └── src/
│       ├── context/ # Auth context
│       ├── forms/   # Form components (A-D)
│       ├── pages/   # Dashboard, Forms, Workflows, Settings
│       └── components/
├── server/          # Express backend
│   ├── database/    # SQLite init & seed
│   ├── middleware/  # JWT auth
│   ├── routes/      # auth, forms, workflows, dashboard
│   └── uploads/     # File upload storage
├── database/        # SQLite .db file (auto-created)
└── package.json     # Root: runs both with concurrently
```

## Features

### Forms
- **Form A** — Job Application (5-step multi-page form with digital signature)
- **Form B** — Seminar Registration
- **Form C** — Staff Claim (with receipt upload)
- **Form D** — Client Request (with attachments)

### Submissions
- Searchable + paginated submissions table per form
- Export to CSV
- View full submission modal
- Delete with confirmation

### Automation Workflows
- Card view + list/table toggle
- Status toggle (Active/Inactive)
- URL copy button
- Search + filter by department/status
- Full CRUD

### Dashboard
- Stats: forms, submissions today, active workflows
- Bar chart (Recharts) — submissions per form
- Recent submissions table
- Quick form access links

## API Endpoints

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/login | — | Login |
| GET | /api/auth/me | JWT | Get current user |
| POST | /api/forms/submit | — | Submit multipart form |
| POST | /api/forms/submit-json | — | Submit JSON form |
| GET | /api/forms/submissions/:type | JWT | List submissions |
| DELETE | /api/forms/submission/:id | JWT | Delete submission |
| GET | /api/forms/export/:type | JWT | Export CSV |
| GET | /api/workflows | JWT | List workflows |
| POST | /api/workflows | JWT | Create workflow |
| PUT | /api/workflows/:id | JWT | Update workflow |
| PATCH | /api/workflows/:id/status | JWT | Toggle status |
| DELETE | /api/workflows/:id | JWT | Delete workflow |
| GET | /api/dashboard/stats | JWT | Dashboard stats |

## Deployment Recommendations

| Layer | Recommended Hosting | Notes |
|---|---|---|
| Frontend | Vercel / Netlify | Free tier, Git CI/CD |
| Backend | Railway / Render / Fly.io | Supports persistent storage |
| Database | PostgreSQL (Supabase / Railway) | Migrate from SQLite for production |
| Files | AWS S3 / Cloudflare R2 | Replace local `uploads/` folder |
