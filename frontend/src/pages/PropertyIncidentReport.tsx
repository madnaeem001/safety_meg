import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { incidentService } from '../api/services/apiService';
import { 
  ArrowLeft, 
  Building2, 
  Calendar, 
  MapPin, 
  AlertTriangle, 
  Camera, 
  Save,
  Shield,
  Clock,
  User,
  FileText,
  DollarSign
} from 'lucide-react';

export const PropertyIncidentReport = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: '',
    location: '',
    propertyType: 'Building',
    damageSeverity: 'Minor',
    estimatedLoss: '',
    description: '',
    immediateAction: '',
    reportedBy: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await incidentService.create({
        incidentDate: formData.date,
        incidentTime: formData.time || '00:00',
        location: formData.location || 'Unknown',
        description: formData.description || 'Property damage incident',
        severity: formData.damageSeverity === 'Minor' ? 'Low' : formData.damageSeverity === 'Moderate' ? 'Medium' : 'High',
        incidentType: 'Property Damage',
        immediateActions: formData.immediateAction,
        assetName: formData.propertyType,
        damageEstimate: formData.estimatedLoss ? parseFloat(formData.estimatedLoss) : undefined,
      } as any);
      navigate('/');
    } catch (err: any) {
      alert(err?.message || 'Failed to submit property incident report.');
    }
  };

  return (
    <div className="min-h-screen bg-surface-50 pb-20">
      <header className="sticky top-[72px] z-40 bg-white/80 backdrop-blur-xl border-b border-surface-200/60 px-6 py-4">
        <div className="flex items-center gap-4 max-w-7xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-surface-100 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-surface-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-surface-900">Property Incident</h1>
            <p className="text-sm text-surface-500">Damage & Loss Reporting</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-white rounded-[2.5rem] p-8 border border-surface-100 shadow-soft space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-surface-900">Incident Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Date of Incident</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="date"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="time"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Specific area or facility"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-[2.5rem] p-8 border border-surface-100 shadow-soft space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-surface-900">Damage Assessment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Property Type</label>
                <select
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  value={formData.propertyType}
                  onChange={e => setFormData({...formData, propertyType: e.target.value})}
                >
                  <option>Building</option>
                  <option>Equipment</option>
                  <option>Infrastructure</option>
                  <option>Land/Environment</option>
                  <option>Other</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Damage Severity</label>
                <select
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                  value={formData.damageSeverity}
                  onChange={e => setFormData({...formData, damageSeverity: e.target.value})}
                >
                  <option>Minor</option>
                  <option>Moderate</option>
                  <option>Significant</option>
                  <option>Major</option>
                  <option>Total Loss</option>
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Estimated Loss (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="number"
                    placeholder="Approximate value of damage"
                    className="w-full pl-12 pr-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all"
                    value={formData.estimatedLoss}
                    onChange={e => setFormData({...formData, estimatedLoss: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-surface-700 ml-1">Description of Damage</label>
                <textarea
                  rows={4}
                  placeholder="Describe what happened and the extent of damage..."
                  required
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-2xl focus:ring-2 focus:ring-brand-500/20 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <button
              type="button"
              className="flex-1 px-6 py-4 bg-white border border-surface-200 text-surface-700 rounded-2xl font-bold hover:bg-surface-50 transition-all flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              Add Photos
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-brand-600 text-white rounded-2xl font-bold shadow-button hover:bg-brand-700 transition-all flex items-center justify-center gap-2"
            >
              <Save className="w-5 h-5" />
              Submit Report
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};
