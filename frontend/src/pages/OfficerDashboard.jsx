import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import { AuthContext } from '../context/AuthContext';
import { BadgeCheck, AlertTriangle, Users, ChevronDown, Clock, MapPin, Image, ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import AuditLogPanel from '../components/AuditLogPanel';

const PRIORITY_COLORS = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#10b981', Pending: '#94a3b8' };
const STATUS_COLORS = { Submitted: '#94a3b8', Validated: '#8b5cf6', Assigned: '#3b82f6', 'In Progress': '#f59e0b', Resolved: '#10b981', Closed: '#059669', Rejected: '#ef4444', 'Under Review': '#7c3aed' };

export default function OfficerDashboard() {
    const [complaints, setComplaints] = useState([]);
    const [workers, setWorkers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [assigningTo, setAssigningTo] = useState('');
    const [assignMsg, setAssignMsg] = useState('');
    const [filter, setFilter] = useState('all');
    const [verifyNote, setVerifyNote] = useState('');
    const [verifyMsg, setVerifyMsg] = useState('');
    const [verifying, setVerifying] = useState(false);
    const { token, user } = useContext(AuthContext);

    const fetchData = async () => {
        try {
            const [cRes, wRes] = await Promise.all([
                axios.get(`${__API_BASE__}/api/complaints/all`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${__API_BASE__}/api/users/workers`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setComplaints(cRes.data);
            setWorkers(wRes.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => {
        fetchData();
        const socket = io(__API_BASE__);
        socket.on('new_complaint_processed', fetchData);
        socket.on('sla_breach', fetchData);
        return () => socket.disconnect();
    }, [token]);

    const handleAssign = async () => {
        if (!assigningTo) { setAssignMsg('Select a field worker first.'); return; }
        try {
            const res = await axios.put(
                `${__API_BASE__}/api/complaints/${selected._id}/assign`,
                { workerId: assigningTo },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setAssignMsg(`✅ Assigned to ${workers.find(w => w._id === assigningTo)?.name}`);
            setSelected(res.data.complaint);
            fetchData();
        } catch (e) {
            setAssignMsg(e.response?.data?.message || 'Assignment failed');
        }
    };

    const handleVerify = async (action) => {
        setVerifying(true);
        setVerifyMsg('');
        try {
            const res = await axios.put(
                `${__API_BASE__}/api/complaints/${selected._id}/verify`,
                { action, note: verifyNote },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setVerifyMsg(action === 'approved'
                ? '✅ Resolution approved. Complaint closed.'
                : '⚠️ Rejected. Ticket sent back to In Progress.');
            setSelected(res.data.complaint);
            fetchData();
        } catch (e) {
            setVerifyMsg(e.response?.data?.message || 'Action failed');
        } finally {
            setVerifying(false);
        }
    };

    const filtered = filter === 'all' ? complaints
        : filter === 'sla' ? complaints.filter(c => c.slaBreached)
            : complaints.filter(c => c.status === filter);

    const stats = {
        total: complaints.length,
        open: complaints.filter(c => !['Closed', 'Rejected'].includes(c.status)).length,
        sla: complaints.filter(c => c.slaBreached).length,
        resolved: complaints.filter(c => ['Resolved', 'Closed'].includes(c.status)).length
    };

    return (
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 0' }}>
            {/* Header */}
            <div className="flex-row justify-between animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div className="flex-row gap-4">
                    <div style={{ padding: '0.75rem', background: 'rgba(124,58,237,0.1)', borderRadius: '50%' }}>
                        <BadgeCheck size={28} color="#7c3aed" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem' }}>Officer Dashboard</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>{user?.name} · {user?.department} Department</p>
                    </div>
                </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total Complaints', value: stats.total, color: '#3b82f6' },
                    { label: 'Open Cases', value: stats.open, color: '#f59e0b' },
                    { label: 'SLA Breaches', value: stats.sla, color: '#ef4444' },
                    { label: 'Resolved', value: stats.resolved, color: '#10b981' },
                ].map(k => (
                    <div key={k.label} className="glass-panel" style={{ padding: '1.25rem', borderTop: `3px solid ${k.color}` }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>{k.label}</p>
                        <p style={{ fontSize: '2rem', fontWeight: 700, color: k.color }}>{k.value}</p>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div className="flex-row gap-2" style={{ marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: 'All' },
                    { key: 'Submitted', label: 'New' },
                    { key: 'Validated', label: 'Validated' },
                    { key: 'Under Review', label: 'Under Review' },
                    { key: 'Assigned', label: 'Assigned' },
                    { key: 'In Progress', label: 'In Progress' },
                    { key: 'Resolved', label: '🔍 Needs Review' },
                    { key: 'sla', label: '⚠️ SLA Breach' },
                ].map(f => (
                    <button key={f.key} onClick={() => setFilter(f.key)}
                        style={{
                            padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid var(--border-color)',
                            background: filter === f.key ? '#7c3aed' : 'transparent',
                            color: filter === f.key ? '#fff' : 'var(--text-secondary)',
                            cursor: 'pointer', fontSize: '0.85rem', fontWeight: 500, transition: 'all 0.2s'
                        }}>
                        {f.label}
                    </button>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.2fr' : '1fr', gap: '2rem' }}>
                {/* Complaint List */}
                <div className="flex-col" style={{ gap: '0.75rem' }}>
                    {loading ? <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading...</div>
                        : filtered.map(c => (
                            <div key={c._id} className="glass-panel" onClick={() => { setSelected(c); setAssignMsg(''); setAssigningTo(''); setVerifyMsg(''); setVerifyNote(''); }}
                                style={{
                                    padding: '1.1rem', cursor: 'pointer',
                                    border: selected?._id === c._id ? '2px solid #7c3aed' : c.slaBreached ? '1px solid rgba(239,68,68,0.4)' : '1px solid var(--border-color)',
                                    background: c.slaBreached ? 'rgba(239,68,68,0.03)' : undefined,
                                    transition: 'all 0.2s'
                                }}>
                                <div className="flex-row justify-between" style={{ marginBottom: '0.4rem' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{c.complaintId}</span>
                                    <div className="flex-row gap-2">
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: PRIORITY_COLORS[c.priority], padding: '0.15rem 0.5rem', background: `${PRIORITY_COLORS[c.priority]}15`, borderRadius: '100px' }}>{c.priority}</span>
                                        <span style={{ fontSize: '0.72rem', fontWeight: 600, color: STATUS_COLORS[c.status], padding: '0.15rem 0.5rem', background: `${STATUS_COLORS[c.status] || '#94a3b8'}15`, borderRadius: '100px' }}>{c.status}</span>
                                    </div>
                                </div>
                                <p style={{ fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', marginBottom: '0.4rem' }}>{c.description}</p>
                                <div className="flex-row gap-4" style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                                    <span className="flex-row gap-2"><MapPin size={12} />{c.department}</span>
                                    <span className="flex-row gap-2"><Users size={12} />{c.assignedTo?.name || 'Unassigned'}</span>
                                    {c.ward && <span className="flex-row gap-2">🏘 {c.ward}</span>}
                                    {c.slaBreached && <span style={{ color: '#ef4444', fontWeight: 600 }} className="flex-row gap-2"><AlertTriangle size={12} />SLA Breached</span>}
                                </div>
                            </div>
                        ))}
                    {!loading && filtered.length === 0 && (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>No complaints match this filter.</div>
                    )}
                </div>

                {/* Detail & Action Panel */}
                {selected && (
                    <div className="flex-col animate-fade-in" style={{ gap: '1.5rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(124,58,237,0.2)' }}>
                            <h3 style={{ marginBottom: '1rem', color: '#7c3aed', fontSize: '1.05rem' }}>Complaint Details</h3>
                            <p style={{ fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1rem', color: 'var(--text-secondary)' }}>{selected.description}</p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                                {[
                                    { label: 'Department', value: selected.department },
                                    { label: 'Priority', value: selected.priority, color: PRIORITY_COLORS[selected.priority] },
                                    { label: 'Risk Level', value: selected.riskLevel },
                                    { label: 'Ward', value: selected.ward || 'Not detected' },
                                    { label: 'Escalation', value: `Level ${selected.escalationLevel}`, color: selected.escalationLevel > 0 ? '#ef4444' : '#10b981' },
                                    { label: 'Assigned To', value: selected.assignedTo?.name || 'Unassigned' },
                                    { label: 'SLA Status', value: selected.slaBreached ? 'Breached ⚠️' : 'On Track ✓', color: selected.slaBreached ? '#ef4444' : '#10b981' },
                                    { label: 'GPS Verified', value: selected.gpsVerified ? 'Yes ✓' : 'No', color: selected.gpsVerified ? '#10b981' : '#94a3b8' },
                                ].map(f => (
                                    <div key={f.label} style={{ padding: '0.6rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)' }}>
                                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{f.label}</p>
                                        <p style={{ fontWeight: 600, color: f.color || 'var(--text-primary)' }}>{f.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* AI Summary */}
                            {selected.aiSummary && (
                                <div style={{ padding: '0.75rem', background: 'rgba(2,132,199,0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)', borderLeft: '3px solid var(--accent-primary)' }}>
                                    🤖 {selected.aiSummary}
                                </div>
                            )}

                            {/* ── Before / After Photo Review (for Resolved complaints) ── */}
                            {selected.status === 'Resolved' && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem', marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        <Image size={15} /> Before / After Verification
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '1rem' }}>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>BEFORE</p>
                                            {selected.beforePhoto
                                                ? <img src={selected.beforePhoto} alt="before" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />
                                                : <div style={{ height: 110, borderRadius: 8, background: 'var(--bg-page)', border: '1px dashed var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.78rem' }}>No photo</div>
                                            }
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '0.75rem', color: '#059669', marginBottom: '0.4rem', fontWeight: 600 }}>AFTER</p>
                                            {selected.afterPhoto
                                                ? <img src={selected.afterPhoto} alt="after" style={{ width: '100%', height: 110, objectFit: 'cover', borderRadius: 8, border: '2px solid #059669' }} />
                                                : <div style={{ height: 110, borderRadius: 8, background: 'rgba(5,150,105,0.05)', border: '2px dashed #059669', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669', fontSize: '0.78rem' }}>Awaiting after photo</div>
                                            }
                                        </div>
                                    </div>
                                    {/* GPS verification badge */}
                                    <div style={{ padding: '0.5rem 0.75rem', borderRadius: 8, background: selected.gpsVerified ? 'rgba(5,150,105,0.08)' : 'rgba(245,158,11,0.08)', border: `1px solid ${selected.gpsVerified ? 'rgba(5,150,105,0.2)' : 'rgba(245,158,11,0.2)'}`, fontSize: '0.82rem', color: selected.gpsVerified ? '#059669' : '#92400e', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                        {selected.gpsVerified ? '✅ GPS within geo-fence' : '⚠️ GPS outside geo-fence — review carefully'}
                                    </div>
                                    {/* Officer note */}
                                    <div style={{ marginBottom: '0.75rem' }}>
                                        <label style={{ marginBottom: '0.35rem', fontSize: '0.82rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                            <MessageSquare size={14} /> Officer Note (optional)
                                        </label>
                                        <textarea className="input-base" value={verifyNote} onChange={e => setVerifyNote(e.target.value)}
                                            placeholder="Add a note for the audit trail…"
                                            style={{ minHeight: 60, resize: 'vertical', fontSize: '0.85rem', lineHeight: 1.5 }} />
                                    </div>
                                    {verifyMsg && (
                                        <div style={{ padding: '0.6rem 0.75rem', borderRadius: 8, marginBottom: '0.75rem', fontSize: '0.85rem', background: verifyMsg.startsWith('✅') ? 'rgba(5,150,105,0.08)' : 'rgba(245,158,11,0.08)', color: verifyMsg.startsWith('✅') ? '#059669' : '#92400e' }}>
                                            {verifyMsg}
                                        </div>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                        <button onClick={() => handleVerify('approved')} disabled={verifying}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#059669', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', opacity: verifying ? 0.6 : 1 }}>
                                            <ThumbsUp size={16} /> Approve & Close
                                        </button>
                                        <button onClick={() => handleVerify('rejected')} disabled={verifying}
                                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', padding: '0.75rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', opacity: verifying ? 0.6 : 1 }}>
                                            <ThumbsDown size={16} /> Reject Resolution
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Assign to Worker (for non-closed, non-resolved) */}
                            {!['Closed', 'Rejected', 'Resolved'].includes(selected.status) && (
                                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1.25rem' }}>
                                    <p style={{ fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Assign to Field Worker</p>
                                    <div className="flex-row gap-2">
                                        <select className="input-base" value={assigningTo} onChange={e => setAssigningTo(e.target.value)} style={{ flex: 1 }}>
                                            <option value="">Select worker...</option>
                                            {workers.map(w => <option key={w._id} value={w._id}>{w.name} ({w.department})</option>)}
                                        </select>
                                        <button onClick={handleAssign} className="btn-primary" style={{ background: '#7c3aed', whiteSpace: 'nowrap' }}>
                                            Assign
                                        </button>
                                    </div>
                                    {assignMsg && <p style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: assignMsg.startsWith('✅') ? '#059669' : '#ef4444' }}>{assignMsg}</p>}
                                </div>
                            )}
                        </div>

                        {selected.auditLog?.length > 0 && <AuditLogPanel auditLog={selected.auditLog} />}
                    </div>
                )}
            </div>
        </div>
    );
}
