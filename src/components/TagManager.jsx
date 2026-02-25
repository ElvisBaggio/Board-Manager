import { useState, useEffect } from 'react';
import { X, Edit2, Trash2, Plus } from 'lucide-react';

export default function TagManager({ boardId, onClose }) {
    const [tags, setTags] = useState([]);
    const [newName, setNewName] = useState('');
    const [newColor, setNewColor] = useState('#3498db');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editColor, setEditColor] = useState('');
    const [loading, setLoading] = useState(true);

    const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

    const fetchTags = async () => {
        try {
            const res = await fetch(`/api/tags?boardId=${boardId}`);
            const data = await res.json();
            setTags(data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTags(); }, [boardId]);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        const id = genId();
        try {
            await fetch('/api/tags', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, boardId, name: newName.trim(), color: newColor }),
            });
            setNewName('');
            setNewColor('#3498db');
            fetchTags();
        } catch (e) {
            console.error(e);
        }
    };

    const handleUpdate = async (id) => {
        if (!editName.trim()) return;
        try {
            await fetch(`/api/tags/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editName.trim(), color: editColor }),
            });
            setEditingId(null);
            fetchTags();
        } catch (e) {
            console.error(e);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Excluir esta tag?')) return;
        try {
            await fetch(`/api/tags/${id}`, { method: 'DELETE' });
            fetchTags();
        } catch (e) {
            console.error(e);
        }
    };

    const startEdit = (tag) => {
        setEditingId(tag.id);
        setEditName(tag.name);
        setEditColor(tag.color);
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
                <div className="modal-header">
                    <h2>Gerenciar Tags</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    {/* Create new tag */}
                    <div className="tag-create-row">
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Nome da tag"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                        />
                        <input
                            type="color"
                            className="tag-color-input"
                            value={newColor}
                            onChange={(e) => setNewColor(e.target.value)}
                        />
                        <button className="btn btn-primary" onClick={handleCreate}>
                            <Plus size={14} /> Criar
                        </button>
                    </div>

                    {/* Tags list */}
                    <div className="tag-manager-list">
                        {loading ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                Carregando...
                            </div>
                        ) : tags.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                                Nenhuma tag criada ainda.
                            </div>
                        ) : (
                            tags.map(tag => (
                                <div key={tag.id} className="tag-manager-item">
                                    {editingId === tag.id ? (
                                        <div className="tag-edit-row">
                                            <input
                                                type="text"
                                                className="glass-input"
                                                value={editName}
                                                onChange={(e) => setEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdate(tag.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                autoFocus
                                                style={{ flex: 1 }}
                                            />
                                            <input
                                                type="color"
                                                className="tag-color-input"
                                                value={editColor}
                                                onChange={(e) => setEditColor(e.target.value)}
                                            />
                                            <button className="btn btn-primary" onClick={() => handleUpdate(tag.id)} style={{ fontSize: '0.78rem' }}>
                                                Salvar
                                            </button>
                                            <button className="btn btn-glass" onClick={() => setEditingId(null)} style={{ fontSize: '0.78rem' }}>
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="tag-manager-info">
                                                <span
                                                    className="tag"
                                                    style={{
                                                        background: `${tag.color}22`,
                                                        color: tag.color,
                                                        border: `1px solid ${tag.color}44`,
                                                    }}
                                                >
                                                    {tag.name}
                                                </span>
                                            </div>
                                            <div className="tag-manager-actions">
                                                <button className="btn-icon" onClick={() => startEdit(tag)} title="Editar">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button className="btn-icon" onClick={() => handleDelete(tag.id)} title="Excluir" style={{ color: 'var(--danger)' }}>
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>

                <div className="modal-footer">
                    <div />
                    <div className="modal-footer-right">
                        <button className="btn btn-glass" onClick={onClose}>Fechar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
