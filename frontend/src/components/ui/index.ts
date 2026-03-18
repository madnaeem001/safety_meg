// ─────────────────────────────────────────────────────────────────────────────
// SafetyMEG — Core UI Primitives
// src/components/ui/index.ts
//
// Import from this barrel:
//   import { SMButton, SMCard, SMInput, SMBadge, SMStatusDot,
//            SMModal, SMTable, SMDrawer, SMAlert, SMPageHeader } from '@/components/ui';
// ─────────────────────────────────────────────────────────────────────────────

export { SMButton }          from './SMButton';
export type { SMButtonProps, SMButtonVariant, SMButtonSize } from './SMButton';

export { SMInput }           from './SMInput';
export type { SMInputProps, SMInputSize } from './SMInput';

export {
  SMCard,
  SMCardHeader,
  SMCardBody,
  SMCardFooter,
}                            from './SMCard';
export type {
  SMCardProps,
  SMCardHeaderProps,
  SMCardBodyProps,
  SMCardFooterProps,
} from './SMCard';

export { SMBadge }           from './SMBadge';
export type { SMBadgeProps, SMBadgeVariant, SMBadgeSize } from './SMBadge';

export { SMStatusDot }       from './SMStatusDot';
export type { SMStatusDotProps, SMStatusDotVariant, SMStatusDotSize } from './SMStatusDot';

export { SMModal, SMModalHeader, SMModalBody, SMModalFooter } from './SMModal';
export type {
  SMModalProps,
  SMModalSize,
  SMModalHeaderProps,
  SMModalBodyProps,
  SMModalFooterProps,
} from './SMModal';

export {
  SMTable,
  SMTableHeader,
  SMTableBody,
  SMTableRow,
  SMTableHead,
  SMTableCell,
}                            from './SMTable';
export type {
  SMTableProps,
  SMTableHeaderProps,
  SMTableBodyProps,
  SMTableRowProps,
  SMTableHeadProps,
  SMTableCellProps,
  SMTableSortDirection,
} from './SMTable';

export { SMDrawer, SMDrawerHeader, SMDrawerBody, SMDrawerFooter } from './SMDrawer';
export type {
  SMDrawerProps,
  SMDrawerPosition,
  SMDrawerWidth,
  SMDrawerHeaderProps,
  SMDrawerBodyProps,
  SMDrawerFooterProps,
} from './SMDrawer';

export { SMAlert }           from './SMAlert';
export type { SMAlertProps, SMAlertVariant } from './SMAlert';

export { SMPageHeader }      from './SMPageHeader';
export type { SMPageHeaderProps } from './SMPageHeader';

export { SMSelect }          from './SMSelect';
export type { SMSelectProps, SMSelectSize, SMSelectOption } from './SMSelect';

export { SMDatePicker }      from './SMDatePicker';
export type { SMDatePickerProps, SMDatePickerSize } from './SMDatePicker';

export {
  SMTabs,
  SMTabsList,
  SMTabsTrigger,
  SMTabsContent,
}                            from './SMTabs';
export type {
  SMTabsProps,
  SMTabsListProps,
  SMTabsTriggerProps,
  SMTabsContentProps,
} from './SMTabs';

export { SMTooltip }         from './SMTooltip';
export type { SMTooltipProps, SMTooltipPlacement } from './SMTooltip';

export { SMAvatar }          from './SMAvatar';
export type { SMAvatarProps, SMAvatarSize, SMAvatarStatus } from './SMAvatar';

export { SMEmptyState }      from './SMEmptyState';
export type { SMEmptyStateProps } from './SMEmptyState';

export { SMSkeleton }        from './SMSkeleton';
export type { SMSkeletonProps } from './SMSkeleton';

export { SMStatCard }        from './SMStatCard';
export type {
  SMStatCardProps,
  SMStatCardTrend,
  SMStatCardVariant,
} from './SMStatCard';

export { SMFilterBar }       from './SMFilterBar';
export type { SMFilterBarProps, SMFilterBarFilter } from './SMFilterBar';

export { SMToastProvider }   from './SMToastProvider';
