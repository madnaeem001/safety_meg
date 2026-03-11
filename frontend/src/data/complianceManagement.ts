// ============================================
// COMPLIANCE MANAGEMENT - GAP ANALYSIS, CERTIFICATION TRACKING, CROSS-REFERENCE
// ============================================

import { allInternationalStandards, type InternationalStandard } from './internationalStandards';

// ============================================
// TYPES AND INTERFACES
// ============================================

export type ComplianceStatus = 'not_started' | 'in_progress' | 'partially_compliant' | 'compliant' | 'non_compliant';
export type CertificationStatus = 'not_certified' | 'in_audit' | 'certified' | 'expired' | 'suspended';
export type GapSeverity = 'critical' | 'major' | 'minor' | 'observation';
export type ControlMaturity = 'none' | 'initial' | 'managed' | 'defined' | 'measured' | 'optimized';

export interface ComplianceRequirement {
  id: string;
  standardId: string;
  clauseId: string;
  requirement: string;
  description: string;
  status: ComplianceStatus;
  maturityLevel: ControlMaturity;
  evidence: string[];
  gaps: string[];
  actionItems: string[];
  assignee?: string;
  dueDate?: string;
  lastAssessedDate?: string;
  notes: string;
}

export interface GapAnalysisItem {
  id: string;
  standardId: string;
  clauseId: string;
  clauseTitle: string;
  requirement: string;
  currentState: string;
  desiredState: string;
  gap: string;
  severity: GapSeverity;
  impact: string;
  remediation: string;
  effort: 'low' | 'medium' | 'high';
  priority: number;
  owner?: string;
  targetDate?: string;
  status: 'open' | 'in_progress' | 'resolved' | 'accepted_risk';
}

export interface CertificationRecord {
  id: string;
  standardId: string;
  standardCode: string;
  standardTitle: string;
  status: CertificationStatus;
  certificationBody?: string;
  certificateNumber?: string;
  initialCertDate?: string;
  expiryDate?: string;
  lastSurveillanceDate?: string;
  nextSurveillanceDate?: string;
  scope: string[];
  locations: string[];
  overallScore?: number;
  clauseScores: { clauseId: string; score: number; notes: string }[];
  nonConformities: { id: string; type: 'major' | 'minor'; description: string; status: 'open' | 'closed' }[];
  auditHistory: { date: string; type: string; result: string; auditor: string }[];
}

export interface StandardRelationship {
  sourceStandardId: string;
  targetStandardId: string;
  relationshipType: 'compatible' | 'integrated' | 'prerequisite' | 'complementary' | 'overlapping';
  mappedClauses: { sourceClauses: string[]; targetClauses: string[]; description: string }[];
  integrationNotes: string;
  synergies: string[];
}

export interface AuditTrailEntry {
  id: string;
  timestamp: string;
  action: 'create' | 'update' | 'delete' | 'assess' | 'approve' | 'reject';
  entityType: 'requirement' | 'gap' | 'certification' | 'evidence' | 'inspection';
  entityId: string;
  userId: string;
  userName: string;
  previousValue?: unknown;
  newValue?: unknown;
  reason?: string;
  signature?: string;
  ipAddress?: string;
  deviceInfo?: string;
}

// ============================================
// CROSS-REFERENCE MATRIX DATA
// ============================================

