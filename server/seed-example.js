/**
 * Seed script — creates a complete example strategic plan.
 * Run: node server/seed-example.js
 *
 * Creates a realistic "Produto SaaS — Plataforma de Gestão" plan with:
 *   - 2 Strategic Choices, each with Goals/KPIs
 *   - 4 Objectives (Lanes) distributed across choices
 *   - 12 Features/Initiatives on a 2026 roadmap
 *   - Key Results per objective
 *   - Product Indicators linked to KRs
 *   - Execution Items (stories/tasks)
 *   - Tags, Team Members, Resource Allocations
 *   - Risks with mitigation plans
 *   - Efficiency Indicators
 *   - Comments on features
 */
import knex from 'knex';
import config from '../knexfile.js';

const db = knex(config);

// Helpers
const uid = (prefix = '') =>
    prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

async function seed() {
    // Run migrations first
    await db.migrate.latest();
    console.log('✅ Migrations applied');

    // ─── 1. USER ───────────────────────────────────────────────
    let adminUser = await db('users').where('email', 'admin@admin.com').first();
    if (!adminUser) {
        adminUser = { id: uid('u-'), name: 'Admin', email: 'admin@admin.com', password_hash: 'admin', role: 'admin' };
        await db('users').insert(adminUser);
    }
    const userId = adminUser.id;
    console.log('👤 Admin user:', userId);

    // ─── 2. PLAN ───────────────────────────────────────────────
    const planId = uid('plan-');
    await db('plans').insert({
        id: planId,
        user_id: userId,
        title: 'Plataforma SaaS de Gestão — 2026',
        visibility: 'Privado',
        just_cause: 'Democratizar o acesso a ferramentas de planejamento estratégico de alta qualidade, permitindo que empresas de todos os tamanhos possam tomar decisões orientadas por dados e alcançar seus objetivos com clareza e eficiência.',
        vision: 'Ser a plataforma líder em gestão estratégica na América Latina até 2028, atendendo mais de 10.000 empresas com soluções intuitivas e acessíveis.',
        mission: 'Transformar a forma como empresas planejam e executam suas estratégias, oferecendo uma plataforma integrada que conecta visão, execução e métricas em um único ambiente colaborativo.',
    });
    console.log('📋 Plano criado:', planId);

    // ─── 3. STRATEGIC CHOICES ──────────────────────────────────
    const choiceGrowth = uid('sc-');
    const choiceExcellence = uid('sc-');
    await db('strategic_choices').insert([
        {
            id: choiceGrowth,
            plan_id: planId,
            title: 'Crescimento Acelerado',
            description: 'Priorizar aquisição de novos clientes e expansão de mercado por meio de funcionalidades inovadoras, integrações com ecossistemas existentes e um modelo freemium atraente.',
            color: '#10b981',
            sort_order: 0,
        },
        {
            id: choiceExcellence,
            plan_id: planId,
            title: 'Excelência Operacional',
            description: 'Garantir uma experiência de uso impecável com foco em performance, confiabilidade, segurança e redução de churn por meio de um produto maduro e estável.',
            color: '#6366f1',
            sort_order: 1,
        },
    ]);
    console.log('🎯 Escolhas estratégicas criadas');

    // ─── 4. GOALS / KPIs ──────────────────────────────────────
    const goalMRR = uid('g-');
    const goalUsers = uid('g-');
    const goalNPS = uid('g-');
    const goalUptime = uid('g-');
    await db('goals_kpis').insert([
        { id: goalMRR, strategic_choice_id: choiceGrowth, title: 'MRR (Receita Recorrente Mensal)', target_value: 500000, current_value: 180000, unit: 'R$', frequency: 'monthly' },
        { id: goalUsers, strategic_choice_id: choiceGrowth, title: 'Usuários ativos mensais', target_value: 10000, current_value: 3200, unit: 'users', frequency: 'monthly' },
        { id: goalNPS, strategic_choice_id: choiceExcellence, title: 'NPS', target_value: 80, current_value: 62, unit: 'pts', frequency: 'quarterly' },
        { id: goalUptime, strategic_choice_id: choiceExcellence, title: 'Uptime', target_value: 99.95, current_value: 99.7, unit: '%', frequency: 'monthly' },
    ]);
    console.log('📊 Goals/KPIs criados');

    // ─── 5. LANES (OBJECTIVES) ────────────────────────────────
    const laneAcquisition = uid('ln-');
    const laneFeatures = uid('ln-');
    const lanePerformance = uid('ln-');
    const laneRetention = uid('ln-');
    await db('lanes').insert([
        { id: laneAcquisition, plan_id: planId, title: 'Aquisição e Onboarding', sort_order: 0, strategic_choice_id: choiceGrowth, problem_opportunity: 'Taxa de conversão do trial para pago é de apenas 8% — meta é chegar a 20%.' },
        { id: laneFeatures, plan_id: planId, title: 'Funcionalidades Core', sort_order: 1, strategic_choice_id: choiceGrowth, problem_opportunity: 'Clientes solicitam integrações e dashboards personalizáveis como bloqueio para adoção.' },
        { id: lanePerformance, plan_id: planId, title: 'Performance e Infraestrutura', sort_order: 2, strategic_choice_id: choiceExcellence, problem_opportunity: 'Latência média de 3.2s em páginas complexas — meta abaixo de 1s.' },
        { id: laneRetention, plan_id: planId, title: 'Retenção e Suporte', sort_order: 3, strategic_choice_id: choiceExcellence, problem_opportunity: 'Churn mensal de 5% — meta de reduzir para 2%.' },
    ]);
    console.log('🛣️  Objetivos (lanes) criados');

    // ─── 6. GOAL ↔ OBJECTIVE LINKS ────────────────────────────
    await db('goal_objective_links').insert([
        { id: uid('gol-'), goal_id: goalMRR, lane_id: laneAcquisition },
        { id: uid('gol-'), goal_id: goalUsers, lane_id: laneAcquisition },
        { id: uid('gol-'), goal_id: goalUsers, lane_id: laneFeatures },
        { id: uid('gol-'), goal_id: goalNPS, lane_id: laneRetention },
        { id: uid('gol-'), goal_id: goalUptime, lane_id: lanePerformance },
    ]);
    console.log('🔗 Goal ↔ Objective links criados');

    // ─── 7. KEY RESULTS ───────────────────────────────────────
    const krConversion = uid('kr-');
    const krIntegrations = uid('kr-');
    const krLatency = uid('kr-');
    const krChurn = uid('kr-');
    await db('key_results').insert([
        { id: krConversion, lane_id: laneAcquisition, title: 'Aumentar conversão trial→pago de 8% para 20%', target_value: 20, current_value: 12, unit: '%' },
        { id: krIntegrations, lane_id: laneFeatures, title: 'Lançar 5 integrações nativas (Slack, Jira, Notion, Google, MS Teams)', target_value: 5, current_value: 2, unit: 'integrações' },
        { id: krLatency, lane_id: lanePerformance, title: 'Reduzir latência média para < 1s', target_value: 1, current_value: 2.1, unit: 's', lower_is_better: 1 },
        { id: krChurn, lane_id: laneRetention, title: 'Reduzir churn mensal de 5% para 2%', target_value: 2, current_value: 3.8, unit: '%', lower_is_better: 1 },
    ]);
    console.log('🎯 Key Results criados');

    // ─── 8. TAGS ──────────────────────────────────────────────
    const tagFrontend = uid('tag-');
    const tagBackend = uid('tag-');
    const tagUX = uid('tag-');
    const tagInfra = uid('tag-');
    const tagIntegration = uid('tag-');
    const tagData = uid('tag-');
    await db('tags').insert([
        { id: tagFrontend, plan_id: planId, name: 'Frontend', color: '#3b82f6' },
        { id: tagBackend, plan_id: planId, name: 'Backend', color: '#ef4444' },
        { id: tagUX, plan_id: planId, name: 'UX/UI', color: '#a855f7' },
        { id: tagInfra, plan_id: planId, name: 'Infra', color: '#f59e0b' },
        { id: tagIntegration, plan_id: planId, name: 'Integrações', color: '#10b981' },
        { id: tagData, plan_id: planId, name: 'Data', color: '#06b6d4' },
    ]);
    console.log('🏷️  Tags criadas');

    // ─── 9. FEATURES (INITIATIVES) ────────────────────────────
    const features = [
        // Aquisição e Onboarding
        { id: uid('ft-'), lane_id: laneAcquisition, title: 'Onboarding Wizard Interativo', description: 'Fluxo guiado para novos usuários com tour interativo, templates prontos e setup assistido do primeiro planejamento.', status: 'On Going', tags_json: JSON.stringify([{ name: 'Frontend', color: '#3b82f6' }, { name: 'UX/UI', color: '#a855f7' }]), start_date: '2026-01-15', end_date: '2026-03-31', effort_hours: 160 },
        { id: uid('ft-'), lane_id: laneAcquisition, title: 'Modelo Freemium + Trial 14 dias', description: 'Implementar plano gratuito com limites e trial automático do plano Pro, incluindo email marketing de nurture.', status: 'Not Started', tags_json: JSON.stringify([{ name: 'Backend', color: '#ef4444' }]), start_date: '2026-03-01', end_date: '2026-05-15', effort_hours: 200 },
        { id: uid('ft-'), lane_id: laneAcquisition, title: 'Landing Page e SEO', description: 'Nova landing page com cases de sucesso, calculadora de ROI e otimização para motores de busca.', status: 'Done', tags_json: JSON.stringify([{ name: 'Frontend', color: '#3b82f6' }, { name: 'UX/UI', color: '#a855f7' }]), start_date: '2026-01-05', end_date: '2026-02-28', effort_hours: 80 },

        // Funcionalidades Core
        { id: uid('ft-'), lane_id: laneFeatures, title: 'Integração Slack + Jira', description: 'Notificações bidirecionais com Slack e sincronização de items de execução com Jira (criação, status, comments).', status: 'On Going', tags_json: JSON.stringify([{ name: 'Integrações', color: '#10b981' }, { name: 'Backend', color: '#ef4444' }]), start_date: '2026-02-01', end_date: '2026-04-30', effort_hours: 240 },
        { id: uid('ft-'), lane_id: laneFeatures, title: 'Dashboards Customizáveis', description: 'Editor drag-and-drop de dashboards com widgets de métricas, gráficos de progresso e filtros dinâmicos.', status: 'Not Started', tags_json: JSON.stringify([{ name: 'Frontend', color: '#3b82f6' }, { name: 'Data', color: '#06b6d4' }]), start_date: '2026-04-01', end_date: '2026-07-31', effort_hours: 320 },
        { id: uid('ft-'), lane_id: laneFeatures, title: 'API Pública + Webhooks', description: 'API RESTful documentada com OpenAPI, autenticação via API keys, rate limiting e webhooks para eventos de plano.', status: 'Not Started', tags_json: JSON.stringify([{ name: 'Backend', color: '#ef4444' }, { name: 'Integrações', color: '#10b981' }]), start_date: '2026-05-01', end_date: '2026-08-31', effort_hours: 280 },

        // Performance e Infraestrutura
        { id: uid('ft-'), lane_id: lanePerformance, title: 'Migração para Edge Computing', description: 'Deploy multi-região com CDN edge functions, cache inteligente e lazy loading de componentes pesados.', status: 'On Going', tags_json: JSON.stringify([{ name: 'Infra', color: '#f59e0b' }]), start_date: '2026-01-20', end_date: '2026-04-15', effort_hours: 200 },
        { id: uid('ft-'), lane_id: lanePerformance, title: 'Otimização de Queries e Índices', description: 'Profiling de queries lentas, criação de índices compostos, implementação de query caching com Redis.', status: 'Not Started', tags_json: JSON.stringify([{ name: 'Backend', color: '#ef4444' }, { name: 'Infra', color: '#f59e0b' }]), start_date: '2026-03-15', end_date: '2026-05-31', effort_hours: 120 },
        { id: uid('ft-'), lane_id: lanePerformance, title: 'Monitoramento e Observabilidade', description: 'Stack de observabilidade com OpenTelemetry, Grafana dashboards, alertas inteligentes e SLO tracking.', status: 'Done', tags_json: JSON.stringify([{ name: 'Infra', color: '#f59e0b' }, { name: 'Data', color: '#06b6d4' }]), start_date: '2026-01-05', end_date: '2026-02-20', effort_hours: 100 },

        // Retenção e Suporte
        { id: uid('ft-'), lane_id: laneRetention, title: 'Sistema de Health Score', description: 'Score automatizado de saúde do cliente baseado em engajamento, uso de features e feedback, com alertas para CS.', status: 'Not Started', tags_json: JSON.stringify([{ name: 'Data', color: '#06b6d4' }, { name: 'Backend', color: '#ef4444' }]), start_date: '2026-04-01', end_date: '2026-06-30', effort_hours: 180 },
        { id: uid('ft-'), lane_id: laneRetention, title: 'Chat In-App + Base de Conhecimento', description: 'Widget de chat com Intercom, artigos de help center contextuais e chatbot com IA para FAQ automatizado.', status: 'On Going', tags_json: JSON.stringify([{ name: 'Frontend', color: '#3b82f6' }, { name: 'UX/UI', color: '#a855f7' }]), start_date: '2026-02-15', end_date: '2026-05-15', effort_hours: 160 },
        { id: uid('ft-'), lane_id: laneRetention, title: 'NPS Survey Automatizado', description: 'Pesquisas NPS in-app com fluxo de feedback detalhado, segmentação por tipo de plano e dashboard de resultados.', status: 'Done', tags_json: JSON.stringify([{ name: 'Frontend', color: '#3b82f6' }, { name: 'Data', color: '#06b6d4' }]), start_date: '2026-01-10', end_date: '2026-02-28', effort_hours: 60 },
    ];
    await db('features').insert(features);
    console.log('🚀 12 Iniciativas criadas');

    // ─── 10. PRODUCT INDICATORS ───────────────────────────────
    const piConversion = uid('pi-');
    const piActivation = uid('pi-');
    const piIntUsage = uid('pi-');
    const piP95 = uid('pi-');
    const piErrorRate = uid('pi-');
    const piCSAT = uid('pi-');
    await db('product_indicators').insert([
        { id: piConversion, feature_id: features[0].id, title: 'Taxa de conclusão do onboarding', target_value: 85, current_value: 71, unit: '%' },
        { id: piActivation, feature_id: features[1].id, title: 'Conversão trial → pago', target_value: 20, current_value: 8, unit: '%' },
        { id: piIntUsage, feature_id: features[3].id, title: 'Adoção de integrações (% usuários)', target_value: 60, current_value: 25, unit: '%' },
        { id: piP95, feature_id: features[6].id, title: 'P95 latência páginas complexas', target_value: 1200, current_value: 2800, unit: 'ms', lower_is_better: 1 },
        { id: piErrorRate, feature_id: features[8].id, title: 'Taxa de erros 5xx em produção', target_value: 0.1, current_value: 0.3, unit: '%', lower_is_better: 1 },
        { id: piCSAT, feature_id: features[10].id, title: 'CSAT do chat de suporte', target_value: 90, current_value: 78, unit: '%' },
    ]);
    console.log('📈 Indicadores de produto criados');

    // ─── 11. INDICATOR ↔ KR LINKS ─────────────────────────────
    await db('indicator_kr_links').insert([
        { id: uid('ikr-'), indicator_id: piConversion, kr_id: krConversion },
        { id: uid('ikr-'), indicator_id: piActivation, kr_id: krConversion },
        { id: uid('ikr-'), indicator_id: piIntUsage, kr_id: krIntegrations },
        { id: uid('ikr-'), indicator_id: piP95, kr_id: krLatency },
        { id: uid('ikr-'), indicator_id: piCSAT, kr_id: krChurn },
    ]);
    console.log('🔗 Indicator ↔ KR links criados');

    // ─── 12. TEAM MEMBERS ─────────────────────────────────────
    const tmLead = uid('tm-');
    const tmFront = uid('tm-');
    const tmBack = uid('tm-');
    const tmDevOps = uid('tm-');
    const tmDesigner = uid('tm-');
    const tmData = uid('tm-');
    await db('team_members').insert([
        { id: tmLead, plan_id: planId, name: 'Ana Souza', role_title: 'Tech Lead', avatar_color: '#ef4444', capacity_hours_per_quarter: 480 },
        { id: tmFront, plan_id: planId, name: 'Carlos Lima', role_title: 'Frontend Engineer', avatar_color: '#3b82f6', capacity_hours_per_quarter: 480 },
        { id: tmBack, plan_id: planId, name: 'Juliana Costa', role_title: 'Backend Engineer', avatar_color: '#10b981', capacity_hours_per_quarter: 480 },
        { id: tmDevOps, plan_id: planId, name: 'Ricardo Mendes', role_title: 'DevOps Engineer', avatar_color: '#f59e0b', capacity_hours_per_quarter: 400 },
        { id: tmDesigner, plan_id: planId, name: 'Mariana Santos', role_title: 'UX Designer', avatar_color: '#a855f7', capacity_hours_per_quarter: 440 },
        { id: tmData, plan_id: planId, name: 'Pedro Alves', role_title: 'Data Engineer', avatar_color: '#06b6d4', capacity_hours_per_quarter: 480 },
    ]);
    console.log('👥 6 Membros da equipe criados');

    // ─── 13. RESOURCE ALLOCATIONS ─────────────────────────────
    await db('resource_allocations').insert([
        // Q1 2026
        { id: uid('ra-'), member_id: tmFront, feature_id: features[0].id, hours_allocated: 120, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmDesigner, feature_id: features[0].id, hours_allocated: 80, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmFront, feature_id: features[2].id, hours_allocated: 60, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmDevOps, feature_id: features[6].id, hours_allocated: 160, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmDevOps, feature_id: features[8].id, hours_allocated: 100, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmBack, feature_id: features[3].id, hours_allocated: 120, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmFront, feature_id: features[10].id, hours_allocated: 80, quarter: 1, year: 2026 },
        { id: uid('ra-'), member_id: tmData, feature_id: features[11].id, hours_allocated: 60, quarter: 1, year: 2026 },

        // Q2 2026
        { id: uid('ra-'), member_id: tmBack, feature_id: features[1].id, hours_allocated: 160, quarter: 2, year: 2026 },
        { id: uid('ra-'), member_id: tmBack, feature_id: features[3].id, hours_allocated: 120, quarter: 2, year: 2026 },
        { id: uid('ra-'), member_id: tmFront, feature_id: features[4].id, hours_allocated: 200, quarter: 2, year: 2026 },
        { id: uid('ra-'), member_id: tmDesigner, feature_id: features[4].id, hours_allocated: 120, quarter: 2, year: 2026 },
        { id: uid('ra-'), member_id: tmDevOps, feature_id: features[7].id, hours_allocated: 120, quarter: 2, year: 2026 },
        { id: uid('ra-'), member_id: tmData, feature_id: features[9].id, hours_allocated: 180, quarter: 2, year: 2026 },
        { id: uid('ra-'), member_id: tmLead, feature_id: features[5].id, hours_allocated: 100, quarter: 2, year: 2026 },

        // Q3 2026
        { id: uid('ra-'), member_id: tmFront, feature_id: features[4].id, hours_allocated: 120, quarter: 3, year: 2026 },
        { id: uid('ra-'), member_id: tmBack, feature_id: features[5].id, hours_allocated: 200, quarter: 3, year: 2026 },
        { id: uid('ra-'), member_id: tmLead, feature_id: features[5].id, hours_allocated: 80, quarter: 3, year: 2026 },
        { id: uid('ra-'), member_id: tmData, feature_id: features[9].id, hours_allocated: 100, quarter: 3, year: 2026 },
    ]);
    console.log('📅 19 Alocações de recursos criadas (Q1-Q3 2026)');

    // ─── 14. EXECUTION ITEMS ──────────────────────────────────
    await db('execution_items').insert([
        // Onboarding Wizard (feature 0)
        { id: uid('ei-'), feature_id: features[0].id, title: 'Design do fluxo de onboarding', item_type: 'Story', status: 'Done', assignee_id: tmDesigner, effort_hours: 24, sort_order: 0 },
        { id: uid('ei-'), feature_id: features[0].id, title: 'Componente de tour interativo', item_type: 'Story', status: 'Done', assignee_id: tmFront, effort_hours: 32, sort_order: 1 },
        { id: uid('ei-'), feature_id: features[0].id, title: 'Templates de planejamento prontos', item_type: 'Story', status: 'On Going', assignee_id: tmFront, effort_hours: 20, sort_order: 2 },
        { id: uid('ei-'), feature_id: features[0].id, title: 'Analytics de conversão do onboarding', item_type: 'Tech Story', status: 'Not Started', assignee_id: tmData, effort_hours: 16, sort_order: 3 },

        // Integração Slack + Jira (feature 3)
        { id: uid('ei-'), feature_id: features[3].id, title: 'OAuth2 flow com Slack', item_type: 'Tech Story', status: 'Done', assignee_id: tmBack, effort_hours: 16, sort_order: 0 },
        { id: uid('ei-'), feature_id: features[3].id, title: 'Webhooks de notificação Slack', item_type: 'Story', status: 'On Going', assignee_id: tmBack, effort_hours: 24, sort_order: 1 },
        { id: uid('ei-'), feature_id: features[3].id, title: 'Sync bidirecional Jira', item_type: 'Epic', status: 'Not Started', assignee_id: tmBack, effort_hours: 48, sort_order: 2 },
        { id: uid('ei-'), feature_id: features[3].id, title: 'UI de configuração de integrações', item_type: 'Story', status: 'Not Started', assignee_id: tmFront, effort_hours: 20, sort_order: 3 },

        // Edge Computing (feature 6)
        { id: uid('ei-'), feature_id: features[6].id, title: 'Setup multi-região AWS/Cloudflare', item_type: 'Tech Story', status: 'Done', assignee_id: tmDevOps, effort_hours: 40, sort_order: 0 },
        { id: uid('ei-'), feature_id: features[6].id, title: 'Cache inteligente com invalidação', item_type: 'Tech Story', status: 'On Going', assignee_id: tmDevOps, effort_hours: 32, sort_order: 1 },
        { id: uid('ei-'), feature_id: features[6].id, title: 'Lazy loading de componentes React', item_type: 'Story', status: 'On Going', assignee_id: tmFront, effort_hours: 16, sort_order: 2 },

        // Chat In-App (feature 10)
        { id: uid('ei-'), feature_id: features[10].id, title: 'Widget Intercom embed', item_type: 'Story', status: 'Done', assignee_id: tmFront, effort_hours: 12, sort_order: 0 },
        { id: uid('ei-'), feature_id: features[10].id, title: 'Base de conhecimento contextual', item_type: 'Story', status: 'On Going', assignee_id: tmFront, effort_hours: 24, sort_order: 1 },
        { id: uid('ei-'), feature_id: features[10].id, title: 'Chatbot FAQ com IA', item_type: 'Epic', status: 'Not Started', assignee_id: tmBack, effort_hours: 40, sort_order: 2 },
    ]);
    console.log('✅ 14 Itens de execução criados');

    // ─── 15. RISKS ────────────────────────────────────────────
    await db('risks').insert([
        { id: uid('rk-'), plan_id: planId, title: 'Dependência de APIs de terceiros (Slack, Jira)', description: 'Integrações dependem da estabilidade e versionamento de APIs externas. Mudanças breaking podem impactar features críticas.', impact: 4, probability: 3, status: 'Open', mitigation: 'Implementar camada de abstração (adapter pattern), versionar integrações e monitorar changelogs de APIs parceiras.', owner: 'Ana Souza' },
        { id: uid('rk-'), plan_id: planId, title: 'Perda de engenheiros-chave', description: 'Equipe enxuta com alto risco se membros seniores saírem. Conhecimento concentrado em poucas pessoas.', impact: 5, probability: 2, status: 'Open', mitigation: 'Documentação técnica rigorosa, pair programming rotativo, política de retenção competitiva e plano de sucessão.', owner: 'Ana Souza' },
        { id: uid('rk-'), plan_id: planId, title: 'Atraso na migração para edge computing', description: 'Complexidade de migração pode atrasar entregas de performance, impactando SLOs e satisfação do cliente.', impact: 3, probability: 3, status: 'Mitigating', mitigation: 'Abordagem incremental com rollback automático. Feature flags para canary releases. Monitoramento em tempo real.', owner: 'Ricardo Mendes' },
        { id: uid('rk-'), plan_id: planId, title: 'Concorrência lança feature similar', description: 'Competidores podem lançar dashboards customizáveis antes de nós, reduzindo o diferencial competitivo.', impact: 3, probability: 4, status: 'Open', mitigation: 'Foco em UX diferenciada e integrações profundas como moats. Acelerar delivery com escopo mínimo viável.', owner: 'Ana Souza' },
        { id: uid('rk-'), plan_id: planId, title: 'Violação de dados / LGPD', description: 'Incidente de segurança pode gerar multas, perda de confiança e churn massivo.', impact: 5, probability: 1, status: 'Open', mitigation: 'Pentest trimestral, criptografia end-to-end, auditorias de compliance LGPD, DPO dedicado.', owner: 'Juliana Costa' },
    ]);
    console.log('⚠️  5 Riscos criados');

    // ─── 16. EFFICIENCY INDICATORS ────────────────────────────
    await db('efficiency_indicators').insert([
        { id: uid('ef-'), plan_id: planId, title: 'Lead Time (ideia → produção)', value: 21, unit: 'dias', period: 'Q1 2026' },
        { id: uid('ef-'), plan_id: planId, title: 'Cycle Time médio', value: 5.2, unit: 'dias', period: 'Q1 2026' },
        { id: uid('ef-'), plan_id: planId, title: 'Deploy Frequency', value: 12, unit: 'deploys/semana', period: 'Q1 2026' },
        { id: uid('ef-'), plan_id: planId, title: 'MTTR (Mean Time to Recovery)', value: 28, unit: 'minutos', period: 'Q1 2026' },
        { id: uid('ef-'), plan_id: planId, title: 'Velocity da equipe', value: 42, unit: 'pontos/sprint', period: 'Q1 2026' },
    ]);
    console.log('⚡ 5 Indicadores de eficiência criados');

    // ─── 17. COMMENTS ─────────────────────────────────────────
    await db('comments').insert([
        { id: uid('cm-'), feature_id: features[0].id, user_id: userId, content: 'O tour interativo já está funcionando no ambiente de staging. Falta implementar os templates de planejamento pré-configurados e testar com usuários beta.' },
        { id: uid('cm-'), feature_id: features[3].id, user_id: userId, content: 'OAuth2 com Slack concluído! Webhooks funcionando para notificações de criação/edição de features. Pendente: sync com Jira que é mais complexo.' },
        { id: uid('cm-'), feature_id: features[6].id, user_id: userId, content: 'Deploy em us-east-1 e sa-east-1 concluído. CDN edge functions rodando. Próximo passo: cache inteligente com invalidação seletiva.' },
        { id: uid('cm-'), feature_id: features[8].id, user_id: userId, content: 'Stack de observabilidade 100% operacional: Grafana + OpenTelemetry + alerts no Slack. Já identificamos 3 queries problemáticas para otimizar no Q2.' },
        { id: uid('cm-'), feature_id: features[11].id, user_id: userId, content: 'Pesquisa NPS já rodando em produção. Score subiu de 58 para 62 no último mês. Principais feedbacks: querem integrações e performance.' },
    ]);
    console.log('💬 5 Comentários criados');

    console.log('\n✅ ══════════════════════════════════════════════');
    console.log('   SEED COMPLETO!');
    console.log('   Login: admin@admin.com / admin');
    console.log('   Plano: "Plataforma SaaS de Gestão — 2026"');
    console.log('══════════════════════════════════════════════\n');

    await db.destroy();
}

seed().catch(err => {
    console.error('❌ Erro no seed:', err);
    db.destroy();
    process.exit(1);
});
