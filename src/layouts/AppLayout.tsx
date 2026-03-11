import React from 'react';
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
export const AppLayout: React.FC<AppLayoutProps> = ({ children, onRefresh }) => (
  <>
    <NavigationBar onRefresh={onRefresh} />
    <div className="pb-20">{children}</div>
    <BottomTabNavigation />
  </>
);

export default AppLayout;
