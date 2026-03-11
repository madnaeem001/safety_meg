import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, Settings, Filter, Search, ChevronRight, Check,
  AlertTriangle, AlertCircle, Clock, Calendar, X, Volume2, VolumeX,
  Trash2, Archive, CheckCircle2, Eye, ExternalLink, Zap, Activity,
  MessageSquare, Users, FileText, Shield, Building2, Flame
} from 'lucide-react';

// Notification types and interfaces
interface Notification {
  id: string;
  type: 'alert' | 'reminder' | 'task' | 'system' | 'compliance' | 'incident';
  category: string;
  title: string;
  description: string;
  timestamp: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'unread' | 'read' | 'archived';
  actionRequired: boolean;
  link?: string;
  source: string;
}

// Mock notifications
const mockNotifications: Notification[] = [
  {
    id: 'NOT-001',
    type: 'alert',
    category: 'safety',
    title: 'Critical: Gas Leak Detected',
    description: 'H2S sensor in Tank Farm Zone has exceeded safe threshold (25 ppm)',
    timestamp: '2026-01-25T20:15:00Z',
    priority: 'critical',
    status: 'unread',
    actionRequired: true,
    link: '/sensor/TF-GAS-001',
    source: 'IoT Sensor System',
  },
  {
    id: 'NOT-002',
    type: 'incident',
    category: 'incident',
    title: 'New Incident Reported',
    description: 'Near miss incident reported in Warehouse B - forklift collision averted',
    timestamp: '2026-01-25T19:45:00Z',
    priority: 'high',
    status: 'unread',
    actionRequired: true,
    link: '/incident/INC-2026-028',
    source: 'Incident Reporting',
  },
  {
    id: 'NOT-003',
    type: 'reminder',
    category: 'inspection',
    title: 'Inspection Due Tomorrow',
    description: 'Monthly SWPPP inspection scheduled for January 26, 2026',
    timestamp: '2026-01-25T18:00:00Z',
    priority: 'medium',
    status: 'unread',
    actionRequired: false,
    link: '/inspection/INS-2026-012',
    source: 'Scheduling System',
  },
  {
    id: 'NOT-004',
    type: 'compliance',
    category: 'training',
    title: 'Training Certification Expiring',
    description: '3 employees have HAZWOPER certifications expiring within 7 days',
    timestamp: '2026-01-25T16:30:00Z',
    priority: 'high',
    status: 'read',
    actionRequired: true,
    link: '/training/expiring',
    source: 'Training Management',
  },
  {
    id: 'NOT-005',
    type: 'task',
    category: 'capa',
    title: 'CAPA Action Overdue',
    description: 'Corrective action for INJ-2026-004 is past due date',
    timestamp: '2026-01-25T14:00:00Z',
    priority: 'critical',
    status: 'read',
    actionRequired: true,
    link: '/capa/CAPA-2026-015',
    source: 'CAPA System',
  },
  {
    id: 'NOT-006',
    type: 'system',
    category: 'system',
    title: 'System Maintenance Scheduled',
    description: 'Platform maintenance window: Sunday 2:00 AM - 4:00 AM EST',
    timestamp: '2026-01-25T12:00:00Z',
    priority: 'low',
    status: 'read',
    actionRequired: false,
    source: 'System',
  },
  {
    id: 'NOT-007',
    type: 'alert',
    category: 'environmental',
    title: 'Emission Limit Warning',
    description: 'VOC levels at Stack 3 approaching 80% of permit limit',
    timestamp: '2026-01-25T10:30:00Z',
    priority: 'high',
    status: 'read',
    actionRequired: true,
    link: '/emissions/stack-3',
    source: 'Environmental Monitoring',
  },
  {
    id: 'NOT-008',
    type: 'reminder',
    category: 'permit',
    title: 'Permit Renewal Required',
    description: 'Air Quality Permit expires in 30 days - renewal process needed',
    timestamp: '2026-01-25T09:00:00Z',
    priority: 'medium',
    status: 'archived',
    actionRequired: true,
    link: '/permits/AQ-2025-001',
    source: 'Permit Management',
  },
];

// Notification settings
interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  soundEnabled: boolean;
  categories: {
    [key: string]: boolean;
  };
  priorities: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
  };
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

const defaultSettings: NotificationSettings = {
  pushEnabled: true,
  emailEnabled: true,
  soundEnabled: true,
  categories: {
    safety: true,
    incident: true,
    environmental: true,
    training: true,
    inspection: true,
    permit: true,
    capa: true,
    system: true,
  },
  priorities: {
    critical: true,
    high: true,
    medium: true,
    low: false,
  },
  quietHours: {
    enabled: false,
    start: '22:00',
    end: '07:00',
  },
};

