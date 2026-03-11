// Compliance and Procedures Mock Data
// Industry-specific safety procedures with AI-driven risk indicators and audit trails

export type Industry = 
  | 'Oil & Gas' 
  | 'Construction' 
  | 'Machine Shops' 
  | 'Manufacturing' 
  | 'Healthcare' 
  | 'Transportation' 
  | 'Warehouse';

export type RiskLevel = 'Low' | 'Medium' | 'High' | 'Critical';

export interface AIRiskIndicator {
  score: number; // 0-100
  level: RiskLevel;
  rationale: string;
  lastAnalyzed: string;
  trending: 'improving' | 'stable' | 'worsening';
}

export interface AuditTrailEvent {
  id: string;
  timestamp: string;
  action: 'Created' | 'Updated' | 'Reviewed' | 'Approved' | 'Archived';
  user: string;
  details: string;
}

export interface ProcedureStep {
  stepNumber: number;
  title: string;
  description: string;
  criticalControl: boolean;
}

export interface ComplianceProcedure {
  id: string;
  title: string;
  scope: string;
  industries: Industry[];
  isoClause?: string;
  steps: ProcedureStep[];
  lastUpdated: string;
  version: string;
  status: 'Active' | 'Under Review' | 'Deprecated';
  aiRisk: AIRiskIndicator;
  auditTrail: AuditTrailEvent[];
}

export interface ISORequirement {
  clause: string;
  title: string;
  description: string;
  applicableIndustries: Industry[];
}

// ISO 9001:2015 Requirements
export const ISO_9001_REQUIREMENTS: ISORequirement[] = [
  {
    clause: '4.1',
    title: 'Understanding the Organization and its Context',
    description: 'Determine external and internal issues relevant to purpose and strategic direction',
    applicableIndustries: ['Oil & Gas', 'Construction', 'Machine Shops', 'Manufacturing', 'Healthcare', 'Transportation', 'Warehouse']
  },
  {
    clause: '6.1',
    title: 'Actions to Address Risks and Opportunities',
    description: 'Plan actions to address risks and opportunities in the QMS',
    applicableIndustries: ['Oil & Gas', 'Construction', 'Machine Shops', 'Manufacturing', 'Healthcare', 'Transportation', 'Warehouse']
  },
  {
    clause: '7.1.6',
    title: 'Organizational Knowledge',
    description: 'Determine knowledge necessary for operation of processes and conformity of products/services',
    applicableIndustries: ['Oil & Gas', 'Manufacturing', 'Healthcare', 'Machine Shops']
  },
  {
    clause: '8.5.1',
    title: 'Control of Production and Service Provision',
    description: 'Implement production and service provision under controlled conditions',
    applicableIndustries: ['Manufacturing', 'Machine Shops', 'Healthcare', 'Oil & Gas']
  },
  {
    clause: '9.1.3',
    title: 'Analysis and Evaluation',
    description: 'Analyze and evaluate data and information from monitoring and measurement',
    applicableIndustries: ['Oil & Gas', 'Construction', 'Machine Shops', 'Manufacturing', 'Healthcare', 'Transportation', 'Warehouse']
  },
  {
    clause: '10.2',
    title: 'Nonconformity and Corrective Action',
    description: 'React to nonconformity and take corrective action to control and correct it',
    applicableIndustries: ['Oil & Gas', 'Construction', 'Machine Shops', 'Manufacturing', 'Healthcare', 'Transportation', 'Warehouse']
  }
];

