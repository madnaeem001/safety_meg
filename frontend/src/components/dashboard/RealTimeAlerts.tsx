import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, AlertCircle, CheckCircle2, Clock, Info, X, ChevronRight, Settings, Volume2, VolumeX, Mail, MessageSquare, Smartphone, Filter, Trash2, Check, AlertTriangle, Shield, Calendar, User, Zap, RefreshCw } from 'lucide-react';
import { SMButton, SMCard, SMBadge } from '../ui';

const MotionSMCard = motion(SMCard);

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  source: string;
  timestamp: string;
  read: boolean;
  actionable: boolean;
  actionUrl?: string;
  metadata?: {
    location?: string;
    assignee?: string;
    deadline?: string;
  };
}

const MOCK_ALERTS: Alert[] = [
  {
    id: 'A-001',
    type: 'critical',
    title: 'Hazard Reported - Chemical Storage',
    message: 'New hazard reported by John Smith in Chemical Storage Bay 4. Requires immediate attention.',
    source: 'Hazard Reporting System',
    timestamp: '2026-02-02T09:45:00',
    read: false,
    actionable: true,
    actionUrl: '/hazard-assessment',
    metadata: { location: 'Chemical Storage - Bay 4', assignee: 'Safety Team' },
  },
  {
    id: 'A-002',
    type: 'warning',
    title: 'Training Due - Forklift Certification',
    message: '3 employees have forklift certifications expiring within 14 days.',
    source: 'Training Management',
    timestamp: '2026-02-02T08:30:00',
    read: false,
    actionable: true,
    actionUrl: '/training-management',
    metadata: { deadline: '2026-02-16', assignee: 'HR Training' },
  },
  {
    id: 'A-003',
    type: 'warning',
    title: 'Inspection Overdue - Warehouse B',
    message: 'Weekly safety inspection for Warehouse B is 2 days overdue.',
    source: 'Inspection Scheduling',
    timestamp: '2026-02-02T07:00:00',
    read: false,
    actionable: true,
    actionUrl: '/inspection-scheduling',
    metadata: { location: 'Warehouse B', deadline: '2026-01-31' },
  },
  {
    id: 'A-004',
    type: 'info',
    title: 'Sensor Calibration Reminder',
    message: 'Gas Detector GD-201 calibration due in 7 days.',
    source: 'Sensor Monitoring',
    timestamp: '2026-02-01T16:00:00',
    read: true,
    actionable: true,
    actionUrl: '/sensor-calibration',
    metadata: { deadline: '2026-02-09' },
  },
  {
    id: 'A-005',
    type: 'success',
    title: 'Incident Resolved',
    message: 'Near-miss incident INC-2024-089 has been successfully investigated and closed.',
    source: 'Incident Management',
    timestamp: '2026-02-01T14:30:00',
    read: true,
    actionable: false,
  },
  {
    id: 'A-006',
    type: 'critical',
    title: 'Compliance Deadline Approaching',
    message: 'EPA reporting deadline in 5 days. 2 reports pending submission.',
    source: 'Compliance Module',
    timestamp: '2026-02-01T09:00:00',
    read: false,
    actionable: true,
    actionUrl: '/epa-reporting-dashboard',
    metadata: { deadline: '2026-02-07' },
  },
];

const ALERT_CONFIG = {
  critical: { color: 'bg-red-100 text-red-700 border-red-200',         icon: AlertCircle,  badge: 'bg-red-500',     badgeVariant: 'danger'  as const },
  warning:  { color: 'bg-amber-100 text-amber-700 border-amber-200',   icon: AlertTriangle, badge: 'bg-amber-500',   badgeVariant: 'warning' as const },
  info:     { color: 'bg-blue-100 text-blue-700 border-blue-200',      icon: Info,          badge: 'bg-blue-500',    badgeVariant: 'teal'    as const },
  success:  { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, badge: 'bg-emerald-500', badgeVariant: 'success' as const },
};

