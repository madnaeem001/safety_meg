import React from 'react';
import { MapPin, Calendar, ChevronRight } from 'lucide-react';
import { Incident } from './types';
import { motion } from 'framer-motion';
import { SMCard, SMBadge } from '../../components/ui';

const MotionSMCard = motion(SMCard);

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
      default:         return { badge: 'text-text-muted bg-surface-raised border border-surface-border', bar: 'bg-text-muted' };
    }
  };

  const getStatusConfig = (status: Incident['status']) => {
    switch (status) {
      case 'Open':        return 'text-blue-600 bg-blue-50 border border-blue-200';
      case 'In Progress': return 'text-violet-600 bg-violet-50 border border-violet-200';
      case 'Resolved':    return 'text-emerald-600 bg-emerald-50 border border-emerald-200';
      default:            return 'text-text-muted bg-surface-raised border border-surface-border';
    }
  };

  const cfg = getSeverityConfig(incident.severity);

  return (
    <MotionSMCard
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className="relative overflow-hidden group cursor-pointer"
    >
      {/* Severity bar */}
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${cfg.bar} rounded-l-xl`} />

      <div className="pl-4 pr-4 py-3.5">
        <div className="flex items-center justify-between mb-2">
          <SMBadge size="sm" variant={incident.severity === 'Critical' ? 'danger' : incident.severity === 'High' ? 'warning' : incident.severity === 'Medium' ? 'warning' : incident.severity === 'Low' ? 'success' : 'neutral'}>
            {incident.severity}
          </SMBadge>
          <SMBadge size="sm" variant={incident.status === 'Resolved' ? 'success' : incident.status === 'Open' ? 'teal' : 'neutral'}>
            {incident.status}
          </SMBadge>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold mb-1.5 truncate text-text-primary">
              {incident.title}
            </h3>
            <div className="flex items-center gap-3 text-[11px] text-text-muted">
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
          <ChevronRight className="w-4 h-4 text-text-muted/40 group-hover:text-text-muted transition-colors shrink-0 ml-2" />
        </div>
      </div>
    </MotionSMCard>
  );
};
