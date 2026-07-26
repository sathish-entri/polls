import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Wraps admin-only routes - redirects to login if not authenticated
const ProtectedRoute = ({ children }) => {
    const { isAdmin, isLoading } = useAuth();

    // Show loading while verifying session
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Verifying session...</p>
            </div>
        );
    }

    // Redirect to admin login if not authenticated
    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }

    return children;
};

export default ProtectedRoute;
