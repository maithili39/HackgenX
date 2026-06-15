import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Users, HardHat, BadgeCheck, Crown, ShieldAlert } from 'lucide-react';

const ROLES = [
    { key: 'citizen', label: 'Citizen', icon: Users, color: 'var(--accent-primary)', needsDept: false },
    { key: 'field_worker', label: 'Field Worker', icon: HardHat, color: '#059669', needsDept: true },
    { key: 'officer', label: 'Officer', icon: BadgeCheck, color: '#7c3aed', needsDept: true },
    { key: 'commissioner', label: 'Commissioner', icon: Crown, color: '#dc2626', needsDept: false },
    { key: 'admin', label: 'Admin', icon: ShieldAlert, color: 'var(--text-primary)', needsDept: false },
];

const DEPARTMENTS = ['Electricity', 'Water Supply', 'Roads', 'Sanitation', 'Public Works', 'Billing', 'Tech Support'];

const ROLE_REDIRECTS = {
    citizen: '/dashboard', field_worker: '/field-worker', officer: '/officer', commissioner: '/commissioner', admin: '/admin'
};

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('citizen');
    const [department, setDepartment] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showOtp, setShowOtp] = useState(false);
    const [otp, setOtp] = useState('');
    const [otpSending, setOtpSending] = useState(false);
    const [otpPreviewUrl, setOtpPreviewUrl] = useState('');

    // Removed API_BASE since we use __API_BASE__ globally

    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const activeRole = ROLES.find(r => r.key === role);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (activeRole?.needsDept && !department) {
            setError('Please select a department.');
            return;
        }

        // ── Step 1: Send OTP for ALL roles ────────────────────────────────────
        if (!showOtp) {
            setOtpSending(true);
            setError('');
            try {
                const res = await axios.post(`${__API_BASE__}/api/auth/send-otp`, { email, name, role });
                const data = res.data;
                setOtpPreviewUrl(data.previewUrl || '');
                setShowOtp(true);
            } catch (err) {
                setError(err.message || 'Could not send OTP. Check server.');
            } finally {
                setOtpSending(false);
            }
            return;
        }

        // ── Step 2: Verify OTP ─────────────────────────────────────────────────

        setLoading(true);
        setError('');
        try {
            const user = await register(name, email, password, role, department || null, otp);
            const dest = ROLE_REDIRECTS[user.role] || '/';
            if (user.role === 'citizen') {
                navigate(dest, { state: { openSection: 'submit' } });
            } else {
                navigate(dest);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Create Account</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select your role to register</p>

                {/* Role Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {ROLES.map(r => {
                        const Icon = r.icon;
                        const isActive = role === r.key;
                        return (
                            <button key={r.key} type="button" onClick={() => { setRole(r.key); setDepartment(''); setShowOtp(false); setOtp(''); setError(''); setOtpPreviewUrl(''); }}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.75rem 0.25rem', border: `2px solid ${isActive ? r.color : 'var(--border-color)'}`,
                                    background: isActive ? `${r.color}15` : 'transparent',
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                    transition: 'all 0.2s', color: isActive ? r.color : 'var(--text-muted)'
                                }}>
                                <Icon size={18} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.label}</span>
                            </button>
                        );
                    })}
                </div>

                {error && <div style={{ color: 'var(--status-critical)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    {!showOtp ? (
                        <>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full Name</label>
                                <input type="text" className="input-base" value={name} onChange={e => setName(e.target.value)} required placeholder="Enter your full name" autoComplete="name" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                                <input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} required placeholder={`${role}@civicsense.gov`} autoComplete="username email" />
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                                <input type="password" className="input-base" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="new-password" />
                            </div>

                            {activeRole?.needsDept && (
                                <div className="animate-fade-in">
                                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Department *</label>
                                    <select className="input-base" value={department} onChange={e => setDepartment(e.target.value)} required>
                                        <option value="">Select Department</option>
                                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                                    </select>
                                </div>
                            )}

                                    <button type="submit" className="btn-primary" disabled={loading || otpSending}
                                style={{ marginTop: '0.5rem', background: activeRole?.color, opacity: (loading || otpSending) ? 0.7 : 1 }}>
                                {otpSending ? 'Sending OTP…' : loading ? 'Creating account...' : `Register as ${activeRole?.label}`}
                            </button>
                        </>
                    ) : (
                        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                <BadgeCheck size={32} style={{ color: 'var(--accent-primary)', margin: '0 auto 0.5rem' }} />
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '0.25rem', color: 'var(--text-primary)' }}>Verify your Email</h3>
                                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>An OTP has been sent to <strong>{email}</strong>.</p>
                                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Role: <strong style={{ color: activeRole?.color }}>{activeRole?.label}</strong></p>
                                {otpPreviewUrl && (
                                    <a href={otpPreviewUrl} target="_blank" rel="noopener noreferrer"
                                        style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', textDecoration: 'underline', display: 'block', marginTop: '0.4rem' }}>
                                        📬 Preview email (Ethereal – dev only)
                                    </a>
                                )}
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Enter OTP</label>
                                <input type="text" className="input-base" value={otp} onChange={e => setOtp(e.target.value)} required placeholder="Enter 6-digit OTP" maxLength={6} style={{ textAlign: 'center', fontSize: '1.2rem', letterSpacing: '0.2em' }} />
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button type="button" onClick={() => setShowOtp(false)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
                                <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 2, background: activeRole?.color, opacity: loading ? 0.7 : 1 }}>
                                    {loading ? 'Verifying...' : 'Verify & Register'}
                                </button>
                            </div>
                        </div>
                    )}
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Sign In</Link>
                </p>
            </div>
        </div>
    );
}
