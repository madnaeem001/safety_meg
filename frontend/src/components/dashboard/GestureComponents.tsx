import React, { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, ArrowDown } from 'lucide-react';
import { usePullToRefresh } from '../../hooks/usePullToRefresh';
import { usePinchZoom } from '../../hooks/usePinchZoom';

// Pull to Refresh Indicator Component
interface PullToRefreshIndicatorProps {
  pullDistance: number;
  progress: number;
  isRefreshing: boolean;
  canRelease: boolean;
}

export const PullToRefreshIndicator: React.FC<PullToRefreshIndicatorProps> = ({
  pullDistance,
  progress,
  isRefreshing,
  canRelease,
}) => {
  if (pullDistance <= 0 && !isRefreshing) return null;

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
      initial={{ y: -60 }}
      animate={{ y: Math.min(pullDistance - 30, 40) }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
    >
      <motion.div
        className="flex items-center justify-center w-14 h-14 rounded-full"
        style={{
          background: canRelease || isRefreshing
            ? 'linear-gradient(145deg, #758866, #5c6d4f)'
            : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          border: canRelease || isRefreshing ? 'none' : '1px solid rgba(218, 220, 224, 0.5)',
        }}
        animate={{
          scale: isRefreshing ? [1, 1.1, 1] : 1,
          rotate: isRefreshing ? 360 : progress * 180,
        }}
        transition={{
          scale: { duration: 1, repeat: isRefreshing ? Infinity : 0 },
          rotate: isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : { duration: 0 },
        }}
      >
        {isRefreshing ? (
          <RefreshCw className="w-6 h-6 text-white" strokeWidth={2} />
        ) : (
          <motion.div
            animate={{ rotate: canRelease ? 180 : 0 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <ArrowDown
              className={`w-6 h-6 ${canRelease ? 'text-white' : 'text-brand-600'}`}
              strokeWidth={2}
            />
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

// Pinch Zoom Chart Wrapper Component
interface PinchZoomChartWrapperProps {
  children: React.ReactNode;
  className?: string;
  showZoomControls?: boolean;
}

export const PinchZoomChartWrapper: React.FC<PinchZoomChartWrapperProps> = ({
  children,
  className = '',
  showZoomControls = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scale, isPinching, resetZoom, setZoom, transform } = usePinchZoom(containerRef, {
    minScale: 1,
    maxScale: 4,
    enabled: true,
  });

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Zoom controls */}
      {showZoomControls && scale > 1 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-2 right-2 z-10 flex items-center gap-2"
        >
          <span className="text-xs font-medium text-text-secondary bg-surface-overlay backdrop-blur-sm px-2 py-1 rounded-lg shadow-sm">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={resetZoom}
            className="p-1.5 rounded-lg bg-surface-overlay backdrop-blur-sm shadow-sm hover:bg-surface-raised transition-colors"
            aria-label="Reset zoom"
          >
            <svg className="w-4 h-4 text-text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            </svg>
          </button>
        </motion.div>
      )}

      {/* Pinch hint on first view */}
      <AnimatePresence>
        {!isPinching && scale === 1 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-2 left-1/2 -translate-x-1/2 z-10 pointer-events-none"
          >
            <span className="text-[10px] text-text-muted bg-surface-overlay backdrop-blur-sm px-2 py-1 rounded-full">
              Pinch to zoom
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Zoomable content */}
      <div
        ref={containerRef}
        className="touch-manipulation"
        style={{
          transform,
          transformOrigin: 'center center',
          transition: isPinching ? 'none' : 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>
    </div>
  );
};

// Pull to Refresh Container Component
interface PullToRefreshContainerProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
}

export const PullToRefreshContainer: React.FC<PullToRefreshContainerProps> = ({
  children,
  onRefresh,
  enabled = true,
}) => {
  const pullState = usePullToRefresh({
    onRefresh,
    threshold: 80,
    maxPull: 150,
    enabled,
  });

  return (
    <>
      <PullToRefreshIndicator
        pullDistance={pullState.pullDistance}
        progress={pullState.progress}
        isRefreshing={pullState.isRefreshing}
        canRelease={pullState.canRelease}
      />
      <motion.div
        style={{
          transform: pullState.pullDistance > 0 ? `translateY(${pullState.pullDistance * 0.5}px)` : 'none',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </>
  );
};

export default PullToRefreshContainer;
