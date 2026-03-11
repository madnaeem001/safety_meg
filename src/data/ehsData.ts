// ============================================
// EHS-SPECIFIC DATA - CORE SAFETY METRICS
// ============================================

// OSHA-compliant Injury/Illness Classifications
export const oshaClassifications = [
  { code: 'D', name: 'Days Away from Work', description: 'Injury/illness resulting in days away from work' },
  { code: 'R', name: 'Restricted Work Activity', description: 'Restricted work or job transfer' },
  { code: 'O', name: 'Other Recordable Cases', description: 'Other recordable cases not resulting in days away or restriction' },
  { code: 'F', name: 'Fatality', description: 'Work-related fatality' },
];

// Body Part Codes (OSHA Form 300)
export const bodyPartCodes = [
  { id: 1, part: 'Head', subcategories: ['Skull', 'Face', 'Eye(s)', 'Ear(s)', 'Mouth/Teeth'] },
  { id: 2, part: 'Neck', subcategories: ['Cervical vertebrae', 'Throat'] },
  { id: 3, part: 'Trunk', subcategories: ['Back', 'Chest', 'Abdomen', 'Pelvis', 'Shoulder(s)'] },
  { id: 4, part: 'Upper Extremities', subcategories: ['Arm(s)', 'Elbow(s)', 'Wrist(s)', 'Hand(s)', 'Finger(s)'] },
  { id: 5, part: 'Lower Extremities', subcategories: ['Hip(s)', 'Leg(s)', 'Knee(s)', 'Ankle(s)', 'Foot/Feet', 'Toe(s)'] },
  { id: 6, part: 'Body Systems', subcategories: ['Respiratory', 'Digestive', 'Nervous', 'Circulatory'] },
  { id: 7, part: 'Multiple Body Parts', subcategories: ['Multiple'] },
];

// Injury Nature Codes
export const injuryNatureCodes = [
  { id: 1, nature: 'Amputation', severity: 'high' },
  { id: 2, nature: 'Burn (Chemical)', severity: 'medium' },
  { id: 3, nature: 'Burn (Heat/Thermal)', severity: 'medium' },
  { id: 4, nature: 'Concussion', severity: 'high' },
  { id: 5, nature: 'Contusion/Bruise', severity: 'low' },
  { id: 6, nature: 'Cut/Laceration', severity: 'medium' },
  { id: 7, nature: 'Dislocation', severity: 'medium' },
  { id: 8, nature: 'Electric Shock', severity: 'high' },
  { id: 9, nature: 'Fracture', severity: 'high' },
  { id: 10, nature: 'Hearing Loss', severity: 'medium' },
  { id: 11, nature: 'Hernia', severity: 'medium' },
  { id: 12, nature: 'Inhalation Injury', severity: 'high' },
  { id: 13, nature: 'Poisoning', severity: 'high' },
  { id: 14, nature: 'Puncture', severity: 'medium' },
  { id: 15, nature: 'Sprain/Strain', severity: 'low' },
  { id: 16, nature: 'Other', severity: 'low' },
];

// Root Cause Categories (5-Why + Fishbone)
export const rootCauseCategories = [
  { 
    id: 'man',
    name: 'Man/People',
    factors: ['Lack of Training', 'Fatigue', 'Distraction', 'Poor Communication', 'Inadequate Supervision', 'Violation of Procedure']
  },
  { 
    id: 'machine',
    name: 'Machine/Equipment',
    factors: ['Equipment Failure', 'Improper Guarding', 'Inadequate Maintenance', 'Design Defect', 'Worn Components', 'Missing Safety Device']
  },
  { 
    id: 'material',
    name: 'Material',
    factors: ['Defective Material', 'Incorrect Material Used', 'Material Handling Error', 'Improper Storage', 'Contamination']
  },
  { 
    id: 'method',
    name: 'Method/Process',
    factors: ['No Procedure Exists', 'Outdated Procedure', 'Procedure Not Followed', 'Inadequate Risk Assessment', 'Poor Work Planning']
  },
  { 
    id: 'environment',
    name: 'Environment',
    factors: ['Poor Lighting', 'Extreme Temperature', 'Noise', 'Clutter/Housekeeping', 'Slippery Surface', 'Confined Space']
  },
  { 
    id: 'management',
    name: 'Management',
    factors: ['Inadequate Resources', 'Time Pressure', 'Lack of Safety Culture', 'Poor Change Management', 'Inadequate Auditing']
  },
];

