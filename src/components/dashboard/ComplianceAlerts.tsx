import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, X, Bell } from 'lucide-react';
import { useDashboardComplianceAlerts } from '../../api/hooks/useAPIHooks';

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info' | 'success';
  message: string;
  timestamp: Date;
}

export const ComplianceAlerts: React.FC = () => {
  const { data: backendAlerts, isLoading } = useDashboardComplianceAlerts();
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const alerts: Alert[] = (backendAlerts ?? []).map(a => ({
    id: String(a.id),
    type: (a.type as Alert['type']) ?? 'info',
    message: a.message,
    timestamp: new Date(typeof a.createdAt === 'number' ? a.createdAt : Date.parse(String(a.createdAt))),
  })).filter(a => !dismissed.has(a.id));

  const removeAlert = (id: string) => {
    setDismissed(prev => new Set(prev).add(id));
  };

  const getIcon = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'bg-red-50 border-red-100 dark:bg-red-900/20 dark:border-red-800/30';
      case 'warning': return 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30';
      case 'success': return 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/30';
      case 'info': return 'bg-blue-50 border-blue-100 dark:bg-blue-900/20 dark:border-blue-800/30';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-brand-600" />
          Real-time Compliance Alerts
        </h3>
        <span className="text-xs font-medium px-2 py-1 bg-brand-100 text-brand-700 rounded-full">
          Live
        </span>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          // Loading skeleton
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-4 rounded-xl border border-slate-700/30 bg-slate-800/40 flex items-start gap-3">
              <div className="w-5 h-5 rounded bg-slate-700/80 animate-pulse mt-0.5" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-3/4 rounded bg-slate-700/80 animate-pulse" />
                <div className="h-2 w-20 rounded bg-slate-700/60 animate-pulse" />
              </div>
            </div>
          ))
        ) : (
        <AnimatePresence>
          {alerts.map(alert => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              className={`p-4 rounded-xl border flex items-start gap-3 relative ${getBgColor(alert.type)}`}
            >
              <div className="mt-0.5">{getIcon(alert.type)}</div>
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {alert.message}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {alert.timestamp.toLocaleTimeString()}
                </p>
              </div>
              <button 
                onClick={() => removeAlert(alert.id)}
                className="p-1 hover:bg-black/5 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
        
        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-8 text-slate-400 text-sm">
            No active alerts
          </div>
        )}
      </div>
    </div>
  );
};
