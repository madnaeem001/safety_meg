import { useMemo } from 'react';
import { useToastStore } from '../store/useToastStore';
import type { ToastVariant } from '../store/useToastStore';

// ─────────────────────────────────────────────────────────────────────────────
// useToast — Convenience hook for firing toasts from any component.
//
// Usage:
//   const toast = useToast();
//   toast.success('Record saved successfully');
//   toast.error('Failed to delete — please try again');
//   toast.warning('Session expires in 5 minutes', 6000);
//   toast.info('New update available');
//   toast.toast('Custom message', 'success');
// ─────────────────────────────────────────────────────────────────────────────

export interface UseToastReturn {
  /** Fire a success toast */
  success: (message: string, duration?: number) => void;
  /** Fire an error toast */
  error:   (message: string, duration?: number) => void;
  /** Fire a warning toast */
  warning: (message: string, duration?: number) => void;
  /** Fire an info toast */
  info:    (message: string, duration?: number) => void;
  /** Fire a toast with an explicit variant */
  toast:   (message: string, variant?: ToastVariant, duration?: number) => void;
}

export function useToast(): UseToastReturn {
  const addToast = useToastStore((s) => s.addToast);

  return useMemo(() => ({
    success: (message, duration) => addToast({ message, variant: 'success', duration }),
    error:   (message, duration) => addToast({ message, variant: 'error',   duration }),
    warning: (message, duration) => addToast({ message, variant: 'warning', duration }),
    info:    (message, duration) => addToast({ message, variant: 'info',    duration }),
    toast:   (message, variant = 'info', duration) => addToast({ message, variant, duration }),
  }), [addToast]);
}