// PPE Categories and Requirements
export const ppeCategories = [
  { 
    id: 'head', 
    name: 'Head Protection',
    items: ['Hard Hat (Class E)', 'Hard Hat (Class G)', 'Bump Cap', 'Welding Helmet'],
    inspectionFrequency: 'Daily',
    replacementCriteria: ['Visible damage', 'Impact event', 'UV degradation', '3+ years old']
  },
  { 
    id: 'eye', 
    name: 'Eye/Face Protection',
    items: ['Safety Glasses', 'Safety Goggles', 'Face Shield', 'Welding Goggles', 'Laser Safety Glasses'],
    inspectionFrequency: 'Daily',
    replacementCriteria: ['Scratched lenses', 'Damaged frames', 'Impact event']
  },
  { 
    id: 'hearing', 
    name: 'Hearing Protection',
    items: ['Earplugs (Disposable)', 'Earplugs (Reusable)', 'Earmuffs', 'Canal Caps'],
    inspectionFrequency: 'Before each use',
    replacementCriteria: ['Visible damage', 'Reduced NRR', 'Hygiene concerns']
  },
  { 
    id: 'respiratory', 
    name: 'Respiratory Protection',
    items: ['N95 Respirator', 'Half-Face APR', 'Full-Face APR', 'PAPR', 'SCBA'],
    inspectionFrequency: 'Before each use',
    replacementCriteria: ['Cartridge expiration', 'Fit test failure', 'Visible damage']
  },
  { 
    id: 'hand', 
    name: 'Hand Protection',
    items: ['Leather Gloves', 'Cut-Resistant Gloves', 'Chemical Gloves (Nitrile)', 'Chemical Gloves (Neoprene)', 'Welding Gloves', 'Electrical Gloves'],
    inspectionFrequency: 'Before each use',
    replacementCriteria: ['Holes/tears', 'Chemical degradation', 'Reduced dexterity']
  },
  { 
    id: 'foot', 
    name: 'Foot Protection',
    items: ['Steel Toe Boots', 'Composite Toe Boots', 'Metatarsal Guards', 'ESD Footwear', 'Chemical Boots'],
    inspectionFrequency: 'Daily',
    replacementCriteria: ['Worn soles', 'Damaged toe protection', 'Significant wear']
  },
  { 
    id: 'body', 
    name: 'Body Protection',
    items: ['High-Visibility Vest', 'Fire-Resistant Clothing', 'Chemical Suit', 'Fall Protection Harness', 'Welding Jacket'],
    inspectionFrequency: 'Before each use',
    replacementCriteria: ['Visible damage', 'Failed inspection', 'Exposure event']
  },
];

// Hazard Classifications (GHS)
export const ghsHazardClasses = [
  { class: 1, name: 'Explosives', pictogram: '💥', signalWord: 'Danger' },
  { class: 2, name: 'Flammable Gases', pictogram: '🔥', signalWord: 'Danger' },
  { class: 3, name: 'Flammable Liquids', pictogram: '🔥', signalWord: 'Danger/Warning' },
  { class: 4, name: 'Flammable Solids', pictogram: '🔥', signalWord: 'Danger/Warning' },
  { class: 5, name: 'Oxidizers', pictogram: '⭕', signalWord: 'Danger/Warning' },
  { class: 6, name: 'Toxic/Irritant', pictogram: '☠️', signalWord: 'Danger/Warning' },
  { class: 7, name: 'Corrosive', pictogram: '🧪', signalWord: 'Danger/Warning' },
  { class: 8, name: 'Environmental Hazard', pictogram: '🌍', signalWord: 'Warning' },
  { class: 9, name: 'Health Hazard', pictogram: '⚕️', signalWord: 'Danger/Warning' },
];

