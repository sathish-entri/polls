import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

// AdminManagement page - only accessible by superadmin
// Allows creating, deactivating, and deleting admin accounts
const AdminManagement = () => {
    const { admin } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [toast, setToast] = useState(null);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // New admin form state
    const [newAdmin, setNewAdmin] = useState({ username: '', password: '', email: '' });
    const [formErrors, setFormErrors] = useState({});
    const [isCreating, setIsCreating] = useState(false);

    // Reset password modal state
    const [resetModal, setResetModal] = useState(null); // { adminId, username }
    const [newPassword, setNewPassword] = useState('');
    const [isResetting, setIsResetting] = useState(false);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch all admin accounts
    const fetchAdmins = async () => {
        try {
            const res = await api.get('/auth/admins');
            if (res.data.success) {
                setAdmins(res.data.data);
            }
        } catch (err) {
            showToast('Failed to load admin accounts', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAdmins();
    }, []);

    // Validate create admin form
    const validateForm = () => {
        const errors = {};
        if (!newAdmin.username.trim()) errors.username = 'Username is required';
        else if (newAdmin.username.trim().length < 3) errors.username = 'Min 3 characters';
        if (!newAdmin.password) errors.password = 'Password is required';
        else if (newAdmin.password.length < 6) errors.password = 'Min 6 characters';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Create new admin
    const handleCreateAdmin = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsCreating(true);
        try {
            const res = await api.post('/auth/admins', {
                username: newAdmin.username.trim(),
                password: newAdmin.password,
                email: newAdmin.email.trim(),
                role: 'admin'
            });
            if (res.data.success) {
                setAdmins((prev) => [res.data.data, ...prev]);
                setNewAdmin({ username: '', password: '', email: '' });
                setShowCreateForm(false);
                showToast(`Admin "${res.data.data.username}" created successfully! 🎉`);
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create admin';
            setFormErrors({ submit: message });
        } finally {
            setIsCreating(false);
        }
    };

    // Toggle admin active/inactive
    const handleToggle = async (adminId, username) => {
        setActionLoadingId(adminId);
        try {
            const res = await api.patch(`/auth/admins/${adminId}/toggle`);
            if (res.data.success) {
                setAdmins((prev) =>
                    prev.map((a) =>
                        a._id === adminId ? { ...a, isActive: res.data.data.isActive } : a
                    )
                );
                showToast(res.data.message);
            }
        } catch (err) {
            showToast('Failed to update admin status', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Delete admin confirmation modal state
    const [deleteModal, setDeleteModal] = useState({ show: false, adminId: null, username: '' });

    // Open delete admin confirmation modal
    const handleDeleteClick = (adminId, username) => {
        setDeleteModal({ show: true, adminId, username });
    };

    // Confirm delete admin account
    const confirmDeleteAdmin = async () => {
        if (!deleteModal.adminId) return;

        const adminId = deleteModal.adminId;
        const username = deleteModal.username;
        setActionLoadingId(adminId);

        try {
            const res = await api.delete(`/auth/admins/${adminId}`);
            if (res.data.success) {
                setAdmins((prev) => prev.filter((a) => a._id !== adminId));
                showToast(`Admin "${username}" deleted`);
                setDeleteModal({ show: false, adminId: null, username: '' });
            }
        } catch (err) {
            showToast('Failed to delete admin', 'error');
        } finally {
            setActionLoadingId(null);
        }
    };

    // Reset admin password
    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            showToast('Password must be at least 6 characters', 'error');
            return;
        }
        setIsResetting(true);
        try {
            const res = await api.patch(`/auth/admins/${resetModal.adminId}/password`, {
                newPassword
            });
            if (res.data.success) {
                showToast(`Password for "${resetModal.username}" reset successfully`);
                setResetModal(null);
                setNewPassword('');
            }
        } catch (err) {
            showToast('Failed to reset password', 'error');
        } finally {
            setIsResetting(false);
        }
    };

    // Format date
    const formatDate = (dateStr) => {
        if (!dateStr) return 'Never';
        return new Date(dateStr).toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading admin accounts...</p>
            </div>
        );
    }

    return (
        <div className="page-container page-container--wide">
            {/* Toast */}
            {toast && (
                <div className="toast-container">
                    <div className={`toast toast-${toast.type}`}>
                        {toast.type === 'success' ? '✅' : '❌'} {toast.message}
                    </div>
                </div>
            )}

            {/* Page Header */}
            <div className="page-header">
                <div className="page-header__left">
                    <h1 className="page-title">👥 Admin Management</h1>
                    <p className="page-subtitle">
                        Create, manage, and control access for admin accounts
                    </p>
                </div>
                <button
                    id="add-admin-btn"
                    className="btn btn-primary"
                    onClick={() => {
                        setShowCreateForm((v) => !v);
                        setFormErrors({});
                    }}
                >
                    {showCreateForm ? '✕ Cancel' : '➕ Add New Admin'}
                </button>
            </div>

            {/* Super Admin Info Banner */}
            <div
                style={{
                    background: 'rgba(37, 211, 102, 0.06)',
                    border: '1px solid rgba(37, 211, 102, 0.2)',
                    borderRadius: 'var(--radius-lg)',
                    padding: 'var(--space-md) var(--space-lg)',
                    marginBottom: 'var(--space-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)'
                }}
            >
                <span style={{ fontSize: '24px' }}>👑</span>
                <div>
                    <div style={{ fontWeight: 700, color: 'var(--color-primary)', fontSize: 'var(--font-size-sm)' }}>
                        Super Admin: <span style={{ color: 'var(--text-primary)' }}>{admin?.username}</span>
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                        Super admin account is managed via the server .env file — cannot be edited here
                    </div>
                </div>
            </div>

            {/* Create Admin Form */}
            {showCreateForm && (
                <div
                    className="card"
                    style={{
                        marginBottom: 'var(--space-lg)',
                        border: '1px solid var(--border-active)',
                        background: 'rgba(37,211,102,0.03)'
                    }}
                >
                    <h3
                        style={{
                            fontSize: 'var(--font-size-lg)',
                            fontWeight: 700,
                            marginBottom: 'var(--space-lg)',
                            color: 'var(--text-primary)'
                        }}
                    >
                        ➕ Create New Admin Account
                    </h3>

                    <form onSubmit={handleCreateAdmin} noValidate id="create-admin-form">
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr 1fr',
                                gap: 'var(--space-md)'
                            }}
                        >
                            {/* Username */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" htmlFor="new-admin-username">
                                    Username <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <input
                                    id="new-admin-username"
                                    type="text"
                                    className="form-input"
                                    placeholder="e.g. john_admin"
                                    value={newAdmin.username}
                                    onChange={(e) => {
                                        setNewAdmin({ ...newAdmin, username: e.target.value });
                                        if (formErrors.username)
                                            setFormErrors({ ...formErrors, username: '' });
                                    }}
                                    maxLength={30}
                                />
                                {formErrors.username && (
                                    <span className="form-error">{formErrors.username}</span>
                                )}
                            </div>

                            {/* Password */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" htmlFor="new-admin-password">
                                    Password <span style={{ color: 'var(--color-danger)' }}>*</span>
                                </label>
                                <input
                                    id="new-admin-password"
                                    type="password"
                                    className="form-input"
                                    placeholder="Min 6 characters"
                                    value={newAdmin.password}
                                    onChange={(e) => {
                                        setNewAdmin({ ...newAdmin, password: e.target.value });
                                        if (formErrors.password)
                                            setFormErrors({ ...formErrors, password: '' });
                                    }}
                                />
                                {formErrors.password && (
                                    <span className="form-error">{formErrors.password}</span>
                                )}
                            </div>

                            {/* Email (optional) */}
                            <div className="form-group" style={{ margin: 0 }}>
                                <label className="form-label" htmlFor="new-admin-email">
                                    Email <span style={{ color: 'var(--text-muted)' }}>(optional)</span>
                                </label>
                                <input
                                    id="new-admin-email"
                                    type="email"
                                    className="form-input"
                                    placeholder="admin@company.com"
                                    value={newAdmin.email}
                                    onChange={(e) =>
                                        setNewAdmin({ ...newAdmin, email: e.target.value })
                                    }
                                />
                            </div>
                        </div>

                        {/* Submit error */}
                        {formErrors.submit && (
                            <div
                                style={{
                                    marginTop: 'var(--space-md)',
                                    padding: '10px 14px',
                                    background: 'rgba(255,71,87,0.1)',
                                    border: '1px solid rgba(255,71,87,0.25)',
                                    borderRadius: 'var(--radius-md)',
                                    color: 'var(--color-danger)',
                                    fontSize: 'var(--font-size-sm)'
                                }}
                            >
                                ⚠️ {formErrors.submit}
                            </div>
                        )}

                        <div className="flex gap-sm" style={{ marginTop: 'var(--space-lg)' }}>
                            <button
                                type="submit"
                                id="submit-new-admin-btn"
                                className="btn btn-primary"
                                disabled={isCreating}
                            >
                                {isCreating ? '⏳ Creating...' : '✅ Create Admin'}
                            </button>
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setNewAdmin({ username: '', password: '', email: '' });
                                    setFormErrors({});
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Admins List */}
            {admins.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">👤</div>
                    <h2 className="empty-state__title">No Admin Accounts Yet</h2>
                    <p className="empty-state__text">
                        Create admin accounts to allow others to manage polls.
                    </p>
                    <button
                        className="btn btn-primary"
                        onClick={() => setShowCreateForm(true)}
                    >
                        ➕ Create First Admin
                    </button>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {admins.map((adminUser) => {
                        const isLoading = actionLoadingId === adminUser._id;

                        return (
                            <div
                                key={adminUser._id}
                                id={`admin-user-${adminUser._id}`}
                                className="card"
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    gap: 'var(--space-md)',
                                    flexWrap: 'wrap',
                                    borderLeft: `4px solid ${
                                        adminUser.isActive
                                            ? 'var(--color-primary)'
                                            : 'var(--color-danger)'
                                    }`
                                }}
                            >
                                {/* Avatar + Info */}
                                <div className="flex items-center gap-md" style={{ flex: 1 }}>
                                    {/* Avatar circle */}
                                    <div
                                        style={{
                                            width: '48px',
                                            height: '48px',
                                            borderRadius: '50%',
                                            background:
                                                'linear-gradient(135deg, var(--color-primary), var(--color-primary-dark))',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: '20px',
                                            fontWeight: 800,
                                            color: '#fff',
                                            flexShrink: 0
                                        }}
                                    >
                                        {adminUser.username[0].toUpperCase()}
                                    </div>

                                    {/* Details */}
                                    <div>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-sm)',
                                                marginBottom: '4px',
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <span
                                                style={{
                                                    fontWeight: 700,
                                                    color: 'var(--text-primary)',
                                                    fontSize: 'var(--font-size-md)'
                                                }}
                                            >
                                                {adminUser.username}
                                            </span>
                                            <span
                                                className={`badge ${
                                                    adminUser.isActive ? 'badge-active' : 'badge-inactive'
                                                }`}
                                            >
                                                {adminUser.isActive ? '● Active' : '● Inactive'}
                                            </span>
                                        </div>
                                        {adminUser.email && (
                                            <div
                                                style={{
                                                    fontSize: 'var(--font-size-xs)',
                                                    color: 'var(--text-muted)'
                                                }}
                                            >
                                                📧 {adminUser.email}
                                            </div>
                                        )}
                                        <div
                                            style={{
                                                fontSize: 'var(--font-size-xs)',
                                                color: 'var(--text-muted)',
                                                marginTop: '2px'
                                            }}
                                        >
                                            Created: {formatDate(adminUser.createdAt)} &nbsp;·&nbsp;
                                            Last login: {formatDate(adminUser.lastLogin)}
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex gap-sm" style={{ flexShrink: 0, flexWrap: 'wrap' }}>
                                    {/* Reset Password */}
                                    <button
                                        id={`reset-pwd-${adminUser._id}-btn`}
                                        className="btn btn-secondary btn-sm"
                                        onClick={() =>
                                            setResetModal({
                                                adminId: adminUser._id,
                                                username: adminUser.username
                                            })
                                        }
                                        disabled={isLoading}
                                    >
                                        🔑 Reset Password
                                    </button>

                                    {/* Toggle Active */}
                                    <button
                                        id={`toggle-admin-${adminUser._id}-btn`}
                                        className={`btn btn-sm ${
                                            adminUser.isActive ? 'btn-secondary' : 'btn-primary'
                                        }`}
                                        onClick={() =>
                                            handleToggle(adminUser._id, adminUser.username)
                                        }
                                        disabled={isLoading}
                                    >
                                        {isLoading
                                            ? '⏳'
                                            : adminUser.isActive
                                            ? '⏸ Deactivate'
                                            : '▶ Activate'}
                                    </button>

                                    {/* Delete */}
                                    <button
                                        id={`delete-admin-${adminUser._id}-btn`}
                                        className="btn btn-danger btn-sm"
                                        onClick={() =>
                                            handleDeleteClick(adminUser._id, adminUser.username)
                                        }
                                        disabled={isLoading}
                                    >
                                        {isLoading ? '⏳' : '🗑 Delete'}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Reset Password Modal */}
            {resetModal && (
                <div className="modal-overlay" onClick={() => setResetModal(null)}>
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '400px' }}
                    >
                        <div className="modal-header">
                            <h3 className="modal-title">🔑 Reset Password</h3>
                            <button
                                className="btn btn-ghost btn-icon"
                                onClick={() => {
                                    setResetModal(null);
                                    setNewPassword('');
                                }}
                            >
                                ✕
                            </button>
                        </div>

                        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--font-size-sm)', marginBottom: 'var(--space-lg)' }}>
                            Set a new password for <strong style={{ color: 'var(--text-primary)' }}>{resetModal.username}</strong>
                        </p>

                        <div className="form-group">
                            <label className="form-label" htmlFor="reset-password-input">
                                New Password
                            </label>
                            <input
                                id="reset-password-input"
                                type="password"
                                className="form-input"
                                placeholder="Min 6 characters"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div className="flex gap-sm" style={{ marginTop: 'var(--space-lg)' }}>
                            <button
                                className="btn btn-ghost btn-full"
                                onClick={() => {
                                    setResetModal(null);
                                    setNewPassword('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                id="confirm-reset-pwd-btn"
                                className="btn btn-primary btn-full"
                                onClick={handleResetPassword}
                                disabled={isResetting || newPassword.length < 6}
                            >
                                {isResetting ? '⏳ Resetting...' : '✅ Reset Password'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Custom Delete Admin Confirmation Modal */}
            {deleteModal.show && (
                <div
                    className="modal-overlay"
                    onClick={() => setDeleteModal({ show: false, adminId: null, username: '' })}
                >
                    <div
                        className="modal"
                        onClick={(e) => e.stopPropagation()}
                        style={{ maxWidth: '440px', border: '1px solid rgba(255, 71, 87, 0.3)' }}
                    >
                        <div className="flex items-center gap-md mb-md">
                            <div
                                style={{
                                    width: '48px',
                                    height: '48px',
                                    borderRadius: '50%',
                                    background: 'rgba(255, 71, 87, 0.15)',
                                    border: '1px solid rgba(255, 71, 87, 0.3)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '24px',
                                    flexShrink: 0
                                }}
                            >
                                👤
                            </div>
                            <div>
                                <h3
                                    className="modal-title"
                                    style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}
                                >
                                    Delete Admin Account?
                                </h3>
                                <p className="text-xs text-muted">This action cannot be undone.</p>
                            </div>
                        </div>

                        <div
                            style={{
                                background: 'var(--bg-input)',
                                padding: 'var(--space-md)',
                                borderRadius: 'var(--radius-md)',
                                border: '1px solid var(--border-normal)',
                                marginBottom: 'var(--space-lg)'
                            }}
                        >
                            <p
                                style={{
                                    fontSize: 'var(--font-size-sm)',
                                    color: 'var(--text-primary)',
                                    fontWeight: 600,
                                    marginBottom: '6px'
                                }}
                            >
                                Account: <span style={{ color: 'var(--color-primary)' }}>{deleteModal.username}</span>
                            </p>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
                                ⚠️ Removing this admin account will permanently revoke their login access.
                            </p>
                        </div>

                        <div className="flex gap-sm">
                            <button
                                className="btn btn-ghost btn-full"
                                onClick={() => setDeleteModal({ show: false, adminId: null, username: '' })}
                                disabled={actionLoadingId === deleteModal.adminId}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-danger btn-full"
                                onClick={confirmDeleteAdmin}
                                disabled={actionLoadingId === deleteModal.adminId}
                            >
                                {actionLoadingId === deleteModal.adminId ? '⏳ Deleting...' : '🗑️ Yes, Delete Admin'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminManagement;
