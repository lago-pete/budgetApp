import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const AdminLoginPage = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await login(identifier, password);
            navigate('/admin/dashboard');
        } catch (err) {
            setError(err.response?.data?.msg || 'Invalid credentials');
        }
    };

    return (
        <div className="auth-container slide-in">
            <div className="auth-card glass-panel">
                <h2 style={{ textAlign: 'center', marginBottom: '1.5rem' }}>Admin Portal</h2>
                {error && <div className="alert-danger">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Admin Username</label>
                        <input
                            type="text"
                            value={identifier}
                            onChange={(e) => setIdentifier(e.target.value)}
                            required
                            placeholder="admin"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••"
                        />
                    </div>
                    <button type="submit" className="btn-primary full-width">
                        Sign In as Admin
                    </button>
                </form>
                <div className="auth-footer">
                    <button onClick={() => navigate('/login')} style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontWeight: '500' }}>
                        Back to User Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
