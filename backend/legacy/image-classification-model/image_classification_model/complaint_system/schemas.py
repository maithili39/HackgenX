from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from database import ComplaintStatus, ComplaintCategory

# --- API Requests ---
class ComplaintSubmit(BaseModel):
    user_id: str
    category: ComplaintCategory
    text: str = Field(..., min_length=5, description="Complaint description")
    gps_lat: float
    gps_long: float
    # Note: Images will be handled via UploadFile in FastAPI, not in this schema directly.

class ComplaintReview(BaseModel):
    override_status: ComplaintStatus
    admin_notes: Optional[str] = None

# --- API Responses ---
class AuditLogResponse(BaseModel):
    module_name: str
    flagged: bool
    reason: Optional[str]
    
    class Config:
        from_attributes = True

class ComplaintAnalysisResponse(BaseModel):
    complaint_id: str
    status: ComplaintStatus
    risk_score: float
    reasons: List[AuditLogResponse]
    
    class Config:
        from_attributes = True

class ComplaintResponse(BaseModel):
    id: str
    user_id: str
    category: ComplaintCategory
    text: str
    gps_lat: float
    gps_long: float
    timestamp: datetime
    status: ComplaintStatus
    risk_score: float
    
    class Config:
        from_attributes = True
