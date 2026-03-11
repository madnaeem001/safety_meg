// Training Management Mock Data
// Role-based training requirements with expiration tracking and compliance monitoring

export type RoleType = 
  | 'Operator'
  | 'Supervisor' 
  | 'Manager'
  | 'Safety Officer'
  | 'Maintenance Tech'
  | 'Driver'
  | 'Warehouse Worker'
  | 'Lab Technician'
  | 'Healthcare Worker'
  | 'Contractor';

export type TrainingStatus = 'Current' | 'Expiring Soon' | 'Expired' | 'Not Started';

export type CourseCategory = 
  | 'OSHA Required'
  | 'EPA Compliance'
  | 'MSHA Required'
  | 'Industrial Hygiene'
  | 'ISO Standards'
  | 'Company Policy'
  | 'Job Specific';

export interface TrainingCourse {
  id: string;
  title: string;
  code: string;
  category: CourseCategory;
  description: string;
  durationHours: number;
  validityMonths: number;
  requiredForRoles: RoleType[];
  regulatoryReference: string;
  hazardTypes: string[];
}

export interface EmployeeTraining {
  id: string;
  employeeId: string;
  employeeName: string;
  role: RoleType;
  department: string;
  courseId: string;
  courseName: string;
  completionDate: string | null;
  expirationDate: string | null;
  status: TrainingStatus;
  certificateId?: string;
  evidenceType?: 'Certificate' | 'Sign-off Sheet' | 'Test Score' | 'Photo Evidence';
  score?: number;
}

export interface TrainingComplianceStats {
  totalEmployees: number;
  fullyCompliant: number;
  expiringSoon: number;
  expired: number;
  notStarted: number;
  complianceRate: number;
}

