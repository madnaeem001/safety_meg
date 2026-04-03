import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CalendarDays, Plus, Trash2, ToggleLeft, ToggleRight, RefreshCw, Activity, PauseCircle } from 'lucide-react';
import {
  SMButton, SMCard, SMCardBody, SMBadge, SMPageHeader,
  SMSkeleton, SMStatCard,
} from '../../components/ui';
import { useToastStore } from '../../store/useToastStore';
import { getAPIConfig } from '../../api/services/apiService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuditSchedule {
  id: string;
  title: string;
  site_id: number;
  rrule_string: string;
  next_run_at: number | null;
  last_run_at: number | null;
  is_active: boolean;
  created_at: number;
}

const SITE_NAMES: Record<number, string> = {
  1: 'Plant A — Birmingham',
  2: 'Plant B — Manchester',
  3: 'Offshore Rig Alpha',
  4: 'Head Office — London',
  5: 'Distribution Centre — Leeds',
};

function formatEpoch(ms: number | null): string {
  if (!ms) return '—';
  return new Date(ms).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function humanRRule(rrule: string): string {
  const freq = rrule.match(/FREQ=(\w+)/)?.[1] ?? '';
  const interval = rrule.match(/INTERVAL=(\d+)/)?.[1];
  const byDay = rrule.match(/BYDAY=([^;]+)/)?.[1];

  const freqLabel: Record<string, string> = {
    DAILY: 'Daily',
    WEEKLY: 'Weekly',
    MONTHLY: 'Monthly',
  };

  let label = interval && interval !== '1' ? `Every ${interval} ` : '';
  label += (freqLabel[freq] ?? freq).toLowerCase();
  if (byDay) label += ` on ${byDay}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AuditScheduleList: React.FC = () => {
  const navigate = useNavigate();
  const { addToast } = useToastStore();
  const [schedules, setSchedules] = useState<AuditSchedule[]>([]);
  const [loading, setLoading] = useState(true);

  const { baseURL } = getAPIConfig();

  const fetchSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${baseURL}/audit-schedules`);
      const json = await res.json();
      if (json.success) setSchedules(json.data);
    } catch {
      addToast({ message: 'Failed to load schedules', variant: 'error', duration: 3000 });
    } finally {
      setLoading(false);
    }
  }, [baseURL, addToast]);

  useEffect(() => { fetchSchedules(); }, [fetchSchedules]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`${baseURL}/audit-schedules/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSchedules((prev) => prev.filter((s) => s.id !== id));
        addToast({ message: 'Schedule deleted', variant: 'success', duration: 3000 });
      } else {
        addToast({ message: json.error ?? 'Delete failed', variant: 'error', duration: 3000 });
      }
    } catch {
      addToast({ message: 'Delete failed', variant: 'error', duration: 3000 });
    }
  };

  const handleToggle = async (schedule: AuditSchedule) => {
    try {
      const res = await fetch(`${baseURL}/audit-schedules/${schedule.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !schedule.is_active }),
      });
      const json = await res.json();
      if (json.success) {
        setSchedules((prev) =>
          prev.map((s) => (s.id === schedule.id ? { ...s, is_active: !s.is_active } : s))
        );
        addToast({
          message: `Schedule ${schedule.is_active ? 'paused' : 'activated'}`,
          variant: 'success',
          duration: 3000,
        });
      }
    } catch {
      addToast({ message: 'Update failed', variant: 'error', duration: 3000 });
    }
  };

  const activeCount = schedules.filter((s) => s.is_active).length;
  const pausedCount = schedules.length - activeCount;

  return (
    <div className="bg-surface-base min-h-screen">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <SMPageHeader
          title="Audit Schedules"
          subtitle="Manage recurring audit schedules across all sites."
          action={
            <div className="flex items-center gap-2">
              <SMButton
                variant="ghost"
                size="sm"
                onClick={fetchSchedules}
                disabled={loading}
                className="p-2"
                title="Refresh"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              </SMButton>
              <SMButton variant="primary" size="sm" onClick={() => navigate('/audit-schedule/new')}>
                <Plus className="w-4 h-4" />
                New Schedule
              </SMButton>
            </div>
          }
        />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 pb-10 mt-6 max-w-5xl mx-auto space-y-6">

        {/* Stats row */}
        {!loading && schedules.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-3 gap-4"
          >
            <SMStatCard
              label="Total Schedules"
              value={schedules.length}
              icon={<CalendarDays className="w-5 h-5" />}
              variant="default"
            />
            <SMStatCard
              label="Active"
              value={activeCount}
              icon={<Activity className="w-5 h-5" />}
              variant="success"
            />
            <SMStatCard
              label="Paused"
              value={pausedCount}
              icon={<PauseCircle className="w-5 h-5" />}
              variant="warning"
            />
          </motion.div>
        )}

        {/* Schedule list */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <SMCard key={i}>
                <SMCardBody>
                  <div className="space-y-2">
                    <SMSkeleton className="h-5 w-48 rounded-lg" />
                    <SMSkeleton className="h-4 w-32 rounded-lg" />
                    <SMSkeleton className="h-3 w-64 rounded-lg" />
                  </div>
                </SMCardBody>
              </SMCard>
            ))}
          </div>
        ) : schedules.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-accent" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold text-text-primary">No schedules yet</h3>
              <p className="text-sm text-text-muted max-w-sm">
                Create your first audit schedule to start automating recurring audits.
              </p>
            </div>
            <SMButton variant="primary" onClick={() => navigate('/audit-schedule/new')} leftIcon={<Plus className="w-4 h-4" />}>
              Create Your First Schedule
            </SMButton>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {schedules.map((schedule, i) => (
              <motion.div
                key={schedule.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: i * 0.03 }}
              >
                <SMCard>
                  <SMCardBody>
                    <div className="flex items-start justify-between gap-4">
                      {/* Left — icon + content */}
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                          schedule.is_active ? 'bg-success/10' : 'bg-surface-sunken'
                        }`}>
                          <CalendarDays className={`w-5 h-5 ${
                            schedule.is_active ? 'text-success-600' : 'text-text-muted'
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-text-primary truncate">{schedule.title}</span>
                            <SMBadge
                              variant={schedule.is_active ? 'success' : 'neutral'}
                              size="sm"
                            >
                              {schedule.is_active ? 'Active' : 'Paused'}
                            </SMBadge>
                          </div>
                          <p className="text-sm text-text-secondary">
                            {SITE_NAMES[schedule.site_id] ?? `Site ${schedule.site_id}`}
                          </p>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 pt-0.5">
                            <span className="text-xs text-text-muted flex items-center gap-1">
                              <span className="opacity-60">🔁</span> {humanRRule(schedule.rrule_string)}
                            </span>
                            {schedule.next_run_at && (
                              <span className="text-xs text-text-muted flex items-center gap-1">
                                <span className="opacity-60">📅</span> Next: {formatEpoch(schedule.next_run_at)}
                              </span>
                            )}
                            {schedule.last_run_at && (
                              <span className="text-xs text-text-muted flex items-center gap-1">
                                <span className="opacity-60">✅</span> Last: {formatEpoch(schedule.last_run_at)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right — actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggle(schedule)}
                          className="p-2 rounded-xl hover:bg-surface-raised transition-colors"
                          title={schedule.is_active ? 'Pause schedule' : 'Activate schedule'}
                        >
                          {schedule.is_active ? (
                            <ToggleRight className="w-5 h-5 text-success-500" />
                          ) : (
                            <ToggleLeft className="w-5 h-5 text-text-muted" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(schedule.id)}
                          className="p-2 rounded-xl hover:bg-danger-50 dark:hover:bg-danger-950/30 transition-colors text-text-muted hover:text-danger-500"
                          title="Delete schedule"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </SMCardBody>
                </SMCard>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default AuditScheduleList;
