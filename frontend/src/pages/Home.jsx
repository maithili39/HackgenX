import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
    Check, Info, FileText, Scale, Landmark, HardHat,
    ChevronDown, ArrowRight, Phone, Mail, MapPin,
    ClipboardList, Search, UserCheck, Bell
} from 'lucide-react';

const PUBLIC_SERVICES = [
    { label: 'Road & Infrastructure', dept: 'Public Works' },
    { label: 'Water Supply', dept: 'Water Supply' },
    { label: 'Electricity', dept: 'Electricity' },
    { label: 'Sanitation & Waste', dept: 'Sanitation' },
    { label: 'Property & Billing', dept: 'Billing' },
    { label: 'Technical Support', dept: 'Tech Support' },
];

const STATS = [
    { number: '94',       label: 'Departments Connected' },
    { number: '24x7',     label: 'Service Availability' },
];

const ANNOUNCEMENTS = [
    { date: '15 JUN 2025', title: 'Water Supply Maintenance — Sector 4', desc: 'Low pressure expected 10AM–2PM. Please store water in advance.', type: 'var(--status-warning)' },
    { date: '14 JUN 2025', title: 'Road Diversions — MG Road', desc: 'Expect diversions near City Center crossing for the next 3 days.', type: 'var(--status-info)' },
    { date: '12 JUN 2025', title: 'Scheduled Power Outage — Indiranagar', desc: 'Maintenance outage from 2PM to 4PM on June 14.', type: 'var(--status-critical)' },
    { date: '10 JUN 2025', title: 'E-Waste Collection Drive', desc: 'Special collection drive this weekend at Ward 12 and Ward 18 centers.', type: 'var(--status-success)' },
    { date: '15 JUN 2025', title: 'Water Supply Maintenance — Sector 4', desc: 'Low pressure expected 10AM–2PM. Please store water in advance.', type: 'var(--status-warning)' },
    { date: '14 JUN 2025', title: 'Road Diversions — MG Road', desc: 'Expect diversions near City Center crossing for the next 3 days.', type: 'var(--status-info)' },
    { date: '12 JUN 2025', title: 'Scheduled Power Outage — Indiranagar', desc: 'Maintenance outage from 2PM to 4PM on June 14.', type: 'var(--status-critical)' },
    { date: '10 JUN 2025', title: 'E-Waste Collection Drive', desc: 'Special collection drive this weekend at Ward 12 and Ward 18 centers.', type: 'var(--status-success)' },
];

const SCHEMES = [
    { title: 'Smart City Mission', desc: 'Urban development initiative to drive economic growth and improve quality of life.' },
    { title: 'AMRUT 2.0', desc: 'Atal Mission for Rejuvenation and Urban Transformation — water and sanitation coverage.' },
    { title: 'PM SVANidhi', desc: 'Micro-credit scheme for street vendors affected by COVID-19 pandemic.' },
    { title: 'PMAY Urban', desc: 'Pradhan Mantri Awas Yojana — affordable housing for urban poor.' },
];

const FAQS = [
    { q: 'What is CivicSense?', a: 'CivicSense is a centralized, AI-powered public grievance redressal platform allowing citizens to securely lodge, track, and resolve complaints with various government departments 24x7.' },
    { q: 'Is there any fee for filing a grievance?', a: 'No. Filing a grievance on CivicSense is completely free of charge. This platform does not charge any fee. Beware of fraudulent platforms requesting payment.' },
    { q: 'How long does it take for a complaint to be resolved?', a: 'Resolution times vary by complexity. AI-based routing ensures your complaint reaches the correct authority instantly, significantly expediting the process.' },
    { q: 'Can I track the status of my complaint?', a: 'Yes. Upon submission you receive a unique tracking ID. Use it in the Track Status portal to monitor real-time updates and escalation history.' },
    { q: 'What if my grievance is not resolved satisfactorily?', a: 'You may reopen or escalate the grievance within the platform by providing feedback. Escalation proceeds automatically if SLA deadlines are breached.' },
    { q: 'What types of issues are NOT handled by this portal?', a: 'CivicSense does not handle RTI matters, sub-judice cases, religious matters, or internal administrative disciplinary proceedings.' },
];

