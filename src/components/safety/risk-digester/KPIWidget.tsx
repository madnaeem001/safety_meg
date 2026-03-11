import React from 'react';
import { motion } from 'framer-motion';
import { SafetyKPI } from '../../../data/mockRiskDigester';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface KPIWidgetProps {
  kpi: SafetyKPI;
  delay?: number;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({ kpi, delay = 0 }) => {
  const getTrendIcon = () => {
    switch (kpi.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-accent-500" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-brand-500" />;
      default: return <Minus className="w-4 h-4 text-surface-400" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-white p-6 rounded-[2rem] shadow-soft border border-surface-100 flex flex-col justify-between h-full group hover:border-brand-200 transition-colors"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-[10px] font-bold text-surface-400 uppercase tracking-[0.2em]">{kpi.label}</div>
        <div className="bg-surface-50 p-2 rounded-xl group-hover:bg-brand-50 transition-colors">
          {getTrendIcon()}
        </div>
      </div>
      <div>
        <div className="text-3xl font-bold text-brand-900 tracking-tight mb-1">{kpi.value}</div>
        <p className="text-[10px] text-surface-500 leading-tight">{kpi.description}</p>
      </div>
    </motion.div>
  );
};
