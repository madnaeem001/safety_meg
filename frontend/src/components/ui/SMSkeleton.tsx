import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMSkeleton — SafetyMEG animated shimmer skeleton primitive
//
// LinkedIn/Notion-style loading placeholder.
// Uses animate-pulse on bg-surface-sunken as the base, with a shimmer sweep
// overlay (backgroundPosition animation defined in tailwind.config.js).
//
// Usage:
//   <SMSkeleton className="h-4 w-48 rounded-lg" />
//   <SMSkeleton rows={3} className="h-4 w-full" gap="gap-3" />
// ─────────────────────────────────────────────────────────────────────────────

export interface SMSkeletonProps {
  /** Tailwind classes for width, height, and/or border-radius overrides.
   *  e.g. "h-4 w-48 rounded-lg"  |  "h-32 w-full rounded-2xl" */
  className?: string;
  /** Render N stacked skeleton rows. When > 1, each row shares the same
   *  className. Wraps rows in a flex-col container. */
  rows?: number;
  /** Flex-col gap between rows (default: "gap-2"). Only used when rows > 1. */
  gap?: string;
}

// ── Inner shimmer bar ────────────────────────────────────────────────────────

const SkeletonBar = React.forwardRef<HTMLDivElement, { className: string }>(
  ({ className }, ref) => (
    <div
      ref={ref}
      aria-hidden="true"
      className={[
        // Base surface + pulse
        'relative overflow-hidden rounded-lg',
        'bg-surface-sunken animate-pulse',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Shimmer sweep — slides a semi-transparent gradient across the bar */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-surface-overlay to-transparent"
        style={{ backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }}
      />
    </div>
  ),
);
SkeletonBar.displayName = 'SkeletonBar';

// ── Public component ─────────────────────────────────────────────────────────

export const SMSkeleton = React.forwardRef<HTMLDivElement, SMSkeletonProps>(
  ({ className = 'h-4 w-full', rows = 1, gap = 'gap-2' }, ref) => {
    if (rows === 1) {
      return <SkeletonBar ref={ref} className={className} />;
    }

    return (
      <div ref={ref} className={`flex flex-col ${gap}`} aria-hidden="true">
        {Array.from({ length: rows }, (_, i) => (
          <SkeletonBar key={i} className={className} />
        ))}
      </div>
    );
  },
);

SMSkeleton.displayName = 'SMSkeleton';
