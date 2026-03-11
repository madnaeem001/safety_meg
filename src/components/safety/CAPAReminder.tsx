import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, AlertTriangle, CheckCircle2, Calendar, User, Target,
  ChevronDown, ChevronUp, Bell, BellRing, AlertCircle, Timer,
  ArrowRight, Shield, Zap, TrendingUp, XCircle, RefreshCw
} from 'lucide-react';

export interface CAPAAction {
  id: string;
  action: string;
  assignedTo: string;
  assigneeEmail?: string;
  dueDate: string;
  status: 'Open' | 'In Progress' | 'Completed' | 'Overdue' | 'Pending Review';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  sourceType: 'injury' | 'investigation' | 'audit' | 'hazard';
  sourceId: string;
  createdDate: string;
  completedDate?: string;
  notes?: string;
}

interface CAPAReminderProps {
  capaActions?: CAPAAction[];
  onActionClick?: (action: CAPAAction) => void;
  onSendReminder?: (action: CAPAAction) => void;
  compact?: boolean;
}

// Sample CAPA data for demonstration
const SAMPLE_CAPA_DATA: CAPAAction[] = [
  {
    id: 'CAPA-2026-001',
    action: 'Install additional guardrails on mezzanine level B',
    assignedTo: 'John Martinez',
    assigneeEmail: 'jmartinez@company.com',
    dueDate: '2026-02-07',
    status: 'In Progress',
    priority: 'High',
    sourceType: 'injury',
    sourceId: 'INJ-2026-015',
    createdDate: '2026-01-20'
  },
  {
    id: 'CAPA-2026-002',
    action: 'Update chemical handling procedures for Zone 4',
    assignedTo: 'Sarah Chen',
    assigneeEmail: 'schen@company.com',
    dueDate: '2026-02-03',
    status: 'Overdue',
    priority: 'Critical',
    sourceType: 'investigation',
    sourceId: 'INV-2026-008',
    createdDate: '2026-01-15'
  },
  {
    id: 'CAPA-2026-003',
    action: 'Conduct refresher training on lockout/tagout procedures',
    assignedTo: 'Mike Johnson',
    assigneeEmail: 'mjohnson@company.com',
    dueDate: '2026-02-10',
    status: 'Open',
    priority: 'Medium',
    sourceType: 'audit',
    sourceId: 'AUD-2026-003',
    createdDate: '2026-01-25'
  },
  {
    id: 'CAPA-2026-004',
    action: 'Replace worn safety interlocks on Press Machine #7',
    assignedTo: 'David Lee',
    assigneeEmail: 'dlee@company.com',
    dueDate: '2026-02-15',
    status: 'Pending Review',
    priority: 'High',
    sourceType: 'hazard',
    sourceId: 'HAZ-2026-022',
    createdDate: '2026-01-28'
  },
  {
    id: 'CAPA-2026-005',
    action: 'Install emergency eyewash station in Lab C',
    assignedTo: 'Emily Wilson',
    assigneeEmail: 'ewilson@company.com',
    dueDate: '2026-02-20',
    status: 'Open',
    priority: 'Low',
    sourceType: 'audit',
    sourceId: 'AUD-2026-004',
    createdDate: '2026-02-01'
  }
];

// Calculate days remaining/overdue
const calculateDaysRemaining = (dueDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);
  const diffTime = due.getTime() - today.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Status badge component
