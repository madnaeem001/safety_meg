import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Search,
  Filter,
  Calendar,
  Download,
  Trash2,
  Eye,
  FileText,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronRight,
  MoreVertical,
  Share2,
  History,
  Database,
  Camera,
  Users,
  Wrench,
  Split,
  Activity
} from 'lucide-react';
import { useVisualAuditResults, useDeleteVisualAuditMutation, useSaveVisualAuditMutation } from '../api/hooks/useAPIHooks';

/* ================================================================
   AI VISUAL AUDIT HISTORY
   A dedicated page for reviewing, filtering, and managing all
   past AI-powered visual safety audits.
   ================================================================ */

interface Hazard {
  x: number;
  y: number;
  label: string;
  severity: 'high' | 'medium' | 'low';
  standard?: string;
}

interface AuditResult {
  id: string;
  type: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  analysis: string;
  suggestions: string[];
  timestamp: Date;
  status: 'safe' | 'warning' | 'danger';
  hazards?: Hazard[];
  ppeInventory?: Array<{ item: string; status: 'detected' | 'missing' | 'incorrect' }>;
  voiceNotes?: string[];
}

const STORAGE_KEY = 'safetymeg_visual_audits';

export const AIVisualAuditHistory: React.FC = () => {
  const navigate = useNavigate();
  const [audits, setAudits] = useState<AuditResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedAudit, setSelectedAudit] = useState<AuditResult | null>(null);

  const { data: backendResults } = useVisualAuditResults();
  const deleteAuditMutation = useDeleteVisualAuditMutation();
  const saveAuditMutation = useSaveVisualAuditMutation();

  useEffect(() => {
    if (!backendResults) return;
    if (backendResults.length === 0) {
      // No backend rows yet — attempt a best-effort migration from localStorage
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Show local items immediately
            setAudits(parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) })));
            // Attempt to push each item to backend (idempotent best-effort)
            (async () => {
              for (const entry of parsed) {
                try {
                  const payload: any = {
                    id: entry.id,
                    type: entry.type,
                    mediaType: entry.mediaType,
                    analysis: entry.analysis,
                    suggestions: entry.suggestions || [],
                    status: entry.status || 'warning',
                    hazards: entry.hazards,
                    ppeInventory: entry.ppeInventory,
                    voiceNotes: entry.voiceNotes,
                    locationLat: entry.location?.lat,
                    locationLng: entry.location?.lng,
                    standard: entry.standard,
                  };
                  // use mutateAsync so failures don't stop the loop
                  // @ts-ignore
                  await saveAuditMutation.mutateAsync(payload);
                } catch (e) {
                  // ignore individual failures
                }
              }
              // If migration attempted, clear localStorage to avoid duplicate shows
              try { localStorage.removeItem(STORAGE_KEY); } catch {}
            })();
          }
        }
      } catch {
        localStorage.removeItem(STORAGE_KEY);
      }
      return;
    }
    // Enrich backend results with current-session blob URLs from localStorage
    const blobCache: Record<string, string> = {};
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          parsed.forEach((r: any) => { if (r.id && r.mediaUrl) blobCache[r.id] = r.mediaUrl; });
        }
      }
    } catch {}
    setAudits(backendResults.map(r => ({
      id: r.id,
      type: r.type,
      mediaUrl: blobCache[r.id] || '',
      mediaType: r.mediaType as 'image' | 'video',
      analysis: r.analysis,
      suggestions: r.suggestions,
      timestamp: new Date(r.createdAt),
      status: r.status as 'safe' | 'warning' | 'danger',
      hazards: r.hazards,
      ppeInventory: r.ppeInventory,
      voiceNotes: r.voiceNotes,
    })));
  }, [backendResults]);

  const filteredAudits = audits.filter(audit => {
    const matchesSearch = audit.analysis.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         audit.type.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || audit.type === filterType;
    const matchesStatus = filterStatus === 'all' || audit.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const deleteAudit = (id: string) => {
    if (confirm('Are you sure you want to delete this audit record?')) {
      setAudits(prev => prev.filter(a => a.id !== id));
      deleteAuditMutation.mutate(id);
      if (selectedAudit?.id === id) setSelectedAudit(null);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'environment': return Camera;
      case 'employee': return Users;
      case 'machine': return Wrench;
      case 'hazard': return AlertTriangle;
      case 'comparison': return Split;
      default: return Activity;
    }
  };

  return (
    <div className="ai-purple-theme min-h-screen bg-surface-950 text-white pb-20 selection:bg-brand-500/30">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-500/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-violet-500/5 blur-[120px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-900/60 backdrop-blur-2xl border-b border-surface-800 shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/visual-audit')}
                className="p-2.5 hover:bg-surface-800 rounded-2xl text-surface-400 transition-all group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <History className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight">Audit History</h1>
                  <p className="text-[11px] text-surface-400 uppercase tracking-widest font-bold">Vision Intelligence Archive</p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-surface-800/50 rounded-xl border border-surface-700/50">
                <Database className="w-4 h-4 text-brand-400" />
                <span className="text-xs font-bold text-surface-300 uppercase tracking-wider">{audits.length} Records</span>
              </div>
              <button className="p-2.5 hover:bg-surface-800 rounded-2xl text-surface-400 transition-all">
                <Download className="w-6 h-6" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-8">
        {/* Filters & Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-8">
          <div className="lg:col-span-2 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-500 group-focus-within:text-brand-400 transition-colors" />
            <input 
              type="text"
              placeholder="Search analysis, findings, or standards..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-surface-900/50 border border-surface-800 rounded-2xl text-sm focus:outline-none focus:border-brand-500/50 focus:ring-4 focus:ring-brand-500/5 transition-all"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-surface-900/50 border border-surface-800 rounded-2xl text-sm appearance-none focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="environment">Environment</option>
              <option value="employee">Employee (PPE)</option>
              <option value="machine">Machine</option>
              <option value="hazard">Hazard</option>
            </select>
          </div>

          <div className="relative">
            <Activity className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-4 bg-surface-900/50 border border-surface-800 rounded-2xl text-sm appearance-none focus:outline-none focus:border-brand-500/50 transition-all cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="safe">Safe / Compliant</option>
              <option value="warning">Warning</option>
              <option value="danger">Danger / Hazard</option>
            </select>
          </div>
        </div>

        {/* Audit List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredAudits.length === 0 ? (
            <div className="py-20 text-center bg-surface-900/30 border-2 border-dashed border-surface-800 rounded-[2.5rem]">
              <div className="w-20 h-20 rounded-3xl bg-surface-800 flex items-center justify-center mb-6 mx-auto">
                <Search className="w-10 h-10 text-surface-600" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">No records found</h3>
              <p className="text-surface-500 text-sm">Try adjusting your search or filters</p>
            </div>
          ) : (
            filteredAudits.map((audit, index) => {
              const Icon = getIcon(audit.type);
              return (
                <motion.div
                  key={audit.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="group bg-surface-900/40 backdrop-blur-md border border-surface-800 rounded-[2rem] p-6 hover:border-brand-500/30 transition-all hover:shadow-2xl hover:shadow-brand-500/5"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Thumbnail */}
                    <div className="w-full lg:w-48 h-32 rounded-2xl overflow-hidden bg-black shrink-0 relative">
                      <img src={audit.mediaUrl} alt="Audit" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      <div className="absolute bottom-3 left-3">
                        <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                          audit.status === 'safe' ? 'bg-emerald-500 text-white' : 
                          audit.status === 'warning' ? 'bg-amber-500 text-white' : 'bg-red-500 text-white'
                        }`}>
                          {audit.status}
                        </span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 rounded-xl bg-surface-800 text-brand-400">
                          <Icon className="w-4 h-4" />
                        </div>
                        <h3 className="text-lg font-bold text-white truncate capitalize">{audit.type} Safety Audit</h3>
                        <span className="text-[10px] text-surface-500 font-bold uppercase tracking-widest ml-auto">
                          {audit.timestamp.toLocaleDateString()} • {audit.timestamp.toLocaleTimeString()}
                        </span>
                      </div>
                      
                      <p className="text-sm text-surface-400 line-clamp-2 mb-4 italic">
                        "{audit.analysis}"
                      </p>

                      <div className="flex flex-wrap gap-2">
                        {audit.suggestions.slice(0, 2).map((s, i) => (
                          <span key={i} className="text-[9px] px-3 py-1 rounded-full bg-surface-800 text-surface-300 border border-surface-700/50">
                            {s}
                          </span>
                        ))}
                        {audit.hazards && audit.hazards.length > 0 && (
                          <span className="text-[9px] px-3 py-1 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 font-bold">
                            {audit.hazards.length} Hazards Detected
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex lg:flex-col items-center justify-center gap-2 shrink-0 border-t lg:border-t-0 lg:border-l border-surface-800 pt-4 lg:pt-0 lg:pl-6">
                      <button 
                        onClick={() => navigate(`/visual-audit/tool?id=${audit.id}`)}
                        className="flex-1 lg:flex-none p-3 bg-brand-500 hover:bg-brand-600 text-white rounded-xl transition-colors shadow-lg shadow-brand-500/20"
                        title="View Full Report"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        className="flex-1 lg:flex-none p-3 bg-surface-800 hover:bg-surface-700 text-surface-300 rounded-xl transition-colors border border-surface-700"
                        title="Share Report"
                      >
                        <Share2 className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => deleteAudit(audit.id)}
                        className="flex-1 lg:flex-none p-3 bg-surface-800 hover:bg-red-500/20 hover:text-red-400 text-surface-500 rounded-xl transition-all border border-surface-700"
                        title="Delete Record"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default AIVisualAuditHistory;
