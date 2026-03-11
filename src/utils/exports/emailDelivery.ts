/**
 * Email Delivery Service for Safety Reports
 * Handles scheduling and sending weekly safety reports via email
 */

export interface EmailRecipient {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  notifyOn: ('weekly' | 'monthly' | 'critical' | 'summary')[];
}

export interface EmailSchedule {
  id: string;
  reportType: 'weekly_safety' | 'monthly_summary' | 'incident_alert' | 'action_plan' | 'investigation';
  frequency: 'daily' | 'weekly' | 'monthly' | 'on_event';
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
  timeOfDay: string; // HH:mm format
  timezone: string;
  recipients: EmailRecipient[];
  enabled: boolean;
  lastSent?: Date;
  nextScheduled?: Date;
  includeAttachments: boolean;
  attachmentFormat: ('pdf' | 'excel')[];
}

export interface EmailDeliveryLog {
  id: string;
  scheduleId: string;
  sentAt: Date;
  recipients: string[];
  status: 'sent' | 'failed' | 'pending' | 'queued';
  reportType: string;
  errorMessage?: string;
  attachments: string[];
}

// Mock email schedules
export const mockEmailSchedules: EmailSchedule[] = [
  {
    id: 'SCHED-001',
    reportType: 'weekly_safety',
    frequency: 'weekly',
    dayOfWeek: 'monday',
    timeOfDay: '08:00',
    timezone: 'America/Chicago',
    recipients: [
      { id: 'REC-001', name: 'Robert Henderson', email: 'r.henderson@company.com', role: 'Safety Manager', department: 'EHS', notifyOn: ['weekly', 'critical'] },
      { id: 'REC-002', name: 'Sarah Connor', email: 's.connor@company.com', role: 'EHS Director', department: 'EHS', notifyOn: ['weekly', 'summary'] },
      { id: 'REC-003', name: 'Executive Team', email: 'executives@company.com', role: 'Leadership', department: 'Executive', notifyOn: ['weekly'] },
    ],
    enabled: true,
    lastSent: new Date('2026-01-27T08:00:00'),
    nextScheduled: new Date('2026-02-03T08:00:00'),
    includeAttachments: true,
    attachmentFormat: ['pdf', 'excel']
  },
  {
    id: 'SCHED-002',
    reportType: 'monthly_summary',
    frequency: 'monthly',
    dayOfWeek: 'monday',
    timeOfDay: '09:00',
    timezone: 'America/Chicago',
    recipients: [
      { id: 'REC-002', name: 'Sarah Connor', email: 's.connor@company.com', role: 'EHS Director', department: 'EHS', notifyOn: ['weekly', 'monthly'] },
      { id: 'REC-004', name: 'Board Members', email: 'board@company.com', role: 'Board', department: 'Executive', notifyOn: ['monthly'] },
    ],
    enabled: true,
    lastSent: new Date('2026-01-01T09:00:00'),
    nextScheduled: new Date('2026-02-01T09:00:00'),
    includeAttachments: true,
    attachmentFormat: ['pdf']
  },
  {
    id: 'SCHED-003',
    reportType: 'action_plan',
    frequency: 'on_event',
    timeOfDay: '00:00',
    timezone: 'America/Chicago',
    recipients: [
      { id: 'REC-005', name: 'Action Plan Owner', email: 'owner@company.com', role: 'Assigned', department: 'Various', notifyOn: ['critical'] },
    ],
    enabled: true,
    includeAttachments: false,
    attachmentFormat: []
  },
  {
    id: 'SCHED-004',
    reportType: 'investigation',
    frequency: 'on_event',
    timeOfDay: '00:00',
    timezone: 'America/Chicago',
    recipients: [],
    enabled: true,
    includeAttachments: true,
    attachmentFormat: ['pdf']
  }
];

