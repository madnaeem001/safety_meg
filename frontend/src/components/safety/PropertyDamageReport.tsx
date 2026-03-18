import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Building2, Calendar, MapPin, Clock, DollarSign, FileText, Save, 
  CheckCircle2, Plus, Search, Filter, ChevronRight, Camera, Send, 
  ArrowLeft, AlertTriangle, User, Package, Hammer, Factory
} from 'lucide-react';
import { SMCard, SMButton, SMBadge } from '../../components/ui';

// Property types for damage reports
const PROPERTY_TYPES = [
  { id: 'building', label: 'Building/Structure', icon: Building2 },
  { id: 'equipment', label: 'Equipment', icon: Hammer },
  { id: 'vehicle', label: 'Vehicle', icon: Package },
  { id: 'infrastructure', label: 'Infrastructure', icon: Factory },
  { id: 'inventory', label: 'Inventory/Materials', icon: Package },
  { id: 'other', label: 'Other', icon: FileText },
];

const DAMAGE_SEVERITY = ['Minor', 'Moderate', 'Significant', 'Major', 'Total Loss'];

const DAMAGE_CAUSES = [
  'Impact/Collision', 'Fire', 'Water/Flood', 'Weather', 'Equipment Failure',
  'Human Error', 'Vandalism', 'Chemical Spill', 'Structural Failure', 'Unknown'
];

const DEPARTMENTS = [
  'Operations', 'Manufacturing', 'Maintenance', 'Logistics', 
  'R&D', 'Administration', 'Warehouse', 'Shipping', 'Facilities'
];

// Mock existing property damage reports
const mockPropertyReports = [
  { id: 'PROP-2026-001', title: 'Warehouse rack damage from forklift', propertyType: 'equipment', severity: 'Moderate', status: 'open', date: '2026-01-05', estimatedLoss: 12500, department: 'Logistics', reportedBy: 'John Smith' },
  { id: 'PROP-2026-002', title: 'Lab ventilation system malfunction', propertyType: 'infrastructure', severity: 'Significant', status: 'investigating', date: '2026-01-04', estimatedLoss: 45000, department: 'R&D', reportedBy: 'Sarah Johnson' },
  { id: 'PROP-2026-003', title: 'Chemical spill in storage area', propertyType: 'inventory', severity: 'Major', status: 'resolved', date: '2026-01-03', estimatedLoss: 28000, department: 'Warehouse', reportedBy: 'Mike Davis' },
  { id: 'PROP-2026-004', title: 'Office water damage from pipe burst', propertyType: 'building', severity: 'Moderate', status: 'repair-pending', date: '2026-01-02', estimatedLoss: 8500, department: 'Administration', reportedBy: 'Emily Chen' },
  { id: 'PROP-2026-005', title: 'Delivery truck rear-end collision', propertyType: 'vehicle', severity: 'Minor', status: 'closed', date: '2026-01-01', estimatedLoss: 3200, department: 'Shipping', reportedBy: 'Robert Wilson' },
];

interface PropertyDamageReportProps {
  onNavigate?: (route: string) => void;
}

