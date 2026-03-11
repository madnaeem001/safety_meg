// ============================================
// INTERNATIONAL SAFETY STANDARDS LIBRARY
// ISO, IEC, ILO Standards for EHS Compliance
// ============================================

export interface StandardClause {
  id: string;
  clause: string;
  title: string;
  description: string;
  keyRequirements: string[];
}

export interface InternationalStandard {
  id: string;
  code: string;
  title: string;
  fullTitle: string;
  description: string;
  category: StandardCategory;
  subcategory?: string;
  issuingBody: IssuingBody;
  version: string;
  yearPublished: number;
  yearRevised?: number;
  scope: string[];
  keyPrinciples: string[];
  clauses?: StandardClause[];
  applicableIndustries: string[];
  certificationAvailable: boolean;
  relatedStandards: string[];
  implementationGuidance: string[];
  riskFactors?: string[];
  complianceChecklist?: string[];
}

export type StandardCategory =
  | 'Occupational Health & Safety'
  | 'Sector-Specific Safety'
  | 'Technical & Engineering Safety'
  | 'Digital & Information Safety'
  | 'Specialized & Risk Standards';

export type IssuingBody =
  | 'ISO'
  | 'IEC'
  | 'ILO'
  | 'ISO/IEC';

// ============================================
// 1. OCCUPATIONAL HEALTH & SAFETY STANDARDS
// ============================================

