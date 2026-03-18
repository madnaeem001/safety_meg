import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCreateIncident } from '../api/hooks/useAPIHooks';
import { aiAssistantService, incidentService } from '../api/services/apiService';
import { BodyDiagram, getBodyPartName } from '../components/safety/BodyDiagram';
import { SignatureCanvas } from '../components/safety/SignatureCanvas';
import { FishboneDiagram } from '../components/safety/FishboneDiagram';
import { FiveWhysAnalysis } from '../components/safety/FiveWhysAnalysis';
import { InjurySeverityCalculator } from '../components/safety/InjurySeverityCalculator';
import { LessonsLearnedPanel } from '../components/safety/LessonsLearnedPanel';
import { 
  AlertTriangle, ArrowLeft, Camera, Send, CheckCircle2, 
  Calendar, Clock, User, Building2, FileText, Heart,
  MapPin, Shield, Car, HardHat, Users, Clipboard,
  ChevronDown, ChevronUp, Sparkles, Download, Printer,
  Stethoscope, Activity, AlertCircle, Eye, Target,
  Brain, Loader2,
} from 'lucide-react';
import { exportIncidentReportToPDF, generateReportId } from '../utils/exports/incidentPdfExport';

// Report sections
const INCIDENT_TYPES = [
  'Near Miss', 'First Aid', 'Recordable Injury', 'Lost Time Injury',
  'Property Damage', 'Environmental Spill', 'Fire/Explosion',
  'Vehicle Incident', 'Process Safety Event', 'Security Breach'
];

const INJURY_TYPES = [
  'Laceration/Cut', 'Contusion/Bruise', 'Fracture', 'Sprain/Strain',
  'Burn', 'Chemical Exposure', 'Puncture', 'Crushing',
  'Electric Shock', 'Heat Stress', 'Slip/Trip/Fall', 'Overexertion'
];

const SEVERITY_LEVELS = ['Minor', 'Moderate', 'Serious', 'Critical'];

const DEPARTMENTS = [
  'Operations', 'Maintenance', 'Production', 'Warehouse',
  'Transportation', 'Administration', 'Engineering', 'Quality Control'
];

const PPE_OPTIONS = [
  'Safety Glasses', 'Hard Hat', 'Gloves', 'Safety Shoes',
  'Hearing Protection', 'Respirator', 'Fall Protection', 'Face Shield',
  'Chemical Suit', 'High-Vis Vest'
];

