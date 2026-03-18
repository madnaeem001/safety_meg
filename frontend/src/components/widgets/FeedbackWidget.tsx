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

  return (
    <>
      {/* Floating Button */}
      {!isOpen && (
        <motion.button
          whileHover={{ scale: 1.06, y: -2 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsOpen(true)}
          className="fixed bottom-40 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-[1.75rem] border border-accent/30 bg-accent text-white transition-all duration-300 hover:brightness-110"
          style={{ boxShadow: '0 0 0 4px color-mix(in srgb, var(--accent) 18%, transparent), 0 8px 32px color-mix(in srgb, var(--accent) 55%, transparent)' }}
          aria-label="Open feedback widget"
        >
          <MessageSquare className="w-6 h-6" />
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
              className="fixed bottom-40 right-5 z-[60] w-[340px] max-h-[480px] overflow-hidden rounded-2xl border border-surface-border bg-surface-overlay shadow-modal backdrop-blur-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-surface-border bg-surface-raised p-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <MessageSquare className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-text-primary">Send Feedback</span>
                </div>
                <button onClick={() => setIsOpen(false)} className="rounded-lg p-1 transition-colors hover:bg-surface-overlay">
                  <X className="w-4 h-4 text-text-muted" />
                </button>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex flex-col items-center gap-3 p-8"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10 text-success">
                    <CheckCircle2 className="w-7 h-7" />
                  </div>
                  <p className="text-sm font-bold text-text-primary">Thank you!</p>
                  <p className="text-center text-xs text-text-muted">Your feedback has been submitted. We'll review it shortly.</p>
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
                              : 'border border-surface-border text-text-secondary hover:border-accent/30 hover:bg-surface-raised'
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
                      <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">How's your experience?</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => setRating(star)}
                            className={`rounded-lg p-1.5 transition-all ${star <= rating ? 'text-warning' : 'text-text-muted hover:text-text-secondary'}`}
                          >
                            <Star className="w-5 h-5" fill={star <= rating ? 'currentColor' : 'none'} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message */}
                  <div>
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-text-muted">
                      {feedbackType === 'bug' ? 'Describe the bug' : feedbackType === 'feature' ? 'Describe your idea' : 'Your feedback'}
                    </label>
                    <textarea
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder={feedbackType === 'bug' ? 'What happened? Steps to reproduce...' : feedbackType === 'feature' ? 'I would love to see...' : 'Tell us what you think...'}
                      className="h-24 w-full resize-none rounded-xl border border-surface-border bg-surface-raised px-3 py-2.5 text-xs text-text-primary transition-colors placeholder:text-text-muted focus:border-accent/40 focus:outline-none"
                    />
                  </div>

                  {/* Submit */}
                  <button
                    onClick={handleSubmit}
                    disabled={!message.trim()}
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-2.5 text-xs font-bold text-white transition-all hover:bg-accent-600 disabled:opacity-30"
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
