import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useToastStore } from '../../store/useToastStore';
import type { ToastVariant } from '../../store/useToastStore';

// ─────────────────────────────────────────────────────────────────────────────
// SMToastProvider — Renders the live toast stack pulled from useToastStore.
//
// Mount once at the app root (inside <App /> but outside any scroll container):
//   <SMToastProvider />
//
// Toasts slide in from the right, stack at bottom-right, and spring-exit.
// Design tokens: bg-surface-raised, shadow-modal, semantic border/icon colours.
// ─────────────────────────────────────────────────────────────────────────────

// ── Inline SVG icons (consistent with SMAlert) ───────────────────────────────

const SuccessIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const InfoIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const DismissIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ── Variant style maps ────────────────────────────────────────────────────────

const VARIANT_BORDER: Record<ToastVariant, string> = {
  success: 'border-success-200 dark:border-success-800',
  error:   'border-danger-200  dark:border-danger-800',
  warning: 'border-warning-200 dark:border-warning-800',
  info:    'border-accent-200  dark:border-accent-800',
};

const VARIANT_ICON_COLOR: Record<ToastVariant, string> = {
  success: 'text-success-600 dark:text-success-400',
  error:   'text-danger-600  dark:text-danger-400',
  warning: 'text-warning-600 dark:text-warning-400',
  info:    'text-accent-600  dark:text-accent-400',
};

const VARIANT_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <SuccessIcon />,
  error:   <ErrorIcon />,
  warning: <WarningIcon />,
  info:    <InfoIcon />,
};

// ── Framer-motion variants ────────────────────────────────────────────────────

const toastMotion = {
  initial: { opacity: 0, x: 56, scale: 0.96 },
  animate: { opacity: 1, x: 0,  scale: 1    },
  exit:    { opacity: 0, x: 48, scale: 0.94  },
  transition: { type: 'spring' as const, stiffness: 420, damping: 32 },
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SMToastProvider: React.FC = () => {
  const toasts      = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
    >
      <AnimatePresence initial={false}>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            initial={toastMotion.initial}
            animate={toastMotion.animate}
            exit={toastMotion.exit}
            transition={toastMotion.transition}
            role="status"
            aria-label={toast.message}
            className={[
              // Layout
              'flex items-start gap-3 pointer-events-auto',
              'w-80 max-w-[calc(100vw-3rem)]',
              // Surface
              'px-4 py-3.5 rounded-xl',
              'bg-surface-raised border',
              'shadow-modal',
              // Variant border colour
              VARIANT_BORDER[toast.variant],
            ].join(' ')}
          >
            {/* Variant icon */}
            <span className={['shrink-0 mt-0.5', VARIANT_ICON_COLOR[toast.variant]].join(' ')}>
              {VARIANT_ICONS[toast.variant]}
            </span>

            {/* Message */}
            <p className="flex-1 text-sm text-text-primary leading-snug">
              {toast.message}
            </p>

            {/* Dismiss button */}
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              aria-label="Dismiss notification"
              className={[
                'shrink-0 mt-0.5 p-1 rounded-md',
                'text-text-muted hover:text-text-secondary',
                'hover:bg-surface-overlay',
                'transition-colors duration-fast',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
              ].join(' ')}
            >
              <DismissIcon />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
