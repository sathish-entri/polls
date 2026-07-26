const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Poll = require('../models/Poll');
const Vote = require('../models/Vote');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Helper: get or create a voter token from cookie
const getVoterToken = (req, res) => {
    let voterToken = req.cookies.voterToken;
    if (!voterToken) {
        voterToken = uuidv4();
        // Set voter token cookie (1 year expiry)
        res.cookie('voterToken', voterToken, {
            httpOnly: true,
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60 * 1000
        });
    }
    return voterToken;
};

// @route   GET /api/polls
// @desc    Get all polls (public - anonymous users see active polls, admin sees all)
// @access  Public
router.get('/', async (req, res) => {
    try {
        // Check if request comes from admin
        const adminToken = req.cookies.adminToken;
        let polls;

        if (adminToken) {
            // Admin sees all polls (active + inactive)
            polls = await Poll.find().sort({ createdAt: -1 });
        } else {
            // Anonymous users see only active polls
            polls = await Poll.find({ isActive: true }).sort({ createdAt: -1 });
        }

        // If anonymous user, attach which polls they've already voted on
        const voterToken = req.cookies.voterToken;
        let votedPollIds = [];

        if (voterToken) {
            const votes = await Vote.find({ voterToken });
            votedPollIds = votes.map((v) => v.pollId.toString());
        }

        return res.status(200).json({
            success: true,
            count: polls.length,
            votedPollIds,
            data: polls
        });
    } catch (error) {
        console.error('Get polls error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching polls'
        });
    }
});

// @route   GET /api/polls/:id
// @desc    Get a single poll by ID
// @access  Public
router.get('/:id', async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        return res.status(200).json({
            success: true,
            data: poll
        });
    } catch (error) {
        console.error('Get single poll error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while fetching poll'
        });
    }
});

// @route   POST /api/polls
// @desc    Create a new poll (Admin only)
// @access  Admin
router.post('/', protect, async (req, res) => {
    try {
        const { question, options } = req.body;

        // Validate question
        if (!question || question.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Poll question is required'
            });
        }

        // Validate options count
        if (!options || !Array.isArray(options)) {
            return res.status(400).json({
                success: false,
                message: 'Options must be an array'
            });
        }

        if (options.length < 2 || options.length > 6) {
            return res.status(400).json({
                success: false,
                message: 'Poll must have between 2 and 6 options'
            });
        }

        // Validate each option has text
        const formattedOptions = options.map((opt) => {
            const text = typeof opt === 'string' ? opt.trim() : opt.text?.trim();
            if (!text) {
                throw new Error('Each option must have non-empty text');
            }
            return { text, votes: 0 };
        });

        const poll = await Poll.create({
            question: question.trim(),
            options: formattedOptions,
            isActive: true,
            createdBy: req.admin.username
        });

        return res.status(201).json({
            success: true,
            message: 'Poll created successfully',
            data: poll
        });
    } catch (error) {
        console.error('Create poll error:', error);
        return res.status(400).json({
            success: false,
            message: error.message || 'Failed to create poll'
        });
    }
});

// @route   PATCH /api/polls/:id/toggle
// @desc    Toggle poll active/inactive status (Admin only)
// @access  Admin
router.patch('/:id/toggle', protect, async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        poll.isActive = !poll.isActive;
        await poll.save();

        return res.status(200).json({
            success: true,
            message: `Poll is now ${poll.isActive ? 'active' : 'inactive'}`,
            data: poll
        });
    } catch (error) {
        console.error('Toggle poll error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while toggling poll'
        });
    }
});

// @route   DELETE /api/polls/:id
// @desc    Delete a poll and all its votes (Admin only)
// @access  Admin
router.delete('/:id', protect, async (req, res) => {
    try {
        const poll = await Poll.findById(req.params.id);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        // Delete associated votes
        await Vote.deleteMany({ pollId: req.params.id });

        // Delete the poll
        await Poll.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            success: true,
            message: 'Poll and all its votes deleted successfully'
        });
    } catch (error) {
        console.error('Delete poll error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while deleting poll'
        });
    }
});

// @route   POST /api/polls/:id/vote
// @desc    Cast a vote on a poll (Anonymous users)
// @access  Public
router.post('/:id/vote', async (req, res) => {
    try {
        const { optionIndex } = req.body;
        const pollId = req.params.id;

        // Validate optionIndex
        if (optionIndex === undefined || optionIndex === null) {
            return res.status(400).json({
                success: false,
                message: 'Option index is required'
            });
        }

        // Find the poll
        const poll = await Poll.findById(pollId);
        if (!poll) {
            return res.status(404).json({
                success: false,
                message: 'Poll not found'
            });
        }

        if (!poll.isActive) {
            return res.status(403).json({
                success: false,
                message: 'This poll is no longer active'
            });
        }

        // Validate option index range
        if (optionIndex < 0 || optionIndex >= poll.options.length) {
            return res.status(400).json({
                success: false,
                message: 'Invalid option selected'
            });
        }

        // Get or create voter token
        const voterToken = getVoterToken(req, res);

        // Check if this voter already voted on this poll
        const existingVote = await Vote.findOne({ pollId, voterToken });
        if (existingVote) {
            return res.status(409).json({
                success: false,
                message: 'You have already voted on this poll',
                alreadyVoted: true,
                votedOptionIndex: existingVote.optionIndex
            });
        }

        // Record the vote in Vote collection
        await Vote.create({ pollId, voterToken, optionIndex });

        // Increment the vote count in Poll options
        poll.options[optionIndex].votes += 1;
        await poll.save();

        return res.status(200).json({
            success: true,
            message: 'Vote recorded successfully',
            data: poll
        });
    } catch (error) {
        // Handle duplicate key error from unique index (double vote attempt)
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: 'You have already voted on this poll',
                alreadyVoted: true
            });
        }
        console.error('Vote error:', error);
        return res.status(500).json({
            success: false,
            message: 'Server error while recording vote'
        });
    }
});

module.exports = router;
