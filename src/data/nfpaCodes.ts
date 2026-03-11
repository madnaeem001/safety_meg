export interface NFPACode {
  id: string;
  code: string;
  title: string;
  description: string;
  category: 'General' | 'Systems' | 'Electrical' | 'Life Safety' | 'Hazardous Materials' | 'Industrial' | 'Healthcare';
  edition?: string;
  effectiveDate?: string;
  keyRequirements?: string[];
  applicableTo?: string[];
  inspectionFrequency?: string;
  penalties?: string;
  relatedCodes?: string[];
  resources?: { title: string; url: string }[];
}

export const nfpaCodes: NFPACode[] = [
  {
    id: '1',
    code: 'NFPA 1',
    title: 'Fire Code',
    description: 'Provides requirements to establish a reasonable level of fire safety and property protection in new and existing buildings.',
    category: 'General',
    edition: '2024',
    effectiveDate: '2024-01-01',
    keyRequirements: [
      'General fire prevention and control requirements',
      'Emergency planning and preparedness',
      'Fire department access and water supply',
      'Building services and systems',
      'Interior finish and contents requirements'
    ],
    applicableTo: ['All commercial buildings', 'Industrial facilities', 'Assembly occupancies', 'Educational facilities'],
    inspectionFrequency: 'Annual',
    penalties: 'Fines up to $10,000 per violation; possible facility closure',
    relatedCodes: ['NFPA 101', 'NFPA 80', 'NFPA 13'],
    resources: [
      { title: 'NFPA 1 Free Access', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=1' },
      { title: 'Fire Code Handbook', url: 'https://www.nfpa.org/catalog' }
    ]
  },
  {
    id: '10',
    code: 'NFPA 10',
    title: 'Standard for Portable Fire Extinguishers',
    description: 'Provisions for the selection, installation, inspection, maintenance, recharging, and testing of portable fire extinguishers.',
    category: 'Systems',
    edition: '2022',
    effectiveDate: '2022-07-01',
    keyRequirements: [
      'Fire extinguisher selection based on hazard classification (A, B, C, D, K)',
      'Maximum travel distance of 75 feet for Class A hazards',
      'Monthly visual inspections required',
      'Annual maintenance by certified technician',
      '6-year internal examination for certain types',
      '12-year hydrostatic testing'
    ],
    applicableTo: ['All occupied buildings', 'Vehicles', 'Marine vessels', 'Industrial equipment'],
    inspectionFrequency: 'Monthly (visual), Annual (certified), 6-year (internal), 12-year (hydrostatic)',
    penalties: 'OSHA citations up to $14,502 per violation; insurance claim denial',
    relatedCodes: ['OSHA 29 CFR 1910.157', 'NFPA 72'],
    resources: [
      { title: 'NFPA 10 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=10' }
    ]
  },
  {
    id: '13',
    code: 'NFPA 13',
    title: 'Standard for the Installation of Sprinkler Systems',
    description: 'Industry benchmark for design and installation of automatic fire sprinkler systems.',
    category: 'Systems',
    edition: '2022',
    effectiveDate: '2022-08-01',
    keyRequirements: [
      'Sprinkler spacing requirements (maximum 15x15 feet for light hazard)',
      'Minimum water pressure and flow requirements',
      'Pipe sizing and hydraulic calculations',
      'Obstruction rules for proper coverage',
      'Special occupancy requirements (high-piled storage, etc.)'
    ],
    applicableTo: ['High-rise buildings', 'Warehouses', 'Manufacturing facilities', 'Healthcare facilities', 'Educational buildings'],
    inspectionFrequency: 'Weekly (visual), Quarterly (alarm devices), Annual (full system)',
    penalties: 'Certificate of Occupancy denial; fines up to $50,000; liability for fire damage',
    relatedCodes: ['NFPA 25', 'NFPA 72', 'NFPA 20'],
    resources: [
      { title: 'NFPA 13 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=13' }
    ]
  },
  {
    id: '25',
    code: 'NFPA 25',
    title: 'Standard for the Inspection, Testing, and Maintenance of Water-Based Fire Protection Systems',
    description: 'Baseline for inspection, testing, and maintenance of water-based fire protection systems.',
    category: 'Systems',
    edition: '2023',
    effectiveDate: '2023-01-01',
    keyRequirements: [
      'Weekly valve inspections',
      'Monthly water flow alarm tests',
      'Quarterly main drain tests',
      'Annual trip tests for dry pipe systems',
      '5-year internal pipe inspections',
      'Obstruction investigation protocols'
    ],
    applicableTo: ['All buildings with sprinkler systems', 'Standpipe systems', 'Fire pump installations'],
    inspectionFrequency: 'Weekly, Monthly, Quarterly, Semi-Annual, Annual, 5-Year cycles',
    penalties: 'Insurance premium increases; claim denial; AHJ enforcement actions',
    relatedCodes: ['NFPA 13', 'NFPA 14', 'NFPA 20'],
    resources: [
      { title: 'NFPA 25 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=25' }
    ]
  },
  {
    id: '30',
    code: 'NFPA 30',
    title: 'Flammable and Combustible Liquids Code',
    description: 'Requirements for the storage, handling, and use of flammable and combustible liquids.',
    category: 'Hazardous Materials',
    edition: '2021',
    effectiveDate: '2021-01-01',
    keyRequirements: [
      'Classification of liquids by flash point',
      'Container and portable tank requirements',
      'Storage cabinet specifications (max 60 gallons)',
      'Spill containment requirements (110% capacity)',
      'Ventilation requirements for storage areas',
      'Bonding and grounding for dispensing'
    ],
    applicableTo: ['Chemical plants', 'Refineries', 'Paint shops', 'Laboratories', 'Auto repair facilities'],
    inspectionFrequency: 'Monthly (storage areas), Annual (systems)',
    penalties: 'EPA fines up to $75,000/day; OSHA citations; facility shutdown',
    relatedCodes: ['OSHA 29 CFR 1910.106', 'EPA SPCC', 'NFPA 30A'],
    resources: [
      { title: 'NFPA 30 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=30' }
    ]
  },
  {
    id: '70',
    code: 'NFPA 70',
    title: 'National Electrical Code® (NEC)',
    description: 'The benchmark for safe electrical design, installation, and inspection to protect people and property from electrical hazards.',
    category: 'Electrical',
    edition: '2023',
    effectiveDate: '2023-01-01',
    keyRequirements: [
      'Wiring methods and materials',
      'Overcurrent protection',
      'Grounding and bonding',
      'Equipment installation requirements',
      'Special occupancies (hazardous locations)',
      'Arc-fault circuit interrupter (AFCI) requirements',
      'Ground-fault circuit interrupter (GFCI) requirements'
    ],
    applicableTo: ['All electrical installations', 'Residential', 'Commercial', 'Industrial', 'Healthcare'],
    inspectionFrequency: 'At installation; periodic per AHJ',
    penalties: 'Building permit denial; fines; liability for electrical fires',
    relatedCodes: ['NFPA 70E', 'OSHA 29 CFR 1910 Subpart S'],
    resources: [
      { title: 'NFPA 70 NEC', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=70' }
    ]
  },
  {
    id: '70E',
    code: 'NFPA 70E',
    title: 'Standard for Electrical Safety in the Workplace',
    description: 'Requirements for safe work practices to protect personnel from electrical hazards including shock and arc flash.',
    category: 'Electrical',
    edition: '2024',
    effectiveDate: '2024-01-01',
    keyRequirements: [
      'Electrical safety program establishment',
      'Arc flash risk assessment',
      'PPE selection based on incident energy levels',
      'Approach boundaries (limited, restricted, prohibited)',
      'Lockout/tagout procedures',
      'Energized electrical work permits',
      'Training requirements for qualified persons'
    ],
    applicableTo: ['All workplaces with electrical systems', 'Maintenance operations', 'Construction sites'],
    inspectionFrequency: 'Annual program review; per task assessments',
    penalties: 'OSHA citations up to $156,259 per willful violation; personal injury liability',
    relatedCodes: ['NFPA 70', 'OSHA 29 CFR 1910.147', 'OSHA 29 CFR 1910.132'],
    resources: [
      { title: 'NFPA 70E Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=70E' }
    ]
  },
  {
    id: '72',
    code: 'NFPA 72',
    title: 'National Fire Alarm and Signaling Code®',
    description: 'Covers the application, installation, location, performance, inspection, testing, and maintenance of fire alarm systems.',
    category: 'Systems',
    edition: '2022',
    effectiveDate: '2022-08-01',
    keyRequirements: [
      'Detector spacing and placement',
      'Notification appliance requirements (85 dBA minimum)',
      'Power supply requirements (24-hour standby)',
      'Monitoring and transmission requirements',
      'Record keeping and documentation',
      'Sensitivity testing annually'
    ],
    applicableTo: ['Commercial buildings', 'High-rise buildings', 'Assembly occupancies', 'Healthcare facilities'],
    inspectionFrequency: 'Weekly (visual), Semi-Annual (testing), Annual (comprehensive)',
    penalties: 'Certificate of Occupancy denial; fines; insurance implications',
    relatedCodes: ['NFPA 101', 'NFPA 13', 'NFPA 110'],
    resources: [
      { title: 'NFPA 72 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=72' }
    ]
  },
  {
    id: '80',
    code: 'NFPA 80',
    title: 'Standard for Fire Doors and Other Opening Protectives',
    description: 'Regulates the installation and maintenance of assemblies and devices used to protect openings in walls, floors, and ceilings against the spread of fire and smoke.',
    category: 'General',
    edition: '2022',
    effectiveDate: '2022-01-01',
    keyRequirements: [
      'Annual fire door inspections required',
      'Door, frame, and hardware inspection criteria',
      'Clearance requirements (max 3/4" at bottom)',
      'Self-closing and automatic closing device requirements',
      'Signage and labeling requirements',
      'Documentation and record keeping'
    ],
    applicableTo: ['Fire-rated assemblies', 'Healthcare facilities', 'Educational buildings', 'Commercial buildings'],
    inspectionFrequency: 'Annual (minimum); more frequent for high-traffic areas',
    penalties: 'AHJ enforcement; insurance claim denial; liability exposure',
    relatedCodes: ['NFPA 101', 'NFPA 105', 'NFPA 252'],
    resources: [
      { title: 'NFPA 80 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=80' }
    ]
  },
  {
    id: '99',
    code: 'NFPA 99',
    title: 'Health Care Facilities Code',
    description: 'Establishes criteria for levels of healthcare services to minimize hazards of fire, explosion, and electricity.',
    category: 'Healthcare',
    edition: '2024',
    effectiveDate: '2024-01-01',
    keyRequirements: [
      'Risk-based approach to facility requirements',
      'Medical gas and vacuum system requirements',
      'Electrical system requirements for patient care areas',
      'HVAC and environmental requirements',
      'Emergency management and disaster planning',
      'Hyperbaric facility requirements'
    ],
    applicableTo: ['Hospitals', 'Ambulatory surgery centers', 'Nursing homes', 'Medical offices', 'Dental offices'],
    inspectionFrequency: 'Continuous monitoring; quarterly testing; annual reviews',
    penalties: 'CMS deficiencies; accreditation loss; facility closure',
    relatedCodes: ['NFPA 101', 'NFPA 110', 'NFPA 111', 'Joint Commission Standards'],
    resources: [
      { title: 'NFPA 99 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=99' }
    ]
  },
  {
    id: '101',
    code: 'NFPA 101',
    title: 'Life Safety Code®',
    description: 'Establishes minimum requirements for new and existing buildings to protect occupants from fire, smoke, and toxic fumes.',
    category: 'Life Safety',
    edition: '2024',
    effectiveDate: '2024-01-01',
    keyRequirements: [
      'Means of egress requirements (capacity, travel distance, illumination)',
      'Occupancy classifications and requirements',
      'Fire protection features',
      'Interior finish and contents',
      'Emergency lighting and signage',
      'Fire alarm and detection requirements'
    ],
    applicableTo: ['All building occupancies', 'New construction', 'Existing buildings', 'Healthcare facilities'],
    inspectionFrequency: 'Annual; more frequent for healthcare and assembly',
    penalties: 'Certificate of Occupancy denial; CMS deficiencies; legal liability',
    relatedCodes: ['NFPA 1', 'NFPA 13', 'NFPA 72', 'NFPA 80'],
    resources: [
      { title: 'NFPA 101 Life Safety Code', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=101' }
    ]
  },
  {
    id: '110',
    code: 'NFPA 110',
    title: 'Standard for Emergency and Standby Power Systems',
    description: 'Requirements for the installation, maintenance, operation, and testing of emergency and standby power systems.',
    category: 'Systems',
    edition: '2022',
    effectiveDate: '2022-01-01',
    keyRequirements: [
      'Generator sizing and classification (Level 1, 2)',
      'Transfer switch requirements (10 seconds for Level 1)',
      'Fuel supply requirements (minimum runtime)',
      'Monthly testing under load',
      'Annual load bank testing',
      'Documentation and record keeping'
    ],
    applicableTo: ['Healthcare facilities', 'High-rise buildings', 'Data centers', 'Assembly occupancies'],
    inspectionFrequency: 'Weekly (visual), Monthly (operational), Annual (load bank)',
    penalties: 'CMS deficiencies for healthcare; AHJ enforcement; insurance implications',
    relatedCodes: ['NFPA 99', 'NFPA 101', 'NFPA 111'],
    resources: [
      { title: 'NFPA 110 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=110' }
    ]
  },
  {
    id: '652',
    code: 'NFPA 652',
    title: 'Standard on the Fundamentals of Combustible Dust',
    description: 'Establishes fundamental requirements for managing fire and explosion hazards from combustible dusts.',
    category: 'Industrial',
    edition: '2024',
    effectiveDate: '2024-01-01',
    keyRequirements: [
      'Dust hazard analysis (DHA) requirements',
      'Housekeeping requirements (1/32" maximum accumulation)',
      'Explosion protection systems',
      'Ignition source control',
      'Training requirements',
      'Management of change procedures'
    ],
    applicableTo: ['Food processing', 'Pharmaceutical', 'Woodworking', 'Metal processing', 'Chemical manufacturing'],
    inspectionFrequency: 'Continuous housekeeping; annual DHA review',
    penalties: 'OSHA citations up to $156,259; EPA enforcement; criminal liability for incidents',
    relatedCodes: ['NFPA 61', 'NFPA 484', 'OSHA Combustible Dust NEP'],
    resources: [
      { title: 'NFPA 652 Standard', url: 'https://www.nfpa.org/codes-and-standards/all-codes-and-standards/list-of-codes-and-standards/detail?code=652' }
    ]
  }
];
