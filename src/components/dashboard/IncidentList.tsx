import React from 'react';
import { Incident } from './types';
import { IncidentCard } from './IncidentCard';
import { Plus, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface IncidentListProps {
  incidents: Incident[];
  isLoading?: boolean;
}

export const IncidentList: React.FC<IncidentListProps> = ({ incidents, isLoading }) => {
  const navigate = useNavigate();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.10)] overflow-hidden">
      {/* Header */}
      <div className="relative flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 50%, rgba(239,68,68,0.12) 0%, transparent 55%)' }} />
        <div className="flex items-center gap-3 relative">
          <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Recent Incidents</h2>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Live Safety Feed</p>
          </div>
          {!isLoading && (
            <span className="ml-1 px-2 py-0.5 bg-rose-500/20 border border-rose-500/30 text-rose-300 text-[10px] font-bold rounded-full">
              {incidents.length}
            </span>
          )}
        </div>
        <motion.button
          whileHover={{ x: 3 }}
          onClick={() => navigate('/incidents')}
          className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 relative"
        >
          View All
          <ArrowRight className="w-3.5 h-3.5" />
        </motion.button>
      </div>

      {/* Cards */}
      <div className="p-4 space-y-3 bg-white">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-slate-100 p-4 flex gap-3">
              <div className="w-1.5 h-full rounded-full bg-slate-200 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="flex justify-between">
                  <div className="h-4 w-16 bg-slate-100 rounded-lg animate-pulse" />
                  <div className="h-4 w-12 bg-slate-100 rounded-lg animate-pulse" />
                </div>
                <div className="h-4 w-3/4 bg-slate-100 rounded animate-pulse" />
                <div className="h-3 w-1/2 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : incidents.length === 0 ? (
          <div className="py-10 text-center text-slate-400 text-xs">
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
        <motion.button
          whileHover={{ scale: 1.015 }}
          whileTap={{ scale: 0.985 }}
          onClick={() => navigate('/incidents/new')}
          className="w-full py-3.5 flex items-center justify-center gap-2.5 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-rose-500/20 hover:shadow-rose-500/30"
        >
          <Plus className="w-4.5 h-4.5" strokeWidth={2.5} />
          Report New Incident
        </motion.button>
      </div>
    </div>
  );
};
