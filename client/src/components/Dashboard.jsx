import React, { useState, useEffect } from 'react';
import axios from 'axios';

function Dashboard({ onEditTransaction }) {
    const [transactions, setTransactions] = useState([]);
    const [limit, setLimit] = useState(5);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            try {
                const res = await axios.get('/api/transactions');
                setTransactions(res.data);
                setLoading(false);
            } catch (err) { console.error(err); setLoading(false); }
        }
        fetchData();
    }, []);

    // --- STATS LOGIC ---
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth(); // 0-indexed

    // YTD Logic
    const ytdTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d <= now;
    });
    const ytdIncome = ytdTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const ytdExpenses = ytdTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const ytdNet = ytdIncome - ytdExpenses;

    // Monthly Logic
    const monthlyTransactions = transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    });
    const monthlyIncome = monthlyTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpenses = monthlyTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const monthlyLeft = monthlyIncome - monthlyExpenses;
    const monthlyPercentage = monthlyIncome > 0 ? Math.max(0, (monthlyLeft / monthlyIncome) * 100) : 0;

    let ringColor = 'var(--accent-primary)';
    if (monthlyLeft < 0) ringColor = 'var(--danger)';
    else if (monthlyPercentage < 20) ringColor = 'var(--accent-secondary)';

    const visibleTransactions = transactions.slice(0, limit);

    return (
        <div className="view active-view slide-in">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>

                {/* LEFT: OVERALL (YTD) */}
                <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', padding: '2rem' }}>
                    <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '1.5rem' }}>Overall (YTD)</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div className="stat-item">
                            <span className="label">Total Net</span>
                            <span className="value" style={{ color: ytdNet >= 0 ? 'var(--success)' : 'var(--danger)' }}>${ytdNet.toFixed(2)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 'auto' }}>
                            <div className="stat-item">
                                <span className="label">Income</span>
                                <span className="value income" style={{ fontSize: '1.2rem' }}>${ytdIncome.toFixed(2)}</span>
                            </div>
                            <div className="stat-item" style={{ textAlign: 'right' }}>
                                <span className="label">Expenses</span>
                                <span className="value expense" style={{ fontSize: '1.2rem' }}>${ytdExpenses.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* RIGHT: CURRENT MONTH */}
                <section className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '2rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <h3 style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.5rem' }}>Current Month</h3>
                        <div className="stat-item">
                            <span className="label">Total Income</span>
                            <span className="value income" style={{ fontSize: '1.2rem' }}>${monthlyIncome.toFixed(2)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="label">Total Expenses</span>
                            <span className="value expense" style={{ fontSize: '1.2rem' }}>${monthlyExpenses.toFixed(2)}</span>
                        </div>
                    </div>

                    <div className="budget-ring-container">
                        <div className="budget-ring" style={{ '--p': monthlyPercentage, '--c': ringColor }}>
                            <div className="ring-content">
                                <span className="label">Left to Budget</span>
                                <span className="amount">${monthlyLeft.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </section>
            </div>

            {/* Full Width Activity Feed */}
            <section className="recent-transactions glass-panel" style={{ marginTop: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3><i className="fa-solid fa-receipt"></i> Recent Activity</h3>
                </div>

                <div className="transaction-table-header">
                    <span>Description</span>
                    <span>Date</span>
                    <span>Category</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                </div>

                <ul className="transaction-list horizontal-style">
                    {visibleTransactions.map(t => (
                        <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer' }}>
                            <div className="t-main">
                                {t.proofUrl ? (
                                    <div className="t-icon small" style={{ backgroundImage: `url(${t.proofUrl})`, backgroundSize: 'cover' }}></div>
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
