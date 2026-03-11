export const auditLocations = [
  'Warehouse A',
  'Warehouse B',
  'Production Line 1',
  'Production Line 2',
  'Chemical Storage',
  'Loading Dock',
  'Office Area',
  'Cafeteria'
];

export const auditChecklist = [
  {
    id: '1',
    category: 'General Safety',
    items: [
      'Walkways are clear of obstructions',
      'Floors are clean and dry',
      'Lighting is adequate',
      'Emergency exits are marked and accessible'
    ]
  },
  {
    id: '2',
    category: 'Fire Safety',
    items: [
      'Fire extinguishers are present and charged',
      'Sprinkler heads are unobstructed',
      'Fire alarm pull stations are accessible',
      'Flammable materials are stored correctly'
    ]
  },
  {
    id: '3',
    category: 'PPE',
    items: [
      'Employees are wearing required PPE',
      'PPE is in good condition',
      'Safety signs are visible'
    ]
  },
  {
    id: '4',
    category: 'Electrical',
    items: [
      'Electrical panels are accessible',
      'Cords and cables are in good condition',
      'Lockout/Tagout procedures are followed'
    ]
  }
];

// Industry-Specific Audit Templates
export interface IndustryHazard {
  id: string;
  hazard: string;
  category: string;
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  regulatoryRef: string;
  checkPoints: string[];
}

export interface IndustryAuditTemplate {
  id: string;
  industry: 'Oil & Gas' | 'Construction' | 'Manufacturing' | 'Healthcare' | 'Mining' | 'Utilities' | 'Transportation';
  name: string;
  description: string;
  hazardCategories: string[];
  hazards: IndustryHazard[];
  complianceReferences: {
    body: string;
    code: string;
    title: string;
  }[];
  lastUpdated: string;
}

