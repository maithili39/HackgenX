import pytest
from fastapi.testclient import TestClient
from main import app
from database import Base, engine, SessionLocal, ComplaintStatus, ComplaintCategory
from core.config import settings

# Set up test database
settings.DATABASE_URL = "sqlite:///./test_complaint_system.db"
Base.metadata.create_all(bind=engine)

client = TestClient(app)

def test_submit_genuine_complaint():
    response = client.post(
        "/submit-complaint",
        data={
            "user_id": "user_123",
            "category": "GARBAGE",
            "text": "There is a large pile of uncollected garbage near the central park entrance. It smells bad and is attracting strays. Please clean it.",
            "gps_lat": 12.9716,
            "gps_long": 77.5946
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["user_id"] == "user_123"
    assert data["category"] == "GARBAGE"
    # A genuine user with non-spam text should hopefully be APPROVED
    assert data["status"] in ["APPROVED", "SUSPICIOUS"]
    
def test_submit_spam_complaint():
    response = client.post(
        "/submit-complaint",
        data={
            "user_id": "user_spammer",
            "category": "OTHER",
            "text": "Buy real estate fast! www.scam-site.com idiot sdf",
            "gps_lat": 0.0,
            "gps_long": 0.0
        }
    )
    
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "REJECTED" # Should trigger multiple rules (abuse, url, short/irrelevant)
    
    # Check analysis reasons
    analysis_res = client.get(f"/analyze-complaint/{data['id']}")
    analysis_data = analysis_res.json()
    flagged_logs = [log for log in analysis_data["reasons"] if log["flagged"]]
    assert len(flagged_logs) > 0

def test_manual_review_override():
    # Submit something that gets rejected
    response = client.post(
        "/submit-complaint",
        data={
            "user_id": "user_override",
            "category": "GARBAGE",
            "text": "asdasdsadsad", # Very short, repeated characters -> REJECTED
            "gps_lat": 10.0,
            "gps_long": 10.0
        }
    )
    comp_id = response.json()["id"]
    
    # Override
    rev_res = client.post(
        f"/review-complaint/{comp_id}",
        json={
            "override_status": "APPROVED",
            "admin_notes": "Looked fine to me actually"
        }
    )
    
    assert rev_res.status_code == 200
    assert rev_res.json()["status"] == "APPROVED"
