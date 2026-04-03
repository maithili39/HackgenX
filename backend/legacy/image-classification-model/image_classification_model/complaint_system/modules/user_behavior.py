from sqlalchemy.orm import Session
from database import UserTrustScore

class UserBehaviorAnalyzer:
    def __init__(self):
        pass
        
    def analyze_user(self, db: Session, user_id: str) -> dict:
        """
        Retrieves user interaction history and outputs a risk modifier score.
        A low trust score increases the risk of the current complaint.
        """
        user = db.query(UserTrustScore).filter(UserTrustScore.user_id == user_id).first()
        
        if not user:
            # New user, neutral risk
            return {"is_flagged": False, "score": 0, "reasons": []}
            
        if user.total_complaints > 0:
            fake_ratio = user.fake_complaints / user.total_complaints
        else:
            fake_ratio = 0.0
            
        # Example trust score logic (0-100 base)
        # Trust score < 40 is bad
        reasons = []
        score = 0
        is_flagged = False
        
        if user.trust_score < 40:
            reasons.append(f"Low user trust score ({user.trust_score:.1f}).")
            score += (40 - user.trust_score) # Max +40 risk
            is_flagged = True
            
        if fake_ratio > 0.3 and user.total_complaints > 3:
            reasons.append(f"High historical fake ratio ({fake_ratio*100:.1f}%).")
            score += int(fake_ratio * 50)
            is_flagged = True
            
        return {
            "is_flagged": is_flagged,
            "score": min(score, 100),
            "reasons": reasons
        }
