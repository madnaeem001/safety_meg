// CAPA Controls Data - AI Risk Assessment & Hierarchy of Controls with Regulatory References

export interface HierarchyControl {
  id: string;
  level: 'elimination' | 'substitution' | 'engineering' | 'administrative' | 'ppe';
  name: string;
  description: string;
  effectiveness: number; // 1-100%
  examples: string[];
  regulatoryReferences: RegulatoryRef[];
  color: string;
  icon: string;
}

export interface RegulatoryRef {
  body: 'ISO' | 'EPA' | 'MSHA' | 'NIOSH' | 'OSHA';
  code: string;
  title: string;
  description: string;
  sourceUrl?: string;
}

export interface AIRiskAssessmentConfig {
  id: string;
  name: string;
  description: string;
  riskFactors: string[];
  aiCapabilities: string[];
  regulatoryAlignment: RegulatoryRef[];
}

// Hierarchy of Controls - NIOSH Model
export const hierarchyOfControls: HierarchyControl[] = [
  {
    id: 'hoc-1',
    level: 'elimination',
    name: 'Elimination',
    description: 'Physically remove the hazard from the workplace entirely.',
    effectiveness: 100,
    examples: [
      'Remove hazardous process from workflow',
      'Discontinue use of toxic chemicals',
      'Eliminate high-risk equipment',
      'Redesign process to remove hazard source'
    ],
    regulatoryReferences: [
      {
        body: 'NIOSH',
        code: 'NIOSH 2015-189',
        title: 'Hierarchy of Controls',
        description: 'Most effective control method - physically remove hazard'
      },
      {
        body: 'ISO',
        code: 'ISO 45001:2018 §8.1.2',
        title: 'Eliminating hazards',
        description: 'Organizations shall establish processes for elimination of hazards'
      },
      {
        body: 'OSHA',
        code: '29 CFR 1910.132(d)',
        title: 'Hazard Assessment',
        description: 'First consider elimination before other controls'
      }
    ],
    color: 'bg-green-600',
    icon: 'XCircle'
  },
  {
    id: 'hoc-2',
    level: 'substitution',
    name: 'Substitution',
    description: 'Replace the hazard with a less hazardous alternative.',
    effectiveness: 90,
    examples: [
      'Replace toxic solvent with water-based cleaner',
      'Use mechanical lifting instead of manual handling',
      'Substitute silica sand with safer abrasive',
      'Replace lead-based paint with non-toxic alternative'
    ],
    regulatoryReferences: [
      {
        body: 'NIOSH',
        code: 'NIOSH 2015-189',
        title: 'Hierarchy of Controls',
        description: 'Second most effective - replace with less hazardous'
      },
      {
        body: 'ISO',
        code: 'ISO 45001:2018 §8.1.2',
        title: 'Substituting processes',
        description: 'Replace hazardous materials, processes, operations'
      },
      {
        body: 'EPA',
        code: '40 CFR 261.31',
        title: 'Hazardous Waste Substitution',
        description: 'Guidance on safer chemical alternatives'
      }
    ],
    color: 'bg-emerald-500',
    icon: 'RefreshCw'
  },
  {
    id: 'hoc-3',
    level: 'engineering',
    name: 'Engineering Controls',
    description: 'Isolate workers from the hazard through physical changes.',
    effectiveness: 75,
    examples: [
      'Install ventilation systems (LEV)',
      'Use machine guards and interlocks',
      'Install noise barriers/enclosures',
      'Implement automated material handling',
      'Install fall protection systems'
    ],
    regulatoryReferences: [
      {
        body: 'OSHA',
        code: '29 CFR 1910.212',
        title: 'Machine Guarding',
        description: 'Engineering controls for machinery hazards'
      },
      {
        body: 'NIOSH',
        code: 'NIOSH 2003-136',
        title: 'Engineering Controls',
        description: 'Preferred over administrative and PPE controls'
      },
      {
        body: 'MSHA',
        code: '30 CFR 56.14107',
        title: 'Moving Machine Parts',
        description: 'Guards for moving machine parts in mining'
      },
      {
        body: 'ISO',
        code: 'ISO 12100:2010',
        title: 'Safety of Machinery',
        description: 'Risk reduction through inherently safe design'
      }
    ],
    color: 'bg-blue-500',
    icon: 'Wrench'
  },
  {
    id: 'hoc-4',
    level: 'administrative',
    name: 'Administrative Controls',
    description: 'Change the way people work through policies, procedures, and training.',
    effectiveness: 50,
    examples: [
      'Implement job rotation to reduce exposure',
      'Develop safe work procedures (SWPs)',
      'Conduct regular safety training',
      'Post warning signs and labels',
      'Establish permit-to-work systems'
    ],
    regulatoryReferences: [
      {
        body: 'OSHA',
        code: '29 CFR 1910.1200',
        title: 'Hazard Communication',
        description: 'Labels, SDS, and training requirements'
      },
      {
        body: 'ISO',
        code: 'ISO 45001:2018 §7.2',
        title: 'Competence',
        description: 'Training and awareness requirements'
      },
      {
        body: 'MSHA',
        code: '30 CFR 46',
        title: 'Training Requirements',
        description: 'Surface miner training and retraining'
      },
      {
        body: 'NIOSH',
        code: 'NIOSH 98-145',
        title: 'Worker Education',
        description: 'Training program recommendations'
      }
    ],
    color: 'bg-amber-500',
    icon: 'FileText'
  },
  {
    id: 'hoc-5',
    level: 'ppe',
    name: 'Personal Protective Equipment',
    description: 'Protect workers with personal equipment as last line of defense.',
    effectiveness: 30,
    examples: [
      'Safety glasses, goggles, face shields',
      'Hearing protection (earplugs/muffs)',
      'Respirators and masks',
      'Protective gloves and clothing',
      'Fall protection harnesses'
    ],
    regulatoryReferences: [
      {
        body: 'OSHA',
        code: '29 CFR 1910.132-138',
        title: 'Personal Protective Equipment',
        description: 'PPE requirements for general industry'
      },
      {
        body: 'NIOSH',
        code: 'NIOSH 2004-101',
        title: 'Respirator Selection',
        description: 'Selecting appropriate respiratory protection'
      },
      {
        body: 'MSHA',
        code: '30 CFR 56.15001',
        title: 'First Aid Materials',
        description: 'PPE and first aid requirements for mining'
      },
      {
        body: 'ISO',
        code: 'ISO 45001:2018 §8.1.2(e)',
        title: 'PPE Controls',
        description: 'PPE as last resort after other controls'
      }
    ],
    color: 'bg-red-500',
    icon: 'HardHat'
  }
];

