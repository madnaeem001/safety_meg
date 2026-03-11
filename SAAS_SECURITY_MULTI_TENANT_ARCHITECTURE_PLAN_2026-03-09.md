# SaaS Security And Multi-Tenant Architecture Plan

Date: 2026-03-09

## Objective

Move SafetyMEG from a strong single-instance application toward a real SaaS architecture that can safely support multiple organizations, production operations, and future commercial rollout.

## Current Constraints

- auth exists but route protection is not consistently enforced across the backend
- organization exists mostly as a user profile field, not a hard tenant boundary
- SQLite local file storage is serviceable for development and pilot usage, but not ideal for production SaaS scale and operations
- several business workflows still rely on mock data or localStorage persistence
- observability is development-level, not operations-level

## Target Architecture Summary

### Core principles

- every business record belongs to a tenant boundary
- every request resolves an authenticated principal and tenant context
- authorization is enforced server-side on every protected route
- no page-critical data is trusted from the browser alone
- files, AI jobs, notifications, and reports use durable backend-managed infrastructure

### Recommended target stack direction

- API: Hono remains acceptable
- ORM: Drizzle remains acceptable
- primary database for SaaS: PostgreSQL recommended
- object storage: S3-compatible storage for images, documents, exports, SDS files, audit media
- background jobs: queue worker for email, report generation, AI jobs, webhooks, scheduled tasks
- observability: structured logs + metrics + alerting

## Security Plan

## Phase S1: Authentication Hardening

### Required changes

- replace custom SHA-256 password hashing with Argon2id or bcrypt
- remove production fallback JWT secret behavior
- gate seeded default admin creation to development/bootstrap only
- shorten access token lifetime and formalize refresh policy
- add refresh token rotation and revocation visibility
- add login attempt throttling and account lockout rules

### Backend implementation details

- create `password_hash_algo` compatibility strategy if migrating existing users
- add auth config validation on boot: fail startup in production if secrets are missing
- add device/session table if session management is required

## Phase S2: Authorization Hardening

### Required changes

- add auth middleware for all protected route groups
- add RBAC middleware with explicit policy checks
- define role matrix for admin, safety manager, supervisor, worker, contractor, viewer
- ensure mutations check both role and tenant ownership

### Recommended middleware chain

1. request ID middleware
2. auth token validation
3. tenant resolution
4. authorization policy enforcement
5. route handler

## Phase S3: Secrets and Environment Security

### Required changes

- centralize environment variable validation
- split dev/staging/prod config
- require `JWT_SECRET`, AI provider keys, email keys, storage keys, and database URL in production
- document secret rotation procedure

### Recommended rule

- production boot should fail closed if required secrets or endpoints are missing

## Phase S4: API and Transport Security

### Required changes

- standardize security headers at API edge
- tighten CORS to known origins per environment
- expand rate limiting by route category and actor type
- add request body size limits for uploads and AI endpoints
- sanitize and validate file uploads and generated reports

## Multi-Tenant Plan

## Tenant model recommendation

Use organization as the first-class tenant entity.

### Core entities

- `organizations`
- `organization_members`
- `organization_invites`
- `facilities`
- `sites` or `zones` where applicable
- `subscriptions`
- `plans`
- `usage_counters`

### Identity model

- one user may belong to one or multiple organizations if future B2B admin use cases are needed
- permissions should be organization-scoped, not global role-only

Recommended structure:

- `users`
- `organizations`
- `organization_members(user_id, organization_id, role, status)`

## Data model migration strategy

### Step M1: Add tenant boundary columns

For business tables, add `organization_id` as a required foreign key over time.

Examples:

- incidents
- investigations
- capa
- audits
- training
- risks
- assets
- workers
- contractors
- notifications
- automation rules
- webhooks
- ESG records
- quality records
- hygiene assessments
- chemicals
- toolbox talks
- certifications
- compliance data
- projects and related sprint/epic/task entities

### Step M2: Backfill existing records

- create a bootstrap organization for existing single-tenant data
- backfill all existing records to that organization
- verify no orphan records remain

