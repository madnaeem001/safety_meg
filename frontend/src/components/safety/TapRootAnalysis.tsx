import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, ChevronDown, ChevronRight, CheckCircle2, AlertTriangle, 
  Users, Settings, BookOpen, Lightbulb, Brain, Plus, X
} from 'lucide-react';
import { SMCard, SMButton } from '../../components/ui';

// TapRoot Root Cause Categories based on TapRoot methodology
const TAPROOT_CATEGORIES = {
  'Equipment Difficulty': {
    icon: Settings,
    color: 'blue',
    subcategories: [
      'Equipment Design',
      'Equipment Selection',
      'Equipment Installation',
      'Equipment Maintenance',
      'Equipment Failure',
      'Calibration/Testing',
    ],
    generic_causes: [
      'No standard/procedure',
      'Standard not followed',
      'Inadequate standard',
      'Communication not provided',
      'Inadequate training',
    ]
  },
  'Procedures': {
    icon: BookOpen,
    color: 'purple',
    subcategories: [
      'No procedure',
      'Procedure not used',
      'Procedure followed incorrectly',
      'Procedure wrong/incomplete',
      'Procedure confusing',
      'Procedure difficult to use',
    ],
    generic_causes: [
      'Procedure not available',
      'Procedure difficult to find',
      'Procedure too complex',
      'Procedure not approved',
      'No review process',
    ]
  },
  'Training': {
    icon: Users,
    color: 'green',
    subcategories: [
      'No training provided',
      'Training inadequate',
      'Training not documented',
      'No continuing training',
      'Training quality issues',
      'Practice/OJT inadequate',
    ],
    generic_causes: [
      'Training needs not analyzed',
      'Training objectives unclear',
      'No verification of learning',
      'Trainer not qualified',
      'Training materials inadequate',
    ]
  },
  'Management System': {
    icon: Target,
    color: 'orange',
    subcategories: [
      'SPAC not used',
      'Standards/Policies/Admin Controls NI',
      'Management oversight inadequate',
      'Corrective action ineffective',
      'Risk assessment inadequate',
      'Change management issues',
    ],
    generic_causes: [
      'No clear responsibilities',
      'Inadequate resources',
      'Priorities not clear',
      'Conflicting goals',
      'Management commitment lacking',
    ]
  },
  'Human Engineering': {
    icon: Brain,
    color: 'red',
    subcategories: [
      'Human-Machine Interface',
      'Work Environment',
      'Complex System',
      'Non-Fault Tolerant System',
      'Upset/emergency response',
      'Monitoring/alertness',
    ],
    generic_causes: [
      'Excessive workload',
      'Time pressure',
      'Fatigue/alertness issues',
      'Distractions',
      'Stress factors',
    ]
  },
  'Communication': {
    icon: Users,
    color: 'teal',
    subcategories: [
      'No communication/late',
      'Turnover inadequate',
      'Label/sign problems',
      'Needed info not available',
      'Misunderstanding',
      'Communication channels unclear',
    ],
    generic_causes: [
      'No communication policy',
      'Communication barriers',
      'Language issues',
      'Documentation incomplete',
      'Feedback not provided',
    ]
  },
};

interface TapRootFinding {
  id: string;
  category: string;
  subcategory: string;
  genericCause: string;
  specificCause: string;
  correctiveAction: string;
}

interface TapRootAnalysisProps {
  onFindingsChange?: (findings: TapRootFinding[]) => void;
  initialFindings?: TapRootFinding[];
}

