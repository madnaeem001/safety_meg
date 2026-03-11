// EHS Workflow Types and Mock Data
// Standard EHS Workflow: Observation → Incident → Investigation → CAPA → Audits → Reporting → Compliance

export type WorkflowStage = 
  | 'observation'
  | 'incident' 
  | 'investigation'
  | 'capa'
  | 'audit'
  | 'bbs'
  | 'compliance'
  | 'reporting'
  | 'improvement';

export type StageStatus = 'pending' | 'in_progress' | 'completed' | 'overdue' | 'blocked';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export interface WorkflowStageInfo {
  id: WorkflowStage;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  color: string;
  order: number;
}

export const workflowStages: WorkflowStageInfo[] = [
  {
    id: 'observation',
    name: 'Hazard / Observation Submission',
    shortName: 'Observation',
    description: 'Report safety concerns, hazards, or positive observations',
    icon: 'Eye',
    color: 'blue',
    order: 1
  },
  {
    id: 'incident',
    name: 'Incident Reporting',
    shortName: 'Incident',
    description: 'Log injuries, near misses, property damage events',
    icon: 'AlertTriangle',
    color: 'red',
    order: 2
  },
  {
    id: 'investigation',
    name: 'Investigation & Root Cause',
    shortName: 'Investigation',
    description: 'Perform 5-Why analysis and identify root causes',
    icon: 'Search',
    color: 'orange',
    order: 3
  },
  {
    id: 'capa',
    name: 'Corrective Actions (CAPA)',
    shortName: 'CAPA',
    description: 'Assign and track corrective & preventive actions',
    icon: 'CheckSquare',
    color: 'purple',
    order: 4
  },
  {
    id: 'audit',
    name: 'Audits & Inspections',
    shortName: 'Audits',
    description: 'Schedule and conduct safety audits and inspections',
    icon: 'ClipboardCheck',
    color: 'teal',
    order: 5
  },
  {
    id: 'bbs',
    name: 'Safety Observations (BBS)',
    shortName: 'BBS',
    description: 'Behavior-based safety observation program',
    icon: 'Users',
    color: 'green',
    order: 6
  },
  {
    id: 'compliance',
    name: 'Compliance Management',
    shortName: 'Compliance',
    description: 'Track regulatory obligations and permits',
    icon: 'Shield',
    color: 'indigo',
    order: 7
  },
  {
    id: 'reporting',
    name: 'Analytics & Reporting',
    shortName: 'Reporting',
    description: 'Dashboards, KPIs, and export capabilities',
    icon: 'BarChart3',
    color: 'cyan',
    order: 8
  },
  {
    id: 'improvement',
    name: 'Continuous Improvement',
    shortName: 'Improvement',
    description: 'ISO 45001 aligned improvement loop',
    icon: 'RefreshCw',
    color: 'emerald',
    order: 9
  }
];

// Observation Types
export type ObservationType = 'unsafe_condition' | 'at_risk_behavior' | 'good_catch' | 'positive';

export interface Observation {
  id: string;
  type: ObservationType;
  title: string;
  description: string;
  location: string;
  reportedBy: string;
  reportedDate: string;
  riskCategory?: string;
  behaviorType?: string;
  photoUrl?: string;
  status: StageStatus;
  followUpActions?: string[];
  linkedIncidentId?: string;
}

// Incident Types
export type IncidentType = 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'security';

export interface Incident {
  id: string;
  type: IncidentType;
  title: string;
  description: string;
  location: string;
  reportedBy: string;
  reportedDate: string;
  severity: Severity;
  status: StageStatus;
  oshaRecordable: boolean;
  oshaFields?: {
    caseNumber?: string;
    employeeName?: string;
    jobTitle?: string;
    dateOfInjury?: string;
    bodyPartAffected?: string;
    injuryType?: string;
    daysAway?: number;
    daysRestricted?: number;
  };
  aiSuggestedDescription?: string;
  investigationId?: string;
  linkedObservationId?: string;
}