### Step M3: Enforce tenant-aware querying

Every route should filter by resolved `organization_id` unless explicitly public.

### Step M4: Add unique constraints scoped by tenant

Examples:

- unique asset code per organization
- unique worker employee ID per organization
- unique webhook name per organization

## Tenant Resolution Strategy

Preferred order:

1. organization membership from authenticated token/session
2. explicit active organization selection stored server-side or in signed token claims
3. optional `X-Tenant-ID` only as a hint, never as sole trust source

Recommended behavior:

- authenticated user may only access organizations they belong to
- active organization must be validated server-side on each request

## Authorization Policy Model

Policy checks should be explicit, not implied.

Examples:

- `incident.read`
- `incident.create`
- `incident.update`
- `audit.approve`
- `training.assign`
- `organization.manage_members`
- `billing.manage`
- `integration.manage`

Recommended implementation:

- lightweight policy module with route-level guards
- map organization membership role to policy set

## Storage Architecture

### Files and media

Move production artifacts out of browser/local-only patterns.

Use object storage for:

- AI visual audit uploads
- incident photos
- SDS documents
- generated reports
- avatars
- compliance evidence

Recommended pattern:

- backend creates upload intent or signed URL
- client uploads directly to object storage
- backend stores metadata and access policy

## AI Architecture

### Current issue

- some AI experiences still behave like browser-driven tooling rather than durable backend workflows

### Target pattern

- client submits job request to backend
- backend validates auth, tenant, quota, and file references
- backend enqueues AI job
- worker processes AI task
- result stored in database and linked storage objects
- client polls or subscribes for result status

This is especially important for visual audits and larger AI features.

## Notification and Job Architecture

### Move to queue-backed operations

Queue-backed jobs should cover:

- email sending
- retry logic
- scheduled reports
- webhook retries
- AI processing
- reminder notifications

Recommended job states:

- queued
- running
- succeeded
- failed
- dead-lettered

## Billing and Subscription Architecture

### Minimum SaaS billing model

- plans table
- subscriptions table
- organization subscription linkage
- entitlement enforcement middleware
- usage counters for seats, facilities, storage, AI usage, report generation, integrations

### Enforcement points

- UI should hide unavailable features
- backend must still enforce plan restrictions regardless of UI state

## Observability Plan

## Logging

- replace ad hoc console logging with structured JSON logs
- include request ID, user ID, organization ID, route, status, duration

## Metrics

- request latency
- error rate
- queue depth
- AI job duration
- email failure rate
- webhook retry rate
- DB query timing where feasible

## Alerting

- auth failure spikes
- 5xx spikes
- queue dead letters
- storage failures
- AI provider failures
- billing webhook failures

## Deployment Plan

## Environments

- local
- staging
- production

## Release workflow

1. run tests, typecheck, build
2. apply DB migrations
3. deploy API and workers
4. verify health checks
5. monitor post-deploy metrics and logs

## Recommended Health Endpoints

- liveness
- readiness
- DB connectivity
- queue connectivity
- storage availability
- AI provider status summary

## Recommended Implementation Sequence

### Wave 1

- auth hardening
- route protection
- environment validation

### Wave 2

- organization and membership model
- `organization_id` rollout on core tables
- tenant-aware middleware

### Wave 3

- object storage and queue infrastructure
- visual audit backendization
- durable notifications/report jobs

### Wave 4

- billing and subscription enforcement
- organization settings backend
- usage metering

### Wave 5

- observability stack
- backup/recovery procedures
- compliance and audit hardening

## Definition Of SaaS-Ready For This Project

SafetyMEG should only be called SaaS-ready when all of the following are true:

- authenticated routes are protected consistently
- tenant isolation is enforced at the data layer and route layer
- critical workflows no longer rely on mock data or localStorage persistence
- files and media use durable storage
- email/report/AI jobs are durable and retryable
- logs, metrics, and alerts exist for production operations
- plan enforcement and subscription lifecycle are implemented if the product is sold commercially

Until then, it is more accurate to describe the platform as pre-production or pilot-ready, not full SaaS-ready.