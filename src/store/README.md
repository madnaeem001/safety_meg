# State Management (Store)

This directory houses the application's global state management layer for the SafetyPro EHS platform.

## Architecture

The store follows a modular pattern where each domain has its own state slice:

### Planned State Slices
- **`authStore`** – User session, roles (Admin/Supervisor/Worker), and RBAC permissions
- **`incidentStore`** – Incident reports, investigation data, corrective actions, and status tracking
- **`complianceStore`** – Regulation mappings, gap analysis results, and certification statuses
- **`notificationStore`** – Real-time alerts, email notification preferences, and push notification tokens
- **`analyticsStore`** – Dashboard KPIs, retention metrics, and trend data caching
- **`onboardingStore`** – User walkthrough progress and feature discovery states

## Conventions

- State updates use immutable patterns
- Async operations (API calls) are handled via service layer in `src/services/`
- Components subscribe to only the slices they need to prevent unnecessary re-renders
- Mock data lives in `src/data/` and will be swapped for API calls once the backend is connected

## Integration Points

- **Youbase Backend** – Will replace localStorage and mock data for production persistence
- **Stripe Webhooks** – Subscription status synced to user store
- **Real-Time Sync** – WebSocket events update relevant stores automatically
