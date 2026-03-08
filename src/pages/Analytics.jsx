import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePlans } from '../hooks/usePlans';
import { useGoals } from '../hooks/useGoals';
import { useExecutionItems } from '../hooks/useExecutionItems';
import PlanHeader from '../components/PlanHeader';
import CapacityDashboard from '../components/CapacityDashboard';
import RiskMatrix from '../components/RiskMatrix';
import { useTeamMembers } from '../hooks/useResources';
import { useRisks } from '../hooks/useRisks';
import { calcProgress } from '../utils/calculations';
import { BarChart3, Target, CheckCircle, AlertCircle, TrendingUp, Clock, Users, Shield, ArrowRight, Map, GitMerge } from 'lucide-react';

// Consistent with StrategicCanvas / StrategicChoices thresholds
function healthColor(pct) {
    if (pct >= 80) return 'var(--success)';
    if (pct >= 50) return '#f39c12';
    return 'var(--danger)';
}

function CircleProgress({ pct, size = 72, stroke = 7 }) {
    const r = (size - stroke * 2) / 2;
    const circ = 2 * Math.PI * r;
    const offset = circ - (pct / 100) * circ;
    const color = healthColor(pct);
    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', display: 'block' }}>
            <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={stroke} />
            <circle
                cx={size / 2} cy={size / 2} r={r} fill="none"
                stroke={color} strokeWidth={stroke}
                strokeDasharray={circ} strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
        </svg>
    );
}

function ProgressBar({ pct, color }) {
    return (
        <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
            <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }}
            />
        </div>
    );
}

