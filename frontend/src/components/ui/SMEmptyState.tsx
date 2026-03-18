import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMEmptyState — SafetyMEG empty-list / zero-data state component
//
// Centered column layout with four composable slots:
//   icon       — large muted icon (pass an SVG or react-icons element)
//   heading    — bold primary text
//   subMessage — secondary supporting description
//   action     — optional call-to-action (typically an SMButton)
//
// Designed to fill the content area of an SMCard, table, or full page section.
// ─────────────────────────────────────────────────────────────────────────────

export interface SMEmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Large muted icon rendered at the top of the empty state */
  icon?:       React.ReactNode;
  /** Bold heading — concisely names the empty state (required) */
  heading:     string;
  /** Secondary description providing context or guidance */
  subMessage?: string;
  /** Optional action — renders below the text (pass an <SMButton> or similar) */
  action?:     React.ReactNode;
}

export const SMEmptyState = React.forwardRef<HTMLDivElement, SMEmptyStateProps>(
  (
    {
      icon,
      heading,
      subMessage,
      action,
      className = '',
      ...rest
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={[
        'flex flex-col items-center justify-center gap-4',
        'py-16 px-6 text-center',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {/* Icon slot — muted colour so the icon recedes visually */}
      {icon && (
        <span
          className="inline-flex items-center justify-center h-16 w-16 text-text-muted"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}

      {/* Text stack */}
      <div className="flex flex-col gap-2 max-w-sm">
        <h3 className="text-lg font-semibold text-text-primary">{heading}</h3>
        {subMessage && (
          <p className="text-sm text-text-secondary leading-relaxed">{subMessage}</p>
        )}
      </div>

      {/* Action slot */}
      {action && <div className="mt-2">{action}</div>}
    </div>
  ),
);

SMEmptyState.displayName = 'SMEmptyState';

export default SMEmptyState;
