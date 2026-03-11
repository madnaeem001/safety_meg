/**
 * Automated Report Scheduler Service
 * Provides automated scheduling and generation of safety reports
 */

export type ReportType = 
  | 'injury-summary'
  | 'incident-summary'
  | 'near-miss-summary'
  | 'investigation-status'
  | 'capa-status'
  | 'epa-compliance'
  | 'nfpa-compliance'
  | 'training-status'
  | 'inspection-summary'
  | 'risk-assessment'
  | 'audit-summary'
  | 'kpi-dashboard'
  | 'environmental-metrics';

export type ReportFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';

export type ReportFormat = 'pdf' | 'excel' | 'html' | 'json';

export type ReportStatus = 'scheduled' | 'generating' | 'completed' | 'failed' | 'cancelled';

export interface ScheduledReport {
  id: string;
  name: string;
  description: string;
  type: ReportType;
  frequency: ReportFrequency;
  format: ReportFormat[];
  recipients: string[];
  nextRunDate: Date;
  lastRunDate?: Date;
  lastRunStatus?: ReportStatus;
  enabled: boolean;
  filters?: ReportFilters;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface ReportFilters {
  dateRange?: { start: string; end: string };
  locations?: string[];
  departments?: string[];
  severity?: string[];
  status?: string[];
  categories?: string[];
}

export interface ReportRun {
  id: string;
  scheduleId: string;
  reportType: ReportType;
  status: ReportStatus;
  startedAt: Date;
  completedAt?: Date;
  outputFiles?: { format: ReportFormat; url: string; size: number }[];
  errorMessage?: string;
  recipientsSent?: string[];
  metadata?: Record<string, any>;
}

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  actions: AutomationAction[];
  enabled: boolean;
  createdAt: Date;
}

export interface AutomationTrigger {
  type: 'incident_created' | 'incident_updated' | 'capa_due' | 'capa_overdue' | 'inspection_completed' | 'threshold_exceeded' | 'schedule';
  conditions?: Record<string, any>;
  schedule?: { cron: string; timezone: string };
}

export interface AutomationAction {
  type: 'generate_report' | 'send_notification' | 'update_status' | 'escalate' | 'assign';
  config: Record<string, any>;
}

// Default scheduled reports
const DEFAULT_SCHEDULED_REPORTS: ScheduledReport[] = [
  {
    id: 'SCH-001',
    name: 'Daily Incident Summary',
    description: 'Daily summary of all incidents, injuries, and near-misses',
    type: 'incident-summary',
    frequency: 'daily',
    format: ['pdf', 'excel'],
    recipients: ['safety-team@company.com', 'management@company.com'],
    nextRunDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-002',
    name: 'Weekly Safety KPI Report',
    description: 'Weekly key performance indicators and safety metrics',
    type: 'kpi-dashboard',
    frequency: 'weekly',
    format: ['pdf'],
    recipients: ['safety-team@company.com', 'executives@company.com'],
    nextRunDate: getNextDayOfWeek(1), // Monday
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-003',
    name: 'Monthly EPA Compliance Report',
    description: 'Monthly environmental compliance metrics and status',
    type: 'epa-compliance',
    frequency: 'monthly',
    format: ['pdf', 'excel'],
    recipients: ['environmental@company.com', 'compliance@company.com'],
    nextRunDate: getFirstDayOfNextMonth(),
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-004',
    name: 'Monthly NFPA Compliance Report',
    description: 'Monthly fire code compliance status and inspections',
    type: 'nfpa-compliance',
    frequency: 'monthly',
    format: ['pdf'],
    recipients: ['fire-safety@company.com', 'facilities@company.com'],
    nextRunDate: getFirstDayOfNextMonth(),
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-005',
    name: 'Weekly CAPA Status Report',
    description: 'Status of all corrective actions including due dates',
    type: 'capa-status',
    frequency: 'weekly',
    format: ['pdf', 'excel'],
    recipients: ['quality@company.com', 'safety-team@company.com'],
    nextRunDate: getNextDayOfWeek(5), // Friday
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-006',
    name: 'Monthly Training Status Report',
    description: 'Training compliance and certification status',
    type: 'training-status',
    frequency: 'monthly',
    format: ['pdf', 'excel'],
    recipients: ['hr@company.com', 'training@company.com'],
    nextRunDate: getFirstDayOfNextMonth(),
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-007',
    name: 'Quarterly Risk Assessment Report',
    description: 'Comprehensive risk assessment summary and trends',
    type: 'risk-assessment',
    frequency: 'quarterly',
    format: ['pdf', 'excel'],
    recipients: ['risk@company.com', 'executives@company.com'],
    nextRunDate: getFirstDayOfNextQuarter(),
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  },
  {
    id: 'SCH-008',
    name: 'Daily Inspection Summary',
    description: 'Summary of all inspections completed today',
    type: 'inspection-summary',
    frequency: 'daily',
    format: ['pdf'],
    recipients: ['inspections@company.com'],
    nextRunDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
    enabled: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    createdBy: 'system'
  }
];

