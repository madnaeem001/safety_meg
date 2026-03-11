import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Activity,
  Thermometer,
  Wind,
  Droplets,
  Volume2,
  Flame,
  Zap,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Info,
  Settings,
  RefreshCw,
  Maximize2,
  Layers,
  History,
  Database,
  Wifi,
  WifiOff,
  BarChart3,
  TrendingUp,
  Map as MapIcon,
  Cpu,
  Radio,
  Bell,
  Brain,
  Sparkles
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { mockSensors, facilityZones, type IoTSensor } from '../data/mockSensor';
import { useSensors, useSensorReadings } from '../api/hooks/useAPIHooks';

/* ================================================================
   IOT SENSOR DASHBOARD (HD)
   A premium command center for real-time IoT sensor monitoring,
   data visualization, and predictive safety analytics.
   ================================================================ */

const sensorIcons = {
  temperature: Thermometer,
  gas: Wind,
  humidity: Droplets,
  noise: Volume2,
  flame: Flame,
  motion: Activity,
};

const sensorColors = {
  temperature: 'from-orange-500 to-red-500',
  gas: 'from-blue-500 to-cyan-500',
  humidity: 'from-emerald-500 to-teal-500',
  noise: 'from-purple-500 to-indigo-500',
  flame: 'from-rose-500 to-pink-500',
  motion: 'from-amber-500 to-yellow-500',
};

// Simulated real-time data generator
const generateChartData = () => {
  return Array.from({ length: 20 }, (_, i) => ({
    time: `${i}:00`,
    value: Math.floor(Math.random() * 30) + 20,
    threshold: 45
  }));
};

