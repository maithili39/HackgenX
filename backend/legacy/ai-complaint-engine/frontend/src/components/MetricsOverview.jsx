import { TrendingUp, Users, Activity, Clock } from 'lucide-react';

const MetricCard = ({ title, value, change, isPositive, icon, delay }) => (
    <div className={`glass-panel animate-fade-in`} style={{ animationDelay: `${delay}s`, padding: "1.25rem" }}>
        <div className="flex-row justify-between" style={{ marginBottom: "1rem" }}>
            <div style={{ color: "var(--text-secondary)", fontSize: "0.875rem", fontWeight: 500 }}>{title}</div>
            <div style={{ color: "var(--accent-primary)", opacity: 0.8 }}>{icon}</div>
        </div>
        <div style={{ fontSize: "2rem", fontWeight: 700, marginBottom: "0.5rem" }}>{value}</div>
        <div className="flex-row gap-2" style={{ fontSize: "0.75rem" }}>
            <span style={{
                color: isPositive ? "var(--status-success)" : "var(--status-critical)",
                background: isPositive ? "rgba(0, 230, 118, 0.1)" : "rgba(255, 59, 59, 0.1)",
                padding: "2px 6px", borderRadius: "4px", fontWeight: 600
            }}>
                {isPositive ? '↑' : '↓'} {Math.abs(change)}%
            </span>
            <span style={{ color: "var(--text-muted)" }}>vs last 24h</span>
        </div>
        <div className="glow-border"></div>
    </div>
);

export default function MetricsOverview() {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "1.5rem",
            marginBottom: "2rem"
        }}>
            <MetricCard
                title="Total Complaints Analyzed"
                value="124,502"
                change={12.5}
                isPositive={false}
                icon={<Activity size={20} />}
                delay={0.1}
            />
            <MetricCard
                title="Critical Escalation Risk"
                value="42"
                change={-8.2}
                isPositive={true}
                icon={<TrendingUp size={20} />}
                delay={0.2}
            />
            <MetricCard
                title="Auto-Routed to Depts"
                value="98.2%"
                change={4.1}
                isPositive={true}
                icon={<Users size={20} />}
                delay={0.3}
            />
            <MetricCard
                title="Avg AI Processing Time"
                value="0.8s"
                change={-15.0}
                isPositive={true}
                icon={<Clock size={20} />}
                delay={0.4}
            />
        </div>
    );
}
