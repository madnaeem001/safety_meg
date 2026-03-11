import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, KeyRound, Shield, Lock, CheckCircle2, XCircle,
  Users, Settings, Globe, Activity, AlertTriangle, Eye,
  RefreshCw, ChevronRight, Zap, Fingerprint, Smartphone,
  Mail, Cloud, Database, Server, Link, ExternalLink, Brain
} from 'lucide-react';

// ── Types ──
interface SSOProvider {
  id: string;
  name: string;
  protocol: 'SAML 2.0' | 'OIDC' | 'OAuth 2.0';
  status: 'connected' | 'disconnected' | 'error';
  icon: string;
  domain: string;
  users: number;
  lastSync: string;
}

interface LoginEvent {
  id: string;
  user: string;
  provider: string;
  timestamp: string;
  status: 'success' | 'failed' | 'mfa_challenge';
  ip: string;
  location: string;
  method: string;
}

// ── Mock Data ──
const mockProviders: SSOProvider[] = [
  { id: 'azure', name: 'Azure Active Directory', protocol: 'SAML 2.0', status: 'connected', icon: '🔵', domain: 'safetymeg.onmicrosoft.com', users: 342, lastSync: '2 min ago' },
  { id: 'okta', name: 'Okta', protocol: 'OIDC', status: 'connected', icon: '🟡', domain: 'safetymeg.okta.com', users: 156, lastSync: '5 min ago' },
  { id: 'ping', name: 'Ping Identity', protocol: 'SAML 2.0', status: 'disconnected', icon: '🔴', domain: 'auth.safetymeg.com', users: 0, lastSync: 'Never' },
  { id: 'google', name: 'Google Workspace', protocol: 'OAuth 2.0', status: 'connected', icon: '🟢', domain: 'safetymeg.com', users: 89, lastSync: '1 min ago' },
];

const mockEvents: LoginEvent[] = [
  { id: 'E1', user: 'j.martinez@safetymeg.com', provider: 'Azure AD', timestamp: '2026-02-23 00:15:32', status: 'success', ip: '10.0.1.45', location: 'Houston, TX', method: 'SAML SSO' },
  { id: 'E2', user: 's.chen@safetymeg.com', provider: 'Okta', timestamp: '2026-02-23 00:12:18', status: 'mfa_challenge', ip: '10.0.2.78', location: 'San Jose, CA', method: 'OIDC + MFA' },
  { id: 'E3', user: 'r.patel@safetymeg.com', provider: 'Azure AD', timestamp: '2026-02-23 00:08:44', status: 'success', ip: '10.0.1.92', location: 'Houston, TX', method: 'SAML SSO' },
  { id: 'E4', user: 'unknown@external.com', provider: 'Direct', timestamp: '2026-02-22 23:55:01', status: 'failed', ip: '185.42.98.12', location: 'Unknown', method: 'Password' },
  { id: 'E5', user: 'k.wilson@safetymeg.com', provider: 'Google', timestamp: '2026-02-22 23:48:22', status: 'success', ip: '10.0.3.33', location: 'Denver, CO', method: 'OAuth 2.0' },
  { id: 'E6', user: 'l.park@safetymeg.com', provider: 'Okta', timestamp: '2026-02-22 23:40:15', status: 'success', ip: '10.0.2.55', location: 'San Jose, CA', method: 'OIDC + MFA' },
  { id: 'E7', user: 'admin@safetymeg.com', provider: 'Azure AD', timestamp: '2026-02-22 23:30:08', status: 'mfa_challenge', ip: '10.0.1.10', location: 'Houston, TX', method: 'SAML + MFA' },
  { id: 'E8', user: 'attacker@malicious.io', provider: 'Direct', timestamp: '2026-02-22 23:22:44', status: 'failed', ip: '91.108.12.55', location: 'Unknown', method: 'Brute Force' },
];

const statusColors = {
  connected: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', dot: 'bg-emerald-400' },
  disconnected: { text: 'text-slate-400', bg: 'bg-slate-500/10', dot: 'bg-slate-400' },
  error: { text: 'text-red-400', bg: 'bg-red-500/10', dot: 'bg-red-400' },
};

const eventStatusConfig = {
  success: { text: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: CheckCircle2 },
  failed: { text: 'text-red-400', bg: 'bg-red-500/10', icon: XCircle },
  mfa_challenge: { text: 'text-amber-400', bg: 'bg-amber-500/10', icon: Fingerprint },
};

