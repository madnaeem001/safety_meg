import React, { useId } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMSelect — SafetyMEG native-select wrapper
//
// Matches SMInput styling exactly: same border/focus/error tokens,
// same size scale, same label/helperText/error API.
//
// A custom chevron SVG replaces the browser's native arrow (`appearance-none`).
// ─────────────────────────────────────────────────────────────────────────────

export type SMSelectSize = 'sm' | 'md' | 'lg';

export interface SMSelectOption {
  value:     string;
  label:     string;
  disabled?: boolean;
}

export interface SMSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?:       string;
  options:      SMSelectOption[];
  size?:        SMSelectSize;
  error?:       string;
  helperText?:  string;
  /** Shown as the first, disabled option (unselected placeholder) */
  placeholder?: string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SELECT_SIZE: Record<SMSelectSize, string> = {
  sm: 'h-8  text-xs  px-2.5 pr-8',
  md: 'h-10 text-sm  px-3   pr-10',
  lg: 'h-12 text-base px-4  pr-12',
};

const CHEVRON_POS: Record<SMSelectSize, string> = {
  sm: 'right-2   h-3.5 w-3.5',
  md: 'right-3   h-4   w-4',
  lg: 'right-3.5 h-5   w-5',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SMSelect = React.forwardRef<HTMLSelectElement, SMSelectProps>(
  (
    {
      label,
      options,
      size        = 'md',
      error,
      helperText,
      placeholder,
      className   = '',
      id: externalId,
      ...rest
    },
    ref,
  ) => {
    const internalId = useId();
    const id         = externalId ?? internalId;
    const errorId    = `${id}-error`;
    const helperId   = `${id}-helper`;

    const describedBy =
      [error ? errorId : '', !error && helperText ? helperId : '']
        .filter(Boolean)
        .join(' ') || undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-text-primary">
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={id}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy}
            className={[
              'w-full appearance-none rounded-lg border',
              'bg-surface-sunken text-text-primary',
              'transition-colors duration-fast ease-smooth',
              'focus:outline-none focus-visible:outline-none',
              'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base',
              error
                ? 'border-danger   focus-visible:ring-danger   focus-visible:border-danger'
                : 'border-surface-border focus-visible:ring-accent focus-visible:border-accent',
              SELECT_SIZE[size],
              className,
            ]
              .filter(Boolean)
              .join(' ')}
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>

          {/* Custom chevron — pointer-events-none so clicks pass to <select> */}
          <span
            className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-text-secondary ${CHEVRON_POS[size]}`}
            aria-hidden="true"
          >
            <ChevronIcon />
          </span>
        </div>

        {error && (
          <p id={errorId} className="text-xs text-danger" role="alert">
            {error}
          </p>
        )}
        {!error && helperText && (
          <p id={helperId} className="text-xs text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

SMSelect.displayName = 'SMSelect';

// ── Internal icon ─────────────────────────────────────────────────────────────

const ChevronIcon: React.FC = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="w-full h-full"
    aria-hidden="true"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

export default SMSelect;
