import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, Camera, Send, CheckCircle2, MapPin, Calendar, Info, Brain, Sparkles, Loader2, User, ClipboardList, ShieldCheck, Heart, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BodyDiagram, getBodyPartName } from '../components/safety/BodyDiagram';
import { exportIncidentReportToPDF, generateReportId } from '../utils/exports/incidentPdfExport';
import { aiAssistantService, incidentService, type IncidentSubmissionPayload } from '../api/services/apiService';
import { useWorkers } from '../api/hooks/useAPIHooks';
import { allInternationalStandards, type InternationalStandard } from '../data/internationalStandards';

/**
 * List of standard incident types for EHS reporting.
 */
const INCIDENT_TYPES = [
  'Near Miss',
  'First Aid',
  'Recordable Injury',
  'Lost Time Injury',
  'Fatality',
  'Property Damage',
  'Environmental Spill',
  'Fire/Explosion',
  'Process Safety Event',
  'Security Breach',
  'Vehicle Incident',
  'Contractor Incident',
  'Other'
];

/**
 * Industry sectors for categorization.
 */
const INDUSTRY_SECTORS = [
  'Oil & Gas',
  'Construction',
  'Machine Shops',
  'Manufacturing',
  'Healthcare',
  'Transportation',
  'Warehouse',
  'General Industry'
];

/**
 * ISO 9001 applicable clauses for incident documentation.
 */
const ISO_CLAUSES = [
  { id: '10.2', label: '10.2 Nonconformity and Corrective Action' },
  { id: '6.1', label: '6.1 Actions to Address Risks and Opportunities' },
  { id: '8.5.1', label: '8.5.1 Control of Production and Service Provision' },
  { id: '9.1.3', label: '9.1.3 Analysis and Evaluation' },
  { id: '8.7', label: '8.7 Control of Nonconforming Outputs' }
];

/**
 * Body parts for injury classification.
 */
const BODY_PARTS = [
  'Head/Face', 'Eyes', 'Neck', 'Shoulder', 'Arm', 'Hand/Fingers',
  'Chest/Torso', 'Back', 'Hip', 'Leg', 'Knee', 'Foot/Toes', 'Multiple', 'N/A'
];

/**
 * Injury types for classification.
 */
const INJURY_TYPES = [
  'Laceration/Cut', 'Contusion/Bruise', 'Fracture', 'Sprain/Strain',
  'Burn', 'Chemical Exposure', 'Inhalation', 'Puncture', 'Amputation',
  'Crushing', 'Electric Shock', 'Heat Stress', 'Slip/Trip/Fall', 'N/A'
];

/**
 * Severity levels for prioritizing incident response.
 */
const SEVERITY_LEVELS = [
  'Low',
  'Medium',
  'High',
  'Critical'
] as const;

const isInjuryIncidentType = (incidentType: string) =>
  incidentType.includes('Injury') ||
  incidentType === 'First Aid' ||
  incidentType === 'Fatality' ||
  incidentType.toLowerCase().includes('fatal') ||
  incidentType.toLowerCase().includes('lost time');

// Auto-suggests relevant standards by incident type
const INCIDENT_STANDARDS_MAP: Record<string, string[]> = {
  'Near Miss': ['iso-45001', 'ilo-osh-2001'],
  'First Aid': ['iso-45001', 'iso-45003', 'ilo-osh-2001'],
  'Recordable Injury': ['iso-45001', 'iso-45003', 'ilo-osh-2001', 'iso-31000'],
  'Lost Time Injury': ['iso-45001', 'iso-45003', 'ilo-osh-2001', 'iso-31000'],
  'Fatality': ['iso-45001', 'ilo-osh-2001', 'iso-31000', 'iso-22301'],
  'Property Damage': ['iso-45001', 'ilo-osh-2001', 'iso-31000'],
  'Environmental Spill': ['iso-45001', 'ilo-osh-2001', 'iso-22000'],
  'Fire/Explosion': ['iso-45001', 'iec-60079', 'iec-61508', 'iso-31000'],
  'Process Safety Event': ['iso-45001', 'iec-61508', 'iso-31000'],
  'Security Breach': ['iso-45001', 'iso-27001'],
  'Vehicle Incident': ['iso-45001', 'ilo-osh-2001', 'iso-31000'],
  'Contractor Incident': ['iso-45001', 'ilo-osh-2001'],
  'Other': ['iso-45001', 'ilo-osh-2001'],
};

