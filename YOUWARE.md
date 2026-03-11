# Project Architecture & Conventions

## Navigation Structure
- **Centralized Navigation**: `src/components/dashboard/NavigationBar.tsx` exports `NAV_SECTIONS` which serves as the single source of truth for application navigation.
- **Feature Grid**: `src/components/dashboard/FeatureGrid.tsx` consumes `NAV_SECTIONS` to display a quick-access grid on the Dashboard.
- **Categories**:
  - Overview (Dashboard, Safety Hub, Command Center, Project Mgmt)
  - Incidents & Reporting
  - Risk & Compliance
  - Environmental (ESG)
  - Analytics & AI
  - Tools & Settings

## Project Management Module
- **Lifecycle Approach**: The project management module (`src/pages/JiraBoard.tsx`) implements a full "Start to Finish" lifecycle:
  - **Initiation**: Project Charter, Stakeholders, Goals (`src/components/agile/ProjectCharter.tsx`)
  - **Planning**: Roadmap, Backlog, Sprint Planning, Capacity
  - **Execution**: Kanban Board, RFIs, Dependencies
  - **Monitoring**: Burndown, Velocity, Risk AI, Health
  - **Closure**: Retrospective, Final Report, Archival (`src/components/agile/ProjectClosure.tsx`)
- **Modular Components**: Agile components are located in `src/components/agile/`.

## Dashboard Layout
- **Hero Section**: KPI background with greeting.
- **Feature Grid**: Quick access to all major application modules.
- **Widgets**: Compliance Alerts, Incident List, etc.

## Tech Stack
- React + Vite
- TypeScript
- Tailwind CSS
- Framer Motion (Animations)
- Lucide React (Icons)

