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
  }
];

// Safety Score trend data
export const safetyScoreTrend = [
  { month: 'Jul', score: 87 },
  { month: 'Aug', score: 89 },
  { month: 'Sep', score: 88 },
  { month: 'Oct', score: 91 },
  { month: 'Nov', score: 93 },
  { month: 'Dec', score: 94 },
];

// Gemini AI insights mock data
export const geminiInsights = [
  {
    id: '1',
    type: 'prediction',
    title: 'Elevated Risk: Warehouse Zone A',
    description: 'Based on incident patterns and sensor data, 23% increased risk of slip/trip hazards predicted for next 2 weeks.',
    confidence: 87,
    action: 'Schedule additional housekeeping inspections',
    timestamp: '2026-01-06T23:45:00Z'
  },
  {
    id: '2',
    type: 'trend',
    title: 'PPE Compliance Improving',
    description: 'Eye protection compliance has increased 15% over the past month following awareness campaign.',
    confidence: 94,
    action: 'Recognize top-performing teams',
    timestamp: '2026-01-06T22:30:00Z'
  },
  {
    id: '3',
    type: 'anomaly',
    title: 'Unusual Gas Sensor Pattern',
    description: 'Tank Farm sensors showing irregular readings between 2-4 AM. Pattern suggests ventilation system issue.',
    confidence: 78,
    action: 'Investigate HVAC system in Tank Farm',
    timestamp: '2026-01-06T21:15:00Z'
  },
  {
    id: '4',
    type: 'recommendation',
    title: 'Training Gap Identified',
    description: 'New hires in Manufacturing dept showing 40% higher incident rate. Recommend enhanced onboarding.',
    confidence: 91,
    action: 'Revise onboarding safety program',
    timestamp: '2026-01-06T20:00:00Z'
  }
];

// Power BI dashboard modules
export const powerBIDashboards = [
  {
    id: 'safety-overview',
    name: 'Safety Performance Overview',
    description: 'Comprehensive KPIs, trends, and departmental comparisons',
    lastUpdated: '2026-01-06T23:00:00Z',
    embedUrl: 'https://app.powerbi.com/view?r=safety-overview'
  },
  {
    id: 'incident-analytics',
    name: 'Incident Analytics',
    description: 'Detailed incident analysis with root cause breakdown',
    lastUpdated: '2026-01-06T22:00:00Z',
    embedUrl: 'https://app.powerbi.com/view?r=incident-analytics'
  },
  {
    id: 'compliance-tracker',
    name: 'Compliance Tracker',
    description: 'Regulatory compliance status and audit results',
    lastUpdated: '2026-01-06T21:00:00Z',
    embedUrl: 'https://app.powerbi.com/view?r=compliance-tracker'
  }
];

export const incidentsByMonth = [
  { name: 'Jan', incidents: 4 },
  { name: 'Feb', incidents: 3 },
  { name: 'Mar', incidents: 2 },
  { name: 'Apr', incidents: 5 },
  { name: 'May', incidents: 1 },
  { name: 'Jun', incidents: 2 },
];

export const incidentsByCategory = [
  { name: 'Slip/Trip', value: 35, color: '#ef4444' },
  { name: 'Electrical', value: 20, color: '#f59e0b' },
  { name: 'PPE', value: 25, color: '#3b82f6' },
  { name: 'Chemical', value: 10, color: '#10b981' },
  { name: 'Other', value: 10, color: '#6b7280' },
];

export const inspectionCompletionData = [
  { day: 'Mon', completed: 8 },
  { day: 'Tue', completed: 12 },
  { day: 'Wed', completed: 10 },
  { day: 'Thu', completed: 15 },
  { day: 'Fri', completed: 9 },
  { day: 'Sat', completed: 4 },
  { day: 'Sun', completed: 2 },
];

// Quality Metrics Data
export const qualityMetrics = {
  overallScore: 94,
  previousScore: 91,
  trend: 'up',
  categories: [
    { name: 'Process Compliance', score: 96, weight: 25, color: '#10b981' },
    { name: 'Documentation', score: 92, weight: 20, color: '#3b82f6' },
    { name: 'Safety Standards', score: 98, weight: 30, color: '#14b8a6' },
    { name: 'Training Completion', score: 89, weight: 15, color: '#f59e0b' },
    { name: 'Audit Results', score: 91, weight: 10, color: '#8b5cf6' },
  ],
  monthlyTrend: [
    { month: 'Aug', score: 88 },
    { month: 'Sep', score: 90 },
    { month: 'Oct', score: 89 },
    { month: 'Nov', score: 92 },
    { month: 'Dec', score: 91 },
    { month: 'Jan', score: 94 },
  ],
};

// Recent Quality Events
export const qualityEvents = [
  {
    id: '1',
    type: 'improvement',
    title: 'Zero Defects Achieved',
    description: 'Production Line A achieved 30 consecutive days without quality defects',
    timestamp: '2026-01-08T14:30:00Z',
    impact: 'positive',
  },
  {
    id: '2',
    type: 'alert',
    title: 'Documentation Review Due',
    description: 'Q1 procedure documentation review deadline in 5 days',
    timestamp: '2026-01-08T10:15:00Z',
    impact: 'neutral',
  },
  {
    id: '3',
    type: 'achievement',
    title: 'ISO Audit Passed',
    description: 'Successfully passed ISO 9001:2015 surveillance audit with zero non-conformances',
    timestamp: '2026-01-07T16:00:00Z',
    impact: 'positive',
  },
  {
    id: '4',
    type: 'action',
    title: 'CAPA Closed',
    description: 'Corrective action #CA-2024-089 verified and closed',
    timestamp: '2026-01-07T09:45:00Z',
    impact: 'positive',
  },
];

