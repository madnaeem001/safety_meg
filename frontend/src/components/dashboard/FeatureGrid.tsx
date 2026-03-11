import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_SECTIONS } from './NavigationBar';
import { ArrowRight } from 'lucide-react';

export const FeatureGrid: React.FC = () => {
  const navigate = useNavigate();

  // Filter out the "Overview" section as it's redundant for the grid
  const sections = NAV_SECTIONS.filter(section => section.title !== 'Overview');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {sections.map((section, index) => (
        <motion.div
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-300"
        >
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
            {section.title}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {section.items.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 border border-transparent hover:border-blue-200 dark:hover:border-blue-800 transition-all group text-center h-24"
              >
                <item.icon className="w-6 h-6 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 mb-2 transition-colors" />
                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 group-hover:text-blue-700 dark:group-hover:text-blue-300 line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
};
