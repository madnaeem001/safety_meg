import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutGrid,
  Plus,
  X,
  Settings,
  Move,
  Maximize2,
  Minimize2,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Shield,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  FileText,
  Activity,
  BarChart3,
  Target,
  Zap,
  Award,
  Flame,
  Heart,
  Eye
} from 'lucide-react';

type WidgetSize = 'small' | 'medium' | 'large';
type WidgetType = 'metric' | 'chart' | 'list' | 'progress' | 'calendar' | 'activity';

interface Widget {
  id: string;
  type: WidgetType;
  title: string;
  icon: React.ReactNode;
  size: WidgetSize;
  color: string;
  data: any;
  position: number;
  visible: boolean;
}

interface DashboardWidgetsProps {
  editable?: boolean;
  onWidgetClick?: (widgetId: string) => void;
}

const defaultWidgets: Widget[] = [
  {
    id: 'safety-score',
    type: 'metric',
    title: 'Safety Score',
    icon: <Shield className="w-5 h-5" />,
    size: 'medium',
    color: 'from-emerald-500 to-teal-600',
    position: 0,
    visible: true,
    data: { value: 94.5, trend: 2.3, unit: '%', label: 'Overall Safety Performance' }
  },
  {
    id: 'days-safe',
    type: 'metric',
    title: 'Days Without Incident',
    icon: <Award className="w-5 h-5" />,
    size: 'small',
    color: 'from-blue-500 to-indigo-600',
    position: 1,
    visible: true,
    data: { value: 42, trend: 42, unit: ' days', label: 'Current streak' }
  },
  {
    id: 'open-incidents',
    type: 'metric',
    title: 'Open Incidents',
    icon: <AlertTriangle className="w-5 h-5" />,
    size: 'small',
    color: 'from-amber-500 to-orange-600',
    position: 2,
    visible: true,
    data: { value: 8, trend: -2, unit: '', label: 'Requires attention' }
  },
  {
    id: 'pending-actions',
    type: 'metric',
    title: 'Pending CAPA',
    icon: <Clock className="w-5 h-5" />,
    size: 'small',
    color: 'from-red-500 to-rose-600',
    position: 3,
    visible: true,
    data: { value: 12, trend: 3, unit: '', label: 'Actions due' }
  },
  {
    id: 'training-compliance',
    type: 'progress',
    title: 'Training Compliance',
    icon: <Users className="w-5 h-5" />,
    size: 'medium',
    color: 'from-purple-500 to-violet-600',
    position: 4,
    visible: true,
    data: { current: 812, total: 847, percentage: 95.8, label: 'Employees trained' }
  },
  {
    id: 'trir',
    type: 'metric',
    title: 'TRIR',
    icon: <Activity className="w-5 h-5" />,
    size: 'small',
    color: 'from-cyan-500 to-blue-600',
    position: 5,
    visible: true,
    data: { value: 1.24, trend: -0.3, unit: '', label: 'Total Recordable Rate' }
  },
  {
    id: 'near-misses',
    type: 'metric',
    title: 'Near Misses',
    icon: <Eye className="w-5 h-5" />,
    size: 'small',
    color: 'from-yellow-500 to-amber-600',
    position: 6,
    visible: true,
    data: { value: 24, trend: 5, unit: '', label: 'This month' }
  },
  {
    id: 'upcoming-inspections',
    type: 'list',
    title: 'Upcoming Inspections',
    icon: <Calendar className="w-5 h-5" />,
    size: 'large',
    color: 'from-indigo-500 to-purple-600',
    position: 7,
    visible: true,
    data: {
      items: [
        { id: '1', title: 'SWPPP Monthly Inspection', date: '2026-01-28', status: 'scheduled' },
        { id: '2', title: 'Fire Extinguisher Check', date: '2026-01-30', status: 'scheduled' },
        { id: '3', title: 'Crane Safety Inspection', date: '2026-02-01', status: 'scheduled' },
        { id: '4', title: 'Electrical Panel Audit', date: '2026-02-05', status: 'scheduled' }
      ]
    }
  },
  {
    id: 'recent-incidents',
    type: 'list',
    title: 'Recent Incidents',
    icon: <AlertTriangle className="w-5 h-5" />,
    size: 'large',
    color: 'from-red-500 to-pink-600',
    position: 8,
    visible: true,
    data: {
      items: [
        { id: '1', title: 'Near miss - forklift', date: '2026-01-25', severity: 'medium' },
        { id: '2', title: 'Minor cut - assembly line', date: '2026-01-24', severity: 'low' },
        { id: '3', title: 'Chemical spill contained', date: '2026-01-22', severity: 'high' }
      ]
    }
  },
  {
    id: 'compliance-score',
    type: 'progress',
    title: 'Compliance Score',
    icon: <CheckCircle2 className="w-5 h-5" />,
    size: 'medium',
    color: 'from-green-500 to-emerald-600',
    position: 9,
    visible: true,
    data: { current: 47, total: 50, percentage: 94, label: 'Items compliant' }
  }
];

