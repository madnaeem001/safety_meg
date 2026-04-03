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
import { motion } from 'framer-motion';
import { useAuthStore } from '../../store/authStore';
import { loadNotificationSettings, playNotificationSound } from '../../data/mockNavigation';
import {
  incidentService,
  auditService,
  workersApiService,
  trainingService,
  type BackendIncidentRecord,
  type AuditRecord,
  type WorkerRecord,
  type TrainingExpiringRecord,
} from '../../api/services/apiService';
import { SMButton } from '../ui';

type SearchResultItem = {
  label: string;
  path: string;
  section: string;
  keywords: string;
  description?: string;
  icon: React.ComponentType<{ className?: string }>;
  kind: 'route' | 'incident' | 'audit' | 'worker' | 'training';
};

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
      { icon: CalendarDays, label: 'Audit Schedules', path: '/audit-schedules' },
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

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Safety Audit Due', message: 'Warehouse B audit scheduled for today', time: '10 min ago', type: 'warning', category: 'audit', unread: true },
  { id: 2, title: 'Incident Resolved', message: 'Chemical spill in Lab A has been resolved', time: '1 hour ago', type: 'success', category: 'safety', unread: true },
];

interface NavigationBarProps {
  onRefresh?: () => void;
  isSidebarOpen: boolean;
  isDesktopSidebar: boolean;
  onToggleSidebar: () => void;
  onCloseSidebar: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  onRefresh,
  isSidebarOpen,
  isDesktopSidebar,
  onToggleSidebar,
  onCloseSidebar,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  
  // 🔥 Completely Autonomous & Clean Local State 🔥
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifSettings, setNotifSettings] = useState(loadNotificationSettings);
  const [entitySearchData, setEntitySearchData] = useState<{
    incidents: BackendIncidentRecord[];
    audits: AuditRecord[];
    workers: WorkerRecord[];
    expiringRecords: TrainingExpiringRecord[];
    loading: boolean;
    loaded: boolean;
  }>({
    incidents: [],
    audits: [],
    workers: [],
    expiringRecords: [],
    loading: false,
    loaded: false,
  });
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchPanelRef = useRef<HTMLDivElement>(null);
  const notificationsPanelRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  // Listen to path changes: Instantly close everything
  useEffect(() => {
    if (!isDesktopSidebar) {
      onCloseSidebar();
    }
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  }, [isDesktopSidebar, location.pathname, onCloseSidebar]);

  // React Router v6 HashRouter inherently puts the path inside location.pathname
  const currentPath = location.pathname;

  useEffect(() => {
    const refresh = () => setNotifSettings(loadNotificationSettings());
    window.addEventListener('notificationSettingsChanged', refresh);
    return () => window.removeEventListener('notificationSettingsChanged', refresh);
  }, []);

  useEffect(() => {
    if (!isSearchOpen) {
      return;
    }
    const frame = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [isSearchOpen]);

  useEffect(() => {
    let cancelled = false;

    if (!isSearchOpen || entitySearchData.loaded || entitySearchData.loading) {
      return;
    }

    setEntitySearchData((current) => ({ ...current, loading: true }));

    Promise.allSettled([
      incidentService.getAll({ limit: 20 }),
      auditService.getAll(),
      workersApiService.getAll({ status: 'active' }),
      trainingService.getExpiring(30),
    ]).then(([incidentsResult, auditsResult, workersResult, expiringResult]) => {
      if (cancelled) {
        return;
      }

      setEntitySearchData({
        incidents: incidentsResult.status === 'fulfilled' ? incidentsResult.value.data.slice(0, 20) : [],
        audits: auditsResult.status === 'fulfilled' ? auditsResult.value.data.slice(0, 20) : [],
        workers: workersResult.status === 'fulfilled' ? workersResult.value.data.slice(0, 20) : [],
        expiringRecords: expiringResult.status === 'fulfilled' ? expiringResult.value.data.slice(0, 20) : [],
        loading: false,
        loaded: true,
      });
    });

    return () => {
      cancelled = true;
    };
  }, [entitySearchData.loaded, entitySearchData.loading, isSearchOpen]);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchPanelRef.current && !searchPanelRef.current.contains(target)) {
        setIsSearchOpen(false);
      }
      if (notificationsPanelRef.current && !notificationsPanelRef.current.contains(target)) {
        if (!notificationButtonRef.current || !notificationButtonRef.current.contains(target)) {
          setIsNotificationsOpen(false);
        }
      }
    };

    if (isSearchOpen || isNotificationsOpen) {
      document.addEventListener('mousedown', handlePointerDown);
    }

    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [isNotificationsOpen, isSearchOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };

    if (isSearchOpen || isNotificationsOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => window.removeEventListener('keydown', handleEscape);
  }, [isNotificationsOpen, isSearchOpen]);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleSearchOpen = () => {
    setIsSearchOpen((current) => !current);
    setIsNotificationsOpen(false);
    onCloseSidebar();
  };

  const handleNotificationsToggle = () => {
    setIsNotificationsOpen((current) => !current);
    setIsSearchOpen(false);
    onCloseSidebar();
  };

  const markNotificationRead = (id: number) => {
    setNotifications((current) => current.map((item) => (
      item.id === id ? { ...item, unread: false } : item
    )));
  };

  const markAllNotificationsRead = () => {
    setNotifications((current) => current.map((item) => ({ ...item, unread: false })));
  };

  const searchItems = useMemo<SearchResultItem[]>(() => {
    const items = NAV_SECTIONS.flatMap((section) => section.items.map((item) => ({
      label: item.label,
      path: item.path,
      section: section.title,
      keywords: [section.title, item.label, item.path]
        .join(' ')
        .toLowerCase(),
      icon: item.icon,
      kind: 'route' as const,
    })));

    const incidentItems = entitySearchData.incidents.map((incident) => ({
      label: `${incident.incidentType} #${incident.id}`,
      path: '/full-report',
      section: 'Incidents',
      keywords: [
        incident.incidentType,
        incident.description,
        incident.location,
        incident.department,
        incident.status,
        incident.severity,
        String(incident.id),
      ].filter(Boolean).join(' ').toLowerCase(),
      description: `${incident.severity} • ${incident.location} • ${incident.status}`,
      icon: AlertTriangle,
      kind: 'incident' as const,
    }));

    const auditItems = entitySearchData.audits.map((audit) => ({
      label: audit.auditNumber ? `${audit.auditNumber} - ${audit.title}` : audit.title,
      path: '/safety-audit',
      section: 'Audits',
      keywords: [
        audit.auditNumber,
        audit.title,
        audit.auditType,
        audit.department,
        audit.location,
        audit.leadAuditor,
        audit.status,
      ].filter(Boolean).join(' ').toLowerCase(),
      description: `${audit.auditType} • ${audit.location} • ${audit.status}`,
      icon: ClipboardCheck,
      kind: 'audit' as const,
    }));

    const workerItems = entitySearchData.workers.map((worker) => ({
      label: worker.name,
      path: '/training',
      section: 'Employees',
      keywords: [
        worker.name,
        worker.employeeId,
        worker.email,
        worker.department,
        worker.role,
        worker.jobTitle,
        worker.status,
      ].filter(Boolean).join(' ').toLowerCase(),
      description: `${worker.employeeId} • ${worker.department || 'No department'} • ${worker.role}`,
      icon: Users,
      kind: 'worker' as const,
    }));

    const trainingItems = entitySearchData.expiringRecords.map((record) => ({
      label: `${record.employeeName} - ${record.courseName}`,
      path: '/training',
      section: 'Training',
      keywords: [
        record.employeeName,
        record.employeeId,
        record.courseName,
        record.courseCode,
        record.role,
        record.department,
        `${record.daysUntilExpiration} days`,
      ].filter(Boolean).join(' ').toLowerCase(),
      description: `${record.courseCode} • ${record.daysUntilExpiration} days left • ${record.role}`,
      icon: GraduationCap,
      kind: 'training' as const,
    }));

    return [
      ...items,
      { label: 'My Profile', path: '/profile', section: 'Account', keywords: 'profile account user settings me personal', icon: User, kind: 'route' },
      { label: 'Notifications', path: '/notifications', section: 'Account', keywords: 'notifications alerts bell inbox center', icon: Bell, kind: 'route' },
      { label: 'Organization Settings', path: '/organization', section: 'Account', keywords: 'organization settings preferences company admin', icon: Settings, kind: 'route' },
      ...incidentItems,
      ...auditItems,
      ...workerItems,
      ...trainingItems,
    ];
  }, [entitySearchData.audits, entitySearchData.expiringRecords, entitySearchData.incidents, entitySearchData.workers]);

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!normalizedQuery) {
      return searchItems.slice(0, 10);
    }

    return searchItems
      .map((item) => {
        const label = item.label.toLowerCase();
        const section = item.section.toLowerCase();
        const description = item.description?.toLowerCase() ?? '';
        const exactScore = label === normalizedQuery ? 10 : 0;
        const prefixScore = label.startsWith(normalizedQuery) ? 6 : 0;
        const labelScore = label.includes(normalizedQuery) ? 4 : 0;
        const sectionScore = section.includes(normalizedQuery) ? 2 : 0;
        const descriptionScore = description.includes(normalizedQuery) ? 2 : 0;
        const keywordScore = item.keywords.includes(normalizedQuery) ? 1 : 0;
        const kindBonus = item.kind === 'route' ? 0 : 1;
        return {
          ...item,
          score: exactScore + prefixScore + labelScore + sectionScore + descriptionScore + keywordScore + kindBonus,
        };
      })
      .filter((item) => item.score > 0)
      .sort((left, right) => right.score - left.score || left.label.localeCompare(right.label))
      .slice(0, 10);
  }, [normalizedQuery, searchItems]);

  const handleSearchNavigate = (path: string) => {
    setIsSearchOpen(false);
    setSearchQuery('');
    navigate(path);
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (searchResults.length > 0) {
      handleSearchNavigate(searchResults[0].path);
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const visibleNotifications = notifications;

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ x: isSidebarOpen ? 0 : '-100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 230 }}
        className={[
          'nav-dropdown fixed left-0 top-0 bottom-0 z-[60] overflow-y-auto border-r border-surface-border bg-surface-raised shadow-modal transition-colors duration-300',
          'w-[85%] max-w-sm md:w-80 md:max-w-none',
          isSidebarOpen ? 'pointer-events-auto' : 'pointer-events-none',
        ].join(' ')}
      >
        <div className="sticky top-0 bg-surface-overlay border-b border-surface-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-text-primary">SafetyMEG</h2>
                <p className="text-xs text-text-secondary">Navigation</p>
              </div>
            </div>
            <SMButton variant="ghost" size="sm" onClick={onCloseSidebar} aria-label="Close navigation menu" className="p-2 rounded-xl">
              <X className="w-5 h-5" />
            </SMButton>
          </div>
        </div>

        <div className="p-4 space-y-6">
          {NAV_SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2 px-2">{section.title}</h3>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const itemPath = item.path === '/' ? '/' : item.path.replace(/\/$/, '');
                  const isActive = currentPath === itemPath || (itemPath !== '/' && currentPath.startsWith(itemPath + '/'));

                  return (
                    <motion.button
                      key={item.path}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (!isDesktopSidebar) {
                          onCloseSidebar();
                        }
                        navigate(item.path);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                        isActive ? 'bg-accent-50 border border-accent-200 text-accent-700' : 'hover:bg-surface-overlay text-text-secondary'
                      }`}
                    >
                      <item.icon className={`w-5 h-5 ${isActive ? 'text-accent-700' : 'text-text-muted'}`} />
                      <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                      {isActive && <div className="w-1.5 h-1.5 rounded-full bg-accent" />}
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-0 bg-surface-overlay border-t border-surface-border p-4 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-text-primary truncate">{user.fullName}</p>
                <p className="text-xs text-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          )}
          <SMButton variant="danger" onClick={handleLogout} className="w-full">
            <LogOut className="w-4 h-4" /> Sign Out
          </SMButton>
        </div>
      </motion.aside>

      <motion.nav 
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="sticky top-0 z-50 safe-top bg-surface-raised border-b border-surface-border shadow-sm transition-colors duration-300"
        style={{
          backdropFilter: 'blur(24px) saturate(1.3)',
        }}
      >
        <div className="relative h-[72px] w-full px-4 md:px-5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <motion.button 
              type="button"
              whileTap={{ scale: 0.9 }}
              onClick={onToggleSidebar}
              aria-label={isSidebarOpen ? 'Close navigation menu' : 'Open navigation menu'}
              className="nav-trigger p-2.5 -ml-2 rounded-xl transition-all hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            >
              {isSidebarOpen ? <X className="w-5 h-5 text-accent" /> : <Menu className="w-5 h-5 text-text-secondary" />}
            </motion.button>
            
            <motion.button type="button" onClick={() => { setIsRefreshing(true); if(onRefresh) onRefresh(); else window.location.reload(); setTimeout(() => setIsRefreshing(false), 1000); }} aria-label="Refresh current page" className="flex items-center gap-3 group cursor-pointer min-w-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70 rounded-xl">
              <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                <img src="/logo.png" alt="Safety EHS" className="w-10 h-10 object-contain" />
              </motion.div>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em] truncate">Safety EHS</span>
                <h1 className="text-lg font-semibold text-text-primary leading-none truncate">EHS Platform</h1>
              </div>
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <motion.button type="button" onClick={handleSearchOpen} aria-label={isSearchOpen ? 'Close search' : 'Open search'} className="p-2.5 rounded-xl hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              {isSearchOpen ? <X className="w-5 h-5 text-accent" /> : <Search className="w-5 h-5 text-text-secondary" />}
            </motion.button>

            <motion.button ref={notificationButtonRef} type="button" onClick={handleNotificationsToggle} aria-label={isNotificationsOpen ? 'Close notifications' : 'Open notifications'} className="p-2.5 rounded-xl relative hover:bg-surface-overlay focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              <Bell className="w-5 h-5 text-text-secondary" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-bold bg-red-500 text-white">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <motion.button type="button" onClick={() => navigate('/profile')} aria-label="Open user profile" className="ml-1 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/70">
              <div className="w-10 h-10 rounded-xl bg-surface-overlay border border-surface-border flex items-center justify-center">
                <User className="w-4 h-4 text-text-primary" />
              </div>
            </motion.button>
          </div>

          {isSearchOpen && (
            <div ref={searchPanelRef} className="absolute left-4 right-4 top-[calc(100%+0.75rem)] z-[70] md:left-auto md:right-5 md:w-[28rem]">
              <div className="rounded-2xl border border-surface-border bg-surface-overlay p-3 shadow-modal backdrop-blur-xl">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                  <input
                    ref={searchInputRef}
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search pages, tools, reports, settings..."
                    className="w-full rounded-xl border border-surface-border bg-surface-raised py-3 pl-10 pr-3 text-sm text-text-primary outline-none transition-colors placeholder:text-text-muted focus:border-accent-300"
                  />
                </form>
                <div className="mt-3 max-h-[22rem] overflow-y-auto">
                  {entitySearchData.loading && normalizedQuery && (
                    <div className="mb-3 rounded-xl border border-surface-border bg-surface-raised px-3 py-2 text-xs text-text-muted">
                      Searching incidents, audits, employees, and training records...
                    </div>
                  )}
                  {searchResults.length > 0 ? (
                    <div className="space-y-1">
                      {searchResults.map((result) => (
                        <button
                          key={`${result.path}-${result.label}`}
                          type="button"
                          onClick={() => handleSearchNavigate(result.path)}
                          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors hover:bg-surface-raised"
                        >
                          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-surface-raised border border-surface-border">
                            <result.icon className="h-4 w-4 text-accent" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-sm font-semibold text-text-primary">{result.label}</div>
                            <div className="truncate text-xs text-text-muted">
                              {result.section}{result.description ? ` • ${result.description}` : ''}
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 flex-shrink-0 text-text-muted" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed border-surface-border px-4 py-6 text-center">
                      <Search className="mx-auto mb-2 h-5 w-5 text-text-muted" />
                      <div className="text-sm font-medium text-text-primary">No matching pages found</div>
                      <div className="mt-1 text-xs text-text-muted">Try terms like incident, audit, training, settings, profile.</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {isNotificationsOpen && (
            <div ref={notificationsPanelRef} className="absolute right-4 top-[calc(100%+0.75rem)] z-[70] w-[min(24rem,calc(100vw-2rem))] md:right-5">
              <div className="rounded-2xl border border-surface-border bg-surface-overlay p-3 shadow-modal backdrop-blur-xl">
                <div className="mb-3 flex items-start justify-between gap-3 px-1">
                  <div>
                    <div className="text-sm font-semibold text-text-primary">Notifications</div>
                    <div className="text-xs text-text-muted">{unreadCount} unread updates</div>
                  </div>
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="text-xs font-semibold text-accent transition-colors hover:text-accent-700"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2">
                  {visibleNotifications.map((notification) => (
                    <button
                      key={notification.id}
                      type="button"
                      onClick={() => {
                        markNotificationRead(notification.id);
                        setIsNotificationsOpen(false);
                        navigate('/notifications');
                      }}
                      className="flex w-full items-start gap-3 rounded-xl border border-surface-border bg-surface-raised px-3 py-3 text-left transition-colors hover:bg-surface-base"
                    >
                      <div className={`mt-0.5 h-2.5 w-2.5 flex-shrink-0 rounded-full ${notification.unread ? 'bg-danger' : 'bg-surface-border'}`} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-3">
                          <div className="truncate text-sm font-semibold text-text-primary">{notification.title}</div>
                          <div className="flex-shrink-0 text-[10px] text-text-muted">{notification.time}</div>
                        </div>
                        <div className="mt-1 text-xs text-text-secondary line-clamp-2">{notification.message}</div>
                        <div className="mt-2 flex items-center justify-between gap-3">
                          <span className="rounded-full bg-surface-base px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted">
                            {notification.category}
                          </span>
                          {notification.unread && <span className="text-[10px] font-semibold text-accent">New</span>}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="mt-3 border-t border-surface-border pt-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/notifications');
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-text-primary transition-colors hover:bg-surface-raised"
                  >
                    <span>Open notification center</span>
                    <ChevronRight className="h-4 w-4 text-text-muted" />
                  </button>
                  {!notifSettings.enabled && (
                    <div className="mt-2 rounded-xl border border-warning/20 bg-warning/10 px-3 py-2 text-xs text-warning">
                      Notifications are currently muted in settings.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.nav>

    </>
  );
};