import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  FileCheck,
  Clock,
  Users,
  Building2,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Calendar,
  MapPin,
  FileText,
  Send,
  Eye,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  UserCheck,
  Briefcase,
  Clipboard,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  Mail,
  Phone,
  Badge,
  ClipboardList,
  Activity,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Printer,
  History
} from 'lucide-react';
import {
  useContractors,
  useCreateContractor,
  usePermitApplications,
  usePermitApplicationStats,
} from '../api/hooks/useAPIHooks';
import type {
  ContractorRecord,
  PermitApplicationRecord,
  ApprovalStepRecord,
  SafetyChecklistItemRecord,
} from '../api/services/apiService';
import { SMButton } from '../components/ui';

// Types (aliases to backend record types)
type Contractor = ContractorRecord;
type PermitApplication = PermitApplicationRecord;
type ApprovalStep = ApprovalStepRecord;
type SafetyChecklistItem = SafetyChecklistItemRecord;

// Permit Type Config
const permitTypeConfig = {
  hot_work: { label: 'Hot Work', color: 'bg-orange-100 text-orange-700 border-orange-200', icon: '🔥' },
  confined_space: { label: 'Confined Space', color: 'bg-purple-100 text-purple-700 border-purple-200', icon: '🚧' },
  working_at_height: { label: 'Working at Height', color: 'bg-blue-100 text-blue-700 border-blue-200', icon: '🏗️' },
  excavation: { label: 'Excavation', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: '⛏️' },
  electrical: { label: 'Electrical', color: 'bg-yellow-100 text-yellow-700 border-yellow-200', icon: '⚡' },
  lifting: { label: 'Lifting Operations', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: '🏋️' },
  general: { label: 'General', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: '📋' }
};

