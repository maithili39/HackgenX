import { useEffect, useState } from 'react';
import { MapPin, Zap } from 'lucide-react';

const mockComplaints = [
    { id: '10x992', desc: 'Payment Gateway failed 3 times during checkout. Money deducted!', dept: 'Billing', risk: 'High', emotion: 'Irate', time: 'Just now' },
    { id: '10x991', desc: 'Delivery partner marked order delivered but I haven\'t received it.', dept: 'Logistics', risk: 'Medium', emotion: 'Frustrated', time: '1m ago' },
    { id: '10x990', desc: 'App keeps crashing when I open the profile section on Android.', dept: 'Tech Support', risk: 'Low', emotion: 'Annoyed', time: '3m ago' },
    { id: '10x989', desc: 'Subscription auto-renewed without my consent. Cancel it immediately or I\'ll sue.', dept: 'Legal/Billing', risk: 'Critical', emotion: 'Furious', time: '5m ago' },
];

export default function LiveFeed() {
    const [feed, setFeed] = useState(mockComplaints);

    useEffect(() => {
        // Simulate incoming data stream
        const interval = setInterval(() => {
            const newItems = ['Login page is down for UK regions', 'Received a fake product, terrible quality', 'Customer support put me on hold for 40 mins'];
            const randomMsg = newItems[Math.floor(Math.random() * newItems.length)];
            setFeed(prev => {
                const newFeed = [{
                    id: `10x${Math.floor(Math.random() * 1000)}`,
                    desc: randomMsg,
                    dept: 'Auto-Triaging...',
                    risk: 'Calculating...',
                    emotion: 'Analyzing...',
                    time: 'Just now'
                }, ...prev];
                return newFeed.slice(0, 5); // Keep list short for demo
            });
        }, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="glass-panel" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
            <div className="flex-row justify-between" style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                <h3 className="flex-row gap-2" style={{ color: "var(--text-primary)" }}>
                    <Zap size={18} color="var(--accent-primary)" /> Live Actionable Feed
                </h3>
                <div className="flex-row gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-success)", animation: "pulse-subtle 2s infinite" }}></span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>Listening</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {feed.map((item, i) => (
                    <div
                        key={item.id + i}
                        className="animate-slide-in"
                        style={{
                            padding: "1rem",
                            background: "rgba(255,255,255,0.02)",
                            borderRadius: "var(--radius-sm)",
                            borderLeft: item.risk === 'Critical' ? "3px solid var(--status-critical)" : item.risk === 'High' ? "3px solid var(--status-warning)" : "3px solid var(--accent-primary)",
                            display: "flex", flexDirection: "column", gap: "0.5rem"
                        }}
                    >
                        <div className="flex-row justify-between" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <span>ID: {item.id}</span>
                            <span className="flex-row gap-2"><MapPin size={12} /> {item.time}</span>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>{item.desc}</p>
                        <div className="flex-row" style={{ gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(0,0,0,0.5)", borderRadius: "12px", border: "1px solid var(--border-color)", color: "var(--text-secondary)" }}>
                                Dept: {item.dept}
                            </span>
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(255,59,59,0.1)", borderRadius: "12px", color: item.risk === 'Critical' || item.risk === 'High' ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                                Risk: {item.risk}
                            </span>
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(112, 0, 255, 0.1)", borderRadius: "12px", color: "var(--accent-secondary)" }}>
                                Emotion: {item.emotion}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
