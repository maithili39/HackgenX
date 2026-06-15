# CivicSense

**AI / WEB**

An AI-powered grievance portal designed to streamline civic issue reporting and resolution with intelligent categorization and automated routing.

[**Live Demo**](https://civicsense-bice.vercel.app/) | [**Source Code**](https://github.com/maithili39/HackgenX)

## Tech Stack 🛠️
![React](https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![NodeJS](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB)
![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-black?style=for-the-badge&logo=socket.io&badgeColor=010101)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![PyTorch](https://img.shields.io/badge/PyTorch-%23EE4C2C.svg?style=for-the-badge&logo=PyTorch&logoColor=white)
![HuggingFace](https://img.shields.io/badge/%F0%9F%A4%97_Hugging_Face-FFD21E?style=for-the-badge&logoColor=black)
![DistilBERT](https://img.shields.io/badge/DistilBERT-AI-blue?style=for-the-badge)

## Features ✨
- **Zero-Shot AI Classification:** Automatically routes complaints to the correct department (Water, Roads, Waste, etc.) using a DistilBERT ML model.
- **Sentiment & Risk Analysis:** Analyzes the emotional tone of complaints and flags high-risk issues for immediate escalation.
- **Real-Time Dashboards:** 5 distinct dashboards (Citizen, Officer, Field Worker, Admin, Commissioner) connected via Socket.io for live updates.
- **SLA Tracking:** Automatically detects and alerts administrators when a complaint resolution exceeds its Service Level Agreement (SLA).

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
