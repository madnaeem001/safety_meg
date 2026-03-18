import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, FileText, Archive, Download,
  ThumbsUp, ThumbsDown, MessageSquare, AlertTriangle,
  Lock, Plus, Trash2, Loader2, X,
} from 'lucide-react';
import {
  useProjectClosures,
  useClosureDetail,
  useAddClosureDeliverable,
  useUpdateClosureDeliverable,
  useDeleteClosureDeliverable,
  useAddClosureLesson,
  useDeleteClosureLesson,
  useArchiveClosure,
  useGenerateClosureReport,
} from '../../api/hooks/useAPIHooks';
import type {
  ClosureDeliverableRecord,
  ClosureLessonRecord,
  ClosureReportRecord,
} from '../../api/services/apiService';
import { SMCard } from '../../components/ui';

// ── Add Deliverable Modal ─────────────────────────────────────────────────────

interface AddDeliverableModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<ClosureDeliverableRecord, 'id' | 'closureId' | 'createdAt'>) => void;
  loading: boolean;
}

const AddDeliverableModal: React.FC<AddDeliverableModalProps> = ({ onClose, onSubmit, loading }) => {
  const [name, setName] = useState('');
  const [approver, setApprover] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState<'Accepted' | 'Pending' | 'Rejected'>('Pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !approver.trim()) return;
    onSubmit({ name: name.trim(), approver: approver.trim(), date: date || '-', status });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        role="dialog"
        aria-label="Add deliverable dialog"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Deliverable</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deliverable Name *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-label="Deliverable name"
              placeholder="e.g. Final Security Audit Report"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Approver *</label>
            <input
              value={approver}
              onChange={(e) => setApprover(e.target.value)}
              required
              aria-label="Approver"
              placeholder="e.g. CTO"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as 'Accepted' | 'Pending' | 'Rejected')}
              aria-label="Deliverable status"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="Pending">Pending Review</option>
              <option value="Accepted">Accepted</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-label="Deliverable date"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim() || !approver.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Deliverable'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Add Lesson Modal ──────────────────────────────────────────────────────────

interface AddLessonModalProps {
  onClose: () => void;
  onSubmit: (data: Omit<ClosureLessonRecord, 'id' | 'closureId' | 'createdAt'>) => void;
  loading: boolean;
}

