import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, KeyRound, Users, Eye, FileText, Clock,
  CheckCircle2, AlertTriangle, XCircle, Fingerprint, Globe,
  Settings, ChevronRight, Search, Filter, Database, Server,
  ShieldCheck, UserCheck, ScrollText, Activity
} from 'lucide-react';
import { useDataSecurityStats, useSsoProviders, useSecurityAuditLogs, useUpdateSsoProvider } from '../api/hooks/useAPIHooks';

// Mock SSO providers (fallback when API is unavailable)
const MOCK_SSO_PROVIDERS = [
  { name: 'Okta', status: 'connected', users: 342, icon: '🔐', lastSync: '2 min ago', protocol: 'SAML 2.0' },
  { name: 'Azure AD', status: 'configured', users: 0, icon: '☁️', lastSync: 'Not synced', protocol: 'OpenID Connect' },
  { name: 'Google Workspace', status: 'disconnected', users: 0, icon: '🔵', lastSync: 'N/A', protocol: 'OAuth 2.0' },
  { name: 'OneLogin', status: 'disconnected', users: 0, icon: '🟣', lastSync: 'N/A', protocol: 'SAML 2.0' },
];

// Mock RBAC matrix
const roles = ['Admin', 'Safety Manager', 'Supervisor', 'Worker', 'Contractor', 'HR'];
const resources = [
  { name: 'Incidents (All)', admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'own', contractor: 'none', hr: 'read' },
  { name: 'Medical Records', admin: 'full', safetyMgr: 'none', supervisor: 'none', worker: 'own', contractor: 'none', hr: 'full' },
  { name: 'Confidential Reports', admin: 'full', safetyMgr: 'read', supervisor: 'none', worker: 'none', contractor: 'none', hr: 'full' },
  { name: 'Risk Assessments', admin: 'full', safetyMgr: 'full', supervisor: 'full', worker: 'read', contractor: 'read', hr: 'none' },
  { name: 'Training Records', admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'own', contractor: 'own', hr: 'read' },
  { name: 'Audit Reports', admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'none', contractor: 'none', hr: 'read' },
  { name: 'Compliance Data', admin: 'full', safetyMgr: 'full', supervisor: 'read', worker: 'none', contractor: 'none', hr: 'none' },
  { name: 'Contractor Permits', admin: 'full', safetyMgr: 'full', supervisor: 'full', worker: 'read', contractor: 'own', hr: 'none' },
  { name: 'User Management', admin: 'full', safetyMgr: 'none', supervisor: 'none', worker: 'none', contractor: 'none', hr: 'read' },
  { name: 'System Settings', admin: 'full', safetyMgr: 'none', supervisor: 'none', worker: 'none', contractor: 'none', hr: 'none' },
];

const MOCK_AUDIT_LOGS = [
  { id: 1, user: 'Sarah Chen', action: 'Updated', resource: 'Incident #INC-2026-087', field: 'severity', oldValue: 'Medium', newValue: 'High', timestamp: '2026-02-19 14:32:11', ip: '10.0.1.45' },
  { id: 2, user: 'Mike Torres', action: 'Created', resource: 'Risk Assessment #RA-441', field: '', oldValue: '', newValue: '', timestamp: '2026-02-19 14:28:03', ip: '10.0.2.12' },
  { id: 3, user: 'James Park', action: 'Viewed', resource: 'Medical Record #MR-112', field: '', oldValue: '', newValue: '', timestamp: '2026-02-19 14:15:47', ip: '10.0.1.88' },
  { id: 4, user: 'System', action: 'Auto-locked', resource: 'User: contractor_temp_01', field: 'status', oldValue: 'active', newValue: 'locked', timestamp: '2026-02-19 13:59:22', ip: 'system' },
  { id: 5, user: 'Admin', action: 'Exported', resource: 'OSHA 300 Log', field: '', oldValue: '', newValue: '', timestamp: '2026-02-19 13:45:00', ip: '10.0.1.1' },
  { id: 6, user: 'Lisa Wang', action: 'Deleted', resource: 'Draft Checklist #CL-draft-19', field: '', oldValue: '', newValue: '', timestamp: '2026-02-19 13:30:15', ip: '10.0.3.22' },
  { id: 7, user: 'Ahmed Hassan', action: 'Login Failed', resource: 'Authentication', field: '', oldValue: '', newValue: '3rd attempt', timestamp: '2026-02-19 13:12:44', ip: '192.168.1.100' },
];

const tabs = ['Overview', 'SSO Integration', 'Access Control (RBAC)', 'Audit Trail'];

const accessColors: Record<string, string> = {
  full: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  read: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  own: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  none: 'bg-gray-700/30 text-gray-500 border-gray-600/30',
};

