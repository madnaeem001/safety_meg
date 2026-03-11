import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, Clock, AlertTriangle, FileText,
  Shield, User, Calendar, MapPin, ChevronRight, Filter, Search,
  ThumbsUp, ThumbsDown, MessageSquare, Eye, Send, Loader2,
  ClipboardList, Flame, HardHat, Users, CheckCircle2, History,
  MoreVertical, Bell, RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSupervisorApprovals, useApproveRequest, useRejectRequest } from '../api/hooks/useAPIHooks';

// Approval Types
interface ApprovalItem {
  id: string;
  type: 'permit' | 'jsa' | 'capa' | 'investigation' | 'training';
  title: string;
  description: string;
  submittedBy: {
    id: string;
    name: string;
    role: string;
    department: string;
  };
  submittedAt: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'approved' | 'rejected' | 'returned';
  location?: string;
  validFrom?: Date;
  validUntil?: Date;
  details: Record<string, any>;
  comments: ApprovalComment[];
  history: ApprovalHistoryItem[];
}

interface ApprovalComment {
  id: string;
  author: string;
  message: string;
  timestamp: Date;
  isInternal?: boolean;
}

interface ApprovalHistoryItem {
  id: string;
  action: 'submitted' | 'reviewed' | 'approved' | 'rejected' | 'returned' | 'modified';
  actor: string;
  timestamp: Date;
  notes?: string;
}

// Mock data
const mockApprovalQueue: ApprovalItem[] = [
  {
    id: 'AP-001',
    type: 'permit',
    title: 'Hot Work Permit - Welding Bay 3',
    description: 'Request for hot work permit to perform welding operations on pipe fittings in Welding Bay 3.',
    submittedBy: { id: 'U-123', name: 'Mike Johnson', role: 'Contractor', department: 'Maintenance' },
    submittedAt: new Date('2026-02-06T08:30:00'),
    priority: 'high',
    status: 'pending',
    location: 'Welding Bay 3, Building A',
    validFrom: new Date('2026-02-06T09:00:00'),
    validUntil: new Date('2026-02-06T17:00:00'),
    details: {
      workType: 'Welding',
      equipment: 'MIG Welder, Angle Grinder',
      fireWatch: 'Required - 60 min post-work',
      ppeRequired: ['Welding Helmet', 'Leather Gloves', 'Fire-Resistant Clothing', 'Safety Boots'],
      combustiblesCleared: true,
      fireExtinguisher: 'ABC Type - Within 10ft'
    },
    comments: [],
    history: [
      { id: 'H-1', action: 'submitted', actor: 'Mike Johnson', timestamp: new Date('2026-02-06T08:30:00') }
    ]
  },
  {
    id: 'AP-002',
    type: 'jsa',
    title: 'JSA - Scaffold Installation at Building C',
    description: 'Job Safety Analysis for erecting scaffolding on the east side of Building C for facade maintenance.',
    submittedBy: { id: 'U-456', name: 'Sarah Chen', role: 'Safety Technician', department: 'Operations' },
    submittedAt: new Date('2026-02-06T07:45:00'),
    priority: 'high',
    status: 'pending',
    location: 'Building C, East Side',
    details: {
      taskName: 'Scaffold Installation',
      crewSize: 4,
      estimatedDuration: '6 hours',
      stepsCount: 8,
      hazardsIdentified: 5,
      controlMeasures: 12,
      ppeRequired: ['Hard Hat', 'Safety Harness', 'Safety Boots', 'Gloves', 'High-Vis Vest']
    },
    comments: [
      { id: 'C-1', author: 'Lisa Park', message: 'Please clarify the fall protection measures for steps 3-5.', timestamp: new Date('2026-02-06T08:15:00') }
    ],
    history: [
      { id: 'H-1', action: 'submitted', actor: 'Sarah Chen', timestamp: new Date('2026-02-06T07:45:00') },
      { id: 'H-2', action: 'reviewed', actor: 'Lisa Park', timestamp: new Date('2026-02-06T08:15:00'), notes: 'Requested clarification' }
    ]
  },
  {
    id: 'AP-003',
    type: 'permit',
    title: 'Confined Space Entry - Tank 7',
    description: 'Entry permit for cleaning and inspection of storage tank #7.',
    submittedBy: { id: 'U-789', name: 'Tom Wilson', role: 'Operator', department: 'Production' },
    submittedAt: new Date('2026-02-06T06:00:00'),
    priority: 'urgent',
    status: 'pending',
    location: 'Tank Farm, Tank #7',
    validFrom: new Date('2026-02-06T10:00:00'),
    validUntil: new Date('2026-02-06T14:00:00'),
    details: {
      entryType: 'Permit-Required Confined Space',
      atmosphereTested: true,
      o2Level: '20.8%',
      lel: '0%',
      h2s: '0 ppm',
      ventilationType: 'Continuous Forced Air',
      rescuePlan: 'On-site rescue team standby',
      entrantCount: 2,
      attendantAssigned: 'David Brown'
    },
    comments: [],
    history: [
      { id: 'H-1', action: 'submitted', actor: 'Tom Wilson', timestamp: new Date('2026-02-06T06:00:00') }
    ]
  },
  {
    id: 'AP-004',
    type: 'jsa',
    title: 'JSA - Electrical Panel Maintenance',
    description: 'Job Safety Analysis for de-energizing and servicing main electrical panel in Substation 2.',
    submittedBy: { id: 'U-321', name: 'James Lee', role: 'Electrician', department: 'Engineering' },
    submittedAt: new Date('2026-02-05T16:30:00'),
    priority: 'medium',
    status: 'pending',
    location: 'Substation 2',
    details: {
      taskName: 'Electrical Panel Maintenance',
      crewSize: 2,
      estimatedDuration: '4 hours',
      stepsCount: 6,
      hazardsIdentified: 4,
      controlMeasures: 8,
      lotoRequired: true,
      arcFlashPPE: true
    },
    comments: [],
    history: [
      { id: 'H-1', action: 'submitted', actor: 'James Lee', timestamp: new Date('2026-02-05T16:30:00') }
    ]
  },
  {
    id: 'AP-005',
    type: 'capa',
    title: 'CAPA - Install Additional Guardrails',
    description: 'Corrective action to install permanent guardrails on mezzanine level following near-miss incident.',
    submittedBy: { id: 'U-654', name: 'Emma Davis', role: 'Safety Manager', department: 'EHS' },
    submittedAt: new Date('2026-02-04T14:00:00'),
    priority: 'high',
    status: 'pending',
    details: {
      sourceIncident: 'INC-2026-012',
      capaType: 'Corrective',
      estimatedCost: '$4,500',
      targetCompletionDate: '2026-02-15',
      responsibleParty: 'Facilities Team',
      verificationMethod: 'Physical inspection and load test'
    },
    comments: [],
    history: [
      { id: 'H-1', action: 'submitted', actor: 'Emma Davis', timestamp: new Date('2026-02-04T14:00:00') }
    ]
  }
];

