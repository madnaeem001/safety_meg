import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, Brain, BarChart3, CheckCircle2, ArrowRight, Play, Star, Users, Building2, Globe,
  Leaf, FileCheck, AlertTriangle, TrendingUp, Zap, Lock, Cloud, Smartphone, ChevronRight,
  ChevronDown, Menu, X, Award, Clock, Target, Activity, Bell, Clipboard, HardHat, Factory,
  Truck, Gauge, Eye, Cpu, Radio, Server, Database, Wifi, Signal, Download, Apple, MonitorSmartphone,
  Flame, Thermometer, KeyRound, HardDrive, ShieldCheck, Bot, Layers, Fingerprint, Scan
} from 'lucide-react';
import { useLandingStats, useCreateDemoRequest } from '../api/hooks/useAPIHooks';

// AI Engines data
const AI_ENGINES = [
  { name: 'Visual Audit AI', desc: 'Real-time hazard detection from images & video feeds', icon: Eye, status: 'active', accuracy: '97.3%', color: 'cyan' },
  { name: 'Predictive Risk Engine', desc: 'Forecasts incidents 7 days ahead using ML patterns', icon: Brain, status: 'active', accuracy: '94.1%', color: 'purple' },
  { name: 'Compliance AI', desc: 'Auto-syncs with OSHA, ISO, EPA, NIOSH standards', icon: ShieldCheck, status: 'active', accuracy: '99.2%', color: 'green' },
  { name: 'NLP Safety Engine', desc: 'Natural language incident reports & voice commands', icon: Bot, status: 'active', accuracy: '96.8%', color: 'blue' },
  { name: 'IoT Neural Network', desc: 'Real-time sensor analysis from 10K+ endpoints', icon: Cpu, status: 'active', accuracy: '98.5%', color: 'amber' },
  { name: 'Behavioral Analytics', desc: 'Worker behavior patterns & ergonomic AI coaching', icon: Activity, status: 'active', accuracy: '91.7%', color: 'rose' },
];

const FEATURES = [
  { icon: Brain, title: 'Predictive Safety AI', desc: 'AI-powered risk prediction identifies potential incidents before they happen.', stat: '78% accuracy' },
  { icon: Eye, title: 'AI Visual Audit', desc: 'Upload photos & videos — AI scans for PPE, hazards, machinery risks in real-time.', stat: '97% detection' },
  { icon: FileCheck, title: 'ePermit Workflows', desc: 'Digital permit-to-work with multi-level approvals and contractor management.', stat: '3x faster' },
  { icon: Leaf, title: 'ESG & Sustainability', desc: 'Scope 1/2/3 emissions, carbon tracking, sustainability dashboards.', stat: '40% reduction' },
  { icon: AlertTriangle, title: 'Incident Management', desc: 'Full lifecycle — reporting, investigation, root cause, corrective actions (CAPA).', stat: 'Real-time' },
  { icon: BarChart3, title: 'Analytics & KPIs', desc: 'Custom dashboards, 50+ report templates, trend analysis, benchmarking.', stat: '50+ reports' },
  { icon: Users, title: 'Training & Certs', desc: 'Track certifications, schedule training, AI-generated courses, compliance tracking.', stat: '99% compliance' },
  { icon: Scan, title: 'Asset Intelligence', desc: 'QR/Barcode scanning, AI photo ID, SDS library, maintenance scheduling.', stat: '2,847 assets' },
  { icon: Flame, title: 'Emergency Response', desc: 'Emergency action plans, muster points, drill scheduling, notification cascades.', stat: 'Instant alerts' },
  { icon: KeyRound, title: 'Lockout/Tagout (LOTO)', desc: 'Digital LOTO procedures, energy isolation verification, machine-specific protocols.', stat: 'Zero incidents' },
  { icon: Thermometer, title: 'Ergonomics AI', desc: 'AI-powered ergonomic assessments, posture analysis, workstation optimization.', stat: '35% less strain' },
  { icon: Layers, title: 'Confined Space', desc: 'Confined space permits, atmospheric monitoring, rescue plans, entry logs.', stat: 'Full compliance' },
];

const STATS = [
  { value: '67%', label: 'Avg Incident Reduction' },
  { value: '89%', label: 'Hazards Caught by AI' },
  { value: '500+', label: 'Safety Teams Trust Us' },
  { value: '4.9★', label: 'Customer Satisfaction' },
];

