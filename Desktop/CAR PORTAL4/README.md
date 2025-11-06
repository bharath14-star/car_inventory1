# Car Portal — Fullstack (Local dev)

This workspace contains a fullstack Car Portal demo app.

- Backend: `backend/` — Node.js + Express + Mongoose (MongoDB), JWT auth, multer uploads
- Frontend: `frontend/` — Vite + React, React Router, Axios, Bootstrap

This README gives quick run instructions, env variables, and helpful notes for local development on Windows (PowerShell).

## Prerequisites

- Node.js 18+ (Node 18+ recommended so backend scripts can use global `fetch`)
- npm (comes with Node)
- MongoDB running locally or a cloud URI available

## Quick start (Option 1) — PowerShell script

The simplest way to start both servers is to run the PowerShell script:

```powershell
.\start-dev.ps1
```

This will:
1. Check and install dependencies if needed
2. Create `backend/.env` from example if missing
3. Start backend and frontend in separate windows
4. Show the URLs for both services

If port 5000 is already in use, you have two options:

```powershell

```

The script will automatically configure the frontend to use the correct backend URL.

## Quick start (Option 2) — npm workspaces

Alternatively, you can use npm workspaces from the root:

```powershell
# first time only
npm run install:all

# start both servers
npm run dev
```

## Manual start (Option 3) — start each service

You can also start the services manually. First, start the backend:

```powershell
cd backend
npm install
# copy example env (PowerShell)
Copy-Item .env.example .env
# edit .env as needed (MONGO_URI, JWT_SECRET)
npm run dev
```

- The backend listens on `PORT` (default 5000). API base: `http://localhost:5000/api`.
- Uploaded files are saved under the `uploads/` folder and served at `http://localhost:5000/uploads/...`.
- Helpful scripts:
  - `node scripts/smokeTest.js` — register/login/create/get/update/delete flow test (uses global fetch; Node 18+)
  - `node scripts/dashboardTest.js` — register + fetch dashboard stats

## Frontend — quick start

Open a separate PowerShell terminal and run:

```powershell
cd "c:\Users\bhara\Desktop\car portal\frontend"
npm install
npm run dev
```

- The Vite dev server will print a local URL (usually `http://localhost:5173`).
- The frontend uses the backend API base configured in `frontend/src/api.js`. By default it points to `http://localhost:5000/api`. To override, set the environment variable `REACT_APP_API_URL` before starting Vite.

## Environment variables

See `backend/.env.example`. The important ones:

- `PORT` — server port (default 5000)
- `MONGO_URI` — MongoDB connection string
- `JWT_SECRET` — secret for signing JWT tokens
- `UPLOAD_DIR` — folder for storing uploads (default `uploads`)

## Notes and tips

- The app stores uploaded photos and videos on disk — for production use consider cloud storage (S3) and signed URLs.
- Dashboard endpoints use aggregation — if your dataset grows, consider caching or pre-aggregating.
- When testing file uploads from the frontend, ensure the requests are sent as `multipart/form-data` (the `CarForm` component does this).
- If you get CORS errors, confirm the backend is running and the port matches `REACT_APP_API_URL`.

## Troubleshooting (Windows/PowerShell)

- If `Copy-Item` fails, you can copy manually in Explorer or run:

```powershell
cp .env.example .env
```

- If Node complains about `fetch` in scripts, ensure Node >= 18 is used, or run the script with a small polyfill.

## Next steps / TODOs

- Improve README with deployment notes and environment diagrams.
- Add automated tests and CI workflow.

---
If you want, I can add a short `make`-style script or npm workspace commands to start both backend and frontend with one command on Windows.
