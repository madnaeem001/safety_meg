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
import { SMButton } from '../components/ui';

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
    <div className="page-wrapper">
      {/* Header */}
      <header className="sticky top-[72px] z-40 bg-surface-overlay/80 backdrop-blur-xl border-b border-surface-border px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')}
              className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-text-secondary" />
            </button>
            <div>
              <h1 className="page-title">Chemical & SDS</h1>
              <p className="text-sm text-text-muted">Inventory & Safety Data Sheets</p>
            </div>
          </div>
          <SMButton variant="icon"><Plus className="w-6 h-6" /></SMButton>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
            <input
              type="text"
              placeholder="Search chemicals, manufacturers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-surface-raised border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all shadow-soft"
            />
          </div>
          <button className="flex items-center justify-center gap-2 px-6 py-3 bg-surface-raised border border-surface-border rounded-2xl text-text-secondary hover:bg-surface-overlay transition-all shadow-soft">
            <Filter className="w-5 h-5" />
            <span>Filter</span>
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total Chemicals', value: filteredChemicals.length, icon: Database, color: 'text-accent', bg: 'bg-accent/10' },
            { label: 'High Hazard', value: filteredChemicals.filter(c => c.signalWord === 'Danger').length, icon: ShieldAlert, color: 'text-danger', bg: 'bg-danger/10' },
            { label: 'SDS Up to Date', value: '100%', icon: FileText, color: 'text-success', bg: 'bg-success/10' },
            { label: 'Locations', value: new Set(filteredChemicals.map(c => c.location).filter(Boolean)).size || 0, icon: MapPin, color: 'text-warning', bg: 'bg-warning/10' },
          ].map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface-raised p-4 rounded-3xl border border-surface-border shadow-soft"
            >
              <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <p className="text-sm text-text-muted mb-1">{stat.label}</p>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
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
                className="group bg-surface-raised rounded-[2rem] border border-surface-border shadow-soft hover:shadow-card transition-all cursor-pointer overflow-hidden"
              >
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Beaker className="w-6 h-6" />
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                      chem.signalWord === 'Danger' ? 'bg-danger/10 text-danger' : 
                      chem.signalWord === 'Warning' ? 'bg-warning/10 text-warning' : 
                      'bg-success/10 text-success'
                    }`}>
                      {chem.signalWord || 'Safe'}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-text-primary mb-1 group-hover:text-accent transition-colors">
                    {chem.name}
                  </h3>
                  <p className="text-sm text-text-muted mb-4">{chem.manufacturer}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <MapPin className="w-4 h-4 text-text-muted" />
                      <span>{chem.location || '—'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text-secondary">
                      <Database className="w-4 h-4 text-text-muted" />
                      <span>{chem.quantity} {chem.unit}</span>
                    </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-surface-border flex items-center justify-between">
                    <div className="flex gap-1">
                      {(chem.pictograms ?? []).map((pic, idx) => (
                        <div key={idx} className="w-8 h-8 bg-surface-overlay rounded-lg flex items-center justify-center" title={pic}>
                          <AlertTriangle className="w-4 h-4 text-text-muted" />
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center text-accent font-medium text-sm">
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
              className="relative w-full max-w-2xl bg-surface-overlay rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 overflow-y-auto">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h2 className="text-2xl font-bold text-text-primary">{selectedChemical.name}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                        selectedChemical.signalWord === 'Danger' ? 'bg-danger/10 text-danger' : 'bg-warning/10 text-warning'
                      }`}>
                        {selectedChemical.signalWord || 'Safe'}
                      </span>
                    </div>
                    <p className="text-text-muted">{selectedChemical.manufacturer}</p>
                  </div>
                  <button 
                    onClick={() => setSelectedChemical(null)}
                    className="p-2 hover:bg-surface-overlay rounded-full transition-colors"
                  >
                    <Plus className="w-6 h-6 text-text-muted rotate-45" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                  <section>
                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4" />
                      Hazards
                    </h4>
                    <ul className="space-y-3">
                      {(selectedChemical.hazards ?? []).map((hazard, i) => (
                        <li key={i} className="flex gap-3 text-sm text-text-secondary bg-danger/5 p-3 rounded-2xl border border-danger/10">
                          <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
                          {hazard}
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <h4 className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      GHS Classification
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(selectedChemical.ghsClassification ?? []).map((cls, i) => (
                        <span key={i} className="px-3 py-1.5 bg-surface-raised text-text-secondary rounded-xl text-xs font-medium">
                          {cls}
                        </span>
                      ))}
                    </div>
                  </section>
                </div>

                  <div className="bg-surface-raised rounded-3xl p-6 mb-8 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Location</p>
                    <p className="text-text-primary font-medium flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-accent" />
                      {selectedChemical.location || '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Inventory</p>
                    <p className="text-text-primary font-medium flex items-center gap-2">
                      <Database className="w-4 h-4 text-accent" />
                      {selectedChemical.quantity} {selectedChemical.unit}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Last SDS Update</p>
                    <p className="text-text-primary font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4 text-accent" />
                      {selectedChemical.sdsUploadDate
                        ? new Date(selectedChemical.sdsUploadDate).toLocaleDateString()
                        : selectedChemical.lastReviewed
                          ? new Date(selectedChemical.lastReviewed).toLocaleDateString()
                          : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-text-muted uppercase font-bold mb-1">Emergency Contact</p>
                    <p className="text-text-primary font-medium flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-accent" />
                      {selectedChemical.emergencyContact || '—'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <SMButton variant="primary" className="flex-1" leftIcon={<Download className="w-5 h-5" />}>Download SDS</SMButton>
                  <button className="flex-1 bg-surface-raised border border-surface-border text-text-secondary py-4 rounded-2xl font-bold hover:bg-surface-overlay transition-all flex items-center justify-center gap-2">
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
