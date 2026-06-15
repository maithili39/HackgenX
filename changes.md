HackgenX — Phase-Wise Rebuild Plan
Based on the full analysis, here's every broken thing fixed in order of dependency.

Phase 1 — Foundation (Days 1–3)
Nothing works until this is done. Zero UI testing possible without these.

1.1 Backend Environment & Server Boot
Fix server.js line 42 syntax error: mongoose.connect(process.env.MONGO_URI || ) → add proper fallback string
Create backend/api/.env with real MONGO_URI (use the Atlas URL already in createAdmin.js)
Move hardcoded Atlas credentials out of createAdmin.js into env var — security fix
Verify server starts, connects to MongoDB, logs confirmation
1.2 Wire Up SLA Engine
Import startSlaEscalation in server.js
Call it after mongoose connects — currently 100% dead code
Test: submit a complaint, manually set slaDeadline to past, confirm slaBreached flips and socket event fires
1.3 Frontend Environment
Create frontend/.env with VITE_API_URL=http://localhost:5000
Replace every hardcoded http://localhost:5000 in:
AuthContext.jsx (login + register calls)
Register.jsx (OTP send call, line 35)
Grep all CitizenDashboard sub-components for localhost:5000 and replace with __API_BASE__
Create frontend/vercel.json for SPA routing (fixes all Vercel 404s)
Exit criteria: Login and Register work locally AND on Vercel.

Phase 2 — Core Complaint Flow (Days 4–7)
The main citizen feature — submit, track, view.

2.1 Google Maps Integration
Replace placeholder key AIzaSyA_placeholder_test_key_for_hackathon in LocationPicker.jsx with import.meta.env.VITE_GOOGLE_MAPS_API_KEY
Enable Maps JS API + Places API + Geocoding API in Google Cloud Console
Add real key to frontend/.env and Vercel env vars
Test: location picker loads, GPS works, autocomplete works, draggable pin works
2.2 Ward Saved to Complaint
Fix SubmitComplaintSection.jsx: add detectedWard to submit payload (currently missing from const payload = { ...formData, photo, location })
Verify complaint.ward is saved in MongoDB after submit
2.3 Remove Dead Fraud Endpoint Call
In complaints.js line 285: remove or stub the http://localhost:8000/submit-complaint call (that endpoint was in legacy, now deleted)
Either skip fraud check entirely or wire to actual ML service endpoint in app.py
2.4 MapView — Multiple Pins
Rewrite MapView.jsx: replace single-center iframe embed with actual @react-google-maps/api GoogleMap + Marker per complaint
Use complaint location.lat / location.lng for each pin
Test: submit 3 complaints, confirm 3 pins on map
Exit criteria: Citizen can submit complaint with real location + ward, see it on a multi-pin map, track its status.

Phase 3 — Auth & OTP (Days 8–10)
Currently OTP is hardcoded to 482916 for everyone.

3.1 Real OTP Flow
In auth.js: generate random 6-digit OTP per request (Math.floor(100000 + Math.random() * 900000).toString())
Store OTP + expiry (5 min) in MongoDB (add otp + otpExpiry fields to User model) or in-memory Map keyed by email
Send via email (keep Ethereal for dev, add real SMTP env vars for prod: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS)
Verify OTP on /verify-otp route, clear it after use
Add new env vars to .env.example
3.2 Token Refresh (Optional but clean)
Current JWT is 1-day expiry with no refresh — user gets logged out mid-session after 24h
Either extend to 7 days or add a /refresh-token endpoint with httpOnly cookie
Exit criteria: Each user gets unique OTP, it expires, wrong OTPs rejected.

Phase 4 — Role Dashboards (Days 11–18)
Field worker, officer, commissioner all have backend routes but UI may not wire correctly.

4.1 Field Worker Dashboard
Verify assigned complaints load correctly
GPS geo-fence check on resolution (Haversine, 500m) — test that it rejects resolution from wrong location
Photo upload on resolution — verify it saves and citizen can see it
Real-time complaint_updated_<userId> socket event fires to citizen on resolve
4.2 Officer Dashboard
Complaint list filtered by ward + department
Manual escalation controls work
Reassign to field worker works
SLA breach alerts show (socket sla_breach event) — now that SLA engine is wired (Phase 1.2)
4.3 Commissioner Dashboard
City-wide stats accurate (counts by status, department, ward)
Department head assignment works
Escalation level 3 complaints surfaced correctly
4.4 Admin Dashboard
User CRUD (create field_worker, officer accounts) works end-to-end
Ward management: add/edit/delete wards, verify poly coords save to MongoDB
Analytics: complaint volume by category, resolution rate, SLA breach rate — verify numbers match DB
Exit criteria: Each role can log in and perform their primary function without errors.

Phase 5 — AI Pipeline (Days 19–24)
3-tier classifier needs all tiers verified independently.

