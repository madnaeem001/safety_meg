import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { sdsDatabase, EquipmentSDS, SDSRecord, SyncState } from '../services/sdsDatabase';
import { geotagCache, GeotagRecord, GeotagServiceState, GeoZone } from '../services/geotagCache';
import { useHubRiskPredictions, useHubAnalyticsTrends } from '../api/hooks/useAPIHooks';
import {
  ArrowLeft,
  Brain,
  Scan,
  MapPin,
  AlertTriangle,
  Shield,
  TrendingUp,
  TrendingDown,
  Target,
  Activity,
  Zap,
  Eye,
  Clock,
  Users,
  Calendar,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  BarChart3,
  RefreshCw,
  Camera,
  QrCode,
  FileText,
  Package,
  Thermometer,
  Wind,
  Droplets,
  Navigation,
  Crosshair,
  Layers,
  Gauge,
  Sparkles,
  Settings,
  Info,
  ExternalLink,
  Search,
  Filter,
  Download,
  Upload,
  Wifi,
  WifiOff,
  Cloud,
  CloudOff,
  Database,
  HardDrive,
  Trash2,
  History,
  Lightbulb,
  Printer
} from 'lucide-react';

// Types - extended for real database
interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  altitude?: number;
  timestamp: Date;
  address?: string;
  zone?: string;
  syncStatus?: 'pending' | 'synced' | 'error';
}

interface RiskPrediction {
  id: string;
  category: string;
  location: string;
  riskScore: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  factors: string[];
  predictedDate: string;
  confidence: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendations: string[];
}

interface AnalyticsTrend {
  id: string;
  metric: string;
  currentValue: number;
  previousValue: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  prediction: string;
}

// Mock data
const mockRiskPredictions: RiskPrediction[] = [
  {
    id: 'RP001',
    category: 'Slip/Trip/Fall',
    location: 'Warehouse B - Loading Dock',
    riskScore: 87,
    trend: 'increasing',
    factors: ['Weather conditions', 'High traffic area', 'Recent near misses'],
    predictedDate: '2026-02-08',
    confidence: 92,
    severity: 'high',
    recommendations: ['Install additional lighting', 'Apply anti-slip coating', 'Increase signage']
  },
  {
    id: 'RP002',
    category: 'Equipment Failure',
    location: 'Manufacturing Line 3',
    riskScore: 74,
    trend: 'stable',
    factors: ['Equipment age', 'Maintenance schedule', 'Usage patterns'],
    predictedDate: '2026-02-12',
    confidence: 85,
    severity: 'medium',
    recommendations: ['Schedule preventive maintenance', 'Order replacement parts', 'Train backup operators']
  },
  {
    id: 'RP003',
    category: 'Chemical Exposure',
    location: 'Lab Area C',
    riskScore: 65,
    trend: 'decreasing',
    factors: ['Ventilation efficiency', 'PPE compliance', 'Storage protocols'],
    predictedDate: '2026-02-15',
    confidence: 78,
    severity: 'medium',
    recommendations: ['Verify fume hood operation', 'Review PPE requirements', 'Update SDS access points']
  },
  {
    id: 'RP004',
    category: 'Ergonomic Injury',
    location: 'Office Building - Floor 2',
    riskScore: 52,
    trend: 'increasing',
    factors: ['Workstation setup', 'Repetitive tasks', 'Break frequency'],
    predictedDate: '2026-02-20',
    confidence: 71,
    severity: 'low',
    recommendations: ['Conduct ergonomic assessments', 'Provide adjustable equipment', 'Implement stretch breaks']
  },
  {
    id: 'RP005',
    category: 'Fire/Explosion',
    location: 'Storage Facility D',
    riskScore: 91,
    trend: 'stable',
    factors: ['Material compatibility', 'Temperature control', 'Fire suppression status'],
    predictedDate: '2026-02-07',
    confidence: 95,
    severity: 'critical',
    recommendations: ['Immediate inspection required', 'Verify suppression system', 'Review storage protocols']
  }
];

const mockAnalyticsTrends: AnalyticsTrend[] = [
  { id: 'AT001', metric: 'Near Miss Reports', currentValue: 23, previousValue: 31, trend: 'down', percentChange: -25.8, prediction: 'Expected 18-20 next month' },
  { id: 'AT002', metric: 'Safety Observations', currentValue: 156, previousValue: 142, trend: 'up', percentChange: 9.9, prediction: 'Positive engagement trend' },
  { id: 'AT003', metric: 'Training Completion', currentValue: 94.2, previousValue: 89.7, trend: 'up', percentChange: 5.0, prediction: 'On track for 98% by Q2' },
  { id: 'AT004', metric: 'Hazard Resolution Time', currentValue: 2.3, previousValue: 3.1, trend: 'down', percentChange: -25.8, prediction: 'Improved response efficiency' },
  { id: 'AT005', metric: 'SIF Potential Events', currentValue: 2, previousValue: 5, trend: 'down', percentChange: -60.0, prediction: 'SIF prevention measures effective' }
];

