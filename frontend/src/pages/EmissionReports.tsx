import React, { useState, useMemo } from 'react';
import { EmissionTypeCard, EmissionCardData } from '../components/safety/risk-digester/emissions/EmissionTypeCard';
import { EmissionHistoryTable } from '../components/safety/risk-digester/emissions/EmissionHistoryTable';
import { FacilityBreakdownChart } from '../components/safety/risk-digester/emissions/FacilityBreakdownChart';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { motion } from 'framer-motion';
import { Wind, ArrowLeft, Calendar, Filter, Brain, Activity, Leaf, TrendingDown, AlertTriangle, CheckCircle2, BarChart3, Factory, Database } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useEmissionsData } from '../api/hooks/useAPIHooks';

const SectionEmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-[2rem] border border-dashed border-surface-200 bg-white p-8 text-center shadow-soft">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-100 text-surface-400">
      <Database className="h-5 w-5" />
    </div>
    <h3 className="text-lg font-bold text-brand-900">{title}</h3>
    <p className="mx-auto mt-2 max-w-lg text-sm text-surface-500">{description}</p>
  </div>
);

export const EmissionReports: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'compliance' | 'ai-forecast'>('overview');

  const { data: backendEmissions } = useEmissionsData();

  const detailedEmissions = useMemo<EmissionCardData[]>(() => {
    return (backendEmissions?.detailedEmissions ?? []).map((emission) => ({
      id: String(emission.id),
      type: emission.type,
      unit: emission.unit,
      actual: emission.actual,
      limit: emission.limit,
      status: emission.status,
      trend: emission.trend,
    }));
  }, [backendEmissions]);

  const summaryCards = useMemo(() => {
    const summary = backendEmissions?.summary;
    const totalStatuses = (summary?.compliantCount ?? 0) + (summary?.warningCount ?? 0) + (summary?.exceededCount ?? 0);
    const complianceRate = totalStatuses > 0
      ? Math.round(((summary?.compliantCount ?? 0) / totalStatuses) * 100)
      : 0;

    return [
      {
        label: 'Compliance Rate',
        value: `${complianceRate}%`,
        detail: `${summary?.compliantCount ?? 0} compliant sources`,
        icon: CheckCircle2,
      },
      {
        label: 'Gas Readings',
        value: `${summary?.totalGasReadings ?? 0}`,
        detail: `Captured for ${backendEmissions?.year ?? 'current year'}`,
        icon: Activity,
      },
      {
        label: 'Anomalies',
        value: `${summary?.totalAnomalies ?? 0}`,
        detail: 'Backend sensor anomalies detected',
        icon: AlertTriangle,
      },
      {
        label: 'Environmental Incidents',
        value: `${backendEmissions?.environmentalIncidents ?? 0}`,
        detail: 'Incident records matched to emission terms',
        icon: Factory,
      },
    ];
  }, [backendEmissions]);

  const complianceCards = useMemo(() => {
    const summary = backendEmissions?.summary;
    const topZone = [...(backendEmissions?.anomaliesByZone ?? [])].sort((left, right) => (right.anomalies ?? 0) - (left.anomalies ?? 0))[0];
    const topFacility = backendEmissions?.facilityBreakdown?.[0];
    const totalStatuses = (summary?.compliantCount ?? 0) + (summary?.warningCount ?? 0) + (summary?.exceededCount ?? 0);
    const monitoredSources = backendEmissions?.gasSensorReadings?.length ?? 0;
    const networkHealth = totalStatuses > 0
      ? Math.round(((summary?.compliantCount ?? 0) / totalStatuses) * 100)
      : 0;

    return [
      {
        title: 'Emission Limits',
        status: (summary?.exceededCount ?? 0) > 0 ? 'Action Required' : (summary?.warningCount ?? 0) > 0 ? 'Monitor Closely' : 'Compliant',
        detail: `${summary?.exceededCount ?? 0} exceeded and ${summary?.warningCount ?? 0} warning sources are currently flagged.`,
      },
      {
        title: 'Sensor Coverage',
        status: monitoredSources > 0 ? 'Active Monitoring' : 'No Coverage',
        detail: `${monitoredSources} gas sensors contributed readings to the current report year.`,
      },
      {
        title: 'Hotspot Zone',
        status: topZone?.zone ? topZone.zone : 'No Zone Data',
        detail: topZone?.zone
          ? `${topZone.anomalies ?? 0} anomalies across ${topZone.readings ?? 0} readings (${topZone.anomalyRate ?? 0}% anomaly rate).`
          : 'No zone-level anomaly data is available from backend monitoring records.',
      },
      {
        title: 'Top Facility Load',
        status: topFacility?.name ? topFacility.name : 'No Facility Data',
        detail: topFacility?.name
          ? `${topFacility.value} total measured units are currently attributed to this location.`
          : 'Facility totals will appear when backend gas readings are available.',
      },
      {
        title: 'Environmental Incident Linkage',
        status: (backendEmissions?.environmentalIncidents ?? 0) > 0 ? 'Review Required' : 'No Incidents',
        detail: `${backendEmissions?.environmentalIncidents ?? 0} incident records matched environmental spill, leak, or emission conditions.`,
      },
      {
        title: 'Network Health',
        status: networkHealth >= 90 ? 'Healthy' : networkHealth >= 75 ? 'Stable' : 'Under Pressure',
        detail: `${networkHealth}% of monitored emission sources are currently in compliant status.`,
      },
    ];
  }, [backendEmissions]);

  const forecastMetrics = useMemo(() => {
    const summary = backendEmissions?.summary;
    const topZone = [...(backendEmissions?.anomaliesByZone ?? [])].sort((left, right) => (right.anomalies ?? 0) - (left.anomalies ?? 0))[0];
    const riskRatio = (summary?.totalGasReadings ?? 0) > 0
      ? Math.round(((summary?.totalAnomalies ?? 0) / (summary?.totalGasReadings ?? 1)) * 1000) / 10
      : 0;
    const exceeded = summary?.exceededCount ?? 0;
    const warning = summary?.warningCount ?? 0;

    return [
      {
        label: 'Projected Alert Pressure',
        value: `${riskRatio}%`,
        trend: exceeded > 0 ? 'Elevated anomaly ratio' : 'Within expected range',
        color: exceeded > 0 ? 'amber' : 'green',
      },
      {
        label: 'Highest Priority Zone',
        value: topZone?.zone ?? 'None',
        trend: topZone?.zone ? `${topZone.anomalies ?? 0} anomalies detected` : 'No anomaly zones detected',
        color: topZone?.anomalies ? 'amber' : 'green',
      },
      {
        label: 'Exceedance Risk',
        value: `${exceeded}`,
        trend: exceeded > 0 ? 'Sensors over configured threshold' : 'No exceeded sources',
        color: exceeded > 0 ? 'amber' : 'green',
      },
      {
        label: 'Watchlist Sources',
        value: `${warning}`,
        trend: warning > 0 ? 'Near-threshold sensors to inspect' : 'No near-threshold sources',
        color: warning > 0 ? 'cyan' : 'green',
      },
    ];
  }, [backendEmissions]);

  const recommendations = useMemo(() => {
    const topSensors = [...(backendEmissions?.gasSensorReadings ?? [])]
      .sort((left, right) => (right.anomalies ?? 0) - (left.anomalies ?? 0))
      .slice(0, 3);

    return topSensors.map((sensor, index) => ({
      title: `${sensor.name} anomaly review`,
      description: `${sensor.readings} readings were captured in ${sensor.zone ?? sensor.location ?? 'the monitored area'}, with ${sensor.anomalies} marked anomalous and an average value of ${sensor.avgValue} ${sensor.unit}.`,
      impact: `${sensor.anomalies} anomalies`,
      confidence: Math.min(98, 70 + (sensor.anomalies ?? 0) * 5 + index * 2),
    }));
  }, [backendEmissions]);

  const insightStats = useMemo(() => {
    const summary = backendEmissions?.summary;
    const totalStatuses = (summary?.compliantCount ?? 0) + (summary?.warningCount ?? 0) + (summary?.exceededCount ?? 0);
    const complianceScore = totalStatuses > 0
      ? Math.round(((summary?.compliantCount ?? 0) / totalStatuses) * 100)
      : 0;

    return [
      { label: 'Emission Reduction Focus', value: `${(summary?.warningCount ?? 0) + (summary?.exceededCount ?? 0)}`, icon: TrendingDown },
      { label: 'Carbon Hotspots', value: `${backendEmissions?.facilityBreakdown?.length ?? 0}`, icon: Leaf },
      { label: 'AI Priorities', value: `${recommendations.length}`, icon: Brain },
      { label: 'Compliance Score', value: `${complianceScore}%`, icon: Activity },
    ];
  }, [backendEmissions, recommendations.length]);

  const hasEmissionData = detailedEmissions.length > 0 || (backendEmissions?.logs?.length ?? 0) > 0 || (backendEmissions?.facilityBreakdown?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-surface-50 pb-32 text-left">

      
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <button 
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-brand-600 font-bold text-[10px] uppercase tracking-[0.3em] mb-4 hover:text-brand-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Risk Digester
            </button>
            <div className="flex items-center gap-3 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <Wind className="w-4 h-4" />
              Environmental Compliance
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-brand-900 tracking-tighter leading-none text-left">Emission Reports</h1>
            <p className="text-surface-500 mt-4 max-w-xl text-lg text-left">
              Detailed analysis of atmospheric pollutants and greenhouse gas emissions across all facilities.
            </p>
          </motion.div>
          
          <div className="flex gap-3">
            <button className="flex items-center gap-2 px-6 py-4 bg-white border border-surface-100 rounded-2xl shadow-soft hover:bg-surface-50 transition-all text-xs font-bold uppercase tracking-widest text-surface-600">
              <Calendar className="w-4 h-4" />
              Last 30 Days
            </button>
            <button className="flex items-center gap-2 px-6 py-4 bg-white border border-surface-100 rounded-2xl shadow-soft hover:bg-surface-50 transition-all text-xs font-bold uppercase tracking-widest text-surface-600">
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex gap-2 bg-surface-100/50 p-1 rounded-2xl w-fit">
          {[
            { id: 'overview' as const, label: 'Overview', icon: BarChart3 },
            { id: 'compliance' as const, label: 'Compliance Status', icon: CheckCircle2 },
            { id: 'ai-forecast' as const, label: 'AI Forecast', icon: Brain },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white shadow-soft text-brand-700' : 'text-surface-500 hover:text-brand-600'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {!hasEmissionData && (
          <SectionEmptyState
            title="No backend emission data is currently available"
            description="Emission Reports now depends on backend gas sensor readings, anomaly summaries, and incident linkage data. Add monitored readings to populate this dashboard."
          />
        )}

        {activeTab === 'overview' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {summaryCards.map((card, index) => (
                <motion.div
                  key={card.label}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.08 }}
                  className="rounded-[2rem] border border-surface-100 bg-white p-6 shadow-soft"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div className="rounded-2xl bg-brand-50 p-3 text-brand-600">
                      <card.icon className="h-5 w-5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-surface-400">Live</span>
                  </div>
                  <p className="text-sm font-semibold text-surface-500">{card.label}</p>
                  <p className="mt-2 text-3xl font-bold tracking-tight text-brand-900">{card.value}</p>
                  <p className="mt-2 text-xs text-surface-500">{card.detail}</p>
                </motion.div>
              ))}
            </div>

            {/* Emission Type Grid */}
            {detailedEmissions.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {detailedEmissions.map((emission, index) => (
                  <EmissionTypeCard key={emission.id} emission={emission} delay={index * 0.1} />
                ))}
              </div>
            ) : (
              <SectionEmptyState
                title="No monitored emission sources are available"
                description="Detailed emission cards will appear once backend gas sensor readings are present for the selected reporting year."
              />
            )}

            {/* Detailed Analysis Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2">
                <EmissionHistoryTable logs={backendEmissions?.logs} />
              </div>
              <div className="lg:col-span-1">
                <FacilityBreakdownChart facilityData={backendEmissions?.facilityBreakdown} />
              </div>
            </div>
          </>
        )}

        {activeTab === 'compliance' && (
          <div className="space-y-6">
            {complianceCards.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {complianceCards.map((card, index) => (
                  <motion.div
                    key={card.title}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <h4 className="font-bold text-brand-900 text-sm">{card.title}</h4>
                      <span className="rounded-lg bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700">{card.status}</span>
                    </div>
                    <p className="text-sm text-surface-600">{card.detail}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <SectionEmptyState
                title="No backend compliance summary is available"
                description="Compliance status cards are now derived from live sensor counts, anomaly rates, facility totals, and environmental incident linkage."
              />
            )}
          </div>
        )}

        {activeTab === 'ai-forecast' && (
          <div className="space-y-6">
            {/* AI Forecast Dashboard */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white border border-cyan-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Emission Forecasting Engine</h3>
                  <p className="text-cyan-300 text-xs font-mono">BACKEND ANOMALY SYNTHESIS • LIVE SENSOR SIGNALS • CURRENT PERIOD OUTLOOK</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {forecastMetrics.map((metric, index) => (
                  <div key={metric.label} className="bg-white/5 rounded-xl p-4 border border-white/10">
                    <p className="text-xs text-cyan-300 mb-1">{metric.label}</p>
                    <p className="text-xl font-black">{metric.value}</p>
                    <p className={`text-[10px] font-mono mt-1 ${metric.color === 'green' ? 'text-green-400' : metric.color === 'amber' ? 'text-amber-300' : 'text-cyan-400'}`}>{metric.trend}</p>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {recommendations.length > 0 ? recommendations.map((rec, i) => (
                  <motion.div key={rec.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }} className="bg-white/10 rounded-2xl p-4 border border-white/10">
                    <h4 className="font-bold text-sm mb-2">{rec.title}</h4>
                    <p className="text-cyan-200 text-xs mb-3">{rec.description}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] text-green-400 font-bold">{rec.impact}</span>
                      <span className="text-[10px] text-cyan-300 font-mono">Confidence: {rec.confidence}%</span>
                    </div>
                  </motion.div>
                )) : (
                  <SectionEmptyState
                    title="No forecast recommendations are available"
                    description="AI forecast recommendations are now synthesized from backend anomaly, facility, and gas sensor readings when available."
                  />
                )}
              </div>
            </div>
          </div>
        )}

        {/* AI Environmental Analysis */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <Brain className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">AI Emission Predictor</h3>
              <p className="text-emerald-200 text-xs">Machine learning models analyzing emission trends and forecasting compliance</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {insightStats.map((s, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-3 border border-white/10">
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[9px] text-emerald-200 uppercase tracking-wider">{s.label}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Emission Photo Documentation */}
        <PhotoUpload
          title="Environmental Monitoring Photos"
          description="Upload emission monitoring photos, stack test images, and environmental compliance evidence."
          maxFiles={15}
          acceptVideo={true}
          showAIAnalysis={true}
          darkMode={false}
        />
      </main>
    </div>
  );
};

export default EmissionReports;
