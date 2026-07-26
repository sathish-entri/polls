import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

// Create context for admin auth state
const AuthContext = createContext(null);

// Custom hook to consume auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

// Auth Provider component
export const AuthProvider = ({ children }) => {
    const [admin, setAdmin] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // On mount: verify session via cookie (desktop), fallback to localStorage (mobile)
    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await api.get('/auth/verify');
                if (res.data.success) {
                    setAdmin(res.data.admin);
                    // Keep localStorage in sync
                    localStorage.setItem('adminSession', JSON.stringify(res.data.admin));
                }
            } catch (error) {
                // Cookie-based session failed (common on mobile cross-domain)
                // Try localStorage fallback
                const stored = localStorage.getItem('adminSession');
                if (stored) {
                    try {
                        setAdmin(JSON.parse(stored));
                    } catch {
                        localStorage.removeItem('adminSession');
                        setAdmin(null);
                    }
                } else {
                    setAdmin(null);
                }
            } finally {
                setIsLoading(false);
            }
        };
        verifySession();
    }, []);

    // Login function: sends credentials to backend, receives JWT in cookie
    const login = async (username, password) => {
        const res = await api.post('/auth/login', { username, password });
        if (res.data.success) {
            setAdmin(res.data.admin);
            // Save admin object for session restore
            localStorage.setItem('adminSession', JSON.stringify(res.data.admin));
            // Save token for Bearer header on mobile (bypasses cross-domain cookie block)
            if (res.data.token) {
                localStorage.setItem('adminToken', res.data.token);
            }
        }
        return res.data;
    };

    // Logout function: clears JWT cookie on server and localStorage
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAdmin(null);
            localStorage.removeItem('adminSession');
            localStorage.removeItem('adminToken');
        }
    };

    const value = {
        admin,
        isAdmin: !!admin,
        isLoading,
        login,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