export const FullIncidentReport: React.FC = () => {
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);
  const [currentSection, setCurrentSection] = useState(0);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0]));
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const createIncident = useCreateIncident();
  const [selectedPPE, setSelectedPPE] = useState<string[]>([]);

  // ── AI Assist ─────────────────────────────────────────
  const [aiField, setAiField] = useState<'description' | 'rootCauses' | 'correctiveActions' | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiLoading, setAiLoading] = useState(false);

  const requestAI = async (field: 'description' | 'rootCauses' | 'correctiveActions') => {
    setAiField(field);
    setAiSuggestions([]);
    setAiLoading(true);
    try {
      const response = await aiAssistantService.getSuggestions({
        industry: formData.department || 'General',
        category: formData.incidentType || 'Safety',
        checklistItems: [
          formData.description,
          formData.taskBeingPerformed,
          formData.equipmentInvolved,
        ].filter(Boolean),
      });
      setAiSuggestions(response.data?.suggestions ?? []);
    } catch {
      setAiSuggestions([]);
    } finally {
      setAiLoading(false);
    }
  };

  const applyAISuggestion = (suggestion: string) => {
    if (!aiField) return;
    setFormData((prev) => ({ ...prev, [aiField]: suggestion }));
    setAiSuggestions([]);
    setAiField(null);
  };
  // ─────────────────────────────────────────────────────
  
  // Signature states
  const [reporterSignature, setReporterSignature] = useState('');
  const [witnessSignature, setWitnessSignature] = useState('');
  const [supervisorSignature, setSupervisorSignature] = useState('');
  
  // Root cause analysis states
  const [fiveWhysData, setFiveWhysData] = useState<string[]>(['', '', '', '', '']);
  const [fishboneData, setFishboneData] = useState<{ category: string; causes: string[] }[]>([]);
  const [lessonsLearned, setLessonsLearned] = useState('');
  const [showRootCauseTools, setShowRootCauseTools] = useState(false);

  // Photo upload state
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - photoFiles.length;
    const accepted = files.slice(0, remaining);
    setPhotoFiles(prev => [...prev, ...accepted]);
    accepted.forEach(file => {
      const url = URL.createObjectURL(file);
      setPhotoUrls(prev => [...prev, url]);
    });
    // reset input so same file can be re-added after removal
    e.target.value = '';
  };

  const removePhoto = (index: number) => {
    URL.revokeObjectURL(photoUrls[index]);
    setPhotoFiles(prev => prev.filter((_, i) => i !== index));
    setPhotoUrls(prev => prev.filter((_, i) => i !== index));
  };
  
  const [formData, setFormData] = useState({
    // Incident Info
    incidentDate: new Date().toISOString().split('T')[0],
    incidentTime: new Date().toTimeString().slice(0, 5),
    location: '',
    department: '',
    incidentType: '',
    severity: '',
    description: '',
    
    // Involved Persons
    reportedBy: '',
    reporterPhone: '',
    injuredPerson: '',
    injuredPersonId: '',
    supervisor: '',
    witnesses: '',
    
    // Injury Details (if applicable)
    injuryType: '',
    injurySeverity: '',
    treatmentProvided: '',
    medicalFacility: '',
    oshaRecordable: false,
    daysAway: 0,
    restrictedDays: 0,
    
    // Property/Vehicle (if applicable)
    propertyDamaged: '',
    estimatedCost: '',
    vehicleInvolved: '',
    vehicleLicense: '',
    
    // Contributing Factors
    equipmentInvolved: '',
    environmentalConditions: '',
    taskBeingPerformed: '',
    
    // Investigation
    immediateActions: '',
    rootCauses: '',
    correctiveActions: '',
    preventiveMeasures: '',
    assignedTo: '',
    dueDate: '',
    
    // Compliance
    regulatoryReportable: false,
    regulatoryAgency: '',
    reportSubmitted: false
  });

  const handleBodyPartClick = (partId: string) => {
    setSelectedBodyParts(prev => 
      prev.includes(partId) 
        ? prev.filter(p => p !== partId)
        : [...prev, partId]
    );
  };

  const toggleSection = (index: number) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  };

  const togglePPE = (ppe: string) => {
    setSelectedPPE(prev =>
      prev.includes(ppe)
        ? prev.filter(p => p !== ppe)
        : [...prev, ppe]
    );
  };

  const handlePrint = () => {
    const reportId = generateReportId(isInjuryIncident ? 'injury' : 'incident');
    exportIncidentReportToPDF({
      reportType: isInjuryIncident ? 'injury' : 'incident',
      reportId,
      date: formData.incidentDate,
      time: formData.incidentTime,
      location: formData.location,
      department: formData.department,
      incidentType: formData.incidentType,
      severity: formData.severity || 'Not specified',
      description: formData.description,
      immediateActions: formData.immediateActions,
      witnesses: formData.witnesses,
      regulatoryReportable: formData.regulatoryReportable,
      rootCauses: formData.rootCauses,
      correctiveActions: formData.correctiveActions,
      preventiveMeasures: formData.preventiveMeasures,
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate,
      injuredPerson: formData.injuredPerson,
      employeeId: formData.injuredPersonId,
      supervisor: formData.supervisor,
      injuryType: formData.injuryType,
      oshaRecordable: formData.oshaRecordable,
      bodyPartsAffected: selectedBodyParts.map(p => getBodyPartName(p)),
      generatedBy: formData.reportedBy || 'Current User',
      generatedDate: new Date().toLocaleString(),
      reporterSignature,
      witnessSignature,
      supervisorSignature,
      equipmentInvolved: formData.equipmentInvolved,
      environmentalConditions: formData.environmentalConditions,
      ppeUsed: selectedPPE,
      fiveWhysAnalysis: fiveWhysData.filter(w => w),
      fishboneCategories: fishboneData,
      lessonsLearned,
      treatmentProvided: formData.treatmentProvided,
      medicalFacility: formData.medicalFacility,
      daysAwayFromWork: formData.daysAway,
      daysRestricted: formData.restrictedDays,
    }, 'print');
  };

  const handleExportPDF = () => {
    const reportId = generateReportId(isInjuryIncident ? 'injury' : 'incident');
    exportIncidentReportToPDF({
      reportType: isInjuryIncident ? 'injury' : 'incident',
      reportId,
      date: formData.incidentDate,
      time: formData.incidentTime,
      location: formData.location,
      department: formData.department,
      incidentType: formData.incidentType,
      severity: formData.severity || 'Not specified',
      description: formData.description,
      immediateActions: formData.immediateActions,
      witnesses: formData.witnesses,
      regulatoryReportable: formData.regulatoryReportable,
      rootCauses: formData.rootCauses,
      correctiveActions: formData.correctiveActions,
      preventiveMeasures: formData.preventiveMeasures,
      assignedTo: formData.assignedTo,
      dueDate: formData.dueDate,
      injuredPerson: formData.injuredPerson,
      employeeId: formData.injuredPersonId,
      supervisor: formData.supervisor,
      injuryType: formData.injuryType,
      oshaRecordable: formData.oshaRecordable,
      bodyPartsAffected: selectedBodyParts.map(p => getBodyPartName(p)),
      generatedBy: formData.reportedBy || 'Current User',
      generatedDate: new Date().toLocaleString(),
      // Enhanced fields
      reporterSignature,
      witnessSignature,
      supervisorSignature,
      equipmentInvolved: formData.equipmentInvolved,
      environmentalConditions: formData.environmentalConditions,
      ppeUsed: selectedPPE,
      fiveWhysAnalysis: fiveWhysData.filter(w => w),
      fishboneCategories: fishboneData,
      lessonsLearned,
      treatmentProvided: formData.treatmentProvided,
      medicalFacility: formData.medicalFacility,
      daysAwayFromWork: formData.daysAway,
      daysRestricted: formData.restrictedDays
    });
  };

  const severityMap: Record<string, 'Low' | 'Medium' | 'High' | 'Critical'> = {
    Minor: 'Low',
    Moderate: 'Medium',
    Serious: 'High',
    Critical: 'Critical',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    // ── Frontend validation ───────────────────────────────
    const errors: string[] = [];
    if (!formData.incidentType) errors.push('Incident Type is required.');
    if (!formData.location.trim()) errors.push('Location is required.');
    if (formData.description.trim().length < 10) errors.push('Description must be at least 10 characters.');
    if (!formData.reportedBy.trim()) errors.push('Reported By is required.');
    const isInjuryForValidation = formData.incidentType.includes('Injury') || formData.incidentType === 'First Aid';
    if (isInjuryForValidation && selectedBodyParts.length === 0) errors.push('Please select at least one body part for injury incidents.');
    if (isInjuryForValidation && !formData.injuryType) errors.push('Injury Type is required for injury incidents.');
    if (errors.length > 0) {
      setSubmitError(errors.join(' | '));
      // expand section 0 so user can see what's missing
      setExpandedSections(prev => new Set([...prev, 0, 1, 2]));
      return;
    }
    // ─────────────────────────────────────────────────────

    const incidentType = formData.incidentType;
    const isNearMiss = incidentType === 'Near Miss';
    const isInjury = incidentType.includes('Injury') || incidentType === 'First Aid';
    const isVehicle = incidentType === 'Vehicle Incident';
    const isProperty = incidentType === 'Property Damage';

    const payload: import('../api/services/apiService').IncidentSubmissionPayload = {
      incidentDate: formData.incidentDate,
      incidentTime: formData.incidentTime,
      location: formData.location,
      department: formData.department || undefined,
      industrySector: undefined,
      incidentType,
      severity: severityMap[formData.severity] ?? 'Low',
      description: formData.description,
      immediateActions: formData.immediateActions || undefined,
      witnesses: formData.witnesses || undefined,
      rootCauses: formData.rootCauses || undefined,
      correctiveActions: formData.correctiveActions || undefined,
      assignedTo: formData.assignedTo || undefined,
      dueDate: formData.dueDate || undefined,
      regulatoryReportable: formData.regulatoryReportable,
      ...(isInjury && {
        bodyPart: selectedBodyParts.map(p => getBodyPartName(p)).join(', ') || undefined,
        injuryType: formData.injuryType || undefined,
        treatmentRequired: !!formData.treatmentProvided,
        medicalAttention: !!formData.medicalFacility,
        daysLost: formData.daysAway || undefined,
      }),
      ...(isVehicle && {
        vehicleType: formData.vehicleInvolved || undefined,
        driverName: formData.injuredPerson || undefined,
      }),
      ...(isProperty && {
        assetName: formData.propertyDamaged || undefined,
        damageDescription: formData.description || undefined,
        damageEstimate: formData.estimatedCost ? parseFloat(formData.estimatedCost) : undefined,
        repairRequired: true,
      }),
      ...(isNearMiss && {
        potentialSeverity: formData.severity || undefined,
        potentialConsequence: formData.description || undefined,
        preventativeMeasure: formData.correctiveActions || undefined,
        likelihood: 'Medium',
      }),
    };

    // ── Direct service call with proper error propagation ─
    try {
      await incidentService.create(payload);
      setSubmitted(true);
      setTimeout(() => navigate('/incidents'), 3000);
    } catch (err: unknown) {
      const e = err as { issues?: { message: string }[]; message?: string };
      if (e?.issues?.length) {
        setSubmitError('Validation errors: ' + e.issues.map(i => i.message).join(' | '));
      } else {
        setSubmitError(e?.message || 'Failed to submit report. Please try again.');
      }
    }
    // ─────────────────────────────────────────────────────
  };

  const isInjuryIncident = formData.incidentType.includes('Injury') || 
                           formData.incidentType === 'First Aid';
  const isPropertyIncident = formData.incidentType === 'Property Damage';
  const isVehicleIncident = formData.incidentType === 'Vehicle Incident';

  // Auto-expand relevant sections when incident type changes
  const handleIncidentTypeChange = (v: string) => {
    setFormData({ ...formData, incidentType: v });
    const isInj = v.includes('Injury') || v === 'First Aid';
    const isProp = v === 'Property Damage';
    const isVeh = v === 'Vehicle Incident';
    setExpandedSections(prev => {
      const next = new Set(prev);
      next.add(0); // always keep section 1 open
      if (isInj) { next.add(2); next.add(3); } // Injury Details + Body Diagram
      if (isProp || isVeh) next.add(4); // Property/Vehicle Details
      return next;
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-sm mx-4"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900">Full Report Submitted</h2>
          <p className="text-surface-500 text-sm">
            Your comprehensive incident report has been logged. Safety officers and management have been notified.
          </p>
          <div className="pt-4 flex flex-wrap justify-center gap-2">
            {selectedBodyParts.length > 0 && (
              <div className="text-xs text-surface-400">
                Affected areas: {selectedBodyParts.map(p => getBodyPartName(p)).join(', ')}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 pb-32">
      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { background: white !important; }
          .print-container { 
            padding: 20px !important;
            max-width: 100% !important;
          }
        }
      `}</style>
      

      
      {/* Header */}
      <div className="no-print bg-surface-100/80 backdrop-blur-md shadow-sm sticky top-20 z-40 px-4 h-16 flex items-center justify-between border-b border-surface-200 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-200 rounded-full">
            <ArrowLeft className="w-6 h-6 text-surface-800" />
          </button>
          <h1 className="text-xl font-bold text-surface-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-brand-400" />
            Full Incident Report
          </h1>
        </div>
        
        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            className="p-2 bg-surface-200 text-surface-800 rounded-xl hover:bg-surface-300 transition-colors"
            title="Print Report"
          >
            <Printer className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="p-2 bg-brand-500/20 text-brand-400 rounded-xl hover:bg-brand-500/30 transition-colors"
            title="Export PDF"
          >
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <main ref={printRef} className="print-container max-w-7xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Section 1: Incident Information */}
          <SectionCard
            index={0}
            title="Incident Information"
            icon={AlertTriangle}
            color="text-red-500"
            isExpanded={expandedSections.has(0)}
            onToggle={() => toggleSection(0)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Date" type="date" required
                  value={formData.incidentDate}
                  onChange={(v) => setFormData({ ...formData, incidentDate: v })}
                />
                <InputField
                  label="Time" type="time"
                  value={formData.incidentTime}
                  onChange={(v) => setFormData({ ...formData, incidentTime: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Location" type="text" required placeholder="Area/Zone"
                  value={formData.location}
                  onChange={(v) => setFormData({ ...formData, location: v })}
                />
                <SelectField
                  label="Department"
                  value={formData.department}
                  onChange={(v) => setFormData({ ...formData, department: v })}
                  options={DEPARTMENTS}
                />
              </div>
              <SelectField
                label="Incident Type" required
                value={formData.incidentType}
                onChange={handleIncidentTypeChange}
                options={INCIDENT_TYPES}
              />
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {SEVERITY_LEVELS.map(level => (
                    <button
                      key={level} type="button"
                      onClick={() => setFormData({ ...formData, severity: level })}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                        formData.severity === level
                          ? 'bg-brand-500 text-white border-brand-500'
                          : 'bg-surface-200 text-surface-800 border-surface-300 hover:border-brand-400 hover:text-surface-900'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">Description <span className="text-red-400">*</span></label>
                  <button
                    type="button"
                    onClick={() => requestAI('description')}
                    disabled={aiLoading && aiField === 'description'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 text-[11px] font-semibold hover:bg-brand-500/25 transition-colors disabled:opacity-50"
                  >
                    {aiLoading && aiField === 'description' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    AI Assist
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what happened in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600 resize-none"
                />
                {aiSuggestions.length > 0 && aiField === 'description' && (
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> AI Suggestions — click to apply
                    </div>
                    {aiSuggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => applyAISuggestion(s)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-surface-200 border border-surface-300 text-xs text-surface-900 hover:bg-surface-300 hover:border-brand-500/40 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </SectionCard>

          {/* Section 2: Persons Involved */}
          <SectionCard
            index={1}
            title="Persons Involved"
            icon={Users}
            color="text-blue-500"
            isExpanded={expandedSections.has(1)}
            onToggle={() => toggleSection(1)}
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Reported By" type="text" required
                  value={formData.reportedBy}
                  onChange={(v) => setFormData({ ...formData, reportedBy: v })}
                />
                <InputField
                  label="Phone" type="tel"
                  value={formData.reporterPhone}
                  onChange={(v) => setFormData({ ...formData, reporterPhone: v })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Injured/Affected Person" type="text"
                  value={formData.injuredPerson}
                  onChange={(v) => setFormData({ ...formData, injuredPerson: v })}
                />
                <InputField
                  label="Employee ID" type="text" placeholder="EMP-XXXX"
                  value={formData.injuredPersonId}
                  onChange={(v) => setFormData({ ...formData, injuredPersonId: v })}
                />
              </div>
              <InputField
                label="Supervisor" type="text"
                value={formData.supervisor}
                onChange={(v) => setFormData({ ...formData, supervisor: v })}
              />
              <InputField
                label="Witnesses" type="text" placeholder="Comma-separated names"
                value={formData.witnesses}
                onChange={(v) => setFormData({ ...formData, witnesses: v })}
              />
            </div>
          </SectionCard>

          {/* Section 3: Injury Details (conditional) */}
          {isInjuryIncident && (
            <SectionCard
              index={2}
              title="Injury Details"
              icon={Heart}
              color="text-red-500"
              isExpanded={expandedSections.has(2)}
              onToggle={() => toggleSection(2)}
            >
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label="Injury Type"
                    value={formData.injuryType}
                    onChange={(v) => setFormData({ ...formData, injuryType: v })}
                    options={INJURY_TYPES}
                  />
                  <SelectField
                    label="Injury Severity"
                    value={formData.injurySeverity}
                    onChange={(v) => setFormData({ ...formData, injurySeverity: v })}
                    options={['First Aid', 'Medical Treatment', 'Restricted Work', 'Lost Time', 'Hospitalization']}
                  />
                </div>
                <TextareaField
                  label="Treatment Provided" rows={2}
                  placeholder="First aid, medical transport, etc."
                  value={formData.treatmentProvided}
                  onChange={(v) => setFormData({ ...formData, treatmentProvided: v })}
                />
                <InputField
                  label="Medical Facility (if applicable)" type="text"
                  value={formData.medicalFacility}
                  onChange={(v) => setFormData({ ...formData, medicalFacility: v })}
                />
                <div className="flex items-center gap-3 p-4 bg-red-900/20 rounded-xl border border-red-800/30">
                  <input
                    type="checkbox" id="osha"
                    checked={formData.oshaRecordable}
                    onChange={(e) => setFormData({ ...formData, oshaRecordable: e.target.checked })}
                    className="w-5 h-5 text-red-500 border-red-600 rounded"
                  />
                  <label htmlFor="osha" className="text-sm font-medium text-red-400">
                    OSHA Recordable Injury (Form 300)
                  </label>
                </div>
                {formData.oshaRecordable && (
                  <div className="grid grid-cols-2 gap-3 p-4 bg-surface-200 rounded-xl">
                    <InputField
                      label="Days Away from Work" type="number"
                      value={String(formData.daysAway)}
                      onChange={(v) => setFormData({ ...formData, daysAway: parseInt(v) || 0 })}
                    />
                    <InputField
                      label="Restricted Work Days" type="number"
                      value={String(formData.restrictedDays)}
                      onChange={(v) => setFormData({ ...formData, restrictedDays: parseInt(v) || 0 })}
                    />
                  </div>
                )}
                
                {/* Injury Severity Calculator */}
                <div className="mt-4">
                  <InjurySeverityCalculator
                    onCalculate={(result) => setFormData({ ...formData, injurySeverity: result.category })}
                  />
                </div>
              </div>
            </SectionCard>
          )}

          {/* Section 4: Body Diagram (conditional) */}
          {isInjuryIncident && (
            <SectionCard
              index={3}
              title="Body Diagram"
              icon={HardHat}
              color="text-orange-500"
              isExpanded={expandedSections.has(3)}
              onToggle={() => toggleSection(3)}
            >
              <div className="space-y-4">
                <p className="text-sm text-surface-500">
                  Click on the body diagram to select affected areas (front and back views). Multiple selections allowed.
                </p>
                <div className="flex flex-col items-center gap-6">
                  <BodyDiagram
                    selectedParts={selectedBodyParts}
                    onPartClick={handleBodyPartClick}
                    multiSelect={true}
                    size="sm"
                    showBothViews={true}
                  />
                  <div className="flex-1 w-full">
                    <label className="text-xs font-bold text-surface-400 uppercase mb-2 block">
                      Selected Body Parts
                    </label>
                    <div className="min-h-[80px] p-4 bg-surface-200 rounded-xl border border-surface-300">
                      {selectedBodyParts.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {selectedBodyParts.map(part => (
                            <span
                              key={part}
                              onClick={() => handleBodyPartClick(part)}
                              className="px-3 py-1.5 bg-red-900/30 text-red-400 text-sm font-semibold rounded-full cursor-pointer hover:bg-red-900/50 border border-red-700/40 transition-colors"
                            >
                              {getBodyPartName(part)} ×
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-surface-600">No body parts selected yet</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </SectionCard>
          )}

          {/* Section 5: Property/Vehicle (conditional) */}
          {(isPropertyIncident || isVehicleIncident) && (
            <SectionCard
              index={4}
              title="Property/Vehicle Details"
              icon={Car}
              color="text-purple-500"
              isExpanded={expandedSections.has(4)}
              onToggle={() => toggleSection(4)}
            >
              <div className="space-y-4">
                {isPropertyIncident && (
                  <>
                    <TextareaField
                      label="Property/Equipment Damaged" rows={2}
                      placeholder="Describe damaged property or equipment"
                      value={formData.propertyDamaged}
                      onChange={(v) => setFormData({ ...formData, propertyDamaged: v })}
                    />
                    <InputField
                      label="Estimated Cost" type="text" placeholder="$0.00"
                      value={formData.estimatedCost}
                      onChange={(v) => setFormData({ ...formData, estimatedCost: v })}
                    />
                  </>
                )}
                {isVehicleIncident && (
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      label="Vehicle Involved" type="text"
                      value={formData.vehicleInvolved}
                      onChange={(v) => setFormData({ ...formData, vehicleInvolved: v })}
                    />
                    <InputField
                      label="License Plate" type="text"
                      value={formData.vehicleLicense}
                      onChange={(v) => setFormData({ ...formData, vehicleLicense: v })}
                    />
                  </div>
                )}
              </div>
            </SectionCard>
          )}

          {/* Section 6: Contributing Factors */}
          <SectionCard
            index={5}
            title="Contributing Factors"
            icon={Activity}
            color="text-amber-500"
            isExpanded={expandedSections.has(5)}
            onToggle={() => toggleSection(5)}
          >
            <div className="space-y-4">
              <TextareaField
                label="Task Being Performed" rows={2}
                placeholder="What was the worker doing when the incident occurred?"
                value={formData.taskBeingPerformed}
                onChange={(v) => setFormData({ ...formData, taskBeingPerformed: v })}
              />
              <InputField
                label="Equipment Involved" type="text"
                placeholder="Tools, machinery, vehicles, etc."
                value={formData.equipmentInvolved}
                onChange={(v) => setFormData({ ...formData, equipmentInvolved: v })}
              />
              <TextareaField
                label="Environmental Conditions" rows={2}
                placeholder="Weather, lighting, floor conditions, noise, etc."
                value={formData.environmentalConditions}
                onChange={(v) => setFormData({ ...formData, environmentalConditions: v })}
              />
              
              {/* PPE Selection */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">PPE Being Worn</label>
                <div className="flex flex-wrap gap-2">
                  {PPE_OPTIONS.map(ppe => (
                    <button
                      key={ppe}
                      type="button"
                      onClick={() => togglePPE(ppe)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        selectedPPE.includes(ppe)
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-200 text-surface-800 hover:bg-surface-300'
                      }`}
                    >
                      {ppe}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Section 7: Investigation & Actions */}
          <SectionCard
            index={6}
            title="Investigation & Actions"
            icon={Clipboard}
            color="text-green-500"
            isExpanded={expandedSections.has(6)}
            onToggle={() => toggleSection(6)}
          >
            <div className="space-y-4">
              <TextareaField
                label="Immediate Actions Taken" rows={2}
                placeholder="What was done immediately after the incident?"
                value={formData.immediateActions}
                onChange={(v) => setFormData({ ...formData, immediateActions: v })}
              />
              
              {/* Root Cause Analysis Tools */}
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={() => setShowRootCauseTools(!showRootCauseTools)}
                  className="w-full flex items-center justify-between p-4 bg-purple-900/20 rounded-xl border border-purple-700/30 hover:bg-purple-900/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Target className="w-5 h-5 text-purple-400" />
                    <span className="font-semibold text-purple-300">Root Cause Analysis Tools</span>
                  </div>
                  {showRootCauseTools ? (
                    <ChevronUp className="w-5 h-5 text-purple-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-purple-400" />
                  )}
                </button>
                
                <AnimatePresence>
                  {showRootCauseTools && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="space-y-4 overflow-hidden"
                    >
                      {/* 5 Whys */}
                      <div className="p-4 bg-surface-200 rounded-xl border border-surface-300">
                        <FiveWhysAnalysis
                          initialProblem={formData.description || ''}
                          onWhysChange={(whys) => setFiveWhysData(whys.map(w => w.answer))}
                          onProblemChange={(p) => setFormData(prev => ({ ...prev, description: p }))}
                        />
                      </div>
                      
                      {/* Fishbone Diagram */}
                      <div className="p-4 bg-surface-200 rounded-xl border border-surface-300">
                        <FishboneDiagram
                          problem={formData.description || ''}
                          onProblemChange={(p) => setFormData(prev => ({ ...prev, description: p }))}
                          onCategoriesChange={(cats) => setFishboneData(cats.map(c => ({ category: c.name, causes: c.causes.map(x => x.text) })))}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {/* Root Cause with AI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">Root Cause Analysis Summary</label>
                  <button
                    type="button"
                    onClick={() => requestAI('rootCauses')}
                    disabled={aiLoading && aiField === 'rootCauses'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 text-[11px] font-semibold hover:bg-brand-500/25 transition-colors disabled:opacity-50"
                  >
                    {aiLoading && aiField === 'rootCauses' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    AI Analyse
                  </button>
                </div>
                <textarea rows={3} placeholder="What caused this incident?"
                  value={formData.rootCauses}
                  onChange={(e) => setFormData({ ...formData, rootCauses: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600 resize-none"
                />
                {aiSuggestions.length > 0 && aiField === 'rootCauses' && (
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> AI Root Cause Suggestions — click to apply
                    </div>
                    {aiSuggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => applyAISuggestion(s)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-surface-200 border border-surface-300 text-xs text-surface-900 hover:bg-surface-300 hover:border-brand-500/40 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Corrective Actions with AI */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">Corrective Actions</label>
                  <button
                    type="button"
                    onClick={() => requestAI('correctiveActions')}
                    disabled={aiLoading && aiField === 'correctiveActions'}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-brand-500/15 border border-brand-500/30 text-brand-400 text-[11px] font-semibold hover:bg-brand-500/25 transition-colors disabled:opacity-50"
                  >
                    {aiLoading && aiField === 'correctiveActions' ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    AI Suggest
                  </button>
                </div>
                <textarea rows={3} placeholder="Actions to address the root cause"
                  value={formData.correctiveActions}
                  onChange={(e) => setFormData({ ...formData, correctiveActions: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600 resize-none"
                />
                {aiSuggestions.length > 0 && aiField === 'correctiveActions' && (
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-brand-400 uppercase tracking-wider">
                      <Sparkles className="w-3 h-3" /> AI Corrective Action Suggestions — click to apply
                    </div>
                    {aiSuggestions.map((s, i) => (
                      <button key={i} type="button" onClick={() => applyAISuggestion(s)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-surface-200 border border-surface-300 text-xs text-surface-900 hover:bg-surface-300 hover:border-brand-500/40 transition-colors">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <TextareaField
                label="Preventive Measures" rows={2}
                placeholder="Measures to prevent recurrence"
                value={formData.preventiveMeasures}
                onChange={(v) => setFormData({ ...formData, preventiveMeasures: v })}
              />
              <div className="grid grid-cols-2 gap-3">
                <InputField
                  label="Assigned To" type="text"
                  value={formData.assignedTo}
                  onChange={(v) => setFormData({ ...formData, assignedTo: v })}
                />
                <InputField
                  label="Due Date" type="date"
                  value={formData.dueDate}
                  onChange={(v) => setFormData({ ...formData, dueDate: v })}
                />
              </div>
              
              {/* Lessons Learned */}
              <LessonsLearnedPanel
                incidentSummary={formData.description}
                onLessonsChange={(lessons) => {
                  const summary = lessons.map(l => `[${l.category}] ${l.description}`).join('\n');
                  setLessonsLearned(summary);
                }}
              />
            </div>
          </SectionCard>

          {/* Section 8: Compliance & Reporting */}
          <SectionCard
            index={7}
            title="Compliance & Reporting"
            icon={Shield}
            color="text-indigo-500"
            isExpanded={expandedSections.has(7)}
            onToggle={() => toggleSection(7)}
          >
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-indigo-900/20 rounded-xl border border-indigo-700/30">
                <input
                  type="checkbox" id="regulatory"
                  checked={formData.regulatoryReportable}
                  onChange={(e) => setFormData({ ...formData, regulatoryReportable: e.target.checked })}
                  className="w-5 h-5 text-indigo-500 border-indigo-600 rounded"
                />
                <label htmlFor="regulatory" className="text-sm font-medium text-indigo-400">
                  Regulatory Reportable Incident
                </label>
              </div>
              {formData.regulatoryReportable && (
                <div className="space-y-3 p-4 bg-surface-200 rounded-xl">
                  <SelectField
                    label="Regulatory Agency"
                    value={formData.regulatoryAgency}
                    onChange={(v) => setFormData({ ...formData, regulatoryAgency: v })}
                    options={['OSHA', 'EPA', 'Cal/OSHA', 'MSHA', 'NRC', 'BSEE', 'EU-OSHA', 'HSE UK', 'Safe Work Australia']}
                  />
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox" id="reportSubmitted"
                      checked={formData.reportSubmitted}
                      onChange={(e) => setFormData({ ...formData, reportSubmitted: e.target.checked })}
                      className="w-4 h-4 text-indigo-500"
                    />
                    <label htmlFor="reportSubmitted" className="text-sm text-indigo-400">
                      Report already submitted to agency
                    </label>
                  </div>
                </div>
              )}
            </div>
          </SectionCard>

          {/* Section 9: Signatures */}
          <SectionCard
            index={8}
            title="Signatures"
            icon={User}
            color="text-cyan-500"
            isExpanded={expandedSections.has(8)}
            onToggle={() => toggleSection(8)}
          >
            <div className="space-y-6">
              <p className="text-sm text-surface-500">
                Please provide signatures to validate this report. All signatures are required for final submission.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Reporter Signature */}
                <div className="space-y-2">
                  <SignatureCanvas
                    label="Reporter Signature"
                    required
                    signerName={formData.reportedBy}
                    signerTitle="Reporter"
                    onSignature={setReporterSignature}
                    onClear={() => setReporterSignature('')}
                  />
                </div>
                
                {/* Witness Signature */}
                <div className="space-y-2">
                  <SignatureCanvas
                    label="Witness Signature"
                    signerName={formData.witnesses.split(',')[0]?.trim() || ''}
                    signerTitle="Witness"
                    onSignature={setWitnessSignature}
                    onClear={() => setWitnessSignature('')}
                  />
                </div>
                
                {/* Supervisor Signature */}
                <div className="space-y-2 md:col-span-2">
                  <SignatureCanvas
                    label="Supervisor Signature"
                    required
                    signerName={formData.supervisor}
                    signerTitle="Supervisor"
                    onSignature={setSupervisorSignature}
                    onClear={() => setSupervisorSignature('')}
                  />
                </div>
              </div>
              
              {/* Signature Status */}
              <div className="flex items-center gap-4 p-4 bg-surface-200 rounded-xl">
                <div className="flex items-center gap-2">
                  {reporterSignature ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${reporterSignature ? 'text-green-400' : 'text-amber-400'}`}>
                    Reporter
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {witnessSignature ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <span className="w-4 h-4 rounded-full border-2 border-surface-500" />
                  )}
                  <span className={`text-sm font-medium ${witnessSignature ? 'text-green-400' : 'text-surface-600'}`}>
                    Witness
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {supervisorSignature ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                  )}
                  <span className={`text-sm font-medium ${supervisorSignature ? 'text-green-400' : 'text-amber-400'}`}>
                    Supervisor
                  </span>
                </div>
              </div>
            </div>
          </SectionCard>

          {/* Photo Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-100 p-6 rounded-3xl border border-surface-200"
          >
            <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">Evidence Photos</label>
            <label
              className="mt-3 w-full py-8 border-2 border-dashed border-surface-300 rounded-2xl flex flex-col items-center gap-2 text-surface-600 hover:text-brand-400 hover:border-brand-500 transition-all cursor-pointer"
            >
              <input
                type="file" accept="image/*" multiple className="hidden"
                onChange={handlePhotoChange}
                disabled={photoFiles.length >= 5}
              />
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">
                {photoFiles.length === 0
                  ? 'Tap to upload photos'
                  : `${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''} selected — tap to add more`}
              </span>
              {photoFiles.length >= 5 && <span className="text-xs text-amber-400">Maximum 5 photos reached</span>}
            </label>
            {photoUrls.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {photoUrls.map((url, i) => (
                  <div key={i} className="relative group">
                    <img src={url} alt={`Evidence ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-surface-300" />
                    <button
                      type="button"
                      onClick={() => removePhoto(i)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          {/* Submit error banner */}
          {submitError && (
            <div className="bg-red-900/30 border border-red-700/50 text-red-400 text-sm rounded-2xl px-4 py-3 no-print">
              {submitError}
            </div>
          )}

          {/* Submit Buttons */}
          <div className="flex gap-3 no-print">
            <motion.button
              type="button"
              onClick={handlePrint}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-5 bg-surface-200 text-surface-800 border-2 border-surface-300 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-surface-300 transition-colors"
            >
              <Printer className="w-5 h-5" />
              Print
            </motion.button>
            
            <motion.button
              type="button"
              onClick={handleExportPDF}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-5 bg-surface-200 text-brand-400 border-2 border-brand-500/40 rounded-3xl font-bold text-lg flex items-center justify-center gap-3 hover:bg-surface-300 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </motion.button>
            
            <motion.button
              type="submit"
              disabled={createIncident.loading}
              whileHover={{ scale: createIncident.loading ? 1 : 1.02 }}
              whileTap={{ scale: createIncident.loading ? 1 : 0.98 }}
              className="flex-[2] py-5 bg-brand-900 text-white rounded-3xl shadow-glow font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              {createIncident.loading ? 'Submitting...' : 'Submit Full Report'}
            </motion.button>
          </div>
        </form>
      </main>
    </div>
  );
};

// Helper Components
interface SectionCardProps {
  index: number;
  title: string;
  icon: React.ElementType;
  color: string;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

const SectionCard: React.FC<SectionCardProps> = ({
  title, icon: Icon, color, isExpanded, onToggle, children
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-surface-100 rounded-3xl border border-surface-200 overflow-hidden"
  >
    <button
      type="button"
      onClick={onToggle}
      className="w-full px-6 py-4 flex items-center justify-between hover:bg-surface-200 transition-colors"
    >
      <div className="flex items-center gap-3">
        <Icon className={`w-5 h-5 ${color}`} />
        <span className="font-bold text-surface-900">{title}</span>
      </div>
      {isExpanded ? (
        <ChevronUp className="w-5 h-5 text-surface-600" />
      ) : (
        <ChevronDown className="w-5 h-5 text-surface-600" />
      )}
    </button>
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="overflow-hidden"
        >
          <div className="px-6 pb-6 space-y-4">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  </motion.div>
);

interface InputFieldProps {
  label: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
}

const InputField: React.FC<InputFieldProps> = ({
  label, type, value, onChange, placeholder, required
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">{label}</label>
    <input
      type={type}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600"
    />
  </div>
);

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  required?: boolean;
}

const SelectField: React.FC<SelectFieldProps> = ({
  label, value, onChange, options, required
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">{label}</label>
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 appearance-none"
    >
      <option value="">Select...</option>
      {options.map(opt => (
        <option key={opt} value={opt}>{opt}</option>
      ))}
    </select>
  </div>
);

interface TextareaFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  placeholder?: string;
  required?: boolean;
}

const TextareaField: React.FC<TextareaFieldProps> = ({
  label, value, onChange, rows = 3, placeholder, required
}) => (
  <div className="space-y-1.5">
    <label className="text-xs font-bold text-surface-700 uppercase tracking-wide">{label}</label>
    <textarea
      required={required}
      rows={rows}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 bg-surface-200 border border-surface-300 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-sm text-surface-900 placeholder:text-surface-600 resize-none"
    />
  </div>
);

export default FullIncidentReport;