export const industryAuditTemplates: IndustryAuditTemplate[] = [
  // OIL & GAS INDUSTRY
  {
    id: 'audit-oil-gas',
    industry: 'Oil & Gas',
    name: 'Oil & Gas Operations Safety Audit',
    description: 'Comprehensive audit template for upstream, midstream, and downstream oil & gas operations covering drilling, refining, and pipeline hazards.',
    hazardCategories: [
      'Process Safety',
      'Fire & Explosion',
      'H2S & Toxic Gas',
      'Confined Space',
      'Pressure Systems',
      'Electrical Hazards'
    ],
    hazards: [
      {
        id: 'og-1',
        hazard: 'Hydrogen Sulfide (H2S) Exposure',
        category: 'H2S & Toxic Gas',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1910.1000',
        checkPoints: [
          'H2S monitors calibrated and functional',
          'Personal H2S detectors issued to all personnel',
          'Wind socks/streamers in place',
          'SCBA equipment available and inspected',
          'H2S contingency plan posted',
          'Personnel trained on H2S awareness (within 12 months)'
        ]
      },
      {
        id: 'og-2',
        hazard: 'Well Control / Blowout Prevention',
        category: 'Process Safety',
        severity: 'Critical',
        regulatoryRef: 'API RP 53 / BSEE 30 CFR 250',
        checkPoints: [
          'BOP stack tested per schedule',
          'Kill and choke manifolds operational',
          'Well control drills conducted quarterly',
          'Kick detection equipment calibrated',
          'Mud weight and volume monitored',
          'IADC Well Control certifications current'
        ]
      },
      {
        id: 'og-3',
        hazard: 'Hydrocarbon Release / Fire',
        category: 'Fire & Explosion',
        severity: 'Critical',
        regulatoryRef: 'OSHA PSM 29 CFR 1910.119',
        checkPoints: [
          'Hot work permit system in place',
          'Gas detection system operational',
          'Fire suppression systems inspected',
          'Flare system operational',
          'Emergency shutdown (ESD) tested',
          'Fire water pumps tested weekly'
        ]
      },
      {
        id: 'og-4',
        hazard: 'Pressure Vessel Integrity',
        category: 'Pressure Systems',
        severity: 'High',
        regulatoryRef: 'API 510 / ASME BPVC',
        checkPoints: [
          'Pressure relief valves tested annually',
          'Vessel inspection records current',
          'Corrosion monitoring program active',
          'Pressure gauges calibrated',
          'Overpressure protection verified',
          'P&IDs current and accessible'
        ]
      },
      {
        id: 'og-5',
        hazard: 'Confined Space Entry (Tanks/Vessels)',
        category: 'Confined Space',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1910.146',
        checkPoints: [
          'Permit-required confined space program',
          'Atmospheric testing before entry',
          'Rescue team/equipment available',
          'Entry permits properly completed',
          'Ventilation equipment operational',
          'Communication systems tested'
        ]
      },
      {
        id: 'og-6',
        hazard: 'Pipeline Integrity Failure',
        category: 'Process Safety',
        severity: 'High',
        regulatoryRef: 'PHMSA 49 CFR 192/195',
        checkPoints: [
          'Pipeline inspection pig runs completed',
          'Cathodic protection readings current',
          'Leak detection system operational',
          'ROW cleared and accessible',
          'Emergency response plan current',
          'Valve maintenance records up to date'
        ]
      }
    ],
    complianceReferences: [
      { body: 'OSHA', code: '29 CFR 1910.119', title: 'Process Safety Management (PSM)' },
      { body: 'EPA', code: '40 CFR 68', title: 'Risk Management Program (RMP)' },
      { body: 'API', code: 'API RP 75', title: 'Development of Safety and Environmental Management Program' },
      { body: 'BSEE', code: '30 CFR 250', title: 'Oil and Gas & Sulphur Operations in OCS' },
      { body: 'PHMSA', code: '49 CFR 192', title: 'Transportation of Natural Gas' }
    ],
    lastUpdated: '2026-01-07'
  },
  // CONSTRUCTION INDUSTRY
  {
    id: 'audit-construction',
    industry: 'Construction',
    name: 'Construction Site Safety Audit',
    description: 'Comprehensive audit for construction sites covering fall protection, excavation, scaffolding, crane operations, and electrical hazards per OSHA 1926.',
    hazardCategories: [
      'Fall Protection',
      'Excavation & Trenching',
      'Scaffolding',
      'Crane & Rigging',
      'Electrical',
      'Struck-By Hazards'
    ],
    hazards: [
      {
        id: 'con-1',
        hazard: 'Falls from Height',
        category: 'Fall Protection',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1926.501',
        checkPoints: [
          'Guardrails installed at 6ft+ elevations',
          'Personal fall arrest systems (PFAS) in use',
          'Anchorage points rated for 5,000 lbs',
          'Safety nets installed where applicable',
          'Leading edge work plan documented',
          'Fall protection training current',
          'Warning line systems properly installed',
          'Controlled access zones marked'
        ]
      },
      {
        id: 'con-2',
        hazard: 'Trench/Excavation Collapse',
        category: 'Excavation & Trenching',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1926.650-652',
        checkPoints: [
          'Competent person designated and on-site',
          'Soil classification documented',
          'Protective systems in place (slope/shore/shield)',
          'Excavations inspected daily',
          'Spoil piles 2ft+ from edge',
          'Ladders within 25ft of workers',
          'Utilities located and marked',
          'Water accumulation controlled'
        ]
      },
      {
        id: 'con-3',
        hazard: 'Scaffolding Failure',
        category: 'Scaffolding',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1926.451',
        checkPoints: [
          'Scaffold erected by qualified person',
          'Full planking with no gaps >1 inch',
          'Guardrails on all open sides',
          'Access ladder/stairs provided',
          'Scaffold tagged (green/yellow/red)',
          'Base plates and mudsills in place',
          'Cross-bracing properly installed',
          'Load capacity posted'
        ]
      },
      {
        id: 'con-4',
        hazard: 'Crane/Rigging Incidents',
        category: 'Crane & Rigging',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1926.1400-1442',
        checkPoints: [
          'Operator certification verified',
          'Daily crane inspection completed',
          'Load chart available and consulted',
          'Outriggers fully extended',
          'Swing radius barricaded',
          'Signal person designated',
          'Rigging inspected before use',
          'Power line clearance maintained'
        ]
      },
      {
        id: 'con-5',
        hazard: 'Electrical Contact (Overhead/Temporary)',
        category: 'Electrical',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1926.405/416',
        checkPoints: [
          'GFCI protection on all outlets',
          'Assured equipment grounding program',
          'Temporary wiring properly supported',
          'Electrical panels accessible',
          'Overhead power line distance maintained',
          'Extension cords inspected',
          'Lockout/Tagout procedures followed',
          'Qualified electricians for work'
        ]
      },
      {
        id: 'con-6',
        hazard: 'Struck-By (Vehicles/Equipment/Materials)',
        category: 'Struck-By Hazards',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1926.600',
        checkPoints: [
          'High-visibility vests worn',
          'Equipment backup alarms functional',
          'Spotters used for blind spots',
          'Materials secured during hoisting',
          'Toe boards on elevated platforms',
          'Traffic control plan in place',
          'Hard hats worn in required areas',
          'Housekeeping maintained'
        ]
      }
    ],
    complianceReferences: [
      { body: 'OSHA', code: '29 CFR 1926', title: 'Safety and Health Regulations for Construction' },
      { body: 'OSHA', code: '29 CFR 1926.502', title: 'Fall Protection Systems Criteria' },
      { body: 'ANSI', code: 'ANSI A10.32', title: 'Personal Fall Protection Used in Construction' },
      { body: 'ASME', code: 'ASME B30.5', title: 'Mobile and Locomotive Cranes' },
      { body: 'NFPA', code: 'NFPA 70E', title: 'Standard for Electrical Safety in Workplace' }
    ],
    lastUpdated: '2026-01-07'
  },
  // MANUFACTURING INDUSTRY
  {
    id: 'audit-manufacturing',
    industry: 'Manufacturing',
    name: 'Manufacturing Facility Safety Audit',
    description: 'Comprehensive audit template for manufacturing operations including machine guarding, lockout/tagout, material handling, and industrial hygiene.',
    hazardCategories: [
      'Machine Guarding',
      'Lockout/Tagout',
      'Material Handling',
      'Chemical Exposure',
      'Noise & Vibration',
      'Ergonomics'
    ],
    hazards: [
      {
        id: 'mfg-1',
        hazard: 'Unguarded/Inadequate Machine Guarding',
        category: 'Machine Guarding',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1910.212',
        checkPoints: [
          'Point of operation guards installed',
          'Guard interlocks functional',
          'Pinch points identified and guarded',
          'Nip points on rotating parts guarded',
          'Flying chip/spark guards in place',
          'Guard mounting secure',
          'Emergency stops accessible',
          'Two-hand controls functional'
        ]
      },
      {
        id: 'mfg-2',
        hazard: 'Hazardous Energy Release (LOTO)',
        category: 'Lockout/Tagout',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1910.147',
        checkPoints: [
          'Written LOTO program in place',
          'Energy control procedures for each machine',
          'Authorized employee training current',
          'Locks and tags available',
          'Annual periodic inspections completed',
          'Group lockout procedures documented',
          'Verification of zero energy performed',
          'Affected employee notification process'
        ]
      },
      {
        id: 'mfg-3',
        hazard: 'Forklift/Material Handling Incidents',
        category: 'Material Handling',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1910.178',
        checkPoints: [
          'Operators trained and certified',
          'Daily pre-shift inspection completed',
          'Load capacity not exceeded',
          'Forks lowered when parked',
          'Seatbelts worn',
          'Pedestrian walkways marked',
          'Speed limits posted and followed',
          'Charging areas ventilated'
        ]
      },
      {
        id: 'mfg-4',
        hazard: 'Chemical Exposure (Solvents/Adhesives)',
        category: 'Chemical Exposure',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1910.1200',
        checkPoints: [
          'SDS readily accessible',
          'Chemical inventory current',
          'Secondary containment in place',
          'Local exhaust ventilation operational',
          'Exposure monitoring conducted',
          'Appropriate PPE provided',
          'Eye wash/safety showers functional',
          'Hazcom training completed'
        ]
      },
      {
        id: 'mfg-5',
        hazard: 'Noise-Induced Hearing Loss',
        category: 'Noise & Vibration',
        severity: 'Medium',
        regulatoryRef: 'OSHA 29 CFR 1910.95',
        checkPoints: [
          'Noise surveys completed annually',
          'Hearing conservation program active',
          'Audiometric testing current',
          'Hearing protection provided/worn',
          'High noise areas posted',
          'Engineering controls evaluated',
          'Noise exposure records maintained',
          'Training on hearing protection'
        ]
      },
      {
        id: 'mfg-6',
        hazard: 'Musculoskeletal Disorders (Ergonomics)',
        category: 'Ergonomics',
        severity: 'Medium',
        regulatoryRef: 'OSHA General Duty Clause / NIOSH Lifting Guide',
        checkPoints: [
          'Ergonomic assessments performed',
          'Repetitive motion tasks identified',
          'Lifting aids available',
          'Work station heights adjustable',
          'Job rotation implemented',
          'Anti-fatigue mats in standing areas',
          'Tool ergonomics reviewed',
          'Employee reporting program active'
        ]
      }
    ],
    complianceReferences: [
      { body: 'OSHA', code: '29 CFR 1910', title: 'General Industry Safety Standards' },
      { body: 'OSHA', code: '29 CFR 1910.147', title: 'Control of Hazardous Energy (LOTO)' },
      { body: 'ANSI', code: 'ANSI B11.19', title: 'Performance Requirements for Safeguarding' },
      { body: 'NIOSH', code: 'NIOSH 94-110', title: 'Applications Manual for NIOSH Lifting Equation' },
      { body: 'ACGIH', code: 'TLVs & BEIs', title: 'Threshold Limit Values for Chemical Substances' }
    ],
    lastUpdated: '2026-01-07'
  },
  // HEALTHCARE INDUSTRY
  {
    id: 'audit-healthcare',
    industry: 'Healthcare',
    name: 'Healthcare Facility Safety Audit',
    description: 'Comprehensive audit for hospitals, clinics, and healthcare facilities covering bloodborne pathogens, patient handling, hazardous drugs, and workplace violence.',
    hazardCategories: [
      'Bloodborne Pathogens',
      'Patient Handling',
      'Hazardous Drugs',
      'Workplace Violence',
      'Radiation Safety',
      'Infection Control'
    ],
    hazards: [
      {
        id: 'hc-1',
        hazard: 'Needlestick & Sharps Injuries',
        category: 'Bloodborne Pathogens',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1910.1030',
        checkPoints: [
          'Exposure control plan current',
          'Engineering controls (safety needles) in use',
          'Sharps containers available and not overfilled',
          'Hepatitis B vaccination offered',
          'Post-exposure evaluation program',
          'Sharps injury log maintained',
          'Annual BBP training completed',
          'Work practice controls followed'
        ]
      },
      {
        id: 'hc-2',
        hazard: 'Patient Handling Injuries (MSDs)',
        category: 'Patient Handling',
        severity: 'High',
        regulatoryRef: 'OSHA General Duty / NIOSH Safe Patient Handling',
        checkPoints: [
          'Safe patient handling policy in place',
          'Mechanical lift equipment available',
          'Lift equipment inspected regularly',
          'Patient mobility assessments conducted',
          'Staff trained on lift equipment use',
          'No-lift policy implemented',
          'Slings cleaned and inspected',
          'MSD injury tracking active'
        ]
      },
      {
        id: 'hc-3',
        hazard: 'Hazardous Drug Exposure',
        category: 'Hazardous Drugs',
        severity: 'Critical',
        regulatoryRef: 'OSHA/NIOSH Hazardous Drugs / USP 800',
        checkPoints: [
          'List of hazardous drugs maintained',
          'Biological safety cabinet (BSC) certified',
          'Closed-system transfer devices (CSTDs) used',
          'PPE (double gloving, gowns) provided',
          'Spill kits available',
          'Medical surveillance program',
          'Decontamination procedures documented',
          'Staff competency verified annually'
        ]
      },
      {
        id: 'hc-4',
        hazard: 'Workplace Violence',
        category: 'Workplace Violence',
        severity: 'High',
        regulatoryRef: 'OSHA 3148 / Joint Commission Standards',
        checkPoints: [
          'Workplace violence prevention program',
          'Risk assessments for patient areas',
          'Panic/duress alarms functional',
          'Security personnel adequate',
          'De-escalation training provided',
          'Incident reporting system active',
          'Post-incident support available',
          'Environmental design for safety'
        ]
      },
      {
        id: 'hc-5',
        hazard: 'Ionizing Radiation Exposure',
        category: 'Radiation Safety',
        severity: 'High',
        regulatoryRef: 'NRC 10 CFR 20 / State Regulations',
        checkPoints: [
          'Radiation safety officer designated',
          'Personal dosimetry (badges) issued',
          'Lead aprons/shields available and inspected',
          'Equipment survey completed annually',
          'Radiation area signage posted',
          'ALARA program implemented',
          'Radiation safety training current',
          'Radioactive waste disposed properly'
        ]
      },
      {
        id: 'hc-6',
        hazard: 'Healthcare-Associated Infections',
        category: 'Infection Control',
        severity: 'High',
        regulatoryRef: 'CDC Guidelines / CMS CoP',
        checkPoints: [
          'Hand hygiene compliance monitored',
          'Isolation precautions followed',
          'PPE donning/doffing procedures posted',
          'Environmental cleaning schedules met',
          'N95 fit testing current',
          'Infection control committee active',
          'Antibiotic stewardship program',
          'Staff vaccination rates tracked'
        ]
      }
    ],
    complianceReferences: [
      { body: 'OSHA', code: '29 CFR 1910.1030', title: 'Bloodborne Pathogens Standard' },
      { body: 'NIOSH', code: 'NIOSH 2004-165', title: 'Preventing Occupational Exposures to Antineoplastic Drugs' },
      { body: 'USP', code: 'USP <800>', title: 'Hazardous Drugs - Handling in Healthcare Settings' },
      { body: 'Joint Commission', code: 'EC Standards', title: 'Environment of Care Standards' },
      { body: 'CDC', code: 'CDC Guidelines', title: 'Guidelines for Infection Control in Healthcare' }
    ],
    lastUpdated: '2026-01-07'
  },
  // MINING INDUSTRY
  {
    id: 'audit-mining',
    industry: 'Mining',
    name: 'Mining Operations Safety Audit',
    description: 'Comprehensive audit for surface and underground mining operations covering ground control, ventilation, explosives, and mobile equipment per MSHA regulations.',
    hazardCategories: [
      'Ground Control',
      'Ventilation & Air Quality',
      'Explosives & Blasting',
      'Mobile Equipment',
      'Electrical Systems',
      'Emergency Response'
    ],
    hazards: [
      {
        id: 'min-1',
        hazard: 'Ground Control Failure',
        category: 'Ground Control',
        severity: 'Critical',
        regulatoryRef: 'MSHA 30 CFR 57.3200',
        checkPoints: [
          'Ground support inspection before each shift',
          'Roof bolting pattern documentation current',
          'Scaling performed as needed',
          'Ground control plan posted',
          'Competent person designated',
          'Damaged support reported and corrected'
        ]
      },
      {
        id: 'min-2',
        hazard: 'Inadequate Ventilation',
        category: 'Ventilation & Air Quality',
        severity: 'Critical',
        regulatoryRef: 'MSHA 30 CFR 57.8500',
        checkPoints: [
          'Ventilation plan current and posted',
          'Air velocity measurements recorded',
          'Methane monitoring active',
          'Dust sampling completed',
          'Ventilation doors functional',
          'Auxiliary fans inspected'
        ]
      },
      {
        id: 'min-3',
        hazard: 'Explosives Handling & Blasting',
        category: 'Explosives & Blasting',
        severity: 'Critical',
        regulatoryRef: 'MSHA 30 CFR 56/57 Subpart E',
        checkPoints: [
          'Blaster certification verified',
          'Magazine storage compliant',
          'Shot area cleared and guarded',
          'Misfires handled per procedure',
          'Detonator inventory reconciled',
          'Blasting signals posted'
        ]
      },
      {
        id: 'min-4',
        hazard: 'Mobile Equipment Collisions',
        category: 'Mobile Equipment',
        severity: 'High',
        regulatoryRef: 'MSHA 30 CFR 56.14100',
        checkPoints: [
          'Pre-shift equipment inspection',
          'Seatbelts worn',
          'Backup alarms functional',
          'Proximity detection systems operational',
          'Traffic patterns established',
          'Speed limits posted and enforced'
        ]
      },
      {
        id: 'min-5',
        hazard: 'Electrical Contact Underground',
        category: 'Electrical Systems',
        severity: 'High',
        regulatoryRef: 'MSHA 30 CFR 56.12000',
        checkPoints: [
          'Electrical equipment properly grounded',
          'Trailing cables inspected',
          'Permissible equipment in gassy areas',
          'Electrical work by qualified persons only',
          'GFCI protection functional',
          'Switchgear properly labeled'
        ]
      },
      {
        id: 'min-6',
        hazard: 'Emergency Evacuation Failure',
        category: 'Emergency Response',
        severity: 'High',
        regulatoryRef: 'MSHA 30 CFR 57.11050',
        checkPoints: [
          'Escapeway routes clearly marked',
          'Self-rescuers available and inspected',
          'Refuge chambers stocked and maintained',
          'Emergency drills conducted quarterly',
          'Communication systems tested',
          'Mine rescue team trained'
        ]
      }
    ],
    complianceReferences: [
      { body: 'MSHA', code: '30 CFR 56/57', title: 'Safety and Health Standards - Metal/Nonmetal' },
      { body: 'MSHA', code: '30 CFR 46', title: 'Training and Retraining of Miners' },
      { body: 'MSHA', code: '30 CFR 50', title: 'Notification, Investigation, Reports' },
      { body: 'NIOSH', code: 'Mining Program', title: 'NIOSH Mining Safety Research' },
      { body: 'OSHA', code: '29 CFR 1926.800', title: 'Underground Construction' }
    ],
    lastUpdated: '2026-01-07'
  },
  // UTILITIES INDUSTRY
  {
    id: 'audit-utilities',
    industry: 'Utilities',
    name: 'Utilities & Power Generation Safety Audit',
    description: 'Comprehensive audit for electric, gas, and water utilities covering high voltage work, confined spaces, excavation, and public safety.',
    hazardCategories: [
      'High Voltage Electrical',
      'Natural Gas Operations',
      'Confined Space Entry',
      'Excavation & Trenching',
      'Fall Protection',
      'Public Safety'
    ],
    hazards: [
      {
        id: 'util-1',
        hazard: 'High Voltage Electrical Contact',
        category: 'High Voltage Electrical',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1910.269',
        checkPoints: [
          'Minimum approach distances maintained',
          'Hot work permit system in place',
          'Rubber protective equipment inspected',
          'Grounding procedures followed',
          'Line clearance procedures documented',
          'Qualified worker verification'
        ]
      },
      {
        id: 'util-2',
        hazard: 'Natural Gas Leak/Explosion',
        category: 'Natural Gas Operations',
        severity: 'Critical',
        regulatoryRef: 'PHMSA 49 CFR 192',
        checkPoints: [
          'Leak detection equipment calibrated',
          'Emergency valve locations marked',
          'Odorization levels verified',
          'Pipeline integrity monitoring',
          'Public awareness program active',
          'Excavation notification (811) followed'
        ]
      },
      {
        id: 'util-3',
        hazard: 'Confined Space Entry (Manholes/Vaults)',
        category: 'Confined Space Entry',
        severity: 'Critical',
        regulatoryRef: 'OSHA 29 CFR 1910.146',
        checkPoints: [
          'Entry permit completed',
          'Atmospheric testing performed',
          'Ventilation equipment operational',
          'Rescue equipment available',
          'Attendant stationed at entry',
          'Communication system tested'
        ]
      },
      {
        id: 'util-4',
        hazard: 'Excavation Hazards',
        category: 'Excavation & Trenching',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1926.651',
        checkPoints: [
          'Utility locates completed before dig',
          'Competent person on-site',
          'Protective systems in place',
          'Spoil pile distance adequate',
          'Access/egress provided',
          'Daily inspections documented'
        ]
      },
      {
        id: 'util-5',
        hazard: 'Falls from Poles/Towers',
        category: 'Fall Protection',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1910.269(g)',
        checkPoints: [
          'Fall arrest equipment inspected',
          'Pole/structure integrity verified',
          'Climber training current',
          'Work positioning equipment rated',
          'Rescue plan established',
          'Self-rescue training completed'
        ]
      },
      {
        id: 'util-6',
        hazard: 'Public Contact with Work Zone',
        category: 'Public Safety',
        severity: 'Medium',
        regulatoryRef: 'MUTCD / Local Codes',
        checkPoints: [
          'Work zone traffic control in place',
          'Barricades properly positioned',
          'Warning signs visible',
          'Flaggers trained and equipped',
          'Public notification completed',
          'Night work lighting adequate'
        ]
      }
    ],
    complianceReferences: [
      { body: 'OSHA', code: '29 CFR 1910.269', title: 'Electric Power Generation, Transmission, Distribution' },
      { body: 'PHMSA', code: '49 CFR 192', title: 'Transportation of Natural Gas' },
      { body: 'NESC', code: 'NESC C2', title: 'National Electrical Safety Code' },
      { body: 'NFPA', code: 'NFPA 70E', title: 'Electrical Safety in the Workplace' },
      { body: 'AWWA', code: 'AWWA Standards', title: 'Water Utility Safety Standards' }
    ],
    lastUpdated: '2026-01-07'
  },
  // TRANSPORTATION INDUSTRY
  {
    id: 'audit-transportation',
    industry: 'Transportation',
    name: 'Transportation & Logistics Safety Audit',
    description: 'Comprehensive audit for trucking, warehousing, and logistics operations covering driver safety, loading/unloading, and hazmat transport.',
    hazardCategories: [
      'Driver Safety',
      'Loading & Unloading',
      'Hazmat Transport',
      'Warehouse Operations',
      'Vehicle Maintenance',
      'Fatigue Management'
    ],
    hazards: [
      {
        id: 'trans-1',
        hazard: 'Commercial Vehicle Accidents',
        category: 'Driver Safety',
        severity: 'Critical',
        regulatoryRef: 'FMCSA 49 CFR 395',
        checkPoints: [
          'CDL verification current',
          'Hours of service compliance',
          'Pre-trip inspection completed',
          'Defensive driving training current',
          'Drug/alcohol testing program',
          'CSA scores monitored'
        ]
      },
      {
        id: 'trans-2',
        hazard: 'Loading Dock Injuries',
        category: 'Loading & Unloading',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1910.176',
        checkPoints: [
          'Dock locks/wheel chocks in use',
          'Dock levelers inspected',
          'Trailer secured before entry',
          'Fall protection at dock edges',
          'Load weight limits posted',
          'Fork lift traffic separated'
        ]
      },
      {
        id: 'trans-3',
        hazard: 'Hazardous Materials Incident',
        category: 'Hazmat Transport',
        severity: 'Critical',
        regulatoryRef: 'DOT 49 CFR 172-180',
        checkPoints: [
          'Hazmat endorsement verified',
          'Placards correctly displayed',
          'Shipping papers accurate',
          'Emergency response info available',
          'Spill kit on vehicle',
          'Security plan in place'
        ]
      },
      {
        id: 'trans-4',
        hazard: 'Warehouse Material Handling',
        category: 'Warehouse Operations',
        severity: 'High',
        regulatoryRef: 'OSHA 29 CFR 1910.178',
        checkPoints: [
          'Forklift operators certified',
          'Pedestrian walkways marked',
          'Racking inspections current',
          'Load capacity signs posted',
          'Aisle widths maintained',
          'Emergency exits clear'
        ]
      },
      {
        id: 'trans-5',
        hazard: 'Vehicle Mechanical Failure',
        category: 'Vehicle Maintenance',
        severity: 'High',
        regulatoryRef: 'FMCSA 49 CFR 396',
        checkPoints: [
          'Preventive maintenance schedule current',
          'Brake inspections documented',
          'Tire condition/pressure checked',
          'Lighting systems functional',
          'Annual DOT inspection valid',
          'Out-of-service defects corrected'
        ]
      },
      {
        id: 'trans-6',
        hazard: 'Driver Fatigue Incidents',
        category: 'Fatigue Management',
        severity: 'High',
        regulatoryRef: 'FMCSA 49 CFR 395.3',
        checkPoints: [
          'ELD compliance verified',
          'Rest break policy enforced',
          'Sleep apnea screening conducted',
          'Fatigue awareness training',
          'Schedule planning considers fatigue',
          'Reporting system for fatigue concerns'
        ]
      }
    ],
    complianceReferences: [
      { body: 'FMCSA', code: '49 CFR 395', title: 'Hours of Service of Drivers' },
      { body: 'DOT', code: '49 CFR 172-180', title: 'Hazardous Materials Regulations' },
      { body: 'OSHA', code: '29 CFR 1910.176', title: 'Handling Materials - General' },
      { body: 'FMCSA', code: '49 CFR 396', title: 'Inspection, Repair, and Maintenance' },
      { body: 'OSHA', code: '29 CFR 1910.178', title: 'Powered Industrial Trucks' }
    ],
    lastUpdated: '2026-01-07'
  }
];

