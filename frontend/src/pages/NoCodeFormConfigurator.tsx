import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FadeContent from '../components/animations/FadeContent';
import { useCreateFormConfig, useUpdateFormConfig, useDeleteFormConfig } from '../api/hooks/useAPIHooks';

// Field type definitions
interface FormField {
  id: string;
  type: 'text' | 'number' | 'email' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'date' | 'time' | 'file' | 'signature' | 'location' | 'photo';
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    min?: number;
    max?: number;
  };
  helpText?: string;
  conditional?: {
    dependsOn: string;
    showWhen: string;
  };
}

interface FormConfig {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: FormField[];
  createdAt: Date;
  updatedAt: Date;
  status: 'draft' | 'published' | 'archived';
}

const fieldTypes = [
  { type: 'text', label: 'Text Input', icon: '📝', description: 'Single line text' },
  { type: 'textarea', label: 'Text Area', icon: '📄', description: 'Multi-line text' },
  { type: 'number', label: 'Number', icon: '🔢', description: 'Numeric input' },
  { type: 'email', label: 'Email', icon: '📧', description: 'Email address' },
  { type: 'select', label: 'Dropdown', icon: '📋', description: 'Select from list' },
  { type: 'radio', label: 'Radio Group', icon: '⚪', description: 'Single choice' },
  { type: 'checkbox', label: 'Checkbox', icon: '☑️', description: 'Multiple choice' },
  { type: 'date', label: 'Date Picker', icon: '📅', description: 'Date selection' },
  { type: 'time', label: 'Time Picker', icon: '⏰', description: 'Time selection' },
  { type: 'file', label: 'File Upload', icon: '📎', description: 'Attach files' },
  { type: 'signature', label: 'Signature', icon: '✍️', description: 'Digital signature' },
  { type: 'location', label: 'Location', icon: '📍', description: 'GPS coordinates' },
  { type: 'photo', label: 'Photo Capture', icon: '📷', description: 'Camera capture' },
];

const formTemplates = [
  { id: 'blank', name: 'Blank Form', icon: '📄', description: 'Start from scratch' },
  { id: 'safety-inspection', name: 'Safety Inspection', icon: '🔍', description: 'Site inspection checklist' },
  { id: 'incident-report', name: 'Incident Report', icon: '⚠️', description: 'Quick incident logging' },
  { id: 'jsa', name: 'Job Safety Analysis', icon: '📋', description: 'Pre-task analysis' },
  { id: 'toolbox-talk', name: 'Toolbox Talk', icon: '🗣️', description: 'Safety meeting record' },
  { id: 'equipment-check', name: 'Equipment Check', icon: '🔧', description: 'Daily equipment inspection' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 100, damping: 15 }
  }
};

