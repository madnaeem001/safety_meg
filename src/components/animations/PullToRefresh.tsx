import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { HapticManager } from '../../utils/mobileFeatures';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  className?: string;
  disabled?: boolean;
  enableHaptics?: boolean;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  children,
  onRefresh,
  threshold = 80,
  className = '',
  disabled = false,
  enableHaptics = true,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const startY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled || isRefreshing) return;
    
    // Only start pull if at top of scroll container
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
      setHasTriggeredHaptic(false);
    }
  }, [disabled, isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || disabled || isRefreshing) return;
    
    const container = containerRef.current;
    if (!container || container.scrollTop > 0) {
      setPullDistance(0);
      return;
    }

    const currentY = e.touches[0].clientY;
    const distance = Math.max(0, currentY - startY.current);
    
    // Apply resistance for natural feel
    const resistance = 0.5;
    const resistedDistance = distance * resistance;
    
    // Trigger haptic when threshold is crossed
    if (enableHaptics && resistedDistance >= threshold && !hasTriggeredHaptic) {
      HapticManager.pullToRefresh.threshold();
      setHasTriggeredHaptic(true);
    } else if (resistedDistance < threshold && hasTriggeredHaptic) {
      setHasTriggeredHaptic(false);
    }
    
    setPullDistance(Math.min(resistedDistance, threshold * 1.5));
    
    // Prevent default scroll if pulling down
    if (distance > 10) {
      e.preventDefault();
    }
  }, [isPulling, disabled, isRefreshing, threshold, enableHaptics, hasTriggeredHaptic]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || disabled || isRefreshing) return;
    
    setIsPulling(false);
    setHasTriggeredHaptic(false);
    
    if (pullDistance >= threshold) {
      setIsRefreshing(true);
      setPullDistance(threshold * 0.6); // Keep indicator visible during refresh
      
      // Haptic feedback for refresh start
      if (enableHaptics) {
        HapticManager.pullToRefresh.start();
      }
      
      try {
        await onRefresh();
        // Haptic feedback for refresh complete
        if (enableHaptics) {
          HapticManager.pullToRefresh.complete();
        }
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
  }, [isPulling, disabled, isRefreshing, pullDistance, threshold, onRefresh]);

  const progress = Math.min(pullDistance / threshold, 1);
  const shouldTrigger = pullDistance >= threshold;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-y-auto overscroll-none ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(pullDistance > 0 || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute left-0 right-0 flex justify-center z-50 pointer-events-none"
            style={{ top: Math.max(0, pullDistance - 50) }}
          >
            <motion.div
              className={`
                flex items-center justify-center w-10 h-10 rounded-full shadow-lg
                ${shouldTrigger || isRefreshing 
                  ? 'bg-brand-500 text-white' 
                  : 'bg-white dark:bg-surface-800 text-surface-600 dark:text-surface-300'
                }
              `}
              animate={{
                scale: isRefreshing ? 1 : 0.8 + progress * 0.2,
                rotate: isRefreshing ? 360 : progress * 180,
              }}
              transition={{
                rotate: isRefreshing 
                  ? { duration: 1, repeat: Infinity, ease: 'linear' }
                  : { duration: 0.1 }
              }}
            >
              {isRefreshing ? (
                <RefreshCw className="w-5 h-5" />
              ) : (
                <ArrowDown 
                  className="w-5 h-5 transition-transform"
                  style={{ transform: `rotate(${shouldTrigger ? 180 : 0}deg)` }}
                />
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with pull transform */}
      <motion.div
        animate={{
          y: isRefreshing ? threshold * 0.6 : pullDistance,
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PullToRefresh;
