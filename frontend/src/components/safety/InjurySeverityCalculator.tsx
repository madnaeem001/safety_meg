import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calculator, AlertTriangle, TrendingUp, Info, 
  Heart, Activity, Thermometer, Brain, Shield,
  CheckCircle2, XCircle, HelpCircle, Sparkles
} from 'lucide-react';

interface SeverityFactor {
  id: string;
  category: string;
  question: string;
  options: { label: string; value: number; description?: string }[];
  weight: number;
  aiContext?: string;
}

const SEVERITY_FACTORS: SeverityFactor[] = [
  {
    id: 'injury_type',
    category: 'Injury Classification',
    question: 'What type of injury occurred?',
    weight: 3,
    aiContext: 'ICD-10 injury classification consideration',
    options: [
      { label: 'Minor scratch/abrasion', value: 1, description: 'Surface level, no bleeding' },
      { label: 'Laceration requiring first aid', value: 2, description: 'Minor cut, basic treatment' },
      { label: 'Sprain/strain', value: 3, description: 'Soft tissue injury' },
      { label: 'Fracture (simple)', value: 4, description: 'Single bone, no displacement' },
      { label: 'Fracture (compound/multiple)', value: 5, description: 'Multiple or open fracture' },
      { label: 'Internal injury', value: 6, description: 'Organ damage suspected' },
      { label: 'Amputation/severe trauma', value: 7, description: 'Life-altering injury' }
    ]
  },
  {
    id: 'body_region',
    category: 'Body Region Affected',
    question: 'Which body region is primarily affected?',
    weight: 2.5,
    aiContext: 'Anatomical severity assessment',
    options: [
      { label: 'Extremity (finger/toe)', value: 1 },
      { label: 'Limb (arm/leg)', value: 2 },
      { label: 'Back/spine (minor)', value: 3 },
      { label: 'Chest/abdomen', value: 4 },
      { label: 'Head/face (no concussion)', value: 4 },
      { label: 'Head with concussion', value: 5 },
      { label: 'Neck/spine (serious)', value: 6 },
      { label: 'Multiple body regions', value: 6 }
    ]
  },
  {
    id: 'treatment_required',
    category: 'Treatment Level',
    question: 'What level of medical treatment is required?',
    weight: 3,
    aiContext: 'OSHA recordability assessment',
    options: [
      { label: 'Self-care only', value: 1, description: 'No professional treatment' },
      { label: 'First aid on site', value: 2, description: 'Basic medical supplies' },
      { label: 'Clinic visit (non-urgent)', value: 3, description: 'Scheduled medical care' },
      { label: 'Urgent care/ER visit', value: 4, description: 'Same-day professional care' },
      { label: 'Hospitalization (<24h)', value: 5, description: 'Observation required' },
      { label: 'Hospitalization (extended)', value: 6, description: 'Multi-day stay' },
      { label: 'Surgery required', value: 7, description: 'Surgical intervention' },
      { label: 'ICU/trauma care', value: 8, description: 'Critical care needed' }
    ]
  },
  {
    id: 'work_impact',
    category: 'Work Capacity Impact',
    question: 'How does this affect work capacity?',
    weight: 2,
    aiContext: 'Lost time calculation basis',
    options: [
      { label: 'No work restriction', value: 1 },
      { label: 'Light duty (1-3 days)', value: 2 },
      { label: 'Light duty (4-7 days)', value: 3 },
      { label: 'Light duty (>7 days)', value: 4 },
      { label: 'Lost time (1-3 days)', value: 5 },
      { label: 'Lost time (4-14 days)', value: 6 },
      { label: 'Lost time (15-30 days)', value: 7 },
      { label: 'Lost time (>30 days)', value: 8 },
      { label: 'Permanent disability', value: 10 }
    ]
  },
  {
    id: 'recovery_prognosis',
    category: 'Recovery Prognosis',
    question: 'What is the expected recovery outcome?',
    weight: 2,
    aiContext: 'Long-term impact assessment',
    options: [
      { label: 'Full recovery expected (<1 week)', value: 1 },
      { label: 'Full recovery expected (1-4 weeks)', value: 2 },
      { label: 'Full recovery expected (1-3 months)', value: 3 },
      { label: 'Full recovery expected (3-6 months)', value: 4 },
      { label: 'Partial recovery expected', value: 5 },
      { label: 'Long-term limitations likely', value: 6 },
      { label: 'Permanent impairment', value: 8 }
    ]
  },
  {
    id: 'immediate_danger',
    category: 'Immediate Risk Assessment',
    question: 'Was there immediate danger to life?',
    weight: 3.5,
    aiContext: 'Critical incident classification',
    options: [
      { label: 'No immediate danger', value: 1 },
      { label: 'Minor risk, quickly resolved', value: 2 },
      { label: 'Moderate risk, required intervention', value: 4 },
      { label: 'Serious risk, emergency response', value: 6 },
      { label: 'Life-threatening situation', value: 8 },
      { label: 'Fatality occurred', value: 10 }
    ]
  }
];

