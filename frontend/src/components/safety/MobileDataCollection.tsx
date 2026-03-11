import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Camera, Upload, Wifi, WifiOff, CheckCircle2, Clock, AlertCircle, MapPin, Image, FileText, Mic, Video, Plus, X, Send, CloudOff, Cloud, RefreshCw } from 'lucide-react';

interface DataEntry {
  id: string;
  type: 'incident' | 'audit' | 'hazard' | 'observation' | 'photo';
  title: string;
  description: string;
  location: string;
  timestamp: string;
  status: 'synced' | 'pending' | 'failed';
  attachments: {
    type: 'photo' | 'video' | 'audio' | 'document';
    name: string;
    size: string;
  }[];
  gpsCoordinates?: { lat: number; lng: number };
  submittedBy: string;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

const MOCK_ENTRIES: DataEntry[] = [
  {
    id: 'DE-001',
    type: 'incident',
    title: 'Near miss - Falling object',
    description: 'Worker narrowly avoided falling debris from scaffolding on level 3.',
    location: 'Construction Site A - Level 3',
    timestamp: '2026-02-02T09:30:00',
    status: 'synced',
    attachments: [
      { type: 'photo', name: 'incident_photo_1.jpg', size: '2.4 MB' },
      { type: 'photo', name: 'incident_photo_2.jpg', size: '1.8 MB' },
    ],
    gpsCoordinates: { lat: 40.7128, lng: -74.006 },
    submittedBy: 'John Smith',
    severity: 'high',
  },
  {
    id: 'DE-002',
    type: 'audit',
    title: 'Weekly Safety Inspection',
    description: 'Completed weekly safety audit of warehouse section B. Minor issues found.',
    location: 'Warehouse B',
    timestamp: '2026-02-02T08:15:00',
    status: 'synced',
    attachments: [
      { type: 'document', name: 'audit_checklist.pdf', size: '540 KB' },
      { type: 'photo', name: 'finding_1.jpg', size: '1.2 MB' },
    ],
    submittedBy: 'Sarah Davis',
  },
  {
    id: 'DE-003',
    type: 'hazard',
    title: 'Chemical spill reported',
    description: 'Small chemical spill in storage area. Containment measures applied.',
    location: 'Chemical Storage - Bay 4',
    timestamp: '2026-02-02T07:45:00',
    status: 'pending',
    attachments: [
      { type: 'photo', name: 'spill_photo.jpg', size: '3.1 MB' },
      { type: 'audio', name: 'voice_note.m4a', size: '890 KB' },
    ],
    gpsCoordinates: { lat: 40.7589, lng: -73.9851 },
    submittedBy: 'Mike Johnson',
    severity: 'critical',
  },
  {
    id: 'DE-004',
    type: 'observation',
    title: 'Positive safety behavior',
    description: 'Worker proactively corrected improper ladder setup before use.',
    location: 'Assembly Line 2',
    timestamp: '2026-02-01T16:20:00',
    status: 'failed',
    attachments: [],
    submittedBy: 'Emily Chen',
    severity: 'low',
  },
];

const TYPE_CONFIG = {
  incident: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Incident' },
  audit: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: FileText, label: 'Audit' },
  hazard: { color: 'bg-orange-100 text-orange-700 border-orange-200', icon: AlertCircle, label: 'Hazard' },
  observation: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Observation' },
  photo: { color: 'bg-purple-100 text-purple-700 border-purple-200', icon: Camera, label: 'Photo' },
};

const STATUS_CONFIG = {
  synced: { color: 'bg-emerald-100 text-emerald-700', icon: Cloud, label: 'Synced' },
  pending: { color: 'bg-amber-100 text-amber-700', icon: Clock, label: 'Pending' },
  failed: { color: 'bg-red-100 text-red-700', icon: CloudOff, label: 'Failed' },
};

const SEVERITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-amber-100 text-amber-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700',
};

