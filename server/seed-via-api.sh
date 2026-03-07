#!/bin/bash
# seed-via-api.sh — Seeds complete example data via API calls
# Run: bash server/seed-via-api.sh

BASE="http://localhost:3001/api"
USERID="admin-mmgskfu3"
PLANID="plan-example-2026"

echo "🌱 Seeding complete example plan..."

# ─── 1. CREATE PLAN ─────────────────────────────────
curl -s -X POST "$BASE/plans" -H "Content-Type: application/json" -d "{
  \"id\": \"$PLANID\",
  \"userId\": \"$USERID\",
  \"title\": \"Plataforma SaaS de Gestão — 2026\",
  \"visibility\": \"Privado\",
  \"justCause\": \"Democratizar o acesso a ferramentas de planejamento estratégico de alta qualidade, permitindo que empresas de todos os tamanhos possam tomar decisões orientadas por dados e alcançar seus objetivos com clareza e eficiência.\",
  \"vision\": \"Ser a plataforma líder em gestão estratégica na América Latina até 2028, atendendo mais de 10.000 empresas com soluções intuitivas e acessíveis.\",
  \"mission\": \"Transformar a forma como empresas planejam e executam suas estratégias, oferecendo uma plataforma integrada que conecta visão, execução e métricas em um único ambiente colaborativo.\"
}" > /dev/null
echo "✅ Plan created"

