# Wanconnect Portal — Full Development Roadmap

**Project:** `portal.wanconnect.com.my`  
**Stack:** React + Node.js + PostgreSQL (Supabase) + Cloudflare R2  
**Hosting:** Vercel (frontend) + Railway (backend)  
**Last updated:** June 2026

---

## Platform Overview

```
www.wanconnect.com.my          → WordPress company website (Exabyte cPanel, paid until Jul 2028)
members.wanconnect.com.my      → Course member portal (Exabyte cPanel, to be replaced by Phase 3)
portal.wanconnect.com.my       → This portal (Vercel + Railway) ← active development
```

**Goal:** By July 2028 (when Exabyte cPanel expires), consolidate `members.wanconnect.com.my`
into this portal — saving ~RM4,700+/year on hosting + Sucuri security fees.

---

## ✅ Phase 0 — Core Portal (COMPLETED)

> Already live at `portal.wanconnect.com.my`

### Infrastructure
- [x] Node.js + Express backend on Railway
- [x] React + Vite + Tailwind CSS frontend on Vercel
- [x] PostgreSQL database on Supabase
- [x] Cloudflare R2 file storage (wanconnect-portal bucket)
- [x] Custom domain `portal.wanconnect.com.my`
- [x] CORS configured for all domains including `*.wanconnect.com.my`
- [x] JWT authentication (8-hour sessions)

### Staff Features
- [x] Staff login with Wanconnect branding + logo
- [x] Dashboard with stats + charts + recent submissions
- [x] Form Builder — create custom multi-page forms
- [x] 4 base forms: Job Application, Seminar Registration, Staff Claim, Client Request
- [x] Form submissions table (search, filter, export CSV, delete)
- [x] Workflow/Automation management (CRUD, active/inactive toggle)
- [x] User management (admin only)
- [x] Form settings (notifications, auto-responses)
- [x] Public form links for external submissions

---

## 🔧 Phase 1 — Fixes & Polish (NEXT UP)

> Small improvements to existing features

- [ ] **Form duplicate** — fix to copy full field/page content (not empty shell)
- [ ] **Base form edit** — make all 4 base forms editable via form builder
- [ ] **Default passwords** — change `admin/admin123` and `opsmanager/ops456` before going live
- [ ] **R2 file upload** — verify file attachments work in production (Staff Claim form)
- [ ] **R2 CORS policy** — add CORS headers to R2 bucket for production domain

---

## 🎓 Phase 2 — Client Accounts & Login

> Foundation for the student/client portal

### What we're building
A separate login experience for **clients and students**, distinct from staff accounts.

### Features
- [ ] Client registration page (self-register with email + password)
- [ ] Client login page (`/client-login` route)
- [ ] Email verification on registration
- [ ] Client dashboard (separate view from staff dashboard)
- [ ] Client profile page (name, company, phone, IC/passport)
- [ ] Admin: Client Management page (list, add, edit, deactivate clients)
- [ ] Admin: Manually create client accounts + send invite email
- [ ] Role-based access: `staff` / `admin` / `client` roles

### Database additions
```sql
-- clients table (separate from staff users)
CREATE TABLE clients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  company VARCHAR(255),
  ic_number VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',  -- active / inactive / pending
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  last_login TIMESTAMP
);
```

---

## 📚 Phase 3 — Course Management

> Replace `members.wanconnect.com.my` functionality

### Admin side (staff can manage)
- [ ] Create courses (name, description, thumbnail, category)
- [ ] Add modules to each course (title, type: PDF / video link / slides)
- [ ] Upload course materials to Cloudflare R2
- [ ] Set module order + lock/unlock sequence
- [ ] Enroll clients into courses (manually or via enrollment link)
- [ ] View enrollment list per course
- [ ] Track client progress per module
- [ ] Issue completion certificates (PDF generated)

### Client side (what students see)
- [ ] "My Courses" page — all enrolled courses with progress bars
- [ ] Course detail page — module list (locked/unlocked/completed)
- [ ] Download course materials (PDFs, templates)
- [ ] Video module viewer (embedded YouTube/Vimeo or R2 hosted)
- [ ] Mark module as complete
- [ ] Download completion certificate when course finished

