import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useSyncQueue,
  useAddSyncQueueRecord,
  useUpdateSyncQueueRecord,
  useResetSyncQueue,
  useSyncConflicts,
  useAddSyncConflict,
  useResolveConflict,
  useLatestTestRun,
  useSaveTestRun,
  useSyncStats,
} from '../api/hooks/useAPIHooks';
import {
  Wifi, WifiOff, RefreshCw, CheckCircle, AlertTriangle, Clock,
  Database, Cloud, CloudOff, ArrowUpDown, Play, RotateCcw,
  Smartphone, Shield, Trash2, Download, Upload, Zap, Settings,
  FileText, Users, AlertCircle, ChevronRight, Eye, Server,
  Activity, Lock, Unlock, Check, X,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════════════════
   TYPES & INTERFACES
   ═══════════════════════════════════════════════════════════════════ */

interface SyncRecord {
  id: string;
  entity: string;
  action: 'create' | 'update' | 'delete';
  timestamp: string;
  data: Record<string, unknown>;
  synced: boolean;
  conflicted: boolean;
  resolution?: 'local' | 'server' | 'merged' | 'pending';
  version: number;
}

interface SyncTestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'skipped';
  duration?: number;
  error?: string;
  category: 'queue' | 'conflict' | 'network' | 'integrity' | 'performance';
}

interface ConflictScenario {
  id: string;
  title: string;
  description: string;
  localVersion: Record<string, unknown>;
  serverVersion: Record<string, unknown>;
  resolution: 'local' | 'server' | 'merged' | 'pending';
  resolved: boolean;
}

/* ═══════════════════════════════════════════════════════════════════
   MOCK DATA
   ═══════════════════════════════════════════════════════════════════ */

const INITIAL_SYNC_QUEUE: SyncRecord[] = [
  { id: 'sq-1', entity: 'Incident Report', action: 'create', timestamp: '2026-02-21 01:20:00', data: { title: 'Slip hazard in warehouse B', severity: 'medium', location: 'Building B' }, synced: false, conflicted: false, version: 1 },
  { id: 'sq-2', entity: 'Safety Inspection', action: 'update', timestamp: '2026-02-21 01:18:00', data: { inspectionId: 'INS-042', status: 'completed', score: 92 }, synced: false, conflicted: false, version: 3 },
  { id: 'sq-3', entity: 'Training Record', action: 'update', timestamp: '2026-02-21 01:15:00', data: { courseId: 'PPE-101', completion: 100, passed: true }, synced: false, conflicted: false, version: 2 },
  { id: 'sq-4', entity: 'Hazard Assessment', action: 'create', timestamp: '2026-02-21 01:10:00', data: { hazard: 'Chemical spill risk', riskLevel: 'high', area: 'Lab A' }, synced: false, conflicted: false, version: 1 },
  { id: 'sq-5', entity: 'Near Miss Report', action: 'create', timestamp: '2026-02-21 01:05:00', data: { description: 'Forklift near-collision', category: 'vehicle', severity: 'low' }, synced: false, conflicted: false, version: 1 },
  { id: 'sq-6', entity: 'CAPA Action', action: 'update', timestamp: '2026-02-21 01:00:00', data: { capaId: 'CA-2026-007', status: 'in_progress', progress: 65 }, synced: true, conflicted: false, version: 4 },
  { id: 'sq-7', entity: 'Audit Finding', action: 'update', timestamp: '2026-02-20 23:45:00', data: { findingId: 'AF-089', severity: 'critical', assigned: 'J. Martinez' }, synced: true, conflicted: false, version: 2 },
];