// Permit Types for Permit-to-Work System
export const permitTypes = [
  { 
    id: 'hot-work',
    name: 'Hot Work Permit',
    description: 'Welding, cutting, brazing, soldering, grinding',
    requiredPPE: ['eye', 'hand', 'body'],
    validityHours: 8,
    requiresFireWatch: true,
    requiredChecks: ['Fire extinguisher available', 'Combustibles removed/covered', 'Ventilation adequate', 'Gas testing completed']
  },
  { 
    id: 'confined-space',
    name: 'Confined Space Entry Permit',
    description: 'Entry into tanks, vessels, pits, silos',
    requiredPPE: ['respiratory', 'body', 'head'],
    validityHours: 8,
    requiresEntrySupervision: true,
    requiredChecks: ['Atmospheric testing', 'Isolation verified', 'Rescue plan in place', 'Attendant designated', 'Communication established']
  },
  { 
    id: 'loto',
    name: 'Lockout/Tagout Permit',
    description: 'Energy isolation for maintenance',
    requiredPPE: ['head', 'eye', 'hand'],
    validityHours: 24,
    requiredChecks: ['Energy sources identified', 'Locks applied', 'Zero energy verified', 'Try-start completed']
  },
  { 
    id: 'excavation',
    name: 'Excavation Permit',
    description: 'Digging, trenching operations',
    requiredPPE: ['head', 'foot', 'body'],
    validityHours: 24,
    requiredChecks: ['Utility locate completed', 'Shoring/sloping adequate', 'Egress provided', 'Competent person designated']
  },
  { 
    id: 'working-at-height',
    name: 'Working at Height Permit',
    description: 'Elevated work above 6 feet',
    requiredPPE: ['head', 'body'],
    validityHours: 8,
    requiredChecks: ['Fall protection inspected', 'Anchor points verified', 'Weather conditions acceptable', 'Rescue plan in place']
  },
  { 
    id: 'electrical',
    name: 'Electrical Work Permit',
    description: 'Live electrical work or work near energized systems',
    requiredPPE: ['eye', 'hand', 'body'],
    validityHours: 8,
    requiredChecks: ['Voltage verified', 'PPE rating adequate', 'Barriers established', 'Arc flash analysis reviewed']
  },
];

// Training Requirements by Role
export const trainingMatrix = [
  {
    role: 'All Employees',
    trainings: [
      { name: 'General Safety Orientation', frequency: 'Once', duration: '4 hours' },
      { name: 'Hazard Communication', frequency: 'Annual', duration: '1 hour' },
      { name: 'Emergency Action Plan', frequency: 'Annual', duration: '1 hour' },
      { name: 'Fire Extinguisher Use', frequency: 'Annual', duration: '30 min' },
    ]
  },
  {
    role: 'Maintenance Technician',
    trainings: [
      { name: 'Lockout/Tagout', frequency: 'Annual', duration: '2 hours' },
      { name: 'Machine Guarding', frequency: 'Annual', duration: '1 hour' },
      { name: 'Electrical Safety', frequency: 'Annual', duration: '2 hours' },
      { name: 'Hand & Power Tools', frequency: 'Annual', duration: '1 hour' },
    ]
  },
  {
    role: 'Warehouse Worker',
    trainings: [
      { name: 'Forklift Operator', frequency: '3 Years', duration: '8 hours' },
      { name: 'Material Handling', frequency: 'Annual', duration: '1 hour' },
      { name: 'Ladder Safety', frequency: 'Annual', duration: '30 min' },
    ]
  },
  {
    role: 'Lab Technician',
    trainings: [
      { name: 'Chemical Hygiene', frequency: 'Annual', duration: '2 hours' },
      { name: 'Fume Hood Operation', frequency: 'Annual', duration: '1 hour' },
      { name: 'Spill Response', frequency: 'Annual', duration: '1 hour' },
      { name: 'Bloodborne Pathogens', frequency: 'Annual', duration: '1 hour' },
    ]
  },
  {
    role: 'Supervisor',
    trainings: [
      { name: 'Incident Investigation', frequency: 'Annual', duration: '4 hours' },
      { name: 'Behavior-Based Safety', frequency: 'Annual', duration: '2 hours' },
      { name: 'Regulatory Compliance', frequency: 'Annual', duration: '2 hours' },
      { name: 'Emergency Response Leadership', frequency: 'Annual', duration: '2 hours' },
    ]
  },
];

