import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  GraduationCap, Users, QrCode, Presentation, Star, Calendar,
  Video, Clock, CheckCircle2, MapPin, Award, Smartphone,
  ChevronRight, Play, Shield, Megaphone, Target, UserCheck
} from 'lucide-react';
import {
  useHypercareStats,
  useHypercareDemos,
  useHypercareChampions,
  useHypercareQrDeployments,
} from '../api/hooks/useAPIHooks';

const toolboxDemos = [
  { id: 1, title: 'Incident Reporting Walkthrough', duration: '5 min', audience: 'All Workers', scheduled: '2026-02-20 07:00', site: 'Houston Refinery', attendees: 28, status: 'upcoming', type: 'live' },
  { id: 2, title: 'QR Code Inspection — How It Works', duration: '5 min', audience: 'Technicians', scheduled: '2026-02-20 07:30', site: 'Denver Warehouse', attendees: 15, status: 'upcoming', type: 'live' },
  { id: 3, title: 'Voice Hazard Report Demo', duration: '3 min', audience: 'Field Workers', scheduled: '2026-02-19 07:00', site: 'Houston Refinery', attendees: 32, status: 'completed', type: 'live' },
  { id: 4, title: 'Mobile App Offline Mode', duration: '4 min', audience: 'All Workers', scheduled: '2026-02-18 07:00', site: 'Chicago Lab', attendees: 12, status: 'completed', type: 'recorded' },
  { id: 5, title: 'PPE Photo Documentation', duration: '5 min', audience: 'Safety Team', scheduled: '2026-02-21 07:00', site: 'Denver Warehouse', attendees: 0, status: 'scheduled', type: 'live' },
];

const safetyChampions = [
  { id: 1, name: 'Maria Gonzalez', site: 'Houston Refinery', role: 'Lead Operator', trained: '2026-01-15', peersHelped: 24, rating: 4.9, specialties: ['Incident Reporting', 'Risk Assessment'] },
  { id: 2, name: 'David Kim', site: 'Denver Warehouse', role: 'Shift Supervisor', trained: '2026-01-18', peersHelped: 18, rating: 4.7, specialties: ['Inspections', 'QR Scanning'] },
  { id: 3, name: 'Rachel Adams', site: 'Chicago Lab', role: 'Safety Coordinator', trained: '2026-01-10', peersHelped: 31, rating: 4.8, specialties: ['Training', 'Compliance'] },
  { id: 4, name: 'Tom Nguyen', site: 'Houston Refinery', role: 'Maintenance Tech', trained: '2026-01-20', peersHelped: 12, rating: 4.6, specialties: ['Permit-to-Work', 'LOTO'] },
];

const qrDeployments = [
  { id: 1, location: 'Warehouse Entrance - Bay A', form: 'Pre-Shift Safety Checklist', scans: 187, lastScan: '3 min ago', status: 'active' },
  { id: 2, location: 'Forklift #FL-012', form: 'Forklift Daily Inspection', scans: 94, lastScan: '1 hour ago', status: 'active' },
  { id: 3, location: 'Chemical Storage Room', form: 'SDS Verification Checklist', scans: 56, lastScan: '4 hours ago', status: 'active' },
  { id: 4, location: 'Confined Space Entry - Tank 7', form: 'Confined Space Permit', scans: 23, lastScan: '1 day ago', status: 'active' },
  { id: 5, location: 'Electrical Panel Room B', form: 'LOTO Verification', scans: 41, lastScan: '6 hours ago', status: 'active' },
  { id: 6, location: 'Loading Dock 3', form: 'Truck Inspection Checklist', scans: 112, lastScan: '30 min ago', status: 'active' },
];

const trainingKPIs = [
  { label: 'Toolbox Demos', value: '23', icon: Presentation, color: 'cyan' },
  { label: 'Safety Champions', value: '4', icon: Star, color: 'amber' },
  { label: 'QR Codes Deployed', value: '47', icon: QrCode, color: 'purple' },
  { label: 'Workers Trained', value: '342', icon: GraduationCap, color: 'emerald' },
  { label: 'Peer Help Sessions', value: '85', icon: Users, color: 'cyan' },
  { label: 'Avg. Competency', value: '91%', icon: Target, color: 'emerald' },
];

const tabs = ['Overview', 'Toolbox Talk Demos', 'Safety Champions', 'QR Code Deployment'];

