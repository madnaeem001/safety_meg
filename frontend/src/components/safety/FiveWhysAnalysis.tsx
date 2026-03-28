import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, Plus, Trash2, Edit2, Check, X, Sparkles,
  ArrowDown, Lightbulb, Target, AlertTriangle, FileText, Loader2
} from 'lucide-react';
import { aiAssistantService } from '../../api/services/apiService';
import { SMCard, SMButton } from '../../components/ui';

interface WhyStep {
  id: string;
  question: string;
  answer: string;
  isRootCause: boolean;
}

interface FiveWhysAnalysisProps {
  initialProblem: string;
  onProblemChange?: (problem: string) => void;
  whys?: WhyStep[];
  onWhysChange?: (whys: WhyStep[]) => void;
  readonly?: boolean;
}

export const FiveWhysAnalysis: React.FC<FiveWhysAnalysisProps> = ({
  initialProblem,
  onProblemChange,
  whys: initialWhys,
  onWhysChange,
  readonly = false
}) => {
  const [problem, setProblem] = useState(initialProblem);
  const [whys, setWhys] = useState<WhyStep[]>(initialWhys || []);
  const [editingProblem, setEditingProblem] = useState(false);
  const [tempProblem, setTempProblem] = useState(problem);
  const [editingWhy, setEditingWhy] = useState<string | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const updateWhys = (newWhys: WhyStep[]) => {
    setWhys(newWhys);
    onWhysChange?.(newWhys);
  };

  const addWhy = () => {
    if (whys.length >= 7) return; // Allow up to 7 whys
    
    const newWhy: WhyStep = {
      id: Date.now().toString(),
      question: `Why #${whys.length + 1}`,
      answer: '',
      isRootCause: false
    };
    
    updateWhys([...whys, newWhy]);
    setEditingWhy(newWhy.id);
  };

  const updateWhy = (id: string, updates: Partial<WhyStep>) => {
    const updated = whys.map(w => w.id === id ? { ...w, ...updates } : w);
    updateWhys(updated);
  };

  const removeWhy = (id: string) => {
    updateWhys(whys.filter(w => w.id !== id));
  };

  const markAsRootCause = (id: string) => {
    const updated = whys.map(w => ({
      ...w,
      isRootCause: w.id === id ? !w.isRootCause : false
    }));
    updateWhys(updated);
  };

  const getAIPrompt = () => {
    const whysText = whys.map((w, i) => 
      `Why #${i + 1}: ${w.answer || '[Not answered]'}${w.isRootCause ? ' ← ROOT CAUSE' : ''}`
    ).join('\n');

    return `Analyze this 5 Whys Root Cause Analysis:

PROBLEM STATEMENT:
${problem}

WHY CHAIN:
${whysText || 'No whys documented yet'}

IDENTIFIED ROOT CAUSE:
${whys.find(w => w.isRootCause)?.answer || 'Not yet identified'}

Please provide:
1. Validation of the root cause identification
2. Alternative root causes to consider
3. Recommended countermeasures (immediate, short-term, long-term)
4. Verification methods to confirm root cause
5. Preventive measures to avoid recurrence
6. System-level improvements to address underlying issues`;
  };

  const rootCause = whys.find(w => w.isRootCause);

  return (
    <SMCard>
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <HelpCircle className="w-5 h-5" />
          5 Whys Analysis
        </h3>
        <p className="text-amber-100 text-sm">Iterative Root Cause Identification</p>
      </div>

      <div className="p-4 space-y-4">
        {/* Problem Statement */}
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-red-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              PROBLEM STATEMENT
            </span>
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
              <textarea
                value={tempProblem}
                onChange={(e) => setTempProblem(e.target.value)}
                className="flex-1 px-3 py-2 border border-red-300 rounded-lg text-sm resize-none"
                rows={2}
                placeholder="Clearly describe the problem..."
                autoFocus
              />
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => { 
                    setProblem(tempProblem); 
                    onProblemChange?.(tempProblem);
                    setEditingProblem(false); 
                  }}
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
            </div>
          ) : (
            <p className="text-red-800 font-medium">
              {problem || 'Click edit to define the problem'}
            </p>
          )}
        </div>

        {/* Why Chain */}
        <div className="space-y-3">
          {whys.map((why, index) => (
            <motion.div
              key={why.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {index > 0 && (
                <div className="flex justify-center py-2">
                  <ArrowDown className="w-5 h-5 text-surface-400" />
                </div>
              )}
              
              <div className={`border-2 rounded-xl p-4 ${
                why.isRootCause 
                  ? 'border-emerald-400 bg-emerald-50' 
                  : 'border-surface-200 bg-surface-50'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                      why.isRootCause 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-amber-500 text-white'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`font-semibold ${
                      why.isRootCause ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      Why #{index + 1}
                    </span>
                    {why.isRootCause && (
                      <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-bold rounded-full flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        ROOT CAUSE
                      </span>
                    )}
                  </div>
                  
                  {!readonly && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => markAsRootCause(why.id)}
                        className={`p-1.5 rounded transition-colors ${
                          why.isRootCause 
                            ? 'bg-emerald-200 text-emerald-700' 
                            : 'hover:bg-surface-200 text-surface-500'
                        }`}
                        title="Mark as root cause"
                      >
                        <Target className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeWhy(why.id)}
                        className="p-1.5 hover:bg-red-100 rounded text-surface-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {editingWhy === why.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={why.answer}
                      onChange={(e) => updateWhy(why.id, { answer: e.target.value })}
                      className="w-full px-3 py-2 border border-surface-300 rounded-lg text-sm resize-none"
                      rows={2}
                      placeholder={`Why did ${index === 0 ? 'the problem' : 'this'} happen?`}
                      autoFocus
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setEditingWhy(null)}
                        className="px-3 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <div 
                    onClick={() => !readonly && setEditingWhy(why.id)}
                    className={`p-3 rounded-lg ${
                      why.answer 
                        ? 'bg-white border border-surface-200' 
                        : 'bg-surface-100 border-2 border-dashed border-surface-300'
                    } ${!readonly ? 'cursor-pointer hover:border-brand-300' : ''}`}
                  >
                    <p className={why.answer ? 'text-surface-700' : 'text-surface-400 text-sm'}>
                      {why.answer || 'Click to add answer...'}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {/* Add Why Button */}
          {!readonly && whys.length < 7 && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={addWhy}
              className="w-full py-3 border-2 border-dashed border-surface-300 rounded-xl text-surface-500 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Why #{whys.length + 1}
            </motion.button>
          )}
        </div>

        {/* Root Cause Summary */}
        {rootCause && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border-2 border-emerald-200 rounded-xl p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <span className="font-bold text-emerald-700">Identified Root Cause</span>
            </div>
            <p className="text-emerald-800">{rootCause.answer}</p>
          </motion.div>
        )}

        {/* Tips */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-amber-700 space-y-1">
              <p className="font-semibold">Tips for effective 5 Whys:</p>
              <ul className="list-disc list-inside space-y-0.5 text-amber-600">
                <li>Focus on process and systems, not people</li>
                <li>Base answers on facts and data</li>
                <li>Usually 5 whys is enough, but use more if needed</li>
                <li>The root cause should be actionable</li>
                <li>Verify root cause before implementing solutions</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI Analysis Button */}
        <SMButton
          type="button"
          disabled={aiLoading}
          onClick={async () => {
            setAiLoading(true);
            setAiError(null);
            setAiSuggestions([]);
            try {
              const res = await aiAssistantService.getSuggestions({
                industry: 'Safety',
                category: 'Root Cause Analysis',
                checklistItems: [problem, ...whys.map(w => w.answer).filter(Boolean)],
              });
              setAiSuggestions(res.data?.suggestions ?? []);
            } catch {
              setAiError('AI analysis unavailable. Try again.');
            } finally {
              setAiLoading(false);
            }
          }}
          className="w-full"
          loading={aiLoading}
          leftIcon={<Sparkles className="w-4 h-4" />}
        >
          {aiLoading ? 'Analysing...' : 'AI Analyse Root Causes'}
        </SMButton>
        {aiError && (
          <p className="text-xs text-red-400 text-center">{aiError}</p>
        )}
        {aiSuggestions.length > 0 && (
          <div className="p-3 rounded-xl bg-amber-500 border border-amber-500 space-y-2">
            <p className="text-[10px] font-bold text-white uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Root Cause Suggestions — click to add as a why
            </p>
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const newWhy: WhyStep = { id: Date.now().toString(), question: `Why #${whys.length + 1}`, answer: s, isRootCause: i === aiSuggestions.length - 1 };
                  updateWhys([...whys, newWhy]);
                  setAiSuggestions([]);
                }}
                className="w-full text-left px-3 py-2 rounded-lg bg-white/80 border border-amber-300/40 text-xs text-surface-900 hover:bg-amber-50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-surface-500">Analysis Progress</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-2 bg-surface-200 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all ${
                  rootCause ? 'bg-emerald-500' : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min((whys.filter(w => w.answer).length / 5) * 100, 100)}%` }}
              />
            </div>
            <span className={`font-medium ${rootCause ? 'text-emerald-600' : 'text-amber-600'}`}>
              {rootCause ? 'Complete' : `${whys.filter(w => w.answer).length}/5`}
            </span>
          </div>
        </div>
      </div>
    </SMCard>
  );
};

export default FiveWhysAnalysis;
