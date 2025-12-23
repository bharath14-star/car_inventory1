**Deploying Backend to Render and Frontend to GitHub Pages / Vercel**

- **Backend (Render)**
  - Create a new Web Service on Render, connect your GitHub repo.
  - Set the build & start commands:
    - Build: `npm install` (in `backend` folder Render will detect)
    - Start command: `npm start` (or `node server.js`)
  - Environment variables (set via Render dashboard -> Environment):
    - `MONGO_URI` = your MongoDB Atlas connection string
    - `JWT_SECRET` = any strong secret
    - `PORT` = (optional) Render sets this automatically
    - `EMAIL_USER` = Gmail address (for nodemailer)
    - `EMAIL_PASS` = Gmail App Password (use App Passwords, not normal password)
    - `FRONTEND_URL` = URL where your frontend is hosted (e.g. https://your-username.github.io/your-repo)
    - (Optional) `CLOUDINARY_URL` or `CLOUDINARY_CLOUD_NAME` + `CLOUDINARY_API_KEY` + `CLOUDINARY_API_SECRET` for media storage
    - (Optional) `CLOUDINARY_FOLDER` = folder name to store uploads in Cloudinary
  - Notes:
    - If `CLOUDINARY_*` variables are set the app will upload photos/videos to Cloudinary and store remote URLs.
    - If Cloudinary is not configured files are stored in `backend/uploads` and served at `https://<your-backend>/uploads/<file>` while the instance runs.

- **Frontend (GitHub Pages / Vercel / Render Static Site)**
  - Build the frontend (Vite) and host it.
  - If using GitHub Pages, set `VITE_API_URL` in `vite` environment or update `frontend/src/api.js` to point to your Render backend API base URL (`https://<your-backend>/api`).
  - Set `FRONTEND_URL` in backend environment to the final frontend URL so password-reset emails link correctly.

- **Password Reset Link Behavior**
  - The backend will use the request `Origin` header if available to build the password-reset link. Otherwise it falls back to `FRONTEND_URL` or `http://localhost:5173`.

- **Media Files**
  - For production uptime and persistence use Cloudinary. Provide `CLOUDINARY_URL` or individual Cloudinary env vars on Render.
  - If Cloudinary is configured, new uploads will be stored remotely and local temporary files removed.

- **Email (Gmail SMTP)**
  - For Gmail, create an App Password and use it in `EMAIL_PASS`.
  - Alternatively you can configure another SMTP provider by editing `backend/utils/email.js`.

- **Testing locally before deploying**
  - Copy `backend/.env.example` to `backend/.env` and fill values.
  - Start backend: `cd backend && npm install && npm run dev`
  - Start frontend: `cd frontend && npm install && npm run dev`

If you want, I can:
- add Cloudinary usage guidance or set up Cloudinary upload presets,
- create a small GitHub Actions workflow to deploy the frontend to GitHub Pages.
