import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';
import { AlertTriangle, X, Clock } from 'lucide-react';

const PRIORITY_COLORS = { P0: '#ef4444', P1: '#f59e0b', P2: '#3b82f6', P3: '#10b981' };
const ESCALATION_LABELS = ['Normal', 'Officer Level', 'Commissioner Level', 'Critical'];

export default function SLAAlertPanel() {
    const [alerts, setAlerts] = useState([]);
    const [dismissed, setDismissed] = useState(new Set());


    useSocket({
        'sla_breach': (alert) => {
            setAlerts(prev => {
                const exists = prev.find(a => a._id === alert._id);
                if (exists) {
                    return prev.map(a => a._id === alert._id ? { ...a, escalationLevel: alert.escalationLevel } : a);
                }
                return [{ ...alert, receivedAt: new Date() }, ...prev.slice(0, 19)];
            });
            toast.error(`⚠️ SLA Breach Alert: Complaint ${alert.complaintId} (${alert.department})`, { position: 'top-right' });
        }
    });

    const visible = alerts.filter(a => !dismissed.has(a._id));

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', border: visible.length > 0 ? '1px solid rgba(239,68,68,0.3)' : '1px solid var(--border-color)' }}>
            <div className="flex-row justify-between" style={{ marginBottom: '1.25rem' }}>
                <h3 className="flex-row gap-2" style={{ fontSize: '1rem', color: visible.length > 0 ? '#ef4444' : 'var(--text-primary)' }}>
                    <AlertTriangle size={18} />
                    SLA Breach Alerts
                    {visible.length > 0 && (
                        <span style={{ marginLeft: '0.25rem', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: '#ef4444', color: 'white', borderRadius: '100px' }}>
                            {visible.length}
                        </span>
                    )}
                </h3>
                {visible.length > 0 && (
                    <button onClick={() => setDismissed(new Set(alerts.map(a => a._id)))}
                        style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
                        Clear all
                    </button>
                )}
            </div>

            {visible.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.75rem' }}>
                        <AlertTriangle size={20} color="#10b981" />
                    </div>
                    <p style={{ fontSize: '0.88rem' }}>All SLAs on track ✓</p>
                    <p style={{ fontSize: '0.78rem', marginTop: '0.25rem' }}>Alerts appear here in real-time</p>
                </div>
            ) : (
                <div className="flex-col" style={{ gap: '0.6rem', maxHeight: 280, overflowY: 'auto' }}>
                    {visible.map((a, i) => {
                        const color = PRIORITY_COLORS[a.priority] || '#ef4444';
                        return (
                            <div key={a._id || i} style={{ padding: '0.9rem', background: `${color}08`, borderRadius: 'var(--radius-sm)', border: `1px solid ${color}30`, position: 'relative' }}
                                className="animate-fade-in">
                                <button onClick={() => setDismissed(prev => new Set([...prev, a._id]))}
                                    style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '0.1rem' }}>
                                    <X size={13} />
                                </button>
                                <div className="flex-row gap-2" style={{ marginBottom: '0.35rem', flexWrap: 'wrap' }}>
                                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{a.complaintId}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color, padding: '0.1rem 0.4rem', background: `${color}15`, borderRadius: '100px' }}>{a.priority}</span>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#dc2626', padding: '0.1rem 0.4rem', background: 'rgba(220,38,38,0.1)', borderRadius: '100px' }}>
                                        Escalation: {ESCALATION_LABELS[a.escalationLevel] || `Level ${a.escalationLevel}`}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.83rem', color: 'var(--text-primary)', marginBottom: '0.3rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                    {a.description}
                                </p>
                                <div className="flex-row gap-4" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                    <span>{a.department}</span>
                                    <span className="flex-row gap-1"><Clock size={11} /> {a.receivedAt ? new Date(a.receivedAt).toLocaleTimeString() : 'Now'}</span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
