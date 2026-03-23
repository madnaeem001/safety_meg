import React, { useMemo } from 'react';
import { KPIWidget } from '../components/safety/risk-digester/KPIWidget';
import { EmissionsChart } from '../components/safety/risk-digester/EmissionsChart';
import { CAPATable } from '../components/safety/risk-digester/CAPATable';
import { StandardsReference } from '../components/safety/risk-digester/StandardsReference';
import { SafetyKPI } from '../data/mockRiskDigester';
import { motion } from 'framer-motion';
import { ShieldAlert, Activity, Wind, ClipboardList } from 'lucide-react';
import { useRiskStats, useKPIMetricsAnalytics } from '../api/hooks/useAPIHooks';

export const RiskDigester: React.FC = () => {
  // ── Real API Data ─────────────────────────────────────────────────────
  const { data: riskStats } = useRiskStats();
  const { data: kpiMetrics } = useKPIMetricsAnalytics();

  const safetyKPIs = useMemo<SafetyKPI[]>(() => {
    if (!kpiMetrics) return [];
    const raw = kpiMetrics as any;
    // Try extracting KPIs from various backend shapes
    if (Array.isArray(raw) && raw.length > 0) {
      const converted: SafetyKPI[] = raw.slice(0, 5).map((k: any) => ({
        label: k.label || k.name || k.kpiName || 'KPI',
        value: String(k.value ?? k.current ?? 0),
        unit: k.unit || '',
        change: k.change ?? k.trend ?? 0,
        trend: (k.changeDirection || (Number(k.change ?? 0) > 0 ? 'up' : Number(k.change ?? 0) < 0 ? 'down' : 'stable')) as 'up' | 'down' | 'stable',
        icon: k.icon || 'shield',
      }));
      return converted;
    }
    return [];
  }, [kpiMetrics]);

  const complianceScore = (riskStats as any)?.complianceRate ?? 98.2;
  const openViolations = (riskStats as any)?.openItems ?? (riskStats as any)?.critical ?? 0;

  return (
    <div className="min-h-screen bg-surface-base pb-32">

      
      <main className="max-w-7xl mx-auto px-6 py-12 space-y-12">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="flex items-center gap-2 text-accent font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <ShieldAlert className="w-4 h-4" />
              Risk Management Module
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary tracking-tighter leading-none">Risk Digester</h1>
            <p className="text-text-muted mt-4 max-w-xl text-lg">
              Comprehensive safety and environmental performance tracking aligned with ISO 14001, OSHA, EPA, and TCEQ standards.
            </p>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-primary text-text-inverted p-6 rounded-[2rem] shadow-glow flex items-center gap-6"
          >
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight">{typeof complianceScore === 'number' ? complianceScore.toFixed(1) : complianceScore}</div>
              <div className="text-[8px] font-bold text-text-inverted/70 uppercase tracking-widest">Compliance Score</div>
            </div>
            <div className="w-px h-10 bg-white/10" />
            <div className="text-center">
              <div className="text-2xl font-bold tracking-tight">{openViolations}</div>
              <div className="text-[8px] font-bold text-text-inverted/70 uppercase tracking-widest">Open Violations</div>
            </div>
          </motion.div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {safetyKPIs.map((kpi, index) => (
            <KPIWidget key={kpi.label} kpi={kpi} delay={index * 0.1} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <EmissionsChart />
          <CAPATable />
        </div>

        {/* Standards Section */}
        <StandardsReference />
      </main>
    </div>
  );
};

export default RiskDigester;
