import React, { useRef, useEffect, ReactNode } from 'react';

interface FadeContentProps {
  children: ReactNode;
  blur?: boolean;
  duration?: number;
  delay?: number;
  threshold?: number;
  initialOpacity?: number;
  className?: string;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  scale?: number;
}

const FadeContent: React.FC<FadeContentProps> = ({
  children,
  blur = true,
  duration = 800,
  delay = 0,
  threshold = 0.1,
  initialOpacity = 0,
  className = '',
  direction = 'up',
  scale = 1,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const makeVisible = () => {
      el.style.opacity = '1';
      el.style.filter = 'blur(0px)';
      el.style.transform = 'translateY(0) translateX(0) scale(1)';
    };

    // Set initial styles
    el.style.opacity = String(initialOpacity);
    el.style.filter = blur ? 'blur(8px)' : 'blur(0px)';
    el.style.transition = `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, filter ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`;
    
    const getInitialTransform = () => {
      const scaleStr = scale !== 1 ? `scale(${scale})` : '';
      switch (direction) {
        case 'up': return `translateY(30px) ${scaleStr}`.trim();
        case 'down': return `translateY(-30px) ${scaleStr}`.trim();
        case 'left': return `translateX(30px) ${scaleStr}`.trim();
        case 'right': return `translateX(-30px) ${scaleStr}`.trim();
        default: return scaleStr || 'none';
      }
    };
    
    el.style.transform = getInitialTransform();

    // Fallback timer - ensure visibility after delay + duration + buffer
    const fallbackTimer = setTimeout(() => {
      makeVisible();
    }, delay + duration + 500);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          makeVisible();
          clearTimeout(fallbackTimer);
          observer.unobserve(el);
        }
      },
      { threshold, rootMargin: '50px 0px 50px 0px' }
    );

    observer.observe(el);

    return () => {
      observer.disconnect();
      clearTimeout(fallbackTimer);
    };
  }, [blur, duration, delay, threshold, initialOpacity, direction, scale]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
};

export default FadeContent;
