import { useState, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { GoogleMap, Marker, Autocomplete, useJsApiLoader } from '@react-google-maps/api';
import { MapPin, Navigation, Search, X, Loader2 } from 'lucide-react';

// ── API Key ──────────────────────────────────────────────────────────────────
// Set VITE_GOOGLE_MAPS_API_KEY in your .env file, or replace the string below.
const GOOGLE_MAPS_API_KEY =
    import.meta.env.VITE_GOOGLE_MAPS_API_KEY;

const LIBRARIES = ['places'];

const MAP_CONTAINER_STYLE = {
    width: '100%',
    height: '260px',
    borderRadius: '10px',
    overflow: 'hidden',
};

// Default center: Pune, India
const DEFAULT_CENTER = { lat: 18.5204, lng: 73.8567 };

// Dark map style matching app theme
const DARK_MAP_STYLES = [
    { elementType: 'geometry', stylers: [{ color: '#1d2c4d' }] },
    { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
    { elementType: 'labels.text.stroke', stylers: [{ color: '#1a3646' }] },
    { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ color: '#4b6878' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#304a7d' }] },
    { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#98a5be' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#2c6675' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0e1626' }] },
    { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#4e6d70' }] },
    { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
];

/**
 * LocationPicker
 * Props:
 *   location         – current { lat, lng, address } or null
 *   onLocationChange – callback(newLocation | null)
 */
export default function LocationPicker({ location, onLocationChange }) {
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    const [marker, setMarker] = useState(
        location ? { lat: location.lat, lng: location.lng } : null
    );
    const [center, setCenter] = useState(
        location ? { lat: location.lat, lng: location.lng } : DEFAULT_CENTER
    );
    const [isGeocoding, setIsGeocoding] = useState(false);
    const [isFetchingGPS, setIsFetchingGPS] = useState(false);
    const autocompleteRef = useRef(null);

    // ── Reverse geocode lat/lng → formatted address ─────────────────────────
    const reverseGeocode = useCallback(async (lat, lng) => {
        setIsGeocoding(true);
        try {
            const res = await fetch(
                `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${GOOGLE_MAPS_API_KEY}`
            );
            const data = await res.json();
            const address =
                data.results?.[0]?.formatted_address ||
                `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
            onLocationChange({ lat, lng, address });
        } catch {
            onLocationChange({ lat, lng, address: `${lat.toFixed(6)}, ${lng.toFixed(6)}` });
        } finally {
            setIsGeocoding(false);
        }
    }, [onLocationChange]);

    // ── Click anywhere on map to drop a pin ────────────────────────────────
    const handleMapClick = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
    }, [reverseGeocode]);

    // ── Drag marker to re-pin ──────────────────────────────────────────────
    const handleMarkerDragEnd = useCallback((e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        setMarker({ lat, lng });
        reverseGeocode(lat, lng);
    }, [reverseGeocode]);

    // ── Auto-fetch device GPS ──────────────────────────────────────────────
    const handleAutoFetchGPS = () => {
        setIsFetchingGPS(true);
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            setIsFetchingGPS(false);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setMarker({ lat, lng });
                setCenter({ lat, lng });
                reverseGeocode(lat, lng);
                setIsFetchingGPS(false);
            },
            () => {
                // Permission denied or error — fall back to default city
                const { lat, lng } = DEFAULT_CENTER;
                setMarker({ lat, lng });
                setCenter({ lat, lng });
                reverseGeocode(lat, lng);
                setIsFetchingGPS(false);
            },
            { enableHighAccuracy: true, timeout: 8000 }
        );
    };

    // ── Places Autocomplete selection ──────────────────────────────────────
    const handlePlaceSelect = () => {
        if (!autocompleteRef.current) return;
        const place = autocompleteRef.current.getPlace();
        if (!place?.geometry?.location) return;
        const lat = place.geometry.location.lat();
        const lng = place.geometry.location.lng();
        setMarker({ lat, lng });
        setCenter({ lat, lng });
        onLocationChange({
            lat,
            lng,
            address: place.formatted_address || place.name || `${lat.toFixed(6)}, ${lng.toFixed(6)}`,
        });
    };

    // ── Clear location ─────────────────────────────────────────────────────
    const handleClear = () => {
        setMarker(null);
        onLocationChange(null);
    };

    // ── Error / Loading states ─────────────────────────────────────────────
    if (loadError) {
        return (
            <div style={{
                height: 260, display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', gap: '0.5rem',
                background: 'rgba(239,68,68,0.06)', borderRadius: 10,
                border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', fontSize: '0.85rem',
            }}>
                <MapPin size={28} />
                <p style={{ margin: 0, fontWeight: 600 }}>Google Maps failed to load</p>
                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Check your API key in <code>.env</code> → <code>VITE_GOOGLE_MAPS_API_KEY</code>
                </p>
            </div>
        );
    }

    if (!isLoaded) {
        return (
            <div style={{
                height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: '0.6rem', color: 'var(--text-muted)', background: 'var(--bg-page)',
                borderRadius: 10, border: '1px solid var(--border-color)',
            }}>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Loading Google Maps…
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>

            {/* ── Controls row ── */}
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>

                {/* Places search autocomplete */}
                <Autocomplete
                    onLoad={(ac) => (autocompleteRef.current = ac)}
                    onPlaceChanged={handlePlaceSelect}
                    fields={['geometry', 'formatted_address', 'name']}
                >
                    <div style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                        <Search size={14} style={{
                            position: 'absolute', left: '0.65rem', top: '50%',
                            transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none',
                        }} />
                        <input
                            type="text"
                            className="input-base"
                            placeholder="Search address or landmark…"
                            style={{ paddingLeft: '2rem', fontSize: '0.84rem', height: '38px' }}
                        />
                    </div>
                </Autocomplete>

                {/* Auto GPS */}
                <button
                    type="button"
                    onClick={handleAutoFetchGPS}
                    disabled={isFetchingGPS}
                    title="Fetch your current GPS location"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                        padding: '0 0.9rem', height: '38px',
                        background: '#4285F4', color: 'white',
                        border: 'none', borderRadius: 8,
                        cursor: isFetchingGPS ? 'wait' : 'pointer',
                        fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap',
                        opacity: isFetchingGPS ? 0.7 : 1,
                        boxShadow: '0 2px 8px rgba(66,133,244,0.35)',
                    }}
                >
                    {isFetchingGPS
                        ? <><Loader2 size={13} style={{ animation: 'spin 1s linear infinite' }} /> Fetching…</>
                        : <><Navigation size={13} /> Auto GPS</>}
                </button>

                {/* Clear */}
                {location && (
                    <button
                        type="button"
                        onClick={handleClear}
                        title="Clear location"
                        style={{
                            display: 'flex', alignItems: 'center', gap: '0.3rem',
                            padding: '0 0.75rem', height: '38px',
                            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                            border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8,
                            fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer',
                        }}
                    >
                        <X size={13} /> Clear
                    </button>
                )}
            </div>

            {/* ── Google Map ── */}
            <GoogleMap
                mapContainerStyle={MAP_CONTAINER_STYLE}
                center={center}
                zoom={marker ? 15 : 12}
                onClick={handleMapClick}
                options={{
                    streetViewControl: false,
                    mapTypeControl: false,
                    fullscreenControl: true,
                    zoomControlOptions: { position: 9 /* RIGHT_BOTTOM */ },
                    styles: DARK_MAP_STYLES,
                }}
            >
                {marker && (
                    <Marker
                        position={marker}
                        draggable
                        onDragEnd={handleMarkerDragEnd}
                        animation={window.google?.maps?.Animation?.DROP}
                    />
                )}
            </GoogleMap>

            {/* ── Address info bar ── */}
            {location ? (
                <div
                    className="animate-fade-in"
                    style={{
                        display: 'flex', alignItems: 'center', gap: '0.6rem',
                        padding: '0.6rem 0.9rem',
                        background: 'rgba(2,132,199,0.08)',
                        border: '1px solid rgba(2,132,199,0.25)',
                        borderRadius: 8,
                    }}
                >
                    {isGeocoding
                        ? <Loader2 size={16} color="#0284c7" style={{ flexShrink: 0, animation: 'spin 1s linear infinite' }} />
                        : <MapPin size={16} color="#0284c7" style={{ flexShrink: 0 }} />}
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{
                            fontSize: '0.82rem', fontWeight: 600, color: '#0284c7',
                            margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                        }}>
                            {isGeocoding ? 'Resolving address…' : location.address}
                        </p>
                        <p style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)', margin: '0.1rem 0 0' }}>
                            {location.lat?.toFixed(6)}°N, {location.lng?.toFixed(6)}°E
                        </p>
                    </div>
                    <span style={{
                        padding: '0.25rem 0.65rem',
                        background: 'rgba(16,185,129,0.12)',
                        color: '#10b981',
                        borderRadius: 100,
                        fontSize: '0.72rem', fontWeight: 700, flexShrink: 0,
                    }}>
                        GPS ✓
                    </span>
                </div>
            ) : (
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                    📍 Click on the map · drag the pin · search · or tap
                    <strong style={{ color: '#4285F4' }}> Auto GPS</strong>
                </p>
            )}

            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
    );
}

LocationPicker.propTypes = {
    location: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
        address: PropTypes.string,
    }),
    onLocationChange: PropTypes.func.isRequired,
};

LocationPicker.defaultProps = {
    location: null,
};
