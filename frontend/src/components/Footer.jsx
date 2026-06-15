import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{ background: 'var(--gov-navy)', color: 'rgba(255,255,255,0.78)', marginTop: 'auto' }}>

            {/* Tricolor top stripe */}
            <div style={{ height: '4px', background: 'linear-gradient(90deg, #FF9933 33.33%, #ffffff 33.33%, #ffffff 66.66%, #138808 66.66%)' }} />

            <div className="container" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '2.5rem',
                padding: '2.5rem 2rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
            }}>
                {/* Brand */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '3px', padding: '0.4rem', display: 'flex' }}>
                            <ShieldCheck size={22} color="#fff" strokeWidth={1.8} />
                        </div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff' }}>CivicSense</span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', lineHeight: 1.65 }}>
                        Centralized Public Grievance Redressal Portal. AI-powered routing ensures citizen voices reach the right authorities.
                    </p>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                        {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                            <a key={i} href="#" style={{ color: 'rgba(255,255,255,0.5)', transition: 'color 0.2s', display: 'flex' }}
                                onMouseOver={e => e.currentTarget.style.color = '#fff'}
                                onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>
                                <Icon size={17} strokeWidth={1.8} />
                            </a>
                        ))}
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Quick Links</h4>
                    {[
                        { label: 'Home',              to: '/' },
                        { label: 'About System',      to: '/#about' },
                        { label: 'Advanced Features', to: '/#features' },
                        { label: 'FAQ',               to: '/#faq' },
                    ].map(({ label, to }) => (
                        <Link key={label} to={to} style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.color = '#fff'}
                            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Portals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Citizen Portals</h4>
                    {[
                        { label: 'Lodge Grievance', to: '/submit' },
                        { label: 'Track Status',    to: '/track' },
                        { label: 'Admin Panel',     to: '/admin' },
                    ].map(({ label, to }) => (
                        <Link key={label} to={to} style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none', fontSize: '0.875rem', transition: 'color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.color = '#fff'}
                            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}>
                            {label}
                        </Link>
                    ))}
                </div>

                {/* Contact */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                    <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.25rem' }}>Contact</h4>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.855rem', color: 'rgba(255,255,255,0.65)' }}>
                        <MapPin size={14} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>Dept. of Administrative Reforms, New Delhi — 110001</span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.855rem', color: 'rgba(255,255,255,0.65)' }}>
                        <Phone size={14} />
                        <span>1800-11-0000 <span style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.78rem' }}>Toll Free</span></span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', fontSize: '0.855rem', color: 'rgba(255,255,255,0.65)' }}>
                        <Mail size={14} />
                        <span>support@civicsense.gov.in</span>
                    </div>
                </div>
            </div>

            {/* Copyright bar */}
            <div className="container" style={{
                padding: '1rem 2rem',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                flexWrap: 'wrap', gap: '0.75rem',
                fontSize: '0.78rem', color: 'rgba(255,255,255,0.38)',
            }}>
                <span>© {new Date().getFullYear()} CivicSense. National Informatics Centre. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '1.25rem' }}>
                    {['Privacy Policy', 'Terms of Service', 'Accessibility'].map(label => (
                        <Link key={label} to="#" style={{ color: 'rgba(255,255,255,0.38)', textDecoration: 'none', transition: 'color 0.2s' }}
                            onMouseOver={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
                            onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.38)'}>
                            {label}
                        </Link>
                    ))}
                </div>
            </div>

        </footer>
    );
}