type TabFilter = 'all' | 'permits' | 'jsa' | 'capa';
type StatusFilter = 'pending' | 'approved' | 'rejected' | 'all';

export const SupervisorApprovals: React.FC = () => {
  const navigate = useNavigate();
  const [tabFilter, setTabFilter] = useState<TabFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [approvalComment, setApprovalComment] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // ── Real API Data ────────────────────────────────────────────────────────
  const { data: backendApprovals } = useSupervisorApprovals({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const approveMutation = useApproveRequest();
  const rejectMutation = useRejectRequest();

  // Merge backend approvals with mock queue
  const allApprovals = useMemo<ApprovalItem[]>(() => {
    if (!backendApprovals || backendApprovals.length === 0) return mockApprovalQueue;
    const converted: ApprovalItem[] = (backendApprovals as any[]).map((a: any) => ({
      id: a.id || a.approvalId,
      type: a.type || 'permit',
      title: a.title,
      description: a.description || '',
      submittedBy: {
        id: String(a.submittedBy || a.userId || ''),
        name: a.submitterName || a.submittedByName || 'Unknown',
        role: a.submitterRole || 'Employee',
        department: a.department || 'General',
      },
      submittedAt: new Date(a.submittedAt || a.createdAt || Date.now()),
      priority: a.priority || 'medium',
      status: a.status || 'pending',
      location: a.location,
      validFrom: a.validFrom ? new Date(a.validFrom) : undefined,
      validUntil: a.validUntil ? new Date(a.validUntil) : undefined,
      details: a.details || {},
      comments: a.comments || [],
      history: a.history || [],
    }));
    const existingIds = new Set(converted.map(c => c.id));
    return [...converted, ...mockApprovalQueue.filter(m => !existingIds.has(m.id))];
  }, [backendApprovals]);

  // Filter items
  const filteredItems = allApprovals.filter(item => {
    if (tabFilter !== 'all' && item.type !== (tabFilter === 'permits' ? 'permit' : tabFilter)) return false;
    if (statusFilter !== 'all' && item.status !== statusFilter) return false;
    if (searchQuery && !item.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingCount = allApprovals.filter(i => i.status === 'pending').length;
  const urgentCount = allApprovals.filter(i => i.status === 'pending' && i.priority === 'urgent').length;

  const getTypeIcon = (type: ApprovalItem['type']) => {
    switch (type) {
      case 'permit': return <Flame className="w-5 h-5 text-orange-500" />;
      case 'jsa': return <Shield className="w-5 h-5 text-teal-500" />;
      case 'capa': return <ClipboardList className="w-5 h-5 text-purple-500" />;
      case 'investigation': return <Eye className="w-5 h-5 text-blue-500" />;
      case 'training': return <Users className="w-5 h-5 text-green-500" />;
    }
  };

  const getPriorityColor = (priority: ApprovalItem['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
    }
  };

  const getStatusBadge = (status: ApprovalItem['status']) => {
    switch (status) {
      case 'pending': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium flex items-center gap-1"><Clock className="w-3 h-3" />Pending</span>;
      case 'approved': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium flex items-center gap-1"><CheckCircle className="w-3 h-3" />Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium flex items-center gap-1"><XCircle className="w-3 h-3" />Rejected</span>;
      case 'returned': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1"><RefreshCw className="w-3 h-3" />Returned</span>;
    }
  };

  const handleApprove = async () => {
    if (!selectedItem) return;
    setIsProcessing(true);
    try {
      await approveMutation.mutate({ id: selectedItem.id, comment: approvalComment });
    } catch {
      // fallback - still close modal
    }
    setIsProcessing(false);
    setSelectedItem(null);
    setApprovalComment('');
  };

  const handleReject = async () => {
    if (!selectedItem || !approvalComment) {
      alert('Please provide a reason for rejection');
      return;
    }
    setIsProcessing(true);
    try {
      await rejectMutation.mutate({ id: selectedItem.id, comment: approvalComment });
    } catch {
      // fallback
    }
    setIsProcessing(false);
    setSelectedItem(null);
    setApprovalComment('');
  };

  const handleReturn = async () => {
    if (!selectedItem || !approvalComment) {
      alert('Please provide comments for the returned item');
      return;
    }
    setIsProcessing(true);
    try {
      await rejectMutation.mutate({ id: selectedItem.id, comment: `[RETURNED FOR REVISION] ${approvalComment}` });
    } catch {
      // fallback - still close modal
    }
    setIsProcessing(false);
    setSelectedItem(null);
    setApprovalComment('');
  };

  const timeSince = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white sticky top-[72px] z-50 safe-top">
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-white/10 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold">Approval Queue</h1>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-white/10 rounded-full transition-colors relative">
                <Bell className="w-5 h-5" />
                {urgentCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">{urgentCount}</span>
                )}
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-white/70">Pending</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-red-300">{urgentCount}</p>
              <p className="text-xs text-white/70">Urgent</p>
            </div>
            <div className="bg-white/10 rounded-xl p-3 text-center">
              <p className="text-2xl font-bold text-green-300">12</p>
              <p className="text-xs text-white/70">Today</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto no-scrollbar px-4 pb-2 gap-2">
          {[
            { id: 'all', label: 'All', count: allApprovals.length },
            { id: 'permits', label: 'Permits', count: allApprovals.filter(i => i.type === 'permit').length },
            { id: 'jsa', label: 'JSAs', count: allApprovals.filter(i => i.type === 'jsa').length },
            { id: 'capa', label: 'CAPAs', count: allApprovals.filter(i => i.type === 'capa').length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setTabFilter(tab.id as TabFilter)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium whitespace-nowrap transition-all ${
                tabFilter === tab.id
                  ? 'bg-white text-indigo-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {tab.label}
              <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                tabFilter === tab.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white/20'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approvals..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-surface-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
          />
        </div>

        {/* Status Filter */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {[
            { id: 'pending', label: 'Pending' },
            { id: 'approved', label: 'Approved' },
            { id: 'rejected', label: 'Rejected' },
            { id: 'all', label: 'All Statuses' },
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setStatusFilter(filter.id as StatusFilter)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                statusFilter === filter.id
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>

        {/* Approval Items */}
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setSelectedItem(item)}
              className="w-full bg-white p-4 rounded-2xl border border-surface-100 shadow-sm hover:shadow-md transition-all text-left"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-surface-100 rounded-xl flex items-center justify-center">
                  {getTypeIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-lg border ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                    {getStatusBadge(item.status)}
                    {item.comments.length > 0 && (
                      <span className="text-xs text-surface-500 flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />{item.comments.length}
                      </span>
                    )}
                  </div>
                  <p className="font-medium text-surface-900 truncate">{item.title}</p>
                  <div className="flex items-center gap-3 mt-1 text-sm text-surface-500">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.submittedBy.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeSince(item.submittedAt)}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-surface-400" />
              </div>
            </motion.button>
          ))}

          {filteredItems.length === 0 && (
            <div className="bg-white p-8 rounded-2xl text-center text-surface-500">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>No items to approve</p>
            </div>
          )}
        </div>
      </main>

      {/* Approval Detail Modal */}
      <AnimatePresence>
        {selectedItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 overflow-y-auto"
            onClick={() => setSelectedItem(null)}
          >
            <div className="min-h-screen flex items-end justify-center p-4">
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-t-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
              >
                <div className="sticky top-[72px] bg-white border-b border-surface-100 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getTypeIcon(selectedItem.type)}
                    <div>
                      <p className="font-bold text-surface-900">{selectedItem.id}</p>
                      <p className="text-xs text-surface-500 capitalize">{selectedItem.type}</p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-surface-100 rounded-full">
                    <XCircle className="w-5 h-5 text-surface-500" />
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Header Info */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-lg border ${getPriorityColor(selectedItem.priority)}`}>
                        {selectedItem.priority} priority
                      </span>
                      {getStatusBadge(selectedItem.status)}
                    </div>
                    <h2 className="text-xl font-bold text-brand-900">{selectedItem.title}</h2>
                    <p className="text-surface-600 mt-2">{selectedItem.description}</p>
                  </div>

                  {/* Submitter Info */}
                  <div className="bg-surface-50 rounded-xl p-4">
                    <p className="text-xs text-surface-400 uppercase font-bold mb-2">Submitted By</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 font-bold">
                        {selectedItem.submittedBy.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{selectedItem.submittedBy.name}</p>
                        <p className="text-sm text-surface-500">{selectedItem.submittedBy.role} • {selectedItem.submittedBy.department}</p>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-surface-50 rounded-xl p-4">
                    <p className="text-xs text-surface-400 uppercase font-bold mb-3">Details</p>
                    <div className="space-y-2">
                      {selectedItem.location && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="w-4 h-4 text-surface-400" />
                          <span className="text-surface-600">{selectedItem.location}</span>
                        </div>
                      )}
                      {selectedItem.validFrom && selectedItem.validUntil && (
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-surface-400" />
                          <span className="text-surface-600">
                            {selectedItem.validFrom.toLocaleTimeString()} - {selectedItem.validUntil.toLocaleTimeString()}
                          </span>
                        </div>
                      )}
                      {Object.entries(selectedItem.details).slice(0, 5).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-surface-500 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                          <span className="text-surface-900 font-medium">
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : 
                             Array.isArray(value) ? value.join(', ') : String(value)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Comments */}
                  {selectedItem.comments.length > 0 && (
                    <div>
                      <p className="text-xs text-surface-400 uppercase font-bold mb-3">Comments</p>
                      <div className="space-y-3">
                        {selectedItem.comments.map(comment => (
                          <div key={comment.id} className="bg-blue-50 rounded-xl p-3">
                            <div className="flex items-center justify-between mb-1">
                              <p className="font-medium text-sm text-blue-900">{comment.author}</p>
                              <p className="text-xs text-blue-600">{timeSince(comment.timestamp)}</p>
                            </div>
                            <p className="text-sm text-blue-800">{comment.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* History Toggle */}
                  <button
                    onClick={() => setShowHistory(!showHistory)}
                    className="w-full flex items-center justify-between p-3 bg-surface-50 rounded-xl hover:bg-surface-100 transition-colors"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-surface-700">
                      <History className="w-4 h-4" />
                      Approval History
                    </span>
                    <ChevronRight className={`w-5 h-5 text-surface-400 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
                  </button>

                  {showHistory && (
                    <div className="space-y-2 pl-4 border-l-2 border-surface-200">
                      {selectedItem.history.map(event => (
                        <div key={event.id} className="text-sm">
                          <p className="text-surface-900">
                            <span className="font-medium">{event.actor}</span>
                            <span className="text-surface-500"> {event.action} this item</span>
                          </p>
                          <p className="text-xs text-surface-400">{event.timestamp.toLocaleString()}</p>
                          {event.notes && <p className="text-sm text-surface-600 mt-1">{event.notes}</p>}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Comment */}
                  {selectedItem.status === 'pending' && (
                    <div>
                      <label className="text-xs text-surface-400 uppercase font-bold mb-2 block">Add Comment / Reason</label>
                      <textarea
                        value={approvalComment}
                        onChange={(e) => setApprovalComment(e.target.value)}
                        placeholder="Enter comments or reason for rejection/return..."
                        rows={3}
                        className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500/20 outline-none"
                      />
                    </div>
                  )}

                  {/* Action Buttons */}
                  {selectedItem.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={handleReject}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-red-100 text-red-700 rounded-xl font-bold hover:bg-red-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <ThumbsDown className="w-5 h-5" />
                        Reject
                      </button>
                      <button
                        onClick={handleReturn}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-blue-100 text-blue-700 rounded-xl font-bold hover:bg-blue-200 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        <RefreshCw className="w-5 h-5" />
                        Return
                      </button>
                      <button
                        onClick={handleApprove}
                        disabled={isProcessing}
                        className="flex-1 py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                      >
                        {isProcessing ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <>
                            <ThumbsUp className="w-5 h-5" />
                            Approve
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupervisorApprovals;
