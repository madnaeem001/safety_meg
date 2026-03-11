/**
 * SMS Notification Service
 * Provides SMS notification functionality for safety alerts and communications
 */

export interface SMSNotification {
  id: string;
  to: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'emergency';
  category: SMSCategory;
  scheduledAt?: Date;
  sentAt?: Date;
  status: 'pending' | 'scheduled' | 'sending' | 'delivered' | 'failed' | 'cancelled';
  deliveryReport?: DeliveryReport;
  retryCount: number;
  metadata?: Record<string, any>;
}

export type SMSCategory = 
  | 'safety_alert'
  | 'incident_notification'
  | 'permit_status'
  | 'training_reminder'
  | 'capa_reminder'
  | 'emergency_broadcast'
  | 'shift_notification'
  | 'inspection_reminder'
  | 'compliance_alert'
  | 'general';

export interface DeliveryReport {
  timestamp: Date;
  status: 'delivered' | 'failed' | 'pending';
  carrier?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  category: SMSCategory;
  variables: string[];
  characterCount: number;
  segmentCount: number;
}

export interface SMSPreferences {
  enabled: boolean;
  phoneNumber: string;
  optInConfirmed: boolean;
  categories: Record<SMSCategory, boolean>;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm
    end: string;
    allowEmergency: boolean;
  };
  language: 'en' | 'es' | 'fr' | 'de' | 'zh';
}

export interface SMSQuota {
  daily: { used: number; limit: number };
  monthly: { used: number; limit: number };
  emergencyReserve: number;
}

