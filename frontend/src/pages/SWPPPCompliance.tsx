import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionService } from '../api/services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  CloudRain,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  User,
  FileText,
  Camera,
  ClipboardCheck,
  Droplets,
  Factory,
  Eye,
  Leaf,
  ChevronDown,
  ChevronUp,
  Save
} from 'lucide-react';

// SWPPP Inspection Categories
const SWPPP_CATEGORIES = [
  { 
    id: 'bmp-inspection', 
    name: 'BMP Inspection', 
    description: 'Best Management Practices',
    items: [
      { id: 'sediment-basin', label: 'Sediment basins functioning properly', required: true },
      { id: 'silt-fencing', label: 'Silt fencing intact and properly installed', required: true },
      { id: 'inlet-protection', label: 'Storm drain inlet protection in place', required: true },
      { id: 'erosion-control', label: 'Erosion control blankets/matting secure', required: true },
      { id: 'stabilization', label: 'Disturbed areas stabilized within timeframe', required: true },
      { id: 'vehicle-tracking', label: 'Vehicle tracking controls at exit points', required: false },
      { id: 'dust-control', label: 'Dust control measures adequate', required: false },
    ]
  },
  {
    id: 'housekeeping',
    name: 'Housekeeping & Materials',
    description: 'Material storage and site cleanliness',
    items: [
      { id: 'materials-covered', label: 'Materials properly covered and contained', required: true },
      { id: 'waste-management', label: 'Waste containers properly managed', required: true },
      { id: 'spill-kits', label: 'Spill kits available and accessible', required: true },
      { id: 'chemical-storage', label: 'Chemicals stored in secondary containment', required: true },
      { id: 'concrete-washout', label: 'Concrete washout area designated and used', required: false },
      { id: 'fuel-storage', label: 'Fuel storage areas properly contained', required: true },
      { id: 'debris-removal', label: 'Site free of debris and litter', required: false },
    ]
  },
  {
    id: 'discharge-points',
    name: 'Discharge Points',
    description: 'Outfall and discharge monitoring',
    items: [
      { id: 'outfall-clear', label: 'Outfall structures clear and unobstructed', required: true },
      { id: 'no-sheen', label: 'No visible oil sheen in discharge', required: true },
      { id: 'no-discoloration', label: 'No abnormal water discoloration', required: true },
      { id: 'no-odor', label: 'No unusual odors at discharge points', required: true },
      { id: 'sampling-access', label: 'Sampling locations accessible', required: false },
    ]
  },
  {
    id: 'documentation',
    name: 'Documentation & Training',
    description: 'Records and personnel training',
    items: [
      { id: 'swppp-onsite', label: 'SWPPP document available on-site', required: true },
      { id: 'inspection-logs', label: 'Previous inspection logs current', required: true },
      { id: 'training-current', label: 'Personnel training records current', required: true },
      { id: 'permit-posted', label: 'NPDES permit posted/available', required: true },
      { id: 'contacts-current', label: 'Emergency contacts list current', required: false },
    ]
  },
];

interface InspectionItem {
  id: string;
  status: 'pass' | 'fail' | 'na' | 'pending';
  notes: string;
  photo?: string;
}