### Database additions
```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail_url VARCHAR(500),
  category VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE course_modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER REFERENCES courses(id),
  title VARCHAR(255) NOT NULL,
  type VARCHAR(20),  -- pdf / video / slides / quiz
  content_url VARCHAR(500),
  order_index INTEGER,
  is_locked BOOLEAN DEFAULT false
);

CREATE TABLE enrollments (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  course_id INTEGER REFERENCES courses(id),
  enrolled_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  enrolled_by INTEGER REFERENCES users(id)  -- staff who enrolled them
);

CREATE TABLE module_progress (
  id SERIAL PRIMARY KEY,
  client_id INTEGER REFERENCES clients(id),
  module_id INTEGER REFERENCES course_modules(id),
  completed_at TIMESTAMP,
  UNIQUE(client_id, module_id)
);
```

---

## 💳 Phase 4 — Self-Enrollment & Payments (Optional)

> Allow clients to discover and pay for courses themselves

- [ ] Public course catalogue page (no login required)
- [ ] Course detail landing page with pricing
- [ ] Online payment via **ToyyibPay** or **Billplz** (Malaysian FPX/online banking)
- [ ] Auto-enrollment after successful payment
- [ ] Payment receipt + enrollment confirmation email
- [ ] Admin: Payment history + reports

---

## 💰 Cost & Platform Summary

| Service | Purpose | Cost | Notes |
|---|---|---|---|
| **Vercel** | Frontend hosting | Free | Unlimited bandwidth |
| **Railway** | Backend Node.js | Free tier | ~$5/mo if exceeds free tier |
| **Supabase** | PostgreSQL database | Free tier | 500MB storage |
| **Cloudflare R2** | File storage | Free up to 10GB | Course materials + uploads |
| **Exabyte** | WordPress + domain | ~RM1,684/yr | Pre-paid until Jul 2028 |
| **Sucuri (×2)** | Security (renews Mar 2027) | RM3,085/yr | **Replace with Cloudflare Free WAF** |

### Savings after Phase 3 complete (target: Jul 2028)
- Cancel Exabyte cPanel hosting → **save ~RM1,684/year**
- Cancel Sucuri × 2 (switch to Cloudflare Free) → **save ~RM3,085/year**
- **Total annual savings: ~RM4,769/year**

---

## 🗓️ Suggested Build Order

| Phase | When to build | Estimated effort |
|---|---|---|
| Phase 1 — Fixes | Now | 1–2 days |
| Phase 2 — Client Accounts | After Phase 1 | 3–5 days |
| Phase 3 — Course Management | After Phase 2 | 1–2 weeks |
| Phase 4 — Payments | Optional, when needed | 1 week |

---

## 📁 Project Structure (current)

```
/
├── client/                    # React + Vite frontend (deployed to Vercel)
│   ├── public/                # Logo, favicon
│   ├── src/
│   │   ├── context/           # AuthContext (JWT)
│   │   ├── pages/
│   │   │   ├── WelcomePage.jsx        # Staff login
│   │   │   ├── Dashboard.jsx
│   │   │   ├── FormsAndTables.jsx     # Form list + submissions
│   │   │   ├── FormBuilder.jsx        # Custom form builder
│   │   │   ├── Automations.jsx
│   │   │   ├── UserManagement.jsx
│   │   │   └── Settings.jsx
│   │   └── forms/             # Base form components (A–D)
│   └── vercel.json            # API proxy to Railway
│
├── server/                    # Express backend (deployed to Railway)
│   ├── database/
│   │   ├── init.js            # PostgreSQL schema
│   │   └── db.js              # Connection pool (Supabase)
│   ├── middleware/
│   │   └── auth.js            # JWT middleware
│   ├── routes/
│   │   ├── auth.js
│   │   ├── forms.js
│   │   ├── customForms.js
│   │   ├── workflows.js
│   │   ├── automations.js
│   │   ├── dashboard.js
│   │   ├── formSettings.js
│   │   ├── publicForms.js
│   │   └── users.js
│   └── index.js
│
├── railway.json               # Railway build/start config
├── ROADMAP.md                 # This file
└── mockup-client-portal.html  # UI mockup for Phase 2–3
```
