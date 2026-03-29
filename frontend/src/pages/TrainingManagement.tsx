import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  AlertTriangle,
  Clock,
  BookOpen,
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
import { SMCard, SMButton, SMSkeleton, SMBadge, SMAlert, SMInput, SMSelect } from '../components/ui';
import PageContainer from '../layouts/PageContainer';

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

const ROLE_SELECT_OPTIONS = ROLE_OPTIONS.map((role) => ({
  value: role,
  label: role,
}));

const PRIORITY_OPTIONS = [
  { value: 'Low', label: 'Low' },
  { value: 'Normal', label: 'Normal' },
  { value: 'High', label: 'High' },
  { value: 'Critical', label: 'Critical' },
] as const;

const getPriorityBadgeVariant = (daysUntilExpiration: number): 'danger' | 'warning' | 'neutral' => {
  if (daysUntilExpiration <= 7) return 'danger';
  if (daysUntilExpiration <= 14) return 'warning';
  return 'neutral';
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
    <PageContainer title="Training Management" maxWidth="xl">
      <div className="space-y-8">

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {[
            { id: 'dashboard', label: 'Compliance Dashboard', icon: TrendingUp },
            { id: 'courses', label: 'Course Library', icon: BookOpen },
            { id: 'expiring', label: 'Expiring Records', icon: AlertTriangle },
            { id: 'ai', label: 'AI Training Studio', icon: Sparkles },
          ].map((tab) => (
            <SMButton
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setActiveTab(tab.id as TrainingTab)}
              leftIcon={<tab.icon className="w-4 h-4" />}
            >
              {tab.label}
            </SMButton>
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
                    <SMCard className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Users className="w-5 h-5 text-accent" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Employees</span>
                      </div>
                      <div className="text-2xl font-bold text-text-primary">{compliance?.uniqueEmployees ?? 0}</div>
                    </SMCard>
                    <SMCard className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <BookOpen className="w-5 h-5 text-accent" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Records</span>
                      </div>
                      <div className="text-2xl font-bold text-text-primary">{compliance?.totalRecords ?? 0}</div>
                    </SMCard>
                    <SMCard className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-5 h-5 text-success" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Current</span>
                      </div>
                      <div className="text-2xl font-bold text-success">{compliance?.current ?? 0}</div>
                    </SMCard>
                    <SMCard className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="w-5 h-5 text-warning" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Expiring</span>
                      </div>
                      <div className="text-2xl font-bold text-warning">{compliance?.expiringSoon ?? 0}</div>
                    </SMCard>
                    <SMCard className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="w-5 h-5 text-danger" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Expired</span>
                      </div>
                      <div className="text-2xl font-bold text-danger">{compliance?.expired ?? 0}</div>
                    </SMCard>
                    <SMCard className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="w-5 h-5 text-accent" />
                        <span className="text-xs font-bold text-text-muted uppercase tracking-wider">Compliance</span>
                      </div>
                      <div className="text-2xl font-bold text-text-primary">{compliance?.complianceRate ?? 0}%</div>
                    </SMCard>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.15fr_0.85fr] gap-6">
                    <SMCard className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <h3 className="font-bold text-text-primary">Next 30 Days Risk Window</h3>
                      </div>
                      {expiringLoading ? (
                        <div className="space-y-3">
                          {Array.from({ length: 3 }).map((_, index) => (
                            <div key={index} className="p-4 rounded-2xl border border-surface-border bg-surface-raised flex items-start justify-between gap-3">
                              <div className="flex-1 space-y-2.5">
                                <SMSkeleton className="h-4 w-40 rounded-lg" />
                                <SMSkeleton className="h-3 w-56 rounded-lg" />
                                <div className="flex flex-wrap gap-3">
                                  <SMSkeleton className="h-3 w-20 rounded-lg" />
                                  <SMSkeleton className="h-3 w-24 rounded-lg" />
                                  <SMSkeleton className="h-3 w-28 rounded-lg" />
                                </div>
                              </div>
                              <SMSkeleton className="h-6 w-20 rounded-full" />
                            </div>
                          ))}
                        </div>
                      ) : filteredExpiring.length > 0 ? (
                        <div className="space-y-3">
                          {filteredExpiring.slice(0, 5).map((record) => (
                            <div key={record.id} className="p-4 rounded-2xl border border-surface-border bg-surface-sunken flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-text-primary">{record.employeeName}</p>
                                <p className="text-sm text-text-secondary">{record.courseName}</p>
                                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-text-muted">
                                  <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{record.role}</span>
                                  <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{record.department || 'N/A'}</span>
                                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDate(record.expirationDate)}</span>
                                </div>
                              </div>
                              <SMBadge variant={getPriorityBadgeVariant(record.daysUntilExpiration)} size="sm">
                                {record.daysUntilExpiration}d left
                              </SMBadge>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-text-muted">No expiring records found for the current filter.</p>
                      )}
                    </SMCard>

                    <SMCard className="p-6 space-y-4">
                      <div className="flex items-center gap-2">
                        <Send className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-text-primary">Quick Assignment</h3>
                      </div>
                      <form onSubmit={handleAssignmentSubmit} className="space-y-3">
                        <SMInput
                          value={assignmentForm.employeeId}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, employeeId: event.target.value }))}
                          placeholder="Employee ID"
                          required
                        />
                        <SMInput
                          value={assignmentForm.courseCode}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, courseCode: event.target.value }))}
                          placeholder="Course code"
                          required
                        />
                        <SMInput
                          value={assignmentForm.assignedBy}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, assignedBy: event.target.value }))}
                          placeholder="Assigned by"
                          required
                        />
                        <div className="grid grid-cols-2 gap-3">
                          <SMInput
                            type="date"
                            value={assignmentForm.dueDate}
                            onChange={(event) => setAssignmentForm((current) => ({ ...current, dueDate: event.target.value }))}
                          />
                          <SMSelect
                            value={assignmentForm.priority}
                            options={[...PRIORITY_OPTIONS]}
                            onChange={(event) => setAssignmentForm((current) => ({ ...current, priority: event.target.value as 'Low' | 'Normal' | 'High' | 'Critical' }))}
                          />
                        </div>
                        <SMInput
                          as="textarea"
                          value={assignmentForm.reason}
                          onChange={(event) => setAssignmentForm((current) => ({ ...current, reason: event.target.value }))}
                          placeholder="Reason or trigger"
                          rows={3}
                        />
                        <SMButton
                          variant="primary"
                          type="submit"
                          className="w-full"
                          loading={assignTraining.loading}
                          leftIcon={assignTraining.loading ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        >
                          {assignTraining.loading ? 'Assigning...' : 'Assign Training'}
                        </SMButton>
                      </form>
                      {assignmentMessage && (
                        <SMAlert variant={assignTraining.error ? 'danger' : 'success'}>
                          {assignmentMessage}
                        </SMAlert>
                      )}
                    </SMCard>
                  </div>

                  <SMCard className="p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FileBadge className="w-5 h-5 text-accent" />
                        <h3 className="font-bold text-text-primary">Operational Notes</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="p-4 rounded-2xl bg-surface-sunken border border-surface-border">
                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Overdue Assignments</div>
                        <div className="text-2xl font-bold text-text-primary">{compliance?.overdueAssignments ?? 0}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-sunken border border-surface-border">
                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Course Library</div>
                        <div className="text-2xl font-bold text-text-primary">{courses.length}</div>
                      </div>
                      <div className="p-4 rounded-2xl bg-surface-sunken border border-surface-border">
                        <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Backend Sync</div>
                        <div className="text-sm text-text-secondary">
                          Courses, compliance, expiring records, and assignments now use backend endpoints.
                        </div>
                      </div>
                    </div>
                  </SMCard>
                </motion.div>
              )}

              {activeTab === 'courses' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                      {COURSE_CATEGORIES.map((category) => (
                        <SMButton
                          key={category}
                          variant={filterCategory === category ? 'primary' : 'secondary'}
                          size="sm"
                          onClick={() => setFilterCategory(category)}
                        >
                          {category}
                        </SMButton>
                      ))}
                    </div>

                    <div className="flex items-center gap-3">
                      <SMSelect
                        value={filterRole}
                        options={ROLE_SELECT_OPTIONS}
                        onChange={(event) => setFilterRole(event.target.value as (typeof ROLE_OPTIONS)[number])}
                      />
                      <SMButton variant="primary" size="sm" onClick={() => refetchCourses()}>Refresh</SMButton>
                    </div>
                  </div>

                  {coursesLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {Array.from({ length: 3 }).map((_, index) => (
                        <SMCard key={index} className="overflow-hidden">
                          <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <SMSkeleton className="h-11 w-11 rounded-2xl" />
                              <SMSkeleton className="h-3 w-16 rounded-lg" />
                            </div>
                            <div className="space-y-2">
                              <SMSkeleton className="h-5 w-2/3 rounded-lg" />
                              <SMSkeleton rows={2} className="h-4 w-full rounded-lg" gap="gap-2" />
                            </div>
                            <div className="flex gap-2">
                              <SMSkeleton className="h-6 w-24 rounded-full" />
                              <SMSkeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <SMSkeleton className="h-16 w-full rounded-xl" />
                              <SMSkeleton className="h-16 w-full rounded-xl" />
                            </div>
                          </div>
                          <div className="px-5 py-4 bg-surface-sunken border-t border-surface-border">
                            <SMSkeleton className="h-3 w-28 rounded-lg mb-3" />
                            <div className="flex gap-2 flex-wrap">
                              <SMSkeleton className="h-6 w-20 rounded-full" />
                              <SMSkeleton className="h-6 w-24 rounded-full" />
                            </div>
                          </div>
                        </SMCard>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {courses.map((course) => (
                        <SMCard key={course.id} className="overflow-hidden">
                          <div className="p-5 space-y-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <span className="text-xs font-bold text-text-muted uppercase tracking-[0.2em]">
                                {course.courseCode}
                              </span>
                            </div>
                            <div>
                              <h3 className="font-bold text-text-primary leading-tight">{course.title}</h3>
                              <p className="text-sm text-text-secondary mt-2 min-h-[40px]">
                                {course.description || 'No backend description available for this course yet.'}
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <SMBadge variant="teal">{course.category}</SMBadge>
                              {course.deliveryMethod && (
                                <SMBadge variant="neutral">{course.deliveryMethod}</SMBadge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div className="p-3 rounded-xl bg-surface-sunken border border-surface-border">
                                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Duration</div>
                                <div className="font-semibold text-text-primary mt-1">{course.durationHours}h</div>
                              </div>
                              <div className="p-3 rounded-xl bg-surface-sunken border border-surface-border">
                                <div className="text-xs font-bold text-text-muted uppercase tracking-wider">Validity</div>
                                <div className="font-semibold text-text-primary mt-1">
                                  {course.validityMonths > 0 ? `${course.validityMonths} mo` : 'One-time'}
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="px-5 py-4 bg-surface-sunken border-t border-surface-border">
                            <div className="text-xs font-bold text-text-muted uppercase tracking-wider mb-2">Required Roles</div>
                            <div className="flex flex-wrap gap-2">
                              {course.requiredForRoles.length > 0 ? (
                                course.requiredForRoles.map((role) => (
                                  <span key={`${course.id}-${role}`} className="px-2.5 py-1 rounded-full bg-surface-overlay border border-surface-border text-xs text-text-secondary">
                                    {role}
                                  </span>
                                ))
                              ) : (
                                <span className="text-xs text-text-muted">No role mapping available.</span>
                              )}
                            </div>
                          </div>
                        </SMCard>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'expiring' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-wrap gap-2">
                    {ROLE_OPTIONS.map((role) => (
                      <SMButton
                        key={role}
                        variant={filterRole === role ? 'primary' : 'secondary'}
                        size="sm"
                        onClick={() => setFilterRole(role)}
                      >
                        {role}
                      </SMButton>
                    ))}
                  </div>

                  <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-soft overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-surface-sunken border-b border-surface-border">
                        <tr>
                          <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Employee</th>
                          <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Role / Dept</th>
                          <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Course</th>
                          <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Expiration</th>
                          <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Priority</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-surface-border">
                        {expiringLoading ? Array.from({ length: 5 }).map((_, index) => (
                          <tr key={index}>
                            <td className="px-6 py-4"><SMSkeleton className="h-12 w-full rounded-xl" /></td>
                            <td className="px-6 py-4"><SMSkeleton className="h-12 w-full rounded-xl" /></td>
                            <td className="px-6 py-4"><SMSkeleton className="h-12 w-full rounded-xl" /></td>
                            <td className="px-6 py-4"><SMSkeleton className="h-12 w-full rounded-xl" /></td>
                            <td className="px-6 py-4"><SMSkeleton className="h-12 w-full rounded-xl" /></td>
                          </tr>
                        )) : filteredExpiring.map((record) => (
                          <tr key={record.id} className="hover:bg-surface-overlay/30 transition-colors">
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-xs">
                                  {record.employeeName.split(' ').map((name) => name[0]).join('').slice(0, 2)}
                                </div>
                                <div>
                                  <div className="font-medium text-text-primary">{record.employeeName}</div>
                                  <div className="text-xs font-bold text-text-muted uppercase">{record.employeeId}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-text-primary">{record.role}</div>
                              <div className="text-xs font-bold text-text-muted uppercase">{record.department || 'N/A'}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-text-primary">{record.courseName}</div>
                              <div className="text-xs font-bold text-text-muted uppercase">{record.courseCode}</div>
                            </td>
                            <td className="px-6 py-4 text-sm text-text-secondary">{formatDate(record.expirationDate)}</td>
                            <td className="px-6 py-4">
                              <SMBadge variant={getPriorityBadgeVariant(record.daysUntilExpiration)} size="sm">
                                {record.daysUntilExpiration <= 7 ? <AlertCircle className="w-3 h-3 mr-1" /> : <Clock className="w-3 h-3 mr-1" />}
                                {record.daysUntilExpiration} days
                              </SMBadge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!expiringLoading && filteredExpiring.length === 0 && (
                      <div className="px-6 py-8 text-sm text-text-muted">No expiring records matched the current role filter.</div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </AnimatePresence>

        {complianceLoading && activeTab !== 'ai' && (
          <div className="text-sm text-text-muted">Refreshing training compliance data...</div>
        )}
      </div>
    </PageContainer>
  );
};

export default TrainingManagement;
