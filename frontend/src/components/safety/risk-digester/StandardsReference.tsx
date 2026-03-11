import React from 'react';
import { motion } from 'framer-motion';
import { STANDARDS_REFERENCES } from '../../../data/mockRiskDigester';
import { Shield, ExternalLink } from 'lucide-react';

export const StandardsReference: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 px-1">
        <div className="w-10 h-10 bg-brand-50 rounded-xl flex items-center justify-center border border-brand-100">
          <Shield className="w-5 h-5 text-brand-600" />
        </div>
        <h3 className="text-xl font-bold text-brand-900 tracking-tight">Regulatory Standards</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {STANDARDS_REFERENCES.map((standard, index) => (
          <motion.a
            key={standard.id}
            href={standard.link}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-[2rem] shadow-soft border border-surface-100 flex flex-col justify-between group hover:border-brand-200 transition-all"
          >
            <div>
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-bold text-brand-900 tracking-tight">{standard.name}</h4>
                <ExternalLink className="w-4 h-4 text-surface-300 group-hover:text-brand-500 transition-colors" />
              </div>
              <p className="text-xs text-surface-500 leading-relaxed">
                {standard.description}
              </p>
            </div>
          </motion.a>
        ))}
      </div>
    </div>
  );
};
