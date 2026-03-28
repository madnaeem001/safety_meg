import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Trophy, Medal, Star, TrendingUp, Users, Target,
  Award, Zap, Shield, Eye, CheckCircle, AlertTriangle, Crown,
  ChevronRight, Filter, Calendar, BarChart3, Flame, Gift,
  ThumbsUp, MessageSquare, Share2, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLeaderboard, useTeamMetrics } from '../api/hooks/useAPIHooks';

// Leaderboard Types
interface LeaderboardEntry {
  id: string;
  rank: number;
  previousRank: number;
  name: string;
  avatar?: string;
  department: string;
  role: string;
  points: number;
  weeklyPoints: number;
  monthlyPoints: number;
  streak: number;
  badges: Badge[];
  stats: {
    observationsReported: number;
    incidentsReported: number;
    trainingsCompleted: number;
    jsasCompleted: number;
    inspectionsCompleted: number;
    daysIncidentFree: number;
  };
  isCurrentUser?: boolean;
}

interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  earnedAt: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface TeamLeaderboard {
  id: string;
  rank: number;
  name: string;
  department: string;
  totalPoints: number;
  memberCount: number;
  avgPointsPerMember: number;
  weeklyChange: number;
  topPerformer: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: string;
  progress: number;
  target: number;
  points: number;
  unlocked: boolean;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

// Mock data
const mockLeaderboard: LeaderboardEntry[] = [
  {
    id: 'U-001',
    rank: 1,
    previousRank: 2,
    name: 'Sarah Chen',
    department: 'Operations',
    role: 'Safety Lead',
    points: 4850,
    weeklyPoints: 320,
    monthlyPoints: 1240,
    streak: 45,
    badges: [
      { id: 'B-1', name: 'Safety Champion', icon: '🏆', description: 'Top performer for 3 months', earnedAt: '2026-01-15', rarity: 'legendary' },
      { id: 'B-2', name: 'Eagle Eye', icon: '👁️', description: 'Reported 50+ observations', earnedAt: '2026-01-10', rarity: 'epic' }
    ],
    stats: { observationsReported: 67, incidentsReported: 5, trainingsCompleted: 24, jsasCompleted: 89, inspectionsCompleted: 156, daysIncidentFree: 365 }
  },
  {
    id: 'U-002',
    rank: 2,
    previousRank: 1,
    name: 'Mike Johnson',
    department: 'Maintenance',
    role: 'Supervisor',
    points: 4520,
    weeklyPoints: 280,
    monthlyPoints: 1180,
    streak: 38,
    badges: [
      { id: 'B-3', name: 'First Responder', icon: '🚑', description: 'Completed emergency response training', earnedAt: '2026-02-01', rarity: 'rare' }
    ],
    stats: { observationsReported: 45, incidentsReported: 8, trainingsCompleted: 20, jsasCompleted: 72, inspectionsCompleted: 134, daysIncidentFree: 290 }
  },
  {
    id: 'U-003',
    rank: 3,
    previousRank: 3,
    name: 'Lisa Park',
    department: 'Production',
    role: 'Team Lead',
    points: 4180,
    weeklyPoints: 310,
    monthlyPoints: 1050,
    streak: 28,
    badges: [],
    stats: { observationsReported: 52, incidentsReported: 3, trainingsCompleted: 18, jsasCompleted: 65, inspectionsCompleted: 98, daysIncidentFree: 180 }
  },
  {
    id: 'U-004',
    rank: 4,
    previousRank: 6,
    name: 'Tom Wilson',
    department: 'Logistics',
    role: 'Safety Technician',
    points: 3920,
    weeklyPoints: 350,
    monthlyPoints: 980,
    streak: 21,
    badges: [
      { id: 'B-4', name: 'Rising Star', icon: '⭐', description: 'Moved up 5+ ranks in a month', earnedAt: '2026-02-05', rarity: 'rare' }
    ],
    stats: { observationsReported: 38, incidentsReported: 2, trainingsCompleted: 15, jsasCompleted: 58, inspectionsCompleted: 87, daysIncidentFree: 120 },
    isCurrentUser: true
  },
  {
    id: 'U-005',
    rank: 5,
    previousRank: 4,
    name: 'Emma Davis',
    department: 'Quality',
    role: 'Inspector',
    points: 3750,
    weeklyPoints: 220,
    monthlyPoints: 890,
    streak: 15,
    badges: [],
    stats: { observationsReported: 29, incidentsReported: 4, trainingsCompleted: 22, jsasCompleted: 42, inspectionsCompleted: 210, daysIncidentFree: 200 }
  },
  {
    id: 'U-006',
    rank: 6,
    previousRank: 5,
    name: 'James Lee',
    department: 'Engineering',
    role: 'Engineer',
    points: 3580,
    weeklyPoints: 190,
    monthlyPoints: 820,
    streak: 12,
    badges: [],
    stats: { observationsReported: 24, incidentsReported: 1, trainingsCompleted: 16, jsasCompleted: 35, inspectionsCompleted: 45, daysIncidentFree: 250 }
  },
  {
    id: 'U-007',
    rank: 7,
    previousRank: 8,
    name: 'Anna Martinez',
    department: 'Operations',
    role: 'Operator',
    points: 3420,
    weeklyPoints: 240,
    monthlyPoints: 780,
    streak: 9,
    badges: [],
    stats: { observationsReported: 31, incidentsReported: 2, trainingsCompleted: 14, jsasCompleted: 48, inspectionsCompleted: 62, daysIncidentFree: 95 }
  },
  {
    id: 'U-008',
    rank: 8,
    previousRank: 7,
    name: 'David Brown',
    department: 'Warehouse',
    role: 'Forklift Operator',
    points: 3280,
    weeklyPoints: 180,
    monthlyPoints: 720,
    streak: 6,
    badges: [],
    stats: { observationsReported: 18, incidentsReported: 3, trainingsCompleted: 12, jsasCompleted: 38, inspectionsCompleted: 55, daysIncidentFree: 75 }
  }
];

const mockTeamLeaderboard: TeamLeaderboard[] = [
  { id: 'T-1', rank: 1, name: 'Operations Team', department: 'Operations', totalPoints: 28500, memberCount: 12, avgPointsPerMember: 2375, weeklyChange: 5, topPerformer: 'Sarah Chen' },
  { id: 'T-2', rank: 2, name: 'Maintenance Crew', department: 'Maintenance', totalPoints: 24200, memberCount: 8, avgPointsPerMember: 3025, weeklyChange: -2, topPerformer: 'Mike Johnson' },
  { id: 'T-3', rank: 3, name: 'Production Line A', department: 'Production', totalPoints: 21800, memberCount: 15, avgPointsPerMember: 1453, weeklyChange: 3, topPerformer: 'Lisa Park' },
  { id: 'T-4', rank: 4, name: 'Quality Assurance', department: 'Quality', totalPoints: 18600, memberCount: 6, avgPointsPerMember: 3100, weeklyChange: 0, topPerformer: 'Emma Davis' },
  { id: 'T-5', rank: 5, name: 'Logistics Squad', department: 'Logistics', totalPoints: 16400, memberCount: 10, avgPointsPerMember: 1640, weeklyChange: 8, topPerformer: 'Tom Wilson' }
];

const mockAchievements: Achievement[] = [
  { id: 'A-1', name: 'First Observation', description: 'Report your first safety observation', icon: '👁️', requirement: 'Report 1 observation', progress: 1, target: 1, points: 50, unlocked: true, rarity: 'common' },
  { id: 'A-2', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', requirement: '7 consecutive active days', progress: 7, target: 7, points: 100, unlocked: true, rarity: 'common' },
  { id: 'A-3', name: 'Safety Scholar', description: 'Complete 10 training courses', icon: '📚', requirement: 'Complete 10 trainings', progress: 15, target: 10, points: 200, unlocked: true, rarity: 'rare' },
  { id: 'A-4', name: 'JSA Master', description: 'Submit 50 Job Safety Analyses', icon: '📋', requirement: 'Submit 50 JSAs', progress: 58, target: 50, points: 300, unlocked: true, rarity: 'rare' },
  { id: 'A-5', name: 'Eagle Eye', description: 'Report 50 safety observations', icon: '🦅', requirement: 'Report 50 observations', progress: 38, target: 50, points: 500, unlocked: false, rarity: 'epic' },
  { id: 'A-6', name: 'Zero Hero', description: 'Achieve 365 days incident-free', icon: '🎯', requirement: '365 incident-free days', progress: 120, target: 365, points: 1000, unlocked: false, rarity: 'legendary' },
  { id: 'A-7', name: 'Inspection Champion', description: 'Complete 100 inspections', icon: '🔍', requirement: 'Complete 100 inspections', progress: 87, target: 100, points: 400, unlocked: false, rarity: 'epic' },
  { id: 'A-8', name: 'Team Player', description: 'Participate in 20 toolbox talks', icon: '🤝', requirement: 'Attend 20 toolbox talks', progress: 14, target: 20, points: 150, unlocked: false, rarity: 'rare' }
];

type ViewMode = 'individual' | 'team' | 'achievements';
type TimeFilter = 'weekly' | 'monthly' | 'allTime';

export const SafetyLeaderboard: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('individual');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('monthly');
  const [selectedEntry, setSelectedEntry] = useState<LeaderboardEntry | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendLeaderboard } = useLeaderboard({ period: timeFilter, limit: 50 });
  const { data: teamMetrics } = useTeamMetrics();

  // Merge real leaderboard data with mock
  const mergedLeaderboard = React.useMemo(() => {
    if (backendLeaderboard && backendLeaderboard.length > 0) {
      return backendLeaderboard.map((entry: any, idx: number) => ({
        id: `LB-API-${entry.id}`,
        name: entry.employeeName,
        department: entry.department || 'Operations',
        role: 'Employee',
        safetyScore: entry.safetyScore || 0,
        rank: entry.rank || idx + 1,
        previousRank: (entry.rank || idx + 1) + Math.floor(Math.random() * 3) - 1,
        incidents: entry.incidentsReported || 0,
        nearMisses: entry.nearMissesReported || 0,
        trainings: entry.trainingsCompleted || 0,
        audits: entry.auditParticipation || 0,
        badges: entry.recognitionBadges || [],
        streak: 0,
        points: entry.safetyScore * 10,
        avatar: '👷',
      }));
    }
    return mockLeaderboard;
  }, [backendLeaderboard]);

  const getRankChange = (current: number, previous: number) => {
    const diff = previous - current;
    if (diff > 0) return { direction: 'up', value: diff };
    if (diff < 0) return { direction: 'down', value: Math.abs(diff) };
    return { direction: 'same', value: 0 };
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2: return <Medal className="w-6 h-6 text-gray-400" />;
      case 3: return <Medal className="w-6 h-6 text-amber-600" />;
      default: return <span className="font-bold text-surface-600">#{rank}</span>;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'legendary': return 'from-yellow-400 to-orange-500';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      default: return 'from-gray-400 to-gray-500';
    }
  };

  const getPointsByFilter = (entry: LeaderboardEntry) => {
    switch (timeFilter) {
      case 'weekly': return entry.weeklyPoints;
      case 'monthly': return entry.monthlyPoints;
      default: return entry.points;
    }
  };

  const sortedLeaderboard = [...mockLeaderboard].sort((a, b) => getPointsByFilter(b) - getPointsByFilter(a));

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white sticky top-[72px] z-50 safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6" />
              <h1 className="text-xl font-bold">Safety Leaderboard</h1>
            </div>
            <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
              <Share2 className="w-5 h-5" />
            </button>
          </div>

          {/* Current User Position */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                <span className="text-2xl font-bold">#4</span>
              </div>
              <div className="flex-1">
                <p className="font-bold text-lg">Tom Wilson</p>
                <p className="text-white/80 text-sm">You're 170 points from #3!</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">3,920</p>
                <p className="text-xs text-white/70">points</p>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Flame className="w-4 h-4 text-orange-300" />
              <span className="text-sm">21 day streak</span>
              <span className="mx-2 text-white/40">•</span>
              <TrendingUp className="w-4 h-4 text-green-300" />
              <span className="text-sm text-green-300">+2 ranks this week</span>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-2">
          {[
            { id: 'individual', label: 'Individual', icon: Users },
            { id: 'team', label: 'Teams', icon: Target },
            { id: 'achievements', label: 'Achievements', icon: Award },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                viewMode === tab.id
                  ? 'bg-white text-orange-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        <AnimatePresence mode="wait">
          {/* Individual Leaderboard */}
          {viewMode === 'individual' && (
            <motion.div
              key="individual"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Time Filter */}
              <div className="flex gap-2">
                {[
                  { id: 'weekly', label: 'This Week' },
                  { id: 'monthly', label: 'This Month' },
                  { id: 'allTime', label: 'All Time' },
                ].map(filter => (
                  <button
                    key={filter.id}
                    onClick={() => setTimeFilter(filter.id as TimeFilter)}
                    className={`px-4 py-2 rounded-xl font-medium transition-all ${
                      timeFilter === filter.id
                        ? 'bg-accent text-text-onAccent'
                        : 'bg-white text-surface-600 border border-surface-200'
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Top 3 Podium */}
              <div className="grid grid-cols-3 gap-2 mb-6">
                {/* 2nd Place */}
                <div className="flex flex-col items-center pt-8">
                  <div className="w-16 h-16 bg-gradient-to-b from-gray-300 to-gray-400 rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-2xl">🥈</span>
                  </div>
                  <p className="font-bold text-sm text-center truncate w-full">{sortedLeaderboard[1]?.name}</p>
                  <p className="text-xs text-surface-500">{getPointsByFilter(sortedLeaderboard[1])} pts</p>
                  <div className="w-full h-20 bg-gradient-to-t from-gray-200 to-gray-100 rounded-t-xl mt-2" />
                </div>
                {/* 1st Place */}
                <div className="flex flex-col items-center">
                  <div className="w-20 h-20 bg-gradient-to-b from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mb-2 shadow-lg ring-4 ring-yellow-200">
                    <span className="text-3xl">🏆</span>
                  </div>
                  <p className="font-bold text-center truncate w-full">{sortedLeaderboard[0]?.name}</p>
                  <p className="text-sm text-yellow-600 font-medium">{getPointsByFilter(sortedLeaderboard[0])} pts</p>
                  <div className="w-full h-28 bg-gradient-to-t from-yellow-200 to-yellow-100 rounded-t-xl mt-2" />
                </div>
                {/* 3rd Place */}
                <div className="flex flex-col items-center pt-12">
                  <div className="w-14 h-14 bg-gradient-to-b from-amber-500 to-amber-600 rounded-full flex items-center justify-center mb-2 shadow-lg">
                    <span className="text-xl">🥉</span>
                  </div>
                  <p className="font-bold text-sm text-center truncate w-full">{sortedLeaderboard[2]?.name}</p>
                  <p className="text-xs text-surface-500">{getPointsByFilter(sortedLeaderboard[2])} pts</p>
                  <div className="w-full h-16 bg-gradient-to-t from-amber-200 to-amber-100 rounded-t-xl mt-2" />
                </div>
              </div>

              {/* Full Leaderboard */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100">
                  <h2 className="font-bold text-brand-900">Full Rankings</h2>
                </div>
                <div className="divide-y divide-surface-100">
                  {sortedLeaderboard.map((entry, index) => {
                    const rankChange = getRankChange(entry.rank, entry.previousRank);
                    return (
                      <motion.button
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className={`w-full p-4 flex items-center gap-3 hover:bg-surface-50 transition-colors text-left ${
                          entry.isCurrentUser ? 'bg-orange-50' : ''
                        }`}
                        whileHover={{ x: 4 }}
                      >
                        <div className="w-10 h-10 flex items-center justify-center">
                          {getRankIcon(index + 1)}
                        </div>
                        <div className="w-10 h-10 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white font-bold">
                          {entry.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-surface-900 truncate">{entry.name}</p>
                            {entry.isCurrentUser && (
                              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">You</span>
                            )}
                            {entry.badges.length > 0 && (
                              <span className="text-sm">{entry.badges[0].icon}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-sm text-surface-500">
                            <span>{entry.department}</span>
                            <span className="text-surface-300">•</span>
                            <span className="flex items-center gap-1">
                              <Flame className="w-3 h-3 text-orange-500" />
                              {entry.streak} days
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-surface-900">{getPointsByFilter(entry).toLocaleString()}</p>
                          <div className="flex items-center justify-end gap-1 text-xs">
                            {rankChange.direction === 'up' && (
                              <span className="text-green-500 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3" />+{rankChange.value}
                              </span>
                            )}
                            {rankChange.direction === 'down' && (
                              <span className="text-red-500 flex items-center gap-0.5">
                                <TrendingUp className="w-3 h-3 rotate-180" />-{rankChange.value}
                              </span>
                            )}
                            {rankChange.direction === 'same' && (
                              <span className="text-surface-400">—</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-surface-400" />
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Team Leaderboard */}
          {viewMode === 'team' && (
            <motion.div
              key="team"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100">
                  <h2 className="font-bold text-brand-900 flex items-center gap-2">
                    <Target className="w-5 h-5 text-orange-500" />
                    Team Rankings
                  </h2>
                </div>
                <div className="divide-y divide-surface-100">
                  {mockTeamLeaderboard.map((team) => (
                    <div key={team.id} className="p-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 flex items-center justify-center">
                          {getRankIcon(team.rank)}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-surface-900">{team.name}</p>
                          <p className="text-sm text-surface-500">{team.memberCount} members • {team.department}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-surface-900">{team.totalPoints.toLocaleString()}</p>
                          <p className={`text-xs flex items-center justify-end gap-1 ${
                            team.weeklyChange > 0 ? 'text-green-500' : team.weeklyChange < 0 ? 'text-red-500' : 'text-surface-400'
                          }`}>
                            {team.weeklyChange > 0 ? <TrendingUp className="w-3 h-3" /> : team.weeklyChange < 0 ? <TrendingUp className="w-3 h-3 rotate-180" /> : null}
                            {team.weeklyChange !== 0 ? `${team.weeklyChange > 0 ? '+' : ''}${team.weeklyChange}%` : '—'}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 text-sm text-surface-600 bg-surface-50 rounded-xl p-3">
                        <div className="flex-1">
                          <p className="text-xs text-surface-400">Avg per Member</p>
                          <p className="font-medium">{team.avgPointsPerMember.toLocaleString()} pts</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-xs text-surface-400">Top Performer</p>
                          <p className="font-medium">{team.topPerformer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Achievements */}
          {viewMode === 'achievements' && (
            <motion.div
              key="achievements"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Achievement Progress */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm p-4">
                <h2 className="font-bold text-brand-900 mb-4">Your Progress</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-3xl font-bold text-orange-500">{mockAchievements.filter(a => a.unlocked).length}</p>
                    <p className="text-sm text-surface-500">Unlocked</p>
                  </div>
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-3xl font-bold text-surface-400">{mockAchievements.filter(a => !a.unlocked).length}</p>
                    <p className="text-sm text-surface-500">Remaining</p>
                  </div>
                </div>
              </div>

              {/* Achievement List */}
              <div className="bg-white rounded-3xl border border-surface-100 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-surface-100">
                  <h2 className="font-bold text-brand-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-purple-500" />
                    All Achievements
                  </h2>
                </div>
                <div className="divide-y divide-surface-100">
                  {mockAchievements.map((achievement) => (
                    <div key={achievement.id} className={`p-4 ${achievement.unlocked ? '' : 'opacity-60'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getRarityColor(achievement.rarity)} flex items-center justify-center text-2xl shadow-md`}>
                          {achievement.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-bold text-surface-900">{achievement.name}</p>
                            {achievement.unlocked && <CheckCircle className="w-4 h-4 text-green-500" />}
                            <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                              achievement.rarity === 'legendary' ? 'bg-yellow-100 text-yellow-700' :
                              achievement.rarity === 'epic' ? 'bg-purple-100 text-purple-700' :
                              achievement.rarity === 'rare' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {achievement.rarity}
                            </span>
                          </div>
                          <p className="text-sm text-surface-600 mb-2">{achievement.description}</p>
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                              <div 
                                className={`h-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}`}
                                style={{ width: `${Math.min(100, (achievement.progress / achievement.target) * 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-surface-500">
                              {achievement.progress}/{achievement.target}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-orange-500">+{achievement.points}</p>
                          <p className="text-xs text-surface-400">points</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Entry Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 flex items-end justify-center p-4"
            onClick={() => setSelectedEntry(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl w-full max-w-lg max-h-[80vh] overflow-y-auto"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-brand-500 to-brand-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedEntry.name.charAt(0)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-brand-900">{selectedEntry.name}</h2>
                    <p className="text-surface-500">{selectedEntry.role} • {selectedEntry.department}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-orange-500">#{selectedEntry.rank}</p>
                    <p className="text-xs text-surface-500">Rank</p>
                  </div>
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-brand-600">{selectedEntry.points.toLocaleString()}</p>
                    <p className="text-xs text-surface-500">Points</p>
                  </div>
                  <div className="text-center p-3 bg-surface-50 rounded-xl">
                    <p className="text-2xl font-bold text-red-500">{selectedEntry.streak}</p>
                    <p className="text-xs text-surface-500">Day Streak</p>
                  </div>
                </div>

                <h3 className="font-bold text-surface-900 mb-3">Safety Stats</h3>
                <div className="grid grid-cols-2 gap-2 mb-6">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <p className="text-lg font-bold text-blue-600">{selectedEntry.stats.observationsReported}</p>
                    <p className="text-xs text-blue-700">Observations</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <p className="text-lg font-bold text-green-600">{selectedEntry.stats.trainingsCompleted}</p>
                    <p className="text-xs text-green-700">Trainings</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <p className="text-lg font-bold text-purple-600">{selectedEntry.stats.jsasCompleted}</p>
                    <p className="text-xs text-purple-700">JSAs</p>
                  </div>
                  <div className="p-3 bg-teal-50 rounded-xl">
                    <p className="text-lg font-bold text-teal-600">{selectedEntry.stats.inspectionsCompleted}</p>
                    <p className="text-xs text-teal-700">Inspections</p>
                  </div>
                </div>

                {selectedEntry.badges.length > 0 && (
                  <>
                    <h3 className="font-bold text-surface-900 mb-3">Badges</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedEntry.badges.map(badge => (
                        <div key={badge.id} className={`px-3 py-2 rounded-xl bg-gradient-to-r ${getRarityColor(badge.rarity)} text-white flex items-center gap-2`}>
                          <span>{badge.icon}</span>
                          <span className="font-medium text-sm">{badge.name}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <button 
                  onClick={() => setSelectedEntry(null)}
                  className="w-full mt-6 py-3 bg-surface-100 text-surface-700 rounded-xl font-medium hover:bg-surface-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SafetyLeaderboard;