interface RealTimeAlertsProps {
  compact?: boolean;
  maxAlerts?: number;
}

export const RealTimeAlerts: React.FC<RealTimeAlertsProps> = ({ compact = false, maxAlerts = 10 }) => {
  const [alerts, setAlerts] = useState<Alert[]>(MOCK_ALERTS);
  const [filter, setFilter] = useState<'all' | 'unread' | 'critical'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filteredAlerts = alerts
    .filter(a => {
      if (filter === 'unread') return !a.read;
      if (filter === 'critical') return a.type === 'critical' || a.type === 'warning';
      return true;
    })
    .slice(0, maxAlerts);

  const stats = {
    total: alerts.length,
    unread: alerts.filter(a => !a.read).length,
    critical: alerts.filter(a => a.type === 'critical').length,
  };

  const handleMarkAsRead = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, read: true } : a));
  };

  const handleMarkAllRead = () => {
    setAlerts(prev => prev.map(a => ({ ...a, read: true })));
  };

  const handleDelete = (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsRefreshing(false);
  };

  // Simulate real-time alert
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate occasional new alerts
      if (Math.random() > 0.95) {
        const newAlert: Alert = {
          id: `A-${Date.now()}`,
          type: ['info', 'warning', 'success'][Math.floor(Math.random() * 3)] as any,
          title: 'System Check Complete',
          message: 'Automated system health check completed successfully.',
          source: 'System Monitor',
          timestamp: new Date().toISOString(),
          read: false,
          actionable: false,
        };
        setAlerts(prev => [newAlert, ...prev]);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  if (compact) {
    return (
      <SMCard className="rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-brand-600" />
            <span className="font-semibold text-brand-900">Alerts</span>
            {stats.unread > 0 && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full">
                {stats.unread}
              </span>
            )}
          </div>
          <SMButton variant="icon" size="sm" onClick={handleRefresh}>
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </SMButton>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {filteredAlerts.slice(0, 5).map((alert) => {
            const AlertIcon = ALERT_CONFIG[alert.type].icon;
            return (
              <div
                key={alert.id}
                onClick={() => !alert.read && handleMarkAsRead(alert.id)}
                className={`p-3 border-b border-surface-50 cursor-pointer hover:bg-surface-50 transition-colors ${!alert.read ? 'bg-blue-50/30' : ''}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1.5 rounded-lg ${ALERT_CONFIG[alert.type].color.split(' ')[0]}`}>
                    <AlertIcon className={`w-4 h-4 ${ALERT_CONFIG[alert.type].color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-brand-900 truncate">{alert.title}</p>
                    <p className="text-xs text-surface-500 truncate">{alert.message}</p>
                  </div>
                  {!alert.read && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
                </div>
              </div>
            );
          })}
        </div>
        <div className="p-3 bg-surface-50">
          <SMButton variant="ghost" className="w-full text-sm">View All Alerts</SMButton>
        </div>
      </SMCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-6 h-6 text-brand-600" />
            <h2 className="text-2xl font-bold text-brand-900">Real-Time Alerts</h2>
            {stats.unread > 0 && (
              <span className="px-2.5 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                {stats.unread} new
              </span>
            )}
          </div>
          <p className="text-surface-500">Automated notifications for hazards, training, compliance, and more</p>
        </div>
        <div className="flex gap-3">
          <SMButton
            variant={soundEnabled ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </SMButton>
          <SMButton
            variant="secondary"
            onClick={handleRefresh}
            leftIcon={<RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </SMButton>
          <SMButton
            variant="primary"
            onClick={handleMarkAllRead}
            leftIcon={<Check className="w-5 h-5" />}
          >
            Mark All Read
          </SMButton>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Alerts', value: stats.total, icon: Bell, color: 'brand' },
          { label: 'Unread', value: stats.unread, icon: Mail, color: 'blue' },
          { label: 'Critical', value: stats.critical, icon: AlertCircle, color: 'red' },
        ].map((stat) => (
          <MotionSMCard
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-2xl"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{stat.value}</div>
                <div className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          </MotionSMCard>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {[
          { id: 'all', label: 'All Alerts' },
          { id: 'unread', label: 'Unread' },
          { id: 'critical', label: 'Critical & Warnings' },
        ].map((tab) => (
          <SMButton
            key={tab.id}
            variant={filter === tab.id ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilter(tab.id as any)}
          >
            {tab.label}
          </SMButton>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map((alert) => {
            const AlertIcon = ALERT_CONFIG[alert.type].icon;
            return (
              <MotionSMCard
                key={alert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                className={`p-5 rounded-2xl ${!alert.read ? 'ring-2 ring-brand-100' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-2 rounded-xl ${ALERT_CONFIG[alert.type].color.split(' ')[0]}`}>
                      <AlertIcon className={`w-5 h-5 ${ALERT_CONFIG[alert.type].color.split(' ')[1]}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-brand-900">{alert.title}</h3>
                        <SMBadge size="sm" variant={ALERT_CONFIG[alert.type].badgeVariant}>{alert.type.toUpperCase()}</SMBadge>
                        {!alert.read && (
                          <SMBadge size="sm" variant="teal">NEW</SMBadge>
                        )}
                      </div>
                      <p className="text-sm text-surface-600 mb-3">{alert.message}</p>
                      <div className="flex items-center gap-4 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          {alert.source}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(alert.timestamp).toLocaleString()}
                        </span>
                        {alert.metadata?.location && (
                          <span className="flex items-center gap-1">
                            <Shield className="w-3 h-3" />
                            {alert.metadata.location}
                          </span>
                        )}
                        {alert.metadata?.deadline && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Due: {alert.metadata.deadline}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!alert.read && (
                      <SMButton
                        variant="icon"
                        size="sm"
                        onClick={() => handleMarkAsRead(alert.id)}
                        title="Mark as read"
                      >
                        <Check className="w-4 h-4" />
                      </SMButton>
                    )}
                    <SMButton
                      variant="icon"
                      size="sm"
                      onClick={() => handleDelete(alert.id)}
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </SMButton>
                  </div>
                </div>
                
                {alert.actionable && (
                  <div className="mt-4 pt-4 border-t border-surface-50 flex justify-end">
                    <SMButton variant="ghost" size="sm" rightIcon={<ChevronRight className="w-4 h-4" />}>
                      Take Action
                    </SMButton>
                  </div>
                )}
              </MotionSMCard>
            );
          })}
        </AnimatePresence>
      </div>

      {filteredAlerts.length === 0 && (
        <div className="text-center py-12 bg-surface-50 rounded-2xl">
          <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="font-semibold text-brand-900 mb-1">All caught up!</h3>
          <p className="text-surface-500">No alerts match your current filter.</p>
        </div>
      )}

      {/* Notification Settings */}
      <div className="bg-gradient-to-br from-brand-50 to-indigo-50 p-6 rounded-2xl border border-brand-100">
        <div className="flex items-center gap-3 mb-4">
          <Settings className="w-5 h-5 text-brand-600" />
          <h3 className="font-semibold text-brand-900">Notification Channels</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Mail, label: 'Email Alerts', description: 'Receive alerts via email', enabled: true },
            { icon: MessageSquare, label: 'SMS Alerts', description: 'Critical alerts via SMS', enabled: true },
            { icon: Smartphone, label: 'Push Notifications', description: 'Mobile app notifications', enabled: false },
          ].map((channel) => (
            <div key={channel.label} className="bg-white p-4 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-surface-50">
                  <channel.icon className="w-5 h-5 text-brand-600" />
                </div>
                <div>
                  <p className="font-medium text-brand-900">{channel.label}</p>
                  <p className="text-xs text-surface-500">{channel.description}</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 cursor-pointer transition-colors ${channel.enabled ? 'bg-brand-600' : 'bg-surface-200'}`}>
                <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${channel.enabled ? 'translate-x-4' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RealTimeAlerts;
