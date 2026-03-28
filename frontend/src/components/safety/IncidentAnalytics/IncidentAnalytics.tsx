import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart3, TrendingUp, TrendingDown, Filter, Download, Calendar,
  AlertTriangle, Heart, Car, Building2, Leaf, Flame, Shield, Users, Zap,
  Factory, Gauge, FileText, ChevronDown, PieChart, Activity, X, Eye,
  Printer, FileSpreadsheet, ClipboardList, Stethoscope, MapPin, Phone, User,
  Camera, Paperclip, Image, File, Video, Upload, Trash2
} from 'lucide-react';

// Incident types for filtering - comprehensive list covering OSHA, ISO, and industry-specific categories
const INCIDENT_TYPES = [
  { id: 'all', label: 'All Types', icon: FileText, color: 'bg-surface-100 text-surface-600' },
  { id: 'incident', label: 'General', icon: AlertTriangle, color: 'bg-red-100 text-red-600' },
  { id: 'vehicle', label: 'Vehicle', icon: Car, color: 'bg-blue-100 text-blue-600' },
  { id: 'property', label: 'Property', icon: Building2, color: 'bg-orange-100 text-orange-600' },
  { id: 'injury', label: 'Injury', icon: Heart, color: 'bg-pink-100 text-pink-600' },
  { id: 'environmental', label: 'Environmental', icon: Leaf, color: 'bg-emerald-100 text-emerald-600' },
  { id: 'fire', label: 'Fire/Emergency', icon: Flame, color: 'bg-red-100 text-red-600' },
  { id: 'security', label: 'Security', icon: Shield, color: 'bg-slate-100 text-slate-600' },
  { id: 'ergonomic', label: 'Ergonomic', icon: Users, color: 'bg-purple-100 text-purple-600' },
  { id: 'chemical', label: 'Chemical', icon: Factory, color: 'bg-amber-100 text-amber-600' },
  { id: 'electrical', label: 'Electrical', icon: Zap, color: 'bg-yellow-100 text-yellow-600' },
  { id: 'process-safety', label: 'Process Safety', icon: Gauge, color: 'bg-indigo-100 text-indigo-600' },
  { id: 'contractor', label: 'Contractor', icon: Users, color: 'bg-cyan-100 text-cyan-600' },
  { id: 'near-miss', label: 'Near Miss', icon: AlertTriangle, color: 'bg-yellow-100 text-yellow-700' },
  { id: 'slip-trip-fall', label: 'Slip/Trip/Fall', icon: AlertTriangle, color: 'bg-rose-100 text-rose-600' },
  { id: 'struck-by', label: 'Struck By', icon: AlertTriangle, color: 'bg-red-100 text-red-700' },
  { id: 'caught-between', label: 'Caught In/Between', icon: AlertTriangle, color: 'bg-orange-100 text-orange-700' },
  { id: 'confined-space', label: 'Confined Space', icon: Shield, color: 'bg-gray-100 text-gray-700' },
  { id: 'hot-work', label: 'Hot Work', icon: Flame, color: 'bg-orange-100 text-orange-600' },
  { id: 'working-at-height', label: 'Working at Height', icon: AlertTriangle, color: 'bg-sky-100 text-sky-600' },
  { id: 'biological', label: 'Biological', icon: Leaf, color: 'bg-lime-100 text-lime-600' },
  { id: 'radiation', label: 'Radiation', icon: Zap, color: 'bg-violet-100 text-violet-600' },
  { id: 'noise-exposure', label: 'Noise Exposure', icon: Activity, color: 'bg-teal-100 text-teal-600' },
  { id: 'heat-stress', label: 'Heat Stress', icon: Flame, color: 'bg-red-100 text-red-500' },
  { id: 'cold-stress', label: 'Cold Stress', icon: Factory, color: 'bg-blue-100 text-blue-700' },
];

// Photo/Attachment interface
interface IncidentAttachment {
  id: string;
  name: string;
  type: 'photo' | 'document' | 'video';
  url: string;
  uploadedBy: string;
  uploadedAt: string;
  size: string;
}

// Enhanced incident data interface
interface IncidentRecord {
  id: string;
  type: string;
  title: string;
  severity: string;
  status: string;
  date: string;
  time: string;
  department: string;
  location: string;
  // Employee Information
  employeeName: string;
  employeeId: string;
  employeeDOB: string;
  employeePhone: string;
  employeeJobTitle: string;
  employeeHireDate: string;
  // Medical Information
  medicalTreatment: string;
  restrictedDays: number;
  lostDays: number;
  bodyPart: string;
  injuryType: string;
  // Medical Provider Details
  medicalClinicName: string;
  medicalClinicAddress: string;
  medicalClinicPhone: string;
  treatingPhysician: string;
  physicianLicense: string;
  treatmentDate: string;
  followUpDate: string;
  medicalNotes: string;
  // OSHA Information
  oshaRecordable: boolean;
  oshaFormNumber: string;
  // Additional Details
  witnesses: string[];
  rootCause: string;
  correctiveActions: string;
  reportedBy: string;
  // Attachments
  attachments?: IncidentAttachment[];
}

