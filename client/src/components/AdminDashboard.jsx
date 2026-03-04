import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [deleteModal, setDeleteModal] = useState({ show: false, userId: null, userName: '' });
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/users/admin/all', {
                headers: { 'x-auth-token': token }
            });
            setUsers(res.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to fetch users. Access denied?');
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user && user.role === 'admin') {
            fetchUsers();
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

    const confirmDelete = (u) => {
        setDeleteModal({ show: true, userId: u._id, userName: u.name });
    };

    const handleDelete = async () => {
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

    if (loading) return <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading Admin Panel...</div>;

    return (
        <div className="main-content" style={{ maxWidth: '1000px', margin: '0 auto', width: '100%' }}>
            <header className="top-bar">
                <div>
                    <h1 id="page-title">Admin Dashboard</h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Welcome back, {user?.name}</p>
                </div>
                <button onClick={handleLogout} className="btn-icon" title="Logout">
                    <i className="fa-solid fa-right-from-bracket"></i>
                </button>
            </header>

            {error && <div className="alert-danger" style={{ marginBottom: '2rem' }}>{error}</div>}

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
                                                onClick={() => confirmDelete(u)}
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

            <div style={{ marginTop: '2rem', textAlign: 'center' }}>
                <button onClick={() => navigate('/')} style={{ background: 'none', border: 'none', color: 'var(--primary)', cursor: 'pointer', fontWeight: '500' }}>
                    Go to Application Dashboard
                </button>
            </div>

            {/* DELETE MODAL */}
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
                                <button
                                    onClick={() => setDeleteModal({ show: false, userId: null, userName: '' })}
                                    className="btn-icon"
                                    style={{ width: 'auto', padding: '0 1rem' }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleDelete}
                                    className="btn-primary"
                                    style={{ background: 'var(--danger)' }}
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
