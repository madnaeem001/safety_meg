import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMBadge — SafetyMEG foundational badge / chip primitive
//
// Variants : success | warning | danger | neutral | teal
// Sizes    : sm | md
//
// Colours use our static semantic palette with dark: variants for dark mode.
// ─────────────────────────────────────────────────────────────────────────────

export type SMBadgeVariant = 'success' | 'warning' | 'danger' | 'neutral' | 'teal';
export type SMBadgeSize    = 'sm' | 'md';

export interface SMBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: SMBadgeVariant;
  size?:    SMBadgeSize;
  /** Optional icon rendered before the label */
  icon?:    React.ReactNode;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<SMBadgeVariant, string> = {
  success: [
    'bg-success-50    text-success-700',
    'dark:bg-success-950 dark:text-success-300',
    'ring-1 ring-success-200 dark:ring-success-800',
  ].join(' '),

  warning: [
    'bg-warning-50    text-warning-700',
    'dark:bg-warning-950 dark:text-warning-300',
    'ring-1 ring-warning-200 dark:ring-warning-800',
  ].join(' '),

  danger: [
    'bg-danger-50     text-danger-700',
    'dark:bg-danger-950  dark:text-danger-300',
    'ring-1 ring-danger-200 dark:ring-danger-800',
  ].join(' '),

  neutral: [
    'bg-secondary-100 text-secondary-700',
    'dark:bg-secondary-800 dark:text-secondary-300',
    'ring-1 ring-secondary-200 dark:ring-secondary-700',
  ].join(' '),

  teal: [
    'bg-accent-50     text-accent-700',
    'dark:bg-accent-950  dark:text-accent-300',
    'ring-1 ring-accent-200 dark:ring-accent-800',
  ].join(' '),
};

const SIZE_CLASSES: Record<SMBadgeSize, string> = {
  sm: 'px-2   py-0.5 text-xs  gap-1   rounded-md',
  md: 'px-2.5 py-1   text-sm  gap-1.5 rounded-lg',
};

// ── Component ─────────────────────────────────────────────────────────────

export const SMBadge = React.forwardRef<HTMLSpanElement, SMBadgeProps>(
  (
    {
      variant   = 'neutral',
      size      = 'md',
      icon,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const classes = [
      'inline-flex items-center font-medium leading-none',
      VARIANT_CLASSES[variant],
      SIZE_CLASSES[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={classes} {...rest}>
        {icon && <span className="shrink-0">{icon}</span>}
        {children}
      </span>
    );
  },
);

SMBadge.displayName = 'SMBadge';

export default SMBadge;
