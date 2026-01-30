import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, CartesianGrid } from 'recharts';

function CategoriesPage({ onEditTransaction }) {
    const [categories, setCategories] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [viewType, setViewType] = useState('expense');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        try {
            const [catRes, txRes] = await Promise.all([
                axios.get('http://localhost:5000/api/categories'),
                axios.get('http://localhost:5000/api/transactions')
            ]);
            setCategories(catRes.data);
            setAllTransactions(txRes.data);
        } catch (err) { console.error(err); }
    };

    const months = [];
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        months.push(d.toISOString().substring(0, 7));
    }

    const histogramMap = {};
    months.forEach(m => {
        histogramMap[m] = { month: m };
        categories.filter(c => c.type === viewType).forEach(c => {
            histogramMap[m][c.name] = 0;
        });
    });

    allTransactions.filter(t => t.type === viewType).forEach(t => {
        const m = t.date.substring(0, 7);
        if (histogramMap[m]) {
            if (!histogramMap[m][t.category]) histogramMap[m][t.category] = 0;
            histogramMap[m][t.category] += t.amount;
        }
    });

    const histogramData = Object.values(histogramMap).sort((a, b) => a.month.localeCompare(b.month));

    const filteredTransactions = allTransactions.filter(t => {
        if (t.type !== viewType) return false;
        if (selectedMonth) {
            const tDate = t.date.substring(0, 7);
            if (tDate !== selectedMonth) return false;
        }
        return true;
    });

    const displayTransactions = selectedCategory
        ? filteredTransactions.filter(t => t.category === selectedCategory.name || t.category === selectedCategory._id)
        : filteredTransactions;

    const pieData = categories
        .filter(c => c.type === viewType)
        .map(cat => {
            const total = filteredTransactions
                .filter(t => t.category === cat.name || t.category === cat._id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { name: cat.name, value: total, color: cat.color };
        })
        .filter(d => d.value > 0);

    const totalAmount = pieData.reduce((sum, d) => sum + d.value, 0);
    const activeCategories = categories.filter(c => c.type === viewType);

    return (
        <div className="view active-view slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

            {/* ROW 1: Toggle (Centered) */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="toggle-switch" style={{ width: '250px' }}>
                    <input
                        type="radio" id="view-expense" name="viewType" value="expense"
                        checked={viewType === 'expense'} onChange={() => { setViewType('expense'); setSelectedCategory(null); }}
                    />
                    <label htmlFor="view-expense">Expenses</label>

                    <input
                        type="radio" id="view-income" name="viewType" value="income"
                        checked={viewType === 'income'} onChange={() => { setViewType('income'); setSelectedCategory(null); }}
                    />
                    <label htmlFor="view-income">Income</label>
                </div>
            </div>

            {/* ROW 2: Histogram (Full Width) */}
            <section className="glass-panel" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        12-Month History {selectedMonth ? `(Filtering by ${selectedMonth})` : ''}
                    </h4>
                    {selectedMonth && <button onClick={() => setSelectedMonth('')} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '5px 10px', borderRadius: '5px', cursor: 'pointer' }}>Clear Filter</button>}
                </div>

                <div style={{ height: '180px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={histogramData} onClick={(data) => {
                            if (data && data.activePayload) {
                                const clickedMonth = data.activePayload[0].payload.month;
                                setSelectedMonth(clickedMonth === selectedMonth ? '' : clickedMonth);
                            }
                        }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: '0.7rem' }} tickFormatter={v => v.substring(5)} />
                            <Tooltip contentStyle={{ background: '#1e1e24', border: '1px solid #333' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                            {activeCategories.map(cat => (
                                <Bar key={cat._id} dataKey={cat.name} stackId="a" fill={cat.color} />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* ROW 3: Pie Chart (Middle) + Legend (Right) */}
            <section className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                <div style={{ width: '100%', maxWidth: '600px', height: '280px', position: 'relative', display: 'flex', alignItems: 'center' }}>
                    {pieData.length > 0 ? (
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%" cy="50%"
                                    innerRadius={70} outerRadius={100}
                                    paddingAngle={2}
                                    dataKey="value"
                                    onClick={(data) => {
                                        const cat = categories.find(c => c.name === data.name);
                                        setSelectedCategory(cat);
                                    }}
                                    cursor="pointer"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px' }} itemStyle={{ color: 'white' }} />
                                <Legend
                                    layout="vertical"
                                    verticalAlign="middle"
                                    align="right"
                                    contentStyle={{ fontSize: '0.9rem' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div style={{ width: '100%', textAlign: 'center', color: 'var(--text-muted)' }}>No Data for this period</div>
                    )}

                    {/* Total in Center Overlay */}
                    {pieData.length > 0 && (
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${totalAmount.toFixed(2)}</div>
                        </div>
                    )}
                </div>
            </section>

            {/* ROW 4: All Activity (Full Width Horizontal) */}
            <section className="glass-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3>
                        {selectedCategory ? `${selectedCategory.name} Activity` : 'All Activity'}
                    </h3>
                    {selectedCategory && <button onClick={() => setSelectedCategory(null)} className="btn-secondary" style={{ padding: '5px 10px' }}>Show All</button>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '0 10px 10px', color: 'var(--text-muted)', fontSize: '0.85rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <span>Description</span>
                    <span>Date</span>
                    <span>Category</span>
                    <span style={{ textAlign: 'right' }}>Amount</span>
                </div>

                <ul className="transaction-list horizontal-style" style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {displayTransactions.map(t => (
                        <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px' }}>
                            <div className="t-main" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {t.proofUrl ? (
                                    <div className="t-icon small" style={{ width: '30px', height: '30px', backgroundImage: `url(http://localhost:5000${t.proofUrl})`, backgroundSize: 'cover' }}></div>
                                ) : (
                                    <div className="t-icon small" style={{ width: '30px', height: '30px', fontSize: '0.8rem' }}><i className="fa-solid fa-receipt"></i></div>
                                )}
                                <div className="t-desc">
                                    <h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t.title}</h4>
                                </div>
                            </div>

                            <div className="t-date" style={{ fontSize: '0.9rem' }}>{new Date(t.date).toLocaleDateString()}</div>
                            <div className="t-cat"><span className="cat-pill" style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t.category}</span></div>

                            <div className={`t-amount ${t.type}`} style={{ textAlign: 'right' }}>
                                {t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}
                            </div>
                        </li>
                    ))}
                    {displayTransactions.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No transactions found.</div>}
                </ul>
            </section>
        </div>
    );
}

export default CategoriesPage;
