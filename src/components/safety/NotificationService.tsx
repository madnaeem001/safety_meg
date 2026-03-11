import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, AlertTriangle, CheckCircle2, Info, X, Clock, 
  AlertCircle, FileText, Shield, Activity, Trash2, 
  BellOff, Volume2, Sparkles
} from 'lucide-react';

// Notification Types
export type NotificationType = 'success' | 'warning' | 'error' | 'info' | 'injury' | 'capa' | 'investigation';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'injury' | 'capa' | 'investigation' | 'general' | 'system';
  actionUrl?: string;
  actionLabel?: string;
  metadata?: Record<string, any>;
  expiresAt?: Date;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  notifyInjuryReport: (injuryId: string, severity: string, location: string) => void;
  notifyCAPADue: (capaId: string, action: string, dueDate: Date, daysRemaining: number) => void;
  notifyInvestigation: (investigationId: string, status: string, incident: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

// Notification Provider Component
export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [currentToast, setCurrentToast] = useState<Notification | null>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 100));
    setCurrentToast(newNotification);
    setShowToast(true);
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => setShowToast(false), 5000);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Specialized notification functions
  const notifyInjuryReport = useCallback((injuryId: string, severity: string, location: string) => {
    const priority = severity === 'Critical' ? 'critical' : 
                     severity === 'Lost Time' ? 'high' : 
                     severity === 'Medical Treatment' ? 'medium' : 'low';
    
    addNotification({
      type: 'injury',
      title: `New Injury Report: ${injuryId}`,
      message: `${severity} injury reported at ${location}. Immediate attention required.`,
      priority,
      category: 'injury',
      actionUrl: `/injury-report?id=${injuryId}`,
      actionLabel: 'View Report',
      metadata: { injuryId, severity, location }
    });
  }, [addNotification]);

  const notifyCAPADue = useCallback((capaId: string, action: string, dueDate: Date, daysRemaining: number) => {
    const priority = daysRemaining <= 0 ? 'critical' : 
                     daysRemaining <= 3 ? 'high' : 
                     daysRemaining <= 7 ? 'medium' : 'low';
    
    const title = daysRemaining <= 0 
      ? `OVERDUE: CAPA ${capaId}` 
      : `CAPA Due in ${daysRemaining} days`;
    
    addNotification({
      type: 'capa',
      title,
      message: action.substring(0, 100) + (action.length > 100 ? '...' : ''),
      priority,
      category: 'capa',
      actionUrl: `/root-cause-capa?id=${capaId}`,
      actionLabel: 'View CAPA',
      metadata: { capaId, dueDate, daysRemaining }
    });
  }, [addNotification]);

  const notifyInvestigation = useCallback((investigationId: string, status: string, incident: string) => {
    const priority = status === 'Critical' ? 'critical' : 'medium';
    
    addNotification({
      type: 'investigation',
      title: `Investigation Update: ${investigationId}`,
      message: `${incident} - Status: ${status}`,
      priority,
      category: 'investigation',
      actionUrl: `/investigation-reports?id=${investigationId}`,
      actionLabel: 'View Investigation',
      metadata: { investigationId, status, incident }
    });
  }, [addNotification]);

  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        addNotification, 
        markAsRead, 
        markAllAsRead,
        removeNotification, 
        clearAll,
        notifyInjuryReport,
        notifyCAPADue,
        notifyInvestigation
      }}
    >
      {children}
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && currentToast && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -50, x: 50 }}
            className="fixed top-4 right-4 z-[9999] max-w-sm"
          >
            <NotificationToast 
              notification={currentToast} 
              onClose={() => setShowToast(false)}
              onRead={() => markAsRead(currentToast.id)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </NotificationContext.Provider>
  );
};

// Toast Component
interface ToastProps {
  notification: Notification;
  onClose: () => void;
  onRead: () => void;
}

