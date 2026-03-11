/**
 * Webhook Integration Service
 * Provides webhook management for external system integrations
 */

export type WebhookEvent = 
  | 'incident.created'
  | 'incident.updated'
  | 'incident.closed'
  | 'injury.reported'
  | 'capa.created'
  | 'capa.due'
  | 'capa.overdue'
  | 'capa.completed'
  | 'inspection.scheduled'
  | 'inspection.completed'
  | 'audit.completed'
  | 'training.completed'
  | 'compliance.alert'
  | 'threshold.exceeded'
  | 'report.generated';

export type WebhookStatus = 'active' | 'inactive' | 'failed' | 'pending';

export interface WebhookConfig {
  id: string;
  name: string;
  description: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  headers?: Record<string, string>;
  enabled: boolean;
  status: WebhookStatus;
  retryConfig: {
    maxRetries: number;
    retryDelayMs: number;
    backoffMultiplier: number;
  };
  createdAt: Date;
  updatedAt: Date;
  lastTriggeredAt?: Date;
  lastResponseCode?: number;
  lastError?: string;
  successCount: number;
  failureCount: number;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, any>;
  status: 'pending' | 'delivered' | 'failed' | 'retrying';
  attempts: number;
  responseCode?: number;
  responseBody?: string;
  errorMessage?: string;
  createdAt: Date;
  deliveredAt?: Date;
  duration?: number; // ms
}

export interface WebhookPayload {
  event: WebhookEvent;
  timestamp: string;
  webhookId: string;
  data: Record<string, any>;
  metadata: {
    source: string;
    version: string;
    environment: string;
  };
}

