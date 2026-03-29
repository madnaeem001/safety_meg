import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ThumbsUp, ThumbsDown, Lightbulb, Plus, Edit2, Trash2, 
  ChevronDown, ChevronUp, MessageSquare, Star, TrendingUp,
  Users, Calendar, Clock, CheckCircle, AlertCircle, Heart, Zap
} from 'lucide-react';
import { Sprint } from '../../data/mockProjectManagement';
import { SprintRecord } from '../../api/services/apiService';
import {
  useProjectSprints,
  useSprintRetro,
  useAddRetroItem,
  useVoteRetroItem,
  useUpdateRetroItem,
  useDeleteRetroItem,
  useVoteRetroSentiment,
} from '../../api/hooks/useAPIHooks';

// Retrospective types
export type RetroCategory = 'went_well' | 'needs_improvement' | 'action_items';
export type SentimentType = 'happy' | 'neutral' | 'sad';

export interface RetroItem {
  id: string;
  category: RetroCategory;
  content: string;
  author: string;
  votes: number;
  timestamp: string;
  isActionable?: boolean;
  assignee?: string;
  dueDate?: string;
  status?: 'pending' | 'in_progress' | 'completed';
}

export interface SprintRetro {
  sprintId: string;
  teamSentiment: { happy: number; neutral: number; sad: number };
  items: RetroItem[];
  summary?: string;
  facilitator: string;
  date: string;
  participants: string[];
}

// Mock retrospective data removed — replaced by API (retroApiService / useSprintRetro)

interface SprintRetrospectivesProps {
  sprints?: Sprint[];
}

