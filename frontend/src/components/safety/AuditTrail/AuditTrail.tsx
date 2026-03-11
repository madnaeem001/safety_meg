import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, 
  User, 
  Calendar, 
  Clock, 
  FileText, 
  Edit3, 
  Plus, 
  Trash2, 
  Eye, 
  Send, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Filter,
  Search,
  Download,
  ChevronDown,
  ChevronRight,
  ArrowUpRight,
  Shield,
  Lock,
  Fingerprint,
  Hash
} from 'lucide-react';

// Audit action types
export type AuditAction = 
  | 'CREATE' 
  | 'UPDATE' 
  | 'DELETE' 
  | 'VIEW' 
  | 'SUBMIT' 
  | 'APPROVE' 
  | 'REJECT' 
  | 'SIGN' 
  | 'EXPORT' 
  | 'ASSIGN'
  | 'COMMENT'
  | 'ATTACH'
  | 'STATUS_CHANGE';

export interface AuditEntry {
  id: string;
  timestamp: string;
  action: AuditAction;
  userId: string;
  userName: string;
  userRole: string;
  entityType: string; // 'incident', 'injury', 'jsa', etc.
  entityId: string;
  entityTitle?: string;
  field?: string;
  oldValue?: string;
  newValue?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  details?: string;
  hash?: string; // SHA-256 hash for integrity verification
}

// Mock audit data
const mockAuditEntries: AuditEntry[] = [
  {
    id: 'AUDIT-001',
    timestamp: '2026-01-25T14:32:15Z',
    action: 'CREATE',
    userId: 'USR-001',
    userName: 'John Smith',
    userRole: 'Safety Manager',
    entityType: 'incident',
    entityId: 'INC-2026-015',
    entityTitle: 'Slip hazard in warehouse',
    details: 'New incident report created',
    ipAddress: '192.168.1.100',
    hash: 'a7f2b9c3d4e5f6a1b2c3d4e5f6a7b8c9d0e1f2a3'
  },
  {
    id: 'AUDIT-002',
    timestamp: '2026-01-25T14:45:22Z',
    action: 'UPDATE',
    userId: 'USR-002',
    userName: 'Sarah Johnson',
    userRole: 'Compliance Officer',
    entityType: 'incident',
    entityId: 'INC-2026-015',
    entityTitle: 'Slip hazard in warehouse',
    field: 'severity',
    oldValue: 'Medium',
    newValue: 'High',
    ipAddress: '192.168.1.105',
    hash: 'b8c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1'
  },
  {
    id: 'AUDIT-003',
    timestamp: '2026-01-25T15:10:33Z',
    action: 'SIGN',
    userId: 'USR-001',
    userName: 'John Smith',
    userRole: 'Safety Manager',
    entityType: 'incident',
    entityId: 'INC-2026-015',
    entityTitle: 'Slip hazard in warehouse',
    details: 'Digital signature applied - Reporter Signature',
    ipAddress: '192.168.1.100',
    hash: 'c9d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2'
  },
  {
    id: 'AUDIT-004',
    timestamp: '2026-01-25T15:22:45Z',
    action: 'APPROVE',
    userId: 'USR-003',
    userName: 'Mike Davis',
    userRole: 'EHS Director',
    entityType: 'incident',
    entityId: 'INC-2026-015',
    entityTitle: 'Slip hazard in warehouse',
    details: 'Investigation approved',
    ipAddress: '192.168.1.110',
    hash: 'd0e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3'
  },
  {
    id: 'AUDIT-005',
    timestamp: '2026-01-24T09:15:00Z',
    action: 'CREATE',
    userId: 'USR-004',
    userName: 'Emily Chen',
    userRole: 'Line Supervisor',
    entityType: 'injury',
    entityId: 'INJ-2026-008',
    entityTitle: 'Hand laceration from equipment',
    details: 'Injury report filed',
    ipAddress: '192.168.1.115',
    hash: 'e1f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4'
  },
  {
    id: 'AUDIT-006',
    timestamp: '2026-01-24T09:45:12Z',
    action: 'ATTACH',
    userId: 'USR-004',
    userName: 'Emily Chen',
    userRole: 'Line Supervisor',
    entityType: 'injury',
    entityId: 'INJ-2026-008',
    entityTitle: 'Hand laceration from equipment',
    details: 'Photo evidence attached (3 files)',
    ipAddress: '192.168.1.115',
    hash: 'f2a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5'
  },
  {
    id: 'AUDIT-007',
    timestamp: '2026-01-24T10:30:00Z',
    action: 'STATUS_CHANGE',
    userId: 'USR-002',
    userName: 'Sarah Johnson',
    userRole: 'Compliance Officer',
    entityType: 'injury',
    entityId: 'INJ-2026-008',
    entityTitle: 'Hand laceration from equipment',
    field: 'status',
    oldValue: 'Open',
    newValue: 'Investigating',
    ipAddress: '192.168.1.105',
    hash: 'a3b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6'
  },
  {
    id: 'AUDIT-008',
    timestamp: '2026-01-24T14:00:00Z',
    action: 'SIGN',
    userId: 'USR-005',
    userName: 'Robert Wilson',
    userRole: 'Medical Officer',
    entityType: 'injury',
    entityId: 'INJ-2026-008',
    entityTitle: 'Hand laceration from equipment',
    details: 'Medical assessment signature applied',
    ipAddress: '192.168.1.120',
    hash: 'b4c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7'
  },
  {
    id: 'AUDIT-009',
    timestamp: '2026-01-23T11:00:00Z',
    action: 'EXPORT',
    userId: 'USR-003',
    userName: 'Mike Davis',
    userRole: 'EHS Director',
    entityType: 'report',
    entityId: 'OSHA-300-JAN-2026',
    entityTitle: 'OSHA 300 Log Export',
    details: 'Monthly report exported to PDF',
    ipAddress: '192.168.1.110',
    hash: 'c5d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8'
  },
  {
    id: 'AUDIT-010',
    timestamp: '2026-01-22T16:30:00Z',
    action: 'ASSIGN',
    userId: 'USR-001',
    userName: 'John Smith',
    userRole: 'Safety Manager',
    entityType: 'incident',
    entityId: 'INC-2026-012',
    entityTitle: 'Chemical spill in lab',
    field: 'assignee',
    oldValue: 'Unassigned',
    newValue: 'Mike Davis',
    ipAddress: '192.168.1.100',
    hash: 'd6e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9'
  }
];