// Mock Compliance Procedures with AI Risk Indicators
export const COMPLIANCE_PROCEDURES: ComplianceProcedure[] = [
  {
    id: 'PROC-001',
    title: 'Lockout/Tagout (LOTO) Procedure',
    scope: 'Establishes minimum requirements for the control of hazardous energy during servicing and maintenance of machines and equipment.',
    industries: ['Manufacturing', 'Machine Shops', 'Oil & Gas', 'Construction'],
    isoClause: '8.5.1',
    steps: [
      { stepNumber: 1, title: 'Prepare for Shutdown', description: 'Identify all energy sources and notify affected employees of impending equipment shutdown.', criticalControl: false },
      { stepNumber: 2, title: 'Machine Shutdown', description: 'Shut down the equipment using normal stopping procedures. Ensure complete cessation of operation.', criticalControl: true },
      { stepNumber: 3, title: 'Isolate Energy Sources', description: 'Locate and isolate all energy isolating devices. This includes electrical, hydraulic, pneumatic, and mechanical energy.', criticalControl: true },
      { stepNumber: 4, title: 'Apply Lockout/Tagout Devices', description: 'Apply individual locks and tags to each energy isolating device. Each worker must apply their own lock.', criticalControl: true },
      { stepNumber: 5, title: 'Release Stored Energy', description: 'Dissipate or restrain any stored or residual energy. This includes capacitors, springs, elevated parts, or pressure.', criticalControl: true },
      { stepNumber: 6, title: 'Verify Isolation', description: 'Verify the isolation by attempting to start the equipment. Ensure all controls are returned to off position.', criticalControl: true }
    ],
    lastUpdated: '2026-01-03',
    version: '3.2',
    status: 'Active',
    aiRisk: {
      score: 78,
      level: 'Medium',
      rationale: 'Recent near-miss incidents involving improper energy isolation. Training compliance at 92%. Recommend refresher training for night shift personnel.',
      lastAnalyzed: '2026-01-05T14:30:00Z',
      trending: 'stable'
    },
    auditTrail: [
      { id: 'AT-001', timestamp: '2026-01-03T10:15:00Z', action: 'Updated', user: 'Sarah Johnson', details: 'Added new step for stored energy release verification' },
      { id: 'AT-002', timestamp: '2025-12-15T09:00:00Z', action: 'Reviewed', user: 'Mike Chen', details: 'Annual review completed - no changes required' },
      { id: 'AT-003', timestamp: '2025-11-01T14:22:00Z', action: 'Approved', user: 'Dr. James Wilson', details: 'Approved for ISO 45001 compliance' }
    ]
  },
  {
    id: 'PROC-002',
    title: 'Confined Space Entry Protocol',
    scope: 'Procedures for safe entry into permit-required confined spaces including atmospheric testing, rescue plans, and attendant duties.',
    industries: ['Oil & Gas', 'Construction', 'Manufacturing', 'Warehouse'],
    isoClause: '6.1',
    steps: [
      { stepNumber: 1, title: 'Obtain Entry Permit', description: 'Complete confined space entry permit with all required information including atmospheric hazards, equipment, and rescue plan.', criticalControl: true },
      { stepNumber: 2, title: 'Pre-Entry Atmospheric Testing', description: 'Test atmosphere for oxygen content (19.5-23.5%), LEL (<10%), and toxic gases. Document all readings.', criticalControl: true },
      { stepNumber: 3, title: 'Continuous Monitoring', description: 'Maintain continuous atmospheric monitoring throughout entry. Evacuate immediately if readings exceed safe limits.', criticalControl: true },
      { stepNumber: 4, title: 'Establish Communication', description: 'Verify communication system between entrant, attendant, and rescue team. Test all equipment before entry.', criticalControl: false },
      { stepNumber: 5, title: 'Attendant Duties', description: 'Attendant must maintain visual or communication contact with entrant. Never enter the space to attempt rescue.', criticalControl: true }
    ],
    lastUpdated: '2026-01-02',
    version: '2.8',
    status: 'Active',
    aiRisk: {
      score: 45,
      level: 'Low',
      rationale: 'Strong compliance record with 100% permit completion rate. Recent equipment upgrade improved monitoring capabilities. No incidents in 18 months.',
      lastAnalyzed: '2026-01-05T14:30:00Z',
      trending: 'improving'
    },
    auditTrail: [
      { id: 'AT-004', timestamp: '2026-01-02T11:30:00Z', action: 'Updated', user: 'Carlos Rodriguez', details: 'Updated atmospheric testing thresholds per new OSHA guidance' },
      { id: 'AT-005', timestamp: '2025-12-20T16:45:00Z', action: 'Reviewed', user: 'Emily Watson', details: 'Quarterly review - added rescue team contact information' },
      { id: 'AT-006', timestamp: '2025-10-15T08:00:00Z', action: 'Approved', user: 'Dr. James Wilson', details: 'Re-approved after major revision' }
    ]
  },
  {
    id: 'PROC-003',
    title: 'Healthcare Bloodborne Pathogen Exposure Control',
    scope: 'Establishes procedures to eliminate or minimize occupational exposure to bloodborne pathogens in accordance with OSHA 29 CFR 1910.1030.',
    industries: ['Healthcare'],
    isoClause: '8.5.1',
    steps: [
      { stepNumber: 1, title: 'Universal Precautions', description: 'Treat all human blood and OPIM as if infectious. Use appropriate PPE for all patient contact activities.', criticalControl: true },
      { stepNumber: 2, title: 'Engineering Controls', description: 'Use sharps containers, self-sheathing needles, and splash guards. Inspect and replace as needed.', criticalControl: true },
      { stepNumber: 3, title: 'Work Practice Controls', description: 'Never recap needles. Dispose of sharps immediately in designated containers. Wash hands before and after patient contact.', criticalControl: true },
      { stepNumber: 4, title: 'Post-Exposure Protocol', description: 'Report exposure immediately. Document incident details. Begin post-exposure prophylaxis within 2 hours if indicated.', criticalControl: true },
      { stepNumber: 5, title: 'Recordkeeping', description: 'Maintain sharps injury log and exposure incident reports for 30 years. Ensure HIPAA compliance.', criticalControl: false }
    ],
    lastUpdated: '2026-01-04',
    version: '4.1',
    status: 'Active',
    aiRisk: {
      score: 62,
      level: 'Medium',
      rationale: 'Two needle stick incidents in Q4 2025. Investigation revealed non-compliance with self-sheathing needle usage. Corrective training scheduled.',
      lastAnalyzed: '2026-01-05T14:30:00Z',
      trending: 'worsening'
    },
    auditTrail: [
      { id: 'AT-007', timestamp: '2026-01-04T09:00:00Z', action: 'Updated', user: 'Dr. Lisa Park', details: 'Updated post-exposure protocol per CDC 2026 guidelines' },
      { id: 'AT-008', timestamp: '2025-12-28T14:15:00Z', action: 'Reviewed', user: 'Nurse Mary Johnson', details: 'Added new self-sheathing needle brand to approved list' },
      { id: 'AT-009', timestamp: '2025-11-20T10:30:00Z', action: 'Approved', user: 'CMO Dr. Robert Hayes', details: 'Annual review approval' }
    ]
  },
  {
    id: 'PROC-004',
    title: 'Forklift Operation and Pedestrian Safety',
    scope: 'Safe operation procedures for powered industrial trucks and pedestrian safety protocols in warehouse and manufacturing environments.',
    industries: ['Warehouse', 'Manufacturing', 'Transportation'],
    isoClause: '8.5.1',
    steps: [
      { stepNumber: 1, title: 'Pre-Operation Inspection', description: 'Complete daily inspection checklist including brakes, steering, mast, forks, lights, horn, and safety devices.', criticalControl: true },
      { stepNumber: 2, title: 'Load Handling', description: 'Never exceed rated capacity. Ensure load is balanced and secured. Travel with forks 4-6 inches above floor.', criticalControl: true },
      { stepNumber: 3, title: 'Pedestrian Zones', description: 'Sound horn at intersections and blind spots. Yield to pedestrians. Maintain 4-foot clearance from personnel.', criticalControl: true },
      { stepNumber: 4, title: 'Speed Limits', description: 'Observe posted speed limits. Reduce speed on wet or slippery surfaces. Never exceed 5 mph in congested areas.', criticalControl: false },
      { stepNumber: 5, title: 'Parking Procedure', description: 'Lower forks completely. Set parking brake. Turn off ignition. Remove key if leaving the forklift unattended.', criticalControl: false }
    ],
    lastUpdated: '2025-12-28',
    version: '2.5',
    status: 'Active',
    aiRisk: {
      score: 85,
      level: 'High',
      rationale: 'Pedestrian near-miss rate increased 15% in Q4. Video analysis shows operators failing to sound horn at intersections. Immediate intervention required.',
      lastAnalyzed: '2026-01-05T14:30:00Z',
      trending: 'worsening'
    },
    auditTrail: [
      { id: 'AT-010', timestamp: '2025-12-28T15:00:00Z', action: 'Updated', user: 'Tom Bradley', details: 'Added pedestrian clearance requirements based on incident analysis' },
      { id: 'AT-011', timestamp: '2025-12-01T11:20:00Z', action: 'Reviewed', user: 'Safety Committee', details: 'Quarterly review with recommendations for additional training' },
      { id: 'AT-012', timestamp: '2025-09-15T09:45:00Z', action: 'Approved', user: 'VP Operations', details: 'Approved with minor revisions' }
    ]
  },
  {
    id: 'PROC-005',
    title: 'Transportation Vehicle Pre-Trip Inspection',
    scope: 'DOT-compliant pre-trip inspection procedures for commercial motor vehicles to ensure roadworthiness and driver safety.',
    industries: ['Transportation', 'Warehouse'],
    isoClause: '8.5.1',
    steps: [
      { stepNumber: 1, title: 'Document Review', description: 'Check previous driver vehicle inspection report (DVIR). Verify any defects were corrected and signed off.', criticalControl: true },
      { stepNumber: 2, title: 'Engine Compartment', description: 'Check fluid levels, belts, hoses, and wiring. Look for leaks. Verify battery connections are secure.', criticalControl: false },
      { stepNumber: 3, title: 'Walk-Around Inspection', description: 'Inspect tires, wheels, lights, reflectors, mirrors, and safety equipment. Check for damage or missing items.', criticalControl: true },
      { stepNumber: 4, title: 'Brake System', description: 'Test service brakes, parking brake, and trailer brake connections. Check air pressure buildup and low air warning.', criticalControl: true },
      { stepNumber: 5, title: 'In-Cab Checks', description: 'Verify all gauges and warning lights function. Test horn, wipers, and heater/defroster. Adjust mirrors.', criticalControl: false },
      { stepNumber: 6, title: 'Complete DVIR', description: 'Document all findings. Report any defects. Sign and date the inspection report before departing.', criticalControl: true }
    ],
    lastUpdated: '2025-12-30',
    version: '3.0',
    status: 'Active',
    aiRisk: {
      score: 52,
      level: 'Medium',
      rationale: 'DVIR completion rate at 94%. Two brake-related roadside violations in past quarter. Enhanced brake inspection training recommended.',
      lastAnalyzed: '2026-01-05T14:30:00Z',
      trending: 'stable'
    },
    auditTrail: [
      { id: 'AT-013', timestamp: '2025-12-30T08:30:00Z', action: 'Updated', user: 'Fleet Manager Steve', details: 'Updated brake system checks per DOT audit findings' },
      { id: 'AT-014', timestamp: '2025-11-15T13:00:00Z', action: 'Reviewed', user: 'DOT Compliance Officer', details: 'Annual DOT compliance review - passed' },
      { id: 'AT-015', timestamp: '2025-08-01T10:00:00Z', action: 'Approved', user: 'Director of Transportation', details: 'Major revision approved' }
    ]
  },
  {
    id: 'PROC-006',
    title: 'Oil & Gas Hot Work Permit Procedure',
    scope: 'Authorization and safety requirements for welding, cutting, grinding, and other spark-producing operations in hazardous areas.',
    industries: ['Oil & Gas', 'Construction', 'Manufacturing'],
    isoClause: '6.1',
    steps: [
      { stepNumber: 1, title: 'Area Assessment', description: 'Survey work area for flammable materials, gases, or vapors. Minimum 35-foot radius must be free of combustibles.', criticalControl: true },
      { stepNumber: 2, title: 'Atmospheric Testing', description: 'Perform gas testing for LEL, H2S, and O2 levels. Document readings. Re-test every 4 hours or after breaks.', criticalControl: true },
      { stepNumber: 3, title: 'Permit Authorization', description: 'Complete hot work permit with area supervisor and fire watch. Obtain signatures from all required parties.', criticalControl: true },
      { stepNumber: 4, title: 'Fire Prevention Setup', description: 'Position fire extinguisher within 10 feet. Establish fire watch. Cover or shield combustibles that cannot be removed.', criticalControl: true },
      { stepNumber: 5, title: 'Fire Watch Duration', description: 'Maintain fire watch during hot work and for 60 minutes after completion. Document fire watch log entries.', criticalControl: true },
      { stepNumber: 6, title: 'Permit Closeout', description: 'Final inspection of work area. Obtain fire watch clearance signature. Return closed permit to Safety Department.', criticalControl: false }
    ],
    lastUpdated: '2026-01-01',
    version: '4.5',
    status: 'Active',
    aiRisk: {
      score: 38,
      level: 'Low',
      rationale: 'Excellent permit compliance at 100%. No hot work incidents in 24 months. Fire watch training current for all personnel.',
      lastAnalyzed: '2026-01-05T14:30:00Z',
      trending: 'improving'
    },
    auditTrail: [
      { id: 'AT-016', timestamp: '2026-01-01T07:00:00Z', action: 'Updated', user: 'HSE Manager Bill', details: 'Added H2S testing requirement for offshore operations' },
      { id: 'AT-017', timestamp: '2025-12-10T14:30:00Z', action: 'Reviewed', user: 'API Auditor', details: 'Third-party audit review - compliant with API RP 2009' },
      { id: 'AT-018', timestamp: '2025-10-01T09:15:00Z', action: 'Approved', user: 'Site Director', details: 'Annual revision approved' }
    ]
  }
];

