import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Star,
  TrendingUp,
  TrendingDown,
  Users,
  Shield,
  Target,
  Flame,
  Zap,
  Crown,
  Gift,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Calendar,
  ChevronRight,
  ChevronDown,
  Filter,
  Search,
  BarChart3,
  Activity,
  Eye,
  Heart,
  ThumbsUp,
  MessageSquare
} from 'lucide-react';

// Types
interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  department: string;
  role: string;
  safetyScore: number;
  previousScore: number;
  rank: number;
  previousRank: number;
  streak: number;
  badges: Badge[];
  stats: MemberStats;
  level: number;
  xp: number;
  xpToNextLevel: number;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedDate: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface MemberStats {
  nearMissReported: number;
  safetyObservations: number;
  trainingsCompleted: number;
  hazardsIdentified: number;
  incidentFree: number; // days
  auditsParticipated: number;
}

interface Team {
  id: string;
  name: string;
  department: string;
  score: number;
  previousScore: number;
  rank: number;
  memberCount: number;
  metrics: TeamMetrics;
}

interface TeamMetrics {
  trir: number;
  nearMissRate: number;
  trainingCompliance: number;
  auditScore: number;
}

// Mock data
const mockBadges: Badge[] = [
  { id: 'b1', name: 'Safety Champion', icon: '🏆', description: 'Top safety performer for 3 consecutive months', earnedDate: '2026-01-15', rarity: 'legendary' },
  { id: 'b2', name: 'Eagle Eye', icon: '👁️', description: 'Reported 50+ hazards', earnedDate: '2026-01-10', rarity: 'epic' },
  { id: 'b3', name: 'Training Star', icon: '⭐', description: 'Completed all required trainings ahead of schedule', earnedDate: '2026-01-05', rarity: 'rare' },
  { id: 'b4', name: 'Near-Miss Hero', icon: '🦸', description: 'Reported 25+ near misses', earnedDate: '2025-12-20', rarity: 'rare' },
  { id: 'b5', name: 'Team Player', icon: '🤝', description: 'Participated in 10+ safety audits', earnedDate: '2025-12-15', rarity: 'common' },
  { id: 'b6', name: 'Streak Master', icon: '🔥', description: '100 days incident-free', earnedDate: '2025-11-30', rarity: 'epic' }
];

const generateMockMembers = (): TeamMember[] => {
  const names = [
    'Sarah Chen', 'Michael Torres', 'Emily Johnson', 'David Kim', 'Jessica Williams',
    'Robert Brown', 'Amanda Garcia', 'James Wilson', 'Lisa Anderson', 'Carlos Martinez',
    'Rachel Taylor', 'Kevin Lee', 'Michelle Davis', 'Daniel Thompson', 'Jennifer White'
  ];
  const departments = ['Operations', 'Maintenance', 'Warehouse', 'R&D', 'Admin', 'Production'];
  const roles = ['Safety Lead', 'Supervisor', 'Technician', 'Manager', 'Specialist', 'Coordinator'];

  return names.map((name, index) => {
    const score = Math.floor(Math.random() * 30) + 70;
    const previousScore = score + (Math.random() > 0.5 ? -5 : 5);
    const rank = index + 1;
    
    return {
      id: `m${index + 1}`,
      name,
      avatar: name.split(' ').map(n => n[0]).join(''),
      department: departments[index % departments.length],
      role: roles[index % roles.length],
      safetyScore: score,
      previousScore,
      rank,
      previousRank: rank + (Math.random() > 0.5 ? 1 : -1),
      streak: Math.floor(Math.random() * 90) + 10,
      badges: mockBadges.slice(0, Math.floor(Math.random() * 4) + 2),
      stats: {
        nearMissReported: Math.floor(Math.random() * 20) + 5,
        safetyObservations: Math.floor(Math.random() * 50) + 20,
        trainingsCompleted: Math.floor(Math.random() * 10) + 5,
        hazardsIdentified: Math.floor(Math.random() * 30) + 10,
        incidentFree: Math.floor(Math.random() * 200) + 30,
        auditsParticipated: Math.floor(Math.random() * 15) + 3
      },
      level: Math.floor(score / 10),
      xp: Math.floor(Math.random() * 500) + 100,
      xpToNextLevel: 500
    };
  }).sort((a, b) => b.safetyScore - a.safetyScore);
};

