import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { useNavigate, useLocation, Routes, Route, Navigate } from 'react-router-dom';
import Overview from './Overview';
import Profile from './Profile';
import MapView from './MapView';
import Analytics from './Analytics';
import Notifications, { MOCK_NOTIFICATIONS } from './Notifications';
import FeedbackRating from './FeedbackRating';
import InfraHealth from './InfraHealth';
import SubmitComplaintSection from './SubmitComplaintSection';
import AIAssistantWidget from '../../components/AIAssistantWidget';
import api from '../../api/axios.js';
import toast from 'react-hot-toast';
import { useSocket } from '../../hooks/useSocket';
import {
    LayoutDashboard, User, Map, BarChart2, Bell, Star, Activity,
    LogOut, ChevronLeft, ChevronRight, ClipboardList, Menu, X, FilePlus
} from 'lucide-react';

const NAV_ITEMS = [
    { id: 'submit', label: 'File Grievance', icon: FilePlus, highlight: true },
    { id: 'overview', label: 'My Complaints', icon: LayoutDashboard },
    { id: 'profile', label: 'My Profile', icon: User },
    { id: 'map', label: 'Map View', icon: Map },
    { id: 'analytics', label: 'Analytics', icon: BarChart2 },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'feedback', label: 'Feedback', icon: Star },
    { id: 'health', label: 'Ward Health', icon: Activity },
];

const SECTION_TITLES = {
    submit: 'File a Grievance',
    overview: 'My Complaints',
    profile: 'My Profile',
    map: 'Map View',
    analytics: 'Analytics',
    notifications: 'Notifications',
    feedback: 'Feedback & Rating',
    health: 'Ward Health Score',
};

