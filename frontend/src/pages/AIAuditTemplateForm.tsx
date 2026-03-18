import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ClipboardCheck,
  Brain,
  Sparkles,
  Shield,
  Globe,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Save,
  Download,
  Printer,
  FileText,
  Search,
  Plus,
  X,
  Target,
  Activity,
  Lightbulb,
  Scale,
  Building2,
  Factory,
  HardHat,
  Stethoscope,
  Truck,
  Mountain,
  Camera,
  Video,
  Scan,
  Image,
  Wrench,
  Trash2,
  Copy,
  Upload
} from 'lucide-react';
import { downloadAuditReport, type AuditReportData, type AuditQuestionResult } from '../utils/exports/auditReportExport';
import {
  useAuditFormCustomTemplates,
  useSaveAuditCustomTemplateMutation,
  useSaveAuditFormSessionMutation,
  useAuditAnalysisMutation,
} from '../api/hooks/useAPIHooks';
import { SMButton } from '../components/ui';

/* ================================================================
   AI-EMBEDDED AUDIT TEMPLATE FORM
   A comprehensive form for ISO and OSHA standards with real-time
   AI assistance, risk scoring, and automated summaries.
   ================================================================ */

interface AuditQuestion {
  id: string;
  text: string;
  standard: string;
  clause?: string;
  category: string;
  aiHint?: string;
  riskWeight: number;
}

interface AuditTemplate {
  id: string;
  name: string;
  standard: 'ISO' | 'OSHA' | 'ASME' | 'API' | 'Multi-Standard' | 'Cal/OSHA' | 'BSEE' | 'ANSI' | 'NFPA' | 'EU' | 'MSHA' | 'IMO' | 'IATA' | 'WHO' | 'HACCP' | 'DOT' | 'CSA' | 'AS/NZS' | 'NEBOSH' | 'GCC' | 'Custom';
  version: string;
  description: string;
  categories: string[];
  questions: AuditQuestion[];
}

