import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Brain, Loader2, CheckCircle2, Users, Calendar, Clock,
  FileText, Plus, X, RefreshCw, Shield, AlertTriangle, Zap,
  BookOpen, Target, ClipboardList, User, Building2, Star, Check
} from 'lucide-react';
import { useAttendToolboxTalk, useCreateToolboxTalk, useGenerateToolboxTalk, useToolboxTalks } from '../api/hooks/useAPIHooks';

// Toolbox Talk Categories
const TALK_CATEGORIES = [
  { id: 'general_safety', label: 'General Safety', icon: Shield },
  { id: 'ppe', label: 'PPE Requirements', icon: Shield },
  { id: 'fall_protection', label: 'Fall Protection', icon: AlertTriangle },
  { id: 'electrical', label: 'Electrical Safety', icon: Zap },
  { id: 'chemical', label: 'Chemical Handling', icon: AlertTriangle },
  { id: 'fire_safety', label: 'Fire Safety', icon: AlertTriangle },
  { id: 'ergonomics', label: 'Ergonomics', icon: User },
  { id: 'housekeeping', label: 'Housekeeping', icon: ClipboardList },
  { id: 'machine_safety', label: 'Machine Guarding', icon: Shield },
  { id: 'confined_space', label: 'Confined Space', icon: AlertTriangle },
  { id: 'lockout_tagout', label: 'LOTO', icon: Shield },
  { id: 'heat_stress', label: 'Heat/Cold Stress', icon: AlertTriangle },
];

// Industry-specific topics
const INDUSTRY_TOPICS: Record<string, string[]> = {
  'Construction': [
    'Scaffold Safety', 'Trenching & Excavation', 'Crane Operations', 'Fall Protection', 
    'Struck-By Hazards', 'Tool Safety', 'Silica Exposure', 'Ladder Safety'
  ],
  'Oil & Gas': [
    'H2S Awareness', 'Hot Work Safety', 'Process Safety', 'Well Control',
    'Confined Space Entry', 'LEL Monitoring', 'Emergency Response', 'Rig Floor Safety'
  ],
  'Manufacturing': [
    'Machine Guarding', 'Lockout/Tagout', 'Forklift Safety', 'Conveyor Safety',
    'Noise Exposure', 'Repetitive Motion', 'Material Handling', 'Press Safety'
  ],
  'Healthcare': [
    'Bloodborne Pathogens', 'Patient Handling', 'Needle Stick Prevention', 'Chemical Exposure',
    'Violence Prevention', 'Infection Control', 'Radiation Safety', 'Slip Prevention'
  ],
  'Warehouse': [
    'Forklift Safety', 'Loading Dock Safety', 'Racking Safety', 'Manual Lifting',
    'Powered Pallet Jack', 'Traffic Management', 'Stack Stability', 'Battery Charging'
  ],
  'General Industry': [
    'Slip, Trip, Fall Prevention', 'Hand Tool Safety', 'PPE Selection', 'Emergency Exits',
    'Fire Extinguisher Use', 'First Aid Basics', 'Housekeeping', 'Hazard Communication'
  ],
};

interface Attendee {
  id: string;
  name: string;
  employeeId: string;
  signature: string;
  signedAt: string | null;
}

interface ToolboxTalk {
  id: string;
  date: string;
  time: string;
  topic: string;
  category: string;
  content: string;
  keyPoints: string[];
  safetyTips: string[];
  discussionQuestions: string[];
  presenter: string;
  location: string;
  department: string;
  industry: string;
  duration: number;
  attendees: Attendee[];
  notes: string;
  status: 'draft' | 'in_progress' | 'completed';
  aiSource?: 'ai' | 'fallback';
  aiModel?: string | null;
}

