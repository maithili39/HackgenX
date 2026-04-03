import { Clock, Shield } from 'lucide-react';

export default function AuditLogPanel({ auditLog = [] }) {
    const roleColors = {
        citizen: '#3b82f6',
        field_worker: '#5eb88a',
        officer: '#7c3aed',
        commissioner: '#dc2626',
        admin: '#212121',
        system: '#94a3b8'
    };

    const roleLabels = {
        citizen: 'Citizen',
        field_worker: 'Field Worker',
        officer: 'Officer',
        commissioner: 'Commissioner',
        admin: 'Admin',
        system: 'System'
    };

    return (
        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(2,132,199,0.15)' }}>
            <h3 className="flex-row gap-2" style={{ marginBottom: '1.25rem', fontSize: '0.95rem', color: 'var(--accent-primary)' }}>
                <Shield size={18} /> Audit Trail
                <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                    {auditLog.length} event{auditLog.length !== 1 ? 's' : ''}
                </span>
            </h3>

            <div className="flex-col" style={{ gap: 0, position: 'relative' }}>
                {/* Vertical line */}
                {auditLog.length > 1 && (
                    <div style={{ position: 'absolute', left: '11px', top: '24px', bottom: '24px', width: '2px', background: 'var(--border-color)', zIndex: 0 }} />
                )}

                {[...auditLog].reverse().map((log, i) => {
                    const color = roleColors[log.performedByRole] || '#94a3b8';
                    return (
                        <div key={i} className="flex-row" style={{ gap: '0.75rem', paddingBottom: i < auditLog.length - 1 ? '1.25rem' : 0, position: 'relative', zIndex: 1 }}>
                            {/* Dot */}
                            <div style={{ width: 24, height: 24, borderRadius: '50%', background: `${color}20`, border: `2px solid ${color}`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                            </div>

                            {/* Content */}
                            <div style={{ flex: 1, paddingTop: '0.1rem' }}>
                                <div className="flex-row justify-between" style={{ flexWrap: 'wrap', gap: '0.25rem', marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-primary)' }}>{log.action}</span>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                                        <Clock size={11} />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                                <div className="flex-row gap-2" style={{ marginBottom: '0.2rem' }}>
                                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color, padding: '0.1rem 0.4rem', background: `${color}12`, borderRadius: '100px' }}>
                                        {roleLabels[log.performedByRole] || log.performedByRole}
                                    </span>
                                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{log.performedBy}</span>
                                </div>
                                {log.note && (
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, paddingLeft: '0.25rem', borderLeft: `2px solid ${color}30` }}>
                                        {log.note}
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