export const occupationalHealthSafetyStandards: InternationalStandard[] = [
  {
    id: 'iso-45001',
    code: 'ISO 45001:2018',
    title: 'Occupational Health and Safety Management Systems',
    fullTitle: 'ISO 45001:2018 - Occupational health and safety management systems — Requirements with guidance for use',
    description: 'The global benchmark for Occupational Health and Safety (OH&S). It provides a framework to reduce workplace injuries and illnesses by proactively improving OH&S performance.',
    category: 'Occupational Health & Safety',
    issuingBody: 'ISO',
    version: '2018',
    yearPublished: 2018,
    scope: [
      'Establishing an OH&S management system',
      'Implementing and maintaining OH&S policies',
      'Continual improvement of OH&S performance',
      'Legal compliance and risk management'
    ],
    keyPrinciples: [
      'Leadership and worker participation',
      'Plan-Do-Check-Act (PDCA) cycle',
      'Risk-based thinking',
      'Context of the organization',
      'Hazard identification and risk assessment',
      'Opportunities for OH&S improvement'
    ],
    clauses: [
      { id: '45001-4', clause: 'Clause 4', title: 'Context of the Organization', description: 'Understanding the organization and its context', keyRequirements: ['Internal/external issues', 'Needs of workers and interested parties', 'Scope of OH&S management system'] },
      { id: '45001-5', clause: 'Clause 5', title: 'Leadership and Worker Participation', description: 'Top management commitment and worker involvement', keyRequirements: ['OH&S policy', 'Organizational roles and responsibilities', 'Consultation and participation of workers'] },
      { id: '45001-6', clause: 'Clause 6', title: 'Planning', description: 'Actions to address risks and opportunities', keyRequirements: ['Hazard identification', 'Assessment of OH&S risks', 'Legal and other requirements', 'OH&S objectives and planning'] },
      { id: '45001-7', clause: 'Clause 7', title: 'Support', description: 'Resources, competence, awareness, communication', keyRequirements: ['Resources', 'Competence', 'Awareness', 'Communication', 'Documented information'] },
      { id: '45001-8', clause: 'Clause 8', title: 'Operation', description: 'Operational planning and control', keyRequirements: ['Eliminating hazards and reducing OH&S risks', 'Management of change', 'Procurement', 'Contractors', 'Emergency preparedness'] },
      { id: '45001-9', clause: 'Clause 9', title: 'Performance Evaluation', description: 'Monitoring, measurement, analysis and evaluation', keyRequirements: ['Monitoring and measurement', 'Internal audit', 'Management review'] },
      { id: '45001-10', clause: 'Clause 10', title: 'Improvement', description: 'Incident, nonconformity, corrective action and continual improvement', keyRequirements: ['Incident investigation', 'Nonconformity and corrective action', 'Continual improvement'] }
    ],
    applicableIndustries: ['All industries', 'Manufacturing', 'Construction', 'Healthcare', 'Mining', 'Oil & Gas', 'Transportation', 'Public Sector'],
    certificationAvailable: true,
    relatedStandards: ['ISO 45003', 'ISO 14001', 'ISO 9001', 'ILO-OSH 2001', 'OHSAS 18001 (superseded)'],
    implementationGuidance: [
      'Conduct a gap analysis against current practices',
      'Secure top management commitment',
      'Establish cross-functional implementation team',
      'Define OH&S policy aligned with strategic direction',
      'Implement hazard identification and risk assessment processes',
      'Train all workers on OH&S responsibilities',
      'Establish internal audit program',
      'Pursue third-party certification'
    ],
    complianceChecklist: [
      'OH&S policy documented and communicated',
      'Context analysis completed',
      'Hazard register maintained',
      'Risk assessment methodology defined',
      'Legal register established',
      'OH&S objectives set with measurable targets',
      'Competence requirements defined',
      'Emergency procedures documented',
      'Internal audits scheduled',
      'Management reviews conducted'
    ]
  },
  {
    id: 'iso-45003',
    code: 'ISO 45003:2021',
    title: 'Psychological Health and Safety at Work',
    fullTitle: 'ISO 45003:2021 - Occupational health and safety management — Psychological health and safety at work — Guidelines for managing psychosocial risks',
    description: 'A newer standard focusing on psychological health and safety, specifically managing psychosocial risks like stress, burnout, workplace violence, and harassment.',
    category: 'Occupational Health & Safety',
    subcategory: 'Psychosocial Risk Management',
    issuingBody: 'ISO',
    version: '2021',
    yearPublished: 2021,
    scope: [
      'Managing psychosocial risks in the workplace',
      'Promoting well-being at work',
      'Integration with ISO 45001 framework',
      'Prevention of work-related psychological harm'
    ],
    keyPrinciples: [
      'Recognition of psychosocial hazards',
      'Proactive risk management approach',
      'Worker involvement in identifying risks',
      'Organizational culture and leadership',
      'Work-life balance considerations',
      'Support systems and resources'
    ],
    clauses: [
      { id: '45003-4', clause: 'Section 4', title: 'Psychosocial Risk Factors', description: 'Understanding work organization, social factors, and environment', keyRequirements: ['Work demands and control', 'Organizational culture', 'Job roles and expectations', 'Interpersonal relationships'] },
      { id: '45003-5', clause: 'Section 5', title: 'Risk Assessment', description: 'Identifying and evaluating psychosocial hazards', keyRequirements: ['Worker surveys', 'Focus groups', 'Incident data analysis', 'Absence patterns'] },
      { id: '45003-6', clause: 'Section 6', title: 'Risk Control', description: 'Implementing measures to manage psychosocial risks', keyRequirements: ['Job redesign', 'Workload management', 'Conflict resolution', 'Support programs'] },
      { id: '45003-7', clause: 'Section 7', title: 'Organizational Support', description: 'Resources and support for psychological health', keyRequirements: ['Employee assistance programs', 'Mental health resources', 'Manager training', 'Return-to-work programs'] }
    ],
    riskFactors: [
      'Excessive workload and time pressure',
      'Lack of role clarity',
      'Poor organizational change management',
      'Inadequate reward and recognition',
      'Workplace bullying and harassment',
      'Violence and aggression',
      'Job insecurity',
      'Work-home interface conflicts',
      'Remote work isolation',
      'Lack of supervisor support'
    ],
    applicableIndustries: ['All industries', 'Healthcare', 'Education', 'Financial Services', 'Technology', 'Retail', 'Public Sector', 'Emergency Services'],
    certificationAvailable: false,
    relatedStandards: ['ISO 45001', 'ISO 10075 (Mental workload)', 'ILO Guidelines on decent work'],
    implementationGuidance: [
      'Integrate with existing ISO 45001 system',
      'Conduct psychosocial risk assessment',
      'Survey workers on workplace stressors',
      'Train managers on mental health awareness',
      'Establish reporting mechanisms for concerns',
      'Implement employee assistance programs',
      'Monitor absence and turnover data',
      'Review and improve regularly'
    ],
    complianceChecklist: [
      'Psychosocial hazards identified',
      'Worker consultation conducted',
      'Risk assessment documented',
      'Control measures implemented',
      'Manager training completed',
      'Support resources available',
      'Monitoring system in place',
      'Regular reviews scheduled'
    ]
  },
  {
    id: 'ilo-osh-2001',
    code: 'ILO-OSH 2001',
    title: 'Guidelines on Occupational Safety and Health Management Systems',
    fullTitle: 'ILO-OSH 2001 - Guidelines on occupational safety and health management systems',
    description: 'Guidelines from the International Labour Organization for managing occupational safety on a national or organizational level. Provides a unique international model compatible with other management system standards.',
    category: 'Occupational Health & Safety',
    issuingBody: 'ILO',
    version: '2001',
    yearPublished: 2001,
    scope: [
      'National-level OSH policy development',
      'Organizational OSH management systems',
      'Guidance for employers and workers',
      'Framework for competent institutions'
    ],
    keyPrinciples: [
      'Tripartite approach (government, employers, workers)',
      'Continuous improvement cycle',
      'National policy framework',
      'Participation of workers',
      'Competent person requirements',
      'Documentation and record-keeping'
    ],
    clauses: [
      { id: 'ilo-3.1', clause: 'Section 3.1', title: 'National Policy', description: 'Establishing coherent national OSH policy', keyRequirements: ['National OSH framework', 'Coordination mechanisms', 'Competent institutions'] },
      { id: 'ilo-3.2', clause: 'Section 3.2', title: 'National System', description: 'Infrastructure for implementing national policy', keyRequirements: ['Legislation', 'Enforcement mechanisms', 'OSH information systems'] },
      { id: 'ilo-3.3', clause: 'Section 3.3', title: 'Organization OSH-MS', description: 'Organizational level management system', keyRequirements: ['OSH policy', 'Worker participation', 'Responsibility and accountability', 'Competence and training'] },
      { id: 'ilo-3.4', clause: 'Section 3.4', title: 'Planning and Implementation', description: 'Systematic planning and implementation', keyRequirements: ['Initial review', 'System planning', 'OSH objectives', 'Hazard prevention'] },
      { id: 'ilo-3.5', clause: 'Section 3.5', title: 'Evaluation', description: 'Performance monitoring and measurement', keyRequirements: ['Monitoring', 'Investigation', 'Audit', 'Management review'] },
      { id: 'ilo-3.6', clause: 'Section 3.6', title: 'Action for Improvement', description: 'Corrective and preventive actions', keyRequirements: ['Preventive actions', 'Corrective actions', 'Continual improvement'] }
    ],
    applicableIndustries: ['All industries', 'Government bodies', 'Large enterprises', 'SMEs', 'Public sector'],
    certificationAvailable: false,
    relatedStandards: ['ISO 45001', 'National OSH legislation', 'ILO Conventions'],
    implementationGuidance: [
      'Review against national OSH requirements',
      'Establish employer OSH policy',
      'Define worker participation mechanisms',
      'Conduct initial OSH review',
      'Set measurable OSH objectives',
      'Implement hazard prevention measures',
      'Establish monitoring program',
      'Conduct periodic management reviews'
    ],
    complianceChecklist: [
      'OSH policy established',
      'Worker participation enabled',
      'Responsibilities assigned',
      'Competence requirements met',
      'Initial review completed',
      'Objectives documented',
      'Hazard controls implemented',
      'Monitoring active',
      'Audits conducted',
      'Improvement actions tracked'
    ]
  }
];

// ============================================
// 2. SECTOR-SPECIFIC SAFETY STANDARDS
// ============================================

