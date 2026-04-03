from geopy.distance import geodesic
from sentence_transformers import SentenceTransformer, util
from sqlalchemy.orm import Session
from datetime import datetime, timezone, timedelta
from database import Complaint, ImageHash
from core.config import settings

class DuplicateDetector:
    def __init__(self):
        # Using a small, fast sentence transformer model
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def check_duplicate(self, db: Session, target_complaint: dict, phash: str = None) -> dict:
        """
        Checks if the target complaint is a duplicate.
        target_complaint should have: category, gps_lat, gps_long, text, timestamp
        """
        reasons = []
        score = 0
        is_duplicate = False
        
        # 1. Fetch recent complaints of the same category
        time_threshold = target_complaint['timestamp'] - timedelta(hours=settings.DUPLICATE_TIME_WINDOW_HOURS)
        recent_complaints = db.query(Complaint).filter(
            Complaint.category == target_complaint['category'],
            Complaint.timestamp >= time_threshold
        ).all()
        
        if not recent_complaints:
            return {"is_flagged": False, "score": 0, "reasons": []}
            
        # Target embedding
        target_emb = self.model.encode(target_complaint['text'])
        target_coords = (target_complaint['gps_lat'], target_complaint['gps_long'])
        
        for comp in recent_complaints:
            comp_coords = (comp.gps_lat, comp.gps_long)
            dist = geodesic(target_coords, comp_coords).meters
            
            if dist <= settings.DUPLICATE_DISTANCE_THRESHOLD_METERS:
                # Close geographically, check text similarity
                comp_emb = self.model.encode(comp.text)
                sim = util.cos_sim(target_emb, comp_emb).item()
                
                if sim >= settings.TEXT_SIMILARITY_THRESHOLD:
                    is_duplicate = True
                    reasons.append(f"High probability duplicate of {comp.id} (distance: {dist:.1f}m, text sim: {sim:.2f}).")
                    score = max(score, min(int(sim * 100), 100)) # e.g. 90%
                elif phash and comp.image_hash and comp.image_hash.phash:
                    # Same location, check if exact same image used
                    from imagehash import hex_to_hash
                    # A difference of 0-5 implies similar/identical image
                    if hex_to_hash(phash) - hex_to_hash(comp.image_hash.phash) <= 3:
                        is_duplicate = True
                        reasons.append(f"Same image and location as {comp.id}.")
                        score = 100
        
        return {
            "is_flagged": is_duplicate,
            "score": score,
            "reasons": reasons
        }
