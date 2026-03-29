import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  useHeatmapIncidents,
  useCreateHeatmapIncidentMutation,
  useUpdateHeatmapIncidentMutation,
} from '../api/hooks/useAPIHooks';
import { 
  ArrowLeft, 
  Filter, 
  Calendar, 
  MapPin, 
  AlertTriangle,
  Flame,
  Activity,
  TrendingUp,
  Eye,
  ChevronDown,
  X,
  Info,
  Layers,
  Target,
  Clock,
  Building2,
  Users,
  Radio,
  Zap,
  Bell,
  Volume2,
  VolumeX,
  RefreshCw,
  Wifi,
  WifiOff,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { SMButton } from '../components/ui';

// ============================================
// MOCK INCIDENT DATA WITH LOCATION COORDINATES
// ============================================

interface IncidentLocation {
  id: string;
  title: string;
  type: 'injury' | 'near-miss' | 'property-damage' | 'environmental' | 'fire' | 'vehicle';
  severity: 'low' | 'medium' | 'high' | 'critical';
  date: string;
  location: string;
  department: string;
  coordinates: { x: number; y: number };
  description: string;
  status: 'open' | 'investigating' | 'closed';
  isNew?: boolean;
  reportedBy?: string;
  timestamp?: string;
}

// Real-time event types
interface RealTimeEvent {
  id: string;
  type: 'new_incident' | 'status_update' | 'severity_change' | 'location_update';
  incidentId: string;
  timestamp: Date;
  data: Partial<IncidentLocation>;
  message: string;
}

const initialIncidents: IncidentLocation[] = [
  // Warehouse Area - High activity
  { id: 'INC-001', title: 'Forklift Near Miss', type: 'near-miss', severity: 'high', date: '2026-02-05', location: 'Warehouse A - Aisle 3', department: 'Logistics', coordinates: { x: 15, y: 25 }, description: 'Forklift nearly struck pedestrian in blind corner', status: 'investigating', reportedBy: 'Mike Johnson' },
  { id: 'INC-002', title: 'Slip and Fall', type: 'injury', severity: 'medium', date: '2026-02-04', location: 'Warehouse A - Loading Dock', department: 'Logistics', coordinates: { x: 12, y: 30 }, description: 'Employee slipped on wet floor near loading dock', status: 'closed', reportedBy: 'Sarah Chen' },
  { id: 'INC-003', title: 'Pallet Collapse', type: 'property-damage', severity: 'low', date: '2026-02-03', location: 'Warehouse A - Rack B4', department: 'Logistics', coordinates: { x: 18, y: 22 }, description: 'Improperly stacked pallet fell from rack', status: 'closed', reportedBy: 'Tom Wilson' },
  { id: 'INC-004', title: 'Hand Laceration', type: 'injury', severity: 'medium', date: '2026-02-01', location: 'Warehouse B - Packaging', department: 'Logistics', coordinates: { x: 20, y: 35 }, description: 'Cut from box cutter during unpacking', status: 'closed', reportedBy: 'Anna Davis' },
  { id: 'INC-005', title: 'Pedestrian Near Miss', type: 'near-miss', severity: 'medium', date: '2026-01-28', location: 'Warehouse A - Aisle 5', department: 'Logistics', coordinates: { x: 16, y: 28 }, description: 'Forklift backed up without checking mirror', status: 'closed', reportedBy: 'James Lee' },
  
  // Manufacturing Floor
  { id: 'INC-006', title: 'Machine Pinch Point', type: 'injury', severity: 'high', date: '2026-02-05', location: 'Manufacturing - Line 2', department: 'Production', coordinates: { x: 45, y: 40 }, description: 'Finger caught in conveyor mechanism', status: 'investigating', reportedBy: 'Carlos Martinez' },
  { id: 'INC-007', title: 'Chemical Splash', type: 'injury', severity: 'medium', date: '2026-02-04', location: 'Manufacturing - Chemical Station', department: 'Production', coordinates: { x: 50, y: 55 }, description: 'Cleaning solution splashed on arm', status: 'closed', reportedBy: 'Lisa Park' },
  { id: 'INC-008', title: 'Noise Exposure', type: 'near-miss', severity: 'low', date: '2026-02-03', location: 'Manufacturing - Press Area', department: 'Production', coordinates: { x: 48, y: 45 }, description: 'Employee without hearing protection in high-noise area', status: 'closed', reportedBy: 'David Brown' },
  { id: 'INC-009', title: 'Electrical Arc Flash Near Miss', type: 'near-miss', severity: 'critical', date: '2026-02-02', location: 'Manufacturing - Panel E-4', department: 'Maintenance', coordinates: { x: 55, y: 50 }, description: 'Near arc flash during panel inspection', status: 'investigating', reportedBy: 'Kevin White' },
  { id: 'INC-010', title: 'Robot Arm Malfunction', type: 'property-damage', severity: 'high', date: '2026-01-30', location: 'Manufacturing - Cell 7', department: 'Production', coordinates: { x: 52, y: 42 }, description: 'Robot arm exceeded programmed boundaries', status: 'closed', reportedBy: 'Emily Taylor' },
  
  // Laboratory Area
  { id: 'INC-013', title: 'Chemical Spill', type: 'environmental', severity: 'high', date: '2026-02-04', location: 'Laboratory - Bay 2', department: 'R&D', coordinates: { x: 75, y: 20 }, description: 'Solvent container tipped during transport', status: 'investigating', reportedBy: 'Dr. Rachel Kim' },
  { id: 'INC-014', title: 'Fume Hood Failure', type: 'near-miss', severity: 'high', date: '2026-01-31', location: 'Laboratory - Chemistry', department: 'R&D', coordinates: { x: 78, y: 25 }, description: 'Fume hood ventilation stopped during experiment', status: 'closed', reportedBy: 'Dr. Mark Stevens' },
  
  // Maintenance Shop
  { id: 'INC-021', title: 'Welding Flash', type: 'injury', severity: 'medium', date: '2026-02-05', location: 'Maintenance Shop', department: 'Maintenance', coordinates: { x: 30, y: 65 }, description: 'Eye exposure to welding arc', status: 'investigating', reportedBy: 'Robert Garcia' },
  { id: 'INC-022', title: 'Grinder Kickback', type: 'near-miss', severity: 'high', date: '2026-01-29', location: 'Maintenance Shop', department: 'Maintenance', coordinates: { x: 32, y: 68 }, description: 'Angle grinder caught and kicked back', status: 'closed', reportedBy: 'Jason Miller' },
  { id: 'INC-023', title: 'Fire - Welding Sparks', type: 'fire', severity: 'critical', date: '2026-01-15', location: 'Maintenance Shop', department: 'Maintenance', coordinates: { x: 28, y: 62 }, description: 'Small fire from welding sparks on oily rags', status: 'closed', reportedBy: 'Michael Thompson' },
];

// Simulated real-time incident templates
const simulatedNewIncidents = [
  { title: 'Forklift Collision', type: 'vehicle' as const, severity: 'high' as const, location: 'Warehouse B - Dock 2', department: 'Logistics', coordinates: { x: 22, y: 38 }, description: 'Forklift struck loading dock pillar' },
  { title: 'Chemical Exposure', type: 'injury' as const, severity: 'medium' as const, location: 'Manufacturing - Clean Room', department: 'Production', coordinates: { x: 60, y: 35 }, description: 'Worker exposed to chemical fumes' },
  { title: 'Fall from Height', type: 'injury' as const, severity: 'critical' as const, location: 'Warehouse A - Mezzanine', department: 'Logistics', coordinates: { x: 14, y: 18 }, description: 'Worker fell from elevated platform' },
  { title: 'Machine Guard Removed', type: 'near-miss' as const, severity: 'high' as const, location: 'Manufacturing - CNC Area', department: 'Production', coordinates: { x: 42, y: 48 }, description: 'Machine operated with guard removed' },
  { title: 'Electrical Short', type: 'fire' as const, severity: 'high' as const, location: 'Office - Server Room', department: 'Administration', coordinates: { x: 78, y: 58 }, description: 'Electrical panel sparked and smoked' },
  { title: 'Compressed Gas Leak', type: 'environmental' as const, severity: 'critical' as const, location: 'Laboratory - Storage', department: 'R&D', coordinates: { x: 70, y: 28 }, description: 'Argon cylinder valve leaking' },
  { title: 'Struck by Object', type: 'injury' as const, severity: 'medium' as const, location: 'Maintenance Shop', department: 'Maintenance', coordinates: { x: 35, y: 70 }, description: 'Falling tool struck worker on shoulder' },
  { title: 'Slip on Oil', type: 'near-miss' as const, severity: 'low' as const, location: 'Manufacturing - Assembly', department: 'Production', coordinates: { x: 52, y: 60 }, description: 'Near slip on hydraulic fluid puddle' },
];

const reporters = ['John Smith', 'Maria Garcia', 'Alex Wong', 'Jennifer Adams', 'Chris O\'Brien', 'Samantha Lee', 'Derek Foster', 'Nicole Patel'];

// ============================================
// HEATMAP CALCULATION UTILITIES
// ============================================

interface HeatmapCell {
  x: number;
  y: number;
  count: number;
  incidents: IncidentLocation[];
  intensity: number;
}

const calculateHeatmapData = (
  incidents: IncidentLocation[],
  gridSize: number = 10
): HeatmapCell[] => {
  const cells: Map<string, HeatmapCell> = new Map();
  
  incidents.forEach(incident => {
    const cellX = Math.floor(incident.coordinates.x / gridSize) * gridSize;
    const cellY = Math.floor(incident.coordinates.y / gridSize) * gridSize;
    const key = `${cellX}-${cellY}`;
    
    if (cells.has(key)) {
      const cell = cells.get(key)!;
      cell.count++;
      cell.incidents.push(incident);
    } else {
      cells.set(key, {
        x: cellX,
        y: cellY,
        count: 1,
        incidents: [incident],
        intensity: 0
      });
    }
  });
  
  const maxCount = Math.max(...Array.from(cells.values()).map(c => c.count));
  cells.forEach(cell => {
    cell.intensity = cell.count / maxCount;
  });
  
  return Array.from(cells.values());
};

const getHeatColor = (intensity: number, severity?: string): string => {
  if (severity === 'critical') return 'rgba(220, 38, 38, 0.8)';
  if (severity === 'high') return 'rgba(249, 115, 22, 0.7)';
  
  if (intensity >= 0.8) return 'rgba(220, 38, 38, 0.6)';
  if (intensity >= 0.6) return 'rgba(249, 115, 22, 0.5)';
  if (intensity >= 0.4) return 'rgba(234, 179, 8, 0.4)';
  if (intensity >= 0.2) return 'rgba(34, 197, 94, 0.3)';
  return 'rgba(59, 130, 246, 0.2)';
};

// ============================================
// SOUND UTILITY
// ============================================

const playAlertSound = (severity: 'low' | 'medium' | 'high' | 'critical') => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different tones based on severity
    const frequencies: Record<string, number> = {
      'low': 440,
      'medium': 523,
      'high': 659,
      'critical': 880
    };
    
    oscillator.frequency.value = frequencies[severity] || 440;
    oscillator.type = severity === 'critical' ? 'square' : 'sine';
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
  } catch (e) {
    console.log('Audio not supported');
  }
};

