import { useState } from 'react';
import { X, Plus, Trash2, Target, TrendingUp } from 'lucide-react';
import { useOKRs, useBoardOKRs } from '../hooks/useOKRs';

/**
 * OKR Panel sidebar — shows key results per objective with progress bars.
 */
export default function OKRPanel({ boardId, lanes = [], onClose }) {
    const { allKeyResults, loading, refetch } = useBoardOKRs(boardId);
    const [activeLaneId, setActiveLaneId] = useState(null);

    // Group KRs by lane
    const krsByLane = {};
    for (const kr of allKeyResults) {
        if (!krsByLane[kr.laneId || kr.lane_id]) {
            krsByLane[kr.laneId || kr.lane_id] = [];
        }
        krsByLane[kr.laneId || kr.lane_id].push(kr);
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="okr-panel glass-surface" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2><Target size={20} /> OKRs — Key Results</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="okr-panel-body">
                    {lanes.length === 0 && (
                        <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
                            Adicione lanes/objetivos primeiro.
                        </p>
                    )}

                    {lanes.map(lane => {
                        const laneKRs = krsByLane[lane.id] || [];
                        return (
                            <OKRLaneSection
                                key={lane.id}
                                lane={lane}
                                keyResults={laneKRs}
                                isActive={activeLaneId === lane.id}
                                onToggle={() => setActiveLaneId(activeLaneId === lane.id ? null : lane.id)}
                                onRefetch={refetch}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function OKRLaneSection({ lane, keyResults, isActive, onToggle, onRefetch }) {
    const { createKeyResult, updateKeyResult, deleteKeyResult } = useOKRs(lane.id);
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState(0);

    const handleAddKR = () => {
        if (!newTitle.trim()) return;
        createKeyResult({ title: newTitle.trim() });
        setNewTitle('');
        setTimeout(onRefetch, 300);
    };

    const handleUpdateValue = (krId) => {
        updateKeyResult(krId, { currentValue: parseFloat(editValue) });
        setEditingId(null);
        setTimeout(onRefetch, 300);
    };

    const handleDelete = (krId) => {
        deleteKeyResult(krId);
        setTimeout(onRefetch, 300);
    };

    const overallProgress = keyResults.length > 0
        ? Math.round(keyResults.reduce((sum, kr) => sum + Math.min((kr.currentValue || kr.current_value || 0) / (kr.targetValue || kr.target_value || 100) * 100, 100), 0) / keyResults.length)
        : 0;

    return (
        <div className="okr-lane-section">
            <div className="okr-lane-header" onClick={onToggle}>
                <div className="okr-lane-title">
                    <strong>{lane.title}</strong>
                    <span className="okr-kr-count">{keyResults.length} KRs</span>
                </div>
                <div className="okr-progress-mini">
                    <div className="okr-progress-bar-mini">
                        <div className="okr-progress-fill-mini" style={{ width: `${overallProgress}%` }} />
                    </div>
                    <span className="okr-progress-text">{overallProgress}%</span>
                </div>
            </div>

            {isActive && (
                <div className="okr-lane-body">
                    {keyResults.map(kr => {
                        const current = kr.currentValue || kr.current_value || 0;
                        const target = kr.targetValue || kr.target_value || 100;
                        const unit = kr.unit || '%';
                        const pct = Math.min(Math.round((current / target) * 100), 100);

                        return (
                            <div key={kr.id} className="okr-kr-item">
                                <div className="okr-kr-header">
                                    <span className="okr-kr-title">{kr.title}</span>
                                    <button className="okr-kr-delete" onClick={() => handleDelete(kr.id)} title="Excluir">
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                                <div className="okr-kr-progress">
                                    <div className="okr-progress-bar">
                                        <div
                                            className="okr-progress-fill"
                                            style={{
                                                width: `${pct}%`,
                                                background: pct >= 70 ? 'var(--success)' : pct >= 40 ? '#f39c12' : 'var(--danger)',
                                            }}
                                        />
                                    </div>
                                    {editingId === kr.id ? (
                                        <div className="okr-kr-edit-value">
                                            <input
                                                type="number"
                                                className="glass-input"
                                                value={editValue}
                                                onChange={(e) => setEditValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') handleUpdateValue(kr.id);
                                                    if (e.key === 'Escape') setEditingId(null);
                                                }}
                                                autoFocus
                                                style={{ width: '60px', padding: '2px 6px', fontSize: '0.75rem' }}
                                            />
                                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>/ {target}{unit}</span>
                                        </div>
                                    ) : (
                                        <span
                                            className="okr-kr-value"
                                            onClick={() => { setEditingId(kr.id); setEditValue(current); }}
                                            title="Clique para atualizar"
                                        >
                                            {current}/{target}{unit}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}

                    <div className="okr-add-kr">
                        <input
                            type="text"
                            className="glass-input"
                            placeholder="Novo Key Result..."
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleAddKR(); }}
                            style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                        />
                        <button className="btn btn-primary" onClick={handleAddKR} style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
                            <Plus size={12} /> KR
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
