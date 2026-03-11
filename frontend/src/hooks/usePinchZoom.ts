import { useCallback, useEffect, useRef, useState } from 'react';

interface PinchZoomState {
  scale: number;
  translateX: number;
  translateY: number;
  isPinching: boolean;
}

interface UsePinchZoomOptions {
  minScale?: number;
  maxScale?: number;
  enabled?: boolean;
  onZoomChange?: (scale: number) => void;
}

export function usePinchZoom(
  containerRef: React.RefObject<HTMLElement>,
  options: UsePinchZoomOptions = {}
) {
  const {
    minScale = 1,
    maxScale = 4,
    enabled = true,
    onZoomChange,
  } = options;

  const [state, setState] = useState<PinchZoomState>({
    scale: 1,
    translateX: 0,
    translateY: 0,
    isPinching: false,
  });

  const initialDistanceRef = useRef<number>(0);
  const initialScaleRef = useRef<number>(1);
  const lastTouchRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Calculate distance between two touch points
  const getDistance = useCallback((touch1: Touch, touch2: Touch): number => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Calculate center point between two touches
  const getCenter = useCallback((touch1: Touch, touch2: Touch) => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled) return;

    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      initialDistanceRef.current = getDistance(touch1, touch2);
      initialScaleRef.current = state.scale;
      lastTouchRef.current = getCenter(touch1, touch2);

      setState(prev => ({ ...prev, isPinching: true }));
    }
  }, [enabled, state.scale, getDistance, getCenter]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!enabled || !state.isPinching || e.touches.length !== 2) return;

    e.preventDefault();
    const touch1 = e.touches[0];
    const touch2 = e.touches[1];

    // Calculate new scale
    const currentDistance = getDistance(touch1, touch2);
    const scaleRatio = currentDistance / initialDistanceRef.current;
    let newScale = initialScaleRef.current * scaleRatio;

    // Clamp scale
    newScale = Math.max(minScale, Math.min(maxScale, newScale));

    // Calculate center movement for panning
    const currentCenter = getCenter(touch1, touch2);
    const deltaX = currentCenter.x - lastTouchRef.current.x;
    const deltaY = currentCenter.y - lastTouchRef.current.y;
    lastTouchRef.current = currentCenter;

    setState(prev => ({
      ...prev,
      scale: newScale,
      translateX: prev.translateX + deltaX,
      translateY: prev.translateY + deltaY,
    }));

    onZoomChange?.(newScale);
  }, [enabled, state.isPinching, minScale, maxScale, getDistance, getCenter, onZoomChange]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (e.touches.length < 2) {
      setState(prev => ({ ...prev, isPinching: false }));
    }
  }, []);

  // Double tap to reset zoom
  const lastTapRef = useRef<number>(0);
  const handleDoubleTap = useCallback((e: TouchEvent) => {
    if (!enabled || e.touches.length !== 1) return;

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap detected - toggle between 1x and 2x zoom
      setState(prev => {
        const newScale = prev.scale > 1 ? 1 : 2;
        return {
          scale: newScale,
          translateX: newScale === 1 ? 0 : prev.translateX,
          translateY: newScale === 1 ? 0 : prev.translateY,
          isPinching: false,
        };
      });

      // Haptic feedback
      if ('vibrate' in navigator) {
        navigator.vibrate(10);
      }
    }

    lastTapRef.current = now;
  }, [enabled]);

  // Reset zoom
  const resetZoom = useCallback(() => {
    setState({
      scale: 1,
      translateX: 0,
      translateY: 0,
      isPinching: false,
    });
    onZoomChange?.(1);
  }, [onZoomChange]);

  // Set specific zoom level
  const setZoom = useCallback((scale: number) => {
    const clampedScale = Math.max(minScale, Math.min(maxScale, scale));
    setState(prev => ({
      ...prev,
      scale: clampedScale,
    }));
    onZoomChange?.(clampedScale);
  }, [minScale, maxScale, onZoomChange]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !enabled) return;

    const options = { passive: false };
    container.addEventListener('touchstart', handleTouchStart, options);
    container.addEventListener('touchmove', handleTouchMove, options);
    container.addEventListener('touchend', handleTouchEnd);
    container.addEventListener('touchstart', handleDoubleTap);

    return () => {
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      container.removeEventListener('touchstart', handleDoubleTap);
    };
  }, [enabled, containerRef, handleTouchStart, handleTouchMove, handleTouchEnd, handleDoubleTap]);

  return {
    ...state,
    resetZoom,
    setZoom,
    transform: `scale(${state.scale}) translate(${state.translateX / state.scale}px, ${state.translateY / state.scale}px)`,
  };
}

export default usePinchZoom;
