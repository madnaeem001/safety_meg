import React, { useState, useId } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMTooltip — SafetyMEG hover/focus tooltip primitive
//
// Wraps any children in an inline-flex span.  Shows a tooltip bubble on hover
// or keyboard focus (via focus capture/blur capture on the wrapper).
//
// Placements: top | bottom | left | right
//
// Accessibility:
//   • Wrapper carries aria-describedby → tooltip id when visible
//   • Bubble has role="tooltip" with a stable useId()
//
// Bubble style:  dark (bg-primary-900 / text-text-inverted) in light mode;
//                bordered surface (bg-surface-overlay) in dark mode — so it
//                always contrasts against the page background.
// ─────────────────────────────────────────────────────────────────────────────

export type SMTooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface SMTooltipProps {
  /** Text content of the tooltip bubble */
  content:    string;
  /** Where the bubble appears relative to the wrapped element */
  placement?: SMTooltipPlacement;
  children:   React.ReactNode;
  className?: string;
}

// ── Placement positioning ─────────────────────────────────────────────────────
// Each value positions the absolute bubble relative to the `relative` wrapper.

const PLACEMENT_CLASSES: Record<SMTooltipPlacement, string> = {
  top:    'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full   left-1/2 -translate-x-1/2 mt-2',
  left:   'right-full top-1/2  -translate-y-1/2  mr-2',
  right:  'left-full  top-1/2  -translate-y-1/2  ml-2',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SMTooltip: React.FC<SMTooltipProps> = ({
  content,
  placement = 'top',
  children,
  className = '',
}) => {
  const [visible,   setVisible]   = useState(false);
  const tooltipId = useId();

  if (!content) return <>{children}</>;

  return (
    <span
      className="relative inline-flex"
      aria-describedby={visible ? tooltipId : undefined}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocusCapture={() => setVisible(true)}
      onBlurCapture={() => setVisible(false)}
    >
      {children}

      {visible && (
        <span
          role="tooltip"
          id={tooltipId}
          className={[
            'absolute z-50 pointer-events-none',
            'px-2.5 py-1.5 rounded-md',
            'text-xs font-medium leading-snug',
            'max-w-[200px] whitespace-normal',
            /* Light mode: classic dark bubble */
            'bg-primary-900 text-text-inverted',
            /* Dark mode: bordered surface bubble */
            'dark:bg-surface-overlay dark:text-text-primary dark:border dark:border-surface-border',
            'shadow-dropdown',
            'animate-fade-in-fast',
            PLACEMENT_CLASSES[placement],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
        >
          {content}
        </span>
      )}
    </span>
  );
};

SMTooltip.displayName = 'SMTooltip';

export default SMTooltip;
