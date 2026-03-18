import React, { useId } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMDatePicker — SafetyMEG native date-input wrapper
//
// Wraps <input type="date"> with the same border/focus/error/label/size API
// as SMInput.  `colorScheme: inherit` causes the native calendar picker to
// follow the page's light/dark theme (driven by the :root / .dark CSS vars).
//
// The `::-webkit-calendar-picker-indicator` is replaced with 50% opacity so it
// feels consistent with `text-text-secondary`.
// ─────────────────────────────────────────────────────────────────────────────

export type SMDatePickerSize = 'sm' | 'md' | 'lg';

export interface SMDatePickerProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'type'> {
  label?:       string;
  size?:        SMDatePickerSize;
  error?:       string;
  helperText?:  string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<SMDatePickerSize, string> = {
  sm: 'h-8  text-xs  px-2.5',
  md: 'h-10 text-sm  px-3',
  lg: 'h-12 text-base px-4',
};

// ── Component ─────────────────────────────────────────────────────────────────

export const SMDatePicker = React.forwardRef<HTMLInputElement, SMDatePickerProps>(
  (
    {
      label,
      size        = 'md',
      error,
      helperText,
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

        <input
          ref={ref}
          id={id}
          type="date"
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          /* Let the browser picker chrome match page theme */
          style={{ colorScheme: 'inherit' }}
          className={[
            'w-full rounded-lg border',
            'bg-surface-sunken text-text-primary',
            /* Dim the calendar icon to match text-text-secondary tone */
            '[&::-webkit-calendar-picker-indicator]:opacity-50',
            '[&::-webkit-calendar-picker-indicator]:cursor-pointer',
            'transition-colors duration-fast ease-smooth',
            'focus:outline-none focus-visible:outline-none',
            'focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base',
            error
              ? 'border-danger   focus-visible:ring-danger   focus-visible:border-danger'
              : 'border-surface-border focus-visible:ring-accent focus-visible:border-accent',
            SIZE_CLASSES[size],
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />

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

SMDatePicker.displayName = 'SMDatePicker';

export default SMDatePicker;
