import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldAlert, AlertTriangle, Activity, Zap, Brain, CheckCircle2, XCircle,
  Clock, ChevronRight, ChevronDown, Lock, FileWarning, Server, Terminal, Eye,
  Target, Users, Phone, Mail, MessageSquare, Radio, Clipboard, FileText,
  PlayCircle, PauseCircle, SkipForward, ArrowRight, RefreshCw, Globe, AlertCircle,
  Fingerprint, Network, Database, Cpu, Bug, Search, BarChart3, TrendingUp
} from 'lucide-react';

interface IncidentPhase {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'active' | 'completed' | 'skipped';
  duration: string;
  actions: string[];
  assignee: string;
  tools: string[];
}

interface PlaybookTemplate {
  id: string;
  name: string;
  threatType: string;
  severity: 'critical' | 'high' | 'medium';
  description: string;
  estimatedDuration: string;
  phases: IncidentPhase[];
  lastUsed: string;
  successRate: number;
  timesExecuted: number;
}

const PLAYBOOKS: PlaybookTemplate[] = [
  {
    id: 'PB-001', name: 'Ransomware Containment & Recovery', threatType: 'Ransomware', severity: 'critical',
    description: 'Complete incident response for ransomware attacks including isolation, forensics, recovery, and post-incident review.',
    estimatedDuration: '4-8 hours', lastUsed: '2026-02-14', successRate: 98.2, timesExecuted: 47,
    phases: [
      { id: 'P1', name: 'Detection & Triage', description: 'Confirm ransomware variant, assess scope, activate CSIRT', status: 'completed', duration: '15m', actions: ['Validate AI alert', 'Identify ransomware family', 'Determine encryption scope', 'Activate incident commander'], assignee: 'SOC Analyst L2', tools: ['SIEM', 'EDR', 'Sandbox'] },
      { id: 'P2', name: 'Containment', description: 'Isolate affected systems, block C2 communications, preserve evidence', status: 'completed', duration: '30m', actions: ['Network segment isolation', 'Block C2 IPs at firewall', 'Disable affected accounts', 'Preserve memory dumps'], assignee: 'IR Lead', tools: ['Firewall', 'EDR', 'FTK Imager'] },
      { id: 'P3', name: 'Eradication', description: 'Remove malware, patch vulnerabilities, clean affected systems', status: 'active', duration: '2h', actions: ['Deploy removal scripts', 'Patch exploited CVEs', 'Reset compromised credentials', 'Update security signatures'], assignee: 'Malware Analyst', tools: ['AV Engine', 'Patch Mgmt', 'AD Tools'] },
      { id: 'P4', name: 'Recovery', description: 'Restore from backups, verify system integrity, resume operations', status: 'pending', duration: '3h', actions: ['Verify backup integrity', 'Restore critical systems first', 'Validate data integrity checksums', 'Gradual service restoration'], assignee: 'IT Operations', tools: ['Backup System', 'SCCM', 'Monitoring'] },
      { id: 'P5', name: 'Post-Incident Review', description: 'Document lessons learned, update playbooks, improve defenses', status: 'pending', duration: '1h', actions: ['Timeline reconstruction', 'Root cause analysis', 'Playbook updates', 'Compliance notifications'], assignee: 'CISO', tools: ['ITSM', 'Wiki', 'GRC Platform'] },
    ]
  },
  {
    id: 'PB-002', name: 'Data Breach Response', threatType: 'Data Exfiltration', severity: 'critical',
    description: 'Structured response for data breach incidents including forensic investigation, regulatory notification, and remediation.',
    estimatedDuration: '24-72 hours', lastUsed: '2026-02-10', successRate: 95.7, timesExecuted: 23,
    phases: [
      { id: 'P1', name: 'Breach Confirmation', description: 'Validate data breach scope, classify affected data types', status: 'completed', duration: '1h', actions: ['DLP log analysis', 'Classify data types (PII/PHI/PCI)', 'Determine record count', 'Identify threat actor'], assignee: 'Forensics Lead', tools: ['DLP Console', 'SIEM', 'Database Audit'] },
      { id: 'P2', name: 'Legal & Regulatory Notification', description: 'Notify legal counsel, assess regulatory obligations', status: 'active', duration: '4h', actions: ['Brief legal counsel', 'Determine notification requirements (GDPR 72hr)', 'Draft regulatory filings', 'Engage PR/communications'], assignee: 'Legal/Compliance', tools: ['GRC Platform', 'Email', 'Case Mgmt'] },
      { id: 'P3', name: 'Forensic Investigation', description: 'Full forensic analysis of breach vector and impact', status: 'pending', duration: '24h', actions: ['Network forensics', 'Endpoint forensics', 'Cloud audit trail review', 'Malware reverse engineering'], assignee: 'DFIR Team', tools: ['EnCase', 'Volatility', 'Wireshark'] },
      { id: 'P4', name: 'Remediation & Hardening', description: 'Close vulnerability, enhance controls, prevent recurrence', status: 'pending', duration: '8h', actions: ['Patch vulnerability', 'Enhance DLP rules', 'Implement additional access controls', 'Deploy monitoring'], assignee: 'Security Eng', tools: ['Patch Mgmt', 'DLP', 'IAM'] },
      { id: 'P5', name: 'Notification & Recovery', description: 'Notify affected individuals, offer remediation services', status: 'pending', duration: '48h', actions: ['Send breach notifications', 'Setup credit monitoring', 'Update privacy policies', 'Post-breach assessment'], assignee: 'Communications', tools: ['Email Platform', 'Website', 'Call Center'] },
    ]
  },
  {
    id: 'PB-003', name: 'OT/SCADA Security Incident', threatType: 'ICS/SCADA Attack', severity: 'critical',
    description: 'Specialized response for operational technology and industrial control system security incidents.',
    estimatedDuration: '6-12 hours', lastUsed: '2026-02-08', successRate: 99.1, timesExecuted: 12,
    phases: [
      { id: 'P1', name: 'OT Threat Validation', description: 'Confirm attack on OT environment, assess physical safety risk', status: 'completed', duration: '10m', actions: ['Verify OT alarm validity', 'Assess physical safety impact', 'Contact plant operations', 'Activate OT-CSIRT'], assignee: 'OT Security Lead', tools: ['OT Monitoring', 'SCADA HMI', 'Historian'] },
      { id: 'P2', name: 'Safety & Containment', description: 'Ensure physical safety, isolate OT from IT network', status: 'active', duration: '20m', actions: ['Switch to manual operations', 'Isolate IT-OT boundary', 'Enable safety instrumented systems', 'Physical walkdown verification'], assignee: 'Plant Operator', tools: ['SIS', 'Firewall', 'Physical Controls'] },
      { id: 'P3', name: 'OT Forensics', description: 'Capture OT traffic, analyze PLC logic, identify compromise', status: 'pending', duration: '4h', actions: ['Capture OT network traffic', 'Extract PLC ladder logic', 'Compare to known-good baseline', 'Identify modifications'], assignee: 'OT Forensics', tools: ['OT Packet Capture', 'PLC Analyst', 'Baseline DB'] },
      { id: 'P4', name: 'OT System Recovery', description: 'Restore OT systems to known-good state', status: 'pending', duration: '6h', actions: ['Restore PLC programs from golden images', 'Verify sensor calibration', 'Test safety interlocks', 'Staged restart of processes'], assignee: 'Control Systems Eng', tools: ['PLC Programming', 'Calibration Tools'] },
      { id: 'P5', name: 'Post-Incident Hardening', description: 'Implement OT security improvements', status: 'pending', duration: '2h', actions: ['Update OT firewall rules', 'Review network segmentation', 'Update vendor access controls', 'Document ICS-CERT advisory'], assignee: 'OT Security', tools: ['OT Firewall', 'Asset Inventory', 'ICS-CERT'] },
    ]
  },
  {
    id: 'PB-004', name: 'Phishing Campaign Response', threatType: 'Phishing/BEC', severity: 'high',
    description: 'Response to large-scale phishing or business email compromise campaigns.',
    estimatedDuration: '2-4 hours', lastUsed: '2026-02-16', successRate: 99.5, timesExecuted: 156,
    phases: [
      { id: 'P1', name: 'Email Quarantine', description: 'Remove malicious emails from all mailboxes', status: 'completed', duration: '5m', actions: ['Search & destroy malicious emails', 'Block sender domain', 'Update email filters', 'Extract IOCs'], assignee: 'Email Admin', tools: ['Exchange Admin', 'Email Gateway', 'SIEM'] },
      { id: 'P2', name: 'User Impact Assessment', description: 'Determine which users clicked or interacted', status: 'completed', duration: '15m', actions: ['Check click-through logs', 'Identify credential submissions', 'Assess attachment opens', 'Compile affected user list'], assignee: 'SOC Analyst', tools: ['Email Gateway Logs', 'Proxy Logs', 'EDR'] },
      { id: 'P3', name: 'Credential Reset', description: 'Force password reset for affected users', status: 'active', duration: '30m', actions: ['Reset passwords for affected users', 'Revoke active sessions', 'Enable MFA if not active', 'Notify users securely'], assignee: 'Identity Team', tools: ['Active Directory', 'MFA Platform'] },
      { id: 'P4', name: 'Threat Hunting', description: 'Hunt for signs of compromise from phishing payload', status: 'pending', duration: '2h', actions: ['Search for IOCs across environment', 'Check for lateral movement', 'Review DNS logs for C2', 'Endpoint scan of affected users'], assignee: 'Threat Hunter', tools: ['EDR', 'SIEM', 'DNS Analytics'] },
      { id: 'P5', name: 'Awareness & Prevention', description: 'Send security awareness and update controls', status: 'pending', duration: '1h', actions: ['Send phishing alert to organization', 'Update awareness training', 'Improve email filters', 'Add to phishing simulation library'], assignee: 'Security Awareness', tools: ['Email', 'LMS', 'Email Gateway'] },
    ]
  },
  {
    id: 'PB-005', name: 'DDoS Mitigation Protocol', threatType: 'DDoS Attack', severity: 'medium',
    description: 'Automated and manual response procedures for distributed denial of service attacks.',
    estimatedDuration: '1-2 hours', lastUsed: '2026-02-15', successRate: 99.9, timesExecuted: 89,
    phases: [
      { id: 'P1', name: 'Attack Detection & Classification', description: 'Identify DDoS type and characteristics', status: 'completed', duration: '2m', actions: ['Classify attack type (L3/L4/L7)', 'Determine traffic volume', 'Identify source patterns', 'Activate DDoS protection'], assignee: 'NOC', tools: ['DDoS Scrubbing', 'Traffic Analyzer'] },
      { id: 'P2', name: 'Auto-Mitigation', description: 'Engage automated DDoS defenses', status: 'completed', duration: '1m', actions: ['Enable rate limiting', 'Activate geo-blocking if needed', 'Scale CDN/WAF capacity', 'Enable challenge pages'], assignee: 'AI Engine', tools: ['CDN', 'WAF', 'Load Balancer'] },
      { id: 'P3', name: 'Manual Fine-Tuning', description: 'Adjust mitigation rules for edge cases', status: 'active', duration: '30m', actions: ['Review blocked legitimate traffic', 'Whitelist critical IPs', 'Optimize WAF rules', 'Monitor service availability'], assignee: 'Network Eng', tools: ['WAF Console', 'Monitoring'] },
      { id: 'P4', name: 'Post-Attack Analysis', description: 'Analyze attack patterns for future prevention', status: 'pending', duration: '1h', actions: ['Generate attack report', 'Update blacklists', 'Review infrastructure capacity', 'Update runbook'], assignee: 'Security Analyst', tools: ['SIEM', 'Report Generator'] },
    ]
  },
  {
    id: 'PB-006', name: 'Insider Threat Response', threatType: 'Insider Threat', severity: 'high',
    description: 'Response procedures for malicious or negligent insider activities including data theft, sabotage, or policy violations.',
    estimatedDuration: '8-24 hours', lastUsed: '2026-02-12', successRate: 94.3, timesExecuted: 18,
    phases: [
      { id: 'P1', name: 'Behavioral Anomaly Confirmation', description: 'Validate AI-detected insider threat indicators', status: 'completed', duration: '30m', actions: ['Review UEBA alerts', 'Correlate with HR records', 'Check access patterns', 'Determine intent classification'], assignee: 'Insider Threat Analyst', tools: ['UEBA', 'HR System', 'DLP'] },
      { id: 'P2', name: 'Covert Monitoring', description: 'Initiate enhanced monitoring without alerting subject', status: 'active', duration: '4h', actions: ['Enable enhanced logging', 'Deploy network monitoring', 'Capture file access patterns', 'Coordinate with legal/HR'], assignee: 'IR Lead', tools: ['DLP', 'CASB', 'Endpoint Monitoring'] },
      { id: 'P3', name: 'Evidence Collection', description: 'Gather forensically sound evidence for investigation', status: 'pending', duration: '8h', actions: ['Forensic imaging of devices', 'Email archive preservation', 'Cloud activity export', 'Chain of custody documentation'], assignee: 'Digital Forensics', tools: ['FTK', 'EnCase', 'CASB'] },
      { id: 'P4', name: 'Containment & Access Revocation', description: 'Coordinate with HR for access termination', status: 'pending', duration: '1h', actions: ['Coordinate HR meeting', 'Revoke all access simultaneously', 'Collect physical assets', 'Disable remote access'], assignee: 'HR/Security Joint', tools: ['IAM', 'Physical Security', 'MDM'] },
      { id: 'P5', name: 'Post-Incident Actions', description: 'Legal proceedings, policy updates, prevention', status: 'pending', duration: '8h', actions: ['Brief executive team', 'Engage legal counsel', 'Update insider threat program', 'Enhance DLP policies'], assignee: 'CISO/Legal', tools: ['GRC', 'Case Management'] },
    ]
  },
];

