import { useNavigate } from 'react-router-dom';
import { Compass, Map, BarChart3, ArrowRight, Sparkles } from 'lucide-react';

const STEPS = [
    {
        step: 1,
        icon: Compass,
        title: 'Defina sua Estratégia',
        description: 'Articule a Causa Justa, Visão e Missão do seu produto. Em seguida, crie as Escolhas Estratégicas que guiarão as decisões do time.',
        view: 'canvas',
        cta: 'Ir para Estratégia',
    },
    {
        step: 2,
        icon: Map,
        title: 'Monte seu Roadmap',
        description: 'Crie objetivos e adicione as iniciativas que o time vai executar. Defina datas, responsáveis e prioridades.',
        view: 'roadmap',
        cta: 'Ir para Roadmap',
    },
    {
        step: 3,
        icon: BarChart3,
        title: 'Acompanhe os Resultados',
        description: 'Configure OKRs e metas para medir o progresso. Visualize o Analytics do portfólio para decisões baseadas em dados.',
        view: 'metrics',
        cta: 'Ir para Métricas',
    },
];

export default function PlanWelcome({ planId }) {
    const navigate = useNavigate();

    return (
        <div className="glass-surface rounded-xl p-8 mb-8 animate-fade-in-up border border-[var(--accent)]/20">
            <div className="flex items-center gap-3 mb-6">
                <Sparkles size={24} className="text-[var(--accent)]" />
                <div>
                    <h3 className="text-lg font-bold m-0">Por onde começar?</h3>
                    <p className="text-sm text-muted m-0">Este planejamento está pronto para você. Siga os passos abaixo para construir sua estratégia.</p>
                </div>
            </div>

            <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
                {STEPS.map(({ step, icon: Icon, title, description, view, cta }) => (
                    <div
                        key={step}
                        className="flex flex-col gap-3 p-5 rounded-lg bg-black/20 border border-white/5 hover:border-[var(--accent)]/30 transition-all cursor-pointer group"
                        onClick={() => navigate(`/plan/${planId}/${view}`)}
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                                style={{ background: 'var(--accent)', color: '#fff' }}
                            >
                                {step}
                            </div>
                            <Icon size={18} className="text-[var(--accent)]" />
                        </div>
                        <h4 className="font-bold m-0 text-sm">{title}</h4>
                        <p className="text-xs text-muted m-0 flex-1">{description}</p>
                        <button
                            className="flex items-center gap-1.5 text-xs font-medium mt-auto"
                            style={{ color: 'var(--accent)', background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                        >
                            {cta} <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
