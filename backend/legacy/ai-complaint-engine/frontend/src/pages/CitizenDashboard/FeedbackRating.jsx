import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Star, ThumbsUp, ThumbsDown, Camera, Send, AlertTriangle } from 'lucide-react';

export default function FeedbackRating() {
    const { token } = useContext(AuthContext);
    const [complaints, setComplaints] = useState([]);
    const [selected, setSelected] = useState(null);
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [satisfied, setSatisfied] = useState(null);
    const [comment, setComment] = useState('');
    const [postImage, setPostImage] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [autoEscalated, setAutoEscalated] = useState(false);

    useEffect(() => {
        if (!token) return;
        axios.get('http://localhost:5000/api/complaints/my-complaints', {
            headers: { Authorization: `Bearer ${token}` }
        }).then(r => {
            // Show resolved complaints pending citizen feedback (accepted or pending)
            const resolved = r.data.filter(c => ['Resolved', 'Closed'].includes(c.status));
            setComplaints(resolved);
            if (resolved.length > 0 && resolved[0].citizenFeedback === 'pending') {
                setSelected(resolved[0]);
            }
        }).catch(() => { });
    }, [token]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setPostImage(reader.result);
        reader.readAsDataURL(file);
    };

    const handleSubmit = async () => {
        if (!selected || rating === 0) return;
        setSubmitting(true);
        const willEscalate = rating < 3;

        try {
            // Submit feedback. If rating < 3 → reject & reopen (escalate)
            const feedbackType = satisfied === false || rating < 3 ? 'rejected' : 'accepted';
            await axios.put(
                `${__API_BASE__}/api/complaints/${selected._id}/feedback`,
                { feedback: feedbackType, note: comment || `Rating: ${rating}/5` },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSubmitted(true);
            setAutoEscalated(willEscalate);
        } catch (e) {
            console.error(e);
        } finally { setSubmitting(false); }
    };

    const resetForm = () => {
        setRating(0); setSatisfied(null); setComment(''); setPostImage(null);
        setSubmitted(false); setAutoEscalated(false);
        const remaining = complaints.filter(c => c._id !== selected?._id);
        setComplaints(remaining);
        setSelected(remaining.length > 0 ? remaining[0] : null);
    };

    if (submitted) {
        return (
            <div className="animate-fade-in glass-panel" style={{ padding: '3rem', maxWidth: 480, textAlign: 'center', margin: '2rem auto' }}>
                {autoEscalated ? (
                    <>
                        <AlertTriangle size={48} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#ef4444' }}>Complaint Escalated</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Since your rating was below 3, this complaint has been automatically re-opened and escalated to a senior officer.
                        </p>
                    </>
                ) : (
                    <>
                        <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🎉</div>
                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem', color: '#059669' }}>Thank you for your feedback!</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6 }}>
                            Your rating helps us improve civic services. The complaint is now officially closed.
                        </p>
                    </>
                )}
                <button onClick={resetForm}
                    style={{ marginTop: '1.5rem', padding: '0.65rem 1.5rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600 }}>
                    Rate Another Complaint
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 620 }}>
            {/* Complaint selector */}
            {complaints.length > 1 && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Select Complaint to Rate</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {complaints.map(c => (
                            <button key={c._id} onClick={() => { setSelected(c); setRating(0); setSatisfied(null); setComment(''); }}
                                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem 1rem', borderRadius: 10, border: `2px solid ${selected?._id === c._id ? '#0284c7' : 'var(--border-color)'}`, background: selected?._id === c._id ? 'rgba(2,132,199,0.06)' : 'white', cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s' }}>
                                <div>
                                    <p style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#0284c7', fontWeight: 600 }}>{c.complaintId}</p>
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>{c.department} · {c.status}</p>
                                </div>
                                {c.citizenFeedback === 'pending' && (
                                    <span style={{ fontSize: '0.65rem', padding: '2px 7px', background: 'rgba(245,158,11,0.1)', color: '#92400e', borderRadius: 100, fontWeight: 600 }}>Needs Rating</span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {complaints.length === 0 && (
                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-panel)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
                    <Star size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                    <p>No resolved complaints to rate yet.</p>
                </div>
            )}

            {/* Rating form */}
            {selected && (
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.06)', borderRadius: 10, borderLeft: '4px solid #10b981' }}>
                        <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.25rem' }}>Complaint Resolved</p>
                        <p style={{ fontFamily: 'monospace', fontSize: '0.9rem', color: '#059669', fontWeight: 700 }}>{selected.complaintId}</p>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{selected.department} · {selected.description?.slice(0, 60)}…</p>
                    </div>

                    {/* Star Rating */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '1rem' }}>How would you rate the resolution?</p>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {[1, 2, 3, 4, 5].map(s => (
                                <button key={s}
                                    onClick={() => setRating(s)}
                                    onMouseEnter={() => setHoverRating(s)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '0.25rem', transition: 'transform 0.15s' }}
                                    onMouseDown={e => e.currentTarget.style.transform = 'scale(0.9)'}
                                    onMouseUp={e => e.currentTarget.style.transform = 'none'}>
                                    <Star size={36}
                                        fill={s <= (hoverRating || rating) ? '#f59e0b' : 'none'}
                                        color={s <= (hoverRating || rating) ? '#f59e0b' : '#e2e8f0'}
                                        style={{ transition: 'all 0.15s', filter: s <= (hoverRating || rating) ? 'drop-shadow(0 0 6px rgba(245,158,11,0.5))' : 'none' }} />
                                </button>
                            ))}
                        </div>
                        {rating > 0 && (
                            <p style={{ marginTop: '0.5rem', fontSize: '0.82rem', color: rating < 3 ? '#ef4444' : rating < 4 ? '#f59e0b' : '#059669', fontWeight: 600 }}>
                                {rating === 1 ? '😡 Very Unsatisfied' : rating === 2 ? '😞 Unsatisfied' : rating === 3 ? '😐 Neutral' : rating === 4 ? '😊 Satisfied' : '🤩 Very Satisfied'}
                                {rating < 3 && <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: 'rgba(239,68,68,0.1)', padding: '1px 6px', borderRadius: 100, color: '#ef4444' }}>Will auto-escalate</span>}
                            </p>
                        )}
                    </div>

                    {/* Yes/No satisfaction */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.75rem' }}>Was this resolved satisfactorily?</p>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={() => setSatisfied(true)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 10, border: `2px solid ${satisfied === true ? '#10b981' : 'var(--border-color)'}`, background: satisfied === true ? 'rgba(16,185,129,0.08)' : 'white', cursor: 'pointer', fontWeight: 600, color: satisfied === true ? '#059669' : 'var(--text-secondary)', transition: 'all 0.2s', fontSize: '0.88rem' }}>
                                <ThumbsUp size={17} /> Yes, it's resolved!
                            </button>
                            <button onClick={() => setSatisfied(false)}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem', borderRadius: 10, border: `2px solid ${satisfied === false ? '#ef4444' : 'var(--border-color)'}`, background: satisfied === false ? 'rgba(239,68,68,0.06)' : 'white', cursor: 'pointer', fontWeight: 600, color: satisfied === false ? '#ef4444' : 'var(--text-secondary)', transition: 'all 0.2s', fontSize: '0.88rem' }}>
                                <ThumbsDown size={17} /> Not satisfied
                            </button>
                        </div>
                    </div>

                    {/* Comment */}
                    <div style={{ marginBottom: '1.25rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Additional comments (optional)</p>
                        <textarea className="input-base" style={{ minHeight: 90, resize: 'vertical' }}
                            placeholder="Describe the resolution quality, speed, officer behavior..."
                            value={comment} onChange={e => setComment(e.target.value)} />
                    </div>

                    {/* Image upload */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', fontWeight: 600, marginBottom: '0.5rem' }}>Upload post-resolution photo (optional)</p>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: 8, border: '2px dashed var(--border-color)', cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)', width: 'fit-content', transition: 'border-color 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.borderColor = '#0284c7'}
                            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-color)'}>
                            <Camera size={16} /> Upload Photo
                            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                        </label>
                        {postImage && <img src={postImage} alt="preview" style={{ marginTop: '0.5rem', width: 100, height: 70, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border-color)' }} />}
                    </div>

                    <button onClick={handleSubmit} disabled={submitting || rating === 0}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', background: rating > 0 ? '#0284c7' : '#94a3b8', color: 'white', border: 'none', borderRadius: 10, cursor: rating > 0 ? 'pointer' : 'not-allowed', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s', boxShadow: rating > 0 ? '0 4px 12px rgba(2,132,199,0.3)' : 'none' }}>
                        <Send size={17} /> {submitting ? 'Submitting…' : 'Submit Feedback'}
                    </button>
                    {rating === 0 && <p style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Please select a star rating to submit.</p>}
                </div>
            )}
        </div>
    );
}
