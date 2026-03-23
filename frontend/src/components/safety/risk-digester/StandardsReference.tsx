import React from 'react';
import { motion } from 'framer-motion';

import { type StandardReference } from '../../../data/mockRiskDigester';
import { Shield, ExternalLink } from 'lucide-react';
import { SMCard } from '../../ui';

export const StandardsReference: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center border border-accent/20">
          <Shield className="w-5 h-5 text-accent" />
        </div>
        <h3 className="text-xl font-bold text-text-primary tracking-tight">Regulatory Standards</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {([] as StandardReference[]).map((standard, index) => (
          <motion.a
            key={standard.id}
            href={standard.link}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="block"
          >
            <SMCard className="p-6 rounded-[2rem] flex flex-col justify-between group hover:border-accent/30 transition-all h-full">
              <div>
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-bold text-text-primary tracking-tight">{standard.name}</h4>
                  <ExternalLink className="w-4 h-4 text-text-muted group-hover:text-accent transition-colors" />
                </div>
                <p className="text-xs text-text-muted leading-relaxed">
                  {standard.description}
                </p>
              </div>
            </SMCard>
          </motion.a>
        ))}
      </div>
    </div>
  );
};