// Enhanced mock incident data with DOB, medical clinic, and doctor info
const mockIncidentsEnhanced: IncidentRecord[] = [
  { 
    id: 'INC-2026-001', 
    type: 'incident', 
    title: 'Slip hazard in warehouse', 
    severity: 'medium', 
    status: 'open', 
    date: '2026-01-05',
    time: '09:30',
    department: 'Operations', 
    location: 'Building A - Zone 3',
    employeeName: 'Michael Johnson',
    employeeId: 'EMP-1042',
    employeeDOB: '1985-03-15',
    employeePhone: '(555) 234-5678',
    employeeJobTitle: 'Warehouse Associate',
    employeeHireDate: '2019-06-01',
    medicalTreatment: 'First Aid',
    restrictedDays: 0,
    lostDays: 0,
    bodyPart: 'None',
    injuryType: 'N/A',
    medicalClinicName: 'On-site Medical Station',
    medicalClinicAddress: 'Building A, Room 101',
    medicalClinicPhone: '(555) 100-0001',
    treatingPhysician: 'Nurse Patricia Wells, RN',
    physicianLicense: 'RN-45892',
    treatmentDate: '2026-01-05',
    followUpDate: '',
    medicalNotes: 'Minor abrasion cleaned and bandaged. No further treatment required.',
    oshaRecordable: false,
    oshaFormNumber: '',
    witnesses: ['John Smith', 'Maria Garcia'],
    rootCause: 'Wet floor from recent mopping without warning signs',
    correctiveActions: 'Install wet floor signs, review cleaning schedule',
    reportedBy: 'Sarah Connor',
    attachments: [
      { id: 'ATT-001', name: 'wet_floor_area.jpg', type: 'photo', url: '#', uploadedBy: 'Sarah Connor', uploadedAt: '2026-01-05 10:00', size: '2.4 MB' },
      { id: 'ATT-002', name: 'incident_sketch.pdf', type: 'document', url: '#', uploadedBy: 'Mike Ross', uploadedAt: '2026-01-05 11:30', size: '156 KB' }
    ]
  },
  { 
    id: 'VEH-2026-002', 
    type: 'vehicle', 
    title: 'Forklift collision with rack', 
    severity: 'high', 
    status: 'investigating', 
    date: '2026-01-04',
    time: '14:15',
    department: 'Logistics', 
    location: 'Warehouse B',
    employeeName: 'Robert Williams',
    employeeId: 'EMP-0892',
    employeeDOB: '1990-07-22',
    employeePhone: '(555) 345-6789',
    employeeJobTitle: 'Forklift Operator',
    employeeHireDate: '2021-03-15',
    medicalTreatment: 'None',
    restrictedDays: 0,
    lostDays: 0,
    bodyPart: 'None',
    injuryType: 'N/A',
    medicalClinicName: 'N/A',
    medicalClinicAddress: 'N/A',
    medicalClinicPhone: 'N/A',
    treatingPhysician: 'N/A',
    physicianLicense: 'N/A',
    treatmentDate: '',
    followUpDate: '',
    medicalNotes: 'No injury sustained. Equipment damage only.',
    oshaRecordable: false,
    oshaFormNumber: '',
    witnesses: ['David Chen', 'Emily Rodriguez'],
    rootCause: 'Obstructed view due to oversized load',
    correctiveActions: 'Retrain operator, implement spotter requirement for large loads',
    reportedBy: 'Mike Ross',
    attachments: [
      { id: 'ATT-003', name: 'forklift_damage.jpg', type: 'photo', url: '#', uploadedBy: 'David Chen', uploadedAt: '2026-01-04 14:45', size: '3.1 MB' },
      { id: 'ATT-004', name: 'rack_damage.jpg', type: 'photo', url: '#', uploadedBy: 'David Chen', uploadedAt: '2026-01-04 14:47', size: '2.8 MB' },
      { id: 'ATT-005', name: 'cctv_footage.mp4', type: 'video', url: '#', uploadedBy: 'Security', uploadedAt: '2026-01-04 16:00', size: '45.2 MB' }
    ]
  },
  { 
    id: 'INJ-2026-004', 
    type: 'injury', 
    title: 'Hand laceration from equipment', 
    severity: 'high', 
    status: 'capa-pending', 
    date: '2026-01-02',
    time: '10:45',
    department: 'Manufacturing', 
    location: 'Production Line 4',
    employeeName: 'Jennifer Martinez',
    employeeId: 'EMP-0567',
    employeeDOB: '1988-11-08',
    employeePhone: '(555) 456-7890',
    employeeJobTitle: 'Machine Operator',
    employeeHireDate: '2017-08-20',
    medicalTreatment: 'Medical Treatment',
    restrictedDays: 5,
    lostDays: 2,
    bodyPart: 'Left Hand',
    injuryType: 'Laceration/Cut',
    medicalClinicName: 'City Medical Center - Occupational Health',
    medicalClinicAddress: '450 Healthcare Blvd, Suite 200, Metro City, ST 12345',
    medicalClinicPhone: '(555) 567-8901',
    treatingPhysician: 'Dr. Amanda Richardson, MD',
    physicianLicense: 'MD-78234',
    treatmentDate: '2026-01-02',
    followUpDate: '2026-01-09',
    medicalNotes: '3cm laceration on palm. Required 8 stitches. Prescribed antibiotics and pain medication. Return to work with restrictions.',
    oshaRecordable: true,
    oshaFormNumber: 'OSHA-300-2026-004',
    witnesses: ['Carlos Hernandez'],
    rootCause: 'Missing machine guard during maintenance',
    correctiveActions: 'Replace guard, implement LOTO verification checklist',
    reportedBy: 'Jane Smith'
  },
  { 
    id: 'ENV-2026-011', 
    type: 'environmental', 
    title: 'Oil leak from compressor', 
    severity: 'high', 
    status: 'investigating', 
    date: '2026-01-09',
    time: '16:30',
    department: 'Facilities', 
    location: 'Compressor Room',
    employeeName: 'N/A',
    employeeId: 'N/A',
    employeeDOB: 'N/A',
    employeePhone: 'N/A',
    employeeJobTitle: 'N/A',
    employeeHireDate: 'N/A',
    medicalTreatment: 'None',
    restrictedDays: 0,
    lostDays: 0,
    bodyPart: 'N/A',
    injuryType: 'N/A',
    medicalClinicName: 'N/A',
    medicalClinicAddress: 'N/A',
    medicalClinicPhone: 'N/A',
    treatingPhysician: 'N/A',
    physicianLicense: 'N/A',
    treatmentDate: '',
    followUpDate: '',
    medicalNotes: 'Environmental incident - no personnel exposure.',
    oshaRecordable: false,
    oshaFormNumber: '',
    witnesses: ['Maintenance Team'],
    rootCause: 'Worn seal on compressor unit',
    correctiveActions: 'Replace seal, add to preventive maintenance schedule',
    reportedBy: 'Tom Anderson'
  },
  { 
    id: 'FIRE-2026-014', 
    type: 'fire', 
    title: 'Small fire in break room', 
    severity: 'high', 
    status: 'closed', 
    date: '2026-01-08',
    time: '12:20',
    department: 'Safety', 
    location: 'Building C Break Room',
    employeeName: 'N/A',
    employeeId: 'N/A',
    employeeDOB: 'N/A',
    employeePhone: 'N/A',
    employeeJobTitle: 'N/A',
    employeeHireDate: 'N/A',
    medicalTreatment: 'None',
    restrictedDays: 0,
    lostDays: 0,
    bodyPart: 'N/A',
    injuryType: 'N/A',
    medicalClinicName: 'N/A',
    medicalClinicAddress: 'N/A',
    medicalClinicPhone: 'N/A',
    treatingPhysician: 'N/A',
    physicianLicense: 'N/A',
    treatmentDate: '',
    followUpDate: '',
    medicalNotes: 'Fire extinguished immediately. No injuries.',
    oshaRecordable: false,
    oshaFormNumber: '',
    witnesses: ['Multiple employees'],
    rootCause: 'Toaster malfunction',
    correctiveActions: 'Replace appliance, inspect all break room equipment',
    reportedBy: 'Fire Response Team'
  },
  { 
    id: 'CHEM-2026-020', 
    type: 'chemical', 
    title: 'Chlorine gas exposure', 
    severity: 'critical', 
    status: 'resolved', 
    date: '2026-01-10',
    time: '08:45',
    department: 'Operations', 
    location: 'Water Treatment',
    employeeName: 'David Thompson',
    employeeId: 'EMP-0234',
    employeeDOB: '1992-04-18',
    employeePhone: '(555) 678-9012',
    employeeJobTitle: 'Water Treatment Technician',
    employeeHireDate: '2020-01-10',
    medicalTreatment: 'Hospitalization',
    restrictedDays: 0,
    lostDays: 7,
    bodyPart: 'Respiratory',
    injuryType: 'Inhalation',
    medicalClinicName: 'Regional Hospital - Emergency Department',
    medicalClinicAddress: '1200 Hospital Drive, Metro City, ST 12345',
    medicalClinicPhone: '(555) 789-0123',
    treatingPhysician: 'Dr. James Mitchell, MD - Pulmonologist',
    physicianLicense: 'MD-45678',
    treatmentDate: '2026-01-10',
    followUpDate: '2026-01-24',
    medicalNotes: 'Admitted for observation due to chlorine gas inhalation. Treated with oxygen therapy and bronchodilators. Discharged after 2 days. Follow-up pulmonary function test scheduled.',
    oshaRecordable: true,
    oshaFormNumber: 'OSHA-301-2026-020',
    witnesses: ['Emergency Response Team'],
    rootCause: 'Valve failure during chemical transfer',
    correctiveActions: 'Replace all valves in system, implement real-time gas monitoring',
    reportedBy: 'Emergency Response Lead'
  },
  { 
    id: 'ELEC-2026-024', 
    type: 'electrical', 
    title: 'Arc flash near miss', 
    severity: 'critical', 
    status: 'capa-pending', 
    date: '2026-01-19',
    time: '11:00',
    department: 'Maintenance', 
    location: 'MCC Room 2',
    employeeName: 'Kevin O\'Brien',
    employeeId: 'EMP-0789',
    employeeDOB: '1987-09-30',
    employeePhone: '(555) 890-1234',
    employeeJobTitle: 'Electrical Technician',
    employeeHireDate: '2018-05-15',
    medicalTreatment: 'First Aid',
    restrictedDays: 0,
    lostDays: 0,
    bodyPart: 'Face/Eyes',
    injuryType: 'Flash Burn',
    medicalClinicName: 'On-site Medical Center',
    medicalClinicAddress: 'Building A, Medical Suite',
    medicalClinicPhone: '(555) 100-0002',
    treatingPhysician: 'Dr. Susan Park, MD - Occupational Medicine',
    physicianLicense: 'MD-89012',
    treatmentDate: '2026-01-19',
    followUpDate: '2026-01-22',
    medicalNotes: 'Minor flash burn to face. Eyes examined - no damage. Cold compress applied. Monitoring recommended.',
    oshaRecordable: false,
    oshaFormNumber: '',
    witnesses: ['Safety Observer'],
    rootCause: 'Incorrect PPE level for task',
    correctiveActions: 'Review arc flash assessment, update PPE matrix, retrain all electrical workers',
    reportedBy: 'Safety Manager'
  },
  { 
    id: 'ERG-2026-018', 
    type: 'ergonomic', 
    title: 'Repetitive strain injury', 
    severity: 'medium', 
    status: 'capa-pending', 
    date: '2026-01-15',
    time: '15:30',
    department: 'Manufacturing', 
    location: 'Assembly Line 2',
    employeeName: 'Lisa Chen',
    employeeId: 'EMP-1156',
    employeeDOB: '1995-01-25',
    employeePhone: '(555) 901-2345',
    employeeJobTitle: 'Assembly Technician',
    employeeHireDate: '2022-09-01',
    medicalTreatment: 'Medical Treatment',
    restrictedDays: 14,
    lostDays: 0,
    bodyPart: 'Wrist/Hand',
    injuryType: 'Sprain/Strain',
    medicalClinicName: 'Occupational Health Partners',
    medicalClinicAddress: '789 Wellness Way, Suite 300, Metro City, ST 12345',
    medicalClinicPhone: '(555) 012-3456',
    treatingPhysician: 'Dr. Robert Kim, MD - Sports Medicine',
    physicianLicense: 'MD-34567',
    treatmentDate: '2026-01-15',
    followUpDate: '2026-01-29',
    medicalNotes: 'Diagnosed with carpal tunnel syndrome - early stage. Prescribed wrist brace and anti-inflammatory medication. Physical therapy recommended. Work restrictions: no repetitive wrist motions.',
    oshaRecordable: true,
    oshaFormNumber: 'OSHA-300-2026-018',
    witnesses: [],
    rootCause: 'Inadequate ergonomic workstation design',
    correctiveActions: 'Ergonomic assessment of all assembly stations, implement job rotation',
    reportedBy: 'Supervisor - Assembly'
  },
];

