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
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-brand-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Recordable</span>
          </div>
          <p className="text-2xl font-bold text-surface-800">{stats.recordableIncidents}</p>
          <p className="text-xs text-surface-500">YTD incidents</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-red-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Days Away</span>
          </div>
          <p className="text-2xl font-bold text-red-600">{stats.totalDaysAway}</p>
          <p className="text-xs text-surface-500">Lost workdays</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-5 h-5 text-amber-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Restricted</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{stats.totalDaysRestricted}</p>
          <p className="text-xs text-surface-500">Restricted days</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-surface-100 shadow-soft">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-bold text-surface-400 uppercase">Pending CAPAs</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{stats.pendingCAPAs}</p>
          <p className="text-xs text-surface-500">Open actions</p>
        </div>
      </div>

      {/* OSHA vs ISO Comparison */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h3 className="font-bold text-brand-900 mb-4">OSHA vs ISO 45001 Approach</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-5 h-5 text-blue-600" />
              <h4 className="font-bold text-blue-800">OSHA Requirements</h4>
            </div>
            <ul className="space-y-2 text-sm text-blue-700">
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
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h3 className="font-bold text-brand-900 mb-4">OSHA Incident Classification</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {INCIDENT_CLASSIFICATIONS.map(classification => (
            <div key={classification.id} className="p-3 bg-surface-50 rounded-xl">
              <div className={`px-2 py-1 rounded text-xs font-bold inline-block mb-2 ${classification.color}`}>
                {classification.label}
              </div>
              {classification.oshaRequired && (
                <p className="text-xs text-red-600 font-medium">
                  Report within {classification.reportWithin}
                </p>
              )}
              {!classification.oshaRequired && classification.id !== 'first-aid' && (
                <p className="text-xs text-surface-500">OSHA Recordable</p>
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
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
          />
        </div>
        <button className="px-4 py-2.5 bg-surface-100 text-surface-700 font-semibold rounded-xl hover:bg-surface-200 transition-colors flex items-center gap-2">
          <Download className="w-5 h-5" />
          Export 300
        </button>
        <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-5 h-5" />}>Add Entry</SMButton>
      </div>

      {/* OSHA 300 Log Table */}
      <div className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden">
        <div className="p-4 border-b border-surface-100 bg-surface-50">
          <h3 className="font-bold text-brand-900">OSHA Form 300 - Log of Work-Related Injuries and Illnesses</h3>
          <p className="text-sm text-surface-500">Year: 2026 | Establishment: Safety Hub Manufacturing Facility</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-surface-50 border-b border-surface-100">
              <tr>
                <th className="px-4 py-3 text-left font-bold text-surface-600">Case #</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600">Employee Name</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600">Job Title</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600">Date</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600">Location</th>
                <th className="px-4 py-3 text-left font-bold text-surface-600">Classification</th>
                <th className="px-4 py-3 text-center font-bold text-surface-600">Days Away</th>
                <th className="px-4 py-3 text-center font-bold text-surface-600">Restricted</th>
                <th className="px-4 py-3 text-center font-bold text-surface-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncidents.filter(i => i.oshaRecordable).map((incident, index) => {
                const classification = getClassificationInfo(incident.classification);
                return (
                  <tr key={incident.id} className={index % 2 === 0 ? 'bg-white' : 'bg-surface-50'}>
                    <td className="px-4 py-3 font-medium">{incident.caseNumber}</td>
                    <td className="px-4 py-3">{incident.employeeName}</td>
                    <td className="px-4 py-3 text-surface-600">{incident.jobTitle}</td>
                    <td className="px-4 py-3">{incident.dateOfInjury}</td>
                    <td className="px-4 py-3 text-surface-600">{incident.location}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${classification?.color}`}>
                        {classification?.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-medium">{incident.daysAway || '-'}</td>
                    <td className="px-4 py-3 text-center font-medium">{incident.daysRestricted || '-'}</td>
                    <td className="px-4 py-3 text-center">
                      <button className="p-1 hover:bg-surface-100 rounded">
                        <Eye className="w-4 h-4 text-surface-500" />
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
            !selectedStage ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
          }`}
        >
          All Stages
        </button>
        {ISO_CAPA_STAGES.map(stage => (
          <button
            key={stage.id}
            onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
              selectedStage === stage.id ? 'bg-brand-500 text-white' : 'bg-surface-50 text-surface-600 hover:bg-surface-100'
            }`}
          >
            <stage.icon className="w-4 h-4" />
            {stage.label}
          </button>
        ))}
      </div>

      {/* CAPA Stage Pipeline */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h3 className="font-bold text-brand-900 mb-4">ISO 45001 CAPA Pipeline</h3>
        <div className="flex items-center justify-between overflow-x-auto pb-4">
          {ISO_CAPA_STAGES.map((stage, index) => {
            const count = mockOSHAIncidents.filter(i => i.isoStage === stage.id).length;
            const StageIcon = stage.icon;
            return (
              <div key={stage.id} className="flex items-center">
                <div
                  onClick={() => setSelectedStage(selectedStage === stage.id ? null : stage.id)}
                  className={`flex flex-col items-center cursor-pointer transition-all ${
                    selectedStage === stage.id ? 'scale-110' : ''
                  }`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    selectedStage === stage.id ? 'bg-brand-500 text-white' : 'bg-surface-100 text-surface-600'
                  }`}>
                    <StageIcon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium text-surface-600 whitespace-nowrap">{stage.label}</span>
                  <span className={`text-lg font-bold ${count > 0 ? 'text-brand-600' : 'text-surface-400'}`}>
                    {count}
                  </span>
                </div>
                {index < ISO_CAPA_STAGES.length - 1 && (
                  <div className="w-8 h-0.5 bg-surface-200 mx-2" />
                )}
              </div>
            );
          })}
        </div>
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
              className="bg-white rounded-xl border border-surface-100 shadow-soft overflow-hidden"
            >
              <div
                className="p-4 cursor-pointer hover:bg-surface-50 transition-colors"
                onClick={() => setExpandedIncident(expandedIncident === incident.id ? null : incident.id)}
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-brand-100 rounded-xl flex items-center justify-center">
                    <StageIcon className="w-5 h-5 text-brand-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold text-surface-400">{incident.id}</span>
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${classification?.color}`}>
                        {classification?.label}
                      </span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-purple-100 text-purple-700">
                        {stage?.label}
                      </span>
                    </div>
                    <h4 className="font-semibold text-surface-800">{incident.employeeName} - {incident.bodyPart}</h4>
                    <p className="text-sm text-surface-500 truncate">{incident.description}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-surface-500">
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
                    <ChevronUp className="w-5 h-5 text-surface-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-surface-400" />
                  )}
                </div>
              </div>

              <AnimatePresence>
                {expandedIncident === incident.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-100 p-4 bg-surface-50"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div>
                        <span className="text-xs text-surface-400">Days Away</span>
                        <p className="font-medium text-surface-800">{incident.daysAway}</p>
                      </div>
                      <div>
                        <span className="text-xs text-surface-400">Restricted Days</span>
                        <p className="font-medium text-surface-800">{incident.daysRestricted}</p>
                      </div>
                      <div>
                        <span className="text-xs text-surface-400">OSHA Recordable</span>
                        <p className={`font-medium ${incident.oshaRecordable ? 'text-red-600' : 'text-green-600'}`}>
                          {incident.oshaRecordable ? 'Yes' : 'No'}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-surface-400">Form 301</span>
                        <p className={`font-medium ${incident.form301Completed ? 'text-green-600' : 'text-amber-600'}`}>
                          {incident.form301Completed ? 'Completed' : 'Pending'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="px-3 py-1.5 bg-brand-100 text-brand-700 font-medium rounded-lg text-sm flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        View Details
                      </button>
                      <button className="px-3 py-1.5 bg-surface-100 text-surface-700 font-medium rounded-lg text-sm flex items-center gap-1">
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
      <h3 className="font-bold text-brand-900">OSHA Required Forms</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OSHA_FORMS.map(form => (
          <div key={form.id} className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-brand-100 rounded-xl flex items-center justify-center">
                <FileText className="w-6 h-6 text-brand-600" />
              </div>
              <div>
                <h4 className="font-bold text-surface-800">{form.label}</h4>
                {form.required && (
                  <span className="text-xs text-red-600 font-medium">Required</span>
                )}
              </div>
            </div>
            <p className="text-sm text-surface-600 mb-4">{form.description}</p>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 bg-brand-100 text-brand-700 font-medium rounded-lg text-sm flex items-center justify-center gap-1">
                <Download className="w-4 h-4" />
                Download
              </button>
              <button className="flex-1 px-3 py-2 bg-surface-100 text-surface-700 font-medium rounded-lg text-sm flex items-center justify-center gap-1">
                <Eye className="w-4 h-4" />
                View
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 300A Summary Preview */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-brand-900">Form 300A Summary Preview ({osha300ASummary.year})</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 bg-brand-100 text-brand-700 font-medium rounded-lg text-sm flex items-center gap-1">
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
          <div className="p-3 bg-surface-50 rounded-xl">
            <span className="text-xs text-surface-400">Total Recordable Incidents</span>
            <p className="text-2xl font-bold text-surface-800">{osha300ASummary.totalInjuries + osha300ASummary.totalIllnesses}</p>
          </div>
          <div className="p-3 bg-surface-50 rounded-xl">
            <span className="text-xs text-surface-400">TRIR</span>
            <p className="text-2xl font-bold text-amber-600">{osha300ASummary.trir}</p>
          </div>
          <div className="p-3 bg-surface-50 rounded-xl">
            <span className="text-xs text-surface-400">DART Rate</span>
            <p className="text-2xl font-bold text-orange-600">{osha300ASummary.dart}</p>
          </div>
          <div className="p-3 bg-surface-50 rounded-xl">
            <span className="text-xs text-surface-400">Hours Worked</span>
            <p className="text-2xl font-bold text-surface-800">{(osha300ASummary.hoursWorked / 1000).toFixed(0)}K</p>
          </div>
        </div>
      </div>
    </div>
  );

  // Reporting Tab
  const renderReporting = () => (
    <div className="space-y-6">
      <h3 className="font-bold text-brand-900">OSHA Reporting & Deadlines</h3>
      
      {/* Reporting Timeline */}
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h4 className="font-bold text-surface-800 mb-4 flex items-center gap-2">
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
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h5 className="font-semibold text-blue-800">Electronic Submission (ITA)</h5>
                <p className="text-xs text-blue-600">For establishments with 100+ employees</p>
              </div>
            </div>
            <span className="text-sm font-bold text-blue-700">March 2, 2026</span>
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
      <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft">
        <h4 className="font-bold text-surface-800 mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-brand-500" />
          Recent OSHA Submissions
        </h4>
        <div className="space-y-2">
          {mockOSHAIncidents.filter(i => i.oshaReportedDate).map(incident => (
            <div key={incident.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
              <div>
                <p className="font-medium text-surface-800">{incident.id} - {incident.classification}</p>
                <p className="text-xs text-surface-500">Reported to {incident.oshaReportedTo}</p>
              </div>
              <span className="text-sm text-surface-600">{incident.oshaReportedDate}</span>
            </div>
          ))}
          {mockOSHAIncidents.filter(i => i.oshaReportedDate).length === 0 && (
            <p className="text-sm text-surface-500 text-center py-4">No recent OSHA submissions</p>
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
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-brand-900">OSHA & ISO 45001 Workflow</h2>
            <p className="text-sm text-surface-500">Integrated compliance and incident management</p>
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
                ? 'bg-brand-100 text-brand-700 border border-brand-200'
                : 'bg-white text-surface-500 border border-surface-100 hover:bg-surface-50'
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