export const PropertyDamageReport: React.FC<PropertyDamageReportProps> = ({ onNavigate }) => {
  const [activeView, setActiveView] = useState<'list' | 'new'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  
  // New report form state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    department: '',
    reportedBy: '',
    propertyType: '',
    assetId: '',
    severity: 'Moderate',
    cause: '',
    estimatedLoss: '',
    description: '',
    immediateActions: '',
    insuranceClaim: false,
    witnesses: ''
  });
  const [submitted, setSubmitted] = useState(false);

  // Filter reports
  const filteredReports = useMemo(() => {
    let reports = mockPropertyReports;
    if (typeFilter !== 'all') {
      reports = reports.filter(r => r.propertyType === typeFilter);
    }
    if (searchQuery) {
      reports = reports.filter(r => 
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.id.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return reports;
  }, [typeFilter, searchQuery]);

  const totalEstimatedLoss = filteredReports.reduce((sum, r) => sum + r.estimatedLoss, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Property Damage Report submitted:', formData);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setActiveView('list');
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toTimeString().slice(0, 5),
        location: '',
        department: '',
        reportedBy: '',
        propertyType: '',
        assetId: '',
        severity: 'Moderate',
        cause: '',
        estimatedLoss: '',
        description: '',
        immediateActions: '',
        insuranceClaim: false,
        witnesses: ''
      });
    }, 2000);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'Total Loss': case 'Major': return 'bg-red-100 text-red-700 border-red-200';
      case 'Significant': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'Moderate': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Minor': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-surface-100 text-surface-600 border-surface-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-700';
      case 'investigating': return 'bg-purple-100 text-purple-700';
      case 'resolved': case 'closed': return 'bg-green-100 text-green-700';
      case 'repair-pending': return 'bg-amber-100 text-amber-700';
      default: return 'bg-surface-100 text-surface-600';
    }
  };

  const getPropertyTypeIcon = (type: string) => {
    const typeConfig = PROPERTY_TYPES.find(t => t.id === type);
    return typeConfig?.icon || Building2;
  };

  // Success state
  if (submitted) {
    return (
      <div className="flex items-center justify-center py-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-8 rounded-3xl text-center space-y-4 max-w-xs shadow-soft border border-surface-100"
        >
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-brand-900">Report Submitted</h2>
          <p className="text-surface-500 text-sm">Property damage report has been logged and facilities team notified.</p>
        </motion.div>
      </div>
    );
  }

  // New Report Form
  if (activeView === 'new') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setActiveView('list')}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </button>
            <h2 className="text-xl font-bold text-brand-900">New Property Damage Report</h2>
          </div>
        </div>

        {/* Property Type Selection */}
        <SMCard className="p-4">
          <p className="text-xs font-bold text-surface-400 uppercase tracking-widest mb-3">Property Type</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {PROPERTY_TYPES.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormData({ ...formData, propertyType: type.id })}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  formData.propertyType === type.id 
                    ? 'border-brand-500 bg-brand-50' 
                    : 'border-surface-200 hover:border-surface-300'
                }`}
              >
                <type.icon className={`w-6 h-6 ${formData.propertyType === type.id ? 'text-brand-600' : 'text-surface-500'}`} />
                <span className={`text-sm font-semibold text-center ${formData.propertyType === type.id ? 'text-brand-700' : 'text-surface-700'}`}>
                  {type.label}
                </span>
              </button>
            ))}
          </div>
        </SMCard>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Details Section */}
          <SMCard className="p-6 space-y-4">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-500" />
              Incident Details
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Date</label>
                <input 
                  type="date" 
                  required 
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Time</label>
                <input 
                  type="time" 
                  value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Location</label>
                <input 
                  type="text" 
                  required 
                  placeholder="Area/Zone" 
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="">Select</option>
                  {DEPARTMENTS.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Asset ID (if applicable)</label>
                <input 
                  type="text" 
                  placeholder="Equipment/Asset #" 
                  value={formData.assetId}
                  onChange={(e) => setFormData({ ...formData, assetId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Damage Severity</label>
                <select
                  value={formData.severity}
                  onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  {DAMAGE_SEVERITY.map(level => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Cause</label>
                <select
                  value={formData.cause}
                  onChange={(e) => setFormData({ ...formData, cause: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="">Select Cause</option>
                  {DAMAGE_CAUSES.map(cause => (
                    <option key={cause} value={cause}>{cause}</option>
                  ))}
                </select>
              </div>
            </div>
          </SMCard>

          {/* Financial Impact Section */}
          <SMCard className="p-6 space-y-4">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-emerald-500" />
              Financial Impact
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Estimated Loss (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    value={formData.estimatedLoss}
                    onChange={(e) => setFormData({ ...formData, estimatedLoss: e.target.value })}
                    className="w-full pl-8 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Reported By</label>
                <input 
                  type="text" 
                  placeholder="Your Name" 
                  value={formData.reportedBy}
                  onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                />
              </div>
            </div>

            <label className="flex items-center gap-3 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <input
                type="checkbox"
                checked={formData.insuranceClaim}
                onChange={(e) => setFormData({ ...formData, insuranceClaim: e.target.checked })}
                className="w-5 h-5 text-brand-600 rounded"
              />
              <span className="text-sm font-medium text-blue-800">Submit Insurance Claim</span>
            </label>
          </SMCard>

          {/* Description Section */}
          <SMCard className="p-6 space-y-4">
            <h3 className="font-bold text-brand-900">Description & Actions</h3>

            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase">Description of Damage</label>
              <textarea
                required
                rows={4}
                placeholder="Describe the property damage in detail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase">Immediate Actions Taken</label>
              <textarea
                rows={2}
                placeholder="What actions were taken to secure the area or prevent further damage?"
                value={formData.immediateActions}
                onChange={(e) => setFormData({ ...formData, immediateActions: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase">Witnesses</label>
              <input 
                type="text" 
                placeholder="Names of any witnesses" 
                value={formData.witnesses}
                onChange={(e) => setFormData({ ...formData, witnesses: e.target.value })}
                className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
              />
            </div>
          </SMCard>

          {/* Submit Button */}
          <div className="flex gap-3">
            <SMButton
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={() => setActiveView('list')}
            >
              Cancel
            </SMButton>
            <SMButton
              type="submit"
              variant="primary"
              className="flex-1"
              leftIcon={<Send className="w-5 h-5" />}
            >
              Submit Report
            </SMButton>
          </div>
        </form>
      </motion.div>
    );
  }

  // List View
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header with Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900">Property Damage Reports</h2>
          <p className="text-sm text-surface-500">Track and manage property damage incidents</p>
        </div>
        <button
          onClick={() => setActiveView('new')}
          className="px-4 py-2.5 bg-brand-600 text-white font-semibold rounded-xl hover:bg-brand-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Report
        </button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Total Reports</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{filteredReports.length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Est. Total Loss</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">${totalEstimatedLoss.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Open Cases</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{filteredReports.filter(r => r.status === 'open' || r.status === 'investigating').length}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-5 h-5 text-green-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Resolved</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{filteredReports.filter(r => r.status === 'resolved' || r.status === 'closed').length}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
            />
          </div>
        </div>

        {/* Type Filter Tabs */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              typeFilter === 'all' ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
            }`}
          >
            All
          </button>
          {PROPERTY_TYPES.map(type => (
            <button
              key={type.id}
              onClick={() => setTypeFilter(type.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                typeFilter === type.id ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
              }`}
            >
              <type.icon className="w-4 h-4" />
              {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Reports List */}
      <div className="space-y-3">
        {filteredReports.map((report, index) => {
          const TypeIcon = getPropertyTypeIcon(report.propertyType);
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft hover:shadow-card cursor-pointer transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-orange-100 text-orange-600">
                  <TypeIcon className="w-5 h-5" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-surface-400">{report.id}</span>
                    <SMBadge size="sm" variant={report.severity === 'Total Loss' || report.severity === 'Major' ? 'danger' : report.severity === 'Significant' || report.severity === 'Moderate' ? 'warning' : 'success'}>
                      {report.severity}
                    </SMBadge>
                    <SMBadge size="sm" variant={report.status === 'resolved' || report.status === 'closed' ? 'success' : report.status === 'open' ? 'teal' : report.status === 'repair-pending' ? 'warning' : 'neutral'}>
                      {report.status.replace('-', ' ')}
                    </SMBadge>
                  </div>
                  <h4 className="font-semibold text-surface-800 truncate">{report.title}</h4>
                  <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {report.date}
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      ${report.estimatedLoss.toLocaleString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      {report.department}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className="w-5 h-5 text-surface-300 group-hover:text-brand-500 transition-colors" />
              </div>
            </motion.div>
          );
        })}

        {filteredReports.length === 0 && (
          <div className="text-center py-12 bg-surface-50 rounded-2xl">
            <Building2 className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-500">No property damage reports found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};
