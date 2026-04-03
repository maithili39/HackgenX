import { useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';
import {
    CheckCircle, MapPin, Camera, Upload, Building2, User, Phone,
    MapPin as MapPinIcon, Info, Sparkles, Loader2, Brain
} from 'lucide-react';

// Sentiment → colour/emoji mapping
const SENTIMENT_STYLE = {
    Angry: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', emoji: '😡' },
    Frustrated: { color: '#f97316', bg: 'rgba(249,115,22,0.12)', emoji: '😤' },
    Concerned: { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', emoji: '😟' },
    Urgent: { color: '#dc2626', bg: 'rgba(220,38,38,0.14)', emoji: '🚨' },
    Neutral: { color: '#64748b', bg: 'rgba(100,116,139,0.12)', emoji: '😐' },
    Appreciative: { color: '#10b981', bg: 'rgba(16,185,129,0.12)', emoji: '😊' },
    Furious: { color: '#b91c1c', bg: 'rgba(185,28,28,0.14)', emoji: '🤬' },
};

const DEPARTMENTS = [
    { value: '', label: 'Auto-detect via AI Engine' },
    { value: 'Logistics', label: 'Logistics & Supply' },
    { value: 'Billing', label: 'Billing & Finance' },
    { value: 'Tech Support', label: 'Technical Support' },
    { value: 'Public Works', label: 'Public Works' },
    { value: 'Water Supply', label: 'Water Supply' },
    { value: 'Electricity', label: 'Electricity Board' },
    { value: 'Roads', label: 'Roads & Infrastructure' },
    { value: 'Sanitation', label: 'Sanitation & Waste' },
];

export default function SubmitComplaint() {
    const [formData, setFormData] = useState({
        name: '', contact: '', homeAddress: '', department: '', description: '',
    });
    const [location, setLocation] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);

    // OTP states
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpPreviewUrl, setOtpPreviewUrl] = useState('');
    const HARDCODED_OTP = '482916';

    // AI classify state
    const [isClassifying, setIsClassifying] = useState(false);
    const [aiResult, setAiResult] = useState(null); // { department, sentiment, confidence, model_used }
    const [classifyError, setClassifyError] = useState('');

    const { token } = useContext(AuthContext);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        // Reset AI result when description changes
        if (name === 'description') { setAiResult(null); setClassifyError(''); }
    };


    const handlePhotoUpload = (e) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPhoto(reader.result);
            };
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // ── AI Classification ──────────────────────────────────────────────────────
    const handleClassify = async () => {
        if (!formData.description || formData.description.trim().length < 10) {
            setClassifyError('Please enter at least 10 characters in the description first.');
            return;
        }
        setIsClassifying(true);
        setClassifyError('');
        setAiResult(null);

        try {
            const res = await axios.post(
                'http://localhost:5000/api/complaints/classify',
                { description: formData.description, department: '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { department, emotion, riskLevel, aiSummary } = res.data;

            // Auto-fill department if matched a known one
            const knownDepts = DEPARTMENTS.map(d => d.value).filter(Boolean);
            if (department && knownDepts.includes(department)) {
                setFormData(prev => ({ ...prev, department }));
            }

            setAiResult({
                department,
                sentiment: emotion || 'Neutral',
                riskLevel: riskLevel || 'Medium',
                summary: aiSummary || '',
            });
        } catch (err) {
            console.error(err);
            setClassifyError('AI classification failed. Please try again or select department manually.');
        } finally {
            setIsClassifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // ── 1: Send OTP ──
        if (!showOtp) {
            setOtpSending(true);
            try {
                // We use the 'contact' field as the email for the OTP sender
                const res = await fetch('http://localhost:5000/api/auth/send-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.contact, name: formData.name, role: 'citizen_complaint' })
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.message || 'Failed to send OTP');
                setOtpPreviewUrl(data.previewUrl || '');
                setShowOtp(true);
            } catch (err) {
                alert(err.message || 'Could not send OTP');
            } finally {
                setOtpSending(false);
            }
            return;
        }

        // ── 2: Verify OTP and Submit Grievance ──
        if (otp !== HARDCODED_OTP) {
            alert('Invalid OTP. Please enter the correct 6-digit code.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = { ...formData, photo, location };
            const res = await axios.post(
                'http://localhost:5000/api/complaints',
                payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccessData(res.data.complaint);
            console.log('Mock SMS Sent: Your complaint has been registered.');
        } catch (error) {
            console.error(error);
            alert('Error submitting complaint');
        } finally {
            setIsSubmitting(false);
        }
    };

    // ── Success screen ─────────────────────────────────────────────────────────
    if (successData) {
        return (
            <div style={{ padding: '4rem 0', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
                <div className="glass-panel animate-fade-in flex-col" style={{ alignItems: 'center', gap: '1.5rem', padding: '3rem' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%' }}>
                        <CheckCircle size={64} color="var(--status-success)" />
                    </div>
                    <h2>Grievance Registered Successfully</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Your complaint has been securely transmitted. Our AI Engine is analysing the content.
                    </p>
                    <div style={{ padding: '1.5rem', background: 'var(--bg-page)', borderRadius: 'var(--radius-md)', width: '100%', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Official Tracking ID</span>
                        <div style={{ fontSize: '1.5rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-primary)', letterSpacing: '0.1em' }}>
                            {successData.complaintId}
                        </div>
                    </div>
                    <div className="flex-row" style={{ gap: '0.5rem', marginTop: '1rem', background: 'rgba(245, 158, 11, 0.1)', padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)', width: '100%', border: '1px solid rgba(245, 158, 11, 0.2)' }}>
                        <Info size={18} color="var(--status-warning)" />
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textAlign: 'left' }}>
                            Save this ID for future reference. Real-time updates will be available on your dashboard.
                        </span>
                    </div>
                    <button onClick={() => window.location.href = '/track'} className="btn-primary" style={{ width: '100%', marginTop: '1rem', padding: '1rem' }}>Track Live Status</button>
                </div>
            </div>
        );
    }

    const sentimentStyle = aiResult ? (SENTIMENT_STYLE[aiResult.sentiment] || SENTIMENT_STYLE['Neutral']) : null;

    // ── Main form ──────────────────────────────────────────────────────────────
    return (
        <div style={{ padding: '2rem 0', maxWidth: '900px', margin: '0 auto' }}>
            <div className="flex-row justify-between animate-slide-in" style={{ marginBottom: '2rem', alignItems: 'center' }}>
                <div>
                    <h1 style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>Register Grievance</h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Provide comprehensive details for accurate AI analysis and routing</p>
                </div>
                <div className="flex-row gap-2" style={{ padding: '0.5rem 1rem', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-primary)', borderRadius: '100px', fontSize: '0.9rem', fontWeight: 600 }}>
                    ✨ AI Assist Active
                </div>
            </div>

            <form onSubmit={handleSubmit} className="animate-fade-in flex-col" style={{ gap: '2rem' }}>

                {/* Section 1: Personal Information */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <User size={20} color="var(--accent-primary)" />
                        Complainant Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Full Name *</label>
                            <input type="text" className="input-base" name="name" value={formData.name} onChange={handleChange} placeholder="E.g. John Doe" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Contact Info (Email/Phone) *</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="input-base" style={{ paddingLeft: '2.5rem' }} name="contact" value={formData.contact} onChange={handleChange} placeholder="For SMS/Email Ack" required />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Home Address *</label>
                            <div style={{ position: 'relative' }}>
                                <MapPinIcon size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="input-base" style={{ paddingLeft: '2.5rem' }} name="homeAddress" value={formData.homeAddress} onChange={handleChange} placeholder="Enter your residence address" required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2: Complaint Details */}
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
                        <Building2 size={20} color="var(--accent-primary)" />
                        Grievance Details
                    </h3>

                    <div className="flex-col" style={{ gap: '1.5rem' }}>

                        {/* Description + Classify Button */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>
                                Description of Issue (1-2 Lines) *
                            </label>
                            <textarea
                                className="input-base"
                                style={{ minHeight: '120px', resize: 'vertical', lineHeight: 1.6 }}
                                name="description"
                                placeholder="Briefly describe the issue. Include dates or amounts if relevant."
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />

                            {/* AI Classify Button */}
                            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <button
                                    type="button"
                                    onClick={handleClassify}
                                    disabled={isClassifying || formData.description.trim().length < 10}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.65rem 1.4rem',
                                        background: isClassifying ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                                        color: isClassifying ? '#a78bfa' : 'white',
                                        border: '1.5px solid rgba(124,58,237,0.4)',
                                        borderRadius: 'var(--radius-sm)',
                                        fontWeight: 600, fontSize: '0.9rem', cursor: isClassifying ? 'wait' : 'pointer',
                                        transition: 'all 0.2s',
                                        opacity: formData.description.trim().length < 10 ? 0.5 : 1,
                                        boxShadow: '0 2px 12px rgba(124,58,237,0.25)',
                                    }}
                                >
                                    {isClassifying
                                        ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</>
                                        : <><Brain size={16} /> 🤖 Classify with AI Engine</>
                                    }
                                </button>
                                {classifyError && (
                                    <span style={{ fontSize: '0.82rem', color: 'var(--status-error)' }}>{classifyError}</span>
                                )}
                            </div>

                            {/* AI Result Card */}
                            {aiResult && (
                                <div className="animate-fade-in" style={{
                                    marginTop: '1rem',
                                    padding: '1rem 1.25rem',
                                    borderRadius: 'var(--radius-md)',
                                    background: 'rgba(124,58,237,0.06)',
                                    border: '1.5px solid rgba(124,58,237,0.25)',
                                    display: 'flex', flexDirection: 'column', gap: '0.75rem',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.85rem', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        <Sparkles size={15} />
                                        AI Engine Result
                                    </div>

                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                                        {/* Department chip */}
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                                            padding: '0.4rem 0.9rem',
                                            background: 'rgba(2,132,199,0.12)',
                                            border: '1px solid rgba(2,132,199,0.3)',
                                            borderRadius: '100px',
                                            fontSize: '0.85rem', fontWeight: 600,
                                            color: 'var(--accent-primary)',
                                        }}>
                                            <Building2 size={13} />
                                            {aiResult.department}
                                        </div>

                                        {/* Sentiment chip */}
                                        {sentimentStyle && (
                                            <div style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                padding: '0.4rem 0.9rem',
                                                background: sentimentStyle.bg,
                                                border: `1px solid ${sentimentStyle.color}44`,
                                                borderRadius: '100px',
                                                fontSize: '0.85rem', fontWeight: 600,
                                                color: sentimentStyle.color,
                                            }}>
                                                {sentimentStyle.emoji} {aiResult.sentiment}
                                            </div>
                                        )}

                                        {/* Risk chip */}
                                        <div style={{
                                            padding: '0.4rem 0.9rem',
                                            background: aiResult.riskLevel === 'Critical' ? 'rgba(220,38,38,0.1)' :
                                                aiResult.riskLevel === 'High' ? 'rgba(249,115,22,0.1)' :
                                                    aiResult.riskLevel === 'Medium' ? 'rgba(245,158,11,0.1)' :
                                                        'rgba(16,185,129,0.1)',
                                            border: `1px solid ${aiResult.riskLevel === 'Critical' ? '#dc2626' : aiResult.riskLevel === 'High' ? '#f97316' : aiResult.riskLevel === 'Medium' ? '#f59e0b' : '#10b981'}44`,
                                            borderRadius: '100px',
                                            fontSize: '0.82rem', fontWeight: 600,
                                            color: aiResult.riskLevel === 'Critical' ? '#dc2626' : aiResult.riskLevel === 'High' ? '#f97316' : aiResult.riskLevel === 'Medium' ? '#f59e0b' : '#10b981',
                                        }}>
                                            ⚡ Risk: {aiResult.riskLevel}
                                        </div>
                                    </div>

                                    {aiResult.summary && (
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                                            {aiResult.summary}
                                        </p>
                                    )}
                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0 }}>
                                        ✅ Department auto-selected in dropdown below. You can change it if needed.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Department Dropdown */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 500, fontSize: '0.9rem' }}>Concerned Department (Optional)</label>
                            <select
                                className="input-base"
                                name="department"
                                value={formData.department}
                                onChange={handleChange}
                                style={{ cursor: 'pointer', appearance: 'none', background: 'var(--bg-element) url("data:image/svg+xml;utf8,<svg fill=\'%2364748b\' height=\'24\' viewBox=\'0 0 24 24\' width=\'24\' xmlns=\'http://www.w3.org/2000/svg\'><path d=\'M7 10l5 5 5-5z\'/><path d=\'M0 0h24v24H0z\' fill=\'none\'/></svg>") no-repeat right 10px center' }}
                            >
                                {DEPARTMENTS.map(d => (
                                    <option key={d.value} value={d.value}>{d.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Media and Location Grid */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {/* Photo Upload */}
                            <div style={{ background: 'var(--bg-page)', padding: '1.5rem', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-color)', textAlign: 'center', position: 'relative' }}>
                                {photo ? (
                                    <div className="animate-fade-in flex-col" style={{ alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '80px', height: '80px', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '2px solid var(--accent-primary)' }}>
                                            <img src={photo} alt="Proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <span style={{ fontSize: '0.85rem', color: 'var(--status-success)', fontWeight: 600 }}>Photo attached</span>
                                        <button type="button" onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', color: 'var(--status-error)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>Remove</button>
                                    </div>
                                ) : (
                                    <div className="flex-col" style={{ alignItems: 'center', gap: '0.5rem' }}>
                                        <Camera size={32} color="var(--text-muted)" />
                                        <span style={{ fontSize: '0.95rem', fontWeight: 500 }}>Upload Photo Proof</span>
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>JPG, PNG (Max 5MB)</span>
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                        <button type="button" className="btn-secondary" style={{ marginTop: '0.5rem', pointerEvents: 'none' }}>
                                            <Upload size={16} /> Browse Files
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Location Picker — Google Maps */}
                            <div style={{ background: 'var(--bg-page)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <MapPin size={15} color="var(--accent-primary)" /> Incident Location *
                                </p>
                                <LocationPicker location={location} onLocationChange={setLocation} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer / Submit */}
                {!showOtp ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', background: 'rgba(15, 23, 42, 0.05)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', maxWidth: '60%' }}>
                            <strong style={{ color: 'var(--text-primary)' }}>Notice:</strong> By submitting, you affirm that the information provided is accurate and consent to its analysis by our AI infrastructure.
                        </div>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={otpSending || formData.description.length < 5 || !formData.name || !formData.contact || !formData.homeAddress}
                            style={{ padding: '1rem 2rem', fontSize: '1.1rem', opacity: (otpSending || formData.description.length < 5 || !formData.name || !formData.contact) ? 0.7 : 1 }}
                        >
                            {otpSending ? 'Sending OTP Securely...' : 'Send OTP & Verify Request'}
                        </button>
                    </div>
                ) : (
                    <div className="glass-panel animate-slide-up" style={{ padding: '2rem', border: '2px solid var(--accent-primary)', textAlign: 'center' }}>
                        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>Email Verification Required</h3>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
                            An OTP has been sent to <strong>{formData.contact}</strong>. Please enter it below to confirm your grievance submission.
                        </p>

                        <div style={{ maxWidth: '300px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input
                                type="text"
                                className="input-base"
                                value={otp}
                                onChange={e => setOtp(e.target.value)}
                                placeholder="Enter 6-digit OTP"
                                maxLength={6}
                                required
                                style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '0.3em', padding: '1rem' }}
                            />

                            {otpPreviewUrl && (
                                <a href={otpPreviewUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: 'var(--accent-primary)', textDecoration: 'underline' }}>
                                    (Dev Mode) View OTP Email
                                </a>
                            )}

                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowOtp(false)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                    disabled={isSubmitting || otp.length < 6}
                                    style={{ flex: 2, opacity: (isSubmitting || otp.length < 6) ? 0.7 : 1 }}
                                >
                                    {isSubmitting ? 'Transmitting Data...' : 'Verify & Submit Grievance'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </form>

            {/* CSS for spinner */}
            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
