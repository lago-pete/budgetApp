import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Challenges() {
    const [activeChallenges, setActiveChallenges] = useState([]);
    const [exploreChallenges, setExploreChallenges] = useState([]);

    useEffect(() => {
        axios.get('/api/challenges')
            .then(res => {
                const all = res.data;
                // Split into active/explore mock logic
                // In real app, check user.challenges array
                setActiveChallenges(all.filter(c => c.isActive).slice(0, 3));
                setExploreChallenges(all);
            })
            .catch(err => console.error(err));
    }, []);

    const joinChallenge = (id) => {
        alert("Joined challenge! (Mock action)");
        // Ideally API call to add to user
    };

    return (
        <div className="view active-view slide-in">
            <h3 style={{ marginBottom: '1rem' }}>Active Challenges</h3>
            <div className="challenges-grid">
                {activeChallenges.map(c => (
                    <div key={c._id} className="challenge-card glass-panel" style={{ borderLeft: '4px solid var(--accent-primary)' }}>
                        <div className="c-header">
                            <i className="fa-solid fa-fire c-icon"></i>
                            <h4>{c.title}</h4>
                        </div>
                        <p>{c.description}</p>
                        <div className="progress-bar">
                            <div className="fill" style={{ width: '45%' }}></div>
                        </div>
                        <span className="small-text">45% Complete</span>
                    </div>
                ))}
            </div>

            <h3 style={{ margin: '2rem 0 1rem' }}>Explore Challenges</h3>
            <div className="challenges-grid">
                {exploreChallenges.map(c => (
                    <div key={c._id} className="challenge-card glass-panel">
                        <div className="c-header">
                            <i className="fa-solid fa-trophy c-icon" style={{ color: 'var(--accent-secondary)' }}></i>
                            <h4>{c.title}</h4>
                        </div>
                        <p>{c.description}</p>
                        <div className="c-footer">
                            <span><i className="fa-solid fa-users"></i> {c.participantsCount}</span>
                            <span className="reward">{c.reward}</span>
                        </div>
                        <button className="btn-primary full-width" style={{ marginTop: '1rem' }} onClick={() => joinChallenge(c._id)}>Join Challenge</button>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default Challenges;