// Investigation
export interface Investigation {
  id: string;
  incidentId: string;
  investigator: string;
  startDate: string;
  completionDate?: string;
  status: StageStatus;
  fiveWhyAnalysis: string[];
  rootCauses: string[];
  contributingFactors: string[];
  evidence: { type: string; description: string; attachmentUrl?: string }[];
  aiSuggestedRootCause?: string;
  capaIds: string[];
}

// CAPA (Corrective and Preventive Actions)
export interface CAPA {
  id: string;
  title: string;
  description: string;
  sourceType: 'incident' | 'audit' | 'observation' | 'inspection';
  sourceId: string;
  assignedTo: string;
  assignedDate: string;
  dueDate: string;
  completionDate?: string;
  status: StageStatus;
  priority: Priority;
  severity: Severity;
  verificationRequired: boolean;
  verifiedBy?: string;
  verifiedDate?: string;
  escalated: boolean;
}

// Audit/Inspection
export type AuditType = 'scheduled' | 'adhoc' | 'regulatory' | 'internal';

export interface AuditFinding {
  id: string;
  category: string;
  description: string;
  compliant: boolean;
  severity: Severity;
  photoUrl?: string;
  notes?: string;
  capaId?: string;
}

export interface Audit {
  id: string;
  type: AuditType;
  title: string;
  templateName: string;
  auditor: string;
  location: string;
  scheduledDate: string;
  completionDate?: string;
  status: StageStatus;
  findings: AuditFinding[];
  complianceScore?: number;
  capaIds: string[];
}

// BBS Observation
export type BehaviorCategory = 'ppe' | 'housekeeping' | 'ergonomics' | 'procedure' | 'communication' | 'equipment';

export interface BBSObservation {
  id: string;
  observer: string;
  observedDate: string;
  location: string;
  department: string;
  safeObservations: { category: BehaviorCategory; description: string }[];
  atRiskObservations: { category: BehaviorCategory; description: string; feedback?: string }[];
  coachingNotes?: string;
  followUpRequired: boolean;
  linkedCAPAId?: string;
}

// Compliance Obligation
export type RegulatoryBody = 'OSHA' | 'EPA' | 'MSHA' | 'DOT' | 'State' | 'Local';

export interface ComplianceObligation {
  id: string;
  regulatoryBody: RegulatoryBody;
  regulation: string;
  title: string;
  description: string;
  dueDate: string;
  frequency: 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annual';
  assignedTo: string;
  status: StageStatus;
  evidenceUploaded: boolean;
  evidenceUrl?: string;
  lastCompletedDate?: string;
  escalated: boolean;
}

// Analytics/Metrics
export interface WorkflowMetrics {
  trir: number;
  ltir: number;
  observationsThisMonth: number;
  inspectionsThisMonth: number;
  incidentRateByLocation: { location: string; rate: number }[];
  capaClosureRate: number;
  complianceRate: number;
  leadingIndicators: {
    observations: number;
    inspections: number;
    trainings: number;
    audits: number;
  };
}

// ============ MOCK DATA ============

export const mockObservations: Observation[] = [
  {
    id: 'OBS-2026-001',
    type: 'unsafe_condition',
    title: 'Missing guardrail on mezzanine',
    description: 'Noticed a section of guardrail missing on the west side of the mezzanine level near the conveyor system.',
    location: 'Warehouse - Mezzanine Level',
    reportedBy: 'John Martinez',
    reportedDate: '2026-01-06T09:30:00',
    riskCategory: 'Fall Hazard',
    photoUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?w=400',
    status: 'in_progress',
    followUpActions: ['Install temporary barrier', 'Order replacement guardrail']
  },
  {
    id: 'OBS-2026-002',
    type: 'at_risk_behavior',
    title: 'Improper lifting technique observed',
    description: 'Employee lifting heavy boxes without using proper lifting technique or requesting assistance.',
    location: 'Shipping Dock B',
    reportedBy: 'Sarah Chen',
    reportedDate: '2026-01-05T14:15:00',
    behaviorType: 'Ergonomic',
    status: 'completed',
    followUpActions: ['Provide refresher training on safe lifting']
  },
  {
    id: 'OBS-2026-003',
    type: 'good_catch',
    title: 'Frayed electrical cord identified',
    description: 'Good catch! Employee noticed and reported a frayed cord on the floor polisher before use, preventing potential shock hazard.',
    location: 'Building A - Maintenance Room',
    reportedBy: 'Mike Johnson',
    reportedDate: '2026-01-05T08:45:00',
    riskCategory: 'Electrical',
    status: 'completed',
    followUpActions: ['Cord replaced', 'Added to equipment inspection checklist']
  }
];

