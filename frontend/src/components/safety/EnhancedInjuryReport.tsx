import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Heart,
  Shield,
  AlertTriangle,
  User,
  MapPin,
  Calendar,
  Clock,
  FileText,
  Camera,
  Mic,
  MessageSquare,
  CheckCircle2,
  XCircle,
  ChevronRight,
  ChevronDown,
  Plus,
  Download,
  Printer,
  Send,
  Edit3,
  Eye,
  Activity,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Brain,
  Sparkles,
  Lightbulb,
  Target,
  Stethoscope,
  ThermometerSun,
  Pill,
  Ambulance,
  BadgeAlert,
  Clipboard,
  ClipboardList,
  FileSearch,
  Scale,
  Timer,
  RefreshCw,
  History,
  Users,
  Building2,
  Phone,
  Mail
} from 'lucide-react';
import { exportToPDF, ReportTemplates } from '../../utils/exports/compliancePdfExport';
import { SMButton, SMInput, SMSelect, SMCard, SMBadge } from '../ui';

const MotionSMCard = motion(SMCard);

// Types
interface InjuryCase {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeDepartment: string;
  employeeJobTitle: string;
  supervisorName: string;
  injuryDate: string;
  injuryTime: string;
  reportedDate: string;
  location: string;
  injuryType: InjuryType;
  bodyParts: BodyPart[];
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  description: string;
  immediateActions: string;
  witnesses: Witness[];
  rootCause: string;
  correctiveActions: CorrectiveAction[];
  treatmentType: 'first_aid' | 'medical_treatment' | 'hospitalization' | 'none';
  daysLost: number;
  restrictedDutyDays: number;
  oshaRecordable: boolean;
  status: 'reported' | 'under_review' | 'investigating' | 'capa_pending' | 'closed';
  attachments: Attachment[];
  aiAnalysis?: AIAnalysis;
  timeline: TimelineEvent[];
}

interface BodyPart {
  id: string;
  name: string;
  side?: 'left' | 'right' | 'both' | 'n/a';
}

interface InjuryType {
  id: string;
  name: string;
  category: string;
}

interface Witness {
  id: string;
  name: string;
  contact: string;
  statement?: string;
}

interface CorrectiveAction {
  id: string;
  description: string;
  assignee: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  completedDate?: string;
}

interface Attachment {
  id: string;
  type: 'photo' | 'document' | 'video' | 'audio';
  name: string;
  url: string;
  uploadedAt: string;
}

interface AIAnalysis {
  riskScore: number;
  patterns: string[];
  recommendations: string[];
  similarCases: { id: string; similarity: number; summary: string }[];
  predictedRecoveryDays: number;
  preventionSuggestions: string[];
}

interface TimelineEvent {
  id: string;
  date: string;
  type: 'created' | 'updated' | 'status_change' | 'comment' | 'action' | 'review';
  title: string;
  description: string;
  user: string;
}

// Mock data
const injuryTypes: InjuryType[] = [
  { id: 'cut', name: 'Cut/Laceration', category: 'Wound' },
  { id: 'sprain', name: 'Sprain/Strain', category: 'Musculoskeletal' },
  { id: 'fracture', name: 'Fracture', category: 'Bone' },
  { id: 'burn', name: 'Burn', category: 'Thermal' },
  { id: 'contusion', name: 'Bruise/Contusion', category: 'Soft Tissue' },
  { id: 'eye', name: 'Eye Injury', category: 'Ocular' },
  { id: 'hearing', name: 'Hearing Loss', category: 'Auditory' },
  { id: 'respiratory', name: 'Respiratory', category: 'Inhalation' },
  { id: 'chemical', name: 'Chemical Exposure', category: 'Toxic' },
  { id: 'ergonomic', name: 'Repetitive Strain', category: 'Ergonomic' },
];

