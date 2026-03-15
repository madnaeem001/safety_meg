import React from 'react';
import { motion } from 'framer-motion';

import { type CAPA } from '../../../data/mockRiskDigester';
import { CheckCircle2, Clock, AlertCircle, ArrowUpRight } from 'lucide-react';

export const CAPATable: React.FC = () => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Closed': return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case 'In Progress': return <Clock className="w-4 h-4 text-brand-500" />;
      default: return <AlertCircle className="w-4 h-4 text-accent-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'High': return 'bg-accent-50 text-accent-600 border-accent-100';
      case 'Medium': return 'bg-orange-50 text-orange-600 border-orange-100';
      default: return 'bg-surface-50 text-surface-500 border-surface-100';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-surface-100 flex flex-col"
    >
      <div className="flex justify-between items-center mb-8">
        <div>
          <h3 className="text-xl font-bold text-brand-900 tracking-tight">CAPA Management</h3>
          <p className="text-xs text-surface-500 font-medium uppercase tracking-widest mt-1">Corrective & Preventive Actions</p>
        </div>
        <button className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1">
          View All <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-surface-50">
              <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">ID</th>
              <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Action Item</th>
              <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center">Priority</th>
              <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-center">Status</th>
              <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-right">Due Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-50">
            {([] as CAPA[]).map((capa, index) => (
              <motion.tr 
                key={capa.id}
                initial={{ opacity: 0, x: -10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group hover:bg-surface-50/50 transition-colors"
              >
                <td className="py-4 text-xs font-bold text-brand-600">{capa.id}</td>
                <td className="py-4 text-sm font-medium text-brand-900">{capa.title}</td>
                <td className="py-4 text-center">
                  <span className={`text-[10px] font-bold px-3 py-1 rounded-full border ${getPriorityColor(capa.priority)}`}>
                    {capa.priority}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-center gap-2 text-xs font-medium text-surface-600">
                    {getStatusIcon(capa.status)}
                    {capa.status}
                  </div>
                </td>
                <td className="py-4 text-right text-xs font-medium text-surface-500">{capa.dueDate}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
};
