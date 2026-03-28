import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, X, Plus, Trash2, AlertTriangle, Shield, 
  Brain, Sparkles, ChevronDown, ChevronUp, Wand2,
  CheckCircle2, FileText, Users, MapPin, Calendar,
  LayoutTemplate, Camera, QrCode, Barcode, Info,
  Globe, BookOpen, Image as ImageIcon, Upload,
  CheckSquare, ListChecks
} from 'lucide-react';
import { SMCard, SMButton } from '../../components/ui';

interface JSAStep {
  id: string;
  stepNumber: number;
  taskDescription: string;
  hazards: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  controls: string;
  ppeRequired: string[];
  images: string[];
  complianceRef?: string;
}

interface JSABuilderProps {
  onSave: (jsa: any) => void;
  onCancel: () => void;
  initialData?: any;
}

const JSA_TEMPLATES = [
  {
    id: 'hot-work',
    title: 'Hot Work / Welding',
    department: 'Maintenance',
    compliance: 'OSHA 1910.252 / ISO 45001',
    steps: [
      { id: 't1', stepNumber: 1, taskDescription: 'Inspect work area for combustibles', hazards: ['Fire', 'Explosion'], riskLevel: 'high', controls: 'Remove all combustibles within 35ft. Cover immovable objects with fire blankets.', ppeRequired: [], images: [] },
      { id: 't2', stepNumber: 2, taskDescription: 'Set up welding equipment', hazards: ['Electric Shock', 'Tripping'], riskLevel: 'medium', controls: 'Inspect cables. Ensure ground is secure. Keep leads organized.', ppeRequired: [], images: [] },
      { id: 't3', stepNumber: 3, taskDescription: 'Perform welding', hazards: ['UV Radiation', 'Fumes', 'Sparks'], riskLevel: 'high', controls: 'Use welding screen. Wear welding helmet. Ensure ventilation.', ppeRequired: [], images: [] }
    ]
  },
  {
    id: 'confined-space',
    title: 'Confined Space Entry',
    department: 'Operations',
    compliance: 'OSHA 1910.146 / ISO 45001',
    steps: [
      { id: 'c1', stepNumber: 1, taskDescription: 'Test atmosphere', hazards: ['Toxic Gas', 'Oxygen Deficiency'], riskLevel: 'critical', controls: 'Calibrate gas monitor. Test at top, middle, bottom. Ventilate if needed.', ppeRequired: [], images: [] },
      { id: 'c2', stepNumber: 2, taskDescription: 'Set up retrieval system', hazards: ['Entrapment'], riskLevel: 'high', controls: 'Install tripod and winch. Harness inspection.', ppeRequired: [], images: [] },
      { id: 'c3', stepNumber: 3, taskDescription: 'Enter space', hazards: ['Slips/Falls', 'Claustrophobia'], riskLevel: 'medium', controls: 'Maintain communication with attendant. Use ladder.', ppeRequired: [], images: [] }
    ]
  },
  {
    id: 'heights',
    title: 'Working at Heights',
    department: 'Construction',
    compliance: 'OSHA 1926 Subpart M / ISO 45001',
    steps: [
      { id: 'h1', stepNumber: 1, taskDescription: 'Inspect fall protection equipment', hazards: ['Equipment Failure'], riskLevel: 'high', controls: 'Check harness, lanyard, and anchor points for damage.', ppeRequired: [], images: [] },
      { id: 'h2', stepNumber: 2, taskDescription: 'Access work area', hazards: ['Falling'], riskLevel: 'high', controls: 'Maintain 3 points of contact on ladder. Tie off immediately upon reaching height.', ppeRequired: [], images: [] }
    ]
  }
];