# ─── 2. STRATEGIC CHOICES ───────────────────────────
SC1="sc-growth"
SC2="sc-excellence"
curl -s -X POST "$BASE/strategic-choices" -H "Content-Type: application/json" -d "{
  \"planId\": \"$PLANID\",
  \"title\": \"Crescimento Acelerado\",
  \"description\": \"Priorizar aquisição de novos clientes e expansão de mercado por meio de funcionalidades inovadoras, integrações com ecossistemas existentes e um modelo freemium atraente.\",
  \"color\": \"#10b981\"
}" > /tmp/sc1.json
SC1=$(cat /tmp/sc1.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/strategic-choices" -H "Content-Type: application/json" -d "{
  \"planId\": \"$PLANID\",
  \"title\": \"Excelência Operacional\",
  \"description\": \"Garantir uma experiência de uso impecável com foco em performance, confiabilidade, segurança e redução de churn por meio de um produto maduro e estável.\",
  \"color\": \"#6366f1\"
}" > /tmp/sc2.json
SC2=$(cat /tmp/sc2.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 2 Strategic Choices: $SC1, $SC2"

# ─── 3. GOALS / KPIs ───────────────────────────────
curl -s -X POST "$BASE/strategic-choices/$SC1/goals" -H "Content-Type: application/json" -d "{
  \"title\": \"MRR (Receita Recorrente Mensal)\", \"targetValue\": 500000, \"unit\": \"R$\", \"frequency\": \"monthly\"
}" > /tmp/g1.json
G1=$(cat /tmp/g1.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/strategic-choices/$SC1/goals" -H "Content-Type: application/json" -d "{
  \"title\": \"Usuários ativos mensais (MAU)\", \"targetValue\": 10000, \"unit\": \"users\", \"frequency\": \"monthly\"
}" > /tmp/g2.json
G2=$(cat /tmp/g2.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/strategic-choices/$SC2/goals" -H "Content-Type: application/json" -d "{
  \"title\": \"NPS (Net Promoter Score)\", \"targetValue\": 80, \"unit\": \"pts\", \"frequency\": \"quarterly\"
}" > /tmp/g3.json
G3=$(cat /tmp/g3.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/strategic-choices/$SC2/goals" -H "Content-Type: application/json" -d "{
  \"title\": \"Uptime da plataforma\", \"targetValue\": 99.95, \"unit\": \"%\", \"frequency\": \"monthly\"
}" > /tmp/g4.json
G4=$(cat /tmp/g4.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 4 Goals: $G1, $G2, $G3, $G4"

# Update current values for goals
curl -s -X PUT "$BASE/strategic-choices/goals/$G1" -H "Content-Type: application/json" -d '{"currentValue": 180000}' > /dev/null
curl -s -X PUT "$BASE/strategic-choices/goals/$G2" -H "Content-Type: application/json" -d '{"currentValue": 3200}' > /dev/null
curl -s -X PUT "$BASE/strategic-choices/goals/$G3" -H "Content-Type: application/json" -d '{"currentValue": 62}' > /dev/null
curl -s -X PUT "$BASE/strategic-choices/goals/$G4" -H "Content-Type: application/json" -d '{"currentValue": 99.7}' > /dev/null
echo "✅ Goal current values updated"

# ─── 4. LANES (OBJECTIVES) ─────────────────────────
curl -s -X POST "$BASE/lanes" -H "Content-Type: application/json" -d "{
  \"planId\": \"$PLANID\", \"title\": \"Aquisição e Onboarding\", \"strategicChoiceId\": \"$SC1\"
}" > /tmp/l1.json
L1=$(cat /tmp/l1.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/lanes" -H "Content-Type: application/json" -d "{
  \"planId\": \"$PLANID\", \"title\": \"Funcionalidades Core\", \"strategicChoiceId\": \"$SC1\"
}" > /tmp/l2.json
L2=$(cat /tmp/l2.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/lanes" -H "Content-Type: application/json" -d "{
  \"planId\": \"$PLANID\", \"title\": \"Performance e Infraestrutura\", \"strategicChoiceId\": \"$SC2\"
}" > /tmp/l3.json
L3=$(cat /tmp/l3.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/lanes" -H "Content-Type: application/json" -d "{
  \"planId\": \"$PLANID\", \"title\": \"Retenção e Suporte\", \"strategicChoiceId\": \"$SC2\"
}" > /tmp/l4.json
L4=$(cat /tmp/l4.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 4 Lanes: $L1, $L2, $L3, $L4"

# ─── 5. GOAL ↔ OBJECTIVE LINKS ─────────────────────
curl -s -X POST "$BASE/strategic-choices/goals/$G1/links" -H "Content-Type: application/json" -d "{\"laneId\":\"$L1\"}" > /dev/null
curl -s -X POST "$BASE/strategic-choices/goals/$G2/links" -H "Content-Type: application/json" -d "{\"laneId\":\"$L1\"}" > /dev/null
curl -s -X POST "$BASE/strategic-choices/goals/$G2/links" -H "Content-Type: application/json" -d "{\"laneId\":\"$L2\"}" > /dev/null
curl -s -X POST "$BASE/strategic-choices/goals/$G3/links" -H "Content-Type: application/json" -d "{\"laneId\":\"$L4\"}" > /dev/null
curl -s -X POST "$BASE/strategic-choices/goals/$G4/links" -H "Content-Type: application/json" -d "{\"laneId\":\"$L3\"}" > /dev/null
echo "✅ 5 Goal ↔ Lane links"

# ─── 6. KEY RESULTS ────────────────────────────────
curl -s -X POST "$BASE/okrs" -H "Content-Type: application/json" -d "{
  \"laneId\": \"$L1\", \"title\": \"Aumentar conversão trial→pago de 8% para 20%\", \"targetValue\": 20, \"currentValue\": 12, \"unit\": \"%\"
}" > /tmp/kr1.json
KR1=$(cat /tmp/kr1.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/okrs" -H "Content-Type: application/json" -d "{
  \"laneId\": \"$L2\", \"title\": \"Lançar 5 integrações nativas\", \"targetValue\": 5, \"currentValue\": 2, \"unit\": \"integrações\"
}" > /tmp/kr2.json
KR2=$(cat /tmp/kr2.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/okrs" -H "Content-Type: application/json" -d "{
  \"laneId\": \"$L3\", \"title\": \"Reduzir latência média para < 1s\", \"targetValue\": 1, \"currentValue\": 2.1, \"unit\": \"s\"
}" > /tmp/kr3.json
KR3=$(cat /tmp/kr3.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

curl -s -X POST "$BASE/okrs" -H "Content-Type: application/json" -d "{
  \"laneId\": \"$L4\", \"title\": \"Reduzir churn mensal de 5% para 2%\", \"targetValue\": 2, \"currentValue\": 3.8, \"unit\": \"%\"
}" > /tmp/kr4.json
KR4=$(cat /tmp/kr4.json | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 4 Key Results: $KR1, $KR2, $KR3, $KR4"

# ─── 7. TAGS ───────────────────────────────────────
curl -s -X POST "$BASE/tags" -H "Content-Type: application/json" -d "{\"planId\":\"$PLANID\",\"name\":\"Frontend\",\"color\":\"#3b82f6\"}" > /dev/null
curl -s -X POST "$BASE/tags" -H "Content-Type: application/json" -d "{\"planId\":\"$PLANID\",\"name\":\"Backend\",\"color\":\"#ef4444\"}" > /dev/null
curl -s -X POST "$BASE/tags" -H "Content-Type: application/json" -d "{\"planId\":\"$PLANID\",\"name\":\"UX/UI\",\"color\":\"#a855f7\"}" > /dev/null
curl -s -X POST "$BASE/tags" -H "Content-Type: application/json" -d "{\"planId\":\"$PLANID\",\"name\":\"Infra\",\"color\":\"#f59e0b\"}" > /dev/null
curl -s -X POST "$BASE/tags" -H "Content-Type: application/json" -d "{\"planId\":\"$PLANID\",\"name\":\"Integrações\",\"color\":\"#10b981\"}" > /dev/null
curl -s -X POST "$BASE/tags" -H "Content-Type: application/json" -d "{\"planId\":\"$PLANID\",\"name\":\"Data\",\"color\":\"#06b6d4\"}" > /dev/null
echo "✅ 6 Tags"

# ─── 8. FEATURES (INITIATIVES) ─────────────────────
create_feature() {
  local LANE=$1 TITLE=$2 DESC=$3 STATUS=$4 TAGS=$5 START=$6 END=$7 EFFORT=$8
  curl -s -X POST "$BASE/features" -H "Content-Type: application/json" -d "{
    \"laneId\": \"$LANE\",
    \"title\": \"$TITLE\",
    \"description\": \"$DESC\",
    \"status\": \"$STATUS\",
    \"tags\": $TAGS,
    \"startDate\": \"$START\",
    \"endDate\": \"$END\",
    \"effortHours\": $EFFORT
  }"
}

# Aquisição e Onboarding (L1)
F1=$(create_feature "$L1" "Onboarding Wizard Interativo" "Fluxo guiado para novos usuários com tour interativo, templates prontos e setup assistido." "On Going" '[{"name":"Frontend","color":"#3b82f6"},{"name":"UX/UI","color":"#a855f7"}]' "2026-01-15" "2026-03-31" 160 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F2=$(create_feature "$L1" "Modelo Freemium + Trial 14 dias" "Plano gratuito com limites e trial automático do plano Pro, incluindo email nurture." "Not Started" '[{"name":"Backend","color":"#ef4444"}]' "2026-03-01" "2026-05-15" 200 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F3=$(create_feature "$L1" "Landing Page e SEO" "Nova landing page com cases de sucesso, calculadora de ROI e otimização para motores de busca." "Done" '[{"name":"Frontend","color":"#3b82f6"},{"name":"UX/UI","color":"#a855f7"}]' "2026-01-05" "2026-02-28" 80 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

# Funcionalidades Core (L2)
F4=$(create_feature "$L2" "Integração Slack + Jira" "Notificações bidirecionais com Slack e sincronização de items com Jira." "On Going" '[{"name":"Integrações","color":"#10b981"},{"name":"Backend","color":"#ef4444"}]' "2026-02-01" "2026-04-30" 240 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F5=$(create_feature "$L2" "Dashboards Customizáveis" "Editor drag-and-drop de dashboards com widgets de métricas e filtros dinâmicos." "Not Started" '[{"name":"Frontend","color":"#3b82f6"},{"name":"Data","color":"#06b6d4"}]' "2026-04-01" "2026-07-31" 320 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F6=$(create_feature "$L2" "API Pública + Webhooks" "API RESTful com OpenAPI, autenticação via API keys, rate limiting e webhooks." "Not Started" '[{"name":"Backend","color":"#ef4444"},{"name":"Integrações","color":"#10b981"}]' "2026-05-01" "2026-08-31" 280 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

# Performance e Infraestrutura (L3)
F7=$(create_feature "$L3" "Migração para Edge Computing" "Deploy multi-região com CDN edge functions, cache inteligente e lazy loading." "On Going" '[{"name":"Infra","color":"#f59e0b"}]' "2026-01-20" "2026-04-15" 200 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F8=$(create_feature "$L3" "Otimização de Queries e Índices" "Profiling de queries lentas, índices compostos, query caching com Redis." "Not Started" '[{"name":"Backend","color":"#ef4444"},{"name":"Infra","color":"#f59e0b"}]' "2026-03-15" "2026-05-31" 120 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F9=$(create_feature "$L3" "Monitoramento e Observabilidade" "OpenTelemetry, Grafana, alertas inteligentes e SLO tracking." "Done" '[{"name":"Infra","color":"#f59e0b"},{"name":"Data","color":"#06b6d4"}]' "2026-01-05" "2026-02-20" 100 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)

# Retenção e Suporte (L4)
F10=$(create_feature "$L4" "Sistema de Health Score" "Score automatizado de saúde do cliente baseado em engajamento e uso de features." "Not Started" '[{"name":"Data","color":"#06b6d4"},{"name":"Backend","color":"#ef4444"}]' "2026-04-01" "2026-06-30" 180 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F11=$(create_feature "$L4" "Chat In-App + Base de Conhecimento" "Widget de chat, artigos contextuais e chatbot com IA para FAQ." "On Going" '[{"name":"Frontend","color":"#3b82f6"},{"name":"UX/UI","color":"#a855f7"}]' "2026-02-15" "2026-05-15" 160 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
F12=$(create_feature "$L4" "NPS Survey Automatizado" "Pesquisas NPS in-app com segmentação e dashboard de resultados." "Done" '[{"name":"Frontend","color":"#3b82f6"},{"name":"Data","color":"#06b6d4"}]' "2026-01-10" "2026-02-28" 60 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 12 Features: $F1...$F12"

# ─── 9. PRODUCT INDICATORS ─────────────────────────
create_indicator() {
  curl -s -X POST "$BASE/indicators/product" -H "Content-Type: application/json" -d "{
    \"featureId\": \"$1\", \"title\": \"$2\", \"targetValue\": $3, \"currentValue\": $4, \"unit\": \"$5\"
  }"
}
PI1=$(create_indicator "$F1" "Taxa de conclusão do onboarding" 85 71 "%" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
PI2=$(create_indicator "$F2" "Conversão trial → pago" 20 8 "%" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
PI3=$(create_indicator "$F4" "Adoção de integrações" 60 25 "%" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
PI4=$(create_indicator "$F7" "P95 latência" 1200 2800 "ms" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
PI5=$(create_indicator "$F9" "Taxa de erros 5xx" 0.1 0.3 "%" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
PI6=$(create_indicator "$F11" "CSAT do chat suporte" 90 78 "%" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 6 Product Indicators"

# ─── 10. INDICATOR ↔ KR LINKS ──────────────────────
if [ -n "$PI1" ] && [ -n "$KR1" ]; then
  curl -s -X POST "$BASE/indicators/product/$PI1/kr-links" -H "Content-Type: application/json" -d "{\"krId\":\"$KR1\"}" > /dev/null
fi
if [ -n "$PI2" ] && [ -n "$KR1" ]; then
  curl -s -X POST "$BASE/indicators/product/$PI2/kr-links" -H "Content-Type: application/json" -d "{\"krId\":\"$KR1\"}" > /dev/null
fi
if [ -n "$PI3" ] && [ -n "$KR2" ]; then
  curl -s -X POST "$BASE/indicators/product/$PI3/kr-links" -H "Content-Type: application/json" -d "{\"krId\":\"$KR2\"}" > /dev/null
fi
if [ -n "$PI4" ] && [ -n "$KR3" ]; then
  curl -s -X POST "$BASE/indicators/product/$PI4/kr-links" -H "Content-Type: application/json" -d "{\"krId\":\"$KR3\"}" > /dev/null
fi
if [ -n "$PI6" ] && [ -n "$KR4" ]; then
  curl -s -X POST "$BASE/indicators/product/$PI6/kr-links" -H "Content-Type: application/json" -d "{\"krId\":\"$KR4\"}" > /dev/null
fi
echo "✅ 5 Indicator ↔ KR links"

# ─── 11. TEAM MEMBERS ──────────────────────────────
create_member() {
  curl -s -X POST "$BASE/resources" -H "Content-Type: application/json" -d "{
    \"planId\": \"$PLANID\", \"name\": \"$1\", \"roleTitle\": \"$2\", \"avatarColor\": \"$3\", \"capacityHoursPerQuarter\": $4
  }"
}
TM1=$(create_member "Ana Souza" "Tech Lead" "#ef4444" 480 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
TM2=$(create_member "Carlos Lima" "Frontend Engineer" "#3b82f6" 480 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
TM3=$(create_member "Juliana Costa" "Backend Engineer" "#10b981" 480 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
TM4=$(create_member "Ricardo Mendes" "DevOps Engineer" "#f59e0b" 400 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
TM5=$(create_member "Mariana Santos" "UX Designer" "#a855f7" 440 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
TM6=$(create_member "Pedro Alves" "Data Engineer" "#06b6d4" 480 | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
echo "✅ 6 Team Members"

# ─── 12. RISKS ─────────────────────────────────────
create_risk() {
  curl -s -X POST "$BASE/risks" -H "Content-Type: application/json" -d "{
    \"planId\": \"$PLANID\", \"title\": \"$1\", \"description\": \"$2\", \"impact\": $3, \"probability\": $4, \"status\": \"$5\", \"mitigation\": \"$6\"
  }" > /dev/null
}
create_risk "Dependência de APIs de terceiros" "Integrações dependem da estabilidade de APIs externas. Mudanças breaking podem impactar features." 4 3 "Open" "Implementar adapter pattern, versionar integrações e monitorar changelogs."
create_risk "Perda de engenheiros-chave" "Equipe enxuta com alto risco se membros seniores saírem." 5 2 "Open" "Documentação rigorosa, pair programming rotativo, política de retenção."
create_risk "Atraso na migração edge computing" "Complexidade pode atrasar entregas de performance." 3 3 "Mitigating" "Abordagem incremental com rollback automático e feature flags."
create_risk "Concorrência lança feature similar" "Competidores podem lançar dashboards customizáveis antes." 3 4 "Open" "Foco em UX diferenciada e integrações como moats."
create_risk "Violação de dados / LGPD" "Incidente de segurança pode gerar multas e churn massivo." 5 1 "Open" "Pentest trimestral, criptografia e2e, auditorias LGPD."
echo "✅ 5 Risks"

# ─── 13. EFFICIENCY INDICATORS ─────────────────────
create_eff() {
  curl -s -X POST "$BASE/indicators/efficiency" -H "Content-Type: application/json" -d "{
    \"planId\": \"$PLANID\", \"title\": \"$1\", \"value\": $2, \"unit\": \"$3\", \"period\": \"$4\"
  }" > /dev/null
}
create_eff "Lead Time (ideia → produção)" 21 "dias" "Q1 2026"
create_eff "Cycle Time médio" 5.2 "dias" "Q1 2026"
create_eff "Deploy Frequency" 12 "deploys/semana" "Q1 2026"
create_eff "MTTR (Mean Time to Recovery)" 28 "minutos" "Q1 2026"
create_eff "Velocity da equipe" 42 "pontos/sprint" "Q1 2026"
echo "✅ 5 Efficiency Indicators"

# ─── 14. EXECUTION ITEMS ───────────────────────────
create_exec() {
  curl -s -X POST "$BASE/features/$1/execution-items" -H "Content-Type: application/json" -d "{
    \"title\": \"$2\", \"itemType\": \"$3\", \"status\": \"$4\", \"assigneeId\": \"$5\", \"effortHours\": $6
  }" > /dev/null
}
# Onboarding W. (F1)
create_exec "$F1" "Design do fluxo de onboarding" "Story" "Done" "$TM5" 24
create_exec "$F1" "Componente de tour interativo" "Story" "Done" "$TM2" 32
create_exec "$F1" "Templates de planejamento prontos" "Story" "On Going" "$TM2" 20
create_exec "$F1" "Analytics de conversão do onboarding" "Tech Story" "Not Started" "$TM6" 16

# Integração Slack+Jira (F4)
create_exec "$F4" "OAuth2 flow com Slack" "Tech Story" "Done" "$TM3" 16
create_exec "$F4" "Webhooks de notificação Slack" "Story" "On Going" "$TM3" 24
create_exec "$F4" "Sync bidirecional Jira" "Epic" "Not Started" "$TM3" 48
create_exec "$F4" "UI de configuração de integrações" "Story" "Not Started" "$TM2" 20

# Edge Computing (F7)
create_exec "$F7" "Setup multi-região AWS/Cloudflare" "Tech Story" "Done" "$TM4" 40
create_exec "$F7" "Cache inteligente com invalidação" "Tech Story" "On Going" "$TM4" 32
create_exec "$F7" "Lazy loading de componentes React" "Story" "On Going" "$TM2" 16

# Chat In-App (F11)
create_exec "$F11" "Widget Intercom embed" "Story" "Done" "$TM2" 12
create_exec "$F11" "Base de conhecimento contextual" "Story" "On Going" "$TM2" 24
create_exec "$F11" "Chatbot FAQ com IA" "Epic" "Not Started" "$TM3" 40
echo "✅ 14 Execution Items"

echo ""
echo "══════════════════════════════════════════"
echo "  ✅ SEED COMPLETO!"
echo "  Login: admin@admin.com / admin"
echo "  Plano: Plataforma SaaS de Gestão — 2026"
echo "══════════════════════════════════════════"
