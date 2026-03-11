// Mock data for Inspection Scheduling module

export type InspectionType = 'swppp' | 'stormwater' | 'safety-audit' | 'epa' | 'sensor-check' | 'permit';
export type RecurrenceType = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
export type InspectionStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface Inspector {
  id: string;
  name: string;
  email: string;
  role: string;
  certifications: string[];
}

export interface ScheduledInspection {
  id: string;
  title: string;
  type: InspectionType;
  description: string;
  zone: string;
  assignedTo: string;
  assigneeEmail?: string;
  recurrence: RecurrenceType;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // in minutes
  status: InspectionStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  checklist?: { item: string; completed: boolean }[];
  notes?: string;
  result?: 'pass' | 'fail' | 'partial';
  nextScheduledDate?: string;
  notificationSent?: boolean;
  reminderSent?: boolean;
}

export interface ScheduleFormData {
  title: string;
  type: InspectionType;
  description: string;
  zone: string;
  assignedTo: string;
  recurrence: RecurrenceType;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  checklist: string[];
  notes: string;
}

export interface NotificationQueue {
  id: string;
  type: 'assignment' | 'reminder' | 'overdue' | 'completed';
  recipientEmail: string;
  recipientName: string;
  subject: string;
  body: string;
  auditId?: string;
  status: 'pending' | 'sent' | 'failed';
  scheduledFor?: number;
  sentAt?: number;
  createdAt: number;
  errorMessage?: string;
}

// Sample inspectors
export const inspectors: Inspector[] = [
  {
    id: 'INS-001',
    name: 'John Martinez',
    email: 'john.martinez@safety-ehs.com',
    role: 'Senior Safety Inspector',
    certifications: ['OSHA 30', 'SWPPP Certification', 'EPA Inspector']
  },
  {
    id: 'INS-002',
    name: 'Sarah Chen',
    email: 'sarah.chen@safety-ehs.com',
    role: 'Environmental Compliance Officer',
    certifications: ['EPA Inspector', 'Stormwater Management', 'ISO 14001 Auditor']
  },
  {
    id: 'INS-003',
    name: 'Michael Thompson',
    email: 'michael.thompson@safety-ehs.com',
    role: 'Safety Technician',
    certifications: ['OSHA 10', 'Fire Safety', 'First Aid/CPR']
  },
  {
    id: 'INS-004',
    name: 'Emily Rodriguez',
    email: 'emily.rodriguez@safety-ehs.com',
    role: 'Quality Assurance Specialist',
    certifications: ['ISO 9001 Lead Auditor', 'Six Sigma Green Belt']
  },
  {
    id: 'INS-005',
    name: 'David Park',
    email: 'david.park@safety-ehs.com',
    role: 'Environmental Engineer',
    certifications: ['PE License', 'SWPPP Designer', 'EPA Inspector']
  }
];