export const mockIncidents: Incident[] = [
  {
    id: 'INC-2026-001',
    type: 'injury',
    title: 'Hand laceration from utility knife',
    description: 'Employee sustained a 2cm laceration on left hand while cutting packaging materials.',
    location: 'Packaging Area',
    reportedBy: 'Lisa Wong',
    reportedDate: '2026-01-06T11:20:00',
    severity: 'medium',
    status: 'in_progress',
    oshaRecordable: true,
    oshaFields: {
      caseNumber: 'OSHA-2026-001',
      employeeName: 'David Thompson',
      jobTitle: 'Packaging Operator',
      dateOfInjury: '2026-01-06',
      bodyPartAffected: 'Left Hand',
      injuryType: 'Laceration',
      daysAway: 0,
      daysRestricted: 3
    },
    aiSuggestedDescription: 'Worker experienced a laceration injury to the hand during material handling operations involving cutting tools.',
    investigationId: 'INV-2026-001'
  },
  {
    id: 'INC-2026-002',
    type: 'near_miss',
    title: 'Forklift near-collision with pedestrian',
    description: 'Forklift operator had to brake suddenly to avoid pedestrian who stepped into aisle without looking.',
    location: 'Warehouse Aisle 4',
    reportedBy: 'Robert Kim',
    reportedDate: '2026-01-05T15:45:00',
    severity: 'high',
    status: 'pending',
    oshaRecordable: false
  },
  {
    id: 'INC-2026-003',
    type: 'property_damage',
    title: 'Chemical spill in storage area',
    description: 'Drum of solvent tipped over during movement, resulting in approximately 5 gallon spill.',
    location: 'Chemical Storage Building',
    reportedBy: 'Emily Davis',
    reportedDate: '2026-01-04T09:00:00',
    severity: 'medium',
    status: 'completed',
    oshaRecordable: false,
    linkedObservationId: 'OBS-2025-089'
  }
];

export const mockInvestigations: Investigation[] = [
  {
    id: 'INV-2026-001',
    incidentId: 'INC-2026-001',
    investigator: 'Jennifer Adams',
    startDate: '2026-01-06T14:00:00',
    status: 'in_progress',
    fiveWhyAnalysis: [
      'Why did the laceration occur? - Knife slipped during cutting.',
      'Why did the knife slip? - Packaging material was held in an awkward position.',
      'Why was it held awkwardly? - Work surface was cluttered.',
      'Why was surface cluttered? - No designated staging area for materials.',
      'Why no designated area? - Workstation design not updated for new product line.'
    ],
    rootCauses: ['Inadequate workstation design', 'Lack of proper tool guards'],
    contributingFactors: ['Time pressure', 'Insufficient training on new products'],
    evidence: [
      { type: 'Photo', description: 'Workstation showing cluttered surface' },
      { type: 'Interview', description: 'Statement from injured employee' },
      { type: 'Video', description: 'CCTV footage of incident' }
    ],
    aiSuggestedRootCause: 'Primary root cause appears to be workstation ergonomics combined with inadequate tool selection for the task.',
    capaIds: ['CAPA-2026-001', 'CAPA-2026-002']
  }
];