const AUDIT_TEMPLATES: AuditTemplate[] = [
  {
    id: 'safety-observation-checklist',
    name: 'Safety & Behavioral Observation Checklist',
    standard: 'Multi-Standard',
    version: '2026.1',
    description: 'A behavioral-based safety (BBS) checklist aligned with ISO 45001 Clause 8.1 and OSHA 1910 General Duty Clause.',
    categories: ['Personal Protective Equipment', 'Work Environment', 'Tools & Equipment', 'Behavioral Safety', 'Ergonomics'],
    questions: [
      { id: 's1', text: 'Are employees wearing all required PPE for their specific task?', standard: 'OSHA 1910.132', clause: '1910.132(a)', category: 'Personal Protective Equipment', aiHint: 'Observe head, eye, hand, and foot protection.', riskWeight: 10 },
      { id: 's2', text: 'Is the work area free of slip, trip, and fall hazards?', standard: 'OSHA 1910.22', clause: '1910.22(a)', category: 'Work Environment', aiHint: 'Check for spills, loose cables, and debris.', riskWeight: 8 },
      { id: 's3', text: 'Are tools and equipment being used correctly and for their intended purpose?', standard: 'ISO 45001', clause: '8.1.1', category: 'Tools & Equipment', aiHint: 'Look for modified tools or improper usage.', riskWeight: 7 },
      { id: 's4', text: 'Are employees following established safe work procedures (SOPs)?', standard: 'ISO 45001', clause: '8.1.2', category: 'Behavioral Safety', aiHint: 'Compare observed actions with documented SOPs.', riskWeight: 9 },
      { id: 's5', text: 'Are employees using proper lifting techniques and maintaining neutral postures?', standard: 'NIOSH / OSHA', clause: 'General Duty', category: 'Ergonomics', aiHint: 'Observe back positioning and load handling.', riskWeight: 6 },
      { id: 's6', text: 'Are employees communicating hazards to coworkers during task transitions?', standard: 'ISO 45001', clause: '7.4', category: 'Behavioral Safety', aiHint: 'Listen for verbal hazard communication during shift changes.', riskWeight: 7 },
      { id: 's7', text: 'Are housekeeping standards maintained in the work area (clean, organized, labeled)?', standard: 'OSHA 1910.22', clause: '1910.22(a)', category: 'Work Environment', aiHint: 'Look for 5S compliance and clear aisle markings.', riskWeight: 5 },
      { id: 's8', text: 'Are PPE condition checks performed before each use (e.g., no cracks in hard hat, glove integrity)?', standard: 'OSHA 1910.132', clause: '1910.132(e)', category: 'Personal Protective Equipment', aiHint: 'Inspect for damaged, worn-out, or expired PPE.', riskWeight: 8 },
      { id: 's9', text: 'Are workers positioned safely relative to moving equipment and overhead loads?', standard: 'OSHA 1926.1425', clause: 'General Duty', category: 'Behavioral Safety', aiHint: 'Check that line-of-fire awareness is maintained.', riskWeight: 9 },
      { id: 's10', text: 'Are emergency eyewash and shower stations accessible and tested weekly?', standard: 'ANSI Z358.1', clause: 'Z358.1-2014', category: 'Work Environment', aiHint: 'Test activation and verify signage visibility within 10-second travel.', riskWeight: 7 },
    ]
  },
  {
    id: 'iso-45001-audit',
    name: 'ISO 45001:2018 Internal Audit',
    standard: 'ISO',
    version: '2018',
    description: 'Comprehensive internal audit template for Occupational Health and Safety Management Systems.',
    categories: ['Context of Organization', 'Leadership', 'Planning', 'Support', 'Operation', 'Performance Evaluation', 'Improvement'],
    questions: [
      { id: 'q1', text: 'Has the organization determined internal and external issues relevant to its OH&S management system?', standard: 'ISO 45001', clause: '4.1', category: 'Context of Organization', aiHint: 'Look for SWOT analysis or risk registers.', riskWeight: 5 },
      { id: 'q2', text: 'Is there evidence of top management leadership and commitment with respect to the OH&S management system?', standard: 'ISO 45001', clause: '5.1', category: 'Leadership', aiHint: 'Check for signed policies and participation in safety meetings.', riskWeight: 10 },
      { id: 'q3', text: 'Are processes established for hazard identification and assessment of risks and opportunities?', standard: 'ISO 45001', clause: '6.1', category: 'Planning', aiHint: 'Review the JSA/HIRA process documentation.', riskWeight: 8 },
      { id: 'q4', text: 'Has the organization determined and provided the resources needed for the establishment of the OH&S system?', standard: 'ISO 45001', clause: '7.1', category: 'Support', aiHint: 'Verify budget allocations and staffing levels.', riskWeight: 6 },
      { id: 'q5', text: 'Are operational controls implemented to eliminate hazards and reduce OH&S risks?', standard: 'ISO 45001', clause: '8.1', category: 'Operation', aiHint: 'Inspect physical guards and administrative controls.', riskWeight: 9 },
      { id: 'q6', text: 'Is monitoring, measurement, analysis, and evaluation of OH&S performance conducted at planned intervals?', standard: 'ISO 45001', clause: '9.1', category: 'Performance Evaluation', aiHint: 'Review KPI dashboards, leading/lagging indicators, and trend analyses.', riskWeight: 7 },
      { id: 'q7', text: 'Are internal audits conducted at planned intervals to provide information on whether the OH&S management system conforms?', standard: 'ISO 45001', clause: '9.2', category: 'Performance Evaluation', aiHint: 'Check audit program, schedules, scope, and auditor competence records.', riskWeight: 8 },
      { id: 'q8', text: 'Has top management conducted management reviews at planned intervals, including trend analysis and continual improvement?', standard: 'ISO 45001', clause: '9.3', category: 'Performance Evaluation', aiHint: 'Review management review minutes, action items, and follow-up evidence.', riskWeight: 7 },
      { id: 'q9', text: 'Are procedures for incident investigation established to determine root causes and prevent recurrence?', standard: 'ISO 45001', clause: '10.2', category: 'Improvement', aiHint: 'Review investigation reports for root cause methodology (5-Why, fishbone).', riskWeight: 9 },
      { id: 'q10', text: 'Are worker consultation and participation mechanisms in place, including safety committees?', standard: 'ISO 45001', clause: '5.4', category: 'Leadership', aiHint: 'Verify safety committee meeting records and employee feedback mechanisms.', riskWeight: 8 },
    ]
  },
  {
    id: 'osha-construction-audit',
    name: 'OSHA Construction Safety Audit (1926)',
    standard: 'OSHA',
    version: '1926',
    description: 'Comprehensive safety inspection based on OSHA 29 CFR 1926 regulations for the construction industry.',
    categories: ['Fall Protection', 'Scaffolding', 'Excavations', 'Cranes & Rigging', 'Personal Protective Equipment'],
    questions: [
      { id: 'c1', text: 'Are fall protection systems (harnesses, guardrails, nets) in place for work above 6 feet?', standard: 'OSHA 1926.501', clause: '1926.501(b)(1)', category: 'Fall Protection', aiHint: 'Verify all workers are tied off and guardrails are secure.', riskWeight: 10 },
      { id: 'c2', text: 'Are scaffolds inspected by a competent person before each work shift?', standard: 'OSHA 1926.451', clause: '1926.451(f)(3)', category: 'Scaffolding', aiHint: 'Check for green/red tags and base plate stability.', riskWeight: 9 },
      { id: 'c3', text: 'Are excavations deeper than 5 feet protected by shoring, shielding, or sloping?', standard: 'OSHA 1926.652', clause: '1926.652(a)(1)', category: 'Excavations', aiHint: 'Inspect trench boxes and soil classification records.', riskWeight: 10 },
      { id: 'c4', text: 'Are crane load charts available and followed for all lifts?', standard: 'OSHA 1926.1417', clause: '1926.1417(o)', category: 'Cranes & Rigging', aiHint: 'Verify the operator has the correct chart for the configuration.', riskWeight: 9 },
      { id: 'c5', text: 'Is head protection (hard hats) worn by all employees in construction areas?', standard: 'OSHA 1926.100', clause: '1926.100(a)', category: 'Personal Protective Equipment', aiHint: 'Observe all personnel within the site perimeter.', riskWeight: 8 },
    ]
  },
  {
    id: 'osha-general-audit',
    name: 'OSHA General Industry Safety Audit',
    standard: 'OSHA',
    version: '1910',
    description: 'Standard safety inspection based on OSHA 29 CFR 1910 regulations for general industry.',
    categories: ['Walking-Working Surfaces', 'Exit Routes', 'Fire Protection', 'PPE', 'Hazard Communication', 'Electrical'],
    questions: [
      { id: 'o1', text: 'Are all floor surfaces kept clean, dry, and free of obstructions?', standard: 'OSHA 1910.22', clause: '1910.22(a)', category: 'Walking-Working Surfaces', aiHint: 'Check for spills or loose cables in high-traffic areas.', riskWeight: 7 },
      { id: 'o2', text: 'Are exit routes kept free and unobstructed?', standard: 'OSHA 1910.37', clause: '1910.37(a)', category: 'Exit Routes', aiHint: 'Ensure no storage is blocking emergency exits.', riskWeight: 10 },
      { id: 'o3', text: 'Are fire extinguishers inspected monthly and maintained in good working order?', standard: 'OSHA 1910.157', clause: '1910.157(e)', category: 'Fire Protection', aiHint: 'Verify inspection tags are current.', riskWeight: 8 },
      { id: 'o4', text: 'Is appropriate PPE provided and used by employees where required?', standard: 'OSHA 1910.132', clause: '1910.132(h)', category: 'PPE', aiHint: 'Observe workers for compliance with safety gear requirements.', riskWeight: 9 },
      { id: 'o5', text: 'Are all hazardous chemicals labeled and SDS readily available?', standard: 'OSHA 1910.1200', clause: '1910.1200(g)', category: 'Hazard Communication', aiHint: 'Check the digital SDS library for completeness.', riskWeight: 7 },
    ]
  },
  {
    id: 'asme-b30-audit',
    name: 'ASME B30.5 Mobile Crane Audit',
    standard: 'ASME',
    version: '2021',
    description: 'Safety inspection for mobile and locomotive cranes based on ASME B30.5 standards.',
    categories: ['Inspection', 'Operation', 'Maintenance', 'Rigging'],
    questions: [
      { id: 'a1', text: 'Are daily pre-operational inspections performed and documented?', standard: 'ASME B30.5', clause: '5-2.1.2', category: 'Inspection', aiHint: 'Check the crane logbook for today\'s entry.', riskWeight: 10 },
      { id: 'a2', text: 'Is the load chart legible and visible to the operator?', standard: 'ASME B30.5', clause: '5-1.1.1', category: 'Operation', aiHint: 'Verify the chart matches the crane configuration.', riskWeight: 9 },
      { id: 'a3', text: 'Are wire ropes inspected for wear, kinking, or broken strands?', standard: 'ASME B30.5', clause: '5-2.4.1', category: 'Maintenance', aiHint: 'Look for signs of corrosion or core failure.', riskWeight: 8 },
      { id: 'a4', text: 'Are outriggers fully extended and set on firm ground before crane operations begin?', standard: 'ASME B30.5', clause: '5-3.1.2', category: 'Operation', aiHint: 'Verify outrigger pads are in use and fully deployed.', riskWeight: 10 },
      { id: 'a5', text: 'Is the operator certified and qualified for the specific crane type being operated?', standard: 'ASME B30.5', clause: '5-3.1.1', category: 'Operation', aiHint: 'Check operator certification cards and training records.', riskWeight: 9 },
      { id: 'a6', text: 'Are anti-two-block devices functional and tested before each shift?', standard: 'ASME B30.5', clause: '5-1.9.11', category: 'Inspection', aiHint: 'Test the anti-two-block warning system and automatic stop.', riskWeight: 9 },
      { id: 'a7', text: 'Are all slings, shackles, and rigging hardware inspected before use and rated for the load?', standard: 'ASME B30.9', clause: '9-2.7.1', category: 'Rigging', aiHint: 'Inspect for deformation, cracks, and legible load tags.', riskWeight: 8 },
    ]
  },
  {
    id: 'api-rp-54-audit',
    name: 'API RP 54 Drilling Safety Audit',
    standard: 'API',
    version: '4th Ed',
    description: 'Recommended practice for occupational safety for oil and gas well drilling and servicing operations.',
    categories: ['Well Control', 'Personal Safety', 'Equipment', 'Emergency Response'],
    questions: [
      { id: 'p1', text: 'Is the blowout preventer (BOP) system tested and maintained?', standard: 'API RP 54', clause: '6.4', category: 'Well Control', aiHint: 'Review recent pressure test charts.', riskWeight: 10 },
      { id: 'p2', text: 'Are fall protection systems installed on the derrick/mast?', standard: 'API RP 54', clause: '9.3', category: 'Personal Safety', aiHint: 'Inspect climbing assists and fall arrestors.', riskWeight: 9 },
      { id: 'p3', text: 'Is the emergency shutdown (ESD) system functional and accessible?', standard: 'API RP 54', clause: '12.1', category: 'Emergency Response', aiHint: 'Verify ESD locations are clearly marked.', riskWeight: 10 },
      { id: 'p4', text: 'Are H2S safety procedures implemented including monitors, wind socks, and breathing apparatus?', standard: 'API RP 54', clause: '8.2', category: 'Personal Safety', aiHint: 'Check H2S monitor calibration dates and breathing air quality tests.', riskWeight: 10 },
      { id: 'p5', text: 'Are all rig floor equipment guards and protective devices in place and functional?', standard: 'API RP 54', clause: '7.1', category: 'Equipment', aiHint: 'Inspect rotary table guard, cathead guards, and draw-works enclosures.', riskWeight: 9 },
      { id: 'p6', text: 'Are fire and gas detection systems operational with alarms tested at required intervals?', standard: 'API RP 14C', clause: '5.2', category: 'Emergency Response', aiHint: 'Review fire and gas detector test records and alarm response logs.', riskWeight: 9 },
      { id: 'p7', text: 'Is a well control drill conducted at least weekly with records of crew participation?', standard: 'API RP 54', clause: '6.5', category: 'Well Control', aiHint: 'Check drill records for frequency, scenarios, and crew attendance.', riskWeight: 10 },
    ]
  },
  {
    id: 'cal-osha-title8-audit',
    name: 'Cal/OSHA Title 8 CCR Safety Audit',
    standard: 'Cal/OSHA',
    version: 'T8 CCR',
    description: 'California-specific safety inspection based on Title 8, California Code of Regulations (CCR) standards.',
    categories: ['Injury & Illness Prevention', 'Heat Illness Prevention', 'Fall Protection', 'Hazard Communication', 'Process Safety Management'],
    questions: [
      { id: 'co1', text: 'Does the employer have an effective written Injury and Illness Prevention Program (IIPP)?', standard: 'Cal/OSHA T8 CCR', clause: '§3203', category: 'Injury & Illness Prevention', aiHint: 'Review written IIPP for all 7 required elements.', riskWeight: 10 },
      { id: 'co2', text: 'Are employees trained on heat illness prevention procedures including access to water, shade, and rest?', standard: 'Cal/OSHA T8 CCR', clause: '§3395', category: 'Heat Illness Prevention', aiHint: 'Check outdoor workers have shade and water within reach.', riskWeight: 9 },
      { id: 'co3', text: 'Are personal fall arrest systems in use for work at heights of 7.5 feet or more (general industry)?', standard: 'Cal/OSHA T8 CCR', clause: '§3210', category: 'Fall Protection', aiHint: 'California requires fall protection at lower heights than federal OSHA.', riskWeight: 10 },
      { id: 'co4', text: 'Has the employer conducted a hazard assessment and trained employees on chemical hazards per Cal/OSHA HazCom?', standard: 'Cal/OSHA T8 CCR', clause: '§5194', category: 'Hazard Communication', aiHint: 'Verify SDS access and GHS-compliant labeling.', riskWeight: 8 },
      { id: 'co5', text: 'Is Process Safety Management implemented for facilities handling highly hazardous chemicals?', standard: 'Cal/OSHA T8 CCR', clause: '§5189', category: 'Process Safety Management', aiHint: 'Review PSM documentation for 14 required elements.', riskWeight: 10 },
    ]
  },
  {
    id: 'bsee-offshore-audit',
    name: 'BSEE Offshore Safety & Environmental Audit',
    standard: 'BSEE',
    version: '30 CFR 250',
    description: 'Bureau of Safety and Environmental Enforcement audit for offshore oil and gas operations on the Outer Continental Shelf.',
    categories: ['Safety & Environmental Management', 'Well Control', 'Production Safety', 'Pollution Prevention', 'Emergency Response'],
    questions: [
      { id: 'bs1', text: 'Does the facility have a current, approved Safety and Environmental Management System (SEMS) plan?', standard: 'BSEE 30 CFR 250', clause: '§250.1900', category: 'Safety & Environmental Management', aiHint: 'Verify SEMS plan is updated within required timeframe.', riskWeight: 10 },
      { id: 'bs2', text: 'Are Blowout Preventers (BOPs) tested per BSEE requirements and records maintained?', standard: 'BSEE 30 CFR 250', clause: '§250.449', category: 'Well Control', aiHint: 'Check BOP test records for frequency and pressure specs.', riskWeight: 10 },
      { id: 'bs3', text: 'Are all safety devices (SDVs, PSVs, fire detectors) inspected and tested on schedule?', standard: 'BSEE 30 CFR 250', clause: '§250.880', category: 'Production Safety', aiHint: 'Review safety device inspection logs and test tags.', riskWeight: 9 },
      { id: 'bs4', text: 'Are spill prevention and response equipment in place and personnel trained per BSEE requirements?', standard: 'BSEE 30 CFR 250', clause: '§250.300', category: 'Pollution Prevention', aiHint: 'Verify oil spill response equipment is accessible and current.', riskWeight: 9 },
      { id: 'bs5', text: 'Has the facility conducted emergency action training and drills within the required period?', standard: 'BSEE 30 CFR 250', clause: '§250.1929', category: 'Emergency Response', aiHint: 'Check drill logs for fire, abandon platform, and man overboard.', riskWeight: 8 },
    ]
  },
  {
    id: 'ansi-z10-audit',
    name: 'ANSI/ASSP Z10 Safety Management System Audit',
    standard: 'ANSI',
    version: 'Z10-2019',
    description: 'American National Standard for Occupational Health and Safety Management Systems (ANSI/ASSP Z10.0-2019).',
    categories: ['Management Leadership', 'Employee Participation', 'Planning', 'Implementation & Operation', 'Evaluation & Corrective Action'],
    questions: [
      { id: 'an1', text: 'Has top management established a documented OHS policy with commitment to continual improvement?', standard: 'ANSI Z10', clause: '3.1', category: 'Management Leadership', aiHint: 'Verify signed policy is posted and communicated.', riskWeight: 9 },
      { id: 'an2', text: 'Are formal mechanisms in place for employee participation in hazard identification and risk assessment?', standard: 'ANSI Z10', clause: '3.2', category: 'Employee Participation', aiHint: 'Check for safety committees and feedback channels.', riskWeight: 8 },
      { id: 'an3', text: 'Are risk assessments conducted using a hierarchy of controls with documented action plans?', standard: 'ANSI Z10', clause: '4.1', category: 'Planning', aiHint: 'Review risk assessment methodology documentation.', riskWeight: 10 },
      { id: 'an4', text: 'Are operational controls implemented for identified hazards with emergency preparedness procedures?', standard: 'ANSI Z10', clause: '5.1', category: 'Implementation & Operation', aiHint: 'Verify written procedures exist for high-risk tasks.', riskWeight: 9 },
      { id: 'an5', text: 'Are incident investigations conducted with root cause analysis and corrective actions tracked to closure?', standard: 'ANSI Z10', clause: '6.1', category: 'Evaluation & Corrective Action', aiHint: 'Review recent incident investigation reports for completeness.', riskWeight: 10 },
    ]
  },
  {
    id: 'nfpa-fire-safety-audit',
    name: 'NFPA Fire & Electrical Safety Audit',
    standard: 'NFPA',
    version: '70E/1/101',
    description: 'National Fire Protection Association audit covering NFPA 70E (electrical), NFPA 1 (fire code), and NFPA 101 (life safety).',
    categories: ['Electrical Safety', 'Fire Protection Systems', 'Means of Egress', 'Hot Work', 'Flammable Storage'],
    questions: [
      { id: 'nf1', text: 'Are arc flash labels posted on all electrical equipment with proper incident energy calculations?', standard: 'NFPA 70E', clause: '130.5(H)', category: 'Electrical Safety', aiHint: 'Check panels for current arc flash study labels.', riskWeight: 10 },
      { id: 'nf2', text: 'Are fire sprinkler systems inspected, tested, and maintained per NFPA 25?', standard: 'NFPA 25/1', clause: '5.2', category: 'Fire Protection Systems', aiHint: 'Review quarterly inspection records and 5-year test logs.', riskWeight: 9 },
      { id: 'nf3', text: 'Are exits and egress pathways clearly marked, illuminated, and unobstructed per NFPA 101?', standard: 'NFPA 101', clause: '7.10', category: 'Means of Egress', aiHint: 'Walk egress paths and verify signage and lighting.', riskWeight: 10 },
      { id: 'nf4', text: 'Are hot work permits issued and fire watches maintained per NFPA 51B?', standard: 'NFPA 51B', clause: '7.2', category: 'Hot Work', aiHint: 'Check hot work permit log and fire watch documentation.', riskWeight: 9 },
      { id: 'nf5', text: 'Are flammable liquid storage cabinets compliant with NFPA 30 limits and labeling?', standard: 'NFPA 30', clause: '9.5', category: 'Flammable Storage', aiHint: 'Verify cabinet quantities do not exceed 60 gallons.', riskWeight: 8 },
    ]
  },
  {
    id: 'eu-framework-directive-audit',
    name: 'EU Framework Directive 89/391/EEC Safety Audit',
    standard: 'EU',
    version: '89/391/EEC',
    description: 'European Union occupational safety audit based on EU Framework Directive 89/391/EEC and daughter directives for worker health & safety.',
    categories: ['General Obligations', 'Risk Assessment', 'Worker Information & Training', 'Health Surveillance', 'Emergency Procedures'],
    questions: [
      { id: 'eu1', text: 'Has the employer carried out a comprehensive risk assessment covering all workplace hazards per Article 6.3?', standard: 'EU 89/391/EEC', clause: 'Art. 6.3', category: 'Risk Assessment', aiHint: 'Check for documented risk assessment covering physical, chemical, biological, and psychosocial hazards.', riskWeight: 10 },
      { id: 'eu2', text: 'Are protective and preventive services designated per Article 7 with competent persons assigned?', standard: 'EU 89/391/EEC', clause: 'Art. 7', category: 'General Obligations', aiHint: 'Verify appointment of competent safety officers or external consultants.', riskWeight: 9 },
      { id: 'eu3', text: 'Are workers provided with adequate health and safety training upon hiring, transfer, and introduction of new equipment per Article 12?', standard: 'EU 89/391/EEC', clause: 'Art. 12', category: 'Worker Information & Training', aiHint: 'Review training records for all mandated trigger events.', riskWeight: 8 },
      { id: 'eu4', text: 'Is health surveillance provided to workers as appropriate to the health and safety risks per Article 14?', standard: 'EU 89/391/EEC', clause: 'Art. 14', category: 'Health Surveillance', aiHint: 'Check occupational health screening programs and records.', riskWeight: 8 },
      { id: 'eu5', text: 'Are first aid, firefighting, and evacuation measures established with designated trained personnel per Article 8?', standard: 'EU 89/391/EEC', clause: 'Art. 8', category: 'Emergency Procedures', aiHint: 'Verify emergency plans, trained first aiders, and drill records.', riskWeight: 10 },
    ]
  },
  {
    id: 'msha-mining-audit',
    name: 'MSHA Mining Safety Audit (30 CFR)',
    standard: 'MSHA',
    version: '30 CFR 46-75',
    description: 'Mine Safety and Health Administration audit for surface and underground mining operations per 30 CFR Parts 46-75.',
    categories: ['Training & Competency', 'Ground Control', 'Ventilation & Dust', 'Electrical Safety', 'Emergency Preparedness'],
    questions: [
      { id: 'ms1', text: 'Have all miners received new miner training (Part 46/48) before beginning work assignments?', standard: 'MSHA 30 CFR', clause: '§46.5 / §48.5', category: 'Training & Competency', aiHint: 'Verify 24-hour (surface) or 40-hour (underground) new miner training certificates.', riskWeight: 10 },
      { id: 'ms2', text: 'Is the ground control plan current and being implemented for all underground workings?', standard: 'MSHA 30 CFR', clause: '§75.220', category: 'Ground Control', aiHint: 'Review approved roof control plan and inspect bolting patterns.', riskWeight: 10 },
      { id: 'ms3', text: 'Is the mine ventilation plan approved and providing adequate air quality to all working areas?', standard: 'MSHA 30 CFR', clause: '§75.370', category: 'Ventilation & Dust', aiHint: 'Check ventilation surveys and methane/dust sampling records.', riskWeight: 10 },
      { id: 'ms4', text: 'Are electrical installations examined weekly and all equipment properly grounded per MSHA requirements?', standard: 'MSHA 30 CFR', clause: '§75.512', category: 'Electrical Safety', aiHint: 'Review weekly electrical examination records and ground fault testing.', riskWeight: 9 },
      { id: 'ms5', text: 'Is the Emergency Response Plan (ERP) current with designated evacuation routes and refuge alternatives?', standard: 'MSHA 30 CFR', clause: '§75.1502', category: 'Emergency Preparedness', aiHint: 'Verify refuge chamber locations, SCSR supplies, and quarterly drill records.', riskWeight: 10 },
    ]
  },
  {
    id: 'imo-solas-maritime-audit',
    name: 'IMO/SOLAS Maritime Safety Audit',
    standard: 'IMO',
    version: 'SOLAS 2024',
    description: 'International Maritime Organization Safety of Life at Sea (SOLAS) audit for vessel and port facility safety compliance.',
    categories: ['Life-Saving Appliances', 'Fire Safety', 'Navigation Safety', 'Structural Integrity', 'ISM Code Compliance'],
    questions: [
      { id: 'im1', text: 'Are all life-saving appliances (lifeboats, life rafts, life jackets) inspected, maintained, and readily accessible per SOLAS Chapter III?', standard: 'IMO SOLAS', clause: 'Ch. III Reg. 20', category: 'Life-Saving Appliances', aiHint: 'Inspect lifeboat davits, raft hydrostatic releases, and lifejacket condition.', riskWeight: 10 },
      { id: 'im2', text: 'Are fire detection, alarm, and extinguishing systems operational and tested per SOLAS Chapter II-2?', standard: 'IMO SOLAS', clause: 'Ch. II-2 Reg. 7', category: 'Fire Safety', aiHint: 'Check fire pump tests, CO2 system inspections, and fire drill logs.', riskWeight: 10 },
      { id: 'im3', text: 'Is the vessel equipped with operational navigational equipment (ECDIS, AIS, GMDSS) per SOLAS Chapter V?', standard: 'IMO SOLAS', clause: 'Ch. V Reg. 19', category: 'Navigation Safety', aiHint: 'Verify annual testing certificates for all navigation equipment.', riskWeight: 9 },
      { id: 'im4', text: 'Has a hull structural survey been completed within required intervals with no outstanding conditions of class?', standard: 'IMO SOLAS', clause: 'Ch. II-1 Reg. 3-1', category: 'Structural Integrity', aiHint: 'Review classification society survey reports and thickness measurements.', riskWeight: 9 },
      { id: 'im5', text: 'Is the ISM Code Safety Management System implemented with a Designated Person Ashore (DPA) appointed?', standard: 'IMO ISM Code', clause: 'Ch. IX', category: 'ISM Code Compliance', aiHint: 'Check DOC and SMC certificates, and verify DPA contact is current.', riskWeight: 10 },
    ]
  },
  {
    id: 'iata-icao-aviation-audit',
    name: 'IATA/ICAO Aviation Safety Audit',
    standard: 'IATA',
    version: 'IOSA 2025',
    description: 'International Air Transport Association (IATA) Operational Safety Audit aligned with ICAO Annex 19 Safety Management.',
    categories: ['Safety Management System', 'Flight Operations', 'Ground Handling', 'Maintenance & Engineering', 'Security'],
    questions: [
      { id: 'ia1', text: 'Is a Safety Management System (SMS) implemented per ICAO Annex 19 with accountable executive identified?', standard: 'ICAO Annex 19', clause: 'Ch. 4.1', category: 'Safety Management System', aiHint: 'Verify SMS documentation, safety policy, and accountable executive appointment.', riskWeight: 10 },
      { id: 'ia2', text: 'Are flight crew duty time limitations and rest requirements tracked and enforced per applicable regulations?', standard: 'IATA IOSA', clause: 'FLT 3.3', category: 'Flight Operations', aiHint: 'Review crew scheduling system and fatigue risk management program.', riskWeight: 10 },
      { id: 'ia3', text: 'Are ground handling operations conducted per IATA ISAGO standards with proper ramp safety procedures?', standard: 'IATA ISAGO', clause: 'GRH 2.1', category: 'Ground Handling', aiHint: 'Observe FOD prevention, equipment operation, and aircraft marshalling.', riskWeight: 8 },
      { id: 'ia4', text: 'Is the continuing airworthiness management organization maintaining aircraft per approved maintenance program?', standard: 'ICAO Annex 6', clause: 'Part I Ch. 8', category: 'Maintenance & Engineering', aiHint: 'Review maintenance records, AD compliance, and MEL management.', riskWeight: 10 },
      { id: 'ia5', text: 'Is the aviation security program compliant with ICAO Annex 17 and national civil aviation security requirements?', standard: 'ICAO Annex 17', clause: 'Ch. 4', category: 'Security', aiHint: 'Verify security training, access control, and screening procedures.', riskWeight: 9 },
    ]
  },
  {
    id: 'who-jci-healthcare-audit',
    name: 'WHO/JCI Healthcare Safety Audit',
    standard: 'WHO',
    version: 'JCI 7th Ed',
    description: 'World Health Organization and Joint Commission International patient and worker safety audit for healthcare facilities.',
    categories: ['Patient Safety Goals', 'Infection Control', 'Facility Safety', 'Staff Health & Safety', 'Emergency Management'],
    questions: [
      { id: 'wh1', text: 'Are the International Patient Safety Goals (IPSG) implemented including correct patient identification and surgical safety checklist?', standard: 'WHO/JCI', clause: 'IPSG 1-6', category: 'Patient Safety Goals', aiHint: 'Check wristband protocols, surgical timeout compliance, and hand hygiene rates.', riskWeight: 10 },
      { id: 'wh2', text: 'Is an infection prevention and control program active with hand hygiene compliance monitoring per WHO guidelines?', standard: 'WHO IPC', clause: 'FMS.4', category: 'Infection Control', aiHint: 'Review HAI rates, hand hygiene audit results, and sterilization records.', riskWeight: 10 },
      { id: 'wh3', text: 'Are facility safety inspections conducted covering fire safety, medical gas systems, and utility systems per JCI FMS standards?', standard: 'JCI FMS', clause: 'FMS.7', category: 'Facility Safety', aiHint: 'Check fire drill records, medical gas alarm tests, and utility backup systems.', riskWeight: 9 },
      { id: 'wh4', text: 'Is a staff occupational health program in place addressing needle stick prevention, TB screening, and violence prevention?', standard: 'WHO/JCI', clause: 'SQE.8', category: 'Staff Health & Safety', aiHint: 'Review sharps injury log, employee vaccination records, and workplace violence incidents.', riskWeight: 8 },
      { id: 'wh5', text: 'Is a comprehensive emergency management plan maintained with regular drills for mass casualty, fire, and utility failure scenarios?', standard: 'JCI FMS', clause: 'FMS.6', category: 'Emergency Management', aiHint: 'Check disaster drill records and emergency supply inventory.', riskWeight: 9 },
    ]
  },
  {
    id: 'haccp-fda-food-safety-audit',
    name: 'HACCP/FDA Food Safety Audit',
    standard: 'HACCP',
    version: 'Codex/21 CFR',
    description: 'Hazard Analysis Critical Control Points and FDA food safety audit per Codex Alimentarius and 21 CFR Part 117 (FSMA).',
    categories: ['HACCP Plan', 'Prerequisite Programs', 'Allergen Management', 'Sanitation & Hygiene', 'Traceability & Recall'],
    questions: [
      { id: 'hc1', text: 'Is a validated HACCP plan in place with all 7 principles documented and critical control points (CCPs) identified?', standard: 'HACCP Codex', clause: 'Principle 1-7', category: 'HACCP Plan', aiHint: 'Review hazard analysis, CCP determination, critical limits, monitoring, and verification.', riskWeight: 10 },
      { id: 'hc2', text: 'Are prerequisite programs (GMPs) documented and maintained covering facilities, equipment, personnel hygiene, and pest control?', standard: 'FDA 21 CFR 117', clause: 'Subpart B', category: 'Prerequisite Programs', aiHint: 'Check GMP documentation, pest control logs, and water quality testing.', riskWeight: 9 },
      { id: 'hc3', text: 'Is a written allergen control program in place with proper labeling, segregation, and cleaning validation?', standard: 'FDA FSMA', clause: '21 CFR 117.135', category: 'Allergen Management', aiHint: 'Verify allergen maps, label reviews, and sanitation validation for changeovers.', riskWeight: 10 },
      { id: 'hc4', text: 'Are sanitation standard operating procedures (SSOPs) documented with pre-operational and operational cleaning verification?', standard: 'FDA 21 CFR 117', clause: 'Subpart B.3', category: 'Sanitation & Hygiene', aiHint: 'Check ATP swab results, cleaning schedules, and employee hygiene training.', riskWeight: 8 },
      { id: 'hc5', text: 'Is a traceability system implemented allowing product recall within 24 hours with mock recall exercises conducted annually?', standard: 'FDA FSMA', clause: '21 CFR 117.139', category: 'Traceability & Recall', aiHint: 'Verify lot coding system, mock recall records, and supplier traceability.', riskWeight: 9 },
    ]
  },
  {
    id: 'dot-fmcsa-transportation-audit',
    name: 'DOT/FMCSA Transportation Safety Audit',
    standard: 'DOT',
    version: '49 CFR',
    description: 'Department of Transportation and Federal Motor Carrier Safety Administration audit for commercial transportation safety.',
    categories: ['Driver Qualification', 'Hours of Service', 'Vehicle Maintenance', 'Hazardous Materials', 'Drug & Alcohol Testing'],
    questions: [
      { id: 'dt1', text: 'Are Driver Qualification (DQ) files maintained for all CMV drivers with current medical certificates and MVR reviews?', standard: 'DOT/FMCSA', clause: '49 CFR 391', category: 'Driver Qualification', aiHint: 'Check DQ files for medical cards, CDL verification, and annual MVR pulls.', riskWeight: 10 },
      { id: 'dt2', text: 'Are Hours of Service (HOS) records maintained via ELD with compliance monitoring for duty limits?', standard: 'DOT/FMCSA', clause: '49 CFR 395', category: 'Hours of Service', aiHint: 'Review ELD records for 11-hour driving, 14-hour on-duty, and 70-hour limits.', riskWeight: 10 },
      { id: 'dt3', text: 'Are systematic vehicle inspection, maintenance, and repair programs documented per FMCSA requirements?', standard: 'DOT/FMCSA', clause: '49 CFR 396', category: 'Vehicle Maintenance', aiHint: 'Check DVIR completion, PM schedules, and annual inspection certificates.', riskWeight: 9 },
      { id: 'dt4', text: 'Are hazardous materials transported with proper placarding, shipping papers, and driver HazMat endorsement?', standard: 'DOT/PHMSA', clause: '49 CFR 172-177', category: 'Hazardous Materials', aiHint: 'Verify placarding, SDS availability, and emergency response information.', riskWeight: 10 },
      { id: 'dt5', text: 'Is a compliant drug and alcohol testing program in place with random testing at required rates?', standard: 'DOT/FMCSA', clause: '49 CFR 382', category: 'Drug & Alcohol Testing', aiHint: 'Review testing records, MRO reports, and Clearinghouse queries.', riskWeight: 9 },
    ]
  },
  {
    id: 'csa-z1000-audit',
    name: 'CSA Z1000 Occupational H&S Audit (Canada)',
    standard: 'CSA',
    version: 'Z1000-14',
    description: 'Canadian Standards Association Occupational Health and Safety Management System audit aligned with provincial OHS legislation.',
    categories: ['Management Commitment', 'Hazard Prevention', 'Emergency Response', 'Training & Competence', 'Program Evaluation'],
    questions: [
      { id: 'cs1', text: 'Has senior management established an OHS policy with signed commitment and allocated adequate resources?', standard: 'CSA Z1000', clause: '4.2', category: 'Management Commitment', aiHint: 'Verify policy is posted, dated, signed, and resource allocation is documented.', riskWeight: 9 },
      { id: 'cs2', text: 'Are hazard assessments conducted for all work activities with a hierarchy of controls applied?', standard: 'CSA Z1000', clause: '5.3', category: 'Hazard Prevention', aiHint: 'Review hazard assessment records covering routine and non-routine tasks.', riskWeight: 10 },
      { id: 'cs3', text: 'Are emergency response plans developed, communicated, and tested with all workers?', standard: 'CSA Z1000', clause: '5.6', category: 'Emergency Response', aiHint: 'Check emergency drill records, muster lists, and first aid kits.', riskWeight: 9 },
      { id: 'cs4', text: 'Is OHS training documented, competency-based, and provided in a language understood by workers?', standard: 'CSA Z1000', clause: '5.2', category: 'Training & Competence', aiHint: 'Verify orientation records, job-specific training, and refresher schedules.', riskWeight: 8 },
      { id: 'cs5', text: 'Is the OHS program evaluated through workplace inspections, incident investigation, and management review?', standard: 'CSA Z1000', clause: '6.1', category: 'Program Evaluation', aiHint: 'Review inspection checklists, investigation reports, and annual review minutes.', riskWeight: 8 },
    ]
  },
  {
    id: 'as-nzs-iso-45001-audit',
    name: 'AS/NZS ISO 45001 WHS Audit (Australia/NZ)',
    standard: 'AS/NZS',
    version: 'AS/NZS ISO 45001',
    description: 'Australian/New Zealand Work Health and Safety audit aligned with AS/NZS ISO 45001 and model WHS legislation.',
    categories: ['PCBU Duties', 'Risk Management', 'Worker Consultation', 'Incident Notification', 'WHS Training'],
    questions: [
      { id: 'anz1', text: 'Has the PCBU ensured so far as reasonably practicable the health and safety of workers per WHS Act Section 19?', standard: 'WHS Act', clause: 'S.19', category: 'PCBU Duties', aiHint: 'Review evidence of SFARP decision-making and risk control records.', riskWeight: 10 },
      { id: 'anz2', text: 'Is a risk management process implemented per AS/NZS ISO 45001 covering hazard identification, risk assessment, and control?', standard: 'AS/NZS ISO 45001', clause: '6.1.2', category: 'Risk Management', aiHint: 'Check risk registers, control effectiveness reviews, and change management.', riskWeight: 10 },
      { id: 'anz3', text: 'Are workers consulted on WHS matters through Health and Safety Representatives (HSRs) or committees?', standard: 'WHS Act', clause: 'S.47', category: 'Worker Consultation', aiHint: 'Verify HSR elections, committee meeting minutes, and consultation records.', riskWeight: 8 },
      { id: 'anz4', text: 'Are notifiable incidents reported to the regulator within required timeframes and the scene preserved?', standard: 'WHS Act', clause: 'S.38', category: 'Incident Notification', aiHint: 'Review incident registers and regulator notification records.', riskWeight: 10 },
      { id: 'anz5', text: 'Is WHS induction and ongoing training provided appropriate to the nature of the work?', standard: 'WHS Reg', clause: 'Reg 39', category: 'WHS Training', aiHint: 'Check induction records, high-risk work licenses, and competency assessments.', riskWeight: 8 },
    ]
  },
  {
    id: 'nebosh-uk-hse-audit',
    name: 'NEBOSH/UK HSE Safety Audit',
    standard: 'NEBOSH',
    version: 'HSWA 1974',
    description: 'UK Health and Safety Executive audit aligned with NEBOSH standards and the Health and Safety at Work Act 1974.',
    categories: ['Management System', 'Risk Assessment (COSHH)', 'Manual Handling', 'Work at Height', 'Fire Safety'],
    questions: [
      { id: 'nb1', text: 'Is a written health and safety policy in place with organization and arrangements per HSWA Section 2(3)?', standard: 'UK HSWA', clause: 'S.2(3)', category: 'Management System', aiHint: 'Verify signed H&S policy with named responsibilities and review date.', riskWeight: 9 },
      { id: 'nb2', text: 'Are COSHH assessments completed for all hazardous substances with appropriate controls implemented?', standard: 'COSHH 2002', clause: 'Reg 6-7', category: 'Risk Assessment (COSHH)', aiHint: 'Check COSHH assessment register, exposure monitoring, and LEV testing.', riskWeight: 10 },
      { id: 'nb3', text: 'Are manual handling risk assessments conducted per the Manual Handling Operations Regulations 1992?', standard: 'MHOR 1992', clause: 'Reg 4', category: 'Manual Handling', aiHint: 'Review TILE assessments (Task, Individual, Load, Environment).', riskWeight: 8 },
      { id: 'nb4', text: 'Are work at height activities planned and controlled per the Work at Height Regulations 2005?', standard: 'WAHR 2005', clause: 'Reg 4-6', category: 'Work at Height', aiHint: 'Check method statements, equipment inspections, and rescue plans.', riskWeight: 10 },
      { id: 'nb5', text: 'Is a fire risk assessment in place with adequate means of escape, fire detection, and firefighting equipment?', standard: 'FSO 2005', clause: 'Art. 9-22', category: 'Fire Safety', aiHint: 'Review fire risk assessment, escape route signage, and alarm testing logs.', riskWeight: 9 },
    ]
  },
  {
    id: 'gcc-oshad-audit',
    name: 'GCC/OSHAD Safety System Audit (Gulf States)',
    standard: 'GCC',
    version: 'OSHAD SF',
    description: 'Gulf Cooperation Council aligned audit based on Abu Dhabi OSHAD System Framework and GCC safety regulations.',
    categories: ['OSHAD System Framework', 'Heat Stress Management', 'Contractor Safety', 'Permit to Work', 'Environmental Compliance'],
    questions: [
      { id: 'gc1', text: 'Is an OSHAD-compliant management system implemented with Element 01 (Policy & Commitment) fully established?', standard: 'OSHAD SF', clause: 'Element 01', category: 'OSHAD System Framework', aiHint: 'Verify OSHAD registration, policy statement, and management commitment evidence.', riskWeight: 10 },
      { id: 'gc2', text: 'Is a heat stress management program active with midday work ban compliance during summer months (Jun-Sep)?', standard: 'OSHAD CoP', clause: '28.0', category: 'Heat Stress Management', aiHint: 'Check WBGT monitoring, cool rest areas, hydration stations, and acclimatization programs.', riskWeight: 10 },
      { id: 'gc3', text: 'Are contractors pre-qualified for safety performance and managed under a contractor HSE management procedure?', standard: 'OSHAD SF', clause: 'Element 04', category: 'Contractor Safety', aiHint: 'Review contractor pre-qualification, safety plans, and performance monitoring.', riskWeight: 9 },
      { id: 'gc4', text: 'Is a Permit to Work system implemented for high-risk activities (confined space, hot work, excavation)?', standard: 'OSHAD CoP', clause: '22.0', category: 'Permit to Work', aiHint: 'Check PTW register, active permits, and isolation verification.', riskWeight: 10 },
      { id: 'gc5', text: 'Are environmental compliance requirements met including waste management, air quality, and spill prevention?', standard: 'EAD/OSHAD', clause: 'Element 10', category: 'Environmental Compliance', aiHint: 'Review waste manifests, emission monitoring, and spill response kit inspections.', riskWeight: 8 },
    ]
  },
  {
    id: 'osha-psm-audit',
    name: 'OSHA Process Safety Management (PSM) Audit',
    standard: 'OSHA',
    version: '1910.119',
    description: 'Comprehensive PSM audit for facilities handling highly hazardous chemicals above threshold quantities per 29 CFR 1910.119.',
    categories: ['Process Safety Information', 'Process Hazard Analysis', 'Operating Procedures', 'Mechanical Integrity', 'Management of Change', 'Incident Investigation', 'Emergency Planning'],
    questions: [
      { id: 'psm1', text: 'Is Process Safety Information (PSI) current, accurate, and accessible for all covered processes?', standard: 'OSHA 1910.119', clause: '(d)', category: 'Process Safety Information', aiHint: 'Verify P&IDs, MSDSs, and process chemistry documentation are up to date.', riskWeight: 10 },
      { id: 'psm2', text: 'Has a Process Hazard Analysis (PHA) been completed using an appropriate methodology (HAZOP, What-If, FMEA)?', standard: 'OSHA 1910.119', clause: '(e)', category: 'Process Hazard Analysis', aiHint: 'Check PHA completion dates, methodology, and revalidation schedule (every 5 years).', riskWeight: 10 },
      { id: 'psm3', text: 'Are operating procedures written, current, and accessible covering normal operations, startup, shutdown, and emergency?', standard: 'OSHA 1910.119', clause: '(f)', category: 'Operating Procedures', aiHint: 'Review SOPs for completeness and annual certification by operations.', riskWeight: 9 },
      { id: 'psm4', text: 'Is a mechanical integrity program established covering pressure vessels, piping, relief systems, and emergency shutdown systems?', standard: 'OSHA 1910.119', clause: '(j)', category: 'Mechanical Integrity', aiHint: 'Review inspection and testing schedules, NDT records, and deficiency tracking.', riskWeight: 10 },
      { id: 'psm5', text: 'Is a Management of Change (MOC) procedure implemented for all changes to process chemicals, technology, equipment, and procedures?', standard: 'OSHA 1910.119', clause: '(l)', category: 'Management of Change', aiHint: 'Audit MOC forms for completeness, safety review, and communication steps.', riskWeight: 10 },
      { id: 'psm6', text: 'Are all process-related incidents investigated with root cause analysis initiated within 48 hours?', standard: 'OSHA 1910.119', clause: '(m)', category: 'Incident Investigation', aiHint: 'Check investigation timeliness, root cause methodology, and action item closure.', riskWeight: 9 },
      { id: 'psm7', text: 'Is an emergency action plan established and exercised with process-specific emergency response procedures?', standard: 'OSHA 1910.119', clause: '(n)', category: 'Emergency Planning', aiHint: 'Verify drill records, community notification procedures, and coordination with local responders.', riskWeight: 9 },
    ]
  },
  {
    id: 'iec-62443-cybersecurity-audit',
    name: 'IEC 62443 OT/ICS Cybersecurity Audit',
    standard: 'Custom',
    version: 'IEC 62443',
    description: 'Industrial Automation and Control Systems (IACS) cybersecurity audit based on IEC 62443 and NIST CSF for operational technology environments.',
    categories: ['Asset Inventory', 'Network Segmentation', 'Access Control', 'Patch Management', 'Incident Response', 'Security Monitoring'],
    questions: [
      { id: 'ics1', text: 'Is a complete asset inventory maintained for all OT/ICS devices including PLCs, HMIs, RTUs, and SCADA servers?', standard: 'IEC 62443', clause: '2-1 / 4.2.3', category: 'Asset Inventory', aiHint: 'Verify asset discovery tools are deployed and inventory is updated within 30 days.', riskWeight: 10 },
      { id: 'ics2', text: 'Are OT networks segmented from IT networks using DMZs, firewalls, and unidirectional security gateways?', standard: 'IEC 62443', clause: '3-3 / SR 5.1', category: 'Network Segmentation', aiHint: 'Review network architecture diagrams and firewall rules for IT/OT boundaries.', riskWeight: 10 },
      { id: 'ics3', text: 'Is role-based access control (RBAC) implemented for all ICS components with multi-factor authentication for remote access?', standard: 'IEC 62443', clause: '3-3 / SR 1.1', category: 'Access Control', aiHint: 'Check user account audits, password policies, and remote access VPN configurations.', riskWeight: 10 },
      { id: 'ics4', text: 'Is a patch management process in place for OT systems with testing in a staging environment before production deployment?', standard: 'IEC 62443', clause: '2-3', category: 'Patch Management', aiHint: 'Review patch assessment records, vendor advisories, and compensating controls for unpatchable systems.', riskWeight: 9 },
      { id: 'ics5', text: 'Is an OT-specific incident response plan established with playbooks for ransomware, unauthorized access, and process manipulation?', standard: 'IEC 62443 / NIST CSF', clause: 'RS.RP-1', category: 'Incident Response', aiHint: 'Check ICS-specific IR plan, tabletop exercise records, and coordination with IT SOC.', riskWeight: 10 },
      { id: 'ics6', text: 'Are security monitoring and anomaly detection tools deployed on OT networks with 24/7 alerting capability?', standard: 'IEC 62443', clause: '3-3 / SR 6.1', category: 'Security Monitoring', aiHint: 'Verify IDS/IPS deployment, log collection from ICS devices, and alert response SLAs.', riskWeight: 9 },
    ]
  },
  {
    id: 'iso-14001-environmental-audit',
    name: 'ISO 14001:2015 Environmental Management Audit',
    standard: 'ISO',
    version: '14001:2015',
    description: 'Comprehensive environmental management system audit based on ISO 14001:2015 for environmental compliance and sustainability.',
    categories: ['Environmental Policy', 'Environmental Aspects', 'Legal Compliance', 'Operational Control', 'Emergency Preparedness', 'Monitoring & Measurement'],
    questions: [
      { id: 'env1', text: 'Has the organization established an environmental policy that includes a commitment to protection of the environment and prevention of pollution?', standard: 'ISO 14001', clause: '5.2', category: 'Environmental Policy', aiHint: 'Verify policy is documented, communicated, and includes continual improvement commitment.', riskWeight: 8 },
      { id: 'env2', text: 'Are significant environmental aspects identified and their associated impacts evaluated using a systematic methodology?', standard: 'ISO 14001', clause: '6.1.2', category: 'Environmental Aspects', aiHint: 'Review aspect/impact register, scoring methodology, and boundary conditions.', riskWeight: 10 },
      { id: 'env3', text: 'Is a process established to identify and access applicable legal and other requirements related to environmental aspects?', standard: 'ISO 14001', clause: '6.1.3', category: 'Legal Compliance', aiHint: 'Check regulatory register, compliance evaluation records, and permit conditions.', riskWeight: 10 },
      { id: 'env4', text: 'Are operational controls implemented for processes associated with significant environmental aspects (emissions, waste, water)?', standard: 'ISO 14001', clause: '8.1', category: 'Operational Control', aiHint: 'Inspect waste segregation, emission controls, and wastewater treatment systems.', riskWeight: 9 },
      { id: 'env5', text: 'Are emergency preparedness and response procedures established for potential environmental emergencies (spills, releases)?', standard: 'ISO 14001', clause: '8.2', category: 'Emergency Preparedness', aiHint: 'Check spill kits, containment systems, and drill records for environmental scenarios.', riskWeight: 9 },
      { id: 'env6', text: 'Are key characteristics of operations that can have significant environmental impact monitored, measured, and analyzed?', standard: 'ISO 14001', clause: '9.1.1', category: 'Monitoring & Measurement', aiHint: 'Review emission monitoring data, waste tracking, and water consumption metrics.', riskWeight: 8 },
    ]
  }
];