// Sample scheduled inspections
export const scheduledInspections: ScheduledInspection[] = [
  {
    id: 'INSP-001',
    title: 'Weekly SWPPP Site Inspection',
    type: 'swppp',
    description: 'Regular SWPPP compliance inspection including BMP checks and documentation review',
    zone: 'Main Site',
    assignedTo: 'INS-001',
    assigneeEmail: 'john.martinez@safety-ehs.com',
    recurrence: 'weekly',
    scheduledDate: '2026-01-08',
    scheduledTime: '09:00',
    duration: 120,
    status: 'scheduled',
    priority: 'high',
    checklist: [
      { item: 'Inspect sediment basins', completed: false },
      { item: 'Check silt fencing integrity', completed: false },
      { item: 'Review inlet protection', completed: false },
      { item: 'Verify erosion control measures', completed: false },
      { item: 'Document any issues', completed: false }
    ],
    notificationSent: true,
    reminderSent: false
  },
  {
    id: 'INSP-002',
    title: 'Monthly Stormwater Outfall Monitoring',
    type: 'stormwater',
    description: 'Monthly monitoring of all stormwater outfall points and discharge quality',
    zone: 'Perimeter',
    assignedTo: 'INS-002',
    assigneeEmail: 'sarah.chen@safety-ehs.com',
    recurrence: 'monthly',
    scheduledDate: '2026-01-15',
    scheduledTime: '10:00',
    duration: 180,
    status: 'scheduled',
    priority: 'high',
    checklist: [
      { item: 'Sample collection at all outfalls', completed: false },
      { item: 'Visual inspection for sheen/discoloration', completed: false },
      { item: 'pH and turbidity testing', completed: false },
      { item: 'Photo documentation', completed: false },
      { item: 'Update monitoring logs', completed: false }
    ],
    notificationSent: true,
    reminderSent: false
  },
  {
    id: 'INSP-003',
    title: 'Daily Safety Walk-Through',
    type: 'safety-audit',
    description: 'Daily safety inspection of active work areas',
    zone: 'All Zones',
    assignedTo: 'INS-003',
    assigneeEmail: 'michael.thompson@safety-ehs.com',
    recurrence: 'daily',
    scheduledDate: '2026-01-07',
    scheduledTime: '07:00',
    duration: 60,
    status: 'in_progress',
    priority: 'medium',
    checklist: [
      { item: 'Check PPE compliance', completed: true },
      { item: 'Verify barricades and signage', completed: true },
      { item: 'Inspect scaffolding', completed: false },
      { item: 'Review hot work permits', completed: false }
    ],
    notificationSent: true,
    reminderSent: true
  },
  {
    id: 'INSP-004',
    title: 'Quarterly EPA Compliance Audit',
    type: 'epa',
    description: 'Comprehensive EPA compliance audit including air, water, and waste management',
    zone: 'Facility-Wide',
    assignedTo: 'INS-002',
    assigneeEmail: 'sarah.chen@safety-ehs.com',
    recurrence: 'quarterly',
    scheduledDate: '2026-01-20',
    scheduledTime: '08:00',
    duration: 480,
    status: 'scheduled',
    priority: 'critical',
    checklist: [
      { item: 'Review air emission permits', completed: false },
      { item: 'Verify SPCC plan compliance', completed: false },
      { item: 'Audit hazardous waste storage', completed: false },
      { item: 'Check NPDES permit requirements', completed: false },
      { item: 'Document findings and recommendations', completed: false }
    ],
    notificationSent: false,
    reminderSent: false
  },
  {
    id: 'INSP-005',
    title: 'Bi-Weekly Sensor Calibration Check',
    type: 'sensor-check',
    description: 'Verify calibration status of all environmental monitoring sensors',
    zone: 'Control Room',
    assignedTo: 'INS-003',
    assigneeEmail: 'michael.thompson@safety-ehs.com',
    recurrence: 'biweekly',
    scheduledDate: '2026-01-10',
    scheduledTime: '14:00',
    duration: 90,
    status: 'scheduled',
    priority: 'medium',
    checklist: [
      { item: 'Check gas detector calibration dates', completed: false },
      { item: 'Verify pH meter accuracy', completed: false },
      { item: 'Test temperature sensor readings', completed: false },
      { item: 'Update calibration log', completed: false }
    ],
    notificationSent: true,
    reminderSent: false
  },
  {
    id: 'INSP-006',
    title: 'Hot Work Permit Area Inspection',
    type: 'permit',
    description: 'Inspection of designated hot work areas before permit issuance',
    zone: 'Welding Bay',
    assignedTo: 'INS-001',
    assigneeEmail: 'john.martinez@safety-ehs.com',
    recurrence: 'once',
    scheduledDate: '2026-01-07',
    scheduledTime: '11:00',
    duration: 45,
    status: 'completed',
    priority: 'high',
    result: 'pass',
    notes: 'Area cleared for hot work. Fire extinguisher present. Fire watch assigned.',
    notificationSent: true,
    reminderSent: true
  }
];

// EPA Report Data
export interface EPAReportData {
  period: string;
  inspectionsCompleted: number;
  inspectionsPassed: number;
  inspectionsFailed: number;
  complianceRate: number;
  issuesIdentified: number;
  issuesResolved: number;
  avgResolutionDays: number;
}

export interface EPAMetric {
  category: string;
  metric: string;
  value: number;
  unit: string;
  limit: number;
  status: 'compliant' | 'warning' | 'violation';
  lastUpdated: string;
}

export const epaQuarterlyReports: EPAReportData[] = [
  {
    period: 'Q4 2025',
    inspectionsCompleted: 45,
    inspectionsPassed: 42,
    inspectionsFailed: 3,
    complianceRate: 93.3,
    issuesIdentified: 12,
    issuesResolved: 10,
    avgResolutionDays: 5.2
  },
  {
    period: 'Q3 2025',
    inspectionsCompleted: 48,
    inspectionsPassed: 46,
    inspectionsFailed: 2,
    complianceRate: 95.8,
    issuesIdentified: 8,
    issuesResolved: 8,
    avgResolutionDays: 4.1
  },
  {
    period: 'Q2 2025',
    inspectionsCompleted: 42,
    inspectionsPassed: 38,
    inspectionsFailed: 4,
    complianceRate: 90.5,
    issuesIdentified: 15,
    issuesResolved: 14,
    avgResolutionDays: 6.8
  },
  {
    period: 'Q1 2025',
    inspectionsCompleted: 44,
    inspectionsPassed: 41,
    inspectionsFailed: 3,
    complianceRate: 93.2,
    issuesIdentified: 11,
    issuesResolved: 11,
    avgResolutionDays: 5.5
  }
];

