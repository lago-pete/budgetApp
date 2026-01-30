import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

function CategoriesPage({ onEditTransaction }) {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [allTransactions, setAllTransactions] = useState([]); // All data for Histogram
    const [viewType, setViewType] = useState('expense');

    // Date Filtering (applied to Pie/List)
    const [selectedMonth, setSelectedMonth] = useState(''); // Format: 'YYYY-MM'

    // Drill Down State
    const [selectedCategory, setSelectedCategory] = useState(null);

    useEffect(() => { refreshData(); }, []);

    const refreshData = async () => {
        try {
            const [catRes, txRes] = await Promise.all([
                axios.get('http://localhost:5000/api/categories'),
                axios.get('http://localhost:5000/api/transactions') // Get ALL for client-side filtering
            ]);
            setCategories(catRes.data);
            setAllTransactions(txRes.data);
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
            refreshData();
        } catch (err) { alert(err.response?.data?.msg || "Delete failed"); }
    };

    // --- Filtering Logic ---
    const filteredTransactions = allTransactions.filter(t => {
        // 1. Type Match
        if (t.type !== viewType) return false;
        // 2. Month Match
        if (selectedMonth) {
            const tDate = t.date.substring(0, 7); // YYYY-MM
            if (tDate !== selectedMonth) return false;
        }
        return true;
    });

    // --- Pie Chart Data ---
    const pieData = categories
        .filter(c => c.type === viewType)
        .map(cat => {
            const total = filteredTransactions
                .filter(t => t.category === cat.name || t.category === cat._id)
                .reduce((sum, t) => sum + t.amount, 0);
            return { name: cat.name, value: total, color: cat.color, _id: cat._id };
        })
        .filter(d => d.value > 0);

    const totalAmount = pieData.reduce((sum, d) => sum + d.value, 0);

    // --- Histogram Data (Spending by Month) ---
    // Aggregate allTransactions by Year-Month for the current ViewType
    const histogramDataMap = {};
    allTransactions.filter(t => t.type === viewType).forEach(t => {
        const month = t.date.substring(0, 7); // YYYY-MM
        if (!histogramDataMap[month]) histogramDataMap[month] = { month, amount: 0 };
        histogramDataMap[month].amount += t.amount;
    });
    // Convert to array and sort
    const histogramData = Object.values(histogramDataMap).sort((a, b) => a.month.localeCompare(b.month));


    // --- Drill down data ---
    const categoryTransactions = selectedCategory
        ? filteredTransactions.filter(t => t.category === selectedCategory.name || t.category === selectedCategory._id)
        : [];

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Center Toggle Switch */}
                    <div style={{ alignSelf: 'center' }}>
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

                    {/* Histogram */}
                    <div style={{ height: '150px', width: '100%' }}>
                        <h4 style={{ marginBottom: '10px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Monthly {viewType === 'expense' ? 'Spending' : 'Income'} (Click to Filter)</h4>
                        <ResponsiveContainer>
                            <BarChart data={histogramData} onClick={(data) => {
                                if (data && data.activePayload) {
                                    const clickedMonth = data.activePayload[0].payload.month;
                                    setSelectedMonth(clickedMonth === selectedMonth ? '' : clickedMonth); // Toggle
                                }
                            }}>
                                <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                                <XAxis dataKey="month" tick={{ fill: 'white', fontSize: '0.7rem' }} tickFormatter={v => v.substring(5)} />{/* Show MM */}
                                <Tooltip contentStyle={{ background: '#1e1e24', border: '1px solid #333' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />
                                <Bar dataKey="amount" fill={viewType == 'expense' ? '#ff6b6b' : '#1dd1a1'} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                        {selectedMonth && <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--accent-primary)', marginTop: '5px' }}>Showing: {selectedMonth} <button onClick={() => setSelectedMonth('')} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>x Clear</button></div>}
                    </div>

                    {/* Pie Chart */}
                    <div style={{ height: '300px', width: '100%', position: 'relative' }}>
                        {pieData.length > 0 ? (
                            <>
                                {/* Centered Total */}
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 10 }}>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total</div>
                                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>${totalAmount.toFixed(2)}</div>
                                </div>

                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie
                                            data={pieData}
                                            cx="50%" cy="50%"
                                            innerRadius={80} outerRadius={110}
                                            paddingAngle={3}
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
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </>
                        ) : (
                            <div style={{ display: 'flex', height: '100%', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                                No data for {viewType} in {selectedMonth || 'period'}.
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
                                    <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
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
                            <ul className="leaderboard-list" style={{ maxHeight: '350px', overflowY: 'auto', marginBottom: '1rem' }}>
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
