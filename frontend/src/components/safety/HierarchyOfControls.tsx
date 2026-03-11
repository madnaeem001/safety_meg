import React from 'react';
import { motion } from 'framer-motion';
import { ControlItem } from '../../data/mockSafetyProcedures';
import { ChevronRight, Info, Shield } from 'lucide-react';

interface HierarchyOfControlsProps {
  controls: ControlItem[];
}

const getLevelColor = (id: string) => {
  switch (id) {
    case 'elimination': return 'bg-accent-500';
    case 'substitution': return 'bg-orange-500';
    case 'engineering': return 'bg-yellow-500';
    case 'administrative': return 'bg-brand-500';
    case 'ppe': return 'bg-emerald-500';
    default: return 'bg-surface-500';
  }
};

export const HierarchyOfControls: React.FC<HierarchyOfControlsProps> = ({ controls }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
            <Shield className="w-5 h-5 text-brand-600" />
          </div>
          <h3 className="text-xl font-bold text-brand-900 tracking-tight">Hierarchy of Controls</h3>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-surface-200 via-surface-200 to-transparent" />
        
        <div className="space-y-8">
          {controls.map((control, index) => (
            <motion.div
              key={control.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-14"
            >
              <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-4 border-surface-50 shadow-sm z-10 ${getLevelColor(control.id)}`} />
              
              <div className="bg-white p-6 rounded-[2rem] shadow-soft border border-surface-100 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-surface-50 rounded-full -mr-12 -mt-12 group-hover:bg-surface-100 transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-lg text-brand-900 tracking-tight">{control.title}</h4>
                    <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-surface-50 text-surface-500 border border-surface-100">
                      Level {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-surface-500 leading-relaxed mb-4">{control.description}</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {control.examples.map((example, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-surface-600 bg-surface-50/50 p-2 rounded-xl border border-surface-100/50">
                        <div className={`w-1.5 h-1.5 rounded-full ${getLevelColor(control.id)} opacity-60`} />
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
