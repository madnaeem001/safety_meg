import React, { useState } from 'react';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  useCustomChecklists,
  useCreateCustomChecklist,
  useUpdateCustomChecklist,
  useDeleteCustomChecklist,
} from '../api/hooks/useAPIHooks';
import type { CustomChecklistRecord, CustomChecklistItem, CustomChecklistIndustry } from '../api/services/apiService';

// ===== Types =====
type CustomChecklist = CustomChecklistRecord;

interface CategoryItemGroup {
  category: string;
  items: CustomChecklistItem[];
}

// ===== Helper Functions =====
const generateId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// ===== Industry Options =====
const INDUSTRY_OPTIONS: { value: CustomChecklistIndustry; labelKey: string }[] = [
  { value: 'Manufacturing', labelKey: 'industries.manufacturing' },
  { value: 'Construction', labelKey: 'industries.construction' },
  { value: 'Healthcare', labelKey: 'industries.healthcare' },
  { value: 'Oil & Gas', labelKey: 'industries.oilgas' },
  { value: 'Mining', labelKey: 'industries.mining' },
  { value: 'Utilities', labelKey: 'industries.utilities' },
  { value: 'Transportation', labelKey: 'industries.transportation' },
  { value: 'Warehousing', labelKey: 'industries.warehousing' },
  { value: 'Agriculture', labelKey: 'industries.agriculture' },
  { value: 'Retail', labelKey: 'industries.retail' }
];

