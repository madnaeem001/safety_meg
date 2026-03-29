import React from 'react';
import { CompanyHeader } from '../components/safety/CompanyHeader';
import { HierarchyOfControls, HierarchyControlItem } from '../components/safety/HierarchyOfControls';
import { ISOControlsChecklist, ISOChecklistItem } from '../components/safety/ISOControlsChecklist';
import { PhotoUpload } from '../components/safety/PhotoUpload';
import { motion } from 'framer-motion';
import { Brain, FileText, CheckCircle2, AlertTriangle, Activity, Database } from 'lucide-react';
import { useSafetyProcedures } from '../api/hooks/useAPIHooks';

const DEFAULT_COMPANY_NAME = 'Safety Procedures';

const SectionEmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="rounded-[2rem] border border-dashed border-surface-border bg-surface-overlay p-8 text-center">
    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-sunken text-text-muted">
      <Database className="h-5 w-5" />
    </div>
    <h3 className="text-lg font-bold text-text-primary">{title}</h3>
    <p className="mx-auto mt-2 max-w-lg text-sm text-text-muted">{description}</p>
  </div>
);

export const SafetyProcedures: React.FC = () => {
  const { data: backendProcedures } = useSafetyProcedures();
  const procedures = React.useMemo(() => backendProcedures ?? [], [backendProcedures]);

  const totalProcedures = procedures.length;
  const activeProcedures = procedures.filter((procedure: any) => procedure.status === 'active' || procedure.status === 'Active').length;
  const updatesNeeded = procedures.filter((procedure: any) => procedure.status === 'review' || procedure.status === 'Under Review').length;
  const complianceScore = totalProcedures > 0 ? Math.round((activeProcedures / totalProcedures) * 100) : 0;

  const companyName = React.useMemo(() => {
    const departments = Array.from(new Set(procedures.map((procedure: any) => procedure.department).filter(Boolean)));
    return departments.length > 0 ? `${departments[0]} Safety Procedures` : DEFAULT_COMPANY_NAME;
  }, [procedures]);

  const hierarchyControls = React.useMemo<HierarchyControlItem[]>(() => {
    const categoryConfig: Array<{ id: string; title: string; match: string[]; description: string }> = [
      {
        id: 'elimination',
        title: 'Elimination',
        match: ['confined-space', 'fire'],
        description: 'Backend procedures that remove or isolate high-consequence work before exposure occurs.',
      },
      {
        id: 'substitution',
        title: 'Substitution',
        match: ['chemical', 'electrical'],
        description: 'Procedure categories that replace hazardous materials or energy sources with safer alternatives and controls.',
      },
      {
        id: 'engineering',
        title: 'Engineering Controls',
        match: ['maintenance', 'operational'],
        description: 'Steps that rely on equipment isolation, guarding, ventilation, or engineered barriers captured in backend procedures.',
      },
      {
        id: 'administrative',
        title: 'Administrative Controls',
        match: ['general', 'emergency'],
        description: 'Training, sequencing, and documented work instructions derived from live safety procedure records.',
      },
      {
        id: 'ppe',
        title: 'Personal Protective Equipment (PPE)',
        match: ['ppe'],
        description: 'Procedure requirements that protect the worker when higher-level controls are not sufficient on their own.',
      },
    ];

    return categoryConfig.map((config) => {
      const matching = procedures.filter((procedure: any) => config.match.includes(procedure.category));
      const parseJsonField = (val: any): any[] => {
        if (Array.isArray(val)) return val;
        if (typeof val === 'string') { try { const p = JSON.parse(val); return Array.isArray(p) ? p : []; } catch { return []; } }
        return [];
      };
      const examples = matching.flatMap((procedure: any) => [
        procedure.title,
        ...parseJsonField(procedure.steps).slice(0, 2).map((step: any) => step.title ?? step),
        ...parseJsonField(procedure.ppe).slice(0, 1),
      ]).filter(Boolean);

      return {
        id: config.id,
        title: config.title,
        description: config.description,
        examples: Array.from(new Set(examples)).slice(0, 4),
      };
    }).filter((item) => item.examples.length > 0);
  }, [procedures]);

  const isoControls = React.useMemo<ISOChecklistItem[]>(() => {
    const clauseMap = new Map<string, { title: string; descriptions: string[] }>();

    procedures.forEach((procedure: any) => {
      (procedure.regulations ?? []).forEach((regulation: string, index: number) => {
        const clause = regulation.trim();
        if (!clause) {
          return;
        }

        const current = clauseMap.get(clause) ?? { title: clause, descriptions: [] };
        current.descriptions.push(procedure.description || procedure.title);
        clauseMap.set(clause, current);
      });
    });

    return Array.from(clauseMap.entries()).map(([clause, value], index) => ({
      id: `iso-${clause}-${index}`,
      clause,
      title: value.title,
      description: Array.from(new Set(value.descriptions)).slice(0, 2).join(' '),
    }));
  }, [procedures]);

  const recentReviewLabel = React.useMemo(() => {
    const reviewDates = procedures
      .map((procedure: any) => procedure.reviewDate || procedure.effectiveDate)
      .filter(Boolean)
      .sort()
      .reverse();

    return reviewDates[0] ?? 'No review date';
  }, [procedures]);

  const hasProcedureData = procedures.length > 0;

  return (
    <div className="page-wrapper">

      
      <main className="max-w-7xl mx-auto">
        <div className="px-4 py-8 space-y-12">
          <CompanyHeader companyName={companyName} />

          {!hasProcedureData && (
            <SectionEmptyState
              title="No backend safety procedures are available"
              description="SafetyProcedures now depends on live backend procedure records for procedure counts, control examples, and ISO checklist coverage."
            />
          )}

          {/* AI Safety Procedure Analysis */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-accent to-ai rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-surface-overlay/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-text-onAccent" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-text-onAccent">AI Procedure Analyzer</h3>
                <p className="text-text-onAccent/70 text-xs">Real-time compliance monitoring across all procedures</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Procedures Active', value: String(activeProcedures), icon: FileText },
                { label: 'AI Compliance Score', value: `${complianceScore}%`, icon: CheckCircle2 },
                { label: 'Updates Needed', value: String(updatesNeeded), icon: AlertTriangle },
                { label: 'Last Review Date', value: recentReviewLabel, icon: Activity },
              ].map((s, i) => (
                <div key={i} className="bg-surface-overlay/20 rounded-xl p-3 border border-surface-border/20">
                  <p className="text-xl font-black text-text-onAccent">{s.value}</p>
                  <p className="text-[9px] text-text-onAccent/70 uppercase tracking-wider">{s.label}</p>
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
              {hierarchyControls.length > 0 ? (
                <HierarchyOfControls controls={hierarchyControls} />
              ) : (
                <SectionEmptyState
                  title="No backend control examples are available"
                  description="Hierarchy of Controls examples are now derived from live procedure categories, steps, and PPE requirements."
                />
              )}
            </section>
            
            <section>
              {isoControls.length > 0 ? (
                <ISOControlsChecklist controls={isoControls} />
              ) : (
                <SectionEmptyState
                  title="No backend ISO mapping is available"
                  description="The ISO 45001 checklist now reflects regulations and clause references found on backend safety procedure records."
                />
              )}
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
