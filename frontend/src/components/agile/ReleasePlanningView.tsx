import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Package, Calendar, Target, CheckCircle, Clock, AlertTriangle,
  Plus, Trash2, ChevronRight, Tag, Users, Layers,
  TrendingUp, GitBranch, Rocket, Eye, Settings
} from 'lucide-react';
import { ProjectTask, Epic, INITIAL_TASKS, EPICS, SPRINTS, Sprint } from '../../data/mockProjectManagement';
import { ReleaseRecord } from '../../api/services/apiService';
import {
  useReleases,
  useCreateRelease,
  useDeleteRelease,
  useUpdateReleaseStatus,
} from '../../api/hooks/useAPIHooks';

// Re-export status type for use by tests / parent components
export type ReleaseStatus = 'planning' | 'in_progress' | 'released' | 'archived';
// Keep the Release shape aligned with the backend record so callers can import it
export type Release = ReleaseRecord;

interface ReleasePlanningViewProps {
  tasks?: ProjectTask[];
  epics?: Epic[];
  sprints?: Sprint[];
}

export function ReleasePlanningView({ 
  tasks = [] as ProjectTask[], 
  epics = [] as Epic[],
  sprints = [] as Sprint[]
}: ReleasePlanningViewProps) {
  const { data: releasesRaw, loading, error, refetch } = useReleases();
  const releases = releasesRaw ?? [];
  const createRelease = useCreateRelease();
  const deleteRelease = useDeleteRelease();
  const updateStatus = useUpdateReleaseStatus();

  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [view, setView] = useState<'timeline' | 'board' | 'details'>('timeline');
  const [isAddingRelease, setIsAddingRelease] = useState(false);
  const [newRelease, setNewRelease] = useState({
    version: '',
    name: '',
    description: '',
    plannedDate: '',
    owner: ''
  });

  const selectedRelease = selectedReleaseId != null
    ? releases.find(r => r.id === selectedReleaseId) ?? null
    : releases[0] ?? null;

  const statusConfig = {
    planning: { label: 'Planning', color: 'gray', icon: Target, bgColor: 'bg-surface-sunken' },
    in_progress: { label: 'In Progress', color: 'blue', icon: Clock, bgColor: 'bg-accent/10' },
    released: { label: 'Released', color: 'emerald', icon: CheckCircle, bgColor: 'bg-success/10' },
    archived: { label: 'Archived', color: 'gray', icon: Package, bgColor: 'bg-surface-sunken' }
  };

  const riskConfig = {
    low: { label: 'Low Risk', color: 'emerald', icon: '🟢' },
    medium: { label: 'Medium Risk', color: 'amber', icon: '🟡' },
    high: { label: 'High Risk', color: 'red', icon: '🔴' }
  };

  const releaseStats = useMemo(() => {
    return {
      total: releases.length,
      planning: releases.filter(r => r.status === 'planning').length,
      inProgress: releases.filter(r => r.status === 'in_progress').length,
      released: releases.filter(r => r.status === 'released').length,
    };
  }, [releases]);

  const getEpicsByRelease = (release: Release) => {
    return epics.filter(e => release.epicIds.includes(e.id));
  };

  const getTasksByEpic = (epicId: string) => {
    return tasks.filter(t => t.epicId === epicId);
  };

  const handleAddRelease = async () => {
    if (!newRelease.version || !newRelease.name) return;
    await createRelease.mutate({
      version: newRelease.version,
      name: newRelease.name,
      description: newRelease.description,
      plannedDate: newRelease.plannedDate,
      owner: newRelease.owner || 'You',
    });
    await refetch();
    setNewRelease({ version: '', name: '', description: '', plannedDate: '', owner: '' });
    setIsAddingRelease(false);
  };

  const handleDeleteRelease = async (releaseId: number) => {
    await deleteRelease.mutate(releaseId);
    await refetch();
    if (selectedReleaseId === releaseId) {
      setSelectedReleaseId(null);
    }
  };

  const handleUpdateStatus = async (releaseId: number, status: ReleaseStatus) => {
    await updateStatus.mutate({ id: releaseId, status });
    await refetch();
  };

  return (
    <div className="space-y-6">
      {/* Loading / Error states */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      {error && (
        <div className="p-4 bg-danger/10 border border-danger/20 rounded-xl text-danger text-sm">
          Failed to load releases. Please try again.
        </div>
      )}
      {!loading && !error && (
      <>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-accent/10 rounded-lg">
            <Package className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary text-text-primary">Release Planning</h2>
            <p className="text-sm text-text-muted">Plan and track software releases</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex bg-surface-sunken rounded-lg p-1">
            {[
              { id: 'timeline', label: 'Timeline', icon: GitBranch },
              { id: 'board', label: 'Board', icon: Layers },
              { id: 'details', label: 'Details', icon: Eye },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setView(id as 'timeline' | 'board' | 'details')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors ${
                  view === id
                    ? 'bg-surface-raised text-text-primary text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setIsAddingRelease(true)}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm"
          >
            <Plus className="w-4 h-4" />
            New Release
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Releases', value: releaseStats.total, icon: Package, color: 'gray' },
          { label: 'Planning', value: releaseStats.planning, icon: Target, color: 'gray' },
          { label: 'In Progress', value: releaseStats.inProgress, icon: Clock, color: 'blue' },
          { label: 'Released', value: releaseStats.released, icon: Rocket, color: 'emerald' },
        ].map(stat => (
          <div
            key={stat.label}
            className="bg-surface-raised rounded-xl border border-surface-border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm text-text-muted">{stat.label}</span>
              <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
            </div>
            <p className="text-2xl font-bold text-text-primary text-text-primary mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Add Release Modal */}
      {isAddingRelease && (
        <div className="bg-surface-raised rounded-xl border border-surface-border p-6">
          <h3 className="text-lg font-semibold text-text-primary text-text-primary mb-4">Create New Release</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Version</label>
              <input
                type="text"
                value={newRelease.version}
                onChange={(e) => setNewRelease(prev => ({ ...prev, version: e.target.value }))}
                placeholder="e.g., v2.3.0"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Release Name</label>
              <input
                type="text"
                value={newRelease.name}
                onChange={(e) => setNewRelease(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Performance Update"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Planned Date</label>
              <input
                type="date"
                value={newRelease.plannedDate}
                onChange={(e) => setNewRelease(prev => ({ ...prev, plannedDate: e.target.value }))}
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
              <input
                type="text"
                value={newRelease.owner}
                onChange={(e) => setNewRelease(prev => ({ ...prev, owner: e.target.value }))}
                placeholder="Release manager name"
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={newRelease.description}
                onChange={(e) => setNewRelease(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Release description..."
                rows={3}
                className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary resize-none"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setIsAddingRelease(false)}
              className="px-4 py-2 text-sm text-text-secondary"
            >
              Cancel
            </button>
            <button
              onClick={handleAddRelease}
              disabled={!newRelease.version || !newRelease.name}
              className="px-4 py-2 text-sm bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50"
            >
              Create Release
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      {view === 'timeline' && (
        /* Timeline View */
        <div className="bg-surface-raised rounded-xl border border-surface-border p-6">
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-sunken" />

            {/* Releases */}
            <div className="space-y-8">
              {[...releases].sort((a, b) => new Date(b.plannedDate || b.releaseDate).getTime() - new Date(a.plannedDate || a.releaseDate).getTime()).map((release, index) => {
                const config = statusConfig[release.status];
                const risk = riskConfig[release.riskLevel];

                return (
                  <motion.div
                    key={release.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative pl-12"
                  >
                    {/* Timeline Node */}
                    <div className={`absolute left-0 top-0 w-8 h-8 rounded-full flex items-center justify-center ${config.bgColor}`}>
                      <config.icon className={`w-4 h-4 text-${config.color}-600`} />
                    </div>

                    {/* Release Card */}
                    <div
                      onClick={() => setSelectedReleaseId(release.id)}
                      className={`p-4 rounded-xl border cursor-pointer transition-all ${
                        selectedReleaseId === release.id
                          ? 'border-accent bg-accent/10 ring-1 ring-indigo-500'
                          : 'border-surface-border hover:border-accent/30'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3 mb-1">
                            <span className="text-lg font-bold text-accent">{release.version}</span>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full text-text-primary ${config.bgColor}`}>
                              {config.label}
                            </span>
                            <span className="text-sm">{risk.icon}</span>
                          </div>
                          <h4 className="text-lg font-semibold text-text-primary text-text-primary">{release.name}</h4>
                          <p className="text-sm text-text-secondary mt-1">{release.description}</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-text-muted" />
                      </div>

                      {/* Progress & Meta */}
                      <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-text-muted">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {release.status === 'released' ? release.releaseDate : release.plannedDate}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {release.owner}
                        </div>
                        <div className="flex items-center gap-1">
                          <Tag className="w-4 h-4" />
                          {release.features.length} features
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-text-secondary">Progress</span>
                          <span className="font-medium text-text-primary text-text-primary">{release.progress}%</span>
                        </div>
                        <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              release.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                            style={{ width: `${release.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {view === 'board' && (
        /* Board View - Kanban style */
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {(['planning', 'in_progress', 'released', 'archived'] as ReleaseStatus[]).map(status => {
            const config = statusConfig[status];
            const statusReleases = releases.filter(r => r.status === status);

            return (
              <div key={status} className="bg-surface-sunken rounded-xl p-4">
                <div className="flex items-center gap-2 mb-4">
                  <config.icon className={`w-5 h-5 text-${config.color}-600`} />
                  <span className="font-medium text-text-primary text-text-primary">{config.label}</span>
                  <span className="ml-auto px-2 py-0.5 text-xs font-medium bg-surface-sunken text-text-secondary rounded-full">
                    {statusReleases.length}
                  </span>
                </div>

                <div className="space-y-3">
                  {statusReleases.map(release => (
                    <div
                      key={release.id}
                      onClick={() => {
                        setSelectedReleaseId(release.id);
                        setView('details');
                      }}
                      className="bg-surface-raised rounded-lg p-3 border border-surface-border cursor-pointer hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-sm font-bold text-accent">{release.version}</span>
                        <span className="text-sm">{riskConfig[release.riskLevel].icon}</span>
                      </div>
                      <h5 className="font-medium text-text-primary text-text-primary text-sm">{release.name}</h5>
                      <div className="flex items-center justify-between mt-2 text-xs text-text-muted">
                        <span>{release.plannedDate || release.releaseDate}</span>
                        <span>{release.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-surface-sunken rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${release.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                          style={{ width: `${release.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'details' && selectedRelease && (
        /* Details View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Release Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-surface-raised rounded-xl border border-surface-border p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl font-bold text-accent">{selectedRelease.version}</span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusConfig[selectedRelease.status].bgColor} text-text-primary`}>
                      {statusConfig[selectedRelease.status].label}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-text-primary text-text-primary">{selectedRelease.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-text-muted hover:text-text-primary rounded-lg hover:bg-surface-sunken">
                    <Settings className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => handleDeleteRelease(selectedRelease.id)}
                    className="p-2 text-text-muted hover:text-red-500 rounded-lg hover:bg-danger/10"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <p className="text-text-secondary mb-6">{selectedRelease.description}</p>

              {/* Progress */}
              <div className="mb-6">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="font-medium text-gray-700">Release Progress</span>
                  <span className="font-bold text-text-primary text-text-primary">{selectedRelease.progress}%</span>
                </div>
                <div className="h-3 bg-surface-sunken rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${selectedRelease.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                    style={{ width: `${selectedRelease.progress}%` }}
                  />
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-text-primary text-text-primary mb-3 flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Features ({selectedRelease.features.length})
                </h4>
                <div className="space-y-2">
                  {selectedRelease.features.map((feature, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-2 bg-surface-sunken rounded-lg">
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                      <span className="text-sm text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Epics in Release */}
              {selectedRelease.epicIds.length > 0 && (
                <div>
                  <h4 className="font-semibold text-text-primary text-text-primary mb-3 flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Epics
                  </h4>
                  <div className="space-y-2">
                    {getEpicsByRelease(selectedRelease).map(epic => {
                      const epicTasks = getTasksByEpic(epic.id);
                      const completedTasks = epicTasks.filter(t => t.status === 'completed').length;

                      return (
                        <div key={epic.id} className="p-3 border border-surface-border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: epic.color }} />
                            <span className="font-medium text-text-primary text-text-primary">{epic.name}</span>
                            <span className="text-sm text-text-muted ml-auto">
                              {completedTasks}/{epicTasks.length} tasks
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Status Actions */}
            <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
              <h4 className="font-semibold text-text-primary text-text-primary mb-3">Update Status</h4>
              <div className="flex flex-wrap gap-2">
                {(['planning', 'in_progress', 'released', 'archived'] as ReleaseStatus[]).map(status => {
                  const config = statusConfig[status];
                  return (
                    <button
                      key={status}
                      onClick={() => handleUpdateStatus(selectedRelease.id, status)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors ${
                        selectedRelease.status === status
                          ? `${config.bgColor} ring-2 ring-${config.color}-500`
                          : 'bg-surface-sunken hover:bg-surface-sunken'
                      }`}
                    >
                      <config.icon className="w-4 h-4" />
                      {config.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Release Info Card */}
            <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
              <h4 className="font-semibold text-text-primary text-text-primary mb-4">Release Info</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-muted">Planned Date</span>
                  <span className="text-text-primary text-text-primary">{selectedRelease.plannedDate}</span>
                </div>
                {selectedRelease.releaseDate && (
                  <div className="flex justify-between">
                    <span className="text-text-muted">Released Date</span>
                    <span className="text-success">{selectedRelease.releaseDate}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-text-muted">Owner</span>
                  <span className="text-text-primary text-text-primary">{selectedRelease.owner}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-text-muted">Risk Level</span>
                  <span className={`flex items-center gap-1 text-text-secondary`}>
                    {riskConfig[selectedRelease.riskLevel].icon} {riskConfig[selectedRelease.riskLevel].label}
                  </span>
                </div>
              </div>
            </div>

            {/* Dependencies */}
            {selectedRelease.dependencies.length > 0 && (
              <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
                <h4 className="font-semibold text-text-primary text-text-primary mb-3 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Dependencies
                </h4>
                <div className="space-y-2">
                  {selectedRelease.dependencies.map((dep, idx) => (
                    <div key={idx} className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                      <Clock className="w-4 h-4 text-warning" />
                      <span className="text-sm text-warning">{dep}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changelog */}
            {selectedRelease.changelog.length > 0 && (
              <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
                <h4 className="font-semibold text-text-primary text-text-primary mb-3">Changelog</h4>
                <ul className="space-y-2">
                  {selectedRelease.changelog.map((change, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-text-secondary">
                      <span className="text-indigo-500 mt-1">•</span>
                      {change}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}
      </>
      )}
    </div>
  );
}
