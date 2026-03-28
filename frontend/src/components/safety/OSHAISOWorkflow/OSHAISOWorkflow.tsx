import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, AlertTriangle, CheckCircle2, Clock, Calendar, Users,
  ArrowLeft, ChevronRight, ChevronDown, ChevronUp, Shield, Target,
  Activity, Download, Upload, Eye, Edit2, Plus, Search, Filter,
  BookOpen, Clipboard, TrendingUp, Award, RefreshCw
} from 'lucide-react';
import { SMButton } from '../../ui';

// OSHA Form types
const OSHA_FORMS = [
  { id: '300', label: 'OSHA Form 300', description: 'Log of Work-Related Injuries and Illnesses', required: true },
  { id: '300A', label: 'OSHA Form 300A', description: 'Summary of Work-Related Injuries and Illnesses', required: true },
  { id: '301', label: 'OSHA Form 301', description: 'Injury and Illness Incident Report', required: true },
];

// Incident classification types
const INCIDENT_CLASSIFICATIONS = [
  { id: 'death', label: 'Death', oshaRequired: true, reportWithin: '8 hours', color: 'bg-black text-white' },
  { id: 'hospitalization', label: 'In-Patient Hospitalization', oshaRequired: true, reportWithin: '24 hours', color: 'bg-red-600 text-white' },
  { id: 'amputation', label: 'Amputation', oshaRequired: true, reportWithin: '24 hours', color: 'bg-red-600 text-white' },
  { id: 'eye-loss', label: 'Loss of Eye', oshaRequired: true, reportWithin: '24 hours', color: 'bg-red-600 text-white' },
  { id: 'days-away', label: 'Days Away from Work', oshaRequired: false, reportWithin: null, color: 'bg-orange-500 text-white' },
  { id: 'restricted', label: 'Job Transfer or Restriction', oshaRequired: false, reportWithin: null, color: 'bg-amber-500 text-white' },
  { id: 'medical-treatment', label: 'Medical Treatment', oshaRequired: false, reportWithin: null, color: 'bg-yellow-500 text-black' },
  { id: 'first-aid', label: 'First Aid Only', oshaRequired: false, reportWithin: null, color: 'bg-green-500 text-white' },
];

// ISO 45001 CAPA workflow stages
const ISO_CAPA_STAGES = [
  { id: 'reported', label: 'Reported', description: 'Incident reported and logged', icon: FileText },
  { id: 'triage', label: 'Triage', description: 'Classification and prioritization', icon: Filter },
  { id: 'investigation', label: 'Investigation', description: 'Root cause analysis', icon: Search },
  { id: 'corrective', label: 'Corrective Action', description: 'Implementing fixes', icon: Target },
  { id: 'preventive', label: 'Preventive Action', description: 'Preventing recurrence', icon: Shield },
  { id: 'verification', label: 'Verification', description: 'Confirming effectiveness', icon: CheckCircle2 },
  { id: 'closed', label: 'Closed', description: 'Incident resolved', icon: Award },
];

// Mock incidents for OSHA log
const mockOSHAIncidents = [
  {
    id: 'INC-2026-001',
    caseNumber: '1',
    employeeName: 'John Smith',
    jobTitle: 'Warehouse Associate',
    dateOfInjury: '2026-01-15',
    location: 'Warehouse A',
    description: 'Slip and fall on wet floor, resulting in back strain',
    classification: 'days-away',
    daysAway: 3,
    daysRestricted: 0,
    bodyPart: 'Lower Back',
    oshaRecordable: true,
    form301Completed: true,
    isoStage: 'corrective',
  },
  {
    id: 'INC-2026-002',
    caseNumber: '2',
    employeeName: 'Sarah Johnson',
    jobTitle: 'Machine Operator',
    dateOfInjury: '2026-01-18',
    location: 'Production Line 3',
    description: 'Laceration to right hand from cutting blade',
    classification: 'medical-treatment',
    daysAway: 0,
    daysRestricted: 5,
    bodyPart: 'Right Hand',
    oshaRecordable: true,
    form301Completed: true,
    isoStage: 'verification',
  },
  {
    id: 'INC-2026-003',
    caseNumber: '3',
    employeeName: 'Mike Davis',
    jobTitle: 'Maintenance Tech',
    dateOfInjury: '2026-01-20',
    location: 'Utility Room',
    description: 'Exposure to chemical fumes causing respiratory irritation',
    classification: 'hospitalization',
    daysAway: 7,
    daysRestricted: 0,
    bodyPart: 'Respiratory System',
    oshaRecordable: true,
    form301Completed: true,
    isoStage: 'investigation',
    oshaReportedDate: '2026-01-20',
    oshaReportedTo: 'OSHA Area Office',
  },
  {
    id: 'INC-2026-004',
    caseNumber: '4',
    employeeName: 'Emily Chen',
    jobTitle: 'Lab Technician',
    dateOfInjury: '2026-01-22',
    location: 'Lab 102',
    description: 'Minor burn from hot plate, treated on-site',
    classification: 'first-aid',
    daysAway: 0,
    daysRestricted: 0,
    bodyPart: 'Left Hand',
    oshaRecordable: false,
    form301Completed: false,
    isoStage: 'closed',
  },
];

