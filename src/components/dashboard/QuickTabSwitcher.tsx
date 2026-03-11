import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence, useMotionValue, PanInfo, Reorder } from 'framer-motion';
import { 
  Shield, Leaf, ClipboardCheck, Target, FileText, Brain, Bell, Settings,
  Star, Plus, X, GripVertical, ChevronUp, ChevronDown, 
  Keyboard, ArrowLeft, ArrowRight, Search, History, Clock,
  Pin, Palette, Check, Sparkles, Sun, Moon, Zap, Edit3, Award
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

// Tab Animation Effect Types - Extended with more animations
export type TabAnimationType = 'none' | 'bounce' | 'pulse' | 'glow' | 'shake' | 'flip' | 'wave' | 'morph' | 'ripple' | 'slide' | 'rotate' | 'rainbow';

// Badge Customization Types with Notifications
export interface BadgeConfig {
  tabId: MainSectionType;
  count: number;
  color: 'red' | 'amber' | 'green' | 'blue' | 'purple';
  pulse: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  notifyOnChange?: boolean;
}

// Theme Schedule Types
export interface ThemeSchedule {
  id: string;
  name: string;
  themeId: ColorThemeType;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  days: number[]; // 0-6 (Sunday-Saturday)
  enabled: boolean;
}

// Badge Notification Event
export interface BadgeNotificationEvent {
  tabId: MainSectionType;
  previousCount: number;
  newCount: number;
  timestamp: number;
}

// Tab animation variants - Extended with 12 total animations
const TAB_ANIMATIONS = {
  none: {},
  bounce: {
    initial: { y: 0 },
    animate: { y: [0, -8, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 2 } }
  },
  pulse: {
    initial: { scale: 1 },
    animate: { scale: [1, 1.05, 1], transition: { duration: 1, repeat: Infinity } }
  },
  glow: {
    initial: { boxShadow: '0 0 0 rgba(59, 130, 246, 0)' },
    animate: { 
      boxShadow: ['0 0 0 rgba(59, 130, 246, 0)', '0 0 20px rgba(59, 130, 246, 0.5)', '0 0 0 rgba(59, 130, 246, 0)'],
      transition: { duration: 2, repeat: Infinity }
    }
  },
  shake: {
    initial: { rotate: 0 },
    animate: { rotate: [-2, 2, -2, 2, 0], transition: { duration: 0.5, repeat: Infinity, repeatDelay: 3 } }
  },
  flip: {
    initial: { rotateY: 0 },
    animate: { rotateY: [0, 180, 360], transition: { duration: 1, repeat: Infinity, repeatDelay: 4 } }
  },
  wave: {
    initial: { y: 0 },
    animate: { y: [0, -4, 0, 4, 0], transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } }
  },
  morph: {
    initial: { borderRadius: '1rem' },
    animate: { 
      borderRadius: ['1rem', '1.5rem', '2rem', '1.5rem', '1rem'],
      transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } 
    }
  },
  ripple: {
    initial: { boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
    animate: { 
      boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0.4)', '0 0 0 15px rgba(59, 130, 246, 0)', '0 0 0 0 rgba(59, 130, 246, 0)'],
      transition: { duration: 1.5, repeat: Infinity, repeatDelay: 1 }
    }
  },
  slide: {
    initial: { x: 0 },
    animate: { x: [-3, 3, -3], transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' } }
  },
  rotate: {
    initial: { rotate: 0 },
    animate: { rotate: [0, 5, 0, -5, 0], transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }
  },
  rainbow: {
    initial: { filter: 'hue-rotate(0deg)' },
    animate: { 
      filter: ['hue-rotate(0deg)', 'hue-rotate(180deg)', 'hue-rotate(360deg)'],
      transition: { duration: 4, repeat: Infinity, ease: 'linear' } 
    }
  }
};

// Badge color mapping
const BADGE_COLORS = {
  red: 'bg-red-500',
  amber: 'bg-amber-500',
  green: 'bg-green-500',
  blue: 'bg-blue-500',
  purple: 'bg-purple-500'
};

// Types
export type MainSectionType = 'safety' | 'environmental' | 'quality' | 'project' | 'compliance-hub' | 'ai-analytics' | 'alerts' | 'tools';

interface TabConfig {
  id: MainSectionType;
  label: string;
  icon: LucideIcon;
  color: string;
  bg: string;
  shortcut: string;
  badge?: number;
}

// Color Theme Types
export type ColorThemeType = 'default' | 'ocean' | 'sunset' | 'forest' | 'midnight' | 'candy';

interface ColorTheme {
  id: ColorThemeType;
  name: string;
  colors: Record<MainSectionType, { color: string; bg: string }>;
  preview: string[];
}

