import { useState, useContext, useEffect } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import LocationPicker from '../../components/LocationPicker';
import toast from 'react-hot-toast';
import {
    CheckCircle, MapPin, Camera, Upload, Building2, User, Phone,
    Info, Sparkles, Loader2, Brain, FilePlus, FileText
} from 'lucide-react';

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

export default function SubmitComplaintSection({ onSuccess }) {
    const [formData, setFormData] = useState({ name: '', contact: '', homeAddress: '', department: '', description: '' });
    const [location, setLocation] = useState(null);
    const [detectedWard, setDetectedWard] = useState(null);
    const [photo, setPhoto] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successData, setSuccessData] = useState(null);
    const [isClassifying, setIsClassifying] = useState(false);
    const [aiResult, setAiResult] = useState(null);
    const [classifyError, setClassifyError] = useState('');
    // AI Summarizer state (from AI_Powered_Grievance_Redressal_System summarizer.py)
    const [smartSummaryText, setSmartSummaryText] = useState('');
    const [isSummarizing, setIsSummarizing] = useState(false);
    const { token } = useContext(AuthContext);

    // Debounced live summary — calls /api/ai/summarize as the user types
    useEffect(() => {
        if (formData.description.trim().length < 20) {
            setSmartSummaryText('');
            return;
        }
        const timer = setTimeout(async () => {
            setIsSummarizing(true);
            try {
                const res = await axios.post(
                    `${__API_BASE__}/api/ai/summarize`,
                    { text: formData.description },
                    { headers: { Authorization: `Bearer ${token}` } }
                );
                setSmartSummaryText(res.data.summary || '');
            } catch {
                setSmartSummaryText('');
            } finally {
                setIsSummarizing(false);
            }
        }, 1200); // 1.2s debounce
        return () => clearTimeout(timer);
    }, [formData.description, token]);

    // When location set, also auto-detect ward
    const handleLocationChange = async (loc) => {
        setLocation(loc);
        if (!loc) { setDetectedWard(null); return; }
        try {
            const res = await axios.post(`${__API_BASE__}/api/wards/detect`,
                { lat: loc.lat, lng: loc.lng },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setDetectedWard(res.data.wardName);
        } catch { setDetectedWard(null); }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'description') { setAiResult(null); setClassifyError(''); setSmartSummaryText(''); }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File is too large (max 5MB). Please choose a smaller photo.');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => setPhoto(reader.result);
        reader.readAsDataURL(file);
    };

    const handleClassify = async () => {
        if (formData.description.trim().length < 10) { setClassifyError('Enter at least 10 characters first.'); return; }
        setIsClassifying(true); setClassifyError(''); setAiResult(null);
        try {
            const res = await axios.post(`${__API_BASE__}/api/complaints/classify`,
                { description: formData.description, department: '' },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            const { department, emotion, riskLevel, aiSummary } = res.data;
            if (department && DEPARTMENTS.some(d => d.value === department)) {
                setFormData(prev => ({ ...prev, department }));
            }
            setAiResult({ department, sentiment: emotion || 'Neutral', riskLevel: riskLevel || 'Medium', summary: aiSummary || '' });
        } catch { setClassifyError('AI classification failed. Try again or select manually.'); }
        finally { setIsClassifying(false); }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!location || !location.lat || !location.lng) {
            toast.error('Please drop a pin on the map to set the exact location.');
            return;
        }
        if (!formData.name || !formData.contact || !formData.homeAddress || !formData.description) {
            toast.error('Please fill in all required fields.');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = { ...formData, photo, location, ward: detectedWard };
            const res = await axios.post(`${__API_BASE__}/api/complaints`, payload,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setSuccessData(res.data.complaint);
            setDetectedWard(null);
            toast.success('Complaint submitted successfully!');
        } catch (err) { 
            const msg = err.response?.data?.message || 'Error submitting complaint. Please try again.';
            toast.error(msg); 
        }
        finally { setIsSubmitting(false); }
    };

    const sentimentStyle = aiResult ? (SENTIMENT_STYLE[aiResult.sentiment] || SENTIMENT_STYLE['Neutral']) : null;

    // Success screen
    if (successData) {
        return (
            <div className="animate-fade-in" style={{ maxWidth: 600, margin: '0 auto' }}>
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(16,185,129,0.1)', borderRadius: '50%' }}>
                        <CheckCircle size={64} color="#10b981" />
                    </div>
                    <div>
                        <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>Grievance Registered!</h2>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                            Your complaint has been securely transmitted. Our AI Engine is analysing the content and routing to the relevant department.
                        </p>
                    </div>
                    <div style={{ padding: '1.25rem 2rem', background: 'var(--bg-page)', borderRadius: 12, border: '1px solid var(--border-color)', width: '100%' }}>
                        <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Official Tracking ID</p>
                        <p style={{ fontSize: '1.6rem', fontFamily: 'monospace', fontWeight: 700, color: '#0284c7', letterSpacing: '0.08em' }}>{successData.complaintId}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem 1rem', background: 'rgba(245,158,11,0.08)', borderRadius: 10, border: '1px solid rgba(245,158,11,0.2)', width: '100%' }}>
                        <Info size={18} color="#f59e0b" style={{ flexShrink: 0 }} />
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textAlign: 'left' }}>Save this ID. Real-time updates will appear in <strong>My Complaints</strong>.</p>
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', width: '100%' }}>
                        <button onClick={() => { setSuccessData(null); setFormData({ name: '', contact: '', homeAddress: '', department: '', description: '' }); setAiResult(null); setLocation(null); setPhoto(null); setDetectedWard(null); }}
                            style={{ flex: 1, padding: '0.75rem', background: 'white', border: '2px solid #0284c7', color: '#0284c7', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem' }}>
                            + File Another
                        </button>
                        <button onClick={onSuccess}
                            style={{ flex: 1, padding: '0.75rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: 10, cursor: 'pointer', fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 12px rgba(2,132,199,0.3)' }}>
                            Track Status →
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ maxWidth: 900, margin: '0 auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#059669,#0ea5e9)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <FilePlus size={18} color="white" />
                        </div>
                        <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Register Grievance</h1>
                    </div>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>Provide details for accurate AI analysis and routing to the right department</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(124,58,237,0.08)', color: '#7c3aed', borderRadius: 100, fontSize: '0.85rem', fontWeight: 600, border: '1px solid rgba(124,58,237,0.2)' }}>
                    <Brain size={15} /> ✨ AI Assist Active
                </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                {/* Complainant Details */}
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <User size={17} color="var(--accent-primary)" /> Complainant Details
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.88rem' }}>Full Name *</label>
                            <input type="text" className="input-base" name="name" value={formData.name} onChange={handleChange} placeholder="E.g. Priya Sharma" required />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.88rem' }}>Contact (Email/Phone) *</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="input-base" style={{ paddingLeft: '2.25rem' }} name="contact" value={formData.contact} onChange={handleChange} placeholder="For SMS/Email updates" required />
                            </div>
                        </div>
                        <div style={{ gridColumn: '1 / -1' }}>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.88rem' }}>Home Address *</label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={16} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                                <input type="text" className="input-base" style={{ paddingLeft: '2.25rem' }} name="homeAddress" value={formData.homeAddress} onChange={handleChange} placeholder="Your residence address" required />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Grievance Details */}
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <h3 style={{ marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.95rem', fontWeight: 700, borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
                        <Building2 size={17} color="var(--accent-primary)" /> Grievance Details
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

                        {/* Description + AI Classify */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.88rem' }}>Description of Issue *</label>
                            <textarea className="input-base" style={{ minHeight: '110px', resize: 'vertical', lineHeight: 1.6 }}
                                name="description" value={formData.description} onChange={handleChange}
                                placeholder="Briefly describe the issue. Include dates or amounts if relevant." required />

                            {/* AI Smart Summary Preview (from summarizer.py) */}
                            {(smartSummaryText || isSummarizing) && (
                                <div style={{
                                    marginTop: '0.6rem',
                                    padding: '0.6rem 0.875rem',
                                    borderRadius: 8,
                                    background: 'rgba(16,185,129,0.06)',
                                    border: '1px solid rgba(16,185,129,0.2)',
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    justifyContent: 'space-between',
                                    gap: '0.5rem',
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                                        {isSummarizing
                                            ? <Loader2 size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 2, animation: 'spin 1s linear infinite' }} />
                                            : <FileText size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                                        }
                                        <div>
                                            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                AI Summary
                                            </span>
                                            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                                                {isSummarizing ? 'Generating summary…' : smartSummaryText}
                                            </p>
                                        </div>
                                    </div>
                                    {!isSummarizing && smartSummaryText && (
                                        <button 
                                            type="button" 
                                            onClick={() => { setFormData(prev => ({ ...prev, description: smartSummaryText })); setSmartSummaryText(''); }}
                                            style={{ padding: '0.3rem 0.75rem', background: '#10b981', color: 'white', border: 'none', borderRadius: 6, fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', flexShrink: 0 }}
                                        >
                                            Apply
                                        </button>
                                    )}
                                </div>
                            )}

                            <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                                <button type="button" onClick={handleClassify}
                                    disabled={isClassifying || formData.description.trim().length < 10}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.25rem',
                                        background: isClassifying ? 'rgba(139,92,246,0.15)' : 'linear-gradient(135deg,#7c3aed,#2563eb)',
                                        color: isClassifying ? '#a78bfa' : 'white', border: '1.5px solid rgba(124,58,237,0.4)',
                                        borderRadius: 8, fontWeight: 600, fontSize: '0.85rem', cursor: isClassifying ? 'wait' : 'pointer',
                                        opacity: formData.description.trim().length < 10 ? 0.5 : 1, transition: 'all 0.2s',
                                        boxShadow: '0 2px 10px rgba(124,58,237,0.2)'
                                    }}>
                                    {isClassifying ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Analysing…</> : <><Brain size={15} /> 🤖 Classify with AI</>}
                                </button>
                                {classifyError && <span style={{ fontSize: '0.8rem', color: '#ef4444' }}>{classifyError}</span>}
                            </div>

                            {/* AI Result */}
                            {aiResult && (
                                <div className="animate-fade-in" style={{ marginTop: '1rem', padding: '1rem 1.25rem', borderRadius: 10, background: 'rgba(124,58,237,0.05)', border: '1.5px solid rgba(124,58,237,0.2)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700, fontSize: '0.78rem', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>
                                        <Sparkles size={14} /> AI Engine Result
                                    </div>
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem', alignItems: 'center' }}>
                                        <span style={{ padding: '0.35rem 0.85rem', background: 'rgba(2,132,199,0.1)', border: '1px solid rgba(2,132,199,0.25)', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600, color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                            <Building2 size={12} />{aiResult.department}
                                        </span>
                                        {sentimentStyle && (
                                            <span style={{ padding: '0.35rem 0.85rem', background: sentimentStyle.bg, border: `1px solid ${sentimentStyle.color}44`, borderRadius: 100, fontSize: '0.82rem', fontWeight: 600, color: sentimentStyle.color }}>
                                                {sentimentStyle.emoji} {aiResult.sentiment}
                                            </span>
                                        )}
                                        <span style={{ padding: '0.35rem 0.85rem', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 100, fontSize: '0.82rem', fontWeight: 600, color: '#f59e0b' }}>
                                            ⚡ Risk: {aiResult.riskLevel}
                                        </span>
                                    </div>
                                    {aiResult.summary && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.5rem', lineHeight: 1.5 }}>{aiResult.summary}</p>}
                                </div>
                            )}
                        </div>

                        {/* Department */}
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500, fontSize: '0.88rem' }}>Concerned Department (Optional)</label>
                            <select className="input-base" name="department" value={formData.department} onChange={handleChange} style={{ cursor: 'pointer' }}>
                                {DEPARTMENTS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                            </select>
                        </div>

                        {/* Photo + Location */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                            {/* Photo upload */}
                            <div style={{ background: 'var(--bg-page)', padding: '1.25rem', borderRadius: 10, border: '2px dashed var(--border-color)', textAlign: 'center', position: 'relative', cursor: 'pointer' }}>
                                {photo ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <img src={photo} alt="proof" style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 6, border: '2px solid #0284c7' }} />
                                        <p style={{ fontSize: '0.8rem', color: '#10b981', fontWeight: 600 }}>Photo attached ✓</p>
                                        <button type="button" onClick={() => setPhoto(null)} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '0.75rem', cursor: 'pointer' }}>Remove</button>
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem' }}>
                                        <Camera size={28} color="var(--text-muted)" />
                                        <p style={{ fontSize: '0.88rem', fontWeight: 500 }}>Upload Photo Proof</p>
                                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JPG, PNG (Max 5MB)</p>
                                        <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer' }} />
                                    </div>
                                )}
                            </div>

                            {/* Location Picker — Google Maps */}
                            <div style={{ background: 'var(--bg-page)', padding: '1.25rem', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                                <p style={{ margin: '0 0 0.75rem', fontWeight: 600, fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                    <MapPin size={15} color="var(--accent-primary)" /> Incident Location *
                                </p>
                                <LocationPicker location={location} onLocationChange={handleLocationChange} />
                                {detectedWard && (
                                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.6rem', padding: '0.3rem 0.7rem', background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 100, fontSize: '0.75rem', fontWeight: 600, color: '#3b82f6' }}>
                                        🏘 Ward: {detectedWard}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submit */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 1.5rem', background: 'rgba(15,23,42,0.04)', borderRadius: 12, border: '1px solid var(--border-color)', flexWrap: 'wrap', gap: '1rem' }}>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '60%', lineHeight: 1.5 }}>
                        <strong>Notice:</strong> By submitting, you confirm the information is accurate and consent to AI analysis.
                    </p>
                    <button type="submit" disabled={isSubmitting || formData.description.length < 5 || !formData.name || !formData.contact || !formData.homeAddress}
                        style={{
                            padding: '0.85rem 2rem', background: 'linear-gradient(135deg,#0284c7,#0ea5e9)', color: 'white',
                            border: 'none', borderRadius: 10, cursor: isSubmitting ? 'wait' : 'pointer', fontWeight: 700, fontSize: '1rem',
                            opacity: (isSubmitting || formData.description.length < 5 || !formData.name || !formData.contact || !formData.homeAddress) ? 0.6 : 1,
                            boxShadow: '0 4px 14px rgba(2,132,199,0.35)', transition: 'all 0.2s'
                        }}>
                        {isSubmitting ? 'Transmitting…' : '🔒 Submit Grievance Securely'}
                    </button>
                </div>
            </form>

            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
    );
}
