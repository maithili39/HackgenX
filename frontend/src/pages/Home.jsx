import { Link } from 'react-router-dom';
import { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { ShieldCheck, Check, Info, FileText, Scale, Landmark, HardHat, Phone, Search, LogIn, FileEdit, ChevronDown } from 'lucide-react';

export default function Home() {
    const { user } = useContext(AuthContext);
    const [activeFaq, setActiveFaq] = useState(null);

    const faqs = [
        { q: "What is CivicSense?", a: "CivicSense is a centralized, AI-powered public grievance redressal platform that allows citizens to securely lodge, track, and resolve their complaints with various government departments 24x7." },
        { q: "Is there any fee for filing a grievance?", a: "No, filing a grievance on CivicSense is completely free of charge. Please beware of any fraudulent platforms requesting payment for submitting complaints." },
        { q: "How long does it take for a complaint to be resolved?", a: "Resolution times vary depending on the complexity of the issue and the assigned department. However, our AI-routing ensures your complaint reaches the correct authority instantly, significantly expediting the process." },
        { q: "Can I track the status of my complaint?", a: "Yes, upon submitting a grievance, you will receive a unique tracking ID and auto-generated alerts via SMS/Email. You can use this ID in the \"View Status\" portal to monitor real-time updates." },
        { q: "What happens if my grievance is not resolved satisfactorily?", a: "If you are unsatisfied with the resolution, you have the option to reopen the grievance or escalate it within the platform by providing feedback on the redressal." },
        { q: "What types of issues are NOT handled by this portal?", a: "CivicSense does not deal with RTI matters, subjudice/court-related cases, religious matters, or internal disciplinary proceedings of government employees." }
    ];

    return (
        <div style={{ padding: '2rem 0', display: 'flex', flexDirection: 'column', gap: '3rem' }}>
            {/* Hero Section */}
            <section className="flex-col animate-fade-in" style={{ alignItems: 'center', textAlign: 'center', paddingTop: '2rem', gap: '1.5rem' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem', background: 'rgba(2, 132, 199, 0.1)', color: 'var(--accent-primary)', borderRadius: '100px', fontWeight: 600, fontSize: '0.9rem' }}>
                    <ShieldCheck size={18} />Public Grievance Portal
                </div>
                <h1 style={{ fontSize: '3.5rem', maxWidth: '800px', lineHeight: 1.1 }}>
                    AI-Powered Insights for <span className="text-gradient">Citizen Voices</span>
                </h1>
                <p style={{ fontSize: '1.25rem', color: 'var(--text-secondary)', maxWidth: '600px' }}>
                    A centralized 24x7 platform connected to all Ministries and Departments, ensuring your grievances reach the right desk for rapid resolution.
                </p>
            </section>

            {/* ── Scrolling Marquee ── */}
            {(() => {
                const items = [
                    'Smart AI Grievances',
                    'Faster SLA Fixes',
                    'Total System Transparency',
                    '24/7 Digital Bridge',
                    'Rapid Verified Resolution',
                    'AI Powered Insights',
                    'Secured Geo-Fenced Proof',
                    'Absolute Accountability Driven',
                ];
                const dotColors = ['#0ea5e9', '#10b981', '#f59e0b', '#7c3aed', '#ef4444', '#06b6d4', '#f97316', '#8b5cf6'];
                // Duplicate for seamless loop
                const track = [...items, ...items];

                return (
                    <div style={{
                        overflow: 'hidden',
                        borderRadius: '100px',
                        background: 'linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)',
                        padding: '0.9rem 0',
                        border: '1px solid rgba(14,165,233,0.25)',
                        boxShadow: '0 4px 24px rgba(2,132,199,0.12)',
                        position: 'relative',
                    }}>
                        {/* Left fade */}
                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to right, #0f172a, transparent)', zIndex: 2, borderRadius: '100px 0 0 100px' }} />
                        {/* Right fade */}
                        <div style={{ position: 'absolute', right: 0, top: 0, bottom: 0, width: '80px', background: 'linear-gradient(to left, #0f172a, transparent)', zIndex: 2, borderRadius: '0 100px 100px 0' }} />

                        <div style={{
                            display: 'flex',
                            width: 'max-content',
                            animation: 'marqueeScroll 28s linear infinite',
                            gap: 0,
                        }}>
                            {track.map((text, i) => (
                                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                    <span style={{
                                        fontSize: '0.92rem',
                                        fontWeight: 600,
                                        color: 'rgba(255,255,255,0.92)',
                                        letterSpacing: '0.02em',
                                        padding: '0 1.5rem',
                                    }}>
                                        {text}
                                    </span>
                                    <span style={{
                                        display: 'inline-block',
                                        width: 8,
                                        height: 8,
                                        borderRadius: '50%',
                                        background: dotColors[i % dotColors.length],
                                        boxShadow: `0 0 6px ${dotColors[i % dotColors.length]}`,
                                        flexShrink: 0,
                                    }} />
                                </span>
                            ))}
                        </div>

                        <style>{`
                            @keyframes marqueeScroll {
                                0%   { transform: translateX(0); }
                                100% { transform: translateX(-50%); }
                            }
                        `}</style>
                    </div>
                );
            })()}

            {/* About the System */}
            <section id="about" className="glass-panel animate-slide-in" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', borderBottom: '2px solid var(--border-color)', paddingBottom: '0.5rem' }}>About CivicSense</h2>
                <div style={{ fontSize: '1rem', lineHeight: 1.7, color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <p>
                        CivicSense is an advanced online platform available to the citizens 24x7 to lodge their grievances to the public authorities on any subject related to service delivery. It is a single portal connected to all the Ministries/Departments of Government. Every Ministry and State has role-based access to this system.
                    </p>
                    <p>
                        The status of the grievance filed can be tracked with the unique registration ID provided at the time of registration of the complainant. CivicSense also provides an appeal facility to the citizens if they are not satisfied with the resolution by the Grievance Officer.
                    </p>
                    <div style={{ display: 'flex', gap: '0.5rem', padding: '1rem', background: 'rgba(2, 132, 199, 0.05)', borderLeft: '4px solid var(--accent-primary)', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0' }}>
                        <Info size={20} color="var(--accent-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
                        <span>
                            <strong>Note:</strong> Once a grievance is registered, the system generates a unique registration number and auto-generates acknowledgement through SMS & email. There is ease of registration of grievance and faster redressal after revamp.
                        </span>
                    </div>
                </div>
            </section>

            <div id="features" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '2rem' }}>
                {/* Advanced Features */}
                <section className="glass-panel" style={{ gridColumn: 'span 5', padding: '2rem' }}>
                    <h3 style={{ fontSize: '1.4rem', marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Advanced Features</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {[
                            'Secure OTP verification',
                            'AI-driven department routing',
                            'Upload photo & document proofs',
                            'Precise Geolocation tagging',
                            'Real-time status tracking'
                        ].map((feature, i) => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
                                <div style={{ background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', padding: '2px', flexShrink: 0, marginTop: '2px' }}>
                                    <Check size={16} color="var(--status-success)" />
                                </div>
                                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{feature}</span>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Exceptions Panel */}
                <section className="glass-panel" style={{ gridColumn: 'span 4', padding: '2rem', borderTop: '4px solid var(--status-critical)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
                        <Info size={20} color="var(--status-critical)" />
                        <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)' }}>Issues NOT taken up:</h3>
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}><FileText size={18} color="var(--text-muted)" /> RTI Matters</li>
                        <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}><Scale size={18} color="var(--text-muted)" /> Court related</li>
                        <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)' }}><Landmark size={18} color="var(--text-muted)" /> Religious matters</li>
                        <li style={{ display: 'flex', gap: '0.75rem', fontSize: '0.95rem', color: 'var(--text-secondary)', alignItems: 'flex-start' }}>
                            <HardHat size={18} color="var(--text-muted)" style={{ flexShrink: 0, marginTop: '2px' }} />
                            <span>Disciplinary proceedings.</span>
                        </li>
                    </ul>
                </section>

                {/* News & Updates Ticker */}
                <section className="glass-panel" style={{ gridColumn: 'span 3', padding: '1.5rem 0', display: 'flex', flexDirection: 'column', height: '350px' }}>
                    <h3 style={{ fontSize: '1.2rem', color: 'var(--text-primary)', padding: '0 1.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.5rem' }}>Local Updates</h3>
                    <div className="news-ticker-container" style={{ flex: 1, padding: '0 1.5rem' }}>
                        <div className="news-ticker-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                            {[
                                { date: 'TODAY', title: 'Water Supply Maintenance', desc: 'Sector 4 will experience low water pressure from 10AM to 2PM.', type: 'var(--status-warning)' },
                                { date: 'YESTERDAY', title: 'Road works on MG Road', desc: 'Expect diversions near City Center crossing for the next 3 days.', type: 'var(--status-info)' },
                                { date: '21 FEB', title: 'Power Outage scheduled', desc: 'Scheduled maintenance in Indiranagar. Outage expected 2PM - 4PM.', type: 'var(--status-critical)' },
                                { date: '19 FEB', title: 'Garbage Collection Drive', desc: 'Special e-waste collection drive happening this weekend.', type: 'var(--status-success)' },
                                // Duplicating for seamless infinite scroll
                                { date: 'TODAY', title: 'Water Supply Maintenance', desc: 'Sector 4 will experience low water pressure from 10AM to 2PM.', type: 'var(--status-warning)' },
                                { date: 'YESTERDAY', title: 'Road works on MG Road', desc: 'Expect diversions near City Center crossing for the next 3 days.', type: 'var(--status-info)' },
                                { date: '21 FEB', title: 'Power Outage scheduled', desc: 'Scheduled maintenance in Indiranagar. Outage expected 2PM - 4PM.', type: 'var(--status-critical)' },
                                { date: '19 FEB', title: 'Garbage Collection Drive', desc: 'Special e-waste collection drive happening this weekend.', type: 'var(--status-success)' }
                            ].map((news, i) => (
                                <div key={i} style={{ borderLeft: `3px solid ${news.type}`, paddingLeft: '0.75rem' }}>
                                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>{news.date}</div>
                                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.25rem', lineHeight: 1.2 }}>{news.title}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>{news.desc}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            </div>

            {/* Disclaimer */}
            <div style={{ padding: '1.5rem', background: 'var(--bg-element)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                <strong>Important:</strong> Government is not charging any fee from the public for filing grievances. Plase be aware of fraudulent platforms asking for payment.
            </div>

            {/* Quick Action Tiles */}
            <section id="contact" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem', marginTop: '1rem' }}>

                {(!user || user.role !== 'citizen') ? (
                    <Link to="/login" style={{ textDecoration: 'none' }}>
                        <div className="action-tile" style={{ background: 'linear-gradient(135deg, #7dd3fc 0%, #0369a1 100%)', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <LogIn size={40} color="#0369a1" />
                            </div>
                            <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Register / Login</h3>
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textAlign: 'center' }}>Authentication required to lodge grievance</span>
                        </div>
                    </Link>
                ) : (
                    <Link to="/submit" style={{ textDecoration: 'none' }}>
                        <div className="action-tile" style={{ background: 'linear-gradient(135deg, #86efac 0%, #15803d 100%)', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-md)' }}>
                            <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                                <FileEdit size={40} color="#15803d" />
                            </div>
                            <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Lodge Grievance</h3>
                            <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textAlign: 'center' }}>Secure AI-powered submission form</span>
                        </div>
                    </Link>
                )}

                <Link to={user?.role === 'citizen' ? "/track" : "/login"} style={{ textDecoration: 'none' }}>
                    <div className="action-tile" style={{ background: 'linear-gradient(135deg, #f9a8d4 0%, #be185d 100%)', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-md)' }}>
                        <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            <Search size={40} color="#be185d" />
                        </div>
                        <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>View Status</h3>
                        <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textAlign: 'center' }}>
                            {(!user || user?.role !== 'citizen') ? 'Login required to view' : 'Track your complaint in real-time'}
                        </span>
                    </div>
                </Link>

                <div className="action-tile" style={{ background: 'linear-gradient(135deg, #fde047 0%, #ca8a04 100%)', padding: '2rem', borderRadius: 'var(--radius-md)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', cursor: 'pointer', transition: 'transform 0.2s', boxShadow: 'var(--shadow-md)' }}>
                    <div style={{ background: 'white', padding: '1rem', borderRadius: '50%', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                        <Phone size={40} color="#ca8a04" />
                    </div>
                    <h3 style={{ color: 'white', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contact Us</h3>
                    <span style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem', textAlign: 'center' }}>Helpline & support for citizens</span>
                </div>

            </section>

            {/* FAQ Section */}
            <section id="faq" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
                <h2 style={{ fontSize: '2rem', textAlign: 'center', marginBottom: '2.5rem' }}>Frequently Asked Questions</h2>
                <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {faqs.map((faq, index) => (
                        <div key={index} style={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-md)', overflow: 'hidden', boxShadow: 'var(--shadow-sm)' }}>
                            <button
                                onClick={() => setActiveFaq(activeFaq === index ? null : index)}
                                style={{
                                    width: '100%', padding: '1.5rem', background: 'transparent', border: 'none',
                                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                    cursor: 'pointer', textAlign: 'left', color: 'var(--text-primary)',
                                    fontWeight: 600, fontSize: '1.05rem', transition: 'background var(--transition-fast)'
                                }}
                                onMouseOver={(e) => e.currentTarget.style.background = 'var(--bg-element)'}
                                onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                            >
                                {faq.q}
                                <ChevronDown
                                    size={20}
                                    style={{
                                        transform: activeFaq === index ? 'rotate(180deg)' : 'rotate(0deg)',
                                        transition: 'transform 0.3s ease',
                                        color: 'var(--text-muted)'
                                    }}
                                />
                            </button>
                            <div style={{
                                maxHeight: activeFaq === index ? '500px' : '0',
                                opacity: activeFaq === index ? 1 : 0,
                                overflow: 'hidden',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                background: 'var(--bg-page)'
                            }}>
                                <div style={{ padding: '0 1.5rem 1.5rem 1.5rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                                    {faq.a}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
}
