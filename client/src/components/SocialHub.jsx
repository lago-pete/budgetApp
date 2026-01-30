import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SocialHub() {
    const [friends, setFriends] = useState([]);
    const [searchUsers, setSearchUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchFriends();
        fetchAllUsers();
    }, []);

    const fetchFriends = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users/friends');
            setFriends(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get('http://localhost:5000/api/users');
            setSearchUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const sendFriendRequest = async (id) => {
        try {
            const res = await axios.post(`http://localhost:5000/api/users/request/${id}`);
            // Remove from search list instantly
            setSearchUsers(searchUsers.filter(u => u._id !== id));
            alert("Friend request sent!");
        } catch (err) {
            alert(err.response?.data?.msg || "Failed to send request");
        }
    };

    const removeFriend = async (id) => {
        if (!window.confirm("Remove this friend?")) return;
        try {
            const res = await axios.delete(`http://localhost:5000/api/users/friends/${id}`);
            setFriends(res.data);
            fetchAllUsers();
        } catch (err) { console.error(err); }
    };

    const leaderboard = [...friends].sort((a, b) => b.xp - a.xp);

    return (
        <div className="view active-view slide-in">
            <div className="social-grid">
                <section className="leaderboard glass-panel">
                    <h3><i className="fa-solid fa-crown"></i> Friend Leaderboard</h3>
                    {friends.length === 0 ? (
                        <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Add friends to compete!</div>
                    ) : (
                        <ul className="leaderboard-list">
                            {leaderboard.map((u, index) => (
                                <li key={u._id} className="leaderboard-item">
                                    <div className="t-info">
                                        <span className="rank">#{index + 1}</span>
                                        <div className="avatar-circle" style={{ width: '35px', height: '35px' }}>
                                            <img src={u.avatar} style={{ width: '100%', height: '100%' }} alt={u.name} />
                                        </div>
                                        <span>{u.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>{u.xp} XP</span>
                                        <button onClick={() => removeFriend(u._id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }} title="Remove Friend">
                                            <i className="fa-solid fa-user-minus"></i>
                                        </button>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>

                <section className="activity-feed glass-panel">
                    <h3>Find People</h3>
                    <div className="form-group">
                        <input placeholder="Search users by name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="feed-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {searchUsers
                            .filter(u => u.name.toLowerCase().includes(searchTerm.toLowerCase()))
                            .map(u => (
                                <div key={u._id} className="transaction-item">
                                    <div className="t-info">
                                        <img src={u.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                        <div className="t-details">
                                            <h4>{u.name}</h4>
                                            <span>Lvl {u.level}</span>
                                        </div>
                                    </div>
                                    <button className="btn-primary" style={{ height: '35px', padding: '0 15px' }} onClick={() => sendFriendRequest(u._id)}>
                                        <i className="fa-solid fa-user-plus"></i> Request
                                    </button>
                                </div>
                            ))}
                        {searchUsers.length === 0 && <div style={{ padding: '10px', color: 'var(--text-muted)' }}>No new users found.</div>}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SocialHub;