// AI Risk Assessment Capabilities
export const aiRiskAssessmentConfig: AIRiskAssessmentConfig = {
  id: 'ai-risk-config',
  name: 'AI-Powered Risk Assessment',
  description: 'Leverages machine learning and natural language processing to analyze hazards, predict incidents, and recommend controls.',
  riskFactors: [
    'Historical incident patterns',
    'Environmental conditions',
    'Equipment age and maintenance history',
    'Worker experience levels',
    'Process complexity scores',
    'Regulatory compliance status',
    'Near-miss frequency',
    'Behavioral observation data'
  ],
  aiCapabilities: [
    'Predictive hazard identification',
    'Automated root cause analysis',
    'Control effectiveness scoring',
    'Real-time risk level monitoring',
    'Natural language report generation',
    'Trend detection and anomaly alerts',
    'Compliance gap analysis',
    'Training needs assessment'
  ],
  regulatoryAlignment: [
    {
      body: 'ISO',
      code: 'ISO 31000:2018',
      title: 'Risk Management Guidelines',
      description: 'Framework for risk identification, analysis, and evaluation'
    },
    {
      body: 'ISO',
      code: 'ISO 45001:2018 §6.1',
      title: 'Actions to Address Risks',
      description: 'Systematic approach to OH&S risk assessment'
    },
    {
      body: 'OSHA',
      code: 'OSHA 3071',
      title: 'Job Hazard Analysis',
      description: 'Systematic hazard identification methodology'
    },
    {
      body: 'NIOSH',
      code: 'NIOSH 2002-116',
      title: 'Risk Assessment Tools',
      description: 'Guidance on quantitative risk assessment'
    }
  ]
};

