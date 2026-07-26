import React, { useState } from 'react';
import api from '../api/axios';

// PollForm modal component for creating a new poll
// options: minimum 2, maximum 6
const PollForm = ({ onClose, onPollCreated }) => {
    const [question, setQuestion] = useState('');
    const [options, setOptions] = useState(['', '']); // Start with 2 empty options
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Add a new option (max 6)
    const handleAddOption = () => {
        if (options.length >= 6) return;
        setOptions([...options, '']);
    };

    // Remove an option (min 2)
    const handleRemoveOption = (index) => {
        if (options.length <= 2) return;
        const updated = options.filter((_, i) => i !== index);
        setOptions(updated);
    };

    // Update a specific option's text
    const handleOptionChange = (index, value) => {
        const updated = [...options];
        updated[index] = value;
        setOptions(updated);
        // Clear option-specific error
        if (errors[`option_${index}`]) {
            const newErrors = { ...errors };
            delete newErrors[`option_${index}`];
            setErrors(newErrors);
        }
    };

    // Validate form before submission
    const validate = () => {
        const newErrors = {};

        if (!question.trim()) {
            newErrors.question = 'Poll question is required';
        } else if (question.trim().length < 5) {
            newErrors.question = 'Question must be at least 5 characters';
        }

        options.forEach((opt, index) => {
            if (!opt.trim()) {
                newErrors[`option_${index}`] = `Option ${index + 1} cannot be empty`;
            }
        });

        // Check for duplicate options
        const trimmedOptions = options.map((o) => o.trim().toLowerCase());
        const uniqueOptions = new Set(trimmedOptions);
        if (uniqueOptions.size !== trimmedOptions.length) {
            newErrors.duplicates = 'All options must be unique';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const res = await api.post('/polls', {
                question: question.trim(),
                options: options.map((o) => o.trim())
            });

            if (res.data.success) {
                onPollCreated(res.data.data);
                onClose();
            }
        } catch (err) {
            const message = err.response?.data?.message || 'Failed to create poll';
            setErrors({ submit: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" id="create-poll-modal-overlay" onClick={onClose}>
            <div
                className="modal"
                id="create-poll-modal"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal Header */}
                <div className="modal-header">
                    <h2 className="modal-title">➕ Create New Poll</h2>
                    <button
                        id="close-modal-btn"
                        className="btn btn-ghost btn-icon"
                        onClick={onClose}
                        aria-label="Close modal"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} noValidate>
                    {/* Poll Question */}
                    <div className="form-group">
                        <label className="form-label" htmlFor="poll-question">
                            Poll Question <span style={{ color: 'var(--color-danger)' }}>*</span>
                        </label>
                        <textarea
                            id="poll-question"
                            className="form-textarea"
                            placeholder="What would you like to ask?"
                            value={question}
                            onChange={(e) => {
                                setQuestion(e.target.value);
                                if (errors.question) {
                                    setErrors({ ...errors, question: '' });
                                }
                            }}
                            rows={3}
                            maxLength={500}
                        />
                        {errors.question && (
                            <span className="form-error">{errors.question}</span>
                        )}
                        <span className="text-xs text-muted">{question.length}/500</span>
                    </div>

                    {/* Divider */}
                    <div className="divider" />

                    {/* Poll Options */}
                    <div className="form-group">
                        <div className="flex items-center justify-between mb-sm">
                            <label className="form-label">
                                Options ({options.length}/6)
                            </label>
                            <div className="flex gap-sm">
                                {options.length < 6 && (
                                    <button
                                        type="button"
                                        id="add-option-btn"
                                        className="btn btn-secondary btn-sm"
                                        onClick={handleAddOption}
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {options.map((option, index) => (
                                <div key={index} className="option-input-row">
                                    {/* Option number badge */}
                                    <span className="option-number">{index + 1}</span>

                                    {/* Option input */}
                                    <input
                                        id={`option-input-${index}`}
                                        type="text"
                                        className="form-input"
                                        placeholder={`Option ${index + 1}`}
                                        value={option}
                                        onChange={(e) => handleOptionChange(index, e.target.value)}
                                        maxLength={200}
                                        style={{ flex: 1, margin: 0 }}
                                    />

                                    {/* Remove option button (only if > 2 options) */}
                                    {options.length > 2 && (
                                        <button
                                            type="button"
                                            id={`remove-option-${index}-btn`}
                                            className="btn btn-danger btn-icon btn-sm"
                                            onClick={() => handleRemoveOption(index)}
                                            aria-label={`Remove option ${index + 1}`}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Per-option errors */}
                        {options.map((_, index) =>
                            errors[`option_${index}`] ? (
                                <span key={index} className="form-error">
                                    {errors[`option_${index}`]}
                                </span>
                            ) : null
                        )}

                        {errors.duplicates && (
                            <span className="form-error">{errors.duplicates}</span>
                        )}
                    </div>

                    {/* Submit error */}
                    {errors.submit && (
                        <div
                            style={{
                                padding: '12px 16px',
                                background: 'rgba(255,71,87,0.1)',
                                border: '1px solid rgba(255,71,87,0.25)',
                                borderRadius: 'var(--radius-md)',
                                color: 'var(--color-danger)',
                                fontSize: 'var(--font-size-sm)',
                                marginBottom: 'var(--space-md)'
                            }}
                        >
                            ⚠️ {errors.submit}
                        </div>
                    )}

                    {/* Form Actions */}
                    <div className="flex gap-sm" style={{ marginTop: 'var(--space-lg)' }}>
                        <button
                            type="button"
                            id="cancel-poll-btn"
                            className="btn btn-ghost btn-full"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            id="submit-poll-btn"
                            className="btn btn-primary btn-full"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? '⏳ Creating...' : '✅ Create Poll'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PollForm;
