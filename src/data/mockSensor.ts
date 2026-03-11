// Mock Sensor Data with Alert History and Zone Information

export interface SensorAlert {
  id: string;
  sensorId: string;
  type: 'warning' | 'critical' | 'info' | 'resolved';
  message: string;
  value: number;
  threshold: number;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
}

export interface IoTSensor {
  id: string;
  name: string;
  type: 'temperature' | 'gas' | 'humidity' | 'noise' | 'flame' | 'motion';
  location: string;
  zone: 'welding-bay' | 'tank-farm' | 'storage' | 'assembly-line' | 'control-room' | 'pipeline';
  value: number;
  unit: string;
  minThreshold: number;
  maxThreshold: number;
  status: 'normal' | 'warning' | 'critical';
  lastUpdate: string;
  x: number;
  y: number;
}

export const facilityZones = [
  { id: 'all', name: 'All Zones', color: 'bg-surface-600' },
  { id: 'welding-bay', name: 'Welding Bay', color: 'bg-blue-600' },
  { id: 'tank-farm', name: 'Tank Farm', color: 'bg-orange-600' },
  { id: 'storage', name: 'Storage', color: 'bg-purple-600' },
  { id: 'assembly-line', name: 'Assembly Line', color: 'bg-green-600' },
  { id: 'control-room', name: 'Control Room', color: 'bg-cyan-600' },
  { id: 'pipeline', name: 'Pipeline Zone', color: 'bg-red-600' },
];

export const mockSensors: IoTSensor[] = [
  { 
    id: 'S001', 
    name: 'Temperature Sensor A1', 
    type: 'temperature', 
    location: 'Welding Bay 1', 
    zone: 'welding-bay',
    value: 28, 
    unit: '°C', 
    minThreshold: 15,
    maxThreshold: 45,
    status: 'normal', 
    lastUpdate: '2s ago', 
    x: 15, 
    y: 20 
  },
  { 
    id: 'S002', 
    name: 'Gas Detector B2', 
    type: 'gas', 
    location: 'Tank Farm', 
    zone: 'tank-farm',
    value: 12, 
    unit: 'ppm', 
    minThreshold: 0,
    maxThreshold: 25,
    status: 'normal', 
    lastUpdate: '5s ago', 
    x: 45, 
    y: 35 
  },
  { 
    id: 'S003', 
    name: 'Humidity Monitor C1', 
    type: 'humidity', 
    location: 'Storage Area', 
    zone: 'storage',
    value: 65, 
    unit: '%', 
    minThreshold: 30,
    maxThreshold: 70,
    status: 'normal', 
    lastUpdate: '3s ago', 
    x: 70, 
    y: 25 
  },
  { 
    id: 'S004', 
    name: 'Noise Level D1', 
    type: 'noise', 
    location: 'Assembly Line', 
    zone: 'assembly-line',
    value: 85, 
    unit: 'dB', 
    minThreshold: 0,
    maxThreshold: 85,
    status: 'warning', 
    lastUpdate: '1s ago', 
    x: 25, 
    y: 55 
  },
  { 
    id: 'S005', 
    name: 'Flame Detector E1', 
    type: 'flame', 
    location: 'Welding Bay 2', 
    zone: 'welding-bay',
    value: 0, 
    unit: '', 
    minThreshold: 0,
    maxThreshold: 1,
    status: 'normal', 
    lastUpdate: '4s ago', 
    x: 55, 
    y: 15 
  },
  { 
    id: 'S006', 
    name: 'Motion Sensor F1', 
    type: 'motion', 
    location: 'Confined Space Entry', 
    zone: 'storage',
    value: 1, 
    unit: '', 
    minThreshold: 0,
    maxThreshold: 1,
    status: 'normal', 
    lastUpdate: '2s ago', 
    x: 80, 
    y: 60 
  },
  { 
    id: 'S007', 
    name: 'Gas Detector G1', 
    type: 'gas', 
    location: 'Pipeline Zone', 
    zone: 'pipeline',
    value: 45, 
    unit: 'ppm', 
    minThreshold: 0,
    maxThreshold: 25,
    status: 'critical', 
    lastUpdate: '1s ago', 
    x: 35, 
    y: 70 
  },
  { 
    id: 'S008', 
    name: 'Temperature Sensor H1', 
    type: 'temperature', 
    location: 'Control Room', 
    zone: 'control-room',
    value: 22, 
    unit: '°C', 
    minThreshold: 18,
    maxThreshold: 28,
    status: 'normal', 
    lastUpdate: '6s ago', 
    x: 60, 
    y: 45 
  },
];

