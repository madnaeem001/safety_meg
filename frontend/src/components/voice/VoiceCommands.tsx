import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Settings,
  HelpCircle,
  AlertCircle,
  CheckCircle2,
  X,
  Loader2,
  ChevronRight,
  Command,
  FileText,
  AlertTriangle,
  Shield,
  Search,
  Home,
  Bell,
  BarChart3,
  Camera,
  MapPin,
  User,
  Send
} from 'lucide-react';

interface VoiceCommand {
  id: string;
  phrase: string;
  aliases: string[];
  action: string;
  category: 'navigation' | 'action' | 'search' | 'report' | 'incident';
  description: string;
}

interface TranscriptEntry {
  text: string;
  confidence: number;
  timestamp: Date;
  recognized: boolean;
  command?: VoiceCommand;
}

// Voice-activated incident data
interface VoiceIncidentData {
  type: string;
  location: string;
  description: string;
  severity: string;
  isRecording: boolean;
}

const voiceCommands: VoiceCommand[] = [
  // Navigation
  { id: 'nav-home', phrase: 'go to dashboard', aliases: ['go home', 'open dashboard', 'show dashboard'], action: 'navigate:/', category: 'navigation', description: 'Navigate to main dashboard' },
  { id: 'nav-safety', phrase: 'go to safety hub', aliases: ['open safety', 'safety hub', 'show safety'], action: 'navigate:/safety-hub', category: 'navigation', description: 'Navigate to Safety Hub' },
  { id: 'nav-incidents', phrase: 'show incidents', aliases: ['go to incidents', 'open incidents', 'view incidents'], action: 'navigate:/safety-hub?tab=incidents', category: 'navigation', description: 'View incident reports' },
  { id: 'nav-compliance', phrase: 'show compliance', aliases: ['go to compliance', 'open compliance', 'compliance dashboard'], action: 'navigate:/safety-hub?section=compliance', category: 'navigation', description: 'View compliance dashboard' },
  { id: 'nav-training', phrase: 'show training', aliases: ['go to training', 'open training', 'training management'], action: 'navigate:/training', category: 'navigation', description: 'View training management' },
  { id: 'nav-analytics', phrase: 'show analytics', aliases: ['go to analytics', 'open analytics', 'view reports'], action: 'navigate:/analytics', category: 'navigation', description: 'View safety analytics' },
  
  // Voice-activated incident reporting
  { id: 'report-voice-incident', phrase: 'report incident', aliases: ['new incident', 'create incident', 'log incident', 'voice incident'], action: 'action:voice-incident', category: 'incident', description: 'Start voice-activated incident report' },
  { id: 'report-near-miss', phrase: 'report near miss', aliases: ['near miss', 'log near miss', 'close call'], action: 'action:voice-near-miss', category: 'incident', description: 'Report a near miss event' },
  { id: 'report-hazard', phrase: 'report hazard', aliases: ['safety hazard', 'found hazard', 'dangerous condition'], action: 'action:voice-hazard', category: 'incident', description: 'Report a safety hazard' },
  { id: 'report-injury', phrase: 'report injury', aliases: ['someone injured', 'injury report', 'hurt'], action: 'action:voice-injury', category: 'incident', description: 'Report an injury incident' },
  
  // Actions
  { id: 'act-jsa', phrase: 'new JSA', aliases: ['create JSA', 'job safety analysis', 'start JSA'], action: 'action:create-jsa', category: 'action', description: 'Create new Job Safety Analysis' },
  { id: 'act-observation', phrase: 'log observation', aliases: ['new observation', 'safety observation', 'report observation'], action: 'action:create-observation', category: 'action', description: 'Log a safety observation' },
  { id: 'act-sync', phrase: 'sync data', aliases: ['synchronize', 'sync now', 'upload data'], action: 'action:sync', category: 'action', description: 'Synchronize offline data' },
  { id: 'act-notifications', phrase: 'show notifications', aliases: ['open notifications', 'check alerts', 'view alerts'], action: 'action:notifications', category: 'action', description: 'View notifications' },
  { id: 'act-emergency', phrase: 'emergency', aliases: ['help', 'sos', 'emergency stop'], action: 'action:emergency', category: 'action', description: 'Trigger emergency protocol' },
  
  // Search
  { id: 'search-incident', phrase: 'search incidents', aliases: ['find incident', 'look up incident'], action: 'search:incidents', category: 'search', description: 'Search incident records' },
  { id: 'search-employee', phrase: 'search employee', aliases: ['find employee', 'look up employee', 'find person'], action: 'search:employees', category: 'search', description: 'Search employee records' },
  { id: 'search-permit', phrase: 'search permits', aliases: ['find permit', 'look up permit'], action: 'search:permits', category: 'search', description: 'Search permit records' },
  
  // Reports
  { id: 'report-daily', phrase: 'daily report', aliases: ['today report', 'daily summary'], action: 'report:daily', category: 'report', description: 'Generate daily safety report' },
  { id: 'report-weekly', phrase: 'weekly report', aliases: ['week report', 'weekly summary'], action: 'report:weekly', category: 'report', description: 'Generate weekly safety report' },
];