const buildIncidentPayload = (
  formData: {
    incident_date: string;
    incident_time: string;
    location: string;
    department: string;
    industry_sector: string;
    incident_type: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    injury_type: string;
    immediate_actions: string;
    witnesses: string;
    root_causes: string;
    corrective_actions: string;
    iso_clause: string;
    assigned_to: string;
    due_date: string;
    regulatory_reportable: boolean;
  },
  selectedBodyParts: string[],
  selectedStandards: string[]
): IncidentSubmissionPayload => ({
  incidentDate: formData.incident_date,
  incidentTime: formData.incident_time,
  location: formData.location,
  department: formData.department || undefined,
  industrySector: formData.industry_sector || undefined,
  incidentType: formData.incident_type,
  description: formData.description,
  severity: formData.severity,
  immediateActions: formData.immediate_actions || undefined,
  witnesses: formData.witnesses || undefined,
  rootCauses: formData.root_causes || undefined,
  correctiveActions: formData.corrective_actions || undefined,
  assignedTo: formData.assigned_to || undefined,
  dueDate: formData.due_date || undefined,
  isoClause: formData.iso_clause || undefined,
  regulatoryReportable: formData.regulatory_reportable,
  bodyPart: selectedBodyParts.length > 0 ? selectedBodyParts.map(getBodyPartName).join(', ') : undefined,
  injuryType: formData.injury_type || undefined,
  treatmentRequired: isInjuryIncidentType(formData.incident_type),
  medicalAttention: formData.severity === 'High' || formData.severity === 'Critical',
  daysLost: formData.incident_type.includes('Lost Time') ? 1 : 0,
  selectedStandards: selectedStandards.length > 0 ? selectedStandards : undefined,
});

/**
 * IncidentReporting Component
 * 
 * Provides a comprehensive form for users to report safety incidents.
 * Features include:
 * - Date and location selection
 * - Incident type and severity classification
 * - Detailed description input
 * - AI-driven Root Cause Analysis and Corrective Actions (ISO 14001 & OH&S aligned)
 * - Action plan assignment to individuals
 * - Mocked photo evidence collection
 * - Animated success feedback
 * 
 * @returns {React.FC} The incident reporting page component.
 */
