import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AchievementModal from './AchievementModal';
import { AuthContext } from '../context/AuthContext';

function Profile({ user, setActiveView }) {
    const { fetchUser } = React.useContext(AuthContext); // Ensure fetchUser is available
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [goals, setGoals] = useState(user?.goals || []);
    const [newGoal, setNewGoal] = useState("");
    const [friendsCount, setFriendsCount] = useState(0);

    // Editable fields
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [bio, setBio] = useState('');

    // State tracking
    const [hasChanges, setHasChanges] = useState(false);
    const [initialState, setInitialState] = useState({ firstName: '', lastName: '', bio: '' });

    useEffect(() => {
        if (user) {
            const nameParts = user.name?.split(' ') || [];
            const initial = {
                firstName: nameParts[0] || '',
                lastName: nameParts.slice(1).join(' ') || '',
                bio: user.bio || ""
            };
            setInitialState(initial);
            setFirstName(initial.firstName);
            setLastName(initial.lastName);
            setBio(initial.bio);
            fetchFriendsCount();
        }
    }, [user]);

    // Check for changes
    useEffect(() => {
        const changed = firstName !== initialState.firstName ||
            lastName !== initialState.lastName ||
            bio !== initialState.bio;
        setHasChanges(changed);
    }, [firstName, lastName, bio, initialState]);

    const fetchFriendsCount = async () => {
        try {
            const res = await axios.get('/api/users/friends');
            setFriendsCount(res.data.length);
        } catch (err) { console.error(err); }
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoal) return;
        setGoals([...goals, newGoal]);
        setNewGoal("");
    };

    const handleCancel = () => {
        setFirstName(initialState.firstName);
        setLastName(initialState.lastName);
        setBio(initialState.bio);
    };

    const saveProfile = async () => {
        try {
            const fullName = `${firstName} ${lastName}`.trim();
            await axios.put('/api/users/profile', {
                name: fullName,
                bio
            });
            await fetchUser(); // Refresh user context
            // Initial state will update via the useEffect on [user]
        } catch (err) {
            console.error(err);
            alert('Failed to update profile');
        }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <div className="profile-edit-container" style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
                        <div className="profile-avatar-section">
                            <img src={user.avatar} alt="Profile" style={{ width: '150px', height: '150px', borderRadius: '50%', border: '4px solid var(--primary)', boxShadow: '0 8px 25px rgba(0,0,0,0.3)' }} />
                            <div className="level-badge" style={{ marginTop: '-20px', position: 'relative', textAlign: 'center' }}>
                                <span style={{ background: 'var(--primary)', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold' }}>Lvl {user.level}</span>
                            </div>
                        </div>

                        <div className="profile-fields-section" style={{ flex: 1 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                                <h3 style={{ margin: 0 }}>User Information</h3>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div className="profile-field">
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Username</label>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                        @{user.username || 'user'}
                                    </div>
                                </div>
                                <div className="profile-field">
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Email</label>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                                        {user.email}
                                    </div>
                                </div>
                                <div className="profile-field">
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>First Name</label>
                                    <input
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div className="profile-field">
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Last Name</label>
                                    <input
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white' }}
                                    />
                                </div>
                                <div className="profile-field" style={{ gridColumn: 'span 2' }}>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Bio</label>
                                    <textarea
                                        value={bio}
                                        onChange={e => setBio(e.target.value)}
                                        rows={3}
                                        style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: 'white', resize: 'vertical' }}
                                    />
                                </div>
                                <div className="profile-field">
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '5px' }}>Friends</label>
                                    <div style={{ padding: '10px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px' }}>
                                        {friendsCount} friends
                                    </div>
                                </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px', minHeight: '40px' }}>
                                {hasChanges && (
                                    <>
                                        <button onClick={handleCancel} className="btn-secondary" style={{ padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
                                        <button onClick={saveProfile} className="btn-primary" style={{ cursor: 'pointer' }}><i className="fa-solid fa-check"></i> Save Changes</button>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                </section>

                <section className="badges-section glass-panel">
                    <h3><i className="fa-solid fa-medal"></i> Achievements</h3>
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