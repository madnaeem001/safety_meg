// Comprehensive Regulations Library Data
// OSHA 1910/1926, EPA, NFPA, NIOSH, SEGs, ASTM, ISO 9001/14001

export type RegulatoryBody = 
  | 'OSHA'
  | 'Cal/OSHA'
  | 'MSHA'
  | 'NRC'
  | 'EPA'
  | 'NFPA'
  | 'NIOSH'
  | 'ASTM'
  | 'ISO'
  | 'ANSI'
  | 'ACGIH'
  | 'IEC'
  | 'EN'
  | 'CSA'
  | 'AS/NZS'
  | 'OHSAS'
  | 'ILO'
  | 'HIPAA'
  | 'BSEE'
  | 'EU-OSHA'
  | 'HSE UK'
  | 'Safe Work Australia'
  | 'WorkSafeBC'
  | 'INRS'
  | 'BG'
  | 'JISHA'
  | 'KOSHA'
  | 'MOM Singapore'
  | 'DOSH Malaysia'
  | 'IOSH';

export type RegulationCategory =
  | 'General Duty'
  | 'Walking-Working Surfaces'
  | 'Means of Egress'
  | 'Occupational Health'
  | 'Hazardous Materials'
  | 'Personal Protective Equipment'
  | 'Fire Protection'
  | 'Electrical'
  | 'Machine Guarding'
  | 'Welding'
  | 'Scaffolding'
  | 'Fall Protection'
  | 'Excavations'
  | 'Cranes & Rigging'
  | 'Air Quality'
  | 'Water Quality'
  | 'Waste Management'
  | 'Quality Management'
  | 'Environmental Management'
  | 'Industrial Hygiene'
  | 'Exposure Limits'
  | 'Testing Methods'
  | 'Fire Safety'
  | 'Life Safety'
  | 'AI & Robotics'
  | 'Machinery Safety'
  | 'International Standards'
  | 'Risk Management'
  | 'Pre-Task Assessment'
  | 'Healthcare Privacy'
  | 'Offshore Safety';

export type ManagementTab = 
  | 'All Regulations'
  | 'Quality Management'
  | 'Industrial Hygiene'
  | 'International Standards'
  | 'AI & Robotics'
  | 'Risk Management'
  | 'Pre-Task Assessment';

export interface Regulation {
  id: string;
  code: string;
  title: string;
  description: string;
  regulatoryBody: RegulatoryBody;
  category: RegulationCategory;
  subpart?: string;
  cfr?: string;
  year?: number;
  jurisdiction?: 'Federal' | 'State' | 'International';
  applicableIndustries?: string[];
  keyRequirements?: string[];
  relatedStandards?: string[];
  managementTabs: ManagementTab[];
  sourceUrl?: string;
}

