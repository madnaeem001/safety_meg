import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMPageHeader — SafetyMEG standardised page-level heading component
//
// Props:
//   title       — main H1 heading (required)
//   subtitle    — secondary description line
//   breadcrumb  — optional breadcrumb element rendered above the title
//   action      — optional React node (e.g. <SMButton>) pinned to the right
//   className   — optional wrapper override
//
// Tokens used:
//   text-text-primary    → title
//   text-text-secondary  → subtitle
//   border-surface-border → bottom divider
//   bg-surface-base      → transparent by default (inherits page bg)
// ─────────────────────────────────────────────────────────────────────────────

export interface SMPageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Primary page title — rendered as <h1> */
  title:       string;
  /** Optional supporting description */
  subtitle?:   string;
  /** Optional breadcrumb / back-link rendered above the title */
  breadcrumb?: React.ReactNode;
  /** Optional action area rendered on the trailing edge (e.g. an SMButton) */
  action?:     React.ReactNode;
  /** Render a bottom divider line */
  divider?:    boolean;
}

export const SMPageHeader = React.forwardRef<HTMLDivElement, SMPageHeaderProps>(
  (
    {
      title,
      subtitle,
      breadcrumb,
      action,
      divider   = true,
      className = '',
      ...rest
    },
    ref,
  ) => (
    <div
      ref={ref}
      className={[
        'flex flex-col gap-1',
        'pb-4',
        divider ? 'border-b border-surface-border mb-6' : 'mb-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {breadcrumb && (
        <div className="mb-1 text-xs leading-none text-text-muted">{breadcrumb}</div>
      )}

      <div className="flex items-start justify-between gap-4">
        {/* Text stack */}
        <div className="flex flex-col gap-1 min-w-0">
          <h1 className="line-clamp-2 text-2xl font-bold text-text-primary leading-tight tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-text-secondary leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>

        {/* Trailing action slot */}
        {action && (
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {action}
          </div>
        )}
      </div>
    </div>
  ),
);

SMPageHeader.displayName = 'SMPageHeader';

export default SMPageHeader;
