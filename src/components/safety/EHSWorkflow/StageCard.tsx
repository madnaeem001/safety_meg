import React from 'react';
import { motion } from 'framer-motion';
import {
  Eye,
  AlertTriangle,
  Search,
  CheckSquare,
  ClipboardCheck,
  Users,
  Shield,
  BarChart3,
  RefreshCw,
  Clock,
  User,
  MapPin,
  ChevronRight,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { 
  WorkflowStage,
  StageStatus,
  Severity,
  Observation,
  Incident,
  Investigation,
  CAPA,
  Audit,
  BBSObservation,
  ComplianceObligation
} from '../../../data/mockEHSWorkflow';

interface StageCardProps {
  stage: WorkflowStage;
  items: unknown[];
  onItemClick: (item: unknown, stage: WorkflowStage) => void;
  onActionClick: (action: string, stage: WorkflowStage, item?: unknown) => void;
}

const statusColors: Record<StageStatus, { bg: string; text: string; icon: React.ElementType }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700', icon: Clock },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700', icon: RefreshCw },
  completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle2 },
  overdue: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
  blocked: { bg: 'bg-gray-100', text: 'text-gray-700', icon: XCircle }
};

const severityColors: Record<Severity, string> = {
  low: 'bg-green-100 text-green-700 border-green-200',
  medium: 'bg-amber-100 text-amber-700 border-amber-200',
  high: 'bg-orange-100 text-orange-700 border-orange-200',
  critical: 'bg-red-100 text-red-700 border-red-200'
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

// Observation Card
const ObservationCard: React.FC<{ item: Observation; onClick: () => void }> = ({ item, onClick }) => {
  const status = statusColors[item.status];
  const StatusIcon = status.icon;
  
  const typeLabels: Record<string, { label: string; color: string }> = {
    unsafe_condition: { label: 'Unsafe Condition', color: 'bg-red-100 text-red-700' },
    at_risk_behavior: { label: 'At-Risk Behavior', color: 'bg-orange-100 text-orange-700' },
    good_catch: { label: 'Good Catch', color: 'bg-green-100 text-green-700' },
    positive: { label: 'Positive', color: 'bg-blue-100 text-blue-700' }
  };
  const typeInfo = typeLabels[item.type];

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeInfo.color}`}>
          {typeInfo.label}
        </span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          <StatusIcon className="w-3 h-3" />
          {item.status.replace('_', ' ')}
        </span>
      </div>
      <h4 className="font-semibold text-surface-800 text-sm mb-1 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-surface-500 mb-3 line-clamp-2">{item.description}</p>
      <div className="flex items-center gap-3 text-[10px] text-surface-400">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {item.location}
        </span>
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {item.reportedBy}
        </span>
      </div>
      {item.photoUrl && (
        <div className="mt-3 rounded-lg overflow-hidden h-20">
          <img src={item.photoUrl} alt="Observation" className="w-full h-full object-cover" />
        </div>
      )}
    </motion.div>
  );
};

// Incident Card
const IncidentCard: React.FC<{ item: Incident; onClick: () => void }> = ({ item, onClick }) => {
  const status = statusColors[item.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-xl border-l-4 ${
        item.severity === 'critical' ? 'border-l-red-500' :
        item.severity === 'high' ? 'border-l-orange-500' :
        item.severity === 'medium' ? 'border-l-amber-500' : 'border-l-green-500'
      } border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-surface-400">{item.id}</span>
          {item.oshaRecordable && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-red-600 text-white rounded">OSHA</span>
          )}
        </div>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          <StatusIcon className="w-3 h-3" />
          {item.status.replace('_', ' ')}
        </span>
      </div>
      <h4 className="font-semibold text-surface-800 text-sm mb-1 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-surface-500 mb-3 line-clamp-2">{item.description}</p>
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${severityColors[item.severity]}`}>
          {item.severity.toUpperCase()}
        </span>
        <span className="text-[10px] text-surface-400">{formatDate(item.reportedDate)}</span>
      </div>
      {item.aiSuggestedDescription && (
        <div className="mt-3 p-2 bg-purple-50 rounded-lg border border-purple-100">
          <div className="flex items-center gap-1 text-[9px] text-purple-600 font-semibold mb-1">
            <RefreshCw className="w-3 h-3" />
            AI Suggested
          </div>
          <p className="text-[10px] text-purple-700">{item.aiSuggestedDescription}</p>
        </div>
      )}
    </motion.div>
  );
};

