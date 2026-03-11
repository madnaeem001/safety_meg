import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FolderKanban,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  Users,
  FileQuestion,
  ChevronRight,
  Plus,
  Briefcase,
  Target,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { PROJECT_SCHEDULE, RFI_REGISTER, ScheduleTask, RFI } from '../../../data/mockProjectManagement';

// Project workflow stages
type PMStage = 'overview' | 'schedule' | 'rfi' | 'milestones' | 'resources';

interface ProjectWorkflowProps {
  onBack?: () => void;
}

// Mock milestone data
const mockMilestones = [
  { id: 'M-001', name: 'Site Mobilization', dueDate: '2026-01-15', status: 'completed', owner: 'Project Manager' },
  { id: 'M-002', name: 'Foundation Complete', dueDate: '2026-02-10', status: 'in_progress', owner: 'Site Supervisor' },
  { id: 'M-003', name: 'Steel Erection Start', dueDate: '2026-02-15', status: 'pending', owner: 'Steel Contractor' },
  { id: 'M-004', name: 'Roof Deck Complete', dueDate: '2026-03-25', status: 'pending', owner: 'Steel Contractor' },
  { id: 'M-005', name: 'MEP Rough-in Complete', dueDate: '2026-04-20', status: 'pending', owner: 'MEP Coordinator' },
];

// Mock resources data
const mockResources = [
  { id: 'R-001', name: 'Site Crew A', type: 'Labor', assigned: 'Foundation Work', utilization: 95 },
  { id: 'R-002', name: 'Crane #1', type: 'Equipment', assigned: 'Steel Erection', utilization: 0 },
  { id: 'R-003', name: 'Electricians Team', type: 'Labor', assigned: 'Electrical Rough-in', utilization: 0 },
  { id: 'R-004', name: 'Concrete Pump', type: 'Equipment', assigned: 'Foundation Work', utilization: 60 },
  { id: 'R-005', name: 'Safety Officer', type: 'Personnel', assigned: 'Site-wide', utilization: 100 },
];