export const AIAuditTemplateForm: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTemplateId = queryParams.get('id');

  // ── Backend hooks ─────────────────────────────────────────────────────────
  const { data: backendCustomTemplates } = useAuditFormCustomTemplates();
  const saveCustomTemplateMutation = useSaveAuditCustomTemplateMutation();
  const saveSessionMutation = useSaveAuditFormSessionMutation();
  const auditAnalysisMutation = useAuditAnalysisMutation();

  const [customTemplates, setCustomTemplates] = useState<AuditTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AuditTemplate | null>(null);

  useEffect(() => {
    if (initialTemplateId) {
      const found = [...AUDIT_TEMPLATES, ...customTemplates].find(t => t.id === initialTemplateId);
      if (found) setSelectedTemplate(found);
    }
  }, [initialTemplateId, customTemplates]);
  const [answers, setAnswers] = useState<Record<string, { status: 'compliant' | 'non-compliant' | 'na', notes: string }>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [showCustomBuilder, setShowCustomBuilder] = useState(false);
  const [customTemplateName, setCustomTemplateName] = useState('');
  const [customStandard, setCustomStandard] = useState<'ISO' | 'OSHA' | 'Cal/OSHA' | 'BSEE' | 'ASME' | 'ANSI' | 'NFPA' | 'API' | 'Multi-Standard' | 'EU' | 'MSHA' | 'IMO' | 'IATA' | 'WHO' | 'HACCP' | 'DOT' | 'CSA' | 'AS/NZS' | 'NEBOSH' | 'GCC' | 'Custom'>('Custom');
  const [evidencePhotos, setEvidencePhotos] = useState<Record<string, { file: File; preview: string; timestamp: string }[]>>({});
  const [globalEvidencePhotos, setGlobalEvidencePhotos] = useState<{ file: File; preview: string; timestamp: string }[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [activePhotoQuestion, setActivePhotoQuestion] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const globalFileInputRef = React.useRef<HTMLInputElement>(null);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [customCategoryInput, setCustomCategoryInput] = useState('');
  const [customQuestions, setCustomQuestions] = useState<AuditQuestion[]>([]);
  const [newQuestionText, setNewQuestionText] = useState('');
  const [newQuestionStandard, setNewQuestionStandard] = useState('');
  const [newQuestionClause, setNewQuestionClause] = useState('');
  const [newQuestionCategory, setNewQuestionCategory] = useState('');
  const [newQuestionWeight, setNewQuestionWeight] = useState(5);
  const [isExporting, setIsExporting] = useState(false);
  const [visualEvidence, setVisualEvidence] = useState<{ photos: number; videos: number; scans: number }>({ photos: 0, videos: 0, scans: 0 });
  const [searchFilter, setSearchFilter] = useState('');

  // Hydrate persisted custom templates from backend on first load
  useEffect(() => {
    if (backendCustomTemplates && backendCustomTemplates.length > 0) {
      const localIds = new Set(customTemplates.map(t => t.id));
      const incoming = backendCustomTemplates.filter(t => !localIds.has(t.id));
      if (incoming.length > 0) {
        setCustomTemplates(prev => [...prev, ...incoming]);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [backendCustomTemplates]);

  const handleAnswerChange = (questionId: string, status: 'compliant' | 'non-compliant' | 'na') => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], status }
    }));
  };

  const handleNoteChange = (questionId: string, notes: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: { ...prev[questionId], notes }
    }));
  };

  const calculateRiskScore = useMemo(() => {
    if (!selectedTemplate) return 0;
    let totalWeight = 0;
    let compliantWeight = 0;
    
    selectedTemplate.questions.forEach(q => {
      totalWeight += q.riskWeight;
      if (answers[q.id]?.status === 'compliant') {
        compliantWeight += q.riskWeight;
      } else if (answers[q.id]?.status === 'na') {
        totalWeight -= q.riskWeight;
      }
    });

    return totalWeight > 0 ? Math.round((compliantWeight / totalWeight) * 100) : 100;
  }, [selectedTemplate, answers]);

  const generateAiSummary = useCallback(async () => {
    if (!selectedTemplate) return;
    setIsAnalyzing(true);
    try {
      const result = await auditAnalysisMutation.mutate({
        templateId: selectedTemplate.id,
        templateName: selectedTemplate.name,
        standard: selectedTemplate.standard,
        answers,
        complianceScore: calculateRiskScore,
        questions: selectedTemplate.questions.map(q => ({
          id: q.id,
          text: q.text,
          standard: q.standard,
          clause: q.clause,
          category: q.category,
          riskWeight: q.riskWeight,
        })),
      });
      if (result?.summary) {
        setAiSummary(result.summary);
      }
    } finally {
      setIsAnalyzing(false);
    }
  }, [selectedTemplate, answers, calculateRiskScore, auditAnalysisMutation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTemplate) return;

    const compliantCount = Object.values(answers).filter(a => a.status === 'compliant').length;
    const nonCompliantCount = Object.values(answers).filter(a => a.status === 'non-compliant').length;
    const naCount = Object.values(answers).filter(a => a.status === 'na').length;
    const evidencePhotosCount =
      Object.values(evidencePhotos).reduce((acc, photos) => acc + photos.length, 0) +
      globalEvidencePhotos.length;

    await saveSessionMutation.mutate({
      templateId: selectedTemplate.id,
      templateName: selectedTemplate.name,
      templateStandard: selectedTemplate.standard,
      answers,
      complianceScore: calculateRiskScore,
      aiSummary: aiSummary ?? null,
      totalQuestions: selectedTemplate.questions.length,
      compliantCount,
      nonCompliantCount,
      naCount,
      evidencePhotosCount,
      isCustomTemplate: selectedTemplate.id.startsWith('custom-'),
    });

    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      navigate('/safety-hub');
    }, 3000);
  };

  const handleExportPDF = async () => {
    if (!selectedTemplate) return;
    setIsExporting(true);
    try {
      const questionResults: AuditQuestionResult[] = selectedTemplate.questions.map(q => ({
        id: q.id,
        text: q.text,
        standard: q.standard,
        clause: q.clause,
        category: q.category,
        status: answers[q.id]?.status || 'na',
        notes: answers[q.id]?.notes || '',
        riskWeight: q.riskWeight,
      }));

      const reportData: AuditReportData = {
        templateName: selectedTemplate.name,
        templateStandard: selectedTemplate.standard,
        templateVersion: selectedTemplate.version,
        auditDate: new Date().toLocaleDateString(),
        auditorName: 'Current User',
        location: 'Facility / Site',
        department: 'Safety Department',
        overallScore: calculateRiskScore,
        aiSummary: aiSummary || undefined,
        questions: questionResults,
        complianceStandards: ['ISO', 'OSHA', 'Cal/OSHA', 'BSEE', 'ASME', 'ANSI', 'NFPA', 'EU', 'MSHA', 'IMO', 'IATA', 'WHO', 'HACCP', 'DOT', 'CSA', 'AS/NZS', 'NEBOSH', 'GCC'],
        visualEvidenceCount: visualEvidence,
      };

      downloadAuditReport(reportData);
    } catch (err) {
      console.error('PDF export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddCustomCategory = () => {
    if (customCategoryInput.trim() && !customCategories.includes(customCategoryInput.trim())) {
      setCustomCategories([...customCategories, customCategoryInput.trim()]);
      setCustomCategoryInput('');
    }
  };

  const handleAddCustomQuestion = () => {
    if (!newQuestionText.trim() || !newQuestionCategory) return;
    const newQ: AuditQuestion = {
      id: `cq-${Date.now()}`,
      text: newQuestionText.trim(),
      standard: newQuestionStandard || customStandard,
      clause: newQuestionClause || undefined,
      category: newQuestionCategory,
      aiHint: 'Custom question — AI will provide contextual guidance.',
      riskWeight: newQuestionWeight,
    };
    setCustomQuestions([...customQuestions, newQ]);
    setNewQuestionText('');
    setNewQuestionClause('');
    setNewQuestionStandard('');
  };

  // Evidence photo upload handlers
  const handlePhotoUpload = (questionId: string, files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
    }));
    setEvidencePhotos(prev => ({
      ...prev,
      [questionId]: [...(prev[questionId] || []), ...newPhotos],
    }));
    setVisualEvidence(prev => ({ ...prev, photos: prev.photos + newPhotos.length }));
  };

  const handleGlobalPhotoUpload = (files: FileList | null) => {
    if (!files) return;
    const newPhotos = Array.from(files).filter(f => f.type.startsWith('image/')).map(file => ({
      file,
      preview: URL.createObjectURL(file),
      timestamp: new Date().toISOString(),
    }));
    setGlobalEvidencePhotos(prev => [...prev, ...newPhotos]);
    setVisualEvidence(prev => ({ ...prev, photos: prev.photos + newPhotos.length }));
  };

  const removeEvidencePhoto = (questionId: string, index: number) => {
    setEvidencePhotos(prev => {
      const updated = { ...prev };
      if (updated[questionId]) {
        URL.revokeObjectURL(updated[questionId][index].preview);
        updated[questionId] = updated[questionId].filter((_, i) => i !== index);
      }
      return updated;
    });
    setVisualEvidence(prev => ({ ...prev, photos: Math.max(0, prev.photos - 1) }));
  };

  const removeGlobalPhoto = (index: number) => {
    setGlobalEvidencePhotos(prev => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
    setVisualEvidence(prev => ({ ...prev, photos: Math.max(0, prev.photos - 1) }));
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = () => setIsDragging(false);
  const handleDrop = (e: React.DragEvent, questionId?: string) => {
    e.preventDefault(); setIsDragging(false);
    if (questionId) { handlePhotoUpload(questionId, e.dataTransfer.files); }
    else { handleGlobalPhotoUpload(e.dataTransfer.files); }
  };

  const handleSaveCustomTemplate = async () => {
    if (!customTemplateName.trim() || customQuestions.length === 0) return;
    const newTemplate: AuditTemplate = {
      id: `custom-${Date.now()}`,
      name: customTemplateName,
      standard: customStandard,
      version: 'Custom',
      description: `Custom audit template with ${customQuestions.length} questions across ${customCategories.length} categories.`,
      categories: customCategories,
      questions: customQuestions,
    };

    // Persist to backend (fire-and-forget — local state update is immediate)
    saveCustomTemplateMutation.mutate({
      id: newTemplate.id,
      name: newTemplate.name,
      standard: newTemplate.standard,
      version: newTemplate.version,
      description: newTemplate.description,
      categories: newTemplate.categories,
      questions: newTemplate.questions,
    });

    setCustomTemplates(prev => [...prev, newTemplate]);
    setSelectedTemplate(newTemplate);
    setShowCustomBuilder(false);
    setCustomTemplateName('');
    setCustomCategories([]);
    setCustomQuestions([]);
  };

  const allTemplates = [...AUDIT_TEMPLATES, ...customTemplates];
  const filteredTemplates = searchFilter 
    ? allTemplates.filter(t => t.name.toLowerCase().includes(searchFilter.toLowerCase()) || t.standard.toLowerCase().includes(searchFilter.toLowerCase()))
    : allTemplates;

  return (
    <div className="min-h-screen bg-surface-950 text-white pb-24 selection:bg-brand-500/30">
      {/* HD Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-brand-500/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-500/5 blur-[150px] rounded-full" />
      </div>

      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-900/60 backdrop-blur-2xl border-b border-surface-800 shrink-0">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-800 rounded-xl text-surface-400 transition-all group"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-violet-600 flex items-center justify-center shadow-lg shadow-brand-500/20">
                  <ClipboardCheck className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white leading-tight">AI Audit Form</h1>
                  <p className="text-[11px] text-surface-400 uppercase tracking-widest font-medium">Standard Compliance Intelligence</p>
                </div>
              </div>
            </div>

            {selectedTemplate && (
              <div className="hidden md:flex items-center gap-4 px-4 border-l border-surface-800">
                <div className="text-right">
                  <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Compliance Score</p>
                  <p className={`text-lg font-black ${calculateRiskScore > 80 ? 'text-emerald-400' : calculateRiskScore > 50 ? 'text-amber-400' : 'text-red-400'}`}>
                    {calculateRiskScore}%
                  </p>
                  {(Object.values(evidencePhotos).flat().length + globalEvidencePhotos.length > 0) && (
                    <p className="text-[9px] text-blue-400 font-bold mt-1">📷 {Object.values(evidencePhotos).flat().length + globalEvidencePhotos.length} Evidence</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 relative z-10">
        {!selectedTemplate ? (
          <div className="space-y-8">
            <div className="text-center max-w-2xl mx-auto">
              <h2 className="text-3xl font-black text-white mb-4">Select Audit Standard</h2>
              <p className="text-surface-400 mb-2">Choose a standard template or build your own custom audit checklist.</p>
              <p className="text-xs text-surface-500 mb-4">21 built-in templates covering global safety regulations: OSHA, ISO, EU, MSHA, IMO, IATA, WHO, HACCP, DOT, CSA, AS/NZS, NEBOSH, GCC and more</p>
              
              {/* Search and Custom Builder buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-500" />
                  <input
                    type="text"
                    placeholder="Search templates (ISO, OSHA, Cal/OSHA, BSEE, ANSI, NFPA...)"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-surface-800/50 border border-surface-700 rounded-2xl text-sm text-white placeholder:text-surface-500 focus:outline-none focus:ring-2 focus:ring-brand-500/30 focus:border-brand-500 transition-all"
                  />
                </div>
                <button
                  onClick={() => setShowCustomBuilder(true)}
                  className="px-6 py-3 bg-gradient-to-r from-violet-600 to-brand-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:shadow-lg hover:shadow-brand-500/20 transition-all flex items-center gap-2 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  Build Custom Template
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredTemplates.map(template => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template)}
                  className="group p-8 bg-surface-900/40 border border-surface-800 rounded-[2.5rem] text-left hover:border-brand-500/50 transition-all hover:shadow-2xl hover:shadow-brand-500/5 relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                    {template.standard === 'ISO' ? <Globe className="w-32 h-32" /> : template.standard === 'OSHA' ? <Shield className="w-32 h-32" /> : template.standard === 'ASME' ? <Wrench className="w-32 h-32" /> : template.standard === 'Multi-Standard' ? <ClipboardCheck className="w-32 h-32" /> : template.standard === 'Cal/OSHA' ? <Shield className="w-32 h-32" /> : template.standard === 'BSEE' ? <Globe className="w-32 h-32" /> : template.standard === 'ANSI' ? <Scale className="w-32 h-32" /> : template.standard === 'NFPA' ? <AlertTriangle className="w-32 h-32" /> : template.standard === 'EU' ? <Globe className="w-32 h-32" /> : template.standard === 'MSHA' ? <Mountain className="w-32 h-32" /> : template.standard === 'IMO' ? <Globe className="w-32 h-32" /> : template.standard === 'IATA' ? <Globe className="w-32 h-32" /> : template.standard === 'WHO' ? <Stethoscope className="w-32 h-32" /> : template.standard === 'HACCP' ? <ClipboardCheck className="w-32 h-32" /> : template.standard === 'DOT' ? <Truck className="w-32 h-32" /> : template.standard === 'CSA' ? <Shield className="w-32 h-32" /> : template.standard === 'AS/NZS' ? <Globe className="w-32 h-32" /> : template.standard === 'NEBOSH' ? <HardHat className="w-32 h-32" /> : template.standard === 'GCC' ? <Building2 className="w-32 h-32" /> : template.standard === 'Custom' ? <Sparkles className="w-32 h-32" /> : <Activity className="w-32 h-32" />}
                  </div>
                  <div className="relative z-10">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${
                      template.standard === 'ISO' ? 'bg-blue-500/20 text-blue-400' : 
                      template.standard === 'OSHA' ? 'bg-red-500/20 text-red-400' : 
                      template.standard === 'ASME' ? 'bg-amber-500/20 text-amber-400' : 
                      template.standard === 'Multi-Standard' ? 'bg-emerald-500/20 text-emerald-400' :
                      template.standard === 'Cal/OSHA' ? 'bg-yellow-500/20 text-yellow-400' :
                      template.standard === 'BSEE' ? 'bg-cyan-500/20 text-cyan-400' :
                      template.standard === 'ANSI' ? 'bg-violet-500/20 text-violet-400' :
                      template.standard === 'NFPA' ? 'bg-orange-500/20 text-orange-400' :
                      template.standard === 'EU' ? 'bg-indigo-500/20 text-indigo-400' :
                      template.standard === 'MSHA' ? 'bg-stone-500/20 text-stone-400' :
                      template.standard === 'IMO' ? 'bg-sky-500/20 text-sky-400' :
                      template.standard === 'IATA' ? 'bg-blue-600/20 text-blue-300' :
                      template.standard === 'WHO' ? 'bg-teal-500/20 text-teal-400' :
                      template.standard === 'HACCP' ? 'bg-lime-500/20 text-lime-400' :
                      template.standard === 'DOT' ? 'bg-rose-500/20 text-rose-400' :
                      template.standard === 'CSA' ? 'bg-red-600/20 text-red-300' :
                      template.standard === 'AS/NZS' ? 'bg-green-500/20 text-green-400' :
                      template.standard === 'NEBOSH' ? 'bg-fuchsia-500/20 text-fuchsia-400' :
                      template.standard === 'GCC' ? 'bg-amber-600/20 text-amber-300' :
                      template.standard === 'Custom' ? 'bg-pink-500/20 text-pink-400' :
                      'bg-purple-500/20 text-purple-400'
                    }`}>
                      {template.standard === 'ISO' ? <Globe className="w-6 h-6" /> : 
                       template.standard === 'OSHA' ? <Shield className="w-6 h-6" /> : 
                       template.standard === 'ASME' ? <Wrench className="w-6 h-6" /> : 
                       template.standard === 'Multi-Standard' ? <ClipboardCheck className="w-6 h-6" /> :
                       template.standard === 'Cal/OSHA' ? <Shield className="w-6 h-6" /> :
                       template.standard === 'BSEE' ? <Globe className="w-6 h-6" /> :
                       template.standard === 'ANSI' ? <Scale className="w-6 h-6" /> :
                       template.standard === 'NFPA' ? <AlertTriangle className="w-6 h-6" /> :
                       template.standard === 'EU' ? <Globe className="w-6 h-6" /> :
                       template.standard === 'MSHA' ? <Mountain className="w-6 h-6" /> :
                       template.standard === 'IMO' ? <Globe className="w-6 h-6" /> :
                       template.standard === 'IATA' ? <Globe className="w-6 h-6" /> :
                       template.standard === 'WHO' ? <Stethoscope className="w-6 h-6" /> :
                       template.standard === 'HACCP' ? <ClipboardCheck className="w-6 h-6" /> :
                       template.standard === 'DOT' ? <Truck className="w-6 h-6" /> :
                       template.standard === 'CSA' ? <Shield className="w-6 h-6" /> :
                       template.standard === 'AS/NZS' ? <Globe className="w-6 h-6" /> :
                       template.standard === 'NEBOSH' ? <HardHat className="w-6 h-6" /> :
                       template.standard === 'GCC' ? <Building2 className="w-6 h-6" /> :
                       template.standard === 'Custom' ? <Sparkles className="w-6 h-6" /> :
                       <Activity className="w-6 h-6" />}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">{template.name}</h3>
                    <p className="text-sm text-surface-400 mb-6 line-clamp-2">{template.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black text-brand-400 uppercase tracking-widest">
                      <span>{template.questions.length} Questions</span>
                      <span className="w-1 h-1 rounded-full bg-surface-700" />
                      <span>v{template.version}</span>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Template Builder Modal */}
            <AnimatePresence>
              {showCustomBuilder && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="bg-surface-900 border border-surface-800 rounded-[2.5rem] max-w-3xl w-full p-8 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-brand-500 flex items-center justify-center">
                          <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-black text-white">Custom Template Builder</h2>
                          <p className="text-xs text-surface-400">Create your own audit checklist with standard mapping</p>
                        </div>
                      </div>
                      <button onClick={() => setShowCustomBuilder(false)} className="p-2 rounded-lg hover:bg-surface-800 transition-colors">
                        <X className="w-5 h-5 text-surface-400" />
                      </button>
                    </div>

                    <div className="space-y-6">
                      {/* Template Name & Standard */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 block">Template Name</label>
                          <input
                            type="text"
                            value={customTemplateName}
                            onChange={(e) => setCustomTemplateName(e.target.value)}
                            placeholder="e.g., Facility Safety Walkthrough"
                            className="w-full p-3 bg-surface-800/50 border border-surface-700 rounded-xl text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 block">Primary Standard</label>
                          <select
                            value={customStandard}
                            onChange={(e) => setCustomStandard(e.target.value as any)}
                            className="w-full p-3 bg-surface-800/50 border border-surface-700 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          >
                            <option value="Custom">Custom</option>
                            <option value="ISO">ISO 45001</option>
                            <option value="OSHA">OSHA</option>
                            <option value="Cal/OSHA">Cal/OSHA</option>
                            <option value="BSEE">BSEE</option>
                            <option value="ASME">ASME</option>
                            <option value="ANSI">ANSI</option>
                            <option value="NFPA">NFPA</option>
                            <option value="API">API</option>
                            <option value="Multi-Standard">Multi-Standard</option>
                            <option value="EU">EU Framework Directive</option>
                            <option value="MSHA">MSHA (Mining)</option>
                            <option value="IMO">IMO/SOLAS (Maritime)</option>
                            <option value="IATA">IATA/ICAO (Aviation)</option>
                            <option value="WHO">WHO/JCI (Healthcare)</option>
                            <option value="HACCP">HACCP/FDA (Food Safety)</option>
                            <option value="DOT">DOT/FMCSA (Transportation)</option>
                            <option value="CSA">CSA (Canada)</option>
                            <option value="AS/NZS">AS/NZS (Australia/NZ)</option>
                            <option value="NEBOSH">NEBOSH/UK HSE</option>
                            <option value="GCC">GCC/OSHAD (Gulf States)</option>
                          </select>
                        </div>
                      </div>

                      {/* Categories Builder */}
                      <div>
                        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 block">Categories</label>
                        <div className="flex gap-2 flex-wrap mb-3">
                          {customCategories.map((cat, i) => (
                            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-brand-500/20 text-brand-400 rounded-full text-xs font-bold">
                              {cat}
                              <button onClick={() => setCustomCategories(customCategories.filter((_, idx) => idx !== i))}>
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={customCategoryInput}
                            onChange={(e) => setCustomCategoryInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomCategory())}
                            placeholder="Add a category (e.g., PPE, Fall Protection)"
                            className="flex-1 p-3 bg-surface-800/50 border border-surface-700 rounded-xl text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30"
                          />
                          <SMButton variant="icon" onClick={handleAddCustomCategory}><Plus className="w-4 h-4" /></SMButton>
                        </div>
                      </div>

                      {/* Question Builder */}
                      <div>
                        <label className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-2 block">Add Questions ({customQuestions.length} added)</label>
                        <div className="space-y-3 p-4 bg-surface-800/30 rounded-2xl border border-surface-700/50">
                          <textarea
                            value={newQuestionText}
                            onChange={(e) => setNewQuestionText(e.target.value)}
                            placeholder="Enter the audit question..."
                            rows={2}
                            className="w-full p-3 bg-surface-800/50 border border-surface-700 rounded-xl text-sm text-white placeholder:text-surface-600 focus:outline-none focus:ring-2 focus:ring-brand-500/30 resize-none"
                          />
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            <input type="text" value={newQuestionStandard} onChange={(e) => setNewQuestionStandard(e.target.value)} placeholder="Standard (e.g., OSHA)" className="p-2 bg-surface-800/50 border border-surface-700 rounded-lg text-xs text-white placeholder:text-surface-600 focus:outline-none" />
                            <input type="text" value={newQuestionClause} onChange={(e) => setNewQuestionClause(e.target.value)} placeholder="Clause (e.g., 1910.132)" className="p-2 bg-surface-800/50 border border-surface-700 rounded-lg text-xs text-white placeholder:text-surface-600 focus:outline-none" />
                            <select value={newQuestionCategory} onChange={(e) => setNewQuestionCategory(e.target.value)} className="p-2 bg-surface-800/50 border border-surface-700 rounded-lg text-xs text-white focus:outline-none">
                              <option value="">Select Category</option>
                              {customCategories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-surface-500 font-bold">Risk:</span>
                              <input type="range" min={1} max={10} value={newQuestionWeight} onChange={(e) => setNewQuestionWeight(Number(e.target.value))} className="flex-1" />
                              <span className="text-xs text-white font-bold w-4">{newQuestionWeight}</span>
                            </div>
                          </div>
                          <button
                            onClick={handleAddCustomQuestion}
                            disabled={!newQuestionText.trim() || !newQuestionCategory}
                            className="w-full py-2 bg-violet-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest hover:bg-violet-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            <Plus className="w-3 h-3" />
                            Add Question
                          </button>
                        </div>

                        {/* Existing custom questions */}
                        {customQuestions.length > 0 && (
                          <div className="mt-4 space-y-2 max-h-48 overflow-y-auto">
                            {customQuestions.map((q, i) => (
                              <div key={q.id} className="flex items-start justify-between p-3 bg-surface-800/30 rounded-xl border border-surface-700/50">
                                <div className="flex-1">
                                  <p className="text-xs text-white font-medium">{q.text}</p>
                                  <p className="text-[9px] text-surface-500 mt-1">{q.standard} {q.clause} • {q.category} • Weight: {q.riskWeight}</p>
                                </div>
                                <button onClick={() => setCustomQuestions(customQuestions.filter((_, idx) => idx !== i))} className="p-1 text-surface-500 hover:text-red-400">
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Save Custom Template */}
                      <button
                        onClick={handleSaveCustomTemplate}
                        disabled={!customTemplateName.trim() || customQuestions.length === 0}
                        className="w-full py-4 bg-gradient-to-r from-brand-500 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-lg hover:shadow-brand-500/20 transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                      >
                        <Save className="w-4 h-4" />
                        Save & Start Audit ({customQuestions.length} Questions)
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Template Info & AI Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-black text-white">{selectedTemplate.name}</h2>
                    <button 
                      type="button"
                      onClick={() => setSelectedTemplate(null)}
                      className="text-[10px] font-black text-surface-500 uppercase tracking-widest hover:text-white transition-colors"
                    >
                      Change Template
                    </button>
                  </div>
                  <p className="text-surface-400 text-sm leading-relaxed">{selectedTemplate.description}</p>
                </div>

                {/* AI Insights Section */}
                <div className="bg-gradient-to-br from-brand-600/20 to-violet-600/20 border border-brand-500/30 rounded-[2.5rem] p-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Brain className="w-24 h-24 text-white" />
                  </div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-brand-500 flex items-center justify-center shadow-lg shadow-brand-500/40">
                        <Sparkles className="w-5 h-5 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-white">AI Audit Assistant</h3>
                    </div>
                    
                    {aiSummary ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-6 bg-surface-950/50 backdrop-blur-xl rounded-3xl border border-white/5"
                      >
                        <p className="text-sm text-brand-100 leading-relaxed italic">"{aiSummary}"</p>
                      </motion.div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <p className="text-surface-400 text-sm mb-6">Complete the audit questions to generate an intelligent summary and risk forecast.</p>
                        <button
                          type="button"
                          onClick={generateAiSummary}
                          disabled={isAnalyzing || Object.keys(answers).length === 0}
                          className="px-6 py-3 bg-white text-slate-900 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                          {isAnalyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          Generate AI Summary
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Audit Progress</h3>
                  <div className="relative h-4 bg-surface-800 rounded-full overflow-hidden mb-4">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(Object.keys(answers).length / selectedTemplate.questions.length) * 100}%` }}
                      className="h-full bg-brand-500 shadow-[0_0_15px_rgba(20,184,166,0.5)]"
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-surface-500 font-bold uppercase tracking-widest">
                    <span>{Object.keys(answers).length} of {selectedTemplate.questions.length} Answered</span>
                    <span>{Math.round((Object.keys(answers).length / selectedTemplate.questions.length) * 100)}%</span>
                  </div>
                </div>

                <div className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] p-8 backdrop-blur-md">
                  <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-widest">Quick Actions</h3>
                  <div className="space-y-3">
                    <button 
                      type="button" 
                      onClick={handleExportPDF}
                      disabled={isExporting || Object.keys(answers).length === 0}
                      className="w-full py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-surface-700 flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      <Download className="w-4 h-4" />
                      {isExporting ? 'Generating PDF...' : 'Export Audit Report'}
                    </button>
                    <button type="button" className="w-full py-3 bg-surface-800 hover:bg-surface-700 text-white rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all border border-surface-700 flex items-center justify-center gap-2">
                      <Printer className="w-4 h-4" />
                      Print Preview
                    </button>
                  </div>

                  {/* Visual Evidence Tracking */}
                  <div className="mt-6">
                    <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Visual Evidence</h3>
                    <div className="space-y-3">
                      {[
                        { key: 'photos' as const, label: 'Photos', icon: Camera, color: 'text-blue-400' },
                        { key: 'videos' as const, label: 'Videos', icon: Video, color: 'text-violet-400' },
                        { key: 'scans' as const, label: 'QR/Barcode Scans', icon: Scan, color: 'text-emerald-400' },
                      ].map(item => (
                        <div key={item.key} className="flex items-center justify-between p-3 bg-surface-800/30 rounded-xl border border-surface-700/50">
                          <div className="flex items-center gap-2">
                            <item.icon className={`w-4 h-4 ${item.color}`} />
                            <span className="text-xs text-surface-300 font-medium">{item.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button 
                              type="button"
                              onClick={() => setVisualEvidence(prev => ({ ...prev, [item.key]: Math.max(0, prev[item.key] - 1) }))}
                              className="w-6 h-6 rounded bg-surface-700 flex items-center justify-center text-surface-400 hover:text-white text-xs"
                            >
                              -
                            </button>
                            <span className="text-sm font-bold text-white w-6 text-center">{visualEvidence[item.key]}</span>
                            <button 
                              type="button"
                              onClick={() => setVisualEvidence(prev => ({ ...prev, [item.key]: prev[item.key] + 1 }))}
                              className="w-6 h-6 rounded bg-surface-700 flex items-center justify-center text-surface-400 hover:text-white text-xs"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      ))}
                      <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                        <p className="text-[9px] text-emerald-400 font-bold text-center uppercase tracking-widest">
                          ✓ Synced to ISO • OSHA • Cal/OSHA • BSEE • ASME • ANSI • NFPA • EU • MSHA • IMO • IATA • WHO • HACCP • DOT • CSA • AS/NZS • NEBOSH • GCC
                        </p>
                      </div>

                      {/* Global Evidence Photo Upload */}
                      <div className="mt-4 space-y-3">
                        <h4 className="text-[10px] font-black text-surface-400 uppercase tracking-widest flex items-center gap-2">
                          <Upload className="w-3.5 h-3.5" /> Upload Evidence Photos
                        </h4>
                        <div
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={(e) => handleDrop(e)}
                          className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-surface-700 hover:border-surface-600'}`}
                          onClick={() => globalFileInputRef.current?.click()}
                        >
                          <Camera className="w-6 h-6 text-surface-500 mx-auto mb-2" />
                          <p className="text-[10px] text-surface-500 font-medium">Drop photos here or click to upload</p>
                          <p className="text-[9px] text-surface-600 mt-1">General audit evidence</p>
                        </div>
                        <input
                          ref={globalFileInputRef}
                          type="file"
                          accept="image/*"
                          multiple
                          className="hidden"
                          onChange={(e) => handleGlobalPhotoUpload(e.target.files)}
                        />
                        {globalEvidencePhotos.length > 0 && (
                          <div className="grid grid-cols-3 gap-2">
                            {globalEvidencePhotos.map((photo, i) => (
                              <div key={i} className="relative group aspect-square rounded-xl overflow-hidden border border-surface-700">
                                <img src={photo.preview} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <button type="button" onClick={() => removeGlobalPhoto(i)} className="p-1.5 bg-red-500 rounded-full">
                                    <X className="w-3 h-3 text-white" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hidden File Input for Per-Question Evidence */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => { if (activePhotoQuestion) handlePhotoUpload(activePhotoQuestion, e.target.files); e.target.value = ''; }}
            />

            {/* Questions List */}
            <div className="space-y-6">
              {selectedTemplate.categories.map(category => {
                const categoryQuestions = selectedTemplate.questions.filter(q => q.category === category);
                const isExpanded = expandedCategory === category;
                
                return (
                  <div key={category} className="bg-surface-900/40 border border-surface-800 rounded-[2.5rem] overflow-hidden transition-all">
                    <button
                      type="button"
                      onClick={() => setExpandedCategory(isExpanded ? null : category)}
                      className="w-full p-8 flex items-center justify-between hover:bg-surface-800/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-surface-800 flex items-center justify-center">
                          <Target className="w-5 h-5 text-brand-400" />
                        </div>
                        <div className="text-left">
                          <h3 className="text-xl font-bold text-white">{category}</h3>
                          <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold">{categoryQuestions.length} Requirements</p>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-6 h-6 text-surface-500" /> : <ChevronDown className="w-6 h-6 text-surface-500" />}
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="p-8 pt-0 space-y-8 border-t border-surface-800/50">
                            {categoryQuestions.map((q, idx) => (
                              <div key={q.id} className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                      <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 text-[9px] font-black uppercase tracking-tighter border border-brand-500/20">
                                        {q.standard} {q.clause}
                                      </span>
                                      <span className="text-[9px] text-surface-600 font-bold uppercase tracking-widest">Weight: {q.riskWeight}</span>
                                    </div>
                                    <h4 className="text-lg font-bold text-white leading-snug">{q.text}</h4>
                                    
                                    {/* AI Hint */}
                                    <div className="mt-4 p-4 bg-violet-500/5 border border-violet-500/10 rounded-2xl flex items-start gap-3">
                                      <Brain className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
                                      <p className="text-xs text-surface-400 leading-relaxed">
                                        <span className="font-black text-violet-300 uppercase tracking-tighter mr-2">AI Auditor Hint:</span>
                                        {q.aiHint}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex flex-col gap-2 shrink-0">
                                    <div className="flex bg-surface-800 p-1 rounded-xl border border-surface-700">
                                      {[
                                        { id: 'compliant', label: 'Compliant', color: 'bg-emerald-500' },
                                        { id: 'non-compliant', label: 'Non-Compliant', color: 'bg-red-500' },
                                        { id: 'na', label: 'N/A', color: 'bg-surface-600' }
                                      ].map(opt => (
                                        <button
                                          key={opt.id}
                                          type="button"
                                          onClick={() => handleAnswerChange(q.id, opt.id as any)}
                                          className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                                            answers[q.id]?.status === opt.id 
                                              ? `${opt.color} text-white shadow-lg` 
                                              : 'text-surface-500 hover:text-white'
                                          }`}
                                        >
                                          {opt.label}
                                        </button>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <textarea
                                  placeholder="Add inspection notes, evidence references, or corrective actions..."
                                  value={answers[q.id]?.notes || ''}
                                  onChange={(e) => handleNoteChange(q.id, e.target.value)}
                                  className="w-full p-4 bg-surface-800/50 border border-surface-700 rounded-2xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all resize-none"
                                  rows={2}
                                />

                                {/* Evidence Photo Upload Per Question */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-surface-400 uppercase tracking-widest flex items-center gap-2">
                                      <Camera className="w-3.5 h-3.5" /> Evidence Photos
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => { setActivePhotoQuestion(q.id); fileInputRef.current?.click(); }}
                                      className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold uppercase tracking-widest hover:bg-blue-500/30 transition-all flex items-center gap-1.5"
                                    >
                                      <Upload className="w-3 h-3" /> Upload Photo
                                    </button>
                                  </div>

                                  {/* Drag and Drop Zone */}
                                  <div
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={(e) => handleDrop(e, q.id)}
                                    className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer ${isDragging ? 'border-blue-400 bg-blue-500/10' : 'border-surface-700 hover:border-surface-600'}`}
                                    onClick={() => { setActivePhotoQuestion(q.id); fileInputRef.current?.click(); }}
                                  >
                                    <Image className="w-5 h-5 text-surface-500 mx-auto mb-2" />
                                    <p className="text-[10px] text-surface-500">Drag & drop photos or click to browse</p>
                                    <p className="text-[9px] text-surface-600 mt-1">JPG, PNG, HEIC • Max 10MB per file</p>
                                  </div>

                                  {/* Photo Preview Gallery */}
                                  {evidencePhotos[q.id] && evidencePhotos[q.id].length > 0 && (
                                    <div className="flex gap-2 flex-wrap">
                                      {evidencePhotos[q.id].map((photo, pi) => (
                                        <div key={pi} className="relative group w-20 h-20 rounded-xl overflow-hidden border border-surface-700">
                                          <img src={photo.preview} alt={`Evidence ${pi + 1}`} className="w-full h-full object-cover" />
                                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button
                                              type="button"
                                              onClick={(e) => { e.stopPropagation(); removeEvidencePhoto(q.id, pi); }}
                                              className="p-1 bg-red-500 rounded-full"
                                            >
                                              <X className="w-3 h-3 text-white" />
                                            </button>
                                          </div>
                                          <div className="absolute bottom-0 left-0 right-0 bg-black/70 py-0.5 px-1">
                                            <p className="text-[7px] text-white truncate">{new Date(photo.timestamp).toLocaleTimeString()}</p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                {idx < categoryQuestions.length - 1 && <div className="h-px bg-surface-800/50" />}
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Submit Section */}
            <div className="fixed bottom-0 left-0 right-0 p-6 pb-24 bg-surface-950/80 backdrop-blur-xl border-t border-surface-800 z-50">
              <div className="max-w-5xl mx-auto flex items-center justify-between gap-6">
                <div className="hidden md:block">
                  <p className="text-[10px] text-surface-500 uppercase tracking-widest font-bold mb-1">Current Compliance</p>
                  <p className="text-xl font-black text-white">{calculateRiskScore}%</p>
                </div>
                <div className="flex-1 flex justify-end gap-4">
                  <button 
                    type="button"
                    onClick={() => navigate(-1)}
                    className="px-8 py-4 bg-surface-800 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-surface-700 transition-all"
                  >
                    Save Draft
                  </button>
                  <button 
                    type="submit"
                    className="px-12 py-4 bg-brand-500 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20 active:scale-95"
                  >
                    Submit Final Audit
                  </button>
                </div>
              </div>
            </div>
          </form>
        )}
      </main>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-900 border border-surface-800 p-12 rounded-[3rem] max-w-sm w-full text-center space-y-6 shadow-2xl"
            >
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div>
                <h2 className="text-3xl font-black text-white">Audit Submitted!</h2>
                <p className="text-surface-400 mt-2">Your standard compliance audit has been recorded and synced with the Global Hub.</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Helper component for the refresh icon
const RefreshCw: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
    <path d="M3 21v-5h5" />
  </svg>
);

// Helper component for Wrench icon (already imported via lucide)
export default AIAuditTemplateForm;
