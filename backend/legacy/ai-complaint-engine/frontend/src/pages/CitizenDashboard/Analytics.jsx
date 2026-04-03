import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import {
    LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, Clock, AlertCircle, BarChart2 } from 'lucide-react';

const DEPT_COLORS = {
    'Electricity': '#f59e0b', 'Water Supply': '#3b82f6', 'Roads': '#6b7280',
    'Sanitation': '#10b981', 'Public Works': '#8b5cf6', 'Billing': '#ef4444',
    'Tech Support': '#0ea5e9', 'N/A': '#94a3b8', 'Other': '#94a3b8'
};

function InsightCard({ icon: Icon, title, value, subtitle, color }) {
    const [hovered, setHovered] = useState(false);
    return (
        <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{
                padding: '1.25rem', background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                borderRadius: 14, transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)',
                transform: hovered ? 'translateY(-3px)' : 'none',
                boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.09)' : 'var(--shadow-sm)'
            }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: `${color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon size={18} color={color} />
                </div>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
            </div>
            <p style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>{value}</p>
            {subtitle && <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>{subtitle}</p>}
        </div>
    );
}

export default function Analytics() {
    const { token } = useContext(AuthContext);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!token) return;
        axios.get('http://localhost:5000/api/complaints/citizen-stats', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => setStats(r.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, [token]);

    if (loading) return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300, color: 'var(--text-muted)' }}>
            <p>Loading analytics…</p>
        </div>
    );

    if (!stats || stats.total === 0) return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 300, gap: '0.75rem', color: 'var(--text-muted)' }}>
            <BarChart2 size={48} style={{ opacity: 0.3 }} />
            <p>Submit your first complaint to see analytics!</p>
        </div>
    );

    const categoryData = Object.entries(stats.categoryCounts || {}).map(([name, value]) => ({ name, value }));
    const trendData = stats.monthlyTrend || [];

    // Resolution rate
    const resolutionRate = stats.total > 0 ? Math.round((stats.resolved / stats.total) * 100) : 0;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Insight cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                <InsightCard icon={TrendingUp} title="Resolution Rate" value={`${resolutionRate}%`} subtitle="Complaints resolved" color="#10b981" />
                <InsightCard icon={Clock} title="Avg Resolution" value={stats.avgResolutionHours ? `${stats.avgResolutionHours}h` : 'N/A'} subtitle="Average hours" color="#0284c7" />
                <InsightCard icon={AlertCircle} title="Top Category" value={stats.topCategory} subtitle="Most reported" color="#f59e0b" />
                <InsightCard icon={BarChart2} title="Escalated" value={stats.escalated} subtitle="SLA breached" color="#ef4444" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '1.5rem' }}>
                {/* Monthly Trend Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <TrendingUp size={16} color="#0284c7" /> Monthly Complaint Trend
                    </h3>
                    {trendData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <LineChart data={trendData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: '0.8rem' }} />
                                <Line type="monotone" dataKey="count" stroke="#0284c7" strokeWidth={2.5}
                                    dot={{ fill: '#0284c7', r: 4 }} activeDot={{ r: 6 }} name="Complaints" />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No trend data yet
                        </div>
                    )}
                </div>

                {/* Category Pie Chart */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <BarChart2 size={16} color="#8b5cf6" /> Category Breakdown
                    </h3>
                    {categoryData.length > 0 ? (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie data={categoryData} cx="50%" cy="50%" innerRadius={55} outerRadius={80}
                                    paddingAngle={3} dataKey="value" nameKey="name">
                                    {categoryData.map((entry) => (
                                        <Cell key={entry.name} fill={DEPT_COLORS[entry.name] || '#94a3b8'} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: '0.75rem', color: '#475569' }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                            No data yet
                        </div>
                    )}
                </div>
            </div>

            {/* Bar Chart - Status distribution */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    📊 Status Distribution
                </h3>
                <ResponsiveContainer width="100%" height={160}>
                    <BarChart margin={{ top: 5, right: 20, left: -10, bottom: 5 }} data={[
                        { name: 'Total', count: stats.total, fill: '#0284c7' },
                        { name: 'In Progress', count: stats.inProgress, fill: '#f59e0b' },
                        { name: 'Resolved', count: stats.resolved, fill: '#10b981' },
                        { name: 'Escalated', count: stats.escalated, fill: '#ef4444' },
                    ]}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} allowDecimals={false} />
                        <Tooltip contentStyle={{ borderRadius: 8, fontSize: '0.8rem' }} />
                        <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                            {[{ f: '#0284c7' }, { f: '#f59e0b' }, { f: '#10b981' }, { f: '#ef4444' }].map((e, i) => (
                                <Cell key={i} fill={e.f} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
