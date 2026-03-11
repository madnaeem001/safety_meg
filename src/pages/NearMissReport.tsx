import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, AlertTriangle, Camera, Send, CheckCircle2, MapPin, Calendar, Info,
  Brain, Sparkles, Loader2, User, ClipboardList, ShieldCheck, FileText, Shield,
  Building2, Scale, Globe, Clock, AlertCircle, Target, Zap, Download, Plus, X, Eye
} from 'lucide-react';
import { useCreateNearMissReport, useNearMissAIAnalysis } from '../api/hooks/useAPIHooks';

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
  { level: 'Minor', description: 'First aid or less', color: 'bg-green-100 text-green-700 border-green-200' },
  { level: 'Moderate', description: 'Medical treatment, restricted work', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  { level: 'Serious', description: 'Lost time, hospitalization', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { level: 'Critical', description: 'Fatality, permanent disability', color: 'bg-red-100 text-red-700 border-red-200' },
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
  const { mutate: aiAnalysisMutate } = useNearMissAIAnalysis();

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
      case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-surface-100 text-surface-700 border-surface-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Overdue': return 'bg-red-100 text-red-700 border-red-200';
      case 'Open': return 'bg-surface-100 text-surface-700 border-surface-200';
      default: return 'bg-surface-100 text-surface-700 border-surface-200';
    }
  };

  const runAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const result = await aiAnalysisMutate({
        category: formData.category,
        potentialSeverity: formData.potentialSeverity,
        industrySector: formData.industrySector,
        location: formData.location,
        specificArea: formData.specificArea,
        oshaReferences: formData.oshaReferences,
        isoReferences: formData.isoReferences,
        contributingFactors: formData.contributingFactors,
      });
      if (result?.analysis) {
        setFormData(prev => ({ ...prev, aiAnalysis: result.analysis }));
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
    <div className="min-h-screen pb-24 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-950">

      
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-300" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-brand-900 dark:text-white">Near Miss Report</h1>
                  <p className="text-sm text-surface-500 dark:text-surface-400">OSHA & ISO Compliant Documentation</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-300 rounded-lg text-sm font-mono">
                {formData.reportId}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-brand-500 text-white shadow-md'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6 pb-32">
        <AnimatePresence mode="wait">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Reporter Information */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-brand-500" />
                  Reporter Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Reported By *</label>
                    <input
                      type="text"
                      value={formData.reportedBy}
                      onChange={e => handleInputChange('reportedBy', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Full Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Job Title</label>
                    <input
                      type="text"
                      value={formData.jobTitle}
                      onChange={e => handleInputChange('jobTitle', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Position"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Department</label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={e => handleInputChange('department', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Department/Team"
                    />
                  </div>
                </div>
              </div>

              {/* Event Information */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Event Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Event Date *</label>
                    <input
                      type="date"
                      value={formData.eventDate}
                      onChange={e => handleInputChange('eventDate', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Event Time *</label>
                    <input
                      type="time"
                      value={formData.eventTime}
                      onChange={e => handleInputChange('eventTime', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Industry Sector</label>
                    <select
                      value={formData.industrySector}
                      onChange={e => handleInputChange('industrySector', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="">Select Sector</option>
                      {INDUSTRY_SECTORS.map(sector => (
                        <option key={sector} value={sector}>{sector}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Near Miss Category *</label>
                    <select
                      value={formData.category}
                      onChange={e => handleInputChange('category', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="">Select Category</option>
                      {NEAR_MISS_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Location *</label>
                    <input
                      type="text"
                      value={formData.location}
                      onChange={e => handleInputChange('location', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Building/Site Name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Specific Area</label>
                    <input
                      type="text"
                      value={formData.specificArea}
                      onChange={e => handleInputChange('specificArea', e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Room, Zone, Equipment ID"
                    />
                  </div>
                </div>

                {/* Potential Severity */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">Potential Severity (if event had occurred) *</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {POTENTIAL_SEVERITY.map(sev => (
                      <button
                        key={sev.level}
                        type="button"
                        onClick={() => handleInputChange('potentialSeverity', sev.level)}
                        className={`p-3 rounded-xl border-2 transition-all ${
                          formData.potentialSeverity === sev.level
                            ? `${sev.color} border-current shadow-md`
                            : 'border-surface-200 dark:border-surface-600 hover:border-surface-300'
                        }`}
                      >
                        <div className="font-semibold text-sm">{sev.level}</div>
                        <div className="text-xs opacity-75">{sev.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Event Description *</label>
                  <textarea
                    value={formData.description}
                    onChange={e => handleInputChange('description', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    placeholder="Describe what happened, who was involved, what could have occurred..."
                  />
                </div>
              </div>

              {/* Immediate Actions & Witnesses */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-emerald-500" />
                    Immediate Actions Taken
                  </h3>
                  <textarea
                    value={formData.immediateActions}
                    onChange={e => handleInputChange('immediateActions', e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    placeholder="What actions were taken immediately to secure the area or prevent recurrence..."
                  />
                </div>
              </div>

              {/* Weather, PPE, Equipment Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Weather Conditions */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-3 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-sky-500" />
                    Weather Conditions
                  </h3>
                  <select
                    value={formData.weatherCondition}
                    onChange={e => handleInputChange('weatherCondition', e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white text-sm"
                  >
                    <option value="">Select weather...</option>
                    {WEATHER_CONDITIONS.map(w => (
                      <option key={w} value={w}>{w}</option>
                    ))}
                  </select>
                </div>

                {/* PPE Worn */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-3 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    PPE Worn ({formData.ppeWorn.length})
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {PPE_OPTIONS.map(ppe => (
                      <button
                        key={ppe}
                        type="button"
                        onClick={() => toggleArrayItem('ppeWorn', ppe)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                          formData.ppeWorn.includes(ppe)
                            ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 font-bold'
                            : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                        }`}
                      >
                        {formData.ppeWorn.includes(ppe) ? '✓ ' : ''}{ppe}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Equipment Involved */}
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="text-sm font-bold text-brand-900 dark:text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    Equipment Involved ({formData.equipmentInvolved.length})
                  </h3>
                  <div className="max-h-[200px] overflow-y-auto space-y-1">
                    {EQUIPMENT_TYPES.map(eq => (
                      <button
                        key={eq}
                        type="button"
                        onClick={() => toggleArrayItem('equipmentInvolved', eq)}
                        className={`w-full text-left px-3 py-1.5 rounded-lg text-xs transition-all ${
                          formData.equipmentInvolved.includes(eq)
                            ? 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold'
                            : 'hover:bg-surface-100 dark:hover:bg-surface-700 text-surface-600 dark:text-surface-400'
                        }`}
                      >
                        {formData.equipmentInvolved.includes(eq) ? '✓ ' : ''}{eq}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Witnesses section */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                  <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                    <Eye className="w-5 h-5 text-blue-500" />
                    Witnesses
                  </h3>
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newWitness}
                      onChange={e => setNewWitness(e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Witness name"
                      onKeyPress={e => e.key === 'Enter' && addWitness()}
                    />
                    <button
                      type="button"
                      onClick={addWitness}
                      className="px-4 py-2.5 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.witnessList.map((witness, idx) => (
                      <span key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-full text-sm">
                        {witness}
                        <button type="button" onClick={() => removeWitness(idx)} className="hover:text-red-500">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
            </motion.div>
          )}

          {/* Analysis Tab */}
          {activeTab === 'analysis' && (
            <motion.div
              key="analysis"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Contributing Factors */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-5 h-5 text-purple-500" />
                  Contributing Factors Analysis
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(CONTRIBUTING_FACTORS).map(([category, factors]) => (
                    <div key={category} className="space-y-2">
                      <h4 className="font-medium text-sm text-surface-600 dark:text-surface-400">{category}</h4>
                      <div className="space-y-1">
                        {factors.map(factor => (
                          <button
                            key={factor}
                            type="button"
                            onClick={() => toggleArrayItem('contributingFactors', factor)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all ${
                              formData.contributingFactors.includes(factor)
                                ? 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 font-medium'
                                : 'bg-surface-50 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-600'
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
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                  <Brain className="w-5 h-5 text-indigo-500" />
                  Root Cause Analysis
                </h3>
                <textarea
                  value={formData.rootCauseAnalysis}
                  onChange={e => handleInputChange('rootCauseAnalysis', e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  placeholder="Identify the root cause(s) of this near miss event..."
                />
              </div>

              {/* AI Analysis */}
              <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 shadow-xl text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg">AI Safety Analysis</h3>
                      <p className="text-indigo-200 text-sm">Powered by predictive analytics</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={runAIAnalysis}
                    disabled={isAnalyzing || !formData.category}
                    className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-xl font-medium transition-all flex items-center gap-2 disabled:opacity-50"
                  >
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
                    {isAnalyzing ? 'Analyzing...' : 'Generate Analysis'}
                  </button>
                </div>
                {formData.aiAnalysis && (
                  <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 mt-4">
                    <pre className="whitespace-pre-wrap text-sm font-sans">{formData.aiAnalysis}</pre>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Compliance Tab */}
          {activeTab === 'compliance' && (
            <motion.div
              key="compliance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* OSHA References */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900 dark:text-white">OSHA Regulatory References</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Select applicable OSHA standards</p>
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
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                          : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500'
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
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900 dark:text-white">ISO Management System Standards</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">Align with international standards</p>
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
                          ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                          : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className={`w-5 h-5 ${formData.isoReferences.includes(std.id) ? 'text-emerald-500' : 'text-surface-300'}`} />
                        <span className="text-sm font-medium">{std.label}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* International Standards (20+ global standards) */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-brand-900 dark:text-white">International Standards & Regulations</h3>
                    <p className="text-sm text-surface-500 dark:text-surface-400">EU, NEBOSH, GCC, CSA, IMO, IATA, WHO, HACCP, DOT, BSEE, API, NFPA, EPA, NIOSH, ANSI, ASME, MSHA, AS/NZS</p>
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
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                          : 'border-surface-200 dark:border-surface-600 hover:border-surface-300 dark:hover:border-surface-500'
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
            </motion.div>
          )}

          {/* Actions Tab */}
          {activeTab === 'actions' && (
            <motion.div
              key="actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Corrective Actions with Owner Assignment */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-brand-900 dark:text-white flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    Corrective Actions
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowActionModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add Action
                  </button>
                </div>
                
                {/* Corrective Actions List */}
                <div className="space-y-3">
                  {formData.correctiveActions.map((action) => (
                    <div key={action.id} className="p-4 bg-surface-50 dark:bg-surface-700 rounded-xl border border-surface-200 dark:border-surface-600">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-brand-900 dark:text-white mb-2">{action.action}</p>
                          <div className="flex flex-wrap items-center gap-3 text-xs">
                            <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
                              <User className="w-3.5 h-3.5" />
                              {action.assignedTo}
                            </span>
                            {action.assigneeEmail && (
                              <span className="flex items-center gap-1.5 text-surface-500 dark:text-surface-400">
                                <Send className="w-3.5 h-3.5" />
                                {action.assigneeEmail}
                              </span>
                            )}
                            <span className="flex items-center gap-1.5 text-surface-600 dark:text-surface-400">
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
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
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
                          className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {formData.correctiveActions.length === 0 && (
                    <div className="text-center py-8 border-2 border-dashed border-surface-200 dark:border-surface-600 rounded-xl">
                      <Target className="w-10 h-10 mx-auto text-surface-300 dark:text-surface-500 mb-2" />
                      <p className="text-surface-400 dark:text-surface-500">No corrective actions assigned yet</p>
                      <p className="text-xs text-surface-400 dark:text-surface-500 mt-1">Click "Add Action" to create one</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Photo Evidence */}
              <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                <h3 className="text-lg font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-500" />
                  Photo Evidence
                </h3>
                <div className="border-2 border-dashed border-surface-200 dark:border-surface-600 rounded-xl p-8 text-center">
                  <Camera className="w-12 h-12 mx-auto text-surface-300 dark:text-surface-500 mb-3" />
                  <p className="text-surface-500 dark:text-surface-400 mb-2">Upload photos of the near miss location or conditions</p>
                  <button
                    type="button"
                    className="px-4 py-2 bg-brand-500 text-white rounded-xl hover:bg-brand-600 transition-colors text-sm font-medium"
                  >
                    Upload Photos
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Fixed Bottom Actions */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-surface-800 border-t border-surface-200 dark:border-surface-700 p-4 pb-24 z-50">
        <div className="max-w-7xl mx-auto flex gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 py-3 px-6 rounded-xl border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.category || !formData.description || !formData.reportedBy}
            className="flex-1 py-3 px-6 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-medium hover:from-amber-600 hover:to-orange-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Near Miss Report
              </>
            )}
          </button>
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
              className="bg-white dark:bg-surface-800 rounded-3xl p-6 max-w-lg w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Add Corrective Action
                </h3>
                <button onClick={() => setShowActionModal(false)} className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl">
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Action Description *</label>
                  <textarea
                    value={newCorrectiveAction.action}
                    onChange={e => setNewCorrectiveAction(prev => ({ ...prev, action: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                    placeholder="Describe the corrective action required..."
                  />
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Assign To (Owner) *</label>
                    <input
                      type="text"
                      value={newCorrectiveAction.assignedTo}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, assignedTo: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="Owner name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Owner Email</label>
                    <input
                      type="email"
                      value={newCorrectiveAction.assigneeEmail}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, assigneeEmail: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                      placeholder="owner@company.com"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Due Date *</label>
                    <input
                      type="date"
                      value={newCorrectiveAction.dueDate}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, dueDate: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Priority</label>
                    <select
                      value={newCorrectiveAction.priority}
                      onChange={e => setNewCorrectiveAction(prev => ({ ...prev, priority: e.target.value as any }))}
                      className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Critical">Critical</option>
                    </select>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={newCorrectiveAction.sendEmailNotification}
                    onChange={e => setNewCorrectiveAction(prev => ({ ...prev, sendEmailNotification: e.target.checked }))}
                    className="w-5 h-5 rounded-lg border-emerald-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="sendNotification" className="flex-1 cursor-pointer">
                    <span className="font-medium text-emerald-800 dark:text-emerald-300">Send Email Notification</span>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-0.5">Notify the owner via email when action is assigned</p>
                  </label>
                </div>
              </div>
              
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowActionModal(false)}
                  className="flex-1 py-3 px-6 rounded-xl border border-surface-200 dark:border-surface-600 text-surface-700 dark:text-surface-300 font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={addCorrectiveAction}
                  disabled={!newCorrectiveAction.action || !newCorrectiveAction.assignedTo || !newCorrectiveAction.dueDate}
                  className="flex-1 py-3 px-6 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
              className="bg-white dark:bg-surface-800 rounded-3xl p-8 max-w-md w-full text-center shadow-2xl"
            >
              <div className="w-20 h-20 mx-auto bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-emerald-500" />
              </div>
              <h3 className="text-2xl font-bold text-brand-900 dark:text-white mb-2">Near Miss Reported!</h3>
              <p className="text-surface-500 dark:text-surface-400">Report ID: {formData.reportId}</p>
              <p className="text-surface-500 dark:text-surface-400 mt-2">Thank you for contributing to workplace safety.</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NearMissReport;
