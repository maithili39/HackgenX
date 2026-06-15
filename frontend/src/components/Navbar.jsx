import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import FeedbackModal from './FeedbackModal';
import {
    ShieldCheck, LogOut, User, HardHat, BadgeCheck, Crown, ShieldAlert,
    FileEdit, Search, MessageSquarePlus, ChevronDown
} from 'lucide-react';

const ROLE_CONFIG = {
    citizen:      { label: 'Citizen',       icon: User,        route: '/dashboard',    dashLink: 'My Dashboard', color: '#1a4fa0' },
    field_worker: { label: 'Field Worker',   icon: HardHat,     route: '/field-worker', dashLink: 'My Tasks',     color: '#2d6a4f' },
    officer:      { label: 'Officer',        icon: BadgeCheck,  route: '/officer',      dashLink: 'Dashboard',    color: '#5b21b6' },
    commissioner: { label: 'Commissioner',   icon: Crown,       route: '/commissioner', dashLink: 'Overview',     color: '#92400e' },
    admin:        { label: 'Administrator',  icon: ShieldAlert, route: '/admin',        dashLink: 'Admin Panel',  color: '#0d2b55' },
};

const NAV_LINKS = [
    { label: 'Home',     href: '/',         sectionId: null },
    { label: 'About',    href: '/#about',   sectionId: 'about' },
    { label: 'Features', href: '/#features',sectionId: 'features' },
    { label: 'FAQ',      href: '/#faq',     sectionId: 'faq' },
    { label: 'Contact',  href: '/#contact', sectionId: 'contact' },
];

