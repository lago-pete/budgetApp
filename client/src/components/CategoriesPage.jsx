import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

function CategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [newCatName, setNewCatName] = useState('');
    const [newCatType, setNewCatType] = useState('expense');
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const [catRes, txRes] = await Promise.all([
            axios.get('http://localhost:5000/api/categories'),
            axios.get('http://localhost:5000/api/transactions')
        ]);
        setCategories(catRes.data);
        setTransactions(txRes.data);
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post('http://localhost:5000/api/categories', {
                name: newCatName,
                type: newCatType,
                color: '#' + Math.floor(Math.random() * 16777215).toString(16) // Random color
            });
            setCategories([...categories, res.data]);
            setNewCatName('');
        } catch (err) {
            console.error(err);
        }
    };

    // Prepare Chart Data
    const chartData = categories
        .filter(c => c.type === 'expense')
        .map(cat => {
            const total = transactions
                .filter(t => t.category === cat.name || t.category === cat._id) // Handle legacy/new
                .reduce((sum, t) => sum + t.amount, 0);
            return { name: cat.name, value: total, color: cat.color };
        })
        .filter(d => d.value > 0);

    return (
        <div className="view active-view slide-in">
            <div className="dashboard-grid">
                <section className="glass-panel">
                    <h3>Spending Breakdown</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%" cy="50%"
                                    innerRadius={60} outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px' }} itemStyle={{ color: 'white' }} />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </section>

                <section className="glass-panel">
                    <h3>Manage Categories</h3>
                    <ul className="leaderboard-list" style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: '1rem' }}>
                        {categories.map(c => (
                            <li key={c._id} className="leaderboard-item">
                                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '50%', background: c.color }}></div>
                                    <span>{c.name}</span>
                                </div>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.type}</span>
                            </li>
                        ))}
                    </ul>
                    <form onSubmit={handleAddCategory} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                        <div className="form-group">
                            <input placeholder="New Category Name" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
                        </div>
                        <div className="form-group">
                            <select value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                        </div>
                        <button className="btn-primary full-width" type="submit">Add Category</button>
                    </form>
                </section>
            </div>
        </div>
    );
}

export default CategoriesPage;
