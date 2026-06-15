import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { io } from 'socket.io-client';
import { Clock, Search, CheckCircle, ThumbsUp, ThumbsDown, MapPin, Shield } from 'lucide-react';
import AuditLogPanel from '../components/AuditLogPanel';

const STEPS = ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'];
const STEP_LABELS = { Submitted: 'Submitted', 'Under Review': 'AI Review', Assigned: 'Assigned', 'In Progress': 'In Progress', Resolved: 'Resolved', Closed: 'Closed' };

export default function TrackStatus() {
    const [complaintId, setComplaintId] = useState('');
    const [complaint, setComplaint] = useState(null);
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [feedbackNote, setFeedbackNote] = useState('');
    const [feedbackLoading, setFeedbackLoading] = useState(false);
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const { token, user } = useContext(AuthContext);

    useEffect(() => {
        if (!token || !user) return;
        const socket = io(__API_BASE__);
        socket.on(`complaint_updated_${user.id}`, (updated) => {
            if (complaint && updated._id === complaint._id) setComplaint(updated);
            fetchMyComplaints();
        });
        return () => socket.disconnect();
    }, [token, user, complaint]);

    const fetchMyComplaints = async () => {
        try {
            const res = await axios.get(`${__API_BASE__}/api/complaints/my-complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(res.data);
        } catch (e) { console.error(e); }
    };

    useEffect(() => { fetchMyComplaints(); }, [token]);

    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setComplaint(null);
        try {
            const res = await axios.get(`${__API_BASE__}/api/complaints/my-complaints`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const found = res.data.find(c =>
                c._id === complaintId.trim() ||
                c.complaintId === complaintId.trim()
            );
            if (found) setComplaint(found);
            else setError('Complaint ID not found in your records.');
        } catch { setError('Error retrieving status'); }
        finally { setLoading(false); }
    };

    const handleFeedback = async (type) => {
        setFeedbackLoading(true); setFeedbackMsg('');
        try {
            const res = await axios.put(
                `${__API_BASE__}/api/complaints/${complaint._id}/feedback`,
                { feedback: type, note: feedbackNote },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setComplaint(res.data.complaint);
            setFeedbackMsg(type === 'accepted' ? '✅ You accepted the resolution. Ticket is now closed.' : '⚠️ Rejection noted. Ticket reopened for further action.');
        } catch (e) {
            setFeedbackMsg(e.response?.data?.message || 'Feedback submission failed');
        } finally { setFeedbackLoading(false); }
    };

    const StatusBar = ({ status }) => {
        const displaySteps = status === 'Rejected' ? [...STEPS.slice(0, 5), 'Rejected'] : STEPS;
        const currentIdx = displaySteps.indexOf(status);
        return (
            <div style={{ marginBottom: '2.5rem' }}>
                <h3 style={{ marginBottom: '1.5rem', fontSize: '1rem' }}>Resolution Progress</h3>
                <div style={{ display: 'flex', alignItems: 'flex-start', position: 'relative', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                    {displaySteps.map((step, i) => {
                        const done = i < currentIdx;
                        const active = i === currentIdx;
                        const isRejected = step === 'Rejected';
                        const color = isRejected ? '#ef4444' : active ? 'var(--accent-primary)' : done ? '#10b981' : '#cbd5e1';
                        return (
                            <div key={step} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', position: 'relative', minWidth: 70 }}>
                                {/* Connector line */}
                                {i > 0 && <div style={{ position: 'absolute', left: 0, top: 16, width: '50%', height: 2, background: done || active ? color : '#e2e8f0', zIndex: 0 }} />}
                                {i < displaySteps.length - 1 && <div style={{ position: 'absolute', right: 0, top: 16, width: '50%', height: 2, background: done ? '#10b981' : '#e2e8f0', zIndex: 0 }} />}
                                {/* Circle */}
                                <div style={{ width: 32, height: 32, borderRadius: '50%', border: `2px solid ${color}`, background: active ? color : done ? '#10b981' : isRejected && active ? '#ef4444' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, transition: 'all 0.3s' }}>
                                    {done ? <CheckCircle size={16} color="white" /> : <span style={{ fontSize: '0.75rem', fontWeight: 700, color: active ? 'white' : color }}>{i + 1}</span>}
                                </div>
                                <span style={{ fontSize: '0.72rem', fontWeight: active ? 700 : 400, color: active ? color : 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.3 }}>
                                    {STEP_LABELS[step] || step}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    };

    return (
        <div style={{ padding: '2rem 0', maxWidth: '850px', margin: '0 auto' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', textAlign: 'center' }}>Track Resolution Status</h1>
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '2rem' }}>Search by Complaint ID or Tracking Number</p>

            <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                <form onSubmit={handleSearch} className="flex-row gap-4">
                    <div style={{ flex: 1, position: 'relative' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                        <input type="text" className="input-base" style={{ paddingLeft: '2.5rem' }}
                            placeholder="Enter Complaint ID (e.g. CMP-20260224-1234) or MongoDB ID..."
                            value={complaintId} onChange={e => setComplaintId(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>{loading ? 'Searching...' : 'Track'}</button>
                </form>
                {error && <p style={{ color: 'var(--status-critical)', marginTop: '1rem', fontSize: '0.9rem' }}>{error}</p>}
            </div>

            {/* Quick access - list of own complaints */}
            {!complaint && complaints.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
                    <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Complaints</h3>
                    <div className="flex-col" style={{ gap: '0.5rem' }}>
                        {complaints.map(c => (
                            <div key={c._id} onClick={() => setComplaint(c)} style={{ padding: '0.75rem 1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all 0.2s' }}
                                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                                <div>
                                    <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: 'var(--accent-primary)', marginBottom: '0.2rem' }}>{c.complaintId}</p>
                                    <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 400 }}>{c.description}</p>
                                </div>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '100px', background: c.status === 'Closed' ? 'rgba(5,150,105,0.1)' : c.status === 'Resolved' ? 'rgba(16,185,129,0.1)' : 'rgba(2,132,199,0.1)', color: c.status === 'Closed' ? '#059669' : c.status === 'Resolved' ? '#10b981' : 'var(--accent-primary)' }}>
                                    {c.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {complaint && (
                <div className="glass-panel animate-fade-in" style={{ padding: '2rem' }}>
                    {/* Header */}
                    <div className="flex-row justify-between" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1.25rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.3rem' }}>Tracking ID</p>
                            <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-primary)' }}>{complaint.complaintId}</p>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Submitted</p>
                            <p className="flex-row gap-2" style={{ fontWeight: 500 }}><Clock size={15} color="var(--accent-primary)" />{new Date(complaint.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>

                    {/* 5-step progress bar */}
                    <StatusBar status={complaint.status} />

                    {/* Description */}
                    <p style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--accent-primary)' }}>
                        "{complaint.description}"
                    </p>

                    {/* AI Insights */}
                    <div style={{ background: 'rgba(2,132,199,0.05)', border: '1px solid rgba(2,132,199,0.2)', padding: '1.25rem', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                        <h4 style={{ color: 'var(--accent-primary)', marginBottom: '0.75rem', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>🔍 AI Engine Analysis</h4>
                        <div className="flex-row" style={{ flexWrap: 'wrap', gap: '1.5rem' }}>
                            {[
                                { label: 'Department', value: complaint.department },
                                { label: 'Priority', value: complaint.priority, color: complaint.priority === 'P0' ? '#ef4444' : complaint.priority === 'P1' ? '#f59e0b' : undefined },
                                { label: 'Risk Level', value: complaint.riskLevel, color: complaint.riskLevel === 'Critical' ? '#ef4444' : complaint.riskLevel === 'High' ? '#f59e0b' : undefined },
                                { label: 'Sentiment', value: complaint.emotion },
                                { label: 'SLA Status', value: complaint.slaBreached ? '⚠️ Breached' : 'On Track', color: complaint.slaBreached ? '#ef4444' : '#10b981' },
                                { label: 'GPS Verified', value: complaint.gpsVerified ? '✓ Yes' : 'N/A', color: complaint.gpsVerified ? '#10b981' : undefined },
                            ].map(f => (
                                <div key={f.label} className="flex-col gap-2">
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{f.label}</span>
                                    <span style={{ fontWeight: 600, color: f.color || 'var(--text-primary)' }}>{f.value}</span>
                                </div>
                            ))}
                        </div>
                        {complaint.aiSummary && <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>🤖 {complaint.aiSummary}</p>}
                    </div>

                    {/* Before/After Photos */}
                    {(complaint.beforePhoto || complaint.afterPhoto) && (
                        <div style={{ marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '1rem', fontSize: '0.88rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>Photo Evidence</h4>
                            <div style={{ display: 'grid', gridTemplateColumns: complaint.beforePhoto && complaint.afterPhoto ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                                {complaint.beforePhoto && (
                                    <div>
                                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>Before</p>
                                        <img src={complaint.beforePhoto} alt="Before" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
                                    </div>
                                )}
                                {complaint.afterPhoto && (
                                    <div>
                                        <p style={{ fontSize: '0.78rem', color: '#059669', marginBottom: '0.4rem' }}>After (Resolution Proof)</p>
                                        <img src={complaint.afterPhoto} alt="After" style={{ width: '100%', height: 150, objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid #059669' }} />
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Citizen Feedback (Accept/Reject) */}
                    {complaint.status === 'Resolved' && complaint.citizenFeedback === 'pending' && (
                        <div style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 'var(--radius-md)', marginBottom: '1.5rem' }}>
                            <h4 style={{ marginBottom: '0.75rem', color: '#059669' }}>🎉 Your complaint has been resolved!</h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>Please review the resolution and provide your feedback to officially close the ticket.</p>
                            <textarea className="input-base" style={{ minHeight: '80px', marginBottom: '1rem', resize: 'vertical' }}
                                placeholder="Optional: Add a note about the resolution quality..."
                                value={feedbackNote} onChange={e => setFeedbackNote(e.target.value)} />
                            <div className="flex-row gap-3">
                                <button onClick={() => handleFeedback('accepted')} disabled={feedbackLoading} className="btn-primary"
                                    style={{ flex: 1, background: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <ThumbsUp size={18} /> Accept Resolution
                                </button>
                                <button onClick={() => handleFeedback('rejected')} disabled={feedbackLoading}
                                    style={{ flex: 1, padding: '0.75rem', background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                    <ThumbsDown size={18} /> Reject & Reopen
                                </button>
                            </div>
                            {feedbackMsg && <p style={{ marginTop: '0.75rem', fontSize: '0.88rem', color: feedbackMsg.startsWith('✅') ? '#059669' : '#92400e' }}>{feedbackMsg}</p>}
                        </div>
                    )}

                    {complaint.citizenFeedback === 'accepted' && (
                        <div style={{ padding: '1rem', background: 'rgba(5,150,105,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', color: '#059669', fontWeight: 600, display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <CheckCircle size={18} /> Resolution accepted. Ticket officially closed.
                        </div>
                    )}

                    {complaint.citizenFeedback === 'rejected' && (
                        <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '1.5rem', color: '#ef4444', fontWeight: 600 }}>
                            ⚠️ Resolution rejected. Ticket reopened for further action.
                        </div>
                    )}

                    {/* Audit Log */}
                    {complaint.auditLog?.length > 0 && <AuditLogPanel auditLog={complaint.auditLog} />}

                    <button onClick={() => setComplaint(null)} style={{ marginTop: '1.5rem', background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.88rem', textDecoration: 'underline' }}>
                        ← Back to my complaints
                    </button>
                </div>
            )}
        </div>
    );
}