// SMS Templates - kept short for SMS character limits (160 chars per segment)
export const SMS_TEMPLATES: SMSTemplate[] = [
  // Emergency Alerts
  {
    id: 'emergency-evacuation',
    name: 'Emergency Evacuation Alert',
    message: '🚨 EMERGENCY: Evacuate {{location}} immediately. {{reason}}. Report to assembly point {{assemblyPoint}}. Reply SAFE when clear.',
    category: 'emergency_broadcast',
    variables: ['location', 'reason', 'assemblyPoint'],
    characterCount: 140,
    segmentCount: 1
  },
  {
    id: 'emergency-lockdown',
    name: 'Lockdown Alert',
    message: '🔒 LOCKDOWN: {{location}}. {{instruction}}. Stay in place until all-clear. Do not open doors.',
    category: 'emergency_broadcast',
    variables: ['location', 'instruction'],
    characterCount: 120,
    segmentCount: 1
  },
  {
    id: 'emergency-chemical-spill',
    name: 'Chemical Spill Alert',
    message: '⚠️ HAZMAT: Chemical spill at {{location}}. Avoid area. {{instruction}}. Contact EHS if exposed.',
    category: 'emergency_broadcast',
    variables: ['location', 'instruction'],
    characterCount: 110,
    segmentCount: 1
  },

  // Safety Alerts
  {
    id: 'incident-reported',
    name: 'Incident Reported',
    message: '🚨 Incident #{{incidentId}} at {{location}}. {{type}} - {{severity}} severity. View: {{shortUrl}}',
    category: 'incident_notification',
    variables: ['incidentId', 'location', 'type', 'severity', 'shortUrl'],
    characterCount: 95,
    segmentCount: 1
  },
  {
    id: 'near-miss-reported',
    name: 'Near Miss Alert',
    message: '⚠️ Near miss reported at {{location}}: {{description}}. Review and assess controls. ID: {{reportId}}',
    category: 'safety_alert',
    variables: ['location', 'description', 'reportId'],
    characterCount: 110,
    segmentCount: 1
  },
  {
    id: 'safety-observation',
    name: 'Safety Observation',
    message: '👁️ Safety observation at {{location}}: {{observation}}. Action may be required. ID: {{obsId}}',
    category: 'safety_alert',
    variables: ['location', 'observation', 'obsId'],
    characterCount: 100,
    segmentCount: 1
  },

  // Permit Notifications
  {
    id: 'permit-approved',
    name: 'Permit Approved',
    message: '✅ Permit {{permitId}} APPROVED for {{workType}} at {{location}}. Valid: {{startDate}} to {{endDate}}.',
    category: 'permit_status',
    variables: ['permitId', 'workType', 'location', 'startDate', 'endDate'],
    characterCount: 105,
    segmentCount: 1
  },
  {
    id: 'permit-expiring',
    name: 'Permit Expiring',
    message: '⏰ Permit {{permitId}} expires in {{hours}} hours. Renew or complete work before {{expiryTime}}.',
    category: 'permit_status',
    variables: ['permitId', 'hours', 'expiryTime'],
    characterCount: 95,
    segmentCount: 1
  },
  {
    id: 'permit-rejected',
    name: 'Permit Rejected',
    message: '❌ Permit {{permitId}} REJECTED. Reason: {{reason}}. Contact {{approver}} for details.',
    category: 'permit_status',
    variables: ['permitId', 'reason', 'approver'],
    characterCount: 90,
    segmentCount: 1
  },

  // CAPA Reminders
  {
    id: 'capa-due',
    name: 'CAPA Due Reminder',
    message: '📋 CAPA {{capaId}} due in {{daysRemaining}} days. Action: {{action}}. Complete by {{dueDate}}.',
    category: 'capa_reminder',
    variables: ['capaId', 'daysRemaining', 'action', 'dueDate'],
    characterCount: 100,
    segmentCount: 1
  },
  {
    id: 'capa-overdue',
    name: 'CAPA Overdue Alert',
    message: '🔴 CAPA {{capaId}} is OVERDUE by {{daysOverdue}} days. Immediate action required. View: {{shortUrl}}',
    category: 'capa_reminder',
    variables: ['capaId', 'daysOverdue', 'shortUrl'],
    characterCount: 105,
    segmentCount: 1
  },

  // Training Reminders
  {
    id: 'training-reminder',
    name: 'Training Reminder',
    message: '📚 Training reminder: "{{courseName}}" starts {{dateTime}} at {{location}}. Duration: {{duration}}.',
    category: 'training_reminder',
    variables: ['courseName', 'dateTime', 'location', 'duration'],
    characterCount: 100,
    segmentCount: 1
  },
  {
    id: 'certification-expiring',
    name: 'Certification Expiring',
    message: '⚠️ Your {{certification}} certification expires on {{expiryDate}}. Renew before expiry to maintain compliance.',
    category: 'training_reminder',
    variables: ['certification', 'expiryDate'],
    characterCount: 115,
    segmentCount: 1
  },

  // Inspection Reminders
  {
    id: 'inspection-scheduled',
    name: 'Inspection Scheduled',
    message: '🔍 Inspection scheduled: {{inspectionType}} on {{date}} at {{time}}. Location: {{location}}. Prepare accordingly.',
    category: 'inspection_reminder',
    variables: ['inspectionType', 'date', 'time', 'location'],
    characterCount: 120,
    segmentCount: 1
  },
  {
    id: 'inspection-overdue',
    name: 'Inspection Overdue',
    message: '🔴 Overdue inspection: {{inspectionType}} at {{location}} was due {{dueDate}}. Complete ASAP.',
    category: 'inspection_reminder',
    variables: ['inspectionType', 'location', 'dueDate'],
    characterCount: 100,
    segmentCount: 1
  },

  // Shift Notifications
  {
    id: 'shift-change',
    name: 'Shift Change Alert',
    message: '🔄 Shift change: You are now assigned to {{shift}} shift at {{location}} starting {{startTime}}.',
    category: 'shift_notification',
    variables: ['shift', 'location', 'startTime'],
    characterCount: 100,
    segmentCount: 1
  },
  {
    id: 'overtime-request',
    name: 'Overtime Request',
    message: '⏱️ Overtime requested for {{date}}. {{hours}} additional hours at {{location}}. Reply YES to confirm, NO to decline.',
    category: 'shift_notification',
    variables: ['date', 'hours', 'location'],
    characterCount: 120,
    segmentCount: 1
  },

  // Compliance Alerts
  {
    id: 'compliance-deadline',
    name: 'Compliance Deadline',
    message: '📅 Compliance deadline: {{requirement}} due {{deadline}}. Days remaining: {{daysLeft}}. Action required.',
    category: 'compliance_alert',
    variables: ['requirement', 'deadline', 'daysLeft'],
    characterCount: 110,
    segmentCount: 1
  },
  {
    id: 'audit-notification',
    name: 'Audit Notification',
    message: '📋 Audit scheduled: {{auditType}} on {{date}}. Auditor: {{auditor}}. Ensure documentation is ready.',
    category: 'compliance_alert',
    variables: ['auditType', 'date', 'auditor'],
    characterCount: 105,
    segmentCount: 1
  }
];

