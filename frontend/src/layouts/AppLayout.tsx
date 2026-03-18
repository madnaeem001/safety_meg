import React, { useEffect, useState } from 'react';
import { NavigationBar } from '../components/dashboard/NavigationBar';

interface AppLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onRefresh }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDesktopSidebar, setIsDesktopSidebar] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(min-width: 768px)').matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateLayoutMode = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsDesktopSidebar(event.matches);
    };

    updateLayoutMode(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', updateLayoutMode);
      return () => mediaQuery.removeEventListener('change', updateLayoutMode);
    }

    mediaQuery.addListener(updateLayoutMode);
    return () => mediaQuery.removeListener(updateLayoutMode);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden text-text-primary transition-colors duration-300">
      <NavigationBar
        isSidebarOpen={isSidebarOpen}
        isDesktopSidebar={isDesktopSidebar}
        onToggleSidebar={() => setIsSidebarOpen((open) => !open)}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onRefresh={onRefresh}
      />

      <div
        className={[
          'flex min-h-screen flex-col transition-all duration-300 ease-in-out',
          isSidebarOpen && isDesktopSidebar ? 'md:ml-80' : 'ml-0',
        ].join(' ')}
      >
        <main className="flex-1 pb-20 transition-all duration-300 ease-in-out">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AppLayout;