export const standardRelationships: StandardRelationship[] = [
  // ISO 45001 relationships
  {
    sourceStandardId: 'iso-45001',
    targetStandardId: 'iso-45003',
    relationshipType: 'integrated',
    mappedClauses: [
      { sourceClauses: ['45001-6'], targetClauses: ['45003-4', '45003-5'], description: 'Risk assessment includes psychosocial hazards' },
      { sourceClauses: ['45001-8'], targetClauses: ['45003-6'], description: 'Operational controls for psychosocial risks' },
      { sourceClauses: ['45001-7'], targetClauses: ['45003-7'], description: 'Support and resources for psychological health' }
    ],
    integrationNotes: 'ISO 45003 is designed as a supplement to ISO 45001, extending OH&S to include psychological health',
    synergies: ['Unified risk assessment process', 'Shared documentation structure', 'Combined audit approach']
  },
  {
    sourceStandardId: 'iso-45001',
    targetStandardId: 'ilo-osh-2001',
    relationshipType: 'compatible',
    mappedClauses: [
      { sourceClauses: ['45001-5'], targetClauses: ['ilo-3.3'], description: 'Leadership and worker participation alignment' },
      { sourceClauses: ['45001-6'], targetClauses: ['ilo-3.4'], description: 'Planning requirements compatibility' },
      { sourceClauses: ['45001-9'], targetClauses: ['ilo-3.5'], description: 'Performance evaluation and monitoring' }
    ],
    integrationNotes: 'ILO-OSH 2001 provides the foundation that ISO 45001 builds upon',
    synergies: ['Both use PDCA approach', 'Worker participation requirements align', 'Compatible audit frameworks']
  },
  {
    sourceStandardId: 'iso-45001',
    targetStandardId: 'iso-27001',
    relationshipType: 'complementary',
    mappedClauses: [
      { sourceClauses: ['45001-4'], targetClauses: ['27001-4'], description: 'Context of organization (Annex SL structure)' },
      { sourceClauses: ['45001-5'], targetClauses: ['27001-5'], description: 'Leadership requirements' },
      { sourceClauses: ['45001-7'], targetClauses: ['27001-7'], description: 'Support requirements (competence, awareness)' }
    ],
    integrationNotes: 'Both follow ISO Annex SL structure enabling Integrated Management System (IMS)',
    synergies: ['Single IMS audit', 'Unified documentation', 'Shared management review', 'Integrated risk approach']
  },
  {
    sourceStandardId: 'iso-45001',
    targetStandardId: 'iso-31000',
    relationshipType: 'complementary',
    mappedClauses: [
      { sourceClauses: ['45001-6'], targetClauses: ['31000-6'], description: 'Risk assessment process alignment' }
    ],
    integrationNotes: 'ISO 31000 provides the overarching risk management framework that supports ISO 45001 risk-based approach',
    synergies: ['Consistent risk terminology', 'Aligned risk criteria', 'Unified risk register']
  },
  // ISO 27001 relationships
  {
    sourceStandardId: 'iso-27001',
    targetStandardId: 'iso-27701',
    relationshipType: 'integrated',
    mappedClauses: [
      { sourceClauses: ['27001-4', '27001-5', '27001-6', '27001-7', '27001-8'], targetClauses: ['27701-5'], description: 'Extended ISMS requirements for privacy' },
      { sourceClauses: ['27001-A'], targetClauses: ['27701-6'], description: 'Privacy-specific control guidance' }
    ],
    integrationNotes: 'ISO 27701 is a direct extension of ISO 27001 adding privacy management',
    synergies: ['Single certification audit', 'Shared controls', 'Unified policy framework']
  },
  {
    sourceStandardId: 'iso-27001',
    targetStandardId: 'iso-22301',
    relationshipType: 'complementary',
    mappedClauses: [
      { sourceClauses: ['27001-4'], targetClauses: ['22301-4'], description: 'Context and scope alignment' },
      { sourceClauses: ['27001-6'], targetClauses: ['22301-6'], description: 'Planning and risk-based thinking' },
      { sourceClauses: ['27001-8'], targetClauses: ['22301-8'], description: 'Operational requirements' }
    ],
    integrationNotes: 'Business continuity directly supports information security availability objectives',
    synergies: ['Integrated incident response', 'Combined BIA and risk assessment', 'Shared recovery planning']
  },
  // Sector-specific relationships
  {
    sourceStandardId: 'iso-13485',
    targetStandardId: 'iso-45001',
    relationshipType: 'complementary',
    mappedClauses: [
      { sourceClauses: ['13485-7'], targetClauses: ['45001-8'], description: 'Production controls and worker safety' }
    ],
    integrationNotes: 'Medical device manufacturing requires both product quality and worker safety',
    synergies: ['Unified process controls', 'Combined risk management', 'Integrated auditing']
  },
  {
    sourceStandardId: 'iso-22000',
    targetStandardId: 'iso-45001',
    relationshipType: 'complementary',
    mappedClauses: [
      { sourceClauses: ['22000-7'], targetClauses: ['45001-7'], description: 'Resource and competence requirements' },
      { sourceClauses: ['22000-8'], targetClauses: ['45001-8'], description: 'Operational controls' }
    ],
    integrationNotes: 'Food safety and worker safety are interlinked in food production environments',
    synergies: ['Unified hygiene programs', 'Combined training', 'Integrated audit schedules']
  },
  // Technical standards relationships
  {
    sourceStandardId: 'iec-61508',
    targetStandardId: 'iso-26262',
    relationshipType: 'prerequisite',
    mappedClauses: [
      { sourceClauses: ['61508-1', '61508-2', '61508-3'], targetClauses: ['26262-3', '26262-4', '26262-5', '26262-6'], description: 'Automotive adaptation of functional safety' }
    ],
    integrationNotes: 'ISO 26262 is the automotive sector adaptation of IEC 61508 functional safety principles',
    synergies: ['Shared SIL/ASIL methodology', 'Compatible lifecycle models', 'Aligned verification requirements']
  },
  {
    sourceStandardId: 'iec-60364',
    targetStandardId: 'iec-61140',
    relationshipType: 'integrated',
    mappedClauses: [
      { sourceClauses: ['60364-4'], targetClauses: ['61140-4', '61140-5', '61140-6'], description: 'Protection measures alignment' }
    ],
    integrationNotes: 'IEC 61140 provides the principles that IEC 60364 applies to installations',
    synergies: ['Unified protection concepts', 'Compatible testing requirements', 'Shared terminology']
  },
  {
    sourceStandardId: 'iso-12100',
    targetStandardId: 'iec-61508',
    relationshipType: 'complementary',
    mappedClauses: [
      { sourceClauses: ['12100-5', '12100-6'], targetClauses: ['61508-1', '61508-5'], description: 'Risk assessment and safety function requirements' }
    ],
    integrationNotes: 'Machine safety risk assessment feeds into functional safety requirements',
    synergies: ['Integrated hazard analysis', 'Aligned SIL determination', 'Combined safety validation']
  }
];

