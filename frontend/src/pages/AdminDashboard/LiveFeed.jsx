import { useEffect, useState, useContext } from 'react';
import { Shield, MapPin, Zap } from 'lucide-react';
import axios from 'axios';
import { AuthContext } from '../../context/AuthContext';
import { io } from 'socket.io-client';

export default function LiveFeed() {
    const [feed, setFeed] = useState([]);
    const { token } = useContext(AuthContext);

    useEffect(() => {
        // Initial Fetch (simulated fast polling for MVP or Socket)
        const fetchComplaints = async () => {
            try {
                const res = await axios.get('http://localhost:5000/api/complaints/all', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setFeed(res.data.slice(0, 10)); // Top 10 newest
            } catch (err) {
                console.error('Failed to fetch initial feed');
            }
        };
        fetchComplaints();

        // Socket.io Real-Time Connection
        const socket = io(__API_BASE__);
        socket.on('new_complaint_processed', (newComplaint) => {
            setFeed(prev => [newComplaint, ...prev].slice(0, 10));
        });

        return () => socket.disconnect();
    }, [token]);

    return (
        <div className="glass-panel" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
            <div className="flex-row justify-between" style={{ marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-color)" }}>
                <h3 className="flex-row gap-2" style={{ color: "var(--text-primary)" }}>
                    <Zap size={18} color="var(--accent-primary)" /> Live Actionable Feed
                </h3>
                <div className="flex-row gap-2">
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-success)", animation: "pulse-subtle 2s infinite" }}></span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-secondary)" }}>WebSockets Active</span>
                </div>
            </div>

            <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1rem" }}>
                {feed.map((item, i) => (
                    <div
                        key={item._id || i}
                        className="animate-slide-in"
                        style={{
                            padding: "1rem",
                            background: "#fff",
                            borderRadius: "var(--radius-sm)",
                            border: "1px solid var(--border-color)",
                            borderLeft: item.riskLevel === 'Critical' ? "4px solid var(--status-critical)" : item.riskLevel === 'High' ? "4px solid var(--status-warning)" : "4px solid var(--accent-primary)",
                            display: "flex", flexDirection: "column", gap: "0.5rem",
                            boxShadow: "var(--shadow-sm)"
                        }}
                    >
                        <div className="flex-row justify-between" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                            <span style={{ fontFamily: "monospace" }}>ID: {item._id}</span>
                            <span className="flex-row gap-2"><MapPin size={12} /> {new Date(item.createdAt).toLocaleTimeString()}</span>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text-primary)" }}>"{item.description}"</p>
                        <div className="flex-row" style={{ gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(2, 132, 199, 0.1)", borderRadius: "12px", border: "1px solid rgba(2, 132, 199, 0.2)", color: "var(--accent-primary)" }}>
                                Dept: {item.department}
                            </span>
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: item.riskLevel === 'Critical' || item.riskLevel === 'High' ? "rgba(239, 68, 68, 0.1)" : "rgba(100, 116, 139, 0.1)", borderRadius: "12px", color: item.riskLevel === 'Critical' || item.riskLevel === 'High' ? 'var(--status-critical)' : 'var(--text-secondary)' }}>
                                Risk: {item.riskLevel}
                            </span>
                            <span style={{ fontSize: "0.7rem", padding: "2px 8px", background: "rgba(14, 165, 233, 0.1)", borderRadius: "12px", color: "var(--accent-secondary)" }}>
                                Emotion: {item.emotion}
                            </span>
                        </div>
                    </div>
                ))}
                {feed.length === 0 && (
                    <div style={{ textAlign: 'center', color: 'var(--text-muted)', marginTop: '2rem' }}>Waiting for real-time complaints feed...</div>
                )}
            </div>
        </div>
    );
}
