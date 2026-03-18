import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { NAV_SECTIONS } from './NavigationBar';
import { ArrowRight } from 'lucide-react';
import { SMCard } from '../../components/ui';

const MotionSMCard = motion(SMCard);

export const FeatureGrid: React.FC = () => {
  const navigate = useNavigate();

  // Filter out the "Overview" section as it's redundant for the grid
  const sections = NAV_SECTIONS.filter(section => section.title !== 'Overview');

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-8">
      {sections.map((section, index) => (
        <MotionSMCard
          key={section.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="backdrop-blur-sm rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
            {section.title}
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {section.items.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="flex flex-col items-center justify-center p-3 rounded-lg bg-surface-sunken hover:bg-surface-overlay border border-transparent hover:border-brand-500/20 transition-all group text-center h-24"
              >
                <item.icon className="w-6 h-6 text-text-muted group-hover:text-brand-500 mb-2 transition-colors" />
                <span className="text-xs font-medium text-text-secondary group-hover:text-brand-600 line-clamp-2">
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        </MotionSMCard>
      ))}
    </div>
  );
};
