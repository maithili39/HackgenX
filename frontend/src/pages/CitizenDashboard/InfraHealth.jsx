import { useState, useEffect, useContext } from 'react';
import api from '../../api/axios.js';
import { AuthContext } from '../../context/AuthContext';
import { Activity, TrendingUp, TrendingDown, Info } from 'lucide-react';

// Generate a simulated ward score based on complaint data
function calcWardScore(complaints) {
    if (!complaints.length) return { score: 85, change: 0, reasons: [] };
    const total = complaints.length;
    const resolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const escalated = complaints.filter(c => c.slaBreached || c.escalationLevel > 0).length;
    const critical = complaints.filter(c => c.riskLevel === 'Critical').length;

    let score = 100;
    score -= (total - resolved) * 5; // unresolved drag
    score -= escalated * 8;           // escalated drag
    score -= critical * 10;           // critical drag
    score += resolved * 3;            // resolved boost
    score = Math.max(0, Math.min(100, Math.round(score)));

    const reasons = [];
    if (critical > 0) reasons.push({ text: `${critical} critical complaint${critical > 1 ? 's' : ''} unresolved`, color: '#ef4444' });
    if (escalated > 0) reasons.push({ text: `${escalated} SLA breach${escalated > 1 ? 'es' : ''} impacting score`, color: '#f59e0b' });
    if (resolved > 0) reasons.push({ text: `${resolved} resolved complaint${resolved > 1 ? 's' : ''} boosted score`, color: '#10b981' });

    return { score, change: resolved > 0 ? +3 : -5, reasons };
}

function GaugeArc({ score }) {
    const pct = score / 100;
    const radius = 70;
    const cx = 90; const cy = 90;
    const startAngle = Math.PI; // 180deg
    const endAngle = 0;         // 0deg
    const arcLength = Math.PI * radius;
    const dashOffset = arcLength * (1 - pct);

    const color = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';

    // Pointer
    const angle = Math.PI - pct * Math.PI;
    const px = cx + radius * Math.cos(angle);
    const py = cy - radius * Math.sin(angle);

    return (
        <svg width="180" height="100" viewBox="0 0 180 100">
            {/* Background arc */}
            <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none" stroke="#e2e8f0" strokeWidth="14" strokeLinecap="round" />
            {/* Score arc */}
            <path
                d={`M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`}
                fill="none" stroke={color} strokeWidth="14" strokeLinecap="round"
                strokeDasharray={arcLength} strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 1.2s ease, stroke 0.5s ease' }} />
            {/* Pointer dot */}
            <circle cx={px} cy={py} r={6} fill={color} />
            {/* Score text */}
            <text x={cx} y={cy - 10} textAnchor="middle" fontSize="28" fontWeight="700" fill={color}>{score}</text>
            <text x={cx} y={cy + 8} textAnchor="middle" fontSize="11" fill="#94a3b8">/100</text>
        </svg>
    );
}

export default function InfraHealth() {
    const { user } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [ward, setWard] = useState('');
    const [loading, setLoading] = useState(true);
    const [tooltip, setTooltip] = useState(null);

    useEffect(() => {
        if (!user) return;
        Promise.all([
            api.get(`/api/complaints/my-complaints`),
            api.get(`/api/auth/me`),
        ]).then(([cRes, uRes]) => {
            setComplaints(cRes.data);
            setWard(uRes.data.ward || 'Your Ward');
        }).catch(() => { }).finally(() => setLoading(false));
    }, []);

    const { score, change, reasons } = calcWardScore(complaints);
    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const scoreBg = score >= 70 ? 'rgba(16,185,129,0.08)' : score >= 40 ? 'rgba(245,158,11,0.08)' : 'rgba(239,68,68,0.08)';
    const scoreLabel = score >= 70 ? 'Good' : score >= 40 ? 'Needs Attention' : 'Critical';

    // Department health breakdown
    const deptGroups = complaints.reduce((acc, c) => {
        const dept = c.department || 'Other';
        if (!acc[dept]) acc[dept] = { total: 0, resolved: 0 };
        acc[dept].total++;
        if (['Resolved', 'Closed'].includes(c.status)) acc[dept].resolved++;
        return acc;
    }, {});

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Main Health Card */}
            <div className="glass-panel" style={{ padding: '2rem', position: 'relative', overflow: 'hidden', background: scoreBg, borderColor: `${scoreColor}30` }}>
                <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: scoreColor, opacity: 0.07 }} />
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
                    {/* Gauge */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <GaugeArc score={score} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
                            {change >= 0 ? <TrendingUp size={14} color="#10b981" /> : <TrendingDown size={14} color="#ef4444" />}
                            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: change >= 0 ? '#10b981' : '#ef4444' }}>
                                {change >= 0 ? '+' : ''}{change} pts this week
                            </span>
                        </div>
                    </div>

                    {/* Details */}
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                            <Activity size={22} color={scoreColor} />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 700 }}>Ward Infrastructure Health</h2>
                        </div>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '0.5rem' }}>
                            {ward} · Infrastructure Score
                        </p>
                        <div style={{ display: 'inline-flex', alignItems: 'center', padding: '0.3rem 0.75rem', borderRadius: 100, background: scoreColor + '15', color: scoreColor, fontWeight: 700, fontSize: '0.82rem', marginBottom: '1.25rem' }}>
                            {scoreLabel}
                        </div>

                        {/* Reasons */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {reasons.length === 0 && (
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>No complaints filed yet. Score reflects clean record.</p>
                            )}
                            {reasons.map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem' }}>
                                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
                                    <span style={{ color: r.color, fontWeight: 500 }}>{r.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* What affects the score? */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Info size={16} color="#0284c7" /> How is this score calculated?
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                    {[
                        { label: 'Resolved Complaints', impact: '+3 pts each', color: '#10b981' },
                        { label: 'Unresolved Complaints', impact: '-5 pts each', color: '#f59e0b' },
                        { label: 'SLA Breaches', impact: '-8 pts each', color: '#ef4444' },
                        { label: 'Critical Issues', impact: '-10 pts each', color: '#7c3aed' },
                    ].map(item => (
                        <div key={item.label} style={{ padding: '0.75rem', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>{item.label}</p>
                            <p style={{ fontWeight: 700, color: item.color, fontSize: '0.88rem' }}>{item.impact}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Department breakdown */}
            {Object.keys(deptGroups).length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>📊 Department Health Breakdown</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {Object.entries(deptGroups).map(([dept, data]) => {
                            const rate = data.total > 0 ? Math.round((data.resolved / data.total) * 100) : 0;
                            const col = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';
                            return (
                                <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ width: 100, fontSize: '0.78rem', color: 'var(--text-secondary)', fontWeight: 500, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dept}</span>
                                    <div style={{ flex: 1, height: 8, background: '#e2e8f0', borderRadius: 100 }}>
                                        <div style={{ width: `${rate}%`, height: '100%', background: col, borderRadius: 100, transition: 'width 1s ease' }} />
                                    </div>
                                    <span style={{ width: 40, textAlign: 'right', fontSize: '0.75rem', fontWeight: 700, color: col }}>{rate}%</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{data.resolved}/{data.total}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
