import React from 'react';
import { motion } from 'framer-motion';
import { SafetyKPI } from '../../../data/mockRiskDigester';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { SMCard } from '../../ui';

interface KPIWidgetProps {
  kpi: SafetyKPI;
  delay?: number;
}

export const KPIWidget: React.FC<KPIWidgetProps> = ({ kpi, delay = 0 }) => {
  const getTrendIcon = () => {
    switch (kpi.trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-success" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-accent" />;
      default: return <Minus className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
    >
      <SMCard className="p-6 rounded-[2rem] flex flex-col justify-between h-full group hover:border-accent/30 transition-colors">
        <div className="flex justify-between items-start mb-4">
          <div className="text-[10px] font-bold text-text-muted uppercase tracking-[0.2em]">{kpi.label}</div>
          <div className="bg-surface-100 p-2 rounded-xl group-hover:bg-accent/5 transition-colors">
            {getTrendIcon()}
          </div>
        </div>
        <div>
          <div className="text-3xl font-bold text-text-primary tracking-tight mb-1">{kpi.value}</div>
          <p className="text-[10px] text-text-muted leading-tight">{kpi.description}</p>
        </div>
      </SMCard>
    </motion.div>
  );
};
