import { useState } from 'react';
import { X, Plus, Trash2, Edit3, Users } from 'lucide-react';
import { useTeamMembers } from '../hooks/useResources';
import { useToast } from '../context/ToastContext';
import ConfirmDialog from './ConfirmDialog';

const AVATAR_COLORS = ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];

/**
 * Team Manager modal — CRUD for team members and their capacity.
 */
export default function TeamManager({ planId, onClose }) {
    const { members, createMember, updateMember, deleteMember } = useTeamMembers(planId);
    const { addToast } = useToast();
    const [showForm, setShowForm] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', roleTitle: '', avatarColor: AVATAR_COLORS[0], capacityHoursPerQuarter: 480 });
    const [confirmState, setConfirmState] = useState(null);

    const handleSubmit = () => {
        if (!form.name.trim()) return;
        if (editing) {
            updateMember(editing.id, form);
            addToast(`Membro "${form.name.trim()}" atualizado.`, 'success');
        } else {
            createMember(form);
            addToast(`Membro "${form.name.trim()}" adicionado ao time.`, 'success');
        }
        setForm({ name: '', roleTitle: '', avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], capacityHoursPerQuarter: 480 });
        setShowForm(false);
        setEditing(null);
    };

    const handleDelete = (member) => {
        setConfirmState({
            message: `Remover "${member.name}" do time? Esta ação não pode ser desfeita.`,
            onConfirm: () => {
                deleteMember(member.id);
                addToast(`Membro "${member.name}" removido.`, 'success');
                setConfirmState(null);
            }
        });
    };

    const handleEdit = (member) => {
        setEditing(member);
        setForm({
            name: member.name,
            roleTitle: member.roleTitle || member.role_title || '',
            avatarColor: member.avatarColor || member.avatar_color || '#3498db',
            capacityHoursPerQuarter: member.capacityHoursPerQuarter || member.capacity_hours_per_quarter || 480,
        });
        setShowForm(true);
    };

    return (
        <>
            <div className="modal-overlay" onClick={onClose}>
                <div className="modal-content glass-surface" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
                    <div className="modal-header">
                        <h2><Users size={20} /> Gerenciar Time</h2>
                        <button className="modal-close" onClick={onClose}><X size={20} /></button>
                    </div>

                    <div className="team-list">
                        {members.length === 0 && (
                            <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                                Nenhum membro cadastrado.
                            </p>
                        )}

                        {members.map(m => (
                            <div key={m.id} className="team-member-card">
                                <div className="team-member-info">
                                    <div
                                        className="team-member-avatar"
                                        style={{ background: m.avatarColor || m.avatar_color || '#3498db' }}
                                    >
                                        {m.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div className="team-member-name">{m.name}</div>
                                        <div className="team-member-role">{m.roleTitle || m.role_title || 'Membro'}</div>
                                        <div className="team-member-capacity">
                                            {m.capacityHoursPerQuarter || m.capacity_hours_per_quarter || 480}h / quarter
                                        </div>
                                    </div>
                                </div>
                                <div className="team-member-actions">
                                    <button className="btn-icon" onClick={() => handleEdit(m)} title="Editar"><Edit3 size={14} /></button>
                                    <button className="btn-icon" onClick={() => handleDelete(m)} title="Excluir" style={{ color: 'var(--danger)' }}><Trash2 size={14} /></button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {!showForm ? (
                        <button
                            className="btn btn-primary"
                            onClick={() => {
                                setShowForm(true);
                                setEditing(null);
                                setForm({ name: '', roleTitle: '', avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)], capacityHoursPerQuarter: 480 });
                            }}
                            style={{ width: '100%', marginTop: '12px' }}
                        >
                            <Plus size={16} /> Adicionar Membro
                        </button>
                    ) : (
                        <div className="team-form" style={{ marginTop: '12px' }}>
                            <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{editing ? 'Editar Membro' : 'Novo Membro'}</h3>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label>Nome *</label>
                                    <input className="glass-input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome do membro" />
                                </div>
                                <div className="form-group">
                                    <label>Cargo</label>
                                    <input className="glass-input" value={form.roleTitle} onChange={(e) => setForm({ ...form, roleTitle: e.target.value })} placeholder="Ex: Tech Lead" />
                                </div>
                                <div className="form-group">
                                    <label>Capacidade (horas/quarter)</label>
                                    <input type="number" className="glass-input" value={form.capacityHoursPerQuarter} onChange={(e) => setForm({ ...form, capacityHoursPerQuarter: parseInt(e.target.value) || 0 })} />
                                </div>
                                <div className="form-group">
                                    <label>Cor</label>
                                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                        {AVATAR_COLORS.map(c => (
                                            <button
                                                key={c}
                                                onClick={() => setForm({ ...form, avatarColor: c })}
                                                style={{
                                                    width: '28px', height: '28px', borderRadius: '50%', background: c,
                                                    border: form.avatarColor === c ? '3px solid var(--text-primary)' : '2px solid transparent',
                                                    cursor: 'pointer',
                                                }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: '12px' }}>
                                <div />
                                <div className="modal-footer-right">
                                    <button className="btn btn-glass" onClick={() => { setShowForm(false); setEditing(null); }}>Cancelar</button>
                                    <button className="btn btn-primary" onClick={handleSubmit}>{editing ? 'Salvar' : 'Criar'}</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {confirmState && (
                <ConfirmDialog
                    title="Remover membro"
                    message={confirmState.message}
                    confirmLabel="Remover"
                    onConfirm={confirmState.onConfirm}
                    onCancel={() => setConfirmState(null)}
                />
            )}
        </>
    );
}