export const sectorSpecificStandards: InternationalStandard[] = [
  {
    id: 'iso-22000',
    code: 'ISO 22000:2018',
    title: 'Food Safety Management Systems',
    fullTitle: 'ISO 22000:2018 - Food safety management systems — Requirements for any organization in the food chain',
    description: 'The primary international standard for managing food safety hazards across the entire food supply chain, from farm to fork.',
    category: 'Sector-Specific Safety',
    subcategory: 'Food Safety',
    issuingBody: 'ISO',
    version: '2018',
    yearPublished: 2018,
    yearRevised: 2018,
    scope: [
      'Food production and processing',
      'Food packaging and distribution',
      'Retail and food service',
      'Equipment and ingredient suppliers',
      'Feed production'
    ],
    keyPrinciples: [
      'Interactive communication',
      'System management (PDCA)',
      'Prerequisite programs (PRPs)',
      'HACCP principles',
      'Risk-based thinking'
    ],
    clauses: [
      { id: '22000-4', clause: 'Clause 4', title: 'Context of the Organization', description: 'Understanding food chain context', keyRequirements: ['Food chain position', 'Interested parties', 'Scope definition'] },
      { id: '22000-7', clause: 'Clause 7', title: 'Support', description: 'Resources and infrastructure', keyRequirements: ['Competence', 'Awareness', 'Work environment control'] },
      { id: '22000-8', clause: 'Clause 8', title: 'Operation', description: 'Prerequisite programs and HACCP plan', keyRequirements: ['PRPs', 'Hazard analysis', 'Critical control points', 'Monitoring', 'Verification'] }
    ],
    applicableIndustries: ['Food Manufacturing', 'Agriculture', 'Food Retail', 'Restaurants', 'Catering', 'Food Transport', 'Packaging'],
    certificationAvailable: true,
    relatedStandards: ['FSSC 22000', 'HACCP', 'ISO 22002 (PRPs)', 'BRC', 'SQF', 'IFS'],
    implementationGuidance: [
      'Map food chain interactions',
      'Establish prerequisite programs',
      'Conduct hazard analysis',
      'Determine critical control points',
      'Set critical limits and monitoring',
      'Establish verification activities',
      'Maintain traceability system'
    ],
    complianceChecklist: [
      'Food safety team established',
      'PRPs documented and implemented',
      'Hazard analysis completed',
      'HACCP plan documented',
      'CCP monitoring in place',
      'Corrective actions defined',
      'Verification schedule active',
      'Traceability system functional'
    ]
  },
  {
    id: 'iso-13485',
    code: 'ISO 13485:2016',
    title: 'Medical Devices Quality Management',
    fullTitle: 'ISO 13485:2016 - Medical devices — Quality management systems — Requirements for regulatory purposes',
    description: 'Ensures safety and quality during the design, development, production, installation, and servicing of medical devices.',
    category: 'Sector-Specific Safety',
    subcategory: 'Medical Devices',
    issuingBody: 'ISO',
    version: '2016',
    yearPublished: 2016,
    scope: [
      'Medical device design and development',
      'Production and manufacturing',
      'Storage and distribution',
      'Installation and servicing',
      'Related service providers'
    ],
    keyPrinciples: [
      'Process approach',
      'Risk-based approach',
      'Regulatory compliance',
      'Traceability throughout lifecycle',
      'Documented quality management system'
    ],
    clauses: [
      { id: '13485-4', clause: 'Clause 4', title: 'Quality Management System', description: 'Documentation and records', keyRequirements: ['Quality manual', 'Medical device file', 'Document control'] },
      { id: '13485-7', clause: 'Clause 7', title: 'Product Realization', description: 'Design, development, and production', keyRequirements: ['Design controls', 'Risk management', 'Purchasing controls', 'Production validation', 'Traceability'] },
      { id: '13485-8', clause: 'Clause 8', title: 'Measurement, Analysis and Improvement', description: 'Monitoring and corrective actions', keyRequirements: ['Feedback system', 'Complaint handling', 'CAPA', 'Advisory notices'] }
    ],
    applicableIndustries: ['Medical Device Manufacturing', 'Healthcare', 'Pharmaceuticals', 'Diagnostics', 'Medical Equipment Servicing'],
    certificationAvailable: true,
    relatedStandards: ['ISO 14971 (Risk Management)', 'IEC 62304 (Software)', 'FDA 21 CFR Part 820', 'EU MDR'],
    implementationGuidance: [
      'Establish quality management system',
      'Implement design controls',
      'Apply ISO 14971 risk management',
      'Validate production processes',
      'Establish traceability system',
      'Implement complaint handling',
      'Conduct regular management reviews'
    ],
    complianceChecklist: [
      'Quality manual established',
      'Design controls implemented',
      'Risk management applied',
      'Supplier controls in place',
      'Production validated',
      'Traceability maintained',
      'Complaint system active',
      'CAPA process functional'
    ]
  },
  {
    id: 'iso-19443',
    code: 'ISO 19443:2018',
    title: 'Nuclear Energy Quality Management',
    fullTitle: 'ISO 19443:2018 - Quality management systems — Specific requirements for the application of ISO 9001:2015 by organizations in the supply chain of the nuclear energy sector',
    description: 'Applies quality management specifically to the nuclear energy supply chain, ensuring safety and reliability in this critical sector.',
    category: 'Sector-Specific Safety',
    subcategory: 'Nuclear Safety',
    issuingBody: 'ISO',
    version: '2018',
    yearPublished: 2018,
    scope: [
      'Nuclear power plant construction',
      'Nuclear fuel cycle',
      'Radioactive waste management',
      'Nuclear supply chain',
      'Decommissioning activities'
    ],
    keyPrinciples: [
      'Nuclear safety culture',
      'Graded approach based on safety significance',
      'Configuration management',
      'Counterfeit, fraudulent and suspect items prevention',
      'Supply chain management'
    ],
    clauses: [
      { id: '19443-4', clause: 'Clause 4.4', title: 'Nuclear Safety Culture', description: 'Organizational attitudes and behaviors', keyRequirements: ['Safety priorities', 'Questioning attitude', 'Reporting culture'] },
      { id: '19443-8.3', clause: 'Clause 8.3', title: 'Nuclear Design', description: 'Design for nuclear applications', keyRequirements: ['Safety classification', 'Design verification', 'Configuration control'] },
      { id: '19443-8.4', clause: 'Clause 8.4', title: 'Supply Chain', description: 'External provider controls', keyRequirements: ['Supplier qualification', 'CFSI prevention', 'Source surveillance'] }
    ],
    applicableIndustries: ['Nuclear Power', 'Nuclear Fuel', 'Radioactive Materials', 'Nuclear Decommissioning', 'Nuclear Supply Chain'],
    certificationAvailable: true,
    relatedStandards: ['ISO 9001', 'IAEA GSR Part 2', 'NQA-1', 'ASME NQA-1'],
    implementationGuidance: [
      'Establish nuclear safety culture program',
      'Implement graded approach methodology',
      'Develop configuration management system',
      'Establish CFSI prevention program',
      'Qualify nuclear supply chain',
      'Implement source surveillance'
    ],
    complianceChecklist: [
      'Safety culture assessment completed',
      'Graded approach documented',
      'Configuration management active',
      'CFSI controls in place',
      'Suppliers qualified',
      'Surveillance program active',
      'Nonconformance system robust',
      'Records retention compliant'
    ]
  },
  {
    id: 'iso-26262',
    code: 'ISO 26262:2018',
    title: 'Road Vehicles Functional Safety',
    fullTitle: 'ISO 26262:2018 - Road vehicles — Functional safety',
    description: 'Defines functional safety for electrical and electronic systems in road vehicles, including autonomous driving systems.',
    category: 'Sector-Specific Safety',
    subcategory: 'Automotive Safety',
    issuingBody: 'ISO',
    version: '2018',
    yearPublished: 2018,
    scope: [
      'E/E systems in passenger vehicles',
      'Trucks and buses',
      'Motorcycles (ISO 26262-12)',
      'Safety-related systems',
      'Autonomous vehicle systems'
    ],
    keyPrinciples: [
      'Automotive Safety Integrity Levels (ASIL)',
      'V-model development process',
      'Hazard analysis and risk assessment',
      'Safety lifecycle management',
      'Confirmation measures'
    ],
    clauses: [
      { id: '26262-3', clause: 'Part 3', title: 'Concept Phase', description: 'Item definition and hazard analysis', keyRequirements: ['Item definition', 'HARA', 'Safety goals', 'Functional safety concept'] },
      { id: '26262-4', clause: 'Part 4', title: 'Product Development: System Level', description: 'System-level development', keyRequirements: ['Technical safety requirements', 'System design', 'Safety analysis'] },
      { id: '26262-5', clause: 'Part 5', title: 'Product Development: Hardware Level', description: 'Hardware development', keyRequirements: ['Hardware metrics', 'FMEDA', 'Safety mechanisms'] },
      { id: '26262-6', clause: 'Part 6', title: 'Product Development: Software Level', description: 'Software development', keyRequirements: ['Software architecture', 'Unit testing', 'Integration testing'] }
    ],
    riskFactors: [
      'Severity of potential harm',
      'Probability of exposure',
      'Controllability by driver',
      'ASIL classification (A, B, C, D)'
    ],
    applicableIndustries: ['Automotive', 'Commercial Vehicles', 'Motorcycles', 'Autonomous Vehicles', 'Automotive Supply Chain'],
    certificationAvailable: true,
    relatedStandards: ['IEC 61508', 'ISO 21448 (SOTIF)', 'ISO/SAE 21434 (Cybersecurity)', 'AUTOSAR'],
    implementationGuidance: [
      'Define item scope and boundaries',
      'Conduct hazard analysis and risk assessment',
      'Determine ASIL ratings',
      'Develop safety concepts',
      'Apply V-model development process',
      'Implement confirmation measures',
      'Maintain functional safety management'
    ],
    complianceChecklist: [
      'Functional safety management established',
      'Item definition complete',
      'HARA documented',
      'Safety goals defined',
      'ASIL ratings assigned',
      'Technical safety requirements derived',
      'Safety analyses completed',
      'Verification and validation done'
    ]
  }
];

