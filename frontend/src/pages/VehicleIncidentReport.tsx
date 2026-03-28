import React, { useState } from 'react';
import { SMButton } from '../components/ui';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Camera, Send, CheckCircle2, MapPin, Calendar, Clock, 
  User, Car, FileText, DollarSign, AlertTriangle, Truck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { vehicleIncidentApiService } from '../api/services/apiService';

const VEHICLE_TYPES = ['Company Vehicle', 'Personal Vehicle', 'Rental', 'Contractor Vehicle', 'Forklift/PIT', 'Heavy Equipment', 'Trailer'];
const INCIDENT_TYPES = ['Collision', 'Rollover', 'Single Vehicle', 'Pedestrian Involved', 'Property Damage Only', 'Hit and Run', 'Weather Related'];
const DAMAGE_SEVERITY = ['Minor (< $500)', 'Moderate ($500 - $5,000)', 'Major ($5,000 - $25,000)', 'Severe (> $25,000)', 'Total Loss'];
const ROAD_CONDITIONS = ['Dry', 'Wet', 'Icy', 'Snow Covered', 'Muddy', 'Gravel', 'Construction Zone'];
const LIGHTING_CONDITIONS = ['Daylight', 'Dawn/Dusk', 'Dark - Lit', 'Dark - Unlit'];

