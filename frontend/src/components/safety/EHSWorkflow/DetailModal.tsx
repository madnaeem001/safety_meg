import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  MapPin,
  User,
  Clock,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileText,
  Camera,
  Link2,
  Shield,
  Target,
  ClipboardCheck,
  Users,
  ExternalLink
} from 'lucide-react';
import {
  WorkflowStage,
  StageStatus,
  Observation,
  Incident,
  Investigation,
  CAPA,
  Audit,
  BBSObservation,
  ComplianceObligation
} from '../../../data/mockEHSWorkflow';

interface DetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: unknown;
  stage: WorkflowStage;
}

const statusColors: Record<StageStatus, { bg: string; text: string }> = {
  pending: { bg: 'bg-amber-100', text: 'text-amber-700' },
  in_progress: { bg: 'bg-blue-100', text: 'text-blue-700' },
  completed: { bg: 'bg-green-100', text: 'text-green-700' },
  overdue: { bg: 'bg-red-100', text: 'text-red-700' },
  blocked: { bg: 'bg-gray-100', text: 'text-gray-700' }
};

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Section component for detail modal
const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="border-b border-surface-100 pb-4 mb-4 last:border-0 last:pb-0 last:mb-0">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-surface-400">{icon}</span>
      <h4 className="text-xs font-semibold text-surface-600 uppercase tracking-wider">{title}</h4>
    </div>
    {children}
  </div>
);

