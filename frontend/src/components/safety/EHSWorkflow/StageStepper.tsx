import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  AlertTriangle,
  Search,
  CheckSquare,
  ClipboardCheck,
  Users,
  Shield,
  BarChart3,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { WorkflowStage, WorkflowStageInfo, workflowStages } from '../../../data/mockEHSWorkflow';

interface StageStepperProps {
  activeStage: WorkflowStage;
  onStageClick: (stage: WorkflowStage) => void;
  stageCounts: Record<WorkflowStage, number>;
  orientation?: 'horizontal' | 'vertical';
}

const iconMap: Record<string, React.ElementType> = {
  Eye,
  AlertTriangle,
  Search,
  CheckSquare,
  ClipboardCheck,
  Users,
  Shield,
  BarChart3,
  RefreshCw
};

const colorMap: Record<string, { bg: string; border: string; text: string; activeBg: string }> = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-600', activeBg: 'bg-blue-500' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-600', activeBg: 'bg-red-500' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-600', activeBg: 'bg-orange-500' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-600', activeBg: 'bg-purple-500' },
  teal: { bg: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-600', activeBg: 'bg-teal-500' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-600', activeBg: 'bg-green-500' },
  indigo: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-600', activeBg: 'bg-indigo-500' },
  cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', text: 'text-cyan-600', activeBg: 'bg-cyan-500' },
  emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-600', activeBg: 'bg-emerald-500' }
};

export const StageStepper: React.FC<StageStepperProps> = ({
  activeStage,
  onStageClick,
  stageCounts,
  orientation = 'horizontal'
}) => {
  const isHorizontal = orientation === 'horizontal';

  return (
    <div className={`${isHorizontal ? 'w-full overflow-x-auto pb-2' : ''}`}>
      <div
        className={`${
          isHorizontal
            ? 'flex items-start gap-1 min-w-max px-1'
            : 'flex flex-col gap-2'
        }`}
      >
        {workflowStages.map((stage, index) => {
          const IconComponent = iconMap[stage.icon];
          const colors = colorMap[stage.color];
          const isActive = activeStage === stage.id;
          const count = stageCounts[stage.id] || 0;

          return (
            <React.Fragment key={stage.id}>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onStageClick(stage.id)}
                className={`
                  relative flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200
                  ${isActive
                    ? `${colors.activeBg} text-white shadow-lg`
                    : `${colors.bg} ${colors.border} border ${colors.text} hover:shadow-md`
                  }
                  ${isHorizontal ? 'flex-shrink-0' : 'w-full'}
                `}
              >
                <div className={`
                  flex items-center justify-center w-8 h-8 rounded-lg
                  ${isActive ? 'bg-white/20' : `${colors.bg}`}
                `}>
                  {IconComponent && (
                    <IconComponent className={`w-4 h-4 ${isActive ? 'text-white' : colors.text}`} />
                  )}
                </div>
                
                <div className={`${isHorizontal ? 'hidden sm:block' : ''} text-left`}>
                  <div className={`text-xs font-semibold ${isActive ? 'text-white' : colors.text}`}>
                    {stage.shortName}
                  </div>
                  {!isHorizontal && (
                    <div className={`text-[10px] ${isActive ? 'text-white/80' : 'text-surface-500'}`}>
                      {stage.description.substring(0, 30)}...
                    </div>
                  )}
                </div>

                {count > 0 && (
                  <span className={`
                    absolute -top-1 -right-1 flex items-center justify-center
                    min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full
                    ${isActive ? 'bg-white text-gray-800' : `${colors.activeBg} text-white`}
                  `}>
                    {count}
                  </span>
                )}
              </motion.button>

              {/* Connector Arrow */}
              {index < workflowStages.length - 1 && isHorizontal && (
                <div className="flex items-center justify-center flex-shrink-0 px-1">
                  <ChevronRight className="w-4 h-4 text-surface-300" />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default StageStepper;