export default function Analytics() {
    const { id: planId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { plans, loadPlanData, getLanes, getFeaturesForPlan } = usePlans(user?.id);
    const { boardGoals, fetchBoardGoals } = useGoals(planId);
    const { featureCounts, fetchBoardCounts } = useExecutionItems(planId);
    const [keyResults, setKeyResults] = useState([]);
    const [showCapacity, setShowCapacity] = useState(false);
    const [showRiskMatrix, setShowRiskMatrix] = useState(false);
    const [capacityYear] = useState(new Date().getFullYear());
    const { members } = useTeamMembers(planId);
    const { risks } = useRisks(planId);

    useEffect(() => {
        if (!planId) return;
        loadPlanData(planId);
        fetchBoardGoals();
        fetchBoardCounts();
        fetch(`/api/okrs/board?planId=${planId}`)
            .then(r => r.ok ? r.json() : [])
            .then(setKeyResults)
            .catch(console.error);
    }, [planId]);

    const plan = plans.find(b => b.id === planId);
    const lanes = getLanes(planId);
    const features = getFeaturesForPlan(planId);

    const total = features.length;
    const byStatus = {
        Done: features.filter(f => f.status === 'Done').length,
        'On Going': features.filter(f => f.status === 'On Going').length,
        'Not Started': features.filter(f => f.status === 'Not Started').length,
        Blocked: features.filter(f => f.status === 'Blocked').length,
    };
    const pctDone = total > 0 ? Math.round((byStatus.Done / total) * 100) : 0;

    const laneHealth = lanes.map(lane => {
        const lf = features.filter(f => f.laneId === lane.id);
        const done = lf.filter(f => f.status === 'Done').length;
        const pct = lf.length > 0 ? Math.round((done / lf.length) * 100) : 0;
        const totalExec = lf.reduce((s, f) => s + (featureCounts[f.id]?.total || 0), 0);
        const doneExec = lf.reduce((s, f) => s + (featureCounts[f.id]?.done || 0), 0);
        return { ...lane, featureCount: lf.length, done, pct, totalExec, doneExec };
    });

    const krsByLane = keyResults.reduce((acc, kr) => {
        const key = kr.laneTitle || kr.lane_title || 'Sem objetivo';
        if (!acc[key]) acc[key] = [];
        acc[key].push(kr);
        return acc;
    }, {});

    const isEmpty = total === 0 && boardGoals.length === 0 && keyResults.length === 0;

    return (
        <div className="h-screen flex flex-col overflow-hidden bg-[var(--bg-color)] text-[var(--text-color)]">
            <PlanHeader plan={plan} planId={planId} currentView="analytics" />

            <main className="flex-1 overflow-y-auto p-8">
                <div className="max-w-6xl mx-auto">

                    <div className="flex items-center gap-3 mb-8 animate-fade-in">
                        <BarChart3 size={24} className="text-[var(--accent)]" />
                        <h2 className="text-2xl font-bold m-0">Analytics do Portfólio</h2>
                    </div>

                    {isEmpty ? (
                        <div className="empty-state glass-surface animate-fade-in-up" style={{ padding: '64px 32px' }}>
                            <div className="empty-state-icon"><BarChart3 size={48} /></div>
                            <p>Nenhum dado disponível ainda.</p>
                            <p className="text-sm text-muted mt-2">Adicione iniciativas no Roadmap para ver o Analytics.</p>
                            <button className="btn btn-primary mt-4" onClick={() => navigate(`/plan/${planId}/roadmap`)}>
                                <Map size={16} /> Ir para o Roadmap
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Section 1: Portfolio Summary */}
                            <section className="mb-12 animate-fade-in-up">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0 mb-4">
                                    Resumo do Portfólio
                                </h3>
                                <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))' }}>
                                    <div className="glass-surface rounded-lg p-5 flex flex-col items-center gap-2">
                                        <div className="relative flex items-center justify-center">
                                            <CircleProgress pct={pctDone} size={72} stroke={7} />
                                            <span className="absolute text-base font-bold">{pctDone}%</span>
                                        </div>
                                        <span className="text-xs text-muted">Concluído</span>
                                    </div>

                                    {[
                                        { label: 'Total', value: total, color: 'var(--accent)', Icon: Target },
                                        { label: 'Concluídas', value: byStatus.Done, color: 'var(--success)', Icon: CheckCircle },
                                        { label: 'Em Andamento', value: byStatus['On Going'], color: '#3b82f6', Icon: TrendingUp },
                                        { label: 'Não Iniciadas', value: byStatus['Not Started'], color: 'var(--text-muted)', Icon: Clock },
                                        { label: 'Bloqueadas', value: byStatus.Blocked, color: 'var(--danger)', Icon: AlertCircle, action: byStatus.Blocked > 0 ? { label: 'Ver no Roadmap', view: 'roadmap' } : null },
                                    ].map(({ label, value, color, Icon, action }) => (
                                        <div key={label} className="glass-surface rounded-lg p-5 flex flex-col justify-between">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs text-muted font-bold uppercase tracking-wide">{label}</span>
                                                <Icon size={16} style={{ color }} />
                                            </div>
                                            <span className="text-2xl font-bold" style={{ color }}>{value}</span>
                                            {action && (
                                                <button
                                                    className="text-xs mt-2 flex items-center gap-1 hover:underline"
                                                    style={{ color, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                    onClick={() => navigate(`/plan/${planId}/${action.view}`)}
                                                >
                                                    {action.label} <ArrowRight size={10} />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Section 2: Objective Health */}
                            {laneHealth.length > 0 && (
                                <section className="mb-12 animate-fade-in-up">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0 mb-4">
                                        Saúde por Objetivo
                                    </h3>
                                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                        {laneHealth.map((lane, idx) => {
                                            const color = healthColor(lane.pct);
                                            return (
                                                <div
                                                    key={lane.id}
                                                    className="glass-surface rounded-lg p-4 border-l-4 animate-fade-in-up"
                                                    style={{ borderColor: color, animationDelay: `${idx * 0.04}s` }}
                                                >
                                                    <div className="flex justify-between items-center mb-2">
                                                        <span className="font-bold truncate flex-1 mr-3">{lane.title}</span>
                                                        <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color }}>{lane.pct}%</span>
                                                    </div>
                                                    <ProgressBar pct={lane.pct} color={color} />
                                                    <div className="flex gap-4 mt-2 text-xs text-muted">
                                                        <span>{lane.done}/{lane.featureCount} iniciativas</span>
                                                        {lane.totalExec > 0 && <span>{lane.doneExec}/{lane.totalExec} tarefas</span>}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Section 3: Goals / KPIs */}
                            {boardGoals.length > 0 && (
                                <section className="mb-12 animate-fade-in-up">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0 mb-4">
                                        Progresso dos Goals / KPIs
                                    </h3>
                                    <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
                                        {boardGoals.map((goal, idx) => {
                                            const curr = parseFloat(goal.current_value) || 0;
                                            const tgt = parseFloat(goal.target_value) || 1;
                                            const pct = calcProgress(curr, tgt, goal.lower_is_better);
                                            const color = healthColor(pct);
                                            return (
                                                <div
                                                    key={goal.id}
                                                    className="glass-surface rounded-lg p-4 animate-fade-in-up"
                                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold flex-1 mr-3">
                                                            {goal.title}
                                                            {goal.lower_is_better && <span className="ml-1 text-[10px] opacity-60 text-[var(--accent)]" title="Menor é melhor">↓</span>}
                                                        </span>
                                                        <span className="font-mono font-bold text-sm flex-shrink-0" style={{ color }}>{pct}%</span>
                                                    </div>
                                                    {goal.choice_title && (
                                                        <span className="text-xs text-[var(--accent)] opacity-70 block mb-2">{goal.choice_title}</span>
                                                    )}
                                                    <ProgressBar pct={pct} color={color} />
                                                    <div className="flex justify-between mt-2 text-xs text-secondary">
                                                        <span>Atual: <span className="font-mono font-bold" style={{ color }}>{curr}</span></span>
                                                        <span>Meta: <span className="font-mono">{tgt}</span>{goal.unit ? ` ${goal.unit}` : ''}</span>
                                                    </div>
                                                    {pct < 50 && (
                                                        <button
                                                            className="text-xs mt-2 flex items-center gap-1 hover:underline"
                                                            style={{ color: 'var(--danger)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                                                            onClick={() => navigate(`/plan/${planId}/metrics`)}
                                                        >
                                                            Atualizar em Métricas <ArrowRight size={10} />
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </section>
                            )}

                            {/* Section 4: Key Results */}
                            {Object.keys(krsByLane).length > 0 && (
                                <section className="mb-12 animate-fade-in-up">
                                    <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0 mb-4">
                                        Key Results por Objetivo
                                    </h3>
                                    <div className="flex flex-col gap-4">
                                        {Object.entries(krsByLane).map(([laneTitle, krs]) => (
                                            <div key={laneTitle} className="glass-surface rounded-lg overflow-hidden">
                                                <div className="px-5 py-3 bg-black/20 border-b border-[var(--border-color)]">
                                                    <h4 className="font-bold text-sm m-0 text-[var(--accent)]">{laneTitle}</h4>
                                                </div>
                                                <div className="p-4 flex flex-col gap-4">
                                                    {krs.map(kr => {
                                                        const curr = parseFloat(kr.currentValue ?? kr.current_value) || 0;
                                                        const tgt = parseFloat(kr.targetValue ?? kr.target_value) || 1;
                                                        const pct = calcProgress(curr, tgt, kr.lowerIsBetter || kr.lower_is_better);
                                                        const color = healthColor(pct);
                                                        return (
                                                            <div key={kr.id} className="flex flex-col gap-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="font-medium flex-1 mr-3">
                                                                        {kr.title}
                                                                        {(kr.lowerIsBetter || kr.lower_is_better) && <span className="ml-1 text-[10px] opacity-60 text-[var(--accent)]" title="Menor é melhor">↓</span>}
                                                                    </span>
                                                                    <span className="font-mono font-bold flex-shrink-0" style={{ color }}>{pct}%</span>
                                                                </div>
                                                                <ProgressBar pct={pct} color={color} />
                                                                <div className="text-xs text-muted">
                                                                    {curr} / {tgt}{kr.unit ? ` ${kr.unit}` : ''}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            )}
                            {/* Section 5: Capacidade do Time */}
                            <section className="mb-12 animate-fade-in-up">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0 mb-4">
                                    Capacidade do Time
                                </h3>
                                <div className="glass-surface rounded-lg p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Users size={24} style={{ color: 'var(--accent)' }} />
                                            <div>
                                                <span className="text-2xl font-bold">{members.length}</span>
                                                <span className="text-sm text-muted ml-2">
                                                    {members.length === 1 ? 'membro' : 'membros'} no time
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-glass"
                                            onClick={() => setShowCapacity(true)}
                                        >
                                            Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            </section>

                            {/* Section 6: Matriz de Riscos */}
                            <section className="mb-12 animate-fade-in-up">
                                <h3 className="font-bold text-sm uppercase tracking-wider text-secondary m-0 mb-4">
                                    Matriz de Riscos
                                </h3>
                                <div className="glass-surface rounded-lg p-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Shield size={24} style={{ color: risks.length > 0 ? 'var(--danger)' : 'var(--success)' }} />
                                            <div>
                                                <span className="text-2xl font-bold">{risks.length}</span>
                                                <span className="text-sm text-muted ml-2">
                                                    {risks.length === 1 ? 'risco mapeado' : 'riscos mapeados'}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            className="btn btn-glass"
                                            onClick={() => setShowRiskMatrix(true)}
                                        >
                                            Ver Detalhes
                                        </button>
                                    </div>
                                </div>
                            </section>
                        </>
                    )}
                </div>
            </main>

            {showCapacity && (
                <CapacityDashboard
                    planId={planId}
                    year={capacityYear}
                    onClose={() => setShowCapacity(false)}
                />
            )}

            {showRiskMatrix && (
                <RiskMatrix
                    planId={planId}
                    onClose={() => setShowRiskMatrix(false)}
                />
            )}
        </div>
    );
}