// ============================================
// 3. TECHNICAL & ENGINEERING SAFETY STANDARDS
// ============================================

export const technicalEngineeringStandards: InternationalStandard[] = [
  {
    id: 'iec-60364',
    code: 'IEC 60364',
    title: 'Low-Voltage Electrical Installations',
    fullTitle: 'IEC 60364 - Low-voltage electrical installations',
    description: 'The foundational international standard for the design, erection, and verification of low-voltage electrical installations, ensuring protection against electric shock and fire.',
    category: 'Technical & Engineering Safety',
    subcategory: 'Electrical Safety',
    issuingBody: 'IEC',
    version: 'Multiple parts',
    yearPublished: 1970,
    yearRevised: 2020,
    scope: [
      'Residential installations',
      'Commercial buildings',
      'Industrial facilities',
      'Agricultural installations',
      'Temporary installations'
    ],
    keyPrinciples: [
      'Protection against electric shock',
      'Protection against thermal effects',
      'Protection against overcurrent',
      'Protection against fault currents',
      'Isolation and switching'
    ],
    clauses: [
      { id: '60364-1', clause: 'Part 1', title: 'Fundamental Principles', description: 'Scope and general requirements', keyRequirements: ['Purpose', 'Fundamental requirements', 'Definitions'] },
      { id: '60364-4', clause: 'Part 4', title: 'Protection for Safety', description: 'Protection against hazards', keyRequirements: ['Protection against electric shock', 'Protection against thermal effects', 'Overcurrent protection'] },
      { id: '60364-5', clause: 'Part 5', title: 'Selection and Erection', description: 'Equipment selection and installation', keyRequirements: ['Common rules', 'Wiring systems', 'Switching and control', 'Earthing'] },
      { id: '60364-6', clause: 'Part 6', title: 'Verification', description: 'Initial and periodic verification', keyRequirements: ['Visual inspection', 'Testing', 'Reporting'] }
    ],
    applicableIndustries: ['Construction', 'Manufacturing', 'Commercial Buildings', 'Residential', 'Agriculture', 'Healthcare'],
    certificationAvailable: false,
    relatedStandards: ['IEC 61140', 'IEC 60947', 'IEC 60269', 'National wiring codes (NEC, BS 7671)'],
    implementationGuidance: [
      'Assess installation category',
      'Design protection schemes',
      'Select appropriate equipment',
      'Apply proper installation practices',
      'Conduct verification testing',
      'Maintain documentation'
    ],
    complianceChecklist: [
      'Load assessment completed',
      'Protection schemes designed',
      'Equipment properly rated',
      'Earthing system adequate',
      'RCDs installed where required',
      'Initial verification completed',
      'Test certificates issued',
      'Periodic inspection scheduled'
    ]
  },
  {
    id: 'iec-61140',
    code: 'IEC 61140:2016',
    title: 'Protection Against Electric Shock',
    fullTitle: 'IEC 61140:2016 - Protection against electric shock — Common aspects for installation and equipment',
    description: 'Fundamental safety principles for protection of persons and livestock against electric shock, providing the basis for coordinated protection in installations and equipment.',
    category: 'Technical & Engineering Safety',
    subcategory: 'Electrical Safety',
    issuingBody: 'IEC',
    version: '2016',
    yearPublished: 2016,
    scope: [
      'Electrical installations',
      'Electrical equipment',
      'Low-voltage systems',
      'High-voltage systems',
      'Combined equipment and installations'
    ],
    keyPrinciples: [
      'Basic protection (normal conditions)',
      'Fault protection (single fault conditions)',
      'Additional protection (enhanced safety)',
      'Protective measures combination',
      'Independent or combined protection'
    ],
    clauses: [
      { id: '61140-4', clause: 'Clause 4', title: 'Fundamental Rule', description: 'Core protection requirements', keyRequirements: ['Hazardous live parts not accessible', 'Accessible conductive parts not hazardous'] },
      { id: '61140-5', clause: 'Clause 5', title: 'Basic Protection', description: 'Protection under normal conditions', keyRequirements: ['Basic insulation', 'Barriers', 'Enclosures', 'Obstacles', 'Placing out of reach'] },
      { id: '61140-6', clause: 'Clause 6', title: 'Fault Protection', description: 'Protection under fault conditions', keyRequirements: ['Automatic disconnection', 'Double insulation', 'Electrical separation', 'PELV/SELV'] }
    ],
    applicableIndustries: ['Electrical Engineering', 'Manufacturing', 'Construction', 'Equipment Manufacturing', 'Utilities'],
    certificationAvailable: false,
    relatedStandards: ['IEC 60364', 'IEC 60479 (Effects of current)', 'IEC 60529 (IP ratings)'],
    implementationGuidance: [
      'Identify all live parts',
      'Apply basic protection measures',
      'Design fault protection systems',
      'Consider additional protection needs',
      'Verify protective measures',
      'Test disconnection times'
    ],
    complianceChecklist: [
      'Live parts identified',
      'Basic protection applied',
      'Fault protection designed',
      'Disconnection times verified',
      'Insulation resistance tested',
      'Earth fault loop impedance measured',
      'RCD function tested',
      'Documentation complete'
    ]
  },
  {
    id: 'iso-12100',
    code: 'ISO 12100:2010',
    title: 'Safety of Machinery',
    fullTitle: 'ISO 12100:2010 - Safety of machinery — General principles for design — Risk assessment and risk reduction',
    description: 'Provides general principles for risk assessment and risk reduction in machinery design, forming the foundation for all type-B and type-C machinery safety standards.',
    category: 'Technical & Engineering Safety',
    subcategory: 'Machine Safety',
    issuingBody: 'ISO',
    version: '2010',
    yearPublished: 2010,
    scope: [
      'Machinery design',
      'Risk assessment methodology',
      'Risk reduction strategies',
      'Safety-related design',
      'Safeguarding principles'
    ],
    keyPrinciples: [
      'Risk assessment process',
      '3-step method (inherent design, safeguarding, information)',
      'Hierarchy of protective measures',
      'State of the art consideration',
      'Iterative risk reduction'
    ],
    clauses: [
      { id: '12100-5', clause: 'Clause 5', title: 'Risk Assessment', description: 'Systematic risk evaluation', keyRequirements: ['Machine limits determination', 'Hazard identification', 'Risk estimation', 'Risk evaluation'] },
      { id: '12100-6', clause: 'Clause 6', title: 'Risk Reduction', description: '3-step protective measures', keyRequirements: ['Inherently safe design', 'Safeguarding', 'Information for use', 'Residual risk'] }
    ],
    riskFactors: [
      'Severity of harm',
      'Probability of occurrence',
      'Exposure frequency',
      'Possibility of avoidance',
      'Number of persons at risk'
    ],
    applicableIndustries: ['Manufacturing', 'Packaging', 'Food Processing', 'Automotive', 'Aerospace', 'Construction Equipment'],
    certificationAvailable: false,
    relatedStandards: ['ISO 13849 (Control systems)', 'IEC 62443 (Industrial cybersecurity)', 'ISO 14120 (Guards)', 'ISO 13850 (E-stops)'],
    implementationGuidance: [
      'Define machine limits and lifecycle phases',
      'Identify all hazards systematically',
      'Estimate risks for each hazard',
      'Apply 3-step risk reduction',
      'Verify risk reduction achieved',
      'Document entire process'
    ],
    complianceChecklist: [
      'Machine limits defined',
      'Hazards identified',
      'Risks estimated and documented',
      'Inherently safe design applied',
      'Guards and protective devices installed',
      'Residual risks identified',
      'User information provided',
      'Risk assessment documented'
    ]
  },
  {
    id: 'iec-61508',
    code: 'IEC 61508',
    title: 'Functional Safety of E/E/PE Systems',
    fullTitle: 'IEC 61508 - Functional safety of electrical/electronic/programmable electronic safety-related systems',
    description: 'The foundational "umbrella" standard for functional safety of electrical, electronic, and programmable electronic safety-related systems across all industries.',
    category: 'Technical & Engineering Safety',
    subcategory: 'Functional Safety',
    issuingBody: 'IEC',
    version: '2010',
    yearPublished: 2010,
    scope: [
      'E/E/PE safety-related systems',
      'Industrial processes',
      'Safety instrumented systems',
      'Machinery control systems',
      'All industry sectors'
    ],
    keyPrinciples: [
      'Safety Integrity Levels (SIL 1-4)',
      'Overall safety lifecycle',
      'Management of functional safety',
      'Verification and validation',
      'Assessment and auditing'
    ],
    clauses: [
      { id: '61508-1', clause: 'Part 1', title: 'General Requirements', description: 'Basic requirements and definitions', keyRequirements: ['Safety lifecycle', 'FSM', 'Documentation', 'Competence'] },
      { id: '61508-2', clause: 'Part 2', title: 'Hardware Requirements', description: 'Requirements for hardware', keyRequirements: ['Hardware SIL', 'Architectures', 'Diagnostic coverage', 'Common cause failures'] },
      { id: '61508-3', clause: 'Part 3', title: 'Software Requirements', description: 'Requirements for software', keyRequirements: ['Software SIL', 'Software lifecycle', 'Coding standards', 'Testing requirements'] },
      { id: '61508-4', clause: 'Part 4', title: 'Definitions and Abbreviations', description: 'Terms and definitions', keyRequirements: ['Terminology', 'Abbreviations'] },
      { id: '61508-5', clause: 'Part 5', title: 'SIL Determination', description: 'Example methods for SIL determination', keyRequirements: ['Risk graphs', 'Layers of protection analysis', 'Qualitative methods'] },
      { id: '61508-6', clause: 'Part 6', title: 'Application Guidelines', description: 'Guidelines for Parts 2 and 3', keyRequirements: ['Hardware examples', 'Software examples', 'Calculations'] },
      { id: '61508-7', clause: 'Part 7', title: 'Techniques and Measures', description: 'Overview of techniques', keyRequirements: ['Hardware techniques', 'Software techniques', 'Fault avoidance'] }
    ],
    riskFactors: [
      'Consequence severity (safety/economic/environmental)',
      'Frequency of exposure',
      'Probability of avoiding hazard',
      'Probability of unwanted occurrence'
    ],
    applicableIndustries: ['Process Industry', 'Manufacturing', 'Oil & Gas', 'Power Generation', 'Rail', 'Automotive', 'Medical'],
    certificationAvailable: true,
    relatedStandards: ['IEC 61511 (Process)', 'ISO 26262 (Automotive)', 'EN 50128/50129 (Rail)', 'IEC 62061 (Machinery)'],
    implementationGuidance: [
      'Establish functional safety management',
      'Define safety requirements',
      'Allocate SIL to safety functions',
      'Design to SIL requirements',
      'Verify and validate',
      'Operate and maintain safely',
      'Conduct functional safety assessment'
    ],
    complianceChecklist: [
      'FSM plan established',
      'Competent persons assigned',
      'Hazard and risk analysis completed',
      'SIL targets determined',
      'System designed to SIL',
      'Verification activities completed',
      'Validation testing done',
      'FSA conducted'
    ]
  },
  {
    id: 'iec-60079',
    code: 'IEC 60079 Series',
    title: 'Explosive Atmospheres',
    fullTitle: 'IEC 60079 - Explosive atmospheres (ATEX/IECEx)',
    description: 'Comprehensive series covering equipment and installations for use in explosive atmospheres containing flammable gases, vapors, mists, or combustible dusts.',
    category: 'Technical & Engineering Safety',
    subcategory: 'Explosion Protection',
    issuingBody: 'IEC',
    version: 'Multiple parts',
    yearPublished: 1975,
    yearRevised: 2020,
    scope: [
      'Hazardous area classification',
      'Equipment protection concepts',
      'Installation requirements',
      'Inspection and maintenance',
      'Repair and overhaul'
    ],
    keyPrinciples: [
      'Area classification (Zones 0, 1, 2 / 20, 21, 22)',
      'Equipment protection levels (EPL)',
      'Protection concepts (Ex d, Ex e, Ex i, etc.)',
      'Temperature classes',
      'Equipment groups'
    ],
    clauses: [
      { id: '60079-0', clause: 'Part 0', title: 'General Requirements', description: 'Equipment - General requirements', keyRequirements: ['Marking', 'Documentation', 'Construction', 'Testing'] },
      { id: '60079-1', clause: 'Part 1', title: 'Flameproof "d"', description: 'Flameproof enclosures', keyRequirements: ['Enclosure design', 'Flamepaths', 'Testing'] },
      { id: '60079-7', clause: 'Part 7', title: 'Increased Safety "e"', description: 'Increased safety construction', keyRequirements: ['Enhanced reliability', 'Terminal blocks', 'Motors'] },
      { id: '60079-10', clause: 'Part 10', title: 'Area Classification', description: 'Hazardous area classification', keyRequirements: ['Zone definitions', 'Ventilation', 'Release sources'] },
      { id: '60079-11', clause: 'Part 11', title: 'Intrinsic Safety "i"', description: 'Intrinsically safe circuits', keyRequirements: ['Energy limitation', 'IS parameters', 'Associated apparatus'] },
      { id: '60079-14', clause: 'Part 14', title: 'Electrical Installations', description: 'Design, selection and erection', keyRequirements: ['Equipment selection', 'Wiring systems', 'Inspection'] },
      { id: '60079-17', clause: 'Part 17', title: 'Inspection and Maintenance', description: 'In-service inspection', keyRequirements: ['Initial inspection', 'Periodic inspection', 'Continuous supervision'] }
    ],
    applicableIndustries: ['Oil & Gas', 'Chemical Processing', 'Pharmaceuticals', 'Mining', 'Grain Handling', 'Paint/Coatings', 'Petrochemical'],
    certificationAvailable: true,
    relatedStandards: ['ATEX Directives (EU)', 'NEC Article 500-506', 'API RP 500/505', 'NFPA 70 (NEC)'],
    implementationGuidance: [
      'Conduct area classification study',
      'Identify release sources',
      'Determine zone extents',
      'Select appropriately certified equipment',
      'Design installation per IEC 60079-14',
      'Conduct initial inspection',
      'Establish inspection and maintenance program'
    ],
    complianceChecklist: [
      'Area classification documented',
      'Equipment EPL matches zone',
      'Temperature class suitable',
      'Correct gas group selected',
      'Cables and glands appropriate',
      'Earthing/bonding complete',
      'Initial inspection certified',
      'Maintenance program established'
    ]
  }
];

