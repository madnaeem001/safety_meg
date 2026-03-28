import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Circle,
  MousePointer2,
  MessageSquare,
  Edit3,
  Eye,
  Clock,
  CheckCircle2,
  AlertCircle,
  X,
  Send,
  ChevronRight,
  Wifi,
  WifiOff,
  User,
  UserPlus,
  Settings
} from 'lucide-react';

interface Collaborator {
  id: string;
  name: string;
  avatar?: string;
  color: string;
  status: 'online' | 'away' | 'busy' | 'offline';
  activity: 'viewing' | 'editing' | 'idle';
  location?: string;
  lastSeen?: Date;
  cursorPosition?: { x: number; y: number };
}

interface ActivityEvent {
  id: string;
  userId: string;
  userName: string;
  action: 'joined' | 'left' | 'edited' | 'commented' | 'approved' | 'submitted';
  target?: string;
  timestamp: Date;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  message: string;
  timestamp: Date;
}

const mockCollaborators: Collaborator[] = [
  { id: '1', name: 'John Smith', color: '#3B82F6', status: 'online', activity: 'editing', location: 'Incident Report' },
  { id: '2', name: 'Sarah Johnson', color: '#10B981', status: 'online', activity: 'viewing', location: 'JSA Builder' },
  { id: '3', name: 'Mike Davis', color: '#F59E0B', status: 'away', activity: 'idle', location: 'Dashboard' },
  { id: '4', name: 'Emily Chen', color: '#EC4899', status: 'online', activity: 'viewing', location: 'Compliance' },
  { id: '5', name: 'Tom Wilson', color: '#8B5CF6', status: 'busy', activity: 'editing', location: 'Safety Audit' },
];

const mockActivity: ActivityEvent[] = [
  { id: '1', userId: '1', userName: 'John Smith', action: 'edited', target: 'INC-2026-028', timestamp: new Date(Date.now() - 60000) },
  { id: '2', userId: '2', userName: 'Sarah Johnson', action: 'approved', target: 'JSA-2026-015', timestamp: new Date(Date.now() - 120000) },
  { id: '3', userId: '4', userName: 'Emily Chen', action: 'commented', target: 'Compliance Item #45', timestamp: new Date(Date.now() - 300000) },
  { id: '4', userId: '5', userName: 'Tom Wilson', action: 'submitted', target: 'Safety Audit Q1', timestamp: new Date(Date.now() - 600000) },
  { id: '5', userId: '3', userName: 'Mike Davis', action: 'joined', timestamp: new Date(Date.now() - 900000) },
];