export const epaMetrics: EPAMetric[] = [
  {
    category: 'Air Quality',
    metric: 'VOC Emissions',
    value: 42.5,
    unit: 'tons/year',
    limit: 50,
    status: 'compliant',
    lastUpdated: '2026-01-06'
  },
  {
    category: 'Air Quality',
    metric: 'PM10 Concentration',
    value: 145,
    unit: 'µg/m³',
    limit: 150,
    status: 'warning',
    lastUpdated: '2026-01-06'
  },
  {
    category: 'Air Quality',
    metric: 'NOx Emissions',
    value: 18.2,
    unit: 'tons/year',
    limit: 25,
    status: 'compliant',
    lastUpdated: '2026-01-06'
  },
  {
    category: 'Air Quality',
    metric: 'SO2 Emissions',
    value: 8.4,
    unit: 'tons/year',
    limit: 15,
    status: 'compliant',
    lastUpdated: '2026-01-06'
  },
  {
    category: 'Air Quality',
    metric: 'CO Emissions',
    value: 22.1,
    unit: 'tons/year',
    limit: 30,
    status: 'compliant',
    lastUpdated: '2026-01-06'
  },
  {
    category: 'Water Quality',
    metric: 'TSS (Total Suspended Solids)',
    value: 28,
    unit: 'mg/L',
    limit: 30,
    status: 'warning',
    lastUpdated: '2026-01-05'
  },
  {
    category: 'Water Quality',
    metric: 'pH Level',
    value: 7.2,
    unit: 'pH',
    limit: 9,
    status: 'compliant',
    lastUpdated: '2026-01-05'
  },
  {
    category: 'Water Quality',
    metric: 'Oil & Grease',
    value: 8.5,
    unit: 'mg/L',
    limit: 15,
    status: 'compliant',
    lastUpdated: '2026-01-05'
  },
  {
    category: 'Water Quality',
    metric: 'BOD (Biochemical Oxygen Demand)',
    value: 18,
    unit: 'mg/L',
    limit: 30,
    status: 'compliant',
    lastUpdated: '2026-01-05'
  },
  {
    category: 'Water Quality',
    metric: 'Ammonia Nitrogen',
    value: 12.5,
    unit: 'mg/L',
    limit: 20,
    status: 'compliant',
    lastUpdated: '2026-01-05'
  },
  {
    category: 'Water Quality',
    metric: 'Heavy Metals (Lead)',
    value: 0.008,
    unit: 'mg/L',
    limit: 0.015,
    status: 'compliant',
    lastUpdated: '2026-01-05'
  },
  {
    category: 'Waste',
    metric: 'Hazardous Waste Generated',
    value: 2.4,
    unit: 'tons/month',
    limit: 5,
    status: 'compliant',
    lastUpdated: '2026-01-04'
  },
  {
    category: 'Waste',
    metric: 'Recycling Rate',
    value: 68,
    unit: '%',
    limit: 50,
    status: 'compliant',
    lastUpdated: '2026-01-04'
  },
  {
    category: 'Waste',
    metric: 'Universal Waste Storage Time',
    value: 220,
    unit: 'days',
    limit: 365,
    status: 'compliant',
    lastUpdated: '2026-01-04'
  }
];

// Helper functions
export function getInspectionsByStatus(status: InspectionStatus): ScheduledInspection[] {
  return scheduledInspections.filter(i => i.status === status);
}

export function getInspectionsByType(type: InspectionType): ScheduledInspection[] {
  return scheduledInspections.filter(i => i.type === type);
}

export function getUpcomingInspections(days: number = 7): ScheduledInspection[] {
  const today = new Date();
  const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);
  
  return scheduledInspections.filter(i => {
    const inspDate = new Date(i.scheduledDate);
    return inspDate >= today && inspDate <= futureDate && i.status === 'scheduled';
  });
}

export function calculateNextDate(currentDate: string, recurrence: RecurrenceType): string {
  const date = new Date(currentDate);
  
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'biweekly':
      date.setDate(date.getDate() + 14);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'quarterly':
      date.setMonth(date.getMonth() + 3);
      break;
    case 'annual':
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return '';
  }
  
  return date.toISOString().split('T')[0];
}

export function getInspectorById(id: string): Inspector | undefined {
  return inspectors.find(i => i.id === id);
}

export function getInspectorByEmail(email: string): Inspector | undefined {
  return inspectors.find(i => i.email === email);
}

// Notification Queue Management (localStorage-based)
const NOTIFICATION_QUEUE_KEY = 'megsafe_notification_queue';