export const mockCAPAs: CAPA[] = [
  {
    id: 'CAPA-2026-001',
    title: 'Redesign packaging workstation',
    description: 'Implement ergonomic workstation design with dedicated material staging area and proper tool storage.',
    sourceType: 'incident',
    sourceId: 'INC-2026-001',
    assignedTo: 'Engineering Team',
    assignedDate: '2026-01-06T16:00:00',
    dueDate: '2026-01-20',
    status: 'in_progress',
    priority: 'high',
    severity: 'medium',
    verificationRequired: true,
    escalated: false
  },
  {
    id: 'CAPA-2026-002',
    title: 'Provide safety knife with retractable blade',
    description: 'Replace standard utility knives with auto-retractable safety knives in packaging area.',
    sourceType: 'incident',
    sourceId: 'INC-2026-001',
    assignedTo: 'Safety Manager',
    assignedDate: '2026-01-06T16:00:00',
    dueDate: '2026-01-10',
    status: 'pending',
    priority: 'urgent',
    severity: 'medium',
    verificationRequired: true,
    escalated: false
  },
  {
    id: 'CAPA-2026-003',
    title: 'Install pedestrian warning system',
    description: 'Install blue safety lights and audible warnings on all forklifts. Add floor markings for pedestrian crossing zones.',
    sourceType: 'incident',
    sourceId: 'INC-2026-002',
    assignedTo: 'Facilities Manager',
    assignedDate: '2026-01-05T17:00:00',
    dueDate: '2026-01-25',
    status: 'pending',
    priority: 'high',
    severity: 'high',
    verificationRequired: true,
    escalated: false
  }
];

export const mockAudits: Audit[] = [
  {
    id: 'AUD-2026-001',
    type: 'scheduled',
    title: 'Q1 Fire Safety Inspection',
    templateName: 'NFPA 101 Life Safety',
    auditor: 'Mark Stevens',
    location: 'Building A - All Floors',
    scheduledDate: '2026-01-10T09:00:00',
    status: 'pending',
    findings: [],
    capaIds: []
  },
  {
    id: 'AUD-2026-002',
    type: 'internal',
    title: 'Monthly PPE Compliance Audit',
    templateName: 'PPE Compliance Checklist',
    auditor: 'Sandra Lee',
    location: 'Manufacturing Floor',
    scheduledDate: '2026-01-03T10:00:00',
    completionDate: '2026-01-03T12:30:00',
    status: 'completed',
    findings: [
      { id: 'F-001', category: 'PPE', description: 'Safety glasses not worn in designated area', compliant: false, severity: 'medium', capaId: 'CAPA-2025-098' },
      { id: 'F-002', category: 'PPE', description: 'All hearing protection stations stocked', compliant: true, severity: 'low' },
      { id: 'F-003', category: 'Housekeeping', description: 'Emergency exit partially blocked', compliant: false, severity: 'high', capaId: 'CAPA-2026-004' }
    ],
    complianceScore: 78,
    capaIds: ['CAPA-2025-098', 'CAPA-2026-004']
  },
  {
    id: 'AUD-2026-003',
    type: 'regulatory',
    title: 'EPA Storm Water Inspection',
    templateName: 'SWPPP Compliance',
    auditor: 'Environmental Specialist',
    location: 'Facility Perimeter',
    scheduledDate: '2026-01-15T08:00:00',
    status: 'pending',
    findings: [],
    capaIds: []
  }
];

