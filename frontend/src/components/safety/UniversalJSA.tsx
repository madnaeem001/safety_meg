import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ClipboardList, Calendar, MapPin, Clock, User, FileText, Save, 
  CheckCircle2, Plus, Search, ChevronRight, Send, ArrowLeft, 
  AlertTriangle, Shield, ChevronDown, ChevronUp, Trash2, Edit2,
  HardHat, Hammer, Zap, Users, Eye, PenTool, Download, Anchor, Calculator, Scale
} from 'lucide-react';
import { MultiSignaturePad } from './SignaturePad';
import { exportJSAtoPDF } from '../../utils/jsaPdfExport';
import { CriticalLiftPlan } from './CriticalLiftPlan/CriticalLiftPlan';
import { RiggingCalculator } from './RiggingCalculator/RiggingCalculator';
import { JSABuilder } from './JSABuilder';

// Risk levels for JSA
const RISK_LEVELS = [
  { id: 'low', label: 'Low', color: 'bg-success/10 text-success border-success/20' },
  { id: 'medium', label: 'Medium', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'high', label: 'High', color: 'bg-warning/10 text-warning border-warning/20' },
  { id: 'critical', label: 'Critical', color: 'bg-danger/10 text-danger border-danger/20' },
];

// Common hazard categories
const HAZARD_CATEGORIES = [
  'Struck By', 'Caught In/Between', 'Fall Hazard', 'Electrical', 
  'Chemical Exposure', 'Ergonomic', 'Fire/Explosion', 'Environmental',
  'Moving Equipment', 'Sharp Objects', 'Hot Surfaces', 'Noise', 'Confined Space'
];

// Common PPE types
const PPE_OPTIONS = [
  { id: 'hardhat', label: 'Hard Hat', icon: HardHat },
  { id: 'safety-glasses', label: 'Safety Glasses', icon: Eye },
  { id: 'gloves', label: 'Gloves', icon: Hammer },
  { id: 'steel-toe', label: 'Steel Toe Boots', icon: Shield },
  { id: 'hearing', label: 'Hearing Protection', icon: Shield },
  { id: 'respirator', label: 'Respirator', icon: Shield },
  { id: 'hi-vis', label: 'High Visibility Vest', icon: Shield },
  { id: 'face-shield', label: 'Face Shield', icon: Shield },
  { id: 'fall-protection', label: 'Fall Protection', icon: Shield },
];

// Departments
const DEPARTMENTS = [
  'Operations', 'Manufacturing', 'Maintenance', 'Construction', 
  'Logistics', 'Facilities', 'Warehouse', 'Field Operations'
];

// Signature entry interface
interface SignatureEntry {
  id: string;
  role: string;
  name: string;
  signature: string;
  date: string;
}

// Signature roles for JSA
const SIGNATURE_ROLES = [
  { id: 'worker', label: 'Worker / Employee' },
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'safety-officer', label: 'Safety Officer' },
];

// JSA Step interface
interface JSAStep {
  id: string;
  stepNumber: number;
  taskDescription: string;
  hazards: string[];
  riskLevel: string;
  controls: string;
  ppeRequired: string[];
}

// Mock existing JSAs
const mockJSAs = [
  { 
    id: 'JSA-2026-001', 
    title: 'Forklift Operation and Loading', 
    department: 'Logistics', 
    status: 'approved', 
    createdDate: '2026-01-05', 
    reviewDate: '2026-07-05',
    createdBy: 'John Smith',
    steps: 4,
    overallRisk: 'high'
  },
  { 
    id: 'JSA-2026-002', 
    title: 'Confined Space Entry - Tank Cleaning', 
    department: 'Maintenance', 
    status: 'pending-review', 
    createdDate: '2026-01-04', 
    reviewDate: '2026-07-04',
    createdBy: 'Sarah Johnson',
    steps: 6,
    overallRisk: 'critical'
  },
  { 
    id: 'JSA-2026-003', 
    title: 'Electrical Panel Maintenance', 
    department: 'Facilities', 
    status: 'approved', 
    createdDate: '2026-01-03', 
    reviewDate: '2026-07-03',
    createdBy: 'Mike Davis',
    steps: 5,
    overallRisk: 'high'
  },
  { 
    id: 'JSA-2026-004', 
    title: 'Manual Material Handling', 
    department: 'Warehouse', 
    status: 'approved', 
    createdDate: '2026-01-02', 
    reviewDate: '2026-07-02',
    createdBy: 'Emily Chen',
    steps: 3,
    overallRisk: 'medium'
  },
  { 
    id: 'JSA-2026-005', 
    title: 'Ladder Use and Elevated Work', 
    department: 'Construction', 
    status: 'draft', 
    createdDate: '2026-01-01', 
    reviewDate: null,
    createdBy: 'Robert Wilson',
    steps: 4,
    overallRisk: 'high'
  },
];