interface AuditTrailProps {
  entityFilter?: {
    type: string;
    id: string;
  };
  compact?: boolean;
}

export const AuditTrail: React.FC<AuditTrailProps> = ({ entityFilter, compact = false }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<AuditAction | 'all'>('all');
  const [selectedEntityType, setSelectedEntityType] = useState<string>('all');
  const [expandedEntry, setExpandedEntry] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [showFilters, setShowFilters] = useState(false);

  // Filter entries
  const filteredEntries = useMemo(() => {
    let entries = mockAuditEntries;

    // Apply entity filter if provided
    if (entityFilter) {
      entries = entries.filter(e => 
        e.entityType === entityFilter.type && e.entityId === entityFilter.id
      );
    }

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      entries = entries.filter(e => 
        e.userName.toLowerCase().includes(query) ||
        e.entityTitle?.toLowerCase().includes(query) ||
        e.entityId.toLowerCase().includes(query) ||
        e.details?.toLowerCase().includes(query)
      );
    }

    // Apply action filter
    if (selectedAction !== 'all') {
      entries = entries.filter(e => e.action === selectedAction);
    }

    // Apply entity type filter
    if (selectedEntityType !== 'all') {
      entries = entries.filter(e => e.entityType === selectedEntityType);
    }

    // Apply date range filter
    if (dateRange.from) {
      entries = entries.filter(e => new Date(e.timestamp) >= new Date(dateRange.from));
    }
    if (dateRange.to) {
      entries = entries.filter(e => new Date(e.timestamp) <= new Date(dateRange.to + 'T23:59:59'));
    }

    return entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [searchQuery, selectedAction, selectedEntityType, dateRange, entityFilter]);

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return <Plus className="w-4 h-4" />;
      case 'UPDATE': return <Edit3 className="w-4 h-4" />;
      case 'DELETE': return <Trash2 className="w-4 h-4" />;
      case 'VIEW': return <Eye className="w-4 h-4" />;
      case 'SUBMIT': return <Send className="w-4 h-4" />;
      case 'APPROVE': return <CheckCircle2 className="w-4 h-4" />;
      case 'REJECT': return <XCircle className="w-4 h-4" />;
      case 'SIGN': return <Fingerprint className="w-4 h-4" />;
      case 'EXPORT': return <Download className="w-4 h-4" />;
      case 'ASSIGN': return <User className="w-4 h-4" />;
      case 'COMMENT': return <FileText className="w-4 h-4" />;
      case 'ATTACH': return <FileText className="w-4 h-4" />;
      case 'STATUS_CHANGE': return <AlertTriangle className="w-4 h-4" />;
      default: return <History className="w-4 h-4" />;
    }
  };

  const getActionColor = (action: AuditAction) => {
    switch (action) {
      case 'CREATE': return 'bg-green-100 text-green-700 border-green-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-700 border-red-200';
      case 'VIEW': return 'bg-surface-100 text-surface-600 border-surface-200';
      case 'SUBMIT': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'APPROVE': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'REJECT': return 'bg-red-100 text-red-700 border-red-200';
      case 'SIGN': return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'EXPORT': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'ASSIGN': return 'bg-cyan-100 text-cyan-700 border-cyan-200';
      case 'COMMENT': return 'bg-violet-100 text-violet-700 border-violet-200';
      case 'ATTACH': return 'bg-pink-100 text-pink-700 border-pink-200';
      case 'STATUS_CHANGE': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-surface-100 text-surface-600 border-surface-200';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
  };

  const exportAuditLog = () => {
    const csv = [
      ['Timestamp', 'Action', 'User', 'Role', 'Entity Type', 'Entity ID', 'Entity Title', 'Field', 'Old Value', 'New Value', 'Details', 'IP Address', 'Hash'].join(','),
      ...filteredEntries.map(e => [
        e.timestamp,
        e.action,
        e.userName,
        e.userRole,
        e.entityType,
        e.entityId,
        e.entityTitle || '',
        e.field || '',
        e.oldValue || '',
        e.newValue || '',
        e.details || '',
        e.ipAddress || '',
        e.hash || ''
      ].map(v => `"${v}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-log-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const actions: AuditAction[] = ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'SUBMIT', 'APPROVE', 'REJECT', 'SIGN', 'EXPORT', 'ASSIGN', 'COMMENT', 'ATTACH', 'STATUS_CHANGE'];
  const entityTypes = ['incident', 'injury', 'jsa', 'report', 'capa'];

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-surface-800 flex items-center gap-2">
            <History className="w-5 h-5 text-brand-500" />
            Recent Activity
          </h4>
          <span className="text-xs text-surface-500">{filteredEntries.length} entries</span>
        </div>
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {filteredEntries.slice(0, 5).map(entry => {
            const { date, time } = formatTimestamp(entry.timestamp);
            return (
              <div key={entry.id} className="flex items-start gap-3 p-2 bg-surface-50 rounded-lg">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-surface-800 truncate">
                    <span className="font-medium">{entry.userName}</span> {entry.action.toLowerCase().replace('_', ' ')}
                  </p>
                  <p className="text-xs text-surface-500">{date} at {time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-brand-900 flex items-center gap-2">
            <Shield className="w-6 h-6 text-brand-500" />
            Audit Trail
          </h2>
          <p className="text-sm text-surface-500">Complete activity log with tamper-evident hashing</p>
        </div>
        <button
          onClick={exportAuditLog}
          className="px-4 py-2.5 bg-surface-100 text-surface-700 font-semibold rounded-xl hover:bg-surface-200 transition-colors flex items-center gap-2"
        >
          <Download className="w-5 h-5" />
          Export Log
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl p-4 border border-surface-100 shadow-soft space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search by user, entity, or details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-2 ${
              showFilters ? 'bg-brand-50 border-brand-200 text-brand-600' : 'bg-surface-50 border-surface-100 text-surface-600'
            }`}
          >
            <Filter className="w-5 h-5" />
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-3 border-t border-surface-100">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase">Action</label>
                  <select
                    value={selectedAction}
                    onChange={(e) => setSelectedAction(e.target.value as AuditAction | 'all')}
                    className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                  >
                    <option value="all">All Actions</option>
                    {actions.map(action => (
                      <option key={action} value={action}>{action.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase">Entity Type</label>
                  <select
                    value={selectedEntityType}
                    onChange={(e) => setSelectedEntityType(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                  >
                    <option value="all">All Types</option>
                    {entityTypes.map(type => (
                      <option key={type} value={type}>{type.charAt(0).toUpperCase() + type.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase">From Date</label>
                  <input
                    type="date"
                    value={dateRange.from}
                    onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-surface-400 uppercase">To Date</label>
                  <input
                    type="date"
                    value={dateRange.to}
                    onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between text-sm text-surface-500">
          <span>{filteredEntries.length} entries found</span>
          <div className="flex items-center gap-1">
            <Lock className="w-4 h-4" />
            <span>Tamper-evident logging enabled</span>
          </div>
        </div>
      </div>

      {/* Audit Entries */}
      <div className="space-y-3">
        {filteredEntries.map((entry, index) => {
          const { date, time } = formatTimestamp(entry.timestamp);
          const isExpanded = expandedEntry === entry.id;

          return (
            <motion.div
              key={entry.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
              className="bg-white rounded-xl border border-surface-100 shadow-soft overflow-hidden"
            >
              <button
                onClick={() => setExpandedEntry(isExpanded ? null : entry.id)}
                className="w-full p-4 flex items-start gap-4 text-left hover:bg-surface-50 transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 border ${getActionColor(entry.action)}`}>
                  {getActionIcon(entry.action)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full border ${getActionColor(entry.action)}`}>
                      {entry.action.replace('_', ' ')}
                    </span>
                    <span className="text-xs text-surface-400 font-mono">{entry.entityId}</span>
                  </div>
                  
                  <p className="text-sm text-surface-800">
                    <span className="font-semibold">{entry.userName}</span>
                    <span className="text-surface-500 mx-1">({entry.userRole})</span>
                    {entry.field && (
                      <>
                        changed <span className="font-medium">{entry.field}</span>
                        {entry.oldValue && entry.newValue && (
                          <>
                            {' '}from <span className="line-through text-surface-400">{entry.oldValue}</span>
                            {' '}to <span className="font-medium text-brand-600">{entry.newValue}</span>
                          </>
                        )}
                      </>
                    )}
                    {entry.details && !entry.field && (
                      <span className="text-surface-600"> - {entry.details}</span>
                    )}
                  </p>
                  
                  {entry.entityTitle && (
                    <p className="text-xs text-surface-500 mt-1 truncate">{entry.entityTitle}</p>
                  )}
                  
                  <div className="flex items-center gap-4 mt-2 text-xs text-surface-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {date}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {time}
                    </span>
                  </div>
                </div>
                
                <ChevronRight className={`w-5 h-5 text-surface-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
              </button>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 pt-2 border-t border-surface-100 bg-surface-50 space-y-3">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs font-bold text-surface-400 uppercase">Entity Type</p>
                          <p className="text-sm text-surface-700 capitalize">{entry.entityType}</p>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-surface-400 uppercase">User ID</p>
                          <p className="text-sm text-surface-700 font-mono">{entry.userId}</p>
                        </div>
                        {entry.ipAddress && (
                          <div>
                            <p className="text-xs font-bold text-surface-400 uppercase">IP Address</p>
                            <p className="text-sm text-surface-700 font-mono">{entry.ipAddress}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs font-bold text-surface-400 uppercase">Audit ID</p>
                          <p className="text-sm text-surface-700 font-mono">{entry.id}</p>
                        </div>
                      </div>
                      
                      {entry.hash && (
                        <div className="p-3 bg-white rounded-lg border border-surface-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Hash className="w-4 h-4 text-surface-400" />
                            <p className="text-xs font-bold text-surface-400 uppercase">Integrity Hash (SHA-256)</p>
                          </div>
                          <p className="text-xs text-surface-600 font-mono break-all">{entry.hash}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {filteredEntries.length === 0 && (
          <div className="text-center py-12 bg-surface-50 rounded-2xl">
            <History className="w-12 h-12 text-surface-300 mx-auto mb-4" />
            <p className="text-surface-500">No audit entries found</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

// Export function to log audit entries (would integrate with backend)
export const logAuditEntry = async (entry: Omit<AuditEntry, 'id' | 'timestamp' | 'hash'>): Promise<AuditEntry> => {
  const timestamp = new Date().toISOString();
  const id = `AUDIT-${Date.now()}`;
  
  // In production, this would generate a real SHA-256 hash
  const hash = btoa(JSON.stringify({ ...entry, timestamp, id })).slice(0, 40);
  
  const fullEntry: AuditEntry = {
    ...entry,
    id,
    timestamp,
    hash
  };
  
  // In production, this would send to backend
  console.log('Audit entry logged:', fullEntry);
  
  return fullEntry;
};

export default AuditTrail;
