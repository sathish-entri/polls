import React from 'react';

// Reusable stat card for analytics dashboard
const AnalyticsCard = ({ icon, value, label, sublabel, color }) => {
    return (
        <div className="stat-card">
            <span className="stat-card__icon">{icon}</span>
            <div
                className="stat-card__value"
                style={color ? { color } : {}}
            >
                {value}
            </div>
            <div className="stat-card__label">{label}</div>
            {sublabel && (
                <div className="stat-card__sublabel">{sublabel}</div>
            )}
        </div>
    );
};

export default AnalyticsCard;
