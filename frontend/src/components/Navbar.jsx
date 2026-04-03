import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import {
    ShieldCheck, LogOut, User, HardHat, BadgeCheck, Crown, ShieldAlert,
    Home, Info, Zap, HelpCircle, Phone, FileEdit, Search, MessageSquarePlus, LayoutDashboard
} from 'lucide-react';

const ROLE_CONFIG = {
    citizen: { label: 'Citizen', icon: User, route: '/dashboard', dashLink: 'My Dashboard', color: 'var(--accent-primary)' },
    field_worker: { label: 'Field Worker', icon: HardHat, route: '/field-worker', dashLink: 'My Tasks', color: '#5eb88a' },
    officer: { label: 'Officer', icon: BadgeCheck, route: '/officer', dashLink: 'Dashboard', color: '#7c3aed' },
    commissioner: { label: 'Commissioner', icon: Crown, route: '/commissioner', dashLink: 'Overview', color: '#d9736a' },
    admin: { label: 'Admin', icon: ShieldAlert, route: '/admin', dashLink: 'Command Center', color: 'var(--text-primary)' },
};

const NAV_LINKS = [
    { label: 'Home', icon: Home, href: '/', sectionId: null },
    { label: 'About', icon: Info, href: '/#about', sectionId: 'about' },
    { label: 'Features', icon: Zap, href: '/#features', sectionId: 'features' },
    { label: 'FAQ', icon: HelpCircle, href: '/#faq', sectionId: 'faq' },
    { label: 'Contact', icon: Phone, href: '/#contact', sectionId: 'contact' },
];