// Mock delivery logs
export const mockDeliveryLogs: EmailDeliveryLog[] = [
  {
    id: 'LOG-001',
    scheduleId: 'SCHED-001',
    sentAt: new Date('2026-01-27T08:00:00'),
    recipients: ['r.henderson@company.com', 's.connor@company.com', 'executives@company.com'],
    status: 'sent',
    reportType: 'Weekly Safety Report',
    attachments: ['Weekly_Safety_Report_2026-01-27.pdf', 'Weekly_Safety_Report_2026-01-27.xlsx']
  },
  {
    id: 'LOG-002',
    scheduleId: 'SCHED-001',
    sentAt: new Date('2026-01-20T08:00:00'),
    recipients: ['r.henderson@company.com', 's.connor@company.com', 'executives@company.com'],
    status: 'sent',
    reportType: 'Weekly Safety Report',
    attachments: ['Weekly_Safety_Report_2026-01-20.pdf', 'Weekly_Safety_Report_2026-01-20.xlsx']
  },
  {
    id: 'LOG-003',
    scheduleId: 'SCHED-002',
    sentAt: new Date('2026-01-01T09:00:00'),
    recipients: ['s.connor@company.com', 'board@company.com'],
    status: 'sent',
    reportType: 'Monthly Safety Summary',
    attachments: ['Monthly_Safety_Summary_2026-01.pdf']
  }
];

// Email template for weekly reports
export const weeklyReportEmailTemplate = (data: {
  companyName: string;
  reportPeriod: { start: string; end: string };
  safetyScore: number;
  incidents: number;
  nearMisses: number;
  openCAPAs: number;
  daysWithoutLTI: number;
  complianceRate: number;
}) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weekly Safety Report - ${data.companyName}</title>
</head>
<body style="margin:0; padding:0; background-color:#f3f4f6; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f3f4f6; padding:40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:16px; overflow:hidden; box-shadow:0 4px 6px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #10b981, #059669); padding:30px 40px; text-align:center;">
              <h1 style="color:#ffffff; margin:0; font-size:28px; font-weight:700;">Weekly Safety Report</h1>
              <p style="color:#d1fae5; margin:10px 0 0; font-size:14px;">${data.reportPeriod.start} - ${data.reportPeriod.end}</p>
            </td>
          </tr>
          
          <!-- Company Info -->
          <tr>
            <td style="padding:30px 40px 20px; border-bottom:1px solid #e5e7eb;">
              <p style="color:#6b7280; margin:0; font-size:14px;">${data.companyName}</p>
            </td>
          </tr>
          
          <!-- Safety Score -->
          <tr>
            <td style="padding:30px 40px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="50%" style="text-align:center; padding:20px; background:linear-gradient(135deg, #10b981, #059669); border-radius:12px;">
                    <p style="color:#d1fae5; margin:0 0 5px; font-size:12px; text-transform:uppercase; letter-spacing:1px;">Safety Score</p>
                    <p style="color:#ffffff; margin:0; font-size:48px; font-weight:700;">${data.safetyScore}%</p>
                  </td>
                  <td width="50%" style="padding-left:20px;">
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="color:#6b7280; margin:0; font-size:12px;">Days Without LTI</p>
                          <p style="color:#1f2937; margin:0; font-size:20px; font-weight:600;">${data.daysWithoutLTI}</p>
                        </td>
                      </tr>
                      <tr>
                        <td style="padding:8px 0;">
                          <p style="color:#6b7280; margin:0; font-size:12px;">Compliance Rate</p>
                          <p style="color:#1f2937; margin:0; font-size:20px; font-weight:600;">${data.complianceRate}%</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Metrics Grid -->
          <tr>
            <td style="padding:0 40px 30px;">
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td width="33%" style="text-align:center; padding:15px; background-color:#fef2f2; border-radius:8px;">
                    <p style="color:#dc2626; margin:0; font-size:24px; font-weight:700;">${data.incidents}</p>
                    <p style="color:#991b1b; margin:5px 0 0; font-size:11px; text-transform:uppercase;">Incidents</p>
                  </td>
                  <td width="10"></td>
                  <td width="33%" style="text-align:center; padding:15px; background-color:#fef3c7; border-radius:8px;">
                    <p style="color:#d97706; margin:0; font-size:24px; font-weight:700;">${data.nearMisses}</p>
                    <p style="color:#92400e; margin:5px 0 0; font-size:11px; text-transform:uppercase;">Near Misses</p>
                  </td>
                  <td width="10"></td>
                  <td width="33%" style="text-align:center; padding:15px; background-color:#dbeafe; border-radius:8px;">
                    <p style="color:#2563eb; margin:0; font-size:24px; font-weight:700;">${data.openCAPAs}</p>
                    <p style="color:#1e40af; margin:5px 0 0; font-size:11px; text-transform:uppercase;">Open CAPAs</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb; padding:20px 40px; text-align:center; border-top:1px solid #e5e7eb;">
              <p style="color:#9ca3af; margin:0; font-size:12px;">This is an automated report from the EHS Safety Management System</p>
              <p style="color:#9ca3af; margin:5px 0 0; font-size:11px;">Please see attached PDF and Excel files for detailed report</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

// Simulate sending email (would integrate with actual email service)
export const sendScheduledReport = async (
  schedule: EmailSchedule,
  reportData: any
): Promise<EmailDeliveryLog> => {
  // Simulate API call delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const log: EmailDeliveryLog = {
    id: `LOG-${Date.now()}`,
    scheduleId: schedule.id,
    sentAt: new Date(),
    recipients: schedule.recipients.map(r => r.email),
    status: 'sent',
    reportType: schedule.reportType === 'weekly_safety' ? 'Weekly Safety Report' : 
                schedule.reportType === 'monthly_summary' ? 'Monthly Safety Summary' :
                schedule.reportType === 'action_plan' ? 'Action Plan Assignment' :
                'Investigation Update',
    attachments: schedule.includeAttachments 
      ? schedule.attachmentFormat.map(fmt => 
          `${schedule.reportType}_${new Date().toISOString().split('T')[0]}.${fmt}`)
      : []
  };
  
  return log;
};

