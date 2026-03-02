import { useState, useEffect } from 'react';
import { useExecutionItems } from '../hooks/useExecutionItems';
import { useIndicators } from '../hooks/useIndicators';
import { Plus, Trash2, GripVertical, Activity, Zap, Circle, CheckCircle2, Clock, AlertOctagon, User } from 'lucide-react';

const ITEM_TYPES = {
    'Epic': { label: 'Épico', color: 'var(--accent)', icon: '🟣' },
    'Story': { label: 'Story', color: '#3498db', icon: '🔵' },
    'Feature': { label: 'Feature', color: 'var(--success)', icon: '🟢' },
    'Tech Story': { label: 'Tech', color: '#e67e22', icon: '🟠' }
};

// Status aligned with DB values
const STATUS_CYCLE = ['Not Started', 'On Going', 'Done', 'Blocked'];
const STATUS_LABELS = {
    'Not Started': 'A Fazer',
    'On Going': 'Em Andamento',
    'Done': 'Concluído',
    'Blocked': 'Bloqueado'
};

function StatusIcon({ status, size = 18 }) {
    if (status === 'Done') return <CheckCircle2 size={size} className="text-[var(--success)]" />;
    if (status === 'On Going') return <Activity size={size} className="text-[var(--accent)]" />;
    if (status === 'Blocked') return <AlertOctagon size={size} className="text-[var(--danger)]" />;
    return <Circle size={size} />;
}

