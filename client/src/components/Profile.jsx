import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AchievementModal from './AchievementModal';

function Profile({ user }) {
    const [selectedBadge, setSelectedBadge] = useState(null);
    const [goals, setGoals] = useState(user?.goals || []);
    const [newGoal, setNewGoal] = useState("");
    const [isPrivate, setIsPrivate] = useState(user?.isPrivate || false);
    const [friends, setFriends] = useState([]);
    const [friendRequests, setFriendRequests] = useState([]); // Incoming
    const [bio, setBio] = useState(user?.bio || "");
    const [isEditingBio, setIsEditingBio] = useState(false);

    // Sync initial user prop
    useEffect(() => {
        if (user) {
            setIsPrivate(user.isPrivate);
            setBio(user.bio || "");
            // Friend requests are populated in 'user', but we need to fetch them if updated
            // Or simply refetch 'me'
            if (user.friendRequests) setFriendRequests(user.friendRequests.filter(r => r.status === 'pending'));
            fetchFriends();
        }
    }, [user]);

    const fetchFriends = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users/friends');
            setFriends(res.data);
        } catch (err) { console.error(err); }
    };

    const handleAddGoal = (e) => {
        e.preventDefault();
        if (!newGoal) return;
        setGoals([...goals, newGoal]);
        setNewGoal("");
        // Ideally sync with backend
    };

    const togglePrivacy = async () => {
        try {
            const res = await axios.put('http://localhost:5000/api/users/privacy');
            setIsPrivate(res.data.isPrivate);
        } catch (err) { console.error(err); }
    };

    const saveBio = async () => {
        try {
            await axios.put('http://localhost:5000/api/users/bio', { bio });
            setIsEditingBio(false);
        } catch (err) { console.error(err); }
    };

    const respondToRequest = async (reqId, action) => {
        try {
            const endpoint = action === 'accept' ? 'accept' : 'reject';
            await axios.post(`http://localhost:5000/api/users/request/${endpoint}/${reqId}`);
            setFriendRequests(friendRequests.filter(r => r._id !== reqId));
            if (action === 'accept') fetchFriends(); // Refresh friends list
        } catch (err) { console.error(err); }
    };

    if (!user) return <div>Loading...</div>;

    return (
        <div className="view active-view slide-in">
            <div className="profile-header glass-panel">
                <div className="profile-main">
                    <div className="profile-avatar-lg">
                        <img src={user.avatar} alt="Profile" style={{ width: '120px', height: '120px', borderRadius: '50%', border: '3px solid var(--primary)' }} />
                    </div>
                    <div className="profile-details" style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <h2 className="profile-name">{user.name}</h2>
                                <span style={{ opacity: 0.6 }}>@{user.username || 'user'}</span>
                                <div onClick={togglePrivacy} style={{ cursor: 'pointer', background: isPrivate ? 'var(--danger)' : 'rgba(255,255,255,0.1)', padding: '5px 10px', borderRadius: '20px', fontSize: '0.8rem' }}>
                                    {isPrivate ? <><i className="fa-solid fa-lock"></i> Private</> : <><i className="fa-solid fa-earth-americas"></i> Public</>}
                                </div>
                            </div>
                        </div>

                        {/* Bio Section */}
                        <div style={{ marginTop: '10px', maxWidth: '600px' }}>
                            {isEditingBio ? (
                                <div style={{ display: 'flex', gap: '10px' }}>
                                    <input value={bio} onChange={e => setBio(e.target.value)} style={{ flex: 1, padding: '5px', borderRadius: '5px', border: 'none' }} autoFocus />
                                    <button onClick={saveBio} className="btn-primary" style={{ height: '30px', padding: '0 15px' }}>Save</button>
                                </div>
                            ) : (
                                <p className="profile-bio" onClick={() => setIsEditingBio(true)} style={{ cursor: 'pointer', borderBottom: '1px dashed rgba(255,255,255,0.3)', paddingBottom: '2px', display: 'inline-block' }}>
                                    {bio || "Add a bio..."} <i className="fa-solid fa-pen" style={{ fontSize: '0.7rem', marginLeft: '5px', opacity: 0.5 }}></i>
                                </p>
                            )}
                        </div>

                        <div className="level-bar-container">
                            <span className="level-badge">Lvl {user.level} Saver</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="dashboard-grid">
                <section className="friends-section glass-panel">
                    <h3><i className="fa-solid fa-user-group"></i> Friend Requests ({friendRequests.length})</h3>
                    {friendRequests.length > 0 ? (
                        <ul className="transaction-list" style={{ marginBottom: '2rem' }}>
                            {friendRequests.map(req => (
                                <li key={req._id} className="transaction-item">
                                    <div className="t-info">
                                        <img src={req.from.avatar} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                        <span>{req.from.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '5px' }}>
                                        <button onClick={() => respondToRequest(req._id, 'accept')} style={{ background: 'var(--success)', border: 'none', borderRadius: '5px', padding: '5px 10px', color: 'white', cursor: 'pointer' }}>Accept</button>
                                        <button onClick={() => respondToRequest(req._id, 'reject')} style={{ background: 'var(--danger)', border: 'none', borderRadius: '5px', padding: '5px 10px', color: 'white', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    ) : <div style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No pending requests.</div>}

                    <h3><i className="fa-solid fa-users"></i> My Friends ({friends.length})</h3>
                    <ul className="transaction-list">
                        {friends.length === 0 ? <li style={{ color: 'var(--text-muted)' }}>No friends added yet. Go to Social Hub!</li> : null}
                        {friends.map(f => (
                            <li key={f._id} className="transaction-item">
                                <div className="t-info">
                                    <img src={f.avatar} style={{ width: '30px', height: '30px', borderRadius: '50%' }} />
                                    <div className="t-details">
                                        <span>{f.name}</span>
                                        {/* Show Bio on hover or click? For now just name/level */}
                                    </div>
                                </div>
                                <span className="level-badge small">Lvl {f.level}</span>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="badges-section glass-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                        <h3><i className="fa-solid fa-medal"></i> Achievements</h3>
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
