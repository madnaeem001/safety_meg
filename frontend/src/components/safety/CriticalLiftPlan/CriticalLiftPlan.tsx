import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Anchor, AlertTriangle, CheckCircle2, Clock, FileText, MapPin,
  Users, Scale, ArrowLeft, Plus, Trash2, ChevronDown, ChevronUp,
  Shield, Calendar, Save, Send, Download, Eye, Wind, Ruler
} from 'lucide-react';

// Crane types
const CRANE_TYPES = [
  { id: 'mobile-hydraulic', label: 'Mobile Hydraulic Crane', maxCapacity: 500 },
  { id: 'mobile-lattice', label: 'Mobile Lattice Boom Crane', maxCapacity: 1000 },
  { id: 'tower', label: 'Tower Crane', maxCapacity: 400 },
  { id: 'overhead', label: 'Overhead/Bridge Crane', maxCapacity: 200 },
  { id: 'rough-terrain', label: 'Rough Terrain Crane', maxCapacity: 150 },
  { id: 'crawler', label: 'Crawler Crane', maxCapacity: 3000 },
  { id: 'all-terrain', label: 'All Terrain Crane', maxCapacity: 1200 },
];

// Rigging hardware types
const RIGGING_HARDWARE = [
  { id: 'shackle', label: 'Shackle', capacity: '0.5-85 tons' },
  { id: 'hook', label: 'Lifting Hook', capacity: '1-500 tons' },
  { id: 'sling-wire', label: 'Wire Rope Sling', capacity: '1-100 tons' },
  { id: 'sling-synthetic', label: 'Synthetic Sling', capacity: '1-50 tons' },
  { id: 'sling-chain', label: 'Chain Sling', capacity: '1-80 tons' },
  { id: 'spreader-bar', label: 'Spreader Bar', capacity: '5-200 tons' },
  { id: 'lifting-beam', label: 'Lifting Beam', capacity: '5-500 tons' },
  { id: 'eyebolt', label: 'Eye Bolt', capacity: '0.5-25 tons' },
];

// Checklist items for critical lift
const CRITICAL_LIFT_CHECKLIST = [
  { id: 'load-weight', label: 'Load weight verified and documented', category: 'Planning' },
  { id: 'crane-capacity', label: 'Crane capacity chart reviewed for lift radius', category: 'Planning' },
  { id: 'rigging-inspected', label: 'All rigging equipment inspected and certified', category: 'Equipment' },
  { id: 'ground-conditions', label: 'Ground/surface conditions assessed', category: 'Site' },
  { id: 'weather-checked', label: 'Weather conditions verified (wind < 25mph)', category: 'Environment' },
  { id: 'barricades', label: 'Barricades and warning signs in place', category: 'Site' },
  { id: 'communication', label: 'Communication plan established (radios tested)', category: 'Personnel' },
  { id: 'personnel-trained', label: 'All personnel properly trained and briefed', category: 'Personnel' },
  { id: 'load-path', label: 'Load path clear of obstructions and personnel', category: 'Site' },
  { id: 'outriggers', label: 'Crane outriggers/stabilizers properly set', category: 'Equipment' },
  { id: 'backup-plan', label: 'Emergency/backup plan documented', category: 'Planning' },
  { id: 'permits', label: 'All required permits obtained', category: 'Planning' },
  { id: 'utilities', label: 'Overhead utilities identified and protected', category: 'Site' },
  { id: 'signal-person', label: 'Qualified signal person designated', category: 'Personnel' },
  { id: 'tag-lines', label: 'Tag lines available and assigned', category: 'Equipment' },
];

// Risk categories
const RISK_LEVELS = [
  { id: 'low', label: 'Low', color: 'bg-green-100 text-green-700 border-green-200' },
  { id: 'medium', label: 'Medium', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'high', label: 'High', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { id: 'critical', label: 'Critical', color: 'bg-red-100 text-red-700 border-red-200' },
];

// Mock existing lift plans
const mockLiftPlans = [
  {
    id: 'CLP-2026-001',
    title: 'HVAC Unit Roof Placement',
    location: 'Building A - Roof',
    date: '2026-01-28',
    craneType: 'Mobile Hydraulic Crane',
    loadWeight: 15000,
    status: 'approved',
    riskLevel: 'high',
    engineer: 'Mike Johnson'
  },
  {
    id: 'CLP-2026-002',
    title: 'Generator Set Installation',
    location: 'Substation B',
    date: '2026-01-30',
    craneType: 'Rough Terrain Crane',
    loadWeight: 8500,
    status: 'pending-review',
    riskLevel: 'medium',
    engineer: 'Sarah Chen'
  },
  {
    id: 'CLP-2026-003',
    title: 'Steel Beam Erection - Phase 2',
    location: 'New Construction Site',
    date: '2026-02-05',
    craneType: 'Tower Crane',
    loadWeight: 25000,
    status: 'draft',
    riskLevel: 'critical',
    engineer: 'Robert Wilson'
  },
];

interface LiftStep {
  id: string;
  description: string;
  hazards: string[];
  controls: string;
}

interface CriticalLiftPlanProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
}