export const SSOLoginFlow: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'providers' | 'activity' | 'config' | 'security'>('providers');
  const [selectedProvider, setSelectedProvider] = useState<SSOProvider | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);

  // SSO config form state
  const [configForm, setConfigForm] = useState({
    entityId: 'https://safetymeg.com/saml/metadata',
    acsUrl: 'https://safetymeg.com/saml/acs',
    sloUrl: 'https://safetymeg.com/saml/slo',
    certificate: '',
    nameIdFormat: 'email',
    jitProvisioning: true,
    mfaRequired: true,
    sessionTimeout: 480,
    idleTimeout: 30,
  });

  const stats = {
    totalUsers: mockProviders.reduce((s, p) => s + p.users, 0),
    activeProviders: mockProviders.filter(p => p.status === 'connected').length,
    failedLogins: mockEvents.filter(e => e.status === 'failed').length,
    mfaChallenges: mockEvents.filter(e => e.status === 'mfa_challenge').length,
  };

  const tabs = [
    { id: 'providers', label: 'Identity Providers', icon: Globe },
    { id: 'activity', label: 'Login Activity', icon: Activity },
    { id: 'config', label: 'SAML/OIDC Config', icon: Settings },
    { id: 'security', label: 'Security Policies', icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pb-32">

      <main className="max-w-7xl mx-auto px-4 md:px-6 pt-20 md:pt-24 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
            <ArrowLeft className="w-5 h-5 text-white" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-[10px] uppercase tracking-[0.3em]">
              <KeyRound className="w-4 h-4" /> Single Sign-On
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">SSO & Authentication</h1>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'SSO Users', value: stats.totalUsers, icon: Users, color: 'text-cyan-400' },
            { label: 'Active IdPs', value: `${stats.activeProviders}/${mockProviders.length}`, icon: Globe, color: 'text-emerald-400' },
            { label: 'Failed Logins', value: stats.failedLogins, icon: XCircle, color: 'text-red-400' },
            { label: 'MFA Challenges', value: stats.mfaChallenges, icon: Fingerprint, color: 'text-amber-400' },
          ].map((kpi, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4">
              <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center mb-2 ${kpi.color}`}><kpi.icon className="w-4 h-4" /></div>
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="text-[10px] text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            </motion.div>
          ))}
        </div>

        {/* Security Alert */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-red-500/10 to-orange-500/10 border border-red-500/20 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white mb-1">Security Alert</h3>
              <p className="text-xs text-slate-300">2 failed login attempts detected from suspicious IPs (185.42.98.12, 91.108.12.55) in the last hour. Brute-force protection engaged. Recommend reviewing IP allowlist and enabling geo-blocking.</p>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab.id ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'}`}>
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'providers' && (
            <motion.div key="providers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
              {mockProviders.map((p, i) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">{p.icon}</div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-white">{p.name}</h3>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusColors[p.status].bg} ${statusColors[p.status].text}`}>
                            {p.status === 'connected' ? '● Connected' : p.status === 'error' ? '● Error' : '○ Disconnected'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                          <span className="flex items-center gap-1"><Link className="w-3 h-3" /> {p.domain}</span>
                          <span className="flex items-center gap-1"><Shield className="w-3 h-3" /> {p.protocol}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-black text-white">{p.users}</p>
                        <p className="text-[9px] text-slate-500 uppercase">Users</p>
                      </div>
                      <div className="text-center">
                        <p className="text-xs font-medium text-slate-400">{p.lastSync}</p>
                        <p className="text-[9px] text-slate-500 uppercase">Last Sync</p>
                      </div>
                      <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-xs text-slate-300 hover:bg-white/10 transition-colors">
                        Configure
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}

              {/* Add Provider */}
              <button className="w-full bg-white/[0.02] border-2 border-dashed border-white/10 rounded-2xl p-6 text-center hover:bg-white/5 hover:border-cyan-500/30 transition-all group">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-white/5 flex items-center justify-center mb-2 group-hover:bg-cyan-500/10 transition-colors">
                  <Globe className="w-6 h-6 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>
                <p className="text-sm font-medium text-slate-400 group-hover:text-white transition-colors">Add Identity Provider</p>
                <p className="text-xs text-slate-600 mt-1">SAML 2.0, OIDC, OAuth 2.0</p>
              </button>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div key="activity" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-2">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-white/5">
                  <h3 className="text-sm font-bold text-white">Authentication Log</h3>
                </div>
                {mockEvents.map((evt, i) => {
                  const sc = eventStatusConfig[evt.status];
                  const StatusIcon = sc.icon;
                  return (
                    <div key={evt.id} className="flex items-center gap-3 px-4 py-3 border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${sc.bg}`}>
                        <StatusIcon className={`w-4 h-4 ${sc.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-white truncate">{evt.user}</p>
                        <p className="text-[10px] text-slate-500">{evt.method} via {evt.provider}</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden md:block">
                        <p className="text-[10px] text-slate-400">{evt.ip}</p>
                        <p className="text-[10px] text-slate-500">{evt.location}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-[10px] text-slate-400">{evt.timestamp.split(' ')[1]}</p>
                        <p className={`text-[10px] font-bold ${sc.text}`}>{evt.status === 'mfa_challenge' ? 'MFA' : evt.status}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'config' && (
            <motion.div key="config" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Settings className="w-4 h-4 text-cyan-400" /> SAML Configuration</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Entity ID (Issuer)', value: configForm.entityId, key: 'entityId' },
                    { label: 'ACS URL (Reply URL)', value: configForm.acsUrl, key: 'acsUrl' },
                    { label: 'SLO URL (Logout)', value: configForm.sloUrl, key: 'sloUrl' },
                  ].map(field => (
                    <div key={field.key}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{field.label}</label>
                      <input type="text" value={field.value} readOnly
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                    </div>
                  ))}

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Name ID Format</label>
                    <select value={configForm.nameIdFormat} onChange={e => setConfigForm(p => ({ ...p, nameIdFormat: e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40">
                      <option value="email">urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</option>
                      <option value="persistent">urn:oasis:names:tc:SAML:2.0:nameid-format:persistent</option>
                      <option value="unspecified">urn:oasis:names:tc:SAML:2.0:nameid-format:unspecified</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">IdP Certificate (X.509)</label>
                    <textarea rows={4} placeholder="Paste IdP certificate here..."
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm font-mono placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/40 resize-none" />
                  </div>

                  <div className="flex gap-3">
                    <button className="px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
                      Save Configuration
                    </button>
                    <button className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
                      Test Connection
                    </button>
                    <button className="px-4 py-2.5 rounded-xl bg-white/5 text-slate-400 border border-white/10 text-sm font-medium hover:bg-white/10 transition-colors">
                      Download Metadata
                    </button>
                  </div>
                </div>
              </div>

              {/* OIDC Config */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /> OpenID Connect (OIDC)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { label: 'Client ID', value: 'safetymeg-prod-oidc-client' },
                    { label: 'Authorization Endpoint', value: 'https://auth.safetymeg.com/authorize' },
                    { label: 'Token Endpoint', value: 'https://auth.safetymeg.com/oauth/token' },
                    { label: 'UserInfo Endpoint', value: 'https://auth.safetymeg.com/userinfo' },
                  ].map(field => (
                    <div key={field.label}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">{field.label}</label>
                      <input type="text" value={field.value} readOnly
                        className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-xs font-mono focus:outline-none" />
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div key="security" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Shield className="w-4 h-4 text-cyan-400" /> Authentication Policies</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Multi-Factor Authentication (MFA)', desc: 'Require MFA for all SSO logins', enabled: configForm.mfaRequired, key: 'mfaRequired' },
                    { label: 'Just-In-Time Provisioning', desc: 'Auto-create user accounts on first SSO login', enabled: configForm.jitProvisioning, key: 'jitProvisioning' },
                    { label: 'Force SSO Only', desc: 'Disable direct password login for SSO-enabled domains', enabled: false, key: 'forceSso' },
                    { label: 'IP Allowlisting', desc: 'Restrict authentication to approved IP ranges', enabled: true, key: 'ipAllowlist' },
                    { label: 'Geo-Blocking', desc: 'Block authentication from restricted geographic regions', enabled: false, key: 'geoBlocking' },
                    { label: 'Brute Force Protection', desc: 'Lock accounts after 5 failed attempts for 30 minutes', enabled: true, key: 'bruteForce' },
                  ].map((policy, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white/[0.03] rounded-xl border border-white/5">
                      <div>
                        <p className="text-sm font-medium text-white">{policy.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{policy.desc}</p>
                      </div>
                      <button className={`w-12 h-6 rounded-full transition-colors relative ${policy.enabled ? 'bg-cyan-500' : 'bg-white/10'}`}>
                        <div className={`w-5 h-5 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform ${policy.enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Session Management */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-cyan-400" /> Session Management</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Session Timeout (minutes)</label>
                    <input type="number" value={configForm.sessionTimeout} onChange={e => setConfigForm(p => ({ ...p, sessionTimeout: +e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Idle Timeout (minutes)</label>
                    <input type="number" value={configForm.idleTimeout} onChange={e => setConfigForm(p => ({ ...p, idleTimeout: +e.target.value }))}
                      className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40" />
                  </div>
                </div>
                <button className="mt-4 px-4 py-2.5 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-sm font-medium hover:bg-cyan-500/30 transition-colors">
                  Save Security Policies
                </button>
              </div>

              {/* Compliance Badges */}
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
                <h3 className="text-sm font-bold text-white mb-4">Compliance & Certifications</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['SOC 2 Type II', 'ISO 27001', 'GDPR Compliant', 'HIPAA Ready'].map((cert, i) => (
                    <div key={i} className="bg-white/5 rounded-xl p-3 border border-white/5 text-center">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                      <p className="text-xs font-bold text-white">{cert}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

    </div>
  );
};

export default SSOLoginFlow;
