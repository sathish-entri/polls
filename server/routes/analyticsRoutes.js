const express = require('express');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// @route   GET /api/analytics
// @desc    Get full analytics data for admin dashboard
// @access  Admin
router.get('/', protect, async (req, res) => {
    try {
        // Fetch all polls as plain JS objects (lean) to avoid virtual getter issues
        const polls = await Poll.find().sort({ createdAt: -1 }).lean();

        // Total stats
        const totalPolls = polls.length;
        const activePolls = polls.filter((p) => p.isActive).length;
        const inactivePolls = totalPolls - activePolls;

        // Total votes across all polls
        const totalVotes = polls.reduce((sum, poll) => {
            return sum + poll.options.reduce((s, opt) => s + opt.votes, 0);
        }, 0);

        // Build per-poll analytics
        const pollAnalytics = polls.map((poll) => {
            const pollTotalVotes = poll.options.reduce((s, opt) => s + opt.votes, 0);

            // Find the winning option
            let winningOption = null;
            let maxVotes = 0;
            poll.options.forEach((opt, idx) => {
                if (opt.votes > maxVotes) {
                    maxVotes = opt.votes;
                    winningOption = { text: opt.text, votes: opt.votes, index: idx };
                }
            });

            // Options with percentage
            const optionsWithPercent = poll.options.map((opt, idx) => ({
                index: idx,
                text: opt.text,
                votes: opt.votes,
                percentage: pollTotalVotes > 0 ? Math.round((opt.votes / pollTotalVotes) * 100) : 0
            }));

            return {
                _id: poll._id,
                question: poll.question,
                isActive: poll.isActive,
                totalVotes: pollTotalVotes,
                winningOption,
                options: optionsWithPercent,
                createdAt: poll.createdAt
            };
        });

        // Most voted poll
        const mostVotedPoll = pollAnalytics.reduce(
            (max, poll) => (poll.totalVotes > (max?.totalVotes || 0) ? poll : max),
            null
        );

        // Least voted poll (with at least 1 vote)
        const pollsWithVotes = pollAnalytics.filter((p) => p.totalVotes > 0);
        const leastVotedPoll = pollsWithVotes.reduce(
            (min, poll) => (poll.totalVotes < (min?.totalVotes || Infinity) ? poll : min),
            null
        );

        // Average votes per poll
        const avgVotesPerPoll =
            totalPolls > 0 ? Math.round((totalVotes / totalPolls) * 10) / 10 : 0;

        // Recent votes activity (last 10 votes from Vote collection)
        // Use lean() to get plain JS objects and avoid virtual getter triggering
        const recentVotes = await Vote.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .populate({ path: 'pollId', select: 'question', options: { lean: true } })
            .lean();

        // Polls sorted by vote count for ranking
        const pollsByVotes = [...pollAnalytics].sort((a, b) => b.totalVotes - a.totalVotes);

        // Participation rate: polls that have at least 1 vote
        const participatedPolls = pollAnalytics.filter((p) => p.totalVotes > 0).length;
        const participationRate =
            totalPolls > 0 ? Math.round((participatedPolls / totalPolls) * 100) : 0;

        return res.status(200).json({
            success: true,
            data: {
                summary: {
                    totalPolls,
                    activePolls,
                    inactivePolls,
                    totalVotes,
                    avgVotesPerPoll,
                    participationRate
                },
                mostVotedPoll,
                leastVotedPoll,
                pollsByVotes,
                pollAnalytics,
                recentVotes
            }
        });
    } catch (error) {
        console.error('Analytics error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching analytics'
        });
    }
});

module.exports = router;