interface UniversalJSAProps {
  onNavigate?: (route: string) => void;
}

export const UniversalJSA: React.FC<UniversalJSAProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<'list' | 'new' | 'view' | 'critical-lift' | 'rigging-calculator'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedJSA, setSelectedJSA] = useState<typeof mockJSAs[0] | null>(null);
  
  // New JSA form state
  const [formData, setFormData] = useState({
    title: '',
    department: '',
    location: '',
    createdBy: '',
    supervisor: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    requiredTraining: '',
    permitRequired: false,
  });
  
  const [steps, setSteps] = useState<JSAStep[]>([
    { id: '1', stepNumber: 1, taskDescription: '', hazards: [], riskLevel: 'low', controls: '', ppeRequired: [] }
  ]);
  const [expandedStep, setExpandedStep] = useState<string | null>('1');
  const [submitted, setSubmitted] = useState(false);
  const [signatures, setSignatures] = useState<SignatureEntry[]>([]);
  const [showSignatures, setShowSignatures] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export JSA to PDF
  const handleExportPDF = (status: 'draft' | 'pending-review' | 'approved' = 'draft') => {
    setIsExporting(true);
    try {
      exportJSAtoPDF({
        formData,
        steps,
        signatures,
        jsaId: `JSA-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`,
        status
      });
    } catch (error) {
      console.error('Failed to export PDF:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Filter JSAs
  const filteredJSAs = useMemo(() => {
    let jsas = mockJSAs;
    if (statusFilter !== 'all') {
      jsas = jsas.filter(j => j.status === statusFilter);
    }
    if (searchQuery) {
      jsas = jsas.filter(j => 
        j.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        j.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return jsas;
  }, [statusFilter, searchQuery]);

  const addStep = () => {
    const newStep: JSAStep = {
      id: Date.now().toString(),
      stepNumber: steps.length + 1,
      taskDescription: '',
      hazards: [],
      riskLevel: 'low',
      controls: '',
      ppeRequired: []
    };
    setSteps([...steps, newStep]);
    setExpandedStep(newStep.id);
  };

  const removeStep = (id: string) => {
    const newSteps = steps.filter(s => s.id !== id).map((s, index) => ({
      ...s,
      stepNumber: index + 1
    }));
    setSteps(newSteps);
  };

  const updateStep = (id: string, field: keyof JSAStep, value: any) => {
    setSteps(steps.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const toggleHazard = (stepId: string, hazard: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    const newHazards = step.hazards.includes(hazard)
      ? step.hazards.filter(h => h !== hazard)
      : [...step.hazards, hazard];
    
    updateStep(stepId, 'hazards', newHazards);
  };

  const togglePPE = (stepId: string, ppeId: string) => {
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    const newPPE = step.ppeRequired.includes(ppeId)
      ? step.ppeRequired.filter(p => p !== ppeId)
      : [...step.ppeRequired, ppeId];
    
    updateStep(stepId, 'ppeRequired', newPPE);
  };

  const getRiskColor = (level: string) => {
    const risk = RISK_LEVELS.find(r => r.id === level);
    return risk ? risk.color : 'bg-gray-100 text-gray-700';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-success/10 text-success';
      case 'pending-review': return 'bg-warning/10 text-warning';
      case 'draft': return 'bg-surface-overlay text-text-muted';
      default: return 'bg-surface-overlay text-text-muted';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveView('list');
    }, 2000);
  };

  // New JSA Form
  if (activeView === 'new') {
    return (
      <JSABuilder 
        onSave={(data) => {
          console.log('Saved JSA:', data);
          setActiveView('list');
        }}
        onCancel={() => setActiveView('list')}
      />
    );
  }

  // List View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Critical Lift Plan View */}
      {activeView === 'critical-lift' && (
        <CriticalLiftPlan onBack={() => setActiveView('list')} />
      )}

      {/* Rigging Calculator View */}
      {activeView === 'rigging-calculator' && (
        <RiggingCalculator onBack={() => setActiveView('list')} />
      )}

      {/* Regular List View */}
      {activeView === 'list' && (
        <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text-primary">Job Safety Analysis (JSA)</h2>
          <p className="text-sm text-text-muted">Universal JSA templates for safe task execution</p>
        </div>
        <button
          onClick={() => setActiveView('new')}
          className="px-4 py-2.5 bg-accent text-text-onAccent font-semibold rounded-xl hover:brightness-110 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Create JSA
        </button>
      </div>

      {/* Quick Actions - Critical Lift and Rigging Calculator */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveView('critical-lift')}
          className="bg-gradient-to-br from-amber-500 to-orange-600 p-6 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Anchor className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Critical Lift Plan</h3>
              <p className="text-white/80 text-sm">Plan and document critical crane lifts with detailed checklists, rigging specs, and safety requirements.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60" />
          </div>
        </motion.div>
        
        <motion.div
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setActiveView('rigging-calculator')}
          className="bg-gradient-to-br from-blue-500 to-indigo-600 p-6 rounded-2xl cursor-pointer shadow-lg hover:shadow-xl transition-all"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI Rigging Calculator</h3>
              <p className="text-white/80 text-sm">Calculate Working Load Limits, sling angles, and safety factors for rigging operations.</p>
            </div>
            <ChevronRight className="w-6 h-6 text-white/60" />
          </div>
        </motion.div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <ClipboardList className="w-5 h-5 text-accent" />
            <span className="text-xs font-bold text-text-muted uppercase">Total JSAs</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{mockJSAs.length}</p>
        </div>
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="text-xs font-bold text-text-muted uppercase">Approved</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{mockJSAs.filter(j => j.status === 'approved').length}</p>
        </div>
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-warning" />
            <span className="text-xs font-bold text-text-muted uppercase">Pending Review</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{mockJSAs.filter(j => j.status === 'pending-review').length}</p>
        </div>
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-danger" />
            <span className="text-xs font-bold text-text-muted uppercase">High Risk</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{mockJSAs.filter(j => j.overallRisk === 'high' || j.overallRisk === 'critical').length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search JSAs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary placeholder:text-text-muted outline-none focus:ring-2 focus:ring-accent/20 transition-all"
            />
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          {[
            { id: 'all', label: 'All' },
            { id: 'approved', label: 'Approved' },
            { id: 'pending-review', label: 'Pending Review' },
            { id: 'draft', label: 'Draft' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                statusFilter === tab.id ? 'bg-accent text-text-onAccent' : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* JSA List */}
      <div className="space-y-3">
        {filteredJSAs.map((jsa, index) => (
          <motion.div
            key={jsa.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft hover:shadow-card cursor-pointer transition-all group"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-accent/10 text-accent">
                <ClipboardList className="w-5 h-5" />
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-text-muted">{jsa.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getStatusColor(jsa.status)}`}>
                    {jsa.status.replace('-', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getRiskColor(jsa.overallRisk)}`}>
                    {jsa.overallRisk} risk
                  </span>
                </div>
                <h4 className="font-semibold text-text-primary truncate">{jsa.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {jsa.createdDate}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {jsa.department}
                  </span>
                  <span className="flex items-center gap-1">
                    <ClipboardList className="w-3.5 h-3.5" />
                    {jsa.steps} steps
                  </span>
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" />
                    {jsa.createdBy}
                  </span>
                </div>
              </div>
              
              <ChevronRight className="w-5 h-5 text-text-muted group-hover:text-accent transition-colors" />
            </div>
          </motion.div>
        ))}

        {filteredJSAs.length === 0 && (
          <div className="text-center py-12 bg-surface-sunken rounded-2xl border border-surface-border">
            <ClipboardList className="w-12 h-12 text-text-muted mx-auto mb-4" />
            <p className="text-text-muted">No JSAs found</p>
          </div>
        )}
      </div>
        </>
      )}
    </motion.div>
  );
};
