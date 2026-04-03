# Board Manager — Project Handoff Guide

> **Last updated**: 2026-03-08
> **Purpose**: Complete reference for any agent continuing work on this project.

---

## 1. Project Overview

**Board Manager** is a strategic planning management platform (SaaS-style) built as a single-page app with a Node.js backend. It allows users to define strategic choices, goals/KPIs, objectives, initiatives (features), key results, and manage execution via a Gantt-like roadmap.

**UI Language**: Portuguese (PT-BR) for user-facing labels; English for technical/market terms (OKR, KPI, Roadmap, Analytics).

---

## 2. Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | React + Vite | React 18, Vite 6 |
| Routing | react-router-dom | v6 |
| Icons | lucide-react | v0.575 |
| Styling | Vanilla CSS ("liquidglass" aesthetic) | — |
| Backend | Express.js | v5 |
| ORM | Knex.js | v3 |
| Database | SQLite (default), PostgreSQL, MySQL/MariaDB | better-sqlite3 |
| Dev | nodemon, concurrently | — |

**No TypeScript, no Tailwind, no state management library** — state is managed via React hooks + Context API.

---

## 3. Running the Project

```bash
# Install dependencies
npm install

# Start dev (frontend + backend concurrently)
npm run dev

# Frontend only: http://localhost:3000
npm run dev:frontend

# Backend only: http://localhost:3001
npm run dev:backend
```

- **Vite proxy**: `/api` → `http://127.0.0.1:3001` (configured in `vite.config.js`)
- **Default credentials**: `admin@admin.com` / `admin`
- **SQLite path**: `/tmp/bm-data/board-manager.sqlite` (env `DB_FILENAME`)
- **DB client**: `better-sqlite3` (env `DB_CLIENT` for pg/mysql2)

---

## 4. Architecture

```
Board Manager/
├── server/                    # Express backend
│   ├── index.js               # App entry, route mounting
│   ├── db.js                  # Knex init, migrations, tag-sync, admin seed
│   ├── migrations/            # 7 Knex migrations
│   │   ├── 001_initial_schema.js       # users, boards, lanes, features, tags
│   │   ├── 002_strategic_tables.js     # key_results, team_members, resource_allocations
│   │   ├── 003_add_effort_hours.js     # effort_hours col on features
│   │   ├── 004_strategic_framework.js  # strategic_choices, goals_kpis, risks, etc.
│   │   ├── 005_comments.js             # comments table
│   │   ├── 005_rename_boards_to_plans.js # boards→plans, board_id→plan_id
│   │   └── 006_add_lower_is_better.js  # lower_is_better on metrics tables
│   ├── routes/                # 13 API route files
│   │   ├── auth.js            # POST /api/auth/login, /register
│   │   ├── plans.js           # CRUD /api/plans
│   │   ├── lanes.js           # CRUD /api/lanes (objectives)
│   │   ├── features.js        # CRUD /api/features (initiatives)
│   │   ├── tags.js            # CRUD /api/tags
│   │   ├── users.js           # CRUD /api/users (admin)
│   │   ├── okrs.js            # CRUD /api/okrs (key results)
│   │   ├── resources.js       # /api/resources/members + /allocations
│   │   ├── risks.js           # CRUD /api/risks
│   │   ├── strategic-choices.js # Choices + goals + goal↔lane links
│   │   ├── execution-items.js # Sub-items of features
│   │   ├── indicators.js      # Product indicators + efficiency indicators + KR links
│   │   └── comments.js        # Feature comments
│   ├── seed-api.py            # Python seed via API (stdlib only)
│   ├── seed-example.js        # Knex seed (requires node_modules)
│   └── seed-via-api.sh        # Bash seed (curl-based, deprecated)
├── src/                       # React frontend
│   ├── App.jsx                # Router (BrowserRouter)
│   ├── main.jsx               # Entry point
│   ├── index.css              # Main styles (~2700 lines, liquidglass)
│   ├── utilities.css           # Utility classes (~300+ rules)
│   ├── context/
│   │   ├── AuthContext.jsx    # Auth state (user, login, logout)
│   │   └── ToastContext.jsx   # Toast notifications
│   ├── constants/
│   │   └── labels.js          # i18n labels (PT-BR)
│   ├── hooks/                 # 9 custom hooks (API data fetching)
│   │   ├── usePlans.js        # Plans CRUD + plan data loading
│   │   ├── useGoals.js        # Goals/KPIs + goal↔lane links
│   │   ├── useStrategicChoices.js
│   │   ├── useOKRs.js         # Key Results
│   │   ├── useIndicators.js   # Product + efficiency indicators
│   │   ├── useResources.js    # Team members + allocations
│   │   ├── useRisks.js
│   │   ├── useExecutionItems.js
│   │   └── useComments.js
│   ├── components/            # 15 reusable components
│   │   ├── PlanHeader.jsx     # Shared nav header for plan views
│   │   ├── PlanWelcome.jsx    # Empty state for new plans
│   │   ├── FeatureBar.jsx     # Gantt bar (draggable, resizable)
│   │   ├── FeatureModal.jsx   # Create/edit feature modal
│   │   ├── OKRPanel.jsx       # OKR management panel
│   │   ├── ExecutionPanel.jsx # Execution items panel
│   │   ├── RiskMatrix.jsx     # Risk management matrix
│   │   ├── CapacityDashboard.jsx # Team capacity management
│   │   ├── TagManager.jsx     # Tag CRUD
│   │   ├── TeamManager.jsx    # Team member CRUD
│   │   ├── CommentsPanel.jsx  # Feature comments
│   │   ├── ImportModal.jsx    # CSV/JSON import
│   │   ├── HealthIndicator.jsx # Green/yellow/red dot
│   │   ├── ConfirmDialog.jsx  # Confirmation modal
│   │   └── ProtectedRoute.jsx # Auth guard
│   ├── pages/                 # 9 page components
│   │   ├── Login.jsx          # /login
│   │   ├── Register.jsx       # /register
│   │   ├── Dashboard.jsx      # / (plan list, "Meus Planejamentos")
│   │   ├── StrategicCanvas.jsx # /plan/:id/canvas (vision, mission, just cause)
│   │   ├── StrategicChoices.jsx # /plan/:id/choices (choices + goals + links)
│   │   ├── Roadmap.jsx        # /plan/:id/roadmap (Gantt timeline)
│   │   ├── MetricsCascade.jsx # /plan/:id/metrics (OKRs, indicators, execution)
│   │   ├── Analytics.jsx      # /plan/:id/analytics (charts, risk matrix)
│   │   └── AdminPanel.jsx     # /admin (user management)
│   └── utils/
│       ├── data.js            # Date helpers, calculateBarPosition, formatDate
│       └── calculations.js    # calcProgress, health, risk score, capacity
├── knexfile.js                # DB config (multi-driver)
├── vite.config.js             # Vite + proxy config
├── package.json               # Dependencies
└── nodemon.json               # Watch server/ dir
```

