import React from 'react';
import { CombinedIncidentInjuryReport } from '../components/safety/CombinedIncidentInjuryReport';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { motion } from 'framer-motion';
import { Camera, Brain, Shield, Activity, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useIncidentStats } from '../api/hooks/useAPIHooks';

export const InjuryReport: React.FC = () => {
  const { data: incidentStats } = useIncidentStats();
  return (
    <div className="min-h-screen bg-gray-50 pb-20">

      <div className="pt-20 px-4 md:px-6 max-w-[1920px] mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">SafetyMEG Unified Reporting</h1>
          <p className="text-slate-500">Report incidents, injuries, and near misses in one place with AI assistance.</p>
        </div>

        {/* AI Analysis Summary */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'AI Reports Analyzed', value: incidentStats?.total ?? 1247, icon: Brain, color: 'text-purple-600 bg-purple-50' },
            { label: 'Patterns Detected', value: incidentStats?.distinctTypes ?? 23, icon: Activity, color: 'text-cyan-600 bg-cyan-50' },
            { label: 'Risk Level', value: incidentStats?.dominantSeverity ?? 'Medium', icon: Shield, color: 'text-amber-600 bg-amber-50' },
            { label: 'Auto-Classified', value: '94%', icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-surface-100 shadow-sm">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${stat.color}`}>
                <stat.icon className="w-4 h-4" />
              </div>
              <p className="text-xl font-black text-slate-900">{stat.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>

        <CombinedIncidentInjuryReport />

        {/* Photo Evidence Section */}
        <div className="mt-8">
          <PhotoUpload
            title="Injury Photo Evidence"
            description="Upload injury photos for AI analysis, body mapping, and OSHA documentation."
            maxFiles={20}
            acceptVideo={true}
            showAIAnalysis={true}
            darkMode={false}
          />
        </div>
      </div>
    </div>
  );
};