const StatusBadge: React.FC<{ status: CAPAAction['status'] }> = ({ status }) => {
  const config = {
    'Open': { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    'In Progress': { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-200' },
    'Completed': { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    'Overdue': { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' },
    'Pending Review': { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' }
  };
  const { bg, text, border } = config[status];
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${bg} ${text} border ${border}`}>
      {status}
    </span>
  );
};

// Priority indicator component
const PriorityIndicator: React.FC<{ priority: CAPAAction['priority'] }> = ({ priority }) => {
  const config = {
    'Low': { color: 'text-green-500', bg: 'bg-green-500' },
    'Medium': { color: 'text-yellow-500', bg: 'bg-yellow-500' },
    'High': { color: 'text-orange-500', bg: 'bg-orange-500' },
    'Critical': { color: 'text-red-500', bg: 'bg-red-500' }
  };
  const { color, bg } = config[priority];
  
  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${bg} ${priority === 'Critical' ? 'animate-pulse' : ''}`} />
      <span className={`text-xs font-medium ${color}`}>{priority}</span>
    </div>
  );
};

// Days remaining indicator
const DaysIndicator: React.FC<{ days: number }> = ({ days }) => {
  let colorClass = 'text-green-600 bg-green-50';
  let icon = <Clock className="w-4 h-4" />;
  let text = `${days} days left`;
  
  if (days < 0) {
    colorClass = 'text-red-600 bg-red-50';
    icon = <AlertTriangle className="w-4 h-4" />;
    text = `${Math.abs(days)} days overdue`;
  } else if (days === 0) {
    colorClass = 'text-red-600 bg-red-50';
    icon = <AlertCircle className="w-4 h-4" />;
    text = 'Due today!';
  } else if (days <= 3) {
    colorClass = 'text-orange-600 bg-orange-50';
    icon = <Timer className="w-4 h-4" />;
    text = `${days} days left`;
  } else if (days <= 7) {
    colorClass = 'text-yellow-600 bg-yellow-50';
  }
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${colorClass}`}>
      {icon}
      <span className="text-xs font-semibold">{text}</span>
    </div>
  );
};

export const CAPAReminder: React.FC<CAPAReminderProps> = ({ 
  capaActions = SAMPLE_CAPA_DATA,
  onActionClick,
  onSendReminder,
  compact = false
}) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'due-soon' | 'in-progress'>('all');
  const [sortBy, setSortBy] = useState<'dueDate' | 'priority'>('dueDate');
  const [reminderSent, setReminderSent] = useState<Set<string>>(new Set());

  // Process and sort CAPA actions
  const processedActions = useMemo(() => {
    let filtered = capaActions.map(action => ({
      ...action,
      daysRemaining: calculateDaysRemaining(action.dueDate)
    }));

    // Apply filters
    switch (filter) {
      case 'overdue':
        filtered = filtered.filter(a => a.daysRemaining < 0 || a.status === 'Overdue');
        break;
      case 'due-soon':
        filtered = filtered.filter(a => a.daysRemaining >= 0 && a.daysRemaining <= 7);
        break;
      case 'in-progress':
        filtered = filtered.filter(a => a.status === 'In Progress');
        break;
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'dueDate') {
        return a.daysRemaining - b.daysRemaining;
      } else {
        const priorityOrder = { 'Critical': 0, 'High': 1, 'Medium': 2, 'Low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
    });

    return filtered;
  }, [capaActions, filter, sortBy]);

  // Summary stats
  const stats = useMemo(() => ({
    total: capaActions.length,
    overdue: capaActions.filter(a => calculateDaysRemaining(a.dueDate) < 0 || a.status === 'Overdue').length,
    dueSoon: capaActions.filter(a => {
      const days = calculateDaysRemaining(a.dueDate);
      return days >= 0 && days <= 7;
    }).length,
    completed: capaActions.filter(a => a.status === 'Completed').length
  }), [capaActions]);

  const handleSendReminder = (action: CAPAAction & { daysRemaining: number }) => {
    if (onSendReminder) {
      onSendReminder(action);
    }
    setReminderSent(prev => new Set([...prev, action.id]));
    setTimeout(() => {
      setReminderSent(prev => {
        const next = new Set(prev);
        next.delete(action.id);
        return next;
      });
    }, 3000);
  };

  if (compact) {
    return (
      <div className="bg-white rounded-2xl border border-surface-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5" />
              <span className="font-semibold">CAPA Reminders</span>
            </div>
            <div className="flex items-center gap-2">
              {stats.overdue > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  {stats.overdue} overdue
                </span>
              )}
              {stats.dueSoon > 0 && (
                <span className="px-2 py-0.5 bg-white/20 rounded-full text-xs font-medium">
                  {stats.dueSoon} due soon
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="divide-y divide-surface-100 max-h-64 overflow-y-auto">
          {processedActions.slice(0, 5).map(action => (
            <div 
              key={action.id}
              onClick={() => onActionClick?.(action)}
              className="p-3 hover:bg-surface-50 transition-colors cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-surface-900 truncate">{action.action}</p>
                <p className="text-xs text-surface-500">{action.assignedTo}</p>
              </div>
              <DaysIndicator days={action.daysRemaining} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-surface-200 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-orange-500 via-red-500 to-pink-500 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <BellRing className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold">CAPA Due Date Reminders</h2>
              <p className="text-sm text-white/80">Track corrective action deadlines</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-xl transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: stats.total, icon: Target, color: 'bg-white/20' },
            { label: 'Overdue', value: stats.overdue, icon: AlertTriangle, color: 'bg-red-400/30' },
            { label: 'Due Soon', value: stats.dueSoon, icon: Timer, color: 'bg-orange-400/30' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'bg-green-400/30' }
          ].map((stat, i) => (
            <div key={i} className={`${stat.color} rounded-xl p-3 backdrop-blur-sm`}>
              <div className="flex items-center gap-2 mb-1">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs font-medium text-white/90">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filters & Sorting */}
      <div className="px-6 py-4 bg-surface-50 border-b border-surface-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {[
            { key: 'all', label: 'All' },
            { key: 'overdue', label: 'Overdue' },
            { key: 'due-soon', label: 'Due Soon' },
            { key: 'in-progress', label: 'In Progress' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`
                px-4 py-2 rounded-xl text-sm font-medium transition-all
                ${filter === f.key 
                  ? 'bg-primary-100 text-primary-700 shadow-sm' 
                  : 'bg-white text-surface-600 hover:bg-surface-100 border border-surface-200'}
              `}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-sm text-surface-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="px-3 py-2 bg-white border border-surface-200 rounded-xl text-sm 
                       focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          >
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>
      </div>

      {/* CAPA List */}
      <div className="divide-y divide-surface-100 max-h-[500px] overflow-y-auto">
        {processedActions.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-300 mx-auto mb-4" />
            <p className="text-surface-600 font-medium">No CAPA actions match your filter</p>
            <p className="text-surface-400 text-sm mt-1">Try adjusting your filter criteria</p>
          </div>
        ) : (
          processedActions.map(action => (
            <motion.div
              key={action.id}
              initial={false}
              animate={{ backgroundColor: expandedId === action.id ? '#f8fafc' : '#ffffff' }}
              className="transition-colors"
            >
              {/* Main Row */}
              <div 
                className="p-4 cursor-pointer hover:bg-surface-50 transition-colors"
                onClick={() => setExpandedId(expandedId === action.id ? null : action.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Priority Indicator */}
                  <div className={`
                    w-1 h-full min-h-[60px] rounded-full
                    ${action.priority === 'Critical' ? 'bg-red-500' : 
                      action.priority === 'High' ? 'bg-orange-500' : 
                      action.priority === 'Medium' ? 'bg-yellow-500' : 'bg-green-500'}
                  `} />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-surface-400">{action.id}</span>
                          <StatusBadge status={action.status} />
                          <PriorityIndicator priority={action.priority} />
                        </div>
                        <p className="font-medium text-surface-900">{action.action}</p>
                      </div>
                      <DaysIndicator days={action.daysRemaining} />
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-surface-500">
                      <div className="flex items-center gap-1.5">
                        <User className="w-4 h-4" />
                        <span>{action.assignedTo}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        <span>Due: {new Date(action.dueDate).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Shield className="w-4 h-4" />
                        <span className="capitalize">{action.sourceType}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expand Icon */}
                  <motion.div
                    animate={{ rotate: expandedId === action.id ? 180 : 0 }}
                    className="p-2"
                  >
                    <ChevronDown className="w-5 h-5 text-surface-400" />
                  </motion.div>
                </div>
              </div>
              
              {/* Expanded Details */}
              <AnimatePresence>
                {expandedId === action.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pl-9 border-t border-surface-100 pt-4">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <h4 className="text-sm font-semibold text-surface-700 mb-3">Details</h4>
                          <dl className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <dt className="text-surface-500">Source ID</dt>
                              <dd className="font-mono text-surface-700">{action.sourceId}</dd>
                            </div>
                            <div className="flex justify-between">
                              <dt className="text-surface-500">Created</dt>
                              <dd className="text-surface-700">{new Date(action.createdDate).toLocaleDateString()}</dd>
                            </div>
                            {action.assigneeEmail && (
                              <div className="flex justify-between">
                                <dt className="text-surface-500">Email</dt>
                                <dd className="text-primary-600">{action.assigneeEmail}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                        
                        <div className="flex flex-col gap-3">
                          <h4 className="text-sm font-semibold text-surface-700">Actions</h4>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSendReminder(action);
                            }}
                            disabled={reminderSent.has(action.id)}
                            className={`
                              flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
                              transition-all w-full
                              ${reminderSent.has(action.id)
                                ? 'bg-green-100 text-green-700'
                                : 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'}
                            `}
                          >
                            {reminderSent.has(action.id) ? (
                              <>
                                <CheckCircle2 className="w-4 h-4" />
                                Reminder Sent!
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4" />
                                Send Reminder
                              </>
                            )}
                          </motion.button>
                          
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onActionClick?.(action);
                            }}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl 
                                       font-medium text-sm bg-surface-100 hover:bg-surface-200 
                                       text-surface-700 transition-all w-full"
                          >
                            <ArrowRight className="w-4 h-4" />
                            View Full Details
                          </motion.button>
                        </div>
                      </div>
                      
                      {action.notes && (
                        <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                          <p className="text-sm text-yellow-800">
                            <strong>Notes:</strong> {action.notes}
                          </p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default CAPAReminder;
