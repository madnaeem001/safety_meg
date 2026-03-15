import React from 'react';

interface AppLayoutProps {
  children: React.ReactNode;
  onRefresh?: () => void;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="overflow-x-hidden bg-transparent">
      <div className="pb-20 transition-all duration-300">
        {children}
      </div>
    </div>
  );
};

export default AppLayout;