// Default automation rules
const DEFAULT_AUTOMATION_RULES: AutomationRule[] = [
  {
    id: 'RULE-001',
    name: 'Critical Injury Auto-Escalation',
    description: 'Automatically escalate critical injuries to management',
    trigger: {
      type: 'incident_created',
      conditions: { severity: ['critical', 'fatal'], type: 'injury' }
    },
    actions: [
      { type: 'send_notification', config: { recipients: ['management@company.com', 'ceo@company.com'], priority: 'urgent' } },
      { type: 'generate_report', config: { type: 'injury-summary', format: 'pdf' } },
      { type: 'escalate', config: { level: 'executive' } }
    ],
    enabled: true,
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'RULE-002',
    name: 'CAPA Overdue Alert',
    description: 'Send alerts when CAPA items become overdue',
    trigger: {
      type: 'capa_overdue',
      conditions: { daysOverdue: 1 }
    },
    actions: [
      { type: 'send_notification', config: { recipients: ['assignee', 'supervisor'], priority: 'high' } },
      { type: 'escalate', config: { afterDays: 3, level: 'manager' } }
    ],
    enabled: true,
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'RULE-003',
    name: 'Environmental Threshold Alert',
    description: 'Alert when environmental metrics exceed thresholds',
    trigger: {
      type: 'threshold_exceeded',
      conditions: { metrics: ['VOC', 'PM10', 'TSS'], warningPercent: 90 }
    },
    actions: [
      { type: 'send_notification', config: { recipients: ['environmental@company.com'], priority: 'high' } },
      { type: 'generate_report', config: { type: 'environmental-metrics', format: 'pdf' } }
    ],
    enabled: true,
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'RULE-004',
    name: 'Investigation Auto-Assignment',
    description: 'Auto-assign investigators based on incident type',
    trigger: {
      type: 'incident_created',
      conditions: { requiresInvestigation: true }
    },
    actions: [
      { type: 'assign', config: { role: 'lead-investigator', based_on: 'incident_type' } },
      { type: 'send_notification', config: { recipients: ['assigned'], priority: 'normal' } }
    ],
    enabled: true,
    createdAt: new Date('2026-01-01')
  },
  {
    id: 'RULE-005',
    name: 'Weekly Hub Summary Generation',
    description: 'Generate comprehensive hub summaries every week',
    trigger: {
      type: 'schedule',
      schedule: { cron: '0 6 * * 1', timezone: 'America/New_York' } // Monday 6 AM
    },
    actions: [
      { type: 'generate_report', config: { type: 'incident-summary', format: ['pdf', 'excel'] } },
      { type: 'generate_report', config: { type: 'capa-status', format: ['pdf'] } },
      { type: 'generate_report', config: { type: 'kpi-dashboard', format: ['pdf'] } },
      { type: 'send_notification', config: { recipients: ['safety-team@company.com'], includeReports: true } }
    ],
    enabled: true,
    createdAt: new Date('2026-01-01')
  }
];