export const mockBBSObservations: BBSObservation[] = [
  {
    id: 'BBS-2026-001',
    observer: 'Team Lead - Assembly',
    observedDate: '2026-01-06T07:30:00',
    location: 'Assembly Line 2',
    department: 'Manufacturing',
    safeObservations: [
      { category: 'ppe', description: 'All team members wearing required safety glasses' },
      { category: 'housekeeping', description: 'Work area clean and organized' }
    ],
    atRiskObservations: [
      { category: 'ergonomics', description: 'Employee reaching across conveyor instead of walking around', feedback: 'Discussed safer approach with employee' }
    ],
    coachingNotes: 'Positive overall safety culture. One employee coached on proper body positioning.',
    followUpRequired: false
  },
  {
    id: 'BBS-2026-002',
    observer: 'Safety Champion',
    observedDate: '2026-01-05T14:00:00',
    location: 'Maintenance Shop',
    department: 'Maintenance',
    safeObservations: [
      { category: 'procedure', description: 'LOTO properly applied before equipment work' },
      { category: 'equipment', description: 'Tools inspected before use' }
    ],
    atRiskObservations: [],
    coachingNotes: 'Excellent safety practices observed. Team recognized for LOTO compliance.',
    followUpRequired: false
  },
  {
    id: 'BBS-2026-003',
    observer: 'Supervisor',
    observedDate: '2026-01-04T10:15:00',
    location: 'Loading Dock',
    department: 'Logistics',
    safeObservations: [
      { category: 'ppe', description: 'High-visibility vests worn by all dock workers' }
    ],
    atRiskObservations: [
      { category: 'communication', description: 'Verbal communication difficult due to noise', feedback: 'Discussed using hand signals' },
      { category: 'procedure', description: 'Trailer not chocked before unloading', feedback: 'Immediate correction made' }
    ],
    coachingNotes: 'Trailer chocking procedure reinforced. Will schedule refresher training.',
    followUpRequired: true,
    linkedCAPAId: 'CAPA-2026-005'
  }
];

export const mockComplianceObligations: ComplianceObligation[] = [
  {
    id: 'COMP-2026-001',
    regulatoryBody: 'OSHA',
    regulation: '29 CFR 1910.134',
    title: 'Respiratory Protection Program Review',
    description: 'Annual review and update of respiratory protection program documentation.',
    dueDate: '2026-02-01',
    frequency: 'annual',
    assignedTo: 'Safety Manager',
    status: 'pending',
    evidenceUploaded: false,
    escalated: false
  },
  {
    id: 'COMP-2026-002',
    regulatoryBody: 'EPA',
    regulation: '40 CFR Part 112',
    title: 'SPCC Plan Certification',
    description: 'Spill Prevention Control and Countermeasure plan annual certification.',
    dueDate: '2026-01-15',
    frequency: 'annual',
    assignedTo: 'Environmental Manager',
    status: 'in_progress',
    evidenceUploaded: false,
    escalated: false
  },
  {
    id: 'COMP-2026-003',
    regulatoryBody: 'OSHA',
    regulation: '29 CFR 1910.147',
    title: 'LOTO Periodic Inspection',
    description: 'Annual inspection of energy control procedures for all authorized employees.',
    dueDate: '2026-01-30',
    frequency: 'annual',
    assignedTo: 'Maintenance Supervisor',
    status: 'pending',
    evidenceUploaded: false,
    escalated: false
  }
];

export const mockMetrics: WorkflowMetrics = {
  trir: 2.3,
  ltir: 0.8,
  observationsThisMonth: 47,
  inspectionsThisMonth: 12,
  incidentRateByLocation: [
    { location: 'Manufacturing', rate: 3.2 },
    { location: 'Warehouse', rate: 2.1 },
    { location: 'Office', rate: 0.4 },
    { location: 'Loading Dock', rate: 4.5 }
  ],
  capaClosureRate: 82,
  complianceRate: 94,
  leadingIndicators: {
    observations: 47,
    inspections: 12,
    trainings: 156,
    audits: 8
  }
};

// Helper functions for workflow operations
export function getStageItems(stage: WorkflowStage): unknown[] {
  switch (stage) {
    case 'observation':
      return mockObservations;
    case 'incident':
      return mockIncidents;
    case 'investigation':
      return mockInvestigations;
    case 'capa':
      return mockCAPAs;
    case 'audit':
      return mockAudits;
    case 'bbs':
      return mockBBSObservations;
    case 'compliance':
      return mockComplianceObligations;
    default:
      return [];
  }
}

export function getStageCount(stage: WorkflowStage): number {
  return getStageItems(stage).length;
}

export function getStagePendingCount(stage: WorkflowStage): number {
  const items = getStageItems(stage) as { status: StageStatus }[];
  return items.filter(item => item.status === 'pending' || item.status === 'in_progress').length;
}
