// Comprehensive Risk Assessment Templates
// Aligned with ISO 45001, ISO 14001, OSHA, EPA, MSHA, and Industrial Hygiene standards

export type HazardCategory = 
  | 'Physical'
  | 'Chemical'
  | 'Biological'
  | 'Ergonomic'
  | 'Psychosocial'
  | 'Mechanical'
  | 'Electrical'
  | 'Thermal'
  | 'Radiation'
  | 'Environmental';

export type RegulatoryStandard = 
  | 'OSHA General Industry (29 CFR 1910)'
  | 'OSHA Construction (29 CFR 1926)'
  | 'MSHA (30 CFR)'
  | 'EPA (40 CFR)'
  | 'ISO 45001:2018'
  | 'ISO 14001:2015'
  | 'NIOSH Guidelines'
  | 'ACGIH TLVs'
  | 'ANSI Standards';

export type SeverityLevel = 1 | 2 | 3 | 4 | 5;
export type LikelihoodLevel = 1 | 2 | 3 | 4 | 5;

export interface ControlMeasure {
  type: 'Elimination' | 'Substitution' | 'Engineering' | 'Administrative' | 'PPE';
  description: string;
  effectiveness: 'High' | 'Medium' | 'Low';
  implemented: boolean;
}

export interface HazardTemplate {
  id: string;
  name: string;
  category: HazardCategory;
  description: string;
  potentialConsequences: string[];
  regulatoryReferences: { standard: RegulatoryStandard; citation: string }[];
  typicalSeverity: SeverityLevel;
  typicalLikelihood: LikelihoodLevel;
  suggestedControls: ControlMeasure[];
  industrialHygieneFactors?: {
    exposureLimit?: string;
    monitoringMethod?: string;
    samplingFrequency?: string;
  };
  industries: string[];
}

export interface RiskAssessmentRecord {
  id: string;
  hazardId: string;
  location: string;
  assessedBy: string;
  assessmentDate: string;
  severity: SeverityLevel;
  likelihood: LikelihoodLevel;
  riskScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  controls: ControlMeasure[];
  residualRisk: number;
  reviewDate: string;
  status: 'Draft' | 'Active' | 'Under Review' | 'Archived';
}

// Industry-Specific Checklist Types
export type IndustryType = 
  | 'Manufacturing'
  | 'Construction'
  | 'Healthcare'
  | 'Oil & Gas'
  | 'Mining'
  | 'Utilities'
  | 'Transportation'
  | 'Warehousing'
  | 'Agriculture'
  | 'Retail';

export interface ChecklistItem {
  id: string;
  question: string;
  category: string;
  required: boolean;
  helpText?: string;
  regulatoryRef?: string;
  aiSuggestion?: string;
}

export interface IndustryChecklist {
  id: string;
  industry: IndustryType;
  name: string;
  description: string;
  version: string;
  lastUpdated: string;
  categories: string[];
  items: ChecklistItem[];
  aiEnabled: boolean;
  completionEstimate: string;
}

// Severity and Likelihood Matrices
export const SEVERITY_MATRIX = {
  1: { label: 'Negligible', description: 'Minor injury requiring first aid only' },
  2: { label: 'Minor', description: 'Injury requiring medical treatment, no lost time' },
  3: { label: 'Moderate', description: 'Lost time injury, temporary disability' },
  4: { label: 'Major', description: 'Permanent disability, multiple injuries' },
  5: { label: 'Catastrophic', description: 'Fatality or multiple fatalities' }
};

export const LIKELIHOOD_MATRIX = {
  1: { label: 'Rare', description: 'May occur only in exceptional circumstances' },
  2: { label: 'Unlikely', description: 'Could occur but not expected' },
  3: { label: 'Possible', description: 'Might occur at some time' },
  4: { label: 'Likely', description: 'Will probably occur in most circumstances' },
  5: { label: 'Almost Certain', description: 'Expected to occur in most circumstances' }
};

export const calculateRiskScore = (severity: SeverityLevel, likelihood: LikelihoodLevel): number => {
  return severity * likelihood;
};

export const getRiskLevel = (score: number): 'Low' | 'Medium' | 'High' | 'Critical' => {
  if (score <= 4) return 'Low';
  if (score <= 9) return 'Medium';
  if (score <= 16) return 'High';
  return 'Critical';
};

