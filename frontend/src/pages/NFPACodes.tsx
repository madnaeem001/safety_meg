import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Book, Search, Flame, Zap, ShieldAlert, Settings, ChevronDown, ChevronUp, ExternalLink, Calendar, AlertTriangle, CheckCircle2, Clock, FileText, Users, Factory, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { nfpaCodes, NFPACode } from '../data/nfpaCodes';
import { useNFPACodes } from '../api/hooks/useAPIHooks';

export const NFPACodes: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCode, setExpandedCode] = useState<string | null>(null);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const { data: backendNfpa } = useNFPACodes();

  const allNfpaCodes = useMemo<NFPACode[]>(() => {
    if (!backendNfpa || (backendNfpa as any[]).length === 0) return nfpaCodes;
    const categoryMap: Record<string, NFPACode['category']> = {
      'fire-protection': 'General',
      'electrical': 'Electrical',
      'life-safety': 'Life Safety',
      'hazardous-materials': 'Hazardous Materials',
      'processes': 'Industrial',
    };
    const converted: NFPACode[] = (backendNfpa as any[]).map((n: any) => ({
      id: String(n.id || n.nfpaId),
      code: n.codeNumber,
      title: n.title,
      description: n.description || '',
      category: categoryMap[n.category] ?? 'General',
      edition: n.edition || undefined,
      effectiveDate: n.effectiveDate || undefined,
      keyRequirements: Array.isArray(n.requirements)
        ? n.requirements.map((r: any) => (typeof r === 'string' ? r : (r.text || r.description || '')))
        : [],
      applicableTo: Array.isArray(n.applicableIndustries) ? n.applicableIndustries : [],
    }));
    const existingCodes = new Set(nfpaCodes.map(c => c.code));
    return [...nfpaCodes, ...converted.filter(c => !existingCodes.has(c.code))];
  }, [backendNfpa]);

  const filteredCodes = allNfpaCodes.filter(code => {
    const matchesSearch = code.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          code.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          code.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (code.keyRequirements?.some(req => req.toLowerCase().includes(searchTerm.toLowerCase())));
    const matchesCategory = selectedCategory ? code.category === selectedCategory : true;
    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(allNfpaCodes.map(code => code.category)));

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Electrical': return <Zap className="w-4 h-4 text-yellow-600" />;
      case 'Life Safety': return <ShieldAlert className="w-4 h-4 text-red-600" />;
      case 'Systems': return <Settings className="w-4 h-4 text-blue-600" />;
      case 'Hazardous Materials': return <AlertTriangle className="w-4 h-4 text-orange-600" />;
      case 'Industrial': return <Factory className="w-4 h-4 text-text-secondary" />;
      case 'Healthcare': return <Heart className="w-4 h-4 text-pink-600" />;
      default: return <Flame className="w-4 h-4 text-orange-600" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Electrical': return 'bg-yellow-50 border-yellow-200 text-yellow-700';
      case 'Life Safety': return 'bg-red-50 border-red-200 text-red-700';
      case 'Systems': return 'bg-blue-50 border-blue-200 text-blue-700';
      case 'Hazardous Materials': return 'bg-orange-50 border-orange-200 text-orange-700';
      case 'Industrial': return 'bg-surface-sunken border-surface-border text-text-primary';
      case 'Healthcare': return 'bg-pink-50 border-pink-200 text-pink-700';
      default: return 'bg-surface-50 border-surface-200 text-surface-700';
    }
  };

  // Stats for header
  const stats = {
    total: nfpaCodes.length,
    byCategory: categories.reduce((acc, cat) => {
      acc[cat] = nfpaCodes.filter(c => c.category === cat).length;
      return acc;
    }, {} as Record<string, number>)
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-md shadow-sm sticky top-[72px] z-50 px-4 safe-top border-b border-surface-200">
        <div className="max-w-4xl mx-auto">
          <div className="h-16 flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-surface-100 rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-surface-600" />
            </button>
            <div className="flex-1">
              <h1 className="page-title flex items-center gap-2">
                <Book className="w-6 h-6 text-brand-600" />
                NFPA Fire Codes Library
              </h1>
              <p className="page-subtitle">{stats.total} codes across {categories.length} categories</p>
            </div>
          </div>
        </div>
      </div>

      <main className="px-4 py-6 max-w-4xl mx-auto space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {categories.slice(0, 4).map(cat => (
            <motion.button
              key={cat}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`
                p-4 rounded-xl border transition-all text-left
                ${selectedCategory === cat 
                  ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-500/20' 
                  : 'bg-white border-surface-200 hover:border-surface-300'}
              `}
            >
              <div className="flex items-center gap-2 mb-2">
                {getCategoryIcon(cat)}
                <span className="text-sm font-semibold text-surface-900">{cat}</span>
              </div>
              <p className="text-2xl font-bold text-brand-600">{stats.byCategory[cat]}</p>
              <p className="text-xs text-surface-500">codes</p>
            </motion.button>
          ))}
        </div>

        {/* Search and Filter */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search by code, title, or keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-white border border-surface-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm text-sm"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              onClick={() => setSelectedCategory(null)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === null
                  ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                  : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
              }`}
            >
              All ({stats.total})
            </button>
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  selectedCategory === category
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'bg-white text-surface-600 border border-surface-200 hover:bg-surface-50'
                }`}
              >
                {getCategoryIcon(category)}
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Results count */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-surface-500">
            Showing {filteredCodes.length} of {stats.total} codes
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium"
            >
              Clear search
            </button>
          )}
        </div>

        {/* Codes List */}
        <div className="space-y-4">
          {filteredCodes.map((code, index) => (
            <motion.div
              key={code.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white rounded-2xl shadow-soft border border-surface-100 overflow-hidden hover:shadow-lg transition-all"
            >
              {/* Card Header */}
              <button
                onClick={() => setExpandedCode(expandedCode === code.id ? null : code.id)}
                className="w-full p-5 text-left"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="px-2.5 py-1 bg-brand-100 text-brand-700 text-xs font-bold rounded-md">
                        {code.code}
                      </span>
                      <span className={`px-2.5 py-1 text-xs font-medium rounded-full border flex items-center gap-1 ${getCategoryColor(code.category)}`}>
                        {getCategoryIcon(code.category)}
                        {code.category}
                      </span>
                      {code.edition && (
                        <span className="px-2 py-0.5 bg-surface-100 text-surface-600 text-[10px] font-medium rounded">
                          {code.edition} Edition
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-brand-900 mb-1 leading-tight">{code.title}</h3>
                    <p className="text-surface-600 text-sm leading-relaxed line-clamp-2">{code.description}</p>
                    
                    {/* Quick info row */}
                    {(code.inspectionFrequency || code.applicableTo) && (
                      <div className="flex flex-wrap gap-3 mt-3 text-xs text-surface-500">
                        {code.inspectionFrequency && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {code.inspectionFrequency}
                          </span>
                        )}
                        {code.applicableTo && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {code.applicableTo.length} applicable areas
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <motion.div
                    animate={{ rotate: expandedCode === code.id ? 180 : 0 }}
                    className="p-2 bg-surface-100 rounded-lg"
                  >
                    <ChevronDown className="w-5 h-5 text-surface-500" />
                  </motion.div>
                </div>
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {expandedCode === code.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 border-t border-surface-100 pt-4 space-y-4">
                      {/* Key Requirements */}
                      {code.keyRequirements && code.keyRequirements.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Key Requirements
                          </h4>
                          <ul className="space-y-1.5">
                            {code.keyRequirements.map((req, i) => (
                              <li key={i} className="text-sm text-surface-600 flex items-start gap-2">
                                <span className="w-1.5 h-1.5 bg-brand-500 rounded-full mt-2 flex-shrink-0" />
                                {req}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Applicable To */}
                      {code.applicableTo && code.applicableTo.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
                            <Users className="w-4 h-4 text-blue-600" />
                            Applicable To
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {code.applicableTo.map((item, i) => (
                              <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-200">
                                {item}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Inspection & Penalties Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {code.inspectionFrequency && (
                          <div className="p-3 bg-surface-50 rounded-xl">
                            <h4 className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-1">
                              Inspection Frequency
                            </h4>
                            <p className="text-sm font-medium text-surface-800">{code.inspectionFrequency}</p>
                          </div>
                        )}
                        {code.penalties && (
                          <div className="p-3 bg-red-50 rounded-xl border border-red-100">
                            <h4 className="text-xs font-semibold text-red-600 uppercase tracking-wider mb-1">
                              Penalties for Non-Compliance
                            </h4>
                            <p className="text-sm font-medium text-red-800">{code.penalties}</p>
                          </div>
                        )}
                      </div>

                      {/* Related Codes */}
                      {code.relatedCodes && code.relatedCodes.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-purple-600" />
                            Related Codes
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {code.relatedCodes.map((related, i) => (
                              <span key={i} className="px-2.5 py-1 bg-purple-50 text-purple-700 text-xs font-medium rounded border border-purple-200">
                                {related}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Resources */}
                      {code.resources && code.resources.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-surface-700 mb-2 flex items-center gap-2">
                            <ExternalLink className="w-4 h-4 text-brand-600" />
                            Resources
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {code.resources.map((resource, i) => (
                              <a
                                key={i}
                                href={resource.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-50 text-brand-700 text-sm font-medium rounded-lg border border-brand-200 hover:bg-brand-100 transition-colors"
                              >
                                {resource.title}
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Effective Date */}
                      {code.effectiveDate && (
                        <div className="flex items-center gap-2 text-xs text-surface-500 pt-2 border-t border-surface-100">
                          <Calendar className="w-3.5 h-3.5" />
                          Effective: {new Date(code.effectiveDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}

          {filteredCodes.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-surface-400" />
              </div>
              <h3 className="text-lg font-medium text-surface-900">No codes found</h3>
              <p className="text-surface-500 text-sm">Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