const mockTeams: Team[] = [
  { id: 't1', name: 'Operations Alpha', department: 'Operations', score: 94, previousScore: 91, rank: 1, memberCount: 25, metrics: { trir: 1.8, nearMissRate: 15, trainingCompliance: 98, auditScore: 92 } },
  { id: 't2', name: 'Maintenance Crew', department: 'Maintenance', score: 91, previousScore: 89, rank: 2, memberCount: 18, metrics: { trir: 2.1, nearMissRate: 12, trainingCompliance: 95, auditScore: 88 } },
  { id: 't3', name: 'Warehouse Warriors', department: 'Warehouse', score: 88, previousScore: 90, rank: 3, memberCount: 32, metrics: { trir: 2.5, nearMissRate: 18, trainingCompliance: 92, auditScore: 85 } },
  { id: 't4', name: 'R&D Innovators', department: 'R&D', score: 92, previousScore: 88, rank: 4, memberCount: 15, metrics: { trir: 1.5, nearMissRate: 8, trainingCompliance: 100, auditScore: 95 } },
  { id: 't5', name: 'Production Panthers', department: 'Production', score: 85, previousScore: 82, rank: 5, memberCount: 40, metrics: { trir: 3.0, nearMissRate: 20, trainingCompliance: 88, auditScore: 82 } }
].sort((a, b) => b.score - a.score).map((t, i) => ({ ...t, rank: i + 1 }));

