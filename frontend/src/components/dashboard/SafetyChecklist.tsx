import React, { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { ChecklistItem } from './types';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

interface SafetyChecklistProps {
  initialItems: ChecklistItem[];
}

export const SafetyChecklist: React.FC<SafetyChecklistProps> = ({ initialItems }) => {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [completed, setCompleted] = useState(false);

  const toggleItem = (id: string) => {
    setItems(items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    ));
  };

  const progress = Math.round((items.filter(i => i.completed).length / items.length) * 100);

  useEffect(() => {
    if (progress === 100 && !completed) {
      setCompleted(true);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#14b8a6', '#2dd4bf', '#5eead4', '#99f6df']
      });
    } else if (progress < 100) {
      setCompleted(false);
    }
  }, [progress, completed]);

  return (
    <motion.div 
      className="backdrop-blur-2xl rounded-[2.25rem] p-7 relative overflow-hidden"
      style={{
        background: 'rgba(255, 255, 255, 0.98)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.02), 0 10px 32px rgba(115,115,111,0.06), 0 24px 56px rgba(115,115,111,0.04), inset 0 1px 0 rgba(255,255,255,0.95)',
        border: '1px solid rgba(214, 211, 209, 0.5)',
      }}
    >
      {/* Multi-layer decorative gradient orbs - warmer tones */}
      <motion.div 
        animate={{ scale: [1, 1.05, 1], opacity: [0.4, 0.6, 0.4] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 -right-24 w-60 h-60 bg-gradient-radial from-brand-100/50 to-transparent rounded-full blur-3xl" 
      />
      <div className="absolute -bottom-16 -left-16 w-44 h-44 bg-gradient-radial from-accent-50/35 to-transparent rounded-full blur-3xl" />

      <div className="flex items-center justify-between mb-7 relative z-10">
        <div>
          <div className="flex items-center gap-2.5 mb-2">
            <h2 className="text-lg font-bold text-slate-800 tracking-tight font-display">Daily Safety Check</h2>
            {progress === 100 && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 500 }}
              >
                <Sparkles className="w-5 h-5 text-brand-500" />
              </motion.div>
            )}
          </div>
          <p className="text-[12px] text-surface-400 font-medium">Keep the workplace safe</p>
        </div>
        <motion.div 
          className="flex flex-col items-end"
          animate={{ scale: progress === 100 ? [1, 1.12, 1] : 1 }}
          transition={{ duration: 0.4 }}
        >
          <span className={`text-4xl font-bold tracking-tight transition-colors duration-500 font-display ${
            progress === 100 ? 'text-brand-500' : 'text-brand-700'
          }`}>
            {progress}%
          </span>
        </motion.div>
      </div>

      {/* Enhanced progress bar with gradient and glow */}
      <div className="w-full bg-surface-100/90 rounded-full h-3.5 mb-7 overflow-hidden relative z-10" style={{ boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)' }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full rounded-full transition-all duration-500 relative ${
            progress === 100 
              ? 'bg-gradient-to-r from-brand-400 via-brand-500 to-brand-400' 
              : 'bg-gradient-to-r from-brand-300 via-brand-500 to-brand-400'
          }`}
          style={{ boxShadow: progress === 100 ? '0 0 16px rgba(20, 184, 166, 0.4)' : '0 0 8px rgba(20, 184, 166, 0.2)' }}
        >
          {/* Animated shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        </motion.div>
      </div>

      <div className="space-y-1.5 relative z-10">
        <AnimatePresence>
          {items.map((item, index) => (
            <motion.button
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => toggleItem(item.id)}
              whileTap={{ scale: 0.97 }}
              whileHover={{ backgroundColor: 'rgba(74, 138, 106, 0.06)', x: 2 }}
              className="w-full flex items-center gap-3.5 p-3.5 -mx-1 rounded-2xl transition-all duration-300 text-left group"
            >
              <div className="flex-shrink-0">
                <AnimatePresence mode="wait">
                  {item.completed ? (
                    <motion.div
                      key="checked"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      exit={{ scale: 0 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                    >
                      <CheckCircle2 className="w-5.5 h-5.5 text-brand-500" strokeWidth={2.5} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="unchecked"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                    >
                      <Circle className="w-5.5 h-5.5 text-surface-300 group-hover:text-brand-300 transition-colors" strokeWidth={2} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <span className={`text-[14px] font-medium transition-all duration-200 ${
                item.completed 
                  ? 'text-surface-400 line-through decoration-surface-300/50' 
                  : 'text-brand-800 group-hover:text-brand-700'
              }`}>
                {item.text}
              </span>
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};
