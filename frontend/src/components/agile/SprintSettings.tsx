import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings, Calendar, Clock, Save, RotateCcw, Plus, Trash2,
  Users, Target, AlertCircle, CheckCircle, Timer, Zap
} from 'lucide-react';
import { Sprint } from '../../data/mockProjectManagement';
import { SprintRecord } from '../../api/services/apiService';
import {
  useProjectSprints,
  useCreateSprint,
  useUpdateSprint,
  useDeleteSprint,
  useSprintSettings,
  useSaveSprintSettings,
} from '../../api/hooks/useAPIHooks';

export interface SprintConfig {
  defaultDuration: number; // days
  workingDays: string[];
  sprintStartDay: string;
  velocityTarget: number;
  maxCapacity: number;
  bufferPercentage: number;
  autoStartEnabled: boolean;
  notifications: {
    sprintStart: boolean;
    sprintEnd: boolean;
    capacityWarning: boolean;
    dailyStandup: boolean;
  };
}

interface SprintSettingsProps {
  sprints?: Sprint[];
  onUpdateSprints?: (sprints: Sprint[]) => void;
}

const DEFAULT_CONFIG: SprintConfig = {
  defaultDuration: 14,
  workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  sprintStartDay: 'monday',
  velocityTarget: 40,
  maxCapacity: 50,
  bufferPercentage: 20,
  autoStartEnabled: true,
  notifications: {
    sprintStart: true,
    sprintEnd: true,
    capacityWarning: true,
    dailyStandup: false,
  }
};

const DURATION_PRESETS = [
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '3 Weeks', days: 21 },
  { label: '4 Weeks', days: 28 },
];

const WEEKDAYS = [
  { id: 'monday', label: 'Mon' },
  { id: 'tuesday', label: 'Tue' },
  { id: 'wednesday', label: 'Wed' },
  { id: 'thursday', label: 'Thu' },
  { id: 'friday', label: 'Fri' },
  { id: 'saturday', label: 'Sat' },
  { id: 'sunday', label: 'Sun' },
];

