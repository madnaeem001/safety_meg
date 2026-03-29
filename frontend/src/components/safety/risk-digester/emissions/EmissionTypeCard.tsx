import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';

export interface EmissionCardData {
  id: string;
  type: string;
  unit: string;
  actual: number;
  limit: number;
  status: 'Compliant' | 'Warning' | 'Exceeded';
  trend: 'up' | 'down' | 'stable';
}

interface EmissionTypeCardProps {
  emission: EmissionCardData;
  delay?: number;
}

export const EmissionTypeCard: React.FC<EmissionTypeCardProps> = ({ emission, delay = 0 }) => {
  const getStatusIcon = () => {
    switch (emission.status) {
      case 'Exceeded': return <AlertCircle className="w-5 h-5 text-danger" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-warning" />;
      default: return <CheckCircle2 className="w-5 h-5 text-success" />;
    }
  };

  const getTrendIcon = () => {
    switch (emission.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-danger" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-success" />;
      default: return <Minus className="w-4 h-4 text-text-muted" />;
    }
  };

  const progress = Math.min((emission.actual / emission.limit) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-surface-raised p-6 rounded-[2rem] shadow-soft border border-surface-border flex flex-col gap-4 group hover:border-accent/30 transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="bg-surface-sunken p-3 rounded-2xl group-hover:bg-accent/10 transition-colors">
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-1 bg-surface-sunken px-3 py-1 rounded-full border border-surface-border">
          {getTrendIcon()}
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{emission.trend}</span>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-text-primary tracking-tight">{emission.type}</h4>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-text-primary">{emission.actual}</span>
          <span className="text-xs font-medium text-text-muted">{emission.unit}</span>
          <span className="text-[10px] text-text-muted/60 mx-1">/</span>
          <span className="text-xs font-medium text-text-muted">{emission.limit} {emission.unit} limit</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-widest">
          <span>Utilization</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-sunken rounded-full overflow-hidden border border-surface-border">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className={`h-full rounded-full ${
              emission.status === 'Exceeded' ? 'bg-danger' : 
              emission.status === 'Warning' ? 'bg-warning' : 'bg-success'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};