// Observation Detail
const ObservationDetail: React.FC<{ item: Observation }> = ({ item }) => {
  const typeLabels: Record<string, { label: string; color: string }> = {
    unsafe_condition: { label: 'Unsafe Condition', color: 'bg-red-100 text-red-700' },
    at_risk_behavior: { label: 'At-Risk Behavior', color: 'bg-orange-100 text-orange-700' },
    good_catch: { label: 'Good Catch', color: 'bg-green-100 text-green-700' },
    positive: { label: 'Positive', color: 'bg-blue-100 text-blue-700' }
  };
  const typeInfo = typeLabels[item.type];
  const status = statusColors[item.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${typeInfo.color}`}>{typeInfo.label}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>{item.status.replace('_', ' ')}</span>
      </div>
      
      <div>
        <h3 className="text-lg font-bold text-surface-800 mb-2">{item.title}</h3>
        <p className="text-sm text-surface-600">{item.description}</p>
      </div>

      {item.photoUrl && (
        <DetailSection title="Photo Evidence" icon={<Camera className="w-4 h-4" />}>
          <div className="rounded-xl overflow-hidden">
            <img src={item.photoUrl} alt="Observation" className="w-full h-48 object-cover" />
          </div>
        </DetailSection>
      )}

      <DetailSection title="Details" icon={<FileText className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <MapPin className="w-3 h-3" /> Location
            </div>
            <p className="text-sm font-medium text-surface-800">{item.location}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <User className="w-3 h-3" /> Reported By
            </div>
            <p className="text-sm font-medium text-surface-800">{item.reportedBy}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <Calendar className="w-3 h-3" /> Date
            </div>
            <p className="text-sm font-medium text-surface-800">{formatDate(item.reportedDate)}</p>
          </div>
          {item.riskCategory && (
            <div className="bg-surface-50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
                <AlertTriangle className="w-3 h-3" /> Risk Category
              </div>
              <p className="text-sm font-medium text-surface-800">{item.riskCategory}</p>
            </div>
          )}
        </div>
      </DetailSection>

      {item.followUpActions && item.followUpActions.length > 0 && (
        <DetailSection title="Follow-up Actions" icon={<CheckCircle2 className="w-4 h-4" />}>
          <ul className="space-y-2">
            {item.followUpActions.map((action, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-surface-700">
                <span className="w-5 h-5 flex items-center justify-center bg-brand-100 text-brand-600 rounded-full text-xs font-bold mt-0.5">{idx + 1}</span>
                {action}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}
    </div>
  );
};

// Incident Detail
const IncidentDetail: React.FC<{ item: Incident }> = ({ item }) => {
  const status = statusColors[item.status];
  const severityColors = {
    low: 'bg-green-100 text-green-700 border-green-200',
    medium: 'bg-amber-100 text-amber-700 border-amber-200',
    high: 'bg-orange-100 text-orange-700 border-orange-200',
    critical: 'bg-red-100 text-red-700 border-red-200'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-surface-500">{item.id}</span>
          {item.oshaRecordable && (
            <span className="text-[10px] font-bold px-2 py-0.5 bg-red-600 text-white rounded">OSHA RECORDABLE</span>
          )}
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>{item.status.replace('_', ' ')}</span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-surface-800 mb-2">{item.title}</h3>
        <p className="text-sm text-surface-600">{item.description}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-3 py-1 rounded border ${severityColors[item.severity]}`}>{item.severity.toUpperCase()} SEVERITY</span>
        <span className="text-xs bg-surface-100 text-surface-600 px-3 py-1 rounded capitalize">{item.type.replace('_', ' ')}</span>
      </div>

      {item.aiSuggestedDescription && (
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold mb-2">
            <Target className="w-4 h-4" /> AI Suggested Description
          </div>
          <p className="text-sm text-purple-800">{item.aiSuggestedDescription}</p>
        </div>
      )}

      <DetailSection title="Incident Information" icon={<FileText className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <MapPin className="w-3 h-3" /> Location
            </div>
            <p className="text-sm font-medium text-surface-800">{item.location}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <User className="w-3 h-3" /> Reported By
            </div>
            <p className="text-sm font-medium text-surface-800">{item.reportedBy}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <Calendar className="w-3 h-3" /> Date & Time
            </div>
            <p className="text-sm font-medium text-surface-800">{formatDate(item.reportedDate)}</p>
          </div>
        </div>
      </DetailSection>

      {item.oshaFields && (
        <DetailSection title="OSHA Information" icon={<Shield className="w-4 h-4" />}>
          <div className="grid grid-cols-2 gap-3">
            {item.oshaFields.caseNumber && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-500 mb-1">Case Number</div>
                <p className="text-sm font-medium text-red-800">{item.oshaFields.caseNumber}</p>
              </div>
            )}
            {item.oshaFields.employeeName && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-500 mb-1">Employee</div>
                <p className="text-sm font-medium text-red-800">{item.oshaFields.employeeName}</p>
              </div>
            )}
            {item.oshaFields.bodyPartAffected && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-500 mb-1">Body Part</div>
                <p className="text-sm font-medium text-red-800">{item.oshaFields.bodyPartAffected}</p>
              </div>
            )}
            {item.oshaFields.injuryType && (
              <div className="bg-red-50 rounded-lg p-3">
                <div className="text-xs text-red-500 mb-1">Injury Type</div>
                <p className="text-sm font-medium text-red-800">{item.oshaFields.injuryType}</p>
              </div>
            )}
          </div>
        </DetailSection>
      )}

      {item.investigationId && (
        <div className="flex items-center gap-2 p-3 bg-purple-50 rounded-xl border border-purple-100">
          <Link2 className="w-4 h-4 text-purple-600" />
          <span className="text-sm text-purple-700">Linked Investigation: <span className="font-mono font-semibold">{item.investigationId}</span></span>
        </div>
      )}
    </div>
  );
};

