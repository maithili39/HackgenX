# AI Complaint Engine - HackGenX

The AI Complaint Engine is a comprehensive civic-tech platform built for HackGenX. It automates the categorization, assignment, and tracking of citizen complaints using a sophisticated microservice architecture consisting of a React Single Page Application (SPA), a Node.js API, and a dedicated Python Machine Learning service.

## Key Features

* **Citizen Empowerment:** Easily report issues with photo evidence and geolocation. Track the live status and Service Level Agreement (SLA) deadlines.
* **AI Auto-Triage:** Automatically categorizes complaints into respective departments (e.g., Water, Roads, Electricity), assesses risk levels, and analyzes citizen sentiment using a DistilBERT ML model and Gemini.
* **Smart Assignment:** Auto-routes complaints to the least-burdened field worker within the correct ward and department to optimize resource allocation.
* **Geo-Fenced Resolution:** Field workers can only mark a complaint as resolved if their GPS coordinates match the original complaint location within a stringent 500-meter radius, ensuring accountability.
* **SLA Escalation Engine:** A resilient BullMQ-powered background worker continuously monitors deadlines and automatically escalates breaches to higher authorities.
* **Real-time Updates:** Utilizes WebSockets (Socket.io) to deliver live notifications and bidirectional updates across all connected dashboards.
* **Role-Based Access Control (RBAC) Dashboards:** Dedicated and secure views tailored for Citizens, System Administrators, Field Workers, Ward Officers, and the Municipal Commissioner.

---

## System Architecture

```mermaid
graph TD
    subgraph Client [Frontend Layer]
        A[React SPA Vite] -->|Axios HTTPS| B
        A -->|Socket.io WSS| B
    end

    subgraph Backend [API Layer]
        B[Node.js / Express API]
        B -->|BullMQ| Q[(Redis Queue)]
        Q -->|Job Worker| S[SLA Engine]
        S --> B
    end

    subgraph AI [Machine Learning Layer]
        B -->|REST| M[Python FastAPI Service]
        M -->|DistilBERT Model| M
        B -->|Fallback| G[Gemini API]
    end

    subgraph Data [Storage Layer]
        B -->|Mongoose| DB[(MongoDB)]
        B -->|Uploads| C[(Cloudinary CDN)]
    end
```

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, React Router, Socket.io-client, Recharts, Google Maps API
- **Backend:** Node.js, Express, MongoDB (Mongoose), Redis (BullMQ), Socket.io, Pino, Sentry
- **Machine Learning Service:** Python, FastAPI, HuggingFace Transformers (DistilBERT)
- **Infrastructure:** Docker, Docker Compose, Nginx

---

## Local Setup (Docker)

The recommended approach to run the entire application stack is via Docker Compose.

1. **Clone the repository.**
2. **Set up Environment Variables.**
   Create a `.env` file inside `backend/api/` with the following variables:
   ```env
   MONGO_URI=mongodb://mongodb:27017/civicsense
   REDIS_URL=redis://redis:6379
   FRONTEND_URL=http://localhost:3000
   PORT=5000
   JWT_SECRET=your_super_secret_key
   GEMINI_API_KEY=your_gemini_key
   CLOUDINARY_URL=cloudinary://your_key:your_secret@your_cloud_name
   ML_SERVICE_URL=http://ml-service:8000
   ```
3. **Run Docker Compose:**
   ```bash
   docker-compose up --build
   ```
4. **Access the application:**
   - Frontend: `http://localhost:3000`
   - Backend API: `http://localhost:5000`

---

## Deployment

This repository is configured for modern cloud deployments:

- **Frontend (React/Vite):** Deployed on [Vercel](https://vercel.com/)
- **Backend API (Node.js):** Deployed on [Render](https://render.com/)
- **Machine Learning Engine (Python/FastAPI):** Hosted on [Hugging Face Spaces](https://huggingface.co/) for dedicated AI compute.
- **Database & Cache:** Uses MongoDB Atlas and Upstash Redis.

---

## Security Measures

- **Authentication:** Enforces `httpOnly` secure cookies for JSON Web Tokens (JWT) to mitigate XSS attacks.
- **Data Integrity:** Employs `express-mongo-sanitize` to prevent NoSQL injection. Configures secure HTTP headers via `helmet`.
- **Rate Limiting:** Implements IP-based rate limiting on sensitive routes (e.g., login, register) to protect against brute-force attacks.
- **Circuit Breakers:** The backend gracefully falls back to a deterministic keyword mapping strategy in the event the AI service experiences downtime.

---

## Contribution Guidelines

This project was initially developed during the HackGenX hackathon. Future maintainers must ensure they execute `npm run lint` prior to committing code and utilize the repository issue tracker for feature requests and bug reporting.
