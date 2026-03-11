import React from 'react';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Incident } from './types';
import { motion } from 'framer-motion';

interface IncidentCardProps {
  incident: Incident;
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident }) => {
  const getSeverityConfig = (severity: Incident['severity']) => {
    switch (severity) {
      case 'Critical': return { badge: 'text-rose-600 bg-rose-50 border border-rose-200', bar: 'bg-rose-500' };
      case 'High':     return { badge: 'text-orange-600 bg-orange-50 border border-orange-200', bar: 'bg-orange-500' };
      case 'Medium':   return { badge: 'text-amber-600 bg-amber-50 border border-amber-200', bar: 'bg-amber-400' };
      case 'Low':      return { badge: 'text-emerald-600 bg-emerald-50 border border-emerald-200', bar: 'bg-emerald-500' };
      default:         return { badge: 'text-slate-600 bg-slate-100 border border-slate-200', bar: 'bg-slate-400' };
    }
  };

  const getStatusConfig = (status: Incident['status']) => {
    switch (status) {
      case 'Open':        return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'In Progress': return 'text-violet-600 bg-violet-50 border border-violet-200';
      case 'Resolved':    return 'text-emerald-600 bg-emerald-50 border border-emerald-200';
      default:            return 'text-slate-600 bg-slate-100 border border-slate-200';
    }
  };

  const cfg = getSeverityConfig(incident.severity);

  return (
    <motion.div
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative bg-white rounded-xl border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-200 overflow-hidden group cursor-pointer"
    >
      {/* Severity bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-xl`} />

      <div className="pl-4 pr-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md ${cfg.badge}`}>
            {incident.severity}
          </span>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${getStatusConfig(incident.status)}`}>
            {incident.status}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1.5 truncate" style={{ color: '#111827' }}>
              {incident.title}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" strokeWidth={2} />
                <span className="font-medium">{incident.location}</span>
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" strokeWidth={2} />
                <span className="font-medium">{incident.date.split(' ')[0]}</span>
              </div>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors shrink-0 ml-2" />
        </div>
      </div>
    </motion.div>
  );
};
