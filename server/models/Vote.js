const mongoose = require('mongoose');

// Vote schema tracks every anonymous vote to prevent double voting
const voteSchema = new mongoose.Schema(
    {
        pollId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Poll',
            required: true
        },
        // UUID token assigned to each anonymous user via cookie
        voterToken: {
            type: String,
            required: true
        },
        // Index of the option chosen (0-based)
        optionIndex: {
            type: Number,
            required: true
        }
    },
    {
        timestamps: true
    }
);

// Compound unique index: one voter can only vote once per poll
voteSchema.index({ pollId: 1, voterToken: 1 }, { unique: true });

const Vote = mongoose.model('Vote', voteSchema);

module.exports = Vote;