function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={index}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*')) return <em key={index}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={index} className="rounded bg-surface-raised px-1 py-0.5 text-xs font-mono text-primary">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let bullets: string[] = [];
  let key = 0;

  const flushBullets = () => {
    if (bullets.length === 0) return;
    elements.push(
      <ul key={`bullets-${key++}`} className="my-3 space-y-2">
        {bullets.map((item, index) => (
          <li key={index} className="flex items-start gap-3 text-sm leading-6 text-text-secondary">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span>{renderInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      return;
    }
    if (/^##\s+/.test(trimmed)) {
      flushBullets();
      elements.push(<h3 key={`h3-${index}`} className="mt-5 text-base font-bold text-text-primary first:mt-0">{renderInline(trimmed.replace(/^##\s+/, ''))}</h3>);
      return;
    }
    if (/^#\s+/.test(trimmed)) {
      flushBullets();
      elements.push(<h2 key={`h2-${index}`} className="mt-5 text-lg font-bold text-text-primary first:mt-0">{renderInline(trimmed.replace(/^#\s+/, ''))}</h2>);
      return;
    }
    if (/^[-*•]\s+/.test(trimmed)) {
      bullets.push(trimmed.replace(/^[-*•]\s+/, ''));
      return;
    }
    flushBullets();
    elements.push(<p key={`p-${index}`} className="text-sm leading-6 text-text-secondary">{renderInline(trimmed)}</p>);
  });

  flushBullets();
  return <div className="space-y-1">{elements}</div>;
}

function mapCategoryToBackendTopic(category: string): 'safety' | 'health' | 'environment' | 'emergency' | 'general' {
  switch (category) {
    case 'chemical':
    case 'heat_stress':
    case 'ergonomics':
      return 'health';
    case 'fire_safety':
      return 'emergency';
    default:
      return 'general';
  }
}

// Mock past talks for records
const MOCK_PAST_TALKS: ToolboxTalk[] = [
  {
    id: 'TBT-2026-001',
    date: '2026-01-27',
    time: '07:00',
    topic: 'Fall Protection Fundamentals',
    category: 'fall_protection',
    content: 'Review of fall protection requirements when working at heights above 6 feet.',
    keyPoints: ['100% tie-off rule', 'Inspect harness before use', 'Know your anchor points'],
    safetyTips: ['Always have a rescue plan', 'Report damaged equipment immediately'],
    discussionQuestions: ['What fall hazards exist in your work area?'],
    presenter: 'John Smith',
    location: 'Main Building',
    department: 'Construction',
    industry: 'Construction',
    duration: 15,
    attendees: [
      { id: '1', name: 'Mike Johnson', employeeId: 'EMP001', signature: 'Mike Johnson', signedAt: '2026-01-27T07:15:00Z' },
      { id: '2', name: 'Sarah Davis', employeeId: 'EMP002', signature: 'Sarah Davis', signedAt: '2026-01-27T07:15:00Z' },
    ],
    notes: 'Good participation, follow-up needed on harness inspection training.',
    status: 'completed',
  },
  {
    id: 'TBT-2026-002',
    date: '2026-01-26',
    time: '07:00',
    topic: 'Lockout/Tagout Procedures',
    category: 'lockout_tagout',
    content: 'Energy isolation procedures for equipment maintenance.',
    keyPoints: ['Identify all energy sources', 'Use personal locks', 'Verify zero energy'],
    safetyTips: ['Never remove another person\'s lock'],
    discussionQuestions: ['What equipment requires LOTO in your area?'],
    presenter: 'Lisa Chen',
    location: 'Production Floor',
    department: 'Maintenance',
    industry: 'Manufacturing',
    duration: 20,
    attendees: [
      { id: '3', name: 'Tom Wilson', employeeId: 'EMP003', signature: 'Tom Wilson', signedAt: '2026-01-26T07:20:00Z' },
    ],
    notes: '',
    status: 'completed',
  },
];

export const ToolboxTalks: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'generate' | 'records' | 'attendance'>('generate');
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState('General Industry');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [currentTalk, setCurrentTalk] = useState<ToolboxTalk | null>(null);
  const [pastTalks, setPastTalks] = useState<ToolboxTalk[]>(MOCK_PAST_TALKS);

  // ── Real API Data ────────────────────────────────────────────────────────
  const { data: backendTalks } = useToolboxTalks();
  const createTalkMutation = useCreateToolboxTalk();
  const attendTalkMutation = useAttendToolboxTalk();
  const generateTalkMutation = useGenerateToolboxTalk();

  // Merge backend talks with mock data
  useEffect(() => {
    if (backendTalks && (backendTalks as any[]).length > 0) {
      const converted: ToolboxTalk[] = (backendTalks as any[]).map((t: any) => ({
        id: t.id || t.talkId,
        date: t.date || t.scheduledDate?.split('T')[0] || new Date().toISOString().split('T')[0],
        time: t.time || '07:00',
        topic: t.topic || t.title,
        category: t.category || 'general_safety',
        content: t.content || t.description || '',
        keyPoints: t.keyPoints || [],
        safetyTips: t.safetyTips || [],
        discussionQuestions: t.discussionQuestions || [],
        presenter: t.presenter || t.presenterName || 'Unknown',
        location: t.location || '',
        department: t.department || '',
        industry: t.industry || 'General Industry',
        duration: t.duration || 15,
        attendees: t.attendees || [],
        notes: t.notes || '',
        status: t.status || 'completed',
      }));
      const mockIds = new Set(MOCK_PAST_TALKS.map(m => m.id));
      const newBackend = converted.filter(c => !mockIds.has(c.id));
      setPastTalks([...MOCK_PAST_TALKS, ...newBackend]);
    }
  }, [backendTalks]);
  const [showSignModal, setShowSignModal] = useState(false);
  const [signerName, setSignerName] = useState('');
  const [signerId, setSignerId] = useState('');

  const totalAttendees = pastTalks.reduce((sum, talk) => sum + talk.attendees.length, 0);
  const completedTalks = pastTalks.filter(talk => talk.status === 'completed').length;
  const availableTopics = INDUSTRY_TOPICS[selectedIndustry] ?? [];

  useEffect(() => {
    setSelectedTopic('');
  }, [selectedIndustry]);

  const generateAIToolboxTalk = async () => {
    setIsGenerating(true);
    try {
      const topic = customTopic.trim() || selectedTopic || 'Daily Safety Awareness';
      const generated = await generateTalkMutation.mutate({
        industry: selectedIndustry,
        category: selectedCategory || 'general_safety',
        topic,
      });

      if (!generated) return;

      setCurrentTalk({
        id: `TBT-${new Date().getFullYear()}-${String(pastTalks.length + 1).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        topic: generated.topic,
        category: generated.category || selectedCategory || 'general_safety',
        content: generated.content,
        keyPoints: generated.keyPoints,
        safetyTips: generated.safetyTips,
        discussionQuestions: generated.discussionQuestions,
        presenter: '',
        location: '',
        department: '',
        industry: generated.industry,
        duration: 15,
        attendees: [],
        notes: '',
        status: 'draft',
        aiSource: generated.source,
        aiModel: generated.model,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const addAttendee = () => {
    if (!currentTalk || !signerName.trim()) return;
    
    const newAttendee: Attendee = {
      id: Date.now().toString(),
      name: signerName.trim(),
      employeeId: signerId.trim() || 'N/A',
      signature: signerName.trim(),
      signedAt: new Date().toISOString(),
    };
    
    setCurrentTalk({
      ...currentTalk,
      attendees: [...currentTalk.attendees, newAttendee],
    });
    
    setSignerName('');
    setSignerId('');
    setShowSignModal(false);
  };

  const removeAttendee = (id: string) => {
    if (!currentTalk) return;
    setCurrentTalk({
      ...currentTalk,
      attendees: currentTalk.attendees.filter(a => a.id !== id),
    });
  };

  const completeTalk = async () => {
    if (!currentTalk) return;
    const completedTalk = { ...currentTalk, status: 'completed' as const };

    try {
      const created = await createTalkMutation.mutate({
        title: completedTalk.topic,
        topic: mapCategoryToBackendTopic(completedTalk.category),
        description: completedTalk.content,
        conductor: completedTalk.presenter,
        conductedDate: new Date(`${completedTalk.date}T${completedTalk.time}`).getTime(),
        location: completedTalk.location,
        department: completedTalk.department,
        duration: completedTalk.duration,
        keyPoints: completedTalk.keyPoints,
        attachments: [],
        status: 'completed',
      });

      if (created?.id && completedTalk.attendees.length > 0) {
        await attendTalkMutation.mutate({
          id: Number(created.id),
          data: {
            attendees: completedTalk.attendees.map(attendee => ({
              employeeName: attendee.name,
              employeeId: attendee.employeeId,
              department: completedTalk.department,
              signature: true,
            })),
          },
        });
      }
    } catch {
      // Local completion stays visible even if persistence fails.
    }

    setPastTalks([completedTalk, ...pastTalks]);
    setCurrentTalk(null);
    setActiveTab('records');
  };

  const tabs = [
    { id: 'generate', label: 'Generate Talk', icon: Sparkles },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'attendance', label: 'Sign-Off', icon: ClipboardList },
  ];

  return (
    <div className="ai-purple-theme min-h-screen bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(14,165,233,0.06),transparent_24%),linear-gradient(180deg,var(--surface-base),var(--surface-sunken))] pb-24">

      
      {/* Header */}
      <header className="sticky top-[var(--nav-height)] z-40 border-b border-surface-border bg-surface-raised/90 backdrop-blur-xl">
        <div className="mx-auto max-w-[1520px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="rounded-xl p-2 transition-colors hover:bg-surface-overlay"
              >
                <ArrowLeft className="h-5 w-5 text-text-secondary" />
              </button>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                  <BookOpen className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="page-title">AI Toolbox Talks</h1>
                  <p className="text-sm text-text-muted">Daily Safety Meetings with Sign-Off</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="border-b border-surface-border bg-surface-raised/95 backdrop-blur-md">
        <div className="mx-auto max-w-[1520px] px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-primary text-white shadow-soft'
                    : 'text-text-secondary hover:bg-surface-overlay'
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
      <main className="mx-auto max-w-[1520px] px-4 py-6 pb-8 sm:px-6 lg:px-8">
        <section className="mb-6 grid gap-4 xl:grid-cols-[1.35fr_0.85fr]">
          <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
              AI safety briefing workspace
            </div>
            <h2 className="mt-3 text-2xl font-bold text-text-primary">Generate, review, and close toolbox talks in one focused workflow.</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-text-secondary">
              The generator now runs through the backend OpenRouter flow, then the same page carries the talk through records and attendance without the old disconnected layout.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
            <div className="rounded-[24px] border border-surface-border bg-surface-raised p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Talk library</p>
              <p className="mt-2 text-3xl font-bold text-text-primary">{pastTalks.length}</p>
              <p className="mt-1 text-sm text-text-secondary">Total talks available</p>
            </div>
            <div className="rounded-[24px] border border-surface-border bg-surface-raised p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Completed</p>
              <p className="mt-2 text-3xl font-bold text-text-primary">{completedTalks}</p>
              <p className="mt-1 text-sm text-text-secondary">Finished briefings</p>
            </div>
            <div className="rounded-[24px] border border-surface-border bg-surface-raised p-5 shadow-soft">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Sign-offs</p>
              <p className="mt-2 text-3xl font-bold text-text-primary">{totalAttendees}</p>
              <p className="mt-1 text-sm text-text-secondary">Recorded attendees</p>
            </div>
          </div>
        </section>

        <AnimatePresence mode="wait">
          {/* Generate Tab */}
          {activeTab === 'generate' && (
            <motion.div
              key="generate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* AI Generator Card */}
              <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                  <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-soft">
                      <Brain className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">AI-Powered Toolbox Talk Generator</h3>
                      <p className="text-sm text-text-secondary">Generate supervisor-ready content through the backend OpenRouter flow.</p>
                    </div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-text-secondary">Industry</label>
                      <select
                        value={selectedIndustry}
                        onChange={e => setSelectedIndustry(e.target.value)}
                        className="w-full rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/30"
                      >
                        {Object.keys(INDUSTRY_TOPICS).map(ind => (
                          <option key={ind} value={ind}>{ind}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary">Safety Category</label>
                      <select
                        value={selectedCategory}
                        onChange={e => setSelectedCategory(e.target.value)}
                        className="w-full rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Auto-select from topic</option>
                        {TALK_CATEGORIES.map(category => (
                          <option key={category.id} value={category.id}>{category.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-medium text-text-secondary">Suggested Topic</label>
                      <select
                        value={selectedTopic}
                        onChange={e => { setSelectedTopic(e.target.value); setCustomTopic(''); }}
                        className="w-full rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 text-text-primary focus:ring-2 focus:ring-primary/30"
                      >
                        <option value="">Select a topic...</option>
                        {availableTopics.map(topic => (
                          <option key={topic} value={topic}>{topic}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="mb-2 block text-sm font-medium text-text-secondary">Custom Topic</label>
                      <input
                        type="text"
                        value={customTopic}
                        onChange={e => { setCustomTopic(e.target.value); setSelectedTopic(''); }}
                        placeholder="Or enter a site-specific toolbox topic..."
                        className="w-full rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 text-text-primary placeholder:text-text-muted focus:ring-2 focus:ring-primary/30"
                      />
                    </div>
                  </div>

                  <button
                    onClick={generateAIToolboxTalk}
                    disabled={isGenerating || (!selectedTopic && !customTopic.trim())}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-3 font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        Generate Toolbox Talk
                      </>
                    )}
                  </button>
                </div>

                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Generator flow</p>
                  <div className="mt-4 space-y-3">
                    {[
                      'Select an industry and topic, or enter a custom job-specific subject.',
                      'AI returns a ready-to-use talk track, key points, safety tips, and crew discussion prompts.',
                      'Review the draft, add presenter details, collect attendance, then close the talk into records.',
                    ].map((item, index) => (
                      <div key={item} className="flex gap-3 rounded-2xl bg-surface-sunken p-4">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">{index + 1}</div>
                        <p className="text-sm leading-6 text-text-secondary">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Generated Content Preview */}
              {currentTalk && (
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">{currentTalk.topic}</h3>
                        <p className="text-sm text-text-muted">{currentTalk.id} • {currentTalk.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {currentTalk.aiSource === 'fallback' ? 'Fallback mode' : 'OpenRouter AI'}
                      </span>
                      <button
                        onClick={generateAIToolboxTalk}
                        className="rounded-xl p-2 transition-colors hover:bg-surface-overlay"
                        title="Regenerate"
                      >
                        <RefreshCw className="w-5 h-5 text-surface-500" />
                      </button>
                    </div>
                  </div>

                  <div className="mb-6 rounded-2xl border border-surface-border bg-surface-sunken p-5">
                    {renderMarkdown(currentTalk.content)}
                  </div>

                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-text-primary">
                      <Target className="w-4 h-4 text-primary" /> Key Points
                    </h4>
                    <ul className="space-y-2">
                      {currentTalk.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                          <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Safety Tips */}
                  <div className="mb-4">
                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-text-primary">
                      <Star className="w-4 h-4 text-amber-500" /> Safety Tips
                    </h4>
                    <ul className="space-y-2">
                      {currentTalk.safetyTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                          <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Discussion Questions */}
                  <div className="mb-6">
                    <h4 className="mb-2 flex items-center gap-2 font-semibold text-text-primary">
                      <Users className="w-4 h-4 text-blue-500" /> Discussion Questions
                    </h4>
                    <ul className="space-y-2">
                      {currentTalk.discussionQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                          <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{idx + 1}</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-secondary">Presenter</label>
                      <input
                        type="text"
                        value={currentTalk.presenter}
                        onChange={e => setCurrentTalk({ ...currentTalk, presenter: e.target.value })}
                        className="w-full rounded-xl border border-surface-border bg-surface-sunken px-4 py-2.5 text-text-primary"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-secondary">Location</label>
                      <input
                        type="text"
                        value={currentTalk.location}
                        onChange={e => setCurrentTalk({ ...currentTalk, location: e.target.value })}
                        className="w-full rounded-xl border border-surface-border bg-surface-sunken px-4 py-2.5 text-text-primary"
                        placeholder="Meeting location"
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-text-secondary">Department</label>
                      <input
                        type="text"
                        value={currentTalk.department}
                        onChange={e => setCurrentTalk({ ...currentTalk, department: e.target.value })}
                        className="w-full rounded-xl border border-surface-border bg-surface-sunken px-4 py-2.5 text-text-primary"
                        placeholder="Dept/Team"
                      />
                    </div>
                  </div>

                  <div className="mb-4">
                    <label className="mb-1.5 block text-sm font-medium text-text-secondary">Meeting Notes</label>
                    <textarea
                      value={currentTalk.notes}
                      onChange={e => setCurrentTalk({ ...currentTalk, notes: e.target.value })}
                      rows={3}
                      className="w-full resize-none rounded-xl border border-surface-border bg-surface-sunken px-4 py-3 text-text-primary"
                      placeholder="Any observations, follow-ups, or action items..."
                    />
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90"
                    >
                      <ClipboardList className="w-5 h-5" />
                      Add Attendees
                    </button>
                    <button
                      onClick={completeTalk}
                      disabled={currentTalk.attendees.length === 0}
                      className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Complete & Save
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <motion.div
              key="records"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-text-primary">Toolbox Talk Records</h2>
                <span className="rounded-lg bg-surface-sunken px-3 py-1.5 text-sm text-text-secondary">
                  {pastTalks.length} Records
                </span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-surface-border bg-surface-raised p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Completed talks</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">{completedTalks}</p>
                </div>
                <div className="rounded-2xl border border-surface-border bg-surface-raised p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Total attendees</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">{totalAttendees}</p>
                </div>
                <div className="rounded-2xl border border-surface-border bg-surface-raised p-4 shadow-soft">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">Drafts in progress</p>
                  <p className="mt-2 text-2xl font-bold text-text-primary">{pastTalks.filter(talk => talk.status !== 'completed').length + (currentTalk ? 1 : 0)}</p>
                </div>
              </div>

              {pastTalks.map((talk, idx) => (
                <motion.div
                  key={talk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="rounded-[24px] border border-surface-border bg-surface-raised p-5 shadow-card"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-text-primary">{talk.topic}</h3>
                        <p className="text-sm text-surface-500">{talk.id}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      talk.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                      talk.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                      'bg-surface-100 text-surface-600'
                    }`}>
                      {talk.status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-text-muted">
                      <Calendar className="w-4 h-4" />
                      {talk.date}
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <User className="w-4 h-4" />
                      {talk.presenter || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Building2 className="w-4 h-4" />
                      {talk.location || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-text-muted">
                      <Users className="w-4 h-4" />
                      {talk.attendees.length} attendees
                    </div>
                  </div>

                  {talk.attendees.length > 0 && (
                    <div className="mt-4 border-t border-surface-border pt-4">
                      <p className="mb-2 text-xs font-medium text-text-muted">Signed Attendees:</p>
                      <div className="flex flex-wrap gap-2">
                        {talk.attendees.map(att => (
                          <span key={att.id} className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-1 text-xs text-success">
                            <Check className="w-3 h-3" />
                            {att.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <motion.div
              key="attendance"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {currentTalk ? (
                <>
                  <div className="rounded-[28px] border border-surface-border bg-surface-raised p-6 shadow-card">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-text-primary">Attendance Sign-Off</h3>
                        <p className="text-sm text-text-muted">{currentTalk.topic} • {currentTalk.date}</p>
                      </div>
                      <button
                        onClick={() => setShowSignModal(true)}
                        className="flex items-center gap-2 rounded-2xl bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
                      >
                        <Plus className="w-4 h-4" />
                        Add Attendee
                      </button>
                    </div>

                    {/* Attendee List */}
                    <div className="space-y-3">
                      {currentTalk.attendees.length > 0 ? (
                        currentTalk.attendees.map((att, idx) => (
                          <div key={att.id} className="flex items-center justify-between rounded-2xl bg-surface-sunken p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-success/10">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-text-primary">{att.name}</p>
                                <p className="text-xs text-text-muted">ID: {att.employeeId} • Signed: {new Date(att.signedAt!).toLocaleTimeString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttendee(att.id)}
                              className="rounded-lg p-2 text-danger transition-colors hover:bg-danger/10"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="py-12 text-center text-text-muted">
                          <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                          <p>No attendees signed yet</p>
                          <p className="text-sm">Click "Add Attendee" to record sign-offs</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Complete Meeting */}
                  <button
                    onClick={completeTalk}
                    disabled={currentTalk.attendees.length === 0}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary py-4 font-semibold text-white shadow-card transition-all hover:bg-primary/90 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Toolbox Talk ({currentTalk.attendees.length} signatures)
                  </button>
                </>
              ) : (
                <div className="rounded-[28px] border border-surface-border bg-surface-raised p-12 text-center shadow-card">
                  <BookOpen className="mx-auto mb-4 h-16 w-16 text-surface-border" />
                  <h3 className="mb-2 text-xl font-bold text-text-primary">No Active Toolbox Talk</h3>
                  <p className="mb-6 text-text-muted">Generate a toolbox talk first to start collecting sign-offs</p>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="rounded-2xl bg-primary px-6 py-3 text-white transition-colors hover:bg-primary/90"
                  >
                    Generate Toolbox Talk
                  </button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Sign Modal */}
      <AnimatePresence>
        {showSignModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setShowSignModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl border border-surface-border bg-surface-raised p-6 shadow-modal"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="mb-4 text-xl font-bold text-text-primary">Sign Attendance</h3>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Full Name *</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface-sunken px-4 py-2.5 text-text-primary"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-text-secondary">Employee ID</label>
                  <input
                    type="text"
                    value={signerId}
                    onChange={e => setSignerId(e.target.value)}
                    className="w-full rounded-xl border border-surface-border bg-surface-sunken px-4 py-2.5 text-text-primary"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 rounded-xl border border-surface-border py-2.5 text-text-secondary transition-colors hover:bg-surface-overlay"
                >
                  Cancel
                </button>
                <button
                  onClick={addAttendee}
                  disabled={!signerName.trim()}
                  className="flex-1 rounded-xl bg-primary py-2.5 text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
                >
                  Sign & Confirm
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ToolboxTalks;
