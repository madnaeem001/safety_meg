import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMCard — SafetyMEG foundational card primitive
//
// Surface     : bg-surface-raised  (auto-switches light ↔ dark via CSS vars)
// Elevation   : shadow-card token
// Border      : border-surface-border
// Sub-components: SMCard.Header | SMCard.Body | SMCard.Footer
//                 (also exported as named exports for flexible composition)
//
// Usage:
//   <SMCard>
//     <SMCard.Header>Title</SMCard.Header>
//     <SMCard.Body>Content</SMCard.Body>
//     <SMCard.Footer>Actions</SMCard.Footer>
//   </SMCard>
//
//   — or — flat (no sub-components, children rendered directly):
//   <SMCard className="p-6">…</SMCard>
// ─────────────────────────────────────────────────────────────────────────────

export interface SMCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Remove the default rounded corners + shadow (e.g. for table rows) */
  flat?:    boolean;
  /** Remove the default border */
  noBorder?: boolean;
}

export const SMCard = React.forwardRef<HTMLDivElement, SMCardProps>(
  ({ flat = false, noBorder = false, className = '', children, ...rest }, ref) => {
    const classes = [
      'bg-surface-raised text-text-primary backdrop-blur-md',
      flat   ? '' : 'rounded-xl shadow-card',
      noBorder ? '' : 'border border-surface-border',
      'transition-colors duration-normal ease-smooth',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={classes} {...rest}>
        {children}
      </div>
    );
  },
);

SMCard.displayName = 'SMCard';

// ── Sub-components ────────────────────────────────────────────────────────────

export interface SMCardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Optional right-side action(s) */
  action?: React.ReactNode;
}

export const SMCardHeader = React.forwardRef<HTMLDivElement, SMCardHeaderProps>(
  ({ action, className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'flex items-center justify-between',
        'px-6 py-4',
        'border-b border-surface-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="text-base font-semibold text-text-primary leading-snug">
        {children}
      </div>
      {action && (
        <div className="flex items-center gap-2 text-text-secondary">
          {action}
        </div>
      )}
    </div>
  ),
);

SMCardHeader.displayName = 'SMCardHeader';

export interface SMCardBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SMCardBody = React.forwardRef<HTMLDivElement, SMCardBodyProps>(
  ({ className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={['px-6 py-4', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  ),
);

SMCardBody.displayName = 'SMCardBody';

export interface SMCardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Align footer content: start | center | end | between */
  align?: 'start' | 'center' | 'end' | 'between';
}

const FOOTER_ALIGN: Record<NonNullable<SMCardFooterProps['align']>, string> = {
  start:   'justify-start',
  center:  'justify-center',
  end:     'justify-end',
  between: 'justify-between',
};

export const SMCardFooter = React.forwardRef<HTMLDivElement, SMCardFooterProps>(
  ({ align = 'end', className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'flex items-center gap-3',
        FOOTER_ALIGN[align],
        'px-6 py-4',
        'border-t border-surface-border',
        'bg-surface-overlay rounded-b-xl',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  ),
);

SMCardFooter.displayName = 'SMCardFooter';

// Attach sub-components as static properties for dot-notation access
(SMCard as React.ForwardRefExoticComponent<SMCardProps> & {
  Header: typeof SMCardHeader;
  Body:   typeof SMCardBody;
  Footer: typeof SMCardFooter;
}).Header = SMCardHeader;

(SMCard as React.ForwardRefExoticComponent<SMCardProps> & {
  Header: typeof SMCardHeader;
  Body:   typeof SMCardBody;
  Footer: typeof SMCardFooter;
}).Body = SMCardBody;

(SMCard as React.ForwardRefExoticComponent<SMCardProps> & {
  Header: typeof SMCardHeader;
  Body:   typeof SMCardBody;
  Footer: typeof SMCardFooter;
}).Footer = SMCardFooter;

export default SMCard;