// Helper functions
export const getAuditTemplateByIndustry = (industry: IndustryAuditTemplate['industry']): IndustryAuditTemplate | undefined => {
  return industryAuditTemplates.find(t => t.industry === industry);
};

export const getHazardsByCategory = (templateId: string, category: string): IndustryHazard[] => {
  const template = industryAuditTemplates.find(t => t.id === templateId);
  return template?.hazards.filter(h => h.category === category) || [];
};

export const getCriticalHazards = (): IndustryHazard[] => {
  return industryAuditTemplates.flatMap(t => t.hazards.filter(h => h.severity === 'Critical'));
};

export const getAllIndustries = (): IndustryAuditTemplate['industry'][] => {
  return industryAuditTemplates.map(t => t.industry);
};

// Compliance Tracking Types
export type ComplianceFindingStatus = 'Open' | 'In Progress' | 'Closed' | 'Overdue';
export type ComplianceFindingPriority = 'Critical' | 'High' | 'Medium' | 'Low';

export interface ComplianceFinding {
  id: string;
  auditId: string;
  industry: IndustryAuditTemplate['industry'];
  hazardId: string;
  hazardName: string;
  checkPoint: string;
  status: ComplianceFindingStatus;
  priority: ComplianceFindingPriority;
  assignedTo: string;
  dueDate: string;
  createdDate: string;
  closedDate?: string;
  notes: string;
  correctiveAction?: string;
}

