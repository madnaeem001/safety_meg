import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// SMTable — SafetyMEG foundational data-table primitive
//
// Composable via dot-notation:
//   SMTable            → <table> wrapper (scroll container)
//   SMTable.Header     → <thead>
//   SMTable.Body       → <tbody>
//   SMTable.Row        → <tr>  (hover highlight + optional selected state)
//   SMTable.Head       → <th>  (column header cell)
//   SMTable.Cell       → <td>  (data cell)
//
// Tokens:
//   Header text  → text-text-secondary (muted labels)
//   Data text    → text-text-primary
//   Row hover    → hover:bg-surface-sunken
//   Border       → border-surface-border
//   Background   → bg-surface-raised
// ─────────────────────────────────────────────────────────────────────────────

// ── SMTable ───────────────────────────────────────────────────────────────────

export interface SMTableProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Removes the outer rounded card border (useful inside an existing card) */
  flush?: boolean;
}

export const SMTable = React.forwardRef<HTMLDivElement, SMTableProps>(
  ({ flush = false, className = '', children, ...rest }, ref) => (
    <div
      ref={ref}
      className={[
        'w-full overflow-x-auto',
        flush
          ? ''
          : 'bg-surface-raised border border-surface-border rounded-xl shadow-card',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      <table className="w-full border-collapse text-sm">
        {children}
      </table>
    </div>
  ),
) as SMTableComposite;

SMTable.displayName = 'SMTable';

// ── SMTable.Header (thead) ────────────────────────────────────────────────────

export interface SMTableHeaderProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const SMTableHeader = React.forwardRef<
  HTMLTableSectionElement,
  SMTableHeaderProps
>(({ className = '', children, ...rest }, ref) => (
  <thead
    ref={ref}
    className={[
      'bg-surface-overlay border-b border-surface-border',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </thead>
));
SMTableHeader.displayName = 'SMTableHeader';

// ── SMTable.Body (tbody) ──────────────────────────────────────────────────────

export interface SMTableBodyProps
  extends React.HTMLAttributes<HTMLTableSectionElement> {}

export const SMTableBody = React.forwardRef<
  HTMLTableSectionElement,
  SMTableBodyProps
>(({ className = '', children, ...rest }, ref) => (
  <tbody
    ref={ref}
    className={[
      'divide-y divide-surface-border',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </tbody>
));
SMTableBody.displayName = 'SMTableBody';

// ── SMTable.Row (tr) ──────────────────────────────────────────────────────────

export interface SMTableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  /** Highlights the row as selected */
  selected?: boolean;
  /** Disables the hover highlight (e.g. for header rows) */
  noHover?: boolean;
}

export const SMTableRow = React.forwardRef<HTMLTableRowElement, SMTableRowProps>(
  ({ selected = false, noHover = false, className = '', children, ...rest }, ref) => (
    <tr
      ref={ref}
      aria-selected={selected || undefined}
      className={[
        'transition-colors duration-fast ease-smooth',
        selected
          ? 'bg-accent-50 dark:bg-accent-950/30'
          : noHover
          ? ''
          : 'hover:bg-surface-sunken',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </tr>
  ),
);
SMTableRow.displayName = 'SMTableRow';

// ── SMTable.Head (th) ─────────────────────────────────────────────────────────

export type SMTableSortDirection = 'asc' | 'desc' | 'none';

export interface SMTableHeadProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Renders a sort indicator when provided */
  sortDirection?: SMTableSortDirection;
}

export const SMTableHead = React.forwardRef<
  HTMLTableCellElement,
  SMTableHeadProps
>(({ sortDirection, className = '', children, ...rest }, ref) => (
  <th
    ref={ref}
    scope="col"
    aria-sort={
      sortDirection === 'asc'
        ? 'ascending'
        : sortDirection === 'desc'
        ? 'descending'
        : undefined
    }
    className={[
      'px-4 py-3',
      'text-xs font-semibold uppercase tracking-wide',
      'text-text-secondary text-left',
      'whitespace-nowrap select-none',
      sortDirection !== undefined ? 'cursor-pointer' : '',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    <span className="inline-flex items-center gap-1">
      {children}
      {sortDirection && sortDirection !== 'none' && (
        <SortIcon direction={sortDirection} />
      )}
    </span>
  </th>
));
SMTableHead.displayName = 'SMTableHead';

// ── SMTable.Cell (td) ─────────────────────────────────────────────────────────

export interface SMTableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Reduces opacity for truly secondary data */
  muted?: boolean;
}

export const SMTableCell = React.forwardRef<
  HTMLTableCellElement,
  SMTableCellProps
>(({ muted = false, className = '', children, ...rest }, ref) => (
  <td
    ref={ref}
    className={[
      'px-4 py-3',
      muted ? 'text-text-secondary' : 'text-text-primary',
      'whitespace-nowrap',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...rest}
  >
    {children}
  </td>
));
SMTableCell.displayName = 'SMTableCell';

// ── Dot-notation composite type ───────────────────────────────────────────────

interface SMTableComposite
  extends React.ForwardRefExoticComponent<
    SMTableProps & React.RefAttributes<HTMLDivElement>
  > {
  Header: typeof SMTableHeader;
  Body:   typeof SMTableBody;
  Row:    typeof SMTableRow;
  Head:   typeof SMTableHead;
  Cell:   typeof SMTableCell;
}

// Attach sub-components (cast established above via SMTableComposite)
(SMTable as SMTableComposite).Header = SMTableHeader;
(SMTable as SMTableComposite).Body   = SMTableBody;
(SMTable as SMTableComposite).Row    = SMTableRow;
(SMTable as SMTableComposite).Head   = SMTableHead;
(SMTable as SMTableComposite).Cell   = SMTableCell;

// ── Internal sort icon ────────────────────────────────────────────────────────

const SortIcon: React.FC<{ direction: 'asc' | 'desc' }> = ({ direction }) => (
  <svg
    width="12" height="12" viewBox="0 0 24 24"
    fill="none" stroke="currentColor"
    strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
    className={direction === 'asc' ? 'rotate-180' : ''}
    aria-hidden="true"
  >
    <path d="M12 5v14M5 12l7 7 7-7" />
  </svg>
);

export default SMTable;