const CONFLICT_SCENARIOS: ConflictScenario[] = [
  {
    id: 'cf-1', title: 'Incident Severity Conflict',
    description: 'Supervisor upgraded severity on server while field worker edited description offline',
    localVersion: { title: 'Updated slip hazard description', severity: 'medium', updatedBy: 'Field Worker' },
    serverVersion: { title: 'Slip hazard in warehouse B', severity: 'high', updatedBy: 'Supervisor' },
    resolution: 'pending', resolved: false,
  },
  {
    id: 'cf-2', title: 'Inspection Score Discrepancy',
    description: 'Two inspectors submitted different scores for the same inspection offline',
    localVersion: { score: 88, notes: 'Minor fire extinguisher issue', inspectorId: 'INS-A' },
    serverVersion: { score: 92, notes: 'All clear after re-check', inspectorId: 'INS-B' },
    resolution: 'pending', resolved: false,
  },
  {
    id: 'cf-3', title: 'Training Record Duplicate',
    description: 'Same training completion recorded from mobile app and desktop browser',
    localVersion: { courseId: 'PPE-101', completion: 100, source: 'mobile', timestamp: '2026-02-21T01:15:00Z' },
    serverVersion: { courseId: 'PPE-101', completion: 100, source: 'desktop', timestamp: '2026-02-21T01:14:30Z' },
    resolution: 'pending', resolved: false,
  },
];

const SYNC_TESTS: SyncTestResult[] = [
  { id: 'test-1', name: 'Offline Queue Persistence', description: 'Verify IndexedDB queue survives app restart', status: 'pending', category: 'queue' },
  { id: 'test-2', name: 'Queue FIFO Order', description: 'Confirm records sync in chronological order', status: 'pending', category: 'queue' },
  { id: 'test-3', name: 'Optimistic UI Update', description: 'Local state updates immediately before sync', status: 'pending', category: 'queue' },
  { id: 'test-4', name: 'Conflict Detection', description: 'Detect version mismatch between local and server', status: 'pending', category: 'conflict' },
  { id: 'test-5', name: 'Last-Write-Wins Resolution', description: 'Server version wins when timestamps differ', status: 'pending', category: 'conflict' },
  { id: 'test-6', name: 'Field-Level Merge', description: 'Non-conflicting fields merged from both versions', status: 'pending', category: 'conflict' },
  { id: 'test-7', name: 'Network Reconnection Sync', description: 'Pending items sync when connectivity restored', status: 'pending', category: 'network' },
  { id: 'test-8', name: 'Retry with Exponential Backoff', description: 'Failed syncs retry with increasing delay', status: 'pending', category: 'network' },
  { id: 'test-9', name: 'Bandwidth Throttle Handling', description: 'Graceful degradation on slow connections', status: 'pending', category: 'network' },
  { id: 'test-10', name: 'Data Integrity Hash Check', description: 'SHA-256 checksums validate data integrity', status: 'pending', category: 'integrity' },
  { id: 'test-11', name: 'Encryption at Rest', description: 'Offline data encrypted in IndexedDB', status: 'pending', category: 'integrity' },
  { id: 'test-12', name: 'Batch Sync Performance', description: '100 records synced under 5 seconds', status: 'pending', category: 'performance' },
  { id: 'test-13', name: 'Large Payload Handling', description: 'Sync records with photo attachments (>5 MB)', status: 'pending', category: 'performance' },
  { id: 'test-14', name: 'Concurrent Sync Protection', description: 'Prevent duplicate syncs from multiple tabs', status: 'pending', category: 'integrity' },
];

/* ═══════════════════════════════════════════════════════════════════
   HELPER FUNCTIONS
   ═══════════════════════════════════════════════════════════════════ */

const categoryLabels: Record<string, { label: string; color: string }> = {
  queue: { label: 'Queue', color: 'cyan' },
  conflict: { label: 'Conflict', color: 'amber' },
  network: { label: 'Network', color: 'purple' },
  integrity: { label: 'Integrity', color: 'emerald' },
  performance: { label: 'Performance', color: 'blue' },
};

