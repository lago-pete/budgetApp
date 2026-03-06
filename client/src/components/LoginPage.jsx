import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function LoginPage() {
    const [formData, setFormData] = useState({ identifier: '', password: '' });
    const { login, user } = useContext(AuthContext);
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const { identifier, password } = formData;

    const onChange = (e) =>
        setFormData({ ...formData, [e.target.name]: e.target.value });

    const onSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            await login(identifier, password);
            // Redirection logic is usually handled by the navigate below, 
            // but we want to be explicit if they are an admin.
            // Since AuthContext updates the user state, we should check it.
        } catch (err) {
            setError(err.response?.data?.msg || 'Login failed');
            setLoading(false);
        }
    };

    // Use a secondary effect or check user role after login
    React.useEffect(() => {
        if (user) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/');
            }
        }
    }, [user, navigate]);

    const handleDemoLogin = async () => {
        try {
            setLoading(true);
            const res = await axios.post('/api/auth/demo');
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
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={password}
                                onChange={onChange}
                                required
                                placeholder="••••••"
                                style={{ width: '100%', paddingRight: '40px' }}
                            />
                            <i
                                className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    cursor: 'pointer',
                                    color: 'var(--text-muted)'
                                }}
                            ></i>
                        </div>
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

                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <button onClick={handleDemoLogin} className="btn-secondary" disabled={loading} style={{ background: 'linear-gradient(45deg, #FF9966, #FF5E62)', border: 'none', color: 'white', fontWeight: 'bold', borderRadius: '16px', padding: '14px 32px', boxShadow: '0 4px 15px rgba(255, 102, 98, 0.3)', cursor: 'pointer' }}>
                        <i className="fa-solid fa-rocket" style={{ marginRight: '8px' }}></i> Try Demo Account
                    </button>
                </div>

                <p className="auth-footer">
                    Don't have an account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}

export default LoginPage;
