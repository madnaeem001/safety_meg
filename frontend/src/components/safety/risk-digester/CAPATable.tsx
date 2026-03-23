import React from 'react';
import { motion } from 'framer-motion';

import { type CAPA } from '../../../data/mockRiskDigester';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';
import { SMCard } from '../../ui';

export const CAPATable: React.FC = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Closed': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-accent" />;
      default: return <AlertCircle className="w-4 h-4 text-warning" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-danger/10 text-danger border-danger/20';
      case 'Medium': return 'bg-warning/10 text-warning border-warning/20';
      default: return 'bg-surface-100 text-text-muted border-surface-border';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <SMCard className="p-8 rounded-[2.5rem] flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">CAPA Management</h3>
            <p className="text-xs text-text-muted font-medium uppercase tracking-widest mt-1">Corrective & Preventive Actions</p>
          </div>
          <button className="text-[10px] font-bold text-accent uppercase tracking-widest hover:opacity-80 transition-colors flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-border">
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">ID</th>
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-widest">Action Item</th>
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Priority</th>
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-center">Status</th>
                <th className="pb-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right">Due Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border">
              {([] as CAPA[]).map((capa, index) => (
                <motion.tr 
                  key={capa.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-surface-100/60 transition-colors"
                >
                  <td className="py-4 text-xs font-bold text-accent">{capa.id}</td>
                  <td className="py-4 text-sm font-medium text-text-primary">{capa.title}</td>
                  <td className="py-4 text-center">
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getPriorityColor(capa.priority)}`}>
                      {capa.priority}
                    </span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center justify-center gap-2 text-xs font-medium text-text-primary">
                      {getStatusIcon(capa.status)}
                      {capa.status}
                    </div>
                  </td>
                  <td className="py-4 text-right text-xs font-medium text-text-muted">{capa.dueDate}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </SMCard>
    </motion.div>
  );
};
