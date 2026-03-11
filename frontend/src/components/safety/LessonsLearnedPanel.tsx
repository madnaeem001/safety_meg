import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, Plus, Trash2, Edit2, Check, X, Sparkles,
  Lightbulb, Users, Target, Shield, AlertTriangle, 
  CheckCircle2, Clock, User, FileText, Loader2
} from 'lucide-react';
import { aiAssistantService } from '../../api/services/apiService';

interface LessonLearned {
  id: string;
  category: 'what_went_wrong' | 'what_went_well' | 'improvement' | 'prevention';
  description: string;
  recommendation: string;
  priority: 'high' | 'medium' | 'low';
  responsible?: string;
  dueDate?: string;
  status: 'identified' | 'in_progress' | 'implemented' | 'verified';
}

interface CorrectiveAction {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term' | 'systemic';
  description: string;
  responsible: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'verified';
  verificationMethod?: string;
  completedDate?: string;
}

interface LessonsLearnedProps {
  lessons?: LessonLearned[];
  onLessonsChange?: (lessons: LessonLearned[]) => void;
  correctiveActions?: CorrectiveAction[];
  onActionsChange?: (actions: CorrectiveAction[]) => void;
  readonly?: boolean;
  incidentSummary?: string;
}

const LESSON_CATEGORIES = [
  { id: 'what_went_wrong', label: 'What Went Wrong', icon: AlertTriangle, color: 'text-red-500 bg-red-50' },
  { id: 'what_went_well', label: 'What Went Well', icon: CheckCircle2, color: 'text-emerald-500 bg-emerald-50' },
  { id: 'improvement', label: 'Areas for Improvement', icon: Target, color: 'text-amber-500 bg-amber-50' },
  { id: 'prevention', label: 'Prevention Strategies', icon: Shield, color: 'text-blue-500 bg-blue-50' }
];

const ACTION_TYPES = [
  { id: 'immediate', label: 'Immediate (24-48h)', color: 'bg-red-500' },
  { id: 'short_term', label: 'Short-term (1-2 weeks)', color: 'bg-orange-500' },
  { id: 'long_term', label: 'Long-term (1-3 months)', color: 'bg-blue-500' },
  { id: 'systemic', label: 'Systemic (3+ months)', color: 'bg-purple-500' }
];

