import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import FadeContent from '../components/animations/FadeContent';
import {
  Building2,
  Users,
  Shield,
  Globe,
  Settings,
  Key,
  UserCog,
  FileText,
  Bell,
  CreditCard,
  Palette,
  Link as LinkIcon,
  ChevronRight,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import { SMButton } from '../components/ui';

interface Organization {
  id: string;
  name: string;
  plan: 'starter' | 'professional' | 'enterprise';
  users: number;
  facilities: number;
  regions: string[];
  industries: string[];
  createdAt: Date;
}

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'manager' | 'user' | 'viewer';
  avatar?: string;
  lastActive: Date;
}

const planFeatures = {
  starter: ['5 Users', '3 Facilities', 'Basic Reports', 'Email Support'],
  professional: ['25 Users', '15 Facilities', 'Advanced Analytics', 'API Access', 'Priority Support'],
  enterprise: ['Unlimited Users', 'Unlimited Facilities', 'Custom Integrations', 'SSO/SAML', '24/7 Support', 'Dedicated CSM'],
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 100, damping: 15 } }
};

export const OrganizationSettings: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'general' | 'team' | 'security' | 'billing' | 'integrations'>('general');
  
  // Mock organization data
  const [organization] = useState<Organization>({
    id: 'ORG-001',
    name: 'Acme Industries',
    plan: 'enterprise',
    users: 248,
    facilities: 45,
    regions: ['North America', 'Europe', 'Asia Pacific'],
    industries: ['Manufacturing', 'Construction', 'Logistics'],
    createdAt: new Date('2024-01-15'),
  });

  const [teamMembers] = useState<TeamMember[]>([
    { id: '1', name: 'Sarah Johnson', email: 'sarah.johnson@acme.com', role: 'owner', lastActive: new Date() },
    { id: '2', name: 'Michael Chen', email: 'michael.chen@acme.com', role: 'admin', lastActive: new Date(Date.now() - 3600000) },
    { id: '3', name: 'Emily Williams', email: 'emily.w@acme.com', role: 'manager', lastActive: new Date(Date.now() - 7200000) },
    { id: '4', name: 'David Rodriguez', email: 'd.rodriguez@acme.com', role: 'manager', lastActive: new Date(Date.now() - 86400000) },
    { id: '5', name: 'Lisa Thompson', email: 'l.thompson@acme.com', role: 'user', lastActive: new Date(Date.now() - 172800000) },
  ]);

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'integrations', label: 'Integrations', icon: LinkIcon },
  ];

  const getRoleBadgeColor = (role: TeamMember['role']) => {
    switch (role) {
      case 'owner': return 'bg-ai/10 text-ai';
      case 'admin': return 'bg-danger/10 text-danger';
      case 'manager': return 'bg-accent/10 text-accent';
      case 'user': return 'bg-success/10 text-success';
      default: return 'bg-surface-sunken text-text-secondary';
    }
  };

  return (
    <FadeContent blur duration={400} delay={0}>
      <div className="min-h-screen pb-24 bg-surface-base">
        {/* Header */}
        <header className="sticky top-[72px] z-40 bg-surface-overlay border-b border-surface-border">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-text-primary">Organization Settings</h1>
                <p className="text-xs text-text-muted">{organization.name}</p>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mt-4 overflow-x-auto pb-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'bg-accent/10 text-accent'
                      : 'text-text-secondary hover:bg-surface-overlay'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </header>

        <main className="p-4 pb-24">
          <AnimatePresence mode="wait">
            {/* General Tab */}
            {activeTab === 'general' && (
              <motion.div
                key="general"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Organization Profile</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-text-onAccent text-2xl font-bold">
                      {organization.name.charAt(0)}
                    </div>
                    <div>
                      <button className="text-sm text-accent font-medium">Change Logo</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        defaultValue={organization.name}
                        className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-sunken"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Organization ID
                      </label>
                      <input
                        type="text"
                        value={organization.id}
                        disabled
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-sunken text-text-muted"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Primary Industries
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {organization.industries.map((industry) => (
                          <span key={industry} className="px-3 py-1 bg-surface-sunken rounded-full text-sm">
                            {industry}
                          </span>
                        ))}
                        <button className="px-3 py-1 border border-dashed border-surface-border rounded-full text-sm text-text-muted hover:border-accent hover:text-accent transition-colors">
                          + Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Operating Regions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {organization.regions.map((region) => (
                          <span key={region} className="px-3 py-1 bg-accent/10 text-accent rounded-full text-sm">
                            {region}
                          </span>
                        ))}
                        <button className="px-3 py-1 border border-dashed border-surface-border rounded-full text-sm text-text-muted hover:border-accent hover:text-accent transition-colors">
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Localization</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Default Language
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-sunken">
                        <option value="en">English</option>
                        <option value="es">Español</option>
                        <option value="fr">Français</option>
                        <option value="de">Deutsch</option>
                        <option value="zh">中文</option>
                        <option value="ja">日本語</option>
                        <option value="pt">Português</option>
                        <option value="ar">العربية</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Timezone
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-sunken">
                        <option value="UTC">UTC</option>
                        <option value="America/New_York">Eastern Time</option>
                        <option value="America/Chicago">Central Time</option>
                        <option value="America/Denver">Mountain Time</option>
                        <option value="America/Los_Angeles">Pacific Time</option>
                        <option value="Europe/London">London</option>
                        <option value="Europe/Paris">Paris</option>
                        <option value="Asia/Tokyo">Tokyo</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Date Format
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-sunken">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-text-secondary mb-1">
                        Units
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-border rounded-lg bg-surface-sunken">
                        <option value="imperial">Imperial (ft, lb, °F)</option>
                        <option value="metric">Metric (m, kg, °C)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">System Maintenance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-text-primary">Clear Application Cache</p>
                        <p className="text-sm text-text-muted">Remove all locally stored audits, history, and preferences.</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to clear all application data? This action cannot be undone.')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="px-4 py-2 bg-danger hover:bg-danger/80 text-text-onAccent rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear All Data
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <SMButton variant="primary" className="w-full">Save Changes</SMButton>
                </motion.div>
              </motion.div>
            )}

            {/* Team Tab */}
            {activeTab === 'team' && (
              <motion.div
                key="team"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-text-primary">Team Members</h3>
                    <p className="text-sm text-text-muted">{teamMembers.length} of {organization.plan === 'enterprise' ? 'Unlimited' : organization.plan === 'professional' ? '25' : '5'} users</p>
                  </div>
                  <SMButton variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>Invite</SMButton>
                </motion.div>

                <motion.div variants={containerVariants} className="space-y-2">
                  {teamMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      variants={itemVariants}
                      className="flex items-center gap-4 p-4 bg-surface-overlay rounded-xl border border-surface-border"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-text-onAccent font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-text-primary">{member.name}</h4>
                        <p className="text-sm text-text-muted">{member.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      <button className="p-2 hover:bg-surface-overlay rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4 text-text-muted" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-3">Role Permissions</h3>
                  <div className="space-y-3">
                    {['Owner', 'Admin', 'Manager', 'User', 'Viewer'].map((role) => (
                      <div key={role} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                        <span className="text-sm font-medium text-text-secondary">{role}</span>
                        <button className="text-xs text-accent font-medium">Configure</button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <motion.div
                key="security"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Single Sign-On (SSO)</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-success/10 rounded-lg border border-success/20">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-success" />
                        <div>
                          <p className="font-medium text-success">SAML 2.0 Available</p>
                          <p className="text-sm text-success">Enterprise feature enabled</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-success text-text-onAccent rounded-lg font-medium hover:bg-success/80 transition-colors">
                        Configure
                      </button>
                    </div>
                    <div className="space-y-2">
                      {['Okta', 'Azure AD', 'Google Workspace', 'OneLogin', 'Custom SAML'].map((provider) => (
                        <div key={provider} className="flex items-center justify-between p-3 bg-surface-sunken rounded-lg">
                          <span className="text-sm font-medium text-text-secondary">{provider}</span>
                          <button className="text-xs text-accent font-medium">Setup</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Security Policies</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Two-Factor Authentication', description: 'Require 2FA for all users', enabled: true },
                      { label: 'Session Timeout', description: 'Auto-logout after inactivity', enabled: true },
                      { label: 'IP Allowlist', description: 'Restrict access to approved IPs', enabled: false },
                      { label: 'Password Policy', description: 'Enforce strong passwords', enabled: true },
                    ].map((policy) => (
                      <div key={policy.label} className="flex items-center justify-between p-3 bg-surface-sunken rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-text-secondary">{policy.label}</p>
                          <p className="text-xs text-text-muted">{policy.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={policy.enabled} className="sr-only peer" />
                          <div className="w-11 h-6 bg-surface-border peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-text-primary">Audit Log</h3>
                    <button className="text-xs text-accent font-medium">Export</button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { action: 'User invited', user: 'Sarah Johnson', time: '2 min ago' },
                      { action: 'Role changed', user: 'Michael Chen', time: '1 hr ago' },
                      { action: 'SSO configured', user: 'Admin', time: '3 hr ago' },
                      { action: 'Password reset', user: 'Emily Williams', time: '1 day ago' },
                    ].map((log, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-surface-border last:border-0">
                        <div>
                          <p className="text-sm text-text-secondary">{log.action}</p>
                          <p className="text-xs text-text-muted">{log.user}</p>
                        </div>
                        <span className="text-xs text-text-muted">{log.time}</span>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <motion.div
                key="billing"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 text-text-onAccent">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-text-onAccent/70 text-sm">Current Plan</p>
                      <h3 className="text-2xl font-bold capitalize">{organization.plan}</h3>
                    </div>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">Active</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {planFeatures[organization.plan].map((feature) => (
                      <span key={feature} className="flex items-center gap-1 text-sm text-brand-100">
                        <Check className="w-4 h-4" /> {feature}
                      </span>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Usage This Month</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-text-muted">Active Users</span>
                        <span className="font-medium text-text-primary">{organization.users} / Unlimited</span>
                      </div>
                      <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-text-muted">Facilities</span>
                        <span className="font-medium text-text-primary">{organization.facilities} / Unlimited</span>
                      </div>
                      <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-success rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-text-muted">API Calls</span>
                        <span className="font-medium text-text-primary">1.2M / 5M</span>
                      </div>
                      <div className="h-2 bg-surface-sunken rounded-full overflow-hidden">
                        <div className="h-full bg-accent rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Payment Method</h3>
                  <div className="flex items-center gap-4 p-4 bg-surface-sunken rounded-lg">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-text-primary">•••• •••• •••• 4242</p>
                      <p className="text-xs text-text-muted">Expires 12/2027</p>
                    </div>
                    <button className="ml-auto text-sm text-accent font-medium">Update</button>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* Integrations Tab */}
            {activeTab === 'integrations' && (
              <motion.div
                key="integrations"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="hidden"
                className="space-y-4"
              >
                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">API Access</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface-sunken rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-surface-600 dark:text-text-muted" />
                        <div>
                          <p className="font-medium text-text-primary">API Key</p>
                          <p className="text-sm text-text-muted font-mono">sk-••••••••••••••••4a2f</p>
                        </div>
                      </div>
                      <button className="text-sm text-accent font-medium">Regenerate</button>
                    </div>
                    <a href="#" className="block text-sm text-accent font-medium hover:underline">
                      View API Documentation →
                    </a>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Connected Services</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Slack', icon: '💬', status: 'connected', description: 'Real-time notifications' },
                      { name: 'Microsoft Teams', icon: '👥', status: 'available', description: 'Team collaboration' },
                      { name: 'SAP ERP', icon: '🏢', status: 'connected', description: 'Enterprise resource sync' },
                      { name: 'Salesforce', icon: '☁️', status: 'available', description: 'CRM integration' },
                      { name: 'Power BI', icon: '📊', status: 'connected', description: 'Analytics dashboard' },
                      { name: 'Tableau', icon: '📈', status: 'available', description: 'Data visualization' },
                    ].map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 bg-surface-sunken rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.icon}</span>
                          <div>
                            <p className="font-medium text-text-primary">{service.name}</p>
                            <p className="text-xs text-text-muted">{service.description}</p>
                          </div>
                        </div>
                        {service.status === 'connected' ? (
                          <span className="px-2 py-1 bg-success/10 text-success rounded-full text-xs font-medium">
                            Connected
                          </span>
                        ) : (
                          <button className="px-3 py-1 border border-accent text-accent rounded-lg text-sm font-medium hover:bg-accent/5 transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-surface-overlay rounded-xl border border-surface-border p-4">
                  <h3 className="font-semibold text-text-primary mb-4">Webhooks</h3>
                  <p className="text-sm text-text-muted mb-4">Receive real-time notifications for events</p>
                  <button 
                    onClick={() => navigate('/webhooks')}
                    className="w-full py-2 border border-accent text-accent rounded-lg font-medium hover:bg-accent/5 transition-colors"
                  >
                    Configure Webhooks
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </FadeContent>
  );
};

export default OrganizationSettings;
