import React, { useState } from 'react';
import AchievementModal from './AchievementModal';

function Profile({ user }) {
    const [selectedBadge, setSelectedBadge] = useState(null);
    // Mock goals for now since backend goals array is simple strings
    const [goals, setGoals] = useState(user?.goals || []);
    const [newGoal, setNewGoal] = useState("");

    if (!user) return <div>Loading...</div>;

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoal) return;
        setGoals([...goals, newGoal]);
        setNewGoal("");
        // Ideally this would sync to backend via axios.put('/api/user/goals')
    };

    return (
        <div className="view active-view slide-in">
            <div className="profile-header glass-panel">
                <div className="profile-main">
                    <div className="profile-avatar-lg">
                        <img src={user.avatar} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid var(--primary)' }} />
                    </div>
                    <div className="profile-details">
                        <h2 className="profile-name">{user.name}</h2>
                        <p className="profile-bio">{user.email}</p>
                        <div className="level-bar-container">
                            <span className="level-badge">Lvl {user.level}</span>
                            <div className="progress-bar" style={{ width: '200px', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', marginTop: '5px' }}>
                                <div className="fill" style={{ width: '60%', height: '100%', background: 'var(--success)', borderRadius: '4px' }}></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
                <section className="badges-section glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3><i className="fa-solid fa-medal"></i> Achievements</h3>
                        <button style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>View All</button>
                    </div>
                    <div className="badges-grid">
                        {user.badges.map((b, i) => (
                            <div key={i} className="badge-item" onClick={() => setSelectedBadge(b)} style={{ cursor: 'pointer' }}>
                                <i className={`fa-solid ${b.icon} badge-icon`}></i>
                                <span className="badge-name">{b.name}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className="goals-section glass-panel">
                    <h3><i className="fa-solid fa-bullseye"></i> Financial Goals</h3>
                    <ul className="transaction-list" style={{ marginBottom: '1rem' }}>
                        {goals.map((g, i) => (
                            <li key={i} className="transaction-item">
                                <span>{g}</span>
                                <button style={{ color: 'var(--danger)', background: 'none', border: 'none' }}><i className="fa-solid fa-trash"></i></button>
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={handleAddGoal} style={{ display: 'flex', gap: '10px' }}>
                        <input
                            value={newGoal}
                            onChange={e => setNewGoal(e.target.value)}
                            placeholder="Add a new goal..."
                            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '8px', color: 'white' }}
                        />
                        <button type="submit" className="btn-primary" style={{ height: 'auto' }}>Add</button>
                    </form>
                </section>
            </div>

            <AchievementModal achievement={selectedBadge} onClose={() => setSelectedBadge(null)} />
        </div>
    );
}

export default Profile;
