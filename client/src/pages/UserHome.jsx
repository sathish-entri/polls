import React, { useState, useEffect } from 'react';
import PollCard from '../components/PollCard';
import api from '../api/axios';

// User-facing home page - shows list of active polls for anonymous voting
const UserHome = () => {
    const [polls, setPolls] = useState([]);
    const [votedPollIds, setVotedPollIds] = useState([]);
    const [votedOptionMap, setVotedOptionMap] = useState({}); // pollId -> optionIndex
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch active polls on mount
    useEffect(() => {
        const fetchPolls = async () => {
            try {
                const res = await api.get('/polls');
                if (res.data.success) {
                    setPolls(res.data.data);
                    setVotedPollIds(res.data.votedPollIds || []);
                }
            } catch (err) {
                setError('Unable to load polls. Please try again later.');
                console.error('Fetch polls error:', err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPolls();
    }, []);

    // Called when user successfully votes on a poll
    const handleVoteSuccess = (pollId, optionIndex) => {
        setVotedPollIds((prev) => [...prev, pollId]);
        setVotedOptionMap((prev) => ({ ...prev, [pollId]: optionIndex }));
    };

    // ── Render ──────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Loading polls...</p>
            </div>
        );
    }

    return (
        <div className="page-container">
            {/* Page Header */}
            <div
                style={{
                    textAlign: 'center',
                    padding: 'var(--space-2xl) 0 var(--space-xl)',
                    marginBottom: 'var(--space-lg)'
                }}
            >
                <div style={{ fontSize: '56px', marginBottom: 'var(--space-md)' }}>📊</div>
                <h1
                    style={{
                        fontSize: 'var(--font-size-3xl)',
                        fontWeight: 800,
                        marginBottom: '8px',
                        background: 'linear-gradient(135deg, #25d366, #128c7e)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text'
                    }}
                >
                    Active Polls
                </h1>

                {/* Stats bar */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 'var(--space-xl)',
                        marginTop: 'var(--space-lg)',
                        padding: '16px 32px',
                        background: 'var(--bg-card)',
                        borderRadius: 'var(--radius-full)',
                        border: '1px solid var(--border-subtle)',
                        display: 'inline-flex'
                    }}
                >
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 800,
                                color: 'var(--color-primary)'
                            }}
                        >
                            {polls.length}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            Active Polls
                        </div>
                    </div>
                    <div
                        style={{
                            width: '1px',
                            height: '32px',
                            background: 'var(--border-subtle)'
                        }}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 800,
                                color: 'var(--color-info)'
                            }}
                        >
                            {votedPollIds.length}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            Voted
                        </div>
                    </div>
                    <div
                        style={{
                            width: '1px',
                            height: '32px',
                            background: 'var(--border-subtle)'
                        }}
                    />
                    <div style={{ textAlign: 'center' }}>
                        <div
                            style={{
                                fontSize: 'var(--font-size-xl)',
                                fontWeight: 800,
                                color: 'var(--color-warning)'
                            }}
                        >
                            {polls.length - votedPollIds.length}
                        </div>
                        <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-muted)' }}>
                            Pending
                        </div>
                    </div>
                </div>
            </div>

            {/* Error State */}
            {error && (
                <div
                    style={{
                        padding: '16px',
                        background: 'rgba(255,71,87,0.1)',
                        border: '1px solid rgba(255,71,87,0.25)',
                        borderRadius: 'var(--radius-md)',
                        color: 'var(--color-danger)',
                        marginBottom: 'var(--space-lg)',
                        textAlign: 'center'
                    }}
                >
                    ⚠️ {error}
                </div>
            )}

            {/* Polls List */}
            {polls.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-state__icon">🗳️</div>
                    <h2 className="empty-state__title">No Active Polls</h2>
                    <p className="empty-state__text">
                        There are no active polls right now. Check back later!
                    </p>
                </div>
            ) : (
                <div id="polls-list">
                    {polls.map((poll, index) => {
                        const isVoted = votedPollIds.includes(poll._id);
                        const votedIndex = votedOptionMap[poll._id] ?? null;

                        return (
                            <div
                                key={poll._id}
                                style={{
                                    animationDelay: `${index * 80}ms`
                                }}
                            >
                                <PollCard
                                    poll={poll}
                                    hasVoted={isVoted}
                                    votedOptionIndex={votedIndex}
                                    onVoteSuccess={handleVoteSuccess}
                                />
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Footer note */}
            {polls.length > 0 && (
                <div
                    style={{
                        textAlign: 'center',
                        padding: 'var(--space-xl) 0',
                        color: 'var(--text-muted)',
                        fontSize: 'var(--font-size-xs)'
                    }}
                >
                    🔒 Your vote is anonymous and cannot be changed once submitted
                </div>
            )}
        </div>
    );
};

export default UserHome;