// ============================================
// SAMPLE GAP ANALYSIS DATA
// ============================================

export const sampleGapAnalysis: GapAnalysisItem[] = [
  {
    id: 'gap-001',
    standardId: 'iso-45001',
    clauseId: '45001-5',
    clauseTitle: 'Leadership and Worker Participation',
    requirement: 'Top management shall demonstrate leadership and commitment by ensuring worker consultation and participation',
    currentState: 'Limited worker involvement in safety decisions; safety committee meets quarterly',
    desiredState: 'Active worker participation with monthly safety committees, hazard reporting rewards, and worker representatives on all safety projects',
    gap: 'Insufficient frequency of worker consultation; no structured hazard reporting incentive program',
    severity: 'major',
    impact: 'Reduced hazard identification; lower worker engagement in safety culture',
    remediation: 'Implement monthly safety committee meetings; create hazard reporting reward program; assign worker safety champions per department',
    effort: 'medium',
    priority: 2,
    owner: 'Safety Manager',
    targetDate: '2026-04-01',
    status: 'in_progress'
  },
  {
    id: 'gap-002',
    standardId: 'iso-45001',
    clauseId: '45001-6',
    clauseTitle: 'Planning',
    requirement: 'Organization shall determine legal and other requirements applicable to its hazards and OH&S risks',
    currentState: 'Legal register exists but is updated annually; no automated tracking of regulatory changes',
    desiredState: 'Real-time legal register with automated regulatory tracking and change notifications',
    gap: 'Annual update cycle insufficient for dynamic regulatory environment',
    severity: 'major',
    impact: 'Risk of non-compliance with new or modified regulations',
    remediation: 'Subscribe to regulatory update service; implement quarterly legal register reviews; assign legal compliance officer',
    effort: 'low',
    priority: 1,
    owner: 'Compliance Manager',
    targetDate: '2026-03-15',
    status: 'open'
  },
  {
    id: 'gap-003',
    standardId: 'iso-45001',
    clauseId: '45001-8',
    clauseTitle: 'Operation',
    requirement: 'Organization shall establish and implement a process for emergency preparedness and response',
    currentState: 'Emergency plans documented; annual drills conducted',
    desiredState: 'Comprehensive emergency response with scenario-based drills, real-time communication systems, and automated emergency notifications',
    gap: 'Limited drill frequency and scenarios; manual emergency communication',
    severity: 'minor',
    impact: 'Potential delays in emergency response coordination',
    remediation: 'Increase drill frequency to bi-annual; implement emergency mass notification system; expand drill scenarios',
    effort: 'medium',
    priority: 3,
    owner: 'Emergency Response Coordinator',
    targetDate: '2026-06-01',
    status: 'open'
  },
  {
    id: 'gap-004',
    standardId: 'iso-27001',
    clauseId: '27001-A',
    clauseTitle: 'Access Control',
    requirement: 'Access to information and application system functions shall be restricted',
    currentState: 'Role-based access control implemented; annual access reviews',
    desiredState: 'Zero-trust access model with continuous authentication, behavior analytics, and automated access provisioning/deprovisioning',
    gap: 'Infrequent access reviews; no continuous authentication or behavior monitoring',
    severity: 'major',
    impact: 'Increased risk of unauthorized access and insider threats',
    remediation: 'Implement quarterly access reviews; deploy behavior analytics; automate access lifecycle management',
    effort: 'high',
    priority: 1,
    owner: 'IT Security Manager',
    targetDate: '2026-05-01',
    status: 'in_progress'
  },
  {
    id: 'gap-005',
    standardId: 'iso-22301',
    clauseId: '22301-8',
    clauseTitle: 'Operation',
    requirement: 'Organization shall exercise and test business continuity procedures',
    currentState: 'Annual tabletop exercises for critical systems',
    desiredState: 'Comprehensive exercise program including tabletop, simulation, and full-scale tests across all critical functions',
    gap: 'Limited exercise types and scope',
    severity: 'minor',
    impact: 'Untested recovery procedures for non-critical but important functions',
    remediation: 'Develop 3-year exercise calendar; include simulation exercises; expand to all business functions',
    effort: 'medium',
    priority: 4,
    owner: 'BC Manager',
    targetDate: '2026-07-01',
    status: 'open'
  }
];

