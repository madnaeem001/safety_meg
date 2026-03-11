import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Command,
  Search,
  X,
  ArrowRight,
  Keyboard,
  Plus,
  FileText,
  AlertTriangle,
  Shield,
  Settings,
  Users,
  Calendar,
  BarChart3,
  Bell,
  Zap,
  Home,
  ChevronRight,
  Clock,
  Star,
  Hash,
  Layers,
  CheckSquare,
  Upload,
  Download,
  RefreshCw,
  Eye,
  Edit3,
  Trash2,
  Copy,
  Archive,
  Send
} from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'navigation' | 'actions' | 'create' | 'tools';
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  action: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
  onAction?: (actionId: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onAction
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentCommands, setRecentCommands] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('cp_recent_commands');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    // Navigation
    { id: 'nav-dashboard', title: 'Go to Dashboard', description: 'Main safety dashboard', icon: <Home className="w-4 h-4" />, category: 'navigation', shortcut: 'G D', action: () => onNavigate?.('/'), keywords: ['home', 'main'] },
    { id: 'nav-incidents', title: 'Go to Incidents', description: 'Incident reporting', icon: <AlertTriangle className="w-4 h-4" />, category: 'navigation', shortcut: 'G I', action: () => onNavigate?.('/safety-hub'), keywords: ['reports', 'injury'] },
    { id: 'nav-compliance', title: 'Go to Compliance', description: 'Compliance dashboard', icon: <Shield className="w-4 h-4" />, category: 'navigation', shortcut: 'G C', action: () => onNavigate?.('/safety-hub'), keywords: ['regulatory', 'audit'] },
    { id: 'nav-training', title: 'Go to Training', description: 'Training management', icon: <Users className="w-4 h-4" />, category: 'navigation', shortcut: 'G T', action: () => onNavigate?.('/training'), keywords: ['certification', 'courses'] },
    { id: 'nav-analytics', title: 'Go to Analytics', description: 'Safety analytics', icon: <BarChart3 className="w-4 h-4" />, category: 'navigation', shortcut: 'G A', action: () => onNavigate?.('/analytics'), keywords: ['reports', 'charts', 'data'] },
    { id: 'nav-settings', title: 'Go to Settings', description: 'Application settings', icon: <Settings className="w-4 h-4" />, category: 'navigation', shortcut: 'G S', action: () => onNavigate?.('/settings'), keywords: ['preferences', 'config'] },
    
    // Create Actions
    { id: 'create-incident', title: 'New Incident Report', description: 'Report a new incident', icon: <Plus className="w-4 h-4" />, category: 'create', shortcut: 'N I', action: () => onAction?.('create-incident'), keywords: ['add', 'report'] },
    { id: 'create-jsa', title: 'New JSA', description: 'Create job safety analysis', icon: <FileText className="w-4 h-4" />, category: 'create', shortcut: 'N J', action: () => onAction?.('create-jsa'), keywords: ['job', 'safety', 'analysis'] },
    { id: 'create-observation', title: 'New Safety Observation', description: 'Log a safety observation', icon: <Eye className="w-4 h-4" />, category: 'create', shortcut: 'N O', action: () => onAction?.('create-observation'), keywords: ['log', 'note'] },
    { id: 'create-inspection', title: 'New Inspection', description: 'Schedule an inspection', icon: <CheckSquare className="w-4 h-4" />, category: 'create', shortcut: 'N S', action: () => onAction?.('create-inspection'), keywords: ['schedule', 'audit'] },
    
    // Actions
    { id: 'action-sync', title: 'Sync Data', description: 'Synchronize offline data', icon: <RefreshCw className="w-4 h-4" />, category: 'actions', shortcut: '⌘ S', action: () => onAction?.('sync'), keywords: ['upload', 'save'] },
    { id: 'action-export', title: 'Export Report', description: 'Export data as PDF/CSV', icon: <Download className="w-4 h-4" />, category: 'actions', shortcut: '⌘ E', action: () => onAction?.('export'), keywords: ['download', 'pdf', 'csv'] },
    { id: 'action-notifications', title: 'View Notifications', description: 'Open notification center', icon: <Bell className="w-4 h-4" />, category: 'actions', shortcut: '⌘ N', action: () => onAction?.('notifications'), keywords: ['alerts', 'messages'] },
    
    // Tools
    { id: 'tool-search', title: 'Search Records', description: 'Search all records', icon: <Search className="w-4 h-4" />, category: 'tools', shortcut: '/', action: () => onAction?.('search'), keywords: ['find', 'query'] },
    { id: 'tool-calculator', title: 'Risk Calculator', description: 'Open risk assessment tool', icon: <Zap className="w-4 h-4" />, category: 'tools', action: () => onAction?.('calculator'), keywords: ['assess', 'evaluate'] },
    { id: 'tool-qr', title: 'Scan QR Code', description: 'Scan equipment QR code', icon: <Hash className="w-4 h-4" />, category: 'tools', action: () => onAction?.('scan-qr'), keywords: ['barcode', 'scan'] },
  ];

  const filteredCommands = search
    ? commands.filter(cmd => {
        const searchLower = search.toLowerCase();
        return (
          cmd.title.toLowerCase().includes(searchLower) ||
          cmd.description.toLowerCase().includes(searchLower) ||
          cmd.keywords?.some(k => k.toLowerCase().includes(searchLower))
        );
      })
    : commands;

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  const categoryLabels: Record<string, string> = {
    navigation: 'Navigation',
    create: 'Create',
    actions: 'Actions',
    tools: 'Tools'
  };

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setSearch('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [search]);

  const filteredCommandsRef = useRef(filteredCommands);
  filteredCommandsRef.current = filteredCommands;

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommandsRef.current.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter': {
        e.preventDefault();
        const cmd = filteredCommandsRef.current[selectedIndex];
        if (cmd) {
          setRecentCommands(prev => {
            const next = [cmd.id, ...prev.filter(id => id !== cmd.id)].slice(0, 5);
            try { localStorage.setItem('cp_recent_commands', JSON.stringify(next)); } catch { /* ignore */ }
            return next;
          });
          cmd.action();
          onClose();
        }
        break;
      }
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  }, [isOpen, selectedIndex, onClose]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const executeCommand = useCallback((cmd: CommandItem) => {
    setRecentCommands(prev => {
      const next = [cmd.id, ...prev.filter(id => id !== cmd.id)].slice(0, 5);
      try { localStorage.setItem('cp_recent_commands', JSON.stringify(next)); } catch { /* ignore */ }
      return next;
    });
    cmd.action();
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-start justify-center pt-[15vh] p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          transition={{ duration: 0.15 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Search Input */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700">
            <Command className="w-5 h-5 text-slate-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 bg-transparent text-white placeholder-slate-400 outline-none text-lg"
            />
            <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-400">
              ESC
            </kbd>
          </div>

          {/* Commands List */}
          <div className="max-h-[60vh] overflow-y-auto">
            {/* Recent commands — shown only when search bar is empty */}
            {!search && recentCommands.length > 0 && (
              <div>
                <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-800/50 flex items-center gap-1.5">
                  <Clock className="w-3 h-3" />
                  Recent
                </div>
                {recentCommands
                  .map(id => commands.find(c => c.id === id))
                  .filter((c): c is CommandItem => !!c)
                  .map((cmd, idx) => (
                    <motion.button
                      key={`recent-${cmd.id}`}
                      onClick={() => executeCommand(cmd)}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-800/50 border-l-2 border-transparent`}
                    >
                      <div className="p-2 rounded-lg bg-slate-800 text-slate-400">
                        {cmd.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate text-slate-300">{cmd.title}</p>
                        <p className="text-sm text-slate-500 truncate">{cmd.description}</p>
                      </div>
                      <Clock className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                    </motion.button>
                  ))
                }
              </div>
            )}

            {filteredCommands.length === 0 ? (
              <div className="p-8 text-center">
                <Search className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-slate-400">No commands found</p>
                <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
              </div>
            ) : (
              Object.entries(groupedCommands).map(([category, cmds]) => (
                <div key={category}>
                  <div className="px-4 py-2 text-xs font-medium text-slate-500 uppercase tracking-wider bg-slate-800/50">
                    {categoryLabels[category]}
                  </div>
                  {cmds.map((cmd, idx) => {
                    const globalIndex = filteredCommands.findIndex(c => c.id === cmd.id);
                    const isSelected = globalIndex === selectedIndex;
                    
                    return (
                      <motion.button
                        key={cmd.id}
                        onClick={() => executeCommand(cmd)}
                        className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                          isSelected ? 'bg-teal-600/20 border-l-2 border-teal-500' : 'hover:bg-slate-800/50 border-l-2 border-transparent'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-teal-600/30 text-teal-400' : 'bg-slate-800 text-slate-400'}`}>
                          {cmd.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium truncate ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                            {cmd.title}
                          </p>
                          <p className="text-sm text-slate-500 truncate">{cmd.description}</p>
                        </div>
                        {cmd.shortcut && (
                          <kbd className="px-2 py-1 bg-slate-800 border border-slate-600 rounded text-xs text-slate-400 flex-shrink-0">
                            {cmd.shortcut}
                          </kbd>
                        )}
                        {isSelected && (
                          <ArrowRight className="w-4 h-4 text-teal-400 flex-shrink-0" />
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded">↑↓</kbd>
                Navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded">↵</kbd>
                Select
              </span>
            </div>
            <span className="flex items-center gap-1">
              <Keyboard className="w-3 h-3" />
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded mx-1">⌘ K</kbd> or <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-600 rounded mx-1">ESC</kbd> to close
            </span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Quick Actions Bar Component
interface QuickActionsBarProps {
  actions?: QuickAction[];
  onAction?: (actionId: string) => void;
}

export const QuickActionsBar: React.FC<QuickActionsBarProps> = ({ actions, onAction }) => {
  const defaultActions: QuickAction[] = [
    { id: 'new-incident', label: 'New Incident', icon: <AlertTriangle className="w-4 h-4" />, color: 'from-red-500 to-rose-600', action: () => onAction?.('new-incident') },
    { id: 'new-jsa', label: 'New JSA', icon: <FileText className="w-4 h-4" />, color: 'from-blue-500 to-indigo-600', action: () => onAction?.('new-jsa') },
    { id: 'new-observation', label: 'Observation', icon: <Eye className="w-4 h-4" />, color: 'from-emerald-500 to-teal-600', action: () => onAction?.('new-observation') },
    { id: 'sync', label: 'Sync', icon: <RefreshCw className="w-4 h-4" />, color: 'from-purple-500 to-violet-600', action: () => onAction?.('sync') },
  ];

  const displayActions = actions || defaultActions;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-slate-900/95 backdrop-blur-lg border border-slate-700 rounded-2xl p-2 shadow-2xl z-40"
    >
      <div className="flex items-center gap-1">
        {displayActions.map((action) => (
          <motion.button
            key={action.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={action.action}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all hover:bg-slate-800"
          >
            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${action.color} text-white`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-white hidden sm:inline">{action.label}</span>
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
};

// Keyboard Shortcuts Hook
export const useKeyboardShortcuts = (shortcuts: Record<string, () => void>) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = [
        e.metaKey || e.ctrlKey ? '⌘' : '',
        e.shiftKey ? 'shift' : '',
        e.altKey ? 'alt' : '',
        e.key.toLowerCase()
      ].filter(Boolean).join('+');

      if (shortcuts[key]) {
        e.preventDefault();
        shortcuts[key]();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
};

// Batch Selection Hook
export interface BatchSelectionState<T> {
  selectedItems: Set<string>;
  selectItem: (id: string) => void;
  deselectItem: (id: string) => void;
  toggleItem: (id: string) => void;
  selectAll: (ids: string[]) => void;
  clearSelection: () => void;
  isSelected: (id: string) => boolean;
  selectedCount: number;
}

export const useBatchSelection = <T extends { id: string }>(): BatchSelectionState<T> => {
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const selectItem = useCallback((id: string) => {
    setSelectedItems(prev => new Set(prev).add(id));
  }, []);

  const deselectItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toggleItem = useCallback((id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback((ids: string[]) => {
    setSelectedItems(new Set(ids));
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedItems(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedItems.has(id), [selectedItems]);

  return {
    selectedItems,
    selectItem,
    deselectItem,
    toggleItem,
    selectAll,
    clearSelection,
    isSelected,
    selectedCount: selectedItems.size
  };
};

// Batch Actions Toolbar
interface BatchActionsToolbarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onAction: (action: string) => void;
}

export const BatchActionsToolbar: React.FC<BatchActionsToolbarProps> = ({
  selectedCount,
  onClearSelection,
  onAction
}) => {
  if (selectedCount === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="fixed top-4 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 rounded-xl p-2 shadow-2xl z-50 flex items-center gap-2"
    >
      <div className="flex items-center gap-2 px-3 py-1.5 bg-teal-600/20 rounded-lg">
        <CheckSquare className="w-4 h-4 text-teal-400" />
        <span className="text-sm font-medium text-teal-400">{selectedCount} selected</span>
      </div>
      
      <div className="w-px h-6 bg-slate-700" />
      
      <div className="flex items-center gap-1">
        <button
          onClick={() => onAction('export')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          title="Export selected"
        >
          <Download className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction('archive')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          title="Archive selected"
        >
          <Archive className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction('send')}
          className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          title="Send selected"
        >
          <Send className="w-4 h-4" />
        </button>
        <button
          onClick={() => onAction('delete')}
          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-slate-400 hover:text-red-400"
          title="Delete selected"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="w-px h-6 bg-slate-700" />
      
      <button
        onClick={onClearSelection}
        className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
        title="Clear selection"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

export default CommandPalette;
