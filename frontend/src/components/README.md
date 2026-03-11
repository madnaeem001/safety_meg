# Components Directory

Reusable UI components for the SafetyPro EHS platform, organized by domain.

## Structure

| Folder | Description |
|--------|-------------|
| `agile/` | Jira-style boards, sprint planning, release views |
| `analytics/` | Charts, KPI cards, trend visualizations, cohort tables |
| `animations/` | Framer Motion wrappers, fade/slide effects |
| `auth/` | Login forms, role gates, permission checks |
| `collaboration/` | Comments, mentions, shared workspaces |
| `dashboard/` | NavigationBar, BottomTabNavigation, Skeleton loaders, SwipeIndicator |
| `leaderboard/` | Safety gamification, points, rankings |
| `pwa/` | PWA install prompt, offline indicators |
| `reports/` | PDF exports, report cards, print layouts |
| `safety/` | Incident forms, risk matrices, hazard cards |
| `scheduling/` | Calendar widgets, inspection scheduling |
| `voice/` | Voice recording, speech-to-text hazard reporting |
| `widgets/` | FeedbackWidget, OnboardingWalkthrough, floating action tools |

## Key Shared Components
- **`ThemeProvider.tsx`** – Dark/light theme context
- **`AISafetyAssistant.tsx`** – Floating AI chat assistant
- **`NavigationBar`** – Exports `NAV_SECTIONS` as the single source of truth for routing

## Conventions
- One component per file, named export matching filename
- Props interfaces defined in the same file
- Framer Motion for all animation (no raw CSS transitions)
- Tailwind CSS only – no inline styles or CSS modules
