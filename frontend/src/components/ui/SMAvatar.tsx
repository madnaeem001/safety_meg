import React, { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMAvatar — SafetyMEG user avatar primitive
//
// Renders a circular avatar with:
//   • Image (src) — falls back to initials on load error or when omitted
//   • Initials — 1-2 character fallback, uppercased automatically
//   • Status dot — optional indicator in the bottom-right corner
//
// The outer wrapper is `position: relative` without `overflow-hidden` so the
// absolute status dot is never clipped.  The inner circle span carries
// `overflow-hidden` to clip the image to a circle.
//
// Sizes: sm (32px) | md (40px) | lg (56px)
// ─────────────────────────────────────────────────────────────────────────────

export type SMAvatarSize   = 'sm' | 'md' | 'lg';
export type SMAvatarStatus = 'active' | 'inactive' | 'success' | 'warning' | 'danger';

export interface SMAvatarProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, 'children'> {
  /** Image source URL. Falls back to `initials` on error or when absent. */
  src?:      string;
  /** 1–2 character string displayed when no valid image is available */
  initials:  string;
  /** Alt text for `<img>` — defaults to initials when not provided */
  alt?:       string;
  size?:      SMAvatarSize;
  /** Renders a status dot badge in the bottom-right corner */
  status?:    SMAvatarStatus;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const CONTAINER_SIZE: Record<SMAvatarSize, string> = {
  sm: 'h-8  w-8',
  md: 'h-10 w-10',
  lg: 'h-14 w-14',
};

const INITIALS_TEXT: Record<SMAvatarSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

const DOT_SIZE: Record<SMAvatarSize, string> = {
  sm: 'h-2   w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3   w-3',
};

const DOT_COLOR: Record<SMAvatarStatus, string> = {
  active:   'bg-success',
  success:  'bg-success',
  inactive: 'bg-text-muted',
  warning:  'bg-warning',
  danger:   'bg-danger',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SMAvatar = React.forwardRef<HTMLSpanElement, SMAvatarProps>(
  (
    {
      src,
      initials,
      alt,
      size      = 'md',
      status,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const [imgError, setImgError] = useState(false);
    const showImage = Boolean(src) && !imgError;

    return (
      /* Outer wrapper: relative but NO overflow-hidden so the status dot is visible */
      <span
        ref={ref}
        className={[
          'relative inline-flex shrink-0',
          CONTAINER_SIZE[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {/* Avatar circle — overflow-hidden clips image to circle */}
        <span
          className={[
            'h-full w-full rounded-full overflow-hidden',
            'inline-flex items-center justify-center',
            'bg-accent-100 text-accent-700 font-semibold select-none',
            'dark:bg-accent-900/40 dark:text-accent-300',
            INITIALS_TEXT[size],
          ].join(' ')}
        >
          {showImage ? (
            <img
              src={src}
              alt={alt ?? initials}
              onError={() => setImgError(true)}
              className="h-full w-full object-cover"
            />
          ) : (
            <span aria-hidden="true">{initials.slice(0, 2).toUpperCase()}</span>
          )}
        </span>

        {/* Status dot — ring-surface-base creates a gap matching the page bg */}
        {status && (
          <span
            className={[
              'absolute bottom-0 right-0',
              'rounded-full ring-2 ring-surface-base',
              DOT_SIZE[size],
              DOT_COLOR[status],
            ].join(' ')}
            aria-hidden="true"
          />
        )}
      </span>
    );
  },
);

SMAvatar.displayName = 'SMAvatar';

export default SMAvatar;
