import React, { useState, useEffect } from 'react';
import axios from 'axios';

function SocialHub() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        fetchAllUsers();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const leaderboard = [...users].sort((a, b) => b.xp - a.xp);

    return (
        <div className="view active-view slide-in">
            <div className="social-grid">
                <section className="leaderboard glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <h3><i className="fa-solid fa-globe"></i> Global Leaderboard</h3>
                    {users.length === 0 ? (
                        <div style={{ padding: '20px', color: 'var(--text-muted)' }}>Loading users...</div>
                    ) : (
                        <ul className="leaderboard-list" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '15px', padding: 0 }}>
                            {leaderboard.map((u, index) => (
                                <li key={u._id} className="leaderboard-item" style={{ background: 'rgba(255,255,255,0.02)', padding: '15px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div className="t-info" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                        <span className="rank" style={{ fontWeight: 'bold', fontSize: '1.2rem', color: index < 3 ? 'var(--primary)' : 'var(--text-muted)' }}>#{index + 1}</span>
                                        <div className="avatar-circle" style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden' }}>
                                            <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={u.name} />
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 'bold' }}>{u.name}</div>
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Lvl {u.level} {u.isPremium && <i className="fa-solid fa-gem" style={{ color: 'var(--primary)', marginLeft: '5px' }}></i>}</div>
                                        </div>
                                    </div>
                                    <div style={{ fontWeight: 'bold', color: 'var(--accent-secondary)' }}>
                                        {u.xp} XP
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </div>
        </div>
    );
}

export default SocialHub;
