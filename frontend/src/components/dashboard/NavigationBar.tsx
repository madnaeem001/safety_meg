import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Bell, Menu, User, Search, Sparkles, X, RefreshCw,
  Home, Shield, BarChart3, GraduationCap, Book, ClipboardCheck,
  AlertTriangle, Car, Heart, Building2, FileSearch, Beaker,
  Settings, Activity, Target, Scale, Factory, Droplets,
  Globe, ChevronRight, Calendar, Wrench, FileCheck, Kanban,
  AlertCircle, FileText, Mic, Leaf, Recycle, Brain, TrendingUp, Map,
  Rocket, Eye, CalendarDays, BookOpen, Users, Mail,
  FlaskConical, Lock, Megaphone, LineChart, GitBranch,
  FileDown, WifiOff, Wind, ThumbsUp, Layers, KeyRound, LogOut
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { loadNotificationSettings, playNotificationSound } from '../../data/mockNavigation';

// Navigation sections with routes
export const NAV_SECTIONS = [
  {
    title: 'Overview',
    items: [
      { icon: Home, label: 'Dashboard', path: '/' },
      { icon: Shield, label: 'Safety Hub', path: '/safety-hub' },
      { icon: Activity, label: 'Command Center', path: '/enterprise' },
      { icon: Calendar, label: 'Project Schedule', path: '/project-schedule' },
    ]
  },
  {
    title: 'Incidents & Reporting',
    items: [
      { icon: AlertTriangle, label: 'Report Incident', path: '/report-incident' },
      { icon: FileText, label: 'Full Report', path: '/full-report' },
      { icon: Mic, label: 'Voice Report', path: '/voice-hazard' },
      { icon: Car, label: 'Vehicle Incident', path: '/vehicle-incident' },
      { icon: Building2, label: 'Property Incident', path: '/property-incident' },
      { icon: FileSearch, label: 'Investigations', path: '/investigation-reports' },
    ]
  },
  {
    title: 'Risk & Compliance',
    items: [
      { icon: AlertCircle, label: 'Risk Register', path: '/risk-register' },
      { icon: ClipboardCheck, label: 'Risk Assessment', path: '/risk-assessment' },
      { icon: Book, label: 'Regulations', path: '/regulations' },
      { icon: Scale, label: 'Compliance Gap', path: '/gap-analysis' },
      { icon: FileCheck, label: 'Permits', path: '/permit-to-work' },
      { icon: Beaker, label: 'Chemical SDS', path: '/chemical-sds' },
      { icon: Wind, label: 'Industrial Hygiene', path: '/industrial-hygiene' },
      { icon: ThumbsUp, label: 'BBS Observations', path: '/behavior-based-safety' },
      { icon: Layers, label: 'Bow Tie Analysis', path: '/bowtie-analysis' },
      { icon: ClipboardCheck, label: 'Quality Management', path: '/quality-management' },
    ]
  },
  {
    title: 'Environmental (ESG)',
    items: [
      { icon: Leaf, label: 'ESG Reporting', path: '/esg-reporting' },
      { icon: Factory, label: 'Emissions', path: '/emission-reports' },
      { icon: Droplets, label: 'SWPPP', path: '/swppp' },
      { icon: Recycle, label: 'EPA Dashboard', path: '/epa-dashboard' },
    ]
  },
  {
    title: 'Analytics & AI',
    items: [
      { icon: Brain, label: 'Predictive AI', path: '/predictive-safety' },
      { icon: Eye, label: 'Visual Audit', path: '/visual-audit' },
      { icon: BarChart3, label: 'Analytics', path: '/analytics' },
      { icon: TrendingUp, label: 'Trends', path: '/incident-trends' },
      { icon: Map, label: 'Heatmap', path: '/incident-heatmap' },
      { icon: Users, label: 'Retention Analytics', path: '/retention-analytics' },
      { icon: LineChart, label: 'Executive Reports', path: '/executive-reports' },
      { icon: FileDown, label: 'PDF Reports', path: '/automated-pdf-reports' },
    ]
  },
  {
    title: 'Tools & Settings',
    items: [
      { icon: Rocket, label: 'Self-Admin Platform', path: '/self-admin' },
      { icon: Calendar, label: 'Inspections', path: '/inspection-scheduling' },
      { icon: GraduationCap, label: 'Training', path: '/training' },
      { icon: BookOpen, label: 'AI Training Modules', path: '/ai-training-modules' },
      { icon: CalendarDays, label: 'Compliance Calendar', path: '/compliance-calendar' },
      { icon: Wrench, label: 'Sensors', path: '/sensor-config' },
      { icon: Mail, label: 'Email System', path: '/email-notifications' },
      { icon: FlaskConical, label: 'Pilot Program', path: '/pilot-program' },
      { icon: Lock, label: 'Data Security', path: '/data-security' },
      { icon: KeyRound, label: 'SSO & Auth', path: '/sso-login' },
      { icon: Megaphone, label: 'Hyper-Care Training', path: '/hyper-care-training' },
      { icon: WifiOff, label: 'Offline Sync Test', path: '/offline-sync-test' },
      { icon: GitBranch, label: 'V2 Roadmap', path: '/v2-roadmap' },
      { icon: Settings, label: 'Settings', path: '/organization' },
    ]
  }
];

