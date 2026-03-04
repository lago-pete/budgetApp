import React, { useContext, useState } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function SettingsPage({ setActiveView }) {
    const { user, fetchUser } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);

    const handleToggleStatus = async () => {
        setLoading(true);
        try {
            await axios.put('/api/users/status');
            await fetchUser(); // Refresh user state
        } catch (err) {
            console.error(err);
            alert("Failed to update account status");
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="view active-view slide-in">Loading...</div>;

    const isPremium = user.isPremium;

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Manage Account Status</h3>
                    </div>

                    <div style={{ padding: '0 10px' }}>
                        <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginTop: '20px' }}>Subscription</h4>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '5px' }}>Current Plan: {isPremium ? 'Premium' : 'Basic'}</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {isPremium
                                        ? "You currently have access to all premium features."
                                        : "Upgrade to premium to unlock exclusive features and analytics."}
                                </div>
                            </div>
                            <button
                                onClick={handleToggleStatus}
                                className={isPremium ? "btn-secondary" : "btn-primary"}
                                disabled={loading}
                                style={{ padding: '10px 20px', cursor: loading ? 'not-allowed' : 'pointer' }}
                            >
                                {loading ? 'Processing...' : (isPremium ? 'Downgrade to Basic' : 'Upgrade to Premium')}
                            </button>
                        </div>
                    </div>

                    <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '20px' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-arrow-left" style={{ cursor: 'pointer' }} onClick={() => setActiveView('profile')}></i>
                            Back to Profile
                        </h2>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SettingsPage;