// Mock compliance findings data
export const mockComplianceFindings: ComplianceFinding[] = [
  {
    id: 'cf-001',
    auditId: 'audit-2026-001',
    industry: 'Oil & Gas',
    hazardId: 'og-1',
    hazardName: 'Hydrogen Sulfide (H2S) Exposure',
    checkPoint: 'H2S monitors calibrated and functional',
    status: 'In Progress',
    priority: 'Critical',
    assignedTo: 'Mike Johnson',
    dueDate: '2026-01-15',
    createdDate: '2026-01-02',
    notes: 'Two monitors found out of calibration during audit',
    correctiveAction: 'Schedule immediate recalibration with certified technician'
  },
  {
    id: 'cf-002',
    auditId: 'audit-2026-001',
    industry: 'Construction',
    hazardId: 'con-2',
    hazardName: 'Trench/Excavation Collapse',
    checkPoint: 'Spoil piles 2ft+ from edge',
    status: 'Open',
    priority: 'High',
    assignedTo: 'Sarah Williams',
    dueDate: '2026-01-10',
    createdDate: '2026-01-05',
    notes: 'Spoil pile observed within 18 inches of trench edge at Site B'
  },
  {
    id: 'cf-003',
    auditId: 'audit-2026-002',
    industry: 'Manufacturing',
    hazardId: 'mfg-2',
    hazardName: 'Hazardous Energy Release (LOTO)',
    checkPoint: 'Annual periodic inspections completed',
    status: 'Overdue',
    priority: 'Critical',
    assignedTo: 'Tom Brown',
    dueDate: '2025-12-31',
    createdDate: '2025-12-15',
    notes: 'LOTO periodic inspection overdue for 3 machines'
  },
  {
    id: 'cf-004',
    auditId: 'audit-2026-002',
    industry: 'Healthcare',
    hazardId: 'hc-1',
    hazardName: 'Needlestick & Sharps Injuries',
    checkPoint: 'Sharps containers available and not overfilled',
    status: 'Closed',
    priority: 'Medium',
    assignedTo: 'Lisa Chen',
    dueDate: '2026-01-03',
    createdDate: '2025-12-28',
    closedDate: '2026-01-02',
    notes: 'Overfilled sharps container in Room 204',
    correctiveAction: 'Replaced container and added to daily rounds checklist'
  },
  {
    id: 'cf-005',
    auditId: 'audit-2026-003',
    industry: 'Mining',
    hazardId: 'min-1',
    hazardName: 'Ground Control Failure',
    checkPoint: 'Ground support inspection before each shift',
    status: 'In Progress',
    priority: 'Critical',
    assignedTo: 'James Rodriguez',
    dueDate: '2026-01-12',
    createdDate: '2026-01-06',
    notes: 'Missing documentation for pre-shift ground inspections'
  }
];

