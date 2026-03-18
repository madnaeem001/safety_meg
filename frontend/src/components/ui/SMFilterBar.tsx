import React from 'react';
import { Search } from 'lucide-react';
import { SMButton } from './SMButton';
import { SMInput } from './SMInput';
import { SMSelect, type SMSelectOption } from './SMSelect';

export interface SMFilterBarFilter {
  key: string;
  label: string;
  options: SMSelectOption[];
}

export interface SMFilterBarProps extends React.HTMLAttributes<HTMLDivElement> {
  onSearch?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: SMFilterBarFilter[];
  activeFilters?: Record<string, string>;
  onFilterChange?: (key: string, value: string) => void;
  onReset?: () => void;
  actions?: React.ReactNode;
}

export const SMFilterBar = React.forwardRef<HTMLDivElement, SMFilterBarProps>(
  (
    {
      onSearch,
      searchPlaceholder = 'Search...',
      filters = [],
      activeFilters = {},
      onFilterChange,
      onReset,
      actions,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const hasActiveFilters = Object.values(activeFilters).some((value) => value !== '');

    return (
      <div
        ref={ref}
        className={[
          'flex flex-wrap items-center gap-3 py-3',
          className,
        ].filter(Boolean).join(' ')}
        {...rest}
      >
        {onSearch && (
          <SMInput
            inputSize="sm"
            type="search"
            placeholder={searchPlaceholder}
            leftIcon={<Search className="h-4 w-4" />}
            wrapperClassName="w-full sm:w-72"
            onChange={(event) => onSearch(event.target.value)}
          />
        )}

        {filters.map((filter) => (
          <div key={filter.key} className="w-full sm:w-36">
            <SMSelect
              size="sm"
              value={activeFilters[filter.key] ?? ''}
              onChange={(event) => onFilterChange?.(filter.key, event.target.value)}
              options={[
                { value: '', label: filter.label },
                ...filter.options,
              ]}
            />
          </div>
        ))}

        {(hasActiveFilters || actions) && (
          <div className="ml-auto flex w-full flex-wrap items-center justify-end gap-2 sm:w-auto">
            {hasActiveFilters && onReset && (
              <SMButton variant="ghost" size="sm" onClick={onReset}>
                Reset
              </SMButton>
            )}
            {actions}
          </div>
        )}
      </div>
    );
  },
);

SMFilterBar.displayName = 'SMFilterBar';

export default SMFilterBar;