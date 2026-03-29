import React, { useState } from 'react';
import { FileText, Plus, Save, Layout, Type, CheckSquare, Image as ImageIcon, Trash2, Move } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCreateCustomReport, useUpdateCustomReport } from '../api/hooks/useAPIHooks';

interface ReportElement {
  id: string;
  type: 'text' | 'checkbox' | 'image' | 'header';
  label: string;
  required: boolean;
}

export const CustomReportBuilder: React.FC = () => {
  const [reportName, setReportName] = useState('New Custom Report');
  const [elements, setElements] = useState<ReportElement[]>([]);
  const [savedReportId, setSavedReportId] = useState<number | null>(null);

  const createReport = useCreateCustomReport();
  const updateReport = useUpdateCustomReport();

  const handleSaveTemplate = async () => {
    const payload = { reportName, elements };
    if (savedReportId) {
      await updateReport.mutate({ id: savedReportId, data: payload });
    } else {
      const result = await createReport.mutate(payload);
      if (result?.id) setSavedReportId(result.id);
    }
  };

  const addElement = (type: ReportElement['type']) => {
    const newElement: ReportElement = {
      id: Date.now().toString(),
      type,
      label: type === 'header' ? 'Section Header' : `New ${type} field`,
      required: false
    };
    setElements([...elements, newElement]);
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(e => e.id !== id));
  };

  const updateElement = (id: string, updates: Partial<ReportElement>) => {
    setElements(elements.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  return (
    <div className="page-wrapper">

      
      <div className="max-w-[1920px] mx-auto px-4 md:px-6 pt-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="page-title">Custom Report Builder</h1>
            <p className="page-subtitle mt-1">Design tailored safety reports for your organization</p>
          </div>
          <button
            onClick={handleSaveTemplate}
            disabled={createReport.loading || updateReport.loading}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            Save Template
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Sidebar - Tools */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-surface-raised rounded-2xl p-6 shadow-sm border border-surface-border">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Layout className="w-4 h-4" />
                Toolbox
              </h3>
              <div className="space-y-3">
                <button onClick={() => addElement('header')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-sunken border border-transparent hover:border-surface-border transition-all text-left">
                  <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
                    <Type className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Section Header</p>
                    <p className="text-xs text-text-muted">Organize your report</p>
                  </div>
                </button>
                <button onClick={() => addElement('text')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-sunken border border-transparent hover:border-surface-border transition-all text-left">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Text Field</p>
                    <p className="text-xs text-text-muted">Single or multi-line</p>
                  </div>
                </button>
                <button onClick={() => addElement('checkbox')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-sunken border border-transparent hover:border-surface-border transition-all text-left">
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg">
                    <CheckSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Checkbox</p>
                    <p className="text-xs text-text-muted">Yes/No or multiple choice</p>
                  </div>
                </button>
                <button onClick={() => addElement('image')} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-sunken border border-transparent hover:border-surface-border transition-all text-left">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                    <ImageIcon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">Image Upload</p>
                    <p className="text-xs text-text-muted">Photo evidence</p>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Canvas */}
          <div className="lg:col-span-9">
            <div className="bg-surface-raised rounded-2xl shadow-sm border border-surface-border min-h-[600px] p-8">
              <div className="mb-8 border-b border-surface-border pb-6">
                <input 
                  type="text" 
                  value={reportName}
                  onChange={(e) => setReportName(e.target.value)}
                  className="text-3xl font-bold text-text-primary bg-transparent border-none focus:ring-0 p-0 w-full placeholder:text-text-secondary"
                  placeholder="Enter Report Name"
                />
              </div>

              <div className="space-y-4">
                {elements.length === 0 ? (
                  <div className="text-center py-20 border-2 border-dashed border-surface-border rounded-xl">
                    <div className="w-16 h-16 bg-surface-sunken rounded-full flex items-center justify-center mx-auto mb-4">
                      <Plus className="w-8 h-8 text-text-secondary" />
                    </div>
                    <p className="text-text-muted font-medium">Drag elements here or click from toolbox</p>
                  </div>
                ) : (
                  elements.map((element) => (
                    <motion.div 
                      key={element.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="group relative p-6 bg-surface-sunken/50 rounded-xl border border-surface-border hover:border-brand-300 transition-all"
                    >
                      <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="p-2 hover:bg-white rounded-lg text-text-muted hover:text-text-secondary">
                          <Move className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeElement(element.id)} className="p-2 hover:bg-red-50 rounded-lg text-text-muted hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          {element.type === 'header' && <Type className="w-5 h-5 text-brand-500" />}
                          {element.type === 'text' && <FileText className="w-5 h-5 text-blue-500" />}
                          {element.type === 'checkbox' && <CheckSquare className="w-5 h-5 text-green-500" />}
                          {element.type === 'image' && <ImageIcon className="w-5 h-5 text-purple-500" />}
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text" 
                            value={element.label}
                            onChange={(e) => updateElement(element.id, { label: e.target.value })}
                            className="font-medium bg-transparent border-none focus:ring-0 p-0 w-full text-text-primary"
                          />
                          <div className="mt-2">
                            <label className="flex items-center gap-2 text-sm text-text-muted">
                              <input 
                                type="checkbox" 
                                checked={element.required}
                                onChange={(e) => updateElement(element.id, { required: e.target.checked })}
                                className="rounded border-surface-border text-brand-600 focus:ring-brand-500"
                              />
                              Required field
                            </label>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
