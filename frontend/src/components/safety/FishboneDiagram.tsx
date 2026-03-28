import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Trash2, Edit2, Check, X, Sparkles, Download,
  User, Settings, FileText, Building2, Ruler, Thermometer, Loader2
} from 'lucide-react';
import { aiAssistantService } from '../../api/services/apiService';
import { SMCard, SMButton } from '../../components/ui';

interface FishboneCause {
  id: string;
  text: string;
}

interface FishboneCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  causes: FishboneCause[];
}

const DEFAULT_CATEGORIES: FishboneCategory[] = [
  { id: 'man', name: 'Man (People)', icon: <User className="w-4 h-4" />, color: 'bg-blue-500', causes: [] },
  { id: 'machine', name: 'Machine (Equipment)', icon: <Settings className="w-4 h-4" />, color: 'bg-orange-500', causes: [] },
  { id: 'method', name: 'Method (Process)', icon: <FileText className="w-4 h-4" />, color: 'bg-green-500', causes: [] },
  { id: 'material', name: 'Material', icon: <Building2 className="w-4 h-4" />, color: 'bg-purple-500', causes: [] },
  { id: 'measurement', name: 'Measurement', icon: <Ruler className="w-4 h-4" />, color: 'bg-red-500', causes: [] },
  { id: 'environment', name: 'Environment', icon: <Thermometer className="w-4 h-4" />, color: 'bg-teal-500', causes: [] }
];

interface FishboneDiagramProps {
  problem: string;
  onProblemChange: (problem: string) => void;
  categories?: FishboneCategory[];
  onCategoriesChange?: (categories: FishboneCategory[]) => void;
  readonly?: boolean;
}

