import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Plus,
  Trash2,
  Search,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  CheckCircle2,
  Pause,
  Shield,
  Link,
  ArrowUpRight,
} from 'lucide-react';
import {
  useCreateWebhook,
  useDeleteWebhook,
  useUpdateWebhook,
  useWebhooks,
} from '../api/hooks/useAPIHooks';
import type { CreateWebhookPayload, WebhookRecord } from '../api/services/apiService';
import { SMButton } from '../components/ui';

const WEBHOOK_EVENTS = [
  'incident.created',
  'incident.updated',
  'investigation.created',
  'capa.created',
  'inspection.completed',
  'training.assigned',
  'audit.created',
  'risk.updated',
];

const formatTimestamp = (value?: number | null) => {
  if (!value) return 'Never';
  return new Date(value).toLocaleString();
};

export const WebhooksPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [expandedWebhookId, setExpandedWebhookId] = useState<number | null>(null);
  const [showSecrets, setShowSecrets] = useState<Record<number, boolean>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [formData, setFormData] = useState<CreateWebhookPayload>({
    name: '',
    url: '',
    events: ['incident.created'],
    active: true,
    secret: '',
  });

  const { data: webhooks = [], loading, refetch } = useWebhooks();
  const createWebhook = useCreateWebhook();
  const updateWebhook = useUpdateWebhook();
  const deleteWebhook = useDeleteWebhook();

  const filteredWebhooks = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return webhooks;
    return webhooks.filter((webhook) =>
      webhook.name.toLowerCase().includes(query) ||
      webhook.url.toLowerCase().includes(query) ||
      webhook.events.some((event) => event.toLowerCase().includes(query))
    );
  }, [searchTerm, webhooks]);

  const stats = useMemo(() => ({
    total: webhooks.length,
    active: webhooks.filter((webhook) => webhook.active).length,
    inactive: webhooks.filter((webhook) => !webhook.active).length,
    failures: webhooks.reduce((sum, webhook) => sum + (webhook.failureCount ?? 0), 0),
  }), [webhooks]);

  const handleEventToggle = (eventName: string) => {
    setFormData((current) => ({
      ...current,
      events: current.events.includes(eventName)
        ? current.events.filter((event) => event !== eventName)
        : [...current.events, eventName],
    }));
  };

  const handleCreateWebhook = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFeedback(null);

    const created = await createWebhook.mutate({
      ...formData,
      secret: formData.secret || undefined,
    });

    if (!created) {
      setFeedback(createWebhook.error?.message || 'Failed to create webhook.');
      return;
    }

    setFeedback('Webhook created successfully.');
    setShowCreateForm(false);
    setExpandedWebhookId(created.id);
    setFormData({
      name: '',
      url: '',
      events: ['incident.created'],
      active: true,
      secret: '',
    });
    await refetch();
  };

  const handleToggleWebhook = async (webhook: WebhookRecord) => {
    const updated = await updateWebhook.mutate({
      id: webhook.id,
      data: {
        name: webhook.name,
        url: webhook.url,
        events: webhook.events,
        active: !webhook.active,
        secret: webhook.secret || undefined,
      },
    });

    if (!updated) {
      setFeedback(updateWebhook.error?.message || 'Failed to update webhook.');
      return;
    }

    setFeedback(`Webhook ${updated.active ? 'enabled' : 'disabled'} successfully.`);
    await refetch();
  };

  const handleDeleteWebhook = async (webhookId: number) => {
    const deleted = await deleteWebhook.mutate(webhookId);
    if (!deleted) {
      setFeedback(deleteWebhook.error?.message || 'Failed to delete webhook.');
      return;
    }

    setFeedback('Webhook deleted successfully.');
    if (expandedWebhookId === webhookId) setExpandedWebhookId(null);
    await refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-surface-50 via-white to-surface-100 pb-24">


      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-brand-500 font-bold text-[10px] uppercase tracking-[0.3em] mb-2">
              <Webhook className="w-4 h-4" />
              External Integrations
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-900 tracking-tight">Webhook Integrations</h1>
            <p className="text-surface-500 mt-3 max-w-2xl">
              Live webhook endpoints stored and managed through backend webhook configuration routes.
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm((current) => !current)}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-900 text-white font-bold shadow-button"
          >
            <Plus className="w-4 h-4" />
            Add Webhook
          </button>
        </div>

        {feedback && (
          <div className={`rounded-2xl px-4 py-3 text-sm border ${feedback.toLowerCase().includes('failed') ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
            {feedback}
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Total Webhooks</div>
            <div className="text-3xl font-bold text-surface-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Active</div>
            <div className="text-3xl font-bold text-emerald-600">{stats.active}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Inactive</div>
            <div className="text-3xl font-bold text-surface-600">{stats.inactive}</div>
          </div>
          <div className="bg-white rounded-2xl p-5 border border-surface-100 shadow-soft">
            <div className="text-[10px] font-bold text-surface-400 uppercase tracking-widest mb-2">Failures</div>
            <div className="text-3xl font-bold text-red-600">{stats.failures}</div>
          </div>
        </div>

        <AnimatePresence>
          {showCreateForm && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              onSubmit={handleCreateWebhook}
              className="bg-white p-6 rounded-[2rem] border border-surface-100 shadow-soft space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  value={formData.name}
                  onChange={(event) => setFormData((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Webhook name"
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
                  required
                />
                <input
                  type="url"
                  value={formData.url}
                  onChange={(event) => setFormData((current) => ({ ...current, url: event.target.value }))}
                  placeholder="https://example.com/webhook"
                  className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
                  required
                />
              </div>

              <input
                type="text"
                value={formData.secret}
                onChange={(event) => setFormData((current) => ({ ...current, secret: event.target.value }))}
                placeholder="Optional signing secret"
                className="w-full px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl outline-none focus:border-brand-400"
              />

              <div className="space-y-3">
                <div className="text-xs font-bold text-surface-500 uppercase tracking-wider">Subscribed Events</div>
                <div className="flex flex-wrap gap-2">
                  {WEBHOOK_EVENTS.map((eventName) => {
                    const active = formData.events.includes(eventName);
                    return (
                      <button
                        key={eventName}
                        type="button"
                        onClick={() => handleEventToggle(eventName)}
                        className={`px-3 py-2 rounded-xl text-sm font-medium border ${active ? 'bg-brand-50 text-brand-700 border-brand-200' : 'bg-white text-surface-600 border-surface-200'}`}
                      >
                        {eventName}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="inline-flex items-center gap-3 text-sm text-surface-600">
                <input
                  type="checkbox"
                  checked={Boolean(formData.active)}
                  onChange={(event) => setFormData((current) => ({ ...current, active: event.target.checked }))}
                  className="rounded border-surface-300"
                />
                Create as active webhook
              </label>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowCreateForm(false)} className="px-5 py-3 rounded-xl border border-surface-200 text-surface-700 font-bold">
                  Cancel
                </button>
                <SMButton variant="primary" type="submit" loading={createWebhook.loading} disabled={formData.events.length === 0}>{createWebhook.loading ? 'Saving...' : 'Save Webhook'}</SMButton>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
            <input
              type="text"
              placeholder="Search webhooks..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-surface-200 rounded-xl outline-none focus:border-brand-400"
            />
          </div>
          <button onClick={() => refetch()} className="text-[10px] font-bold text-brand-600 uppercase tracking-widest hover:text-brand-700 transition-colors flex items-center gap-1">
            Refresh <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-3">
          {loading && <div className="text-sm text-surface-500">Loading webhooks...</div>}
          {!loading && filteredWebhooks.length === 0 && (
            <div className="bg-white rounded-2xl p-6 border border-surface-100 shadow-soft text-sm text-surface-500">
              No webhooks found for the current search.
            </div>
          )}

          {filteredWebhooks.map((webhook) => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl border border-surface-100 shadow-soft overflow-hidden"
            >
              <div className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="text-lg font-semibold text-surface-900">{webhook.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${webhook.active ? 'bg-emerald-100 text-emerald-700' : 'bg-surface-100 text-surface-600'}`}>
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-3">
                      {webhook.events.map((eventName) => (
                        <span key={eventName} className="px-2 py-1 bg-surface-100 text-surface-600 text-xs rounded-lg">
                          {eventName}
                        </span>
                      ))}
                    </div>

                    <div className="space-y-2 text-sm text-surface-500">
                      <div className="flex items-center gap-2"><Link className="w-4 h-4" />{webhook.url}</div>
                      <div className="flex items-center gap-2"><Shield className="w-4 h-4" />Last delivery: {formatTimestamp(webhook.lastDelivery)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button onClick={() => handleToggleWebhook(webhook)} disabled={updateWebhook.loading} className={`p-2 rounded-lg transition-colors ${webhook.active ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-surface-50 text-surface-500 hover:bg-surface-100'}`} title={webhook.active ? 'Disable' : 'Enable'}>
                      {webhook.active ? <CheckCircle2 className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleDeleteWebhook(webhook.id)} disabled={deleteWebhook.loading} className="p-2 rounded-lg transition-colors bg-red-50 text-red-600 hover:bg-red-100" title="Delete">
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button onClick={() => setExpandedWebhookId(expandedWebhookId === webhook.id ? null : webhook.id)} className="px-3 py-2 rounded-xl border border-surface-200 text-xs font-bold text-surface-600">
                      {expandedWebhookId === webhook.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedWebhookId === webhook.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-surface-100 bg-surface-50 overflow-hidden"
                  >
                    <div className="p-5 grid grid-cols-1 xl:grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Endpoint</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm font-mono text-surface-700 overflow-x-auto">
                            {webhook.url}
                          </code>
                          <button type="button" onClick={() => navigator.clipboard.writeText(webhook.url)} className="p-2 hover:bg-surface-100 rounded-lg">
                            <Copy className="w-4 h-4 text-surface-500" />
                          </button>
                          <a href={webhook.url} target="_blank" rel="noreferrer" className="p-2 hover:bg-surface-100 rounded-lg">
                            <ExternalLink className="w-4 h-4 text-surface-500" />
                          </a>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs font-bold text-surface-500 uppercase tracking-wider mb-2">Signing Secret</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 px-3 py-2 bg-white border border-surface-200 rounded-lg text-sm font-mono text-surface-700">
                            {showSecrets[webhook.id] ? webhook.secret || 'No secret configured' : webhook.secret ? '••••••••••••••••' : 'No secret configured'}
                          </code>
                          <button type="button" onClick={() => setShowSecrets((current) => ({ ...current, [webhook.id]: !current[webhook.id] }))} className="p-2 hover:bg-surface-100 rounded-lg">
                            {showSecrets[webhook.id] ? <EyeOff className="w-4 h-4 text-surface-500" /> : <Eye className="w-4 h-4 text-surface-500" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default WebhooksPage;
