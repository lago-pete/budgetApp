import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ onEditTransaction }) {
    const [transactions, setTransactions] = useState([]);
    const [limit, setLimit] = useState(5); // Initial limit

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

            {/* Full Width Activity Feed */}
            <section className="recent-transactions glass-panel" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-receipt"></i> Recent Activity</h3>
                    <button onClick={() => setLimit(prev => prev + 10)} className="btn-secondary" style={{ fontSize: '0.8rem', padding: '5px 10px' }}>Load More</button>
                </div>

                <div className="transaction-table-header">
                    <span>Description</span>
                    <span>Date</span>
                    <span>Category</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                </div>

                <ul className="transaction-list horizontal-style">
                    {transactions.slice(0, limit).map(t => (
                        <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer' }}>
                            <div className="t-main">
                                {/* Icon */}
                                {t.proofUrl ? (
                                    <div className="t-icon small" style={{ backgroundImage: `url(http://localhost:5000${t.proofUrl})`, backgroundSize: 'cover' }}></div>
                                ) : (
                                    <div className="t-icon small"><i className="fa-solid fa-receipt"></i></div>
                                )}
                                <div className="t-desc">
                                    <h4>{t.title}</h4>
                                    {t.notes && <span className="t-notes">"{t.notes}"</span>}
                                </div>
                            </div>

                            <div className="t-date">{new Date(t.date).toLocaleDateString()}</div>
                            <div className="t-cat"><span className="cat-pill">{t.category}</span></div>

                            <div className={`t-amount ${t.type}`} style={{ textAlign: 'right' }}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                            </div>
                        </li>
                    ))}
                </ul>

                {transactions.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions yet. Add one!</div>}
            </section>

            {/* CSS for grid table layout */}
            <style>{`
        .transaction-table-header {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            padding: 0 15px 10px;
            color: var(--text-muted);
            font-size: 0.85rem;
            border-bottom: 1px solid rgba(255,255,255,0.1);
            margin-bottom: 10px;
        }
        .transaction-item.compact {
            display: grid;
            grid-template-columns: 2fr 1fr 1fr 1fr;
            align-items: center;
            padding: 10px 15px;
        }
        .transaction-item.compact:hover {
            background: rgba(255,255,255,0.05);
        }
        .t-main {
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .t-icon.small {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
        }
        .t-desc h4 {
            margin: 0;
            font-size: 0.95rem;
        }
        .t-notes {
            font-size: 0.8rem;
            color: var(--text-muted);
            font-style: italic;
        }
        .cat-pill {
            background: rgba(255,255,255,0.1);
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
        }
      `}</style>
        </div>
    );
}

export default Dashboard;
