# SafetyMEG — EHS & Safety Management Platform

A full-stack, AI-powered Environment, Health & Safety (EHS) management platform for industrial and enterprise operations. SafetyMEG combines a feature-rich React frontend with a robust Hono/Drizzle backend to deliver end-to-end safety governance, compliance tracking, incident management, and predictive risk analytics.

## ✨ Feature Highlights

### Core EHS Modules
- 🚨 **Incident Reporting** — Multi-type incident creation (injury, vehicle, property, near-miss) with AI-assisted analysis
- ⚠️ **Risk Register** — Risk matrix, scoring, and corrective action tracking
- 🔍 **Safety Audit** — Audit scheduling, findings management, and open-findings tracking
- 📋 **Permit to Work** — Full PTW lifecycle with risk classification and digital approval
- 🎓 **Training Management** — Certification tracker, expiry alerts, AI training studio, and course library
- 📊 **Analytics & KPIs** — Executive dashboards, department benchmarks, incident trends, and compliance snapshots
- 🔧 **Root Cause & Corrective Action (RCCA)** — Root cause analysis workflows linked to CAPA management

### AI & Automation
- 🤖 **AI Safety Chat** — Contextual safety assistant across all modules
- 🔮 **Predictive Risk Engine** — Leading/lagging indicator analysis and AI insight generation
- ✍️ **AI Training Generator** — Automated training content creation
- ⚙️ **Automation Rules** — Configurable webhook-driven automation triggers

### Environmental & Compliance
- 🌿 **ESG Reporting** — Emission tracking, sustainability goals, and SWPPP compliance
- 📅 **Compliance Calendar** — Regulatory deadline management and gap analysis
- 🧪 **Chemical Inventory** — SDS management and industrial hygiene assessments
- 📜 **Regulations & Standards Library** — OSHA, EPA, MSHA, NFPA, ISO references

### Workforce & Operations
- 👷 **Worker Dashboard** — Personalized safety task and training overview
- 🏗️ **Contractor Management** — Contractor onboarding, permits, and compliance verification
- 🗣️ **Toolbox Talks** — Digital delivery and attendance tracking
- 💡 **Behavioral Safety (BBS)** — Observation recording and SIF precursor tracking
- 🔒 **Lockout/Tagout (LOTO)** — Procedure builder and digital isolation management
- 📦 **Asset & Sensor Management** — Equipment calibration, IoT sensor dashboard

### Platform & Admin
- 🛠️ **Form Configurator** — No-code custom form builder
- 📈 **Project Management** — Full Jira-like board with agile lifecycle (initiation → closure)
- 🔔 **Notifications** — Email (Resend) and in-app notification system
- 👤 **Self-Admin Platform** — Self-deployment, configuration, and app builder

## 🛠️ Tech Stack

### Frontend (`/frontend`)
| Layer | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build | Vite 7 |
| Styling | Tailwind CSS 3 + custom design system (semantic tokens) |
| Routing | React Router DOM 6 |
| State | Zustand 4 |
| Animations | Framer Motion 11 |
| Icons | Lucide React |
| i18n | i18next + react-i18next |
| Testing | Playwright (E2E) + Vitest |

### Backend (`/backend`)
| Layer | Technology |
|---|---|
| Runtime | Node.js + TypeScript |
| Framework | Hono |
| ORM | Drizzle ORM |
| Database | SQLite (local) / configurable |
| Email | Resend |
| API | REST — 30+ modular route files |

## 🚀 Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev        # http://localhost:5173
npm run build      # Production build
```

### Backend
```bash
cd backend
npm install
npm run dev        # API server
```

## 📁 Project Structure

```
safetymeg/
├── frontend/
│   └── src/
│       ├── api/             # API hooks and service layer
│       ├── components/      # Reusable UI components + SM design system
│       ├── layouts/         # PageContainer and shell layouts
│       ├── pages/           # Feature pages (30+)
│       ├── hooks/           # Custom React hooks
│       ├── store/           # Zustand state stores
│       ├── types/           # TypeScript type definitions
│       └── utils/           # Shared utilities
└── backend/
    └── src/
        ├── routes/          # 30+ modular Hono route files
        ├── db.ts            # Drizzle database connection
        └── __generated__/   # Drizzle schema and types
```

## 🎨 Design System

SafetyMEG uses a custom semantic token design system built on Tailwind CSS:
- **Semantic tokens**: `text-text-primary`, `text-text-secondary`, `text-text-muted`, `bg-surface-raised`, `bg-primary`, `bg-accent`, `bg-danger`, `bg-success`, `bg-warning`
- **SM Component Library**: `SMButton`, `SMCard`, `SMInput`, `SMSelect`, `SMBadge`, `SMAlert`, `SMStatCard`, `SMTable`, `SMTabs`, `SMModal`, `SMDrawer`, `SMSkeleton`
- **Layout**: `PageContainer` with configurable `maxWidth` for consistent page structure

## More Information

For frontend architecture conventions and design system details, see [frontend/YOUWARE.md](./frontend/YOUWARE.md).  
For backend route documentation, see [backend/AGENTS.md](./backend/AGENTS.md).