export const NoCodeFormConfigurator: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'templates' | 'builder' | 'preview' | 'settings'>('templates');
  const [formConfig, setFormConfig] = useState<FormConfig>({
    id: `FORM-${Date.now()}`,
    name: 'New Safety Form',
    description: '',
    category: 'general',
    fields: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'draft',
  });
  const [selectedField, setSelectedField] = useState<FormField | null>(null);
  const [draggedType, setDraggedType] = useState<string | null>(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // ── Saved DB id (null = form never persisted) ──────────────────────────────
  const [savedDbId, setSavedDbId] = useState<number | null>(null);

  // ── API mutations ──────────────────────────────────────────────────────────
  const { mutate: createFormMutate } = useCreateFormConfig();
  const { mutate: updateFormMutate } = useUpdateFormConfig();
  const { mutate: deleteFormMutate } = useDeleteFormConfig();

  // Generate unique field ID
  const generateFieldId = () => `field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Add new field from template
  const addField = useCallback((type: string) => {
    const fieldConfig = fieldTypes.find(f => f.type === type);
    if (!fieldConfig) return;

    const newField: FormField = {
      id: generateFieldId(),
      type: type as FormField['type'],
      label: `New ${fieldConfig.label}`,
      placeholder: '',
      required: false,
      options: ['select', 'radio', 'checkbox'].includes(type) ? ['Option 1', 'Option 2'] : undefined,
    };

    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
      updatedAt: new Date(),
    }));
    setSelectedField(newField);
  }, []);

  // Update field configuration
  const updateField = useCallback((fieldId: string, updates: Partial<FormField>) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f),
      updatedAt: new Date(),
    }));
    if (selectedField?.id === fieldId) {
      setSelectedField(prev => prev ? { ...prev, ...updates } : null);
    }
  }, [selectedField]);

  // Delete field
  const deleteField = useCallback((fieldId: string) => {
    setFormConfig(prev => ({
      ...prev,
      fields: prev.fields.filter(f => f.id !== fieldId),
      updatedAt: new Date(),
    }));
    if (selectedField?.id === fieldId) {
      setSelectedField(null);
    }
  }, [selectedField]);

  // Duplicate field
  const duplicateField = useCallback((field: FormField) => {
    const newField: FormField = {
      ...field,
      id: generateFieldId(),
      label: `${field.label} (Copy)`,
    };
    setFormConfig(prev => ({
      ...prev,
      fields: [...prev.fields, newField],
      updatedAt: new Date(),
    }));
  }, []);

  // Load template
  const loadTemplate = useCallback((templateId: string) => {
    let templateFields: FormField[] = [];

    switch (templateId) {
      case 'safety-inspection':
        templateFields = [
          { id: generateFieldId(), type: 'text', label: 'Inspector Name', required: true },
          { id: generateFieldId(), type: 'date', label: 'Inspection Date', required: true },
          { id: generateFieldId(), type: 'location', label: 'Location', required: true },
          { id: generateFieldId(), type: 'select', label: 'Area Type', required: true, options: ['Office', 'Warehouse', 'Construction Site', 'Manufacturing Floor'] },
          { id: generateFieldId(), type: 'radio', label: 'Overall Condition', required: true, options: ['Satisfactory', 'Needs Improvement', 'Unsatisfactory'] },
          { id: generateFieldId(), type: 'checkbox', label: 'Hazards Identified', required: false, options: ['Slip/Trip', 'Electrical', 'Fire', 'Chemical', 'Ergonomic'] },
          { id: generateFieldId(), type: 'textarea', label: 'Observations', required: false },
          { id: generateFieldId(), type: 'photo', label: 'Photos', required: false },
          { id: generateFieldId(), type: 'signature', label: 'Inspector Signature', required: true },
        ];
        break;
      case 'incident-report':
        templateFields = [
          { id: generateFieldId(), type: 'date', label: 'Date of Incident', required: true },
          { id: generateFieldId(), type: 'time', label: 'Time of Incident', required: true },
          { id: generateFieldId(), type: 'location', label: 'Location', required: true },
          { id: generateFieldId(), type: 'select', label: 'Incident Type', required: true, options: ['Near Miss', 'First Aid', 'Recordable', 'Lost Time'] },
          { id: generateFieldId(), type: 'textarea', label: 'Description', required: true },
          { id: generateFieldId(), type: 'text', label: 'Persons Involved', required: false },
          { id: generateFieldId(), type: 'photo', label: 'Evidence Photos', required: false },
          { id: generateFieldId(), type: 'signature', label: 'Reporter Signature', required: true },
        ];
        break;
      case 'jsa':
        templateFields = [
          { id: generateFieldId(), type: 'text', label: 'Job/Task Name', required: true },
          { id: generateFieldId(), type: 'date', label: 'Date', required: true },
          { id: generateFieldId(), type: 'text', label: 'Work Location', required: true },
          { id: generateFieldId(), type: 'textarea', label: 'Job Steps', required: true, helpText: 'List each step of the job' },
          { id: generateFieldId(), type: 'textarea', label: 'Potential Hazards', required: true },
          { id: generateFieldId(), type: 'textarea', label: 'Controls/PPE Required', required: true },
          { id: generateFieldId(), type: 'checkbox', label: 'Required PPE', required: true, options: ['Hard Hat', 'Safety Glasses', 'Gloves', 'Steel Toe Boots', 'Hi-Vis Vest', 'Hearing Protection', 'Respirator'] },
          { id: generateFieldId(), type: 'signature', label: 'Supervisor Approval', required: true },
        ];
        break;
      default:
        templateFields = [];
    }

    const template = formTemplates.find(t => t.id === templateId);
    setFormConfig(prev => ({
      ...prev,
      name: template?.name || 'New Form',
      description: template?.description || '',
      fields: templateFields,
      updatedAt: new Date(),
    }));
    setActiveTab('builder');
  }, []);

  // Handle drag start
  const handleDragStart = (type: string) => {
    setDraggedType(type);
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (draggedType) {
      addField(draggedType);
    }
    setDraggedType(null);
  };

  // Save form to backend
  const handleSave = async () => {
    const payload = {
      clientId: formConfig.id,
      name: formConfig.name,
      description: formConfig.description,
      category: formConfig.category,
      fields: formConfig.fields as any[],
      status: formConfig.status,
    };
    if (savedDbId === null) {
      const result = await createFormMutate(payload);
      if (result !== null) {
        setSavedDbId(result.id);
        setShowSaveModal(true);
      }
    } else {
      const result = await updateFormMutate({
        id: savedDbId,
        name: formConfig.name,
        description: formConfig.description,
        category: formConfig.category,
        fields: formConfig.fields as any[],
        status: formConfig.status,
      });
      if (result !== null) setShowSaveModal(true);
    }
  };

  // Delete form from backend (or just go back if never saved)
  const handleDelete = async () => {
    if (savedDbId === null) { navigate(-1); return; }
    const result = await deleteFormMutate(savedDbId);
    if (result !== null) navigate(-1);
  };

  // Render field preview
  const renderFieldPreview = (field: FormField) => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <input
            type={field.type}
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600"
            disabled
          />
        );
      case 'textarea':
        return (
          <textarea
            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}`}
            rows={3}
            className="w-full px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600"
            disabled
          />
        );
      case 'select':
        return (
          <select className="w-full px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600" disabled>
            <option>Select an option...</option>
            {field.options?.map((opt, i) => <option key={i}>{opt}</option>)}
          </select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="radio" name={field.id} disabled />
                <span className="text-surface-700 dark:text-surface-300">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((opt, i) => (
              <label key={i} className="flex items-center gap-2">
                <input type="checkbox" disabled />
                <span className="text-surface-700 dark:text-surface-300">{opt}</span>
              </label>
            ))}
          </div>
        );
      case 'date':
        return <input type="date" className="w-full px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600" disabled />;
      case 'time':
        return <input type="time" className="w-full px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600" disabled />;
      case 'file':
        return (
          <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-4 text-center">
            <span className="text-2xl">📎</span>
            <p className="text-sm text-surface-500 mt-1">Click to upload or drag & drop</p>
          </div>
        );
      case 'signature':
        return (
          <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-8 text-center bg-surface-50 dark:bg-surface-800">
            <span className="text-2xl">✍️</span>
            <p className="text-sm text-surface-500 mt-1">Tap to sign</p>
          </div>
        );
      case 'location':
        return (
          <div className="flex gap-2">
            <input type="text" placeholder="Latitude" className="flex-1 px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600" disabled />
            <input type="text" placeholder="Longitude" className="flex-1 px-3 py-2 border border-surface-300 rounded-lg bg-white dark:bg-surface-700 dark:border-surface-600" disabled />
            <button className="px-3 py-2 bg-brand-500 text-white rounded-lg" disabled>📍</button>
          </div>
        );
      case 'photo':
        return (
          <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-lg p-4 text-center">
            <span className="text-2xl">📷</span>
            <p className="text-sm text-surface-500 mt-1">Tap to capture photo</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <FadeContent blur duration={400} delay={0}>
      <div className="page-wrapper">
        {/* Header */}
        <header className="sticky top-[72px] z-40 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700 shadow-sm">
          <div className="px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="page-title">Form Builder</h1>
                  <p className="text-xs text-surface-500">No-Code Configuration</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  formConfig.status === 'draft' ? 'bg-amber-100 text-amber-700' :
                  formConfig.status === 'published' ? 'bg-green-100 text-green-700' :
                  'bg-surface-200 text-surface-600'
                }`}>
                  {formConfig.status}
                </span>
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
                >
                  Save Form
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
              {[
                { id: 'templates', label: 'Templates', icon: '📑' },
                { id: 'builder', label: 'Builder', icon: '🔧' },
                { id: 'preview', label: 'Preview', icon: '👁️' },
                { id: 'settings', label: 'Settings', icon: '⚙️' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4">
          <AnimatePresence mode="wait">
            {/* Templates Tab */}
            {activeTab === 'templates' && (
              <motion.div
                key="templates"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.p variants={itemVariants} className="text-surface-600 dark:text-surface-400">
                  Choose a template to get started quickly, or create a blank form from scratch.
                </motion.p>
                <motion.div variants={containerVariants} className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formTemplates.map(template => (
                    <motion.button
                      key={template.id}
                      variants={itemVariants}
                      onClick={() => loadTemplate(template.id)}
                      className="p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 hover:border-brand-400 dark:hover:border-brand-500 transition-all text-left group"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <span className="text-3xl">{template.icon}</span>
                      <h3 className="mt-2 font-semibold text-text-primary group-hover:text-brand-600">
                        {template.name}
                      </h3>
                      <p className="text-sm text-surface-500 mt-1">{template.description}</p>
                    </motion.button>
                  ))}
                </motion.div>
              </motion.div>
            )}

            {/* Builder Tab */}
            {activeTab === 'builder' && (
              <motion.div
                key="builder"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="grid grid-cols-1 lg:grid-cols-12 gap-4"
              >
                {/* Field Palette */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                  <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sticky top-32">
                    <h3 className="font-semibold text-text-primary mb-3">Field Types</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {fieldTypes.map(field => (
                        <button
                          key={field.type}
                          draggable
                          onDragStart={() => handleDragStart(field.type)}
                          onDragEnd={handleDragEnd}
                          onClick={() => addField(field.type)}
                          className="p-2 text-left bg-surface-50 dark:bg-surface-700 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors group cursor-grab active:cursor-grabbing"
                        >
                          <span className="text-lg">{field.icon}</span>
                          <p className="text-xs font-medium text-surface-700 dark:text-surface-300 mt-1 truncate">
                            {field.label}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Form Canvas */}
                <motion.div
                  variants={itemVariants}
                  className="lg:col-span-6"
                  ref={dropZoneRef}
                >
                  <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 min-h-[400px]">
                    {/* Form Name */}
                    <div className="p-4 border-b border-surface-200 dark:border-surface-700">
                      <input
                        type="text"
                        value={formConfig.name}
                        onChange={(e) => setFormConfig(prev => ({ ...prev, name: e.target.value }))}
                        className="text-xl font-semibold bg-transparent border-none focus:outline-none w-full text-text-primary"
                        placeholder="Form Name"
                      />
                      <input
                        type="text"
                        value={formConfig.description}
                        onChange={(e) => setFormConfig(prev => ({ ...prev, description: e.target.value }))}
                        className="text-sm text-surface-500 bg-transparent border-none focus:outline-none w-full mt-1"
                        placeholder="Add a description..."
                      />
                    </div>

                    {/* Fields */}
                    <div className="p-4 space-y-4">
                      {formConfig.fields.length === 0 ? (
                        <div className="border-2 border-dashed border-surface-300 dark:border-surface-600 rounded-xl p-8 text-center">
                          <span className="text-4xl">📝</span>
                          <h4 className="font-medium text-surface-700 dark:text-surface-300 mt-3">
                            Drag fields here to build your form
                          </h4>
                          <p className="text-sm text-surface-500 mt-1">
                            Or click on field types from the palette
                          </p>
                        </div>
                      ) : (
                        <Reorder.Group
                          axis="y"
                          values={formConfig.fields}
                          onReorder={(newFields) => setFormConfig(prev => ({ ...prev, fields: newFields }))}
                          className="space-y-3"
                        >
                          {formConfig.fields.map((field) => (
                            <Reorder.Item
                              key={field.id}
                              value={field}
                              className={`p-4 bg-surface-50 dark:bg-surface-700 rounded-xl border-2 transition-all cursor-grab active:cursor-grabbing ${
                                selectedField?.id === field.id
                                  ? 'border-brand-500'
                                  : 'border-transparent hover:border-surface-300 dark:hover:border-surface-600'
                              }`}
                              onClick={() => setSelectedField(field)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-lg">
                                    {fieldTypes.find(f => f.type === field.type)?.icon}
                                  </span>
                                  <span className="font-medium text-text-primary">
                                    {field.label}
                                  </span>
                                  {field.required && (
                                    <span className="text-red-500 text-sm">*</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); duplicateField(field); }}
                                    className="p-1.5 hover:bg-surface-200 dark:hover:bg-surface-600 rounded transition-colors"
                                    title="Duplicate"
                                  >
                                    📋
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); deleteField(field.id); }}
                                    className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded transition-colors"
                                    title="Delete"
                                  >
                                    🗑️
                                  </button>
                                </div>
                              </div>
                              {renderFieldPreview(field)}
                              {field.helpText && (
                                <p className="text-xs text-surface-500 mt-2">{field.helpText}</p>
                              )}
                            </Reorder.Item>
                          ))}
                        </Reorder.Group>
                      )}
                    </div>
                  </div>
                </motion.div>

                {/* Field Properties */}
                <motion.div variants={itemVariants} className="lg:col-span-3">
                  <div className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4 sticky top-32">
                    <h3 className="font-semibold text-text-primary mb-3">
                      {selectedField ? 'Field Properties' : 'Select a Field'}
                    </h3>
                    
                    {selectedField ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Label
                          </label>
                          <input
                            type="text"
                            value={selectedField.label}
                            onChange={(e) => updateField(selectedField.id, { label: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Placeholder
                          </label>
                          <input
                            type="text"
                            value={selectedField.placeholder || ''}
                            onChange={(e) => updateField(selectedField.id, { placeholder: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                            Help Text
                          </label>
                          <input
                            type="text"
                            value={selectedField.helpText || ''}
                            onChange={(e) => updateField(selectedField.id, { helpText: e.target.value })}
                            className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                            placeholder="Additional instructions..."
                          />
                        </div>

                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={selectedField.required}
                            onChange={(e) => updateField(selectedField.id, { required: e.target.checked })}
                            className="rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                          />
                          <span className="text-sm text-surface-700 dark:text-surface-300">Required field</span>
                        </label>

                        {['select', 'radio', 'checkbox'].includes(selectedField.type) && (
                          <div>
                            <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                              Options
                            </label>
                            <div className="space-y-2">
                              {selectedField.options?.map((opt, i) => (
                                <div key={i} className="flex gap-2">
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const newOptions = [...(selectedField.options || [])];
                                      newOptions[i] = e.target.value;
                                      updateField(selectedField.id, { options: newOptions });
                                    }}
                                    className="flex-1 px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                                  />
                                  <button
                                    onClick={() => {
                                      const newOptions = selectedField.options?.filter((_, idx) => idx !== i);
                                      updateField(selectedField.id, { options: newOptions });
                                    }}
                                    className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => {
                                  const newOptions = [...(selectedField.options || []), `Option ${(selectedField.options?.length || 0) + 1}`];
                                  updateField(selectedField.id, { options: newOptions });
                                }}
                                className="w-full py-2 border border-dashed border-surface-300 dark:border-surface-600 rounded-lg text-surface-600 dark:text-surface-400 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                              >
                                + Add Option
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-surface-500">
                        Click on a field in the form to edit its properties
                      </p>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Preview Tab */}
            {activeTab === 'preview' && (
              <motion.div
                key="preview"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="max-w-2xl mx-auto"
              >
                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 overflow-hidden">
                  <div className="bg-brand-500 text-white p-6">
                    <h2 className="text-xl font-semibold">{formConfig.name}</h2>
                    {formConfig.description && (
                      <p className="text-brand-100 mt-1">{formConfig.description}</p>
                    )}
                  </div>
                  
                  <div className="p-6 space-y-6">
                    {formConfig.fields.length === 0 ? (
                      <p className="text-center text-surface-500 py-8">
                        No fields added yet. Go to Builder to add fields.
                      </p>
                    ) : (
                      formConfig.fields.map((field) => (
                        <div key={field.id}>
                          <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </label>
                          {renderFieldPreview(field)}
                          {field.helpText && (
                            <p className="text-xs text-surface-500 mt-1">{field.helpText}</p>
                          )}
                        </div>
                      ))
                    )}
                    
                    {formConfig.fields.length > 0 && (
                      <button className="w-full py-3 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
                        Submit Form
                      </button>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <motion.div
                key="settings"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="max-w-2xl mx-auto space-y-4"
              >
                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Form Settings</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Form Category
                      </label>
                      <select
                        value={formConfig.category}
                        onChange={(e) => setFormConfig(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                      >
                        <option value="general">General</option>
                        <option value="safety">Safety</option>
                        <option value="inspection">Inspection</option>
                        <option value="incident">Incident</option>
                        <option value="training">Training</option>
                        <option value="audit">Audit</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Status
                      </label>
                      <div className="flex gap-2">
                        {['draft', 'published', 'archived'].map(status => (
                          <button
                            key={status}
                            onClick={() => setFormConfig(prev => ({ ...prev, status: status as FormConfig['status'] }))}
                            className={`px-4 py-2 rounded-lg font-medium capitalize transition-colors ${
                              formConfig.status === status
                                ? 'bg-brand-500 text-white'
                                : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Form Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-surface-500">Form ID</span>
                      <span className="font-mono text-surface-700 dark:text-surface-300">{formConfig.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Fields</span>
                      <span className="text-surface-700 dark:text-surface-300">{formConfig.fields.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Created</span>
                      <span className="text-surface-700 dark:text-surface-300">
                        {formConfig.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-surface-500">Last Updated</span>
                      <span className="text-surface-700 dark:text-surface-300">
                        {formConfig.updatedAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800 p-4">
                  <h3 className="font-semibold text-red-700 dark:text-red-400 mb-2">Danger Zone</h3>
                  <p className="text-sm text-red-600 dark:text-red-400 mb-3">
                    This action cannot be undone. All form data will be permanently deleted.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors" onClick={handleDelete}>
                    Delete Form
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Save Modal */}
        <AnimatePresence>
          {showSaveModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowSaveModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white dark:bg-surface-800 rounded-xl p-6 max-w-md w-full"
                onClick={e => e.stopPropagation()}
              >
                <div className="text-center">
                  <span className="text-4xl">✅</span>
                  <h3 className="text-lg font-semibold text-text-primary mt-3">Form Saved!</h3>
                  <p className="text-surface-600 dark:text-surface-400 mt-2">
                    Your form "{formConfig.name}" has been saved successfully.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowSaveModal(false)}
                      className="flex-1 py-2 border border-surface-300 dark:border-surface-600 rounded-lg font-medium hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors"
                    >
                      Continue Editing
                    </button>
                    <button
                      onClick={() => navigate(-1)}
                      className="flex-1 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </FadeContent>
  );
};

export default NoCodeFormConfigurator;
