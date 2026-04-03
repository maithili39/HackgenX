import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Users, ShieldAlert, HardHat, BadgeCheck, Crown } from 'lucide-react';

const ROLES = [
    { key: 'citizen', label: 'Citizen', icon: Users, color: 'var(--accent-primary)' },
    { key: 'field_worker', label: 'Field Worker', icon: HardHat, color: '#059669' },
    { key: 'officer', label: 'Officer', icon: BadgeCheck, color: '#7c3aed' },
    { key: 'commissioner', label: 'Commissioner', icon: Crown, color: '#dc2626' },
    { key: 'admin', label: 'Admin', icon: ShieldAlert, color: 'var(--text-primary)' },
];

const ROLE_REDIRECTS = {
    citizen: '/dashboard',
    field_worker: '/field-worker',
    officer: '/officer',
    commissioner: '/commissioner',
    admin: '/admin',
};

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('citizen');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const activeRole = ROLES.find(r => r.key === role);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const user = await login(email, password);
            if (user.role !== role) {
                setError(`Account is registered as "${user.role}". Redirecting...`);
            }
            setTimeout(() => {
                navigate(ROLE_REDIRECTS[user.role] || '/');
            }, user.role !== role ? 1500 : 0);
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Check credentials.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel animate-fade-in" style={{ maxWidth: '440px', width: '100%', padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Welcome Back</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Select your role to sign in</p>

                {/* Role Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem', marginBottom: '1.5rem' }}>
                    {ROLES.map(r => {
                        const Icon = r.icon;
                        const isActive = role === r.key;
                        return (
                            <button
                                key={r.key}
                                type="button"
                                onClick={() => setRole(r.key)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                                    padding: '0.75rem 0.25rem', border: `2px solid ${isActive ? r.color : 'var(--border-color)'}`,
                                    background: isActive ? `${r.color}15` : 'transparent',
                                    borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                                    transition: 'all 0.2s', color: isActive ? r.color : 'var(--text-muted)'
                                }}
                            >
                                <Icon size={18} />
                                <span style={{ fontSize: '0.65rem', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.label}</span>
                            </button>
                        );
                    })}
                </div>

                {error && <div style={{ color: 'var(--status-critical)', marginBottom: '1rem', textAlign: 'center', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)' }}>{error}</div>}

                <form onSubmit={handleSubmit} className="flex-col gap-4">
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Email Address</label>
                        <input type="email" className="input-base" value={email} onChange={e => setEmail(e.target.value)} required placeholder={`${role}@civicsense.gov`} autoComplete="username email" />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Password</label>
                        <input type="password" className="input-base" value={password} onChange={e => setPassword(e.target.value)} required placeholder="••••••••" autoComplete="current-password" />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}
                        style={{ marginTop: '0.5rem', background: activeRole?.color, opacity: loading ? 0.7 : 1 }}>
                        {loading ? 'Signing in...' : `Sign In as ${activeRole?.label}`}
                    </button>
                </form>

                <p style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                    Don't have an account? <Link to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none' }}>Register here</Link>
                </p>
            </div>
        </div>
    );
}
