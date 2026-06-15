import { useState, useEffect, useRef, useContext } from 'react';
import api from '../../api/axios.js';
import { AuthContext } from '../../context/AuthContext';
import { Map, Layers, ZoomIn, Loader2 } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const STATUS_PIN_COLORS = {
    Submitted: '#3b82f6', 'Under Review': '#f59e0b', Assigned: '#8b5cf6',
    'In Progress': '#0ea5e9', Resolved: '#10b981', Closed: '#059669', Rejected: '#ef4444'
};

const LEGEND = [
    { label: 'Resolved / Closed', color: '#10b981' },
    { label: 'In Progress / Assigned', color: '#f59e0b' },
    { label: 'Escalated / Rejected', color: '#ef4444' },
    { label: 'Submitted / Under Review', color: '#3b82f6' },
];

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
const LIBRARIES = ['places'];

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

export default function MapView() {
    const { user } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    const mapRef = useRef(null);

    const { isLoaded, loadError } = useJsApiLoader({
        id: 'google-map-script',
        googleMapsApiKey: GOOGLE_MAPS_API_KEY,
        libraries: LIBRARIES,
    });

    useEffect(() => {
        if (!user) return;
        api.get(`/api/complaints/nearby`).then(r => setComplaints(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [user]);

    const withLocation = complaints.filter(c => c.location?.lat && c.location?.lng);
    const filtered = filterStatus === 'All' ? withLocation : withLocation.filter(c => {
        if (filterStatus === 'Resolved') return ['Resolved', 'Closed'].includes(c.status);
        if (filterStatus === 'In Progress') return ['Assigned', 'In Progress', 'Submitted', 'Under Review'].includes(c.status);
        if (filterStatus === 'Escalated') return c.status === 'Rejected' || c.slaBreached;
        return true;
    });

    const fitToComplaints = (map, pins) => {
        if (!map || pins.length === 0) return false;
        const bounds = new window.google.maps.LatLngBounds();
        pins.forEach(c => bounds.extend({ lat: c.location.lat, lng: c.location.lng }));
        map.fitBounds(bounds);
        if (pins.length === 1) map.setZoom(15);
        return true;
    };

    const handleMapLoad = (map) => {
        mapRef.current = map;
        // If complaints already loaded by the time the map mounts, fit to them immediately.
        // Otherwise the re-fit useEffect below will handle it once complaints arrive.
        const pins = complaints.filter(c => c.location?.lat && c.location?.lng);
        if (fitToComplaints(map, pins)) return;

        // No complaints yet — center on user location while API call is in-flight
        const fallbackToIp = () => {
            fetch('https://ipapi.co/json/')
                .then(r => r.json())
                .then(data => {
                    if (data.latitude && data.longitude) {
                        map.panTo({ lat: data.latitude, lng: data.longitude });
                        map.setZoom(12);
                    }
                })
                .catch(() => {});
        };

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    map.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    map.setZoom(13);
                },
                () => fallbackToIp(),
                { timeout: 5000 }
            );
        } else {
            fallbackToIp();
        }
    };

    // Re-fit map bounds whenever complaints finish loading
    useEffect(() => {
        if (!mapRef.current || !isLoaded) return;
        const pins = complaints.filter(c => c.location?.lat && c.location?.lng);
        fitToComplaints(mapRef.current, pins);
    }, [complaints, isLoaded]);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['All', 'Resolved', 'In Progress', 'Escalated'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            style={{
                                 padding: '0.4rem 0.9rem', borderRadius: 100, cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                 background: filterStatus === s ? '#0284c7' : 'var(--bg-panel)', color: filterStatus === s ? 'white' : 'var(--text-secondary)',
                                 boxShadow: filterStatus === s ? '0 2px 8px rgba(2,132,199,0.3)' : 'var(--shadow-sm)', border: filterStatus === s ? 'none' : '1px solid var(--border-color)'
                            }}>
                            {s}
                        </button>
                    ))}
                </div>
                <button onClick={() => setShowHeatmap(h => !h)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.9rem', borderRadius: 100, border: '1px solid var(--border-color)', background: showHeatmap ? '#f59e0b' : 'var(--bg-panel)', color: showHeatmap ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s' }}>
                    <Layers size={14} /> {showHeatmap ? 'Hide Density' : 'Show Density'}
                </button>
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {filtered.length} pins on map
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 320px' : '1fr', gap: '1rem', alignItems: 'start' }}>
                {/* Map */}
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, position: 'relative', height: 480 }}>
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 5 }}>
                            <p style={{ color: 'var(--text-muted)' }}>Loading map data…</p>
                        </div>
                    )}
                    
                    {loadError ? (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'rgba(239,68,68,0.06)', color: '#ef4444' }}>
                            <p>Google Maps failed to load. Check API Key.</p>
                        </div>
                    ) : !isLoaded ? (
                        <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-page)', color: 'var(--text-muted)' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    ) : (
                        <GoogleMap
                            mapContainerStyle={{ width: '100%', height: '100%' }}
                            center={{ lat: 18.5204, lng: 73.8567 }}
                            zoom={5}
                            onLoad={handleMapLoad}
                            options={{
                                streetViewControl: false,
                                mapTypeControl: false,
                                fullscreenControl: true,
                                styles: DARK_MAP_STYLES,
                            }}
                        >
                            {filtered.map(c => (
                                <Marker
                                    key={c._id}
                                    position={{ lat: c.location.lat, lng: c.location.lng }}
                                    onClick={() => setSelected(c)}
                                />
                            ))}
                        </GoogleMap>
                    )}

                    {/* Overlay complaint points as badges */}
                    <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: '0.4rem', pointerEvents: 'none' }}>
                        {LEGEND.map(l => (
                            <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(4px)', padding: '3px 8px', borderRadius: 100, fontSize: '0.68rem', fontWeight: 500 }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: l.color, boxShadow: `0 0 5px ${l.color}` }} />
                                {l.label}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Complaint list for selection */}
                {!selected && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {withLocation.slice(0, 8).map(c => {
                            const col = STATUS_PIN_COLORS[c.status] || '#94a3b8';
                            return (
                                <div key={c._id} onClick={() => setSelected(c)}
                                    style={{ padding: '0.75rem 1rem', background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 10, cursor: 'pointer', transition: 'all 0.2s', boxShadow: 'var(--shadow-sm)' }}
                                    onMouseEnter={e => { e.currentTarget.style.borderColor = col; e.currentTarget.style.transform = 'translateX(2px)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-color)'; e.currentTarget.style.transform = 'none'; }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                        <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#0284c7', fontWeight: 600 }}>{c.complaintId}</span>
                                        <span style={{ fontSize: '0.65rem', padding: '1px 7px', borderRadius: 100, background: `${col}15`, color: col, fontWeight: 600 }}>{c.status}</span>
                                    </div>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.department} · {c.description?.slice(0, 45)}…</p>
                                    <p style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                                        📍 {c.location?.address || `${c.location?.lat?.toFixed(4)}, ${c.location?.lng?.toFixed(4)}`}
                                    </p>
                                </div>
                            );
                        })}
                        {withLocation.length === 0 && !loading && (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                <Map size={32} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                                No complaints with GPS coordinates found.
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Selected complaint preview */}
            {selected && (
                <div className="glass-panel animate-slide-in" style={{ padding: '1.25rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <div>
                            <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#0284c7', fontWeight: 700 }}>{selected.complaintId}</p>
                            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>{selected.department} · {selected.riskLevel} Risk</p>
                        </div>
                        <button onClick={() => setSelected(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '1.1rem' }}>✕</button>
                    </div>
                    
                    {isLoaded ? (
                        <div style={{ width: '100%', height: 220, borderRadius: 10, overflow: 'hidden', marginBottom: '0.75rem' }}>
                            <GoogleMap
                                mapContainerStyle={{ width: '100%', height: '100%' }}
                                center={{ lat: selected.location.lat, lng: selected.location.lng }}
                                zoom={16}
                                options={{
                                    streetViewControl: false,
                                    mapTypeControl: false,
                                    fullscreenControl: false,
                                    styles: DARK_MAP_STYLES,
                                }}
                            >
                                <Marker position={{ lat: selected.location.lat, lng: selected.location.lng }} />
                            </GoogleMap>
                        </div>
                    ) : (
                        <div style={{ width: '100%', height: 220, borderRadius: 10, background: 'var(--bg-page)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
                        </div>
                    )}
                    
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.description}</p>
                    <a href={`https://www.google.com/maps?q=${selected.location.lat},${selected.location.lng}`}
                        target="_blank" rel="noopener noreferrer"
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.75rem', fontSize: '0.78rem', color: '#0284c7', textDecoration: 'none' }}>
                        <ZoomIn size={13} /> Open in Google Maps
                    </a>
                </div>
            )}

            {/* Density heatmap hint */}
            {showHeatmap && (
                <div className="glass-panel animate-fade-in" style={{ padding: '1.25rem', background: 'rgba(245,158,11,0.04)', borderColor: 'rgba(245,158,11,0.2)' }}>
                    <h4 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: '#92400e' }}>🌡 Complaint Density by Category</h4>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                        {Object.entries(
                            withLocation.reduce((acc, c) => { acc[c.department || 'Other'] = (acc[c.department || 'Other'] || 0) + 1; return acc; }, {})
                        ).sort((a, b) => b[1] - a[1]).map(([dept, count]) => (
                            <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'white', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: '0.8rem' }}>
                                <div style={{ width: Math.min(count * 8, 32), height: 8, borderRadius: 4, background: '#f59e0b' }} />
                                <span style={{ fontWeight: 600 }}>{dept}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{count}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
    );
}