const navLinkStyle = (active = false) => ({
    display: 'flex', alignItems: 'center', gap: '0.45rem',
    padding: '0.6rem 1.15rem', borderRadius: '14px',
    textDecoration: 'none', fontSize: '1rem', fontWeight: 500,
    color: active ? 'var(--accent-primary)' : 'var(--text-secondary)',
    background: active ? 'rgba(134,197,229,0.15)' : 'transparent',
    transition: 'all 0.18s ease', cursor: 'pointer', userSelect: 'none',
    border: 'none',
});

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [feedbackOpen, setFeedbackOpen] = useState(false);

    const handleLogout = () => { logout(); navigate('/'); };
    const roleConf = user ? ROLE_CONFIG[user.role] : null;

    const handleNavClick = (e, link) => {
        if (!link.sectionId) return;
        e.preventDefault();
        const doScroll = () => {
            const el = document.getElementById(link.sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        if (location.pathname !== '/') {
            navigate('/');
            setTimeout(doScroll, 300);
        } else {
            doScroll();
        }
    };

    return (
        <>
            <nav style={{
                background: 'linear-gradient(105deg, rgba(255,255,255,0.97) 0%, rgba(210,240,250,0.95) 55%, rgba(255,246,243,0.96) 100%)',
                backdropFilter: 'blur(18px)',
                WebkitBackdropFilter: 'blur(18px)',
                borderBottom: '1px solid rgba(134,197,229,0.45)',
                position: 'sticky', top: 0, zIndex: 100,
                boxShadow: '0 2px 18px rgba(134,197,229,0.18), 0 1px 4px rgba(244,166,152,0.10)'
            }}>
                <div className="container flex-row justify-between" style={{ height: '5.5rem' }}>

                    {/* Brand */}
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, rgba(134,197,229,0.18) 0%, rgba(168,224,196,0.28) 100%)',
                            borderRadius: '14px', padding: '0.5rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(134,197,229,0.22)'
                        }}>
                            <ShieldCheck size={32} color="var(--accent-primary)" />
                        </div>
                        <span style={{ fontSize: '1.55rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
                            Civic<span style={{ color: 'var(--accent-primary)' }}>Sense</span>
                        </span>
                    </Link>

                    {/* Center Nav with icons + Feedback */}
                    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center', background: 'rgba(240,250,255,0.75)', borderRadius: '18px', padding: '0.35rem 0.5rem', border: '1px solid rgba(134,197,229,0.40)', boxShadow: 'inset 0 1px 3px rgba(134,197,229,0.12)' }}>
                        {NAV_LINKS.map(link => {
                            const Icon = link.icon;
                            const isHome = link.label === 'Home';
                            return (
                                <a
                                    key={link.label}
                                    href={isHome ? '/' : link.href}
                                    onClick={!isHome ? (e) => handleNavClick(e, link) : undefined}
                                    style={navLinkStyle()}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(134,197,229,0.18)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                                >
                                    <Icon size={17} strokeWidth={2} />
                                    {link.label}
                                </a>
                            );
                        })}

                        {/* Feedback tab */}
                        <button
                            onClick={() => setFeedbackOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.45rem',
                                padding: '0.6rem 1.25rem', borderRadius: '14px',
                                border: '1.5px solid rgba(134,197,229,0.45)',
                                background: 'linear-gradient(120deg, rgba(134,197,229,0.12) 0%, rgba(168,224,196,0.18) 100%)',
                                color: 'var(--accent-primary)',
                                cursor: 'pointer', fontSize: '1rem', fontWeight: 600,
                                transition: 'all 0.18s ease', marginLeft: '0.25rem',
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'linear-gradient(120deg, #86C5E5 0%, #A8E0C4 100%)';
                                e.currentTarget.style.color = '#212121';
                                e.currentTarget.style.borderColor = 'var(--accent-primary)';
                                e.currentTarget.style.boxShadow = '0 4px 14px rgba(134,197,229,0.35)';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'linear-gradient(120deg, rgba(134,197,229,0.12) 0%, rgba(168,224,196,0.18) 100%)';
                                e.currentTarget.style.color = 'var(--accent-primary)';
                                e.currentTarget.style.borderColor = 'rgba(134,197,229,0.45)';
                                e.currentTarget.style.boxShadow = 'none';
                            }}
                        >
                            <MessageSquarePlus size={17} strokeWidth={2} />
                            Feedback
                        </button>
                    </div>

                    {/* Right – Auth */}
                    <div className="flex-row gap-4" style={{ alignItems: 'center' }}>
                        {user ? (
                            <>
                                {user.role === 'citizen' && (
                                    <>
                                        <Link to="/submit" style={{ ...navLinkStyle(), fontWeight: 600, color: '#5eb88a', background: 'linear-gradient(120deg, rgba(168,224,196,0.15) 0%, rgba(168,224,196,0.22) 100%)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(168,224,196,0.30)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(120deg, rgba(168,224,196,0.15) 0%, rgba(168,224,196,0.22) 100%)'}>
                                            <FileEdit size={17} /> Submit
                                        </Link>
                                        <Link to="/track" style={{ ...navLinkStyle(), fontWeight: 600, color: 'var(--accent-primary)', background: 'linear-gradient(120deg, rgba(134,197,229,0.15) 0%, rgba(134,197,229,0.22) 100%)' }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(134,197,229,0.30)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'linear-gradient(120deg, rgba(134,197,229,0.15) 0%, rgba(134,197,229,0.22) 100%)'}>
                                            <Search size={17} /> Track
                                        </Link>
                                    </>
                                )}

                                {roleConf?.dashLink && (
                                    <Link to={roleConf.route} style={{ ...navLinkStyle(), fontWeight: 600, color: roleConf.color, background: `${roleConf.color}12` }}>
                                        {roleConf.dashLink}
                                    </Link>
                                )}

                                {/* User badge */}
                                <div style={{ paddingLeft: '1.1rem', borderLeft: '1px solid var(--border-color)', display: 'flex', gap: '0.7rem', alignItems: 'center' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.97rem' }}>
                                        {roleConf && <roleConf.icon size={16} color={roleConf.color} />}
                                        <span style={{ color: 'var(--text-secondary)', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {user.name || 'User'}
                                        </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '10px', background: `${roleConf?.color}18`, color: roleConf?.color, fontWeight: 700 }}>
                                        {roleConf?.label || user.role}
                                    </span>
                                    <button onClick={handleLogout} title="Sign out"
                                        style={{ background: 'rgba(244,166,152,0.15)', border: '1px solid rgba(244,166,152,0.40)', borderRadius: '10px', cursor: 'pointer', color: 'var(--status-critical)', display: 'flex', alignItems: 'center', padding: '0.35rem 0.55rem', transition: 'all 0.18s ease' }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,166,152,0.30)'; }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(244,166,152,0.15)'; }}>
                                        <LogOut size={17} />
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <Link to="/login" style={{ ...navLinkStyle(), fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                                    <User size={17} /> Sign In
                                </Link>
                                <Link to="/register" className="btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.45rem', padding: '0.65rem 1.35rem', fontSize: '1rem', borderRadius: '14px', background: 'linear-gradient(120deg, #86C5E5 0%, #A8E0C4 100%)', color: '#212121', boxShadow: '0 4px 14px rgba(134,197,229,0.35)' }}>
                                    <ShieldCheck size={17} /> Sign Up
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            {/* Feedback Modal — overlays the full page */}
            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    );
}
