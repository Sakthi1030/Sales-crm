# Nexus CRM Presentation Notes

## 1. Project Overview

Nexus CRM is a full-stack Customer Relationship Management system built for managing sales work in one place.

It includes:
- User login and role-based access
- Lead management
- Customer management
- Deal pipeline tracking
- Task management
- Reports and analytics
- Team management for admins

The project has 3 main parts:
- `frontend/` for the user interface
- `backend/` for the API and business logic
- `database/` for schema and seed data

---

## 2. Folder Structure and Purpose

### Root Folder

- `package.json`
  Purpose: Root scripts to install everything, run frontend and backend together, and seed the project.

- `README.md`
  Purpose: Project setup instructions and feature summary.

- `PRESENTATION_NOTES.md`
  Purpose: This presentation-friendly explanation document.

### Backend Folder

The backend is built with Node.js and Express.

- `backend/server.js`
  Purpose: Main entry point of the backend.
  It starts the Express server, loads middleware, connects routes, and checks database connectivity.

- `backend/config/db.js`
  Purpose: Creates the PostgreSQL connection pool.
  All backend routes use this file to run SQL queries.

- `backend/middleware/auth.js`
  Purpose: Verifies JWT tokens and protects private/admin routes.

- `backend/routes/auth.js`
  Purpose: Handles login, registration, and current-user lookup.

- `backend/routes/leads.js`
  Purpose: CRUD operations for leads, plus filtering, searching, pagination, and status updates.

- `backend/routes/customers.js`
  Purpose: CRUD for customers and customer interaction history.

- `backend/routes/deals.js`
  Purpose: CRUD for deals, stage changes, and pipeline summary.

- `backend/routes/tasks.js`
  Purpose: CRUD for tasks and done/pending toggle.

- `backend/routes/reports.js`
  Purpose: Analytics endpoints like KPIs, revenue, conversion, lead sources, and rep performance.

- `backend/routes/team.js`
  Purpose: Admin-only team management endpoints.

- `backend/.env`
  Purpose: Stores runtime configuration like port, DB host, DB port, DB user, DB password, and JWT secret.

### Database Folder

- `database/schema.sql`
  Purpose: Defines the PostgreSQL tables, constraints, indexes, and trigger logic.

- `database/seed.js`
  Purpose: Inserts sample demo data such as users, customers, leads, deals, and tasks.

### Frontend Folder

The frontend is built with React.

- `frontend/src/index.js`
  Purpose: React entry point that renders the app.

- `frontend/src/App.jsx`
  Purpose: Main app structure.
  It sets up routing, protected pages, layout, and auth flow.

- `frontend/src/context/AuthContext.jsx`
  Purpose: Global authentication state.
  It stores login state, token handling, and axios authorization setup.

- `frontend/src/utils/api.js`
  Purpose: Central place for frontend API calls.
  Keeps backend endpoint usage organized.

- `frontend/src/utils/helpers.js`
  Purpose: Shared helper functions like formatting, color maps, and utility methods.

- `frontend/src/components/layout/Sidebar.jsx`
  Purpose: Left navigation menu.

- `frontend/src/components/layout/Topbar.jsx`
  Purpose: Top header area for page title, search, and quick actions.

- `frontend/src/components/ui/index.jsx`
  Purpose: Reusable UI building blocks such as buttons, modals, tables, badges, spinner, and pagination.

- `frontend/src/pages/Login.jsx`
  Purpose: Login screen.

- `frontend/src/pages/Dashboard.jsx`
  Purpose: Dashboard with KPIs, charts, and activity view.

- `frontend/src/pages/Leads.jsx`
  Purpose: Lead listing and management UI.

- `frontend/src/pages/Customers.jsx`
  Purpose: Customer listing, details, and interaction history UI.

- `frontend/src/pages/Pipeline.jsx`
  Purpose: Deal pipeline UI organized by stage.

- `frontend/src/pages/Tasks.jsx`
  Purpose: Task list for pending and completed work.

- `frontend/src/pages/Reports.jsx`
  Purpose: Charts and analytics reports.

- `frontend/src/pages/Team.jsx`
  Purpose: Team management page, visible mainly for admin users.

---

## 3. How the System Works

