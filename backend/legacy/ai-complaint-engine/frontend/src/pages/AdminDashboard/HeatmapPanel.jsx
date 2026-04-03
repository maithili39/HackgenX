import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Map } from 'lucide-react';

const PRIORITY_COLORS = {
    P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#10b981', Pending: '#94a3b8'
};

// Simple SVG-based map visualisation (no external lib needed)
// Shows complaint dots positioned on a simplified India map canvas
export default function HeatmapPanel() {
    const [points, setPoints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [hover, setHover] = useState(null);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        axios.get('http://localhost:5000/api/complaints/heatmap', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(res => {
            setPoints(res.data);
        }).catch(e => console.error(e))
            .finally(() => setLoading(false));
    }, [token]);

    // Map lat/lng to SVG coordinate space
    // India bounding: lat 8–37, lng 68–98
    const LAT_MIN = 8, LAT_MAX = 37, LNG_MIN = 68, LNG_MAX = 98;
    const W = 500, H = 320;
    const toSvg = (lat, lng) => ({
        x: ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W,
        y: H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * H
    });

    const byPriority = {
        P0: points.filter(p => p.priority === 'P0').length,
        P1: points.filter(p => p.priority === 'P1').length,
        P2: points.filter(p => p.priority === 'P2').length,
        P3: points.filter(p => p.priority === 'P3').length,
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div className="flex-row justify-between" style={{ marginBottom: '1.25rem' }}>
                <h3 className="flex-row gap-2" style={{ fontSize: '1rem' }}>
                    <Map size={18} color="var(--accent-primary)" /> Complaint Heatmap
                </h3>
                <div className="flex-row gap-3">
                    {Object.entries(PRIORITY_COLORS).filter(([k]) => k !== 'Pending').map(([p, c]) => (
                        <div key={p} className="flex-row gap-1" style={{ fontSize: '0.75rem' }}>
                            <div style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                            <span style={{ color: 'var(--text-muted)' }}>{p} ({byPriority[p] || 0})</span>
                        </div>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ height: H, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                    Loading map data...
                </div>
            ) : (
                <div style={{ position: 'relative', background: '#f0f4ff', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block' }}>
                        {/* Simple India outline backdrop */}
                        <rect width={W} height={H} fill="#e8eef8" />
                        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#c8d4e8" fontSize="14" fontWeight="600" opacity="0.5">India – Complaint Map</text>

                        {/* Grid lines */}
                        {[0.25, 0.5, 0.75].map(v => (
                            <g key={v}>
                                <line x1={W * v} y1={0} x2={W * v} y2={H} stroke="#d1daea" strokeWidth="1" strokeDasharray="4,4" />
                                <line x1={0} y1={H * v} x2={W} y2={H * v} stroke="#d1daea" strokeWidth="1" strokeDasharray="4,4" />
                            </g>
                        ))}

                        {/* Complaint dots */}
                        {points.map((p, i) => {
                            if (!p.location?.lat || !p.location?.lng) return null;
                            const { x, y } = toSvg(p.location.lat, p.location.lng);
                            const color = PRIORITY_COLORS[p.priority] || '#94a3b8';
                            return (
                                <g key={i}>
                                    {/* Pulse ring */}
                                    {p.priority === 'P0' && (
                                        <circle cx={x} cy={y} r={14} fill={color} opacity={0.15} />
                                    )}
                                    <circle
                                        cx={x} cy={y}
                                        r={p.priority === 'P0' ? 8 : p.priority === 'P1' ? 6 : 5}
                                        fill={color}
                                        opacity={0.85}
                                        stroke="white"
                                        strokeWidth={1.5}
                                        style={{ cursor: 'pointer' }}
                                        onMouseEnter={() => setHover({ ...p, x, y })}
                                        onMouseLeave={() => setHover(null)}
                                    />
                                </g>
                            );
                        })}

                        {/* Hover Tooltip */}
                        {hover && (
                            <g>
                                <rect x={Math.min(hover.x + 10, W - 180)} y={Math.max(hover.y - 55, 5)} width={170} height={50} rx={6} fill="white" stroke="#e2e8f0" strokeWidth={1} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.1))" />
                                <text x={Math.min(hover.x + 18, W - 172)} y={Math.max(hover.y - 35, 22)} fontSize={10} fill="#64748b">{hover.department} · {hover.priority}</text>
                                <text x={Math.min(hover.x + 18, W - 172)} y={Math.max(hover.y - 20, 37)} fontSize={10} fill="#0f172a" fontWeight="600">{hover.status}</text>
                                <text x={Math.min(hover.x + 18, W - 172)} y={Math.max(hover.y - 8, 49)} fontSize={9} fill="#94a3b8">
                                    {hover.location?.lat?.toFixed(3)}, {hover.location?.lng?.toFixed(3)}
                                </text>
                            </g>
                        )}
                    </svg>

                    {points.filter(p => p.location?.lat).length === 0 && (
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            No geo-located complaints yet
                        </div>
                    )}
                </div>
            )}

            <div className="flex-row justify-between" style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                <span>{points.filter(p => p.location?.lat).length} mapped complaints</span>
                <span>{points.filter(p => p.status !== 'Closed').length} active</span>
            </div>
        </div>
    );
}
