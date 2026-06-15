import { useState, useEffect, useContext } from 'react';
import api from '../../api/axios.js';
import { AuthContext } from '../../context/AuthContext';
import {
    FileText, Clock, CheckCircle2, AlertTriangle, Timer, Tag,
    Search, Filter, SortAsc, MapPin, User, Layers, ChevronDown
} from 'lucide-react';

const STATUS_COLORS = {
    Submitted: { bg: 'rgba(59,130,246,0.08)', text: '#3b82f6', bar: '#3b82f6' },
    Validated: { bg: 'rgba(124,58,237,0.08)', text: '#7c3aed', bar: '#7c3aed' },
    'Under Review': { bg: 'rgba(245,158,11,0.08)', text: '#f59e0b', bar: '#f59e0b' },
    Assigned: { bg: 'rgba(139,92,246,0.08)', text: '#8b5cf6', bar: '#8b5cf6' },
    'In Progress': { bg: 'rgba(14,165,233,0.08)', text: '#0ea5e9', bar: '#0ea5e9' },
    Resolved: { bg: 'rgba(16,185,129,0.08)', text: '#10b981', bar: '#10b981' },
    Closed: { bg: 'rgba(5,150,105,0.08)', text: '#059669', bar: '#059669' },
    Rejected: { bg: 'rgba(239,68,68,0.08)', text: '#ef4444', bar: '#ef4444' },
};

const STATUS_PROGRESS = { Submitted: 10, Validated: 25, 'Under Review': 30, Assigned: 45, 'In Progress': 65, Resolved: 85, Closed: 100, Rejected: 100 };