export const DataSecurityHub: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');
  const [searchAudit, setSearchAudit] = useState('');

  // Live data hooks
  const { data: statsData } = useDataSecurityStats();
  const { data: ssoData } = useSsoProviders();
  const { data: auditData } = useSecurityAuditLogs({ limit: 100 });
  const updateSso = useUpdateSsoProvider();

  // Map API data to component display shape with mock fallback
  const ssoProviders = ssoData
    ? ssoData.map(p => ({ id: p.id, name: p.name, status: p.status, users: p.connectedUsers, icon: p.icon, lastSync: p.lastSync, protocol: p.protocol }))
    : MOCK_SSO_PROVIDERS;

  const auditLogs = auditData
    ? auditData.map(l => ({ id: l.id, user: l.userName, action: l.action, resource: l.resource, field: l.fieldName ?? '', oldValue: l.oldValue ?? '', newValue: l.newValue ?? '', timestamp: l.timestamp, ip: l.ipAddress }))
    : MOCK_AUDIT_LOGS;

  const securityKPIs = [
    { label: 'SSO Coverage', value: statsData?.ssoCoverage ?? '94%', icon: Fingerprint, color: 'cyan' },
    { label: 'RBAC Policies', value: statsData ? String(statsData.rbacPolicies) : '48', icon: ShieldCheck, color: 'emerald' },
    { label: 'Audit Events (24h)', value: statsData ? statsData.auditEvents24h.toLocaleString() : '2,847', icon: ScrollText, color: 'purple' },
    { label: 'Failed Logins', value: statsData ? String(statsData.failedLogins24h) : '12', icon: AlertTriangle, color: 'amber' },
    { label: 'Data Encrypted', value: '100%', icon: Lock, color: 'cyan' },
    { label: 'ISO 45001 Ready', value: 'Yes', icon: CheckCircle2, color: 'emerald' },
  ];

  // Fix: filter audit logs by search query
  const filteredAuditLogs = searchAudit
    ? auditLogs.filter(log =>
        log.user.toLowerCase().includes(searchAudit.toLowerCase()) ||
        log.action.toLowerCase().includes(searchAudit.toLowerCase()) ||
        log.resource.toLowerCase().includes(searchAudit.toLowerCase())
      )
    : auditLogs;

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <div className="px-4 pt-20 pb-24 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30">
              <Shield className="w-6 h-6 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Data Security Hub</h1>
              <p className="text-sm text-gray-400">SSO, Access Control & Audit Trails</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {securityKPIs.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                  <kpi.icon className={`w-5 h-5 mb-2 ${kpi.color === 'cyan' ? 'text-cyan-400' : kpi.color === 'emerald' ? 'text-emerald-400' : kpi.color === 'purple' ? 'text-purple-400' : 'text-amber-400'}`} />
                  <div className="text-2xl font-bold text-white">{kpi.value}</div>
                  <div className="text-xs text-gray-400">{kpi.label}</div>
                </motion.div>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Security Compliance Checklist</h3>
                {['End-to-end encryption (AES-256)', 'SSO via Okta configured', 'RBAC policies enforced (6 roles)', 'Audit trail logging active', 'Data retention policy (7 years)', 'OSHA 300 recordkeeping compliant', 'ISO 45001 Annex A aligned', 'Automated session timeout (30 min)'].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-b border-gray-700/30 last:border-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="text-sm text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
              <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                <h3 className="text-white font-semibold mb-4">Recent Security Events</h3>
                {auditLogs.slice(0, 5).map(log => (
                  <div key={log.id} className="flex items-start gap-3 py-2 border-b border-gray-700/30 last:border-0">
                    <div className={`p-1.5 rounded-lg shrink-0 ${log.action === 'Login Failed' || log.action === 'Deleted' ? 'bg-red-500/20' : log.action === 'Auto-locked' ? 'bg-amber-500/20' : 'bg-cyan-500/20'}`}>
                      <Activity className={`w-3 h-3 ${log.action === 'Login Failed' || log.action === 'Deleted' ? 'text-red-400' : log.action === 'Auto-locked' ? 'text-amber-400' : 'text-cyan-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate"><span className="font-medium">{log.user}</span> {log.action.toLowerCase()} {log.resource}</p>
                      <p className="text-xs text-gray-500">{log.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* SSO Integration */}
        {activeTab === 'SSO Integration' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
              <Lock className="w-4 h-4 inline mr-2 text-cyan-400" />
              Ensure users log in via Single Sign-On so you don't have to manually manage passwords. Supports SAML 2.0 & OpenID Connect.
            </p>
            <div className="space-y-3">
              {ssoProviders.map((provider, i) => (
                <motion.div key={provider.name} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-3xl">{provider.icon}</span>
                      <div>
                        <h4 className="text-white font-semibold">{provider.name}</h4>
                        <p className="text-xs text-gray-400">{provider.protocol} • Last sync: {provider.lastSync}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {provider.users > 0 && <span className="text-sm text-gray-400">{provider.users} users</span>}
                      <span className={`px-3 py-1 rounded-lg text-xs font-medium ${provider.status === 'connected' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : provider.status === 'configured' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-gray-600/20 text-gray-400 border border-gray-600/30'}`}>
                        {provider.status}
                      </span>
                      <button
                        className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${provider.status === 'connected' ? 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50' : 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/30'}`}
                        onClick={() => {
                          if ('id' in provider && provider.id) {
                            const newStatus = provider.status === 'connected' ? 'configured' : 'connected';
                            updateSso.mutate({ id: provider.id as number, data: { status: newStatus, lastSync: newStatus === 'connected' ? new Date().toLocaleTimeString() : provider.lastSync } });
                          }
                        }}
                      >
                        {provider.status === 'connected' ? 'Configure' : 'Connect'}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Access Control RBAC */}
        {activeTab === 'Access Control (RBAC)' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
              <AlertTriangle className="w-4 h-4 inline mr-2 text-amber-400" />
              Triple-check that a "Contractor" cannot see "Medical Records" or "Confidential Incident Reports" meant for HR.
            </p>
            <div className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-700/50">
                      <th className="text-left p-3 text-gray-400 font-medium sticky left-0 bg-gray-800/90 backdrop-blur z-10">Resource</th>
                      {roles.map(role => (
                        <th key={role} className="p-3 text-center text-gray-400 font-medium whitespace-nowrap">{role}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {resources.map((res, i) => (
                      <tr key={i} className="border-b border-gray-700/30 hover:bg-gray-700/20">
                        <td className="p-3 text-white font-medium sticky left-0 bg-gray-800/90 backdrop-blur z-10 whitespace-nowrap">{res.name}</td>
                        {[res.admin, res.safetyMgr, res.supervisor, res.worker, res.contractor, res.hr].map((access, j) => (
                          <td key={j} className="p-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${accessColors[access]}`}>
                              {access}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap">
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-emerald-500/40" /> Full access</div>
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-cyan-500/40" /> Read only</div>
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-amber-500/40" /> Own records</div>
              <div className="flex items-center gap-2 text-xs"><span className="w-3 h-3 rounded-full bg-gray-500/40" /> No access</div>
            </div>
          </div>
        )}

        {/* Audit Trail */}
        {activeTab === 'Audit Trail' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 relative">
                <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input type="text" placeholder="Search audit logs..." value={searchAudit} onChange={e => setSearchAudit(e.target.value)}
                  className="w-full bg-gray-800/60 border border-gray-700/50 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50" />
              </div>
              <button className="px-4 py-2.5 bg-gray-800/60 border border-gray-700/50 rounded-xl text-sm text-gray-400 hover:text-white transition-all flex items-center gap-2">
                <Filter className="w-4 h-4" /> Filter
              </button>
            </div>
            <p className="text-sm text-gray-400 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <ScrollText className="w-4 h-4 inline mr-2 text-purple-400" />
              Every change to a record is logged (who, what, when) to meet ISO 45001 and OSHA recordkeeping requirements. Retained for 7 years.
            </p>
            <div className="space-y-2">
              {filteredAuditLogs.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-xl p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 rounded-lg mt-0.5 ${log.action === 'Login Failed' || log.action === 'Deleted' ? 'bg-red-500/20' : log.action === 'Auto-locked' ? 'bg-amber-500/20' : log.action === 'Exported' ? 'bg-purple-500/20' : 'bg-cyan-500/20'}`}>
                        {log.action === 'Login Failed' ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
                         log.action === 'Deleted' ? <XCircle className="w-3.5 h-3.5 text-red-400" /> :
                         log.action === 'Auto-locked' ? <Lock className="w-3.5 h-3.5 text-amber-400" /> :
                         <FileText className="w-3.5 h-3.5 text-cyan-400" />}
                      </div>
                      <div>
                        <p className="text-sm text-white"><span className="font-medium">{log.user}</span> <span className="text-gray-400">{log.action.toLowerCase()}</span> <span className="text-cyan-400">{log.resource}</span></p>
                        {log.field && <p className="text-xs text-gray-500 mt-0.5">Field: <span className="text-gray-400">{log.field}</span> — "{log.oldValue}" → "{log.newValue}"</p>}
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-gray-400">{log.timestamp}</p>
                      <p className="text-xs text-gray-500">IP: {log.ip}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default DataSecurityHub;