export const CriticalLiftPlan: React.FC<CriticalLiftPlanProps> = ({ onNavigate, onBack }) => {
  const [activeView, setActiveView] = useState<'list' | 'new' | 'view'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('load-info');
  const [checklistItems, setChecklistItems] = useState<Record<string, boolean>>({});

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    location: '',
    date: new Date().toISOString().split('T')[0],
    projectManager: '',
    liftDirector: '',
    craneOperator: '',
    rigger: '',
    signalPerson: '',
    craneType: '',
    craneCapacity: '',
    boomLength: '',
    liftRadius: '',
    loadWeight: '',
    loadDimensions: '',
    loadCenterOfGravity: '',
    riggingWeight: '',
    totalLoadWeight: '',
    capacityDeduction: '',
    riskLevel: 'medium',
    weatherConditions: '',
    windSpeed: '',
    temperature: '',
    groundConditions: '',
    notes: '',
  });

  const [liftSteps, setLiftSteps] = useState<LiftStep[]>([
    { id: '1', description: '', hazards: [], controls: '' }
  ]);

  const [selectedRigging, setSelectedRigging] = useState<string[]>([]);

  // Calculate capacity utilization
  const capacityUtilization = useMemo(() => {
    const totalLoad = parseFloat(formData.totalLoadWeight) || 0;
    const capacity = parseFloat(formData.craneCapacity) || 1;
    return Math.round((totalLoad / capacity) * 100);
  }, [formData.totalLoadWeight, formData.craneCapacity]);

  // Filter lift plans
  const filteredPlans = useMemo(() => {
    let plans = mockLiftPlans;
    if (statusFilter !== 'all') {
      plans = plans.filter(p => p.status === statusFilter);
    }
    if (searchQuery) {
      plans = plans.filter(p =>
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return plans;
  }, [statusFilter, searchQuery]);

  const handleChecklistToggle = (itemId: string) => {
    setChecklistItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  };

  const addLiftStep = () => {
    const newStep: LiftStep = {
      id: String(liftSteps.length + 1),
      description: '',
      hazards: [],
      controls: ''
    };
    setLiftSteps([...liftSteps, newStep]);
  };

  const updateLiftStep = (stepId: string, field: keyof LiftStep, value: any) => {
    setLiftSteps(liftSteps.map(s => s.id === stepId ? { ...s, [field]: value } : s));
  };

  const removeLiftStep = (stepId: string) => {
    if (liftSteps.length > 1) {
      setLiftSteps(liftSteps.filter(s => s.id !== stepId));
    }
  };

  const toggleRigging = (riggingId: string) => {
    setSelectedRigging(prev =>
      prev.includes(riggingId)
        ? prev.filter(r => r !== riggingId)
        : [...prev, riggingId]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-700';
      case 'pending-review': return 'bg-amber-100 text-amber-700';
      case 'draft': return 'bg-surface-100 text-surface-600';
      case 'rejected': return 'bg-red-100 text-red-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const getRiskColor = (risk: string) => {
    const level = RISK_LEVELS.find(r => r.id === risk);
    return level?.color || 'bg-surface-100 text-surface-600';
  };

  const completedChecklist = Object.values(checklistItems).filter(Boolean).length;
  const totalChecklist = CRITICAL_LIFT_CHECKLIST.length;

  // New Lift Plan Form
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
              onClick={() => setActiveView('list')}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </button>
            <div>
              <h2 className="text-xl font-bold text-brand-900">Critical Lift Plan</h2>
              <p className="text-sm text-surface-500">Document and plan critical lifting operations</p>
            </div>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-600">Pre-Lift Checklist Progress</span>
            <span className="text-sm font-bold text-brand-600">{completedChecklist}/{totalChecklist}</span>
          </div>
          <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-500 rounded-full transition-all duration-300"
              style={{ width: `${(completedChecklist / totalChecklist) * 100}%` }}
            />
          </div>
        </div>

        <form className="space-y-6">
          {/* Load Information Section */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'load-info' ? null : 'load-info')}
              className="w-full flex items-center justify-between p-4 bg-surface-50"
            >
              <div className="flex items-center gap-3">
                <Scale className="w-5 h-5 text-brand-500" />
                <span className="font-bold text-brand-900">Load Information</span>
              </div>
              {expandedSection === 'load-info' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <AnimatePresence>
              {expandedSection === 'load-info' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-4 border-t border-surface-100"
                >
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-surface-400 uppercase">Lift Description / Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g., HVAC Unit Roof Placement"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Load Weight (lbs)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.loadWeight}
                        onChange={(e) => setFormData({ ...formData, loadWeight: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Rigging Weight (lbs)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.riggingWeight}
                        onChange={(e) => setFormData({ ...formData, riggingWeight: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Total Weight (lbs)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.totalLoadWeight}
                        onChange={(e) => setFormData({ ...formData, totalLoadWeight: e.target.value })}
                        className="w-full px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-sm font-semibold text-amber-800"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Dimensions (LxWxH)</label>
                      <input
                        type="text"
                        placeholder="10'x8'x6'"
                        value={formData.loadDimensions}
                        onChange={(e) => setFormData({ ...formData, loadDimensions: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-surface-400 uppercase">Center of Gravity Location</label>
                    <input
                      type="text"
                      placeholder="Describe or provide measurements from reference point"
                      value={formData.loadCenterOfGravity}
                      onChange={(e) => setFormData({ ...formData, loadCenterOfGravity: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Crane Information Section */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'crane-info' ? null : 'crane-info')}
              className="w-full flex items-center justify-between p-4 bg-surface-50"
            >
              <div className="flex items-center gap-3">
                <Anchor className="w-5 h-5 text-blue-500" />
                <span className="font-bold text-brand-900">Crane & Rigging Configuration</span>
              </div>
              {expandedSection === 'crane-info' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <AnimatePresence>
              {expandedSection === 'crane-info' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-4 border-t border-surface-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Crane Type</label>
                      <select
                        value={formData.craneType}
                        onChange={(e) => setFormData({ ...formData, craneType: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      >
                        <option value="">Select Crane Type</option>
                        {CRANE_TYPES.map(crane => (
                          <option key={crane.id} value={crane.id}>{crane.label} (max {crane.maxCapacity}T)</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Crane Capacity at Radius (lbs)</label>
                      <input
                        type="number"
                        placeholder="From load chart"
                        value={formData.craneCapacity}
                        onChange={(e) => setFormData({ ...formData, craneCapacity: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Boom Length (ft)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.boomLength}
                        onChange={(e) => setFormData({ ...formData, boomLength: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Lift Radius (ft)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.liftRadius}
                        onChange={(e) => setFormData({ ...formData, liftRadius: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Capacity Utilization</label>
                      <div className={`px-3 py-2.5 rounded-xl text-sm font-bold ${
                        capacityUtilization > 85 ? 'bg-red-100 text-red-700' :
                        capacityUtilization > 75 ? 'bg-amber-100 text-amber-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {capacityUtilization}% of rated capacity
                        {capacityUtilization > 75 && (
                          <span className="ml-2 text-xs">⚠️ Critical Lift (&gt;75%)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-surface-400 uppercase">Rigging Hardware Selection</label>
                    <div className="flex flex-wrap gap-2">
                      {RIGGING_HARDWARE.map(hardware => (
                        <button
                          key={hardware.id}
                          type="button"
                          onClick={() => toggleRigging(hardware.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                            selectedRigging.includes(hardware.id)
                              ? 'bg-blue-500 text-white'
                              : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                          }`}
                        >
                          {hardware.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Personnel & Location Section */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'personnel' ? null : 'personnel')}
              className="w-full flex items-center justify-between p-4 bg-surface-50"
            >
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-500" />
                <span className="font-bold text-brand-900">Personnel & Location</span>
              </div>
              {expandedSection === 'personnel' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <AnimatePresence>
              {expandedSection === 'personnel' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-4 border-t border-surface-100"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Location</label>
                      <input
                        type="text"
                        placeholder="Lift location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Date</label>
                      <input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Lift Director</label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.liftDirector}
                        onChange={(e) => setFormData({ ...formData, liftDirector: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Crane Operator</label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.craneOperator}
                        onChange={(e) => setFormData({ ...formData, craneOperator: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Signal Person</label>
                      <input
                        type="text"
                        placeholder="Name"
                        value={formData.signalPerson}
                        onChange={(e) => setFormData({ ...formData, signalPerson: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Environmental Conditions Section */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'environment' ? null : 'environment')}
              className="w-full flex items-center justify-between p-4 bg-surface-50"
            >
              <div className="flex items-center gap-3">
                <Wind className="w-5 h-5 text-cyan-500" />
                <span className="font-bold text-brand-900">Environmental Conditions</span>
              </div>
              {expandedSection === 'environment' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <AnimatePresence>
              {expandedSection === 'environment' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-4 border-t border-surface-100"
                >
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Wind Speed (mph)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.windSpeed}
                        onChange={(e) => setFormData({ ...formData, windSpeed: e.target.value })}
                        className={`w-full px-3 py-2.5 border rounded-xl text-sm ${
                          parseFloat(formData.windSpeed) > 25
                            ? 'bg-red-50 border-red-200 text-red-700'
                            : 'bg-surface-50 border-surface-100'
                        }`}
                      />
                      {parseFloat(formData.windSpeed) > 25 && (
                        <p className="text-xs text-red-600">⚠️ Exceeds safe limit (25 mph)</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Temperature (°F)</label>
                      <input
                        type="number"
                        placeholder="0"
                        value={formData.temperature}
                        onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      />
                    </div>
                    <div className="col-span-2 space-y-2">
                      <label className="text-xs font-bold text-surface-400 uppercase">Weather Conditions</label>
                      <select
                        value={formData.weatherConditions}
                        onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                        className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                      >
                        <option value="">Select</option>
                        <option value="clear">Clear</option>
                        <option value="cloudy">Cloudy</option>
                        <option value="rain">Rain - STOP WORK</option>
                        <option value="snow">Snow - STOP WORK</option>
                        <option value="fog">Fog - Limited Visibility</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-surface-400 uppercase">Ground Conditions</label>
                    <textarea
                      rows={2}
                      placeholder="Describe ground/surface conditions, outrigger pad requirements..."
                      value={formData.groundConditions}
                      onChange={(e) => setFormData({ ...formData, groundConditions: e.target.value })}
                      className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm resize-none"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Pre-Lift Checklist Section */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
            <button
              type="button"
              onClick={() => setExpandedSection(expandedSection === 'checklist' ? null : 'checklist')}
              className="w-full flex items-center justify-between p-4 bg-surface-50"
            >
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="font-bold text-brand-900">Pre-Lift Safety Checklist</span>
                <span className="text-xs bg-brand-100 text-brand-600 px-2 py-0.5 rounded-full font-bold">
                  {completedChecklist}/{totalChecklist}
                </span>
              </div>
              {expandedSection === 'checklist' ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>

            <AnimatePresence>
              {expandedSection === 'checklist' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="p-4 space-y-3 border-t border-surface-100"
                >
                  {['Planning', 'Equipment', 'Site', 'Personnel', 'Environment'].map(category => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-xs font-bold text-surface-400 uppercase">{category}</h4>
                      {CRITICAL_LIFT_CHECKLIST.filter(item => item.category === category).map(item => (
                        <label
                          key={item.id}
                          className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                            checklistItems[item.id]
                              ? 'bg-green-50 border-green-200'
                              : 'bg-surface-50 border-surface-100 hover:bg-surface-100'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checklistItems[item.id] || false}
                            onChange={() => handleChecklistToggle(item.id)}
                            className="w-5 h-5 text-green-600 rounded"
                          />
                          <span className={`text-sm ${checklistItems[item.id] ? 'text-green-800' : 'text-surface-700'}`}>
                            {item.label}
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setActiveView('list')}
              className="flex-1 py-3 px-6 bg-surface-100 text-surface-700 font-semibold rounded-xl hover:bg-surface-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="flex-1 py-3 px-6 bg-surface-200 text-surface-700 font-semibold rounded-xl hover:bg-surface-300 transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Save Draft
            </button>
            <button
              type="submit"
              disabled={completedChecklist < totalChecklist}
              className="flex-1 py-3 px-6 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-5 h-5" />
              Submit for Approval
            </button>
          </div>
        </form>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-brand-900">Critical Lift Plans</h2>
            <p className="text-sm text-surface-500">Manage and document critical lifting operations</p>
          </div>
        </div>
        <button
          onClick={() => setActiveView('new')}
          className="px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Lift Plan
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Anchor className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Total Plans</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{mockLiftPlans.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Approved</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{mockLiftPlans.filter(p => p.status === 'approved').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Pending</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{mockLiftPlans.filter(p => p.status === 'pending-review').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Critical Risk</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{mockLiftPlans.filter(p => p.riskLevel === 'critical').length}</p>
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filteredPlans.map((plan, index) => (
          <motion.div
            key={plan.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft hover:shadow-card cursor-pointer transition-all"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600">
                <Anchor className="w-5 h-5" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-surface-400">{plan.id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getStatusColor(plan.status)}`}>
                    {plan.status.replace('-', ' ')}
                  </span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${getRiskColor(plan.riskLevel)}`}>
                    {plan.riskLevel} risk
                  </span>
                </div>
                <h4 className="font-semibold text-surface-800 truncate">{plan.title}</h4>
                <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {plan.date}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    {plan.location}
                  </span>
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5" />
                    {plan.loadWeight.toLocaleString()} lbs
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default CriticalLiftPlan;