// Color Theme Configurations
const COLOR_THEMES: ColorTheme[] = [
  {
    id: 'default',
    name: 'Default',
    preview: ['#ef4444', '#10b981', '#3b82f6', '#6366f1'],
    colors: {
      'safety': { color: 'text-red-600', bg: 'from-red-500 to-red-600' },
      'environmental': { color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-600' },
      'quality': { color: 'text-blue-600', bg: 'from-blue-500 to-blue-600' },
      'project': { color: 'text-indigo-600', bg: 'from-indigo-500 to-indigo-600' },
      'compliance-hub': { color: 'text-cyan-600', bg: 'from-cyan-500 to-cyan-600' },
      'ai-analytics': { color: 'text-purple-600', bg: 'from-purple-500 to-purple-600' },
      'alerts': { color: 'text-amber-600', bg: 'from-amber-500 to-amber-600' },
      'tools': { color: 'text-slate-600', bg: 'from-slate-500 to-slate-600' },
    }
  },
  {
    id: 'ocean',
    name: 'Ocean',
    preview: ['#0ea5e9', '#06b6d4', '#14b8a6', '#0891b2'],
    colors: {
      'safety': { color: 'text-sky-600', bg: 'from-sky-500 to-sky-600' },
      'environmental': { color: 'text-teal-600', bg: 'from-teal-500 to-teal-600' },
      'quality': { color: 'text-cyan-600', bg: 'from-cyan-500 to-cyan-600' },
      'project': { color: 'text-blue-600', bg: 'from-blue-500 to-blue-600' },
      'compliance-hub': { color: 'text-indigo-600', bg: 'from-indigo-500 to-indigo-600' },
      'ai-analytics': { color: 'text-violet-600', bg: 'from-violet-500 to-violet-600' },
      'alerts': { color: 'text-sky-500', bg: 'from-sky-400 to-sky-500' },
      'tools': { color: 'text-slate-600', bg: 'from-slate-500 to-slate-600' },
    }
  },
  {
    id: 'sunset',
    name: 'Sunset',
    preview: ['#f97316', '#f59e0b', '#ef4444', '#ec4899'],
    colors: {
      'safety': { color: 'text-orange-600', bg: 'from-orange-500 to-orange-600' },
      'environmental': { color: 'text-amber-600', bg: 'from-amber-500 to-amber-600' },
      'quality': { color: 'text-rose-600', bg: 'from-rose-500 to-rose-600' },
      'project': { color: 'text-pink-600', bg: 'from-pink-500 to-pink-600' },
      'compliance-hub': { color: 'text-fuchsia-600', bg: 'from-fuchsia-500 to-fuchsia-600' },
      'ai-analytics': { color: 'text-red-600', bg: 'from-red-500 to-red-600' },
      'alerts': { color: 'text-yellow-600', bg: 'from-yellow-500 to-yellow-600' },
      'tools': { color: 'text-stone-600', bg: 'from-stone-500 to-stone-600' },
    }
  },
  {
    id: 'forest',
    name: 'Forest',
    preview: ['#22c55e', '#16a34a', '#84cc16', '#4ade80'],
    colors: {
      'safety': { color: 'text-green-600', bg: 'from-green-500 to-green-600' },
      'environmental': { color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-600' },
      'quality': { color: 'text-lime-600', bg: 'from-lime-500 to-lime-600' },
      'project': { color: 'text-teal-600', bg: 'from-teal-500 to-teal-600' },
      'compliance-hub': { color: 'text-cyan-600', bg: 'from-cyan-500 to-cyan-600' },
      'ai-analytics': { color: 'text-green-700', bg: 'from-green-600 to-green-700' },
      'alerts': { color: 'text-yellow-600', bg: 'from-yellow-500 to-yellow-600' },
      'tools': { color: 'text-stone-600', bg: 'from-stone-500 to-stone-600' },
    }
  },
  {
    id: 'midnight',
    name: 'Midnight',
    preview: ['#6366f1', '#8b5cf6', '#a855f7', '#7c3aed'],
    colors: {
      'safety': { color: 'text-indigo-600', bg: 'from-indigo-500 to-indigo-600' },
      'environmental': { color: 'text-violet-600', bg: 'from-violet-500 to-violet-600' },
      'quality': { color: 'text-purple-600', bg: 'from-purple-500 to-purple-600' },
      'project': { color: 'text-fuchsia-600', bg: 'from-fuchsia-500 to-fuchsia-600' },
      'compliance-hub': { color: 'text-blue-600', bg: 'from-blue-500 to-blue-600' },
      'ai-analytics': { color: 'text-pink-600', bg: 'from-pink-500 to-pink-600' },
      'alerts': { color: 'text-rose-600', bg: 'from-rose-500 to-rose-600' },
      'tools': { color: 'text-slate-600', bg: 'from-slate-500 to-slate-600' },
    }
  },
  {
    id: 'candy',
    name: 'Candy',
    preview: ['#ec4899', '#f472b6', '#fb7185', '#f43f5e'],
    colors: {
      'safety': { color: 'text-pink-600', bg: 'from-pink-500 to-pink-600' },
      'environmental': { color: 'text-rose-600', bg: 'from-rose-400 to-rose-500' },
      'quality': { color: 'text-fuchsia-600', bg: 'from-fuchsia-500 to-fuchsia-600' },
      'project': { color: 'text-violet-600', bg: 'from-violet-500 to-violet-600' },
      'compliance-hub': { color: 'text-purple-600', bg: 'from-purple-400 to-purple-500' },
      'ai-analytics': { color: 'text-indigo-600', bg: 'from-indigo-400 to-indigo-500' },
      'alerts': { color: 'text-red-500', bg: 'from-red-400 to-red-500' },
      'tools': { color: 'text-gray-600', bg: 'from-gray-500 to-gray-600' },
    }
  }
];

interface QuickTabSwitcherProps {
  currentSection: MainSectionType;
  onSectionChange: (section: MainSectionType) => void;
  alertBadge?: number;
}

// Tab configurations
const TAB_CONFIGS: TabConfig[] = [
  { id: 'safety', label: 'Safety', icon: Shield, color: 'text-red-600', bg: 'from-red-500 to-red-600', shortcut: '1' },
  { id: 'environmental', label: 'Environmental', icon: Leaf, color: 'text-emerald-600', bg: 'from-emerald-500 to-emerald-600', shortcut: '2' },
  { id: 'quality', label: 'Quality', icon: ClipboardCheck, color: 'text-blue-600', bg: 'from-blue-500 to-blue-600', shortcut: '3' },
  { id: 'project', label: 'Projects', icon: Target, color: 'text-indigo-600', bg: 'from-indigo-500 to-indigo-600', shortcut: '4' },
  { id: 'compliance-hub', label: 'Compliance', icon: FileText, color: 'text-cyan-600', bg: 'from-cyan-500 to-cyan-600', shortcut: '5' },
  { id: 'ai-analytics', label: 'AI & Analytics', icon: Brain, color: 'text-purple-600', bg: 'from-purple-500 to-purple-600', shortcut: '6' },
  { id: 'alerts', label: 'Alerts', icon: Bell, color: 'text-amber-600', bg: 'from-amber-500 to-amber-600', shortcut: '7' },
  { id: 'tools', label: 'Tools', icon: Settings, color: 'text-slate-600', bg: 'from-slate-500 to-slate-600', shortcut: '8' },
];

// Keyboard shortcut hook
export const useTabKeyboardShortcuts = (
  onSectionChange: (section: MainSectionType) => void,
  currentSection: MainSectionType
) => {
  const [showShortcutHint, setShowShortcutHint] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + number (1-8)
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && !e.altKey) {
        const key = e.key;
        const numKey = parseInt(key);
        
        if (numKey >= 1 && numKey <= 8) {
          e.preventDefault();
          const section = TAB_CONFIGS[numKey - 1].id;
          onSectionChange(section);
          return;
        }
      }
      
      // Arrow keys for tab navigation (when holding Alt)
      if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        e.preventDefault();
        const currentIndex = TAB_CONFIGS.findIndex(t => t.id === currentSection);
        let newIndex: number;
        
        if (e.key === 'ArrowLeft') {
          newIndex = currentIndex === 0 ? TAB_CONFIGS.length - 1 : currentIndex - 1;
        } else {
          newIndex = currentIndex === TAB_CONFIGS.length - 1 ? 0 : currentIndex + 1;
        }
        
        onSectionChange(TAB_CONFIGS[newIndex].id);
      }

      // Show shortcut hints when holding Cmd/Ctrl
      if (e.key === 'Meta' || e.key === 'Control') {
        setShowShortcutHint(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Meta' || e.key === 'Control') {
        setShowShortcutHint(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [currentSection, onSectionChange]);

  return { showShortcutHint };
};

// Recent Tabs History Hook
export const useRecentTabs = (currentSection: MainSectionType) => {
  const [recentTabs, setRecentTabs] = useState<{ id: MainSectionType; timestamp: number }[]>(() => {
    const saved = localStorage.getItem('safetyHub_recentTabs');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    setRecentTabs(prev => {
      // Remove current section if exists, add to front
      const filtered = prev.filter(t => t.id !== currentSection);
      const updated = [{ id: currentSection, timestamp: Date.now() }, ...filtered].slice(0, 10);
      localStorage.setItem('safetyHub_recentTabs', JSON.stringify(updated));
      return updated;
    });
  }, [currentSection]);

  const getRecentTabsExcludingCurrent = useCallback(() => {
    return recentTabs.filter(t => t.id !== currentSection).slice(0, 5);
  }, [recentTabs, currentSection]);

  return { recentTabs, getRecentTabsExcludingCurrent };
};

// Section Search Filter Hook
export const useSectionSearch = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const filteredTabs = useMemo(() => {
    if (!searchQuery.trim()) return TAB_CONFIGS;
    const query = searchQuery.toLowerCase();
    return TAB_CONFIGS.filter(tab => 
      tab.label.toLowerCase().includes(query) ||
      tab.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const clearSearch = useCallback(() => {
    setSearchQuery('');
    setIsSearchOpen(false);
  }, []);

  return { searchQuery, setSearchQuery, filteredTabs, isSearchOpen, setIsSearchOpen, clearSearch };
};

// Swipe gesture hook for mobile
export const useSwipeNavigation = (
  onSectionChange: (section: MainSectionType) => void,
  currentSection: MainSectionType
) => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);

  const handleSwipe = useCallback((direction: 'left' | 'right') => {
    const currentIndex = TAB_CONFIGS.findIndex(t => t.id === currentSection);
    let newIndex: number;

    if (direction === 'left') {
      newIndex = currentIndex === TAB_CONFIGS.length - 1 ? 0 : currentIndex + 1;
    } else {
      newIndex = currentIndex === 0 ? TAB_CONFIGS.length - 1 : currentIndex - 1;
    }

    setSwipeDirection(direction);
    onSectionChange(TAB_CONFIGS[newIndex].id);
    
    setTimeout(() => setSwipeDirection(null), 300);
  }, [currentSection, onSectionChange]);

  return { handleSwipe, swipeDirection };
};

// Enhanced Tab Bar Component with Premium Design + Search
export const EnhancedTabBar: React.FC<QuickTabSwitcherProps & { 
  showShortcuts?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isSearchOpen?: boolean;
  onSearchToggle?: () => void;
  filteredTabs?: TabConfig[];
}> = ({
  currentSection,
  onSectionChange,
  alertBadge,
  showShortcuts = false,
  searchQuery = '',
  onSearchChange,
  isSearchOpen = false,
  onSearchToggle,
  filteredTabs
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Use filtered tabs if provided, otherwise use all tabs
  const displayTabs = filteredTabs || TAB_CONFIGS;

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    return () => container?.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {/* Search Bar */}
      <div className="flex items-center gap-2 mb-3">
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 200, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="relative"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder="Search sections..."
                className="w-full pl-9 pr-8 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              />
              {searchQuery && (
                <button 
                  onClick={() => onSearchChange?.('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-200 rounded-full"
                >
                  <X className="w-3 h-3 text-surface-400" />
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onSearchToggle}
          className={`p-2 rounded-xl transition-all ${
            isSearchOpen ? 'bg-brand-100 text-brand-600' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
          }`}
        >
          <Search className="w-4 h-4" />
        </button>
      </div>

      {/* No results message */}
      {searchQuery && displayTabs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4 text-surface-500 text-sm"
        >
          No sections found for "{searchQuery}"
        </motion.div>
      )}

      {/* Scroll Indicators */}
      <AnimatePresence>
        {canScrollLeft && !searchQuery && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-surface-600" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canScrollRight && !searchQuery && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
          >
            <ArrowRight className="w-4 h-4 text-surface-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tab Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-2 pb-3 no-scrollbar scroll-smooth px-1"
      >
        {displayTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;
          const badge = tab.id === 'alerts' ? alertBadge : undefined;

          return (
            <motion.button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              layout
              className={`relative flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? `bg-gradient-to-r ${tab.bg} text-white shadow-lg shadow-${tab.color.replace('text-', '')}/30` 
                  : 'bg-white text-surface-600 border border-surface-100 hover:border-surface-200 hover:bg-surface-50 hover:shadow-md'
              }`}
            >
              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlow"
                  className="absolute inset-0 rounded-2xl bg-white/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <Icon className={`w-4.5 h-4.5 relative z-10 ${isActive ? 'text-white' : tab.color}`} />
              <span className="relative z-10">{tab.label}</span>

              {/* Keyboard shortcut hint */}
              {showShortcuts && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/30 text-white' : 'bg-surface-100 text-surface-500'
                  }`}
                >
                  ⌘{tab.shortcut}
                </motion.span>
              )}

              {/* Badge */}
              {badge && badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Recent Tabs Panel Component
export const RecentTabsPanel: React.FC<{
  recentTabs: { id: MainSectionType; timestamp: number }[];
  currentSection: MainSectionType;
  onSelect: (tabId: MainSectionType) => void;
}> = ({ recentTabs, currentSection, onSelect }) => {
  const filteredRecent = recentTabs.filter(t => t.id !== currentSection).slice(0, 5);

  if (filteredRecent.length === 0) return null;

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return 'Yesterday';
  };

  return (
    <div className="bg-surface-50 rounded-2xl p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <History className="w-4 h-4 text-surface-400" />
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Recent</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {filteredRecent.map(({ id, timestamp }) => {
          const tab = TAB_CONFIGS.find(t => t.id === id);
          if (!tab) return null;
          const Icon = tab.icon;

          return (
            <motion.button
              key={id}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSelect(id)}
              className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-surface-200 hover:border-surface-300 transition-all group"
            >
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${tab.bg} flex items-center justify-center`}>
                <Icon className="w-3 h-3 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-medium text-surface-700">{tab.label}</p>
                <p className="text-[10px] text-surface-400 flex items-center gap-1">
                  <Clock className="w-2.5 h-2.5" />
                  {formatTime(timestamp)}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Mobile Bottom Sheet Navigation
export const MobileTabSheet: React.FC<QuickTabSwitcherProps & { isOpen: boolean; onClose: () => void }> = ({
  currentSection,
  onSectionChange,
  alertBadge,
  isOpen,
  onClose
}) => {
  const [favorites, setFavorites] = useState<MainSectionType[]>(() => {
    const saved = localStorage.getItem('safetyHub_favoriteTabs');
    return saved ? JSON.parse(saved) : ['safety', 'alerts', 'ai-analytics'];
  });

  const toggleFavorite = (tabId: MainSectionType) => {
    setFavorites(prev => {
      const newFavorites = prev.includes(tabId)
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId];
      localStorage.setItem('safetyHub_favoriteTabs', JSON.stringify(newFavorites));
      return newFavorites;
    });
  };

  const handleSelect = (tabId: MainSectionType) => {
    onSectionChange(tabId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Bottom Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-white rounded-t-[2rem] z-50 max-h-[80vh] overflow-hidden"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1.5 bg-surface-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-6 pb-4 border-b border-surface-100">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold text-surface-900">Quick Navigation</h3>
                <button onClick={onClose} className="p-2 hover:bg-surface-100 rounded-xl transition-colors">
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              <p className="text-sm text-surface-500 mt-1">Tap to switch sections • Star to add to favorites</p>
            </div>

            {/* Favorites Section */}
            {favorites.length > 0 && (
              <div className="px-6 py-4 border-b border-surface-100 bg-gradient-to-r from-amber-50 to-orange-50">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-amber-700">Favorites</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {favorites.map(tabId => {
                    const tab = TAB_CONFIGS.find(t => t.id === tabId);
                    if (!tab) return null;
                    const Icon = tab.icon;
                    const isActive = currentSection === tabId;

                    return (
                      <motion.button
                        key={tabId}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleSelect(tabId)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                          isActive
                            ? `bg-gradient-to-r ${tab.bg} text-white shadow-md`
                            : 'bg-white text-surface-700 border border-surface-200 hover:border-surface-300'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* All Sections */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              <p className="text-xs font-bold text-surface-400 uppercase tracking-wider mb-3">All Sections</p>
              <div className="grid grid-cols-2 gap-3">
                {TAB_CONFIGS.map(tab => {
                  const Icon = tab.icon;
                  const isActive = currentSection === tab.id;
                  const isFavorite = favorites.includes(tab.id);
                  const badge = tab.id === 'alerts' ? alertBadge : undefined;

                  return (
                    <motion.div
                      key={tab.id}
                      whileTap={{ scale: 0.97 }}
                      className={`relative flex items-center gap-3 p-4 rounded-2xl transition-all ${
                        isActive
                          ? `bg-gradient-to-br ${tab.bg} text-white shadow-lg`
                          : 'bg-surface-50 hover:bg-surface-100 text-surface-700'
                      }`}
                    >
                      <button
                        onClick={() => handleSelect(tab.id)}
                        className="flex-1 flex items-center gap-3"
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-white/20' : tab.bg.replace('from-', 'bg-').split(' ')[0] + '/10'
                        }`}>
                          <Icon className={`w-5 h-5 ${isActive ? 'text-white' : tab.color}`} />
                        </div>
                        <div className="text-left">
                          <p className={`font-semibold ${isActive ? 'text-white' : 'text-surface-800'}`}>{tab.label}</p>
                          <p className={`text-xs ${isActive ? 'text-white/70' : 'text-surface-500'}`}>⌘{tab.shortcut}</p>
                        </div>
                      </button>

                      {/* Favorite toggle */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(tab.id);
                        }}
                        className={`p-1.5 rounded-lg transition-all ${
                          isFavorite 
                            ? isActive ? 'bg-white/20' : 'bg-amber-100' 
                            : isActive ? 'bg-white/10 hover:bg-white/20' : 'hover:bg-surface-200'
                        }`}
                      >
                        <Star className={`w-4 h-4 ${
                          isFavorite 
                            ? 'text-amber-500 fill-amber-500' 
                            : isActive ? 'text-white/60' : 'text-surface-400'
                        }`} />
                      </button>

                      {/* Badge */}
                      {badge && badge > 0 && (
                        <span className="absolute top-2 right-2 min-w-5 h-5 px-1.5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                          {badge > 99 ? '99+' : badge}
                        </span>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer - Keyboard Shortcut Info */}
            <div className="px-6 py-4 border-t border-surface-100 bg-surface-50">
              <div className="flex items-center justify-center gap-2 text-xs text-surface-500">
                <Keyboard className="w-3.5 h-3.5" />
                <span>Desktop: Press <kbd className="px-1.5 py-0.5 bg-white rounded border border-surface-200 font-mono">⌘</kbd> + <kbd className="px-1.5 py-0.5 bg-white rounded border border-surface-200 font-mono">1-8</kbd> to quick switch</span>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

// Swipeable Tab Container for Mobile
export const SwipeableTabContainer: React.FC<{
  children: React.ReactNode;
  currentSection: MainSectionType;
  onSectionChange: (section: MainSectionType) => void;
}> = ({ children, currentSection, onSectionChange }) => {
  const x = useMotionValue(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleDragEnd = (event: any, info: PanInfo) => {
    setIsDragging(false);
    const threshold = 100;
    const velocity = info.velocity.x;
    const offset = info.offset.x;

    if (Math.abs(offset) > threshold || Math.abs(velocity) > 500) {
      const currentIndex = TAB_CONFIGS.findIndex(t => t.id === currentSection);
      
      if (offset > 0 || velocity > 500) {
        // Swipe right - go to previous
        if (currentIndex > 0) {
          onSectionChange(TAB_CONFIGS[currentIndex - 1].id);
        }
      } else {
        // Swipe left - go to next
        if (currentIndex < TAB_CONFIGS.length - 1) {
          onSectionChange(TAB_CONFIGS[currentIndex + 1].id);
        }
      }
    }
  };

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.1}
      onDragStart={() => setIsDragging(true)}
      onDragEnd={handleDragEnd}
      style={{ x }}
      className="touch-pan-y"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSection}
          initial={{ opacity: 0, x: isDragging ? 0 : 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

// Custom Tab Groups Manager with Drag-Drop Reorder
export const CustomTabGroups: React.FC<{
  onSelect: (tabId: MainSectionType) => void;
  currentSection: MainSectionType;
}> = ({ onSelect, currentSection }) => {
  const [groups, setGroups] = useState<{ id: string; name: string; tabs: MainSectionType[] }[]>(() => {
    const saved = localStorage.getItem('safetyHub_customGroups');
    return saved ? JSON.parse(saved) : [
      { id: 'default', name: 'My Workflow', tabs: ['safety', 'compliance-hub', 'alerts'] },
    ];
  });
  const [isEditing, setIsEditing] = useState(false);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [draggedTab, setDraggedTab] = useState<{ groupId: string; tabId: MainSectionType } | null>(null);

  const saveGroups = (newGroups: typeof groups) => {
    setGroups(newGroups);
    localStorage.setItem('safetyHub_customGroups', JSON.stringify(newGroups));
  };

  const addGroup = () => {
    if (!newGroupName.trim()) return;
    const newGroup = {
      id: `group-${Date.now()}`,
      name: newGroupName,
      tabs: [] as MainSectionType[]
    };
    saveGroups([...groups, newGroup]);
    setNewGroupName('');
    setEditingGroup(newGroup.id);
  };

  const toggleTabInGroup = (groupId: string, tabId: MainSectionType) => {
    saveGroups(groups.map(group => {
      if (group.id !== groupId) return group;
      const tabs = group.tabs.includes(tabId)
        ? group.tabs.filter(t => t !== tabId)
        : [...group.tabs, tabId];
      return { ...group, tabs };
    }));
  };

  const deleteGroup = (groupId: string) => {
    saveGroups(groups.filter(g => g.id !== groupId));
  };

  // Drag-drop reorder for tabs within a group
  const handleDragStart = (groupId: string, tabId: MainSectionType) => {
    setDraggedTab({ groupId, tabId });
  };

  const handleDragOver = (e: React.DragEvent, groupId: string, targetTabId: MainSectionType) => {
    e.preventDefault();
    if (!draggedTab || draggedTab.groupId !== groupId || draggedTab.tabId === targetTabId) return;
    
    const group = groups.find(g => g.id === groupId);
    if (!group) return;

    const dragIndex = group.tabs.indexOf(draggedTab.tabId);
    const hoverIndex = group.tabs.indexOf(targetTabId);
    
    if (dragIndex === -1 || hoverIndex === -1) return;

    const newTabs = [...group.tabs];
    newTabs.splice(dragIndex, 1);
    newTabs.splice(hoverIndex, 0, draggedTab.tabId);

    saveGroups(groups.map(g => 
      g.id === groupId ? { ...g, tabs: newTabs } : g
    ));
  };

  const handleDragEnd = () => {
    setDraggedTab(null);
  };

  if (!isEditing && groups.length === 0) {
    return (
      <button
        onClick={() => setIsEditing(true)}
        className="flex items-center gap-2 px-4 py-2 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm text-surface-600 transition-all"
      >
        <Plus className="w-4 h-4" />
        Create Custom Group
      </button>
    );
  }

  return (
    <div className="space-y-3">
      {/* Group Quick Access */}
      {!isEditing && groups.map(group => (
        <div key={group.id} className="bg-surface-50 rounded-2xl p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">{group.name}</span>
            <button
              onClick={() => { setIsEditing(true); setEditingGroup(group.id); }}
              className="p-1 hover:bg-surface-200 rounded-lg transition-colors"
            >
              <Settings className="w-3.5 h-3.5 text-surface-400" />
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {group.tabs.map(tabId => {
              const tab = TAB_CONFIGS.find(t => t.id === tabId);
              if (!tab) return null;
              const Icon = tab.icon;
              const isActive = currentSection === tabId;

              return (
                <motion.button
                  key={tabId}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSelect(tabId)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isActive
                      ? `bg-gradient-to-r ${tab.bg} text-white`
                      : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Edit Mode with Drag-Drop */}
      {isEditing && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-surface-200 rounded-2xl p-4 shadow-lg"
        >
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-bold text-surface-800">Customize Groups</h4>
            <button
              onClick={() => { setIsEditing(false); setEditingGroup(null); }}
              className="p-1.5 hover:bg-surface-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-surface-500" />
            </button>
          </div>

          {/* Existing Groups with Drag-Drop */}
          {groups.map(group => (
            <div key={group.id} className="mb-4 pb-4 border-b border-surface-100 last:border-0">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-surface-700">{group.name}</span>
                <button
                  onClick={() => deleteGroup(group.id)}
                  className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {/* Tabs selection */}
              <p className="text-xs text-surface-400 mb-2">Click to add/remove • Drag to reorder</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {TAB_CONFIGS.map(tab => {
                  const Icon = tab.icon;
                  const isInGroup = group.tabs.includes(tab.id);

                  return (
                    <button
                      key={tab.id}
                      onClick={() => toggleTabInGroup(group.id, tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isInGroup
                          ? `bg-gradient-to-r ${tab.bg} text-white`
                          : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Reorderable tabs in group */}
              {group.tabs.length > 1 && (
                <div className="bg-surface-50 rounded-xl p-2">
                  <p className="text-[10px] text-surface-400 mb-2 flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    Drag to reorder tabs
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {group.tabs.map((tabId, index) => {
                      const tab = TAB_CONFIGS.find(t => t.id === tabId);
                      if (!tab) return null;
                      const Icon = tab.icon;
                      const isDragging = draggedTab?.groupId === group.id && draggedTab?.tabId === tabId;

                      return (
                        <div
                          key={tabId}
                          draggable
                          onDragStart={() => handleDragStart(group.id, tabId)}
                          onDragOver={(e) => handleDragOver(e, group.id, tabId)}
                          onDragEnd={handleDragEnd}
                          className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium cursor-grab active:cursor-grabbing transition-all ${
                            isDragging
                              ? 'bg-brand-100 text-brand-700 ring-2 ring-brand-300'
                              : 'bg-white border border-surface-200 text-surface-600'
                          }`}
                        >
                          <GripVertical className="w-2.5 h-2.5 text-surface-300" />
                          <Icon className="w-2.5 h-2.5" />
                          <span>{index + 1}.</span>
                          {tab.label}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Add New Group */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="New group name..."
              className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={addGroup}
              disabled={!newGroupName.trim()}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-medium hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Add Group Button (when not editing) */}
      {!isEditing && (
        <button
          onClick={() => setIsEditing(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-surface-100 hover:bg-surface-200 rounded-xl text-sm text-surface-600 font-medium transition-all"
        >
          <Plus className="w-4 h-4" />
          Manage Groups
        </button>
      )}
    </div>
  );
};

// Floating Quick Switch Button for Mobile
export const FloatingQuickSwitch: React.FC<{
  onClick: () => void;
  currentSection: MainSectionType;
}> = ({ onClick, currentSection }) => {
  const currentTab = TAB_CONFIGS.find(t => t.id === currentSection);
  const Icon = currentTab?.icon || Shield;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="md:hidden fixed bottom-24 left-4 z-40 flex items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-lg border border-surface-100"
    >
      <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${currentTab?.bg} flex items-center justify-center`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div className="text-left">
        <p className="text-xs text-surface-500">Current</p>
        <p className="text-sm font-bold text-surface-800">{currentTab?.label}</p>
      </div>
      <ChevronUp className="w-4 h-4 text-surface-400 ml-2" />
    </motion.button>
  );
};

// Pinned Tabs Hook
export const usePinnedTabs = () => {
  const [pinnedTabs, setPinnedTabs] = useState<MainSectionType[]>(() => {
    const saved = localStorage.getItem('safetyHub_pinnedTabs');
    return saved ? JSON.parse(saved) : [];
  });

  const togglePin = useCallback((tabId: MainSectionType) => {
    setPinnedTabs(prev => {
      const newPinned = prev.includes(tabId)
        ? prev.filter(id => id !== tabId)
        : [...prev, tabId];
      localStorage.setItem('safetyHub_pinnedTabs', JSON.stringify(newPinned));
      return newPinned;
    });
  }, []);

  const isPinned = useCallback((tabId: MainSectionType) => {
    return pinnedTabs.includes(tabId);
  }, [pinnedTabs]);

  // Get tabs sorted with pinned first
  const getSortedTabs = useCallback((tabs: TabConfig[]) => {
    const pinned = tabs.filter(t => pinnedTabs.includes(t.id));
    const unpinned = tabs.filter(t => !pinnedTabs.includes(t.id));
    return [...pinned, ...unpinned];
  }, [pinnedTabs]);

  return { pinnedTabs, togglePin, isPinned, getSortedTabs };
};

// Tab Keyboard Navigation Hook (enhanced arrow key navigation)
export const useTabKeyboardNavigation = (
  tabs: TabConfig[],
  currentSection: MainSectionType,
  onSectionChange: (section: MainSectionType) => void
) => {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const currentIndex = useMemo(() => {
    return tabs.findIndex(t => t.id === currentSection);
  }, [tabs, currentSection]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if we're in a text input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      // Arrow key navigation without modifiers
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // Only activate if already navigating or focused
        if (!isNavigating && focusedIndex === null) return;
        
        e.preventDefault();
        setIsNavigating(true);
        
        const targetIndex = focusedIndex ?? currentIndex;
        let newIndex: number;
        
        if (e.key === 'ArrowLeft') {
          newIndex = targetIndex <= 0 ? tabs.length - 1 : targetIndex - 1;
        } else {
          newIndex = targetIndex >= tabs.length - 1 ? 0 : targetIndex + 1;
        }
        
        setFocusedIndex(newIndex);
        tabRefs.current[newIndex]?.focus();
      }

      // Enter to select focused tab
      if (e.key === 'Enter' && isNavigating && focusedIndex !== null) {
        e.preventDefault();
        onSectionChange(tabs[focusedIndex].id);
        setIsNavigating(false);
      }

      // Escape to exit navigation mode
      if (e.key === 'Escape') {
        setIsNavigating(false);
        setFocusedIndex(null);
      }

      // Home/End for first/last tab
      if (e.key === 'Home' && isNavigating) {
        e.preventDefault();
        setFocusedIndex(0);
        tabRefs.current[0]?.focus();
      }
      if (e.key === 'End' && isNavigating) {
        e.preventDefault();
        setFocusedIndex(tabs.length - 1);
        tabRefs.current[tabs.length - 1]?.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tabs, currentIndex, focusedIndex, isNavigating, onSectionChange]);

  const startNavigation = useCallback(() => {
    setIsNavigating(true);
    setFocusedIndex(currentIndex);
    tabRefs.current[currentIndex]?.focus();
  }, [currentIndex]);

  const endNavigation = useCallback(() => {
    setIsNavigating(false);
    setFocusedIndex(null);
  }, []);

  return { 
    focusedIndex, 
    isNavigating, 
    tabRefs, 
    startNavigation, 
    endNavigation,
    setFocusedIndex 
  };
};

// Theme Scheduling Hook
export const useThemeScheduling = (changeTheme: (themeId: ColorThemeType) => void) => {
  const [schedules, setSchedules] = useState<ThemeSchedule[]>(() => {
    const saved = localStorage.getItem('safetyHub_themeSchedules');
    return saved ? JSON.parse(saved) : [
      {
        id: 'morning',
        name: 'Morning Mode',
        themeId: 'default',
        startHour: 6,
        startMinute: 0,
        endHour: 12,
        endMinute: 0,
        days: [1, 2, 3, 4, 5], // Weekdays
        enabled: false
      },
      {
        id: 'afternoon',
        name: 'Afternoon Mode',
        themeId: 'ocean',
        startHour: 12,
        startMinute: 0,
        endHour: 18,
        endMinute: 0,
        days: [1, 2, 3, 4, 5],
        enabled: false
      },
      {
        id: 'evening',
        name: 'Evening Mode',
        themeId: 'midnight',
        startHour: 18,
        startMinute: 0,
        endHour: 23,
        endMinute: 59,
        days: [0, 1, 2, 3, 4, 5, 6],
        enabled: false
      },
      {
        id: 'weekend',
        name: 'Weekend Vibes',
        themeId: 'candy',
        startHour: 9,
        startMinute: 0,
        endHour: 21,
        endMinute: 0,
        days: [0, 6], // Weekend
        enabled: false
      }
    ];
  });
  const [schedulingEnabled, setSchedulingEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('safetyHub_themeSchedulingEnabled');
    return saved === 'true';
  });

  // Check schedules every minute
  useEffect(() => {
    if (!schedulingEnabled) return;
    
    const checkSchedule = () => {
      const now = new Date();
      const currentDay = now.getDay();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 60 + currentMinute;
      
      for (const schedule of schedules) {
        if (!schedule.enabled || !schedule.days.includes(currentDay)) continue;
        
        const startTime = schedule.startHour * 60 + schedule.startMinute;
        const endTime = schedule.endHour * 60 + schedule.endMinute;
        
        if (currentTime >= startTime && currentTime < endTime) {
          changeTheme(schedule.themeId);
          break;
        }
      }
    };
    
    checkSchedule();
    const interval = setInterval(checkSchedule, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [schedulingEnabled, schedules, changeTheme]);
  
  const saveSchedules = useCallback((newSchedules: ThemeSchedule[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('safetyHub_themeSchedules', JSON.stringify(newSchedules));
  }, []);
  
  const toggleScheduling = useCallback((enabled: boolean) => {
    setSchedulingEnabled(enabled);
    localStorage.setItem('safetyHub_themeSchedulingEnabled', String(enabled));
  }, []);
  
  const updateSchedule = useCallback((scheduleId: string, updates: Partial<ThemeSchedule>) => {
    setSchedules(prev => {
      const updated = prev.map(s => s.id === scheduleId ? { ...s, ...updates } : s);
      localStorage.setItem('safetyHub_themeSchedules', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const addSchedule = useCallback((schedule: ThemeSchedule) => {
    setSchedules(prev => {
      const updated = [...prev, schedule];
      localStorage.setItem('safetyHub_themeSchedules', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const removeSchedule = useCallback((scheduleId: string) => {
    setSchedules(prev => {
      const updated = prev.filter(s => s.id !== scheduleId);
      localStorage.setItem('safetyHub_themeSchedules', JSON.stringify(updated));
      return updated;
    });
  }, []);

  return {
    schedules,
    schedulingEnabled,
    toggleScheduling,
    updateSchedule,
    addSchedule,
    removeSchedule,
    saveSchedules
  };
};

// Color Theme Hook
export const useColorTheme = () => {
  const [currentTheme, setCurrentTheme] = useState<ColorThemeType>(() => {
    const saved = localStorage.getItem('safetyHub_colorTheme');
    return (saved as ColorThemeType) || 'default';
  });
  
  // Auto-switch settings
  const [autoSwitchEnabled, setAutoSwitchEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('safetyHub_autoThemeSwitch');
    return saved === 'true';
  });
  const [autoSwitchInterval, setAutoSwitchInterval] = useState<number>(() => {
    const saved = localStorage.getItem('safetyHub_autoThemeSwitchInterval');
    return saved ? parseInt(saved) : 30; // 30 seconds default
  });

  // Auto theme switching effect
  useEffect(() => {
    if (!autoSwitchEnabled) return;
    
    const interval = setInterval(() => {
      setCurrentTheme(prev => {
        const currentIndex = COLOR_THEMES.findIndex(t => t.id === prev);
        const nextIndex = (currentIndex + 1) % COLOR_THEMES.length;
        const nextTheme = COLOR_THEMES[nextIndex].id;
        localStorage.setItem('safetyHub_colorTheme', nextTheme);
        return nextTheme;
      });
    }, autoSwitchInterval * 1000);
    
    return () => clearInterval(interval);
  }, [autoSwitchEnabled, autoSwitchInterval]);

  const changeTheme = useCallback((themeId: ColorThemeType) => {
    setCurrentTheme(themeId);
    localStorage.setItem('safetyHub_colorTheme', themeId);
  }, []);
  
  const toggleAutoSwitch = useCallback((enabled: boolean) => {
    setAutoSwitchEnabled(enabled);
    localStorage.setItem('safetyHub_autoThemeSwitch', String(enabled));
  }, []);
  
  const setAutoInterval = useCallback((seconds: number) => {
    setAutoSwitchInterval(seconds);
    localStorage.setItem('safetyHub_autoThemeSwitchInterval', String(seconds));
  }, []);

  const getTheme = useCallback(() => {
    return COLOR_THEMES.find(t => t.id === currentTheme) || COLOR_THEMES[0];
  }, [currentTheme]);

  const getTabColors = useCallback((tabId: MainSectionType) => {
    const theme = getTheme();
    return theme.colors[tabId];
  }, [getTheme]);

  return { 
    currentTheme, 
    changeTheme, 
    getTheme, 
    getTabColors, 
    allThemes: COLOR_THEMES,
    autoSwitchEnabled,
    toggleAutoSwitch,
    autoSwitchInterval,
    setAutoInterval
  };
};

// Tab Animation Hook
export const useTabAnimations = () => {
  const [animationType, setAnimationType] = useState<TabAnimationType>(() => {
    const saved = localStorage.getItem('safetyHub_tabAnimation');
    return (saved as TabAnimationType) || 'none';
  });
  
  const [animatedTabs, setAnimatedTabs] = useState<MainSectionType[]>(() => {
    const saved = localStorage.getItem('safetyHub_animatedTabs');
    return saved ? JSON.parse(saved) : ['safety', 'alerts'];
  });

  const changeAnimation = useCallback((type: TabAnimationType) => {
    setAnimationType(type);
    localStorage.setItem('safetyHub_tabAnimation', type);
  }, []);
  
  const toggleTabAnimation = useCallback((tabId: MainSectionType) => {
    setAnimatedTabs(prev => {
      const newTabs = prev.includes(tabId) 
        ? prev.filter(t => t !== tabId)
        : [...prev, tabId];
      localStorage.setItem('safetyHub_animatedTabs', JSON.stringify(newTabs));
      return newTabs;
    });
  }, []);
  
  const getTabAnimation = useCallback((tabId: MainSectionType) => {
    if (!animatedTabs.includes(tabId)) return TAB_ANIMATIONS.none;
    return TAB_ANIMATIONS[animationType];
  }, [animationType, animatedTabs]);

  return { 
    animationType, 
    changeAnimation, 
    animatedTabs, 
    toggleTabAnimation,
    getTabAnimation,
    allAnimations: Object.keys(TAB_ANIMATIONS) as TabAnimationType[]
  };
};

// Badge Customization Hook with Notifications
export const useBadgeCustomization = () => {
  const [customBadges, setCustomBadges] = useState<BadgeConfig[]>(() => {
    const saved = localStorage.getItem('safetyHub_customBadges');
    return saved ? JSON.parse(saved) : [];
  });
  const [notificationHistory, setNotificationHistory] = useState<BadgeNotificationEvent[]>([]);

  // Play notification sound
  const playNotificationSound = useCallback(() => {
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleRgEPnzR7NqBNwA+hNjz3Yo2/z2P3/vjkTcAPpXe+uWTNwA+mt/844s1AT+d4PzjiTUAP6Hi/eOHNABApuP+5IYzAECp5P/lhTIAQKzl/+WEMgBAr+b/5YMyAEC16P/mgTEAQLjo/+aAMQBAu+n/5n8xAEC96v/mfjAAQMDr/+d9MABAw+z/53wwAEDG7f/neiwAQMnu/+h5KwBA0PD/6HcpAEDU8f/odygAQNfz/+l1KABA2vT/6XQoAEDe9f/pcCYAQOH3/+ptJgBA5fj/6mslAEDp+f/qaSQAQO37/+tnIwBA8fz/62UiAED1/f/rYiEAQPj//+tgIABA/AAA7F4fAEADAQDsXB4AQAUAAO1aHgBACAEA7VgdAEAKAQDuVhwAQA0AAO5UHABAEAEA7lIbAEASAADuUBsAQBUAAO5OGgBAFwAA71wTAEAaAADvWhMAQBwAAO9ZFABAHQAA71cUAEAeAADvVhQAQCEAAO9UFABAIQA=');
      audio.volume = 0.5;
      audio.play().catch(() => {}); // Ignore errors (user hasn't interacted)
    } catch (e) {
      // Silently fail
    }
  }, []);

  // Trigger vibration
  const triggerVibration = useCallback(() => {
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100]);
    }
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((title: string, body: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.ico' });
    }
  }, []);

  const setBadge = useCallback((config: BadgeConfig) => {
    setCustomBadges(prev => {
      const existing = prev.find(b => b.tabId === config.tabId);
      const filtered = prev.filter(b => b.tabId !== config.tabId);
      const updated = config.count > 0 ? [...filtered, config] : filtered;
      
      // Handle notifications
      if (existing && config.notifyOnChange && config.count > existing.count) {
        const diff = config.count - existing.count;
        const tabName = TAB_CONFIGS.find(t => t.id === config.tabId)?.label || config.tabId;
        
        // Add to notification history
        setNotificationHistory(h => [...h.slice(-49), {
          tabId: config.tabId,
          previousCount: existing.count,
          newCount: config.count,
          timestamp: Date.now()
        }]);
        
        // Play sound if enabled
        if (config.soundEnabled) {
          playNotificationSound();
        }
        
        // Trigger vibration if enabled
        if (config.vibrationEnabled) {
          triggerVibration();
        }
        
        // Show browser notification
        showBrowserNotification(`${tabName}: ${diff} new alerts`, `Total: ${config.count} items`);
      }
      
      localStorage.setItem('safetyHub_customBadges', JSON.stringify(updated));
      return updated;
    });
  }, [playNotificationSound, triggerVibration, showBrowserNotification]);
  
  const removeBadge = useCallback((tabId: MainSectionType) => {
    setCustomBadges(prev => {
      const updated = prev.filter(b => b.tabId !== tabId);
      localStorage.setItem('safetyHub_customBadges', JSON.stringify(updated));
      return updated;
    });
  }, []);
  
  const getBadge = useCallback((tabId: MainSectionType) => {
    return customBadges.find(b => b.tabId === tabId);
  }, [customBadges]);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      await Notification.requestPermission();
    }
  }, []);

  return { 
    customBadges, 
    setBadge, 
    removeBadge, 
    getBadge, 
    notificationHistory,
    requestNotificationPermission 
  };
};

// Tab Animation Picker Component - Extended with 12 animations
export const TabAnimationPicker: React.FC<{
  currentAnimation: TabAnimationType;
  onAnimationChange: (animation: TabAnimationType) => void;
  animatedTabs: MainSectionType[];
  onToggleTab: (tabId: MainSectionType) => void;
}> = ({ currentAnimation, onAnimationChange, animatedTabs, onToggleTab }) => {
  const animations: { id: TabAnimationType; name: string; icon: React.ReactNode }[] = [
    { id: 'none', name: 'None', icon: <X className="w-4 h-4" /> },
    { id: 'bounce', name: 'Bounce', icon: <Zap className="w-4 h-4" /> },
    { id: 'pulse', name: 'Pulse', icon: <Award className="w-4 h-4" /> },
    { id: 'glow', name: 'Glow', icon: <Sparkles className="w-4 h-4" /> },
    { id: 'shake', name: 'Shake', icon: <Bell className="w-4 h-4" /> },
    { id: 'flip', name: 'Flip', icon: <Star className="w-4 h-4" /> },
    { id: 'wave', name: 'Wave', icon: <ChevronUp className="w-4 h-4" /> },
    { id: 'morph', name: 'Morph', icon: <Settings className="w-4 h-4" /> },
    { id: 'ripple', name: 'Ripple', icon: <Clock className="w-4 h-4" /> },
    { id: 'slide', name: 'Slide', icon: <ArrowRight className="w-4 h-4" /> },
    { id: 'rotate', name: 'Rotate', icon: <GripVertical className="w-4 h-4" /> },
    { id: 'rainbow', name: 'Rainbow', icon: <Palette className="w-4 h-4" /> },
  ];

  return (
    <div className="bg-surface-50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles className="w-4 h-4 text-purple-500" />
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Tab Animations</span>
      </div>
      
      {/* Animation Type Selection */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {animations.map(anim => (
          <button
            key={anim.id}
            onClick={() => onAnimationChange(anim.id)}
            className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
              currentAnimation === anim.id
                ? 'bg-purple-100 text-purple-700 ring-2 ring-purple-500'
                : 'bg-white hover:bg-surface-100 text-surface-600 border border-surface-200'
            }`}
          >
            {anim.icon}
            <span className="text-[10px] font-medium">{anim.name}</span>
          </button>
        ))}
      </div>
      
      {/* Tab Selection */}
      <p className="text-xs text-surface-400 mb-2">Apply animation to:</p>
      <div className="flex flex-wrap gap-1">
        {TAB_CONFIGS.map(tab => {
          const Icon = tab.icon;
          const isAnimated = animatedTabs.includes(tab.id);
          return (
            <button
              key={tab.id}
              onClick={() => onToggleTab(tab.id)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                isAnimated
                  ? `bg-gradient-to-r ${tab.bg} text-white`
                  : 'bg-white border border-surface-200 text-surface-500'
              }`}
            >
              <Icon className="w-3 h-3" />
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Theme Auto-Switch Component
export const ThemeAutoSwitcher: React.FC<{
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  interval: number;
  onIntervalChange: (seconds: number) => void;
}> = ({ enabled, onToggle, interval, onIntervalChange }) => {
  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-3 mt-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <motion.div
            animate={enabled ? { rotate: 360 } : {}}
            transition={{ duration: 2, repeat: enabled ? Infinity : 0, ease: 'linear' }}
          >
            <Sun className="w-4 h-4 text-amber-500" />
          </motion.div>
          <span className="text-sm font-medium text-surface-700">Auto Theme Switch</span>
        </div>
        <button
          onClick={() => onToggle(!enabled)}
          className={`relative w-10 h-6 rounded-full transition-colors ${
            enabled ? 'bg-purple-500' : 'bg-surface-300'
          }`}
        >
          <motion.div
            animate={{ x: enabled ? 16 : 0 }}
            className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
          />
        </button>
      </div>
      {enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="flex items-center gap-2"
        >
          <span className="text-xs text-surface-500">Switch every</span>
          <select
            value={interval}
            onChange={(e) => onIntervalChange(parseInt(e.target.value))}
            className="px-2 py-1 text-xs bg-white border border-surface-200 rounded-lg"
          >
            <option value={10}>10 sec</option>
            <option value={30}>30 sec</option>
            <option value={60}>1 min</option>
            <option value={300}>5 min</option>
          </select>
        </motion.div>
      )}
    </div>
  );
};

// Badge Customizer Component with Notifications
export const BadgeCustomizer: React.FC<{
  customBadges: BadgeConfig[];
  onSetBadge: (config: BadgeConfig) => void;
  onRemoveBadge: (tabId: MainSectionType) => void;
  onRequestNotificationPermission?: () => void;
}> = ({ customBadges, onSetBadge, onRemoveBadge, onRequestNotificationPermission }) => {
  const [editingTab, setEditingTab] = useState<MainSectionType | null>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [badgeColor, setBadgeColor] = useState<BadgeConfig['color']>('red');
  const [badgePulse, setBadgePulse] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [vibrationEnabled, setVibrationEnabled] = useState(false);
  const [notifyOnChange, setNotifyOnChange] = useState(false);

  const colors: BadgeConfig['color'][] = ['red', 'amber', 'green', 'blue', 'purple'];

  const handleSave = () => {
    if (editingTab) {
      onSetBadge({ 
        tabId: editingTab, 
        count: badgeCount, 
        color: badgeColor, 
        pulse: badgePulse,
        soundEnabled,
        vibrationEnabled,
        notifyOnChange
      });
      setEditingTab(null);
    }
  };

  return (
    <div className="bg-surface-50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Edit3 className="w-4 h-4 text-blue-500" />
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Badge Customization</span>
        {onRequestNotificationPermission && (
          <button
            onClick={onRequestNotificationPermission}
            className="ml-auto text-[10px] text-blue-500 hover:text-blue-600"
          >
            Enable Notifications
          </button>
        )}
      </div>
      
      {/* Tab badges list */}
      <div className="space-y-2 mb-3">
        {TAB_CONFIGS.map(tab => {
          const badge = customBadges.find(b => b.tabId === tab.id);
          const Icon = tab.icon;
          
          return (
            <div key={tab.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-surface-200">
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${tab.color}`} />
                <span className="text-sm font-medium text-surface-700">{tab.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {badge && (
                  <div className="flex items-center gap-1">
                    {badge.soundEnabled && <Bell className="w-3 h-3 text-amber-500" />}
                    {badge.vibrationEnabled && <Zap className="w-3 h-3 text-purple-500" />}
                    <motion.span 
                      animate={badge.pulse ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                      className={`min-w-5 h-5 px-1.5 ${BADGE_COLORS[badge.color]} text-white rounded-full text-[10px] font-bold flex items-center justify-center`}
                    >
                      {badge.count}
                    </motion.span>
                  </div>
                )}
                <button
                  onClick={() => {
                    setEditingTab(tab.id);
                    setBadgeCount(badge?.count || 0);
                    setBadgeColor(badge?.color || 'red');
                    setBadgePulse(badge?.pulse || false);
                    setSoundEnabled(badge?.soundEnabled || false);
                    setVibrationEnabled(badge?.vibrationEnabled || false);
                    setNotifyOnChange(badge?.notifyOnChange || false);
                  }}
                  className="p-1 hover:bg-surface-100 rounded-lg"
                >
                  <Edit3 className="w-3 h-3 text-surface-400" />
                </button>
                {badge && (
                  <button
                    onClick={() => onRemoveBadge(tab.id)}
                    className="p-1 hover:bg-red-50 rounded-lg"
                  >
                    <X className="w-3 h-3 text-red-500" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Edit badge modal */}
      <AnimatePresence>
        {editingTab && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="bg-white border border-surface-200 rounded-xl p-3 shadow-lg"
          >
            <p className="text-sm font-medium text-surface-700 mb-3">
              Edit badge for {TAB_CONFIGS.find(t => t.id === editingTab)?.label}
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="text-xs text-surface-500 mb-1 block">Count</label>
                <input
                  type="number"
                  value={badgeCount}
                  onChange={(e) => setBadgeCount(parseInt(e.target.value) || 0)}
                  min={0}
                  max={999}
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm"
                />
              </div>
              
              <div>
                <label className="text-xs text-surface-500 mb-1 block">Color</label>
                <div className="flex gap-2">
                  {colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setBadgeColor(color)}
                      className={`w-6 h-6 rounded-full ${BADGE_COLORS[color]} ${
                        badgeColor === color ? 'ring-2 ring-offset-2 ring-surface-400' : ''
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-xs text-surface-500">Pulse animation</label>
                <button
                  onClick={() => setBadgePulse(!badgePulse)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    badgePulse ? 'bg-blue-500' : 'bg-surface-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: badgePulse ? 16 : 0 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Sound notification */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-surface-500 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Sound alert
                </label>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    soundEnabled ? 'bg-amber-500' : 'bg-surface-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: soundEnabled ? 16 : 0 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Vibration */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-surface-500 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> Vibration
                </label>
                <button
                  onClick={() => setVibrationEnabled(!vibrationEnabled)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    vibrationEnabled ? 'bg-purple-500' : 'bg-surface-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: vibrationEnabled ? 16 : 0 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>

              {/* Browser notifications */}
              <div className="flex items-center justify-between">
                <label className="text-xs text-surface-500 flex items-center gap-1">
                  <Bell className="w-3 h-3" /> Browser notify
                </label>
                <button
                  onClick={() => setNotifyOnChange(!notifyOnChange)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    notifyOnChange ? 'bg-green-500' : 'bg-surface-300'
                  }`}
                >
                  <motion.div
                    animate={{ x: notifyOnChange ? 16 : 0 }}
                    className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow"
                  />
                </button>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={() => setEditingTab(null)}
                  className="flex-1 px-3 py-2 bg-surface-100 text-surface-600 rounded-lg text-sm font-medium hover:bg-surface-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600"
                >
                  Save
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Color Theme Picker Component
export const ColorThemePicker: React.FC<{
  currentTheme: ColorThemeType;
  onThemeChange: (theme: ColorThemeType) => void;
  compact?: boolean;
}> = ({ currentTheme, onThemeChange, compact = false }) => {
  const [isOpen, setIsOpen] = useState(false);

  if (compact) {
    return (
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-surface-100 hover:bg-surface-200 transition-all"
          title="Change color theme"
        >
          <Palette className="w-4 h-4 text-surface-500" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="absolute top-full right-0 mt-2 p-2 bg-white rounded-2xl shadow-xl border border-surface-200 z-50 min-w-[200px]"
            >
              <p className="text-xs font-bold text-surface-500 uppercase tracking-wider px-2 mb-2">Color Theme</p>
              {COLOR_THEMES.map(theme => (
                <button
                  key={theme.id}
                  onClick={() => { onThemeChange(theme.id); setIsOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                    currentTheme === theme.id
                      ? 'bg-brand-50 text-brand-700'
                      : 'hover:bg-surface-50 text-surface-700'
                  }`}
                >
                  <div className="flex gap-0.5">
                    {theme.preview.map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                  <span className="text-sm font-medium">{theme.name}</span>
                  {currentTheme === theme.id && (
                    <Check className="w-4 h-4 ml-auto text-brand-600" />
                  )}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="bg-surface-50 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Palette className="w-4 h-4 text-surface-500" />
        <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">Color Theme</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {COLOR_THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => onThemeChange(theme.id)}
            className={`relative flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
              currentTheme === theme.id
                ? 'bg-white ring-2 ring-brand-500 shadow-md'
                : 'bg-white hover:bg-surface-100 border border-surface-200'
            }`}
          >
            {currentTheme === theme.id && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center"
              >
                <Check className="w-3 h-3 text-white" />
              </motion.div>
            )}
            <div className="flex gap-1">
              {theme.preview.map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full shadow-sm"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span className="text-xs font-medium text-surface-700">{theme.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

// Pinned Tabs Bar Component
export const PinnedTabsBar: React.FC<{
  pinnedTabs: MainSectionType[];
  currentSection: MainSectionType;
  onSelect: (tabId: MainSectionType) => void;
  onUnpin: (tabId: MainSectionType) => void;
  getTabColors: (tabId: MainSectionType) => { color: string; bg: string };
}> = ({ pinnedTabs, currentSection, onSelect, onUnpin, getTabColors }) => {
  if (pinnedTabs.length === 0) return null;

  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex items-center gap-1 px-2 py-1 bg-amber-50 rounded-lg">
        <Pin className="w-3 h-3 text-amber-500 rotate-45" />
        <span className="text-[10px] font-bold text-amber-600 uppercase">Pinned</span>
      </div>
      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {pinnedTabs.map(tabId => {
          const tab = TAB_CONFIGS.find(t => t.id === tabId);
          if (!tab) return null;
          const Icon = tab.icon;
          const isActive = currentSection === tabId;
          const colors = getTabColors(tabId);

          return (
            <motion.div
              key={tabId}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="relative group"
            >
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => onSelect(tabId)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? `bg-gradient-to-r ${colors.bg} text-white shadow-md`
                    : 'bg-white text-surface-600 border border-surface-200 hover:border-surface-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : colors.color}`} />
                {tab.label}
              </motion.button>
              <button
                onClick={(e) => { e.stopPropagation(); onUnpin(tabId); }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-surface-200 hover:bg-red-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-2.5 h-2.5 text-surface-500 hover:text-red-500" />
              </button>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Enhanced Tab Bar with All New Features
export const EnhancedTabBarV2: React.FC<QuickTabSwitcherProps & {
  showShortcuts?: boolean;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  isSearchOpen?: boolean;
  onSearchToggle?: () => void;
  filteredTabs?: TabConfig[];
  pinnedTabs: MainSectionType[];
  onTogglePin: (tabId: MainSectionType) => void;
  isPinned: (tabId: MainSectionType) => boolean;
  getTabColors: (tabId: MainSectionType) => { color: string; bg: string };
  focusedIndex: number | null;
  isNavigating: boolean;
  tabRefs: React.MutableRefObject<(HTMLButtonElement | null)[]>;
  onStartNavigation: () => void;
  onEndNavigation: () => void;
  setFocusedIndex: (index: number | null) => void;
}> = ({
  currentSection,
  onSectionChange,
  alertBadge,
  showShortcuts = false,
  searchQuery = '',
  onSearchChange,
  isSearchOpen = false,
  onSearchToggle,
  filteredTabs,
  pinnedTabs,
  onTogglePin,
  isPinned,
  getTabColors,
  focusedIndex,
  isNavigating,
  tabRefs,
  onStartNavigation,
  onEndNavigation,
  setFocusedIndex
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [showPinMenu, setShowPinMenu] = useState<MainSectionType | null>(null);

  // Use filtered tabs if provided, otherwise use all tabs
  const displayTabs = filteredTabs || TAB_CONFIGS;

  // Sort with pinned tabs first
  const sortedTabs = useMemo(() => {
    const pinned = displayTabs.filter(t => pinnedTabs.includes(t.id));
    const unpinned = displayTabs.filter(t => !pinnedTabs.includes(t.id));
    return [...pinned, ...unpinned];
  }, [displayTabs, pinnedTabs]);

  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  }, []);

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    container?.addEventListener('scroll', checkScroll);
    return () => container?.removeEventListener('scroll', checkScroll);
  }, [checkScroll]);

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      container.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="relative group">
      {/* Search Bar & Navigation Help */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {isSearchOpen && (
              <motion.div
                initial={{ width: 0, opacity: 0 }}
                animate={{ width: 200, opacity: 1 }}
                exit={{ width: 0, opacity: 0 }}
                className="relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange?.(e.target.value)}
                  placeholder="Search sections..."
                  className="w-full pl-9 pr-8 py-2 bg-surface-50 border border-surface-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                />
                {searchQuery && (
                  <button 
                    onClick={() => onSearchChange?.('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-surface-200 rounded-full"
                  >
                    <X className="w-3 h-3 text-surface-400" />
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={onSearchToggle}
            className={`p-2 rounded-xl transition-all ${
              isSearchOpen ? 'bg-brand-100 text-brand-600' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
            }`}
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* Navigation mode indicator */}
        <div className="flex items-center gap-2">
          {isNavigating && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="flex items-center gap-1.5 px-2 py-1 bg-brand-50 rounded-lg text-xs text-brand-600"
            >
              <Keyboard className="w-3 h-3" />
              <span>←→ Navigate • Enter Select • Esc Exit</span>
            </motion.div>
          )}
          <button
            onClick={onStartNavigation}
            className={`p-2 rounded-xl transition-all ${
              isNavigating ? 'bg-brand-100 text-brand-600' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
            }`}
            title="Keyboard navigation (←→ to navigate, Enter to select)"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* No results message */}
      {searchQuery && sortedTabs.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-4 text-surface-500 text-sm"
        >
          No sections found for "{searchQuery}"
        </motion.div>
      )}

      {/* Scroll Indicators */}
      <AnimatePresence>
        {canScrollLeft && !searchQuery && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('left')}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
          >
            <ArrowLeft className="w-4 h-4 text-surface-600" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {canScrollRight && !searchQuery && (
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => scroll('right')}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full shadow-lg flex items-center justify-center hover:bg-white transition-all"
          >
            <ArrowRight className="w-4 h-4 text-surface-600" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Tab Container */}
      <div
        ref={scrollContainerRef}
        className="flex overflow-x-auto gap-2 pb-3 no-scrollbar scroll-smooth px-1"
      >
        {sortedTabs.map((tab, index) => {
          const Icon = tab.icon;
          const isActive = currentSection === tab.id;
          const badge = tab.id === 'alerts' ? alertBadge : undefined;
          const isPinnedTab = isPinned(tab.id);
          const colors = getTabColors(tab.id);
          const isFocused = focusedIndex === index && isNavigating;

          return (
            <motion.button
              key={tab.id}
              ref={el => { tabRefs.current[index] = el; }}
              onClick={() => onSectionChange(tab.id)}
              onFocus={() => setFocusedIndex(index)}
              onBlur={onEndNavigation}
              onContextMenu={(e) => {
                e.preventDefault();
                setShowPinMenu(showPinMenu === tab.id ? null : tab.id);
              }}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              layout
              className={`relative flex items-center gap-2.5 px-5 py-3 rounded-2xl font-semibold text-sm whitespace-nowrap transition-all duration-300 ${
                isActive 
                  ? `bg-gradient-to-r ${colors.bg} text-white shadow-lg` 
                  : 'bg-white text-surface-600 border border-surface-100 hover:border-surface-200 hover:bg-surface-50 hover:shadow-md'
              } ${
                isFocused ? 'ring-2 ring-brand-500 ring-offset-2' : ''
              }`}
            >
              {/* Pinned indicator */}
              {isPinnedTab && (
                <Pin className={`absolute -top-1 -left-1 w-3 h-3 rotate-45 ${isActive ? 'text-white' : 'text-amber-500'}`} />
              )}

              {/* Active indicator glow */}
              {isActive && (
                <motion.div
                  layoutId="activeTabGlowV2"
                  className="absolute inset-0 rounded-2xl bg-white/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}

              <Icon className={`w-4.5 h-4.5 relative z-10 ${isActive ? 'text-white' : colors.color}`} />
              <span className="relative z-10">{tab.label}</span>

              {/* Keyboard shortcut hint */}
              {showShortcuts && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className={`ml-1 text-[10px] font-mono px-1.5 py-0.5 rounded ${
                    isActive ? 'bg-white/30 text-white' : 'bg-surface-100 text-surface-500'
                  }`}
                >
                  ⌘{tab.shortcut}
                </motion.span>
              )}

              {/* Badge */}
              {badge && badge > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className={`absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1.5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                    isActive ? 'bg-white text-red-600' : 'bg-red-500 text-white'
                  }`}
                >
                  {badge > 99 ? '99+' : badge}
                </motion.span>
              )}

              {/* Pin context menu */}
              <AnimatePresence>
                {showPinMenu === tab.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 5 }}
                    className="absolute top-full left-0 mt-1 p-1 bg-white rounded-xl shadow-xl border border-surface-200 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTogglePin(tab.id);
                        setShowPinMenu(null);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface-50 text-sm whitespace-nowrap"
                    >
                      <Pin className={`w-4 h-4 ${isPinnedTab ? 'text-amber-500' : 'text-surface-400'}`} />
                      {isPinnedTab ? 'Unpin tab' : 'Pin tab'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      {/* Click outside to close pin menu */}
      {showPinMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowPinMenu(null)} 
        />
      )}
    </div>
  );
};

// Theme Scheduler Component
export const ThemeScheduler: React.FC<{
  schedules: ThemeSchedule[];
  schedulingEnabled: boolean;
  onToggleScheduling: (enabled: boolean) => void;
  onUpdateSchedule: (scheduleId: string, updates: Partial<ThemeSchedule>) => void;
  allThemes: ColorTheme[];
}> = ({ schedules, schedulingEnabled, onToggleScheduling, onUpdateSchedule, allThemes }) => {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const [editingSchedule, setEditingSchedule] = useState<string | null>(null);
  
  const formatTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => i);
  const minuteOptions = [0, 15, 30, 45];

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-4 mt-3">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-indigo-500" />
          <span className="font-bold text-surface-800">Theme Scheduling</span>
        </div>
        <button
          onClick={() => onToggleScheduling(!schedulingEnabled)}
          className={`relative w-12 h-7 rounded-full transition-colors ${
            schedulingEnabled ? 'bg-indigo-500' : 'bg-surface-300'
          }`}
        >
          <motion.div
            animate={{ x: schedulingEnabled ? 20 : 0 }}
            className="absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow"
          />
        </button>
      </div>

      {schedulingEnabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          {schedules.map(schedule => {
            const theme = allThemes.find(t => t.id === schedule.themeId);
            const isEditing = editingSchedule === schedule.id;
            return (
              <div 
                key={schedule.id} 
                className={`bg-white rounded-xl p-3 border-2 transition-all ${
                  schedule.enabled ? 'border-indigo-200' : 'border-surface-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm text-surface-700">{schedule.name}</span>
                    {theme && (
                      <div className="flex gap-0.5">
                        {theme.preview.slice(0, 3).map((color, i) => (
                          <div key={i} className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setEditingSchedule(isEditing ? null : schedule.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isEditing ? 'bg-indigo-100 text-indigo-600' : 'bg-surface-100 text-surface-500 hover:bg-surface-200'
                      }`}
                    >
                      <Settings className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onUpdateSchedule(schedule.id, { enabled: !schedule.enabled })}
                      className={`relative w-9 h-5 rounded-full transition-colors ${
                        schedule.enabled ? 'bg-green-500' : 'bg-surface-300'
                      }`}
                    >
                      <motion.div
                        animate={{ x: schedule.enabled ? 16 : 0 }}
                        className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow"
                      />
                    </button>
                  </div>
                </div>
                
                {/* Time Display / Editor */}
                {isEditing ? (
                  <div className="bg-surface-50 rounded-lg p-3 mb-3 space-y-3">
                    {/* Theme Selector */}
                    <div className="space-y-1">
                      <label className="text-xs font-medium text-surface-500">Theme</label>
                      <select
                        value={schedule.themeId}
                        onChange={(e) => onUpdateSchedule(schedule.id, { themeId: e.target.value as any })}
                        className="w-full px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm"
                      >
                        {allThemes.map(t => (
                          <option key={t.id} value={t.id}>{t.name}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Start Time */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-surface-500">Start Time</label>
                        <div className="flex gap-1">
                          <select
                            value={schedule.startHour}
                            onChange={(e) => onUpdateSchedule(schedule.id, { startHour: parseInt(e.target.value) })}
                            className="flex-1 px-2 py-1.5 bg-white border border-surface-200 rounded-lg text-sm"
                          >
                            {hourOptions.map(h => (
                              <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="self-center text-surface-400">:</span>
                          <select
                            value={schedule.startMinute}
                            onChange={(e) => onUpdateSchedule(schedule.id, { startMinute: parseInt(e.target.value) })}
                            className="flex-1 px-2 py-1.5 bg-white border border-surface-200 rounded-lg text-sm"
                          >
                            {minuteOptions.map(m => (
                              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      
                      {/* End Time */}
                      <div className="space-y-1">
                        <label className="text-xs font-medium text-surface-500">End Time</label>
                        <div className="flex gap-1">
                          <select
                            value={schedule.endHour}
                            onChange={(e) => onUpdateSchedule(schedule.id, { endHour: parseInt(e.target.value) })}
                            className="flex-1 px-2 py-1.5 bg-white border border-surface-200 rounded-lg text-sm"
                          >
                            {hourOptions.map(h => (
                              <option key={h} value={h}>{h.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                          <span className="self-center text-surface-400">:</span>
                          <select
                            value={schedule.endMinute}
                            onChange={(e) => onUpdateSchedule(schedule.id, { endMinute: parseInt(e.target.value) })}
                            className="flex-1 px-2 py-1.5 bg-white border border-surface-200 rounded-lg text-sm"
                          >
                            {minuteOptions.map(m => (
                              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-xs text-surface-500 mb-2">
                    <span>{formatTime(schedule.startHour, schedule.startMinute)}</span>
                    <span>→</span>
                    <span>{formatTime(schedule.endHour, schedule.endMinute)}</span>
                  </div>
                )}
                
                <div className="flex gap-1">
                  {dayNames.map((day, idx) => (
                    <button
                      key={day}
                      onClick={() => {
                        const newDays = schedule.days.includes(idx)
                          ? schedule.days.filter(d => d !== idx)
                          : [...schedule.days, idx];
                        onUpdateSchedule(schedule.id, { days: newDays });
                      }}
                      className={`w-7 h-6 rounded text-[10px] font-medium transition-all ${
                        schedule.days.includes(idx)
                          ? 'bg-indigo-500 text-white'
                          : 'bg-surface-100 text-surface-400 hover:bg-surface-200'
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
};

// Export all components and hooks
export { TAB_CONFIGS, COLOR_THEMES, TAB_ANIMATIONS, BADGE_COLORS };
export type { TabConfig, ColorTheme, ColorThemeType, TabAnimationType, BadgeConfig, ThemeSchedule, BadgeNotificationEvent };
