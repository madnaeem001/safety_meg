import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Camera,
  MapPin,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  CheckSquare,
  Upload,
  Clock,
  Building,
  Shield
} from 'lucide-react';
import { WorkflowStage, ObservationType, IncidentType, Severity, Priority } from '../../../data/mockEHSWorkflow';

interface ActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  actionType: string;
  stage: WorkflowStage;
  onSubmit: (data: Record<string, unknown>) => void;
}

// Form field component
const FormField: React.FC<{
  label: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, required, children }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-medium text-surface-600">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    {children}
  </div>
);

// Observation Form
const ObservationForm: React.FC<{
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'unsafe_condition' as ObservationType,
    title: '',
    description: '',
    location: '',
    riskCategory: '',
    behaviorType: '',
    photoUrl: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: `OBS-${Date.now()}`,
      reportedBy: 'Current User',
      reportedDate: new Date().toISOString(),
      status: 'pending'
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Observation Type" required>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as ObservationType })}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          <option value="unsafe_condition">Unsafe Condition</option>
          <option value="at_risk_behavior">At-Risk Behavior</option>
          <option value="good_catch">Good Catch</option>
          <option value="positive">Positive Observation</option>
        </select>
      </FormField>

      <FormField label="Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of observation"
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          required
        />
      </FormField>

      <FormField label="Description" required>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of what was observed..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </FormField>

      <FormField label="Location" required>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Building / Area / Zone"
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Risk Category">
          <select
            value={formData.riskCategory}
            onChange={(e) => setFormData({ ...formData, riskCategory: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">Select category</option>
            <option value="Fall Hazard">Fall Hazard</option>
            <option value="Electrical">Electrical</option>
            <option value="Chemical">Chemical</option>
            <option value="Ergonomic">Ergonomic</option>
            <option value="Fire">Fire</option>
            <option value="Machine">Machine</option>
            <option value="Other">Other</option>
          </select>
        </FormField>

        <FormField label="Behavior Type">
          <select
            value={formData.behaviorType}
            onChange={(e) => setFormData({ ...formData, behaviorType: e.target.value })}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="">Select type</option>
            <option value="PPE">PPE</option>
            <option value="Housekeeping">Housekeeping</option>
            <option value="Ergonomic">Ergonomic</option>
            <option value="Procedure">Procedure</option>
            <option value="Communication">Communication</option>
          </select>
        </FormField>
      </div>

      <FormField label="Photo / Attachment">
        <div className="border-2 border-dashed border-surface-200 rounded-lg p-4 text-center hover:border-brand-300 transition-colors cursor-pointer">
          <Camera className="w-8 h-8 text-surface-300 mx-auto mb-2" />
          <p className="text-xs text-surface-500">Click to upload or drag and drop</p>
          <p className="text-[10px] text-surface-400 mt-1">PNG, JPG up to 10MB</p>
        </div>
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors"
        >
          Submit Observation
        </button>
      </div>
    </form>
  );
};

// Incident Form
const IncidentForm: React.FC<{
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'near_miss' as IncidentType,
    title: '',
    description: '',
    location: '',
    severity: 'medium' as Severity,
    oshaRecordable: false,
    employeeName: '',
    bodyPartAffected: '',
    injuryType: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const incidentData: Record<string, unknown> = {
      ...formData,
      id: `INC-${Date.now()}`,
      reportedBy: 'Current User',
      reportedDate: new Date().toISOString(),
      status: 'pending',
      aiSuggestedDescription: formData.type === 'injury' 
        ? `Worker experienced a ${formData.injuryType?.toLowerCase() || 'injury'} to the ${formData.bodyPartAffected?.toLowerCase() || 'body'} during operations.`
        : undefined
    };
    if (formData.oshaRecordable) {
      incidentData.oshaFields = {
        caseNumber: `OSHA-${Date.now()}`,
        employeeName: formData.employeeName,
        dateOfInjury: new Date().toISOString().split('T')[0],
        bodyPartAffected: formData.bodyPartAffected,
        injuryType: formData.injuryType
      };
    }
    onSubmit(incidentData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Incident Type" required>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as IncidentType })}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          <option value="injury">Injury</option>
          <option value="near_miss">Near Miss</option>
          <option value="property_damage">Property Damage</option>
          <option value="environmental">Environmental</option>
          <option value="security">Security</option>
        </select>
      </FormField>

      <FormField label="Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Brief description of incident"
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          required
        />
      </FormField>

      <FormField label="Description" required>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of what happened..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Location" required>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Location"
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </FormField>

        <FormField label="Severity" required>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </FormField>
      </div>

      {formData.type === 'injury' && (
        <div className="p-3 bg-red-50 rounded-lg border border-red-100 space-y-3">
          <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            Injury Details (OSHA)
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Employee Name">
              <input
                type="text"
                value={formData.employeeName}
                onChange={(e) => setFormData({ ...formData, employeeName: e.target.value })}
                placeholder="Full name"
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              />
            </FormField>
            <FormField label="Body Part Affected">
              <select
                value={formData.bodyPartAffected}
                onChange={(e) => setFormData({ ...formData, bodyPartAffected: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
              >
                <option value="">Select</option>
                <option value="Head">Head</option>
                <option value="Eyes">Eyes</option>
                <option value="Neck">Neck</option>
                <option value="Back">Back</option>
                <option value="Shoulder">Shoulder</option>
                <option value="Arm">Arm</option>
                <option value="Hand">Hand</option>
                <option value="Leg">Leg</option>
                <option value="Foot">Foot</option>
                <option value="Multiple">Multiple</option>
              </select>
            </FormField>
          </div>
          <FormField label="Injury Type">
            <select
              value={formData.injuryType}
              onChange={(e) => setFormData({ ...formData, injuryType: e.target.value })}
              className="w-full px-3 py-2 text-sm border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent bg-white"
            >
              <option value="">Select type</option>
              <option value="Laceration">Laceration</option>
              <option value="Contusion">Contusion</option>
              <option value="Fracture">Fracture</option>
              <option value="Sprain/Strain">Sprain/Strain</option>
              <option value="Burn">Burn</option>
              <option value="Chemical Exposure">Chemical Exposure</option>
              <option value="Eye Injury">Eye Injury</option>
              <option value="Other">Other</option>
            </select>
          </FormField>
        </div>
      )}

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="oshaRecordable"
          checked={formData.oshaRecordable}
          onChange={(e) => setFormData({ ...formData, oshaRecordable: e.target.checked })}
          className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
        />
        <label htmlFor="oshaRecordable" className="text-xs text-surface-600">
          OSHA Recordable Incident
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
        >
          Report Incident
        </button>
      </div>
    </form>
  );
};

// CAPA Assignment Form
const CAPAForm: React.FC<{
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
    priority: 'medium' as Priority,
    severity: 'medium' as Severity,
    sourceType: 'incident' as 'incident' | 'audit' | 'observation' | 'inspection',
    sourceId: '',
    verificationRequired: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: `CAPA-${Date.now()}`,
      assignedDate: new Date().toISOString(),
      status: 'pending',
      escalated: false
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Action Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Corrective action title"
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          required
        />
      </FormField>

      <FormField label="Description" required>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Detailed description of the corrective action..."
          rows={3}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
          required
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Assign To" required>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={formData.assignedTo}
              onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              placeholder="Person or team"
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </FormField>

        <FormField label="Due Date" required>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Priority" required>
          <select
            value={formData.priority}
            onChange={(e) => setFormData({ ...formData, priority: e.target.value as Priority })}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </FormField>

        <FormField label="Severity" required>
          <select
            value={formData.severity}
            onChange={(e) => setFormData({ ...formData, severity: e.target.value as Severity })}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </FormField>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Source Type">
          <select
            value={formData.sourceType}
            onChange={(e) => setFormData({ ...formData, sourceType: e.target.value as 'incident' | 'audit' | 'observation' | 'inspection' })}
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          >
            <option value="incident">Incident</option>
            <option value="audit">Audit</option>
            <option value="observation">Observation</option>
            <option value="inspection">Inspection</option>
          </select>
        </FormField>

        <FormField label="Source ID">
          <input
            type="text"
            value={formData.sourceId}
            onChange={(e) => setFormData({ ...formData, sourceId: e.target.value })}
            placeholder="e.g., INC-2026-001"
            className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </FormField>
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="verificationRequired"
          checked={formData.verificationRequired}
          onChange={(e) => setFormData({ ...formData, verificationRequired: e.target.checked })}
          className="w-4 h-4 text-brand-600 border-surface-300 rounded focus:ring-brand-500"
        />
        <label htmlFor="verificationRequired" className="text-xs text-surface-600">
          Verification required after completion
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-colors"
        >
          Assign CAPA
        </button>
      </div>
    </form>
  );
};

// Audit Form
const AuditForm: React.FC<{
  onSubmit: (data: Record<string, unknown>) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    type: 'scheduled' as 'scheduled' | 'adhoc' | 'regulatory' | 'internal',
    title: '',
    templateName: '',
    location: '',
    scheduledDate: '',
    auditor: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      id: `AUD-${Date.now()}`,
      status: 'pending',
      findings: [],
      capaIds: []
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Audit Type" required>
        <select
          value={formData.type}
          onChange={(e) => setFormData({ ...formData, type: e.target.value as 'scheduled' | 'adhoc' | 'regulatory' | 'internal' })}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          <option value="scheduled">Scheduled</option>
          <option value="adhoc">Ad Hoc</option>
          <option value="regulatory">Regulatory</option>
          <option value="internal">Internal</option>
        </select>
      </FormField>

      <FormField label="Audit Title" required>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Audit title"
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          required
        />
      </FormField>

      <FormField label="Template / Checklist">
        <select
          value={formData.templateName}
          onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
          className="w-full px-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
        >
          <option value="">Select template</option>
          <option value="NFPA 101 Life Safety">NFPA 101 Life Safety</option>
          <option value="PPE Compliance Checklist">PPE Compliance</option>
          <option value="SWPPP Compliance">SWPPP Compliance</option>
          <option value="ISO 45001 Audit">ISO 45001</option>
          <option value="General Safety Walk">General Safety</option>
        </select>
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="Location" required>
          <div className="relative">
            <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="Area to audit"
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </FormField>

        <FormField label="Scheduled Date" required>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
            <input
              type="datetime-local"
              value={formData.scheduledDate}
              onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              required
            />
          </div>
        </FormField>
      </div>

      <FormField label="Auditor" required>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
          <input
            type="text"
            value={formData.auditor}
            onChange={(e) => setFormData({ ...formData, auditor: e.target.value })}
            placeholder="Assigned auditor"
            className="w-full pl-9 pr-3 py-2 text-sm border border-surface-200 rounded-lg focus:ring-2 focus:ring-brand-500 focus:border-transparent"
            required
          />
        </div>
      </FormField>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 text-sm font-medium text-white bg-teal-600 rounded-lg hover:bg-teal-700 transition-colors"
        >
          Schedule Audit
        </button>
      </div>
    </form>
  );
};

export const ActionModal: React.FC<ActionModalProps> = ({
  isOpen,
  onClose,
  actionType,
  stage,
  onSubmit
}) => {
  const getTitle = () => {
    switch (actionType) {
      case 'submit_observation': return 'Submit Observation';
      case 'report_incident': return 'Report Incident';
      case 'start_investigation': return 'Start Investigation';
      case 'assign_capa': return 'Assign Corrective Action';
      case 'schedule_audit': return 'Schedule Audit';
      case 'record_bbs': return 'Record BBS Observation';
      case 'add_obligation': return 'Add Compliance Obligation';
      default: return 'New Entry';
    }
  };

  const renderForm = () => {
    switch (actionType) {
      case 'submit_observation':
        return <ObservationForm onSubmit={onSubmit} onCancel={onClose} />;
      case 'report_incident':
        return <IncidentForm onSubmit={onSubmit} onCancel={onClose} />;
      case 'assign_capa':
        return <CAPAForm onSubmit={onSubmit} onCancel={onClose} />;
      case 'schedule_audit':
        return <AuditForm onSubmit={onSubmit} onCancel={onClose} />;
      default:
        return (
          <div className="text-center py-8 text-surface-500">
            <p className="text-sm">Form for "{actionType}" coming soon</p>
            <button
              onClick={onClose}
              className="mt-4 px-4 py-2 text-sm font-medium text-surface-600 bg-surface-100 rounded-lg hover:bg-surface-200 transition-colors"
            >
              Close
            </button>
          </div>
        );
    }
  };

  const modalContent = (
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

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 pointer-events-none">
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="pointer-events-auto w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
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
                {renderForm()}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );

  if (typeof document === 'undefined') {
    return modalContent;
  }

  return createPortal(modalContent, document.body);
};

export default ActionModal;
