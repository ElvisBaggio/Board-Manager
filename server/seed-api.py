#!/usr/bin/env python3
"""
Seed script — creates a complete example strategic plan via API calls.
Run: python3 server/seed-api.py
"""
import json
import urllib.request
import uuid

BASE = "http://localhost:3001/api"

def uid():
    return str(uuid.uuid4())

def post(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}/{path}", data=body, method="POST",
                                headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  ⚠ POST {path} failed: {e}")
        return {}

def put(path, data):
    body = json.dumps(data).encode()
    req = urllib.request.Request(f"{BASE}/{path}", data=body, method="PUT",
                                headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req) as resp:
            return json.loads(resp.read())
    except Exception as e:
        print(f"  ⚠ PUT {path} failed: {e}")
        return {}

print("🌱 Seeding complete example plan...")

# ─── 1. PLAN ──────────────────────────────────────────────
PLAN_ID = "plan-example-2026"
USER_ID = "admin-mmgskfu3"

post("plans", {
    "id": PLAN_ID, "userId": USER_ID,
    "title": "Plataforma SaaS de Gestão — 2026",
    "visibility": "Privado",
    "justCause": "Democratizar o acesso a ferramentas de planejamento estratégico de alta qualidade, permitindo que empresas de todos os tamanhos possam tomar decisões orientadas por dados e alcançar seus objetivos com clareza e eficiência.",
    "vision": "Ser a plataforma líder em gestão estratégica na América Latina até 2028, atendendo mais de 10.000 empresas com soluções intuitivas e acessíveis.",
    "mission": "Transformar a forma como empresas planejam e executam suas estratégias, oferecendo uma plataforma integrada que conecta visão, execução e métricas em um único ambiente colaborativo.",
})
print("✅ Plan created")

# ─── 2. STRATEGIC CHOICES ─────────────────────────────────
SC_GROWTH = post("strategic-choices", {
    "planId": PLAN_ID, "title": "Crescimento Acelerado",
    "description": "Priorizar aquisição de novos clientes e expansão de mercado por meio de funcionalidades inovadoras, integrações com ecossistemas existentes e um modelo freemium atraente.",
    "color": "#10b981",
}).get("id")

SC_EXCELLENCE = post("strategic-choices", {
    "planId": PLAN_ID, "title": "Excelência Operacional",
    "description": "Garantir uma experiência de uso impecável com foco em performance, confiabilidade, segurança e redução de churn por meio de um produto maduro e estável.",
    "color": "#6366f1",
}).get("id")
print(f"✅ 2 Strategic Choices: {SC_GROWTH}, {SC_EXCELLENCE}")

# ─── 3. GOALS / KPIs ─────────────────────────────────────
G_MRR = post(f"strategic-choices/{SC_GROWTH}/goals", {"title": "MRR (Receita Recorrente Mensal)", "targetValue": 500000, "unit": "R$", "frequency": "monthly"}).get("id")
G_MAU = post(f"strategic-choices/{SC_GROWTH}/goals", {"title": "Usuários ativos mensais (MAU)", "targetValue": 10000, "unit": "users", "frequency": "monthly"}).get("id")
G_NPS = post(f"strategic-choices/{SC_EXCELLENCE}/goals", {"title": "NPS (Net Promoter Score)", "targetValue": 80, "unit": "pts", "frequency": "quarterly"}).get("id")
G_UPT = post(f"strategic-choices/{SC_EXCELLENCE}/goals", {"title": "Uptime da plataforma", "targetValue": 99.95, "unit": "%", "frequency": "monthly"}).get("id")
# Update current values
put(f"strategic-choices/goals/{G_MRR}", {"currentValue": 180000})
put(f"strategic-choices/goals/{G_MAU}", {"currentValue": 3200})
put(f"strategic-choices/goals/{G_NPS}", {"currentValue": 62})
put(f"strategic-choices/goals/{G_UPT}", {"currentValue": 99.7})
print(f"✅ 4 Goals with current values")

# ─── 4. LANES (OBJECTIVES) ───────────────────────────────
L_ACQ = uid()
L_CORE = uid()
L_PERF = uid()
L_RET = uid()
post("lanes", {"id": L_ACQ, "planId": PLAN_ID, "title": "Aquisição e Onboarding", "strategicChoiceId": SC_GROWTH})
post("lanes", {"id": L_CORE, "planId": PLAN_ID, "title": "Funcionalidades Core", "strategicChoiceId": SC_GROWTH})
post("lanes", {"id": L_PERF, "planId": PLAN_ID, "title": "Performance e Infraestrutura", "strategicChoiceId": SC_EXCELLENCE})
post("lanes", {"id": L_RET, "planId": PLAN_ID, "title": "Retenção e Suporte", "strategicChoiceId": SC_EXCELLENCE})
print(f"✅ 4 Lanes")

