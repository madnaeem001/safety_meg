import React, { useState } from 'react';
import { SMButton } from '../components/ui';
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
    <div className="min-h-screen bg-surface-base pb-20">
      <header className="sticky top-[var(--nav-height)] z-40 border-b border-surface-border bg-surface-raised/80 px-6 py-4 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1440px] items-center gap-4">
          <SMButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-5 h-5" />} onClick={() => navigate(-1)} aria-label="Back" />
          <div>
            <h1 className="text-xl font-bold text-text-primary">Property Incident</h1>
            <p className="text-sm text-text-muted">Damage &amp; Loss Reporting</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-6 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          <section className="bg-surface-raised rounded-[2.5rem] p-8 border border-surface-border shadow-soft space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-primary/10 text-accent rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Incident Details</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted ml-1">Date of Incident</label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="date"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    value={formData.date}
                    onChange={e => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted ml-1">Time</label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="time"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    value={formData.time}
                    onChange={e => setFormData({...formData, time: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-text-muted ml-1">Location</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="text"
                    placeholder="Specific area or facility"
                    required
                    className="w-full pl-12 pr-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    value={formData.location}
                    onChange={e => setFormData({...formData, location: e.target.value})}
                  />
                </div>
              </div>
            </div>
          </section>

          <section className="bg-surface-raised rounded-[2.5rem] p-8 border border-surface-border shadow-soft space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-warning/10 text-warning rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-text-primary">Damage Assessment</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-muted ml-1">Property Type</label>
                <select
                  className="w-full px-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"
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
                <label className="text-sm font-bold text-text-muted ml-1">Damage Severity</label>
                <select
                  className="w-full px-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"
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
                <label className="text-sm font-bold text-text-muted ml-1">Estimated Loss (USD)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                  <input
                    type="number"
                    placeholder="Approximate value of damage"
                    className="w-full pl-12 pr-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all"
                    value={formData.estimatedLoss}
                    onChange={e => setFormData({...formData, estimatedLoss: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-bold text-text-muted ml-1">Description of Damage</label>
                <textarea
                  rows={4}
                  placeholder="Describe what happened and the extent of damage..."
                  required
                  className="w-full px-4 py-3 bg-surface-100 border border-surface-border rounded-2xl focus:ring-2 focus:ring-accent/20 outline-none transition-all resize-none"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                />
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <SMButton
              type="button"
              variant="ghost"
              leftIcon={<Camera className="w-5 h-5" />}
              className="flex-1"
            >
              Add Photos
            </SMButton>
            <SMButton
              type="submit"
              variant="primary"
              leftIcon={<Save className="w-5 h-5" />}
              className="flex-[2]"
            >
              Submit Report
            </SMButton>
          </div>
        </form>
      </main>
    </div>
  );
};