---

## 5. Database Schema (17 tables)

```
users                 plans                lanes
├── id                ├── id               ├── id
├── name              ├── user_id → users  ├── plan_id → plans
├── email             ├── title            ├── title
├── password_hash     ├── visibility       ├── sort_order
├── role              ├── just_cause       ├── strategic_choice_id → strategic_choices
└── created_at        ├── vision           ├── problem_opportunity
                      ├── mission          └── created_at
                      └── created_at

strategic_choices     goals_kpis                    goal_objective_links
├── id                ├── id                        ├── id
├── plan_id → plans   ├── strategic_choice_id → sc  ├── goal_id → goals_kpis
├── title             ├── title                     └── lane_id → lanes
├── description       ├── target_value
├── color             ├── current_value
├── sort_order        ├── unit
└── created_at        ├── frequency
                      ├── lower_is_better
                      └── created_at

features              key_results                   product_indicators
├── id                ├── id                        ├── id
├── lane_id → lanes   ├── lane_id → lanes           ├── feature_id → features
├── title             ├── title                     ├── title
├── description       ├── target_value              ├── target_value
├── status            ├── current_value             ├── current_value
├── tags_json (JSON)  ├── unit                      ├── unit
├── start_date        ├── lower_is_better           ├── lower_is_better
├── end_date          └── created_at                └── created_at
├── effort_hours
└── created_at        indicator_kr_links            execution_items
                      ├── id                        ├── id
tags                  ├── indicator_id → prod_ind   ├── feature_id → features
├── id                └── kr_id → key_results       ├── title
├── plan_id → plans                                 ├── description
├── name              team_members                  ├── item_type
├── color             ├── id                        ├── status
└── created_at        ├── plan_id → plans           ├── assignee_id → team_members
                      ├── name                      ├── effort_hours
risks                 ├── role_title                ├── sort_order
├── id                ├── avatar_color              └── created_at
├── plan_id → plans   ├── capacity_hours_per_quarter
├── title             └── created_at                comments
├── description                                     ├── id
├── impact (1-5)      resource_allocations          ├── feature_id → features
├── probability (1-5) ├── id                        ├── user_id → users
├── status            ├── member_id → team_members  ├── content
├── mitigation        ├── feature_id → features     └── created_at
├── owner             ├── hours_allocated
└── created_at        ├── quarter                   efficiency_indicators
                      ├── year                      ├── id
                      └── created_at                ├── plan_id → plans
                                                    ├── title
                                                    ├── value
                                                    ├── unit
                                                    ├── period
                                                    └── created_at
```

