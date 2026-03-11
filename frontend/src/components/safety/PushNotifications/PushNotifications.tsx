import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  BellOff,
  BellRing,
  Check,
  X,
  Smartphone,
  Monitor,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  Settings,
  Shield,
  Flame,
  AlertCircle,
  FileText,
  Users,
  Calendar,
  Zap,
  Volume2,
  VolumeX,
  RefreshCw,
  Send,
  Trash2,
  ChevronRight
} from 'lucide-react';

interface NotificationPermissionState {
  status: 'default' | 'granted' | 'denied';
  supported: boolean;
}

interface ScheduledNotification {
  id: string;
  title: string;
  body: string;
  scheduledTime: Date;
  type: 'incident' | 'compliance' | 'training' | 'permit' | 'audit' | 'emergency';
  priority: 'low' | 'medium' | 'high' | 'critical';
  sent: boolean;
}

interface NotificationCategory {
  id: string;
  name: string;
  icon: React.ReactNode;
  enabled: boolean;
  sound: boolean;
  vibrate: boolean;
  badge: boolean;
}

const mockScheduledNotifications: ScheduledNotification[] = [
  { id: '1', title: 'Safety Training Due', body: 'Your HAZWOPER refresher training expires in 7 days', scheduledTime: new Date(Date.now() + 86400000), type: 'training', priority: 'medium', sent: false },
  { id: '2', title: 'Permit Expiring Soon', body: 'Hot Work Permit #HW-2026-045 expires tomorrow', scheduledTime: new Date(Date.now() + 3600000), type: 'permit', priority: 'high', sent: false },
  { id: '3', title: 'Monthly Safety Audit', body: 'Building A monthly safety audit scheduled for 9:00 AM', scheduledTime: new Date(Date.now() + 172800000), type: 'audit', priority: 'medium', sent: false },
  { id: '4', title: 'Compliance Deadline', body: 'EPA Form R submission deadline in 3 days', scheduledTime: new Date(Date.now() + 259200000), type: 'compliance', priority: 'high', sent: false },
  { id: '5', title: 'Incident Follow-up', body: 'CAPA review required for INC-2026-008', scheduledTime: new Date(Date.now() + 7200000), type: 'incident', priority: 'critical', sent: false },
];

const defaultCategories: NotificationCategory[] = [
  { id: 'incident', name: 'Incidents & Injuries', icon: <AlertTriangle className="w-5 h-5" />, enabled: true, sound: true, vibrate: true, badge: true },
  { id: 'compliance', name: 'Compliance Alerts', icon: <Shield className="w-5 h-5" />, enabled: true, sound: true, vibrate: false, badge: true },
  { id: 'training', name: 'Training Reminders', icon: <Users className="w-5 h-5" />, enabled: true, sound: false, vibrate: false, badge: true },
  { id: 'permit', name: 'Permit Notifications', icon: <FileText className="w-5 h-5" />, enabled: true, sound: true, vibrate: true, badge: true },
  { id: 'audit', name: 'Audit Schedules', icon: <Calendar className="w-5 h-5" />, enabled: true, sound: false, vibrate: false, badge: true },
  { id: 'emergency', name: 'Emergency Alerts', icon: <Flame className="w-5 h-5" />, enabled: true, sound: true, vibrate: true, badge: true },
];