// Default SMS preferences
const DEFAULT_SMS_PREFERENCES: SMSPreferences = {
  enabled: false,
  phoneNumber: '',
  optInConfirmed: false,
  categories: {
    safety_alert: true,
    incident_notification: true,
    permit_status: true,
    training_reminder: true,
    capa_reminder: true,
    emergency_broadcast: true,
    shift_notification: false,
    inspection_reminder: true,
    compliance_alert: true,
    general: false
  },
  quietHours: {
    enabled: true,
    start: '22:00',
    end: '07:00',
    allowEmergency: true
  },
  language: 'en'
};

// SMS Service Class
class SMSNotificationService {
  private preferences: SMSPreferences;
  private pendingMessages: SMSNotification[] = [];
  private sentMessages: SMSNotification[] = [];
  private quota: SMSQuota;

  constructor() {
    this.preferences = this.loadPreferences();
    this.quota = this.loadQuota();
  }

  private loadPreferences(): SMSPreferences {
    const stored = localStorage.getItem('smsPreferences');
    return stored ? JSON.parse(stored) : { ...DEFAULT_SMS_PREFERENCES };
  }

  private savePreferences(): void {
    localStorage.setItem('smsPreferences', JSON.stringify(this.preferences));
  }

  private loadQuota(): SMSQuota {
    const stored = localStorage.getItem('smsQuota');
    const today = new Date().toDateString();
    const storedDate = localStorage.getItem('smsQuotaDate');
    
    if (stored && storedDate === today) {
      return JSON.parse(stored);
    }
    
    // Reset daily quota at start of new day
    const defaultQuota: SMSQuota = {
      daily: { used: 0, limit: 100 },
      monthly: { used: 0, limit: 2000 },
      emergencyReserve: 50
    };
    
    localStorage.setItem('smsQuotaDate', today);
    localStorage.setItem('smsQuota', JSON.stringify(defaultQuota));
    return defaultQuota;
  }

  private saveQuota(): void {
    localStorage.setItem('smsQuota', JSON.stringify(this.quota));
    localStorage.setItem('smsQuotaDate', new Date().toDateString());
  }

  // Get current preferences
  getPreferences(): SMSPreferences {
    return { ...this.preferences };
  }

  // Update preferences
  updatePreferences(updates: Partial<SMSPreferences>): SMSPreferences {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
    return this.preferences;
  }

  // Get quota info
  getQuota(): SMSQuota {
    return { ...this.quota };
  }

  // Check if SMS can be sent (quota, preferences, quiet hours)
  canSendSMS(category: SMSCategory): { allowed: boolean; reason?: string } {
    if (!this.preferences.enabled) {
      return { allowed: false, reason: 'SMS notifications are disabled' };
    }

    if (!this.preferences.optInConfirmed) {
      return { allowed: false, reason: 'SMS opt-in not confirmed' };
    }

    if (!this.preferences.phoneNumber) {
      return { allowed: false, reason: 'No phone number configured' };
    }

    if (!this.preferences.categories[category]) {
      return { allowed: false, reason: `Category ${category} is disabled` };
    }

    // Check quiet hours (except for emergency)
    if (this.preferences.quietHours.enabled && category !== 'emergency_broadcast') {
      const now = new Date();
      const currentTime = now.getHours() * 100 + now.getMinutes();
      const startTime = parseInt(this.preferences.quietHours.start.replace(':', ''));
      const endTime = parseInt(this.preferences.quietHours.end.replace(':', ''));
      
      const inQuietHours = startTime > endTime
        ? (currentTime >= startTime || currentTime < endTime) // overnight
        : (currentTime >= startTime && currentTime < endTime);
      
      if (inQuietHours) {
        return { allowed: false, reason: 'Quiet hours active' };
      }
    }

    // Check quota
    if (this.quota.daily.used >= this.quota.daily.limit) {
      if (category === 'emergency_broadcast' && this.quota.emergencyReserve > 0) {
        return { allowed: true };
      }
      return { allowed: false, reason: 'Daily SMS quota exceeded' };
    }

    return { allowed: true };
  }

  // Create SMS from template
  createFromTemplate(
    templateId: string,
    variables: Record<string, string>,
    to?: string,
    priority?: SMSNotification['priority']
  ): SMSNotification | null {
    const template = SMS_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    let message = template.message;
    for (const [key, value] of Object.entries(variables)) {
      message = message.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }

    const notification: SMSNotification = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      to: to || this.preferences.phoneNumber,
      message,
      priority: priority || (template.category === 'emergency_broadcast' ? 'emergency' : 'normal'),
      category: template.category,
      status: 'pending',
      retryCount: 0,
      metadata: { templateId }
    };

