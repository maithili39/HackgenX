from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum
from sqlalchemy.orm import declarative_base, sessionmaker, relationship
from sqlalchemy.sql import func
import enum
from core.config import settings

# Setup Database Engine
engine = create_engine(
    settings.DATABASE_URL, 
    connect_args={"check_same_thread": False} if settings.DATABASE_URL.startswith("sqlite") else {}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# Enums
class ComplaintStatus(str, enum.Enum):
    APPROVED = "APPROVED"
    SUSPICIOUS = "SUSPICIOUS"
    REJECTED = "REJECTED"

class ComplaintCategory(str, enum.Enum):
    GARBAGE = "GARBAGE"
    POTHOLE = "POTHOLE"
    STREETLIGHT = "STREETLIGHT"
    WATER = "WATER"
    OTHER = "OTHER"

# Models
class UserTrustScore(Base):
    __tablename__ = "user_trust_scores"

    user_id = Column(String, primary_key=True, index=True)
    trust_score = Column(Float, default=100.0)
    total_complaints = Column(Integer, default=0)
    fake_complaints = Column(Integer, default=0)
    
    complaints = relationship("Complaint", back_populates="user")

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("user_trust_scores.user_id"))
    category = Column(Enum(ComplaintCategory), nullable=False)
    text = Column(Text, nullable=False)
    gps_lat = Column(Float, nullable=False)
    gps_long = Column(Float, nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Analysis Results
    status = Column(Enum(ComplaintStatus), default=ComplaintStatus.SUSPICIOUS)
    risk_score = Column(Float, default=0.0)
    
    user = relationship("UserTrustScore", back_populates="complaints")
    image_hash = relationship("ImageHash", back_populates="complaint", uselist=False)
    audit_logs = relationship("AuditLog", back_populates="complaint")

class ImageHash(Base):
    __tablename__ = "image_hashes"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"), unique=True)
    phash = Column(String, index=True, nullable=True)
    ahash = Column(String, index=True, nullable=True)
    exif_gps_lat = Column(Float, nullable=True)
    exif_gps_long = Column(Float, nullable=True)
    exif_timestamp = Column(DateTime(timezone=True), nullable=True)
    
    complaint = relationship("Complaint", back_populates="image_hash")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    complaint_id = Column(String, ForeignKey("complaints.id"))
    module_name = Column(String, nullable=False)
    flagged = Column(Integer, default=0) # 1 for flagged, 0 for clear
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    complaint = relationship("Complaint", back_populates="audit_logs")

# Dependency for FastAPI
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
