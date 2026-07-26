import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import AnalyticsCard from '../components/AnalyticsCard';
import api from '../api/axios';

// Register Chart.js components
ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    PointElement,
    LineElement
);

// Chart color palette matching our CSS design tokens
const CHART_COLORS = [
    'rgba(37, 211, 102, 0.85)',
    'rgba(79, 172, 254, 0.85)',
    'rgba(245, 166, 35, 0.85)',
    'rgba(255, 107, 157, 0.85)',
    'rgba(199, 125, 255, 0.85)',
    'rgba(72, 202, 228, 0.85)'
];

const CHART_BORDERS = [
    'rgba(37, 211, 102, 1)',
    'rgba(79, 172, 254, 1)',
    'rgba(245, 166, 35, 1)',
    'rgba(255, 107, 157, 1)',
    'rgba(199, 125, 255, 1)',
    'rgba(72, 202, 228, 1)'
];

// Detect mobile screen width
const isMobile = () => window.innerWidth < 640;

const AdminAnalytics = () => {
    const [analytics, setAnalytics] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedPollId, setSelectedPollId] = useState(null);
    const [mobile, setMobile] = useState(isMobile());

    // Track window resize for responsive chart options
    useEffect(() => {
        const handleResize = () => setMobile(isMobile());
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Fetch analytics data on mount
    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/analytics');
                if (res.data.success) {
                    setAnalytics(res.data.data);
                    if (res.data.data.mostVotedPoll) {
                        setSelectedPollId(res.data.data.mostVotedPoll._id);
                    }
                }
            } catch (err) {
                setError('Failed to load analytics. Please try again.');
                console.error('Analytics fetch error:', err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    // Format date/time
    const formatDateTime = (dateStr) => {
        return new Date(dateStr).toLocaleString('en-US', {
            day: 'numeric',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Truncate long text for chart labels
    const truncate = (str, maxLen = 28) => {
        return str.length > maxLen ? str.slice(0, maxLen) + '…' : str;
    };

    // ── Loading State ──────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p className="loading-text">Crunching the numbers...</p>
            </div>
        );
    }

    // ── Error State ────────────────────────────────────────────
    if (error) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state__icon">⚠️</div>
                    <h2 className="empty-state__title">Failed to Load Analytics</h2>
                    <p className="empty-state__text">{error}</p>
                    <button
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                    >
                        🔄 Retry
                    </button>
                </div>
            </div>
        );
    }

    // ── No Data State ──────────────────────────────────────────
    if (!analytics || analytics.pollAnalytics.length === 0) {
        return (
            <div className="page-container">
                <div className="empty-state">
                    <div className="empty-state__icon">📊</div>
                    <h2 className="empty-state__title">No Analytics Yet</h2>
                    <p className="empty-state__text">
                        Create some polls and collect votes to see analytics here.
                    </p>
                </div>
            </div>
        );
    }

    const { summary, pollsByVotes, pollAnalytics, recentVotes, mostVotedPoll } = analytics;

    // ── Bar Chart: Votes per Poll ──────────────────────────────
    const barChartData = {
        labels: pollsByVotes.map((p) => truncate(p.question, mobile ? 12 : 22)),
        datasets: [
            {
                label: 'Total Votes',
                data: pollsByVotes.map((p) => p.totalVotes),
                backgroundColor: CHART_COLORS,
                borderColor: CHART_BORDERS,
                borderWidth: 2,
                borderRadius: 6,
                borderSkipped: false
            }
        ]
    };

    const barChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: '#1a2332',
                titleColor: '#e8edf3',
                bodyColor: '#8b95a3',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1
            }
        },
        scales: {
            x: {
                ticks: {
                    color: '#8b95a3',
                    font: { family: 'Inter', size: mobile ? 9 : 12 },
                    maxRotation: mobile ? 45 : 0,
                    minRotation: mobile ? 45 : 0
                },
                grid: { color: 'rgba(255,255,255,0.05)' }
            },
            y: {
                ticks: {
                    color: '#8b95a3',
                    font: { family: 'Inter', size: mobile ? 9 : 12 },
                    stepSize: 1
                },
                grid: { color: 'rgba(255,255,255,0.05)' }
            }
        }
    };

    // ── Doughnut Chart: Option distribution for selected poll ──
    const selectedPoll = pollAnalytics.find((p) => p._id === selectedPollId);
    const doughnutData = selectedPoll
        ? {
              labels: selectedPoll.options.map((o) => truncate(o.text, mobile ? 14 : 20)),
              datasets: [
                  {
                      data: selectedPoll.options.map((o) => o.votes),
                      backgroundColor: CHART_COLORS,
                      borderColor: CHART_BORDERS,
                      borderWidth: 2,
                      hoverOffset: 6
                  }
              ]
          }
        : null;

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'bottom',
                labels: {
                    color: '#8b95a3',
                    font: { family: 'Inter', size: mobile ? 10 : 12 },
                    padding: mobile ? 10 : 16,
                    boxWidth: mobile ? 12 : 16
                }
            },
            tooltip: {
                backgroundColor: '#1a2332',
                titleColor: '#e8edf3',
                bodyColor: '#8b95a3',
                borderColor: 'rgba(255,255,255,0.1)',
                borderWidth: 1,
                callbacks: {
                    label: (ctx) => {
                        const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                        const pct = total > 0 ? Math.round((ctx.raw / total) * 100) : 0;
                        return ` ${ctx.raw} votes (${pct}%)`;
                    }
                }
            }
        }
    };

    // ── Render ──────────────────────────────────────────────────
    return (
        <div className="page-container page-container--wide">

            {/* Page Header */}
            <div className="page-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <div className="page-header__left">
                    <h1 className="page-title">📈 Analytics</h1>
                    <p className="page-subtitle" style={{ display: mobile ? 'none' : 'block' }}>
                        Real-time insights into poll performance and voter engagement
                    </p>
                </div>
                <button
                    id="refresh-analytics-btn"
                    className="btn btn-secondary btn-sm"
                    onClick={() => window.location.reload()}
                >
                    🔄 Refresh
                </button>
            </div>

            {/* Summary Stats Cards */}
            <div className="analytics-grid" style={{ marginBottom: 'var(--space-lg)' }}>
                <AnalyticsCard
                    icon="📊"
                    value={summary.totalPolls}
                    label="Total Polls"
                    sublabel={`${summary.activePolls} active, ${summary.inactivePolls} inactive`}
                />
                <AnalyticsCard
                    icon="🗳️"
                    value={summary.totalVotes}
                    label="Total Votes"
                    sublabel="Across all polls"
                    color="var(--color-primary)"
                />
                <AnalyticsCard
                    icon="📉"
                    value={`${summary.avgVotesPerPoll}`}
                    label="Avg Votes / Poll"
                    sublabel="Average engagement"
                    color="var(--color-info)"
                />
                <AnalyticsCard
                    icon="🎯"
                    value={`${summary.participationRate}%`}
                    label="Participation"
                    sublabel="Polls with ≥1 vote"
                    color="var(--color-warning)"
                />
                <AnalyticsCard
                    icon="✅"
                    value={summary.activePolls}
                    label="Active Polls"
                    color="var(--color-success)"
                />
                <AnalyticsCard
                    icon="🏆"
                    value={mostVotedPoll ? mostVotedPoll.totalVotes : 0}
                    label="Top Poll Votes"
                    sublabel={mostVotedPoll ? truncate(mostVotedPoll.question, 24) : 'No polls yet'}
                    color="var(--chart-4)"
                />
            </div>

            {/* ── Bar Chart: Votes per Poll (full width, stacks on mobile) ── */}
            <div className="chart-container" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="chart-title">📊 Votes Per Poll</div>
                <div
                    style={{
                        height: mobile ? '220px' : '280px',
                        width: '100%',
                        position: 'relative'
                    }}
                >
                    <Bar data={barChartData} options={barChartOptions} id="votes-bar-chart" />
                </div>
            </div>

            {/* ── Doughnut Chart: Option breakdown (full width on mobile) ── */}
            <div className="chart-container" style={{ marginBottom: 'var(--space-lg)' }}>
                {/* Header with poll selector */}
                <div
                    style={{
                        display: 'flex',
                        flexDirection: mobile ? 'column' : 'row',
                        justifyContent: 'space-between',
                        alignItems: mobile ? 'flex-start' : 'center',
                        gap: '10px',
                        marginBottom: 'var(--space-md)'
                    }}
                >
                    <div className="chart-title" style={{ marginBottom: 0 }}>🍩 Option Breakdown</div>
                    <select
                        id="doughnut-poll-selector"
                        value={selectedPollId || ''}
                        onChange={(e) => setSelectedPollId(e.target.value)}
                        style={{
                            background: 'var(--bg-input)',
                            border: '1px solid var(--border-normal)',
                            borderRadius: 'var(--radius-sm)',
                            color: 'var(--text-secondary)',
                            padding: '6px 10px',
                            fontSize: 'var(--font-size-xs)',
                            fontFamily: 'Inter',
                            cursor: 'pointer',
                            width: mobile ? '100%' : 'auto',
                            maxWidth: mobile ? '100%' : '220px'
                        }}
                    >
                        {pollAnalytics.map((p) => (
                            <option key={p._id} value={p._id}>
                                {truncate(p.question, 36)}
                            </option>
                        ))}
                    </select>
                </div>

                {doughnutData && selectedPoll?.totalVotes > 0 ? (
                    <div
                        style={{
                            height: mobile ? '260px' : '300px',
                            width: '100%',
                            position: 'relative'
                        }}
                    >
                        <Doughnut
                            data={doughnutData}
                            options={doughnutOptions}
                            id="option-doughnut-chart"
                        />
                    </div>
                ) : (
                    <div className="empty-state" style={{ minHeight: '180px' }}>
                        <div style={{ fontSize: '32px' }}>🫙</div>
                        <p className="text-muted text-sm">No votes on this poll yet</p>
                    </div>
                )}
            </div>

            {/* ── Poll Rankings ── */}
            <div className="chart-container" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="chart-title">🏅 Poll Rankings (by Votes)</div>
                <div className="ranking-list">
                    {pollsByVotes.slice(0, 6).map((poll, index) => (
                        <div key={poll._id} className="ranking-item">
                            <span
                                className={`ranking-number ranking-number--${
                                    index < 3 ? index + 1 : 'default'
                                }`}
                            >
                                {index + 1}
                            </span>
                            <div className="ranking-info" style={{ minWidth: 0, flex: 1 }}>
                                <div
                                    className="ranking-question"
                                    style={{
                                        fontSize: mobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    {poll.question}
                                </div>
                                <div className="ranking-votes" style={{ fontSize: 'var(--font-size-xs)' }}>
                                    {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
                                    {poll.winningOption && !mobile && (
                                        <span style={{ marginLeft: '8px', color: 'var(--color-primary)' }}>
                                            · 🏆 "{truncate(poll.winningOption.text, 14)}"
                                        </span>
                                    )}
                                </div>
                            </div>
                            <span
                                className="ranking-badge"
                                style={{ fontSize: 'var(--font-size-xs)', flexShrink: 0 }}
                            >
                                {poll.isActive ? '● Active' : '○ Off'}
                            </span>
                        </div>
                    ))}
                    {pollsByVotes.length === 0 && (
                        <p className="text-muted text-sm" style={{ textAlign: 'center', padding: '20px' }}>
                            No polls yet
                        </p>
                    )}
                </div>
            </div>

            {/* ── Recent Vote Activity ── */}
            <div className="chart-container" style={{ marginBottom: 'var(--space-lg)' }}>
                <div className="chart-title">⏱️ Recent Vote Activity</div>
                {recentVotes.length > 0 ? (
                    <div className="timeline">
                        {recentVotes.map((vote, index) => (
                            <div key={vote._id || index} className="timeline-item">
                                <div className="timeline-dot">🗳️</div>
                                <div className="timeline-content">
                                    <div
                                        className="timeline-question"
                                        style={{ fontSize: mobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)' }}
                                    >
                                        {vote.pollId?.question
                                            ? truncate(vote.pollId.question, mobile ? 30 : 45)
                                            : 'Poll deleted'}
                                    </div>
                                    <div className="timeline-time" style={{ fontSize: 'var(--font-size-xs)' }}>
                                        Option #{vote.optionIndex + 1} · {formatDateTime(vote.createdAt)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state" style={{ minHeight: '160px' }}>
                        <div style={{ fontSize: '32px' }}>📭</div>
                        <p className="text-muted text-sm">No votes recorded yet</p>
                    </div>
                )}
            </div>

            {/* ── Detailed Poll Breakdown Table ── */}
            <div className="chart-container">
                <div className="chart-title">📋 Detailed Poll Breakdown</div>
                <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                    <table
                        id="detailed-breakdown-table"
                        style={{
                            width: '100%',
                            borderCollapse: 'collapse',
                            fontSize: mobile ? 'var(--font-size-xs)' : 'var(--font-size-sm)',
                            minWidth: mobile ? '480px' : 'auto'
                        }}
                    >
                        <thead>
                            <tr
                                style={{
                                    borderBottom: '1px solid var(--border-normal)',
                                    color: 'var(--text-muted)',
                                    textAlign: 'left'
                                }}
                            >
                                <th style={{ padding: mobile ? '8px' : '10px 12px', fontWeight: 600 }}>Question</th>
                                <th style={{ padding: mobile ? '8px' : '10px 12px', fontWeight: 600 }}>Status</th>
                                <th style={{ padding: mobile ? '8px' : '10px 12px', fontWeight: 600 }}>Votes</th>
                                <th style={{ padding: mobile ? '8px' : '10px 12px', fontWeight: 600 }}>Top Option</th>
                                <th style={{ padding: mobile ? '8px' : '10px 12px', fontWeight: 600 }}>%</th>
                            </tr>
                        </thead>
                        <tbody>
                            {pollAnalytics.map((poll) => (
                                <tr
                                    key={poll._id}
                                    style={{
                                        borderBottom: '1px solid var(--border-subtle)',
                                        transition: 'background 0.15s'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = 'var(--bg-card-hover)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = 'transparent';
                                    }}
                                >
                                    <td
                                        style={{
                                            padding: mobile ? '8px' : '12px',
                                            color: 'var(--text-primary)',
                                            maxWidth: mobile ? '120px' : '280px'
                                        }}
                                    >
                                        {truncate(poll.question, mobile ? 20 : 45)}
                                    </td>
                                    <td style={{ padding: mobile ? '8px' : '12px' }}>
                                        <span
                                            className={`badge ${
                                                poll.isActive ? 'badge-active' : 'badge-inactive'
                                            }`}
                                        >
                                            {poll.isActive ? '● On' : '● Off'}
                                        </span>
                                    </td>
                                    <td
                                        style={{
                                            padding: mobile ? '8px' : '12px',
                                            color: 'var(--color-primary)',
                                            fontWeight: 700
                                        }}
                                    >
                                        {poll.totalVotes}
                                    </td>
                                    <td style={{ padding: mobile ? '8px' : '12px', color: 'var(--text-secondary)' }}>
                                        {poll.winningOption
                                            ? truncate(poll.winningOption.text, mobile ? 14 : 22)
                                            : '—'}
                                    </td>
                                    <td style={{ padding: mobile ? '8px' : '12px' }}>
                                        {poll.winningOption && poll.totalVotes > 0 ? (
                                            <span
                                                style={{
                                                    color: 'var(--color-warning)',
                                                    fontWeight: 700
                                                }}
                                            >
                                                {Math.round(
                                                    (poll.winningOption.votes / poll.totalVotes) * 100
                                                )}%
                                            </span>
                                        ) : (
                                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminAnalytics;
