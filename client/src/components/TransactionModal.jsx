import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TransactionModal({ onClose, onSubmitSuccess, initialData = null }) {
    const [type, setType] = useState(initialData?.type || 'expense');
    const [amount, setAmount] = useState(initialData?.amount || '');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
    const [title, setTitle] = useState(initialData?.title || '');
    const [notes, setNotes] = useState(initialData?.notes || '');
    const [date, setDate] = useState(initialData?.date ? initialData.date.substring(0, 10) : new Date().toISOString().substring(0, 10));
    const [file, setFile] = useState(null);

    // Template State
    const [templates, setTemplates] = useState([]);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    useEffect(() => {
        // Fetch categories and templates
        Promise.all([
            axios.get('http://localhost:5000/api/categories'),
            axios.get('http://localhost:5000/api/users/templates')
        ]).then(([catRes, tempRes]) => {
            setCategories(catRes.data);
            setTemplates(tempRes.data);

            // Initial category selection if adding new
            if (!initialData && !selectedCategory && catRes.data.length > 0) {
                const firstMatch = catRes.data.find(c => c.type === type);
                if (firstMatch) setSelectedCategory(firstMatch.name);
            }
        })
            .catch(err => console.error(err));
    }, []);

    const handleTemplateSelect = (e) => {
        const tId = e.target.value;
        setSelectedTemplateId(tId);
        if (!tId) return;

        const temp = templates.find(t => t._id === tId);
        if (temp) {
            setTitle(temp.title);
            setAmount(temp.amount);
            setType(temp.type);
            setSelectedCategory(temp.category);
            // Note: we don't save dates in templates usually, but could.
        }
    };

    const saveAsTemplate = async () => {
        const name = prompt("Enter a name for this preset (e.g. 'Gym Membership'):", title);
        if (!name) return;
        try {
            const res = await axios.post('http://localhost:5000/api/users/templates', {
                name, title, amount, type, category: selectedCategory
            });
            setTemplates(res.data);
            alert("Preset saved!");
        } catch (err) { alert("Failed to save preset"); }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        let proofUrl = initialData?.proofUrl || '';
        if (file) {
            const formData = new FormData();
            formData.append('proofImage', file);
            try {
                const uploadRes = await axios.post('http://localhost:5000/api/uploads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                proofUrl = uploadRes.data.filePath;
            } catch (err) { return; }
        }

        const payload = {
            title: title || selectedCategory,
            amount: parseFloat(amount),
            type,
            category: selectedCategory,
            proofUrl,
            notes,
            date
        };

        try {
            if (initialData) {
                await axios.put(`http://localhost:5000/api/transactions/${initialData._id}`, payload);
            } else {
                await axios.post('http://localhost:5000/api/transactions', payload);
            }
            onSubmitSuccess();
        } catch (err) { console.error(err); }
    };

    const handleDelete = async () => {
        if (!window.confirm("Delete this transaction?")) return;
        try {
            await axios.delete(`http://localhost:5000/api/transactions/${initialData._id}`);
            onSubmitSuccess();
        } catch (err) { console.error(err); }
    };

    return (
        <div className="modal-overlay">
            <div className="modal glass-panel bounce-in">
                <div className="modal-header">
                    <h3>{initialData ? 'Edit Transaction' : 'Add New Transaction'}</h3>
                    <button className="close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="modal-body">

                    {/* Template Selector (Only on Add) */}
                    {!initialData && (
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '5px', marginBottom: '15px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <i className="fa-solid fa-bolt" style={{ color: 'var(--accent-secondary)' }}></i>
                            <select value={selectedTemplateId} onChange={handleTemplateSelect} style={{ flex: 1, background: 'transparent', border: 'none', color: 'white' }}>
                                <option value="">Quick Fill from Preset...</option>
                                {templates.map(t => <option key={t._id} value={t._id}>{t.name} - ${t.amount}</option>)}
                            </select>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Type</label>
                            <div className="toggle-switch">
                                <input
                                    type="radio" id="type-expense" name="type" value="expense"
                                    checked={type === 'expense'} onChange={() => { setType('expense'); setSelectedCategory(''); }}
                                    disabled={!!initialData}
                                />
                                <label htmlFor="type-expense">Expense</label>

                                <input
                                    type="radio" id="type-income" name="type" value="income"
                                    checked={type === 'income'} onChange={() => { setType('income'); setSelectedCategory(''); }}
                                    disabled={!!initialData}
                                />
                                <label htmlFor="type-income">Income</label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Date</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', padding: '10px', borderRadius: '5px', width: '100%' }} />
                        </div>

                        <div className="form-group">
                            <label>Title</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Groceries" />
                        </div>

                        <div className="form-group">
                            <label>Amount</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)} required>
                                <option value="">Select Category</option>
                                {categories.filter(c => c.type === type).map(c => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Notes (Optional)</label>
                            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows="2" style={{ width: '100%', background: 'rgba(255,255,255,0.1)', border: 'none', padding: '10px', color: 'white', borderRadius: '5px' }} />
                        </div>

                        <div className="form-group">
                            <label>Proof / Receipt</label>
                            <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" />
                        </div>

                        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
                            <button type="submit" className="btn-primary full-width">{initialData ? 'Update' : 'Save'}</button>

                            {initialData ? (
                                <button type="button" onClick={handleDelete} className="btn-danger" style={{ background: 'var(--danger)', color: 'white', border: 'none', borderRadius: '5px', width: '100px' }}>Delete</button>
                            ) : (
                                <button type="button" onClick={saveAsTemplate} className="btn-secondary" title="Save as Preset" style={{ width: '50px' }}><i className="fa-solid fa-floppy-disk"></i></button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TransactionModal;
