import { Hono } from "hono";
import { cors } from "hono/cors";
import { aiRoutes } from "./routes/ai";
import { notificationRoutes } from "./routes/notifications";
import { safetyRoutes } from "./routes/safety";
import { dashboardRoutes } from "./routes/dashboard";
import { incidentRoutes } from "./routes/incidents";
import { investigationRoutes } from "./routes/investigations";
import { capaRoutes } from "./routes/capa";
import { trainingRoutes } from "./routes/training";
import { riskRoutes } from "./routes/risks";
import { auditRoutes } from "./routes/audits";
import { inspectionRoutes } from "./routes/inspections";
import { analyticsRoutes } from "./routes/analytics";
import { projectRoutes } from "./routes/projects";
import { charterRoutes } from "./routes/charter";
import { closureRoutes } from "./routes/closure";
import { releasesRoutes } from "./routes/releases";
import { assetRoutes } from "./routes/assets";
import { workerRoutes } from "./routes/workers";
import { supervisorRoutes } from "./routes/supervisor";
import { automationRoutes } from "./routes/automation";
import { esgRoutes } from "./routes/esg";
import { qualityRoutes } from "./routes/quality";
import { hygieneRoutes } from "./routes/hygiene";
import { contractorRoutes } from "./routes/contractors";
import { complianceProceduresRoutes } from "./routes/compliance-procedures";
import { regulationsRoutes } from "./routes/regulations";
import { chemicalsRoutes } from "./routes/chemicals";
import { toolboxRoutes } from "./routes/toolbox";
import { certificationsRoutes } from "./routes/certifications";
import { complianceCalendarRoutes } from "./routes/compliance-calendar";
import { standardsRoutes } from "./routes/standards";
import { crossReferenceRoutes } from "./routes/cross-reference";
import { complianceReportingRoutes } from "./routes/compliance-reporting";
import { behaviorSafetyRoutes } from "./routes/behavior-safety";
import { bowTieRoutes } from "./routes/bow-tie";
import { standardCertificationsRoutes } from "./routes/standard-certifications";
import { customChecklistsRoutes } from "./routes/custom-checklists";
import { contractorPermitAppsRoutes } from "./routes/contractor-permit-apps";
import { permitToWorkRoutes } from "./routes/permit-to-work";
import { hazardReportsRoutes } from "./routes/hazard-reports";
import { safetyProceduresRoutes } from "./routes/safety-procedures";
import { kpiRoutes } from "./routes/kpi";
import { landingRoutes } from "./routes/landing";
import { userPreferencesRoutes } from "./routes/user-preferences";
import { authRoutes } from "./routes/auth";
import { sdsRoutes } from "./routes/sds";
import { geotagRoutes } from "./routes/geotags";
import { customAppsRoutes } from "./routes/custom-apps";
import { customReportsRoutes } from "./routes/custom-reports";
import { dataSecurityRoutes } from "./routes/data-security";
import { emailNotificationRoutes } from "./routes/email-notifications";
import { complianceFrameworksRoutes } from "./routes/compliance-frameworks";
import { jsaRoutes } from "./routes/jsa";
import { hypercareRoutes } from "./routes/hypercare";
import { heatmapRoutes } from "./routes/heatmap";
import { incidentAnalyticsRoutes } from "./routes/incident-analytics";
import { sensorRoutes } from "./routes/sensors";
import { mobileSyncRoutes } from "./routes/mobile-sync";
import { workerAppRoutes } from "./routes/worker-app";
import { nearMissReportRoutes } from "./routes/near-miss-reports";
import { vehicleIncidentsRoutes } from "./routes/vehicle-incidents";
import { formConfiguratorRoutes } from "./routes/form-configurator";
import { organizationSettingsRoutes } from "./routes/organization-settings";
import { pilotProgramRoutes } from "./routes/pilot-program";
import { predictiveSafetyRoutes } from "./routes/predictive-safety";
import { ZodError } from "zod";

