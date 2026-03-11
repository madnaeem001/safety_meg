import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronRight, ChevronLeft, X, CheckCircle2, Sparkles, 
  Shield, BarChart3, AlertTriangle, Brain, Eye, BookOpen,
  Rocket, ArrowRight
} from 'lucide-react';

interface OnboardingStep {
  id: number;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  tip: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 1,
    title: 'Welcome to SafetyMEG',
    description: 'Your AI-powered EHS command center. Let\'s walk you through the key features so you can hit the ground running.',
    icon: Rocket,
    color: 'cyan',
    tip: 'This walkthrough takes about 2 minutes. You can skip anytime.'
  },
  {
    id: 2,
    title: 'Dashboard & Command Center',
    description: 'Your home base shows real-time safety metrics, AI predictions, system health, and active incidents — all at a glance.',
    icon: Shield,
    color: 'cyan',
    tip: 'Click any metric card to drill down into detailed analytics.'
  },
  {
    id: 3,
    title: 'Report Incidents Instantly',
    description: 'Log incidents via text, voice, or photo. Our AI auto-classifies severity, identifies root causes, and suggests corrective actions.',
    icon: AlertTriangle,
    color: 'amber',
    tip: 'Use voice reporting for hands-free incident logging in the field.'
  },
  {
    id: 4,
    title: 'AI Visual Safety Audits',
    description: 'Upload photos or connect cameras — our AI scans for PPE violations, hazard zones, and compliance gaps in real-time.',
    icon: Eye,
    color: 'purple',
    tip: 'Supports 24+ audit templates including OSHA, ISO 45001, and NFPA.'
  },
  {
    id: 5,
    title: 'Predictive Risk Intelligence',
    description: 'Machine learning models forecast risks 7 days ahead, helping you prevent incidents before they happen.',
    icon: Brain,
    color: 'emerald',
    tip: 'Check the AI Risk Forecast widget on your dashboard daily.'
  },
  {
    id: 6,
    title: 'Analytics & Compliance',
    description: 'Track KPIs, conversion funnels, retention metrics, and generate compliance reports with one click.',
    icon: BarChart3,
    color: 'blue',
    tip: 'Set up automated report scheduling to never miss a deadline.'
  },
  {
    id: 7,
    title: 'AI Training Studio',
    description: 'Auto-generate safety training modules, track certifications, and ensure your team stays compliant year-round.',
    icon: BookOpen,
    color: 'violet',
    tip: 'Use AI Course Generator to create custom training from descriptions.'
  },
  {
    id: 8,
    title: 'You\'re All Set!',
    description: 'You now have a solid understanding of SafetyMEG. Explore the platform, and remember — our AI assistant is always ready to help.',
    icon: Sparkles,
    color: 'cyan',
    tip: 'Click the AI assistant button anytime for intelligent guidance.'
  },
];

const colorMap: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  cyan: { bg: 'bg-cyan-500/10', text: 'text-cyan-400', border: 'border-cyan-500/30', glow: 'shadow-[0_0_30px_rgba(6,182,212,0.2)]' },
  amber: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', glow: 'shadow-[0_0_30px_rgba(245,158,11,0.2)]' },
  purple: { bg: 'bg-purple-500/10', text: 'text-purple-400', border: 'border-purple-500/30', glow: 'shadow-[0_0_30px_rgba(168,85,247,0.2)]' },
  emerald: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30', glow: 'shadow-[0_0_30px_rgba(16,185,129,0.2)]' },
  blue: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.2)]' },
  violet: { bg: 'bg-violet-500/10', text: 'text-violet-400', border: 'border-violet-500/30', glow: 'shadow-[0_0_30px_rgba(139,92,246,0.2)]' },
};

export const OnboardingWalkthrough: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!isAuthenticated) return;
    const shouldShow = localStorage.getItem('safetymeg_show_onboarding');
    const hasCompleted = localStorage.getItem('safetymeg_onboarding_complete');
    if (shouldShow && !hasCompleted) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const handleNext = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  const handleComplete = () => {
    localStorage.setItem('safetymeg_onboarding_complete', 'true');
    localStorage.removeItem('safetymeg_show_onboarding');
    setIsVisible(false);
  };

  const handleSkip = () => {
    localStorage.setItem('safetymeg_onboarding_complete', 'true');
    localStorage.removeItem('safetymeg_show_onboarding');
    setIsVisible(false);
  };

  const step = ONBOARDING_STEPS[currentStep];
  const colors = colorMap[step.color] || colorMap.cyan;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={handleSkip} />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 30 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`relative w-full max-w-lg bg-slate-900/95 backdrop-blur-2xl rounded-3xl border ${colors.border} ${colors.glow} overflow-hidden`}
        >
          {/* Progress bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-slate-800">
            <motion.div
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className={`h-full bg-gradient-to-r from-cyan-500 to-purple-500`}
            />
          </div>

          {/* Close button */}
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700/60 text-slate-400 hover:text-white transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step counter */}
          <div className="absolute top-5 left-6 text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">
            Step {currentStep + 1} of {ONBOARDING_STEPS.length}
          </div>

          {/* Content */}
          <div className="pt-14 px-8 pb-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.35 }}
                className="text-center"
              >
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.1 }}
                  className={`inline-flex p-5 rounded-2xl ${colors.bg} mb-6`}
                >
                  <step.icon className={`w-10 h-10 ${colors.text}`} />
                </motion.div>

                <h2 className="text-2xl font-bold text-white mb-3 font-display">{step.title}</h2>
                <p className="text-slate-400 text-sm leading-relaxed mb-5 max-w-md mx-auto">{step.description}</p>

                {/* Tip */}
                <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${colors.bg} border ${colors.border}`}>
                  <Sparkles className={`w-3.5 h-3.5 ${colors.text}`} />
                  <span className={`text-xs font-medium ${colors.text}`}>{step.tip}</span>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Step dots */}
          <div className="flex items-center justify-center gap-2 px-8 pb-4">
            {ONBOARDING_STEPS.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === currentStep
                    ? 'w-8 h-2 bg-cyan-400'
                    : completedSteps.has(i)
                    ? 'w-2 h-2 bg-emerald-400'
                    : 'w-2 h-2 bg-slate-700 hover:bg-slate-600'
                }`}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between px-8 pb-8 pt-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all hover:bg-slate-800/60"
            >
              <ChevronLeft className="w-4 h-4" /> Back
            </button>

            <button
              onClick={handleSkip}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Skip tour
            </button>

            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02]`}
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? (
                <>Get Started <ArrowRight className="w-4 h-4" /></>
              ) : (
                <>Next <ChevronRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default OnboardingWalkthrough;