interface CalculatorResult {
  totalScore: number;
  maxScore: number;
  percentage: number;
  category: 'Minor' | 'Moderate' | 'Serious' | 'Severe' | 'Critical';
  oshaRecordable: boolean;
  lostTimeCase: boolean;
  recommendations: string[];
  aiAnalysisPrompt: string;
}

export const InjurySeverityCalculator: React.FC<{
  onCalculate?: (result: CalculatorResult) => void;
  initialValues?: Record<string, number>;
}> = ({ onCalculate, initialValues = {} }) => {
  const [answers, setAnswers] = useState<Record<string, number>>(initialValues);
  const [showDetails, setShowDetails] = useState(false);

  const result = useMemo((): CalculatorResult | null => {
    if (Object.keys(answers).length < SEVERITY_FACTORS.length) return null;

    let totalScore = 0;
    let maxScore = 0;

    SEVERITY_FACTORS.forEach(factor => {
      const answer = answers[factor.id] || 0;
      const maxOption = Math.max(...factor.options.map(o => o.value));
      totalScore += answer * factor.weight;
      maxScore += maxOption * factor.weight;
    });

    const percentage = (totalScore / maxScore) * 100;
    
    let category: CalculatorResult['category'];
    if (percentage < 20) category = 'Minor';
    else if (percentage < 40) category = 'Moderate';
    else if (percentage < 60) category = 'Serious';
    else if (percentage < 80) category = 'Severe';
    else category = 'Critical';

    const oshaRecordable = (answers.treatment_required || 0) >= 3 || 
                           (answers.work_impact || 0) >= 5;
    const lostTimeCase = (answers.work_impact || 0) >= 5;

    const recommendations: string[] = [];
    
    if (percentage >= 60) {
      recommendations.push('Immediate supervisor notification required');
      recommendations.push('Complete root cause analysis within 24 hours');
    }
    if (oshaRecordable) {
      recommendations.push('Document on OSHA 300 Log');
      recommendations.push('Submit Form 301 within 7 days');
    }
    if (lostTimeCase) {
      recommendations.push('Track lost workdays for DART rate');
      recommendations.push('Implement return-to-work program');
    }
    if ((answers.body_region || 0) >= 5) {
      recommendations.push('Specialist medical evaluation recommended');
    }
    if (percentage >= 40) {
      recommendations.push('Safety committee review required');
      recommendations.push('Consider process/equipment modifications');
    }

    const aiAnalysisPrompt = `Analyze this workplace injury:
- Severity Score: ${percentage.toFixed(1)}% (${category})
- Injury Type Score: ${answers.injury_type}/7
- Body Region Score: ${answers.body_region}/6
- Treatment Level: ${answers.treatment_required}/8
- Work Impact: ${answers.work_impact}/10
- Recovery Prognosis: ${answers.recovery_prognosis}/8
- Immediate Danger Level: ${answers.immediate_danger}/10
- OSHA Recordable: ${oshaRecordable ? 'Yes' : 'No'}
- Lost Time Case: ${lostTimeCase ? 'Yes' : 'No'}

Please provide:
1. Risk factors analysis
2. Similar incident patterns to watch for
3. Preventive measure recommendations
4. Return-to-work considerations
5. Regulatory compliance checklist`;

    return {
      totalScore,
      maxScore,
      percentage,
      category,
      oshaRecordable,
      lostTimeCase,
      recommendations,
      aiAnalysisPrompt
    };
  }, [answers]);

  React.useEffect(() => {
    if (result && onCalculate) {
      onCalculate(result);
    }
  }, [result, onCalculate]);

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Minor': return 'text-emerald-600 bg-emerald-100';
      case 'Moderate': return 'text-yellow-600 bg-yellow-100';
      case 'Serious': return 'text-orange-600 bg-orange-100';
      case 'Severe': return 'text-red-600 bg-red-100';
      case 'Critical': return 'text-red-800 bg-red-200';
      default: return 'text-surface-600 bg-surface-100';
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-surface-200 overflow-hidden">
      <div className="bg-gradient-to-r from-brand-600 to-brand-700 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <Calculator className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-white">Injury Severity Calculator</h3>
            <p className="text-brand-100 text-sm">OSHA-aligned severity assessment</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {SEVERITY_FACTORS.map((factor, index) => (
          <motion.div
            key={factor.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="border border-surface-100 rounded-xl p-4"
          >
            <div className="flex items-start gap-2 mb-3">
              <div className="w-6 h-6 bg-brand-100 text-brand-600 rounded-full flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-brand-900 text-sm">{factor.question}</p>
                <p className="text-xs text-surface-500">{factor.category}</p>
              </div>
              {factor.aiContext && (
                <div className="group relative">
                  <Info className="w-4 h-4 text-surface-400" />
                  <div className="absolute right-0 top-6 w-48 p-2 bg-brand-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                    {factor.aiContext}
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {factor.options.map(option => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setAnswers(prev => ({ ...prev, [factor.id]: option.value }))}
                  className={`p-2 rounded-lg text-left text-xs transition-all ${
                    answers[factor.id] === option.value
                      ? 'bg-brand-600 text-white ring-2 ring-brand-600 ring-offset-2'
                      : 'bg-surface-50 text-surface-700 hover:bg-surface-100'
                  }`}
                >
                  <span className="font-medium">{option.label}</span>
                  {option.description && (
                    <span className="block text-[10px] mt-0.5 opacity-75">{option.description}</span>
                  )}
                </button>
              ))}
            </div>
          </motion.div>
        ))}

        {/* Results */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border-2 border-brand-200 rounded-2xl overflow-hidden"
            >
              <div className="bg-brand-50 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-brand-900 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Severity Assessment Results
                  </h4>
                  <span className={`px-3 py-1 rounded-full font-bold text-sm ${getCategoryColor(result.category)}`}>
                    {result.category}
                  </span>
                </div>

                {/* Score Visualization */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-surface-600">Severity Score</span>
                    <span className="font-bold text-brand-900">{result.percentage.toFixed(1)}%</span>
                  </div>
                  <div className="h-4 bg-surface-200 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${result.percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full rounded-full ${
                        result.percentage < 20 ? 'bg-emerald-500' :
                        result.percentage < 40 ? 'bg-yellow-500' :
                        result.percentage < 60 ? 'bg-orange-500' :
                        result.percentage < 80 ? 'bg-red-500' : 'bg-red-700'
                      }`}
                    />
                  </div>
                </div>

                {/* Key Indicators */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-xl ${result.oshaRecordable ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    <div className="flex items-center gap-2">
                      {result.oshaRecordable ? (
                        <AlertTriangle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className={`text-sm font-medium ${result.oshaRecordable ? 'text-red-700' : 'text-emerald-700'}`}>
                        OSHA Recordable: {result.oshaRecordable ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${result.lostTimeCase ? 'bg-red-100' : 'bg-emerald-100'}`}>
                    <div className="flex items-center gap-2">
                      {result.lostTimeCase ? (
                        <XCircle className="w-4 h-4 text-red-600" />
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      )}
                      <span className={`text-sm font-medium ${result.lostTimeCase ? 'text-red-700' : 'text-emerald-700'}`}>
                        Lost Time Case: {result.lostTimeCase ? 'Yes' : 'No'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="bg-white rounded-xl p-3">
                  <h5 className="font-semibold text-brand-900 text-sm mb-2 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-brand-600" />
                    Recommended Actions
                  </h5>
                  <ul className="space-y-1">
                    {result.recommendations.map((rec, i) => (
                      <li key={i} className="text-xs text-surface-600 flex items-start gap-2">
                        <span className="text-brand-500">•</span>
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* AI Analysis Button */}
                <button
                  type="button"
                  onClick={() => setShowDetails(!showDetails)}
                  className="w-full mt-3 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:from-purple-700 hover:to-indigo-700 transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  {showDetails ? 'Hide AI Analysis Prompt' : 'View AI Analysis Prompt'}
                </button>

                <AnimatePresence>
                  {showDetails && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mt-3"
                    >
                      <div className="bg-surface-900 text-surface-100 p-3 rounded-xl text-xs font-mono whitespace-pre-wrap">
                        {result.aiAnalysisPrompt}
                      </div>
                      <p className="text-xs text-surface-500 mt-2 flex items-center gap-1">
                        <Info className="w-3 h-3" />
                        Copy this prompt for AI-assisted incident analysis
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 pt-2">
          <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-brand-600 rounded-full transition-all"
              style={{ width: `${(Object.keys(answers).length / SEVERITY_FACTORS.length) * 100}%` }}
            />
          </div>
          <span className="text-xs text-surface-500">
            {Object.keys(answers).length}/{SEVERITY_FACTORS.length} answered
          </span>
        </div>
      </div>
    </div>
  );
};

export default InjurySeverityCalculator;
