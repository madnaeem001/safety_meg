import React from 'react';
import { Shield } from 'lucide-react';
import { motion } from 'framer-motion';

interface CompanyHeaderProps {
  companyName: string;
}

export const CompanyHeader: React.FC<CompanyHeaderProps> = ({ companyName }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-brand-900 text-white p-8 rounded-[2.5rem] shadow-glow flex flex-col gap-6 relative overflow-hidden group"
    >
      <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-24 -mt-24 blur-3xl group-hover:bg-white/10 transition-colors" />
      <div className="bg-white/10 w-16 h-16 rounded-2xl backdrop-blur-md border border-white/10 flex items-center justify-center relative z-10">
        <Shield className="w-8 h-8 text-white" />
      </div>
      <div className="relative z-10">
        <h2 className="text-[10px] font-bold text-brand-300 uppercase tracking-[0.3em] mb-2">Safety Management System</h2>
        <h1 className="text-4xl font-bold tracking-tighter leading-none">{companyName}</h1>
      </div>
    </motion.div>
  );
};
