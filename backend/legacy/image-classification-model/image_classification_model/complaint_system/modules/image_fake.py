from PIL import Image, ExifTags
import imagehash
from io import BytesIO

class ImageFakeDetector:
    def __init__(self):
        pass

    def get_exif_data(self, image: Image.Image) -> dict:
        """Extracts EXIF metadata from the image, converting keys to strings."""
        exif_data = {}
        info = image.getexif()
        if info:
            for tag, value in info.items():
                decoded = ExifTags.TAGS.get(tag, tag)
                exif_data[decoded] = value
                
            # Need to get GPSInfo from IFD
            if hasattr(info, 'get_ifd'):
                gps_info = info.get_ifd(ExifTags.IFD.GPSInfo)
                if gps_info:
                    gps_data = {}
                    for t, v in gps_info.items():
                        dec = ExifTags.GPSTAGS.get(t, t)
                        gps_data[dec] = v
                    exif_data['GPSInfo'] = gps_data
        return exif_data

    def _convert_to_degrees(self, value):
        d = float(value[0])
        m = float(value[1])
        s = float(value[2])
        return d + (m / 60.0) + (s / 3600.0)

    def extract_gps(self, exif_data: dict):
        """Converts EXIF GPSInfo into decimal latitude and longitude."""
        if 'GPSInfo' not in exif_data:
            return None, None
            
        gps_info = exif_data['GPSInfo']
        
        try:
            # Check for required GPS tags
            if 'GPSLatitude' in gps_info and 'GPSLatitudeRef' in gps_info \
               and 'GPSLongitude' in gps_info and 'GPSLongitudeRef' in gps_info:
                
                lat = self._convert_to_degrees(gps_info['GPSLatitude'])
                if gps_info['GPSLatitudeRef'] != 'N':
                    lat = -lat
                    
                lon = self._convert_to_degrees(gps_info['GPSLongitude'])
                if gps_info['GPSLongitudeRef'] != 'E':
                    lon = -lon
                    
                return lat, lon
        except Exception:
            return None, None
            
        return None, None

    def analyze(self, image_bytes: bytes) -> dict:
        """
        Analyzes the image to calculate hashes and extract EXIF info.
        """
        try:
            img = Image.open(BytesIO(image_bytes))
            
            # Calculate hashes
            phash = str(imagehash.phash(img))
            ahash = str(imagehash.average_hash(img))
            
            # Extract EXIF
            exif_data = self.get_exif_data(img)
            lat, lon = self.extract_gps(exif_data)
            timestamp = exif_data.get('DateTimeOriginal') or exif_data.get('DateTime')
            
            return {
                "success": True,
                "phash": phash,
                "ahash": ahash,
                "exif_lat": lat,
                "exif_long": lon,
                "exif_timestamp": timestamp
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
