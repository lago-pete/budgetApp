import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

function RegisterPage() {
    const [username, setUsername] = useState('');
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [accountType, setAccountType] = useState('premium'); // 'premium' or 'basic'
    const [confirmPassword, setConfirmPassword] = useState('');
    const [step, setStep] = useState(1); // 1 = initial form, 2 = confirm password
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleInitialSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!username || !firstName || !lastName || !email || !password) {
            setError('All fields are required');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        // Check if username or email already exists
        try {
            const res = await axios.post('/api/auth/check-availability', {
                username,
                email
            });

            if (!res.data.available) {
                setError(res.data.msg);
                return;
            }

            setStep(2);
        } catch (err) {
            setError(err.response?.data?.msg || 'Error checking availability');
        }
    };

    const handleFinalSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const fullName = `${firstName} ${lastName}`;
            const isPremium = accountType === 'premium';
            await register(fullName, email, password, username, isPremium);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.msg || "Registration failed");
            setStep(1); // Go back to initial form
        }
    };

    const handleBack = () => {
        setStep(1);
        setConfirmPassword('');
        setError('');
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', width: '100%' }}>
            <div className="glass-panel" style={{ width: '400px', padding: '2rem' }}>
                <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                    <div className="logo-icon" style={{ margin: '0 auto 1rem' }}><i className="fa-solid fa-bolt"></i></div>
                    <h2>{step === 1 ? 'Create Account' : 'Confirm Password'}</h2>
                </div>

                {error && <div className="alert-danger">{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleInitialSubmit}>
                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="johndoe" />
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                                <i className="fa-solid fa-info-circle"></i> Username cannot be changed later
                            </div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                            <div className="form-group">
                                <label>First Name</label>
                                <input type="text" value={firstName} onChange={e => setFirstName(e.target.value)} required placeholder="John" />
                            </div>
                            <div className="form-group">
                                <label>Last Name</label>
                                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)} required placeholder="Doe" />
                            </div>
                        </div>
                        <div className="form-group">
                            <label>Email</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="john@example.com" />
                        </div>
                        <div className="form-group">
                            <label>Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
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
                        <button type="submit" className="btn-primary full-width">Continue</button>
                    </form>
                ) : (
                    <form onSubmit={handleFinalSubmit}>
                        <div className="form-group">
                            <label>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={e => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="••••••"
                                    autoFocus
                                    style={{ width: '100%', paddingRight: '40px' }}
                                />
                                <i
                                    className={`fa-solid ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
                        <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                            <label>Account Type</label>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '8px' }}>
                                <div
                                    onClick={() => setAccountType('premium')}
                                    className={`glass-panel ${accountType === 'premium' ? 'active' : ''}`}
                                    style={{
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        border: accountType === 'premium' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                        background: accountType === 'premium' ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                    }}
                                >
                                    <i className="fa-solid fa-crown" style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px', color: accountType === 'premium' ? 'var(--primary)' : 'var(--text-muted)' }}></i>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Premium</div>
                                </div>
                                <div
                                    onClick={() => setAccountType('basic')}
                                    className={`glass-panel ${accountType === 'basic' ? 'active' : ''}`}
                                    style={{
                                        padding: '0.75rem',
                                        cursor: 'pointer',
                                        textAlign: 'center',
                                        border: accountType === 'basic' ? '2px solid var(--primary)' : '1px solid var(--border-light)',
                                        background: accountType === 'basic' ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                    }}
                                >
                                    <i className="fa-solid fa-user" style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px', color: accountType === 'basic' ? 'var(--primary)' : 'var(--text-muted)' }}></i>
                                    <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>Basic</div>
                                </div>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: '1.4' }}>
                                {accountType === 'premium' ? (
                                    <span><i className="fa-solid fa-circle-check" style={{ color: 'var(--success)' }}></i> <strong>Premium Plan</strong>: Full Social Hub and Challenges enabled.</span>
                                ) : (
                                    <span><i className="fa-solid fa-circle-info"></i> <strong>Basic Plan</strong>: Social features are disabled for your privacy.</span>
                                )}
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <button type="button" onClick={handleBack} className="btn-secondary" style={{ flex: 1, cursor: 'pointer' }}>Back</button>
                            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Sign Up</button>
                        </div>
                    </form>
                )}

                <div style={{ marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                    Already have an account? <Link to="/login" style={{ color: 'var(--primary)' }}>Login</Link>
                </div>
            </div>
        </div>
    );
}

export default RegisterPage;
