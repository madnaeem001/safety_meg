import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, ShieldAlert, Bug, AlertTriangle, Activity, Globe, Eye, Zap, Brain,
  CheckCircle2, XCircle, Clock, Bell, BellRing, Volume2, VolumeX, Filter,
  ChevronRight, ChevronDown, RefreshCw, Radio, Lock, Fingerprint, Server,
  Network, Cpu, Database, FileWarning, Terminal, Wifi, X, TrendingUp,
  AlertCircle, Maximize2, Minimize2, Settings, Search, BarChart3, Target
} from 'lucide-react';

interface ThreatAlert {
  id: string;
  timestamp: string;
  type: 'malware' | 'intrusion' | 'phishing' | 'ransomware' | 'ddos' | 'zero-day' | 'insider' | 'data-exfil' | 'brute-force' | 'supply-chain' | 'apt' | 'cryptojacking';
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  source: string;
  target: string;
  status: 'active' | 'contained' | 'investigating' | 'resolved' | 'escalated';
  aiConfidence: number;
  description: string;
  mitreAttackId?: string;
  cveId?: string;
  responseAction: string;
  affectedSystems: string[];
  ttd: string; // time to detect
  ttr: string; // time to respond
}

const INITIAL_ALERTS: ThreatAlert[] = [
  { id: 'ALERT-001', timestamp: '2026-02-17 00:01:22', type: 'ransomware', severity: 'critical', source: '45.33.32.156 (RU)', target: 'File Server FS-02', status: 'contained', aiConfidence: 99.7, description: 'LockBit 4.0 ransomware payload intercepted during lateral movement via SMB protocol', mitreAttackId: 'T1486', responseAction: 'Auto-isolated host, revoked credentials, snapshot restored', affectedSystems: ['FS-02', 'DC-01', 'WS-147'], ttd: '0.3s', ttr: '1.2s' },
  { id: 'ALERT-002', timestamp: '2026-02-17 00:00:58', type: 'apt', severity: 'critical', source: '103.224.182.251 (APT-41)', target: 'SCADA PLC-7', status: 'escalated', aiConfidence: 96.4, description: 'Nation-state APT group targeting industrial control systems via CVE-2026-0142', mitreAttackId: 'T1071.001', cveId: 'CVE-2026-0142', responseAction: 'OT network segment isolated, threat hunting initiated', affectedSystems: ['PLC-7', 'HMI-3', 'RTU-12'], ttd: '0.8s', ttr: '3.1s' },
  { id: 'ALERT-003', timestamp: '2026-02-17 00:00:45', type: 'phishing', severity: 'high', source: 'spoofed@safety-compliance.org', target: '18 Employee Mailboxes', status: 'resolved', aiConfidence: 97.2, description: 'Spear-phishing campaign with deepfake CEO voice attachment targeting safety managers', mitreAttackId: 'T1566.001', responseAction: 'All 18 emails quarantined, sender domain blacklisted', affectedSystems: ['Exchange-01', 'M365-Tenant'], ttd: '0.1s', ttr: '0.5s' },
  { id: 'ALERT-004', timestamp: '2026-02-16 23:58:33', type: 'zero-day', severity: 'critical', source: 'Supply Chain (Firmware)', target: 'Gas Sensors Zone B', status: 'investigating', aiConfidence: 91.8, description: 'Zero-day backdoor detected in IoT gas sensor firmware update from third-party vendor', mitreAttackId: 'T1195.002', cveId: 'CVE-2026-1847', responseAction: 'Firmware rollback initiated, vendor notified, forensic capture started', affectedSystems: ['GS-B01', 'GS-B02', 'GS-B03', 'GS-B04'], ttd: '2.4s', ttr: '12.7s' },
  { id: 'ALERT-005', timestamp: '2026-02-16 23:55:11', type: 'data-exfil', severity: 'high', source: 'User ID: 8472', target: 'Compliance DB', status: 'contained', aiConfidence: 97.3, description: 'Insider threat: bulk export of 50,000+ compliance records outside business hours', mitreAttackId: 'T1567', responseAction: 'Account locked, session terminated, data exfiltration blocked at DLP', affectedSystems: ['SQL-COMP-01', 'DLP-Gateway'], ttd: '1.1s', ttr: '2.8s' },
  { id: 'ALERT-006', timestamp: '2026-02-16 23:50:02', type: 'ddos', severity: 'medium', source: 'Botnet (14,000+ nodes)', target: 'API Gateway', status: 'resolved', aiConfidence: 99.9, description: 'Layer 7 DDoS targeting safety reporting APIs — 2.3Tbps peak traffic', mitreAttackId: 'T1498', responseAction: 'AI traffic shaping engaged, WAF rules auto-scaled, zero downtime', affectedSystems: ['API-GW-01', 'CDN-Edge'], ttd: '0.2s', ttr: '0.4s' },
  { id: 'ALERT-007', timestamp: '2026-02-16 23:42:00', type: 'brute-force', severity: 'medium', source: '192.168.4.0/24 (Multiple)', target: 'VPN Gateway', status: 'resolved', aiConfidence: 98.1, description: 'Credential stuffing attack on VPN with 847,000 login attempts in 10 minutes', mitreAttackId: 'T1110.004', responseAction: 'IP range blocked, MFA enforcement verified, affected accounts locked', affectedSystems: ['VPN-GW-01', 'AD-DC-02'], ttd: '0.5s', ttr: '1.0s' },
  { id: 'ALERT-008', timestamp: '2026-02-16 23:35:00', type: 'cryptojacking', severity: 'low', source: 'Container k8s-pod-47', target: 'K8s Worker Node 12', status: 'resolved', aiConfidence: 95.4, description: 'Cryptocurrency mining malware detected in container workload — Monero miner', mitreAttackId: 'T1496', responseAction: 'Container terminated, image pulled, registry scan initiated', affectedSystems: ['K8S-W12'], ttd: '4.2s', ttr: '6.8s' },
  { id: 'ALERT-009', timestamp: '2026-02-16 23:28:00', type: 'supply-chain', severity: 'high', source: 'npm Package (safety-utils)', target: 'CI/CD Pipeline', status: 'contained', aiConfidence: 93.6, description: 'Compromised npm dependency detected in CI/CD pipeline — backdoored safety-utils@3.2.1', mitreAttackId: 'T1195.001', responseAction: 'Build halted, dependency reverted, SBOM audit initiated', affectedSystems: ['Jenkins-01', 'Nexus-Repo'], ttd: '8.3s', ttr: '22.1s' },
  { id: 'ALERT-010', timestamp: '2026-02-16 23:15:00', type: 'insider', severity: 'medium', source: 'Admin: ex-contractor', target: 'AWS S3 Buckets', status: 'resolved', aiConfidence: 93.1, description: 'Inactive contractor credentials reactivated to access archived safety records', mitreAttackId: 'T1078.004', responseAction: 'All tokens revoked, MFA reset, access audit completed', affectedSystems: ['S3-safety-archive', 'IAM-Roles'], ttd: '1.8s', ttr: '4.2s' },
];

