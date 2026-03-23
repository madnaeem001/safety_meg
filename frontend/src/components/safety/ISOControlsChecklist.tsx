import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, ArrowUpRight } from 'lucide-react';
import { SMCard, SMBadge } from '../../components/ui';

const MotionSMCard = motion.create(SMCard);

export interface ISOChecklistItem {
  id: string;
  clause: string;
  title: string;
  description: string;
}

interface ISOControlsChecklistProps {
  controls: ISOChecklistItem[];
}

export const ISOControlsChecklist: React.FC<ISOControlsChecklistProps> = ({ controls }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
            <FileText className="w-5 h-5 text-brand-600" />
          </div>
          <h3 className="text-xl font-bold text-brand-900 tracking-tight">ISO 45001 Compliance</h3>
        </div>
      </div>

      <div className="grid gap-4">
        {controls.map((control, index) => (
          <MotionSMCard
            key={control.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="p-6 flex gap-5 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-brand-50 rounded-full -mr-10 -mt-10 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
            
            <div className="mt-1 relative z-10">
              <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center border border-emerald-100">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
            
            <div className="relative z-10 flex-1">
              <div className="flex items-center justify-between mb-2">
                <SMBadge size="sm" variant="teal">Clause {control.clause}</SMBadge>
                <ArrowUpRight className="w-4 h-4 text-surface-300 group-hover:text-brand-500 transition-colors" />
              </div>
              <h4 className="font-bold text-brand-900 text-lg tracking-tight mb-2">{control.title}</h4>
              <p className="text-sm text-surface-500 leading-relaxed">
                {control.description}
              </p>
            </div>
          </MotionSMCard>
        ))}
      </div>
    </div>
  );
};