export const IoTSensorDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [selectedSensor, setSelectedSensor] = useState<IoTSensor | null>(null);
  const [activeZone, setActiveZone] = useState('all');
  const [isLive, setIsLive] = useState(true);

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: backendSensors } = useSensors();
  const { data: sensorReadings } = useSensorReadings({ limit: 100 });

  // Backend-first sensor list; fall back to mock when backend is empty
  const sensors = useMemo<IoTSensor[]>(() => {
    if (backendSensors && backendSensors.length > 0) {
      const converted: IoTSensor[] = backendSensors.map((s: any) => ({
        id: s.sensorId || String(s.id),
        name: s.name,
        type: s.sensorType || 'temperature',
        zone: s.zone || 'Zone A',
        location: s.location || 'Unknown',
        status: s.status === 'active' ? 'online' : s.status === 'inactive' ? 'offline' : 'warning',
        value: sensorReadings?.find((r: any) => r.sensorId === s.sensorId)?.value ?? 0,
        unit: s.unit || '°C',
        threshold: s.maxThreshold || 50,
        lastUpdated: new Date().toISOString(),
        battery: 100,
        signal: 100,
        readings: [],
      }));
      // Merge: backend sensors override mock sensors with same id
      const backendIds = new Set(converted.map(c => c.id));
      return [...converted, ...mockSensors.filter((m: IoTSensor) => !backendIds.has(m.id))];
    }
    return mockSensors;
  }, [backendSensors, sensorReadings]);
  const [chartData, setChartData] = useState(generateChartData());

  // Update live chart data (sensor values come from backend, only chart animation is local)
  useEffect(() => {
    let interval: any;
    if (isLive) {
      interval = setInterval(() => {
        setChartData(prev => {
          const newData = [...prev.slice(1), {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            value: Math.floor(Math.random() * 30) + 20,
            threshold: 45
          }];
          return newData;
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isLive]);

  const filteredSensors = useMemo(() => {
    return activeZone === 'all' ? sensors : sensors.filter(s => s.zone === activeZone);
  }, [sensors, activeZone]);

  const stats = useMemo(() => {
    return {
      total: sensors.length,
      warning: sensors.filter(s => s.status === 'warning').length,
      critical: sensors.filter(s => s.status === 'critical').length,
      online: sensors.length // Simulated
    };
  }, [sensors]);

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-20 selection:bg-brand-500/30">
      {/* HD Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-900/60 backdrop-blur-2xl border-b border-surface-800 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate('/')}
                className="p-2.5 hover:bg-surface-800 rounded-2xl text-surface-400 transition-all group"
              >
                <ArrowLeft className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <Radio className="w-7 h-7 text-white animate-pulse" />
                </div>
                <div>
                  <h1 className="text-xl font-black text-white tracking-tight">IoT Sensor Network</h1>
                  <p className="text-[11px] text-surface-400 uppercase tracking-widest font-bold">Real-time Environmental Intelligence</p>
                </div>
              </div>
            </div>

            <div className="hidden lg:flex items-center gap-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-surface-800/50 rounded-xl border border-surface-700/50">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-surface-300 uppercase tracking-wider">{stats.online} Sensors Online</span>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsLive(!isLive)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    isLive ? 'bg-brand-500 border-brand-400 text-white' : 'bg-surface-800 border-surface-700 text-surface-400'
                  }`}
                >
                  {isLive ? 'Live Stream' : 'Paused'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-8 relative z-10">
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'Network Health', value: '99.8%', icon: Wifi, color: 'text-emerald-400', trend: 'Stable' },
            { label: 'Active Alerts', value: stats.warning + stats.critical, icon: Bell, color: 'text-amber-400', trend: 'High Priority' },
            { label: 'Data Throughput', value: '1.2 GB/s', icon: Database, color: 'text-blue-400', trend: '+12%' },
            { label: 'Predictive Score', value: '94/100', icon: Brain, color: 'text-purple-400', trend: 'Excellent' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-900/40 backdrop-blur-md border border-surface-800 rounded-3xl p-6 hover:border-brand-500/30 transition-all"
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-2xl bg-surface-800 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <span className="text-[10px] font-black text-surface-500 uppercase tracking-widest bg-surface-800 px-2 py-1 rounded-lg">
                  {stat.trend}
                </span>
              </div>
              <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-white">{stat.value}</h3>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Sensor Map & List */}
          <div className="lg:col-span-2 space-y-8">
            {/* Facility Map Visualization */}
            <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=2000')] bg-cover bg-center opacity-5" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-white">Facility Sensor Map</h3>
                  <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {facilityZones.map(zone => (
                      <button
                        key={zone.id}
                        onClick={() => setActiveZone(zone.id)}
                        className={`px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap border ${
                          activeZone === zone.id ? 'bg-brand-500 border-brand-400 text-white' : 'bg-surface-800/50 border-surface-700/50 text-surface-400 hover:text-white'
                        }`}
                      >
                        {zone.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="aspect-[21/9] bg-surface-800/50 rounded-3xl border border-surface-700/50 relative overflow-hidden">
                  {/* Simulated Map Grid */}
                  <div className="absolute inset-0 opacity-10" style={{ 
                    backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                  }} />
                  
                  {filteredSensors.map((sensor, i) => {
                    const Icon = sensorIcons[sensor.type];
                    return (
                      <motion.button
                        key={sensor.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.5 + i * 0.05 }}
                        onClick={() => setSelectedSensor(sensor)}
                        className={`absolute group/sensor transition-all ${
                          selectedSensor?.id === sensor.id ? 'z-30 scale-125' : 'z-20'
                        }`}
                        style={{ left: `${sensor.x}%`, top: `${sensor.y}%` }}
                      >
                        <div className={`w-10 h-10 rounded-xl border-2 border-white shadow-xl flex items-center justify-center transition-all ${
                          sensor.status === 'critical' ? 'bg-red-500 animate-pulse' : 
                          sensor.status === 'warning' ? 'bg-amber-500' : 'bg-brand-500'
                        }`}>
                          <Icon className="w-5 h-5 text-white" />
                        </div>
                        
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 opacity-0 group-hover/sensor:opacity-100 transition-opacity pointer-events-none">
                          <div className="bg-surface-900 border border-surface-700 p-3 rounded-2xl shadow-2xl whitespace-nowrap">
                            <p className="text-[10px] font-black text-brand-400 uppercase tracking-widest mb-1">{sensor.id}</p>
                            <p className="text-xs font-bold text-white mb-1">{sensor.name}</p>
                            <p className="text-lg font-black text-white">{sensor.value.toFixed(1)}{sensor.unit}</p>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Real-time Data Chart */}
            <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-400">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Live Telemetry</h3>
                    <p className="text-sm text-surface-500">Real-time data stream from {selectedSensor?.name || 'Network'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">Current Value</p>
                    <p className="text-2xl font-black text-brand-400">
                      {selectedSensor ? `${selectedSensor.value.toFixed(1)}${selectedSensor.unit}` : '---'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                    <XAxis 
                      dataKey="time" 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <YAxis 
                      stroke="#64748b" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '12px' }}
                      itemStyle={{ color: '#14b8a6', fontWeight: 'bold' }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="value" 
                      stroke="#14b8a6" 
                      strokeWidth={3}
                      fillOpacity={1} 
                      fill="url(#colorValue)" 
                      animationDuration={1000}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="threshold" 
                      stroke="#ef4444" 
                      strokeDasharray="5 5" 
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Right Column: Sensor List & Details */}
          <div className="space-y-8">
            <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md h-full flex flex-col">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-bold text-white">Sensor List</h3>
                <button className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 transition-all">
                  <Settings className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                {filteredSensors.map((sensor) => {
                  const Icon = sensorIcons[sensor.type];
                  const colorClass = sensorColors[sensor.type];
                  return (
                    <button
                      key={sensor.id}
                      onClick={() => setSelectedSensor(sensor)}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl transition-all border ${
                        selectedSensor?.id === sensor.id 
                          ? 'bg-brand-500/10 border-brand-500/50 ring-1 ring-brand-500/20' 
                          : 'bg-surface-800/30 border-transparent hover:bg-surface-800/50'
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClass} flex items-center justify-center shadow-lg shrink-0`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left min-w-0">
                        <p className="text-sm font-bold text-white truncate">{sensor.name}</p>
                        <p className="text-[10px] text-surface-500 uppercase tracking-widest">{sensor.location}</p>
                      </div>
                      <div className="ml-auto text-right">
                        <p className="text-sm font-black text-white">{sensor.value.toFixed(1)}{sensor.unit}</p>
                        <div className={`w-2 h-2 rounded-full ml-auto mt-1 ${
                          sensor.status === 'critical' ? 'bg-red-500' : 
                          sensor.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                        }`} />
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Predictive Insight Card */}
              <div className="mt-8 p-6 bg-violet-500/10 rounded-3xl border border-violet-500/20 relative overflow-hidden group">
                <Sparkles className="absolute -right-2 -bottom-2 w-16 h-16 text-violet-500/10 group-hover:scale-110 transition-transform" />
                <div className="flex items-center gap-3 mb-3">
                  <Brain className="w-5 h-5 text-violet-400" />
                  <h4 className="text-sm font-bold text-white uppercase tracking-widest">AI Prediction</h4>
                </div>
                <p className="text-xs text-surface-400 leading-relaxed">
                  Sensor S004 shows a 15% deviation from baseline. Maintenance recommended within 48 hours to prevent downtime.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default IoTSensorDashboard;