// Compliance tracking helper functions
export const getComplianceFindingsByStatus = (status: ComplianceFindingStatus): ComplianceFinding[] => {
  return mockComplianceFindings.filter(f => f.status === status);
};

export const getComplianceFindingsByIndustry = (industry: IndustryAuditTemplate['industry']): ComplianceFinding[] => {
  return mockComplianceFindings.filter(f => f.industry === industry);
};

export const getComplianceStats = () => {
  const total = mockComplianceFindings.length;
  const open = mockComplianceFindings.filter(f => f.status === 'Open').length;
  const inProgress = mockComplianceFindings.filter(f => f.status === 'In Progress').length;
  const closed = mockComplianceFindings.filter(f => f.status === 'Closed').length;
  const overdue = mockComplianceFindings.filter(f => f.status === 'Overdue').length;
  const critical = mockComplianceFindings.filter(f => f.priority === 'Critical').length;
  
  return { total, open, inProgress, closed, overdue, critical };
};

// Audit Scheduling Types and Data
export type AuditRecurrence = 'once' | 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
export type AuditScheduleStatus = 'scheduled' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';

export interface AuditSchedule {
  id: string;
  title: string;
  industry: IndustryAuditTemplate['industry'];
  templateId: string;
  description: string;
  assignedTo: string;
  assignedEmail: string;
  recurrence: AuditRecurrence;
  scheduledDate: string;
  scheduledTime: string;
  duration: number; // minutes
  status: AuditScheduleStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  location: string;
  notes?: string;
  completedDate?: string;
  nextScheduledDate?: string;
  createdAt: string;
}

