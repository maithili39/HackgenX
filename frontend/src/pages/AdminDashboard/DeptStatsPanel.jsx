import { useState, useEffect, useContext } from 'react';
import api from '../../api/axios.js';
import { AuthContext } from '../../context/AuthContext';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, Clock, Building2 } from 'lucide-react';

const DEPT_COLORS = ['#10b981', '#3b82f6', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

function SLABar({ rate }) {
    const color = rate >= 70 ? '#10b981' : rate >= 40 ? '#f59e0b' : '#ef4444';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
            <div style={{ flex: 1, height: 7, background: '#e2e8f0', borderRadius: 100, overflow: 'hidden' }}>
                <div style={{ width: `${Math.round(rate)}%`, height: '100%', background: color, borderRadius: 100, transition: 'width 0.8s ease' }} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{Math.round(rate)}%</span>
        </div>
    );
}

export default function DeptStatsPanel() {
    
    const [stats, setStats] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!user) return;
        api.get(`/api/complaints/stats/departments`).then(r => setStats(r.data))
            .catch(() => setError('Failed to load department stats'))
            .finally(() => setLoading(false));
    }, []);

    const totalComplaints = stats.reduce((s, d) => s + d.total, 0);
    const totalResolved = stats.reduce((s, d) => s + d.resolved, 0);
    const totalSla = stats.reduce((s, d) => s + d.slaBreaches, 0);

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* KPI Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                {[
                    { label: 'Total Complaints', val: totalComplaints, icon: BarChart3, color: '#3b82f6' },
                    { label: 'Total Resolved', val: totalResolved, icon: CheckCircle2, color: '#10b981' },
                    { label: 'SLA Breaches', val: totalSla, icon: AlertTriangle, color: '#ef4444' },
                ].map(k => (
                    <div key={k.label} className="glass-panel" style={{ padding: '1.25rem', borderTop: `3px solid ${k.color}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</p>
                            <k.icon size={18} color={k.color} />
                        </div>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: k.color }}>{k.val}</p>
                    </div>
                ))}
            </div>

            {/* Department Table */}
            <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Building2 size={18} color="var(--accent-primary)" /> Department-wise Performance
                </h3>

                {loading && <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading stats...</div>}
                {error && <div style={{ padding: '1rem', color: '#ef4444', fontSize: '0.88rem' }}>{error}</div>}

                {!loading && stats.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    {['#', 'Department', 'Total', 'Resolved', 'Open', 'SLA Breaches', 'Resolution Rate'].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {stats.map((d, i) => (
                                    <tr key={d._id} style={{ borderBottom: '1px solid var(--border-color)', transition: 'background 0.15s' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(2,132,199,0.04)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <td style={{ padding: '0.75rem', fontWeight: 700, color: DEPT_COLORS[i % DEPT_COLORS.length], fontSize: '0.85rem' }}>#{i + 1}</td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <div style={{ width: 10, height: 10, borderRadius: '50%', background: DEPT_COLORS[i % DEPT_COLORS.length] }} />
                                                {d._id || 'Unknown'}
                                            </div>
                                        </td>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>{d.total}</td>
                                        <td style={{ padding: '0.75rem', color: '#10b981', fontWeight: 600 }}>{d.resolved}</td>
                                        <td style={{ padding: '0.75rem', color: '#f59e0b', fontWeight: 600 }}>{d.open}</td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={{ color: d.slaBreaches > 0 ? '#ef4444' : '#10b981', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                {d.slaBreaches > 0 ? <AlertTriangle size={14} /> : <CheckCircle2 size={14} />}
                                                {d.slaBreaches}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem', minWidth: 180 }}>
                                            <SLABar rate={d.resolutionRate} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
                {!loading && stats.length === 0 && !error && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <TrendingUp size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p>No department data yet. Submit complaints to populate this view.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
