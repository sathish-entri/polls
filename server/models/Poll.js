const mongoose = require('mongoose');

// Schema for each option inside a poll
const optionSchema = new mongoose.Schema({
    text: {
        type: String,
        required: [true, 'Option text is required'],
        trim: true,
        maxlength: [200, 'Option text cannot exceed 200 characters']
    },
    votes: {
        type: Number,
        default: 0
    }
});

// Main Poll schema
const pollSchema = new mongoose.Schema(
    {
        question: {
            type: String,
            required: [true, 'Poll question is required'],
            trim: true,
            maxlength: [500, 'Question cannot exceed 500 characters']
        },
        options: {
            type: [optionSchema],
            validate: {
                validator: function (options) {
                    return options.length >= 2 && options.length <= 6;
                },
                message: 'A poll must have between 2 and 6 options'
            },
            required: true
        },
        isActive: {
            type: Boolean,
            default: true
        },
        createdBy: {
            type: String,
            default: 'admin'
        }
    },
    {
        timestamps: true
    }
);

// Virtual field: total votes across all options (safely accesses votes)
pollSchema.virtual('totalVotes').get(function () {
    if (!this.options || !Array.isArray(this.options)) return 0;
    return this.options.reduce((sum, option) => {
        const v = option && (option.votes ?? option.get?.('votes') ?? 0);
        return sum + (typeof v === 'number' ? v : 0);
    }, 0);
});

// Include virtuals when converting to JSON / plain object
pollSchema.set('toJSON', { virtuals: true, versionKey: false });
pollSchema.set('toObject', { virtuals: true });

const Poll = mongoose.model('Poll', pollSchema);

module.exports = Poll;
