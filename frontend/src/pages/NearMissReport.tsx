import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Camera, Send, CheckCircle2, MapPin, Calendar, Info,
  Brain, Sparkles, Loader2, User, ClipboardList, ShieldCheck, FileText, Shield,
  Building2, Scale, Globe, Clock, AlertCircle, Target, Zap, Download, Plus, X, Eye
} from 'lucide-react';
import { useCreateNearMissReport } from '../api/hooks/useAPIHooks';
import { SMButton, SMInput, SMSelect, SMTabs } from '../components/ui';

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index} className="font-semibold text-text-primary">{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={index}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return <code key={index} className="rounded bg-surface-raised px-1 py-0.5 font-mono text-xs text-primary">{part.slice(1, -1)}</code>;
    }
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bullets: string[] = [];
  let ordered: string[] = [];
  let keyIndex = 0;

  const flushLists = () => {
    if (bullets.length > 0) {
      elements.push(
        <ul key={`ul-${keyIndex++}`} className="my-2 space-y-2">
          {bullets.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-sm leading-6 text-text-primary">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      bullets = [];
    }

    if (ordered.length > 0) {
      elements.push(
        <ol key={`ol-${keyIndex++}`} className="my-2 space-y-2">
          {ordered.map((item, index) => (
            <li key={index} className="flex items-start gap-3 text-sm leading-6 text-text-primary">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">{index + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      ordered = [];
    }
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();

    if (!trimmed) {
      flushLists();
      return;
    }

    if (/^##\s+/.test(trimmed)) {
      flushLists();
      elements.push(<h3 key={`h2-${index}`} className="mt-4 text-base font-bold text-text-primary first:mt-0">{renderInline(trimmed.replace(/^##\s+/, ''))}</h3>);
      return;
    }

    if (/^#\s+/.test(trimmed)) {
      flushLists();
      elements.push(<h2 key={`h1-${index}`} className="mt-4 text-lg font-bold text-text-primary first:mt-0">{renderInline(trimmed.replace(/^#\s+/, ''))}</h2>);
      return;
    }

    if (/^[-*•]\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^[-*•]\s+/, ''));
      return;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      ordered.push(trimmed.replace(/^\d+\.\s+/, ''));
      return;
    }

    flushLists();
    elements.push(<p key={`p-${index}`} className="text-sm leading-6 text-text-secondary">{renderInline(trimmed)}</p>);
  });

  flushLists();
  return <div className="space-y-2">{elements}</div>;
}

function getNearMissAIStreamUrl() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();
  const base = configuredBaseUrl && configuredBaseUrl.length > 0 ? configuredBaseUrl : '/api';
  return `${base}/near-miss-reports/ai-analysis/stream`;
}

function getAuthHeader(): Record<string, string> {
  try {
    const stored = localStorage.getItem('safetymeg-auth');
    if (stored) {
      const { state } = JSON.parse(stored);
      if (state?.accessToken) {
        return { Authorization: `Bearer ${state.accessToken}` };
      }
    }
  } catch {
    // ignore malformed auth cache
  }
  return {};
}

// OSHA Regulatory Requirements for Near Miss Reporting
const OSHA_REQUIREMENTS = [
  { id: '1904.39', label: '1904.39 - Reporting fatalities, hospitalizations, amputations, and losses of an eye' },
  { id: '1910.38', label: '1910.38 - Emergency action plans' },
  { id: '1910.119', label: '1910.119 - Process safety management' },
  { id: '1926.20', label: '1926.20 - General safety and health provisions' },
  { id: '1926.32', label: '1926.32 - Definitions (Competent Person)' },
];

// ISO Standards for Near Miss Management
const ISO_STANDARDS = [
  { id: 'ISO-45001-6.1', label: 'ISO 45001:2018 - 6.1 Actions to address risks and opportunities' },
  { id: 'ISO-45001-10.2', label: 'ISO 45001:2018 - 10.2 Incident, nonconformity and corrective action' },
  { id: 'ISO-14001-6.1', label: 'ISO 14001:2015 - 6.1 Actions to address risks and opportunities' },
  { id: 'ISO-9001-10.2', label: 'ISO 9001:2015 - 10.2 Nonconformity and corrective action' },
  { id: 'ISO-31000', label: 'ISO 31000:2018 - Risk management guidelines' },
];

// International Standards for Near Miss Reporting
const INTERNATIONAL_STANDARDS = [
  { id: 'EU-89/391/EEC', label: 'EU Framework Directive 89/391/EEC - OSH obligations' },
  { id: 'EU-OSHA-NM', label: 'EU-OSHA Near Miss Reporting Guidelines' },
  { id: 'NEBOSH-NGC1-4', label: 'NEBOSH NGC1 Element 4 - Health and safety management systems' },
  { id: 'NEBOSH-IGC-5', label: 'NEBOSH IGC Element 5 - Measuring health and safety performance' },
  { id: 'GCC-OSHAD-SF-3', label: 'GCC OSHAD-SF Mechanism 3.0 - Incident reporting' },
  { id: 'AS-NZS-4801-4.5', label: 'AS/NZS 4801:2001 Cl.4.5.3 - Incident investigation' },
  { id: 'CSA-Z1000-12', label: 'CSA Z1000-14 Cl.12 - Incident investigation and analysis' },
  { id: 'MSHA-30CFR50', label: 'MSHA 30 CFR Part 50 - Notification, investigation, reports' },
  { id: 'IMO-MSC-Circ', label: 'IMO MSC-MEPC.7/Circ.7 - Near miss reporting guidelines' },
  { id: 'IATA-NM', label: 'IATA Safety Reporting - Near miss taxonomy' },
  { id: 'WHO-WPSS', label: 'WHO WPSS - World Patient Safety Standards' },
  { id: 'HACCP-NM', label: 'HACCP Principle 5 - Corrective actions for near misses' },
  { id: 'DOT-49CFR', label: 'DOT 49 CFR Part 191 - Transportation incident reporting' },
  { id: 'BSEE-30CFR250', label: 'BSEE 30 CFR 250.188 - Incident reporting for offshore' },
  { id: 'API-RP-754', label: 'API RP 754 - Process Safety Performance Indicators' },
  { id: 'NFPA-610', label: 'NFPA Near Miss Reporting Standard - Fire incident analysis' },
  { id: 'EPA-EPCRA', label: 'EPA EPCRA - Emergency Planning and Community Right-to-Know' },
  { id: 'NIOSH-HHE', label: 'NIOSH Health Hazard Evaluation - Near miss protocols' },
  { id: 'ANSI-Z10', label: 'ANSI/ASSP Z10-2019 - OHS Management Systems' },
  { id: 'ASME-CSD-1', label: 'ASME CSD-1 - Controls and Safety Devices' },
];

// Weather Conditions at Time of Event
const WEATHER_CONDITIONS = [
  'Clear/Sunny', 'Partly Cloudy', 'Overcast', 'Rain (Light)', 'Rain (Heavy)',
  'Snow', 'Ice/Sleet', 'Fog/Mist', 'Wind (High)', 'Extreme Heat (>95°F/35°C)',
  'Extreme Cold (<32°F/0°C)', 'Thunderstorm', 'Dust Storm', 'Indoor (N/A)', 'Other',
];

// PPE Being Worn at Time of Event
const PPE_OPTIONS = [
  'Hard Hat', 'Safety Glasses', 'Safety Goggles', 'Face Shield', 'Hearing Protection (Plugs)',
  'Hearing Protection (Muffs)', 'High-Visibility Vest', 'Steel-Toe Boots', 'Chemical Gloves',
  'Cut-Resistant Gloves', 'Leather Gloves', 'Dust Mask (N95)', 'Half-Face Respirator',
  'Full-Face Respirator', 'SCBA', 'Fall Harness', 'Flame-Resistant Clothing', 'Chemical Suit',
  'Welding Helmet', 'Knee Pads', 'Metatarsal Guards', 'Safety Lanyard', 'Life Jacket/PFD',
  'Radiation Badge', 'Anti-Static Wrist Strap', 'None',
];

// Equipment Involved
const EQUIPMENT_TYPES = [
  'Forklift / Powered Industrial Truck', 'Crane / Hoist', 'Scaffolding', 'Ladder',
  'Aerial Lift / Cherry Picker', 'Conveyor Belt', 'Press / Stamping Machine',
  'CNC Machine / Lathe', 'Welding Equipment', 'Cutting Tools (Power)',
  'Hand Tools', 'Electrical Panel / Equipment', 'Compressor / Pneumatic',
  'Generator', 'Pump System', 'Tank / Vessel', 'Pipeline / Piping',
  'Vehicle (Car/Truck)', 'Heavy Equipment (Excavator/Dozer)', 'Chemical Storage Unit',
  'HVAC System', 'Fire Suppression System', 'Emergency Shower / Eyewash',
  'Robotic System', 'Drone / UAV', 'IoT Sensor Array', 'None / N/A',
];

// Near Miss Categories
const NEAR_MISS_CATEGORIES = [
  'Slip/Trip/Fall (no contact)',
  'Falling Object (missed person)',
  'Equipment Malfunction',
  'Chemical Exposure (potential)',
  'Electrical Hazard',
  'Struck-By (near contact)',
  'Caught-In/Between (near)',
  'Ergonomic Hazard',
  'Fire/Explosion Risk',
  'Vehicle/Pedestrian Close Call',
  'Confined Space Hazard',
  'Working at Heights',
  'Environmental Release (potential)',
  'Process Safety Event',
  'Security Breach',
  'Other',
];

// Potential Severity Levels (if event had occurred)
const POTENTIAL_SEVERITY = [
  { level: 'Minor', description: 'First aid or less', color: 'bg-success/15 text-success border-success/30' },
  { level: 'Moderate', description: 'Medical treatment, restricted work', color: 'bg-warning/15 text-warning border-warning/30' },
  { level: 'Serious', description: 'Lost time, hospitalization', color: 'bg-warning/20 text-warning border-warning/40' },
  { level: 'Critical', description: 'Fatality, permanent disability', color: 'bg-danger/15 text-danger border-danger/30' },
];

// Industry Sectors
const INDUSTRY_SECTORS = [
  'Oil & Gas',
  'Construction',
  'Manufacturing',
  'Machine Shops',
  'Healthcare',
  'Transportation',
  'Warehouse',
  'Mining',
  'Utilities',
  'General Industry',
];

// Contributing Factors (Human Factors Analysis)
const CONTRIBUTING_FACTORS = {
  'Human Factors': [
    'Fatigue/Alertness',
    'Training Deficiency',
    'Communication Failure',
    'Complacency',
    'Rushing/Time Pressure',
    'Distraction',
    'Rule Violation',
    'Physical Limitation',
  ],
  'Environmental': [
    'Poor Lighting',
    'Noise Level',
    'Temperature Extremes',
    'Weather Conditions',
    'Housekeeping Issues',
    'Workspace Layout',
  ],
  'Equipment': [
    'Mechanical Failure',
    'Missing Guards/Barriers',
    'Inadequate PPE',
    'Tool Condition',
    'Maintenance Issues',
    'Design Deficiency',
  ],
  'Organizational': [
    'Inadequate Procedures',
    'Supervision Gap',
    'Resource Constraints',
    'Schedule Pressure',
    'Policy Non-compliance',
    'Culture Issues',
  ],
};

// Corrective Action with Owner Assignment
interface CorrectiveAction {
  id: string;
  action: string;
  assignedTo: string;
  assigneeEmail: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue';
  sendEmailNotification: boolean;
  completionNotes?: string;
}

interface NearMissData {
  reportId: string;
  reportDate: string;
  reportTime: string;
  reportedBy: string;
  jobTitle: string;
  department: string;
  location: string;
  specificArea: string;
  industrySector: string;
  eventDate: string;
  eventTime: string;
  category: string;
  potentialSeverity: string;
  description: string;
  immediateActions: string;
  witnessList: string[];
  oshaReferences: string[];
  isoReferences: string[];
  internationalReferences: string[];
  contributingFactors: string[];
  rootCauseAnalysis: string;
  weatherCondition: string;
  ppeWorn: string[];
  equipmentInvolved: string[];
  correctiveActions: CorrectiveAction[];
  photos: string[];
  aiAnalysis: string;
}

export const NearMissReport: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'details' | 'analysis' | 'compliance' | 'actions'>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [newWitness, setNewWitness] = useState('');
  const [showActionModal, setShowActionModal] = useState(false);
  const [editingAction, setEditingAction] = useState<CorrectiveAction | null>(null);
  const [newCorrectiveAction, setNewCorrectiveAction] = useState<Partial<CorrectiveAction>>({
    action: '',
    assignedTo: '',
    assigneeEmail: '',
    dueDate: '',
    priority: 'Medium',
    status: 'Open',
    sendEmailNotification: true
  });

  const { mutate: createReportMutate } = useCreateNearMissReport();
  const [formData, setFormData] = useState<NearMissData>({
    reportId: `NM-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}`,
    reportDate: new Date().toISOString().split('T')[0],
    reportTime: new Date().toTimeString().slice(0, 5),
    reportedBy: '',
    jobTitle: '',
    department: '',
    location: '',
    specificArea: '',
    industrySector: '',
    eventDate: new Date().toISOString().split('T')[0],
    eventTime: '',
    category: '',
    potentialSeverity: '',
    description: '',
    immediateActions: '',
    witnessList: [],
    oshaReferences: [],
    isoReferences: [],
    internationalReferences: [],
    contributingFactors: [],
    rootCauseAnalysis: '',
    weatherCondition: '',
    ppeWorn: [],
    equipmentInvolved: [],
    correctiveActions: [],
    photos: [],
    aiAnalysis: '',
  });

  const requiredFields = [
    formData.reportedBy,
    formData.eventDate,
    formData.eventTime,
    formData.location,
    formData.category,
    formData.potentialSeverity,
    formData.description,
  ];
  const completedRequiredFields = requiredFields.filter(Boolean).length;
  const completionPercent = Math.round((completedRequiredFields / requiredFields.length) * 100);
  const analysisReadiness = formData.category && formData.industrySector && formData.potentialSeverity;
  const complianceSelections = formData.oshaReferences.length + formData.isoReferences.length + formData.internationalReferences.length;

  const handleInputChange = (field: keyof NearMissData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleArrayItem = (field: 'oshaReferences' | 'isoReferences' | 'contributingFactors' | 'internationalReferences' | 'ppeWorn' | 'equipmentInvolved', item: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(item)
        ? prev[field].filter(i => i !== item)
        : [...prev[field], item],
    }));
  };

  const addWitness = () => {
    if (newWitness.trim()) {
      setFormData(prev => ({ ...prev, witnessList: [...prev.witnessList, newWitness.trim()] }));
      setNewWitness('');
    }
  };

  const removeWitness = (index: number) => {
    setFormData(prev => ({ ...prev, witnessList: prev.witnessList.filter((_, i) => i !== index) }));
  };

  const addCorrectiveAction = () => {
    if (newCorrectiveAction.action && newCorrectiveAction.assignedTo && newCorrectiveAction.dueDate) {
      const newAction: CorrectiveAction = {
        id: `CA-${Date.now()}`,
        action: newCorrectiveAction.action || '',
        assignedTo: newCorrectiveAction.assignedTo || '',
        assigneeEmail: newCorrectiveAction.assigneeEmail || '',
        dueDate: newCorrectiveAction.dueDate || '',
        priority: newCorrectiveAction.priority || 'Medium',
        status: 'Open',
        sendEmailNotification: newCorrectiveAction.sendEmailNotification ?? true
      };
      setFormData(prev => ({ ...prev, correctiveActions: [...prev.correctiveActions, newAction] }));
      setNewCorrectiveAction({
        action: '',
        assignedTo: '',
        assigneeEmail: '',
        dueDate: '',
        priority: 'Medium',
        status: 'Open',
        sendEmailNotification: true
      });
      setShowActionModal(false);
    }
  };

  const removeCorrectiveAction = (id: string) => {
    setFormData(prev => ({ ...prev, correctiveActions: prev.correctiveActions.filter(a => a.id !== id) }));
  };

  const updateActionStatus = (id: string, status: CorrectiveAction['status']) => {
    setFormData(prev => ({
      ...prev,
      correctiveActions: prev.correctiveActions.map(a => a.id === id ? { ...a, status } : a)
    }));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Critical': return 'bg-danger/15 text-danger border-danger/30';
      case 'High': return 'bg-warning/20 text-warning border-warning/40';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-success/15 text-success border-success/30';
      default: return 'bg-surface-100 text-surface-700 border-surface-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Overdue': return 'bg-danger/15 text-danger border-danger/30';
      case 'Open': return 'bg-surface-100 text-surface-700 border-surface-200';
      default: return 'bg-surface-100 text-surface-700 border-surface-200';
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    setFormData(prev => ({ ...prev, aiAnalysis: '' }));

    try {
      const response = await fetch(getNearMissAIStreamUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeader(),
        },
        body: JSON.stringify({
          category: formData.category,
          potentialSeverity: formData.potentialSeverity,
          industrySector: formData.industrySector,
          location: formData.location,
          specificArea: formData.specificArea,
          oshaReferences: formData.oshaReferences,
          isoReferences: formData.isoReferences,
          contributingFactors: formData.contributingFactors,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`AI analysis request failed with status ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        if (!chunk) continue;

        fullText += chunk;
        setFormData(prev => ({ ...prev, aiAnalysis: fullText }));
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await createReportMutate({
        reportId: formData.reportId,
        reportDate: formData.reportDate,
        reportTime: formData.reportTime,
        reportedBy: formData.reportedBy,
        jobTitle: formData.jobTitle,
        department: formData.department,
        location: formData.location,
        specificArea: formData.specificArea,
        industrySector: formData.industrySector,
        eventDate: formData.eventDate,
        eventTime: formData.eventTime,
        category: formData.category,
        potentialSeverity: formData.potentialSeverity,
        description: formData.description,
        immediateActions: formData.immediateActions,
        witnessList: formData.witnessList,
        oshaReferences: formData.oshaReferences,
        isoReferences: formData.isoReferences,
        internationalReferences: formData.internationalReferences,
        contributingFactors: formData.contributingFactors,
        rootCauseAnalysis: formData.rootCauseAnalysis,
        weatherCondition: formData.weatherCondition,
        ppeWorn: formData.ppeWorn,
        equipmentInvolved: formData.equipmentInvolved,
        correctiveActions: formData.correctiveActions,
        photos: formData.photos,
        aiAnalysis: formData.aiAnalysis,
      });
      setShowSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs = [
    { id: 'details', label: 'Event Details', icon: ClipboardList },
    { id: 'analysis', label: 'Analysis', icon: Brain },
    { id: 'compliance', label: 'Compliance', icon: Scale },
    { id: 'actions', label: 'Actions', icon: Target },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(16,185,129,0.07),transparent_24%),linear-gradient(180deg,var(--surface-base),var(--surface-sunken))] pb-40">

      
      {/* Header */}
      <header className="sticky top-[var(--nav-height)] z-40 border-b border-surface-border/80 bg-surface-raised/95 backdrop-blur-xl">
        <div className="mx-auto max-w-[1520px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <SMButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-5 h-5" />} onClick={() => navigate(-1)} aria-label="Back" />
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-warning/15 shadow-soft ring-1 ring-warning/20">
                  <AlertTriangle className="w-6 h-6 text-warning" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-text-primary">Near Miss Report</h1>
                  <p className="text-sm text-text-muted">OSHA, ISO, and international compliance workflow for high-quality near miss documentation.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:justify-end">
              <span className="rounded-full border border-surface-border bg-surface-sunken px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-text-muted">
                Completion {completionPercent}%
              </span>
              <span className="rounded-full border border-warning/20 bg-warning/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                Potential event escalation
              </span>
              <span className="rounded-xl bg-surface-sunken px-3 py-1.5 font-mono text-sm text-text-secondary shadow-inner">
                {formData.reportId}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-[1520px] px-4 py-6 pb-44 sm:px-6 lg:px-8">
        <SMTabs value={activeTab} onChange={(value) => setActiveTab(value as 'details' | 'analysis' | 'compliance' | 'actions')} className="space-y-6">
          <section className="rounded-[28px] border border-surface-border bg-surface-raised p-5 shadow-card sm:p-6">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 rounded-full border border-warning/20 bg-warning/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-warning">
                  Near miss workflow
                </div>
                <h2 className="text-xl font-bold text-text-primary sm:text-2xl">Clear, step-by-step reporting without the extra clutter.</h2>
                <p className="max-w-3xl text-sm leading-6 text-text-secondary">
                  Use the tabs to move between event details, analysis, compliance, and actions. Each section is now separated so the page feels calmer and easier to scan.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3 xl:min-w-[520px]">
                <div className="rounded-2xl bg-surface-sunken p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Completion</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">{completionPercent}%</p>
                  <p className="mt-1 text-sm text-text-secondary">{completedRequiredFields}/{requiredFields.length} required fields</p>
                </div>
                <div className="rounded-2xl bg-surface-sunken p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">AI readiness</p>
                  <p className="mt-2 text-lg font-semibold text-text-primary">{analysisReadiness ? 'Ready' : 'Needs details'}</p>
                  <p className="mt-1 text-sm text-text-secondary">Category, sector, and severity</p>
                </div>
                <div className="rounded-2xl bg-surface-sunken p-4">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Compliance links</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">{complianceSelections}</p>
                  <p className="mt-1 text-sm text-text-secondary">Selected references</p>
                </div>
              </div>
            </div>
          </section>

          <div className="rounded-[24px] border border-surface-border bg-surface-raised p-2 shadow-soft">
            <SMTabs.List className="flex-wrap gap-1 border-0">
              {tabs.map(tab => (
                <SMTabs.Trigger key={tab.id} value={tab.id} className="inline-flex items-center gap-2 rounded-2xl border-b-0 px-4 py-3 data-[state=active]:shadow-soft">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </SMTabs.Trigger>
              ))}
            </SMTabs.List>
          </div>

          <SMTabs.Content value="details" className="pt-0">
            <div className="space-y-6">
              {/* Reporter Information */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="mb-5 flex flex-col gap-4 border-b border-surface-border pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                      <User className="h-5 w-5 text-accent" />
                      Reporter Information
                    </h3>
                    <p className="mt-1 text-sm text-text-muted">Identify the reporting person clearly so the case can be reviewed and closed without delays.</p>
                  </div>
                  <div className="rounded-2xl bg-surface-sunken px-4 py-3 text-right">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Ownership</p>
                    <p className="mt-1 text-sm font-semibold text-text-primary">Reporter identity and team</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <SMInput label="Reported By *" type="text" value={formData.reportedBy} onChange={e => handleInputChange('reportedBy', e.target.value)} placeholder="Full Name" />
                  <SMInput label="Job Title" type="text" value={formData.jobTitle} onChange={e => handleInputChange('jobTitle', e.target.value)} placeholder="Position" />
                  <SMInput label="Department" type="text" value={formData.department} onChange={e => handleInputChange('department', e.target.value)} placeholder="Department/Team" />
                </div>
              </div>

              {/* Event Information */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="mb-5 flex flex-col gap-4 border-b border-surface-border pb-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <h3 className="mb-1 flex items-center gap-2 text-lg font-semibold text-text-primary">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Event Information
                    </h3>
                    <p className="text-sm text-text-muted">Log when, where, and how serious the exposure could have become. This is the core event record.</p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl bg-surface-sunken px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Category</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">{formData.category || 'Not selected'}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-sunken px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Potential severity</p>
                      <p className="mt-1 text-sm font-medium text-text-primary">{formData.potentialSeverity || 'Not selected'}</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <SMInput label="Event Date *" type="date" value={formData.eventDate} onChange={e => handleInputChange('eventDate', e.target.value)} />
                  <SMInput label="Event Time *" type="time" value={formData.eventTime} onChange={e => handleInputChange('eventTime', e.target.value)} />
                  <SMSelect label="Industry Sector" value={formData.industrySector} onChange={e => handleInputChange('industrySector', e.target.value)} options={[{ value: '', label: 'Select Sector' }, ...INDUSTRY_SECTORS.map(s => ({ value: s, label: s }))]} />
                  <SMSelect label="Near Miss Category *" value={formData.category} onChange={e => handleInputChange('category', e.target.value)} options={[{ value: '', label: 'Select Category' }, ...NEAR_MISS_CATEGORIES.map(c => ({ value: c, label: c }))]} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <SMInput label="Location *" type="text" value={formData.location} onChange={e => handleInputChange('location', e.target.value)} placeholder="Building/Site Name" />
                  <SMInput label="Specific Area" type="text" value={formData.specificArea} onChange={e => handleInputChange('specificArea', e.target.value)} placeholder="Room, Zone, Equipment ID" />
                </div>

                {/* Potential Severity */}
                <div className="mb-5 rounded-3xl border border-surface-border bg-surface-sunken/80 p-4 sm:p-5">
                  <label className="mb-2 block text-sm font-medium text-text-secondary">Potential Severity (if event had occurred) *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {POTENTIAL_SEVERITY.map(sev => (
                      <button
                        key={sev.level}
                        type="button"
                        onClick={() => handleInputChange('potentialSeverity', sev.level)}
                        className={`rounded-2xl border-2 p-3 text-left transition-all ${
                          formData.potentialSeverity === sev.level
                            ? `${sev.color} border-current shadow-md`
                            : 'border-surface-border bg-surface-raised hover:border-accent/30 hover:shadow-soft'
                        }`}
                      >
                        <div className="font-semibold text-sm">{sev.level}</div>
                        <div className="text-xs opacity-75">{sev.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <SMInput label="Event Description *" as="textarea" value={formData.description} onChange={e => handleInputChange('description', e.target.value)} rows={4} placeholder="Describe what happened, who was involved, what could have occurred..." />
              </div>

              {/* Immediate Actions & Witnesses */}
              <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                  <div className="mb-5 flex items-start justify-between gap-4 border-b border-surface-border pb-5">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                        <Zap className="w-5 h-5 text-success" />
                        Immediate Actions Taken
                      </h3>
                      <p className="mt-1 text-sm text-text-muted">Record the exact response used to secure people, equipment, or the work area right away.</p>
                    </div>
                    <div className="hidden rounded-2xl bg-success/10 px-4 py-3 text-success ring-1 ring-success/20 sm:block">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                  </div>
                  <SMInput label="" as="textarea" value={formData.immediateActions} onChange={e => handleInputChange('immediateActions', e.target.value)} rows={6} placeholder="What actions were taken immediately to secure the area or prevent recurrence..." />
                </div>

                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                  <div className="mb-5 flex items-start justify-between gap-4 border-b border-surface-border pb-5">
                    <div>
                      <h3 className="flex items-center gap-2 text-lg font-semibold text-text-primary">
                        <Eye className="w-5 h-5 text-primary" />
                        Witnesses
                      </h3>
                      <p className="mt-1 text-sm text-text-muted">Add people who saw the unsafe condition, the task, or the immediate response.</p>
                    </div>
                    <div className="rounded-2xl bg-primary/10 px-3 py-2 text-sm font-semibold text-primary ring-1 ring-primary/20">
                      {formData.witnessList.length} added
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      type="text"
                      value={newWitness}
                      onChange={e => setNewWitness(e.target.value)}
                      className="min-h-[52px] flex-1 rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 text-text-primary focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                      placeholder="Witness name"
                      onKeyPress={e => e.key === 'Enter' && addWitness()}
                    />
                    <button
                      type="button"
                      onClick={addWitness}
                      className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-2xl bg-accent px-5 py-3 font-medium text-white shadow-soft transition-colors hover:bg-accent/90"
                    >
                      <Plus className="w-5 h-5" />
                      Add witness
                    </button>
                  </div>
                  <div className="mt-4 flex min-h-[84px] flex-wrap gap-2 rounded-2xl border border-dashed border-surface-border bg-surface-sunken/70 p-3">
                    {formData.witnessList.length > 0 ? formData.witnessList.map((witness, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 rounded-full bg-surface-raised px-3 py-2 text-sm text-text-secondary shadow-soft">
                        {witness}
                        <button type="button" onClick={() => removeWitness(idx)} className="transition-colors hover:text-danger">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    )) : (
                      <p className="self-center text-sm text-text-muted">No witnesses added yet.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Weather, PPE, Equipment Section */}
              <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.7fr_1fr_1fr]">
                {/* Weather Conditions */}
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-5 shadow-card">
                  <div className="mb-4 border-b border-surface-border pb-4">
                    <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-sky-500" />
                    Weather Conditions
                    </h3>
                    <p className="text-sm text-text-muted">Capture environmental context for better analysis.</p>
                  </div>
                  <SMSelect label="" value={formData.weatherCondition} onChange={e => handleInputChange('weatherCondition', e.target.value)} placeholder="Select weather..." options={WEATHER_CONDITIONS.map(w => ({ value: w, label: w }))} />
                </div>

                {/* PPE Worn */}
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-5 shadow-card">
                  <div className="mb-4 flex items-start justify-between gap-3 border-b border-surface-border pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    PPE Worn ({formData.ppeWorn.length})
                      </h3>
                      <p className="text-sm text-text-muted">Mark all protective equipment present at the time.</p>
                    </div>
                    <span className="rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">Selected {formData.ppeWorn.length}</span>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
                    {PPE_OPTIONS.map(ppe => (
                      <button
                        key={ppe}
                        type="button"
                        onClick={() => toggleArrayItem('ppeWorn', ppe)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                          formData.ppeWorn.includes(ppe)
                            ? 'bg-success/10 font-semibold text-success ring-1 ring-success/20'
                            : 'text-text-secondary hover:bg-surface-overlay'
                        }`}
                      >
                        {formData.ppeWorn.includes(ppe) ? '✓ ' : ''}{ppe}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment Involved */}
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-5 shadow-card">
                  <div className="mb-4 flex items-start justify-between gap-3 border-b border-surface-border pb-4">
                    <div>
                      <h3 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Equipment Involved ({formData.equipmentInvolved.length})
                      </h3>
                      <p className="text-sm text-text-muted">Identify any tools, vehicles, or systems connected to the near miss.</p>
                    </div>
                    <span className="rounded-full bg-warning/10 px-3 py-1 text-xs font-semibold text-warning">Selected {formData.equipmentInvolved.length}</span>
                  </div>
                  <div className="max-h-[260px] overflow-y-auto space-y-1 pr-1">
                    {EQUIPMENT_TYPES.map(eq => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleArrayItem('equipmentInvolved', eq)}
                        className={`w-full rounded-xl px-3 py-2 text-left text-sm transition-all ${
                          formData.equipmentInvolved.includes(eq)
                            ? 'bg-warning/10 font-semibold text-warning ring-1 ring-warning/20'
                            : 'text-text-secondary hover:bg-surface-overlay'
                        }`}
                      >
                        {formData.equipmentInvolved.includes(eq) ? '✓ ' : ''}{eq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </SMTabs.Content>

          <SMTabs.Content value="analysis" className="pt-0">
            <div className="space-y-6">
              {/* Contributing Factors */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="mb-5 border-b border-surface-border pb-5">
                  <h3 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Contributing Factors Analysis
                  </h3>
                  <p className="text-sm text-text-muted">Select all human, environmental, equipment, and organizational factors that influenced the event.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(CONTRIBUTING_FACTORS).map(([category, factors]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-sm font-medium text-text-secondary">{category}</h4>
                      <div className="space-y-1">
                        {factors.map(factor => (
                          <button
                            key={factor}
                            type="button"
                            onClick={() => toggleArrayItem('contributingFactors', factor)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              formData.contributingFactors.includes(factor)
                                ? 'bg-accent/10 text-accent font-medium'
                                : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
                            }`}
                          >
                            {factor}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Root Cause Analysis */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="mb-5 border-b border-surface-border pb-5">
                  <h3 className="text-lg font-semibold text-text-primary mb-1 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  Root Cause Analysis
                  </h3>
                  <p className="text-sm text-text-muted">Explain the deeper conditions that allowed the near miss to happen.</p>
                </div>
                <SMInput label="" as="textarea" value={formData.rootCauseAnalysis} onChange={e => handleInputChange('rootCauseAnalysis', e.target.value)} rows={4} placeholder="Identify the root cause(s) of this near miss event..." />
              </div>

              {/* AI Analysis */}
              <div className="ai-purple-theme rounded-[30px] border border-primary/15 bg-surface-raised p-6 shadow-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white ring-1 ring-primary/20">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-white">
                        AI-assisted review
                      </div>
                      <h3 className="text-lg font-bold text-text-primary">AI Safety Analysis</h3>
                      <p className="max-w-2xl text-sm leading-6 text-text-secondary">Generate a clearer risk summary based on category, severity, sector, and the factors selected above.</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={runAIAnalysis}
                    disabled={isAnalyzing || !formData.category}
                    className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 font-medium text-white shadow-soft transition-all hover:bg-primary/90 hover:text-white disabled:cursor-not-allowed disabled:bg-primary/70 disabled:text-white/90"
                  >
                    {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Brain className="h-4 w-4" />}
                    {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
                  </button>
                </div>

                <div className="mt-5 rounded-2xl border border-surface-border bg-surface-sunken p-4 sm:p-5">
                  {formData.aiAnalysis ? (
                    <div className="prose prose-sm max-w-none prose-headings:text-text-primary prose-p:text-text-secondary prose-strong:text-text-primary prose-li:text-text-secondary">
                      {renderMarkdown(formData.aiAnalysis)}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-text-primary">{isAnalyzing ? 'Generating live AI analysis...' : 'No AI analysis generated yet.'}</p>
                      <p className="text-sm leading-6 text-text-secondary">
                        {isAnalyzing
                          ? 'OpenRouter response will stream here as it is generated.'
                          : formData.category
                          ? 'Use the button to generate analysis for the selected event details.'
                          : 'Select a near miss category first, then run the AI analysis.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </SMTabs.Content>

          <SMTabs.Content value="compliance" className="pt-0">
            <div className="space-y-6">
              {/* OSHA References */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-accent" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">OSHA Regulatory References</h3>
                    <p className="text-sm text-text-muted">Select applicable OSHA standards</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {OSHA_REQUIREMENTS.map(req => (
                    <button
                      key={req.id}
                      type="button"
                      onClick={() => toggleArrayItem('oshaReferences', req.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.oshaReferences.includes(req.id)
                            ? 'border-primary bg-primary/10 text-primary'
                            : 'border-surface-border hover:border-primary/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${formData.oshaReferences.includes(req.id) ? 'text-blue-500' : 'text-surface-300'}`} />
                        <span className="text-sm font-medium">{req.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* ISO Standards */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">ISO Management System Standards</h3>
                    <p className="text-sm text-text-muted">Align with international standards</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {ISO_STANDARDS.map(std => (
                    <button
                      key={std.id}
                      type="button"
                      onClick={() => toggleArrayItem('isoReferences', std.id)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                        formData.isoReferences.includes(std.id)
                            ? 'border-success bg-success/10 text-success'
                            : 'border-surface-border hover:border-success/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${formData.isoReferences.includes(std.id) ? 'text-success' : 'text-surface-300'}`} />
                        <span className="text-sm font-medium">{std.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* International Standards (20+ global standards) */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text-primary">International Standards & Regulations</h3>
                    <p className="text-sm text-text-muted">EU, NEBOSH, GCC, CSA, IMO, IATA, WHO, HACCP, DOT, BSEE, API, NFPA, EPA, NIOSH, ANSI, ASME, MSHA, AS/NZS</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[400px] overflow-y-auto">
                  {INTERNATIONAL_STANDARDS.map(std => (
                    <button
                      key={std.id}
                      type="button"
                      onClick={() => toggleArrayItem('internationalReferences', std.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl border-2 transition-all ${
                        formData.internationalReferences.includes(std.id)
                            ? 'border-accent bg-accent/10 text-accent'
                            : 'border-surface-border hover:border-accent/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${formData.internationalReferences.includes(std.id) ? 'text-indigo-500' : 'text-surface-300'}`} />
                        <span className="text-xs font-medium">{std.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-surface-400 mt-3">Selected: {formData.internationalReferences.length} international standards</p>
              </div>
            </div>
          </SMTabs.Content>

          <SMTabs.Content value="actions" className="pt-0">
            <div className="space-y-6">
              {/* Corrective Actions with Owner Assignment */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
                    <Target className="w-5 h-5 text-success" />
                    Corrective Actions
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowActionModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-success text-white rounded-xl hover:bg-success/90 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
                
                {/* Corrective Actions List */}
                <div className="space-y-3">
                  {formData.correctiveActions.map((action) => (
                    <div key={action.id} className="rounded-xl border border-surface-border bg-surface-sunken p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-text-primary mb-2">{action.action}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5 text-text-secondary">
                              <User className="w-3.5 h-3.5" />
                              {action.assignedTo}
                            </span>
                            {action.assigneeEmail && (
                              <span className="flex items-center gap-1.5 text-text-muted">
                                <Send className="w-3.5 h-3.5" />
                                {action.assigneeEmail}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 text-text-secondary">
                              <Calendar className="w-3.5 h-3.5" />
                              Due: {action.dueDate}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border ${getPriorityColor(action.priority)}`}>
                              {action.priority}
                            </span>
                            <select
                              value={action.status}
                              onChange={e => updateActionStatus(action.id, e.target.value as CorrectiveAction['status'])}
                              className={`px-2 py-1 text-[10px] font-bold uppercase rounded-full border cursor-pointer ${getStatusColor(action.status)}`}
                            >
                              <option value="Open">Open</option>
                              <option value="In Progress">In Progress</option>
                              <option value="Completed">Completed</option>
                              <option value="Overdue">Overdue</option>
                            </select>
                          </div>
                          {action.sendEmailNotification && (
                            <span className="text-[10px] text-success flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" />
                              Email notification enabled
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end mt-3">
                        <button 
                          type="button" 
                          onClick={() => removeCorrectiveAction(action.id)} 
                          className="rounded-lg p-1.5 text-danger transition-colors hover:bg-danger/10"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.correctiveActions.length === 0 && (
                    <div className="rounded-xl border-2 border-dashed border-surface-border py-8 text-center">
                      <Target className="mx-auto mb-2 h-10 w-10 text-surface-border" />
                      <p className="text-text-muted">No corrective actions assigned yet</p>
                      <p className="mt-1 text-xs text-text-muted">Click "Add Action" to create one</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Evidence */}
              <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-500" />
                  Photo Evidence
                </h3>
                <div className="rounded-xl border-2 border-dashed border-surface-border p-8 text-center">
                  <Camera className="mx-auto mb-3 h-12 w-12 text-surface-border" />
                  <p className="mb-2 text-text-muted">Upload photos of the near miss location or conditions</p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-accent text-white rounded-xl hover:bg-accent/90 transition-colors text-sm font-medium"
                  >
                    Upload Photos
                  </button>
                </div>
              </div>
            </div>
          </SMTabs.Content>
        </SMTabs>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-surface-border/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.92),rgba(255,255,255,0.98))] px-4 pb-6 pt-4 shadow-[0_-16px_40px_rgba(15,23,42,0.08)] backdrop-blur-xl sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1520px]">
          <div className="flex flex-col gap-4 rounded-[28px] border border-surface-border bg-surface-raised px-4 py-4 shadow-card sm:px-5 lg:flex-row lg:items-center lg:justify-between lg:px-6">
            <div className="flex flex-1 flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Submission status</span>
                <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{completedRequiredFields}/{requiredFields.length} required complete</span>
              </div>
              <p className="text-sm text-text-secondary">Review required fields, then submit from this action bar without losing context while scrolling.</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:flex-row lg:w-auto lg:min-w-[420px]">
              <SMButton variant="secondary" className="flex-1 min-h-[52px]" onClick={() => navigate(-1)}>Cancel</SMButton>
          <SMButton
            variant="primary"
            className="flex-1 min-h-[52px]"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.category || !formData.description || !formData.reportedBy}
            loading={isSubmitting}
            leftIcon={<Send className="w-5 h-5" />}
          >
            Submit Near Miss Report
          </SMButton>
            </div>
          </div>
        </div>
      </div>

      {/* Add Corrective Action Modal */}
      <AnimatePresence>
        {showActionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowActionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised rounded-3xl p-6 max-w-lg w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-text-primary flex items-center gap-2">
                  <Target className="w-5 h-5 text-success" />
                  Add Corrective Action
                </h3>
                <button onClick={() => setShowActionModal(false)} className="rounded-xl p-2 hover:bg-surface-overlay">
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Action Description *</label>
                  <textarea
                    value={newCorrectiveAction.action}
                    onChange={e => setNewCorrectiveAction(prev => ({ ...prev, action: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent resize-none"
                    placeholder="Describe the corrective action required..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Assign To (Owner) *</label>
                    <input
                      type="text"
                      value={newCorrectiveAction.assignedTo}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="Owner name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Owner Email</label>
                    <input
                      type="email"
                      value={newCorrectiveAction.assigneeEmail}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, assigneeEmail: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                      placeholder="owner@company.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Due Date *</label>
                    <input
                      type="date"
                      value={newCorrectiveAction.dueDate}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Priority</label>
                    <select
                      value={newCorrectiveAction.priority}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-success/10 rounded-xl border border-success/30">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={newCorrectiveAction.sendEmailNotification}
                    onChange={e => setNewCorrectiveAction(prev => ({ ...prev, sendEmailNotification: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="sendNotification" className="flex-1 cursor-pointer">
                    <span className="font-medium text-success">Send Email Notification</span>
                    <p className="text-xs text-success mt-0.5">Notify the owner via email when action is assigned</p>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 rounded-xl border border-surface-border px-6 py-3 font-medium text-text-secondary transition-colors hover:bg-surface-overlay"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addCorrectiveAction}
                  disabled={!newCorrectiveAction.action || !newCorrectiveAction.assignedTo || !newCorrectiveAction.dueDate}
                  className="flex-1 py-3 px-6 rounded-xl bg-success text-white font-medium hover:bg-success/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Add Action
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto bg-success/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-bold text-text-primary mb-2">Near Miss Reported!</h3>
              <p className="text-text-muted">Report ID: {formData.reportId}</p>
              <p className="mt-2 text-text-muted">Thank you for contributing to workplace safety.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NearMissReport;