// Generate mock alert history
export const mockAlerts: SensorAlert[] = [
  {
    id: 'ALT-001',
    sensorId: 'S007',
    type: 'critical',
    message: 'Gas level exceeded critical threshold',
    value: 45,
    threshold: 25,
    timestamp: '2026-01-05T22:15:00Z',
    acknowledged: false,
  },
  {
    id: 'ALT-002',
    sensorId: 'S004',
    type: 'warning',
    message: 'Noise level approaching limit',
    value: 85,
    threshold: 85,
    timestamp: '2026-01-05T22:10:00Z',
    acknowledged: true,
    acknowledgedBy: 'John Smith',
  },
  {
    id: 'ALT-003',
    sensorId: 'S002',
    type: 'resolved',
    message: 'Gas levels returned to normal',
    value: 12,
    threshold: 25,
    timestamp: '2026-01-05T21:45:00Z',
    acknowledged: true,
    acknowledgedBy: 'Safety Team',
  },
  {
    id: 'ALT-004',
    sensorId: 'S001',
    type: 'warning',
    message: 'Temperature spike detected',
    value: 42,
    threshold: 45,
    timestamp: '2026-01-05T20:30:00Z',
    acknowledged: true,
    acknowledgedBy: 'Mike Johnson',
  },
  {
    id: 'ALT-005',
    sensorId: 'S007',
    type: 'critical',
    message: 'H2S gas detected above safe limits',
    value: 38,
    threshold: 25,
    timestamp: '2026-01-05T19:15:00Z',
    acknowledged: true,
    acknowledgedBy: 'Emergency Response',
  },
  {
    id: 'ALT-006',
    sensorId: 'S003',
    type: 'info',
    message: 'Humidity sensor calibrated',
    value: 65,
    threshold: 70,
    timestamp: '2026-01-05T18:00:00Z',
    acknowledged: true,
    acknowledgedBy: 'System',
  },
  {
    id: 'ALT-007',
    sensorId: 'S005',
    type: 'critical',
    message: 'Flame detected in welding bay',
    value: 1,
    threshold: 1,
    timestamp: '2026-01-05T14:22:00Z',
    acknowledged: true,
    acknowledgedBy: 'Fire Response Team',
  },
  {
    id: 'ALT-008',
    sensorId: 'S008',
    type: 'warning',
    message: 'Control room temperature rising',
    value: 26,
    threshold: 28,
    timestamp: '2026-01-05T12:00:00Z',
    acknowledged: true,
    acknowledgedBy: 'Facilities',
  },
];

// Real-time simulation helper
export const generateSensorUpdate = (sensor: IoTSensor): IoTSensor => {
  const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
  let newValue = sensor.value * (1 + variation);
  
  // Clamp values based on sensor type
  if (sensor.type === 'temperature') {
    newValue = Math.max(15, Math.min(50, newValue));
  } else if (sensor.type === 'gas') {
    newValue = Math.max(0, Math.min(100, newValue));
  } else if (sensor.type === 'humidity') {
    newValue = Math.max(20, Math.min(90, newValue));
  } else if (sensor.type === 'noise') {
    newValue = Math.max(40, Math.min(110, newValue));
  } else if (sensor.type === 'flame' || sensor.type === 'motion') {
    newValue = Math.random() > 0.98 ? 1 : 0;
  }

  // Determine status based on thresholds
  let status: 'normal' | 'warning' | 'critical' = 'normal';
  if (sensor.type !== 'flame' && sensor.type !== 'motion') {
    const upperWarning = sensor.maxThreshold * 0.85;
    if (newValue >= sensor.maxThreshold) {
      status = 'critical';
    } else if (newValue >= upperWarning) {
      status = 'warning';
    }
  } else if (sensor.type === 'flame' && newValue === 1) {
    status = 'critical';
  }

  return {
    ...sensor,
    value: Math.round(newValue * 10) / 10,
    status,
    lastUpdate: 'Just now',
  };
};

