import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Bell } from 'lucide-react';
import { useDashboardComplianceAlerts } from '../../api/hooks/useAPIHooks';
import { SMAlert, SMSkeleton } from '../ui';

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
      case 'critical': return <AlertTriangle className="w-5 h-5 text-danger" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      case 'success': return <CheckCircle className="w-5 h-5 text-success" />;
      case 'info': return <Info className="w-5 h-5 text-accent" />;
    }
  };

  const mapType = (type: Alert['type']) => {
    switch (type) {
      case 'critical': return 'danger';
      case 'warning': return 'warning';
      case 'success': return 'success';
      case 'info': return 'info';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-text-primary flex items-center gap-2">
          <Bell className="w-5 h-5 text-accent" />
          Real-time Compliance Alerts
        </h3>
        <span className="rounded-full border border-accent/20 bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
          Live
        </span>
      </div>
      
      <div className="space-y-3">
        {isLoading ? (
          Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 rounded-xl bg-surface-sunken p-4">
              <SMSkeleton className="mt-0.5 h-5 w-5 rounded-full" />
              <div className="flex-1 space-y-2">
                <SMSkeleton className="h-3 w-3/4 rounded-md" />
                <SMSkeleton className="h-2 w-20 rounded-md" />
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
              className="relative"
            >
              <SMAlert
                variant={mapType(alert.type)}
                icon={getIcon(alert.type)}
                onDismiss={() => removeAlert(alert.id)}
                className="pr-12"
              >
                <div className="pr-4">
                  <p className="text-sm font-medium text-text-primary">{alert.message}</p>
                  <p className="mt-1 text-xs text-text-muted">{alert.timestamp.toLocaleTimeString()}</p>
                </div>
              </SMAlert>
            </motion.div>
          ))}
        </AnimatePresence>
        )}
        
        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-8 text-text-muted text-sm">
            No active alerts
          </div>
        )}
      </div>
    </div>
  );
};
