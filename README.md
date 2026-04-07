# 🚀 Nexus CRM — Full-Stack Sales CRM

> A production-quality, SaaS-style Customer Relationship Management system built with **React**, **Node.js/Express**, and **PostgreSQL**.  
> Ideal for a final-year project or portfolio showcase.

---

## ✨ Features

| Module | What's included |
|---|---|
| **Dashboard** | KPI cards, revenue bar chart, lead source doughnut, conversion funnel, top reps leaderboard, activity feed |
| **Lead Management** | Full CRUD, status filters (New / Contacted / Qualified / Lost), priority tags, rep assignment, search, pagination |
| **Customers** | Customer table + detail modal with full interaction history timeline |
| **Pipeline (Kanban)** | 4-column drag-to-stage board: Prospect → Qualified → Negotiation → Closed Won |
| **Tasks** | Pending/completed split view, priority, rep assignment, due-date tracking |
| **Reports** | Revenue by rep, monthly win rate trend, deals by industry, new leads per month, rep performance table |
| **Team** | Admin-only member list with win rates and revenue stats |
| **Auth** | JWT login, role-based access (Admin / Sales Rep), token persistence |
| **UX** | Toast notifications, loading spinners, empty states, debounced search, pagination |

---

## 🗂 Project Structure

```
nexus-crm/
├── package.json              ← monorepo runner (concurrently)
│
├── backend/
│   ├── server.js             ← Express entry point
│   ├── .env.example          ← copy to .env and fill in
│   ├── config/
│   │   └── db.js             ← PostgreSQL pool
│   ├── middleware/
│   │   └── auth.js           ← JWT verify, requireAdmin
│   └── routes/
│       ├── auth.js           ← POST /login, POST /register, GET /me
│       ├── leads.js          ← CRUD + status patch + pagination
│       ├── customers.js      ← CRUD + interaction history
│       ├── deals.js          ← CRUD + stage patch + pipeline summary
│       ├── tasks.js          ← CRUD + toggle
│       ├── reports.js        ← overview, revenue, sources, rep perf, win-rate
│       └── team.js           ← admin-only user management
│
├── database/
│   ├── schema.sql            ← full PostgreSQL schema with indexes & triggers
│   └── seed.js               ← generates 6 users, 30 customers, 50 leads, 30 deals, 25 tasks
│
└── frontend/
    ├── package.json
    └── src/
        ├── index.js           ← React root
        ├── App.jsx            ← Router + auth shell
        ├── context/
        │   └── AuthContext.jsx ← JWT state, axios header injection
        ├── utils/
        │   ├── api.js         ← all axios calls in one place
        │   └── helpers.js     ← formatting + colour maps
        ├── components/
        │   ├── layout/
        │   │   ├── Sidebar.jsx
        │   │   └── Topbar.jsx
        │   └── ui/
        │       └── index.jsx  ← Badge, Avatar, Button, Modal, Table, KpiCard…
        └── pages/
            ├── Login.jsx
            ├── Dashboard.jsx
            ├── Leads.jsx
            ├── Customers.jsx
            ├── Pipeline.jsx
            ├── Tasks.jsx
            ├── Reports.jsx
            └── Team.jsx
```

---

## ⚙️ Prerequisites

| Tool | Version |
|---|---|
| Node.js | ≥ 18.x |
| npm | ≥ 9.x |
| PostgreSQL | ≥ 14 |

---

## 🛠 Setup — Step by Step

### 1. Clone / unzip the project

```bash
unzip nexus-crm.zip
cd nexus-crm
```

### 2. Create the PostgreSQL database

```sql
-- In psql or any GUI (TablePlus, pgAdmin, DBeaver):
CREATE DATABASE nexus_crm;
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=nexus_crm
DB_USER=postgres
DB_PASSWORD=yourpassword   # ← change this
JWT_SECRET=change_me_in_prod
CLIENT_URL=http://localhost:3000
```

### 4. Install all dependencies

```bash
# From the root directory:
cd ..
npm run install:all
```

This runs `npm install` in root, frontend, and backend.

### 5. Apply schema + seed sample data

```bash
npm run seed
# or: cd backend && npm run seed
```

Output:
```
✅ Schema applied
✅ Tables cleared
✅ 6 users created
✅ 30 customers + interactions created
✅ 50 leads created
✅ 30 deals created
✅ 25 tasks created

🎉 Seed complete! Login credentials:
   Admin:    admin@nexuscrm.io  /  admin123
   Sales Rep: sarah@nexuscrm.io  /  password123
```