export default function ExecutionPanel({ featureId, boardId }) {
    const { items, fetchItemsByFeature, addItem, updateItem, deleteItem } = useExecutionItems(featureId);
    const {
        boardProductIndicators, fetchBoardProductIndicators, addProductIndicator, updateProductIndicator, deleteProductIndicator,
        efficiencyIndicators, fetchEfficiencyIndicators
    } = useIndicators(boardId);

    const [newItemTitle, setNewItemTitle] = useState('');
    const [newItemType, setNewItemType] = useState('Story');
    const [newItemEffort, setNewItemEffort] = useState('');
    const [newItemAssignee, setNewItemAssignee] = useState('');
    const [newIndTitle, setNewIndTitle] = useState('');
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        if (featureId) {
            fetchItemsByFeature(featureId);
            fetchBoardProductIndicators();
            fetchEfficiencyIndicators();
        }
    }, [featureId, fetchItemsByFeature, fetchBoardProductIndicators, fetchEfficiencyIndicators]);

    useEffect(() => {
        if (boardId) {
            fetch(`/api/resources?boardId=${boardId}`)
                .then(r => r.ok ? r.json() : [])
                .then(data => setTeamMembers(data))
                .catch(() => {});
        }
    }, [boardId]);

    // Filter indicators for this specific feature/initiative
    const featureIndicators = boardProductIndicators.filter(i => i.feature_id === featureId);

    const handleAddItem = async () => {
        if (!newItemTitle.trim()) return;
        await addItem({
            featureId,
            title: newItemTitle.trim(),
            itemType: newItemType,
            status: 'Not Started',
            effortHours: newItemEffort ? parseFloat(newItemEffort) : null,
            assigneeId: newItemAssignee || null,
        });
        setNewItemTitle('');
        setNewItemEffort('');
        setNewItemAssignee('');
    };

    const handleAddIndicator = async () => {
        if (!newIndTitle.trim()) return;
        await addProductIndicator({ featureId, title: newIndTitle.trim(), targetValue: 100, currentValue: 0, unit: '%' });
        setNewIndTitle('');
        fetchBoardProductIndicators();
    };

    const toggleItemStatus = (item) => {
        const currentIndex = STATUS_CYCLE.indexOf(item.status);
        const nextStatus = STATUS_CYCLE[(currentIndex + 1) % STATUS_CYCLE.length];
        updateItem(item.id, { status: nextStatus });
    };

    const progress = items.length > 0
        ? Math.round((items.filter(i => i.status === 'Done').length / items.length) * 100)
        : 0;

    const assigneeMap = Object.fromEntries(teamMembers.map(m => [m.id, m]));

    return (
        <div className="flex flex-col gap-6 h-full overflow-y-auto pr-2 custom-scrollbar">

            {/* Top Indicators Row */}
            <div className="grid grid-cols-2 gap-4">
                {/* Product Indicators */}
                <div className="glass-surface p-4 rounded-lg bg-black/10">
                    <h4 className="text-sm font-bold text-[var(--accent)] mb-3 flex justify-between items-center">
                        <span className="flex items-center gap-1"><Activity size={14} /> Indicadores de Produto</span>
                    </h4>

                    <div className="flex flex-col gap-2 mb-3">
                        {featureIndicators.map(ind => {
                            const prog = ind.target_value > 0 ? Math.min(100, (ind.current_value / ind.target_value) * 100) : 0;
                            return (
                                <div key={ind.id} className="flex flex-col gap-1 text-sm bg-white/5 p-2 rounded relative group">
                                    <div className="flex justify-between">
                                        <span className="truncate pr-4" title={ind.title}>{ind.title}</span>
                                        <span className="font-mono text-xs text-secondary">{ind.current_value}/{ind.target_value}{ind.unit}</span>
                                    </div>
                                    <div className="h-1 w-full bg-black/40 rounded-full overflow-hidden">
                                        <div className="h-full transition-all" style={{ width: `${prog}%`, background: 'var(--accent)' }} />
                                    </div>
                                    <div className="absolute right-1 top-1 flex gap-1 opacity-0 group-hover:opacity-100">
                                        <button
                                            className="text-secondary hover:text-white p-1 bg-black/40 rounded text-xs"
                                            onClick={() => {
                                                const val = prompt('Novo valor atual:', ind.current_value);
                                                if (val !== null && !isNaN(parseFloat(val))) {
                                                    updateProductIndicator(ind.id, { currentValue: parseFloat(val) });
                                                    fetchBoardProductIndicators();
                                                }
                                            }}
                                        >✏️</button>
                                        <button
                                            className="text-danger p-1 bg-black/40 rounded text-xs"
                                            onClick={() => confirm('Remover indicador?') && deleteProductIndicator(ind.id)}
                                        >
                                            <Trash2 size={11} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                        {featureIndicators.length === 0 && <div className="text-xs text-muted italic">Nenhum indicador definido.</div>}
                    </div>

                    <div className="flex gap-2">
                        <input
                            className="glass-input flex-1 text-sm p-1.5"
                            placeholder="Novo indicador..."
                            value={newIndTitle} onChange={e => setNewIndTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddIndicator()}
                        />
                        <button className="btn btn-primary btn-sm px-2" onClick={handleAddIndicator}><Plus size={14} /></button>
                    </div>
                </div>

                {/* Team Efficiency Summary */}
                <div className="glass-surface p-4 rounded-lg bg-black/10">
                    <h4 className="text-sm font-bold text-purple-400 mb-3 flex justify-between items-center">
                        <span className="flex items-center gap-1"><Zap size={14} /> Eficiência do Time</span>
                    </h4>
                    <div className="flex flex-col gap-2 text-sm">
                        {efficiencyIndicators.slice(0, 3).map(eff => (
                            <div key={eff.id} className="flex justify-between items-center bg-white/5 p-2 rounded text-secondary">
                                <span className="truncate">{eff.title}</span>
                                <span className="font-mono font-bold text-white">{eff.value} {eff.unit}</span>
                            </div>
                        ))}
                        {efficiencyIndicators.length === 0 && <div className="text-xs text-muted italic">Métricas de eficiência não cadastradas.</div>}
                    </div>
                </div>
            </div>

            {/* Execution Items List */}
            <div className="glass-surface p-4 rounded-lg flex-1 flex flex-col min-h-[300px]">
                <div className="flex justify-between items-end mb-4 border-b border-[var(--border-color)] pb-2">
                    <div>
                        <h4 className="font-bold text-lg m-0 flex items-center gap-2">Itens de Execução</h4>
                        <span className="text-sm text-secondary">
                            Progresso: <strong className={progress === 100 ? 'text-[var(--success)]' : 'text-white'}>{progress}%</strong> ({items.filter(i => i.status === 'Done').length}/{items.length})
                        </span>
                    </div>
                </div>

                {/* Add new item */}
                <div className="flex flex-col gap-2 mb-4 bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="flex gap-2">
                        <select
                            className="glass-select w-28 text-sm"
                            value={newItemType}
                            onChange={e => setNewItemType(e.target.value)}
                        >
                            {Object.keys(ITEM_TYPES).map(t => <option key={t} value={t}>{ITEM_TYPES[t].label}</option>)}
                        </select>
                        <input
                            className="glass-input flex-1"
                            placeholder="O que precisa ser feito?"
                            value={newItemTitle}
                            onChange={e => setNewItemTitle(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleAddItem()}
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex items-center gap-1 flex-1">
                            <Clock size={13} className="text-muted" />
                            <input
                                className="glass-input flex-1 text-sm"
                                type="number"
                                min="0"
                                step="0.5"
                                placeholder="Horas estimadas"
                                value={newItemEffort}
                                onChange={e => setNewItemEffort(e.target.value)}
                            />
                        </div>
                        {teamMembers.length > 0 && (
                            <div className="flex items-center gap-1 flex-1">
                                <User size={13} className="text-muted" />
                                <select
                                    className="glass-select flex-1 text-sm"
                                    value={newItemAssignee}
                                    onChange={e => setNewItemAssignee(e.target.value)}
                                >
                                    <option value="">Responsável...</option>
                                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                </select>
                            </div>
                        )}
                        <button className="btn btn-primary" onClick={handleAddItem}>Adicionar</button>
                    </div>
                </div>

                {/* Progress bar */}
                {items.length > 0 && (
                    <div className="h-1.5 w-full bg-black/40 rounded-full overflow-hidden mb-3">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, background: 'var(--success)' }}
                        />
                    </div>
                )}

                {/* List */}
                <div className="flex flex-col gap-1 overflow-y-auto">
                    {items.length === 0 ? (
                        <div className="text-center p-8 text-muted italic border border-dashed border-white/10 rounded">
                            Nenhum item de execução cadastrado.
                        </div>
                    ) : (
                        items.map(item => {
                            const assignee = item.assignee_id ? assigneeMap[item.assignee_id] : null;
                            return (
                                <div key={item.id} className="flex items-center gap-3 p-2 bg-white/5 hover:bg-white/10 rounded group transition-colors">
                                    <span className="cursor-grab text-muted opacity-30 group-hover:opacity-100 hover:text-white">
                                        <GripVertical size={14} />
                                    </span>

                                    <button
                                        className="text-muted hover:text-[var(--success)] transition-colors flex-shrink-0"
                                        onClick={() => toggleItemStatus(item)}
                                        title={STATUS_LABELS[item.status] || item.status}
                                    >
                                        <StatusIcon status={item.status} />
                                    </button>

                                    <span className="text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0" style={{ background: `${ITEM_TYPES[item.item_type || item.itemType]?.color}22`, color: ITEM_TYPES[item.item_type || item.itemType]?.color }}>
                                        {ITEM_TYPES[item.item_type || item.itemType]?.icon} {ITEM_TYPES[item.item_type || item.itemType]?.label}
                                    </span>

                                    <span className={`flex-1 text-sm ${item.status === 'Done' ? 'line-through text-muted' : ''}`}>
                                        {item.title}
                                    </span>

                                    {item.effort_hours && (
                                        <span className="text-xs text-secondary flex items-center gap-1 flex-shrink-0">
                                            <Clock size={11} />{item.effort_hours}h
                                        </span>
                                    )}

                                    {assignee && (
                                        <span
                                            className="text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0"
                                            style={{ background: assignee.avatar_color || '#555', color: '#fff' }}
                                            title={assignee.name}
                                        >
                                            {assignee.name?.[0]?.toUpperCase()}
                                        </span>
                                    )}

                                    <span className="text-xs text-secondary w-24 text-right flex-shrink-0">{STATUS_LABELS[item.status] || item.status}</span>

                                    <button
                                        className="text-danger opacity-0 group-hover:opacity-100 p-1 hover:bg-danger/20 rounded ml-1 flex-shrink-0"
                                        onClick={() => confirm('Excluir item?') && deleteItem(item.id)}
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