interface VoiceCommandsProps {
  onCommand?: (command: VoiceCommand, action: string) => void;
  onNavigate?: (path: string) => void;
}

export const VoiceCommands: React.FC<VoiceCommandsProps> = ({ onCommand, onNavigate }) => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [continuousMode, setContinuousMode] = useState(false);
  const [lastCommand, setLastCommand] = useState<VoiceCommand | null>(null);
  const [status, setStatus] = useState<'idle' | 'listening' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Voice incident reporting state
  const [showVoiceIncidentForm, setShowVoiceIncidentForm] = useState(false);
  const [voiceIncident, setVoiceIncident] = useState<VoiceIncidentData>({
    type: '',
    location: '',
    description: '',
    severity: 'medium',
    isRecording: false
  });
  const [incidentStep, setIncidentStep] = useState(0);
  const [isRecordingDescription, setIsRecordingDescription] = useState(false);
  
  const recognitionRef = useRef<any>(null);
  const descriptionRecognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = continuousMode;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setStatus('listening');
        setErrorMessage('');
      };

      recognition.onresult = (event: any) => {
        const current = event.results[event.results.length - 1];
        const transcriptText = current[0].transcript.toLowerCase().trim();
        setCurrentTranscript(transcriptText);

        if (current.isFinal) {
          processCommand(transcriptText, current[0].confidence);
        }
      };

      recognition.onerror = (event: any) => {
        setStatus('error');
        setErrorMessage(event.error === 'no-speech' ? 'No speech detected' : `Error: ${event.error}`);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (!continuousMode) {
          setIsListening(false);
          setStatus('idle');
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [continuousMode]);

  // Speech synthesis for voice feedback
  const speak = useCallback((text: string) => {
    if (feedbackEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, [feedbackEnabled]);

  const processCommand = useCallback((text: string, confidence: number) => {
    setStatus('processing');
    
    let matchedCommand: VoiceCommand | null = null;
    
    for (const cmd of voiceCommands) {
      if (text.includes(cmd.phrase) || cmd.aliases.some(alias => text.includes(alias))) {
        matchedCommand = cmd;
        break;
      }
    }

    const entry: TranscriptEntry = {
      text,
      confidence,
      timestamp: new Date(),
      recognized: !!matchedCommand,
      command: matchedCommand || undefined
    };

    setTranscript(prev => [entry, ...prev].slice(0, 10));

    if (matchedCommand) {
      setLastCommand(matchedCommand);
      setStatus('success');
      
      // Handle voice incident reporting
      if (matchedCommand.action === 'action:voice-incident' || 
          matchedCommand.action === 'action:voice-near-miss' ||
          matchedCommand.action === 'action:voice-hazard' ||
          matchedCommand.action === 'action:voice-injury') {
        speak(`Starting ${matchedCommand.description}. Please describe the incident.`);
        setShowVoiceIncidentForm(true);
        setIncidentStep(0);
        setVoiceIncident({
          type: matchedCommand.action.replace('action:voice-', ''),
          location: '',
          description: '',
          severity: 'medium',
          isRecording: false
        });
      } else if (matchedCommand.action.startsWith('navigate:')) {
        const path = matchedCommand.action.replace('navigate:', '');
        speak(`Navigating to ${matchedCommand.description}`);
        if (onNavigate) {
          onNavigate(path);
        } else {
          navigate(path);
        }
      } else if (matchedCommand.action === 'action:emergency') {
        speak('Emergency protocol activated. Alerting safety team.');
        // Trigger emergency notification
      } else {
        speak(`Command recognized: ${matchedCommand.description}`);
        if (onCommand) {
          onCommand(matchedCommand, matchedCommand.action);
        }
      }

      setTimeout(() => setStatus('idle'), 2000);
    } else {
      setStatus('error');
      speak('Command not recognized. Please try again.');
      setErrorMessage('Command not recognized');
      setTimeout(() => setStatus('idle'), 2000);
    }
  }, [onCommand, onNavigate, navigate, speak]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Start recording incident description
  const startDescriptionRecording = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        setVoiceIncident(prev => ({
          ...prev,
          description: prev.description + ' ' + finalTranscript
        }));
      }
    };

    recognition.onerror = () => {
      setIsRecordingDescription(false);
    };

    recognition.onend = () => {
      setIsRecordingDescription(false);
    };

    descriptionRecognitionRef.current = recognition;
    recognition.start();
    setIsRecordingDescription(true);
    speak('Recording incident description. Speak clearly and tap stop when finished.');
  };

  const stopDescriptionRecording = () => {
    if (descriptionRecognitionRef.current) {
      descriptionRecognitionRef.current.stop();
    }
    setIsRecordingDescription(false);
    speak('Description recorded.');
  };

  // Submit voice incident
  const submitVoiceIncident = () => {
    speak('Incident report submitted successfully. A confirmation email will be sent.');
    setShowVoiceIncidentForm(false);
    // In real implementation, this would submit to backend
    console.log('Voice incident submitted:', voiceIncident);
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'navigation': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      case 'action': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'search': return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'report': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
      case 'incident': return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'listening':
        return <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }}><Mic className="w-8 h-8 text-red-500" /></motion.div>;
      case 'processing':
        return <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500" />;
      case 'error':
        return <AlertCircle className="w-8 h-8 text-red-500" />;
      default:
        return <MicOff className="w-8 h-8 text-gray-400" />;
    }
  };

  if (!isSupported) {
    return (
      <div className="p-6 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-200 dark:border-amber-800">
        <div className="flex items-center gap-3">
          <AlertCircle className="w-6 h-6 text-amber-500" />
          <div>
            <h3 className="font-semibold text-amber-800 dark:text-amber-200">Voice Commands Not Supported</h3>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Your browser doesn't support the Web Speech API. Try Chrome, Edge, or Safari.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Voice Control */}
      <div className="bg-surface-raised rounded-3xl border border-surface-border overflow-hidden">
        {/* Voice Control Header */}
        <div className="p-6 border-b border-surface-200 dark:border-surface-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleListening}
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening 
                    ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-pulse' 
                    : 'bg-surface-raised hover:bg-surface-overlay'
                }`}
              >
                {getStatusIcon()}
              </button>
              <div>
                <h2 className="text-xl font-bold text-text-primary">Voice Commands</h2>
                <p className="text-text-muted">
                  {isListening ? 'Listening... Speak a command' : 'Tap microphone to start'}
                </p>
                {currentTranscript && isListening && (
                  <p className="text-brand-500 font-medium mt-1">"{currentTranscript}"</p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHelp(true)}
                className="p-2 rounded-xl hover:bg-surface-overlay transition-colors"
              >
                <HelpCircle className="w-5 h-5 text-text-muted" />
              </button>
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-xl hover:bg-surface-overlay transition-colors"
              >
                <Settings className="w-5 h-5 text-text-muted" />
              </button>
            </div>
          </div>
        </div>

        {/* Quick Voice Actions for Incidents */}
        <div className="p-4 border-b border-surface-border bg-surface-raised">
          <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Quick Voice Incident Reporting</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {[
              { label: 'Report Incident', icon: AlertTriangle, color: 'bg-red-500', action: 'voice-incident' },
              { label: 'Near Miss', icon: Shield, color: 'bg-amber-500', action: 'voice-near-miss' },
              { label: 'Report Hazard', icon: AlertCircle, color: 'bg-orange-500', action: 'voice-hazard' },
              { label: 'Report Injury', icon: User, color: 'bg-pink-500', action: 'voice-injury' },
            ].map((item) => (
              <button
                key={item.action}
                onClick={() => {
                  setShowVoiceIncidentForm(true);
                  setVoiceIncident({
                    type: item.action.replace('voice-', ''),
                    location: '',
                    description: '',
                    severity: 'medium',
                    isRecording: false
                  });
                  setIncidentStep(0);
                  speak(`Starting ${item.label}. Please describe the incident.`);
                }}
                className="flex items-center gap-2 p-3 bg-surface-raised rounded-xl border border-surface-border hover:border-accent/30 transition-all"
              >
                <div className={`w-8 h-8 ${item.color} rounded-lg flex items-center justify-center`}>
                  <item.icon className="w-4 h-4 text-white" />
                </div>
                <span className="text-sm font-medium text-text-secondary">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Recent Commands */}
        {transcript.length > 0 && (
          <div className="p-4">
            <p className="text-xs font-semibold text-text-muted uppercase tracking-wide mb-3">Recent Commands</p>
            <div className="space-y-2">
              {transcript.slice(0, 5).map((entry, index) => (
                <div
                  key={index}
                  className={`flex items-center justify-between p-3 rounded-xl ${
                    entry.recognized
                      ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                      : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {entry.recognized ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <X className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium text-text-primary">"{entry.text}"</p>
                      {entry.command && (
                        <p className="text-xs text-text-muted">{entry.command.description}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">
                    {Math.round(entry.confidence * 100)}% confidence
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Voice Incident Form Modal */}
      <AnimatePresence>
        {showVoiceIncidentForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4"
            onClick={() => setShowVoiceIncidentForm(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg bg-surface-overlay rounded-t-3xl md:rounded-3xl max-h-[90vh] overflow-auto"
            >
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-2xl flex items-center justify-center">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-text-primary">
                        Voice Incident Report
                      </h3>
                      <p className="text-sm text-text-muted">
                        {voiceIncident.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowVoiceIncidentForm(false)}
                    className="p-2 rounded-full hover:bg-surface-overlay"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Location */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <MapPin className="w-4 h-4 inline mr-1" />
                    Location
                  </label>
                  <input
                    type="text"
                    value={voiceIncident.location}
                    onChange={(e) => setVoiceIncident(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="Where did this occur?"
                    className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent"
                  />
                </div>

                {/* Voice Description */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <FileText className="w-4 h-4 inline mr-1" />
                    Description
                  </label>
                  <div className="relative">
                    <textarea
                      value={voiceIncident.description}
                      onChange={(e) => setVoiceIncident(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what happened or tap the microphone to dictate..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-surface-border bg-surface-raised text-text-primary focus:ring-2 focus:ring-accent pr-14"
                    />
                    <button
                      onClick={isRecordingDescription ? stopDescriptionRecording : startDescriptionRecording}
                      className={`absolute right-3 top-3 w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                        isRecordingDescription 
                          ? 'bg-red-500 animate-pulse' 
                          : 'bg-surface-raised hover:bg-surface-overlay'
                      }`}
                    >
                      {isRecordingDescription ? (
                        <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                          <Mic className="w-5 h-5 text-white" />
                        </motion.div>
                      ) : (
                        <Mic className="w-5 h-5 text-text-secondary" />
                      )}
                    </button>
                  </div>
                  {isRecordingDescription && (
                    <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                      <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                      Recording... Tap microphone to stop
                    </p>
                  )}
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    Severity
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {['low', 'medium', 'high', 'critical'].map((sev) => (
                      <button
                        key={sev}
                        onClick={() => setVoiceIncident(prev => ({ ...prev, severity: sev }))}
                        className={`px-3 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                          voiceIncident.severity === sev
                            ? sev === 'critical' ? 'bg-red-500 text-white'
                            : sev === 'high' ? 'bg-orange-500 text-white'
                            : sev === 'medium' ? 'bg-amber-500 text-white'
                            : 'bg-emerald-500 text-white'
                            : 'bg-surface-overlay text-text-secondary'
                        }`}
                      >
                        {sev}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Photo Upload */}
                <div>
                  <label className="block text-sm font-medium text-text-secondary mb-2">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Add Photo (Optional)
                  </label>
                  <button className="w-full p-4 border-2 border-dashed border-surface-border rounded-xl text-text-muted hover:border-accent hover:text-accent transition-colors">
                    <Camera className="w-6 h-6 mx-auto mb-2" />
                    <span className="text-sm">Tap to capture photo</span>
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  onClick={submitVoiceIncident}
                  disabled={!voiceIncident.location || !voiceIncident.description}
                  className="w-full py-4 bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg transition-all"
                >
                  <Send className="w-5 h-5" />
                  Submit Incident Report
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Help Modal */}
      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4"
            onClick={() => setShowHelp(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl bg-surface-overlay rounded-t-3xl md:rounded-3xl max-h-[80vh] overflow-auto"
            >
              <div className="p-6 border-b border-surface-border sticky top-0 bg-surface-overlay">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text-primary">Voice Commands Guide</h3>
                  <button
                    onClick={() => setShowHelp(false)}
                    className="p-2 rounded-full hover:bg-surface-raised"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
              <div className="p-6">
                <div className="space-y-6">
                  {['incident', 'navigation', 'action', 'search', 'report'].map((category) => (
                    <div key={category}>
                      <h4 className="text-sm font-bold text-text-muted uppercase tracking-wide mb-3">
                        {category === 'incident' ? '🎤 Voice Incident Reporting' : category}
                      </h4>
                      <div className="space-y-2">
                        {voiceCommands.filter(cmd => cmd.category === category).map((cmd) => (
                          <div
                            key={cmd.id}
                            className="flex items-center justify-between p-3 bg-surface-raised rounded-xl"
                          >
                            <div>
                              <p className="font-medium text-text-primary">"{cmd.phrase}"</p>
                              <p className="text-xs text-text-muted mt-0.5">{cmd.description}</p>
                              {cmd.aliases.length > 0 && (
                                <p className="text-xs text-text-muted mt-1">
                                  Also: {cmd.aliases.slice(0, 2).map(a => `"${a}"`).join(', ')}
                                </p>
                              )}
                            </div>
                            <span className={`text-xs font-bold px-2 py-1 rounded-full ${getCategoryColor(cmd.category)}`}>
                              {cmd.category}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-end md:items-center justify-center z-50 p-4"
            onClick={() => setShowSettings(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-surface-overlay rounded-t-3xl md:rounded-3xl"
            >
              <div className="p-6 border-b border-surface-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-text-primary">Voice Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-2 rounded-full hover:bg-surface-raised"
                  >
                    <X className="w-5 h-5 text-text-muted" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-surface-raised rounded-xl">
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="font-medium text-text-primary">Voice Feedback</p>
                      <p className="text-xs text-surface-500">Speak command confirmations</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setFeedbackEnabled(!feedbackEnabled)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      feedbackEnabled ? 'bg-brand-500' : 'bg-surface-300 dark:bg-surface-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: feedbackEnabled ? 24 : 2 }}
                      className="w-5 h-5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-surface-raised rounded-xl">
                  <div className="flex items-center gap-3">
                    <Mic className="w-5 h-5 text-text-muted" />
                    <div>
                      <p className="font-medium text-text-primary">Continuous Listening</p>
                      <p className="text-xs text-text-muted">Keep listening after command</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setContinuousMode(!continuousMode)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      continuousMode ? 'bg-accent' : 'bg-surface-border'
                    }`}
                  >
                    <motion.div
                      animate={{ x: continuousMode ? 24 : 2 }}
                      className="w-5 h-5 bg-white rounded-full shadow"
                    />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VoiceCommands;
