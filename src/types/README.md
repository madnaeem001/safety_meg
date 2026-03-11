# TypeScript Types Directory

Centralized type definitions for the SafetyPro EHS platform.

## Planned Type Modules

### Core Domain Types
- **`incident.ts`** – Incident, InjuryReport, VehicleIncident, PropertyIncident, NearMiss, InvestigationReport
- **`compliance.ts`** – Regulation, ComplianceGap, Certification, AuditResult, PermitToWork
- **`risk.ts`** – RiskAssessment, RiskRegister, HazardAssessment, JSA, SIFPrecursor
- **`training.ts`** – TrainingModule, CertificationTracker, ToolboxTalk, CompetencyMatrix
- **`user.ts`** – User, Role, Permission, Organization, Team
- **`sensor.ts`** – IoTSensor, SensorReading, CalibrationRecord, AlertThreshold

### Feature Types
- **`analytics.ts`** – KPI, RetentionMetric, CohortData, ChurnPrediction, EngagementSegment
- **`notification.ts`** – EmailTemplate, AutomationWorkflow, Campaign, NotificationPreference
- **`onboarding.ts`** – OnboardingStep, WalkthroughProgress, FeatureDiscovery
- **`workflow.ts`** – AutomationRule, WebhookConfig, ApprovalChain, EscalationPolicy

### API Types
- **`api.ts`** – APIResponse, PaginatedResult, ErrorResponse, WebhookPayload
- **`stripe.ts`** – Subscription, Invoice, PaymentMethod, PriceConfig

## Conventions
- Use `interface` for object shapes, `type` for unions/intersections
- Export all types as named exports
- Prefix enum values with the enum name for clarity
- Use discriminated unions for variant types (e.g., incident subtypes)
- Keep types close to their domain; re-export from barrel files
