import React, { useState, useEffect } from 'react';
import axios from 'axios';

function TransactionModal({ onClose, onSubmitSuccess }) {
    const [type, setType] = useState('expense');
    const [amount, setAmount] = useState('');
    const [categories, setCategories] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [title, setTitle] = useState('');
    const [file, setFile] = useState(null);

    useEffect(() => {
        // Fetch categories
        axios.get('http://localhost:5000/api/categories')
            .then(res => {
                setCategories(res.data);
                if (res.data.length > 0) setSelectedCategory(res.data[0].name);
            })
            .catch(err => console.error(err));
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();

        let proofUrl = '';
        if (file) {
            const formData = new FormData();
            formData.append('proofImage', file);
            try {
                const uploadRes = await axios.post('http://localhost:5000/api/uploads', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                proofUrl = uploadRes.data.filePath;
            } catch (err) {
                console.error("Upload failed", err);
                alert("Image upload failed");
                return;
            }
        }

        try {
            await axios.post('http://localhost:5000/api/transactions', {
                title: title || selectedCategory,
                amount: parseFloat(amount),
                type,
                category: selectedCategory,
                proofUrl
            });
            onSubmitSuccess();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal glass-panel bounce-in">
                <div className="modal-header">
                    <h3>Add New Transaction</h3>
                    <button className="close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="modal-body">
                    <form onSubmit={handleSubmit}>
                        <div className="form-group">
                            <label>Type</label>
                            <div className="toggle-switch">
                                <input
                                    type="radio" id="type-expense" name="type" value="expense"
                                    checked={type === 'expense'} onChange={() => setType('expense')}
                                />
                                <label htmlFor="type-expense">Expense</label>

                                <input
                                    type="radio" id="type-income" name="type" value="income"
                                    checked={type === 'income'} onChange={() => setType('income')}
                                />
                                <label htmlFor="type-income">Income</label>
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Title (Optional)</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Weekly Groceries" />
                        </div>

                        <div className="form-group">
                            <label>Amount</label>
                            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" required />
                        </div>

                        <div className="form-group">
                            <label>Category</label>
                            <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
                                {categories.filter(c => c.type === type).map(c => (
                                    <option key={c._id} value={c.name}>{c.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label>Proof / Receipt (Image)</label>
                            <input type="file" onChange={e => setFile(e.target.files[0])} accept="image/*" style={{ padding: '5px' }} />
                        </div>

                        <button type="submit" className="btn-primary full-width">Save Transaction</button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default TransactionModal;
