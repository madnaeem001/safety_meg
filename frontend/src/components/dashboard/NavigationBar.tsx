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

const INITIAL_NOTIFICATIONS = [
  { id: 1, title: 'Safety Audit Due', message: 'Warehouse B audit scheduled for today', time: '10 min ago', type: 'warning', category: 'audit', unread: true },
  { id: 2, title: 'Incident Resolved', message: 'Chemical spill in Lab A has been resolved', time: '1 hour ago', type: 'success', category: 'safety', unread: true },
];

interface NavigationBarProps {
  onRefresh?: () => void;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({ onRefresh }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuthStore();
  
  // 🔥 Completely Autonomous & Clean Local State 🔥
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifSettings, setNotifSettings] = useState(loadNotificationSettings);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Listen to path changes: Instantly close everything
  useEffect(() => {
    setIsDrawerOpen(false);
    setIsSearchOpen(false);
    setIsNotificationsOpen(false);
  }, [location.pathname]);

  // Lock body scroll when drawer is open (prevents background scroll on mobile)
  useEffect(() => {
    document.body.style.overflow = isDrawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isDrawerOpen]);

  // React Router v6 HashRouter inherently puts the path inside location.pathname
  const currentPath = location.pathname;

  useEffect(() => {
    const refresh = () => setNotifSettings(loadNotificationSettings());
    window.addEventListener('notificationSettingsChanged', refresh);
    return () => window.removeEventListener('notificationSettingsChanged', refresh);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => n.unread).length;
  const visibleNotifications = notifications;

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
        }}
      >
        <div className="px-4 md:px-5 h-[72px] flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-3">
            <motion.button 
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsDrawerOpen(true)}
              className="nav-trigger p-2.5 -ml-2 rounded-xl transition-all hover:bg-slate-800"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </motion.button>
            
            <motion.button onClick={() => { setIsRefreshing(true); if(onRefresh) onRefresh(); else window.location.reload(); setTimeout(() => setIsRefreshing(false), 1000); }} className="flex items-center gap-3 group cursor-pointer">
              <motion.div animate={isRefreshing ? { rotate: 360 } : {}} transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: "linear" } : {}}>
                <img src="/logo.png" alt="Safety EHS" className="w-10 h-10 object-contain" />
              </motion.div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-[0.2em]">Safety EHS</span>
                <h1 className="text-lg font-semibold text-white leading-none">EHS Platform</h1>
              </div>
            </motion.button>
          </div>

          <div className="flex items-center gap-1.5">
            <motion.button onClick={() => { setIsSearchOpen(!isSearchOpen); setIsDrawerOpen(false); setIsNotificationsOpen(false); }} className="p-2.5 rounded-xl hover:bg-slate-800">
              {isSearchOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Search className="w-5 h-5 text-slate-400" />}
            </motion.button>

            <motion.button onClick={() => { setIsNotificationsOpen(!isNotificationsOpen); setIsDrawerOpen(false); setIsSearchOpen(false); }} className="p-2.5 rounded-xl relative hover:bg-slate-800">
              <Bell className="w-5 h-5 text-slate-400" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 flex h-4.5 w-4.5 bg-cyan-500 rounded-full text-[10px] font-bold text-white items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </motion.button>

            <motion.button onClick={() => navigate('/language')} className="ml-1">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Autonomous Mobile Drawer */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            {/* Backdrop Layer */}
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setIsDrawerOpen(false)} 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]" 
            />
            
            {/* Drawer Menu */}
            <motion.div 
              initial={{ x: '-100%' }} 
              animate={{ x: 0 }} 
              exit={{ x: '-100%' }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }} 
              className="nav-dropdown fixed left-0 top-0 bottom-0 w-[85%] max-w-sm bg-slate-900 shadow-2xl z-[110] overflow-y-auto border-r border-cyan-500/10"
            >
              <div className="sticky top-0 bg-slate-900/95 backdrop-blur-xl border-b border-cyan-500/10 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="font-bold text-white">SafetyMEG</h2>
                      <p className="text-xs text-cyan-400/60">Navigation</p>
                    </div>
                  </div>
                  <button onClick={() => setIsDrawerOpen(false)} className="p-2 rounded-xl hover:bg-slate-800 transition-colors">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              <div className="p-4 space-y-6">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.title}>
                    <h3 className="text-[10px] font-bold text-cyan-400/50 uppercase tracking-wider mb-2 px-2">{section.title}</h3>
                    <div className="space-y-1">
                      {section.items.map((item) => {
                        const itemPath = item.path === '/' ? '/' : item.path.replace(/\/$/, '');
                        // Check if current route matches to turn blue
                        const isActive = currentPath === itemPath || (itemPath !== '/' && currentPath.startsWith(itemPath + '/'));
                        
                        return (
                          <motion.button
                            key={item.path}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => {
                              setIsDrawerOpen(false); // Close drawer first for immediate visual feedback
                              navigate(item.path);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                              isActive ? 'bg-cyan-500/10 border border-cyan-500/20 text-cyan-400' : 'hover:bg-slate-800 text-slate-400'
                            }`}
                          >
                            <item.icon className={`w-5 h-5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                            <span className="text-sm font-medium flex-1 text-left">{item.label}</span>
                            {isActive && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="sticky bottom-0 bg-slate-900/95 backdrop-blur-xl border-t border-cyan-500/10 p-4 space-y-3">
                {user && (
                  <div className="flex items-center gap-3 px-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-white truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                    </div>
                  </div>
                )}
                <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 text-sm font-medium">
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      
      {/* Add Notifications / Search Modals below if needed (kept them stripped to keep it lightweight) */}
    </>
  );
};