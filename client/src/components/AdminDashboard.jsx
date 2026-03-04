import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [challenges, setChallenges] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('users');
    const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: '' });
    const [challengeModal, setChallengeModal] = useState({ show: false, challenge: null });
    const [challengeFormData, setChallengeFormData] = useState({ title: '', description: '', reward: '', isActive: true });

    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users/admin/all', {
                headers: { 'x-auth-token': token }
            });
            setUsers(res.data);
        } catch (err) {
            setError('Failed to fetch users. Access denied?');
        }
    };

    const fetchChallenges = async () => {
        try {
            const res = await axios.get('/api/challenges');
            setChallenges(res.data);
        } catch (err) {
            setError('Failed to fetch challenges.');
        }
    };

    const fetchData = async () => {
        setLoading(true);
        await Promise.all([fetchUsers(), fetchChallenges()]);
        setLoading(false);
    };

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchData();
        } else if (user) {
            navigate('/dashboard');
        } else {
            navigate('/admin');
        }
    }, [user, navigate]);

    const handleLogout = () => {
        logout();
        navigate('/admin');
    };

    // User Delete
    const confirmDeleteUser = (u) => {
        setDeleteModal({ show: true, userId: u._id, userName: u.name });
    };

    const handleDeleteUser = async () => {
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/users/admin/${deleteModal.userId}`, {
                headers: { 'x-auth-token': token }
            });
            setDeleteModal({ show: false, userId: null, userName: '' });
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to delete user');
            setDeleteModal({ show: false, userId: null, userName: '' });
        }
    };

    // Challenge CRUD
    const openChallengeModal = (c = null) => {
        if (c) {
            setChallengeModal({ show: true, challenge: c });
            setChallengeFormData({
                title: c.title,
                description: c.description || '',
                reward: c.reward || '',
                isActive: c.isActive
            });
        } else {
            setChallengeModal({ show: true, challenge: null });
            setChallengeFormData({ title: '', description: '', reward: '', isActive: true });
        }
    };

    const handleChallengeSubmit = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { 'x-auth-token': token } };
            if (challengeModal.challenge) {
                await axios.put(`/api/challenges/${challengeModal.challenge._id}`, challengeFormData, config);
            } else {
                await axios.post('/api/challenges', challengeFormData, config);
            }
            setChallengeModal({ show: false, challenge: null });
            fetchChallenges();
        } catch (err) {
            setError('Failed to save challenge.');
        }
    };

    const handleDeleteChallenge = async (id) => {
        if (!window.confirm('Are you sure you want to delete this challenge?')) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/challenges/${id}`, {
                headers: { 'x-auth-token': token }
            });
            fetchChallenges();
        } catch (err) {
            setError('Failed to delete challenge.');
        }
    };

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Admin Panel...</div>;

    return (
        <div className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <header className="top-bar">
                <div>
                    <h1 id="page-title">Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome back, {user?.name}</p>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={handleLogout} className="btn-icon" title="Logout">
                        <i className="fa-solid fa-right-from-bracket"></i>
                    </button>
                </div>
            </header>

            {error && <div className="alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
                <button
                    onClick={() => setActiveTab('users')}
                    className={`btn-primary ${activeTab === 'users' ? '' : 'btn-icon'}`}
                    style={{ background: activeTab === 'users' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', width: activeTab === 'users' ? 'auto' : '150px' }}
                >
                    User Management
                </button>
                <button
                    onClick={() => setActiveTab('challenges')}
                    className={`btn-primary ${activeTab === 'challenges' ? '' : 'btn-icon'}`}
                    style={{ background: activeTab === 'challenges' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', width: activeTab === 'challenges' ? 'auto' : '180px' }}
                >
                    Challenge Management
                </button>
            </div>

            {activeTab === 'users' ? (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: 'var(--border-light)' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Registered Users ({users.length})</h3>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>User</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Email</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Role</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Joined</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(u => (
                                    <tr key={u._id} style={{ borderBottom: 'var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                <img src={u.avatar} alt={u.name} style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--primary)' }} />
                                                <div>
                                                    <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{u.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{u.username || 'n/a'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)' }}>{u.email}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: u.role === 'admin' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', color: u.role === 'admin' ? 'var(--danger)' : 'var(--success)' }}>
                                                {u.role.toUpperCase()}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            {u.role !== 'admin' && (
                                                <button
                                                    onClick={() => confirmDeleteUser(u)}
                                                    className="btn-icon"
                                                    style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ) : (
                <div className="glass-panel" style={{ padding: 0, overflow: 'hidden' }}>
                    <div style={{ padding: '1.5rem', borderBottom: 'var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: 'var(--text-main)' }}>Active Challenges ({challenges.length})</h3>
                        <button onClick={() => openChallengeModal()} className="btn-primary" style={{ height: '35px', fontSize: '0.85rem' }}>
                            <i className="fa-solid fa-plus"></i> Add Challenge
                        </button>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead style={{ background: 'rgba(255,255,255,0.02)' }}>
                                <tr>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Title</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Participants</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Reward</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Status</th>
                                    <th style={{ padding: '1rem 1.5rem', color: 'var(--text-muted)', fontWeight: '600' }}>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {challenges.map(c => (
                                    <tr key={c._id} style={{ borderBottom: 'var(--border-light)' }}>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>{c.title}</div>
                                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description?.substring(0, 40)}...</div>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--text-main)' }}>{c.participantsCount}</td>
                                        <td style={{ padding: '1rem 1.5rem', color: 'var(--accent-secondary)' }}>{c.reward}</td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <span style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600', background: c.isActive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(156, 163, 175, 0.1)', color: c.isActive ? 'var(--success)' : 'var(--text-muted)' }}>
                                                {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                                            </span>
                                        </td>
                                        <td style={{ padding: '1rem 1.5rem' }}>
                                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                                <button
                                                    onClick={() => openChallengeModal(c)}
                                                    className="btn-icon"
                                                    style={{ width: '32px', height: '32px' }}
                                                >
                                                    <i className="fa-solid fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteChallenge(c._id)}
                                                    className="btn-icon"
                                                    style={{ width: '32px', height: '32px', color: 'var(--danger)' }}
                                                >
                                                    <i className="fa-solid fa-trash"></i>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
                    Go to Application Dashboard
                </button>
            </div>

            {/* USER DELETE MODAL */}
            {deleteModal.show && (
                <div className="modal-overlay">
                    <div className="modal glass-panel">
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>Delete User?</h2>
                            <button className="close-modal" onClick={() => setDeleteModal({ show: false, userId: null, userName: '' })}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Are you sure you want to delete <strong>{deleteModal.userName}</strong>? This action cannot be undone.</p>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setDeleteModal({ show: false, userId: null, userName: '' })} className="btn-icon" style={{ width: 'auto', padding: '0 1rem' }}>Cancel</button>
                                <button onClick={handleDeleteUser} className="btn-primary" style={{ background: 'var(--danger)' }}>Yes, Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* CHALLENGE MODAL */}
            {challengeModal.show && (
                <div className="modal-overlay">
                    <div className="modal glass-panel" style={{ width: '500px' }}>
                        <div className="modal-header">
                            <h2 style={{ margin: 0 }}>{challengeModal.challenge ? 'Edit Challenge' : 'New Challenge'}</h2>
                            <button className="close-modal" onClick={() => setChallengeModal({ show: false, challenge: null })}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <div className="modal-body">
                            <form onSubmit={handleChallengeSubmit}>
                                <div className="form-group">
                                    <label>Challenge Title</label>
                                    <input
                                        type="text"
                                        value={challengeFormData.title}
                                        onChange={(e) => setChallengeFormData({ ...challengeFormData, title: e.target.value })}
                                        required
                                        placeholder="e.g. No Spend Weekend"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Description</label>
                                    <textarea
                                        value={challengeFormData.description}
                                        onChange={(e) => setChallengeFormData({ ...challengeFormData, description: e.target.value })}
                                        required
                                        placeholder="Explain the challenge..."
                                        style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: 'var(--border-light)', borderRadius: '8px', color: 'white', padding: '0.8rem', minHeight: '100px' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Reward</label>
                                    <input
                                        type="text"
                                        value={challengeFormData.reward}
                                        onChange={(e) => setChallengeFormData({ ...challengeFormData, reward: e.target.value })}
                                        required
                                        placeholder="e.g. 500 XP"
                                    />
                                </div>
                                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <label style={{ margin: 0 }}>Active</label>
                                    <input
                                        type="checkbox"
                                        checked={challengeFormData.isActive}
                                        onChange={(e) => setChallengeFormData({ ...challengeFormData, isActive: e.target.checked })}
                                        style={{ width: '20px', height: '20px' }}
                                    />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '1rem' }}>
                                    <button type="button" onClick={() => setChallengeModal({ show: false, challenge: null })} className="btn-icon" style={{ width: 'auto', padding: '0 1rem' }}>Cancel</button>
                                    <button type="submit" className="btn-primary">Save Challenge</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