// Calculate next scheduled date
export const getNextScheduledDate = (schedule: EmailSchedule): Date => {
  const now = new Date();
  const [hours, minutes] = schedule.timeOfDay.split(':').map(Number);
  
  if (schedule.frequency === 'daily') {
    const next = new Date(now);
    next.setHours(hours, minutes, 0, 0);
    if (next <= now) {
      next.setDate(next.getDate() + 1);
    }
    return next;
  }
  
  if (schedule.frequency === 'weekly' && schedule.dayOfWeek) {
    const dayMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
      thursday: 4, friday: 5, saturday: 6
    };
    const targetDay = dayMap[schedule.dayOfWeek];
    const next = new Date(now);
    const currentDay = next.getDay();
    const daysUntilTarget = (targetDay - currentDay + 7) % 7 || 7;
    next.setDate(next.getDate() + daysUntilTarget);
    next.setHours(hours, minutes, 0, 0);
    return next;
  }
  
  if (schedule.frequency === 'monthly') {
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1, hours, minutes, 0);
    return next;
  }
  
  return now;
};

// Timezone options for international usage
export const timezoneOptions = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HST)' },
  { value: 'Europe/London', label: 'GMT/BST (London)' },
  { value: 'Europe/Paris', label: 'CET (Paris)' },
  { value: 'Europe/Berlin', label: 'CET (Berlin)' },
  { value: 'Asia/Dubai', label: 'Gulf Standard Time' },
  { value: 'Asia/Singapore', label: 'Singapore Time' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time' },
  { value: 'Australia/Sydney', label: 'Australian Eastern' },
  { value: 'UTC', label: 'UTC (Coordinated Universal Time)' },
];