// CAPA Card
const CAPACard: React.FC<{ item: CAPA; onClick: () => void }> = ({ item, onClick }) => {
  const status = statusColors[item.status];
  const StatusIcon = status.icon;
  const dueDate = new Date(item.dueDate);
  const isOverdue = dueDate < new Date() && item.status !== 'completed';

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-xl border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-surface-400">{item.id}</span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
          isOverdue ? 'bg-red-100 text-red-700' : `${status.bg} ${status.text}`
        }`}>
          <StatusIcon className="w-3 h-3" />
          {isOverdue ? 'OVERDUE' : item.status.replace('_', ' ')}
        </span>
      </div>
      <h4 className="font-semibold text-surface-800 text-sm mb-1 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-surface-500 mb-3 line-clamp-2">{item.description}</p>
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-surface-500">
          <User className="w-3 h-3" />
          {item.assignedTo}
        </span>
        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-surface-400'}`}>
          <Clock className="w-3 h-3" />
          Due: {formatDate(item.dueDate)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
          item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
          item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {item.priority.toUpperCase()}
        </span>
        <span className="text-[9px] text-surface-400">Source: {item.sourceType}</span>
      </div>
    </motion.div>
  );
};

// Audit Card
const AuditCard: React.FC<{ item: Audit; onClick: () => void }> = ({ item, onClick }) => {
  const status = statusColors[item.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          item.type === 'regulatory' ? 'bg-red-100 text-red-700' :
          item.type === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          item.type === 'internal' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
        }`}>
          {item.type.toUpperCase()}
        </span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          <StatusIcon className="w-3 h-3" />
          {item.status.replace('_', ' ')}
        </span>
      </div>
      <h4 className="font-semibold text-surface-800 text-sm mb-1 line-clamp-1">{item.title}</h4>
      <p className="text-xs text-surface-500 mb-2">{item.templateName}</p>
      <div className="flex items-center gap-3 text-[10px] text-surface-400 mb-2">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {item.location}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(item.scheduledDate)}
        </span>
      </div>
      {item.complianceScore !== undefined && (
        <div className="mt-2">
          <div className="flex items-center justify-between text-[10px] mb-1">
            <span className="text-surface-500">Compliance Score</span>
            <span className={`font-semibold ${
              item.complianceScore >= 80 ? 'text-green-600' :
              item.complianceScore >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>{item.complianceScore}%</span>
          </div>
          <div className="h-1.5 bg-surface-100 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                item.complianceScore >= 80 ? 'bg-green-500' :
                item.complianceScore >= 60 ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${item.complianceScore}%` }}
            />
          </div>
        </div>
      )}
      {item.findings.length > 0 && (
        <div className="mt-2 text-[10px] text-surface-500">
          {item.findings.filter(f => !f.compliant).length} findings requiring action
        </div>
      )}
    </motion.div>
  );
};

// Compliance Card
const ComplianceCard: React.FC<{ item: ComplianceObligation; onClick: () => void }> = ({ item, onClick }) => {
  const status = statusColors[item.status];
  const StatusIcon = status.icon;
  const dueDate = new Date(item.dueDate);
  const isOverdue = dueDate < new Date() && item.status !== 'completed';

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className={`bg-white rounded-xl border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${
        isOverdue ? 'ring-2 ring-red-200' : ''
      }`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-700">
          {item.regulatoryBody}
        </span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${
          isOverdue ? 'bg-red-100 text-red-700' : `${status.bg} ${status.text}`
        }`}>
          <StatusIcon className="w-3 h-3" />
          {isOverdue ? 'OVERDUE' : item.status.replace('_', ' ')}
        </span>
      </div>
      <h4 className="font-semibold text-surface-800 text-sm mb-1 line-clamp-1">{item.title}</h4>
      <p className="text-[10px] text-surface-400 mb-2">{item.regulation}</p>
      <p className="text-xs text-surface-500 mb-3 line-clamp-2">{item.description}</p>
      <div className="flex items-center justify-between text-[10px]">
        <span className="flex items-center gap-1 text-surface-500">
          <User className="w-3 h-3" />
          {item.assignedTo}
        </span>
        <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : 'text-surface-400'}`}>
          <Clock className="w-3 h-3" />
          Due: {formatDate(item.dueDate)}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <span className={`text-[9px] px-1.5 py-0.5 rounded ${
          item.evidenceUploaded ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
        }`}>
          {item.evidenceUploaded ? 'Evidence Uploaded' : 'Evidence Pending'}
        </span>
        <span className="text-[9px] text-surface-400 capitalize">{item.frequency}</span>
      </div>
    </motion.div>
  );
};

// BBS Card
const BBSCard: React.FC<{ item: BBSObservation; onClick: () => void }> = ({ item, onClick }) => {
  const safeCount = item.safeObservations.length;
  const atRiskCount = item.atRiskObservations.length;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-surface-400">{item.id}</span>
        <span className="text-[10px] text-surface-400">{formatDate(item.observedDate)}</span>
      </div>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
          {safeCount} Safe
        </span>
        {atRiskCount > 0 && (
          <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">
            {atRiskCount} At-Risk
          </span>
        )}
      </div>
      <div className="flex items-center gap-3 text-[10px] text-surface-400 mb-2">
        <span className="flex items-center gap-1">
          <MapPin className="w-3 h-3" />
          {item.location}
        </span>
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {item.department}
        </span>
      </div>
      {item.coachingNotes && (
        <p className="text-xs text-surface-500 line-clamp-2 mt-2">{item.coachingNotes}</p>
      )}
      {item.followUpRequired && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600">
          <AlertCircle className="w-3 h-3" />
          Follow-up Required
        </div>
      )}
    </motion.div>
  );
};

// Investigation Card
const InvestigationCard: React.FC<{ item: Investigation; onClick: () => void }> = ({ item, onClick }) => {
  const status = statusColors[item.status];
  const StatusIcon = status.icon;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      onClick={onClick}
      className="bg-white rounded-xl border border-surface-200 p-4 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-[10px] font-mono text-surface-400">{item.id}</span>
        <span className={`flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
          <StatusIcon className="w-3 h-3" />
          {item.status.replace('_', ' ')}
        </span>
      </div>
      <div className="text-xs text-surface-500 mb-2">
        Linked to: <span className="font-mono text-surface-600">{item.incidentId}</span>
      </div>
      <div className="flex items-center gap-3 text-[10px] text-surface-400 mb-3">
        <span className="flex items-center gap-1">
          <User className="w-3 h-3" />
          {item.investigator}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatDate(item.startDate)}
        </span>
      </div>
      {item.fiveWhyAnalysis.length > 0 && (
        <div className="bg-surface-50 rounded-lg p-2 mb-2">
          <div className="text-[10px] font-semibold text-surface-600 mb-1">5-Why Analysis</div>
          <div className="text-[10px] text-surface-500">
            {item.fiveWhyAnalysis.length} of 5 whys completed
          </div>
        </div>
      )}
      {item.rootCauses.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.rootCauses.slice(0, 2).map((cause, idx) => (
            <span key={idx} className="text-[9px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded">
              {cause.length > 25 ? cause.substring(0, 25) + '...' : cause}
            </span>
          ))}
        </div>
      )}
      {item.aiSuggestedRootCause && (
        <div className="mt-2 p-2 bg-purple-50 rounded-lg">
          <div className="flex items-center gap-1 text-[9px] text-purple-600 font-semibold">
            <RefreshCw className="w-3 h-3" />
            AI Suggested Root Cause
          </div>
        </div>
      )}
    </motion.div>
  );
};

