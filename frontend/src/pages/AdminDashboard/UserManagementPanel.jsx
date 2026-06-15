import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { UserPlus, UserCheck, Shield, HardHat, Mail, Briefcase, MapPin, Trash2, ShieldAlert } from 'lucide-react';

export default function UserManagementPanel() {
    const { token } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: '', email: '', password: '', role: 'officer', department: 'Electricity', ward: ''
    });
    const [message, setMessage] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const departments = ['Electricity', 'Water Supply', 'Roads', 'Sanitation', 'Public Works', 'Billing', 'Tech Support'];

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${__API_BASE__}/api/users`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchUsers();
    }, [token]);

    const handleCreateUser = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setMessage('');
        try {
            await axios.post(`${__API_BASE__}/api/users`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setMessage('User created successfully!');
            setFormData({ ...formData, name: '', email: '', password: '' });
            fetchUsers();
        } catch (err) {
            setMessage(err.response?.data?.message || 'Error creating user');
        } finally {
            setIsSubmitting(false);
        }
    };

    const getRoleIcon = (role) => {
        switch (role) {
            case 'admin': return <ShieldAlert size={16} color="#ef4444" />;
            case 'commissioner': return <Shield size={16} color="#8b5cf6" />;
            case 'officer': return <Briefcase size={16} color="#3b82f6" />;
            case 'field_worker': return <HardHat size={16} color="#10b981" />;
            default: return <UserCheck size={16} color="#94a3b8" />;
        }
    };

    const formatRole = (role) => role.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return (
        <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem', borderLeft: '4px solid #3b82f6' }}>
                <h2 className="flex-row gap-2" style={{ fontSize: '1.25rem', marginBottom: '1rem', color: '#1e293b' }}>
                    <UserPlus size={22} color="#3b82f6" /> Create Staff Account
                </h2>
                <form onSubmit={handleCreateUser} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div className="flex-col">
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Full Name</label>
                        <input className="input-base" type="text" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                    </div>
                    <div className="flex-col">
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Email</label>
                        <input className="input-base" type="email" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
                    </div>
                    <div className="flex-col">
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Password</label>
                        <input className="input-base" type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} required />
                    </div>
                    <div className="flex-col">
                        <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Role</label>
                        <select className="input-base" value={formData.role} onChange={e => setFormData({ ...formData, role: e.target.value })}>
                            <option value="officer">Ward Officer</option>
                            <option value="field_worker">Field Worker</option>
                            <option value="commissioner">Commissioner</option>
                            <option value="admin">System Admin</option>
                        </select>
                    </div>

                    {['officer', 'field_worker'].includes(formData.role) && (
                        <div className="flex-col">
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Department</label>
                            <select className="input-base" value={formData.department} onChange={e => setFormData({ ...formData, department: e.target.value })}>
                                {departments.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                        </div>
                    )}
                    
                    {formData.role === 'officer' && (
                        <div className="flex-col">
                            <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ward Assignment</label>
                            <input className="input-base" type="text" placeholder="e.g. Ward A" value={formData.ward} onChange={e => setFormData({ ...formData, ward: e.target.value })} />
                        </div>
                    )}

                    <div className="flex-col justify-end">
                        <button type="submit" disabled={isSubmitting} className="btn-primary" style={{ height: '42px', width: '100%' }}>
                            {isSubmitting ? 'Creating...' : 'Create Account'}
                        </button>
                    </div>
                </form>
                {message && (
                    <div style={{ marginTop: '1rem', padding: '0.75rem', borderRadius: '8px', background: message.includes('success') ? '#d1fae5' : '#fee2e2', color: message.includes('success') ? '#059669' : '#dc2626', fontSize: '0.9rem', fontWeight: 500 }}>
                        {message}
                    </div>
                )}
            </div>

            <div className="glass-panel" style={{ padding: '1.5rem', overflowX: 'auto' }}>
                <h2 style={{ fontSize: '1.1rem', marginBottom: '1.25rem' }}>Staff Directory</h2>
                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading users...</p>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-muted)', textAlign: 'left' }}>
                                <th style={{ padding: '0.75rem' }}>Name</th>
                                <th style={{ padding: '0.75rem' }}>Role</th>
                                <th style={{ padding: '0.75rem' }}>Department</th>
                                <th style={{ padding: '0.75rem' }}>Ward</th>
                                <th style={{ padding: '0.75rem' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ fontWeight: 600 }}>{u.name}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}><Mail size={12}/> {u.email}</div>
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 500 }}>
                                            {getRoleIcon(u.role)} {formatRole(u.role)}
                                        </div>
                                    </td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>{u.department || '—'}</td>
                                    <td style={{ padding: '0.75rem', color: 'var(--text-secondary)' }}>
                                        {u.ward ? <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}><MapPin size={12}/> {u.ward}</span> : '—'}
                                    </td>
                                    <td style={{ padding: '0.75rem' }}>
                                        {u.isVerified ? 
                                            <span style={{ padding: '2px 8px', background: '#d1fae5', color: '#059669', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>Verified</span> : 
                                            <span style={{ padding: '2px 8px', background: '#fef3c7', color: '#d97706', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 600 }}>Pending</span>
                                        }
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
