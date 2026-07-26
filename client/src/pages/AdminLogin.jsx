import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminLogin = () => {
    const { login, isAdmin, isLoading } = useAuth();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    // If already logged in, redirect to dashboard
    if (!isLoading && isAdmin) {
        return <Navigate to="/admin/dashboard" replace />;
    }

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.username.trim() || !formData.password.trim()) {
            setError('Both username and password are required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const result = await login(formData.username.trim(), formData.password);
            if (result.success) {
                navigate('/admin/dashboard');
            } else {
                setError(result.message || 'Login failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid username or password');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <div className="login-logo-icon">🔐</div>
                </div>

                {/* Title */}
                <h1 className="login-title">Admin Portal</h1>
                <p className="login-subtitle">
                    Sign in to manage polls and view analytics
                </p>

                {/* Error Banner */}
                {error && (
                    <div
                        id="login-error-banner"
                        style={{
                            padding: '12px 16px',
                            background: 'rgba(255,71,87,0.1)',
                            border: '1px solid rgba(255,71,87,0.25)',
                            borderRadius: 'var(--radius-md)',
                            color: 'var(--color-danger)',
                            fontSize: 'var(--font-size-sm)',
                            marginBottom: 'var(--space-lg)',
                            textAlign: 'center'
                        }}
                    >
                        ⚠️ {error}
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleSubmit} noValidate id="admin-login-form">
                    {/* Username */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-username">
                            Username
                        </label>
                        <input
                            id="login-username"
                            type="text"
                            name="username"
                            className="form-input"
                            placeholder="Enter admin username"
                            value={formData.username}
                            onChange={handleChange}
                            autoComplete="username"
                            autoFocus
                        />
                    </div>

                    {/* Password */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="login-password">
                            Password
                        </label>
                        <div style={{ position: 'relative' }}>
                            <input
                                id="login-password"
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                className="form-input"
                                placeholder="Enter admin password"
                                value={formData.password}
                                onChange={handleChange}
                                autoComplete="current-password"
                                style={{ paddingRight: '48px' }}
                            />
                            <button
                                type="button"
                                id="toggle-password-btn"
                                onClick={() => setShowPassword((p) => !p)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    color: 'var(--text-muted)'
                                }}
                                aria-label="Toggle password visibility"
                            >
                                {showPassword ? '🙈' : '👁️'}
                            </button>
                        </div>
                    </div>

                    {/* Submit */}
                    <button
                        id="admin-login-submit-btn"
                        type="submit"
                        className="btn btn-primary btn-full btn-lg"
                        disabled={isSubmitting}
                        style={{ marginTop: 'var(--space-lg)' }}
                    >
                        {isSubmitting ? '⏳ Signing In...' : '🔐 Sign In'}
                    </button>
                </form>

                {/* Back to polls */}
                <div style={{ textAlign: 'center', marginTop: 'var(--space-lg)' }}>
                    <a
                        href="/"
                        id="back-to-polls-link"
                        style={{
                            fontSize: 'var(--font-size-sm)',
                            color: 'var(--text-muted)',
                            textDecoration: 'none'
                        }}
                    >
                        ← Back to Polls
                    </a>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;