const statusIcon = (status: string) => {
  switch (status) {
    case 'passed': return <Check className="w-4 h-4 text-success" />;
    case 'failed': return <X className="w-4 h-4 text-danger" />;
    case 'running': return <RefreshCw className="w-4 h-4 text-accent animate-spin" />;
    case 'skipped': return <AlertCircle className="w-4 h-4 text-text-muted" />;
    default: return <Clock className="w-4 h-4 text-text-muted" />;
  }
};

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */

const tabs = [
  { id: 'dashboard', label: 'Sync Dashboard', icon: Activity },
  { id: 'queue', label: 'Sync Queue', icon: Database },
  { id: 'conflicts', label: 'Conflict Resolution', icon: ArrowUpDown },
  { id: 'tests', label: 'Test Suite', icon: Shield },
];

function MobileOfflineSyncTest() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [tests, setTests] = useState<SyncTestResult[]>(SYNC_TESTS);
  const testIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Backend hooks
  const { data: queueData, loading: queueLoading, refetch: refetchQueue } = useSyncQueue();
  const { data: conflictsData, loading: conflictsLoading, refetch: refetchConflicts } = useSyncConflicts();
  const { refetch: refetchStats } = useSyncStats();
  const { data: latestRun, refetch: refetchTestRun } = useLatestTestRun();

  const { mutate: updateQueueRecord } = useUpdateSyncQueueRecord();
  const { mutate: resetQueue } = useResetSyncQueue();
  const { mutate: addConflict } = useAddSyncConflict();
  const { mutate: resolveConflictMutate } = useResolveConflict();
  const { mutate: saveTestRun } = useSaveTestRun();

  // Derive local state from backend data
  const syncQueue: SyncRecord[] = (queueData ?? []).map(r => ({
    ...r,
    resolution: undefined,
  }));

  const conflicts: ConflictScenario[] = (conflictsData ?? []).map(c => ({
    ...c,
    resolution: (c.resolution as ConflictScenario['resolution']) ?? 'pending',
  }));

  // Sync latest test run results from backend on mount
  useEffect(() => {
    if (latestRun && Array.isArray(latestRun.results) && latestRun.results.length > 0) {
      setTests(latestRun.results as SyncTestResult[]);
    }
  }, [latestRun]);

  // Seed default conflicts to backend if empty
  useEffect(() => {
    if (!conflictsLoading && conflictsData !== null && conflictsData.length === 0) {
      CONFLICT_SCENARIOS.forEach(c => {
        addConflict({
          id: c.id,
          title: c.title,
          description: c.description,
          localVersion: c.localVersion,
          serverVersion: c.serverVersion,
          resolution: 'pending',
          resolved: false,
        });
      });
      setTimeout(() => refetchConflicts(), 500);
    }
  }, [conflictsLoading, conflictsData]);

  const pendingCount = syncQueue.filter(r => !r.synced).length;
  const syncedCount  = syncQueue.filter(r => r.synced).length;
  const conflictCount = conflicts.filter(c => !c.resolved).length;
  const passedTests = tests.filter(t => t.status === 'passed').length;
  const failedTests = tests.filter(t => t.status === 'failed').length;

  // Toggle online/offline
  const toggleConnection = useCallback(() => {
    setIsOnline(prev => !prev);
  }, []);

  // Simulate sync process — marks pending records as synced via backend
  const runSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;
    const pending = syncQueue.filter(r => !r.synced);
    if (pending.length === 0) return;

    setIsSyncing(true);
    setSyncProgress(0);

    let processed = 0;
    for (const record of pending) {
      // 10% chance of conflict for demo
      const hasConflict = Math.random() < 0.1;
      await updateQueueRecord({
        id: record.id,
        updates: { synced: !hasConflict, conflicted: hasConflict },
      });
      processed++;
      setSyncProgress(Math.round((processed / pending.length) * 100));
    }

    await refetchQueue();
    await refetchStats();
    setIsSyncing(false);
    setSyncProgress(100);
    setLastSyncTime(new Date().toLocaleTimeString());
  }, [isOnline, isSyncing, syncQueue, updateQueueRecord, refetchQueue, refetchStats]);

  // Reset queue via backend
  const handleResetQueue = useCallback(async () => {
    await resetQueue();
    await refetchQueue();
  }, [resetQueue, refetchQueue]);

  // Run test suite — saves results to backend when done
  const runTestSuite = useCallback(() => {
    if (isRunningTests) return;
    setIsRunningTests(true);

    // Reset all tests locally
    const resetTests: SyncTestResult[] = SYNC_TESTS.map(t => ({
      ...t, status: 'pending', duration: undefined, error: undefined,
    }));
    setTests(resetTests);

    let idx = 0;
    const runNext = () => {
      if (idx >= SYNC_TESTS.length) {
        // All done — persist to backend
        setIsRunningTests(false);
        setTests(prev => {
          const finalResults = prev;
          saveTestRun(finalResults.map(t => ({
            id:          t.id,
            name:        t.name,
            description: t.description,
            status:      t.status,
            duration:    t.duration,
            error:       t.error ?? null,
            category:    t.category,
          }))).then(() => refetchTestRun());
          return finalResults;
        });
        return;
      }

      const currentIdx = idx;
      setTests(prev => prev.map((t, i) => i === currentIdx ? { ...t, status: 'running' } : t));

      const duration = Math.random() * 800 + 200;
      testIntervalRef.current = setTimeout(() => {
        // 85% pass rate for demo
        const passed = Math.random() < 0.85;
        setTests(prev => prev.map((t, i) =>
          i === currentIdx
            ? {
                ...t,
                status:   passed ? 'passed' : 'failed',
                duration: Math.round(duration),
                error:    passed ? undefined : 'Assertion failed: expected value mismatch',
              }
            : t
        ));
        idx++;
        runNext();
      }, duration);
    };

    runNext();
  }, [isRunningTests, saveTestRun, refetchTestRun]);

  // Resolve conflict via backend
  const resolveConflict = useCallback(async (conflictId: string, resolution: 'local' | 'server' | 'merged') => {
    await resolveConflictMutate({ id: conflictId, resolution });
    await refetchConflicts();
    await refetchStats();
  }, [resolveConflictMutate, refetchConflicts, refetchStats]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (testIntervalRef.current) clearTimeout(testIntervalRef.current);
    };
  }, []);

  /* ── Dashboard Tab ── */
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Connection Status Banner */}
      <motion.div
        animate={{ backgroundColor: isOnline ? 'rgba(6, 182, 212, 0.1)' : 'rgba(239, 68, 68, 0.1)' }}
        className={`rounded-xl p-4 border ${isOnline ? 'border-success/30' : 'border-danger/30'} flex items-center justify-between`}
      >
        <div className="flex items-center gap-3">
          {isOnline ? <Wifi className="w-6 h-6 text-accent" /> : <WifiOff className="w-6 h-6 text-danger" />}
          <div>
            <h3 className={`font-semibold text-sm ${isOnline ? 'text-accent' : 'text-danger'}`}>
              {isOnline ? 'Online — Connected to SafetyMEG Cloud' : 'Offline Mode — Changes Queued Locally'}
            </h3>
            <p className="text-text-muted text-xs">
              {isOnline ? `Last sync: ${lastSyncTime || 'Not yet synced'}` : `${pendingCount} records pending sync`}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={toggleConnection}
            className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
              isOnline
                ? 'bg-danger/10 border-danger/30 text-danger hover:bg-danger/20'
                : 'bg-success/10 border-success/30 text-success hover:bg-success/20'
            }`}
          >
            {isOnline ? <><CloudOff className="w-3.5 h-3.5 inline mr-1" /> Go Offline</> : <><Cloud className="w-3.5 h-3.5 inline mr-1" /> Go Online</>}
          </button>
          {isOnline && (
            <button
              onClick={runSync}
              disabled={isSyncing || pendingCount === 0}
              className="px-3 py-2 bg-accent/20 border border-accent/30 text-accent rounded-lg text-xs font-medium hover:bg-accent/30 transition-all disabled:opacity-50 flex items-center gap-1"
            >
              {isSyncing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {isSyncing ? `Syncing ${syncProgress}%` : 'Sync Now'}
            </button>
          )}
        </div>
      </motion.div>

      {/* Sync Progress Bar */}
      {isSyncing && (
        <div className="w-full bg-surface-sunken rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-accent to-ai rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${syncProgress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Sync', value: pendingCount, icon: Clock, color: 'amber', sub: 'records' },
          { label: 'Synced', value: syncedCount, icon: CheckCircle, color: 'emerald', sub: 'records' },
          { label: 'Conflicts', value: conflictCount, icon: AlertTriangle, color: 'red', sub: 'to resolve' },
          { label: 'Tests Passed', value: `${passedTests}/${tests.length}`, icon: Shield, color: 'cyan', sub: failedTests > 0 ? `${failedTests} failed` : 'all clear' },
        ].map(stat => (
          <div key={stat.label} className="bg-surface-sunken backdrop-blur-sm border border-surface-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <stat.icon className={`w-5 h-5 text-${stat.color}-400`} />
              <span className="text-2xl font-bold text-text-primary">{stat.value}</span>
            </div>
            <p className="text-text-muted text-xs">{stat.label}</p>
            <p className="text-text-muted text-[10px]">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Sync Architecture Diagram */}
      <div className="bg-surface-sunken backdrop-blur-sm border border-surface-border rounded-xl p-5">
        <h3 className="text-text-primary font-semibold text-sm mb-4">Sync Architecture</h3>
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8">
          {[
            { icon: Smartphone, label: 'Mobile App', sub: 'IndexedDB Queue', color: 'cyan' },
            { icon: ArrowUpDown, label: 'Sync Engine', sub: 'Conflict Resolver', color: 'purple' },
            { icon: Server, label: 'SafetyMEG API', sub: 'REST + WebSocket', color: 'blue' },
            { icon: Database, label: 'Cloud DB', sub: 'Encrypted Storage', color: 'emerald' },
          ].map((step, idx) => (
            <React.Fragment key={step.label}>
              <div className="flex flex-col items-center text-center">
                <div className={`p-3 rounded-xl bg-${step.color}-500/10 border border-${step.color}-500/30 mb-2`}>
                  <step.icon className={`w-6 h-6 text-${step.color}-400`} />
                </div>
                <p className="text-text-primary text-xs font-medium">{step.label}</p>
                <p className="text-text-muted text-[10px]">{step.sub}</p>
              </div>
              {idx < 3 && <ChevronRight className="w-5 h-5 text-text-muted hidden md:block" />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Recent Sync Activity */}
      <div className="bg-surface-sunken backdrop-blur-sm border border-surface-border rounded-xl p-5">
        <h3 className="text-text-primary font-semibold text-sm mb-3">Recent Sync Activity</h3>
        <div className="space-y-2">
          {syncQueue.slice(0, 5).map(record => (
            <div key={record.id} className="flex items-center gap-3 p-2.5 bg-surface-sunken rounded-lg">
              <div className={`p-1.5 rounded-lg ${record.synced ? 'bg-success/20' : record.conflicted ? 'bg-danger/20' : 'bg-warning/20'}`}>
                {record.synced ? <CheckCircle className="w-4 h-4 text-success" /> : record.conflicted ? <AlertTriangle className="w-4 h-4 text-danger" /> : <Clock className="w-4 h-4 text-warning" />}
              </div>
              <div className="flex-1">
                <p className="text-text-primary text-xs font-medium">{record.entity}</p>
                <p className="text-text-muted text-[10px]">{record.action} • v{record.version} • {record.timestamp}</p>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                record.synced ? 'text-success bg-success/10 border-success/30'
                  : record.conflicted ? 'text-danger bg-danger/10 border-danger/30'
                  : 'text-warning bg-warning/10 border-warning/30'
              }`}>
                {record.synced ? 'Synced' : record.conflicted ? 'Conflict' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  /* ── Queue Tab ── */
  const renderQueue = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{syncQueue.length} total records — {pendingCount} pending</p>
        <div className="flex gap-2">
          <button
            onClick={handleResetQueue}
            className="flex items-center gap-1 px-3 py-2 bg-surface-overlay text-text-secondary rounded-lg text-xs hover:text-text-primary transition"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Reset Queue
          </button>
          <button
            onClick={runSync}
            disabled={!isOnline || isSyncing || pendingCount === 0}
            className="flex items-center gap-1 px-3 py-2 bg-accent/20 border border-accent/30 text-accent rounded-lg text-xs font-medium hover:bg-accent/30 transition disabled:opacity-50"
          >
            <Upload className="w-3.5 h-3.5" /> Sync All
          </button>
        </div>
      </div>

      {syncQueue.map((record, idx) => (
        <motion.div
          key={record.id}
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="bg-surface-sunken backdrop-blur-sm border border-surface-border rounded-xl p-4"
        >
          <div className="flex items-start gap-3">
            <div className={`p-2 rounded-lg ${record.synced ? 'bg-success/20' : record.conflicted ? 'bg-danger/20' : 'bg-warning/20'}`}>
              {record.synced ? <CheckCircle className="w-5 h-5 text-success" /> : record.conflicted ? <AlertTriangle className="w-5 h-5 text-danger" /> : <Clock className="w-5 h-5 text-warning" />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="text-text-primary text-sm font-medium">{record.entity}</h4>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  record.action === 'create' ? 'bg-success/10 text-success'
                    : record.action === 'update' ? 'bg-accent/10 text-accent'
                    : 'bg-danger/10 text-danger'
                }`}>
                  {record.action.toUpperCase()}
                </span>
                <span className="text-text-muted text-[10px]">v{record.version}</span>
              </div>
              <p className="text-text-muted text-xs mb-2">{record.timestamp}</p>
              <div className="bg-surface-sunken rounded-lg p-2.5 border border-surface-border/30">
                <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify(record.data, null, 2)}</pre>
              </div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );

  /* ── Conflicts Tab ── */
  const renderConflicts = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-text-muted text-sm">{conflictCount} unresolved conflicts</p>
      </div>

      {conflicts.map(conflict => (
        <motion.div
          key={conflict.id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`bg-surface-sunken backdrop-blur-sm border rounded-xl p-5 ${conflict.resolved ? 'border-success/30' : 'border-warning/30'}`}
        >
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-text-primary font-semibold text-sm">{conflict.title}</h3>
              <p className="text-text-muted text-xs mt-0.5">{conflict.description}</p>
            </div>
            {conflict.resolved && (
              <span className="text-success text-[10px] px-2 py-0.5 rounded-full bg-success/10 border border-success/30 flex items-center gap-1">
                <Check className="w-3 h-3" /> Resolved ({conflict.resolution})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {/* Local Version */}
            <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Smartphone className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-blue-300 text-xs font-semibold">Local (Mobile)</span>
              </div>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify(conflict.localVersion, null, 2)}</pre>
            </div>

            {/* Server Version */}
            <div className="bg-purple-500/5 border border-purple-500/20 rounded-lg p-3">
              <div className="flex items-center gap-1.5 mb-2">
                <Cloud className="w-3.5 h-3.5 text-ai" />
                <span className="text-ai text-xs font-semibold">Server (Cloud)</span>
              </div>
              <pre className="text-xs text-text-secondary whitespace-pre-wrap">{JSON.stringify(conflict.serverVersion, null, 2)}</pre>
            </div>
          </div>

          {!conflict.resolved && (
            <div className="flex gap-2">
              <button onClick={() => resolveConflict(conflict.id, 'local')} className="flex-1 px-3 py-2 bg-blue-500/10 border border-blue-500/30 text-blue-300 rounded-lg text-xs font-medium hover:bg-blue-500/20 transition">
                <Smartphone className="w-3.5 h-3.5 inline mr-1" /> Keep Local
              </button>
              <button onClick={() => resolveConflict(conflict.id, 'server')} className="flex-1 px-3 py-2 bg-ai/10 border border-ai/30 text-ai rounded-lg text-xs font-medium hover:bg-ai/20 transition">
                <Cloud className="w-3.5 h-3.5 inline mr-1" /> Keep Server
              </button>
              <button onClick={() => resolveConflict(conflict.id, 'merged')} className="flex-1 px-3 py-2 bg-success/10 border border-success/30 text-success rounded-lg text-xs font-medium hover:bg-success/20 transition">
                <ArrowUpDown className="w-3.5 h-3.5 inline mr-1" /> Merge
              </button>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );

  /* ── Test Suite Tab ── */
  const renderTests = () => {
    const categories = ['queue', 'conflict', 'network', 'integrity', 'performance'];

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-text-muted text-sm">{tests.length} tests — {passedTests} passed, {failedTests} failed</p>
          </div>
          <button
            onClick={runTestSuite}
            disabled={isRunningTests}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-accent to-ai text-text-onAccent rounded-lg text-xs font-medium hover:shadow-lg hover:shadow-accent/25 transition-all disabled:opacity-50"
          >
            {isRunningTests ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isRunningTests ? 'Running...' : 'Run All Tests'}
          </button>
        </div>

        {/* Test Progress Bar */}
        {isRunningTests && (
          <div className="w-full bg-surface-sunken rounded-full h-1.5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-accent to-ai rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(tests.filter(t => t.status !== 'pending' && t.status !== 'running').length / tests.length) * 100}%` }}
            />
          </div>
        )}

        {categories.map(cat => {
          const catTests = tests.filter(t => t.category === cat);
          const info = categoryLabels[cat];
          return (
            <div key={cat}>
              <h3 className={`text-${info.color}-400 font-semibold text-xs uppercase tracking-wider mb-2`}>
                {info.label} Tests ({catTests.filter(t => t.status === 'passed').length}/{catTests.length})
              </h3>
              <div className="space-y-1.5">
                {catTests.map(test => (
                  <div
                    key={test.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                      test.status === 'passed' ? 'bg-success/5 border-success/20'
                        : test.status === 'failed' ? 'bg-danger/5 border-danger/20'
                        : test.status === 'running' ? 'bg-accent/5 border-accent/20'
                        : 'bg-surface-sunken border-surface-border/30'
                    }`}
                  >
                    {statusIcon(test.status)}
                    <div className="flex-1">
                      <p className="text-text-primary text-xs font-medium">{test.name}</p>
                      <p className="text-text-muted text-[10px]">{test.description}</p>
                      {test.error && <p className="text-danger text-[10px] mt-0.5">{test.error}</p>}
                    </div>
                    {test.duration && (
                      <span className="text-text-muted text-[10px]">{test.duration}ms</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-base pb-24">


      <div className="max-w-7xl mx-auto px-4 pt-6 pb-8">
        {/* Page Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent to-ai bg-clip-text text-transparent">
              Mobile Offline Sync Test
            </h1>
            <p className="text-text-muted text-sm mt-1">Test offline data synchronization, conflict resolution, and data integrity</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${isOnline ? 'bg-success/10 text-success border border-success/30' : 'bg-danger/10 text-danger border border-danger/30'}`}>
              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-success animate-pulse' : 'bg-danger'}`} />
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-surface-sunken backdrop-blur-sm border border-surface-border rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-accent/20 text-accent border border-accent/30'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'queue' && renderQueue()}
            {activeTab === 'conflicts' && renderConflicts()}
            {activeTab === 'tests' && renderTests()}
          </motion.div>
        </AnimatePresence>
      </div>


    </div>
  );
}

export default MobileOfflineSyncTest;