const bodyParts: BodyPart[] = [
  { id: 'head', name: 'Head', side: 'n/a' },
  { id: 'neck', name: 'Neck', side: 'n/a' },
  { id: 'shoulder', name: 'Shoulder' },
  { id: 'arm', name: 'Upper Arm' },
  { id: 'elbow', name: 'Elbow' },
  { id: 'forearm', name: 'Forearm' },
  { id: 'wrist', name: 'Wrist' },
  { id: 'hand', name: 'Hand' },
  { id: 'finger', name: 'Finger(s)' },
  { id: 'chest', name: 'Chest', side: 'n/a' },
  { id: 'back-upper', name: 'Upper Back', side: 'n/a' },
  { id: 'back-lower', name: 'Lower Back', side: 'n/a' },
  { id: 'hip', name: 'Hip' },
  { id: 'thigh', name: 'Thigh' },
  { id: 'knee', name: 'Knee' },
  { id: 'leg', name: 'Lower Leg' },
  { id: 'ankle', name: 'Ankle' },
  { id: 'foot', name: 'Foot' },
  { id: 'toe', name: 'Toe(s)' },
];

const mockInjuryCases: InjuryCase[] = [
  {
    id: 'INJ-2026-001',
    employeeId: 'EMP-1234',
    employeeName: 'John Martinez',
    employeeDepartment: 'Manufacturing',
    employeeJobTitle: 'Machine Operator',
    supervisorName: 'Sarah Thompson',
    injuryDate: '2026-02-04',
    injuryTime: '14:30',
    reportedDate: '2026-02-04',
    location: 'Production Floor B - Station 7',
    injuryType: { id: 'cut', name: 'Cut/Laceration', category: 'Wound' },
    bodyParts: [{ id: 'hand', name: 'Hand', side: 'right' }, { id: 'finger', name: 'Finger(s)', side: 'right' }],
    severity: 'moderate',
    description: 'Employee was removing debris from the conveyor belt when hand came into contact with an exposed metal edge, causing a 3-inch laceration on the palm and two fingers.',
    immediateActions: 'First aid administered on site. Wound cleaned and bandaged. Employee sent to occupational health clinic for evaluation and sutures.',
    witnesses: [
      { id: 'W1', name: 'Mike Chen', contact: 'mike.chen@company.com', statement: 'I saw John reaching into the conveyor area when he suddenly pulled back and his hand was bleeding.' },
      { id: 'W2', name: 'Lisa Wong', contact: 'lisa.wong@company.com' }
    ],
    rootCause: 'Exposed sharp metal edge on conveyor guard. Guard had been removed for maintenance and not properly replaced.',
    correctiveActions: [
      { id: 'CA1', description: 'Replace and secure conveyor guard immediately', assignee: 'Maintenance Team', dueDate: '2026-02-05', status: 'completed', completedDate: '2026-02-05' },
      { id: 'CA2', description: 'Conduct inspection of all conveyor guards in facility', assignee: 'Safety Team', dueDate: '2026-02-10', status: 'in_progress' },
      { id: 'CA3', description: 'Implement LOTO verification checklist for maintenance', assignee: 'Safety Manager', dueDate: '2026-02-15', status: 'pending' },
      { id: 'CA4', description: 'Retrain all maintenance staff on guard replacement procedures', assignee: 'Training Dept', dueDate: '2026-02-20', status: 'pending' }
    ],
    treatmentType: 'medical_treatment',
    daysLost: 2,
    restrictedDutyDays: 5,
    oshaRecordable: true,
    status: 'investigating',
    attachments: [
      { id: 'A1', type: 'photo', name: 'injury_photo_1.jpg', url: '/attachments/injury_photo_1.jpg', uploadedAt: '2026-02-04T14:45:00' },
      { id: 'A2', type: 'photo', name: 'conveyor_area.jpg', url: '/attachments/conveyor_area.jpg', uploadedAt: '2026-02-04T15:00:00' }
    ],
    aiAnalysis: {
      riskScore: 72,
      patterns: [
        'Similar incidents occurred in conveyor areas 3 times in past 12 months',
        'Hand injuries are 40% more common in manufacturing department',
        'Tuesday afternoon shifts show higher incident rates'
      ],
      recommendations: [
        'Install guard interlock sensors that prevent operation when guards are removed',
        'Add visual indicators (lights) showing guard status',
        'Consider cut-resistant gloves for conveyor area work'
      ],
      similarCases: [
        { id: 'INJ-2025-089', similarity: 87, summary: 'Hand laceration from conveyor belt - Warehouse' },
        { id: 'INJ-2025-056', similarity: 72, summary: 'Finger cut from machinery - Production' }
      ],
      predictedRecoveryDays: 14,
      preventionSuggestions: [
        'Implement engineering controls to eliminate hazard',
        'Review and update machine guarding standards',
        'Add cut-resistant PPE requirements for high-risk areas'
      ]
    },
    timeline: [
      { id: 'T1', date: '2026-02-04T14:30:00', type: 'created', title: 'Injury Reported', description: 'Initial injury report created', user: 'John Martinez' },
      { id: 'T2', date: '2026-02-04T14:45:00', type: 'action', title: 'First Aid Administered', description: 'Wound cleaned and bandaged on site', user: 'First Aid Team' },
      { id: 'T3', date: '2026-02-04T15:30:00', type: 'status_change', title: 'Status Changed to Under Review', description: 'Case assigned to Safety Team for review', user: 'System' },
      { id: 'T4', date: '2026-02-05T09:00:00', type: 'status_change', title: 'Investigation Started', description: 'Root cause investigation initiated', user: 'Sarah Thompson' },
      { id: 'T5', date: '2026-02-05T11:00:00', type: 'action', title: 'Corrective Action Completed', description: 'Conveyor guard replaced and secured', user: 'Maintenance Team' }
    ]
  },
  {
    id: 'INJ-2026-002',
    employeeId: 'EMP-2567',
    employeeName: 'Emily Rodriguez',
    employeeDepartment: 'Warehouse',
    employeeJobTitle: 'Forklift Operator',
    supervisorName: 'Tom Anderson',
    injuryDate: '2026-02-03',
    injuryTime: '09:15',
    reportedDate: '2026-02-03',
    location: 'Warehouse C - Aisle 12',
    injuryType: { id: 'sprain', name: 'Sprain/Strain', category: 'Musculoskeletal' },
    bodyParts: [{ id: 'back-lower', name: 'Lower Back', side: 'n/a' }],
    severity: 'moderate',
    description: 'Employee was manually lifting a box that had fallen from a pallet. Box was heavier than expected (approximately 50 lbs). Employee felt immediate pain in lower back.',
    immediateActions: 'Ice pack applied. Employee advised to rest. Sent home with instructions to see doctor if pain persists.',
    witnesses: [],
    rootCause: 'Improper lifting technique combined with unexpected weight. No weight labels on boxes.',
    correctiveActions: [
      { id: 'CA1', description: 'Add weight labels to all boxes over 25 lbs', assignee: 'Shipping Dept', dueDate: '2026-02-15', status: 'pending' },
      { id: 'CA2', description: 'Provide lifting aids in warehouse aisles', assignee: 'Operations', dueDate: '2026-02-28', status: 'pending' }
    ],
    treatmentType: 'first_aid',
    daysLost: 0,
    restrictedDutyDays: 3,
    oshaRecordable: false,
    status: 'capa_pending',
    attachments: [],
    timeline: [
      { id: 'T1', date: '2026-02-03T09:15:00', type: 'created', title: 'Injury Reported', description: 'Lower back strain reported', user: 'Emily Rodriguez' },
      { id: 'T2', date: '2026-02-03T10:00:00', type: 'review', title: 'Supervisor Review', description: 'Case reviewed by supervisor', user: 'Tom Anderson' }
    ]
  }
];

