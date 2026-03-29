import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Bell, BellOff, Volume2, VolumeX, Check, X,
  Clock, AlertTriangle, Shield, FileText, Users, Zap,
  ChevronRight, Settings, Trash2, Eye, Filter, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useBackendNotifications,
  useMarkNotificationsRead,
} from '../api/hooks/useAPIHooks';

type NotifType = 'incident_reported' | 'incident_updated' | 'permit_pending' | 'permit_approved' | 'permit_rejected' | 'jsa_submitted' | 'jsa_approved' | 'jsa_rejected' | 'capa_assigned' | 'capa_due' | 'capa_overdue' | 'training_reminder' | 'training_completed' | 'emergency' | string;

export const NotificationCenter: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'unread' | string>('all');
  const [showSettings, setShowSettings] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());

  const { data: notifications, loading, refetch } = useBackendNotifications({ limit: 100 });
  const markRead = useMarkNotificationsRead();

  const handleMarkAllAsRead = () => {
    const unread = (notifications ?? []).filter(n => !n.isRead).map(n => n.id);
    if (unread.length > 0) markRead.mutate(unread).then(() => refetch());
  };

  const handleMarkRead = (id: number) => {
    markRead.mutate([id]).then(() => refetch());
  };

  const handleDismiss = (id: number) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleNotifs = (notifications ?? []).filter(n => !dismissed.has(n.id));
  const unreadCount = visibleNotifs.filter(n => !n.isRead).length;

  const filteredNotifications = visibleNotifs.filter(n => {
    if (filter === 'unread') return !n.isRead;
    if (filter !== 'all') return n.notificationType === filter;
    return true;
  });

  const getTypeIcon = (type: NotifType) => {
    if (type?.includes('incident')) return <AlertTriangle className="w-5 h-5 text-red-500" />;
    if (type?.includes('permit')) return <FileText className="w-5 h-5 text-orange-500" />;
    if (type?.includes('jsa') || type?.includes('safety')) return <Shield className="w-5 h-5 text-teal-500" />;
    if (type?.includes('capa')) return <Clock className="w-5 h-5 text-purple-500" />;
    if (type?.includes('training')) return <Users className="w-5 h-5 text-blue-500" />;
    if (type?.includes('emergency')) return <Zap className="w-5 h-5 text-red-600" />;
    return <Bell className="w-5 h-5 text-surface-500" />;
  };

  const getPriorityStyle = (severity?: string) => {
    switch (severity?.toLowerCase()) {
      case 'critical': return 'border-l-4 border-l-red-500 bg-red-50';
      case 'high': return 'border-l-4 border-l-orange-500 bg-orange-50';
      case 'medium': return 'border-l-4 border-l-blue-500';
      default: return 'border-l-4 border-l-surface-300';
    }
  };

  const timeSince = (ts: number) => {
    const seconds = Math.floor((Date.now() - ts * 1000) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="page-wrapper transition-colors duration-300">
      {/* Header */}
      <div className="bg-surface-raised border-b border-surface-border sticky top-[72px] z-50 safe-top transition-colors duration-300">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-overlay rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-text-secondary" />
            </button>
            <h1 className="page-title flex items-center gap-2">
              <Bell className="w-6 h-6 text-brand-600" />
              Notifications
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{unreadCount}</span>
              )}
            </h1>
            <div className="flex items-center gap-2">
              <button onClick={() => refetch()} className="p-2 hover:bg-surface-overlay rounded-full transition-colors">
                <RefreshCw className="w-5 h-5 text-text-secondary" />
              </button>
              <button 
                onClick={() => setSoundEnabled(v => !v)}
                className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-5 h-5 text-text-secondary" /> : <VolumeX className="w-5 h-5 text-text-muted" />}
              </button>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto no-scrollbar pb-1">
            {[
              { id: 'all', label: 'All' },
              { id: 'unread', label: 'Unread' },
              { id: 'incident', label: 'Incidents' },
              { id: 'permit', label: 'Permits' },
              { id: 'capa', label: 'CAPAs' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  filter === f.id
                    ? 'bg-brand-600 text-white'
                    : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mark All Read */}
      {unreadCount > 0 && (
        <div className="px-4 py-3 bg-brand-50 border-b border-brand-100">
          <button 
            onClick={handleMarkAllAsRead}
            className="text-sm text-brand-600 font-medium flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            Mark all as read ({unreadCount} unread)
          </button>
        </div>
      )}

      <main className="px-4 py-4 space-y-2">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-surface-400">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12 text-surface-500">
            <BellOff className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p className="text-lg font-medium">No notifications</p>
            <p className="text-sm">You're all caught up!</p>
          </div>
        ) : (
          filteredNotifications.map((notification) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`bg-white rounded-xl overflow-hidden shadow-sm ${getPriorityStyle(notification.severity)} ${
                notification.isRead ? 'opacity-70' : ''
              }`}
            >
              <button
                onClick={() => handleMarkRead(notification.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {getTypeIcon(notification.notificationType ?? '')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium ${notification.isRead ? 'text-surface-600' : 'text-surface-900'}`}>
                        {notification.title}
                      </p>
                      {!notification.isRead && (
                        <span className="w-2 h-2 bg-blue-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-sm text-surface-600 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-surface-400">
                      <span>{notification.createdAt ? timeSince(notification.createdAt) : ''}</span>
                      {notification.severity && (
                        <>
                          <span>•</span>
                          <span className="capitalize">{notification.severity}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </button>
              <div className="flex border-t border-surface-100">
                <button 
                  onClick={() => handleDismiss(notification.id)}
                  className="flex-1 px-4 py-2 text-sm text-surface-500 hover:bg-surface-50 transition-colors"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          ))
        )}
      </main>
    </div>
  );
};

export default NotificationCenter;
