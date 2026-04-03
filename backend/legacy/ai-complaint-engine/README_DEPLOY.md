# Deployment Guide for CivicSense

This repository contains three independent services:

1. **frontend/** – React/Vite SPA served from Vercel.
2. **backend/** – Express/Socket.io API hosted on Render.
3. **ml_service/** – Python machine‑learning microservice hosted on Render.

Follow the steps below to get the entire stack running in production.

---

## 1. Backend on Render

1. Login to https://render.com using the **kritikamandale** GitHub account.
2. Click **New → Web Service**.
3. Select the `HackgenX_new` repo.
4. Configure:
   - Root Directory: `ai-complaint-engine/backend`
   - Runtime: `Node`
   - Build Command: `npm install`
   - Start Command: `node server.js`
5. Add these environment variables (Environment = "Production"):
   ```text
   MONGO_URI=https://...your mongo url...
   JWT_SECRET=hackathon_secret_key_123
   PORT=10000
   ```
6. Deploy. When ready, note the service URL (e.g. `https://amravati-hackgenx.onrender.com`).

> The startup script already kills any process occupying the chosen port, so deployment won't fail because of stale sockets.

---

## 2. ML service on Render

1. Create another Web Service.
2. Root Directory: `ai-complaint-engine/ml_service`.
3. Runtime: `Python 3`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `python app.py`
6. No environment variables are strictly required.

> After deployment, copy the resulting URL (e.g. `https://civicsense-ml.onrender.com`).

---

## 3. Frontend on Vercel

1. Sign in to https://vercel.com with **kritikamandale** GitHub account.
2. Add a new project and select `HackgenX_new`.
3. Set the project path to `ai-complaint-engine/frontend`.
4. Build & output settings:
   - Framework: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. Under **Environment Variables** add:
   - `VITE_API_URL` = the Render backend URL (`https://amravati-hackgenx.onrender.com`)
   - `VITE_ML_URL`  = the Render ML URL (set once available)
6. Optionally add same vars to `Preview` so branches behave correctly.
7. Deploy; Vercel will automatically run `npm install` then `npm run build`.

Local testing:

```bash
cd ai-complaint-engine/frontend
npm ci
# ensure .env.production exists (see .env.production example)
npm run build
npm run preview        # opens local server using the production build
```

---

### 4. Legacy port references removed
The frontend now uses `__API_BASE__` global (set by `vite.config.js`) instead of hardcoded `localhost`. See `vite.config.js` for details.

If you need to override the URL manually, modify `.env.production` or Vercel environment variables.

---

### 5. Post‑deployment housekeeping
* Push all changes to GitHub (`git add -A && git commit -m "deploy prep" && git push`).
* Confirm the front end can talk to the backend by opening the Vercel URL and performing a registration/login.
* Update DNS / custom domain in Vercel if required.

You're now fully deployed! Your CivicSense application is live and scalable.
