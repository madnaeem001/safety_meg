import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { inspectionService } from '../api/services/apiService';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Droplets,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Trash2,
  Calendar,
  MapPin,
  User,
  Camera,
  ClipboardCheck,
  CloudRain,
  Eye,
  ThermometerSun,
  Wind,
  ChevronDown,
  ChevronUp,
  Save,
  Clock
} from 'lucide-react';

// Storm Water Checklist Sections
const STORMWATER_SECTIONS = [
  {
    id: 'inlet-structures',
    name: 'Inlet Structures',
    icon: Droplets,
    items: [
      { id: 'inlet-clear', label: 'Inlets clear of debris and sediment', frequency: 'weekly' },
      { id: 'inlet-grates', label: 'Grates in place and secure', frequency: 'weekly' },
      { id: 'inlet-protection', label: 'Inlet protection devices installed', frequency: 'weekly' },
      { id: 'inlet-damage', label: 'No structural damage to inlet', frequency: 'monthly' },
      { id: 'inlet-markings', label: 'Storm drain markings visible', frequency: 'monthly' },
    ]
  },
  {
    id: 'detention-basins',
    name: 'Detention/Retention Basins',
    icon: CloudRain,
    items: [
      { id: 'basin-depth', label: 'Water depth within normal range', frequency: 'weekly' },
      { id: 'basin-outlets', label: 'Outlet structures functioning', frequency: 'weekly' },
      { id: 'basin-vegetation', label: 'Vegetation properly maintained', frequency: 'monthly' },
      { id: 'basin-erosion', label: 'No bank erosion present', frequency: 'monthly' },
      { id: 'basin-sediment', label: 'Sediment accumulation acceptable', frequency: 'quarterly' },
      { id: 'basin-debris', label: 'Floating debris removed', frequency: 'weekly' },
    ]
  },
  {
    id: 'outfalls',
    name: 'Outfall Monitoring',
    icon: Eye,
    items: [
      { id: 'outfall-flow', label: 'No dry weather flow observed', frequency: 'weekly' },
      { id: 'outfall-sheen', label: 'No oil sheen present', frequency: 'weekly' },
      { id: 'outfall-color', label: 'Water color normal', frequency: 'weekly' },
      { id: 'outfall-odor', label: 'No unusual odors', frequency: 'weekly' },
      { id: 'outfall-erosion', label: 'No erosion at discharge point', frequency: 'monthly' },
      { id: 'outfall-structure', label: 'Outfall structure intact', frequency: 'monthly' },
    ]
  },
  {
    id: 'parking-areas',
    name: 'Parking & Paved Areas',
    icon: MapPin,
    items: [
      { id: 'parking-sweep', label: 'Regular sweeping conducted', frequency: 'weekly' },
      { id: 'parking-stains', label: 'Oil stains addressed/cleaned', frequency: 'weekly' },
      { id: 'parking-cracks', label: 'Pavement cracks sealed', frequency: 'monthly' },
      { id: 'parking-drains', label: 'Area drains functional', frequency: 'monthly' },
      { id: 'parking-spills', label: 'Spill kit available nearby', frequency: 'monthly' },
    ]
  },
  {
    id: 'storage-areas',
    name: 'Material Storage Areas',
    icon: AlertTriangle,
    items: [
      { id: 'storage-covered', label: 'Materials covered or contained', frequency: 'daily' },
      { id: 'storage-secondary', label: 'Secondary containment intact', frequency: 'weekly' },
      { id: 'storage-labels', label: 'Materials properly labeled', frequency: 'weekly' },
      { id: 'storage-spills', label: 'No evidence of spills/leaks', frequency: 'daily' },
      { id: 'storage-housekeeping', label: 'Good housekeeping maintained', frequency: 'daily' },
    ]
  },
  {
    id: 'landscaping',
    name: 'Landscaping & Erosion',
    icon: ThermometerSun,
    items: [
      { id: 'landscape-irrigation', label: 'Irrigation not causing runoff', frequency: 'weekly' },
      { id: 'landscape-fertilizer', label: 'Fertilizer applied properly', frequency: 'as-needed' },
      { id: 'landscape-pesticide', label: 'Pesticides applied per label', frequency: 'as-needed' },
      { id: 'landscape-erosion', label: 'No erosion on slopes', frequency: 'monthly' },
      { id: 'landscape-mulch', label: 'Mulch/ground cover adequate', frequency: 'monthly' },
    ]
  },
];