export const FishboneDiagram: React.FC<FishboneDiagramProps> = ({
  problem,
  onProblemChange,
  categories: initialCategories,
  onCategoriesChange,
  readonly = false
}) => {
  const [categories, setCategories] = useState<FishboneCategory[]>(initialCategories || DEFAULT_CATEGORIES);
  const [editingProblem, setEditingProblem] = useState(false);
  const [tempProblem, setTempProblem] = useState(problem);
  const [newCause, setNewCause] = useState<{ categoryId: string; text: string } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const updateCategories = (newCategories: FishboneCategory[]) => {
    setCategories(newCategories);
    onCategoriesChange?.(newCategories);
  };

  const addCause = (categoryId: string) => {
    if (!newCause?.text.trim()) return;
    
    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          causes: [...cat.causes, { id: Date.now().toString(), text: newCause.text }]
        };
      }
      return cat;
    });
    
    updateCategories(updated);
    setNewCause(null);
  };

  const removeCause = (categoryId: string, causeId: string) => {
    const updated = categories.map(cat => {
      if (cat.id === categoryId) {
        return {
          ...cat,
          causes: cat.causes.filter(c => c.id !== causeId)
        };
      }
      return cat;
    });
    updateCategories(updated);
  };

  const getAIPrompt = () => {
    const causesText = categories
      .filter(cat => cat.causes.length > 0)
      .map(cat => `${cat.name}:\n${cat.causes.map(c => `  - ${c.text}`).join('\n')}`)
      .join('\n\n');

    return `Analyze this Fishbone (Ishikawa) Diagram for root cause analysis:

PROBLEM: ${problem}

IDENTIFIED CAUSES:
${causesText || 'No causes identified yet'}

Please provide:
1. Analysis of the most significant contributing factors
2. Potential root causes not yet identified
3. Recommended corrective actions prioritized by impact
4. Preventive measures to address systemic issues
5. Cross-category relationships between causes`;
  };

  return (
    <SMCard>
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12h16M4 12l4-4M4 12l4 4M20 12l-4-4M20 12l-4 4" />
          </svg>
          Fishbone Diagram (Ishikawa)
        </h3>
        <p className="text-indigo-100 text-sm">Root Cause Analysis - 6M Method</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Problem Statement */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-red-700">PROBLEM / EFFECT</span>
            {!readonly && !editingProblem && (
              <button
                onClick={() => { setEditingProblem(true); setTempProblem(problem); }}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Edit2 className="w-4 h-4 text-red-600" />
              </button>
            )}
          </div>
          {editingProblem ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={tempProblem}
                onChange={(e) => setTempProblem(e.target.value)}
                className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-sm"
                placeholder="Describe the problem..."
                autoFocus
              />
              <button
                onClick={() => { onProblemChange(tempProblem); setEditingProblem(false); }}
                className="p-2 bg-red-600 text-white rounded-lg"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={() => setEditingProblem(false)}
                className="p-2 bg-surface-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <p className="text-red-800 font-medium">
              {problem || 'Click edit to define the problem'}
            </p>
          )}
        </div>

        {/* Visual Fishbone */}
        <div className="relative py-8 overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Main spine */}
            <div className="absolute left-8 right-8 top-1/2 h-1 bg-surface-400 transform -translate-y-1/2" />
            
            {/* Problem head */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 w-24 h-16 bg-red-500 rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold text-center px-1">EFFECT</span>
            </div>

            {/* Categories - 3 top, 3 bottom */}
            <div className="grid grid-cols-3 gap-4 mb-8">
              {categories.slice(0, 3).map((cat, idx) => (
                <CategoryBranch
                  key={cat.id}
                  category={cat}
                  position="top"
                  index={idx}
                  readonly={readonly}
                  newCause={newCause}
                  setNewCause={setNewCause}
                  addCause={addCause}
                  removeCause={removeCause}
                />
              ))}
            </div>
            
            <div className="h-8" /> {/* Spacer for spine */}
            
            <div className="grid grid-cols-3 gap-4 mt-8">
              {categories.slice(3, 6).map((cat, idx) => (
                <CategoryBranch
                  key={cat.id}
                  category={cat}
                  position="bottom"
                  index={idx}
                  readonly={readonly}
                  newCause={newCause}
                  setNewCause={setNewCause}
                  addCause={addCause}
                  removeCause={removeCause}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-surface-50 rounded-xl p-4">
          <h4 className="font-semibold text-brand-900 mb-2">Causes Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 text-sm">
                <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                <span className="text-surface-600">{cat.name}:</span>
                <span className="font-semibold text-brand-900">{cat.causes.length}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 pt-2 border-t border-surface-200">
            <span className="text-sm text-surface-600">Total Identified Causes: </span>
            <span className="font-bold text-brand-900">
              {categories.reduce((sum, cat) => sum + cat.causes.length, 0)}
            </span>
          </div>
        </div>

        {/* AI Analysis */}
        <SMButton
          type="button"
          disabled={aiLoading}
          onClick={async () => {
            setAiLoading(true);
            setAiError(null);
            setAiSuggestions([]);
            try {
              const allCauses = categories.flatMap(cat =>
                cat.causes.map(c => `${cat.name}: ${c.text}`)
              );
              const res = await aiAssistantService.getSuggestions({
                industry: 'Safety',
                category: 'Fishbone Root Cause Analysis',
                checklistItems: [problem, ...allCauses],
              });
              setAiSuggestions(res.data?.suggestions ?? []);
            } catch {
              setAiError('AI analysis unavailable. Please try again.');
            } finally {
              setAiLoading(false);
            }
          }}
          className="w-full"
          loading={aiLoading}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          {aiLoading ? 'Analysing...' : 'AI Analyse Causes'}
        </SMButton>
        {aiError && (
          <p className="text-xs text-red-600 text-center mt-2">{aiError}</p>
        )}
        {aiSuggestions.length > 0 && (
          <div className="mt-3 p-3 bg-purple-600 border border-purple-600 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-white">AI Suggestions — click to add as a cause:</p>
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const firstCat = categories[0];
                  if (!firstCat) return;
                  const updated = categories.map((cat, idx) =>
                    idx === 0
                      ? { ...cat, causes: [...cat.causes, { id: Date.now().toString() + i, text: s }] }
                      : cat
                  );
                  updateCategories(updated);
                }}
                className="w-full text-left text-xs px-3 py-2 bg-white border border-purple-200 rounded-lg text-purple-800 hover:bg-purple-100 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </SMCard>
  );
};

const CategoryBranch: React.FC<{
  category: FishboneCategory;
  position: 'top' | 'bottom';
  index: number;
  readonly: boolean;
  newCause: { categoryId: string; text: string } | null;
  setNewCause: (value: { categoryId: string; text: string } | null) => void;
  addCause: (categoryId: string) => void;
  removeCause: (categoryId: string, causeId: string) => void;
}> = ({ category, position, index, readonly, newCause, setNewCause, addCause, removeCause }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: position === 'top' ? -20 : 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className={`${position === 'bottom' ? 'mt-4' : 'mb-4'}`}
    >
      {/* Category Header */}
      <div className={`flex items-center gap-2 p-2 ${category.color} text-white rounded-lg mb-2`}>
        {category.icon}
        <span className="text-sm font-semibold">{category.name}</span>
      </div>

      {/* Causes */}
      <div className="space-y-1 pl-2 border-l-2 border-surface-200">
        {category.causes.map(cause => (
          <motion.div
            key={cause.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2 group"
          >
            <div className="w-2 h-2 bg-surface-400 rounded-full" />
            <span className="flex-1 text-xs text-surface-700">{cause.text}</span>
            {!readonly && (
              <button
                onClick={() => removeCause(category.id, cause.id)}
                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 rounded transition-opacity"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </button>
            )}
          </motion.div>
        ))}

        {/* Add cause */}
        {!readonly && (
          <>
            {newCause?.categoryId === category.id ? (
              <div className="flex gap-1 mt-2">
                <input
                  type="text"
                  value={newCause.text}
                  onChange={(e) => setNewCause({ ...newCause, text: e.target.value })}
                  onKeyDown={(e) => e.key === 'Enter' && addCause(category.id)}
                  className="flex-1 px-2 py-1 text-xs border border-surface-300 rounded"
                  placeholder="Enter cause..."
                  autoFocus
                />
                <button
                  onClick={() => addCause(category.id)}
                  className="p-1 bg-brand-600 text-white rounded"
                >
                  <Check className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setNewCause(null)}
                  className="p-1 bg-surface-200 rounded"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setNewCause({ categoryId: category.id, text: '' })}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 mt-1"
              >
                <Plus className="w-3 h-3" />
                Add cause
              </button>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
};

export default FishboneDiagram;
