import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { RRule, Weekday } from 'rrule';
import { motion } from 'framer-motion';
import { CalendarDays, Info, Repeat, ListChecks, ArrowLeft } from 'lucide-react';
import {
  SMButton,
  SMCard,
  SMCardBody,
  SMCardFooter,
  SMCardHeader,
  SMInput,
  SMSelect,
  SMPageHeader,
  SMBadge,
} from '../../components/ui';
import { useToastStore } from '../../store/useToastStore';
import { getAPIConfig } from '../../api/services/apiService';

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_SITES = [
  { value: '1', label: 'Plant A — Birmingham' },
  { value: '2', label: 'Plant B — Manchester' },
  { value: '3', label: 'Offshore Rig Alpha' },
  { value: '4', label: 'Head Office — London' },
  { value: '5', label: 'Distribution Centre — Leeds' },
] as const;

const WEEKDAYS = [
  { key: 'MO', label: 'Mon', rruleDay: RRule.MO },
  { key: 'TU', label: 'Tue', rruleDay: RRule.TU },
  { key: 'WE', label: 'Wed', rruleDay: RRule.WE },
  { key: 'TH', label: 'Thu', rruleDay: RRule.TH },
  { key: 'FR', label: 'Fri', rruleDay: RRule.FR },
  { key: 'SA', label: 'Sat', rruleDay: RRule.SA },
  { key: 'SU', label: 'Sun', rruleDay: RRule.SU },
] as const;

type WeekdayKey = (typeof WEEKDAYS)[number]['key'];
type Frequency = 'DAILY' | 'WEEKLY' | 'MONTHLY';

const FREQ_OPTIONS: { value: Frequency; label: string }[] = [
  { value: 'DAILY',   label: 'Daily'   },
  { value: 'WEEKLY',  label: 'Weekly'  },
  { value: 'MONTHLY', label: 'Monthly' },
];

const PREVIEW_COUNT = 3;

// ─── RRule helper ─────────────────────────────────────────────────────────────

/**
 * Constructs an RFC-5545 RRULE string from the local form recurrence state.
 * Returns an empty string if the configuration is incomplete (no frequency set).
 *
 * @param frequency  - DAILY | WEEKLY | MONTHLY
 * @param interval   - How many period units between occurrences (≥ 1)
 * @param byDay      - Weekday constraints (only meaningful for WEEKLY/MONTHLY)
 * @param dtstart    - Optional start date (defaults to now)
 */
function buildRRuleString(
  frequency: Frequency,
  interval: number,
  byDay: WeekdayKey[],
  dtstart?: Date,
): string {
  const freqMap: Record<Frequency, number> = {
    DAILY:   RRule.DAILY,
    WEEKLY:  RRule.WEEKLY,
    MONTHLY: RRule.MONTHLY,
  };

  const byDayWeekdays: Weekday[] = byDay
    .map((key) => WEEKDAYS.find((d) => d.key === key)?.rruleDay)
    .filter((d): d is Weekday => d !== undefined);

  const rule = new RRule({
    freq:     freqMap[frequency],
    interval: Math.max(1, interval),
    byweekday: byDayWeekdays.length > 0 ? byDayWeekdays : undefined,
    dtstart:  dtstart ?? new Date(),
  });

  // RRule.toString() produces "DTSTART:...\nRRULE:FREQ=..."
  // We extract just the RRULE portion for storage.
  const full = rule.toString();
  const rruleLine = full.split('\n').find((l) => l.startsWith('RRULE:'));
  return rruleLine ? rruleLine.replace(/^RRULE:/, '') : full;
}

/**
 * Calculates the next `count` execution dates after `after` for the given
 * rrule string. Returns an empty array on malformed input.
 */
function getPreviewDates(rruleString: string, after: Date, count: number): Date[] {
  if (!rruleString) return [];
  try {
    const rule = RRule.fromString(
      rruleString.startsWith('RRULE:') ? rruleString : `RRULE:${rruleString}`,
    );
    return rule.all((_, i) => i < count);
  } catch {
    return [];
  }
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  title:     string;
  siteId:    string;
  frequency: Frequency;
  interval:  number;
  byDay:     WeekdayKey[];
}

interface FormErrors {
  title?:  string;
  siteId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const AuditScheduleBuilder: React.FC = () => {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);