export default function Navbar() {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const location = useLocation();
    const [feedbackOpen, setFeedbackOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);

    const handleLogout = () => { setUserMenuOpen(false); logout(); navigate('/'); };
    const roleConf = user ? ROLE_CONFIG[user.role] : null;

    const handleNavClick = (e, link) => {
        if (!link.sectionId) return;
        e.preventDefault();
        const doScroll = () => {
            const el = document.getElementById(link.sectionId);
            if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        };
        if (location.pathname !== '/') { navigate('/'); setTimeout(doScroll, 300); }
        else doScroll();
    };

    const isActiveLink = (link) => {
        if (link.sectionId === null) return location.pathname === '/';
        return false;
    };

    return (
        <>
            {/* ── Tier 1: Government Identity Strip ── */}
            <div style={{
                background: 'var(--gov-navy)',
                color: 'rgba(255,255,255,0.82)',
                fontSize: '0.78rem',
                fontWeight: 500,
                letterSpacing: '0.01em',
            }}>
                <div className="container flex-row justify-between" style={{ height: '2.2rem' }}>
                    <span>CivicSense Project &nbsp;|&nbsp; Hackathon Demo</span>
                    <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>Screen Reader Access</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', display: 'flex', gap: '0.5rem' }}>
                            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.75rem', padding: '0 2px' }}>A-</button>
                            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.85rem', padding: '0 2px' }}>A</button>
                            <button style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.7)', cursor: 'pointer', fontSize: '0.97rem', padding: '0 2px' }}>A+</button>
                        </span>
                        <span style={{ color: 'rgba(255,255,255,0.4)' }}>|</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)', letterSpacing: '0.02em' }}>English</span>
                        <span style={{ color: 'rgba(255,255,255,0.55)' }}>हिन्दी</span>
                    </div>
                </div>
            </div>

            {/* ── Tricolor Stripe ── */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)' }} />

            {/* ── Tier 2: Brand Header ── */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--border-color)' }}>
                <div className="container flex-row justify-between" style={{ height: '5rem' }}>
                    <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '52px', height: '52px',
                            background: 'var(--gov-navy)',
                            borderRadius: '4px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0,
                        }}>
                            <ShieldCheck size={28} color="#fff" strokeWidth={1.8} />
                        </div>
                        <div>
                            <div style={{ fontSize: '1.45rem', fontWeight: 700, color: 'var(--gov-navy)', letterSpacing: '-0.01em', lineHeight: 1.1 }}>
                                CivicSense
                            </div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', letterSpacing: '0.04em', fontWeight: 500, textTransform: 'uppercase', marginTop: '2px' }}>
                                Centralized Public Grievance Redressal Portal
                            </div>
                        </div>
                    </Link>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        {/* Helpline */}
                        <div style={{ textAlign: 'right', borderRight: '1px solid var(--border-color)', paddingRight: '1rem' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Helpline</div>
                            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gov-navy)', letterSpacing: '0.03em' }}>1800-11-0000</div>
                            <div style={{ fontSize: '0.68rem', color: 'var(--gov-green)', fontWeight: 600 }}>Toll Free | 24x7</div>
                        </div>

                        {user ? (
                            <div style={{ position: 'relative' }}>
                                <button
                                    onClick={() => setUserMenuOpen(o => !o)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        padding: '0.5rem 0.9rem',
                                        background: 'var(--bg-element)',
                                        border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)',
                                        cursor: 'pointer',
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                        fontSize: '0.88rem',
                                        fontWeight: 600,
                                    }}>
                                    {roleConf && <roleConf.icon size={15} color={roleConf.color} />}
                                    <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {user.name || 'User'}
                                    </span>
                                    <span style={{ fontSize: '0.68rem', background: roleConf?.color, color: '#fff', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>
                                        {roleConf?.label || user.role}
                                    </span>
                                    <ChevronDown size={13} style={{ color: 'var(--text-muted)', transform: userMenuOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                                </button>

                                {userMenuOpen && (
                                    <div style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                                        background: '#fff', border: '1px solid var(--border-color)',
                                        borderRadius: 'var(--radius-sm)', boxShadow: '0 6px 18px rgba(0,0,0,0.14)',
                                        minWidth: '190px', zIndex: 200,
                                        overflow: 'hidden',
                                    }}>
                                        {roleConf?.dashLink && (
                                            <Link to={roleConf.route} onClick={() => setUserMenuOpen(false)}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.88rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}
                                                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-element)'}
                                                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                <roleConf.icon size={14} color={roleConf.color} />
                                                {roleConf.dashLink}
                                            </Link>
                                        )}
                                        {user.role === 'citizen' && (
                                            <>
                                                <Link to="/submit" onClick={() => setUserMenuOpen(false)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.88rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-element)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <FileEdit size={14} color="var(--gov-green)" />
                                                    Lodge Grievance
                                                </Link>
                                                <Link to="/track" onClick={() => setUserMenuOpen(false)}
                                                    style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', textDecoration: 'none', fontSize: '0.88rem', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', fontWeight: 500 }}
                                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-element)'}
                                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                                    <Search size={14} color="var(--gov-blue)" />
                                                    Track Status
                                                </Link>
                                            </>
                                        )}
                                        <button onClick={handleLogout}
                                            style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', padding: '0.7rem 1rem', width: '100%', background: 'none', border: 'none', fontSize: '0.88rem', color: 'var(--status-critical)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 500, textAlign: 'left' }}
                                            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                            <LogOut size={14} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ display: 'flex', gap: '0.6rem' }}>
                                <Link to="/login" style={{
                                    padding: '0.55rem 1.1rem', border: '1.5px solid var(--gov-blue)',
                                    borderRadius: 'var(--radius-sm)', textDecoration: 'none',
                                    color: 'var(--gov-blue)', fontSize: '0.88rem', fontWeight: 600,
                                    transition: 'all var(--transition-fast)',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'var(--gov-blue)'; e.currentTarget.style.color = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--gov-blue)'; }}>
                                    Sign In
                                </Link>
                                <Link to="/register" style={{
                                    padding: '0.55rem 1.1rem', background: 'var(--gov-saffron)',
                                    border: '1.5px solid var(--gov-saffron)', borderRadius: 'var(--radius-sm)',
                                    textDecoration: 'none', color: '#fff', fontSize: '0.88rem', fontWeight: 600,
                                    transition: 'all var(--transition-fast)',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#a86208'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'var(--gov-saffron)'}>
                                    Register
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Tier 3: Navigation Bar ── */}
            <nav style={{
                background: 'var(--gov-blue)',
                position: 'sticky', top: 0, zIndex: 100,
                boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
            }}>
                <div className="container flex-row justify-between" style={{ height: '3rem' }}>
                    <div style={{ display: 'flex', height: '100%' }}>
                        {NAV_LINKS.map(link => {
                            const active = isActiveLink(link);
                            return (
                                <a
                                    key={link.label}
                                    href={link.href}
                                    onClick={link.sectionId ? (e) => handleNavClick(e, link) : undefined}
                                    style={{
                                        display: 'flex', alignItems: 'center',
                                        padding: '0 1.15rem',
                                        textDecoration: 'none',
                                        fontSize: '0.88rem',
                                        fontWeight: 500,
                                        color: active ? '#fff' : 'rgba(255,255,255,0.80)',
                                        borderBottom: active ? '3px solid #fff' : '3px solid transparent',
                                        transition: 'all var(--transition-fast)',
                                        letterSpacing: '0.01em',
                                        whiteSpace: 'nowrap',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.borderBottomColor = 'rgba(255,255,255,0.5)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.color = active ? '#fff' : 'rgba(255,255,255,0.80)'; e.currentTarget.style.borderBottomColor = active ? '#fff' : 'transparent'; }}
                                >
                                    {link.label}
                                </a>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <button
                            onClick={() => setFeedbackOpen(true)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.35rem 0.9rem',
                                background: 'rgba(255,255,255,0.12)',
                                border: '1px solid rgba(255,255,255,0.28)',
                                borderRadius: 'var(--radius-sm)',
                                color: '#fff',
                                cursor: 'pointer', fontSize: '0.82rem', fontWeight: 500,
                                fontFamily: 'inherit',
                                transition: 'background var(--transition-fast)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.22)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.12)'}>
                            <MessageSquarePlus size={14} strokeWidth={2} />
                            Feedback
                        </button>

                        <Link to="/submit" style={{
                            display: 'flex', alignItems: 'center', gap: '0.4rem',
                            padding: '0.35rem 1rem',
                            background: 'var(--gov-saffron)',
                            border: '1px solid var(--gov-saffron)',
                            borderRadius: 'var(--radius-sm)',
                            textDecoration: 'none',
                            color: '#fff',
                            fontSize: '0.82rem', fontWeight: 700,
                            letterSpacing: '0.01em',
                            transition: 'background var(--transition-fast)',
                        }}
                            onMouseEnter={e => e.currentTarget.style.background = '#a86208'}
                            onMouseLeave={e => e.currentTarget.style.background = 'var(--gov-saffron)'}>
                            <FileEdit size={14} strokeWidth={2} />
                            Lodge Grievance
                        </Link>
                    </div>
                </div>
            </nav>

            <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
        </>
    );
}