// ============================================
// SAMPLE CERTIFICATION RECORDS
// ============================================

export const sampleCertifications: CertificationRecord[] = [
  {
    id: 'cert-001',
    standardId: 'iso-45001',
    standardCode: 'ISO 45001:2018',
    standardTitle: 'Occupational Health and Safety Management Systems',
    status: 'certified',
    certificationBody: 'Bureau Veritas',
    certificateNumber: 'OH&S-2024-45001-12345',
    initialCertDate: '2024-06-15',
    expiryDate: '2027-06-14',
    lastSurveillanceDate: '2025-06-10',
    nextSurveillanceDate: '2026-06-15',
    scope: ['Manufacturing operations', 'Warehouse and logistics', 'Office administration'],
    locations: ['Main Plant - Chicago, IL', 'Distribution Center - Atlanta, GA'],
    overallScore: 92,
    clauseScores: [
      { clauseId: '45001-4', score: 95, notes: 'Strong context analysis' },
      { clauseId: '45001-5', score: 88, notes: 'Leadership commitment evident; worker participation can be improved' },
      { clauseId: '45001-6', score: 90, notes: 'Comprehensive risk assessment' },
      { clauseId: '45001-7', score: 94, notes: 'Excellent training programs' },
      { clauseId: '45001-8', score: 92, notes: 'Strong operational controls' },
      { clauseId: '45001-9', score: 93, notes: 'Good monitoring systems' },
      { clauseId: '45001-10', score: 91, notes: 'Effective improvement process' }
    ],
    nonConformities: [
      { id: 'nc-001', type: 'minor', description: 'Contractor safety training records incomplete', status: 'closed' },
      { id: 'nc-002', type: 'minor', description: 'Emergency drill documentation missing for one location', status: 'closed' }
    ],
    auditHistory: [
      { date: '2024-06-15', type: 'Initial Certification', result: 'Certified', auditor: 'John Smith' },
      { date: '2025-06-10', type: 'Surveillance 1', result: 'Maintained', auditor: 'Jane Doe' }
    ]
  },
  {
    id: 'cert-002',
    standardId: 'iso-27001',
    standardCode: 'ISO/IEC 27001:2022',
    standardTitle: 'Information Security Management Systems',
    status: 'in_audit',
    certificationBody: 'BSI Group',
    scope: ['IT infrastructure', 'Cloud services', 'Customer data processing'],
    locations: ['Headquarters - New York, NY', 'Data Center - Virginia'],
    overallScore: undefined,
    clauseScores: [],
    nonConformities: [],
    auditHistory: [
      { date: '2026-01-20', type: 'Stage 1 Audit', result: 'Proceed to Stage 2', auditor: 'Michael Chen' }
    ]
  },
  {
    id: 'cert-003',
    standardId: 'iso-22301',
    standardCode: 'ISO 22301:2019',
    standardTitle: 'Business Continuity Management Systems',
    status: 'not_certified',
    scope: ['Critical business operations', 'IT systems', 'Supply chain'],
    locations: ['All locations'],
    overallScore: undefined,
    clauseScores: [],
    nonConformities: [],
    auditHistory: []
  },
  {
    id: 'cert-004',
    standardId: 'iso-22000',
    standardCode: 'ISO 22000:2018',
    standardTitle: 'Food Safety Management Systems',
    status: 'certified',
    certificationBody: 'SGS',
    certificateNumber: 'FSMS-2023-22000-98765',
    initialCertDate: '2023-09-01',
    expiryDate: '2026-08-31',
    lastSurveillanceDate: '2025-09-05',
    nextSurveillanceDate: '2026-03-01',
    scope: ['Food manufacturing', 'Packaging', 'Cold chain logistics'],
    locations: ['Food Processing Plant - Denver, CO'],
    overallScore: 96,
    clauseScores: [
      { clauseId: '22000-4', score: 95, notes: 'Clear scope definition' },
      { clauseId: '22000-7', score: 97, notes: 'Excellent food safety team' },
      { clauseId: '22000-8', score: 96, notes: 'Robust HACCP plan' }
    ],
    nonConformities: [],
    auditHistory: [
      { date: '2023-09-01', type: 'Initial Certification', result: 'Certified', auditor: 'Sarah Wilson' },
      { date: '2024-09-03', type: 'Surveillance 1', result: 'Maintained', auditor: 'Tom Brown' },
      { date: '2025-09-05', type: 'Surveillance 2', result: 'Maintained', auditor: 'Sarah Wilson' }
    ]
  }
];