// Inspection Checklists Templates
export const inspectionTemplates = [
  {
    id: 'daily-workplace',
    name: 'Daily Workplace Inspection',
    category: 'General',
    frequency: 'Daily',
    estimatedTime: '15 min',
    items: [
      { category: 'Housekeeping', checks: ['Aisles clear', 'Floors clean/dry', 'Waste disposed properly', 'Storage organized'] },
      { category: 'Emergency', checks: ['Exits unobstructed', 'Fire extinguishers accessible', 'Emergency lights functional', 'First aid kit stocked'] },
      { category: 'Equipment', checks: ['Guards in place', 'Controls functional', 'No visible damage', 'Proper labeling'] },
    ]
  },
  {
    id: 'forklift-pre-use',
    name: 'Forklift Pre-Use Inspection',
    category: 'Mobile Equipment',
    frequency: 'Before each shift',
    estimatedTime: '10 min',
    items: [
      { category: 'Visual', checks: ['No fluid leaks', 'Tires in good condition', 'Forks not bent/cracked', 'Load plate readable'] },
      { category: 'Operational', checks: ['Horn works', 'Lights work', 'Brakes work', 'Steering responsive'] },
      { category: 'Safety', checks: ['Seatbelt functional', 'Overhead guard intact', 'Fire extinguisher present', 'Backup alarm works'] },
    ]
  },
  {
    id: 'ladder-inspection',
    name: 'Ladder Safety Inspection',
    category: 'Equipment',
    frequency: 'Before each use',
    estimatedTime: '5 min',
    items: [
      { category: 'Structure', checks: ['No bent/damaged rails', 'All rungs present', 'No cracks or splits', 'Feet in good condition'] },
      { category: 'Hardware', checks: ['Spreaders lock properly', 'All rivets secure', 'No missing parts', 'Label legible'] },
      { category: 'Condition', checks: ['Clean of oil/grease', 'No corrosion', 'Proper storage location', 'Within load rating'] },
    ]
  },
  {
    id: 'fire-extinguisher',
    name: 'Fire Extinguisher Monthly Inspection',
    category: 'Fire Safety',
    frequency: 'Monthly',
    estimatedTime: '5 min per unit',
    items: [
      { category: 'Location', checks: ['Visible', 'Accessible', 'Proper mounting height', 'Signage present'] },
      { category: 'Condition', checks: ['Pressure in green zone', 'No visible damage', 'Pin and seal intact', 'Nozzle clear'] },
      { category: 'Documentation', checks: ['Inspection tag current', 'Annual service date valid', 'Type appropriate for area'] },
    ]
  },
];

// OSHA Recordkeeping Requirements
export const oshaRecordkeepingRules = {
  form300: {
    name: 'OSHA 300 Log',
    description: 'Log of Work-Related Injuries and Illnesses',
    retentionYears: 5,
    postingRequired: 'February 1 - April 30 each year',
  },
  form301: {
    name: 'OSHA 301 Form',
    description: 'Injury and Illness Incident Report',
    retentionYears: 5,
    dueDate: '7 days from incident',
  },
  form300A: {
    name: 'OSHA 300A Summary',
    description: 'Summary of Work-Related Injuries and Illnesses',
    retentionYears: 5,
    postingRequired: 'February 1 - April 30',
  },
  electronicSubmission: {
    threshold: 250,
    description: 'Establishments with 250+ employees must submit electronically',
    deadline: 'March 2 each year',
  },
};

