export interface Asset {
  id: string;
  name: string;
  type: 'Machine' | 'Vehicle' | 'Tool' | 'Safety Equipment' | 'Infrastructure';
  location: string;
  lastInspection: string;
  nextInspection: string;
  status: 'Operational' | 'Maintenance Required' | 'Out of Service' | 'Inspection Overdue';
  serialNumber: string;
  manufacturer: string;
  manualUrl: string;
  safetyGuidelines: string[];
  sdsUrl?: string;
  ncrHistory?: Array<{ id: string; date: string; issue: string; status: 'Open' | 'Resolved' }>;
  complianceSync: {
    osha: 'Compliant' | 'Non-Compliant' | 'N/A';
    iso: 'Certified' | 'Pending' | 'N/A';
    epa: 'Active' | 'Inactive' | 'N/A';
    niosh: 'Aligned' | 'Review Required' | 'N/A';
  };
}

export const mockAssets: Asset[] = [
  {
    id: 'ASSET-001',
    name: 'Forklift - Toyota 8FGCU25',
    type: 'Vehicle',
    location: 'Warehouse A',
    lastInspection: '2026-01-15',
    nextInspection: '2026-02-15',
    status: 'Operational',
    serialNumber: 'TY-89234-X',
    manufacturer: 'Toyota Material Handling',
    manualUrl: 'https://manuals.toyota.com/8fgcu25',
    sdsUrl: '/assets/sds/forklift-battery.pdf',
    ncrHistory: [
      { id: 'NCR-2025-012', date: '2025-11-05', issue: 'Hydraulic leak detected', status: 'Resolved' }
    ],
    safetyGuidelines: [
      'Always wear seatbelt',
      'Do not exceed load capacity',
      'Keep forks low when traveling',
      'Sound horn at intersections'
    ],
    complianceSync: {
      osha: 'Compliant',
      iso: 'Certified',
      epa: 'N/A',
      niosh: 'Aligned'
    }
  },
  {
    id: 'ASSET-002',
    name: 'CNC Milling Machine - Haas VF-2',
    type: 'Machine',
    location: 'Production Line 1',
    lastInspection: '2026-01-10',
    nextInspection: '2026-04-10',
    status: 'Operational',
    serialNumber: 'HS-VF2-5567',
    manufacturer: 'Haas Automation',
    manualUrl: 'https://haascnc.com/manuals/vf2',
    sdsUrl: '/assets/sds/coolant-haas.pdf',
    ncrHistory: [
      { id: 'NCR-2025-045', date: '2025-12-15', issue: 'Safety guard sensor failure', status: 'Resolved' }
    ],
    safetyGuidelines: [
      'Ensure safety guards are closed',
      'Wear eye protection',
      'Clear chips only when stopped',
      'Check coolant levels daily'
    ],
    complianceSync: {
      osha: 'Compliant',
      iso: 'Certified',
      epa: 'Active',
      niosh: 'Aligned'
    }
  },
  {
    id: 'ASSET-003',
    name: 'Overhead Crane - 10 Ton',
    type: 'Infrastructure',
    location: 'Loading Dock',
    lastInspection: '2025-12-20',
    nextInspection: '2026-01-20',
    status: 'Inspection Overdue',
    serialNumber: 'CR-10T-998',
    manufacturer: 'Konecranes',
    manualUrl: 'https://konecranes.com/manuals/10t',
    ncrHistory: [
      { id: 'NCR-2026-001', date: '2026-01-21', issue: 'Inspection overdue', status: 'Open' }
    ],
    safetyGuidelines: [
      'Daily pre-use inspection required',
      'Never stand under suspended load',
      'Use designated hand signals',
      'Check wire rope for wear'
    ],
    complianceSync: {
      osha: 'Non-Compliant',
      iso: 'Pending',
      epa: 'N/A',
      niosh: 'Review Required'
    }
  },
  {
    id: 'ASSET-004',
    name: 'Chemical Storage Tank - T102',
    type: 'Infrastructure',
    location: 'Chemical Storage',
    lastInspection: '2026-01-05',
    nextInspection: '2026-07-05',
    status: 'Maintenance Required',
    serialNumber: 'TK-T102-ABC',
    manufacturer: 'TankCorp',
    manualUrl: 'https://tankcorp.com/manuals/t102',
    sdsUrl: '/assets/sds/sulfuric-acid.pdf',
    ncrHistory: [
      { id: 'NCR-2025-088', date: '2025-10-10', issue: 'Secondary containment crack', status: 'Resolved' }
    ],
    safetyGuidelines: [
      'Full chemical suit required for sampling',
      'Ensure ventilation is active',
      'Check pressure relief valve daily',
      'Maintain spill kit nearby'
    ],
    complianceSync: {
      osha: 'Compliant',
      iso: 'Certified',
      epa: 'Active',
      niosh: 'Aligned'
    }
  }
];
