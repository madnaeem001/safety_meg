# UI Components

SafetyMEG ships with 16 core `SM*` primitives plus two newer UI utilities for loading and toast feedback. This guide is intentionally brief: it shows the main props you are expected to reach for first, plus a copy-paste usage example for each component.

Note: most primitives also forward the native HTML props for their underlying element.

## Barrel Import

```tsx
import {
  SMAlert,
  SMAvatar,
  SMBadge,
  SMButton,
  SMCard,
  SMDatePicker,
  SMDrawer,
  SMEmptyState,
  SMInput,
  SMModal,
  SMPageHeader,
  SMSelect,
  SMStatusDot,
  SMTable,
  SMTabs,
  SMTooltip,
  SMSkeleton,
  SMToastProvider,
} from '../components/ui';
```

## Core 16 Primitives

### 1. SMButton

Main props: `variant: 'primary' | 'secondary' | 'danger' | 'ghost' | 'icon'`, `size: 'sm' | 'md' | 'lg'`, `loading`, `leftIcon`, `rightIcon`

```tsx
<SMButton variant="primary" size="md" leftIcon={<Save className="w-4 h-4" />}>
  Save Changes
</SMButton>
```

### 2. SMInput

Main props: `label`, `error`, `helperText`, `inputSize`, `leftIcon`, `rightIcon`, `as="textarea"`, `rows`, `wrapperClassName`

```tsx
<SMInput
  label="Incident Title"
  placeholder="Brief summary"
  helperText="Keep it under 80 characters"
/>
```

### 3. SMCard

Main props: `flat`, `noBorder`, plus subcomponents `SMCard.Header`, `SMCard.Body`, `SMCard.Footer`; header supports `action`, footer supports `align`

```tsx
<SMCard>
  <SMCard.Header action={<SMButton size="sm">Edit</SMButton>}>
    Incident Overview
  </SMCard.Header>
  <SMCard.Body>Card content goes here.</SMCard.Body>
</SMCard>
```

### 4. SMBadge

Main props: `variant: 'success' | 'warning' | 'danger' | 'neutral' | 'teal'`, `size: 'sm' | 'md'`, `icon`

```tsx
<SMBadge variant="warning" size="sm">
  Expiring Soon
</SMBadge>
```

### 5. SMStatusDot

Main props: `variant: 'active' | 'inactive' | 'success' | 'warning' | 'danger' | 'neutral'`, `size`, `label`, `pulse`

```tsx
<SMStatusDot variant="active" size="sm" label="Live" pulse />
```

### 6. SMModal

Main props: `open`, `onClose`, `title`, `size: 'sm' | 'md' | 'lg' | 'xl' | 'full'`, `closeOnBackdropClick`; subcomponents: `SMModal.Header`, `SMModal.Body`, `SMModal.Footer`

```tsx
<SMModal open={open} onClose={() => setOpen(false)} title="Confirm delete" size="sm">
  <SMModal.Body>Are you sure you want to remove this record?</SMModal.Body>
  <SMModal.Footer>
    <SMButton variant="ghost" onClick={() => setOpen(false)}>Cancel</SMButton>
    <SMButton variant="danger">Delete</SMButton>
  </SMModal.Footer>
</SMModal>
```

### 7. SMTable

Main props: root `flush`; row `selected`, `noHover`; head `sortDirection`; cell `muted`. The root already wraps the table with `overflow-x-auto`.

```tsx
<SMTable>
  <SMTable.Header>
    <SMTable.Row noHover>
      <SMTable.Head>ID</SMTable.Head>
      <SMTable.Head>Status</SMTable.Head>
    </SMTable.Row>
  </SMTable.Header>
  <SMTable.Body>
    <SMTable.Row>
      <SMTable.Cell>INC-204</SMTable.Cell>
      <SMTable.Cell>Open</SMTable.Cell>
    </SMTable.Row>
  </SMTable.Body>
</SMTable>
```

### 8. SMDrawer