// Helper functions
function getNextDayOfWeek(dayOfWeek: number): Date {
  const today = new Date();
  const currentDay = today.getDay();
  const daysUntilNext = (dayOfWeek - currentDay + 7) % 7 || 7;
  const nextDate = new Date(today);
  nextDate.setDate(today.getDate() + daysUntilNext);
  nextDate.setHours(6, 0, 0, 0);
  return nextDate;
}

function getFirstDayOfNextMonth(): Date {
  const today = new Date();
  return new Date(today.getFullYear(), today.getMonth() + 1, 1, 6, 0, 0, 0);
}

function getFirstDayOfNextQuarter(): Date {
  const today = new Date();
  const currentQuarter = Math.floor(today.getMonth() / 3);
  const nextQuarterStart = (currentQuarter + 1) * 3;
  return new Date(today.getFullYear(), nextQuarterStart, 1, 6, 0, 0, 0);
}

// Scheduler class
class AutomatedReportScheduler {
  private scheduledReports: ScheduledReport[];
  private automationRules: AutomationRule[];
  private reportRuns: ReportRun[];
  private checkInterval: ReturnType<typeof setInterval> | null;
  private isRunning: boolean;

  constructor() {
    this.scheduledReports = [...DEFAULT_SCHEDULED_REPORTS];
    this.automationRules = [...DEFAULT_AUTOMATION_RULES];
    this.reportRuns = [];
    this.checkInterval = null;
    this.isRunning = false;
  }

  // Start the scheduler
  start(intervalMs: number = 60000): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.checkInterval = setInterval(() => {
      this.checkAndRunDueReports();
    }, intervalMs);
    
