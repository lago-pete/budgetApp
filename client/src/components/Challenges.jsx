import React from 'react';

function Challenges({ challenges }) {
    const activeChallenges = challenges.filter(c => c.isActive);
    const exploreChallenges = challenges.filter(c => !c.isActive); // Assuming !isActive implies available to explore/join for this logic or mock

    return (
        <div className="view active-view slide-in">
            <div className="challenges-grid">
                <section className="active-challenges glass-panel">
                    <h3>Your Active Challenges</h3>
                    <div className="challenge-cards">
                        {activeChallenges.map(c => (
                            <div key={c._id || c.title} className="badge-item" style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: '10px' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600' }}>{c.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.participantsCount} Participants</div>
                                </div>
                                <div style={{ background: 'var(--primary)', padding: '5px 10px', borderRadius: '8px', fontSize: '0.8rem' }}>Active</div>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="explore-challenges glass-panel">
                    <h3>Explore Challenges</h3>
                    <div className="challenge-cards">
                        {exploreChallenges.length === 0 ? (
                            <div style={{ color: 'var(--text-muted)' }}>No new challenges available.</div>
                        ) : exploreChallenges.map(c => (
                            <div key={c._id || c.title} className="badge-item" style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginBottom: '10px', opacity: '0.7' }}>
                                <div style={{ textAlign: 'left' }}>
                                    <div style={{ fontWeight: '600' }}>{c.title}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.participantsCount} Participants</div>
                                </div>
                                <button style={{ background: 'transparent', border: '1px solid var(--primary)', color: 'var(--primary)', padding: '5px 10px', borderRadius: '8px', cursor: 'pointer' }}>Join</button>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Challenges;