5.1 ML Service Health
Start backend/ml-service/app.py, confirm /health returns 200
Test /analyze-complaint endpoint directly with curl
Emotion model (j-hartmann/emotion-english-distilroberta-base) downloads on first run — may need HF_HOME env var for cache path in deployment
5.2 Gemini Integration
Add real GEMINI_API_KEY to backend .env (get from aistudio.google.com)
Test complaint classification: submit complaint → check DB that category + priority are set by AI (not empty)
Verify fallback chain: ML down → Gemini → keyword scoring
5.3 AI Summarizer in Submit Form
Verify the "Generate AI Summary" button in SubmitComplaintSection calls ML service and populates description field
Handle ML service being down gracefully (don't block submit)
5.4 Duplicate Detection
Submit same complaint twice within 48h, 400m apart — should get "duplicate" response
Submit same complaint 600m apart — should go through
Exit criteria: Every complaint gets AI-assigned category + priority. Duplicates blocked.

Phase 6 — Real-Time & Notifications (Days 25–28)
Socket.IO wired but untested end-to-end.

6.1 Socket Events End-to-End
new_complaint_processed — officer sees new complaint appear without refresh
sla_breach — officer/commissioner gets alert badge
complaint_updated_<userId> — citizen sees status change in real-time
6.2 In-App Notification UI
Confirm notification bell / toast component exists and triggers on socket events
Test across two browser tabs (citizen + officer)
Exit criteria: Status changes appear in real-time without page refresh.

Phase 7 — Deployment (Days 29–35)
Get everything live on Vercel + Railway (or Render).

7.1 Backend Deploy (Railway / Render)
Deploy backend/api as Node service
Set all env vars in Railway dashboard:
MONGO_URI (Atlas URL)
JWT_SECRET (generated random string)
ML_SERVICE_URL (Railway ML service URL)
GEMINI_API_KEY
PORT=5000
Verify /api/health returns 200 on deployed URL
7.2 ML Service Deploy
Deploy backend/ml-service as Python service on Railway
Set ML_PORT=8000
Note: first boot slow (model download ~500MB) — may need Railway's persistent storage or pre-built Docker image
7.3 Frontend Deploy (Vercel)
Set env vars in Vercel Project Settings:
VITE_API_URL = deployed backend URL
VITE_ML_URL = deployed ML URL
VITE_GOOGLE_MAPS_API_KEY = real key
Confirm frontend/vercel.json rewrites are in place (Phase 1.3)
Deploy — test login, submit, map, all dashboards on live URL
7.4 MongoDB Atlas Setup
Whitelist Railway/Render IPs in Atlas Network Access (or use 0.0.0.0/0 for hackathon)
Run createAdmin.js once against Atlas to seed admin user + ward data
Confirm 35 wards are seeded
Exit criteria: https://amravati-hackgen-x.vercel.app/ fully functional — every route works, no localhost references, no 404s.

Phase 8 — Polish & Edge Cases (Days 36–45)
Everything works, now make it robust.

 Form validation: required fields, file size limits on photo upload, lat/lng bounds check
 Loading states on every API call (no silent failures)
 Error messages user-facing (not just console.error)
 Session expiry: redirect to login on 401, not silent fail
 Mobile responsive: test all dashboards on 375px width
 Image compression before upload (complaints with photos currently upload raw — could be 5MB+)
 Rate limiting on auth routes (prevent OTP brute force)
 CORS: lock backend/api/server.js CORS origin to Vercel domain, not *
 Input sanitization on complaint description (XSS)
Priority Order Summary
Week	Focus	Unblocks
Week 1	Phase 1: server boot + env + hardcoded URLs	Everything
Week 1	Phase 2: complaint submit + map + ward	Core citizen flow
Week 2	Phase 3: real OTP	Auth security
Week 2–3	Phase 4: role dashboards	All staff features
Week 3	Phase 5: AI pipeline	Classifier, duplicates
Week 4	Phase 6: real-time	Live updates
Week 4–5	Phase 7: deployment	Live site
Week 5–6	Phase 8: polish	Production quality
Start with Phase 1 — nothing else can be tested until the server boots and auth works without hardcoded URLs. Want me to start executing Phase 1 now?


Phase 9 — Security Hardening (Days 46–52)
9.1 Auth Security
Move JWT from localStorage to httpOnly cookie (prevents XSS token theft)
Add /api/auth/refresh endpoint with rotating refresh tokens
Add /api/auth/forgot-password + /api/auth/reset-password with signed reset link (10min expiry)
Rate limit auth routes: 5 failed logins → 15min lockout (use express-rate-limit)
Hash OTPs before storing in DB (don't store plaintext)
9.2 Real Email (Replace Ethereal)
Add Resend or SendGrid (free tier: 100 emails/day)
New env vars: SMTP_PROVIDER, SMTP_API_KEY, EMAIL_FROM
OTP email, welcome email, password reset email all through real provider
Test deliverability to Gmail, Outlook
9.3 Input Security
Sanitize all complaint text fields with dompurify or xss package (XSS)
Validate file uploads: type whitelist (jpg/png/webp only), size cap 5MB, scan filename
Mongoose schema: add maxlength to all string fields
Parameterize any raw MongoDB queries (injection prevention)
9.4 API Security
Lock CORS to Vercel domain only
Add helmet middleware to Express (sets security headers)
Add express-mongo-sanitize (prevents NoSQL injection via $where etc.)
Remove all console.log that print request bodies (credential leakage)
Exit criteria: OWASP Top 10 covered. Pen test the auth flow manually.

Phase 10 — Reliability & Resilience (Days 53–58)
10.1 Job Queue for SLA Engine
Replace setInterval in slaEscalation.js with BullMQ + Redis
SLA check becomes a recurring job: survives server restarts, deployable across multiple instances
Add Railway Redis instance (free tier available)
New env var: REDIS_URL
10.2 ML Service Resilience
Circuit breaker around ML service calls: if 3 consecutive failures → skip ML, use Gemini/keyword only, alert via log
Health check endpoint polled by backend before each ML call
Timeout: ML calls cap at 8s (currently no timeout set)
10.3 File Upload Resilience
Move complaint photo uploads from local disk / base64 to Cloudinary or AWS S3
Local disk storage is wiped on every Railway/Render deploy
New env vars: CLOUDINARY_URL or AWS_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_KEY
Return CDN URL, store in complaint document
10.4 Database
Enable Atlas auto-backup (daily snapshots, 7-day retention)
Add MongoDB indexes: complaints collection on userId, ward, status, createdAt, location (2dsphere for geo queries)
Add connection pool config: maxPoolSize=10 in Mongoose connect options
Exit criteria: Server restart doesn't lose jobs. Photos survive redeploy. DB can be restored from backup.

Phase 11 — Observability (Days 59–63)
11.1 Structured Logging
Add pino or winston to backend
Log every request (method, path, status, duration), every error with stack trace
Log ML classification results, SLA breach events, socket events
Ship logs to Railway's built-in log drain or Logtail (free tier)
11.2 Error Tracking
Add @sentry/node to backend, @sentry/react to frontend
Every unhandled exception and Promise rejection captured automatically
Source maps uploaded so Sentry shows real line numbers
New env var: SENTRY_DSN for both frontend and backend
11.3 Uptime Monitoring
Add UptimeRobot (free): ping /api/health every 5 min
Alert to email on downtime
Add /api/health endpoint that checks MongoDB connection + ML service reachability and returns JSON status
11.4 Performance
Add compression middleware to Express (gzip all responses)
Frontend: run vite build --mode production, verify bundle size < 500KB gzipped
Add React.lazy + Suspense for dashboard route code-splitting
Lighthouse audit: target 90+ Performance score
Exit criteria: You can see what broke, when, and why — without SSH access.

Phase 12 — Scale & Infrastructure (Days 64–70)
12.1 Socket.IO Multi-Instance
Add @socket.io/redis-adapter (uses the Redis from Phase 10)
Now you can run 2+ backend instances and sockets work across all of them
Test: connect citizen on instance 1, officer on instance 2, status update propagates
12.2 Docker ML Service
Write Dockerfile for backend/ml-service that pre-downloads the emotion model at build time
Eliminates 2–3 min cold start on every deploy
Push to Docker Hub or Railway's container registry
New env var: HF_HOME=/app/models (cache path inside container)
12.3 CDN & Caching
Serve frontend from Vercel Edge Network (already done via Vercel deploy)
Add Cache-Control headers on static assets
Add Redis caching for expensive DB queries: city-wide stats (commissioner dashboard), ward list (seeded, never changes)
Cache TTL: stats = 5 min, ward list = 1 hour
12.4 CI/CD Pipeline
Add GitHub Actions: on push to main → run ESLint + tests → deploy to Vercel + Railway automatically
Separate staging environment (staging branch → staging Vercel + Railway project)
Never deploy broken code to production again
Exit criteria: Zero-downtime deploys. Site handles 500 concurrent users.

Complete Timeline
Phase	Days	What It Fixes
1	1–3	Server boots, auth works on Vercel
2	4–7	Complaint submit, map, ward
3	8–10	Real OTP
4	11–18	All role dashboards
5	19–24	AI pipeline
6	25–28	Real-time sockets
7	29–35	Live deployment
8	36–45	Polish, edge cases
9	46–52	Security hardening
10	53–58	Reliability, S3, job queue
11	59–63	Logging, Sentry, uptime
12	64–70	Scale, Docker ML, CI/CD
After Phase 12 — Fully Production Ready
Concern	Status
Auth security (XSS, brute force, reset)	✅
Real email delivery	✅
File storage (survives redeploys)	✅
SLA engine survives restarts	✅
ML service cold start eliminated	✅
Error visibility (Sentry, logs)	✅
Uptime monitoring	✅
Multi-instance sockets	✅
Automated deploys	✅
DB backups	✅
Total: ~70 days (10 weeks) from now → genuine municipal-grade deployment.