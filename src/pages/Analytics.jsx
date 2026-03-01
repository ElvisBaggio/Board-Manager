import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useBoards } from '../hooks/useBoards';
import { useGoals } from '../hooks/useGoals';
import { useExecutionItems } from '../hooks/useExecutionItems';
import BoardHeader from '../components/BoardHeader';
import { BarChart3, Target, CheckCircle, AlertCircle, TrendingUp, Clock } from 'lucide-react';

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
    const { id: boardId } = useParams();
    const { user } = useAuth();
    const { boards, loadBoardData, getLanes, getFeaturesForBoard } = useBoards(user?.id);
    const { boardGoals, fetchBoardGoals } = useGoals(boardId);
    const { featureCounts, fetchBoardCounts } = useExecutionItems(boardId);
    const [keyResults, setKeyResults] = useState([]);

    useEffect(() => {
        if (!boardId) return;
        loadBoardData(boardId);
        fetchBoardGoals();
        fetchBoardCounts();
        fetch(`/api/okrs/board?boardId=${boardId}`)
            .then(r => r.ok ? r.json() : [])
            .then(setKeyResults)
            .catch(console.error);
    }, [boardId]);

    const board = boards.find(b => b.id === boardId);
    const lanes = getLanes(boardId);
    const features = getFeaturesForBoard(boardId);

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
            <BoardHeader board={board} boardId={boardId} currentView="analytics" />

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
                                        { label: 'Bloqueadas', value: byStatus.Blocked, color: 'var(--danger)', Icon: AlertCircle },
                                    ].map(({ label, value, color, Icon }) => (
                                        <div key={label} className="glass-surface rounded-lg p-5 flex flex-col justify-between">
                                            <div className="flex justify-between items-center mb-3">
                                                <span className="text-xs text-muted font-bold uppercase tracking-wide">{label}</span>
                                                <Icon size={16} style={{ color }} />
                                            </div>
                                            <span className="text-2xl font-bold" style={{ color }}>{value}</span>
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
                                            const pct = Math.min(100, Math.round((curr / tgt) * 100));
                                            const color = healthColor(pct);
                                            return (
                                                <div
                                                    key={goal.id}
                                                    className="glass-surface rounded-lg p-4 animate-fade-in-up"
                                                    style={{ animationDelay: `${idx * 0.04}s` }}
                                                >
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="font-bold flex-1 mr-3">{goal.title}</span>
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
                                                        const pct = Math.min(100, Math.round((curr / tgt) * 100));
                                                        const color = healthColor(pct);
                                                        return (
                                                            <div key={kr.id} className="flex flex-col gap-1">
                                                                <div className="flex justify-between text-sm">
                                                                    <span className="font-medium flex-1 mr-3">{kr.title}</span>
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
                        </>
                    )}
                </div>
            </main>
        </div>
    );
}