const ACTIVE_INCIDENTS = [
  { id: 'INC-2026-047', name: 'LockBit 4.0 Ransomware Containment', playbook: 'PB-001', phase: 'Eradication', severity: 'critical', started: '2026-02-16 22:30', commander: 'Alex Rivera', team: 8, progress: 55 },
  { id: 'INC-2026-048', name: 'APT-41 SCADA Intrusion', playbook: 'PB-003', phase: 'Safety & Containment', severity: 'critical', started: '2026-02-17 00:01', commander: 'Dr. Sarah Kim', team: 12, progress: 35 },
  { id: 'INC-2026-049', name: 'CEO Impersonation BEC Campaign', playbook: 'PB-004', phase: 'Credential Reset', severity: 'high', started: '2026-02-16 23:45', commander: 'James Chen', team: 4, progress: 60 },
];

const COMMUNICATION_TEMPLATES = [
  { id: 'CT-001', name: 'Executive Breach Notification', recipients: 'C-Suite, Board', timing: 'Within 1 hour of confirmation', type: 'Internal' },
  { id: 'CT-002', name: 'Regulatory Notification (GDPR)', recipients: 'DPA / Supervisory Authority', timing: 'Within 72 hours', type: 'Regulatory' },
  { id: 'CT-003', name: 'Customer Breach Notification', recipients: 'Affected Individuals', timing: 'Within 30 days', type: 'External' },
  { id: 'CT-004', name: 'Law Enforcement Report', recipients: 'FBI / IC3 / Local LE', timing: 'As appropriate', type: 'Law Enforcement' },
  { id: 'CT-005', name: 'Media Statement', recipients: 'Press / Public', timing: 'After legal approval', type: 'Public' },
  { id: 'CT-006', name: 'Insurance Notification', recipients: 'Cyber Insurance Carrier', timing: 'Within 24 hours', type: 'Insurance' },
  { id: 'CT-007', name: 'Vendor/Partner Alert', recipients: 'Supply Chain Partners', timing: 'Within 48 hours', type: 'Supply Chain' },
  { id: 'CT-008', name: 'Employee All-Hands Update', recipients: 'All Employees', timing: 'After containment', type: 'Internal' },
];

