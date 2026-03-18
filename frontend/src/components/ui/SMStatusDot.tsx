import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMStatusDot — SafetyMEG status indicator primitive
//
// A small coloured circle with an optional text label, used throughout the
// platform to convey record status (Active, Overdue, Closed, etc.).
//
// Variants : active | inactive | success | warning | danger | neutral
// Sizes    : sm | md | lg
// ─────────────────────────────────────────────────────────────────────────────

export type SMStatusDotVariant =
  | 'active'
  | 'inactive'
  | 'success'
  | 'warning'
  | 'danger'
  | 'neutral';

export type SMStatusDotSize = 'sm' | 'md' | 'lg';

export interface SMStatusDotProps {
  variant?:  SMStatusDotVariant;
  size?:     SMStatusDotSize;
  /** Optional text label rendered after the dot */
  label?:    string;
  /** Animate the dot with a gentle pulse (useful for live/active states) */
  pulse?:    boolean;
  className?: string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const DOT_COLOR: Record<SMStatusDotVariant, string> = {
  active:   'bg-accent',
  inactive: 'bg-secondary-400 dark:bg-secondary-600',
  success:  'bg-success',
  warning:  'bg-warning',
  danger:   'bg-danger',
  neutral:  'bg-secondary-300 dark:bg-secondary-500',
};

const LABEL_COLOR: Record<SMStatusDotVariant, string> = {
  active:   'text-accent-700 dark:text-accent-300',
  inactive: 'text-text-secondary',
  success:  'text-success-700 dark:text-success-300',
  warning:  'text-warning-700 dark:text-warning-300',
  danger:   'text-danger-700  dark:text-danger-300',
  neutral:  'text-text-muted',
};

const DOT_SIZE: Record<SMStatusDotSize, string> = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2   h-2',
  lg: 'w-2.5 h-2.5',
};

const LABEL_SIZE: Record<SMStatusDotSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SMStatusDot: React.FC<SMStatusDotProps> = ({
  variant   = 'neutral',
  size      = 'md',
  label,
  pulse     = false,
  className = '',
}) => {
  const dotClasses = [
    'rounded-full shrink-0',
    DOT_COLOR[variant],
    DOT_SIZE[size],
    pulse ? 'animate-pulse-subtle' : '',
  ]
    .filter(Boolean)
    .join(' ');

  if (!label) {
    return <span className={`${dotClasses} ${className}`} aria-hidden="true" />;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 ${className}`}
      role="status"
    >
      <span className={dotClasses} aria-hidden="true" />
      <span className={`font-medium leading-none ${LABEL_SIZE[size]} ${LABEL_COLOR[variant]}`}>
        {label}
      </span>
    </span>
  );
};

SMStatusDot.displayName = 'SMStatusDot';

export default SMStatusDot;