# ─── 5. GOAL ↔ OBJECTIVE LINKS ───────────────────────────
post(f"strategic-choices/goals/{G_MRR}/links", {"laneId": L_ACQ})
post(f"strategic-choices/goals/{G_MAU}/links", {"laneId": L_ACQ})
post(f"strategic-choices/goals/{G_MAU}/links", {"laneId": L_CORE})
post(f"strategic-choices/goals/{G_NPS}/links", {"laneId": L_RET})
post(f"strategic-choices/goals/{G_UPT}/links", {"laneId": L_PERF})
print("✅ 5 Goal ↔ Lane links")

# ─── 6. KEY RESULTS ──────────────────────────────────────
KR1 = uid(); post("okrs", {"id": KR1, "laneId": L_ACQ, "title": "Aumentar conversão trial→pago de 8% para 20%", "targetValue": 20, "currentValue": 12, "unit": "%"})
KR2 = uid(); post("okrs", {"id": KR2, "laneId": L_CORE, "title": "Lançar 5 integrações nativas (Slack, Jira, Notion, Google, Teams)", "targetValue": 5, "currentValue": 2, "unit": "integrações"})
KR3 = uid(); post("okrs", {"id": KR3, "laneId": L_PERF, "title": "Reduzir latência média para < 1s", "targetValue": 1, "currentValue": 2.1, "unit": "s"})
KR4 = uid(); post("okrs", {"id": KR4, "laneId": L_RET, "title": "Reduzir churn mensal de 5% para 2%", "targetValue": 2, "currentValue": 3.8, "unit": "%"})
print(f"✅ 4 Key Results")

# ─── 7. TAGS ─────────────────────────────────────────────
for name, color in [("Frontend","#3b82f6"),("Backend","#ef4444"),("UX/UI","#a855f7"),("Infra","#f59e0b"),("Integrações","#10b981"),("Data","#06b6d4")]:
    post("tags", {"planId": PLAN_ID, "name": name, "color": color})
print("✅ 6 Tags")

# ─── 8. FEATURES ─────────────────────────────────────────
def feat(lane, title, desc, status, tags, start, end, effort):
    fid = uid()
    post("features", {"id": fid, "laneId": lane, "title": title, "description": desc,
                       "status": status, "tags": tags, "startDate": start, "endDate": end, "effortHours": effort})
    return fid

TAG = lambda *names: [{"name": n, "color": {"Frontend":"#3b82f6","Backend":"#ef4444","UX/UI":"#a855f7","Infra":"#f59e0b","Integrações":"#10b981","Data":"#06b6d4"}[n]} for n in names]

# Aquisição e Onboarding
F1 = feat(L_ACQ, "Onboarding Wizard Interativo", "Fluxo guiado para novos usuários com tour interativo, templates prontos e setup assistido do primeiro planejamento.", "On Going", TAG("Frontend","UX/UI"), "2026-01-15", "2026-03-31", 160)
F2 = feat(L_ACQ, "Modelo Freemium + Trial 14 dias", "Implementar plano gratuito com limites e trial automático do Pro, incluindo email marketing de nurture.", "Not Started", TAG("Backend"), "2026-03-01", "2026-05-15", 200)
F3 = feat(L_ACQ, "Landing Page e SEO", "Nova landing page com cases de sucesso, calculadora de ROI e otimização para motores de busca.", "Done", TAG("Frontend","UX/UI"), "2026-01-05", "2026-02-28", 80)

# Funcionalidades Core
F4 = feat(L_CORE, "Integração Slack + Jira", "Notificações bidirecionais com Slack e sincronização de items de execução com Jira.", "On Going", TAG("Integrações","Backend"), "2026-02-01", "2026-04-30", 240)
F5 = feat(L_CORE, "Dashboards Customizáveis", "Editor drag-and-drop com widgets de métricas, gráficos interativos e filtros dinâmicos.", "Not Started", TAG("Frontend","Data"), "2026-04-01", "2026-07-31", 320)
F6 = feat(L_CORE, "API Pública + Webhooks", "API RESTful com OpenAPI, autenticação via API keys, rate limiting e webhooks para eventos.", "Not Started", TAG("Backend","Integrações"), "2026-05-01", "2026-08-31", 280)

