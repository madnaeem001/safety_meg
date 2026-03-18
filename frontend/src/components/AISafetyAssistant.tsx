import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
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
  Eye,
  FileText
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

// ── Lightweight markdown renderer ──
function renderInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**'))
      return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
    if (part.startsWith('*') && part.endsWith('*'))
      return <em key={i}>{part.slice(1, -1)}</em>;
    if (part.startsWith('`') && part.endsWith('`'))
      return <code key={i} className="bg-surface-raised px-1 py-0.5 rounded text-xs font-mono text-accent">{part.slice(1, -1)}</code>;
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
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-accent shrink-0" />
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
              <span className="shrink-0 w-5 h-5 rounded-full bg-accent/10 text-accent text-[10px] font-bold flex items-center justify-center mt-0.5">{i + 1}</span>
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
      elements.push(<h3 key={k} className="font-bold text-sm mt-3 mb-0.5 text-text-primary">{renderInline(trimmed.replace(/^### /, ''))}</h3>);
    } else if (/^## (.+)/.test(trimmed)) {
      flushList();
      elements.push(<h2 key={k} className="font-bold text-base mt-3 mb-1 text-text-primary">{renderInline(trimmed.replace(/^## /, ''))}</h2>);
    } else if (/^# (.+)/.test(trimmed)) {
      flushList();
      elements.push(<h1 key={k} className="font-bold text-lg mt-3 mb-1 text-text-primary">{renderInline(trimmed.replace(/^# /, ''))}</h1>);
    } else if (/^[-*•]\s+(.+)/.test(trimmed)) {
      flushList();
      listItems.push(trimmed.replace(/^[-*•]\s+/, ''));
    } else if (/^\d+[.)]\s+(.+)/.test(trimmed)) {
      flushList();
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
];

// LOGIC FIX: Default fresh state banaya taake close karne par yehi wapis load ho
const INITIAL_MESSAGES: Message[] = [
  {
    id: '1',
    role: 'assistant',
    content: "Hello! I'm your SafetyMEG AI Assistant. How can I help you stay safe today?",
    timestamp: new Date(),
    suggestions: ['Identify Hazards', 'Report Incident', 'PPE Requirements']
  }
];

export const AISafetyAssistant: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  
  const [inputValue, setInputValue] = useState('');
  const [baseInput, setBaseInput] = useState(''); 
  
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
    isSupported: isVoiceSupported,
    transcript 
  } = useVoiceRecognition();

  // REAL-TIME VOICE LOGIC
  useEffect(() => {
    if (isListening) {
      const space = baseInput && transcript ? ' ' : '';
      setInputValue(baseInput + space + transcript);
    }
  }, [transcript, isListening]);

  // Handle voice toggle
  const toggleVoice = () => {
    if (isListening) {
      stopListening();
    } else {
      setBaseInput(inputValue); 
      startListening(); 
    }
  };

  // LOGIC FIX: Close function jo sab kuch reset kar dega
  const handleClose = () => {
    setIsOpen(false);
    setIsMinimized(false);
    setMessages(INITIAL_MESSAGES); // Clear chat history
    setInputValue('');
    setBaseInput('');
    if (isListening) stopListening(); // Turn off mic if active
    aiService.resetConversation(); // Clear backend/service context
  };

  const handleImageAnalysis = async (file: File) => {
    setIsAnalyzingImage(true);
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: `Analyzing image: ${file.name}`,
      timestamp: new Date(),
      attachments: [URL.createObjectURL(file)]
    };
    setMessages(prev => [...prev, userMessage]);

    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: `I've analyzed the photo. Here are the detected hazards:

**1. Trip Hazard** ⚠️
Unsecured cables across the walkway in the foreground.

**2. PPE Non-Compliance** 🦺
Worker in background is not wearing a high-visibility vest.

**3. Fire Safety** 🔥
Fire extinguisher is partially blocked by storage crates.`,
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
    if (isOpen && !isMinimized) scrollToBottom();
  }, [messages, isOpen, isMinimized, scrollToBottom]);

  const handleSend = async (content: string = inputValue) => {
    if (!content.trim()) return;

    if (isListening) stopListening();

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setBaseInput(''); 
    setIsTyping(true);

    const assistantId = (Date.now() + 1).toString();
    let streamedText = '';
    let placeholderAdded = false;

    await aiService.chatStream(
      content,
      (chunk) => {
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
          prev.map(m => m.id === assistantId ? { ...m, content: streamedText } : m)
        );
      },
      (suggestions) => {
        setIsTyping(false);
        setMessages(prev =>
          prev.map(m => m.id === assistantId ? { ...m, content: streamedText, suggestions: suggestions.length > 0 ? suggestions : undefined } : m)
        );
      }
    );
  };

  return createPortal(
    <div className="z-[999999] relative">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            aria-label="Open AI assistant"
            className="fixed bottom-24 right-6 w-14 h-14 rounded-[1.75rem] flex items-center justify-center transition-all duration-300 hover:brightness-110"
            style={{ backgroundColor: '#00A89D', color: '#ffffff', border: '1px solid rgba(0,168,157,0.3)', boxShadow: '0 0 0 4px rgba(0,168,157,0.18), 0 8px 32px rgba(0,168,157,0.55)' }}
          >
            <Bot className="w-7 h-7 relative z-10" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
            animate={{ 
              opacity: 1, y: 0, scale: 1, x: 0,
              height: isMinimized ? '64px' : '520px',
              width: isMinimized ? '300px' : '400px'
            }}
            exit={{ opacity: 0, y: 100, scale: 0.9, x: 20 }}
            className="fixed bottom-24 right-6 bg-surface-overlay border border-surface-border rounded-3xl shadow-modal overflow-hidden flex flex-col max-w-[calc(100vw-48px)]"
          >
            {/* Header */}
            <div className="p-4 bg-surface-raised border-b border-surface-border flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/10 backdrop-blur-md flex items-center justify-center border border-accent/20 overflow-hidden">
                  <img src="/logo.png" alt="SafetyMEG" className="w-8 h-8 object-contain" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-text-primary">SafetyMEG AI</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] text-text-muted font-medium uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => setIsMuted(!isMuted)} className="p-2 hover:bg-surface-overlay rounded-lg text-text-muted transition-colors" title={isMuted ? "Unmute" : "Mute"}>
                  {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-surface-overlay rounded-lg text-text-muted transition-colors" title={isMinimized ? "Expand" : "Minimize"}>
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </button>
                <button onClick={handleClose} className="p-2 hover:bg-surface-overlay rounded-lg text-text-muted transition-colors" title="Close & Reset">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-surface-sunken">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-accent' : 'bg-surface-raised border border-surface-border'}`}>
                          {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-accent" />}
                        </div>
                        <div className="space-y-2">
                            <div className={`p-3 rounded-2xl text-sm leading-relaxed relative ${msg.role === 'user' ? 'bg-accent text-white rounded-tr-none shadow-lg' : 'bg-surface-raised text-text-primary rounded-tl-none border border-surface-border'}`}>
                            {msg.attachments && msg.attachments.map((url, i) => (
                              <div key={i} className="mb-3 rounded-xl overflow-hidden border border-white/10 shadow-inner relative">
                                <img src={url} alt="Attachment" className="w-full h-auto max-h-48 object-cover" />
                              </div>
                            ))}
                            {msg.isLoading && msg.content === '' ? null : renderMarkdown(msg.content)}
                          </div>
                          
                          {msg.suggestions && (
                            <div className="flex flex-wrap gap-2">
                              {msg.suggestions.map((s) => (
                                <button key={s} onClick={() => handleSend(s)} className="text-[10px] font-bold text-accent bg-accent/10 hover:bg-accent/20 px-2.5 py-1 rounded-full border border-accent/20 transition-all">
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
                        <div className="w-8 h-8 rounded-lg bg-surface-raised border border-surface-border flex items-center justify-center"><Bot className="w-4 h-4 text-accent" /></div>
                        <div className="bg-surface-raised border border-surface-border p-3 rounded-2xl flex gap-1">
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                          <motion.div animate={{ opacity: [0.4, 1, 0.4] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-accent" />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="p-4 bg-surface-raised border-t border-surface-border">
                  <div className="relative flex items-end gap-2">
                    <div className="flex-1 bg-surface-overlay border border-surface-border rounded-2xl overflow-hidden focus-within:border-accent/50 transition-colors">
                      <textarea
                        rows={1}
                        value={inputValue}
                        onChange={(e) => {
                          setInputValue(e.target.value);
                          if (!isListening) setBaseInput(e.target.value); 
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend();
                          }
                        }}
                        placeholder={isListening ? "Listening..." : "Ask anything about safety..."}
                        className={`w-full bg-transparent p-3 text-sm text-text-primary placeholder-text-muted outline-none resize-none max-h-32 ${isListening ? 'text-accent animate-pulse' : ''}`}
                      />
                      <div className="px-3 pb-2 flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-surface-raised rounded-lg text-text-muted hover:text-accent transition-colors">
                            <Paperclip className="w-4 h-4" />
                          </button>
                          <button onClick={() => fileInputRef.current?.click()} className="p-1.5 hover:bg-surface-raised rounded-lg text-text-muted hover:text-accent transition-colors">
                            <Camera className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={toggleVoice}
                            disabled={!isVoiceSupported}
                            className={`p-1.5 rounded-lg transition-colors ${isListening ? 'bg-red-500/20 text-red-400' : 'hover:bg-surface-raised text-text-muted hover:text-accent'} ${!isVoiceSupported ? 'opacity-30 cursor-not-allowed' : ''}`}
                          >
                            {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                          </button>
                          <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
                        </div>
                        <div className="text-[10px] text-text-muted font-medium">
                          {inputValue.length} chars
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSend()}
                      disabled={!inputValue.trim() || isTyping}
                      className="w-11 h-11 rounded-2xl bg-accent hover:brightness-110 disabled:bg-surface-raised disabled:text-text-muted text-white flex items-center justify-center transition-all shadow-lg shrink-0"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>,
    document.body
  );
};

export default AISafetyAssistant;