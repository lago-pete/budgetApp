import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function SettingsPage({ setActiveView }) {
    const { user } = useContext(AuthContext);
    const [isPrivate, setIsPrivate] = useState(false);
    const [useTransactionTemplates, setUseTransactionTemplates] = useState(true);

    useEffect(() => {
        if (user) {
            setIsPrivate(user.isPrivate || false);
            setUseTransactionTemplates(user.useTransactionTemplates ?? true);
        }
    }, [user]);

    const togglePrivacy = async () => {
        try {
            const res = await axios.put('/api/users/privacy');
            setIsPrivate(res.data.isPrivate);
        } catch (err) { console.error(err); }
    };

    const toggleTemplates = async () => {
        try {
            const res = await axios.put('/api/users/templates');
            setUseTransactionTemplates(res.data.useTransactionTemplates);
        } catch (err) { console.error(err); }
    };

    if (!user) return <div className="view active-view slide-in">Loading...</div>;

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel">
                    <h3>Privacy Settings</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Profile Visibility</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                {isPrivate ? 'Only friends can view your profile' : 'Anyone can view your profile'}
                            </div>
                        </div>
                        <div
                            onClick={togglePrivacy}
                            style={{
                                width: '50px',
                                height: '28px',
                                background: isPrivate ? 'var(--danger)' : 'var(--success)',
                                borderRadius: '14px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                        >
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '3px',
                                left: isPrivate ? '25px' : '3px',
                                transition: 'left 0.3s'
                            }}></div>
                        </div>
                    </div>
                    <button
                        onClick={() => setActiveView('profile')}
                        className="btn-secondary"
                        style={{ marginTop: '20px', width: '100%', padding: '10px' }}
                    >
                        <i className="fa-solid fa-arrow-left"></i> Back to Profile
                    </button>
                </section>

                <section className="glass-panel">
                    <h3>Transaction Settings</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <div>
                            <div style={{ fontWeight: '600', marginBottom: '5px' }}>Transaction Templates</div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-fill transaction details based on title history</div>
                        </div>
                        <div
                            onClick={toggleTemplates}
                            style={{
                                width: '50px',
                                height: '28px',
                                background: useTransactionTemplates ? 'var(--success)' : 'rgba(255,255,255,0.1)',
                                borderRadius: '14px',
                                position: 'relative',
                                cursor: 'pointer',
                                transition: 'background 0.3s'
                            }}
                        >
                            <div style={{
                                width: '22px',
                                height: '22px',
                                background: 'white',
                                borderRadius: '50%',
                                position: 'absolute',
                                top: '3px',
                                left: useTransactionTemplates ? '25px' : '3px',
                                transition: 'left 0.3s'
                            }}></div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SettingsPage;
