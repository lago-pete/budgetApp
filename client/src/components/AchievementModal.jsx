import React from 'react';

function AchievementModal({ achievement, onClose }) {
    if (!achievement) return null;

    return (
        <div className="modal-overlay">
            <div className="modal glass-panel bounce-in" style={{ textAlign: 'center' }}>
                <div className="modal-header">
                    <h3>Achievement Details</h3>
                    <button className="close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="modal-body">
                    <div style={{ fontSize: '3rem', color: 'var(--accent-primary)', marginBottom: '1rem' }}>
                        <i className={`fa-solid ${achievement.icon}`}></i>
                    </div>
                    <h2 style={{ marginBottom: '0.5rem' }}>{achievement.name}</h2>
                    <p style={{ color: 'var(--text-muted)' }}>{achievement.description || "You earned this badge for your financial excellence!"}</p>
                    <div style={{ marginTop: '1.5rem', background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '10px' }}>
                        <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: 'var(--text-muted)' }}>Earned On</span>
                        <div style={{ fontWeight: '600' }}>{new Date(achievement.dateEarned).toLocaleDateString()}</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AchievementModal;
