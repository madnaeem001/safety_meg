import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Area, AreaChart, Legend, ComposedChart
} from 'recharts';
import { TrendingUp, Target, Check, AlertTriangle, BarChart3, Activity } from 'lucide-react';
import { ProjectTask } from '../../data/mockProjectManagement';
import { useProjectSprints, useVelocityHistory, useRecordVelocity } from '../../api/hooks/useAPIHooks';

interface VelocityChartsProps {
  tasks: ProjectTask[];
  /** Numeric DB id of the project — enables API-backed sprints and velocity history */
  projectDbId?: number;
}

// Static fallback historical velocity when no DB history is available
const FALLBACK_VELOCITY_HISTORY = [
  { sprint: 'Sprint -4', committed: 21, completed: 18, carryover: 3 },
  { sprint: 'Sprint -3', committed: 24, completed: 22, carryover: 2 },
  { sprint: 'Sprint -2', committed: 28, completed: 25, carryover: 3 },
  { sprint: 'Sprint -1', committed: 26, completed: 26, carryover: 0 },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-xl shadow-lg border border-surface-100">
        <p className="font-semibold text-brand-900 mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-2 text-sm">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: entry.color }}
            />
            <span className="text-surface-600">{entry.name}:</span>
            <span className="font-bold text-brand-800">{entry.value} pts</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const StatCard: React.FC<{
  icon: typeof TrendingUp;
  label: string;
  value: string | number;
  trend?: { value: number; positive: boolean };
  color: string;
}> = ({ icon: Icon, label, value, trend, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100"
  >
    <div className="flex items-start justify-between">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      {trend && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend.positive ? 'text-emerald-600' : 'text-red-600'}`}>
          <TrendingUp className={`w-3.5 h-3.5 ${!trend.positive && 'rotate-180'}`} />
          {trend.positive ? '+' : ''}{trend.value}%
        </div>
      )}
    </div>
    <div className="mt-4">
      <div className="text-3xl font-bold text-brand-900">{value}</div>
      <div className="text-xs text-surface-500 uppercase tracking-wider mt-1">{label}</div>
    </div>
  </motion.div>
);

export const VelocityCharts: React.FC<VelocityChartsProps> = ({ tasks, projectDbId }) => {
  // ── API hooks ──────────────────────────────────────────────────────────────
  const { data: sprintsData } = useProjectSprints(
    projectDbId ? { projectId: projectDbId } : undefined
  );
  const { data: velocityHistoryData } = useVelocityHistory(projectDbId);

  const sprints = sprintsData || [];

  // Historical velocity: use API data when available, otherwise static fallback
  const historicalVelocity = useMemo(() => {
    if (velocityHistoryData && velocityHistoryData.length > 0) {
      return velocityHistoryData.map(v => ({
        sprint: v.sprintLabel,
        committed: v.committed,
        completed: v.completed,
        carryover: v.carryover,
      }));
    }
    return FALLBACK_VELOCITY_HISTORY;
  }, [velocityHistoryData]);

  // Match tasks to sprint: handle both numeric IDs ("1") and mock string IDs ("sprint-1")
  const getSprintTasks = (sprintId: number | string) =>
    tasks.filter(t => String(t.sprintId) === String(sprintId));

  // Calculate velocity data from tasks
  const velocityData = useMemo(() => {
    const sprintData = sprints.map(sprint => {
      const sprintTasks = getSprintTasks(sprint.id);
      const committed = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
      const completed = sprintTasks
        .filter(t => t.status === 'completed')
        .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

      return {
        sprint: sprint.name.replace('Sprint', 'S'),
        committed,
        completed,
        carryover: committed - completed,
        status: sprint.status,
      };
    });

    // Combine historical with current sprint data
    return [...historicalVelocity, ...sprintData];
  }, [tasks, sprints, historicalVelocity]);

  // Active sprint from API; gracefully undefined when no sprints yet
  const activeSprint = sprints.find(s => s.status === 'active');

  // Calculate burn down data for active sprint
  const burnDownData = useMemo(() => {
    if (!activeSprint) return [];

    const sprintTasks = getSprintTasks(activeSprint.id);
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
    const completedPoints = sprintTasks
      .filter(t => t.status === 'completed')
      .reduce((sum, t) => sum + (t.storyPoints || 0), 0);

    const startDate = new Date(activeSprint.startDate || '');
    const endDate = new Date(activeSprint.endDate || '');
    const today = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.min(totalDays, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));

    if (totalDays <= 0) return [];

    // Generate burn down points
    const data = [];
    for (let i = 0; i <= totalDays; i++) {
      const idealRemaining = totalPoints - (totalPoints / totalDays) * i;
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      data.push({
        day: `Day ${i + 1}`,
        date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        ideal: Math.max(0, Math.round(idealRemaining)),
        actual: i <= daysPassed
          ? Math.max(0, totalPoints - (daysPassed > 0 ? completedPoints * (i / daysPassed) : 0))
          : null,
      });
    }

    return data;
  }, [tasks, activeSprint]);

  // Calculate summary stats
  const averageVelocity = useMemo(() => {
    const completed = velocityData
      .filter(d => d.completed > 0)
      .map(d => d.completed);
    return completed.length > 0 
      ? Math.round(completed.reduce((a, b) => a + b, 0) / completed.length)
      : 0;
  }, [velocityData]);

  const currentSprintTasks = activeSprint ? getSprintTasks(activeSprint.id) : [];
  const currentSprintPoints = currentSprintTasks.reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const currentSprintCompleted = currentSprintTasks
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + (t.storyPoints || 0), 0);
  const completionRate = currentSprintPoints > 0 
    ? Math.round((currentSprintCompleted / currentSprintPoints) * 100) 
    : 0;

  // Issue distribution by type
  const issueDistribution = useMemo(() => {
    const distribution: Record<string, number> = { story: 0, task: 0, bug: 0, subtask: 0 };
    tasks.forEach(t => {
      if (t.issueType && distribution[t.issueType] !== undefined) {
        distribution[t.issueType] += t.storyPoints || 0;
      }
    });
    return Object.entries(distribution).map(([type, points]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      points
    }));
  }, [tasks]);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={TrendingUp}
          label="Avg Velocity"
          value={`${averageVelocity} pts`}
          trend={{ value: 12, positive: true }}
          color="bg-brand-50 text-brand-600"
        />
        <StatCard
          icon={Target}
          label="Current Sprint"
          value={`${currentSprintCompleted}/${currentSprintPoints}`}
          color="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Check}
          label="Completion Rate"
          value={`${completionRate}%`}
          trend={{ value: 5, positive: true }}
          color="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={AlertTriangle}
          label="Carryover"
          value={`${velocityData[velocityData.length - 1]?.carryover || 0} pts`}
          trend={{ value: 8, positive: false }}
          color="bg-amber-50 text-amber-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Velocity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-brand-900">Team Velocity</h3>
              <p className="text-sm text-surface-500">Story points per sprint</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-surface-600">Committed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                <span className="text-surface-600">Completed</span>
              </div>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={velocityData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="sprint" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="committed" 
                  fill="#14b8a6" 
                  radius={[6, 6, 0, 0]}
                  name="Committed"
                />
                <Bar 
                  dataKey="completed" 
                  fill="#10b981" 
                  radius={[6, 6, 0, 0]}
                  name="Completed"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Burn Down Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-brand-900">Sprint Burndown</h3>
              <p className="text-sm text-surface-500">{activeSprint?.name || 'No active sprint'}</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-surface-400" />
                <span className="text-surface-600">Ideal</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-brand-500" />
                <span className="text-surface-600">Actual</span>
              </div>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={burnDownData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  type="monotone" 
                  dataKey="ideal" 
                  stroke="#9ca3af" 
                  strokeDasharray="5 5"
                  strokeWidth={2}
                  dot={false}
                  name="Ideal"
                />
                <Line 
                  type="monotone" 
                  dataKey="actual" 
                  stroke="#14b8a6" 
                  strokeWidth={3}
                  dot={{ fill: '#14b8a6', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: '#14b8a6' }}
                  name="Actual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Issue Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-brand-900">Issue Distribution</h3>
              <p className="text-sm text-surface-500">Story points by type</p>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueDistribution} layout="vertical" barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                <XAxis 
                  type="number"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  type="category"
                  dataKey="type"
                  tick={{ fontSize: 12, fill: '#374151' }}
                  axisLine={false}
                  tickLine={false}
                  width={80}
                />
                <Tooltip content={<CustomTooltip />} />
                <Bar 
                  dataKey="points" 
                  fill="#14b8a6" 
                  radius={[0, 6, 6, 0]}
                  name="Points"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Cumulative Flow */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white p-6 rounded-2xl shadow-soft border border-surface-100"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-brand-900">Sprint Progress</h3>
              <p className="text-sm text-surface-500">Work item status over time</p>
            </div>
          </div>
          
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={[
                { day: 'Day 1', todo: 18, inProgress: 6, done: 0 },
                { day: 'Day 3', todo: 14, inProgress: 8, done: 2 },
                { day: 'Day 5', todo: 10, inProgress: 9, done: 5 },
                { day: 'Day 7', todo: 8, inProgress: 7, done: 9 },
                { day: 'Day 9', todo: 5, inProgress: 8, done: 11 },
                { day: 'Day 11', todo: 3, inProgress: 5, done: 16 },
                { day: 'Day 14', todo: 1, inProgress: 3, done: 20 },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis 
                  dataKey="day" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={{ stroke: '#e5e7eb' }}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="done" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} name="Done" />
                <Area type="monotone" dataKey="inProgress" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} name="In Progress" />
                <Area type="monotone" dataKey="todo" stackId="1" stroke="#6b7280" fill="#9ca3af" fillOpacity={0.8} name="To Do" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VelocityCharts;