const ESCALATION_LABELS = [
    { label: 'Normal', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { label: 'Escalated (Ward)', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { label: 'Escalated (Dept)', color: '#ef4444', bg: 'rgba(239,68,68,0.1)' },
    { label: 'Critical Escalation 🚨', color: '#dc2626', bg: 'rgba(220,38,38,0.12)' },
];

const STAT_CARDS = [
    { key: 'total', label: 'Total Filed', icon: FileText, color: '#0284c7', gradient: 'linear-gradient(135deg, #0284c7, #0ea5e9)' },
    { key: 'inProgress', label: 'In Progress', icon: Clock, color: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #fcd34d)' },
    { key: 'resolved', label: 'Resolved', icon: CheckCircle2, color: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #34d399)' },
    { key: 'escalated', label: 'Escalated', icon: AlertTriangle, color: '#ef4444', gradient: 'linear-gradient(135deg, #ef4444, #f87171)' },
    { key: 'avgResolutionHours', label: 'Avg Resolution', icon: Timer, color: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #a78bfa)', suffix: 'h' },
    { key: 'topCategory', label: 'Top Category', icon: Tag, color: '#0891b2', gradient: 'linear-gradient(135deg, #0891b2, #22d3ee)' },
];

function StatCard({ card, value }) {
    const { label, icon: Icon, gradient, color, suffix } = card;
    const [hovered, setHovered] = useState(false);
    return (
        <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
            style={{
                background: 'var(--bg-panel)', border: '1px solid var(--border-color)',
                borderRadius: 14, padding: '1.25rem 1.5rem',
                boxShadow: hovered ? '0 8px 30px rgba(0,0,0,0.1)' : 'var(--shadow-sm)',
                transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
                transition: 'all 0.25s cubic-bezier(.34,1.56,.64,1)',
                cursor: 'default', position: 'relative', overflow: 'hidden'
            }}>
            {/* background accent */}
            <div style={{ position: 'absolute', top: -20, right: -20, width: 80, height: 80, borderRadius: '50%', background: gradient, opacity: 0.08 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>{label}</p>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: gradient, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 12px ${color}33` }}>
                    <Icon size={18} color="white" />
                </div>
            </div>
            <p style={{ fontSize: typeof value === 'number' ? '2rem' : '1.2rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.1 }}>
                {value !== undefined && value !== null ? (suffix ? `${value}${suffix}` : value) : '–'}
            </p>
        </div>
    );
}

function StatusProgress({ status }) {
    const pct = STATUS_PROGRESS[status] || 0;
    const col = STATUS_COLORS[status]?.bar || '#94a3b8';
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 120 }}>
            <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 100 }}>
                <div style={{ width: `${pct}%`, height: '100%', borderRadius: 100, background: col, transition: 'width 0.6s ease' }} />
            </div>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: col, whiteSpace: 'nowrap' }}>{pct}%</span>
        </div>
    );
}

export default function Overview({ onOpenFeedback }) {
    const { user } = useContext(AuthContext);
    const [stats, setStats] = useState({});
    const [complaints, setComplaints] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState('desc');
    const [expandedRow, setExpandedRow] = useState(null);
    const [mapModal, setMapModal] = useState(null);
    const [loading, setLoading] = useState(true);



    useEffect(() => {
        if (!user) return;
        Promise.all([
            api.get(`/api/complaints/citizen-stats`),
            api.get(`/api/complaints/my-complaints`),
        ]).then(([statsRes, listRes]) => {
            setStats(statsRes.data);
            setComplaints(listRes.data);
            setFiltered(listRes.data);
        }).catch(console.error).finally(() => setLoading(false));
    }, []);

    useEffect(() => {
        let result = [...complaints];
        if (statusFilter !== 'All') result = result.filter(c => c.status === statusFilter);
        if (search.trim()) {
            const q = search.toLowerCase();
            result = result.filter(c =>
                c.complaintId?.toLowerCase().includes(q) ||
                c.description?.toLowerCase().includes(q) ||
                c.department?.toLowerCase().includes(q)
            );
        }
        result.sort((a, b) => sortOrder === 'desc'
            ? new Date(b.createdAt) - new Date(a.createdAt)
            : new Date(a.createdAt) - new Date(b.createdAt)
        );
        setFiltered(result);
    }, [search, statusFilter, sortOrder, complaints]);

    const STATUSES = ['All', 'Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'];

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {/* Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                {STAT_CARDS.map(card => (
                    <StatCard key={card.key} card={card} value={stats[card.key]} />
                ))}
            </div>

            {/* Complaint Table */}
            <div className="glass-panel" style={{ padding: '1.5rem', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>📋 My Complaints</h3>
                    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {/* Search */}
                        <div style={{ position: 'relative' }}>
                            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input className="input-base" style={{ paddingLeft: '2rem', height: 36, width: 180, fontSize: '0.82rem' }}
                                placeholder="Search ID, type..." value={search} onChange={e => setSearch(e.target.value)} />
                        </div>
                        {/* Status filter */}
                        <div style={{ position: 'relative' }}>
                            <Filter size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            <select className="input-base" style={{ paddingLeft: '2rem', height: 36, paddingRight: '1.5rem', fontSize: '0.82rem', cursor: 'pointer' }}
                                value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                                {STATUSES.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                        {/* Sort */}
                        <button onClick={() => setSortOrder(s => s === 'desc' ? 'asc' : 'desc')}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', height: 36, padding: '0 0.75rem', borderRadius: 6, border: '1px solid var(--border-color)', background: 'white', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                            <SortAsc size={14} /> {sortOrder === 'desc' ? 'Newest' : 'Oldest'}
                        </button>
                    </div>
                </div>

                {loading && <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading complaints...</div>}
                {!loading && filtered.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FileText size={40} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                        <p>No complaints found</p>
                    </div>
                )}

                {!loading && filtered.length > 0 && (
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                    {['Complaint ID', 'Issue Type', 'Department', 'Date', 'Status', 'Progress', 'Actions'].map(h => (
                                        <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((c, i) => {
                                    const sc = STATUS_COLORS[c.status] || {};
                                    const expanded = expandedRow === c._id;
                                    return (
                                        <>
                                            <tr key={c._id}
                                                style={{ borderBottom: '1px solid var(--border-color)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-page)', transition: 'background 0.15s', cursor: 'pointer' }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(2,132,199,0.04)'}
                                                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'transparent' : 'var(--bg-page)'}
                                                onClick={() => setExpandedRow(expanded ? null : c._id)}>
                                                <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--accent-primary)', fontWeight: 600, whiteSpace: 'nowrap' }}>
                                                    {c.complaintId}
                                                    {c.isDuplicate && <span style={{ marginLeft: '0.35rem', fontSize: '0.62rem', background: '#fef3c7', color: '#92400e', padding: '1px 5px', borderRadius: 4, fontFamily: 'sans-serif' }}>DUP</span>}
                                                </td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.82rem', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.riskLevel || '–'} • {c.emotion || '–'}</td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{c.department || 'Analyzing…'}</td>
                                                <td style={{ padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 100, fontSize: '0.72rem', fontWeight: 600, background: sc.bg, color: sc.text, whiteSpace: 'nowrap' }}>{c.status}</span>
                                                </td>
                                                <td style={{ padding: '0.75rem', minWidth: 120 }}><StatusProgress status={c.status} /></td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                        {c.location?.lat && (
                                                            <button onClick={e => { e.stopPropagation(); setMapModal(c); }}
                                                                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', padding: '3px 8px', borderRadius: 6, border: '1px solid #0284c7', background: 'rgba(2,132,199,0.08)', color: '#0284c7', cursor: 'pointer' }}>
                                                                <MapPin size={12} /> Map
                                                            </button>
                                                        )}
                                                        <button onClick={e => { e.stopPropagation(); setExpandedRow(expanded ? null : c._id); }}
                                                            style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.72rem', padding: '3px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'white', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                                                            <ChevronDown size={12} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            {/* Expanded row */}
                                            {expanded && (
                                                <tr key={`${c._id}-expanded`} style={{ borderBottom: '1px solid var(--border-color)', background: 'rgba(2,132,199,0.03)' }}>
                                                    <td colSpan={7} style={{ padding: '1rem 1.25rem' }}>
                                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', fontSize: '0.82rem' }}>
                                                            <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>Description</p><p>{c.description}</p></div>
                                                            <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>Officer Assigned</p>
                                                                <p style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><User size={13} />{c.assignedTo?.name || 'Not yet assigned'}</p>
                                                            </div>
                                                            <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>Priority / Risk</p>
                                                                <p><span style={{ fontWeight: 700, color: c.priority === 'P0' ? '#ef4444' : c.priority === 'P1' ? '#f59e0b' : '#0284c7' }}>{c.priority}</span> • {c.riskLevel}</p>
                                                            </div>
                                                            <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>SLA Status</p>
                                                                <p style={{ color: c.slaBreached ? '#ef4444' : '#10b981', fontWeight: 600 }}>{c.slaBreached ? '⚠ Breached' : '✓ On Track'}</p>
                                                            </div>
                                                            {c.ward && (
                                                                <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>Ward</p>
                                                                    <p style={{ fontWeight: 600, color: '#3b82f6' }}>🏘 {c.ward}</p>
                                                                </div>
                                                            )}
                                                            <div>
                                                                <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>Escalation Status</p>
                                                                {(() => {
                                                                    const lvl = c.escalationLevel || 0;
                                                                    const esc = ESCALATION_LABELS[Math.min(lvl, 3)];
                                                                    return (
                                                                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem', padding: '0.25rem 0.65rem', background: esc.bg, color: esc.color, borderRadius: 100, fontSize: '0.75rem', fontWeight: 700 }}>
                                                                            {lvl > 0 ? '⚠️' : '✓'} {esc.label}
                                                                        </span>
                                                                    );
                                                                })()}
                                                            </div>
                                                            <div><p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginBottom: '0.25rem' }}>AI Summary</p><p>{c.aiSummary || '–'}</p></div>
                                                            {c.status === 'Resolved' && c.citizenFeedback === 'pending' && (
                                                                <div style={{ gridColumn: '1/-1' }}>
                                                                    <button onClick={onOpenFeedback}
                                                                        style={{ padding: '0.5rem 1.25rem', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                                                                        ⭐ Rate Resolution
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                        {/* Photos */}
                                                        {(c.beforePhoto || c.afterPhoto) && (
                                                            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                                                                {c.beforePhoto && <div><p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Before</p><img src={c.beforePhoto} alt="before" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border-color)' }} /></div>}
                                                                {c.afterPhoto && <div><p style={{ fontSize: '0.7rem', color: '#059669', marginBottom: '0.25rem' }}>After</p><img src={c.afterPhoto} alt="after" style={{ width: 100, height: 70, objectFit: 'cover', borderRadius: 6, border: '2px solid #059669' }} /></div>}
                                                            </div>
                                                        )}
                                                    </td>
                                                </tr>
                                            )}
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
                <p style={{ marginTop: '0.75rem', fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Showing {filtered.length} of {complaints.length} complaints
                </p>
            </div>

            {/* Map Modal */}
            {mapModal && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
                    onClick={() => setMapModal(null)}>
                    <div onClick={e => e.stopPropagation()}
                        style={{ background: 'white', borderRadius: 16, overflow: 'hidden', width: '100%', maxWidth: 540, boxShadow: '0 24px 80px rgba(0,0,0,0.3)' }}>
                        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <p style={{ fontWeight: 700 }}>{mapModal.complaintId}</p>
                                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{mapModal.location?.address || `${mapModal.location?.lat?.toFixed(4)}, ${mapModal.location?.lng?.toFixed(4)}`}</p>
                            </div>
                            <button onClick={() => setMapModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '1.2rem', color: 'var(--text-muted)' }}>✕</button>
                        </div>
                        <iframe
                            title="complaint-location"
                            width="100%" height="300"
                            style={{ border: 'none', display: 'block' }}
                            src={`https://maps.google.com/maps?q=${mapModal.location.lat},${mapModal.location.lng}&z=16&output=embed`}
                        />
                        <div style={{ padding: '0.75rem 1.25rem' }}>
                            <a href={`https://www.google.com/maps?q=${mapModal.location.lat},${mapModal.location.lng}`}
                                target="_blank" rel="noopener noreferrer"
                                style={{ fontSize: '0.82rem', color: '#0284c7', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <MapPin size={14} /> Open in Google Maps
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
