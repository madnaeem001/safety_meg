import React from 'react';
import { motion } from 'framer-motion';
import { EmissionLogItem } from '../../../../api/hooks/useAPIHooks';
import { Database, Download, Filter } from 'lucide-react';
import { SMButton } from '../../../ui';

interface EmissionLog {
  id: string;
  date: string;
  facility: string;
  type: string;
  value: number;
  unit: string;
  recordedBy: string;
}

interface EmissionHistoryTableProps {
  logs?: EmissionLogItem[];
}

function toDisplayLog(item: EmissionLogItem | EmissionLog): EmissionLog {
  return {
    id: String(item.id),
    date: item.date,
    facility: item.facility,
    type: item.type,
    value: Number(item.value),
    unit: item.unit,
    recordedBy: item.recordedBy,
  };
}

export const EmissionHistoryTable: React.FC<EmissionHistoryTableProps> = ({ logs }) => {
  const data = logs && logs.length > 0 ? logs.map(toDisplayLog) : [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="bg-white p-8 rounded-[2.5rem] shadow-soft border border-surface-100 flex flex-col"
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h3 className="text-xl font-bold text-brand-900 tracking-tight text-left">Emission Logs</h3>
          <p className="text-xs text-surface-500 font-medium uppercase tracking-widest mt-1 text-left">Detailed historical readings</p>
        </div>
        <div className="flex gap-2">
          <button className="p-3 bg-surface-50 rounded-2xl border border-surface-100 hover:bg-surface-100 transition-colors">
            <Filter className="w-4 h-4 text-surface-600" />
          </button>
          <SMButton variant="primary" size="sm" leftIcon={<Download className="w-4 h-4" />}>Export CSV</SMButton>
        </div>
      </div>

      {data.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-surface-50">
                <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Date</th>
                <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Facility</th>
                <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest">Type</th>
                <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-right">Value</th>
                <th className="pb-4 text-[10px] font-bold text-surface-400 uppercase tracking-widest text-right">Recorded By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50">
              {data.map((log, index) => (
                <motion.tr
                  key={log.id}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  className="group hover:bg-surface-50/50 transition-colors"
                >
                  <td className="py-4 text-xs font-medium text-surface-600">{log.date}</td>
                  <td className="py-4 text-sm font-bold text-brand-900">{log.facility}</td>
                  <td className="py-4">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-brand-50 text-brand-600 border border-brand-100">
                      {log.type}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <span className="text-sm font-bold text-brand-900">{log.value}</span>
                    <span className="text-[10px] font-medium text-surface-400 ml-1">{log.unit}</span>
                  </td>
                  <td className="py-4 text-right text-xs font-medium text-surface-500">{log.recordedBy}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center rounded-[2rem] border border-dashed border-surface-200 bg-surface-50/60 px-6 py-12 text-center">
          <div className="mb-3 rounded-2xl bg-white p-3 shadow-soft">
            <Database className="h-5 w-5 text-surface-400" />
          </div>
          <p className="font-semibold text-brand-900">No backend emission logs are available</p>
          <p className="mt-1 max-w-sm text-sm text-surface-500">
            Emission history is now sourced entirely from backend gas sensor readings for the selected reporting year.
          </p>
        </div>
      )}
    </motion.div>
  );
};