export const PushNotifications: React.FC = () => {
  const [permissionState, setPermissionState] = useState<NotificationPermissionState>({
    status: 'default',
    supported: false
  });
  const [categories, setCategories] = useState<NotificationCategory[]>(defaultCategories);
  const [scheduledNotifications, setScheduledNotifications] = useState<ScheduledNotification[]>(mockScheduledNotifications);
  const [activeTab, setActiveTab] = useState<'settings' | 'scheduled' | 'test'>('settings');
  const [testNotificationSent, setTestNotificationSent] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    // Check if notifications are supported
    const supported = 'Notification' in window && 'serviceWorker' in navigator;
    setPermissionState({
      status: supported ? (Notification.permission as 'default' | 'granted' | 'denied') : 'default',
      supported
    });

    // Get service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(registration => {
        setSwRegistration(registration);
      });
    }
  }, []);

  const requestPermission = async () => {
    if (!permissionState.supported) return;
    
    try {
      const permission = await Notification.requestPermission();
      setPermissionState(prev => ({
        ...prev,
        status: permission as 'default' | 'granted' | 'denied'
      }));
    } catch (error) {
      console.error('Error requesting notification permission:', error);
    }
  };

  const sendTestNotification = async () => {
    if (permissionState.status !== 'granted') {
      await requestPermission();
      return;
    }

    const notification = new Notification('safetyMEG Test Notification', {
      body: 'Push notifications are working correctly! 🎉',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-notification',
      requireInteraction: false,
      vibrate: [200, 100, 200]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTestNotificationSent(true);
    setTimeout(() => setTestNotificationSent(false), 3000);
  };

  const sendCustomNotification = (title: string, body: string, type: string) => {
    if (permissionState.status !== 'granted') return;

    const iconMap: Record<string, string> = {
      incident: '🚨',
      compliance: '📋',
      training: '📚',
      permit: '📄',
      audit: '🔍',
      emergency: '🔥'
    };

    new Notification(`${iconMap[type] || '📢'} ${title}`, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: `notification-${Date.now()}`,
      vibrate: [200, 100, 200]
    });
  };

  const toggleCategory = (categoryId: string, field: keyof NotificationCategory) => {
    setCategories(prev => prev.map(cat => 
      cat.id === categoryId 
        ? { ...cat, [field]: !cat[field] }
        : cat
    ));
  };

  const deleteScheduledNotification = (id: string) => {
    setScheduledNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-500 bg-red-500/10';
      case 'high': return 'text-orange-500 bg-orange-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'incident': return <AlertTriangle className="w-4 h-4" />;
      case 'compliance': return <Shield className="w-4 h-4" />;
      case 'training': return <Users className="w-4 h-4" />;
      case 'permit': return <FileText className="w-4 h-4" />;
      case 'audit': return <Calendar className="w-4 h-4" />;
      case 'emergency': return <Flame className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const formatScheduledTime = (date: Date) => {
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    
    if (hours > 24) {
      return `in ${Math.floor(hours / 24)} days`;
    } else if (hours > 0) {
      return `in ${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `in ${minutes}m`;
    } else {
      return 'any moment';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl">
              <BellRing className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Push Notifications</h1>
              <p className="text-slate-400 text-sm">Real-time alerts on any device</p>
            </div>
          </div>
        </motion.div>

        {/* Permission Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-6 p-4 rounded-xl border ${
            permissionState.status === 'granted'
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : permissionState.status === 'denied'
              ? 'bg-red-500/10 border-red-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {permissionState.status === 'granted' ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : permissionState.status === 'denied' ? (
                <BellOff className="w-6 h-6 text-red-400" />
              ) : (
                <AlertCircle className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <h3 className={`font-medium ${
                  permissionState.status === 'granted' ? 'text-emerald-400' 
                  : permissionState.status === 'denied' ? 'text-red-400' 
                  : 'text-amber-400'
                }`}>
                  {permissionState.status === 'granted' 
                    ? 'Notifications Enabled' 
                    : permissionState.status === 'denied'
                    ? 'Notifications Blocked'
                    : 'Notifications Not Enabled'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {permissionState.status === 'granted'
                    ? 'You will receive real-time safety alerts'
                    : permissionState.status === 'denied'
                    ? 'Enable in browser settings to receive alerts'
                    : 'Enable to receive critical safety notifications'}
                </p>
              </div>
            </div>
            {permissionState.status !== 'granted' && permissionState.status !== 'denied' && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={requestPermission}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Bell className="w-4 h-4" />
                Enable
              </motion.button>
            )}
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl">
          {[
            { id: 'settings', label: 'Categories', icon: <Settings className="w-4 h-4" /> },
            { id: 'scheduled', label: 'Scheduled', icon: <Clock className="w-4 h-4" /> },
            { id: 'test', label: 'Test', icon: <Send className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {categories.map((category, index) => (
                <motion.div
                  key={category.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        category.enabled ? 'bg-purple-500/20 text-purple-400' : 'bg-slate-700 text-slate-500'
                      }`}>
                        {category.icon}
                      </div>
                      <span className="font-medium text-white">{category.name}</span>
                    </div>
                    <button
                      onClick={() => toggleCategory(category.id, 'enabled')}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        category.enabled ? 'bg-purple-600' : 'bg-slate-600'
                      }`}
                    >
                      <motion.div
                        animate={{ x: category.enabled ? 24 : 2 }}
                        className="absolute top-1 w-4 h-4 bg-white rounded-full"
                      />
                    </button>
                  </div>
                  
                  {category.enabled && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="flex gap-4 pt-3 border-t border-slate-700/50"
                    >
                      <button
                        onClick={() => toggleCategory(category.id, 'sound')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          category.sound 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-slate-700/50 text-slate-500'
                        }`}
                      >
                        {category.sound ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        Sound
                      </button>
                      <button
                        onClick={() => toggleCategory(category.id, 'vibrate')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          category.vibrate 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-slate-700/50 text-slate-500'
                        }`}
                      >
                        <Smartphone className="w-4 h-4" />
                        Vibrate
                      </button>
                      <button
                        onClick={() => toggleCategory(category.id, 'badge')}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                          category.badge 
                            ? 'bg-purple-500/20 text-purple-400' 
                            : 'bg-slate-700/50 text-slate-500'
                        }`}
                      >
                        <Bell className="w-4 h-4" />
                        Badge
                      </button>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}

          {activeTab === 'scheduled' && (
            <motion.div
              key="scheduled"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {scheduledNotifications.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No scheduled notifications</p>
                </div>
              ) : (
                scheduledNotifications.map((notification, index) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${getPriorityColor(notification.priority)}`}>
                          {getTypeIcon(notification.type)}
                        </div>
                        <div>
                          <h4 className="font-medium text-white">{notification.title}</h4>
                          <p className="text-sm text-slate-400 mt-1">{notification.body}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${getPriorityColor(notification.priority)}`}>
                              {notification.priority}
                            </span>
                            <span className="text-xs text-slate-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatScheduledTime(notification.scheduledTime)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteScheduledNotification(notification.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'test' && (
            <motion.div
              key="test"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Test Notification */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Send Test Notification</h3>
                <p className="text-slate-400 text-sm mb-4">
                  Click the button below to send a test notification and verify your setup.
                </p>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={sendTestNotification}
                  disabled={permissionState.status === 'denied'}
                  className={`w-full py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                    testNotificationSent
                      ? 'bg-emerald-600 text-white'
                      : permissionState.status === 'denied'
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-500 text-white'
                  }`}
                >
                  {testNotificationSent ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Notification Sent!
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Send Test Notification
                    </>
                  )}
                </motion.button>
              </div>

              {/* Quick Test Buttons */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Test by Category</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {[
                    { type: 'incident', title: 'Incident Alert', body: 'New incident reported in Building A', icon: <AlertTriangle className="w-4 h-4" /> },
                    { type: 'compliance', title: 'Compliance Due', body: 'EPA report deadline approaching', icon: <Shield className="w-4 h-4" /> },
                    { type: 'training', title: 'Training Reminder', body: 'Safety training session tomorrow', icon: <Users className="w-4 h-4" /> },
                    { type: 'permit', title: 'Permit Expiring', body: 'Hot Work Permit expires in 2 hours', icon: <FileText className="w-4 h-4" /> },
                    { type: 'audit', title: 'Audit Scheduled', body: 'Monthly audit starts at 9:00 AM', icon: <Calendar className="w-4 h-4" /> },
                    { type: 'emergency', title: 'Emergency Alert', body: 'Fire drill in progress - evacuate', icon: <Flame className="w-4 h-4" /> }
                  ].map(item => (
                    <motion.button
                      key={item.type}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => sendCustomNotification(item.title, item.body, item.type)}
                      disabled={permissionState.status !== 'granted'}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        permissionState.status === 'granted'
                          ? 'bg-slate-700/50 border-slate-600/50 hover:bg-slate-700 hover:border-purple-500/50'
                          : 'bg-slate-800/30 border-slate-700/30 cursor-not-allowed opacity-50'
                      }`}
                    >
                      <div className="flex items-center gap-2 text-purple-400 mb-1">
                        {item.icon}
                        <span className="text-sm font-medium">{item.type}</span>
                      </div>
                      <p className="text-xs text-slate-400">{item.title}</p>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Device Info */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Device Support</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Monitor className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Browser Notifications</span>
                    </div>
                    {permissionState.supported ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <X className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Service Worker</span>
                    </div>
                    {swRegistration ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <RefreshCw className="w-5 h-5 text-amber-400 animate-spin" />
                    )}
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-slate-400" />
                      <span className="text-slate-300">Push API</span>
                    </div>
                    {'PushManager' in window ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <X className="w-5 h-5 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default PushNotifications;
