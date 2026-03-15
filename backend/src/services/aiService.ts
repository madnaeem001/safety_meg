/**
 * AI Service — centralized OpenRouter wrapper
 * Covers: P2-01 (wrapper), P2-02 (health probe), P2-03 (error categories), P2-06 (observability)
 */

import { OpenRouter } from "@openrouter/sdk";
import { createLogger } from "./logger";

const logger = createLogger("AIService");

// ── Types ─────────────────────────────────────────────────────────────────

export type AIErrorCategory =
  | 'timeout'
  | 'auth'
  | 'rate_limit'
  | 'empty_response'
  | 'malformed_response'
  | 'upstream_5xx'
  | 'not_configured'
  | 'unknown';

export type AIStatus = 'configured' | 'degraded' | 'unavailable' | 'fallback_only';

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICallOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
  retries?: number;
}

export interface AICallResult {
  content: string;
  source: 'ai' | 'fallback';
  model: string;
  latencyMs: number;
  errorCategory?: AIErrorCategory;
}

// ── In-memory observability counters (P2-06) ─────────────────────────────

const _metrics = {
  requests: 0,
  failures: 0,
  fallbacks: 0,
  totalLatencyMs: 0,
};

export function getAIMetrics() {
  return {
    requests: _metrics.requests,
    failures: _metrics.failures,
    fallbacks: _metrics.fallbacks,
    avgLatencyMs:
      _metrics.requests > 0
        ? Math.round(_metrics.totalLatencyMs / _metrics.requests)
        : 0,
  };
}

// ── Error categorization (P2-03) ─────────────────────────────────────────

export function categorizeAIError(err: unknown): AIErrorCategory {
  if (!process.env.OPENROUTER_API_KEY) return 'not_configured';
  const msg = err instanceof Error ? err.message : String(err ?? '');
  const m = msg.toLowerCase();
  if (m.includes('timeout') || m.includes('aborted') || m.includes('timed out')) return 'timeout';
  if (m.includes('401') || m.includes('unauthorized') || m.includes('invalid api key')) return 'auth';
  if (m.includes('429') || m.includes('rate limit') || m.includes('too many requests')) return 'rate_limit';
  if (m.includes('500') || m.includes('502') || m.includes('503') || m.includes('504')) return 'upstream_5xx';
  if (m.includes('empty') || m.includes('no content')) return 'empty_response';
  if (m.includes('json') || m.includes('parse') || m.includes('syntax')) return 'malformed_response';
  return 'unknown';
}

// ── Upstream health probe (P2-02) ─────────────────────────────────────────

export async function getAIStatus(): Promise<AIStatus> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return 'fallback_only';

  try {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), 5000);
    const res = await fetch('https://openrouter.ai/api/v1/models', {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: ac.signal,
    });
    clearTimeout(timer);
    if (res.ok) return 'configured';
    if (res.status === 401 || res.status === 403) return 'unavailable';
    return 'degraded';
  } catch {
    return 'degraded';
  }
}

// ── Core completion wrapper (P2-01) ───────────────────────────────────────

const DEFAULT_MODEL =
  process.env.OPENROUTER_MODEL?.trim() ?? 'arcee-ai/trinity-large-preview:free';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_RETRIES = 1;

/** Race a promise against a timeout (ms). Rejects with Error('timeout') if exceeded. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  return Promise.race([
    p,
    new Promise<never>(
      (_, reject) => { t = setTimeout(() => reject(new Error('timeout')), ms); }
    ),
  ]).finally(() => clearTimeout(t));
}

/**
 * Call OpenRouter for a single (non-streaming) completion.
 * Returns an AICallResult — if the call fails after retries, content is '' and
 * source is 'fallback'. Callers should use their own fallback content when source === 'fallback'.
 */
export async function callAI(
  messages: AIMessage[],
  opts: AICallOptions = {}
): Promise<AICallResult> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = 500,
    temperature = 0.7,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries = DEFAULT_RETRIES,
  } = opts;

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    logger.warn('OpenRouter API key not configured — returning fallback');
    _metrics.fallbacks++;
    return { content: '', source: 'fallback', model, latencyMs: 0, errorCategory: 'not_configured' };
  }

  _metrics.requests++;
  const start = Date.now();
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const openrouter = new OpenRouter({ apiKey });
      const result = await withTimeout(
        (openrouter as any).chat.send({ model, messages, max_tokens: maxTokens, temperature }),
        timeoutMs
      ) as any;

      const content: string = (result?.choices?.[0]?.message?.content as string) ?? '';
      const latencyMs = Date.now() - start;
      _metrics.totalLatencyMs += latencyMs;

      if (!content.trim()) {
        logger.warn('AI returned empty content — treating as fallback', { model, attempt });
        _metrics.fallbacks++;
        return { content: '', source: 'fallback', model, latencyMs, errorCategory: 'empty_response' };
      }

      logger.info('AI call succeeded', { model, latencyMs, attempt });
      return { content: content.trim(), source: 'ai', model, latencyMs };

    } catch (err) {
      lastError = err;
      const cat = categorizeAIError(err);
      logger.warn(`AI call attempt ${attempt + 1} failed`, {
        category: cat,
        error: err instanceof Error ? err.message : String(err),
      });
      // Non-retryable error categories
      if (cat === 'auth' || cat === 'not_configured') break;
    }
  }

  const latencyMs = Date.now() - start;
  _metrics.totalLatencyMs += latencyMs;
  _metrics.failures++;
  _metrics.fallbacks++;
  const errorCategory = categorizeAIError(lastError);
  logger.error('AI call exhausted retries', lastError, { model, errorCategory });
  return { content: '', source: 'fallback', model, latencyMs, errorCategory };
}
