import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios.js';

export default function ResetPassword() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const token = searchParams.get('token');

    const [newPassword, setNewPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirm) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }
        setLoading(true);
        setError('');
        try {
            await api.post('/api/auth/reset-password', { token, newPassword });
            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
                <div className="glass-panel" style={{ maxWidth: 400, width: '100%', padding: '2.5rem', textAlign: 'center' }}>
                    <p style={{ color: 'var(--status-critical)' }}>Invalid or missing reset token.</p>
                    <Link to="/login" style={{ color: 'var(--accent-primary)', marginTop: '1rem', display: 'inline-block' }}>Back to Login</Link>
                </div>
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <div className="glass-panel animate-fade-in" style={{ maxWidth: 400, width: '100%', padding: '2.5rem' }}>
                <h2 style={{ marginBottom: '0.5rem', textAlign: 'center' }}>Reset Password</h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    Enter your new password below.
                </p>

                {success ? (
                    <div style={{ textAlign: 'center' }}>
                        <p style={{ color: 'var(--status-success)', marginBottom: '1rem' }}>
                            Password reset successfully! Redirecting to login…
                        </p>
                        <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Go to Login</Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex-col gap-4">
                        {error && (
                            <div style={{ color: 'var(--status-critical)', fontSize: '0.9rem', padding: '0.5rem', background: 'rgba(239,68,68,0.1)', borderRadius: 'var(--radius-sm)', textAlign: 'center' }}>
                                {error}
                            </div>
                        )}
                        <input
                            type="password"
                            placeholder="New password"
                            value={newPassword}
                            onChange={e => setNewPassword(e.target.value)}
                            required
                            className="input-field"
                            style={{ width: '100%' }}
                        />
                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            required
                            className="input-field"
                            style={{ width: '100%' }}
                        />
                        <button type="submit" className="btn-primary" disabled={loading} style={{ width: '100%' }}>
                            {loading ? 'Resetting…' : 'Reset Password'}
                        </button>
                        <p style={{ textAlign: 'center', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                            <Link to="/login" style={{ color: 'var(--accent-primary)' }}>Back to Login</Link>
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
