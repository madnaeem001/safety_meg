import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, CheckCircle, Loader2, Brain, Sparkles, ClipboardList, AlertTriangle, FileText, ChevronDown, ChevronUp, HardHat, Wrench, Users, MapPin, Calendar, Plus, Camera, Mic, Send, Eye, Clock, Activity, XCircle, ChevronRight, Lightbulb, TrendingUp, BarChart3 } from 'lucide-react';
import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { motion, AnimatePresence } from 'framer-motion';
import { jsaApiService } from '../api/services/apiService';

// Pre-Task Assessment Template
interface PreTaskAssessment {
  taskName: string;
  location: string;
  date: string;
  supervisor: string;
  crewMembers: string;
  taskSteps: string[];
  hazardsIdentified: string[];
  controlMeasures: string[];
  ppeRequired: string[];
  emergencyProcedures: string;
  toolsEquipment: string;
  signedOff: boolean;
}

// JSA Template
interface JSAItem {
  step: string;
  hazard: string;
  control: string;
}

type AssessmentMode = 'ai' | 'pretask' | 'jsa' | 'incident_jsa' | 'jsa_report';

// JSA Report for submission
interface JSAReport {
  id: string;
  taskName: string;
  location: string;
  date: string;
  supervisor: string;
  crewMembers: string[];
  template: string;
  steps: JSAItem[];
  linkedIncidents: string[];
  ppeRequired: string[];
  equipmentNeeded: string;
  emergencyProcedures: string;
  approvalStatus: 'draft' | 'pending' | 'approved' | 'rejected';
  submittedBy: string;
  submittedAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  signatures: Array<{ name: string; role: string; signedAt: Date }>;
}

// Incident Report Types for JSA Integration
interface LinkedIncident {
  id: string;
  title: string;
  date: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  description: string;
  rootCause: string;
  lessonsLearned: string[];
  relatedTasks: string[];
}

// AI Insights for JSA
interface AIInsight {
  id: string;
  type: 'warning' | 'recommendation' | 'pattern' | 'benchmark';
  title: string;
  description: string;
  confidence: number;
  source: string;
}

// Mock linked incidents
const mockLinkedIncidents: LinkedIncident[] = [
  {
    id: 'INC-2025-042',
    title: 'Fall from scaffold during painting work',
    date: '2025-08-15',
    severity: 'high',
    type: 'Fall',
    description: 'Worker fell 12 feet from scaffold platform when guardrail failed',
    rootCause: 'Guardrail connection was not properly secured during scaffold modification',
    lessonsLearned: [
      'Always verify guardrail connections after any scaffold modification',
      'Use personal fall arrest system as secondary protection',
      'Conduct daily scaffold inspection before work begins'
    ],
    relatedTasks: ['Scaffold erection', 'Working at height', 'Painting at elevation']
  },
  {
    id: 'INC-2025-089',
    title: 'Near miss - dropped tool from height',
    date: '2025-11-22',
    severity: 'medium',
    type: 'Struck-by',
    description: 'Hammer dropped from 25ft scaffold, landed in active work zone',
    rootCause: 'Tool lanyard not used, no toe boards installed',
    lessonsLearned: [
      'All tools must be tethered when working at height',
      'Install toe boards on all scaffold platforms',
      'Establish and barricade drop zones below elevated work'
    ],
    relatedTasks: ['Working at height', 'Scaffold work', 'Overhead work']
  },
  {
    id: 'INC-2024-156',
    title: 'Hot work fire incident in welding bay',
    date: '2024-06-30',
    severity: 'critical',
    type: 'Fire',
    description: 'Welding sparks ignited combustible materials stored nearby',
    rootCause: 'Fire watch not maintained, combustibles not cleared from 35ft radius',
    lessonsLearned: [
      'Maintain continuous fire watch during and 60 min after hot work',
      'Clear all combustibles within 35-foot radius',
      'Have fire extinguisher within 10 feet of work area'
    ],
    relatedTasks: ['Hot work', 'Welding', 'Cutting operations']
  }
];

// Mock AI insights
const mockAIInsights: AIInsight[] = [
  {
    id: 'AI-001',
    type: 'warning',
    title: 'High-Risk Weather Conditions Predicted',
    description: 'Wind speeds above 25mph expected this afternoon. Consider rescheduling elevated work.',
    confidence: 92,
    source: 'Weather API + Historical incident data'
  },
  {
    id: 'AI-002',
    type: 'pattern',
    title: 'Similar tasks show 3x incident rate on Fridays',
    description: 'Historical data shows elevated work incidents increase significantly on Friday afternoons.',
    confidence: 85,
    source: 'Incident database analysis (n=2,847)'
  },
  {
    id: 'AI-003',
    type: 'recommendation',
    title: 'Add buddy system control measure',
    description: 'Based on task complexity and historical data, implementing a buddy system reduces incident probability by 45%.',
    confidence: 78,
    source: 'ML Model + Industry benchmarks'
  },
  {
    id: 'AI-004',
    type: 'benchmark',
    title: 'Your JSA exceeds industry standards',
    description: 'This JSA includes 2 more control measures than industry average for similar tasks.',
    confidence: 95,
    source: 'JSA benchmark database'
  }
];

