import { useState, useEffect, useContext } from 'react';
import api from '../../api/axios.js';
import { AuthContext } from '../../context/AuthContext';
import { Settings, Save, RefreshCw, CheckCircle2, AlertTriangle, Edit2, X } from 'lucide-react';

const PRIORITY_OPTS = ['P0', 'P1', 'P2', 'P3'];
const DEPT_OPTS = ['Electricity', 'Water Supply', 'Roads', 'Sanitation', 'Public Works', 'Billing', 'Tech Support'];

const PRIORITY_COLORS = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#10b981' };

export default function DeptMappingPanel() {
    
    const [mappings, setMappings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [editingRow, setEditingRow] = useState(null); // index of row being edited
    const [editData, setEditData] = useState({});

    useEffect(() => {
        loadMappings();
    }, []);

    const loadMappings = async () => {
        setLoading(true);
        try {
            const r = await api.get(`/api/complaints/dept-mapping`);
            setMappings(r.data);
        } catch {
            setError('Failed to load mappings');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (i) => {
        setEditingRow(i);
        setEditData({ ...mappings[i] });
    };

    const handleSaveRow = () => {
        const updated = [...mappings];
        updated[editingRow] = editData;
        setMappings(updated);
        setEditingRow(null);
        setSaved(false);
    };

    const handleSaveAll = async () => {
        setSaving(true);
        setError('');
        try {
            await api.put(`/api/complaints/dept-mapping`,
                { mappings }
            );
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (e) {
            setError(e.response?.data?.message || 'Save failed');
        } finally {
            setSaving(false);
        }
    };

    const slaToHuman = (mins) => {
        if (mins < 60) return `${mins}m`;
        if (mins < 1440) return `${Math.round(mins / 60)}h`;
        return `${Math.round(mins / 1440)}d`;
    };

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Settings size={18} color="var(--accent-primary)" /> Complaint Type → Department Mapping
                    </h3>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                        Configure how complaint types are routed to departments. Changes affect future AI auto-classification.
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <button onClick={loadMappings} disabled={loading}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.9rem', background: 'white', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        <RefreshCw size={14} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                    </button>
                    {editingRow === null && (
                        <button onClick={handleSaveAll} disabled={saving}
                            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1.1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem' }}>
                            <Save size={14} /> {saving ? 'Saving…' : 'Save All'}
                        </button>
                    )}
                </div>
            </div>

            {saved && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669', fontSize: '0.88rem' }}>
                    <CheckCircle2 size={16} /> Mappings saved successfully!
                </div>
            )}
            {error && (
                <div style={{ padding: '0.75rem 1rem', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#ef4444', fontSize: '0.88rem' }}>
                    <AlertTriangle size={16} /> {error}
                </div>
            )}

            {/* Table */}
            <div className="glass-panel" style={{ padding: '1.25rem', overflowX: 'auto' }}>
                {loading ? (
                    <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading mappings…</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                        <thead>
                            <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                                {['Complaint Type', 'Department', 'Priority', 'SLA', 'Keywords', 'Action'].map(h => (
                                    <th key={h} style={{ padding: '0.6rem 0.75rem', textAlign: 'left', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {mappings.map((m, i) => {
                                const isEditing = editingRow === i;
                                return (
                                    <tr key={m.complaintType || i} style={{ borderBottom: '1px solid var(--border-color)', background: isEditing ? 'rgba(2,132,199,0.04)' : 'transparent', transition: 'background 0.15s' }}>
                                        <td style={{ padding: '0.75rem', fontWeight: 600 }}>
                                            {isEditing ? (
                                                <input className="input-base" value={editData.complaintType}
                                                    onChange={e => setEditData(d => ({ ...d, complaintType: e.target.value }))}
                                                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem', height: 'auto' }} />
                                            ) : m.complaintType}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {isEditing ? (
                                                <select className="input-base" value={editData.department}
                                                    onChange={e => setEditData(d => ({ ...d, department: e.target.value }))}
                                                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem', height: 'auto', cursor: 'pointer' }}>
                                                    {DEPT_OPTS.map(d => <option key={d}>{d}</option>)}
                                                </select>
                                            ) : (
                                                <span style={{ padding: '0.25rem 0.65rem', background: 'rgba(2,132,199,0.08)', color: '#0284c7', borderRadius: 100, fontSize: '0.8rem', fontWeight: 600 }}>{m.department}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {isEditing ? (
                                                <select className="input-base" value={editData.priority}
                                                    onChange={e => setEditData(d => ({ ...d, priority: e.target.value }))}
                                                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem', height: 'auto', cursor: 'pointer' }}>
                                                    {PRIORITY_OPTS.map(p => <option key={p}>{p}</option>)}
                                                </select>
                                            ) : (
                                                <span style={{ padding: '0.2rem 0.55rem', background: `${PRIORITY_COLORS[m.priority]}15`, color: PRIORITY_COLORS[m.priority], borderRadius: 100, fontSize: '0.78rem', fontWeight: 700 }}>{m.priority}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {isEditing ? (
                                                <input type="number" className="input-base" value={editData.slaMins}
                                                    onChange={e => setEditData(d => ({ ...d, slaMins: parseInt(e.target.value) || 1440 }))}
                                                    style={{ fontSize: '0.85rem', padding: '0.35rem 0.6rem', height: 'auto', width: 90 }} min={30} step={30} />
                                            ) : (
                                                <span style={{ fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{slaToHuman(m.slaMins)}</span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem', maxWidth: 200 }}>
                                            {isEditing ? (
                                                <input className="input-base" value={(editData.keywords || []).join(', ')}
                                                    onChange={e => setEditData(d => ({ ...d, keywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) }))}
                                                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem', height: 'auto' }}
                                                    placeholder="kw1, kw2, kw3" />
                                            ) : (
                                                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                    {(m.keywords || []).join(', ') || '—'}
                                                </span>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {isEditing ? (
                                                <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                    <button onClick={handleSaveRow}
                                                        style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.7rem', background: '#059669', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                                        <Save size={13} /> Save
                                                    </button>
                                                    <button onClick={() => setEditingRow(null)}
                                                        style={{ padding: '0.35rem 0.5rem', background: 'none', border: '1px solid var(--border-color)', borderRadius: 6, cursor: 'pointer', color: 'var(--text-muted)' }}>
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <button onClick={() => handleEdit(i)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', padding: '0.35rem 0.7rem', background: 'rgba(2,132,199,0.08)', color: '#0284c7', border: '1px solid rgba(2,132,199,0.2)', borderRadius: 6, cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600 }}>
                                                    <Edit2 size={12} /> Edit
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                💡 Edit rows inline then click <strong>Save All</strong> to persist. SLA is in minutes (1440 = 24 hours).
            </p>
            <style>{`@keyframes spin { from { transform:rotate(0deg); } to { transform:rotate(360deg); } }`}</style>
        </div>
    );
}
