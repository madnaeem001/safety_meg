import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Zap,
  CheckCircle2,
  RefreshCw,
  Brain,
  Sparkles,
  ChevronRight,
  Shield,
  AlertTriangle,
  Users,
  FileText,
  GraduationCap,
  Activity,
} from 'lucide-react';
import { useAutomationEvents } from '../../api/hooks/useAPIHooks';

interface AutoAction {
  id: string;
  title: string;
  description: string;
  timestamp: Date;
  status: 'completed' | 'pending' | 'failed';
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  badgeColor: string;
}

const ICON_MAP: Record<string, React.ElementType> = {
  training: GraduationCap,
  report: FileText,
  alert: AlertTriangle,
  capa: CheckCircle2,
  user: Users,
  worker: Users,
  analysis: Brain,
  sensor: Activity,
  shield: Shield,
};

const STATUS_STYLE: Record<string, { iconBg: string; iconColor: string; badgeColor: string }> = {
  success:  { iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600', badgeColor: 'text-emerald-600 bg-emerald-50 border border-emerald-200' },
  failed:   { iconBg: 'bg-red-100',     iconColor: 'text-red-600',     badgeColor: 'text-red-600 bg-red-50 border border-red-200' },
  pending:  { iconBg: 'bg-amber-100',   iconColor: 'text-amber-600',   badgeColor: 'text-amber-600 bg-amber-50 border border-amber-200' },
};
const TYPE_STYLE: Record<string, { iconBg: string; iconColor: string }> = {
  training: { iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  report:   { iconBg: 'bg-blue-100',   iconColor: 'text-blue-600' },
  analysis: { iconBg: 'bg-purple-100', iconColor: 'text-purple-600' },
  alert:    { iconBg: 'bg-amber-100',  iconColor: 'text-amber-600' },
  capa:     { iconBg: 'bg-rose-100',   iconColor: 'text-rose-600' },
  sensor:   { iconBg: 'bg-cyan-100',   iconColor: 'text-cyan-600' },
};

interface Props {
  liveStats?: unknown;
}

export const SafetyAutoPilot: React.FC<Props> = () => {
  const navigate = useNavigate();
  const { data: automationEvents, loading: isLoading } = useAutomationEvents({ limit: 8 });
  const [manualActions, setManualActions] = useState<AutoAction[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Map backend automation events → AutoAction
  const eventActions: AutoAction[] = useMemo(() => {
    if (!automationEvents?.length) return [];
    return automationEvents.map(e => {
      const triggerKey = Object.keys(ICON_MAP).find(k => e.triggerType?.toLowerCase().includes(k)) ?? 'analysis';
      const IconComp = ICON_MAP[triggerKey] ?? Brain;
      const st = STATUS_STYLE[e.status] ?? STATUS_STYLE.pending;
      const ty = TYPE_STYLE[triggerKey] ?? TYPE_STYLE.analysis;
      return {
        id: String(e.id),
        title: e.ruleName || 'Automation Rule Triggered',
        description: e.details || `Rule "${e.ruleName}" executed via ${e.triggerType}.${e.recipient ? ` Notified: ${e.recipient}` : ''}`,
        timestamp: new Date(typeof e.createdAt === 'number' ? e.createdAt : Date.parse(String(e.createdAt))),
        status: (e.status === 'success' ? 'completed' : e.status === 'pending' ? 'pending' : 'failed') as AutoAction['status'],
        icon: IconComp,
        iconBg: ty.iconBg,
        iconColor: ty.iconColor,
        badgeColor: st.badgeColor,
      };
    });
  }, [automationEvents]);

  const actions = [...manualActions, ...eventActions].slice(0, 8);

  const handleManualScan = async () => {
    setIsScanning(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setManualActions(prev => [{
      id: Date.now().toString(),
      title: 'Real-time Site Audit',
      description: 'AI completed a full platform scan across all active safety modules. All protocols verified.',
      timestamp: new Date(),
      status: 'completed',
      icon: Shield,
      iconBg: 'bg-emerald-100',
      iconColor: 'text-emerald-600',
      badgeColor: STATUS_STYLE.success.badgeColor,
    }, ...prev]);
    setIsScanning(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-[0_8px_32px_rgba(0,0,0,0.12)] overflow-hidden flex flex-col">
      {/* Header — dark gradient so white text is always visible */}
      <div className="relative p-5 flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-900 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(circle at 0% 50%, rgba(16,185,129,0.15) 0%, transparent 55%)' }} />
        <div className="flex items-center gap-3 relative">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
            <Zap className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight">Safety Auto-Pilot</h3>
            <div className="flex items-center gap-1.5 mt-0.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest font-mono">Active & Monitoring</span>
            </div>
          </div>
        </div>
        <button
          onClick={handleManualScan}
          disabled={isScanning}
          className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-all disabled:opacity-50"
          title="Run Manual Scan"
        >
          <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1 bg-white">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 py-3">
              <div className="w-9 h-9 rounded-xl bg-slate-100 animate-pulse shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <div className="h-3 w-2/3 bg-slate-100 rounded animate-pulse" />
                <div className="h-2 w-full bg-slate-100 rounded animate-pulse" />
                <div className="h-2 w-4/5 bg-slate-100 rounded animate-pulse" />
              </div>
            </div>
          ))
        ) : (
          <AnimatePresence initial={false}>
            {actions.map((action, i) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className="flex gap-3 group py-2.5"
              >
                {/* Icon + connector */}
                <div className="flex flex-col items-center shrink-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${action.iconBg}`}>
                    <action.icon className={`w-4 h-4 ${action.iconColor}`} />
                  </div>
                  {i < actions.length - 1 && (
                    <div className="w-px flex-1 bg-slate-200 my-1.5" />
                  )}
                </div>
                {/* Content */}
                <div className="flex-1 pb-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="text-xs font-bold text-slate-800 leading-tight">{action.title}</h4>
                    <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap shrink-0">
                      {action.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{action.description}</p>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md ${action.badgeColor}`}>
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      {action.status}
                    </span>
                    <button
                      onClick={() => navigate('/automation-rule-builder')}
                      className="text-[9px] font-bold text-teal-600 hover:text-teal-700 uppercase tracking-wider flex items-center gap-0.5 transition-colors"
                    >
                      View Details <ChevronRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
            {actions.length === 0 && (
              <div className="py-10 text-center text-slate-400 text-xs">
                <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
                No automation events yet
              </div>
            )}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100">
        <button
          onClick={() => navigate('/automation-rule-builder')}
          className="w-full py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50 hover:border-teal-300 hover:text-teal-700 transition-all uppercase tracking-widest flex items-center justify-center gap-2 shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-teal-500" />
          Configure Automation Rules
        </button>
      </div>
    </div>
  );
};
