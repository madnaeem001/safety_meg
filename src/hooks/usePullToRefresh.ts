import { useCallback, useEffect, useRef, useState } from 'react';

interface PullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  maxPull?: number;
  enabled?: boolean;
}

interface PullState {
  isPulling: boolean;
  isRefreshing: boolean;
  pullDistance: number;
  progress: number;
  canRelease: boolean;
}

export function usePullToRefresh(options: PullToRefreshOptions) {
  const {
    onRefresh,
    threshold = 80,
    maxPull = 150,
    enabled = true,
  } = options;

  const startYRef = useRef<number>(0);
  const scrollTopRef = useRef<number>(0);
  const isPullingRef = useRef<boolean>(false);

  const [pullState, setPullState] = useState<PullState>({
    isPulling: false,
    isRefreshing: false,
    pullDistance: 0,
    progress: 0,
    canRelease: false,
  });

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || pullState.isRefreshing) return;

    const scrollContainer = document.scrollingElement || document.documentElement;
    scrollTopRef.current = scrollContainer.scrollTop;

    // Only enable pull if at top of page
    if (scrollTopRef.current <= 0) {
      startYRef.current = e.touches[0].clientY;
      isPullingRef.current = false;
    }
  }, [enabled, pullState.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || pullState.isRefreshing) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - startYRef.current;
    const scrollContainer = document.scrollingElement || document.documentElement;

    // Only pull down when at top of page and pulling down
    if (scrollContainer.scrollTop <= 0 && deltaY > 0) {
      isPullingRef.current = true;
      e.preventDefault();

      // Apply resistance to pull
      const resistance = 0.4;
      const pullDistance = Math.min(deltaY * resistance, maxPull);
      const progress = Math.min(pullDistance / threshold, 1);
      const canRelease = pullDistance >= threshold;

      setPullState({
        isPulling: true,
        isRefreshing: false,
        pullDistance,
        progress,
        canRelease,
      });
    }
  }, [enabled, pullState.isRefreshing, maxPull, threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (!enabled || !isPullingRef.current) return;

    const { canRelease, pullDistance } = pullState;

    if (canRelease && pullDistance >= threshold) {
      // Trigger refresh
      setPullState(prev => ({
        ...prev,
        isPulling: false,
        isRefreshing: true,
        pullDistance: threshold,
      }));

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate([10, 50, 10]);
      }

      try {
        await onRefresh();
      } finally {
        setPullState({
          isPulling: false,
          isRefreshing: false,
          pullDistance: 0,
          progress: 0,
          canRelease: false,
        });
      }
    } else {
      // Reset without refresh
      setPullState({
        isPulling: false,
        isRefreshing: false,
        pullDistance: 0,
        progress: 0,
        canRelease: false,
      });
    }

    isPullingRef.current = false;
  }, [enabled, pullState, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    const options = { passive: false };
    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchmove', handleTouchMove, options);
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return pullState;
}

export default usePullToRefresh;
