import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
    { time: '10:00', sentiment: 45, volume: 120 },
    { time: '11:00', sentiment: 50, volume: 145 },
    { time: '12:00', sentiment: 35, volume: 300 },
    { time: '13:00', sentiment: 20, volume: 550 },
    { time: '14:00', sentiment: 15, volume: 620 },
    { time: '15:00', sentiment: 25, volume: 400 },
    { time: '16:00', sentiment: 40, volume: 200 },
];

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div style={{ background: "rgba(10, 10, 15, 0.9)", border: "1px solid var(--border-color)", padding: "10px", borderRadius: "8px", backdropFilter: "blur(10px)" }}>
                <p style={{ color: "#fff", margin: 0, fontWeight: 600 }}>{label}</p>
                <p style={{ color: "var(--accent-primary)", margin: 0 }}>Sentiment: {payload[0].value}</p>
                <p style={{ color: "var(--accent-secondary)", margin: 0 }}>Volume: {payload[1].value}</p>
            </div>
        );
    }
    return null;
};

export default function TrendCharts() {
    return (
        <div className="glass-panel" style={{ height: "400px", display: "flex", flexDirection: "column" }}>
            <div style={{ marginBottom: "1rem" }}>
                <h3 style={{ color: "var(--text-primary)" }}>Complaint Volume vs Average Sentiment</h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>Last 6 hours trending data</p>
            </div>

            <div style={{ flex: 1, width: "100%", height: "100%" }}>
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSentiment" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-primary)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--accent-primary)" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="var(--accent-secondary)" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="var(--accent-secondary)" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />
                        <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                        <Tooltip content={<CustomTooltip />} />
                        <Area type="monotone" dataKey="sentiment" stroke="var(--accent-primary)" strokeWidth={3} fillOpacity={1} fill="url(#colorSentiment)" />
                        <Area type="monotone" dataKey="volume" stroke="var(--accent-secondary)" strokeWidth={3} fillOpacity={1} fill="url(#colorVolume)" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
