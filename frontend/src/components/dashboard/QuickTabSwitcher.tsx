import React from 'react';
import { Bell, Brain, ClipboardCheck, FileText, Leaf, Settings, Shield, Target } from 'lucide-react';
import { SMButton } from '../ui';

export type MainSectionType = 'safety' | 'environmental' | 'quality' | 'project' | 'compliance-hub' | 'ai-analytics' | 'alerts' | 'tools';

interface QuickTabSwitcherProps { currentSection: MainSectionType; onChange: (section: MainSectionType) => void; badges?: Partial<Record<MainSectionType, number>>; }

const TABS = [
  { id: 'safety', label: 'Safety', icon: Shield },
  { id: 'environmental', label: 'Environmental', icon: Leaf },
  { id: 'quality', label: 'Quality', icon: ClipboardCheck },
  { id: 'project', label: 'Projects', icon: Target },
  { id: 'compliance-hub', label: 'Compliance', icon: FileText },
  { id: 'ai-analytics', label: 'AI & Analytics', icon: Brain },
  { id: 'alerts', label: 'Alerts', icon: Bell },
  { id: 'tools', label: 'Tools', icon: Settings },
] as const;

export const QuickTabSwitcher: React.FC<QuickTabSwitcherProps> = ({ currentSection, onChange, badges = {} }) => (
  <div className="flex gap-1.5 overflow-x-auto px-1 py-2 scrollbar-hide">
    {TABS.map((tab) => {
      const Icon = tab.icon;
      const active = currentSection === tab.id;
      const badge = badges[tab.id];
      return (
        <SMButton key={tab.id} variant={active ? 'secondary' : 'ghost'} size="sm" onClick={() => onChange(tab.id)} className={active ? 'border-accent-200 bg-accent-50 text-accent-700 dark:bg-accent-950/30 dark:text-accent-300' : ''}>
          <Icon className="h-4 w-4" />
          <span>{tab.label}</span>
          {badge ? <span className="flex h-4 w-4 items-center justify-center rounded-full bg-danger text-white text-xs">{badge > 9 ? '9+' : badge}</span> : null}
        </SMButton>
      );
    })}
  </div>
);

export default QuickTabSwitcher;
