import React, { useId } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMInput — SafetyMEG foundational input / textarea primitive
//
// Supports : text | email | password | number | textarea (via `as` prop)
// Slots    : label, error (red token), helperText, leftIcon, rightIcon
// States   : error outline, disabled (muted), focus (accent ring)
//
// `as='textarea'` renders a <textarea> and forwards rows / applicable props.
// ─────────────────────────────────────────────────────────────────────────────

export type SMInputSize = 'sm' | 'md' | 'lg';

// Shared props regardless of underlying element
interface SMInputSharedProps {
  /** Text label rendered above the field */
  label?:            string;
  /** Red helper text rendered below — also sets aria-invalid */
  error?:            string;
  /** Gray helper text rendered below (hidden when error is present) */
  helperText?:       string;
  inputSize?:        SMInputSize;
  /** Additional class for the outer wrapper div  */
  wrapperClassName?: string;
  /** Element rendered inside the left inset of the input */
  leftIcon?:         React.ReactNode;
  /** Element rendered inside the right inset of the input */
  rightIcon?:        React.ReactNode;
  /** Render as a textarea instead of input */
  as?:               'input' | 'textarea';
  /** Only relevant when as='textarea' */
  rows?:             number;
}

// When as='input' (default) — extends standard input attributes
interface SMInputAsInput
  extends SMInputSharedProps,
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  as?: 'input';
}

// When as='textarea' — extends standard textarea attributes
interface SMInputAsTextarea
  extends SMInputSharedProps,
    Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  as: 'textarea';
}

export type SMInputProps = SMInputAsInput | SMInputAsTextarea;

// ── Style helpers ─────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<SMInputSize, string> = {
  sm: 'h-8  px-3 text-sm  rounded-md',
  md: 'h-10 px-4 text-base rounded-lg',
  lg: 'h-12 px-4 text-lg  rounded-xl',
};

const TEXTAREA_SIZE_CLASSES: Record<SMInputSize, string> = {
  sm: 'px-3 py-2 text-sm  rounded-md',
  md: 'px-4 py-2.5 text-base rounded-lg',
  lg: 'px-4 py-3 text-lg  rounded-xl',
};

const BASE_FIELD_CLASSES = [
  'w-full',
  'bg-surface-sunken text-text-primary placeholder:text-text-muted',
  'border border-surface-border',
  'transition-colors duration-fast ease-smooth',
  'focus:outline-none focus-visible:outline-none',
  'focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/25 focus-visible:ring-offset-1 focus-visible:ring-offset-surface-base',
  'disabled:opacity-50 disabled:cursor-not-allowed',
].join(' ');

const ERROR_FIELD_CLASSES =
  'border-danger focus-visible:border-danger focus-visible:ring-danger/25';

// ── Component ─────────────────────────────────────────────────────────────────

export const SMInput = React.forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  SMInputProps
>(
  (
    {
      as           = 'input',
      label,
      error,
      helperText,
      inputSize    = 'md',
      wrapperClassName = '',
      leftIcon,
      rightIcon,
      rows         = 4,
      className    = '',
      id: externalId,
      ...rest
    },
    ref,
  ) => {
    const autoId = useId();
    const fieldId = externalId ?? autoId;
    const errorId = `${fieldId}-error`;
    const helperId = `${fieldId}-helper`;

    const sizeClass =
      as === 'textarea'
        ? TEXTAREA_SIZE_CLASSES[inputSize]
        : SIZE_CLASSES[inputSize];

    const fieldClasses = [
      BASE_FIELD_CLASSES,
      sizeClass,
      error ? ERROR_FIELD_CLASSES : '',
      leftIcon  ? 'pl-10' : '',
      rightIcon ? 'pr-10' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const sharedFieldProps = {
      id:              fieldId,
      'aria-invalid':  error ? (true as const) : undefined,
      'aria-describedby': error
        ? errorId
        : helperText
        ? helperId
        : undefined,
    };

    return (
      <div className={`flex flex-col gap-1.5 ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={fieldId}
            className="text-sm font-medium text-text-primary leading-none"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <span className="pointer-events-none absolute left-3 text-text-muted">
              {leftIcon}
            </span>
          )}

          {as === 'textarea' ? (
            <textarea
              ref={ref as React.Ref<HTMLTextAreaElement>}
              rows={rows}
              className={fieldClasses}
              {...sharedFieldProps}
              {...(rest as React.TextareaHTMLAttributes<HTMLTextAreaElement>)}
            />
          ) : (
            <input
              ref={ref as React.Ref<HTMLInputElement>}
              className={fieldClasses}
              {...sharedFieldProps}
              {...(rest as React.InputHTMLAttributes<HTMLInputElement>)}
            />
          )}

          {rightIcon && (
            <span className="pointer-events-none absolute right-3 text-text-muted">
              {rightIcon}
            </span>
          )}
        </div>

        {error && (
          <p id={errorId} className="text-sm text-danger-600" role="alert">
            {error}
          </p>
        )}

        {!error && helperText && (
          <p id={helperId} className="text-sm text-text-muted">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

SMInput.displayName = 'SMInput';

export default SMInput;
