import React from 'react';
import { motion } from 'framer-motion';

// Base skeleton component with shimmer animation
const SkeletonBase: React.FC<{ className?: string; style?: React.CSSProperties }> = ({ className = '', style }) => (
  <div 
    className={`animate-shimmer bg-gradient-to-r from-surface-100 via-surface-200/60 to-surface-100 bg-[length:200%_100%] rounded-lg ${className}`} 
    style={style}
  />
);

// Skeleton for stats cards
export const SkeletonCard: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-surface-raised backdrop-blur-xl p-5 rounded-3xl shadow-card border border-surface-border flex flex-col gap-3.5"
  >
    <SkeletonBase className="w-11 h-11 rounded-2xl" />
    <div className="space-y-2">
      <SkeletonBase className="h-8 w-20" />
      <SkeletonBase className="h-3 w-24" />
    </div>
  </motion.div>
);

// Skeleton for featured metric card
export const SkeletonMetricCard: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-gradient-to-br from-brand-600/80 via-brand-700/80 to-brand-800/80 p-6 rounded-3xl flex items-center justify-between"
  >
    <div className="space-y-2">
      <SkeletonBase className="h-12 w-28 bg-white/10" />
      <SkeletonBase className="h-3 w-20 bg-white/10" />
    </div>
    <SkeletonBase className="w-16 h-16 rounded-2xl bg-white/10" />
  </motion.div>
);

// Skeleton for quick action cards
export const SkeletonActionCard: React.FC<{ featured?: boolean }> = ({ featured = false }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`p-5 rounded-3xl h-[140px] flex flex-col justify-between ${
      featured 
        ? 'bg-gradient-to-br from-brand-600/80 to-brand-800/80 col-span-2' 
        : 'bg-surface-raised backdrop-blur-xl shadow-card border border-surface-border'
    }`}
  >
    <SkeletonBase className={`w-11 h-11 rounded-2xl ${featured ? 'bg-white/10' : ''}`} />
    <div className="space-y-2">
      <SkeletonBase className={`h-4 w-32 ${featured ? 'bg-white/10' : ''}`} />
      <SkeletonBase className={`h-3 w-24 ${featured ? 'bg-white/10' : ''}`} />
    </div>
  </motion.div>
);

// Skeleton for chart components
export const SkeletonChart: React.FC<{ height?: string }> = ({ height = 'h-48' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className={`bg-surface-raised backdrop-blur-xl rounded-3xl p-6 shadow-card border border-surface-border ${height}`}
  >
    <div className="flex items-center justify-between mb-4">
      <SkeletonBase className="h-5 w-32" />
      <SkeletonBase className="h-8 w-24 rounded-xl" />
    </div>
    <div className="flex items-end gap-2 h-[calc(100%-3rem)]">
      {[40, 65, 45, 80, 55, 70, 50].map((h, i) => (
        <SkeletonBase key={i} className="flex-1 rounded-t-lg" style={{ height: `${h}%` }} />
      ))}
    </div>
  </motion.div>
);

// Skeleton for incident cards
export const SkeletonIncidentCard: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-surface-raised backdrop-blur-xl rounded-3xl p-5 shadow-card border border-surface-border"
  >
    <div className="flex justify-between mb-3">
      <SkeletonBase className="h-6 w-16 rounded-lg" />
      <SkeletonBase className="h-6 w-20 rounded-lg" />
    </div>
    <SkeletonBase className="h-5 w-3/4 mb-3" />
    <div className="flex gap-4">
      <SkeletonBase className="h-4 w-24" />
      <SkeletonBase className="h-4 w-20" />
    </div>
  </motion.div>
);

// Skeleton for dark themed pages
export const SkeletonDark: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="min-h-screen bg-surface-950 p-8 space-y-8"
  >
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-4">
        <SkeletonBase className="w-12 h-12 rounded-2xl bg-surface-800" />
        <div className="space-y-2">
          <SkeletonBase className="h-6 w-48 bg-surface-800" />
          <SkeletonBase className="h-3 w-32 bg-surface-800" />
        </div>
      </div>
      <div className="flex gap-2">
        <SkeletonBase className="w-24 h-10 rounded-xl bg-surface-800" />
        <SkeletonBase className="w-24 h-10 rounded-xl bg-surface-800" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="h-64 bg-surface-900/50 border border-surface-800 rounded-3xl p-8 space-y-4">
          <SkeletonBase className="w-14 h-14 rounded-2xl bg-surface-800" />
          <SkeletonBase className="h-6 w-3/4 bg-surface-800" />
          <SkeletonBase className="h-12 w-full bg-surface-800" />
        </div>
      ))}
    </div>
  </motion.div>
);

// Skeleton for checklist
export const SkeletonChecklist: React.FC = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-surface-raised backdrop-blur-xl rounded-[2rem] p-6 shadow-card border border-surface-border"
  >
    <div className="flex justify-between items-center mb-6">
      <div className="space-y-2">
        <SkeletonBase className="h-5 w-40" />
        <SkeletonBase className="h-3 w-28" />
      </div>
      <SkeletonBase className="h-10 w-14" />
    </div>
    <SkeletonBase className="h-2.5 w-full rounded-full mb-6" />
    <div className="space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3.5 p-3.5">
          <SkeletonBase className="w-5.5 h-5.5 rounded-full" />
          <SkeletonBase className="h-4 flex-1" />
        </div>
      ))}
    </div>
  </motion.div>
);

// Full dashboard skeleton
export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-8 px-5 animate-pulse">
    {/* Stats row */}
    <div className="flex gap-3.5">
      <SkeletonCard />
      <SkeletonCard />
    </div>
    {/* Featured metric */}
    <SkeletonMetricCard />
    {/* Chart */}
    <SkeletonChart height="h-64" />
    {/* Quick actions */}
    <div className="grid grid-cols-2 gap-3">
      <SkeletonActionCard featured />
      <SkeletonActionCard />
      <SkeletonActionCard />
    </div>
    {/* Checklist */}
    <SkeletonChecklist />
  </div>
);

export default {
  SkeletonCard,
  SkeletonMetricCard,
  SkeletonActionCard,
  SkeletonChart,
  SkeletonIncidentCard,
  SkeletonDark,
  SkeletonChecklist,
  DashboardSkeleton,
};
