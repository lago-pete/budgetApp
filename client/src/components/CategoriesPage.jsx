import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from 'recharts';

function CategoriesPage({ onEditTransaction }) {
    const [categories, setCategories] = useState([]);
    const [allTransactions, setAllTransactions] = useState([]);
    const [viewType, setViewType] = useState('expense');

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [showCategoryModal, setShowCategoryModal] = useState(false);
    const [tempSelectedCats, setTempSelectedCats] = useState([]);

    // Advanced Date Filter State
    const [dateFilter, setDateFilter] = useState({ mode: 'all', values: [], custom: { start: '', end: '' } });
    const [showCustomDateModal, setShowCustomDateModal] = useState(false);

    // Activity Table State
    const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
    const [displayLimit, setDisplayLimit] = useState(100);

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
    const getWeekDates = (date) => {
        const d = new Date(date);
        const day = d.getDay(); // 0 is Sunday
        const diff = d.getDate() - day; // Adjust to Sunday
        const start = new Date(d.setDate(diff));
        start.setHours(0, 0, 0, 0);
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        return { start, end };
    };

    const determineGranularity = (start, end) => {
        if (!start || !end) return 'month';
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 365) return 'year';
        if (diffDays > 32) return 'month';
        if (diffDays > 14) return 'week';
        return 'day';
    };

    const pad = (n) => String(n).padStart(2, '0');

    const toLocalKey = (date, granularity) => {
        const d = new Date(date);
        const y = d.getFullYear();
        if (granularity === 'year') return `${y}-01-01`;

        const m = pad(d.getMonth() + 1);
        if (granularity === 'month') return `${y}-${m}-01`;

        const day = pad(d.getDate());
        return `${y}-${m}-${day}`;
    };

    const formatDateLabel = (date, granularity, globalStart, globalEnd) => {
        const d = new Date(date);

        if (granularity === 'year') return String(d.getFullYear());
        if (granularity === 'month') return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        if (granularity === 'day') return d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });

        if (granularity === 'week') {
            let start = new Date(d);
            let end = new Date(d);
            end.setDate(d.getDate() + 6);

            if (globalStart && start < globalStart) start = new Date(globalStart);
            if (globalEnd && end > globalEnd) end = new Date(globalEnd);

            const sStr = start.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            const eStr = end.toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' });
            return `${sStr}-${eStr}`;
        }
        return toLocalKey(d, 'day');
    };

    const generateTimeBuckets = (start, end, granularity) => {
        const buckets = {};
        let current = new Date(start);
        current = new Date(current.getFullYear(), current.getMonth(), current.getDate());

        if (granularity === 'year') current.setMonth(0, 1);
        else if (granularity === 'month') current.setDate(1);
        else if (granularity === 'week') {
            const day = current.getDay();
            current.setDate(current.getDate() - day);
        }
        current.setHours(0, 0, 0, 0);

        const endLimit = new Date(end);
        endLimit.setHours(23, 59, 59, 999);

        let loops = 0;
        while (current <= endLimit && loops < 1000) {
            loops++;
            let bucketEnd = new Date(current);
            if (granularity === 'year') bucketEnd.setFullYear(current.getFullYear() + 1);
            else if (granularity === 'month') bucketEnd.setMonth(current.getMonth() + 1);
            else if (granularity === 'week') bucketEnd.setDate(current.getDate() + 7);
            else bucketEnd.setDate(current.getDate() + 1);
            bucketEnd = new Date(bucketEnd.getTime() - 1);

            if (current <= endLimit && bucketEnd >= start) {
                const key = toLocalKey(current, granularity === 'week' ? 'day' : granularity);

                buckets[key] = {
                    key,
                    label: formatDateLabel(current, granularity, start, end),
                    granularity,
                    total: 0
                };
                activeCategories.forEach(c => buckets[key][c.name] = 0);
            }

            if (granularity === 'year') current.setFullYear(current.getFullYear() + 1);
            else if (granularity === 'month') current.setMonth(current.getMonth() + 1);
            else if (granularity === 'week') current.setDate(current.getDate() + 7);
            else current.setDate(current.getDate() + 1);
        }
        return buckets;
    };

    const CustomTick = (props) => {
        const { x, y, payload, buckets } = props;
        const bucket = buckets ? Object.values(buckets).find(b => b.key === payload.value) : null;
        const label = bucket ? bucket.label : payload.value;
        const total = bucket ? bucket.total : 0;

        return (
            <g transform={`translate(${x},${y})`}>
                <text x={0} y={0} dy={16} textAnchor="middle" fill="var(--text-muted)" fontSize={10}>
                    {label}
                </text>
                <text x={0} y={0} dy={32} textAnchor="middle" fill="#fff" fontSize={11} fontWeight="bold">
                    {total > 0 ? `$${total.toFixed(0)}` : ''}
                </text>
            </g>
        );
    };


    // --- 1. Filter Logic ---
    let startDate = new Date();
    let endDate = new Date();
    let granularity = 'month';
    const now = new Date();

    if (dateFilter.mode === 'all') {
        endDate = now;
        startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        granularity = 'month';
    } else if (dateFilter.mode === 'thisWeek') {
        const w = getWeekDates(now);
        startDate = w.start;
        endDate = w.end;
        granularity = 'day';
    } else if (dateFilter.mode === 'thisMonth') {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        granularity = determineGranularity(startDate, endDate);
    } else if (dateFilter.mode === 'year') {
        const y = parseInt(dateFilter.values[0]);
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59, 999);
        granularity = 'month';
    } else if (dateFilter.mode === 'custom') {
        if (dateFilter.custom.start) {
            const [y, m, d] = dateFilter.custom.start.split('-').map(Number);
            startDate = new Date(y, m - 1, d);
        } else {
            startDate = new Date(2000, 0, 1);
        }
        if (dateFilter.custom.end) {
            const [y, m, d] = dateFilter.custom.end.split('-').map(Number);
            endDate = new Date(y, m - 1, d);
            endDate.setHours(23, 59, 59, 999);
        } else {
            endDate = new Date();
        }
        granularity = determineGranularity(startDate, endDate);
    }

    const buckets = generateTimeBuckets(startDate, endDate, granularity);

    const rangeTransactions = allTransactions.filter(t => {
        if (t.type !== viewType) return false;
        const [y, m, d] = t.date.substring(0, 10).split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        if (dateObj < startDate || dateObj > endDate) return false;
        if (selectedCategories.length > 0 && !selectedCategories.some(c => c.name === t.category)) return false;
        return true;
    });

    rangeTransactions.forEach(t => {
        const [y, m, d] = t.date.substring(0, 10).split('-').map(Number);
        const dateObj = new Date(y, m - 1, d);

        let key = '';
        if (granularity === 'year') key = `${y}-01-01`;
        else if (granularity === 'month') key = `${y}-${pad(m)}-01`;
        else if (granularity === 'day') key = `${y}-${pad(m)}-${pad(d)}`;
        else if (granularity === 'week') {
            const dayOfWeek = dateObj.getDay();
            const diff = dateObj.getDate() - dayOfWeek;
            const wStart = new Date(dateObj);
            wStart.setDate(diff);
            key = toLocalKey(wStart, 'day');
        }

        if (buckets[key]) {
            if (activeCategories.some(c => c.name === t.category)) {
                buckets[key][t.category] = (buckets[key][t.category] || 0) + t.amount;
                buckets[key].total += t.amount;
            }
        }
    });

    const histogramData = Object.values(buckets).sort((a, b) => a.key.localeCompare(b.key));
    const availableYears = [...new Set(allTransactions.map(t => new Date(t.date).getFullYear()))].sort().reverse();

    let pieData = [];
    if (selectedCategories.length === 1) {
        pieData = histogramData.map((b, i) => ({
            name: b.label,
            value: b[selectedCategories[0].name] || 0,
            color: ['#f94144', '#f3722c', '#f8961e', '#f9c74f', '#90be6d', '#43aa8b', '#577590', '#277da1', '#5D2E8C', '#F25F5C', '#70C1B3', '#247BA0'][i % 12]
        })).filter(d => d.value > 0);
    } else {
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

    // --- ACTIVITY LOGIC (Sort, Paginate, Total) ---
    useEffect(() => {
        setDisplayLimit(100); // Reset limit when filter results change
    }, [dateFilter, selectedCategories, viewType]);

    const handleSort = (key) => {
        let direction = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedTransactions = [...rangeTransactions].sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) return sortConfig.direction === 'asc' ? -1 : 1;
        if (a[sortConfig.key] > b[sortConfig.key]) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const visibleTransactions = sortedTransactions.slice(0, displayLimit);
    const totalActivitySum = sortedTransactions.reduce((sum, t) => sum + t.amount, 0);

    const handleScroll = (e) => {
        const { scrollTop, clientHeight, scrollHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 50) {
            if (displayLimit < sortedTransactions.length) {
                setDisplayLimit(prev => prev + 50);
            }
        }
    };

    // --- INTERACTION & HANDLERS ---
    const handleBarClick = (data) => {
        if (!data || !data.activePayload) return;
        const key = data.activePayload[0].payload.key;
        const bucket = buckets[key];
        if (!bucket) return;

        const g = bucket.granularity;
        let newStart, newEnd;
        const [y, m, d] = key.split('-').map(Number);

        if (g === 'year') {
            newStart = `${y}-01-01`;
            newEnd = `${y}-12-31`;
        } else if (g === 'month') {
            newStart = `${y}-${pad(m)}-01`;
            const lastDay = new Date(y, m, 0).getDate();
            newEnd = `${y}-${pad(m)}-${lastDay}`;
        } else if (g === 'week') {
            newStart = key;
            const endObj = new Date(y, m - 1, d + 6);
            newEnd = `${endObj.getFullYear()}-${pad(endObj.getMonth() + 1)}-${pad(endObj.getDate())}`;
        } else {
            newStart = key;
            newEnd = key;
        }
        setDateFilter({ mode: 'custom', values: [], custom: { start: newStart, end: newEnd } });
    };

    const applyCustomDate = (e) => {
        e.preventDefault();
        const s = e.target.start.value;
        const end = e.target.end.value;
        if (!s && !end) return;
        setDateFilter({ mode: 'custom', values: [], custom: { start: s, end: end } });
        setShowCustomDateModal(false);
    };

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

    const DateInput = ({ label, name }) => {
        const [val, setVal] = useState('');
        const pickerRef = useRef(null);
        const handleChange = (e) => setVal(e.target.value);
        const handlePicker = (e) => setVal(e.target.value);
        return (
            <div className="form-group">
                <label>{label}</label>
                <div style={{ position: 'relative' }}>
                    <input type="text" name={name} value={val} onChange={handleChange} placeholder="YYYY-MM-DD" style={{ width: '100%', paddingRight: '40px' }} />
                    <i className="fa-regular fa-calendar" onClick={() => pickerRef.current.showPicker()} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--primary)' }}></i>
                    <input type="date" ref={pickerRef} onChange={handlePicker} style={{ position: 'absolute', right: 0, top: 0, opacity: 0, width: '0px', height: '0px' }} />
                </div>
            </div>
        );
    };

    // --- Dynamic Title Helpers ---
    const getDateLabel = () => {
        if (!startDate || !endDate) return '';

        // Year Mode
        if (dateFilter.mode === 'year') return `(${dateFilter.values[0]})`;

        // This Month -> (Jan)
        if (dateFilter.mode === 'thisMonth') return `(${startDate.toLocaleDateString('en-US', { month: 'short' })})`;

        // All Time -> (Feb 2025 - Jan 2026)
        if (dateFilter.mode === 'all') {
            const startStr = startDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            const endStr = endDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            return `(${startStr} - ${endStr})`;
        }

        // Single Day -> (Jan 13)
        if (startDate.toDateString() === endDate.toDateString()) {
            return `(${startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })})`;
        }

        // Default Range -> (Jan 1 - Jan 13)
        const opts = { month: 'short', day: 'numeric' };
        const startStr = startDate.toLocaleDateString('en-US', opts);
        const endStr = endDate.toLocaleDateString('en-US', opts);

        if (startDate.getFullYear() !== endDate.getFullYear()) {
            const lOpts = { month: 'short', day: 'numeric', year: 'numeric' };
            return `(${startDate.toLocaleDateString('en-US', lOpts)} - ${endDate.toLocaleDateString('en-US', lOpts)})`;
        }
        return `(${startStr} - ${endStr})`;
    };

    const getContextTitle = (base) => {
        const prefix = selectedCategories.length === 1 ? selectedCategories[0].name : '';
        const dateSuffix = getDateLabel();
        return `${prefix ? prefix + ' ' : ''}${base} <span style="font-size:0.8rem; opacity:0.7; margin-left:5px">${dateSuffix}</span>`;
    };

    return (
        <div className="view active-view slide-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '20px' }}>

            {/* ROW 1... */}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
                <div className="toggle-switch" style={{ width: '250px' }}>
                    <input type="radio" id="view-expense" name="viewType" value="expense" checked={viewType === 'expense'} onChange={() => { setViewType('expense'); setSelectedCategories([]); }} />
                    <label htmlFor="view-expense">Expenses</label>
                    <input type="radio" id="view-income" name="viewType" value="income" checked={viewType === 'income'} onChange={() => { setViewType('income'); setSelectedCategories([]); }} />
                    <label htmlFor="view-income">Income</label>
                </div>
            </div>

            {/* ...Category Filter... */}
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

            {/* ...Date Filter... */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}><i className="fa-regular fa-calendar" style={{ marginRight: '5px' }}></i> Dates:</span>

                    <button onClick={() => setDateFilter({ mode: 'all', values: [], custom: {} })} style={{ background: dateFilter.mode === 'all' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>All (Year)</button>
                    <button onClick={() => setDateFilter({ mode: 'thisWeek', values: [], custom: {} })} style={{ background: dateFilter.mode === 'thisWeek' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>This Week</button>
                    <button onClick={() => setDateFilter({ mode: 'thisMonth', values: [], custom: {} })} style={{ background: dateFilter.mode === 'thisMonth' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>This Month</button>

                    {availableYears.length > 0 && <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>|</span>}
                    {availableYears.map(yr => (
                        <button key={yr} onClick={() => setDateFilter({ mode: 'year', values: [yr], custom: {} })}
                            style={{ background: dateFilter.mode === 'year' && dateFilter.values[0] === yr ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>
                            {yr}
                        </button>
                    ))}

                    <button onClick={() => setShowCustomDateModal(true)} style={{ background: dateFilter.mode === 'custom' ? 'var(--primary)' : 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '4px 12px', color: 'white', fontSize: '0.85rem', cursor: 'pointer' }}>Custom</button>

                    {dateFilter.mode === 'custom' && (
                        <div style={{
                            display: 'inline-flex', alignItems: 'center', gap: '8px',
                            background: 'rgba(249, 199, 79, 0.2)', border: '1px solid var(--accent)', color: 'var(--accent)',
                            padding: '4px 12px', borderRadius: '15px', fontSize: '0.8rem', marginLeft: '10px'
                        }}>
                            <span>
                                {(() => {
                                    if (dateFilter.custom.start === dateFilter.custom.end && dateFilter.custom.start) {
                                        const [y, m, d] = dateFilter.custom.start.split('-').map(Number);
                                        return new Date(y, m - 1, d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                    }
                                    return `${dateFilter.custom.start} - ${dateFilter.custom.end}`;
                                })()}
                            </span>
                            <button onClick={() => setDateFilter({ mode: 'all', values: [], custom: {} })}
                                style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: '0.9rem', display: 'flex', alignItems: 'center', padding: 0 }}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ROW 2: Histogram */}
            <section className="glass-panel" style={{ padding: '20px 20px 10px 20px', position: 'relative', zIndex: 5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0px' }}>
                    <h4 style={{ fontSize: '1rem', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: getContextTitle('Spending Trend') }}></h4>
                </div>

                <div style={{ height: '240px', width: '100%' }}>
                    <ResponsiveContainer>
                        <BarChart data={histogramData} margin={{ top: 10, right: 0, left: 0, bottom: 20 }} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                            <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                            <YAxis hide domain={[0, 'auto']} />
                            <XAxis
                                dataKey="key" interval={0}
                                tick={<CustomTick buckets={buckets} />}
                                height={60} axisLine={{ stroke: 'rgba(255,255,255,0.1)' }} tickLine={false}
                            />
                            <Tooltip wrapperStyle={{ zIndex: 1000 }} contentStyle={{ background: '#1e1e24', border: '1px solid #333' }} cursor={{ fill: 'rgba(255,255,255,0.05)' }} />

                            {selectedCategories.length === 1 ? (
                                <Bar dataKey={selectedCategories[0].name} fill={selectedCategories[0].color} />
                            ) : (
                                <>
                                    {activeCategories.map(cat => (<Bar key={cat._id} dataKey={cat.name} stackId="a" fill={cat.color} />))}
                                </>
                            )}
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </section>

            {/* ROW 3: Pie Chart */}
            <section className="glass-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px', flexDirection: 'column', zIndex: 1 }}>
                <h4 style={{ marginBottom: '10px', fontSize: '1rem', color: 'var(--text-muted)' }} dangerouslySetInnerHTML={{ __html: getContextTitle('Breakdown') }}></h4>
                <div style={{ width: '100%', maxWidth: '400px', height: '300px', position: 'relative' }}>
                    {pieData.length > 0 ? (
                        <>
                            {/* Z-Index Fix: Text BEHIND Chart */}
                            <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center', pointerEvents: 'none', zIndex: 0 }}>
                                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 'bold', fontFamily: 'Space Grotesk' }}>${pieCenterTotal.toFixed(0)}</div>
                            </div>

                            <ResponsiveContainer style={{ zIndex: 1, position: 'relative' }}>
                                <PieChart>
                                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={3} dataKey="value">
                                        {pieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />)}
                                    </Pie>
                                    <Tooltip formatter={(value) => `$${value.toFixed(2)}`} contentStyle={{ background: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '10px', zIndex: 1000 }} itemStyle={{ color: 'white' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </>
                    ) : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>No Data</div>
                    )}
                </div>
            </section>

            {/* ROW 4: Activity */}
            <section className="glass-panel">
                <h3 dangerouslySetInnerHTML={{ __html: getContextTitle('Activity') }}></h3>

                {/* Header Row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.1)', fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 'bold' }}>
                    <div onClick={() => handleSort('title')} style={{ cursor: 'pointer' }}>Title {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                    <div onClick={() => handleSort('date')} style={{ cursor: 'pointer' }}>Date {sortConfig.key === 'date' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                    <div onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>Category {sortConfig.key === 'category' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                    <div onClick={() => handleSort('amount')} style={{ cursor: 'pointer', textAlign: 'right' }}>Amount {sortConfig.key === 'amount' && (sortConfig.direction === 'asc' ? '↑' : '↓')}</div>
                </div>

                <ul className="transaction-list horizontal-style" onScroll={handleScroll} style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '0px' }}>
                    {visibleTransactions.map(t => {
                        const catObj = categories.find(c => c.name === t.category);
                        const catColor = catObj ? catObj.color : 'var(--text-muted)';
                        return (
                            <li key={t._id} className="transaction-item compact" onClick={() => onEditTransaction && onEditTransaction(t)} style={{ cursor: 'pointer', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', alignItems: 'center', padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                <div className="t-main"><h4 style={{ margin: 0, fontSize: '0.9rem' }}>{t.title}</h4></div>
                                <div className="t-date" style={{ fontSize: '0.9rem' }}>{new Date(t.date).toLocaleDateString()}</div>
                                <div className="t-cat"><span className="cat-pill" style={{ background: catColor + '30', color: catColor, border: `1px solid ${catColor}50`, padding: '2px 8px', borderRadius: '12px', fontSize: '0.8rem' }}>{t.category}</span></div>
                                <div className={`t-amount ${t.type}`} style={{ textAlign: 'right' }}>{t.type === 'income' ? '+' : '-'}${t.amount.toFixed(2)}</div>
                            </li>
                        );
                    })}
                    {visibleTransactions.length < sortedTransactions.length && (
                        <div style={{ padding: '10px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading more...</div>
                    )}
                </ul>

                {/* Footer Total */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', padding: '15px 10px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)', fontWeight: 'bold' }}>
                    <div>Total</div>
                    <div></div>
                    <div></div>
                    <div style={{ textAlign: 'right' }}>${totalActivitySum.toFixed(2)}</div>
                </div>
            </section>

            {/* CUSTOM DATE MODAL */}
            {showCustomDateModal && (
                <div className="modal-overlay">
                    <div className="modal glass-panel bounce-in" style={{ width: '320px' }}>
                        <div className="modal-header"><h3>Select Range</h3><button className="close-modal" onClick={() => { setShowCustomDateModal(false); }}><i className="fa-solid fa-xmark"></i></button></div>
                        <form onSubmit={applyCustomDate} className="modal-body">
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '15px', textAlign: 'center' }}>Select Start, End, or Both</div>
                            <DateInput label="Start Date (Min)" name="start" />
                            <DateInput label="End Date (Max)" name="end" />
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
                                    style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', cursor: 'pointer', background: tempSelectedCats.find(c => c._id === cat._id) ? 'rgba(255,255,255,0.1)' : 'transparent', border: '1px solid rgba(255,255,255,0.05)' }}>
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