export const VehicleIncidentReport: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toTimeString().slice(0, 5),
    location: '',
    intersection: '',
    driver: '',
    employeeId: '',
    licenseNumber: '',
    vehicleType: '',
    vehicleId: '',
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    mileage: '',
    incidentType: '',
    damageSeverity: '',
    roadCondition: '',
    lighting: '',
    weatherCondition: '',
    speedLimit: '',
    estimatedSpeed: '',
    description: '',
    otherVehicles: '',
    witnesses: '',
    policeReport: false,
    policeReportNumber: '',
    injuries: false,
    injuryDescription: '',
    propertyDamage: '',
    estimatedCost: '',
    preventable: '',
    dotRecordable: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.location.trim()) { setSubmitError('Location is required.'); return; }
    if (!formData.driver.trim()) { setSubmitError('Driver name is required.'); return; }
    if (!formData.description.trim()) { setSubmitError('Description is required.'); return; }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await vehicleIncidentApiService.create({
        incidentDate: formData.date,
        incidentTime: formData.time,
        location: formData.location,
        incidentType: formData.incidentType,
        damageSeverity: formData.damageSeverity,
        estimatedCost: formData.estimatedCost,
        driverName: formData.driver,
        employeeId: formData.employeeId,
        licenseNumber: formData.licenseNumber,
        vehicleType: formData.vehicleType,
        vehicleId: formData.vehicleId,
        vehicleMake: formData.make,
        vehicleModel: formData.model,
        vehicleYear: formData.year,
        licensePlate: formData.licensePlate,
        odometer: formData.mileage,
        roadCondition: formData.roadCondition,
        lighting: formData.lighting,
        speedLimit: formData.speedLimit,
        estimatedSpeed: formData.estimatedSpeed,
        weatherCondition: formData.weatherCondition,
        description: formData.description,
        otherVehicles: formData.otherVehicles,
        witnesses: formData.witnesses,
        policeReport: formData.policeReport,
        policeReportNumber: formData.policeReportNumber,
        dotRecordable: formData.dotRecordable,
        injuries: formData.injuries,
        injuryDescription: formData.injuryDescription,
        propertyDamage: formData.propertyDamage,
        preventable: formData.preventable,
      });
      setSubmitted(true);
      setTimeout(() => navigate('/incidents'), 2000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit vehicle incident report.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-surface-base flex items-center justify-center">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          className="bg-surface-raised p-8 rounded-3xl text-center space-y-4 max-w-xs">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-text-primary">Report Submitted</h2>
          <p className="text-text-muted text-sm">Vehicle incident report has been logged and fleet management notified.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface-base pb-32">

      
      <header className="sticky top-[var(--nav-height)] z-40 border-b border-surface-border bg-surface-raised/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <SMButton variant="ghost" size="sm" leftIcon={<ArrowLeft className="w-5 h-5" />} onClick={() => navigate(-1)} aria-label="Back" />
          <h1 className="flex items-center gap-2 text-xl font-bold text-text-primary">
            <Car className="w-6 h-6 text-blue-500" />
            Vehicle Incident Report
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Incident Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border space-y-4">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-accent" />
              Incident Information
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Date</label>
                <input type="date" required value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Time</label>
                <input type="time" value={formData.time}
                  onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-text-muted uppercase">Location/Address</label>
                <input type="text" required placeholder="Street address or GPS coordinates" value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Incident Type</label>
                <select required value={formData.incidentType}
                  onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary">
                  <option value="">Select Type</option>
                  {INCIDENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Damage Severity</label>
                <select required value={formData.damageSeverity}
                  onChange={(e) => setFormData({ ...formData, damageSeverity: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary">
                  <option value="">Select Severity</option>
                  {DAMAGE_SEVERITY.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Est. Repair Cost</label>
                <input type="text" placeholder="$0.00" value={formData.estimatedCost}
                  onChange={(e) => setFormData({ ...formData, estimatedCost: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
            </div>
          </motion.div>

          {/* Driver & Vehicle Info */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
            className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border space-y-4">
            <h3 className="font-bold text-text-primary flex items-center gap-2">
              <User className="w-5 h-5 text-accent" />
              Driver Information
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-text-muted uppercase">Driver Name</label>
                <input type="text" required placeholder="Full Name" value={formData.driver}
                  onChange={(e) => setFormData({ ...formData, driver: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Employee ID</label>
                <input type="text" placeholder="EMP-XXXX" value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">License #</label>
                <input type="text" placeholder="Driver's License" value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
            </div>

            <h4 className="font-semibold text-text-primary mt-4 flex items-center gap-2">
              <Truck className="w-4 h-4 text-accent" />
              Vehicle Details
            </h4>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Vehicle Type</label>
                <select value={formData.vehicleType}
                  onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary">
                  <option value="">Select Type</option>
                  {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Vehicle ID</label>
                <input type="text" placeholder="Fleet #" value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Make</label>
                <input type="text" placeholder="Ford, Toyota..." value={formData.make}
                  onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Model</label>
                <input type="text" placeholder="F-150, Camry..." value={formData.model}
                  onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Year</label>
                <input type="text" placeholder="2024" value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">License Plate</label>
                <input type="text" placeholder="ABC-1234" value={formData.licensePlate}
                  onChange={(e) => setFormData({ ...formData, licensePlate: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2 col-span-2">
                <label className="text-xs font-bold text-text-muted uppercase">Odometer Reading</label>
                <input type="text" placeholder="Miles at time of incident" value={formData.mileage}
                  onChange={(e) => setFormData({ ...formData, mileage: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
            </div>
          </motion.div>

          {/* Conditions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border space-y-4">
            <h3 className="font-bold text-text-primary">Road & Weather Conditions</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Road Condition</label>
                <select value={formData.roadCondition}
                  onChange={(e) => setFormData({ ...formData, roadCondition: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary">
                  <option value="">Select</option>
                  {ROAD_CONDITIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Lighting</label>
                <select value={formData.lighting}
                  onChange={(e) => setFormData({ ...formData, lighting: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary">
                  <option value="">Select</option>
                  {LIGHTING_CONDITIONS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Speed Limit</label>
                <input type="text" placeholder="MPH" value={formData.speedLimit}
                  onChange={(e) => setFormData({ ...formData, speedLimit: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-text-muted uppercase">Est. Speed</label>
                <input type="text" placeholder="MPH" value={formData.estimatedSpeed}
                  onChange={(e) => setFormData({ ...formData, estimatedSpeed: e.target.value })}
                  className="w-full px-3 py-2.5 bg-surface-sunken border border-surface-border rounded-xl text-sm text-text-primary" />
              </div>
            </div>
          </motion.div>

          {/* Description */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border space-y-4">
            <h3 className="font-bold text-text-primary">Incident Description</h3>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase">Detailed Description</label>
              <textarea required rows={4} placeholder="Describe what happened..." value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none text-text-primary" />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-text-muted uppercase">Other Vehicles/Property Involved</label>
              <textarea rows={2} placeholder="Describe other vehicles, property damage, third parties..." value={formData.otherVehicles}
                onChange={(e) => setFormData({ ...formData, otherVehicles: e.target.value })}
                className="w-full px-4 py-3 bg-surface-sunken border border-surface-border rounded-xl text-sm resize-none text-text-primary" />
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 bg-surface-raised rounded-xl">
                <input type="checkbox" id="police" checked={formData.policeReport}
                  onChange={(e) => setFormData({ ...formData, policeReport: e.target.checked })}
                  className="w-5 h-5 text-accent border-surface-border rounded" />
                <label htmlFor="police" className="text-sm font-medium text-text-primary">Police Report Filed</label>
              </div>
              <div className="flex items-center gap-3 p-4 bg-danger/5 rounded-xl border border-danger/15">
                <input type="checkbox" id="dot" checked={formData.dotRecordable}
                  onChange={(e) => setFormData({ ...formData, dotRecordable: e.target.checked })}
                  className="w-5 h-5 text-red-600 border-red-300 rounded" />
                <label htmlFor="dot" className="text-sm font-medium text-danger">DOT Recordable</label>
              </div>
            </div>
          </motion.div>

          {/* Photo Upload */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            className="bg-surface-raised p-6 rounded-3xl shadow-soft border border-surface-border">
            <label className="text-xs font-bold text-text-muted uppercase">Evidence Photos</label>
            <button type="button" className="mt-3 w-full py-8 border-2 border-dashed border-surface-border rounded-2xl flex flex-col items-center gap-2 text-text-muted hover:text-accent hover:border-accent transition-all">
              <Camera className="w-8 h-8" />
              <span className="text-sm font-medium">Upload vehicle/scene photos</span>
            </button>
          </motion.div>

          {/* Submit */}
          {submitError && (
            <div className="p-4 bg-danger/5 border border-danger/20 rounded-2xl flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-danger shrink-0 mt-0.5" />
              <p className="text-sm text-danger">{submitError}</p>
            </div>
          )}
          <motion.button type="submit" disabled={isSubmitting} whileHover={{ scale: isSubmitting ? 1 : 1.02 }} whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className="w-full py-5 bg-primary text-text-inverted rounded-3xl shadow-glow font-bold text-lg flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed">
            <Send className="w-5 h-5" />
            {isSubmitting ? 'Submitting...' : 'Submit Vehicle Incident Report'}
          </motion.button>
        </form>
      </main>
    </div>
  );
};

export default VehicleIncidentReport;