// Comprehensive Training Courses aligned with regulatory standards
export const TRAINING_COURSES: TrainingCourse[] = [
  // OSHA Required
  {
    id: 'OSHA-10',
    title: 'OSHA 10-Hour General Industry',
    code: 'OSHA-10-GI',
    category: 'OSHA Required',
    description: 'Introduction to OSHA and the OSH Act, walking and working surfaces, exit routes, electrical safety, PPE, and hazard communication.',
    durationHours: 10,
    validityMonths: 60,
    requiredForRoles: ['Operator', 'Warehouse Worker', 'Maintenance Tech', 'Lab Technician'],
    regulatoryReference: '29 CFR 1910',
    hazardTypes: ['Electrical', 'Falls', 'Chemical', 'Fire']
  },
  {
    id: 'OSHA-30',
    title: 'OSHA 30-Hour General Industry',
    code: 'OSHA-30-GI',
    category: 'OSHA Required',
    description: 'Comprehensive safety training covering all major OSHA standards for general industry supervisors and safety personnel.',
    durationHours: 30,
    validityMonths: 60,
    requiredForRoles: ['Supervisor', 'Manager', 'Safety Officer'],
    regulatoryReference: '29 CFR 1910',
    hazardTypes: ['Electrical', 'Falls', 'Chemical', 'Fire', 'Ergonomic', 'Machine Guarding']
  },
  {
    id: 'HAZWOPER-24',
    title: 'HAZWOPER 24-Hour Operations',
    code: 'HAZWOPER-24',
    category: 'OSHA Required',
    description: 'Hazardous waste operations training for workers at uncontrolled hazardous waste sites and emergency response.',
    durationHours: 24,
    validityMonths: 12,
    requiredForRoles: ['Safety Officer', 'Maintenance Tech'],
    regulatoryReference: '29 CFR 1910.120',
    hazardTypes: ['Chemical', 'Hazardous Materials', 'Environmental']
  },
  {
    id: 'LOTO',
    title: 'Lockout/Tagout (LOTO)',
    code: 'LOTO-AUTH',
    category: 'OSHA Required',
    description: 'Control of hazardous energy procedures for servicing and maintenance of machines and equipment.',
    durationHours: 4,
    validityMonths: 12,
    requiredForRoles: ['Operator', 'Maintenance Tech', 'Supervisor'],
    regulatoryReference: '29 CFR 1910.147',
    hazardTypes: ['Electrical', 'Mechanical', 'Hydraulic', 'Pneumatic']
  },
  {
    id: 'CONFINED',
    title: 'Confined Space Entry',
    code: 'CSE-PERMIT',
    category: 'OSHA Required',
    description: 'Permit-required confined space entry procedures including atmospheric testing, rescue, and attendant duties.',
    durationHours: 8,
    validityMonths: 12,
    requiredForRoles: ['Operator', 'Maintenance Tech', 'Safety Officer'],
    regulatoryReference: '29 CFR 1910.146',
    hazardTypes: ['Atmospheric', 'Engulfment', 'Entrapment']
  },
  {
    id: 'FORKLIFT',
    title: 'Powered Industrial Truck Operator',
    code: 'PIT-CERT',
    category: 'OSHA Required',
    description: 'Forklift operation certification including pre-operation inspection, load handling, and pedestrian safety.',
    durationHours: 8,
    validityMonths: 36,
    requiredForRoles: ['Warehouse Worker', 'Operator'],
    regulatoryReference: '29 CFR 1910.178',
    hazardTypes: ['Struck-By', 'Crushing', 'Falls']
  },
  {
    id: 'RESP-FIT',
    title: 'Respiratory Protection & Fit Testing',
    code: 'RESP-FIT',
    category: 'OSHA Required',
    description: 'Proper use, limitations, and fit testing of respiratory protection equipment.',
    durationHours: 2,
    validityMonths: 12,
    requiredForRoles: ['Operator', 'Maintenance Tech', 'Lab Technician', 'Healthcare Worker'],
    regulatoryReference: '29 CFR 1910.134',
    hazardTypes: ['Airborne Contaminants', 'Chemical', 'Biological']
  },
  // MSHA Required
  {
    id: 'MSHA-ANNUAL',
    title: 'MSHA Part 46 Annual Refresher',
    code: 'MSHA-46-REF',
    category: 'MSHA Required',
    description: 'Annual refresher training for surface miners covering health and safety topics.',
    durationHours: 8,
    validityMonths: 12,
    requiredForRoles: ['Operator', 'Supervisor'],
    regulatoryReference: '30 CFR Part 46',
    hazardTypes: ['Mining', 'Dust', 'Noise', 'Equipment']
  },
  {
    id: 'MSHA-NEW',
    title: 'MSHA New Miner Training',
    code: 'MSHA-46-NEW',
    category: 'MSHA Required',
    description: '24-hour comprehensive training for new miners covering all mining hazards and safety procedures.',
    durationHours: 24,
    validityMonths: 0, // One-time
    requiredForRoles: ['Operator'],
    regulatoryReference: '30 CFR Part 46',
    hazardTypes: ['Mining', 'Dust', 'Noise', 'Equipment', 'Ground Control']
  },
  // EPA Compliance
  {
    id: 'RCRA',
    title: 'RCRA Hazardous Waste Management',
    code: 'RCRA-HW',
    category: 'EPA Compliance',
    description: 'Management of hazardous waste from cradle to grave including identification, storage, and disposal.',
    durationHours: 4,
    validityMonths: 12,
    requiredForRoles: ['Safety Officer', 'Lab Technician', 'Maintenance Tech'],
    regulatoryReference: '40 CFR 262-265',
    hazardTypes: ['Hazardous Waste', 'Environmental']
  },
  {
    id: 'SPCC',
    title: 'SPCC Plan Training',
    code: 'SPCC-OIL',
    category: 'EPA Compliance',
    description: 'Spill Prevention, Control, and Countermeasure plan requirements for oil storage facilities.',
    durationHours: 2,
    validityMonths: 12,
    requiredForRoles: ['Operator', 'Maintenance Tech', 'Driver'],
    regulatoryReference: '40 CFR 112',
    hazardTypes: ['Oil Spill', 'Environmental']
  },
  // Industrial Hygiene
  {
    id: 'HEARING',
    title: 'Hearing Conservation Program',
    code: 'HCP-ANNUAL',
    category: 'Industrial Hygiene',
    description: 'Hearing conservation training including noise exposure, audiometric testing, and hearing protection.',
    durationHours: 1,
    validityMonths: 12,
    requiredForRoles: ['Operator', 'Maintenance Tech', 'Warehouse Worker'],
    regulatoryReference: '29 CFR 1910.95',
    hazardTypes: ['Noise', 'Hearing Loss']
  },
  {
    id: 'ERGONOMICS',
    title: 'Ergonomics Awareness',
    code: 'ERGO-101',
    category: 'Industrial Hygiene',
    description: 'Prevention of musculoskeletal disorders through proper workstation setup and lifting techniques.',
    durationHours: 2,
    validityMonths: 24,
    requiredForRoles: ['Operator', 'Warehouse Worker', 'Lab Technician', 'Healthcare Worker'],
    regulatoryReference: 'OSHA Guidelines',
    hazardTypes: ['Ergonomic', 'Musculoskeletal']
  },
  {
    id: 'BLOODBORNE',
    title: 'Bloodborne Pathogen Exposure Control',
    code: 'BBP-ANNUAL',
    category: 'Industrial Hygiene',
    description: 'Prevention of occupational exposure to bloodborne pathogens including Hepatitis B and HIV.',
    durationHours: 2,
    validityMonths: 12,
    requiredForRoles: ['Healthcare Worker', 'Safety Officer'],
    regulatoryReference: '29 CFR 1910.1030',
    hazardTypes: ['Biological', 'Bloodborne']
  },
  // ISO Standards
  {
    id: 'ISO45001',
    title: 'ISO 45001 OH&S Management System',
    code: 'ISO-45001-AWARE',
    category: 'ISO Standards',
    description: 'Occupational health and safety management system requirements and implementation.',
    durationHours: 8,
    validityMonths: 36,
    requiredForRoles: ['Safety Officer', 'Manager', 'Supervisor'],
    regulatoryReference: 'ISO 45001:2018',
    hazardTypes: ['Systematic Management']
  },
  {
    id: 'ISO14001',
    title: 'ISO 14001 Environmental Management',
    code: 'ISO-14001-AWARE',
    category: 'ISO Standards',
    description: 'Environmental management system requirements for sustainable operations.',
    durationHours: 8,
    validityMonths: 36,
    requiredForRoles: ['Safety Officer', 'Manager'],
    regulatoryReference: 'ISO 14001:2015',
    hazardTypes: ['Environmental']
  },
  // Job Specific
  {
    id: 'HOT-WORK',
    title: 'Hot Work Permit & Fire Watch',
    code: 'HOT-WORK-PERMIT',
    category: 'Job Specific',
    description: 'Safe procedures for welding, cutting, and other spark-producing operations.',
    durationHours: 4,
    validityMonths: 12,
    requiredForRoles: ['Maintenance Tech', 'Operator'],
    regulatoryReference: '29 CFR 1910.252',
    hazardTypes: ['Fire', 'Burns', 'Fumes']
  },
  {
    id: 'FALL-PROT',
    title: 'Fall Protection Competent Person',
    code: 'FALL-CP',
    category: 'Job Specific',
    description: 'Fall hazard recognition, prevention, and proper use of fall protection equipment.',
    durationHours: 8,
    validityMonths: 12,
    requiredForRoles: ['Supervisor', 'Safety Officer', 'Maintenance Tech'],
    regulatoryReference: '29 CFR 1910.140 / 1926.502',
    hazardTypes: ['Falls', 'Elevated Work']
  },
  {
    id: 'DEFENSIVE-DRIVING',
    title: 'Defensive Driving',
    code: 'DDC-ANNUAL',
    category: 'Job Specific',
    description: 'Safe driving techniques, hazard recognition, and accident prevention for company drivers.',
    durationHours: 4,
    validityMonths: 12,
    requiredForRoles: ['Driver'],
    regulatoryReference: 'Company Policy / DOT',
    hazardTypes: ['Vehicle', 'Traffic']
  }
];