export const JSABuilder: React.FC<JSABuilderProps> = ({ onSave, onCancel, initialData }) => {
  const [title, setTitle] = useState(initialData?.title || '');
  const [department, setDepartment] = useState(initialData?.department || '');
  const [location, setLocation] = useState(initialData?.location || '');
  const [compliance, setCompliance] = useState(initialData?.compliance || 'ISO 45001 / OSHA 1910');
  const [steps, setSteps] = useState<JSAStep[]>(initialData?.steps || [
    { id: '1', stepNumber: 1, taskDescription: '', hazards: [], riskLevel: 'low', controls: '', ppeRequired: [], images: [] }
  ]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeStep, setActiveStep] = useState<number | null>(0);
  const [showTemplates, setShowTemplates] = useState(!initialData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTemplateSelect = (template: any) => {
    setTitle(template.title);
    setDepartment(template.department);
    setCompliance(template.compliance);
    setSteps(template.steps.map((s: any) => ({ ...s, id: Math.random().toString() })));
    setShowTemplates(false);
  };

  const handleAddStep = () => {
    const newStep: JSAStep = {
      id: Date.now().toString(),
      stepNumber: steps.length + 1,
      taskDescription: '',
      hazards: [],
      riskLevel: 'low',
      controls: '',
      ppeRequired: [],
      images: []
    };
    setSteps([...steps, newStep]);
    setActiveStep(steps.length);
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = steps.filter((_, i) => i !== index).map((step, i) => ({
      ...step,
      stepNumber: i + 1
    }));
    setSteps(newSteps);
    setActiveStep(null);
  };

  const updateStep = (index: number, field: keyof JSAStep, value: any) => {
    const newSteps = [...steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setSteps(newSteps);
  };

  const handleImageUpload = async (index: number) => {
    // Mock image upload
    const mockImages = [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?auto=format&fit=crop&q=80&w=400'
    ];
    const randomImg = mockImages[Math.floor(Math.random() * mockImages.length)];
    const currentImages = steps[index].images || [];
    updateStep(index, 'images', [...currentImages, randomImg]);

    // Trigger AI Image Hazard Detection
    setIsGenerating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newSteps = [...steps];
    newSteps[index].hazards = [...newSteps[index].hazards, 'Detected: Unsecured equipment in photo', 'Detected: Missing guardrail'];
    newSteps[index].controls = newSteps[index].controls + ' Install temporary guardrails. Secure all loose equipment before proceeding.';
    newSteps[index].riskLevel = 'high';
    setSteps(newSteps);
    setIsGenerating(false);
  };

  const generateAIHazards = async (index: number) => {
    const step = steps[index];
    if (!step.taskDescription) return;

    setIsGenerating(true);
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const lowerTask = step.taskDescription.toLowerCase();
    let mockHazards: string[] = [];
    let mockControls = '';
    let mockPPE: string[] = [];
    let mockRef = 'ISO 45001 Clause 8.1.2';

    if (lowerTask.includes('weld') || lowerTask.includes('hot')) {
      mockHazards = ['Fire', 'Explosion', 'UV Radiation', 'Fumes', 'Sparks'];
      mockControls = 'Remove combustibles within 35ft. Use welding screens. Ensure proper ventilation. Fire watch required for 60 mins post-task.';
      mockPPE = ['Welding Helmet', 'Leather Gloves', 'Fire-resistant Apron'];
      mockRef = 'OSHA 1910.252';
    } else if (lowerTask.includes('climb') || lowerTask.includes('height') || lowerTask.includes('ladder')) {
      mockHazards = ['Falls from height', 'Falling objects', 'Unstable surface', 'Suspension trauma'];
      mockControls = 'Use certified fall protection. Secure ladder at top and bottom. Set up exclusion zone below. Inspect anchor points.';
      mockPPE = ['Safety Harness', 'Lanyard', 'Hard Hat', 'Steel-toe Boots'];
      mockRef = 'OSHA 1926 Subpart M';
    } else if (lowerTask.includes('confined') || lowerTask.includes('tank') || lowerTask.includes('vessel')) {
      mockHazards = ['Toxic atmosphere', 'Oxygen deficiency', 'Engulfment', 'Entrapment'];
      mockControls = 'Test atmosphere before entry. Continuous ventilation. Attendant required. LOTO all energy sources.';
      mockPPE = ['Gas Monitor', 'Harness', 'Tripod/Winch', 'Communication Device'];
      mockRef = 'OSHA 1910.146';
    } else {
      mockHazards = [
        'Potential for slip/trip/fall',
        'Pinch points identified',
        'Ergonomic strain',
        'Struck-by hazard'
      ];
      mockControls = 'Ensure proper footing. Use mechanical aids for lifting. Wear appropriate PPE. Maintain situational awareness.';
      mockPPE = ['Safety Glasses', 'Gloves', 'Steel-toe Boots'];
    }

    updateStep(index, 'hazards', mockHazards);
    updateStep(index, 'controls', mockControls);
    updateStep(index, 'riskLevel', lowerTask.includes('confined') || lowerTask.includes('weld') ? 'high' : 'medium');
    updateStep(index, 'ppeRequired', mockPPE);
    updateStep(index, 'complianceRef', mockRef);
    setIsGenerating(false);
  };

  const handleSave = () => {
    const jsaData = {
      id: initialData?.id || `JSA-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      title,
      department,
      location,
      compliance,
      steps,
      status: 'draft',
      createdDate: new Date().toISOString().split('T')[0],
      createdBy: 'CurrentUser',
      overallRisk: steps.some(s => s.riskLevel === 'critical') ? 'critical' : 
                   steps.some(s => s.riskLevel === 'high') ? 'high' :
                   steps.some(s => s.riskLevel === 'medium') ? 'medium' : 'low'
    };
    onSave(jsaData);
  };

  if (showTemplates) {
    return (
      <SMCard>
        <div className="bg-surface-50 px-6 py-4 border-b border-surface-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-surface-900">Select a Template</h2>
            <p className="text-sm text-surface-500">Start with a pre-built JSA or create from scratch</p>
          </div>
          <button onClick={onCancel} className="p-2 hover:bg-surface-200 rounded-full">
            <X className="w-5 h-5 text-surface-500" />
          </button>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button
            onClick={() => setShowTemplates(false)}
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-surface-300 rounded-xl hover:border-brand-500 hover:bg-brand-50 transition-all group"
          >
            <div className="w-12 h-12 bg-surface-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-brand-100">
              <Plus className="w-6 h-6 text-surface-400 group-hover:text-brand-600" />
            </div>
            <h3 className="font-bold text-surface-900">Blank JSA</h3>
            <p className="text-sm text-surface-500 text-center mt-1">Start from scratch</p>
          </button>

          {JSA_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              className="flex flex-col items-start p-6 border border-surface-200 rounded-xl hover:border-brand-500 hover:shadow-md transition-all text-left bg-surface-50/50"
            >
              <div className="w-10 h-10 bg-white rounded-lg shadow-sm flex items-center justify-center mb-4 border border-surface-100">
                <LayoutTemplate className="w-5 h-5 text-brand-600" />
              </div>
              <h3 className="font-bold text-surface-900">{template.title}</h3>
              <p className="text-[10px] font-bold text-surface-400 uppercase mt-1 mb-2">{template.compliance}</p>
              <p className="text-xs font-bold text-surface-500 uppercase mb-3">{template.department}</p>
              <div className="flex items-center gap-2 text-xs text-surface-500">
                <span className="bg-surface-200 px-2 py-0.5 rounded-full">{template.steps.length} Steps</span>
              </div>
            </button>
          ))}
        </div>
      </SMCard>
    );
  }

  return (
    <SMCard>
      {/* Header */}
      <div className="bg-surface-50 px-6 py-4 border-b border-surface-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl border border-surface-200 shadow-sm">
            <QrCode className="w-8 h-8 text-surface-800" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-surface-900">
              {initialData ? 'Edit JSA' : 'Create New JSA'}
            </h2>
            <div className="flex items-center gap-2 text-xs text-surface-500 font-medium">
              <span className="flex items-center gap-1"><Barcode className="w-3 h-3" /> ID: {initialData?.id || 'AUTO-GEN'}</span>
              <span>•</span>
              <span className="flex items-center gap-1 text-brand-600"><Globe className="w-3 h-3" /> ISO 45001 / OSHA Compliant</span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          <SMButton variant="ghost" className="flex-1 md:flex-none" onClick={onCancel}>Cancel</SMButton>
          <SMButton variant="primary" className="flex-1 md:flex-none" leftIcon={<Save className="w-4 h-4" />} onClick={handleSave}>Save JSA</SMButton>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* General Info & Compliance */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Task / Job Title</label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Forklift Battery Change"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Department</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none appearance-none transition-all"
                >
                  <option value="">Select Department</option>
                  <option value="Operations">Operations</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Logistics">Logistics</option>
                  <option value="Safety">Safety</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-500 uppercase tracking-wider">Location</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="e.g. Warehouse B, Zone 4"
                  className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="bg-brand-50 p-4 rounded-2xl border border-brand-100 space-y-3">
            <div className="flex items-center gap-2 text-brand-800 font-bold text-xs uppercase tracking-wider">
              <Shield className="w-4 h-4" />
              Compliance Standard
            </div>
            <select
              value={compliance}
              onChange={(e) => setCompliance(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-brand-200 rounded-lg text-sm font-medium focus:ring-2 focus:ring-brand-500/20 outline-none"
            >
              <option value="ISO 45001 / OSHA 1910">ISO 45001 / OSHA 1910</option>
              <option value="OSHA 1926 (Construction)">OSHA 1926 (Construction)</option>
              <option value="ISO 14001 (Environmental)">ISO 14001 (Environmental)</option>
              <option value="ISO 22000 (Food Safety)">ISO 22000 (Food Safety)</option>
              <option value="ISO 12100 (Machinery)">ISO 12100 (Machinery)</option>
              <option value="NFPA 70E (Electrical)">NFPA 70E (Electrical)</option>
              <option value="GHS / HazCom">GHS / HazCom</option>
            </select>
            <div className="flex items-center gap-2 text-[10px] text-brand-600 font-medium">
              <Info className="w-3 h-3" />
              Auto-mapping to regulatory clauses enabled
            </div>
          </div>
        </div>

        {/* Steps Builder */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <ListChecks className="w-5 h-5 text-surface-800" />
              <h3 className="text-lg font-bold text-surface-900">Job Steps & Hazard Analysis</h3>
            </div>
            <button 
              onClick={handleAddStep}
              className="px-4 py-2 bg-surface-100 text-surface-800 font-bold rounded-xl hover:bg-surface-200 transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          <div className="space-y-4">
            {steps.map((step, index) => (
              <div 
                key={step.id}
                className={`border rounded-2xl transition-all overflow-hidden ${
                  activeStep === index 
                    ? 'border-brand-300 bg-brand-50/20 shadow-md' 
                    : 'border-surface-200 bg-white hover:border-surface-300'
                }`}
              >
                <div 
                  className="flex items-center justify-between p-5 cursor-pointer"
                  onClick={() => setActiveStep(activeStep === index ? null : index)}
                >
                  <div className="flex items-center gap-4">
                    <span className="w-10 h-10 rounded-xl bg-surface-100 text-surface-800 flex items-center justify-center font-black text-lg">
                      {step.stepNumber}
                    </span>
                    <div>
                      <span className="font-bold text-surface-900 block">
                        {step.taskDescription || 'New Step'}
                      </span>
                      {step.complianceRef && (
                        <span className="text-[10px] font-bold text-brand-600 uppercase tracking-tighter">
                          Ref: {step.complianceRef}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-1">
                      {step.images.length > 0 && (
                        <div className="flex -space-x-2">
                          {step.images.map((img, i) => (
                            <div key={i} className="w-6 h-6 rounded-full border-2 border-white overflow-hidden shadow-sm">
                              <img src={img} alt="Step" className="w-full h-full object-cover" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    {step.riskLevel !== 'low' && (
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        step.riskLevel === 'critical' ? 'bg-red-600 text-white' :
                        step.riskLevel === 'high' ? 'bg-orange-500 text-white' :
                        'bg-amber-500 text-white'
                      }`}>
                        {step.riskLevel}
                      </span>
                    )}
                    {activeStep === index ? <ChevronUp className="w-6 h-6 text-surface-400" /> : <ChevronDown className="w-6 h-6 text-surface-400" />}
                  </div>
                </div>

                <AnimatePresence>
                  {activeStep === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="px-5 pb-6 border-t border-surface-100"
                    >
                      <div className="pt-6 space-y-6">
                        {/* Task Description & AI */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                          <div className="lg:col-span-2 space-y-2">
                            <div className="flex justify-between items-center">
                              <label className="text-xs font-black text-surface-500 uppercase tracking-widest">Task Description</label>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  generateAIHazards(index);
                                }}
                                disabled={!step.taskDescription || isGenerating}
                                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-bold flex items-center gap-2 hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-purple-100"
                              >
                                {isGenerating ? <Sparkles className="w-3 h-3 animate-spin" /> : <Brain className="w-3 h-3" />}
                                AI Analyze
                              </button>
                            </div>
                            <textarea
                              value={step.taskDescription}
                              onChange={(e) => updateStep(index, 'taskDescription', e.target.value)}
                              placeholder="Describe what is being done in this step..."
                              className="w-full px-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none resize-none h-24 font-medium"
                            />
                          </div>

                          {/* Image Upload Section */}
                          <div className="space-y-2">
                            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">Visual Documentation</label>
                            <div className="grid grid-cols-2 gap-2">
                              {step.images.map((img, i) => (
                                <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-surface-200 group">
                                  <img src={img} alt="Step" className="w-full h-full object-cover" />
                                  <button 
                                    onClick={() => updateStep(index, 'images', step.images.filter((_, idx) => idx !== i))}
                                    className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button 
                                onClick={() => handleImageUpload(index)}
                                className="aspect-video rounded-xl border-2 border-dashed border-surface-200 flex flex-col items-center justify-center gap-1 hover:border-brand-500 hover:bg-brand-50 transition-all text-surface-400 hover:text-brand-600"
                              >
                                <Camera className="w-5 h-5" />
                                <span className="text-[10px] font-bold">Add Photo</span>
                              </button>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Hazards */}
                          <div className="space-y-3">
                            <label className="text-xs font-black text-orange-600 uppercase tracking-widest flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4" /> Potential Hazards
                            </label>
                            <div className="bg-orange-50/30 p-4 rounded-2xl border border-orange-100 space-y-3">
                              {step.hazards.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                  {step.hazards.map((h, i) => (
                                    <span key={i} className="px-3 py-1 bg-white border border-orange-200 text-orange-800 rounded-lg text-xs font-bold flex items-center gap-2">
                                      {h}
                                      <button onClick={() => updateStep(index, 'hazards', step.hazards.filter((_, idx) => idx !== i))}>
                                        <X className="w-3 h-3" />
                                      </button>
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-sm text-surface-400 italic">No hazards identified yet. Use AI to analyze.</p>
                              )}
                              <div className="flex gap-2">
                                <input 
                                  type="text" 
                                  placeholder="Add hazard..."
                                  className="flex-1 px-3 py-1.5 bg-white border border-orange-100 rounded-lg text-xs outline-none focus:ring-2 focus:ring-orange-500/20"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const val = (e.target as HTMLInputElement).value;
                                      if (val) {
                                        updateStep(index, 'hazards', [...step.hazards, val]);
                                        (e.target as HTMLInputElement).value = '';
                                      }
                                    }
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Controls */}
                          <div className="space-y-3">
                            <label className="text-xs font-black text-green-600 uppercase tracking-widest flex items-center gap-2">
                              <Shield className="w-4 h-4" /> Control Measures (Hierarchy of Controls)
                            </label>
                            <textarea
                              value={step.controls}
                              onChange={(e) => updateStep(index, 'controls', e.target.value)}
                              placeholder="Describe elimination, substitution, engineering, or administrative controls..."
                              className="w-full px-4 py-3 border border-green-200 bg-green-50/20 rounded-2xl focus:ring-2 focus:ring-green-500/20 outline-none resize-none h-32 text-sm font-medium"
                            />
                          </div>
                        </div>

                        {/* Risk Level & Compliance Ref */}
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 pt-4 border-t border-surface-100">
                          <div className="space-y-2">
                            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">Residual Risk Level</label>
                            <div className="flex gap-2">
                              {['low', 'medium', 'high', 'critical'].map((level) => (
                                <button
                                  key={level}
                                  onClick={() => updateStep(index, 'riskLevel', level)}
                                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                    step.riskLevel === level
                                      ? level === 'critical' ? 'bg-red-600 text-white shadow-lg shadow-red-200'
                                      : level === 'high' ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
                                      : level === 'medium' ? 'bg-amber-500 text-white shadow-lg shadow-amber-200'
                                      : 'bg-green-600 text-white shadow-lg shadow-green-200'
                                      : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                                  }`}
                                >
                                  {level}
                                </button>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <label className="text-xs font-black text-surface-500 uppercase tracking-widest">Compliance Reference</label>
                            <div className="relative">
                              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                              <input
                                type="text"
                                value={step.complianceRef || ''}
                                onChange={(e) => updateStep(index, 'complianceRef', e.target.value)}
                                placeholder="e.g. OSHA 1910.147(c)(4)"
                                className="w-full pl-10 pr-4 py-2 bg-surface-50 border border-surface-200 rounded-xl text-xs font-bold text-brand-700 outline-none"
                              />
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => handleRemoveStep(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition-colors self-end"
                            title="Remove Step"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* International Standards Info Panel */}
        <div className="bg-surface-overlay border border-surface-border rounded-3xl p-8 relative overflow-hidden">
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-accent rounded-lg">
                  <Globe className="w-6 h-6 text-text-onAccent" />
                </div>
                <h3 className="text-xl font-bold text-text-primary">International Safety Standards</h3>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                This JSA builder is designed to meet the rigorous requirements of **ISO 45001:2018** (Occupational Health and Safety Management Systems) and **OSHA 1910/1926** standards.
              </p>
              <ul className="space-y-2">
                {[
                  'Hazard Identification (ISO 45001 Clause 6.1.2.1)',
                  'Assessment of OH&S Risks (Clause 6.1.2.2)',
                  'Hierarchy of Controls Implementation (Clause 8.1.2)',
                  'OSHA Job Hazard Analysis (OSHA 3071)'
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs font-medium text-text-secondary">
                    <CheckCircle2 className="w-4 h-4 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-surface-sunken rounded-2xl p-6 border border-surface-border space-y-4">
              <h4 className="font-bold text-text-muted uppercase text-xs tracking-widest">Pro Tip: Hierarchy of Controls</h4>
              <div className="space-y-3">
                {[
                  { l: 'Elimination', d: 'Physically remove the hazard', c: 'bg-emerald-500' },
                  { l: 'Substitution', d: 'Replace the hazard', c: 'bg-green-500' },
                  { l: 'Engineering', d: 'Isolate people from the hazard', c: 'bg-blue-500' },
                  { l: 'Administrative', d: 'Change the way people work', c: 'bg-amber-500' },
                  { l: 'PPE', d: 'Protect the worker with equipment', c: 'bg-red-500' }
                ].map((h, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${h.c}`} />
                    <div>
                      <span className="text-xs font-bold block text-text-primary">{h.l}</span>
                      <span className="text-[10px] text-text-muted">{h.d}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full -mr-48 -mt-48 blur-3xl" />
        </div>
      </div>
    </SMCard>
  );
};