    console.log('Automated Report Scheduler started');
  }

  // Stop the scheduler
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    this.isRunning = false;
    console.log('Automated Report Scheduler stopped');
  }

  // Check and run due reports
  private async checkAndRunDueReports(): Promise<void> {
    const now = new Date();
    
    for (const schedule of this.scheduledReports) {
      if (!schedule.enabled) continue;
      if (schedule.nextRunDate <= now) {
        await this.runScheduledReport(schedule);
      }
    }
  }

  // Run a scheduled report
  async runScheduledReport(schedule: ScheduledReport): Promise<ReportRun> {
    const run: ReportRun = {
      id: `RUN-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      scheduleId: schedule.id,
      reportType: schedule.type,
      status: 'generating',
      startedAt: new Date(),
      metadata: { scheduleName: schedule.name }
    };

    this.reportRuns.push(run);

    try {
      // Simulate report generation
      await this.generateReport(schedule, run);
      
      run.status = 'completed';
      run.completedAt = new Date();
      run.recipientsSent = schedule.recipients;
      
      // Update schedule
      schedule.lastRunDate = new Date();
      schedule.lastRunStatus = 'completed';
      schedule.nextRunDate = this.calculateNextRunDate(schedule.frequency, new Date());
      schedule.updatedAt = new Date();
      
    } catch (error) {
      run.status = 'failed';
      run.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      schedule.lastRunStatus = 'failed';
    }

    return run;
  }

  // Generate report (simulated)
  private async generateReport(schedule: ScheduledReport, run: ReportRun): Promise<void> {
    // Simulate generation time
    await new Promise(resolve => setTimeout(resolve, 500));
    
    run.outputFiles = schedule.format.map(format => ({
      format,
      url: `/reports/${schedule.id}/${run.id}.${format}`,
      size: Math.floor(Math.random() * 500000) + 50000
    }));
  }

  // Calculate next run date
  private calculateNextRunDate(frequency: ReportFrequency, from: Date): Date {
    const next = new Date(from);
    
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'annual':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    
    next.setHours(6, 0, 0, 0);
    return next;
  }

  // Trigger automation rule
  async triggerAutomation(trigger: AutomationTrigger['type'], data: Record<string, any>): Promise<void> {
    const matchingRules = this.automationRules.filter(
      rule => rule.enabled && rule.trigger.type === trigger
    );

    for (const rule of matchingRules) {
      if (this.evaluateConditions(rule.trigger.conditions, data)) {
        await this.executeActions(rule.actions, data);
      }
    }
  }

  // Evaluate trigger conditions
  private evaluateConditions(conditions: Record<string, any> | undefined, data: Record<string, any>): boolean {
    if (!conditions) return true;
    
    for (const [key, value] of Object.entries(conditions)) {
      if (Array.isArray(value)) {
        if (!value.includes(data[key])) return false;
      } else if (data[key] !== value) {
        return false;
      }
    }
    
    return true;
  }

  // Execute automation actions
  private async executeActions(actions: AutomationAction[], data: Record<string, any>): Promise<void> {
    for (const action of actions) {
      switch (action.type) {
        case 'generate_report':
          console.log(`Generating ${action.config.type} report`);
          break;
        case 'send_notification':
          console.log(`Sending notification to ${action.config.recipients}`);
          break;
        case 'escalate':
          console.log(`Escalating to ${action.config.level}`);
          break;
        case 'assign':
          console.log(`Assigning to ${action.config.role}`);
          break;
      }
    }
  }

  // CRUD operations for scheduled reports
  getScheduledReports(): ScheduledReport[] {
    return [...this.scheduledReports];
  }

  getScheduledReportById(id: string): ScheduledReport | undefined {
    return this.scheduledReports.find(s => s.id === id);
  }

  addScheduledReport(report: Omit<ScheduledReport, 'id' | 'createdAt' | 'updatedAt'>): ScheduledReport {
    const newReport: ScheduledReport = {
      ...report,
      id: `SCH-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.scheduledReports.push(newReport);
    return newReport;
  }

  updateScheduledReport(id: string, updates: Partial<ScheduledReport>): ScheduledReport | null {
    const index = this.scheduledReports.findIndex(s => s.id === id);
    if (index === -1) return null;
    
    this.scheduledReports[index] = {
      ...this.scheduledReports[index],
      ...updates,
      updatedAt: new Date()
    };
    
    return this.scheduledReports[index];
  }

  deleteScheduledReport(id: string): boolean {
    const index = this.scheduledReports.findIndex(s => s.id === id);
    if (index === -1) return false;
    
    this.scheduledReports.splice(index, 1);
    return true;
  }

  toggleScheduledReport(id: string): boolean {
    const report = this.getScheduledReportById(id);
    if (!report) return false;
    
    report.enabled = !report.enabled;
    report.updatedAt = new Date();
    return true;
  }

  // CRUD operations for automation rules
  getAutomationRules(): AutomationRule[] {
    return [...this.automationRules];
  }

  getAutomationRuleById(id: string): AutomationRule | undefined {
    return this.automationRules.find(r => r.id === id);
  }

  addAutomationRule(rule: Omit<AutomationRule, 'id' | 'createdAt'>): AutomationRule {
    const newRule: AutomationRule = {
      ...rule,
      id: `RULE-${Date.now()}`,
      createdAt: new Date()
    };
    this.automationRules.push(newRule);
    return newRule;
  }

  toggleAutomationRule(id: string): boolean {
    const rule = this.getAutomationRuleById(id);
    if (!rule) return false;
    
    rule.enabled = !rule.enabled;
    return true;
  }

  // Get report runs history
  getReportRuns(scheduleId?: string, limit: number = 50): ReportRun[] {
    let runs = [...this.reportRuns];
    if (scheduleId) {
      runs = runs.filter(r => r.scheduleId === scheduleId);
    }
    return runs.slice(-limit).reverse();
  }

  // Get scheduler status
  getStatus(): { running: boolean; scheduledReports: number; automationRules: number; pendingRuns: number } {
    const now = new Date();
    const pendingRuns = this.scheduledReports.filter(s => s.enabled && s.nextRunDate <= now).length;
    
    return {
      running: this.isRunning,
      scheduledReports: this.scheduledReports.filter(s => s.enabled).length,
      automationRules: this.automationRules.filter(r => r.enabled).length,
      pendingRuns
    };
  }
}

// Singleton instance
export const automatedReportScheduler = new AutomatedReportScheduler();

// React hook
export const useAutomatedReportScheduler = () => {
  return automatedReportScheduler;
};

export default automatedReportScheduler;