export const StageCard: React.FC<StageCardProps> = ({ stage, items, onItemClick, onActionClick }) => {
  const renderCard = (item: unknown, index: number) => {
    switch (stage) {
      case 'observation':
        return <ObservationCard key={index} item={item as Observation} onClick={() => onItemClick(item, stage)} />;
      case 'incident':
        return <IncidentCard key={index} item={item as Incident} onClick={() => onItemClick(item, stage)} />;
      case 'investigation':
        return <InvestigationCard key={index} item={item as Investigation} onClick={() => onItemClick(item, stage)} />;
      case 'capa':
        return <CAPACard key={index} item={item as CAPA} onClick={() => onItemClick(item, stage)} />;
      case 'audit':
        return <AuditCard key={index} item={item as Audit} onClick={() => onItemClick(item, stage)} />;
      case 'bbs':
        return <BBSCard key={index} item={item as BBSObservation} onClick={() => onItemClick(item, stage)} />;
      case 'compliance':
        return <ComplianceCard key={index} item={item as ComplianceObligation} onClick={() => onItemClick(item, stage)} />;
      default:
        return null;
    }
  };

  const getActionButtons = () => {
    switch (stage) {
      case 'observation':
        return [{ label: 'Submit Observation', action: 'submit_observation' }];
      case 'incident':
        return [{ label: 'Report Incident', action: 'report_incident' }];
      case 'investigation':
        return [{ label: 'Start Investigation', action: 'start_investigation' }];
      case 'capa':
        return [{ label: 'Assign CAPA', action: 'assign_capa' }];
      case 'audit':
        return [{ label: 'Schedule Audit', action: 'schedule_audit' }];
      case 'bbs':
        return [{ label: 'Record Observation', action: 'record_bbs' }];
      case 'compliance':
        return [{ label: 'Add Obligation', action: 'add_obligation' }];
      default:
        return [];
    }
  };

  const actionButtons = getActionButtons();

  return (
    <div className="space-y-3">
      {/* Action Buttons */}
      {actionButtons.length > 0 && (
        <div className="flex gap-2">
          {actionButtons.map((btn, idx) => (
            <motion.button
              key={idx}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onActionClick(btn.action, stage)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 text-white text-xs font-medium rounded-lg hover:bg-brand-700 transition-colors"
            >
              <span>+</span>
              {btn.label}
            </motion.button>
          ))}
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {items.map((item, index) => renderCard(item, index))}
      </div>

      {items.length === 0 && (
        <div className="text-center py-8 text-surface-400">
          <p className="text-sm">No items in this stage</p>
          {actionButtons.length > 0 && (
            <p className="text-xs mt-1">Click the button above to add one</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StageCard;
