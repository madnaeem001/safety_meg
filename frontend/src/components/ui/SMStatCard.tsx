import React from 'react';
import { SMBadge } from './SMBadge';
import { SMCard, SMCardBody } from './SMCard';
import { SMSkeleton } from './SMSkeleton';

export type SMStatCardTrend = 'up' | 'down' | 'neutral';
export type SMStatCardVariant = 'default' | 'accent' | 'success' | 'warning' | 'danger';

export interface SMStatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  change?: string;
  trend?: SMStatCardTrend;
  icon?: React.ReactNode;
  variant?: SMStatCardVariant;
  loading?: boolean;
}

const VARIANT_STYLES: Record<SMStatCardVariant, { iconBg: string; iconText: string }> = {
  default: {
    iconBg: 'bg-accent/10',
    iconText: 'text-accent',
  },
  accent: {
    iconBg: 'bg-accent/10',
    iconText: 'text-accent',
  },
  success: {
    iconBg: 'bg-success/10',
    iconText: 'text-success',
  },
  warning: {
    iconBg: 'bg-warning/10',
    iconText: 'text-warning',
  },
  danger: {
    iconBg: 'bg-danger/10',
    iconText: 'text-danger',
  },
};

const TREND_BADGE_VARIANT: Record<SMStatCardTrend, 'success' | 'danger' | 'neutral'> = {
  up: 'success',
  down: 'danger',
  neutral: 'neutral',
};

export const SMStatCard = React.forwardRef<HTMLDivElement, SMStatCardProps>(
  (
    {
      label,
      value,
      change,
      trend = 'neutral',
      icon,
      variant = 'default',
      loading = false,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const styles = VARIANT_STYLES[variant];

    return (
      <SMCard ref={ref} className={className} {...rest}>
        <SMCardBody className="space-y-5">
          <div className="flex items-start justify-between gap-3">
            <div className={`inline-flex rounded-xl p-2.5 ${styles.iconBg} ${styles.iconText}`}>
              {icon}
            </div>

            {change && (
              <SMBadge variant={TREND_BADGE_VARIANT[trend]} size="sm">
                {change}
              </SMBadge>
            )}
          </div>

          <div>
            {loading ? (
              <SMSkeleton className="h-8 w-24 rounded-lg" />
            ) : (
              <div className="text-3xl font-bold text-text-primary">
                {value}
              </div>
            )}
            <p className="mt-1 text-sm text-text-secondary">{label}</p>
          </div>
        </SMCardBody>
      </SMCard>
    );
  },
);

SMStatCard.displayName = 'SMStatCard';

export default SMStatCard;