// ============================================
// 4. DIGITAL & INFORMATION SAFETY STANDARDS
// ============================================

export const digitalInformationStandards: InternationalStandard[] = [
  {
    id: 'iso-27001',
    code: 'ISO/IEC 27001:2022',
    title: 'Information Security Management',
    fullTitle: 'ISO/IEC 27001:2022 - Information security, cybersecurity and privacy protection — Information security management systems — Requirements',
    description: 'The leading international standard for Information Security Management Systems (ISMS), providing a framework to protect organizational information assets.',
    category: 'Digital & Information Safety',
    subcategory: 'Information Security',
    issuingBody: 'ISO/IEC',
    version: '2022',
    yearPublished: 2022,
    scope: [
      'Information security management',
      'Cybersecurity protection',
      'Privacy protection',
      'All organization types and sizes',
      'Digital and physical assets'
    ],
    keyPrinciples: [
      'Risk-based approach',
      'Leadership commitment',
      'Continual improvement',
      'PDCA cycle application',
      'Context-based implementation'
    ],
    clauses: [
      { id: '27001-4', clause: 'Clause 4', title: 'Context of the Organization', description: 'Understanding organizational context', keyRequirements: ['Internal/external issues', 'Interested parties', 'Scope definition'] },
      { id: '27001-5', clause: 'Clause 5', title: 'Leadership', description: 'Management commitment', keyRequirements: ['Policy', 'Roles and responsibilities', 'Organizational roles'] },
      { id: '27001-6', clause: 'Clause 6', title: 'Planning', description: 'Risk assessment and treatment', keyRequirements: ['Risk assessment', 'Risk treatment', 'Information security objectives'] },
      { id: '27001-7', clause: 'Clause 7', title: 'Support', description: 'Resources and awareness', keyRequirements: ['Resources', 'Competence', 'Awareness', 'Communication', 'Documentation'] },
      { id: '27001-8', clause: 'Clause 8', title: 'Operation', description: 'Operational planning', keyRequirements: ['Planning and control', 'Risk assessment', 'Risk treatment'] },
      { id: '27001-A', clause: 'Annex A', title: 'Controls Reference', description: 'Reference control objectives and controls', keyRequirements: ['93 controls in 4 themes', 'Organizational', 'People', 'Physical', 'Technological'] }
    ],
    applicableIndustries: ['All industries', 'Technology', 'Financial Services', 'Healthcare', 'Government', 'Critical Infrastructure'],
    certificationAvailable: true,
    relatedStandards: ['ISO/IEC 27002 (Controls)', 'ISO/IEC 27005 (Risk)', 'ISO/IEC 27701', 'ISO 22301', 'NIST CSF'],
    implementationGuidance: [
      'Secure top management commitment',
      'Define ISMS scope',
      'Conduct risk assessment',
      'Develop risk treatment plan',
      'Implement selected controls',
      'Train and raise awareness',
      'Monitor and measure',
      'Conduct internal audits',
      'Pursue certification'
    ],
    complianceChecklist: [
      'ISMS scope defined',
      'Information security policy approved',
      'Risk assessment completed',
      'Statement of Applicability prepared',
      'Risk treatment plan implemented',
      'Awareness training conducted',
      'Internal audits performed',
      'Management review completed',
      'Corrective actions tracked'
    ]
  },
  {
    id: 'iso-27701',
    code: 'ISO/IEC 27701:2019',
    title: 'Privacy Information Management',
    fullTitle: 'ISO/IEC 27701:2019 - Security techniques — Extension to ISO/IEC 27001 and ISO/IEC 27002 for privacy information management — Requirements and guidelines',
    description: 'An extension to ISO 27001 for privacy information management, ensuring personal data is handled safely in compliance with global privacy regulations.',
    category: 'Digital & Information Safety',
    subcategory: 'Privacy Management',
    issuingBody: 'ISO/IEC',
    version: '2019',
    yearPublished: 2019,
    scope: [
      'Privacy information management system (PIMS)',
      'PII controllers and processors',
      'Extension to ISO 27001',
      'Support for GDPR and other privacy laws',
      'All organizations processing personal data'
    ],
    keyPrinciples: [
      'Privacy by design and default',
      'Data subject rights',
      'Lawfulness of processing',
      'Data minimization',
      'Transparency and accountability'
    ],
    clauses: [
      { id: '27701-5', clause: 'Clause 5', title: 'PIMS-Specific Requirements', description: 'Extension requirements for ISO 27001', keyRequirements: ['Context additions', 'Leadership requirements', 'Planning enhancements'] },
      { id: '27701-6', clause: 'Clause 6', title: 'PIMS-Specific Guidance', description: 'Extension guidance for ISO 27002', keyRequirements: ['Control modifications', 'Privacy-specific controls'] },
      { id: '27701-7', clause: 'Clause 7', title: 'PII Controllers', description: 'Additional guidance for controllers', keyRequirements: ['Consent management', 'Data subject rights', 'Privacy notices'] },
      { id: '27701-8', clause: 'Clause 8', title: 'PII Processors', description: 'Additional guidance for processors', keyRequirements: ['Processing agreements', 'Sub-processor management', 'Data handling'] }
    ],
    applicableIndustries: ['All industries processing personal data', 'Technology', 'Healthcare', 'Financial Services', 'Retail', 'Government'],
    certificationAvailable: true,
    relatedStandards: ['ISO/IEC 27001', 'ISO/IEC 27002', 'GDPR', 'CCPA', 'ISO 29100 (Privacy framework)'],
    implementationGuidance: [
      'Build on existing ISO 27001 ISMS',
      'Conduct PII inventory and data mapping',
      'Assess privacy risks',
      'Implement privacy controls',
      'Document lawful basis for processing',
      'Establish data subject request procedures',
      'Train personnel on privacy',
      'Conduct privacy impact assessments'
    ],
    complianceChecklist: [
      'ISO 27001 ISMS in place',
      'PII processing documented',
      'Privacy policy established',
      'Consent mechanisms implemented',
      'Data subject rights procedures active',
      'Data processing agreements in place',
      'Breach notification procedures defined',
      'Privacy training completed'
    ]
  },
  {
    id: 'iso-22301',
    code: 'ISO 22301:2019',
    title: 'Business Continuity Management',
    fullTitle: 'ISO 22301:2019 - Security and resilience — Business continuity management systems — Requirements',
    description: 'Focuses on business continuity, ensuring a safe and rapid recovery after a disaster or disruption, protecting critical business functions.',
    category: 'Digital & Information Safety',
    subcategory: 'Business Continuity',
    issuingBody: 'ISO',
    version: '2019',
    yearPublished: 2019,
    scope: [
      'Business continuity management system (BCMS)',
      'Organizational resilience',
      'Disaster recovery',
      'Crisis management',
      'All organization types'
    ],
    keyPrinciples: [
      'Business impact analysis',
      'Risk assessment',
      'Business continuity strategies',
      'Plans and procedures',
      'Exercise and testing'
    ],
    clauses: [
      { id: '22301-4', clause: 'Clause 4', title: 'Context of the Organization', description: 'Understanding organizational needs', keyRequirements: ['Interested parties', 'Scope', 'BCMS requirements'] },
      { id: '22301-6', clause: 'Clause 6', title: 'Planning', description: 'Risk assessment and BIA', keyRequirements: ['Risks and opportunities', 'Business impact analysis', 'BC objectives'] },
      { id: '22301-8', clause: 'Clause 8', title: 'Operation', description: 'BC plans and strategies', keyRequirements: ['BIA methodology', 'Risk assessment', 'BC strategies', 'BC plans', 'Exercise program'] }
    ],
    applicableIndustries: ['All industries', 'Financial Services', 'Healthcare', 'Technology', 'Manufacturing', 'Government', 'Critical Infrastructure'],
    certificationAvailable: true,
    relatedStandards: ['ISO 22313 (Guidance)', 'ISO/IEC 27031 (ICT continuity)', 'ISO 31000', 'NFPA 1600'],
    implementationGuidance: [
      'Secure top management commitment',
      'Conduct business impact analysis',
      'Perform risk assessment',
      'Develop BC strategies',
      'Create BC plans',
      'Establish incident response structure',
      'Conduct exercises and tests',
      'Maintain and improve BCMS'
    ],
    complianceChecklist: [
      'BCMS scope defined',
      'BC policy established',
      'BIA completed',
      'Critical activities identified',
      'Recovery objectives set (RTO/RPO)',
      'BC strategies developed',
      'BC plans documented',
      'Exercise program active',
      'Management reviews conducted'
    ]
  }
];

