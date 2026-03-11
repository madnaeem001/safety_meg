import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCode, Scan, CheckCircle2, Clock, AlertCircle, FileText, Camera, Upload, Search, Filter, Download, ExternalLink, History, Wrench, ClipboardList, Shield, Plus, X } from 'lucide-react';

interface Equipment {
  id: string;
  name: string;
  type: string;
  location: string;
  qrCode: string;
  lastInspection: string;
  nextInspection: string;
  status: 'compliant' | 'due' | 'overdue' | 'in_progress';
  maintenanceHistory: {
    date: string;
    type: string;
    technician: string;
    notes: string;
  }[];
  safetyProtocols: string[];
  checklistItems: {
    id: string;
    item: string;
    completed: boolean;
    date?: string;
  }[];
}

const EQUIPMENT_DATA: Equipment[] = [
  {
    id: 'EQ-001',
    name: 'Fire Extinguisher A-101',
    type: 'Fire Safety',
    location: 'Building A - Floor 1',
    qrCode: 'FE-A101-2024',
    lastInspection: '2026-01-15',
    nextInspection: '2026-02-15',
    status: 'compliant',
    maintenanceHistory: [
      { date: '2026-01-15', type: 'Monthly Inspection', technician: 'John Smith', notes: 'All components in working order' },
      { date: '2025-12-15', type: 'Monthly Inspection', technician: 'Sarah Davis', notes: 'Pressure gauge checked, seal intact' },
      { date: '2025-11-15', type: 'Annual Certification', technician: 'Mike Johnson', notes: 'Full certification completed' },
    ],
    safetyProtocols: ['Pull pin before use', 'Aim at base of fire', 'Squeeze handle', 'Sweep side to side', 'Stand 6-8 feet away'],
    checklistItems: [
      { id: 'c1', item: 'Pressure gauge in green zone', completed: true, date: '2026-01-15' },
      { id: 'c2', item: 'Safety seal intact', completed: true, date: '2026-01-15' },
      { id: 'c3', item: 'No visible damage', completed: true, date: '2026-01-15' },
      { id: 'c4', item: 'Access unobstructed', completed: true, date: '2026-01-15' },
    ],
  },
  {
    id: 'EQ-002',
    name: 'AED Unit - Lobby',
    type: 'Emergency Response',
    location: 'Main Building - Lobby',
    qrCode: 'AED-MB01-2024',
    lastInspection: '2026-01-01',
    nextInspection: '2026-02-01',
    status: 'due',
    maintenanceHistory: [
      { date: '2026-01-01', type: 'Monthly Check', technician: 'Emily Chen', notes: 'Battery at 85%, pads expire Apr 2026' },
      { date: '2025-12-01', type: 'Monthly Check', technician: 'John Smith', notes: 'All indicators green' },
    ],
    safetyProtocols: ['Call 911 first', 'Turn on device', 'Follow voice prompts', 'Apply pads as shown', 'Ensure no one touches patient during analysis'],
    checklistItems: [
      { id: 'c1', item: 'Device powers on', completed: false },
      { id: 'c2', item: 'Battery indicator green', completed: false },
      { id: 'c3', item: 'Pads not expired', completed: false },
      { id: 'c4', item: 'Rescue kit complete', completed: false },
    ],
  },
  {
    id: 'EQ-003',
    name: 'Forklift FL-103',
    type: 'Heavy Equipment',
    location: 'Warehouse B',
    qrCode: 'FL-103-2024',
    lastInspection: '2025-12-20',
    nextInspection: '2026-01-20',
    status: 'overdue',
    maintenanceHistory: [
      { date: '2025-12-20', type: 'Pre-shift Inspection', technician: 'Robert Wilson', notes: 'Minor hydraulic leak noted - scheduled for repair' },
      { date: '2025-12-15', type: 'Weekly Maintenance', technician: 'Sarah Davis', notes: 'Fluid levels topped off' },
    ],
    safetyProtocols: ['Complete pre-shift checklist', 'Wear seatbelt', 'Sound horn at intersections', 'Max load 5000 lbs', 'Travel with forks lowered'],
    checklistItems: [
      { id: 'c1', item: 'Fluid levels adequate', completed: false },
      { id: 'c2', item: 'Brakes functional', completed: false },
      { id: 'c3', item: 'Horn working', completed: false },
      { id: 'c4', item: 'Lights operational', completed: false },
      { id: 'c5', item: 'Forks not damaged', completed: false },
    ],
  },
  {
    id: 'EQ-004',
    name: 'Gas Detector GD-201',
    type: 'Environmental Monitoring',
    location: 'Chemical Storage',
    qrCode: 'GD-201-2024',
    lastInspection: '2026-01-28',
    nextInspection: '2026-02-28',
    status: 'compliant',
    maintenanceHistory: [
      { date: '2026-01-28', type: 'Calibration', technician: 'Mike Johnson', notes: 'Calibrated against standard reference gases' },
      { date: '2026-01-14', type: 'Bump Test', technician: 'Emily Chen', notes: 'Passed all sensor tests' },
    ],
    safetyProtocols: ['Bump test before each use', 'Replace sensor if readings drift', 'Evacuate on alarm', 'Report any unusual readings'],
    checklistItems: [
      { id: 'c1', item: 'Bump test completed', completed: true, date: '2026-01-28' },
      { id: 'c2', item: 'Battery charged', completed: true, date: '2026-01-28' },
      { id: 'c3', item: 'Display visible', completed: true, date: '2026-01-28' },
      { id: 'c4', item: 'Alarm audible', completed: true, date: '2026-01-28' },
    ],
  },
];

