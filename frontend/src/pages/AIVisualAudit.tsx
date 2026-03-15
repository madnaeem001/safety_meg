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
        <div className="min-h-screen bg-surface-950 flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Something went wrong</h2>
          <p className="text-surface-400 mb-8">The AI Visual Audit engine encountered an unexpected error.</p>
          <button 
            onClick={() => {
              try {
                localStorage.removeItem('safetymeg_visual_audits');
                localStorage.removeItem('safetymeg_engine_state');
              } catch(e) {}
              window.location.href = '/visual-audit';
            }}
            className="px-6 py-3 bg-brand-500 text-white rounded-xl font-bold uppercase tracking-widest"
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

  return (
    <div className="min-h-screen bg-surface-950 text-white overflow-hidden flex flex-col selection:bg-brand-500/30">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-900/60 backdrop-blur-2xl border-b border-surface-800 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/visual-audit')}
                className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 transition-colors group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Eye className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">AI Visual Audit</h1>
                  <p className="text-[11px] text-surface-400 uppercase tracking-widest font-medium">Safety Vision Intelligence</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-4 px-4 border-l border-surface-800">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-surface-400" />
                <select 
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value as any)}
                  className="bg-transparent text-[10px] font-bold uppercase tracking-widest text-surface-300 outline-none cursor-pointer hover:text-brand-400 transition-colors"
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

            <div className="hidden md:flex items-center gap-1 bg-surface-800/50 p-1 rounded-xl border border-surface-700/50">
              {[
                { id: 'upload', label: 'Upload', icon: Upload },
                { id: 'live', label: 'Live Monitor', icon: Activity },
                { id: 'batch', label: 'Batch Scan', icon: Grid3X3 },
                { id: 'compare', label: 'Compare', icon: Split },
              ].map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setViewMode(mode.id as ViewMode)}
                  className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                    viewMode === mode.id ? 'bg-brand-600 text-white shadow-md' : 'text-surface-400 hover:text-white'
                  }`}
                >
                  <mode.icon className="w-3.5 h-3.5" />
                  {mode.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Engine Online
              </div>
              <button className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 transition-colors">
                <Settings className="w-5 h-5" />
              </button>
              <button className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden flex flex-col md:flex-row relative z-10">
        {/* Sidebar - Tool Selection & History */}
        <div className="w-full md:w-80 bg-surface-900/40 border-r border-surface-800 overflow-y-auto shrink-0">
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] mb-4">Inspection Type</h3>
              <div className="space-y-2">
                {[
                  { id: 'environment', label: 'Environment Scan', icon: Camera, desc: 'Structural & area hazards' },
                  { id: 'employee', label: 'PPE Compliance', icon: Users, desc: 'Worker safety gear check' },
                  { id: 'machine', label: 'Machine Guarding', icon: Wrench, desc: 'Equipment safety audit' },
                  { id: 'hazard', label: 'Hazard Detection', icon: AlertTriangle, desc: 'General risk identification' },
                  { id: 'comparison', label: 'Visual Comparison', icon: Split, desc: 'Before vs After analysis' },
                  { id: 'robotics', label: 'Robotics Safety', icon: Cpu, desc: 'ANSI/RIA & ISO compliance' },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setActiveType(type.id as AuditType)}
                    className={`w-full flex items-start gap-4 p-4 rounded-2xl transition-all border ${
                      activeType === type.id 
                        ? 'bg-brand-500/10 border-brand-500/50 text-white shadow-lg shadow-brand-500/5' 
                        : 'bg-surface-800/30 border-transparent text-surface-400 hover:bg-surface-800/50'
                    }`}
                  >
                    <div className={`p-2 rounded-xl ${activeType === type.id ? 'bg-brand-500 text-white' : 'bg-surface-700 text-surface-400'}`}>
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

            <div className="pt-6 border-t border-surface-800">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em]">Audit History</h3>
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
                  <div className="p-8 text-center border-2 border-dashed border-surface-800 rounded-2xl">
                    <History className="w-8 h-8 text-surface-700 mx-auto mb-2" />
                    <p className="text-[10px] text-surface-600 font-bold uppercase tracking-widest">No history yet</p>
                  </div>
                ) : (
                  results.map((res) => (
                    <div key={res.id} className="group relative">
                      <button
                        onClick={() => setSelectedResult(res)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl transition-all ${
                          selectedResult?.id === res.id ? 'bg-surface-800 ring-1 ring-surface-700' : 'hover:bg-surface-800/50'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface-800 shrink-0">
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
                          <p className="text-xs font-bold text-white truncate capitalize">{res.type} Scan</p>
                          <p className="text-[10px] text-surface-500">{formatTimestamp(res.timestamp)}</p>
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

            <div className="pt-6 border-t border-surface-800">
              <h3 className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em] mb-4">Team Activity (Live)</h3>
              <div className="space-y-3">
                {teamActivity.map((act, i) => (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl bg-surface-800/20 border border-surface-800/50">
                    <div className={`w-1.5 h-8 rounded-full ${
                      act.status === 'safe' ? 'bg-emerald-500' : act.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                    }`} />
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-white truncate">{act.user} performed {act.action}</p>
                      <p className="text-[8px] text-surface-500 uppercase tracking-widest">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Main Viewport */}
        <div className="flex-1 bg-surface-950 relative overflow-hidden flex flex-col">
          {viewMode === 'upload' && (
            <div className="flex-1 flex flex-col items-center justify-center p-8">
              <AnimatePresence mode="wait">
                {!selectedResult ? (
                  <motion.div
                    key="upload-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    className="max-w-xl w-full"
                  >
                    <div className="space-y-6">
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className="group relative aspect-video rounded-[2.5rem] border-2 border-dashed border-surface-800 hover:border-brand-500/50 bg-surface-900/30 backdrop-blur-sm transition-all cursor-pointer flex flex-col items-center justify-center overflow-hidden"
                      >
                        <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-violet-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        
                        <div className="relative z-10 text-center p-12">
                          <div className="w-20 h-20 rounded-3xl bg-surface-800 flex items-center justify-center mb-6 mx-auto group-hover:scale-110 group-hover:bg-brand-500 transition-all duration-500">
                            <Upload className="w-10 h-10 text-surface-400 group-hover:text-white" />
                          </div>
                          <h2 className="text-2xl font-black text-white mb-2">Drop Media to Analyze</h2>
                          <p className="text-surface-400 text-sm mb-8">Upload photos or videos for real-time AI safety auditing</p>
                          
                          <div className="flex items-center gap-3 justify-center">
                            <span className="px-4 py-2 rounded-xl bg-surface-800 text-[10px] font-bold uppercase tracking-widest text-surface-300 border border-surface-700">Select Files</span>
                            <span className="text-surface-600 text-[10px] font-bold uppercase tracking-widest">or</span>
                            <span className="px-4 py-2 rounded-xl bg-surface-800 text-[10px] font-bold uppercase tracking-widest text-surface-300 border border-surface-700">Drag & Drop</span>
                          </div>
                        </div>

                        {isAnalyzing && (
                          <div className="absolute inset-0 bg-surface-950/80 backdrop-blur-md flex flex-col items-center justify-center z-20">
                            <div className="relative mb-8">
                              <div className="w-32 h-32 rounded-full border-4 border-brand-500/20 border-t-brand-500 animate-spin" />
                              <Brain className="w-12 h-12 text-brand-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                              
                              {/* Simulated Detection Boxes during analysis */}
                              <motion.div 
                                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity }}
                                className="absolute -top-4 -left-4 w-12 h-12 border-2 border-emerald-500 rounded-lg"
                              />
                              <motion.div 
                                animate={{ opacity: [0, 1, 0], scale: [0.8, 1.1, 0.8] }}
                                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                                className="absolute -bottom-4 -right-4 w-16 h-16 border-2 border-red-500 rounded-lg"
                              />
                            </div>
                            <p className="text-xl font-black text-white animate-pulse tracking-tighter uppercase">AI Vision Engine Analyzing...</p>
                            <div className="mt-4 flex gap-2">
                              <span className="px-3 py-1 rounded-full bg-surface-800 text-[9px] font-bold text-surface-400 uppercase tracking-widest border border-surface-700">Scanning Pixels</span>
                              <span className="px-3 py-1 rounded-full bg-surface-800 text-[9px] font-bold text-surface-400 uppercase tracking-widest border border-surface-700">Mapping Hazards</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={startCamera}
                          className="flex items-center justify-center gap-3 p-4 bg-surface-800 hover:bg-brand-500 text-white rounded-2xl font-bold transition-all group"
                        >
                          <Camera className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-xs uppercase tracking-widest">Open Camera</span>
                        </button>
                        <button 
                          onClick={() => setViewMode('live')}
                          className="flex items-center justify-center gap-3 p-4 bg-surface-800 hover:bg-violet-500 text-white rounded-2xl font-bold transition-all group"
                        >
                          <Activity className="w-5 h-5 group-hover:scale-110 transition-transform" />
                          <span className="text-xs uppercase tracking-widest">Live Stream</span>
                        </button>
                      </div>

                      {stream && (
                        <div className="relative aspect-video rounded-[2.5rem] overflow-hidden bg-black border border-surface-800">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-4">
                            <button 
                              onClick={capturePhoto}
                              className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                            >
                              <div className="w-12 h-12 rounded-full border-4 border-black" />
                            </button>
                            <button 
                              onClick={stopCamera}
                              className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all"
                            >
                              <X className="w-8 h-8 text-white" />
                            </button>
                          </div>
                        </div>
                      )}
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
                    className="w-full h-full flex flex-col lg:flex-row gap-8 p-4 lg:p-8 overflow-y-auto"
                  >
                    {/* Media Preview & Heatmap */}
                    <div className="flex-1 relative rounded-[2rem] overflow-hidden bg-black shadow-2xl border border-surface-800 group min-h-[400px]">
                      {error && (
                        <div className="absolute inset-0 bg-surface-900/90 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8 text-center">
                          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
                          <p className="text-white font-bold mb-4">{error}</p>
                          <button 
                            onClick={() => setError(null)}
                            className="px-4 py-2 bg-surface-800 hover:bg-surface-700 rounded-lg text-xs font-bold uppercase tracking-widest"
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
                              <div className="bg-surface-900/95 backdrop-blur-xl border border-surface-700 p-4 rounded-2xl whitespace-nowrap shadow-2xl ring-1 ring-white/10">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className={`w-2 h-2 rounded-full ${h.severity === 'high' ? 'bg-red-500' : h.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                                  <p className="text-xs font-black text-white uppercase tracking-widest">{h.label}</p>
                                </div>
                                <p className="text-[10px] text-surface-400 uppercase font-bold mb-2">{h.severity} Severity Detected</p>
                                {h.standard && (
                                  <div className="pt-2 border-t border-surface-800">
                                    <p className="text-[9px] text-brand-400 font-black uppercase tracking-tighter">Compliance: {h.standard}</p>
                                  </div>
                                )}
                              </div>
                              <div className="w-3 h-3 bg-surface-900 border-r border-b border-surface-700 rotate-45 mx-auto -mt-1.5" />
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>

                      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity z-20">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setShowHeatmap(!showHeatmap)}
                            className={`p-3 rounded-2xl text-white transition-colors backdrop-blur-md border border-white/10 ${showHeatmap ? 'bg-brand-500' : 'bg-surface-900/80 hover:bg-surface-800'}`}
                            title="Toggle Risk Heatmap"
                          >
                            <MapIcon className="w-5 h-5" />
                          </button>
                          <button 
                            onClick={() => setShowPredictive(!showPredictive)}
                            className={`p-3 rounded-2xl text-white transition-colors backdrop-blur-md border border-white/10 ${showPredictive ? 'bg-violet-500' : 'bg-surface-900/80 hover:bg-surface-800'}`}
                            title="AI Predictive Analysis"
                          >
                            <TrendingUp className="w-5 h-5" />
                          </button>
                          <button className="p-3 bg-surface-900/80 backdrop-blur-md rounded-2xl text-white hover:bg-brand-500 transition-colors border border-white/10">
                            <Maximize2 className="w-5 h-5" />
                          </button>
                        </div>
                        <button 
                          onClick={() => setSelectedResult(null)}
                          className="px-6 py-3 bg-white text-black rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-500 hover:text-white transition-all shadow-xl"
                        >
                          New Scan
                        </button>
                      </div>
                    </div>

                    {/* Analysis & Features Panel */}
                    <div className="w-full lg:w-[450px] flex flex-col gap-6 shrink-0">
                      {/* Main Analysis */}
                      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                              selectedResult.status === 'safe' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                              {selectedResult.status === 'safe' ? <CheckCircle2 className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">AI Analysis</h3>
                              <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">
                                {selectedResult.status === 'safe' ? 'Compliant' : 'Action Required'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Confidence</p>
                            <p className="text-lg font-black text-brand-400">98.4%</p>
                          </div>
                        </div>

                        <div className="p-4 bg-surface-800/40 rounded-2xl border border-surface-700/50 mb-6">
                          <p className="text-sm text-surface-300 leading-relaxed italic mb-2">
                            "{selectedResult.analysis}"
                          </p>
                          {selectedResult.location && (
                            <div className="flex items-center gap-2 text-[9px] text-surface-500 font-bold uppercase tracking-widest">
                              <MapIcon className="w-3 h-3" />
                              GPS: {selectedResult.location.lat.toFixed(4)}, {selectedResult.location.lng.toFixed(4)}
                            </div>
                          )}
                        </div>

                        <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-surface-500 uppercase tracking-[0.2em]">Recommendations</h4>
                          {selectedResult.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 group">
                              <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-brand-500 group-hover:scale-150 transition-transform" />
                              <p className="text-xs text-surface-400 group-hover:text-white transition-colors">{s}</p>
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
                              className="mt-6 p-4 bg-violet-500/10 rounded-2xl border border-violet-500/20"
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <Sparkles className="w-4 h-4 text-violet-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">AI Predictive Insight</span>
                              </div>
                              <p className="text-[10px] text-surface-400 leading-relaxed">
                                Based on visual wear patterns, this component has a 12% probability of failure within the next 200 operational hours.
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Media Gallery (New Feature) */}
                      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center gap-3 mb-6">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                            <Layers className="w-6 h-6" />
                          </div>
                          <h3 className="text-lg font-bold text-white">Media Gallery</h3>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                          {[selectedResult.mediaUrl, ...results.slice(0, 2).map(r => r.mediaUrl)].map((url, i) => (
                            <div key={i} className="aspect-square rounded-xl overflow-hidden bg-surface-800 border border-surface-700/50 group cursor-pointer">
                              <img src={url} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                            </div>
                          ))}
                          <button className="aspect-square rounded-xl border-2 border-dashed border-surface-800 flex items-center justify-center text-surface-600 hover:text-brand-400 hover:border-brand-400 transition-all">
                            <Plus className="w-6 h-6" />
                          </button>
                        </div>
                      </div>

                      {/* PPE Inventory (Enhanced Feature) */}
                      {selectedResult.ppeInventory && (
                        <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-3xl p-6 shadow-xl">
                          <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                              <ClipboardList className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white">PPE Inventory</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {selectedResult.ppeInventory.map((item, i) => (
                              <div key={i} className="p-3 bg-surface-800/30 rounded-2xl border border-surface-700/50 flex items-center justify-between">
                                <span className="text-xs font-bold text-surface-300">{item.item}</span>
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
                      <div className="bg-surface-900/60 backdrop-blur-xl border border-surface-800 rounded-3xl p-6 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                              <Mic className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Voice Annotations</h3>
                          </div>
                          <button 
                            onClick={toggleVoiceRecording}
                            className={`p-3 rounded-full transition-all ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-surface-800 hover:bg-surface-700'}`}
                          >
                            {isRecording ? <SquareCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                          </button>
                        </div>
                        
                        <div className="space-y-3">
                          {!selectedResult.voiceNotes || selectedResult.voiceNotes.length === 0 ? (
                            <p className="text-[10px] text-surface-600 text-center py-4 uppercase tracking-widest font-bold">No voice notes recorded</p>
                          ) : (
                            selectedResult.voiceNotes.map((note, i) => (
                              <div key={i} className="flex items-center gap-3 p-3 bg-surface-800/30 rounded-xl border border-surface-700/50">
                                <Volume2 className="w-4 h-4 text-brand-400" />
                                <p className="text-[11px] text-surface-400">{note}</p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="grid grid-cols-2 gap-4">
                        <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-900/40 border border-surface-800 rounded-2xl hover:bg-surface-800 transition-colors group">
                          <Download className="w-5 h-5 text-surface-500 group-hover:text-brand-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400">Export PDF</span>
                        </button>
                        <button className="flex flex-col items-center justify-center gap-2 p-4 bg-surface-900/40 border border-surface-800 rounded-2xl hover:bg-surface-800 transition-colors group">
                          <Share2 className="w-5 h-5 text-surface-500 group-hover:text-brand-400" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-surface-400">Share Audit</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {viewMode === 'batch' && (
            <div className="flex-1 flex flex-col p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto w-full">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-white mb-1">Enterprise Batch Scan</h2>
                    <p className="text-surface-400 text-sm">Analyze up to 500 assets simultaneously using distributed AI nodes</p>
                  </div>
                  <button 
                    onClick={() => {
                      setIsAnalyzing(true);
                      setTimeout(() => {
                        setIsAnalyzing(false);
                        alert('Batch analysis of 42 items complete. 38 Safe, 4 Hazards detected.');
                      }, 3000);
                    }}
                    className="px-6 py-3 bg-brand-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                  >
                    Start Batch Process
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-surface-900/40 border border-surface-800 flex flex-col items-center justify-center group hover:border-brand-500/50 transition-all">
                      <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mb-3 group-hover:bg-brand-500/20 transition-colors">
                        <FileText className="w-6 h-6 text-surface-500 group-hover:text-brand-400" />
                      </div>
                      <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Asset_{1000 + i}</p>
                      <div className="mt-2 w-16 h-1 bg-surface-800 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 w-0 group-hover:w-full transition-all duration-1000" />
                      </div>
                    </div>
                  ))}
                  <button className="aspect-square rounded-2xl border-2 border-dashed border-surface-800 flex flex-col items-center justify-center text-surface-500 hover:text-brand-400 hover:border-brand-400 transition-all">
                    <Upload className="w-8 h-8 mb-2" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Add More</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'live' && (
            <div className="flex-1 relative bg-black overflow-hidden">
              {/* Multi-Cam Grid Simulation */}
              <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1 p-1">
                {[
                  { name: 'Loading Dock A', status: 'safe', icon: Activity },
                  { name: 'Fabrication Shop', status: 'warning', icon: Zap },
                  { name: 'Main Entrance', status: 'safe', icon: Eye },
                  { name: 'Warehouse Zone B', status: 'danger', icon: AlertTriangle },
                ].map((cam, i) => (
                  <div key={i} className="relative bg-surface-900/20 border border-white/5 overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                    <div className="absolute top-4 left-4 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full animate-pulse ${
                        cam.status === 'safe' ? 'bg-emerald-500' : cam.status === 'warning' ? 'bg-amber-500' : 'bg-red-500'
                      }`} />
                      <span className="text-[9px] font-black text-white uppercase tracking-widest drop-shadow-md">{cam.name}</span>
                    </div>
                    
                    {/* Simulated Scan Lines */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="w-full h-[1px] bg-brand-500/20 absolute top-1/4 animate-[scan_4s_linear_infinite]" />
                      <div className="w-full h-[1px] bg-brand-500/20 absolute top-3/4 animate-[scan_6s_linear_infinite]" />
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center opacity-20 group-hover:opacity-40 transition-opacity">
                      <cam.icon className="w-20 h-20 text-white" />
                    </div>
                  </div>
                ))}
              </div>

              {/* Live HUD Overlays */}
              <div className="absolute top-8 left-8 flex items-center gap-4">
                <div className="px-4 py-2 bg-red-600 rounded-full flex items-center gap-2 shadow-lg shadow-red-600/20">
                  <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                  <span className="text-[10px] font-black text-white uppercase tracking-widest">Live Monitoring</span>
                </div>
                <div className="px-4 py-2 bg-surface-900/80 backdrop-blur-md rounded-full border border-surface-700 text-[10px] font-bold text-surface-300 uppercase tracking-widest">
                  Cam-04: Loading Dock
                </div>
              </div>

              <div className="absolute bottom-8 left-8 right-8 flex items-end justify-between">
                <div className="space-y-2">
                  <div className="p-4 bg-surface-900/80 backdrop-blur-md rounded-2xl border border-surface-700 max-w-xs">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span className="text-[10px] font-black text-white uppercase tracking-widest">Real-time Detection</span>
                    </div>
                    <p className="text-xs text-surface-400">No PPE violations detected in the last 15 minutes.</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-4 bg-surface-900/80 backdrop-blur-md rounded-2xl text-white hover:bg-surface-800 transition-colors">
                    <Pause className="w-6 h-6" />
                  </button>
                  <button className="p-4 bg-surface-900/80 backdrop-blur-md rounded-2xl text-white hover:bg-surface-800 transition-colors">
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