export const TapRootAnalysis: React.FC<TapRootAnalysisProps> = ({ 
  onFindingsChange, 
  initialFindings = [] 
}) => {
  const [findings, setFindings] = useState<TapRootFinding[]>(initialFindings);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('');
  const [selectedGenericCause, setSelectedGenericCause] = useState<string>('');
  const [specificCause, setSpecificCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const addFinding = () => {
    if (!selectedCategory || !selectedSubcategory || !specificCause) return;
    
    const newFinding: TapRootFinding = {
      id: `TR-${Date.now()}`,
      category: selectedCategory,
      subcategory: selectedSubcategory,
      genericCause: selectedGenericCause,
      specificCause,
      correctiveAction,
    };
    
    const updatedFindings = [...findings, newFinding];
    setFindings(updatedFindings);
    onFindingsChange?.(updatedFindings);
    
    // Reset form
    setSelectedCategory('');
    setSelectedSubcategory('');
    setSelectedGenericCause('');
    setSpecificCause('');
    setCorrectiveAction('');
    setShowAddForm(false);
  };

  const removeFinding = (id: string) => {
    const updatedFindings = findings.filter(f => f.id !== id);
    setFindings(updatedFindings);
    onFindingsChange?.(updatedFindings);
  };

  const getCategoryColor = (category: string) => {
    const cat = TAPROOT_CATEGORIES[category as keyof typeof TAPROOT_CATEGORIES];
    if (!cat) return 'surface';
    return cat.color;
  };

  return (
    <div className="space-y-6">
      {/* TapRoot Header */}
      <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-5 text-white">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-lg">TapRoot® Root Cause Analysis</h3>
            <p className="text-indigo-200 text-sm">Systematic cause identification methodology</p>
          </div>
        </div>
        <p className="text-sm text-indigo-100 mt-3">
          Use the TapRoot methodology to identify root causes through a structured analysis tree. 
          Select applicable categories, identify generic causes, and develop corrective actions.
        </p>
      </div>

      {/* Category Tree */}
      <SMCard className="p-5">
        <h4 className="font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-amber-500" />
          Root Cause Categories
        </h4>
        
        <div className="space-y-2">
          {Object.entries(TAPROOT_CATEGORIES).map(([name, cat]) => (
            <div key={name} className="border border-surface-100 dark:border-surface-700 rounded-xl overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === name ? null : name)}
                className={`w-full flex items-center justify-between p-3 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors ${
                  expandedCategory === name ? 'bg-surface-50 dark:bg-surface-700' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg bg-${cat.color}-100 dark:bg-${cat.color}-900/30 flex items-center justify-center`}>
                    <cat.icon className={`w-4 h-4 text-${cat.color}-600 dark:text-${cat.color}-400`} />
                  </div>
                  <span className="font-medium text-sm text-brand-900 dark:text-white">{name}</span>
                </div>
                {expandedCategory === name ? (
                  <ChevronDown className="w-4 h-4 text-surface-400" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-surface-400" />
                )}
              </button>
              
              <AnimatePresence>
                {expandedCategory === name && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 space-y-3">
                      <div>
                        <div className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Subcategories:</div>
                        <div className="flex flex-wrap gap-2">
                          {cat.subcategories.map(sub => (
                            <span key={sub} className="px-2.5 py-1 bg-surface-100 dark:bg-surface-600 text-surface-600 dark:text-surface-300 rounded-lg text-xs">
                              {sub}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Generic Causes:</div>
                        <div className="flex flex-wrap gap-2">
                          {cat.generic_causes.map(gc => (
                            <span key={gc} className="px-2.5 py-1 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg text-xs">
                              {gc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
        </SMCard>
      {!showAddForm ? (
        <SMButton
          variant="secondary"
          className="w-full"
          leftIcon={<Plus className="w-5 h-5" />}
          onClick={() => setShowAddForm(true)}
        >
          Add TapRoot Finding
        </SMButton>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-brand-900 dark:text-white">Add Root Cause Finding</h4>
            <button onClick={() => setShowAddForm(false)} className="p-1 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg">
              <X className="w-5 h-5 text-surface-400" />
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Category *</label>
              <select
                value={selectedCategory}
                onChange={e => { setSelectedCategory(e.target.value); setSelectedSubcategory(''); setSelectedGenericCause(''); }}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
              >
                <option value="">Select category...</option>
                {Object.keys(TAPROOT_CATEGORIES).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            {selectedCategory && (
              <>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Subcategory *</label>
                  <select
                    value={selectedSubcategory}
                    onChange={e => setSelectedSubcategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                  >
                    <option value="">Select subcategory...</option>
                    {TAPROOT_CATEGORIES[selectedCategory as keyof typeof TAPROOT_CATEGORIES]?.subcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Generic Cause</label>
                  <select
                    value={selectedGenericCause}
                    onChange={e => setSelectedGenericCause(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                  >
                    <option value="">Select generic cause...</option>
                    {TAPROOT_CATEGORIES[selectedCategory as keyof typeof TAPROOT_CATEGORIES]?.generic_causes.map(gc => (
                      <option key={gc} value={gc}>{gc}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Specific Cause *</label>
              <textarea
                value={specificCause}
                onChange={e => setSpecificCause(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white resize-none"
                placeholder="Describe the specific root cause identified..."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Recommended Corrective Action</label>
              <textarea
                value={correctiveAction}
                onChange={e => setCorrectiveAction(e.target.value)}
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white resize-none"
                placeholder="Recommended action to prevent recurrence..."
              />
            </div>
            
          <SMButton
            variant="primary"
            className="w-full"
            onClick={addFinding}
            disabled={!selectedCategory || !selectedSubcategory || !specificCause}
          >
            Add Finding
          </SMButton>
          </div>
        </motion.div>
      )}

      {/* Findings List */}
      {findings.length > 0 && (
        <SMCard className="p-5">
          <h4 className="font-semibold text-brand-900 dark:text-white mb-4 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Identified Root Causes ({findings.length})
          </h4>
          
          <div className="space-y-3">
            {findings.map((finding, idx) => {
              const color = getCategoryColor(finding.category);
              return (
                <div key={finding.id} className={`p-4 bg-${color}-50 dark:bg-${color}-900/20 rounded-xl border border-${color}-100 dark:border-${color}-800`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`px-2 py-0.5 bg-${color}-100 dark:bg-${color}-800 text-${color}-700 dark:text-${color}-300 rounded-full text-xs font-medium`}>
                          {finding.category}
                        </span>
                        <span className="text-xs text-surface-500 dark:text-surface-400">›</span>
                        <span className="text-xs text-surface-600 dark:text-surface-300">{finding.subcategory}</span>
                      </div>
                      {finding.genericCause && (
                        <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Generic: {finding.genericCause}</p>
                      )}
                      <p className="text-sm font-medium text-brand-900 dark:text-white">{finding.specificCause}</p>
                      {finding.correctiveAction && (
                        <p className="text-xs text-surface-500 dark:text-surface-400 mt-2">
                          <span className="font-medium">Action:</span> {finding.correctiveAction}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => removeFinding(finding.id)}
                      className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </SMCard>
      )}
    </div>
  );
};

export default TapRootAnalysis;
