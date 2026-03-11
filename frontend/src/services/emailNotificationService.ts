/**
 * Email Notification Service
 * Provides email notification functionality for safety alerts and reports
 */

import { Notification, NotificationType } from '../components/safety/NotificationService';

export interface EmailNotification {
  id: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  htmlBody?: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'injury' | 'capa' | 'investigation' | 'compliance' | 'training' | 'general';
  attachments?: EmailAttachment[];
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'pending' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'cancelled';
  errorMessage?: string;
  retryCount: number;
  metadata?: Record<string, any>;
}

export interface EmailAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;
  data?: string; // base64
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  htmlBody: string;
  category: EmailNotification['category'];
  variables: string[];
}

// Email template library
export const EMAIL_TEMPLATES: EmailTemplate[] = [
  {
    id: 'injury-alert',
    name: 'Injury Report Alert',
    subject: '🚨 Injury Report: {{severity}} - {{location}}',
    body: `
Dear {{recipient}},

An injury report has been submitted that requires your attention.

INCIDENT DETAILS:
- Report ID: {{reportId}}
- Date/Time: {{dateTime}}
- Location: {{location}}
- Severity: {{severity}}
- Injured Person: {{injuredPerson}}
- Injury Type: {{injuryType}}

DESCRIPTION:
{{description}}

IMMEDIATE ACTIONS TAKEN:
{{immediateActions}}

Please review and respond to this incident as soon as possible.

Action Required: {{actionUrl}}

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #dc2626, #b91c1c); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .alert-badge { display: inline-block; background: #fecaca; color: #dc2626; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { color: #111827; font-weight: 600; font-size: 14px; }
    .severity-critical { color: #dc2626; }
    .severity-high { color: #ea580c; }
    .severity-medium { color: #ca8a04; }
    .severity-low { color: #16a34a; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🚨 Injury Report Alert</h1>
    </div>
    <div class="content">
      <span class="alert-badge">{{severity}} Severity</span>
      <p>Dear {{recipient}},</p>
      <p>An injury report has been submitted that requires your attention.</p>
      
      <div class="details-card">
        <div class="detail-row">
          <span class="label">Report ID</span>
          <span class="value">{{reportId}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date/Time</span>
          <span class="value">{{dateTime}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location</span>
          <span class="value">{{location}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Injured Person</span>
          <span class="value">{{injuredPerson}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Injury Type</span>
          <span class="value">{{injuryType}}</span>
        </div>
      </div>
      
      <h3>Description</h3>
      <p>{{description}}</p>
      
      <h3>Immediate Actions Taken</h3>
      <p>{{immediateActions}}</p>
      
      <a href="{{actionUrl}}" class="cta-button">View Full Report →</a>
    </div>
    <div class="footer">
      <p>This is an automated message from SafetyMEG. Please do not reply directly to this email.</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'injury',
    variables: ['recipient', 'reportId', 'dateTime', 'location', 'severity', 'injuredPerson', 'injuryType', 'description', 'immediateActions', 'actionUrl']
  },
  {
    id: 'capa-reminder',
    name: 'CAPA Due Date Reminder',
    subject: '⏰ CAPA Reminder: {{action}} - Due {{dueDate}}',
    body: `
Dear {{assignee}},

This is a reminder that a Corrective Action (CAPA) assigned to you is approaching its due date.

CAPA DETAILS:
- CAPA ID: {{capaId}}
- Action: {{action}}
- Due Date: {{dueDate}}
- Days Remaining: {{daysRemaining}}
- Priority: {{priority}}
- Source: {{sourceType}} ({{sourceId}})

Please complete the required action before the deadline.

View CAPA: {{actionUrl}}

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #f97316, #ea580c); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .countdown { display: inline-flex; align-items: center; gap: 8px; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 16px; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { color: #111827; font-weight: 600; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ CAPA Reminder</h1>
    </div>
    <div class="content">
      <div class="countdown">🕐 {{daysRemaining}} days remaining</div>
      <p>Dear {{assignee}},</p>
      <p>This is a reminder that a Corrective Action assigned to you is approaching its due date.</p>
      
      <div class="details-card">
        <div class="detail-row">
          <span class="label">CAPA ID</span>
          <span class="value">{{capaId}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Action</span>
          <span class="value">{{action}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Due Date</span>
          <span class="value">{{dueDate}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Priority</span>
          <span class="value">{{priority}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Source</span>
          <span class="value">{{sourceType}} ({{sourceId}})</span>
        </div>
      </div>
      
      <a href="{{actionUrl}}" class="cta-button">View CAPA Details →</a>
    </div>
    <div class="footer">
      <p>This is an automated reminder from SafetyMEG.</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'capa',
    variables: ['assignee', 'capaId', 'action', 'dueDate', 'daysRemaining', 'priority', 'sourceType', 'sourceId', 'actionUrl']
  },
  {
    id: 'investigation-update',
    name: 'Investigation Update',
    subject: '🔍 Investigation Update: {{investigationId}} - {{status}}',
    body: `
Dear {{recipient}},

An investigation you are involved with has been updated.

INVESTIGATION DETAILS:
- Investigation ID: {{investigationId}}
- Incident: {{incident}}
- Status: {{status}}
- Lead Investigator: {{investigator}}
- Last Updated: {{updatedAt}}

UPDATE SUMMARY:
{{updateSummary}}

View Investigation: {{actionUrl}}

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #6366f1, #4f46e5); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .status-badge { display: inline-block; background: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { color: #111827; font-weight: 600; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🔍 Investigation Update</h1>
    </div>
    <div class="content">
      <span class="status-badge">{{status}}</span>
      <p>Dear {{recipient}},</p>
      <p>An investigation you are involved with has been updated.</p>
      
      <div class="details-card">
        <div class="detail-row">
          <span class="label">Investigation ID</span>
          <span class="value">{{investigationId}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Incident</span>
          <span class="value">{{incident}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Lead Investigator</span>
          <span class="value">{{investigator}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Last Updated</span>
          <span class="value">{{updatedAt}}</span>
        </div>
      </div>
      
      <h3>Update Summary</h3>
      <p>{{updateSummary}}</p>
      
      <a href="{{actionUrl}}" class="cta-button">View Investigation →</a>
    </div>
    <div class="footer">
      <p>This is an automated notification from SafetyMEG.</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'investigation',
    variables: ['recipient', 'investigationId', 'incident', 'status', 'investigator', 'updatedAt', 'updateSummary', 'actionUrl']
  },
  {
    id: 'compliance-alert',
    name: 'Compliance Alert',
    subject: '⚠️ Compliance Alert: {{alertType}} - {{area}}',
    body: `
Dear {{recipient}},

A compliance issue requires your attention.

ALERT DETAILS:
- Alert Type: {{alertType}}
- Area/Category: {{area}}
- Deadline: {{deadline}}
- Current Status: {{currentStatus}}
- Required Action: {{requiredAction}}

Please address this issue promptly to maintain compliance.

View Details: {{actionUrl}}

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #eab308, #ca8a04); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Compliance Alert</h1>
    </div>
    <div class="content">
      <p>Dear {{recipient}},</p>
      <p>A compliance issue requires your attention.</p>
      <p><strong>Alert:</strong> {{alertType}}</p>
      <p><strong>Area:</strong> {{area}}</p>
      <p><strong>Deadline:</strong> {{deadline}}</p>
      <p><strong>Required Action:</strong> {{requiredAction}}</p>
      <a href="{{actionUrl}}" class="cta-button">View Details →</a>
    </div>
    <div class="footer">
      <p>Safety EHS Compliance System</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'compliance',
    variables: ['recipient', 'alertType', 'area', 'deadline', 'currentStatus', 'requiredAction', 'actionUrl']
  },
  // JSA Templates
  {
    id: 'jsa-submission',
    name: 'JSA Submission Confirmation',
    subject: '✅ JSA Submitted: {{taskName}} - {{location}}',
    body: `
Dear {{recipient}},

Your Job Safety Analysis (JSA) has been successfully submitted and is now pending review.

JSA DETAILS:
- JSA ID: {{jsaId}}
- Task: {{taskName}}
- Location: {{location}}
- Date: {{date}}
- Submitted By: {{submittedBy}}
- Steps Analyzed: {{stepsCount}}
- Hazards Identified: {{hazardsCount}}

APPROVAL STATUS: {{status}}

You will be notified when the JSA has been reviewed and approved.

View JSA: {{actionUrl}}

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #14b8a6, #0d9488); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .status-badge { display: inline-block; background: #fef3c7; color: #92400e; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 16px; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
    .detail-row:last-child { border-bottom: none; }
    .label { color: #6b7280; font-size: 14px; }
    .value { color: #111827; font-weight: 600; font-size: 14px; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #14b8a6, #0d9488); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 16px; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ JSA Submitted</h1>
    </div>
    <div class="content">
      <span class="status-badge">{{status}}</span>
      <p>Dear {{recipient}},</p>
      <p>Your Job Safety Analysis has been successfully submitted.</p>
      
      <div class="details-card">
        <div class="detail-row">
          <span class="label">JSA ID</span>
          <span class="value">{{jsaId}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Task</span>
          <span class="value">{{taskName}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Location</span>
          <span class="value">{{location}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Date</span>
          <span class="value">{{date}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Steps Analyzed</span>
          <span class="value">{{stepsCount}}</span>
        </div>
        <div class="detail-row">
          <span class="label">Hazards Identified</span>
          <span class="value">{{hazardsCount}}</span>
        </div>
      </div>
      
      <a href="{{actionUrl}}" class="cta-button">View JSA Details →</a>
    </div>
    <div class="footer">
      <p>This is an automated confirmation from SafetyMEG.</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'general',
    variables: ['recipient', 'jsaId', 'taskName', 'location', 'date', 'submittedBy', 'stepsCount', 'hazardsCount', 'status', 'actionUrl']
  },
  {
    id: 'jsa-approved',
    name: 'JSA Approved Notification',
    subject: '🎉 JSA Approved: {{taskName}} - Ready to Proceed',
    body: `
Dear {{recipient}},

Great news! Your Job Safety Analysis (JSA) has been APPROVED. You may now proceed with the work.

JSA DETAILS:
- JSA ID: {{jsaId}}
- Task: {{taskName}}
- Location: {{location}}
- Approved By: {{approver}}
- Approval Date: {{approvalDate}}
- Valid Until: {{validUntil}}

IMPORTANT REMINDERS:
• Ensure all workers review this JSA before starting work
• Follow all control measures outlined in the JSA
• Stop work if conditions change or new hazards are identified
• Report any incidents or near-misses immediately

View Approved JSA: {{actionUrl}}

Work safely!

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #22c55e, #16a34a); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .approved-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 16px; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #22c55e, #16a34a); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .reminder-box { background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 JSA Approved!</h1>
    </div>
    <div class="content">
      <span class="approved-badge">✓ APPROVED - Ready to Proceed</span>
      <p>Dear {{recipient}},</p>
      <p>Your Job Safety Analysis has been approved. You may now proceed with the work.</p>
      
      <div class="details-card">
        <p><strong>JSA ID:</strong> {{jsaId}}</p>
        <p><strong>Task:</strong> {{taskName}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p><strong>Approved By:</strong> {{approver}}</p>
        <p><strong>Valid Until:</strong> {{validUntil}}</p>
      </div>
      
      <div class="reminder-box">
        <p><strong>⚠️ Important Reminders:</strong></p>
        <ul>
          <li>All workers must review this JSA before starting</li>
          <li>Follow all control measures</li>
          <li>Stop work if conditions change</li>
        </ul>
      </div>
      
      <a href="{{actionUrl}}" class="cta-button">View Approved JSA →</a>
    </div>
    <div class="footer">
      <p>Work safely! - SafetyMEG</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'general',
    variables: ['recipient', 'jsaId', 'taskName', 'location', 'approver', 'approvalDate', 'validUntil', 'actionUrl']
  },
  {
    id: 'training-completion',
    name: 'Training Completion Certificate',
    subject: '🎓 Congratulations! Training Completed: {{courseName}}',
    body: `
Dear {{recipient}},

Congratulations on successfully completing your training!

TRAINING DETAILS:
- Course: {{courseName}}
- Completion Date: {{completionDate}}
- Score: {{score}}%
- Certificate ID: {{certificateId}}
- Valid Until: {{validUntil}}

Your training record has been updated automatically.

Download Certificate: {{certificateUrl}}
View Training History: {{actionUrl}}

Keep up the great work!

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #8b5cf6, #7c3aed); padding: 24px; color: white; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; text-align: center; }
    .certificate-icon { font-size: 64px; margin: 20px 0; }
    .score-badge { display: inline-block; background: #dcfce7; color: #16a34a; padding: 12px 24px; border-radius: 30px; font-size: 24px; font-weight: 700; margin: 16px 0; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; text-align: left; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; margin: 8px; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎓 Training Completed!</h1>
    </div>
    <div class="content">
      <div class="certificate-icon">🏆</div>
      <h2>Congratulations, {{recipient}}!</h2>
      <p>You have successfully completed:</p>
      <h3>{{courseName}}</h3>
      <div class="score-badge">Score: {{score}}%</div>
      
      <div class="details-card">
        <p><strong>Certificate ID:</strong> {{certificateId}}</p>
        <p><strong>Completion Date:</strong> {{completionDate}}</p>
        <p><strong>Valid Until:</strong> {{validUntil}}</p>
      </div>
      
      <div>
        <a href="{{certificateUrl}}" class="cta-button">Download Certificate</a>
        <a href="{{actionUrl}}" class="cta-button" style="background: #6b7280;">View Training History</a>
      </div>
    </div>
    <div class="footer">
      <p>Keep up the great work! - SafetyMEG</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'training',
    variables: ['recipient', 'courseName', 'completionDate', 'score', 'certificateId', 'validUntil', 'certificateUrl', 'actionUrl']
  },
  {
    id: 'permit-approved',
    name: 'Permit Approved Notification',
    subject: '✅ Permit Approved: {{permitType}} - {{location}}',
    body: `
Dear {{recipient}},

Your permit request has been APPROVED.

PERMIT DETAILS:
- Permit ID: {{permitId}}
- Type: {{permitType}}
- Location: {{location}}
- Valid From: {{validFrom}}
- Valid Until: {{validUntil}}
- Approved By: {{approver}}

CONDITIONS:
{{conditions}}

REQUIRED PPE:
{{requiredPPE}}

Please ensure all conditions are met before and during work.

View Permit: {{actionUrl}}

Work safely!

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #10b981, #059669); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .approved-stamp { display: inline-block; background: #dcfce7; border: 2px solid #22c55e; color: #16a34a; padding: 8px 20px; border-radius: 8px; font-weight: 700; font-size: 18px; margin-bottom: 16px; transform: rotate(-2deg); }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .conditions-box { background: #fef3c7; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✅ Permit Approved</h1>
    </div>
    <div class="content">
      <div class="approved-stamp">✓ APPROVED</div>
      <p>Dear {{recipient}},</p>
      <p>Your permit request has been approved and is now active.</p>
      
      <div class="details-card">
        <p><strong>Permit ID:</strong> {{permitId}}</p>
        <p><strong>Type:</strong> {{permitType}}</p>
        <p><strong>Location:</strong> {{location}}</p>
        <p><strong>Valid From:</strong> {{validFrom}}</p>
        <p><strong>Valid Until:</strong> {{validUntil}}</p>
        <p><strong>Approved By:</strong> {{approver}}</p>
      </div>
      
      <div class="conditions-box">
        <p><strong>⚠️ Conditions:</strong></p>
        <p>{{conditions}}</p>
        <p><strong>Required PPE:</strong> {{requiredPPE}}</p>
      </div>
      
      <a href="{{actionUrl}}" class="cta-button">View Permit Details →</a>
    </div>
    <div class="footer">
      <p>Ensure all conditions are met before starting work - SafetyMEG</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'general',
    variables: ['recipient', 'permitId', 'permitType', 'location', 'validFrom', 'validUntil', 'approver', 'conditions', 'requiredPPE', 'actionUrl']
  },
  {
    id: 'near-miss-alert',
    name: 'Near Miss Alert',
    subject: '⚠️ Near Miss Reported: {{location}} - {{hazardType}}',
    body: `
Dear {{recipient}},

A near miss incident has been reported that you should be aware of.

NEAR MISS DETAILS:
- Report ID: {{reportId}}
- Date/Time: {{dateTime}}
- Location: {{location}}
- Hazard Type: {{hazardType}}
- Reported By: {{reportedBy}}
- Potential Severity: {{potentialSeverity}}

DESCRIPTION:
{{description}}

IMMEDIATE ACTIONS TAKEN:
{{immediateActions}}

RECOMMENDED FOLLOW-UP:
{{followUp}}

Near misses are valuable learning opportunities. Please review and take appropriate preventive action.

View Report: {{actionUrl}}

Best regards,
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #f59e0b, #d97706); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .alert-badge { display: inline-flex; align-items: center; gap: 8px; background: #fef3c7; color: #92400e; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin-bottom: 16px; }
    .details-card { background: #f8f9fa; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .description-box { background: #fff7ed; border-left: 4px solid #f59e0b; padding: 16px; margin: 16px 0; border-radius: 0 8px 8px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⚠️ Near Miss Reported</h1>
    </div>
    <div class="content">
      <div class="alert-badge">
        ⚠️ Potential Severity: {{potentialSeverity}}
      </div>
      <p>Dear {{recipient}},</p>
      <p>A near miss incident has been reported at <strong>{{location}}</strong>.</p>
      
      <div class="details-card">
        <p><strong>Report ID:</strong> {{reportId}}</p>
        <p><strong>Date/Time:</strong> {{dateTime}}</p>
        <p><strong>Hazard Type:</strong> {{hazardType}}</p>
        <p><strong>Reported By:</strong> {{reportedBy}}</p>
      </div>
      
      <div class="description-box">
        <p><strong>Description:</strong></p>
        <p>{{description}}</p>
      </div>
      
      <p><strong>Immediate Actions Taken:</strong></p>
      <p>{{immediateActions}}</p>
      
      <p><strong>Recommended Follow-up:</strong></p>
      <p>{{followUp}}</p>
      
      <a href="{{actionUrl}}" class="cta-button">View Full Report →</a>
    </div>
    <div class="footer">
      <p>Near misses are learning opportunities - SafetyMEG</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'general',
    variables: ['recipient', 'reportId', 'dateTime', 'location', 'hazardType', 'reportedBy', 'potentialSeverity', 'description', 'immediateActions', 'followUp', 'actionUrl']
  },
  {
    id: 'daily-safety-digest',
    name: 'Daily Safety Digest',
    subject: '📊 Daily Safety Digest - {{date}}',
    body: `
Daily Safety Digest for {{date}}

SUMMARY:
- Incidents Today: {{incidentCount}}
- Near Misses: {{nearMissCount}}
- Open CAPAs: {{openCapaCount}}
- Pending Inspections: {{pendingInspections}}
- Training Due: {{trainingDue}}

HIGHLIGHTS:
{{highlights}}

KEY METRICS:
- Days Without LTI: {{daysWithoutLTI}}
- Safety Score: {{safetyScore}}%
- Compliance Rate: {{complianceRate}}%

ACTION ITEMS:
{{actionItems}}

View Full Dashboard: {{actionUrl}}

Stay safe!
Safety EHS System
`,
    htmlBody: `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
    .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; }
    .header { background: linear-gradient(135deg, #3b82f6, #1d4ed8); padding: 24px; color: white; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { padding: 24px; }
    .metrics-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 16px 0; }
    .metric-card { background: #f8f9fa; border-radius: 8px; padding: 16px; text-align: center; }
    .metric-value { font-size: 28px; font-weight: 700; color: #1d4ed8; }
    .metric-label { font-size: 12px; color: #6b7280; }
    .highlights-box { background: #eff6ff; border-radius: 8px; padding: 16px; margin: 16px 0; }
    .cta-button { display: inline-block; background: linear-gradient(135deg, #3b82f6, #1d4ed8); color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; }
    .footer { background: #f1f5f9; padding: 16px 24px; text-align: center; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Daily Safety Digest</h1>
      <p style="opacity: 0.9; margin: 8px 0 0 0;">{{date}}</p>
    </div>
    <div class="content">
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">{{incidentCount}}</div>
          <div class="metric-label">Incidents</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{nearMissCount}}</div>
          <div class="metric-label">Near Misses</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">{{openCapaCount}}</div>
          <div class="metric-label">Open CAPAs</div>
        </div>
      </div>
      
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value" style="color: #16a34a;">{{daysWithoutLTI}}</div>
          <div class="metric-label">Days Without LTI</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color: #8b5cf6;">{{safetyScore}}%</div>
          <div class="metric-label">Safety Score</div>
        </div>
        <div class="metric-card">
          <div class="metric-value" style="color: #0891b2;">{{complianceRate}}%</div>
          <div class="metric-label">Compliance</div>
        </div>
      </div>
      
      <div class="highlights-box">
        <p><strong>📌 Highlights:</strong></p>
        <p>{{highlights}}</p>
      </div>
      
      <p><strong>Action Items:</strong></p>
      <p>{{actionItems}}</p>
      
      <a href="{{actionUrl}}" class="cta-button">View Full Dashboard →</a>
    </div>
    <div class="footer">
      <p>Stay safe! - SafetyMEG</p>
    </div>
  </div>
</body>
</html>
`,
    category: 'general',
    variables: ['date', 'incidentCount', 'nearMissCount', 'openCapaCount', 'pendingInspections', 'trainingDue', 'highlights', 'daysWithoutLTI', 'safetyScore', 'complianceRate', 'actionItems', 'actionUrl']
  }
];

// Email queue - simulated in-memory storage
let emailQueue: EmailNotification[] = [];

// Generate email from template
export const generateEmailFromTemplate = (
  templateId: string,
  variables: Record<string, string>,
  to: string[]
): Omit<EmailNotification, 'id' | 'status' | 'retryCount'> | null => {
  const template = EMAIL_TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  let subject = template.subject;
  let body = template.body;
  let htmlBody = template.htmlBody;

  // Replace variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    subject = subject.replace(regex, value);
    body = body.replace(regex, value);
    htmlBody = htmlBody.replace(regex, value);
  });

  return {
    to,
    subject,
    body,
    htmlBody,
    priority: 'normal',
    category: template.category
  };
};

// Queue email for sending
export const queueEmail = (email: Omit<EmailNotification, 'id' | 'status' | 'retryCount'>): EmailNotification => {
  const newEmail: EmailNotification = {
    ...email,
    id: `email-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    retryCount: 0
  };
  
  emailQueue.push(newEmail);
  return newEmail;
};

// Send email (simulated)
export const sendEmail = async (emailId: string): Promise<boolean> => {
  const email = emailQueue.find(e => e.id === emailId);
  if (!email) return false;

  email.status = 'sending';
  
  // Simulate sending delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate
  if (Math.random() > 0.05) {
    email.status = 'sent';
    email.sentAt = new Date();
    return true;
  } else {
    email.status = 'failed';
    email.errorMessage = 'Simulated delivery failure';
    email.retryCount++;
    return false;
  }
};

// Process email queue
export const processEmailQueue = async (): Promise<{ sent: number; failed: number }> => {
  const pending = emailQueue.filter(e => e.status === 'pending' || (e.status === 'failed' && e.retryCount < 3));
  let sent = 0;
  let failed = 0;

  for (const email of pending) {
    const success = await sendEmail(email.id);
    if (success) sent++;
    else failed++;
  }

  return { sent, failed };
};

// Get email queue status
export const getEmailQueueStatus = () => {
  return {
    total: emailQueue.length,
    pending: emailQueue.filter(e => e.status === 'pending').length,
    sending: emailQueue.filter(e => e.status === 'sending').length,
    sent: emailQueue.filter(e => e.status === 'sent').length,
    failed: emailQueue.filter(e => e.status === 'failed').length
  };
};

// Clear sent emails
export const clearSentEmails = () => {
  emailQueue = emailQueue.filter(e => e.status !== 'sent');
};

// Send injury notification email
export const sendInjuryNotificationEmail = (
  to: string[],
  injuryData: {
    reportId: string;
    dateTime: string;
    location: string;
    severity: string;
    injuredPerson: string;
    injuryType: string;
    description: string;
    immediateActions: string;
  }
): EmailNotification | null => {
  const email = generateEmailFromTemplate('injury-alert', {
    recipient: 'Safety Team',
    reportId: injuryData.reportId,
    dateTime: injuryData.dateTime,
    location: injuryData.location,
    severity: injuryData.severity,
    injuredPerson: injuryData.injuredPerson,
    injuryType: injuryData.injuryType,
    description: injuryData.description,
    immediateActions: injuryData.immediateActions,
    actionUrl: `https://app.safety-ehs.com/injury-report?id=${injuryData.reportId}`
  }, to);

  if (!email) return null;
  return queueEmail({ ...email, priority: 'high' });
};

// Send CAPA reminder email
export const sendCAPAReminderEmail = (
  to: string[],
  capaData: {
    capaId: string;
    action: string;
    dueDate: string;
    daysRemaining: number;
    priority: string;
    sourceType: string;
    sourceId: string;
    assignee: string;
  }
): EmailNotification | null => {
  const email = generateEmailFromTemplate('capa-reminder', {
    assignee: capaData.assignee,
    capaId: capaData.capaId,
    action: capaData.action,
    dueDate: capaData.dueDate,
    daysRemaining: String(capaData.daysRemaining),
    priority: capaData.priority,
    sourceType: capaData.sourceType,
    sourceId: capaData.sourceId,
    actionUrl: `https://app.safety-ehs.com/root-cause-capa?id=${capaData.capaId}`
  }, to);

  if (!email) return null;
  const priorityLevel = capaData.daysRemaining <= 0 ? 'urgent' : 
                        capaData.daysRemaining <= 3 ? 'high' : 'normal';
  return queueEmail({ ...email, priority: priorityLevel });
};

export default {
  EMAIL_TEMPLATES,
  generateEmailFromTemplate,
  queueEmail,
  sendEmail,
  processEmailQueue,
  getEmailQueueStatus,
  clearSentEmails,
  sendInjuryNotificationEmail,
  sendCAPAReminderEmail
};
