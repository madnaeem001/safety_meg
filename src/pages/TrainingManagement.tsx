import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  CheckCircle2,
  Clock,
  BookOpen,
  Filter,
  Calendar,
  ShieldCheck,
  TrendingUp,
  AlertCircle,
  User,
  Building2,
  Sparkles,
  Plus,
  Send,
  FileBadge,
} from 'lucide-react';
import { AITrainingGenerator } from '../components/safety/AITrainingGenerator';
import {
  useTrainingCourses,
  useTrainingCompliance,
  useTrainingExpiring,
  useAssignTraining,
} from '../api/hooks/useAPIHooks';

type TrainingTab = 'dashboard' | 'courses' | 'expiring' | 'ai';

const COURSE_CATEGORIES = [
  'All',
  'OSHA Required',
  'EPA Compliance',
  'MSHA Required',
  'Industrial Hygiene',
  'ISO Standards',
  'Job Specific',
  'Company Policy',
] as const;

const ROLE_OPTIONS = [
  'All',
  'Operator',
  'Supervisor',
  'Manager',
  'Safety Officer',
  'Maintenance Tech',
  'Driver',
  'Warehouse Worker',
  'Lab Technician',
  'Healthcare Worker',
  'Contractor',
] as const;

const getPriorityColor = (daysUntilExpiration: number) => {
  if (daysUntilExpiration <= 7) {
    return 'bg-red-50 text-red-700 border-red-200';
  }
  if (daysUntilExpiration <= 14) {
    return 'bg-amber-50 text-amber-700 border-amber-200';
  }
  return 'bg-blue-50 text-blue-700 border-blue-200';
};

const formatDate = (value?: string | null) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

