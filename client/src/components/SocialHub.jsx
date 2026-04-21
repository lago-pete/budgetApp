import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function SocialHub() {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [completedChallenges, setCompletedChallenges] = useState([]);

    useEffect(() => {
        fetchAllUsers();
        fetchCompletedChallenges();
    }, []);

    const fetchAllUsers = async () => {
        try {
            const res = await axios.get('/api/users');
            setUsers(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchCompletedChallenges = async () => {
        try {
            const res = await axios.get('/api/challenges/my');
            setCompletedChallenges(res.data.filter(c => c.participation?.status === 'completed'));
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
                                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                                {u.isPremium && <i className="fa-solid fa-gem" style={{ color: 'var(--primary)', marginRight: '5px' }}></i>}
                                                {u._id === user?._id && <span style={{ color: 'var(--accent-secondary)', fontSize: '0.75rem' }}>You</span>}
                                            </div>
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

                <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <h3><i className="fa-solid fa-circle-check"></i> My Completed Challenges</h3>
                    {completedChallenges.length === 0 ? (
                        <div style={{ padding: '20px', color: 'var(--text-muted)' }}>No completed challenges yet. Finish a challenge to see it here.</div>
                    ) : (
                        <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                            {completedChallenges.map(c => (
                                <li key={c._id} style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '10px', padding: '14px 16px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                                        <i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i>
                                        <span style={{ fontWeight: '600', color: 'var(--text-main)' }}>{c.title}</span>
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>{c.description}</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: '8px' }}>
                                        <span style={{ color: 'var(--accent-secondary)', fontWeight: '600' }}>+{c.reward} XP</span>
                                        <span style={{ color: 'var(--text-muted)' }}>
                                            {c.participation?.completedAt ? new Date(c.participation.completedAt).toLocaleDateString() : ''}
                                        </span>
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