export const AdvancedTechnologyHub: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'qr-scanner' | 'geotag' | 'risk-scoring'>('overview');
  
  // SDS Database state
  const [isScanning, setIsScanning] = useState(false);
  const [scannedEquipment, setScannedEquipment] = useState<EquipmentSDS | null>(null);
  const [linkedSDS, setLinkedSDS] = useState<SDSRecord[]>([]);
  const [allEquipment, setAllEquipment] = useState<EquipmentSDS[]>([]);
  const [sdsSyncState, setSdsSyncState] = useState<SyncState>({ status: 'online', lastSyncedAt: null, pendingChanges: 0 });
  const [showScanResult, setShowScanResult] = useState(false);
  const [sdsSearchQuery, setSdsSearchQuery] = useState('');
  
  // Geotag state
  const [currentLocation, setCurrentLocation] = useState<GeoLocation | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [geotagState, setGeotagState] = useState<GeotagServiceState>({
    isOnline: navigator.onLine,
    pendingCount: 0,
    lastSyncedAt: null,
    totalCached: 0,
    cacheSize: 0,
    autoCapture: true
  });
  const [recentGeotags, setRecentGeotags] = useState<GeotagRecord[]>([]);
  const [facilityZones, setFacilityZones] = useState<GeoZone[]>([]);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  
  // Real camera scanning state
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState<boolean>(false);
  const [manualCode, setManualCode] = useState('');
  const scanIntervalRef = React.useRef<number | null>(null);
  
  // Import state
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // Map state
  const [showMap, setShowMap] = useState(false);
  const mapCanvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Barcode generation state
  const [showBarcodeGenerator, setShowBarcodeGenerator] = useState(false);
  const [barcodeValue, setBarcodeValue] = useState('');
  const barcodeCanvasRef = React.useRef<HTMLCanvasElement>(null);
  
  // Risk scoring state
  const [selectedRisk, setSelectedRisk] = useState<RiskPrediction | null>(null);
  const [riskFilter, setRiskFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');

  // Live backend data — fall back to mock data while loading or if backend unavailable
  const { data: riskPredData } = useHubRiskPredictions();
  const { data: analyticsTrendsData } = useHubAnalyticsTrends();
  const liveRiskPredictions: RiskPrediction[] = (riskPredData as any)?.predictions ?? mockRiskPredictions;
  const liveAnalyticsTrends: AnalyticsTrend[] = (analyticsTrendsData as any)?.monthlyTrends ?? mockAnalyticsTrends;
  
  // Handle file import
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const text = await file.text();
      const result = await sdsDatabase.importEquipmentFromCSV(text);
      setImportResult(result);
      
      // Refresh equipment list
      const equipment = await sdsDatabase.getAllEquipment();
      setAllEquipment(equipment);
    } catch (error) {
      setImportResult({ success: 0, failed: 1, errors: ['Failed to read file'] });
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Generate barcode on canvas
  useEffect(() => {
    if (showBarcodeGenerator && barcodeValue && barcodeCanvasRef.current) {
      const canvas = barcodeCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear canvas
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Simple barcode drawing (Code 39 style simulation)
      ctx.fillStyle = '#000000';
      const code = barcodeValue.toUpperCase();
      const width = canvas.width - 40;
      const height = canvas.height - 40;
      const xStart = 20;
      const yStart = 20;
      
      // Generate a pseudo-random but consistent pattern based on the string
      let currentX = xStart;
      const barWidth = width / (code.length * 10); // Approximate width per char
      
      for (let i = 0; i < code.length; i++) {
        const charCode = code.charCodeAt(i);
        // Draw 5 bars per character
        for (let j = 0; j < 5; j++) {
          const isWide = (charCode >> j) & 1;
          const w = isWide ? barWidth * 2 : barWidth;
          ctx.fillRect(currentX, yStart, w, height - 20);
          currentX += w + barWidth; // Gap
        }
        currentX += barWidth; // Inter-character gap
      }
      
      // Draw text below
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(code, canvas.width / 2, canvas.height - 5);
    }
  }, [showBarcodeGenerator, barcodeValue]);

  // Draw map visualization
  useEffect(() => {
    if (activeTab === 'geotag' && showMap && mapCanvasRef.current && facilityZones.length > 0) {
      const canvas = mapCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size
      const container = canvas.parentElement;
      if (container) {
        canvas.width = container.clientWidth;
        canvas.height = 400;
      }

      // Clear canvas
      ctx.fillStyle = '#F1F5F9'; // slate-100
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Calculate bounds
      let minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;
      
      // Include zones in bounds
      facilityZones.forEach(zone => {
        zone.polygon.forEach(p => {
          minLat = Math.min(minLat, p.lat);
          maxLat = Math.max(maxLat, p.lat);
          minLng = Math.min(minLng, p.lng);
          maxLng = Math.max(maxLng, p.lng);
        });
      });

      // Include recent geotags in bounds
      recentGeotags.forEach(g => {
        minLat = Math.min(minLat, g.latitude);
        maxLat = Math.max(maxLat, g.latitude);
        minLng = Math.min(minLng, g.longitude);
        maxLng = Math.max(maxLng, g.longitude);
      });

      // Add padding
      const latRange = maxLat - minLat || 0.001;
      const lngRange = maxLng - minLng || 0.001;
      minLat -= latRange * 0.1;
      maxLat += latRange * 0.1;
      minLng -= lngRange * 0.1;
      maxLng += lngRange * 0.1;

      // Coordinate conversion functions
      const toX = (lng: number) => ((lng - minLng) / (maxLng - minLng)) * canvas.width;
      const toY = (lat: number) => canvas.height - ((lat - minLat) / (maxLat - minLat)) * canvas.height;

      // Draw zones
      facilityZones.forEach(zone => {
        ctx.beginPath();
        zone.polygon.forEach((p, i) => {
          if (i === 0) ctx.moveTo(toX(p.lng), toY(p.lat));
          else ctx.lineTo(toX(p.lng), toY(p.lat));
        });
        ctx.closePath();
        
        // Color based on risk level
        if (zone.riskLevel === 'critical') ctx.fillStyle = 'rgba(239, 68, 68, 0.2)'; // red-500
        else if (zone.riskLevel === 'high') ctx.fillStyle = 'rgba(249, 115, 22, 0.2)'; // orange-500
        else if (zone.riskLevel === 'medium') ctx.fillStyle = 'rgba(234, 179, 8, 0.2)'; // yellow-500
        else ctx.fillStyle = 'rgba(16, 185, 129, 0.2)'; // emerald-500
        
        ctx.fill();
        ctx.strokeStyle = ctx.fillStyle.replace('0.2', '0.8');
        ctx.lineWidth = 2;
        ctx.stroke();

        // Label
        const centerLat = zone.polygon.reduce((sum, p) => sum + p.lat, 0) / zone.polygon.length;
        const centerLng = zone.polygon.reduce((sum, p) => sum + p.lng, 0) / zone.polygon.length;
        ctx.fillStyle = '#1E293B'; // slate-800
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(zone.name, toX(centerLng), toY(centerLat));
      });

      // Draw geotags
      recentGeotags.forEach(g => {
        const x = toX(g.longitude);
        const y = toY(g.latitude);
        
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fillStyle = g.syncStatus === 'synced' ? '#10B981' : '#F59E0B';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      });

      // Draw current location if available
      if (currentLocation) {
        const x = toX(currentLocation.longitude);
        const y = toY(currentLocation.latitude);
        
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = '#3B82F6'; // blue-500
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 3;
        ctx.stroke();
        
        // Pulse effect ring
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [activeTab, showMap, facilityZones, recentGeotags, currentLocation]);

  // Initialize services
  useEffect(() => {
    const initializeServices = async () => {
      // Initialize SDS database
      await sdsDatabase.initialize();
      const equipment = await sdsDatabase.getAllEquipment();
      setAllEquipment(equipment);
      
      // Load facility zones
      setFacilityZones(geotagCache.getZones());
      
      // Load recent geotags
      const recent = await geotagCache.getRecentGeotags(5);
      setRecentGeotags(recent);
      
      // Check BarcodeDetector support
      if ('BarcodeDetector' in window) {
        setBarcodeSupported(true);
      }
    };
    
    initializeServices();
    
    // Subscribe to SDS sync state
    const unsubscribeSds = sdsDatabase.subscribe(setSdsSyncState);
    
    // Subscribe to geotag state
    const unsubscribeGeo = geotagCache.subscribe(setGeotagState);
    
    return () => {
      unsubscribeSds();
      unsubscribeGeo();
      // Clean up camera stream
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      if (scanIntervalRef.current) {
        clearInterval(scanIntervalRef.current);
      }
    };
  }, []);

  // Get current geolocation with caching
  const getCurrentLocation = useCallback(async () => {
    setIsLocating(true);
    setLocationError(null);

    try {
      const geotag = await geotagCache.getCurrentLocation();
      if (geotag) {
        const location: GeoLocation = {
          latitude: geotag.latitude,
          longitude: geotag.longitude,
          accuracy: geotag.accuracy,
          altitude: geotag.altitude,
          timestamp: new Date(geotag.timestamp),
          address: geotag.address,
          zone: geotag.zone,
          syncStatus: geotag.syncStatus
        };
        setCurrentLocation(location);
        
        // Refresh recent geotags
        const recent = await geotagCache.getRecentGeotags(5);
        setRecentGeotags(recent);
      }
    } catch (error) {
      const err = error as GeolocationPositionError;
      let errorMessage = 'Failed to get location';
      if (err.code === 1) {
        errorMessage = 'Location access denied. Please enable location services.';
      } else if (err.code === 2) {
        errorMessage = 'Location information unavailable.';
      } else if (err.code === 3) {
        errorMessage = 'Location request timed out.';
      }
      setLocationError(errorMessage);
    } finally {
      setIsLocating(false);
    }
  }, []);

  // Scan QR/Barcode using real SDS database
  const performScan = useCallback(async () => {
    setIsScanning(true);
    setScannedEquipment(null);
    setLinkedSDS([]);
    setShowScanResult(false);

    try {
      // Simulate scanning delay and random barcode selection
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Get random equipment from database
      const equipment = await sdsDatabase.getAllEquipment();
      if (equipment.length > 0) {
        const randomEquipment = equipment[Math.floor(Math.random() * equipment.length)];
        const result = await sdsDatabase.scanCode(randomEquipment.barcode);
        
        setScannedEquipment(result.equipment);
        setLinkedSDS(result.linkedSDS);
        setShowScanResult(true);
      }
    } catch (error) {
      console.error('Scan failed:', error);
    } finally {
      setIsScanning(false);
    }
  }, []);
  
  // Sync SDS data
  const syncSdsData = useCallback(async () => {
    await sdsDatabase.sync();
    const equipment = await sdsDatabase.getAllEquipment();
    setAllEquipment(equipment);
  }, []);
  
  // Sync geotag data
  const syncGeotagData = useCallback(async () => {
    await geotagCache.syncPending();
    const recent = await geotagCache.getRecentGeotags(5);
    setRecentGeotags(recent);
  }, []);
  
  // Export geotags to CSV
  const exportGeotagsToCSV = useCallback(async () => {
    setIsExportingCSV(true);
    try {
      await geotagCache.downloadGeotagsCSV();
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExportingCSV(false);
    }
  }, []);
  
  // Start real camera scanning
  const startCameraScanning = useCallback(async () => {
    setCameraError(null);
    setIsScanning(true);
    setScannedEquipment(null);
    setLinkedSDS([]);
    setShowScanResult(false);
    
    try {
      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Start scanning for barcodes
      if (barcodeSupported && 'BarcodeDetector' in window) {
        // @ts-ignore - BarcodeDetector is not in TypeScript yet
        const barcodeDetector = new window.BarcodeDetector({
          formats: ['qr_code', 'ean_13', 'ean_8', 'code_128', 'code_39', 'upc_a', 'upc_e']
        });
        
        scanIntervalRef.current = window.setInterval(async () => {
          if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
            try {
              const barcodes = await barcodeDetector.detect(videoRef.current);
              if (barcodes.length > 0) {
                const detectedCode = barcodes[0].rawValue;
                await handleCodeDetected(detectedCode);
              }
            } catch (e) {
              // Scanning error, continue trying
            }
          }
        }, 300);
      } else {
        // Fallback: simulate scanning with camera preview
        // After 5 seconds, offer manual entry
        setTimeout(() => {
          if (isScanning && !showScanResult) {
            setCameraError('Automatic detection not available. Please enter the code manually.');
          }
        }, 5000);
      }
    } catch (error) {
      const err = error as Error;
      if (err.name === 'NotAllowedError') {
        setCameraError('Camera access denied. Please allow camera access to scan codes.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else {
        setCameraError('Failed to access camera: ' + err.message);
      }
      setIsScanning(false);
    }
  }, [barcodeSupported, isScanning, showScanResult]);
  
  // Stop camera scanning
  const stopCameraScanning = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setCameraError(null);
  }, [cameraStream]);
  
  // Handle detected code
  const handleCodeDetected = useCallback(async (code: string) => {
    // Stop scanning
    stopCameraScanning();
    
    try {
      // Look up equipment by barcode
      const result = await sdsDatabase.scanCode(code);
      
      if (result.equipment) {
        setScannedEquipment(result.equipment);
        setLinkedSDS(result.linkedSDS);
        setShowScanResult(true);
      } else {
        setCameraError(`No equipment found for code: ${code}`);
      }
    } catch (error) {
      setCameraError('Failed to look up equipment');
    }
  }, [stopCameraScanning]);
  
  // Handle manual code entry
  const handleManualCodeSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      await handleCodeDetected(manualCode.trim());
      setManualCode('');
    }
  }, [manualCode, handleCodeDetected]);
  
  // Log inspection for equipment
  const logInspection = useCallback(async (equipmentId: string) => {
    const today = new Date().toISOString().split('T')[0];
    const nextMonth = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    await sdsDatabase.logInspection(equipmentId, {
      date: today,
      type: 'inspection',
      description: 'Routine safety inspection completed',
      performedBy: 'Current User',
      nextDue: nextMonth
    });
    
    // Refresh equipment list
    const equipment = await sdsDatabase.getAllEquipment();
    setAllEquipment(equipment);
    
    // Update scanned equipment if it's the same one
    if (scannedEquipment?.id === equipmentId) {
      const updated = await sdsDatabase.getEquipmentById(equipmentId);
      if (updated) setScannedEquipment(updated);
    }
  }, [scannedEquipment]);
  
  // Filter equipment by search
  const filteredEquipment = useMemo(() => {
    if (!sdsSearchQuery) return allEquipment;
    const query = sdsSearchQuery.toLowerCase();
    return allEquipment.filter(eq => 
      eq.name.toLowerCase().includes(query) ||
      eq.location.toLowerCase().includes(query) ||
      eq.serialNumber.toLowerCase().includes(query)
    );
  }, [allEquipment, sdsSearchQuery]);

  // Filter risk predictions
  const filteredRisks = useMemo(() => {
    if (riskFilter === 'all') return liveRiskPredictions;
    return liveRiskPredictions.filter(risk => risk.severity === riskFilter);
  }, [riskFilter, liveRiskPredictions]);

  // Calculate overall risk metrics
  const overallMetrics = useMemo(() => {
    const avgRisk = liveRiskPredictions.reduce((sum, r) => sum + r.riskScore, 0) / (liveRiskPredictions.length || 1);
    const criticalCount = liveRiskPredictions.filter(r => r.severity === 'critical').length;
    const highCount = liveRiskPredictions.filter(r => r.severity === 'high').length;
    const increasingCount = liveRiskPredictions.filter(r => r.trend === 'increasing').length;

    return { avgRisk, criticalCount, highCount, increasingCount };
  }, [liveRiskPredictions]);

  const getRiskColor = (score: number) => {
    if (score >= 80) return 'text-red-500 bg-red-50 dark:bg-red-900/20';
    if (score >= 60) return 'text-orange-500 bg-orange-50 dark:bg-orange-900/20';
    if (score >= 40) return 'text-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-green-500 bg-green-50 dark:bg-green-900/20';
  };

  const getTrendIcon = (trend: 'increasing' | 'stable' | 'decreasing') => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="w-4 h-4 text-red-500" />;
      case 'stable': return <Activity className="w-4 h-4 text-yellow-500" />;
      case 'decreasing': return <TrendingDown className="w-4 h-4 text-green-500" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    const colors: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      high: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      medium: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    };
    return colors[severity] || colors.low;
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      operational: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      maintenance_due: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      out_of_service: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
    };
    return colors[status] || colors.operational;
  };

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      {/* Header */}
      <header className="sticky top-[72px] z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                    Advanced Technology Hub
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    AI • Analytics • IoT Integration
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                <Settings className="w-5 h-5 text-slate-600 dark:text-slate-400" />
              </button>
              <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors relative">
                <AlertCircle className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="sticky top-16 z-40 bg-white/60 dark:bg-slate-900/60 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 py-2 overflow-x-auto scrollbar-hide">
            {[
              { id: 'overview', label: 'Overview', icon: Layers },
              { id: 'qr-scanner', label: 'QR/Barcode Scanner', icon: QrCode },
              { id: 'geotag', label: 'Geotagging', icon: MapPin },
              { id: 'risk-scoring', label: 'Risk Scoring', icon: Gauge }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Quick Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <AlertTriangle className="w-5 h-5 text-white" />
                  </div>
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getSeverityBadge('critical')}`}>
                    Critical
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallMetrics.criticalCount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Critical Risks</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Gauge className="w-5 h-5 text-white" />
                  </div>
                  <TrendingDown className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallMetrics.avgRisk.toFixed(0)}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Avg Risk Score</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-white" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Trending
                  </span>
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{overallMetrics.increasingCount}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Increasing Risks</p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">94.2%</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Prevention Rate</p>
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-indigo-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">AI Safety Insights</h2>
                  <p className="text-indigo-200 text-sm">Real-time predictive analysis</p>
                </div>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-indigo-200 mb-1">High Priority Alert</p>
                  <p className="font-medium">Storage Facility D requires immediate fire safety inspection</p>
                  <button className="mt-3 text-sm font-medium text-indigo-200 hover:text-white flex items-center gap-1">
                    View Details <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-indigo-200 mb-1">Pattern Detected</p>
                  <p className="font-medium">Slip hazards increase 47% during shift changes at Loading Dock</p>
                  <button className="mt-3 text-sm font-medium text-indigo-200 hover:text-white flex items-center gap-1">
                    View Analysis <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-sm text-indigo-200 mb-1">Positive Trend</p>
                  <p className="font-medium">SIF potential events reduced by 60% from enhanced protocols</p>
                  <button className="mt-3 text-sm font-medium text-indigo-200 hover:text-white flex items-center gap-1">
                    View Report <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Analytics Trends */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-5 h-5 text-indigo-500" />
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Analytics Trends</h2>
                  </div>
                  <button className="text-sm text-indigo-500 hover:text-indigo-600 font-medium flex items-center gap-1">
                    View Full Analytics <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {liveAnalyticsTrends.map((trend) => (
                  <div key={trend.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-slate-900 dark:text-white">{trend.metric}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{trend.prediction}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-bold text-slate-900 dark:text-white">
                            {typeof trend.currentValue === 'number' && trend.currentValue % 1 !== 0 
                              ? `${trend.currentValue}%` 
                              : trend.currentValue}
                          </p>
                          <p className={`text-sm flex items-center gap-1 ${
                            trend.trend === 'up' 
                              ? (trend.metric.includes('Near Miss') || trend.metric.includes('SIF') || trend.metric.includes('Time')
                                ? 'text-green-500' : 'text-green-500')
                              : trend.trend === 'down'
                              ? (trend.metric.includes('Near Miss') || trend.metric.includes('SIF') || trend.metric.includes('Time')
                                ? 'text-green-500' : 'text-red-500')
                              : 'text-yellow-500'
                          }`}>
                            {trend.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : 
                             trend.trend === 'down' ? <TrendingDown className="w-3 h-3" /> :
                             <Activity className="w-3 h-3" />}
                            {trend.percentChange > 0 ? '+' : ''}{trend.percentChange}%
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid md:grid-cols-3 gap-4">
              <button 
                onClick={() => setActiveTab('qr-scanner')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <QrCode className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">QR/Barcode Scanner</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Scan equipment for SDS access</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('geotag')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <MapPin className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Geotagging</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Capture incident locations</p>
                  </div>
                </div>
              </button>

              <button 
                onClick={() => setActiveTab('risk-scoring')}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200/50 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-all group text-left"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Gauge className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Risk Scoring</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Predictive risk analysis</p>
                  </div>
                </div>
              </button>
            </div>
          </motion.div>
        )}

        {/* QR Scanner Tab */}
        {activeTab === 'qr-scanner' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Scanner Interface */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <QrCode className="w-5 h-5 text-indigo-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipment Scanner</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Scan QR codes or barcodes to access Safety Data Sheets and maintenance logs
                </p>
              </div>
              
              <div className="p-6">
                <div className="max-w-md mx-auto">
                  {/* Camera Preview Area */}
                  <div className="relative aspect-square bg-slate-900 rounded-2xl overflow-hidden mb-6">
                    {/* Hidden canvas for processing */}
                    <canvas ref={canvasRef} className="hidden" />
                    
                    {cameraStream ? (
                      <video
                        ref={videoRef}
                        className="absolute inset-0 w-full h-full object-cover"
                        playsInline
                        muted
                      />
                    ) : isScanning ? (
                      <motion.div
                        animate={{ opacity: [0.5, 1, 0.5] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <div className="text-center">
                          <div className="w-48 h-48 border-2 border-indigo-500 rounded-lg relative mb-4">
                            <motion.div
                              animate={{ top: ['0%', '100%', '0%'] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="absolute left-0 right-0 h-0.5 bg-indigo-500"
                            />
                          </div>
                          <p className="text-white text-sm">Initializing camera...</p>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Camera className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                          <p className="text-slate-400 text-sm">Tap to start camera</p>
                          {!barcodeSupported && (
                            <p className="text-amber-400 text-xs mt-2">Manual code entry available</p>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Scanning overlay with corner brackets */}
                    {cameraStream && (
                      <>
                        <div className="absolute inset-0 pointer-events-none">
                          <div className="absolute top-4 left-4 w-12 h-12 border-l-3 border-t-3 border-indigo-500" style={{ borderWidth: '3px 0 0 3px' }} />
                          <div className="absolute top-4 right-4 w-12 h-12 border-r-3 border-t-3 border-indigo-500" style={{ borderWidth: '3px 3px 0 0' }} />
                          <div className="absolute bottom-4 left-4 w-12 h-12 border-l-3 border-b-3 border-indigo-500" style={{ borderWidth: '0 0 3px 3px' }} />
                          <div className="absolute bottom-4 right-4 w-12 h-12 border-r-3 border-b-3 border-indigo-500" style={{ borderWidth: '0 3px 3px 0' }} />
                        </div>
                        <motion.div 
                          className="absolute left-4 right-4 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent"
                          animate={{ top: ['20%', '80%', '20%'] }}
                          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                        />
                      </>
                    )}
                    
                    {/* Camera error message */}
                    {cameraError && !showScanResult && (
                      <div className="absolute bottom-4 left-4 right-4 bg-amber-500/90 text-white text-sm p-3 rounded-xl text-center">
                        {cameraError}
                      </div>
                    )}
                  </div>
                  
                  {/* Scan/Stop Button */}
                  {!cameraStream ? (
                    <button
                      onClick={startCameraScanning}
                      disabled={isScanning}
                      className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-medium shadow-lg shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isScanning ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Starting Camera...
                        </>
                      ) : (
                        <>
                          <Camera className="w-5 h-5" />
                          Start Camera Scanning
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={stopCameraScanning}
                      className="w-full py-4 bg-slate-600 text-white rounded-xl font-medium hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="w-5 h-5" />
                      Stop Scanning
                    </button>
                  )}
                  
                  {/* Manual Code Entry */}
                  <div className="mt-4">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 text-center">Or enter code manually:</p>
                    <form onSubmit={handleManualCodeSubmit} className="flex gap-2">
                      <input
                        type="text"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value)}
                        placeholder="Enter barcode or QR code"
                        className="flex-1 px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                      />
                      <button
                        type="submit"
                        disabled={!manualCode.trim()}
                        className="px-4 py-3 bg-indigo-500 text-white rounded-xl font-medium hover:bg-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Search className="w-5 h-5" />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </div>

            {/* Scan Result */}
            <AnimatePresence>
              {showScanResult && scannedEquipment && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-200 dark:border-slate-700 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipment Found</h2>
                      </div>
                      {scannedEquipment.pendingSync && (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <CloudOff className="w-3 h-3" /> Pending sync
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-6">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center flex-shrink-0">
                        <Package className="w-8 h-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white">{scannedEquipment.name}</h3>
                        <p className="text-slate-500 dark:text-slate-400">{scannedEquipment.type}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getStatusBadge(scannedEquipment.status)}`}>
                            {scannedEquipment.status.replace('_', ' ').toUpperCase()}
                          </span>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${getRiskColor(scannedEquipment.riskScore)}`}>
                            Risk: {scannedEquipment.riskScore}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Serial Number</p>
                        <p className="font-mono font-medium text-slate-900 dark:text-white">{scannedEquipment.serialNumber}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Location</p>
                        <p className="font-medium text-slate-900 dark:text-white">{scannedEquipment.location}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Last Inspection</p>
                        <p className="font-medium text-slate-900 dark:text-white">{scannedEquipment.lastInspection}</p>
                      </div>
                      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Next Inspection</p>
                        <p className="font-medium text-slate-900 dark:text-white">{scannedEquipment.nextInspection}</p>
                      </div>
                    </div>
                    
                    {/* Linked SDS */}
                    {linkedSDS.length > 0 && (
                      <div className="mb-6">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Linked Safety Data Sheets ({linkedSDS.length})</p>
                        <div className="space-y-2">
                          {linkedSDS.map(sds => (
                            <div key={sds.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                              <div className="flex items-center gap-3">
                                <FileText className="w-5 h-5 text-blue-500" />
                                <div>
                                  <p className="font-medium text-slate-900 dark:text-white">{sds.name}</p>
                                  <p className="text-xs text-slate-500 dark:text-slate-400">{sds.manufacturer}</p>
                                </div>
                              </div>
                              <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                                sds.signalWord === 'Danger' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                sds.signalWord === 'Warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400'
                              }`}>
                                {sds.signalWord}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                      {linkedSDS.length > 0 && (
                        <button className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                          <FileText className="w-5 h-5" />
                          View SDS
                        </button>
                      )}
                      <button 
                        onClick={() => logInspection(scannedEquipment.id)}
                        className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Clock className="w-5 h-5" />
                        Log Inspection
                      </button>
                      <button className="flex-1 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                        <History className="w-5 h-5" />
                        View History
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sync Status & Recent Scans */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Equipment Database</h2>
                  <div className="flex items-center gap-3">
                    {/* Import Button */}
                    <div className="relative">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept=".csv"
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isImporting}
                        className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50"
                      >
                        {isImporting ? (
                          <RefreshCw className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        Import CSV
                      </button>
                    </div>
                    
                    {/* Barcode Generator Toggle */}
                    <button
                      onClick={() => setShowBarcodeGenerator(!showBarcodeGenerator)}
                      className={`p-2 rounded-lg transition-colors ${
                        showBarcodeGenerator 
                          ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                          : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                      title="Generate Barcode"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {/* Sync Status */}
                    <div className="flex items-center gap-2">
                      {sdsSyncState.status === 'online' ? (
                        <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <Wifi className="w-3 h-3" /> Online
                        </span>
                      ) : sdsSyncState.status === 'syncing' ? (
                        <span className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400">
                          <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                        </span>
                      ) : sdsSyncState.status === 'offline' ? (
                        <span className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400">
                          <WifiOff className="w-3 h-3" /> Offline
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-red-600 dark:text-red-400">
                          <XCircle className="w-3 h-3" /> Error
                        </span>
                      )}
                      {sdsSyncState.pendingChanges > 0 && (
                        <span className="text-xs text-amber-600 dark:text-amber-400">
                          ({sdsSyncState.pendingChanges} pending)
                        </span>
                      )}
                    </div>
                    <button
                      onClick={syncSdsData}
                      disabled={sdsSyncState.status === 'syncing'}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-4 h-4 text-slate-600 dark:text-slate-400 ${sdsSyncState.status === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
                {/* Import Result Message */}
                {importResult && (
                  <div className={`mx-5 mt-4 p-3 rounded-xl text-sm ${
                    importResult.failed === 0 
                      ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' 
                      : 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                  }`}>
                    <p className="font-medium">
                      Import Complete: {importResult.success} imported, {importResult.failed} failed
                    </p>
                    {importResult.errors.length > 0 && (
                      <ul className="mt-1 list-disc list-inside text-xs opacity-80">
                        {importResult.errors.slice(0, 3).map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                        {importResult.errors.length > 3 && <li>...and {importResult.errors.length - 3} more errors</li>}
                      </ul>
                    )}
                  </div>
                )}

                {/* Barcode Generator Panel */}
                <AnimatePresence>
                  {showBarcodeGenerator && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50"
                    >
                      <div className="p-5">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Barcode Generator</h3>
                        <div className="flex flex-col sm:flex-row gap-4">
                          <div className="flex-1 space-y-3">
                            <input
                              type="text"
                              value={barcodeValue}
                              onChange={(e) => setBarcodeValue(e.target.value)}
                              placeholder="Enter text to generate barcode..."
                              className="w-full px-4 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                            />
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Generates a Code 39 style barcode simulation for testing scanners.
                            </p>
                          </div>
                          <div className="flex-shrink-0 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                            <canvas 
                              ref={barcodeCanvasRef} 
                              width={300} 
                              height={100} 
                              className="w-full max-w-[300px] h-[100px]"
                            />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Search */}
                <div className="mt-3 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={sdsSearchQuery}
                    onChange={(e) => setSdsSearchQuery(e.target.value)}
                    placeholder="Search equipment..."
                    className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                  />
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700 max-h-80 overflow-y-auto">
                {filteredEquipment.map((equipment) => (
                  <div key={equipment.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-600 dark:text-slate-400" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{equipment.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{equipment.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {equipment.pendingSync && (
                          <CloudOff className="w-4 h-4 text-amber-500" />
                        )}
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusBadge(equipment.status)}`}>
                          {equipment.status.replace('_', ' ')}
                        </span>
                        {equipment.linkedSDS.length > 0 && (
                          <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg text-blue-500 transition-colors">
                            <FileText className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Geotagging Tab */}
        {activeTab === 'geotag' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Geotag Cache Status */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <Database className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white">Offline Cache Status</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">Location data stored locally</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowMap(!showMap)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-colors ${
                      showMap 
                        ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400' 
                        : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    <MapPin className="w-4 h-4" />
                    {showMap ? 'Hide Map' : 'Show Map'}
                  </button>
                  <button
                    onClick={exportGeotagsToCSV}
                    disabled={isExportingCSV || geotagState.totalCached === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isExportingCSV ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                    Export CSV
                  </button>
                  <button
                    onClick={syncGeotagData}
                    disabled={!geotagState.isOnline || geotagState.pendingCount === 0}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Cloud className="w-4 h-4" />
                    Sync Now
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    {geotagState.isOnline ? (
                      <Wifi className="w-4 h-4 text-green-500" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-amber-500" />
                    )}
                    <span className={`text-sm font-medium ${geotagState.isOnline ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                      {geotagState.isOnline ? 'Online' : 'Offline'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Connection</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{geotagState.totalCached}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cached Locations</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{geotagState.pendingCount}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Pending Sync</p>
                </div>
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-xl p-4 text-center">
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{(geotagState.cacheSize / 1024).toFixed(1)}KB</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Cache Size</p>
                </div>
              </div>
              
              {geotagState.lastSyncedAt && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-4 text-center">
                  Last synced: {new Date(geotagState.lastSyncedAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Map Visualization */}
            <AnimatePresence>
              {showMap && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden"
                >
                  <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                    <h3 className="font-bold text-slate-900 dark:text-white">Facility Map Visualization</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Visualizing {facilityZones.length} zones and {recentGeotags.length} recent reports
                    </p>
                  </div>
                  <div className="relative w-full h-[400px] bg-slate-100 dark:bg-slate-900">
                    <canvas ref={mapCanvasRef} className="w-full h-full" />
                    <div className="absolute bottom-4 right-4 bg-white/90 dark:bg-slate-800/90 p-3 rounded-xl text-xs space-y-2 shadow-lg backdrop-blur-sm">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></span>
                        <span>Critical Zone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500/20 border border-orange-500"></span>
                        <span>High Risk Zone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></span>
                        <span>Safe Zone</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white"></span>
                        <span>Synced Report</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-amber-500 border border-white"></span>
                        <span>Pending Report</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Location Capture */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <MapPin className="w-5 h-5 text-emerald-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Location Capture</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  Automatically capture GPS coordinates for incident reporting
                </p>
              </div>
              
              <div className="p-6">
                <div className="max-w-lg mx-auto">
                  {/* Map Preview */}
                  <div className="relative aspect-video bg-slate-100 dark:bg-slate-900 rounded-2xl overflow-hidden mb-6">
                    {currentLocation ? (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-4 animate-pulse">
                            <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                              <Navigation className="w-4 h-4 text-white" />
                            </div>
                          </div>
                          <p className="text-sm text-slate-600 dark:text-slate-400">Location captured</p>
                          <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                            Accuracy: ±{currentLocation.accuracy.toFixed(0)}m
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <Crosshair className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            Tap to capture location
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Grid overlay */}
                    <div className="absolute inset-0 opacity-10">
                      <div className="w-full h-full" style={{
                        backgroundImage: 'linear-gradient(rgba(100,100,100,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(100,100,100,0.5) 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }} />
                    </div>
                  </div>
                  
                  {/* Location Details */}
                  {currentLocation && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4 mb-6"
                    >
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Latitude</p>
                          <p className="font-mono font-medium text-slate-900 dark:text-white">
                            {currentLocation.latitude.toFixed(6)}°
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Longitude</p>
                          <p className="font-mono font-medium text-slate-900 dark:text-white">
                            {currentLocation.longitude.toFixed(6)}°
                          </p>
                        </div>
                        {currentLocation.altitude && (
                          <div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Altitude</p>
                            <p className="font-mono font-medium text-slate-900 dark:text-white">
                              {currentLocation.altitude.toFixed(1)}m
                            </p>
                          </div>
                        )}
                        <div>
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Timestamp</p>
                          <p className="font-medium text-slate-900 dark:text-white text-sm">
                            {currentLocation.timestamp.toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      {currentLocation.address && (
                        <div className="mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Address</p>
                          <p className="font-medium text-slate-900 dark:text-white">{currentLocation.address}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                  
                  {/* Error State */}
                  {locationError && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-6"
                    >
                      <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-red-500" />
                        <p className="text-sm text-red-700 dark:text-red-400">{locationError}</p>
                      </div>
                    </motion.div>
                  )}
                  
                  <button
                    onClick={getCurrentLocation}
                    disabled={isLocating}
                    className="w-full py-4 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLocating ? (
                      <>
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <Crosshair className="w-5 h-5" />
                        {currentLocation ? 'Update Location' : 'Capture Location'}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Geotagging Features */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Auto-Capture</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Automatically attach GPS coordinates when submitting incident reports or safety observations.
                </p>
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Enable Auto-Capture</span>
                  <button className="w-12 h-6 bg-emerald-500 rounded-full relative">
                    <span className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow" />
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white">Zone Mapping</h3>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
                  Define facility zones for automatic categorization and risk assessment based on location.
                </p>
                <button className="w-full py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                  Configure Zones
                </button>
              </div>
            </div>

            {/* Recent Geotagged Incidents */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">Recent Geotagged Reports</h2>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    {recentGeotags.length} cached
                  </span>
                </div>
              </div>
              <div className="divide-y divide-slate-200 dark:divide-slate-700">
                {recentGeotags.length > 0 ? (
                  recentGeotags.map((geotag) => (
                    <div key={geotag.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            geotag.syncStatus === 'synced' 
                              ? 'bg-emerald-100 dark:bg-emerald-900/30' 
                              : geotag.syncStatus === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-900/30'
                              : 'bg-red-100 dark:bg-red-900/30'
                          }`}>
                            <MapPin className={`w-5 h-5 ${
                              geotag.syncStatus === 'synced'
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : geotag.syncStatus === 'pending'
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-red-600 dark:text-red-400'
                            }`} />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white capitalize">{geotag.recordType.replace('_', ' ')}</p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">{geotag.address || `${geotag.latitude.toFixed(4)}°, ${geotag.longitude.toFixed(4)}°`}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            {new Date(geotag.capturedAt).toLocaleString()}
                          </span>
                          {geotag.syncStatus === 'pending' && (
                            <CloudOff className="w-4 h-4 text-amber-500" />
                          )}
                          {geotag.syncStatus === 'synced' && (
                            <Cloud className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 text-center text-slate-500 dark:text-slate-400">
                    <MapPin className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>No geotagged reports yet</p>
                    <p className="text-sm">Capture a location to see it here</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Risk Scoring Tab */}
        {activeTab === 'risk-scoring' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Risk Overview */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl shadow-violet-500/20">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                    <Gauge className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Predictive Risk Scoring</h2>
                    <p className="text-violet-200 text-sm">AI-powered risk analysis engine</p>
                  </div>
                </div>
                <button className="p-2 hover:bg-white/10 rounded-xl transition-colors">
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>
              
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold">{liveRiskPredictions.length}</p>
                  <p className="text-sm text-violet-200">Active Predictions</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold">{overallMetrics.criticalCount + overallMetrics.highCount}</p>
                  <p className="text-sm text-violet-200">High Priority</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold">89%</p>
                  <p className="text-sm text-violet-200">Model Accuracy</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4 text-center">
                  <p className="text-3xl font-bold">156</p>
                  <p className="text-sm text-violet-200">Events Analyzed</p>
                </div>
              </div>
            </div>

            {/* Filter Controls */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {['all', 'critical', 'high', 'medium', 'low'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setRiskFilter(filter as any)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                    riskFilter === filter
                      ? 'bg-violet-500 text-white shadow-lg shadow-violet-500/20'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter !== 'all' && (
                    <span className="ml-2 px-1.5 py-0.5 text-xs rounded-full bg-white/20">
                      {liveRiskPredictions.filter(r => r.severity === filter).length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Risk Predictions List */}
            <div className="space-y-4">
              {filteredRisks.map((risk) => (
                <motion.div
                  key={risk.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden"
                >
                  <div 
                    className="p-5 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                    onClick={() => setSelectedRisk(selectedRisk?.id === risk.id ? null : risk)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${getRiskColor(risk.riskScore)}`}>
                          <span className="text-xl font-bold">{risk.riskScore}</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-slate-900 dark:text-white">{risk.category}</h3>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getSeverityBadge(risk.severity)}`}>
                              {risk.severity}
                            </span>
                            {getTrendIcon(risk.trend)}
                          </div>
                          <p className="text-sm text-slate-500 dark:text-slate-400">{risk.location}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <p className="text-sm text-slate-500 dark:text-slate-400">Predicted</p>
                          <p className="font-medium text-slate-900 dark:text-white">{risk.predictedDate}</p>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${selectedRisk?.id === risk.id ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </div>
                  
                  <AnimatePresence>
                    {selectedRisk?.id === risk.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="border-t border-slate-200 dark:border-slate-700"
                      >
                        <div className="p-5 space-y-4">
                          {/* Confidence & Factors */}
                          <div className="grid md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confidence Level</p>
                              <div className="flex items-center gap-3">
                                <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-violet-500 to-purple-600 rounded-full"
                                    style={{ width: `${risk.confidence}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium text-slate-900 dark:text-white">{risk.confidence}%</span>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Contributing Factors</p>
                              <div className="flex flex-wrap gap-2">
                                {risk.factors.map((factor, index) => (
                                  <span key={index} className="text-xs px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-400">
                                    {factor}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                          
                          {/* Recommendations */}
                          <div>
                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">AI Recommendations</p>
                            <div className="space-y-2">
                              {risk.recommendations.map((rec, index) => (
                                <div key={index} className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                  <Lightbulb className="w-4 h-4 text-blue-500" />
                                  <span className="text-sm text-slate-700 dark:text-slate-300">{rec}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          {/* Actions */}
                          <div className="flex gap-3 pt-2">
                            <button className="flex-1 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg hover:shadow-violet-500/20 transition-all text-sm">
                              Create Action Item
                            </button>
                            <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm">
                              View Details
                            </button>
                            <button className="px-4 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm">
                              Dismiss
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>

            {/* SIF Prevention Section */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 shadow-sm overflow-hidden">
              <div className="p-5 border-b border-slate-200 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-red-500" />
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">SIF Prevention Analysis</h2>
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  AI-identified precursors to serious injuries and fatalities
                </p>
              </div>
              
              <div className="p-5">
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-red-600 dark:text-red-400">2</p>
                    <p className="text-sm text-red-600 dark:text-red-400">SIF Potential Events</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-amber-600 dark:text-amber-400">8</p>
                    <p className="text-sm text-amber-600 dark:text-amber-400">Precursor Indicators</p>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">94%</p>
                    <p className="text-sm text-green-600 dark:text-green-400">Prevention Rate</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertTriangle className="w-5 h-5 text-red-500" />
                      <span className="font-bold text-red-700 dark:text-red-400">High Energy Release Potential</span>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-300">Storage Facility D - Compressed gas cylinders near heat source detected</p>
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-3 mb-2">
                      <AlertCircle className="w-5 h-5 text-amber-500" />
                      <span className="font-bold text-amber-700 dark:text-amber-400">Fall Protection Gap</span>
                    </div>
                    <p className="text-sm text-amber-600 dark:text-amber-300">Construction Site - Work at height without proper anchor points identified</p>
                  </div>
                </div>
                
                <button 
                  onClick={() => navigate('/sif-dashboard')}
                  className="w-full mt-4 py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white rounded-xl font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  View Full SIF Dashboard
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default AdvancedTechnologyHub;