const AddLessonModal: React.FC<AddLessonModalProps> = ({ onClose, onSubmit, loading }) => {
  const [category, setCategory] = useState<'Process' | 'Technology' | 'People' | 'Product'>('Process');
  const [description, setDescription] = useState('');
  const [impact, setImpact] = useState<'Positive' | 'Negative'>('Positive');
  const [recommendation, setRecommendation] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim() || !recommendation.trim()) return;
    onSubmit({ category, description: description.trim(), impact, recommendation: recommendation.trim() });
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        role="dialog"
        aria-label="Add lesson dialog"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-slate-900">Add Lesson Learned</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as 'Process' | 'Technology' | 'People' | 'Product')}
                aria-label="Category"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {(['Process', 'Technology', 'People', 'Product'] as const).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Impact</label>
              <select
                value={impact}
                onChange={(e) => setImpact(e.target.value as 'Positive' | 'Negative')}
                aria-label="Impact"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              >
                <option value="Positive">Positive</option>
                <option value="Negative">Negative</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Description *</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              aria-label="Description"
              rows={3}
              placeholder="What happened?"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Recommendation *</label>
            <textarea
              value={recommendation}
              onChange={(e) => setRecommendation(e.target.value)}
              required
              aria-label="Recommendation"
              rows={2}
              placeholder="What should be done differently?"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm resize-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 rounded-lg text-slate-700 text-sm hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !description.trim() || !recommendation.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Lesson'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────

export const ProjectClosure: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'checklist' | 'lessons' | 'report'>('checklist');
  const [showAddDeliverable, setShowAddDeliverable] = useState(false);
  const [showAddLesson, setShowAddLesson] = useState(false);
  const [report, setReport] = useState<ClosureReportRecord | null>(null);

  // ── Data hooks ──
  const closureList   = useProjectClosures();
  const closureId     = closureList.data?.[0]?.id ?? null;
  const closureDetail = useClosureDetail(closureId);

  // ── Mutation hooks ──
  const addDeliverable    = useAddClosureDeliverable();
  const updateDeliverable = useUpdateClosureDeliverable();
  const deleteDeliverable = useDeleteClosureDeliverable();
  const addLesson         = useAddClosureLesson();
  const deleteLesson      = useDeleteClosureLesson();
  const archive           = useArchiveClosure();
  const generateReport    = useGenerateClosureReport();

  const closure      = closureDetail.data;
  const isLoading    = closureList.loading || (closureId !== null && closureDetail.loading && !closure);
  const isArchived   = closure?.status === 'Archived';
  const deliverables = closure?.deliverables ?? [];
  const lessons      = closure?.lessons ?? [];

  // ── Handlers ──

  const handleStatusChange = async (deliverableId: number, status: 'Accepted' | 'Pending' | 'Rejected') => {
    if (!closureId) return;
    await updateDeliverable.mutate({ closureId, deliverableId, data: { status } });
    await closureDetail.refetch();
  };

  const handleAddDeliverable = async (
    data: Omit<ClosureDeliverableRecord, 'id' | 'closureId' | 'createdAt'>
  ) => {
    if (!closureId) return;
    await addDeliverable.mutate({ closureId, data });
    await closureDetail.refetch();
    setShowAddDeliverable(false);
  };

  const handleDeleteDeliverable = async (deliverableId: number) => {
    if (!closureId) return;
    await deleteDeliverable.mutate({ closureId, deliverableId });
    await closureDetail.refetch();
  };

  const handleAddLesson = async (
    data: Omit<ClosureLessonRecord, 'id' | 'closureId' | 'createdAt'>
  ) => {
    if (!closureId) return;
    await addLesson.mutate({ closureId, data });
    await closureDetail.refetch();
    setShowAddLesson(false);
  };

  const handleDeleteLesson = async (lessonId: number) => {
    if (!closureId) return;
    await deleteLesson.mutate({ closureId, lessonId });
    await closureDetail.refetch();
  };

  const handleArchive = async () => {
    if (!closureId) return;
    if (!window.confirm('Archive this project? This marks it as complete and read-only.')) return;
    await archive.mutate(closureId);
    await closureDetail.refetch();
  };

  const handleGenerateReport = async () => {
    if (!closureId) return;
    const result = await generateReport.mutate(closureId);
    if (result) setReport(result);
    await closureDetail.refetch();
  };

  const handleExportReport = () => {
    if (!closure) return;
    const content = [
      `PROJECT CLOSURE REPORT`,
      `Project: ${closure.name}`,
      `Status: ${closure.status}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      `DELIVERABLES (${deliverables.filter((d) => d.status === 'Accepted').length}/${deliverables.length} Accepted)`,
      ...deliverables.map((d) => `  [${d.status}] ${d.name} — ${d.approver} (${d.date})`),
      '',
      `LESSONS LEARNED (${lessons.length} items)`,
      ...lessons.map((l) => `  [${l.impact}][${l.category}] ${l.description}\n  → ${l.recommendation}`),
    ].join('\n');

    const blob = new Blob([content], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${closure.name.replace(/\s+/g, '_')}_Closure_Report.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin mr-3" />
        <span>Loading project closure…</span>
      </div>
    );
  }

  // ── Error state ──
  if (closureList.error || closureDetail.error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600 gap-2">
        <AlertTriangle className="w-6 h-6" />
        <span>Failed to load project closure data.</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6 p-6 max-w-7xl mx-auto"
    >
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Project Closure</h2>
          <p className="text-slate-500 flex items-center gap-2">
            {closure?.name ?? 'Final Review, Handover & Archival'}
            {isArchived && (
              <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs rounded-full">
                Archived
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExportReport}
            aria-label="Export report"
            className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export Report
          </button>
          <button
            onClick={handleArchive}
            disabled={archive.loading || isArchived}
            aria-label="Archive project"
            className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-50"
          >
            {archive.loading
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Archive className="w-4 h-4" />}
            {isArchived ? 'Archived' : 'Archive Project'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {[
          { id: 'checklist', label: 'Deliverables Checklist', icon: CheckCircle2 },
          { id: 'lessons',   label: 'Lessons Learned',        icon: MessageSquare },
          { id: 'report',    label: 'Final Report',            icon: FileText },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'checklist' | 'lessons' | 'report')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content Panel */}
      <SMCard className="min-h-[400px]">

        {/* ── Deliverables Checklist ── */}
        {activeTab === 'checklist' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Final Deliverables Acceptance</h3>
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                  {deliverables.filter((d) => d.status === 'Accepted').length} / {deliverables.length} Accepted
                </span>
                <button
                  onClick={() => setShowAddDeliverable(true)}
                  aria-label="Add deliverable"
                  className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>
            </div>

            {deliverables.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No deliverables yet. Click <strong>Add</strong> to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {deliverables.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        item.status === 'Accepted' ? 'bg-green-100 text-green-600' :
                        item.status === 'Rejected' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-600'
                      }`}>
                        {item.status === 'Accepted' ? <CheckCircle2 className="w-5 h-5" /> :
                         item.status === 'Rejected' ? <AlertTriangle className="w-5 h-5" /> :
                         <Lock className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-medium text-slate-900">{item.name}</h4>
                        <p className="text-sm text-slate-500">
                          Approver: {item.approver} • Date: {item.date}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <select
                        value={item.status}
                        onChange={(e) =>
                          handleStatusChange(item.id, e.target.value as 'Accepted' | 'Pending' | 'Rejected')
                        }
                        aria-label={`Status for ${item.name}`}
                        className="text-sm border border-slate-200 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-2 py-1"
                      >
                        <option value="Pending">Pending Review</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                      <button
                        onClick={() => handleDeleteDeliverable(item.id)}
                        aria-label={`Delete deliverable ${item.name}`}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Lessons Learned ── */}
        {activeTab === 'lessons' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-slate-900">Retrospective & Lessons Learned</h3>
              <button
                onClick={() => setShowAddLesson(true)}
                aria-label="Add lesson"
                className="flex items-center gap-1 text-sm text-blue-600 font-medium hover:underline"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            {lessons.length === 0 ? (
              <p className="text-slate-400 text-center py-8">
                No lessons recorded yet. Click <strong>Add Item</strong> to get started.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.id}
                    className={`p-4 rounded-xl border ${
                      lesson.impact === 'Positive'
                        ? 'bg-green-50 border-green-100'
                        : 'bg-red-50 border-red-100'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        lesson.impact === 'Positive'
                          ? 'bg-green-200 text-green-800'
                          : 'bg-red-200 text-red-800'
                      }`}>
                        {lesson.category}
                      </span>
                      <div className="flex items-center gap-2">
                        {lesson.impact === 'Positive'
                          ? <ThumbsUp  className="w-4 h-4 text-green-600" />
                          : <ThumbsDown className="w-4 h-4 text-red-600" />}
                        <button
                          onClick={() => handleDeleteLesson(lesson.id)}
                          aria-label={`Delete lesson ${lesson.description}`}
                          className="text-slate-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="font-medium text-slate-900 mb-2">{lesson.description}</p>
                    <div className="text-sm text-slate-600 bg-white/50 p-2 rounded">
                      <strong>Recommendation:</strong> {lesson.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Final Report ── */}
        {activeTab === 'report' && (
          <div className="p-6">
            {report ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-slate-900">Project Closure Report</h3>
                  <span className="text-sm text-slate-500">
                    Generated {new Date(report.generatedAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[
                    { label: 'Deliverables',   value: report.summary.totalDeliverables, sub: 'total' },
                    { label: 'Accepted',        value: report.summary.accepted,          sub: `${report.summary.acceptanceRate}% rate` },
                    { label: 'Lessons Learned', value: report.summary.totalLessons,      sub: 'recorded' },
                    { label: 'Positive',        value: report.summary.positiveLessons,   sub: `${report.summary.negativeLessons} negative` },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-slate-50 rounded-xl p-4 text-center">
                      <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
                      <div className="text-sm font-medium text-slate-700">{stat.label}</div>
                      <div className="text-xs text-slate-400">{stat.sub}</div>
                    </div>
                  ))}
                </div>

                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Deliverables Summary</h4>
                  <div className="space-y-2">
                    {report.deliverables.map((d) => (
                      <div
                        key={d.id}
                        className="flex items-center justify-between text-sm py-2 border-b border-slate-100"
                      >
                        <span className="text-slate-700">{d.name}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          d.status === 'Accepted' ? 'bg-green-100 text-green-700' :
                          d.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {d.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Project Closure Report</h3>
                <p className="text-slate-500 max-w-md mx-auto mb-6">
                  The final project report summarizes deliverable acceptance and lessons learned.
                </p>
                <button
                  onClick={handleGenerateReport}
                  disabled={generateReport.loading}
                  aria-label="Generate final report"
                  className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {generateReport.loading && <Loader2 className="w-4 h-4 animate-spin" />}
                  Generate Final Report
                </button>
              </div>
            )}
          </div>
        )}
      </SMCard>

      {/* Modals */}
      {showAddDeliverable && (
        <AddDeliverableModal
          onClose={() => setShowAddDeliverable(false)}
          onSubmit={handleAddDeliverable}
          loading={addDeliverable.loading}
        />
      )}
      {showAddLesson && (
        <AddLessonModal
          onClose={() => setShowAddLesson(false)}
          onSubmit={handleAddLesson}
          loading={addLesson.loading}
        />
      )}
    </motion.div>
  );
};
