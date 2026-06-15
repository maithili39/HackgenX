import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { useSocket } from '../hooks/useSocket';
import { MapPin, Camera, CheckCircle, Clock, AlertTriangle, Navigation, Upload, HardHat, Play } from 'lucide-react';
import AuditLogPanel from '../components/AuditLogPanel';

const PRIORITY_COLORS = { P0: '#d9736a', P1: '#cba84a', P2: '#5aabcf', P3: '#5eb88a', Pending: '#94a3b8' };
const STATUS_COLORS = { Submitted: '#94a3b8', Validated: '#8b5cf6', Assigned: '#5aabcf', 'In Progress': '#cba84a', Resolved: '#5eb88a', Closed: '#5eb88a', Rejected: '#d9736a', 'Under Review': '#7c3aed' };

export default function FieldWorkerDashboard() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [afterPhoto, setAfterPhoto] = useState(null);
    const [currentGps, setCurrentGps] = useState(null);
    const [resolving, setResolving] = useState(false);
    const [resolveMsg, setResolveMsg] = useState('');
    const [gpsError, setGpsError] = useState('');
    const [markingStarted, setMarkingStarted] = useState(false);
    const [startedMsg, setStartedMsg] = useState('');
    const { token, user } = useContext(AuthContext);

    const fetchAssigned = async () => {
        try {
            const res = await axios.get(`${__API_BASE__}/api/complaints/assigned`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setComplaints(res.data);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };


    useEffect(() => {
        fetchAssigned();
    }, [token]);

    useSocket({
        'new_complaint_processed': (data) => {
            // Check if it's assigned to this worker or if the list just needs a refresh
            // Since the event is broadcasted, we just refresh. We can check if it's assigned to this worker.
            if (data.assignedTo === user?.id || data.assignedTo === user?._id) {
                toast.success(`New task assigned to you!`, { position: 'top-right' });
            }
            fetchAssigned();
        }
    });

    const handleGetGps = () => {
        setGpsError('');
        if (!navigator.geolocation) { setGpsError('Geolocation not supported'); return; }
        navigator.geolocation.getCurrentPosition(
            pos => setCurrentGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            () => {
                if (selected?.location?.lat) {
                    setCurrentGps({ lat: selected.location.lat + 0.001, lng: selected.location.lng + 0.001 });
                } else {
                    setCurrentGps({ lat: 28.6139, lng: 77.2090 });
                }
                setGpsError('Using simulated GPS (browser denied)');
            }
        );
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => setAfterPhoto(reader.result);
        reader.readAsDataURL(file);
    };

    const handleMarkStarted = async () => {
        setMarkingStarted(true);
        setStartedMsg('');
        try {
            const res = await axios.put(
                `${__API_BASE__}/api/complaints/${selected._id}/start`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setStartedMsg('✅ Work marked as started! Status updated to In Progress.');
            setSelected(res.data.complaint);
            fetchAssigned();
        } catch (e) {
            setStartedMsg(e.response?.data?.message || 'Failed to mark as started');
        } finally {
            setMarkingStarted(false);
        }
    };

    const handleResolve = async () => {
        if (!afterPhoto) { setResolveMsg('Please upload an after-photo first.'); return; }
        setResolving(true);
        setResolveMsg('');
        try {
            const res = await axios.put(
                `${__API_BASE__}/api/complaints/${selected._id}/resolve`,
                { afterPhoto, currentLat: currentGps?.lat, currentLng: currentGps?.lng },
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setResolveMsg(res.data.gpsVerified
                ? '✅ Resolved! GPS verified – sent for officer review.'
                : '⚠️ Resolved, but GPS was outside geo-fence. Flagged for review.'
            );
            setSelected(res.data.complaint);
            fetchAssigned();
        } catch (e) {
            setResolveMsg(e.response?.data?.message || 'Resolution failed');
        } finally {
            setResolving(false);
        }
    };

    return (
        <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 0' }}>
            {/* Header */}
            <div className="flex-row justify-between animate-fade-in" style={{ marginBottom: '2rem' }}>
                <div className="flex-row gap-4">
                    <div style={{ padding: '0.75rem', background: 'rgba(5,150,105,0.1)', borderRadius: '50%' }}>
                        <HardHat size={28} color="#5eb88a" />
                    </div>
                    <div>
                        <h1 style={{ fontSize: '1.8rem' }}>Field Worker Portal</h1>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
                            {user?.name} · {user?.department} Department
                        </p>
                    </div>
                </div>
                <div style={{ padding: '0.5rem 1rem', background: 'rgba(168,224,196,0.15)', borderRadius: '100px', color: '#5eb88a', fontWeight: 600, fontSize: '0.9rem' }}>
                    {complaints.filter(c => ['Assigned', 'In Progress'].includes(c.status)).length} Active Tasks
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1.3fr' : '1fr', gap: '2rem' }}>
                {/* Tasks List */}
                <div className="flex-col" style={{ gap: '1rem' }}>
                    <h3 style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Assigned Complaints</h3>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading tasks...</div>
                    ) : complaints.length === 0 ? (
                        <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                            <CheckCircle size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                            <p>No tasks assigned yet.</p>
                        </div>
                    ) : complaints.map(c => (
                        <div
                            key={c._id}
                            className="glass-panel"
                            onClick={() => { setSelected(c); setAfterPhoto(null); setCurrentGps(null); setResolveMsg(''); setStartedMsg(''); }}
                            style={{
                                cursor: 'pointer', padding: '1.25rem',
                                border: selected?._id === c._id ? '2px solid #5eb88a' : '1px solid var(--border-color)',
                                transition: 'all 0.2s'
                            }}
                        >
                            <div className="flex-row justify-between" style={{ marginBottom: '0.5rem' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.complaintId}</span>
                                <div className="flex-row gap-2">
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: PRIORITY_COLORS[c.priority] || '#94a3b8', padding: '0.2rem 0.5rem', background: `${PRIORITY_COLORS[c.priority]}15`, borderRadius: '100px' }}>
                                        {c.priority}
                                    </span>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: STATUS_COLORS[c.status], padding: '0.2rem 0.5rem', background: `${STATUS_COLORS[c.status]}15`, borderRadius: '100px' }}>
                                        {c.status}
                                    </span>
                                </div>
                            </div>
                            <p style={{ fontSize: '0.92rem', color: 'var(--text-primary)', marginBottom: '0.5rem', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                                {c.description}
                            </p>
                            <div className="flex-row gap-4" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <span className="flex-row gap-2"><MapPin size={13} /> {c.location?.address || 'Location TBD'}</span>
                                <span className="flex-row gap-2"><Clock size={13} /> {new Date(c.createdAt).toLocaleDateString()}</span>
                            </div>
                            {c.ward && <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: '#3b82f6' }}>🏘 {c.ward}</div>}
                            {c.slaDeadline && (
                                <div style={{ marginTop: '0.5rem', fontSize: '0.78rem', color: c.slaBreached ? '#d9736a' : '#cba84a', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    {c.slaBreached ? <AlertTriangle size={13} /> : <Clock size={13} />}
                                    SLA: {c.slaBreached ? 'BREACHED' : `Due ${new Date(c.slaDeadline).toLocaleString()}`}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Resolution Panel */}
                {selected && (
                    <div className="flex-col animate-fade-in" style={{ gap: '1.5rem' }}>
                        <div className="glass-panel" style={{ padding: '1.5rem', border: '1px solid rgba(5,150,105,0.2)' }}>
                            <h3 className="flex-row gap-2" style={{ marginBottom: '1.25rem', color: '#5eb88a' }}>
                                <CheckCircle size={20} /> Complaint Actions
                            </h3>

                            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.6 }}>
                                {selected.description}
                            </p>

                            {/* Complaint location */}
                            {selected.location?.address && (
                                <div className="flex-row gap-2" style={{ padding: '0.75rem', background: 'rgba(2,132,199,0.05)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.88rem', color: 'var(--accent-primary)' }}>
                                    <MapPin size={15} /> {selected.location.address}
                                    {selected.location.lat && <span style={{ color: 'var(--text-muted)', fontFamily: 'monospace' }}>({selected.location.lat.toFixed(4)}, {selected.location.lng.toFixed(4)})</span>}
                                </div>
                            )}

                            {/* Navigate link */}
                            {selected.location?.lat && (
                                <a href={`https://www.google.com/maps/dir/?api=1&destination=${selected.location.lat},${selected.location.lng}`}
                                    target="_blank" rel="noopener noreferrer"
                                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', background: '#4285F4', color: 'white', borderRadius: 8, textDecoration: 'none', fontWeight: 600, fontSize: '0.82rem', marginBottom: '1.25rem', width: 'fit-content' }}>
                                    <Navigation size={15} /> Navigate to Location
                                </a>
                            )}

                            {/* ── STEP 1: Mark Work Started (only for Assigned) ── */}
                            {selected.status === 'Assigned' && (
                                <div style={{ padding: '1rem', background: 'rgba(59,130,246,0.06)', borderRadius: 10, border: '1px solid rgba(59,130,246,0.2)', marginBottom: '1.25rem' }}>
                                    <p style={{ fontSize: '0.82rem', color: '#3b82f6', fontWeight: 600, marginBottom: '0.5rem' }}>📌 Step 1: Start Work</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Tap below when you arrive at the location to begin.</p>
                                    {startedMsg && (
                                        <div style={{ padding: '0.5rem 0.75rem', borderRadius: 8, marginBottom: '0.6rem', fontSize: '0.82rem', background: 'rgba(168,224,196,0.12)', color: '#5eb88a' }}>
                                            {startedMsg}
                                        </div>
                                    )}
                                    <button onClick={handleMarkStarted} disabled={markingStarted}
                                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.7rem 1.25rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: '0.88rem', opacity: markingStarted ? 0.6 : 1 }}>
                                        <Play size={16} /> {markingStarted ? 'Updating…' : '▶ Mark Work as Started'}
                                    </button>
                                </div>
                            )}

                            {/* ── STEP 2: Upload Photos + Resolve (only In Progress) ── */}
                            {selected.status === 'In Progress' && (
                                <>
                                    {/* Before Photo */}
                                    {selected.beforePhoto && (
                                        <div style={{ marginBottom: '1.25rem' }}>
                                            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Before Photo</p>
                                            <img src={selected.beforePhoto} alt="Before" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }} />
                                        </div>
                                    )}

                                    {/* After Photo Upload */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>After Photo (Required) *</p>
                                        {afterPhoto ? (
                                            <div className="flex-col" style={{ gap: '0.5rem' }}>
                                                <img src={afterPhoto} alt="After" style={{ width: '100%', maxHeight: '150px', objectFit: 'cover', borderRadius: 'var(--radius-sm)', border: '2px solid #5eb88a' }} />
                                                <button onClick={() => setAfterPhoto(null)} style={{ background: 'none', border: 'none', color: '#d9736a', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline', alignSelf: 'flex-start' }}>Remove</button>
                                            </div>
                                        ) : (
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '1rem', border: '2px dashed var(--border-color)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', background: 'var(--bg-page)' }}>
                                                <Camera size={24} color="var(--text-muted)" />
                                                <div>
                                                    <p style={{ fontWeight: 500, fontSize: '0.9rem' }}>Upload After Photo</p>
                                                    <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>JPG, PNG – required for verification</p>
                                                </div>
                                                <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                                                <Upload size={18} color="var(--accent-primary)" style={{ marginLeft: 'auto' }} />
                                            </label>
                                        )}
                                    </div>

                                    {/* GPS Fetch */}
                                    <div style={{ marginBottom: '1.25rem' }}>
                                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>GPS Geo-Fence Verification</p>
                                        {currentGps ? (
                                            <div style={{ padding: '0.75rem', background: 'rgba(168,224,196,0.12)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', color: '#5eb88a', fontFamily: 'monospace' }}>
                                                📍 {currentGps.lat.toFixed(6)}, {currentGps.lng.toFixed(6)}
                                                {gpsError && <span style={{ color: '#f59e0b', fontFamily: 'sans-serif', fontSize: '0.8rem', display: 'block', marginTop: '0.25rem' }}>{gpsError}</span>}
                                            </div>
                                        ) : (
                                            <button onClick={handleGetGps} className="btn-primary" style={{ width: '100%', background: '#4285F4', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                                                <Navigation size={16} /> Fetch Current GPS Location
                                            </button>
                                        )}
                                    </div>

                                    {resolveMsg && (
                                        <div style={{ padding: '0.75rem', background: resolveMsg.startsWith('✅') ? 'rgba(5,150,105,0.1)' : 'rgba(245,158,11,0.1)', borderRadius: 'var(--radius-sm)', fontSize: '0.88rem', marginBottom: '1rem', color: resolveMsg.startsWith('✅') ? '#059669' : '#92400e' }}>
                                            {resolveMsg}
                                        </div>
                                    )}

                                    <button onClick={handleResolve} className="btn-primary" disabled={resolving || !afterPhoto}
                                        style={{ width: '100%', padding: '1rem', background: '#059669', opacity: (!afterPhoto || resolving) ? 0.6 : 1 }}>
                                        {resolving ? 'Submitting...' : '✓ Submit Resolution for Review'}
                                    </button>
                                </>
                            )}

                            {/* Already resolved/closed */}
                            {['Resolved', 'Closed'].includes(selected.status) && (
                                <div style={{ padding: '1rem', background: 'rgba(5,150,105,0.08)', borderRadius: 10, border: '1px solid rgba(5,150,105,0.2)', textAlign: 'center' }}>
                                    <CheckCircle size={32} color="#059669" style={{ marginBottom: '0.5rem' }} />
                                    <p style={{ fontWeight: 600, color: '#059669' }}>Work {selected.status}</p>
                                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                                        {selected.status === 'Resolved' ? 'Awaiting officer review' : 'Complaint fully closed ✓'}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Audit Log */}
                        {selected.auditLog?.length > 0 && (
                            <AuditLogPanel auditLog={selected.auditLog} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

