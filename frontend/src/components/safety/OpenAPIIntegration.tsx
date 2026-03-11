import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Globe, Code, Zap, Shield, ArrowRight, Copy, Check, ExternalLink, 
  ChevronDown, Server, Database, Lock, FileJson, RefreshCw, Bell,
  GitBranch, Layers, Terminal, Key
} from 'lucide-react';

interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  path: string;
  description: string;
  category: string;
}

const API_ENDPOINTS: APIEndpoint[] = [
  // Incidents
  { method: 'GET', path: '/api/v1/incidents', description: 'List all incidents with pagination', category: 'Incidents' },
  { method: 'POST', path: '/api/v1/incidents', description: 'Create new incident report', category: 'Incidents' },
  { method: 'GET', path: '/api/v1/incidents/{id}', description: 'Get incident by ID', category: 'Incidents' },
  { method: 'PUT', path: '/api/v1/incidents/{id}', description: 'Update incident', category: 'Incidents' },
  // Near Misses
  { method: 'GET', path: '/api/v1/near-misses', description: 'List all near miss reports', category: 'Near Misses' },
  { method: 'POST', path: '/api/v1/near-misses', description: 'Submit near miss report', category: 'Near Misses' },
  // Investigations
  { method: 'GET', path: '/api/v1/investigations', description: 'List investigations', category: 'Investigations' },
  { method: 'POST', path: '/api/v1/investigations/{id}/corrective-actions', description: 'Add corrective action', category: 'Investigations' },
  // Compliance
  { method: 'GET', path: '/api/v1/compliance/osha-logs', description: 'Get OSHA 300/300A/301 logs', category: 'Compliance' },
  { method: 'GET', path: '/api/v1/compliance/iso-documents', description: 'List ISO management documents', category: 'Compliance' },
  { method: 'POST', path: '/api/v1/compliance/audit', description: 'Submit compliance audit', category: 'Compliance' },
  // Training
  { method: 'GET', path: '/api/v1/training/records', description: 'Get training records', category: 'Training' },
  { method: 'POST', path: '/api/v1/training/completion', description: 'Record training completion', category: 'Training' },
  // Analytics
  { method: 'GET', path: '/api/v1/analytics/metrics', description: 'Get safety metrics and KPIs', category: 'Analytics' },
  { method: 'GET', path: '/api/v1/analytics/trends', description: 'Get trend analysis data', category: 'Analytics' },
  // Webhooks
  { method: 'POST', path: '/api/v1/webhooks', description: 'Register webhook endpoint', category: 'Webhooks' },
  { method: 'GET', path: '/api/v1/webhooks/events', description: 'List available webhook events', category: 'Webhooks' },
];

const INTEGRATIONS = [
  { name: 'SAP EHS', logo: '📊', description: 'Full SAP environment integration' },
  { name: 'Intelex', logo: '🔗', description: 'EHSQ management platform' },
  { name: 'Cority', logo: '🛡️', description: 'Enterprise EHS software' },
  { name: 'VelocityEHS', logo: '⚡', description: 'Cloud-based EHS platform' },
  { name: 'Enablon', logo: '📈', description: 'Sustainability and EHS' },
  { name: 'Power BI', logo: '📉', description: 'Business intelligence' },
  { name: 'Tableau', logo: '📊', description: 'Data visualization' },
  { name: 'ServiceNow', logo: '🔧', description: 'IT service management' },
];

const COMPLIANCE_STANDARDS = [
  { id: 'iso9001', name: 'ISO 9001:2015', description: 'Quality Management Systems', icon: Shield },
  { id: 'iso14001', name: 'ISO 14001:2015', description: 'Environmental Management', icon: Globe },
  { id: 'iso45001', name: 'ISO 45001:2018', description: 'Occupational Health & Safety', icon: Shield },
  { id: 'osha', name: 'OSHA', description: 'Occupational Safety Standards', icon: Lock },
  { id: 'niosh', name: 'NIOSH', description: 'Research & Prevention', icon: Database },
  { id: 'epa', name: 'EPA', description: 'Environmental Protection', icon: Globe },
  { id: 'bsee', name: 'BSEE', description: 'Bureau of Safety & Environmental', icon: Shield },
];

