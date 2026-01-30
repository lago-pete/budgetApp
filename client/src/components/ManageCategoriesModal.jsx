import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageCategoriesModal({ onClose }) {
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
            const res = await axios.get('http://localhost:5000/api/categories', { headers: { 'x-auth-token': token } });
            setCategories(res.data);
            setLoading(false);
        } catch (err) { console.error(err); setLoading(false); }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/categories', {
                name: newName, type: newType, color: newColor
            }, { headers: { 'x-auth-token': token } });
            setNewName('');
            fetchCategories();
        } catch (err) { alert("Failed"); }
    };

    const handleUpdate = async (id) => {
        try {
            const token = localStorage.getItem('token');
            await axios.put(`http://localhost:5000/api/categories/${id}`, {
                name: editName, color: editColor
            }, { headers: { 'x-auth-token': token } });
            setEditingId(null);
            // Wait a bit or optimistic?
            fetchCategories();
        } catch (err) { alert("Update failed: " + (err.response?.data?.msg || err.message)); }
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Delete? Transactions moved to 'Other'.")) return;
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`http://localhost:5000/api/categories/${id}`, { headers: { 'x-auth-token': token } });
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
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" required style={{ flex: 1 }} />
                            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ width: '100px', background: 'rgba(0,0,0,0.3)', color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
                                <option value="expense">Expense</option>
                                <option value="income">Income</option>
                            </select>
                            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} style={{ width: '50px', padding: 0, border: 'none', height: '40px' }} />
                            <button className="btn-primary" type="submit">Add</button>
                        </div>
                    </form>

                    <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {categories.map(cat => (
                            <div key={cat._id} className="transaction-item" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px' }}>
                                {editingId === cat._id ? (
                                    <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                                        <input value={editName} onChange={e => setEditName(e.target.value)} style={{ flex: 1 }} />
                                        <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} />
                                        <button className="btn-success" onClick={() => handleUpdate(cat._id)} style={{ background: 'var(--success)', border: 'none', borderRadius: '5px', color: 'white', width: '30px' }}><i className="fa-solid fa-check"></i></button>
                                        <button className="btn-secondary" onClick={() => setEditingId(null)} style={{ width: '30px' }}><i className="fa-solid fa-xmark"></i></button>
                                    </div>
                                ) : (
                                    <>
                                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                                            <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: cat.color }}></div>
                                            <span>{cat.name}</span>
                                            <span style={{ fontSize: '0.7rem', opacity: 0.6 }}>({cat.type})</span>
                                        </div>
                                        <div style={{ display: 'flex', gap: '5px' }}>
                                            <button className="btn-secondary" onClick={() => startEdit(cat)} style={{ padding: '5px' }}><i className="fa-solid fa-pen"></i></button>
                                            <button className="btn-danger" onClick={() => handleDelete(cat._id)} style={{ background: 'rgba(255,59,48,0.2)', color: 'var(--danger)', padding: '5px', border: 'none' }}><i className="fa-solid fa-trash"></i></button>
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
