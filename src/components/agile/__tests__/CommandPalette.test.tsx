import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, renderHook, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  CommandPalette,
  QuickActionsBar,
  useKeyboardShortcuts,
  useBatchSelection,
  BatchActionsToolbar,
} from '../CommandPalette';

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock('framer-motion', async () => {
  const actual = await vi.importActual<typeof import('framer-motion')>('framer-motion');
  return {
    ...actual,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    motion: {
      div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { children?: React.ReactNode }) => (
        <div {...props}>{children}</div>
      ),
      button: ({
        children,
        onClick,
        className,
      }: React.ButtonHTMLAttributes<HTMLButtonElement> & { children?: React.ReactNode }) => (
        <button onClick={onClick} className={className}>{children}</button>
      ),
    },
  };
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onNavigate: vi.fn(),
  onAction: vi.fn(),
};

// ─── CommandPalette ───────────────────────────────────────────────────────────

describe('CommandPalette', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('renders nothing when isOpen is false', () => {
    render(<CommandPalette {...defaultProps} isOpen={false} />);
    expect(screen.queryByPlaceholderText(/type a command/i)).toBeNull();
  });

  it('renders search input when isOpen is true', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByPlaceholderText(/type a command/i)).toBeInTheDocument();
  });

  it('renders all command categories', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.getByText('Navigation')).toBeInTheDocument();
    expect(screen.getByText('Create')).toBeInTheDocument();
    expect(screen.getByText('Actions')).toBeInTheDocument();
    expect(screen.getByText('Tools')).toBeInTheDocument();
  });

  it('filters commands by search text', async () => {
    const user = userEvent.setup();
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type a command/i);
    await user.type(input, 'incident');
    expect(screen.getByText('Go to Incidents')).toBeInTheDocument();
    expect(screen.queryByText('Go to Analytics')).toBeNull();
  });

  it('shows "No commands found" when search matches nothing', async () => {
    const user = userEvent.setup();
    render(<CommandPalette {...defaultProps} />);
    const input = screen.getByPlaceholderText(/type a command/i);
    await user.type(input, 'xyznonexistent1234');
    expect(screen.getByText(/no commands found/i)).toBeInTheDocument();
  });

  it('calls onClose when Escape key is pressed', () => {
    render(<CommandPalette {...defaultProps} />);
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onNavigate when a navigation command is clicked', async () => {
    const user = userEvent.setup();
    render(<CommandPalette {...defaultProps} />);
    await user.click(screen.getByText('Go to Dashboard'));
    expect(defaultProps.onNavigate).toHaveBeenCalledWith('/');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onAction when an action command is clicked', async () => {
    const user = userEvent.setup();
    render(<CommandPalette {...defaultProps} />);
    const syncBtn = screen.getByText('Sync Data');
    await user.click(syncBtn);
    expect(defaultProps.onAction).toHaveBeenCalledWith('sync');
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('persists executed command id to localStorage', async () => {
    const user = userEvent.setup();
    render(<CommandPalette {...defaultProps} />);
    await user.click(screen.getByText('Go to Dashboard'));
    const stored = JSON.parse(localStorage.getItem('cp_recent_commands') ?? '[]');
    expect(stored).toContain('nav-dashboard');
  });

  it('loads recent commands from localStorage on mount', () => {
    localStorage.setItem('cp_recent_commands', JSON.stringify(['nav-dashboard']));
    render(<CommandPalette {...defaultProps} />);
    // "Recent" section header should appear because recentCommands has data
    expect(screen.getByText('Recent')).toBeInTheDocument();
  });

  it('does not show Recent section when no recent commands exist', () => {
    render(<CommandPalette {...defaultProps} />);
    expect(screen.queryByText('Recent')).toBeNull();
  });

  it('stores at most 5 recent commands', async () => {
    const user = userEvent.setup();
    const commandLabels = [
      'Go to Dashboard',
      'Go to Incidents',
      'Go to Compliance',
      'Go to Training',
      'Go to Analytics',
      'Go to Settings',
    ];
    for (const label of commandLabels) {
      const { unmount } = render(<CommandPalette {...defaultProps} />);
      await user.click(screen.getByText(label));
      unmount();
    }
    const stored: string[] = JSON.parse(localStorage.getItem('cp_recent_commands') ?? '[]');
    expect(stored.length).toBeLessThanOrEqual(5);
  });

  it('keyboard ArrowDown increments selected item, Enter executes it', async () => {
    const user = userEvent.setup();
    render(<CommandPalette {...defaultProps} />);
    // Navigate down once (selects index 1)
    fireEvent.keyDown(window, { key: 'ArrowDown' });
    // Press Enter to execute whichever command is at index 1
    fireEvent.keyDown(window, { key: 'Enter' });
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    const { container } = render(<CommandPalette {...defaultProps} />);
    // The backdrop is the outermost div with the fixed inset styling
    const backdrop = container.firstChild as HTMLElement;
    await user.click(backdrop);
    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});

// ─── QuickActionsBar ─────────────────────────────────────────────────────────

describe('QuickActionsBar', () => {
  it('renders default quick action buttons', () => {
    render(<QuickActionsBar />);
    expect(screen.getByText('New Incident')).toBeInTheDocument();
    expect(screen.getByText('New JSA')).toBeInTheDocument();
    expect(screen.getByText('Observation')).toBeInTheDocument();
    expect(screen.getByText('Sync')).toBeInTheDocument();
  });

  it('renders custom actions when provided', () => {
    const customActions = [
      {
        id: 'custom-1',
        label: 'Custom Action',
        icon: <span>icon</span>,
        color: 'from-blue-500 to-indigo-600',
        action: vi.fn(),
      },
    ];
    render(<QuickActionsBar actions={customActions} />);
    expect(screen.getByText('Custom Action')).toBeInTheDocument();
  });

  it('calls onAction with correct id when default action clicked', async () => {
    const onAction = vi.fn();
    const user = userEvent.setup();
    render(<QuickActionsBar onAction={onAction} />);
    await user.click(screen.getByText('Sync'));
    expect(onAction).toHaveBeenCalledWith('sync');
  });
});

// ─── useKeyboardShortcuts ────────────────────────────────────────────────────
// Note: metaKey/ctrlKey maps to '⌘' in the hook internals.

describe('useKeyboardShortcuts', () => {
  it('calls the correct handler when matching key combo is pressed', () => {
    const handler = vi.fn();
    // The hook formats ctrl/meta as '⌘', so register '⌘+s'
    renderHook(() => useKeyboardShortcuts({ '⌘+s': handler }));
    fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('calls handler for meta key variant too', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ '⌘+k': handler }));
    fireEvent.keyDown(window, { key: 'k', metaKey: true });
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('does not call handler for non-matching key', () => {
    const handler = vi.fn();
    renderHook(() => useKeyboardShortcuts({ '⌘+s': handler }));
    fireEvent.keyDown(window, { key: 'x', ctrlKey: true });
    expect(handler).not.toHaveBeenCalled();
  });
});

// ─── useBatchSelection ───────────────────────────────────────────────────────
// Hook API: selectedItems: Set<string>, toggleItem(id: string), selectAll(ids: string[]), etc.

describe('useBatchSelection', () => {
  it('starts with empty selection', () => {
    const { result } = renderHook(() => useBatchSelection<{ id: string }>());
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.selectedItems.size).toBe(0);
  });

  it('toggles item selection by id', () => {
    const { result } = renderHook(() => useBatchSelection<{ id: string }>());
    act(() => result.current.toggleItem('item-1'));
    expect(result.current.selectedItems.has('item-1')).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    act(() => result.current.toggleItem('item-1'));
    expect(result.current.selectedItems.has('item-1')).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it('selectItem and deselectItem work independently', () => {
    const { result } = renderHook(() => useBatchSelection<{ id: string }>());
    act(() => result.current.selectItem('a'));
    act(() => result.current.selectItem('b'));
    expect(result.current.selectedCount).toBe(2);
    act(() => result.current.deselectItem('a'));
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.isSelected('b')).toBe(true);
  });

  it('selectAll fills selection from id array', () => {
    const { result } = renderHook(() => useBatchSelection<{ id: string }>());
    act(() => result.current.selectAll(['a', 'b', 'c']));
    expect(result.current.selectedCount).toBe(3);
  });

  it('clearSelection empties the selection', () => {
    const { result } = renderHook(() => useBatchSelection<{ id: string }>());
    act(() => result.current.toggleItem('item-1'));
    act(() => result.current.clearSelection());
    expect(result.current.selectedCount).toBe(0);
  });
});

// ─── BatchActionsToolbar ─────────────────────────────────────────────────────
// Props: selectedCount, onClearSelection, onAction(action: string)

describe('BatchActionsToolbar', () => {
  const onClearSelection = vi.fn();
  const onAction = vi.fn();
  const props = { selectedCount: 3, onClearSelection, onAction };

  beforeEach(() => vi.clearAllMocks());

  it('renders nothing when selectedCount is 0', () => {
    const { container } = render(<BatchActionsToolbar selectedCount={0} onClearSelection={onClearSelection} onAction={onAction} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders selected count when > 0', () => {
    render(<BatchActionsToolbar {...props} />);
    expect(screen.getByText(/3 selected/i)).toBeInTheDocument();
  });

  it('calls onClearSelection when X button is clicked', async () => {
    const user = userEvent.setup();
    render(<BatchActionsToolbar {...props} />);
    // The clear button has title="Clear selection"
    const clearBtn = screen.getByTitle(/clear selection/i);
    await user.click(clearBtn);
    expect(onClearSelection).toHaveBeenCalledTimes(1);
  });

  it('calls onAction("export") when export button is clicked', async () => {
    const user = userEvent.setup();
    render(<BatchActionsToolbar {...props} />);
    await user.click(screen.getByTitle(/export selected/i));
    expect(onAction).toHaveBeenCalledWith('export');
  });

  it('calls onAction("delete") when delete button is clicked', async () => {
    const user = userEvent.setup();
    render(<BatchActionsToolbar {...props} />);
    await user.click(screen.getByTitle(/delete selected/i));
    expect(onAction).toHaveBeenCalledWith('delete');
  });

  it('calls onAction("archive") when archive button is clicked', async () => {
    const user = userEvent.setup();
    render(<BatchActionsToolbar {...props} />);
    await user.click(screen.getByTitle(/archive selected/i));
    expect(onAction).toHaveBeenCalledWith('archive');
  });
});
