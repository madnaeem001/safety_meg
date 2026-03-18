import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useId,
} from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMTabs — SafetyMEG accessible tab panel primitive
//
// Follows WAI-ARIA Tabs pattern (selection-follows-focus, roving tabIndex).
//
// Usage:
//   <SMTabs defaultValue="overview">
//     <SMTabs.List>
//       <SMTabs.Trigger value="overview">Overview</SMTabs.Trigger>
//       <SMTabs.Trigger value="details">Details</SMTabs.Trigger>
//     </SMTabs.List>
//     <SMTabs.Content value="overview">…</SMTabs.Content>
//     <SMTabs.Content value="details">…</SMTabs.Content>
//   </SMTabs>
//
// Supports both controlled (value + onChange) and uncontrolled (defaultValue).
// ─────────────────────────────────────────────────────────────────────────────

// ── Internal context ──────────────────────────────────────────────────────────

interface SMTabsContextValue {
  activeValue:    string;
  setActiveValue: (value: string) => void;
  /** Stable ID prefix for a11y wiring */
  baseId:         string;
}

const SMTabsContext = createContext<SMTabsContextValue | null>(null);

function useTabsContext(component: string): SMTabsContextValue {
  const ctx = useContext(SMTabsContext);
  if (!ctx) throw new Error(`${component} must be rendered inside <SMTabs>.`);
  return ctx;
}

// ── SMTabs.List ───────────────────────────────────────────────────────────────

export interface SMTabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const SMTabsList = React.forwardRef<HTMLDivElement, SMTabsListProps>(
  ({ className = '', children, ...rest }, ref) => {
    /** Keyboard nav: Arrow keys move focus and activate tabs (selection-follows-focus) */
    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const tabs = Array.from(
        e.currentTarget.querySelectorAll<HTMLButtonElement>(
          '[role="tab"]:not([disabled])',
        ),
      );
      if (!tabs.length) return;

      const currentIdx = tabs.findIndex((t) => t === document.activeElement);
      let   nextIdx    = currentIdx;

      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault();
          nextIdx = (currentIdx + 1) % tabs.length;
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault();
          nextIdx = (currentIdx - 1 + tabs.length) % tabs.length;
          break;
        case 'Home':
          e.preventDefault();
          nextIdx = 0;
          break;
        case 'End':
          e.preventDefault();
          nextIdx = tabs.length - 1;
          break;
        default:
          return;
      }

      tabs[nextIdx].focus();
      tabs[nextIdx].click(); // selection-follows-focus
    };

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className={[
          'flex items-end border-b border-surface-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
SMTabsList.displayName = 'SMTabsList';

// ── SMTabs.Trigger ────────────────────────────────────────────────────────────

export interface SMTabsTriggerProps
  /** Omit the HTMLButton `value` to use our own stricter string type */
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'value'> {
  /** Unique identifier — must match the corresponding SMTabs.Content value */
  value: string;
}

export const SMTabsTrigger = React.forwardRef<HTMLButtonElement, SMTabsTriggerProps>(
  ({ value, className = '', children, ...rest }, ref) => {
    const { activeValue, setActiveValue, baseId } = useTabsContext('SMTabs.Trigger');
    const isActive = activeValue === value;
    const tabId    = `${baseId}-tab-${value}`;
    const panelId  = `${baseId}-panel-${value}`;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={tabId}
        aria-selected={isActive}
        aria-controls={panelId}
        /** Roving tabIndex — only the active tab is in the natural tab order */
        tabIndex={isActive ? 0 : -1}
        onClick={() => setActiveValue(value)}
        className={[
          'relative px-4 py-2.5',
          'text-sm font-medium',
          /* bottom border trick: 2px colored border overlaps the parent's 1px divider */
          'border-b-2 -mb-px',
          'transition-colors duration-fast ease-smooth',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset',
          'rounded-t-sm',
          isActive
            ? 'border-accent text-accent'
            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-surface-border',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...rest}
      >
        {children}
      </button>
    );
  },
);
SMTabsTrigger.displayName = 'SMTabsTrigger';

// ── SMTabs.Content ────────────────────────────────────────────────────────────

export interface SMTabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Must match the value of the corresponding SMTabs.Trigger */
  value: string;
}

export const SMTabsContent = React.forwardRef<HTMLDivElement, SMTabsContentProps>(
  ({ value, className = '', children, ...rest }, ref) => {
    const { activeValue, baseId } = useTabsContext('SMTabs.Content');
    const isActive = activeValue === value;
    const tabId    = `${baseId}-tab-${value}`;
    const panelId  = `${baseId}-panel-${value}`;

    return (
      <div
        ref={ref}
        role="tabpanel"
        id={panelId}
        aria-labelledby={tabId}
        tabIndex={0}
        // `hidden` keeps the DOM intact (preserves child state) while hiding
        hidden={!isActive}
        className={['focus:outline-none pt-4', className].filter(Boolean).join(' ')}
        {...rest}
      >
        {children}
      </div>
    );
  },
);
SMTabsContent.displayName = 'SMTabsContent';

// ── Root (defined after sub-components so Object.assign can reference them) ───

export interface SMTabsProps {
  /** Controlled active tab value */
  value?:        string;
  /** Initial value for uncontrolled usage */
  defaultValue?: string;
  /** Called whenever the active tab changes */
  onChange?:     (value: string) => void;
  children:      React.ReactNode;
  className?:    string;
}

const _SMTabs = ({
  value: controlledValue,
  defaultValue = '',
  onChange,
  children,
  className = '',
}: SMTabsProps) => {
  const baseId = useId();
  const [internalValue, setInternalValue] = useState(defaultValue);

  const isControlled = controlledValue !== undefined;
  const activeValue  = isControlled ? controlledValue : internalValue;

  const setActiveValue = useCallback(
    (v: string) => {
      if (!isControlled) setInternalValue(v);
      onChange?.(v);
    },
    [isControlled, onChange],
  );

  return (
    <SMTabsContext.Provider value={{ activeValue, setActiveValue, baseId }}>
      <div className={className}>{children}</div>
    </SMTabsContext.Provider>
  );
};

// Composite export — TypeScript infers the combined type from Object.assign
export const SMTabs = Object.assign(_SMTabs, {
  displayName: 'SMTabs',
  List:        SMTabsList,
  Trigger:     SMTabsTrigger,
  Content:     SMTabsContent,
});

export default SMTabs;
