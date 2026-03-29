import React, { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import FadeContent from '../components/animations/FadeContent';
import { hazardReportsApiService } from '../api/services/apiService';

interface HazardReport {
  id: string;
  location: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  type: string;
  timestamp: Date;
  status: 'draft' | 'submitted';
  voiceRecording?: string;
}

const hazardTypes = [
  { id: 'slip-trip-fall', label: 'Slip/Trip/Fall', icon: '🦶' },
  { id: 'electrical', label: 'Electrical', icon: '⚡' },
  { id: 'chemical', label: 'Chemical', icon: '🧪' },
  { id: 'machinery', label: 'Machinery', icon: '⚙️' },
  { id: 'ergonomic', label: 'Ergonomic', icon: '🦴' },
  { id: 'fire', label: 'Fire', icon: '🔥' },
  { id: 'confined-space', label: 'Confined Space', icon: '📦' },
  { id: 'other', label: 'Other', icon: '⚠️' },
];

const severityConfig = {
  low: { color: 'text-green-700', bgColor: 'bg-green-100', borderColor: 'border-green-400' },
  medium: { color: 'text-amber-700', bgColor: 'bg-amber-100', borderColor: 'border-amber-400' },
  high: { color: 'text-orange-700', bgColor: 'bg-orange-100', borderColor: 'border-orange-400' },
  critical: { color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-400' },
};

export const VoiceHazardReport: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'type' | 'location' | 'description' | 'severity' | 'review'>('type');
  const [report, setReport] = useState<Partial<HazardReport>>({
    id: `HAZ-${Date.now()}`,
    timestamp: new Date(),
    status: 'draft',
  });
  const [activeField, setActiveField] = useState<'location' | 'description' | null>(null);
  const activeFieldRef = useRef<'location' | 'description' | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    confidence,
    startListening,
    stopListening,
    resetTranscript,
  } = useVoiceRecognition({
    continuous: true,
    interimResults: true,
    language: 'en-US',
    onResult: (text, isFinal) => {
      if (isFinal && activeFieldRef.current) {
        const field = activeFieldRef.current;
        setReport(prev => ({
          ...prev,
          [field]: (prev[field] || '') + ' ' + text,
        }));
      }
    },
  });

  // Handle voice input for specific fields
  const handleVoiceInput = useCallback((field: 'location' | 'description') => {
    if (isListening && activeField === field) {
      stopListening();
      activeFieldRef.current = null;
      setActiveField(null);
    } else {
      resetTranscript();
      activeFieldRef.current = field;
      setActiveField(field);
      startListening();
    }
  }, [isListening, activeField, startListening, stopListening, resetTranscript]);

  // Auto-stop after silence
  useEffect(() => {
    if (isListening && activeField) {
      const timeout = setTimeout(() => {
        if (!interimTranscript) {
          stopListening();
          activeFieldRef.current = null;
          setActiveField(null);
        }
      }, 5000);
      return () => clearTimeout(timeout);
    }
  }, [isListening, activeField, interimTranscript, stopListening]);

  const handleSubmit = async () => {
    if (!report.type || !report.location || !report.description || !report.severity) {
      setSubmitError('Please complete all steps before submitting.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const response = await hazardReportsApiService.create({
        description: report.description || '',
        location: report.location || '',
        hazardType: report.type || 'other',
        severity: report.severity || 'medium',
        reportedBy: 'Voice Report',
      } as any);
      // Submit the draft to mark it as submitted in the database
      const createdId = (response as any)?.data?.id ?? (response as any)?.id;
      if (createdId) {
        await hazardReportsApiService.submit(createdId);
      }
      setShowSuccess(true);
      setTimeout(() => navigate(-1), 2000);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit hazard report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getProgress = () => {
    const steps = ['type', 'location', 'description', 'severity', 'review'];
    return ((steps.indexOf(step) + 1) / steps.length) * 100;
  };

  return (
    <div className="page-wrapper">
      {/* Header */}
      <div className="bg-gradient-to-br from-amber-600 via-orange-500 to-red-500 pt-12 pb-6 px-4 safe-top">
        <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white active:scale-95 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <h1 className="page-title">Report Hazard</h1>
            <p className="text-amber-100 text-sm">Voice-enabled reporting</p>
          </div>
          {isSupported && (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isListening ? 'bg-red-500 animate-pulse' : 'bg-white/20'}`}>
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div className="h-2 bg-white/20 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-white"
            initial={{ width: 0 }}
            animate={{ width: `${getProgress()}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Voice Status Banner */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-4 p-3 bg-danger/10 border border-danger/30 rounded-xl flex items-center gap-3"
          >
            <div className="relative">
              <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-75" />
              <span className="relative w-3 h-3 rounded-full bg-red-600 block" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">Listening for {activeField}...</p>
              {interimTranscript && (
                <p className="text-xs text-danger italic">"{interimTranscript}"</p>
              )}
            </div>
            <button
              onClick={() => {
                stopListening();
                activeFieldRef.current = null;
                setActiveField(null);
              }}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-sm"
            >
              Stop
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Banner */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mx-4 mt-4 p-3 bg-amber-100 border border-amber-200 rounded-xl flex items-center gap-3"
          >
            <span className="text-amber-600">⚠️</span>
            <p className="text-sm text-amber-800">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className="px-4 mt-6">
        <FadeContent>
          <AnimatePresence mode="wait">
            {/* Step 1: Hazard Type */}
            {step === 'type' && (
              <motion.div
                key="type"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="section-heading">
                  What type of hazard?
                </h2>
                <p className="text-sm text-surface-500">Select the category that best describes the hazard</p>
                
                <div className="grid grid-cols-2 gap-3">
                  {hazardTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        setReport(prev => ({ ...prev, type: type.id }));
                        setStep('location');
                      }}
                      className={`p-4 rounded-xl border-2 transition-all text-left ${
                        report.type === type.id
                          ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/30'
                          : 'border-surface-200 dark:border-surface-700 bg-white dark:bg-surface-800'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{type.icon}</span>
                      <span className="font-medium text-text-primary">{type.label}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 2: Location */}
            {step === 'location' && (
              <motion.div
                key="location"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-text-primary">
                  Where is the hazard?
                </h2>
                <p className="text-sm text-surface-500">Describe the location or use voice input</p>

                <div className="relative">
                  <textarea
                    value={report.location || ''}
                    onChange={(e) => setReport(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="e.g., Warehouse Section B, near loading dock..."
                    className="w-full h-32 p-4 pr-14 bg-surface-raised border border-surface-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
                  />
                  {isSupported && (
                    <button
                      onClick={() => handleVoiceInput('location')}
                      className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isListening && activeField === 'location'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                </div>

                {activeField === 'location' && interimTranscript && (
                  <p className="text-sm text-amber-600 italic">Hearing: "{interimTranscript}"</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('type')}
                    className="flex-1 py-3 bg-surface-raised text-text-secondary rounded-xl font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('description')}
                    disabled={!report.location}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Description */}
            {step === 'description' && (
              <motion.div
                key="description"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-text-primary">
                  Describe the hazard
                </h2>
                <p className="text-sm text-surface-500">Provide details about what you observed</p>

                <div className="relative">
                  <textarea
                    value={report.description || ''}
                    onChange={(e) => setReport(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe the hazard condition, what caused it, and any immediate risks..."
                    className="w-full h-40 p-4 pr-14 bg-surface-raised border border-surface-border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 text-text-primary"
                  />
                  {isSupported && (
                    <button
                      onClick={() => handleVoiceInput('description')}
                      className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                        isListening && activeField === 'description'
                          ? 'bg-red-500 text-white animate-pulse'
                          : 'bg-amber-100 text-amber-600 hover:bg-amber-200'
                      }`}
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </button>
                  )}
                </div>

                {activeField === 'description' && interimTranscript && (
                  <p className="text-sm text-amber-600 italic">Hearing: "{interimTranscript}"</p>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('location')}
                    className="flex-1 py-3 bg-surface-raised text-text-secondary rounded-xl font-medium"
                  >
                    Back
                  </button>
                  <button
                    onClick={() => setStep('severity')}
                    disabled={!report.description}
                    className="flex-1 py-3 bg-amber-500 text-white rounded-xl font-medium disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step 4: Severity */}
            {step === 'severity' && (
              <motion.div
                key="severity"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-text-primary">
                  How severe is the hazard?
                </h2>
                <p className="text-sm text-surface-500">Assess the potential for injury</p>

                <div className="space-y-3">
                  {(['low', 'medium', 'high', 'critical'] as const).map((level) => {
                    const config = severityConfig[level];
                    const descriptions = {
                      low: 'Minor inconvenience, no injury likely',
                      medium: 'Could cause minor injury without intervention',
                      high: 'Likely to cause significant injury',
                      critical: 'Immediate danger of serious injury or death',
                    };

                    return (
                      <button
                        key={level}
                        onClick={() => {
                          setReport(prev => ({ ...prev, severity: level }));
                          setStep('review');
                        }}
                        className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                          report.severity === level
                            ? `${config.borderColor} ${config.bgColor}`
                            : 'border-surface-border bg-surface-raised'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className={`font-bold capitalize ${config.color}`}>{level}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${config.bgColor} ${config.color}`}>
                            {level === 'critical' ? '🚨' : level === 'high' ? '⚠️' : level === 'medium' ? '📋' : '💡'}
                          </span>
                        </div>
                        <p className="text-sm text-text-muted">{descriptions[level]}</p>
                      </button>
                    );
                  })}
                </div>

                  <button
                  onClick={() => setStep('description')}
                  className="w-full py-3 bg-surface-raised text-text-secondary rounded-xl font-medium"
                >
                  Back
                </button>
              </motion.div>
            )}

            {/* Step 5: Review */}
            {step === 'review' && (
              <motion.div
                key="review"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-bold text-text-primary">
                  Review your report
                </h2>

                <div className="bg-surface-raised rounded-xl p-4 space-y-4 border border-surface-border">
                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase">Hazard Type</p>
                    <p className="font-medium text-text-primary">
                      {hazardTypes.find(t => t.id === report.type)?.icon} {hazardTypes.find(t => t.id === report.type)?.label}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase">Location</p>
                    <p className="text-text-secondary">{report.location}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase">Description</p>
                    <p className="text-text-secondary">{report.description}</p>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-text-muted uppercase">Severity</p>
                    {report.severity && (
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium capitalize ${severityConfig[report.severity].bgColor} ${severityConfig[report.severity].color}`}>
                        {report.severity}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('severity')}
                    className="flex-1 py-3 bg-surface-raised text-text-secondary rounded-xl font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 py-3 bg-green-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeOpacity="0.3"/><path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z"/></svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                    {isSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
                {submitError && (
                  <p className="text-red-500 text-sm text-center mt-2">{submitError}</p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </FadeContent>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-surface-overlay rounded-2xl p-6 w-full max-w-sm text-center"
            >
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="section-heading text-xl mb-2">
                Report Submitted!
              </h3>
              <p className="text-surface-500">
                Your hazard report has been submitted successfully. Thank you for keeping our workplace safe.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceHazardReport;