export const OpenAPIIntegration: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string>('overview');

  const categories = ['All', ...Array.from(new Set(API_ENDPOINTS.map(e => e.category)))];
  
  const filteredEndpoints = selectedCategory === 'All' 
    ? API_ENDPOINTS 
    : API_ENDPOINTS.filter(e => e.category === selectedCategory);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedEndpoint(text);
    setTimeout(() => setCopiedEndpoint(null), 2000);
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'POST': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'PUT': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'DELETE': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 rounded-3xl p-6 lg:p-8 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-30" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-white/80 text-xs font-bold uppercase tracking-widest mb-3">
            <Globe className="w-4 h-4" />
            Open API Platform
          </div>
          <h2 className="text-2xl lg:text-3xl font-bold mb-3">Seamless EHS Integration</h2>
          <p className="text-white/80 text-sm lg:text-base max-w-2xl leading-relaxed mb-6">
            Our Open API seamlessly integrates with your existing EHS stack, enhancing your business intelligence platforms 
            and EHS systems without adding complexity—just streamlined efficiency.
          </p>
          <div className="flex flex-wrap gap-3">
            <a 
              href="#docs" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-indigo-600 rounded-xl font-semibold text-sm hover:bg-white/90 transition-colors"
            >
              <FileJson className="w-4 h-4" />
              API Documentation
            </a>
            <a 
              href="#sdk" 
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/20 border border-white/30 rounded-xl font-semibold text-sm hover:bg-white/30 transition-colors"
            >
              <Code className="w-4 h-4" />
              Download SDK
            </a>
          </div>
        </div>
      </div>

      {/* Compliance Standards */}
      <div className="bg-slate-800 rounded-2xl lg:rounded-3xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => setExpandedSection(expandedSection === 'compliance' ? '' : 'compliance')}
          className="w-full p-4 lg:p-6 flex items-center justify-between hover:bg-slate-750 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-emerald-500 to-green-600 rounded-xl lg:rounded-2xl flex items-center justify-center">
              <Shield className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-lg font-bold text-white">Safety & Compliance Standards</h3>
              <p className="text-sm text-slate-400">ISO 9001, 14001, 45001, OSHA, NIOSH, EPA, BSEE</p>
            </div>
          </div>
          <motion.div animate={{ rotate: expandedSection === 'compliance' ? 180 : 0 }}>
            <ChevronDown className="w-5 h-5 text-slate-400" />
          </motion.div>
        </button>
        <AnimatePresence>
          {expandedSection === 'compliance' && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="px-4 pb-4 lg:px-6 lg:pb-6 pt-0 border-t border-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 mt-4">
                  {COMPLIANCE_STANDARDS.map((standard) => (
                    <div 
                      key={standard.id}
                      className="p-4 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-emerald-500/50 hover:bg-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-8 h-8 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                          <standard.icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="font-bold text-white text-sm">{standard.name}</span>
                      </div>
                      <p className="text-xs text-slate-400">{standard.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* API Features Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { icon: Zap, label: 'Real-time Sync', description: 'Live data updates', color: 'from-amber-500 to-orange-500' },
          { icon: Lock, label: 'Secure', description: 'OAuth 2.0 & API Keys', color: 'from-emerald-500 to-green-500' },
          { icon: RefreshCw, label: 'Webhooks', description: 'Event-driven updates', color: 'from-blue-500 to-cyan-500' },
          { icon: Layers, label: 'REST API', description: 'Standard JSON', color: 'from-purple-500 to-indigo-500' },
        ].map((feature, i) => (
          <div key={i} className="bg-slate-800 rounded-xl lg:rounded-2xl border border-slate-700 p-4">
            <div className={`w-10 h-10 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-3`}>
              <feature.icon className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-white text-sm mb-1">{feature.label}</h4>
            <p className="text-xs text-slate-400">{feature.description}</p>
          </div>
        ))}
      </div>

      {/* API Endpoints Section */}
      <div className="bg-slate-800 rounded-2xl lg:rounded-3xl border border-slate-700 overflow-hidden">
        <div className="p-4 lg:p-6 border-b border-slate-700">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl lg:rounded-2xl flex items-center justify-center">
                <Terminal className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">API Endpoints</h3>
                <p className="text-sm text-slate-400">RESTful API for EHS data integration</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    selectedCategory === cat
                      ? 'bg-brand-500 text-white'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="divide-y divide-slate-700/50 max-h-96 overflow-y-auto">
          {filteredEndpoints.map((endpoint, i) => (
            <div 
              key={i} 
              className="p-4 hover:bg-slate-750 transition-colors flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <span className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md border ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <code className="text-sm text-slate-300 font-mono truncate">{endpoint.path}</code>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-500 hidden lg:block">{endpoint.description}</span>
                <button
                  onClick={() => copyToClipboard(endpoint.path)}
                  className="p-2 hover:bg-slate-600 rounded-lg transition-colors"
                  title="Copy endpoint"
                >
                  {copiedEndpoint === endpoint.path ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Integrations */}
      <div className="bg-slate-800 rounded-2xl lg:rounded-3xl border border-slate-700 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl lg:rounded-2xl flex items-center justify-center">
            <GitBranch className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Pre-Built Integrations</h3>
            <p className="text-sm text-slate-400">Connect with popular EHS platforms</p>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {INTEGRATIONS.map((integration, i) => (
            <div 
              key={i}
              className="p-3 bg-slate-700/50 rounded-xl border border-slate-600/50 hover:border-purple-500/50 hover:bg-slate-700 transition-all text-center"
            >
              <div className="text-2xl mb-2">{integration.logo}</div>
              <h4 className="font-semibold text-white text-sm mb-0.5">{integration.name}</h4>
              <p className="text-[10px] text-slate-400">{integration.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Authentication */}
      <div className="bg-slate-800 rounded-2xl lg:rounded-3xl border border-slate-700 p-4 lg:p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-amber-500 to-red-600 rounded-xl lg:rounded-2xl flex items-center justify-center">
            <Key className="w-5 h-5 lg:w-6 lg:h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Authentication</h3>
            <p className="text-sm text-slate-400">Secure API access methods</p>
          </div>
        </div>
        <div className="bg-slate-900/50 rounded-xl p-4 font-mono text-sm overflow-x-auto">
          <pre className="text-slate-300">
{`// API Key Authentication
curl -H "X-API-Key: your_api_key" \\
     https://api.safetyhub.com/v1/incidents

// OAuth 2.0 Bearer Token
curl -H "Authorization: Bearer your_access_token" \\
     https://api.safetyhub.com/v1/incidents`}
          </pre>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-2xl lg:rounded-3xl border border-slate-600 p-6 text-center">
        <h3 className="text-xl font-bold text-white mb-2">Ready to Integrate?</h3>
        <p className="text-slate-400 text-sm mb-4">Get your API keys and start building with Safety Hub</p>
        <button className="px-6 py-3 bg-gradient-to-r from-brand-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-brand-600 hover:to-indigo-700 transition-all flex items-center gap-2 mx-auto">
          Get API Access
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default OpenAPIIntegration;
