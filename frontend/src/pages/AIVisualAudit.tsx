import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Camera,
  Video,
  Upload,
  RefreshCw,
  Sparkles,
  Shield,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Brain,
  Eye,
  Zap,
  ChevronRight,
  Settings,
  MoreHorizontal,
  Download,
  Share2,
  FileText,
  Wrench,
  Users,
  Building2,
  Play,
  Pause,
  Maximize2,
  Layers,
  History,
  Mic,
  Split,
  Grid3X3,
  Activity,
  Target,
  X,
  Globe,
  Scale,
  Map as MapIcon,
  ClipboardList,
  Volume2,
  Save,
  Trash2,
  TrendingUp,
  Plus,
  Cpu
} from 'lucide-react';
import { aiService } from '../services/aiService';
import { useGeolocation } from '../hooks/useGeolocation';
import {
  useVisualAuditResults,
  useSaveVisualAuditMutation,
  useDeleteVisualAuditMutation,
  useAddVoiceNoteMutation,
} from '../api/hooks/useAPIHooks';

/* ================================================================
   AI VISUAL AUDIT (ENHANCED & ROBUST)
   A comprehensive tool for uploading photos and videos for AI
   safety analysis of environments, employees, and machinery.
   ================================================================ */

// Robust Error Boundary Component
class AuditErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Audit Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="page-wrapper flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-danger/10 text-danger">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-text-primary">Something went wrong</h2>
          <p className="mb-8 text-text-muted">The AI Visual Audit engine encountered an unexpected error.</p>
          <button 
            onClick={() => {
              try {
                localStorage.removeItem('safetymeg_visual_audits');
                localStorage.removeItem('safetymeg_engine_state');
              } catch(e) {}
              window.location.href = '/visual-audit';
            }}
            className="rounded-xl bg-accent px-6 py-3 font-bold uppercase tracking-widest text-text-onAccent transition-all hover:brightness-110"
          >
            Reset Audit Engine
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

type AuditType = 'environment' | 'employee' | 'machine' | 'hazard' | 'comparison' | 'robotics';
type ViewMode = 'upload' | 'live' | 'batch' | 'compare';

interface Hazard {
  x: number;
  y: number;
  label: string;
  severity: 'high' | 'medium' | 'low';
  standard?: string;
}

interface AuditResult {
  id: string;
  type: AuditType;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  analysis: string;
  suggestions: string[];
  timestamp: Date | string;
  status: 'safe' | 'warning' | 'danger';
  hazards?: Hazard[];
  ppeInventory?: Array<{ item: string; status: 'detected' | 'missing' | 'incorrect' }>;
  voiceNotes?: string[];
  location?: { lat: number; lng: number };
}

const STORAGE_KEY = 'safetymeg_visual_audits';