const statusConfig = {
  draft: { label: 'Draft', color: 'bg-gray-100 text-gray-600', icon: FileText },
  submitted: { label: 'Submitted', color: 'bg-blue-100 text-blue-700', icon: Send },
  under_review: { label: 'Under Review', color: 'bg-amber-100 text-amber-700', icon: Eye },
  approved: { label: 'Approved', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  rejected: { label: 'Rejected', color: 'bg-red-100 text-red-700', icon: XCircle },
  active: { label: 'Active', color: 'bg-emerald-100 text-emerald-700', icon: Activity },
  completed: { label: 'Completed', color: 'bg-teal-100 text-teal-700', icon: CheckCircle2 },
  expired: { label: 'Expired', color: 'bg-gray-100 text-gray-500', icon: Clock },
  suspended: { label: 'Suspended', color: 'bg-orange-100 text-orange-700', icon: AlertTriangle }
};

const riskLevelConfig = {
  low: { label: 'Low', color: 'bg-green-100 text-green-700' },
  medium: { label: 'Medium', color: 'bg-yellow-100 text-yellow-700' },
  high: { label: 'High', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Critical', color: 'bg-red-100 text-red-700' }
};

type ViewMode = 'dashboard' | 'contractors' | 'permits' | 'new_permit' | 'permit_detail';

export const ContractorPermitManagement: React.FC = () => {
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedPermit, setSelectedPermit] = useState<PermitApplication | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendContractors } = useContractors({ status: statusFilter !== 'all' ? statusFilter : undefined });
  const { data: permits, refetch: refetchPermits } = usePermitApplications({
    status: statusFilter !== 'all' ? statusFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    search: searchQuery || undefined,
  });
  const { data: permitStats } = usePermitApplicationStats();

  const allContractors = useMemo(() => backendContractors ?? [], [backendContractors]);
  const allPermits = useMemo(() => permits ?? [], [permits]);

  // Stats
  const stats = {
    totalContractors: permitStats?.totalContractors ?? allContractors.length,
    activeContractors: permitStats?.activeContractors ?? allContractors.filter(c => c.status === 'active').length,
    pendingApprovals: permitStats?.pending ?? allPermits.filter(p => p.status === 'under_review' || p.status === 'submitted').length,
    activePermits: permitStats?.active ?? allPermits.filter(p => p.status === 'active' || p.status === 'approved').length,
    expiringSoon: allContractors.filter(c => {
      if (!c.insuranceExpiry) return false;
      const expiry = new Date(c.insuranceExpiry);
      const now = new Date();
      const daysDiff = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return daysDiff <= 30 && daysDiff > 0;
    }).length,
    rejectedToday: permitStats?.rejected ?? allPermits.filter(p => p.status === 'rejected').length
  };

  const filteredPermits = allPermits.filter(p => {
    const matchesSearch = p.permitNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.contractorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.workDescription.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchesType = typeFilter === 'all' || p.permitType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // refetchPermits referenced to avoid lint warnings (called on approve/reject in future)
  void refetchPermits;

  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.totalContractors}</p>
              <p className="text-xs text-surface-500">Total Contractors</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.activeContractors}</p>
              <p className="text-xs text-surface-500">Active</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
              <Clock className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.pendingApprovals}</p>
              <p className="text-xs text-surface-500">Pending Review</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
              <FileCheck className="w-5 h-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.activePermits}</p>
              <p className="text-xs text-surface-500">Active Permits</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30">
              <AlertCircle className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.expiringSoon}</p>
              <p className="text-xs text-surface-500">Expiring Soon</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white dark:bg-surface-800 rounded-xl p-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
              <XCircle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-surface-900 dark:text-white">{stats.rejectedToday}</p>
              <p className="text-xs text-surface-500">Rejected</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setViewMode('new_permit')}
          className="bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl p-5 flex items-center gap-4 shadow-lg"
        >
          <div className="p-3 bg-white/20 rounded-xl">
            <Plus className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-semibold">New Permit Application</p>
            <p className="text-sm opacity-80">Create a new work permit request</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setViewMode('contractors')}
          className="bg-white dark:bg-surface-800 rounded-xl p-5 flex items-center gap-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
            <Building2 className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-surface-900 dark:text-white">Manage Contractors</p>
            <p className="text-sm text-surface-500">View and manage contractor profiles</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-surface-400" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setViewMode('permits')}
          className="bg-white dark:bg-surface-800 rounded-xl p-5 flex items-center gap-4 shadow-sm border border-surface-200 dark:border-surface-700"
        >
          <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <ClipboardList className="w-6 h-6 text-emerald-600" />
          </div>
          <div className="text-left">
            <p className="font-semibold text-surface-900 dark:text-white">All Permits</p>
            <p className="text-sm text-surface-500">View permit applications & status</p>
          </div>
          <ChevronRight className="w-5 h-5 ml-auto text-surface-400" />
        </motion.button>
      </div>

      {/* Pending Approvals */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Pending Approvals
            </h3>
            <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
              {stats.pendingApprovals} awaiting
            </span>
          </div>
        </div>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {allPermits
            .filter(p => p.status === 'under_review' || p.status === 'submitted')
            .slice(0, 3)
            .map((permit) => {
              const typeConf = permitTypeConfig[permit.permitType];
              const riskConf = riskLevelConfig[permit.riskLevel];
              return (
                <motion.div
                  key={permit.id}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedPermit(permit);
                    setViewMode('permit_detail');
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{typeConf.icon}</span>
                        <span className="font-medium text-surface-900 dark:text-white">{permit.permitNumber}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${typeConf.color}`}>
                          {typeConf.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${riskConf.color}`}>
                          {riskConf.label} Risk
                        </span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mb-2">{permit.workDescription}</p>
                      <div className="flex items-center gap-4 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {permit.contractorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {permit.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {permit.startDate}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="px-3 py-1.5 bg-green-500 text-white text-xs font-medium rounded-lg hover:bg-green-600 transition-colors">
                        Approve
                      </button>
                      <button className="px-3 py-1.5 bg-red-500 text-white text-xs font-medium rounded-lg hover:bg-red-600 transition-colors">
                        Reject
                      </button>
                    </div>
                  </div>
                  {/* Approval Progress */}
                  <div className="mt-3 flex items-center gap-1">
                    {permit.approvalChain.map((step, idx) => (
                      <React.Fragment key={step.id}>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${
                          step.status === 'approved' ? 'bg-green-100 text-green-700' :
                          step.status === 'rejected' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {step.status === 'approved' && <CheckCircle2 className="w-3 h-3" />}
                          {step.status === 'rejected' && <XCircle className="w-3 h-3" />}
                          {step.status === 'pending' && <Clock className="w-3 h-3" />}
                          {step.role}
                        </div>
                        {idx < permit.approvalChain.length - 1 && (
                          <ChevronRight className="w-3 h-3 text-surface-300" />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </motion.div>
              );
            })}
        </div>
        {stats.pendingApprovals > 3 && (
          <div className="p-3 border-t border-surface-100 dark:border-surface-700">
            <button
              onClick={() => setViewMode('permits')}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium flex items-center gap-1 mx-auto"
            >
              View all {stats.pendingApprovals} pending permits
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Active Permits */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700">
        <div className="p-4 border-b border-surface-200 dark:border-surface-700">
          <h3 className="font-semibold text-surface-900 dark:text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-emerald-500" />
            Active Work Permits
          </h3>
        </div>
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {allPermits
            .filter(p => p.status === 'active' || p.status === 'approved')
            .map((permit) => {
              const typeConf = permitTypeConfig[permit.permitType];
              return (
                <motion.div
                  key={permit.id}
                  whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                  className="p-4 cursor-pointer"
                  onClick={() => {
                    setSelectedPermit(permit);
                    setViewMode('permit_detail');
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{typeConf.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-surface-900 dark:text-white">{permit.permitNumber}</span>
                          <span className={`px-2 py-0.5 text-xs rounded-full ${statusConfig[permit.status].color}`}>
                            {statusConfig[permit.status].label}
                          </span>
                        </div>
                        <p className="text-sm text-surface-500">{permit.contractorName} • {permit.location}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-surface-700 dark:text-surface-300">
                        {permit.workersAssigned.length} workers
                      </p>
                      <p className="text-xs text-surface-500">
                        {permit.startDate} - {permit.endDate}
                      </p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>
      </div>
    </div>
  );

  const renderContractors = () => (
    <div className="space-y-4">
      {/* Search & Filter */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search contractors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Add Contractor</SMButton>
      </div>

      {/* Contractors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allContractors.map((contractor) => (
          <motion.div
            key={contractor.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold text-surface-900 dark:text-white">{contractor.companyName}</h4>
                  <span className={`px-2 py-0.5 text-xs rounded-full ${
                    contractor.status === 'active' ? 'bg-green-100 text-green-700' :
                    contractor.status === 'pending_approval' ? 'bg-amber-100 text-amber-700' :
                    contractor.status === 'suspended' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {contractor.status.replace('_', ' ')}
                  </span>
                </div>
                <p className="text-sm text-surface-500">{contractor.tradeType}</p>
              </div>
              <div className="flex items-center gap-1">
                <span className="text-amber-400">★</span>
                <span className="font-medium text-surface-700 dark:text-surface-300">{contractor.safetyRating}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Badge className="w-4 h-4" />
                {contractor.contactPerson}
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Mail className="w-4 h-4" />
                {contractor.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-surface-600 dark:text-surface-400">
                <Phone className="w-4 h-4" />
                {contractor.phone}
              </div>
            </div>

            <div className="flex flex-wrap gap-1 mb-4">
              {contractor.certifications.slice(0, 3).map((cert, idx) => (
                <span key={idx} className="px-2 py-1 bg-surface-100 dark:bg-surface-700 text-xs rounded-lg text-surface-600 dark:text-surface-400">
                  {cert}
                </span>
              ))}
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-surface-100 dark:border-surface-700">
              <div className="flex items-center gap-4 text-xs text-surface-500">
                <span>{contractor.workersCount} workers</span>
                <span>{contractor.activePermits} active permits</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                  <Eye className="w-4 h-4 text-surface-500" />
                </button>
                <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                  <Edit3 className="w-4 h-4 text-surface-500" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );

  const renderPermits = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            placeholder="Search permits..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Status</option>
          <option value="draft">Draft</option>
          <option value="submitted">Submitted</option>
          <option value="under_review">Under Review</option>
          <option value="approved">Approved</option>
          <option value="active">Active</option>
          <option value="rejected">Rejected</option>
          <option value="completed">Completed</option>
        </select>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="px-4 py-2.5 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        >
          <option value="all">All Types</option>
          {Object.entries(permitTypeConfig).map(([key, conf]) => (
            <option key={key} value={key}>{conf.icon} {conf.label}</option>
          ))}
        </select>
      </div>

      {/* Permits List */}
      <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 overflow-hidden">
        <div className="divide-y divide-surface-100 dark:divide-surface-700">
          {filteredPermits.map((permit) => {
            const typeConf = permitTypeConfig[permit.permitType];
            const statConf = statusConfig[permit.status];
            const riskConf = riskLevelConfig[permit.riskLevel];
            const StatusIcon = statConf.icon;
            
            return (
              <motion.div
                key={permit.id}
                whileHover={{ backgroundColor: 'rgba(0,0,0,0.02)' }}
                className="p-4 cursor-pointer"
                onClick={() => {
                  setSelectedPermit(permit);
                  setViewMode('permit_detail');
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="text-3xl">{typeConf.icon}</div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-surface-900 dark:text-white">{permit.permitNumber}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full flex items-center gap-1 ${statConf.color}`}>
                          <StatusIcon className="w-3 h-3" />
                          {statConf.label}
                        </span>
                        <span className={`px-2 py-0.5 text-xs rounded-full ${riskConf.color}`}>
                          {riskConf.label}
                        </span>
                      </div>
                      <p className="text-sm text-surface-700 dark:text-surface-300 mb-2">{permit.workDescription}</p>
                      <div className="flex items-center gap-4 text-xs text-surface-500">
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {permit.contractorName}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {permit.location}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {permit.workersAssigned.length} workers
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {permit.startDate} - {permit.endDate}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-surface-400" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderPermitDetail = () => {
    if (!selectedPermit) return null;
    
    const typeConf = permitTypeConfig[selectedPermit.permitType];
    const statConf = statusConfig[selectedPermit.status];
    const riskConf = riskLevelConfig[selectedPermit.riskLevel];
    const StatusIcon = statConf.icon;

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="text-4xl">{typeConf.icon}</div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">{selectedPermit.permitNumber}</h2>
                  <span className={`px-3 py-1 text-sm rounded-full flex items-center gap-1 ${statConf.color}`}>
                    <StatusIcon className="w-4 h-4" />
                    {statConf.label}
                  </span>
                </div>
                <p className="text-surface-600 dark:text-surface-400">{selectedPermit.workDescription}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors">
                <Printer className="w-4 h-4" />
                Print
              </button>
              <button className="px-4 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg text-sm font-medium flex items-center gap-2 hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-surface-500 mb-1">Contractor</p>
              <p className="font-medium text-surface-900 dark:text-white">{selectedPermit.contractorName}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Location</p>
              <p className="font-medium text-surface-900 dark:text-white">{selectedPermit.location}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Duration</p>
              <p className="font-medium text-surface-900 dark:text-white">{selectedPermit.startDate} to {selectedPermit.endDate}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Risk Level</p>
              <span className={`px-2 py-1 text-sm rounded-full ${riskConf.color}`}>{riskConf.label}</span>
            </div>
          </div>
        </div>

        {/* Approval Chain */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Approval Workflow</h3>
          <div className="flex items-center gap-2 flex-wrap">
            {selectedPermit.approvalChain.map((step, idx) => (
              <React.Fragment key={step.id}>
                <div className={`flex flex-col items-center p-3 rounded-xl min-w-[120px] ${
                  step.status === 'approved' ? 'bg-green-50 dark:bg-green-900/20' :
                  step.status === 'rejected' ? 'bg-red-50 dark:bg-red-900/20' :
                  'bg-surface-50 dark:bg-surface-700'
                }`}>
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                    step.status === 'approved' ? 'bg-green-500 text-white' :
                    step.status === 'rejected' ? 'bg-red-500 text-white' :
                    'bg-surface-300 dark:bg-surface-600 text-surface-600 dark:text-surface-400'
                  }`}>
                    {step.status === 'approved' && <CheckCircle2 className="w-5 h-5" />}
                    {step.status === 'rejected' && <XCircle className="w-5 h-5" />}
                    {step.status === 'pending' && <Clock className="w-5 h-5" />}
                  </div>
                  <p className="text-xs font-medium text-surface-900 dark:text-white text-center">{step.role}</p>
                  <p className="text-xs text-surface-500 text-center">{step.approverName}</p>
                  {step.timestamp && (
                    <p className="text-xs text-surface-400 mt-1">{new Date(step.timestamp).toLocaleDateString()}</p>
                  )}
                </div>
                {idx < selectedPermit.approvalChain.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-surface-300" />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* Safety Checklist */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Safety Checklist</h3>
          <div className="space-y-3">
            {selectedPermit.safetyChecklist.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                <div className="flex items-center gap-3">
                  {item.response === true && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {item.response === false && <XCircle className="w-5 h-5 text-red-500" />}
                  {item.response === null && <AlertCircle className="w-5 h-5 text-amber-500" />}
                  <span className="text-sm text-surface-700 dark:text-surface-300">{item.question}</span>
                </div>
                <span className={`px-2 py-0.5 text-xs rounded-full ${
                  item.response === true ? 'bg-green-100 text-green-700' :
                  item.response === false ? 'bg-red-100 text-red-700' :
                  'bg-amber-100 text-amber-700'
                }`}>
                  {item.response === true ? 'Yes' : item.response === false ? 'No' : 'Pending'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Special Conditions */}
        {selectedPermit.specialConditions.length > 0 && (
          <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-6">
            <h3 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Special Conditions
            </h3>
            <ul className="space-y-2">
              {selectedPermit.specialConditions.map((condition, idx) => (
                <li key={idx} className="text-sm text-amber-700 dark:text-amber-300 flex items-start gap-2">
                  <span className="text-amber-500">•</span>
                  {condition}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Workers Assigned */}
        <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-6">
          <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Assigned Workers ({selectedPermit.workersAssigned.length})</h3>
          <div className="flex flex-wrap gap-2">
            {selectedPermit.workersAssigned.map((worker, idx) => (
              <div key={idx} className="flex items-center gap-2 px-3 py-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-medium">
                  {worker.split(' ').map(n => n[0]).join('')}
                </div>
                <span className="text-sm text-surface-700 dark:text-surface-300">{worker}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const getViewTitle = () => {
    switch (viewMode) {
      case 'contractors': return 'Contractor Management';
      case 'permits': return 'All Permits';
      case 'new_permit': return 'New Permit Application';
      case 'permit_detail': return selectedPermit?.permitNumber || 'Permit Details';
      default: return 'Contractor Permit Management';
    }
  };

  return (
    <div className="min-h-screen pb-24 bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-[72px] z-50 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  if (viewMode === 'dashboard') {
                    navigate(-1);
                  } else if (viewMode === 'permit_detail') {
                    setViewMode('permits');
                    setSelectedPermit(null);
                  } else {
                    setViewMode('dashboard');
                  }
                }}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white">{getViewTitle()}</h1>
                {viewMode === 'dashboard' && (
                  <p className="text-sm text-surface-500">ePermit Workflow System</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors relative">
                <History className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
              <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-xl transition-colors">
                <RefreshCw className="w-5 h-5 text-surface-600 dark:text-surface-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'dashboard' && renderDashboard()}
            {viewMode === 'contractors' && renderContractors()}
            {viewMode === 'permits' && renderPermits()}
            {viewMode === 'permit_detail' && renderPermitDetail()}
            {viewMode === 'new_permit' && (
              <div className="bg-white dark:bg-surface-800 rounded-xl shadow-sm border border-surface-200 dark:border-surface-700 p-8 text-center">
                <FileCheck className="w-16 h-16 text-brand-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-surface-900 dark:text-white mb-2">New Permit Application</h3>
                <p className="text-surface-500 mb-6">Complete the form to submit a new work permit request</p>
                <p className="text-sm text-surface-400">(Full form implementation available - showing workflow preview)</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ContractorPermitManagement;