// ============================================
// SAMPLE AUDIT TRAIL
// ============================================

export const sampleAuditTrail: AuditTrailEntry[] = [
  {
    id: 'audit-001',
    timestamp: '2026-02-05T09:15:32Z',
    action: 'update',
    entityType: 'gap',
    entityId: 'gap-001',
    userId: 'user-001',
    userName: 'Alex Johnson',
    previousValue: { status: 'open' },
    newValue: { status: 'in_progress' },
    reason: 'Started implementation of monthly safety committee meetings',
    deviceInfo: 'Chrome 121 / Windows 11'
  },
  {
    id: 'audit-002',
    timestamp: '2026-02-05T08:30:00Z',
    action: 'create',
    entityType: 'evidence',
    entityId: 'evidence-023',
    userId: 'user-002',
    userName: 'Maria Garcia',
    newValue: { fileName: 'emergency_drill_report_2026-02.pdf', type: 'Emergency Drill Report' },
    reason: 'Uploaded Q1 emergency drill documentation'
  },
  {
    id: 'audit-003',
    timestamp: '2026-02-04T16:45:12Z',
    action: 'assess',
    entityType: 'requirement',
    entityId: 'req-045',
    userId: 'user-001',
    userName: 'Alex Johnson',
    previousValue: { maturityLevel: 'managed' },
    newValue: { maturityLevel: 'defined' },
    reason: 'Formal procedures now documented and approved',
    signature: 'Alex Johnson (Digital Signature Verified)'
  }
];