// ============================================
// 5. SPECIALIZED & RISK STANDARDS
// ============================================

export const specializedRiskStandards: InternationalStandard[] = [
  {
    id: 'iso-31000',
    code: 'ISO 31000:2018',
    title: 'Risk Management',
    fullTitle: 'ISO 31000:2018 - Risk management — Guidelines',
    description: 'Provides the principles and guidelines for managing any form of risk in a systematic, transparent, and credible manner across any organization.',
    category: 'Specialized & Risk Standards',
    subcategory: 'Risk Management',
    issuingBody: 'ISO',
    version: '2018',
    yearPublished: 2018,
    scope: [
      'All types of risk',
      'All types of organizations',
      'Strategic and operational risk',
      'Enterprise risk management',
      'Project and process risk'
    ],
    keyPrinciples: [
      'Integrated into organizational processes',
      'Structured and comprehensive',
      'Customized to organization',
      'Inclusive of stakeholders',
      'Dynamic and responsive to change',
      'Based on best available information',
      'Considers human and cultural factors',
      'Supports continual improvement'
    ],
    clauses: [
      { id: '31000-4', clause: 'Clause 4', title: 'Principles', description: 'Risk management principles', keyRequirements: ['Value creation', 'Integration', 'Structured approach', 'Customization'] },
      { id: '31000-5', clause: 'Clause 5', title: 'Framework', description: 'Risk management framework', keyRequirements: ['Leadership commitment', 'Integration', 'Design', 'Implementation', 'Evaluation', 'Improvement'] },
      { id: '31000-6', clause: 'Clause 6', title: 'Process', description: 'Risk management process', keyRequirements: ['Communication and consultation', 'Scope and context', 'Risk assessment', 'Risk treatment', 'Monitoring and review'] }
    ],
    applicableIndustries: ['All industries', 'Finance', 'Insurance', 'Healthcare', 'Energy', 'Government', 'Construction'],
    certificationAvailable: false,
    relatedStandards: ['IEC 31010 (Risk assessment techniques)', 'ISO 31022 (Legal risk)', 'COSO ERM', 'ISO 45001', 'ISO 27001'],
    implementationGuidance: [
      'Secure executive sponsorship',
      'Establish risk management policy',
      'Define risk criteria and appetite',
      'Integrate into governance',
      'Apply risk assessment process',
      'Develop risk treatment plans',
      'Monitor and report on risks',
      'Review and improve framework'
    ],
    complianceChecklist: [
      'Risk management policy approved',
      'Roles and responsibilities defined',
      'Risk criteria established',
      'Risk appetite defined',
      'Risk assessment process implemented',
      'Risk register maintained',
      'Treatment plans in place',
      'Monitoring and reporting active',
      'Regular reviews conducted'
    ]
  },
  {
    id: 'iso-23932',
    code: 'ISO 23932 Series',
    title: 'Fire Safety Engineering',
    fullTitle: 'ISO 23932 - Fire safety engineering — General principles',
    description: 'Provides an international framework for fire safety engineering, establishing principles for performance-based design and evaluation of fire safety.',
    category: 'Specialized & Risk Standards',
    subcategory: 'Fire Safety',
    issuingBody: 'ISO',
    version: '2009/2020',
    yearPublished: 2009,
    yearRevised: 2020,
    scope: [
      'Fire safety engineering methodology',
      'Performance-based fire safety design',
      'Fire risk assessment',
      'Building and structure fire safety',
      'Fire protection systems design'
    ],
    keyPrinciples: [
      'Performance-based design approach',
      'Fire scenario analysis',
      'Quantitative risk assessment',
      'Acceptance criteria definition',
      'Verification and validation'
    ],
    clauses: [
      { id: '23932-1', clause: 'Part 1', title: 'General', description: 'General principles and framework', keyRequirements: ['FSE process', 'Objectives', 'Documentation'] },
      { id: '23932-2', clause: 'Part 2', title: 'Verification and Validation', description: 'V&V of calculation methods', keyRequirements: ['Model verification', 'Validation methods', 'Uncertainty analysis'] }
    ],
    riskFactors: [
      'Occupant characteristics',
      'Building geometry',
      'Fire load and growth rate',
      'Detection and suppression systems',
      'Egress system capacity',
      'Emergency response capability'
    ],
    applicableIndustries: ['Architecture', 'Construction', 'Fire Protection', 'Building Management', 'Insurance', 'Regulatory Bodies'],
    certificationAvailable: false,
    relatedStandards: ['ISO 16733 (Design fire scenarios)', 'ISO 16734 (Fire detection)', 'NFPA 1 & 101', 'BS 7974', 'SFPE Handbook'],
    implementationGuidance: [
      'Define fire safety objectives',
      'Establish acceptance criteria',
      'Develop design fire scenarios',
      'Apply quantitative analysis',
      'Evaluate trial designs',
      'Document engineering analysis',
      'Obtain authority approval'
    ],
    complianceChecklist: [
      'Fire safety objectives defined',
      'Acceptance criteria established',
      'Design fire scenarios developed',
      'Occupant egress analysis completed',
      'Structural fire resistance verified',
      'Fire protection systems designed',
      'Sensitivity analysis performed',
      'Documentation complete'
    ]
  }
];