// Pre-built JSA templates for common tasks
const JSA_TEMPLATES = [
  { id: 'hot-work', name: 'Hot Work / Welding', steps: ['Obtain hot work permit', 'Clear combustibles from area', 'Set up fire watch', 'Test for flammable gases', 'Perform welding operation', 'Monitor area post-work'] },
  { id: 'confined-space', name: 'Confined Space Entry', steps: ['Complete entry permit', 'Test atmosphere', 'Establish ventilation', 'Position attendant', 'Enter space with harness', 'Perform work', 'Exit and secure space'] },
  { id: 'working-height', name: 'Working at Height', steps: ['Inspect fall protection', 'Set up ladder/scaffold', 'Establish exclusion zone', 'Perform task at height', 'Descend safely', 'Secure equipment'] },
  { id: 'electrical', name: 'Electrical Work', steps: ['De-energize equipment', 'Lockout/tagout', 'Test for zero energy', 'Perform electrical work', 'Remove locks/tags', 'Re-energize and test'] },
  { id: 'excavation', name: 'Excavation Work', steps: ['Call 811 for utilities', 'Inspect trench', 'Install shoring', 'Establish safe access', 'Work in excavation', 'Backfill and restore'] },
  { id: 'lifting', name: 'Crane/Lifting Operations', steps: ['Inspect rigging', 'Calculate load weight', 'Plan lift path', 'Position riggers', 'Execute lift', 'Land and secure load'] },
  { id: 'chemical', name: 'Chemical Handling', steps: ['Review SDS', 'Don appropriate PPE', 'Prepare work area', 'Handle chemicals', 'Clean up spills', 'Dispose of waste properly'] },
  { id: 'machinery', name: 'Machine Guarding/Maintenance', steps: ['Lockout/tagout machine', 'Remove guards', 'Perform maintenance', 'Replace guards', 'Test operation', 'Return to service'] },
];