const NEW_ALERT_POOL: ThreatAlert[] = [
  { id: 'ALERT-LIVE-1', timestamp: '', type: 'intrusion', severity: 'high', source: '185.220.101.0/24 (Tor Exit)', target: 'Web Application Firewall', status: 'active', aiConfidence: 94.7, description: 'SQL injection attempt chain targeting safety incident reporting forms', mitreAttackId: 'T1190', responseAction: 'WAF rules updated, source IPs blocked, request patterns logged', affectedSystems: ['WAF-01', 'APP-SRV-03'], ttd: '0.2s', ttr: '0.6s' },
  { id: 'ALERT-LIVE-2', timestamp: '', type: 'malware', severity: 'medium', source: 'USB Device (Visitor)', target: 'Guest VLAN', status: 'contained', aiConfidence: 88.5, description: 'Emotet variant detected on visitor laptop during network authentication', mitreAttackId: 'T1091', responseAction: 'Device quarantined to guest VLAN, no lateral movement detected', affectedSystems: ['NAC-01'], ttd: '1.5s', ttr: '3.2s' },
  { id: 'ALERT-LIVE-3', timestamp: '', type: 'phishing', severity: 'high', source: 'CEO-impersonation@fake.com', target: 'Finance Department', status: 'resolved', aiConfidence: 99.1, description: 'Business Email Compromise (BEC) with AI-generated deepfake audio attachment', mitreAttackId: 'T1566.003', responseAction: 'Emails intercepted, deepfake flagged, employees alerted', affectedSystems: ['Exchange-01'], ttd: '0.1s', ttr: '0.3s' },
  { id: 'ALERT-LIVE-4', timestamp: '', type: 'zero-day', severity: 'critical', source: 'Firmware Update Channel', target: 'HVAC Controllers', status: 'investigating', aiConfidence: 89.2, description: 'Anomalous behavior in building HVAC IoT controllers after OTA update', mitreAttackId: 'T1195.002', responseAction: 'HVAC controllers isolated, manual override engaged, vendor contacted', affectedSystems: ['HVAC-01', 'HVAC-02', 'BMS-01'], ttd: '12.4s', ttr: '45.0s' },
];

