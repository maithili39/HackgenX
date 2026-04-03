from geopy.distance import geodesic

class LocationSpoofDetector:
    def __init__(self, mismatch_threshold_meters: float = 200.0):
        self.threshold = mismatch_threshold_meters
        
    def check_spoofing(self, submitted_lat: float, submitted_long: float, 
                       exif_lat: float, exif_long: float) -> dict:
        """
        Compares submitted complaint coordinates with Image EXIF metadata coordinates.
        """
        if exif_lat is None or exif_long is None:
            return {"is_flagged": False, "score": 0, "reasons": ["No EXIF GPS info found."]}
            
        submitted_coords = (submitted_lat, submitted_long)
        exif_coords = (exif_lat, exif_long)
        
        dist = geodesic(submitted_coords, exif_coords).meters
        
        if dist > self.threshold:
            return {
                "is_flagged": True,
                "score": min(int((dist / self.threshold) * 50), 100), # Cap score based on distance ratio
                "reasons": [f"Image EXIF GPS ({exif_lat:.4f}, {exif_long:.4f}) does not match submitted location (dist: {dist:.1f}m)."]
            }
            
        return {"is_flagged": False, "score": 0, "reasons": [f"GPS coordinates match EXIF (dist: {dist:.1f}m)."]}
