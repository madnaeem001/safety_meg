import React from 'react';
import { SMPageHeader } from '../components/ui/SMPageHeader';

type PageContainerMaxWidth = 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';

interface PageContainerProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  maxWidth?: PageContainerMaxWidth;
  children: React.ReactNode;
}

const MAX_WIDTH_CLASSES: Record<PageContainerMaxWidth, string> = {
  sm: 'max-w-2xl',
  md: 'max-w-4xl',
  lg: 'max-w-6xl',
  xl: 'max-w-7xl',
  '2xl': 'max-w-screen-2xl',
  full: 'w-full',
};

export const PageContainer: React.FC<PageContainerProps> = ({
  title,
  subtitle,
  actions,
  maxWidth = 'xl',
  children,
}) => {
  return (
    <div className="px-4 md:px-6 lg:px-8 py-6">
      <div className={`${MAX_WIDTH_CLASSES[maxWidth]} mx-auto`}>
        <SMPageHeader title={title} subtitle={subtitle} action={actions} divider />
        <div>{children}</div>
      </div>
    </div>
  );
};

export default PageContainer;