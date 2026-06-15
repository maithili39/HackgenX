import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { Bell, CheckCircle, AlertTriangle, MessageSquare, Star, X, Mail, Phone, ToggleLeft, ToggleRight } from 'lucide-react';

const MOCK_NOTIFICATIONS = [
    { id: 1, type: 'status', title: 'Complaint CMP-20260224-1421 Updated', message: 'Your complaint has been assigned to Field Worker Rajesh Kumar.', time: '2 hours ago', read: false, icon: CheckCircle, color: '#10b981' },
    { id: 2, type: 'escalation', title: 'SLA Escalation Alert', message: 'Complaint CMP-20260223-0932 has been escalated due to SLA breach. A senior officer has been notified.', time: '5 hours ago', read: false, icon: AlertTriangle, color: '#ef4444' },
    { id: 3, type: 'comment', title: 'Officer Comment Added', message: 'Officer Priya Singh commented: "Team dispatched. Issue will be resolved within 2 hours."', time: '1 day ago', read: false, icon: MessageSquare, color: '#3b82f6' },
    { id: 4, type: 'feedback', title: 'Rate your resolution!', message: 'Complaint CMP-20260222-0544 was resolved. Please rate the resolution quality.', time: '2 days ago', read: true, icon: Star, color: '#f59e0b' },
    { id: 5, type: 'status', title: 'Complaint Resolved', message: 'Great news! Your water supply complaint CMP-20260220-0211 has been successfully resolved.', time: '4 days ago', read: true, icon: CheckCircle, color: '#059669' },
];

export default function Notifications({ unreadCount, setUnreadCount, profile }) {
    const { token } = useContext(AuthContext);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [prefs, setPrefs] = useState({ notifyEmail: profile?.notifyEmail ?? true, notifySMS: profile?.notifySMS ?? false });
    const [savingPrefs, setSavingPrefs] = useState(false);
    const [prefsSaved, setPrefsSaved] = useState(false);

    useEffect(() => {
        if (profile) setPrefs({ notifyEmail: profile.notifyEmail ?? true, notifySMS: profile.notifySMS ?? false });
    }, [profile]);

    const markAllRead = () => {
        setNotifications(n => n.map(notif => ({ ...notif, read: true })));
        setUnreadCount(0);
    };

    const dismiss = (id) => {
        const notif = notifications.find(n => n.id === id);
        if (notif && !notif.read) setUnreadCount(u => Math.max(0, u - 1));
        setNotifications(n => n.filter(n => n.id !== id));
    };

    const togglePref = (key) => {
        setPrefs(p => ({ ...p, [key]: !p[key] }));
        setPrefsSaved(false);
    };

    const savePrefs = async () => {
        setSavingPrefs(true);
        try {
            await axios.put(`${__API_BASE__}/api/auth/profile`, prefs, { headers: { Authorization: `Bearer ${token}` } });
            setPrefsSaved(true);
            setTimeout(() => setPrefsSaved(false), 3000);
        } catch { } finally { setSavingPrefs(false); }
    };

    const unread = notifications.filter(n => !n.read).length;

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: 700 }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <h2 style={{ fontSize: '1rem', fontWeight: 700 }}>Notifications</h2>
                    {unread > 0 && (
                        <span style={{ background: '#ef4444', color: 'white', fontSize: '0.7rem', fontWeight: 700, borderRadius: 100, padding: '1px 8px' }}>
                            {unread} new
                        </span>
                    )}
                </div>
                {unread > 0 && (
                    <button onClick={markAllRead}
                        style={{ fontSize: '0.8rem', color: '#0284c7', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                        Mark all as read
                    </button>
                )}
            </div>

            {/* Notification list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {notifications.length === 0 && (
                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)', background: 'var(--bg-panel)', borderRadius: 14, border: '1px solid var(--border-color)' }}>
                        <Bell size={36} style={{ opacity: 0.3, display: 'block', margin: '0 auto 0.5rem' }} />
                        <p>All caught up! No notifications.</p>
                    </div>
                )}
                {notifications.map(notif => {
                    const Icon = notif.icon;
                    return (
                        <div key={notif.id}
                            style={{
                                display: 'flex', gap: '1rem', padding: '1rem 1.25rem',
                                background: notif.read ? 'var(--bg-panel)' : `${notif.color}08`,
                                border: `1px solid ${notif.read ? 'var(--border-color)' : notif.color + '25'}`,
                                borderRadius: 12, position: 'relative', transition: 'all 0.2s',
                                borderLeft: `4px solid ${notif.read ? 'var(--border-color)' : notif.color}`
                            }}>
                            {/* Icon */}
                            <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${notif.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '0.1rem' }}>
                                <Icon size={17} color={notif.color} />
                            </div>
                            {/* Content */}
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                                    <p style={{ fontWeight: notif.read ? 500 : 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>{notif.title}</p>
                                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{notif.time}</span>
                                </div>
                                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{notif.message}</p>
                            </div>
                            {/* Dismiss */}
                            <button onClick={() => dismiss(notif.id)}
                                style={{ position: 'absolute', top: '0.6rem', right: '0.75rem', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px', borderRadius: 4, opacity: 0.6 }}>
                                <X size={14} />
                            </button>
                            {/* Unread dot */}
                            {!notif.read && (
                                <div style={{ position: 'absolute', top: 12, right: 32, width: 8, height: 8, borderRadius: '50%', background: notif.color }} />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Notification Preferences */}
            <div className="glass-panel" style={{ padding: '1.25rem' }}>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '1rem' }}>⚙️ Notification Preferences</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                        { key: 'notifyEmail', label: 'Email Notifications', subtext: 'Get status updates via email', icon: Mail },
                        { key: 'notifySMS', label: 'SMS Notifications', subtext: 'Get alerts via SMS / OTP', icon: Phone },
                    ].map(({ key, label, subtext, icon: Icon }) => (
                        <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-page)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <Icon size={16} color="var(--accent-primary)" />
                                <div>
                                    <p style={{ fontSize: '0.88rem', fontWeight: 600 }}>{label}</p>
                                    <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{subtext}</p>
                                </div>
                            </div>
                            <button onClick={() => togglePref(key)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: prefs[key] ? '#0284c7' : '#cbd5e1', transition: 'color 0.2s' }}>
                                {prefs[key] ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                            </button>
                        </div>
                    ))}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '1rem' }}>
                    <button onClick={savePrefs} disabled={savingPrefs}
                        style={{ padding: '0.5rem 1rem', background: '#0284c7', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}>
                        {savingPrefs ? 'Saving…' : 'Save Preferences'}
                    </button>
                    {prefsSaved && <span style={{ fontSize: '0.82rem', color: '#059669', fontWeight: 500 }}>✓ Saved!</span>}
                </div>
            </div>
        </div>
    );
}