// Mock Employee Training Records
export const EMPLOYEE_TRAINING: EmployeeTraining[] = [
  // John Doe - Safety Officer (mostly compliant)
  { id: 'TR-001', employeeId: 'EMP-001', employeeName: 'John Doe', role: 'Safety Officer', department: 'EHS', courseId: 'OSHA-30', courseName: 'OSHA 30-Hour General Industry', completionDate: '2025-06-15', expirationDate: '2030-06-15', status: 'Current', certificateId: 'OSHA30-2025-001', evidenceType: 'Certificate', score: 92 },
  { id: 'TR-002', employeeId: 'EMP-001', employeeName: 'John Doe', role: 'Safety Officer', department: 'EHS', courseId: 'HAZWOPER-24', courseName: 'HAZWOPER 24-Hour Operations', completionDate: '2025-03-10', expirationDate: '2026-03-10', status: 'Expiring Soon', certificateId: 'HAZ24-2025-042', evidenceType: 'Certificate', score: 88 },
  { id: 'TR-003', employeeId: 'EMP-001', employeeName: 'John Doe', role: 'Safety Officer', department: 'EHS', courseId: 'ISO45001', courseName: 'ISO 45001 OH&S Management System', completionDate: '2024-09-20', expirationDate: '2027-09-20', status: 'Current', evidenceType: 'Certificate' },
  { id: 'TR-004', employeeId: 'EMP-001', employeeName: 'John Doe', role: 'Safety Officer', department: 'EHS', courseId: 'CONFINED', courseName: 'Confined Space Entry', completionDate: '2024-11-05', expirationDate: '2025-11-05', status: 'Expired', evidenceType: 'Sign-off Sheet' },
  
  // Jane Smith - Supervisor
  { id: 'TR-005', employeeId: 'EMP-002', employeeName: 'Jane Smith', role: 'Supervisor', department: 'Operations', courseId: 'OSHA-30', courseName: 'OSHA 30-Hour General Industry', completionDate: '2024-04-22', expirationDate: '2029-04-22', status: 'Current', certificateId: 'OSHA30-2024-088', evidenceType: 'Certificate', score: 95 },
  { id: 'TR-006', employeeId: 'EMP-002', employeeName: 'Jane Smith', role: 'Supervisor', department: 'Operations', courseId: 'LOTO', courseName: 'Lockout/Tagout (LOTO)', completionDate: '2025-01-03', expirationDate: '2026-01-03', status: 'Current', evidenceType: 'Test Score', score: 100 },
  { id: 'TR-007', employeeId: 'EMP-002', employeeName: 'Jane Smith', role: 'Supervisor', department: 'Operations', courseId: 'FALL-PROT', courseName: 'Fall Protection Competent Person', completionDate: null, expirationDate: null, status: 'Not Started', evidenceType: undefined },
  
  // Mike Ross - Operator
  { id: 'TR-008', employeeId: 'EMP-003', employeeName: 'Mike Ross', role: 'Operator', department: 'Production', courseId: 'OSHA-10', courseName: 'OSHA 10-Hour General Industry', completionDate: '2023-08-15', expirationDate: '2028-08-15', status: 'Current', certificateId: 'OSHA10-2023-201', evidenceType: 'Certificate', score: 85 },
  { id: 'TR-009', employeeId: 'EMP-003', employeeName: 'Mike Ross', role: 'Operator', department: 'Production', courseId: 'LOTO', courseName: 'Lockout/Tagout (LOTO)', completionDate: '2024-08-20', expirationDate: '2025-08-20', status: 'Expiring Soon', evidenceType: 'Test Score', score: 90 },
  { id: 'TR-010', employeeId: 'EMP-003', employeeName: 'Mike Ross', role: 'Operator', department: 'Production', courseId: 'FORKLIFT', courseName: 'Powered Industrial Truck Operator', completionDate: '2024-02-10', expirationDate: '2027-02-10', status: 'Current', certificateId: 'PIT-2024-055', evidenceType: 'Certificate', score: 88 },
  { id: 'TR-011', employeeId: 'EMP-003', employeeName: 'Mike Ross', role: 'Operator', department: 'Production', courseId: 'HEARING', courseName: 'Hearing Conservation Program', completionDate: '2024-06-01', expirationDate: '2025-06-01', status: 'Expired', evidenceType: 'Sign-off Sheet' },
  
  // Sarah Connor - Driver
  { id: 'TR-012', employeeId: 'EMP-004', employeeName: 'Sarah Connor', role: 'Driver', department: 'Logistics', courseId: 'DEFENSIVE-DRIVING', courseName: 'Defensive Driving', completionDate: '2025-01-02', expirationDate: '2026-01-02', status: 'Current', certificateId: 'DDC-2025-012', evidenceType: 'Certificate', score: 94 },
  { id: 'TR-013', employeeId: 'EMP-004', employeeName: 'Sarah Connor', role: 'Driver', department: 'Logistics', courseId: 'SPCC', courseName: 'SPCC Plan Training', completionDate: '2024-12-15', expirationDate: '2025-12-15', status: 'Current', evidenceType: 'Sign-off Sheet' },
  
  // Dr. Lisa Park - Healthcare Worker
  { id: 'TR-014', employeeId: 'EMP-005', employeeName: 'Dr. Lisa Park', role: 'Healthcare Worker', department: 'Medical', courseId: 'BLOODBORNE', courseName: 'Bloodborne Pathogen Exposure Control', completionDate: '2025-01-04', expirationDate: '2026-01-04', status: 'Current', evidenceType: 'Test Score', score: 100 },
  { id: 'TR-015', employeeId: 'EMP-005', employeeName: 'Dr. Lisa Park', role: 'Healthcare Worker', department: 'Medical', courseId: 'RESP-FIT', courseName: 'Respiratory Protection & Fit Testing', completionDate: '2024-11-20', expirationDate: '2025-11-20', status: 'Expiring Soon', evidenceType: 'Photo Evidence' }
];

