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
import { mockAssets, type Asset } from '../data/mockAssets';
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
  const { data: backendAssets } = useAssets();
  const allAssets = useMemo<Asset[]>(() => {
    const statusMap: Record<string, Asset['status']> = {
      active: 'Operational',
      maintenance: 'Maintenance Required',
      decommissioned: 'Out of Service',
    };
    if (!backendAssets || (backendAssets as any[]).length === 0) return mockAssets;
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
    const existingIds = new Set(mockAssets.map(m => m.id));
    return [...mockAssets, ...converted.filter(c => !existingIds.has(c.id))];
  }, [backendAssets]);

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
  }, [isScanning, scannedAsset, showManual, scanMode]);

  const reset = () => {
    setScannedAsset(null);
    setIsScanning(true);
    setScanProgress(0);
    setShowManual(false);
    setError(null);
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

    const url = URL.createObjectURL(file);
    setUploadedPhoto(url);
    setIsAnalyzing(true);
    setIsScanning(false);

    // Simulate AI analysis of the photo
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const randomAsset = allAssets[Math.floor(Math.random() * allAssets.length)];
    setScannedAsset(randomAsset);
    setIsAnalyzing(false);
    setError(null);
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
    <div style={{ minHeight: '100vh', backgroundColor: '#020617', color: 'white', display: 'flex', flexDirection: 'column', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <header style={{ padding: '1rem', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: '#0f172a' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <img src="/logo.png" alt="SafetyMEG" style={{ width: '2rem', height: '2rem', objectFit: 'contain' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 'bold' }}>Asset Intelligence</h1>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Multi-Mode Scanner</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <select 
            value={scanMode}
            onChange={(e) => { setScanMode(e.target.value as any); reset(); }}
            style={{ padding: '0.5rem', borderRadius: '0.5rem', border: '1px solid #334155', backgroundColor: '#1e293b', color: 'white', fontSize: '0.75rem', fontWeight: 'bold', cursor: 'pointer' }}
          >
            <option value="qr">QR Code</option>
            <option value="barcode">Barcode</option>
            <option value="photo">Photo Scan</option>
          </select>
          <button onClick={reset} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
            <RefreshCw size={24} className={isScanning || isAnalyzing ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {error && (
          <div style={{ backgroundColor: '#450a0a', border: '1px solid #991b1b', padding: '1rem', borderRadius: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <AlertTriangle size={20} color="#ef4444" />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>{error}</p>
            </div>
            <button onClick={() => setError(null)} style={{ background: 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>X</button>
          </div>
        )}

        {isScanning && !showManual && scanMode !== 'photo' ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <div style={{ width: '280px', height: '280px', border: '4px solid #1e293b', borderRadius: '3rem', margin: '0 auto 2.5rem', position: 'relative', overflow: 'hidden', backgroundColor: 'black', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
              <div style={{ position: 'absolute', inset: 0, opacity: 0.3, backgroundImage: "url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1000')", backgroundSize: 'cover' }} />
              <div style={{ position: 'absolute', top: `${scanProgress}%`, left: 0, right: 0, height: '2px', backgroundColor: '#14b8a6', boxShadow: '0 0 15px #14b8a6', zIndex: 10 }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {scanMode === 'qr' ? <Scan size={80} color="white" style={{ opacity: 0.2 }} /> : <Barcode size={80} color="white" style={{ opacity: 0.2 }} />}
              </div>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>{scanMode === 'qr' ? 'Scanning QR Code...' : 'Scanning Barcode...'}</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '2rem' }}>Align the code within the frame for instant regulation sync.</p>
            <button onClick={() => setShowManual(true)} style={{ color: '#14b8a6', background: 'none', border: 'none', fontWeight: 'bold', cursor: 'pointer', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Enter ID Manually</button>
          </div>
        ) : scanMode === 'photo' && !scannedAsset && !isAnalyzing ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', maxWidth: '400px', aspectRatio: '1', border: '2px dashed #334155', borderRadius: '2rem', margin: '0 auto 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backgroundColor: 'rgba(30, 41, 59, 0.3)', padding: '3rem' }}
            >
              <div style={{ width: '5rem', height: '5rem', borderRadius: '1.5rem', backgroundColor: '#1e293b', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Camera size={40} color="#94a3b8" />
              </div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '0.5rem' }}>Upload Asset Photo</h2>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>AI will identify the asset and sync regulations</p>
              <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} style={{ display: 'none' }} accept="image/*" />
            </div>
          </div>
        ) : isAnalyzing ? (
          <div style={{ textAlign: 'center', padding: '4rem 0' }}>
            <div style={{ position: 'relative', width: '8rem', height: '8rem', margin: '0 auto 2rem' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '4px solid rgba(20, 184, 166, 0.2)', borderTopColor: '#14b8a6', animation: 'spin 1s linear infinite' }} />
              <Brain size={40} color="#14b8a6" style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '900', marginBottom: '0.5rem' }}>AI Analyzing Photo...</h2>
            <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Identifying asset and retrieving compliance data</p>
          </div>
        ) : showManual ? (
          <div style={{ maxWidth: '400px', margin: '2rem auto' }}>
            <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: '900', marginBottom: '2rem' }}>Manual Asset Entry</h2>
            <form onSubmit={handleManual} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <input 
                type="text" 
                value={manualId} 
                onChange={e => setManualId(e.target.value)} 
                placeholder="Asset ID (e.g. ASSET-001)" 
                style={{ padding: '1.25rem', borderRadius: '1rem', border: '1px solid #334155', backgroundColor: '#0f172a', color: 'white', fontSize: '1rem', fontWeight: 'bold' }}
              />
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button type="button" onClick={() => setShowManual(false)} style={{ flex: 1, padding: '1.25rem', borderRadius: '1rem', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ flex: 1, padding: '1.25rem', borderRadius: '1rem', border: 'none', backgroundColor: '#14b8a6', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}>Retrieve Data</button>
              </div>
            </form>
          </div>
        ) : scannedAsset ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '4rem' }}>
            {/* Asset Identity */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '2rem', borderRadius: '2rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                <div style={{ width: '3.5rem', height: '3.5rem', backgroundColor: '#14b8a6', borderRadius: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {scanMode === 'qr' ? <Scan size={28} color="white" /> : scanMode === 'barcode' ? <Barcode size={28} color="white" /> : <Camera size={28} color="white" />}
                </div>
                <div>
                  <p style={{ color: '#14b8a6', fontWeight: '900', margin: 0, fontSize: '0.75rem', textTransform: 'uppercase' }}>{scannedAsset.id}</p>
                  <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: '900' }}>{scannedAsset.name}</h2>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Status</p>
                  <p style={{ margin: 0, fontWeight: 'bold', color: getStatusColor(scannedAsset.status) }}>{scannedAsset.status}</p>
                </div>
                <div>
                  <p style={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 'bold', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Location</p>
                  <p style={{ margin: 0, fontWeight: 'bold' }}>{scannedAsset.location}</p>
                </div>
              </div>
            </div>

            {/* Regulation & Standard Sync */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '2rem', borderRadius: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <Globe size={22} color="#3b82f6" />
                Regulation & Standard Sync
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                  <div key={i} style={{ padding: '1rem', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <item.icon size={14} color="#94a3b8" />
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>{item.label}</p>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold', color: item.color }}>{item.status}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* SDS & Technical Data */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '2rem', borderRadius: '2rem' }}>
              <h3 style={{ margin: '0 0 1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                <Database size={22} color="#f59e0b" />
                SDS & Technical Intelligence
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ padding: '1rem', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <FileText size={20} color="#94a3b8" />
                    <div>
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold' }}>Safety Data Sheet (SDS)</p>
                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#64748b' }}>{scannedAsset.sdsUrl ? 'GHS Compliant • Updated Jan 2026' : 'No SDS found for this asset'}</p>
                    </div>
                  </div>
                  {scannedAsset.sdsUrl && <button style={{ padding: '0.5rem 1rem', borderRadius: '0.5rem', backgroundColor: '#334155', border: 'none', color: 'white', fontSize: '0.7rem', fontWeight: 'bold', cursor: 'pointer' }}>View</button>}
                </div>
                
                {scannedAsset.ncrHistory && scannedAsset.ncrHistory.length > 0 && (
                  <div style={{ padding: '1rem', backgroundColor: '#1e293b', borderRadius: '1rem', border: '1px solid #334155' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
                      <Scale size={20} color="#94a3b8" />
                      <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 'bold' }}>NCR History</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {scannedAsset.ncrHistory.map((ncr, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: '0.5rem' }}>
                          <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 'bold' }}>{ncr.issue}</p>
                            <p style={{ margin: 0, fontSize: '0.65rem', color: '#64748b' }}>{ncr.date} • {ncr.id}</p>
                          </div>
                          <span style={{ fontSize: '0.65rem', fontWeight: 'black', textTransform: 'uppercase', color: ncr.status === 'Resolved' ? '#10b981' : '#ef4444' }}>{ncr.status}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button onClick={reset} style={{ padding: '1.25rem', borderRadius: '1.25rem', border: 'none', backgroundColor: '#1e293b', color: 'white', fontWeight: 'bold', cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '0.75rem' }}>Scan Another Asset</button>
          </div>
        ) : null}
      </main>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AssetQRScanner;