const FORENSIC_TOOLS = [
  { name: 'Memory Forensics', tool: 'Volatility 3', status: 'active', lastScan: '2m ago', findings: 14 },
  { name: 'Disk Forensics', tool: 'EnCase v22', status: 'active', lastScan: '12m ago', findings: 8 },
  { name: 'Network Forensics', tool: 'Wireshark + Zeek', status: 'active', lastScan: 'real-time', findings: 247 },
  { name: 'Log Analysis', tool: 'Splunk SOAR', status: 'active', lastScan: 'real-time', findings: 1847 },
  { name: 'Malware Sandbox', tool: 'Any.Run + Cuckoo', status: 'active', lastScan: '5m ago', findings: 3 },
  { name: 'Cloud Forensics', tool: 'AWS CloudTrail + Azure Sentinel', status: 'active', lastScan: 'real-time', findings: 62 },
];

const phaseStatusColors = {
  pending: { bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200' },
  active: { bg: 'bg-accent/10', text: 'text-accent', border: 'border-accent/20' },
  completed: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  skipped: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const SecurityIncidentResponse: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'playbooks' | 'forensics' | 'communications' | 'metrics'>('dashboard');
  const [selectedPlaybook, setSelectedPlaybook] = useState<string | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const tabs = [
    { id: 'dashboard', label: 'Active Incidents', icon: AlertCircle },
    { id: 'playbooks', label: 'Response Playbooks', icon: FileText },
    { id: 'forensics', label: 'Forensic Tools', icon: Search },
    { id: 'communications', label: 'Communications', icon: MessageSquare },
    { id: 'metrics', label: 'IR Metrics', icon: BarChart3 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised rounded-2xl p-5 border border-surface-border relative overflow-hidden shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-accent/10 border border-accent/20 flex items-center justify-center">
              <ShieldAlert className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary">Security Incident Response Center</h3>
              <p className="text-xs text-text-secondary font-mono">NIST 800-61 • SANS IR • MITRE ATT&CK FRAMEWORK</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border border-red-200 rounded-xl">
              <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span className="text-xs font-bold text-red-700">{ACTIVE_INCIDENTS.length} ACTIVE</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs font-bold text-emerald-700">MTTD: 1.2s</span>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-accent/10 border border-accent/20 rounded-xl">
              <span className="text-xs font-bold text-accent">MTTR: 4.8s</span>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative grid grid-cols-3 md:grid-cols-6 gap-3 mt-5">
          {[
            { label: 'Incidents YTD', value: '47', color: 'text-white' },
            { label: 'Avg Resolution', value: '3.2h', color: 'text-cyan-400' },
            { label: 'Playbooks Active', value: PLAYBOOKS.length.toString(), color: 'text-purple-400' },
            { label: 'Success Rate', value: '97.4%', color: 'text-emerald-400' },
            { label: 'Team Members', value: '24', color: 'text-blue-400' },
            { label: 'SLA Compliance', value: '99.1%', color: 'text-amber-400' },
          ].map((m, i) => (
            <div key={i} className="bg-surface-overlay rounded-xl p-3 border border-surface-border text-center">
              <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
              <p className="text-[8px] text-text-muted uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-accent text-text-onAccent border border-accent/20' : 'text-text-secondary hover:text-text-primary bg-surface-raised border border-surface-border hover:bg-surface-overlay'}`}>
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Dashboard Tab - Active Incidents */}
      {activeTab === 'dashboard' && (
        <div className="space-y-4">
          {ACTIVE_INCIDENTS.map((inc, i) => (
            <motion.div key={inc.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`rounded-xl border p-5 bg-surface-raised shadow-soft ${inc.severity === 'critical' ? 'border-red-200' : 'border-orange-200'}`}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-text-muted">{inc.id}</span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${inc.severity === 'critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'}`}>{inc.severity}</span>
                  </div>
                  <h4 className="text-base font-bold text-text-primary">{inc.name}</h4>
                  <p className="text-xs text-text-secondary mt-1">Phase: <span className="text-accent font-semibold">{inc.phase}</span> • Commander: {inc.commander} • Team: {inc.team} members</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-muted">Started</p>
                  <p className="text-sm font-mono text-text-primary">{inc.started}</p>
                </div>
              </div>
              <div className="w-full h-2 bg-surface-overlay rounded-full overflow-hidden mb-2">
                <motion.div initial={{ width: 0 }} animate={{ width: `${inc.progress}%` }} transition={{ duration: 1, delay: i * 0.1 }}
                  className={`h-full rounded-full ${inc.severity === 'critical' ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-orange-500 to-amber-500'}`} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-text-muted">{inc.progress}% Complete</span>
                <div className="flex gap-2">
                  <button className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 hover:bg-accent/15 transition-all">View Details</button>
                  <button className="text-[10px] font-bold text-red-700 bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 hover:bg-red-100 transition-all">Escalate</button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Playbooks Tab */}
      {activeTab === 'playbooks' && (
        <div className="space-y-4">
          {PLAYBOOKS.map((pb, i) => {
            const isSelected = selectedPlaybook === pb.id;
            return (
              <motion.div key={pb.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                className={`rounded-xl border transition-all shadow-soft ${isSelected ? 'bg-surface-raised border-accent/30' : 'bg-surface-raised border-surface-border hover:border-accent/20'}`}>
                <div className="p-5 cursor-pointer" onClick={() => setSelectedPlaybook(isSelected ? null : pb.id)}>
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${pb.severity === 'critical' ? 'bg-red-500 text-white' : pb.severity === 'high' ? 'bg-orange-500 text-white' : 'bg-amber-500 text-white'}`}>{pb.severity}</span>
                        <span className="text-[10px] text-text-muted font-mono">{pb.id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{pb.name}</h4>
                      <p className="text-xs text-text-secondary mt-1">{pb.description}</p>
                    </div>
                    {isSelected ? <ChevronDown className="w-5 h-5 text-text-muted shrink-0" /> : <ChevronRight className="w-5 h-5 text-text-muted shrink-0" />}
                  </div>
                  <div className="flex items-center gap-4 mt-3 text-[10px] text-text-muted">
                    <span>Duration: <span className="text-text-primary font-semibold">{pb.estimatedDuration}</span></span>
                    <span>Success: <span className="text-emerald-700 font-semibold">{pb.successRate}%</span></span>
                    <span>Executed: <span className="text-accent font-semibold">{pb.timesExecuted}x</span></span>
                    <span>Last: <span className="text-text-primary font-semibold">{pb.lastUsed}</span></span>
                  </div>
                </div>
                <AnimatePresence>
                  {isSelected && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="px-5 pb-5 space-y-3 border-t border-surface-border pt-4">
                        {pb.phases.map((phase, pi) => {
                          const pColors = phaseStatusColors[phase.status];
                          const isPhaseExpanded = expandedPhase === `${pb.id}-${phase.id}`;
                          return (
                            <div key={phase.id} className={`rounded-lg border ${pColors.border} ${pColors.bg} p-4 cursor-pointer`}
                              onClick={(e) => { e.stopPropagation(); setExpandedPhase(isPhaseExpanded ? null : `${pb.id}-${phase.id}`); }}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${pColors.bg} border ${pColors.border}`}>
                                  <span className={`text-sm font-black ${pColors.text}`}>{pi + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="text-sm font-bold text-white">{phase.name}</h5>
                                    <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${pColors.bg} ${pColors.text} border ${pColors.border}`}>{phase.status}</span>
                                    <span className="text-[9px] text-slate-500">~{phase.duration}</span>
                                  </div>
                                  <p className="text-xs text-text-secondary">{phase.description}</p>
                                </div>
                              </div>
                              {isPhaseExpanded && (
                                <div className="mt-3 pl-11 space-y-3">
                                  <div>
                                    <p className="text-[9px] text-text-muted uppercase tracking-wider mb-1">Actions</p>
                                    <div className="space-y-1">
                                      {phase.actions.map((action, ai) => (
                                        <div key={ai} className="flex items-center gap-2 text-xs text-text-secondary">
                                          <CheckCircle2 className={`w-3 h-3 shrink-0 ${phase.status === 'completed' ? 'text-emerald-400' : 'text-slate-600'}`} />
                                          {action}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-4 text-[10px] text-text-muted">
                                    <span>Assignee: <span className="text-text-primary">{phase.assignee}</span></span>
                                    <span>Tools: <span className="text-accent">{phase.tools.join(', ')}</span></span>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                        <button className="w-full py-3 rounded-xl bg-accent text-text-onAccent text-sm font-bold hover:bg-accent/90 transition-all flex items-center justify-center gap-2">
                          <PlayCircle className="w-4 h-4" /> Execute Playbook
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Forensics Tab */}
      {activeTab === 'forensics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {FORENSIC_TOOLS.map((tool, i) => (
              <motion.div key={tool.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className="bg-surface-raised rounded-xl p-5 border border-surface-border hover:border-accent/20 transition-all shadow-soft">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold text-text-primary">{tool.name}</h4>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-700 uppercase">{tool.status}</span>
                  </div>
                </div>
                <p className="text-xs text-accent font-mono mb-3">{tool.tool}</p>
                <div className="flex items-center justify-between text-[10px] text-text-secondary">
                  <span>Last Scan: <span className="text-text-primary">{tool.lastScan}</span></span>
                  <span>Findings: <span className="text-amber-700 font-bold">{tool.findings}</span></span>
                </div>
              </motion.div>
            ))}
          </div>
          <div className="bg-surface-raised rounded-xl p-5 border border-surface-border shadow-soft">
            <h4 className="text-sm font-bold text-text-primary mb-4 flex items-center gap-2"><Brain className="w-4 h-4 text-violet-600" /> AI Forensic Analysis Pipeline</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'IOCs Extracted', value: '2,847', color: 'text-cyan-400' },
                { label: 'YARA Rules Matched', value: '14', color: 'text-red-400' },
                { label: 'Artifacts Preserved', value: '1.2 TB', color: 'text-purple-400' },
                { label: 'Chain of Custody', value: 'Verified', color: 'text-emerald-400' },
              ].map((m, i) => (
                <div key={i} className="bg-surface-overlay rounded-lg p-3 border border-surface-border text-center">
                  <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
                  <p className="text-[8px] text-text-muted uppercase tracking-wider">{m.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Communications Tab */}
      {activeTab === 'communications' && (
        <div className="space-y-4">
          <div className="bg-surface-raised rounded-xl p-5 border border-surface-border shadow-soft">
            <h4 className="text-sm font-bold text-text-primary mb-4">Incident Communication Templates</h4>
            <div className="space-y-3">
              {COMMUNICATION_TEMPLATES.map((tmpl, i) => (
                <motion.div key={tmpl.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center justify-between p-4 bg-surface-overlay rounded-xl border border-surface-border hover:border-accent/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${tmpl.type === 'Internal' ? 'bg-blue-500/10 text-blue-400' : tmpl.type === 'Regulatory' ? 'bg-red-500/10 text-red-400' : tmpl.type === 'External' ? 'bg-amber-500/10 text-amber-400' : tmpl.type === 'Law Enforcement' ? 'bg-purple-500/10 text-purple-400' : tmpl.type === 'Insurance' ? 'bg-emerald-500/10 text-emerald-400' : tmpl.type === 'Supply Chain' ? 'bg-cyan-500/10 text-cyan-400' : 'bg-orange-500/10 text-orange-400'}`}>
                      {tmpl.type === 'Internal' ? <Users className="w-4 h-4" /> : tmpl.type === 'Regulatory' ? <FileWarning className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                    </div>
                    <div>
                      <h5 className="text-sm font-bold text-text-primary">{tmpl.name}</h5>
                      <p className="text-[10px] text-text-secondary">To: {tmpl.recipients} • {tmpl.timing}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-bold uppercase px-2 py-1 rounded-lg ${tmpl.type === 'Internal' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : tmpl.type === 'Regulatory' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-slate-700 text-slate-300 border border-slate-600'}`}>{tmpl.type}</span>
                    <button className="text-[10px] font-bold text-accent bg-accent/10 px-3 py-1.5 rounded-lg border border-accent/20 hover:bg-accent/15 transition-all">Use Template</button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-surface-raised rounded-xl p-5 border border-surface-border shadow-soft">
              <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2"><Phone className="w-4 h-4 text-emerald-600" /> Emergency Contacts</h4>
              <div className="space-y-2">
                {['CISO — Alex Rivera — ext.2001', 'IR Lead — Dr. Sarah Kim — ext.2002', 'Legal Counsel — Mark Johnson — ext.3001', 'FBI Cyber — Field Office — (555) 200-4000', 'Cyber Insurance — Hotline — (800) 555-1234'].map((c, i) => (
                  <div key={i} className="text-xs text-text-secondary p-2 bg-surface-overlay rounded-lg">{c}</div>
                ))}
              </div>
            </div>
            <div className="bg-surface-raised rounded-xl p-5 border border-surface-border shadow-soft">
              <h4 className="text-sm font-bold text-text-primary mb-3 flex items-center gap-2"><Radio className="w-4 h-4 text-accent" /> War Room Channels</h4>
              <div className="space-y-2">
                {['#incident-response — Active IR coordination', '#soc-alerts — SOC alert triage', '#forensics — Digital forensics team', '#executive-brief — Leadership updates', '#vendor-comms — Third-party coordination'].map((c, i) => (
                  <div key={i} className="text-xs text-text-secondary p-2 bg-surface-overlay rounded-lg">{c}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metrics Tab */}
      {activeTab === 'metrics' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Mean Time to Detect', value: '1.2s', change: '-18%', trend: 'down', good: true },
              { label: 'Mean Time to Respond', value: '4.8s', change: '-22%', trend: 'down', good: true },
              { label: 'Mean Time to Contain', value: '8.4min', change: '-15%', trend: 'down', good: true },
              { label: 'Mean Time to Recover', value: '3.2hr', change: '-31%', trend: 'down', good: true },
              { label: 'Incident Volume (MTD)', value: '47', change: '+8%', trend: 'up', good: false },
              { label: 'False Positive Rate', value: '2.1%', change: '-0.8%', trend: 'down', good: true },
              { label: 'Automated Resolution', value: '73%', change: '+12%', trend: 'up', good: true },
              { label: 'SLA Compliance', value: '99.1%', change: '+0.4%', trend: 'up', good: true },
            ].map((m, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-surface-raised rounded-xl p-4 border border-surface-border shadow-soft">
                <p className="text-[9px] text-text-muted uppercase tracking-wider mb-2">{m.label}</p>
                <p className="text-2xl font-black text-text-primary">{m.value}</p>
                <p className={`text-[10px] font-bold mt-1 ${m.good ? 'text-emerald-400' : 'text-red-400'}`}>
                  {m.change} {m.trend === 'down' ? '↓' : '↑'} vs last month
                </p>
              </motion.div>
            ))}
          </div>
          <div className="bg-surface-raised rounded-xl p-5 border border-surface-border shadow-soft">
            <h4 className="text-sm font-bold text-text-primary mb-4">Incident Categories (Last 90 Days)</h4>
            <div className="space-y-3">
              {[
                { type: 'Phishing/BEC', count: 156, pct: 45 },
                { type: 'Malware/Ransomware', count: 47, pct: 14 },
                { type: 'DDoS', count: 89, pct: 26 },
                { type: 'Insider Threat', count: 18, pct: 5 },
                { type: 'Supply Chain', count: 12, pct: 3 },
                { type: 'ICS/SCADA', count: 8, pct: 2 },
                { type: 'Other', count: 15, pct: 5 },
              ].map((cat, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-xs text-text-secondary w-32 shrink-0">{cat.type}</span>
                  <div className="flex-1 h-2 bg-surface-overlay rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${cat.pct}%` }} transition={{ duration: 0.8, delay: i * 0.05 }}
                      className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500" />
                  </div>
                  <span className="text-xs text-text-primary font-bold w-12 text-right">{cat.count}</span>
                  <span className="text-[10px] text-text-muted w-8 text-right">{cat.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
