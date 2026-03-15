import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Shield, Bell, User } from 'lucide-react';
import { getBadgeAnimationDuration } from '../../data/mockNavigation';
import { notificationApiService } from '../../api/services/apiService';

interface TabItem {
  icon: React.ElementType;
  label: string;
  path: string;
}

const TABS: TabItem[] = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Shield, label: 'Safety Hub', path: '/safety-hub' },
  { icon: Bell, label: 'Notifications', path: '/notifications' },
  { icon: User, label: 'Profile', path: '/profile' },
];

export const BottomTabNavigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);
  const animationDuration = getBadgeAnimationDuration();

  useEffect(() => {
    notificationApiService.getAll({ read: false, limit: 99 })
      .then((items) => setUnreadCount(Array.isArray(items) ? items.length : 0))
      .catch(() => setUnreadCount(0));
  }, [location.pathname]);

  const handleTabPress = (path: string) => {
    // Trigger haptic feedback if available
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    navigate(path);
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 safe-area-bottom">
      {/* Gradient overlay for visual lift */}
      <div className="absolute inset-x-0 -top-8 h-8 bg-gradient-to-t from-slate-950/95 to-transparent pointer-events-none" />
      
      {/* Main tab bar - modernized with enhanced mobile transitions */}
      <div 
        className="transition-all duration-300"
        style={{ 
          background: 'rgba(15, 23, 42, 0.92)', 
          backdropFilter: 'blur(24px) saturate(1.6)',
          WebkitBackdropFilter: 'blur(24px) saturate(1.6)',
          borderTop: '1px solid rgba(6, 182, 212, 0.12)',
          boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2), 0 0 1px rgba(6, 182, 212, 0.15)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)'
        }}
      >
        <div className="flex items-center justify-around px-2 py-1.5 max-w-md mx-auto">
          {TABS.map((tab) => {
            const active = isActive(tab.path);
            const Icon = tab.icon;
            const showBadge = tab.path === '/notifications' && unreadCount > 0;

            return (
              <motion.button
                key={tab.path}
                onClick={() => handleTabPress(tab.path)}
                className={`
                  relative flex flex-col items-center justify-center
                  min-w-[68px] py-2.5 px-3 rounded-xl
                  touch-target transition-all duration-300
                  ${active 
                    ? 'text-cyan-400' 
                    : 'text-slate-500 hover:text-slate-300'
                  }
                `}
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                aria-label={tab.label}
                aria-current={active ? 'page' : undefined}
              >
                {/* Active indicator - modern pill */}
                {active && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-[3px] rounded-full"
                    style={{ background: 'linear-gradient(90deg, #06b6d4 0%, #0891b2 100%)', boxShadow: '0 0 8px rgba(6, 182, 212, 0.4)' }}
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}

                {/* Icon with badge */}
                <div className="relative">
                  <Icon 
                    className={`w-6 h-6 transition-all duration-300 ${active ? 'stroke-[2.25]' : 'stroke-[1.75]'}`} 
                  />
                  
                  {/* Notification badge with pulse animation */}
                  {showBadge && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ 
                        scale: [1, 1.15, 1],
                      }}
                      transition={{
                        scale: {
                          duration: animationDuration,
                          repeat: Infinity,
                          repeatType: "loop",
                          ease: "easeInOut",
                        },
                      }}
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] 
                        bg-red-500 text-white text-[10px] font-bold 
                        rounded-full flex items-center justify-center px-1
                        shadow-sm border-2 border-slate-900"
                    >
                      {/* Pulse ring animation */}
                      <span 
                        className="absolute inset-0 rounded-full bg-red-500 opacity-75"
                        style={{
                          animation: `ping ${animationDuration}s cubic-bezier(0, 0, 0.2, 1) infinite`
                        }}
                      />
                      <span className="relative">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    </motion.span>
                  )}
                </div>

                {/* Label */}
                <span className={`
                  mt-1 text-[10px] font-semibold tracking-wide
                  ${active ? 'text-cyan-400' : 'text-slate-500'}
                `}>
                  {tab.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default BottomTabNavigation;
