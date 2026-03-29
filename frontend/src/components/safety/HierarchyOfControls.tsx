import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Info, Shield } from 'lucide-react';
import { SMCard } from '../../components/ui';

export interface HierarchyControlItem {
  id: string;
  title: string;
  description: string;
  examples: string[];
}

interface HierarchyOfControlsProps {
  controls: HierarchyControlItem[];
}

const getLevelColor = (id: string) => {
  switch (id) {
    case 'elimination': return 'bg-accent';
    case 'substitution': return 'bg-danger';
    case 'engineering': return 'bg-warning';
    case 'administrative': return 'bg-accent';
    case 'ppe': return 'bg-success';
    default: return 'bg-surface-border';
  }
};

export const HierarchyOfControls: React.FC<HierarchyOfControlsProps> = ({ controls }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
            <Shield className="w-5 h-5 text-accent" />
          </div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">Hierarchy of Controls</h3>
        </div>
      </div>
      
      <div className="relative">
        <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-surface-border via-surface-border to-transparent" />
        
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
              <div className={`absolute left-4 top-2 w-4 h-4 rounded-full border-4 border-surface-base shadow-sm z-10 ${getLevelColor(control.id)}`} />
              
              <SMCard className="p-6 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-24 h-24 bg-surface-sunken rounded-full -mr-12 -mt-12 group-hover:bg-surface-overlay transition-colors" />
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-lg text-text-primary tracking-tight">{control.title}</h4>
                    <span className="text-[10px] font-bold uppercase px-3 py-1 rounded-full bg-surface-sunken text-text-muted border border-surface-border">
                      Level {index + 1}
                    </span>
                  </div>
                  <p className="text-sm text-text-muted leading-relaxed mb-4">{control.description}</p>
                  
                  <div className="grid grid-cols-1 gap-2">
                    {control.examples.map((example, i) => (
                      <div key={i} className="flex items-center gap-3 text-xs text-text-secondary bg-surface-sunken/50 p-2 rounded-xl border border-surface-border/50">
                        <div className={`w-1.5 h-1.5 rounded-full ${getLevelColor(control.id)} opacity-60`} />
                        {example}
                      </div>
                    ))}
                  </div>
                </div>
              </SMCard>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};
