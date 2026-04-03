import { LayoutDashboard, AlertTriangle, MessageSquare, BarChart2, ShieldAlert, Settings } from 'lucide-react';

export default function Sidebar() {
    const menuItems = [
        { icon: <LayoutDashboard size={20} />, label: "Command Center", active: true },
        { icon: <AlertTriangle size={20} />, label: "Escalation Risk", active: false },
        { icon: <MessageSquare size={20} />, label: "Actionable Feed", active: false },
        { icon: <BarChart2 size={20} />, label: "Insights & Trends", active: false },
        { icon: <ShieldAlert size={20} />, label: "Fraud Detection", active: false },
        { icon: <Settings size={20} />, label: "Engine Config", active: false },
    ];

    return (
        <div className="glass-panel animate-fade-in" style={{ height: "calc(100vh - 4rem)", position: "sticky", top: "2rem", display: "flex", flexDirection: "column" }}>
            <div className="flex-row gap-4" style={{ marginBottom: "3rem" }}>
                <div style={{
                    width: 32, height: 32, borderRadius: 8,
                    background: "linear-gradient(45deg, var(--accent-primary), var(--accent-secondary))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: "bold", color: "#fff"
                }}>AI</div>
                <h2 className="text-gradient" style={{ fontSize: "1.2rem", fontWeight: 700, margin: 0 }}>CivicSense</h2>
            </div>

            <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {menuItems.map((item, i) => (
                    <button
                        key={i}
                        className="flex-row gap-4"
                        style={{
                            padding: "0.75rem 1rem",
                            borderRadius: "var(--radius-sm)",
                            border: "none",
                            background: item.active ? "rgba(255, 255, 255, 0.05)" : "transparent",
                            color: item.active ? "var(--text-primary)" : "var(--text-secondary)",
                            textAlign: "left",
                            cursor: "pointer",
                            transition: "var(--transition-fast)",
                            borderLeft: item.active ? "3px solid var(--accent-primary)" : "3px solid transparent",
                            fontWeight: item.active ? 600 : 500,
                            display: "flex", alignItems: "center", width: "100%"
                        }}
                        onMouseEnter={(e) => {
                            if (!item.active) e.currentTarget.style.color = "var(--text-primary)";
                        }}
                        onMouseLeave={(e) => {
                            if (!item.active) e.currentTarget.style.color = "var(--text-secondary)";
                        }}
                    >
                        <span style={{ color: item.active ? "var(--accent-primary)" : "inherit" }}>
                            {item.icon}
                        </span>
                        {item.label}
                    </button>
                ))}
            </nav>

            <div style={{ marginTop: "auto", paddingTop: "2rem", borderTop: "1px solid var(--border-color)", fontSize: "0.8rem", color: "var(--text-muted)" }}>
                <div className="flex-row gap-2" style={{ marginBottom: "0.5rem" }}>
                    <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--status-success)", boxShadow: "0 0 8px var(--status-success)" }}></div>
                    <span>Engine Status: Online</span>
                </div>
                <div>Processing 12,402 items/hr</div>
            </div>
        </div>
    );
}
