# CivicSense 🏛️

CivicSense is an AI-powered, centralized public grievance redressal portal. It allows citizens to easily report municipal issues, and automatically routes them to the correct government department using Machine Learning.

## Features ✨
- **Zero-Shot AI Classification:** Automatically routes complaints to the correct department (Water, Roads, Waste, etc.) using a DistilBERT ML model.
- **Sentiment & Risk Analysis:** Analyzes the emotional tone of complaints and flags high-risk issues for immediate escalation.
- **Real-Time Dashboards:** 5 distinct dashboards (Citizen, Officer, Field Worker, Admin, Commissioner) connected via Socket.io for live updates.
- **SLA Tracking:** Automatically detects and alerts administrators when a complaint resolution exceeds its Service Level Agreement (SLA).

## Tech Stack 🛠️
- **Frontend:** React, Vite, Lucide Icons
- **Backend:** Node.js, Express, Socket.io
- **Machine Learning:** Python, FastAPI, Hugging Face (`typeform/distilbert-base-uncased-mnli`)
- **Database:** MongoDB

## Live Deployment 🚀
- **Frontend:** [https://civicsense-bice.vercel.app/](https://civicsense-bice.vercel.app/)
- **Backend API:** [Render](https://render.com/)
- **AI Engine:** [Hugging Face Spaces](https://huggingface.co/spaces)

## Local Setup 💻
1. Clone the repository.
2. Ensure you have MongoDB running locally or a MongoDB Atlas URI.
3. Start the ML Service:
   ```bash
   cd backend/ml-service
   pip install -r requirements.txt
   uvicorn app:app --port 8000
   ```
4. Start the Node API:
   ```bash
   cd backend/api
   npm install
   node server.js
   ```
5. Start the Frontend:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
