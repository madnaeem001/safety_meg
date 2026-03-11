# API Integration Layer

This directory contains the frontend integration layer for the SafetyMEG platform.

Current status:

- Phase 1 foundation has started.
- The shared API layer is being aligned to the real backend under `/api/...`.
- The first live slice now focuses on dashboard, incidents, and backend-routed AI assistance.

## Structure

```
api/
├── services/         # API service classes and methods
│   ├── apiService.ts # Core API client with entity services
│   └── index.ts      # Exports
├── hooks/            # React hooks for data fetching
│   ├── useAPIHooks.ts # Custom hooks for API operations
│   └── index.ts       # Exports
└── README.md         # This file
```

## Usage

### Current Backend Contract
This project already includes a local Hono backend under `backend/src`.

Do not assume `/api/v1` routes.

Current frontend integration should target the real backend route surface under `/api/...`.

### Using API Hooks

```typescript
import { useIncidents, useCreateIncident, useESGMetrics } from '@/api/hooks';

// Fetch incidents
const { data: incidents, loading, error, refetch } = useIncidents({
  status: 'open',
  type: 'incident'
});

// Create incident
const { mutate: createIncident, loading: creating } = useCreateIncident();
await createIncident({ title: 'New incident', severity: 'high' });

// Dashboard overview
const { data: overview } = useDashboardOverview();

// Incident creation
const { mutate: createIncident } = useCreateIncident();
```

### API Services

```typescript
import { incidentService, esgService, leadingIndicatorsService } from '@/api/services';

// Direct service calls
const response = await incidentService.getAll({ status: 'open' });
const esgData = await esgService.getMetrics('2026-Q1');
const indicators = await leadingIndicatorsService.getIndicators('month');
```

## Current First-Slice Endpoints

### Dashboard
- `GET /api/dashboard/overview`
- `GET /api/dashboard/incidents`

### Incidents
- `GET /api/incidents` - List incidents
- `GET /api/incidents/:id` - Get incident by ID
- `POST /api/incidents/create` - Create generic incident
- `POST /api/incidents/injury` - Create injury incident
- `POST /api/incidents/vehicle` - Create vehicle incident
- `POST /api/incidents/property` - Create property incident
- `POST /api/incidents/near-miss` - Create near-miss incident
- `PUT /api/incidents/:id` - Update incident
- `POST /api/incidents/:id/close` - Close incident
- `POST /api/incidents/:id/reopen` - Reopen incident

### AI
- `POST /api/ai/suggestions` - Backend-routed AI suggestions with fallback behavior
- `POST /api/ai/chat` - Backend-routed AI chat
- `GET /api/ai/status` - Provider configuration status

## Migration Rule

When integrating a page:

1. Add or update the domain adapter under `src/api/services`.
2. Add or update the hook under `src/api/hooks`.
3. Convert the page from `src/data/*` or browser-only services to the shared API layer.
4. Do not add page-local ad hoc fetch logic unless there is a temporary blocker.

## Future-Proofing Milestones (2026)

### ESG Integration (Target: Late 2026)
- 60-70% of organizations integrating EHS data into ESG reporting
- Direct data pipeline to sustainability reports
- Real-time ESG scorecard

### Predictive Leading Indicators
- Transition from lagging metrics (incident rates) to leading indicators
- Audit closure time tracking
- Training effectiveness scores
- Predictive risk modeling

### User Adoption Features
- Mobile-first interfaces for frontline workers
- Real-time near-miss and hazard logging
- Offline-first data sync
- Push notification integration
