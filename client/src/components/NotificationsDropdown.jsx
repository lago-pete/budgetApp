import React, { useState } from 'react';

function NotificationsDropdown() {
    const [isOpen, setIsOpen] = useState(false);

    // Mock notifications
    const notifications = [
        { id: 1, text: "Sarah added you as a friend", time: "2h ago" },
        { id: 2, text: "You earned 'Saver I' badge!", time: "1d ago" }
    ];

    return (
        <div className="dropdown" style={{ position: 'relative' }}>
            <button className="btn-icon" onClick={() => setIsOpen(!isOpen)}>
                <i className="fa-solid fa-bell"></i>
                {notifications.length > 0 && <span className="small-badge" style={{ position: 'absolute', top: '-5px', right: '-5px' }}>{notifications.length}</span>}
            </button>

            {isOpen && (
                <div className="glass-panel" style={{
                    position: 'absolute', top: '120%', right: 0, width: '300px',
                    padding: '1rem', zIndex: 1000, boxShadow: 'var(--shadow-soft)'
                }}>
                    <h4 style={{ marginBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.5rem' }}>Notifications</h4>
                    {notifications.length === 0 ? (
                        <div style={{ color: 'var(--text-muted)' }}>No new notifications</div>
                    ) : (
                        <ul style={{ listStyle: 'none' }}>
                            {notifications.map(n => (
                                <li key={n.id} style={{ marginBottom: '10px', fontSize: '0.9rem' }}>
                                    <div>{n.text}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default NotificationsDropdown;