// Get alerts for a specific sensor
export const getAlertsForSensor = (sensorId: string): SensorAlert[] => {
  return mockAlerts.filter(alert => alert.sensorId === sensorId);
};

// Get all unacknowledged alerts
export const getUnacknowledgedAlerts = (): SensorAlert[] => {
  return mockAlerts.filter(alert => !alert.acknowledged);
};

// Format timestamp for display
export const formatAlertTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};

// Sensor Threshold Configuration
export interface SensorThresholdConfig {
  sensorType: IoTSensor['type'];
  defaultMin: number;
  defaultMax: number;
  warningPercent: number; // Percentage of max threshold to trigger warning
  unit: string;
  description: string;
  regulatoryReference?: string;
}

export const sensorThresholdDefaults: SensorThresholdConfig[] = [
  {
    sensorType: 'temperature',
    defaultMin: 15,
    defaultMax: 45,
    warningPercent: 85,
    unit: '°C',
    description: 'Ambient temperature monitoring',
    regulatoryReference: 'OSHA 29 CFR 1910.95'
  },
  {
    sensorType: 'gas',
    defaultMin: 0,
    defaultMax: 25,
    warningPercent: 80,
    unit: 'ppm',
    description: 'Toxic/combustible gas detection',
    regulatoryReference: 'OSHA 29 CFR 1910.146'
  },
  {
    sensorType: 'humidity',
    defaultMin: 30,
    defaultMax: 70,
    warningPercent: 90,
    unit: '%',
    description: 'Relative humidity monitoring',
    regulatoryReference: 'ASHRAE Standard 55'
  },
  {
    sensorType: 'noise',
    defaultMin: 0,
    defaultMax: 85,
    warningPercent: 95,
    unit: 'dB',
    description: 'Noise level monitoring',
    regulatoryReference: 'OSHA 29 CFR 1910.95 (85dB TWA)'
  },
  {
    sensorType: 'flame',
    defaultMin: 0,
    defaultMax: 1,
    warningPercent: 100,
    unit: '',
    description: 'Flame/fire detection (binary)',
    regulatoryReference: 'NFPA 72'
  },
  {
    sensorType: 'motion',
    defaultMin: 0,
    defaultMax: 1,
    warningPercent: 100,
    unit: '',
    description: 'Motion/occupancy detection (binary)',
    regulatoryReference: ''
  },
];

// Custom threshold overrides per sensor
export interface SensorThresholdOverride {
  sensorId: string;
  minThreshold: number;
  maxThreshold: number;
  warningPercent: number;
  notes?: string;
  updatedBy?: string;
  updatedAt?: string;
}

// Get threshold config for a sensor type
export const getThresholdConfig = (sensorType: IoTSensor['type']): SensorThresholdConfig | undefined => {
  return sensorThresholdDefaults.find(t => t.sensorType === sensorType);
};

// Update sensor thresholds
export const updateSensorThresholds = (
  sensor: IoTSensor,
  newMin: number,
  newMax: number
): IoTSensor => {
  return {
    ...sensor,
    minThreshold: newMin,
    maxThreshold: newMax,
  };
};

// ========================================
// SENSOR CALIBRATION TRACKING
// ========================================

export type CalibrationStatus = 'current' | 'due_soon' | 'overdue' | 'in_progress';
export type CalibrationResult = 'pass' | 'fail' | 'adjusted' | 'replaced';

export interface CalibrationRecord {
  id: string;
  sensorId: string;
  calibrationType: 'routine' | 'post-repair' | 'initial' | 'verification' | 'adjustment';
  calibrationDate: string;
  nextDueDate: string;
  performedBy: string;
  result: CalibrationResult;
  beforeReading: number;
  afterReading: number;
  referenceStandard: string;
  referenceValue: number;
  deviation: number;
  deviationPercent: number;
  tolerancePercent: number;
  notes?: string;
  certificateNumber?: string;
  equipmentUsed: string[];
  attachments?: string[];
  createdAt: string;
}