### 6. Run the full stack

```bash
# From root — starts both backend (5000) and frontend (3000) concurrently:
npm run dev
```

Or run separately:
```bash
# Terminal 1 — backend
cd backend && npm run dev

# Terminal 2 — frontend
cd frontend && npm start
```

### 7. Open in browser

```
http://localhost:3000
```

---

## 🔐 Login Credentials (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@nexuscrm.io | admin123 |
| Sales Rep | sarah@nexuscrm.io | password123 |
| Sales Rep | marcus@nexuscrm.io | password123 |

**Admin** sees everything including Team management.  
**Sales Rep** sees only their own leads and tasks.

---

## 🌐 API Reference

All endpoints are prefixed with `/api/`.

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/auth/login` | Login → returns JWT |
| POST | `/auth/register` | Register new user |
| GET | `/auth/me` | Get current user (JWT required) |

### Leads
| Method | Path | Description |
|---|---|---|
| GET | `/leads` | List leads (query: page, limit, status, priority, q) |
| POST | `/leads` | Create lead |
| GET | `/leads/:id` | Get single lead |
| PUT | `/leads/:id` | Update lead |
| PATCH | `/leads/:id/status` | Update status only |
| DELETE | `/leads/:id` | Delete (admin only) |

### Customers
| Method | Path | Description |
|---|---|---|
| GET | `/customers` | List customers (query: q, industry, page, limit) |
| POST | `/customers` | Create customer |
| GET | `/customers/:id` | Customer + interaction history |
| PUT | `/customers/:id` | Update customer |
| DELETE | `/customers/:id` | Delete (admin only) |
| POST | `/customers/:id/interactions` | Log interaction |

### Deals
| Method | Path | Description |
|---|---|---|
| GET | `/deals` | All deals (query: stage, rep_id) |
| GET | `/deals/pipeline/summary` | Stage counts + totals |
| POST | `/deals` | Create deal |
| PUT | `/deals/:id` | Update deal |
| PATCH | `/deals/:id/stage` | Move stage |
| DELETE | `/deals/:id` | Delete (admin only) |

### Tasks
| Method | Path | Description |
|---|---|---|
| GET | `/tasks` | List tasks (query: done, priority) |
| POST | `/tasks` | Create task |
| PUT | `/tasks/:id` | Update task |
| PATCH | `/tasks/:id/toggle` | Toggle done/pending |
| DELETE | `/tasks/:id` | Delete task |

### Reports
| Method | Path | Description |
|---|---|---|
| GET | `/reports/overview` | Top-level KPIs |
| GET | `/reports/monthly-revenue` | Revenue by month |
| GET | `/reports/lead-sources` | Leads by source |
| GET | `/reports/rep-performance` | Per-rep stats (admin) |
| GET | `/reports/win-rate` | Monthly win rate trend |
| GET | `/reports/conversion` | Funnel conversion counts |

---

## 🏗 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v6, Chart.js (via react-chartjs-2), Axios, React Toastify |
| Backend | Node.js, Express 4, node-postgres (pg), bcryptjs, jsonwebtoken, express-validator |
| Database | PostgreSQL 14+ |
| Dev tools | nodemon, concurrently |

---

## 🎓 Key Architecture Decisions

- **JWT stored in localStorage** — straightforward for SPA; swap to httpOnly cookies for production
- **`proxy` in frontend package.json** — routes `/api/*` calls to `localhost:5000` in development, no CORS issues
- **Graceful fallback** — all frontend pages include demo data so the UI works even if the backend is offline
- **Role enforcement** — both backend (middleware) and frontend (route guards, menu hiding) enforce roles
- **Centralised API layer** — `utils/api.js` makes every endpoint easy to find and change
- **Shared UI primitives** — `components/ui/index.jsx` ensures consistent look across all pages

---

## 🚀 Deployment Tips

### Backend
Deploy to **Railway**, **Render**, or any VPS.  
Set all `.env` variables as environment secrets.  
Run `npm run seed` once after deploy to populate the DB.

### Frontend
```bash
cd frontend && npm run build
```
Deploy `build/` to **Netlify**, **Vercel**, or serve via `serve -s build`.  
Set `REACT_APP_API_URL` if your API isn't on the same domain.