// ============================================
// COMPONENT
// ============================================

export default function IncidentHeatmap() {
  const navigate = useNavigate();

  // API data
  const { data: apiIncidents } = useHeatmapIncidents();
  const createHeatmapIncident = useCreateHeatmapIncidentMutation();
  const updateHeatmapIncident = useUpdateHeatmapIncidentMutation();

  // Real-time state
  const [incidents, setIncidents] = useState<IncidentLocation[]>([]);
  const [liveEvents, setLiveEvents] = useState<RealTimeEvent[]>([]); 
  const [isLiveEnabled, setIsLiveEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('connected');
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const eventIdCounter = useRef(100);
  
  // Filters
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | 'year' | 'all'>('30d');
  const [incidentTypes, setIncidentTypes] = useState<string[]>([]);
  const [severities, setSeverities] = useState<string[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  
  // View
  const [selectedCell, setSelectedCell] = useState<HeatmapCell | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<IncidentLocation | null>(null);
  const [viewMode, setViewMode] = useState<'heatmap' | 'dots'>('heatmap');
  const [showLegend, setShowLegend] = useState(true);
  const [showLiveFeed, setShowLiveFeed] = useState(true);
  
  // Filter options
  const allTypes = ['injury', 'near-miss', 'property-damage', 'environmental', 'fire', 'vehicle'];
  const allSeverities = ['low', 'medium', 'high', 'critical'];
  const allDepartments = [...new Set(incidents.map(i => i.department))];

  // Load incidents from API on mount
  useEffect(() => {
    if (apiIncidents && apiIncidents.length > 0 && incidents.length === 0) {
      setIncidents(apiIncidents as IncidentLocation[]);
    }
  }, [apiIncidents]);
  
  // Simulate real-time incident generation
  useEffect(() => {
    if (!isLiveEnabled) return;
    
    const generateRandomIncident = () => {
      const template = simulatedNewIncidents[Math.floor(Math.random() * simulatedNewIncidents.length)];
      const reporter = reporters[Math.floor(Math.random() * reporters.length)];
      eventIdCounter.current++;
      
      const newIncident: IncidentLocation = {
        ...template,
        id: `INC-${String(eventIdCounter.current).padStart(3, '0')}`,
        date: new Date().toISOString().split('T')[0],
        status: 'open',
        isNew: true,
        reportedBy: reporter,
        timestamp: new Date().toISOString(),
      };
      
      const event: RealTimeEvent = {
        id: `EVT-${Date.now()}`,
        type: 'new_incident',
        incidentId: newIncident.id,
        timestamp: new Date(),
        data: newIncident,
        message: `New ${newIncident.type.replace('-', ' ')} reported: ${newIncident.title}`,
      };
      
      // Play sound for high/critical
      if (soundEnabled && (newIncident.severity === 'high' || newIncident.severity === 'critical')) {
        playAlertSound(newIncident.severity);
      }

      // Persist to backend
      createHeatmapIncident.mutate({
        ...newIncident,
        coordX: newIncident.coordinates.x,
        coordY: newIncident.coordinates.y,
      });

      setIncidents(prev => [newIncident, ...prev]);
      setLiveEvents(prev => [event, ...prev].slice(0, 20));
      setLastUpdate(new Date());
      
      // Remove "isNew" flag after animation
      setTimeout(() => {
        setIncidents(prev => prev.map(inc => 
          inc.id === newIncident.id ? { ...inc, isNew: false } : inc
        ));
      }, 5000);
    };
    
    // Simulate status updates
    const generateStatusUpdate = () => {
      const openIncidents = incidents.filter(i => i.status !== 'closed');
      if (openIncidents.length === 0) return;
      
      const incident = openIncidents[Math.floor(Math.random() * openIncidents.length)];
      const newStatus = incident.status === 'open' ? 'investigating' : 'closed';
      
      const event: RealTimeEvent = {
        id: `EVT-${Date.now()}`,
        type: 'status_update',
        incidentId: incident.id,
        timestamp: new Date(),
        data: { status: newStatus },
        message: `${incident.id} status changed to ${newStatus}`,
      };
      
      setIncidents(prev => prev.map(inc => 
        inc.id === incident.id ? { ...inc, status: newStatus } : inc
      ));
      setLiveEvents(prev => [event, ...prev].slice(0, 20));
      setLastUpdate(new Date());

      // Persist status update to backend
      updateHeatmapIncident.mutate({ id: incident.id, data: { status: newStatus } });
    };
    
    // New incident every 15-30 seconds
    const incidentInterval = setInterval(() => {
      if (Math.random() > 0.3) {
        generateRandomIncident();
      }
    }, Math.random() * 15000 + 15000);
    
    // Status update every 20-40 seconds
    const statusInterval = setInterval(() => {
      if (Math.random() > 0.5) {
        generateStatusUpdate();
      }
    }, Math.random() * 20000 + 20000);
    
    return () => {
      clearInterval(incidentInterval);
      clearInterval(statusInterval);
    };
  }, [isLiveEnabled, soundEnabled, incidents]);
  
  // Simulate connection status changes
  useEffect(() => {
    const connectionCheck = setInterval(() => {
      if (Math.random() > 0.95) {
        setConnectionStatus('reconnecting');
        setTimeout(() => setConnectionStatus('connected'), 2000);
      }
    }, 10000);
    
    return () => clearInterval(connectionCheck);
  }, []);
  
  // Apply filters
  const filteredIncidents = useMemo(() => {
    let filtered = [...incidents];
    
    const now = new Date('2026-02-06');
    if (timeRange !== 'all') {
      const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 365;
      const cutoff = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
      filtered = filtered.filter(i => new Date(i.date) >= cutoff);
    }
    
    if (incidentTypes.length > 0) {
      filtered = filtered.filter(i => incidentTypes.includes(i.type));
    }
    
    if (severities.length > 0) {
      filtered = filtered.filter(i => severities.includes(i.severity));
    }
    
    if (departments.length > 0) {
      filtered = filtered.filter(i => departments.includes(i.department));
    }
    
    return filtered;
  }, [incidents, timeRange, incidentTypes, severities, departments]);
  
  // Heatmap data
  const heatmapData = useMemo(() => {
    return calculateHeatmapData(filteredIncidents, 10);
  }, [filteredIncidents]);
  
  // Statistics
  const stats = useMemo(() => {
    const total = filteredIncidents.length;
    const critical = filteredIncidents.filter(i => i.severity === 'critical').length;
    const open = filteredIncidents.filter(i => i.status !== 'closed').length;
    const topLocation = [...heatmapData].sort((a, b) => b.count - a.count)[0];
    const newToday = filteredIncidents.filter(i => i.isNew || new Date(i.date).toDateString() === new Date().toDateString()).length;
    
    return { total, critical, open, topLocation, newToday };
  }, [filteredIncidents, heatmapData]);
  
  // Toggle filter
  const toggleFilter = (
    value: string,
    current: string[],
    setter: React.Dispatch<React.SetStateAction<string[]>>
  ) => {
    if (current.includes(value)) {
      setter(current.filter(v => v !== value));
    } else {
      setter([...current, value]);
    }
  };
  
  // Clear all filters
  const clearFilters = () => {
    setIncidentTypes([]);
    setSeverities([]);
    setDepartments([]);
    setTimeRange('30d');
  };
  
  // Format time ago
  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };
  
  // Badge utilities
  const getTypeBadge = (type: string) => {
    const badges: Record<string, { bg: string; text: string; icon: React.ReactNode }> = {
      'injury': { bg: 'bg-danger/10', text: 'text-danger', icon: <AlertTriangle className="w-3 h-3" /> },
      'near-miss': { bg: 'bg-warning/10', text: 'text-warning', icon: <Eye className="w-3 h-3" /> },
      'property-damage': { bg: 'bg-accent/10', text: 'text-accent', icon: <Target className="w-3 h-3" /> },
      'environmental': { bg: 'bg-success/10', text: 'text-success', icon: <Layers className="w-3 h-3" /> },
      'fire': { bg: 'bg-warning/10', text: 'text-warning', icon: <Flame className="w-3 h-3" /> },
      'vehicle': { bg: 'bg-accent/10', text: 'text-accent', icon: <Activity className="w-3 h-3" /> },
    };
    return badges[type] || { bg: 'bg-surface-sunken', text: 'text-text-muted', icon: null };
  };
  
  const getSeverityBadge = (severity: string) => {
    const badges: Record<string, { bg: string; text: string; dot: string }> = {
      'critical': { bg: 'bg-danger/10', text: 'text-danger', dot: 'bg-danger' },
      'high': { bg: 'bg-warning/10', text: 'text-warning', dot: 'bg-warning' },
      'medium': { bg: 'bg-warning/5', text: 'text-warning', dot: 'bg-warning' },
      'low': { bg: 'bg-success/10', text: 'text-success', dot: 'bg-success' },
    };
    return badges[severity] || { bg: 'bg-surface-sunken', text: 'text-text-muted', dot: 'bg-surface-border' };
  };
  
  const getEventIcon = (type: RealTimeEvent['type']) => {
    switch (type) {
      case 'new_incident': return <AlertTriangle className="w-4 h-4 text-danger" />;
      case 'status_update': return <RefreshCw className="w-4 h-4 text-accent" />;
      case 'severity_change': return <TrendingUp className="w-4 h-4 text-warning" />;
      default: return <Info className="w-4 h-4 text-text-muted" />;
    }
  };

  return (
    <div className="page-wrapper">

      
      {/* Header */}
      <header className="bg-surface-raised/80 backdrop-blur-xl border-b border-surface-border sticky top-[var(--nav-height)] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <SMButton
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                leftIcon={<ArrowLeft className="w-5 h-5" />}
              />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="page-title">Incident Heatmap</h1>
                  {/* Live Indicator */}
                  {isLiveEnabled && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-2 py-0.5 bg-danger/10 rounded-full"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                        className="w-2 h-2 bg-danger rounded-full"
                      />
                      <span className="text-xs font-medium text-danger">LIVE</span>
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-text-muted">Real-time incident tracking</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {/* Connection Status */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
                connectionStatus === 'connected' ? 'bg-success/10 text-success' :
                connectionStatus === 'reconnecting' ? 'bg-warning/10 text-warning' :
                'bg-danger/10 text-danger'
              }`}>
                {connectionStatus === 'connected' ? <Wifi className="w-3.5 h-3.5" /> : 
                 connectionStatus === 'reconnecting' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> :
                 <WifiOff className="w-3.5 h-3.5" />}
                {connectionStatus === 'connected' ? 'Live' : connectionStatus === 'reconnecting' ? 'Reconnecting...' : 'Disconnected'}
              </div>
              
              {/* Sound Toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-xl transition-all ${
                  soundEnabled ? 'bg-accent/10 text-accent' : 'bg-surface-sunken text-text-muted'
                }`}
                title={soundEnabled ? 'Sound alerts on' : 'Sound alerts off'}
              >
                {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
              
              {/* Live Toggle */}
              <button
                onClick={() => setIsLiveEnabled(!isLiveEnabled)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${
                  isLiveEnabled ? 'bg-danger/10 text-danger' : 'bg-surface-sunken text-text-muted'
                }`}
              >
                <Radio className={`w-4 h-4 ${isLiveEnabled ? 'animate-pulse' : ''}`} />
                <span className="text-sm font-medium">{isLiveEnabled ? 'Live On' : 'Live Off'}</span>
              </button>
              
              {/* View Toggle */}
              <div className="flex items-center bg-surface-sunken rounded-xl p-1">
                <button
                  onClick={() => setViewMode('heatmap')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'heatmap'
                      ? 'bg-surface-raised text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Heatmap
                </button>
                <button
                  onClick={() => setViewMode('dots')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${
                    viewMode === 'dots'
                      ? 'bg-surface-raised text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Markers
                </button>
              </div>
              
              {/* Filter Button */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  showFilters || incidentTypes.length > 0 || severities.length > 0 || departments.length > 0
                    ? 'bg-accent text-text-onAccent'
                    : 'bg-surface-sunken text-text-primary hover:bg-surface-overlay'
                }`}
              >
                <Filter className="w-4 h-4" />
                <span className="text-sm font-medium">Filters</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      {/* Stats Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl">
                <Activity className="w-5 h-5 text-accent" />
              </div>
              <div>
                <motion.p
                  key={stats.total}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-2xl font-bold text-text-primary"
                >
                  {stats.total}
                </motion.p>
                <p className="text-xs text-text-muted">Total Incidents</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger/10 rounded-xl">
                <AlertTriangle className="w-5 h-5 text-danger" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.critical}</p>
                <p className="text-xs text-text-muted">Critical</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-warning/10 rounded-xl">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-text-primary">{stats.open}</p>
                <p className="text-xs text-text-muted">Open Cases</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success/10 rounded-xl">
                <Zap className="w-5 h-5 text-success" />
              </div>
              <div>
                <motion.p
                  key={stats.newToday}
                  initial={{ scale: 1.2, color: 'var(--success)' }}
                  animate={{ scale: 1, color: 'var(--text-primary)' }}
                  className="text-2xl font-bold"
                >
                  {stats.newToday}
                </motion.p>
                <p className="text-xs text-text-muted">New Today</p>
              </div>
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-surface-raised rounded-2xl p-4 border border-surface-border shadow-sm"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-accent/10 rounded-xl">
                <MapPin className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary truncate">
                  {stats.topLocation ? `${stats.topLocation.count} inc.` : '-'}
                </p>
                <p className="text-xs text-text-muted">Hottest Zone</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Filter Panel */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
              <div className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-text-primary">Filter Incidents</h3>
                  <button
                    onClick={clearFilters}
                    className="text-sm text-accent hover:opacity-80 font-medium"
                  >
                    Clear All
                  </button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* Time Range */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      Time Range
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { value: '7d', label: '7 Days' },
                        { value: '30d', label: '30 Days' },
                        { value: '90d', label: '90 Days' },
                        { value: 'year', label: '1 Year' },
                        { value: 'all', label: 'All Time' },
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setTimeRange(option.value as any)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            timeRange === option.value
                              ? 'bg-accent text-text-onAccent'
                              : 'bg-surface-sunken text-text-muted hover:bg-surface-overlay'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Incident Types */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      <AlertTriangle className="w-4 h-4 inline mr-1" />
                      Incident Type
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allTypes.map(type => {
                        const badge = getTypeBadge(type);
                        return (
                          <button
                            key={type}
                            onClick={() => toggleFilter(type, incidentTypes, setIncidentTypes)}
                            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              incidentTypes.includes(type)
                                ? 'bg-accent text-text-onAccent'
                                : `${badge.bg} ${badge.text}`
                            }`}
                          >
                            {badge.icon}
                            {type.replace('-', ' ')}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Severity */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Severity
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allSeverities.map(sev => {
                        const badge = getSeverityBadge(sev);
                        return (
                          <button
                            key={sev}
                            onClick={() => toggleFilter(sev, severities, setSeverities)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                              severities.includes(sev)
                                ? 'bg-accent text-text-onAccent'
                                : `${badge.bg} ${badge.text}`
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${severities.includes(sev) ? 'bg-white' : badge.dot}`} />
                            {sev}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  
                  {/* Department */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">
                      <Building2 className="w-4 h-4 inline mr-1" />
                      Department
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {allDepartments.map(dept => (
                        <button
                          key={dept}
                          onClick={() => toggleFilter(dept, departments, setDepartments)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                            departments.includes(dept)
                              ? 'bg-accent text-text-onAccent'
                              : 'bg-surface-sunken text-text-muted hover:bg-surface-overlay'
                          }`}
                        >
                          {dept}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Heatmap Area */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm overflow-hidden"
            >
              {/* Map Header */}
              <div className="p-4 border-b border-surface-border flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-text-primary">Facility Map</h3>
                  <span className="text-xs text-text-muted ml-2">
                    Last update: {formatTimeAgo(lastUpdate)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLiveFeed(!showLiveFeed)}
                    className={`text-sm px-3 py-1 rounded-lg transition-all ${
                      showLiveFeed ? 'bg-accent/10 text-accent' : 'bg-surface-sunken text-text-muted'
                    }`}
                  >
                    {showLiveFeed ? 'Hide' : 'Show'} Feed
                  </button>
                  <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="text-sm text-text-muted hover:text-text-primary flex items-center gap-1"
                  >
                    <Info className="w-4 h-4" />
                    Legend
                  </button>
                </div>
              </div>
              
              {/* Interactive Map */}
              <div className="relative bg-surface-sunken aspect-[4/3]">
                {/* Grid Background */}
                <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                  <defs>
                    <pattern id="grid" width="10%" height="10%" patternUnits="userSpaceOnUse">
                      <path d="M 100 0 L 0 0 0 100" fill="none" stroke="var(--surface-border)" strokeWidth="0.5" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
                
                {/* Facility Zones Labels */}
                <div className="absolute inset-0 pointer-events-none">
                  <span className="absolute top-[20%] left-[10%] text-xs font-medium text-text-muted bg-surface-raised/70 px-2 py-1 rounded">
                    Warehouse A
                  </span>
                  <span className="absolute top-[35%] left-[15%] text-xs font-medium text-text-muted bg-surface-raised/70 px-2 py-1 rounded">
                    Warehouse B
                  </span>
                  <span className="absolute top-[40%] left-[42%] text-xs font-medium text-text-muted bg-surface-raised/70 px-2 py-1 rounded">
                    Manufacturing
                  </span>
                  <span className="absolute top-[15%] left-[70%] text-xs font-medium text-text-muted bg-surface-raised/70 px-2 py-1 rounded">
                    Laboratory
                  </span>
                  <span className="absolute top-[55%] left-[75%] text-xs font-medium text-text-muted bg-surface-raised/70 px-2 py-1 rounded">
                    Office
                  </span>
                  <span className="absolute top-[62%] left-[25%] text-xs font-medium text-text-muted bg-surface-raised/70 px-2 py-1 rounded">
                    Maintenance
                  </span>
                </div>
                
                {/* Heatmap Visualization */}
                {viewMode === 'heatmap' && heatmapData.map((cell, idx) => (
                  <motion.div
                    key={`${cell.x}-${cell.y}`}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: idx * 0.03 }}
                    className="absolute cursor-pointer transition-transform hover:scale-110"
                    style={{
                      left: `${cell.x}%`,
                      top: `${cell.y}%`,
                      width: '10%',
                      height: '13.33%',
                      background: `radial-gradient(circle at center, ${getHeatColor(cell.intensity)} 0%, transparent 70%)`,
                    }}
                    onClick={() => setSelectedCell(cell)}
                  >
                    {cell.count > 0 && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <motion.span
                          key={cell.count}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className="bg-surface-raised/90 text-xs font-bold text-text-primary w-6 h-6 rounded-full flex items-center justify-center shadow-sm"
                        >
                          {cell.count}
                        </motion.span>
                      </div>
                    )}
                  </motion.div>
                ))}
                
                {/* Dot Markers */}
                {viewMode === 'dots' && filteredIncidents.map((incident, idx) => {
                  const sevBadge = getSeverityBadge(incident.severity);
                  return (
                    <motion.div
                      key={incident.id}
                      initial={incident.isNew ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: incident.isNew ? 0 : idx * 0.02 }}
                      className="absolute cursor-pointer"
                      style={{
                        left: `${incident.coordinates.x}%`,
                        top: `${incident.coordinates.y}%`,
                        transform: 'translate(-50%, -50%)',
                      }}
                      onClick={() => setSelectedIncident(incident)}
                    >
                      <div className={`relative w-4 h-4 rounded-full ${sevBadge.dot} ring-2 ring-surface-raised shadow-lg hover:scale-150 transition-transform`}>
                        {/* New incident pulse */}
                        {incident.isNew && (
                          <motion.div
                            animate={{ scale: [1, 2, 1], opacity: [0.8, 0, 0.8] }}
                            transition={{ duration: 1.5, repeat: Infinity }}
                            className={`absolute inset-0 rounded-full ${sevBadge.dot}`}
                          />
                        )}
                        {incident.status !== 'closed' && !incident.isNew && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-accent rounded-full animate-pulse" />
                        )}
                      </div>
                    </motion.div>
                  );
                })}
                
                {/* Legend Overlay */}
                <AnimatePresence>
                  {showLegend && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      className="absolute bottom-4 right-4 bg-surface-raised/95 backdrop-blur rounded-xl shadow-lg p-4 min-w-[180px] border border-surface-border"
                    >
                      <h4 className="text-xs font-semibold text-text-primary mb-3">
                        {viewMode === 'heatmap' ? 'Intensity' : 'Severity'}
                      </h4>
                      {viewMode === 'heatmap' ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded" style={{ background: 'rgba(220, 38, 38, 0.6)' }} />
                            <span className="text-xs text-text-muted">Critical (5+)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded" style={{ background: 'rgba(249, 115, 22, 0.5)' }} />
                            <span className="text-xs text-text-muted">High (3-4)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded" style={{ background: 'rgba(234, 179, 8, 0.4)' }} />
                            <span className="text-xs text-text-muted">Medium (2)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-4 h-4 rounded" style={{ background: 'rgba(59, 130, 246, 0.2)' }} />
                            <span className="text-xs text-text-muted">Low (1)</span>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {allSeverities.map(sev => {
                            const badge = getSeverityBadge(sev);
                            return (
                              <div key={sev} className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${badge.dot}`} />
                                <span className="text-xs text-text-muted capitalize">{sev}</span>
                              </div>
                            );
                          })}
                          <div className="flex items-center gap-2 pt-2 border-t border-surface-border mt-2">
                            <motion.span
                              animate={{ scale: [1, 1.3, 1] }}
                              transition={{ duration: 1, repeat: Infinity }}
                              className="w-3 h-3 rounded-full bg-danger"
                            />
                            <span className="text-xs text-text-muted">New incident</span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
          
          {/* Live Feed Sidebar */}
          <div className="lg:col-span-1">
            <AnimatePresence>
              {showLiveFeed && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm overflow-hidden h-fit max-h-[600px] flex flex-col"
                >
                  <div className="p-4 border-b border-surface-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Radio className="w-5 h-5 text-danger animate-pulse" />
                      <h3 className="font-semibold text-text-primary">Live Feed</h3>
                    </div>
                    <span className="text-xs text-text-muted">{liveEvents.length} events</span>
                  </div>
                  
                  <div className="overflow-y-auto flex-1">
                    {liveEvents.length === 0 ? (
                      <div className="p-6 text-center">
                        <Radio className="w-10 h-10 text-text-muted mx-auto mb-3" />
                        <p className="text-sm text-text-muted">Waiting for live events...</p>
                        <p className="text-xs text-text-muted mt-1">Events will appear here in real-time</p>
                      </div>
                    ) : (
                      liveEvents.map((event, idx) => (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, x: -20, backgroundColor: event.type === 'new_incident' ? 'rgba(220,38,38,0.07)' : 'transparent' }}
                          animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                          transition={{ delay: idx === 0 ? 0 : 0.05 }}
                          className="p-3 border-b border-surface-border hover:bg-surface-sunken cursor-pointer transition-colors"
                          onClick={() => {
                            if (event.type === 'new_incident' && event.data) {
                              setSelectedIncident(event.data as IncidentLocation);
                            }
                          }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="mt-0.5">
                              {getEventIcon(event.type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-text-primary">{event.message}</p>
                              {event.data && event.type === 'new_incident' && (
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className={`px-1.5 py-0.5 text-xs rounded ${getSeverityBadge(event.data.severity || 'low').bg} ${getSeverityBadge(event.data.severity || 'low').text}`}>
                                    {event.data.severity}
                                  </span>
                                  <span className="text-xs text-text-muted">{event.data.location}</span>
                                </div>
                              )}
                              <p className="text-xs text-text-muted mt-1">
                                {formatTimeAgo(event.timestamp)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Recent Incidents List (when feed is hidden) */}
            {!showLiveFeed && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-surface-raised rounded-2xl border border-surface-border shadow-sm overflow-hidden h-fit max-h-[600px] flex flex-col"
              >
                <div className="p-4 border-b border-surface-border">
                  <h3 className="font-semibold text-text-primary flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-warning" />
                    Recent Incidents
                  </h3>
                  <p className="text-xs text-text-muted mt-1">
                    {filteredIncidents.length} in range
                  </p>
                </div>
                
                <div className="overflow-y-auto flex-1">
                  {filteredIncidents.slice(0, 10).map((incident, idx) => {
                    const typeBadge = getTypeBadge(incident.type);
                    const sevBadge = getSeverityBadge(incident.severity);
                    return (
                      <motion.div
                        key={incident.id}
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.05 }}
                        className={`p-4 border-b border-surface-border hover:bg-surface-sunken cursor-pointer transition-colors ${
                          incident.isNew ? 'bg-success/5' : ''
                        } ${selectedIncident?.id === incident.id ? 'bg-accent/5' : ''}`}
                        onClick={() => setSelectedIncident(incident)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`w-2 h-2 rounded-full ${sevBadge.dot}`} />
                              <span className="text-xs font-medium text-text-muted">
                                {incident.id}
                              </span>
                              {incident.isNew && (
                                <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded animate-pulse">
                                  NEW
                                </span>
                              )}
                              {incident.status !== 'closed' && !incident.isNew && (
                                <span className="text-xs bg-accent/10 text-accent px-1.5 py-0.5 rounded">
                                  {incident.status}
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-medium text-text-primary truncate">
                              {incident.title}
                            </h4>
                            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {incident.location}
                            </p>
                          </div>
                          <span className={`flex items-center gap-1 px-2 py-1 text-xs rounded-lg ${typeBadge.bg} ${typeBadge.text}`}>
                            {typeBadge.icon}
                          </span>
                        </div>
                        <p className="text-xs text-text-muted mt-2">
                          {incident.reportedBy} • {new Date(incident.date).toLocaleDateString()}
                        </p>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </main>
      
      {/* Cell Detail Modal */}
      <AnimatePresence>
        {selectedCell && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedCell(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised rounded-2xl shadow-2xl max-w-lg w-full max-h-[80vh] overflow-hidden border border-surface-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-text-primary">Zone Details</h3>
                    <p className="text-sm text-text-muted">
                      {selectedCell.count} incident{selectedCell.count !== 1 ? 's' : ''} in this area
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedCell(null)}
                    className="p-2 hover:bg-surface-sunken rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                <div className="space-y-4">
                  {selectedCell.incidents.map(incident => {
                    const sevBadge = getSeverityBadge(incident.severity);
                    return (
                      <div
                        key={incident.id}
                        className={`p-4 bg-surface-sunken rounded-xl ${incident.isNew ? 'ring-2 ring-success' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-text-muted">{incident.id}</span>
                              {incident.isNew && (
                                <span className="text-xs bg-success/10 text-success px-1.5 py-0.5 rounded">
                                  NEW
                                </span>
                              )}
                            </div>
                            <h4 className="font-medium text-text-primary">{incident.title}</h4>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-lg ${sevBadge.bg} ${sevBadge.text}`}>
                            {incident.severity}
                          </span>
                        </div>
                        <p className="text-sm text-text-primary mb-2">{incident.description}</p>
                        <div className="flex items-center gap-4 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {incident.location}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(incident.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Incident Detail Modal */}
      <AnimatePresence>
        {selectedIncident && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedIncident(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised rounded-2xl shadow-2xl max-w-md w-full border border-surface-border"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-muted">{selectedIncident.id}</span>
                      {selectedIncident.isNew && (
                        <motion.span
                          animate={{ scale: [1, 1.1, 1] }}
                          transition={{ duration: 0.5, repeat: 3 }}
                          className="text-xs bg-success/10 text-success px-2 py-0.5 rounded font-medium"
                        >
                          NEW INCIDENT
                        </motion.span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-text-primary">{selectedIncident.title}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedIncident(null)}
                    className="p-2 hover:bg-surface-sunken rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex gap-2 flex-wrap">
                  <span className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg ${getTypeBadge(selectedIncident.type).bg} ${getTypeBadge(selectedIncident.type).text}`}>
                    {getTypeBadge(selectedIncident.type).icon}
                    {selectedIncident.type.replace('-', ' ')}
                  </span>
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg ${getSeverityBadge(selectedIncident.severity).bg} ${getSeverityBadge(selectedIncident.severity).text}`}>
                    <span className={`w-2 h-2 rounded-full ${getSeverityBadge(selectedIncident.severity).dot}`} />
                    {selectedIncident.severity}
                  </span>
                  <span className={`px-3 py-1.5 text-sm rounded-lg ${
                    selectedIncident.status === 'closed' ? 'bg-success/10 text-success' :
                    selectedIncident.status === 'investigating' ? 'bg-accent/10 text-accent' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {selectedIncident.status}
                  </span>
                </div>
                
                <p className="text-text-primary">{selectedIncident.description}</p>
                
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-surface-border">
                  <div>
                    <p className="text-xs text-text-muted mb-1">Location</p>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      {selectedIncident.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Department</p>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <Building2 className="w-4 h-4 text-text-muted" />
                      {selectedIncident.department}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Reported By</p>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <Users className="w-4 h-4 text-text-muted" />
                      {selectedIncident.reportedBy || 'Unknown'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted mb-1">Date</p>
                    <p className="text-sm font-medium text-text-primary flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-text-muted" />
                      {new Date(selectedIncident.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                
                <button
                  onClick={() => navigate('/report-incident')}
                  className="w-full mt-4 py-3 bg-accent text-text-onAccent font-medium rounded-xl hover:opacity-90 transition-colors"
                >
                  View Full Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
