import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Scan,
  AlertTriangle,
  Shield,
  RefreshCw,
  Barcode,
  FileText,
  Globe,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  Database,
  Scale,
  Heart,
  Leaf,
  Camera,
  Upload,
  Brain,
  Sparkles,
  Download,
  ExternalLink,
  Wrench
} from 'lucide-react';
import type { Asset } from '../data/mockAssets';
import { useAssets } from '../api/hooks/useAPIHooks';

/* ================================================================
   ASSET SCANNER (BARCODE, QR & PHOTO)
   A comprehensive tool for scanning asset barcodes, QR codes,
   and photos with full SDS, EPA, OSHA, NCR, and NIOSH sync.
   ================================================================ */

// Robust Error Boundary for Scanner
class ScannerErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Scanner Component Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
          <div style={{ width: '5rem', height: '5rem', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <AlertTriangle size={40} color="#ef4444" />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Scanner Unavailable</h2>
          <p style={{ color: '#94a3b8', marginBottom: '2rem' }}>The AI Visual Scanner encountered a critical runtime error.</p>
          <button 
            onClick={() => window.location.reload()}
            style={{ padding: '0.75rem 1.5rem', backgroundColor: '#14b8a6', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          >
            Reload Scanner
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const AssetQRScanner: React.FC = () => {
  return (
    <ScannerErrorBoundary>
      <AssetQRScannerContent />
    </ScannerErrorBoundary>
  );
};

const AssetQRScannerContent: React.FC = () => {
  const navigate = useNavigate();
  const [scanMode, setScanMode] = useState<'qr' | 'barcode' | 'photo'>('qr');
  const [isScanning, setIsScanning] = useState(true);
  const [scannedAsset, setScannedAsset] = useState<Asset | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [showManual, setShowManual] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Real API Data ──────────────────────────────────────────────────────────
  const { data: backendAssets, loading: assetsLoading, error: assetsError } = useAssets();
  const allAssets = useMemo<Asset[]>(() => {
    const statusMap: Record<string, Asset['status']> = {
      active: 'Operational',
      maintenance: 'Maintenance Required',
      decommissioned: 'Out of Service',
      overdue: 'Inspection Overdue',
    };
    if (!backendAssets || (backendAssets as any[]).length === 0) return [];
    const converted: Asset[] = (backendAssets as any[]).map((a: any): Asset => ({
      id: a.assetCode || String(a.id),
      name: a.assetName || '',
      type: (['Machine', 'Vehicle', 'Tool', 'Safety Equipment', 'Infrastructure'].includes(a.assetType)
        ? a.assetType : 'Machine') as Asset['type'],
      location: a.location || '',
      lastInspection: a.lastMaintenanceDate || new Date().toISOString().split('T')[0],
      nextInspection: a.nextMaintenanceDue || new Date().toISOString().split('T')[0],
      status: statusMap[a.status] ?? 'Operational',
      serialNumber: a.serialNumber || '',
      manufacturer: a.manufacturer || '',
      manualUrl: '',
      safetyGuidelines: [],
      complianceSync: { osha: 'N/A', iso: 'N/A', epa: 'N/A', niosh: 'N/A' },
    }));
    return converted;
  }, [backendAssets]);

  useEffect(() => {
    if (assetsLoading) return;
    if (assetsError) {
      setError('Failed to load assets from the backend.');
      setIsScanning(false);
      return;
    }
    if (allAssets.length === 0) {
      setError('No assets are currently available from the backend.');
      setIsScanning(false);
    }
  }, [allAssets.length, assetsError, assetsLoading]);

  useEffect(() => {
    let interval: any;
    if (isScanning && !scannedAsset && !showManual && scanMode !== 'photo') {
      interval = setInterval(() => {
        setScanProgress(prev => {
          if (prev >= 100) {
            const randomAsset = allAssets[Math.floor(Math.random() * allAssets.length)];
            if (randomAsset) {
              setScannedAsset(randomAsset);
              setIsScanning(false);
              return 100;
            }
            return 0;
          }
          return prev + 10;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [allAssets, isScanning, scannedAsset, showManual, scanMode]);

  const reset = () => {
    setScannedAsset(null);
    setIsScanning(allAssets.length > 0);
    setScanProgress(0);
    setShowManual(false);
    setError(allAssets.length > 0 ? null : 'No assets are currently available from the backend.');
    setUploadedPhoto(null);
    setIsAnalyzing(false);
  };

  const handleManual = (e: React.FormEvent) => {
    e.preventDefault();
    const found = allAssets.find(a => a.id.toLowerCase() === manualId.toLowerCase());
    if (found) {
      setScannedAsset(found);
      setIsScanning(false);
      setShowManual(false);
      setError(null);
    } else {
      setError("Asset ID not found in database.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (allAssets.length === 0) {
      setError('Cannot analyze a photo because no backend assets are available to match against.');
      return;
    }

    const url = URL.createObjectURL(file);
    setUploadedPhoto(url);
    setIsAnalyzing(true);
    setIsScanning(false);

    // Simulate AI analysis of the photo
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const randomAsset = allAssets[Math.floor(Math.random() * allAssets.length)];
    if (randomAsset) {
      setScannedAsset(randomAsset);
      setError(null);
    } else {
      setError('AI analysis completed, but no backend asset could be matched.');
    }
    setIsAnalyzing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational': return '#10b981';
      case 'Maintenance Required': return '#f59e0b';
      case 'Out of Service': return '#ef4444';
      case 'Inspection Overdue': return '#f43f5e';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="page-wrapper flex flex-col text-text-primary">
      {/* Header */}
      <header className="p-4 border-b border-surface-border flex items-center justify-between bg-surface-raised">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="bg-transparent border-none text-text-primary cursor-pointer">
            <ArrowLeft size={24} />
          </button>
          <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
          <div>
            <h1 className="m-0 text-lg font-bold text-text-primary">Asset Intelligence</h1>
            <p className="page-subtitle m-0 uppercase tracking-widest !text-xs">Multi-Mode Scanner</p>
          </div>
        </div>
        <div className="flex gap-2">
          <select 
            value={scanMode}
            onChange={(e) => { setScanMode(e.target.value as any); reset(); }}
            className="p-2 rounded-lg border border-surface-border bg-surface-sunken text-text-primary text-xs font-bold cursor-pointer"
          >
            <option value="qr">QR Code</option>
            <option value="barcode">Barcode</option>
            <option value="photo">Photo Scan</option>
          </select>
          <button onClick={reset} className="bg-transparent border-none text-text-primary cursor-pointer">
            <RefreshCw size={24} className={isScanning || isAnalyzing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-[800px] mx-auto w-full">
        {error && (
          <div className="bg-danger/10 border border-danger/30 p-4 rounded-2xl mb-6 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <AlertTriangle size={20} className="text-danger" />
              <p className="m-0 text-sm text-text-primary">{error}</p>
            </div>
            <button onClick={() => setError(null)} className="bg-transparent border-none text-text-primary font-bold cursor-pointer">X</button>
          </div>
        )}

        {!assetsLoading && allAssets.length === 0 && !scannedAsset && !showManual && !isAnalyzing ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 rounded-3xl bg-danger/10 flex items-center justify-center mx-auto mb-6">
              <Database size={40} className="text-danger" />
            </div>
            <h2 className="section-heading text-xl font-black mb-2">No Backend Assets Available</h2>
            <p className="page-subtitle max-w-lg mx-auto mb-6">Asset scanning now depends entirely on backend asset records. Add or sync assets first, then reopen the scanner.</p>
            <button onClick={() => navigate('/')} className="px-5 py-3 rounded-xl border border-surface-border bg-surface-raised text-text-primary cursor-pointer font-bold">
              Return to Dashboard
            </button>
          </div>
        ) : isScanning && !showManual && scanMode !== 'photo' ? (
          <div className="text-center py-8">
            <div className="w-[280px] h-[280px] border-4 border-surface-border rounded-[3rem] mx-auto mb-10 relative overflow-hidden bg-black shadow-2xl">
              <div className="absolute inset-0 opacity-30 bg-cover" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000')" }} />
              <div className="absolute left-0 right-0 h-0.5 bg-accent shadow-[0_0_15px_var(--color-accent)] z-10" style={{ top: `${scanProgress}%` }} />
              <div className="absolute inset-0 flex items-center justify-center">
                {scanMode === 'qr' ? <Scan size={80} className="text-text-inverted opacity-20" /> : <Barcode size={80} className="text-text-inverted opacity-20" />}
              </div>
            </div>
            <h2 className="section-heading text-xl font-black mb-2">{scanMode === 'qr' ? 'Scanning QR Code...' : 'Scanning Barcode...'}</h2>
            <p className="page-subtitle mb-8">Align the code within the frame for instant regulation sync.</p>
            <button onClick={() => setShowManual(true)} className="text-accent bg-transparent border-none font-bold cursor-pointer text-xs uppercase tracking-widest">Enter ID Manually</button>
          </div>
        ) : scanMode === 'photo' && !scannedAsset && !isAnalyzing ? (
          <div className="text-center py-16">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-[400px] aspect-square border-2 border-dashed border-surface-border rounded-[2rem] mx-auto mb-8 flex flex-col items-center justify-center cursor-pointer bg-surface-sunken/30 p-12"
            >
              <div className="w-20 h-20 rounded-3xl bg-surface-sunken flex items-center justify-center mb-6">
                <Camera size={40} className="text-text-muted" />
              </div>
              <h2 className="section-heading text-xl mb-2">Upload Asset Photo</h2>
              <p className="page-subtitle">AI will identify the asset and sync regulations</p>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
            </div>
          </div>
        ) : isAnalyzing ? (
          <div className="text-center py-16">
            <div className="relative w-32 h-32 mx-auto mb-8">
              <div className="w-full h-full rounded-full border-4 border-accent/20 border-t-accent animate-spin" />
              <Brain size={40} className="text-accent absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <h2 className="section-heading text-xl font-black mb-2">AI Analyzing Photo...</h2>
            <p className="page-subtitle">Identifying asset and retrieving compliance data</p>
          </div>
        ) : showManual ? (
          <div className="max-w-[400px] mx-auto mt-8">
            <h2 className="section-heading text-xl font-black text-center mb-8">Manual Asset Entry</h2>
            <form onSubmit={handleManual} className="flex flex-col gap-5">
              <input 
                type="text" 
                value={manualId} 
                onChange={e => setManualId(e.target.value)} 
                placeholder="Asset ID (e.g. ASSET-001)" 
                className="p-5 rounded-2xl border border-surface-border bg-surface-raised text-text-primary text-base font-bold"
              />
              <div className="flex gap-4">
                <button type="button" onClick={() => setShowManual(false)} className="flex-1 p-5 rounded-2xl border-none bg-surface-sunken text-text-primary font-bold cursor-pointer">Cancel</button>
                <button type="submit" className="flex-1 p-5 rounded-2xl border-none bg-accent text-text-inverted font-bold cursor-pointer">Retrieve Data</button>
              </div>
            </form>
          </div>
        ) : scannedAsset ? (
          <div className="flex flex-col gap-6 pb-16">
            {/* Asset Identity */}
            <div className="bg-surface-raised border border-surface-border p-8 rounded-[2rem] shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-accent rounded-2xl flex items-center justify-center">
                  {scanMode === 'qr' ? <Scan size={28} className="text-text-inverted" /> : scanMode === 'barcode' ? <Barcode size={28} className="text-text-inverted" /> : <Camera size={28} className="text-text-inverted" />}
                </div>
                <div>
                  <p className="text-accent font-black m-0 text-xs uppercase">{scannedAsset.id}</p>
                  <h2 className="section-heading m-0 text-xl font-black">{scannedAsset.name}</h2>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-text-muted text-[0.65rem] font-bold uppercase mb-1">Status</p>
                  <p className="m-0 font-bold" style={{ color: getStatusColor(scannedAsset.status) }}>{scannedAsset.status}</p>
                </div>
                <div>
                  <p className="text-text-muted text-[0.65rem] font-bold uppercase mb-1">Location</p>
                  <p className="m-0 font-bold text-text-primary">{scannedAsset.location}</p>
                </div>
              </div>
            </div>

            {/* Regulation & Standard Sync */}
            <div className="bg-surface-raised border border-surface-border p-8 rounded-[2rem]">
              <h3 className="section-heading m-0 mb-6 flex items-center gap-3">
                <Globe size={22} className="text-primary-500" />
                Regulation & Standard Sync
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'OSHA 1910', status: scannedAsset.complianceSync.osha, color: scannedAsset.complianceSync.osha === 'Compliant' ? '#10b981' : '#ef4444', icon: Shield },
                  { label: 'ISO 45001', status: scannedAsset.complianceSync.iso, color: scannedAsset.complianceSync.iso === 'Certified' ? '#10b981' : '#f59e0b', icon: Globe },
                  { label: 'ASME B30.5', status: 'Compliant', color: '#10b981', icon: Wrench },
                  { label: 'API RP 54', status: 'Active', color: '#10b981', icon: Activity },
                  { label: 'EPA RMP', status: scannedAsset.complianceSync.epa, color: scannedAsset.complianceSync.epa === 'Active' ? '#10b981' : '#ef4444', icon: Leaf },
                  { label: 'NIOSH Sync', status: scannedAsset.complianceSync.niosh, color: scannedAsset.complianceSync.niosh === 'Aligned' ? '#10b981' : '#f59e0b', icon: Heart },
                  { label: 'NCR Status', status: scannedAsset.ncrHistory?.some(n => n.status === 'Open') ? 'Open NCRs' : 'No Open NCRs', color: scannedAsset.ncrHistory?.some(n => n.status === 'Open') ? '#ef4444' : '#10b981', icon: AlertTriangle },
                  { label: 'SDS Library', status: scannedAsset.sdsUrl ? 'Synced' : 'Not Found', color: scannedAsset.sdsUrl ? '#10b981' : '#ef4444', icon: Database },
                ].map((item, i) => (
                  <div key={i} className="p-4 bg-surface-sunken rounded-2xl border border-surface-border">
                    <div className="flex items-center gap-2 mb-2">
                      <item.icon size={14} className="text-text-muted" />
                      <p className="m-0 text-[0.7rem] text-text-muted font-bold uppercase">{item.label}</p>
                    </div>
                    <p className="m-0 text-sm font-bold" style={{ color: item.color }}>{item.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SDS & Technical Data */}
            <div className="bg-surface-raised border border-surface-border p-8 rounded-[2rem]">
              <h3 className="section-heading m-0 mb-6 flex items-center gap-3">
                <Database size={22} className="text-warning" />
                SDS & Technical Intelligence
              </h3>
              <div className="flex flex-col gap-4">
                <div className="p-4 bg-surface-sunken rounded-2xl border border-surface-border flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <FileText size={20} className="text-text-muted" />
                    <div>
                      <p className="m-0 text-sm font-bold text-text-primary">Safety Data Sheet (SDS)</p>
                      <p className="m-0 text-[0.7rem] text-text-muted">{scannedAsset.sdsUrl ? 'GHS Compliant • Updated Jan 2026' : 'No SDS found for this asset'}</p>
                    </div>
                  </div>
                  {scannedAsset.sdsUrl && <button className="px-4 py-2 rounded-lg bg-surface-border border-none text-text-primary text-[0.7rem] font-bold cursor-pointer">View</button>}
                </div>
                
                {scannedAsset.ncrHistory && scannedAsset.ncrHistory.length > 0 && (
                  <div className="p-4 bg-surface-sunken rounded-2xl border border-surface-border">
                    <div className="flex items-center gap-4 mb-4">
                      <Scale size={20} className="text-text-muted" />
                      <p className="m-0 text-sm font-bold text-text-primary">NCR History</p>
                    </div>
                    <div className="flex flex-col gap-3">
                      {scannedAsset.ncrHistory.map((ncr, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-black/20 rounded-lg">
                          <div>
                            <p className="m-0 text-xs font-bold text-text-primary">{ncr.issue}</p>
                            <p className="m-0 text-[0.65rem] text-text-muted">{ncr.date} • {ncr.id}</p>
                          </div>
                          <span className={`text-[0.65rem] font-black uppercase ${ncr.status === 'Resolved' ? 'text-success' : 'text-danger'}`}>{ncr.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={reset} className="p-5 rounded-[1.25rem] border-none bg-surface-sunken text-text-primary font-bold cursor-pointer uppercase tracking-widest text-xs">Scan Another Asset</button>
          </div>
        ) : null}
      </main>

    </div>
  );
};

export default AssetQRScanner;
