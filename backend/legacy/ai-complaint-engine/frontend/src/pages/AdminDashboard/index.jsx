import { useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import HeatmapPanel from './HeatmapPanel';
import SLAAlertPanel from './SLAAlertPanel';
import DeptStatsPanel from './DeptStatsPanel';
import DeptMappingPanel from './DeptMappingPanel';
import { ShieldAlert, BarChart3, Settings, Map } from 'lucide-react';

const TABS = [
    { id: 'live', label: 'Live Overview', icon: Map },
    { id: 'dept', label: 'Department Stats', icon: BarChart3 },
    { id: 'mapping', label: 'Mapping Config', icon: Settings },
];

export default function AdminDashboard() {
    const { user } = useContext(AuthContext);
    const [activeTab, setActiveTab] = useState('live');

    return (
        <div style={{ maxWidth: '1300px', margin: '0 auto', padding: '2rem 0' }}>
            {/* Header */}
            <div className="flex-row justify-between animate-fade-in" style={{ marginBottom: '1.75rem' }}>
                <div className="flex-row gap-4">
                    <div style={{ padding: '0.75rem', background: 'rgba(2,132,199,0.1)', borderRadius: '50%' }}>
                        <ShieldAlert size={28} color="var(--accent-primary)" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem' }}>
                            National Hub <span className="text-gradient">Intelligence</span>
                        </h1>
                        <p style={{ color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                            Real-time public grievance & escalation monitoring · {user?.name}
                        </p>
                    </div>
                </div>
                <div className="flex-row gap-3">
                    <div className="flex-row gap-2 glass-panel" style={{ padding: '0.5rem 1rem', borderRadius: '100px', border: '1px solid var(--status-success)' }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--status-success)', boxShadow: '0 0 10px rgba(16,185,129,0.5)' }} />
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Live Mode</span>
                    </div>
                </div>
            </div>

            {/* Tab Bar */}
            <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.75rem', padding: '0.4rem', background: 'var(--bg-panel)', borderRadius: 12, border: '1px solid var(--border-color)', width: 'fit-content' }}>
                {TABS.map(({ id, label, icon: Icon }) => {
                    const active = activeTab === id;
                    return (
                        <button key={id} onClick={() => setActiveTab(id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.55rem 1.1rem', borderRadius: 8, border: 'none', cursor: 'pointer',
                                background: active ? 'var(--accent-primary)' : 'transparent',
                                color: active ? 'white' : 'var(--text-secondary)',
                                fontWeight: active ? 600 : 400,
                                fontSize: '0.88rem', transition: 'all 0.2s'
                            }}>
                            <Icon size={15} />
                            {label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content */}
            {activeTab === 'live' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '2rem', alignItems: 'start' }}>
                    <HeatmapPanel />
                    <SLAAlertPanel />
                </div>
            )}
            {activeTab === 'dept' && <DeptStatsPanel />}
            {activeTab === 'mapping' && <DeptMappingPanel />}
        </div>
    );
}
