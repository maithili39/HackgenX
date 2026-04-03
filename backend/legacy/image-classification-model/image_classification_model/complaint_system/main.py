
from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from datetime import datetime
import uuid
import json

from core.config import settings
from database import engine, Base, get_db, Complaint, ImageHash, AuditLog, UserTrustScore, ComplaintStatus, ComplaintCategory
from schemas import ComplaintSubmit, ComplaintResponse, ComplaintReview, ComplaintAnalysisResponse, AuditLogResponse

from modules.text_spam import TextSpamDetector
from modules.image_fake import ImageFakeDetector
from modules.duplicate_detector import DuplicateDetector
from modules.location_spoof import LocationSpoofDetector
from modules.user_behavior import UserBehaviorAnalyzer
from core.risk_engine import RiskScoringEngine

import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create Database Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title=settings.PROJECT_NAME)

# Initialize Modules
text_detector = TextSpamDetector()
image_detector = ImageFakeDetector()
duplicate_detector = DuplicateDetector()
location_detector = LocationSpoofDetector()
user_analyzer = UserBehaviorAnalyzer()
risk_engine = RiskScoringEngine()

@app.post("/submit-complaint", response_model=ComplaintResponse)
async def submit_complaint(
    user_id: str = Form(...),
    category: ComplaintCategory = Form(...),
    text: str = Form(...),
    gps_lat: float = Form(...),
    gps_long: float = Form(...),
    image: UploadFile = File(None),
    db: Session = Depends(get_db)
):
    """
    Submits a new complaint, analyzes it across all modules, calculates risk, and saves to database.
    """
    logger.info(f"Received complaint from user {user_id}")
    complaint_id = str(uuid.uuid4())
    
    module_results = {}
    audit_logs_to_add = []
    
    # 1. Image Fake Detection
    image_phash = None
    image_ahash = None
    if image:
        image_bytes = await image.read()
        img_res = image_detector.analyze(image_bytes)
        if img_res["success"]:
            image_phash = img_res["phash"]
            image_ahash = img_res["ahash"]
            
            # 2. Location Spoof Check
            loc_res = location_detector.check_spoofing(
                gps_lat, gps_long, img_res["exif_lat"], img_res["exif_long"]
            )
            module_results["location"] = loc_res
            audit_logs_to_add.append(AuditLog(
                complaint_id=complaint_id, module_name="LocationSpoof",
                flagged=int(loc_res["is_flagged"]), reason=loc_res["reasons"][0] if loc_res["reasons"] else None
            ))
            
    # 3. Text Spam Detection
    text_res = text_detector.analyze(text)
    module_results["text"] = {"score": text_res["score"]}
    for rec in text_res["reasons"]:
        audit_logs_to_add.append(AuditLog(
            complaint_id=complaint_id, module_name="TextSpam",
            flagged=int(text_res["is_flagged"]), reason=rec
        ))
        
    # 4. Duplicate Check
    target_data = {
        "category": category,
        "gps_lat": gps_lat,
        "gps_long": gps_long,
        "text": text,
        "timestamp": datetime.now()
    }
    dup_res = duplicate_detector.check_duplicate(db, target_data, image_phash)
    module_results["duplicate"] = {"score": dup_res["score"]}
    for rec in dup_res["reasons"]:
         audit_logs_to_add.append(AuditLog(
            complaint_id=complaint_id, module_name="DuplicateCheck",
            flagged=int(dup_res["is_flagged"]), reason=rec
        ))
        
    # 5. User Behavior Analysis
    user_res = user_analyzer.analyze_user(db, user_id)
    module_results["behavior"] = {"score": user_res["score"]}
    for rec in user_res["reasons"]:
         audit_logs_to_add.append(AuditLog(
            complaint_id=complaint_id, module_name="UserBehavior",
            flagged=int(user_res["is_flagged"]), reason=rec
        ))
        
    # 6. Risk Computation
    final_status, final_score = risk_engine.calculate_final_risk(module_results)
    
    # Check if user exists, else create
    user = db.query(UserTrustScore).filter(UserTrustScore.user_id == user_id).first()
    if not user:
        user = UserTrustScore(user_id=user_id, trust_score=100.0, total_complaints=0, fake_complaints=0)
        db.add(user)
    
    # Update user stats
    user.total_complaints += 1
    if final_status == ComplaintStatus.REJECTED:
        user.fake_complaints += 1
        # Decrease trust score slowly
        user.trust_score = max(0.0, user.trust_score - 10.0)
    elif final_status == ComplaintStatus.APPROVED:
        # Increase trust score slowly
        user.trust_score = min(100.0, user.trust_score + 2.0)
    
    # Save Complaint
    new_complaint = Complaint(
        id=complaint_id, user_id=user_id, category=category, text=text,
        gps_lat=gps_lat, gps_long=gps_long, status=final_status, risk_score=final_score
    )
    db.add(new_complaint)
    
    # Save Image Hash if present
    if image_phash:
        new_hash = ImageHash(
            complaint_id=complaint_id, phash=image_phash, ahash=image_ahash,
            exif_gps_lat=img_res["exif_lat"] if "exif_lat" in img_res else None,
            exif_gps_long=img_res["exif_long"] if "exif_long" in img_res else None
        )
        db.add(new_hash)
        
    # Add all audit logs
    db.add_all(audit_logs_to_add)
    
    db.commit()
    db.refresh(new_complaint)
    return new_complaint


@app.get("/analyze-complaint/{complaint_id}", response_model=ComplaintAnalysisResponse)
def analyze_complaint(complaint_id: str, db: Session = Depends(get_db)):
    """
    Returns the detailed module analysis logs for a specific complaint.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    logs = db.query(AuditLog).filter(AuditLog.complaint_id == complaint_id).all()
    
    return {
        "complaint_id": complaint.id,
        "status": complaint.status,
        "risk_score": complaint.risk_score,
        "reasons": logs
    }


@app.post("/review-complaint/{complaint_id}", response_model=ComplaintResponse)
def review_complaint(complaint_id: str, review: ComplaintReview, db: Session = Depends(get_db)):
    """
    Endpoint for admins to manually override a complaint status.
    Updates the user's trust score accordingly.
    """
    complaint = db.query(Complaint).filter(Complaint.id == complaint_id).first()
    if not complaint:
        raise HTTPException(status_code=404, detail="Complaint not found")
        
    old_status = complaint.status
    new_status = review.override_status
    
    if old_status != new_status:
        user = db.query(UserTrustScore).filter(UserTrustScore.user_id == complaint.user_id).first()
        
        # Admin overrides a rejection -> It was a false positive, restore trust
        if old_status == ComplaintStatus.REJECTED and new_status == ComplaintStatus.APPROVED:
            user.fake_complaints -= 1
            user.trust_score = min(100.0, user.trust_score + 15.0) # significant bump
            
        # Admin overrides an approval -> It was a false negative (missed spam), penalize
        elif old_status == ComplaintStatus.APPROVED and new_status == ComplaintStatus.REJECTED:
            user.fake_complaints += 1
            user.trust_score = max(0.0, user.trust_score - 20.0) # hefty penalty
            
        complaint.status = new_status
        
        # Log the manual override
        admin_log = AuditLog(
            complaint_id=complaint_id, module_name="ManualReview",
            flagged=1 if new_status == ComplaintStatus.REJECTED else 0,
            reason=f"Admin overridden to {new_status}. Notes: {review.admin_notes}"
        )
        db.add(admin_log)
        db.commit()
        db.refresh(complaint)
        
    return complaint
