import React, { useState, useEffect, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  INDUSTRY_CHECKLISTS, 
  getChecklistByIndustry, 
  getChecklistItemsByCategory,
  getAISuggestions,
  type IndustryType, 
  type IndustryChecklist,
  type ChecklistItem 
} from '../data/mockRiskAssessmentTemplates';

// ===== Loading Skeleton Components =====
const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton-line ${className}`} />
);

const SkeletonCircle: React.FC<{ size?: string }> = ({ size = 'w-6 h-6' }) => (
  <div className={`skeleton-circle ${size}`} />
);

const ChecklistSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    {/* Header skeleton */}
    <div className="p-responsive">
      <SkeletonLine className="h-8 w-48 mb-2" />
      <SkeletonLine className="h-4 w-64" />
    </div>
    
    {/* Industry selector skeleton */}
    <div className="px-responsive flex gap-3 overflow-x-auto pb-2">
      {[1, 2, 3].map((i) => (
        <div key={i} className="skeleton-line h-12 w-32 rounded-2xl flex-shrink-0" />
      ))}
    </div>
    
    {/* Category tabs skeleton */}
    <div className="px-responsive flex gap-2 overflow-x-auto pb-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-line h-10 w-24 rounded-xl flex-shrink-0" />
      ))}
    </div>
    
    {/* Checklist items skeleton */}
    <div className="px-responsive space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="glass-card p-4 rounded-2xl flex items-start gap-4">
          <SkeletonCircle size="w-6 h-6" />
          <div className="flex-1 space-y-2">
            <SkeletonLine className="h-5 w-full" />
            <SkeletonLine className="h-4 w-3/4" />
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ===== AI Helper Panel Component =====
interface AIHelperPanelProps {
  category: string;
  isOpen: boolean;
  onClose: () => void;
}

const AIHelperPanel: React.FC<AIHelperPanelProps> = ({ category, isOpen, onClose }) => {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userQuery, setUserQuery] = useState('');

  useEffect(() => {
    if (isOpen && category) {
      setIsLoading(true);
      // Simulate AI loading
      setTimeout(() => {
        setSuggestions(getAISuggestions(category));
        setIsLoading(false);
      }, 800);
    }
  }, [isOpen, category]);

  const handleAskAI = () => {
    if (!userQuery.trim()) return;
    setIsLoading(true);
    // Simulate AI response
    setTimeout(() => {
      setSuggestions([
        `Based on your query about "${userQuery}", here are recommendations:`,
        'Implement additional engineering controls to reduce exposure',
        'Consider conducting a job hazard analysis (JHA) for this task',
        'Review training records to ensure competency in this area'
      ]);
      setIsLoading(false);
      setUserQuery('');
    }, 1200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="fixed inset-x-0 bottom-0 z-50 safe-area-bottom"
        >
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl shadow-2xl border-t border-surface-200 dark:border-slate-700 max-h-[60vh] overflow-hidden">
            {/* Handle bar */}
            <div className="flex justify-center py-3">
              <div className="w-12 h-1.5 bg-surface-300 dark:bg-slate-600 rounded-full" />
            </div>
            
            {/* Header */}
            <div className="px-responsive flex items-center justify-between pb-3 border-b border-surface-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">AI Safety Assistant</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Powered by AI Risk Analysis</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="touch-target p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-700 transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="p-responsive overflow-y-auto max-h-[40vh] ios-safe-scroll">
              {isLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-start gap-3 animate-pulse">
                      <div className="w-2 h-2 mt-2 rounded-full bg-brand-300" />
                      <SkeletonLine className="h-4 flex-1" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                    AI Suggestions for <span className="text-brand-600 dark:text-brand-400">{category}</span>:
                  </p>
                  {suggestions.length > 0 ? (
                    suggestions.map((suggestion, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3 p-3 bg-surface-50 dark:bg-slate-700/50 rounded-xl"
                      >
                        <div className="w-2 h-2 mt-1.5 rounded-full bg-brand-500 flex-shrink-0" />
                        <p className="text-sm text-slate-600 dark:text-slate-300">{suggestion}</p>
                      </motion.div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
                      No suggestions available for this category yet.
                    </p>
                  )}
                </div>
              )}
              
              {/* Ask AI Input */}
              <div className="mt-4 pt-4 border-t border-surface-100 dark:border-slate-700">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userQuery}
                    onChange={(e) => setUserQuery(e.target.value)}
                    placeholder="Ask AI about safety concerns..."
                    className="flex-1 px-4 py-3 text-sm bg-surface-50 dark:bg-slate-700 border border-surface-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all"
                    onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                  />
                  <button
                    onClick={handleAskAI}
                    disabled={isLoading || !userQuery.trim()}
                    className="px-4 py-3 bg-brand-500 text-white rounded-xl font-medium touch-target disabled:opacity-50 disabled:cursor-not-allowed mobile-active transition-all"
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ===== Email Notification Component =====
interface EmailNotificationSectionProps {
  checklist: IndustryChecklist;
  completedCount: number;
  totalCount: number;
}

const EmailNotificationSection: React.FC<EmailNotificationSectionProps> = ({ checklist, completedCount, totalCount }) => {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const sendEmailNotification = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ type: 'error', text: 'Please enter a valid email address' });
      return;
    }
    
    setIsSending(true);
    setMessage(null);
    
    try {
      // Get current locale
      const locale = localStorage.getItem('safetymeg_language') || 'en';
      
      const _apiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined) || '/api';
      const response = await fetch(`${_apiBase}/public/notifications/checklist-completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          checklistName: checklist.name,
          industry: checklist.industry,
          completedItems: completedCount,
          totalItems: totalCount,
          completionDate: new Date().toISOString(),
          locale
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Email sent successfully!' });
        setEmail('');
      } else if (result.queued) {
        setMessage({ type: 'success', text: 'Notification queued (email service not configured)' });
        setEmail('');
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to send email' });
      }
    } catch (error) {
      // Fallback: Queue locally
      const queue = JSON.parse(localStorage.getItem('safetymeg_email_queue') || '[]');
      queue.push({
        id: `queue_${Date.now()}`,
        email,
        type: 'checklist_completed',
        data: { checklistName: checklist.name, industry: checklist.industry, completedCount, totalCount },
        createdAt: new Date().toISOString()
      });
      localStorage.setItem('safetymeg_email_queue', JSON.stringify(queue));
      setMessage({ type: 'success', text: 'Notification saved locally (will send when online)' });
      setEmail('');
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="glass-card p-4 rounded-2xl">
      <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <svg className="w-5 h-5 text-brand-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        Send Completion Report via Email
      </p>
      <div className="flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter email address"
          className="flex-1 px-4 py-3 text-sm bg-surface-50 dark:bg-slate-700 border border-surface-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none"
          onKeyDown={(e) => e.key === 'Enter' && sendEmailNotification()}
        />
        <button
          onClick={sendEmailNotification}
          disabled={isSending || !email.trim()}
          className="px-4 py-3 bg-brand-500 text-white rounded-xl font-medium touch-target disabled:opacity-50 mobile-active"
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : (
            'Send'
          )}
        </button>
      </div>
      {message && (
        <p className={`text-sm mt-2 ${message.type === 'success' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
          {message.text}
        </p>
      )}
    </div>
  );
};

// ===== Checklist Item Component =====
interface ChecklistItemRowProps {
  item: ChecklistItem;
  isChecked: boolean;
  onToggle: () => void;
  index: number;
}

const ChecklistItemRow: React.FC<ChecklistItemRowProps> = ({ item, isChecked, onToggle, index }) => {
  const [showHelp, setShowHelp] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`glass-card p-4 rounded-2xl transition-all duration-200 ${
        isChecked ? 'bg-green-50/80 dark:bg-green-900/20 border-green-200 dark:border-green-800' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        <button
          onClick={onToggle}
          className={`touch-target flex-shrink-0 w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
            isChecked
              ? 'bg-green-500 border-green-500 text-white'
              : 'border-surface-300 dark:border-slate-600 hover:border-brand-500'
          }`}
        >
          {isChecked && (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium leading-relaxed ${
            isChecked ? 'text-green-700 dark:text-green-300 line-through' : 'text-slate-700 dark:text-slate-200'
          }`}>
            {item.question}
            {item.required && <span className="text-red-500 ml-1">*</span>}
          </p>
          
          {item.regulatoryRef && (
            <span className="inline-block mt-2 px-2 py-0.5 text-xs font-medium bg-brand-100 dark:bg-brand-900/30 text-brand-700 dark:text-brand-300 rounded-lg">
              {item.regulatoryRef}
            </span>
          )}
          
          {item.helpText && (
            <AnimatePresence>
              {showHelp && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-2 text-xs text-slate-500 dark:text-slate-400 bg-surface-50 dark:bg-slate-800 p-2 rounded-lg"
                >
                  💡 {item.helpText}
                </motion.p>
              )}
            </AnimatePresence>
          )}
        </div>
        
        {item.helpText && (
          <button
            onClick={() => setShowHelp(!showHelp)}
            className="touch-target p-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className={`w-5 h-5 text-slate-400 transition-transform ${showHelp ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
      </div>
    </motion.div>
  );
};

// ===== Main Page Component =====
export const RiskAssessmentChecklists: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>('Manufacturing');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [currentChecklist, setCurrentChecklist] = useState<IndustryChecklist | null>(null);

  // Industry icons
  const industryIcons: Record<IndustryType, React.ReactNode> = {
    'Manufacturing': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    'Construction': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    'Healthcare': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
      </svg>
    ),
    'Oil & Gas': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
      </svg>
    ),
    'Mining': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
      </svg>
    ),
    'Utilities': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    'Transportation': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
    ),
    'Warehousing': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
      </svg>
    ),
    'Agriculture': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
      </svg>
    ),
    'Retail': (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
    ),
  };

  // Available industries (all 10 with checklists)
  const availableIndustries: IndustryType[] = [
    'Oil & Gas', 'Mining', 'Utilities', 'Transportation', 'Warehousing', 
    'Agriculture', 'Retail', 'Manufacturing', 'Construction', 'Healthcare'
  ];

  // Load checklist data
  useEffect(() => {
    setIsLoading(true);
    // Simulate loading
    const timer = setTimeout(() => {
      const checklist = getChecklistByIndustry(selectedIndustry);
      setCurrentChecklist(checklist || null);
      if (checklist && checklist.categories.length > 0) {
        setSelectedCategory(checklist.categories[0]);
      }
      setCheckedItems(new Set());
      setIsLoading(false);
    }, 600);
    return () => clearTimeout(timer);
  }, [selectedIndustry]);


  const toggleItem = (itemId: string) => {
    setCheckedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const getProgress = () => {
    if (!currentChecklist) return 0;
    const totalItems = currentChecklist.items.length;
    return totalItems > 0 ? Math.round((checkedItems.size / totalItems) * 100) : 0;
  };

  const getCategoryProgress = (category: string) => {
    if (!currentChecklist) return 0;
    const categoryItems = currentChecklist.items.filter((i) => i.category === category);
    const checkedInCategory = categoryItems.filter((i) => checkedItems.has(i.id)).length;
    return categoryItems.length > 0 ? Math.round((checkedInCategory / categoryItems.length) * 100) : 0;
  };

  const currentCategoryItems = currentChecklist
    ? getChecklistItemsByCategory(currentChecklist.id, selectedCategory)
    : [];

  if (isLoading) {
    return (
      <div className="min-h-screen-safe bg-surface-50 dark:bg-slate-900 safe-area-all">
        <ChecklistSkeleton />
      </div>
    );
  }

  return (
    <div className="min-h-screen-safe bg-surface-50 dark:bg-slate-900 safe-area-all pb-24">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-surface-100 dark:border-slate-800 safe-area-top">
        <div className="px-responsive py-4 flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="touch-target p-2 -ml-2 rounded-xl hover:bg-surface-100 dark:hover:bg-slate-800 transition-colors"
          >
            <svg className="w-6 h-6 text-slate-600 dark:text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="text-responsive-lg font-bold text-slate-900 dark:text-white">Risk Assessment</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Industry Checklists</p>
          </div>
          <button
            onClick={() => setShowAIPanel(true)}
            className="touch-target p-3 rounded-2xl bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-lg mobile-active"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </button>
        </div>
      </header>

      {/* Industry Selector */}
      <section className="px-responsive py-4">
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-3">Select Industry</p>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 ios-safe-scroll">
          {availableIndustries.map((industry) => (
            <button
              key={industry}
              onClick={() => setSelectedIndustry(industry)}
              className={`flex-shrink-0 flex items-center gap-2 px-4 py-3 rounded-2xl font-medium text-sm transition-all touch-target mobile-active ${
                selectedIndustry === industry
                  ? 'bg-brand-500 text-white shadow-lg'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-surface-200 dark:border-slate-700'
              }`}
            >
              {industryIcons[industry]}
              <span>{industry}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Progress Bar */}
      {currentChecklist && (
        <section className="px-responsive pb-4">
          <div className="glass-card p-4 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Overall Progress</span>
              <span className="text-sm font-bold text-brand-600 dark:text-brand-400">{getProgress()}%</span>
            </div>
            <div className="h-2 bg-surface-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getProgress()}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="h-full bg-gradient-to-r from-brand-500 to-brand-400 rounded-full"
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span>{checkedItems.size} of {currentChecklist.items.length} items</span>
              <span>Est. {currentChecklist.completionEstimate}</span>
            </div>
          </div>
        </section>
      )}

      {/* Category Tabs */}
      {currentChecklist && (
        <section className="px-responsive pb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 ios-safe-scroll">
            {currentChecklist.categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`flex-shrink-0 px-4 py-2.5 rounded-xl font-medium text-sm transition-all touch-target mobile-active whitespace-nowrap ${
                  selectedCategory === category
                    ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                    : 'bg-surface-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {category}
                <span className={`ml-2 text-xs ${
                  selectedCategory === category ? 'text-white/70 dark:text-slate-900/70' : 'text-slate-400 dark:text-slate-500'
                }`}>
                  {getCategoryProgress(category)}%
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Checklist Items */}
      <section className="px-responsive space-y-3 pb-8">
        {currentCategoryItems.length > 0 ? (
          currentCategoryItems.map((item, index) => (
            <ChecklistItemRow
              key={item.id}
              item={item}
              isChecked={checkedItems.has(item.id)}
              onToggle={() => toggleItem(item.id)}
              index={index}
            />
          ))
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-surface-100 dark:bg-slate-800 flex items-center justify-center">
              <svg className="w-8 h-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400">No items in this category</p>
          </div>
        )}
      </section>

      {/* Export PDF Button */}
      {currentChecklist && getProgress() > 0 && (
        <section className="px-responsive pb-4 space-y-3">
          <button
            onClick={() => exportToPDF(currentChecklist, checkedItems)}
            className="w-full py-4 bg-gradient-to-r from-brand-600 to-brand-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2 shadow-lg mobile-active"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export Completed Checklist (PDF)
          </button>
          
          {/* Email Notification Section */}
          {getProgress() >= 50 && (
            <EmailNotificationSection 
              checklist={currentChecklist}
              completedCount={checkedItems.size}
              totalCount={currentChecklist.items.length}
            />
          )}
        </section>
      )}

      {/* AI Helper Panel */}
      <AIHelperPanel
        category={selectedCategory}
        isOpen={showAIPanel}
        onClose={() => setShowAIPanel(false)}
      />
    </div>
  );
};

// PDF Export Function
function exportToPDF(checklist: IndustryChecklist, checkedItems: Set<string>) {
  const completedItems = checklist.items.filter(item => checkedItems.has(item.id));
  const incompleteItems = checklist.items.filter(item => !checkedItems.has(item.id));
  const progress = Math.round((checkedItems.size / checklist.items.length) * 100);
  const now = new Date();
  
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export PDF');
    return;
  }
  
  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>${checklist.name} - Assessment Report</title>
  <style>
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1e293b; line-height: 1.6; padding: 40px; max-width: 800px; margin: 0 auto; }
    .header { border-bottom: 3px solid #14b8a6; padding-bottom: 20px; margin-bottom: 30px; }
    .header h1 { font-size: 24px; color: #0f766e; margin-bottom: 8px; }
    .header p { color: #64748b; font-size: 14px; }
    .meta { display: flex; gap: 30px; margin-top: 15px; font-size: 13px; }
    .meta-item { display: flex; align-items: center; gap: 6px; }
    .meta-label { color: #94a3b8; }
    .meta-value { font-weight: 600; color: #334155; }
    .progress-section { background: #f0fdfa; border-radius: 12px; padding: 20px; margin-bottom: 30px; }
    .progress-bar { height: 12px; background: #e2e8f0; border-radius: 6px; overflow: hidden; margin: 10px 0; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #14b8a6, #0d9488); border-radius: 6px; }
    .progress-text { display: flex; justify-content: space-between; font-size: 14px; color: #475569; }
    .section { margin-bottom: 30px; }
    .section-title { font-size: 16px; font-weight: 600; color: #0f766e; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; margin-bottom: 15px; }
    .item { padding: 12px 0; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 12px; }
    .item:last-child { border-bottom: none; }
    .checkbox { width: 18px; height: 18px; border-radius: 4px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; }
    .checkbox.checked { background: #14b8a6; color: white; }
    .checkbox.unchecked { border: 2px solid #cbd5e1; }
    .item-content { flex: 1; }
    .item-question { font-size: 14px; color: #334155; }
    .item-question.completed { color: #64748b; text-decoration: line-through; }
    .item-ref { display: inline-block; margin-top: 4px; font-size: 11px; background: #e0f2fe; color: #0369a1; padding: 2px 8px; border-radius: 4px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #94a3b8; text-align: center; }
    .signature-line { margin-top: 40px; display: flex; gap: 40px; }
    .signature-box { flex: 1; }
    .signature-label { font-size: 12px; color: #64748b; margin-bottom: 30px; }
    .signature-line-drawn { border-top: 1px solid #334155; }
  </style>
</head>
<body>
  <div class="header">
    <h1>safetyMEG Risk Assessment Report</h1>
    <p>${checklist.name}</p>
    <div class="meta">
      <div class="meta-item">
        <span class="meta-label">Industry:</span>
        <span class="meta-value">${checklist.industry}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Date:</span>
        <span class="meta-value">${now.toLocaleDateString()}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Version:</span>
        <span class="meta-value">${checklist.version}</span>
      </div>
    </div>
  </div>
  
  <div class="progress-section">
    <div class="progress-text">
      <span>Completion Progress</span>
      <span>${progress}%</span>
    </div>
    <div class="progress-bar">
      <div class="progress-fill" style="width: ${progress}%"></div>
    </div>
    <div class="progress-text">
      <span>${checkedItems.size} of ${checklist.items.length} items completed</span>
    </div>
  </div>
  
  ${completedItems.length > 0 ? `
  <div class="section">
    <div class="section-title">Completed Items (${completedItems.length})</div>
    ${completedItems.map(item => `
      <div class="item">
        <div class="checkbox checked">✓</div>
        <div class="item-content">
          <div class="item-question completed">${item.question}</div>
          ${item.regulatoryRef ? `<span class="item-ref">${item.regulatoryRef}</span>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  ${incompleteItems.length > 0 ? `
  <div class="section">
    <div class="section-title">Pending Items (${incompleteItems.length})</div>
    ${incompleteItems.map(item => `
      <div class="item">
        <div class="checkbox unchecked"></div>
        <div class="item-content">
          <div class="item-question">${item.question}${item.required ? ' *' : ''}</div>
          ${item.regulatoryRef ? `<span class="item-ref">${item.regulatoryRef}</span>` : ''}
        </div>
      </div>
    `).join('')}
  </div>
  ` : ''}
  
  <div class="signature-line">
    <div class="signature-box">
      <div class="signature-label">Assessor Signature</div>
      <div class="signature-line-drawn"></div>
    </div>
    <div class="signature-box">
      <div class="signature-label">Date</div>
      <div class="signature-line-drawn"></div>
    </div>
  </div>
  
  <div class="footer">
    Generated by safetyMEG - Intelligent Safety Management Platform<br>
    Report generated on ${now.toLocaleString()}
  </div>
</body>
</html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
}

export default RiskAssessmentChecklists;
