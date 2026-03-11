export interface SafetyKPI {
  label: string;
  value: number;
  trend: 'up' | 'down' | 'stable';
  description: string;
}

export interface EmissionData {
  month: string;
  actual: number;
  limit: number;
}

export interface DetailedEmission {
  id: string;
  type: string;
  unit: string;
  actual: number;
  limit: number;
  status: 'Compliant' | 'Warning' | 'Exceeded';
  trend: 'up' | 'down' | 'stable';
}

export interface EmissionLog {
  id: string;
  date: string;
  facility: string;
  type: string;
  value: number;
  unit: string;
  recordedBy: string;
}

export const DETAILED_EMISSIONS: DetailedEmission[] = [
  { id: 'co2', type: 'Carbon Dioxide (CO2)', unit: 'tons', actual: 450, limit: 500, status: 'Compliant', trend: 'down' },
  { id: 'nox', type: 'Nitrogen Oxides (NOx)', unit: 'kg', actual: 85, limit: 100, status: 'Compliant', trend: 'stable' },
  { id: 'sox', type: 'Sulfur Oxides (SOx)', unit: 'kg', actual: 92, limit: 80, status: 'Exceeded', trend: 'up' },
  { id: 'voc', type: 'Volatile Organic Compounds', unit: 'kg', actual: 120, limit: 150, status: 'Compliant', trend: 'down' },
  { id: 'pm', type: 'Particulate Matter (PM2.5)', unit: 'kg', actual: 38, limit: 40, status: 'Warning', trend: 'up' }
];

export const EMISSION_LOGS: EmissionLog[] = [
  { id: 'LOG-001', date: '2026-01-04', facility: 'Main Plant', type: 'CO2', value: 12.5, unit: 'tons', recordedBy: 'John Doe' },
  { id: 'LOG-002', date: '2026-01-03', facility: 'Warehouse B', type: 'NOx', value: 2.1, unit: 'kg', recordedBy: 'Jane Smith' },
  { id: 'LOG-003', date: '2026-01-02', facility: 'Main Plant', type: 'SOx', value: 5.4, unit: 'kg', recordedBy: 'Mike Ross' },
  { id: 'LOG-004', date: '2026-01-01', facility: 'Logistics Hub', type: 'VOC', value: 8.2, unit: 'kg', recordedBy: 'Sarah Connor' },
  { id: 'LOG-005', date: '2025-12-31', facility: 'Main Plant', type: 'PM2.5', value: 1.2, unit: 'kg', recordedBy: 'John Doe' }
];

export const FACILITY_EMISSIONS = [
  { name: 'Main Plant', value: 65 },
  { name: 'Warehouse B', value: 15 },
  { name: 'Logistics Hub', value: 12 },
  { name: 'R&D Center', value: 8 }
];

export interface CAPA {
  id: string;
  title: string;
  status: 'Open' | 'In Progress' | 'Closed';
  priority: 'Low' | 'Medium' | 'High';
  dueDate: string;
}

export interface StandardReference {
  id: string;
  name: string;
  description: string;
  link: string;
}

export const SAFETY_KPIS: SafetyKPI[] = [
  { label: 'TRIR', value: 1.2, trend: 'down', description: 'Total Recordable Incident Rate' },
  { label: 'LTIR', value: 0.4, trend: 'stable', description: 'Lost Time Incident Rate' },
  { label: 'ASR', value: 15.5, trend: 'down', description: 'Average Severity Rate' },
  { label: 'AFR', value: 2.1, trend: 'up', description: 'Accident Frequency Rate' },
  { label: 'Time Loss', value: 42, trend: 'down', description: 'Total Hours Lost (MTD)' }
];

export const EMISSIONS_DATA: EmissionData[] = [
  { month: 'Jan', actual: 45, limit: 60 },
  { month: 'Feb', actual: 52, limit: 60 },
  { month: 'Mar', actual: 48, limit: 60 },
  { month: 'Apr', actual: 65, limit: 60 },
  { month: 'May', actual: 58, limit: 60 },
  { month: 'Jun', actual: 55, limit: 60 }
];

export const CAPA_LIST: CAPA[] = [
  { id: 'CAPA-001', title: 'Machine Guarding Upgrade', status: 'In Progress', priority: 'High', dueDate: '2026-02-15' },
  { id: 'CAPA-002', title: 'Chemical Storage Ventilation', status: 'Open', priority: 'Medium', dueDate: '2026-03-01' },
  { id: 'CAPA-003', title: 'PPE Training Refresh', status: 'Closed', priority: 'Low', dueDate: '2025-12-20' },
  { id: 'CAPA-004', title: 'Spill Kit Relocation', status: 'Open', priority: 'High', dueDate: '2026-01-20' }
];

export const STANDARDS_REFERENCES: StandardReference[] = [
  { id: 'iso-14001', name: 'ISO 14001', description: 'Environmental Management Systems', link: '#' },
  { id: 'osha-const', name: 'OSHA Construction', description: '29 CFR 1926 Standards', link: '#' },
  { id: 'osha-gen', name: 'OSHA General Industry', description: '29 CFR 1910 Standards', link: '#' },
  { id: 'epa', name: 'EPA', description: 'Environmental Protection Agency Regulations', link: '#' },
  { id: 'tceq', name: 'TCEQ', description: 'Texas Commission on Environmental Quality', link: '#' }
];
