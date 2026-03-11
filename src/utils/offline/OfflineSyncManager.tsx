import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  Cloud,
  CloudOff,
  Check,
  AlertTriangle,
  AlertCircle,
  Database,
  Upload,
  Download,
  Trash2,
  Settings,
  ChevronRight,
  Clock,
  FileText,
  Shield,
  HardDrive,
  Zap,
  Info,
  XCircle
} from 'lucide-react';
import {
  getStorageStats,
  getQueueItems,
  isOnline,
  onOnlineStatusChange,
  clearOfflineData,
  StorageStats,
  SyncQueueItem,
  STORES
} from '../../utils/offline/offlineSync';

interface OfflineSyncManagerProps {
  onSync?: () => Promise<void>;
}

export const OfflineSyncManager: React.FC<OfflineSyncManagerProps> = ({ onSync }) => {
  const [online, setOnline] = useState(isOnline());
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [queueItems, setQueueItems] = useState<SyncQueueItem[]>([]);
  const [syncing, setSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [activeTab, setActiveTab] = useState<'status' | 'queue' | 'settings'>('status');
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const refreshStats = useCallback(async () => {
    try {
      const storageStats = await getStorageStats();
      setStats(storageStats);
      const items = await getQueueItems();
      setQueueItems(items);
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    
    const unsubscribe = onOnlineStatusChange((isOnline) => {
      setOnline(isOnline);
      if (isOnline) {
        // Auto-sync when coming back online
        handleSync();
      }
    });

    // Refresh stats periodically
    const interval = setInterval(refreshStats, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [refreshStats]);

  const handleSync = async () => {
    if (!online || syncing) return;
    
    setSyncing(true);
    try {
      if (onSync) {
        await onSync();
      } else {
        // Simulate sync process
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      setLastSyncTime(new Date());
      await refreshStats();
    } catch (error) {
      console.error('Sync error:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleClearData = async () => {
    try {
      await clearOfflineData();
      await refreshStats();
      setShowClearConfirm(false);
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  };

  const getStoreIcon = (store: string) => {
    switch (store) {
      case STORES.INCIDENTS: return <AlertTriangle className="w-4 h-4" />;
      case STORES.JSA: return <FileText className="w-4 h-4" />;
      case STORES.INSPECTIONS: return <Shield className="w-4 h-4" />;
      default: return <Database className="w-4 h-4" />;
    }
  };

  const getOperationColor = (operation: string) => {
    switch (operation) {
      case 'create': return 'bg-emerald-500/20 text-emerald-400';
      case 'update': return 'bg-blue-500/20 text-blue-400';
      case 'delete': return 'bg-red-500/20 text-red-400';
      default: return 'bg-slate-500/20 text-slate-400';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-xl ${online ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-red-500 to-rose-600'}`}>
              {online ? <Cloud className="w-6 h-6 text-white" /> : <CloudOff className="w-6 h-6 text-white" />}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Offline Sync</h1>
              <p className="text-slate-400 text-sm">
                {online ? 'Connected - Ready to sync' : 'Offline - Changes saved locally'}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Connection Status Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`mb-6 p-4 rounded-xl border ${
            online
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {online ? (
                <Wifi className="w-6 h-6 text-emerald-400" />
              ) : (
                <WifiOff className="w-6 h-6 text-amber-400" />
              )}
              <div>
                <h3 className={`font-medium ${online ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {online ? 'Online' : 'Offline Mode'}
                </h3>
                <p className="text-slate-400 text-sm">
                  {online 
                    ? `${stats?.pendingSync || 0} items pending sync`
                    : 'Changes will sync when connection is restored'}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSync}
              disabled={!online || syncing}
              className={`px-4 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                online && !syncing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync Now'}
            </motion.button>
          </div>
          {lastSyncTime && (
            <div className="mt-3 pt-3 border-t border-slate-700/50 text-sm text-slate-400">
              Last synced: {lastSyncTime.toLocaleTimeString()}
            </div>
          )}
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-slate-800/50 p-1 rounded-xl">
          {[
            { id: 'status', label: 'Status', icon: <Database className="w-4 h-4" /> },
            { id: 'queue', label: 'Sync Queue', icon: <Upload className="w-4 h-4" /> },
            { id: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              {tab.icon}
              {tab.label}
              {tab.id === 'queue' && queueItems.length > 0 && (
                <span className="px-1.5 py-0.5 bg-amber-500 text-white text-xs rounded-full">
                  {queueItems.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'status' && (
            <motion.div
              key="status"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Total Records', value: stats?.totalRecords || 0, icon: <Database className="w-5 h-5" />, color: 'from-blue-500 to-indigo-600' },
                  { label: 'Pending Sync', value: stats?.pendingSync || 0, icon: <Upload className="w-5 h-5" />, color: 'from-amber-500 to-orange-600' },
                  { label: 'Conflicts', value: stats?.conflicts || 0, icon: <AlertTriangle className="w-5 h-5" />, color: 'from-red-500 to-rose-600' },
                  { label: 'Storage Used', value: stats?.estimatedSize || '0 KB', icon: <HardDrive className="w-5 h-5" />, color: 'from-purple-500 to-violet-600' }
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                      {stat.icon}
                    </div>
                    <p className="text-2xl font-bold text-white">{stat.value}</p>
                    <p className="text-slate-400 text-sm">{stat.label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Sync Status by Store */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Data Stores</h3>
                <div className="space-y-3">
                  {[
                    { name: 'Incidents', store: STORES.INCIDENTS, icon: <AlertTriangle className="w-5 h-5" /> },
                    { name: 'Observations', store: STORES.OBSERVATIONS, icon: <Shield className="w-5 h-5" /> },
                    { name: 'JSA Documents', store: STORES.JSA, icon: <FileText className="w-5 h-5" /> },
                    { name: 'Inspections', store: STORES.INSPECTIONS, icon: <Check className="w-5 h-5" /> }
                  ].map((item) => (
                    <div
                      key={item.store}
                      className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-teal-400">
                          {item.icon}
                        </div>
                        <span className="text-white font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-400 text-sm flex items-center gap-1">
                          <Check className="w-4 h-4" />
                          Synced
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'queue' && (
            <motion.div
              key="queue"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-3"
            >
              {queueItems.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/50 border border-slate-700/50 rounded-xl">
                  <Check className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                  <h3 className="text-lg font-semibold text-white mb-2">All Synced!</h3>
                  <p className="text-slate-400">No pending items in the sync queue</p>
                </div>
              ) : (
                queueItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-slate-700/50 rounded-lg text-teal-400">
                          {getStoreIcon(item.store)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{item.store}</span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getOperationColor(item.operation)}`}>
                              {item.operation.toUpperCase()}
                            </span>
                            {item.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-red-500/20 text-red-400 rounded-full text-xs font-medium">
                                HIGH PRIORITY
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-slate-400">Record ID: {item.recordId}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {formatTimestamp(item.timestamp)}
                            </span>
                            {item.retryCount > 0 && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <RefreshCw className="w-3 h-3" />
                                {item.retryCount} retries
                              </span>
                            )}
                          </div>
                          {item.lastError && (
                            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
                              <XCircle className="w-3 h-3" />
                              {item.lastError}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-4"
            >
              {/* Auto Sync Settings */}
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Sync Settings</h3>
                <div className="space-y-4">
                  {[
                    { label: 'Auto-sync when online', description: 'Automatically sync data when connection is restored', enabled: true },
                    { label: 'Background sync', description: 'Sync data in the background while using the app', enabled: true },
                    { label: 'Sync on WiFi only', description: 'Only sync when connected to WiFi to save mobile data', enabled: false }
                  ].map((setting) => (
                    <div key={setting.label} className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
                      <div>
                        <p className="text-white font-medium">{setting.label}</p>
                        <p className="text-sm text-slate-400">{setting.description}</p>
                      </div>
                      <button
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          setting.enabled ? 'bg-teal-600' : 'bg-slate-600'
                        }`}
                      >
                        <motion.div
                          animate={{ x: setting.enabled ? 24 : 2 }}
                          className="absolute top-1 w-4 h-4 bg-white rounded-full"
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Danger Zone */}
              <div className="bg-slate-800/50 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-white font-medium">Clear Offline Data</p>
                      <p className="text-sm text-slate-400">Delete all locally stored data. This cannot be undone.</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowClearConfirm(true)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium flex items-center gap-2 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear Data
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Clear Confirmation Modal */}
        <AnimatePresence>
          {showClearConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
              onClick={() => setShowClearConfirm(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-red-500/20 rounded-xl">
                    <AlertTriangle className="w-6 h-6 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-white">Clear All Data?</h3>
                    <p className="text-sm text-slate-400">This action cannot be undone</p>
                  </div>
                </div>
                <p className="text-slate-300 mb-6">
                  All offline data including pending changes will be permanently deleted. 
                  Make sure you have synced all important data before proceeding.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleClearData}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-lg font-medium transition-colors"
                  >
                    Clear Data
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OfflineSyncManager;
