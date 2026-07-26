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

    // On mount: verify if admin session is still valid via cookie
    useEffect(() => {
        const verifySession = async () => {
            try {
                const res = await api.get('/auth/verify');
                if (res.data.success) {
                    setAdmin(res.data.admin);
                }
            } catch (error) {
                // No valid session - user is not admin
                setAdmin(null);
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
        }
        return res.data;
    };

    // Logout function: clears JWT cookie on server
    const logout = async () => {
        try {
            await api.post('/auth/logout');
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            setAdmin(null);
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