// Compliance Summary
export const complianceSummary = {
  totalRequirements: 156,
  compliant: 148,
  inProgress: 5,
  overdue: 3,
  rate: 94.9,
  byCategory: [
    { category: 'OSHA', total: 45, compliant: 44, rate: 97.8 },
    { category: 'EPA', total: 32, compliant: 30, rate: 93.8 },
    { category: 'ISO 45001', total: 38, compliant: 36, rate: 94.7 },
    { category: 'ISO 14001', total: 25, compliant: 24, rate: 96.0 },
    { category: 'Internal', total: 16, compliant: 14, rate: 87.5 },
  ],
};

// Performance Benchmarks
export const performanceBenchmarks = [
  { metric: 'TRIR', current: 0.85, industryAvg: 1.2, target: 0.8, unit: '' },
  { metric: 'LTIR', current: 0.12, industryAvg: 0.25, target: 0.10, unit: '' },
  { metric: 'Near Miss Rate', current: 8.5, industryAvg: 5.2, target: 10.0, unit: '/100 workers' },
  { metric: 'Training Hours', current: 24, industryAvg: 16, target: 20, unit: 'hrs/employee' },
  { metric: 'Audit Score', current: 94, industryAvg: 85, target: 90, unit: '%' },
];

// Department Comparison Data
export const departmentComparison = [
  {
    id: 'operations',
    name: 'Operations',
    color: '#14b8a6',
    employees: 142,
    metrics: {
      safetyScore: 96,
      incidents: 2,
      nearMisses: 12,
      trainingCompletion: 94,
      complianceRate: 98,
      openActions: 3,
    },
    trend: { safetyScore: 2, incidents: -1, trainingCompletion: 3 },
    monthlyIncidents: [
      { month: 'Sep', count: 1 },
      { month: 'Oct', count: 2 },
      { month: 'Nov', count: 0 },
      { month: 'Dec', count: 1 },
      { month: 'Jan', count: 0 },
    ],
  },
  {
    id: 'maintenance',
    name: 'Maintenance',
    color: '#3b82f6',
    employees: 68,
    metrics: {
      safetyScore: 91,
      incidents: 4,
      nearMisses: 18,
      trainingCompletion: 88,
      complianceRate: 94,
      openActions: 7,
    },
    trend: { safetyScore: -1, incidents: 1, trainingCompletion: 2 },
    monthlyIncidents: [
      { month: 'Sep', count: 1 },
      { month: 'Oct', count: 1 },
      { month: 'Nov', count: 2 },
      { month: 'Dec', count: 0 },
      { month: 'Jan', count: 2 },
    ],
  },
  {
    id: 'warehouse',
    name: 'Warehouse',
    color: '#f59e0b',
    employees: 95,
    metrics: {
      safetyScore: 89,
      incidents: 5,
      nearMisses: 22,
      trainingCompletion: 82,
      complianceRate: 91,
      openActions: 9,
    },
    trend: { safetyScore: 3, incidents: -2, trainingCompletion: 5 },
    monthlyIncidents: [
      { month: 'Sep', count: 2 },
      { month: 'Oct', count: 2 },
      { month: 'Nov', count: 1 },
      { month: 'Dec', count: 1 },
      { month: 'Jan', count: 1 },
    ],
  },
  {
    id: 'laboratory',
    name: 'Laboratory',
    color: '#8b5cf6',
    employees: 34,
    metrics: {
      safetyScore: 98,
      incidents: 0,
      nearMisses: 6,
      trainingCompletion: 100,
      complianceRate: 99,
      openActions: 1,
    },
    trend: { safetyScore: 1, incidents: 0, trainingCompletion: 0 },
    monthlyIncidents: [
      { month: 'Sep', count: 0 },
      { month: 'Oct', count: 0 },
      { month: 'Nov', count: 0 },
      { month: 'Dec', count: 0 },
      { month: 'Jan', count: 0 },
    ],
  },
  {
    id: 'administration',
    name: 'Administration',
    color: '#10b981',
    employees: 45,
    metrics: {
      safetyScore: 95,
      incidents: 1,
      nearMisses: 3,
      trainingCompletion: 96,
      complianceRate: 97,
      openActions: 2,
    },
    trend: { safetyScore: 0, incidents: -1, trainingCompletion: 1 },
    monthlyIncidents: [
      { month: 'Sep', count: 0 },
      { month: 'Oct', count: 1 },
      { month: 'Nov', count: 0 },
      { month: 'Dec', count: 0 },
      { month: 'Jan', count: 0 },
    ],
  },
  {
    id: 'field_services',
    name: 'Field Services',
    color: '#ef4444',
    employees: 78,
    metrics: {
      safetyScore: 87,
      incidents: 6,
      nearMisses: 28,
      trainingCompletion: 79,
      complianceRate: 88,
      openActions: 12,
    },
    trend: { safetyScore: 4, incidents: -3, trainingCompletion: 8 },
    monthlyIncidents: [
      { month: 'Sep', count: 3 },
      { month: 'Oct', count: 2 },
      { month: 'Nov', count: 1 },
      { month: 'Dec', count: 2 },
      { month: 'Jan', count: 1 },
    ],
  },
];
