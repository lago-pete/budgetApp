import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

function Sidebar({ activeView, setActiveView, user }) {
    const { logout } = useContext(AuthContext);

    const navItems = [
        { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
        { id: 'categories', icon: 'fa-chart-pie', label: 'Categories' },
        { id: 'social', icon: 'fa-users', label: 'Social Hub', badge: 3 },
        { id: 'challenges', icon: 'fa-trophy', label: 'Challenges' }
    ].filter(item => {
        if (!user?.isPremium && (item.id === 'social' || item.id === 'challenges')) {
            return false;
        }
        return true;
    });

    return (
        <nav className="sidebar glass-panel" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
                <div className="logo" onClick={() => setActiveView('dashboard')} style={{ cursor: 'pointer' }}>
                    <div className="logo-icon"><i className="fa-solid fa-bolt"></i></div>
                    <h1>WealthFlow</h1>
                </div>

                <ul className="nav-links">
                    {navItems.map(item => (
                        <li
                            key={item.id}
                            className={activeView === item.id ? 'active' : ''}
                            onClick={() => setActiveView(item.id)}
                        >
                            <i className={`fa-solid ${item.icon}`}></i>
                            <span>{item.label}</span>
                            {item.badge && <span className="small-badge">{item.badge}</span>}
                        </li>
                    ))}
                </ul>
            </div>

            <div>
                {user && (
                    <div className="user-mini-profile" onClick={() => setActiveView('profile')} style={{ cursor: 'pointer', transition: '0.2s', marginBottom: '1rem' }}>
                        <div className="avatar-circle">
                            <img src={user.avatar} alt="User" id="mini-avatar" />
                        </div>
                        <div className="user-info">
                            <span className="name">{user.name}</span>
                            <span className="level">Lvl {user.level} Saver</span>
                        </div>
                    </div>
                )}
                <button onClick={logout} className="btn-secondary full-width" style={{ marginTop: '0.5rem', background: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: 'none', borderRadius: '12px', padding: '12px', fontWeight: '600', cursor: 'pointer' }}>
                    <i className="fa-solid fa-right-from-bracket"></i> Sign Out
                </button>
            </div>
        </nav>
    );
}

export default Sidebar;