// Default webhooks
const DEFAULT_WEBHOOKS: WebhookConfig[] = [
  {
    id: 'WH-001',
    name: 'Slack Incident Notifications',
    description: 'Send incident alerts to Slack channel',
    url: 'https://hooks.slack.com/services/YOUR/WEBHOOK/URL',
    secret: 'whsec_xxxxxxxxxxxxxxxx',
    events: ['incident.created', 'injury.reported', 'capa.overdue'],
    headers: { 'Content-Type': 'application/json' },
    enabled: false,
    status: 'inactive',
    retryConfig: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    successCount: 0,
    failureCount: 0,
  },
  {
    id: 'WH-002',
    name: 'Microsoft Teams Integration',
    description: 'Post safety updates to Teams channel',
    url: 'https://outlook.office.com/webhook/YOUR/WEBHOOK/URL',
    secret: 'whsec_yyyyyyyyyyyyyyyy',
    events: ['audit.completed', 'training.completed', 'compliance.alert'],
    headers: { 'Content-Type': 'application/json' },
    enabled: false,
    status: 'inactive',
    retryConfig: { maxRetries: 3, retryDelayMs: 5000, backoffMultiplier: 2 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    successCount: 0,
    failureCount: 0,
  },
  {
    id: 'WH-003',
    name: 'ERP System Sync',
    description: 'Sync incident data with ERP system',
    url: 'https://erp.company.com/api/v1/safety/webhook',
    secret: 'whsec_zzzzzzzzzzzzzzzz',
    events: ['incident.created', 'incident.updated', 'incident.closed'],
    headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ${API_KEY}' },
    enabled: false,
    status: 'inactive',
    retryConfig: { maxRetries: 5, retryDelayMs: 10000, backoffMultiplier: 2 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    successCount: 0,
    failureCount: 0,
  },
  {
    id: 'WH-004',
    name: 'External Analytics',
    description: 'Send event data to analytics platform',
    url: 'https://analytics.company.com/webhook/safety',
    secret: 'whsec_aaaaaaaaaaaaaaaa',
    events: ['report.generated', 'inspection.completed', 'threshold.exceeded'],
    headers: { 'Content-Type': 'application/json' },
    enabled: false,
    status: 'inactive',
    retryConfig: { maxRetries: 2, retryDelayMs: 3000, backoffMultiplier: 1.5 },
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    successCount: 0,
    failureCount: 0,
  },
];

// Event descriptions
export const WEBHOOK_EVENT_DESCRIPTIONS: Record<WebhookEvent, { label: string; description: string; category: string }> = {
  'incident.created': { label: 'Incident Created', description: 'When a new incident is reported', category: 'Incidents' },
  'incident.updated': { label: 'Incident Updated', description: 'When an incident is modified', category: 'Incidents' },
  'incident.closed': { label: 'Incident Closed', description: 'When an incident is resolved and closed', category: 'Incidents' },
  'injury.reported': { label: 'Injury Reported', description: 'When a workplace injury is reported', category: 'Injuries' },
  'capa.created': { label: 'CAPA Created', description: 'When a corrective action is created', category: 'CAPA' },
  'capa.due': { label: 'CAPA Due Soon', description: 'When a CAPA is approaching deadline', category: 'CAPA' },
  'capa.overdue': { label: 'CAPA Overdue', description: 'When a CAPA passes its deadline', category: 'CAPA' },
  'capa.completed': { label: 'CAPA Completed', description: 'When a corrective action is completed', category: 'CAPA' },
  'inspection.scheduled': { label: 'Inspection Scheduled', description: 'When an inspection is scheduled', category: 'Inspections' },
  'inspection.completed': { label: 'Inspection Completed', description: 'When an inspection is finished', category: 'Inspections' },
  'audit.completed': { label: 'Audit Completed', description: 'When a safety audit is completed', category: 'Audits' },
  'training.completed': { label: 'Training Completed', description: 'When training is completed', category: 'Training' },
  'compliance.alert': { label: 'Compliance Alert', description: 'When a compliance issue is detected', category: 'Compliance' },
  'threshold.exceeded': { label: 'Threshold Exceeded', description: 'When a metric exceeds limits', category: 'Monitoring' },
  'report.generated': { label: 'Report Generated', description: 'When an automated report is created', category: 'Reports' },
};

class WebhookService {
  private webhooks: WebhookConfig[];
  private deliveries: WebhookDelivery[];
  private deliveryQueue: WebhookDelivery[];

  constructor() {
    this.webhooks = [...DEFAULT_WEBHOOKS];
    this.deliveries = [];
    this.deliveryQueue = [];
  }

  // Get all webhooks
  getWebhooks(): WebhookConfig[] {
    return [...this.webhooks];
  }

  // Get webhook by ID
  getWebhookById(id: string): WebhookConfig | undefined {
    return this.webhooks.find(w => w.id === id);
  }

  // Create webhook
  createWebhook(config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt' | 'successCount' | 'failureCount' | 'status'>): WebhookConfig {
    const newWebhook: WebhookConfig = {
      ...config,
      id: `WH-${Date.now()}`,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      successCount: 0,
      failureCount: 0,
    };
    this.webhooks.push(newWebhook);
    return newWebhook;
  }

  // Update webhook
  updateWebhook(id: string, updates: Partial<WebhookConfig>): WebhookConfig | null {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return null;

    this.webhooks[index] = {
      ...this.webhooks[index],
      ...updates,
      updatedAt: new Date(),
    };
    return this.webhooks[index];
  }

  // Delete webhook
  deleteWebhook(id: string): boolean {
    const index = this.webhooks.findIndex(w => w.id === id);
    if (index === -1) return false;
    this.webhooks.splice(index, 1);
    return true;
  }

  // Toggle webhook
  toggleWebhook(id: string): boolean {
    const webhook = this.getWebhookById(id);
    if (!webhook) return false;

    webhook.enabled = !webhook.enabled;
    webhook.status = webhook.enabled ? 'active' : 'inactive';
    webhook.updatedAt = new Date();
    return true;
  }

  // Test webhook
  async testWebhook(id: string): Promise<{ success: boolean; responseCode?: number; error?: string }> {
    const webhook = this.getWebhookById(id);
    if (!webhook) return { success: false, error: 'Webhook not found' };

    // Simulate test payload
    const testPayload: WebhookPayload = {
      event: 'incident.created',
      timestamp: new Date().toISOString(),
      webhookId: webhook.id,
      data: {
        test: true,
        message: 'This is a test webhook delivery',
      },
      metadata: {
        source: 'safety-ehs',
        version: '1.0.0',
        environment: 'production',
      },
    };

    // Simulate sending (in real app would use fetch)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Simulate 90% success rate for tests
    if (Math.random() > 0.1) {
      webhook.status = 'active';
      webhook.lastTriggeredAt = new Date();
      webhook.lastResponseCode = 200;
      return { success: true, responseCode: 200 };
    } else {
      webhook.status = 'failed';
      webhook.lastError = 'Connection timeout';
      return { success: false, responseCode: 504, error: 'Connection timeout' };
    }
  }

  // Trigger webhook for event
  async triggerEvent(event: WebhookEvent, data: Record<string, any>): Promise<void> {
    const activeWebhooks = this.webhooks.filter(w => w.enabled && w.events.includes(event));

    for (const webhook of activeWebhooks) {
      const delivery: WebhookDelivery = {
        id: `DEL-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        webhookId: webhook.id,
        event,
        payload: {
          event,
          timestamp: new Date().toISOString(),
          webhookId: webhook.id,
          data,
          metadata: {
            source: 'safety-ehs',
            version: '1.0.0',
            environment: 'production',
          },
        },
        status: 'pending',
        attempts: 0,
        createdAt: new Date(),
      };

      this.deliveryQueue.push(delivery);
      await this.processDelivery(delivery, webhook);
    }
  }

  // Process delivery
  private async processDelivery(delivery: WebhookDelivery, webhook: WebhookConfig): Promise<void> {
    const startTime = Date.now();
    delivery.attempts++;
    delivery.status = 'pending';

    try {
      // Simulate HTTP request
      await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));

      // Simulate 95% success rate
      if (Math.random() > 0.05) {
        delivery.status = 'delivered';
        delivery.responseCode = 200;
        delivery.deliveredAt = new Date();
        delivery.duration = Date.now() - startTime;
        webhook.successCount++;
        webhook.lastTriggeredAt = new Date();
        webhook.lastResponseCode = 200;
        webhook.status = 'active';
      } else {
        throw new Error('Simulated delivery failure');
      }
    } catch (error) {
      delivery.status = 'failed';
      delivery.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      webhook.failureCount++;
      webhook.lastError = delivery.errorMessage;

      // Retry logic
      if (delivery.attempts < webhook.retryConfig.maxRetries) {
        delivery.status = 'retrying';
        const delay = webhook.retryConfig.retryDelayMs * 
          Math.pow(webhook.retryConfig.backoffMultiplier, delivery.attempts - 1);
        setTimeout(() => this.processDelivery(delivery, webhook), delay);
      } else {
        webhook.status = 'failed';
      }
    }

    this.deliveries.push(delivery);
  }

  // Get delivery history
  getDeliveries(webhookId?: string, limit: number = 50): WebhookDelivery[] {
    let filtered = [...this.deliveries];
    if (webhookId) {
      filtered = filtered.filter(d => d.webhookId === webhookId);
    }
    return filtered.slice(-limit).reverse();
  }

  // Get stats
  getStats(): { total: number; active: number; failed: number; totalDeliveries: number; successRate: number } {
    const active = this.webhooks.filter(w => w.enabled && w.status === 'active').length;
    const failed = this.webhooks.filter(w => w.status === 'failed').length;
    const totalSuccess = this.webhooks.reduce((sum, w) => sum + w.successCount, 0);
    const totalFailure = this.webhooks.reduce((sum, w) => sum + w.failureCount, 0);
    const totalDeliveries = totalSuccess + totalFailure;
    const successRate = totalDeliveries > 0 ? (totalSuccess / totalDeliveries) * 100 : 100;

    return {
      total: this.webhooks.length,
      active,
      failed,
      totalDeliveries,
      successRate,
    };
  }

  // Generate HMAC signature for webhook verification
  generateSignature(payload: string, secret: string): string {
    // Simulated - in real app would use crypto.createHmac
    return `sha256=${btoa(payload + secret).slice(0, 64)}`;
  }
}

// Singleton instance
export const webhookService = new WebhookService();

// React hook
export const useWebhookService = () => {
  return webhookService;
};

export default webhookService;
