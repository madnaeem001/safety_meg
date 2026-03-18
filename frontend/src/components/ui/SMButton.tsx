import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMButton — SafetyMEG foundational button primitive
//
// Variants : primary | secondary | danger | ghost | icon
// Sizes    : sm | md | lg
// States   : loading (spinner), disabled (muted + no pointer-events)
//
// All colours resolve through our design token CSS vars — zero hardcoded
// Tailwind palette classes.
// ─────────────────────────────────────────────────────────────────────────────

export type SMButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon';
export type SMButtonSize    = 'sm' | 'md' | 'lg';

export interface SMButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  SMButtonVariant;
  size?:     SMButtonSize;
  /** Shows a spinner and disables interaction */
  loading?:  boolean;
  /** Left-side icon (or sole icon when variant='icon') */
  leftIcon?: React.ReactNode;
  /** Right-side icon */
  rightIcon?: React.ReactNode;
}

// ── Style maps ───────────────────────────────────────────────────────────────

const VARIANT_CLASSES: Record<SMButtonVariant, string> = {
  primary: [
    'bg-accent text-text-onAccent',
    'hover:bg-accent-600 active:bg-accent-700',
    'focus-visible:ring-accent',
    'border border-transparent',
  ].join(' '),

  secondary: [
    'bg-surface-raised text-text-primary',
    'hover:bg-surface-overlay active:bg-surface-sunken',
    'focus-visible:ring-accent',
    'border border-surface-border',
  ].join(' '),

  danger: [
    'bg-danger text-text-inverted',
    'hover:bg-danger-700 active:bg-danger-800',
    'focus-visible:ring-danger',
    'border border-transparent',
  ].join(' '),

  ghost: [
    'bg-transparent text-text-secondary',
    'hover:bg-surface-overlay hover:text-text-primary active:bg-surface-sunken',
    'focus-visible:ring-accent',
    'border border-transparent',
  ].join(' '),

  icon: [
    'bg-transparent text-text-secondary',
    'hover:bg-surface-overlay hover:text-text-primary active:bg-surface-sunken',
    'focus-visible:ring-accent',
    'border border-transparent',
  ].join(' '),
};

const SIZE_CLASSES: Record<SMButtonSize, string> = {
  sm: 'h-8  px-3 text-sm  gap-1.5 rounded-md',
  md: 'h-10 px-4 text-base gap-2   rounded-lg',
  lg: 'h-12 px-6 text-lg  gap-2.5 rounded-xl',
};

// Icon variants are square — override horizontal padding
const ICON_SIZE_CLASSES: Record<SMButtonSize, string> = {
  sm: 'h-8  w-8  rounded-md',
  md: 'h-10 w-10 rounded-lg',
  lg: 'h-12 w-12 rounded-xl',
};

// ── Spinner ──────────────────────────────────────────────────────────────────

const Spinner: React.FC<{ size: SMButtonSize }> = ({ size }) => {
  const dim = size === 'sm' ? 14 : size === 'lg' ? 20 : 16;
  return (
    <svg
      width={dim}
      height={dim}
      viewBox="0 0 24 24"
      fill="none"
      className="animate-spin shrink-0"
      aria-hidden="true"
    >
      <circle
        cx="12" cy="12" r="10"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ── Component ────────────────────────────────────────────────────────────────

export const SMButton = React.forwardRef<HTMLButtonElement, SMButtonProps>(
  (
    {
      variant   = 'primary',
      size      = 'md',
      loading   = false,
      leftIcon,
      rightIcon,
      disabled,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isIconOnly = variant === 'icon';
    const isDisabled = disabled || loading;

    const sizeClass = isIconOnly
      ? ICON_SIZE_CLASSES[size]
      : SIZE_CLASSES[size];

    const classes = [
      // Base reset + layout
      'inline-flex items-center justify-center',
      'font-medium leading-none select-none',
      'transition-colors duration-fast ease-smooth',
      // Focus ring
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'focus-visible:ring-offset-surface-raised',
      // Variant colours
      VARIANT_CLASSES[variant],
      // Size
      sizeClass,
      // Disabled / loading
      isDisabled ? 'opacity-50 pointer-events-none cursor-not-allowed' : 'cursor-pointer',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <button ref={ref} disabled={isDisabled} className={classes} {...rest}>
        {loading ? (
          <Spinner size={size} />
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}

        {!isIconOnly && children && (
          <span>{children}</span>
        )}

        {isIconOnly && !loading && !leftIcon && children}

        {!loading && rightIcon && (
          <span className="shrink-0">{rightIcon}</span>
        )}
      </button>
    );
  },
);

SMButton.displayName = 'SMButton';

export default SMButton;
