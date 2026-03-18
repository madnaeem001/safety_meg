import React, { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// SMModal — SafetyMEG foundational modal primitive
//
// Features:
//   • Portal-rendered into document.body (no z-index clipping issues)
//   • Focus trap — Tab/Shift+Tab cycle only inside the modal
//   • Escape key closes the modal
//   • Click on backdrop closes the modal (opt-out via closeOnBackdropClick=false)
//   • Smooth enter/exit via CSS animation tokens
//   • Dot-notation sub-components: SMModal.Header | .Body | .Footer
//
// Sizes: sm (384px) | md (512px) | lg (640px) | xl (768px) | full
// ─────────────────────────────────────────────────────────────────────────────

export type SMModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';

export interface SMModalProps {
  open:                    boolean;
  onClose:                 () => void;
  /** Accessible label for the dialog */
  title?:                  string;
  size?:                   SMModalSize;
  /** Default true — clicking the backdrop calls onClose */
  closeOnBackdropClick?:   boolean;
  children:                React.ReactNode;
  className?:              string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const SIZE_CLASSES: Record<SMModalSize, string> = {
  sm:   'w-full max-w-sm',
  md:   'w-full max-w-md',
  lg:   'w-full max-w-lg',
  xl:   'w-full max-w-3xl',
  full: 'w-full max-w-full mx-4',
};

// ── Focus trap helper ─────────────────────────────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SMModal: React.FC<SMModalProps> & {
  Header: typeof SMModalHeader;
  Body:   typeof SMModalBody;
  Footer: typeof SMModalFooter;
} = ({
  open,
  onClose,
  title,
  size                = 'md',
  closeOnBackdropClick = true,
  children,
  className           = '',
}) => {
  const dialogRef   = useRef<HTMLDivElement>(null);
  const titleId     = useId();
  const previousFocus = useRef<Element | null>(null);

  // Save focus owner before modal opens; restore on close
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      // Move focus into the modal on the next frame
      requestAnimationFrame(() => {
        const first = dialogRef.current
          ? getFocusable(dialogRef.current)[0]
          : null;
        (first ?? dialogRef.current)?.focus();
      });
    } else {
      (previousFocus.current as HTMLElement | null)?.focus();
    }
  }, [open]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  // Escape key
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }

      // Focus trap: Tab / Shift+Tab
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = getFocusable(dialogRef.current);
        if (focusable.length === 0) { e.preventDefault(); return; }

        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    },
    [onClose],
  );

  if (!open) return null;

  const modal = (
    // Backdrop
    <div
      className={[
        'fixed inset-0 z-50 flex items-center justify-center p-4',
        'bg-primary-950/70 backdrop-blur-sm',
        'animate-fade-in-fast',
      ].join(' ')}
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      onKeyDown={handleKeyDown}
      onClick={closeOnBackdropClick ? onClose : undefined}
    >
      {/* Dialog box — stop click propagation so backdrop click doesn't fire */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={[
          'relative flex flex-col',
          'bg-surface-raised border border-surface-border',
          'shadow-modal rounded-xl',
          'focus:outline-none',
          'animate-scale-in-fast',
          'max-h-[90dvh]',
          SIZE_CLASSES[size],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hidden accessible title anchor */}
        {title && (
          <span id={titleId} className="sr-only">
            {title}
          </span>
        )}
        {children}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
};

SMModal.displayName = 'SMModal';

// ── Sub-components ────────────────────────────────────────────────────────────

export interface SMModalHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Renders an X button that calls onClose when provided */
  onClose?: () => void;
}

export const SMModalHeader = React.forwardRef<HTMLDivElement, SMModalHeaderProps>(
  ({ onClose, className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'flex items-center justify-between shrink-0',
        'px-6 py-4 border-b border-surface-border',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <div className="text-heading font-semibold text-text-primary">
        {children}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className={[
            'inline-flex items-center justify-center',
            'h-8 w-8 rounded-lg',
            'text-text-muted hover:text-text-primary hover:bg-surface-overlay',
            'transition-colors duration-fast ease-smooth',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          ].join(' ')}
        >
          <CloseIcon />
        </button>
      )}
    </div>
  ),
);
SMModalHeader.displayName = 'SMModalHeader';

export interface SMModalBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SMModalBody = React.forwardRef<HTMLDivElement, SMModalBodyProps>(
  ({ className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={['flex-1 overflow-y-auto px-6 py-4', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </div>
  ),
);
SMModalBody.displayName = 'SMModalBody';

export interface SMModalFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end' | 'between';
}

const FOOTER_ALIGN: Record<NonNullable<SMModalFooterProps['align']>, string> = {
  start:   'justify-start',
  center:  'justify-center',
  end:     'justify-end',
  between: 'justify-between',
};

export const SMModalFooter = React.forwardRef<HTMLDivElement, SMModalFooterProps>(
  ({ align = 'end', className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'flex items-center gap-3 shrink-0',
        FOOTER_ALIGN[align],
        'px-6 py-4 border-t border-surface-border',
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
SMModalFooter.displayName = 'SMModalFooter';

// Attach sub-components
SMModal.Header = SMModalHeader;
SMModal.Body   = SMModalBody;
SMModal.Footer = SMModalFooter;

// ── Internal icon ─────────────────────────────────────────────────────────────

const CloseIcon: React.FC = () => (
  <svg
    width="16" height="16" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export default SMModal;