interface RealTimeNotificationsProps {
  onBack?: () => void;
}

export const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ onBack }) => {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [filter, setFilter] = useState<'all' | 'unread' | 'actionRequired'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [showNewAlert, setShowNewAlert] = useState(false);

  // Simulate real-time notifications
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldAddNotification = Math.random() > 0.7;
      if (shouldAddNotification && notifications.length < 20) {
        const newNotification: Notification = {
          id: `NOT-${Date.now()}`,
          type: Math.random() > 0.5 ? 'alert' : 'reminder',
          category: ['safety', 'environmental', 'training'][Math.floor(Math.random() * 3)],
          title: 'New Real-time Alert',
          description: `Auto-generated notification at ${new Date().toLocaleTimeString()}`,
          timestamp: new Date().toISOString(),
          priority: Math.random() > 0.7 ? 'high' : 'medium',
          status: 'unread',
          actionRequired: Math.random() > 0.5,
          source: 'Real-time System',
        };
        setNotifications(prev => [newNotification, ...prev]);
        setShowNewAlert(true);
        setTimeout(() => setShowNewAlert(false), 3000);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [notifications]);

  // Filter notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(notif => {
      const matchesFilter = filter === 'all' || 
        (filter === 'unread' && notif.status === 'unread') ||
        (filter === 'actionRequired' && notif.actionRequired);
      const matchesCategory = categoryFilter === 'all' || notif.category === categoryFilter;
      const matchesSearch = notif.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        notif.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesFilter && matchesCategory && matchesSearch && notif.status !== 'archived';
    });
  }, [notifications, filter, categoryFilter, searchQuery]);

  // Count unread
  const unreadCount = useMemo(() => 
    notifications.filter(n => n.status === 'unread').length, 
    [notifications]
  );

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, status: 'read' as const } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(n => ({ ...n, status: 'read' as const }))
    );
  };

  const archiveNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, status: 'archived' as const } : n)
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'incident': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'reminder': return <Clock className="w-5 h-5 text-blue-500" />;
      case 'task': return <CheckCircle2 className="w-5 h-5 text-purple-500" />;
      case 'compliance': return <Shield className="w-5 h-5 text-green-500" />;
      case 'system': return <Settings className="w-5 h-5 text-slate-500" />;
      default: return <Bell className="w-5 h-5 text-slate-500" />;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50 p-4 md:p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* New Alert Toast */}
        <AnimatePresence>
          {showNewAlert && (
            <motion.div
              initial={{ opacity: 0, y: -50, x: '-50%' }}
              animate={{ opacity: 1, y: 0, x: '-50%' }}
              exit={{ opacity: 0, y: -50, x: '-50%' }}
              className="fixed top-4 left-1/2 z-50 bg-blue-600 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-3"
            >
              <Zap className="w-5 h-5" />
              <span>New notification received!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            {onBack && (
              <button
                onClick={onBack}
                className="p-2 hover:bg-white/80 rounded-xl transition-colors"
              >
                <ChevronRight className="w-5 h-5 rotate-180" />
              </button>
            )}
            <div className="p-3 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg relative">
              <Bell className="w-8 h-8 text-white" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs text-white flex items-center justify-center font-bold">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Notifications</h1>
              <p className="text-sm text-slate-500">Real-time alerts and reminders</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
              className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              Mark All Read
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl shadow-sm hover:shadow-md transition-all text-sm"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
          </div>
        </motion.div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between bg-white rounded-2xl p-4 shadow-sm">
          <div className="flex gap-2 flex-wrap">
            {[
              { id: 'all', label: 'All', count: notifications.filter(n => n.status !== 'archived').length },
              { id: 'unread', label: 'Unread', count: unreadCount },
              { id: 'actionRequired', label: 'Action Required', count: notifications.filter(n => n.actionRequired && n.status !== 'archived').length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === tab.id
                    ? 'bg-violet-100 text-violet-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
                <span className="px-2 py-0.5 bg-white rounded-lg text-xs">{tab.count}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500 w-48"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-violet-500"
            >
              <option value="all">All Categories</option>
              <option value="safety">Safety</option>
              <option value="incident">Incidents</option>
              <option value="environmental">Environmental</option>
              <option value="training">Training</option>
              <option value="inspection">Inspections</option>
              <option value="capa">CAPA</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 shadow-sm text-center">
              <Bell className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-slate-800 mb-2">No Notifications</h3>
              <p className="text-slate-500">You're all caught up!</p>
            </div>
          ) : (
            filteredNotifications.map((notification, idx) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => {
                  setSelectedNotification(notification);
                  markAsRead(notification.id);
                }}
                className={`bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border-l-4 ${
                  notification.status === 'unread' ? 'border-l-violet-500 bg-violet-50/30' : 'border-l-transparent'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${
                    notification.priority === 'critical' ? 'bg-red-100' :
                    notification.priority === 'high' ? 'bg-orange-100' :
                    notification.priority === 'medium' ? 'bg-amber-100' : 'bg-slate-100'
                  }`}>
                    {getTypeIcon(notification.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className={`font-semibold ${notification.status === 'unread' ? 'text-slate-900' : 'text-slate-700'}`}>
                            {notification.title}
                          </h3>
                          {notification.actionRequired && (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                              Action Required
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-2">{notification.description}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap border ${getPriorityColor(notification.priority)}`}>
                        {notification.priority.charAt(0).toUpperCase() + notification.priority.slice(1)}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(notification.timestamp)}
                        </span>
                        <span>•</span>
                        <span>{notification.source}</span>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        {notification.status === 'unread' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                            title="Mark as read"
                          >
                            <Eye className="w-4 h-4 text-slate-400" />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            archiveNotification(notification.id);
                          }}
                          className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4 text-slate-400" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteNotification(notification.id);
                          }}
                          className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4 text-slate-400 hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        {/* Settings Modal */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
              onClick={() => setShowSettings(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="sticky top-0 bg-white p-6 border-b flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-800">Notification Settings</h2>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Delivery Methods */}
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Delivery Methods</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'pushEnabled', label: 'Push Notifications', icon: Bell },
                        { key: 'emailEnabled', label: 'Email Notifications', icon: MessageSquare },
                        { key: 'soundEnabled', label: 'Sound Alerts', icon: Volume2 },
                      ].map((item) => (
                        <label key={item.key} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100">
                          <div className="flex items-center gap-3">
                            <item.icon className="w-5 h-5 text-slate-500" />
                            <span className="text-slate-700">{item.label}</span>
                          </div>
                          <input
                            type="checkbox"
                            checked={settings[item.key as keyof NotificationSettings] as boolean}
                            onChange={(e) => setSettings(prev => ({ ...prev, [item.key]: e.target.checked }))}
                            className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                          />
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Priority Settings */}
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-3">Priority Levels</h3>
                    <div className="grid grid-cols-2 gap-3">
                      {(['critical', 'high', 'medium', 'low'] as const).map((priority) => (
                        <label key={priority} className={`flex items-center gap-2 p-3 rounded-xl cursor-pointer border-2 transition-all ${
                          settings.priorities[priority] ? 'border-violet-500 bg-violet-50' : 'border-slate-200 bg-slate-50'
                        }`}>
                          <input
                            type="checkbox"
                            checked={settings.priorities[priority]}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              priorities: { ...prev.priorities, [priority]: e.target.checked }
                            }))}
                            className="sr-only"
                          />
                          <span className={`px-2 py-1 rounded text-xs font-medium ${getPriorityColor(priority)}`}>
                            {priority.charAt(0).toUpperCase() + priority.slice(1)}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div>
                    <label className="flex items-center justify-between p-3 bg-slate-50 rounded-xl cursor-pointer hover:bg-slate-100 mb-3">
                      <div className="flex items-center gap-3">
                        <BellOff className="w-5 h-5 text-slate-500" />
                        <span className="text-slate-700">Quiet Hours</span>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings.quietHours.enabled}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          quietHours: { ...prev.quietHours, enabled: e.target.checked }
                        }))}
                        className="w-5 h-5 rounded text-violet-600 focus:ring-violet-500"
                      />
                    </label>
                    {settings.quietHours.enabled && (
                      <div className="grid grid-cols-2 gap-3 pl-4">
                        <div>
                          <label className="text-sm text-slate-500">Start</label>
                          <input
                            type="time"
                            value={settings.quietHours.start}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, start: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                          />
                        </div>
                        <div>
                          <label className="text-sm text-slate-500">End</label>
                          <input
                            type="time"
                            value={settings.quietHours.end}
                            onChange={(e) => setSettings(prev => ({
                              ...prev,
                              quietHours: { ...prev.quietHours, end: e.target.value }
                            }))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="sticky bottom-0 bg-white p-6 border-t">
                  <button
                    onClick={() => setShowSettings(false)}
                    className="w-full px-4 py-3 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors font-medium"
                  >
                    Save Settings
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default RealTimeNotifications;
