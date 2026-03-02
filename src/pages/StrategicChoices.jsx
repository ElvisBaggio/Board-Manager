import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../hooks/useBoards';
import { useStrategicChoices } from '../hooks/useStrategicChoices';
import { useGoals } from '../hooks/useGoals';
import BoardHeader from '../components/BoardHeader';
import { Target, Plus, Check, Trash2, Edit2, Link as LinkIcon, X } from 'lucide-react';

const FREQUENCY_LABELS = {
    daily: 'Diária',
    weekly: 'Semanal',
    monthly: 'Mensal',
    quarterly: 'Trimestral',
};

export default function StrategicChoices() {
    const { id: boardId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    const { getBoard, getLanes, loadBoardData, createLane, updateLane } = useBoards(user?.id);
    const { choices, fetchChoices, addChoice, updateChoice, deleteChoice } = useStrategicChoices(boardId);

    const {
        choiceGoals, goalObjectiveLinks,
        fetchGoalsByChoice, fetchBoardGoalLinks,
        addGoal, updateGoal, deleteGoal,
        linkGoalToObjective, unlinkGoalFromObjective
    } = useGoals(boardId);

    const board = getBoard(boardId);
    const lanes = getLanes(boardId);

    const [selectedChoiceId, setSelectedChoiceId] = useState(null);
    const [showChoiceModal, setShowChoiceModal] = useState(false);
    const [editingChoice, setEditingChoice] = useState(null);

    const [showGoalModal, setShowGoalModal] = useState(false);
    const [editingGoal, setEditingGoal] = useState(null);

    const [showObjInput, setShowObjInput] = useState(false);
    const [newObjTitle, setNewObjTitle] = useState('');

    // ID of the goal whose objective-linker popover is open
    const [linkingGoalId, setLinkingGoalId] = useState(null);
    // Modal to link an existing lane to the current choice
    const [showLinkObjModal, setShowLinkObjModal] = useState(false);

    useEffect(() => {
        if (boardId) {
            loadBoardData(boardId);
            fetchChoices();
            fetchBoardGoalLinks();
        }
    }, [boardId, loadBoardData, fetchChoices, fetchBoardGoalLinks]);

    useEffect(() => {
        if (choices.length > 0 && !selectedChoiceId) {
            setSelectedChoiceId(choices[0].id);
        }
    }, [choices, selectedChoiceId]);

    useEffect(() => {
        if (selectedChoiceId) {
            fetchGoalsByChoice(selectedChoiceId);
        }
    }, [selectedChoiceId, fetchGoalsByChoice]);

    const activeChoice = choices.find(c => c.id === selectedChoiceId);

    // Lanes directly assigned to this choice OR linked via a goal of this choice
    const goalIdsForChoice = choiceGoals.map(g => g.id);
    const linkedLaneIdsViaGoals = goalObjectiveLinks
        .filter(l => goalIdsForChoice.includes(l.goal_id))
        .map(l => l.lane_id);
    const choiceObjectives = lanes.filter(l =>
        l.strategicChoiceId === selectedChoiceId || linkedLaneIdsViaGoals.includes(l.id)
    );

    // Lanes not yet assigned to this choice (for the "link existing" modal)
    const unassignedLanes = lanes.filter(l => !choiceObjectives.find(o => o.id === l.id));

    const allLanes = lanes;

    const handleSaveChoice = async (data) => {
        if (editingChoice) {
            await updateChoice(editingChoice.id, data);
        } else {
            const newChoice = await addChoice(data);
            setSelectedChoiceId(newChoice.id);
        }
        setShowChoiceModal(false);
        setEditingChoice(null);
    };

    const handleSaveGoal = async (data) => {
        if (editingGoal) {
            await updateGoal(editingGoal.id, data);
        } else {
            await addGoal(selectedChoiceId, data);
        }
        setShowGoalModal(false);
        setEditingGoal(null);
    };

    const handleAddObjective = async () => {
        if (!newObjTitle.trim()) return;
        await createLane(boardId, newObjTitle.trim(), selectedChoiceId);
        setNewObjTitle('');
        setShowObjInput(false);
    };

    const handleLinkExistingLane = async (laneId) => {
        await updateLane(laneId, { strategicChoiceId: selectedChoiceId });
        setShowLinkObjModal(false);
    };

    const handleToggleLink = async (goalId, laneId) => {
        const existing = goalObjectiveLinks.find(l => l.goal_id === goalId && l.lane_id === laneId);
        if (existing) {
            await unlinkGoalFromObjective(existing.id);
        } else {
            await linkGoalToObjective(goalId, laneId);
        }
    };

    // Returns goals linked to a given lane
    const getGoalsForLane = (laneId) => {
        const linkedGoalIds = goalObjectiveLinks.filter(l => l.lane_id === laneId).map(l => l.goal_id);
        return choiceGoals.filter(g => linkedGoalIds.includes(g.id));
    };

    if (!board) return <div className="p-8">Carregando...</div>;

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)]" onClick={() => setLinkingGoalId(null)}>
            <BoardHeader board={board} boardId={boardId} currentView="choices" />

            <main className="flex-1 overflow-hidden flex flex-col-md overflow-y-auto-md">

                {/* Sidebar: List of Choices */}
                <div className="w-64 w-full-md h-[30%] h-auto-md glass-surface flex flex-col border-r border-r-0-md border-[var(--border-color)] border-b-md">
                    <div className="p-4 border-b border-[var(--border-color)] flex justify-between items-center bg-black/20">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0">Suas Escolhas</h3>
                        <button className="btn-icon-sm" onClick={() => { setEditingChoice(null); setShowChoiceModal(true); }}>
                            <Plus size={16} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 animate-fade-in">
                        {choices.map(choice => (
                            <button
                                key={choice.id}
                                className={`w-full text-left px-3 py-3 rounded mb-1 transition-colors flex items-center gap-2 cursor-pointer ${selectedChoiceId === choice.id ? 'text-accent font-medium' : 'hover:bg-white/5'}`}
                                style={{
                                    background: selectedChoiceId === choice.id ? 'rgba(0,134,255,0.1)' : 'transparent',
                                    border: 'none',
                                    outline: 'none',
                                }}
                                onClick={() => setSelectedChoiceId(choice.id)}
                            >
                                <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: choice.color }} />
                                <span className="truncate">{choice.title}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Content: Goals vs Objectives */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    {!activeChoice ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted p-8 animate-fade-in-up">
                            <Target size={48} className="mb-4 opacity-50" />
                            <h3 className="text-xl mb-2 text-white">Nenhuma Escolha Selecionada</h3>
                            <p className="text-center max-w-md">
                                Selecione uma escolha estratégica no menu lateral ou crie uma nova para definir seus Goals e Objetivos.
                            </p>
                            {choices.length === 0 && (
                                <button className="btn btn-primary mt-6" onClick={() => { setEditingChoice(null); setShowChoiceModal(true); }}>
                                    <Plus size={16} /> Criar Primeira Escolha
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Choice Header */}
                            <div className="glass-surface p-6 border-b border-[var(--border-color)]">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="w-4 h-4 rounded-full" style={{ background: activeChoice.color, boxShadow: `0 0 10px ${activeChoice.color}` }} />
                                            <h2 className="text-2xl font-bold m-0">{activeChoice.title}</h2>
                                        </div>
                                        <p className="text-muted m-0">{activeChoice.description || 'Sem descrição.'}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="btn btn-glass" onClick={() => { setEditingChoice(activeChoice); setShowChoiceModal(true); }}>
                                            <Edit2 size={16} /> Editar Escolha
                                        </button>
                                        <button className="btn btn-danger" onClick={() => {
                                            if (confirm('Excluir esta escolha estratégica?')) {
                                                deleteChoice(activeChoice.id);
                                                setSelectedChoiceId(null);
                                            }
                                        }}>
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Split Panels: Goals (Left) | Objectives (Right) */}
                            <div className="flex-1 flex flex-col-md overflow-hidden overflow-y-auto-md">

                                {/* Goals Panel */}
                                <div className="w-1/2 w-full-md h-auto-md p-6 border-r border-r-0-md border-[var(--border-color)] flex flex-col gap-4 overflow-y-auto border-b-md">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-[var(--accent)] m-0 flex items-center gap-2">
                                            <Target size={18} /> Goals / KPIs (Medição)
                                        </h3>
                                        <button className="btn btn-primary btn-sm" onClick={() => { setEditingGoal(null); setShowGoalModal(true); }}>
                                            <Plus size={14} /> Novo Goal
                                        </button>
                                    </div>

                                    <div className="text-sm text-secondary mb-2">
                                        Métricas de negócio que indicam se esta escolha foi um sucesso. Vincule aos objetivos que devem movê-las.
                                    </div>

                                    {choiceGoals.length === 0 ? (
                                        <div className="glass-surface p-6 text-center text-muted rounded-lg border-dashed border-2 border-white/10 mt-4 animate-fade-in-up">
                                            Nenhum Goal definido para esta escolha.
                                        </div>
                                    ) : choiceGoals.map((goal, idx) => {
                                        const progress = goal.target_value > 0
                                            ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                                            : 0;

                                        let healthColor = 'var(--danger)';
                                        if (progress >= 80) healthColor = 'var(--success)';
                                        else if (progress >= 50) healthColor = '#f39c12';

                                        const linkedLaneIds = goalObjectiveLinks
                                            .filter(l => l.goal_id === goal.id)
                                            .map(l => l.lane_id);

                                        const isLinkingThis = linkingGoalId === goal.id;

                                        return (
                                            <div
                                                key={goal.id}
                                                className="glass-surface p-4 rounded-lg group animate-fade-in-up relative"
                                                style={{ animationDelay: `${idx * 0.05}s` }}
                                                onClick={e => e.stopPropagation()}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div
                                                        className="font-bold text-lg cursor-pointer hover:text-[var(--accent)] transition-colors"
                                                        onClick={() => { setEditingGoal(goal); setShowGoalModal(true); }}
                                                    >
                                                        {goal.title}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <div className="glass-badge">{FREQUENCY_LABELS[goal.frequency] || goal.frequency}</div>
                                                        <button
                                                            className="text-muted hover:text-white p-1 rounded transition-colors"
                                                            title="Vincular a Objetivos"
                                                            onClick={() => setLinkingGoalId(isLinkingThis ? null : goal.id)}
                                                        >
                                                            <LinkIcon size={14} className={isLinkingThis ? 'text-[var(--accent)]' : ''} />
                                                        </button>
                                                    </div>
                                                </div>

                                                <div className="flex justify-between text-sm mb-1 text-secondary">
                                                    <span>Progresso</span>
                                                    <span className="font-mono font-bold" style={{ color: healthColor }}>
                                                        {goal.current_value} / {goal.target_value} {goal.unit}
                                                    </span>
                                                </div>
                                                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden mb-3">
                                                    <div
                                                        className="h-full rounded-full transition-all duration-500"
                                                        style={{ width: `${progress}%`, background: healthColor }}
                                                    />
                                                </div>

                                                {/* Linked objectives badges */}
                                                {linkedLaneIds.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mb-2">
                                                        {linkedLaneIds.map(laneId => {
                                                            const lane = allLanes.find(l => l.id === laneId);
                                                            return lane ? (
                                                                <span
                                                                    key={laneId}
                                                                    className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                                                    style={{ background: `${activeChoice.color}22`, color: activeChoice.color, border: `1px solid ${activeChoice.color}44` }}
                                                                >
                                                                    <Check size={10} /> {lane.title}
                                                                </span>
                                                            ) : null;
                                                        })}
                                                    </div>
                                                )}

                                                {/* Linker Popover */}
                                                {isLinkingThis && (
                                                    <div className="absolute left-0 right-0 top-full mt-1 z-20 glass-surface rounded-lg border border-[var(--border-color)] shadow-xl p-3 animate-fade-in-up">
                                                        <div className="text-xs font-bold text-secondary uppercase tracking-wider mb-2 flex justify-between">
                                                            <span>Vincular a Objetivos</span>
                                                            <button className="text-muted hover:text-white" onClick={() => setLinkingGoalId(null)}><X size={12} /></button>
                                                        </div>
                                                        {allLanes.length === 0 ? (
                                                            <p className="text-xs text-muted italic">Nenhum objetivo criado ainda.</p>
                                                        ) : allLanes.map(lane => {
                                                            const isLinked = linkedLaneIds.includes(lane.id);
                                                            return (
                                                                <label key={lane.id} className="flex items-center gap-2 p-2 rounded hover:bg-white/5 cursor-pointer">
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={isLinked}
                                                                        onChange={() => handleToggleLink(goal.id, lane.id)}
                                                                        className="accent-[var(--accent)]"
                                                                    />
                                                                    <span className="text-sm">{lane.title}</span>
                                                                    {lane.strategicChoiceId && lane.strategicChoiceId !== selectedChoiceId && (
                                                                        <span className="text-xs text-muted ml-auto">outra escolha</span>
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Objectives Panel */}
                                <div className="w-1/2 w-full-md h-auto-md p-6 flex flex-col gap-4 overflow-y-auto bg-black/10">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-[var(--success)] m-0 flex items-center gap-2">
                                            <Check size={18} /> Objetivos (Execução)
                                        </h3>
                                        <div className="flex gap-2">
                                            {unassignedLanes.length > 0 && (
                                                <button className="btn btn-glass btn-sm" onClick={() => setShowLinkObjModal(true)}>
                                                    <LinkIcon size={14} /> Vincular existente
                                                </button>
                                            )}
                                            <button className="btn btn-glass btn-sm" onClick={() => setShowObjInput(true)}>
                                                <Plus size={14} /> Novo Objetivo
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-sm text-secondary mb-2">
                                        As apostas táticas que devem movimentar os Goals ao lado.
                                    </div>

                                    {showObjInput && (
                                        <div className="glass-surface p-3 rounded-lg flex gap-2">
                                            <input
                                                className="glass-input flex-1"
                                                autoFocus
                                                value={newObjTitle}
                                                onChange={e => setNewObjTitle(e.target.value)}
                                                placeholder="Título do novo objetivo..."
                                                onKeyDown={e => { if (e.key === 'Enter') handleAddObjective(); }}
                                            />
                                            <button className="btn btn-primary" onClick={handleAddObjective}>Salvar</button>
                                            <button className="btn btn-glass" onClick={() => setShowObjInput(false)}>Cancelar</button>
                                        </div>
                                    )}

                                    {choiceObjectives.length === 0 && !showObjInput ? (
                                        <div className="glass-surface p-6 text-center text-muted rounded-lg border-dashed border-2 border-white/10 mt-4 animate-fade-in-up">
                                            Nenhum Objetivo definido para esta escolha.
                                        </div>
                                    ) : choiceObjectives.map((obj, idx) => {
                                        const linkedGoals = getGoalsForLane(obj.id);
                                        return (
                                            <div
                                                key={obj.id}
                                                className="glass-surface p-4 border-l-4 rounded-lg flex flex-col justify-between animate-fade-in-up"
                                                style={{ borderColor: 'var(--success)', animationDelay: `${idx * 0.05}s` }}
                                            >
                                                <div className="flex justify-between items-start mb-2">
                                                    <div className="font-bold">{obj.title}</div>
                                                </div>
                                                <div className="text-sm text-secondary line-clamp-2">
                                                    {obj.problemOpportunity || <span className="italic text-muted">Defina o problema/oportunidade no Roadmap...</span>}
                                                </div>

                                                {/* Linked goals badges */}
                                                {linkedGoals.length > 0 && (
                                                    <div className="flex flex-wrap gap-1 mt-3">
                                                        {linkedGoals.map(g => (
                                                            <span
                                                                key={g.id}
                                                                className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
                                                                style={{ background: `${activeChoice.color}22`, color: activeChoice.color, border: `1px solid ${activeChoice.color}44` }}
                                                                title={`Meta: ${g.current_value}/${g.target_value} ${g.unit}`}
                                                            >
                                                                <Target size={10} /> {g.title}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                <div className="mt-4 pt-4 border-t border-[var(--border-color)] flex justify-between items-center text-xs">
                                                    <span className="text-muted flex items-center gap-1">
                                                        <LinkIcon size={12} /> {linkedGoals.length === 0 ? 'Nenhum Goal vinculado' : `${linkedGoals.length} Goal(s)`}
                                                    </span>
                                                    <button
                                                        className="btn btn-glass px-2 py-1 rounded"
                                                        onClick={() => navigate(`/board/${boardId}/roadmap`)}
                                                    >
                                                        Abrir Roadmap →
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </main>

            {/* Strategic Choice Form Modal */}
            {showChoiceModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowChoiceModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingChoice ? 'Editar Escolha Estratégica' : 'Nova Escolha Estratégica'}</h2>
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleSaveChoice({
                                title: formData.get('title'),
                                description: formData.get('description'),
                                color: formData.get('color')
                            });
                        }}>
                            <div className="modal-body flex flex-col gap-4">
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Título da Escolha *</label>
                                    <input name="title" className="glass-input p-2" defaultValue={editingChoice?.title} required autoFocus />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Descrição Contextual</label>
                                    <textarea name="description" className="glass-input p-2 h-24" defaultValue={editingChoice?.description} />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Cor Identificadora</label>
                                    <div className="flex gap-2">
                                        {['#ff9500', '#3498db', '#e74c3c', '#2ecc71', '#9b59b6', '#f1c40f'].map(color => (
                                            <label key={color} className="cursor-pointer relative">
                                                <input type="radio" name="color" value={color} defaultChecked={(editingChoice?.color || '#ff9500') === color} className="peer sr-only" />
                                                <div className="w-8 h-8 rounded-full border-2 border-transparent peer-checked:border-white transition-all transform peer-checked:scale-110" style={{ background: color }}></div>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => setShowChoiceModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Escolha</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Link Existing Lane Modal */}
            {showLinkObjModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowLinkObjModal(false)}>
                    <div className="modal-content" style={{ maxWidth: 480 }} onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Vincular Objetivo Existente</h2>
                            <button className="btn-icon-sm ml-auto" onClick={() => setShowLinkObjModal(false)}><X size={16} /></button>
                        </div>
                        <div className="modal-body flex flex-col gap-2">
                            <p className="text-sm text-secondary mb-2">
                                Selecione um objetivo (lane) existente para associá-lo à escolha <strong>{activeChoice?.title}</strong>.
                            </p>
                            {unassignedLanes.map(lane => (
                                <button
                                    key={lane.id}
                                    className="w-full text-left p-3 rounded-lg glass-surface hover:bg-white/10 transition-colors flex justify-between items-center"
                                    onClick={() => handleLinkExistingLane(lane.id)}
                                >
                                    <span className="font-medium">{lane.title}</span>
                                    {lane.strategicChoiceId && (
                                        <span className="text-xs text-muted">já vinculado a outra escolha</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Goal Form Modal */}
            {showGoalModal && (
                <div className="modal-overlay" style={{ zIndex: 1000 }} onClick={() => setShowGoalModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>{editingGoal ? 'Editar Goal/KPI' : 'Novo Goal/KPI'}</h2>
                            {editingGoal && (
                                <button className="btn-icon-sm ml-auto text-danger hover:bg-danger/20 p-2 rounded" onClick={() => {
                                    if (confirm('Excluir este goal?')) deleteGoal(editingGoal.id); setShowGoalModal(false);
                                }}>
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <form onSubmit={(e) => {
                            e.preventDefault();
                            const formData = new FormData(e.target);
                            handleSaveGoal({
                                title: formData.get('title'),
                                targetValue: parseFloat(formData.get('targetValue')),
                                currentValue: parseFloat(formData.get('currentValue')),
                                unit: formData.get('unit'),
                                frequency: formData.get('frequency')
                            });
                        }}>
                            <div className="modal-body grid grid-cols-2 gap-4">
                                <div className="form-group col-span-2 flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Indicador *</label>
                                    <input name="title" className="glass-input p-2" defaultValue={editingGoal?.title} required placeholder="ex: Receita Mensal Recorrente" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Valor Atual</label>
                                    <input name="currentValue" type="number" step="0.01" className="glass-input p-2" defaultValue={editingGoal ? editingGoal.current_value : ''} required placeholder="0" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Meta (Target)</label>
                                    <input name="targetValue" type="number" step="0.01" className="glass-input p-2" defaultValue={editingGoal ? editingGoal.target_value : ''} required placeholder="100" />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Unidade</label>
                                    <input name="unit" className="glass-input p-2" defaultValue={editingGoal?.unit || ''} placeholder="%, R$, mi..." />
                                </div>
                                <div className="form-group flex flex-col gap-1">
                                    <label className="text-sm font-bold text-secondary">Frequência</label>
                                    <select name="frequency" className="glass-input p-2" defaultValue={editingGoal?.frequency || 'quarterly'}>
                                        <option value="daily">Diária</option>
                                        <option value="weekly">Semanal</option>
                                        <option value="monthly">Mensal</option>
                                        <option value="quarterly">Trimestral (Quarter)</option>
                                    </select>
                                </div>
                            </div>
                            <div className="modal-footer justify-end gap-2 p-4 border-t border-[var(--border-color)]">
                                <button type="button" className="btn btn-glass" onClick={() => setShowGoalModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary">Salvar Goal</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