export function SprintRetrospectives(_props: SprintRetrospectivesProps) {
  // Sprint data from API
  const { data: sprintsData, loading: sprintsLoading } = useProjectSprints();

  const sprints: Sprint[] = useMemo(
    () =>
      (sprintsData ?? []).map((s: SprintRecord) => ({
        id: String(s.id),
        name: s.name,
        startDate: s.startDate ?? '',
        endDate: s.endDate ?? '',
        goal: s.goal ?? '',
        status: s.status,
      })),
    [sprintsData]
  );

  const completedSprints = sprints.filter(s => s.status === 'completed' || s.status === 'active');
  const [selectedSprintId, setSelectedSprintId] = useState<string>('');
  const [newItemContent, setNewItemContent] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<RetroCategory>('went_well');
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState<RetroCategory | null>('went_well');
  const [userSentiment, setUserSentiment] = useState<SentimentType | null>(null);
  const [showActionItems, setShowActionItems] = useState(false);

  // Set default sprint after sprints load
  useEffect(() => {
    if (completedSprints.length > 0 && !selectedSprintId) {
      setSelectedSprintId(completedSprints[0].id);
    }
  }, [completedSprints, selectedSprintId]);

  // Retro data from API (auto-creates on first access)
  const { data: retroData, refetch: refetchRetro } = useSprintRetro(selectedSprintId || null);
  const addRetroItem = useAddRetroItem();
  const voteItem = useVoteRetroItem();
  const updateItem = useUpdateRetroItem();
  const deleteItem = useDeleteRetroItem();
  const voteSentiment = useVoteRetroSentiment();

  // Map API data to local SprintRetro shape used in JSX
  const currentRetro: SprintRetro = useMemo(() => {
    if (retroData) {
      return {
        sprintId: retroData.sprintId,
        teamSentiment: retroData.teamSentiment,
        items: retroData.items.map(i => ({
          id: String(i.id),
          category: i.category,
          content: i.content,
          author: i.author,
          votes: i.votes,
          timestamp: String(i.createdAt ?? ''),
          isActionable: i.isActionable,
          assignee: i.assignee,
          dueDate: i.dueDate,
          status: i.status,
        })),
        facilitator: retroData.facilitator,
        date: retroData.date,
        participants: retroData.participants,
        summary: retroData.summary,
      };
    }
    return {
      sprintId: selectedSprintId,
      teamSentiment: { happy: 0, neutral: 0, sad: 0 },
      items: [],
      facilitator: 'You',
      date: new Date().toISOString().split('T')[0],
      participants: [],
    };
  }, [retroData, selectedSprintId]);

  const selectedSprint = sprints.find(s => s.id === selectedSprintId);

  const itemsByCategory = useMemo(() => ({
    went_well: currentRetro.items.filter(i => i.category === 'went_well').sort((a, b) => b.votes - a.votes),
    needs_improvement: currentRetro.items.filter(i => i.category === 'needs_improvement').sort((a, b) => b.votes - a.votes),
    action_items: currentRetro.items.filter(i => i.category === 'action_items').sort((a, b) => b.votes - a.votes),
  }), [currentRetro.items]);

  const totalSentiment = currentRetro.teamSentiment.happy + currentRetro.teamSentiment.neutral + currentRetro.teamSentiment.sad;
  const sentimentPercentage = totalSentiment > 0 ? {
    happy: Math.round((currentRetro.teamSentiment.happy / totalSentiment) * 100),
    neutral: Math.round((currentRetro.teamSentiment.neutral / totalSentiment) * 100),
    sad: Math.round((currentRetro.teamSentiment.sad / totalSentiment) * 100),
  } : { happy: 0, neutral: 0, sad: 0 };

  const handleAddItem = async () => {
    if (!newItemContent.trim()) return;
    await addRetroItem.mutate({
      sprintId: selectedSprintId,
      data: {
        category: newItemCategory,
        content: newItemContent.trim(),
        author: 'You',
        votes: 0,
        isActionable: newItemCategory === 'action_items',
        status: 'pending',
      },
    });
    setNewItemContent('');
    setIsAddingItem(false);
    refetchRetro();
  };

  const handleVote = async (itemId: string) => {
    await voteItem.mutate(Number(itemId));
    refetchRetro();
  };

  const handleSentimentVote = async (sentiment: SentimentType) => {
    if (userSentiment) return;
    setUserSentiment(sentiment);
    await voteSentiment.mutate({ sprintId: selectedSprintId, sentiment });
    refetchRetro();
  };

  const handleDeleteItem = async (itemId: string) => {
    await deleteItem.mutate(Number(itemId));
    refetchRetro();
  };

  const handleUpdateActionStatus = async (itemId: string, status: 'pending' | 'in_progress' | 'completed') => {
    await updateItem.mutate({ id: Number(itemId), data: { status } });
    refetchRetro();
  };

  const categoryConfig = {
    went_well: { 
      icon: ThumbsUp, 
      label: 'What Went Well', 
      color: 'emerald',
      bgColor: 'bg-success/10',
      borderColor: 'border-success/20',
      iconColor: 'text-success'
    },
    needs_improvement: { 
      icon: ThumbsDown, 
      label: 'Needs Improvement', 
      color: 'amber',
      bgColor: 'bg-warning/10',
      borderColor: 'border-warning/20',
      iconColor: 'text-warning'
    },
    action_items: { 
      icon: Lightbulb, 
      label: 'Action Items', 
      color: 'blue',
      bgColor: 'bg-accent/10',
      borderColor: 'border-accent/20',
      iconColor: 'text-accent'
    },
  };

  const actionItemsStats = useMemo(() => {
    const items = itemsByCategory.action_items;
    return {
      total: items.length,
      completed: items.filter(i => i.status === 'completed').length,
      inProgress: items.filter(i => i.status === 'in_progress').length,
      pending: items.filter(i => i.status === 'pending').length,
    };
  }, [itemsByCategory.action_items]);

  if (sprintsLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Sprint Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/10 rounded-lg">
            <MessageSquare className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-text-primary text-text-primary">Sprint Retrospective</h2>
            <p className="text-sm text-text-muted">Reflect, learn, and improve together</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedSprintId}
            onChange={(e) => {
              setSelectedSprintId(e.target.value);
              setUserSentiment(null);
            }}
            className="px-3 py-2 text-sm border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary"
          >
            {sprints.map(sprint => (
              <option key={sprint.id} value={sprint.id}>{sprint.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowActionItems(!showActionItems)}
            className={`px-3 py-2 text-sm rounded-lg flex items-center gap-2 transition-colors ${
              showActionItems 
                ? 'bg-blue-600 text-white' 
                : 'bg-surface-sunken text-text-secondary'
            }`}
          >
            <Zap className="w-4 h-4" />
            Actions ({actionItemsStats.total})
          </button>
        </div>
      </div>

      {/* Sprint Info & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sprint Details Card */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-5 h-5 text-text-muted" />
            <span className="font-medium text-text-primary text-text-primary">{selectedSprint?.name}</span>
          </div>
          <div className="space-y-2 text-sm text-text-secondary">
            <div className="flex justify-between">
              <span>Sprint Goal:</span>
              <span className="text-text-primary text-text-primary font-medium">{selectedSprint?.goal}</span>
            </div>
            <div className="flex justify-between">
              <span>Duration:</span>
              <span>{selectedSprint?.startDate} → {selectedSprint?.endDate}</span>
            </div>
            <div className="flex justify-between">
              <span>Facilitator:</span>
              <span className="text-purple-400">{currentRetro.facilitator}</span>
            </div>
            <div className="flex items-center gap-2 mt-3">
              <Users className="w-4 h-4" />
              <span>{currentRetro.participants.length} participants</span>
            </div>
          </div>
        </div>

        {/* Team Sentiment */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-5 h-5 text-pink-500" />
            <span className="font-medium text-text-primary text-text-primary">Team Sentiment</span>
          </div>
          
          {/* Sentiment Vote Buttons */}
          <div className="flex items-center justify-center gap-3 mb-4">
            {[
              { type: 'happy' as const, emoji: '😊', label: 'Happy', color: 'emerald' },
              { type: 'neutral' as const, emoji: '😐', label: 'Neutral', color: 'gray' },
              { type: 'sad' as const, emoji: '😔', label: 'Sad', color: 'red' },
            ].map(({ type, emoji, label, color }) => (
              <button
                key={type}
                onClick={() => handleSentimentVote(type)}
                disabled={!!userSentiment}
                className={`flex flex-col items-center p-3 rounded-lg transition-all ${
                  userSentiment === type 
                    ? `bg-${color}-100  ring-2 ring-${color}-500` 
                    : userSentiment 
                      ? 'opacity-50 cursor-not-allowed bg-surface-sunken'
                      : 'hover:bg-surface-sunken bg-surface-sunken'
                }`}
              >
                <span className="text-2xl mb-1">{emoji}</span>
                <span className="text-xs text-text-secondary">{label}</span>
              </button>
            ))}
          </div>

          {/* Sentiment Bar */}
          <div className="h-3 bg-surface-sunken rounded-full overflow-hidden flex">
            <div className="bg-emerald-500 transition-all" style={{ width: `${sentimentPercentage.happy}%` }} />
            <div className="bg-surface-border transition-all" style={{ width: `${sentimentPercentage.neutral}%` }} />
            <div className="bg-red-500 transition-all" style={{ width: `${sentimentPercentage.sad}%` }} />
          </div>
          <div className="flex justify-between text-xs text-text-muted mt-2">
            <span>😊 {sentimentPercentage.happy}%</span>
            <span>😐 {sentimentPercentage.neutral}%</span>
            <span>😔 {sentimentPercentage.sad}%</span>
          </div>
        </div>

        {/* Action Items Summary */}
        <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-5 h-5 text-blue-500" />
            <span className="font-medium text-text-primary text-text-primary">Action Items Progress</span>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span className="text-sm text-text-secondary">Completed</span>
              </div>
              <span className="font-semibold text-success">{actionItemsStats.completed}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="text-sm text-text-secondary">In Progress</span>
              </div>
              <span className="font-semibold text-accent">{actionItemsStats.inProgress}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                <span className="text-sm text-text-secondary">Pending</span>
              </div>
              <span className="font-semibold text-warning">{actionItemsStats.pending}</span>
            </div>
            {/* Progress Bar */}
            <div className="h-2 bg-surface-sunken rounded-full overflow-hidden flex">
              <div 
                className="bg-emerald-500 transition-all" 
                style={{ width: `${actionItemsStats.total > 0 ? (actionItemsStats.completed / actionItemsStats.total) * 100 : 0}%` }} 
              />
              <div 
                className="bg-blue-500 transition-all" 
                style={{ width: `${actionItemsStats.total > 0 ? (actionItemsStats.inProgress / actionItemsStats.total) * 100 : 0}%` }} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* Summary (if exists) */}
      {currentRetro.summary && (
        <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <Star className="w-5 h-5 text-purple-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-400 mb-1">Sprint Summary</h4>
              <p className="text-sm text-text-secondary">{currentRetro.summary}</p>
            </div>
          </div>
        </div>
      )}

      {/* Add New Item */}
      <div className="bg-surface-raised rounded-xl border border-surface-border p-4">
        {!isAddingItem ? (
          <button
            onClick={() => setIsAddingItem(true)}
            className="w-full flex items-center justify-center gap-2 py-3 text-text-secondary hover:text-purple-400 border-2 border-dashed border-surface-border rounded-lg hover:border-purple-400/50 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Add Retrospective Item
          </button>
        ) : (
          <div className="space-y-3">
            <div className="flex gap-2">
              {(['went_well', 'needs_improvement', 'action_items'] as RetroCategory[]).map(cat => {
                const config = categoryConfig[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setNewItemCategory(cat)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      newItemCategory === cat
                        ? `${config.bgColor} ${config.iconColor} ring-2 ring-${config.color}-500`
                        : 'bg-surface-sunken text-text-muted'
                    }`}
                  >
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </div>
            <textarea
              value={newItemContent}
              onChange={(e) => setNewItemContent(e.target.value)}
              placeholder="Share your thoughts..."
              className="w-full px-4 py-3 border border-surface-border rounded-lg bg-surface-raised text-text-primary text-text-primary resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              rows={3}
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setIsAddingItem(false);
                  setNewItemContent('');
                }}
                className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary"
              >
                Cancel
              </button>
              <button
                onClick={handleAddItem}
                disabled={!newItemContent.trim()}
                className="px-4 py-2 text-sm bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Item
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Retrospective Categories */}
      {showActionItems ? (
        /* Action Items View */
        <div className="bg-surface-raised rounded-xl border border-surface-border overflow-hidden">
          <div className="p-4 bg-accent/10 border-b border-accent/20 flex items-center gap-3">
            <Lightbulb className="w-5 h-5 text-accent" />
            <span className="font-medium text-text-primary">All Action Items</span>
          </div>
          <div className="divide-y divide-surface-border">
            {itemsByCategory.action_items.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No action items yet. Add one to track improvements!
              </div>
            ) : (
              itemsByCategory.action_items.map(item => (
                <div key={item.id} className="p-4 hover:bg-surface-sunken">
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleVote(item.id)}
                      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-surface-sunken"
                    >
                      <ChevronUp className="w-4 h-4 text-text-muted" />
                      <span className="text-sm font-semibold text-text-primary text-text-primary">{item.votes}</span>
                    </button>
                    <div className="flex-1">
                      <p className="text-text-primary text-text-primary">{item.content}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-text-muted">
                        <span>by {item.author}</span>
                        {item.assignee && (
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {item.assignee}
                          </span>
                        )}
                        {item.dueDate && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {item.dueDate}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={item.status || 'pending'}
                        onChange={(e) => handleUpdateActionStatus(item.id, e.target.value as 'pending' | 'in_progress' | 'completed')}
                        className={`px-3 py-1.5 text-sm rounded-lg border-0 ${
                          item.status === 'completed' 
                            ? 'bg-success/10 text-success'
                            : item.status === 'in_progress'
                              ? 'bg-accent/10 text-accent'
                              : 'bg-warning/10 text-warning'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-text-muted hover:text-red-500 rounded-lg hover:bg-danger/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        /* Category Columns */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {(['went_well', 'needs_improvement', 'action_items'] as RetroCategory[]).map(category => {
            const config = categoryConfig[category];
            const items = itemsByCategory[category];
            const isExpanded = expandedCategory === category;

            return (
              <div
                key={category}
                className={`rounded-xl border ${config.borderColor} overflow-hidden`}
              >
                <button
                  onClick={() => setExpandedCategory(isExpanded ? null : category)}
                  className={`w-full p-4 ${config.bgColor} flex items-center justify-between`}
                >
                  <div className="flex items-center gap-3">
                    <config.icon className={`w-5 h-5 ${config.iconColor}`} />
                    <span className="font-medium text-text-primary text-text-primary">{config.label}</span>
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${config.bgColor} ${config.iconColor}`}>
                      {items.length}
                    </span>
                  </div>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-text-muted" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-text-muted" />
                  )}
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: 'auto' }}
                      exit={{ height: 0 }}
                      className="overflow-hidden bg-surface-raised"
                    >
                      <div className="divide-y divide-surface-border">
                        {items.length === 0 ? (
                          <div className="p-4 text-center text-text-muted text-sm">
                            No items yet
                          </div>
                        ) : (
                          items.map(item => (
                            <div key={item.id} className="p-4 hover:bg-surface-sunken">
                              <div className="flex items-start gap-3">
                                <button
                                  onClick={() => handleVote(item.id)}
                                  className="flex flex-col items-center p-1.5 rounded hover:bg-surface-sunken"
                                >
                                  <ChevronUp className="w-4 h-4 text-text-muted" />
                                  <span className="text-xs font-semibold text-gray-700">{item.votes}</span>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-text-primary text-text-primary">{item.content}</p>
                                  <p className="text-xs text-text-muted mt-1">— {item.author}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteItem(item.id)}
                                  className="p-1 text-text-muted hover:text-red-500 opacity-0 group-hover:opacity-100"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
