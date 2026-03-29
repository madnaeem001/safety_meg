import React, { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useIncidents, useCreateIncident } from '../../api/hooks/useAPIHooks';
import { 
  AlertTriangle, Heart, Calendar, MapPin, Clock, User, Building2, 
  FileText, Save, CheckCircle2, Plus, Search, Filter, ChevronRight,
  Camera, Send, ArrowLeft, X, ChevronDown, Upload, Eye, History,
  Stethoscope, Briefcase, Shield, Hash, Fingerprint, Phone, Mail,
  Users, Clipboard, Activity, AlertCircle, Info, Paperclip, MapPinned,
  ThermometerSun, HardHat, Factory, FileWarning, BadgeCheck
} from 'lucide-react';
import { BodyDiagram, getBodyPartName } from './BodyDiagram';
import { SignaturePad } from './SignaturePad';
import { AuditTrail, logAuditEntry } from './AuditTrail';

// Combined incident and injury types
const REPORT_CATEGORIES = [
  { id: 'incident', label: 'Incident / Near Miss', icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/5' },
  { id: 'injury', label: 'Injury Report', icon: Heart, color: 'text-danger', bg: 'bg-danger/5' },
];

const INCIDENT_TYPES = [
  'Near Miss', 'First Aid', 'Recordable Injury', 'Lost Time Injury',
  'Fire/Explosion', 'Process Safety Event', 'Environmental Spill',
  'Security Breach', 'Contractor Incident', 'Equipment Failure',
  'Unsafe Condition', 'Unsafe Act', 'Property Damage', 'Other'
];

const INJURY_TYPES = [
  'Laceration/Cut', 'Contusion/Bruise', 'Fracture', 'Sprain/Strain',
  'Burn (Thermal)', 'Burn (Chemical)', 'Chemical Exposure', 'Puncture', 
  'Crushing', 'Electric Shock', 'Heat Stress', 'Cold Stress',
  'Slip/Trip/Fall', 'Overexertion', 'Repetitive Strain', 'Foreign Body',
  'Inhalation', 'Ingestion', 'Eye Injury', 'Hearing Loss', 'Other'
];

const SEVERITY_LEVELS = [
  { id: 'low', label: 'Low', description: 'No injury or minor first aid' },
  { id: 'medium', label: 'Medium', description: 'Medical treatment required' },
  { id: 'high', label: 'High', description: 'Restricted work or lost time' },
  { id: 'critical', label: 'Critical', description: 'Hospitalization or fatality' }
];

const DEPARTMENTS = [
  'Operations', 'Manufacturing', 'Maintenance', 'Logistics', 
  'R&D', 'Administration', 'Warehouse', 'Shipping', 'Quality',
  'Environmental', 'Safety', 'Human Resources', 'IT', 'Contractor'
];

const WORK_ACTIVITIES = [
  'Routine task', 'Non-routine task', 'Maintenance activity',
  'Construction', 'Emergency response', 'Training exercise',
  'Transportation', 'Material handling', 'Machine operation',
  'Chemical handling', 'Hot work', 'Electrical work', 'Other'
];

const PPE_OPTIONS = [
  { id: 'safety_glasses', label: 'Safety Glasses' },
  { id: 'hard_hat', label: 'Hard Hat' },
  { id: 'gloves', label: 'Gloves' },
  { id: 'safety_shoes', label: 'Safety Shoes' },
  { id: 'hearing_protection', label: 'Hearing Protection' },
  { id: 'respirator', label: 'Respirator' },
  { id: 'fall_protection', label: 'Fall Protection' },
  { id: 'face_shield', label: 'Face Shield' },
  { id: 'chemical_suit', label: 'Chemical Suit' },
  { id: 'high_vis_vest', label: 'High-Vis Vest' }
];

const ROOT_CAUSE_CATEGORIES = [
  { category: 'Human Factors', items: ['Lack of training', 'Fatigue', 'Complacency', 'Rushing', 'Distraction', 'Poor communication'] },
  { category: 'Equipment', items: ['Equipment failure', 'Inadequate guarding', 'Poor maintenance', 'Design deficiency', 'Lack of equipment'] },
  { category: 'Environment', items: ['Poor housekeeping', 'Inadequate lighting', 'Noise', 'Temperature extremes', 'Wet/slippery surface'] },
  { category: 'Management', items: ['Inadequate procedures', 'Lack of supervision', 'Production pressure', 'Inadequate risk assessment', 'Poor planning'] }
];

// Helper to map backend incident to report list item shape
const mapBackendToReport = (r: any) => ({
  id: String(r.id ?? ''),
  category: (r.incidentType?.toLowerCase().includes('injury') ||
             r.incidentType === 'Recordable Injury'
    ? 'injury' : 'incident') as 'incident' | 'injury',
  title: r.description?.slice(0, 60) || r.incidentType || 'Incident',
  severity: (r.severity?.toLowerCase() ?? 'medium') as 'low' | 'medium' | 'high' | 'critical',
  status: r.status ?? 'open',
  date: r.incidentDate ?? '',
  assignee: r.assignedTo ?? '',
  department: r.department ?? '',
  type: r.incidentType ?? '',
  hasPrimarySignature: false,
  hasWitnessSignature: false,
  hasSupervisorSignature: false,
});

// Mock existing reports
const mockReports = [
  { id: 'INC-2026-001', category: 'incident', title: 'Slip hazard in warehouse', severity: 'medium', status: 'open', date: '2026-01-05', assignee: 'John Smith', department: 'Operations', type: 'Near Miss', hasPrimarySignature: true, hasWitnessSignature: true, hasSupervisorSignature: false },
  { id: 'INJ-2026-002', category: 'injury', title: 'Hand laceration from equipment', severity: 'high', status: 'investigating', date: '2026-01-04', assignee: 'Sarah Johnson', department: 'Manufacturing', type: 'Laceration/Cut', bodyParts: ['left-hand'], hasPrimarySignature: true, hasWitnessSignature: true, hasSupervisorSignature: true },
  { id: 'INC-2026-003', category: 'incident', title: 'Chemical spill in lab', severity: 'critical', status: 'resolved', date: '2026-01-03', assignee: 'Mike Davis', department: 'R&D', type: 'Environmental Spill', hasPrimarySignature: true, hasWitnessSignature: false, hasSupervisorSignature: true },
  { id: 'INJ-2026-004', category: 'injury', title: 'Back strain during lifting', severity: 'medium', status: 'capa-pending', date: '2026-01-02', assignee: 'Emily Chen', department: 'Warehouse', type: 'Sprain/Strain', bodyParts: ['lower-back'], hasPrimarySignature: true, hasWitnessSignature: true, hasSupervisorSignature: true },
  { id: 'INC-2026-005', category: 'incident', title: 'Near miss - falling object', severity: 'low', status: 'closed', date: '2026-01-01', assignee: 'Robert Wilson', department: 'Maintenance', type: 'Near Miss', hasPrimarySignature: true, hasWitnessSignature: false, hasSupervisorSignature: true },
];

interface CombinedIncidentInjuryReportProps {
  onNavigate?: (route: string) => void;
}

export const CombinedIncidentInjuryReport: React.FC<CombinedIncidentInjuryReportProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<'list' | 'new' | 'detail'>('list');
  const [selectedReport, setSelectedReport] = useState<typeof mockReports[0] | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'incident' | 'injury'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showAuditTrail, setShowAuditTrail] = useState(false);
  
  // New report form state
  const [reportCategory, setReportCategory] = useState<'incident' | 'injury'>('incident');
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [selectedPPE, setSelectedPPE] = useState<string[]>([]);
  const [selectedRootCauses, setSelectedRootCauses] = useState<string[]>([]);
  
  // Signature states
  const [reporterSignature, setReporterSignature] = useState('');
  const [witnessSignature, setWitnessSignature] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  
  const [formData, setFormData] = useState({
    // Basic Info
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    specificLocation: '',
    department: '',
    workActivity: '',
    
    // Reporter Info
    reportedBy: '',
    reporterEmployeeId: '',
    reporterPhone: '',
    reporterEmail: '',
    reporterJobTitle: '',
    
    // Injured Person Info (for injuries)
    injuredPerson: '',
    injuredEmployeeId: '',
    injuredJobTitle: '',
    yearsExperience: '',
    employmentType: 'full-time',
    
    // Incident Details
    type: '',
    severity: 'medium',
    description: '',
    taskBeingPerformed: '',
    
    // Contributing Factors
    environmentalConditions: '',
    equipmentInvolved: '',
    
    // Injury Specifics
    injuryType: '',
    natureOfInjury: '',
    treatmentProvided: '',
    treatedBy: '',
    medicalFacility: '',
    transportMethod: '',
    
    // Response & Actions
    immediateActions: '',
    emergencyServicesRequired: false,
    areaSectioned: false,
    evidencePreserved: false,
    
    // Witnesses
    witnesses: '',
    witnessStatements: '',
    
    // OSHA/Regulatory
    oshaRecordable: false,
    oshaFormRequired: '',
    daysAwayFromWork: '',
    daysRestricted: '',
    
    // Supervisor Info
    supervisorName: '',
    supervisorNotifiedTime: '',
    
    // Additional
    correctiveActionsRecommended: '',
    followUpRequired: false,
    followUpDate: '',
    additionalNotes: ''
  });
  
  const [submitted, setSubmitted] = useState(false);

  // API hooks
  const { data: apiReports } = useIncidents({ limit: 100 });
  const createIncident = useCreateIncident();

  // Filter reports — merge mock + API data
  const filteredReports = useMemo(() => {
    const backendReports = (apiReports || []).map(mapBackendToReport);
    let reports = [...mockReports, ...backendReports];
    if (selectedCategory !== 'all') {
      reports = reports.filter(r => r.category === selectedCategory);
    }
    if (searchQuery) {
      reports = reports.filter(r =>
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return reports;
  }, [selectedCategory, searchQuery, apiReports]);

  const handleBodyPartClick = (partId: string) => {
    setSelectedBodyParts(prev => 
      prev.includes(partId) 
        ? prev.filter(p => p !== partId)
        : [...prev, partId]
    );
  };

  const handlePPEToggle = (ppeId: string) => {
    setSelectedPPE(prev =>
      prev.includes(ppeId)
        ? prev.filter(p => p !== ppeId)
        : [...prev, ppeId]
    );
  };

  const handleRootCauseToggle = (cause: string) => {
    setSelectedRootCauses(prev =>
      prev.includes(cause)
        ? prev.filter(c => c !== cause)
        : [...prev, cause]
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments(prev => [...prev, ...Array.from(e.target.files!)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const capitalizedSeverity = (formData.severity.charAt(0).toUpperCase() + formData.severity.slice(1)) as 'Low' | 'Medium' | 'High' | 'Critical';

    const payload: any = {
      incidentDate: formData.date,
      incidentTime: formData.time,
      location: formData.location || 'Unknown',
      department: formData.department || undefined,
      incidentType: formData.type || (reportCategory === 'injury' ? 'Recordable Injury' : 'Near Miss'),
      severity: capitalizedSeverity,
      description: formData.description || `${reportCategory === 'injury' ? 'Injury' : 'Incident'} report submitted`,
      immediateActions: formData.immediateActions || undefined,
      witnesses: formData.witnesses || undefined,
      rootCauses: selectedRootCauses.length ? selectedRootCauses.join(', ') : undefined,
      correctiveActions: formData.correctiveActionsRecommended || undefined,
      assignedTo: formData.supervisorName || undefined,
    };

    if (reportCategory === 'injury') {
      payload.bodyPart = selectedBodyParts.join(', ') || 'unspecified';
      payload.injuryType = formData.injuryType || 'Other';
      payload.treatmentRequired = !!formData.treatmentProvided;
      payload.medicalAttention = !!formData.medicalFacility;
      payload.daysLost = formData.daysAwayFromWork ? Number(formData.daysAwayFromWork) : 0;
    }

    await logAuditEntry({
      action: 'CREATE',
      userId: 'USR-CURRENT',
      userName: formData.reportedBy || 'Current User',
      userRole: formData.reporterJobTitle || 'Reporter',
      entityType: reportCategory,
      entityId: `${reportCategory === 'injury' ? 'INJ' : 'INC'}-${new Date().getFullYear()}-${Date.now().toString().slice(-3)}`,
      entityTitle: `${formData.type} - ${formData.location}`,
      details: 'New report created with digital signatures',
      ipAddress: '192.168.1.100'
    });

    await createIncident.mutate(payload);

    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveView('list');
      resetForm();
    }, 2000);
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      location: '',
      specificLocation: '',
      department: '',
      workActivity: '',
      reportedBy: '',
      reporterEmployeeId: '',
      reporterPhone: '',
      reporterEmail: '',
      reporterJobTitle: '',
      injuredPerson: '',
      injuredEmployeeId: '',
      injuredJobTitle: '',
      yearsExperience: '',
      employmentType: 'full-time',
      type: '',
      severity: 'medium',
      description: '',
      taskBeingPerformed: '',
      environmentalConditions: '',
      equipmentInvolved: '',
      injuryType: '',
      natureOfInjury: '',
      treatmentProvided: '',
      treatedBy: '',
      medicalFacility: '',
      transportMethod: '',
      immediateActions: '',
      emergencyServicesRequired: false,
      areaSectioned: false,
      evidencePreserved: false,
      witnesses: '',
      witnessStatements: '',
      oshaRecordable: false,
      oshaFormRequired: '',
      daysAwayFromWork: '',
      daysRestricted: '',
      supervisorName: '',
      supervisorNotifiedTime: '',
      correctiveActionsRecommended: '',
      followUpRequired: false,
      followUpDate: '',
      additionalNotes: ''
    });
    setSelectedBodyParts([]);
    setAttachments([]);
    setSelectedPPE([]);
    setSelectedRootCauses([]);
    setReporterSignature('');
    setWitnessSignature('');
    setSupervisorSignature('');
    setCurrentStep(1);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'bg-danger/10 text-danger border-danger/20';
      case 'high': return 'bg-warning/10 text-warning border-warning/20';
      case 'medium': return 'bg-warning/5 text-warning border-warning/10';
      case 'low': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-surface-sunken text-text-muted border-surface-border';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-accent/10 text-accent';
      case 'investigating': return 'bg-ai/10 text-ai';
      case 'resolved': case 'closed': return 'bg-success/10 text-success';
      case 'capa-pending': return 'bg-warning/10 text-warning';
      default: return 'bg-surface-sunken text-text-muted';
    }
  };

  const totalSteps = reportCategory === 'injury' ? 6 : 5;

  // Success state
  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface-overlay p-8 rounded-3xl text-center space-y-4 max-w-xs shadow-soft border border-surface-border"
        >
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Report Submitted</h2>
          <p className="text-text-muted text-sm">
            {reportCategory === 'injury' 
              ? 'The injury report has been logged with digital signatures and audit trail.'
              : 'The incident report has been logged with digital signatures and audit trail.'}
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-text-muted">
            <Shield className="w-4 h-4" />
            <span>Audit trail created</span>
          </div>
        </motion.div>
      </div>
    );
  }

  // Audit Trail View
  if (showAuditTrail) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowAuditTrail(false)}
            className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-text-secondary" />
          </button>
          <h2 className="text-xl font-bold text-text-primary">Audit Trail</h2>
        </div>
        <AuditTrail />
      </motion.div>
    );
  }

  // New Report Form
  if (activeView === 'new') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { setActiveView('list'); resetForm(); }}
              className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-text-primary">New Report</h2>
              <p className="text-sm text-text-muted">Step {currentStep} of {totalSteps}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-text-muted">Auto-save enabled</span>
            <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-surface-border h-2 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-accent"
            initial={{ width: 0 }}
            animate={{ width: `${(currentStep / totalSteps) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Category Selection (Step 1) */}
        {currentStep === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-surface-overlay rounded-2xl p-6 border border-surface-border shadow-soft">
              <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">Report Type</p>
              <div className="grid grid-cols-2 gap-4">
                {REPORT_CATEGORIES.map(cat => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setReportCategory(cat.id as 'incident' | 'injury')}
                    className={`p-6 rounded-xl border-2 transition-all flex flex-col items-center gap-3 ${
                      reportCategory === cat.id 
                        ? 'border-accent bg-accent/5' 
                        : 'border-surface-border hover:border-accent/20'
                    }`}
                  >
                    <cat.icon className={`w-8 h-8 ${reportCategory === cat.id ? 'text-accent' : cat.color}`} />
                    <span className={`text-sm font-semibold text-center ${reportCategory === cat.id ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {cat.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setActiveView('list'); resetForm(); }}
                className="flex-1 py-3 px-6 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 px-6 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/80 transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Basic Information (Step 2) */}
        {currentStep === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="bg-surface-overlay rounded-2xl p-6 border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Calendar className="w-5 h-5 text-accent" />
                Date, Time & Location
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Date *</label>
                  <input 
                    type="date" 
                    required 
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Time *</label>
                  <input 
                    type="time" 
                    required
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  >
                    <option value="">Select</option>
                    {DEPARTMENTS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Work Activity</label>
                  <select
                    value={formData.workActivity}
                    onChange={(e) => setFormData({ ...formData, workActivity: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  >
                    <option value="">Select</option>
                    {WORK_ACTIVITIES.map(activity => (
                      <option key={activity} value={activity}>{activity}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Location / Building *</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Building, Area, Zone" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Specific Location</label>
                  <input 
                    type="text" 
                    placeholder="Machine #, Workstation, Floor" 
                    value={formData.specificLocation}
                    onChange={(e) => setFormData({ ...formData, specificLocation: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="bg-surface-overlay rounded-2xl p-6 border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <User className="w-5 h-5 text-accent" />
                Reporter Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Your Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Full Name" 
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Employee ID</label>
                  <input 
                    type="text" 
                    placeholder="EMP-XXXXX" 
                    value={formData.reporterEmployeeId}
                    onChange={(e) => setFormData({ ...formData, reporterEmployeeId: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Job Title</label>
                  <input 
                    type="text" 
                    placeholder="Your Position" 
                    value={formData.reporterJobTitle}
                    onChange={(e) => setFormData({ ...formData, reporterJobTitle: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Phone</label>
                  <input 
                    type="tel" 
                    placeholder="Contact Number" 
                    value={formData.reporterPhone}
                    onChange={(e) => setFormData({ ...formData, reporterPhone: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Email</label>
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    value={formData.reporterEmail}
                    onChange={(e) => setFormData({ ...formData, reporterEmail: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Injured Person Info (for injury reports) */}
            {reportCategory === 'injury' && (
              <div className="bg-surface-overlay rounded-2xl p-6 border border-surface-border shadow-soft space-y-4">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <Heart className="w-5 h-5 text-danger" />
                  Injured Person Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Injured Person Name *</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Full Name" 
                      value={formData.injuredPerson}
                      onChange={(e) => setFormData({ ...formData, injuredPerson: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Employee ID</label>
                    <input 
                      type="text" 
                      placeholder="EMP-XXXXX" 
                      value={formData.injuredEmployeeId}
                      onChange={(e) => setFormData({ ...formData, injuredEmployeeId: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Job Title</label>
                    <input 
                      type="text" 
                      placeholder="Position" 
                      value={formData.injuredJobTitle}
                      onChange={(e) => setFormData({ ...formData, injuredJobTitle: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Years of Experience</label>
                    <input 
                      type="number" 
                      placeholder="Years" 
                      min="0"
                      value={formData.yearsExperience}
                      onChange={(e) => setFormData({ ...formData, yearsExperience: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Employment Type</label>
                    <select
                      value={formData.employmentType}
                      onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    >
                      <option value="full-time">Full-Time</option>
                      <option value="part-time">Part-Time</option>
                      <option value="contractor">Contractor</option>
                      <option value="temporary">Temporary</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="flex-1 py-3 px-6 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 px-6 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/80 transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Incident/Injury Details (Step 3) */}
        {currentStep === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Body Diagram for Injury */}
            {reportCategory === 'injury' && (
              <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-danger" />
                  Body Part(s) Affected
                </h3>
                <p className="text-sm text-text-muted mb-4">Click on the diagram to select affected areas. Multiple selections allowed.</p>
                
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <BodyDiagram
                    selectedParts={selectedBodyParts}
                    onPartClick={handleBodyPartClick}
                    multiSelect={true}
                    size="md"
                  />
                  
                  <div className="flex-1 space-y-4 w-full">
                    <div>
                      <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Selected Body Parts</label>
                      <div className="mt-2 min-h-[60px] p-3 bg-surface-sunken rounded-xl border border-surface-border">
                        {selectedBodyParts.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {selectedBodyParts.map(part => (
                              <span key={part} className="px-3 py-1 bg-danger/10 text-danger text-sm font-semibold rounded-full">
                                {getBodyPartName(part)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-text-muted">No body parts selected</p>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase">Injury Type *</label>
                        <select
                          required
                          value={formData.injuryType}
                          onChange={(e) => setFormData({ ...formData, injuryType: e.target.value, type: e.target.value })}
                          className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                        >
                          <option value="">Select Type</option>
                          {INJURY_TYPES.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-text-muted uppercase">Nature of Injury</label>
                        <input 
                          type="text" 
                          placeholder="e.g., 2cm laceration" 
                          value={formData.natureOfInjury}
                          onChange={(e) => setFormData({ ...formData, natureOfInjury: e.target.value })}
                          className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Incident Type Selection */}
            {reportCategory === 'incident' && (
              <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft">
                <h3 className="font-bold text-text-primary mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                  Incident Type *
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                  {INCIDENT_TYPES.map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setFormData({ ...formData, type })}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        formData.type === type
                          ? 'bg-accent text-text-onAccent'
                          : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Severity & Description */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-accent" />
                Severity & Description
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Severity Level *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {SEVERITY_LEVELS.map(level => (
                    <button
                      key={level.id}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level.id })}
                      className={`p-3 rounded-xl text-sm transition-all border-2 ${
                        formData.severity === level.id
                          ? getSeverityColor(level.id) + ' border-current'
                          : 'bg-surface-sunken text-text-secondary border-transparent hover:bg-surface-overlay'
                      }`}
                    >
                      <div className="font-semibold">{level.label}</div>
                      <div className="text-xs opacity-70">{level.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Description of Event *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what happened in detail. Include what the person was doing, what went wrong, and the outcome..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Task Being Performed</label>
                <input 
                  type="text" 
                  placeholder="What specific task was being performed when the incident occurred?" 
                  value={formData.taskBeingPerformed}
                  onChange={(e) => setFormData({ ...formData, taskBeingPerformed: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                />
              </div>
            </div>

            {/* PPE Section */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <HardHat className="w-5 h-5 text-accent" />
                PPE Being Worn
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {PPE_OPTIONS.map(ppe => (
                  <button
                    key={ppe.id}
                    type="button"
                    onClick={() => handlePPEToggle(ppe.id)}
                    className={`p-2.5 rounded-xl text-sm font-medium transition-all ${
                      selectedPPE.includes(ppe.id)
                        ? 'bg-accent text-text-onAccent'
                        : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
                    }`}
                  >
                    {ppe.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="flex-1 py-3 px-6 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex-1 py-3 px-6 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/80 transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Contributing Factors & Root Causes (Step 4) */}
        {currentStep === 4 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Medical Treatment (for injuries) */}
            {reportCategory === 'injury' && (
              <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-accent" />
                  Medical Treatment
                </h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Treatment Provided</label>
                  <textarea
                    rows={2}
                    placeholder="Describe first aid or medical treatment provided..."
                    value={formData.treatmentProvided}
                    onChange={(e) => setFormData({ ...formData, treatmentProvided: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Treated By</label>
                    <input 
                      type="text" 
                      placeholder="Name/Title" 
                      value={formData.treatedBy}
                      onChange={(e) => setFormData({ ...formData, treatedBy: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Medical Facility</label>
                    <input 
                      type="text" 
                      placeholder="Hospital/Clinic Name" 
                      value={formData.medicalFacility}
                      onChange={(e) => setFormData({ ...formData, medicalFacility: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-text-muted uppercase">Transport Method</label>
                    <select
                      value={formData.transportMethod}
                      onChange={(e) => setFormData({ ...formData, transportMethod: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                    >
                      <option value="">Select</option>
                      <option value="none">None Required</option>
                      <option value="self">Self-Transport</option>
                      <option value="company">Company Vehicle</option>
                      <option value="ambulance">Ambulance</option>
                      <option value="helicopter">Air Medical</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Contributing Factors */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Factory className="w-5 h-5 text-accent" />
                Contributing Factors
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Environmental Conditions</label>
                  <input 
                    type="text" 
                    placeholder="Weather, lighting, noise, temperature..." 
                    value={formData.environmentalConditions}
                    onChange={(e) => setFormData({ ...formData, environmentalConditions: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Equipment/Machinery Involved</label>
                  <input 
                    type="text" 
                    placeholder="Equipment name, ID, model..." 
                    value={formData.equipmentInvolved}
                    onChange={(e) => setFormData({ ...formData, equipmentInvolved: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Root Cause Analysis */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <FileWarning className="w-5 h-5 text-accent" />
                Preliminary Root Cause(s)
              </h3>
              <p className="text-sm text-text-muted">Select all that may apply. A full investigation will follow.</p>
              
              {ROOT_CAUSE_CATEGORIES.map(category => (
                <div key={category.category} className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">{category.category}</label>
                  <div className="flex flex-wrap gap-2">
                    {category.items.map(item => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => handleRootCauseToggle(item)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          selectedRootCauses.includes(item)
                            ? 'bg-warning text-text-onAccent'
                            : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
                        }`}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="flex-1 py-3 px-6 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(5)}
                className="flex-1 py-3 px-6 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/80 transition-colors"
              >
                Continue
              </button>
            </div>
          </motion.div>
        )}

        {/* Response, Witnesses & OSHA (Step 5) */}
        {currentStep === 5 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            {/* Immediate Response */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Activity className="w-5 h-5 text-accent" />
                Immediate Response
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Immediate Actions Taken *</label>
                <textarea
                  required
                  rows={3}
                  placeholder="What actions were taken immediately after the incident?"
                  value={formData.immediateActions}
                  onChange={(e) => setFormData({ ...formData, immediateActions: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <label className="flex items-center gap-3 p-3 bg-surface-sunken rounded-xl border border-surface-border cursor-pointer hover:bg-surface-overlay">
                  <input
                    type="checkbox"
                    checked={formData.emergencyServicesRequired}
                    onChange={(e) => setFormData({ ...formData, emergencyServicesRequired: e.target.checked })}
                    className="w-5 h-5 text-accent rounded"
                  />
                  <span className="text-sm font-medium text-text-secondary">Emergency Services Called</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-surface-sunken rounded-xl border border-surface-border cursor-pointer hover:bg-surface-overlay">
                  <input
                    type="checkbox"
                    checked={formData.areaSectioned}
                    onChange={(e) => setFormData({ ...formData, areaSectioned: e.target.checked })}
                    className="w-5 h-5 text-accent rounded"
                  />
                  <span className="text-sm font-medium text-text-secondary">Area Sectioned Off</span>
                </label>
                <label className="flex items-center gap-3 p-3 bg-surface-sunken rounded-xl border border-surface-border cursor-pointer hover:bg-surface-overlay">
                  <input
                    type="checkbox"
                    checked={formData.evidencePreserved}
                    onChange={(e) => setFormData({ ...formData, evidencePreserved: e.target.checked })}
                    className="w-5 h-5 text-accent rounded"
                  />
                  <span className="text-sm font-medium text-text-secondary">Evidence Preserved</span>
                </label>
              </div>
            </div>

            {/* Witnesses */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Witnesses
              </h3>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Witness Names & Contact Info</label>
                <input 
                  type="text" 
                  placeholder="Name (Phone), Name (Phone), ..." 
                  value={formData.witnesses}
                  onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Witness Statements</label>
                <textarea
                  rows={3}
                  placeholder="Summary of witness accounts..."
                  value={formData.witnessStatements}
                  onChange={(e) => setFormData({ ...formData, witnessStatements: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none"
                />
              </div>
            </div>

            {/* Supervisor Notification */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-accent" />
                Supervisor Notification
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Supervisor Name</label>
                  <input 
                    type="text" 
                    placeholder="Supervisor's Name" 
                    value={formData.supervisorName}
                    onChange={(e) => setFormData({ ...formData, supervisorName: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Time Notified</label>
                  <input 
                    type="time" 
                    value={formData.supervisorNotifiedTime}
                    onChange={(e) => setFormData({ ...formData, supervisorNotifiedTime: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>

            {/* OSHA/Regulatory Information */}
            {reportCategory === 'injury' && (
              <div className="bg-warning/5 p-6 rounded-2xl border border-warning/20 space-y-4">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <Shield className="w-5 h-5 text-warning" />
                  OSHA Recordkeeping
                </h3>
                
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={formData.oshaRecordable}
                    onChange={(e) => setFormData({ ...formData, oshaRecordable: e.target.checked })}
                    className="w-5 h-5 text-warning rounded"
                  />
                  <span className="text-sm font-medium text-warning">OSHA Recordable Incident</span>
                </label>

                {formData.oshaRecordable && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-warning uppercase">Form Required</label>
                      <select
                        value={formData.oshaFormRequired}
                        onChange={(e) => setFormData({ ...formData, oshaFormRequired: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-overlay border border-warning/20 rounded-xl text-sm"
                      >
                        <option value="">Select</option>
                        <option value="300">OSHA 300 Log</option>
                        <option value="301">OSHA 301</option>
                        <option value="300a">OSHA 300A Summary</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-warning uppercase">Days Away from Work</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0" 
                        value={formData.daysAwayFromWork}
                        onChange={(e) => setFormData({ ...formData, daysAwayFromWork: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-overlay border border-warning/20 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-warning uppercase">Days Restricted</label>
                      <input 
                        type="number" 
                        min="0"
                        placeholder="0" 
                        value={formData.daysRestricted}
                        onChange={(e) => setFormData({ ...formData, daysRestricted: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-overlay border border-warning/20 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Attachments */}
            <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4">
              <h3 className="font-bold text-text-primary flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-accent" />
                Attachments
              </h3>
              
              <label className="flex flex-col items-center justify-center p-6 bg-surface-sunken border-2 border-dashed border-surface-border rounded-xl cursor-pointer hover:bg-surface-overlay transition-colors">
                <Upload className="w-8 h-8 text-text-muted mb-2" />
                <span className="text-sm text-text-secondary">Click to upload photos or documents</span>
                <span className="text-xs text-text-muted">PNG, JPG, PDF up to 10MB each</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*,.pdf"
                  className="hidden" 
                  onChange={handleFileUpload}
                />
              </label>

              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-surface-sunken rounded-lg">
                      <FileText className="w-4 h-4 text-text-muted" />
                      <span className="text-sm text-text-secondary truncate max-w-[150px]">{file.name}</span>
                      <button 
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="p-1 hover:bg-surface-overlay rounded"
                      >
                        <X className="w-4 h-4 text-text-muted" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setCurrentStep(4)}
                className="flex-1 py-3 px-6 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(reportCategory === 'injury' ? 6 : 5)}
                className="flex-1 py-3 px-6 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/80 transition-colors"
              >
                {reportCategory === 'injury' ? 'Continue' : 'Review & Sign'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Digital Signatures (Final Step) */}
        {((reportCategory === 'injury' && currentStep === 6) || (reportCategory === 'incident' && currentStep === 5)) && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <form onSubmit={handleSubmit}>
              {/* Corrective Actions */}
              <div className="bg-surface-overlay p-6 rounded-2xl border border-surface-border shadow-soft space-y-4 mb-6">
                <h3 className="font-bold text-text-primary flex items-center gap-2">
                  <Clipboard className="w-5 h-5 text-accent" />
                  Recommended Actions & Follow-up
                </h3>
                
                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Corrective Actions Recommended</label>
                  <textarea
                    rows={3}
                    placeholder="List recommended actions to prevent recurrence..."
                    value={formData.correctiveActionsRecommended}
                    onChange={(e) => setFormData({ ...formData, correctiveActionsRecommended: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none"
                  />
                </div>

                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={formData.followUpRequired}
                      onChange={(e) => setFormData({ ...formData, followUpRequired: e.target.checked })}
                      className="w-5 h-5 text-accent rounded"
                    />
                    <span className="text-sm font-medium text-text-secondary">Follow-up Required</span>
                  </label>
                  
                  {formData.followUpRequired && (
                    <div className="flex-1 max-w-xs">
                      <input 
                        type="date" 
                        value={formData.followUpDate}
                        onChange={(e) => setFormData({ ...formData, followUpDate: e.target.value })}
                        className="w-full px-3 py-2 bg-surface-sunken border border-surface-border rounded-xl text-sm"
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-text-muted uppercase">Additional Notes</label>
                  <textarea
                    rows={2}
                    placeholder="Any additional information..."
                    value={formData.additionalNotes}
                    onChange={(e) => setFormData({ ...formData, additionalNotes: e.target.value })}
                    className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none"
                  />
                </div>
              </div>

              {/* Digital Signatures */}
              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-text-primary flex items-center gap-2">
                    <Fingerprint className="w-5 h-5 text-accent" />
                    Digital Signatures
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-accent bg-accent/10 px-2 py-1 rounded-full">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    <span>Legally Binding</span>
                  </div>
                </div>
                
                <p className="text-sm text-text-secondary">
                  By signing below, you certify that the information provided is accurate to the best of your knowledge. 
                  All signatures are timestamped and logged in the audit trail.
                </p>

                <div className="space-y-4">
                  {/* Reporter Signature */}
                  <SignaturePad
                    value={reporterSignature}
                    onChange={setReporterSignature}
                    label="Reporter Signature"
                    name={formData.reportedBy}
                    required
                  />

                  {/* Witness Signature (optional) */}
                  <SignaturePad
                    value={witnessSignature}
                    onChange={setWitnessSignature}
                    label="Witness Signature (Optional)"
                    name={formData.witnesses.split(',')[0]?.trim()}
                  />

                  {/* Supervisor Signature */}
                  <SignaturePad
                    value={supervisorSignature}
                    onChange={setSupervisorSignature}
                    label="Supervisor Signature"
                    name={formData.supervisorName}
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-accent bg-surface-overlay/50 p-3 rounded-lg">
                  <Hash className="w-4 h-4" />
                  <span>Signatures will be cryptographically hashed and stored with tamper-evident logging</span>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setCurrentStep(reportCategory === 'injury' ? 5 : 4)}
                  className="flex-1 py-3 px-6 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={!reporterSignature}
                  className="flex-1 py-3 px-6 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/80 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-5 h-5" />
                  Submit Report
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </motion.div>
    );
  }

  // List View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Incident & Injury Reports</h2>
          <p className="text-sm text-text-muted">Unified reporting with digital signatures and audit trail</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAuditTrail(true)}
            className="px-4 py-2.5 bg-surface-sunken text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors flex items-center gap-2"
          >
            <History className="w-5 h-5" />
            Audit Trail
          </button>
          <button
            onClick={() => setActiveView('new')}
            className="px-4 py-2.5 bg-accent text-text-onAccent font-semibold rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Report
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-overlay rounded-2xl p-4 border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors ${showFilters ? 'bg-accent/5 border-accent/20 text-accent' : 'bg-surface-sunken border-surface-border text-text-secondary'}`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-2">
          {[
            { id: 'all', label: 'All Reports', count: mockReports.length },
            { id: 'incident', label: 'Incidents', count: mockReports.filter(r => r.category === 'incident').length },
            { id: 'injury', label: 'Injuries', count: mockReports.filter(r => r.category === 'injury').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategory(tab.id as 'all' | 'incident' | 'injury')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors flex items-center gap-2 ${
                selectedCategory === tab.id
                  ? 'bg-accent text-text-onAccent'
                  : 'bg-surface-overlay text-text-secondary hover:bg-surface-raised'
              }`}
            >
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs ${
                selectedCategory === tab.id ? 'bg-surface-overlay/20' : 'bg-surface-border'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report, index) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-surface-overlay rounded-xl p-4 border border-surface-border shadow-soft hover:shadow-card cursor-pointer transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                report.category === 'injury' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
              }`}>
                {report.category === 'injury' ? <Heart className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs font-bold text-text-muted">{report.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getSeverityColor(report.severity)}`}>
                    {report.severity}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getStatusColor(report.status)}`}>
                    {report.status.replace('-', ' ')}
                  </span>
                </div>
                <h4 className="font-semibold text-text-primary truncate">{report.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {report.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5" />
                    {report.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {report.assignee}
                  </span>
                </div>
                
                {/* Signature Status */}
                <div className="flex items-center gap-2 mt-2">
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    report.hasPrimarySignature ? 'bg-success/10 text-success' : 'bg-surface-sunken text-text-muted'
                  }`}>
                    <Fingerprint className="w-3 h-3" />
                    Reporter
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    report.hasWitnessSignature ? 'bg-success/10 text-success' : 'bg-surface-sunken text-text-muted'
                  }`}>
                    <Fingerprint className="w-3 h-3" />
                    Witness
                  </span>
                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
                    report.hasSupervisorSignature ? 'bg-success/10 text-success' : 'bg-surface-sunken text-text-muted'
                  }`}>
                    <Fingerprint className="w-3 h-3" />
                    Supervisor
                  </span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-accent transition-colors" />
            </div>
          </motion.div>
        ))}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 bg-surface-sunken rounded-2xl">
            <AlertTriangle className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-text-muted">No reports found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