export const HyperCareTraining: React.FC = () => {
  const [activeTab, setActiveTab] = useState('Overview');

  const { data: apiStats } = useHypercareStats();
  const { data: apiDemos } = useHypercareDemos();
  const { data: apiChampions } = useHypercareChampions();
  const { data: apiQr } = useHypercareQrDeployments();

  const displayDemos = (apiDemos ?? toolboxDemos) as typeof toolboxDemos;
  const displayChampions = (apiChampions ?? safetyChampions) as typeof safetyChampions;
  const displayQr = (apiQr ?? qrDeployments) as typeof qrDeployments;

  const displayKPIs = [
    { label: 'Toolbox Demos',      value: apiStats?.toolboxDemos?.toString()    ?? '23',  icon: Presentation, color: 'cyan' },
    { label: 'Safety Champions',   value: apiStats?.safetyChampions?.toString() ?? '4',   icon: Star,         color: 'amber' },
    { label: 'QR Codes Deployed',  value: apiStats?.qrCodesDeployed?.toString() ?? '47',  icon: QrCode,       color: 'purple' },
    { label: 'Workers Trained',    value: apiStats?.workersTrained?.toString()  ?? '342', icon: GraduationCap, color: 'emerald' },
    { label: 'Peer Help Sessions', value: apiStats?.peerHelpSessions?.toString() ?? '85', icon: Users,        color: 'cyan' },
    { label: 'Avg. Competency',    value: apiStats?.avgCompetency              ?? '91%', icon: Target,       color: 'emerald' },
  ];

  return (
    <div className="min-h-screen pb-24 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">

      <div className="px-4 pt-20 pb-24 max-w-7xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 border border-emerald-500/30">
              <GraduationCap className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Hyper-Care Training</h1>
              <p className="text-sm text-gray-400">Strategic Adoption & "Build It, They Will Come" Prevention</p>
            </div>
          </div>
        </motion.div>

        <div className="flex gap-1 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${activeTab === tab ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'}`}>
              {tab}
            </button>
          ))}
        </div>

        {/* Overview */}
        {activeTab === 'Overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {displayKPIs.map((kpi, i) => (
                <motion.div key={kpi.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-4">
                  <kpi.icon className={`w-5 h-5 mb-2 ${kpi.color === 'cyan' ? 'text-cyan-400' : kpi.color === 'emerald' ? 'text-emerald-400' : kpi.color === 'amber' ? 'text-amber-400' : 'text-purple-400'}`} />
                  <div className="text-2xl font-bold text-white">{kpi.value}</div>
                  <div className="text-xs text-gray-400">{kpi.label}</div>
                </motion.div>
              ))}
            </div>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-6">
              <h3 className="text-emerald-400 font-semibold text-lg mb-3">🎯 Hyper-Care Strategy</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                  <Presentation className="w-6 h-6 text-cyan-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">5-Min Toolbox Talk Demos</h4>
                  <p className="text-xs text-gray-400">Live demos during existing safety meetings — not long Zoom webinars. Workers see it, try it, adopt it.</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                  <Star className="w-6 h-6 text-amber-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">Safety Champions</h4>
                  <p className="text-xs text-gray-400">Designated "Super Users" at each site who get extra training to help peers on the fly — your ground-level support network.</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl p-4 border border-gray-700/30">
                  <QrCode className="w-6 h-6 text-purple-400 mb-2" />
                  <h4 className="text-white font-medium mb-1">QR Code Deployment</h4>
                  <p className="text-xs text-gray-400">Stick QR codes on equipment & facility entrances linking directly to the specific inspection form for that area.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toolbox Talk Demos */}
        {activeTab === 'Toolbox Talk Demos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Scheduled 5-Minute Demos</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl text-sm font-medium hover:shadow-lg hover:shadow-emerald-500/20 transition-all">+ Schedule Demo</button>
            </div>
            <div className="space-y-3">
              {displayDemos.map((demo, i) => (
                <motion.div key={demo.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${demo.status === 'completed' ? 'bg-emerald-500/20' : demo.status === 'upcoming' ? 'bg-cyan-500/20' : 'bg-gray-700/30'}`}>
                        {demo.type === 'live' ? <Video className={`w-5 h-5 ${demo.status === 'completed' ? 'text-emerald-400' : 'text-cyan-400'}`} /> : <Play className="w-5 h-5 text-purple-400" />}
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{demo.title}</h4>
                        <p className="text-xs text-gray-400">{demo.audience} • {demo.duration}</p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-lg text-xs font-medium ${demo.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' : demo.status === 'upcoming' ? 'bg-cyan-500/20 text-cyan-400' : 'bg-gray-700/30 text-gray-400'}`}>
                      {demo.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{demo.site}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{demo.scheduled}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{demo.attendees} attendees</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Safety Champions */}
        {activeTab === 'Safety Champions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Designated Super Users</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-medium">+ Nominate Champion</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayChampions.map((champ, i) => (
                <motion.div key={champ.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
                      {champ.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <h4 className="text-white font-semibold">{champ.name}</h4>
                      <p className="text-sm text-gray-400">{champ.role} • {champ.site}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-amber-500/20 rounded-lg px-2 py-1">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-sm text-amber-400 font-bold">{champ.rating}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                      <div className="text-xl font-bold text-white">{champ.peersHelped}</div>
                      <div className="text-xs text-gray-400">Peers Helped</div>
                    </div>
                    <div className="bg-gray-900/50 rounded-xl p-3 text-center">
                      <div className="text-xs text-gray-400 mb-1">Trained Since</div>
                      <div className="text-sm text-white font-medium">{champ.trained}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {champ.specialties.map(s => (
                      <span key={s} className="px-2 py-0.5 rounded-full text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">{s}</span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* QR Code Deployment */}
        {activeTab === 'QR Code Deployment' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-white">Equipment & Location QR Codes</h3>
              <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl text-sm font-medium">+ Generate QR Code</button>
            </div>
            <p className="text-sm text-gray-400 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
              <QrCode className="w-4 h-4 inline mr-2 text-purple-400" />
              Stick QR codes on equipment or at facility entrances that link directly to the specific inspection form for that area. Workers scan → form opens instantly.
            </p>
            <div className="space-y-3">
              {displayQr.map((qr, i) => (
                <motion.div key={qr.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-gray-800/60 backdrop-blur-xl border border-gray-700/50 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-purple-500/20 border border-purple-500/30">
                        <QrCode className="w-6 h-6 text-purple-400" />
                      </div>
                      <div>
                        <h4 className="text-white font-medium">{qr.location}</h4>
                        <p className="text-sm text-gray-400">→ {qr.form}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-white">{qr.scans}</div>
                      <div className="text-xs text-gray-400">scans • {qr.lastScan}</div>
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

export default HyperCareTraining;
