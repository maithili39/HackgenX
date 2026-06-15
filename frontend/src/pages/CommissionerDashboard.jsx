import { useState, useEffect, useContext } from 'react';
import api from '../api/axios.js';
import { toast } from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import { AuthContext } from '../context/AuthContext';
import { Crown, AlertTriangle, TrendingUp, Star, ChevronUp, ChevronDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function CommissionerDashboard() {
    const [deptStats, setDeptStats] = useState([]);
    const [slaAlerts, setSlaAlerts] = useState([]);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useContext(AuthContext);

    const fetchStats = async () => {
        try {
            const [statsRes, allRes] = await Promise.all([
                api.get(`/api/complaints/stats/departments`),
                api.get(`/api/complaints/all`)
            ]);
            setDeptStats(statsRes.data);
            const all = allRes.data;
            setComplaints(all);
            setSlaAlerts(all.filter(c => c.slaBreached).slice(0, 10));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };


    useEffect(() => {
        fetchStats();
    }, []);

    useSocket({
        'sla_breach': (alert) => {
            setSlaAlerts(prev => [alert, ...prev.slice(0, 9)]);
            toast.error(`⚠️ SLA Breach: Complaint ${alert.complaintId} by ${alert.department}`, { position: 'top-right' });
        },
        'new_complaint_processed': fetchStats
    });

    const totalComplaints = complaints.length;
    const totalResolved = complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length;
    const overallRate = totalComplaints > 0 ? Math.round((totalResolved / totalComplaints) * 100) : 0;
    const totalSlaBreaches = complaints.filter(c => c.slaBreached).length;
    const criticalCount = complaints.filter(c => c.priority === 'P0').length;

    const DEPT_COLORS = ['#10b981', '#3b82f6', '#7c3aed', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

    return (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 0' }}>
            {/* Header */}
            <div className="flex-row justify-between animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div className="flex-row gap-4">
                    <div style={{ padding: '0.75rem', background: 'rgba(220,38,38,0.1)', borderRadius: '50%' }}>
                        <Crown size={28} color="#dc2626" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem' }}>Commissioner Overview</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>National-level grievance intelligence · {user?.name}</p>
                    </div>
                </div>
                <div style={{ padding: '0.5rem 1.25rem', background: 'rgba(220,38,38,0.1)', color: '#dc2626', borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem' }}>
                    Live Monitor
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Complaints', value: totalComplaints, color: '#3b82f6', sub: 'All time' },
                    { label: 'Resolution Rate', value: `${overallRate}%`, color: '#10b981', sub: `${totalResolved} resolved` },
                    { label: 'SLA Breaches', value: totalSlaBreaches, color: '#ef4444', sub: 'Unresolved deadline misses' },
                    { label: 'Critical (P0)', value: criticalCount, color: '#dc2626', sub: '4-hour SLA' },
                ].map(k => (
                    <div key={k.label} className="glass-panel animate-fade-in" style={{ padding: '1.5rem', borderTop: `3px solid ${k.color}` }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>{k.label}</p>
                        <p style={{ fontSize: '2.2rem', fontWeight: 700, color: k.color, marginBottom: '0.25rem' }}>{k.value}</p>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{k.sub}</p>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
                {/* Resolution Rate Bar Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Department Resolution Rates</h3>
                    {loading ? <div style={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>Loading...</div> : (
                        <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={deptStats} margin={{ left: -20 }}>
                                <XAxis dataKey="_id" tick={{ fontSize: 11 }} />
                                <YAxis tickFormatter={v => `${Math.round(v)}%`} tick={{ fontSize: 11 }} />
                                <Tooltip formatter={(v) => [`${Math.round(v)}%`, 'Resolution Rate']} />
                                <Bar dataKey="resolutionRate" radius={[4, 4, 0, 0]}>
                                    {deptStats.map((_, i) => <Cell key={i} fill={DEPT_COLORS[i % DEPT_COLORS.length]} />)}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Department Rankings Table */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Department Rankings</h3>
                    <div className="flex-col" style={{ gap: '0.6rem' }}>
                        {deptStats.slice(0, 7).map((d, i) => (
                            <div key={d._id} className="flex-row justify-between" style={{ padding: '0.6rem 0.75rem', background: i === 0 ? 'rgba(16,185,129,0.08)' : 'var(--bg-page)', borderRadius: 'var(--radius-sm)', border: `1px solid ${i === 0 ? 'rgba(16,185,129,0.3)' : 'var(--border-color)'}` }}>
                                <div className="flex-row gap-2">
                                    <span style={{ fontWeight: 700, color: i === 0 ? '#10b981' : 'var(--text-muted)', width: '20px', fontSize: '0.85rem' }}>#{i + 1}</span>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>{d._id}</p>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{d.total} total · {d.slaBreaches} SLA breach{d.slaBreaches !== 1 ? 'es' : ''}</p>
                                    </div>
                                </div>
                                <div className="flex-row gap-2">
                                    <span style={{ fontSize: '1rem', fontWeight: 700, color: d.resolutionRate >= 70 ? '#10b981' : d.resolutionRate >= 40 ? '#f59e0b' : '#ef4444' }}>
                                        {Math.round(d.resolutionRate)}%
                                    </span>
                                    {i === 0 ? <ChevronUp size={16} color="#10b981" /> : <ChevronDown size={16} color="#ef4444" />}
                                </div>
                            </div>
                        ))}
                        {deptStats.length === 0 && !loading && <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>No data yet</p>}
                    </div>
                </div>
            </div>

            {/* SLA Breach Alerts Feed */}
            <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(239,68,68,0.2)' }}>
                <div className="flex-row justify-between" style={{ marginBottom: '1.25rem' }}>
                    <h3 className="flex-row gap-2" style={{ fontSize: '1rem', color: '#dc2626' }}>
                        <AlertTriangle size={20} /> Live SLA Breach Alerts
                    </h3>
                    <div className="flex-row gap-2">
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px rgba(239,68,68,0.6)', animation: 'pulse 2s infinite' }} />
                        <span style={{ fontSize: '0.82rem', color: '#ef4444', fontWeight: 600 }}>Real-time</span>
                    </div>
                </div>
                {slaAlerts.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        <TrendingUp size={32} style={{ marginBottom: '0.75rem', opacity: 0.3 }} />
                        <p>No SLA breaches — all departments on track ✓</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '0.75rem' }}>
                        {slaAlerts.map((a, i) => (
                            <div key={a._id || i} style={{ padding: '1rem', background: 'rgba(239,68,68,0.05)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
                                <div className="flex-row justify-between" style={{ marginBottom: '0.4rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{a.complaintId}</span>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#ef4444', padding: '0.15rem 0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: '100px' }}>
                                        Escalation Level {a.escalationLevel}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-primary)', marginBottom: '0.4rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {a.description}
                                </p>
                                <div className="flex-row justify-between" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    <span>{a.department}</span>
                                    <span style={{ color: '#ef4444' }}>{a.priority}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
