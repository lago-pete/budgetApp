import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [transactions, setTransactions] = useState([]);
    const [viewType, setViewType] = useState('expense');

    // Date Filtering
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    // Drill Down State
    const [selectedCategory, setSelectedCategory] = useState(null); // Category Object

    useEffect(() => { refreshData(); }, [startDate, endDate]);

    const refreshData = async () => {
        try {
            let txUrl = 'http://localhost:5000/api/transactions';
            const params = [];
            if (startDate) params.push(`startDate=${startDate}`);
            if (endDate) params.push(`endDate=${endDate}`);
            if (params.length) txUrl += '?' + params.join('&');

            const [catRes, txRes] = await Promise.all([
                axios.get('http://localhost:5000/api/categories'),
                axios.get(txUrl)
            ]);
            setCategories(catRes.data);
            setTransactions(txRes.data);
        } catch (err) { console.error(err); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/categories', {
                name: newCatName,
                type: viewType,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16)
            });
            setCategories([...categories, res.data]);
            setNewCatName('');
        } catch (err) { console.error(err); }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm("Delete this category? Transactions will move to 'Other'.")) return;
        try {
            await axios.delete(`http://localhost:5000/api/categories/${id}`);
            refreshData(); // Need to refresh to see moved transactions
        } catch (err) { alert(err.response?.data?.msg || "Delete failed"); }
    };

    // Filter Categories by Type (Income vs Expense)
    // And Calculate Totals based on transactions of the SAME type
    const chartData = categories
        .filter(c => c.type === viewType)
        .map(cat => {
            const total = transactions
                .filter(t => t.type === viewType)
                .filter(t => t.category === cat.name || t.category === cat._id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { name: cat.name, value: total, color: cat.color, _id: cat._id };
        })
        .filter(d => d.value > 0);

    // Drill down data
    const categoryTransactions = selectedCategory
        ? transactions.filter(t => (t.category === selectedCategory.name || t.category === selectedCategory._id) && t.type === viewType)
        : [];

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel" style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>

                    {/* Center Toggle Switch */}
                    <div style={{ alignSelf: 'center', marginBottom: '1rem' }}>
                        <div className="toggle-switch">
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

                    {/* Date Filter */}
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginBottom: '1.5rem', fontSize: '0.9rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ color: 'var(--text-muted)' }}>From</label>
                            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '5px', borderRadius: '5px' }} />
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <label style={{ color: 'var(--text-muted)' }}>To</label>
                            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '5px', borderRadius: '5px' }} />
                        </div>
                    </div>

                    <div style={{ height: '300px', width: '100%' }}>
                        {chartData.length > 0 ? (
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%" cy="50%"
                                        innerRadius={70} outerRadius={100}
                                        paddingAngle={3}
                                        dataKey="value"
                                        onClick={(data) => {
                                            const cat = categories.find(c => c.name === data.name);
                                            setSelectedCategory(cat);
                                        }}
                                        cursor="pointer"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px' }} itemStyle={{ color: 'white' }} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                No data for {viewType} in specific range.
                            </div>
                        )}
                    </div>
                </section>

                <section className="glass-panel">
                    {selectedCategory ? (
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3>{selectedCategory.name} History</h3>
                                <button onClick={() => setSelectedCategory(null)} className="btn-secondary" style={{ padding: '5px 10px' }}>Back</button>
                            </div>
                            <ul className="transaction-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                {categoryTransactions.map(t => (
                                    <li key={t._id} className="transaction-item">
                                        <div className="t-info">
                                            <div className="t-details">
                                                <h4>{t.title}</h4>
                                                <span>{new Date(t.date).toLocaleDateString()}</span>
                                                {t.notes && <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>"{t.notes}"</div>}
                                            </div>
                                        </div>
                                        <div className={`t-amount ${t.type}`}>${t.amount.toFixed(2)}</div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <>
                            <h3>Manage Categories</h3>
                            <ul className="leaderboard-list" style={{ maxHeight: '250px', overflowY: 'auto', marginBottom: '1rem' }}>
                                {categories.filter(c => c.type === viewType).map(c => (
                                    <li key={c._id} className="leaderboard-item">
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: c.color }}></div>
                                            <span>{c.name}</span>
                                        </div>
                                        {!c.isDefault && (
                                            <button onClick={() => handleDeleteCategory(c._id)} style={{ color: 'var(--danger)', background: 'none', border: 'none', cursor: 'pointer' }}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
                                        )}
                                    </li>
                                ))}
                            </ul>
                            <form onSubmit={handleAddCategory} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                <div className="form-group">
                                    <input placeholder="New Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                                </div>
                                <button className="btn-primary full-width" type="submit">Add {viewType === 'expense' ? 'Expense' : 'Income'} Category</button>
                            </form>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
}

export default CategoriesPage;