---

## 6. API Routes Quick Reference

All API calls require the client-generated `id` field in POST body. The API does NOT auto-generate IDs (except for `strategic_choices`, `goals_kpis`, `execution_items`).

| Method | Route | Body / Query |
|---|---|---|
| POST | `/api/auth/login` | `{ email, password }` |
| POST | `/api/auth/register` | `{ name, email, password }` |
| GET | `/api/plans?userId=` | — |
| POST | `/api/plans` | `{ id, userId, title, visibility, justCause, vision, mission }` |
| PUT | `/api/plans/:id` | `{ title, visibility, justCause, vision, mission }` |
| DELETE | `/api/plans/:id` | — |
| GET | `/api/lanes?planId=` | — |
| POST | `/api/lanes` | `{ id, planId, title, strategicChoiceId }` |
| GET | `/api/features?planId=` or `?laneId=` | — |
| POST | `/api/features` | `{ id, laneId, title, description, status, tags[], startDate, endDate, effortHours }` |
| GET | `/api/strategic-choices?planId=` | — |
| POST | `/api/strategic-choices` | `{ planId, title, description, color }` (auto-ID) |
| POST | `/api/strategic-choices/:choiceId/goals` | `{ title, targetValue, unit, frequency }` (auto-ID) |
| POST | `/api/strategic-choices/goals/:goalId/links` | `{ laneId }` |
| GET | `/api/okrs?laneId=` | — |
| POST | `/api/okrs` | `{ id, laneId, title, targetValue, currentValue, unit }` |
| GET | `/api/tags?planId=` | — |
| POST | `/api/tags` | `{ planId, name, color }` |
| GET | `/api/risks?planId=` | — |
| POST | `/api/risks` | `{ id, planId, title, description, impact, probability, status, mitigation }` |
| GET | `/api/resources/members?planId=` | — |
| POST | `/api/resources/members` | `{ id, planId, name, roleTitle, avatarColor, capacityHoursPerQuarter }` |
| GET | `/api/resources/allocations?planId=` | — |
| POST | `/api/resources/allocations` | `{ id, memberId, featureId, hoursAllocated, quarter, year }` |
| GET | `/api/execution-items?featureId=` | — |
| POST | `/api/execution-items` | `{ featureId, title, itemType, assigneeId, effortHours }` (auto-ID) |
| GET | `/api/indicators/product/plan/:planId` | — |
| POST | `/api/indicators/product` | `{ featureId, title, targetValue, currentValue, unit }` (auto-ID) |
| POST | `/api/indicators/product/:id/kr-links` | `{ krId }` |
| GET | `/api/indicators/efficiency?planId=` | — |
| POST | `/api/indicators/efficiency` | `{ planId, title, value, unit, period }` (auto-ID) |
| GET | `/api/comments?featureId=` | — |
| POST | `/api/comments` | `{ featureId, userId, content }` |

---

## 7. Frontend Routing

| Route | Page | Description |
|---|---|---|
| `/` | Dashboard | Plan list ("Meus Planejamentos") |
| `/login` | Login | Email/password login |
| `/register` | Register | User registration |
| `/plan/:id` | → redirects to `/canvas` | Auto-redirect |
| `/plan/:id/canvas` | StrategicCanvas | Just Cause, Vision, Mission, Summary |
| `/plan/:id/choices` | StrategicChoices | Strategic Choices + Goals + Objective Links |
| `/plan/:id/roadmap` | Roadmap | Gantt timeline with features |
| `/plan/:id/metrics` | MetricsCascade | OKRs, Product Indicators, Execution |
| `/plan/:id/analytics` | Analytics | Charts, Risk Matrix, Capacity |
| `/admin` | AdminPanel | User management |

---

## 8. Key Design Patterns

1. **Client-generated IDs**: Most POST endpoints expect the `id` in the body. Exception: `strategic_choices`, `goals_kpis`, `execution_items`, `product_indicators`, `efficiency_indicators` auto-generate UUIDs via `crypto.randomUUID()`.

2. **snake_case ↔ camelCase mapping**: DB uses `snake_case`, API/frontend uses `camelCase`. Each route handler maps both ways manually.

3. **Tags as JSON**: `features.tags_json` stores tags as a JSON array of `{name, color}` objects. The `tags` table provides a plan-level tag registry. `db.js` syncs on startup.

4. **Strategic hierarchy**: `Plan → Strategic Choices → Goals/KPIs` and `Plan → Lanes (Objectives) → Features → Execution Items`. Goals are linked to Lanes via `goal_objective_links` (N:N).