export const LessonsLearnedPanel: React.FC<LessonsLearnedProps> = ({
  lessons: initialLessons = [],
  onLessonsChange,
  correctiveActions: initialActions = [],
  onActionsChange,
  readonly = false,
  incidentSummary = ''
}) => {
  const [lessons, setLessons] = useState<LessonLearned[]>(initialLessons);
  const [actions, setActions] = useState<CorrectiveAction[]>(initialActions);
  const [activeTab, setActiveTab] = useState<'lessons' | 'actions'>('lessons');
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [showAddAction, setShowAddAction] = useState(false);
  const [newLesson, setNewLesson] = useState<Partial<LessonLearned>>({ category: 'what_went_wrong', priority: 'medium', status: 'identified' });
  const [newAction, setNewAction] = useState<Partial<CorrectiveAction>>({ type: 'immediate', status: 'pending' });
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [aiError, setAiError] = useState<string | null>(null);

  const updateLessons = (updated: LessonLearned[]) => {
    setLessons(updated);
    onLessonsChange?.(updated);
  };

  const updateActions = (updated: CorrectiveAction[]) => {
    setActions(updated);
    onActionsChange?.(updated);
  };

  const addLesson = () => {
    if (!newLesson.description) return;
    const lesson: LessonLearned = {
      id: Date.now().toString(),
      category: newLesson.category as LessonLearned['category'],
      description: newLesson.description || '',
      recommendation: newLesson.recommendation || '',
      priority: newLesson.priority as LessonLearned['priority'],
      responsible: newLesson.responsible,
      dueDate: newLesson.dueDate,
      status: 'identified'
    };
    updateLessons([...lessons, lesson]);
    setNewLesson({ category: 'what_went_wrong', priority: 'medium', status: 'identified' });
    setShowAddLesson(false);
  };

  const addAction = () => {
    if (!newAction.description || !newAction.responsible || !newAction.dueDate) return;
    const action: CorrectiveAction = {
      id: Date.now().toString(),
      type: newAction.type as CorrectiveAction['type'],
      description: newAction.description || '',
      responsible: newAction.responsible || '',
      dueDate: newAction.dueDate || '',
      status: 'pending',
      verificationMethod: newAction.verificationMethod
    };
    updateActions([...actions, action]);
    setNewAction({ type: 'immediate', status: 'pending' });
    setShowAddAction(false);
  };

  const updateLessonStatus = (id: string, status: LessonLearned['status']) => {
    updateLessons(lessons.map(l => l.id === id ? { ...l, status } : l));
  };

  const updateActionStatus = (id: string, status: CorrectiveAction['status']) => {
    updateActions(actions.map(a => a.id === id ? { 
      ...a, 
      status,
      completedDate: status === 'completed' ? new Date().toISOString().split('T')[0] : a.completedDate
    } : a));
  };

  const deleteLesson = (id: string) => updateLessons(lessons.filter(l => l.id !== id));
  const deleteAction = (id: string) => updateActions(actions.filter(a => a.id !== id));

  const getAIPrompt = () => {
    const lessonsText = LESSON_CATEGORIES.map(cat => {
      const catLessons = lessons.filter(l => l.category === cat.id);
      if (catLessons.length === 0) return '';
      return `${cat.label}:\n${catLessons.map(l => `  - ${l.description} (${l.priority} priority)`).join('\n')}`;
    }).filter(Boolean).join('\n\n');

    const actionsText = ACTION_TYPES.map(type => {
      const typeActions = actions.filter(a => a.type === type.id);
      if (typeActions.length === 0) return '';
      return `${type.label}:\n${typeActions.map(a => `  - ${a.description} [${a.status}] - ${a.responsible}`).join('\n')}`;
    }).filter(Boolean).join('\n\n');

    return `Analyze this Lessons Learned and Corrective Actions documentation:

INCIDENT SUMMARY:
${incidentSummary || 'Not provided'}

LESSONS LEARNED:
${lessonsText || 'No lessons documented yet'}

CORRECTIVE ACTIONS:
${actionsText || 'No actions documented yet'}

Please provide:
1. Assessment of lessons learned completeness
2. Additional lessons that should be captured
3. Evaluation of corrective action effectiveness
4. Recommended additional corrective actions
5. Systemic improvements to prevent recurrence
6. Metrics to track improvement
7. Training or communication recommendations`;
  };

  const completedActions = actions.filter(a => a.status === 'completed' || a.status === 'verified').length;
  const progressPercent = actions.length > 0 ? (completedActions / actions.length) * 100 : 0;

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-4">
        <h3 className="font-bold text-white flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Lessons Learned & Corrective Actions
        </h3>
        <p className="text-emerald-100 text-sm">Document insights and track remediation</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        <button
          onClick={() => setActiveTab('lessons')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'lessons' 
              ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' 
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Lightbulb className="w-4 h-4" />
          Lessons ({lessons.length})
        </button>
        <button
          onClick={() => setActiveTab('actions')}
          className={`flex-1 px-4 py-3 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'actions' 
              ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50' 
              : 'text-surface-500 hover:text-surface-700'
          }`}
        >
          <Target className="w-4 h-4" />
          Actions ({actions.length})
        </button>
      </div>

      <div className="p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'lessons' ? (
            <motion.div
              key="lessons"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-4"
            >
              {/* Lessons by category */}
              {LESSON_CATEGORIES.map(cat => {
                const Icon = cat.icon;
                const catLessons = lessons.filter(l => l.category === cat.id);
                
                return (
                  <div key={cat.id} className={`rounded-xl p-3 ${cat.color.split(' ')[1]}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={`w-4 h-4 ${cat.color.split(' ')[0]}`} />
                      <span className={`font-semibold text-sm ${cat.color.split(' ')[0]}`}>{cat.label}</span>
                      <span className="text-xs text-surface-500">({catLessons.length})</span>
                    </div>
                    
                    <div className="space-y-2">
                      {catLessons.map(lesson => (
                        <div key={lesson.id} className="bg-white rounded-lg p-3 border border-surface-200">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-surface-700">{lesson.description}</p>
                              {lesson.recommendation && (
                                <p className="text-xs text-surface-500 mt-1">
                                  <span className="font-medium">Recommendation:</span> {lesson.recommendation}
                                </p>
                              )}
                            </div>
                            {!readonly && (
                              <button
                                onClick={() => deleteLesson(lesson.id)}
                                className="p-1 hover:bg-red-100 rounded text-surface-400 hover:text-red-500"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              lesson.priority === 'high' ? 'bg-red-100 text-red-700' :
                              lesson.priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {lesson.priority} priority
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              lesson.status === 'verified' ? 'bg-emerald-100 text-emerald-700' :
                              lesson.status === 'implemented' ? 'bg-blue-100 text-blue-700' :
                              lesson.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                              'bg-surface-100 text-surface-600'
                            }`}>
                              {lesson.status.replace('_', ' ')}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add lesson */}
              {!readonly && (
                <AnimatePresence>
                  {showAddLesson ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-2 border-dashed border-brand-300 rounded-xl p-4 space-y-3"
                    >
                      <select
                        value={newLesson.category}
                        onChange={(e) => setNewLesson({ ...newLesson, category: e.target.value as LessonLearned['category'] })}
                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm"
                      >
                        {LESSON_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                      <textarea
                        value={newLesson.description || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, description: e.target.value })}
                        placeholder="Describe the lesson learned..."
                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm resize-none"
                        rows={2}
                      />
                      <textarea
                        value={newLesson.recommendation || ''}
                        onChange={(e) => setNewLesson({ ...newLesson, recommendation: e.target.value })}
                        placeholder="Recommendation (optional)..."
                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <select
                          value={newLesson.priority}
                          onChange={(e) => setNewLesson({ ...newLesson, priority: e.target.value as LessonLearned['priority'] })}
                          className="flex-1 px-3 py-2 border border-surface-200 rounded-lg text-sm"
                        >
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                        <button onClick={addLesson} className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
                          Add
                        </button>
                        <button onClick={() => setShowAddLesson(false)} className="px-4 py-2 bg-surface-200 rounded-lg text-sm">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setShowAddLesson(true)}
                      className="w-full py-3 border-2 border-dashed border-surface-300 rounded-xl text-surface-500 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Lesson Learned
                    </button>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="actions"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-4"
            >
              {/* Progress */}
              <div className="bg-surface-50 rounded-xl p-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-surface-600">Completion Progress</span>
                  <span className="font-bold text-brand-900">{completedActions}/{actions.length} completed</span>
                </div>
                <div className="h-3 bg-surface-200 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercent}%` }}
                    className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full"
                  />
                </div>
              </div>

              {/* Actions by type */}
              {ACTION_TYPES.map(type => {
                const typeActions = actions.filter(a => a.type === type.id);
                if (typeActions.length === 0 && readonly) return null;
                
                return (
                  <div key={type.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <div className={`w-3 h-3 rounded-full ${type.color}`} />
                      <span className="font-semibold text-sm text-surface-700">{type.label}</span>
                    </div>
                    
                    <div className="space-y-2 pl-5">
                      {typeActions.map(action => (
                        <div key={action.id} className={`rounded-lg p-3 border ${
                          action.status === 'verified' ? 'bg-emerald-50 border-emerald-200' :
                          action.status === 'completed' ? 'bg-blue-50 border-blue-200' :
                          'bg-white border-surface-200'
                        }`}>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-sm text-surface-700">{action.description}</p>
                              <div className="flex items-center gap-3 mt-2 text-xs text-surface-500">
                                <span className="flex items-center gap-1">
                                  <User className="w-3 h-3" />
                                  {action.responsible}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Due: {action.dueDate}
                                </span>
                              </div>
                            </div>
                            {!readonly && (
                              <div className="flex items-center gap-1">
                                <select
                                  value={action.status}
                                  onChange={(e) => updateActionStatus(action.id, e.target.value as CorrectiveAction['status'])}
                                  className="text-xs px-2 py-1 border border-surface-200 rounded-lg"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="in_progress">In Progress</option>
                                  <option value="completed">Completed</option>
                                  <option value="verified">Verified</option>
                                </select>
                                <button
                                  onClick={() => deleteAction(action.id)}
                                  className="p-1 hover:bg-red-100 rounded text-surface-400 hover:text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Add action */}
              {!readonly && (
                <AnimatePresence>
                  {showAddAction ? (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-2 border-dashed border-brand-300 rounded-xl p-4 space-y-3"
                    >
                      <select
                        value={newAction.type}
                        onChange={(e) => setNewAction({ ...newAction, type: e.target.value as CorrectiveAction['type'] })}
                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm"
                      >
                        {ACTION_TYPES.map(type => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                      <textarea
                        value={newAction.description || ''}
                        onChange={(e) => setNewAction({ ...newAction, description: e.target.value })}
                        placeholder="Describe the corrective action..."
                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm resize-none"
                        rows={2}
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={newAction.responsible || ''}
                          onChange={(e) => setNewAction({ ...newAction, responsible: e.target.value })}
                          placeholder="Responsible person"
                          className="px-3 py-2 border border-surface-200 rounded-lg text-sm"
                        />
                        <input
                          type="date"
                          value={newAction.dueDate || ''}
                          onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                          className="px-3 py-2 border border-surface-200 rounded-lg text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        value={newAction.verificationMethod || ''}
                        onChange={(e) => setNewAction({ ...newAction, verificationMethod: e.target.value })}
                        placeholder="Verification method (optional)"
                        className="w-full px-3 py-2 border border-surface-200 rounded-lg text-sm"
                      />
                      <div className="flex gap-2">
                        <button onClick={addAction} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium">
                          Add Action
                        </button>
                        <button onClick={() => setShowAddAction(false)} className="px-4 py-2 bg-surface-200 rounded-lg text-sm">
                          Cancel
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    <button
                      onClick={() => setShowAddAction(true)}
                      className="w-full py-3 border-2 border-dashed border-surface-300 rounded-xl text-surface-500 hover:border-brand-400 hover:text-brand-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Add Corrective Action
                    </button>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Analysis Button */}
        <button
          type="button"
          disabled={aiLoading}
          onClick={async () => {
            setAiLoading(true);
            setAiError(null);
            setAiSuggestions([]);
            try {
              const res = await aiAssistantService.getSuggestions({
                industry: 'Safety',
                category: 'Lessons Learned',
                checklistItems: [
                  incidentSummary,
                  ...lessons.map(l => l.description).filter(Boolean),
                  ...actions.map(a => a.description).filter(Boolean),
                ],
              });
              setAiSuggestions(res.data?.suggestions ?? []);
            } catch {
              setAiError('AI analysis unavailable. Please try again.');
            } finally {
              setAiLoading(false);
            }
          }}
          className="w-full mt-4 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:from-emerald-600 hover:to-teal-600 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {aiLoading ? 'Analysing...' : 'AI Analyse & Suggest'}
        </button>
        {aiError && (
          <p className="text-xs text-red-600 text-center mt-2">{aiError}</p>
        )}
        {aiSuggestions.length > 0 && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
            <p className="text-xs font-semibold text-emerald-700">AI Recommendations — click to add as a lesson:</p>
            {aiSuggestions.map((s, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  const lesson: LessonLearned = {
                    id: Date.now().toString() + i,
                    category: 'improvement',
                    description: s,
                    recommendation: '',
                    priority: 'medium',
                    status: 'identified',
                  };
                  updateLessons([...lessons, lesson]);
                }}
                className="w-full text-left text-xs px-3 py-2 bg-white border border-emerald-200 rounded-lg text-emerald-800 hover:bg-emerald-100 transition-colors"
              >
                + {s}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LessonsLearnedPanel;