export interface SensorCalibrationSchedule {
  sensorId: string;
  sensorName: string;
  sensorType: IoTSensor['type'];
  location: string;
  calibrationInterval: number; // days
  lastCalibrationDate: string;
  nextCalibrationDate: string;
  status: CalibrationStatus;
  assignedTechnician?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  accuracySpec?: string;
}

export const calibrationIntervalDefaults: Record<IoTSensor['type'], number> = {
  temperature: 180, // 6 months
  gas: 90, // 3 months - more critical
  humidity: 365, // 1 year
  noise: 365, // 1 year
  flame: 90, // 3 months - safety critical
  motion: 365, // 1 year
};

export const mockCalibrationRecords: CalibrationRecord[] = [
  {
    id: 'CAL-001',
    sensorId: 'S001',
    calibrationType: 'routine',
    calibrationDate: '2025-12-15',
    nextDueDate: '2026-06-15',
    performedBy: 'Robert Chen',
    result: 'pass',
    beforeReading: 28.2,
    afterReading: 28.0,
    referenceStandard: 'NIST Traceable RTD',
    referenceValue: 28.0,
    deviation: 0.2,
    deviationPercent: 0.7,
    tolerancePercent: 2.0,
    notes: 'Sensor within specification, no adjustment needed.',
    certificateNumber: 'CERT-2025-1215-001',
    equipmentUsed: ['NIST RTD Probe', 'Fluke 724 Calibrator'],
    createdAt: '2025-12-15T10:30:00Z',
  },
  {
    id: 'CAL-002',
    sensorId: 'S002',
    calibrationType: 'routine',
    calibrationDate: '2025-11-01',
    nextDueDate: '2026-02-01',
    performedBy: 'Robert Chen',
    result: 'pass',
    beforeReading: 12.1,
    afterReading: 12.0,
    referenceStandard: 'Certified Gas Mixture',
    referenceValue: 12.0,
    deviation: 0.1,
    deviationPercent: 0.8,
    tolerancePercent: 5.0,
    certificateNumber: 'CERT-2025-1101-002',
    equipmentUsed: ['NIST Gas Standard 12ppm', 'Gas Dilution System'],
    createdAt: '2025-11-01T09:00:00Z',
  },
  {
    id: 'CAL-003',
    sensorId: 'S007',
    calibrationType: 'adjustment',
    calibrationDate: '2025-10-20',
    nextDueDate: '2026-01-20',
    performedBy: 'Sarah Johnson',
    result: 'adjusted',
    beforeReading: 47.5,
    afterReading: 45.0,
    referenceStandard: 'Certified Gas Mixture',
    referenceValue: 45.0,
    deviation: 2.5,
    deviationPercent: 5.6,
    tolerancePercent: 5.0,
    notes: 'Sensor drift detected. Zero and span adjusted. Post-adjustment reading within spec.',
    certificateNumber: 'CERT-2025-1020-003',
    equipmentUsed: ['NIST Gas Standard 45ppm', 'Zero Air Generator'],
    createdAt: '2025-10-20T14:15:00Z',
  },
  {
    id: 'CAL-004',
    sensorId: 'S004',
    calibrationType: 'verification',
    calibrationDate: '2025-12-01',
    nextDueDate: '2026-12-01',
    performedBy: 'Mike Williams',
    result: 'pass',
    beforeReading: 85.2,
    afterReading: 85.0,
    referenceStandard: 'NIST Traceable Sound Level Calibrator',
    referenceValue: 85.0,
    deviation: 0.2,
    deviationPercent: 0.2,
    tolerancePercent: 1.0,
    certificateNumber: 'CERT-2025-1201-004',
    equipmentUsed: ['94dB Calibrator', 'B&K Type 4231'],
    createdAt: '2025-12-01T11:00:00Z',
  },
  {
    id: 'CAL-005',
    sensorId: 'S005',
    calibrationType: 'post-repair',
    calibrationDate: '2025-09-15',
    nextDueDate: '2025-12-15',
    performedBy: 'Robert Chen',
    result: 'replaced',
    beforeReading: 0,
    afterReading: 0,
    referenceStandard: 'Test Flame Source',
    referenceValue: 1,
    deviation: 0,
    deviationPercent: 0,
    tolerancePercent: 0,
    notes: 'Detector element replaced after false alarm investigation. Function test passed.',
    certificateNumber: 'CERT-2025-0915-005',
    equipmentUsed: ['Test Flame Unit', 'Optical Alignment Tool'],
    createdAt: '2025-09-15T16:00:00Z',
  },
  {
    id: 'CAL-006',
    sensorId: 'S003',
    calibrationType: 'routine',
    calibrationDate: '2025-06-01',
    nextDueDate: '2026-06-01',
    performedBy: 'Emily Davis',
    result: 'pass',
    beforeReading: 65.5,
    afterReading: 65.0,
    referenceStandard: 'Saturated Salt Solution',
    referenceValue: 65.0,
    deviation: 0.5,
    deviationPercent: 0.8,
    tolerancePercent: 3.0,
    certificateNumber: 'CERT-2025-0601-006',
    equipmentUsed: ['Humidity Chamber', 'Reference Hygrometer'],
    createdAt: '2025-06-01T10:00:00Z',
  },
];