export function getNotificationQueue(): NotificationQueue[] {
  try {
    const stored = localStorage.getItem(NOTIFICATION_QUEUE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveNotificationQueue(queue: NotificationQueue[]): void {
  localStorage.setItem(NOTIFICATION_QUEUE_KEY, JSON.stringify(queue));
}

export function addNotification(notification: Omit<NotificationQueue, 'id' | 'createdAt' | 'status'>): NotificationQueue {
  const queue = getNotificationQueue();
  const newNotification: NotificationQueue = {
    ...notification,
    id: `NOTIF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    status: 'pending',
    createdAt: Date.now(),
  };
  queue.push(newNotification);
  saveNotificationQueue(queue);
  return newNotification;
}

export function updateNotificationStatus(id: string, status: 'sent' | 'failed', errorMessage?: string): void {
  const queue = getNotificationQueue();
  const index = queue.findIndex(n => n.id === id);
  if (index !== -1) {
    queue[index].status = status;
    if (status === 'sent') {
      queue[index].sentAt = Date.now();
    }
    if (errorMessage) {
      queue[index].errorMessage = errorMessage;
    }
    saveNotificationQueue(queue);
  }
}

export function getPendingNotifications(): NotificationQueue[] {
  return getNotificationQueue().filter(n => n.status === 'pending');
}

export function getNotificationStats(): { total: number; pending: number; sent: number; failed: number } {
  const queue = getNotificationQueue();
  return {
    total: queue.length,
    pending: queue.filter(n => n.status === 'pending').length,
    sent: queue.filter(n => n.status === 'sent').length,
    failed: queue.filter(n => n.status === 'failed').length,
  };
}

// Create assignment notification
export function createAssignmentNotification(inspection: ScheduledInspection): NotificationQueue | null {
  const inspector = getInspectorById(inspection.assignedTo);
  if (!inspector) return null;
  
  return addNotification({
    type: 'assignment',
    recipientEmail: inspector.email,
    recipientName: inspector.name,
    subject: `[megSAFE] Audit Assignment: ${inspection.title}`,
    body: `You have been assigned a new safety audit.\n\nAudit: ${inspection.title}\nDate: ${inspection.scheduledDate}\nTime: ${inspection.scheduledTime}\nLocation: ${inspection.zone}\nPriority: ${inspection.priority.toUpperCase()}\n\nPlease log in to megSAFE to review the audit requirements.`,
    auditId: inspection.id,
  });
}

// Create reminder notification
export function createReminderNotification(inspection: ScheduledInspection, isOverdue: boolean = false): NotificationQueue | null {
  const inspector = getInspectorById(inspection.assignedTo);
  if (!inspector) return null;
  
  const type = isOverdue ? 'overdue' : 'reminder';
  const subject = isOverdue 
    ? `[megSAFE] OVERDUE: ${inspection.title}`
    : `[megSAFE] Reminder: ${inspection.title} - Due Soon`;
  
  const body = isOverdue
    ? `This audit is now OVERDUE and requires immediate attention.\n\nAudit: ${inspection.title}\nOriginal Due Date: ${inspection.scheduledDate}\n\nPlease complete this audit as soon as possible.`
    : `Reminder: You have an upcoming audit.\n\nAudit: ${inspection.title}\nDate: ${inspection.scheduledDate}\nTime: ${inspection.scheduledTime}\nLocation: ${inspection.zone}\n\nPlease ensure you complete the audit before the due date.`;
  
  return addNotification({
    type,
    recipientEmail: inspector.email,
    recipientName: inspector.name,
    subject,
    body,
    auditId: inspection.id,
  });
}

// Aliases for InspectionScheduling page compatibility
export const mockScheduledInspections = scheduledInspections;
export const mockInspectors = inspectors;

export const inspectionTypes = [
  { value: 'swppp' as InspectionType, label: 'SWPPP Inspection' },
  { value: 'stormwater' as InspectionType, label: 'Stormwater Inspection' },
  { value: 'safety-audit' as InspectionType, label: 'Safety Audit' },
  { value: 'epa' as InspectionType, label: 'EPA Inspection' },
  { value: 'sensor-check' as InspectionType, label: 'Sensor Check' },
  { value: 'permit' as InspectionType, label: 'Permit Inspection' },
];

export const recurrenceOptions = [
  { value: 'once' as RecurrenceType, label: 'One-time' },
  { value: 'daily' as RecurrenceType, label: 'Daily' },
  { value: 'weekly' as RecurrenceType, label: 'Weekly' },
  { value: 'biweekly' as RecurrenceType, label: 'Bi-weekly' },
  { value: 'monthly' as RecurrenceType, label: 'Monthly' },
  { value: 'quarterly' as RecurrenceType, label: 'Quarterly' },
  { value: 'annual' as RecurrenceType, label: 'Annual' },
];

// Aliases for EPA Dashboard compatibility
export const mockEPAReportData = epaQuarterlyReports;
export const mockEPAMetrics = epaMetrics;
