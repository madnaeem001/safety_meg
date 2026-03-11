import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface PageTransitionProps {
  children: ReactNode;
}

// Page transition variants with smooth fade and subtle slide
const pageVariants = {
  initial: {
    opacity: 0,
    y: 12,
    scale: 0.99,
  },
  in: {
    opacity: 1,
    y: 0,
    scale: 1,
  },
  out: {
    opacity: 0,
    y: -8,
    scale: 0.99,
  },
};

const pageTransition = {
  type: 'tween',
  ease: [0.16, 1, 0.3, 1],
  duration: 0.4,
};

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="in"
        exit="out"
        variants={pageVariants}
        transition={pageTransition}
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

// Faster transition for modals and overlays
export const OverlayTransition: React.FC<PageTransitionProps & { isVisible: boolean }> = ({ 
  children, 
  isVisible 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// Slide transition from different directions
type SlideDirection = 'left' | 'right' | 'up' | 'down';

export const SlideTransition: React.FC<PageTransitionProps & { direction?: SlideDirection }> = ({ 
  children, 
  direction = 'right' 
}) => {
  const location = useLocation();
  
  const getInitialPosition = () => {
    switch (direction) {
      case 'left': return { x: -30, y: 0 };
      case 'right': return { x: 30, y: 0 };
      case 'up': return { x: 0, y: -30 };
      case 'down': return { x: 0, y: 30 };
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, ...getInitialPosition() }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, ...getInitialPosition() }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full min-h-screen"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
};

export default PageTransition;