export default function Home() {
    const { user } = useContext(AuthContext);
    const [activeFaq, setActiveFaq] = useState(null);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* ── Hero ── */}
            <section style={{
                background: 'linear-gradient(108deg, #0d2b55 0%, #1a4fa0 60%, #1e3a6e 100%)',
                padding: '4rem 0 3rem',
                position: 'relative',
                overflow: 'hidden',
            }}>
                {/* Subtle grid overlay */}
                <div style={{
                    position: 'absolute', inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '48px 48px',
                    pointerEvents: 'none',
                }} />

                <div className="container" style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '3rem', alignItems: 'center' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.3rem 0.9rem',
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '2px',
                                fontSize: '0.75rem', fontWeight: 700,
                                color: 'rgba(255,255,255,0.85)',
                                letterSpacing: '0.08em',
                                textTransform: 'uppercase',
                                width: 'fit-content',
                            }}>
                                National Grievance Redressal System
                            </div>

                            <h1 style={{
                                fontSize: '2.6rem', fontWeight: 700,
                                color: '#fff', lineHeight: 1.2,
                                maxWidth: '560px',
                            }}>
                                Serving Citizens with<br />
                                <span style={{ color: '#fbbf24' }}>Transparency</span> and Trust
                            </h1>

                            <p style={{
                                fontSize: '1rem', color: 'rgba(255,255,255,0.72)',
                                maxWidth: '500px', lineHeight: 1.65,
                            }}>
                                A single portal connected to various civic departments.
                                AI-powered routing ensures your grievance reaches the right desk for rapid resolution.
                            </p>

                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                {(!user || user.role !== 'citizen') ? (
                                    <Link to="/register" style={{
                                        padding: '0.7rem 1.75rem',
                                        background: 'var(--gov-saffron)',
                                        color: '#fff', textDecoration: 'none',
                                        borderRadius: '3px', fontWeight: 700, fontSize: '0.9rem',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        transition: 'background var(--transition-fast)',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#a86208'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gov-saffron)'}>
                                        Register Grievance <ArrowRight size={16} />
                                    </Link>
                                ) : (
                                    <Link to="/submit" style={{
                                        padding: '0.7rem 1.75rem',
                                        background: 'var(--gov-saffron)',
                                        color: '#fff', textDecoration: 'none',
                                        borderRadius: '3px', fontWeight: 700, fontSize: '0.9rem',
                                        display: 'flex', alignItems: 'center', gap: '0.5rem',
                                        transition: 'background var(--transition-fast)',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = '#a86208'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'var(--gov-saffron)'}>
                                        Lodge Grievance <ArrowRight size={16} />
                                    </Link>
                                )}
                                <Link to={user?.role === 'citizen' ? '/track' : '/login'} style={{
                                    padding: '0.7rem 1.75rem',
                                    background: 'transparent',
                                    border: '1.5px solid rgba(255,255,255,0.45)',
                                    color: '#fff', textDecoration: 'none',
                                    borderRadius: '3px', fontWeight: 600, fontSize: '0.9rem',
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    transition: 'all var(--transition-fast)',
                                }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.borderColor = '#fff'; }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.45)'; }}>
                                    View Status <Search size={16} />
                                </Link>
                            </div>
                        </div>

                        {/* Quick action tiles */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', minWidth: '220px' }}>
                            {[
                                { icon: ClipboardList, label: 'Lodge Complaint',  sub: 'Submit a new grievance', to: user?.role === 'citizen' ? '/submit' : '/register', color: '#fbbf24' },
                                { icon: Search,        label: 'Track Status',     sub: 'Check your complaint',   to: user?.role === 'citizen' ? '/track' : '/login',    color: '#60a5fa' },
                                { icon: UserCheck,     label: 'Officer Login',    sub: 'Staff & Admin Portal',   to: '/login',     color: '#86efac' },
                                { icon: Bell,          label: 'Notifications',    sub: 'Updates & alerts',       to: '/dashboard', color: '#fca5a5' },
                            ].map((item) => {
                                const Icon = item.icon;
                                return (
                                    <Link key={item.label} to={item.to} style={{ textDecoration: 'none' }}>
                                        <div style={{
                                            display: 'flex', alignItems: 'center', gap: '0.75rem',
                                            background: 'rgba(255,255,255,0.08)',
                                            border: '1px solid rgba(255,255,255,0.14)',
                                            borderLeft: `3px solid ${item.color}`,
                                            borderRadius: '3px',
                                            padding: '0.7rem 1rem',
                                            transition: 'background var(--transition-fast)',
                                            cursor: 'pointer',
                                        }}
                                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.14)'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}>
                                            <Icon size={18} color={item.color} strokeWidth={1.8} />
                                            <div>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{item.label}</div>
                                                <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.55)', marginTop: '1px' }}>{item.sub}</div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            {/* ── Stats Strip ── */}
            <div style={{ background: '#fff', borderBottom: '1px solid var(--border-color)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="container" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    {STATS.map((s, i) => (
                        <div key={i} style={{
                            padding: '1.25rem 1rem', textAlign: 'center',
                            borderRight: i < STATS.length - 1 ? '1px solid var(--border-color)' : 'none',
                        }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--gov-navy)', lineHeight: 1 }}>{s.number}</div>
                            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── Announcement Ticker ── */}
            <div style={{ background: 'var(--gov-navy)', padding: '0.55rem 0', overflow: 'hidden' }}>
                <div className="container flex-row" style={{ gap: '1rem' }}>
                    <span style={{
                        flexShrink: 0,
                        background: 'var(--gov-saffron)', color: '#fff',
                        fontSize: '0.72rem', fontWeight: 700,
                        padding: '0.2rem 0.75rem',
                        borderRadius: '2px',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                    }}>Latest</span>
                    <div style={{ overflow: 'hidden', flex: 1, position: 'relative' }}>
                        <div style={{
                            display: 'flex', gap: '3rem',
                            whiteSpace: 'nowrap',
                            animation: 'marqueeScroll 35s linear infinite',
                            width: 'max-content',
                        }}>
                            {[...ANNOUNCEMENTS.slice(0, 4), ...ANNOUNCEMENTS.slice(0, 4)].map((a, i) => (
                                <span key={i} style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.82)', fontWeight: 400 }}>
                                    <span style={{ color: 'rgba(255,255,255,0.45)', marginRight: '0.5rem' }}>{a.date}</span>
                                    {a.title}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="container" style={{ padding: '2rem 2rem', display: 'grid', gridTemplateColumns: '1fr 300px', gap: '1.75rem', alignItems: 'start' }}>

                {/* Left column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>

                    {/* Public Services */}
                    <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: 'var(--gov-blue)', padding: '0.75rem 1.25rem' }}>
                            <h3 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Public Services</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0 }}>
                            {PUBLIC_SERVICES.map((svc, i) => (
                                <Link key={i} to="/submit" style={{ textDecoration: 'none' }}>
                                    <div style={{
                                        padding: '1.1rem 1.25rem',
                                        borderRight: (i + 1) % 3 !== 0 ? '1px solid var(--border-color)' : 'none',
                                        borderBottom: i < PUBLIC_SERVICES.length - 3 ? '1px solid var(--border-color)' : 'none',
                                        transition: 'background var(--transition-fast)',
                                        cursor: 'pointer',
                                    }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-element)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <div style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--gov-blue)' }}>{svc.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{svc.dept} Dept.</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* About section */}
                    <div id="about" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: 'var(--gov-blue)', padding: '0.75rem 1.25rem' }}>
                            <h3 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>About CivicSense</h3>
                        </div>
                        <div style={{ padding: '1.5rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                CivicSense is an advanced online platform available to citizens 24x7 to lodge grievances with public authorities on any subject related to service delivery. It is a single portal connected to various civic departments.
                            </p>
                            <p style={{ fontSize: '0.92rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                The status of grievances can be tracked with the unique registration ID provided at the time of submission. CivicSense also provides an appeal facility if citizens are not satisfied with the resolution.
                            </p>
                            <div style={{
                                padding: '0.85rem 1rem',
                                background: '#fffbeb',
                                border: '1px solid #fcd34d',
                                borderLeft: '4px solid var(--gov-saffron)',
                                borderRadius: '2px',
                                fontSize: '0.88rem', color: 'var(--text-secondary)',
                                display: 'flex', gap: '0.6rem',
                            }}>
                                <Info size={16} color="var(--gov-saffron)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                <span><strong>Note:</strong> This platform is not charging any fee from the public for filing grievances. Please be aware of fraudulent platforms asking for payment.</span>
                            </div>
                        </div>
                    </div>

                    {/* Features & Exceptions */}
                    <div id="features" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ background: 'var(--gov-blue)', padding: '0.75rem 1.25rem' }}>
                                <h3 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Advanced Features</h3>
                            </div>
                            <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                                {[
                                    'OTP-based secure registration',
                                    'AI-driven department routing',
                                    'Photo and document proof upload',
                                    'Precise geolocation tagging',
                                    'Real-time status tracking',
                                    'SLA-based auto-escalation',
                                ].map((f, i) => (
                                    <div key={i} style={{ display: 'flex', gap: '0.65rem', alignItems: 'flex-start' }}>
                                        <div style={{ background: '#dcfce7', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                                            <Check size={11} color="var(--gov-green)" strokeWidth={3} />
                                        </div>
                                        <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{f}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderTop: '3px solid var(--status-critical)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                            <div style={{ padding: '0.75rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                                <h3 style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Info size={15} color="var(--status-critical)" />
                                    Issues Not Handled
                                </h3>
                            </div>
                            <ul style={{ listStyle: 'none', padding: '1.25rem', margin: 0, display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
                                {[
                                    { icon: FileText,  text: 'RTI Matters' },
                                    { icon: Scale,     text: 'Court / Subjudice Cases' },
                                    { icon: Landmark,  text: 'Religious Matters' },
                                    { icon: HardHat,   text: 'Employee Disciplinary Proceedings' },
                                ].map(({ icon: Icon, text }, i) => (
                                    <li key={i} style={{ display: 'flex', gap: '0.65rem', fontSize: '0.875rem', color: 'var(--text-secondary)', alignItems: 'center' }}>
                                        <Icon size={15} color="var(--text-muted)" strokeWidth={1.8} />
                                        {text}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>

                    {/* Government Schemes */}
                    <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: 'var(--gov-green)', padding: '0.75rem 1.25rem' }}>
                            <h3 style={{ color: '#fff', fontSize: '0.88rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Civic Schemes &amp; Programmes</h3>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0 }}>
                            {SCHEMES.map((s, i) => (
                                <div key={i} style={{
                                    padding: '1.1rem 1.25rem',
                                    borderRight: i % 2 === 0 ? '1px solid var(--border-color)' : 'none',
                                    borderBottom: i < SCHEMES.length - 2 ? '1px solid var(--border-color)' : 'none',
                                }}>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--gov-navy)', marginBottom: '0.25rem' }}>{s.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{s.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'sticky', top: '3.5rem' }}>

                    {/* Announcements ticker */}
                    <div style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: 'var(--gov-navy)', padding: '0.75rem 1.1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Announcements &amp; Notices</h3>
                            <span style={{ fontSize: '0.68rem', background: 'var(--gov-saffron)', color: '#fff', padding: '1px 6px', borderRadius: '2px', fontWeight: 700 }}>LIVE</span>
                        </div>
                        <div className="news-ticker-container" style={{ height: '280px', padding: '0.25rem 0' }}>
                            <div className="news-ticker-content" style={{ padding: '0.5rem 0', gap: 0 }}>
                                {ANNOUNCEMENTS.map((news, i) => (
                                    <div key={i} style={{
                                        padding: '0.85rem 1.1rem',
                                        borderBottom: '1px solid var(--border-color)',
                                        borderLeft: `3px solid ${news.type}`,
                                        marginLeft: '0',
                                    }}>
                                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.2rem', letterSpacing: '0.04em' }}>{news.date}</div>
                                        <div style={{ fontSize: '0.83rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', lineHeight: 1.25 }}>{news.title}</div>
                                        <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{news.desc}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Citizen Support */}
                    <div id="contact" style={{ background: '#fff', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                        <div style={{ background: 'var(--gov-blue)', padding: '0.75rem 1.1rem' }}>
                            <h3 style={{ color: '#fff', fontSize: '0.82rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Citizen Support</h3>
                        </div>
                        <div style={{ padding: '1.1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                <Phone size={15} color="var(--gov-blue)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Helpline</div>
                                    <div style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--gov-navy)' }}>1800-11-0000</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--gov-green)', fontWeight: 600 }}>Toll Free | 24x7</div>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                <Mail size={15} color="var(--gov-blue)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Email</div>
                                    <div style={{ fontSize: '0.83rem', color: 'var(--gov-blue)' }}>support@civicsense.gov.in</div>
                                </div>
                            </div>
                            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                                <MapPin size={15} color="var(--gov-blue)" style={{ flexShrink: 0, marginTop: '1px' }} />
                                <div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Address</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>Dept. of Administrative Reforms, New Delhi — 110001</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* FAQ teaser */}
                    <div style={{ background: 'var(--gov-navy)', border: '1px solid var(--gov-navy)', borderRadius: 'var(--radius-sm)', padding: '1.1rem', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.5rem' }}>Need help? Visit our FAQ section</div>
                        <a href="#faq" onClick={e => { e.preventDefault(); document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }); }}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
                                padding: '0.5rem 1.1rem',
                                background: 'transparent',
                                border: '1px solid rgba(255,255,255,0.35)',
                                borderRadius: '2px',
                                color: '#fff', textDecoration: 'none',
                                fontSize: '0.82rem', fontWeight: 600,
                                transition: 'all var(--transition-fast)',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            Frequently Asked Questions
                        </a>
                    </div>
                </div>
            </div>

            {/* ── FAQ ── */}
            <section id="faq" style={{ background: '#fff', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)', padding: '2.5rem 0' }}>
                <div className="container" style={{ maxWidth: '860px' }}>
                    <div style={{ marginBottom: '1.75rem' }}>
                        <div className="section-heading">Frequently Asked Questions</div>
                        <h2 style={{ fontSize: '1.4rem', color: 'var(--gov-navy)' }}>Citizen Help &amp; Guidance</h2>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', overflow: 'hidden' }}>
                        {FAQS.map((faq, i) => (
                            <div key={i} style={{ borderBottom: i < FAQS.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                                <button
                                    onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                                    style={{
                                        width: '100%', padding: '1rem 1.25rem',
                                        background: activeFaq === i ? 'var(--bg-element)' : 'transparent',
                                        border: 'none', display: 'flex',
                                        justifyContent: 'space-between', alignItems: 'center',
                                        cursor: 'pointer', textAlign: 'left',
                                        color: 'var(--text-primary)',
                                        fontWeight: 600, fontSize: '0.9rem',
                                        fontFamily: 'inherit',
                                        transition: 'background var(--transition-fast)',
                                    }}
                                    onMouseOver={e => { if (activeFaq !== i) e.currentTarget.style.background = 'var(--bg-panel-hover)'; }}
                                    onMouseOut={e => { if (activeFaq !== i) e.currentTarget.style.background = 'transparent'; }}
                                >
                                    <span>{faq.q}</span>
                                    <ChevronDown size={17} style={{
                                        flexShrink: 0, marginLeft: '1rem',
                                        transform: activeFaq === i ? 'rotate(180deg)' : 'none',
                                        transition: 'transform 0.25s ease',
                                        color: 'var(--text-muted)',
                                    }} />
                                </button>
                                <div style={{
                                    maxHeight: activeFaq === i ? '300px' : '0',
                                    opacity: activeFaq === i ? 1 : 0,
                                    overflow: 'hidden',
                                    transition: 'max-height 0.35s ease, opacity 0.25s ease',
                                }}>
                                    <div style={{ padding: '0 1.25rem 1rem 1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.65, borderTop: '1px solid var(--border-color)' }}>
                                        {faq.a}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── Disclaimer strip ── */}
            <div style={{ background: '#fffbeb', borderBottom: '1px solid #fcd34d', padding: '0.65rem 0' }}>
                <div className="container" style={{ fontSize: '0.8rem', color: '#78350f', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <Info size={13} color="#92400e" style={{ flexShrink: 0 }} />
                    <span><strong>Important:</strong> This platform is not charging any fee from the public for filing grievances. Please beware of fraudulent platforms asking for payment for submitting complaints.</span>
                </div>
            </div>

        </div>
    );
}
