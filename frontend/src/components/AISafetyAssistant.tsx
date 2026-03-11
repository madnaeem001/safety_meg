import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVoiceRecognition } from '../hooks/useVoiceRecognition';
import { aiService } from '../services/aiService';
import { 
  MessageSquare, 
  X, 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Mic, 
  MicOff,
  Image as ImageIcon, 
  MoreHorizontal,
  ThumbsUp,
  ThumbsDown,
  RefreshCw,
  Shield,
  AlertTriangle,
  Zap,
  Brain,
  Search,
  ChevronDown,
  Paperclip,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Camera,
  History,
  Settings,
  Terminal,
  Eye
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  isLoading?: boolean;
  suggestions?: string[];
  attachments?: string[];
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ElementType;
  prompt: string;
  color: string;
}

// ── Lightweight markdown renderer (handles headings, bold, italic, lists) ──
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-surface-700 px-1 py-0.5 rounded text-xs font-mono">{part.slice(1, -1)}</code>;
    return part;
  });
}

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let orderedItems: string[] = [];
  let listKey = 0;

  const flushList = () => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`ul-${listKey++}`} className="list-none space-y-1 my-1.5">
          {listItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-brand-400 shrink-0" />
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
    if (orderedItems.length > 0) {
      elements.push(
        <ol key={`ol-${listKey++}`} className="space-y-1 my-1.5">
          {orderedItems.map((item, i) => (
            <li key={i} className="flex items-start gap-2 text-sm leading-relaxed">
              <span className="shrink-0 w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      orderedItems = [];
    }
  };

  lines.forEach((line, idx) => {
    const k = idx;
    const trimmed = line.trim();
    if (/^### (.+)/.test(trimmed)) {
      flushList();
      elements.push(<h3 key={k} className="font-bold text-sm mt-3 mb-0.5 text-surface-100">{renderInline(trimmed.replace(/^### /, ''))}</h3>);
    } else if (/^## (.+)/.test(trimmed)) {
      flushList();
      elements.push(<h2 key={k} className="font-bold text-base mt-3 mb-1 text-surface-100">{renderInline(trimmed.replace(/^## /, ''))}</h2>);
    } else if (/^# (.+)/.test(trimmed)) {
      flushList();
      elements.push(<h1 key={k} className="font-bold text-lg mt-3 mb-1 text-surface-100">{renderInline(trimmed.replace(/^# /, ''))}</h1>);
    } else if (/^[-*•]\s+(.+)/.test(trimmed)) {
      // flush ordered if switching list type
      if (orderedItems.length > 0) flushList();
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
    } else if (/^\d+[.)]\s+(.+)/.test(trimmed)) {
      // flush unordered if switching list type
      if (listItems.length > 0) flushList();
      orderedItems.push(trimmed.replace(/^\d+[.)]\s+/, ''));
    } else if (trimmed === '') {
      flushList();
    } else {
      flushList();
      elements.push(<p key={k} className="text-sm leading-relaxed">{renderInline(line)}</p>);
    }
  });

  flushList();
  return <>{elements}</>;
}

const quickActions: QuickAction[] = [
  { id: 'hazard', label: 'Identify Hazards', icon: AlertTriangle, prompt: 'What are common workplace hazards I should watch for?', color: 'text-amber-400 bg-amber-400/10' },
  { id: 'incident', label: 'Report Incident', icon: FileText, prompt: 'Help me document a workplace incident', color: 'text-blue-400 bg-blue-400/10' },
  { id: 'ppe', label: 'PPE Requirements', icon: Shield, prompt: 'What PPE is required for this task?', color: 'text-emerald-400 bg-emerald-400/10' },
  { id: 'emergency', label: 'Emergency Procedure', icon: Zap, prompt: 'What are the emergency procedures for this situation?', color: 'text-red-400 bg-red-400/10' },
  { id: 'training', label: 'Training Help', icon: Brain, prompt: 'What training is required for new employees?', color: 'text-violet-400 bg-violet-400/10' },
  { id: 'compliance', label: 'Compliance Check', icon: Search, prompt: 'Help me verify regulatory compliance', color: 'text-cyan-400 bg-cyan-400/10' },
];

function FileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <line x1="10" y1="9" x2="8" y2="9" />
    </svg>
  );
}

// Simulated AI responses based on context
// Moved to aiService.ts

export const AISafetyAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hello! I'm your SafetyMEG AI Assistant. How can I help you stay safe today?",
      timestamp: new Date(),
      suggestions: ['Identify Hazards', 'Report Incident', 'PPE Requirements']
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAnalyzingImage, setIsAnalyzingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Recognition Integration
  const { 
    isListening, 
    startListening, 
    stopListening, 
    isSupported: isVoiceSupported 
  } = useVoiceRecognition({
    onResult: (text, isFinal) => {
      if (isFinal) {
        setInputValue(prev => prev + ' ' + text);
      }
    }
  });

  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleImageAnalysis = async (file: File) => {
    setIsAnalyzingImage(true);
    
    // Add user message with image
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Analyzing image: ${file.name}`,
      timestamp: new Date(),
      attachments: [URL.createObjectURL(file)]
    };
    setMessages(prev => [...prev, userMessage]);

    // Simulate AI Image Hazard Detection
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `I've analyzed the photo. Here are the detected hazards:

**1. Trip Hazard** ⚠️
Unsecured cables across the walkway in the foreground.
*Recommendation: Use cable ramps or tape down.*

**2. PPE Non-Compliance** 🦺
Worker in background is not wearing a high-visibility vest.
*Recommendation: Ensure all personnel in Zone 4 wear Class 2 vests.*

**3. Fire Safety** 🔥
Fire extinguisher is partially blocked by storage crates.
*Recommendation: Maintain 36-inch clear space around all fire equipment.*

Would you like me to log these as formal observations?`,
      timestamp: new Date(),
      suggestions: ['Log Observations', 'Notify Supervisor', 'Create CAPA']
    };
    
    setMessages(prev => [...prev, assistantMessage]);
    setIsAnalyzingImage(false);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageAnalysis(file);
  };

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isOpen, scrollToBottom]);

  const handleSend = async (content: string = inputValue) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true); // show typing dots while waiting for first chunk

    const assistantId = (Date.now() + 1).toString();
    let streamedText = '';
    let placeholderAdded = false;

    await aiService.chatStream(
      content,
      (chunk) => {
        // On first chunk: hide typing dots, insert the streaming bubble
        if (!placeholderAdded) {
          placeholderAdded = true;
          setIsTyping(false);
          setMessages(prev => [...prev, {
            id: assistantId,
            role: 'assistant',
            content: '',
            timestamp: new Date(),
          }]);
        }

        if (chunk.startsWith('__TRIM__')) {
          const trailer = chunk.slice('__TRIM__'.length);
          streamedText = streamedText.slice(0, streamedText.length - trailer.length);
        } else {
          streamedText += chunk;
        }
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: streamedText }
              : m
          )
        );
      },
      (suggestions) => {
        setIsTyping(false);
        setMessages(prev =>
          prev.map(m =>
            m.id === assistantId
              ? { ...m, content: streamedText, suggestions: suggestions.length > 0 ? suggestions : undefined }
              : m
          )
        );
      }
    );
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-24 right-6 z-50 w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-violet-600 text-white shadow-2xl shadow-brand-500/40 flex items-center justify-center group"
          >
            <div className="absolute inset-0 rounded-2xl bg-white/20 animate-ping group-hover:hidden" />
            <Bot className="w-7 h-7 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
            animate={{ 
              opacity: 1, 
              y: 0, 
              scale: 1, 
              x: 0,
              height: isMinimized ? '64px' : '600px',
              width: isMinimized ? '300px' : '400px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
            className="fixed bottom-24 right-6 z-50 bg-surface-900 border border-surface-700/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-w-[calc(100vw-48px)]"
          >
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-brand-600 to-violet-700 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 overflow-hidden">
                  <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">SafetyMEG AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-[10px] text-white/70 font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
                >
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button 
                  onClick={() => { setIsOpen(false); aiService.resetConversation(); }}
                  className="p-2 hover:bg-white/10 rounded-lg text-white/80 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface-950/50">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                          msg.role === 'user' ? 'bg-brand-600' : 'bg-surface-800 border border-surface-700'
                        }`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-brand-400" />}
                        </div>
                        <div className="space-y-2">
                          <div className={`p-3 rounded-2xl text-sm leading-relaxed relative ${
                            msg.role === 'user' 
                              ? 'bg-brand-600 text-white rounded-tr-none shadow-lg shadow-brand-600/10' 
                              : 'bg-surface-800 text-surface-200 rounded-tl-none border border-surface-700/50'
                          }`}>
                            {msg.attachments && msg.attachments.map((url, i) => (
                              <div key={i} className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-inner relative">
                                <img src={url} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                                {isAnalyzingImage && msg.id === messages[messages.length - 1].id && (
                                  <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-2">
                                    <RefreshCw className="w-6 h-6 text-white animate-spin" />
                                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">AI Analyzing...</span>
                                  </div>
                                )}
                              </div>
                            ))}
                            {msg.isLoading && msg.content === ''
                              ? null
                              : renderMarkdown(msg.content)}
                          </div>
                          
                          {msg.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestions.map((s) => (
                                <button
                                  key={s}
                                  onClick={() => handleSend(s)}
                                  className="text-[10px] font-bold text-brand-400 bg-brand-400/10 hover:bg-brand-400/20 px-2.5 py-1 rounded-full border border-brand-400/20 transition-all"
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-lg bg-surface-800 border border-surface-700 flex items-center justify-center">
                          <Bot className="w-4 h-4 text-brand-400" />
                        </div>
                        <div className="bg-surface-800 p-3 rounded-2xl rounded-tl-none border border-surface-700/50 flex gap-1">
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-brand-400" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Quick Actions */}
                {messages.length < 3 && (
                  <div className="px-4 py-3 bg-surface-900 border-t border-surface-800">
                    <p className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-3">Quick Actions</p>
                    <div className="grid grid-cols-2 gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.id}
                          onClick={() => handleSend(action.prompt)}
                          className={`flex items-center gap-2 p-2 rounded-xl border border-surface-700/50 hover:border-brand-500/30 transition-all group ${action.color}`}
                        >
                          <action.icon className="w-3.5 h-3.5" />
                          <span className="text-[10px] font-bold truncate">{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Input Area */}
                <div className="p-4 bg-surface-900 border-t border-surface-800">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1 bg-surface-800 border border-surface-700 rounded-2xl overflow-hidden focus-within:border-brand-500/50 transition-colors">
                      <textarea
                        rows={1}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder="Ask anything about safety..."
                        className="w-full bg-transparent p-3 text-sm text-white placeholder-surface-500 outline-none resize-none max-h-32"
                      />
                      <div className="px-3 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-500 hover:text-brand-400 transition-colors"
                            title="Attach File"
                          >
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="p-1.5 hover:bg-surface-700 rounded-lg text-surface-500 hover:text-brand-400 transition-colors"
                            title="Capture Photo"
                          >
                            <Camera className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={toggleVoice}
                            disabled={!isVoiceSupported}
                            className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'hover:bg-surface-700 text-surface-500 hover:text-brand-400'} ${!isVoiceSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
                            title={isListening ? 'Stop Listening' : 'Start Voice Input'}
                          >
                            {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                          </button>
                          <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={onFileChange} 
                            accept="image/*" 
                            className="hidden" 
                          />
                        </div>
                        <div className="text-[10px] text-surface-600 font-medium">
                          {inputValue.length} chars
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || isTyping}
                      className="w-11 h-11 rounded-2xl bg-brand-600 hover:bg-brand-500 disabled:bg-surface-800 disabled:text-surface-600 text-white flex items-center justify-center transition-all shadow-lg shadow-brand-600/20 shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                  <p className="text-[9px] text-center text-surface-600 mt-3">
                    SafetyMEG AI can make mistakes. Verify critical safety information.
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default AISafetyAssistant;