const statusColors = {
  'On Track': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'Delayed': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'Completed': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'Open': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
  'Closed': { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
  'Overdue': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
  'completed': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
  'in_progress': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
  'pending': { bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-200' },
};

// Stage tabs
const pmStages: { id: PMStage; name: string; icon: React.ElementType }[] = [
  { id: 'overview', name: 'Overview', icon: BarChart3 },
  { id: 'schedule', name: 'Schedule', icon: Calendar },
  { id: 'rfi', name: 'RFI Register', icon: FileQuestion },
  { id: 'milestones', name: 'Milestones', icon: Target },
  { id: 'resources', name: 'Resources', icon: Users },
];

export const ProjectWorkflow: React.FC<ProjectWorkflowProps> = () => {
  const [activeStage, setActiveStage] = useState<PMStage>('overview');

  // Calculate metrics
  const completedTasks = PROJECT_SCHEDULE.filter(t => t.status === 'Completed').length;
  const totalTasks = PROJECT_SCHEDULE.length;
  const openRFIs = RFI_REGISTER.filter(r => r.status === 'Open' || r.status === 'Overdue').length;
  const overdueRFIs = RFI_REGISTER.filter(r => r.status === 'Overdue').length;
  const avgProgress = Math.round(PROJECT_SCHEDULE.reduce((sum, t) => sum + t.progress, 0) / totalTasks);

  // Overview Dashboard
  const renderOverview = () => (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl border border-surface-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-brand-100 rounded-lg">
              <TrendingUp className="w-4 h-4 text-brand-600" />
            </div>
            <span className="text-xs text-surface-500">Overall Progress</span>
          </div>
          <div className="text-2xl font-bold text-surface-800">{avgProgress}%</div>
          <div className="h-1.5 bg-surface-100 rounded-full mt-2 overflow-hidden">
            <div className="h-full bg-brand-500 rounded-full" style={{ width: `${avgProgress}%` }} />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-xl border border-surface-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
            </div>
            <span className="text-xs text-surface-500">Tasks Completed</span>
          </div>
          <div className="text-2xl font-bold text-surface-800">{completedTasks}/{totalTasks}</div>
          <div className="text-[10px] text-green-600 mt-1">On schedule</div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl border border-surface-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <FileQuestion className="w-4 h-4 text-amber-600" />
            </div>
            <span className="text-xs text-surface-500">Open RFIs</span>
          </div>
          <div className="text-2xl font-bold text-surface-800">{openRFIs}</div>
          {overdueRFIs > 0 && (
            <div className="text-[10px] text-red-600 mt-1">{overdueRFIs} overdue</div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-xl border border-surface-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Target className="w-4 h-4 text-purple-600" />
            </div>
            <span className="text-xs text-surface-500">Milestones</span>
          </div>
          <div className="text-2xl font-bold text-surface-800">
            {mockMilestones.filter(m => m.status === 'completed').length}/{mockMilestones.length}
          </div>
          <div className="text-[10px] text-surface-400 mt-1">Complete</div>
        </motion.div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Active Tasks */}
        <div className="bg-white rounded-xl border border-surface-200 p-4">
          <h3 className="text-sm font-semibold text-surface-800 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand-600" />
            Active Tasks
          </h3>
          <div className="space-y-2">
            {PROJECT_SCHEDULE.filter(t => t.status !== 'Completed').slice(0, 3).map((task) => (
              <div key={task.id} className="p-3 bg-surface-50 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-surface-400">{task.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                    {task.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-surface-800">{task.task}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] text-surface-400">{task.progress}% complete</span>
                  <div className="w-24 h-1 bg-surface-200 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-500 rounded-full" style={{ width: `${task.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent RFIs */}
        <div className="bg-white rounded-xl border border-surface-200 p-4">
          <h3 className="text-sm font-semibold text-surface-800 mb-3 flex items-center gap-2">
            <FileQuestion className="w-4 h-4 text-amber-600" />
            Recent RFIs
          </h3>
          <div className="space-y-2">
            {RFI_REGISTER.slice(0, 3).map((rfi) => (
              <div key={rfi.id} className={`p-3 rounded-lg ${rfi.status === 'Overdue' ? 'bg-red-50 border border-red-100' : 'bg-surface-50'}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-surface-400">{rfi.id}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[rfi.status].bg} ${statusColors[rfi.status].text}`}>
                    {rfi.status}
                  </span>
                </div>
                <p className="text-sm font-medium text-surface-800 line-clamp-1">{rfi.subject}</p>
                <p className="text-[10px] text-surface-400 mt-1">Due: {new Date(rfi.dueDate).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Schedule View
  const renderSchedule = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-800">Project Schedule</h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-3 h-3" />
          Add Task
        </button>
      </div>
      
      <div className="bg-white rounded-xl border border-surface-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50 border-b border-surface-200">
                <th className="text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Task ID</th>
                <th className="text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Task</th>
                <th className="text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Start</th>
                <th className="text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">End</th>
                <th className="text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Progress</th>
                <th className="text-left text-[10px] font-semibold text-surface-500 uppercase tracking-wider px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {PROJECT_SCHEDULE.map((task, idx) => (
                <motion.tr
                  key={task.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="border-b border-surface-100 hover:bg-surface-50 cursor-pointer"
                >
                  <td className="px-4 py-3 text-xs font-mono text-surface-500">{task.id}</td>
                  <td className="px-4 py-3 text-sm font-medium text-surface-800">{task.task}</td>
                  <td className="px-4 py-3 text-xs text-surface-500">{new Date(task.startDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3 text-xs text-surface-500">{new Date(task.endDate).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-surface-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${task.progress === 100 ? 'bg-green-500' : 'bg-brand-500'}`}
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-xs text-surface-500">{task.progress}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-1 rounded ${statusColors[task.status].bg} ${statusColors[task.status].text}`}>
                      {task.status}
                    </span>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // RFI View
  const renderRFI = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-800">RFI Register</h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-3 h-3" />
          New RFI
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {RFI_REGISTER.map((rfi, idx) => (
          <motion.div
            key={rfi.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className={`bg-white rounded-xl border p-4 cursor-pointer hover:shadow-md transition-shadow ${
              rfi.status === 'Overdue' ? 'border-red-200 bg-red-50/50' : 'border-surface-200'
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <span className="text-xs font-mono text-surface-400">{rfi.id}</span>
              <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[rfi.status].bg} ${statusColors[rfi.status].text}`}>
                {rfi.status}
              </span>
            </div>
            <h4 className="font-semibold text-surface-800 text-sm mb-2 line-clamp-2">{rfi.subject}</h4>
            <div className="space-y-1 text-[10px] text-surface-500">
              <div className="flex items-center justify-between">
                <span>From:</span>
                <span className="font-medium text-surface-700">{rfi.from}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>To:</span>
                <span className="font-medium text-surface-700">{rfi.to}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Submitted:</span>
                <span>{new Date(rfi.dateSubmitted).toLocaleDateString()}</span>
              </div>
              <div className={`flex items-center justify-between ${rfi.status === 'Overdue' ? 'text-red-600 font-semibold' : ''}`}>
                <span>Due:</span>
                <span>{new Date(rfi.dueDate).toLocaleDateString()}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  // Milestones View
  const renderMilestones = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-800">Project Milestones</h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-3 h-3" />
          Add Milestone
        </button>
      </div>

      <div className="bg-white rounded-xl border border-surface-200 p-4">
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-200" />
          
          <div className="space-y-4">
            {mockMilestones.map((milestone, idx) => (
              <motion.div
                key={milestone.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="relative pl-10"
              >
                {/* Timeline dot */}
                <div className={`absolute left-2 top-2 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  milestone.status === 'completed' ? 'bg-green-500 border-green-500' :
                  milestone.status === 'in_progress' ? 'bg-blue-500 border-blue-500' :
                  'bg-white border-surface-300'
                }`}>
                  {milestone.status === 'completed' && <CheckCircle2 className="w-3 h-3 text-white" />}
                  {milestone.status === 'in_progress' && <Clock className="w-3 h-3 text-white" />}
                </div>

                <div className={`p-4 rounded-xl border ${
                  milestone.status === 'completed' ? 'bg-green-50 border-green-200' :
                  milestone.status === 'in_progress' ? 'bg-blue-50 border-blue-200' :
                  'bg-surface-50 border-surface-200'
                }`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-surface-400">{milestone.id}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${statusColors[milestone.status].bg} ${statusColors[milestone.status].text}`}>
                      {milestone.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h4 className="font-semibold text-surface-800 text-sm">{milestone.name}</h4>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-surface-500">
                    <span>Due: {new Date(milestone.dueDate).toLocaleDateString()}</span>
                    <span>Owner: {milestone.owner}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Resources View
  const renderResources = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-surface-800">Resource Allocation</h3>
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors">
          <Plus className="w-3 h-3" />
          Add Resource
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {mockResources.map((resource, idx) => (
          <motion.div
            key={resource.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white rounded-xl border border-surface-200 p-4"
          >
            <div className="flex items-start justify-between mb-2">
              <div className={`p-2 rounded-lg ${
                resource.type === 'Labor' ? 'bg-blue-100' :
                resource.type === 'Equipment' ? 'bg-orange-100' :
                'bg-purple-100'
              }`}>
                {resource.type === 'Labor' ? <Users className="w-4 h-4 text-blue-600" /> :
                 resource.type === 'Equipment' ? <Briefcase className="w-4 h-4 text-orange-600" /> :
                 <Users className="w-4 h-4 text-purple-600" />}
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded ${
                resource.type === 'Labor' ? 'bg-blue-100 text-blue-700' :
                resource.type === 'Equipment' ? 'bg-orange-100 text-orange-700' :
                'bg-purple-100 text-purple-700'
              }`}>
                {resource.type}
              </span>
            </div>
            <h4 className="font-semibold text-surface-800 text-sm mb-1">{resource.name}</h4>
            <p className="text-xs text-surface-500 mb-3">Assigned: {resource.assigned}</p>
            <div>
              <div className="flex items-center justify-between text-[10px] mb-1">
                <span className="text-surface-500">Utilization</span>
                <span className={`font-semibold ${
                  resource.utilization >= 80 ? 'text-green-600' :
                  resource.utilization >= 40 ? 'text-amber-600' :
                  'text-surface-400'
                }`}>{resource.utilization}%</span>
              </div>
              <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    resource.utilization >= 80 ? 'bg-green-500' :
                    resource.utilization >= 40 ? 'bg-amber-500' :
                    'bg-surface-300'
                  }`}
                  style={{ width: `${resource.utilization}%` }}
                />
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeStage) {
      case 'overview': return renderOverview();
      case 'schedule': return renderSchedule();
      case 'rfi': return renderRFI();
      case 'milestones': return renderMilestones();
      case 'resources': return renderResources();
      default: return renderOverview();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-surface-200/60 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <FolderKanban className="w-5 h-5 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-surface-800">Project Management</h1>
                <p className="text-xs text-surface-500">Construction project workflow tracking</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-surface-400 hidden sm:block">
                {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>

          {/* Stage Tabs */}
          <div className="flex gap-1 overflow-x-auto pb-1">
            {pmStages.map((stage) => {
              const IconComponent = stage.icon;
              const isActive = activeStage === stage.id;
              return (
                <motion.button
                  key={stage.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setActiveStage(stage.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-lg'
                      : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {stage.name}
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <motion.div
          key={activeStage}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {renderContent()}
        </motion.div>
      </div>
    </div>
  );
};

export default ProjectWorkflow;