// OSHA 29 CFR 1910 - General Industry Standards
export const osha1910Regulations: Regulation[] = [
  // General Duty Clause
  {
    id: 'osha-1910-gd',
    code: 'Section 5(a)(1)',
    title: 'General Duty Clause',
    description: 'Each employer shall furnish to each employee employment and a place of employment which are free from recognized hazards that are causing or are likely to cause death or serious physical harm.',
    regulatoryBody: 'OSHA',
    category: 'General Duty',
    cfr: '29 CFR 1903.1',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Provide workplace free from recognized hazards',
      'Hazard must be causing or likely to cause death/serious harm',
      'Feasible means to abate hazard must exist'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  // Subpart D - Walking-Working Surfaces
  {
    id: 'osha-1910-22',
    code: '1910.22',
    title: 'General Requirements - Walking-Working Surfaces',
    description: 'Requirements for maintaining walking-working surfaces in a clean and orderly condition.',
    regulatoryBody: 'OSHA',
    category: 'Walking-Working Surfaces',
    subpart: 'Subpart D',
    cfr: '29 CFR 1910.22',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Keep surfaces clean, orderly, and sanitary',
      'Maintain floors in safe condition',
      'Provide adequate drainage'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-23',
    code: '1910.23',
    title: 'Ladders',
    description: 'Requirements for portable and fixed ladders in general industry.',
    regulatoryBody: 'OSHA',
    category: 'Walking-Working Surfaces',
    subpart: 'Subpart D',
    cfr: '29 CFR 1910.23',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Ladder rungs uniformly spaced',
      'Maximum load capacity requirements',
      'Proper ladder placement angles'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-28',
    code: '1910.28',
    title: 'Duty to Have Fall Protection',
    description: 'Requirements for fall protection systems in general industry workplaces.',
    regulatoryBody: 'OSHA',
    category: 'Fall Protection',
    subpart: 'Subpart D',
    cfr: '29 CFR 1910.28',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Protection at 4 feet or more',
      'Guardrail, safety net, or personal fall protection',
      'Protection from falling into dangerous equipment'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart E - Means of Egress
  {
    id: 'osha-1910-36',
    code: '1910.36',
    title: 'Design and Construction Requirements for Exit Routes',
    description: 'Requirements for exit route design including number, location, and construction.',
    regulatoryBody: 'OSHA',
    category: 'Means of Egress',
    subpart: 'Subpart E',
    cfr: '29 CFR 1910.36',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Minimum two exit routes',
      'Exit routes must be permanent',
      'Exits must be separated by distance'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-37',
    code: '1910.37',
    title: 'Maintenance, Safeguards, and Operational Features for Exit Routes',
    description: 'Requirements for maintaining exit routes in safe, operational condition.',
    regulatoryBody: 'OSHA',
    category: 'Means of Egress',
    subpart: 'Subpart E',
    cfr: '29 CFR 1910.37',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Keep exit routes free of obstructions',
      'Adequate lighting',
      'Exit signs visible and illuminated'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart G - Occupational Health and Environmental Control
  {
    id: 'osha-1910-94',
    code: '1910.94',
    title: 'Ventilation',
    description: 'Requirements for local exhaust ventilation for various operations.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart G',
    cfr: '29 CFR 1910.94',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Abrasive blasting ventilation',
      'Grinding, polishing, and buffing operations',
      'Spray finishing operations ventilation'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'osha-1910-95',
    code: '1910.95',
    title: 'Occupational Noise Exposure',
    description: 'Requirements for hearing conservation programs and noise exposure limits.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart G',
    cfr: '29 CFR 1910.95',
    jurisdiction: 'Federal',
    keyRequirements: [
      'PEL of 90 dBA (8-hour TWA)',
      'Hearing conservation program at 85 dBA',
      'Annual audiometric testing',
      'Hearing protection provided and used'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  // Subpart H - Hazardous Materials
  {
    id: 'osha-1910-106',
    code: '1910.106',
    title: 'Flammable Liquids',
    description: 'Requirements for handling, storage, and use of flammable liquids.',
    regulatoryBody: 'OSHA',
    category: 'Hazardous Materials',
    subpart: 'Subpart H',
    cfr: '29 CFR 1910.106',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Container and storage requirements',
      'Ventilation requirements',
      'Fire prevention measures',
      'Grounding and bonding'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-119',
    code: '1910.119',
    title: 'Process Safety Management (PSM)',
    description: 'Requirements for managing highly hazardous chemicals.',
    regulatoryBody: 'OSHA',
    category: 'Hazardous Materials',
    subpart: 'Subpart H',
    cfr: '29 CFR 1910.119',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Chemical', 'Manufacturing'],
    keyRequirements: [
      'Process hazard analysis',
      'Operating procedures',
      'Training',
      'Mechanical integrity',
      'Management of change',
      'Incident investigation'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'osha-1910-120',
    code: '1910.120',
    title: 'Hazardous Waste Operations (HAZWOPER)',
    description: 'Requirements for hazardous waste operations and emergency response.',
    regulatoryBody: 'OSHA',
    category: 'Hazardous Materials',
    subpart: 'Subpart H',
    cfr: '29 CFR 1910.120',
    jurisdiction: 'Federal',
    keyRequirements: [
      '40-hour HAZWOPER training',
      '8-hour annual refresher',
      'Site-specific safety plan',
      'Medical surveillance'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  // Subpart I - Personal Protective Equipment
  {
    id: 'osha-1910-132',
    code: '1910.132',
    title: 'General Requirements - PPE',
    description: 'General requirements for personal protective equipment.',
    regulatoryBody: 'OSHA',
    category: 'Personal Protective Equipment',
    subpart: 'Subpart I',
    cfr: '29 CFR 1910.132',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Hazard assessment',
      'PPE selection',
      'Training',
      'Employer provision of PPE'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-134',
    code: '1910.134',
    title: 'Respiratory Protection',
    description: 'Requirements for respiratory protection programs.',
    regulatoryBody: 'OSHA',
    category: 'Personal Protective Equipment',
    subpart: 'Subpart I',
    cfr: '29 CFR 1910.134',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Written respiratory protection program',
      'Medical evaluation',
      'Fit testing',
      'Training',
      'Respirator selection based on hazards'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  // Subpart L - Fire Protection
  {
    id: 'osha-1910-155',
    code: '1910.155',
    title: 'Scope, Application and Definitions Applicable to Subpart L',
    description: 'Scope and definitions for fire protection requirements.',
    regulatoryBody: 'OSHA',
    category: 'Fire Protection',
    subpart: 'Subpart L',
    cfr: '29 CFR 1910.155',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Fire prevention plan',
      'Fire detection systems',
      'Fire suppression systems'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-157',
    code: '1910.157',
    title: 'Portable Fire Extinguishers',
    description: 'Requirements for portable fire extinguishers.',
    regulatoryBody: 'OSHA',
    category: 'Fire Protection',
    subpart: 'Subpart L',
    cfr: '29 CFR 1910.157',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Mounting and distribution',
      'Monthly inspections',
      'Annual maintenance',
      'Employee training'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart O - Machine Guarding
  {
    id: 'osha-1910-212',
    code: '1910.212',
    title: 'General Requirements for All Machines',
    description: 'General machine guarding requirements.',
    regulatoryBody: 'OSHA',
    category: 'Machine Guarding',
    subpart: 'Subpart O',
    cfr: '29 CFR 1910.212',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Guard point of operation',
      'Guard nip points',
      'Anchored machines',
      'Exposure prevention'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart Q - Welding, Cutting and Brazing
  {
    id: 'osha-1910-252',
    code: '1910.252',
    title: 'General Requirements - Welding',
    description: 'General requirements for welding, cutting, and brazing operations.',
    regulatoryBody: 'OSHA',
    category: 'Welding',
    subpart: 'Subpart Q',
    cfr: '29 CFR 1910.252',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Fire prevention',
      'Hot work permits',
      'Ventilation',
      'Personal protection'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  // Subpart S - Electrical
  {
    id: 'osha-1910-303',
    code: '1910.303',
    title: 'General Requirements - Electrical',
    description: 'General requirements for electrical equipment and installations.',
    regulatoryBody: 'OSHA',
    category: 'Electrical',
    subpart: 'Subpart S',
    cfr: '29 CFR 1910.303',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Listed/labeled equipment',
      'Proper installation',
      'Working space requirements',
      'Guarding of live parts'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1910-333',
    code: '1910.333',
    title: 'Selection and Use of Work Practices',
    description: 'Safe work practices for electrical safety.',
    regulatoryBody: 'OSHA',
    category: 'Electrical',
    subpart: 'Subpart S',
    cfr: '29 CFR 1910.333',
    jurisdiction: 'Federal',
    keyRequirements: [
      'De-energized work',
      'Lockout/tagout procedures',
      'Work on or near exposed energized parts'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart Z - Toxic and Hazardous Substances
  {
    id: 'osha-1910-1000',
    code: '1910.1000',
    title: 'Air Contaminants',
    description: 'Permissible exposure limits for air contaminants.',
    regulatoryBody: 'OSHA',
    category: 'Exposure Limits',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1000',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Table Z-1: PELs for chemicals',
      'Table Z-2: Ceiling limits',
      'Table Z-3: Mineral dusts'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'osha-1910-1020',
    code: '1910.1020',
    title: 'Access to Employee Exposure and Medical Records',
    description: 'Employee access to exposure and medical records.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1020',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Employee access to records',
      '30-year retention',
      'Transfer of records requirements'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'osha-1910-1200',
    code: '1910.1200',
    title: 'Hazard Communication (HazCom)',
    description: 'Requirements for hazard communication programs.',
    regulatoryBody: 'OSHA',
    category: 'Hazardous Materials',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1200',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Written hazard communication program',
      'Safety Data Sheets (SDS)',
      'Container labeling (GHS)',
      'Employee training'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  }
];

// OSHA 29 CFR 1926 - Construction Standards
export const osha1926Regulations: Regulation[] = [
  // General Duty for Construction
  {
    id: 'osha-1926-gd',
    code: 'Section 5(a)(1)',
    title: 'General Duty Clause - Construction',
    description: 'General duty requirements applicable to construction industry employers.',
    regulatoryBody: 'OSHA',
    category: 'General Duty',
    cfr: '29 CFR 1926.20',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Provide safe workplace',
      'Safety programs and provisions',
      'Frequent and regular inspections'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  // Subpart C - General Safety and Health Provisions
  {
    id: 'osha-1926-20',
    code: '1926.20',
    title: 'General Safety and Health Provisions',
    description: 'General safety and health provisions for construction.',
    regulatoryBody: 'OSHA',
    category: 'General Duty',
    subpart: 'Subpart C',
    cfr: '29 CFR 1926.20',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Accident prevention responsibilities',
      'Competent person requirements',
      'Safety and health programs'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart D - Occupational Health and Environmental Controls
  {
    id: 'osha-1926-50',
    code: '1926.50',
    title: 'Medical Services and First Aid',
    description: 'Requirements for medical services and first aid in construction.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart D',
    cfr: '29 CFR 1926.50',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'First aid supplies',
      'Emergency medical services access',
      'First aid trained personnel'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1926-52',
    code: '1926.52',
    title: 'Occupational Noise Exposure',
    description: 'Noise exposure requirements for construction.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart D',
    cfr: '29 CFR 1926.52',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      '90 dBA PEL (8-hour TWA)',
      'Feasible engineering/administrative controls',
      'Hearing protection when controls insufficient'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'osha-1926-62',
    code: '1926.62',
    title: 'Lead in Construction',
    description: 'Requirements for lead exposure in construction.',
    regulatoryBody: 'OSHA',
    category: 'Hazardous Materials',
    subpart: 'Subpart D',
    cfr: '29 CFR 1926.62',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'PEL: 50 µg/m³',
      'Action level: 30 µg/m³',
      'Medical surveillance',
      'Exposure monitoring'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  // Subpart E - Personal Protective Equipment
  {
    id: 'osha-1926-95',
    code: '1926.95',
    title: 'Criteria for Personal Protective Equipment',
    description: 'Requirements for PPE in construction.',
    regulatoryBody: 'OSHA',
    category: 'Personal Protective Equipment',
    subpart: 'Subpart E',
    cfr: '29 CFR 1926.95',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'PPE hazard assessment',
      'Proper PPE selection',
      'Training on PPE use'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1926-100',
    code: '1926.100',
    title: 'Head Protection',
    description: 'Requirements for head protection in construction.',
    regulatoryBody: 'OSHA',
    category: 'Personal Protective Equipment',
    subpart: 'Subpart E',
    cfr: '29 CFR 1926.100',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Hard hats where objects may fall',
      'ANSI Z89.1 compliance',
      'Electrical hazard protection'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart K - Electrical
  {
    id: 'osha-1926-405',
    code: '1926.405',
    title: 'Wiring Methods, Components, and Equipment for General Use',
    description: 'Electrical wiring requirements for construction sites.',
    regulatoryBody: 'OSHA',
    category: 'Electrical',
    subpart: 'Subpart K',
    cfr: '29 CFR 1926.405',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Temporary wiring requirements',
      'GFCI protection',
      'Cord and cable requirements'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart L - Scaffolding
  {
    id: 'osha-1926-451',
    code: '1926.451',
    title: 'General Requirements - Scaffolds',
    description: 'General requirements for scaffolding in construction.',
    regulatoryBody: 'OSHA',
    category: 'Scaffolding',
    subpart: 'Subpart L',
    cfr: '29 CFR 1926.451',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Capacity requirements (4:1 ratio)',
      'Platform construction',
      'Access requirements',
      'Guardrail systems'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1926-454',
    code: '1926.454',
    title: 'Training Requirements - Scaffolds',
    description: 'Training requirements for scaffold users.',
    regulatoryBody: 'OSHA',
    category: 'Scaffolding',
    subpart: 'Subpart L',
    cfr: '29 CFR 1926.454',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Recognize hazards',
      'Proper use procedures',
      'Competent person training'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart M - Fall Protection
  {
    id: 'osha-1926-501',
    code: '1926.501',
    title: 'Duty to Have Fall Protection',
    description: 'Requirements for fall protection in construction.',
    regulatoryBody: 'OSHA',
    category: 'Fall Protection',
    subpart: 'Subpart M',
    cfr: '29 CFR 1926.501',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Protection at 6 feet or more',
      'Leading edge protection',
      'Holes and openings',
      'Formwork and rebar'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1926-502',
    code: '1926.502',
    title: 'Fall Protection Systems Criteria and Practices',
    description: 'Criteria for fall protection systems.',
    regulatoryBody: 'OSHA',
    category: 'Fall Protection',
    subpart: 'Subpart M',
    cfr: '29 CFR 1926.502',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Guardrail system requirements',
      'Safety net requirements',
      'Personal fall arrest system requirements'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart N - Cranes and Derricks
  {
    id: 'osha-1926-1400',
    code: '1926.1400',
    title: 'Scope - Cranes and Derricks',
    description: 'Scope and application of cranes and derricks standard.',
    regulatoryBody: 'OSHA',
    category: 'Cranes & Rigging',
    subpart: 'Subpart N',
    cfr: '29 CFR 1926.1400',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Equipment covered',
      'Operator certification',
      'Inspection requirements'
    ],
    managementTabs: ['All Regulations']
  },
  // Subpart P - Excavations
  {
    id: 'osha-1926-651',
    code: '1926.651',
    title: 'Specific Excavation Requirements',
    description: 'Requirements for excavation operations.',
    regulatoryBody: 'OSHA',
    category: 'Excavations',
    subpart: 'Subpart P',
    cfr: '29 CFR 1926.651',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Utility location',
      'Access and egress',
      'Exposure to falling loads',
      'Water accumulation hazards'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'osha-1926-652',
    code: '1926.652',
    title: 'Requirements for Protective Systems',
    description: 'Protective system requirements for excavations.',
    regulatoryBody: 'OSHA',
    category: 'Excavations',
    subpart: 'Subpart P',
    cfr: '29 CFR 1926.652',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Sloping and benching',
      'Shoring systems',
      'Shield systems',
      'Soil classification'
    ],
    managementTabs: ['All Regulations']
  }
];

// EPA Regulations
export const epaRegulations: Regulation[] = [
  {
    id: 'epa-caa-naaqs',
    code: '40 CFR Part 50',
    title: 'National Ambient Air Quality Standards (NAAQS)',
    description: 'Primary and secondary air quality standards for criteria pollutants.',
    regulatoryBody: 'EPA',
    category: 'Air Quality',
    cfr: '40 CFR Part 50',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Ozone standards',
      'Particulate matter (PM2.5, PM10)',
      'Carbon monoxide',
      'Nitrogen dioxide',
      'Sulfur dioxide',
      'Lead'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'epa-caa-nsps',
    code: '40 CFR Part 60',
    title: 'New Source Performance Standards (NSPS)',
    description: 'Emission standards for new stationary sources.',
    regulatoryBody: 'EPA',
    category: 'Air Quality',
    cfr: '40 CFR Part 60',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Technology-based emission limits',
      'Monitoring requirements',
      'Reporting requirements',
      'Recordkeeping'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'epa-caa-neshap',
    code: '40 CFR Part 61/63',
    title: 'National Emission Standards for Hazardous Air Pollutants (NESHAP)',
    description: 'Emission standards for hazardous air pollutants.',
    regulatoryBody: 'EPA',
    category: 'Air Quality',
    cfr: '40 CFR Part 61/63',
    jurisdiction: 'Federal',
    keyRequirements: [
      'MACT standards',
      '189 listed HAPs',
      'Asbestos NESHAP',
      'Source-specific requirements'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'epa-cwa-npdes',
    code: '40 CFR Part 122',
    title: 'NPDES Permit Program',
    description: 'National Pollutant Discharge Elimination System permit requirements.',
    regulatoryBody: 'EPA',
    category: 'Water Quality',
    cfr: '40 CFR Part 122',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Permit application',
      'Effluent limitations',
      'Monitoring and reporting',
      'Stormwater permits'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'epa-cwa-spcc',
    code: '40 CFR Part 112',
    title: 'Spill Prevention, Control, and Countermeasure (SPCC)',
    description: 'Requirements for oil spill prevention and response.',
    regulatoryBody: 'EPA',
    category: 'Water Quality',
    cfr: '40 CFR Part 112',
    jurisdiction: 'Federal',
    keyRequirements: [
      'SPCC Plan',
      'Secondary containment',
      'Integrity testing',
      'Training requirements'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'epa-rcra-hazwaste',
    code: '40 CFR Parts 260-270',
    title: 'RCRA Hazardous Waste Regulations',
    description: 'Comprehensive regulations for hazardous waste management.',
    regulatoryBody: 'EPA',
    category: 'Waste Management',
    cfr: '40 CFR Parts 260-270',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Waste characterization',
      'Generator requirements',
      'Manifest system',
      'Storage and disposal requirements'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'epa-cercla',
    code: '40 CFR Part 302',
    title: 'CERCLA Reportable Quantities',
    description: 'Reportable quantities for hazardous substance releases.',
    regulatoryBody: 'EPA',
    category: 'Hazardous Materials',
    cfr: '40 CFR Part 302',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Reportable quantities',
      'Release reporting',
      'Notification requirements',
      'Liability provisions'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'epa-epcra',
    code: '40 CFR Parts 350-372',
    title: 'Emergency Planning and Community Right-to-Know Act (EPCRA)',
    description: 'Emergency planning and toxic release inventory requirements.',
    regulatoryBody: 'EPA',
    category: 'Hazardous Materials',
    cfr: '40 CFR Parts 350-372',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Tier I/II reporting',
      'TRI reporting (Form R)',
      'SDS submittal',
      'Emergency notification'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'epa-tsca',
    code: '40 CFR Part 700',
    title: 'Toxic Substances Control Act (TSCA)',
    description: 'Regulation of toxic substances and chemicals.',
    regulatoryBody: 'EPA',
    category: 'Hazardous Materials',
    cfr: '40 CFR Part 700',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Chemical inventory',
      'New chemical review',
      'PCB regulations',
      'Asbestos regulations'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'epa-rmp',
    code: '40 CFR Part 68',
    title: 'Risk Management Program (RMP)',
    description: 'Chemical accident prevention requirements.',
    regulatoryBody: 'EPA',
    category: 'Hazardous Materials',
    cfr: '40 CFR Part 68',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Hazard assessment',
      'Prevention program',
      'Emergency response program',
      'Risk Management Plan submission'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  }
];

// NFPA Standards (expanded beyond existing codes)
export const nfpaStandards: Regulation[] = [
  {
    id: 'nfpa-1',
    code: 'NFPA 1',
    title: 'Fire Code',
    description: 'Comprehensive fire safety requirements for new and existing buildings.',
    regulatoryBody: 'NFPA',
    category: 'Fire Safety',
    year: 2024,
    jurisdiction: 'International',
    keyRequirements: [
      'Fire prevention',
      'Fire protection systems',
      'Means of egress',
      'Hazardous materials storage'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-10',
    code: 'NFPA 10',
    title: 'Standard for Portable Fire Extinguishers',
    description: 'Selection, installation, inspection, maintenance of portable fire extinguishers.',
    regulatoryBody: 'NFPA',
    category: 'Fire Safety',
    year: 2022,
    jurisdiction: 'International',
    keyRequirements: [
      'Extinguisher selection',
      'Placement requirements',
      'Monthly inspections',
      'Annual maintenance'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-13',
    code: 'NFPA 13',
    title: 'Standard for the Installation of Sprinkler Systems',
    description: 'Design and installation of automatic fire sprinkler systems.',
    regulatoryBody: 'NFPA',
    category: 'Fire Safety',
    year: 2022,
    jurisdiction: 'International',
    keyRequirements: [
      'System design',
      'Sprinkler spacing',
      'Water supply requirements',
      'Inspection and testing'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-30',
    code: 'NFPA 30',
    title: 'Flammable and Combustible Liquids Code',
    description: 'Storage, handling, and use of flammable and combustible liquids.',
    regulatoryBody: 'NFPA',
    category: 'Hazardous Materials',
    year: 2021,
    jurisdiction: 'International',
    keyRequirements: [
      'Container requirements',
      'Storage room design',
      'Tank requirements',
      'Fire protection'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-70',
    code: 'NFPA 70',
    title: 'National Electrical Code (NEC)',
    description: 'Safe electrical design, installation, and inspection standards.',
    regulatoryBody: 'NFPA',
    category: 'Electrical',
    year: 2023,
    jurisdiction: 'International',
    keyRequirements: [
      'Wiring methods',
      'Grounding and bonding',
      'Overcurrent protection',
      'Hazardous locations'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-70e',
    code: 'NFPA 70E',
    title: 'Standard for Electrical Safety in the Workplace',
    description: 'Electrical safety requirements for employee workplaces.',
    regulatoryBody: 'NFPA',
    category: 'Electrical',
    year: 2024,
    jurisdiction: 'International',
    keyRequirements: [
      'Arc flash hazard analysis',
      'PPE requirements',
      'Energized work permits',
      'Approach boundaries'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'nfpa-72',
    code: 'NFPA 72',
    title: 'National Fire Alarm and Signaling Code',
    description: 'Fire alarm and emergency communication systems.',
    regulatoryBody: 'NFPA',
    category: 'Fire Safety',
    year: 2022,
    jurisdiction: 'International',
    keyRequirements: [
      'Detection devices',
      'Notification appliances',
      'Inspection, testing, maintenance',
      'Documentation'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-101',
    code: 'NFPA 101',
    title: 'Life Safety Code',
    description: 'Minimum requirements for fire and life safety in buildings.',
    regulatoryBody: 'NFPA',
    category: 'Life Safety',
    year: 2024,
    jurisdiction: 'International',
    keyRequirements: [
      'Means of egress',
      'Exit access, exit, exit discharge',
      'Occupancy requirements',
      'Emergency lighting'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-110',
    code: 'NFPA 110',
    title: 'Standard for Emergency and Standby Power Systems',
    description: 'Installation, maintenance, and testing of emergency power systems.',
    regulatoryBody: 'NFPA',
    category: 'Electrical',
    year: 2022,
    jurisdiction: 'International',
    keyRequirements: [
      'Generator requirements',
      'Transfer switches',
      'Testing frequency',
      'Fuel supply'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'nfpa-704',
    code: 'NFPA 704',
    title: 'Standard System for Identification of Hazards of Materials',
    description: 'Hazard diamond labeling system for materials.',
    regulatoryBody: 'NFPA',
    category: 'Hazardous Materials',
    year: 2022,
    jurisdiction: 'International',
    keyRequirements: [
      'Health hazard rating',
      'Flammability rating',
      'Instability rating',
      'Special hazards'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  }
];

// NIOSH Recommendations
export const nioshRecommendations: Regulation[] = [
  {
    id: 'niosh-rel',
    code: 'NIOSH RELs',
    title: 'Recommended Exposure Limits',
    description: 'NIOSH recommended occupational exposure limits for chemical hazards.',
    regulatoryBody: 'NIOSH',
    category: 'Exposure Limits',
    jurisdiction: 'Federal',
    keyRequirements: [
      'TWA limits',
      'STEL limits',
      'Ceiling limits',
      'IDLH values'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'niosh-idlh',
    code: 'NIOSH IDLH',
    title: 'Immediately Dangerous to Life or Health Values',
    description: 'Concentrations that pose immediate threat to life or health.',
    regulatoryBody: 'NIOSH',
    category: 'Exposure Limits',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Escape-only levels',
      'Respirator selection criteria',
      'Emergency planning levels'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'niosh-hierarchy',
    code: 'NIOSH Hierarchy of Controls',
    title: 'Hierarchy of Controls',
    description: 'Framework for selecting effective control measures.',
    regulatoryBody: 'NIOSH',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Elimination',
      'Substitution',
      'Engineering controls',
      'Administrative controls',
      'PPE'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Industrial Hygiene']
  },
  {
    id: 'niosh-lifting',
    code: 'NIOSH Lifting Equation',
    title: 'Revised NIOSH Lifting Equation',
    description: 'Method for evaluating manual lifting tasks.',
    regulatoryBody: 'NIOSH',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    keyRequirements: [
      'Recommended Weight Limit (RWL)',
      'Lifting Index (LI)',
      'Task variables',
      'Risk assessment'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'niosh-noise',
    code: 'NIOSH Noise Criteria',
    title: 'Criteria for a Recommended Standard: Occupational Noise Exposure',
    description: 'NIOSH recommended noise exposure limits.',
    regulatoryBody: 'NIOSH',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    keyRequirements: [
      '85 dBA REL (8-hour TWA)',
      '3 dB exchange rate',
      'Hearing conservation program',
      'Engineering controls first'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'niosh-heat',
    code: 'NIOSH Heat Stress Criteria',
    title: 'Criteria for a Recommended Standard: Occupational Exposure to Heat and Hot Environments',
    description: 'Guidelines for preventing heat-related illness.',
    regulatoryBody: 'NIOSH',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    keyRequirements: [
      'WBGT monitoring',
      'Work/rest schedules',
      'Acclimatization',
      'Hydration'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  }
];

// ACGIH (Similar Exposure Guidelines - SEGs)
export const acgihStandards: Regulation[] = [
  {
    id: 'acgih-tlv',
    code: 'ACGIH TLVs',
    title: 'Threshold Limit Values',
    description: 'Occupational exposure guidelines for chemical and physical agents.',
    regulatoryBody: 'ACGIH',
    category: 'Exposure Limits',
    year: 2024,
    jurisdiction: 'International',
    keyRequirements: [
      'TLV-TWA',
      'TLV-STEL',
      'TLV-C (Ceiling)',
      'Skin notation'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'acgih-bei',
    code: 'ACGIH BEIs',
    title: 'Biological Exposure Indices',
    description: 'Guidance values for biological monitoring.',
    regulatoryBody: 'ACGIH',
    category: 'Exposure Limits',
    year: 2024,
    jurisdiction: 'International',
    keyRequirements: [
      'Biomarker selection',
      'Sampling time',
      'Reference values',
      'Interpretation'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  },
  {
    id: 'acgih-ventilation',
    code: 'Industrial Ventilation Manual',
    title: 'Industrial Ventilation: A Manual of Recommended Practice',
    description: 'Comprehensive guide for industrial ventilation design.',
    regulatoryBody: 'ACGIH',
    category: 'Occupational Health',
    year: 2024,
    jurisdiction: 'International',
    keyRequirements: [
      'Hood design',
      'Duct design',
      'Air cleaning devices',
      'Fan selection'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene']
  }
];

// ASTM Standards
export const astmStandards: Regulation[] = [
  {
    id: 'astm-e2500',
    code: 'ASTM E2500',
    title: 'Specification and Verification of Pharmaceutical Manufacturing Systems',
    description: 'Quality standards for pharmaceutical manufacturing.',
    regulatoryBody: 'ASTM',
    category: 'Quality Management',
    year: 2020,
    jurisdiction: 'International',
    keyRequirements: [
      'Design verification',
      'Commissioning',
      'Qualification',
      'Documentation'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'astm-e1578',
    code: 'ASTM E1578',
    title: 'Standard Guide for Laboratory Informatics',
    description: 'Requirements for laboratory information management systems.',
    regulatoryBody: 'ASTM',
    category: 'Quality Management',
    year: 2018,
    jurisdiction: 'International',
    keyRequirements: [
      'Data integrity',
      'Audit trails',
      'Electronic signatures',
      'System validation'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'astm-d6386',
    code: 'ASTM D6386',
    title: 'Standard Practice for Preparation of Zinc Coated Steel Surfaces',
    description: 'Surface preparation standards for coatings.',
    regulatoryBody: 'ASTM',
    category: 'Testing Methods',
    year: 2021,
    jurisdiction: 'International',
    keyRequirements: [
      'Surface cleaning',
      'Profile requirements',
      'Testing methods',
      'Acceptance criteria'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'astm-f2413',
    code: 'ASTM F2413',
    title: 'Standard Specification for Performance Requirements for Protective Footwear',
    description: 'Requirements for safety footwear performance.',
    regulatoryBody: 'ASTM',
    category: 'Personal Protective Equipment',
    year: 2018,
    jurisdiction: 'International',
    keyRequirements: [
      'Impact resistance',
      'Compression resistance',
      'Metatarsal protection',
      'Electrical hazard protection'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'astm-d6400',
    code: 'ASTM D6400',
    title: 'Standard Specification for Labeling of Plastics Designed for Aerobic Composting',
    description: 'Requirements for compostable plastics.',
    regulatoryBody: 'ASTM',
    category: 'Environmental Management',
    year: 2021,
    jurisdiction: 'International',
    keyRequirements: [
      'Biodegradation requirements',
      'Disintegration testing',
      'Ecotoxicity',
      'Labeling requirements'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'astm-e84',
    code: 'ASTM E84',
    title: 'Standard Test Method for Surface Burning Characteristics',
    description: 'Test method for flame spread and smoke development.',
    regulatoryBody: 'ASTM',
    category: 'Fire Safety',
    year: 2022,
    jurisdiction: 'International',
    keyRequirements: [
      'Flame spread index',
      'Smoke developed index',
      'Material classification',
      'Test procedures'
    ],
    managementTabs: ['All Regulations']
  }
];

// ISO Standards
export const isoStandards: Regulation[] = [
  // ISO 9001 Quality Management
  {
    id: 'iso-9001',
    code: 'ISO 9001:2015',
    title: 'Quality Management Systems - Requirements',
    description: 'International standard for quality management systems.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      'Context of the organization',
      'Leadership',
      'Planning',
      'Support',
      'Operation',
      'Performance evaluation',
      'Improvement'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-9001-4',
    code: 'ISO 9001:2015 Clause 4',
    title: 'Context of the Organization',
    description: 'Understanding the organization and its context.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '4.1 Understanding the organization and its context',
      '4.2 Understanding needs of interested parties',
      '4.3 Determining scope of QMS',
      '4.4 QMS and its processes'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-9001-5',
    code: 'ISO 9001:2015 Clause 5',
    title: 'Leadership',
    description: 'Top management leadership and commitment.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '5.1 Leadership and commitment',
      '5.2 Quality policy',
      '5.3 Organizational roles and responsibilities'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-9001-6',
    code: 'ISO 9001:2015 Clause 6',
    title: 'Planning',
    description: 'Planning for the quality management system.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '6.1 Actions to address risks and opportunities',
      '6.2 Quality objectives and planning',
      '6.3 Planning of changes'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management']
  },
  {
    id: 'iso-9001-7',
    code: 'ISO 9001:2015 Clause 7',
    title: 'Support',
    description: 'Resources, competence, awareness, communication, and documented information.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '7.1 Resources',
      '7.2 Competence',
      '7.3 Awareness',
      '7.4 Communication',
      '7.5 Documented information'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-9001-8',
    code: 'ISO 9001:2015 Clause 8',
    title: 'Operation',
    description: 'Operational planning and control.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '8.1 Operational planning and control',
      '8.2 Requirements for products/services',
      '8.3 Design and development',
      '8.4 Control of externally provided processes',
      '8.5 Production and service provision',
      '8.6 Release of products/services',
      '8.7 Control of nonconforming outputs'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-9001-9',
    code: 'ISO 9001:2015 Clause 9',
    title: 'Performance Evaluation',
    description: 'Monitoring, measurement, analysis, and evaluation.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '9.1 Monitoring, measurement, analysis, evaluation',
      '9.2 Internal audit',
      '9.3 Management review'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.iso.org/standard/62085.html'
  },
  // ISO 14001 Environmental Management
  {
    id: 'iso-14001',
    code: 'ISO 14001:2015',
    title: 'Environmental Management Systems - Requirements',
    description: 'International standard for environmental management systems.',
    regulatoryBody: 'ISO',
    category: 'Environmental Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      'Environmental policy',
      'Environmental aspects and impacts',
      'Legal and other requirements',
      'Objectives and planning',
      'Operational control',
      'Emergency preparedness',
      'Monitoring and measurement'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iso.org/standard/60857.html'
  },
  {
    id: 'iso-14000-series',
    code: 'ISO 14000 Series',
    title: 'Environmental Management Standards Family',
    description: 'A family of standards related to environmental management that exists to help organizations minimize how their operations negatively affect the environment.',
    regulatoryBody: 'ISO',
    category: 'Environmental Management',
    jurisdiction: 'International',
    keyRequirements: [
      'Environmental auditing',
      'Environmental labeling',
      'Life cycle assessment',
      'Environmental performance evaluation'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iso.org/iso-14001-environmental-management.html'
  },
  // ISO 45001 Occupational Health and Safety
  {
    id: 'iso-45001',
    code: 'ISO 45001:2018',
    title: 'Occupational Health and Safety Management Systems',
    description: 'International standard for occupational health and safety management systems.',
    regulatoryBody: 'ISO',
    category: 'Occupational Health',
    year: 2018,
    jurisdiction: 'International',
    keyRequirements: [
      'Context of the organization',
      'Worker participation',
      'Hazard identification',
      'Risk assessment',
      'Legal requirements',
      'Operational controls',
      'Emergency response'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iso.org/standard/63787.html'
  },
  // OHSAS 18001 (Legacy)
  {
    id: 'ohsas-18001',
    code: 'OHSAS 18001',
    title: 'Occupational Health and Safety Assessment Series',
    description: 'Legacy international standard for occupational health and safety management systems (superseded by ISO 45001).',
    regulatoryBody: 'OHSAS',
    category: 'Occupational Health',
    year: 2007,
    jurisdiction: 'International',
    keyRequirements: [
      'OH&S policy',
      'Planning for hazard identification',
      'Implementation and operation',
      'Checking and corrective action',
      'Management review'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iso.org/iso-45001-occupational-health-and-safety.html'
  },
  // ISO 31000 Risk Management
  {
    id: 'iso-31000',
    code: 'ISO 31000:2018',
    title: 'Risk Management - Guidelines',
    description: 'International standard providing principles, framework, and a process for managing risk.',
    regulatoryBody: 'ISO',
    category: 'Risk Management',
    year: 2018,
    jurisdiction: 'International',
    keyRequirements: [
      'Risk management principles',
      'Risk management framework',
      'Risk management process',
      'Risk identification',
      'Risk analysis',
      'Risk evaluation',
      'Risk treatment'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Risk Management'],
    sourceUrl: 'https://www.iso.org/standard/65694.html'
  },
  // ILO Conventions
  {
    id: 'ilo-c155',
    code: 'ILO C155',
    title: 'Occupational Safety and Health Convention',
    description: 'ILO convention concerning occupational safety and health and the working environment.',
    regulatoryBody: 'ILO',
    category: 'International Standards',
    year: 1981,
    jurisdiction: 'International',
    keyRequirements: [
      'National policy on OSH',
      'Action at the level of the undertaking',
      'Employer responsibilities',
      'Worker rights and duties'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C155'
  },
  {
    id: 'ilo-c187',
    code: 'ILO C187',
    title: 'Promotional Framework for Occupational Safety and Health Convention',
    description: 'ILO convention to promote continuous improvement of occupational safety and health.',
    regulatoryBody: 'ILO',
    category: 'International Standards',
    year: 2006,
    jurisdiction: 'International',
    keyRequirements: [
      'National OSH profile',
      'National OSH programme',
      'National OSH system',
      'Preventative safety and health culture'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.ilo.org/dyn/normlex/en/f?p=NORMLEXPUB:12100:0::NO::P12100_ILO_CODE:C187'
  },
  {
    id: 'iso-9001-10',
    code: 'ISO 9001:2015 Clause 10',
    title: 'Improvement',
    description: 'Continual improvement of the quality management system.',
    regulatoryBody: 'ISO',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '10.1 General improvement',
      '10.2 Nonconformity and corrective action',
      '10.3 Continual improvement'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  // ISO 14001 Environmental Management
  {
    id: 'iso-14001',
    code: 'ISO 14001:2015',
    title: 'Environmental Management Systems - Requirements',
    description: 'International standard for environmental management systems.',
    regulatoryBody: 'ISO',
    category: 'Environmental Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      'Environmental policy',
      'Environmental aspects',
      'Legal and other requirements',
      'Objectives and targets',
      'Operational control',
      'Emergency preparedness'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-14001-4',
    code: 'ISO 14001:2015 Clause 4',
    title: 'Context of the Organization (Environmental)',
    description: 'Understanding the organization and its environmental context.',
    regulatoryBody: 'ISO',
    category: 'Environmental Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '4.1 Understanding organization and context',
      '4.2 Needs of interested parties',
      '4.3 Scope of EMS',
      '4.4 Environmental management system'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-14001-6',
    code: 'ISO 14001:2015 Clause 6',
    title: 'Planning (Environmental)',
    description: 'Planning for environmental management system.',
    regulatoryBody: 'ISO',
    category: 'Environmental Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '6.1 Actions to address risks/opportunities',
      '6.1.2 Environmental aspects',
      '6.1.3 Compliance obligations',
      '6.2 Environmental objectives'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  {
    id: 'iso-14001-8',
    code: 'ISO 14001:2015 Clause 8',
    title: 'Operation (Environmental)',
    description: 'Operational planning and control for environmental management.',
    regulatoryBody: 'ISO',
    category: 'Environmental Management',
    year: 2015,
    jurisdiction: 'International',
    keyRequirements: [
      '8.1 Operational planning and control',
      '8.2 Emergency preparedness and response'
    ],
    managementTabs: ['All Regulations', 'Quality Management']
  },
  // ISO 45001 Occupational Health and Safety
  {
    id: 'iso-45001',
    code: 'ISO 45001:2018',
    title: 'Occupational Health and Safety Management Systems',
    description: 'International standard for OH&S management systems.',
    regulatoryBody: 'ISO',
    category: 'Occupational Health',
    year: 2018,
    jurisdiction: 'International',
    keyRequirements: [
      'Worker participation',
      'Hazard identification',
      'Risk assessment',
      'Legal compliance',
      'Objectives and planning',
      'Incident investigation'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Industrial Hygiene']
  }
];

// ANSI Standards
export const ansiStandards: Regulation[] = [
  {
    id: 'ansi-z87',
    code: 'ANSI Z87.1',
    title: 'Occupational and Educational Personal Eye and Face Protection Devices',
    description: 'Requirements for eye and face protective devices.',
    regulatoryBody: 'ANSI',
    category: 'Personal Protective Equipment',
    year: 2020,
    jurisdiction: 'Federal',
    keyRequirements: [
      'Impact resistance',
      'Optical clarity',
      'Marking requirements',
      'Selection guidance'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'ansi-z89',
    code: 'ANSI Z89.1',
    title: 'Industrial Head Protection',
    description: 'Requirements for industrial protective helmets.',
    regulatoryBody: 'ANSI',
    category: 'Personal Protective Equipment',
    year: 2022,
    jurisdiction: 'Federal',
    keyRequirements: [
      'Type I and Type II classifications',
      'Electrical classes (E, G, C)',
      'Impact and penetration resistance',
      'Testing requirements'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'ansi-z359',
    code: 'ANSI Z359.1',
    title: 'Safety Requirements for Personal Fall Arrest Systems',
    description: 'Requirements for fall protection systems and components.',
    regulatoryBody: 'ANSI',
    category: 'Fall Protection',
    year: 2020,
    jurisdiction: 'Federal',
    keyRequirements: [
      'Harness requirements',
      'Lanyard specifications',
      'Anchor requirements',
      'System testing'
    ],
    managementTabs: ['All Regulations']
  },
  {
    id: 'ansi-z535',
    code: 'ANSI Z535',
    title: 'Safety Signs and Colors',
    description: 'Standards for safety signs, colors, and symbols.',
    regulatoryBody: 'ANSI',
    category: 'General Duty',
    year: 2022,
    jurisdiction: 'Federal',
    keyRequirements: [
      'Signal words (DANGER, WARNING, CAUTION)',
      'Safety colors',
      'Symbol design',
      'Sign placement'
    ],
    managementTabs: ['All Regulations']
  }
];

// International Standards (IEC, EN, CSA, AS/NZS)
export const internationalStandards: Regulation[] = [
  // IEC Standards
  {
    id: 'iec-61508',
    code: 'IEC 61508',
    title: 'Functional Safety of Electrical/Electronic/Programmable Electronic Safety-related Systems',
    description: 'International standard covering functional safety of E/E/PE safety-related systems across all industries.',
    regulatoryBody: 'IEC',
    category: 'International Standards',
    year: 2010,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Oil & Gas', 'Chemical', 'Nuclear', 'Transportation'],
    keyRequirements: [
      'Safety Integrity Levels (SIL 1-4)',
      'Safety lifecycle management',
      'Hardware and software safety requirements',
      'Verification and validation',
      'Functional safety assessment'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iec.ch/functional-safety'
  },
  {
    id: 'iec-62443',
    code: 'IEC 62443',
    title: 'Industrial Automation and Control Systems Security',
    description: 'Series of standards addressing cybersecurity for industrial automation and control systems (IACS).',
    regulatoryBody: 'IEC',
    category: 'International Standards',
    year: 2022,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Oil & Gas', 'Utilities', 'Chemical'],
    keyRequirements: [
      'Security levels and zones',
      'Risk assessment methodology',
      'System security requirements',
      'Component security requirements',
      'Security lifecycle'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'AI & Robotics'],
    sourceUrl: 'https://www.iec.ch/industrial-cybersecurity'
  },
  {
    id: 'iec-60204-1',
    code: 'IEC 60204-1',
    title: 'Safety of Machinery - Electrical Equipment of Machines',
    description: 'Requirements for electrical, electronic and programmable electronic equipment and systems for machines.',
    regulatoryBody: 'IEC',
    category: 'Machinery Safety',
    year: 2016,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Machine Shops', 'Construction'],
    keyRequirements: [
      'Electrical hazard protection',
      'Control circuit requirements',
      'Operator interfaces and controls',
      'Emergency stop functions',
      'Documentation requirements'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iec.ch/machinery'
  },
  // EN Standards (European)
  {
    id: 'en-iso-12100',
    code: 'EN ISO 12100',
    title: 'Safety of Machinery - General Principles for Design',
    description: 'European harmonized standard specifying basic terminology, methodology, and technical principles for achieving safety in machinery design.',
    regulatoryBody: 'EN',
    category: 'Machinery Safety',
    year: 2010,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Machine Shops', 'Construction'],
    keyRequirements: [
      'Risk assessment methodology',
      'Hazard identification',
      'Risk estimation and evaluation',
      'Inherently safe design',
      'Safeguarding and protective measures'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.iso.org/standard/51528.html'
  },
  {
    id: 'en-iso-13849-1',
    code: 'EN ISO 13849-1',
    title: 'Safety of Machinery - Safety-related Parts of Control Systems',
    description: 'Requirements for design and integration of safety-related parts of control systems (SRP/CS).',
    regulatoryBody: 'EN',
    category: 'Machinery Safety',
    year: 2015,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Machine Shops', 'Robotics'],
    keyRequirements: [
      'Performance Levels (PL a-e)',
      'Category architecture (B, 1-4)',
      'Mean Time To Failure (MTTFd)',
      'Diagnostic Coverage (DC)',
      'Common Cause Failure (CCF)'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'AI & Robotics'],
    sourceUrl: 'https://www.iso.org/standard/69883.html'
  },
  {
    id: 'en-iso-10218',
    code: 'EN ISO 10218',
    title: 'Robots and Robotic Devices - Safety Requirements',
    description: 'Safety requirements for industrial robots, robot systems and integration.',
    regulatoryBody: 'EN',
    category: 'AI & Robotics',
    year: 2011,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Automotive', 'Electronics', 'Logistics'],
    keyRequirements: [
      'Robot hazard identification',
      'Safeguarding requirements',
      'Collaborative robot safety',
      'Safety-rated functions',
      'Integration safety measures'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'AI & Robotics'],
    sourceUrl: 'https://www.iso.org/standard/51330.html'
  },
  // CSA Standards (Canadian)
  {
    id: 'csa-z432',
    code: 'CSA Z432',
    title: 'Safeguarding of Machinery',
    description: 'Canadian standard for safeguarding machinery in workplaces.',
    regulatoryBody: 'CSA',
    category: 'Machinery Safety',
    year: 2016,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Machine Shops', 'Construction'],
    keyRequirements: [
      'Risk assessment',
      'Guard design and construction',
      'Safeguarding devices',
      'Control reliability',
      'Lockout/tagout procedures'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.csagroup.org/store/product/Z432-16/'
  },
  {
    id: 'csa-z1000',
    code: 'CSA Z1000',
    title: 'Occupational Health and Safety Management',
    description: 'Canadian OHS management system standard aligned with ISO 45001.',
    regulatoryBody: 'CSA',
    category: 'Occupational Health',
    year: 2014,
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Management commitment',
      'Hazard prevention program',
      'Training and competency',
      'Incident investigation',
      'Performance measurement'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Quality Management'],
    sourceUrl: 'https://www.csagroup.org/store/product/Z1000-14/'
  },
  // AS/NZS Standards (Australia/New Zealand)
  {
    id: 'as-nzs-4024',
    code: 'AS/NZS 4024',
    title: 'Safety of Machinery Series',
    description: 'Australian/New Zealand standards for machinery safety covering design, risk assessment, and safeguarding.',
    regulatoryBody: 'AS/NZS',
    category: 'Machinery Safety',
    year: 2014,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Mining', 'Construction'],
    keyRequirements: [
      'Risk assessment process',
      'General design principles',
      'Guards and protective devices',
      'Minimum distances',
      'Emergency stop requirements'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.standards.org.au/standards-catalogue/sa-snz/manufacturing/sf-001'
  },
  {
    id: 'as-nzs-4801',
    code: 'AS/NZS 4801',
    title: 'Occupational Health and Safety Management Systems',
    description: 'Australian/New Zealand standard for OHS management systems.',
    regulatoryBody: 'AS/NZS',
    category: 'Occupational Health',
    year: 2001,
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'OHS policy',
      'Planning for hazard identification',
      'Implementation and operation',
      'Checking and corrective action',
      'Management review'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Quality Management'],
    sourceUrl: 'https://www.standards.org.au/standards-catalogue/sa-snz/publicsafety/sf-001/as-slash-nzs--4801-2001'
  },
  {
    id: 'as-nzs-iso-31000',
    code: 'AS/NZS ISO 31000',
    title: 'Risk Management - Guidelines',
    description: 'Guidelines on managing risk faced by organizations.',
    regulatoryBody: 'AS/NZS',
    category: 'Quality Management',
    year: 2018,
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Risk management principles',
      'Framework for managing risk',
      'Risk assessment process',
      'Risk treatment',
      'Monitoring and review'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Quality Management'],
    sourceUrl: 'https://www.iso.org/standard/65694.html'
  }
];

// AI & Robotics Hazards and Safety Standards
export const aiRoboticsStandards: Regulation[] = [
  {
    id: 'iso-ts-15066',
    code: 'ISO/TS 15066',
    title: 'Robots and Robotic Devices - Collaborative Robots',
    description: 'Safety requirements for collaborative industrial robot systems and the work environment.',
    regulatoryBody: 'ISO',
    category: 'AI & Robotics',
    year: 2016,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Automotive', 'Electronics', 'Healthcare'],
    keyRequirements: [
      'Collaborative workspace design',
      'Speed and separation monitoring',
      'Hand guiding requirements',
      'Power and force limiting',
      'Biomechanical limits for contact'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics', 'International Standards'],
    sourceUrl: 'https://www.iso.org/standard/62996.html'
  },
  {
    id: 'ansi-ria-15-06',
    code: 'ANSI/RIA R15.06',
    title: 'Industrial Robots and Robot Systems - Safety Requirements',
    description: 'American National Standard for industrial robot safety.',
    regulatoryBody: 'ANSI',
    category: 'AI & Robotics',
    year: 2012,
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Automotive', 'Aerospace'],
    keyRequirements: [
      'Robot safeguarding',
      'Risk assessment',
      'Safe design requirements',
      'Validation and verification',
      'User information'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics'],
    sourceUrl: 'https://www.robotics.org/robotic-content.cfm/Robotics/Safety-Compliance/id/49'
  },
  {
    id: 'iso-iec-23894',
    code: 'ISO/IEC 23894',
    title: 'Artificial Intelligence - Guidance on Risk Management',
    description: 'Guidance on managing risks related to AI systems throughout their lifecycle.',
    regulatoryBody: 'ISO',
    category: 'AI & Robotics',
    year: 2023,
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'AI risk identification',
      'Risk analysis for AI systems',
      'AI-specific risk factors',
      'Bias and fairness considerations',
      'Transparency and explainability'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics', 'International Standards'],
    sourceUrl: 'https://www.iso.org/standard/77304.html'
  },
  {
    id: 'ieee-7000',
    code: 'IEEE 7000',
    title: 'Model Process for Addressing Ethical Concerns During System Design',
    description: 'Standard for addressing ethical considerations in autonomous and intelligent systems.',
    regulatoryBody: 'ANSI',
    category: 'AI & Robotics',
    year: 2021,
    jurisdiction: 'International',
    applicableIndustries: ['Technology', 'Healthcare', 'Transportation', 'Manufacturing'],
    keyRequirements: [
      'Ethical value identification',
      'Stakeholder analysis',
      'Ethical risk assessment',
      'Value-based design',
      'Transparency requirements'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics'],
    sourceUrl: 'https://standards.ieee.org/ieee/7000/6781/'
  },
  {
    id: 'eu-ai-act',
    code: 'EU AI Act',
    title: 'European Union Artificial Intelligence Act',
    description: 'Comprehensive regulatory framework for artificial intelligence systems in the European Union.',
    regulatoryBody: 'EN',
    category: 'AI & Robotics',
    year: 2024,
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Risk-based AI classification',
      'High-risk AI requirements',
      'Prohibited AI practices',
      'Transparency obligations',
      'Conformity assessment',
      'Human oversight requirements'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics', 'International Standards'],
    sourceUrl: 'https://artificialintelligenceact.eu/'
  },
  {
    id: 'nist-ai-rmf',
    code: 'NIST AI RMF',
    title: 'NIST Artificial Intelligence Risk Management Framework',
    description: 'Framework to help organizations manage risks associated with AI throughout its lifecycle.',
    regulatoryBody: 'NIOSH',
    category: 'AI & Robotics',
    year: 2023,
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'AI system governance',
      'Mapping AI risks',
      'Measuring AI impact',
      'Managing AI throughout lifecycle',
      'Trustworthy AI characteristics'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics'],
    sourceUrl: 'https://www.nist.gov/itl/ai-risk-management-framework'
  },
  {
    id: 'osha-robotics',
    code: 'OSHA Robotics Guidelines',
    title: 'OSHA Guidelines for Robotics Safety',
    description: 'OSHA technical guidance on robot safety in the workplace.',
    regulatoryBody: 'OSHA',
    category: 'AI & Robotics',
    year: 2022,
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Warehousing', 'Logistics'],
    keyRequirements: [
      'Robot hazard assessment',
      'Safeguarding methods',
      'Training requirements',
      'Maintenance procedures',
      'Lockout/tagout for robots'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics'],
    sourceUrl: 'https://www.osha.gov/robotics'
  },
  {
    id: 'iso-8373',
    code: 'ISO 8373',
    title: 'Robotics - Vocabulary',
    description: 'Definitions of terms used in relation to robots and robotic devices.',
    regulatoryBody: 'ISO',
    category: 'AI & Robotics',
    year: 2021,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Healthcare', 'Services'],
    keyRequirements: [
      'Robot classification definitions',
      'Robot component terminology',
      'Robot motion descriptions',
      'Safety-related terms',
      'Programming terminology'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics', 'International Standards'],
    sourceUrl: 'https://www.iso.org/standard/75539.html'
  },
  {
    id: 'amr-agv-safety',
    code: 'ANSI/ITSDF B56.5',
    title: 'Safety Standard for Driverless, Automatic Guided Industrial Vehicles',
    description: 'Safety requirements for AGVs and AMRs in industrial environments.',
    regulatoryBody: 'ANSI',
    category: 'AI & Robotics',
    year: 2019,
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Warehousing', 'Logistics', 'Healthcare'],
    keyRequirements: [
      'Vehicle safety design',
      'Path and navigation safety',
      'Load handling requirements',
      'Emergency stop systems',
      'Personnel detection'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics'],
    sourceUrl: 'https://www.itsdf.org/aws/ITSDF/pt/sp/b56_safety'
  },
  {
    id: 'cobot-risk-assessment',
    code: 'Collaborative Robot Risk Assessment',
    title: 'Risk Assessment Framework for Collaborative Robots',
    description: 'Comprehensive risk assessment methodology for human-robot collaboration scenarios.',
    regulatoryBody: 'ISO',
    category: 'AI & Robotics',
    year: 2020,
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Healthcare', 'Logistics'],
    keyRequirements: [
      'Collaborative workspace hazard identification',
      'Contact force and pressure limits',
      'Speed and separation analysis',
      'Task-specific risk evaluation',
      'Residual risk documentation'
    ],
    managementTabs: ['All Regulations', 'AI & Robotics'],
    sourceUrl: 'https://www.iso.org/standard/62996.html'
  }
];

// Additional ASTM Standards
export const additionalAstmStandards: Regulation[] = [
  {
    id: 'astm-e2500',
    code: 'ASTM E2500',
    title: 'Standard Guide for Specification, Design, and Verification of Pharmaceutical and Biopharmaceutical Manufacturing Systems',
    description: 'Guide for design verification of pharmaceutical manufacturing systems and equipment.',
    regulatoryBody: 'ASTM',
    category: 'Quality Management',
    year: 2020,
    jurisdiction: 'Federal',
    applicableIndustries: ['Pharmaceutical', 'Healthcare', 'Biotechnology'],
    keyRequirements: [
      'Design qualification',
      'Risk-based approach',
      'Science-based verification',
      'Good engineering practice',
      'Subject matter expert involvement'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.astm.org/e2500-20.html'
  },
  {
    id: 'astm-e2856',
    code: 'ASTM E2856',
    title: 'Standard Guide for Integrity Testing of Porous Medical Packages',
    description: 'Methods for assessing the integrity of porous medical packaging.',
    regulatoryBody: 'ASTM',
    category: 'Quality Management',
    year: 2020,
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Medical Devices', 'Pharmaceutical'],
    keyRequirements: [
      'Package integrity verification',
      'Seal strength testing',
      'Microbial barrier testing',
      'Accelerated aging studies',
      'Distribution simulation'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.astm.org/e2856-20.html'
  },
  {
    id: 'astm-f1930',
    code: 'ASTM F1930',
    title: 'Standard Test Method for Evaluation of Flame Resistant Clothing',
    description: 'Test method for measuring thermal protection of flame-resistant clothing using instrumented manikin.',
    regulatoryBody: 'ASTM',
    category: 'Personal Protective Equipment',
    year: 2023,
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Utilities', 'Manufacturing', 'Fire Services'],
    keyRequirements: [
      'Thermal manikin testing',
      'Predicted body burn calculation',
      'Garment system evaluation',
      'Flash fire simulation',
      'Heat transfer measurement'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.astm.org/f1930-23.html'
  },
  {
    id: 'astm-f2100',
    code: 'ASTM F2100',
    title: 'Standard Specification for Performance of Materials Used in Medical Face Masks',
    description: 'Performance requirements for materials used in medical face masks.',
    regulatoryBody: 'ASTM',
    category: 'Personal Protective Equipment',
    year: 2021,
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Medical Devices', 'Manufacturing'],
    keyRequirements: [
      'Bacterial filtration efficiency',
      'Particulate filtration efficiency',
      'Differential pressure',
      'Splash resistance',
      'Flammability classification'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.astm.org/f2100-21.html'
  },
  {
    id: 'astm-d6400',
    code: 'ASTM D6400',
    title: 'Standard Specification for Labeling of Plastics Designed to be Aerobically Composted',
    description: 'Requirements for labeling materials and products made from plastics designed for composting.',
    regulatoryBody: 'ASTM',
    category: 'Environmental Management',
    year: 2023,
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Packaging', 'Waste Management'],
    keyRequirements: [
      'Biodegradation requirements',
      'Disintegration criteria',
      'Ecotoxicity testing',
      'Heavy metals limits',
      'Labeling requirements'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.astm.org/d6400-23.html'
  },
  {
    id: 'astm-e1527',
    code: 'ASTM E1527',
    title: 'Standard Practice for Environmental Site Assessments: Phase I ESA Process',
    description: 'Practice for conducting Phase I Environmental Site Assessments.',
    regulatoryBody: 'ASTM',
    category: 'Environmental Management',
    year: 2021,
    jurisdiction: 'Federal',
    applicableIndustries: ['Real Estate', 'Construction', 'All Industries'],
    keyRequirements: [
      'Records review',
      'Site reconnaissance',
      'Interviews',
      'Historical use evaluation',
      'Recognized environmental conditions'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.astm.org/e1527-21.html'
  },
  {
    id: 'astm-e1903',
    code: 'ASTM E1903',
    title: 'Standard Practice for Environmental Site Assessments: Phase II ESA Process',
    description: 'Practice for conducting Phase II Environmental Site Assessments.',
    regulatoryBody: 'ASTM',
    category: 'Environmental Management',
    year: 2019,
    jurisdiction: 'Federal',
    applicableIndustries: ['Real Estate', 'Construction', 'All Industries'],
    keyRequirements: [
      'Sampling and analysis',
      'Data evaluation',
      'Quality assurance/control',
      'Report preparation',
      'Contaminant investigation'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.astm.org/e1903-19.html'
  },
  {
    id: 'astm-f2413',
    code: 'ASTM F2413',
    title: 'Standard Specification for Performance Requirements for Protective Footwear',
    description: 'Performance requirements for protective (safety-toe) footwear.',
    regulatoryBody: 'ASTM',
    category: 'Personal Protective Equipment',
    year: 2022,
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction', 'Manufacturing', 'Oil & Gas', 'Mining'],
    keyRequirements: [
      'Impact resistance (I/75, I/50)',
      'Compression resistance (C/75, C/50)',
      'Metatarsal protection (Mt)',
      'Electrical hazard (EH)',
      'Static dissipative (SD)'
    ],
    managementTabs: ['All Regulations'],
    sourceUrl: 'https://www.astm.org/f2413-22.html'
  },
  {
    id: 'astm-f1506',
    code: 'ASTM F1506',
    title: 'Standard Performance Specification for Flame Resistant and Arc Rated Textile Materials',
    description: 'Performance specifications for FR and arc-rated textiles used in protective clothing.',
    regulatoryBody: 'ASTM',
    category: 'Personal Protective Equipment',
    year: 2020,
    jurisdiction: 'Federal',
    applicableIndustries: ['Utilities', 'Oil & Gas', 'Manufacturing'],
    keyRequirements: [
      'Arc thermal performance value (ATPV)',
      'Energy breakopen threshold (EBT)',
      'Vertical flame test',
      'Fabric shrinkage limits',
      'Laundering durability'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.astm.org/f1506-20a.html'
  },
  {
    id: 'astm-e2018',
    code: 'ASTM E2018',
    title: 'Standard Guide for Property Condition Assessments',
    description: 'Guide for baseline property condition assessments of commercial real estate.',
    regulatoryBody: 'ASTM',
    category: 'Quality Management',
    year: 2015,
    jurisdiction: 'Federal',
    applicableIndustries: ['Real Estate', 'Construction', 'Facility Management'],
    keyRequirements: [
      'Physical deficiency identification',
      'Deferred maintenance assessment',
      'Replacement reserves estimation',
      'Document review',
      'Site observations'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.astm.org/e2018-15.html'
  }
];

// Additional OSHA Standards
export const additionalOshaStandards: Regulation[] = [
  {
    id: 'osha-1910-146',
    code: '1910.146',
    title: 'Permit-Required Confined Spaces',
    description: 'Requirements for practices and procedures to protect employees in general industry from hazards of entry into permit-required confined spaces.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart J',
    cfr: '29 CFR 1910.146',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Confined space evaluation and classification',
      'Written permit space program',
      'Entry permit system',
      'Atmospheric testing requirements',
      'Rescue and emergency services'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146'
  },
  {
    id: 'osha-1910-147',
    code: '1910.147',
    title: 'Control of Hazardous Energy (Lockout/Tagout)',
    description: 'Requirements for the control of hazardous energy during servicing and maintenance of machines and equipment.',
    regulatoryBody: 'OSHA',
    category: 'Machine Guarding',
    subpart: 'Subpart J',
    cfr: '29 CFR 1910.147',
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Construction', 'Utilities', 'All Industries'],
    keyRequirements: [
      'Energy control program',
      'Lockout/tagout procedures',
      'Employee training',
      'Periodic inspection',
      'Group lockout requirements'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.147'
  },
  {
    id: 'osha-1910-178',
    code: '1910.178',
    title: 'Powered Industrial Trucks',
    description: 'Safety requirements for powered industrial trucks (forklifts) including design, maintenance, and use.',
    regulatoryBody: 'OSHA',
    category: 'Machine Guarding',
    subpart: 'Subpart N',
    cfr: '29 CFR 1910.178',
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Warehousing', 'Logistics', 'Construction'],
    keyRequirements: [
      'Operator training and certification',
      'Truck design and construction',
      'Safe operating procedures',
      'Maintenance requirements',
      'Pedestrian safety'
    ],
    managementTabs: ['All Regulations'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.178'
  },
  {
    id: 'osha-1910-1200',
    code: '1910.1200',
    title: 'Hazard Communication (HazCom)',
    description: 'Requirements for chemical hazard classification, labeling, safety data sheets, and employee training.',
    regulatoryBody: 'OSHA',
    category: 'Hazardous Materials',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1200',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Written hazard communication program',
      'Chemical inventory',
      'Safety Data Sheets (SDS)',
      'GHS-compliant labeling',
      'Employee training'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1200'
  },
  {
    id: 'osha-1910-1020',
    code: '1910.1020',
    title: 'Access to Employee Exposure and Medical Records',
    description: 'Employee rights to access exposure and medical records maintained by employers.',
    regulatoryBody: 'OSHA',
    category: 'Occupational Health',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1020',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Record preservation',
      'Employee access rights',
      'Transfer of records',
      'Trade secret protection',
      'Medical record confidentiality'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1020'
  },
  {
    id: 'osha-1926-502',
    code: '1926.502',
    title: 'Fall Protection Systems Criteria and Practices',
    description: 'Criteria and practices for fall protection systems in construction.',
    regulatoryBody: 'OSHA',
    category: 'Fall Protection',
    subpart: 'Subpart M',
    cfr: '29 CFR 1926.502',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Guardrail system requirements',
      'Safety net system requirements',
      'Personal fall arrest system requirements',
      'Positioning device system requirements',
      'Fall protection plan'
    ],
    managementTabs: ['All Regulations'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.502'
  },
  {
    id: 'osha-1926-1153',
    code: '1926.1153',
    title: 'Respirable Crystalline Silica',
    description: 'Requirements for controlling respirable crystalline silica exposure in construction.',
    regulatoryBody: 'OSHA',
    category: 'Industrial Hygiene',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1926.1153',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction', 'Mining'],
    keyRequirements: [
      'Permissible exposure limit (50 μg/m³)',
      'Table 1 specified exposure control methods',
      'Medical surveillance',
      'Housekeeping requirements',
      'Written exposure control plan'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.1153'
  },
  {
    id: 'osha-1910-1048',
    code: '1910.1048',
    title: 'Formaldehyde',
    description: 'Requirements for occupational exposure to formaldehyde.',
    regulatoryBody: 'OSHA',
    category: 'Industrial Hygiene',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1048',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Manufacturing', 'Laboratory'],
    keyRequirements: [
      'Permissible exposure limits',
      'Exposure monitoring',
      'Regulated areas',
      'Medical surveillance',
      'Hazard communication'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1048'
  },
  {
    id: 'osha-1910-1052',
    code: '1910.1052',
    title: 'Methylene Chloride',
    description: 'Requirements for occupational exposure to methylene chloride.',
    regulatoryBody: 'OSHA',
    category: 'Industrial Hygiene',
    subpart: 'Subpart Z',
    cfr: '29 CFR 1910.1052',
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Construction', 'Automotive'],
    keyRequirements: [
      'Permissible exposure limits',
      'Exposure determination',
      'Regulated areas',
      'Respiratory protection',
      'Medical surveillance'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.1052'
  },
  {
    id: 'osha-1910-269',
    code: '1910.269',
    title: 'Electric Power Generation, Transmission, and Distribution',
    description: 'Safety requirements for operation and maintenance of electric power generation, transmission, and distribution facilities.',
    regulatoryBody: 'OSHA',
    category: 'Electrical',
    subpart: 'Subpart R',
    cfr: '29 CFR 1910.269',
    jurisdiction: 'Federal',
    applicableIndustries: ['Utilities', 'Energy'],
    keyRequirements: [
      'Medical clearance for climbing',
      'Training requirements',
      'Job briefing',
      'Minimum approach distances',
      'Fall protection for climbing'
    ],
    managementTabs: ['All Regulations'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.269'
  }
];

// Pre-Task Assessment Standards
export const preTaskAssessmentStandards: Regulation[] = [
  {
    id: 'pretask-general',
    code: 'Pre-Task Safety Assessment',
    title: 'General Pre-Task Safety Assessment Requirements',
    description: 'Standard framework for conducting pre-task safety assessments before work activities.',
    regulatoryBody: 'OSHA',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Job hazard analysis (JHA)',
      'Work area inspection',
      'PPE verification',
      'Tool and equipment inspection',
      'Communication of hazards to team'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment']
  },
  {
    id: 'pretask-hair-ppe',
    code: 'Hair & PPE Pre-Task Check',
    title: 'Hair Control and PPE Pre-Task Assessment',
    description: 'Pre-task assessment requirements for hair control and personal protective equipment verification.',
    regulatoryBody: 'OSHA',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['Manufacturing', 'Food Processing', 'Healthcare', 'Laboratory'],
    keyRequirements: [
      'Hair secured and contained (nets, caps, ties)',
      'No loose hair near rotating machinery',
      'Hair covering for food safety compliance',
      'Proper headwear for welding/hot work',
      'Face shield compatibility check'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment']
  },
  {
    id: 'pretask-confined-space',
    code: 'Confined Space Pre-Entry',
    title: 'Confined Space Pre-Entry Assessment',
    description: 'Pre-entry assessment requirements before entering permit-required confined spaces.',
    regulatoryBody: 'OSHA',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Atmospheric testing (O2, LEL, toxics)',
      'Ventilation verification',
      'Energy isolation confirmation',
      'Rescue equipment ready',
      'Entry permit completed'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment', 'Industrial Hygiene'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.146'
  },
  {
    id: 'pretask-hot-work',
    code: 'Hot Work Pre-Task',
    title: 'Hot Work Pre-Task Assessment',
    description: 'Pre-task assessment requirements before conducting hot work operations.',
    regulatoryBody: 'OSHA',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction', 'Manufacturing', 'Oil & Gas', 'Maintenance'],
    keyRequirements: [
      'Hot work permit obtained',
      'Fire watch designated',
      'Combustibles removed or protected',
      'Fire extinguisher available',
      'Ventilation adequate'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.252'
  },
  {
    id: 'pretask-electrical',
    code: 'Electrical Safety Pre-Task',
    title: 'Electrical Work Pre-Task Assessment',
    description: 'Pre-task assessment requirements before performing electrical work.',
    regulatoryBody: 'OSHA',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'LOTO procedures verified',
      'Voltage testing completed',
      'Arc flash boundaries established',
      'Proper PPE selected per hazard',
      'Qualified person verification'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910/1910.333'
  },
  {
    id: 'pretask-lifting',
    code: 'Manual Lifting Pre-Task',
    title: 'Manual Lifting Pre-Task Assessment',
    description: 'Pre-task assessment for manual material handling activities.',
    regulatoryBody: 'NIOSH',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Load weight assessment',
      'Lift path clear',
      'Mechanical aids available',
      'Team lift requirements',
      'Proper lifting technique review'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment', 'Industrial Hygiene']
  },
  {
    id: 'pretask-working-heights',
    code: 'Working at Heights Pre-Task',
    title: 'Working at Heights Pre-Task Assessment',
    description: 'Pre-task assessment requirements before performing work at elevated heights.',
    regulatoryBody: 'OSHA',
    category: 'Pre-Task Assessment',
    jurisdiction: 'Federal',
    applicableIndustries: ['Construction', 'Maintenance', 'Utilities'],
    keyRequirements: [
      'Fall protection plan reviewed',
      'Anchor points inspected',
      'Harness and lanyard inspected',
      'Ladder/scaffold inspected',
      'Rescue plan in place'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment'],
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926/1926.502'
  }
];

// Cal/OSHA Regulations (California)
export const calOshaRegulations: Regulation[] = [
  {
    id: 'calosha-3203',
    code: 'CCR Title 8 §3203',
    title: 'Injury and Illness Prevention Program (IIPP)',
    description: 'California requirement for employers to establish, implement, and maintain an effective Injury and Illness Prevention Program.',
    regulatoryBody: 'Cal/OSHA',
    category: 'General Duty',
    jurisdiction: 'State',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Written IIPP required for all employers',
      'Person responsible for program implementation',
      'System for ensuring employee compliance',
      'Scheduled periodic inspections',
      'Accident investigation procedures',
      'Methods to correct unsafe conditions',
      'Training and instruction'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.dir.ca.gov/title8/3203.html'
  },
  {
    id: 'calosha-5194',
    code: 'CCR Title 8 §5194',
    title: 'Hazard Communication',
    description: 'California Hazard Communication Standard for chemical safety in the workplace.',
    regulatoryBody: 'Cal/OSHA',
    category: 'Hazardous Materials',
    jurisdiction: 'State',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Written hazard communication program',
      'Safety Data Sheets accessible to employees',
      'Container labeling requirements',
      'Employee training on chemical hazards',
      'GHS-aligned labels and SDS'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.dir.ca.gov/title8/5194.html'
  },
  {
    id: 'calosha-3395',
    code: 'CCR Title 8 §3395',
    title: 'Heat Illness Prevention',
    description: 'California standard for preventing heat illness in outdoor places of employment.',
    regulatoryBody: 'Cal/OSHA',
    category: 'Occupational Health',
    jurisdiction: 'State',
    applicableIndustries: ['Agriculture', 'Construction', 'Landscaping', 'All Outdoor Work'],
    keyRequirements: [
      'Provision of water (1 quart per hour)',
      'Access to shade when temps exceed 80°F',
      'High heat procedures above 95°F',
      'Acclimatization procedures for new employees',
      'Emergency response procedures',
      'Heat illness prevention training'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.dir.ca.gov/title8/3395.html'
  },
  {
    id: 'calosha-5110',
    code: 'CCR Title 8 §5110',
    title: 'Permit-Required Confined Spaces',
    description: 'California requirements for permit-required confined space entry procedures.',
    regulatoryBody: 'Cal/OSHA',
    category: 'Occupational Health',
    jurisdiction: 'State',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Identify and evaluate confined spaces',
      'Entry permit system',
      'Atmospheric testing and monitoring',
      'Ventilation requirements',
      'Rescue and emergency services',
      'Employee training and certification'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment'],
    sourceUrl: 'https://www.dir.ca.gov/title8/5157.html'
  },
  {
    id: 'calosha-1509',
    code: 'CCR Title 8 §1509',
    title: 'Construction Safety Orders - Injury Prevention',
    description: 'California construction safety requirements including Code of Safe Practices.',
    regulatoryBody: 'Cal/OSHA',
    category: 'General Duty',
    jurisdiction: 'State',
    applicableIndustries: ['Construction'],
    keyRequirements: [
      'Written Code of Safe Practices',
      'Hazard assessment before work',
      'Safety meetings and toolbox talks',
      'Personal protective equipment',
      'Fall protection programs'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment'],
    sourceUrl: 'https://www.dir.ca.gov/title8/1509.html'
  },
  {
    id: 'calosha-3314',
    code: 'CCR Title 8 §3314',
    title: 'Cleaning, Repairing, or Servicing Machinery',
    description: 'California Lockout/Tagout requirements for controlling hazardous energy.',
    regulatoryBody: 'Cal/OSHA',
    category: 'Machine Guarding',
    jurisdiction: 'State',
    applicableIndustries: ['Manufacturing', 'All Industries'],
    keyRequirements: [
      'Energy control procedures',
      'Employee training',
      'Periodic inspections',
      'Lockout/tagout devices',
      'Group lockout procedures'
    ],
    managementTabs: ['All Regulations', 'Pre-Task Assessment'],
    sourceUrl: 'https://www.dir.ca.gov/title8/3314.html'
  }
];

// MSHA Regulations (Mining)
export const mshaRegulations: Regulation[] = [
  {
    id: 'msha-30cfr46',
    code: '30 CFR Part 46',
    title: 'Training and Retraining of Miners at Metal/Nonmetal Mines',
    description: 'MSHA requirements for training miners engaged in shell dredging or sand, gravel, surface stone, surface clay, colloidal phosphate, or surface limestone mining.',
    regulatoryBody: 'MSHA',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    applicableIndustries: ['Mining', 'Quarrying', 'Sand & Gravel'],
    keyRequirements: [
      'New miner training (24 hours)',
      'Newly hired experienced miner training',
      'Annual refresher training (8 hours)',
      'Hazard training before starting work',
      'Task training for new tasks',
      'Training plan documentation'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-H/part-46'
  },
  {
    id: 'msha-30cfr48',
    code: '30 CFR Part 48',
    title: 'Training and Retraining of Miners at Underground/Surface Mines',
    description: 'MSHA training requirements for underground and surface coal mines and metal/nonmetal mines.',
    regulatoryBody: 'MSHA',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    applicableIndustries: ['Mining', 'Coal Mining'],
    keyRequirements: [
      'New miner training (40 hours)',
      'Annual refresher training (8 hours)',
      'Task training requirements',
      'Hazard recognition training',
      'First aid training',
      'Approved training plans'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-H/part-48'
  },
  {
    id: 'msha-30cfr56',
    code: '30 CFR Part 56',
    title: 'Safety and Health Standards - Surface Metal/Nonmetal Mines',
    description: 'Comprehensive safety standards for surface metal and nonmetal mining operations.',
    regulatoryBody: 'MSHA',
    category: 'General Duty',
    jurisdiction: 'Federal',
    applicableIndustries: ['Mining', 'Quarrying'],
    keyRequirements: [
      'Ground control requirements',
      'Fire prevention and control',
      'Compressed air and boilers',
      'Drilling and blasting',
      'Loading, hauling, and dumping',
      'Machinery and equipment guards'
    ],
    managementTabs: ['All Regulations', 'Risk Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-K/part-56'
  },
  {
    id: 'msha-30cfr57',
    code: '30 CFR Part 57',
    title: 'Safety and Health Standards - Underground Metal/Nonmetal Mines',
    description: 'Safety and health standards for underground metal and nonmetal mining operations.',
    regulatoryBody: 'MSHA',
    category: 'General Duty',
    jurisdiction: 'Federal',
    applicableIndustries: ['Mining'],
    keyRequirements: [
      'Ventilation requirements',
      'Ground support systems',
      'Hoisting and haulage',
      'Explosives and blasting',
      'Self-rescue devices',
      'Emergency evacuation procedures'
    ],
    managementTabs: ['All Regulations', 'Risk Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-K/part-57'
  },
  {
    id: 'msha-30cfr50',
    code: '30 CFR Part 50',
    title: 'Notification, Investigation, Reports and Records',
    description: 'Requirements for reporting and investigating mine accidents, injuries, and occupational illnesses.',
    regulatoryBody: 'MSHA',
    category: 'General Duty',
    jurisdiction: 'Federal',
    applicableIndustries: ['Mining'],
    keyRequirements: [
      'Immediate notification of accidents',
      'Investigation of accidents',
      'Quarterly injury/illness reports',
      'Record retention requirements',
      'Reportable incidents defined'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-H/part-50'
  },
  {
    id: 'msha-respirable-dust',
    code: '30 CFR Part 70/71',
    title: 'Respirable Coal Mine Dust',
    description: 'Standards for controlling respirable dust in coal mines to prevent black lung disease.',
    regulatoryBody: 'MSHA',
    category: 'Industrial Hygiene',
    jurisdiction: 'Federal',
    applicableIndustries: ['Coal Mining'],
    keyRequirements: [
      'Dust sampling requirements',
      'Respirable dust standard (1.5 mg/m³)',
      'Continuous personal dust monitors',
      'Ventilation and dust controls',
      'Medical surveillance program'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-O/part-70'
  }
];

// NRC Nuclear Safety Regulations
export const nrcRegulations: Regulation[] = [
  {
    id: 'nrc-10cfr20',
    code: '10 CFR Part 20',
    title: 'Standards for Protection Against Radiation',
    description: 'NRC standards for protecting workers and the public from ionizing radiation.',
    regulatoryBody: 'NRC',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    applicableIndustries: ['Nuclear', 'Healthcare', 'Research', 'Industrial Radiography'],
    keyRequirements: [
      'Occupational dose limits (5 rem/year)',
      'ALARA program implementation',
      'Radiation monitoring and dosimetry',
      'Posting and labeling requirements',
      'Records and reports',
      'Surveys and monitoring'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part020/'
  },
  {
    id: 'nrc-10cfr19',
    code: '10 CFR Part 19',
    title: 'Notices, Instructions, and Reports to Workers',
    description: 'Requirements for informing and training workers about radiation protection.',
    regulatoryBody: 'NRC',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    applicableIndustries: ['Nuclear', 'All Licensed Facilities'],
    keyRequirements: [
      'Posting of NRC forms and notices',
      'Worker instruction requirements',
      'Written requests for exposure records',
      'Notification of violations',
      'Worker rights information'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part019/'
  },
  {
    id: 'nrc-10cfr50',
    code: '10 CFR Part 50',
    title: 'Domestic Licensing of Production and Utilization Facilities',
    description: 'Licensing requirements for nuclear power plants and other production facilities.',
    regulatoryBody: 'NRC',
    category: 'General Duty',
    jurisdiction: 'Federal',
    applicableIndustries: ['Nuclear Power Plants'],
    keyRequirements: [
      'License application requirements',
      'Technical specifications',
      'Quality assurance criteria',
      'Emergency planning',
      'Operator licensing',
      'Reporting requirements'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part050/'
  },
  {
    id: 'nrc-10cfr30',
    code: '10 CFR Part 30',
    title: 'Rules of General Applicability to Domestic Licensing of Byproduct Material',
    description: 'General rules for licensing byproduct materials (radioactive materials).',
    regulatoryBody: 'NRC',
    category: 'Hazardous Materials',
    jurisdiction: 'Federal',
    applicableIndustries: ['Nuclear', 'Medical', 'Industrial'],
    keyRequirements: [
      'License requirements',
      'Exemptions and general licenses',
      'Transfer and disposal',
      'Security requirements',
      'Inspections and enforcement'
    ],
    managementTabs: ['All Regulations', 'Risk Management'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part030/'
  },
  {
    id: 'nrc-10cfr26',
    code: '10 CFR Part 26',
    title: 'Fitness for Duty Programs',
    description: 'Requirements for fitness-for-duty programs at nuclear facilities.',
    regulatoryBody: 'NRC',
    category: 'Occupational Health',
    jurisdiction: 'Federal',
    applicableIndustries: ['Nuclear Power Plants'],
    keyRequirements: [
      'Drug and alcohol testing',
      'Behavioral observation program',
      'Employee assistance programs',
      'Fatigue management',
      'Access authorization'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part026/'
  },
  {
    id: 'nrc-10cfr35',
    code: '10 CFR Part 35',
    title: 'Medical Use of Byproduct Material',
    description: 'Requirements for medical use of radioactive materials.',
    regulatoryBody: 'NRC',
    category: 'Hazardous Materials',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Medical'],
    keyRequirements: [
      'Authorized user requirements',
      'Radiation safety officer duties',
      'Written directives for procedures',
      'Medical event reporting',
      'Patient release criteria'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part035/'
  },
  {
    id: 'nrc-emergency',
    code: '10 CFR Part 50.47',
    title: 'Emergency Plans',
    description: 'Emergency planning requirements for nuclear power plants.',
    regulatoryBody: 'NRC',
    category: 'Fire Protection',
    jurisdiction: 'Federal',
    applicableIndustries: ['Nuclear Power Plants'],
    keyRequirements: [
      'Emergency classification system',
      'Notification procedures',
      'Emergency response organization',
      'Assessment actions',
      'Protective response',
      'Exercise and drill requirements'
    ],
    managementTabs: ['All Regulations', 'Risk Management'],
    sourceUrl: 'https://www.nrc.gov/reading-rm/doc-collections/cfr/part050/part050-0047.html'
  }
];

// HIPAA Regulations (Healthcare Privacy)
export const hipaaRegulations: Regulation[] = [
  {
    id: 'hipaa-privacy-rule',
    code: '45 CFR Part 164 Subpart E',
    title: 'HIPAA Privacy Rule',
    description: 'Standards for protecting individuals identifiable health information (PHI) by covered entities.',
    regulatoryBody: 'HIPAA',
    category: 'Healthcare Privacy',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Health Insurance', 'Healthcare Clearinghouses'],
    keyRequirements: [
      'Notice of privacy practices',
      'Individual rights to access PHI',
      'Minimum necessary standard',
      'Authorization requirements',
      'Business associate agreements',
      'Uses and disclosures of PHI'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.hhs.gov/hipaa/for-professionals/privacy/index.html'
  },
  {
    id: 'hipaa-security-rule',
    code: '45 CFR Part 164 Subpart C',
    title: 'HIPAA Security Rule',
    description: 'Standards for protecting electronic protected health information (ePHI).',
    regulatoryBody: 'HIPAA',
    category: 'Healthcare Privacy',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Health Insurance', 'Healthcare Clearinghouses'],
    keyRequirements: [
      'Administrative safeguards',
      'Physical safeguards',
      'Technical safeguards',
      'Risk analysis and management',
      'Workforce security training',
      'Access controls and audit controls'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.hhs.gov/hipaa/for-professionals/security/index.html'
  },
  {
    id: 'hipaa-breach-notification',
    code: '45 CFR Part 164 Subpart D',
    title: 'HIPAA Breach Notification Rule',
    description: 'Requirements for notifying individuals, HHS, and media of PHI breaches.',
    regulatoryBody: 'HIPAA',
    category: 'Healthcare Privacy',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Health Insurance', 'Healthcare Clearinghouses'],
    keyRequirements: [
      'Individual notification within 60 days',
      'HHS notification requirements',
      'Media notification for large breaches',
      'Business associate breach obligations',
      'Breach risk assessment',
      'Documentation of breach investigations'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.hhs.gov/hipaa/for-professionals/breach-notification/index.html'
  },
  {
    id: 'hipaa-enforcement',
    code: '45 CFR Part 160',
    title: 'HIPAA Enforcement Rule',
    description: 'Provisions relating to compliance and enforcement of HIPAA rules.',
    regulatoryBody: 'HIPAA',
    category: 'Healthcare Privacy',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Health Insurance', 'Healthcare Clearinghouses'],
    keyRequirements: [
      'Civil monetary penalties',
      'Investigation procedures',
      'Hearing procedures',
      'Compliance reviews',
      'Complaint procedures'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.hhs.gov/hipaa/for-professionals/compliance-enforcement/index.html'
  },
  {
    id: 'hipaa-omnibus',
    code: '78 FR 5566',
    title: 'HIPAA Omnibus Rule',
    description: 'Final rule implementing HITECH Act modifications to HIPAA.',
    regulatoryBody: 'HIPAA',
    category: 'Healthcare Privacy',
    jurisdiction: 'Federal',
    applicableIndustries: ['Healthcare', 'Health Insurance', 'Healthcare Clearinghouses', 'Business Associates'],
    keyRequirements: [
      'Direct liability for business associates',
      'Enhanced patient rights',
      'Genetic information protections',
      'Marketing restrictions',
      'Stronger enforcement'
    ],
    managementTabs: ['All Regulations', 'Quality Management'],
    sourceUrl: 'https://www.hhs.gov/hipaa/for-professionals/privacy/laws-regulations/combined-regulation-text/omnibus-hipaa-rulemaking/index.html'
  }
];

// BSEE Regulations (Bureau of Safety and Environmental Enforcement - Offshore)
export const bseeRegulations: Regulation[] = [
  {
    id: 'bsee-30cfr250',
    code: '30 CFR Part 250',
    title: 'Oil and Gas and Sulphur Operations in the Outer Continental Shelf',
    description: 'Comprehensive regulations for offshore oil, gas, and sulphur operations.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Operations'],
    keyRequirements: [
      'Safety and Environmental Management Systems (SEMS)',
      'Drilling requirements',
      'Well control requirements',
      'Production safety systems',
      'Platform structural requirements',
      'Pollution prevention'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-II/subchapter-B/part-250'
  },
  {
    id: 'bsee-sems',
    code: '30 CFR 250.1900-1933',
    title: 'Safety and Environmental Management Systems (SEMS)',
    description: 'Requirements for SEMS program for offshore oil and gas operations.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Operations'],
    keyRequirements: [
      'General provisions and safety culture',
      'Hazards analysis',
      'Management of change',
      'Safe work practices',
      'Training requirements',
      'Mechanical integrity',
      'Pre-startup review',
      'Emergency response and control',
      'Investigation of incidents',
      'Audits of SEMS program'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.bsee.gov/what-we-do/regulatory-development/regulations/safety-and-environmental-management-systems'
  },
  {
    id: 'bsee-well-control',
    code: '30 CFR 250 Subpart D',
    title: 'Well Control Rule (Blowout Preventer Systems)',
    description: 'Requirements for blowout preventer systems and well control operations.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Drilling'],
    keyRequirements: [
      'BOP stack requirements',
      'BOP testing requirements',
      'Real-time monitoring',
      'Third-party verification',
      'Well design requirements',
      'Casing and cementing requirements'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.bsee.gov/guidance-and-regulations/regulations/well-control-rule'
  },
  {
    id: 'bsee-production-safety',
    code: '30 CFR 250 Subpart H',
    title: 'Production Safety Systems',
    description: 'Requirements for production safety systems on offshore facilities.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Production'],
    keyRequirements: [
      'Surface safety valves',
      'Subsurface safety valves',
      'Pressure safety systems',
      'Fire and gas detection',
      'Emergency shutdown systems',
      'Platform piping requirements'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-II/subchapter-B/part-250/subpart-H'
  },
  {
    id: 'bsee-incident-reporting',
    code: '30 CFR 250.188-190',
    title: 'BSEE Incident Reporting Requirements',
    description: 'Requirements for reporting incidents, injuries, and spills.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Operations'],
    keyRequirements: [
      'Immediate incident notification',
      'Written incident reports',
      'Injury reporting',
      'Spill reporting',
      'Equipment failure reporting',
      'Root cause analysis requirements'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.bsee.gov/what-we-do/incident-investigation'
  },
  {
    id: 'bsee-decommissioning',
    code: '30 CFR 250 Subpart Q',
    title: 'Decommissioning Activities',
    description: 'Requirements for platform removal and well abandonment.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Operations'],
    keyRequirements: [
      'Platform removal requirements',
      'Well plugging requirements',
      'Site clearance verification',
      'Financial assurance',
      'Decommissioning applications'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-II/subchapter-B/part-250/subpart-Q'
  },
  {
    id: 'bsee-workplace-safety',
    code: '30 CFR 250.106-107',
    title: 'Offshore Workplace Safety Standards',
    description: 'General workplace safety requirements for offshore facilities.',
    regulatoryBody: 'BSEE',
    category: 'Offshore Safety',
    jurisdiction: 'Federal',
    applicableIndustries: ['Oil & Gas', 'Offshore Operations'],
    keyRequirements: [
      'Personal protective equipment',
      'Hazard communication',
      'Fire prevention',
      'Crane operations',
      'Diving operations',
      'Helicopter operations'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'Risk Management'],
    sourceUrl: 'https://www.bsee.gov/what-we-do/inspections/inspections-program'
  }
];

// Global Regulatory Bodies Regulations
export const globalRegulations: Regulation[] = [
  // EU-OSHA (European Agency for Safety and Health at Work)
  {
    id: 'eu-osha-framework',
    code: 'Directive 89/391/EEC',
    title: 'Framework Directive on Safety and Health at Work',
    description: 'The basic EU directive establishing principles for workplace safety and health across all member states.',
    regulatoryBody: 'EU-OSHA',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Risk assessment obligation',
      'Prevention principles',
      'Worker information and training',
      'Health surveillance',
      'Emergency procedures'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Risk Management'],
    sourceUrl: 'https://osha.europa.eu/en/legislation/directives/the-osh-framework-directive'
  },
  {
    id: 'eu-osha-chemical-agents',
    code: 'Directive 98/24/EC',
    title: 'Chemical Agents Directive',
    description: 'Protection of worker health and safety from risks related to chemical agents at work.',
    regulatoryBody: 'EU-OSHA',
    category: 'Hazardous Materials',
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Chemical', 'Construction'],
    keyRequirements: [
      'Chemical risk assessment',
      'Occupational exposure limits',
      'Substitution principle',
      'Collective and individual protection',
      'Health surveillance'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene', 'International Standards'],
    sourceUrl: 'https://osha.europa.eu/en/legislation/directives/exposure-to-chemical-agents-and-chemical-safety'
  },
  {
    id: 'eu-osha-machinery',
    code: 'Directive 2006/42/EC',
    title: 'Machinery Directive',
    description: 'Essential health and safety requirements for machinery design and construction.',
    regulatoryBody: 'EU-OSHA',
    category: 'Machinery Safety',
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Construction', 'Agriculture'],
    keyRequirements: [
      'CE marking requirements',
      'Risk assessment for machinery',
      'Safety components',
      'Technical documentation',
      'Declaration of conformity'
    ],
    managementTabs: ['All Regulations', 'Quality Management', 'International Standards'],
    sourceUrl: 'https://osha.europa.eu/en/legislation/directives/directive-2006-42-ec-of-the-european-parliament-and-of-the-council'
  },
  // HSE UK (Health and Safety Executive)
  {
    id: 'hse-hswa',
    code: 'HSWA 1974',
    title: 'Health and Safety at Work Act',
    description: 'The primary piece of legislation covering occupational health and safety in Great Britain.',
    regulatoryBody: 'HSE UK',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'General duties of employers',
      'Employee duties',
      'Risk assessment requirements',
      'Safety policy documentation',
      'Consultation with workers'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Quality Management'],
    sourceUrl: 'https://www.hse.gov.uk/legislation/hswa.htm'
  },
  {
    id: 'hse-mhswr',
    code: 'MHSWR 1999',
    title: 'Management of Health and Safety at Work Regulations',
    description: 'Regulations requiring employers to assess and manage workplace risks.',
    regulatoryBody: 'HSE UK',
    category: 'Risk Management',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Risk assessment',
      'Health and safety arrangements',
      'Health surveillance',
      'Competent person appointment',
      'Emergency procedures'
    ],
    managementTabs: ['All Regulations', 'Risk Management', 'International Standards'],
    sourceUrl: 'https://www.hse.gov.uk/managing/index.htm'
  },
  {
    id: 'hse-coshh',
    code: 'COSHH 2002',
    title: 'Control of Substances Hazardous to Health Regulations',
    description: 'UK regulations for controlling exposure to hazardous substances.',
    regulatoryBody: 'HSE UK',
    category: 'Hazardous Materials',
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Chemical', 'Healthcare'],
    keyRequirements: [
      'COSHH assessment',
      'Workplace exposure limits',
      'Control measures',
      'Health monitoring',
      'Information and training'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene', 'International Standards'],
    sourceUrl: 'https://www.hse.gov.uk/coshh/'
  },
  // Safe Work Australia
  {
    id: 'swa-whs-act',
    code: 'WHS Act 2011',
    title: 'Model Work Health and Safety Act',
    description: 'Australia harmonized work health and safety framework legislation.',
    regulatoryBody: 'Safe Work Australia',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Primary duty of care',
      'Worker consultation',
      'Issue resolution',
      'Health and safety representatives',
      'Risk management'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Quality Management'],
    sourceUrl: 'https://www.safeworkaustralia.gov.au/law-and-regulation/model-whs-laws'
  },
  {
    id: 'swa-codes-practice',
    code: 'Model Codes of Practice',
    title: 'Australian Model Codes of Practice',
    description: 'Practical guidance for achieving the standards of health and safety required under the WHS Act.',
    regulatoryBody: 'Safe Work Australia',
    category: 'Risk Management',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'How to manage work health and safety risks',
      'Hazardous manual tasks',
      'Managing noise and preventing hearing loss',
      'Confined spaces',
      'First aid in the workplace'
    ],
    managementTabs: ['All Regulations', 'Risk Management', 'International Standards'],
    sourceUrl: 'https://www.safeworkaustralia.gov.au/law-and-regulation/codes-practice'
  },
  // WorkSafeBC (Canada)
  {
    id: 'worksafebc-ohs-reg',
    code: 'OHS Regulation BC',
    title: 'British Columbia Occupational Health and Safety Regulation',
    description: 'Comprehensive workplace safety regulation for British Columbia, Canada.',
    regulatoryBody: 'WorkSafeBC',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'General health and safety requirements',
      'Violence in the workplace',
      'Ergonomics requirements',
      'Chemical and biological substances',
      'Workplace conduct'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.worksafebc.com/en/law-policy/occupational-health-safety/ohsr-part-04-general-conditions'
  },
  // INRS France
  {
    id: 'inrs-chemical-risk',
    code: 'INRS ED 6382',
    title: 'Chemical Risk Assessment Guide',
    description: 'French guidance for workplace chemical risk assessment and prevention.',
    regulatoryBody: 'INRS',
    category: 'Hazardous Materials',
    jurisdiction: 'International',
    applicableIndustries: ['Manufacturing', 'Chemical', 'Pharmaceutical'],
    keyRequirements: [
      'Identify hazardous chemicals',
      'Assess exposure risks',
      'Implement prevention measures',
      'Monitor workplace air',
      'Train employees'
    ],
    managementTabs: ['All Regulations', 'Industrial Hygiene', 'International Standards'],
    sourceUrl: 'https://www.inrs.fr/risques/chimiques/'
  },
  // BG Germany (Berufsgenossenschaften)
  {
    id: 'bg-dguv-v1',
    code: 'DGUV Vorschrift 1',
    title: 'Principles of Prevention',
    description: 'German statutory accident insurance regulations for workplace safety.',
    regulatoryBody: 'BG',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Employer safety obligations',
      'Risk assessment duties',
      'Safety officers appointment',
      'First aid organization',
      'Personal protective equipment'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Quality Management'],
    sourceUrl: 'https://www.dguv.de/en/prevention/regulations_publications/index.jsp'
  },
  // JISHA Japan
  {
    id: 'jisha-industrial-safety',
    code: 'Industrial Safety Health Law',
    title: 'Japan Industrial Safety and Health Act',
    description: 'Japanese comprehensive legislation for workplace safety and health.',
    regulatoryBody: 'JISHA',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Safety and health management',
      'Safety committees',
      'Health examinations',
      'Training requirements',
      'Hazard prevention measures'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.jisha.or.jp/english/'
  },
  // KOSHA Korea
  {
    id: 'kosha-osha',
    code: 'KOSHA Standards',
    title: 'Korean Occupational Safety and Health Standards',
    description: 'Korean national standards for workplace safety and health.',
    regulatoryBody: 'KOSHA',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Safety management systems',
      'Risk assessment',
      'Safety inspection',
      'Worker training',
      'Accident investigation'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.kosha.or.kr/english/'
  },
  // MOM Singapore
  {
    id: 'mom-wsh-act',
    code: 'WSH Act',
    title: 'Singapore Workplace Safety and Health Act',
    description: 'Singapore primary legislation for workplace safety and health.',
    regulatoryBody: 'MOM Singapore',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Duties of employers',
      'Risk management requirements',
      'Safety and health management systems',
      'Incident reporting',
      'Penalties for non-compliance'
    ],
    managementTabs: ['All Regulations', 'International Standards', 'Risk Management'],
    sourceUrl: 'https://www.mom.gov.sg/workplace-safety-and-health'
  },
  // DOSH Malaysia
  {
    id: 'dosh-osha',
    code: 'OSHA 1994',
    title: 'Malaysia Occupational Safety and Health Act',
    description: 'Malaysian legislation for ensuring safety, health and welfare of persons at work.',
    regulatoryBody: 'DOSH Malaysia',
    category: 'General Duty',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'General duties of employers',
      'Safety and health policy',
      'Safety and health committees',
      'Notification of accidents',
      'Safety and health officers'
    ],
    managementTabs: ['All Regulations', 'International Standards'],
    sourceUrl: 'https://www.dosh.gov.my/index.php/legislation/acts'
  },
  // IOSH (Institution of Occupational Safety and Health)
  {
    id: 'iosh-managing-safely',
    code: 'IOSH Managing Safely',
    title: 'IOSH Managing Safely Standards',
    description: 'International professional standards for health and safety management.',
    regulatoryBody: 'IOSH',
    category: 'Risk Management',
    jurisdiction: 'International',
    applicableIndustries: ['All Industries'],
    keyRequirements: [
      'Risk assessment methodology',
      'Hazard identification',
      'Control hierarchy',
      'Incident investigation',
      'Performance measurement'
    ],
    managementTabs: ['All Regulations', 'Risk Management', 'International Standards'],
    sourceUrl: 'https://iosh.com/training-and-skills/iosh-training/'
  }
];

// Combine all regulations
const dedupeValues = (values?: string[]) => {
  if (!values || values.length === 0) {
    return values;
  }

  return Array.from(new Set(values));
};

const dedupeRegulations = (regulations: Regulation[]): Regulation[] => {
  const uniqueRegulations = new Map<string, Regulation>();

  for (const regulation of regulations) {
    const existing = uniqueRegulations.get(regulation.id);

    if (!existing) {
      uniqueRegulations.set(regulation.id, regulation);
      continue;
    }

    uniqueRegulations.set(regulation.id, {
      ...existing,
      ...regulation,
      managementTabs: dedupeValues([
        ...existing.managementTabs,
        ...regulation.managementTabs,
      ]) as ManagementTab[],
      applicableIndustries: dedupeValues([
        ...(existing.applicableIndustries || []),
        ...(regulation.applicableIndustries || []),
      ]),
      keyRequirements: dedupeValues([
        ...(existing.keyRequirements || []),
        ...(regulation.keyRequirements || []),
      ]),
      relatedStandards: dedupeValues([
        ...(existing.relatedStandards || []),
        ...(regulation.relatedStandards || []),
      ]),
      sourceUrl: regulation.sourceUrl || existing.sourceUrl,
    });
  }

  return Array.from(uniqueRegulations.values());
};

export const allRegulations: Regulation[] = dedupeRegulations([
  ...osha1910Regulations,
  ...osha1926Regulations,
  ...epaRegulations,
  ...nfpaStandards,
  ...nioshRecommendations,
  ...acgihStandards,
  ...astmStandards,
  ...isoStandards,
  ...ansiStandards,
  ...internationalStandards,
  ...aiRoboticsStandards,
  ...additionalAstmStandards,
  ...additionalOshaStandards,
  ...preTaskAssessmentStandards,
  ...calOshaRegulations,
  ...mshaRegulations,
  ...nrcRegulations,
  ...hipaaRegulations,
  ...bseeRegulations,
  ...globalRegulations
]);

// Helper functions
export const getRegulationsByBody = (body: RegulatoryBody): Regulation[] => {
  return allRegulations.filter(reg => reg.regulatoryBody === body);
};

export const getRegulationsByCategory = (category: RegulationCategory): Regulation[] => {
  return allRegulations.filter(reg => reg.category === category);
};

export const getRegulationsByTab = (tab: ManagementTab): Regulation[] => {
  return allRegulations.filter(reg => reg.managementTabs.includes(tab));
};

export const searchRegulations = (query: string): Regulation[] => {
  const lowerQuery = query.toLowerCase();
  return allRegulations.filter(reg => 
    reg.code.toLowerCase().includes(lowerQuery) ||
    reg.title.toLowerCase().includes(lowerQuery) ||
    reg.description.toLowerCase().includes(lowerQuery) ||
    reg.regulatoryBody.toLowerCase().includes(lowerQuery) ||
    reg.category.toLowerCase().includes(lowerQuery) ||
    (reg.keyRequirements && reg.keyRequirements.some(req => req.toLowerCase().includes(lowerQuery)))
  );
};

export const regulatoryBodies: RegulatoryBody[] = ['OSHA', 'Cal/OSHA', 'MSHA', 'NRC', 'EPA', 'NFPA', 'NIOSH', 'ASTM', 'ISO', 'ANSI', 'ACGIH', 'IEC', 'EN', 'CSA', 'AS/NZS', 'OHSAS', 'ILO', 'HIPAA', 'BSEE', 'EU-OSHA', 'HSE UK', 'Safe Work Australia', 'WorkSafeBC', 'INRS', 'BG', 'JISHA', 'KOSHA', 'MOM Singapore', 'DOSH Malaysia', 'IOSH'];

export const categories: RegulationCategory[] = [
  'General Duty',
  'Walking-Working Surfaces',
  'Means of Egress',
  'Occupational Health',
  'Hazardous Materials',
  'Personal Protective Equipment',
  'Fire Protection',
  'Electrical',
  'Machine Guarding',
  'Welding',
  'Scaffolding',
  'Fall Protection',
  'Excavations',
  'Cranes & Rigging',
  'Air Quality',
  'Water Quality',
  'Waste Management',
  'Quality Management',
  'Environmental Management',
  'Industrial Hygiene',
  'Exposure Limits',
  'Testing Methods',
  'Fire Safety',
  'Life Safety',
  'AI & Robotics',
  'Machinery Safety',
  'International Standards',
  'Risk Management',
  'Pre-Task Assessment',
  'Healthcare Privacy',
  'Offshore Safety'
];

export const managementTabs: ManagementTab[] = [
  'All Regulations',
  'Quality Management',
  'Industrial Hygiene',
  'International Standards',
  'AI & Robotics',
  'Risk Management',
  'Pre-Task Assessment'
];
