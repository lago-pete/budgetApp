import React, { useState, useEffect } from 'react';
import axios from 'axios';

function ManageCategoriesModal({ onClose }) {
    const [categories, setCategories] = useState([]);
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
            const res = await axios.get('/api/categories');
            setCategories(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        const duplicateExists = categories.some(
            cat => cat.name.toLowerCase() === newName.toLowerCase()
        );

        if (duplicateExists) {
            alert(`Category "${newName}" already exists!`);
            return;
        }

        try {
            await axios.post('/api/categories', {
                name: newName,
                type: newType,
                color: newColor
            });
            setNewName('');
            await fetchCategories();
        } catch (err) {
            alert('Failed to create category');
        }
    };

    const handleUpdate = async (id) => {
        const duplicateExists = categories.some(
            cat => cat._id !== id && cat.name.toLowerCase() === editName.toLowerCase()
        );

        if (duplicateExists) {
            alert(`Category "${editName}" already exists!`);
            return;
        }

        try {
            await axios.put(`/api/categories/${id}`, {
                name: editName,
                color: editColor
            });
            setEditingId(null);
            await fetchCategories();
        } catch (err) {
            alert(`Update failed: ${err.response?.data?.msg || err.message}`);
        }
    };

    const handleDelete = async (id) => {
        try {
            await axios.delete(`/api/categories/${id}`);
            await fetchCategories();
        } catch (err) {
            alert('Delete failed');
        }
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
                    <form onSubmit={handleCreate} className="category-create-form">
                        <div className="section-heading section-heading-tight">
                            <div>
                                <h4>Add New</h4>
                                <p>Create income or expense categories with a clear accent color.</p>
                            </div>
                        </div>

                        <div className="category-form-row" style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Category name" required style={{ width: '100%' }} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <select value={newType} onChange={e => setNewType(e.target.value)}>
                                    <option value="expense">Expense</option>
                                    <option value="income">Income</option>
                                </select>
                            </div>
                            <input type="color" value={newColor} onChange={e => setNewColor(e.target.value)} className="category-color-input" style={{ width: '50px', height: '45px', padding: 0 }} />
                            <button className="btn-primary" type="submit">Add</button>
                        </div>
                    </form>

                    <div className="category-list">
                        {categories.map(cat => (
                            <div key={cat._id} className="transaction-item category-row">
                                {editingId === cat._id ? (
                                    <div className="category-edit-row" style={{ display: 'flex', gap: '10px', alignItems: 'center', width: '100%' }}>
                                        <div className="form-group" style={{ marginBottom: 0, flex: 1 }}>
                                            <input value={editName} onChange={e => setEditName(e.target.value)} style={{ width: '100%' }} />
                                        </div>
                                        <input type="color" value={editColor} onChange={e => setEditColor(e.target.value)} className="category-color-input" style={{ width: '40px', height: '40px', padding: 0 }} />
                                        <button type="button" className="icon-action success" onClick={() => handleUpdate(cat._id)}>
                                            <i className="fa-solid fa-check"></i>
                                        </button>
                                        <button type="button" className="icon-action" onClick={() => setEditingId(null)}>
                                            <i className="fa-solid fa-xmark"></i>
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        <div className="category-info">
                                            <div className="category-dot" style={{ background: cat.color }}></div>
                                            <span>{cat.name}</span>
                                            <span className="category-type">({cat.type})</span>
                                        </div>
                                        <div className="category-actions">
                                            <button type="button" className="icon-action" onClick={() => startEdit(cat)}>
                                                <i className="fa-solid fa-pen"></i>
                                            </button>
                                            <button type="button" className="icon-action danger" onClick={() => handleDelete(cat._id)}>
                                                <i className="fa-solid fa-trash"></i>
                                            </button>
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