export default function CitizenDashboard() {
    const { user, logout, } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();

    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
    const [unreadCount, setUnreadCount] = useState(3);
    const [profile, setProfile] = useState(null);

    const activeSection = location.pathname.split('/').pop() || 'submit';

    useEffect(() => {
        if (!user) return;
        api.get(`/api/auth/me`).then(r => setProfile(r.data)).catch(() => { });
    }, [user]);

    useSocket(user ? {
        [`complaint_updated_${user.id}`]: (updated) => {
            toast.success(`Complaint status changed to: ${updated.status}`, {
                icon: '🔄',
                style: { borderRadius: '10px', background: '#333', color: '#fff' }
            });
            // Also add to notifications list
            setNotifications(prev => [{
                id: Date.now(),
                type: 'status',
                title: `Complaint Updated: ${updated.status}`,
                message: `Your complaint is now marked as ${updated.status}.`,
                time: 'Just now',
                read: false,
                icon: Activity, // Using Activity icon from lucide-react
                color: '#10b981'
            }, ...prev]);
            setUnreadCount(u => u + 1);
        }
    } : {});

    const handleLogout = () => { logout(); navigate('/login'); };

    const navTo = (id) => {
        navigate(`/dashboard/${id}`);
        setMobileOpen(false);
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page)', fontFamily: "'Inter', sans-serif" }}>
            {/* Mobile overlay */}
            {mobileOpen && (
                <div onClick={() => setMobileOpen(false)}
                    style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 40 }} />
            )}

            {/* Sidebar */}
            <aside style={{
                width: sidebarCollapsed ? '72px' : '240px',
                background: '#212121',
                display: 'flex', flexDirection: 'column',
                transition: 'width 0.3s ease',
                position: 'fixed', top: 0, left: mobileOpen ? 0 : undefined,
                height: '100vh', zIndex: 50,
                boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                overflowX: 'hidden',
            }}
                className="dashboard-sidebar"
            >
                {/* Logo */}
                <div style={{ padding: '1.25rem 1rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ClipboardList size={18} color="white" />
                    </div>
                    {!sidebarCollapsed && (
                        <div>
                            <p style={{ color: '#f8fafc', fontSize: '1rem', fontWeight: 600, letterSpacing: '0.5px' }}>Citizen Portal</p>
                        </div>
                    )}
                </div>

                {/* User mini profile */}
                {!sidebarCollapsed && (user || profile) && (
                    <div style={{ padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                            width: 38, height: 38, borderRadius: '50%', background: 'linear-gradient(135deg,#86C5E5,#A8E0C4)',
                            overflow: 'hidden', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            {profile?.profilePicture
                                ? <img src={profile.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ color: 'white', fontWeight: 700, fontSize: '1rem' }}>{(profile?.name || user?.name)?.charAt(0)}</span>
                            }
                        </div>
                        <div style={{ overflow: 'hidden' }}>
                            <p style={{ color: 'white', fontSize: '0.82rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.name || user?.name}</p>
                            <p style={{ color: '#64748b', fontSize: '0.7rem' }}>Score: {profile?.citizenScore || 50}/100</p>
                        </div>
                    </div>
                )}

                {/* Nav items */}
                <nav style={{ flex: 1, padding: '1rem 0.6rem', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                    {NAV_ITEMS.map(({ id, label, icon: Icon, highlight }) => {
                        const active = activeSection === id;
                        return (
                            <button key={id} onClick={() => navTo(id)}
                                onMouseEnter={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                                        e.currentTarget.style.color = highlight ? 'var(--accent-secondary)' : '#f8fafc';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (!active) {
                                        e.currentTarget.style.background = highlight ? 'color-mix(in sRGB, var(--accent-secondary) 12%, transparent)' : 'transparent';
                                        e.currentTarget.style.color = highlight ? 'var(--accent-secondary)' : '#94a3b8';
                                    }
                                }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: sidebarCollapsed ? '0.8rem' : '0.8rem 1.25rem',
                                    borderRadius: '50px', border: 'none', cursor: 'pointer',
                                    background: active
                                        ? 'color-mix(in sRGB, var(--accent-primary) 18%, transparent)'
                                        : highlight
                                            ? 'color-mix(in sRGB, var(--accent-secondary) 12%, transparent)'
                                            : 'transparent',
                                    color: active ? 'var(--accent-primary)' : highlight ? 'var(--accent-secondary)' : '#94a3b8',
                                    fontWeight: active ? 600 : highlight ? 600 : 500,
                                    fontSize: '0.88rem',
                                    transition: 'all 0.25s ease',
                                    justifyContent: sidebarCollapsed ? 'center' : 'flex-start',
                                    width: '100%', textAlign: 'left', whiteSpace: 'nowrap',
                                    boxShadow: active ? '0 4px 12px color-mix(in sRGB, var(--accent-primary) 10%, transparent)' : 'none',
                                    transform: active && !sidebarCollapsed ? 'scale(1.02)' : 'scale(1)'
                                }}
                                title={sidebarCollapsed ? label : undefined}
                            >
                                <Icon size={18} style={{ flexShrink: 0 }} />
                                {!sidebarCollapsed && label}
                                {id === 'notifications' && unreadCount > 0 && !sidebarCollapsed && (
                                    <span style={{ marginLeft: 'auto', background: '#F4A698', color: '#212121', fontSize: '0.65rem', fontWeight: 700, borderRadius: '100px', padding: '1px 7px', minWidth: 18, textAlign: 'center' }}>{unreadCount}</span>
                                )}
                            </button>
                        );
                    })}
                </nav>

                {/* Collapse button + Logout */}
                <div style={{ padding: '1rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: sidebarCollapsed ? 'center' : 'space-between', gap: '0.5rem', padding: '0.6rem 0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'rgba(255,255,255,0.04)', color: '#64748b', width: '100%', fontSize: '0.82rem' }}>
                        {!sidebarCollapsed && <span>Collapse</span>}
                        {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                    </button>
                    <button onClick={handleLogout}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', color: '#94a3b8', fontSize: '0.88rem', justifyContent: sidebarCollapsed ? 'center' : 'flex-start', width: '100%' }}>
                        <LogOut size={18} />
                        {!sidebarCollapsed && 'Logout'}
                    </button>
                </div>
            </aside>

            {/* Main area */}
            <div style={{ flex: 1, marginLeft: sidebarCollapsed ? '72px' : '240px', transition: 'margin-left 0.3s ease', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}
                className="dashboard-main">
                {/* Top bar */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 30,
                    background: 'rgba(248,250,252,0.92)', backdropFilter: 'blur(12px)',
                    borderBottom: '1px solid var(--border-color)',
                    padding: '0.875rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <button onClick={() => setMobileOpen(!mobileOpen)}
                            style={{ display: 'none', border: 'none', background: 'none', cursor: 'pointer', padding: '0.25rem' }}
                            className="mobile-menu-btn">
                            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
                        </button>
                        <div>
                            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {SECTION_TITLES[activeSection] || 'Dashboard'}
                            </h2>
                            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                Welcome back, {user?.name || 'Citizen'} 👋
                            </p>
                        </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Quick file grievance CTA in header */}
                        {activeSection !== 'submit' && (
                            <button onClick={() => navTo('submit')}
                                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: '#A8E0C4', color: '#212121', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.82rem', boxShadow: '0 2px 8px rgba(168,224,196,0.4)' }}>
                                <FilePlus size={15} /> + File Grievance
                            </button>
                        )}
                        <button onClick={() => navTo('notifications')}
                            style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: '0.5rem', borderRadius: '50%', color: 'var(--text-secondary)' }}>
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span style={{ position: 'absolute', top: 2, right: 2, width: 10, height: 10, background: '#F4A698', borderRadius: '50%', border: '2px solid var(--bg-page)' }} />
                            )}
                        </button>
                        <button onClick={() => navTo('profile')}
                            style={{ width: 34, height: 34, borderRadius: '50%', border: '2px solid var(--accent-primary)', overflow: 'hidden', cursor: 'pointer', background: 'linear-gradient(135deg,#86C5E5,#A8E0C4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            {profile?.profilePicture
                                ? <img src={profile.profilePicture} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                : <span style={{ color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>{user?.name?.charAt(0)}</span>
                            }
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <main style={{ flex: 1, padding: '2rem', maxWidth: 1200, width: '100%', margin: '0 auto' }}
                    className="animate-fade-in dashboard-content">
                    <Routes>
                        <Route path="/" element={<Navigate to="submit" replace />} />
                        <Route path="submit" element={<SubmitComplaintSection onSuccess={() => navigate('/dashboard/overview')} />} />
                        <Route path="overview" element={<Overview onOpenFeedback={() => navigate('/dashboard/feedback')} />} />
                        <Route path="profile" element={<Profile profile={profile} onUpdate={setProfile} />} />
                        <Route path="map" element={<MapView />} />
                        <Route path="analytics" element={<Analytics />} />
                        <Route path="notifications" element={<Notifications notifications={notifications} setNotifications={setNotifications} unreadCount={unreadCount} setUnreadCount={setUnreadCount} profile={profile} />} />
                        <Route path="feedback" element={<FeedbackRating />} />
                        <Route path="health" element={<InfraHealth />} />
                        <Route path="*" element={<Navigate to="submit" replace />} />
                    </Routes>
                </main>
            </div>

            <style>{`
                @media (max-width: 768px) {
                    .dashboard-sidebar { position: fixed !important; left: -240px !important; width: 240px !important; }
                    .dashboard-sidebar.mobile-open { left: 0 !important; }
                    .dashboard-main { margin-left: 0 !important; }
                    .mobile-menu-btn { display: flex !important; }
                    .dashboard-content { padding: 1rem !important; }
                }
            `}</style>

            {/* AI Chatbot Widget — from AI_Powered_Grievance_Redressal_System qna_faiss.py */}
            <AIAssistantWidget />
        </div>
    );
}
