import React, { useEffect, useRef, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';

// ─────────────────────────────────────────────────────────────────────────────
// SMDrawer — SafetyMEG side-panel / drawer primitive
//
// Features:
//   • Portal-rendered into document.body
//   • Position: left | right
//   • Widths: sm (320px) | md (400px) | lg (512px) | full
//   • Focus trap + Escape to close
//   • Backdrop click to close (opt-out via closeOnBackdropClick=false)
//   • Dot-notation sub-components: SMDrawer.Header | .Body | .Footer
// ─────────────────────────────────────────────────────────────────────────────

export type SMDrawerPosition = 'left' | 'right';
export type SMDrawerWidth    = 'sm' | 'md' | 'lg' | 'full';

export interface SMDrawerProps {
  open:                   boolean;
  onClose:                () => void;
  position?:              SMDrawerPosition;
  width?:                 SMDrawerWidth;
  /** Accessible label for the dialog */
  title?:                 string;
  closeOnBackdropClick?:  boolean;
  children:               React.ReactNode;
  className?:             string;
}

// ── Style maps ────────────────────────────────────────────────────────────────

const WIDTH_CLASSES: Record<SMDrawerWidth, string> = {
  sm:   'w-80',    // 320px
  md:   'max-w-sm w-full', // ~400px
  lg:   'max-w-lg w-full', // 512px
  full: 'w-full',
};

const POSITION_CLASSES: Record<SMDrawerPosition, { panel: string; enter: string }> = {
  right: {
    panel: 'right-0 top-0 h-full',
    enter: 'animate-slide-in-right',
  },
  left: {
    panel: 'left-0 top-0 h-full',
    enter: 'animate-slide-in-right [animation-direction:reverse]',
  },
};

// ── Focus trap helper (shared with SMModal) ───────────────────────────────────

const FOCUSABLE_SELECTORS = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

function getFocusable(el: HTMLElement): HTMLElement[] {
  return Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTORS));
}

// ── Component ─────────────────────────────────────────────────────────────────

export const SMDrawer: React.FC<SMDrawerProps> & {
  Header: typeof SMDrawerHeader;
  Body:   typeof SMDrawerBody;
  Footer: typeof SMDrawerFooter;
} = ({
  open,
  onClose,
  position             = 'right',
  width                = 'md',
  title,
  closeOnBackdropClick  = true,
  children,
  className            = '',
}) => {
  const panelRef       = useRef<HTMLDivElement>(null);
  const titleId        = useId();
  const previousFocus  = useRef<Element | null>(null);

  // Save + restore focus
  useEffect(() => {
    if (open) {
      previousFocus.current = document.activeElement;
      requestAnimationFrame(() => {
        const first = panelRef.current ? getFocusable(panelRef.current)[0] : null;
        (first ?? panelRef.current)?.focus();
      });
    } else {
      (previousFocus.current as HTMLElement | null)?.focus();
    }
  }, [open]);

  // Lock body scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => { document.body.style.overflow = ''; };
    }
  }, [open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') { e.stopPropagation(); onClose(); return; }

      if (e.key === 'Tab' && panelRef.current) {
        const focusable = getFocusable(panelRef.current);
        if (!focusable.length) { e.preventDefault(); return; }

        const first = focusable[0];
        const last  = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    },
    [onClose],
  );

  if (!open) return null;

  const { panel: positionClass, enter: enterClass } = POSITION_CLASSES[position];

  const drawer = (
    <div
      className="fixed inset-0 z-50 flex"
      aria-modal="true"
      role="dialog"
      aria-labelledby={title ? titleId : undefined}
      onKeyDown={handleKeyDown}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-primary-950/60 backdrop-blur-sm animate-fade-in-fast"
        onClick={closeOnBackdropClick ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          'absolute flex flex-col',
          'bg-surface-raised border-surface-border',
          position === 'right' ? 'border-l' : 'border-r',
          'shadow-modal',
          'focus:outline-none',
          positionClass,
          WIDTH_CLASSES[width],
          enterClass,
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        onClick={(e) => e.stopPropagation()}
      >
        {title && <span id={titleId} className="sr-only">{title}</span>}
        {children}
      </div>
    </div>
  );

  return createPortal(drawer, document.body);
};

SMDrawer.displayName = 'SMDrawer';

// ── Sub-components ────────────────────────────────────────────────────────────

export interface SMDrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  onClose?: () => void;
}

export const SMDrawerHeader = React.forwardRef<HTMLDivElement, SMDrawerHeaderProps>(
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
      <div className="text-base font-semibold text-text-primary">{children}</div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close panel"
          className={[
            'inline-flex items-center justify-center h-8 w-8 rounded-lg',
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
SMDrawerHeader.displayName = 'SMDrawerHeader';

export interface SMDrawerBodyProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SMDrawerBody = React.forwardRef<HTMLDivElement, SMDrawerBodyProps>(
  ({ className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={['flex-1 overflow-y-auto px-6 py-4', className].filter(Boolean).join(' ')}
      {...rest}
    >
      {children}
    </div>
  ),
);
SMDrawerBody.displayName = 'SMDrawerBody';

export interface SMDrawerFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end' | 'between';
}

const FOOTER_ALIGN: Record<NonNullable<SMDrawerFooterProps['align']>, string> = {
  start:   'justify-start',
  center:  'justify-center',
  end:     'justify-end',
  between: 'justify-between',
};

export const SMDrawerFooter = React.forwardRef<HTMLDivElement, SMDrawerFooterProps>(
  ({ align = 'end', className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'flex items-center gap-3 shrink-0',
        FOOTER_ALIGN[align],
        'px-6 py-4 border-t border-surface-border',
        'bg-surface-overlay',
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
SMDrawerFooter.displayName = 'SMDrawerFooter';

SMDrawer.Header = SMDrawerHeader;
SMDrawer.Body   = SMDrawerBody;
SMDrawer.Footer = SMDrawerFooter;

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

export default SMDrawer;
