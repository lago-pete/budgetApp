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
            await fetchUser();
        } catch (err) {
            console.error(err);
            alert('Failed to update account status');
        } finally {
            setLoading(false);
        }
    };

    if (!user) return <div className="view active-view slide-in">Loading...</div>;

    const isPremium = user.isPremium;

    return (
        <div className="view active-view slide-in">
            <section className="glass-panel settings-panel">
                <div className="settings-header">
                    <div>
                        <span className="eyebrow">Account Settings</span>
                        <h3>Manage Subscription</h3>
                        <p>Choose between the private Basic experience and the full Premium social features.</p>
                    </div>
                    <button type="button" className="btn-secondary" onClick={() => setActiveView('profile')}>
                        <i className="fa-solid fa-arrow-left"></i> Back to Profile
                    </button>
                </div>

                <div className="plan-card-grid">
                    <article className={`plan-card ${isPremium ? 'plan-card-active' : ''}`}>
                        <div className="plan-card-badge">
                            <i className="fa-solid fa-crown"></i>
                        </div>
                        <h4>Premium</h4>
                        <p>Social Hub, challenge participation, and the complete community-facing WealthFlow experience.</p>
                    </article>

                    <article className={`plan-card ${!isPremium ? 'plan-card-active' : ''}`}>
                        <div className="plan-card-badge">
                            <i className="fa-solid fa-user-shield"></i>
                        </div>
                        <h4>Basic</h4>
                        <p>Core budgeting tools only, with premium social features hidden for a more private setup.</p>
                    </article>
                </div>

                <div className="subscription-summary">
                    <div>
                        <span className="summary-label">Current plan</span>
                        <h4>{isPremium ? 'Premium' : 'Basic'}</h4>
                        <p>
                            {isPremium
                                ? 'Your account can access challenge participation and premium-only views.'
                                : 'Your account is limited to the budgeting workflow until you upgrade.'}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={handleToggleStatus}
                        className={isPremium ? 'btn-secondary danger-ghost' : 'btn-primary'}
                        disabled={loading}
                    >
                        {loading ? 'Processing...' : (isPremium ? 'Downgrade to Basic' : 'Upgrade to Premium')}
                    </button>
                </div>
            </section>
        </div>
    );
}

export default SettingsPage;