// OSHA 300A Summary data
const osha300ASummary = {
  year: 2025,
  establishment: 'Safety Hub Manufacturing Facility',
  naicsCode: '332710',
  averageEmployees: 847,
  hoursWorked: 1694000,
  totalDeaths: 0,
  totalDaysAway: 45,
  totalRestricted: 23,
  totalOtherRecordable: 12,
  totalInjuries: 28,
  totalIllnesses: 3,
  skinDisorders: 1,
  respiratoryConditions: 1,
  poisonings: 0,
  hearingLoss: 1,
  otherIllnesses: 0,
  trir: 1.84, // Total Recordable Incident Rate
  dart: 1.24, // Days Away/Restricted/Transfer Rate
};

interface OSHAISOWorkflowProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
}

export const OSHAISOWorkflow: React.FC<OSHAISOWorkflowProps> = ({ onNavigate, onBack }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'osha-log' | 'iso-workflow' | 'forms' | 'reporting'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [selectedStage, setSelectedStage] = useState<string | null>(null);

  const stats = useMemo(() => {
    const recordableIncidents = mockOSHAIncidents.filter(i => i.oshaRecordable).length;
    const totalDaysAway = mockOSHAIncidents.reduce((sum, i) => sum + i.daysAway, 0);
    const totalDaysRestricted = mockOSHAIncidents.reduce((sum, i) => sum + i.daysRestricted, 0);
    const pendingCAPAs = mockOSHAIncidents.filter(i => !['closed', 'verification'].includes(i.isoStage)).length;
    
    return { recordableIncidents, totalDaysAway, totalDaysRestricted, pendingCAPAs };
  }, []);

  const getClassificationInfo = (classId: string) => {
    return INCIDENT_CLASSIFICATIONS.find(c => c.id === classId);
  };

  const getStageInfo = (stageId: string) => {
    return ISO_CAPA_STAGES.find(s => s.id === stageId);
  };

  const filteredIncidents = useMemo(() => {
    let incidents = mockOSHAIncidents;
    if (searchQuery) {
      incidents = incidents.filter(i =>
        i.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        i.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedStage) {
      incidents = incidents.filter(i => i.isoStage === selectedStage);
    }
    return incidents;
  }, [searchQuery, selectedStage]);

  // Overview Tab
  const renderOverview = () => (
    <div className="space-y-6">
      {/* OSHA Requirements Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">OSHA Reporting Requirements</p>
          <p>Employers must report: fatalities within 8 hours, and hospitalizations, amputations, or loss of eye within 24 hours. Form 300A must be posted Feb 1 - Apr 30.</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-bold text-text-muted uppercase">Recordable</span>
          </div>
          <p className="text-2xl font-bold text-text-primary">{stats.recordableIncidents}</p>
          <p className="text-xs text-text-muted">YTD incidents</p>
        </div>
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold text-text-muted uppercase">Days Away</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.totalDaysAway}</p>
          <p className="text-xs text-text-muted">Lost workdays</p>
        </div>
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-text-muted uppercase">Restricted</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.totalDaysRestricted}</p>
          <p className="text-xs text-text-muted">Restricted days</p>
        </div>
        <div className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-primary" />
            <span className="text-xs font-bold text-text-muted uppercase">Pending CAPAs</span>
          </div>
          <p className="text-2xl font-bold text-primary">{stats.pendingCAPAs}</p>
          <p className="text-xs text-text-muted">Open actions</p>
        </div>
      </div>

      {/* OSHA vs ISO Comparison */}
      <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
        <h3 className="font-bold text-text-primary mb-4">OSHA vs ISO 45001 Approach</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-accent" />
              <h4 className="font-bold text-accent">OSHA Requirements</h4>
            </div>
            <ul className="space-y-2 text-sm text-accent">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Recordkeeping for work-related injuries/illnesses</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Forms 300, 300A, 301 maintenance</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Severe incident reporting to OSHA</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>5-year record retention</span>
              </li>
            </ul>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-2 mb-3">
              <RefreshCw className="w-5 h-5 text-green-600" />
              <h4 className="font-bold text-green-800">ISO 45001 Framework</h4>
            </div>
            <ul className="space-y-2 text-sm text-green-700">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Proactive hazard identification</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>CAPA-driven continuous improvement</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Near-miss reporting emphasis</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Management review and worker participation</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Incident Classification Guide */}
      <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
        <h3 className="font-bold text-text-primary mb-4">OSHA Incident Classification</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INCIDENT_CLASSIFICATIONS.map(classification => (
            <div key={classification.id} className="p-3 bg-surface-sunken rounded-xl">
              <div className={`px-2 py-1 rounded text-xs font-bold inline-block mb-2 ${classification.color}`}>
                {classification.label}
              </div>
              {classification.oshaRequired && (
                <p className="text-xs text-red-600 font-medium">
                  Report within {classification.reportWithin}
                </p>
              )}
              {!classification.oshaRequired && classification.id !== 'first-aid' && (
                <p className="text-xs text-text-muted">OSHA Recordable</p>
              )}
              {classification.id === 'first-aid' && (
                <p className="text-xs text-green-600">Not recordable</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // OSHA Log Tab
  const renderOSHALog = () => (
    <div className="space-y-6">
      {/* Search and Actions */}
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm"
          />
        </div>
        <button className="px-4 py-2.5 bg-surface-overlay text-text-secondary font-semibold rounded-xl hover:bg-surface-overlay transition-colors flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export 300
        </button>
        <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-5 h-5" />}>Add Entry</SMButton>
      </div>

      {/* OSHA 300 Log Table */}
      <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-soft overflow-hidden">
        <div className="p-4 border-b border-surface-border bg-surface-sunken">
          <h3 className="font-bold text-text-primary">OSHA Form 300 - Log of Work-Related Injuries and Illnesses</h3>
          <p className="text-sm text-text-muted">Year: 2026 | Establishment: Safety Hub Manufacturing Facility</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-sunken border-b border-surface-border">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-text-secondary">Case #</th>
                <th className="px-4 py-3 text-left font-bold text-text-secondary">Employee Name</th>
                <th className="px-4 py-3 text-left font-bold text-text-secondary">Job Title</th>
                <th className="px-4 py-3 text-left font-bold text-text-secondary">Date</th>
                <th className="px-4 py-3 text-left font-bold text-text-secondary">Location</th>
                <th className="px-4 py-3 text-left font-bold text-text-secondary">Classification</th>
                <th className="px-4 py-3 text-center font-bold text-text-secondary">Days Away</th>
                <th className="px-4 py-3 text-center font-bold text-text-secondary">Restricted</th>
                <th className="px-4 py-3 text-center font-bold text-text-secondary">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.filter(i => i.oshaRecordable).map((incident, index) => {
                const classification = getClassificationInfo(incident.classification);
                return (
                  <tr key={incident.id} className={index % 2 === 0 ? 'bg-surface-raised' : 'bg-surface-sunken'}>
                    <td className="px-4 py-3 font-medium">{incident.caseNumber}</td>
                    <td className="px-4 py-3">{incident.employeeName}</td>
                    <td className="px-4 py-3 text-text-secondary">{incident.jobTitle}</td>
                    <td className="px-4 py-3">{incident.dateOfInjury}</td>
                    <td className="px-4 py-3 text-text-secondary">{incident.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${classification?.color}`}>
                        {classification?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{incident.daysAway || '-'}</td>
                    <td className="px-4 py-3 text-center font-medium">{incident.daysRestricted || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 hover:bg-surface-overlay rounded">
                        <Eye className="w-4 h-4 text-text-muted" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // ISO Workflow Tab
  const renderISOWorkflow = () => (
    <div className="space-y-6">
      {/* Stage Filter */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedStage(null)}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            !selectedStage ? 'bg-accent text-text-onAccent' : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
          }`}
        >
          All Stages
        </button>
        {ISO_CAPA_STAGES.map(stage => (
          <button
            key={stage.id}
            onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              selectedStage === stage.id ? 'bg-accent text-text-onAccent' : 'bg-surface-sunken text-text-secondary hover:bg-surface-overlay'
            }`}
          >
            <stage.icon className="w-4 h-4" />
            {stage.label}
          </button>
        ))}
      </div>

      {/* Incident Cards */}
      <div className="space-y-3">
        {filteredIncidents.map((incident, index) => {
          const classification = getClassificationInfo(incident.classification);
          const stage = getStageInfo(incident.isoStage);
          const StageIcon = stage?.icon || FileText;
          
          return (
            <motion.div
              key={incident.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-surface-raised rounded-xl border border-surface-border shadow-soft overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-surface-sunken transition-colors"
                onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <StageIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-text-muted">{incident.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${classification?.color}`}>
                        {classification?.label}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-primary/20 text-primary">
                        {stage?.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-text-primary">{incident.employeeName} - {incident.bodyPart}</h4>
                    <p className="text-sm text-text-muted truncate">{incident.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {incident.dateOfInjury}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {incident.location}
                      </span>
                    </div>
                  </div>
                  {expandedIncident === incident.id ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedIncident === incident.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-border p-4 bg-surface-sunken"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-text-muted">Days Away</span>
                        <p className="font-medium text-text-primary">{incident.daysAway}</p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">Restricted Days</span>
                        <p className="font-medium text-text-primary">{incident.daysRestricted}</p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">OSHA Recordable</span>
                        <p className={`font-medium ${incident.oshaRecordable ? 'text-red-600' : 'text-green-600'}`}>
                          {incident.oshaRecordable ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-text-muted">Form 301</span>
                        <p className={`font-medium ${incident.form301Completed ? 'text-green-600' : 'text-amber-600'}`}>
                          {incident.form301Completed ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-accent/10 text-accent font-medium rounded-lg text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button className="px-3 py-1.5 bg-surface-overlay text-text-secondary font-medium rounded-lg text-sm flex items-center gap-1">
                        <Edit2 className="w-4 h-4" />
                        Update CAPA
                      </button>
                      <button className="px-3 py-1.5 bg-amber-100 text-amber-700 font-medium rounded-lg text-sm flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        Advance Stage
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );

  // Forms Tab
  const renderForms = () => (
    <div className="space-y-6">
      <h3 className="font-bold text-text-primary">OSHA Required Forms</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OSHA_FORMS.map(form => (
          <div key={form.id} className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-bold text-text-primary">{form.label}</h4>
                {form.required && (
                  <span className="text-xs text-red-600 font-medium">Required</span>
                )}
              </div>
            </div>
            <p className="text-sm text-text-secondary mb-4">{form.description}</p>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-accent/10 text-accent font-medium rounded-lg text-sm flex items-center justify-center gap-1">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="flex-1 px-3 py-2 bg-surface-overlay text-text-secondary font-medium rounded-lg text-sm flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 300A Summary Preview */}
      <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-text-primary">Form 300A Summary Preview ({osha300ASummary.year})</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-accent/10 text-accent font-medium rounded-lg text-sm flex items-center gap-1">
              <Download className="w-4 h-4" />
              Export PDF
            </button>
            <button className="px-3 py-1.5 bg-green-100 text-green-700 font-medium rounded-lg text-sm flex items-center gap-1">
              <Upload className="w-4 h-4" />
              Submit to ITA
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-3 bg-surface-sunken rounded-xl">
            <span className="text-xs text-text-muted">Total Recordable Incidents</span>
            <p className="text-2xl font-bold text-text-primary">{osha300ASummary.totalInjuries + osha300ASummary.totalIllnesses}</p>
          </div>
          <div className="p-3 bg-surface-sunken rounded-xl">
            <span className="text-xs text-text-muted">TRIR</span>
            <p className="text-2xl font-bold text-amber-600">{osha300ASummary.trir}</p>
          </div>
          <div className="p-3 bg-surface-sunken rounded-xl">
            <span className="text-xs text-text-muted">DART Rate</span>
            <p className="text-2xl font-bold text-orange-600">{osha300ASummary.dart}</p>
          </div>
          <div className="p-3 bg-surface-sunken rounded-xl">
            <span className="text-xs text-text-muted">Hours Worked</span>
            <p className="text-2xl font-bold text-text-primary">{(osha300ASummary.hoursWorked / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Reporting Tab
  const renderReporting = () => (
    <div className="space-y-6">
      <h3 className="font-bold text-text-primary">OSHA Reporting & Deadlines</h3>
      
      {/* Reporting Timeline */}
      <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
        <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-brand-500" />
          Key Deadlines
        </h4>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h5 className="font-semibold text-red-800">Fatality Reporting</h5>
                <p className="text-xs text-red-600">Within 8 hours of learning of incident</p>
              </div>
            </div>
            <span className="text-sm font-bold text-red-700">IMMEDIATE</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h5 className="font-semibold text-orange-800">Severe Injury Reporting</h5>
                <p className="text-xs text-orange-600">Hospitalization, amputation, eye loss</p>
              </div>
            </div>
            <span className="text-sm font-bold text-orange-700">24 HOURS</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-accent/10 rounded-xl border border-accent/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-accent/20 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h5 className="font-semibold text-accent">Electronic Submission (ITA)</h5>
                <p className="text-xs text-accent">For establishments with 100+ employees</p>
              </div>
            </div>
            <span className="text-sm font-bold text-accent">March 2, 2026</span>
          </div>
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Clipboard className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h5 className="font-semibold text-green-800">Form 300A Posting</h5>
                <p className="text-xs text-green-600">Must be posted in visible location</p>
              </div>
            </div>
            <span className="text-sm font-bold text-green-700">Feb 1 - Apr 30</span>
          </div>
        </div>
      </div>

      {/* Recent OSHA Reports */}
      <div className="bg-surface-raised rounded-2xl p-6 border border-surface-border shadow-soft">
        <h4 className="font-bold text-text-primary mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-500" />
          Recent OSHA Submissions
        </h4>
        <div className="space-y-2">
          {mockOSHAIncidents.filter(i => i.oshaReportedDate).map(incident => (
            <div key={incident.id} className="flex items-center justify-between p-3 bg-surface-sunken rounded-xl">
              <div>
                <p className="font-medium text-text-primary">{incident.id} - {incident.classification}</p>
                <p className="text-xs text-text-muted">Reported to {incident.oshaReportedTo}</p>
              </div>
              <span className="text-sm text-text-secondary">{incident.oshaReportedDate}</span>
            </div>
          ))}
          {mockOSHAIncidents.filter(i => i.oshaReportedDate).length === 0 && (
            <p className="text-sm text-text-muted text-center py-4">No recent OSHA submissions</p>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-text-primary">OSHA & ISO 45001 Workflow</h2>
            <p className="text-sm text-text-muted">Integrated compliance and incident management</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'osha-log', label: 'OSHA 300 Log', icon: FileText },
          { id: 'iso-workflow', label: 'ISO CAPA Workflow', icon: RefreshCw },
          { id: 'forms', label: 'Forms', icon: Clipboard },
          { id: 'reporting', label: 'Reporting', icon: Calendar },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'bg-surface-raised text-text-muted border border-surface-border hover:bg-surface-sunken'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'osha-log' && renderOSHALog()}
          {activeTab === 'iso-workflow' && renderISOWorkflow()}
          {activeTab === 'forms' && renderForms()}
          {activeTab === 'reporting' && renderReporting()}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export default OSHAISOWorkflow;