const severityConfig = {
  critical: { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', glow: 'shadow-red-100', badge: 'bg-red-500 text-white' },
  high: { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', glow: 'shadow-orange-100', badge: 'bg-orange-500 text-white' },
  medium: { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', glow: 'shadow-amber-100', badge: 'bg-amber-500 text-white' },
  low: { color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', glow: 'shadow-emerald-100', badge: 'bg-emerald-500 text-white' },
  info: { color: 'text-sky-700', bg: 'bg-sky-50', border: 'border-sky-200', glow: 'shadow-sky-100', badge: 'bg-sky-500 text-white' },
};

const statusConfig = {
  active: { color: 'text-red-700', bg: 'bg-red-50', icon: AlertCircle, pulse: true },
  contained: { color: 'text-amber-700', bg: 'bg-amber-50', icon: Shield, pulse: false },
  investigating: { color: 'text-sky-700', bg: 'bg-sky-50', icon: Search, pulse: true },
  resolved: { color: 'text-emerald-700', bg: 'bg-emerald-50', icon: CheckCircle2, pulse: false },
  escalated: { color: 'text-violet-700', bg: 'bg-violet-50', icon: TrendingUp, pulse: true },
};

const typeIcons: Record<string, typeof Shield> = {
  malware: Bug, intrusion: Network, phishing: FileWarning, ransomware: Lock,
  ddos: Wifi, 'zero-day': Zap, insider: Fingerprint, 'data-exfil': Database,
  'brute-force': Terminal, 'supply-chain': Server, apt: Target, cryptojacking: Cpu,
};

export const RealTimeThreatAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<ThreatAlert[]>(INITIAL_ALERTS);
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [newAlertFlash, setNewAlertFlash] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [liveCounter, setLiveCounter] = useState(0);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // Simulate live incoming alerts
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      setLiveCounter(prev => {
        const idx = prev % NEW_ALERT_POOL.length;
        const newAlert = { ...NEW_ALERT_POOL[idx], id: `ALERT-LIVE-${Date.now()}`, timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19) };
        setAlerts(prev => [newAlert, ...prev].slice(0, 50));
        setNewAlertFlash(newAlert.id);
        setTimeout(() => setNewAlertFlash(null), 3000);
        return prev + 1;
      });
    }, 8000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    if (searchQuery && !a.description.toLowerCase().includes(searchQuery.toLowerCase()) && !a.type.includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: alerts.length,
    critical: alerts.filter(a => a.severity === 'critical').length,
    active: alerts.filter(a => a.status === 'active' || a.status === 'escalated').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
    avgTTD: '1.2s',
    avgTTR: '4.8s',
    blockRate: '99.7%',
    aiAccuracy: '96.8%',
  };

  return (
    <div className="space-y-6">
      {/* Live Status Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised rounded-2xl p-5 border border-surface-border relative overflow-hidden shadow-soft">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/10 via-transparent to-transparent" />
        <div className="relative flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
                <BellRing className="w-6 h-6 text-accent animate-pulse" />
              </div>
              {stats.active > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center">
                  <span className="text-[10px] font-black text-white">{stats.active}</span>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-text-primary flex items-center gap-2">
                Real-Time Threat Alert Center
                <span className="text-[10px] font-mono bg-red-50 text-red-700 px-2 py-0.5 rounded-full border border-red-200">LIVE</span>
              </h3>
              <p className="text-xs text-text-secondary font-mono">SOAR ENGINE • 12 AI MODELS • MITRE ATT&CK MAPPED</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => setSoundEnabled(!soundEnabled)}
              className={`p-2 rounded-lg border transition-all ${soundEnabled ? 'bg-accent/10 border-accent/20 text-accent' : 'bg-surface-overlay border-surface-border text-text-muted'}`}>
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
            <button onClick={() => setAutoRefresh(!autoRefresh)}
              className={`p-2 rounded-lg border transition-all ${autoRefresh ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-surface-overlay border-surface-border text-text-muted'}`}>
              <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} style={autoRefresh ? { animationDuration: '3s' } : {}} />
            </button>
            <button onClick={() => setShowFullscreen(!showFullscreen)}
              className="p-2 rounded-lg bg-surface-overlay border border-surface-border text-text-secondary hover:text-text-primary transition-all">
              {showFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Metrics Row */}
        <div className="relative grid grid-cols-4 md:grid-cols-8 gap-3 mt-5">
          {[
            { label: 'Total Alerts', value: stats.total, color: 'text-white' },
            { label: 'Critical', value: stats.critical, color: 'text-red-400' },
            { label: 'Active Threats', value: stats.active, color: 'text-orange-400' },
            { label: 'Resolved', value: stats.resolved, color: 'text-emerald-400' },
            { label: 'Avg TTD', value: stats.avgTTD, color: 'text-cyan-400' },
            { label: 'Avg TTR', value: stats.avgTTR, color: 'text-blue-400' },
            { label: 'Block Rate', value: stats.blockRate, color: 'text-emerald-400' },
            { label: 'AI Accuracy', value: stats.aiAccuracy, color: 'text-purple-400' },
          ].map((m, i) => (
            <div key={i} className="bg-surface-overlay rounded-xl p-3 border border-surface-border text-center">
              <p className={`text-lg font-black ${m.color}`}>{m.value}</p>
              <p className="text-[8px] text-text-muted uppercase tracking-wider">{m.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
          <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
            placeholder="Search alerts by type, description..." />
        </div>
        <select value={severityFilter} onChange={e => setSeverityFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-sm text-text-primary focus:border-accent focus:outline-none">
          <option value="all">All Severity</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-surface-raised border border-surface-border rounded-xl text-sm text-text-primary focus:border-accent focus:outline-none">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="contained">Contained</option>
          <option value="investigating">Investigating</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      {/* Alert Feed */}
      <div className="space-y-3">
        <AnimatePresence>
          {filteredAlerts.map((alert) => {
            const sev = severityConfig[alert.severity];
            const stat = statusConfig[alert.status];
            const TypeIcon = typeIcons[alert.type] || Shield;
            const StatusIcon = stat.icon;
            const isExpanded = expandedAlert === alert.id;
            const isNew = newAlertFlash === alert.id;

            return (
              <motion.div key={alert.id}
                initial={{ opacity: 0, x: -20, scale: 0.98 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                layout
                className={`rounded-xl border transition-all cursor-pointer ${sev.bg} ${sev.border} ${isNew ? `ring-2 ring-red-300 ${sev.glow} shadow-lg` : 'hover:border-accent/30'}`}
                onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}>
                
                {/* Alert Header */}
                <div className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-xl ${sev.bg} flex items-center justify-center shrink-0 ${stat.pulse ? 'animate-pulse' : ''}`}>
                    <TypeIcon className={`w-5 h-5 ${sev.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${sev.badge}`}>{alert.severity}</span>
                      <span className="text-[10px] font-bold text-text-muted uppercase">{alert.type.replace('-', ' ')}</span>
                      {alert.mitreAttackId && <span className="text-[10px] font-mono text-accent bg-accent/10 px-1.5 py-0.5 rounded">{alert.mitreAttackId}</span>}
                      {alert.cveId && <span className="text-[10px] font-mono text-orange-700 bg-orange-50 px-1.5 py-0.5 rounded">{alert.cveId}</span>}
                    </div>
                    <p className="text-sm font-semibold text-text-primary mb-1">{alert.description}</p>
                    <div className="flex items-center gap-4 text-[10px] text-text-secondary">
                      <span className="font-mono">{alert.timestamp}</span>
                      <span>Source: <span className="text-text-primary">{alert.source}</span></span>
                      <span>Target: <span className="text-text-primary">{alert.target}</span></span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg ${stat.bg}`}>
                      <StatusIcon className={`w-3.5 h-3.5 ${stat.color}`} />
                      <span className={`text-[10px] font-bold uppercase ${stat.color}`}>{alert.status}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-text-muted">
                      <Brain className="w-3 h-3" />
                      <span>{alert.aiConfidence}% AI</span>
                    </div>
                    {isExpanded ? <ChevronDown className="w-4 h-4 text-text-muted" /> : <ChevronRight className="w-4 h-4 text-text-muted" />}
                  </div>
                </div>

                {/* Expanded Details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-4 border-t border-surface-border pt-4">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <div className="bg-surface-overlay rounded-lg p-3 border border-surface-border">
                            <p className="text-[9px] text-text-muted uppercase tracking-wider">Time to Detect</p>
                            <p className="text-lg font-black text-accent">{alert.ttd}</p>
                          </div>
                          <div className="bg-surface-overlay rounded-lg p-3 border border-surface-border">
                            <p className="text-[9px] text-text-muted uppercase tracking-wider">Time to Respond</p>
                            <p className="text-lg font-black text-emerald-700">{alert.ttr}</p>
                          </div>
                          <div className="bg-surface-overlay rounded-lg p-3 border border-surface-border">
                            <p className="text-[9px] text-text-muted uppercase tracking-wider">AI Confidence</p>
                            <p className="text-lg font-black text-violet-700">{alert.aiConfidence}%</p>
                          </div>
                          <div className="bg-surface-overlay rounded-lg p-3 border border-surface-border">
                            <p className="text-[9px] text-text-muted uppercase tracking-wider">Affected Systems</p>
                            <p className="text-lg font-black text-amber-700">{alert.affectedSystems.length}</p>
                          </div>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                          <p className="text-[10px] text-emerald-700 font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5" /> AI Response Action
                          </p>
                          <p className="text-sm text-emerald-800">{alert.responseAction}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Affected Systems</p>
                          <div className="flex flex-wrap gap-2">
                            {alert.affectedSystems.map((sys, i) => (
                              <span key={i} className="text-[10px] font-mono text-accent bg-accent/10 border border-accent/20 px-2 py-1 rounded-lg">{sys}</span>
                            ))}
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button className="flex-1 py-2.5 rounded-xl bg-accent/10 border border-accent/20 text-accent text-xs font-bold hover:bg-accent/15 transition-all flex items-center justify-center gap-2">
                            <Eye className="w-3.5 h-3.5" /> Investigate
                          </button>
                          <button className="flex-1 py-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold hover:bg-red-100 transition-all flex items-center justify-center gap-2">
                            <ShieldAlert className="w-3.5 h-3.5" /> Escalate
                          </button>
                          <button className="flex-1 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-all flex items-center justify-center gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Resolve
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
};