export const auditRecurrenceOptions: { value: AuditRecurrence; label: string }[] = [
  { value: 'once', label: 'One Time' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'biweekly', label: 'Bi-Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'annual', label: 'Annual' },
];

export const auditAssignees = [
  { id: 'usr-001', name: 'John Smith', email: 'john.smith@company.com', role: 'Senior Safety Auditor' },
  { id: 'usr-002', name: 'Sarah Williams', email: 'sarah.williams@company.com', role: 'EHS Manager' },
  { id: 'usr-003', name: 'Mike Johnson', email: 'mike.johnson@company.com', role: 'Safety Coordinator' },
  { id: 'usr-004', name: 'Emily Chen', email: 'emily.chen@company.com', role: 'Compliance Officer' },
  { id: 'usr-005', name: 'Tom Brown', email: 'tom.brown@company.com', role: 'Safety Specialist' },
  { id: 'usr-006', name: 'Lisa Rodriguez', email: 'lisa.rodriguez@company.com', role: 'EHS Coordinator' },
];

export const mockAuditSchedules: AuditSchedule[] = [
  {
    id: 'AS-001',
    title: 'Weekly Oil & Gas Safety Audit',
    industry: 'Oil & Gas',
    templateId: 'audit-oil-gas',
    description: 'Routine weekly audit covering H2S monitoring, well control, and process safety.',
    assignedTo: 'John Smith',
    assignedEmail: 'john.smith@company.com',
    recurrence: 'weekly',
    scheduledDate: '2026-01-08',
    scheduledTime: '09:00',
    duration: 180,
    status: 'scheduled',
    priority: 'high',
    location: 'Tank Farm',
    notes: 'Focus on H2S monitors after recent calibration',
    nextScheduledDate: '2026-01-15',
    createdAt: '2025-12-15T08:00:00Z',
  },
  {
    id: 'AS-002',
    title: 'Monthly Construction Site Inspection',
    industry: 'Construction',
    templateId: 'audit-construction',
    description: 'Monthly comprehensive safety audit for all active construction zones.',
    assignedTo: 'Sarah Williams',
    assignedEmail: 'sarah.williams@company.com',
    recurrence: 'monthly',
    scheduledDate: '2026-01-10',
    scheduledTime: '08:00',
    duration: 240,
    status: 'scheduled',
    priority: 'high',
    location: 'Building Site A',
    nextScheduledDate: '2026-02-10',
    createdAt: '2025-12-01T08:00:00Z',
  },
  {
    id: 'AS-003',
    title: 'Daily Manufacturing Floor Check',
    industry: 'Manufacturing',
    templateId: 'audit-manufacturing',
    description: 'Daily safety walkthrough covering LOTO, machine guarding, and PPE compliance.',
    assignedTo: 'Mike Johnson',
    assignedEmail: 'mike.johnson@company.com',
    recurrence: 'daily',
    scheduledDate: '2026-01-07',
    scheduledTime: '07:00',
    duration: 60,
    status: 'in_progress',
    priority: 'medium',
    location: 'Assembly Line',
    nextScheduledDate: '2026-01-08',
    createdAt: '2025-11-01T08:00:00Z',
  },
  {
    id: 'AS-004',
    title: 'Quarterly Healthcare Compliance Audit',
    industry: 'Healthcare',
    templateId: 'audit-healthcare',
    description: 'Quarterly comprehensive audit for infection control, sharps safety, and patient handling.',
    assignedTo: 'Emily Chen',
    assignedEmail: 'emily.chen@company.com',
    recurrence: 'quarterly',
    scheduledDate: '2026-01-05',
    scheduledTime: '10:00',
    duration: 300,
    status: 'overdue',
    priority: 'critical',
    location: 'Main Hospital Wing',
    nextScheduledDate: '2026-04-05',
    createdAt: '2025-10-05T08:00:00Z',
  },
  {
    id: 'AS-005',
    title: 'Mining Ground Control Inspection',
    industry: 'Mining',
    templateId: 'audit-mining',
    description: 'Weekly inspection of ground control measures, ventilation, and emergency systems.',
    assignedTo: 'Tom Brown',
    assignedEmail: 'tom.brown@company.com',
    recurrence: 'weekly',
    scheduledDate: '2026-01-06',
    scheduledTime: '06:00',
    duration: 150,
    status: 'completed',
    priority: 'critical',
    location: 'Mine Shaft B',
    completedDate: '2026-01-06T09:30:00Z',
    nextScheduledDate: '2026-01-13',
    createdAt: '2025-09-01T08:00:00Z',
  },
];

// Helper functions for audit scheduling
export const getAuditSchedulesByStatus = (status: AuditScheduleStatus): AuditSchedule[] => {
  return mockAuditSchedules.filter(s => s.status === status);
};

export const getAuditSchedulesByIndustry = (industry: IndustryAuditTemplate['industry']): AuditSchedule[] => {
  return mockAuditSchedules.filter(s => s.industry === industry);
};

export const getUpcomingAudits = (days: number = 7): AuditSchedule[] => {
  const now = new Date();
  const futureDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return mockAuditSchedules.filter(s => {
    const schedDate = new Date(s.scheduledDate);
    return schedDate >= now && schedDate <= futureDate && s.status === 'scheduled';
  });
};

export const getAuditScheduleStats = () => {
  const total = mockAuditSchedules.length;
  const scheduled = mockAuditSchedules.filter(s => s.status === 'scheduled').length;
  const inProgress = mockAuditSchedules.filter(s => s.status === 'in_progress').length;
  const completed = mockAuditSchedules.filter(s => s.status === 'completed').length;
  const overdue = mockAuditSchedules.filter(s => s.status === 'overdue').length;
  return { total, scheduled, inProgress, completed, overdue };
};

// Finding Assignment Types
export interface FindingAssignment {
  findingId: string;
  assignedTo: string;
  assignedEmail: string;
  assignedDate: string;
  dueDate: string;
  priority: ComplianceFindingPriority;
  status: ComplianceFindingStatus;
  notes?: string;
}
