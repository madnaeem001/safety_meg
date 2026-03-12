import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, Bug, Lightbulb, Star, Send, CheckCircle2 } from 'lucide-react';

type FeedbackType = 'bug' | 'feature' | 'feedback';

const typeConfig = {
  bug: { icon: Bug, label: 'Report Bug', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  feature: { icon: Lightbulb, label: 'Feature Request', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  feedback: { icon: Star, label: 'General Feedback', color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/30' },
};

export const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('feedback');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);

  const handleSubmit = () => {
    if (!message.trim()) return;
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setIsOpen(false);
      setMessage('');
      setRating(0);
    }, 2000);
  };

  // Hide widget if sidebar menu is open
  const isMenuOpen = typeof window !== 'undefined' && document.querySelector('.nav-dropdown') !== null;
  return (
    <>
      {/* Floating Button */}
      {!isMenuOpen && (
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-44 right-6 z-[10] w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-purple-500 text-white shadow-lg shadow-cyan-500/25 flex items-center justify-center hover:shadow-cyan-500/40 transition-shadow"
        >
          <MessageSquare className="w-5 h-5" />
        </motion.button>
      )}

      {/* Feedback Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="fixed bottom-44 right-6 z-[60] w-[340px] max-h-[480px] rounded-2xl bg-slate-900/95 backdrop-blur-xl border border-cyan-500/20 shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Send Feedback</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-1 rounded-lg hover:bg-slate-800 transition-colors">
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-8 flex flex-col items-center gap-3"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center">
                    <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                  </div>
                  <p className="text-sm font-bold text-white">Thank you!</p>
                  <p className="text-xs text-slate-400 text-center">Your feedback has been submitted. We'll review it shortly.</p>
                </motion.div>
              ) : (
                <div className="p-4 space-y-4">
                  {/* Type Selector */}
                  <div className="flex gap-2">
                    {(Object.keys(typeConfig) as FeedbackType[]).map(type => {
                      const tc = typeConfig[type];
                      return (
                        <button
                          key={type}
                          onClick={() => setFeedbackType(type)}
                          className={`flex-1 py-2 px-2 rounded-xl text-[10px] font-bold flex flex-col items-center gap-1.5 transition-all ${
                            feedbackType === type
                              ? `${tc.bg} ${tc.color} ${tc.border} border`
                              : 'text-slate-500 border border-slate-700/30 hover:border-slate-600'
                          }`}
                        >
                          <tc.icon className="w-4 h-4" />
                          {tc.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Rating */}
                  {feedbackType === 'feedback' && (
                    <div>
                      <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">How's your experience?</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`p-1.5 rounded-lg transition-all ${star <= rating ? 'text-amber-400' : 'text-slate-700 hover:text-slate-500'}`}
                          >
                            <Star className="w-5 h-5" fill={star <= rating ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="block text-[10px] text-slate-500 uppercase tracking-wider font-bold mb-2">
                      {feedbackType === 'bug' ? 'Describe the bug' : feedbackType === 'feature' ? 'Describe your idea' : 'Your feedback'}
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={feedbackType === 'bug' ? 'What happened? Steps to reproduce...' : feedbackType === 'feature' ? 'I would love to see...' : 'Tell us what you think...'}
                      className="w-full h-24 px-3 py-2.5 bg-slate-800/60 border border-slate-700/30 rounded-xl text-xs text-white placeholder-slate-600 focus:border-cyan-500/40 focus:outline-none resize-none transition-colors"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-xs font-bold rounded-xl hover:from-cyan-400 hover:to-purple-400 transition-all flex items-center justify-center gap-2 disabled:opacity-30"
                  >
                    <Send className="w-3.5 h-3.5" /> Submit Feedback
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default FeedbackWidget;
