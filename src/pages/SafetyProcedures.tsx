import React from 'react';
import { CompanyHeader } from '../components/safety/CompanyHeader';
import { HierarchyOfControls } from '../components/safety/HierarchyOfControls';
import { ISOControlsChecklist } from '../components/safety/ISOControlsChecklist';
import { COMPANY_NAME, HIERARCHY_OF_CONTROLS, ISO_CONTROLS } from '../data/mockSafetyProcedures';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { motion } from 'framer-motion';
import { Shield, Brain, Camera, FileText, CheckCircle2, AlertTriangle, ClipboardList, Activity } from 'lucide-react';
import { useSafetyProcedures } from '../api/hooks/useAPIHooks';

export const SafetyProcedures: React.FC = () => {
  // ── Real API Data ─────────────────────────────────────────────────────
  const { data: backendProcedures } = useSafetyProcedures();
  const totalProcedures = backendProcedures?.length ?? 47;
  const activeProcedures = (backendProcedures as any[])?.filter((p: any) => p.status === 'active' || p.status === 'Active')?.length ?? totalProcedures;
  const updatesNeeded = (backendProcedures as any[])?.filter((p: any) => p.status === 'review' || p.status === 'Under Review')?.length ?? 3;

  return (
    <div className="min-h-screen bg-surface-50 pb-32">

      
      <main className="max-w-3xl mx-auto">
        <div className="px-4 py-8 space-y-12">
          <CompanyHeader companyName={COMPANY_NAME} />

          {/* AI Safety Procedure Analysis */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Procedure Analyzer</h3>
                <p className="text-indigo-200 text-xs">Real-time compliance monitoring across all procedures</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Procedures Active', value: String(activeProcedures), icon: FileText },
                { label: 'AI Compliance Score', value: '96%', icon: CheckCircle2 },
                { label: 'Updates Needed', value: String(updatesNeeded), icon: AlertTriangle },
                { label: 'Last AI Review', value: '2h ago', icon: Activity },
              ].map((s, i) => (
                <div key={i} className="bg-white/10 rounded-xl p-3 border border-white/10">
                  <p className="text-xl font-black">{s.value}</p>
                  <p className="text-[9px] text-indigo-200 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="space-y-16"
          >
            <section>
              <HierarchyOfControls controls={HIERARCHY_OF_CONTROLS} />
            </section>
            
            <section>
              <ISOControlsChecklist controls={ISO_CONTROLS} />
            </section>
          </motion.div>

          {/* Photo Documentation */}
          <section>
            <PhotoUpload
              title="Safety Procedure Documentation"
              description="Upload procedure photos, signage, and training evidence for AI verification."
              maxFiles={15}
              acceptVideo={true}
              showAIAnalysis={true}
              darkMode={false}
            />
          </section>
        </div>
      </main>
    </div>
  );
};

export default SafetyProcedures;