### Frontend

The frontend shows the user interface in the browser.
When the user clicks something like login, create lead, or update task, the frontend sends a request to the backend API.

### Backend

The backend receives those requests, validates them, checks authentication, runs database queries, and returns JSON responses.

### Database

The database stores all business data such as:
- users
- leads
- customers
- interactions
- deals
- tasks

So the frontend does not directly talk to PostgreSQL.
It always goes through the backend.

---

## 4. Where the Data Comes From

The current data in this project comes from the seed script:
- `database/seed.js`

This file creates demo/sample data automatically, including:
- 6 users
- 30 customers
- 50 leads
- 30 deals
- 25 tasks

It also inserts realistic-looking names, companies, industries, values, and interaction history.

Important:
- The data is not from a live company
- The data is not pulled from any external API
- The data is generated locally for demonstration purposes

So the project uses seeded demo data, not production data.

---

## 5. Is the Data Real-Time or Static?

### Short Answer

It is dynamic inside the local application, but not real-time from the outside world.

### Explanation

- It is not static hardcoded UI data only, because the app reads and writes from PostgreSQL.
- It is not real-time in the sense of live stock market, live customer feeds, or WebSocket updates.
- It is database-driven demo data that changes when users perform actions in the app.

Examples:
- If you create a new lead, it is saved in the database.
- If you move a deal to another stage, the database updates.
- If you complete a task, the task status changes in the database.
- If you refresh the page, the updated data remains because it is stored in PostgreSQL.

So the best way to describe it is:

`This project uses persistent demo data stored in PostgreSQL. It is dynamic and interactive, but not real-time external data.`

---

## 6. Authentication and Roles

The system uses JWT-based authentication.

There are mainly 2 roles:
- `admin`
- `rep` (sales representative)

### Admin
- Can access everything
- Can manage team-related features

### Sales Rep
- Can access regular CRM functions
- Has more limited visibility compared to admin

This role-based control is handled in:
- frontend route logic
- backend auth middleware

---

## 7. Main Features to Present

### Login System
- Secure login with JWT token
- Role-based access control

### Dashboard
- KPI cards
- Charts
- Overview of CRM activity

### Leads Module
- Add, edit, search, filter, and update leads

### Customers Module
- Manage customer profiles
- View interaction history

### Deals / Pipeline Module
- Track deals across stages like prospect, qualified, negotiation, and closed

### Tasks Module
- Create and manage follow-up tasks
- Mark tasks as done or pending

### Reports Module
- Revenue, win rate, conversion, and rep performance analytics

### Team Module
- Admin-only team management

---

## 8. Technical Architecture Summary

### Frontend Technologies
- React
- React Router
- Axios
- Chart.js

### Backend Technologies
- Node.js
- Express
- JWT
- bcrypt
- PostgreSQL driver (`pg`)

### Database
- PostgreSQL

### Communication Flow

`Browser UI -> Express API -> PostgreSQL Database -> Express API -> Browser UI`

---

## 9. Best Way to Explain This in Presentation

You can say:

`Nexus CRM is a full-stack CRM system built with React, Node.js, Express, and PostgreSQL. The frontend handles the user interface, the backend handles business logic and secure API routes, and PostgreSQL stores the CRM data. The current project uses seeded demo data stored in the database, so it is dynamic and persistent, but not live real-time external data. Users can log in, manage leads, customers, deals, tasks, and reports through a role-based system.`

---

## 10. Simple Q&A Answers

### Is the data real?
No. It is demo/sample data generated by the seed script.

### Is it static?
Not fully static. It is stored in PostgreSQL and changes when the user performs actions.

### Is it real-time?
Not in the external live-data sense. It updates through normal API and database operations, not live streaming.

### Where is the backend logic?
Inside the `backend/` folder, mainly `server.js`, `config/db.js`, middleware, and route files.

### Where is the frontend logic?
Inside the `frontend/src/` folder.

### Where is the database design?
Inside `database/schema.sql`.

### Where is the sample data created?
Inside `database/seed.js`.

---

## 11. Final One-Line Summary

`This is a database-driven full-stack CRM demo application with persistent seeded data, role-based login, and modules for leads, customers, deals, tasks, reports, and team management.`
