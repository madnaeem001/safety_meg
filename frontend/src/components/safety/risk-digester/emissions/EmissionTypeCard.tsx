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
      case 'Exceeded': return <AlertCircle className="w-5 h-5 text-accent-500" />;
      case 'Warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      default: return <CheckCircle2 className="w-5 h-5 text-brand-500" />;
    }
  };

  const getTrendIcon = () => {
    switch (emission.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-accent-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-brand-500" />;
      default: return <Minus className="w-4 h-4 text-surface-400" />;
    }
  };

  const progress = Math.min((emission.actual / emission.limit) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white p-6 rounded-[2rem] shadow-soft border border-surface-100 flex flex-col gap-4 group hover:border-brand-200 transition-all"
    >
      <div className="flex justify-between items-start">
        <div className="bg-surface-50 p-3 rounded-2xl group-hover:bg-brand-50 transition-colors">
          {getStatusIcon()}
        </div>
        <div className="flex items-center gap-1 bg-surface-50 px-3 py-1 rounded-full border border-surface-100">
          {getTrendIcon()}
          <span className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">{emission.trend}</span>
        </div>
      </div>

      <div>
        <h4 className="font-bold text-brand-900 tracking-tight">{emission.type}</h4>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-bold text-brand-900">{emission.actual}</span>
          <span className="text-xs font-medium text-surface-400">{emission.unit}</span>
          <span className="text-[10px] text-surface-300 mx-1">/</span>
          <span className="text-xs font-medium text-surface-400">{emission.limit} {emission.unit} limit</span>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-[10px] font-bold text-surface-400 uppercase tracking-widest">
          <span>Utilization</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2 bg-surface-50 rounded-full overflow-hidden border border-surface-100">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${progress}%` }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: delay + 0.2 }}
            className={`h-full rounded-full ${
              emission.status === 'Exceeded' ? 'bg-accent-500' : 
              emission.status === 'Warning' ? 'bg-orange-500' : 'bg-brand-500'
            }`}
          />
        </div>
      </div>
    </motion.div>
  );
};
