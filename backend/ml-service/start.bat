@echo off
echo Starting AI Complaint ML Service on port 8000...
echo.
echo NOTE: If you have the trained dept_model/ folder, place it in this directory.
echo       Otherwise the service will use keyword-based department classification.
echo.
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
