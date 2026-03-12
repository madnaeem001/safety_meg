import React, { useState } from 'react';
import { NavigationBar } from '../components/dashboard/NavigationBar';
import { BottomTabNavigation } from '../components/dashboard/BottomTabNavigation';

interface AppLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

/**
 * AppLayout — single source of truth for the authenticated shell.
 * Renders the sticky top NavigationBar once, the page content, and
 * the global bottom tab navigation bar for mobile/desktop.
 * All protected pages are wrapped here so individual pages never
 * need to import these shell components themselves.
 */
export const AppLayout: React.FC<AppLayoutProps> = ({ children, onRefresh }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const shiftedContentStyle = {
    transform: isMenuOpen ? 'translateX(min(22rem, calc(100vw - 3.5rem)))' : 'translateX(0)',
  };

  return (
    <div className="overflow-x-hidden bg-transparent">
      <NavigationBar
        onRefresh={onRefresh}
        isMenuOpen={isMenuOpen}
        onMenuToggle={() => setIsMenuOpen((current) => !current)}
        onMenuClose={() => setIsMenuOpen(false)}
      />
      <div
        className="pb-20 transition-transform duration-300 ease-out will-change-transform"
        style={shiftedContentStyle}
      >
        {children}
      </div>
      <BottomTabNavigation />
    </div>
  );
};

export default AppLayout;
