import { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';

const STATUS_OPTIONS = ['Not Started', 'On Going', 'Done', 'Blocked'];
const STATUS_LABELS = {
    'Not Started': 'Não Iniciado',
    'On Going': 'Em Andamento',
    'Done': 'Concluído',
    'Blocked': 'Bloqueado',
};

export default function FeatureModal({ feature, onSave, onDelete, onClose }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [status, setStatus] = useState('Not Started');
    const [tags, setTags] = useState([]);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [tagName, setTagName] = useState('');
    const [tagColor, setTagColor] = useState('#3498db');

    useEffect(() => {
        if (feature) {
            setTitle(feature.title || '');
            setDescription(feature.description || '');
            setStatus(feature.status || 'Not Started');
            setTags(feature.tags || []);
            setStartDate(feature.startDate || '');
            setEndDate(feature.endDate || '');
        }
    }, [feature]);

    const handleAddTag = () => {
        if (!tagName.trim()) return;
        setTags([...tags, { name: tagName.trim(), color: tagColor }]);
        setTagName('');
        setTagColor('#3498db');
    };

    const handleRemoveTag = (idx) => {
        setTags(tags.filter((_, i) => i !== idx));
    };

    const handleSave = () => {
        if (!title.trim() || !startDate || !endDate) return;
        onSave({
            title: title.trim(),
            description,
            status,
            tags,
            startDate,
            endDate,
        });
    };

    const isEdit = feature && feature.id;

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
                        <div className="tags-input-row">
                            <input
                                type="text"
                                className="glass-input"
                                placeholder="Nome da tag"
                                value={tagName}
                                onChange={(e) => setTagName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                            />
                            <input
                                type="color"
                                className="tag-color-input"
                                value={tagColor}
                                onChange={(e) => setTagColor(e.target.value)}
                            />
                            <button className="btn btn-primary" onClick={handleAddTag} style={{ flexShrink: 0 }}>
                                Adicionar
                            </button>
                        </div>
                        {tags.length > 0 && (
                            <div className="tags-list">
                                {tags.map((tag, idx) => (
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