export const mockCalibrationSchedule: SensorCalibrationSchedule[] = mockSensors.map(sensor => {
  const lastCal = mockCalibrationRecords.find(r => r.sensorId === sensor.id);
  const interval = calibrationIntervalDefaults[sensor.type];
  const lastDate = lastCal ? lastCal.calibrationDate : '2025-01-01';
  const nextDate = new Date(lastDate);
  nextDate.setDate(nextDate.getDate() + interval);
  
  const today = new Date('2026-01-05');
  const daysUntilDue = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  
  let status: CalibrationStatus = 'current';
  let priority: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (daysUntilDue < 0) {
    status = 'overdue';
    priority = 'critical';
  } else if (daysUntilDue <= 14) {
    status = 'due_soon';
    priority = sensor.type === 'gas' || sensor.type === 'flame' ? 'high' : 'medium';
  } else {
    priority = sensor.type === 'gas' || sensor.type === 'flame' ? 'medium' : 'low';
  }
  
  return {
    sensorId: sensor.id,
    sensorName: sensor.name,
    sensorType: sensor.type,
    location: sensor.location,
    calibrationInterval: interval,
    lastCalibrationDate: lastDate,
    nextCalibrationDate: nextDate.toISOString().split('T')[0],
    status,
    priority,
    manufacturer: 'Industrial Sensors Inc.',
    model: `ISI-${sensor.type.toUpperCase()}-2000`,
    serialNumber: `SN-${sensor.id}-2024`,
    accuracySpec: sensor.type === 'temperature' ? '±0.5°C' :
                  sensor.type === 'gas' ? '±2% FS' :
                  sensor.type === 'humidity' ? '±2% RH' :
                  sensor.type === 'noise' ? '±0.5 dB' : 'N/A',
  };
});

// Helper functions for calibration
export const getCalibrationHistory = (sensorId: string): CalibrationRecord[] => {
  return mockCalibrationRecords.filter(r => r.sensorId === sensorId)
    .sort((a, b) => new Date(b.calibrationDate).getTime() - new Date(a.calibrationDate).getTime());
};

export const getOverdueCalibrations = (): SensorCalibrationSchedule[] => {
  return mockCalibrationSchedule.filter(s => s.status === 'overdue');
};

export const getDueSoonCalibrations = (days: number = 14): SensorCalibrationSchedule[] => {
  return mockCalibrationSchedule.filter(s => s.status === 'due_soon');
};

export const getCalibrationStats = () => {
  const total = mockCalibrationSchedule.length;
  const current = mockCalibrationSchedule.filter(s => s.status === 'current').length;
  const dueSoon = mockCalibrationSchedule.filter(s => s.status === 'due_soon').length;
  const overdue = mockCalibrationSchedule.filter(s => s.status === 'overdue').length;
  const complianceRate = Math.round(((current + dueSoon) / total) * 100);
  return { total, current, dueSoon, overdue, complianceRate };
};