## Design System — Futuristic Theme
- **Primary palette**: Neon cyan (#06b6d4), electric purple (#d424ff), emerald green
- **Background**: Deep space dark (slate-950 to slate-900 gradients)
- **Effects**: Glassmorphism, cyber grid overlays, scan-line animations, neon glow shadows, holographic shimmer, prismatic borders, data rain, orb floating
- **Holographic Animations**: `holo-shimmer`, `prismatic-glow`, `data-rain`, `scan-horizontal`, `holo-text`, `pulse-ring`, `orb-float`
- **CSS Utilities**: `.holo-card`, `.holo-shimmer`, `.prismatic-border`, `.text-neon-cyan`, `.text-neon-purple`, `.text-holographic`, `.cyber-grid-bg`
- **Typography**: Space Grotesk for headings, DM Sans for body, JetBrains Mono for data/mono
- **Cards**: Dark glass surfaces with cyan border highlights and backdrop blur
- **Default theme**: Dark mode (futuristic)
- **AI Sync**: All 8 AI engines (Visual Audit, Risk Engine, Compliance AI, Predictive, NLP Engine, IoT Neural, Behavioral AI, Ergo Engine) are visually synced across the dashboard with real-time status indicators

## EHS Feature Coverage
- **Core**: Incident Reporting, Risk Assessment, Safety Audit, Compliance Management
- **AI-Powered**: Predictive Safety AI, Visual Audit AI, NLP Engine, Behavioral Analytics, Ergonomics AI
- **Environmental**: ESG Reporting, Emission Tracking, SWPPP Compliance, Storm Water Checklists
- **Specialized**: Emergency Response, Lockout/Tagout (LOTO), Confined Space Permits, Permit-to-Work, Contractor Management
- **Training**: AI Training Studio, Certification Tracker, Toolbox Talks
- **IoT**: Sensor Dashboard, Calibration, Configuration
- **Project Management**: Full Jira-like board with AI Workflows tab (8 AI workflow stages)

## Self-Admin Platform
- **Route**: `/self-admin`
- **Component**: `src/pages/SelfAdminPlatform.tsx`
- **Purpose**: Unified hub for self-deployment, self-administration, and self-configuration
- **Tabs**: Overview, Self-Configuration, Real-Time Insights, App Builder
- **Links to**: Form Configurator, Automation Rule Builder, Custom Report Builder, Checklist Builder, Notifications, App Builder
- **Navigation**: Added to "Tools & Settings" section in NavigationBar

## Custom App Builder
- **Route**: `/app-builder`
- **Component**: `src/pages/CustomAppBuilder.tsx`
- **Purpose**: Visual drag-and-drop interface for building purpose-built safety apps
- **Features**: Component library, device preview (mobile/tablet/desktop), layer management, property editing, AI generation placeholder

## Branding
- **Logo**: `src/assets/logo.png` is used across all major pages (Dashboard, Landing Page, AI Assistant, App Builder, Report Dashboard, Training Management).
- **Name**: Standardized as **SafetyMEG**.

## AI Capabilities
- **AISafetyAssistant**: Intelligent chat assistant with **AI Voice Recognition** and **AI Image Hazard Detection**, powered by a centralized `aiService`.
- **AI Visual Audit Hub**: Centralized command center for all AI-powered visual safety inspections, monitoring, and analysis.
- **AI Visual Audit Tool**: Dedicated tool for uploading photos and videos to scan for hazards in environments, employees (PPE), machinery, and **Robotics Safety**. Features **Robust Error Handling**, **Predictive Failure Analysis**, **Voice Annotations**, and **Multi-Standard Compliance Sync** (OSHA, EPA, NIOSH, ISO, ILO, NCR, SDS, ASME, API, ANSI/RIA, **NFPA 70E**, **EU Machinery Directive 2006/42/EC**).
- **Robotics Safety Audit**: Specialized AI visual audit covering **ANSI/RIA R15.06-2012**, **ISO 10218-1 & 10218-2**, **ISO/TS 15066**, **OSHA General Duty Clause**, and **UL 3100** standards. Includes **Cobot Force Limit Analysis**, **Risk Assessment** verification, and a dedicated **Robotics Compliance Standards** view.
- **AI Engine Power Up**: Interactive startup sequence for the AI Visual Audit engine, ensuring all vision models are fully initialized before analysis. Supports **Automatic Power Up** when launching specialized audits like Robotics Safety.
- **Global Compliance Sync**: Real-time synchronization of safety standards across international frameworks (OSHA, ISO, EPA, NIOSH, ILO).
- **Enterprise Security & Integration**:
  - **Security Protection**: End-to-End Encryption, Multi-Factor Authentication, Secure Audit Trails, and Access Control Monitoring.
  - **Integration Ready**: REST API, Webhooks, IoT Hub, and Cloud Sync for seamless EHS ecosystem connectivity.
  - **Branding**: Standardized **SafetyMEG** logo and identity across all application modules.
- **Asset Intelligence Scanner**: Multi-mode scanner supporting **QR Codes**, **Barcodes**, and **AI Photo Identification**. Fully synchronized with **SDS Library**, **NCR History**, and international regulatory standards.
- **Enterprise Scalability**: The AI Visual Audit engine is optimized for **500+ concurrent users** with:
  - **Distributed AI Processing**: Simulated batch analysis of up to 500 assets simultaneously.
  - **Live Multi-Cam Monitoring**: Real-time HUD for facility-wide safety surveillance.
  - **Team Activity Feed**: Live synchronization of safety audits across the organization.
  - **Robust Error Boundaries**: Graceful handling of media loading failures, missing imports, and runtime exceptions in both Hub and Tool pages.
  - **AI Engine Power Up**: Interactive startup sequence ensuring all vision models are fully initialized before analysis. Supports **Automatic Power Up** when launching specialized audits like Robotics Safety.
- **Predictive Safety AI**: Advanced risk forecasting with "AI Risk Digester" and **Live Risk Trend Charts** for deep analysis and smart recommendations.
- **AI Risk Forecast Widget**: Dashboard widget providing a 7-day predictive risk outlook and top threat identification.
- **AI Report Engine**: Automated generation of executive summaries and compliance reports from platform data.
- **AI Training Studio**: Custom safety training module generator with lessons, quizzes, and learning resources.
- **AI App Generator**: Build purpose-built safety apps from natural language descriptions in the Custom App Builder.
- **AI JSA Analysis**: "AI Suggest" and Image-based Hazard Detection in the JSA Builder.

## Automation & Auto-Pilot
- **Safety Auto-Pilot**: Dashboard widget displaying real-time automated actions taken by the system.
- **AI-Powered Automation**: Advanced triggers (AI Risk Detected, Training Gap Identified) and actions (Generate AI Training, Generate AI Summary) in the Automation Rule Builder.

## Backend Architecture
- **Framework**: Hono with modularized routes in `backend/src/routes/`.
- **Routes**:
  - `ai.ts`: AI chat, suggestions, and status.
  - `notifications.ts`: Email notification handling via Resend.
  - `safety.ts`: Incident reporting and management.
- **Database**: Drizzle ORM (ready for Youbase integration).
- **Branding**: Standardized as **SafetyMEG** across all API responses and emails.
- **Documentation**: Detailed endpoint and integration guide in `backend/AGENTS.md`.

## Performance Optimizations
- **Lazy Loading**: All major pages are lazy-loaded in `App.tsx`.
- **Memoization**: Key dashboard components use `React.memo` for efficient rendering.
- **Asset Management**: Optimized asset paths and build configuration.

## Build & Deploy
- Build Command: `npm run build`
- Output Dir: `dist/`
- **Lazy Loading**: All major pages are lazy-loaded in `App.tsx`.
- **Memoization**: Key dashboard components use `React.memo` for efficient rendering.
- **Asset Management**: Optimized asset paths and build configuration.

## Photo Upload System
- **Reusable Component**: `src/components/safety/PhotoUpload.tsx` — drag-drop, multi-file, camera capture, AI hazard analysis
- **Integrated Into**: SafetyManagementHub (incidents, compliance, analytics, tools tabs), SafetyAudit (photo evidence tab), AIVisualAuditHub, ProjectManagement (photo docs tab), InjuryReport, SafetyProcedures, EmissionReports
- **AI Features**: Auto-hazard detection, confidence scoring, tag generation, batch AI scan

## AI Malware & Security Breach Detection
- **Component**: `src/components/safety/AIMalwareSecurity.tsx`
- **Tabs**: Security Overview, Threat Feed, AI Engines (8 security AI models), Worldwide, Security Compliance
- **Integrated Into**: SafetyManagementHub (analytics > AI Security, tools > Malware Security), SafetyAudit (AI Security tab), AIVisualAuditHub, ProjectManagement (AI Security tab)
- **Security AI Engines**: Threat Intelligence AI, Behavioral Analytics, Network Anomaly Detector, Malware Sandboxer, Phishing Classifier, Zero-Day Predictor, OT/SCADA Guardian, Crypto Ransomware Sentinel
- **Compliance Frameworks**: NIST CSF 2.0, ISO 27001, SOC 2 Type II, GDPR, HIPAA, IEC 62443, PCI DSS 4.0, CMMC Level 3

## Worldwide AI Sync
- **SafetyAudit**: Worldwide Sync tab with 6 regional compliance zones, standards tracking, real-time sync status
- **AIVisualAuditHub**: Worldwide AI Safety Sync dashboard with 7-region coverage, sync latency, threat landscape
- **Coverage**: 194 countries, 2,847+ standards tracked, <30ms sync latency

## Enhanced Project Management
- **New Tabs**: AI Task Analysis (sprint risk forecast, resource optimization, dependency alerts), AI Security, Photo Docs
- **AI Task Intelligence**: Bottleneck detection, auto-assignment, risk predictions, compliance blockers, velocity anomaly detection
- **AI Resource Planning**: Team utilization tracking, AI-powered load balancing, capacity forecasting, allocation optimization with per-person cards and skill matrices
- **AI Risk Matrix**: 5×5 probability vs. impact matrix with AI-scored risks, full risk register with AI predictions, mitigation tracking, and risk categories (Technical, Security, Process, People)
- **AI Dependency Analyzer**: Cross-team dependency chains, critical path analysis, blocker detection, health scores, and AI optimization recommendations

## Real-Time Threat Alerts
- **Component**: `src/components/safety/RealTimeThreatAlerts.tsx`
- **Features**: Live alert simulation (8s intervals), MITRE ATT&CK mapping, severity filtering (critical/high/medium/low/info), expandable alert details, TTD/TTR metrics, AI confidence scores, affected systems tracking
- **Alert Types**: Malware, intrusion, phishing, ransomware, DDoS, zero-day, insider threat, data exfiltration, brute-force, supply-chain, APT, cryptojacking
- **Integrated Into**: SafetyManagementHub (tools > Threat Alert Center), SafetyAudit (Threat Alerts tab)

## Security Incident Response
- **Component**: `src/components/safety/SecurityIncidentResponse.tsx`
- **Features**: 6 playbooks (Ransomware, Data Breach, OT/SCADA, Phishing, DDoS, Insider Threat), 5 tabbed views (Active Incidents, Playbooks, Forensics, Communications, IR Metrics), forensic tools, communication templates
- **Framework**: NIST 800-61 aligned with 4-5 phases per playbook, detailed actions, tools, and assignees
- **Integrated Into**: SafetyManagementHub (tools > Incident Response), SafetyAudit (Incident Response tab)

## AI Audit Templates (Expanded)
- **24+ Templates**: Safety Observation, ISO 45001, OSHA Construction, OSHA General Industry, ASME B30.5, API RP 54, Cal/OSHA Title 8, BSEE Offshore, ANSI Z10, NFPA Fire/Electrical, EU Framework Directive, MSHA Mining, IMO/SOLAS Maritime, IATA/ICAO Aviation, WHO/JCI Healthcare, HACCP/FDA Food Safety, DOT/FMCSA Transportation, CSA Z1000, AS/NZS ISO 45001, NEBOSH/UK HSE, GCC/OSHAD, OSHA PSM, IEC 62443 OT Cybersecurity, ISO 14001 Environmental
- **Expanded Questions**: Templates now have 5-10 questions each (up from 3 for some)

## AI Training Modules
- **Route**: `/ai-training`
- **Component**: `src/pages/AITrainingModules.tsx`
- **Tabs**: Training Modules (6 AI-powered courses with progress tracking), Learning Paths (3 structured paths), AI Competency Map (skill radar), AI Course Generator (natural language course creation)
- **Modules**: AI Safety Fundamentals, Machine Learning for Hazard Detection, NLP for Incident Reports, Computer Vision Safety Audits, Predictive Analytics for Risk, AI Ethics & Governance
- **Navigation**: Added to "Analytics & AI" section in NavigationBar

## Compliance Calendar
- **Route**: `/compliance-calendar`
- **Component**: `src/pages/ComplianceCalendar.tsx`
- **Features**: Interactive month calendar with 12+ compliance events, type filters (audit/certification/inspection/training/regulatory/renewal), day-click event details, color-coded event types
- **Navigation**: Added to "Risk & Compliance" section in NavigationBar

## Feedback Widget
- **Component**: `src/components/widgets/FeedbackWidget.tsx`
- **Features**: Floating feedback button (fixed bottom-right), 3 feedback modes (Bug Report, Feature Request, General Feedback), star rating system, globally mounted in App.tsx
- **Purpose**: Post-launch user feedback collection for bug reports and feature requests

## Enhanced Dashboard Analytics
- **Business Metrics**: MRR ($124.8K), CAC ($48.20), LTV ($2,840), Churn Rate (2.1%) with trend indicators
- **Conversion Funnel**: 5-stage funnel (Visitors → Sign-ups → Onboarded → Active → Paid) with animated progress bars
- **System Health Monitor**: 6 monitored services (API Gateway, Database Cluster, AI Processing, CDN/Edge, Auth Service, IoT Ingestion) with uptime, latency, and status indicators
- **Live Monitoring**: Real-time service health with degraded/healthy status, uptime percentages, latency metrics

## Onboarding Walkthrough
- **Component**: `src/components/widgets/OnboardingWalkthrough.tsx`
- **Features**: 8-step guided walkthrough modal (Welcome, Dashboard Overview, Incident Reporting, Risk & Compliance, Analytics & AI, Training, Mobile, Get Started), progress dots, skip/back/next buttons, auto-shows on first visit via localStorage flag
- **Integration**: Globally mounted in `App.tsx` alongside FeedbackWidget, renders as fixed z-[9999] overlay

## Retention Analytics
- **Route**: `/retention-analytics`
- **Component**: `src/pages/RetentionAnalytics.tsx`
- **Features**: 5 tabs (Overview, Cohort Analysis, Churn Intelligence, Engagement Segments, Retention Actions), 6 KPI cards (MAU, retention rate, churn, NPS, session duration, feature adoption), 30-day retention curve, cohort table with color-coded percentages, churn reasons bar chart, AI churn prediction, engagement segment breakdown, retention strategy cards
- **Navigation**: Added to "Analytics & AI" section in NavigationBar

## Email Notification System
- **Route**: `/email-notifications`
- **Component**: `src/pages/EmailNotificationSystem.tsx`
- **Features**: 4 tabs (Dashboard, Templates, Automations, Campaign Builder), 8 email templates with open/click rates, 6 automation workflows with trigger/action configuration, campaign builder with audience segmentation, real-time activity feed
- **Navigation**: Added to "Tools & Settings" section in NavigationBar

## Enhanced Documentation
- Detailed README files for all source directories (store, styles, types, layouts, components, pages) with architecture decisions, planned modules, conventions, and integration points

## Landing Page Improvements
- **Hero Rewrite**: Focus on user pain points — "Stop Losing Workers to Preventable Incidents"
- **Messaging Strategy**: Problem-first approach targeting safety managers, emphasizing real outcomes over features

## Pilot & Feedback Loop
- **Route**: `/pilot-program`
- **Component**: `src/pages/PilotProgram.tsx`
- **Features**: 5 tabs (Overview, Beta Groups, Field Shadowing, User Feedback, Pilot Report). Beta group management with 30-day pilot tracker per site/department, field shadowing log for observing workers in the field (timestamps, observer, findings, UX issues), in-app feedback stream aggregation, pilot report generator with go/no-go recommendation and readiness scores.
- **Accent**: Amber/orange
- **Navigation**: Added to "Tools & Settings" in NavigationBar

## Data Security Hub
- **Route**: `/data-security`
- **Component**: `src/pages/DataSecurityHub.tsx`
- **Features**: 4 tabs (Overview, SSO Integration, Access Control, Audit Trail). SSO integration status for Okta, Azure AD, Google Workspace, and OneLogin. Role-Based Access Control matrix showing 6 roles (Admin, Safety Manager, Supervisor, Worker, Contractor, HR) × 10 EHS resources with 4 access levels (full, read, own, none). Comprehensive audit trail viewer with search, filter by action type, IP address logging, and field-level change tracking. Designed for ISO 45001 and OSHA recordkeeping compliance.
- **Accent**: Cyan/blue
- **Navigation**: Added to "Tools & Settings" in NavigationBar

## Hyper-Care Training
- **Route**: `/hyper-care-training`
- **Component**: `src/pages/HyperCareTraining.tsx`
- **Features**: 4 tabs (Overview, Toolbox Talk Demos, Safety Champions, QR Deployments). Toolbox talk demo scheduler for 5-minute live demos during safety meetings. Safety Champions directory with per-site designation, training progress, peer support ratings. QR code deployment tracker linking specific inspection forms to physical locations (equipment, entrances) with scan count analytics.
- **Accent**: Emerald/teal
- **Navigation**: Added to "Tools & Settings" in NavigationBar

## Executive Report Dashboard
- **Route**: `/executive-reports`
- **Component**: `src/pages/ExecutiveReportDashboard.tsx`
- **Features**: 4 tabs (Executive Dashboard, Scheduled Reports, Leading Indicators, Site Scorecard). Automated Monday morning PDF report distribution for site managers showing open corrective actions and overdue training. Executive-level KPI dashboard focusing on leading indicators (inspections completed, safety observations, training hours, near-miss reports) vs lagging indicators (TRIR, LTIR, DART, workers' comp claims). Site safety scorecard with risk-level color coding.
- **Accent**: Indigo/purple
- **Navigation**: Added to "Analytics & AI" in NavigationBar

## V2 Roadmap
- **Route**: `/v2-roadmap`
- **Component**: `src/pages/V2Roadmap.tsx`
- **Features**: 4 tabs (Version Roadmap, API Integrations, Offline & Sync, Sync Conflicts). Version-grouped roadmap (v2.0, v2.1) with progress tracking, priority/effort/ETA, and status filtering. API integration hub for HR systems (Workday, ADP, SAP, etc.) with sync health monitoring. Offline sync health dashboard with conflict detection stats. Sync conflict resolution viewer showing side-by-side comparison of conflicting entries with resolve/escalate actions and three resolution strategies (Last Write Wins, Supervisor Merge, Field-Level Merge).
- **Accent**: Violet/fuchsia
- **Navigation**: Added to "Tools & Settings" in NavigationBar

## Build & Deploy
- Build Command: `npm run build`
- Output Dir: `dist/`

## SSO Provider Configuration Service
- **Service**: `src/services/ssoService.ts`
- **Purpose**: Production-grade SSO integration for enterprise identity providers
- **Supported Providers**: Okta, Azure AD, Google Workspace, OneLogin
- **Protocols**: SAML 2.0, OpenID Connect (OIDC)
- **Features**: 
  - Real OIDC endpoint URL patterns for each provider
  - 6 default group mappings: EHS_Admins→admin, Safety_Managers→safety_manager, Supervisors→supervisor, Workers→worker, Contractors→contractor, HR_Team→hr
  - Attribute mapping (email, name, department, role, phone, photo)
  - MFA support (TOTP, SMS, email, push, WebAuthn)
  - JIT (Just-In-Time) provisioning
  - Session and idle timeout configuration
  - Audit trail for all SSO events (login, logout, config changes, MFA challenges)
  - Connection testing and health checks
  - localStorage persistence for configurations

## Automated PDF Reports
- **Route**: `/automated-pdf-reports`
- **Component**: `src/pages/AutomatedPdfReports.tsx`
- **Features**: 4 tabs (Report Templates, Scheduled Reports, Generated Reports, Live Preview). 6 report template categories (Executive, Incident, Compliance, Environmental, Training, Audit). Real jsPDF-based PDF generation with SafetyMEG branding, KPI dashboard, incident trend tables, site scorecards, compliance status, and action items. Report scheduling (daily/weekly/biweekly/monthly/quarterly) with email distribution. Report history with re-generation capability. Live preview of report content before download.
- **PDF Engine**: Uses jsPDF directly — generates real multi-page PDFs with dark-themed header, cyan accent lines, KPI cards, data tables, color-coded status indicators, and confidential footer.
- **Accent**: Cyan/blue
- **Navigation**: Added to "Analytics & AI" in NavigationBar

## Mobile Offline Sync Test
- **Route**: `/offline-sync-test`
- **Component**: `src/pages/MobileOfflineSyncTest.tsx`
- **Features**: 4 tabs (Sync Dashboard, Sync Queue, Conflict Resolution, Test Suite). Simulated online/offline toggle with visual connection status. Sync queue management with IndexedDB-style record display showing entity, action, version, and data payload. Conflict resolution interface with side-by-side comparison of local (mobile) vs server (cloud) versions with Keep Local, Keep Server, and Merge resolution options. 14-test automated test suite covering queue persistence, FIFO order, optimistic UI, conflict detection, last-write-wins, field-level merge, network reconnection, retry backoff, bandwidth throttling, hash integrity, encryption, batch performance, large payload handling, and concurrent sync protection.
- **Architecture Diagram**: Visual representation of sync flow: Mobile App → Sync Engine → SafetyMEG API → Cloud DB
- **Accent**: Cyan/purple
- **Navigation**: Added to "Tools & Settings" in NavigationBar


## Industrial Hygiene Module
- **Route**: `/industrial-hygiene`
- **Component**: `src/pages/IndustrialHygiene.tsx`
- **Features**: 3 tabs (Exposure Assessments, Sampling Plans, Monitoring Data). 8 mock exposure agents covering chemical, physical, biological categories. OEL tracking with status indicators (Below/Near/Above OEL). Sampling plan management with NIOSH/OSHA method references. Real-time monitoring dashboard for air quality, noise dosimetry, thermal environment, and radiation. AI hygiene alerts. Regulatory standards reference (OSHA PELs, NIOSH RELs, ACGIH TLVs, AIHA WEELs).
- **Navigation**: Added to "Risk & Compliance" section in NavigationBar

## Behavior-Based Safety (BBS) Module
- **Route**: `/behavior-based-safety`
- **Component**: `src/pages/BehaviorBasedSafety.tsx`
- **Features**: 3 tabs (Observations, Coaching Log, Leading Indicators). Safe vs at-risk behavior tracking with coaching notes. 8 observation categories (PPE, Body Position, LOTO, Housekeeping, Chemical Handling, Ergonomics, Walking Surfaces). Safety Champions leaderboard. Leading indicators dashboard with trend visualization. AI behavioral pattern detection. Participation rate and coaching effectiveness metrics.
- **Navigation**: Added to "Risk & Compliance" section in NavigationBar

## Route Fixes (Testing Pass)
- `/risk-digester` now correctly routes to `RiskDigester` component (was incorrectly routing to `ComplianceAndProcedures`)
- `/industrial-hygiene` now routes to dedicated `IndustrialHygiene` page (was routing to `RegulationsLibrary`)


## Bow Tie Risk Analysis
- **Route**: `/bowtie-analysis`
- **Component**: `src/pages/BowTieAnalysis.tsx`
- **Features**: 3 tabs (Bow Tie Diagram, Barrier Health, Risk Matrix). Interactive bow tie visualization showing Threats → Preventive Barriers → Top Event → Recovery Barriers → Consequences. 3 mock scenarios (Confined Space, Chemical Spill, Fall from Height). Barrier effectiveness tracking with progress bars. Barrier type classification (engineering, administrative, PPE, procedural). 5×5 risk matrix. KPIs for total scenarios, critical risks, active barriers, degraded barriers.
- **Navigation**: Added to "Risk & Compliance" section in NavigationBar

## Quality Management System
- **Route**: `/quality-management`
- **Component**: `src/pages/QualityManagement.tsx`
- **Features**: 4 tabs (Quality Records, Quality Metrics, Standards, Audit Schedule). NCR, CAPA, Audit Finding, Change Request, Deviation record types. Full record detail with status, priority, assignee, department, standard reference. Quality metrics dashboard with NCR closure rate, CAPA effectiveness, audit conformance, customer complaints. Cost of Quality (CoQ) breakdown. Standards tracker with ISO 9001, ISO 14001, ISO 45001, ISO/IEC 17025, IATF 16949, AS9100D coverage percentages. Audit schedule with internal/external/supplier audit types. AI quality insights.
- **Navigation**: Added to "Risk & Compliance" section in NavigationBar

## SSO Login Flow UI
- **Route**: `/sso-login`
- **Component**: `src/pages/SSOLoginFlow.tsx`
- **Features**: 4 tabs (Identity Providers, Login Activity, SAML/OIDC Config, Security Policies). Azure AD, Okta, Ping Identity, Google Workspace provider management. Real-time authentication event log with success/failed/MFA statuses. Full SAML configuration (Entity ID, ACS URL, SLO URL, Certificate, Name ID Format). OIDC endpoint configuration. Security policies with toggles (MFA, JIT provisioning, Force SSO, IP allowlisting, geo-blocking, brute force protection). Session management with configurable timeout values. Compliance badges (SOC 2, ISO 27001, GDPR, HIPAA). Security alert system for suspicious login activity.
- **Navigation**: Added to "Tools & Settings" section in NavigationBar
