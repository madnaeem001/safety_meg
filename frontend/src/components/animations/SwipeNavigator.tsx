import React, { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { HapticManager } from '../../utils/mobileFeatures';

interface RouteConfig {
  path: string;
  label: string;
}

interface SwipeNavigatorProps {
  children: React.ReactNode;
  routes: RouteConfig[];
  threshold?: number;
  disabled?: boolean;
  showIndicators?: boolean;
  className?: string;
  enableHaptics?: boolean;
}

export const SwipeNavigator: React.FC<SwipeNavigatorProps> = ({
  children,
  routes,
  threshold = 100,
  disabled = false,
  showIndicators = true,
  className = '',
  enableHaptics = true,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [hasTriggeredHaptic, setHasTriggeredHaptic] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Find current route index
  const currentIndex = routes.findIndex(r => r.path === location.pathname);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < routes.length - 1 && currentIndex >= 0;
  const prevRoute = hasPrev ? routes[currentIndex - 1] : null;
  const nextRoute = hasNext ? routes[currentIndex + 1] : null;

  const handleDragEnd = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (disabled) return;

    const velocity = info.velocity.x;
    const offset = info.offset.x;

    // Swipe right (go to previous)
    if ((offset > threshold || velocity > 500) && hasPrev && prevRoute) {
      if (enableHaptics) HapticManager.swipe.navigate();
      navigate(prevRoute.path);
    }
    // Swipe left (go to next)
    else if ((offset < -threshold || velocity < -500) && hasNext && nextRoute) {
      if (enableHaptics) HapticManager.swipe.navigate();
      navigate(nextRoute.path);
    } else if (swipeDirection) {
      // Swipe cancelled
      if (enableHaptics) HapticManager.swipe.cancel();
    }

    setSwipeDirection(null);
    setSwipeProgress(0);
    setHasTriggeredHaptic(false);
  }, [disabled, threshold, hasPrev, hasNext, prevRoute, nextRoute, navigate, enableHaptics, swipeDirection]);

  const handleDrag = useCallback((
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (disabled) return;

    const offset = info.offset.x;
    const progress = Math.min(Math.abs(offset) / threshold, 1);

    // Trigger haptic when threshold is crossed
    if (enableHaptics && progress >= 1 && !hasTriggeredHaptic) {
      HapticManager.swipe.threshold();
      setHasTriggeredHaptic(true);
    } else if (progress < 0.9 && hasTriggeredHaptic) {
      setHasTriggeredHaptic(false);
    }

    if (offset > 20 && hasPrev) {
      setSwipeDirection('right');
      setSwipeProgress(progress);
    } else if (offset < -20 && hasNext) {
      setSwipeDirection('left');
      setSwipeProgress(progress);
    } else {
      setSwipeDirection(null);
      setSwipeProgress(0);
    }
  }, [disabled, threshold, hasPrev, hasNext]);

  // Reset on route change
  useEffect(() => {
    setSwipeDirection(null);
    setSwipeProgress(0);
  }, [location.pathname]);

  // Handle edge swipe hint
  const [showLeftHint, setShowLeftHint] = useState(false);
  const [showRightHint, setShowRightHint] = useState(false);

  return (
    <div ref={containerRef} className={`relative w-full h-full ${className}`}>
      {/* Swipe hint overlays */}
      <AnimatePresence>
        {swipeDirection === 'right' && prevRoute && showIndicators && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: swipeProgress, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute left-0 top-0 bottom-0 w-16 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-brand-500/90 dark:bg-brand-600/90 text-white rounded-r-xl py-4 px-2 shadow-lg backdrop-blur-sm">
              <ChevronLeft className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium writing-mode-vertical">{prevRoute.label}</span>
            </div>
          </motion.div>
        )}

        {swipeDirection === 'left' && nextRoute && showIndicators && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: swipeProgress, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute right-0 top-0 bottom-0 w-16 z-40 flex items-center justify-center pointer-events-none"
          >
            <div className="bg-brand-500/90 dark:bg-brand-600/90 text-white rounded-l-xl py-4 px-2 shadow-lg backdrop-blur-sm">
              <ChevronRight className="w-5 h-5 mb-1" />
              <span className="text-[10px] font-medium writing-mode-vertical">{nextRoute.label}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Route indicators */}
      {showIndicators && routes.length > 1 && currentIndex >= 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5 bg-white/80 dark:bg-surface-800/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm">
          {routes.map((route, idx) => (
            <button
              key={route.path}
              onClick={() => navigate(route.path)}
              className={`
                w-2 h-2 rounded-full transition-all duration-200
                ${idx === currentIndex 
                  ? 'bg-brand-500 w-4' 
                  : 'bg-surface-300 dark:bg-surface-600 hover:bg-surface-400'
                }
              `}
              aria-label={`Go to ${route.label}`}
            />
          ))}
        </div>
      )}

      {/* Swipeable content */}
      <motion.div
        drag={!disabled && (hasPrev || hasNext) ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className="w-full h-full touch-pan-y"
      >
        {children}
      </motion.div>
    </div>
  );
};

// Hook for programmatic swipe navigation
export const useSwipeNavigation = (routes: RouteConfig[]) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const currentIndex = routes.findIndex(r => r.path === location.pathname);
  
  const goNext = useCallback(() => {
    if (currentIndex < routes.length - 1) {
      navigate(routes[currentIndex + 1].path);
    }
  }, [currentIndex, routes, navigate]);
  
  const goPrev = useCallback(() => {
    if (currentIndex > 0) {
      navigate(routes[currentIndex - 1].path);
    }
  }, [currentIndex, routes, navigate]);
  
  return {
    currentIndex,
    hasPrev: currentIndex > 0,
    hasNext: currentIndex < routes.length - 1,
    goNext,
    goPrev,
    currentRoute: routes[currentIndex],
    prevRoute: routes[currentIndex - 1],
    nextRoute: routes[currentIndex + 1],
  };
};

export default SwipeNavigator;