// ============================================
// SIF PRECURSOR DETECTION
// ============================================

export interface SIFIndicator {
  id: string;
  incidentId: string;
  incidentTitle: string;
  incidentDate: string;
  sifPotential: 'high' | 'medium' | 'low';
  indicators: string[];
  riskScore: number;
  energyType: string;
  controlsDeficient: string[];
  recommendations: string[];
  acknowledged: boolean;
}

export const sifIndicators: SIFIndicator[] = [
  {
    id: 'sif-001',
    incidentId: 'inc-2026-0142',
    incidentTitle: 'Near miss - Forklift near pedestrian',
    incidentDate: '2026-02-03',
    sifPotential: 'high',
    indicators: [
      'High-energy equipment involved (powered industrial truck)',
      'Pedestrian struck-by potential',
      'Control failure (designated walkway not used)',
      'No physical barriers between equipment and pedestrians'
    ],
    riskScore: 85,
    energyType: 'Kinetic - Vehicle/Equipment',
    controlsDeficient: [
      'Physical separation barriers',
      'Pedestrian walkway enforcement',
      'Forklift speed monitoring'
    ],
    recommendations: [
      'Install physical barriers at high-traffic intersections',
      'Implement proximity warning systems on forklifts',
      'Add speed limiters in pedestrian areas',
      'Conduct refresher training on traffic management'
    ],
    acknowledged: false
  },
  {
    id: 'sif-002',
    incidentId: 'inc-2026-0138',
    incidentTitle: 'Scaffold platform inspection finding',
    incidentDate: '2026-02-01',
    sifPotential: 'high',
    indicators: [
      'Fall-from-height potential (>6 feet)',
      'Missing toe board identified',
      'Guardrail not properly secured',
      'Multiple workers exposed'
    ],
    riskScore: 78,
    energyType: 'Gravity - Fall',
    controlsDeficient: [
      'Scaffold inspection checklist compliance',
      'Pre-use inspection documentation',
      'Competent person oversight'
    ],
    recommendations: [
      'Mandatory scaffold inspection before each shift',
      'Digital checklist with photo documentation',
      'Competent person sign-off requirement',
      'Stop work authority reinforcement'
    ],
    acknowledged: true
  },
  {
    id: 'sif-003',
    incidentId: 'inc-2026-0135',
    incidentTitle: 'LOTO procedure bypass reported',
    incidentDate: '2026-01-30',
    sifPotential: 'high',
    indicators: [
      'Lockout/Tagout procedure not followed',
      'Hazardous energy (electrical 480V)',
      'Worker near point of operation',
      'Production pressure cited as reason'
    ],
    riskScore: 92,
    energyType: 'Electrical',
    controlsDeficient: [
      'LOTO compliance verification',
      'Supervisor oversight during maintenance',
      'Production vs safety culture balance'
    ],
    recommendations: [
      'Implement LOTO verification checklist with supervisor sign-off',
      'Add production penalty for LOTO bypass',
      'Leadership safety commitment messaging',
      'Anonymous reporting reinforcement'
    ],
    acknowledged: false
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getGapsByStandard = (standardId: string): GapAnalysisItem[] => {
  return sampleGapAnalysis.filter(gap => gap.standardId === standardId);
};

export const getGapsBySeverity = (severity: GapSeverity): GapAnalysisItem[] => {
  return sampleGapAnalysis.filter(gap => gap.severity === severity);
};

export const getCertificationByStandard = (standardId: string): CertificationRecord | undefined => {
  return sampleCertifications.find(cert => cert.standardId === standardId);
};

export const getRelatedStandards = (standardId: string): StandardRelationship[] => {
  return standardRelationships.filter(
    rel => rel.sourceStandardId === standardId || rel.targetStandardId === standardId
  );
};

export const calculateComplianceScore = (gaps: GapAnalysisItem[]): number => {
  if (gaps.length === 0) return 100;
  
  const weights = { critical: 25, major: 15, minor: 5, observation: 1 };
  const totalWeight = gaps.reduce((sum, gap) => sum + weights[gap.severity], 0);
  const resolvedWeight = gaps
    .filter(gap => gap.status === 'resolved')
    .reduce((sum, gap) => sum + weights[gap.severity], 0);
  
  return Math.max(0, 100 - totalWeight + resolvedWeight);
};

export const getSIFAlerts = (acknowledged: boolean = false): SIFIndicator[] => {
  return sifIndicators.filter(sif => sif.acknowledged === acknowledged);
};

export const getHighRiskSIFs = (): SIFIndicator[] => {
  return sifIndicators.filter(sif => sif.sifPotential === 'high' && !sif.acknowledged);
};

// Build cross-reference matrix
export const buildCrossReferenceMatrix = (): Map<string, Map<string, StandardRelationship>> => {
  const matrix = new Map<string, Map<string, StandardRelationship>>();
  
  standardRelationships.forEach(rel => {
    if (!matrix.has(rel.sourceStandardId)) {
      matrix.set(rel.sourceStandardId, new Map());
    }
    matrix.get(rel.sourceStandardId)!.set(rel.targetStandardId, rel);
    
    // Also add reverse relationship
    if (!matrix.has(rel.targetStandardId)) {
      matrix.set(rel.targetStandardId, new Map());
    }
    matrix.get(rel.targetStandardId)!.set(rel.sourceStandardId, rel);
  });
  
  return matrix;
};

// Storage keys for persistence
const STORAGE_KEYS = {
  GAP_ANALYSIS: 'safety_ehs_gap_analysis',
  CERTIFICATIONS: 'safety_ehs_certifications',
  AUDIT_TRAIL: 'safety_ehs_audit_trail',
  SIF_INDICATORS: 'safety_ehs_sif_indicators'
};

export const loadGapAnalysis = (): GapAnalysisItem[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.GAP_ANALYSIS);
    return stored ? JSON.parse(stored) : sampleGapAnalysis;
  } catch {
    return sampleGapAnalysis;
  }
};

