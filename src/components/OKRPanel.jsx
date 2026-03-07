import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Target, Link as LinkIcon, AlertCircle } from 'lucide-react';
import { useOKRs, useBoardOKRs } from '../hooks/useOKRs';
import { useGoals } from '../hooks/useGoals';
import { useIndicators } from '../hooks/useIndicators';

/**
 * OKR Panel sidebar — shows key results per objective, connected goals, and product indicators.
 */
export default function OKRPanel({ planId, lanes = [], onClose }) {
    const { allKeyResults, loading: okrsLoading, refetch } = useBoardOKRs(planId);
    const {
        boardGoals, goalObjectiveLinks,
        fetchBoardGoals, fetchBoardGoalLinks,
        linkGoalToObjective, unlinkGoalFromObjective
    } = useGoals(planId);

    const {
        boardProductIndicators, indicatorKrLinks,
        fetchBoardProductIndicators, fetchBoardKrLinks,
        linkIndicatorToKr, unlinkIndicatorFromKr
    } = useIndicators(planId);

    const [activeLaneId, setActiveLaneId] = useState(null);

    useEffect(() => {
        if (planId) {
            fetchBoardGoals();
            fetchBoardGoalLinks();
            fetchBoardProductIndicators();
            fetchBoardKrLinks();
        }
    }, [planId, fetchBoardGoals, fetchBoardGoalLinks, fetchBoardProductIndicators, fetchBoardKrLinks]);

    // Group KRs by lane
    const krsByLane = {};
    for (const kr of allKeyResults) {
        if (!krsByLane[kr.laneId || kr.lane_id]) {
            krsByLane[kr.laneId || kr.lane_id] = [];
        }
        krsByLane[kr.laneId || kr.lane_id].push(kr);
    }

    return (
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100 }}>
            <div className="okr-panel glass-surface w-full max-w-2xl h-[100vh]" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header border-b border-[var(--border-color)]">
                    <h2><Target size={20} /> Objetivos e OKRs</h2>
                    <button className="modal-close" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="okr-panel-body p-4 space-y-4 overflow-y-auto h-[calc(100vh-70px)] custom-scrollbar">
                    {lanes.length === 0 && (
                        <div className="text-center p-8 text-muted border border-dashed border-white/10 rounded-lg">
                            <Target size={32} className="mx-auto mb-2 opacity-50" />
                            <p>Adicione Objetivos (Lanes) no escopo principal primeiro.</p>
                        </div>
                    )}

                    {lanes.map(lane => {
                        const laneKRs = krsByLane[lane.id] || [];
                        const linkedGoalIds = goalObjectiveLinks.filter(l => l.lane_id === lane.id).map(l => l.goal_id);

                        return (
                            <OKRLaneSection
                                key={lane.id}
                                lane={lane}
                                keyResults={laneKRs}
                                isActive={activeLaneId === lane.id}
                                onToggle={() => setActiveLaneId(activeLaneId === lane.id ? null : lane.id)}
                                onRefetch={refetch}

                                boardGoals={boardGoals}
                                linkedGoalIds={linkedGoalIds}
                                linkGoal={(gid) => linkGoalToObjective(gid, lane.id)}
                                unlinkGoal={(gid) => {
                                    const link = goalObjectiveLinks.find(l => l.lane_id === lane.id && l.goal_id === gid);
                                    if (link) unlinkGoalFromObjective(link.id);
                                }}

                                boardProductIndicators={boardProductIndicators}
                                indicatorKrLinks={indicatorKrLinks}
                                linkIndicatorToKr={linkIndicatorToKr}
                                unlinkIndicatorFromKr={unlinkIndicatorFromKr}
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

function OKRLaneSection({
    lane, keyResults, isActive, onToggle, onRefetch,
    boardGoals, linkedGoalIds, linkGoal, unlinkGoal,
    boardProductIndicators, indicatorKrLinks, linkIndicatorToKr, unlinkIndicatorFromKr
}) {
    const { createKeyResult, updateKeyResult, deleteKeyResult } = useOKRs(lane.id);
    const [newTitle, setNewTitle] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState(0);

    const [showGoalLinker, setShowGoalLinker] = useState(false);

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
        <div className="okr-lane-section bg-black/20 border border-[var(--border-color)] rounded-lg overflow-hidden transition-all">
            <div className="okr-lane-header p-3 cursor-pointer hover:bg-white/5 flex justify-between items-center" onClick={onToggle}>
                <div className="flex-1">
                    <strong className="text-white block mb-1">{lane.title}</strong>
                    <div className="flex gap-3 text-xs text-muted">
                        <span className="flex items-center gap-1">{keyResults.length} KRs</span>
                        {linkedGoalIds.length > 0 && (
                            <span className="flex items-center gap-1 text-[var(--accent)]">
                                <LinkIcon size={12} /> {linkedGoalIds.length} Goal{linkedGoalIds.length !== 1 ? 's' : ''}
                            </span>
                        )}
                        {!lane.strategicChoiceId && <span className="text-danger flex items-center gap-1" title="Objetivo não vinculado a Escolha Estratégica!"><AlertCircle size={12} /> Solto</span>}
                    </div>
                </div>
                <div className="flex flex-col items-end gap-1 w-24">
                    <span className="font-mono text-sm font-bold text-white">{overallProgress}%</span>
                    <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full transition-all" style={{ width: `${overallProgress}%`, background: 'var(--accent)' }} />
                    </div>
                </div>
            </div>

            {isActive && (
                <div className="p-3 border-t border-[var(--border-color)] bg-black/10 flex flex-col gap-4">

                    {/* Goal Linker */}
                    <div className="bg-white/5 p-3 rounded border border-white/5">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-secondary uppercase tracking-wider">🎯 Relacionado aos Goals/KPIs (Negócio):</span>
                            <button className="text-xs text-[var(--accent)] hover:underline" onClick={() => setShowGoalLinker(!showGoalLinker)}>
                                {showGoalLinker ? 'Ocultar' : 'Gerenciar Vínculos'}
                            </button>
                        </div>

                        {linkedGoalIds.length === 0 && !showGoalLinker && (
                            <p className="text-xs text-muted italic m-0">Nenhum Goal vinculado. (Este Objetivo é solto ou muito operacional?)</p>
                        )}

                        <div className="flex flex-wrap gap-2 mb-2">
                            {linkedGoalIds.map(gid => {
                                const goal = boardGoals.find(g => g.id === gid);
                                if (!goal) return null;
                                return (
                                    <span key={gid} className="text-xs px-2 py-1 rounded text-accent flex items-center gap-1" style={{ background: 'rgba(0,134,255,0.2)', border: '1px solid rgba(0,134,255,0.4)' }}>
                                        <Target size={12} /> {goal.title}
                                    </span>
                                );
                            })}
                        </div>

                        {showGoalLinker && (
                            <div className="bg-black/30 p-2 rounded flex flex-col gap-1 max-h-40 overflow-y-auto">
                                {boardGoals.length === 0 ? <span className="text-xs text-muted">Nenhum Goal criado no board.</span> : boardGoals.map(goal => {
                                    const isLinked = linkedGoalIds.includes(goal.id);
                                    return (
                                        <label key={goal.id} className="flex items-center gap-2 text-sm p-1 hover:bg-white/5 rounded cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isLinked}
                                                onChange={() => isLinked ? unlinkGoal(goal.id) : linkGoal(goal.id)}
                                                className="accent-[var(--accent)]"
                                            />
                                            <span className="truncate flex-1 max-w-[250px]" title={goal.title}>{goal.title}</span>
                                            <span className="text-xs text-muted truncate">{goal.choice_title}</span>
                                        </label>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* KRs List */}
                    <div>
                        <span className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 block">📋 Key Results (Tático):</span>
                        {keyResults.length === 0 && <p className="text-xs text-muted italic my-2">Nenhum KR adicionado.</p>}

                        <div className="flex flex-col gap-2">
                            {keyResults.map(kr => (
                                <KRItem
                                    key={kr.id} kr={kr}
                                    onDelete={handleDelete}
                                    editingId={editingId} setEditingId={setEditingId}
                                    editValue={editValue} setEditValue={setEditValue}
                                    onUpdate={handleUpdateValue}
                                    boardProductIndicators={boardProductIndicators}
                                    indicatorKrLinks={indicatorKrLinks}
                                    linkIndicatorToKr={linkIndicatorToKr}
                                    unlinkIndicatorFromKr={unlinkIndicatorFromKr}
                                />
                            ))}
                        </div>

                        <div className="flex gap-2 mt-3 pt-3 border-t border-white/5">
                            <input
                                type="text"
                                className="glass-input flex-1 text-sm bg-black/20"
                                placeholder="Novo Key Result..."
                                value={newTitle}
                                onChange={(e) => setNewTitle(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddKR(); }}
                            />
                            <button className="btn btn-primary" onClick={handleAddKR}>
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function KRItem({
    kr, onDelete, editingId, setEditingId, editValue, setEditValue, onUpdate,
    boardProductIndicators, indicatorKrLinks, linkIndicatorToKr, unlinkIndicatorFromKr
}) {
    const [showIndLinker, setShowIndLinker] = useState(false);

    const current = kr.currentValue || kr.current_value || 0;
    const target = kr.targetValue || kr.target_value || 100;
    const unit = kr.unit || '%';
    const pct = Math.min(Math.round((current / target) * 100), 100);

    const linkedIndIds = indicatorKrLinks.filter(l => l.kr_id === kr.id).map(l => l.indicator_id);

    return (
        <div className="bg-white/5 rounded border border-white/10 p-2 flex flex-col gap-2 group">
            <div className="flex justify-between items-start gap-2">
                <div className="flex-1">
                    <span className="text-sm font-medium text-white block leading-tight">{kr.title}</span>
                    <button
                        className="text-[10px] text-muted hover:text-white flex items-center gap-1 mt-1 transition-colors"
                        onClick={() => setShowIndLinker(!showIndLinker)}
                    >
                        <LinkIcon size={10} /> {linkedIndIds.length} Indicador{linkedIndIds.length !== 1 ? 'es' : ''} de Produto vinculados
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    {editingId === kr.id ? (
                        <div className="flex items-center gap-1">
                            <input
                                type="number"
                                className="glass-input w-16 text-xs p-1 h-6"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') onUpdate(kr.id);
                                    if (e.key === 'Escape') setEditingId(null);
                                }}
                                autoFocus
                            />
                            <span className="text-xs text-muted">/ {target}{unit}</span>
                        </div>
                    ) : (
                        <span
                            className="text-xs font-mono font-bold cursor-pointer hover:text-white transition-colors"
                            onClick={() => { setEditingId(kr.id); setEditValue(current); }}
                            title="Clique para atualizar"
                            style={{ color: pct >= 70 ? 'var(--success)' : pct >= 40 ? '#f39c12' : 'var(--danger)' }}
                        >
                            {current}/{target}{unit}
                        </span>
                    )}

                    <div className="w-16 h-1.5 bg-black/40 rounded-full overflow-hidden" title={`${pct}%`}>
                        <div
                            className="h-full transition-all"
                            style={{
                                width: `${pct}%`,
                                background: pct >= 70 ? 'var(--success)' : pct >= 40 ? '#f39c12' : 'var(--danger)',
                            }}
                        />
                    </div>

                    <button className="text-danger opacity-0 group-hover:opacity-100 p-0.5 hover:bg-danger/20 rounded transition-all" onClick={() => onDelete(kr.id)} title="Excluir">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Indicator Linker Panel */}
            {showIndLinker && (
                <div className="mt-2 p-2 bg-black/30 rounded border border-white/5 text-xs">
                    <span className="text-muted block mb-2 font-bold uppercase tracking-wider">Apoiado por (Indicadores de Produto):</span>
                    {boardProductIndicators.length === 0 ? <p className="text-muted italic m-0">Nenhum indicador de produto criado no board.</p> : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                            {boardProductIndicators.map(ind => {
                                const isLinked = linkedIndIds.includes(ind.id);
                                return (
                                    <label key={ind.id} className="flex items-center gap-2 p-1 hover:bg-white/5 rounded cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={isLinked}
                                            onChange={() => {
                                                if (isLinked) {
                                                    const link = indicatorKrLinks.find(l => l.indicator_id === ind.id && l.kr_id === kr.id);
                                                    if (link) unlinkIndicatorFromKr(link.id);
                                                } else {
                                                    linkIndicatorToKr(ind.id, kr.id);
                                                }
                                            }}
                                            className="accent-[#3498db]"
                                        />
                                        <span className="truncate flex-1" title={ind.title}>{ind.title}</span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