const NotificationToast: React.FC<ToastProps> = ({ notification, onClose, onRead }) => {
  const getIcon = () => {
    switch (notification.type) {
      case 'injury': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'capa': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'investigation': return <FileText className="w-5 h-5 text-blue-500" />;
      case 'success': return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBorderColor = () => {
    switch (notification.priority) {
      case 'critical': return 'border-l-red-500';
      case 'high': return 'border-l-orange-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-green-500';
    }
  };

  return (
    <div className={`
      bg-white rounded-xl shadow-2xl border border-surface-200 border-l-4 ${getBorderColor()}
      overflow-hidden backdrop-blur-xl
    `}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-surface-50">
            {getIcon()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-surface-900 text-sm">{notification.title}</p>
            <p className="text-xs text-surface-600 mt-1 line-clamp-2">{notification.message}</p>
            <p className="text-[10px] text-surface-400 mt-2">
              {notification.timestamp.toLocaleTimeString()}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-surface-100 rounded-lg transition-colors"
          >
            <X className="w-4 h-4 text-surface-400" />
          </button>
        </div>
        
        {notification.actionLabel && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onRead();
              onClose();
            }}
            className="mt-3 w-full py-2 px-3 bg-primary-50 hover:bg-primary-100 text-primary-700 
                       rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1"
          >
            <Activity className="w-3 h-3" />
            {notification.actionLabel}
          </motion.button>
        )}
      </div>
    </div>
  );
};

// Notification Center Component
export const NotificationCenter: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();

  const [filter, setFilter] = useState<'all' | 'unread' | 'injury' | 'capa' | 'investigation'>('all');

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.category === filter;
  });

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'injury': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'capa': return <Clock className="w-4 h-4 text-orange-500" />;
      case 'investigation': return <FileText className="w-4 h-4 text-blue-500" />;
      case 'success': return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'warning': return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      default: return <Info className="w-4 h-4 text-blue-500" />;
    }
  };

  const getPriorityBadge = (priority: Notification['priority']) => {
    const colors = {
      critical: 'bg-red-100 text-red-700 border-red-200',
      high: 'bg-orange-100 text-orange-700 border-orange-200',
      medium: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      low: 'bg-green-100 text-green-700 border-green-200'
    };
    return colors[priority];
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-full mt-2 w-96 max-h-[70vh] bg-white rounded-2xl shadow-2xl 
                 border border-surface-200 overflow-hidden z-50"
    >
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-primary-600 to-primary-700 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <span className="font-semibold">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs">
                {unreadCount} new
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 border-b border-surface-200 flex gap-2 overflow-x-auto">
        {[
          { key: 'all', label: 'All' },
          { key: 'unread', label: 'Unread' },
          { key: 'injury', label: 'Injuries' },
          { key: 'capa', label: 'CAPA' },
          { key: 'investigation', label: 'Investigations' }
        ].map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key as any)}
            className={`
              px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all
              ${filter === f.key 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'}
            `}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Actions */}
      <div className="px-4 py-2 border-b border-surface-100 flex justify-between">
        <button
          onClick={markAllAsRead}
          className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
        >
          <CheckCircle2 className="w-3 h-3" />
          Mark all read
        </button>
        <button
          onClick={clearAll}
          className="text-xs text-surface-500 hover:text-red-600 font-medium flex items-center gap-1"
        >
          <Trash2 className="w-3 h-3" />
          Clear all
        </button>
      </div>

      {/* Notification List */}
      <div className="overflow-y-auto max-h-[45vh]">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center">
            <BellOff className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500 text-sm">No notifications</p>
          </div>
        ) : (
          <div className="divide-y divide-surface-100">
            {filteredNotifications.map(notification => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`
                  p-4 hover:bg-surface-50 transition-colors cursor-pointer
                  ${!notification.read ? 'bg-primary-50/30' : ''}
                `}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-surface-100">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className={`font-medium text-sm ${!notification.read ? 'text-surface-900' : 'text-surface-700'}`}>
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <span className="w-2 h-2 bg-primary-500 rounded-full" />
                      )}
                    </div>
                    <p className="text-xs text-surface-500 line-clamp-2">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`
                        px-2 py-0.5 rounded text-[10px] font-medium border
                        ${getPriorityBadge(notification.priority)}
                      `}>
                        {notification.priority.toUpperCase()}
                      </span>
                      <span className="text-[10px] text-surface-400">
                        {notification.timestamp.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeNotification(notification.id);
                    }}
                    className="p-1 hover:bg-surface-200 rounded transition-colors"
                  >
                    <X className="w-3 h-3 text-surface-400" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Notification Bell Component for Header
export const NotificationBell: React.FC = () => {
  const { unreadCount } = useNotifications();
  const [showCenter, setShowCenter] = useState(false);

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowCenter(!showCenter)}
        className="relative p-2 rounded-xl hover:bg-surface-100 transition-colors"
      >
        <Bell className="w-5 h-5 text-surface-600" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[10px] 
                       font-bold rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {showCenter && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowCenter(false)}
            />
            <NotificationCenter onClose={() => setShowCenter(false)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationProvider;
