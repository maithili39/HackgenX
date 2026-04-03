import { Link } from 'react-router-dom';
import { ShieldCheck, Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

export default function Footer() {
    return (
        <footer style={{
            background: 'var(--text-primary)',
            color: 'white',
            paddingTop: 0,
            marginTop: 'auto',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Mesh gradient bridge — white→periwinkle→orange melt into dark footer */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '200px',
                zIndex: 0,
                pointerEvents: 'none',
                background: `
                    radial-gradient(ellipse 70% 90% at 88% 0%, rgba(255,138,76,0.55) 0%, transparent 60%),
                    radial-gradient(ellipse 55% 80% at 50% 0%, rgba(197,202,233,0.45) 0%, transparent 60%),
                    radial-gradient(ellipse 50% 70% at 12% 0%, rgba(159,168,218,0.38) 0%, transparent 58%)
                `,
                filter: 'blur(38px)',
                maskImage: 'linear-gradient(to bottom, white 0%, transparent 100%)',
                WebkitMaskImage: 'linear-gradient(to bottom, white 0%, transparent 100%)',
            }} />
            {/* Thin rainbow-glow border line at footer top */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '3px',
                zIndex: 1,
                background: 'linear-gradient(90deg, rgba(159,168,218,0.8) 0%, rgba(197,202,233,0.9) 30%, rgba(255,167,38,0.85) 70%, rgba(255,138,76,0.9) 100%)',
                opacity: 0.75,
            }} />
            {/* Spacer that was previously paddingTop */}
            <div style={{ height: '4rem', position: 'relative', zIndex: 2 }} />
            <div className="container" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '3rem',
                paddingBottom: '3rem',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                position: 'relative',
                zIndex: 2,
            }}>
                {/* Brand & About */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ShieldCheck size={28} color="var(--accent-primary)" />
                        <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'white' }}>
                            Civic<span style={{ color: 'var(--accent-primary)' }}>Sense</span>
                        </span>
                    </div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.95rem', lineHeight: 1.6 }}>
                        AI-powered public grievance redressal platform ensuring citizen voices reach the right authorities for rapid resolution.
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                        <a href="#" style={{ color: 'white', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'white'}><Facebook size={20} /></a>
                        <a href="#" style={{ color: 'white', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'white'}><Twitter size={20} /></a>
                        <a href="#" style={{ color: 'white', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'white'}><Instagram size={20} /></a>
                        <a href="#" style={{ color: 'white', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'var(--accent-primary)'} onMouseOut={e => e.currentTarget.style.color = 'white'}><Linkedin size={20} /></a>
                    </div>
                </div>

                {/* Quick Links */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Quick Links</h4>
                    <Link to="/" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Home</Link>
                    <a href="/#about" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>About System</a>
                    <a href="/#features" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Advanced Features</a>
                    <a href="/#faq" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>FAQ</a>
                </div>

                {/* Portals */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Portals</h4>
                    <Link to="/submit" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Lodge Grievance</Link>
                    <Link to="/track" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Track Status</Link>
                    <Link to="/admin" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '0.95rem', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}>Command Center</Link>
                </div>

                {/* Contact Info */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'white', marginBottom: '0.5rem' }}>Contact Us</h4>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                        <MapPin size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span style={{ fontSize: '0.95rem', lineHeight: 1.5 }}>CivicSense HQ, Department of Administrative Reforms, New Delhi 110001</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                        <Phone size={18} />
                        <span style={{ fontSize: '0.95rem' }}>1800-11-0000 (Toll Free)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'rgba(255,255,255,0.7)' }}>
                        <Mail size={18} />
                        <span style={{ fontSize: '0.95rem' }}>support@civicsense.gov.in</span>
                    </div>
                </div>
            </div>

            {/* Copyright */}
            <div className="container" style={{
                padding: '1.5rem 2rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1rem',
                fontSize: '0.85rem',
                color: 'rgba(255,255,255,0.5)',
                position: 'relative',
                zIndex: 2,
            }}>
                <span>&copy; {new Date().getFullYear()} CivicSense. All rights reserved.</span>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <Link to="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>Privacy Policy</Link>
                    <Link to="#" style={{ color: 'rgba(255,255,255,0.5)', textDecoration: 'none', transition: 'color 0.2s' }} onMouseOver={e => e.currentTarget.style.color = 'white'} onMouseOut={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>Terms of Service</Link>
                </div>
            </div>
        </footer>
    );
}
