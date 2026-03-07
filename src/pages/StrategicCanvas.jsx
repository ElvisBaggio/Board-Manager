import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { useStrategicChoices } from '../hooks/useStrategicChoices';
import { useGoals } from '../hooks/useGoals';
import PlanHeader from '../components/PlanHeader';
import PlanWelcome from '../components/PlanWelcome';
import { Edit2, Check, Target, Crosshair, BarChart3, TrendingUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export default function StrategicCanvas() {
    const { id: planId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { getPlan, loadPlanData, updatePlan } = usePlans(user?.id);
    const { choices, fetchChoices } = useStrategicChoices(planId);
    const { boardGoals, fetchBoardGoals } = useGoals(planId);

    const plan = getPlan(planId);

    const { addToast } = useToast();
    const [editingField, setEditingField] = useState(null);
    const [fieldValues, setFieldValues] = useState({
        justCause: '',
        vision: '',
        mission: ''
    });

    useEffect(() => {
        if (planId) {
            loadPlanData(planId);
            fetchChoices();
            fetchBoardGoals();
        }
    }, [planId, loadPlanData, fetchChoices, fetchBoardGoals]);

    useEffect(() => {
        if (plan) {
            setFieldValues({
                justCause: plan.justCause || '',
                vision: plan.vision || '',
                mission: plan.mission || ''
            });
        }
    }, [plan]);

    const handleSaveField = async (field) => {
        await updatePlan(planId, { [field]: fieldValues[field] });
        setEditingField(null);
        addToast('Salvo com sucesso.', 'success');
    };

    if (!plan) return <div className="p-8">Carregando...</div>;

    const renderEditableField = (field, label, icon) => {
        const isEditing = editingField === field;
        const value = fieldValues[field];

        return (
            <div className="canvas-field glass-surface p-6 rounded-lg mb-6 relative group">
                <div className="flex items-center gap-2 mb-3 text-accent font-bold">
                    {icon}
                    <h3 className="m-0 uppercase tracking-wider text-sm flex-1">{label}</h3>
                    {!isEditing && (
                        <button
                            className="btn btn-glass px-3 py-1 text-xs opacity-70 hover:opacity-100 transition-opacity flex items-center gap-1 cursor-pointer rounded-full"
                            onClick={(e) => { e.stopPropagation(); setEditingField(field); }}
                        >
                            <Edit2 size={12} /> Editar
                        </button>
                    )}
                </div>

                {isEditing ? (
                    <div className="flex flex-col gap-3">
                        <textarea
                            className="glass-input w-full min-h-[100px] p-3 resize-y"
                            value={value}
                            onChange={(e) => setFieldValues(prev => ({ ...prev, [field]: e.target.value }))}
                            placeholder={`Descreva a ${label.toLowerCase()}...`}
                            autoFocus
                        />
                        <div className="flex justify-end gap-2">
                            <button className="btn btn-glass btn-sm" onClick={() => setEditingField(null)}>Cancelar</button>
                            <button className="btn btn-primary btn-sm" onClick={() => handleSaveField(field)}>
                                <Check size={14} /> Salvar
                            </button>
                        </div>
                    </div>
                ) : (
                    <div
                        className="text-lg leading-relaxed whitespace-pre-wrap cursor-pointer hover:bg-white/5 p-2 -mx-2 rounded transition-colors"
                        onClick={() => setEditingField(field)}
                    >
                        {board[field] || <span className="text-muted italic">Não definido. Clique para editar.</span>}
                    </div>
                )}
            </div>
        );
    };

    const getGoalsForChoice = (choiceId) => boardGoals.filter(g => g.strategic_choice_id === choiceId);

    const isEmptyBoard = !board.justCause && !board.vision && !board.mission && choices.length === 0;

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)]">
            <PlanHeader plan={plan} planId={planId} currentView="canvas" />

            <main className="flex-1 overflow-y-auto" style={{ padding: 'clamp(16px, 3vw, 32px)' }}>
                <div className="max-w-6xl mx-auto">

                    {isEmptyPlan && <PlanWelcome planId={planId} />}

                    {/* Top Layer: Purpose & Identity */}
                    <div className="mb-12 animate-fade-in">
                        {renderEditableField('justCause', 'Causa Justa', <Target size={18} />)}

                        <div className="canvas-grid grid grid-cols-2 gap-6 mt-6">
                            {renderEditableField('vision', 'Visão', <Crosshair size={18} />)}
                            {renderEditableField('mission', 'Missão', <TrendingUp size={18} />)}
                        </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold m-0 flex items-center gap-2">
                            <BarChart3 size={24} className="text-accent" />
                            Escolhas Estratégicas & Metas (O que perseguimos vs Como medimos)
                        </h2>
                        <button className="btn btn-primary" onClick={() => navigate(`/plan/${planId}/choices`)}>
                            Gerenciar Escolhas
                        </button>
                    </div>

                    {/* Middle Layer: Strategic Choices & Goals */}
                    <div className="grid gap-6">
                        {choices.length === 0 ? (
                            <div className="empty-state glass-surface animate-fade-in-up" style={{ padding: '64px 32px' }}>
                                <div className="empty-state-icon"><Target size={48} /></div>
                                <p>Nenhuma escolha estratégica definida</p>
                                <button className="btn btn-primary mt-4" onClick={() => navigate(`/plan/${planId}/choices`)}>
                                    <Target size={16} /> Criar Primeira Escolha
                                </button>
                            </div>
                        ) : (
                            choices.map((choice, idx) => {
                                const goals = getGoalsForChoice(choice.id);
                                return (
                                    <div key={choice.id} className="glass-surface rounded-lg overflow-hidden flex flex-col-md border-l-4 animate-fade-in-up cursor-pointer hover:border-opacity-100 transition-all" style={{ borderColor: choice.color, animationDelay: `${idx * 0.05}s` }} onClick={() => navigate(`/plan/${planId}/choices`)}>
                                        {/* Left Side: The Choice */}
                                        <div className="w-1/2 w-full-md p-6 border-r border-r-0-md border-b-md border-[var(--border-color)]">
                                            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                                                <span className="w-3 h-3 rounded-full" style={{ background: choice.color }} />
                                                {choice.title}
                                            </h3>
                                            <p className="text-muted mb-6 whitespace-pre-wrap">{choice.description}</p>

                                            {/* Summary stats - can be expanded later by fetching lanes/execution_items counts */}
                                            <div className="flex gap-4 text-sm text-secondary">
                                                <div className="glass-badge px-3 py-1 rounded-full bg-white/5 border border-white/10">
                                                    Objetivos vinculados
                                                </div>
                                                <button
                                                    className="glass-badge px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer"
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/plan/${planId}/roadmap`); }}
                                                >
                                                    Ver no Roadmap →
                                                </button>
                                            </div>
                                        </div>

                                        {/* Right Side: The Goals measuring it */}
                                        <div className="w-1/2 w-full-md p-6 bg-black/10">
                                            <h4 className="text-sm font-bold uppercase tracking-wider text-secondary mb-4">Goals / KPIs Indicadores de Sucesso</h4>

                                            {goals.length === 0 ? (
                                                <div className="text-sm text-muted italic">Nenhuma meta definida para esta escolha.</div>
                                            ) : (
                                                <div className="flex flex-col gap-4">
                                                    {goals.map(goal => {
                                                        const progress = goal.target_value > 0
                                                            ? Math.min(100, Math.round((goal.current_value / goal.target_value) * 100))
                                                            : 0;

                                                        let healthColor = 'var(--danger)';
                                                        if (progress >= 80) healthColor = 'var(--success)';
                                                        else if (progress >= 50) healthColor = '#f39c12'; // yellow

                                                        return (
                                                            <div key={goal.id} className="flex flex-col gap-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="font-medium">{goal.title}</span>
                                                                    <span className="font-mono text-xs font-bold" style={{ color: healthColor }}>
                                                                        {goal.current_value} / {goal.target_value} {goal.unit}
                                                                    </span>
                                                                </div>
                                                                <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full rounded-full transition-all duration-500"
                                                                        style={{
                                                                            width: `${progress}%`,
                                                                            background: healthColor,
                                                                            boxShadow: `0 0 10px ${healthColor}`
                                                                        }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
