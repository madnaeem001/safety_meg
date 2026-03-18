import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMAlert — SafetyMEG foundational alert / notification banner primitive
//
// Variants : info | success | warning | danger
// Features : optional dismiss (X) button, optional icon, optional title
//
// Colours are built from static palette tokens with dark: variants so the
// component works in both light and dark mode without any extra logic.
// ─────────────────────────────────────────────────────────────────────────────

export type SMAlertVariant = 'info' | 'success' | 'warning' | 'danger';

export interface SMAlertProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:    SMAlertVariant;
  /** Bold heading text above the description */
  title?:      string;
  /** Called when the dismiss button is clicked. If absent, no button renders. */
  onDismiss?:  () => void;
  /** Override the default variant icon with a custom element */
  icon?:       React.ReactNode;
  /** Hide the leading icon entirely */
  noIcon?:     boolean;
}

// ── Style maps ─────────────────────────────────────────────────────────────

const VARIANT_WRAPPER: Record<SMAlertVariant, string> = {
  info: [
    'bg-accent-50 border-accent-200 text-accent-800',
    'dark:bg-accent-950/40 dark:border-accent-800 dark:text-accent-200',
  ].join(' '),
  success: [
    'bg-success-50 border-success-200 text-success-800',
    'dark:bg-success-950/40 dark:border-success-800 dark:text-success-200',
  ].join(' '),
  warning: [
    'bg-warning-50 border-warning-200 text-warning-800',
    'dark:bg-warning-950/40 dark:border-warning-800 dark:text-warning-200',
  ].join(' '),
  danger: [
    'bg-danger-50 border-danger-200 text-danger-800',
    'dark:bg-danger-950/40 dark:border-danger-800 dark:text-danger-200',
  ].join(' '),
};

const DISMISS_HOVER: Record<SMAlertVariant, string> = {
  info:    'hover:bg-accent-100   dark:hover:bg-accent-900/50',
  success: 'hover:bg-success-100  dark:hover:bg-success-900/50',
  warning: 'hover:bg-warning-100  dark:hover:bg-warning-900/50',
  danger:  'hover:bg-danger-100   dark:hover:bg-danger-900/50',
};

// ── Default icons ──────────────────────────────────────────────────────────

const InfoIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 16v-4M12 8h.01" />
  </svg>
);

const SuccessIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m9 12 2 2 4-4" />
  </svg>
);

const WarningIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
    <path d="M12 9v4M12 17h.01" />
  </svg>
);

const DangerIcon: React.FC = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" />
    <path d="m15 9-6 6M9 9l6 6" />
  </svg>
);

const DEFAULT_ICONS: Record<SMAlertVariant, React.ReactNode> = {
  info:    <InfoIcon />,
  success: <SuccessIcon />,
  warning: <WarningIcon />,
  danger:  <DangerIcon />,
};

const CloseIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

// ── Component ─────────────────────────────────────────────────────────────

export const SMAlert = React.forwardRef<HTMLDivElement, SMAlertProps>(
  (
    {
      variant   = 'info',
      title,
      onDismiss,
      icon,
      noIcon    = false,
      className = '',
      children,
      ...rest
    },
    ref,
  ) => {
    const resolvedIcon = icon ?? DEFAULT_ICONS[variant];

    return (
      <div
        ref={ref}
        role="alert"
        className={[
          'flex gap-3 items-start',
          'px-4 py-3 rounded-lg border',
          VARIANT_WRAPPER[variant],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {/* Leading icon */}
        {!noIcon && (
          <span className="shrink-0 mt-0.5">{resolvedIcon}</span>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {title && (
            <p className="text-sm font-semibold leading-snug mb-0.5">{title}</p>
          )}
          {children && (
            <div className="text-sm leading-relaxed opacity-90">{children}</div>
          )}
        </div>

        {/* Dismiss button */}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className={[
              'shrink-0 -mr-1 -mt-0.5',
              'inline-flex items-center justify-center h-7 w-7 rounded-md',
              'transition-colors duration-fast ease-smooth',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-current',
              DISMISS_HOVER[variant],
            ].join(' ')}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    );
  },
);

SMAlert.displayName = 'SMAlert';

export default SMAlert;