export const IncidentReporting: React.FC = () => {
  const navigate = useNavigate();
  const { data: workersData } = useWorkers({ status: 'active' });
  const workers = workersData ?? [];
  const [selectedBodyParts, setSelectedBodyParts] = useState<string[]>([]);
  const [selectedStandards, setSelectedStandards] = useState<string[]>([]);

  const handleStandardToggle = (standardId: string) => {
    setSelectedStandards(prev => 
      prev.includes(standardId) 
        ? prev.filter(id => id !== standardId)
        : [...prev, standardId]
    );
  };
  const [formData, setFormData] = useState<{
    incident_date: string;
    incident_time: string;
    location: string;
    department: string;
    industry_sector: string;
    incident_type: string;
    description: string;
    severity: 'Low' | 'Medium' | 'High' | 'Critical';
    body_part_affected: string;
    injury_type: string;
    immediate_actions: string;
    witnesses: string;
    root_causes: string;
    corrective_actions: string;
    iso_clause: string;
    assigned_to: string;
    due_date: string;
    regulatory_reportable: boolean;
  }>({
    incident_date: new Date().toISOString().split('T')[0],
    incident_time: new Date().toTimeString().slice(0, 5),
    location: '',
    department: '',
    industry_sector: '',
    incident_type: '',
    description: '',
    severity: 'Medium',
    body_part_affected: '',
    injury_type: '',
    immediate_actions: '',
    witnesses: '',
    root_causes: '',
    corrective_actions: '',
    iso_clause: '',
    assigned_to: '',
    due_date: '',
    regulatory_reportable: false
  });

  const handleBodyPartClick = (partId: string) => {
    setSelectedBodyParts(prev => 
      prev.includes(partId) 
        ? prev.filter(p => p !== partId)
        : [...prev, partId]
    );
  };
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSeverityLoading, setAiSeverityLoading] = useState(false);
  const [aiSeverityHint, setAiSeverityHint] = useState<string | null>(null);
  const [aiActionsLoading, setAiActionsLoading] = useState(false);
  const [photoFiles, setPhotoFiles] = useState<File[]>([]);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // AUTO-SUGGEST standards when incident type changes
  const handleIncidentTypeChange = (type: string) => {
    setFormData(prev => ({ ...prev, incident_type: type }));
    const suggestedIds = INCIDENT_STANDARDS_MAP[type] ?? [];
    if (suggestedIds.length > 0) {
      setSelectedStandards(prev => [...new Set([...prev, ...suggestedIds])]);
    }
  };

  // AI: Full Incident Analysis (Root Causes + Corrective Actions)
  const handleAISuggest = async () => {
    if (!formData.description) {
      alert('Please provide an incident description first.');
      return;
    }

    setAiLoading(true);
    try {
      const contextPrompt = [
        `INCIDENT ANALYSIS REQUEST — Please provide a structured EHS analysis:`,
        `Incident Type: ${formData.incident_type || 'Not specified'}`,
        `Severity: ${formData.severity}`,
        `Location: ${formData.location || 'Not specified'}`,
        `Industry: ${formData.industry_sector || 'General'}`,
        `Description: ${formData.description}`,
        formData.immediate_actions ? `Immediate Actions Taken: ${formData.immediate_actions}` : '',
        selectedBodyParts.length > 0 ? `Body Parts Affected: ${selectedBodyParts.map(getBodyPartName).join(', ')}` : '',
        formData.injury_type ? `Injury Type: ${formData.injury_type}` : '',
        ``,
        `Please provide:`,
        `1. ROOT CAUSES: 3-5 probable root causes using 5-Why methodology`,
        `2. CORRECTIVE ACTIONS: 5-7 SMART corrective/preventive actions aligned with ISO 45001 Clause 10.2`,
        `3. REGULATORY FLAGS: Any OSHA 300/300A/301 or other mandatory reporting requirements for this incident`,
      ].filter(Boolean).join('\n');

      const response = await aiAssistantService.getSuggestions({
        industry: formData.industry_sector || 'General',
        category: `${formData.incident_type || 'Safety'} Incident Root Cause & Corrective Action Analysis`,
        checklistItems: [contextPrompt],
        completedItems: 0,
      });

      const suggestions = response.data.suggestions ?? [];
      const fullText = suggestions.join('\n');

      // Try to split into root causes vs corrective actions sections
      const rcMatch = fullText.match(/ROOT CAUSES?:?\s*([\s\S]+?)(?=CORRECTIVE|2\.|REGULATORY|$)/i);
      const caMatch = fullText.match(/CORRECTIVE ACTIONS?:?\s*([\s\S]+?)(?=REGULATORY|3\.|$)/i);

      const rootCauses = rcMatch?.[1]?.trim() || suggestions.slice(0, Math.ceil(suggestions.length / 2)).map(s => `• ${s}`).join('\n');
      const correctiveActions = caMatch?.[1]?.trim() || suggestions.slice(Math.ceil(suggestions.length / 2)).map(s => `• ${s}`).join('\n');

      setFormData(prev => ({
        ...prev,
        root_causes: rootCauses || prev.root_causes,
        corrective_actions: correctiveActions || prev.corrective_actions,
      }));
    } catch (error) {
      console.error('AI Error:', error);
      alert('Error generating AI analysis. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  // AI: Suggest severity level based on description
  const handleAISuggestSeverity = async () => {
    if (!formData.description) return;
    setAiSeverityLoading(true);
    setAiSeverityHint(null);
    try {
      const response = await aiAssistantService.getSuggestions({
        industry: formData.industry_sector || 'General',
        category: 'Severity Classification',
        checklistItems: [
          `Classify the severity of this ${formData.incident_type || 'safety'} incident as exactly one of: Low, Medium, High, or Critical.\nDescription: ${formData.description}\nBody parts affected: ${selectedBodyParts.map(getBodyPartName).join(', ') || 'None'}\nInjury type: ${formData.injury_type || 'None'}\nRespond ONLY with: SEVERITY: [Low|Medium|High|Critical] — [one-sentence justification]`
        ],
        completedItems: 0,
      });
      const text = (response.data.suggestions ?? []).join(' ');
      const match = text.match(/\b(low|medium|high|critical)\b/i);
      if (match) {
        const sev = (match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase()) as 'Low' | 'Medium' | 'High' | 'Critical';
        setFormData(prev => ({ ...prev, severity: sev }));
        const justification = text.replace(/SEVERITY:?\s*\w+\s*[-—]?\s*/i, '').trim();
        setAiSeverityHint(`AI → ${sev}: ${justification.slice(0, 120)}`);
      } else {
        setAiSeverityHint('Could not determine severity — review manually.');
      }
    } catch {
      setAiSeverityHint('AI error — please review manually.');
    } finally {
      setAiSeverityLoading(false);
      setTimeout(() => setAiSeverityHint(null), 6000);
    }
  };

  // AI: Suggest immediate actions
  const handleAIImmediateActions = async () => {
    if (!formData.incident_type && !formData.description) return;
    setAiActionsLoading(true);
    try {
      const response = await aiAssistantService.getSuggestions({
        industry: formData.industry_sector || 'General',
        category: 'Immediate Emergency Response',
        checklistItems: [
          `For a ${formData.incident_type || 'safety incident'} at ${formData.location || 'the workplace'}: "${formData.description || 'incident occurred'}"\nList 4 specific immediate actions to take RIGHT NOW per OSHA/ISO 45001 emergency response requirements. Each action should be brief, imperative, and actionable.`
        ],
        completedItems: 0,
      });
      const actions = (response.data.suggestions ?? []).map(s => `• ${s}`).join('\n');
      setFormData(prev => ({
        ...prev,
        immediate_actions: prev.immediate_actions ? `${prev.immediate_actions}\n${actions}` : actions,
      }));
    } catch {
      // silent fail — user still has the field
    } finally {
      setAiActionsLoading(false);
    }
  };

  // Photo file selection handler
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    const newFiles = [...photoFiles, ...files].slice(0, 5); // max 5 photos
    setPhotoFiles(newFiles);
    // Revoke old URLs to prevent memory leaks
    photoUrls.forEach(u => URL.revokeObjectURL(u));
    setPhotoUrls(newFiles.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Frontend validation matching backend schema requirements
    const validationErrors: string[] = [];

    if (!formData.incident_type) {
      validationErrors.push('Please select an incident type.');
    }
    if (!formData.location.trim()) {
      validationErrors.push('Location is required.');
    }
    if (formData.description.trim().length < 10) {
      validationErrors.push('Description must be at least 10 characters.');
    }
    if (isInjuryIncidentType(formData.incident_type) && selectedBodyParts.length === 0) {
      validationErrors.push('For injury incidents, please select affected body part(s).');
    }
    if (isInjuryIncidentType(formData.incident_type) && !formData.injury_type) {
      validationErrors.push('For injury incidents, please select an injury type.');
    }

    if (validationErrors.length > 0) {
      alert(validationErrors.join('\n'));
      return;
    }

    setIsSubmitting(true);
    
    try {
      const payload = buildIncidentPayload(formData, selectedBodyParts, selectedStandards);
      await incidentService.create(payload);
      
      setIsSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (error: unknown) {
      console.error('Error submitting report:', error);
      setIsSubmitting(false);
      // Show specific backend validation issues if available
      const err = error as { issues?: { message: string }[]; message?: string };
      if (err?.issues?.length) {
        alert('Please fix the following:\n' + err.issues.map((i: { message: string }) => `• ${i.message}`).join('\n'));
      } else {
        alert(err?.message || 'Failed to submit report. Please try again.');
      }
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-24">

      
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-20 z-40 px-4 h-16 flex items-center gap-3 safe-top border-b border-surface-200 max-w-md mx-auto">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-surface-600" />
        </button>
        <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
        <h1 className="text-xl font-bold text-brand-900 flex items-center gap-2 tracking-tight">
          Report Incident
        </h1>
      </div>

      <main className="px-4 py-6 max-w-md mx-auto space-y-6 text-left">
        {/* API Key Input (Temporary for Demo) */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-900 p-6 rounded-[2rem] shadow-glow text-white space-y-4"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <Brain className="w-5 h-5 text-brand-300" />
            </div>
            <h3 className="font-bold tracking-tight">AI Assistance Ready</h3>
          </div>
          <p className="text-sm text-brand-100/90 leading-relaxed">
            AI suggestions now route through the backend. Real provider keys can be added later without exposing any secret in the browser.
          </p>
        </motion.div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-6 rounded-[2.5rem] shadow-soft border border-surface-100 space-y-6"
          >
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-brand-900 font-bold">
                <Info className="w-5 h-5 text-brand-500" />
                <h3>Incident Information</h3>
              </div>

              {/* Date and Time Row */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Date</label>
                  <input
                    type="date"
                    required
                    value={formData.incident_date}
                    onChange={(e) => setFormData({ ...formData, incident_date: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Time</label>
                  <input
                    type="time"
                    value={formData.incident_time}
                    onChange={(e) => setFormData({ ...formData, incident_time: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Location and Department */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Location</label>
                  <input
                    type="text"
                    required
                    placeholder="Area/Zone"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Department</label>
                  <input
                    type="text"
                    placeholder="Dept/Unit"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all text-sm"
                  />
                </div>
              </div>

              {/* Industry Sector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Industry Sector</label>
                <select
                  value={formData.industry_sector}
                  onChange={(e) => setFormData({ ...formData, industry_sector: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none text-sm"
                >
                  <option value="">Select Sector</option>
                  {INDUSTRY_SECTORS.map(sector => (
                    <option key={sector} value={sector}>{sector}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Incident Type</label>
                <select
                  required
                  value={formData.incident_type}
                  onChange={(e) => handleIncidentTypeChange(e.target.value)}
                  className="w-full px-4 py-4 bg-surface-50 border border-surface-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all appearance-none"
                >
                  <option value="">Select Type</option>
                  {INCIDENT_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
                {formData.incident_type && (
                  <p className="text-[10px] text-brand-500 ml-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" /> Relevant standards auto-selected below
                  </p>
                )}
              </div>

              {/* International Standards Compliance */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Applicable International Standards</label>
                <div className="p-4 bg-surface-50 border border-surface-100 rounded-2xl space-y-3">
                  <p className="text-xs text-surface-500">Select standards relevant to this incident for automated compliance mapping.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-2">
                    {allInternationalStandards.map(std => (
                      <label key={std.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        selectedStandards.includes(std.id)
                          ? 'bg-brand-50 border-brand-200 shadow-sm'
                          : 'bg-white border-surface-200 hover:border-brand-200'
                      }`}>
                        <div className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition-colors ${
                          selectedStandards.includes(std.id)
                            ? 'bg-brand-500 border-brand-500'
                            : 'border-surface-300 bg-white'
                        }`}>
                          {selectedStandards.includes(std.id) && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <input
                          type="checkbox"
                          className="hidden"
                          checked={selectedStandards.includes(std.id)}
                          onChange={() => handleStandardToggle(std.id)}
                        />
                        <div className="flex-1">
                          <p className={`text-sm font-bold ${selectedStandards.includes(std.id) ? 'text-brand-900' : 'text-surface-700'}`}>
                            {std.code}
                          </p>
                          <p className="text-xs text-surface-500 line-clamp-1">{std.title}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Interactive Body Diagram - for injury incidents */}
              {isInjuryIncidentType(formData.incident_type) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="p-4 bg-accent-50 rounded-2xl border border-accent-100 space-y-4"
                >
                  <div className="flex items-center gap-2 text-accent-700 font-bold">
                    <Heart className="w-5 h-5 text-red-500" />
                    <h4>Body Part(s) Affected</h4>
                  </div>
                  <p className="text-xs text-accent-600">Click on the body diagram to select affected areas (front and back views). Multiple selections allowed.</p>
                  
                  <div className="flex flex-col items-center gap-4">
                    <BodyDiagram
                      selectedParts={selectedBodyParts}
                      onPartClick={handleBodyPartClick}
                      multiSelect={true}
                      size="sm"
                      showBothViews={true}
                    />
                    
                    {selectedBodyParts.length > 0 && (
                      <div className="w-full p-3 bg-white rounded-xl border border-accent-200">
                        <label className="text-xs font-bold text-accent-600 uppercase mb-2 block">Selected Body Parts</label>
                        <div className="flex flex-wrap gap-1">
                          {selectedBodyParts.map(part => (
                            <span key={part} className="px-2 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                              {getBodyPartName(part)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-accent-600 uppercase tracking-widest ml-1">Injury Type</label>
                    <select
                      value={formData.injury_type}
                      onChange={(e) => setFormData({ ...formData, injury_type: e.target.value })}
                      className="w-full px-3 py-2.5 bg-white border border-accent-200 rounded-xl focus:ring-2 focus:ring-accent-500 outline-none text-sm"
                    >
                      <option value="">Select</option>
                      {INJURY_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </motion.div>
              )}

              {/* Immediate Actions & Witnesses */}
              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Immediate Actions Taken</label>
                  <button
                    type="button"
                    onClick={handleAIImmediateActions}
                    disabled={aiActionsLoading || (!formData.incident_type && !formData.description)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-600 text-[10px] font-bold rounded-lg hover:bg-brand-100 transition-all disabled:opacity-40"
                  >
                    {aiActionsLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    AI Fill
                  </button>
                </div>
                <textarea
                  rows={2}
                  placeholder="What was done immediately after the incident?"
                  value={formData.immediate_actions}
                  onChange={(e) => setFormData({ ...formData, immediate_actions: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all resize-none text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Witnesses (Names)</label>
                <input
                  type="text"
                  placeholder="Comma-separated names"
                  value={formData.witnesses}
                  onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none transition-all text-sm"
                />
              </div>

              {/* Regulatory Reportable */}
              <div className="flex items-center gap-3 p-4 bg-surface-50 rounded-xl">
                <input
                  type="checkbox"
                  id="regulatory"
                  checked={formData.regulatory_reportable}
                  onChange={(e) => setFormData({ ...formData, regulatory_reportable: e.target.checked })}
                  className="w-5 h-5 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
                />
                <label htmlFor="regulatory" className="text-sm font-medium text-brand-800">
                  OSHA/Regulatory Reportable Incident
                </label>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">Severity Level</label>
                  <button
                    type="button"
                    onClick={handleAISuggestSeverity}
                    disabled={aiSeverityLoading || !formData.description}
                    className="flex items-center gap-1 px-2.5 py-1 bg-brand-50 border border-brand-100 text-brand-600 text-[10px] font-bold rounded-lg hover:bg-brand-100 transition-all disabled:opacity-40"
                  >
                    {aiSeverityLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                    AI Suggest
                  </button>
                </div>
                {aiSeverityHint && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-[10px] text-brand-600 bg-brand-50 border border-brand-100 rounded-lg px-3 py-2 leading-relaxed"
                  >
                    {aiSeverityHint}
                  </motion.p>
                )}
                <div className="grid grid-cols-2 gap-2">
                  {SEVERITY_LEVELS.map(level => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setFormData({ ...formData, severity: level })}
                      className={`py-3 rounded-xl text-sm font-bold transition-all border ${
                        formData.severity === level
                          ? 'bg-brand-900 text-white border-brand-900 shadow-md'
                          : 'bg-surface-50 text-surface-500 border-surface-100 hover:border-brand-200'
                      }`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Description</label>
                <textarea
                  required
                  rows={4}
                  placeholder="Describe what happened in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-4 bg-surface-50 border border-surface-100 rounded-2xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all resize-none"
                />
              </div>

              {/* AI Analysis Trigger */}
              <button
                type="button"
                onClick={handleAISuggest}
                disabled={aiLoading || !formData.description}
                className="w-full py-4 bg-brand-50 text-brand-600 rounded-2xl border border-brand-100 flex items-center justify-center gap-2 font-bold text-sm hover:bg-brand-100 transition-all disabled:opacity-50"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI Root Cause & Action Suggestion
              </button>
            </div>

            {/* AI Results Section */}
            <AnimatePresence>
              {(formData.root_causes || formData.corrective_actions) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-6 pt-6 border-t border-surface-100"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                      <ShieldCheck className="w-4 h-4 text-brand-500" />
                      <h4>Root Causes (ISO 14001/OH&S)</h4>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.root_causes}
                      onChange={(e) => setFormData({ ...formData, root_causes: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                      <ClipboardList className="w-4 h-4 text-brand-500" />
                      <h4>Corrective Actions</h4>
                    </div>
                    <textarea
                      rows={3}
                      value={formData.corrective_actions}
                      onChange={(e) => setFormData({ ...formData, corrective_actions: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-brand-900 font-bold text-sm">
                      <User className="w-4 h-4 text-brand-500" />
                      <h4>Assign Action Plan To</h4>
                    </div>
                    <select
                      value={formData.assigned_to}
                      onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
                    >
                        <option value="">Select Team Member</option>
                        {workers.map(worker => (
                          <option key={worker.id} value={`${worker.name}${worker.jobTitle ? ` (${worker.jobTitle})` : ''}`}>
                            {worker.name}{worker.jobTitle ? ` — ${worker.jobTitle}` : ''}{worker.department ? ` · ${worker.department}` : ''}
                          </option>
                        ))}
                        {workers.length === 0 && (
                          <option disabled>Loading team members...</option>
                        )}
                    </select>
                  </div>

                  {/* Due Date and ISO Clause */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Due Date</label>
                      <input
                        type="date"
                        value={formData.due_date}
                        onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">ISO 9001 Clause</label>
                      <select
                        value={formData.iso_clause}
                        onChange={(e) => setFormData({ ...formData, iso_clause: e.target.value })}
                        className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500 transition-all appearance-none"
                      >
                        <option value="">Select Clause</option>
                        {ISO_CLAUSES.map(clause => (
                          <option key={clause.id} value={clause.id}>{clause.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Photo Upload */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-surface-400 uppercase tracking-widest ml-1">Evidence Photos (max 5)</label>
              <label className="w-full py-8 border-2 border-dashed border-surface-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-surface-400 hover:text-brand-500 hover:border-brand-500 transition-all bg-surface-50/50 cursor-pointer">
                <Camera className="w-8 h-8" />
                <span className="text-sm font-medium">
                  {photoFiles.length > 0 ? `${photoFiles.length} photo${photoFiles.length > 1 ? 's' : ''} selected — tap to add more` : 'Tap to take or upload photos'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handlePhotoSelect}
                />
              </label>
              {photoUrls.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {photoUrls.map((url, i) => (
                    <div key={i} className="relative group">
                      <img src={url} alt={`Evidence ${i + 1}`} className="w-20 h-20 object-cover rounded-xl border border-surface-200" />
                      <button
                        type="button"
                        onClick={() => {
                          const newFiles = photoFiles.filter((_, idx) => idx !== i);
                          URL.revokeObjectURL(photoUrls[i]);
                          setPhotoFiles(newFiles);
                          setPhotoUrls(newFiles.map(f => URL.createObjectURL(f)));
                        }}
                        className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >×</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Submit Button */}
          <div className="flex gap-3">
            <motion.button
              type="button"
              onClick={() => {
                const reportId = generateReportId('incident');
                exportIncidentReportToPDF({
                  reportType: 'incident',
                  reportId,
                  date: formData.incident_date,
                  time: formData.incident_time,
                  location: formData.location,
                  department: formData.department,
                  industrySector: formData.industry_sector,
                  incidentType: formData.incident_type,
                  severity: formData.severity,
                  description: formData.description,
                  immediateActions: formData.immediate_actions,
                  witnesses: formData.witnesses,
                  regulatoryReportable: formData.regulatory_reportable,
                  rootCauses: formData.root_causes,
                  correctiveActions: formData.corrective_actions,
                  assignedTo: formData.assigned_to,
                  dueDate: formData.due_date,
                  isoClause: formData.iso_clause,
                  bodyPartsAffected: selectedBodyParts.map(p => getBodyPartName(p)),
                  generatedBy: 'Current User',
                  generatedDate: new Date().toLocaleString()
                });
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-5 bg-white text-brand-700 border-2 border-brand-200 rounded-[2rem] font-bold text-lg flex items-center justify-center gap-3 hover:bg-brand-50 transition-colors"
            >
              <Download className="w-5 h-5" />
              Export PDF
            </motion.button>
            
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isSubmitting}
              className={`flex-[2] py-5 rounded-[2rem] shadow-glow flex items-center justify-center gap-3 text-white font-bold text-lg transition-all ${
                isSubmitting ? 'bg-surface-400' : 'bg-brand-900'
              }`}
            >
              {isSubmitting ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Submit Report
                </>
              )}
            </motion.button>
          </div>
        </form>
      </main>

      {/* Success Overlay */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-brand-950/90 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-white p-8 rounded-[3rem] text-center space-y-4 max-w-xs w-full"
            >
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-brand-900">Report Submitted</h2>
                <p className="text-surface-500 text-sm">The incident has been logged and safety officers have been notified.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default IncidentReporting;
