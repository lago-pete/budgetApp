import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';

function TransactionModal({ onClose, onSubmitSuccess, initialData = null, onManageCategories }) {
    const { user } = React.useContext(AuthContext); // Get user setting
    const [type, setType] = useState(initialData?.type || 'expense');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [date, setDate] = useState(initialData?.date ? initialData.date.substring(0, 10) : (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    })());
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(initialData?.proofUrl ? `${initialData.proofUrl}` : null);
    const [isDragging, setIsDragging] = useState(false);
    const [pastTitles, setPastTitles] = useState([]);
    const [useTemplates, setUseTemplates] = useState(true);
    const [allTransactions, setAllTransactions] = useState([]);

    const pickerRef = React.useRef(null);

    useEffect(() => {
        Promise.all([
            axios.get('/api/categories'),
            axios.get('/api/transactions'), // Fetch for title history
            axios.get('/api/auth') // Get user settings
        ]).then(([catRes, txRes, userRes]) => {
            setCategories(catRes.data);
            setAllTransactions(txRes.data);
            setUseTemplates(userRes.data.useTransactionTemplates ?? true);

            // Extract unique titles
            const titles = [...new Set(txRes.data.map(t => t.title))];
            setPastTitles(titles.slice(0, 20)); // Limit to 20

            if (!initialData && !selectedCategory && catRes.data.length > 0) {
                const firstMatch = catRes.data.find(c => c.type === type);
                // Don't auto-select, let user pick. Or auto-select first? User said "category should be button of all categories"
            }
        }).catch(err => console.error(err));
    }, []);

    // Auto-fill from template when title changes
    useEffect(() => {
        if (!useTemplates || !title || initialData) return;

        // Find the most recent transaction with this title
        const matchingTx = allTransactions
            .filter(tx => tx.title.toLowerCase() === title.toLowerCase())
            .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (matchingTx) {
            setAmount(matchingTx.amount);
            setSelectedCategory(matchingTx.category);
            setType(matchingTx.type);
            if (matchingTx.notes) setNotes(matchingTx.notes);
        }
    }, [title, useTemplates, allTransactions, initialData]);

    const handleFileDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type.startsWith('image/')) {
            setFile(droppedFile);
            setPreviewUrl(URL.createObjectURL(droppedFile));
        }
    };

    const handleFileSelect = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setPreviewUrl(URL.createObjectURL(selected));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        let proofUrl = initialData?.proofUrl || '';
        if (file) {
            const formData = new FormData();
            formData.append('proofImage', file);
            try {
                const uploadRes = await axios.post('/api/uploads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                proofUrl = uploadRes.data.filePath;
            } catch (err) { return; }
        }

        const payload = {
            title: title || selectedCategory || 'Untitled',
            amount: parseFloat(amount),
            type,
            category: selectedCategory || (type === 'income' ? 'Salary' : 'Uncategorized'), // Fallback
            proofUrl,
            notes,
            date
        };

        try {
            if (initialData) {
                await axios.put(`/api/transactions/${initialData._id}`, payload);
            } else {
                await axios.post('/api/transactions', payload);
            }
            onSubmitSuccess();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async () => {
        try {
            await axios.delete(`/api/transactions/${initialData._id}`);
            onSubmitSuccess();
        } catch (err) { console.error(err); }
    };

    const relevantCategories = categories.filter(c => c.type === type);

    // Removed nested DateInput component to fix focus loss issue
    // The input is now rendered directly in the return statement

    return (
        <div className="modal-overlay">
            <div
                className="modal glass-panel bounce-in"
                style={{ maxWidth: '500px', display: 'flex', flexDirection: 'column' }}
            >
                {/* HEADER */}
                <div className="modal-header">
                    <h3>{initialData ? 'Edit Transaction' : 'Add Transaction'}</h3>
                    <button className="close-modal" onClick={onClose}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>

                {/* BODY */}
                <div
                    className="modal-body"
                    style={{ overflowY: 'auto', maxHeight: '80vh' }}
                >
                    <form
                        onSubmit={handleSubmit}
                        style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}
                    >
                        {/* TYPE TOGGLE */}
                        <div className="toggle-switch full-width">
                            <input
                                type="radio"
                                id="t-expense"
                                name="type"
                                value="expense"
                                checked={type === 'expense'}
                                onChange={() => {
                                    setType('expense');
                                    setSelectedCategory('');
                                }}
                            />
                            <label htmlFor="t-expense">Expense</label>

                            <input
                                type="radio"
                                id="t-income"
                                name="type"
                                value="income"
                                checked={type === 'income'}
                                onChange={() => {
                                    setType('income');
                                    setSelectedCategory('');
                                }}
                            />
                            <label htmlFor="t-income">Income</label>
                        </div>

                        {/* DATE & AMOUNT */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                            <div className="form-group">
                                <label>Date</label>
                                <div style={{ position: 'relative' }}>
                                    <input
                                        type="text"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        required
                                        style={{ width: '100%', paddingRight: '40px' }}
                                    />
                                    <i
                                        className="fa-regular fa-calendar"
                                        onClick={() => pickerRef.current.showPicker()}
                                        style={{
                                            position: 'absolute',
                                            right: '15px',
                                            top: '50%',
                                            transform: 'translateY(-50%)',
                                            cursor: 'pointer',
                                            color: 'var(--primary)'
                                        }}
                                    />
                                    <input
                                        type="date"
                                        ref={pickerRef}
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        style={{ position: 'absolute', opacity: 0, width: 0, height: 0 }}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Amount</label>
                                <input
                                    type="number"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    required
                                    step="0.01"
                                />
                            </div>
                        </div>

                        {/* TITLE */}
                        <div className="form-group">
                            <label>Title</label>
                            <input
                                type="text"
                                list="title-suggestions"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder={selectedCategory ? selectedCategory : "defaults to selected category"}
                            />
                            <datalist id="title-suggestions">
                                {pastTitles.map((t, i) => (
                                    <option key={i} value={t} />
                                ))}
                            </datalist>
                        </div>

                        {/* CATEGORY */}
                        <div className="form-group">
                            <label>Category</label>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
                                {relevantCategories.map(cat => (
                                    <button
                                        type="button"
                                        key={cat._id}
                                        onClick={() => setSelectedCategory(cat.name)}
                                        style={{
                                            flex: '1 1 auto',
                                            background:
                                                selectedCategory === cat.name
                                                    ? cat.color
                                                    : 'rgba(255,255,255,0.05)',
                                            border:
                                                selectedCategory === cat.name
                                                    ? `2px solid ${cat.color}`
                                                    : '1px solid rgba(255,255,255,0.1)',
                                            color: 'white',
                                            padding: '8px 12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            fontSize: '0.9rem',
                                            transition: 'all 0.2s ease',
                                            boxShadow:
                                                selectedCategory === cat.name
                                                    ? `0 0 10px ${cat.color}40`
                                                    : 'none'
                                        }}
                                    >
                                        {cat.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* NOTES */}
                        <div className="form-group">
                            <label>Notes</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows="2"
                                style={{
                                    width: '100%',
                                    background: 'rgba(255,255,255,0.05)',
                                    border: 'none',
                                    padding: '10px',
                                    color: 'white',
                                    borderRadius: '8px'
                                }}
                            />
                        </div>

                        {/* RECEIPT */}
                        <div className="form-group">
                            <label>Receipt / Proof</label>
                            <div
                                onDragOver={e => {
                                    e.preventDefault();
                                    setIsDragging(true);
                                }}
                                onDragLeave={() => setIsDragging(false)}
                                onDrop={handleFileDrop}
                                onClick={() => document.getElementById('file-upload').click()}
                                style={{
                                    border: isDragging
                                        ? '2px dashed var(--primary)'
                                        : '2px dashed rgba(255,255,255,0.1)',
                                    background: isDragging
                                        ? 'rgba(76, 201, 240, 0.1)'
                                        : 'rgba(255,255,255,0.02)',
                                    borderRadius: '10px',
                                    padding: '20px',
                                    textAlign: 'center',
                                    cursor: 'pointer'
                                }}
                            >
                                <input
                                    type="file"
                                    id="file-upload"
                                    onChange={handleFileSelect}
                                    accept="image/*"
                                    style={{ display: 'none' }}
                                />

                                {previewUrl ? (
                                    <img
                                        src={previewUrl}
                                        alt="Preview"
                                        style={{ maxHeight: '100px', borderRadius: '5px' }}
                                    />
                                ) : (
                                    <span>Click or Drag Receipt Here</span>
                                )}
                            </div>
                        </div>

                        {/* ACTIONS */}
                        <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                            <button type="submit" className="btn-primary full-width">
                                {initialData ? 'Update Transaction' : 'Save Transaction'}
                            </button>

                            {initialData && (
                                <button
                                    type="button"
                                    onClick={handleDelete}
                                    className="btn-danger"
                                    style={{ width: '60px', background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', borderRadius: '10px', cursor: 'pointer' }}
                                >
                                    <i className="fa-solid fa-trash"></i>
                                </button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TransactionModal;
