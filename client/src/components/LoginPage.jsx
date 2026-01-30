import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function LoginPage() {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const { identifier, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await login(identifier, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed');
            setLoading(false);
        }
    };

    const handleDemoLogin = async () => {
        try {
            setLoading(true);
            const res = await axios.post('http://localhost:5000/api/auth/demo');
            localStorage.setItem('token', res.data.token);
            // Force reload or re-fetch context. Ideally context has a 'loadUser' but for now a reload works or passing token to login if modified.
            // Actually AuthContext.login does an API call. We manual token set here, so we should really use a helper or just force reload.
            // Let's manually trigger the verify in context if possible, or easiest: full reload.
            window.location.href = '/';
        } catch (err) {
            setLoading(false);
            setError("Demo login failed");
        }
    };

    return (
        <div className="auth-container slide-in">
            <div className="auth-card glass-panel">
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>
                    <i className="fa-solid fa-wallet" style={{ marginRight: '10px', color: 'var(--accent-primary)' }}></i>
                    WealthFlow
                </h2>
                <h3 style={{ textAlign: 'center', marginBottom: '20px', fontSize: '1.2rem' }}>Sign In</h3>

                {error && <div className="alert-danger">{error}</div>}

                <form onSubmit={onSubmit}>
                    <div className="form-group">
                        <label>Email or Username</label>
                        <input
                            type="text"
                            name="identifier"
                            value={identifier}
                            onChange={onChange}
                            required
                            placeholder="user@example.com"
                        />
                    </div>
                    <div className="form-group">
                        <label>Password</label>
                        <input
                            type="password"
                            name="password"
                            value={password}
                            onChange={onChange}
                            required
                            placeholder="••••••"
                        />
                    </div>
                    <button type="submit" className="btn-primary full-width" disabled={loading}>
                        {loading ? 'Signing in...' : 'Login'}
                    </button>
                </form>

                <div style={{ display: 'flex', alignItems: 'center', margin: '20px 0' }}>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                    <span style={{ padding: '0 10px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>OR</span>
                    <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }}></div>
                </div>

                <button onClick={handleDemoLogin} className="btn-secondary full-width" disabled={loading} style={{ background: 'linear-gradient(45deg, #FF9966, #FF5E62)', border: 'none', color: 'white', fontWeight: 'bold' }}>
                    <i className="fa-solid fa-rocket" style={{ marginRight: '8px' }}></i> Try Demo Account
                </button>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
