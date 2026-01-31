import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function SettingsPage({ setActiveView }) {
    const { user, fetchUser } = useContext(AuthContext);
    const [isPrivate, setIsPrivate] = useState(false);
    const [useTransactionTemplates, setUseTransactionTemplates] = useState(true);
    const [verifyToDelete, setVerifyToDelete] = useState(true);
    const [hasChanges, setHasChanges] = useState(false);

    // Initial State to revert to
    const [initialState, setInitialState] = useState({ isPrivate: false, useTransactionTemplates: true, verifyToDelete: true });

    useEffect(() => {
        if (user) {
            setIsPrivate(user.isPrivate);
            setUseTransactionTemplates(user.useTransactionTemplates);
            setVerifyToDelete(user.verifyToDelete !== undefined ? user.verifyToDelete : true);
            setInitialState({
                isPrivate: user.isPrivate,
                useTransactionTemplates: user.useTransactionTemplates,
                verifyToDelete: user.verifyToDelete !== undefined ? user.verifyToDelete : true
            });
        }
    }, [user]);

    // Check for changes
    useEffect(() => {
        const changed = isPrivate !== initialState.isPrivate ||
            useTransactionTemplates !== initialState.useTransactionTemplates ||
            verifyToDelete !== initialState.verifyToDelete;
        setHasChanges(changed);
    }, [isPrivate, useTransactionTemplates, verifyToDelete, initialState]);

    const handleSave = async () => {
        try {
            if (isPrivate !== initialState.isPrivate) {
                await axios.put('/api/users/privacy');
            }
            if (useTransactionTemplates !== initialState.useTransactionTemplates) {
                await axios.put('/api/users/templates');
            }
            if (verifyToDelete !== initialState.verifyToDelete) {
                await axios.put('/api/users/settings', { verifyToDelete });
            }

            // Update initial state after save
            await fetchUser();
            setInitialState({ isPrivate, useTransactionTemplates, verifyToDelete });
            setHasChanges(false);
        } catch (err) {
            console.error(err);
            alert("Failed to save settings");
        }
    };

    const handleCancel = () => {
        setIsPrivate(initialState.isPrivate);
        setUseTransactionTemplates(initialState.useTransactionTemplates);
        setVerifyToDelete(initialState.verifyToDelete);
    };

    if (!user) return <div className="view active-view slide-in">Loading...</div>;

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>Application Settings</h3>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {hasChanges && (
                                <>
                                    <button onClick={handleCancel} className="btn-secondary" style={{ padding: '8px 20px', cursor: 'pointer' }}>Cancel</button>
                                    <button onClick={handleSave} className="btn-primary" style={{ cursor: 'pointer' }}>Save Changes</button>
                                </>
                            )}
                        </div>
                    </div>

                    <div style={{ padding: '0 10px' }}>
                        <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginTop: '0' }}>Privacy</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '5px' }}>Profile Visibility</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                    {isPrivate ? 'Only friends can view your profile' : 'Anyone can view your profile'}
                                </div>
                            </div>
                            <div
                                onClick={() => setIsPrivate(!isPrivate)}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    background: isPrivate ? 'var(--success)' : 'rgba(255,255,255,0.1)',
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

                        <h4 style={{ color: 'var(--primary)', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', marginTop: '20px' }}>Transactions</h4>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
                            <div>
                                <div style={{ fontWeight: '600', marginBottom: '5px' }}>Transaction Templates</div>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Auto-fill transaction details based on title history</div>
                            </div>
                            <div
                                onClick={() => setUseTransactionTemplates(!useTransactionTemplates)}
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

                        {/* Verify to Delete Toggle */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 0' }}>
                            <div>
                                <h4 style={{ margin: '0 0 5px 0' }}>Verify Deletion</h4>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                    Show a confirmation popup when deleting items
                                </p>
                            </div>
                            <div
                                onClick={() => setVerifyToDelete(!verifyToDelete)}
                                style={{
                                    width: '50px',
                                    height: '28px',
                                    background: verifyToDelete ? 'var(--success)' : 'rgba(255,255,255,0.1)',
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
                                    left: verifyToDelete ? '25px' : '3px',
                                    transition: 'left 0.3s'
                                }}></div>
                            </div>
                        </div>

                    </div>

                    <div style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-arrow-left" style={{ cursor: 'pointer' }} onClick={() => setActiveView('profile')}></i>
                            Settings
                        </h2>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default SettingsPage;
