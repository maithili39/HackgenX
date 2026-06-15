import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import React, { useContext, lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Toaster } from 'react-hot-toast';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import TrackStatus from './pages/TrackStatus';
import { AuthContext } from './context/AuthContext';
import api from './api/axios.js';
import toast from 'react-hot-toast';
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || "",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/yourserver\.io\/api/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

// Lazy load dashboard pages for code-splitting
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'));
const FieldWorkerDashboard = lazy(() => import('./pages/FieldWorkerDashboard'));
const OfficerDashboard = lazy(() => import('./pages/OfficerDashboard'));
const CommissionerDashboard = lazy(() => import('./pages/CommissionerDashboard'));
const CitizenDashboard = lazy(() => import('./pages/CitizenDashboard'));

// Global Interceptor for Session Expiry (401 after refresh failed)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // If error is 401 and we've already tried to refresh (or refresh failed)
        if (error.response && error.response.status === 401 && error.config._retry) {
            if (window.location.pathname !== '/login') {
                toast.error('Session expired. Please log in again.');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

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
            <Toaster position="top-right" />
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
                <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Home />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />

                        {/* Citizen Routes */}
                        <Route path="/submit" element={<Navigate to="/dashboard" state={{ openSection: 'submit' }} replace />} />
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
                </Suspense>
            </main>
            {!isDashboard && <Footer />}
        </div>
    );
}

export default App;