    return notification;
  }

  // Queue SMS for sending
  async queueSMS(notification: SMSNotification): Promise<{ success: boolean; message: string }> {
    const canSend = this.canSendSMS(notification.category);
    if (!canSend.allowed) {
      return { success: false, message: canSend.reason || 'Cannot send SMS' };
    }

    this.pendingMessages.push(notification);
    
    // Simulate sending (in real implementation, this would call SMS API)
    return this.sendSMS(notification);
  }

  // Send SMS (simulated)
  private async sendSMS(notification: SMSNotification): Promise<{ success: boolean; message: string }> {
    notification.status = 'sending';
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      notification.status = 'delivered';
      notification.sentAt = new Date();
      notification.deliveryReport = {
        timestamp: new Date(),
        status: 'delivered',
        carrier: 'Simulated Carrier'
      };
      
      // Update quota
      this.quota.daily.used++;
      this.quota.monthly.used++;
      if (notification.category === 'emergency_broadcast') {
        this.quota.emergencyReserve = Math.max(0, this.quota.emergencyReserve - 1);
      }
      this.saveQuota();
      
      this.sentMessages.push(notification);
      this.pendingMessages = this.pendingMessages.filter(m => m.id !== notification.id);
      
      return { success: true, message: 'SMS sent successfully' };
    } else {
      notification.status = 'failed';
      notification.retryCount++;
      notification.deliveryReport = {
        timestamp: new Date(),
        status: 'failed',
        errorCode: 'SIM_FAIL',
        errorMessage: 'Simulated failure for demo'
      };
      
      return { success: false, message: 'SMS delivery failed' };
    }
  }

  // Send emergency broadcast to multiple recipients
  async sendEmergencyBroadcast(
    templateId: string,
    variables: Record<string, string>,
    recipients: string[]
  ): Promise<{ sent: number; failed: number; results: Array<{ phone: string; success: boolean }> }> {
    const results: Array<{ phone: string; success: boolean }> = [];
    let sent = 0;
    let failed = 0;

    for (const phone of recipients) {
      const notification = this.createFromTemplate(templateId, variables, phone, 'emergency');
      if (notification) {
        const result = await this.queueSMS(notification);
        results.push({ phone, success: result.success });
        if (result.success) sent++;
        else failed++;
      }
    }

    return { sent, failed, results };
  }

  // Get message history
  getSentMessages(limit: number = 50): SMSNotification[] {
    return this.sentMessages.slice(-limit);
  }

  getPendingMessages(): SMSNotification[] {
    return [...this.pendingMessages];
  }

  // Opt-in confirmation
  async confirmOptIn(phoneNumber: string, code: string): Promise<boolean> {
    // Simulate OTP verification
    const isValid = code.length === 6 && /^\d+$/.test(code);
    
    if (isValid) {
      this.preferences.phoneNumber = phoneNumber;
      this.preferences.optInConfirmed = true;
      this.preferences.enabled = true;
      this.savePreferences();
    }
    
    return isValid;
  }

  // Send OTP for opt-in
  async sendOptInCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
    // Simulate sending OTP
    console.log(`[SMS Service] Sending OTP to ${phoneNumber}`);
    return { success: true, message: 'Verification code sent' };
  }

  // Opt-out
  optOut(): void {
    this.preferences.enabled = false;
    this.preferences.optInConfirmed = false;
    this.savePreferences();
  }

  // Get all templates
  getTemplates(): SMSTemplate[] {
    return [...SMS_TEMPLATES];
  }

  // Get templates by category
  getTemplatesByCategory(category: SMSCategory): SMSTemplate[] {
    return SMS_TEMPLATES.filter(t => t.category === category);
  }

  // Calculate SMS segments for a message
  calculateSegments(message: string): { characterCount: number; segmentCount: number } {
    const characterCount = message.length;
    // GSM-7 encoding: 160 chars for single, 153 per segment for multi
    const segmentCount = characterCount <= 160 ? 1 : Math.ceil(characterCount / 153);
    return { characterCount, segmentCount };
  }
}

// Export singleton instance
export const smsNotificationService = new SMSNotificationService();

// Export helper functions
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // Format as US phone number if 10 or 11 digits
  if (digits.length === 10) {
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  } else if (digits.length === 11 && digits[0] === '1') {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  // Return with + prefix for international
  return `+${digits}`;
}

export function validatePhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

export default smsNotificationService;
