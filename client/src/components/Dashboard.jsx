import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard() {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await axios.get('http://localhost:5000/api/transactions');
                setTransactions(res.data);
            } catch (err) { console.error(err); }
        }
        fetchData();
    }, []);

    const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0);

    const leftToBudget = income - expenses;
    const percentage = income > 0 ? Math.max(0, (leftToBudget / income) * 100) : 0;

    let ringColor = 'var(--accent-primary)';
    if (leftToBudget < 0) ringColor = 'var(--danger)';
    else if (percentage < 20) ringColor = 'var(--accent-secondary)';

    return (
        <div className="view active-view slide-in">
            <section className="budget-hero glass-panel">
                <div className="budget-ring-container">
                    <div className="budget-ring" style={{ '--p': percentage, '--c': ringColor }}>
                        <div className="ring-content">
                            <span className="label">Left to Budget</span>
                            <span className="amount">${leftToBudget.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                <div className="budget-stats">
                    <div className="stat-item">
                        <span className="label">Total Income</span>
                        <span className="value income">${income.toFixed(2)}</span>
                    </div>
                    <div className="stat-item">
                        <span className="label">Total Expenses</span>
                        <span className="value expense">${expenses.toFixed(2)}</span>
                    </div>
                </div>
            </section>

            <div className="dashboard-grid">
                <section className="recent-transactions glass-panel">
                    <h3><i className="fa-solid fa-receipt"></i> Recent Activity</h3>
                    <ul className="transaction-list">
                        {transactions.map(t => (
                            <li key={t._id} className="transaction-item">
                                <div className="t-info">
                                    {/* Show Image if proofUrl exists */}
                                    {t.proofUrl ? (
                                        <div className="t-icon" style={{ backgroundImage: `url(http://localhost:5000${t.proofUrl})`, backgroundSize: 'cover' }}></div>
                                    ) : (
                                        <div className="t-icon"><i className="fa-solid fa-receipt"></i></div>
                                    )}
                                    <div className="t-details">
                                        <h4>{t.title}</h4>
                                        <span>{new Date(t.date).toLocaleDateString()} • {t.category}</span>
                                    </div>
                                </div>
                                <div className={`t-amount ${t.type}`}>
                                    {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                                </div>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="goals-preview glass-panel">
                    <h3><i className="fa-solid fa-bullseye"></i> Active Goals</h3>
                    <div className="goals-list">
                        <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            <i className="fa-solid fa-lock"></i> Goals Feature (Coming Soon)
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}

export default Dashboard;
