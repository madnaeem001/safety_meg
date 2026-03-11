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
      case 'owner': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'admin': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      case 'manager': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'user': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400';
      default: return 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300';
    }
  };

  return (
    <FadeContent blur duration={400} delay={0}>
      <div className="min-h-screen pb-24 bg-surface-50 dark:bg-surface-900">
        {/* Header */}
        <header className="sticky top-[72px] z-40 bg-white dark:bg-surface-800 border-b border-surface-200 dark:border-surface-700">
          <div className="px-4 py-3">
            <div className="flex items-center gap-3">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-full transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div>
                <h1 className="text-lg font-semibold text-surface-900 dark:text-white">Organization Settings</h1>
                <p className="text-xs text-surface-500">{organization.name}</p>
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
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400'
                      : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-700'
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
                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Organization Profile</h3>
                  
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                      {organization.name.charAt(0)}
                    </div>
                    <div>
                      <button className="text-sm text-brand-600 font-medium">Change Logo</button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Organization Name
                      </label>
                      <input
                        type="text"
                        defaultValue={organization.name}
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Organization ID
                      </label>
                      <input
                        type="text"
                        value={organization.id}
                        disabled
                        className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-100 dark:bg-surface-800 text-surface-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Primary Industries
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {organization.industries.map((industry) => (
                          <span key={industry} className="px-3 py-1 bg-surface-100 dark:bg-surface-700 rounded-full text-sm">
                            {industry}
                          </span>
                        ))}
                        <button className="px-3 py-1 border border-dashed border-surface-300 dark:border-surface-600 rounded-full text-sm text-surface-500 hover:border-brand-500 hover:text-brand-500 transition-colors">
                          + Add
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Operating Regions
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {organization.regions.map((region) => (
                          <span key={region} className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded-full text-sm">
                            {region}
                          </span>
                        ))}
                        <button className="px-3 py-1 border border-dashed border-surface-300 dark:border-surface-600 rounded-full text-sm text-surface-500 hover:border-brand-500 hover:text-brand-500 transition-colors">
                          + Add
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Localization</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Default Language
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700">
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
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Timezone
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700">
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
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Date Format
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700">
                        <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                        <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                        <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1">
                        Units
                      </label>
                      <select className="w-full px-3 py-2 border border-surface-300 dark:border-surface-600 rounded-lg bg-white dark:bg-surface-700">
                        <option value="imperial">Imperial (ft, lb, °F)</option>
                        <option value="metric">Metric (m, kg, °C)</option>
                      </select>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">System Maintenance</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-surface-900 dark:text-white">Clear Application Cache</p>
                        <p className="text-sm text-surface-500">Remove all locally stored audits, history, and preferences.</p>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm('Are you sure you want to clear all application data? This action cannot be undone.')) {
                            localStorage.clear();
                            window.location.reload();
                          }
                        }}
                        className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors"
                      >
                        Clear All Data
                      </button>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <button className="w-full py-3 bg-brand-500 text-white rounded-xl font-medium hover:bg-brand-600 transition-colors">
                    Save Changes
                  </button>
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
                    <h3 className="font-semibold text-surface-900 dark:text-white">Team Members</h3>
                    <p className="text-sm text-surface-500">{teamMembers.length} of {organization.plan === 'enterprise' ? 'Unlimited' : organization.plan === 'professional' ? '25' : '5'} users</p>
                  </div>
                  <button className="flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg font-medium hover:bg-brand-600 transition-colors">
                    <Plus className="w-4 h-4" />
                    Invite
                  </button>
                </motion.div>

                <motion.div variants={containerVariants} className="space-y-2">
                  {teamMembers.map((member) => (
                    <motion.div
                      key={member.id}
                      variants={itemVariants}
                      className="flex items-center gap-4 p-4 bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700"
                    >
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center text-white font-medium">
                        {member.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-surface-900 dark:text-white">{member.name}</h4>
                        <p className="text-sm text-surface-500">{member.email}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getRoleBadgeColor(member.role)}`}>
                        {member.role}
                      </span>
                      <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors">
                        <ChevronRight className="w-4 h-4 text-surface-400" />
                      </button>
                    </motion.div>
                  ))}
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-3">Role Permissions</h3>
                  <div className="space-y-3">
                    {['Owner', 'Admin', 'Manager', 'User', 'Viewer'].map((role) => (
                      <div key={role} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-0">
                        <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{role}</span>
                        <button className="text-xs text-brand-600 font-medium">Configure</button>
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
                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Single Sign-On (SSO)</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-3">
                        <Shield className="w-5 h-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700 dark:text-green-400">SAML 2.0 Available</p>
                          <p className="text-sm text-green-600 dark:text-green-500">Enterprise feature enabled</p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
                        Configure
                      </button>
                    </div>
                    <div className="space-y-2">
                      {['Okta', 'Azure AD', 'Google Workspace', 'OneLogin', 'Custom SAML'].map((provider) => (
                        <div key={provider} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                          <span className="text-sm font-medium text-surface-700 dark:text-surface-300">{provider}</span>
                          <button className="text-xs text-brand-600 font-medium">Setup</button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Security Policies</h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Two-Factor Authentication', description: 'Require 2FA for all users', enabled: true },
                      { label: 'Session Timeout', description: 'Auto-logout after inactivity', enabled: true },
                      { label: 'IP Allowlist', description: 'Restrict access to approved IPs', enabled: false },
                      { label: 'Password Policy', description: 'Enforce strong passwords', enabled: true },
                    ].map((policy) => (
                      <div key={policy.label} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-surface-700 dark:text-surface-300">{policy.label}</p>
                          <p className="text-xs text-surface-500">{policy.description}</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" defaultChecked={policy.enabled} className="sr-only peer" />
                          <div className="w-11 h-6 bg-surface-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-500 rounded-full peer dark:bg-surface-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                        </label>
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-surface-900 dark:text-white">Audit Log</h3>
                    <button className="text-xs text-brand-600 font-medium">Export</button>
                  </div>
                  <div className="space-y-2">
                    {[
                      { action: 'User invited', user: 'Sarah Johnson', time: '2 min ago' },
                      { action: 'Role changed', user: 'Michael Chen', time: '1 hr ago' },
                      { action: 'SSO configured', user: 'Admin', time: '3 hr ago' },
                      { action: 'Password reset', user: 'Emily Williams', time: '1 day ago' },
                    ].map((log, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-surface-100 dark:border-surface-700 last:border-0">
                        <div>
                          <p className="text-sm text-surface-700 dark:text-surface-300">{log.action}</p>
                          <p className="text-xs text-surface-500">{log.user}</p>
                        </div>
                        <span className="text-xs text-surface-500">{log.time}</span>
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
                <motion.div variants={itemVariants} className="bg-gradient-to-r from-brand-500 to-brand-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-brand-100 text-sm">Current Plan</p>
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

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Usage This Month</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-surface-400">Active Users</span>
                        <span className="font-medium text-surface-900 dark:text-white">{organization.users} / Unlimited</span>
                      </div>
                      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-brand-500 rounded-full" style={{ width: '45%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-surface-400">Facilities</span>
                        <span className="font-medium text-surface-900 dark:text-white">{organization.facilities} / Unlimited</span>
                      </div>
                      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-green-500 rounded-full" style={{ width: '30%' }} />
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-surface-600 dark:text-surface-400">API Calls</span>
                        <span className="font-medium text-surface-900 dark:text-white">1.2M / 5M</span>
                      </div>
                      <div className="h-2 bg-surface-100 dark:bg-surface-700 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: '24%' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Payment Method</h3>
                  <div className="flex items-center gap-4 p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
                    <div className="w-12 h-8 bg-gradient-to-r from-blue-600 to-blue-800 rounded flex items-center justify-center text-white text-xs font-bold">
                      VISA
                    </div>
                    <div>
                      <p className="font-medium text-surface-900 dark:text-white">•••• •••• •••• 4242</p>
                      <p className="text-xs text-surface-500">Expires 12/2027</p>
                    </div>
                    <button className="ml-auto text-sm text-brand-600 font-medium">Update</button>
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
                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">API Access</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-surface-50 dark:bg-surface-700 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Key className="w-5 h-5 text-surface-600 dark:text-surface-400" />
                        <div>
                          <p className="font-medium text-surface-900 dark:text-white">API Key</p>
                          <p className="text-sm text-surface-500 font-mono">sk-••••••••••••••••4a2f</p>
                        </div>
                      </div>
                      <button className="text-sm text-brand-600 font-medium">Regenerate</button>
                    </div>
                    <a href="#" className="block text-sm text-brand-600 font-medium hover:underline">
                      View API Documentation →
                    </a>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Connected Services</h3>
                  <div className="space-y-2">
                    {[
                      { name: 'Slack', icon: '💬', status: 'connected', description: 'Real-time notifications' },
                      { name: 'Microsoft Teams', icon: '👥', status: 'available', description: 'Team collaboration' },
                      { name: 'SAP ERP', icon: '🏢', status: 'connected', description: 'Enterprise resource sync' },
                      { name: 'Salesforce', icon: '☁️', status: 'available', description: 'CRM integration' },
                      { name: 'Power BI', icon: '📊', status: 'connected', description: 'Analytics dashboard' },
                      { name: 'Tableau', icon: '📈', status: 'available', description: 'Data visualization' },
                    ].map((service) => (
                      <div key={service.name} className="flex items-center justify-between p-3 bg-surface-50 dark:bg-surface-700 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{service.icon}</span>
                          <div>
                            <p className="font-medium text-surface-900 dark:text-white">{service.name}</p>
                            <p className="text-xs text-surface-500">{service.description}</p>
                          </div>
                        </div>
                        {service.status === 'connected' ? (
                          <span className="px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full text-xs font-medium">
                            Connected
                          </span>
                        ) : (
                          <button className="px-3 py-1 border border-brand-500 text-brand-600 rounded-lg text-sm font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors">
                            Connect
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-white dark:bg-surface-800 rounded-xl border border-surface-200 dark:border-surface-700 p-4">
                  <h3 className="font-semibold text-surface-900 dark:text-white mb-4">Webhooks</h3>
                  <p className="text-sm text-surface-500 mb-4">Receive real-time notifications for events</p>
                  <button 
                    onClick={() => navigate('/webhooks')}
                    className="w-full py-2 border border-brand-500 text-brand-600 rounded-lg font-medium hover:bg-brand-50 dark:hover:bg-brand-900/20 transition-colors"
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
