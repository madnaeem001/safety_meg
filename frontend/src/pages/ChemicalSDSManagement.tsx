import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Beaker,
  Search,
  Plus,
  FileText,
  AlertTriangle,
  MapPin,
  Database,
  ShieldAlert,
  ChevronRight,
  ArrowLeft,
  Filter,
  Download,
  ExternalLink,
  Info
} from 'lucide-react';
import { useChemicals } from '../api/hooks/useAPIHooks';
import type { ChemicalRecord } from '../api/services/apiService';
import FadeContent from '../components/animations/FadeContent';

export const ChemicalSDSManagement = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedChemical, setSelectedChemical] = useState<ChemicalRecord | null>(null);

  // ── Real API Data ──────────────────────────────────────────────────────
  const { data: chemicals } = useChemicals();

  // Client-side filter by name or manufacturer
  const filteredChemicals: ChemicalRecord[] = (chemicals ?? []).filter(c =>
    c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.manufacturer?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-surface-600" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-surface-900">Chemical & SDS</h1>
              <p className="text-sm text-surface-500">Inventory & Safety Data Sheets</p>
            </div>
          </div>
          <button className="p-2 bg-brand-600 text-white rounded-xl shadow-button hover:bg-brand-700 transition-all active:scale-95">
            <Plus className="w-6 h-6" />
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search chemicals, manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all shadow-soft"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-white border border-surface-200 rounded-2xl text-surface-700 hover:bg-surface-50 transition-all shadow-soft">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Chemicals', value: filteredChemicals.length, icon: Database, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'High Hazard', value: filteredChemicals.filter(c => c.signalWord === 'Danger').length, icon: ShieldAlert, color: 'text-red-600', bg: 'bg-red-50' },
            { label: 'SDS Up to Date', value: '100%', icon: FileText, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'Locations', value: new Set(filteredChemicals.map(c => c.location).filter(Boolean)).size || 0, icon: MapPin, color: 'text-purple-600', bg: 'bg-purple-50' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-4 rounded-3xl border border-surface-100 shadow-soft"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm text-surface-500 mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-surface-900">{stat.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Chemical List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredChemicals.map((chem, i) => (
              <motion.div
                key={chem.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedChemical(chem)}
                className="group bg-white rounded-[2rem] border border-surface-100 shadow-soft hover:shadow-card transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Beaker className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      chem.signalWord === 'Danger' ? 'bg-red-100 text-red-700' : 
                      chem.signalWord === 'Warning' ? 'bg-orange-100 text-orange-700' : 
                      'bg-green-100 text-green-700'
                    }`}>
                      {chem.signalWord || 'Safe'}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-surface-900 mb-1 group-hover:text-brand-600 transition-colors">
                    {chem.name}
                  </h3>
                  <p className="text-sm text-surface-500 mb-4">{chem.manufacturer}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-surface-600">
                      <MapPin className="w-4 h-4 text-surface-400" />
                      <span>{chem.location || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-surface-600">
                      <Database className="w-4 h-4 text-surface-400" />
                      <span>{chem.quantity} {chem.unit}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-surface-50 flex items-center justify-between">
                    <div className="flex gap-1">
                      {(chem.pictograms ?? []).map((pic, idx) => (
                        <div key={idx} className="w-8 h-8 bg-surface-50 rounded-lg flex items-center justify-center" title={pic}>
                          <AlertTriangle className="w-4 h-4 text-surface-600" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center text-brand-600 font-medium text-sm">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </main>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedChemical && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedChemical(null)}
              className="absolute inset-0 bg-surface-900/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-surface-900">{selectedChemical.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedChemical.signalWord === 'Danger' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {selectedChemical.signalWord || 'Safe'}
                      </span>
                    </div>
                    <p className="text-surface-500">{selectedChemical.manufacturer}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedChemical(null)}
                    className="p-2 hover:bg-surface-100 rounded-full transition-colors"
                  >
                    <Plus className="w-6 h-6 text-surface-400 rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <section>
                    <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Hazards
                    </h4>
                    <ul className="space-y-3">
                      {(selectedChemical.hazards ?? []).map((hazard, i) => (
                        <li key={i} className="flex gap-3 text-sm text-surface-700 bg-red-50/50 p-3 rounded-2xl border border-red-100/50">
                          <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                          {hazard}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      GHS Classification
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedChemical.ghsClassification ?? []).map((cls, i) => (
                        <span key={i} className="px-3 py-1.5 bg-surface-100 text-surface-700 rounded-xl text-xs font-medium">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                  <div className="bg-surface-50 rounded-3xl p-6 mb-8 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-surface-400 uppercase font-bold mb-1">Location</p>
                    <p className="text-surface-900 font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-brand-500" />
                      {selectedChemical.location || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 uppercase font-bold mb-1">Inventory</p>
                    <p className="text-surface-900 font-medium flex items-center gap-2">
                      <Database className="w-4 h-4 text-brand-500" />
                      {selectedChemical.quantity} {selectedChemical.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 uppercase font-bold mb-1">Last SDS Update</p>
                    <p className="text-surface-900 font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-brand-500" />
                      {selectedChemical.sdsUploadDate
                        ? new Date(selectedChemical.sdsUploadDate).toLocaleDateString()
                        : selectedChemical.lastReviewed
                          ? new Date(selectedChemical.lastReviewed).toLocaleDateString()
                          : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-surface-400 uppercase font-bold mb-1">Emergency Contact</p>
                    <p className="text-surface-900 font-medium flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-brand-500" />
                      {selectedChemical.emergencyContact || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button className="flex-1 bg-brand-600 text-white py-4 rounded-2xl font-bold shadow-button hover:bg-brand-700 transition-all flex items-center justify-center gap-2">
                    <Download className="w-5 h-5" />
                    Download SDS
                  </button>
                  <button className="flex-1 bg-white border border-surface-200 text-surface-700 py-4 rounded-2xl font-bold hover:bg-surface-50 transition-all flex items-center justify-center gap-2">
                    <ExternalLink className="w-5 h-5" />
                    Manufacturer Site
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