export const MobileDataCollection: React.FC = () => {
  const [entries, setEntries] = useState<DataEntry[]>(MOCK_ENTRIES);
  const [isOnline, setIsOnline] = useState(true);
  const [showNewEntry, setShowNewEntry] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState<DataEntry | null>(null);
  const [filterType, setFilterType] = useState<'all' | DataEntry['type']>('all');
  const [isSyncing, setIsSyncing] = useState(false);

  const filteredEntries = entries.filter(e => filterType === 'all' || e.type === filterType);
  
  const stats = {
    total: entries.length,
    synced: entries.filter(e => e.status === 'synced').length,
    pending: entries.filter(e => e.status === 'pending').length,
    failed: entries.filter(e => e.status === 'failed').length,
  };

  const handleSync = async () => {
    setIsSyncing(true);
    // Simulate sync
    await new Promise(resolve => setTimeout(resolve, 2000));
    setEntries(prev => prev.map(e => 
      e.status === 'pending' || e.status === 'failed' 
        ? { ...e, status: 'synced' as const }
        : e
    ));
    setIsSyncing(false);
  };

  const handleRetry = (id: string) => {
    setEntries(prev => prev.map(e => 
      e.id === id ? { ...e, status: 'pending' as const } : e
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">Mobile Data Collection</h2>
          <p className="text-surface-500 mt-1">Log incidents, audits, and observations from the field - even offline</p>
        </div>
        <div className="flex gap-3">
          {/* Online/Offline Toggle */}
          <button
            onClick={() => setIsOnline(!isOnline)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              isOnline
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-surface-100 text-surface-600 border border-surface-200'
            }`}
          >
            {isOnline ? <Wifi className="w-5 h-5" /> : <WifiOff className="w-5 h-5" />}
            {isOnline ? 'Online' : 'Offline Mode'}
          </button>
          
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-surface-200 text-surface-700 font-medium rounded-xl hover:bg-surface-50 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing...' : 'Sync All'}
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowNewEntry(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-medium rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all"
          >
            <Plus className="w-5 h-5" />
            New Entry
          </motion.button>
        </div>
      </div>

      {/* Offline Banner */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3"
        >
          <WifiOff className="w-6 h-6 text-amber-600" />
          <div>
            <p className="font-medium text-amber-800">Offline Mode Active</p>
            <p className="text-sm text-amber-600">Data will be stored locally and synced when connection is restored</p>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Entries', value: stats.total, color: 'brand', icon: Smartphone },
          { label: 'Synced', value: stats.synced, color: 'emerald', icon: Cloud },
          { label: 'Pending Sync', value: stats.pending, color: 'amber', icon: Clock },
          { label: 'Sync Failed', value: stats.failed, color: 'red', icon: CloudOff },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white p-4 rounded-2xl shadow-soft border border-surface-100"
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-xl bg-${stat.color}-50`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-500`} />
              </div>
              <div>
                <div className="text-2xl font-bold text-brand-900">{stat.value}</div>
                <div className="text-[10px] font-medium text-surface-500 uppercase tracking-wider">{stat.label}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Capture Buttons */}
      <div className="bg-gradient-to-br from-brand-50 to-indigo-50 p-6 rounded-2xl border border-brand-100">
        <h3 className="font-semibold text-brand-900 mb-4">Quick Capture</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Camera, label: 'Photo', color: 'purple' },
            { icon: Video, label: 'Video', color: 'pink' },
            { icon: Mic, label: 'Voice Note', color: 'orange' },
            { icon: AlertCircle, label: 'Hazard', color: 'red' },
            { icon: FileText, label: 'Audit', color: 'blue' },
          ].map((action) => (
            <motion.button
              key={action.label}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowNewEntry(true)}
              className={`flex flex-col items-center gap-2 p-4 bg-white rounded-xl border border-surface-100 hover:shadow-md transition-all`}
            >
              <div className={`p-3 rounded-xl bg-${action.color}-100`}>
                <action.icon className={`w-6 h-6 text-${action.color}-600`} />
              </div>
              <span className="text-sm font-medium text-brand-900">{action.label}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['all', 'incident', 'audit', 'hazard', 'observation', 'photo'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filterType === type
                ? 'bg-brand-600 text-white'
                : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
            }`}
          >
            {type === 'all' ? 'All Entries' : TYPE_CONFIG[type].label}
          </button>
        ))}
      </div>

      {/* Entries List */}
      <div className="space-y-3">
        {filteredEntries.map((entry) => {
          const TypeIcon = TYPE_CONFIG[entry.type].icon;
          const StatusIcon = STATUS_CONFIG[entry.status].icon;
          
          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setSelectedEntry(entry)}
              className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-xl ${TYPE_CONFIG[entry.type].color.split(' ')[0]}`}>
                    <TypeIcon className={`w-5 h-5 ${TYPE_CONFIG[entry.type].color.split(' ')[1]}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-brand-900">{entry.title}</h3>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${TYPE_CONFIG[entry.type].color}`}>
                        {TYPE_CONFIG[entry.type].label}
                      </span>
                      {entry.severity && (
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-lg ${SEVERITY_COLORS[entry.severity]}`}>
                          {entry.severity.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-surface-600 line-clamp-2 mb-2">{entry.description}</p>
                    <div className="flex items-center gap-4 text-xs text-surface-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {entry.location}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className={`px-2 py-1 text-[10px] font-bold rounded-lg flex items-center gap-1 ${STATUS_CONFIG[entry.status].color}`}>
                    <StatusIcon className="w-3 h-3" />
                    {STATUS_CONFIG[entry.status].label}
                  </span>
                  {entry.status === 'failed' && (
                    <button
                      onClick={(e) => { e.stopPropagation(); handleRetry(entry.id); }}
                      className="text-xs text-brand-600 font-medium hover:text-brand-700"
                    >
                      Retry Sync
                    </button>
                  )}
                </div>
              </div>
              
              {entry.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-surface-50">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs text-surface-500">Attachments:</span>
                    {entry.attachments.map((att, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-1 bg-surface-50 rounded-lg text-xs text-surface-600 flex items-center gap-1"
                      >
                        {att.type === 'photo' && <Image className="w-3 h-3" />}
                        {att.type === 'video' && <Video className="w-3 h-3" />}
                        {att.type === 'audio' && <Mic className="w-3 h-3" />}
                        {att.type === 'document' && <FileText className="w-3 h-3" />}
                        {att.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* New Entry Modal */}
      <AnimatePresence>
        {showNewEntry && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowNewEntry(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl max-w-lg w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-brand-900">New Field Entry</h2>
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="p-2 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Entry Type</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option>Incident Report</option>
                    <option>Safety Audit</option>
                    <option>Hazard Report</option>
                    <option>Safety Observation</option>
                    <option>Photo Documentation</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Title</label>
                  <input
                    type="text"
                    placeholder="Brief description..."
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Description</label>
                  <textarea
                    rows={3}
                    placeholder="Detailed description..."
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Location</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter location..."
                      className="flex-1 px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    />
                    <button className="px-4 py-2.5 bg-surface-50 border border-surface-200 rounded-xl hover:bg-surface-100 transition-colors">
                      <MapPin className="w-5 h-5 text-surface-600" />
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-2">Attachments</label>
                  <div className="flex gap-2 flex-wrap">
                    <button className="flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl hover:bg-surface-100 transition-colors text-sm">
                      <Camera className="w-4 h-4" /> Photo
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl hover:bg-surface-100 transition-colors text-sm">
                      <Video className="w-4 h-4" /> Video
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl hover:bg-surface-100 transition-colors text-sm">
                      <Mic className="w-4 h-4" /> Voice
                    </button>
                    <button className="flex items-center gap-2 px-3 py-2 bg-surface-50 border border-surface-200 rounded-xl hover:bg-surface-100 transition-colors text-sm">
                      <Upload className="w-4 h-4" /> File
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="flex-1 py-3 border border-surface-200 text-surface-600 font-medium rounded-xl hover:bg-surface-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowNewEntry(false)}
                  className="flex-1 py-3 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-medium rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isOnline ? 'Submit' : 'Save Offline'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MobileDataCollection;