// ============================================
// AGGREGATED EXPORTS
// ============================================

export const allInternationalStandards: InternationalStandard[] = [
  ...occupationalHealthSafetyStandards,
  ...sectorSpecificStandards,
  ...technicalEngineeringStandards,
  ...digitalInformationStandards,
  ...specializedRiskStandards
];

export const standardCategories: StandardCategory[] = [
  'Occupational Health & Safety',
  'Sector-Specific Safety',
  'Technical & Engineering Safety',
  'Digital & Information Safety',
  'Specialized & Risk Standards'
];

export const issuingBodies: IssuingBody[] = ['ISO', 'IEC', 'ILO', 'ISO/IEC'];

// Helper functions
export const getStandardsByCategory = (category: StandardCategory): InternationalStandard[] => {
  return allInternationalStandards.filter(std => std.category === category);
};

export const getStandardsByBody = (body: IssuingBody): InternationalStandard[] => {
  return allInternationalStandards.filter(std => std.issuingBody === body);
};

export const searchStandards = (query: string): InternationalStandard[] => {
  const lowerQuery = query.toLowerCase();
  return allInternationalStandards.filter(std =>
    std.code.toLowerCase().includes(lowerQuery) ||
    std.title.toLowerCase().includes(lowerQuery) ||
    std.description.toLowerCase().includes(lowerQuery) ||
    std.applicableIndustries.some(ind => ind.toLowerCase().includes(lowerQuery)) ||
    (std.subcategory && std.subcategory.toLowerCase().includes(lowerQuery))
  );
};

export const getCertifiableStandards = (): InternationalStandard[] => {
  return allInternationalStandards.filter(std => std.certificationAvailable);
};

export const getStandardById = (id: string): InternationalStandard | undefined => {
  return allInternationalStandards.find(std => std.id === id);
};