const STATUS_CONFIG = {
  compliant: { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2, label: 'Compliant' },
  due: { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock, label: 'Due Soon' },
  overdue: { color: 'bg-red-100 text-red-700 border-red-200', icon: AlertCircle, label: 'Overdue' },
  in_progress: { color: 'bg-blue-100 text-blue-700 border-blue-200', icon: Scan, label: 'In Progress' },
};

export const QRCodeAudit: React.FC = () => {
  const [equipment, setEquipment] = useState<Equipment[]>(EQUIPMENT_DATA);
  const [selectedEquipment, setSelectedEquipment] = useState<Equipment | null>(null);
  const [scanMode, setScanMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'compliant' | 'due' | 'overdue'>('all');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'checklist' | 'history' | 'protocols'>('checklist');

  const filteredEquipment = equipment.filter(eq => {
    const matchesSearch = eq.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      eq.qrCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || eq.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const handleChecklistToggle = (equipmentId: string, checklistId: string) => {
    setEquipment(prev => prev.map(eq => {
      if (eq.id === equipmentId) {
        const updatedChecklist = eq.checklistItems.map(item =>
          item.id === checklistId 
            ? { ...item, completed: !item.completed, date: !item.completed ? new Date().toISOString().split('T')[0] : undefined }
            : item
        );
        const allCompleted = updatedChecklist.every(item => item.completed);
        return {
          ...eq,
          checklistItems: updatedChecklist,
          status: allCompleted ? 'compliant' as const : eq.status,
          lastInspection: allCompleted ? new Date().toISOString().split('T')[0] : eq.lastInspection,
        };
      }
      return eq;
    }));
    
    if (selectedEquipment?.id === equipmentId) {
      setSelectedEquipment(prev => {
        if (!prev) return null;
        const updatedChecklist = prev.checklistItems.map(item =>
          item.id === checklistId 
            ? { ...item, completed: !item.completed, date: !item.completed ? new Date().toISOString().split('T')[0] : undefined }
            : item
        );
        return { ...prev, checklistItems: updatedChecklist };
      });
    }
  };

  const stats = {
    total: equipment.length,
    compliant: equipment.filter(e => e.status === 'compliant').length,
    due: equipment.filter(e => e.status === 'due').length,
    overdue: equipment.filter(e => e.status === 'overdue').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">QR Code Equipment Audits</h2>
          <p className="text-surface-500 mt-1">Scan QR codes to instantly access checklists, maintenance records, and safety protocols</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setScanMode(!scanMode)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${
              scanMode 
                ? 'bg-brand-600 text-white' 
                : 'bg-white border border-surface-200 text-surface-700 hover:bg-surface-50'
            }`}
          >
            <Scan className="w-5 h-5" />
            {scanMode ? 'Stop Scanning' : 'Scan QR Code'}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={() => setShowGenerateModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-medium rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all"
          >
            <Plus className="w-5 h-5" />
            Generate QR Code
          </motion.button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Equipment', value: stats.total, color: 'brand', icon: QrCode },
          { label: 'Compliant', value: stats.compliant, color: 'emerald', icon: CheckCircle2 },
          { label: 'Due Soon', value: stats.due, color: 'amber', icon: Clock },
          { label: 'Overdue', value: stats.overdue, color: 'red', icon: AlertCircle },
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

      {/* Scan Mode Preview */}
      <AnimatePresence>
        {scanMode && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-br from-brand-50 to-indigo-50 p-6 rounded-2xl border border-brand-100"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-48 h-48 bg-white rounded-2xl flex items-center justify-center border-2 border-dashed border-brand-200 relative overflow-hidden">
                <div className="absolute inset-0 bg-brand-500/5" />
                <div className="text-center">
                  <Camera className="w-12 h-12 text-brand-400 mx-auto mb-2" />
                  <p className="text-sm text-brand-600 font-medium">Point camera at QR code</p>
                </div>
                <motion.div
                  animate={{ y: [-80, 80] }}
                  transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                  className="absolute left-0 right-0 h-1 bg-brand-400/50"
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h3 className="text-lg font-bold text-brand-900 mb-2">QR Scanner Active</h3>
                <p className="text-surface-600 mb-4">Point your device camera at any equipment QR code to instantly access:</p>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  <span className="px-3 py-1 bg-white rounded-lg text-sm text-brand-700 border border-brand-100">
                    <ClipboardList className="w-4 h-4 inline mr-1" /> Checklists
                  </span>
                  <span className="px-3 py-1 bg-white rounded-lg text-sm text-brand-700 border border-brand-100">
                    <History className="w-4 h-4 inline mr-1" /> Maintenance History
                  </span>
                  <span className="px-3 py-1 bg-white rounded-lg text-sm text-brand-700 border border-brand-100">
                    <Shield className="w-4 h-4 inline mr-1" /> Safety Protocols
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search equipment by name, location, or QR code..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'compliant', 'due', 'overdue'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                filterStatus === status
                  ? 'bg-brand-600 text-white'
                  : 'bg-white border border-surface-200 text-surface-600 hover:bg-surface-50'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Equipment Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredEquipment.map((eq) => {
          const StatusIcon = STATUS_CONFIG[eq.status].icon;
          return (
            <motion.div
              key={eq.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              whileHover={{ y: -2 }}
              onClick={() => setSelectedEquipment(eq)}
              className="bg-white p-5 rounded-2xl shadow-soft border border-surface-100 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-brand-50 to-indigo-50 rounded-xl flex items-center justify-center">
                    <QrCode className="w-6 h-6 text-brand-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-brand-900">{eq.name}</h3>
                    <p className="text-xs text-surface-500">{eq.type}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-[10px] font-bold rounded-lg border ${STATUS_CONFIG[eq.status].color}`}>
                  <StatusIcon className="w-3 h-3 inline mr-1" />
                  {STATUS_CONFIG[eq.status].label}
                </span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-surface-600">
                  <span className="text-surface-400">Location:</span>
                  {eq.location}
                </div>
                <div className="flex items-center gap-2 text-surface-600">
                  <span className="text-surface-400">QR Code:</span>
                  <code className="px-2 py-0.5 bg-surface-50 rounded font-mono text-xs">{eq.qrCode}</code>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-surface-600">
                    <span className="text-surface-400">Last Inspection:</span>
                    {eq.lastInspection}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-surface-50 flex justify-between items-center">
                <div className="text-xs text-surface-500">
                  Next: <span className={eq.status === 'overdue' ? 'text-red-600 font-bold' : 'text-brand-600'}>{eq.nextInspection}</span>
                </div>
                <button className="text-brand-600 text-xs font-medium flex items-center gap-1 hover:text-brand-700">
                  View Details <ExternalLink className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Equipment Detail Modal */}
      <AnimatePresence>
        {selectedEquipment && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedEquipment(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-surface-100 bg-gradient-to-r from-brand-50 to-indigo-50">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-soft">
                      <QrCode className="w-8 h-8 text-brand-600" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-brand-900">{selectedEquipment.name}</h2>
                      <p className="text-surface-600">{selectedEquipment.location}</p>
                      <code className="mt-1 px-2 py-0.5 bg-white rounded text-xs font-mono text-brand-600 inline-block">
                        {selectedEquipment.qrCode}
                      </code>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedEquipment(null)}
                    className="p-2 rounded-xl hover:bg-white transition-colors"
                  >
                    <X className="w-5 h-5 text-surface-500" />
                  </button>
                </div>
              </div>

              {/* Modal Tabs */}
              <div className="flex border-b border-surface-100">
                {[
                  { id: 'checklist', label: 'Checklist', icon: ClipboardList },
                  { id: 'history', label: 'History', icon: History },
                  { id: 'protocols', label: 'Safety Protocols', icon: Shield },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex-1 px-4 py-3 flex items-center justify-center gap-2 text-sm font-medium transition-all ${
                      activeTab === tab.id
                        ? 'text-brand-600 border-b-2 border-brand-600 bg-brand-50/50'
                        : 'text-surface-500 hover:text-brand-600'
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Modal Content */}
              <div className="p-6 max-h-[400px] overflow-y-auto">
                {activeTab === 'checklist' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-brand-900">Inspection Checklist</h3>
                      <span className="text-xs text-surface-500">
                        {selectedEquipment.checklistItems.filter(i => i.completed).length}/{selectedEquipment.checklistItems.length} completed
                      </span>
                    </div>
                    {selectedEquipment.checklistItems.map((item) => (
                      <motion.div
                        key={item.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleChecklistToggle(selectedEquipment.id, item.id)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all ${
                          item.completed
                            ? 'bg-emerald-50 border-emerald-200'
                            : 'bg-white border-surface-200 hover:border-brand-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                            item.completed ? 'bg-emerald-500' : 'border-2 border-surface-300'
                          }`}>
                            {item.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                          </div>
                          <span className={item.completed ? 'text-surface-600 line-through' : 'text-brand-900'}>
                            {item.item}
                          </span>
                          {item.date && (
                            <span className="ml-auto text-xs text-surface-400">{item.date}</span>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    <button className="w-full mt-4 py-3 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-medium rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all">
                      Complete Inspection
                    </button>
                  </div>
                )}

                {activeTab === 'history' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-brand-900 mb-4">Maintenance History</h3>
                    <div className="relative">
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-surface-200" />
                      {selectedEquipment.maintenanceHistory.map((record, idx) => (
                        <div key={idx} className="relative pl-10 pb-4">
                          <div className="absolute left-2.5 w-3 h-3 rounded-full bg-brand-500 border-2 border-white" />
                          <div className="bg-surface-50 p-4 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-brand-900">{record.type}</span>
                              <span className="text-xs text-surface-500">{record.date}</span>
                            </div>
                            <p className="text-sm text-surface-600">{record.notes}</p>
                            <p className="text-xs text-surface-400 mt-2">By: {record.technician}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {activeTab === 'protocols' && (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-brand-900 mb-4">Safety Protocols</h3>
                    <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 mb-4">
                      <div className="flex items-center gap-2 text-amber-700 font-medium mb-2">
                        <AlertCircle className="w-5 h-5" />
                        Important Safety Information
                      </div>
                      <p className="text-sm text-amber-600">
                        Always review these protocols before operating or inspecting this equipment.
                      </p>
                    </div>
                    <div className="space-y-2">
                      {selectedEquipment.safetyProtocols.map((protocol, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-surface-50 rounded-xl">
                          <div className="w-6 h-6 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {idx + 1}
                          </div>
                          <span className="text-surface-700">{protocol}</span>
                        </div>
                      ))}
                    </div>
                    <button className="w-full mt-4 py-3 border border-brand-200 text-brand-600 font-medium rounded-xl hover:bg-brand-50 transition-all flex items-center justify-center gap-2">
                      <Download className="w-4 h-4" />
                      Download Full Protocol PDF
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Generate QR Code Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGenerateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-xl max-w-md w-full p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-brand-900">Generate QR Code</h2>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="p-2 rounded-xl hover:bg-surface-50 transition-colors"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Equipment Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Fire Extinguisher B-201"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Equipment Type</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option>Fire Safety</option>
                    <option>Emergency Response</option>
                    <option>Heavy Equipment</option>
                    <option>Environmental Monitoring</option>
                    <option>Personal Protective Equipment</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="e.g., Building A - Floor 2"
                    className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-900 mb-1">Inspection Frequency</label>
                  <select className="w-full px-4 py-2.5 rounded-xl border border-surface-200 focus:ring-2 focus:ring-brand-500 focus:border-transparent">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annually</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-3 border border-surface-200 text-surface-600 font-medium rounded-xl hover:bg-surface-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={() => setShowGenerateModal(false)}
                  className="flex-1 py-3 bg-gradient-to-br from-brand-600 to-brand-700 text-white font-medium rounded-xl hover:from-brand-700 hover:to-brand-800 transition-all flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  Generate QR
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default QRCodeAudit;
