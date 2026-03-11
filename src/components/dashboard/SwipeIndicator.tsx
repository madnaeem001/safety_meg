import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useSwipeNavigation, SWIPE_ROUTES } from '../../hooks/useSwipeNavigation';

interface SwipeIndicatorProps {
  show?: boolean;
}

export const SwipeIndicator: React.FC<SwipeIndicatorProps> = ({ show = true }) => {
  const { swipeState, getNavigationInfo } = useSwipeNavigation({ enabled: false });
  const { canSwipeLeft, canSwipeRight, prevPage, nextPage, isSwipePage } = getNavigationInfo();

  if (!show || !isSwipePage) return null;

  const showLeftIndicator = swipeState.isSwiping && swipeState.direction === 'right' && canSwipeRight;
  const showRightIndicator = swipeState.isSwiping && swipeState.direction === 'left' && canSwipeLeft;

  return (
    <>
      {/* Left edge indicator (previous page) */}
      <AnimatePresence>
        {showLeftIndicator && prevPage && (
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ 
              opacity: Math.min(swipeState.progress * 1.5, 1), 
              x: swipeState.progress * 30 - 20 
            }}
            exit={{ opacity: 0, x: -40 }}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div 
              className="flex items-center gap-2 px-4 py-3 rounded-r-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                boxShadow: '4px 0 20px rgba(0,0,0,0.1)',
              }}
            >
              <motion.div
                animate={{ x: [0, -4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <ChevronLeft className="w-5 h-5 text-brand-600" />
              </motion.div>
              <span className="text-sm font-medium text-slate-700">{prevPage.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Right edge indicator (next page) */}
      <AnimatePresence>
        {showRightIndicator && nextPage && (
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ 
              opacity: Math.min(swipeState.progress * 1.5, 1), 
              x: -swipeState.progress * 30 + 20 
            }}
            exit={{ opacity: 0, x: 40 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div 
              className="flex items-center gap-2 px-4 py-3 rounded-l-2xl"
              style={{
                background: 'rgba(255, 255, 255, 0.95)',
                backdropFilter: 'blur(12px)',
                boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
              }}
            >
              <span className="text-sm font-medium text-slate-700">{nextPage.label}</span>
              <motion.div
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
              >
                <ChevronRight className="w-5 h-5 text-brand-600" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Swipe progress bar at bottom
export const SwipeProgressBar: React.FC = () => {
  const { getNavigationInfo } = useSwipeNavigation({ enabled: false });
  const { currentIndex, isSwipePage } = getNavigationInfo();

  if (!isSwipePage) return null;

  return (
    <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-lg shadow-soft border border-surface-200/50">
      {SWIPE_ROUTES.map((route, index) => (
        <motion.div
          key={route.path}
          className="relative"
          initial={false}
          animate={{
            scale: currentIndex === index ? 1 : 0.8,
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <div
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              currentIndex === index
                ? 'bg-brand-500 w-6'
                : 'bg-surface-300'
            }`}
          />
        </motion.div>
      ))}
    </div>
  );
};

// Page labels for swipe navigation
export const PageLabel: React.FC = () => {
  const { getNavigationInfo } = useSwipeNavigation({ enabled: false });
  const { currentIndex, prevPage, nextPage, isSwipePage } = getNavigationInfo();

  if (!isSwipePage) return null;

  const currentPage = SWIPE_ROUTES[currentIndex];

  return (
    <motion.div 
      className="fixed top-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
    >
      {prevPage && (
        <span className="text-xs text-surface-400 flex items-center gap-1">
          <ChevronLeft className="w-3 h-3" />
          {prevPage.label}
        </span>
      )}
      <span className="text-sm font-semibold text-slate-700 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm shadow-sm">
        {currentPage?.label}
      </span>
      {nextPage && (
        <span className="text-xs text-surface-400 flex items-center gap-1">
          {nextPage.label}
          <ChevronRight className="w-3 h-3" />
        </span>
      )}
    </motion.div>
  );
};

export default SwipeIndicator;