export function SprintSettings({ onUpdateSprints }: SprintSettingsProps) {
  const { data: sprintsData, loading: sprintsLoading, refetch: refetchSprints } = useProjectSprints();
  const { data: settingsData } = useSprintSettings();
  const createSprintMutation = useCreateSprint();
  const updateSprintMutation = useUpdateSprint();
  const deleteSprintMutation = useDeleteSprint();
  const saveSettingsMutation = useSaveSprintSettings();

  const mappedSprints: Sprint[] = useMemo(
    () =>
      (sprintsData ?? []).map((s: SprintRecord) => ({
        id: String(s.id),
        name: s.name,
        goal: s.goal ?? '',
        startDate: s.startDate ?? '',
        endDate: s.endDate ?? '',
        status: s.status,
      })),
    [sprintsData]
  );

  const [config, setConfig] = useState<SprintConfig>(DEFAULT_CONFIG);
  const [editingSprint, setEditingSprint] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newSprint, setNewSprint] = useState({
    name: '',
    goal: '',
    startDate: '',
    endDate: ''
  });

  // Sync config from API
  useEffect(() => {
    if (settingsData) {
      setConfig({
        defaultDuration: settingsData.defaultDuration,
        workingDays: settingsData.workingDays,
        sprintStartDay: settingsData.sprintStartDay,
        velocityTarget: settingsData.velocityTarget,
        maxCapacity: settingsData.maxCapacity,
        bufferPercentage: settingsData.bufferPercentage,
        autoStartEnabled: settingsData.autoStartEnabled,
        notifications: settingsData.notifications,
      });
    }
  }, [settingsData]);

  const handleSaveConfig = async () => {
    await saveSettingsMutation.mutate(config);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
    onUpdateSprints?.(mappedSprints);
  };

  const handleResetConfig = () => {
    setConfig(DEFAULT_CONFIG);
  };

  const handleDurationChange = (days: number) => {
    setConfig(prev => ({ ...prev, defaultDuration: days }));
  };

  const handleToggleWorkingDay = (day: string) => {
    setConfig(prev => ({
      ...prev,
      workingDays: prev.workingDays.includes(day)
        ? prev.workingDays.filter(d => d !== day)
        : [...prev.workingDays, day]
    }));
  };

  const handleCreateSprint = async () => {
    if (!newSprint.name || !newSprint.startDate) return;
    const start = new Date(newSprint.startDate);
    const endDate = newSprint.endDate
      ? newSprint.endDate
      : new Date(start.getTime() + config.defaultDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    await createSprintMutation.mutate({
      name: newSprint.name,
      goal: newSprint.goal,
      startDate: newSprint.startDate,
      endDate,
      status: 'future',
    });
    setNewSprint({ name: '', goal: '', startDate: '', endDate: '' });
    setIsCreating(false);
    refetchSprints();
  };

  const handleDeleteSprint = async (sprintId: string) => {
    await deleteSprintMutation.mutate(Number(sprintId));
    refetchSprints();
  };

  const handleUpdateSprint = async (sprintId: string, updates: Partial<Sprint>) => {
    const apiUpdates: Partial<SprintRecord> = { ...updates, id: Number(sprintId) };
    const { id: _id, ...updateData } = apiUpdates;
    await updateSprintMutation.mutate({ id: Number(sprintId), data: updateData });
    setEditingSprint(null);
    refetchSprints();
  };

  const workingDaysCount = config.workingDays.length;
  const effectiveCapacity = Math.round(config.maxCapacity * (1 - config.bufferPercentage / 100));

  if (sprintsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
            <Settings className="w-6 h-6 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Sprint Settings</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Configure sprint duration and team capacity</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleResetConfig}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-gray-700 rounded-lg text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleSaveConfig}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all ${
              isSaved 
                ? 'bg-emerald-600 text-white' 
                : 'bg-violet-600 hover:bg-violet-700 text-white'
            }`}
          >
            {isSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {isSaved ? 'Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sprint Duration */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Sprint Duration</h3>
          </div>

          {/* Duration Presets */}
          <div className="grid grid-cols-4 gap-2 mb-4">
            {DURATION_PRESETS.map(preset => (
              <button
                key={preset.days}
                onClick={() => handleDurationChange(preset.days)}
                className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                  config.defaultDuration === preset.days
                    ? 'bg-violet-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom Duration */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Custom Duration (days)
            </label>
            <input
              type="number"
              value={config.defaultDuration}
              onChange={(e) => handleDurationChange(parseInt(e.target.value) || 14)}
              min={1}
              max={60}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Sprint Start Day */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sprint Start Day
            </label>
            <select
              value={config.sprintStartDay}
              onChange={(e) => setConfig(prev => ({ ...prev, sprintStartDay: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              {WEEKDAYS.map(day => (
                <option key={day.id} value={day.id}>{day.label}</option>
              ))}
            </select>
          </div>

          {/* Working Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Working Days
            </label>
            <div className="flex gap-1">
              {WEEKDAYS.map(day => (
                <button
                  key={day.id}
                  onClick={() => handleToggleWorkingDay(day.id)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                    config.workingDays.includes(day.id)
                      ? 'bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 ring-2 ring-violet-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              {workingDaysCount} working days per week
            </p>
          </div>
        </div>

        {/* Team Capacity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Team Capacity</h3>
          </div>

          {/* Velocity Target */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Velocity Target (story points per sprint)
            </label>
            <input
              type="number"
              value={config.velocityTarget}
              onChange={(e) => setConfig(prev => ({ ...prev, velocityTarget: parseInt(e.target.value) || 40 }))}
              min={1}
              max={200}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Max Capacity */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Maximum Capacity (story points)
            </label>
            <input
              type="number"
              value={config.maxCapacity}
              onChange={(e) => setConfig(prev => ({ ...prev, maxCapacity: parseInt(e.target.value) || 50 }))}
              min={1}
              max={200}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Buffer Percentage */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buffer Percentage: {config.bufferPercentage}%
            </label>
            <input
              type="range"
              value={config.bufferPercentage}
              onChange={(e) => setConfig(prev => ({ ...prev, bufferPercentage: parseInt(e.target.value) }))}
              min={0}
              max={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
              <span>0% (No buffer)</span>
              <span>50% (Conservative)</span>
            </div>
          </div>

          {/* Effective Capacity Summary */}
          <div className="p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span className="text-sm font-medium text-violet-900 dark:text-violet-100">Effective Capacity</span>
            </div>
            <div className="text-2xl font-bold text-violet-700 dark:text-violet-300">
              {effectiveCapacity} points
            </div>
            <p className="text-sm text-violet-600 dark:text-violet-400 mt-1">
              {config.maxCapacity} max - {config.bufferPercentage}% buffer
            </p>
          </div>
        </div>

        {/* Automation & Notifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="font-semibold text-gray-900 dark:text-white">Automation & Notifications</h3>
          </div>

          {/* Auto Start */}
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Auto-start Next Sprint</span>
              <p className="text-sm text-gray-500 dark:text-gray-400">Automatically start the next sprint when current ends</p>
            </div>
            <button
              onClick={() => setConfig(prev => ({ ...prev, autoStartEnabled: !prev.autoStartEnabled }))}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                config.autoStartEnabled ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}
            >
              <span
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  config.autoStartEnabled ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Notification Settings */}
          <div className="space-y-3">
            {[
              { key: 'sprintStart', label: 'Sprint Start', desc: 'Notify when a sprint begins' },
              { key: 'sprintEnd', label: 'Sprint End', desc: 'Notify 1 day before sprint ends' },
              { key: 'capacityWarning', label: 'Capacity Warning', desc: 'Alert when sprint exceeds capacity' },
              { key: 'dailyStandup', label: 'Daily Standup Reminder', desc: 'Daily reminder for standup meeting' },
            ].map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between py-2">
                <div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{label}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{desc}</p>
                </div>
                <button
                  onClick={() => setConfig(prev => ({
                    ...prev,
                    notifications: { ...prev.notifications, [key]: !prev.notifications[key as keyof typeof prev.notifications] }
                  }))}
                  className={`relative w-10 h-5 rounded-full transition-colors ${
                    config.notifications[key as keyof typeof config.notifications] ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-600'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                      config.notifications[key as keyof typeof config.notifications] ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Sprint Management */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white">Sprint Management</h3>
            </div>
            <button
              onClick={() => setIsCreating(true)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg"
            >
              <Plus className="w-4 h-4" />
              New Sprint
            </button>
          </div>

          {/* Create Sprint Form */}
          {isCreating && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-violet-50 dark:bg-violet-900/20 rounded-lg border border-violet-200 dark:border-violet-800"
            >
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sprint Name</label>
                  <input
                    type="text"
                    value={newSprint.name}
                    onChange={(e) => setNewSprint(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Sprint 4"
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={newSprint.startDate}
                    onChange={(e) => setNewSprint(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
              </div>
              <div className="mb-3">
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Sprint Goal</label>
                <input
                  type="text"
                  value={newSprint.goal}
                  onChange={(e) => setNewSprint(prev => ({ ...prev, goal: e.target.value }))}
                  placeholder="What do you want to achieve?"
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setIsCreating(false)}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateSprint}
                  disabled={!newSprint.name || !newSprint.startDate}
                  className="px-3 py-1.5 text-sm bg-violet-600 hover:bg-violet-700 text-white rounded-lg disabled:opacity-50"
                >
                  Create Sprint
                </button>
              </div>
            </motion.div>
          )}

          {/* Sprint List */}
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {mappedSprints.map(sprint => (
              <div
                key={sprint.id}
                className={`p-3 rounded-lg border ${
                  sprint.status === 'active' 
                    ? 'border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20'
                    : sprint.status === 'completed'
                      ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {editingSprint === sprint.id ? (
                  <div className="space-y-2">
                    <input
                      type="text"
                      defaultValue={sprint.name}
                      onBlur={(e) => handleUpdateSprint(sprint.id, { name: e.target.value })}
                      className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      autoFocus
                    />
                    <input
                      type="text"
                      defaultValue={sprint.goal}
                      onBlur={(e) => handleUpdateSprint(sprint.id, { goal: e.target.value })}
                      placeholder="Sprint goal"
                      className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-gray-700 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white text-sm">{sprint.name}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          sprint.status === 'active' 
                            ? 'bg-violet-200 dark:bg-violet-800 text-violet-700 dark:text-violet-300'
                            : sprint.status === 'completed'
                              ? 'bg-emerald-200 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300'
                              : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                        }`}>
                          {sprint.status}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {sprint.startDate} → {sprint.endDate}
                      </p>
                      {sprint.goal && (
                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1 italic">{sprint.goal}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => setEditingSprint(sprint.id)}
                        className="p-1.5 text-gray-400 hover:text-violet-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Clock className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleDeleteSprint(sprint.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
