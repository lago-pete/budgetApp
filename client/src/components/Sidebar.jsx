import React from 'react';

function Sidebar({ activeView, setActiveView, user }) {
    const navItems = [
        { id: 'dashboard', icon: 'fa-house', label: 'Dashboard' },
        { id: 'categories', icon: 'fa-chart-pie', label: 'Categories' }, // New
        { id: 'social', icon: 'fa-users', label: 'Social Hub', badge: 3 },
        { id: 'challenges', icon: 'fa-trophy', label: 'Challenges' }
        // Profile removed from main list
    ];

    return (
        <nav className="sidebar glass-panel">
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

            {user && (
                <div className="user-mini-profile" onClick={() => setActiveView('profile')} style={{ cursor: 'pointer', transition: '0.2s', '&:hover': { background: 'rgba(255,255,255,0.05)' } }}>
                    <div className="avatar-circle">
                        <img src={user.avatar} alt="User" id="mini-avatar" />
                    </div>
                    <div className="user-info">
                        <span className="name">{user.name}</span>
                        <span className="level">Lvl {user.level} Saver</span>
                    </div>
                </div>
            )}
        </nav>
    );
}

export default Sidebar;