// CAPA Detail
const CAPADetail: React.FC<{ item: CAPA }> = ({ item }) => {
  const status = statusColors[item.status];
  const dueDate = new Date(item.dueDate);
  const isOverdue = dueDate < new Date() && item.status !== 'completed';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-surface-500">{item.id}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : `${status.bg} ${status.text}`}`}>
          {isOverdue ? 'OVERDUE' : item.status.replace('_', ' ')}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-surface-800 mb-2">{item.title}</h3>
        <p className="text-sm text-surface-600">{item.description}</p>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <span className={`text-xs font-bold px-3 py-1 rounded ${
          item.priority === 'urgent' ? 'bg-red-100 text-red-700' :
          item.priority === 'high' ? 'bg-orange-100 text-orange-700' :
          item.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-700'
        }`}>{item.priority.toUpperCase()} PRIORITY</span>
        <span className="text-xs bg-surface-100 text-surface-600 px-3 py-1 rounded capitalize">Source: {item.sourceType}</span>
        {item.escalated && (
          <span className="text-xs bg-red-100 text-red-700 px-3 py-1 rounded">ESCALATED</span>
        )}
      </div>

      <DetailSection title="Assignment" icon={<User className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Assigned To</div>
            <p className="text-sm font-medium text-surface-800">{item.assignedTo}</p>
          </div>
          <div className={`rounded-lg p-3 ${isOverdue ? 'bg-red-50' : 'bg-surface-50'}`}>
            <div className={`text-xs mb-1 ${isOverdue ? 'text-red-500' : 'text-surface-500'}`}>Due Date</div>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-800' : 'text-surface-800'}`}>{formatDate(item.dueDate)}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3 col-span-2">
            <div className="text-xs text-surface-500 mb-1">Assigned Date</div>
            <p className="text-sm font-medium text-surface-800">{formatDate(item.assignedDate)}</p>
          </div>
        </div>
      </DetailSection>

      {item.verificationRequired && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl border border-amber-100">
          <CheckCircle2 className="w-4 h-4 text-amber-600" />
          <span className="text-sm text-amber-700">Verification required after completion</span>
        </div>
      )}

      {item.sourceId && (
        <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
          <Link2 className="w-4 h-4 text-blue-600" />
          <span className="text-sm text-blue-700">Source: <span className="font-mono font-semibold">{item.sourceId}</span></span>
        </div>
      )}
    </div>
  );
};