interface ChecklistItem {
  id: string;
  status: 'ok' | 'issue' | 'na' | 'pending';
  notes: string;
  photoTaken: boolean;
}

interface Issue {
  id: string;
  section: string;
  item: string;
  description: string;
  severity: 'minor' | 'moderate' | 'major';
  actionRequired: string;
  assignedTo: string;
  dueDate: string;
}

export const StormWaterChecklist: React.FC = () => {
  const navigate = useNavigate();
  const [expandedSection, setExpandedSection] = useState<string | null>('inlet-structures');
  const [checklistItems, setChecklistItems] = useState<Record<string, ChecklistItem>>({});
  const [issues, setIssues] = useState<Issue[]>([]);
  const [formData, setFormData] = useState({
    inspectionDate: new Date().toISOString().split('T')[0],
    inspectionTime: new Date().toTimeString().slice(0, 5),
    inspector: '',
    facility: '',
    weather: 'clear',
    temperature: '',
    recentRain: false,
    rainAmount: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleItemUpdate = (itemId: string, status: ChecklistItem['status'], notes?: string) => {
    setChecklistItems(prev => ({
      ...prev,
      [itemId]: {
        id: itemId,
        status,
        notes: notes ?? prev[itemId]?.notes ?? '',
        photoTaken: prev[itemId]?.photoTaken ?? false,
      }
    }));

    // Auto-create issue for 'issue' status
    if (status === 'issue') {
      const section = STORMWATER_SECTIONS.find(s => s.items.some(i => i.id === itemId));
      const item = section?.items.find(i => i.id === itemId);
      if (section && item && !issues.some(i => i.item === itemId)) {
        setIssues(prev => [...prev, {
          id: `ISS-${Date.now()}`,
          section: section.name,
          item: itemId,
          description: item.label,
          severity: 'moderate',
          actionRequired: '',
          assignedTo: '',
          dueDate: '',
        }]);
      }
    }
  };

  const getCompletionStats = () => {
    const allItems = STORMWATER_SECTIONS.flatMap(s => s.items);
    const completed = allItems.filter(item => checklistItems[item.id]?.status && checklistItems[item.id]?.status !== 'pending').length;
    const issueCount = allItems.filter(item => checklistItems[item.id]?.status === 'issue').length;
    return { total: allItems.length, completed, issueCount };
  };

  const stats = getCompletionStats();
  const completionPercent = Math.round((stats.completed / stats.total) * 100);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const allChecklistItems = STORMWATER_SECTIONS.flatMap(s => s.items.map(i => i.label));
      const issueCount = Object.values(checklistItems).filter(i => i.status === 'issue').length;
      const weatherNote = `Weather: ${formData.weather}. Temp: ${formData.temperature || 'N/A'}. Recent rain: ${formData.recentRain ? `Yes, ${formData.rainAmount || 'unknown amount'}` : 'No'}.`;
      await inspectionService.create({
        title: `Storm Water Inspection - ${formData.facility || 'Facility'}`,
        inspectionType: 'stormwater',
        location: formData.facility,
        assignedTo: formData.inspector,
        scheduledDate: formData.inspectionDate,
        scheduledTime: formData.inspectionTime,
        notes: weatherNote,
        checklist: allChecklistItems,
        priority: issueCount > 3 ? 'high' : issueCount > 0 ? 'medium' : 'low',
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
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-xs"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900">Inspection Complete</h2>
          <p className="text-surface-500 text-sm">Storm water checklist has been saved and issues logged.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 px-6 py-4">
        <div className="flex items-center justify-between max-w-5xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-surface-600" />
            </button>
            <div>
              <h1 className="page-title flex items-center gap-2">
                <Droplets className="w-6 h-6 text-sky-600" />
                Storm Water Checklist
              </h1>
              <p className="page-subtitle">Facility Inspection & Monitoring</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            {submitError && <p className="text-xs text-red-500">{submitError}</p>}
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-4 py-2 bg-brand-600 text-white rounded-xl font-bold text-sm hover:bg-brand-700 transition-all flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        {/* Progress & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-6 rounded-3xl border border-surface-100 shadow-soft md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-surface-900">Inspection Progress</h3>
                <p className="text-sm text-surface-500">{stats.completed} of {stats.total} items checked</p>
              </div>
              <span className="text-2xl font-bold text-brand-600">{completionPercent}%</span>
            </div>
            <div className="h-3 bg-surface-100 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
          <div className={`p-6 rounded-3xl border shadow-soft ${
            stats.issueCount > 0 ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                stats.issueCount > 0 ? 'bg-red-500 text-white' : 'bg-green-500 text-white'
              }`}>
                {stats.issueCount > 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
              </div>
              <div>
                <p className={`text-2xl font-bold ${stats.issueCount > 0 ? 'text-red-700' : 'text-green-700'}`}>
                  {stats.issueCount}
                </p>
                <p className={`text-xs font-bold uppercase ${stats.issueCount > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  Issues Found
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Site Information */}
        <div className="bg-white p-6 rounded-3xl border border-surface-100 shadow-soft">
          <h3 className="font-bold text-surface-900 mb-6 flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-brand-600" />
            Inspection Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Date</label>
              <input
                type="date"
                value={formData.inspectionDate}
                onChange={(e) => setFormData({ ...formData, inspectionDate: e.target.value })}
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Time</label>
              <input
                type="time"
                value={formData.inspectionTime}
                onChange={(e) => setFormData({ ...formData, inspectionTime: e.target.value })}
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Inspector</label>
              <input
                type="text"
                value={formData.inspector}
                onChange={(e) => setFormData({ ...formData, inspector: e.target.value })}
                placeholder="Your name"
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Facility</label>
              <input
                type="text"
                value={formData.facility}
                onChange={(e) => setFormData({ ...formData, facility: e.target.value })}
                placeholder="Facility name"
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Weather</label>
              <select
                value={formData.weather}
                onChange={(e) => setFormData({ ...formData, weather: e.target.value })}
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
              >
                <option value="clear">Clear/Sunny</option>
                <option value="cloudy">Cloudy</option>
                <option value="rain">Raining</option>
                <option value="post-rain">Post-Rain</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-surface-400 uppercase mb-1 block">Temperature</label>
              <input
                type="text"
                value={formData.temperature}
                onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                placeholder="e.g., 72°F"
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-surface-50 rounded-xl border border-surface-200">
                <input
                  type="checkbox"
                  checked={formData.recentRain}
                  onChange={(e) => setFormData({ ...formData, recentRain: e.target.checked })}
                  className="w-5 h-5 rounded border-surface-300 text-brand-600 focus:ring-brand-500"
                />
                <span className="text-sm font-medium text-surface-700">Recent rainfall event (last 72 hours)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Checklist Sections */}
        <div className="space-y-4">
          {STORMWATER_SECTIONS.map(section => {
            const SectionIcon = section.icon;
            const sectionCompleted = section.items.filter(i => checklistItems[i.id]?.status && checklistItems[i.id]?.status !== 'pending').length;
            const sectionIssues = section.items.filter(i => checklistItems[i.id]?.status === 'issue').length;

            return (
              <div key={section.id} className="bg-white rounded-3xl border border-surface-100 shadow-soft overflow-hidden">
                <button
                  onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
                  className="w-full flex items-center justify-between p-6 hover:bg-surface-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-sky-50 text-sky-600 rounded-2xl flex items-center justify-center">
                      <SectionIcon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-bold text-surface-900">{section.name}</h3>
                      <p className="text-sm text-surface-500">{section.items.length} inspection points</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-surface-600">{sectionCompleted}/{section.items.length}</span>
                      {sectionIssues > 0 && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                          {sectionIssues} issues
                        </span>
                      )}
                    </div>
                    {expandedSection === section.id ? <ChevronUp className="w-5 h-5 text-surface-400" /> : <ChevronDown className="w-5 h-5 text-surface-400" />}
                  </div>
                </button>

                <AnimatePresence>
                  {expandedSection === section.id && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-t border-surface-100"
                    >
                      <div className="p-6 space-y-4">
                        {section.items.map(item => (
                          <div key={item.id} className="p-4 bg-surface-50 rounded-2xl">
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex-1">
                                <span className="text-sm font-medium text-surface-700">{item.label}</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <Clock className="w-3 h-3 text-surface-400" />
                                  <span className="text-xs text-surface-400 capitalize">{item.frequency}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              {(['ok', 'issue', 'na'] as const).map(status => (
                                <button
                                  key={status}
                                  onClick={() => handleItemUpdate(item.id, status)}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all ${
                                    checklistItems[item.id]?.status === status
                                      ? status === 'ok' ? 'bg-green-500 text-white'
                                      : status === 'issue' ? 'bg-red-500 text-white'
                                      : 'bg-surface-400 text-white'
                                      : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-100'
                                  }`}
                                >
                                  {status === 'ok' ? 'OK' : status === 'issue' ? 'Issue' : 'N/A'}
                                </button>
                              ))}
                              <button
                                onClick={() => {
                                  const updated = { ...checklistItems[item.id], photoTaken: !checklistItems[item.id]?.photoTaken };
                                  setChecklistItems(prev => ({ ...prev, [item.id]: { ...prev[item.id], ...updated } }));
                                }}
                                className={`p-2 rounded-xl transition-all ${
                                  checklistItems[item.id]?.photoTaken 
                                    ? 'bg-brand-500 text-white' 
                                    : 'bg-white border border-surface-200 text-surface-400 hover:bg-surface-100'
                                }`}
                                title="Add photo"
                              >
                                <Camera className="w-4 h-4" />
                              </button>
                            </div>
                            {checklistItems[item.id]?.status === 'issue' && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                className="mt-3"
                              >
                                <textarea
                                  placeholder="Describe the issue..."
                                  value={checklistItems[item.id]?.notes || ''}
                                  onChange={(e) => handleItemUpdate(item.id, 'issue', e.target.value)}
                                  className="w-full px-3 py-2 text-sm bg-white border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500/20 outline-none resize-none"
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
            );
          })}
        </div>

        {/* Issues Summary */}
        {issues.length > 0 && (
          <div className="bg-white rounded-3xl border border-surface-100 shadow-soft p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-surface-900">Issues Requiring Action</h3>
                <p className="text-sm text-surface-500">{issues.length} issues identified</p>
              </div>
            </div>
            <div className="space-y-3">
              {issues.map(issue => (
                <div key={issue.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-bold text-red-600 uppercase">{issue.section}</span>
                      <p className="font-medium text-surface-900 mt-1">{issue.description}</p>
                    </div>
                    <select
                      value={issue.severity}
                      onChange={(e) => {
                        setIssues(prev => prev.map(i => 
                          i.id === issue.id ? { ...i, severity: e.target.value as Issue['severity'] } : i
                        ));
                      }}
                      className={`px-3 py-1 rounded-lg text-xs font-bold ${
                        issue.severity === 'major' ? 'bg-red-200 text-red-700' :
                        issue.severity === 'moderate' ? 'bg-yellow-200 text-yellow-700' :
                        'bg-blue-200 text-blue-700'
                      }`}
                    >
                      <option value="minor">Minor</option>
                      <option value="moderate">Moderate</option>
                      <option value="major">Major</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <input
                      type="text"
                      placeholder="Action required..."
                      value={issue.actionRequired}
                      onChange={(e) => {
                        setIssues(prev => prev.map(i => 
                          i.id === issue.id ? { ...i, actionRequired: e.target.value } : i
                        ));
                      }}
                      className="px-3 py-2 text-sm bg-white border border-surface-200 rounded-lg"
                    />
                    <input
                      type="text"
                      placeholder="Assigned to..."
                      value={issue.assignedTo}
                      onChange={(e) => {
                        setIssues(prev => prev.map(i => 
                          i.id === issue.id ? { ...i, assignedTo: e.target.value } : i
                        ));
                      }}
                      className="px-3 py-2 text-sm bg-white border border-surface-200 rounded-lg"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
