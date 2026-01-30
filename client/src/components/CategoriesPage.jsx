import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, CartesianGrid, LabelList } from 'recharts';

function CategoriesPage({ onEditTransaction }) {
    const [categories, setCategories] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [viewType, setViewType] = useState('expense');

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [tempSelectedCats, setTempSelectedCats] = useState([]);

    // Advanced Date Filter State
    // Mode: 'all', 'lastWeek', 'lastMonth', 'year', 'custom'
    // Custom now stores precise start/end for calculation
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
    const activeCategories = selectedCategories.length > 0 ? selectedCategories : categoriesToShow;

    // --- Helpers ---
    const getWeekStart = (date) => {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is sunday
        return new Date(d.setDate(diff));
    };

    const formatDateKey = (date, granularity) => {
        const d = new Date(date);
        if (granularity === 'year') return String(d.getFullYear());
        if (granularity === 'month') return d.toISOString().substring(0, 7);
        if (granularity === 'week') {
            // Use Start of Week
            const start = getWeekStart(d);
            return start.toISOString().substring(0, 10); // "2023-05-01"
        }
        return d.toISOString().substring(0, 10); // "2023-05-01" (Day)
    };

    const determineGranularity = (start, end) => {
        if (!start || !end) return 'month'; // Default backup
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 365) return 'year';
        if (diffDays > 31) return 'month'; // > 1 Month (approx)
        if (diffDays > 14) return 'week';  // > 2 Weeks -> Week
        return 'day'; // <= 2 Weeks -> Day
    };


    // --- 1. Data Prep & Histogram Logic ---
    let startDate = new Date();
    let endDate = new Date();
    let granularity = 'month';

    // Calculate Date Range
    if (dateFilter.mode === 'all') {
        startDate = new Date(new Date().setFullYear(new Date().getFullYear() - 1)); // Last 12 months as default "all" for chart? Or literally all?
        // User original 'Default' was Last 12 Months. Let's keep that.
        granularity = 'month';
    } else if (dateFilter.mode === 'lastWeek') {
        endDate = new Date();
        startDate = new Date();
        startDate.setDate(endDate.getDate() - 7);
        granularity = determineGranularity(startDate, endDate); // Should be 'day'
    } else if (dateFilter.mode === 'lastMonth') {
        endDate = new Date();
        startDate = new Date();
        startDate.setMonth(endDate.getMonth() - 1);
        granularity = determineGranularity(startDate, endDate); // Should be 'week' or 'day'? 30 days > 14 -> 'week'
    } else if (dateFilter.mode === 'year') {
        startDate = new Date(`${dateFilter.values[0]}-01-01`);
        endDate = new Date(`${dateFilter.values[0]}-12-31`);
        endDate.setHours(23, 59, 59, 999);
        granularity = 'month';
    } else if (dateFilter.mode === 'custom') {
        startDate = dateFilter.custom.start ? new Date(dateFilter.custom.start) : new Date('2000-01-01');
        endDate = dateFilter.custom.end ? new Date(dateFilter.custom.end) : new Date();
        endDate.setHours(23, 59, 59, 999);
        granularity = determineGranularity(startDate, endDate);
    }

    // Generate Buckets
    const buckets = {};

    // Iterate strictly through transactions or build empty buckets?
    // Building empty buckets for days/weeks is complex. 
    // Just binning transactions and sorting is robust for sparse data, 
    // but for "Chart" looks better with gaps filled.
    // For now, let's Bin Transactions first, then we can Fill Gaps if needed. 
    // Actually, filtering first is safer.

    // Filter Transactions by Range FIRST
    const rangeTransactions = allTransactions.filter(t => {
        if (t.type !== viewType) return false;
        const d = new Date(t.date);
        // Rough filter, refine later
        if (dateFilter.mode !== 'all') {
            if (d < startDate || d > endDate) return false;
        }

        // Also Category Filter (Pre-filter for performance)
        if (selectedCategories.length > 0) {
            if (!selectedCategories.some(c => c.name === t.category)) return false;
        }
        return true;
    });

    rangeTransactions.forEach(t => {
        const key = formatDateKey(t.date, granularity);
        if (!buckets[key]) {
            buckets[key] = { key, total: 0 };
            activeCategories.forEach(c => buckets[key][c.name] = 0);
        }

        // Find category exact match
        // If categories are filtered, we only add if match (already filtered above)
        // If "All Cats", we add it. 
        // Note: 'activeCategories' is effectively user selection OR all.

        // Safety check if category exists in our 'active' list (might be 'Others' or old cat)
        if (activeCategories.some(c => c.name === t.category)) {
            buckets[key][t.category] = (buckets[key][t.category] || 0) + t.amount;
            buckets[key].total += t.amount;
        }
    });

    const histogramData = Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key));
    const availableYears = [...new Set(allTransactions.map(t => t.date.substring(0, 4)))].sort().reverse();


    // --- 2. Pie Data Logic ---
    // Uses rangeTransactions directly
    let pieData = [];
    if (selectedCategories.length === 1) {
        // Breakdown by Time (Granularity based on range?)
        // User said "one month or less shows weeks..." for Histogram.
        // Pie should PROBABLY match Histogram granularity?
        // Or just standard Monthly? User earlier request: "pi chart shows months".
        // Let's match histogram granularity for consistency!
        const timeMap = {};
        rangeTransactions.forEach(t => {
            const k = formatDateKey(t.date, granularity);
            if (!timeMap[k]) timeMap[k] = 0;
            timeMap[k] += t.amount;
        });
        // Sort keys
        const keys = Object.keys(timeMap).sort();
        // Generate colors
        const colors = ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1', '#5D2E8C', '#F25F5C', '#70C1B3', '#247BA0'];

        pieData = keys.map((k, i) => ({
            name: k, value: timeMap[k], color: colors[i % colors.length]
        }));
    } else {
        // Breakdown by Category
        const catMap = {};
        rangeTransactions.forEach(t => {
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
        // What does clicking do dynamically?
        // Maybe nothing for now, or drill down?
        // Logic for multi-select months was specific to "Months" view.
        // For "Weeks" or "Days", selecting might be overkill.
        // Let's disable interactive filtering on the histogram for the complex views for now,
        // as combining "Select Week 1 and Day 5" is confusing.
    };

    const applyCustomDate = (e) => {
        e.preventDefault();
        const s = e.target.start.value;
        const end = e.target.end.value;
        if (!s && !end) return;
        setDateFilter({ mode: 'custom', values: [], custom: { start: s, end: end } });
        setShowCustomDateModal(false);
    };

    // Category Selection
    const toggleSingleCategory = (cat) => {
        if (selectedCategories.length === 1 && selectedCategories[0]._id === cat._id) setSelectedCategories([]);
        else setSelectedCategories([cat]);
    };
    const openCategoryModal = () => { setTempSelectedCats([...selectedCategories]); setShowCategoryModal(true); };
    const toggleTempCategory = (cat) => {
        if (tempSelectedCats.find(c => c._id === cat._id)) setTempSelectedCats(tempSelectedCats.filter(c => c._id !== cat._id));
        else setTempSelectedCats([...tempSelectedCats, cat]);
    };
    const applyCustomCategories = () => { setSelectedCategories(tempSelectedCats); setShowCategoryModal(false); };

    return (
        <div className="view active-view slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

            {/* ROW 1: Toggle */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="toggle-switch" style={{ width: '250px' }}>
                    <input type="radio" id="view-expense" name="viewType" value="expense" checked={viewType === 'expense'} onChange={() => { setViewType('expense'); setSelectedCategories([]); }} />
                    <label htmlFor="view-expense">Expenses</label>
                    <input type="radio" id="view-income" name="viewType" value="income" checked={viewType === 'income'} onChange={() => { setViewType('income'); setSelectedCategories([]); }} />
                    <label htmlFor="view-income">Income</label>
                </div>
            </div>

            {/* ROW 1.5: Category Filter Bar */}
            <div className="filter-bar-container" style={{ overflowX: 'auto', whiteSpace: 'nowrap', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <button className={`filter-pill ${selectedCategories.length === 0 ? 'active' : ''}`} onClick={() => setSelectedCategories([])}
                    style={{ background: selectedCategories.length === 0 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', marginRight: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    All
                </button>
                <button className={`filter-pill ${selectedCategories.length > 1 ? 'active' : ''}`} onClick={openCategoryModal}
                    style={{ background: selectedCategories.length > 1 ? 'var(--primary)' : 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: '20px', marginRight: '10px', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Custom {selectedCategories.length > 1 && `(${selectedCategories.length})`}
                </button>
                {categoriesToShow.map(cat => (
                    <button key={cat._id} onClick={() => toggleSingleCategory(cat)}
                        style={{
                            background: selectedCategories.length === 1 && selectedCategories[0]._id === cat._id ? cat.color : 'rgba(255,255,255,0.05)',
                            border: selectedCategories.length === 1 && selectedCategories[0]._id === cat._id ? `2px solid ${cat.color}` : '1px solid rgba(255,255,255,0.1)',
                            color: 'white', padding: '6px 14px', borderRadius: '20px', marginRight: '10px', cursor: 'pointer', fontSize: '0.85rem'
                        }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat.color, display: 'inline-block', marginRight: '6px' }}></span>
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* ROW 1.75: Date Filter Row */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i> Dates:</span>

                    <button onClick={() => setDateFilter({ mode: 'all', values: [], custom: {} })} style={{ background: dateFilter.mode === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>All</button>
                    <button onClick={() => setDateFilter({ mode: 'lastWeek', values: [], custom: {} })} style={{ background: dateFilter.mode === 'lastWeek' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Last Week</button>
                    <button onClick={() => setDateFilter({ mode: 'lastMonth', values: [], custom: {} })} style={{ background: dateFilter.mode === 'lastMonth' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Last Month</button>

                    {availableYears.length > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>|</span>}
                    {availableYears.map(yr => (
                        <button key={yr} onClick={() => setDateFilter({ mode: 'year', values: [yr], custom: {} })}
                            style={{ background: dateFilter.mode === 'year' && dateFilter.values[0] === yr ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                            {yr}
                        </button>
                    ))}

                    <button onClick={() => setShowCustomDateModal(true)} style={{ background: dateFilter.mode === 'custom' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Custom</button>
                </div>
            </div>

            {/* ROW 2: Histogram */}
            <section className="glass-panel" style={{ padding: '20px', position: 'relative', zIndex: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
                        {selectedCategories.length === 1 ? `${selectedCategories[0].name} Trend` : 'Spending Trend'}
                        <span style={{ marginLeft: '5px', fontSize: '0.8rem', opacity: 0.7 }}>
                            {granularity === 'day' && '(Daily)'}
                            {granularity === 'week' && '(Weekly)'}
                            {granularity === 'month' && '(Monthly)'}
                            {granularity === 'year' && '(Annual)'}
                        </span>
                    </h4>
                </div>

                <div style={{ height: '200px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={histogramData} onClick={handleBarClick}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <XAxis dataKey="key" tick={{ fill: 'var(--text-muted)', fontSize: '0.7rem' }} tickFormatter={v => v.substring(5)} />
                            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ background: '#1e1e24', border: '1px solid #333' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                            {selectedCategories.length === 1 ? (
                                <Bar dataKey={selectedCategories[0].name} fill={selectedCategories[0].color}>
                                    <LabelList dataKey={selectedCategories[0].name} position="top" fill="white" fontSize={10} formatter={v => v > 0 ? `$${v}` : ''} />
                                </Bar>
                            ) : (
                                <>
                                    {activeCategories.map(cat => (
                                        <Bar key={cat._id} dataKey={cat.name} stackId="a" fill={cat.color} />
                                    ))}
                                    <Bar dataKey="total" stackId="a" fill="transparent" isAnimationActive={false}>
                                        <LabelList dataKey="total" position="top" fill="white" fontSize={10} formatter={v => v > 0 ? `$${v}` : ''} />
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
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px' }} itemStyle={{ color: 'white' }} />
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

            {/* ROW 4: Activity */}
            <section className="glass-panel">
                <h3>{selectedCategories.length === 1 ? `${selectedCategories[0].name} Activity` : 'Activity'}</h3>
                <ul className="transaction-list horizontal-style" style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '10px' }}>
                    {rangeTransactions.map(t => {
                        const catObj = categories.find(c => c.name === t.category);
                        const catColor = catObj ? catObj.color : 'var(--text-muted)';
                        return (
                            <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px' }}>
                                <div className="t-main"><h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t.title}</h4></div>
                                <div className="t-date" style={{ fontSize: '0.9rem' }}>{new Date(t.date).toLocaleDateString()}</div>
                                <div className="t-cat"><span className="cat-pill" style={{ background: catColor + '30', color: catColor, border: `1px solid ${catColor}50`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t.category}</span></div>
                                <div className={`t-amount ${t.type}`} style={{ textAlign: 'right' }}>{t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}</div>
                            </li>
                        );
                    })}
                </ul>
            </section>

            {/* CUSTOM DATE MODAL */}
            {showCustomDateModal && (
                <div className="modal-overlay">
                    <div className="modal glass-panel bounce-in" style={{ width: '320px' }}>
                        <div className="modal-header"><h3>Select Range</h3><button className="close-modal" onClick={() => { setShowCustomDateModal(false); }}><i className="fa-solid fa-xmark"></i></button></div>
                        <form onSubmit={applyCustomDate} className="modal-body">
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', textAlign: 'center' }}>Select Start, End, or Both</div>

                            <div className="form-group">
                                <label>Start Date (Min)</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="date" name="start" style={{ width: '100%', paddingRight: '40px', appearance: 'none' }} />
                                    <i className="fa-regular fa-calendar" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary)' }}></i>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>End Date (Max)</label>
                                <div style={{ position: 'relative' }}>
                                    <input type="date" name="end" style={{ width: '100%', paddingRight: '40px', appearance: 'none' }} />
                                    <i className="fa-regular fa-calendar" style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary)' }}></i>
                                </div>
                            </div>

                            <button type="submit" className="btn-primary full-width">Apply Filter</button>
                        </form>
                    </div>
                </div>
            )}

            {/* CUSTOM CATEGORY MODAL */}
            {showCategoryModal && (
                <div className="modal-overlay">
                    <div className="modal glass-panel bounce-in" style={{ width: '300px' }}>
                        <div className="modal-header"><h3>Select Categories</h3><button className="close-modal" onClick={() => { setShowCategoryModal(false); }}><i className="fa-solid fa-xmark"></i></button></div>
                        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
                            {categoriesToShow.map(cat => (
                                <div key={cat._id} onClick={() => toggleTempCategory(cat)}
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer',
                                        background: tempSelectedCats.find(c => c._id === cat._id) ? 'rgba(255,255,255,0.1)' : 'transparent',
                                        border: '1px solid rgba(255,255,255,0.05)'
                                    }}>
                                    <div style={{ width: '15px', height: '15px', borderRadius: '3px', border: `1px solid ${cat.color}`, background: tempSelectedCats.find(c => c._id === cat._id) ? cat.color : 'transparent' }}></div>
                                    <span>{cat.name}</span>
                                </div>
                            ))}
                        </div>
                        <div style={{ padding: '20px' }}>
                            <button onClick={applyCustomCategories} className="btn-primary full-width">Apply Selection</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default CategoriesPage;