5. **Metrics cascade**: `Goals/KPIs ← goal_objective_links → Lanes → Key Results ← indicator_kr_links → Product Indicators ← Features`.

6. **`lower_is_better`**: Boolean on `goals_kpis`, `key_results`, `product_indicators`. When true, progress = `target/current` instead of `current/target`.

---

## 9. Current Status — What's Done ✅

- [x] Full authentication (login/register/logout)
- [x] Multi-plan dashboard with CRUD
- [x] Strategic Canvas (vision, mission, just cause)
- [x] Strategic Choices with Goals/KPIs and Objective linking
- [x] Roadmap with Gantt timeline (drag-to-create, resize, move features)
- [x] Feature modal (create/edit with tags, dates, effort)
- [x] Tag management system
- [x] Team member management with capacity tracking
- [x] Resource allocation by quarter
- [x] Risk management with 5×5 matrix
- [x] OKR panel (Key Results per objective)
- [x] Product indicators linked to KRs
- [x] Efficiency indicators
- [x] Execution items (stories/epics per feature)
- [x] Comments on features
- [x] Import/Export (CSV/JSON)
- [x] Analytics page with charts
- [x] Admin panel for user management
- [x] Board → Plan rename (complete on frontend/API, migration done)
- [x] `lower_is_better` metric support
- [x] Centralized labels system (`constants/labels.js`)
- [x] Calculation utilities (`utils/calculations.js`)
- [x] Multi-database support (SQLite/PostgreSQL/MySQL via knexfile)
- [x] Example seed data (Python script)
- [x] Toast notification system

---

## 10. Known Issues & Technical Debt 🔧

### Bugs to Investigate

1. **Canvas view rendering error**: StrategicCanvas may crash on load — likely a missing field or stale board→plan reference in the data.
2. **Overlapping feature bars**: When multiple features in the same lane have overlapping dates, bars stack visually on top of each other. A multi-row stacking algorithm is needed (assign each feature a vertical "row" based on date overlap).
3. **Stray `boardId` fallbacks**: `server/routes/okrs.js:33` and `server/routes/execution-items.js:28` have `planId || boardId` backward compat — should be cleaned up.
4. **Duplicate migration prefix**: There are two `005_` migrations (`005_comments.js` and `005_rename_boards_to_plans.js`). Knex runs them alphabetically so it works, but should be renumbered (e.g., `007_comments.js`).

### Missing / Nice-to-have

- [ ] **Automated tests**: No test files exist. Should add at least API endpoint tests.
- [ ] **Password hashing**: `password_hash` stores plain text — needs bcrypt.
- [ ] **JWT auth**: Currently session-less (client stores user object); should implement JWT tokens.
- [ ] **Role-based access**: `role` field exists but isn't enforced on routes.
- [ ] **Responsive design**: CSS is desktop-focused.
- [ ] **Dark/light theme toggle**: Theme toggle button exists but functionality may be incomplete.
- [ ] **Deployment config**: No Dockerfile, CI/CD, or production config.
- [ ] **Delete cascading on all entities**: Need to verify CASCADE behavior on plan deletion.
- [ ] **Board-manager.sqlite in root**: There's a `board-manager.sqlite` file in the project root (possibly a leftover) alongside the actual DB in `/tmp/bm-data/`.

---

## 11. Seed Data

A complete example scenario exists. To re-seed:

```bash
# Delete existing plan first if needed
curl -X DELETE http://localhost:3001/api/plans/plan-example-2026

# Seed via Python (requires running server on port 3001)
python3 server/seed-api.py
```

The seed creates a realistic "Plataforma SaaS de Gestão — 2026" plan with all 17 entity types populated.

---

## 12. CSS Architecture

- **`index.css`** (~2700 lines): Main styles using CSS variables for the "liquidglass" dark theme aesthetic. Key variable prefixes:
  - `--bg-*`: Background colors
  - `--glass-*`: Glassmorphism effects
  - `--accent*`: Blue accent colors
  - `--text-*`: Text colors
  - `--space-*`: Spacing tokens
  - `--radius-*`: Border radius tokens

- **`utilities.css`** (~300 rules): Utility classes (flex, grid, spacing, etc.)

---

## 13. Quick Start for New Agent

1. **Read this file** for full project context
2. **Read `constants/labels.js`** for UI language conventions
3. **Read `utils/calculations.js`** for business logic
4. **Check the running app** at `http://localhost:3000`
5. **API testing**: `curl http://localhost:3001/api/plans?userId=admin-mmgskfu3`
6. **DB inspection**: The SQLite file is at `/tmp/bm-data/board-manager.sqlite`
7. **All hooks follow the same pattern**: fetch on mount/deps change, expose data + CRUD functions
8. **All route files follow the same pattern**: GET (list), POST (create), PUT (update), DELETE