interface CorrectiveAction {
  id: string;
  issue: string;
  action: string;
  assignedTo: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

export const SWPPPCompliance: React.FC = () => {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('bmp-inspection');
  const [inspectionItems, setInspectionItems] = useState<Record<string, InspectionItem>>({});
  const [correctiveActions, setCorrectiveActions] = useState<CorrectiveAction[]>([]);
  const [showAddAction, setShowAddAction] = useState(false);
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionTime: new Date().toTimeString().slice(0, 5),
    inspector: '',
    siteLocation: '',
    permitNumber: '',
    weatherConditions: 'clear',
    precipLast24h: 'none',
    precipLast72h: 'none',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [newAction, setNewAction] = useState<Partial<CorrectiveAction>>({
    issue: '',
    action: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium',
    status: 'pending'
  });

  const handleItemUpdate = (itemId: string, status: InspectionItem['status'], notes?: string) => {
    setInspectionItems(prev => ({
      ...prev,
      [itemId]: {
        id: itemId,
        status,
        notes: notes ?? prev[itemId]?.notes ?? '',
      }
    }));
  };

  const addCorrectiveAction = () => {
    if (newAction.issue && newAction.action) {
      setCorrectiveActions(prev => [
        ...prev,
        {
          id: `CA-${Date.now()}`,
          issue: newAction.issue || '',
          action: newAction.action || '',
          assignedTo: newAction.assignedTo || '',
          dueDate: newAction.dueDate || '',
          priority: newAction.priority || 'medium',
          status: 'pending'
        }
      ]);
      setNewAction({ issue: '', action: '', assignedTo: '', dueDate: '', priority: 'medium', status: 'pending' });
      setShowAddAction(false);
    }
  };

  const getCompletionStats = () => {
    const allItems = SWPPP_CATEGORIES.flatMap(cat => cat.items);
    const completed = allItems.filter(item => inspectionItems[item.id]?.status && inspectionItems[item.id]?.status !== 'pending').length;
    const failed = allItems.filter(item => inspectionItems[item.id]?.status === 'fail').length;
    return { total: allItems.length, completed, failed };
  };

  const stats = getCompletionStats();
  const completionPercent = Math.round((stats.completed / stats.total) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const allChecklistItems = SWPPP_CATEGORIES.flatMap(cat => cat.items.map(i => i.label));
      const failedCount = Object.values(inspectionItems).filter(i => i.status === 'fail').length;
      const weatherNote = `Weather: ${formData.weatherConditions}. Precip 24h: ${formData.precipLast24h}. Precip 72h: ${formData.precipLast72h}.`;
      const caNote = correctiveActions.length > 0 ? ` Corrective actions: ${correctiveActions.length}.` : '';
      await inspectionService.create({
        title: `SWPPP Inspection - ${formData.siteLocation || 'Site'}`,
        inspectionType: 'swppp',
        location: formData.siteLocation,
        assignedTo: formData.inspector,
        scheduledDate: formData.inspectionDate,
        scheduledTime: formData.inspectionTime,
        notes: `Permit: ${formData.permitNumber}. ${weatherNote}${caNote}`,
        checklist: allChecklistItems,
        priority: failedCount > 5 ? 'critical' : failedCount > 2 ? 'high' : 'medium',
        recurrence: 'once',
        duration: 60,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/safety-hub'), 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to submit inspection. Please try again.';
      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="page-wrapper flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-surface-raised p-8 rounded-3xl text-center space-y-4 max-w-xs"
        >
          <div className="w-20 h-20 bg-success/20 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-success" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Inspection Submitted</h2>
          <p className="text-text-secondary text-sm">SWPPP inspection has been recorded and corrective actions assigned.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-overlay/80 backdrop-blur-xl border-b border-surface-border px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-raised rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-text-secondary" />
            </button>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <CloudRain className="w-6 h-6 text-accent" />
                SWPPP Compliance
              </h1>
              <p className="text-sm text-text-muted">Storm Water Pollution Prevention Plan</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-accent text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Progress Bar */}
        <div className="bg-surface-raised p-6 rounded-3xl border border-surface-border shadow-soft">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-bold text-text-primary">Inspection Progress</h3>
              <p className="text-sm text-text-secondary">{stats.completed} of {stats.total} items inspected</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-accent">{completionPercent}%</span>
              {stats.failed > 0 && (
                <p className="text-xs text-red-500 font-bold">{stats.failed} items failed</p>
              )}
            </div>
          </div>
          <div className="h-3 bg-surface-sunken rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-brand-500 to-brand-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercent}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Site Information */}
        <div className="bg-surface-raised p-6 rounded-3xl border border-surface-border shadow-soft">
          <h3 className="font-bold text-text-primary mb-6 flex items-center gap-2">
            <Factory className="w-5 h-5 text-accent" />
            Site Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">
                <Calendar className="w-3 h-3 inline mr-1" /> Date
              </label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Time</label>
              <input
                type="time"
                value={formData.inspectionTime}
                onChange={(e) => setFormData({ ...formData, inspectionTime: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">
                <User className="w-3 h-3 inline mr-1" /> Inspector
              </label>
              <input
                type="text"
                value={formData.inspector}
                onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                placeholder="Inspector name"
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">
                <MapPin className="w-3 h-3 inline mr-1" /> Site Location
              </label>
              <input
                type="text"
                value={formData.siteLocation}
                onChange={(e) => setFormData({ ...formData, siteLocation: e.target.value })}
                placeholder="Project site address"
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">
                <FileText className="w-3 h-3 inline mr-1" /> NPDES Permit #
              </label>
              <input
                type="text"
                value={formData.permitNumber}
                onChange={(e) => setFormData({ ...formData, permitNumber: e.target.value })}
                placeholder="Permit number"
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">
                <CloudRain className="w-3 h-3 inline mr-1" /> Weather
              </label>
              <select
                value={formData.weatherConditions}
                onChange={(e) => setFormData({ ...formData, weatherConditions: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="clear">Clear</option>
                <option value="cloudy">Cloudy</option>
                <option value="rain">Rain</option>
                <option value="snow">Snow</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Precipitation Last 24h</label>
              <select
                value={formData.precipLast24h}
                onChange={(e) => setFormData({ ...formData, precipLast24h: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="none">None</option>
                <option value="trace">Trace (&lt;0.1&quot;)</option>
                <option value="light">Light (0.1-0.25&quot;)</option>
                <option value="moderate">Moderate (0.25-0.5&quot;)</option>
                <option value="heavy">Heavy (&gt;0.5&quot;)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Precipitation Last 72h</label>
              <select
                value={formData.precipLast72h}
                onChange={(e) => setFormData({ ...formData, precipLast72h: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              >
                <option value="none">None</option>
                <option value="trace">Trace (&lt;0.25&quot;)</option>
                <option value="light">Light (0.25-0.5&quot;)</option>
                <option value="moderate">Moderate (0.5-1&quot;)</option>
                <option value="heavy">Heavy (&gt;1&quot;)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Inspection Categories */}
        <div className="space-y-4">
          {SWPPP_CATEGORIES.map(category => (
            <div key={category.id} className="bg-surface-raised rounded-3xl border border-surface-border shadow-soft overflow-hidden">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className="w-full flex items-center justify-between p-6 hover:bg-surface-sunken transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                    <ClipboardCheck className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-bold text-text-primary">{category.name}</h3>
                    <p className="text-sm text-text-secondary">{category.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-sm font-bold text-text-secondary">
                      {category.items.filter(item => inspectionItems[item.id]?.status && inspectionItems[item.id]?.status !== 'pending').length}/{category.items.length}
                    </span>
                  </div>
                  {expandedCategory === category.id ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </button>

              <AnimatePresence>
                {expandedCategory === category.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-border"
                  >
                    <div className="p-6 space-y-4">
                      {category.items.map(item => (
                        <div key={item.id} className="p-4 bg-surface-sunken rounded-2xl">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div className="flex items-start gap-2">
                              {item.required && (
                                <span className="px-1.5 py-0.5 bg-danger/10 text-danger text-[10px] font-bold uppercase rounded">Req</span>
                              )}
                              <span className="text-sm font-medium text-text-primary">{item.label}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {(['pass', 'fail', 'na'] as const).map(status => (
                              <button
                                key={status}
                                onClick={() => handleItemUpdate(item.id, status)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                  inspectionItems[item.id]?.status === status
                                    ? status === 'pass' ? 'bg-success text-white'
                                    : status === 'fail' ? 'bg-danger text-white'
                                    : 'bg-text-muted text-surface-base'
                                    : 'bg-surface-raised border border-surface-border text-text-secondary hover:bg-surface-sunken'
                                }`}
                              >
                                {status === 'pass' ? 'Pass' : status === 'fail' ? 'Fail' : 'N/A'}
                              </button>
                            ))}
                          </div>
                          {inspectionItems[item.id]?.status === 'fail' && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              className="mt-3"
                            >
                              <textarea
                                placeholder="Describe the deficiency and required corrective action..."
                                value={inspectionItems[item.id]?.notes || ''}
                                onChange={(e) => handleItemUpdate(item.id, 'fail', e.target.value)}
                                className="w-full px-3 py-2 text-sm bg-surface-raised border border-danger/30 rounded-xl focus:ring-2 focus:ring-danger/20 outline-none resize-none"
                                rows={2}
                              />
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Corrective Actions */}
        <div className="bg-surface-raised rounded-3xl border border-surface-border shadow-soft p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-text-primary">Corrective Actions</h3>
                <p className="text-sm text-text-secondary">{correctiveActions.length} actions assigned</p>
              </div>
            </div>
            <button
              onClick={() => setShowAddAction(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent text-white rounded-xl font-bold text-sm hover:opacity-90 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add Action
            </button>
          </div>

          {showAddAction && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-surface-sunken rounded-2xl mb-4 space-y-3"
            >
              <input
                type="text"
                placeholder="Describe the issue..."
                value={newAction.issue}
                onChange={(e) => setNewAction({ ...newAction, issue: e.target.value })}
                className="w-full px-4 py-3 bg-surface-raised border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
              <input
                type="text"
                placeholder="Required corrective action..."
                value={newAction.action}
                onChange={(e) => setNewAction({ ...newAction, action: e.target.value })}
                className="w-full px-4 py-3 bg-surface-raised border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
              />
              <div className="grid grid-cols-3 gap-3">
                <input
                  type="text"
                  placeholder="Assigned to"
                  value={newAction.assignedTo}
                  onChange={(e) => setNewAction({ ...newAction, assignedTo: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-raised border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
                />
                <input
                  type="date"
                  value={newAction.dueDate}
                  onChange={(e) => setNewAction({ ...newAction, dueDate: e.target.value })}
                  className="w-full px-4 py-3 bg-surface-raised border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
                />
                <select
                  value={newAction.priority}
                  onChange={(e) => setNewAction({ ...newAction, priority: e.target.value as 'low' | 'medium' | 'high' })}
                  className="w-full px-4 py-3 bg-surface-raised border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={addCorrectiveAction}
                  className="px-4 py-2 bg-accent text-white rounded-xl font-bold text-sm"
                >
                  Add
                </button>
                <button
                  onClick={() => setShowAddAction(false)}
                  className="px-4 py-2 bg-surface-sunken text-text-secondary rounded-xl font-bold text-sm"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}

          {correctiveActions.length > 0 ? (
            <div className="space-y-3">
              {correctiveActions.map((action, i) => (
                <div key={action.id} className="p-4 bg-surface-sunken rounded-2xl flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        action.priority === 'high' ? 'bg-danger/10 text-danger' :
                        action.priority === 'medium' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        {action.priority}
                      </span>
                      <span className="text-sm font-bold text-text-primary">{action.issue}</span>
                    </div>
                    <p className="text-sm text-text-secondary">{action.action}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                      <span>Assigned: {action.assignedTo || 'Unassigned'}</span>
                      <span>Due: {action.dueDate || 'Not set'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setCorrectiveActions(prev => prev.filter(a => a.id !== action.id))}
                    className="p-2 text-text-muted hover:text-danger"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-text-muted py-8">No corrective actions added yet</p>
          )}
        </div>
      </main>
    </div>
  );
};