// Industry-specific Compliance Programs
export const compliancePrograms = [
  { 
    id: 'psp',
    name: 'Process Safety Management (PSM)',
    regulation: '29 CFR 1910.119',
    applicableTo: 'Facilities with highly hazardous chemicals above threshold quantities',
    elements: [
      'Employee Participation', 'Process Safety Information', 'Process Hazard Analysis',
      'Operating Procedures', 'Training', 'Contractors', 'Pre-Startup Safety Review',
      'Mechanical Integrity', 'Hot Work Permit', 'Management of Change',
      'Incident Investigation', 'Emergency Planning', 'Compliance Audits', 'Trade Secrets'
    ]
  },
  { 
    id: 'rmp',
    name: 'Risk Management Program (RMP)',
    regulation: '40 CFR 68',
    applicableTo: 'Facilities with regulated substances above threshold quantities',
    elements: [
      'Hazard Assessment', 'Prevention Program', 'Emergency Response Program',
      '5-Year Accident History', 'Offsite Consequence Analysis'
    ]
  },
  { 
    id: 'vpp',
    name: 'Voluntary Protection Program (VPP)',
    regulation: 'OSHA Directive',
    applicableTo: 'Voluntary program for exemplary safety programs',
    elements: [
      'Management Leadership', 'Employee Involvement', 'Worksite Analysis',
      'Hazard Prevention and Control', 'Safety and Health Training'
    ]
  },
];

// ============================================
// ORIGINAL KPI DATA (preserved)
// ============================================

export const kpiData = [
  {
    id: '1',
    label: 'Total Incidents',
    value: '12',
    change: '-2',
    trend: 'down',
    period: 'vs last month'
  },
  {
    id: '2',
    label: 'Inspections Done',
    value: '45',
    change: '+8',
    trend: 'up',
    period: 'vs last month'
  },
  {
    id: '3',
    label: 'Open Issues',
    value: '5',
    change: '-3',
    trend: 'down',
    period: 'vs last week'
  },
  {
    id: '4',
    label: 'Safety Score',
    value: '94%',
    change: '+2%',
    trend: 'up',
    period: 'vs last month'
  }
];

// Extended KPI metrics for unified Safety Hub
export const extendedKpiData = [
  {
    id: 'mttr',
    label: 'Mean Time to Resolve',
    value: '2.4',
    unit: 'days',
    change: '-0.6',
    trend: 'down',
    period: 'vs last month',
    description: 'Average time to resolve incidents'
  },
  {
    id: 'near-misses',
    label: 'Near Misses',
    value: '8',
    change: '+3',
    trend: 'up',
    period: 'vs last month',
    description: 'Proactive reporting indicator'
  },
  {
    id: 'compliance-rate',
    label: 'Compliance Rate',
    value: '96.5%',
    change: '+1.2%',
    trend: 'up',
    period: 'vs last month',
    description: 'Overall regulatory compliance'
  },
  {
    id: 'training-completion',
    label: 'Training Completion',
    value: '89%',
    change: '+5%',
    trend: 'up',
    period: 'vs last month',
    description: 'Employee training status'
  },
  {
    id: 'audit-score',
    label: 'Audit Score',
    value: '4.2',
    unit: '/5',
    change: '+0.3',
    trend: 'up',
    period: 'vs last quarter',
    description: 'Average internal audit rating'
  },
  {
    id: 'days-safe',
    label: 'Days Without LTI',
    value: '42',
    change: '+42',
    trend: 'up',
    period: 'consecutive',
    description: 'Lost Time Injury free days'
  },
  {
    id: 'trir',
    label: 'TRIR',
    value: '0.85',
    change: '-0.15',
    trend: 'down',
    period: 'vs last year',
    description: 'Total Recordable Incident Rate'
  },
  {
    id: 'capa-closure',
    label: 'CAPA Closure Rate',
    value: '92%',
    change: '+4%',
    trend: 'up',
    period: 'vs last month',
    description: 'Corrective action completion'
  },
  {
    id: 'dart',
    label: 'DART Rate',
    value: '0.52',
    change: '-0.08',
    trend: 'down',
    period: 'vs last year',
    description: 'Days Away, Restricted, or Transfer Rate'
  },
  {
    id: 'ltir',
    label: 'LTIR',
    value: '0.31',
    change: '-0.05',
    trend: 'down',
    period: 'vs last year',
    description: 'Lost Time Incident Rate'
  },
  {
    id: 'emr',
    label: 'EMR',
    value: '0.87',
    change: '-0.08',
    trend: 'down',
    period: 'vs last year',
    description: 'Experience Modification Rate'
  },
  {
    id: 'ppe-compliance',
    label: 'PPE Compliance',
    value: '97%',
    change: '+2%',
    trend: 'up',
    period: 'vs last month',
    description: 'Personal protective equipment compliance'
  }
];