export const saveGapAnalysis = (gaps: GapAnalysisItem[]): void => {
  localStorage.setItem(STORAGE_KEYS.GAP_ANALYSIS, JSON.stringify(gaps));
};

export const loadCertifications = (): CertificationRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.CERTIFICATIONS);
    return stored ? JSON.parse(stored) : sampleCertifications;
  } catch {
    return sampleCertifications;
  }
};

export const saveCertifications = (certs: CertificationRecord[]): void => {
  localStorage.setItem(STORAGE_KEYS.CERTIFICATIONS, JSON.stringify(certs));
};

export const addAuditEntry = (entry: Omit<AuditTrailEntry, 'id' | 'timestamp'>): AuditTrailEntry => {
  const newEntry: AuditTrailEntry = {
    ...entry,
    id: `audit-${Date.now()}`,
    timestamp: new Date().toISOString()
  };
  
  const trail = loadAuditTrail();
  trail.unshift(newEntry);
  localStorage.setItem(STORAGE_KEYS.AUDIT_TRAIL, JSON.stringify(trail.slice(0, 1000))); // Keep last 1000 entries
  
  return newEntry;
};

export const loadAuditTrail = (): AuditTrailEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.AUDIT_TRAIL);
    return stored ? JSON.parse(stored) : sampleAuditTrail;
  } catch {
    return sampleAuditTrail;
  }
};