export const TrainingManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TrainingTab>('dashboard');
  const [filterCategory, setFilterCategory] = useState<(typeof COURSE_CATEGORIES)[number]>('All');
  const [filterRole, setFilterRole] = useState<(typeof ROLE_OPTIONS)[number]>('All');
  const [assignmentForm, setAssignmentForm] = useState({
    employeeId: '',
    courseCode: '',
    assignedBy: 'SafetyMEG Admin',
    dueDate: '',
    priority: 'Normal' as 'Low' | 'Normal' | 'High' | 'Critical',
    reason: '',
  });
  const [assignmentMessage, setAssignmentMessage] = useState<string | null>(null);

  const { data: compliance, loading: complianceLoading } = useTrainingCompliance();
  const { data: expiringRecordsData, loading: expiringLoading } = useTrainingExpiring(30);
  const expiringRecords = expiringRecordsData ?? [];
  const { data: coursesData, loading: coursesLoading, refetch: refetchCourses } = useTrainingCourses({
    category: filterCategory === 'All' ? undefined : filterCategory,
    role: filterRole === 'All' ? undefined : filterRole,
    active: true,
  });
  const courses = coursesData ?? [];
  const assignTraining = useAssignTraining();

  const filteredExpiring = expiringRecords.filter((record) =>
    filterRole === 'All' ? true : record.role === filterRole
  );

  const handleAssignmentSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAssignmentMessage(null);

    try {
      await assignTraining.mutate({
        employeeId: assignmentForm.employeeId.trim(),
        courseCode: assignmentForm.courseCode.trim(),
        assignedBy: assignmentForm.assignedBy.trim(),
        dueDate: assignmentForm.dueDate || undefined,
        priority: assignmentForm.priority,
        reason: assignmentForm.reason.trim() || undefined,
      });

      setAssignmentMessage('Training assignment created in backend.');
      setAssignmentForm((current) => ({
        ...current,
        employeeId: '',
        courseCode: '',
        dueDate: '',
        reason: '',
      }));
    } catch (error) {
      setAssignmentMessage(error instanceof Error ? error.message : 'Failed to assign training.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-surface-100 pb-32">


      <main className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-4 mb-4">
            <img src="/logo.png" alt="SafetyMEG" className="w-12 h-12 object-contain" />
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em]">
              <GraduationCap className="w-4 h-4" />
              Training & Compliance
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tight">
            Training Management
          </h1>
          <p className="text-surface-500 max-w-3xl">
            Backend-connected training operations for course governance, expiring certifications, and compliance tracking.
          </p>
        </motion.div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Compliance Dashboard', icon: TrendingUp },
            { id: 'courses', label: 'Course Library', icon: BookOpen },
            { id: 'expiring', label: 'Expiring Records', icon: AlertTriangle },
            { id: 'ai', label: 'AI Training Studio', icon: Sparkles },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TrainingTab)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-brand-900 text-white shadow-lg'
                  : 'bg-white text-brand-700 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'ai' ? (
            <motion.div
              key="ai-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <AITrainingGenerator />
            </motion.div>
          ) : (
            <div className="space-y-8">
              {activeTab === 'dashboard' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                    <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-brand-500" />
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Employees</span>
                      </div>
                      <div className="text-2xl font-bold text-brand-900">{compliance?.uniqueEmployees ?? 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-brand-500" />
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Records</span>
                      </div>
                      <div className="text-2xl font-bold text-brand-900">{compliance?.totalRecords ?? 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Current</span>
                      </div>
                      <div className="text-2xl font-bold text-emerald-600">{compliance?.current ?? 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Expiring</span>
                      </div>
                      <div className="text-2xl font-bold text-amber-600">{compliance?.expiringSoon ?? 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Expired</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{compliance?.expired ?? 0}</div>
                    </div>
                    <div className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-brand-500" />
                        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Compliance</span>
                      </div>
                      <div className="text-2xl font-bold text-brand-900">{compliance?.complianceRate ?? 0}%</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-amber-500" />
                        <h3 className="font-bold text-brand-900">Next 30 Days Risk Window</h3>
                      </div>
                      {expiringLoading ? (
                        <p className="text-sm text-surface-500">Loading expiring training records...</p>
                      ) : filteredExpiring.length > 0 ? (
                        <div className="space-y-3">
                          {filteredExpiring.slice(0, 5).map((record) => (
                            <div key={record.id} className="p-4 rounded-2xl border border-surface-100 bg-surface-50 flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-brand-900">{record.employeeName}</p>
                                <p className="text-sm text-surface-500">{record.courseName}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-surface-400">
                                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{record.role}</span>
                                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{record.department || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(record.expirationDate)}</span>
                                </div>
                              </div>
                              <span className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase ${getPriorityColor(record.daysUntilExpiration)}`}>
                                {record.daysUntilExpiration}d left
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-surface-500">No expiring records found for the current filter.</p>
                      )}
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 space-y-4">
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-brand-500" />
                        <h3 className="font-bold text-brand-900">Quick Assignment</h3>
                      </div>
                      <form onSubmit={handleAssignmentSubmit} className="space-y-3">
                        <input
                          value={assignmentForm.employeeId}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, employeeId: event.target.value }))}
                          placeholder="Employee ID"
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          required
                        />
                        <input
                          value={assignmentForm.courseCode}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, courseCode: event.target.value }))}
                          placeholder="Course code"
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          required
                        />
                        <input
                          value={assignmentForm.assignedBy}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, assignedBy: event.target.value }))}
                          placeholder="Assigned by"
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <input
                            type="date"
                            value={assignmentForm.dueDate}
                            onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          />
                          <select
                            value={assignmentForm.priority}
                            onChange={(event) => setAssignmentForm((current) => ({ ...current, priority: event.target.value as 'Low' | 'Normal' | 'High' | 'Critical' }))}
                            className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400"
                          >
                            <option value="Low">Low</option>
                            <option value="Normal">Normal</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                        <textarea
                          value={assignmentForm.reason}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, reason: event.target.value }))}
                          placeholder="Reason or trigger"
                          rows={3}
                          className="w-full px-4 py-3 rounded-xl border border-surface-200 bg-surface-50 text-sm outline-none focus:border-brand-400 resize-none"
                        />
                        <button
                          type="submit"
                          disabled={assignTraining.loading}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-brand-900 text-white text-sm font-bold disabled:opacity-60"
                        >
                          {assignTraining.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                          {assignTraining.loading ? 'Assigning...' : 'Assign Training'}
                        </button>
                      </form>
                      {assignmentMessage && (
                        <div className={`rounded-xl px-4 py-3 text-sm ${assignTraining.error ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                          {assignmentMessage}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100">
                    <div className="flex items-center gap-2 mb-4">
                      <FileBadge className="w-5 h-5 text-brand-500" />
                      <h3 className="font-bold text-brand-900">Operational Notes</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                        <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Overdue Assignments</div>
                        <div className="text-2xl font-bold text-brand-900">{compliance?.overdueAssignments ?? 0}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                        <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Course Library</div>
                        <div className="text-2xl font-bold text-brand-900">{courses.length}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                        <div className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-2">Backend Sync</div>
                        <div className="text-sm text-surface-600">
                          Courses, compliance, expiring records, and assignments now use backend endpoints.
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'courses' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {COURSE_CATEGORIES.map((category) => (
                        <button
                          key={category}
                          onClick={() => setFilterCategory(category)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            filterCategory === category
                              ? 'bg-brand-100 text-brand-700'
                              : 'bg-white text-surface-500 border border-surface-200'
                          }`}
                        >
                          {category}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-surface-200 text-sm text-surface-500">
                        <Filter className="w-4 h-4" />
                        <select
                          value={filterRole}
                          onChange={(event) => setFilterRole(event.target.value as (typeof ROLE_OPTIONS)[number])}
                          className="bg-transparent outline-none"
                        >
                          {ROLE_OPTIONS.map((role) => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                        </select>
                      </div>
                      <button
                        onClick={() => refetchCourses()}
                        className="px-4 py-2 rounded-xl bg-brand-900 text-white text-sm font-bold"
                      >
                        Refresh
                      </button>
                    </div>
                  </div>

                  {coursesLoading ? (
                    <div className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100 text-surface-500">
                      Loading training courses from backend...
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {courses.map((course) => (
                        <div key={course.id} className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
                          <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <span className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em]">
                                {course.courseCode}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-brand-900 leading-tight">{course.title}</h3>
                              <p className="text-sm text-surface-500 mt-2 min-h-[40px]">
                                {course.description || 'No backend description available for this course yet.'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 text-[10px] font-bold uppercase">
                                {course.category}
                              </span>
                              {course.deliveryMethod && (
                                <span className="px-2.5 py-1 rounded-full bg-surface-100 text-surface-600 text-[10px] font-bold uppercase">
                                  {course.deliveryMethod}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                                <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Duration</div>
                                <div className="font-semibold text-brand-900 mt-1">{course.durationHours}h</div>
                              </div>
                              <div className="p-3 rounded-xl bg-surface-50 border border-surface-100">
                                <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider">Validity</div>
                                <div className="font-semibold text-brand-900 mt-1">
                                  {course.validityMonths > 0 ? `${course.validityMonths} mo` : 'One-time'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-5 py-4 bg-surface-50 border-t border-surface-100">
                            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-wider mb-2">Required Roles</div>
                            <div className="flex flex-wrap gap-2">
                              {course.requiredForRoles.length > 0 ? (
                                course.requiredForRoles.map((role) => (
                                  <span key={`${course.id}-${role}`} className="px-2.5 py-1 rounded-full bg-white border border-surface-200 text-xs text-surface-600">
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-surface-400">No role mapping available.</span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'expiring' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role}
                        onClick={() => setFilterRole(role)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                          filterRole === role
                            ? 'bg-brand-100 text-brand-700'
                            : 'bg-white text-surface-500 border border-surface-200'
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>

                  <div className="bg-white rounded-2xl border border-surface-200 shadow-soft overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-50 border-b border-surface-200">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Role / Dept</th>
                          <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Course</th>
                          <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Expiration</th>
                          <th className="px-6 py-4 text-xs font-bold text-surface-500 uppercase tracking-wider">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-100">
                        {filteredExpiring.map((record) => (
                          <tr key={record.id} className="hover:bg-surface-50/50 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-bold text-xs">
                                  {record.employeeName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium text-brand-900">{record.employeeName}</div>
                                  <div className="text-[10px] font-bold text-surface-400 uppercase">{record.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-brand-900">{record.role}</div>
                              <div className="text-[10px] font-bold text-surface-400 uppercase">{record.department || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-brand-900">{record.courseName}</div>
                              <div className="text-[10px] font-bold text-surface-400 uppercase">{record.courseCode}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-surface-600">{formatDate(record.expirationDate)}</td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${getPriorityColor(record.daysUntilExpiration)}`}>
                                {record.daysUntilExpiration <= 7 ? <AlertCircle className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                                {record.daysUntilExpiration} days
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!expiringLoading && filteredExpiring.length === 0 && (
                      <div className="px-6 py-8 text-sm text-surface-500">No expiring records matched the current role filter.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        {complianceLoading && activeTab !== 'ai' && (
          <div className="text-sm text-surface-400">Refreshing training compliance data...</div>
        )}
      </main>
    </div>
  );
};

export default TrainingManagement;
