import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, 
  GraduationCap, 
  BookOpen, 
  Zap, 
  RefreshCw, 
  Play, 
  CheckCircle2, 
  AlertTriangle,
  Brain,
  Target,
  ChevronRight,
  Clock,
  Shield,
  Search,
  Plus,
  Layout,
  ListChecks,
  Award,
  Users,
  FileText,
  CheckCircle,
  XCircle,
  Download,
  Share2
} from 'lucide-react';
import { aiService } from '../../services/aiService';

/* ================================================================
   AI SAFETY TRAINING GENERATOR
   Creates custom safety training modules, quizzes, and materials
   from hazard descriptions or regulatory topics.
   ================================================================ */

export const AITrainingGenerator: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [trainingData, setTrainingData] = useState<any>(null);
  const [topic, setTopic] = useState('');
  const [level, setLevel] = useState('beginner');
  const [activeModule, setActiveModule] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});
  const [showResults, setShowResults] = useState(false);

  const handleGenerate = async () => {
    if (!topic.trim()) return;
    setIsGenerating(true);
    setTrainingData(null);
    setShowResults(false);
    setQuizAnswers({});
    
    try {
      const data = await aiService.generateTrainingModule(topic, level);
      setTrainingData(data);
    } catch (error) {
      console.error('Generation Error:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAnswer = (qIdx: number, oIdx: number) => {
    setQuizAnswers(prev => ({ ...prev, [qIdx]: oIdx }));
  };

  const calculateScore = () => {
    let correct = 0;
    trainingData.quiz.forEach((q: any, i: number) => {
      if (quizAnswers[i] === q.answer) correct++;
    });
    return Math.round((correct / trainingData.quiz.length) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Config Header */}
      <div className="bg-white dark:bg-surface-900 rounded-2xl p-6 border border-surface-200 dark:border-surface-800 shadow-sm">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-surface-900 dark:text-white">AI Training Studio</h3>
              <p className="text-sm text-surface-500">Create custom safety modules in seconds</p>
            </div>
          </div>
          
          <div className="flex flex-1 items-center gap-3 w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-surface-400" />
              <input 
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Enter topic (e.g. Forklift Safety, Chemical Handling)..."
                className="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-violet-500/20"
              />
            </div>
            <select 
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="px-4 py-2.5 bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-xl text-sm font-medium outline-none"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !topic.trim()}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-violet-600/20 whitespace-nowrap"
            >
              {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
              {isGenerating ? 'Generating...' : 'Build Module'}
            </button>
          </div>
        </div>
      </div>

      {/* Training Content */}
      <AnimatePresence mode="wait">
        {trainingData ? (
          <motion.div
            key="training"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            className="grid lg:grid-cols-3 gap-6"
          >
            {/* Main Course Content */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-surface-100 dark:border-surface-800 flex justify-between items-center">
                  <div>
                    <h2 className="text-xl font-black text-surface-900 dark:text-white">{trainingData.title}</h2>
                    <p className="text-xs text-surface-500 mt-1 flex items-center gap-2">
                      <Clock className="w-3 h-3" /> {trainingData.duration} · {trainingData.level} Level
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                    <button className="p-2 hover:bg-surface-100 dark:hover:bg-surface-800 rounded-lg text-surface-500 transition-colors">
                      <Share2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                <div className="flex border-b border-surface-100 dark:border-surface-800">
                  {trainingData.modules.map((mod: any, i: number) => (
                    <button
                      key={i}
                      onClick={() => setActiveModule(i)}
                      className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest transition-all ${
                        activeModule === i 
                          ? 'text-violet-600 border-b-2 border-violet-600 bg-violet-50/30' 
                          : 'text-surface-400 hover:text-surface-600'
                      }`}
                    >
                      Module {i + 1}
                    </button>
                  ))}
                </div>

                <div className="p-8 min-h-[300px]">
                  <motion.div
                    key={activeModule}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="space-y-6"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 flex items-center justify-center font-bold">
                        {activeModule + 1}
                      </div>
                      <h3 className="text-lg font-bold text-surface-900 dark:text-white">
                        {trainingData.modules[activeModule].title}
                      </h3>
                    </div>
                    <p className="text-surface-600 dark:text-surface-400 leading-relaxed text-base">
                      {trainingData.modules[activeModule].content}
                    </p>
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-surface-400 uppercase tracking-widest">Key Learning Points</h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {trainingData.modules[activeModule].keyPoints.map((point: string, i: number) => (
                          <div key={i} className="flex items-start gap-2 p-3 rounded-xl bg-surface-50 dark:bg-surface-800/50 border border-surface-100 dark:border-surface-700/50">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-xs text-surface-700 dark:text-surface-300 font-medium">{point}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                </div>

                <div className="p-6 bg-surface-50 dark:bg-surface-800/50 border-t border-surface-100 dark:border-surface-800 flex justify-between items-center">
                  <button 
                    disabled={activeModule === 0}
                    onClick={() => setActiveModule(prev => prev - 1)}
                    className="px-4 py-2 text-xs font-bold text-surface-500 hover:text-surface-700 disabled:opacity-30"
                  >
                    Previous
                  </button>
                  <div className="flex gap-1">
                    {trainingData.modules.map((_: any, i: number) => (
                      <div key={i} className={`w-1.5 h-1.5 rounded-full ${activeModule === i ? 'bg-violet-600' : 'bg-surface-300'}`} />
                    ))}
                  </div>
                  <button 
                    onClick={() => activeModule < trainingData.modules.length - 1 ? setActiveModule(prev => prev + 1) : null}
                    className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-lg hover:bg-brand-500 transition-colors"
                  >
                    {activeModule === trainingData.modules.length - 1 ? 'Finish Lessons' : 'Next Module'}
                  </button>
                </div>
              </div>

              {/* Quiz Section */}
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-8">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-lg font-bold text-surface-900 dark:text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-amber-500" />
                    Knowledge Verification
                  </h3>
                  {showResults && (
                    <div className={`px-4 py-1.5 rounded-full text-sm font-bold ${calculateScore() >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      Score: {calculateScore()}%
                    </div>
                  )}
                </div>

                <div className="space-y-8">
                  {trainingData.quiz.map((q: any, i: number) => (
                    <div key={i} className="space-y-4">
                      <p className="text-sm font-bold text-surface-900 dark:text-white">
                        {i + 1}. {q.question}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {q.options.map((opt: string, j: number) => {
                          const isSelected = quizAnswers[i] === j;
                          const isCorrect = q.answer === j;
                          let bgColor = 'bg-surface-50 dark:bg-surface-800/50';
                          let borderColor = 'border-surface-100 dark:border-surface-700/50';
                          
                          if (showResults) {
                            if (isCorrect) {
                              bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
                              borderColor = 'border-emerald-200 dark:border-emerald-800';
                            } else if (isSelected) {
                              bgColor = 'bg-red-50 dark:bg-red-900/20';
                              borderColor = 'border-red-200 dark:border-red-800';
                            }
                          } else if (isSelected) {
                            bgColor = 'bg-violet-50 dark:bg-violet-900/20';
                            borderColor = 'border-violet-200 dark:border-violet-800';
                          }

                          return (
                            <button
                              key={j}
                              disabled={showResults}
                              onClick={() => handleAnswer(i, j)}
                              className={`p-4 rounded-xl border text-left transition-all flex items-center justify-between group ${bgColor} ${borderColor}`}
                            >
                              <span className={`text-xs font-medium ${isSelected ? 'text-violet-700 dark:text-violet-400' : 'text-surface-600 dark:text-surface-400'}`}>
                                {opt}
                              </span>
                              {showResults && isCorrect && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                              {showResults && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {!showResults ? (
                  <button
                    onClick={() => setShowResults(true)}
                    disabled={Object.keys(quizAnswers).length < trainingData.quiz.length}
                    className="w-full mt-8 py-3 bg-surface-900 dark:bg-surface-800 text-white font-bold rounded-xl hover:bg-surface-800 transition-all disabled:opacity-30"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <div className="mt-8 p-6 rounded-2xl bg-brand-500/5 border border-brand-500/20 flex flex-col items-center text-center">
                    <Award className="w-12 h-12 text-brand-500 mb-4" />
                    <h4 className="text-lg font-bold text-surface-900 dark:text-white mb-2">
                      {calculateScore() >= 80 ? 'Congratulations! You Passed.' : 'Keep Learning.'}
                    </h4>
                    <p className="text-sm text-surface-500 mb-6">
                      {calculateScore() >= 80 
                        ? 'Your certification has been automatically updated in the system.' 
                        : 'Review the modules and try the quiz again to earn your certificate.'}
                    </p>
                    <div className="flex gap-4">
                      <button onClick={handleGenerate} className="px-6 py-2 bg-white dark:bg-surface-800 border border-surface-200 dark:border-surface-700 text-xs font-bold rounded-xl hover:bg-surface-50 transition-all">
                        Retake Training
                      </button>
                      {calculateScore() >= 80 && (
                        <button className="px-6 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-500 transition-all shadow-lg shadow-brand-600/20">
                          Download Certificate
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar: Resources & Deployment */}
            <div className="space-y-6">
              <div className="bg-white dark:bg-surface-900 rounded-2xl border border-surface-200 dark:border-surface-800 shadow-sm p-6">
                <h3 className="text-sm font-bold text-surface-900 dark:text-white mb-4 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-brand-500" />
                  Learning Resources
                </h3>
                <div className="space-y-2">
                  {trainingData.resources.map((res: any, i: number) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors cursor-pointer group">
                      <div className="flex items-center gap-3">
                        <FileText className="w-4 h-4 text-surface-400 group-hover:text-brand-500 transition-colors" />
                        <div>
                          <div className="text-xs font-bold text-surface-700 dark:text-surface-300">{res.name}</div>
                          <div className="text-[9px] text-surface-400 uppercase font-bold">{res.type}</div>
                        </div>
                      </div>
                      <ChevronRight className="w-3 h-3 text-surface-300" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-brand-600 rounded-2xl p-6 text-white shadow-lg shadow-brand-600/20">
                <h3 className="font-bold mb-2 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Deploy to Team
                </h3>
                <p className="text-xs text-brand-100 mb-6 leading-relaxed">
                  Assign this AI-generated module to specific departments or roles instantly.
                </p>
                <div className="space-y-3">
                  <button className="w-full py-2.5 bg-white text-brand-600 text-xs font-bold rounded-xl hover:bg-brand-50 transition-colors">
                    Assign to All Operators
                  </button>
                  <button className="w-full py-2.5 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-400 transition-colors border border-brand-400">
                    Select Specific Users
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="h-96 flex flex-col items-center justify-center text-center bg-white dark:bg-surface-900 rounded-2xl border-2 border-dashed border-surface-200 dark:border-surface-800 p-12"
          >
            <div className="w-20 h-20 rounded-3xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center mb-6">
              <GraduationCap className="w-10 h-10 text-violet-300" />
            </div>
            <h3 className="text-xl font-bold text-surface-900 dark:text-white mb-2">Training Content Generator</h3>
            <p className="text-surface-500 max-w-md mb-8">
              Enter a safety topic above to generate a complete training module with lessons, quizzes, and resources.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              {['LOTO', 'Fall Protection', 'Heat Stress', 'Confined Space'].map(tag => (
                <span key={tag} className="px-3 py-1 bg-surface-100 dark:bg-surface-800 rounded-full text-[10px] font-bold text-surface-500 uppercase tracking-wider">
                  {tag}
                </span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
