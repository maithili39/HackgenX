import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useContext } from 'react';
import PropTypes from 'prop-types';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import SubmitComplaint from './pages/SubmitComplaint';
import TrackStatus from './pages/TrackStatus';
import AdminDashboard from './pages/AdminDashboard';
import FieldWorkerDashboard from './pages/FieldWorkerDashboard';
import OfficerDashboard from './pages/OfficerDashboard';
import CommissionerDashboard from './pages/CommissionerDashboard';
import CitizenDashboard from './pages/CitizenDashboard';
import { AuthContext } from './context/AuthContext';

// Protected Route Wrapper
const ProtectedRoute = ({ children, allowedRoles = [] }) => {
    ProtectedRoute.propTypes = {
        children: PropTypes.node.isRequired,
        allowedRoles: PropTypes.arrayOf(PropTypes.string),
    };
    const { user, loading } = useContext(AuthContext);

    if (loading) return <div style={{ padding: "2rem", textAlign: "center" }}>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
        const roleHome = {
            citizen: '/dashboard',
            admin: '/admin',
            field_worker: '/field-worker',
            officer: '/officer',
            commissioner: '/commissioner'
        };
        return <Navigate to={roleHome[user.role] || '/'} replace />;
    }

    return children;
};

function App() {
    const location = useLocation();
    // All dashboard routes have their own full-page layout (no shared Navbar/Footer)
    const DASHBOARD_PATHS = ['/dashboard', '/admin', '/commissioner', '/officer', '/field-worker'];
    const isDashboard = DASHBOARD_PATHS.some(p => location.pathname === p || location.pathname.startsWith(p + '/'));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', position: 'relative', zIndex: 0 }}>
            {!isDashboard && (
                <>
                    <div className="mesh-bg-top animate-fade-in" />
                    <div className="mesh-bg-bottom animate-fade-in" />
                </>
            )}
            {!isDashboard && <Navbar />}
            <main
                className={isDashboard ? '' : 'main-content container'}
                style={{ flex: 1, paddingBottom: isDashboard ? 0 : '4rem' }}>
                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />

                    {/* Citizen Routes */}
                    <Route path="/submit" element={
                        <ProtectedRoute allowedRoles={['citizen']}>
                            <SubmitComplaint />
                        </ProtectedRoute>
                    } />
                    <Route path="/track" element={
                        <ProtectedRoute allowedRoles={['citizen']}>
                            <TrackStatus />
                        </ProtectedRoute>
                    } />
                    <Route path="/dashboard" element={
                        <ProtectedRoute allowedRoles={['citizen']}>
                            <CitizenDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Admin Route */}
                    <Route path="/admin" element={
                        <ProtectedRoute allowedRoles={['admin']}>
                            <AdminDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Field Worker Route */}
                    <Route path="/field-worker" element={
                        <ProtectedRoute allowedRoles={['field_worker']}>
                            <FieldWorkerDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Officer Route */}
                    <Route path="/officer" element={
                        <ProtectedRoute allowedRoles={['officer']}>
                            <OfficerDashboard />
                        </ProtectedRoute>
                    } />

                    {/* Commissioner Route */}
                    <Route path="/commissioner" element={
                        <ProtectedRoute allowedRoles={['commissioner']}>
                            <CommissionerDashboard />
                        </ProtectedRoute>
                    } />

                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </main>
            {!isDashboard && <Footer />}
        </div>
    );
}

export default App;