export async function createApp(edgespark: any): Promise<Hono> {
  const app = new Hono();

  // ── CORS MIDDLEWARE ────────────────────────────────────────────────────────
  app.use('*', cors({
    origin: (origin) => {
      const extraOrigin = process.env.FRONTEND_URL;
      const allowed = [
        'http://localhost:5173',
        'http://localhost:4173',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:4173',
        'http://localhost:3000',
        ...(extraOrigin ? [extraOrigin] : []),
      ];
      if (!origin || allowed.includes(origin) || origin.endsWith('.youware.com') || origin.endsWith('.railway.app') || origin.endsWith('.vercel.app') || origin.endsWith('.netlify.app')) {
        return origin || '*';
      }
      return allowed[0];
    },
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Request-ID', 'X-Tenant-ID'],
    exposeHeaders: ['X-Total-Count', 'X-Request-ID'],
    maxAge: 86400,
    credentials: true,
  }));

  // ── RATE LIMITING (simple in-memory) ─────────────────────────────────────
  const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
  app.use('*', async (c, next) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || 'unknown';
    const path = c.req.path;

    // Stricter limit for auth endpoints
    const isAuthPath = path.startsWith('/api/auth/login') || path.startsWith('/api/auth/register');
    const limit = isAuthPath ? 10 : 200;
    const windowMs = isAuthPath ? 60_000 : 60_000; // 1 minute

    const key = `${ip}:${isAuthPath ? 'auth' : 'api'}`;
    const now = Date.now();
    const entry = rateLimitMap.get(key);

    if (!entry || entry.resetAt < now) {
      rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    } else {
      entry.count++;
      if (entry.count > limit) {
        return c.json({ success: false, error: 'Rate limit exceeded. Try again later.' }, 429);
      }
    }

    // Cleanup old entries periodically
    if (rateLimitMap.size > 10000) {
      const cutoff = Date.now();
      for (const [k, v] of rateLimitMap.entries()) {
        if (v.resetAt < cutoff) rateLimitMap.delete(k);
      }
    }

    await next();
  });

  // ── REQUEST ID ────────────────────────────────────────────────────────────
  app.use('*', async (c, next) => {
    const requestId = Math.random().toString(36).slice(2, 10);
    c.header('X-Request-ID', requestId);
    await next();
  });

  // 1. Global Error Handler (The Safety Net)
  app.onError((err, c) => {
    console.error("System Error Catch:", err);
    if (err instanceof ZodError) {
      return c.json({ success: false, error: 'Validation Failed', issues: err.issues }, 400);
    }
    return c.json({ success: false, error: 'Internal Server Error', message: err.message }, 500);
  });

  // Root endpoint
  app.get('/', (c) => {
    return c.json({
      message: 'SafetyMEG Backend API',
      version: '2.0.0',
      auth: '/api/auth/*',
      endpoints: {
        health: '/api/public/health',
        auth: '/api/auth/*',
        dashboard: '/api/dashboard/*',
        incidents: '/api/incidents/*',
        investigations: '/api/investigations/*',
        capa: '/api/capa/*',
        controls: '/api/controls/*',
        training: '/api/training/*',
        risks: '/api/risks/*',
        audits: '/api/audits/*',
        compliance: '/api/compliance/*',
        inspections: '/api/inspections/*',
        analytics: '/api/analytics/*',
        reports: '/api/reports/*',
        ai: '/api/ai/*',
        notifications: '/api/notifications/*',
        safety: '/api/safety/*',
        workers: '/api/workers/*',
        projects: '/api/projects/*',
        assets: '/api/assets/*',
        certifications: '/api/certifications/*',
        chemicals: '/api/chemicals/*',
        regulations: '/api/regulations/*',
        standards: '/api/standards/*',
        esg: '/api/esg/*',
        kpi: '/api/kpi/*',
        supervisors: '/api/supervisor/*',
        contractors: '/api/contractors/*',
        toolbox: '/api/toolbox-talks/*',
        bbs: '/api/bbs/*',
        ptw: '/api/ptw/*',
        hygiene: '/api/hygiene/*',
        quality: '/api/quality/*',
      }
    });
  });

  // Health check
  app.get('/api/public/health', (c) => {
    return c.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      platform: 'SafetyMEG',
      version: '2.0.0',
      features: ['auth', 'rbac', 'cors', 'rate-limiting', 'ehs-modules']
    });
  });

  // Register modular routes
  authRoutes(app);
  dashboardRoutes(app);
  incidentRoutes(app);
  investigationRoutes(app);
  capaRoutes(app);
  trainingRoutes(app);
  riskRoutes(app);
  auditRoutes(app);
  inspectionRoutes(app);
  analyticsRoutes(app);
  projectRoutes(app);
  charterRoutes(app);
  closureRoutes(app);
  releasesRoutes(app);
  assetRoutes(app);
  workerRoutes(app);
  supervisorRoutes(app);
  automationRoutes(app);
  esgRoutes(app);
  qualityRoutes(app);
  hygieneRoutes(app);
  contractorRoutes(app);
  contractorPermitAppsRoutes(app);
  complianceProceduresRoutes(app);
  regulationsRoutes(app);
  chemicalsRoutes(app);
  toolboxRoutes(app);
  certificationsRoutes(app);
  complianceCalendarRoutes(app);
  standardsRoutes(app);
  crossReferenceRoutes(app);
  complianceReportingRoutes(app);
  behaviorSafetyRoutes(app);
  bowTieRoutes(app);
  standardCertificationsRoutes(app);
  customChecklistsRoutes(app);
  permitToWorkRoutes(app);
  hazardReportsRoutes(app);
  safetyProceduresRoutes(app);
  kpiRoutes(app);
  landingRoutes(app);
  userPreferencesRoutes(app);
  aiRoutes(app, edgespark);
  notificationRoutes(app, edgespark);
  safetyRoutes(app, edgespark);
  sdsRoutes(app);
  geotagRoutes(app);
  customAppsRoutes(app);
  customReportsRoutes(app);
  dataSecurityRoutes(app);
  emailNotificationRoutes(app);
  complianceFrameworksRoutes(app);
  jsaRoutes(app);
  hypercareRoutes(app);
  heatmapRoutes(app);
  incidentAnalyticsRoutes(app);
  sensorRoutes(app);
  mobileSyncRoutes(app);
  workerAppRoutes(app);
  nearMissReportRoutes(app);
  vehicleIncidentsRoutes(app);
  formConfiguratorRoutes(app);
  organizationSettingsRoutes(app);
  pilotProgramRoutes(app);
  predictiveSafetyRoutes(app);

  return app;
}