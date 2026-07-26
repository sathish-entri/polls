import React, { useState, useEffect } from 'react';
import PollForm from '../components/PollForm';
import api from '../api/axios';

// Admin Dashboard: view all polls, create new polls, toggle active status, delete polls
const AdminDashboard = () => {
    const [polls, setPolls] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [toast, setToast] = useState(null);
    const [filter, setFilter] = useState('all'); // 'all' | 'active' | 'inactive'
    const [deletingId, setDeletingId] = useState(null);
    const [togglingId, setTogglingId] = useState(null);

    // Show toast notification
    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3500);
    };

    // Fetch all polls on mount
    useEffect(() => {
        fetchPolls();
    }, []);

    const fetchPolls = async () => {
        try {
            const res = await api.get('/polls');
            if (res.data.success) {
                setPolls(res.data.data);
            }
        } catch (err) {
            showToast('Failed to load polls', 'error');
        } finally {
            setIsLoading(false);
        }
    };

    // Add newly created poll to top of list
    const handlePollCreated = (newPoll) => {
        setPolls((prev) => [newPoll, ...prev]);
        showToast('Poll created successfully! 🎉');
    };

    // Toggle poll active/inactive
    const handleToggle = async (pollId) => {
        setTogglingId(pollId);
        try {
            const res = await api.patch(`/polls/${pollId}/toggle`);
            if (res.data.success) {
                setPolls((prev) =>
                    prev.map((p) =>
                        p._id === pollId ? { ...p, isActive: res.data.data.isActive } : p
                    )
                );
                showToast(res.data.message);
            }
        } catch (err) {
            showToast('Failed to toggle poll status', 'error');
        } finally {
            setTogglingId(null);
        }
    };

    const [deleteModal, setDeleteModal] = useState({ show: false, pollId: null, question: '' });

    // Open delete confirmation modal
    const handleDeleteClick = (pollId, question) => {
        setDeleteModal({ show: true, pollId, question });
    };

    // Perform actual deletion
    const confirmDeletePoll = async () => {
        if (!deleteModal.pollId) return;

        const pollId = deleteModal.pollId;
        setDeletingId(pollId);

        try {
            const res = await api.delete(`/polls/${pollId}`);
            if (res.data.success) {
                setPolls((prev) => prev.filter((p) => p._id !== pollId));
                showToast('Poll deleted successfully');
                setDeleteModal({ show: false, pollId: null, question: '' });
            }
        } catch (err) {
            showToast('Failed to delete poll', 'error');
        } finally {
            setDeletingId(null);
        }
    };

    // Filter polls based on selected filter
    const filteredPolls = polls.filter((poll) => {
        if (filter === 'active') return poll.isActive;
        if (filter === 'inactive') return !poll.isActive;
        return true;
    });

    // Calculate total votes for a poll
    const getTotalVotes = (poll) => {
        return poll.options.reduce((sum, opt) => sum + opt.votes, 0);
    };

    // Format date
    const formatDate = (dateStr) => {
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
                <p className="loading-text">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <div className="page-container page-container--wide">
            {/* Toast Notification */}
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
                    <h1 className="page-title">📋 Poll Dashboard</h1>
                    <p className="page-subtitle">
                        Manage all polls — create, activate/deactivate, and delete
                    </p>
                </div>
                <button
                    id="create-poll-btn"
                    className="btn btn-primary"
                    onClick={() => setShowCreateModal(true)}
                >
                    ➕ Create Poll
                </button>
            </div>

            {/* Summary Stats */}
            <div className="analytics-grid" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="stat-card">
                    <span className="stat-card__icon">📊</span>
                    <div className="stat-card__value">{polls.length}</div>
                    <div className="stat-card__label">Total Polls</div>
                </div>
                <div className="stat-card">
                    <span className="stat-card__icon">✅</span>
                    <div className="stat-card__value" style={{ color: 'var(--color-primary)' }}>
                        {polls.filter((p) => p.isActive).length}
                    </div>
                    <div className="stat-card__label">Active Polls</div>
                </div>
                <div className="stat-card">
                    <span className="stat-card__icon">🗳️</span>
                    <div className="stat-card__value" style={{ color: 'var(--color-info)' }}>
                        {polls.reduce((sum, p) => sum + getTotalVotes(p), 0)}
                    </div>
                    <div className="stat-card__label">Total Votes</div>
                </div>
                <div className="stat-card">
                    <span className="stat-card__icon">🔴</span>
                    <div className="stat-card__value" style={{ color: 'var(--color-danger)' }}>
                        {polls.filter((p) => !p.isActive).length}
                    </div>
                    <div className="stat-card__label">Inactive Polls</div>
                </div>
            </div>

            {/* Filter Tabs */}
            <div
                style={{
                    display: 'flex',
                    gap: '8px',
                    marginBottom: 'var(--space-lg)'
                }}
            >
                {[
                    { key: 'all', label: `All (${polls.length})` },
                    { key: 'active', label: `Active (${polls.filter((p) => p.isActive).length})` },
                    { key: 'inactive', label: `Inactive (${polls.filter((p) => !p.isActive).length})` }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        id={`filter-${tab.key}-btn`}
                        className={`btn btn-sm ${filter === tab.key ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => setFilter(tab.key)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Polls Table / Cards */}
            {filteredPolls.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">🗳️</div>
                    <h2 className="empty-state__title">No Polls Found</h2>
                    <p className="empty-state__text">
                        {filter === 'all'
                            ? 'No polls created yet. Create your first poll!'
                            : `No ${filter} polls found.`}
                    </p>
                    {filter === 'all' && (
                        <button
                            id="empty-create-poll-btn"
                            className="btn btn-primary"
                            onClick={() => setShowCreateModal(true)}
                        >
                            ➕ Create First Poll
                        </button>
                    )}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                    {filteredPolls.map((poll) => {
                        const totalVotes = getTotalVotes(poll);
                        const isDeleting = deletingId === poll._id;
                        const isToggling = togglingId === poll._id;

                        return (
                            <div
                                key={poll._id}
                                id={`admin-poll-${poll._id}`}
                                className="card"
                                style={{
                                    borderLeft: `4px solid ${
                                        poll.isActive
                                            ? 'var(--color-primary)'
                                            : 'var(--color-danger)'
                                    }`
                                }}
                            >
                                {/* Poll Header */}
                                <div className="card-header">
                                    <div style={{ flex: 1 }}>
                                        <div
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--space-sm)',
                                                marginBottom: '6px',
                                                flexWrap: 'wrap'
                                            }}
                                        >
                                            <span
                                                className={`badge ${
                                                    poll.isActive ? 'badge-active' : 'badge-inactive'
                                                }`}
                                            >
                                                {poll.isActive ? '● Active' : '● Inactive'}
                                            </span>
                                            <span className="badge badge-info">
                                                {poll.options.length} options
                                            </span>
                                            <span
                                                style={{
                                                    fontSize: 'var(--font-size-xs)',
                                                    color: 'var(--text-muted)'
                                                }}
                                            >
                                                {formatDate(poll.createdAt)}
                                            </span>
                                        </div>
                                        <h3
                                            className="card-title"
                                            style={{ fontSize: 'var(--font-size-md)' }}
                                        >
                                            {poll.question}
                                        </h3>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-sm" style={{ flexShrink: 0 }}>
                                        <button
                                            id={`toggle-poll-${poll._id}-btn`}
                                            className={`btn btn-sm ${
                                                poll.isActive ? 'btn-secondary' : 'btn-primary'
                                            }`}
                                            onClick={() => handleToggle(poll._id)}
                                            disabled={isToggling || isDeleting}
                                        >
                                            {isToggling
                                                ? '⏳'
                                                : poll.isActive
                                                ? '⏸ Deactivate'
                                                : '▶ Activate'}
                                        </button>
                                        <button
                                            id={`delete-poll-${poll._id}-btn`}
                                            className="btn btn-danger btn-sm"
                                            onClick={() => handleDeleteClick(poll._id, poll.question)}
                                            disabled={isDeleting || isToggling}
                                        >
                                            {isDeleting ? '⏳' : '🗑 Delete'}
                                        </button>
                                    </div>
                                </div>

                                {/* Options with vote bars */}
                                <div
                                    style={{
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        marginBottom: 'var(--space-sm)'
                                    }}
                                >
                                    {poll.options.map((option, idx) => {
                                        const percent =
                                            totalVotes > 0
                                                ? Math.round((option.votes / totalVotes) * 100)
                                                : 0;
                                        return (
                                            <div key={idx}>
                                                <div
                                                    style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        marginBottom: '4px',
                                                        fontSize: 'var(--font-size-sm)'
                                                    }}
                                                >
                                                    <span style={{ color: 'var(--text-secondary)' }}>
                                                        {option.text}
                                                    </span>
                                                    <span
                                                        style={{
                                                            color: 'var(--color-primary)',
                                                            fontWeight: 700
                                                        }}
                                                    >
                                                        {option.votes} vote{option.votes !== 1 ? 's' : ''} ({percent}%)
                                                    </span>
                                                </div>
                                                <div
                                                    style={{
                                                        height: '6px',
                                                        background: 'var(--bg-input)',
                                                        borderRadius: 'var(--radius-full)',
                                                        overflow: 'hidden'
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            height: '100%',
                                                            width: `${percent}%`,
                                                            background:
                                                                'linear-gradient(90deg, var(--color-primary), var(--color-primary-dark))',
                                                            borderRadius: 'var(--radius-full)',
                                                            transition: 'width 0.6s ease'
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Poll footer */}
                                <div
                                    style={{
                                        paddingTop: 'var(--space-sm)',
                                        borderTop: '1px solid var(--border-subtle)',
                                        fontSize: 'var(--font-size-xs)',
                                        color: 'var(--text-muted)',
                                        fontWeight: 600
                                    }}
                                >
                                    🗳️ Total: {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Create Poll Modal */}
            {showCreateModal && (
                <PollForm
                    onClose={() => setShowCreateModal(false)}
                    onPollCreated={handlePollCreated}
                />
            )}

            {/* Custom Delete Confirmation Modal */}
            {deleteModal.show && (
                <div
                    className="modal-overlay"
                    id="delete-poll-modal-overlay"
                    onClick={() => setDeleteModal({ show: false, pollId: null, question: '' })}
                >
                    <div
                        className="modal"
                        id="delete-poll-modal"
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
                                🗑️
                            </div>
                            <div>
                                <h3
                                    className="modal-title"
                                    style={{ fontSize: 'var(--font-size-lg)', color: 'var(--text-primary)' }}
                                >
                                    Delete Poll?
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
                                "{deleteModal.question}"
                            </p>
                            <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-danger)' }}>
                                ⚠️ Deleting this poll will permanently remove all options and votes recorded for it.
                            </p>
                        </div>

                        <div className="flex gap-sm">
                            <button
                                id="cancel-delete-poll-btn"
                                className="btn btn-ghost btn-full"
                                onClick={() => setDeleteModal({ show: false, pollId: null, question: '' })}
                                disabled={deletingId === deleteModal.pollId}
                            >
                                Cancel
                            </button>
                            <button
                                id="confirm-delete-poll-btn"
                                className="btn btn-danger btn-full"
                                onClick={confirmDeletePoll}
                                disabled={deletingId === deleteModal.pollId}
                            >
                                {deletingId === deleteModal.pollId ? '⏳ Deleting...' : '🗑️ Yes, Delete Poll'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