// Components
const RankBadge: React.FC<{ rank: number; size?: 'sm' | 'md' | 'lg' }> = ({ rank, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-8 h-8 text-sm',
    lg: 'w-12 h-12 text-lg'
  };

  if (rank === 1) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center text-white font-bold shadow-lg`}>
        <Crown className={size === 'lg' ? 'w-6 h-6' : 'w-4 h-4'} />
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-slate-300 to-slate-400 flex items-center justify-center text-white font-bold shadow-lg`}>
        {rank}
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-amber-600 to-amber-700 flex items-center justify-center text-white font-bold shadow-lg`}>
        {rank}
      </div>
    );
  }
  return (
    <div className={`${sizeClasses[size]} rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold`}>
      {rank}
    </div>
  );
};

const BadgeDisplay: React.FC<{ badge: Badge }> = ({ badge }) => {
  const rarityColors = {
    common: 'bg-slate-100 border-slate-300 text-slate-600',
    rare: 'bg-blue-50 border-blue-300 text-blue-600',
    epic: 'bg-purple-50 border-purple-300 text-purple-600',
    legendary: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-yellow-400 text-amber-700'
  };

  return (
    <div className={`px-2 py-1 rounded-lg border text-xs font-medium ${rarityColors[badge.rarity]}`} title={badge.description}>
      <span className="mr-1">{badge.icon}</span>
      {badge.name}
    </div>
  );
};

const MemberCard: React.FC<{ member: TeamMember; expanded: boolean; onToggle: () => void }> = ({ member, expanded, onToggle }) => {
  const rankChange = member.previousRank - member.rank;
  
  return (
    <motion.div
      layout
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden"
    >
      <div
        onClick={onToggle}
        className="p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <RankBadge rank={member.rank} />
          
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-bold text-lg">
            {member.avatar}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">{member.name}</h3>
              {member.streak >= 30 && (
                <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  <Flame className="w-3 h-3" />
                  {member.streak}d
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">{member.role} • {member.department}</p>
          </div>

          <div className="text-right">
            <div className="text-2xl font-bold text-slate-900 dark:text-white">{member.safetyScore}</div>
            <div className={`flex items-center justify-end gap-1 text-sm ${
              rankChange > 0 ? 'text-emerald-600' : rankChange < 0 ? 'text-red-600' : 'text-slate-500'
            }`}>
              {rankChange > 0 ? <TrendingUp className="w-4 h-4" /> : rankChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
              {rankChange !== 0 && <span>{Math.abs(rankChange)} {rankChange > 0 ? 'up' : 'down'}</span>}
              {rankChange === 0 && <span>No change</span>}
            </div>
          </div>

          <ChevronRight className={`w-5 h-5 text-slate-400 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-slate-200 dark:border-slate-700"
          >
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50">
              {/* Level Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Level {member.level}
                  </span>
                  <span className="text-xs text-slate-500">
                    {member.xp}/{member.xpToNextLevel} XP
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(member.xp / member.xpToNextLevel) * 100}%` }}
                    className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-amber-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{member.stats.nearMissReported}</p>
                  <p className="text-xs text-slate-500">Near Misses</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <Eye className="w-5 h-5 text-blue-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{member.stats.safetyObservations}</p>
                  <p className="text-xs text-slate-500">Observations</p>
                </div>
                <div className="text-center p-3 bg-white dark:bg-slate-800 rounded-lg">
                  <Shield className="w-5 h-5 text-emerald-500 mx-auto mb-1" />
                  <p className="text-lg font-bold text-slate-900 dark:text-white">{member.stats.incidentFree}</p>
                  <p className="text-xs text-slate-500">Days Safe</p>
                </div>
              </div>

              {/* Badges */}
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-2">Earned Badges</p>
                <div className="flex flex-wrap gap-2">
                  {member.badges.map((badge) => (
                    <BadgeDisplay key={badge.id} badge={badge} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const TeamCard: React.FC<{ team: Team }> = ({ team }) => {
  const scoreChange = team.score - team.previousScore;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-5"
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <RankBadge rank={team.rank} size="lg" />
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">{team.name}</h3>
            <p className="text-sm text-slate-500">{team.department} • {team.memberCount} members</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-slate-900 dark:text-white">{team.score}</div>
          <div className={`flex items-center justify-end gap-1 text-sm ${
            scoreChange > 0 ? 'text-emerald-600' : scoreChange < 0 ? 'text-red-600' : 'text-slate-500'
          }`}>
            {scoreChange > 0 ? <TrendingUp className="w-4 h-4" /> : scoreChange < 0 ? <TrendingDown className="w-4 h-4" /> : null}
            {scoreChange !== 0 && <span>{scoreChange > 0 ? '+' : ''}{scoreChange}%</span>}
          </div>
        </div>
      </div>

      {/* Team Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">TRIR</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{team.metrics.trir}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Training</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{team.metrics.trainingCompliance}%</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Near Miss Rate</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{team.metrics.nearMissRate}</p>
        </div>
        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
          <p className="text-xs text-slate-500 mb-1">Audit Score</p>
          <p className="text-lg font-bold text-slate-900 dark:text-white">{team.metrics.auditScore}%</p>
        </div>
      </div>
    </motion.div>
  );
};

// Main Component
export const TeamLeaderboard: React.FC = () => {
  const [view, setView] = useState<'individuals' | 'teams'>('individuals');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter' | 'year'>('month');

  const members = useMemo(() => generateMockMembers(), []);

  const filteredMembers = useMemo(() => {
    return members.filter(m => {
      const matchesSearch = m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           m.department.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesDepartment = filterDepartment === 'all' || m.department === filterDepartment;
      return matchesSearch && matchesDepartment;
    });
  }, [members, searchQuery, filterDepartment]);

  const departments = [...new Set(members.map(m => m.department))];

  return (
    <div className="p-4 md:p-6 lg:p-8 min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            Safety Leaderboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Recognize top safety performers and team achievements
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Time Range */}
          <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
            {(['week', 'month', 'quarter', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all capitalize ${
                  timeRange === range
                    ? 'bg-brand-500 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top 3 Spotlight */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {members.slice(0, 3).map((member, index) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`relative overflow-hidden rounded-2xl p-6 ${
              index === 0
                ? 'bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 text-white md:col-span-1 md:row-span-1'
                : index === 1
                ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-slate-800'
                : 'bg-gradient-to-br from-amber-600 to-amber-700 text-white'
            }`}
          >
            {/* Decorative */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <RankBadge rank={member.rank} size="lg" />
                {member.streak >= 30 && (
                  <span className="flex items-center gap-1 text-sm bg-white/20 px-3 py-1 rounded-full">
                    <Flame className="w-4 h-4" />
                    {member.streak} day streak
                  </span>
                )}
              </div>
              
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold mb-3">
                {member.avatar}
              </div>
              
              <h3 className="text-xl font-bold mb-1">{member.name}</h3>
              <p className={`text-sm ${index === 1 ? 'text-slate-600' : 'text-white/80'}`}>
                {member.role} • {member.department}
              </p>
              
              <div className="mt-4 pt-4 border-t border-white/20">
                <div className="text-4xl font-bold">{member.safetyScore}</div>
                <p className={`text-sm ${index === 1 ? 'text-slate-600' : 'text-white/80'}`}>Safety Score</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* View Toggle & Filters */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-1">
          <button
            onClick={() => setView('individuals')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              view === 'individuals'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Individuals
          </button>
          <button
            onClick={() => setView('teams')}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
              view === 'teams'
                ? 'bg-brand-500 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            }`}
          >
            <Shield className="w-4 h-4" />
            Teams
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 
                       dark:border-slate-700 rounded-xl text-sm w-48"
            />
          </div>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 
                     dark:border-slate-700 rounded-xl text-sm"
          >
            <option value="all">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {view === 'individuals' ? (
        <div className="space-y-3">
          {filteredMembers.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              expanded={expandedMember === member.id}
              onToggle={() => setExpandedMember(expandedMember === member.id ? null : member.id)}
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {mockTeams.map((team) => (
            <TeamCard key={team.id} team={team} />
          ))}
        </div>
      )}

      {/* Achievement Stats */}
      <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Trophy className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">156</p>
              <p className="text-sm text-slate-500">Badges Earned</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
              <Target className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">89%</p>
              <p className="text-sm text-slate-500">Goals Achieved</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">45</p>
              <p className="text-sm text-slate-500">Active Streaks</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <Zap className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">12.5K</p>
              <p className="text-sm text-slate-500">Total XP Earned</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderboard;