// Audit Detail
const AuditDetail: React.FC<{ item: Audit }> = ({ item }) => {
  const status = statusColors[item.status];
  const nonCompliantCount = item.findings.filter(f => !f.compliant).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-surface-500">{item.id}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>{item.status.replace('_', ' ')}</span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-surface-800 mb-2">{item.title}</h3>
        <p className="text-sm text-surface-600">{item.templateName}</p>
      </div>

      <div className="flex items-center gap-3">
        <span className={`text-xs font-bold px-3 py-1 rounded ${
          item.type === 'regulatory' ? 'bg-red-100 text-red-700' :
          item.type === 'scheduled' ? 'bg-blue-100 text-blue-700' :
          item.type === 'internal' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
        }`}>{item.type.toUpperCase()}</span>
      </div>

      {item.complianceScore !== undefined && (
        <div className="bg-surface-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-surface-600">Compliance Score</span>
            <span className={`text-2xl font-bold ${
              item.complianceScore >= 80 ? 'text-green-600' :
              item.complianceScore >= 60 ? 'text-amber-600' : 'text-red-600'
            }`}>{item.complianceScore}%</span>
          </div>
          <div className="h-2 bg-surface-200 rounded-full overflow-hidden">
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

      <DetailSection title="Audit Details" icon={<ClipboardCheck className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <MapPin className="w-3 h-3" /> Location
            </div>
            <p className="text-sm font-medium text-surface-800">{item.location}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <User className="w-3 h-3" /> Auditor
            </div>
            <p className="text-sm font-medium text-surface-800">{item.auditor}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <Calendar className="w-3 h-3" /> Scheduled Date
            </div>
            <p className="text-sm font-medium text-surface-800">{formatDate(item.scheduledDate)}</p>
          </div>
        </div>
      </DetailSection>

      {item.findings.length > 0 && (
        <DetailSection title={`Findings (${nonCompliantCount} Non-Compliant)`} icon={<AlertTriangle className="w-4 h-4" />}>
          <div className="space-y-2">
            {item.findings.map((finding, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg border ${finding.compliant ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-semibold text-surface-600">{finding.category}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded ${finding.compliant ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {finding.compliant ? 'Compliant' : 'Non-Compliant'}
                  </span>
                </div>
                <p className="text-sm text-surface-700">{finding.description}</p>
              </div>
            ))}
          </div>
        </DetailSection>
      )}
    </div>
  );
};

// Compliance Detail
const ComplianceDetail: React.FC<{ item: ComplianceObligation }> = ({ item }) => {
  const status = statusColors[item.status];
  const dueDate = new Date(item.dueDate);
  const isOverdue = dueDate < new Date() && item.status !== 'completed';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold px-3 py-1 rounded bg-indigo-100 text-indigo-700">{item.regulatoryBody}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isOverdue ? 'bg-red-100 text-red-700' : `${status.bg} ${status.text}`}`}>
          {isOverdue ? 'OVERDUE' : item.status.replace('_', ' ')}
        </span>
      </div>

      <div>
        <h3 className="text-lg font-bold text-surface-800 mb-2">{item.title}</h3>
        <p className="text-xs font-mono text-surface-500 mb-2">{item.regulation}</p>
        <p className="text-sm text-surface-600">{item.description}</p>
      </div>

      <DetailSection title="Obligation Details" icon={<Shield className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Assigned To</div>
            <p className="text-sm font-medium text-surface-800">{item.assignedTo}</p>
          </div>
          <div className={`rounded-lg p-3 ${isOverdue ? 'bg-red-50' : 'bg-surface-50'}`}>
            <div className={`text-xs mb-1 ${isOverdue ? 'text-red-500' : 'text-surface-500'}`}>Due Date</div>
            <p className={`text-sm font-medium ${isOverdue ? 'text-red-800' : 'text-surface-800'}`}>{formatDate(item.dueDate)}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Frequency</div>
            <p className="text-sm font-medium text-surface-800 capitalize">{item.frequency}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Evidence</div>
            <p className={`text-sm font-medium ${item.evidenceUploaded ? 'text-green-700' : 'text-amber-700'}`}>
              {item.evidenceUploaded ? 'Uploaded' : 'Pending'}
            </p>
          </div>
        </div>
      </DetailSection>
    </div>
  );
};

// BBS Detail
const BBSDetail: React.FC<{ item: BBSObservation }> = ({ item }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-surface-500">{item.id}</span>
        <span className="text-xs text-surface-400">{formatDate(item.observedDate)}</span>
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm bg-green-100 text-green-700 px-3 py-1 rounded-full font-medium">
          {item.safeObservations.length} Safe
        </span>
        {item.atRiskObservations.length > 0 && (
          <span className="text-sm bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium">
            {item.atRiskObservations.length} At-Risk
          </span>
        )}
      </div>

      <DetailSection title="Observation Info" icon={<Users className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Observer</div>
            <p className="text-sm font-medium text-surface-800">{item.observer}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Department</div>
            <p className="text-sm font-medium text-surface-800">{item.department}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3 col-span-2">
            <div className="flex items-center gap-2 text-surface-500 text-xs mb-1">
              <MapPin className="w-3 h-3" /> Location
            </div>
            <p className="text-sm font-medium text-surface-800">{item.location}</p>
          </div>
        </div>
      </DetailSection>

      {item.safeObservations.length > 0 && (
        <DetailSection title="Safe Behaviors" icon={<CheckCircle2 className="w-4 h-4" />}>
          <ul className="space-y-2">
            {item.safeObservations.map((obs, idx) => (
              <li key={idx} className="p-3 bg-green-50 rounded-lg border border-green-100">
                <span className="text-[10px] font-semibold text-green-600 uppercase">{obs.category}</span>
                <p className="text-sm text-green-800">{obs.description}</p>
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {item.atRiskObservations.length > 0 && (
        <DetailSection title="At-Risk Behaviors" icon={<AlertTriangle className="w-4 h-4" />}>
          <ul className="space-y-2">
            {item.atRiskObservations.map((obs, idx) => (
              <li key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-100">
                <span className="text-[10px] font-semibold text-orange-600 uppercase">{obs.category}</span>
                <p className="text-sm text-orange-800">{obs.description}</p>
                {obs.feedback && (
                  <p className="text-xs text-orange-600 mt-2 italic">Feedback: {obs.feedback}</p>
                )}
              </li>
            ))}
          </ul>
        </DetailSection>
      )}

      {item.coachingNotes && (
        <DetailSection title="Coaching Notes" icon={<FileText className="w-4 h-4" />}>
          <p className="text-sm text-surface-700 bg-surface-50 p-3 rounded-lg">{item.coachingNotes}</p>
        </DetailSection>
      )}
    </div>
  );
};

// Investigation Detail
const InvestigationDetail: React.FC<{ item: Investigation }> = ({ item }) => {
  const status = statusColors[item.status];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-surface-500">{item.id}</span>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bg} ${status.text}`}>{item.status.replace('_', ' ')}</span>
      </div>

      <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
        <div className="text-xs text-blue-600 mb-1">Linked Incident</div>
        <span className="font-mono font-semibold text-blue-800">{item.incidentId}</span>
      </div>

      <DetailSection title="Investigation Info" icon={<User className="w-4 h-4" />}>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Investigator</div>
            <p className="text-sm font-medium text-surface-800">{item.investigator}</p>
          </div>
          <div className="bg-surface-50 rounded-lg p-3">
            <div className="text-xs text-surface-500 mb-1">Start Date</div>
            <p className="text-sm font-medium text-surface-800">{formatDate(item.startDate)}</p>
          </div>
        </div>
      </DetailSection>

      {item.fiveWhyAnalysis.length > 0 && (
        <DetailSection title="5-Why Analysis" icon={<Target className="w-4 h-4" />}>
          <ol className="space-y-2">
            {item.fiveWhyAnalysis.map((why, idx) => (
              <li key={idx} className="flex items-start gap-3 p-3 bg-surface-50 rounded-lg">
                <span className="w-6 h-6 flex items-center justify-center bg-brand-100 text-brand-700 rounded-full text-xs font-bold">{idx + 1}</span>
                <p className="text-sm text-surface-700 flex-1">{why}</p>
              </li>
            ))}
          </ol>
        </DetailSection>
      )}

      {item.rootCauses.length > 0 && (
        <DetailSection title="Root Causes" icon={<AlertTriangle className="w-4 h-4" />}>
          <ul className="space-y-2">
            {item.rootCauses.map((cause, idx) => (
              <li key={idx} className="p-3 bg-orange-50 rounded-lg border border-orange-100 text-sm text-orange-800">{cause}</li>
            ))}
          </ul>
        </DetailSection>
      )}

      {item.aiSuggestedRootCause && (
        <div className="p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700 text-xs font-semibold mb-2">
            <Target className="w-4 h-4" /> AI Suggested Root Cause
          </div>
          <p className="text-sm text-purple-800">{item.aiSuggestedRootCause}</p>
        </div>
      )}
    </div>
  );
};

export const DetailModal: React.FC<DetailModalProps> = ({
  isOpen,
  onClose,
  item,
  stage
}) => {
  const renderContent = () => {
    if (!item) return null;

    switch (stage) {
      case 'observation':
        return <ObservationDetail item={item as Observation} />;
      case 'incident':
        return <IncidentDetail item={item as Incident} />;
      case 'investigation':
        return <InvestigationDetail item={item as Investigation} />;
      case 'capa':
        return <CAPADetail item={item as CAPA} />;
      case 'audit':
        return <AuditDetail item={item as Audit} />;
      case 'bbs':
        return <BBSDetail item={item as BBSObservation} />;
      case 'compliance':
        return <ComplianceDetail item={item as ComplianceObligation} />;
      default:
        return <p className="text-center text-surface-500">Details not available</p>;
    }
  };

  const getTitle = () => {
    switch (stage) {
      case 'observation': return 'Observation Details';
      case 'incident': return 'Incident Details';
      case 'investigation': return 'Investigation Details';
      case 'capa': return 'Corrective Action Details';
      case 'audit': return 'Audit Details';
      case 'bbs': return 'BBS Observation Details';
      case 'compliance': return 'Compliance Obligation Details';
      default: return 'Details';
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-2xl bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-100">
              <h2 className="text-lg font-semibold text-surface-800">{getTitle()}</h2>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors"
              >
                <X className="w-5 h-5 text-surface-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {renderContent()}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-surface-100 flex justify-end gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
              >
                Close
              </button>
              <button className="px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Open Full View
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DetailModal;
