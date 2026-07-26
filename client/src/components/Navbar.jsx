import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
    const { isAdmin, admin, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    return (
        <nav className="navbar">
            {/* Brand */}
            <Link to="/" className="navbar-brand" id="navbar-brand-link">
                <span className="navbar-title">
                    Polls
                </span>
            </Link>

            {/* Actions */}
            <div className="navbar-actions">
                {isAdmin ? (
                    <>
                        {/* Admin Navigation Tabs */}
                        <NavLink
                            to="/admin/dashboard"
                            id="nav-dashboard-link"
                            className={({ isActive }) =>
                                `btn btn-ghost btn-sm ${isActive ? 'text-primary-color' : ''}`
                            }
                        >
                            📋 Dashboard
                        </NavLink>
                        <NavLink
                            to="/admin/analytics"
                            id="nav-analytics-link"
                            className={({ isActive }) =>
                                `btn btn-ghost btn-sm ${isActive ? 'text-primary-color' : ''}`
                            }
                        >
                            📈 Analytics
                        </NavLink>
                        {/* Admin Management: superadmin only */}
                        {admin?.role === 'superadmin' && (
                            <NavLink
                                to="/admin/manage"
                                id="nav-manage-link"
                                className={({ isActive }) =>
                                    `btn btn-ghost btn-sm ${isActive ? 'text-primary-color' : ''}`
                                }
                            >
                                👥 Admins
                            </NavLink>
                        )}
                        <span className="navbar-badge">
                            👤 {admin?.username}
                        </span>
                        <button
                            id="navbar-logout-btn"
                            className="btn btn-danger btn-sm"
                            onClick={handleLogout}
                        >
                            Logout
                        </button>
                    </>
                ) : (
                    <>
                        <span className="navbar-badge">Anonymous</span>
                        <Link
                            to="/admin/login"
                            id="navbar-admin-login-link"
                            className="btn btn-secondary btn-sm"
                        >
                            🔐 Admin
                        </Link>
                    </>
                )}
            </div>
        </nav>
    );
};

export default Navbar;