interface CollaborationPanelProps {
  currentUser?: { id: string; name: string };
  documentId?: string;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({ 
  currentUser = { id: 'current', name: 'You' },
  documentId 
}) => {
  const [collaborators, setCollaborators] = useState<Collaborator[]>(mockCollaborators);
  const [activity, setActivity] = useState<ActivityEvent[]>(mockActivity);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'activity' | 'chat'>('people');
  const [showCursors, setShowCursors] = useState(true);
  const [isConnected, setIsConnected] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update random collaborator activity
      setCollaborators(prev => prev.map(c => ({
        ...c,
        cursorPosition: c.status === 'online' && Math.random() > 0.7
          ? { x: Math.random() * 100, y: Math.random() * 100 }
          : c.cursorPosition
      })));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const sendMessage = () => {
    if (!newMessage.trim()) return;
    
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userColor: '#14B8A6',
      message: newMessage.trim(),
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, message]);
    setNewMessage('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-emerald-500';
      case 'away': return 'bg-amber-500';
      case 'busy': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getActivityIcon = (action: string) => {
    switch (action) {
      case 'joined': return <UserPlus className="w-4 h-4" />;
      case 'left': return <User className="w-4 h-4" />;
      case 'edited': return <Edit3 className="w-4 h-4" />;
      case 'commented': return <MessageSquare className="w-4 h-4" />;
      case 'approved': return <CheckCircle2 className="w-4 h-4" />;
      case 'submitted': return <Send className="w-4 h-4" />;
      default: return <Circle className="w-4 h-4" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const onlineCount = collaborators.filter(c => c.status === 'online').length;

  return (
    <div className="min-h-screen bg-surface-base p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-accent p-2 shadow-soft">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-text-primary">Real-Time Collaboration</h1>
                <p className="text-sm text-text-secondary">{onlineCount} team members online</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                isConnected ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-red-200 bg-red-50 text-red-700'
              }`}>
                {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
                <span className="text-sm font-medium">{isConnected ? 'Connected' : 'Disconnected'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-xl border border-surface-border bg-surface-raised p-1">
          {[
            { id: 'people', label: 'Team', icon: <Users className="w-4 h-4" />, badge: onlineCount },
            { id: 'activity', label: 'Activity', icon: <Clock className="w-4 h-4" /> },
            { id: 'chat', label: 'Chat', icon: <MessageSquare className="w-4 h-4" />, badge: messages.length > 0 ? messages.length : undefined }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-accent text-text-onAccent'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-overlay'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.badge && (
                <span className={`px-1.5 py-0.5 text-xs rounded-full ${
                  activeTab === tab.id ? 'bg-white/20' : 'bg-accent text-text-onAccent'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'people' && (
            <motion.div
              key="people"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Cursor Toggle */}
              <div className="flex items-center justify-between rounded-xl border border-surface-border bg-surface-raised p-4 shadow-soft">
                <div className="flex items-center gap-3">
                  <MousePointer2 className="w-5 h-5 text-accent" />
                  <div>
                    <p className="font-medium text-text-primary">Show Live Cursors</p>
                    <p className="text-sm text-text-secondary">See where others are working</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCursors(!showCursors)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    showCursors ? 'bg-accent' : 'bg-surface-border'
                  }`}
                >
                  <motion.div
                    animate={{ x: showCursors ? 24 : 2 }}
                    className="absolute top-1 w-4 h-4 bg-white rounded-full"
                  />
                </button>
              </div>

              {/* Collaborators List */}
              <div className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-raised shadow-soft">
                {collaborators.map((collaborator, index) => (
                  <motion.div
                    key={collaborator.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                          style={{ backgroundColor: collaborator.color }}
                        >
                          {collaborator.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-surface-raised ${getStatusColor(collaborator.status)}`} />
                      </div>
                      <div>
                        <p className="font-medium text-text-primary">{collaborator.name}</p>
                        <div className="flex items-center gap-2 text-sm">
                          <span className={`${
                            collaborator.activity === 'editing' ? 'text-emerald-400' :
                            collaborator.activity === 'viewing' ? 'text-sky-600' :
                            'text-text-muted'
                          }`}>
                            {collaborator.activity === 'editing' ? (
                              <><Edit3 className="w-3 h-3 inline mr-1" />Editing</>
                            ) : collaborator.activity === 'viewing' ? (
                              <><Eye className="w-3 h-3 inline mr-1" />Viewing</>
                            ) : 'Idle'}
                          </span>
                          {collaborator.location && (
                            <span className="text-text-muted">• {collaborator.location}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      collaborator.status === 'online' ? 'bg-emerald-50 text-emerald-700' :
                      collaborator.status === 'away' ? 'bg-amber-50 text-amber-700' :
                      collaborator.status === 'busy' ? 'bg-red-50 text-red-700' :
                      'bg-slate-100 text-slate-700'
                    }`}>
                      {collaborator.status}
                    </span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'activity' && (
            <motion.div
              key="activity"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="divide-y divide-surface-border rounded-xl border border-surface-border bg-surface-raised shadow-soft"
            >
              {activity.map((event, index) => {
                const collaborator = collaborators.find(c => c.id === event.userId);
                return (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 flex items-start gap-3"
                  >
                    <div 
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                      style={{ backgroundColor: collaborator?.color || '#64748B' }}
                    >
                      {event.userName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <p className="text-text-primary">
                        <span className="font-medium">{event.userName}</span>
                        <span className="text-text-secondary"> {event.action} </span>
                        {event.target && <span className="text-accent">{event.target}</span>}
                      </p>
                      <p className="mt-1 text-xs text-text-muted">{formatTime(event.timestamp)}</p>
                    </div>
                    <div className="rounded-lg bg-surface-overlay p-2 text-text-secondary">
                      {getActivityIcon(event.action)}
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}

          {activeTab === 'chat' && (
            <motion.div
              key="chat"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="overflow-hidden rounded-xl border border-surface-border bg-surface-raised shadow-soft"
            >
              {/* Messages */}
              <div className="h-96 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-text-secondary">
                    <div className="text-center">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No messages yet</p>
                      <p className="text-sm text-text-muted">Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-3 ${msg.userId === currentUser.id ? 'flex-row-reverse' : ''}`}
                    >
                      <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm flex-shrink-0"
                        style={{ backgroundColor: msg.userColor }}
                      >
                        {msg.userName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div className={`max-w-xs ${msg.userId === currentUser.id ? 'text-right' : ''}`}>
                        <p className="mb-1 text-xs text-text-muted">{msg.userName}</p>
                        <div className={`px-4 py-2 rounded-2xl ${
                          msg.userId === currentUser.id
                            ? 'bg-accent text-text-onAccent rounded-tr-none'
                            : 'bg-surface-overlay text-text-primary rounded-tl-none'
                        }`}>
                          {msg.message}
                        </div>
                        <p className="mt-1 text-xs text-text-muted">{formatTime(msg.timestamp)}</p>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>

              {/* Input */}
              <div className="border-t border-surface-border p-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-surface-border bg-surface-base px-4 py-2.5 text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!newMessage.trim()}
                    className="rounded-xl bg-accent px-4 py-2.5 text-text-onAccent transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:bg-surface-border disabled:text-text-muted"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CollaborationPanel;
