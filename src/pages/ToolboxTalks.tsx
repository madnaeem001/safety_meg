import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Sparkles, Brain, Loader2, CheckCircle2, Users, Calendar, Clock,
  FileText, Pen, Download, Plus, X, RefreshCw, Shield, AlertTriangle, Zap,
  BookOpen, Target, ClipboardList, User, Building2, Star, Send, Check
} from 'lucide-react';
import { useToolboxTalks, useCreateToolboxTalk } from '../api/hooks/useAPIHooks';

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

  const generateAIToolboxTalk = async () => {
    setIsGenerating(true);
    
    // Simulate AI generation
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    const topic = customTopic || selectedTopic || 'Daily Safety Awareness';
    const newTalk: ToolboxTalk = {
      id: `TBT-${new Date().getFullYear()}-${String(pastTalks.length + 1).padStart(3, '0')}`,
      date: new Date().toISOString().split('T')[0],
      time: new Date().toTimeString().slice(0, 5),
      topic: topic,
      category: selectedCategory || 'general_safety',
      content: generateTalkContent(topic, selectedIndustry),
      keyPoints: generateKeyPoints(topic),
      safetyTips: generateSafetyTips(topic),
      discussionQuestions: generateDiscussionQuestions(topic),
      presenter: '',
      location: '',
      department: '',
      industry: selectedIndustry,
      duration: 15,
      attendees: [],
      notes: '',
      status: 'draft',
    };
    
    setCurrentTalk(newTalk);
    setIsGenerating(false);
  };

  const generateTalkContent = (topic: string, industry: string): string => {
    return `**Today's Safety Focus: ${topic}**

Good morning team! Today we're discussing ${topic.toLowerCase()}, an essential aspect of our daily safety program.

**Why This Matters:**
Every year, thousands of workplace incidents occur related to ${topic.toLowerCase()}. By understanding the hazards and following proper procedures, we can prevent injuries and protect ourselves and our coworkers.

**Industry Context (${industry}):**
In our ${industry} environment, ${topic.toLowerCase()} is particularly important due to the specific hazards we encounter daily. Let's review the key points that apply to our work.

**Regulatory Requirements:**
Remember, OSHA requires employers to provide a safe workplace. Compliance with safety procedures isn't just a rule—it's the law and it protects you.

**Your Role:**
Every team member has a responsibility to identify hazards, follow procedures, and speak up when something doesn't seem safe. If you see something, say something!`;
  };

  const generateKeyPoints = (topic: string): string[] => {
    const basePoints = [
      `Always assess ${topic.toLowerCase()} hazards before starting work`,
      'Follow established procedures and SOPs',
      'Use required PPE correctly',
      'Report any unsafe conditions immediately',
      'Participate in safety training and drills',
    ];
    return basePoints.slice(0, 4);
  };

  const generateSafetyTips = (topic: string): string[] => {
    return [
      'Take a moment to think before you act',
      'Ask questions if you\'re unsure about any procedure',
      'Look out for your coworkers',
      'Report near misses—they help prevent real incidents',
    ];
  };

  const generateDiscussionQuestions = (topic: string): string[] => {
    return [
      `What ${topic.toLowerCase()} hazards do you encounter in your work area?`,
      'Have you witnessed any near misses related to this topic?',
      'What additional training or resources would help you work more safely?',
      'How can we improve our safety procedures?',
    ];
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
    setPastTalks([completedTalk, ...pastTalks]);
    // Persist to backend
    try {
      await createTalkMutation.mutate({
        topic: completedTalk.topic,
        category: completedTalk.category,
        content: completedTalk.content,
        presenter: completedTalk.presenter,
        location: completedTalk.location,
        department: completedTalk.department,
        industry: completedTalk.industry,
        duration: completedTalk.duration,
        scheduledDate: `${completedTalk.date}T${completedTalk.time}`,
        keyPoints: completedTalk.keyPoints,
        safetyTips: completedTalk.safetyTips,
        attendeeCount: completedTalk.attendees.length,
      });
    } catch {
      // ignore - local state already updated
    }
    setCurrentTalk(null);
    setActiveTab('records');
  };

  const tabs = [
    { id: 'generate', label: 'Generate Talk', icon: Sparkles },
    { id: 'records', label: 'Records', icon: FileText },
    { id: 'attendance', label: 'Sign-Off', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-surface-50 to-surface-100 dark:from-surface-900 dark:to-surface-950">

      
      {/* Header */}
      <header className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 sticky top-[72px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-300" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-brand-900 dark:text-white">AI Toolbox Talks</h1>
                  <p className="text-sm text-surface-500 dark:text-surface-400">Daily Safety Meetings with Sign-Off</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto py-2">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-emerald-500 text-white shadow-md'
                    : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
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
      <main className="max-w-7xl mx-auto px-4 py-6 pb-8">
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
              <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 shadow-xl text-white">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center">
                    <Brain className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">AI-Powered Toolbox Talk Generator</h3>
                    <p className="text-emerald-100 text-sm">Generate engaging safety content in seconds</p>
                  </div>
                </div>

                {/* Industry Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-emerald-100 mb-2">Industry</label>
                  <select
                    value={selectedIndustry}
                    onChange={e => setSelectedIndustry(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50"
                  >
                    {Object.keys(INDUSTRY_TOPICS).map(ind => (
                      <option key={ind} value={ind} className="text-surface-900">{ind}</option>
                    ))}
                  </select>
                </div>

                {/* Topic Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-emerald-100 mb-2">Select Topic or Enter Custom</label>
                  <select
                    value={selectedTopic}
                    onChange={e => { setSelectedTopic(e.target.value); setCustomTopic(''); }}
                    className="w-full px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50 mb-2"
                  >
                    <option value="" className="text-surface-900">Select a topic...</option>
                    {INDUSTRY_TOPICS[selectedIndustry]?.map(topic => (
                      <option key={topic} value={topic} className="text-surface-900">{topic}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customTopic}
                    onChange={e => { setCustomTopic(e.target.value); setSelectedTopic(''); }}
                    placeholder="Or enter custom topic..."
                    className="w-full px-4 py-2.5 rounded-xl bg-white/20 backdrop-blur-md border border-white/30 text-white placeholder-white/60 focus:ring-2 focus:ring-white/50"
                  />
                </div>

                <button
                  onClick={generateAIToolboxTalk}
                  disabled={isGenerating}
                  className="w-full py-3 bg-white text-emerald-600 font-semibold rounded-xl hover:bg-emerald-50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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

              {/* Generated Content Preview */}
              {currentTalk && (
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg text-brand-900 dark:text-white">{currentTalk.topic}</h3>
                        <p className="text-sm text-surface-500">{currentTalk.id} • {currentTalk.date}</p>
                      </div>
                    </div>
                    <button
                      onClick={generateAIToolboxTalk}
                      className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-surface-700 transition-colors"
                      title="Regenerate"
                    >
                      <RefreshCw className="w-5 h-5 text-surface-500" />
                    </button>
                  </div>

                  {/* Content */}
                  <div className="prose prose-sm dark:prose-invert max-w-none mb-6">
                    <div className="whitespace-pre-wrap text-surface-700 dark:text-surface-300">{currentTalk.content}</div>
                  </div>

                  {/* Key Points */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-brand-900 dark:text-white mb-2 flex items-center gap-2">
                      <Target className="w-4 h-4 text-emerald-500" /> Key Points
                    </h4>
                    <ul className="space-y-2">
                      {currentTalk.keyPoints.map((point, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {point}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Safety Tips */}
                  <div className="mb-4">
                    <h4 className="font-semibold text-brand-900 dark:text-white mb-2 flex items-center gap-2">
                      <Star className="w-4 h-4 text-amber-500" /> Safety Tips
                    </h4>
                    <ul className="space-y-2">
                      {currentTalk.safetyTips.map((tip, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <Star className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                          {tip}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Discussion Questions */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-brand-900 dark:text-white mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" /> Discussion Questions
                    </h4>
                    <ul className="space-y-2">
                      {currentTalk.discussionQuestions.map((q, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                          <span className="w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0">{idx + 1}</span>
                          {q}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Presenter & Location */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Presenter</label>
                      <input
                        type="text"
                        value={currentTalk.presenter}
                        onChange={e => setCurrentTalk({ ...currentTalk, presenter: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                        placeholder="Name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Location</label>
                      <input
                        type="text"
                        value={currentTalk.location}
                        onChange={e => setCurrentTalk({ ...currentTalk, location: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                        placeholder="Meeting location"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Department</label>
                      <input
                        type="text"
                        value={currentTalk.department}
                        onChange={e => setCurrentTalk({ ...currentTalk, department: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                        placeholder="Dept/Team"
                      />
                    </div>
                  </div>

                  {/* Notes */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Meeting Notes</label>
                    <textarea
                      value={currentTalk.notes}
                      onChange={e => setCurrentTalk({ ...currentTalk, notes: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white resize-none"
                      placeholder="Any observations, follow-ups, or action items..."
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setActiveTab('attendance')}
                      className="flex-1 py-3 px-4 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <ClipboardList className="w-5 h-5" />
                      Add Attendees
                    </button>
                    <button
                      onClick={completeTalk}
                      disabled={currentTalk.attendees.length === 0}
                      className="flex-1 py-3 px-4 rounded-xl bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
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
                <h2 className="text-lg font-bold text-brand-900 dark:text-white">Toolbox Talk Records</h2>
                <span className="px-3 py-1.5 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm text-surface-600 dark:text-surface-400">
                  {pastTalks.length} Records
                </span>
              </div>

              {pastTalks.map((talk, idx) => (
                <motion.div
                  key={talk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white dark:bg-surface-800 rounded-2xl p-5 shadow-soft border border-surface-100 dark:border-surface-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <FileText className="w-5 h-5 text-emerald-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-brand-900 dark:text-white">{talk.topic}</h3>
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
                    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                      <Calendar className="w-4 h-4" />
                      {talk.date}
                    </div>
                    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                      <User className="w-4 h-4" />
                      {talk.presenter || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                      <Building2 className="w-4 h-4" />
                      {talk.location || 'N/A'}
                    </div>
                    <div className="flex items-center gap-2 text-surface-500 dark:text-surface-400">
                      <Users className="w-4 h-4" />
                      {talk.attendees.length} attendees
                    </div>
                  </div>

                  {talk.attendees.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-surface-100 dark:border-surface-700">
                      <p className="text-xs font-medium text-surface-500 dark:text-surface-400 mb-2">Signed Attendees:</p>
                      <div className="flex flex-wrap gap-2">
                        {talk.attendees.map(att => (
                          <span key={att.id} className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-full text-xs">
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
                  <div className="bg-white dark:bg-surface-800 rounded-2xl p-6 shadow-soft border border-surface-100 dark:border-surface-700">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-brand-900 dark:text-white">Attendance Sign-Off</h3>
                        <p className="text-sm text-surface-500">{currentTalk.topic} • {currentTalk.date}</p>
                      </div>
                      <button
                        onClick={() => setShowSignModal(true)}
                        className="px-4 py-2 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        Add Attendee
                      </button>
                    </div>

                    {/* Attendee List */}
                    <div className="space-y-3">
                      {currentTalk.attendees.length > 0 ? (
                        currentTalk.attendees.map((att, idx) => (
                          <div key={att.id} className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                              </div>
                              <div>
                                <p className="font-medium text-surface-900 dark:text-white">{att.name}</p>
                                <p className="text-xs text-surface-500">ID: {att.employeeId} • Signed: {new Date(att.signedAt!).toLocaleTimeString()}</p>
                              </div>
                            </div>
                            <button
                              onClick={() => removeAttendee(att.id)}
                              className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg text-red-500 transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 text-surface-400 dark:text-surface-500">
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
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold rounded-xl hover:from-emerald-600 hover:to-teal-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    Complete Toolbox Talk ({currentTalk.attendees.length} signatures)
                  </button>
                </>
              ) : (
                <div className="bg-white dark:bg-surface-800 rounded-2xl p-12 text-center shadow-soft border border-surface-100 dark:border-surface-700">
                  <BookOpen className="w-16 h-16 mx-auto text-surface-300 dark:text-surface-600 mb-4" />
                  <h3 className="text-xl font-bold text-brand-900 dark:text-white mb-2">No Active Toolbox Talk</h3>
                  <p className="text-surface-500 dark:text-surface-400 mb-6">Generate a toolbox talk first to start collecting sign-offs</p>
                  <button
                    onClick={() => setActiveTab('generate')}
                    className="px-6 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors"
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
              className="bg-white dark:bg-surface-800 rounded-2xl p-6 max-w-md w-full shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold text-brand-900 dark:text-white mb-4">Sign Attendance</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={signerName}
                    onChange={e => setSignerName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">Employee ID</label>
                  <input
                    type="text"
                    value={signerId}
                    onChange={e => setSignerId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 dark:border-surface-600 bg-white dark:bg-surface-700 text-surface-900 dark:text-white"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowSignModal(false)}
                  className="flex-1 py-2.5 border border-surface-200 dark:border-surface-600 rounded-xl text-surface-700 dark:text-surface-300 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={addAttendee}
                  disabled={!signerName.trim()}
                  className="flex-1 py-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors disabled:opacity-50"
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
