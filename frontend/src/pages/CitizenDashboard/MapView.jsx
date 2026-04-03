import { useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Map, Layers, ZoomIn } from 'lucide-react';

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

export default function MapView() {
    const { token } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showHeatmap, setShowHeatmap] = useState(false);
    const [filterStatus, setFilterStatus] = useState('All');

    useEffect(() => {
        if (!token) return;
        axios.get('http://localhost:5000/api/complaints/nearby', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => setComplaints(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token]);

    const withLocation = complaints.filter(c => c.location?.lat && c.location?.lng);
    const filtered = filterStatus === 'All' ? withLocation : withLocation.filter(c => {
        if (filterStatus === 'Resolved') return ['Resolved', 'Closed'].includes(c.status);
        if (filterStatus === 'In Progress') return ['Assigned', 'In Progress', 'Submitted', 'Under Review'].includes(c.status);
        if (filterStatus === 'Escalated') return c.status === 'Rejected' || c.slaBreached;
        return true;
    });

    // Build Google Maps Embed URL with multiple markers
    const buildMapUrl = () => {
        if (filtered.length === 0) {
            return `https://maps.google.com/maps?q=India&z=5&output=embed`;
        }
        // Center on first complaint
        const center = filtered[0];
        return `https://maps.google.com/maps?q=${center.location.lat},${center.location.lng}&z=13&output=embed`;
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {['All', 'Resolved', 'In Progress', 'Escalated'].map(s => (
                        <button key={s} onClick={() => setFilterStatus(s)}
                            style={{
                                padding: '0.4rem 0.9rem', borderRadius: 100, border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                background: filterStatus === s ? '#0284c7' : 'var(--bg-panel)', color: filterStatus === s ? 'white' : 'var(--text-secondary)',
                                boxShadow: filterStatus === s ? '0 2px 8px rgba(2,132,199,0.3)' : 'var(--shadow-sm)', border: '1px solid var(--border-color)'
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
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden', borderRadius: 14, position: 'relative' }}>
                    {loading && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.8)', zIndex: 5 }}>
                            <p style={{ color: 'var(--text-muted)' }}>Loading map data…</p>
                        </div>
                    )}
                    <iframe
                        title="complaint-map"
                        width="100%" height="480"
                        style={{ border: 'none', display: 'block' }}
                        src={buildMapUrl()}
                        allowFullScreen
                    />
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
                    <iframe
                        title="selected-map"
                        width="100%" height="220"
                        style={{ border: 'none', borderRadius: 10, display: 'block', marginBottom: '0.75rem' }}
                        src={`https://maps.google.com/maps?q=${selected.location.lat},${selected.location.lng}&z=16&output=embed`}
                    />
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
        </div>
    );
}