// Analytics data
const monthlyTrends = [
  { month: 'Aug', incidents: 12, injuries: 3, nearMiss: 28 },
  { month: 'Sep', incidents: 15, injuries: 4, nearMiss: 35 },
  { month: 'Oct', incidents: 10, injuries: 2, nearMiss: 42 },
  { month: 'Nov', incidents: 8, injuries: 2, nearMiss: 38 },
  { month: 'Dec', incidents: 14, injuries: 5, nearMiss: 31 },
  { month: 'Jan', incidents: 11, injuries: 3, nearMiss: 45 },
];

const departmentStats = [
  { dept: 'Manufacturing', incidents: 18, percentage: 32 },
  { dept: 'Logistics', incidents: 14, percentage: 25 },
  { dept: 'Maintenance', incidents: 10, percentage: 18 },
  { dept: 'Operations', incidents: 8, percentage: 14 },
  { dept: 'Other', incidents: 6, percentage: 11 },
];

const severityDistribution = [
  { level: 'Critical', count: 3, color: 'bg-red-500' },
  { level: 'High', count: 12, color: 'bg-orange-500' },
  { level: 'Medium', count: 24, color: 'bg-amber-500' },
  { level: 'Low', count: 17, color: 'bg-green-500' },
];

interface IncidentAnalyticsProps {
  incidents?: IncidentRecord[];
  onExport?: (format: 'csv' | 'pdf', data: IncidentRecord[]) => void;
  onFilterChange?: (filters: any) => void;
}

