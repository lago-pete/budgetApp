import React, { useState, useEffect } from 'react';
import axios from 'axios';

import { AuthContext } from '../context/AuthContext';

function ManageCategoriesModal({ onClose, onBack }) {
    const { user } = React.useContext(AuthContext);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');

    const [newName, setNewName] = useState('');
    const [newType, setNewType] = useState('expense');
    const [newColor, setNewColor] = useState('#ff0000');

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        try {
            const token = localStorage.getItem('token');
            const res = await axios.get('/api/categories', { headers: { 'x-auth-token': token } });
            setCategories(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        // Check for duplicate category name (case-insensitive)
        const duplicateExists = categories.some(
            cat => cat.name.toLowerCase() === newName.toLowerCase()
        );

        if (duplicateExists) {
            alert(`Category "${newName}" already exists!`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('/api/categories', {
                name: newName, type: newType, color: newColor
            }, { headers: { 'x-auth-token': token } });
            setNewName('');
            fetchCategories();
        } catch (err) { alert("Failed"); }
    };

    const handleUpdate = async (id) => {
        // Check for duplicate category name (case-insensitive), excluding current category
        const duplicateExists = categories.some(
            cat => cat._id !== id && cat.name.toLowerCase() === editName.toLowerCase()
        );

        if (duplicateExists) {
            alert(`Category "${editName}" already exists!`);
            return;
        }

        try {
            const token = localStorage.getItem('token');
            await axios.put(`/api/categories/${id}`, {
                name: editName, color: editColor
            }, { headers: { 'x-auth-token': token } });
            setEditingId(null);
            // Wait a bit or optimistic?
            fetchCategories();
        } catch (err) { alert("Update failed: " + (err.response?.data?.msg || err.message)); }
    };

    const handleDelete = async (id) => {
        if (user?.verifyToDelete && !window.confirm("Delete? Transactions moved to 'Uncategorized'.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`/api/categories/${id}`, { headers: { 'x-auth-token': token } });
            fetchCategories();
        } catch (err) { alert("Delete failed"); }
    };

    const startEdit = (cat) => {
        setEditingId(cat._id);
        setEditName(cat.name);
        setEditColor(cat.color);
    };

    return (
        <div className="modal-overlay">
            <div className="modal glass-panel bounce-in" style={{ maxWidth: '600px' }}>
                <div className="modal-header">
                    <h3>Manage Categories</h3>
                    <button className="close-modal" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
                </div>
                <div className="modal-body">

                    <form onSubmit={handleCreate} style={{ marginBottom: '20px', paddingBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                        <h4>Add New</h4>
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" required style={{ flex: 1 }} />
                            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden', flexShrink: 0 }} />
                            <button className="btn-primary" type="submit">Add</button>
                        </div>
                    </form>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {categories.map(cat => (
                            <div key={cat._id} className="transaction-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
                                {editingId === cat._id ? (
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} />
                                        <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} style={{ width: '28px', height: '28px', padding: 0, border: 'none', borderRadius: '50%', cursor: 'pointer', overflow: 'hidden' }} />
                                        <button className="btn-success" onClick={() => handleUpdate(cat._id)} style={{ background: 'var(--success)', border: 'none', borderRadius: '5px', color: 'white', width: '30px', cursor: 'pointer' }}><i className="fa-solid fa-check"></i></button>
                                        <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ width: '30px', cursor: 'pointer' }}><i className="fa-solid fa-xmark"></i></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: cat.color }}></div>
                                            <span>{cat.name}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({cat.type})</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button className="btn-secondary" onClick={() => startEdit(cat)} style={{ padding: '5px', cursor: 'pointer' }}><i className="fa-solid fa-pen"></i></button>
                                            <button className="btn-danger" onClick={() => handleDelete(cat._id)} style={{ background: 'rgba(255,59,48,0.2)', color: 'var(--danger)', padding: '5px', border: 'none', cursor: 'pointer' }}><i className="fa-solid fa-trash"></i></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                </div>
            </div>
        </div>
    );
}

export default ManageCategoriesModal;