# Performance e Infraestrutura
F7 = feat(L_PERF, "Migração para Edge Computing", "Deploy multi-região com CDN edge functions, cache inteligente e lazy loading.", "On Going", TAG("Infra"), "2026-01-20", "2026-04-15", 200)
F8 = feat(L_PERF, "Otimização de Queries e Índices", "Profiling de queries lentas, índices compostos, query caching com Redis.", "Not Started", TAG("Backend","Infra"), "2026-03-15", "2026-05-31", 120)
F9 = feat(L_PERF, "Monitoramento e Observabilidade", "Stack com OpenTelemetry, Grafana, alertas inteligentes e SLO tracking.", "Done", TAG("Infra","Data"), "2026-01-05", "2026-02-20", 100)

# Retenção e Suporte
F10 = feat(L_RET, "Sistema de Health Score", "Score automatizado de saúde do cliente baseado em engajamento, uso de features e feedback.", "Not Started", TAG("Data","Backend"), "2026-04-01", "2026-06-30", 180)
F11 = feat(L_RET, "Chat In-App + Base de Conhecimento", "Widget de chat, artigos contextuais e chatbot com IA para FAQ automatizado.", "On Going", TAG("Frontend","UX/UI"), "2026-02-15", "2026-05-15", 160)
F12 = feat(L_RET, "NPS Survey Automatizado", "Pesquisas NPS in-app com segmentação por plano e dashboard de resultados.", "Done", TAG("Frontend","Data"), "2026-01-10", "2026-02-28", 60)
print(f"✅ 12 Features")

# ─── 9. PRODUCT INDICATORS ───────────────────────────────
PI1 = post("indicators/product", {"featureId": F1, "title": "Taxa de conclusão do onboarding", "targetValue": 85, "currentValue": 71, "unit": "%"}).get("id")
PI2 = post("indicators/product", {"featureId": F2, "title": "Conversão trial → pago", "targetValue": 20, "currentValue": 8, "unit": "%"}).get("id")
PI3 = post("indicators/product", {"featureId": F4, "title": "Adoção de integrações (% usuários)", "targetValue": 60, "currentValue": 25, "unit": "%"}).get("id")
PI4 = post("indicators/product", {"featureId": F7, "title": "P95 latência páginas complexas", "targetValue": 1200, "currentValue": 2800, "unit": "ms"}).get("id")
PI5 = post("indicators/product", {"featureId": F9, "title": "Taxa de erros 5xx em produção", "targetValue": 0.1, "currentValue": 0.3, "unit": "%"}).get("id")
PI6 = post("indicators/product", {"featureId": F11, "title": "CSAT do chat de suporte", "targetValue": 90, "currentValue": 78, "unit": "%"}).get("id")
print("✅ 6 Product Indicators")

# ─── 10. INDICATOR ↔ KR LINKS ────────────────────────────
for pi, kr in [(PI1,KR1),(PI2,KR1),(PI3,KR2),(PI4,KR3),(PI6,KR4)]:
    if pi and kr:
        post(f"indicators/product/{pi}/kr-links", {"krId": kr})
print("✅ 5 Indicator ↔ KR links")

# ─── 11. TEAM MEMBERS ────────────────────────────────────
def member(name, role, color, cap):
    mid = uid()
    post("resources/members", {"id": mid, "planId": PLAN_ID, "name": name, "roleTitle": role, "avatarColor": color, "capacityHoursPerQuarter": cap})
    return mid

TM_LEAD = member("Ana Souza", "Tech Lead", "#ef4444", 480)
TM_FRONT = member("Carlos Lima", "Frontend Engineer", "#3b82f6", 480)
TM_BACK = member("Juliana Costa", "Backend Engineer", "#10b981", 480)
TM_DEVOPS = member("Ricardo Mendes", "DevOps Engineer", "#f59e0b", 400)
TM_UX = member("Mariana Santos", "UX Designer", "#a855f7", 440)
TM_DATA = member("Pedro Alves", "Data Engineer", "#06b6d4", 480)
print("✅ 6 Team Members")

# ─── 12. RESOURCE ALLOCATIONS ────────────────────────────
def alloc(mid, fid, hours, q, y=2026):
    post("resources/allocations", {"id": uid(), "memberId": mid, "featureId": fid, "hoursAllocated": hours, "quarter": q, "year": y})

# Q1
alloc(TM_FRONT, F1, 120, 1); alloc(TM_UX, F1, 80, 1)
alloc(TM_FRONT, F3, 60, 1); alloc(TM_DEVOPS, F7, 160, 1)
alloc(TM_DEVOPS, F9, 100, 1); alloc(TM_BACK, F4, 120, 1)
alloc(TM_FRONT, F11, 80, 1); alloc(TM_DATA, F12, 60, 1)
# Q2
alloc(TM_BACK, F2, 160, 2); alloc(TM_BACK, F4, 120, 2)
alloc(TM_FRONT, F5, 200, 2); alloc(TM_UX, F5, 120, 2)
alloc(TM_DEVOPS, F8, 120, 2); alloc(TM_DATA, F10, 180, 2)
alloc(TM_LEAD, F6, 100, 2)
# Q3
alloc(TM_FRONT, F5, 120, 3); alloc(TM_BACK, F6, 200, 3)
alloc(TM_LEAD, F6, 80, 3); alloc(TM_DATA, F10, 100, 3)
print("✅ 19 Resource Allocations")