export const IncidentAnalytics: React.FC<IncidentAnalyticsProps> = ({
  incidents = mockIncidentsEnhanced,
  onExport,
  onFilterChange
}) => {
  const [selectedType, setSelectedType] = useState<string>('incident');
  const [dateRange, setDateRange] = useState<string>('30');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [selectedIncident, setSelectedIncident] = useState<IncidentRecord | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [uploadedAttachments, setUploadedAttachments] = useState<Record<string, IncidentAttachment[]>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUploadClick = () => fileInputRef.current?.click();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedIncident || !e.target.files) return;
    const newAttachments: IncidentAttachment[] = Array.from(e.target.files).map((file, i) => ({
      id: `UP-${Date.now()}-${i}`,
      name: file.name,
      type: file.type.startsWith('image/') ? 'photo' : file.type.startsWith('video/') ? 'video' : 'document',
      url: URL.createObjectURL(file),
      uploadedBy: 'You',
      uploadedAt: new Date().toLocaleString(),
      size: file.size > 1048576 ? `${(file.size / 1048576).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
    }));
    setUploadedAttachments(prev => ({
      ...prev,
      [selectedIncident.id]: [...(prev[selectedIncident.id] ?? []), ...newAttachments],
    }));
    e.target.value = '';
  };

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      if (selectedType !== 'all' && incident.type !== selectedType) return false;
      if (statusFilter !== 'all' && incident.status !== statusFilter) return false;
      if (severityFilter !== 'all' && incident.severity !== severityFilter) return false;
      return true;
    });
  }, [incidents, selectedType, statusFilter, severityFilter]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const open = filteredIncidents.filter(i => i.status === 'open').length;
    const critical = filteredIncidents.filter(i => i.severity === 'critical').length;
    const withInjury = filteredIncidents.filter(i => i.type === 'injury' || i.lostDays > 0).length;
    const totalLostDays = filteredIncidents.reduce((sum, i) => sum + i.lostDays, 0);
    const totalRestrictedDays = filteredIncidents.reduce((sum, i) => sum + i.restrictedDays, 0);
    
    return { total, open, critical, withInjury, totalLostDays, totalRestrictedDays };
  }, [filteredIncidents]);

  // Type distribution
  const typeDistribution = useMemo(() => {
    const distribution: Record<string, number> = {};
    filteredIncidents.forEach(incident => {
      distribution[incident.type] = (distribution[incident.type] || 0) + 1;
    });
    return Object.entries(distribution).map(([type, count]) => ({
      type,
      count,
      percentage: Math.round((count / filteredIncidents.length) * 100) || 0
    }));
  }, [filteredIncidents]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Incident ID', 'Type', 'Title', 'Severity', 'Status', 'Date', 'Time',
      'Department', 'Location',
      'Employee Name', 'Employee ID', 'Date of Birth', 'Employee Phone', 'Job Title', 'Hire Date',
      'Medical Treatment', 'Body Part', 'Injury Type', 'Restricted Days', 'Lost Days',
      'Medical Clinic', 'Clinic Address', 'Clinic Phone',
      'Treating Physician', 'Physician License', 'Treatment Date', 'Follow-up Date',
      'Medical Notes', 'OSHA Recordable', 'OSHA Form Number',
      'Root Cause', 'Corrective Actions', 'Reported By'
    ];
    
    const csvRows = filteredIncidents.map(i => [
      i.id,
      i.type,
      `"${i.title.replace(/"/g, '""')}"`,
      i.severity,
      i.status,
      i.date,
      i.time,
      i.department,
      `"${i.location.replace(/"/g, '""')}"`,
      `"${i.employeeName}"`,
      i.employeeId,
      i.employeeDOB,
      i.employeePhone,
      `"${i.employeeJobTitle}"`,
      i.employeeHireDate,
      i.medicalTreatment,
      i.bodyPart,
      i.injuryType,
      i.restrictedDays,
      i.lostDays,
      `"${i.medicalClinicName}"`,
      `"${i.medicalClinicAddress.replace(/"/g, '""')}"`,
      i.medicalClinicPhone,
      `"${i.treatingPhysician}"`,
      i.physicianLicense,
      i.treatmentDate,
      i.followUpDate,
      `"${i.medicalNotes.replace(/"/g, '""')}"`,
      i.oshaRecordable ? 'Yes' : 'No',
      i.oshaFormNumber,
      `"${i.rootCause.replace(/"/g, '""')}"`,
      `"${i.correctiveActions.replace(/"/g, '""')}"`,
      i.reportedBy
    ]);
    
    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incident-report-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setShowExportMenu(false);
  };

  // Export to PDF (generates HTML that can be printed)
  const exportToPDF = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow pop-ups to export PDF');
      return;
    }
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Incident Report - ${new Date().toLocaleDateString()}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; font-size: 11px; }
          h1 { color: #1e40af; font-size: 18px; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
          h2 { color: #374151; font-size: 14px; margin-top: 20px; background: #f3f4f6; padding: 8px; }
          .summary { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
          .stat-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 10px 15px; border-radius: 8px; min-width: 100px; }
          .stat-value { font-size: 20px; font-weight: bold; color: #1e40af; }
          .stat-label { font-size: 10px; color: #64748b; text-transform: uppercase; }
          .incident { border: 1px solid #e5e7eb; margin: 15px 0; padding: 15px; border-radius: 8px; page-break-inside: avoid; }
          .incident-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
          .incident-id { font-weight: bold; color: #1e40af; font-size: 13px; }
          .badge { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: bold; text-transform: uppercase; }
          .severity-critical { background: #fee2e2; color: #dc2626; }
          .severity-high { background: #ffedd5; color: #ea580c; }
          .severity-medium { background: #fef3c7; color: #d97706; }
          .severity-low { background: #dcfce7; color: #16a34a; }
          .info-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .info-item { margin: 5px 0; }
          .info-label { font-weight: bold; color: #374151; font-size: 9px; text-transform: uppercase; }
          .info-value { color: #1f2937; }
          .section { margin: 10px 0; padding: 10px; background: #f9fafb; border-radius: 4px; }
          .section-title { font-weight: bold; color: #4b5563; font-size: 11px; margin-bottom: 5px; }
          .medical-section { background: #fef2f2; border-left: 3px solid #ef4444; }
          .footer { margin-top: 30px; text-align: center; color: #9ca3af; font-size: 9px; border-top: 1px solid #e5e7eb; padding-top: 10px; }
          @media print { body { padding: 10px; } .incident { page-break-inside: avoid; } }
        </style>
      </head>
      <body>
        <h1>🛡️ EHS Incident Report</h1>
        <p>Generated: ${new Date().toLocaleString()} | Total Records: ${filteredIncidents.length}</p>
        
        <div class="summary">
          <div class="stat-box"><div class="stat-value">${stats.total}</div><div class="stat-label">Total Incidents</div></div>
          <div class="stat-box"><div class="stat-value">${stats.open}</div><div class="stat-label">Open</div></div>
          <div class="stat-box"><div class="stat-value">${stats.critical}</div><div class="stat-label">Critical</div></div>
          <div class="stat-box"><div class="stat-value">${stats.withInjury}</div><div class="stat-label">With Injuries</div></div>
          <div class="stat-box"><div class="stat-value">${stats.totalLostDays}</div><div class="stat-label">Lost Days</div></div>
          <div class="stat-box"><div class="stat-value">${stats.totalRestrictedDays}</div><div class="stat-label">Restricted Days</div></div>
        </div>
        
        ${filteredIncidents.map(i => `
          <div class="incident">
            <div class="incident-header">
              <span class="incident-id">${i.id} - ${i.title}</span>
              <span class="badge severity-${i.severity}">${i.severity}</span>
            </div>
            
            <div class="info-grid">
              <div class="info-item"><div class="info-label">Date/Time</div><div class="info-value">${i.date} ${i.time}</div></div>
              <div class="info-item"><div class="info-label">Department</div><div class="info-value">${i.department}</div></div>
              <div class="info-item"><div class="info-label">Location</div><div class="info-value">${i.location}</div></div>
              <div class="info-item"><div class="info-label">Type</div><div class="info-value">${i.type}</div></div>
              <div class="info-item"><div class="info-label">Status</div><div class="info-value">${i.status}</div></div>
              <div class="info-item"><div class="info-label">Reported By</div><div class="info-value">${i.reportedBy}</div></div>
            </div>
            
            ${i.employeeName !== 'N/A' ? `
            <div class="section">
              <div class="section-title">👤 Employee Information</div>
              <div class="info-grid">
                <div class="info-item"><div class="info-label">Name</div><div class="info-value">${i.employeeName}</div></div>
                <div class="info-item"><div class="info-label">Employee ID</div><div class="info-value">${i.employeeId}</div></div>
                <div class="info-item"><div class="info-label">Date of Birth</div><div class="info-value">${i.employeeDOB}</div></div>
                <div class="info-item"><div class="info-label">Phone</div><div class="info-value">${i.employeePhone}</div></div>
                <div class="info-item"><div class="info-label">Job Title</div><div class="info-value">${i.employeeJobTitle}</div></div>
                <div class="info-item"><div class="info-label">Hire Date</div><div class="info-value">${i.employeeHireDate}</div></div>
              </div>
            </div>
            ` : ''}
            
            ${i.medicalTreatment !== 'None' && i.medicalTreatment !== 'N/A' ? `
            <div class="section medical-section">
              <div class="section-title">🏥 Medical Information</div>
              <div class="info-grid">
                <div class="info-item"><div class="info-label">Treatment Level</div><div class="info-value">${i.medicalTreatment}</div></div>
                <div class="info-item"><div class="info-label">Body Part</div><div class="info-value">${i.bodyPart}</div></div>
                <div class="info-item"><div class="info-label">Injury Type</div><div class="info-value">${i.injuryType}</div></div>
                <div class="info-item"><div class="info-label">Lost Days</div><div class="info-value">${i.lostDays}</div></div>
                <div class="info-item"><div class="info-label">Restricted Days</div><div class="info-value">${i.restrictedDays}</div></div>
                <div class="info-item"><div class="info-label">OSHA Recordable</div><div class="info-value">${i.oshaRecordable ? 'Yes - ' + i.oshaFormNumber : 'No'}</div></div>
              </div>
              <div style="margin-top: 10px;">
                <div class="info-label">Medical Provider</div>
                <div class="info-value">${i.medicalClinicName}</div>
                <div class="info-value" style="font-size: 10px; color: #6b7280;">${i.medicalClinicAddress}</div>
                <div class="info-value" style="font-size: 10px; color: #6b7280;">📞 ${i.medicalClinicPhone}</div>
              </div>
              <div style="margin-top: 10px;">
                <div class="info-label">Treating Physician</div>
                <div class="info-value">${i.treatingPhysician} (License: ${i.physicianLicense})</div>
                <div class="info-value" style="font-size: 10px;">Treatment: ${i.treatmentDate} | Follow-up: ${i.followUpDate || 'N/A'}</div>
              </div>
              <div style="margin-top: 10px;">
                <div class="info-label">Medical Notes</div>
                <div class="info-value" style="font-style: italic;">${i.medicalNotes}</div>
              </div>
            </div>
            ` : ''}
            
            <div class="section">
              <div class="section-title">🔍 Root Cause & Corrective Actions</div>
              <div class="info-item"><div class="info-label">Root Cause</div><div class="info-value">${i.rootCause}</div></div>
              <div class="info-item"><div class="info-label">Corrective Actions</div><div class="info-value">${i.correctiveActions}</div></div>
            </div>
          </div>
        `).join('')}
        
        <div class="footer">
          <p>This report is confidential and intended for authorized personnel only.</p>
          <p>EHS Safety Management System - Compliance Report</p>
        </div>
      </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
    setShowExportMenu(false);
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (onExport) {
      onExport(format, filteredIncidents);
    } else {
      if (format === 'csv') {
        exportToCSV();
      } else {
        exportToPDF();
      }
    }
  };

  const getTypeIcon = (type: string) => {
    const typeConfig = INCIDENT_TYPES.find(t => t.id === type);
    return typeConfig?.icon || FileText;
  };

  const getTypeColor = (type: string) => {
    const typeConfig = INCIDENT_TYPES.find(t => t.id === type);
    return typeConfig?.color || 'bg-surface-100 text-surface-600';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-700';
      case 'high': return 'bg-orange-100 text-orange-700';
      case 'medium': return 'bg-amber-100 text-amber-700';
      case 'low': return 'bg-green-100 text-green-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'investigating': return 'bg-purple-100 text-purple-700';
      case 'resolved': case 'closed': return 'bg-green-100 text-green-700';
      case 'capa-pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-brand-500" />
            Incident Analytics
          </h2>
          <p className="text-sm text-surface-500">Comprehensive incident analysis and reporting</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="px-4 py-2 bg-surface-100 text-surface-600 rounded-xl hover:bg-surface-200 transition-colors flex items-center gap-2"
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
          
          {/* Export Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-accent text-text-onAccent rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Export
              <ChevronDown className={`w-4 h-4 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showExportMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-surface-100 overflow-hidden z-50"
                >
                  <button
                    onClick={() => handleExport('csv')}
                    className="w-full px-4 py-3 text-left hover:bg-surface-50 flex items-center gap-3 transition-colors"
                  >
                    <FileSpreadsheet className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-surface-800">Export CSV</p>
                      <p className="text-xs text-surface-500">Spreadsheet format</p>
                    </div>
                  </button>
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full px-4 py-3 text-left hover:bg-surface-50 flex items-center gap-3 transition-colors border-t border-surface-100"
                  >
                    <Printer className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-surface-800">Export PDF</p>
                      <p className="text-xs text-surface-500">Print-ready report</p>
                    </div>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Type Filter Tabs */}
      <div className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft overflow-x-auto">
        <div className="flex gap-2 min-w-max">
          {INCIDENT_TYPES.slice(0, 12).map(type => {
            const Icon = type.icon;
            const isSelected = selectedType === type.id;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                  isSelected ? 'bg-accent text-text-onAccent' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft overflow-hidden"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Date Range</label>
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 90 days</option>
                  <option value="365">Last year</option>
                  <option value="all">All time</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="all">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="investigating">Investigating</option>
                  <option value="capa-pending">CAPA Pending</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Severity</label>
                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Total Incidents</p>
          <p className="text-2xl font-bold text-surface-800">{stats.total}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Open</p>
          <p className="text-2xl font-bold text-blue-600">{stats.open}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Critical</p>
          <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <p className="text-xs font-bold text-surface-400 uppercase mb-1">With Injuries</p>
          <p className="text-2xl font-bold text-orange-600">{stats.withInjury}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Lost Days</p>
          <p className="text-2xl font-bold text-purple-600">{stats.totalLostDays}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Restricted Days</p>
          <p className="text-2xl font-bold text-amber-600">{stats.totalRestrictedDays}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trend Chart */}
        <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
          <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-brand-500" />
            Monthly Trends
          </h3>
          <div className="space-y-4">
            {monthlyTrends.map((month, index) => (
              <div key={month.month} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-surface-600">{month.month}</span>
                  <span className="text-surface-500">{month.incidents} incidents</span>
                </div>
                <div className="flex gap-1 h-6">
                  <div
                    className="bg-red-400 rounded-l"
                    style={{ width: `${(month.incidents / 20) * 100}%` }}
                    title={`Incidents: ${month.incidents}`}
                  />
                  <div
                    className="bg-orange-400"
                    style={{ width: `${(month.injuries / 20) * 100}%` }}
                    title={`Injuries: ${month.injuries}`}
                  />
                  <div
                    className="bg-blue-400 rounded-r"
                    style={{ width: `${(month.nearMiss / 100) * 100}%` }}
                    title={`Near Misses: ${month.nearMiss}`}
                  />
                </div>
              </div>
            ))}
            <div className="flex gap-4 text-xs mt-4">
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded" /> Incidents</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-orange-400 rounded" /> Injuries</span>
              <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-400 rounded" /> Near Misses</span>
            </div>
          </div>
        </div>

        {/* Type Distribution */}
        <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
          <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
            <PieChart className="w-5 h-5 text-brand-500" />
            Incident Type Distribution
          </h3>
          <div className="space-y-3">
            {typeDistribution.map(item => {
              const Icon = getTypeIcon(item.type);
              return (
                <div key={item.type} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(item.type)}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium capitalize">{item.type.replace('-', ' ')}</span>
                      <span className="text-surface-500">{item.count} ({item.percentage}%)</span>
                    </div>
                    <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-500 rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filtered Incidents Table */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-surface-100">
          <h3 className="font-bold text-brand-900">Incident Details</h3>
          <p className="text-sm text-surface-500">{filteredIncidents.length} incidents found - click row to view full details</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50">
              <tr>
                <th className="text-left p-3 font-bold text-surface-600">ID</th>
                <th className="text-left p-3 font-bold text-surface-600">Type</th>
                <th className="text-left p-3 font-bold text-surface-600">Title</th>
                <th className="text-left p-3 font-bold text-surface-600">Employee</th>
                <th className="text-left p-3 font-bold text-surface-600">DOB</th>
                <th className="text-left p-3 font-bold text-surface-600">Severity</th>
                <th className="text-left p-3 font-bold text-surface-600">Medical</th>
                <th className="text-left p-3 font-bold text-surface-600">Clinic</th>
                <th className="text-left p-3 font-bold text-surface-600">Doctor</th>
                <th className="text-left p-3 font-bold text-surface-600">Days Lost</th>
                <th className="text-left p-3 font-bold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.map((incident, index) => {
                const Icon = getTypeIcon(incident.type);
                return (
                  <tr 
                    key={incident.id} 
                    className={`${index % 2 === 0 ? 'bg-white' : 'bg-surface-50'} hover:bg-brand-50 cursor-pointer transition-colors`}
                    onClick={() => setSelectedIncident(incident)}
                  >
                    <td className="p-3 font-mono text-xs text-surface-500">{incident.id}</td>
                    <td className="p-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${getTypeColor(incident.type)}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </td>
                    <td className="p-3 font-medium text-surface-800 max-w-[200px] truncate">{incident.title}</td>
                    <td className="p-3 text-surface-600">{incident.employeeName}</td>
                    <td className="p-3 text-surface-500 text-xs">{incident.employeeDOB}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${getSeverityColor(incident.severity)}`}>
                        {incident.severity}
                      </span>
                    </td>
                    <td className="p-3 text-surface-600 text-xs">{incident.medicalTreatment}</td>
                    <td className="p-3 text-surface-600 text-xs max-w-[150px] truncate">{incident.medicalClinicName}</td>
                    <td className="p-3 text-surface-600 text-xs max-w-[150px] truncate">{incident.treatingPhysician}</td>
                    <td className="p-3">
                      <span className={incident.lostDays > 0 ? 'text-red-600 font-bold' : 'text-surface-400'}>
                        {incident.lostDays}
                      </span>
                    </td>
                    <td className="p-3">
                      <button 
                        onClick={(e) => { e.stopPropagation(); setSelectedIncident(incident); }}
                        className="p-2 hover:bg-brand-100 rounded-lg transition-colors"
                      >
                        <Eye className="w-4 h-4 text-brand-600" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Incident Detail Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b border-surface-100 p-4 flex items-center justify-between rounded-t-2xl">
                <div>
                  <h2 className="text-xl font-bold text-brand-900">{selectedIncident.id}</h2>
                  <p className="text-sm text-surface-500">{selectedIncident.title}</p>
                </div>
                <button
                  onClick={() => setSelectedIncident(null)}
                  className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* Status & Severity */}
                <div className="flex flex-wrap gap-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-bold uppercase ${getSeverityColor(selectedIncident.severity)}`}>
                    {selectedIncident.severity}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${getStatusColor(selectedIncident.status)}`}>
                    {selectedIncident.status.replace('-', ' ')}
                  </span>
                  {selectedIncident.oshaRecordable && (
                    <span className="px-3 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700">
                      OSHA Recordable
                    </span>
                  )}
                </div>

                {/* Basic Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-surface-400 uppercase mb-1">Date</p>
                    <p className="font-medium">{selectedIncident.date}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-surface-400 uppercase mb-1">Time</p>
                    <p className="font-medium">{selectedIncident.time}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-surface-400 uppercase mb-1">Department</p>
                    <p className="font-medium">{selectedIncident.department}</p>
                  </div>
                  <div className="bg-surface-50 rounded-xl p-3">
                    <p className="text-xs font-bold text-surface-400 uppercase mb-1">Location</p>
                    <p className="font-medium">{selectedIncident.location}</p>
                  </div>
                </div>

                {/* Employee Information Section */}
                {selectedIncident.employeeName !== 'N/A' && (
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
                    <h3 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                      <User className="w-5 h-5" />
                      Employee Information
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Full Name</p>
                        <p className="font-medium text-blue-900">{selectedIncident.employeeName}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Employee ID</p>
                        <p className="font-medium text-blue-900">{selectedIncident.employeeId}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Date of Birth</p>
                        <p className="font-medium text-blue-900">{selectedIncident.employeeDOB}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Phone</p>
                        <p className="font-medium text-blue-900">{selectedIncident.employeePhone}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Job Title</p>
                        <p className="font-medium text-blue-900">{selectedIncident.employeeJobTitle}</p>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase mb-1">Hire Date</p>
                        <p className="font-medium text-blue-900">{selectedIncident.employeeHireDate}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Medical Information Section */}
                <div className="bg-red-50 rounded-xl p-4 border border-red-100">
                  <h3 className="font-bold text-red-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="w-5 h-5" />
                    Medical Information
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase mb-1">Treatment Level</p>
                      <p className="font-medium text-red-900">{selectedIncident.medicalTreatment}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase mb-1">Body Part</p>
                      <p className="font-medium text-red-900">{selectedIncident.bodyPart}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase mb-1">Injury Type</p>
                      <p className="font-medium text-red-900">{selectedIncident.injuryType}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase mb-1">Lost Days</p>
                      <p className="font-medium text-red-900">{selectedIncident.lostDays}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-red-400 uppercase mb-1">Restricted Days</p>
                      <p className="font-medium text-red-900">{selectedIncident.restrictedDays}</p>
                    </div>
                    {selectedIncident.oshaRecordable && (
                      <div>
                        <p className="text-xs font-bold text-red-400 uppercase mb-1">OSHA Form #</p>
                        <p className="font-medium text-red-900">{selectedIncident.oshaFormNumber}</p>
                      </div>
                    )}
                  </div>

                  {/* Medical Provider Details */}
                  {selectedIncident.medicalClinicName !== 'N/A' && (
                    <div className="border-t border-red-200 pt-4 mt-4">
                      <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        Medical Provider Details
                      </h4>
                      <div className="bg-white rounded-lg p-4 space-y-3">
                        <div>
                          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Clinic / Hospital Name</p>
                          <p className="font-medium text-surface-800">{selectedIncident.medicalClinicName}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-surface-400 uppercase mb-1">Address</p>
                          <p className="text-surface-700">{selectedIncident.medicalClinicAddress}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4 text-surface-400" />
                          <p className="text-surface-700">{selectedIncident.medicalClinicPhone}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Treating Physician */}
                  {selectedIncident.treatingPhysician !== 'N/A' && (
                    <div className="border-t border-red-200 pt-4 mt-4">
                      <h4 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Treating Physician
                      </h4>
                      <div className="bg-white rounded-lg p-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-bold text-surface-400 uppercase mb-1">Doctor Name</p>
                            <p className="font-medium text-surface-800">{selectedIncident.treatingPhysician}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-surface-400 uppercase mb-1">License Number</p>
                            <p className="text-surface-700">{selectedIncident.physicianLicense}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-surface-400 uppercase mb-1">Treatment Date</p>
                            <p className="text-surface-700">{selectedIncident.treatmentDate || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-surface-400 uppercase mb-1">Follow-up Date</p>
                            <p className="text-surface-700">{selectedIncident.followUpDate || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Medical Notes */}
                  {selectedIncident.medicalNotes && (
                    <div className="border-t border-red-200 pt-4 mt-4">
                      <h4 className="font-bold text-red-800 mb-2">Medical Notes</h4>
                      <p className="text-surface-700 bg-white rounded-lg p-3 italic">{selectedIncident.medicalNotes}</p>
                    </div>
                  )}
                </div>

                {/* Root Cause & Corrective Actions */}
                <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                  <h3 className="font-bold text-amber-900 mb-4 flex items-center gap-2">
                    <ClipboardList className="w-5 h-5" />
                    Investigation Details
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase mb-1">Root Cause</p>
                      <p className="text-amber-900">{selectedIncident.rootCause}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase mb-1">Corrective Actions</p>
                      <p className="text-amber-900">{selectedIncident.correctiveActions}</p>
                    </div>
                    {selectedIncident.witnesses.length > 0 && (
                      <div>
                        <p className="text-xs font-bold text-amber-400 uppercase mb-1">Witnesses</p>
                        <p className="text-amber-900">{selectedIncident.witnesses.join(', ')}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-amber-400 uppercase mb-1">Reported By</p>
                      <p className="text-amber-900">{selectedIncident.reportedBy}</p>
                    </div>
                  </div>
                </div>

                {/* Photos & Attachments Section */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                    <Paperclip className="w-5 h-5" />
                    Photos & Attachments
                  </h3>
                  
                  {selectedIncident.attachments && selectedIncident.attachments.length > 0 ? (
                    <div className="space-y-3">
                      {/* Photo Grid */}
                      {selectedIncident.attachments.filter(a => a.type === 'photo').length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Photos</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {selectedIncident.attachments
                              .filter(a => a.type === 'photo')
                              .map(attachment => (
                                <div
                                  key={attachment.id}
                                  className="relative group bg-slate-200 rounded-lg aspect-video flex items-center justify-center overflow-hidden cursor-pointer hover:ring-2 hover:ring-brand-500 transition-all"
                                >
                                  <Image className="w-8 h-8 text-slate-400" />
                                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Eye className="w-6 h-6 text-white" />
                                  </div>
                                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-2 truncate">
                                    {attachment.name}
                                  </div>
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Video List */}
                      {selectedIncident.attachments.filter(a => a.type === 'video').length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Videos</p>
                          <div className="space-y-2">
                            {selectedIncident.attachments
                              .filter(a => a.type === 'video')
                              .map(attachment => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-brand-300 transition-colors cursor-pointer"
                                >
                                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                    <Video className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{attachment.name}</p>
                                    <p className="text-xs text-slate-500">{attachment.size} • {attachment.uploadedBy}</p>
                                  </div>
                                  <Download className="w-4 h-4 text-slate-400 hover:text-brand-600" />
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Document List */}
                      {selectedIncident.attachments.filter(a => a.type === 'document').length > 0 && (
                        <div>
                          <p className="text-xs font-bold text-slate-400 uppercase mb-2">Documents</p>
                          <div className="space-y-2">
                            {selectedIncident.attachments
                              .filter(a => a.type === 'document')
                              .map(attachment => (
                                <div
                                  key={attachment.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200 hover:border-brand-300 transition-colors cursor-pointer"
                                >
                                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                    <File className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-slate-800 truncate">{attachment.name}</p>
                                    <p className="text-xs text-slate-500">{attachment.size} • {attachment.uploadedBy}</p>
                                  </div>
                                  <Download className="w-4 h-4 text-slate-400 hover:text-brand-600" />
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Camera className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="text-slate-500 text-sm">No attachments for this incident</p>
                    </div>
                  )}

                  {/* Newly uploaded attachments */}
                  {(uploadedAttachments[selectedIncident.id] ?? []).length > 0 && (
                    <div className="mt-3 space-y-2">
                      {(uploadedAttachments[selectedIncident.id] ?? []).map(att => (
                        <div key={att.id} className="flex items-center gap-3 p-2 bg-surface-sunken rounded-lg">
                          <File className="w-4 h-4 text-accent flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-text-primary truncate text-sm">{att.name}</p>
                            <p className="text-xs text-text-muted">{att.size} • {att.uploadedAt}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                  <button
                    onClick={handleUploadClick}
                    className="mt-4 w-full px-4 py-3 border-2 border-dashed border-surface-border rounded-xl text-text-secondary hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2"
                  >
                    <Upload className="w-5 h-5" />
                    Upload Photos or Documents
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncidentAnalytics;
