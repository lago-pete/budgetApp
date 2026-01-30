```javascript
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid, LabelList } from 'recharts';

function CategoriesPage({ onEditTransaction }) {
    const [categories, setCategories] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [viewType, setViewType] = useState('expense');
    const [selectedCategory, setSelectedCategory] = useState(null);

    // Advanced Date Filter State
    // Modes: 'all', 'months' (array), 'year' (string), 'custom' ({start, end})
    const [dateFilter, setDateFilter] = useState({ mode: 'all', values: [], custom: { start: '', end: '' } });
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);

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

    const categoriesToShow = categories.filter(c => c.type === viewType);

    // --- 1. Data Prep ---
    // Determine Month Range based on Filter Mode
    let histogramMonths = [];

    if (dateFilter.mode === 'year' && dateFilter.values.length > 0) {
        // Fixed Year: Jan - Dec of that year
        const yr = dateFilter.values[0];
        for(let i=1; i<=12; i++) {
            histogramMonths.push(`${ yr } -${ String(i).padStart(2, '0') } `);
        }
    } else {
        // Default: Last 12 Months Rolling
        const now = new Date();
        for (let i = 11; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            histogramMonths.push(d.toISOString().substring(0, 7));
        }
    }

    // B. Histogram Map
    const histogramMap = {};
    histogramMonths.forEach(m => {
        histogramMap[m] = { month: m, total: 0 }; // Initialize total
        categoriesToShow.forEach(c => {
            histogramMap[m][c.name] = 0;
        });
    });

    allTransactions.filter(t => t.type === viewType).forEach(t => {
        const m = t.date.substring(0, 7);
        if (histogramMap[m]) {
            if (!histogramMap[m][t.category]) histogramMap[m][t.category] = 0;
            histogramMap[m][t.category] += t.amount;
            histogramMap[m].total += t.amount; // Calc total for the label
        }
    });

    const histogramData = Object.values(histogramMap).sort((a, b) => a.month.localeCompare(b.month));

    // Extract Years for Filter
    const availableYears = [...new Set(allTransactions.map(t => t.date.substring(0, 4)))].sort().reverse();


    // --- 2. Filter Logic & Pie Prep ---
    const getFilteredTransactions = () => {
        return allTransactions.filter(t => {
            if (t.type !== viewType) return false;

            // Date Filtering
            if (dateFilter.mode === 'months') {
                const m = t.date.substring(0, 7);
                if (!dateFilter.values.includes(m)) return false;
            } else if (dateFilter.mode === 'year') {
                if (t.date.substring(0, 4) !== dateFilter.values[0]) return false;
            } else if (dateFilter.mode === 'custom') {
                const d = new Date(t.date);
                // Handle partial ranges (Start only, End only, or Both)
                if (dateFilter.custom.start) {
                    const start = new Date(dateFilter.custom.start);
                    if (d < start) return false;
                }
                if (dateFilter.custom.end) {
                    const end = new Date(dateFilter.custom.end);
                    // Set time to end of day for inclusive max
                    end.setHours(23, 59, 59, 999);
                    if (d > end) return false;
                }
            }

            // Category Filtering
            if (selectedCategory && t.category !== selectedCategory.name) return false;

            return true;
        });
    };

    const filteredTransactions = getFilteredTransactions();

    // Pie Data Logic
    let pieData = [];
    if (selectedCategory) {
        // Monthly breakdown of selected category (within the date filter context? or independent?)
        // User said: "clicking a category ... pi chart shows months"
        // If we have strict date filters applied (e.g. Just May), showing a Monthly breakdown of May is 1 slice.
        // If 'All Time' or 'Year', it makes sense.
        // Let's aggregate from filteredTransactions to respect the date range.

        const monthMap = {};
        filteredTransactions.forEach(t => {
            const m = t.date.substring(0, 7);
            if (!monthMap[m]) monthMap[m] = 0;
            monthMap[m] += t.amount;
        });

        // Use standard palette
        const monthColors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1', '#5D2E8C', '#F25F5C', '#70C1B3', '#247BA0'];

        pieData = Object.entries(monthMap).map(([m, val], idx) => ({
            name: m, value: val, color: monthColors[idx % 12]
        })).sort((a, b) => a.name.localeCompare(b.name));

    } else {
        // Category Breakdown
        const catMap = {};
        filteredTransactions.forEach(t => {
            if (!catMap[t.category]) catMap[t.category] = 0;
            catMap[t.category] += t.amount;
        });

        pieData = Object.entries(catMap).map(([name, val]) => {
            const cat = categories.find(c => c.name === name);
            return { name, value: val, color: cat ? cat.color : '#888' };
        });
    }
    const pieCenterTotal = pieData.reduce((sum, d) => sum + d.value, 0);


    // --- Handlers ---
    const handleBarClick = (data) => {
        if (!data || !data.activePayload) return;
        const clickedMonth = data.activePayload[0].payload.month;

        setDateFilter(prev => {
            let newValues = prev.mode === 'months' ? [...prev.values] : [];

            if (newValues.includes(clickedMonth)) {
                newValues = newValues.filter(m => m !== clickedMonth);
            } else {
                newValues.push(clickedMonth);
            }

            if (newValues.length === 0) return { mode: 'all', values: [], custom: {start:'', end:''} };
            return { mode: 'months', values: newValues, custom: {start:'', end:''} };
        });
    };

    const removeMonthFilter = (m) => {
        setDateFilter(prev => {
            const newValues = prev.values.filter(val => val !== m);
            if (newValues.length === 0) return { mode: 'all', values: [], custom: {start:'', end:''} };
            return { ...prev, values: newValues };
        });
    };

    const applyCustomDate = (e) => {
        e.preventDefault();
        const s = e.target.start.value;
        const end = e.target.end.value;
        if(!s && !end) return; // Require at least one
        setDateFilter({ mode: 'custom', values: [], custom: { start: s, end: end } });
        setShowCustomDateModal(false);
    };

    return (
        <div className="view active-view slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

            {/* ROW 1: Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="toggle-switch" style={{ width: '250px' }}>
                    <input type="radio" id="view-expense" name="viewType" value="expense" checked={viewType === 'expense'} onChange={() => { setViewType('expense'); setSelectedCategory(null); }} />
                    <label htmlFor="view-expense">Expenses</label>
                    <input type="radio" id="view-income" name="viewType" value="income" checked={viewType === 'income'} onChange={() => { setViewType('income'); setSelectedCategory(null); }} />
                    <label htmlFor="view-income">Income</label>
                </div>
            </div>

            {/* ROW 1.5: Category Filter Bar */}
            <div className="filter-bar-container" style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button className={`filter - pill ${ !selectedCategory ? 'active' : '' } `} onClick={() => setSelectedCategory(null)}
                    style={{ background: !selectedCategory ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', marginRight: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    All Cats
                </button>
                {categoriesToShow.map(cat => (
                    <button key={cat._id} onClick={() => setSelectedCategory(cat)}
                        style={{
                            background: selectedCategory?._id === cat._id ? cat.color : 'rgba(255,255,255,0.05)',
                            border: selectedCategory?._id === cat._id ? `2px solid ${ cat.color } ` : '1px solid rgba(255,255,255,0.1)',
                            color: 'white', padding: '6px 14px', borderRadius: '20px', marginRight: '10px', cursor: 'pointer', fontSize: '0.85rem'
                        }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, display: 'inline-block', marginRight: '6px' }}></span>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* ROW 1.75: Date Filter Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {/* Year / Custom Buttons */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i> Dates:</span>

                    <button onClick={() => setDateFilter({ mode: 'all', values: [], custom: {} })} style={{ background: dateFilter.mode === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>All Time</button>

                    {availableYears.map(yr => (
                        <button key={yr} onClick={() => setDateFilter({ mode: 'year', values: [yr], custom: {} })}
                            style={{ background: dateFilter.mode === 'year' && dateFilter.values[0] === yr ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                            {yr}
                        </button>
                    ))}

                    <button onClick={() => setShowCustomDateModal(true)} style={{ background: dateFilter.mode === 'custom' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Custom</button>
                </div>

                {/* Selected Month Bubbles */}
                {dateFilter.mode === 'months' && dateFilter.values.length > 0 && (
                    <div style={{display:'flex', gap:'8px', flexWrap:'wrap', alignItems:'center'}}>
                        <span style={{fontSize:'0.8rem', color:'var(--text-muted)'}}>Selected:</span>
                        {dateFilter.values.map(m => (
                            <div key={m} style={{
                                background: 'rgba(99, 102, 241, 0.2)',
                                border: '1px solid var(--primary)',
                                borderRadius: '15px',
                                padding: '2px 8px 2px 12px',
                                fontSize: '0.8rem',
                                color: 'white',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                            }}>
                                 {m}
                                 <button onClick={() => removeMonthFilter(m)} style={{background:'none', border:'none', color:'white', cursor:'pointer', padding:0, fontSize:'0.9rem', opacity:0.7, display:'flex', alignItems:'center'}}>
                                     <i className="fa-solid fa-xmark"></i>
                                 </button>
                            </div>
                        ))}
                        <button onClick={() => setDateFilter({mode:'all', values:[], custom:{}})} style={{fontSize:'0.75rem', color:'var(--text-muted)', background:'none', border:'none', cursor:'pointer', textDecoration:'underline'}}>Clear All</button>
                    </div>
                )}
            </div>

            {/* ROW 2: Histogram */}
            <section className="glass-panel" style={{ padding: '20px', position: 'relative', zIndex: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        {selectedCategory ? `${ selectedCategory.name } Trend` : 'Spending Trend'} {dateFilter.mode === 'year' ? `(${ dateFilter.values[0] })` : '(Last 12 Months)'}
                    </h4>
                </div>

                <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={histogramData} onClick={handleBarClick}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="month" tick={{ fill: 'var(--text-muted)', fontSize: '0.7rem' }} tickFormatter={v => v.substring(5)} />
                            {/* High z-index tooltip */}
                            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ background: '#1e1e24', border: '1px solid #333' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                            {/* Stacked Bars or Single */}
                            {selectedCategory ? (
                                <Bar dataKey={selectedCategory.name} fill={selectedCategory.color}>
                                    <LabelList dataKey={selectedCategory.name} position="top" fill="white" fontSize={10} formatter={v => v > 0 ? `$${ v } ` : ''} />
                                </Bar>
                            ) : (
                                <>
                                    {categoriesToShow.map(cat => (
                                        // No labels on individual stack segments to avoid clutter
                                        <Bar key={cat._id} dataKey={cat.name} stackId="a" fill={cat.color} />
                                    ))}
                                    {/* Invisible Bar for Total Labels on top of stack */}
                                    <Bar dataKey="total" stackId="a" fill="transparent" isAnimationActive={false}>
                                        <LabelList dataKey="total" position="top" fill="white" fontSize={10} formatter={v => v > 0 ? `$${ v } ` : ''} />
                                    </Bar>
                                </>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* ROW 3: Pie Chart */}
            <section className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', zIndex: 1 }}>
                <h4 style={{ marginBottom: '10px', fontSize: '1rem', color: 'var(--text-muted)' }}>
                    Breakdown
                </h4>
                <div style={{ width: '100%', maxWidth: '400px', height: '300px', position: 'relative' }}>
                    {pieData.length > 0 ? (
                        <>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={3} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell - ${ index } `} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${ value.toFixed(2) } `} contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px' }} itemStyle={{ color: 'white' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none' }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Space Grotesk' }}>${pieCenterTotal.toFixed(0)}</div>
                            </div>
                        </>
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
                    )}
                </div>
            </section>

            {/* ROW 4: All Activity */}
            <section className="glass-panel">
                <h3>{selectedCategory ? `${ selectedCategory.name } Activity` : 'Activity'}</h3>
                <ul className="transaction-list horizontal-style" style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '10px' }}>
                    {filteredTransactions.map(t => {
                        const catObj = categories.find(c => c.name === t.category);
                        const catColor = catObj ? catObj.color : 'var(--text-muted)';
                        return (
                            <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px' }}>
                                <div className="t-main"><h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t.title}</h4></div>
                                <div className="t-date" style={{ fontSize: '0.9rem' }}>{new Date(t.date).toLocaleDateString()}</div>
                                <div className="t-cat"><span className="cat-pill" style={{ background: catColor + '30', color: catColor, border: `1px solid ${ catColor } 50`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t.category}</span></div>
                                <div className={`t - amount ${ t.type } `} style={{ textAlign: 'right' }}>{t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}</div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* CUSTOM DATE MODAL */}
            {showCustomDateModal && (
                <div className="modal-overlay">
                    <div className="modal glass-panel bounce-in" style={{ width: '300px' }}>
                        <div className="modal-header"><h3>Select Range</h3><button className="close-modal" onClick={() => { setShowCustomDateModal(false); }}><i className="fa-solid fa-xmark"></i></button></div>
                        <form onSubmit={applyCustomDate} className="modal-body">
                            <div style={{fontSize:'0.8rem', color:'var(--text-muted)', marginBottom:'15px', textAlign:'center'}}>Select Start, End, or Both</div>
                            <div className="form-group"><label>Start Date (Min)</label><input type="date" name="start" /></div>
                            <div className="form-group"><label>End Date (Max)</label><input type="date" name="end" /></div>
                            <button type="submit" className="btn-primary full-width">Apply Filter</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoriesPage;
```
