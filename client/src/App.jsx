import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import UserHome from './pages/UserHome';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminManagement from './pages/AdminManagement';

const App = () => {
    return (
        <AuthProvider>
            <Router>
                <div className="app-layout">
                    {/* Global Navbar - visible on all pages */}
                    <Navbar />

                    {/* Application Routes */}
                    <Routes>
                        {/* Public: Anonymous user poll voting page */}
                        <Route path="/" element={<UserHome />} />

                        {/* Public: Admin login */}
                        <Route path="/admin/login" element={<AdminLogin />} />

                        {/* Protected: Admin poll management dashboard */}
                        <Route
                            path="/admin/dashboard"
                            element={
                                <ProtectedRoute>
                                    <AdminDashboard />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected: Admin analytics */}
                        <Route
                            path="/admin/analytics"
                            element={
                                <ProtectedRoute>
                                    <AdminAnalytics />
                                </ProtectedRoute>
                            }
                        />

                        {/* Protected: Admin user management (superadmin only) */}
                        <Route
                            path="/admin/manage"
                            element={
                                <ProtectedRoute>
                                    <AdminManagement />
                                </ProtectedRoute>
                            }
                        />

                        {/* Catch-all: redirect to home */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                </div>
            </Router>
        </AuthProvider>
    );
};

export default App;
