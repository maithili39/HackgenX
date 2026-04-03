from database import ComplaintStatus
from core.config import settings

class RiskScoringEngine:
    def __init__(self):
        pass
        
    def calculate_final_risk(self, module_results: dict) -> tuple[ComplaintStatus, float]:
        """
        Aggregates the individual module scores to compute the final risk score.
        module_results = {
            "text": {"score": 0-100},
            "duplicate": {"score": 0-100},
            "location": {"score": 0-100},
            "behavior": {"score": 0-100},
            ...
        }
        Outputs: (ComplaintStatus, Final Risk Score (0-100))
        """
        
        # Weights for each module (sum should ideally be ~1.0 but we can cap the total score)
        weights = {
            "text": 0.4,
            "duplicate": 0.8, # Duplicates are heavily penalized
            "location": 0.6,
            "behavior": 0.3
        }
        
        total_risk = 0.0
        
        for mod_name, res in module_results.items():
            if mod_name in weights and "score" in res:
                mod_score = res["score"]
                # For highly confident individual flags (e.g. 100% duplicate), we want it to bubble up
                # So we sum weighted scores, but also take the max of an individual unweighted strong signal
                total_risk += mod_score * weights[mod_name]
                
                # If any module returns a severe risk (>80), guarantee we flag it at least as suspicious
                if mod_score > 80:
                    total_risk = max(total_risk, 60.0) 
        
        # Add baseline offset or cap it
        final_score = min(total_risk, 100.0)
        
        if final_score < settings.RISK_THRESHOLD_APPROVED:
            status = ComplaintStatus.APPROVED
        elif final_score < settings.RISK_THRESHOLD_REJECTED:
            status = ComplaintStatus.SUSPICIOUS
        else:
            status = ComplaintStatus.REJECTED
            
        return status, round(final_score, 2)
