import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  Target, 
  CheckCircle2, 
  AlertCircle, 
  User, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2,
  ShieldCheck,
  Zap,
  Lightbulb,
  BookOpen,
  GitBranch,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Brain,
  Layers,
  ExternalLink,
  RefreshCw,
  Wrench,
  HardHat
} from 'lucide-react';
import { SMButton, SMAlert, SMCard, SMTabs } from '../components/ui';
import { 
  hierarchyOfControls, 
  aiRiskAssessmentConfig, 
  capaRegulatoryReferences,
  type HierarchyControl,
  type RegulatoryRef
} from '../data/mockCapaControls';
import {
  useControlsHierarchy,
  useCreateInvestigation,
  useInvestigationByIncident,
  useInvestigationRcca,
  useSaveInvestigationRcca,
} from '../api/hooks/useAPIHooks';
import type { ControlHierarchyItem } from '../api/services/apiService';

// Fishbone Diagram categories
const FISHBONE_CATEGORIES = [
  { id: 'manpower', name: 'Manpower', color: 'bg-blue-500', factors: [] as string[] },
  { id: 'methods', name: 'Methods', color: 'bg-green-500', factors: [] as string[] },
  { id: 'machines', name: 'Machines', color: 'bg-orange-500', factors: [] as string[] },
  { id: 'materials', name: 'Materials', color: 'bg-purple-500', factors: [] as string[] },
  { id: 'measurements', name: 'Measurements', color: 'bg-cyan-500', factors: [] as string[] },
  { id: 'environment', name: 'Environment', color: 'bg-yellow-500', factors: [] as string[] },
];

const HIERARCHY_LEVEL_META: Array<Pick<HierarchyControl, 'level' | 'color' | 'icon'>> = [
  { level: 'elimination', color: 'bg-green-600', icon: 'XCircle' },
  { level: 'substitution', color: 'bg-emerald-500', icon: 'RefreshCw' },
  { level: 'engineering', color: 'bg-blue-500', icon: 'Wrench' },
  { level: 'administrative', color: 'bg-amber-500', icon: 'FileText' },
  { level: 'ppe', color: 'bg-red-500', icon: 'HardHat' },
];

const mapRegulatoryReference = (reference: string): RegulatoryRef => {
  const body =
    reference.startsWith('ISO')
      ? 'ISO'
      : reference.startsWith('EPA')
        ? 'EPA'
        : reference.startsWith('MSHA')
          ? 'MSHA'
          : reference.startsWith('NIOSH')
            ? 'NIOSH'
            : 'OSHA';

  return {
    body,
    code: reference,
    title: reference,
    description: reference,
  };
};

const mapHierarchyControl = (control: ControlHierarchyItem, index: number): HierarchyControl => ({
  id: `backend-hoc-${control.level}`,
  level: HIERARCHY_LEVEL_META[index]?.level ?? 'administrative',
  name: control.name,
  description: control.description,
  effectiveness: control.effectiveness,
  examples: control.examples,
  regulatoryReferences: control.regulatoryReferences.map(mapRegulatoryReference),
  color: HIERARCHY_LEVEL_META[index]?.color ?? 'bg-accent',
  icon: HIERARCHY_LEVEL_META[index]?.icon ?? 'ShieldCheck',
});