export const DashboardWidgets: React.FC<DashboardWidgetsProps> = ({ 
  editable = false,
  onWidgetClick 
}) => {
  const [widgets, setWidgets] = useState<Widget[]>(defaultWidgets);
  const [editMode, setEditMode] = useState(false);
  const [showWidgetLibrary, setShowWidgetLibrary] = useState(false);

  const visibleWidgets = useMemo(() => 
    widgets.filter(w => w.visible).sort((a, b) => a.position - b.position),
    [widgets]
  );

  const toggleWidgetVisibility = (widgetId: string) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, visible: !w.visible } : w
    ));
  };

  const changeWidgetSize = (widgetId: string, size: WidgetSize) => {
    setWidgets(prev => prev.map(w => 
      w.id === widgetId ? { ...w, size } : w
    ));
  };

  const renderWidgetContent = (widget: Widget) => {
    switch (widget.type) {
      case 'metric':
        return (
          <div className="h-full flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} text-white`}>
                {widget.icon}
              </div>
              {widget.data.trend !== undefined && (
                <div className={`flex items-center gap-1 text-sm ${
                  widget.data.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                }`}>
                  {widget.data.trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {Math.abs(widget.data.trend)}{widget.data.unit === '%' ? '%' : ''}
                </div>
              )}
            </div>
            <div className="mt-auto">
              <p className="text-3xl font-bold text-white">
                {widget.data.value}{widget.data.unit}
              </p>
              <p className="text-sm text-slate-400 mt-1">{widget.data.label}</p>
            </div>
          </div>
        );

      case 'progress':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} text-white`}>
                {widget.icon}
              </div>
              <span className="text-slate-400 text-sm">{widget.data.label}</span>
            </div>
            <div className="flex-1 flex items-center">
              <div className="relative w-24 h-24">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-slate-700" />
                  <circle 
                    cx="48" cy="48" r="40" stroke="currentColor" strokeWidth="8" fill="none" 
                    strokeDasharray={`${widget.data.percentage * 2.51} 251`}
                    className="text-emerald-500"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xl font-bold text-white">{widget.data.percentage}%</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-white">{widget.data.current}</p>
                <p className="text-sm text-slate-400">of {widget.data.total}</p>
              </div>
            </div>
          </div>
        );

      case 'list':
        return (
          <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} text-white`}>
                {widget.icon}
              </div>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {widget.data.items.map((item: any) => (
                <div key={item.id} className="p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-white">{item.title}</p>
                    {item.severity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                        item.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                        'bg-green-500/20 text-green-400'
                      }`}>
                        {item.severity}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{item.date}</p>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getWidgetGridClass = (size: WidgetSize) => {
    switch (size) {
      case 'small': return 'col-span-1';
      case 'medium': return 'col-span-1 md:col-span-2';
      case 'large': return 'col-span-1 md:col-span-2 lg:col-span-3';
      default: return 'col-span-1';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-pink-500 to-rose-600 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Dashboard Widgets</h1>
                <p className="text-slate-400 text-sm">Customizable safety metrics at a glance</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowWidgetLibrary(true)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Widget
              </button>
              <button
                onClick={() => setEditMode(!editMode)}
                className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                  editMode 
                    ? 'bg-pink-600 text-white' 
                    : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                {editMode ? 'Done' : 'Edit'}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Widgets Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {visibleWidgets.map((widget, index) => (
            <motion.div
              key={widget.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className={`${getWidgetGridClass(widget.size)} bg-slate-800/50 border border-slate-700/50 rounded-xl p-4 relative group ${
                editMode ? 'cursor-move' : 'cursor-pointer hover:border-slate-600'
              }`}
              onClick={() => !editMode && onWidgetClick?.(widget.id)}
            >
              {/* Edit Controls */}
              {editMode && (
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); changeWidgetSize(widget.id, widget.size === 'small' ? 'medium' : widget.size === 'medium' ? 'large' : 'small'); }}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg"
                  >
                    {widget.size === 'large' ? <Minimize2 className="w-3 h-3 text-white" /> : <Maximize2 className="w-3 h-3 text-white" />}
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleWidgetVisibility(widget.id); }}
                    className="p-1.5 bg-red-500/20 hover:bg-red-500/40 rounded-lg"
                  >
                    <X className="w-3 h-3 text-red-400" />
                  </button>
                </div>
              )}

              {/* Widget Title */}
              <h3 className="text-sm font-medium text-slate-400 mb-3">{widget.title}</h3>

              {/* Widget Content */}
              <div className={`${widget.size === 'small' ? 'h-24' : widget.size === 'medium' ? 'h-32' : 'h-48'}`}>
                {renderWidgetContent(widget)}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Widget Library Modal */}
        <AnimatePresence>
          {showWidgetLibrary && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowWidgetLibrary(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-white">Widget Library</h3>
                  <button onClick={() => setShowWidgetLibrary(false)} className="p-2 hover:bg-slate-700 rounded-lg">
                    <X className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {widgets.map((widget) => (
                    <div
                      key={widget.id}
                      className={`p-4 rounded-xl border transition-all cursor-pointer ${
                        widget.visible 
                          ? 'bg-slate-700/50 border-pink-500/50' 
                          : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
                      }`}
                      onClick={() => toggleWidgetVisibility(widget.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className={`p-2 rounded-lg bg-gradient-to-br ${widget.color} text-white`}>
                          {widget.icon}
                        </div>
                        {widget.visible && <CheckCircle2 className="w-5 h-5 text-pink-400" />}
                      </div>
                      <p className="text-white font-medium">{widget.title}</p>
                      <p className="text-sm text-slate-400">{widget.type} • {widget.size}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default DashboardWidgets;