// Industry-Specific Checklists
export const INDUSTRY_CHECKLISTS: IndustryChecklist[] = [
  // Oil & Gas Industry Checklist
  {
    id: 'og-checklist-001',
    industry: 'Oil & Gas',
    name: 'Oil & Gas Operations Safety Assessment',
    description: 'Comprehensive safety checklist for oil and gas operations covering H2S safety, well control, hydrocarbon release prevention, and process safety.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['H2S Safety', 'Well Control', 'Process Safety', 'Confined Space', 'Fire & Explosion', 'PPE', 'Emergency Response'],
    aiEnabled: true,
    completionEstimate: '45-60 minutes',
    items: [
      { id: 'og-001', question: 'Are H2S monitors calibrated and in working order?', category: 'H2S Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.1000', helpText: 'Check calibration dates and bump test before each shift' },
      { id: 'og-002', question: 'Is personal H2S detection equipment issued to all personnel?', category: 'H2S Safety', required: true, helpText: 'Verify 4-gas monitors are assigned and functional' },
      { id: 'og-003', question: 'Are wind socks/direction indicators visible and functional?', category: 'H2S Safety', required: true, helpText: 'For evacuation route planning in H2S release' },
      { id: 'og-004', question: 'Are SCBA units available and inspected monthly?', category: 'H2S Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.134', helpText: 'Self-contained breathing apparatus for rescue operations' },
      { id: 'og-005', question: 'Is the well control equipment (BOP) tested per API standards?', category: 'Well Control', required: true, regulatoryRef: 'API RP 53', helpText: 'Blowout preventer function tests documented' },
      { id: 'og-006', question: 'Are kick detection systems operational?', category: 'Well Control', required: true, helpText: 'Pit volume totalizers, flow indicators, mud weight' },
      { id: 'og-007', question: 'Is a well control drill conducted monthly?', category: 'Well Control', required: true, helpText: 'Document participants and scenarios' },
      { id: 'og-008', question: 'Are pressure relief devices inspected and certified?', category: 'Process Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.119', helpText: 'PSVs tested per manufacturer schedule' },
      { id: 'og-009', question: 'Is Process Safety Information (PSI) current and accessible?', category: 'Process Safety', required: true, regulatoryRef: 'OSHA PSM 1910.119', helpText: 'P&IDs, SDSs, operating procedures' },
      { id: 'og-010', question: 'Are Management of Change (MOC) procedures followed?', category: 'Process Safety', required: true, helpText: 'All modifications reviewed and approved' },
      { id: 'og-011', question: 'Is confined space entry permit system implemented?', category: 'Confined Space', required: true, regulatoryRef: 'OSHA 29 CFR 1910.146', helpText: 'Permits issued for all PRCS entries' },
      { id: 'og-012', question: 'Is atmospheric testing conducted before confined space entry?', category: 'Confined Space', required: true, helpText: 'O2, LEL, H2S, CO monitoring' },
      { id: 'og-013', question: 'Are fire extinguishers and suppression systems inspected?', category: 'Fire & Explosion', required: true, regulatoryRef: 'OSHA 29 CFR 1910.157', helpText: 'Monthly visual, annual maintenance' },
      { id: 'og-014', question: 'Is hot work permit system in place and followed?', category: 'Fire & Explosion', required: true, helpText: 'Gas testing before and during hot work' },
      { id: 'og-015', question: 'Are flame-resistant (FR) coveralls worn by all personnel?', category: 'PPE', required: true, regulatoryRef: 'OSHA 29 CFR 1910.132', helpText: 'NFPA 2112 compliant FR clothing' },
      { id: 'og-016', question: 'Is emergency response plan current and personnel trained?', category: 'Emergency Response', required: true, helpText: 'Annual drills and plan review' },
    ]
  },
  // Mining Industry Checklist
  {
    id: 'min-checklist-001',
    industry: 'Mining',
    name: 'Mining Operations Safety Assessment',
    description: 'Comprehensive safety checklist for mining operations covering ground control, ventilation, explosives handling, and mobile equipment safety.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['Ground Control', 'Ventilation', 'Explosives', 'Mobile Equipment', 'Electrical', 'Emergency Response'],
    aiEnabled: true,
    completionEstimate: '50-70 minutes',
    items: [
      { id: 'min-001', question: 'Is the ground control plan current and implemented?', category: 'Ground Control', required: true, regulatoryRef: 'MSHA 30 CFR 57.3360', helpText: 'Review roof/rib conditions daily' },
      { id: 'min-002', question: 'Are ground support systems installed per plan?', category: 'Ground Control', required: true, helpText: 'Rock bolts, mesh, shotcrete as specified' },
      { id: 'min-003', question: 'Is scaling performed regularly in active areas?', category: 'Ground Control', required: true, helpText: 'Remove loose rock before work begins' },
      { id: 'min-004', question: 'Are ventilation surveys conducted quarterly?', category: 'Ventilation', required: true, regulatoryRef: 'MSHA 30 CFR 57.8520', helpText: 'Document air quantities and velocities' },
      { id: 'min-005', question: 'Is methane monitoring in place for underground operations?', category: 'Ventilation', required: true, helpText: 'Continuous monitoring where applicable' },
      { id: 'min-006', question: 'Are dust control measures effective?', category: 'Ventilation', required: true, regulatoryRef: 'MSHA 30 CFR 57.5001', helpText: 'Water sprays, ventilation, dust collectors' },
      { id: 'min-007', question: 'Are explosives stored per ATF and MSHA requirements?', category: 'Explosives', required: true, regulatoryRef: 'MSHA 30 CFR 57.6100', helpText: 'Type I or II magazines, proper separation' },
      { id: 'min-008', question: 'Are blasters properly certified and trained?', category: 'Explosives', required: true, helpText: 'State certification and company training' },
      { id: 'min-009', question: 'Is blast area clearance procedure followed?', category: 'Explosives', required: true, helpText: 'Guards posted, all personnel accounted for' },
      { id: 'min-010', question: 'Are mobile equipment pre-shift inspections documented?', category: 'Mobile Equipment', required: true, regulatoryRef: 'MSHA 30 CFR 57.14100', helpText: 'Brakes, steering, lights, backup alarms' },
      { id: 'min-011', question: 'Are operators certified for each piece of equipment?', category: 'Mobile Equipment', required: true, helpText: 'Task training documented' },
      { id: 'min-012', question: 'Are berms/guardrails in place on elevated roadways?', category: 'Mobile Equipment', required: true, regulatoryRef: 'MSHA 30 CFR 57.9300', helpText: 'Mid-axle height minimum' },
      { id: 'min-013', question: 'Is electrical equipment properly grounded?', category: 'Electrical', required: true, regulatoryRef: 'MSHA 30 CFR 57.12028', helpText: 'Ground continuity testing' },
      { id: 'min-014', question: 'Are trailing cables inspected and maintained?', category: 'Electrical', required: true, helpText: 'No exposed conductors, proper splices' },
      { id: 'min-015', question: 'Is mine rescue team trained and equipped?', category: 'Emergency Response', required: true, regulatoryRef: 'MSHA 30 CFR 49', helpText: 'Quarterly drills, equipment checks' },
      { id: 'min-016', question: 'Are refuge chambers/self-rescuers available?', category: 'Emergency Response', required: true, helpText: 'Within required travel distances' },
    ]
  },
  // Utilities Industry Checklist
  {
    id: 'util-checklist-001',
    industry: 'Utilities',
    name: 'Utilities Safety Assessment',
    description: 'Comprehensive safety checklist for utility operations covering high voltage electrical, natural gas, confined space, and excavation safety.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['High Voltage Electrical', 'Natural Gas', 'Confined Space', 'Excavation', 'Trenching', 'Public Safety'],
    aiEnabled: true,
    completionEstimate: '40-55 minutes',
    items: [
      { id: 'util-001', question: 'Are qualified electrical workers trained per OSHA 1910.269?', category: 'High Voltage Electrical', required: true, regulatoryRef: 'OSHA 29 CFR 1910.269', helpText: 'Qualified status documented' },
      { id: 'util-002', question: 'Are minimum approach distances maintained?', category: 'High Voltage Electrical', required: true, helpText: 'Per voltage level tables in 1910.269' },
      { id: 'util-003', question: 'Is proper grounding equipment used?', category: 'High Voltage Electrical', required: true, helpText: 'Grounds tested and properly rated' },
      { id: 'util-004', question: 'Are rubber gloves/sleeves tested and within date?', category: 'High Voltage Electrical', required: true, helpText: '6-month testing interval' },
      { id: 'util-005', question: 'Is gas leak detection equipment calibrated?', category: 'Natural Gas', required: true, regulatoryRef: 'PHMSA 49 CFR 192', helpText: 'Combustible gas indicators tested' },
      { id: 'util-006', question: 'Are gas line locates completed before excavation?', category: 'Natural Gas', required: true, helpText: '811 call 48-72 hours before dig' },
      { id: 'util-007', question: 'Is proper PPE worn for gas operations?', category: 'Natural Gas', required: true, helpText: 'FR clothing, safety glasses, hard hat' },
      { id: 'util-008', question: 'Are confined space entry procedures followed?', category: 'Confined Space', required: true, regulatoryRef: 'OSHA 29 CFR 1910.146', helpText: 'Permit, atmospheric testing, attendant' },
      { id: 'util-009', question: 'Is rescue equipment available at confined space entries?', category: 'Confined Space', required: true, helpText: 'Tripod, retrieval system, SCBA' },
      { id: 'util-010', question: 'Is excavation sloped/shored per soil classification?', category: 'Excavation', required: true, regulatoryRef: 'OSHA 29 CFR 1926.652', helpText: 'Competent person soil assessment' },
      { id: 'util-011', question: 'Are trench shields/boxes properly installed?', category: 'Trenching', required: true, helpText: 'Extend 18" above grade' },
      { id: 'util-012', question: 'Is adequate traffic control established?', category: 'Public Safety', required: true, regulatoryRef: 'MUTCD', helpText: 'Signs, cones, flaggers as required' },
      { id: 'util-013', question: 'Are work zones properly barricaded?', category: 'Public Safety', required: true, helpText: 'Prevent public access to hazards' },
    ]
  },
  // Transportation Industry Checklist
  {
    id: 'trans-checklist-001',
    industry: 'Transportation',
    name: 'Transportation & Logistics Safety Assessment',
    description: 'Comprehensive safety checklist for transportation operations covering driver safety, loading/unloading, hazmat transport, and vehicle maintenance.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['Driver Safety', 'Loading Operations', 'Hazmat Transport', 'Vehicle Maintenance', 'Fatigue Management', 'Dock Safety'],
    aiEnabled: true,
    completionEstimate: '35-50 minutes',
    items: [
      { id: 'trans-001', question: 'Are all drivers properly licensed (CDL) for vehicle class?', category: 'Driver Safety', required: true, regulatoryRef: 'FMCSA 49 CFR 383', helpText: 'Verify CDL class and endorsements' },
      { id: 'trans-002', question: 'Are pre-trip vehicle inspections completed and documented?', category: 'Driver Safety', required: true, regulatoryRef: 'FMCSA 49 CFR 396.13', helpText: 'DVIRs reviewed before dispatch' },
      { id: 'trans-003', question: 'Is seat belt use enforced for all vehicle occupants?', category: 'Driver Safety', required: true, helpText: 'Company policy and enforcement' },
      { id: 'trans-004', question: 'Are load securement requirements met?', category: 'Loading Operations', required: true, regulatoryRef: 'FMCSA 49 CFR 393', helpText: 'Proper tie-downs, weight distribution' },
      { id: 'trans-005', question: 'Are dock plates/boards inspected before use?', category: 'Loading Operations', required: true, helpText: 'Capacity ratings visible and not exceeded' },
      { id: 'trans-006', question: 'Is forklift operator certification current?', category: 'Loading Operations', required: true, regulatoryRef: 'OSHA 29 CFR 1910.178', helpText: '3-year recertification requirement' },
      { id: 'trans-007', question: 'Are hazmat placards correctly displayed?', category: 'Hazmat Transport', required: true, regulatoryRef: 'DOT 49 CFR 172.500', helpText: 'Proper placards for materials transported' },
      { id: 'trans-008', question: 'Do drivers have current hazmat endorsement?', category: 'Hazmat Transport', required: true, helpText: 'TSA background check and training' },
      { id: 'trans-009', question: 'Are shipping papers complete and accessible?', category: 'Hazmat Transport', required: true, regulatoryRef: 'DOT 49 CFR 172.200', helpText: 'Proper location per regulations' },
      { id: 'trans-010', question: 'Is PM schedule followed for all vehicles?', category: 'Vehicle Maintenance', required: true, helpText: 'Preventive maintenance documentation' },
      { id: 'trans-011', question: 'Are brake systems inspected per DOT requirements?', category: 'Vehicle Maintenance', required: true, regulatoryRef: 'FMCSA 49 CFR 396.17', helpText: 'Annual inspection certification' },
      { id: 'trans-012', question: 'Are hours of service (HOS) regulations followed?', category: 'Fatigue Management', required: true, regulatoryRef: 'FMCSA 49 CFR 395', helpText: 'ELD compliance, 11/14 hour rules' },
      { id: 'trans-013', question: 'Is fatigue management training provided?', category: 'Fatigue Management', required: true, helpText: 'Signs of fatigue, rest requirements' },
      { id: 'trans-014', question: 'Are wheel chocks used during loading/unloading?', category: 'Dock Safety', required: true, helpText: 'Prevent trailer movement' },
      { id: 'trans-015', question: 'Is dock area clear of slip/trip hazards?', category: 'Dock Safety', required: true, helpText: 'Good housekeeping practices' },
    ]
  },
  // Warehousing Industry Checklist
  {
    id: 'wh-checklist-001',
    industry: 'Warehousing',
    name: 'Warehouse & Distribution Safety Assessment',
    description: 'Comprehensive safety checklist for warehouse operations covering forklift safety, racking systems, material handling, and pedestrian safety.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['Forklift Safety', 'Racking Systems', 'Material Handling', 'Pedestrian Safety', 'Fire Safety', 'Housekeeping'],
    aiEnabled: true,
    completionEstimate: '30-45 minutes',
    items: [
      { id: 'wh-001', question: 'Are forklift operators trained and certified?', category: 'Forklift Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.178', helpText: 'Initial and 3-year recertification' },
      { id: 'wh-002', question: 'Are daily forklift inspections completed?', category: 'Forklift Safety', required: true, helpText: 'Pre-shift checklist documented' },
      { id: 'wh-003', question: 'Are seat belts worn on sit-down forklifts?', category: 'Forklift Safety', required: true, helpText: 'Tip-over protection' },
      { id: 'wh-004', question: 'Are forklift speed limits posted and followed?', category: 'Forklift Safety', required: true, helpText: 'Appropriate for conditions' },
      { id: 'wh-005', question: 'Are pallet racks inspected for damage?', category: 'Racking Systems', required: true, regulatoryRef: 'ANSI MH16.1', helpText: 'Monthly visual, annual detailed inspection' },
      { id: 'wh-006', question: 'Are rack capacity signs posted?', category: 'Racking Systems', required: true, helpText: 'Load limits visible at each bay' },
      { id: 'wh-007', question: 'Are damaged rack components removed from service?', category: 'Racking Systems', required: true, helpText: 'Tag-out and repair procedure' },
      { id: 'wh-008', question: 'Are proper lifting techniques trained and used?', category: 'Material Handling', required: true, helpText: 'Back safety, team lifts for heavy items' },
      { id: 'wh-009', question: 'Are mechanical aids available for heavy loads?', category: 'Material Handling', required: true, helpText: 'Pallet jacks, carts, lift tables' },
      { id: 'wh-010', question: 'Are pedestrian walkways clearly marked?', category: 'Pedestrian Safety', required: true, helpText: 'Floor markings, barriers' },
      { id: 'wh-011', question: 'Are mirrors/warning lights at blind intersections?', category: 'Pedestrian Safety', required: true, helpText: 'Prevent forklift-pedestrian incidents' },
      { id: 'wh-012', question: 'Is 18" clearance maintained below sprinklers?', category: 'Fire Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.159', helpText: 'No storage blocking sprinkler coverage' },
      { id: 'wh-013', question: 'Are aisles and exits clear of obstructions?', category: 'Housekeeping', required: true, regulatoryRef: 'OSHA 29 CFR 1910.22', helpText: 'Emergency egress maintained' },
      { id: 'wh-014', question: 'Is damaged packaging properly addressed?', category: 'Housekeeping', required: true, helpText: 'Spill cleanup, repackaging' },
    ]
  },
  // Agriculture Industry Checklist
  {
    id: 'ag-checklist-001',
    industry: 'Agriculture',
    name: 'Agricultural Operations Safety Assessment',
    description: 'Comprehensive safety checklist for agricultural operations covering machinery safety, pesticide handling, grain handling, and livestock operations.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['Machinery Safety', 'Pesticide Handling', 'Grain Handling', 'Livestock Safety', 'Heat Illness', 'Youth Safety'],
    aiEnabled: true,
    completionEstimate: '35-50 minutes',
    items: [
      { id: 'ag-001', question: 'Are all PTO shields and machine guards in place?', category: 'Machinery Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1928.57', helpText: 'Power take-off guards, rotating part covers' },
      { id: 'ag-002', question: 'Is ROPS installed on tractors where required?', category: 'Machinery Safety', required: true, helpText: 'Rollover protective structure with seatbelt' },
      { id: 'ag-003', question: 'Are operators trained on each piece of equipment?', category: 'Machinery Safety', required: true, helpText: 'Safe operation procedures documented' },
      { id: 'ag-004', question: 'Are pesticide applicators properly certified?', category: 'Pesticide Handling', required: true, regulatoryRef: 'EPA WPS 40 CFR 170', helpText: 'State certification current' },
      { id: 'ag-005', question: 'Are proper PPE and application equipment used?', category: 'Pesticide Handling', required: true, helpText: 'Per label requirements' },
      { id: 'ag-006', question: 'Are REI (restricted entry interval) postings displayed?', category: 'Pesticide Handling', required: true, helpText: 'Field posting requirements' },
      { id: 'ag-007', question: 'Are grain bin entry procedures followed?', category: 'Grain Handling', required: true, regulatoryRef: 'OSHA 29 CFR 1910.272', helpText: 'Lockout, attendant, lifeline' },
      { id: 'ag-008', question: 'Is grain engulfment rescue equipment available?', category: 'Grain Handling', required: true, helpText: 'Grain rescue tube, harness system' },
      { id: 'ag-009', question: 'Are combustible dust controls in place?', category: 'Grain Handling', required: true, helpText: 'Housekeeping, ventilation, ignition control' },
      { id: 'ag-010', question: 'Are animal handling facilities properly maintained?', category: 'Livestock Safety', required: true, helpText: 'Gates, chutes, pens in good repair' },
      { id: 'ag-011', question: 'Are workers trained in animal behavior?', category: 'Livestock Safety', required: true, helpText: 'Flight zone, low-stress handling' },
      { id: 'ag-012', question: 'Is a heat illness prevention program in place?', category: 'Heat Illness', required: true, regulatoryRef: 'OSHA Heat Guidance', helpText: 'Water, rest, shade, acclimatization' },
      { id: 'ag-013', question: 'Are workers trained to recognize heat illness signs?', category: 'Heat Illness', required: true, helpText: 'Symptoms and emergency response' },
      { id: 'ag-014', question: 'Are youth workers assigned only permitted tasks?', category: 'Youth Safety', required: true, regulatoryRef: 'DOL Youth Employment', helpText: 'Hazardous order restrictions' },
    ]
  },
  // Retail Industry Checklist
  {
    id: 'ret-checklist-001',
    industry: 'Retail',
    name: 'Retail Operations Safety Assessment',
    description: 'Comprehensive safety checklist for retail operations covering slip/trip/fall prevention, ergonomics, workplace violence, and fire safety.',
    version: '2.0',
    lastUpdated: '2025-12-28',
    categories: ['Slip/Trip/Fall', 'Ergonomics', 'Workplace Violence', 'Fire Safety', 'Stock Room Safety', 'Customer Safety'],
    aiEnabled: true,
    completionEstimate: '25-35 minutes',
    items: [
      { id: 'ret-001', question: 'Are wet floor signs used when floors are wet?', category: 'Slip/Trip/Fall', required: true, regulatoryRef: 'OSHA 29 CFR 1910.22', helpText: 'Immediate signage and cleanup' },
      { id: 'ret-002', question: 'Are floor mats in good condition and secured?', category: 'Slip/Trip/Fall', required: true, helpText: 'No curled edges, proper placement' },
      { id: 'ret-003', question: 'Are extension cords properly managed?', category: 'Slip/Trip/Fall', required: true, helpText: 'Covered or routed away from walkways' },
      { id: 'ret-004', question: 'Are anti-fatigue mats at checkout stations?', category: 'Ergonomics', required: true, helpText: 'For workers standing long periods' },
      { id: 'ret-005', question: 'Are step stools/ladders available for reaching high items?', category: 'Ergonomics', required: true, helpText: 'Proper equipment to prevent overreaching' },
      { id: 'ret-006', question: 'Is proper lifting technique trained?', category: 'Ergonomics', required: true, helpText: 'Merchandising, stocking activities' },
      { id: 'ret-007', question: 'Is a workplace violence prevention program in place?', category: 'Workplace Violence', required: true, regulatoryRef: 'OSHA WPV Guidelines', helpText: 'Cash handling, late night procedures' },
      { id: 'ret-008', question: 'Are employees trained in robbery response?', category: 'Workplace Violence', required: true, helpText: 'Comply, observe, notify' },
      { id: 'ret-009', question: 'Is adequate lighting in parking areas?', category: 'Workplace Violence', required: true, helpText: 'Employee safety during opening/closing' },
      { id: 'ret-010', question: 'Are fire exits unobstructed and properly marked?', category: 'Fire Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.36', helpText: 'No merchandise blocking exits' },
      { id: 'ret-011', question: 'Are fire extinguishers accessible and inspected?', category: 'Fire Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.157', helpText: 'Monthly inspection, annual service' },
      { id: 'ret-012', question: 'Is stockroom organized with proper stacking?', category: 'Stock Room Safety', required: true, helpText: 'Heavy items low, clear aisles' },
      { id: 'ret-013', question: 'Are box cutters used safely with retractable blades?', category: 'Stock Room Safety', required: true, helpText: 'Safety knives, proper technique' },
      { id: 'ret-014', question: 'Are display fixtures stable and secured?', category: 'Customer Safety', required: true, helpText: 'Prevent tip-over hazards' },
    ]
  },
  // Manufacturing Industry Checklist
  {
    id: 'mfg-checklist-001',
    industry: 'Manufacturing',
    name: 'Manufacturing Safety Assessment',
    description: 'Comprehensive safety checklist for manufacturing facilities covering machine guarding, electrical safety, material handling, and chemical exposure.',
    version: '2.1',
    lastUpdated: '2025-12-15',
    categories: ['Machine Safety', 'Electrical Safety', 'Material Handling', 'Chemical Safety', 'PPE', 'Ergonomics', 'Fire Safety'],
    aiEnabled: true,
    completionEstimate: '30-45 minutes',
    items: [
      // Machine Safety
      { id: 'mfg-001', question: 'Are all machine guards in place and properly secured?', category: 'Machine Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.212', helpText: 'Check point of operation guards, power transmission guards, and barrier guards' },
      { id: 'mfg-002', question: 'Is the lockout/tagout (LOTO) program implemented for all energy sources?', category: 'Machine Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.147', helpText: 'Verify written program, training records, and annual audits' },
      { id: 'mfg-003', question: 'Are emergency stop buttons functional and clearly marked?', category: 'Machine Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.217', helpText: 'Test all E-stops and verify red mushroom-head buttons are visible' },
      { id: 'mfg-004', question: 'Are two-hand controls and presence-sensing devices operational?', category: 'Machine Safety', required: false, helpText: 'For applicable machinery with point-of-operation hazards' },
      { id: 'mfg-005', question: 'Is regular preventive maintenance performed on all machinery?', category: 'Machine Safety', required: true, helpText: 'Check maintenance logs and schedules' },
      // Electrical Safety
      { id: 'mfg-006', question: 'Are electrical panels accessible with 36" clearance maintained?', category: 'Electrical Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.303', helpText: 'No storage within 36 inches of panels' },
      { id: 'mfg-007', question: 'Is arc flash labeling present on all electrical equipment?', category: 'Electrical Safety', required: true, regulatoryRef: 'NFPA 70E', helpText: 'Verify labels show incident energy and PPE requirements' },
      { id: 'mfg-008', question: 'Are GFCIs installed in wet/damp locations?', category: 'Electrical Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.304', helpText: 'Test GFCI functionality monthly' },
      { id: 'mfg-009', question: 'Is all electrical wiring properly insulated without damage?', category: 'Electrical Safety', required: true, helpText: 'Inspect for frayed cords, exposed wires, and damaged conduit' },
      // Material Handling
      { id: 'mfg-010', question: 'Are forklift operators properly certified?', category: 'Material Handling', required: true, regulatoryRef: 'OSHA 29 CFR 1910.178', helpText: 'Verify training certificates and 3-year recertification' },
      { id: 'mfg-011', question: 'Are daily forklift inspections documented?', category: 'Material Handling', required: true, helpText: 'Check pre-shift inspection checklists' },
      { id: 'mfg-012', question: 'Is safe stacking height maintained in storage areas?', category: 'Material Handling', required: true, helpText: 'Verify stability and clearance from sprinklers (18" minimum)' },
      { id: 'mfg-013', question: 'Are crane load capacities posted and not exceeded?', category: 'Material Handling', required: true, regulatoryRef: 'OSHA 29 CFR 1910.179', helpText: 'Check load charts and inspection records' },
      // Chemical Safety
      { id: 'mfg-014', question: 'Are Safety Data Sheets (SDS) readily accessible?', category: 'Chemical Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.1200', helpText: 'Verify SDS are available within each work area' },
      { id: 'mfg-015', question: 'Is proper chemical storage with compatible segregation in place?', category: 'Chemical Safety', required: true, helpText: 'Check for acids/bases separation, flammables cabinet' },
      { id: 'mfg-016', question: 'Are eyewash stations and safety showers functional?', category: 'Chemical Safety', required: true, regulatoryRef: 'ANSI Z358.1', helpText: 'Test weekly and document activation time (<10 seconds to reach)' },
      { id: 'mfg-017', question: 'Is spill containment equipment available and maintained?', category: 'Chemical Safety', required: true, helpText: 'Check spill kits, absorbents, and secondary containment' },
      // PPE
      { id: 'mfg-018', question: 'Is appropriate PPE available and in good condition?', category: 'PPE', required: true, regulatoryRef: 'OSHA 29 CFR 1910.132', helpText: 'Verify safety glasses, gloves, steel-toe boots, hearing protection' },
      { id: 'mfg-019', question: 'Have employees been fitted for required respirators?', category: 'PPE', required: false, regulatoryRef: 'OSHA 29 CFR 1910.134', helpText: 'Check fit-test records (annual requirement)' },
      { id: 'mfg-020', question: 'Is hearing protection worn in areas above 85 dBA?', category: 'PPE', required: true, regulatoryRef: 'OSHA 29 CFR 1910.95', helpText: 'Verify audiometric testing and noise monitoring' },
      // Ergonomics
      { id: 'mfg-021', question: 'Are workstations designed to minimize repetitive strain?', category: 'Ergonomics', required: true, helpText: 'Check workstation height, reach distances, tool design' },
      { id: 'mfg-022', question: 'Are mechanical lifting aids available for heavy objects?', category: 'Ergonomics', required: true, helpText: 'Hoists, lift assists, adjustable work surfaces' },
      { id: 'mfg-023', question: 'Is job rotation implemented for repetitive tasks?', category: 'Ergonomics', required: false, helpText: 'Review rotation schedules and task variation' },
      // Fire Safety
      { id: 'mfg-024', question: 'Are fire extinguishers inspected monthly and serviced annually?', category: 'Fire Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.157', helpText: 'Check inspection tags and service records' },
      { id: 'mfg-025', question: 'Are emergency exits clear and properly marked?', category: 'Fire Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.36', helpText: 'Verify illuminated exit signs and unobstructed pathways' },
    ]
  },
  // Construction Industry Checklist
  {
    id: 'con-checklist-001',
    industry: 'Construction',
    name: 'Construction Site Safety Assessment',
    description: 'Comprehensive safety checklist for construction sites covering fall protection, excavation safety, scaffolding, and equipment operation.',
    version: '2.3',
    lastUpdated: '2025-12-10',
    categories: ['Fall Protection', 'Excavation Safety', 'Scaffolding', 'Heavy Equipment', 'Electrical', 'PPE', 'Housekeeping'],
    aiEnabled: true,
    completionEstimate: '45-60 minutes',
    items: [
      // Fall Protection
      { id: 'con-001', question: 'Is fall protection used for work at heights of 6 feet or more?', category: 'Fall Protection', required: true, regulatoryRef: 'OSHA 29 CFR 1926.501', helpText: 'Guardrails, safety nets, or personal fall arrest systems required' },
      { id: 'con-002', question: 'Are personal fall arrest systems inspected before each use?', category: 'Fall Protection', required: true, helpText: 'Check harness, lanyard, and anchor points for damage' },
      { id: 'con-003', question: 'Are all floor holes and wall openings properly guarded?', category: 'Fall Protection', required: true, regulatoryRef: 'OSHA 29 CFR 1926.502', helpText: 'Covers must be secured and marked "HOLE"' },
      { id: 'con-004', question: 'Are leading edge workers protected with proper systems?', category: 'Fall Protection', required: true, helpText: 'Controlled access zones or fall arrest systems' },
      { id: 'con-005', question: 'Is a fall protection plan in place for work above 6 feet?', category: 'Fall Protection', required: true, helpText: 'Written plan identifying hazards and control methods' },
      // Excavation Safety
      { id: 'con-006', question: 'Has a competent person inspected excavations daily?', category: 'Excavation Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1926.651', helpText: 'Inspections required before work and after rain' },
      { id: 'con-007', question: 'Is proper sloping, shoring, or shielding used for excavations over 5 feet?', category: 'Excavation Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1926.652', helpText: 'Based on soil classification' },
      { id: 'con-008', question: 'Are excavation edges kept clear of spoils and equipment?', category: 'Excavation Safety', required: true, helpText: 'Maintain spoils at least 2 feet from edge' },
      { id: 'con-009', question: 'Is utility location (811) completed before digging?', category: 'Excavation Safety', required: true, helpText: 'Call 811 at least 48-72 hours before excavation' },
      { id: 'con-010', question: 'Are means of egress (ladders) provided within 25 feet of workers?', category: 'Excavation Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1926.651', helpText: 'In trenches 4 feet or deeper' },
      // Scaffolding
      { id: 'con-011', question: 'Is scaffolding erected by qualified personnel?', category: 'Scaffolding', required: true, regulatoryRef: 'OSHA 29 CFR 1926.451', helpText: 'Verify training records' },
      { id: 'con-012', question: 'Are scaffold platforms fully planked with secure decking?', category: 'Scaffolding', required: true, helpText: 'No more than 1" gap between planks' },
      { id: 'con-013', question: 'Are guardrails, midrails, and toeboards in place?', category: 'Scaffolding', required: true, regulatoryRef: 'OSHA 29 CFR 1926.451', helpText: 'Required at 10 feet or above' },
      { id: 'con-014', question: 'Are scaffold tags (green/yellow/red) properly displayed?', category: 'Scaffolding', required: true, helpText: 'Inspection tags indicating scaffold status' },
      { id: 'con-015', question: 'Is safe access (ladders/stairs) provided to scaffold platforms?', category: 'Scaffolding', required: true, helpText: 'No climbing on cross-braces' },
      // Heavy Equipment
      { id: 'con-016', question: 'Are heavy equipment operators properly certified?', category: 'Heavy Equipment', required: true, regulatoryRef: 'OSHA 29 CFR 1926.1427', helpText: 'Verify crane certifications and training records' },
      { id: 'con-017', question: 'Is a pre-operation inspection completed for all equipment?', category: 'Heavy Equipment', required: true, helpText: 'Daily inspection logs required' },
      { id: 'con-018', question: 'Are backup alarms and cameras functional?', category: 'Heavy Equipment', required: true, helpText: 'Test daily during pre-operation inspection' },
      { id: 'con-019', question: 'Is a spotter used when visibility is limited?', category: 'Heavy Equipment', required: true, helpText: 'Signal person with radio communication' },
      { id: 'con-020', question: 'Are crane load charts available and followed?', category: 'Heavy Equipment', required: true, regulatoryRef: 'OSHA 29 CFR 1926.1417', helpText: 'Never exceed rated capacity' },
      // Electrical
      { id: 'con-021', question: 'Is temporary electrical properly installed with GFCIs?', category: 'Electrical', required: true, regulatoryRef: 'OSHA 29 CFR 1926.404', helpText: 'All 120-volt circuits require GFCI protection' },
      { id: 'con-022', question: 'Are power lines identified and safe distances maintained?', category: 'Electrical', required: true, regulatoryRef: 'OSHA 29 CFR 1926.416', helpText: '10 feet minimum from lines up to 50kV' },
      { id: 'con-023', question: 'Are extension cords in good condition without damage?', category: 'Electrical', required: true, helpText: 'No cuts, abrasions, or exposed wiring' },
      // PPE
      { id: 'con-024', question: 'Are hard hats worn in all designated areas?', category: 'PPE', required: true, regulatoryRef: 'OSHA 29 CFR 1926.100', helpText: 'ANSI Z89.1 compliant hard hats' },
      { id: 'con-025', question: 'Is high-visibility clothing worn near equipment/traffic?', category: 'PPE', required: true, regulatoryRef: 'OSHA 29 CFR 1926.201', helpText: 'Class 2 or Class 3 vests required' },
      { id: 'con-026', question: 'Are safety glasses/goggles worn for eye hazard tasks?', category: 'PPE', required: true, regulatoryRef: 'OSHA 29 CFR 1926.102', helpText: 'Cutting, grinding, chipping, drilling' },
      // Housekeeping
      { id: 'con-027', question: 'Are walkways and work areas clear of debris?', category: 'Housekeeping', required: true, helpText: 'Daily cleanup required' },
      { id: 'con-028', question: 'Is proper waste disposal available and used?', category: 'Housekeeping', required: true, helpText: 'Dumpsters, recycling, hazmat disposal' },
      { id: 'con-029', question: 'Are materials properly stored and secured?', category: 'Housekeeping', required: true, helpText: 'No tripping hazards or unstable stacking' },
      { id: 'con-030', question: 'Is adequate lighting provided for all work areas?', category: 'Housekeeping', required: true, regulatoryRef: 'OSHA 29 CFR 1926.56', helpText: 'Minimum 5 foot-candles for general construction' },
    ]
  },
  // Healthcare Industry Checklist
  {
    id: 'hc-checklist-001',
    industry: 'Healthcare',
    name: 'Healthcare Facility Safety Assessment',
    description: 'Comprehensive safety checklist for healthcare facilities covering infection control, patient handling, hazardous drugs, and workplace violence prevention.',
    version: '2.0',
    lastUpdated: '2025-12-20',
    categories: ['Infection Control', 'Patient Handling', 'Hazardous Drugs', 'Sharps Safety', 'Workplace Violence', 'Radiation Safety', 'Emergency Preparedness'],
    aiEnabled: true,
    completionEstimate: '35-50 minutes',
    items: [
      // Infection Control
      { id: 'hc-001', question: 'Are hand hygiene stations accessible at all patient care areas?', category: 'Infection Control', required: true, regulatoryRef: 'CDC Guidelines', helpText: 'Soap/water or alcohol-based hand rub within reach' },
      { id: 'hc-002', question: 'Is appropriate PPE available for standard and transmission-based precautions?', category: 'Infection Control', required: true, regulatoryRef: 'OSHA 29 CFR 1910.1030', helpText: 'Gloves, gowns, masks, eye protection' },
      { id: 'hc-003', question: 'Are isolation rooms properly maintained with negative pressure?', category: 'Infection Control', required: true, helpText: 'For airborne precautions, verify pressure monitors' },
      { id: 'hc-004', question: 'Is proper disinfection protocol followed for equipment?', category: 'Infection Control', required: true, helpText: 'EPA-registered disinfectants, contact time adherence' },
      { id: 'hc-005', question: 'Are staff up-to-date on required immunizations?', category: 'Infection Control', required: true, helpText: 'Hepatitis B, Flu, TB screening' },
      // Patient Handling
      { id: 'hc-006', question: 'Is safe patient handling equipment available and used?', category: 'Patient Handling', required: true, regulatoryRef: 'OSHA Ergonomics Guidelines', helpText: 'Ceiling lifts, sit-to-stand, lateral transfer aids' },
      { id: 'hc-007', question: 'Have staff received training on safe patient handling techniques?', category: 'Patient Handling', required: true, helpText: 'Annual training with competency verification' },
      { id: 'hc-008', question: 'Are patient mobility assessments documented?', category: 'Patient Handling', required: true, helpText: 'Mobility score on patient chart' },
      { id: 'hc-009', question: 'Is lift equipment inspected and maintained regularly?', category: 'Patient Handling', required: true, helpText: 'Manufacturer maintenance schedule, inspection logs' },
      { id: 'hc-010', question: 'Are adequate staff available for two-person assists when needed?', category: 'Patient Handling', required: true, helpText: 'Staffing levels and call bell response' },
      // Hazardous Drugs
      { id: 'hc-011', question: 'Are hazardous drugs handled in biological safety cabinets?', category: 'Hazardous Drugs', required: true, regulatoryRef: 'USP 800', helpText: 'Class II Type B2 or containment isolator' },
      { id: 'hc-012', question: 'Is appropriate PPE worn for hazardous drug handling?', category: 'Hazardous Drugs', required: true, regulatoryRef: 'NIOSH Alert 2004-165', helpText: 'Double gloves, gown, respiratory protection as needed' },
      { id: 'hc-013', question: 'Are hazardous drugs properly labeled and stored separately?', category: 'Hazardous Drugs', required: true, helpText: 'Dedicated storage area with warning signage' },
      { id: 'hc-014', question: 'Is spill kit available in areas where hazardous drugs are handled?', category: 'Hazardous Drugs', required: true, helpText: 'Chemo spill kit with absorbent, PPE, disposal bags' },
      { id: 'hc-015', question: 'Are staff trained on hazardous drug safe handling?', category: 'Hazardous Drugs', required: true, helpText: 'Annual training with competency assessment' },
      // Sharps Safety
      { id: 'hc-016', question: 'Are sharps disposal containers available at point of use?', category: 'Sharps Safety', required: true, regulatoryRef: 'OSHA 29 CFR 1910.1030', helpText: 'Within arm\'s reach, not overfilled' },
      { id: 'hc-017', question: 'Are engineered sharps injury prevention devices used?', category: 'Sharps Safety', required: true, regulatoryRef: 'Needlestick Safety Act', helpText: 'Safety needles, needleless systems, retractable devices' },
      { id: 'hc-018', question: 'Is there a sharps injury log maintained?', category: 'Sharps Safety', required: true, helpText: 'Record type of device, procedure, circumstances' },
      { id: 'hc-019', question: 'Are sharps containers replaced before reaching fill line?', category: 'Sharps Safety', required: true, helpText: '3/4 full or at fill line maximum' },
      // Workplace Violence
      { id: 'hc-020', question: 'Is a workplace violence prevention program in place?', category: 'Workplace Violence', required: true, regulatoryRef: 'OSHA Guidelines', helpText: 'Written program with risk assessment and controls' },
      { id: 'hc-021', question: 'Are staff trained in de-escalation techniques?', category: 'Workplace Violence', required: true, helpText: 'Crisis intervention training, annual refresh' },
      { id: 'hc-022', question: 'Are panic buttons/duress alarms available in high-risk areas?', category: 'Workplace Violence', required: true, helpText: 'ED, psychiatric units, isolated work areas' },
      { id: 'hc-023', question: 'Is security staffing adequate for facility needs?', category: 'Workplace Violence', required: true, helpText: '24/7 coverage in high-risk departments' },
      { id: 'hc-024', question: 'Is there a patient/visitor flagging system for violence risk?', category: 'Workplace Violence', required: false, helpText: 'Alert system in EMR for history of aggression' },
      // Radiation Safety
      { id: 'hc-025', question: 'Are radiation warning signs posted appropriately?', category: 'Radiation Safety', required: true, regulatoryRef: '10 CFR 20', helpText: 'Caution and warning signs at controlled areas' },
      { id: 'hc-026', question: 'Do radiation workers wear personal dosimeters?', category: 'Radiation Safety', required: true, helpText: 'Monthly badge exchange and monitoring' },
      { id: 'hc-027', question: 'Are lead aprons and thyroid shields available and inspected?', category: 'Radiation Safety', required: true, helpText: 'Annual inspection for cracks and damage' },
      { id: 'hc-028', question: 'Is radiation equipment calibrated per schedule?', category: 'Radiation Safety', required: true, helpText: 'Physicist calibration records' },
      // Emergency Preparedness
      { id: 'hc-029', question: 'Are emergency codes clearly posted and staff trained?', category: 'Emergency Preparedness', required: true, helpText: 'Code Blue, Red, Silver, etc.' },
      { id: 'hc-030', question: 'Is emergency equipment (crash cart, AED) checked daily?', category: 'Emergency Preparedness', required: true, helpText: 'Documented daily checks with signature' },
    ]
  }
];

