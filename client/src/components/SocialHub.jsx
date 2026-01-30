import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SocialHub() {
    const [friends, setFriends] = useState([]); // This would be populated if the user model had friends populated
    const [allUsers, setAllUsers] = useState([]);
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            // Fetch all users we can potentially add
            const res = await axios.get('http://localhost:5000/api/users');
            setAllUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const addFriend = async (id) => {
        try {
            await axios.post(`http://localhost:5000/api/users/friends/${id}`);
            // Optimistically remove from list
            setAllUsers(allUsers.filter(u => u._id !== id));
            alert("Friend added!");
        } catch (err) { console.error(err); }
    };

    // Mock Leaderboard (Mix of API data if available or just placeholders)
    // For MVP robust, lets assume 'allUsers' contains XP info
    const leaderboard = [...allUsers].sort((a, b) => b.xp - a.xp);

    return (
        <div className="view active-view slide-in">
            <div className="social-grid">
                <section className="leaderboard glass-panel">
                    <h3><i className="fa-solid fa-crown"></i> Community Leaderboard</h3>
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
                                    <button onClick={() => addFriend(u._id)} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer' }}>
                                        <i className="fa-solid fa-user-plus"></i>
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="activity-feed glass-panel">
                    <h3>Search Friends</h3>
                    <div className="form-group">
                        <input placeholder="Search users..." value={search} onChange={e => setSearch(e.target.value)} />
                    </div>
                    <div className="feed-container">
                        {allUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
                            <div key={u._id} className="transaction-item">
                                <div className="t-info">
                                    <img src={u.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
                                    <div className="t-details">
                                        <h4>{u.name}</h4>
                                        <span>Lvl {u.level}</span>
                                    </div>
                                </div>
                                <button className="btn-primary" style={{ height: '35px', padding: '0 15px' }} onClick={() => addFriend(u._id)}>Add</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SocialHub;
