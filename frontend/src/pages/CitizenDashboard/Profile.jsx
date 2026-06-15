import { useState, useRef, useContext, useEffect } from 'react';
import api from '../../api/axios.js';
import { AuthContext } from '../../context/AuthContext';
import { User, Mail, Phone, MapPin, Shield, Camera, Edit3, Check, X, Star, Calendar, FileText } from 'lucide-react';

export default function Profile({ profile, onUpdate }) {
    
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState({});
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState('');
    const [complaintCount, setComplaintCount] = useState(0);
    const fileRef = useRef();

    useEffect(() => {
        if (profile) setForm({ name: profile.name, phone: profile.phone || '', ward: profile.ward || '', address: profile.address || '' });
        if (user) {
            api.get(`/api/complaints/my-complaints`)
                .then(r => setComplaintCount(r.data.length)).catch(() => { });
        }
    }, [profile]);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setForm(f => ({ ...f, profilePicture: reader.result }));
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        setSaving(true); setMsg('');
        try {
            const res = await api.put(`/api/auth/profile`, form);
            onUpdate(res.data.user);
            setMsg('✓ Profile updated successfully!');
            setEditing(false);
        } catch (e) {
            setMsg('✗ Failed to save. Try again.');
        } finally { setSaving(false); }
    };

    const score = profile?.citizenScore || 50;
    const scoreColor = score >= 70 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444';
    const memberSince = profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : '—';
    const avatarSrc = form.profilePicture || profile?.profilePicture;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 800 }}>
            {/* Profile Card */}
            <div className="glass-panel" style={{ padding: '2rem', position: 'relative' }}>
                {/* Edit toggle */}
                <button onClick={() => { setEditing(!editing); setMsg(''); }}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.5rem 1rem', borderRadius: 8, border: '1px solid var(--border-color)', background: editing ? 'var(--accent-primary)' : 'white', color: editing ? 'white' : 'var(--text-secondary)', cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', transition: 'all 0.2s' }}>
                    {editing ? <X size={14} /> : <Edit3 size={14} />}
                    {editing ? 'Cancel' : 'Edit Profile'}
                </button>

                {/* Avatar + name */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1.5rem', flexWrap: 'wrap', marginBottom: '2rem' }}>
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                        <div style={{ width: 90, height: 90, borderRadius: '50%', border: '3px solid #0284c7', overflow: 'hidden', background: 'linear-gradient(135deg,#0284c7,#10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {avatarSrc
                                ? <img src={avatarSrc} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ color: 'white', fontWeight: 700, fontSize: '2rem' }}>{profile?.name?.charAt(0) || 'C'}</span>
                            }
                        </div>
                        {editing && (
                            <button onClick={() => fileRef.current.click()}
                                style={{ position: 'absolute', bottom: 0, right: 0, width: 28, height: 28, borderRadius: '50%', background: '#0284c7', border: '2px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                                <Camera size={14} color="white" />
                            </button>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                    </div>
                    <div style={{ flex: 1 }}>
                        {editing
                            ? <input className="input-base" style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '0.5rem' }} value={form.name || ''} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                            : <h2 style={{ fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {profile?.name}
                                {profile?.emailVerified && (
                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem', fontSize: '0.72rem', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '2px 8px', borderRadius: 100, fontWeight: 600 }}>
                                        <Shield size={11} /> Verified Citizen
                                    </span>
                                )}
                            </h2>
                        }
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.25rem' }}>Citizen Account · {profile?.role}</p>

                        {/* Citizen Score */}
                        <div style={{ marginTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Citizen Score</span>
                            <div style={{ flex: 1, maxWidth: 140, height: 8, background: '#e2e8f0', borderRadius: 100 }}>
                                <div style={{ width: `${score}%`, height: '100%', background: scoreColor, borderRadius: 100, transition: 'width 1s ease' }} />
                            </div>
                            <span style={{ fontWeight: 700, color: scoreColor, fontSize: '0.88rem' }}>{score}/100</span>
                            <div style={{ display: 'flex', gap: '1px' }}>
                                {[1, 2, 3, 4, 5].map(s => (
                                    <Star key={s} size={12} fill={s <= Math.round(score / 20) ? '#f59e0b' : 'none'} color={s <= Math.round(score / 20) ? '#f59e0b' : '#e2e8f0'} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Info Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1.25rem' }}>
                    {[
                        { label: 'Email', icon: Mail, value: profile?.email, fieldKey: null, verified: profile?.emailVerified },
                        { label: 'Phone', icon: Phone, fieldKey: 'phone', placeholder: 'Add phone number' },
                        { label: 'Ward / Area', icon: MapPin, fieldKey: 'ward', placeholder: 'e.g. Ward 12, Sector 3' },
                        { label: 'Address', icon: MapPin, fieldKey: 'address', placeholder: 'Full address' },
                        { label: 'Member Since', icon: Calendar, value: memberSince, fieldKey: null },
                        { label: 'Total Complaints', icon: FileText, value: complaintCount, fieldKey: null },
                    ].map(({ label, icon: Icon, value, fieldKey, placeholder, verified }) => (
                        <div key={label} style={{ padding: '1rem', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                                <Icon size={14} color="var(--accent-primary)" />
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 500 }}>{label}</span>
                                {verified && <span style={{ fontSize: '0.62rem', background: 'rgba(16,185,129,0.1)', color: '#059669', padding: '1px 5px', borderRadius: 100 }}>✓ Verified</span>}
                            </div>
                            {editing && fieldKey ? (
                                <input className="input-base" style={{ padding: '0.4rem 0.6rem', fontSize: '0.85rem' }}
                                    value={form[fieldKey] || ''} placeholder={placeholder}
                                    onChange={e => setForm(f => ({ ...f, [fieldKey]: e.target.value }))} />
                            ) : (
                                <p style={{ fontSize: '0.88rem', fontWeight: 500, color: (fieldKey ? form[fieldKey] || value : value) ? 'var(--text-primary)' : 'var(--text-muted)', fontStyle: (fieldKey ? form[fieldKey] : value) ? 'normal' : 'italic' }}>
                                    {typeof value === 'number' ? value : (fieldKey ? form[fieldKey] || value : value) || placeholder || '—'}
                                </p>
                            )}
                        </div>
                    ))}
                </div>

                {editing && (
                    <div style={{ marginTop: '1.25rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                        <button onClick={handleSave} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.65rem 1.25rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem' }}>
                            <Check size={16} /> {saving ? 'Saving…' : 'Save Changes'}
                        </button>
                        {msg && <p style={{ fontSize: '0.85rem', color: msg.startsWith('✓') ? '#059669' : '#ef4444', fontWeight: 500 }}>{msg}</p>}
                    </div>
                )}
            </div>

            {/* Address Map Preview */}
            {form.address && (
                <div className="glass-panel" style={{ padding: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.88rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <MapPin size={15} color="var(--accent-primary)" /> Registered Address Map
                    </h3>
                    <iframe
                        title="address-map"
                        width="100%" height="200"
                        style={{ border: 'none', borderRadius: 10 }}
                        src={`https://maps.google.com/maps?q=${encodeURIComponent(form.address)}&output=embed`}
                    />
                    <a href={`https://www.google.com/maps/search/${encodeURIComponent(form.address)}`} target="_blank" rel="noopener noreferrer"
                        style={{ fontSize: '0.78rem', color: '#0284c7', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.5rem' }}>
                        <MapPin size={12} /> Open full map →
                    </a>
                </div>
            )}
        </div>
    );
}
