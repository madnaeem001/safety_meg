import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// Routes that support swipe navigation
export const SWIPE_ROUTES = [
  { path: '/', label: 'Dashboard' },
  { path: '/safety-hub', label: 'Safety Hub' },
  { path: '/analytics', label: 'Analytics' },
  { path: '/training', label: 'Training' },
  { path: '/regulations', label: 'Regulations' },
];

interface SwipeState {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  isSwiping: boolean;
  direction: 'left' | 'right' | 'up' | 'down' | null;
  progress: number;
}

interface UseSwipeNavigationOptions {
  threshold?: number;
  velocityThreshold?: number;
  enabled?: boolean;
  onSwipeStart?: () => void;
  onSwipeEnd?: (navigated: boolean) => void;
}

export function useSwipeNavigation(options: UseSwipeNavigationOptions = {}) {
  const {
    threshold = 80,
    velocityThreshold = 0.3,
    enabled = true,
    onSwipeStart,
    onSwipeEnd,
  } = options;

  const navigate = useNavigate();
  const location = useLocation();
  const startTimeRef = useRef<number>(0);
  
  const [swipeState, setSwipeState] = useState<SwipeState>({
    startX: 0,
    startY: 0,
    currentX: 0,
    currentY: 0,
    isSwiping: false,
    direction: null,
    progress: 0,
  });

  // Get current page index
  const getCurrentIndex = useCallback(() => {
    return SWIPE_ROUTES.findIndex(route => route.path === location.pathname);
  }, [location.pathname]);

  // Check if current page supports swipe navigation
  const isSwipePage = useCallback(() => {
    return SWIPE_ROUTES.some(route => route.path === location.pathname);
  }, [location.pathname]);

  // Navigate to adjacent page
  const navigateToIndex = useCallback((index: number) => {
    if (index >= 0 && index < SWIPE_ROUTES.length) {
      const route = SWIPE_ROUTES[index];
      navigate(route.path);
      return true;
    }
    return false;
  }, [navigate]);

  // Calculate swipe direction and progress
  const calculateSwipe = useCallback((currentX: number, currentY: number, startX: number, startY: number) => {
    const deltaX = currentX - startX;
    const deltaY = currentY - startY;
    const absDeltaX = Math.abs(deltaX);
    const absDeltaY = Math.abs(deltaY);

    // Determine if horizontal swipe is dominant
    if (absDeltaX > absDeltaY && absDeltaX > 10) {
      const direction = deltaX > 0 ? 'right' : 'left';
      const progress = Math.min(absDeltaX / threshold, 1);
      return { direction, progress, isHorizontal: true };
    }
    
    if (absDeltaY > absDeltaX && absDeltaY > 10) {
      const direction = deltaY > 0 ? 'down' : 'up';
      return { direction, progress: 0, isHorizontal: false };
    }

    return { direction: null, progress: 0, isHorizontal: false };
  }, [threshold]);

  // Touch handlers
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || !isSwipePage()) return;

    const touch = e.touches[0];
    
    // Check if touch started near edge (edge swipe detection)
    const isEdgeSwipe = touch.clientX < 30 || touch.clientX > window.innerWidth - 30;
    
    startTimeRef.current = Date.now();
    setSwipeState({
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
      isSwiping: true,
      direction: null,
      progress: 0,
    });

    onSwipeStart?.();
  }, [enabled, isSwipePage, onSwipeStart]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !swipeState.isSwiping) return;

    const touch = e.touches[0];
    const { direction, progress, isHorizontal } = calculateSwipe(
      touch.clientX,
      touch.clientY,
      swipeState.startX,
      swipeState.startY
    );

    // If horizontal swipe detected, prevent vertical scroll
    if (isHorizontal && progress > 0.1) {
      e.preventDefault();
    }

    setSwipeState(prev => ({
      ...prev,
      currentX: touch.clientX,
      currentY: touch.clientY,
      direction: direction as SwipeState['direction'],
      progress,
    }));
  }, [enabled, swipeState.isSwiping, swipeState.startX, swipeState.startY, calculateSwipe]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!enabled || !swipeState.isSwiping) return;

    const deltaX = swipeState.currentX - swipeState.startX;
    const deltaTime = Date.now() - startTimeRef.current;
    const velocity = Math.abs(deltaX) / deltaTime;
    const currentIndex = getCurrentIndex();

    let navigated = false;

    // Check if swipe exceeded threshold or velocity
    if (Math.abs(deltaX) > threshold || velocity > velocityThreshold) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous page
        navigated = navigateToIndex(currentIndex - 1);
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      } else if (deltaX < 0 && currentIndex < SWIPE_ROUTES.length - 1) {
        // Swipe left - go to next page
        navigated = navigateToIndex(currentIndex + 1);
        // Haptic feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(10);
        }
      }
    }

    setSwipeState({
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
      isSwiping: false,
      direction: null,
      progress: 0,
    });

    onSwipeEnd?.(navigated);
  }, [
    enabled,
    swipeState,
    threshold,
    velocityThreshold,
    getCurrentIndex,
    navigateToIndex,
    onSwipeEnd,
  ]);

  // Add touch listeners
  useEffect(() => {
    if (!enabled) return;

    const container = document.body;
    
    container.addEventListener('touchstart', handleTouchStart, { passive: true });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  // Get navigation info for UI feedback
  const getNavigationInfo = useCallback(() => {
    const currentIndex = getCurrentIndex();
    const canSwipeLeft = currentIndex < SWIPE_ROUTES.length - 1;
    const canSwipeRight = currentIndex > 0;
    const prevPage = currentIndex > 0 ? SWIPE_ROUTES[currentIndex - 1] : null;
    const nextPage = currentIndex < SWIPE_ROUTES.length - 1 ? SWIPE_ROUTES[currentIndex + 1] : null;

    return {
      currentIndex,
      canSwipeLeft,
      canSwipeRight,
      prevPage,
      nextPage,
      isSwipePage: isSwipePage(),
    };
  }, [getCurrentIndex, isSwipePage]);

  return {
    swipeState,
    getNavigationInfo,
    navigateToIndex,
    SWIPE_ROUTES,
  };
}

export default useSwipeNavigation;