export const RootCauseCorrectiveAction = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sourceType = searchParams.get('type') || 'incident';
  const sourceId = searchParams.get('id') || 'INC-2026-001';
  const numericSourceIncidentId = /^\d+$/.test(sourceId) ? Number(sourceId) : null;

  const [activeSection, setActiveSection] = useState<string>('ai-controls');
  const [rootCauses, setRootCauses] = useState(['', '', '', '', '']);
  const [fishboneCategories, setFishboneCategories] = useState(FISHBONE_CATEGORIES);
  const [correctiveActions, setCorrectiveActions] = useState([
    { action: '', assignedTo: '', dueDate: '', status: 'Pending' }
  ]);
  const [preventiveMeasures, setPreventiveMeasures] = useState(['']);
  const [lessonsLearned, setLessonsLearned] = useState({
    whatHappened: '',
    whyItMatters: '',
    keyTakeaways: '',
    recommendations: ''
  });

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasHydratedFromBackend, setHasHydratedFromBackend] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { data: controlsHierarchyData } = useControlsHierarchy();
  const { data: investigationData, refetch: refetchInvestigation } = useInvestigationByIncident(numericSourceIncidentId);
  const { data: investigationRcca } = useInvestigationRcca(investigationData?.id ?? null);
  const { mutate: createInvestigation, loading: creatingInvestigation } = useCreateInvestigation();
  const { mutate: saveInvestigationRcca, loading: savingInvestigationRcca } = useSaveInvestigationRcca();
  const hierarchyControls = controlsHierarchyData?.length
    ? controlsHierarchyData.map(mapHierarchyControl)
    : hierarchyOfControls;
  const isPersisting = creatingInvestigation || savingInvestigationRcca;

  useEffect(() => {
    if (!investigationRcca || hasHydratedFromBackend) {
      return;
    }

    const normalizedRootCauses = [...investigationRcca.rootCauses];
    while (normalizedRootCauses.length < 5) {
      normalizedRootCauses.push('');
    }

    setRootCauses(normalizedRootCauses);
    setCorrectiveActions(
      investigationRcca.correctiveActions.length > 0
        ? investigationRcca.correctiveActions
        : [{ action: '', assignedTo: '', dueDate: '', status: 'Pending' }]
    );
    setPreventiveMeasures(
      investigationRcca.preventiveMeasures.length > 0 ? investigationRcca.preventiveMeasures : ['']
    );
    setLessonsLearned({
      whatHappened: investigationRcca.lessonsLearned.whatHappened || '',
      whyItMatters: investigationRcca.lessonsLearned.whyMatters || '',
      keyTakeaways: investigationRcca.lessonsLearned.keyTakeaways || '',
      recommendations: investigationRcca.lessonsLearned.recommendations || '',
    });
    setFishboneCategories(
      FISHBONE_CATEGORIES.map((category) => ({
        ...category,
        factors:
          investigationRcca.fishboneFactors[category.name] ||
          investigationRcca.fishboneFactors[category.id] ||
          [],
      }))
    );
    setHasHydratedFromBackend(true);
  }, [hasHydratedFromBackend, investigationRcca]);

  const handleAIAnalysis = () => {
    setIsAnalyzing(true);
    // Simulate AI analysis
    setTimeout(() => {
      setIsAnalyzing(false);
      setRootCauses([
        'Inadequate training on new equipment',
        'Fatigue due to overtime',
        'Sensor malfunction not detected',
        'Standard operating procedure outdated',
        'Lack of supervision during night shift'
      ]);
      setFishboneCategories(prev => prev.map(cat => {
        if (cat.id === 'manpower') return { ...cat, factors: ['Fatigue', 'Training gap'] };
        if (cat.id === 'machines') return { ...cat, factors: ['Sensor failure'] };
        if (cat.id === 'methods') return { ...cat, factors: ['SOP outdated'] };
        return cat;
      }));
    }, 2000);
  };

  const addFishboneFactor = (categoryId: string) => {
    setFishboneCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { ...cat, factors: [...cat.factors, ''] } : cat
    ));
  };

  const updateFishboneFactor = (categoryId: string, factorIndex: number, value: string) => {
    setFishboneCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { 
        ...cat, 
        factors: cat.factors.map((f, i) => i === factorIndex ? value : f) 
      } : cat
    ));
  };

  const removeFishboneFactor = (categoryId: string, factorIndex: number) => {
    setFishboneCategories(prev => prev.map(cat => 
      cat.id === categoryId ? { 
        ...cat, 
        factors: cat.factors.filter((_, i) => i !== factorIndex) 
      } : cat
    ));
  };

  const addPreventiveMeasure = () => setPreventiveMeasures([...preventiveMeasures, '']);
  const removePreventiveMeasure = (index: number) => setPreventiveMeasures(preventiveMeasures.filter((_, i) => i !== index));

  const addAction = () => setCorrectiveActions([...correctiveActions, { action: '', assignedTo: '', dueDate: '', status: 'Pending' }]);
  const removeAction = (index: number) => setCorrectiveActions(correctiveActions.filter((_, i) => i !== index));

  const buildRccaPayload = () => ({
    rootCauses: rootCauses.map((cause) => cause.trim()).filter(Boolean),
    whyAnalysis: Object.fromEntries(
      rootCauses
        .map((cause, index) => [`Why ${index + 1}`, cause.trim()] as const)
        .filter(([, value]) => value.length > 0)
    ),
    fishboneFactors: Object.fromEntries(
      fishboneCategories
        .map((category) => [category.name, category.factors.map((factor) => factor.trim()).filter(Boolean)] as const)
        .filter(([, factors]) => factors.length > 0)
    ),
    correctiveActions: correctiveActions
      .filter((action) => action.action.trim() && action.assignedTo.trim() && action.dueDate.trim())
      .map((action) => ({
        action: action.action.trim(),
        assignedTo: action.assignedTo.trim(),
        dueDate: action.dueDate,
        status: action.status,
      })),
    preventiveMeasures: preventiveMeasures.map((measure) => measure.trim()).filter(Boolean),
    lessonsLearned: {
      whatHappened: lessonsLearned.whatHappened.trim() || undefined,
      whyMatters: lessonsLearned.whyItMatters.trim() || undefined,
      keyTakeaways: lessonsLearned.keyTakeaways.trim() || undefined,
      recommendations: lessonsLearned.recommendations.trim() || undefined,
    },
  });

  const ensureInvestigationId = async () => {
    if (investigationData?.id) {
      return investigationData.id;
    }

    if (!numericSourceIncidentId) {
      setSaveError('Backend save requires a numeric incident id in the page URL. Open this screen from a saved incident to persist analysis.');
      return null;
    }

    const created = await createInvestigation({
      incidentId: numericSourceIncidentId,
      investigationDate: new Date().toISOString().split('T')[0],
      investigator: 'SafetyMEG Analyst',
      industry: sourceType,
      findings: lessonsLearned.whatHappened || undefined,
    });

    if (!created?.id) {
      setSaveError('Failed to create investigation record for this analysis.');
      return null;
    }

    await refetchInvestigation();
    return created.id;
  };

  const persistAnalysis = async (finalize: boolean) => {
    setSaveMessage(null);
    setSaveError(null);

    const investigationId = await ensureInvestigationId();
    if (!investigationId) {
      return;
    }

    const saved = await saveInvestigationRcca({
      investigationId,
      data: buildRccaPayload(),
    });

    if (!saved) {
      setSaveError('Failed to save analysis to the backend.');
      return;
    }

    setSaveMessage(
      finalize
        ? 'Analysis finalized and persisted to the backend investigation record.'
        : 'Draft saved to the backend investigation record.'
    );
  };

  const getSourceTitle = () => {
    switch (sourceType) {
      case 'injury': return 'Injury Incident';
      case 'vehicle': return 'Vehicle Incident';
      case 'property': return 'Property Damage';
      default: return 'Chemical Spill in Warehouse B';
    }
  };

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      <header className="sticky top-[var(--nav-height,72px)] z-40 border-b border-surface-border bg-surface-raised/90 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between">
          <div className="flex items-center gap-4">
            <SMButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-5 h-5" />} onClick={() => navigate(-1)} aria-label="Go back" />
            <div>
              <h1 className="text-xl font-bold text-text-primary">Root Cause & CAPA</h1>
              <p className="text-sm text-text-muted">Analysis, Lessons Learned & Corrective Actions</p>
            </div>
          </div>
          <SMButton
            variant="secondary"
            leftIcon={isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Brain className="w-4 h-4" />}
            onClick={handleAIAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? 'Analyzing...' : 'AI Analysis'}
          </SMButton>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-8 px-6 py-8">
        {/* Incident Reference */}
        <SMCard flat className="relative overflow-hidden rounded-[2rem] border border-primary/15 bg-gradient-to-br from-primary to-accent p-8 text-text-onAccent shadow-card">
          <div className="mb-2 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-text-onAccent/80">
            <AlertCircle className="w-4 h-4" />
            {sourceType === 'injury' ? 'Injury' : sourceType === 'vehicle' ? 'Vehicle' : 'Incident'} Reference
          </div>
          <h2 className="text-2xl font-bold mb-4">{getSourceTitle()}</h2>
          <div className="flex flex-wrap gap-6 text-sm text-white/80">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Jan 05, 2026
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Investigator: John Doe
            </div>
            <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20">
              ID: {sourceId}
            </div>
            <div className="px-3 py-1 bg-white/10 rounded-full border border-white/20">
              {investigationData?.id
                ? `Investigation #${investigationData.id} linked`
                : numericSourceIncidentId
                  ? 'Backend ready'
                  : 'Draft-only context'}
            </div>
          </div>
        </SMCard>

        {(saveMessage || saveError || (!numericSourceIncidentId && !investigationData)) && (
          <SMAlert variant={saveError ? 'danger' : saveMessage ? 'success' : 'warning'}>
            {saveError || saveMessage || 'This page can still be edited, but backend persistence needs a numeric incident id in the route context.'}
          </SMAlert>
        )}

        {/* Section Navigation */}
        <SMTabs value={activeSection} onChange={setActiveSection}>
          <SMTabs.List className="overflow-x-auto no-scrollbar gap-1 pb-1">
            {[
              { id: 'ai-controls', label: 'AI & Controls', icon: Brain },
              { id: 'regulations', label: 'Regulatory References', icon: BookOpen },
              { id: '5whys', label: '5 Whys Analysis', icon: Target },
              { id: 'fishbone', label: 'Fishbone Diagram', icon: GitBranch },
              { id: 'preventive', label: 'Preventive Measures', icon: ShieldCheck },
              { id: 'lessons', label: 'Lessons Learned', icon: Lightbulb },
              { id: 'capa', label: 'Corrective Actions', icon: CheckCircle2 },
            ].map(section => (
              <SMTabs.Trigger key={section.id} value={section.id} className="flex items-center gap-2 whitespace-nowrap">
                <section.icon className="w-4 h-4" />
                {section.label}
              </SMTabs.Trigger>
            ))}
          </SMTabs.List>
        </SMTabs>

        {/* AI & Hierarchy of Controls Section */}
        <AnimatePresence mode="wait">
          {activeSection === 'ai-controls' && (
            <motion.section
              key="ai-controls"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI Risk Assessment Panel */}
              <div className="relative overflow-hidden rounded-[2.5rem] border border-primary/15 bg-gradient-to-br from-primary via-accent to-primary p-8 text-text-onAccent shadow-card">
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute top-10 right-10 w-40 h-40 bg-white rounded-full blur-3xl" />
                  <div className="absolute bottom-10 left-10 w-32 h-32 rounded-full bg-white/30 blur-3xl" />
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center">
                      <Brain className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{aiRiskAssessmentConfig.name}</h2>
                      <p className="text-sm text-text-onAccent/80">{aiRiskAssessmentConfig.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-onAccent/70">Risk Factors Analyzed</h3>
                      <ul className="space-y-2">
                        {aiRiskAssessmentConfig.riskFactors.map((factor, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-text-onAccent/90">
                            <div className="h-1.5 w-1.5 rounded-full bg-white/70" />
                            {factor}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-text-onAccent/70">AI Capabilities</h3>
                      <ul className="space-y-2">
                        {aiRiskAssessmentConfig.aiCapabilities.map((cap, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-text-onAccent/90">
                            <Zap className="w-3 h-3 text-white/80" />
                            {cap}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hierarchy of Controls */}
              <div className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <Layers className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Hierarchy of Controls (NIOSH)</h2>
                    <p className="text-sm text-text-muted">Select controls from most effective (elimination) to least effective (PPE)</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {hierarchyControls.map((control, idx) => (
                    <div 
                      key={control.id} 
                      className="group rounded-3xl border border-surface-border bg-surface-sunken p-6 transition-all hover:border-accent/30"
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-12 h-12 ${control.color} text-white rounded-2xl flex items-center justify-center font-bold text-lg shrink-0 shadow-lg`}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-text-primary">{control.name}</h3>
                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${control.color} text-white`}>
                              {control.effectiveness}% Effective
                            </span>
                          </div>
                          <p className="mb-4 text-sm text-text-secondary">{control.description}</p>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h4 className="mb-2 text-xs font-bold uppercase text-text-muted">Examples</h4>
                              <ul className="space-y-1">
                                {control.examples.slice(0, 3).map((ex, i) => (
                                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                                    <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                    {ex}
                                  </li>
                                ))}
                              </ul>
                            </div>
                            <div>
                              <h4 className="mb-2 text-xs font-bold uppercase text-text-muted">Regulatory References</h4>
                              <ul className="space-y-1">
                                {control.regulatoryReferences.slice(0, 2).map((ref, i) => (
                                  <li key={i} className="text-xs text-text-secondary">
                                    <span className="font-bold text-accent">{ref.body}</span>: {ref.code}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Effectiveness Bar */}
                <div className="mt-8 p-4 bg-gradient-to-r from-green-50 via-yellow-50 to-red-50 rounded-2xl">
                  <div className="flex items-center justify-between text-xs font-bold mb-2">
                    <span className="text-green-700">Most Effective</span>
                    <span className="text-red-700">Least Effective</span>
                  </div>
                  <div className="h-4 rounded-full bg-gradient-to-r from-green-500 via-amber-500 to-red-500 relative">
                    <div className="absolute inset-0 flex justify-between items-center px-2">
                      {hierarchyControls.map((c, i) => (
                        <div key={i} className="w-3 h-3 bg-white rounded-full shadow border-2 border-surface-300" />
                      ))}
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between px-1 text-xs text-text-muted">
                    {hierarchyControls.map((c) => (
                      <span key={c.id}>{c.name}</span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Regulatory References Section */}
          {activeSection === 'regulations' && (
            <motion.section
              key="regulations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Regulatory References</h2>
                  <p className="text-sm text-text-muted">ISO, EPA, MSHA, NIOSH, and OSHA standards for CAPA</p>
                </div>
              </div>

              {/* Group by regulatory body */}
              {(['ISO', 'EPA', 'MSHA', 'NIOSH', 'OSHA'] as const).map(body => {
                const refs = capaRegulatoryReferences.filter(r => r.body === body);
                const bodyColors: Record<string, { bg: string; text: string; border: string }> = {
                  ISO: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
                  EPA: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
                  MSHA: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
                  NIOSH: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
                  OSHA: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' }
                };
                const colors = bodyColors[body];
                
                return (
                  <div key={body} className="mb-6">
                    <div className={`flex items-center gap-2 mb-4 px-4 py-2 ${colors.bg} ${colors.border} border rounded-xl inline-flex`}>
                      <span className={`font-bold ${colors.text}`}>{body}</span>
                      <span className="text-xs text-text-muted">({refs.length} standards)</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {refs.map(ref => (
                        <div 
                          key={ref.code} 
                          className={`p-4 rounded-2xl border ${colors.border} ${colors.bg} hover:shadow-md transition-all`}
                        >
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <span className={`font-bold text-sm ${colors.text}`}>{ref.code}</span>
                            {ref.sourceUrl && (
                              <a 
                                href={ref.sourceUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="rounded-lg p-1.5 transition-colors hover:bg-white/50"
                              >
                                <ExternalLink className="w-4 h-4 text-surface-400" />
                              </a>
                            )}
                          </div>
                          <h4 className="mb-1 text-sm font-bold text-text-primary">{ref.title}</h4>
                          <p className="line-clamp-2 text-xs text-text-secondary">{ref.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* AI Regulatory Alignment */}
              <div className="mt-8 rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/10 to-accent/10 p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Brain className="w-6 h-6 text-accent" />
                  <h3 className="font-bold text-text-primary">AI Risk Assessment Regulatory Alignment</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiRiskAssessmentConfig.regulatoryAlignment.map((ref, idx) => (
                    <div key={idx} className="flex items-start gap-3 rounded-xl bg-surface-raised/80 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/10 text-xs font-bold text-accent">
                        {ref.body}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-text-primary">{ref.code}</p>
                        <p className="text-xs text-text-secondary">{ref.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* 5 Whys Section */}
          {activeSection === '5whys' && (
            <motion.section
              key="5whys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                  <Target className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">5 Whys Analysis</h2>
                  <p className="text-sm text-text-muted">Drill down to find the root cause by asking "Why?" 5 times</p>
                </div>
              </div>

              <div className="space-y-4">
                {rootCauses.map((cause, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      cause ? 'bg-accent text-text-onAccent' : 'bg-surface-sunken text-text-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <label className="mb-2 block text-xs font-bold uppercase text-text-muted">
                        Why #{index + 1}: {index === 0 ? 'Initial Problem' : `Response to Why #${index}`}
                      </label>
                      <textarea
                        placeholder={index === 0 ? 'What happened? Describe the initial problem...' : 'Why did the previous answer occur?'}
                        className="w-full resize-none rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                        rows={2}
                        value={cause}
                        onChange={(e) => {
                          const newCauses = [...rootCauses];
                          newCauses[index] = e.target.value;
                          setRootCauses(newCauses);
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <div className="flex items-start gap-3">
                  <Lightbulb className="w-5 h-5 text-amber-600 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800 text-sm">Root Cause Identified</p>
                    <p className="text-amber-700 text-sm">The 5th "Why" typically reveals the true root cause. Focus corrective actions on this level.</p>
                  </div>
                </div>
              </div>
            </motion.section>
          )}

          {/* Fishbone Diagram Section */}
          {activeSection === 'fishbone' && (
            <motion.section
              key="fishbone"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Fishbone Diagram (Ishikawa)</h2>
                  <p className="text-sm text-text-muted">Identify contributing factors across 6 categories (6M)</p>
                </div>
              </div>

              {/* Visual Fishbone */}
              <div className="mb-8 rounded-3xl border border-surface-border bg-surface-sunken p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className="px-6 py-3 bg-red-100 text-red-700 font-bold rounded-2xl border-2 border-red-300">
                    Problem/Effect: {getSourceTitle()}
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {fishboneCategories.map(category => (
                    <div key={category.id} className="rounded-2xl border border-surface-border bg-surface-raised p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <div className={`w-3 h-3 rounded-full ${category.color}`} />
                        <span className="text-sm font-bold text-text-primary">{category.name}</span>
                        <span className="text-xs text-text-muted">({category.factors.length})</span>
                      </div>
                      <div className="space-y-2">
                        {category.factors.map((factor, idx) => (
                          <div key={idx} className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Contributing factor..."
                              value={factor}
                              onChange={(e) => updateFishboneFactor(category.id, idx, e.target.value)}
                              className="flex-1 rounded-lg border border-surface-border bg-surface-sunken px-3 py-1.5 text-sm outline-none focus:border-accent/40 focus:ring-1 focus:ring-accent/15"
                            />
                            <button
                              onClick={() => removeFishboneFactor(category.id, idx)}
                              className="p-1.5 text-surface-400 hover:text-red-500"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        ))}
                        <SMButton
                          variant="ghost"
                          size="sm"
                          leftIcon={<Plus className="w-3 h-3" />}
                          onClick={() => addFishboneFactor(category.id)}
                          className="w-full"
                        >
                          Add Factor
                        </SMButton>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* Preventive Measures Section */}
          {activeSection === 'preventive' && (
            <motion.section
              key="preventive"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Preventive Measures</h2>
                    <p className="text-sm text-text-muted">Actions to prevent recurrence</p>
                  </div>
                </div>
                <SMButton variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={addPreventiveMeasure}>
                  Add Measure
                </SMButton>
              </div>

              <div className="space-y-4">
                {preventiveMeasures.map((measure, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <textarea
                        placeholder="Describe the preventive measure to be implemented..."
                        className="w-full resize-none rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                        rows={2}
                        value={measure}
                        onChange={(e) => {
                          const newMeasures = [...preventiveMeasures];
                          newMeasures[index] = e.target.value;
                          setPreventiveMeasures(newMeasures);
                        }}
                      />
                    </div>
                    {preventiveMeasures.length > 1 && (
                      <button 
                        onClick={() => removePreventiveMeasure(index)}
                        className="p-3 text-surface-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Lessons Learned Section */}
          {activeSection === 'lessons' && (
            <motion.section
              key="lessons"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft"
            >
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-text-primary">Lessons Learned</h2>
                  <p className="text-sm text-text-muted">Capture insights to improve future safety</p>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="mb-2 block text-sm font-bold text-text-secondary">What Happened?</label>
                  <textarea
                    placeholder="Brief summary of the incident and its impact..."
                    className="w-full resize-none rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                    rows={3}
                    value={lessonsLearned.whatHappened}
                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, whatHappened: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-text-secondary">Why It Matters</label>
                  <textarea
                    placeholder="Explain the significance and potential consequences if not addressed..."
                    className="w-full resize-none rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                    rows={3}
                    value={lessonsLearned.whyItMatters}
                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, whyItMatters: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-text-secondary">Key Takeaways</label>
                  <textarea
                    placeholder="What should everyone learn from this incident?"
                    className="w-full resize-none rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                    rows={3}
                    value={lessonsLearned.keyTakeaways}
                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, keyTakeaways: e.target.value })}
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-text-secondary">Recommendations</label>
                  <textarea
                    placeholder="Specific recommendations for teams, departments, or the organization..."
                    className="w-full resize-none rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                    rows={3}
                    value={lessonsLearned.recommendations}
                    onChange={(e) => setLessonsLearned({ ...lessonsLearned, recommendations: e.target.value })}
                  />
                </div>
              </div>
            </motion.section>
          )}

          {/* Corrective Actions Section */}
          {activeSection === 'capa' && (
            <motion.section
              key="capa"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="rounded-[2.5rem] border border-surface-border bg-surface-raised p-8 shadow-soft"
            >
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-text-primary">Corrective & Preventive Actions</h2>
                    <p className="text-sm text-text-muted">Assign and track remediation tasks</p>
                  </div>
                </div>
                <SMButton variant="ghost" size="sm" leftIcon={<Plus className="w-4 h-4" />} onClick={addAction}>
                  Add Action
                </SMButton>
              </div>

              <div className="space-y-6">
                {correctiveActions.map((action, index) => (
                  <div key={index} className="relative rounded-3xl border border-surface-border bg-surface-sunken p-6 group">
                    <button 
                      onClick={() => removeAction(index)}
                      className="absolute top-4 right-4 p-2 text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2 space-y-2">
                        <label className="ml-1 text-xs font-bold uppercase text-text-muted">Action Description</label>
                        <input
                          type="text"
                          placeholder="What needs to be done?"
                          className="w-full rounded-2xl border border-surface-border bg-surface-raised px-4 py-3 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                          value={action.action}
                          onChange={(e) => {
                            const newActions = [...correctiveActions];
                            newActions[index].action = e.target.value;
                            setCorrectiveActions(newActions);
                          }}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-xs font-bold uppercase text-text-muted">Assigned To</label>
                        <div className="relative">
                          <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                          <input
                            type="text"
                            placeholder="Name or Department"
                            className="w-full rounded-2xl border border-surface-border bg-surface-raised py-3 pl-11 pr-4 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                            value={action.assignedTo}
                            onChange={(e) => {
                              const newActions = [...correctiveActions];
                              newActions[index].assignedTo = e.target.value;
                              setCorrectiveActions(newActions);
                            }}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="ml-1 text-xs font-bold uppercase text-text-muted">Due Date</label>
                        <div className="relative">
                          <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                          <input
                            type="date"
                            className="w-full rounded-2xl border border-surface-border bg-surface-raised py-3 pl-11 pr-4 transition-all outline-none focus:border-accent/40 focus:ring-2 focus:ring-accent/15"
                            value={action.dueDate}
                            onChange={(e) => {
                              const newActions = [...correctiveActions];
                              newActions[index].dueDate = e.target.value;
                              setCorrectiveActions(newActions);
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        <div className="flex gap-4">
          <SMButton
            variant="secondary"
            className="flex-1"
            onClick={() => void persistAnalysis(false)}
            disabled={isPersisting}
          >
            Save Draft
          </SMButton>
          <SMButton
            variant="primary"
            className="flex-[2]"
            leftIcon={<CheckCircle2 className="w-5 h-5" />}
            loading={isPersisting}
            onClick={() => void persistAnalysis(true)}
          >
            {isPersisting ? 'Saving...' : 'Finalize Analysis'}
          </SMButton>
        </div>
      </main>
    </div>
  );
};