// Industry-specific procedure templates
export const INDUSTRY_TEMPLATES: Record<Industry, string[]> = {
  'Oil & Gas': ['Hot Work Permit', 'H2S Safety', 'Drilling Operations', 'Pipeline Safety', 'Process Safety Management'],
  'Construction': ['Fall Protection', 'Scaffold Safety', 'Excavation Safety', 'Crane Operations', 'Electrical Safety'],
  'Machine Shops': ['Machine Guarding', 'CNC Operations', 'Grinding Safety', 'Tool Safety', 'Chip Handling'],
  'Manufacturing': ['LOTO', 'Ergonomics', 'Chemical Handling', 'Assembly Line Safety', 'Quality Control'],
  'Healthcare': ['Bloodborne Pathogens', 'Patient Handling', 'Radiation Safety', 'Medication Safety', 'Infection Control'],
  'Transportation': ['DOT Compliance', 'Vehicle Safety', 'Loading/Unloading', 'Fatigue Management', 'Cargo Securement'],
  'Warehouse': ['Forklift Safety', 'Racking Safety', 'Loading Dock', 'Material Handling', 'Fire Safety']
};

// Aggregate risk scores for dashboard
export const getAggregateRiskScore = (): { overall: number; byLevel: Record<RiskLevel, number> } => {
  const scores = COMPLIANCE_PROCEDURES.map(p => p.aiRisk.score);
  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  
  const byLevel: Record<RiskLevel, number> = {
    Low: COMPLIANCE_PROCEDURES.filter(p => p.aiRisk.level === 'Low').length,
    Medium: COMPLIANCE_PROCEDURES.filter(p => p.aiRisk.level === 'Medium').length,
    High: COMPLIANCE_PROCEDURES.filter(p => p.aiRisk.level === 'High').length,
    Critical: COMPLIANCE_PROCEDURES.filter(p => p.aiRisk.level === 'Critical').length
  };
  
  return { overall, byLevel };
};
