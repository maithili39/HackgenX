import { useState, useEffect } from 'react';
import { X, MessageSquarePlus, Send, CheckCircle } from 'lucide-react';

export default function FeedbackModal({ isOpen, onClose }) {
    const [name, setName] = useState('');
    const [contact, setContact] = useState('');
    const [comments, setComments] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    // Close on Escape key
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        if (isOpen) window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [isOpen, onClose]);

    // Prevent body scroll when modal open
    useEffect(() => {
        document.body.style.overflow = isOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        // Simulate a brief network delay then show success
        await new Promise(r => setTimeout(r, 900));
        setSubmitted(true);
        setLoading(false);
    };

    const handleClose = () => {
        onClose();
        // Reset state after close animation
        setTimeout(() => { setSubmitted(false); setName(''); setContact(''); setComments(''); }, 250);
    };

    return (
        <>
            {/* Backdrop */}
            <div
                onClick={handleClose}
                style={{
                    position: 'fixed', inset: 0, zIndex: 998,
                    background: 'rgba(15, 23, 42, 0.55)',
                    backdropFilter: 'blur(6px)',
                    animation: 'fadeIn 0.2s ease',
                }}
            />

            {/* Modal */}
            <div style={{
                position: 'fixed', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)',
                zIndex: 999,
                width: '100%', maxWidth: '460px',
                background: 'var(--bg-panel)',
                borderRadius: '1.25rem',
                boxShadow: '0 24px 60px rgba(0,0,0,0.18)',
                border: '1px solid var(--border-color)',
                animation: 'modalSlideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
                overflow: 'hidden',
            }}>
                {/* Header */}
                <div style={{
                    padding: '1.5rem 1.75rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(14,165,233,0.03) 100%)',
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{ padding: '0.5rem', background: 'rgba(2,132,199,0.1)', borderRadius: '10px' }}>
                            <MessageSquarePlus size={22} color="var(--accent-primary)" />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '1.15rem', margin: 0, color: 'var(--text-primary)' }}>Share Your Feedback</h2>
                            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, marginTop: '0.15rem' }}>Help us improve CivicSense</p>
                        </div>
                    </div>
                    <button onClick={handleClose} style={{
                        background: 'var(--bg-element)', border: 'none', cursor: 'pointer',
                        color: 'var(--text-muted)', borderRadius: '8px', padding: '0.4rem',
                        display: 'flex', alignItems: 'center', transition: 'all 0.15s',
                    }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg-element)'; e.currentTarget.style.color = 'var(--text-muted)'; }}>
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div style={{ padding: '1.75rem' }}>
                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '2rem 1rem', animation: 'fadeIn 0.3s ease' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
                                <CheckCircle size={36} color="#10b981" />
                            </div>
                            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>Thank you, {name}!</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                Your feedback has been recorded. We appreciate your input in helping us serve citizens better.
                            </p>
                            <button onClick={handleClose} className="btn-primary" style={{ padding: '0.65rem 2rem' }}>
                                Close
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                                    Full Name <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text" className="input-base"
                                    placeholder="e.g. Rajan Kumar"
                                    value={name} onChange={e => setName(e.target.value)}
                                    required autoFocus
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                                    Email / Contact Number <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <input
                                    type="text" className="input-base"
                                    placeholder="email@example.com  or  +91 98765 43210"
                                    value={contact} onChange={e => setContact(e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.45rem' }}>
                                    Your Comments <span style={{ color: '#ef4444' }}>*</span>
                                </label>
                                <textarea
                                    className="input-base"
                                    placeholder="Share your experience, suggestions, or any issues you faced with CivicSense..."
                                    value={comments} onChange={e => setComments(e.target.value)}
                                    required
                                    rows={4}
                                    style={{ resize: 'vertical', minHeight: '100px', lineHeight: 1.6 }}
                                />
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.35rem', textAlign: 'right' }}>
                                    {comments.length}/500 characters
                                </p>
                            </div>

                            <button type="submit" className="btn-primary" disabled={loading}
                                style={{ padding: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', marginTop: '0.25rem', opacity: loading ? 0.75 : 1, transition: 'opacity 0.2s' }}>
                                {loading ? (
                                    <>
                                        <div style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid white', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                                        Submitting...
                                    </>
                                ) : (
                                    <><Send size={16} /> Submit Feedback</>
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes modalSlideUp {
                    from { opacity: 0; transform: translate(-50%, -45%); }
                    to   { opacity: 1; transform: translate(-50%, -50%); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </>
    );
}