  const [form, setForm] = useState<FormState>({
    title:     '',
    siteId:    '',
    frequency: 'WEEKLY',
    interval:  1,
    byDay:     ['MO'],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  // ── Live rrule string ──────────────────────────────────────────────────────

  const rruleString = useMemo(
    () => buildRRuleString(form.frequency, form.interval, form.byDay),
    [form.frequency, form.interval, form.byDay],
  );

  // ── Preview dates ──────────────────────────────────────────────────────────

  const previewDates = useMemo(
    () => getPreviewDates(rruleString, new Date(), PREVIEW_COUNT),
    [rruleString],
  );

  // ── Field helpers ──────────────────────────────────────────────────────────

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleByDay = (key: WeekdayKey) => {
    setForm((prev) => ({
      ...prev,
      byDay: prev.byDay.includes(key)
        ? prev.byDay.filter((d) => d !== key)
        : [...prev.byDay, key],
    }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────

  const validate = (): boolean => {
    const next: FormErrors = {};
    if (!form.title.trim())  next.title  = 'Schedule title is required';
    if (!form.siteId)        next.siteId = 'Please select a site';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ── Save ───────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const { baseURL } = getAPIConfig();
      const res = await fetch(`${baseURL}/audit-schedules`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title:        form.title.trim(),
          siteId:       Number(form.siteId),
          rruleString,
          // Seed created_by with 1 (system user) until auth context is wired.
          createdBy:    1,
          isActive:     true,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `HTTP ${res.status}`);
      }

      addToast({ message: 'Audit schedule saved successfully.', variant: 'success', duration: 3000 });

      // Navigate to list after save
      navigate('/audit-schedules');

      // Reset form
      setForm({ title: '', siteId: '', frequency: 'WEEKLY', interval: 1, byDay: ['MO'] });
      setErrors({});
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save audit schedule.';
      addToast({ message, variant: 'error', duration: 3000 });
    } finally {
      setSaving(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="bg-surface-base min-h-screen">
      {/* Page Header */}
      <div className="px-4 sm:px-6 lg:px-8 pt-6">
        <SMPageHeader
          title="New Audit Schedule"
          subtitle="Configure recurrence rules for automated audit generation."
          breadcrumb={
            <button
              onClick={() => navigate('/audit-schedules')}
              className="flex items-center gap-1.5 text-sm text-text-muted hover:text-accent transition-colors mb-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Audit Schedules
            </button>
          }
        />
      </div>

      {/* Body — two columns on lg+ */}
      <div className="px-4 sm:px-6 lg:px-8 pb-10 mt-6">
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-6 max-w-5xl">

          {/* ── LEFT: Form ─────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="space-y-4"
          >
            {/* Section 1 — Details */}
            <SMCard>
              <SMCardHeader action={<SMBadge variant="teal" size="sm"><Info className="w-3 h-3" />Details</SMBadge>}>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">1</span>
                  Schedule Details
                </span>
              </SMCardHeader>
              <SMCardBody className="space-y-4">
                <SMInput
                  label="Schedule Title"
                  placeholder="e.g. Monthly Fire Safety Audit"
                  value={form.title}
                  onChange={(e) => setField('title', (e.target as HTMLInputElement).value)}
                  error={errors.title}
                />
                <SMSelect
                  label="Site"
                  placeholder="Select a site…"
                  value={form.siteId}
                  onChange={(e) => setField('siteId', e.target.value)}
                  options={MOCK_SITES.map((s) => ({ value: s.value, label: s.label }))}
                  error={errors.siteId}
                />
              </SMCardBody>
            </SMCard>

            {/* Section 2 — Recurrence */}
            <SMCard>
              <SMCardHeader action={<SMBadge variant="neutral" size="sm"><Repeat className="w-3 h-3" />Recurrence</SMBadge>}>
                <span className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-accent text-white text-xs font-bold flex items-center justify-center">2</span>
                  Recurrence Rule
                </span>
              </SMCardHeader>
              <SMCardBody className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <SMSelect
                    label="Frequency"
                    value={form.frequency}
                    onChange={(e) => setField('frequency', e.target.value as Frequency)}
                    options={FREQ_OPTIONS}
                  />
                  <SMInput
                    label="Every (interval)"
                    type="number"
                    min={1}
                    max={52}
                    value={form.interval}
                    onChange={(e) =>
                      setField('interval', Math.max(1, Number((e.target as HTMLInputElement).value)))
                    }
                    helperText={`Every ${form.interval} ${form.frequency.toLowerCase()}(s)`}
                  />
                </div>

                {form.frequency !== 'DAILY' && (
                  <div className="space-y-2">
                    <span className="text-sm font-medium text-text-primary">Run on days</span>
                    <div className="flex flex-wrap gap-2">
                      {WEEKDAYS.map(({ key, label }) => {
                        const active = form.byDay.includes(key);
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() => toggleByDay(key)}
                            className={[
                              'h-9 w-12 rounded-lg border text-xs font-semibold transition-all duration-150',
                              active
                                ? 'border-accent bg-accent text-white shadow-sm scale-105'
                                : 'border-surface-border bg-surface-sunken text-text-secondary hover:border-accent hover:text-accent',
                            ].join(' ')}
                            aria-pressed={active}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    {form.byDay.length === 0 && (
                      <p className="text-xs text-text-muted">No days selected — audit fires on the occurrence date.</p>
                    )}
                  </div>
                )}

                {/* Generated rrule preview */}
                <div className="rounded-xl border border-surface-border bg-surface-sunken px-4 py-3">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-text-muted">Generated RRule</p>
                  <code className="break-all text-sm text-accent font-mono">{rruleString || '—'}</code>
                </div>
              </SMCardBody>
            </SMCard>

            {/* Footer actions */}
            <div className="flex justify-end gap-3 pt-1 pb-6">
              <SMButton
                variant="secondary"
                onClick={() => {
                  setForm({ title: '', siteId: '', frequency: 'WEEKLY', interval: 1, byDay: ['MO'] });
                  setErrors({});
                }}
                disabled={saving}
              >
                Reset
              </SMButton>
              <SMButton
                variant="primary"
                onClick={handleSave}
                loading={saving}
                disabled={saving}
              >
                Save Schedule
              </SMButton>
            </div>
          </motion.div>

          {/* ── RIGHT: Sticky preview panel ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.07 }}
            className="mt-4 lg:mt-0 lg:sticky lg:top-6 lg:self-start space-y-4"
          >
            {/* Summary card */}
            <SMCard>
              <SMCardHeader>
                <span className="flex items-center gap-2 text-sm">
                  <CalendarDays className="w-4 h-4 text-accent" />
                  Schedule Summary
                </span>
              </SMCardHeader>
              <SMCardBody className="space-y-3">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-muted">Title</span>
                    <span className="font-medium text-text-primary truncate max-w-[160px] text-right">
                      {form.title || <span className="text-text-muted italic">Untitled</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Site</span>
                    <span className="font-medium text-text-primary">
                      {MOCK_SITES.find((s) => s.value === form.siteId)?.label ?? <span className="text-text-muted italic">None</span>}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-muted">Frequency</span>
                    <SMBadge variant="teal" size="sm">{form.frequency.charAt(0) + form.frequency.slice(1).toLowerCase()}</SMBadge>
                  </div>
                  {form.interval > 1 && (
                    <div className="flex justify-between">
                      <span className="text-text-muted">Interval</span>
                      <span className="font-medium text-text-primary">Every {form.interval}</span>
                    </div>
                  )}
                  {form.byDay.length > 0 && form.frequency !== 'DAILY' && (
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-text-muted shrink-0">Days</span>
                      <div className="flex flex-wrap gap-1 justify-end">
                        {form.byDay.map((d) => (
                          <span key={d} className="text-[11px] bg-accent/10 text-accent rounded px-1.5 py-0.5 font-medium">{d}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </SMCardBody>
            </SMCard>

            {/* Upcoming dates card */}
            <SMCard>
              <SMCardHeader>
                <span className="flex items-center gap-2 text-sm">
                  <ListChecks className="w-4 h-4 text-accent" />
                  Upcoming Dates
                </span>
              </SMCardHeader>
              <SMCardBody>
                {previewDates.length === 0 ? (
                  <p className="text-sm text-text-muted py-2">Configure recurrence to preview dates.</p>
                ) : (
                  <ol className="space-y-2.5">
                    {previewDates.map((date, i) => (
                      <motion.li
                        key={date.toISOString()}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.06 }}
                        className="flex items-center gap-3"
                      >
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                          {i + 1}
                        </span>
                        <span className="text-sm text-text-primary">
                          {date.toLocaleDateString('en-GB', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </motion.li>
                    ))}
                  </ol>
                )}
              </SMCardBody>
            </SMCard>
          </motion.div>

        </div>
      </div>
    </div>
  );
};

export default AuditScheduleBuilder;