// Helper to safely format timestamps
const formatTimestamp = (ts: Date | string) => {
  try {
    const date = typeof ts === 'string' ? new Date(ts) : ts;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch (e) {
    return 'Just now';
  }
};

export const AIVisualAudit: React.FC = () => {
  return (
    <AuditErrorBoundary>
      <AIVisualAuditContent />
    </AuditErrorBoundary>
  );
};

const AIVisualAuditContent: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  
  const initialType = (queryParams.get('type') as AuditType) || 'environment';
  const initialMode = (queryParams.get('mode') as ViewMode) || 'upload';
  const initialId = queryParams.get('id');
  const isPoweredParam = queryParams.get('powered') === 'true';

  const { latitude, longitude } = useGeolocation();
  const [activeType, setActiveType] = useState<AuditType>(initialType);
  const [viewMode, setViewMode] = useState<ViewMode>(initialMode);
  const [selectedStandard, setSelectedStandard] = useState<'osha' | 'epa' | 'niosh' | 'iso' | 'ilo' | 'ncr' | 'sds' | 'asme' | 'api' | 'robotics' | 'nfpa' | 'eu_machinery' | 'cal_osha' | 'bsee' | 'ansi' | 'msha' | 'imo' | 'iata' | 'who' | 'haccp' | 'dot' | 'csa' | 'asnzs' | 'nebosh' | 'gcc'>(initialType === 'robotics' ? 'robotics' : 'osha');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<AuditResult[]>([]);
  const [selectedResult, setSelectedResult] = useState<AuditResult | null>(null);
  const [isLive, setIsLive] = useState(false);
  const [isEnginePowered, setIsEnginePowered] = useState(true); // Default to true for better UX
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [showPredictive, setShowPredictive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [teamActivity, setTeamActivity] = useState<any[]>([]);
  const [isMobileRailOpen, setIsMobileRailOpen] = useState(false);

  // ── Backend Integration Hooks ──────────────────────────────────────────────────
  const { data: backendResults } = useVisualAuditResults();
  const saveAuditMutation = useSaveVisualAuditMutation();
  const deleteAuditMutation = useDeleteVisualAuditMutation();
  const addVoiceNoteMutation = useAddVoiceNoteMutation();

  // Simulate Team Activity for "500 people" scalability
  useEffect(() => {
    const activities = [
      { user: 'Sarah J.', action: 'PPE Audit', time: '2m ago', status: 'safe' },
      { user: 'Mike R.', action: 'Hazard Scan', time: '5m ago', status: 'danger' },
      { user: 'Alex K.', action: 'Machine Guarding', time: '12m ago', status: 'safe' },
      { user: 'Elena V.', action: 'Environment Scan', time: '15m ago', status: 'warning' },
      { user: 'David L.', action: 'PPE Audit', time: '22m ago', status: 'safe' },
    ];
    setTeamActivity(activities);
    
    const interval = setInterval(() => {
      const users = ['John D.', 'Emma W.', 'Chris P.', 'Lisa M.', 'Robert T.'];
      const actions = ['PPE Audit', 'Hazard Scan', 'Machine Guarding', 'Environment Scan'];
      const statuses = ['safe', 'warning', 'danger'];
      const newActivity = {
        user: users[Math.floor(Math.random() * users.length)],
        action: actions[Math.floor(Math.random() * actions.length)],
        time: 'Just now',
        status: statuses[Math.floor(Math.random() * statuses.length)]
      };
      setTeamActivity(prev => [newActivity, ...prev.slice(0, 4)]);
    }, 15000);
    
    return () => clearInterval(interval);
  }, []);
  const [isRecording, setIsRecording] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const auditTypes = [
    { id: 'environment', label: 'Environment Scan', icon: Camera, desc: 'Structural & area hazards' },
    { id: 'employee', label: 'PPE Compliance', icon: Users, desc: 'Worker safety gear check' },
    { id: 'machine', label: 'Machine Guarding', icon: Wrench, desc: 'Equipment safety audit' },
    { id: 'hazard', label: 'Hazard Detection', icon: AlertTriangle, desc: 'General risk identification' },
    { id: 'comparison', label: 'Visual Comparison', icon: Split, desc: 'Before vs After analysis' },
    { id: 'robotics', label: 'Robotics Safety', icon: Cpu, desc: 'ANSI/RIA & ISO compliance' },
  ] as const;

  const viewModes = [
    { id: 'upload', label: 'Upload', icon: Upload },
    { id: 'live', label: 'Live Monitor', icon: Activity },
    { id: 'batch', label: 'Batch Scan', icon: Grid3X3 },
    { id: 'compare', label: 'Compare', icon: Split },
  ] as const;

  // Load results from backend on mount, enrich with localStorage blob URLs for current session
  useEffect(() => {
    if (!backendResults) return;
    if (backendResults.length === 0) {
      // Try localStorage as fallback on first load before any backend data
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const loadedResults = parsed.map((r: any) => ({ ...r, timestamp: new Date(r.timestamp) }));
            setResults(loadedResults);
            if (initialId) {
              const found = loadedResults.find((r: any) => r.id === initialId);
              if (found) setSelectedResult(found);
            }
          }
        }
      } catch { localStorage.removeItem(STORAGE_KEY); }
      return;
    }
    // Build a cache of blob URLs from current session localStorage
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
    const merged: AuditResult[] = backendResults.map(r => ({
      id: r.id,
      type: r.type as AuditType,
      mediaUrl: blobCache[r.id] || '',
      mediaType: r.mediaType as 'image' | 'video',
      analysis: r.analysis,
      suggestions: r.suggestions,
      timestamp: new Date(r.createdAt),
      status: r.status as 'safe' | 'warning' | 'danger',
      hazards: r.hazards,
      ppeInventory: r.ppeInventory,
      voiceNotes: r.voiceNotes,
      location: r.locationLat != null && r.locationLng != null ? { lat: r.locationLat, lng: r.locationLng } : undefined,
    }));
    setResults(merged);
    if (initialId) {
      const found = merged.find(r => r.id === initialId);
      if (found) setSelectedResult(found);
    }
  }, [backendResults, initialId]);

  // Start camera for live mode or capture
  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) videoRef.current.srcObject = s;
    } catch (err) {
      console.error("Camera Error:", err);
      // Fallback for environments without camera access
    }
  };

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  }, [stream]);

  useEffect(() => {
    if (viewMode === 'live' || isLive) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [viewMode, isLive]);

  const capturePhoto = () => {
    if (videoRef.current && videoRef.current.readyState === 4) {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        
        if (canvas.width === 0 || canvas.height === 0) {
          setError("Camera stream not ready. Please wait a moment.");
          return;
        }

        const ctx = canvas.getContext('2d');
        ctx?.drawImage(videoRef.current, 0, 0);
        canvas.toBlob(async (blob) => {
          if (blob) {
            const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
            await handleFileUpload({ target: { files: [file] } } as any);
          } else {
            setError("Failed to capture image from camera.");
          }
        }, 'image/jpeg');
      } catch (err) {
        console.error("Capture Error:", err);
        setError("An error occurred while capturing the photo.");
      }
    } else {
      setError("Camera not ready. Please ensure camera access is granted.");
    }
  };

  // Blob URLs are session-only (not persisted to localStorage) - backend is source of truth for audit results

  // Simulate Live AI Monitoring
  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        // Randomly trigger "detections" in live mode
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Auto-power up if not already powered
    if (!isEnginePowered) {
      setIsEnginePowered(true);
    }

    setIsAnalyzing(true);
    const mediaUrl = URL.createObjectURL(file);
    
    try {
      const isVideo = file.type.startsWith('video');
      const response = isVideo 
        ? await aiService.analyzeVideo(mediaUrl, activeType === 'comparison' ? 'environment' : activeType, selectedStandard)
        : await aiService.analyzeImage(mediaUrl, activeType === 'comparison' ? 'environment' : activeType, selectedStandard);
      
      let standardRef = '';
      switch (selectedStandard) {
        case 'osha': standardRef = 'OSHA 1910.132'; break;
        case 'epa': standardRef = 'EPA 40 CFR 68'; break;
        case 'niosh': standardRef = 'NIOSH Pocket Guide'; break;
        case 'iso': standardRef = 'ISO 45001:2018'; break;
        case 'ilo': standardRef = 'ILO-OSH 2001'; break;
        case 'ncr': standardRef = 'NCR-2026-004'; break;
        case 'sds': standardRef = 'SDS-GHS-V3'; break;
        case 'asme': standardRef = 'ASME B30.5'; break;
        case 'api': standardRef = 'API RP 54'; break;
        case 'robotics': standardRef = 'ANSI/RIA R15.06 / ISO 10218'; break;
        case 'nfpa': standardRef = 'NFPA 70E / NFPA 1'; break;
        case 'eu_machinery': standardRef = 'EU Machinery Directive 2006/42/EC'; break;
        case 'cal_osha': standardRef = 'Cal/OSHA Title 8 CCR'; break;
        case 'bsee': standardRef = 'BSEE 30 CFR 250'; break;
        case 'ansi': standardRef = 'ANSI Z10 / ANSI Z359'; break;
        default: standardRef = 'International Standards';
      }

      // Generate dynamic hazards based on type
      const hazards: Hazard[] = activeType === 'employee' ? [
        { x: 45, y: 30, label: 'Missing Eye Protection', severity: 'high', standard: 'OSHA 1910.133' },
        { x: 50, y: 15, label: 'Hard Hat Detected', severity: 'low', standard: 'OSHA 1910.135' }
      ] : activeType === 'machine' ? [
        { x: 30, y: 50, label: 'Guard Misalignment', severity: 'medium', standard: 'OSHA 1910.212' },
        { x: 70, y: 45, label: 'E-Stop Obstructed', severity: 'high', standard: 'ISO 13850' }
      ] : activeType === 'robotics' ? [
        { x: 40, y: 40, label: 'Interlock Verification Required', severity: 'high', standard: 'ANSI/RIA R15.06' },
        { x: 60, y: 30, label: 'Cobot Force Limit Check', severity: 'low', standard: 'ISO/TS 15066' }
      ] : activeType === 'comparison' ? [
        { x: 35, y: 35, label: 'Improvement: Floor Markings', severity: 'low', standard: standardRef },
        { x: 65, y: 50, label: 'Regression: Extinguisher Blocked', severity: 'high', standard: 'NFPA 10' }
      ] : activeType === 'hazard' ? [
        { x: 25, y: 45, label: 'Unlabeled Chemical Container', severity: 'high', standard: 'EPA 40 CFR 262' },
        { x: 55, y: 25, label: 'Fire Extinguisher Expired', severity: 'medium', standard: 'NFPA 10' },
        { x: 75, y: 55, label: 'Blocked Emergency Exit', severity: 'high', standard: 'OSHA 1910.37' }
      ] : [
        { x: 30, y: 40, label: 'Trip Hazard', severity: 'high', standard: 'OSHA 1910.22' },
        { x: 70, y: 20, label: 'PPE Violation', severity: 'medium', standard: 'OSHA 1910.132' },
        { x: 50, y: 60, label: 'Unsafe Behavior', severity: 'low', standard: 'ISO 45001' }
      ];

      const newResult: AuditResult = {
        id: Date.now().toString(),
        type: activeType,
        mediaUrl,
        mediaType: file.type.startsWith('video') ? 'video' : 'image',
        analysis: response.content,
        suggestions: response.suggestions || [],
        timestamp: new Date(),
        status: response.content.toLowerCase().includes('missing') || response.content.toLowerCase().includes('hazard') || response.content.toLowerCase().includes('obstructed') ? 'danger' : 'safe',
        hazards,
        ppeInventory: activeType === 'employee' ? [
          { item: 'Hard Hat', status: 'detected' },
          { item: 'Safety Vest', status: 'detected' },
          { item: 'Eye Protection', status: 'missing' },
          { item: 'Gloves', status: 'incorrect' }
        ] : undefined,
        voiceNotes: [],
        location: latitude && longitude ? { lat: latitude, lng: longitude } : undefined
      };

      setResults([newResult, ...results]);
      setSelectedResult(newResult);
      setError(null);

      // Persist to backend (fire-and-forget — UI already updated)
      saveAuditMutation.mutate({
        id: newResult.id,
        type: newResult.type,
        mediaType: newResult.mediaType,
        analysis: newResult.analysis,
        suggestions: newResult.suggestions,
        status: newResult.status,
        hazards: newResult.hazards,
        ppeInventory: newResult.ppeInventory,
        voiceNotes: newResult.voiceNotes || [],
        locationLat: newResult.location?.lat,
        locationLng: newResult.location?.lng,
        standard: selectedStandard,
      });
    } catch (error) {
      console.error('Analysis Error:', error);
      setError("The AI Visual Engine encountered an error during analysis. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const deleteAudit = (id: string) => {
    setResults(results.filter(r => r.id !== id));
    if (selectedResult?.id === id) setSelectedResult(null);
    deleteAuditMutation.mutate(id);
  };

  const toggleVoiceRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording && selectedResult) {
      const note = "Voice note recorded at " + new Date().toLocaleTimeString();
      const updated = { ...selectedResult, voiceNotes: [...(selectedResult.voiceNotes || []), note] };
      setResults(results.map(r => r.id === updated.id ? updated : r));
      setSelectedResult(updated);
      addVoiceNoteMutation.mutate({ id: selectedResult.id, note });
    }
  };

  const sidebarContent = (
    <div className="p-4 sm:p-6 space-y-6">
      <div>
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Inspection Type</h3>
        <div className="space-y-2">
          {auditTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => {
                setActiveType(type.id as AuditType);
                setIsMobileRailOpen(false);
              }}
              className={`flex w-full items-start gap-4 rounded-2xl border p-4 transition-all ${
                activeType === type.id
                  ? 'border-accent/30 bg-accent/10 text-text-primary shadow-soft'
                  : 'border-transparent bg-surface-sunken text-text-secondary hover:border-surface-border hover:bg-surface-overlay'
              }`}
            >
              <div className={`rounded-xl p-2 ${activeType === type.id ? 'bg-accent text-text-onAccent' : 'bg-surface-overlay text-text-muted'}`}>
                {type.icon ? <type.icon className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
              </div>
              <div className="text-left">
                <p className="text-sm font-bold leading-none mb-1">{type.label}</p>
                <p className="text-[10px] opacity-60">{type.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="border-t border-surface-border pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Audit History</h3>
          {results.length > 0 && (
            <button
              onClick={() => { if(confirm('Clear all history?')) setResults([]); }}
              className="text-[9px] text-red-400 hover:text-red-300 font-bold uppercase tracking-widest"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="space-y-3">
          {results.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-surface-border bg-surface-sunken p-8 text-center">
              <History className="mx-auto mb-2 h-8 w-8 text-text-muted" />
              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">No history yet</p>
            </div>
          ) : (
            results.map((res) => (
              <div key={res.id} className="group relative">
                <button
                  onClick={() => {
                    setSelectedResult(res);
                    setIsMobileRailOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                    selectedResult?.id === res.id ? 'bg-surface-overlay ring-1 ring-accent/20' : 'hover:bg-surface-sunken'
                  }`}
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
                    <img
                      src={res.mediaUrl}
                      alt="Scan"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=100';
                      }}
                    />
                  </div>
                  <div className="text-left min-w-0">
                    <p className="text-xs font-bold text-text-primary truncate capitalize">{res.type} Scan</p>
                    <p className="text-[10px] text-text-muted">{formatTimestamp(res.timestamp)}</p>
                  </div>
                  <div className={`ml-auto w-2 h-2 rounded-full ${
                    res.status === 'safe' ? 'bg-emerald-500' : res.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteAudit(res.id); }}
                  className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="w-2 h-2 text-white" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="border-t border-surface-border pt-6">
        <h3 className="mb-4 text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Team Activity (Live)</h3>
        <div className="space-y-3">
          {teamActivity.map((act, i) => (
            <div key={i} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-sunken p-2">
              <div className={`w-1.5 h-8 rounded-full ${
                act.status === 'safe' ? 'bg-emerald-500' : act.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
              }`} />
              <div className="min-w-0">
                <p className="truncate text-[10px] font-bold text-text-primary">{act.user} performed {act.action}</p>
                <p className="text-[8px] uppercase tracking-widest text-text-muted">{act.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="ai-purple-theme page-wrapper flex flex-col overflow-hidden selection:bg-accent/20">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-accent/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[50%] w-[50%] rounded-full bg-primary/10 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="shrink-0 border-b border-surface-border bg-surface-raised/90 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-8">
          <div className="flex min-h-16 flex-wrap items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/visual-audit')}
                className="group rounded-2xl p-2.5 text-text-muted transition-colors hover:bg-surface-overlay"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="page-title">AI Visual Audit</h1>
                  <p className="text-[11px] font-medium uppercase tracking-widest text-text-muted">Safety Vision Intelligence</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-3 rounded-2xl border border-surface-border bg-surface-sunken px-4 py-2">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                <select
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value as any)}
                  className="cursor-pointer bg-transparent text-[10px] font-bold uppercase tracking-widest text-text-secondary outline-none transition-colors hover:text-accent"
                >
                  <option value="osha">OSHA (USA)</option>
                  <option value="epa">EPA (Environmental)</option>
                  <option value="niosh">NIOSH (Health)</option>
                  <option value="iso">ISO 45001</option>
                  <option value="ilo">ILO Global</option>
                  <option value="ncr">NCR (Non-Conformance)</option>
                  <option value="sds">SDS (Chemical Safety)</option>
                  <option value="asme">ASME (Mechanical)</option>
                  <option value="api">API (Petroleum)</option>
                  <option value="robotics">Robotics (ANSI/ISO)</option>
                  <option value="nfpa">NFPA (Fire/Electrical)</option>
                  <option value="eu_machinery">EU Machinery Dir.</option>
                  <option value="cal_osha">Cal/OSHA (California)</option>
                  <option value="bsee">BSEE (Offshore Safety)</option>
                  <option value="ansi">ANSI Standards</option>
                </select>
              </div>
            </div>

            <div className="hidden md:flex items-center gap-1 rounded-2xl border border-surface-border bg-surface-sunken p-1">
              {viewModes.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                    viewMode === mode.id ? 'bg-accent text-text-onAccent shadow-soft' : 'text-text-muted hover:bg-surface-overlay hover:text-text-primary'
                  }`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-xl border border-success/25 bg-success/10 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-success">
                <div className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
                Engine Online
              </div>
              <button className="rounded-xl p-2 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary">
                <Settings className="w-5 h-5" />
              </button>
              <button className="rounded-xl p-2 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="pb-3 lg:hidden">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsMobileRailOpen(true)}
                  className="flex min-w-0 items-center gap-2 rounded-2xl border border-surface-border bg-surface-sunken px-4 py-3 text-[10px] font-black uppercase tracking-widest text-text-primary transition-colors hover:bg-surface-overlay"
                >
                  <Layers className="w-4 h-4 text-accent" />
                  Inspection Tools
                </button>
                <div className="flex min-w-0 flex-1 items-center gap-2 rounded-2xl border border-surface-border bg-surface-sunken px-3 py-3">
                  <Globe className="w-4 h-4 shrink-0 text-accent" />
                  <select
                    value={selectedStandard}
                    onChange={(e) => setSelectedStandard(e.target.value as any)}
                    className="min-w-0 flex-1 cursor-pointer bg-transparent text-[10px] font-bold uppercase tracking-widest text-text-secondary outline-none"
                  >
                    <option value="osha">OSHA (USA)</option>
                    <option value="epa">EPA (Environmental)</option>
                    <option value="niosh">NIOSH (Health)</option>
                    <option value="iso">ISO 45001</option>
                    <option value="ilo">ILO Global</option>
                    <option value="ncr">NCR (Non-Conformance)</option>
                    <option value="sds">SDS (Chemical Safety)</option>
                    <option value="asme">ASME (Mechanical)</option>
                    <option value="api">API (Petroleum)</option>
                    <option value="robotics">Robotics (ANSI/ISO)</option>
                    <option value="nfpa">NFPA (Fire/Electrical)</option>
                    <option value="eu_machinery">EU Machinery Dir.</option>
                    <option value="cal_osha">Cal/OSHA (California)</option>
                    <option value="bsee">BSEE (Offshore Safety)</option>
                    <option value="ansi">ANSI Standards</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-1">
                {viewModes.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setViewMode(mode.id as ViewMode)}
                    className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all ${
                      viewMode === mode.id ? 'bg-accent text-text-onAccent shadow-soft' : 'border border-surface-border bg-surface-sunken text-text-muted hover:bg-surface-overlay hover:text-text-primary'
                    }`}
                  >
                    <mode.icon className="w-3.5 h-3.5" />
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {isMobileRailOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileRailOpen(false)}
              className="absolute inset-0 bg-surface-base/70 backdrop-blur-sm"
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="relative h-full w-[min(88vw,360px)] overflow-y-auto border-r border-surface-border bg-surface-raised shadow-2xl"
            >
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-border bg-surface-raised/95 px-4 py-4 backdrop-blur-xl">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Audit Workspace</p>
                  <h2 className="mt-1 text-base font-black text-text-primary">Tools and history</h2>
                </div>
                <button
                  onClick={() => setIsMobileRailOpen(false)}
                  className="rounded-xl p-2 text-text-muted transition-colors hover:bg-surface-overlay hover:text-text-primary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>

      <main className="relative z-10 flex flex-1 flex-col overflow-hidden lg:grid lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* Sidebar - Tool Selection & History */}
        <aside className="hidden overflow-y-auto border-r border-surface-border bg-surface-raised/70 lg:block">
          {sidebarContent}
        </aside>

        {/* Main Viewport */}
        <div className="relative flex flex-1 flex-col overflow-hidden bg-surface-base">
          {viewMode === 'upload' && (
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
              <AnimatePresence mode="wait">
                {!selectedResult ? (
                  <motion.div
                    key="upload-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="mx-auto w-full max-w-[1240px]"
                  >
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_360px]">
                      <div className="space-y-6 rounded-[2rem] border border-surface-border bg-surface-raised p-6 shadow-card sm:p-8">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div className="max-w-2xl space-y-3">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-accent">Visual Audit Engine</span>
                              <span className="rounded-full border border-surface-border bg-surface-sunken px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{activeType} mode</span>
                            </div>
                            <div>
                              <h2 className="text-3xl font-black tracking-tight text-text-primary sm:text-4xl">Drop Media to Analyze</h2>
                              <p className="mt-2 max-w-xl text-sm leading-relaxed text-text-muted">Upload photos or videos for real-time AI safety auditing, run quick PPE and hazard checks, or switch into live monitoring without leaving this workspace.</p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-3 sm:min-w-[260px]">
                            <div className="rounded-2xl border border-surface-border bg-surface-sunken p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Detection Speed</p>
                              <p className="mt-2 text-xl font-black text-text-primary">3.2s</p>
                            </div>
                            <div className="rounded-2xl border border-surface-border bg-surface-sunken p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Active Standard</p>
                              <p className="mt-2 text-xl font-black text-accent">{selectedStandard.toUpperCase()}</p>
                            </div>
                          </div>
                        </div>

                        <div
                          onClick={() => fileInputRef.current?.click()}
                          className="group relative flex aspect-video cursor-pointer flex-col items-center justify-center overflow-hidden rounded-[2.5rem] border-2 border-dashed border-surface-border bg-surface-sunken transition-all hover:border-accent/40 hover:bg-surface-overlay"
                        >
                          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(18,178,168,0.14),_transparent_55%),radial-gradient(circle_at_bottom_right,_rgba(12,77,162,0.10),_transparent_45%)] opacity-0 transition-opacity group-hover:opacity-100" />

                          <div className="relative z-10 p-8 text-center sm:p-12">
                            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-surface-raised text-accent shadow-soft transition-all duration-500 group-hover:scale-110 group-hover:bg-accent group-hover:text-text-onAccent">
                              <Upload className="h-10 w-10" />
                            </div>
                            <h3 className="mb-2 text-2xl font-black text-text-primary">Upload or Drag Files</h3>
                            <p className="mb-8 text-sm text-text-muted">Supports image and video evidence for AI-led hazard detection, PPE verification, and machinery review.</p>

                            <div className="flex flex-wrap items-center justify-center gap-3">
                              <span className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Select Files</span>
                              <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">or</span>
                              <span className="rounded-xl border border-surface-border bg-surface-raised px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary">Drag & Drop</span>
                            </div>
                          </div>

                          {isAnalyzing && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-surface-base/85 backdrop-blur-md">
                              <div className="relative mb-8">
                                <div className="h-32 w-32 animate-spin rounded-full border-4 border-accent/20 border-t-accent" />
                                <Brain className="absolute left-1/2 top-1/2 h-12 w-12 -translate-x-1/2 -translate-y-1/2 animate-pulse text-accent" />
                                <motion.div
                                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute -top-4 -left-4 h-12 w-12 rounded-lg border-2 border-emerald-500"
                                />
                                <motion.div
                                  animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
                                  transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                  className="absolute -bottom-4 -right-4 h-16 w-16 rounded-lg border-2 border-red-500"
                                />
                              </div>
                              <p className="animate-pulse text-xl font-black uppercase tracking-tighter text-text-primary">AI Vision Engine Analyzing...</p>
                              <div className="mt-4 flex gap-2">
                                <span className="rounded-full border border-surface-border bg-surface-raised px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-text-muted">Scanning Pixels</span>
                                <span className="rounded-full border border-surface-border bg-surface-raised px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-text-muted">Mapping Hazards</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                          <button
                            onClick={startCamera}
                            className="group flex items-center justify-center gap-3 rounded-2xl border border-surface-border bg-primary px-4 py-4 font-bold text-text-inverted transition-all hover:brightness-110"
                          >
                            <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs uppercase tracking-widest">Open Camera</span>
                          </button>
                          <button
                            onClick={() => setViewMode('live')}
                            className="group flex items-center justify-center gap-3 rounded-2xl border border-accent/20 bg-accent px-4 py-4 font-bold text-text-onAccent transition-all hover:brightness-110"
                          >
                            <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                            <span className="text-xs uppercase tracking-widest">Live Stream</span>
                          </button>
                        </div>

                        <div className="grid gap-4 md:grid-cols-3">
                          {[
                            { label: 'Best for', value: activeType === 'employee' ? 'PPE verification' : activeType === 'machine' ? 'Guarding checks' : 'Hazard discovery' },
                            { label: 'Accepted media', value: 'Images and video clips' },
                            { label: 'Output', value: 'Findings, overlays, recommendations' },
                          ].map((item) => (
                            <div key={item.label} className="rounded-2xl border border-surface-border bg-surface-sunken p-4">
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">{item.label}</p>
                              <p className="mt-2 text-sm font-semibold text-text-primary">{item.value}</p>
                            </div>
                          ))}
                        </div>

                        {stream && (
                          <div className="relative aspect-video overflow-hidden rounded-[2.5rem] border border-surface-border bg-black">
                            <video ref={videoRef} autoPlay playsInline className="h-full w-full object-cover" />
                            <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-4">
                              <button
                                onClick={capturePhoto}
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-2xl transition-all hover:scale-110 active:scale-95"
                              >
                                <div className="h-12 w-12 rounded-full border-4 border-black" />
                              </button>
                              <button
                                onClick={stopCamera}
                                className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500 shadow-2xl transition-all hover:scale-110 active:scale-95"
                              >
                                <X className="w-8 h-8 text-white" />
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4 rounded-[2rem] border border-surface-border bg-surface-raised p-6 shadow-card">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Workspace Guide</p>
                          <h3 className="mt-2 text-2xl font-black text-text-primary">Faster visual audits with less clutter</h3>
                          <p className="mt-2 text-sm leading-relaxed text-text-muted">This layout keeps media capture on the left and decision-support context on the right so operators can stay focused during upload and review.</p>
                        </div>
                        <div className="space-y-3">
                          {[
                            'Choose inspection mode from the left rail before uploading evidence.',
                            'Use live stream for active monitoring zones and upload mode for evidence-based audits.',
                            'Saved scans remain available in history for quick comparison and reporting.',
                          ].map((tip) => (
                            <div key={tip} className="flex items-start gap-3 rounded-2xl border border-surface-border bg-surface-sunken p-4">
                              <div className="mt-1 h-2.5 w-2.5 rounded-full bg-accent" />
                              <p className="text-sm leading-relaxed text-text-secondary">{tip}</p>
                            </div>
                          ))}
                        </div>
                        <div className="rounded-2xl border border-surface-border bg-surface-sunken p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-text-muted">Engine State</p>
                              <p className="mt-1 text-lg font-black text-success">{isEnginePowered ? 'Online and ready' : 'Standby mode'}</p>
                            </div>
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success/10 text-success">
                              <Sparkles className="h-6 w-6" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileUpload} 
                      className="hidden" 
                      accept="image/*,video/*"
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key={selectedResult.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="h-full w-full overflow-y-auto p-4 lg:p-8"
                  >
                    <div className="mx-auto grid w-full max-w-[1320px] gap-8 xl:grid-cols-[minmax(0,1.35fr)_420px]">
                    {/* Media Preview & Heatmap */}
                    <div className="group relative min-h-[400px] overflow-hidden rounded-[2rem] border border-surface-border bg-black shadow-card">
                      {error && (
                        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-surface-base/90 p-8 text-center backdrop-blur-md">
                          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                          <p className="mb-4 font-bold text-text-primary">{error}</p>
                          <button 
                            onClick={() => setError(null)}
                            className="rounded-lg bg-surface-raised px-4 py-2 text-xs font-bold uppercase tracking-widest text-text-primary transition-all hover:bg-surface-overlay"
                          >
                            Dismiss
                          </button>
                        </div>
                      )}

                      {selectedResult.mediaType === 'video' ? (
                        <video 
                          src={selectedResult.mediaUrl} 
                          className="w-full h-full object-contain" 
                          controls 
                          autoPlay 
                          loop 
                          muted 
                          playsInline
                          onError={() => setError("Failed to load video. The file may be corrupted or the temporary link has expired.")}
                        />
                      ) : (
                        <img 
                          src={selectedResult.mediaUrl} 
                          alt="Analysis" 
                          className="w-full h-full object-contain" 
                          onError={() => setError("Failed to load image. The file may be corrupted or the temporary link has expired.")}
                        />
                      )}
                      
                      {/* Heatmap Overlay (Simulated) */}
                      {showHeatmap && (
                        <div className="absolute inset-0 bg-red-500/20 mix-blend-overlay pointer-events-none">
                          <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-red-600/40 blur-3xl rounded-full animate-pulse" />
                          <div className="absolute bottom-1/3 right-1/3 w-48 h-48 bg-orange-600/30 blur-3xl rounded-full animate-pulse" />
                        </div>
                      )}

                      {/* Hazard Overlays */}
                      <AnimatePresence>
                        {selectedResult.hazards?.map((h, i) => (
                          <motion.div
                            key={`${selectedResult.id}-hazard-${i}`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ delay: 0.5 + i * 0.1, type: 'spring', stiffness: 200 }}
                            style={{ left: `${h.x}%`, top: `${h.y}%` }}
                            className="absolute group/hazard -translate-x-1/2 -translate-y-1/2 z-30"
                          >
                            <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg animate-ping absolute inset-0 ${
                              h.severity === 'high' ? 'bg-red-500' : h.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`} />
                            <div className={`w-8 h-8 rounded-full border-2 border-white shadow-lg relative z-10 flex items-center justify-center ${
                              h.severity === 'high' ? 'bg-red-500' : h.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'
                            }`}>
                              <AlertTriangle className="w-4 h-4 text-white" />
                            </div>
                            
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/hazard:opacity-100 transition-all duration-300 pointer-events-none z-40 scale-90 group-hover/hazard:scale-100">
                              <div className="whitespace-nowrap rounded-2xl border border-surface-border bg-surface-raised/95 p-4 shadow-card ring-1 ring-accent/5 backdrop-blur-xl">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-2 h-2 rounded-full ${h.severity === 'high' ? 'bg-red-500' : h.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                  <p className="text-xs font-black uppercase tracking-widest text-text-primary">{h.label}</p>
                                </div>
                                <p className="mb-2 text-[10px] font-bold uppercase text-text-muted">{h.severity} Severity Detected</p>
                                {h.standard && (
                                  <div className="border-t border-surface-border pt-2">
                                    <p className="text-[9px] font-black uppercase tracking-tighter text-accent">Compliance: {h.standard}</p>
                                  </div>
                                )}
                              </div>
                              <div className="mx-auto -mt-1.5 h-3 w-3 rotate-45 border-b border-r border-surface-border bg-surface-raised" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-col gap-3 opacity-100 transition-opacity sm:bottom-6 sm:left-6 sm:right-6 sm:flex-row sm:items-center sm:justify-between sm:opacity-0 sm:group-hover:opacity-100">
                        <div className="flex flex-wrap gap-2">
                          <button 
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={`rounded-2xl border p-3 text-text-primary transition-colors backdrop-blur-md ${showHeatmap ? 'border-accent/20 bg-accent text-text-onAccent' : 'border-surface-border bg-surface-raised/90 hover:bg-surface-overlay'}`}
                            title="Toggle Risk Heatmap"
                          >
                            <MapIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setShowPredictive(!showPredictive)}
                            className={`rounded-2xl border p-3 text-text-primary transition-colors backdrop-blur-md ${showPredictive ? 'border-primary/20 bg-primary text-text-inverted' : 'border-surface-border bg-surface-raised/90 hover:bg-surface-overlay'}`}
                            title="AI Predictive Analysis"
                          >
                            <TrendingUp className="w-5 h-5" />
                          </button>
                          <button className="rounded-2xl border border-surface-border bg-surface-raised/90 p-3 text-text-primary transition-colors backdrop-blur-md hover:bg-surface-overlay">
                            <Maximize2 className="w-5 h-5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => setSelectedResult(null)}
                          className="w-full rounded-2xl bg-accent px-6 py-3 text-xs font-bold uppercase tracking-widest text-text-onAccent transition-all shadow-soft hover:brightness-110 sm:w-auto"
                        >
                          New Scan
                        </button>
                      </div>
                    </div>

                    {/* Analysis & Features Panel */}
                    <div className="flex w-full flex-col gap-6 shrink-0">
                      {/* Main Analysis */}
                      <div className="rounded-3xl border border-surface-border bg-surface-raised p-6 shadow-card backdrop-blur-xl">
                        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              selectedResult.status === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {selectedResult.status === 'safe' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-text-primary">AI Analysis</h3>
                              <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                                {selectedResult.status === 'safe' ? 'Compliant' : 'Action Required'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">Confidence</p>
                            <p className="text-lg font-black text-accent">98.4%</p>
                          </div>
                        </div>

                        <div className="mb-6 rounded-2xl border border-surface-border bg-surface-sunken p-4">
                          <p className="mb-2 text-sm italic leading-relaxed text-text-secondary">
                            "{selectedResult.analysis}"
                          </p>
                          {selectedResult.location && (
                            <div className="flex items-center gap-2 text-[9px] font-bold uppercase tracking-widest text-text-muted">
                              <MapIcon className="w-3 h-3" />
                              GPS: {selectedResult.location.lat.toFixed(4)}, {selectedResult.location.lng.toFixed(4)}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-text-muted">Recommendations</h4>
                          {selectedResult.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 group">
                              <div className="mt-1.5 h-1.5 w-1.5 rounded-full bg-accent transition-transform group-hover:scale-150" />
                              <p className="text-xs text-text-secondary transition-colors group-hover:text-text-primary">{s}</p>
                            </div>
                          ))}
                        </div>

                        {/* Predictive Analysis Overlay (New Feature) */}
                        <AnimatePresence>
                          {showPredictive && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: 10 }}
                              className="mt-6 rounded-2xl border border-primary/20 bg-primary/10 p-4"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">AI Predictive Insight</span>
                              </div>
                              <p className="text-[10px] leading-relaxed text-text-secondary">
                                Based on visual wear patterns, this component has a 12% probability of failure within the next 200 operational hours.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Media Gallery (New Feature) */}
                      <div className="rounded-3xl border border-surface-border bg-surface-raised p-6 shadow-card backdrop-blur-xl">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Layers className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold text-text-primary">Media Gallery</h3>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                          {[selectedResult.mediaUrl, ...results.slice(0, 2).map(r => r.mediaUrl)].map((url, i) => (
                            <div key={i} className="group aspect-square cursor-pointer overflow-hidden rounded-xl border border-surface-border bg-surface-sunken">
                              <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </div>
                          ))}
                          <button className="flex aspect-square items-center justify-center rounded-xl border-2 border-dashed border-surface-border text-text-muted transition-all hover:border-accent/40 hover:text-accent">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* PPE Inventory (Enhanced Feature) */}
                      {selectedResult.ppeInventory && (
                        <div className="rounded-3xl border border-surface-border bg-surface-raised p-6 shadow-card backdrop-blur-xl">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              <ClipboardList className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">PPE Inventory</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                            {selectedResult.ppeInventory.map((item, i) => (
                              <div key={i} className="flex items-center justify-between rounded-2xl border border-surface-border bg-surface-sunken p-3">
                                <span className="text-xs font-bold text-text-secondary">{item.item}</span>
                                {item.status === 'detected' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                ) : item.status === 'missing' ? (
                                  <XCircle className="w-4 h-4 text-red-500" />
                                ) : (
                                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Voice Annotations (Enhanced Feature) */}
                      <div className="rounded-3xl border border-surface-border bg-surface-raised p-6 shadow-card backdrop-blur-xl">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                              <Mic className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-text-primary">Voice Annotations</h3>
                          </div>
                          <button 
                            onClick={toggleVoiceRecording}
                            className={`rounded-full p-3 transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse' : 'bg-surface-sunken text-text-primary hover:bg-surface-overlay'}`}
                          >
                            {isRecording ? <SquareCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {!selectedResult.voiceNotes || selectedResult.voiceNotes.length === 0 ? (
                            <p className="py-4 text-center text-[10px] font-bold uppercase tracking-widest text-text-muted">No voice notes recorded</p>
                          ) : (
                            selectedResult.voiceNotes.map((note, i) => (
                              <div key={i} className="flex items-center gap-3 rounded-xl border border-surface-border bg-surface-sunken p-3">
                                <Volume2 className="w-4 h-4 text-accent" />
                                <p className="text-[11px] text-text-secondary">{note}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <button className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface-raised p-4 transition-colors hover:bg-surface-overlay">
                          <Download className="w-5 h-5 text-text-muted group-hover:text-accent" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Export PDF</span>
                        </button>
                        <button className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-surface-border bg-surface-raised p-4 transition-colors hover:bg-surface-overlay">
                          <Share2 className="w-5 h-5 text-text-muted group-hover:text-accent" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Share Audit</span>
                        </button>
                      </div>
                    </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {viewMode === 'batch' && (
            <div className="flex flex-1 flex-col overflow-y-auto p-8">
              <div className="max-w-4xl mx-auto w-full">
                <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="mb-1 text-2xl font-black text-text-primary">Enterprise Batch Scan</h2>
                    <p className="text-sm text-text-muted">Analyze up to 500 assets simultaneously using distributed AI nodes</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAnalyzing(true);
                      setTimeout(() => {
                        setIsAnalyzing(false);
                        alert('Batch analysis of 42 items complete. 38 Safe, 4 Hazards detected.');
                      }, 3000);
                    }}
                    className="rounded-2xl bg-accent px-6 py-3 text-xs font-bold uppercase tracking-widest text-text-onAccent transition-all shadow-soft hover:brightness-110"
                  >
                    Start Batch Process
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="group flex aspect-square flex-col items-center justify-center rounded-2xl border border-surface-border bg-surface-raised transition-all hover:border-accent/30 hover:bg-surface-overlay">
                      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-surface-sunken transition-colors group-hover:bg-accent/10">
                        <FileText className="w-6 h-6 text-text-muted group-hover:text-accent" />
                      </div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">Asset_{1000 + i}</p>
                      <div className="mt-2 h-1 w-16 overflow-hidden rounded-full bg-surface-sunken">
                        <div className="h-full w-0 bg-accent transition-all duration-1000 group-hover:w-full" />
                      </div>
                    </div>
                  ))}
                  <button className="flex aspect-square flex-col items-center justify-center rounded-2xl border-2 border-dashed border-surface-border text-text-muted transition-all hover:border-accent/40 hover:text-accent">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add More</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'live' && (
            <div className="relative flex-1 overflow-hidden rounded-t-[2rem] bg-surface-base lg:rounded-none">
              {/* Multi-Cam Grid Simulation */}
              <div className="absolute inset-0 grid grid-cols-1 gap-1 p-1 sm:grid-cols-2 sm:grid-rows-2">
                {[
                  { name: 'Loading Dock A', status: 'safe', icon: Activity },
                  { name: 'Fabrication Shop', status: 'warning', icon: Zap },
                  { name: 'Main Entrance', status: 'safe', icon: Eye },
                  { name: 'Warehouse Zone B', status: 'danger', icon: AlertTriangle },
                ].map((cam, i) => (
                  <div key={i} className="group relative overflow-hidden border border-surface-border bg-surface-raised/80">
                    <div className="absolute inset-0 bg-gradient-to-t from-primary/20 via-transparent to-accent/10 opacity-80" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        cam.status === 'safe' ? 'bg-emerald-500' : cam.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-[9px] font-black uppercase tracking-widest text-text-primary">{cam.name}</span>
                    </div>
                    
                    {/* Simulated Scan Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-1/4 h-[1px] w-full bg-accent/20 animate-[scan_4s_linear_infinite]" />
                      <div className="absolute top-3/4 h-[1px] w-full bg-accent/20 animate-[scan_6s_linear_infinite]" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-20 transition-opacity group-hover:opacity-40">
                      <cam.icon className="h-20 w-20 text-text-primary" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live HUD Overlays */}
              <div className="absolute left-4 right-4 top-4 flex flex-col gap-2 sm:left-8 sm:right-auto sm:top-8 sm:flex-row sm:items-center sm:gap-4">
                <div className="flex items-center gap-2 rounded-full bg-danger px-4 py-2 shadow-soft">
                  <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white">Live Monitoring</span>
                </div>
                <div className="rounded-full border border-surface-border bg-surface-raised/90 px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-text-secondary backdrop-blur-md">
                  Cam-04: Loading Dock
                </div>
              </div>

              <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-4 sm:bottom-8 sm:left-8 sm:right-8 sm:flex-row sm:items-end sm:justify-between">
                <div className="space-y-2">
                  <div className="max-w-xs rounded-2xl border border-surface-border bg-surface-raised/90 p-4 backdrop-blur-md">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-text-primary">Real-time Detection</span>
                    </div>
                    <p className="text-xs text-text-secondary">No PPE violations detected in the last 15 minutes.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="rounded-2xl border border-surface-border bg-surface-raised/90 p-4 text-text-primary transition-colors backdrop-blur-md hover:bg-surface-overlay">
                    <Pause className="w-6 h-6" />
                  </button>
                  <button className="rounded-2xl border border-surface-border bg-surface-raised/90 p-4 text-text-primary transition-colors backdrop-blur-md hover:bg-surface-overlay">
                    <Maximize2 className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

// Helper component for the stop icon
const SquareCircle: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);

export default AIVisualAudit;
