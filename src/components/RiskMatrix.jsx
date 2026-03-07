import { useState } from 'react';
import { X, Plus, Trash2, Shield, Edit3 } from 'lucide-react';
import { useRisks } from '../hooks/useRisks';
import { calculateRiskScore } from '../utils/calculations';

const IMPACT_LABELS = ['', 'Mínimo', 'Baixo', 'Moderado', 'Alto', 'Crítico'];
const PROBABILITY_LABELS = ['', 'Rara', 'Improvável', 'Possível', 'Provável', 'Quase Certa'];

/**
 * 5×5 Risk Matrix — impact × probability grid with positioned risks.
 */
export default function RiskMatrix({ planId, onClose }) {
    const { risks, createRisk, updateRisk, deleteRisk } = useRisks(planId);
    const [showForm, setShowForm] = useState(false);
    const [editingRisk, setEditingRisk] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', impact: 3, probability: 3, mitigation: '', status: 'Open' });

    const handleSubmit = () => {
        if (!form.title.trim()) return;
        if (editingRisk) {
            updateRisk(editingRisk.id, form);
        } else {
            createRisk(form);
        }
        setForm({ title: '', description: '', impact: 3, probability: 3, mitigation: '', status: 'Open' });
        setShowForm(false);
        setEditingRisk(null);
    };

    const handleEdit = (risk) => {
        setEditingRisk(risk);
        setForm({
            title: risk.title,
            description: risk.description || '',
            impact: risk.impact,
            probability: risk.probability,
            mitigation: risk.mitigation || '',
            status: risk.status || 'Open',
        });
        setShowForm(true);
    };

    // Build the 5×5 grid
    const grid = [];
    for (let impact = 5; impact >= 1; impact--) {
        const row = [];
        for (let prob = 1; prob <= 5; prob++) {
            const cellRisks = risks.filter(r => r.impact === impact && r.probability === prob);
            const { color } = calculateRiskScore(impact, prob);
            row.push({ impact, probability: prob, risks: cellRisks, bgColor: color + '20', borderColor: color });
        }
        grid.push(row);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="risk-matrix glass-surface" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Shield size={20} /> Matriz de Riscos</h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditingRisk(null); setForm({ title: '', description: '', impact: 3, probability: 3, mitigation: '', status: 'Open' }); }} style={{ fontSize: '0.8rem', padding: '6px 12px' }}>
                            <Plus size={14} /> Risco
                        </button>
                        <button className="modal-close" onClick={onClose}><X size={20} /></button>
                    </div>
                </div>

                {/* Grid */}
                <div className="risk-grid-wrapper">
                    <div className="risk-axis-y-label">Impacto ↑</div>
                    <div className="risk-grid-container">
                        <div className="risk-grid">
                            {grid.map((row, rowIdx) => (
                                <div key={rowIdx} className="risk-grid-row">
                                    <div className="risk-axis-label">{IMPACT_LABELS[5 - rowIdx]}</div>
                                    {row.map((cell, colIdx) => (
                                        <div
                                            key={colIdx}
                                            className="risk-grid-cell"
                                            style={{ background: cell.bgColor, borderColor: cell.borderColor }}
                                        >
                                            {cell.risks.map(r => (
                                                <div
                                                    key={r.id}
                                                    className="risk-dot"
                                                    title={`${r.title} (${calculateRiskScore(r.impact, r.probability).severity})`}
                                                    onClick={() => handleEdit(r)}
                                                    style={{ background: calculateRiskScore(r.impact, r.probability).color }}
                                                >
                                                    {r.title.charAt(0).toUpperCase()}
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            ))}
                            <div className="risk-grid-row risk-axis-bottom">
                                <div className="risk-axis-label" />
                                {PROBABILITY_LABELS.slice(1).map((label) => (
                                    <div key={label} className="risk-axis-label-bottom">{label}</div>
                                ))}
                            </div>
                        </div>
                        <div className="risk-axis-x-label">Probabilidade →</div>
                    </div>
                </div>

                {/* Risk list */}
                <div className="risk-list">
                    <h3 style={{ fontSize: '0.9rem', marginBottom: '8px' }}>Riscos ({risks.length})</h3>
                    {risks.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Nenhum risco cadastrado.</p>
                    )}
                    {risks.map(r => {
                        const { severity, color } = calculateRiskScore(r.impact, r.probability);
                        return (
                            <div key={r.id} className="risk-list-item">
                                <div className="risk-list-main">
                                    <span className="risk-severity-badge" style={{ background: color }}>{severity}</span>
                                    <span className="risk-list-title">{r.title}</span>
                                    <span className={`risk-status-badge risk-status-${r.status?.toLowerCase()}`}>{r.status}</span>
                                </div>
                                <div className="risk-list-actions">
                                    <button onClick={() => handleEdit(r)} title="Editar"><Edit3 size={13} /></button>
                                    <button onClick={() => deleteRisk(r.id)} title="Excluir"><Trash2 size={13} /></button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Form modal */}
                {showForm && (
                    <div className="risk-form-overlay" onClick={() => { setShowForm(false); setEditingRisk(null); }}>
                        <div className="risk-form glass-surface" onClick={(e) => e.stopPropagation()}>
                            <h3>{editingRisk ? 'Editar Risco' : 'Novo Risco'}</h3>
                            <div className="modal-form-grid">
                                <div className="form-group">
                                    <label>Título *</label>
                                    <input className="glass-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                                </div>
                                <div className="form-group">
                                    <label>Descrição</label>
                                    <textarea className="glass-textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
                                </div>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Impacto (1-5)</label>
                                        <input type="range" min={1} max={5} value={form.impact} onChange={(e) => setForm({ ...form, impact: parseInt(e.target.value) })} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{IMPACT_LABELS[form.impact]}</span>
                                    </div>
                                    <div className="form-group">
                                        <label>Probabilidade (1-5)</label>
                                        <input type="range" min={1} max={5} value={form.probability} onChange={(e) => setForm({ ...form, probability: parseInt(e.target.value) })} />
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{PROBABILITY_LABELS[form.probability]}</span>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label>Mitigação</label>
                                    <textarea className="glass-textarea" value={form.mitigation} onChange={(e) => setForm({ ...form, mitigation: e.target.value })} rows={2} />
                                </div>
                                <div className="form-group">
                                    <label>Status</label>
                                    <select className="glass-select" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                                        <option value="Open">Aberto</option>
                                        <option value="Mitigated">Mitigado</option>
                                        <option value="Closed">Fechado</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer" style={{ marginTop: '16px' }}>
                                <div />
                                <div className="modal-footer-right">
                                    <button className="btn btn-glass" onClick={() => { setShowForm(false); setEditingRisk(null); }}>Cancelar</button>
                                    <button className="btn btn-primary" onClick={handleSubmit}>{editingRisk ? 'Salvar' : 'Criar'}</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