const PRICING = [
  { name: 'Starter', price: '$299', period: '/month', desc: 'Small teams getting started', features: ['Up to 50 users','Incident reporting','Basic analytics','Mobile app access','5 GB storage','Email support'], popular: false },
  { name: 'Professional', price: '$799', period: '/month', desc: 'Growing organizations', features: ['Up to 500 users','Everything in Starter','Predictive Safety AI','AI Visual Audit','ePermit workflows','API access','50 GB storage','Priority support'], popular: true },
  { name: 'Enterprise', price: 'Custom', period: '', desc: 'Full platform for large enterprises', features: ['Unlimited users','Everything in Professional','ESG & Sustainability','Multi-site management','SSO & advanced security','Unlimited AI storage','Custom integrations','Dedicated success manager'], popular: false },
];

const FAQS = [
  { q: 'How does the Predictive Safety AI work?', a: 'Our AI analyzes historical incident data, near-misses, environmental conditions, work schedules, and equipment sensor data to identify patterns and predict potential safety risks before they occur. The system continuously learns and improves its accuracy.' },
  { q: 'Can I integrate with existing systems?', a: 'Yes! SafetyMEG offers robust API integrations with SAP, Oracle, Workday, ADP, and IoT sensor networks. Our team can also build custom integrations.' },
  { q: 'Is my data secure?', a: 'SOC 2 Type II certified and GDPR compliant. All data encrypted at rest and in transit with regular security audits. On-premise deployment available.' },
  { q: 'How long does implementation take?', a: 'Most customers are live within 2-4 weeks. Enterprise deployments 6-12 weeks depending on complexity.' },
  { q: 'What mobile platforms are supported?', a: 'SafetyMEG is a Progressive Web App (PWA) that works on iOS, Android, and desktop. Install directly from your browser — no app store needed. Offline-capable with full touch optimization.' },
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const testimonials = [
    { quote: "SafetyMEG reduced our incident rate by 67% in the first year. The AI predictions are game-changing.", author: "Sarah Chen", role: "VP of Safety", company: "Global Manufacturing Co.", rating: 5 },
    { quote: "The AI visual audit transformed our inspections. What took hours now takes minutes with higher accuracy.", author: "Michael Torres", role: "HSE Director", company: "Energy Partners Inc.", rating: 5 },
    { quote: "Finally, a platform that combines safety, sustainability, and AI. Our ESG reporting is now seamless.", author: "Emma Williams", role: "Sustainability Manager", company: "GreenTech Solutions", rating: 5 },
  ];

  useEffect(() => {
    const interval = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(interval);
  }, []);

  // ── Live platform stats from backend ───────────────────────────────────
  const { data: landingStatsData } = useLandingStats();
  const { mutate: submitDemoRequest } = useCreateDemoRequest();

  // Derive display stats: API values take precedence, fallback to marketing defaults
  const displayStats = useMemo(() => {
    const d = landingStatsData as any;
    if (!d) return STATS;
    const workers = d.activeWorkers ?? 0;
    const workerDisplay = workers >= 1000
      ? `${Math.floor(workers / 100) * 100}+`
      : workers > 0 ? `${workers}+`
      : '500+';
    return [
      { value: `${d.incidentReduction ?? 67}%`, label: 'Avg Incident Reduction' },
      { value: `${d.hazardDetection  ?? 89}%`,  label: 'Hazards Caught by AI'  },
      { value: workerDisplay,                    label: 'Safety Teams Trust Us'  },
      { value: `${d.customerSatisfaction ?? 4.9}★`, label: 'Customer Satisfaction' },
    ];
  }, [landingStatsData]);

  // Handler for “Schedule Demo” — POST to backend then navigate to app
  const handleScheduleDemo = () => {
    submitDemoRequest({ name: 'Website Visitor', email: 'demo@safetymeg.app', source: 'cta-section' });
    navigate('/');
  };

  // Handler for “Watch 2-Min Demo” — scroll to features section
  const handleWatchDemo = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(165deg, #020617 0%, #0f172a 35%, #0c1222 70%, #020617 100%)' }}>
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50" style={{ background: 'rgba(2, 6, 23, 0.85)', backdropFilter: 'blur(24px)', borderBottom: '1px solid rgba(6, 182, 212, 0.1)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="SafetyMEG" className="w-10 h-10 object-contain" />
              <span className="text-xl font-bold text-white font-display">SafetyMEG</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'AI Engines', 'Pricing', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="text-sm text-slate-400 hover:text-cyan-400 transition-colors">{item}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-4">
              <button onClick={() => navigate('/')} className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-cyan-400 transition-colors">Sign In</button>
              <button onClick={() => navigate('/')} className="px-5 py-2.5 bg-cyan-500 text-white text-sm font-medium rounded-xl hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-500/25">
                Start Free Trial
              </button>
            </div>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 text-slate-400">
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="md:hidden border-t border-cyan-500/10" style={{ background: 'rgba(2, 6, 23, 0.95)' }}>
              <div className="px-4 py-4 space-y-3">
                {['Features', 'AI Engines', 'Pricing', 'FAQ'].map(item => (
                  <a key={item} href={`#${item.toLowerCase().replace(' ', '-')}`} className="block py-2 text-slate-400">{item}</a>
                ))}
                <button onClick={() => navigate('/')} className="w-full py-3 bg-cyan-500 text-white rounded-xl font-medium">Start Free Trial</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 cyber-grid-bg opacity-30" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-cyan-500/10 rounded-full blur-3xl orb-float" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/8 rounded-full blur-3xl orb-float-delayed" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-cyan-400 text-sm font-medium mb-6">
                <Zap className="w-4 h-4" />
                Trusted by 500+ Safety Teams Worldwide
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 font-display">
                Stop Losing Workers
                <span className="text-holographic"> to Preventable Incidents.</span>
              </h1>
              <p className="text-lg text-slate-400 mb-8 max-w-xl">
                Your team deserves to come home safe every day. SafetyMEG uses 6 AI engines to predict hazards before they strike — so you can stop reacting and start preventing. Built for EHS leaders who refuse to accept "it's just part of the job."
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <button onClick={() => navigate('/')} className="px-6 py-3.5 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/25 flex items-center gap-2 group">
                  See How It Works <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
                <button className="px-6 py-3.5 bg-slate-800/60 border border-slate-700 text-slate-300 font-medium rounded-xl hover:bg-slate-800 hover:border-cyan-500/30 transition-all flex items-center gap-2" onClick={handleWatchDemo}>
                  <Play className="w-4 h-4" /> Watch 2-Min Demo
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 14-day free trial</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> No credit card</div>
                <div className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> SOC 2 certified</div>
              </div>
              {/* Mobile Download Badges */}
              <div className="mt-8 flex items-center gap-4">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer">
                  <MonitorSmartphone className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Install as</p>
                    <p className="text-xs font-bold text-white">Mobile App (PWA)</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-800/80 border border-slate-700 rounded-xl hover:border-cyan-500/30 transition-all cursor-pointer">
                  <Download className="w-5 h-5 text-cyan-400" />
                  <div>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Works on</p>
                    <p className="text-xs font-bold text-white">iOS & Android</p>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Dashboard Preview - Futuristic */}
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative">
              <div className="holo-card rounded-2xl overflow-hidden shadow-2xl">
                <div className="p-3 border-b border-cyan-500/10 flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-400/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
                  <span className="ml-2 text-[10px] font-mono text-slate-500">safetymeg.app/command-center</span>
                </div>
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="p-4 bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 rounded-xl border border-cyan-500/15">
                      <Shield className="w-5 h-5 text-cyan-400 mb-2" />
                      <p className="text-2xl font-black text-white">98.5%</p>
                      <p className="text-[10px] text-cyan-400/60 uppercase tracking-wider">Safety Score</p>
                    </div>
                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30">
                      <Brain className="w-5 h-5 text-purple-400 mb-2" />
                      <p className="text-2xl font-black text-white">14.2K</p>
                      <p className="text-[10px] text-slate-400 uppercase tracking-wider">AI Predictions</p>
                    </div>
                  </div>
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/30 mb-3">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-medium text-slate-300">AI Risk Prediction</span>
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">6 Engines Active</span>
                    </div>
                    <div className="space-y-2">
                      {[{ v: 75, c: 'bg-red-500' }, { v: 45, c: 'bg-amber-500' }, { v: 30, c: 'bg-emerald-500' }].map((bar, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${bar.v}%` }} transition={{ duration: 1, delay: 0.5 + i * 0.2 }} className={`h-full rounded-full ${bar.c}`} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-8 font-mono">{bar.v}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500">
                    <Activity className="w-3 h-3 text-cyan-400" />
                    <span className="font-mono">Real-time monitoring • 2,847 sensors</span>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-auto" />
                  </div>
                </div>
              </div>
              {/* Floating cards */}
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.8 }} className="absolute -left-4 top-1/4 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-3 border border-cyan-500/15">
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span className="text-[10px] font-medium text-slate-300">AI Scanning Zone B...</span>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 1 }} className="absolute -right-4 bottom-1/4 bg-slate-900/90 backdrop-blur-xl rounded-xl shadow-lg p-3 border border-emerald-500/15">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-[10px] font-medium text-slate-300">Permit Approved</span>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Stats */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }} className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6">
            {displayStats.map((stat) => (
              <div key={stat.label} className="text-center p-6 rounded-2xl bg-slate-900/50 border border-slate-800/50 backdrop-blur-sm">
                <p className="text-3xl md:text-4xl font-black text-white font-display">{stat.value}</p>
                <p className="text-sm text-slate-400 mt-1">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* AI Engines Section */}
      <section id="ai-engines" className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-500/[0.02] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-cyan-400 font-medium text-sm uppercase tracking-widest">Neural Architecture</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4 font-display">6 AI Engines. One Platform.</h2>
            <p className="text-slate-400">Every module in SafetyMEG is powered by specialized AI engines that learn, adapt, and protect your workforce in real-time.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {AI_ENGINES.map((engine, i) => {
              const Icon = engine.icon;
              return (
                <motion.div key={engine.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                  className="holo-card rounded-2xl p-6 group hover:border-cyan-500/30 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-cyan-500/10 group-hover:bg-cyan-500/15 transition-colors">
                      <Icon className="w-6 h-6 text-cyan-400" />
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider">Active</span>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{engine.name}</h3>
                  <p className="text-sm text-slate-400 mb-4">{engine.desc}</p>
                  <div className="flex items-center justify-between pt-3 border-t border-slate-800/50">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Accuracy</span>
                    <span className="text-sm font-black text-cyan-400 font-mono">{engine.accuracy}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-cyan-400 font-medium text-sm uppercase tracking-widest">Complete EHS Platform</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4 font-display">Everything for World-Class EHS</h2>
            <p className="text-slate-400">From incident management to ergonomics AI, lockout/tagout, confined space permits, and emergency response — every EHS need covered.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}
                  className="group p-5 rounded-2xl bg-slate-900/60 border border-slate-800/50 hover:border-cyan-500/20 hover:bg-slate-900/80 transition-all duration-300">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-5 h-5 text-cyan-400" />
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                  <p className="text-xs text-slate-400 mb-3 leading-relaxed">{f.desc}</p>
                  <div className="flex items-center gap-1.5 text-[10px] text-cyan-400/70 font-bold uppercase tracking-wider">
                    <Gauge className="w-3 h-3" /> {f.stat}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/[0.02] to-transparent" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16">
            <span className="text-cyan-400 font-medium text-sm uppercase tracking-widest">Testimonials</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-display">Trusted by Safety Leaders</h2>
          </div>
          <div className="relative max-w-4xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div key={activeTestimonial} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}
                className="holo-card rounded-2xl p-8 shadow-lg">
                <div className="flex gap-1 mb-6">{[...Array(testimonials[activeTestimonial].rating)].map((_, i) => <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />)}</div>
                <blockquote className="text-xl text-slate-300 mb-6">"{testimonials[activeTestimonial].quote}"</blockquote>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-semibold border border-cyan-500/20">
                    {testimonials[activeTestimonial].author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-semibold text-white">{testimonials[activeTestimonial].author}</p>
                    <p className="text-sm text-slate-400">{testimonials[activeTestimonial].role}, {testimonials[activeTestimonial].company}</p>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => <button key={i} onClick={() => setActiveTestimonial(i)} className={`w-2 h-2 rounded-full transition-colors ${i === activeTestimonial ? 'bg-cyan-400' : 'bg-slate-700'}`} />)}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="text-cyan-400 font-medium text-sm uppercase tracking-widest">Pricing</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 mb-4 font-display">Simple, Transparent Pricing</h2>
            <p className="text-slate-400">Start free, upgrade when you're ready. Unlimited AI storage on Enterprise.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {PRICING.map((plan, i) => (
              <motion.div key={plan.name} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                className={`relative rounded-2xl p-7 ${plan.popular ? 'bg-slate-900/80 border-2 border-cyan-500/30 shadow-glow-soft' : 'bg-slate-900/50 border border-slate-800/50'}`}>
                {plan.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-cyan-500 text-white text-xs font-bold rounded-full">Most Popular</div>}
                <h3 className="text-xl font-semibold text-white mb-2">{plan.name}</h3>
                <p className="text-slate-400 text-sm mb-4">{plan.desc}</p>
                <div className="mb-6">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  {plan.period && <span className="text-slate-400">{plan.period}</span>}
                </div>
                <ul className="space-y-2.5 mb-8">
                  {plan.features.map((f, fi) => <li key={fi} className="flex items-start gap-2 text-sm text-slate-400"><CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />{f}</li>)}
                </ul>
                <button className={`w-full py-3 rounded-xl font-medium transition-all ${plan.popular ? 'bg-cyan-500 text-white hover:bg-cyan-400 shadow-lg shadow-cyan-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'}`}>
                  {plan.popular ? 'Start Free Trial' : plan.price === 'Custom' ? 'Contact Sales' : 'Start Free Trial'}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className="text-cyan-400 font-medium text-sm uppercase tracking-widest">FAQ</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mt-3 font-display">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((faq, i) => (
              <div key={i} className="bg-slate-900/50 rounded-xl border border-slate-800/50 overflow-hidden">
                <button onClick={() => setExpandedFaq(expandedFaq === i ? null : i)} className="w-full px-6 py-4 flex items-center justify-between text-left">
                  <span className="font-medium text-white text-sm">{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${expandedFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <AnimatePresence>
                  {expandedFaq === i && (
                    <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                      <div className="px-6 pb-4 text-sm text-slate-400 leading-relaxed">{faq.a}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl p-12 text-center overflow-hidden" style={{ background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.15) 0%, rgba(212, 36, 255, 0.08) 50%, rgba(6, 182, 212, 0.12) 100%)' }}>
            <div className="absolute inset-0 cyber-grid-bg opacity-20" />
            <div className="absolute inset-0 border border-cyan-500/15 rounded-3xl" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 font-display">Ready to Transform Your Safety Culture?</h2>
              <p className="text-lg text-slate-300 mb-8 max-w-2xl mx-auto">Join 500+ companies using SafetyMEG to predict risks, prevent incidents, and protect their people with 6 AI engines.</p>
              <div className="flex flex-wrap justify-center gap-4">
                <button onClick={() => navigate('/')} className="px-8 py-4 bg-cyan-500 text-white font-medium rounded-xl hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/25">Start Free Trial</button>
                <button onClick={handleScheduleDemo} className="px-8 py-4 bg-slate-800/60 border border-cyan-500/20 text-cyan-300 font-medium rounded-xl hover:bg-slate-800 transition-all">Schedule Demo</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <img src="/logo.png" alt="SafetyMEG" className="w-10 h-10 object-contain" />
                <span className="text-xl font-bold text-white font-display">SafetyMEG</span>
              </div>
              <p className="text-slate-500 text-sm">AI-powered EHS platform for modern enterprises. 6 neural engines. Zero compromises.</p>
            </div>
            {[
              { title: 'Product', items: ['Features', 'AI Engines', 'Pricing', 'Integrations', 'API Docs'] },
              { title: 'Company', items: ['About', 'Blog', 'Careers', 'Contact', 'Partners'] },
              { title: 'Legal', items: ['Privacy Policy', 'Terms of Service', 'Security', 'GDPR', 'SOC 2'] },
            ].map(col => (
              <div key={col.title}>
                <h4 className="font-semibold text-white mb-4 text-sm">{col.title}</h4>
                <ul className="space-y-2 text-sm text-slate-500">{col.items.map(item => <li key={item}><a href="#" className="hover:text-cyan-400 transition-colors">{item}</a></li>)}</ul>
              </div>
            ))}
          </div>
          <div className="pt-8 border-t border-slate-800/50 flex flex-col md:flex-row items-center justify-between text-sm text-slate-500">
            <p>© 2026 SafetyMEG. All rights reserved.</p>
            <div className="flex items-center gap-4 mt-4 md:mt-0">
              <Lock className="w-4 h-4 text-cyan-400/50" /><span>SOC 2 Type II</span><span>•</span><span>GDPR</span><span>•</span><span>ISO 27001</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
