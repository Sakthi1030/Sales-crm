# Deploy Nexus CRM to Render

## What This Repo Is Ready For

This project is configured for a single Render web service that:
- builds the React frontend
- starts the Express backend
- serves the frontend from the backend in production

It also includes a Render Postgres database in `render.yaml`.

## Files Added for Render

- `render.yaml`
  Render blueprint for web service + database

- `package.json`
  Added:
  - `render-build`
  - `render-start`

- `backend/server.js`
  Now serves `frontend/build` in production

- `backend/config/db.js`
  Now supports `DATABASE_URL`

## How to Deploy

1. Push this project to GitHub.
2. Log in to Render.
3. Click `New` -> `Blueprint`.
4. Connect your GitHub repo.
5. Select this repo.
6. Render will detect `render.yaml`.
7. Review the web service and database settings.
8. Click `Apply`.

## After Deploy

Render will:
- create the database
- build the frontend
- start the backend
- run the seed script before deploy

That means the demo login should exist after deployment.

## Demo Login

- `admin@nexuscrm.io`
- `admin123`

## Important Notes

- Free Render web services sleep after inactivity.
- Free Render Postgres databases expire after 30 days.
- Every deploy runs the seed script, so demo data resets on each deploy.

## Useful URL

After deployment, open:

- `https://your-service-name.onrender.com`

Health check:

- `https://your-service-name.onrender.com/api/health`