Main props: `open`, `onClose`, `position: 'left' | 'right'`, `width: 'sm' | 'md' | 'lg' | 'full'`, `title`, `closeOnBackdropClick`; subcomponents: `SMDrawer.Header`, `SMDrawer.Body`, `SMDrawer.Footer`

```tsx
<SMDrawer open={open} onClose={() => setOpen(false)} title="Filters" width="md">
  <SMDrawer.Header onClose={() => setOpen(false)}>Filters</SMDrawer.Header>
  <SMDrawer.Body>Filter controls...</SMDrawer.Body>
</SMDrawer>
```

### 9. SMAlert

Main props: `variant: 'info' | 'success' | 'warning' | 'danger'`, `title`, `onDismiss`, `icon`, `noIcon`

```tsx
<SMAlert variant="success" title="Saved" onDismiss={() => setOpen(false)}>
  The training assignment was saved successfully.
</SMAlert>
```

### 10. SMPageHeader

Main props: `title`, `subtitle`, `breadcrumb`, `action`, `divider`

```tsx
<SMPageHeader
  title="Training Management"
  subtitle="Backend-connected course governance and compliance"
  action={<SMButton size="sm">Refresh</SMButton>}
/>
```

### 11. SMSelect

Main props: `label`, `options`, `size`, `error`, `helperText`, `placeholder`

```tsx
<SMSelect
  label="Severity"
  placeholder="Select severity"
  options={[
    { value: 'low', label: 'Low' },
    { value: 'high', label: 'High' },
  ]}
/>
```

### 12. SMDatePicker

Main props: `label`, `size`, `error`, `helperText`, plus the native date input props

```tsx
<SMDatePicker label="Due Date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
```

### 13. SMTabs

Main props: root `value`, `defaultValue`, `onChange`; trigger `value`; content `value`

```tsx
<SMTabs defaultValue="overview">
  <SMTabs.List>
    <SMTabs.Trigger value="overview">Overview</SMTabs.Trigger>
    <SMTabs.Trigger value="history">History</SMTabs.Trigger>
  </SMTabs.List>
  <SMTabs.Content value="overview">Overview content</SMTabs.Content>
  <SMTabs.Content value="history">History content</SMTabs.Content>
</SMTabs>
```

### 14. SMTooltip

Main props: `content`, `placement: 'top' | 'bottom' | 'left' | 'right'`, `className`

```tsx
<SMTooltip content="Refresh live data" placement="bottom">
  <SMButton variant="icon" aria-label="Refresh">
    <RefreshCw className="w-4 h-4" />
  </SMButton>
</SMTooltip>
```

### 15. SMAvatar

Main props: `src`, `initials`, `alt`, `size: 'sm' | 'md' | 'lg'`, `status: 'active' | 'inactive' | 'success' | 'warning' | 'danger'`

```tsx
<SMAvatar initials="MN" alt="Mudassar Naeem" size="md" status="active" />
```

### 16. SMEmptyState

Main props: `icon`, `heading`, `subMessage`, `action`

```tsx
<SMEmptyState
  heading="No incidents found"
  subMessage="Try adjusting your filters or create a new report."
  action={<SMButton>Report Incident</SMButton>}
/>
```

## New Utilities

### SMSkeleton

Main props: `className`, `rows`, `gap`

```tsx
<SMSkeleton rows={3} className="h-4 w-full rounded-lg" gap="gap-3" />
```

### SMToastProvider

Mount once near the app root. It renders the global toast stack powered by `useToastStore`.

```tsx
<Router>
  <SMToastProvider />
  <App />
</Router>
```

### useToast Hook

Use the hook for mutation feedback instead of inline alerts.

```tsx
const toast = useToast();

toast.success('Incident saved');
toast.error('Unable to save incident');
toast.warning('Training expires in 7 days');
toast.info('New report available');
```

## Guidance

- Prefer the barrel import from `src/components/ui` for primitives.
- Prefer semantic variants and sizes before adding custom class overrides.
- For icon-only buttons, always provide an `aria-label`.
- For dense mobile layouts, let text containers use `min-w-0` and `truncate` before introducing fixed widths.