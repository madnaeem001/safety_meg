import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Settings,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Calendar,
  Filter,
  ChevronDown,
  ChevronUp,
  Wrench,
  FileText,
  User,
  Target,
  Activity,
  Download,
  Plus,
  History,
  AlertCircle,
  Award,
} from 'lucide-react';
import {
  SensorCalibrationSchedule,
  CalibrationRecord,
  CalibrationStatus,
  CalibrationResult,
} from '../data/mockSensor';
import { useSensors, useCalibrateSensor } from '../api/hooks/useAPIHooks';

const statusConfig: Record<CalibrationStatus, { label: string; color: string; icon: React.ReactNode }> = {
  current: { label: 'Current', color: 'bg-green-100 text-green-700 border-green-200', icon: <CheckCircle2 className="w-4 h-4" /> },
  due_soon: { label: 'Due Soon', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: <Clock className="w-4 h-4" /> },
  overdue: { label: 'Overdue', color: 'bg-red-100 text-red-700 border-red-200', icon: <AlertTriangle className="w-4 h-4" /> },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: <Settings className="w-4 h-4 animate-spin" /> },
};

const resultConfig: Record<CalibrationResult, { label: string; color: string }> = {
  pass: { label: 'Pass', color: 'bg-green-100 text-green-700' },
  fail: { label: 'Fail', color: 'bg-red-100 text-red-700' },
  adjusted: { label: 'Adjusted', color: 'bg-amber-100 text-amber-700' },
  replaced: { label: 'Replaced', color: 'bg-purple-100 text-purple-700' },
};