// Severity config
const severityConfig = {
  minor:    { color: 'bg-green-100 text-green-700 border-green-200',  label: 'Minor',    badgeVariant: 'success' as const },
  moderate: { color: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Moderate', badgeVariant: 'warning' as const },
  severe:   { color: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Severe', badgeVariant: 'warning' as const },
  critical: { color: 'bg-red-100 text-red-700 border-red-200',       label: 'Critical', badgeVariant: 'danger'  as const }
};

const statusConfig = {
  reported:      { color: 'bg-blue-100 text-blue-700',   label: 'Reported',     icon: FileText,   badgeVariant: 'teal'    as const },
  under_review:  { color: 'bg-purple-100 text-purple-700', label: 'Under Review', icon: Eye,        badgeVariant: 'neutral' as const },
  investigating: { color: 'bg-amber-100 text-amber-700', label: 'Investigating', icon: FileSearch, badgeVariant: 'warning' as const },
  capa_pending:  { color: 'bg-orange-100 text-orange-700', label: 'CAPA Pending', icon: Target,    badgeVariant: 'warning' as const },
  closed:        { color: 'bg-green-100 text-green-700', label: 'Closed',        icon: CheckCircle2, badgeVariant: 'success' as const }
};

const treatmentConfig = {
  none: { label: 'No Treatment Required', icon: CheckCircle2, color: 'text-green-600' },
  first_aid: { label: 'First Aid Only', icon: Clipboard, color: 'text-blue-600' },
  medical_treatment: { label: 'Medical Treatment', icon: Stethoscope, color: 'text-amber-600' },
  hospitalization: { label: 'Hospitalization', icon: Ambulance, color: 'text-red-600' }
};

type ViewMode = 'list' | 'detail' | 'new';

export const EnhancedInjuryReport: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedCase, setSelectedCase] = useState<InjuryCase | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'capa' | 'ai'>('details');

  // Filter cases
  const filteredCases = useMemo(() => {
    return mockInjuryCases.filter(c => {
      const matchesStatus = filterStatus === 'all' || c.status === filterStatus;
      const matchesSeverity = filterSeverity === 'all' || c.severity === filterSeverity;
      const matchesSearch = c.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.location.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSeverity && matchesSearch;
    });
  }, [filterStatus, filterSeverity, searchQuery]);

  // Stats
  const stats = useMemo(() => ({
    total: mockInjuryCases.length,
    open: mockInjuryCases.filter(c => c.status !== 'closed').length,
    oshaRecordable: mockInjuryCases.filter(c => c.oshaRecordable).length,
    daysLost: mockInjuryCases.reduce((sum, c) => sum + c.daysLost, 0),
    avgRecovery: Math.round(mockInjuryCases.reduce((sum, c) => sum + (c.aiAnalysis?.predictedRecoveryDays || 0), 0) / mockInjuryCases.length)
  }), []);

  // Export to PDF
  const handleExportPDF = (injuryCase: InjuryCase) => {
    const config = ReportTemplates.injuryReport({
      organization: 'SafetyFirst Industries',
      injuryId: injuryCase.id,
      employeeName: injuryCase.employeeName,
      injuryDate: injuryCase.injuryDate,
      injuryType: injuryCase.injuryType.name,
      bodyParts: injuryCase.bodyParts.map(bp => `${bp.name}${bp.side && bp.side !== 'n/a' ? ` (${bp.side})` : ''}`),
      description: injuryCase.description,
      treatment: treatmentConfig[injuryCase.treatmentType].label,
      witnesses: injuryCase.witnesses.map(w => w.name),
      rootCause: injuryCase.rootCause,
      correctiveActions: injuryCase.correctiveActions.map(ca => ca.description)
    });
    exportToPDF(config, `${injuryCase.id}_injury_report.pdf`);
  };

  const renderList = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total Cases', value: stats.total, icon: Heart, color: 'bg-red-500' },
          { label: 'Open Cases', value: stats.open, icon: AlertTriangle, color: 'bg-amber-500' },
          { label: 'OSHA Recordable', value: stats.oshaRecordable, icon: ClipboardList, color: 'bg-purple-500' },
          { label: 'Days Lost (YTD)', value: stats.daysLost, icon: Calendar, color: 'bg-blue-500' },
          { label: 'Avg Recovery', value: `${stats.avgRecovery}d`, icon: Activity, color: 'bg-green-500' }
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <SMCard key={stat.label} className="p-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-surface-900 dark:text-white">{stat.value}</p>
                  <p className="text-xs text-surface-500">{stat.label}</p>
                </div>
              </div>
            </SMCard>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <SMInput
          type="text"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 min-w-[200px]"
        />
        <SMSelect
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          options={[
            { value: 'all', label: 'All Status' },
            ...Object.entries(statusConfig).map(([key, conf]) => ({ value: key, label: conf.label }))
          ]}
        />
        <SMSelect
          value={filterSeverity}
          onChange={(e) => setFilterSeverity(e.target.value)}
          options={[
            { value: 'all', label: 'All Severity' },
            ...Object.entries(severityConfig).map(([key, conf]) => ({ value: key, label: conf.label }))
          ]}
        />
        <SMButton
          onClick={() => setViewMode('new')}
          variant="danger"
          leftIcon={<Plus className="w-4 h-4" />}
        >
          New Case
        </SMButton>
      </div>

      {/* Case List */}
      <div className="space-y-3">
        {filteredCases.map((injuryCase) => {
          const sevConf = severityConfig[injuryCase.severity];
          const statConf = statusConfig[injuryCase.status];
          const treatConf = treatmentConfig[injuryCase.treatmentType];
          const StatusIcon = statConf.icon;
          
          return (
            <MotionSMCard
              key={injuryCase.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                setSelectedCase(injuryCase);
                setViewMode('detail');
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-xl">
                    <Heart className="w-6 h-6 text-red-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-surface-900 dark:text-white">{injuryCase.id}</h3>
                      <SMBadge size="sm" variant={sevConf.badgeVariant}>{sevConf.label}</SMBadge>
                      <SMBadge size="sm" variant={statConf.badgeVariant} icon={<StatusIcon className="w-3 h-3" />}>{statConf.label}</SMBadge>
                      {injuryCase.oshaRecordable && (
                        <SMBadge size="sm" variant="neutral">OSHA</SMBadge>
                      )}
                    </div>
                    <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">
                      {injuryCase.injuryType.name} - {injuryCase.bodyParts.map(bp => bp.name).join(', ')}
                    </p>
                  </div>
                </div>
                {injuryCase.aiAnalysis && (
                  <div className="flex items-center gap-2">
                    <SMBadge size="sm" variant={
                      injuryCase.aiAnalysis.riskScore >= 70 ? 'danger' :
                      injuryCase.aiAnalysis.riskScore >= 40 ? 'warning' :
                      'success'
                    } icon={<Brain className="w-3 h-3" />}>
                      Risk: {injuryCase.aiAnalysis.riskScore}%
                    </SMBadge>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <User className="w-4 h-4" />
                  <span>{injuryCase.employeeName}</span>
                </div>
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{injuryCase.location}</span>
                </div>
                <div className="flex items-center gap-2 text-surface-600 dark:text-surface-400">
                  <Calendar className="w-4 h-4" />
                  <span>{injuryCase.injuryDate}</span>
                </div>
                <div className={`flex items-center gap-2 ${treatConf.color}`}>
                  {React.createElement(treatConf.icon, { className: 'w-4 h-4' })}
                  <span>{treatConf.label}</span>
                </div>
              </div>

              {injuryCase.correctiveActions.length > 0 && (
                <div className="mt-3 pt-3 border-t border-surface-100 dark:border-surface-700">
                  <div className="flex items-center gap-4 text-xs">
                    <span className="text-surface-500">Corrective Actions:</span>
                    <span className="text-green-600">{injuryCase.correctiveActions.filter(ca => ca.status === 'completed').length} Completed</span>
                    <span className="text-amber-600">{injuryCase.correctiveActions.filter(ca => ca.status === 'in_progress').length} In Progress</span>
                    <span className="text-surface-500">{injuryCase.correctiveActions.filter(ca => ca.status === 'pending').length} Pending</span>
                  </div>
                </div>
              )}
            </MotionSMCard>
          );
        })}
      </div>
    </div>
  );

  const renderDetail = () => {
    if (!selectedCase) return null;

    const sevConf = severityConfig[selectedCase.severity];
    const statConf = statusConfig[selectedCase.status];
    const treatConf = treatmentConfig[selectedCase.treatmentType];

    return (
      <div className="space-y-6">
        {/* Header */}
        <SMCard className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-xl">
                <Heart className="w-8 h-8 text-red-500" />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-xl font-bold text-surface-900 dark:text-white">{selectedCase.id}</h2>
                  <SMBadge size="sm" variant={sevConf.badgeVariant}>{sevConf.label}</SMBadge>
                  <SMBadge size="sm" variant={statConf.badgeVariant}>{statConf.label}</SMBadge>
                  {selectedCase.oshaRecordable && (
                    <SMBadge size="sm" variant="neutral" icon={<BadgeAlert className="w-3 h-3" />}>OSHA Recordable</SMBadge>
                  )}
                </div>
                <p className="text-surface-600 dark:text-surface-400">
                  {selectedCase.injuryType.name} - {selectedCase.bodyParts.map(bp => `${bp.name}${bp.side && bp.side !== 'n/a' ? ` (${bp.side})` : ''}`).join(', ')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <SMButton variant="icon" size="sm" onClick={() => handleExportPDF(selectedCase)}>
                <Download className="w-5 h-5" />
              </SMButton>
              <SMButton variant="icon" size="sm">
                <Printer className="w-5 h-5" />
              </SMButton>
              <SMButton variant="icon" size="sm">
                <Edit3 className="w-5 h-5" />
              </SMButton>
            </div>
          </div>

          {/* Quick Info */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-surface-50 dark:bg-surface-700 rounded-xl">
            <div>
              <p className="text-xs text-surface-500 mb-1">Employee</p>
              <p className="font-medium text-surface-900 dark:text-white">{selectedCase.employeeName}</p>
              <p className="text-xs text-surface-500">{selectedCase.employeeJobTitle}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Location</p>
              <p className="font-medium text-surface-900 dark:text-white">{selectedCase.location}</p>
              <p className="text-xs text-surface-500">{selectedCase.employeeDepartment}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Date & Time</p>
              <p className="font-medium text-surface-900 dark:text-white">{selectedCase.injuryDate}</p>
              <p className="text-xs text-surface-500">{selectedCase.injuryTime}</p>
            </div>
            <div>
              <p className="text-xs text-surface-500 mb-1">Treatment</p>
              <div className={`flex items-center gap-1 ${treatConf.color}`}>
                {React.createElement(treatConf.icon, { className: 'w-4 h-4' })}
                <span className="font-medium">{treatConf.label}</span>
              </div>
              {selectedCase.daysLost > 0 && (
                <p className="text-xs text-red-500">{selectedCase.daysLost} days lost</p>
              )}
            </div>
          </div>
        </SMCard>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {[
            { id: 'details', label: 'Details', icon: FileText },
            { id: 'timeline', label: 'Timeline', icon: History },
            { id: 'capa', label: 'Corrective Actions', icon: Target },
            { id: 'ai', label: 'AI Analysis', icon: Brain }
          ].map((tab) => {
            const TabIcon = tab.icon;
            return (
              <SMButton
                key={tab.id}
                variant={activeTab === tab.id ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                leftIcon={<TabIcon className="w-4 h-4" />}
              >
                {tab.label}
              </SMButton>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'details' && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <SMCard className="p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Injury Description</h3>
                <p className="text-surface-600 dark:text-surface-400">{selectedCase.description}</p>
              </SMCard>

              <SMCard className="p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Immediate Actions Taken</h3>
                <p className="text-surface-600 dark:text-surface-400">{selectedCase.immediateActions}</p>
              </SMCard>

              <SMCard className="p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Root Cause</h3>
                <p className="text-surface-600 dark:text-surface-400">{selectedCase.rootCause}</p>
              </SMCard>

              {selectedCase.witnesses.length > 0 && (
                <SMCard className="p-5">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Witnesses</h3>
                  <div className="space-y-3">
                    {selectedCase.witnesses.map((witness) => (
                      <div key={witness.id} className="p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-surface-400" />
                          <span className="font-medium text-surface-900 dark:text-white">{witness.name}</span>
                          <span className="text-xs text-surface-500">{witness.contact}</span>
                        </div>
                        {witness.statement && (
                          <p className="text-sm text-surface-600 dark:text-surface-400 italic">"{witness.statement}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </SMCard>
              )}
            </motion.div>
          )}

          {activeTab === 'timeline' && (
            <MotionSMCard
              key="timeline"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-5"
            >
              <div className="relative">
                {selectedCase.timeline.map((event, index) => (
                  <div key={event.id} className="flex gap-4 pb-6 last:pb-0">
                    <div className="relative">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        event.type === 'created' ? 'bg-blue-100 text-blue-600' :
                        event.type === 'action' ? 'bg-green-100 text-green-600' :
                        event.type === 'status_change' ? 'bg-purple-100 text-purple-600' :
                        'bg-surface-100 text-surface-600'
                      }`}>
                        {event.type === 'created' && <Plus className="w-5 h-5" />}
                        {event.type === 'action' && <CheckCircle2 className="w-5 h-5" />}
                        {event.type === 'status_change' && <RefreshCw className="w-5 h-5" />}
                        {event.type === 'review' && <Eye className="w-5 h-5" />}
                        {event.type === 'comment' && <MessageSquare className="w-5 h-5" />}
                      </div>
                      {index < selectedCase.timeline.length - 1 && (
                        <div className="absolute left-5 top-10 bottom-0 w-px bg-surface-200 dark:bg-surface-700" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-surface-900 dark:text-white">{event.title}</h4>
                        <span className="text-xs text-surface-500">{new Date(event.date).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-surface-600 dark:text-surface-400 mt-1">{event.description}</p>
                      <p className="text-xs text-surface-400 mt-1">By: {event.user}</p>
                    </div>
                  </div>
                ))}
              </div>
            </MotionSMCard>
          )}

          {activeTab === 'capa' && (
            <motion.div
              key="capa"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {selectedCase.correctiveActions.map((action) => (
                <SMCard key={action.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <SMBadge size="sm" variant={
                        action.status === 'completed' ? 'success' :
                        action.status === 'in_progress' ? 'teal' :
                        action.status === 'overdue' ? 'danger' :
                        'neutral'
                      }>
                        {action.status.replace('_', ' ')}
                      </SMBadge>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-surface-500">
                      <Calendar className="w-3 h-3" />
                      Due: {action.dueDate}
                    </div>
                  </div>
                  <p className="text-surface-900 dark:text-white mb-2">{action.description}</p>
                  <div className="flex items-center gap-2 text-sm text-surface-500">
                    <User className="w-4 h-4" />
                    Assigned to: {action.assignee}
                  </div>
                </SMCard>
              ))}
              <SMButton
                variant="secondary"
                className="w-full py-3 border-2 border-dashed"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Add Corrective Action
              </SMButton>
            </motion.div>
          )}

          {activeTab === 'ai' && selectedCase.aiAnalysis && (
            <motion.div
              key="ai"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Risk Score */}
              <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl p-5 text-white">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Brain className="w-6 h-6" />
                    <h3 className="font-semibold">AI Risk Analysis</h3>
                  </div>
                  <div className="text-3xl font-bold">{selectedCase.aiAnalysis.riskScore}%</div>
                </div>
                <p className="text-sm opacity-80">Predicted recovery: {selectedCase.aiAnalysis.predictedRecoveryDays} days</p>
              </div>

              {/* Patterns */}
              <SMCard className="p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-500" />
                  Identified Patterns
                </h3>
                <ul className="space-y-2">
                  {selectedCase.aiAnalysis.patterns.map((pattern, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                      <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
                      {pattern}
                    </li>
                  ))}
                </ul>
              </SMCard>

              {/* Recommendations */}
              <SMCard className="p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-blue-500" />
                  AI Recommendations
                </h3>
                <ul className="space-y-2">
                  {selectedCase.aiAnalysis.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-surface-600 dark:text-surface-400">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {rec}
                    </li>
                  ))}
                </ul>
              </SMCard>

              {/* Similar Cases */}
              <SMCard className="p-5">
                <h3 className="font-semibold text-surface-900 dark:text-white mb-3 flex items-center gap-2">
                  <FileSearch className="w-5 h-5 text-purple-500" />
                  Similar Cases
                </h3>
                <div className="space-y-2">
                  {selectedCase.aiAnalysis.similarCases.map((similar) => (
                    <div key={similar.id} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">{similar.id}</p>
                        <p className="text-xs text-surface-500">{similar.summary}</p>
                      </div>
                      <SMBadge size="sm" variant="neutral">{similar.similarity}% match</SMBadge>
                    </div>
                  ))}
                </div>
              </SMCard>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-surface-50 dark:bg-surface-900">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-surface-800/80 backdrop-blur-xl border-b border-surface-200 dark:border-surface-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <SMButton
                variant="ghost"
                size="sm"
                onClick={() => {
                  if (viewMode === 'detail') {
                    setViewMode('list');
                    setSelectedCase(null);
                  }
                }}
                className="p-2 rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </SMButton>
              <div>
                <h1 className="text-xl font-bold text-surface-900 dark:text-white flex items-center gap-2">
                  <Heart className="w-6 h-6 text-red-500" />
                  Enhanced Injury Reporting
                </h1>
                <p className="text-sm text-surface-500">AI-powered injury tracking and analysis</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {viewMode === 'list' && renderList()}
        {viewMode === 'detail' && renderDetail()}
      </div>
    </div>
  );
};

export default EnhancedInjuryReport;
