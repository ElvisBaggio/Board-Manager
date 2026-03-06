import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../hooks/useBoards';
import { useStrategicChoices } from '../hooks/useStrategicChoices';
import { useGoals } from '../hooks/useGoals';
import { useBoardOKRs } from '../hooks/useOKRs';
import { useIndicators } from '../hooks/useIndicators';
import BoardHeader from '../components/BoardHeader';
import ConfirmDialog from '../components/ConfirmDialog';
import OKRPanel from '../components/OKRPanel';
import { Filter, Activity, Target, Crosshair, Zap, ArrowDown, Plus, Edit2, Trash2, X, GitMerge } from 'lucide-react';

export default function MetricsCascade() {
    const { id: boardId } = useParams();
    const { user } = useAuth();

    const { getBoard, loadBoardData, getLanes, getFeaturesForBoard } = useBoards(user?.id);
    const { choices, fetchChoices } = useStrategicChoices(boardId);
    const { boardGoals, fetchBoardGoals, addGoal, updateGoal, deleteGoal } = useGoals(boardId);
    const { allKeyResults: boardKeyResults, refetch: fetchOKRs } = useBoardOKRs(boardId);
    const {
        boardProductIndicators, efficiencyIndicators,
        fetchBoardProductIndicators, fetchEfficiencyIndicators,
        addProductIndicator,
        updateProductIndicator, deleteProductIndicator,
        updateEfficiencyIndicator, deleteEfficiencyIndicator,
        addEfficiencyIndicator
    } = useIndicators(boardId);

    const board = getBoard(boardId);
    const boardLanes = getLanes(boardId);
    const boardFeatures = getFeaturesForBoard(boardId) || [];

    const [selectedChoiceId, setSelectedChoiceId] = useState('all');

    // Create modals
    const [showGoalModal, setShowGoalModal] = useState(false);
    const [showKrModal, setShowKrModal] = useState(false);
    const [showIndModal, setShowIndModal] = useState(false);
    const [showEffModal, setShowEffModal] = useState(false);

    // Edit modal: { item, level }
    const [editingItem, setEditingItem] = useState(null);
    const [editingLevel, setEditingLevel] = useState(null);

    useEffect(() => {
        if (boardId) {
            loadBoardData(boardId);
            fetchChoices();
            fetchBoardGoals();
            fetchOKRs();
            fetchBoardProductIndicators();
            fetchEfficiencyIndicators();
        }
    }, [boardId, loadBoardData, fetchChoices, fetchBoardGoals, fetchOKRs, fetchBoardProductIndicators, fetchEfficiencyIndicators]);

    const filteredData = useMemo(() => {
        let goals = Array.isArray(boardGoals) ? boardGoals : [];
        let objectives = Array.isArray(boardLanes) ? boardLanes : [];
        let krsArray = Array.isArray(boardKeyResults) ? boardKeyResults : [];
        let productIndicsArray = Array.isArray(boardProductIndicators) ? boardProductIndicators : [];
        let efficiencyArray = Array.isArray(efficiencyIndicators) ? efficiencyIndicators : [];

        if (selectedChoiceId !== 'all') {
            goals = goals.filter(g => g.strategic_choice_id === selectedChoiceId);
            objectives = objectives.filter(o => o.strategicChoiceId === selectedChoiceId);
        }

        const assignedLaneIds = new Set(objectives.map(o => o.id));
        const krs = krsArray.filter(kr => assignedLaneIds.has(kr.laneId)).map(kr => {
            const lane = objectives.find(o => o.id === kr.laneId);
            return { ...kr, laneTitle: lane ? lane.title : 'Desconhecido' };
        });

        const productIndics = selectedChoiceId === 'all'
            ? productIndicsArray
            : productIndicsArray.filter(ind => objectives.some(o => o.title === ind.objective_title));

        return { goals, krs, productIndics, efficiency: efficiencyArray, objectives };
    }, [boardGoals, boardLanes, boardKeyResults, boardProductIndicators, efficiencyIndicators, selectedChoiceId]);

    // --- Create Handlers ---

    const handleAddGoal = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const cid = formData.get('choiceId');
        await addGoal(cid, {
            title: formData.get('title'),
            targetValue: parseFloat(formData.get('targetValue')),
            currentValue: parseFloat(formData.get('currentValue') || 0),
            unit: formData.get('unit'),
            frequency: formData.get('frequency')
        });
        fetchBoardGoals();
        setShowGoalModal(false);
    };

    const handleAddKr = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = {
            id: Date.now().toString(36),
            laneId: formData.get('laneId'),
            title: formData.get('title'),
            targetValue: parseFloat(formData.get('targetValue')),
            currentValue: parseFloat(formData.get('currentValue') || 0),
            unit: formData.get('unit'),
        };
        await fetch('/api/okrs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        fetchOKRs();
        setShowKrModal(false);
    };

    const handleAddIndicator = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const fId = formData.get('featureId');
        await addProductIndicator({
            featureId: fId,
            title: formData.get('title'),
            targetValue: parseFloat(formData.get('targetValue')),
            currentValue: parseFloat(formData.get('currentValue') || 0),
            unit: formData.get('unit')
        });
        fetchBoardProductIndicators();
        setShowIndModal(false);
    };

    const handleAddEfficiency = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        await addEfficiencyIndicator({
            title: formData.get('title'),
            value: parseFloat(formData.get('value') || 0),
            unit: formData.get('unit'),
            period: formData.get('period')
        });
        fetchEfficiencyIndicators();
        setShowEffModal(false);
    };

    // --- Edit Handler ---

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        if (editingLevel === 'goal') {
            await updateGoal(editingItem.id, {
                title: formData.get('title'),
                currentValue: parseFloat(formData.get('currentValue')),
                targetValue: parseFloat(formData.get('targetValue')),
                unit: formData.get('unit'),
                frequency: formData.get('frequency'),
            });
            fetchBoardGoals();
        } else if (editingLevel === 'kr') {
            await fetch(`/api/okrs/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.get('title'),
                    currentValue: parseFloat(formData.get('currentValue')),
                    targetValue: parseFloat(formData.get('targetValue')),
                    unit: formData.get('unit'),
                })
            });
            fetchOKRs();
        } else if (editingLevel === 'indicator') {
            await updateProductIndicator(editingItem.id, {
                title: formData.get('title'),
                currentValue: parseFloat(formData.get('currentValue')),
                targetValue: parseFloat(formData.get('targetValue')),
                unit: formData.get('unit'),
            });
            fetchBoardProductIndicators();
        } else if (editingLevel === 'efficiency') {
            await updateEfficiencyIndicator(editingItem.id, {
                title: formData.get('title'),
                value: parseFloat(formData.get('value')),
                unit: formData.get('unit'),
                period: formData.get('period'),
            });
            fetchEfficiencyIndicators();
        }

        setEditingItem(null);
        setEditingLevel(null);
    };

    const [confirmState, setConfirmState] = useState(null);
    const [showOKRPanel, setShowOKRPanel] = useState(false);

    const handleDelete = (item, level) => {
        const levelLabels = { goal: 'meta', kr: 'key result', indicator: 'indicador', efficiency: 'indicador de eficiência' };
        setConfirmState({
            message: `Excluir este ${levelLabels[level] || 'item'} permanentemente?`,
            onConfirm: async () => {
                setConfirmState(null);
                if (level === 'goal') { await deleteGoal(item.id); fetchBoardGoals(); }
                else if (level === 'kr') { await fetch(`/api/okrs/${item.id}`, { method: 'DELETE' }); fetchOKRs(); }
                else if (level === 'indicator') { await deleteProductIndicator(item.id); fetchBoardProductIndicators(); }
                else if (level === 'efficiency') { await deleteEfficiencyIndicator(item.id); fetchEfficiencyIndicators(); }
            }
        });
    };

    if (!board) return <div className="p-8">Carregando...</div>;

    const renderCard = (item, current, target, unit, subtext, type = 'success', level, extraFields = {}) => {
        const progress = target !== '-' && target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0;
        let healthColor = 'var(--danger)';
        if (type === 'efficiency') healthColor = 'var(--accent)';
        else if (progress >= 80) healthColor = 'var(--success)';
        else if (progress >= 50) healthColor = '#f39c12';

        return (
            <div className="glass-surface p-4 rounded-lg min-w-[200px] flex-1 animate-fade-in-up hover:translate-y-[-2px] transition-transform group relative">
                <div className="text-sm text-secondary mb-1 flex justify-between items-start">
                    <span className="font-medium line-clamp-1 pr-8" title={item.title}>{item.title}</span>
                    <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                            className="p-1 rounded hover:bg-white/10 text-secondary hover:text-white"
                            onClick={() => { setEditingItem({ ...item, ...extraFields }); setEditingLevel(level); }}
                        >
                            <Edit2 size={12} />
                        </button>
                        <button
                            className="p-1 rounded hover:bg-danger/20 text-secondary hover:text-danger"
                            onClick={() => handleDelete(item, level)}
                        >
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
                <div className="flex items-end gap-2 mb-2">
                    <span className="text-2xl font-bold font-mono" style={{ color: healthColor }}>
                        {type === 'efficiency' ? item.value ?? current : current}
                    </span>
                    <span className="text-sm text-muted pb-1">{target !== '-' ? `/ ${target}` : ''} {unit}</span>
                </div>
                {type !== 'efficiency' && (
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: healthColor }} />
                    </div>
                )}
                {subtext && <div className="text-xs text-muted mt-2 truncate">{subtext}</div>}
            </div>
        );
    };

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)]">
            <BoardHeader board={board} boardId={boardId} currentView="metrics">
                <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-full border border-white/10">
                    <Filter size={14} className="text-muted" />
                    <select
                        className="bg-transparent border-none text-sm text-white outline-none cursor-pointer"
                        value={selectedChoiceId}
                        onChange={(e) => setSelectedChoiceId(e.target.value)}
                    >
                        <option value="all">Todas as Escolhas</option>
                        {choices.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <button
                    className="btn btn-glass flex items-center gap-1.5 px-3 py-1.5 text-sm"
                    onClick={() => setShowOKRPanel(true)}
                    title="Ver OKRs por Objetivo"
                    style={{ fontSize: '0.8rem' }}
                >
                    <GitMerge size={14} /> OKRs
                </button>
            </BoardHeader>

            <main className="flex-1 overflow-y-auto p-8 relative">
                <div className="max-w-7xl mx-auto flex flex-col gap-2 relative">

                    <div className="absolute left-1/2 top-10 bottom-10 w-px bg-gradient-to-b from-[var(--success)] via-[var(--accent)] to-[#f39c12] opacity-20 -z-10 hidden md:block"></div>

                    {/* Layer 1: Goals */}
                    <div className="mb-2">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[#f39c12] flex items-center gap-2 m-0 mt-4">
                                <Target size={16} /> Nível 1: Goals & KPIs (Negócio)
                            </h3>
                            <button className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center mt-4" onClick={() => setShowGoalModal(true)}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {filteredData.goals.length === 0 && <p className="text-muted text-sm border border-dashed border-white/10 p-6 rounded-lg w-full text-center animate-fade-in-up mx-4">Nenhum Goal definido para esta escolha (Nível de Negócio).</p>}
                            {filteredData.goals.map(g => renderCard(g, g.current_value, g.target_value, g.unit, `Escolha: ${g.choice_title || 'N/A'}`, 'success', 'goal'))}
                        </div>
                    </div>

                    <div className="flex justify-center text-muted opacity-50 my-2"><ArrowDown size={24} /></div>

                    {/* Layer 2: OKRs */}
                    <div className="mb-2">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--success)] flex items-center gap-2 m-0">
                                <Crosshair size={16} /> Nível 2: Key Results (Tático)
                            </h3>
                            <button className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center" onClick={() => setShowKrModal(true)}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {filteredData.krs.length === 0 && <p className="text-muted text-sm border border-dashed border-white/10 p-6 rounded-lg w-full text-center animate-fade-in-up mx-4">Nenhum Key Result de Objetivos vinculados.</p>}
                            {filteredData.krs.map(kr => renderCard(kr, kr.current_value, kr.target_value, kr.unit, `Obj: ${kr.laneTitle}`, 'success', 'kr'))}
                        </div>
                    </div>

                    <div className="flex justify-center text-muted opacity-50 my-2"><ArrowDown size={24} /></div>

                    {/* Layer 3: Product Indicators */}
                    <div className="mb-2">
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-[var(--accent)] flex items-center gap-2 m-0">
                                <Activity size={16} /> Nível 3: Produto (Iniciativas)
                            </h3>
                            <button className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center" onClick={() => setShowIndModal(true)}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {filteredData.productIndics.length === 0 && <p className="text-muted text-sm border border-dashed border-white/10 p-6 rounded-lg w-full text-center animate-fade-in-up mx-4">Nenhum Indicador de Produto configurado.</p>}
                            {filteredData.productIndics.map(ind => renderCard(ind, ind.current_value, ind.target_value, ind.unit, `Feat: ${ind.feature_title}`, 'success', 'indicator'))}
                        </div>
                    </div>

                    <div className="flex justify-center text-muted opacity-50 my-2"><ArrowDown size={24} /></div>

                    {/* Layer 4: Efficiency */}
                    <div>
                        <div className="flex items-center justify-center gap-4 mb-4">
                            <h3 className="text-sm font-bold uppercase tracking-widest text-purple-400 flex items-center gap-2 m-0">
                                <Zap size={16} /> Nível 4: Eficiência (Operacional)
                            </h3>
                            <button className="btn btn-primary btn-sm rounded-full w-8 h-8 p-0 flex items-center justify-center" onClick={() => setShowEffModal(true)}>
                                <Plus size={16} />
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-4 justify-center">
                            {filteredData.efficiency.length === 0 && <p className="text-muted text-sm border border-dashed border-white/10 p-6 rounded-lg w-full text-center animate-fade-in-up mx-4">Nenhum Indicador de Eficiência definido no momento.</p>}
                            {filteredData.efficiency.map(ind => renderCard(ind, ind.value, '-', ind.unit, `Período: ${ind.period}`, 'efficiency', 'efficiency'))}
                        </div>
                        <div className="text-center mt-6 text-xs text-muted max-w-lg mx-auto pb-12">
                            Indicadores de eficiência medem a produtividade do time como um todo (Velocity, Lead Time, etc) e apoiam a velocidade de entrega das iniciativas.
                        </div>
                    </div>
                </div>
            </main>

            {/* --- Edit Modal --- */}
            {editingItem && editingLevel && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => { setEditingItem(null); setEditingLevel(null); }}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Editar {editingLevel === 'goal' ? 'Goal' : editingLevel === 'kr' ? 'Key Result' : editingLevel === 'indicator' ? 'Indicador de Produto' : 'Indicador de Eficiência'}</h2>
                            <button className="btn-icon-sm ml-auto" onClick={() => { setEditingItem(null); setEditingLevel(null); }}><X size={16} /></button>
                        </div>
                        <form onSubmit={handleSaveEdit}>
                            <div className="modal-body grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Título *</label>
                                    <input name="title" className="glass-input p-2" defaultValue={editingItem.title} required />
                                </div>

                                {editingLevel !== 'efficiency' ? (
                                    <>
                                        <div className="form-group flex flex-col gap-1">
                                            <label className="text-sm font-bold text-secondary">Valor Atual</label>
                                            <input name="currentValue" type="number" step="0.01" className="glass-input p-2" defaultValue={editingItem.current_value} required />
                                        </div>
                                        <div className="form-group flex flex-col gap-1">
                                            <label className="text-sm font-bold text-secondary">Meta (Target)</label>
                                            <input name="targetValue" type="number" step="0.01" className="glass-input p-2" defaultValue={editingItem.target_value} required />
                                        </div>
                                        <div className="form-group flex flex-col gap-1">
                                            <label className="text-sm font-bold text-secondary">Unidade</label>
                                            <input name="unit" className="glass-input p-2" defaultValue={editingItem.unit} />
                                        </div>
                                        {editingLevel === 'goal' && (
                                            <div className="form-group flex flex-col gap-1">
                                                <label className="text-sm font-bold text-secondary">Frequência</label>
                                                <select name="frequency" className="glass-input p-2" defaultValue={editingItem.frequency || 'quarterly'}>
                                                    <option value="daily">Diária</option>
                                                    <option value="weekly">Semanal</option>
                                                    <option value="monthly">Mensal</option>
                                                    <option value="quarterly">Trimestral</option>
                                                </select>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        <div className="form-group flex flex-col gap-1">
                                            <label className="text-sm font-bold text-secondary">Valor Medido</label>
                                            <input name="value" type="number" step="0.01" className="glass-input p-2" defaultValue={editingItem.value} required />
                                        </div>
                                        <div className="form-group flex flex-col gap-1">
                                            <label className="text-sm font-bold text-secondary">Unidade</label>
                                            <input name="unit" className="glass-input p-2" defaultValue={editingItem.unit} />
                                        </div>
                                        <div className="form-group col-span-2 flex flex-col gap-1">
                                            <label className="text-sm font-bold text-secondary">Período de Referência</label>
                                            <input name="period" className="glass-input p-2" defaultValue={editingItem.period} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => { setEditingItem(null); setEditingLevel(null); }}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* --- Create Modals --- */}

            {showGoalModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowGoalModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Novo Goal (Nível de Negócio)</h2></div>
                        <form onSubmit={handleAddGoal}>
                            <div className="modal-body grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Escolha Estratégica *</label>
                                    <select name="choiceId" className="glass-select p-2" required>
                                        {choices.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Indicador *</label>
                                    <input name="title" className="glass-input p-2" required placeholder="ex: Receita Recorrente Máxima" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Valor Atual</label>
                                    <input name="currentValue" type="number" step="0.01" className="glass-input p-2" placeholder="0" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Meta (Target)</label>
                                    <input name="targetValue" type="number" step="0.01" className="glass-input p-2" required placeholder="100" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Unidade</label>
                                    <input name="unit" className="glass-input p-2" placeholder="%, R$, mi" required />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Frequência</label>
                                    <select name="frequency" className="glass-input p-2">
                                        <option value="quarterly">Trimestral</option>
                                        <option value="monthly">Mensal</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => setShowGoalModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showKrModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowKrModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Novo Key Result (Tático)</h2></div>
                        <form onSubmit={handleAddKr}>
                            <div className="modal-body grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Objetivo (Lane) *</label>
                                    <select name="laneId" className="glass-select p-2" required>
                                        {filteredData.objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Key Result *</label>
                                    <input name="title" className="glass-input p-2" required placeholder="ex: Aumentar conversão no checkout" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Valor Atual</label>
                                    <input name="currentValue" type="number" step="0.01" className="glass-input p-2" placeholder="0" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Meta (Target) *</label>
                                    <input name="targetValue" type="number" step="0.01" className="glass-input p-2" required placeholder="100" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Unidade *</label>
                                    <input name="unit" className="glass-input p-2" required placeholder="ex: %" />
                                </div>
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => setShowKrModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showIndModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowIndModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Novo Indicador de Produto</h2></div>
                        <form onSubmit={handleAddIndicator}>
                            <div className="modal-body grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Iniciativa (Feature) *</label>
                                    <select name="featureId" className="glass-select p-2" required>
                                        {boardFeatures.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
                                    </select>
                                </div>
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Indicador *</label>
                                    <input name="title" className="glass-input p-2" required placeholder="ex: Novos usuários da feature" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Valor Atual</label>
                                    <input name="currentValue" type="number" step="0.01" className="glass-input p-2" placeholder="0" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Meta (Target) *</label>
                                    <input name="targetValue" type="number" step="0.01" className="glass-input p-2" required placeholder="100" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Unidade *</label>
                                    <input name="unit" className="glass-input p-2" required placeholder="ex: views" />
                                </div>
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => setShowIndModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {showEffModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowEffModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h2>Novo Indicador de Eficiência</h2></div>
                        <form onSubmit={handleAddEfficiency}>
                            <div className="modal-body grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Métrica de Time *</label>
                                    <input name="title" className="glass-input p-2" required placeholder="ex: Cycle Time" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Valor Medido *</label>
                                    <input name="value" type="number" step="0.01" className="glass-input p-2" required placeholder="5.5" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Unidade *</label>
                                    <input name="unit" className="glass-input p-2" required placeholder="dias" />
                                </div>
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Período de Referência *</label>
                                    <input name="period" className="glass-input p-2" required placeholder="ex: Sprint 42 ou Março/2026" />
                                </div>
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => setShowEffModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {confirmState && (
                <ConfirmDialog
                    message={confirmState.message}
                    onConfirm={confirmState.onConfirm}
                    onCancel={() => setConfirmState(null)}
                />
            )}

            {showOKRPanel && (
                <OKRPanel
                    boardId={boardId}
                    lanes={boardLanes}
                    onClose={() => setShowOKRPanel(false)}
                />
            )}
        </div>
    );
}