// Initial notifications data
const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Safety Audit Due', message: 'Warehouse B audit scheduled for today', time: '10 min ago', type: 'warning', category: 'audit', unread: true },
  { id: 2, title: 'Incident Resolved', message: 'Chemical spill in Lab A has been resolved', time: '1 hour ago', type: 'success', category: 'safety', unread: true },
  { id: 3, title: 'Training Reminder', message: 'PPE training expires in 5 days', time: '2 hours ago', type: 'info', category: 'training', unread: false },
  { id: 4, title: 'CAPA Overdue', message: 'Corrective action CA-2026-003 is overdue', time: '3 hours ago', type: 'error', category: 'compliance', unread: false },
];

interface NavigationBarProps {
  onRefresh?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [notifSettings, setNotifSettings] = useState(loadNotificationSettings);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keep notifSettings in sync when NotificationSettings page saves changes
  useEffect(() => {
    const refresh = () => setNotifSettings(loadNotificationSettings());
    window.addEventListener('notificationSettingsChanged', refresh);
    // Also catch changes from other tabs via native storage event
    window.addEventListener('storage', (e) => {
      if (e.key === 'megsafe_notification_settings') refresh();
    });
    return () => {
      window.removeEventListener('notificationSettingsChanged', refresh);
    };
  }, []);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    navigate('/login');
  };

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.nav-dropdown') && !target.closest('.nav-trigger')) {
        setIsMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchOpen]);

  // Handle logo/refresh click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    if (onRefresh) {
      await onRefresh();
    } else {
      // Default: reload page data by navigating to current route
      window.location.reload();
    }
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Filter navigation items by search
  const filteredNavItems = searchQuery
    ? NAV_SECTIONS.flatMap(section => 
        section.items.filter(item => 
          item.label.toLowerCase().includes(searchQuery.toLowerCase())
        )
      )
    : [];

  const handleNavigation = (path: string) => {
    navigate(path);
    setIsMenuOpen(false);
    setIsSearchOpen(false);
    setSearchQuery('');
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Filter notifications by enabled category settings
  const visibleNotifications = useMemo(() => notifications.filter(n => {
    const cat = (n as any).category as string | undefined;
    if (cat === 'safety' && !notifSettings.safetyAlerts) return false;
    if (cat === 'training' && !notifSettings.trainingReminders) return false;
    if (cat === 'compliance' && !notifSettings.complianceUpdates) return false;
    if (cat === 'audit' && !notifSettings.auditNotifications) return false;
    if (cat === 'system' && !notifSettings.systemAlerts) return false;
    return true;
  }), [notifications, notifSettings]);

  const visibleUnreadCount = visibleNotifications.filter(n => n.unread).length;

  const markAsRead = (id: number) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, unread: false } : n)
    );
  };

  return (
    <>
      <motion.nav 
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 safe-top"
        style={{
          background: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(24px) saturate(1.6)',
          borderBottom: '1px solid rgba(6, 182, 212, 0.1)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.15), 0 0 1px rgba(6, 182, 212, 0.2)',
        }}
      >
        {/* Animated asymmetric accent line at top */}
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: '33%' }}
          transition={{ delay: 0.5, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="absolute top-0 left-0 h-[2.5px] bg-gradient-to-r from-cyan-500 via-cyan-400 to-transparent" 
        />
        
        <div className="px-4 md:px-5 h-[72px] flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            {/* Menu Button */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => { setIsMenuOpen(!isMenuOpen); setIsNotificationsOpen(false); }}
              className="nav-trigger p-2.5 -ml-2 rounded-xl transition-all duration-300 hover:bg-slate-800"
              aria-label="Open navigation menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-cyan-400" strokeWidth={1.75} />
              ) : (
                <Menu className="w-5 h-5 text-slate-300" strokeWidth={1.75} />
              )}
            </motion.button>
            
            {/* Logo - Bigger with refresh functionality */}
            <motion.button 
              onClick={handleRefresh}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-3 group cursor-pointer"
              aria-label="Refresh page"
            >
              {/* Logo Image */}
              <motion.div 
                className="relative"
                animate={isRefreshing ? { rotate: 360 } : {}}
                transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}
              >
                <img 
                  src="/logo.png" 
                  alt="Safety EHS" 
                  className="w-10 h-10 sm:w-12 sm:h-12 object-contain"
                />
                {isRefreshing && (
                  <motion.div 
                    className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <RefreshCw className="w-5 h-5 text-brand-500 animate-spin" />
                  </motion.div>
                )}
              </motion.div>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] sm:text-[11px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Safety EHS</span>
                  <motion.div
                    animate={{ opacity: [0.6, 1, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Sparkles className="w-3 h-3 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
                  </motion.div>
                </div>
                <h1 className="text-lg sm:text-xl font-semibold text-white tracking-tight leading-none group-hover:text-cyan-300 transition-colors font-display">
                  EHS Platform
                </h1>
              </div>
            </motion.button>
          </div>

          <div className="flex items-center gap-1 md:gap-1.5">
            {/* Search Button */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => { setIsSearchOpen(!isSearchOpen); setIsMenuOpen(false); setIsNotificationsOpen(false); }}
              className="nav-trigger p-2.5 rounded-xl transition-all duration-300 hover:bg-slate-800"
              aria-label="Search"
            >
              {isSearchOpen ? (
                <X className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
              ) : (
                <Search className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              )}
            </motion.button>

            {/* Notifications Button */}
            <motion.button 
              whileTap={{ scale: 0.9 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => {
                const opening = !isNotificationsOpen;
                setIsNotificationsOpen(opening);
                setIsMenuOpen(false);
                setIsSearchOpen(false);
                if (opening && visibleUnreadCount > 0) {
                  playNotificationSound();
                }
              }}
              className="nav-trigger p-2.5 rounded-xl relative transition-all duration-300 hover:bg-slate-800"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5 text-slate-400" strokeWidth={1.5} />
              {visibleUnreadCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: 'spring', stiffness: 500 }}
                  className="absolute top-1 right-1 flex h-4.5 w-4.5 items-center justify-center"
                >
                  <span 
                    className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-60"
                    style={{ animationDuration: `${1.5 / notifSettings.badgeAnimationSpeed}s` }}
                  ></span>
                  <span className="relative inline-flex rounded-full h-4.5 w-4.5 bg-gradient-to-br from-cyan-500 to-cyan-600 ring-2 ring-slate-900 shadow-sm text-[10px] font-bold text-white items-center justify-center">
                    {visibleUnreadCount}
                  </span>
                </motion.span>
              )}
            </motion.button>

            {/* User Profile Button */}
            <motion.button 
              whileTap={{ scale: 0.93 }}
              whileHover={{ scale: 1.05 }}
              onClick={() => navigate('/language')}
              className="ml-1 transition-all duration-300"
              aria-label="User profile"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)' }}>
                <User className="w-4 h-4 text-white relative z-10" strokeWidth={2} />
              </div>
            </motion.button>
          </div>
        </div>

        {/* Search Bar - Expandable */}
        <AnimatePresence>
          {isSearchOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden border-t border-cyan-500/10"
            >
              <div className="px-4 py-3 max-w-5xl mx-auto">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search pages, reports, features..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50 transition-all"
                  />
                </div>
                {/* Search Results */}
                {searchQuery && filteredNavItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-2 bg-slate-800 rounded-xl border border-slate-700 shadow-lg overflow-hidden"
                  >
                    {filteredNavItems.slice(0, 5).map((item) => (
                      <button
                        key={item.path}
                        onClick={() => handleNavigation(item.path)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-700 transition-colors text-left"
                      >
                        <item.icon className="w-5 h-5 text-cyan-400" />
                        <span className="text-sm font-medium text-slate-200">{item.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
                {searchQuery && filteredNavItems.length === 0 && (
                  <p className="mt-2 text-sm text-surface-400 text-center py-2">No results found</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>

      {/* Navigation Drawer */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="nav-dropdown fixed left-0 top-0 bottom-20 w-[85%] max-w-sm bg-slate-900 shadow-2xl z-50 overflow-y-auto border-r border-cyan-500/10"
            >
              {/* Drawer Header */}
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center shadow-glow-soft">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white">SafetyMEG</h2>
                      <p className="text-xs text-cyan-400/60">Navigation</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-800 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Navigation Sections */}
              <div className="p-4 space-y-6">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-[10px] font-bold text-cyan-400/50 uppercase tracking-wider mb-2 px-2">
                      {section.title}
                    </h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = location.pathname === item.path;
                        return (
                          <motion.button
                            key={item.path}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleNavigation(item.path)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              isActive
                                ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400'
                                : 'hover:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                            {isActive && (
                              <motion.div
                                layoutId="activeIndicator"
                                className="w-1.5 h-1.5 rounded-full bg-cyan-400"
                              />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Drawer Footer */}
              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/10 p-4 space-y-3">
                {user && (
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)' }}>
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 hover:text-red-300 transition-all text-sm font-medium disabled:opacity-50"
                >
                  <LogOut className="w-4 h-4" />
                  {isLoggingOut ? 'Signing out...' : 'Sign Out'}
                </button>
                <p className="text-xs text-center text-slate-500 font-mono">
                  SafetyMEG EHS Platform v3.4
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Notifications Panel */}
      <AnimatePresence>
        {isNotificationsOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsNotificationsOpen(false)}
              className="fixed inset-0 bg-black/20 z-40"
            />
            {/* Panel */}
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="nav-dropdown fixed top-20 right-4 w-[90%] max-w-sm bg-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden border border-cyan-500/15"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-500/10">
                <h3 className="font-semibold text-white">Notifications</h3>
                <span className="text-xs text-cyan-400 font-medium">{visibleUnreadCount} unread</span>
              </div>

              {/* Notifications List */}
              <div className="max-h-80 overflow-y-auto">
                {visibleNotifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-slate-500">
                    No notifications to show
                  </div>
                ) : (
                  visibleNotifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.04)' }}
                      onClick={() => markAsRead(notification.id)}
                      className={`px-4 py-3 border-b border-slate-800/50 cursor-pointer transition-colors relative ${
                        notification.unread
                          ? 'bg-cyan-500/8 border-l-2 border-l-cyan-500'
                          : 'border-l-2 border-l-transparent opacity-70'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 transition-opacity ${
                          notification.type === 'warning' ? 'bg-amber-400' :
                          notification.type === 'success' ? 'bg-emerald-400' :
                          notification.type === 'error' ? 'bg-red-400' : 'bg-blue-400'
                        } ${notification.unread ? 'opacity-100' : 'opacity-30'}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm truncate ${notification.unread ? 'font-semibold text-white' : 'font-normal text-slate-400'}`}>
                            {notification.title}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                            {notification.message}
                          </p>
                          <p className="text-[10px] text-slate-500 mt-1">
                            {notification.time}
                          </p>
                        </div>
                        {notification.unread && (
                          <span className="flex-shrink-0 w-2 h-2 rounded-full bg-cyan-400 mt-2" />
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Footer */}
              <button
                onClick={() => { navigate('/notifications'); setIsNotificationsOpen(false); }}
                className="w-full px-4 py-3 text-sm font-medium text-cyan-400 hover:bg-slate-800 transition-colors"
              >
                View all notifications
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
