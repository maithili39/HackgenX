import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Map, MapPin, Plus, Trash2, Edit2, CheckCircle } from 'lucide-react';

export default function WardManagementPanel() {
    const { token } = useContext(AuthContext);
    const [wards, setWards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', coords: '' });

    const fetchWards = async () => {
        try {
            const res = await axios.get(`${__API_BASE__}/api/wards`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setWards(res.data);
        } catch (err) {
            console.error('Error fetching wards:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (token) fetchWards();
    }, [token]);

    const handleSaveWard = async (e) => {
        e.preventDefault();
        try {
            // Parse coords string: "lat,lng; lat,lng"
            const parsedCoords = formData.coords.split(';').map(pair => {
                const [lat, lng] = pair.split(',').map(n => parseFloat(n.trim()));
                return { lat, lng };
            });

            await axios.post(`${__API_BASE__}/api/wards`, {
                name: formData.name,
                boundaries: parsedCoords
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            setIsAdding(false);
            setFormData({ name: '', coords: '' });
            fetchWards();
        } catch (err) {
            alert(err.response?.data?.message || 'Error saving ward');
        }
    };

    return (
        <div className="flex-col gap-6 animate-fade-in" style={{ padding: '0.5rem' }}>
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
                <div className="flex-row justify-between" style={{ marginBottom: '1.5rem' }}>
                    <h2 className="flex-row gap-2" style={{ fontSize: '1.25rem', color: '#1e293b' }}>
                        <Map size={22} color="#0ea5e9" /> City Ward Boundaries
                    </h2>
                    <button onClick={() => setIsAdding(!isAdding)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#0ea5e9' }}>
                        <Plus size={16} /> Add New Ward
                    </button>
                </div>

                {isAdding && (
                    <form onSubmit={handleSaveWard} style={{ padding: '1.25rem', background: 'rgba(14,165,233,0.05)', borderRadius: '12px', border: '1px solid rgba(14,165,233,0.2)', marginBottom: '1.5rem' }}>
                        <h3 style={{ fontSize: '1rem', marginBottom: '1rem', color: '#0284c7' }}>Create New Ward</h3>
                        <div className="flex-col gap-3">
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Ward Name</label>
                                <input className="input-base" type="text" placeholder="e.g. Ward A" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
                            </div>
                            <div>
                                <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Polygon Coordinates (lat,lng format separated by semicolons)</label>
                                <textarea className="input-base" rows="3" placeholder="28.61,77.20; 28.62,77.21; 28.61,77.22" value={formData.coords} onChange={e => setFormData({ ...formData, coords: e.target.value })} required />
                            </div>
                            <div className="flex-row justify-end gap-3 mt-2">
                                <button type="button" onClick={() => setIsAdding(false)} style={{ padding: '0.5rem 1rem', border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 500 }}>Cancel</button>
                                <button type="submit" className="btn-primary" style={{ background: '#0ea5e9' }}>Save Ward</button>
                            </div>
                        </div>
                    </form>
                )}

                {loading ? (
                    <p style={{ color: 'var(--text-muted)' }}>Loading wards...</p>
                ) : wards.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                        <MapPin size={40} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                        <p>No wards defined yet.</p>
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem' }}>
                        {wards.map(ward => (
                            <div key={ward._id} style={{ padding: '1.25rem', border: '1px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-panel)' }}>
                                <div className="flex-row justify-between" style={{ marginBottom: '0.75rem' }}>
                                    <h3 className="flex-row gap-2" style={{ fontSize: '1.1rem', color: '#1e293b' }}><MapPin size={18} color="#0ea5e9" /> {ward.name}</h3>
                                    <span style={{ fontSize: '0.75rem', background: '#e0f2fe', color: '#0284c7', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                                        {ward.boundaries?.length || 0} Points
                                    </span>
                                </div>
                                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace', background: 'rgba(0,0,0,0.03)', padding: '0.75rem', borderRadius: '8px', maxHeight: '100px', overflowY: 'auto' }}>
                                    {ward.boundaries.map((b, i) => (
                                        <div key={i}>{b.lat.toFixed(4)}, {b.lng.toFixed(4)}</div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