// AI Suggestion Templates for Risk Assessment
export const AI_SUGGESTIONS: Record<string, string[]> = {
  'Machine Safety': [
    'Consider implementing light curtains for automated detection of personnel entering hazard zones',
    'Review historical maintenance data to identify recurring machine failures',
    'Evaluate machine-specific risk assessment per ISO 12100 machinery safety standard'
  ],
  'Electrical Safety': [
    'Implement thermal imaging inspections to detect hot spots before failures',
    'Consider upgrading to arc-resistant switchgear in high-risk areas',
    'Review coordination study to ensure proper protective device sequencing'
  ],
  'Fall Protection': [
    'Evaluate horizontal lifeline systems for increased mobility',
    'Consider self-retracting lifelines (SRLs) with fall arrest indicators',
    'Implement rescue plan with appropriate equipment for potential fall victims'
  ],
  'Chemical Safety': [
    'Review chemical substitution opportunities for less hazardous alternatives',
    'Consider closed-system handling for high-hazard chemicals',
    'Implement exposure monitoring program for chemicals near PEL'
  ],
  'Infection Control': [
    'Review hand hygiene compliance monitoring program effectiveness',
    'Consider UV-C disinfection technology for high-touch surfaces',
    'Evaluate N95 fit-testing program for respiratory preparedness'
  ],
  'Patient Handling': [
    'Analyze injury trends to identify high-risk patient handling tasks',
    'Consider ceiling-mounted lift systems for bariatric patients',
    'Implement patient handling algorithms based on mobility assessment'
  ],
  // Oil & Gas
  'H2S Safety': [
    'Implement continuous H2S monitoring with audible/visual alarms',
    'Ensure wind direction indicators are visible from all work areas',
    'Conduct regular H2S rescue drills with SCBA equipment'
  ],
  'Well Control': [
    'Review BOP test records and ensure compliance with API RP 53',
    'Conduct well control certification training for all rig personnel',
    'Implement real-time kick detection monitoring systems'
  ],
  'Process Safety': [
    'Review Management of Change procedures for recent modifications',
    'Ensure Process Hazard Analysis (PHA) is current for all covered processes',
    'Verify mechanical integrity program covers all critical equipment'
  ],
  // Mining
  'Ground Control': [
    'Conduct geotechnical assessments before entering new areas',
    'Implement convergence monitoring in high-stress zones',
    'Review ground support design with geotechnical engineer quarterly'
  ],
  'Ventilation': [
    'Verify primary and auxiliary fan systems are operational',
    'Monitor respirable dust levels per MSHA requirements',
    'Ensure ventilation controls direct airflow away from workers'
  ],
  'Explosives': [
    'Verify explosive magazine inventories match records',
    'Review blast patterns with engineer for optimal fragmentation',
    'Ensure all personnel are clear before initiating blasts'
  ],
  // Utilities
  'High Voltage Electrical': [
    'Review arc flash study and ensure labels are current',
    'Verify rubber goods are within test dates',
    'Implement peer checking for high-energy tasks'
  ],
  'Natural Gas': [
    'Ensure CGI calibration is current before gas detection',
    'Review emergency shutdown procedures with crew',
    'Verify pipeline locations before any excavation'
  ],
  // Transportation
  'Driver Safety': [
    'Review driver MVR records quarterly for violations',
    'Implement in-cab monitoring for speed and following distance',
    'Conduct defensive driving refresher training annually'
  ],
  'Hazmat Transport': [
    'Verify all required shipping documents are complete',
    'Ensure proper placarding for all hazmat loads',
    'Review emergency response guide for materials being transported'
  ],
  'Fatigue Management': [
    'Monitor ELD data for HOS compliance patterns',
    'Educate drivers on signs of fatigue and when to pull over',
    'Ensure adequate rest facilities are available'
  ],
  // Warehousing
  'Forklift Safety': [
    'Review near-miss reports for forklift-pedestrian interactions',
    'Implement speed limiting devices in high-traffic areas',
    'Conduct periodic observation of operators for safe behaviors'
  ],
  'Racking Systems': [
    'Schedule professional rack inspection annually',
    'Implement impact sensors on rack uprights',
    'Train forklift operators on proper load placement'
  ],
  // Agriculture
  'Machinery Safety': [
    'Review PTO guard condition before seasonal use',
    'Ensure ROPS-equipped tractors have functional seatbelts',
    'Provide lockout procedures for equipment maintenance'
  ],
  'Pesticide Handling': [
    'Verify applicator certifications are current',
    'Review pesticide labels before each application',
    'Ensure decontamination facilities are available'
  ],
  'Grain Handling': [
    'Review entry procedures before each bin entry',
    'Ensure grain rescue equipment is accessible and maintained',
    'Conduct combustible dust housekeeping inspections'
  ],
  // Retail
  'Slip/Trip/Fall': [
    'Implement wet floor response procedures with designated responders',
    'Conduct regular floor condition inspections during shifts',
    'Ensure proper footwear requirements are communicated'
  ],
  'Workplace Violence': [
    'Review cash handling procedures to minimize exposure',
    'Ensure panic buttons/alarms are tested regularly',
    'Train staff on de-escalation techniques'
  ]
};