export const RiskAssessment: React.FC = () => {
  const navigate = useNavigate();
  const [mode, setMode] = useState<AssessmentMode>('ai');
  const [description, setDescription] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  
  // Pre-Task Assessment State
  const [preTaskData, setPreTaskData] = useState<PreTaskAssessment>({
    taskName: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    supervisor: '',
    crewMembers: '',
    taskSteps: [''],
    hazardsIdentified: [''],
    controlMeasures: [''],
    ppeRequired: [],
    emergencyProcedures: '',
    toolsEquipment: '',
    signedOff: false
  });

  // JSA State
  const [selectedJSATemplate, setSelectedJSATemplate] = useState<string>('');
  const [jsaItems, setJsaItems] = useState<JSAItem[]>([{ step: '', hazard: '', control: '' }]);
  const [jsaExpanded, setJsaExpanded] = useState<number | null>(0);
  
  // Incident-linked JSA state
  const [linkedIncidents, setLinkedIncidents] = useState<LinkedIncident[]>([]);
  const [showIncidentSearch, setShowIncidentSearch] = useState(false);
  const [incidentSearchQuery, setIncidentSearchQuery] = useState('');
  const [aiInsights, setAiInsights] = useState<AIInsight[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [isAnalyzingAI, setIsAnalyzingAI] = useState(false);
  
  // JSA Report Form State
  const [jsaReportData, setJsaReportData] = useState({
    taskName: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    supervisor: '',
    crewMembers: '',
    equipmentNeeded: '',
    emergencyProcedures: '',
    additionalNotes: ''
  });
  const [jsaReportSubmitting, setJsaReportSubmitting] = useState(false);
  const [jsaReportSubmitted, setJsaReportSubmitted] = useState(false);
  const [jsaReportId, setJsaReportId] = useState<string | null>(null);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [signatures, setSignatures] = useState<Array<{ name: string; role: string; signed: boolean }>>([]);
  
  // Link incident to JSA
  const linkIncident = (incident: LinkedIncident) => {
    if (!linkedIncidents.find(i => i.id === incident.id)) {
      setLinkedIncidents([...linkedIncidents, incident]);
      // Auto-populate lessons learned into JSA
      incident.lessonsLearned.forEach(lesson => {
        // Check if any JSA item could benefit from this lesson
        const updatedItems = jsaItems.map(item => {
          if (item.hazard && !item.control.includes(lesson) && item.control.length < 500) {
            return { ...item, control: item.control ? `${item.control}\n• ${lesson}` : `• ${lesson}` };
          }
          return item;
        });
        setJsaItems(updatedItems);
      });
    }
    setShowIncidentSearch(false);
  };
  
  // Unlink incident
  const unlinkIncident = (incidentId: string) => {
    setLinkedIncidents(linkedIncidents.filter(i => i.id !== incidentId));
  };
  
  // Run AI analysis on JSA
  const runAIAnalysis = () => {
    setIsAnalyzingAI(true);
    // Simulate AI analysis
    setTimeout(() => {
      setAiInsights(mockAIInsights);
      setIsAnalyzingAI(false);
    }, 2000);
  };
  
  // Filter incidents by search
  const filteredIncidents = mockLinkedIncidents.filter(inc =>
    inc.title.toLowerCase().includes(incidentSearchQuery.toLowerCase()) ||
    inc.type.toLowerCase().includes(incidentSearchQuery.toLowerCase()) ||
    inc.relatedTasks.some(t => t.toLowerCase().includes(incidentSearchQuery.toLowerCase()))
  );

  const PPE_OPTIONS = [
    'Hard Hat', 'Safety Glasses', 'Face Shield', 'Hearing Protection',
    'Safety Boots', 'Gloves', 'High-Vis Vest', 'Respirator',
    'Fall Harness', 'Welding Helmet', 'Chemical Suit', 'Fire-Resistant Clothing'
  ];

  const handleAnalyze = async () => {
    if (!description) return;
    if (!apiKey) {
      alert('Please enter an OpenAI API Key to use the AI features.');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const openai = createOpenAI({
        apiKey: apiKey,
        compatibility: 'strict',
      });

      const { text } = await generateText({
        model: openai('gpt-4o'),
        system: 'You are an expert EHS (Environment, Health, and Safety) officer. Analyze the given scenario and identify potential risks based on international standards including ISO 45001, ISO 14001, ISO 9001, ISO 31000, OSHA 1910/1926, EPA 40 CFR, and ILO conventions.',
        prompt: `Analyze the following scenario and provide a comprehensive risk assessment aligned with ISO 45001, ISO 14001, ISO 9001, ISO 31000, OSHA, and EPA standards:\n        \n        Scenario: \"${description}\"\n        \n        Please provide the output in the following format:\n        Risk Level: [Low/Medium/High/Critical]\n        \n        Relevant Standards:\n        - [Standard 1 (e.g., ISO 45001 Clause 6.1, OSHA 1910.132)]\n        - [Standard 2]\n        \n        Potential Hazards:\n        - [Hazard 1]\n        - [Hazard 2]\n        \n        Recommended Mitigation Strategies:\n        - [Strategy 1]\n        - [Strategy 2]\n        \n        Required PPE:\n        - [Item 1]\n        - [Item 2]\n        \n        Step-by-Step Safe Work Procedure:\n        1. [Step 1]\n        2. [Step 2]\n        3. [Step 3]`,
      });

      setResult(text);
    } catch (error) {
      console.error('AI Error:', error);
      setResult('Error analyzing risk. Please check your API key and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    setSelectedJSATemplate(templateId);
    const template = JSA_TEMPLATES.find(t => t.id === templateId);
    if (template) {
      setJsaItems(template.steps.map(step => ({ step, hazard: '', control: '' })));
    }
  };

  const addJSAItem = () => setJsaItems([...jsaItems, { step: '', hazard: '', control: '' }]);
  const removeJSAItem = (index: number) => setJsaItems(jsaItems.filter((_, i) => i !== index));

  const addPreTaskItem = (field: 'taskSteps' | 'hazardsIdentified' | 'controlMeasures') => {
    setPreTaskData({ ...preTaskData, [field]: [...preTaskData[field], ''] });
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-[72px] z-50 px-4 h-16 flex items-center gap-3 safe-top border-b border-surface-200">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-100 rounded-full transition-colors">
          <ArrowLeft className="w-6 h-6 text-surface-600" />
        </button>
        <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
        <h1 className="text-xl font-bold text-brand-900 flex items-center gap-2 tracking-tight">
          AI Risk Assessment
        </h1>
      </div>

      <main className="px-4 py-8 max-w-4xl mx-auto space-y-6">
        {/* Mode Selector */}
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {[
            { id: 'ai', label: 'AI Analysis', icon: Brain },
            { id: 'pretask', label: 'Pre-Task Assessment', icon: ClipboardList },
            { id: 'jsa', label: 'JSA (Job Safety Analysis)', icon: FileText },
            { id: 'incident_jsa', label: 'Incident-Linked JSA', icon: Activity },
            { id: 'jsa_report', label: 'Submit JSA Report', icon: Send },
          ].map(m => (
            <button
              key={m.id}
              onClick={() => setMode(m.id as AssessmentMode)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold whitespace-nowrap transition-all ${
                mode === m.id 
                  ? 'bg-brand-900 text-white shadow-lg' 
                  : 'bg-white text-surface-600 border border-surface-100 hover:bg-surface-50'
              }`}
            >
              <m.icon className="w-4 h-4" />
              {m.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* AI Analysis Mode */}
          {mode === 'ai' && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* API Key Input */}
              <div className="bg-brand-50 p-5 rounded-2xl border border-brand-100">
                <label className="block text-sm font-bold text-brand-900 mb-2">
                  OpenAI API Key <span className="font-normal text-brand-600">(Required for Demo)</span>
                </label>
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 rounded-xl border-brand-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 bg-white shadow-sm transition-all"
                />
                <p className="text-xs text-brand-600 mt-2 flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  Your key is used locally and never stored.
                </p>
              </div>

              {/* Input Section */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <label className="block text-lg font-bold text-brand-900 mb-3">
                  Describe the Task or Environment
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="E.g., Working at height to replace a light bulb in the warehouse..."
                  className="w-full h-40 px-4 py-3 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-brand-500 resize-none bg-surface-50 focus:bg-white transition-all"
                />
                
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleAnalyze}
                  disabled={loading || !description || !apiKey}
                  className="w-full mt-6 py-4 flex items-center justify-center gap-2 bg-brand-600 text-white rounded-2xl font-bold active:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-brand-200"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Analyze Risks
                    </>
                  )}
                </motion.button>
              </div>

              {/* Results */}
              {result && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100"
                >
                  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-surface-100">
                    <div className="p-2 bg-emerald-100 rounded-full">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <h2 className="text-xl font-bold text-brand-900">Assessment Result</h2>
                  </div>
                  <div className="whitespace-pre-wrap font-medium text-surface-700 leading-relaxed">
                    {result}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Pre-Task Assessment Mode */}
          {mode === 'pretask' && (
            <motion.div
              key="pretask"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Task Information */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-brand-600" />
                  Pre-Task Safety Assessment
                </h3>
                <p className="text-sm text-surface-500 mb-6">Complete this form before starting any high-risk work activity.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Task Name</label>
                    <input
                      type="text"
                      value={preTaskData.taskName}
                      onChange={(e) => setPreTaskData({ ...preTaskData, taskName: e.target.value })}
                      placeholder="e.g., Scaffold erection"
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> Location
                    </label>
                    <input
                      type="text"
                      value={preTaskData.location}
                      onChange={(e) => setPreTaskData({ ...preTaskData, location: e.target.value })}
                      placeholder="e.g., Building A, Level 3"
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Date
                    </label>
                    <input
                      type="date"
                      value={preTaskData.date}
                      onChange={(e) => setPreTaskData({ ...preTaskData, date: e.target.value })}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                      <Users className="w-3 h-3" /> Supervisor
                    </label>
                    <input
                      type="text"
                      value={preTaskData.supervisor}
                      onChange={(e) => setPreTaskData({ ...preTaskData, supervisor: e.target.value })}
                      placeholder="Supervisor name"
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Crew Members</label>
                    <input
                      type="text"
                      value={preTaskData.crewMembers}
                      onChange={(e) => setPreTaskData({ ...preTaskData, crewMembers: e.target.value })}
                      placeholder="List all crew members participating"
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Hazards & Controls */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-orange-500" />
                  Hazards Identified
                </h3>
                <div className="space-y-3">
                  {preTaskData.hazardsIdentified.map((hazard, i) => (
                    <div key={i} className="flex gap-2">
                      <span className="w-6 h-6 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0 mt-2">{i + 1}</span>
                      <input
                        type="text"
                        value={hazard}
                        onChange={(e) => {
                          const updated = [...preTaskData.hazardsIdentified];
                          updated[i] = e.target.value;
                          setPreTaskData({ ...preTaskData, hazardsIdentified: updated });
                        }}
                        placeholder="Describe the hazard..."
                        className="flex-1 px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                      />
                    </div>
                  ))}
                  <button
                    onClick={() => addPreTaskItem('hazardsIdentified')}
                    className="text-brand-600 font-bold text-sm hover:bg-brand-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    + Add Hazard
                  </button>
                </div>
              </div>

              {/* PPE Selection */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                  <HardHat className="w-5 h-5 text-yellow-500" />
                  Required PPE
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {PPE_OPTIONS.map(ppe => (
                    <label
                      key={ppe}
                      className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                        preTaskData.ppeRequired.includes(ppe)
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={preTaskData.ppeRequired.includes(ppe)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPreTaskData({ ...preTaskData, ppeRequired: [...preTaskData.ppeRequired, ppe] });
                          } else {
                            setPreTaskData({ ...preTaskData, ppeRequired: preTaskData.ppeRequired.filter(p => p !== ppe) });
                          }
                        }}
                        className="sr-only"
                      />
                      <span className="text-sm font-medium">{ppe}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Complete Pre-Task Assessment
              </button>
            </motion.div>
          )}

          {/* JSA Mode */}
          {mode === 'jsa' && (
            <motion.div
              key="jsa"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Template Selector */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-600" />
                  Job Safety Analysis (JSA)
                </h3>
                <p className="text-sm text-surface-500 mb-4">Select a template or create a custom JSA.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {JSA_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedJSATemplate === template.id
                          ? 'bg-purple-50 border-purple-300 text-purple-700'
                          : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                      }`}
                    >
                      <span className="text-sm font-medium">{template.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* JSA Steps */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-bold text-brand-900">Task Steps, Hazards & Controls</h3>
                  <button
                    onClick={addJSAItem}
                    className="text-brand-600 font-bold text-sm hover:bg-brand-50 px-4 py-2 rounded-xl transition-colors"
                  >
                    + Add Step
                  </button>
                </div>

                <div className="space-y-4">
                  {jsaItems.map((item, index) => (
                    <div key={index} className="bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden">
                      <button
                        onClick={() => setJsaExpanded(jsaExpanded === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <span className="font-medium text-surface-900">{item.step || 'Step ' + (index + 1)}</span>
                        </div>
                        {jsaExpanded === index ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                      </button>
                      
                      {jsaExpanded === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="p-4 pt-0 space-y-4"
                        >
                          <div>
                            <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Task Step</label>
                            <input
                              type="text"
                              value={item.step}
                              onChange={(e) => {
                                const updated = [...jsaItems];
                                updated[index].step = e.target.value;
                                setJsaItems(updated);
                              }}
                              placeholder="Describe the task step..."
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-orange-400 uppercase mb-1 block flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Potential Hazards
                            </label>
                            <textarea
                              value={item.hazard}
                              onChange={(e) => {
                                const updated = [...jsaItems];
                                updated[index].hazard = e.target.value;
                                setJsaItems(updated);
                              }}
                              placeholder="What could go wrong? What are the risks?"
                              rows={2}
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-green-400 uppercase mb-1 block flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Control Measures
                            </label>
                            <textarea
                              value={item.control}
                              onChange={(e) => {
                                const updated = [...jsaItems];
                                updated[index].control = e.target.value;
                                setJsaItems(updated);
                              }}
                              placeholder="How will the hazards be controlled?"
                              rows={2}
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                            />
                          </div>
                          {jsaItems.length > 1 && (
                            <button
                              onClick={() => removeJSAItem(index)}
                              className="text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                            >
                              Remove Step
                            </button>
                          )}
                        </motion.div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <button className="w-full py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                <CheckCircle className="w-5 h-5" />
                Complete JSA
              </button>
            </motion.div>
          )}

          {/* Incident-Linked JSA Mode */}
          {mode === 'incident_jsa' && (
            <motion.div
              key="incident_jsa"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Header Info */}
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-6 rounded-3xl">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <Activity className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">AI-Enhanced JSA with Incident Learning</h3>
                    <p className="text-sm opacity-90">Create safer JSAs by learning from past incidents. AI analyzes patterns and suggests control measures based on historical data.</p>
                  </div>
                </div>
              </div>

              {/* AI Insights Panel */}
              {showAIPanel && (
                <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-brand-900 flex items-center gap-2">
                      <Brain className="w-5 h-5 text-purple-600" />
                      AI Safety Insights
                    </h3>
                    <button
                      onClick={runAIAnalysis}
                      disabled={isAnalyzingAI}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-xl font-medium hover:bg-purple-200 transition-colors disabled:opacity-50"
                    >
                      {isAnalyzingAI ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                      ) : (
                        <><Sparkles className="w-4 h-4" /> Analyze Task</>
                      )}
                    </button>
                  </div>
                  
                  {aiInsights.length > 0 ? (
                    <div className="space-y-3">
                      {aiInsights.map(insight => (
                        <div
                          key={insight.id}
                          className={`p-4 rounded-xl border ${
                            insight.type === 'warning' ? 'bg-red-50 border-red-200' :
                            insight.type === 'pattern' ? 'bg-amber-50 border-amber-200' :
                            insight.type === 'recommendation' ? 'bg-blue-50 border-blue-200' :
                            'bg-green-50 border-green-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${
                              insight.type === 'warning' ? 'bg-red-100' :
                              insight.type === 'pattern' ? 'bg-amber-100' :
                              insight.type === 'recommendation' ? 'bg-blue-100' :
                              'bg-green-100'
                            }`}>
                              {insight.type === 'warning' && <AlertTriangle className="w-4 h-4 text-red-600" />}
                              {insight.type === 'pattern' && <TrendingUp className="w-4 h-4 text-amber-600" />}
                              {insight.type === 'recommendation' && <Lightbulb className="w-4 h-4 text-blue-600" />}
                              {insight.type === 'benchmark' && <BarChart3 className="w-4 h-4 text-green-600" />}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <h4 className={`font-medium ${
                                  insight.type === 'warning' ? 'text-red-800' :
                                  insight.type === 'pattern' ? 'text-amber-800' :
                                  insight.type === 'recommendation' ? 'text-blue-800' :
                                  'text-green-800'
                                }`}>{insight.title}</h4>
                                <span className="text-xs text-surface-500">{insight.confidence}% confidence</span>
                              </div>
                              <p className="text-sm text-surface-600 mt-1">{insight.description}</p>
                              <p className="text-xs text-surface-400 mt-2">Source: {insight.source}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-surface-500">
                      <Brain className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Click "Analyze Task" to get AI-powered safety insights</p>
                    </div>
                  )}
                </div>
              )}

              {/* Linked Incidents */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-brand-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-orange-500" />
                    Linked Incident Reports
                  </h3>
                  <button
                    onClick={() => setShowIncidentSearch(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-xl font-medium hover:bg-orange-200 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Link Incident
                  </button>
                </div>

                {linkedIncidents.length > 0 ? (
                  <div className="space-y-3">
                    {linkedIncidents.map(incident => (
                      <div key={incident.id} className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              incident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                              incident.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                              incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-green-100 text-green-700'
                            }`}>
                              {incident.severity}
                            </span>
                            <span className="font-medium text-surface-900">{incident.id}</span>
                          </div>
                          <button
                            onClick={() => unlinkIncident(incident.id)}
                            className="p-1 hover:bg-surface-200 rounded-lg"
                          >
                            <XCircle className="w-4 h-4 text-surface-400" />
                          </button>
                        </div>
                        <h4 className="font-medium text-surface-800 mb-1">{incident.title}</h4>
                        <p className="text-sm text-surface-600 mb-3">{incident.description}</p>
                        
                        <div className="mb-3">
                          <p className="text-xs font-medium text-surface-500 mb-1">Root Cause:</p>
                          <p className="text-sm text-surface-700 bg-red-50 p-2 rounded-lg">{incident.rootCause}</p>
                        </div>
                        
                        <div>
                          <p className="text-xs font-medium text-surface-500 mb-1">Lessons Learned (Applied to JSA):</p>
                          <ul className="space-y-1">
                            {incident.lessonsLearned.map((lesson, i) => (
                              <li key={i} className="text-sm text-green-700 bg-green-50 p-2 rounded-lg flex items-start gap-2">
                                <CheckCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                {lesson}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-surface-500 border-2 border-dashed border-surface-200 rounded-xl">
                    <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No incidents linked yet</p>
                    <p className="text-sm">Link relevant incidents to learn from past events</p>
                  </div>
                )}
              </div>

              {/* JSA Form (reusing existing JSA) */}
              <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                <h3 className="font-bold text-brand-900 mb-4">Job Safety Analysis Steps</h3>
                <p className="text-sm text-surface-500 mb-6">Lessons from linked incidents will be auto-populated into control measures.</p>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                  {JSA_TEMPLATES.map(template => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateSelect(template.id)}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        selectedJSATemplate === template.id
                          ? 'bg-brand-50 border-brand-300 text-brand-700'
                          : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                      }`}
                    >
                      <span className="text-sm font-medium">{template.name}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  {jsaItems.map((item, index) => (
                    <div key={index} className="bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden">
                      <button
                        onClick={() => setJsaExpanded(jsaExpanded === index ? null : index)}
                        className="w-full flex items-center justify-between p-4 hover:bg-surface-100 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 bg-brand-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                            {index + 1}
                          </span>
                          <span className="font-medium text-surface-900">{item.step || 'Step ' + (index + 1)}</span>
                          {item.control && <CheckCircle className="w-4 h-4 text-green-500" />}
                        </div>
                        {jsaExpanded === index ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                      </button>
                      
                      {jsaExpanded === index && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          className="p-4 pt-0 space-y-4"
                        >
                          <div>
                            <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Task Step</label>
                            <input
                              type="text"
                              value={item.step}
                              onChange={(e) => {
                                const updated = [...jsaItems];
                                updated[index].step = e.target.value;
                                setJsaItems(updated);
                              }}
                              placeholder="Describe the task step..."
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-orange-400 uppercase mb-1 block flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> Potential Hazards
                            </label>
                            <textarea
                              value={item.hazard}
                              onChange={(e) => {
                                const updated = [...jsaItems];
                                updated[index].hazard = e.target.value;
                                setJsaItems(updated);
                              }}
                              placeholder="What could go wrong? What are the risks?"
                              rows={2}
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                            />
                          </div>
                          <div>
                            <label className="text-xs font-bold text-green-400 uppercase mb-1 block flex items-center gap-1">
                              <Shield className="w-3 h-3" /> Control Measures
                              {linkedIncidents.length > 0 && <span className="text-purple-500 ml-2">(Includes lessons from linked incidents)</span>}
                            </label>
                            <textarea
                              value={item.control}
                              onChange={(e) => {
                                const updated = [...jsaItems];
                                updated[index].control = e.target.value;
                                setJsaItems(updated);
                              }}
                              placeholder="How will the hazards be controlled?"
                              rows={4}
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none resize-none"
                            />
                          </div>
                        </motion.div>
                      )}
                    </div>
                  ))}
                  <button
                    onClick={addJSAItem}
                    className="w-full py-3 border-2 border-dashed border-surface-300 rounded-xl text-surface-500 font-medium hover:bg-surface-50 transition-colors"
                  >
                    + Add Step
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-4">
                <button className="flex-1 py-4 bg-surface-100 text-surface-700 rounded-2xl font-bold hover:bg-surface-200 transition-all flex items-center justify-center gap-2">
                  <Eye className="w-5 h-5" />
                  Preview JSA
                </button>
                <button className="flex-1 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-lg hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Complete JSA
                </button>
              </div>

              {/* Incident Search Modal */}
              <AnimatePresence>
                {showIncidentSearch && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowIncidentSearch(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-3xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-brand-900">Link Incident Report</h3>
                        <button onClick={() => setShowIncidentSearch(false)} className="p-2 hover:bg-surface-100 rounded-full">
                          <XCircle className="w-5 h-5 text-surface-500" />
                        </button>
                      </div>
                      
                      <input
                        type="text"
                        value={incidentSearchQuery}
                        onChange={(e) => setIncidentSearchQuery(e.target.value)}
                        placeholder="Search incidents by title, type, or related tasks..."
                        className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl mb-4"
                      />
                      
                      <div className="space-y-3">
                        {filteredIncidents.map(incident => (
                          <button
                            key={incident.id}
                            onClick={() => linkIncident(incident)}
                            className="w-full p-4 bg-surface-50 rounded-xl border border-surface-200 text-left hover:bg-surface-100 transition-colors"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                incident.severity === 'critical' ? 'bg-red-100 text-red-700' :
                                incident.severity === 'high' ? 'bg-orange-100 text-orange-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {incident.severity}
                              </span>
                              <span className="text-sm text-surface-500">{incident.id} • {incident.date}</span>
                            </div>
                            <h4 className="font-medium text-surface-900">{incident.title}</h4>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {incident.relatedTasks.map((task, i) => (
                                <span key={i} className="px-2 py-0.5 bg-surface-200 text-surface-600 text-xs rounded-full">
                                  {task}
                                </span>
                              ))}
                            </div>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* JSA Report Submission Mode */}
          {mode === 'jsa_report' && (
            <motion.div
              key="jsa_report"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {jsaReportSubmitted ? (
                // Success State
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-white p-8 rounded-3xl shadow-soft border border-surface-100 text-center"
                >
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-green-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-brand-900 mb-2">JSA Submitted Successfully!</h2>
                  <p className="text-surface-600 mb-4">Your Job Safety Analysis has been submitted for review.</p>
                  <div className="bg-surface-50 rounded-xl p-4 mb-6">
                    <p className="text-sm text-surface-500">Reference Number</p>
                    <p className="text-xl font-bold text-brand-600">{jsaReportId}</p>
                  </div>
                  <div className="space-y-3">
                    <button
                      onClick={() => {
                        setJsaReportSubmitted(false);
                        setJsaReportId(null);
                        setJsaReportData({
                          taskName: '',
                          location: '',
                          date: new Date().toISOString().split('T')[0],
                          supervisor: '',
                          crewMembers: '',
                          equipmentNeeded: '',
                          emergencyProcedures: '',
                          additionalNotes: ''
                        });
                        setJsaItems([{ step: '', hazard: '', control: '' }]);
                        setSignatures([]);
                      }}
                      className="w-full py-3 bg-brand-600 text-white rounded-xl font-bold hover:bg-brand-700 transition-colors"
                    >
                      Create New JSA
                    </button>
                    <button
                      onClick={() => navigate('/safety-hub')}
                      className="w-full py-3 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-colors"
                    >
                      Return to Safety Hub
                    </button>
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* JSA Report Header */}
                  <div className="bg-gradient-to-r from-teal-500 to-emerald-600 text-white p-6 rounded-3xl">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-white/20 rounded-xl">
                        <Send className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold mb-2">Submit JSA Report</h3>
                        <p className="text-sm opacity-90">Complete all sections and gather required signatures to submit your Job Safety Analysis for approval.</p>
                      </div>
                    </div>
                  </div>

                  {/* Report Details */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-teal-600" />
                      Report Details
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Task/Job Name *</label>
                        <input
                          type="text"
                          value={jsaReportData.taskName}
                          onChange={(e) => setJsaReportData({ ...jsaReportData, taskName: e.target.value })}
                          placeholder="e.g., Scaffold Installation"
                          className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> Location *
                        </label>
                        <input
                          type="text"
                          value={jsaReportData.location}
                          onChange={(e) => setJsaReportData({ ...jsaReportData, location: e.target.value })}
                          placeholder="e.g., Building A, Level 3"
                          className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Date *
                        </label>
                        <input
                          type="date"
                          value={jsaReportData.date}
                          onChange={(e) => setJsaReportData({ ...jsaReportData, date: e.target.value })}
                          className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                          <Users className="w-3 h-3" /> Supervisor *
                        </label>
                        <input
                          type="text"
                          value={jsaReportData.supervisor}
                          onChange={(e) => setJsaReportData({ ...jsaReportData, supervisor: e.target.value })}
                          placeholder="Supervisor name"
                          className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Crew Members (comma separated)</label>
                        <input
                          type="text"
                          value={jsaReportData.crewMembers}
                          onChange={(e) => setJsaReportData({ ...jsaReportData, crewMembers: e.target.value })}
                          placeholder="John Doe, Jane Smith, Mike Johnson"
                          className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                        />
                      </div>
                    </div>
                  </div>

                  {/* JSA Template Selection */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                      <ClipboardList className="w-5 h-5 text-purple-600" />
                      Select JSA Template
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {JSA_TEMPLATES.map(template => (
                        <button
                          key={template.id}
                          onClick={() => handleTemplateSelect(template.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            selectedJSATemplate === template.id
                              ? 'bg-teal-50 border-teal-300 text-teal-700'
                              : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                          }`}
                        >
                          <span className="text-sm font-medium">{template.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Task Steps, Hazards & Controls */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-brand-900 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-500" />
                        Task Steps, Hazards & Controls
                      </h3>
                      <button
                        onClick={addJSAItem}
                        className="text-teal-600 font-bold text-sm hover:bg-teal-50 px-4 py-2 rounded-xl transition-colors"
                      >
                        + Add Step
                      </button>
                    </div>
                    
                    <div className="space-y-4">
                      {jsaItems.map((item, index) => (
                        <div key={index} className="bg-surface-50 rounded-2xl border border-surface-200 overflow-hidden">
                          <button
                            onClick={() => setJsaExpanded(jsaExpanded === index ? null : index)}
                            className="w-full flex items-center justify-between p-4 hover:bg-surface-100 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-8 h-8 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-sm">
                                {index + 1}
                              </span>
                              <span className="font-medium text-surface-900">{item.step || 'Step ' + (index + 1)}</span>
                              {item.hazard && item.control && <CheckCircle className="w-4 h-4 text-green-500" />}
                            </div>
                            {jsaExpanded === index ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                          </button>
                          
                          {jsaExpanded === index && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="p-4 pt-0 space-y-4"
                            >
                              <div>
                                <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Task Step *</label>
                                <input
                                  type="text"
                                  value={item.step}
                                  onChange={(e) => {
                                    const updated = [...jsaItems];
                                    updated[index].step = e.target.value;
                                    setJsaItems(updated);
                                  }}
                                  placeholder="Describe the task step..."
                                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-orange-400 uppercase mb-1 block flex items-center gap-1">
                                  <AlertTriangle className="w-3 h-3" /> Potential Hazards *
                                </label>
                                <textarea
                                  value={item.hazard}
                                  onChange={(e) => {
                                    const updated = [...jsaItems];
                                    updated[index].hazard = e.target.value;
                                    setJsaItems(updated);
                                  }}
                                  placeholder="What could go wrong? What are the risks?"
                                  rows={2}
                                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                                />
                              </div>
                              <div>
                                <label className="text-xs font-bold text-green-400 uppercase mb-1 block flex items-center gap-1">
                                  <Shield className="w-3 h-3" /> Control Measures *
                                </label>
                                <textarea
                                  value={item.control}
                                  onChange={(e) => {
                                    const updated = [...jsaItems];
                                    updated[index].control = e.target.value;
                                    setJsaItems(updated);
                                  }}
                                  placeholder="How will the hazards be controlled?"
                                  rows={3}
                                  className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                                />
                              </div>
                              {jsaItems.length > 1 && (
                                <button
                                  onClick={() => removeJSAItem(index)}
                                  className="text-red-500 font-bold text-sm hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                                >
                                  Remove Step
                                </button>
                              )}
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* PPE & Equipment */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                      <HardHat className="w-5 h-5 text-yellow-500" />
                      Required PPE
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {PPE_OPTIONS.map(ppe => (
                        <label
                          key={ppe}
                          className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${
                            preTaskData.ppeRequired.includes(ppe)
                              ? 'bg-teal-50 border-teal-300 text-teal-700'
                              : 'bg-surface-50 border-surface-200 text-surface-600 hover:bg-surface-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={preTaskData.ppeRequired.includes(ppe)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreTaskData({ ...preTaskData, ppeRequired: [...preTaskData.ppeRequired, ppe] });
                              } else {
                                setPreTaskData({ ...preTaskData, ppeRequired: preTaskData.ppeRequired.filter(p => p !== ppe) });
                              }
                            }}
                            className="sr-only"
                          />
                          <span className="text-sm font-medium">{ppe}</span>
                        </label>
                      ))}
                    </div>
                    
                    <div className="mt-4">
                      <label className="text-xs font-bold text-surface-400 uppercase mb-1 block flex items-center gap-1">
                        <Wrench className="w-3 h-3" /> Tools & Equipment Needed
                      </label>
                      <textarea
                        value={jsaReportData.equipmentNeeded}
                        onChange={(e) => setJsaReportData({ ...jsaReportData, equipmentNeeded: e.target.value })}
                        placeholder="List all tools and equipment required for this job..."
                        rows={2}
                        className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                      />
                    </div>
                  </div>

                  {/* Emergency Procedures */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <h3 className="font-bold text-brand-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      Emergency Procedures
                    </h3>
                    <textarea
                      value={jsaReportData.emergencyProcedures}
                      onChange={(e) => setJsaReportData({ ...jsaReportData, emergencyProcedures: e.target.value })}
                      placeholder="Describe emergency procedures, evacuation routes, emergency contacts, and first aid locations..."
                      rows={4}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                    />
                  </div>

                  {/* Signatures Section */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-bold text-brand-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-600" />
                        Required Signatures
                      </h3>
                      <button
                        onClick={() => setShowSignatureModal(true)}
                        className="text-indigo-600 font-bold text-sm hover:bg-indigo-50 px-4 py-2 rounded-xl transition-colors"
                      >
                        + Add Signature
                      </button>
                    </div>
                    
                    {signatures.length > 0 ? (
                      <div className="space-y-2">
                        {signatures.map((sig, index) => (
                          <div key={index} className="flex items-center gap-3 p-3 bg-surface-50 rounded-xl">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              sig.signed ? 'bg-green-100' : 'bg-surface-200'
                            }`}>
                              {sig.signed ? (
                                <CheckCircle className="w-5 h-5 text-green-600" />
                              ) : (
                                <FileText className="w-4 h-4 text-surface-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium text-surface-900">{sig.name}</p>
                              <p className="text-sm text-surface-500">{sig.role}</p>
                            </div>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              sig.signed ? 'bg-green-100 text-green-700' : 'bg-surface-200 text-surface-600'
                            }`}>
                              {sig.signed ? 'Signed' : 'Pending'}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 text-surface-500 border-2 border-dashed border-surface-200 rounded-xl">
                        <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                        <p>No signatures added yet</p>
                        <p className="text-sm">Click "Add Signature" to add crew signatures</p>
                      </div>
                    )}
                  </div>

                  {/* Additional Notes */}
                  <div className="bg-white p-6 rounded-3xl shadow-soft border border-surface-100">
                    <h3 className="font-bold text-brand-900 mb-4">Additional Notes</h3>
                    <textarea
                      value={jsaReportData.additionalNotes}
                      onChange={(e) => setJsaReportData({ ...jsaReportData, additionalNotes: e.target.value })}
                      placeholder="Any additional comments, special considerations, or notes..."
                      rows={3}
                      className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-teal-500/20 outline-none resize-none"
                    />
                  </div>

                  {/* Submit Buttons */}
                  <div className="flex gap-4">
                    <button className="flex-1 py-4 bg-surface-100 text-surface-700 rounded-2xl font-bold hover:bg-surface-200 transition-all flex items-center justify-center gap-2">
                      <Eye className="w-5 h-5" />
                      Preview Report
                    </button>
                    <button
                      onClick={async () => {
                        // Validate required fields
                        if (!jsaReportData.taskName || !jsaReportData.location || !jsaReportData.supervisor) {
                          alert('Please fill in all required fields (Task Name, Location, Supervisor)');
                          return;
                        }
                        if (jsaItems.some(item => !item.step || !item.hazard || !item.control)) {
                          alert('Please complete all JSA steps with hazards and controls');
                          return;
                        }
                        
                        setJsaReportSubmitting(true);
                        try {
                          const steps = jsaItems.map((item, idx) => ({
                            id: `step-${idx + 1}`,
                            stepNumber: idx + 1,
                            taskDescription: item.step,
                            hazards: [item.hazard],
                            riskLevel: 'medium' as const,
                            controls: item.control,
                            ppeRequired: [],
                            images: [],
                          }));
                          const result = await jsaApiService.create({
                            id: `JSA-${Date.now().toString(36).toUpperCase()}`,
                            title: jsaReportData.taskName,
                            department: '',
                            location: jsaReportData.location,
                            compliance: '',
                            steps,
                            status: 'pending',
                            overallRisk: steps.some(s => s.riskLevel === 'critical') ? 'critical' : 'medium',
                            assignee: jsaReportData.supervisor,
                            createdDate: jsaReportData.date,
                            createdBy: jsaReportData.supervisor,
                          });
                          setJsaReportId(result.id);
                          setJsaReportSubmitted(true);
                        } catch (err: unknown) {
                          const message = err instanceof Error ? err.message : 'Failed to submit JSA. Please try again.';
                          alert(message);
                        } finally {
                          setJsaReportSubmitting(false);
                        }
                      }}
                      disabled={jsaReportSubmitting}
                      className="flex-1 py-4 bg-teal-600 text-white rounded-2xl font-bold shadow-lg hover:bg-teal-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {jsaReportSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" />
                          Submit JSA Report
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}

              {/* Signature Modal */}
              <AnimatePresence>
                {showSignatureModal && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
                    onClick={() => setShowSignatureModal(false)}
                  >
                    <motion.div
                      initial={{ scale: 0.95, y: 20 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 0.95, y: 20 }}
                      onClick={(e) => e.stopPropagation()}
                      className="bg-white rounded-3xl p-6 max-w-md w-full"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-brand-900">Add Signature</h3>
                        <button onClick={() => setShowSignatureModal(false)} className="p-2 hover:bg-surface-100 rounded-full">
                          <XCircle className="w-5 h-5 text-surface-500" />
                        </button>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Name</label>
                          <input
                            type="text"
                            id="sig-name"
                            placeholder="Worker name"
                            className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Role</label>
                          <select
                            id="sig-role"
                            className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl"
                          >
                            <option value="Worker">Worker</option>
                            <option value="Supervisor">Supervisor</option>
                            <option value="Safety Officer">Safety Officer</option>
                            <option value="Contractor">Contractor</option>
                          </select>
                        </div>
                        <button
                          onClick={() => {
                            const nameInput = document.getElementById('sig-name') as HTMLInputElement;
                            const roleSelect = document.getElementById('sig-role') as HTMLSelectElement;
                            if (nameInput.value) {
                              setSignatures([...signatures, { name: nameInput.value, role: roleSelect.value, signed: true }]);
                              setShowSignatureModal(false);
                            }
                          }}
                          className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
                        >
                          Add Signature
                        </button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};
