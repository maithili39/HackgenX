import { AlertOctagon, ArrowRight, Lightbulb } from 'lucide-react';

const InsightItem = ({ category, text, impact, isActionable }) => (
    <div className="flex-col gap-2 animate-fade-in" style={{
        padding: "1rem",
        background: "rgba(0, 0, 0, 0.2)",
        borderRadius: "var(--radius-sm)",
        border: "1px solid rgba(255,255,255,0.05)"
    }}>
        <div className="flex-row justify-between" style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
            <span style={{ textTransform: "uppercase", letterSpacing: "1px" }}>{category}</span>
            <span style={{
                color: impact === 'High' ? "var(--status-critical)" : "var(--status-warning)",
                fontWeight: 600
            }}>Impact: {impact}</span>
        </div>
        <div className="flex-row gap-2" style={{ color: "var(--text-primary)", fontSize: "0.95rem" }}>
            {impact === 'High' ? <AlertOctagon size={18} color="var(--status-critical)" /> : <Lightbulb size={18} color="var(--status-warning)" />}
            <span>{text}</span>
        </div>
        {isActionable && (
            <button className="flex-row gap-2" style={{
                marginTop: "0.5rem", padding: "0.5rem 1rem",
                background: "var(--accent-primary)", color: "#000",
                fontWeight: 600, border: "none", borderRadius: "100px",
                cursor: "pointer", width: "fit-content",
                transition: "var(--transition-fast)", boxShadow: "0 0 15px rgba(0, 240, 255, 0.3)"
            }}>
                Take Action <ArrowRight size={16} />
            </button>
        )}
    </div>
);

export default function InsightsPanel() {
    return (
        <div className="glass-panel" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="flex-row justify-between" style={{ borderBottom: "1px solid var(--border-color)", paddingBottom: "1rem" }}>
                <h3 className="flex-row gap-2">
                    <Lightbulb size={20} color="var(--accent-secondary)" />
                    AI Automated Insights
                </h3>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <InsightItem
                    category="Anomaly Detected"
                    text="45% spike in 'Payment Gateway Failures' originating from Maharashtra block over the last 2 hours."
                    impact="High"
                    isActionable={true}
                />
                <InsightItem
                    category="Emerging Trend"
                    text="Sentiment towards 'Customer Support Wait Times' dropped by 12 points since yesterday."
                    impact="Medium"
                    isActionable={true}
                />
                <InsightItem
                    category="Root Cause Identified"
                    text="Most logistics complaints correlate with Order IDs starting with 'DLV-X9'."
                    impact="Medium"
                    isActionable={false}
                />
            </div>
        </div>
    );
}
