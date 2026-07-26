import React, { useState } from 'react';
import api from '../api/axios';

// PollCard renders a single poll with voting functionality for anonymous users
const PollCard = ({ poll, hasVoted, votedOptionIndex, onVoteSuccess }) => {
    const [selectedOption, setSelectedOption] = useState(null);
    const [isVoting, setIsVoting] = useState(false);
    const [localPoll, setLocalPoll] = useState(poll);
    const [localVoted, setLocalVoted] = useState(hasVoted);
    const [localVotedIndex, setLocalVotedIndex] = useState(votedOptionIndex);
    const [error, setError] = useState('');

    // Calculate total votes for the current poll data
    const totalVotes = localPoll.options.reduce((sum, opt) => sum + opt.votes, 0);

    // Calculate percentage for a specific option
    const getPercent = (optVotes) => {
        if (totalVotes === 0) return 0;
        return Math.round((optVotes / totalVotes) * 100);
    };

    // Handle option selection (before submitting vote)
    const handleSelectOption = (index) => {
        if (localVoted || isVoting) return;
        setSelectedOption(index);
        setError('');
    };

    // Submit vote to backend
    const handleSubmitVote = async () => {
        if (selectedOption === null) {
            setError('Please select an option to vote');
            return;
        }
        if (localVoted || isVoting) return;

        setIsVoting(true);
        setError('');

        try {
            const res = await api.post(`/polls/${localPoll._id}/vote`, {
                optionIndex: selectedOption
            });

            if (res.data.success) {
                // Update local poll data with new vote counts from server
                setLocalPoll(res.data.data);
                setLocalVoted(true);
                setLocalVotedIndex(selectedOption);
                setSelectedOption(null);

                // Notify parent component
                if (onVoteSuccess) {
                    onVoteSuccess(localPoll._id, selectedOption);
                }
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to submit vote';
            setError(message);

            // If already voted (race condition or cookie cleared), mark as voted
            if (err.response?.data?.alreadyVoted) {
                setLocalVoted(true);
                setLocalVotedIndex(err.response.data.votedOptionIndex ?? null);
            }
        } finally {
            setIsVoting(false);
        }
    };

    // Format date string
    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    return (
        <div
            className={`poll-card ${localVoted ? 'poll-card--voted' : 'poll-card--active'}`}
            id={`poll-card-${localPoll._id}`}
        >
            {/* Poll Question */}
            <div className="poll-card__question">
                ❓ {localPoll.question}
            </div>

            {/* Poll Options */}
            <div className="poll-card__options">
                {localPoll.options.map((option, index) => {
                    const percent = getPercent(option.votes);
                    const isMyVote = localVoted && localVotedIndex === index;
                    const isSelected = selectedOption === index;

                    return (
                        <button
                            key={index}
                            id={`poll-${localPoll._id}-option-${index}`}
                            className={`poll-option 
                                ${isMyVote ? 'poll-option--voted' : ''}
                                ${localVoted ? 'poll-option--disabled' : ''}
                                ${isSelected ? 'poll-option--selected' : ''}
                            `}
                            style={{ '--progress': localVoted ? `${percent}%` : '0%' }}
                            onClick={() => handleSelectOption(index)}
                            disabled={localVoted || isVoting}
                            aria-label={`Vote for ${option.text}`}
                        >
                            {/* Radio indicator */}
                            <span className="poll-option__radio">
                                {isSelected && !localVoted && (
                                    <span
                                        style={{
                                            width: '8px',
                                            height: '8px',
                                            background: 'var(--color-primary)',
                                            borderRadius: '50%',
                                            display: 'block'
                                        }}
                                    />
                                )}
                                <span className="poll-option__radio-dot"></span>
                            </span>

                            {/* Option Text */}
                            <span className="poll-option__text">{option.text}</span>

                            {/* Vote stats - show only after voting */}
                            {localVoted && (
                                <span className="poll-option__stats">
                                    <span>{option.votes}</span>
                                    <span className="poll-option__percent">{percent}%</span>
                                </span>
                            )}

                            {/* Progress bar - visible after voting */}
                            {localVoted && (
                                <span
                                    className="poll-option__progress-bar"
                                    style={{ width: `${percent}%` }}
                                />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Error message */}
            {error && (
                <p className="form-error" style={{ marginBottom: 'var(--space-sm)' }}>
                    ⚠️ {error}
                </p>
            )}

            {/* Submit Vote Button - only before voting */}
            {!localVoted && (
                <button
                    id={`poll-${localPoll._id}-vote-btn`}
                    className="btn btn-primary btn-sm"
                    onClick={handleSubmitVote}
                    disabled={selectedOption === null || isVoting}
                    style={{ marginBottom: 'var(--space-sm)' }}
                >
                    {isVoting ? '⏳ Submitting...' : '✅ Submit Vote'}
                </button>
            )}

            {/* Footer */}
            <div className="poll-card__footer">
                <span className="poll-card__total">
                    🗳️ {totalVotes} vote{totalVotes !== 1 ? 's' : ''}
                </span>
                {localVoted && (
                    <span className="poll-card__voted-badge">
                        ✔️ You voted
                    </span>
                )}
                <span className="text-xs text-muted">
                    {formatDate(localPoll.createdAt)}
                </span>
            </div>
        </div>
    );
};

export default PollCard;
