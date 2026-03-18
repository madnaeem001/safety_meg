import React from 'react';
import { Incident } from './types';
import { IncidentCard } from './IncidentCard';
import { Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { SMButton, SMCard, SMSkeleton } from '../../components/ui';

interface IncidentListProps {
  incidents: Incident[];
  isLoading?: boolean;
}

export const IncidentList: React.FC<IncidentListProps> = ({ incidents, isLoading }) => {
  const navigate = useNavigate();

  return (
    <SMCard className="rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between gap-3 px-4 sm:px-5 py-4 border-b border-surface-border bg-surface-raised overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 50%, rgba(239,68,68,0.12) 0%, transparent 55%)' }} />
        <div className="flex items-center gap-3 relative min-w-0 flex-1">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-text-primary tracking-tight truncate">Recent Incidents</h2>
            <p className="text-xs text-text-muted font-mono uppercase tracking-widest truncate">Live Safety Feed</p>
          </div>
          {!isLoading && (
            <span className="ml-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-bold rounded-full shrink-0">
              {incidents.length}
            </span>
          )}
        </div>
        <SMButton
          variant="ghost"
          size="sm"
          className="shrink-0"
          onClick={() => navigate('/incidents')}
          rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
        >
          View All
        </SMButton>
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3 bg-transparent">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-surface-border bg-surface-raised p-4 flex gap-3">
              <SMSkeleton className="h-20 w-1.5 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <SMSkeleton className="h-4 w-16 rounded-lg" />
                  <SMSkeleton className="h-4 w-12 rounded-lg" />
                </div>
                <SMSkeleton className="h-4 w-3/4 rounded-lg" />
                <SMSkeleton className="h-3 w-1/2 rounded-lg" />
              </div>
            </div>
          ))
        ) : incidents.length === 0 ? (
          <div className="py-10 text-center text-text-muted text-xs">
            <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No incidents recorded
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {incidents.map((incident, i) => (
              <motion.div
                key={incident.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <IncidentCard incident={incident} />
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-4 pb-4">
        <SMButton
          variant="primary"
          className="w-full"
          leftIcon={<Plus className="w-4 h-4" strokeWidth={2.5} />}
          onClick={() => navigate('/report-incident')}
        >
          Report New Incident
        </SMButton>
      </div>
    </SMCard>
  );
};