# ─── 13. RISKS ───────────────────────────────────────────
def risk(title, desc, impact, prob, status, mitigation):
    post("risks", {"id": uid(), "planId": PLAN_ID, "title": title, "description": desc, "impact": impact, "probability": prob, "status": status, "mitigation": mitigation})

risk("Dependência de APIs de terceiros", "Integrações dependem da estabilidade e versionamento de APIs externas. Mudanças breaking podem impactar features críticas.", 4, 3, "Open", "Adapter pattern, versionar integrações e monitorar changelogs.")
risk("Perda de engenheiros-chave", "Equipe enxuta com risco se membros seniores saírem. Conhecimento concentrado.", 5, 2, "Open", "Documentação rigorosa, pair programming rotativo, política de retenção.")
risk("Atraso na migração edge computing", "Complexidade pode atrasar entregas de performance, impactando SLOs.", 3, 3, "Mitigating", "Abordagem incremental com rollback automático e feature flags.")
risk("Concorrência lança feature similar", "Competidores podem lançar dashboards customizáveis antes.", 3, 4, "Open", "Foco em UX diferenciada e integrações como moats.")
risk("Violação de dados / LGPD", "Incidente de segurança pode gerar multas e churn massivo.", 5, 1, "Open", "Pentest trimestral, criptografia e2e, auditorias LGPD, DPO dedicado.")
print("✅ 5 Risks")

# ─── 14. EFFICIENCY INDICATORS ───────────────────────────
for title, val, unit, per in [
    ("Lead Time (ideia → produção)", 21, "dias", "Q1 2026"),
    ("Cycle Time médio", 5.2, "dias", "Q1 2026"),
    ("Deploy Frequency", 12, "deploys/semana", "Q1 2026"),
    ("MTTR (Mean Time to Recovery)", 28, "minutos", "Q1 2026"),
    ("Velocity da equipe", 42, "pontos/sprint", "Q1 2026"),
]:
    post("indicators/efficiency", {"planId": PLAN_ID, "title": title, "value": val, "unit": unit, "period": per})
print("✅ 5 Efficiency Indicators")

# ─── 15. EXECUTION ITEMS ─────────────────────────────────
def exec_item(fid, title, itype, status, assignee, hours):
    post("execution-items", {"featureId": fid, "title": title, "itemType": itype, "status": status, "assigneeId": assignee, "effortHours": hours})

# Onboarding Wizard (F1)
exec_item(F1, "Design do fluxo de onboarding", "Story", "Done", TM_UX, 24)
exec_item(F1, "Componente de tour interativo", "Story", "Done", TM_FRONT, 32)
exec_item(F1, "Templates de planejamento prontos", "Story", "On Going", TM_FRONT, 20)
exec_item(F1, "Analytics de conversão do onboarding", "Tech Story", "Not Started", TM_DATA, 16)

# Integração Slack+Jira (F4)
exec_item(F4, "OAuth2 flow com Slack", "Tech Story", "Done", TM_BACK, 16)
exec_item(F4, "Webhooks de notificação Slack", "Story", "On Going", TM_BACK, 24)
exec_item(F4, "Sync bidirecional Jira", "Epic", "Not Started", TM_BACK, 48)
exec_item(F4, "UI de configuração de integrações", "Story", "Not Started", TM_FRONT, 20)

# Edge Computing (F7)
exec_item(F7, "Setup multi-região AWS/Cloudflare", "Tech Story", "Done", TM_DEVOPS, 40)
exec_item(F7, "Cache inteligente com invalidação", "Tech Story", "On Going", TM_DEVOPS, 32)
exec_item(F7, "Lazy loading de componentes React", "Story", "On Going", TM_FRONT, 16)

# Chat In-App (F11)
exec_item(F11, "Widget Intercom embed", "Story", "Done", TM_FRONT, 12)
exec_item(F11, "Base de conhecimento contextual", "Story", "On Going", TM_FRONT, 24)
exec_item(F11, "Chatbot FAQ com IA", "Epic", "Not Started", TM_BACK, 40)
print("✅ 14 Execution Items")

print()
print("══════════════════════════════════════════════")
print("  ✅ SEED COMPLETO!")
print("  Login: admin@admin.com / admin")
print("  Plano: Plataforma SaaS de Gestão — 2026")
print("══════════════════════════════════════════════")