// Calculate compliance statistics
export const getTrainingComplianceStats = (): TrainingComplianceStats => {
  const uniqueEmployees = new Set(EMPLOYEE_TRAINING.map(t => t.employeeId));
  const totalEmployees = uniqueEmployees.size;
  
  // Group by employee and check their status
  const employeeStatuses = new Map<string, TrainingStatus[]>();
  EMPLOYEE_TRAINING.forEach(t => {
    const existing = employeeStatuses.get(t.employeeId) || [];
    existing.push(t.status);
    employeeStatuses.set(t.employeeId, existing);
  });
  
  let fullyCompliant = 0;
  let expiringSoon = 0;
  let expired = 0;
  let notStarted = 0;
  
  employeeStatuses.forEach((statuses) => {
    if (statuses.includes('Expired')) expired++;
    else if (statuses.includes('Not Started')) notStarted++;
    else if (statuses.includes('Expiring Soon')) expiringSoon++;
    else fullyCompliant++;
  });
  
  const complianceRate = Math.round((fullyCompliant / totalEmployees) * 100);
  
  return { totalEmployees, fullyCompliant, expiringSoon, expired, notStarted, complianceRate };
};

// Get required courses for a role
export const getRequiredCoursesForRole = (role: RoleType): TrainingCourse[] => {
  return TRAINING_COURSES.filter(course => course.requiredForRoles.includes(role));
};

// Get training by category
export const getTrainingByCategory = (category: CourseCategory): TrainingCourse[] => {
  return TRAINING_COURSES.filter(course => course.category === category);
};
