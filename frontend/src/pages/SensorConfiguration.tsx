import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft,
  Settings,
  Thermometer,
  Wind,
  Droplets,
  Volume2,
  Flame,
  Activity,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  Info,
  Sliders
} from 'lucide-react';
import { 
  sensorThresholdDefaults, 
  type IoTSensor,
  type SensorThresholdConfig
} from '../data/mockSensor';
import { useSensors, useUpdateSensor } from '../api/hooks/useAPIHooks';

const sensorIcons = {
  temperature: Thermometer,
  gas: Wind,
  humidity: Droplets,
  noise: Volume2,
  flame: Flame,
  motion: Activity,
};

interface ThresholdEdit {
  sensorId: string;
  minThreshold: number;
  maxThreshold: number;
  warningPercent: number;
}

export const SensorConfiguration: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [editMode, setEditMode] = useState<'individual' | 'type'>('individual');
  const [thresholdEdits, setThresholdEdits] = useState<Record<string, ThresholdEdit>>({});
  const [typeEdits, setTypeEdits] = useState<Record<string, SensorThresholdConfig>>({});
  const [saved, setSaved] = useState(false);

  // ── Real backend sensor data ──────────────────────────────────────────
  const { data: backendSensors, refetch: refetchSensors } = useSensors();
  const updateSensor = useUpdateSensor();

  // Merge backend sensors with mock (fallback to mock if backend empty)
  const sensors: IoTSensor[] = React.useMemo(() => {
    if (backendSensors && backendSensors.length > 0) {
      return backendSensors.map((s: any) => ({
        id: String(s.sensorId || s.id),
        name: s.name,
        type: (s.sensorType as IoTSensor['type']) || 'temperature',
        location: s.location || s.zone || 'Unknown',
        zone: s.zone || 'Zone A',
        status: (s.status as IoTSensor['status']) || 'active',
        currentValue: 0,
        unit: s.unit || '°F',
        minThreshold: s.minThreshold ?? 32,
        maxThreshold: s.maxThreshold ?? 120,
        battery: 100,
        signal: 100,
        lastReading: Date.now(),
      }));
    }
    return [];
  }, [backendSensors]);

  const getThresholdDefault = (type: IoTSensor['type']) => {
    return sensorThresholdDefaults.find(t => t.sensorType === type);
  };

  const handleSensorThresholdChange = (sensorId: string, field: 'minThreshold' | 'maxThreshold', value: number) => {
    const sensor = sensors.find(s => s.id === sensorId);
    if (!sensor) return;

    setThresholdEdits(prev => ({
      ...prev,
      [sensorId]: {
        sensorId,
        minThreshold: field === 'minThreshold' ? value : (prev[sensorId]?.minThreshold ?? sensor.minThreshold),
        maxThreshold: field === 'maxThreshold' ? value : (prev[sensorId]?.maxThreshold ?? sensor.maxThreshold),
        warningPercent: prev[sensorId]?.warningPercent ?? 85,
      }
    }));
  };

  const handleTypeThresholdChange = (type: IoTSensor['type'], field: 'defaultMin' | 'defaultMax' | 'warningPercent', value: number) => {
    const defaults = getThresholdDefault(type);
    if (!defaults) return;

    setTypeEdits(prev => ({
      ...prev,
      [type]: {
        ...defaults,
        ...prev[type],
        [field]: value,
      }
    }));
  };

  const resetToDefaults = (sensorId: string) => {
    const sensor = sensors.find(s => s.id === sensorId);
    if (!sensor) return;

    const defaults = getThresholdDefault(sensor.type);
    if (defaults) {
      setThresholdEdits(prev => ({
        ...prev,
        [sensorId]: {
          sensorId,
          minThreshold: defaults.defaultMin,
          maxThreshold: defaults.defaultMax,
          warningPercent: defaults.warningPercent,
        }
      }));
    }
  };

  const applyTypeChanges = (type: IoTSensor['type']) => {
    const typeConfig = typeEdits[type];
    if (!typeConfig) return;
    // no-op for local state since sensors come from backend
  };

  const handleSave = async () => {
    // Persist each edited sensor threshold to backend
    const updates = Object.entries(thresholdEdits).map(([sensorId, edit]) =>
      updateSensor.mutate({
        sensorId,
        data: { minThreshold: edit.minThreshold, maxThreshold: edit.maxThreshold },
      })
    );
    await Promise.all(updates);
    setThresholdEdits({});
    setTypeEdits({});
    await refetchSensors();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const hasChanges = Object.keys(thresholdEdits).length > 0 || Object.keys(typeEdits).length > 0;

  return (
    <div className="min-h-screen bg-surface-base pb-20">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-overlay/80 backdrop-blur-xl border-b border-surface-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-overlay rounded-full transition-colors">
              <ArrowLeft className="w-6 h-6 text-text-secondary" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-text-primary flex items-center gap-2">
                <Sliders className="w-6 h-6 text-accent" />
                Sensor Configuration
              </h1>
              <p className="text-sm text-text-muted">Configure thresholds and alerts</p>
            </div>
          </div>
          <button 
            onClick={handleSave}
            disabled={!hasChanges}
            className={`px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
              hasChanges 
                ? 'bg-accent text-text-onAccent hover:bg-accent/80' 
                : 'bg-surface-sunken text-text-muted cursor-not-allowed'
            }`}
          >
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </header>

      {/* Success Message */}
      <AnimatePresence>
        {saved && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-success text-text-onAccent px-6 py-3 rounded-2xl shadow-lg flex items-center gap-2"
          >
            <CheckCircle2 className="w-5 h-5" />
            Configuration saved successfully
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Mode Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setEditMode('individual')}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              editMode === 'individual' 
                ? 'bg-accent text-text-onAccent shadow-lg' 
                : 'bg-surface-raised text-text-secondary border border-surface-border'
            }`}
          >
            Individual Sensors
          </button>
          <button
            onClick={() => setEditMode('type')}
            className={`px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
              editMode === 'type' 
                ? 'bg-accent text-text-onAccent shadow-lg' 
                : 'bg-surface-raised text-text-secondary border border-surface-border'
            }`}
          >
            By Sensor Type
          </button>
        </div>

        {/* Individual Sensor Configuration */}
        {editMode === 'individual' && (
          <div className="space-y-4">
            {sensors.map(sensor => {
              const Icon = sensorIcons[sensor.type];
              const defaults = getThresholdDefault(sensor.type);
              const edit = thresholdEdits[sensor.id];
              const currentMin = edit?.minThreshold ?? sensor.minThreshold;
              const currentMax = edit?.maxThreshold ?? sensor.maxThreshold;
              const hasEdit = !!edit;

              return (
                <motion.div
                  key={sensor.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`bg-surface-raised p-6 rounded-3xl border shadow-soft transition-all ${
                    hasEdit ? 'border-accent/40 ring-2 ring-accent/20' : 'border-surface-border'
                  }`}
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex items-center gap-4">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                        sensor.status === 'critical' ? 'bg-danger/10 text-danger' :
                        sensor.status === 'warning' ? 'bg-warning/10 text-warning' :
                        'bg-success/10 text-success'
                      }`}>
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary">{sensor.name}</h3>
                        <p className="text-sm text-text-muted">{sensor.location} • {sensor.id}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg font-bold text-text-primary">{sensor.value}{sensor.unit}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${
                            sensor.status === 'critical' ? 'bg-danger/10 text-danger' :
                            sensor.status === 'warning' ? 'bg-warning/10 text-warning' :
                            'bg-success/10 text-success'
                          }`}>
                            {sensor.status}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 max-w-md">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Min Threshold</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentMin}
                              onChange={(e) => handleSensorThresholdChange(sensor.id, 'minThreshold', parseFloat(e.target.value))}
                              className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl focus:ring-2 focus:ring-accent/20 outline-none"
                            />
                            <span className="text-sm text-text-muted">{sensor.unit}</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Max Threshold</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="number"
                              value={currentMax}
                              onChange={(e) => handleSensorThresholdChange(sensor.id, 'maxThreshold', parseFloat(e.target.value))}
                              className="w-full px-4 py-3 bg-surface-raised border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                            />
                            <span className="text-sm text-text-muted">{sensor.unit}</span>
                          </div>
                        </div>
                      </div>
                      {defaults && (
                        <div className="flex items-center justify-between mt-3">
                          <p className="text-xs text-text-muted">
                            Default: {defaults.defaultMin} - {defaults.defaultMax}{sensor.unit}
                            {defaults.regulatoryReference && ` (${defaults.regulatoryReference})`}
                          </p>
                          <button
                            onClick={() => resetToDefaults(sensor.id)}
                            className="text-xs text-accent font-bold hover:underline flex items-center gap-1"
                          >
                            <RotateCcw className="w-3 h-3" />
                            Reset
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Sensor Type Configuration */}
        {editMode === 'type' && (
          <div className="space-y-6">
            {sensorThresholdDefaults.map(config => {
              const Icon = sensorIcons[config.sensorType];
              const edit = typeEdits[config.sensorType];
              const currentConfig = edit || config;
              const sensorCount = sensors.filter(s => s.type === config.sensorType).length;

              return (
                <div
                  key={config.sensorType}
                  className="bg-surface-raised p-6 rounded-3xl border border-surface-border shadow-soft"
                >
                  <div className="flex items-start justify-between gap-6 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-accent/10 text-accent rounded-2xl flex items-center justify-center">
                        <Icon className="w-7 h-7" />
                      </div>
                      <div>
                        <h3 className="font-bold text-text-primary capitalize">{config.sensorType} Sensors</h3>
                        <p className="text-sm text-text-muted">{config.description}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 bg-surface-sunken text-text-secondary rounded text-xs font-bold">
                            {sensorCount} sensors
                          </span>
                          {config.regulatoryReference && (
                            <span className="px-2 py-0.5 bg-accent/10 text-accent rounded text-xs font-bold">
                              {config.regulatoryReference}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => applyTypeChanges(config.sensorType)}
                      disabled={!edit}
                      className={`px-4 py-2 rounded-xl font-bold text-sm transition-all ${
                        edit 
                          ? 'bg-accent text-text-onAccent hover:bg-accent/80' 
                          : 'bg-surface-sunken text-text-muted cursor-not-allowed'
                      }`}
                    >
                      Apply to All
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Min Threshold</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentConfig.defaultMin}
                          onChange={(e) => handleTypeThresholdChange(config.sensorType, 'defaultMin', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 bg-surface-raised border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                        <span className="text-sm text-text-muted">{config.unit}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Max Threshold</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentConfig.defaultMax}
                          onChange={(e) => handleTypeThresholdChange(config.sensorType, 'defaultMax', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 bg-surface-raised border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                        />
                        <span className="text-sm text-text-muted">{config.unit}</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-text-muted uppercase mb-1 block">Warning at %</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={currentConfig.warningPercent}
                          onChange={(e) => handleTypeThresholdChange(config.sensorType, 'warningPercent', parseFloat(e.target.value))}
                          className="w-full px-4 py-3 bg-surface-raised border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 outline-none"
                          min={50}
                          max={100}
                        />
                        <span className="text-sm text-text-muted">%</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-surface-sunken rounded-xl flex items-start gap-2">
                    <Info className="w-4 h-4 text-text-muted mt-0.5" />
                    <p className="text-xs text-text-muted">
                      Warning alerts trigger at {currentConfig.warningPercent}% of max threshold ({Math.round(currentConfig.defaultMax * currentConfig.warningPercent / 100)}{config.unit}).
                      Critical alerts trigger when value exceeds max threshold.
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Info Section */}
        <div className="bg-warning/10 border border-warning/20 p-6 rounded-3xl">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-warning mt-0.5" />
            <div>
              <h4 className="font-bold text-warning">Threshold Configuration Guidelines</h4>
              <ul className="mt-2 space-y-1 text-sm text-warning/80">
                <li>• Set thresholds based on regulatory requirements and site-specific conditions</li>
                <li>• Warning thresholds should provide adequate time for corrective action</li>
                <li>• Critical thresholds should trigger immediate response procedures</li>
                <li>• Review and update thresholds regularly based on operational experience</li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
