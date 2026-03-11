# Pages Directory

Top-level route components for the SafetyPro EHS platform. Each file maps to a route in `App.tsx`.

## Page Categories

### Dashboard & Overview
| Page | Route | Description |
|------|-------|-------------|
| `Dashboard` | `/` | Main KPI dashboard with real-time metrics |
| `LandingPage` | `/demo` | Marketing/demo landing page |
| `EnterpriseCommandCenter` | `/enterprise` | Multi-site command center |
| `WorkerDashboard` | `/worker-dashboard` | Simplified view for field workers |

### Incidents & Reporting
| Page | Route | Description |
|------|-------|-------------|
| `IncidentReporting` | `/report-incident` | New incident submission form |
| `FullIncidentReport` | `/full-report` | Comprehensive incident detail |
| `VehicleIncidentReport` | `/vehicle-incident` | Vehicle-specific incidents |
| `InjuryReport` | `/injury-report` | Workplace injury documentation |
| `NearMissReport` | `/near-miss` | Near-miss event logging |
| `InvestigationReports` | `/investigation-reports` | Root cause investigation |

### Analytics & AI
| Page | Route | Description |
|------|-------|-------------|
| `Analytics` | `/analytics` | General analytics dashboard |
| `RetentionAnalytics` | `/retention-analytics` | User retention, cohorts, churn prediction |
| `PredictiveSafetyAI` | `/predictive-safety` | AI-powered safety predictions |
| `IncidentTrendAnalytics` | `/incident-trends` | Historical incident trends |
| `IncidentHeatmap` | `/incident-heatmap` | Geographic incident visualization |

### Tools & Settings
| Page | Route | Description |
|------|-------|-------------|
| `EmailNotificationSystem` | `/email-notifications` | Email templates, automations, campaigns |
| `NotificationSettings` | `/notifications` | User notification preferences |
| `OrganizationSettings` | `/organization` | Org-level configuration |
| `SelfAdminPlatform` | `/self-admin` | Self-service admin tools |
| `AutomationRuleBuilder` | `/automation-rule-builder` | No-code automation rules |

## Conventions
- All pages are lazy-loaded in `App.tsx` for bundle optimization
- Each page includes `NavigationBar` and `BottomTabNavigation`
- Pages use Framer Motion `motion.div` for entrance animations
- Mock data sourced from `src/data/` until backend is connected
