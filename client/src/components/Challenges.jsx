import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

function Challenges() {
    const { fetchUser } = useContext(AuthContext);
    const [challenges, setChallenges] = useState([]);
    const [progressDrafts, setProgressDrafts] = useState({});
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState('');
    const [error, setError] = useState('');

    const loadChallenges = async () => {
        try {
            setLoading(true);
            const res = await axios.get('/api/challenges');
            setChallenges(res.data);
            setProgressDrafts(
                res.data.reduce((acc, challenge) => {
                    if (challenge.participation) {
                        acc[challenge._id] = challenge.participation.progressPercent;
                    }
                    return acc;
                }, {})
            );
            setError('');
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to load challenges');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadChallenges();
    }, []);

    const joinChallenge = async (id) => {
        try {
            setBusyId(id);
            await axios.post(`/api/challenges/${id}/join`);
            await loadChallenges();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to join challenge');
        } finally {
            setBusyId('');
        }
    };

    const leaveChallenge = async (id) => {
        try {
            setBusyId(id);
            await axios.delete(`/api/challenges/${id}/join`);
            await loadChallenges();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to leave challenge');
        } finally {
            setBusyId('');
        }
    };

    const saveProgress = async (id) => {
        try {
            setBusyId(id);
            const res = await axios.put(`/api/challenges/${id}/progress`, {
                progressPercent: progressDrafts[id] ?? 0
            });
            if (res.data?.participation?.status === 'completed') {
                await fetchUser();
            }
            await loadChallenges();
        } catch (err) {
            setError(err.response?.data?.msg || 'Failed to update progress');
        } finally {
            setBusyId('');
        }
    };

    const joinedChallenges = challenges.filter(challenge => challenge.participation?.status === 'joined');
    const exploreChallenges = challenges.filter(challenge => !challenge.participation);

    if (loading) {
        return (
            <div className="view active-view slide-in">
                <div className="glass-panel empty-state">Loading challenges...</div>
            </div>
        );
    }

    return (
        <div className="view active-view slide-in">
            {error && <div className="alert-danger" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="section-heading">
                <div>
                    <h3>Active Challenges</h3>
                    <p>Track joined challenges and save manual progress updates.</p>
                </div>
            </div>

            {joinedChallenges.length === 0 ? (
                <div className="glass-panel empty-state">
                    <i className="fa-solid fa-trophy"></i>
                    <h4>No active challenges yet</h4>
                    <p>Join one from the catalog below to start tracking progress.</p>
                </div>
            ) : (
                <div className="challenges-grid">
                    {joinedChallenges.map(challenge => {
                        const progress = progressDrafts[challenge._id] ?? challenge.participation.progressPercent ?? 0;
                        const isComplete = challenge.participation?.status === 'completed';

                        return (
                            <div key={challenge._id} className="challenge-card glass-panel challenge-card-active">
                                <div className="c-header">
                                    <div className="challenge-icon challenge-icon-active">
                                        <i className={`fa-solid ${isComplete ? 'fa-circle-check' : 'fa-fire'}`}></i>
                                    </div>
                                    <div>
                                        <h4>{challenge.title}</h4>
                                        <span className="challenge-meta">
                                            {isComplete ? 'Completed' : 'Joined'} • {challenge.reward} XP
                                        </span>
                                    </div>
                                </div>

                                <p>{challenge.description}</p>

                                <div className="challenge-stats">
                                    <span><i className="fa-solid fa-users"></i> {challenge.participantsCount} participants</span>
                                    <span>{progress}% complete</span>
                                </div>

                                <div className="progress-bar">
                                    <div className="progress-fill" style={{ width: `${progress}%` }}></div>
                                </div>

                                <div className="challenge-progress-editor">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        step="5"
                                        value={progress}
                                        onChange={(e) => setProgressDrafts(prev => ({
                                            ...prev,
                                            [challenge._id]: Number(e.target.value)
                                        }))}
                                    />
                                    <div className="challenge-actions">
                                        <button
                                            type="button"
                                            className="btn-secondary"
                                            disabled={busyId === challenge._id}
                                            onClick={() => leaveChallenge(challenge._id)}
                                        >
                                            Leave
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-primary"
                                            disabled={busyId === challenge._id}
                                            onClick={() => saveProgress(challenge._id)}
                                        >
                                            {busyId === challenge._id ? 'Saving...' : 'Save Progress'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="section-heading section-heading-spaced">
                <div>
                    <h3>Explore Challenges</h3>
                    <p>Join any active challenge from the current catalog.</p>
                </div>
            </div>

            {exploreChallenges.length === 0 ? (
                <div className="glass-panel empty-state">
                    <i className="fa-solid fa-star"></i>
                    <h4>You have joined every available challenge</h4>
                    <p>Check back later for new admin-created challenges.</p>
                </div>
            ) : (
                <div className="challenges-grid">
                    {exploreChallenges.map(challenge => (
                        <div key={challenge._id} className="challenge-card glass-panel">
                            <div className="c-header">
                                <div className="challenge-icon">
                                    <i className="fa-solid fa-trophy"></i>
                                </div>
                                <div>
                                    <h4>{challenge.title}</h4>
                                    <span className="challenge-meta">
                                        {challenge.isActive ? 'Open now' : 'Inactive'} • {challenge.reward} XP
                                    </span>
                                </div>
                            </div>

                            <p>{challenge.description}</p>

                            <div className="c-footer">
                                <span><i className="fa-solid fa-users"></i> {challenge.participantsCount}</span>
                                <span className="reward">{challenge.reward} XP</span>
                            </div>

                            <button
                                type="button"
                                className="btn-primary full-width"
                                disabled={!challenge.isActive || busyId === challenge._id}
                                onClick={() => joinChallenge(challenge._id)}
                            >
                                {busyId === challenge._id ? 'Joining...' : (challenge.isActive ? 'Join Challenge' : 'Unavailable')}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Challenges;