// ===== Main Component =====
const ChecklistBuilder: React.FC = () => {
  const { t } = useTranslation();
  
  // API hooks
  const { data: checklistsData, refetch } = useCustomChecklists();
  const customChecklists = checklistsData ?? [];
  const createChecklist = useCreateCustomChecklist();
  const updateChecklist = useUpdateCustomChecklist();
  const deleteChecklistMutation = useDeleteCustomChecklist();

  // State
  const [isCreating, setIsCreating] = useState(false);
  const [editingChecklist, setEditingChecklist] = useState<CustomChecklist | null>(null);
  
  // Form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formIndustry, setFormIndustry] = useState<CustomChecklistIndustry>('Manufacturing');
  const [formCategories, setFormCategories] = useState<CategoryItemGroup[]>([]);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  // Reset form
  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormIndustry('Manufacturing');
    setFormCategories([]);
    setNewCategoryName('');
    setIsCreating(false);
    setEditingChecklist(null);
  };
  
  // Start editing existing checklist
  const startEditing = (checklist: CustomChecklist) => {
    setEditingChecklist(checklist);
    setFormName(checklist.name);
    setFormDescription(checklist.description);
    setFormIndustry(checklist.industry);
    
    // Group items by category
    const categoryGroups: Record<string, CustomChecklistItem[]> = {};
    checklist.items.forEach(item => {
      if (!categoryGroups[item.category]) {
        categoryGroups[item.category] = [];
      }
      categoryGroups[item.category].push(item);
    });
    
    setFormCategories(
      Object.entries(categoryGroups).map(([category, items]) => ({ category, items }))
    );
    setIsCreating(true);
  };
  
  // Add category
  const addCategory = () => {
    if (!newCategoryName.trim()) return;
    setFormCategories([...formCategories, { category: newCategoryName.trim(), items: [] }]);
    setNewCategoryName('');
  };
  
  // Remove category
  const removeCategory = (index: number) => {
    setFormCategories(formCategories.filter((_, i) => i !== index));
  };
  
  // Add item to category
  const addItemToCategory = (categoryIndex: number) => {
    const newItem: CustomChecklistItem = {
      id: generateId(),
      question: '',
      category: formCategories[categoryIndex].category,
      required: false,
      helpText: '',
      regulatoryRef: ''
    };
    
    const updated = [...formCategories];
    updated[categoryIndex].items.push(newItem);
    setFormCategories(updated);
  };
  
  // Update item
  const updateItem = (categoryIndex: number, itemIndex: number, updates: Partial<CustomChecklistItem>) => {
    const updated = [...formCategories];
    updated[categoryIndex].items[itemIndex] = {
      ...updated[categoryIndex].items[itemIndex],
      ...updates
    };
    setFormCategories(updated);
  };
  
  // Remove item
  const removeItem = (categoryIndex: number, itemIndex: number) => {
    const updated = [...formCategories];
    updated[categoryIndex].items.splice(itemIndex, 1);
    setFormCategories(updated);
  };
  
  // Save checklist
  const saveChecklist = async () => {
    if (!formName.trim()) return;

    const allItems: CustomChecklistItem[] = formCategories.flatMap(cg =>
      cg.items.map(item => ({ ...item, category: cg.category }))
    );

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      industry: formIndustry,
      categories: formCategories.map(cg => cg.category),
      items: allItems,
    };

    if (editingChecklist) {
      await updateChecklist.mutate({ id: editingChecklist.id, data: payload });
    } else {
      await createChecklist.mutate(payload);
    }

    await refetch();
    resetForm();
  };
  
  // Delete checklist
  const deleteChecklist = async (id: string) => {
    if (!confirm(t('checklistBuilder.deleteConfirm'))) return;
    await deleteChecklistMutation.mutate(id);
    await refetch();
  };
  
  // Render
  return (
    <div className="min-h-screen bg-gradient-to-b from-surface-50 to-white dark:from-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-surface-100 dark:border-slate-800 safe-area-top">
        <div className="px-responsive py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {t('checklistBuilder.title')}
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {t('checklistBuilder.subtitle')}
              </p>
            </div>
            {!isCreating && (
              <button
                onClick={() => setIsCreating(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-xl font-medium flex items-center gap-2 mobile-active"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {t('checklistBuilder.newChecklist')}
              </button>
            )}
          </div>
        </div>
      </header>
      
      <main className="px-responsive py-6 space-y-6 pb-safe-area-bottom">
        <AnimatePresence mode="wait">
          {isCreating ? (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Form Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                  {editingChecklist ? t('checklistBuilder.editChecklist') : t('checklistBuilder.newChecklist')}
                </h2>
                <button
                  onClick={resetForm}
                  className="p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Basic Info */}
              <div className="glass-card p-6 rounded-2xl space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('checklistBuilder.checklistName')} *
                  </label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder={t('checklistBuilder.checklistNamePlaceholder')}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('checklistBuilder.description')}
                  </label>
                  <textarea
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder={t('checklistBuilder.descriptionPlaceholder')}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                    {t('checklistBuilder.selectIndustry')}
                  </label>
                  <select
                    value={formIndustry}
                    onChange={(e) => setFormIndustry(e.target.value as CustomChecklistIndustry)}
                    className="w-full px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  >
                    {INDUSTRY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              {/* Categories & Items */}
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder={t('checklistBuilder.categoryName')}
                    className="flex-1 px-4 py-3 rounded-xl border border-surface-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && addCategory()}
                  />
                  <button
                    onClick={addCategory}
                    className="px-4 py-3 bg-brand-500 text-white rounded-xl font-medium mobile-active"
                  >
                    {t('checklistBuilder.addCategory')}
                  </button>
                </div>
                
                {formCategories.map((catGroup, catIndex) => (
                  <motion.div
                    key={catGroup.category}
                    layout
                    className="glass-card p-4 rounded-2xl"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{catGroup.category}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addItemToCategory(catIndex)}
                          className="px-3 py-1.5 text-sm bg-surface-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg mobile-active"
                        >
                          + {t('checklistBuilder.addItem')}
                        </button>
                        <button
                          onClick={() => removeCategory(catIndex)}
                          className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    
                    <Reorder.Group
                      axis="y"
                      values={catGroup.items}
                      onReorder={(newItems) => {
                        const updated = [...formCategories];
                        updated[catIndex].items = newItems;
                        setFormCategories(updated);
                      }}
                      className="space-y-3"
                    >
                      {catGroup.items.map((item, itemIndex) => (
                        <Reorder.Item
                          key={item.id}
                          value={item}
                          className="bg-surface-50 dark:bg-slate-700/50 p-4 rounded-xl cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-3 text-slate-400">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                              </svg>
                            </div>
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={item.question}
                                onChange={(e) => updateItem(catIndex, itemIndex, { question: e.target.value })}
                                placeholder={t('checklistBuilder.itemQuestion')}
                                className="w-full px-3 py-2 rounded-lg border border-surface-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                              />
                              <div className="flex flex-wrap gap-3 items-center">
                                <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                  <input
                                    type="checkbox"
                                    checked={item.required}
                                    onChange={(e) => updateItem(catIndex, itemIndex, { required: e.target.checked })}
                                    className="rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                                  />
                                  {t('checklistBuilder.itemRequired')}
                                </label>
                                <input
                                  type="text"
                                  value={item.regulatoryRef || ''}
                                  onChange={(e) => updateItem(catIndex, itemIndex, { regulatoryRef: e.target.value })}
                                  placeholder={t('checklistBuilder.regulatoryRef')}
                                  className="flex-1 min-w-[150px] px-3 py-1.5 rounded-lg border border-surface-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm"
                                />
                              </div>
                            </div>
                            <button
                              onClick={() => removeItem(catIndex, itemIndex)}
                              className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                            >
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        </Reorder.Item>
                      ))}
                    </Reorder.Group>
                    
                    {catGroup.items.length === 0 && (
                      <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                        {t('riskChecklists.noItems')}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
              
              {/* Save Button */}
              <button
                onClick={saveChecklist}
                disabled={!formName.trim()}
                className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg mobile-active disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {t('checklistBuilder.saveChecklist')}
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('checklistBuilder.myChecklists')}
              </h2>
              
              {customChecklists.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-slate-800 flex items-center justify-center">
                    <svg className="w-10 h-10 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 mb-2">{t('checklistBuilder.noCustomChecklists')}</p>
                  <p className="text-sm text-slate-400 dark:text-slate-500">{t('checklistBuilder.createFirst')}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customChecklists.map((checklist) => (
                    <motion.div
                      key={checklist.id}
                      layout
                      className="glass-card p-4 rounded-2xl"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-slate-900 dark:text-white">{checklist.name}</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{checklist.description}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className="px-2.5 py-1 text-xs font-medium bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 rounded-lg">
                              {checklist.industry}
                            </span>
                            <span className="px-2.5 py-1 text-xs font-medium bg-surface-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg">
                              {checklist.items.length} {t('riskChecklists.items')}
                            </span>
                            <span className="px-2.5 py-1 text-xs font-medium bg-surface-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded-lg">
                              {checklist.categories.length} categories
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => startEditing(checklist)}
                            className="p-2 text-slate-500 hover:bg-surface-100 dark:hover:bg-slate-700 rounded-lg mobile-active"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => deleteChecklist(checklist.id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg mobile-active"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ChecklistBuilder;