// Helper functions for Industry Checklists
export const getChecklistByIndustry = (industry: IndustryType): IndustryChecklist | undefined => {
  return INDUSTRY_CHECKLISTS.find(c => c.industry === industry);
};

export const getChecklistCategories = (checklistId: string): string[] => {
  const checklist = INDUSTRY_CHECKLISTS.find(c => c.id === checklistId);
  return checklist?.categories || [];
};

export const getChecklistItemsByCategory = (checklistId: string, category: string): ChecklistItem[] => {
  const checklist = INDUSTRY_CHECKLISTS.find(c => c.id === checklistId);
  return checklist?.items.filter(item => item.category === category) || [];
};

export const getAISuggestions = (category: string): string[] => {
  return AI_SUGGESTIONS[category] || [];
};

// Comprehensive Hazard Templates Library
export const HAZARD_TEMPLATES: HazardTemplate[] = [
  // PHYSICAL HAZARDS
  {
    id: 'PHY-001',
    name: 'Noise Exposure',
    category: 'Physical',
    description: 'Exposure to high noise levels that may cause hearing damage or impairment.',
    potentialConsequences: ['Temporary hearing loss', 'Permanent hearing loss', 'Tinnitus', 'Communication difficulties'],
    regulatoryReferences: [
      { standard: 'OSHA General Industry (29 CFR 1910)', citation: '29 CFR 1910.95' },
      { standard: 'NIOSH Guidelines', citation: 'REL 85 dBA (8-hour TWA)' },
      { standard: 'ACGIH TLVs', citation: 'TLV 85 dBA' }
    ],
    typicalSeverity: 3,
    typicalLikelihood: 4,
    suggestedControls: [
      { type: 'Elimination', description: 'Remove noise source from work area', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Install sound barriers or enclosures', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Install vibration dampening equipment', effectiveness: 'Medium', implemented: false },
      { type: 'Administrative', description: 'Rotate workers to limit exposure time', effectiveness: 'Medium', implemented: false },
      { type: 'PPE', description: 'Require hearing protection (earplugs/muffs)', effectiveness: 'Medium', implemented: false }
    ],
    industrialHygieneFactors: {
      exposureLimit: '85 dBA TWA (OSHA AL), 90 dBA TWA (OSHA PEL)',
      monitoringMethod: 'Noise dosimetry, sound level meter',
      samplingFrequency: 'Annual or when process changes'
    },
    industries: ['Manufacturing', 'Construction', 'Mining', 'Oil & Gas', 'Transportation']
  },
  {
    id: 'PHY-002',
    name: 'Vibration Exposure (Hand-Arm)',
    category: 'Physical',
    description: 'Exposure to vibration from handheld power tools causing HAVS.',
    potentialConsequences: ['Hand-arm vibration syndrome (HAVS)', 'Raynaud\'s phenomenon', 'Carpal tunnel syndrome', 'Reduced grip strength'],
    regulatoryReferences: [
      { standard: 'OSHA General Industry (29 CFR 1910)', citation: 'General Duty Clause' },
      { standard: 'NIOSH Guidelines', citation: 'Criteria for Hand-Arm Vibration' },
      { standard: 'ACGIH TLVs', citation: 'HAV TLV' }
    ],
    typicalSeverity: 3,
    typicalLikelihood: 3,
    suggestedControls: [
      { type: 'Substitution', description: 'Use low-vibration tools', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Install vibration-dampening handles', effectiveness: 'Medium', implemented: false },
      { type: 'Administrative', description: 'Limit exposure time, job rotation', effectiveness: 'Medium', implemented: false },
      { type: 'PPE', description: 'Anti-vibration gloves', effectiveness: 'Low', implemented: false }
    ],
    industrialHygieneFactors: {
      exposureLimit: '4 m/s² (8-hour exposure)',
      monitoringMethod: 'Accelerometer measurements',
      samplingFrequency: 'When new tools introduced or symptoms reported'
    },
    industries: ['Manufacturing', 'Construction', 'Mining', 'Utilities']
  },
  // CHEMICAL HAZARDS
  {
    id: 'CHE-001',
    name: 'Respiratory Sensitizers',
    category: 'Chemical',
    description: 'Exposure to chemicals that may cause respiratory sensitization or occupational asthma.',
    potentialConsequences: ['Occupational asthma', 'Chronic bronchitis', 'Respiratory sensitization', 'Permanent lung damage'],
    regulatoryReferences: [
      { standard: 'OSHA General Industry (29 CFR 1910)', citation: '29 CFR 1910.1000' },
      { standard: 'ACGIH TLVs', citation: 'Sensitizer notation' },
      { standard: 'ISO 45001:2018', citation: 'Clause 8.1.2' }
    ],
    typicalSeverity: 4,
    typicalLikelihood: 3,
    suggestedControls: [
      { type: 'Elimination', description: 'Remove sensitizing chemicals from process', effectiveness: 'High', implemented: false },
      { type: 'Substitution', description: 'Replace with non-sensitizing alternatives', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Local exhaust ventilation at source', effectiveness: 'High', implemented: false },
      { type: 'Administrative', description: 'Medical surveillance program', effectiveness: 'Medium', implemented: false },
      { type: 'PPE', description: 'Respiratory protection program', effectiveness: 'Medium', implemented: false }
    ],
    industrialHygieneFactors: {
      exposureLimit: 'Chemical-specific PEL/TLV',
      monitoringMethod: 'Air sampling, immunological testing',
      samplingFrequency: 'Quarterly or per medical surveillance schedule'
    },
    industries: ['Manufacturing', 'Healthcare', 'Agriculture', 'Construction']
  },
  // BIOLOGICAL HAZARDS
  {
    id: 'BIO-001',
    name: 'Bloodborne Pathogens',
    category: 'Biological',
    description: 'Exposure to blood and other potentially infectious materials containing pathogens.',
    potentialConsequences: ['HIV infection', 'Hepatitis B infection', 'Hepatitis C infection', 'Other bloodborne diseases'],
    regulatoryReferences: [
      { standard: 'OSHA General Industry (29 CFR 1910)', citation: '29 CFR 1910.1030' },
      { standard: 'NIOSH Guidelines', citation: 'Bloodborne Pathogen Guidance' },
      { standard: 'ISO 45001:2018', citation: 'Clause 6.1.2' }
    ],
    typicalSeverity: 5,
    typicalLikelihood: 3,
    suggestedControls: [
      { type: 'Engineering', description: 'Use sharps with engineered injury protection', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Provide sharps disposal containers at point of use', effectiveness: 'High', implemented: false },
      { type: 'Administrative', description: 'Implement Exposure Control Plan', effectiveness: 'High', implemented: false },
      { type: 'Administrative', description: 'Annual BBP training', effectiveness: 'Medium', implemented: false },
      { type: 'PPE', description: 'Appropriate PPE for task (gloves, gowns, face shields)', effectiveness: 'Medium', implemented: false }
    ],
    industrialHygieneFactors: {
      exposureLimit: 'Zero exposure goal',
      monitoringMethod: 'Exposure incident tracking, sharps log',
      samplingFrequency: 'Per incident and annual program review'
    },
    industries: ['Healthcare', 'First Responders', 'Laboratory']
  },
  // ERGONOMIC HAZARDS
  {
    id: 'ERG-001',
    name: 'Repetitive Motion Injuries',
    category: 'Ergonomic',
    description: 'Musculoskeletal disorders from repetitive tasks, awkward postures, or forceful exertions.',
    potentialConsequences: ['Carpal tunnel syndrome', 'Tendonitis', 'Back injuries', 'Shoulder disorders'],
    regulatoryReferences: [
      { standard: 'OSHA General Industry (29 CFR 1910)', citation: 'General Duty Clause (ergonomics)' },
      { standard: 'NIOSH Guidelines', citation: 'Ergonomic Guidelines' },
      { standard: 'ISO 45001:2018', citation: 'Clause 6.1.2.1' }
    ],
    typicalSeverity: 3,
    typicalLikelihood: 4,
    suggestedControls: [
      { type: 'Engineering', description: 'Ergonomic workstation design', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Mechanical assist devices', effectiveness: 'High', implemented: false },
      { type: 'Administrative', description: 'Job rotation and micro-breaks', effectiveness: 'Medium', implemented: false },
      { type: 'Administrative', description: 'Ergonomic training program', effectiveness: 'Medium', implemented: false },
      { type: 'PPE', description: 'Ergonomic tools and support equipment', effectiveness: 'Low', implemented: false }
    ],
    industries: ['Manufacturing', 'Healthcare', 'Office', 'Warehousing', 'Construction']
  },
  // ELECTRICAL HAZARDS
  {
    id: 'ELE-001',
    name: 'Electrical Shock/Electrocution',
    category: 'Electrical',
    description: 'Contact with energized electrical equipment or conductors.',
    potentialConsequences: ['Electric shock', 'Electrocution', 'Burns', 'Cardiac arrest', 'Falls from elevation'],
    regulatoryReferences: [
      { standard: 'OSHA General Industry (29 CFR 1910)', citation: '29 CFR 1910.331-335' },
      { standard: 'OSHA Construction (29 CFR 1926)', citation: '29 CFR 1926.416' },
      { standard: 'ANSI Standards', citation: 'NFPA 70E' }
    ],
    typicalSeverity: 5,
    typicalLikelihood: 2,
    suggestedControls: [
      { type: 'Elimination', description: 'De-energize equipment before work', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Install GFCIs in wet locations', effectiveness: 'High', implemented: false },
      { type: 'Engineering', description: 'Proper guarding of electrical parts', effectiveness: 'High', implemented: false },
      { type: 'Administrative', description: 'LOTO program for electrical work', effectiveness: 'High', implemented: false },
      { type: 'PPE', description: 'Arc-rated PPE per NFPA 70E', effectiveness: 'Medium', implemented: false }
    ],
    industrialHygieneFactors: {
      exposureLimit: 'Zero contact with energized parts',
      monitoringMethod: 'Equipment inspection, GFCI testing',
      samplingFrequency: 'Per LOTO procedure and monthly GFCI tests'
    },
    industries: ['All Industries']
  }
];

// Export helper functions for HAZARD_TEMPLATES
export const getHazardsByCategory = (category: HazardCategory): HazardTemplate[] => {
  return HAZARD_TEMPLATES.filter(h => h.category === category);
};

export const getHazardsByIndustry = (industry: string): HazardTemplate[] => {
  return HAZARD_TEMPLATES.filter(h => h.industries.includes(industry) || h.industries.includes('All Industries'));
};

export const getHighRiskHazards = (): HazardTemplate[] => {
  return HAZARD_TEMPLATES.filter(h => {
    const score = h.typicalSeverity * h.typicalLikelihood;
    return score >= 12;
  });
};