const priorityColors: Record<string, string> = {
  low: 'bg-surface-100 text-surface-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const SensorCalibration: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<CalibrationStatus | 'all'>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState<string | null>(null);
  const [viewTab, setViewTab] = useState<'schedule' | 'history'>('schedule');

  // ── Real backend sensor data ──────────────────────────────────────────
  const { data: backendSensors, refetch } = useSensors();
  const calibrateSensor = useCalibrateSensor();

  // Derive calibration schedule from backend sensors (map to schedule shape)
  const calibrationSchedule: SensorCalibrationSchedule[] = useMemo(() => {
    if (backendSensors && backendSensors.length > 0) {
      return backendSensors.map((s: any) => {
        const lastCal = s.lastCalibrated ? new Date(s.lastCalibrated) : null;
        const nextCal = lastCal
          ? new Date(lastCal.getTime() + 90 * 24 * 60 * 60 * 1000) // 90-day interval
          : new Date();
        const today = new Date();
        const daysUntil = Math.ceil((nextCal.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        const status: CalibrationStatus = daysUntil < 0 ? 'overdue' : daysUntil <= 14 ? 'due_soon' : 'current';
        return {
          id: String(s.sensorId || s.id),
          sensorId: String(s.sensorId || s.id),
          sensorName: s.name,
          sensorType: s.sensorType || 'temperature',
          location: s.location || s.zone || 'Unknown',
          lastCalibration: s.lastCalibrated || today.toISOString(),
          nextCalibration: nextCal.toISOString(),
          status,
          priority: daysUntil < 0 ? 'critical' : daysUntil <= 14 ? 'high' : 'medium',
          calibrationInterval: 90,
          calibratedBy: 'Maintenance Team',
          notes: '',
        } as SensorCalibrationSchedule;
      });
    }
    return [];
  }, [backendSensors]);

  const stats = useMemo(() => {
    if (backendSensors && backendSensors.length > 0) {
      const total = calibrationSchedule.length;
      const current = calibrationSchedule.filter(s => s.status === 'current').length;
      const dueSoon = calibrationSchedule.filter(s => s.status === 'due_soon').length;
      const overdue = calibrationSchedule.filter(s => s.status === 'overdue').length;
      return { total, current, dueSoon, overdue, complianceRate: total > 0 ? Math.round((current / total) * 100) : 0 };
    }
    return { total: 0, current: 0, dueSoon: 0, overdue: 0, complianceRate: 0 };
  }, [calibrationSchedule, backendSensors]);

  const filteredSchedule = useMemo(() => {
    return calibrationSchedule.filter(s => {
      if (filterStatus !== 'all' && s.status !== filterStatus) return false;
      if (filterType !== 'all' && s.sensorType !== filterType) return false;
      return true;
    }).sort((a, b) => {
      const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };
      return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
    });
  }, [calibrationSchedule, filterStatus, filterType]);

  const sortedHistory = useMemo(() => {
    return [];
  }, []);

  const getDaysUntilDue = (nextDate: string) => {
    const today = new Date('2026-01-05');
    const next = new Date(nextDate);
    return Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="sticky top-[72px] z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/')}
                className="p-2 hover:bg-surface-100 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600" />
              </button>
              <div>
                <h1 className="page-title">Sensor Calibration Tracking</h1>
                <p className="page-subtitle">Manage calibration schedules and history</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-xl shadow-button hover:shadow-lg transition-all">
              <Download className="w-4 h-4" />
              Export Records
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Activity className="w-5 h-5 text-brand-600" />
              <span className="text-sm text-surface-500">Total Sensors</span>
            </div>
            <div className="text-2xl font-bold text-surface-900">{stats.total}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="bg-green-50 rounded-2xl p-4 border border-green-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <span className="text-sm text-green-600">Current</span>
            </div>
            <div className="text-2xl font-bold text-green-700">{stats.current}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-amber-50 rounded-2xl p-4 border border-amber-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-amber-600" />
              <span className="text-sm text-amber-600">Due Soon</span>
            </div>
            <div className="text-2xl font-bold text-amber-700">{stats.dueSoon}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-red-50 rounded-2xl p-4 border border-red-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="text-sm text-red-600">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-red-700">{stats.overdue}</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-brand-600" />
              <span className="text-sm text-surface-500">Compliance</span>
            </div>
            <div className="text-2xl font-bold text-surface-900">{stats.complianceRate}%</div>
          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-surface-100 rounded-xl p-1 w-fit">
          <button
            onClick={() => setViewTab('schedule')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === 'schedule' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-600'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Calibration Schedule
          </button>
          <button
            onClick={() => setViewTab('history')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              viewTab === 'history' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-600'
            }`}
          >
            <History className="w-4 h-4 inline mr-2" />
            Calibration History
          </button>
        </div>

        {/* Schedule View */}
        {viewTab === 'schedule' && (
          <>
            {/* Filters */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-surface-500" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as CalibrationStatus | 'all')}
                  className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Status</option>
                  <option value="current">Current</option>
                  <option value="due_soon">Due Soon</option>
                  <option value="overdue">Overdue</option>
                </select>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="all">All Types</option>
                  <option value="temperature">Temperature</option>
                  <option value="gas">Gas</option>
                  <option value="humidity">Humidity</option>
                  <option value="noise">Noise</option>
                  <option value="flame">Flame</option>
                  <option value="motion">Motion</option>
                </select>
              </div>
            </div>

            {/* Schedule List */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredSchedule.map((schedule, index) => {
                  const isExpanded = expandedId === schedule.sensorId;
                  const daysUntilDue = getDaysUntilDue(schedule.nextCalibrationDate);
                  const history: CalibrationRecord[] = [];
                  const statusInfo = statusConfig[schedule.status];
                  
                  return (
                    <motion.div
                      key={schedule.sensorId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.03 }}
                      className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden"
                    >
                      <div
                        className="p-4 cursor-pointer"
                        onClick={() => setExpandedId(isExpanded ? null : schedule.sensorId)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-xl ${
                              schedule.status === 'current' ? 'bg-green-100' :
                              schedule.status === 'due_soon' ? 'bg-amber-100' :
                              schedule.status === 'overdue' ? 'bg-red-100' : 'bg-blue-100'
                            }`}>
                              <Wrench className={`w-5 h-5 ${
                                schedule.status === 'current' ? 'text-green-600' :
                                schedule.status === 'due_soon' ? 'text-amber-600' :
                                schedule.status === 'overdue' ? 'text-red-600' : 'text-blue-600'
                              }`} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-surface-900">{schedule.sensorName}</h3>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusInfo.color}`}>
                                  {statusInfo.label}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${priorityColors[schedule.priority]}`}>
                                  {schedule.priority}
                                </span>
                              </div>
                              <div className="flex flex-wrap items-center gap-3 text-sm text-surface-500">
                                <span className="capitalize">{schedule.sensorType}</span>
                                <span>•</span>
                                <span>{schedule.location}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  Due: {new Date(schedule.nextCalibrationDate).toLocaleDateString()}
                                  {daysUntilDue >= 0 && (
                                    <span className={`ml-1 ${daysUntilDue <= 7 ? 'text-amber-600' : ''}`}>
                                      ({daysUntilDue} days)
                                    </span>
                                  )}
                                  {daysUntilDue < 0 && (
                                    <span className="ml-1 text-red-600">
                                      ({Math.abs(daysUntilDue)} days overdue)
                                    </span>
                                  )}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button className="p-1 hover:bg-surface-100 rounded-lg transition-colors">
                            {isExpanded ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                          </button>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="border-t border-surface-100"
                          >
                            <div className="p-4 bg-surface-50/50 space-y-4">
                              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                <div className="p-3 bg-white rounded-xl border border-surface-100">
                                  <div className="text-xs text-surface-500 mb-1">Model</div>
                                  <div className="font-medium text-surface-900">{schedule.model}</div>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-surface-100">
                                  <div className="text-xs text-surface-500 mb-1">Serial Number</div>
                                  <div className="font-medium text-surface-900">{schedule.serialNumber}</div>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-surface-100">
                                  <div className="text-xs text-surface-500 mb-1">Accuracy Spec</div>
                                  <div className="font-medium text-surface-900">{schedule.accuracySpec}</div>
                                </div>
                                <div className="p-3 bg-white rounded-xl border border-surface-100">
                                  <div className="text-xs text-surface-500 mb-1">Cal Interval</div>
                                  <div className="font-medium text-surface-900">{schedule.calibrationInterval} days</div>
                                </div>
                              </div>

                              {/* Recent Calibration History */}
                              {history.length > 0 && (
                                <div>
                                  <h4 className="text-sm font-medium text-surface-700 mb-2 flex items-center gap-2">
                                    <History className="w-4 h-4" />
                                    Recent Calibrations
                                  </h4>
                                  <div className="space-y-2">
                                    {history.slice(0, 2).map(record => (
                                      <div key={record.id} className="p-3 bg-white rounded-xl border border-surface-100 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultConfig[record.result].color}`}>
                                            {resultConfig[record.result].label}
                                          </span>
                                          <span className="text-sm text-surface-900">{new Date(record.calibrationDate).toLocaleDateString()}</span>
                                          <span className="text-sm text-surface-500">{record.calibrationType}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-sm text-surface-500">
                                          <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5" />
                                            {record.performedBy}
                                          </span>
                                          {record.certificateNumber && (
                                            <span className="flex items-center gap-1">
                                              <Award className="w-3.5 h-3.5" />
                                              {record.certificateNumber}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}

                              <div className="flex gap-3">
                                <button className="flex-1 px-4 py-2.5 bg-gradient-to-br from-brand-600 to-brand-700 text-white rounded-xl shadow-button hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                  <Plus className="w-4 h-4" />
                                  Record Calibration
                                </button>
                                <button className="px-4 py-2.5 border border-surface-200 text-surface-700 rounded-xl hover:bg-surface-50 transition-colors flex items-center gap-2">
                                  <FileText className="w-4 h-4" />
                                  View Certificate
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {filteredSchedule.length === 0 && (
                <div className="text-center py-12 text-surface-500">
                  No sensors found matching your filters.
                </div>
              )}
            </div>
          </>
        )}

        {/* History View */}
        {viewTab === 'history' && (
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
            <div className="p-4 border-b border-surface-100">
              <h3 className="font-semibold text-surface-900">All Calibration Records</h3>
            </div>
            <div className="divide-y divide-surface-100">
              {sortedHistory.map(record => (
                <div key={record.id} className="p-4 hover:bg-surface-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl ${resultConfig[record.result].color}`}>
                        {record.result === 'pass' ? <CheckCircle2 className="w-5 h-5" /> :
                         record.result === 'fail' ? <XCircle className="w-5 h-5" /> :
                         record.result === 'adjusted' ? <Settings className="w-5 h-5" /> :
                         <Wrench className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-surface-900">
                            {mockCalibrationSchedule.find(s => s.sensorId === record.sensorId)?.sensorName || record.sensorId}
                          </h4>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${resultConfig[record.result].color}`}>
                            {resultConfig[record.result].label}
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-surface-100 text-surface-600 capitalize">
                            {record.calibrationType}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-sm text-surface-500">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(record.calibrationDate).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5" />
                            {record.performedBy}
                          </span>
                          <span>
                            Deviation: {record.deviationPercent.toFixed(1)}% (Tol: {record.tolerancePercent}%)
                          </span>
                          {record.certificateNumber && (
                            <span className="flex items-center gap-1">
                              <Award className="w-3.5 h-3.5" />
                              {record.certificateNumber}
                            </span>
                          )}
                        </div>
                        {record.notes && (
                          <p className="text-sm text-surface-600 mt-2 flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                            {record.notes}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right text-sm">
                      <div className="text-surface-500">Reference: {record.referenceValue} {record.referenceStandard}</div>
                      <div className="text-surface-400">Before: {record.beforeReading} → After: {record.afterReading}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default SensorCalibration;