// Comprehensive Regulatory References for CAPA
export const capaRegulatoryReferences: RegulatoryRef[] = [
  // ISO Standards
  {
    body: 'ISO',
    code: 'ISO 45001:2018',
    title: 'Occupational Health & Safety Management',
    description: 'International standard for OH&S management systems, specifying requirements for hazard identification, risk assessment, and control implementation.',
    sourceUrl: 'https://www.iso.org/standard/63787.html'
  },
  {
    body: 'ISO',
    code: 'ISO 14001:2015',
    title: 'Environmental Management Systems',
    description: 'Requirements for environmental management including identification of environmental aspects and impacts.',
    sourceUrl: 'https://www.iso.org/standard/60857.html'
  },
  {
    body: 'ISO',
    code: 'ISO 31000:2018',
    title: 'Risk Management Guidelines',
    description: 'Principles and generic guidelines for managing risk faced by organizations.',
    sourceUrl: 'https://www.iso.org/standard/65694.html'
  },
  {
    body: 'ISO',
    code: 'ISO 9001:2015 §10.2',
    title: 'Nonconformity & Corrective Action',
    description: 'Requirements for handling nonconformities and implementing corrective actions.',
    sourceUrl: 'https://www.iso.org/standard/62085.html'
  },
  // EPA Regulations
  {
    body: 'EPA',
    code: '40 CFR 68',
    title: 'Chemical Accident Prevention',
    description: 'Risk Management Program requirements for facilities with hazardous chemicals.',
    sourceUrl: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-C/part-68'
  },
  {
    body: 'EPA',
    code: '40 CFR 112',
    title: 'Oil Pollution Prevention (SPCC)',
    description: 'Spill Prevention, Control, and Countermeasure requirements.',
    sourceUrl: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-D/part-112'
  },
  {
    body: 'EPA',
    code: '40 CFR 261',
    title: 'Hazardous Waste Identification',
    description: 'Criteria for identifying hazardous waste and proper management.',
    sourceUrl: 'https://www.ecfr.gov/current/title-40/chapter-I/subchapter-I/part-261'
  },
  // MSHA Regulations
  {
    body: 'MSHA',
    code: '30 CFR Part 46',
    title: 'Training & Retraining of Miners',
    description: 'Training requirements for surface miners and safety topics.',
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-H/part-46'
  },
  {
    body: 'MSHA',
    code: '30 CFR 56/57',
    title: 'Surface/Underground Metal & Nonmetal',
    description: 'Safety and health standards for metal and nonmetal mines.',
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-K'
  },
  {
    body: 'MSHA',
    code: '30 CFR 75',
    title: 'Underground Coal Mine Safety',
    description: 'Mandatory safety standards for underground coal mines.',
    sourceUrl: 'https://www.ecfr.gov/current/title-30/chapter-I/subchapter-O/part-75'
  },
  // NIOSH Recommendations
  {
    body: 'NIOSH',
    code: 'NIOSH 2015-189',
    title: 'Hierarchy of Controls',
    description: 'Comprehensive guidance on implementing the hierarchy of controls for hazard reduction.',
    sourceUrl: 'https://www.cdc.gov/niosh/topics/hierarchy/'
  },
  {
    body: 'NIOSH',
    code: 'NIOSH REL',
    title: 'Recommended Exposure Limits',
    description: 'Occupational exposure limits for various chemical and physical agents.',
    sourceUrl: 'https://www.cdc.gov/niosh/npg/'
  },
  {
    body: 'NIOSH',
    code: 'NIOSH HHE',
    title: 'Health Hazard Evaluations',
    description: 'Workplace health hazard evaluation program and findings.',
    sourceUrl: 'https://www.cdc.gov/niosh/hhe/'
  },
  // OSHA Standards
  {
    body: 'OSHA',
    code: '29 CFR 1910',
    title: 'General Industry Standards',
    description: 'Comprehensive safety and health standards for general industry.',
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1910'
  },
  {
    body: 'OSHA',
    code: '29 CFR 1926',
    title: 'Construction Standards',
    description: 'Safety and health regulations for the construction industry.',
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1926'
  },
  {
    body: 'OSHA',
    code: 'OSHA 3071',
    title: 'Job Hazard Analysis',
    description: 'Guidance document for conducting systematic job hazard analyses.',
    sourceUrl: 'https://www.osha.gov/sites/default/files/publications/osha3071.pdf'
  },
  {
    body: 'OSHA',
    code: '29 CFR 1904',
    title: 'Recording & Reporting',
    description: 'Occupational injury and illness recording and reporting requirements.',
    sourceUrl: 'https://www.osha.gov/laws-regs/regulations/standardnumber/1904'
  }
];

// Get controls by effectiveness threshold
export const getHighEffectivenessControls = (minEffectiveness: number = 70): HierarchyControl[] => {
  return hierarchyOfControls.filter(c => c.effectiveness >= minEffectiveness);
};

// Get references by regulatory body
export const getReferencesByBody = (body: RegulatoryRef['body']): RegulatoryRef[] => {
  return capaRegulatoryReferences.filter(r => r.body === body);
};

// Get all controls for a specific regulatory body
export const getControlsWithRegBody = (body: RegulatoryRef['body']): HierarchyControl[] => {
  return hierarchyOfControls.filter(c => 
    c.regulatoryReferences.some(r => r.body === body)
  );
};
