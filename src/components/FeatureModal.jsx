import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = ['Not Started', 'On Going', 'Done', 'Blocked'];
const STATUS_LABELS = {
    'Not Started': 'Não Iniciado',
    'On Going': 'Em Andamento',
    'Done': 'Concluído',
    'Blocked': 'Bloqueado',
};

export default function FeatureModal({ feature, onSave, onDelete, onClose, boardTags = [] }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Not Started');
    const [selectedTags, setSelectedTags] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [newTagName, setNewTagName] = useState('');
    const [newTagColor, setNewTagColor] = useState('#3498db');

    useEffect(() => {
        if (feature) {
            setTitle(feature.title || '');
            setDescription(feature.description || '');
            setStatus(feature.status || 'Not Started');
            setSelectedTags(feature.tags || []);
            setStartDate(feature.startDate || '');
            setEndDate(feature.endDate || '');
        }
    }, [feature]);

    const handleToggleTag = (tag) => {
        const exists = selectedTags.find(t => t.name === tag.name);
        if (exists) {
            setSelectedTags(selectedTags.filter(t => t.name !== tag.name));
        } else {
            setSelectedTags([...selectedTags, { name: tag.name, color: tag.color }]);
        }
    };

    const handleAddInlineTag = () => {
        if (!newTagName.trim()) return;
        if (selectedTags.find(t => t.name === newTagName.trim())) return;
        setSelectedTags([...selectedTags, { name: newTagName.trim(), color: newTagColor }]);
        setNewTagName('');
        setNewTagColor('#3498db');
    };

    const handleRemoveTag = (idx) => {
        setSelectedTags(selectedTags.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
        if (!title.trim() || !startDate || !endDate) return;
        onSave({
            title: title.trim(),
            description,
            status,
            tags: selectedTags,
            startDate,
            endDate,
        });
    };

    const isEdit = feature && feature.id;

    // Separate available tags (from board) that are not already selected
    const availableTags = boardTags.filter(bt => !selectedTags.find(st => st.name === bt.name));

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>{isEdit ? 'Editar Iniciativa' : 'Nova Iniciativa'}</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="modal-body">
                    <div className="form-group">
                        <label>Título *</label>
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Título da iniciativa"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Descrição</label>
                        <textarea
                            className="glass-textarea"
                            placeholder="Descreva a iniciativa..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>

                    <div className="form-group">
                        <label>Status</label>
                        <select
                            className="glass-select"
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                        >
                            {STATUS_OPTIONS.map(s => (
                                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Tags</label>

                        {/* Selected tags */}
                        {selectedTags.length > 0 && (
                            <div className="tags-list" style={{ marginBottom: '8px' }}>
                                {selectedTags.map((tag, idx) => (
                                    <span
                                        key={idx}
                                        className="tag"
                                        style={{
                                            background: `${tag.color}22`,
                                            color: tag.color,
                                            border: `1px solid ${tag.color}44`,
                                        }}
                                    >
                                        {tag.name}
                                        <span className="tag-remove" onClick={() => handleRemoveTag(idx)}><X size={12} /></span>
                                    </span>
                                ))}
                            </div>
                        )}

                        {/* Available board tags to pick from */}
                        {availableTags.length > 0 && (
                            <div style={{ marginBottom: '8px' }}>
                                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                                    Tags disponíveis (clique para adicionar):
                                </span>
                                <div className="tags-list">
                                    {availableTags.map((tag) => (
                                        <span
                                            key={tag.id || tag.name}
                                            className="tag tag-pickable"
                                            style={{
                                                background: `${tag.color}11`,
                                                color: tag.color,
                                                border: `1px dashed ${tag.color}44`,
                                                cursor: 'pointer',
                                            }}
                                            onClick={() => handleToggleTag(tag)}
                                        >
                                            + {tag.name}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Create new inline tag */}
                        <div className="tags-input-row">
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Criar tag nova"
                                value={newTagName}
                                onChange={(e) => setNewTagName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddInlineTag())}
                            />
                            <input
                                type="color"
                                className="tag-color-input"
                                value={newTagColor}
                                onChange={(e) => setNewTagColor(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={handleAddInlineTag} style={{ flexShrink: 0 }}>
                                Adicionar
                            </button>
                        </div>
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label>Data de Início *</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                            />
                        </div>
                        <div className="form-group">
                            <label>Data de Término *</label>
                            <input
                                type="date"
                                className="glass-input"
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="modal-footer">
                    <div>
                        {isEdit && onDelete && (
                            <button className="btn btn-danger" onClick={() => onDelete(feature.id)}>
                                <Trash2 size={16} /> Excluir
                            </button>
                        )}
                    </div>
                    <div className="modal-footer-right">
                        <button className="btn btn-glass" onClick={onClose}>Cancelar</button>
                        <button className="btn btn-primary" onClick={handleSave}>Salvar</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
