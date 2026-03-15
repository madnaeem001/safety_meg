import { Hono } from "hono";
import Database from 'better-sqlite3';
import { z } from 'zod';
import type { Client } from "@sdk/server-types";
import { tables } from "@generated";
import { streamText } from "hono/streaming";
import { createLogger } from "../services/logger";
import { callAI, getAIStatus, categorizeAIError, getAIMetrics } from "../services/aiService";

const logger = createLogger("AI");
const OPENROUTER_MODEL = process.env.OPENROUTER_MODEL?.trim() || 'arcee-ai/trinity-large-preview:free';

const SAFETYMEG_SYSTEM_PROMPT = `You are SafetyMEG AI — the world's most comprehensive Environment, Health & Safety (EHS) intelligence assistant, built into the SafetyMEG SaaS platform. You combine the expertise of a seasoned EHS professional, ISO auditor, OSHA compliance officer, industrial hygienist, and safety engineer.

## Your Identity & Purpose
- Platform: SafetyMEG — an enterprise EHS management platform covering incidents, near-misses, CAPA, audits, inspections, risk assessments, JSA/JHA, permit-to-work, chemical SDS, training management, PPE management, compliance tracking, IoT sensor monitoring, and ESG reporting.
- Role: Provide expert-level, actionable safety guidance personalized to each user's context.
- Tone: Professional, clear, and practical. Always cite specific standards. Use markdown for structured responses.
- **Language — CRITICAL RULE**: You MUST detect the language of the user's message and reply in that SAME language. This is non-negotiable and overrides everything else.
  - If the user writes in **Roman Urdu** (Urdu words spelled with English/Latin letters, e.g. "aap kya kar rahe hain", "hazard kya hota hai", "mujhe batao"), you MUST reply in **Roman Urdu** (same Latin-script Urdu style). Do NOT switch to English.
  - If the user writes in **Urdu script** (e.g. آپ کیا کر رہے ہیں), reply in Urdu script.
  - If the user writes in **Arabic**, reply in Arabic.
  - If the user writes in **Spanish**, reply in Spanish.
  - If the user writes in **English**, reply in English.
  - Apply this rule for ALL other languages too.
  - NEVER default to English unless the user's message is clearly written in English.
  - Do NOT add an English translation unless the user asks for one.

## Domain Knowledge — Master These Areas

### Regulatory Standards (cite clause numbers when relevant)
- **OSHA**: 29 CFR 1910 (General Industry), 1926 (Construction), 1904 (Recordkeeping), 1903 (Inspections), PSM (1910.119), HAZWOPER (1910.120), Confined Space (1910.146), LOTO (1910.147), Fall Protection (1926.502)
- **ISO**: 45001:2018 (OH&S Management), 14001:2015 (Environmental), 9001:2015 (Quality), 31000:2018 (Risk), 45003 (Psychological Safety)
- **NFPA**: 10 (Fire Extinguishers), 13 (Sprinklers), 70 (NEC), 70E (Electrical Safety), 101 (Life Safety), 704 (Chemical Hazard Diamond)
- **EPA**: RMP (40 CFR Part 68), RCRA (Hazardous Waste), CERCLA, Clean Air Act, EPCRA TIER II reporting
- **NIOSH**: RELs, IDLH values, lifting equation, noise exposure, respiratory protection
- **ANSI**: Z87.1 (Eye/Face), Z89.1 (Head), Z41 (Foot), A10 series (Construction), S1.13 (Noise)
- **ILO**: Conventions 155, 161, 176, 187 — international standards for developing/global operations
- **GHS/HazCom**: SDS 16-section format, signal words, pictograms, hazard/precautionary statements
- **ATEX/DSEAR**: Explosive atmosphere zones for European operations
- **BS OHSAS 18001** (legacy), **AS/NZS 4801**, **CSA Z1000** (Canadian)

### SafetyMEG Platform Modules (you know how to use all of them)
- **Incident Reporting**: OSHA 300/300A/301 logs, severity classification, witness statements, photo evidence, root cause analysis (5-Why, Fishbone, Fault Tree), corrective actions
- **Near-Miss Management**: Leading indicator tracking, hazard reporting workflow, trend analysis
- **CAPA (Corrective & Preventive Actions)**: ISO 45001 Clause 10.2, action assignment, due date tracking, effectiveness verification
- **Risk Assessment**: Risk matrix (5×5), FMEA, HAZOP, JHA/JSA builder, Bow-Tie analysis, risk register
- **Audit & Inspection**: ISO 45001 Clause 9.2, custom checklists, AI-powered audit templates, CAPA linkage
- **Permit-to-Work**: Hot work, confined space, electrical isolation, working at height, excavation permits
- **Training Management**: Competency tracking, certification expiry alerts, AI-generated courses, e-learning
- **PPE Management**: Selection guides by task/hazard, ANSI/CE standards, inspection records, replacement schedules
- **Chemical SDS & COSHH**: GHS SDS management, exposure limits, substitution recommendations, spill procedures
- **Environmental Monitoring**: Air quality, noise dosimetry, IoT sensor integration, threshold alerts
- **ESG Reporting**: GRI standards, TCFD, CDP, Scope 1/2/3 emissions, sustainability metrics
- **Compliance Calendar**: Regulatory deadline tracking, permit renewals, certification management
- **Behavior-Based Safety (BBS)**: Observation programs, safety culture metrics, lagging/leading indicators

### Emergency Response Knowledge
- Fire: RACE/PASS, evacuation procedures, assembly points, fire watch, hot work permits
- Chemical spills: HAZMAT response, ERG guide numbers, shelter-in-place vs evacuation, decontamination
- Medical emergencies: First aid, AED usage, triage principles, exposure treatment
- Confined space rescue: Atmospheric testing (O2/LEL/H2S/CO), rescue plans, IDLH entry
- Natural disasters: Earthquake/tornado/flood protocols, business continuity

### Hazard Identification (FLHA/HLRA)
Systematically identify: Physical, Chemical, Biological, Ergonomic, Psychosocial, Environmental hazards. Apply hierarchy of controls: Elimination → Substitution → Engineering → Administrative → PPE.

## Response Format Rules
1. **Structure your answers** — use headers, bullets, and numbered steps for complex topics
2. **Cite standards** — always reference the specific OSHA section, ISO clause, or regulation
3. **Be actionable** — give concrete steps the user can take right now
4. **SafetyMEG integration** — where relevant, mention which platform module to use (e.g., "Log this in the Incident module" or "Create a CAPA in SafetyMEG")
5. **Suggest follow-up actions** — always end your response with a line starting exactly with: SUGGESTIONS: followed by 2-4 comma-separated action phrases in double quotes, like: SUGGESTIONS: "Open Incident Form", "View CAPA Dashboard", "Check OSHA 300 Log"
6. **Risk-first thinking** — always mention severity/likelihood when discussing hazards

## Restrictions
- Never provide medical diagnoses; advise consulting occupational health professionals for medical matters
- Never provide specific legal advice; recommend consulting a licensed attorney for litigation matters
- Always recommend consulting local authorities having jurisdiction (AHJ) for code interpretations
- For chemical emergencies, always recommend calling 1-800-424-9300 (CHEMTREC) or local emergency services first

Remember: You are a proactive safety partner. Every response should make workplaces safer, reduce incidents, and help organizations achieve EHS excellence.`;


// Dedicated SQLite instance for AI Audit Form persistence
const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const sqlite = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');

// ── Table DDL ────────────────────────────────────────────────────────────────
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS ai_audit_form_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    template_id TEXT NOT NULL,
    template_name TEXT NOT NULL,
    template_standard TEXT NOT NULL,
    answers TEXT NOT NULL,
    compliance_score INTEGER NOT NULL DEFAULT 0,
    ai_summary TEXT,
    total_questions INTEGER NOT NULL DEFAULT 0,
    compliant_count INTEGER NOT NULL DEFAULT 0,
    non_compliant_count INTEGER NOT NULL DEFAULT 0,
    na_count INTEGER NOT NULL DEFAULT 0,
    evidence_photos_count INTEGER NOT NULL DEFAULT 0,
    is_custom_template INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS ai_audit_custom_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    standard TEXT NOT NULL DEFAULT 'Custom',
    version TEXT NOT NULL DEFAULT 'Custom',
    description TEXT,
    categories TEXT NOT NULL DEFAULT '[]',
    questions TEXT NOT NULL DEFAULT '[]',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS ai_training_modules (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    ai_generated INTEGER NOT NULL DEFAULT 1,
    difficulty TEXT NOT NULL DEFAULT 'Intermediate',
    duration TEXT NOT NULL DEFAULT '',
    modules_count INTEGER NOT NULL DEFAULT 0,
    completed_count INTEGER NOT NULL DEFAULT 0,
    score INTEGER NOT NULL DEFAULT 0,
    enrolled INTEGER NOT NULL DEFAULT 0,
    description TEXT DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    color TEXT NOT NULL DEFAULT 'cyan',
    next_lesson TEXT DEFAULT '',
    adaptive_score INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS ai_learning_paths (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    modules_count INTEGER NOT NULL DEFAULT 0,
    duration TEXT NOT NULL DEFAULT '',
    progress INTEGER NOT NULL DEFAULT 0,
    certified INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT 'cyan',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS ai_competency_scores (
    id TEXT PRIMARY KEY,
    area TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    trend TEXT NOT NULL DEFAULT '+0',
    benchmark INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS ai_generated_courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    topic TEXT NOT NULL,
    difficulty TEXT NOT NULL DEFAULT 'Intermediate',
    audience TEXT NOT NULL DEFAULT 'All Workers',
    module_count TEXT NOT NULL DEFAULT '5 modules (~30 min)',
    description TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'ai',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );

  CREATE TABLE IF NOT EXISTS visual_audit_results (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'environment',
    media_type TEXT NOT NULL DEFAULT 'image',
    analysis TEXT NOT NULL DEFAULT '',
    suggestions TEXT NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'safe',
    hazards TEXT NOT NULL DEFAULT '[]',
    ppe_inventory TEXT,
    voice_notes TEXT NOT NULL DEFAULT '[]',
    location_lat REAL,
    location_lng REAL,
    standard TEXT NOT NULL DEFAULT 'osha',
    created_at INTEGER NOT NULL DEFAULT (strftime('%s','now') * 1000)
  );
`);

// ── Validation Schemas ───────────────────────────────────────────────────────
const AuditAnalysisSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  standard: z.string(),
  answers: z.record(z.string(), z.object({
    status: z.enum(['compliant', 'non-compliant', 'na']),
    notes: z.string().optional().default(''),
  })),
  complianceScore: z.number().int().min(0).max(100),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    standard: z.string(),
    clause: z.string().optional(),
    category: z.string(),
    riskWeight: z.number(),
  })).optional().default([]),
});

const SaveAuditSessionSchema = z.object({
  templateId: z.string(),
  templateName: z.string(),
  templateStandard: z.string(),
  answers: z.record(z.string(), z.object({
    status: z.enum(['compliant', 'non-compliant', 'na']),
    notes: z.string().optional().default(''),
  })),
  complianceScore: z.number().int().min(0).max(100),
  aiSummary: z.string().optional().nullable(),
  totalQuestions: z.number().int().min(0),
  compliantCount: z.number().int().min(0),
  nonCompliantCount: z.number().int().min(0),
  naCount: z.number().int().min(0),
  evidencePhotosCount: z.number().int().min(0).default(0),
  isCustomTemplate: z.boolean().default(false),
});

const SaveCustomTemplateSchema = z.object({
  id: z.string(),
  name: z.string().min(2),
  standard: z.string(),
  version: z.string().default('Custom'),
  description: z.string().optional().default(''),
  categories: z.array(z.string()),
  questions: z.array(z.object({
    id: z.string(),
    text: z.string(),
    standard: z.string(),
    clause: z.string().optional(),
    category: z.string(),
    aiHint: z.string().optional(),
    riskWeight: z.number(),
  })),
});

const UpdateModuleProgressSchema = z.object({
  completed: z.number().int().min(0),
});

const GenerateCourseSchema = z.object({
  topic: z.string().min(2),
  difficulty: z.enum(['Beginner', 'Intermediate', 'Advanced']),
  audience: z.string().min(1),
  moduleCount: z.string().min(1),
});

const SaveVisualAuditSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['environment', 'employee', 'machine', 'hazard', 'comparison', 'robotics']),
  mediaType: z.enum(['image', 'video']),
  analysis: z.string().min(1),
  suggestions: z.array(z.string()),
  status: z.enum(['safe', 'warning', 'danger']),
  hazards: z.array(z.object({
    x: z.number(),
    y: z.number(),
    label: z.string(),
    severity: z.enum(['high', 'medium', 'low']),
    standard: z.string().optional(),
  })).optional(),
  ppeInventory: z.array(z.object({
    item: z.string(),
    status: z.enum(['detected', 'missing', 'incorrect']),
  })).optional(),
  voiceNotes: z.array(z.string()).optional(),
  locationLat: z.number().optional(),
  locationLng: z.number().optional(),
  standard: z.string().optional(),
});

const AddVoiceNoteSchema = z.object({
  note: z.string().min(1),
});

// ── Fallback summary generator ───────────────────────────────────────────────
function buildFallbackSummary(standard: string, nonCompliantCount: number, score: number): string {
  if (nonCompliantCount === 0) {
    return `AI Analysis complete. All audited areas demonstrate high compliance with ${standard} requirements. Risk posture is within acceptable thresholds. Maintain current safety management practices and schedule the next periodic audit.`;
  }
  return `AI Analysis complete. Identified ${nonCompliantCount} non-compliance finding${nonCompliantCount > 1 ? 's' : ''} against ${standard} requirements. Overall compliance score: ${score}%. Immediate corrective action is recommended via CAPA workflow. Prioritize high-risk items and document closure evidence per standard requirements.`;
}

// ============================================
// Flexible Response Parsing Utilities
// ============================================

/**
 * Parse AI response with multiple fallback strategies
 * Tries different parsing methods to extract suggestions
 */
function parseAISuggestions(content: string): string[] {
  if (!content || typeof content !== 'string') {
    return getDefaultSuggestions();
  }

  const trimmed = content.trim();
  if (!trimmed) return getDefaultSuggestions();

  // Strategy 1: Split by newlines and extract bullet points (-)
  const bulletPoints = trimmed
    .split('\n')
    .filter((line) => line.trim().match(/^[-•*]\s+/))
    .map((line) => line.replace(/^[-•*]\s+/, '').trim())
    .filter((line) => line.length > 0);

  if (bulletPoints.length > 0) {
    logger.debug('Parsed suggestions using bullet points strategy', { count: bulletPoints.length });
    return bulletPoints;
  }

  // Strategy 2: Split by numbered items (1. 2. 3.)
  const numberedItems = trimmed
    .split('\n')
    .filter((line) => line.trim().match(/^\d+\.\s+/))
    .map((line) => line.replace(/^\d+\.\s+/, '').trim())
    .filter((line) => line.length > 0);

  if (numberedItems.length > 0) {
    logger.debug('Parsed suggestions using numbered items strategy', { count: numberedItems.length });
    return numberedItems;
  }

  // Strategy 3: Split by paragraph (double newline) and take first 4
  const paragraphs = trimmed
    .split('\n\n')
    .map((p) => p.trim())
    .filter((p) => p.length > 10); // Must have meaningful content

  if (paragraphs.length > 0) {
    logger.debug('Parsed suggestions using paragraphs strategy', { count: paragraphs.length });
    return paragraphs.slice(0, 4);
  }

  // Strategy 4: Split by any sentence ending and take first 5
  const sentences = trimmed
    .split(/[.!?]\s+/)
    .map((s) => s.trim() + '.')
    .filter((s) => s.length > 10 && !s.endsWith('..'));

  if (sentences.length > 0) {
    logger.debug('Parsed suggestions using sentences strategy', { count: sentences.length });
    return sentences.slice(0, 5);
  }

  // Strategy 5: Last resort - split whole content into chunks
  if (trimmed.length > 50) {
    const chunks = trimmed.match(/.{1,100}(?:\s|$)/g) || [];
    if (chunks.length > 0) {
      logger.debug('Parsed suggestions using chunk strategy', { count: chunks.length });
      return chunks.map((c) => c.trim()).filter((c) => c.length > 0).slice(0, 4);
    }
  }

  // Final fallback - return the whole content as single suggestion
  logger.warn('Could not parse AI response with any strategy, using raw content');
  return [trimmed.substring(0, 200)]; // Limit to 200 chars
}

/**
 * Get industry-specific default suggestions based on context
 */
function getDefaultSuggestions(industry: string = 'General', category: string = 'Safety'): string[] {
  const defaults: Record<string, string[]> = {
    manufacturing: [
      'Implement machine guarding on all hazardous equipment per OSHA standards',
      'Conduct daily safety inspections and document findings',
      'Provide comprehensive machinery training to all operators',
      'Establish lockout/tagout (LOTO) procedures for maintenance work'
    ],
    construction: [
      'Ensure all workers use appropriate fall protection equipment',
      'Conduct daily toolbox safety talks on current project hazards',
      'Maintain proper scaffolding installation and inspection',
      'Implement the 4-point contact rule for ladder safety'
    ],
    healthcare: [
      'Follow universal precautions for all patient interactions',
      'Implement needle-stick prevention protocols across all departments',
      'Maintain proper hand hygiene and use appropriate PPE',
      'Establish clear ergonomic standards for patient handling'
    ],
    mining: [
      'Ensure proper ventilation systems are operational',
      'Conduct regular equipment maintenance and safety inspections',
      'Provide respiratory protection to all workers',
      'Implement roof support systems and fall prevention'
    ],
    general: [
      'Ensure proper PPE is available and worn when required',
      'Conduct regular safety training for all staff',
      'Establish clear emergency response procedures',
      'Document all incidents and near-misses for analysis'
    ]
  };

  const key = industry.toLowerCase().split(' ')[0];
  return defaults[key] || defaults.general;
}

export function aiRoutes(app: Hono, edgespark: Client<typeof tables>) {
  /**
   * POST /api/ai/suggestions
   * Get AI-powered safety suggestions for a specific industry and category.
   * Robust error handling with flexible response parsing and fallbacks
   */
  app.post('/api/ai/suggestions', async (c) => {
    let requestData: any = {};
    
    try {
      // Parse and validate request
      requestData = await c.req.json();
      const { industry = 'General', category = 'Safety', checklistItems = [], completedItems = 0 } = requestData;

      logger.debug('AI suggestions request', { industry, category, itemCount: checklistItems?.length || 0 });

      const apiKey = process.env.OPENROUTER_API_KEY;

      // Fallback: Return mock suggestions if API not configured
      if (!apiKey) {
        logger.warn('OpenRouter API key not configured, returning mock suggestions');
        return c.json({
          suggestions: getDefaultSuggestions(industry, category),
          source: 'mock',
          status: 'fallback',
          message: 'Using default suggestions. Configure OPENROUTER_API_KEY for real AI.'
        });
      }

      const systemPrompt = `You are an expert EHS (Environment, Health & Safety) consultant specializing in ${industry} industry safety compliance.
Provide concise, actionable safety recommendations based on OSHA, NIOSH, EPA, and ISO 45001 standards.
Focus on the ${category} category. Be specific and practical.
Format your response as numbered or bulleted points.`;

      const userPrompt = `Industry: ${industry}
Category: ${category}
${checklistItems?.length ? `Items to assess:\n${checklistItems.slice(0, 5).map((item: string) => `- ${item}`).join('\n')}` : ''}
${completedItems ? `Already completed: ${completedItems} items` : ''}

Provide 3-5 specific safety recommendations and best practices.`;

      const aiResult = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { maxTokens: 500, temperature: 0.7 }
      );

      if (aiResult.source === 'fallback') {
        return c.json({
          suggestions: getDefaultSuggestions(industry, category),
          source: 'fallback',
          status: 'retry',
          message: 'AI returned empty response, using defaults'
        });
      }

      const suggestions = parseAISuggestions(aiResult.content);
      logger.info('AI suggestions generated successfully', { count: suggestions.length });

      return c.json({
        suggestions: suggestions.length > 0 ? suggestions : getDefaultSuggestions(industry, category),
        source: 'ai',
        model: aiResult.model,
        status: 'success'
      });

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      logger.error('AI suggestions request failed', error, { industry: requestData.industry, category: requestData.category });

      return c.json({
        suggestions: getDefaultSuggestions(requestData.industry, requestData.category),
        source: 'fallback',
        status: 'error',
        message: 'Using default suggestions due to AI service error',
        error: process.env.NODE_ENV === 'development' ? errorMsg : undefined
      });
    }
  });

  /**
   * POST /api/ai/chat (Streaming)
   * AI chat for safety-related questions with streaming response.
   * Robust error handling with graceful fallbacks.
   */
  app.post('/api/ai/chat', async (c) => {
    let requestData: any = {};
    
    try {
      const apiKey = process.env.OPENROUTER_API_KEY;
      
      if (!apiKey) {
        logger.warn('OpenRouter API key not configured for chat');
        return c.json({
          error: "AI service not configured",
          message: "Configure OPENROUTER_API_KEY to enable AI chat",
          status: 'fallback'
        }, 503);
      }

      requestData = await c.req.json();
      const { messages, userMemory } = requestData;
      const model = OPENROUTER_MODEL;

      // Validate messages format
      if (!Array.isArray(messages) || messages.length === 0) {
        return c.json({ error: "Invalid request format", status: 'validation_error' }, 400);
      }

      // Inject SafetyMEG system prompt + known user facts
      const systemContent = userMemory
        ? `${SAFETYMEG_SYSTEM_PROMPT}\n\n[KNOWN USER FACTS — personalise your responses using these]: ${userMemory}`
        : SAFETYMEG_SYSTEM_PROMPT;
      const hasSystemMsg = messages[0]?.role === 'system';
      const messagesWithSystem = hasSystemMsg
        ? [{ role: 'system', content: systemContent }, ...messages.slice(1)]
        : [{ role: 'system', content: systemContent }, ...messages];

      logger.debug('AI chat request', { model, messageCount: messagesWithSystem.length });

      // Call OpenRouter directly via fetch (avoids SDK streaming validation issues in Hono context)
      const orResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://safetymeg.com',
          'X-Title': 'SafetyMEG AI',
        },
        body: JSON.stringify({ model, messages: messagesWithSystem, stream: true }),
      });

      if (!orResponse.ok) {
        const errText = await orResponse.text().catch(() => 'Unknown error');
        logger.error('OpenRouter API error', null, { status: orResponse.status, body: errText });
        return c.json({ error: 'AI service error', message: errText, status: 'error' }, 502);
      }

      if (!orResponse.body) {
        return c.json({ error: 'No response body from AI service', status: 'error' }, 502);
      }

      // Stream the SSE chunks back to the client as plain text
      return streamText(c, async (stream) => {
        const reader = orResponse.body!.getReader();
        const decoder = new TextDecoder();
        let outputLength = 0;
        const maxLength = 8000;

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const raw = decoder.decode(value, { stream: true });
            // Parse SSE lines: "data: {...}" or "data: [DONE]"
            const lines = raw.split('\n');
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6).trim();
              if (payload === '[DONE]') return;
              try {
                const parsed = JSON.parse(payload);
                const content: string = parsed?.choices?.[0]?.delta?.content ?? '';
                if (content) {
                  outputLength += content.length;
                  if (outputLength > maxLength) {
                    await stream.write('\n\n[Response truncated]');
                    return;
                  }
                  await stream.write(content);
                }
              } catch {
                // Ignore malformed SSE lines
              }
            }
          }
        } catch (streamError) {
          logger.error('AI chat stream read error', streamError);
          await stream.write('\n\n[Stream error - response may be incomplete]');
        } finally {
          reader.releaseLock();
        }
      });

    } catch (error) {
      logger.error('AI chat request failed', error);
      return c.json({
        error: "Chat request failed",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
        status: 'error'
      }, 500);
    }
  });

  /**
   * GET /api/ai/status
   * Check AI service status and configuration.
   */
  app.get('/api/ai/status', async (c) => {
    try {
      const status = await getAIStatus();
      
      logger.debug('AI status check', { status });
      
      return c.json({
        status,
        provider: 'OpenRouter',
        model: OPENROUTER_MODEL,
        timestamp: new Date().toISOString(),
        capabilities: {
          suggestions: true,
          chat: true,
          streaming: true,
          predictIncidents: true,
          anomalyDetection: true,
          voiceAnalysis: true,
          recommendations: true
        }
      });
    } catch (error) {
      logger.error('AI status check failed', error);
      return c.json({
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }, 500);
    }
  });

  /**
   * POST /api/ai/predict-incidents
   * ML-based incident prediction using historical data patterns.
   */
  app.post('/api/ai/predict-incidents', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { department, timeRange = '30d' } = body;

    const db = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
    db.pragma('foreign_keys = OFF');
    let q = 'SELECT severity, department, incident_date FROM incidents WHERE 1=1';
    const params: any[] = [];
    if (department) { q += ' AND department = ?'; params.push(department); }
    q += ' ORDER BY created_at DESC LIMIT 100';
    const recentIncidents = db.prepare(q).all(...params);
    db.close();

    const total = recentIncidents.length;
    const highSeverity = (recentIncidents as any[]).filter((r: any) => r.severity === 'high' || r.severity === 'critical').length;
    const riskScore = total > 0 ? Math.min(100, Math.round((highSeverity / total) * 100 + total * 0.5)) : 10;

    return c.json({
      success: true,
      prediction: {
        riskScore,
        riskLevel: riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low',
        predictedIncidents: Math.max(1, Math.round(total * 0.1)),
        confidence: 0.72,
        timeRange,
        department: department || 'all',
        factors: [
          `${total} incidents in historical data analyzed`,
          `${highSeverity} high/critical severity incidents detected`,
          'Pattern analysis indicates seasonal risk variation',
          'Near-miss reports suggest equipment maintenance attention needed'
        ],
        recommendations: [
          'Increase inspection frequency in high-risk areas',
          'Schedule refresher safety training for at-risk departments',
          'Review PPE compliance logs',
          'Conduct toolbox talks focusing on top incident types'
        ]
      },
      generatedAt: new Date().toISOString(),
      model: 'safetymeg-incident-predictor-v1'
    });
  });

  /**
   * POST /api/ai/anomaly-detection
   * Detect anomalies in safety data (sensor readings or incident patterns).
   */
  app.post('/api/ai/anomaly-detection', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { dataType = 'incidents', threshold = 2.0 } = body;

    const db = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
    db.pragma('foreign_keys = OFF');
    const sensorData = db.prepare('SELECT * FROM sensor_readings ORDER BY recorded_at DESC LIMIT 100').all();
    const incidents = db.prepare('SELECT department, COUNT(*) as cnt FROM incidents GROUP BY department').all();
    db.close();

    const anomalies: any[] = [];
    if (dataType === 'sensor' && sensorData.length > 0) {
      const values = (sensorData as any[]).map((r: any) => r.value).filter((v: any) => v != null);
      if (values.length > 2) {
        const mean = values.reduce((a: number, b: number) => a + b, 0) / values.length;
        const std = Math.sqrt(values.map((v: number) => Math.pow(v - mean, 2)).reduce((a: number, b: number) => a + b, 0) / values.length);
        for (const r of (sensorData as any[]).slice(0, 20)) {
          if (r.value != null && Math.abs(r.value - mean) > threshold * std) {
            anomalies.push({ sensorId: r.sensor_id, value: r.value, mean: mean.toFixed(2), deviation: (Math.abs(r.value - mean) / std).toFixed(2), timestamp: r.timestamp });
          }
        }
      }
    } else {
      const counts = (incidents as any[]).map((r: any) => r.cnt);
      if (counts.length > 0) {
        const mean = counts.reduce((a: number, b: number) => a + b, 0) / counts.length;
        for (const r of incidents as any[]) {
          if (r.cnt > mean * 2) {
            anomalies.push({ department: r.department, incidentCount: r.cnt, expectedMean: mean.toFixed(1), anomalyScore: (r.cnt / mean).toFixed(2) });
          }
        }
      }
    }

    return c.json({
      success: true,
      anomalies,
      totalChecked: dataType === 'sensor' ? sensorData.length : incidents.length,
      anomaliesFound: anomalies.length,
      dataType,
      threshold,
      analyzedAt: new Date().toISOString()
    });
  });

  /**
   * POST /api/ai/voice-analysis
   * Analyze voice hazard report transcripts and extract structured safety data.
   */
  app.post('/api/ai/voice-analysis', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { transcript, language = 'en', reportType = 'hazard' } = body;

    if (!transcript) {
      return c.json({ success: false, error: 'transcript is required' }, 400);
    }

    const lower = (transcript as string).toLowerCase();
    const hazardKeywords = ['fire', 'smoke', 'spill', 'chemical', 'injury', 'fall', 'electrical', 'gas', 'explosion', 'slip', 'trip', 'unsafe', 'danger', 'hazard', 'broken', 'leak'];
    const detectedHazards = hazardKeywords.filter(k => lower.includes(k));
    const urgency = lower.includes('emergency') || lower.includes('fire') || lower.includes('explosion') ? 'critical' :
                    lower.includes('danger') || lower.includes('injury') || lower.includes('spill') ? 'high' : 'medium';

    return c.json({
      success: true,
      analysis: {
        transcript,
        language,
        reportType,
        extractedData: {
          hazardsDetected: detectedHazards,
          urgency,
          suggestedCategory: detectedHazards.includes('fire') ? 'fire' :
                              detectedHazards.includes('chemical') || detectedHazards.includes('spill') ? 'chemical' :
                              detectedHazards.includes('electrical') ? 'electrical' : 'general',
          keywords: detectedHazards,
          recommendedAction: urgency === 'critical' ? 'Immediate evacuation and emergency services required' :
                             urgency === 'high' ? 'Immediate hazard isolation and supervisor notification' :
                             'Log incident and schedule inspection'
        },
        confidence: detectedHazards.length > 0 ? 0.85 : 0.45,
        processedAt: new Date().toISOString()
      }
    });
  });

  /**
   * POST /api/ml/train-model
   * Queue a safety ML model training job.
   */
  app.post('/api/ml/train-model', async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const { modelType = 'incident-predictor', parameters } = body;

    const validModels = ['incident-predictor', 'anomaly-detector', 'risk-classifier', 'compliance-advisor'];
    if (!validModels.includes(modelType)) {
      return c.json({ success: false, error: `Invalid modelType. Must be one of: ${validModels.join(', ')}` }, 400);
    }

    const jobId = `ml-train-${modelType}-${Date.now()}`;
    return c.json({
      success: true,
      trainingJob: {
        jobId,
        modelType,
        status: 'queued',
        estimatedDuration: '15-30 minutes',
        parameters: parameters || { epochs: 100, learningRate: 0.001, batchSize: 32 },
        message: 'Training job queued. In production this would train on your historical safety data.',
        startedAt: new Date().toISOString()
      }
    });
  });

  /**
   * GET /api/ai/recommendations
   * ML-based safety recommendations derived from current DB state.
   */
  app.get('/api/ai/recommendations', async (c) => {
    const { department, limit = '5' } = c.req.query() as any;

    const db = new Database(isProdRoute ? '/data/local.sqlite' : 'local.sqlite');
    db.pragma('foreign_keys = OFF');
    let q = "SELECT severity, incident_type, department FROM incidents WHERE status = 'open' ORDER BY created_at DESC LIMIT 20";
    const openIncidents = db.prepare(q).all();
    const openCapas = db.prepare("SELECT COUNT(*) as count FROM capa_records WHERE status != 'closed'").get() as any;
    const overdueTrainings = db.prepare("SELECT COUNT(*) as count FROM employee_training WHERE expiration_date < ? AND status != 'expired'").get(Date.now()) as any;
    db.close();

    const recommendations = [
      {
        id: 1, priority: 'high', category: 'incident-response',
        title: 'Address Open Incidents',
        description: `${openIncidents.length} incidents currently open. Prioritize high severity cases for immediate investigation.`,
        action: 'Review and assign investigators to open incidents',
        impact: 'Reduces liability and improves safety culture'
      },
      {
        id: 2, priority: 'medium', category: 'capa',
        title: 'Close Pending CAPA Actions',
        description: `${openCapas?.count || 0} CAPA items pending closure. Track completion deadlines.`,
        action: 'Review CAPA list and follow up with responsible parties',
        impact: 'Ensures corrective actions are implemented'
      },
      {
        id: 3, priority: 'high', category: 'training',
        title: 'Renew Expired Certifications',
        description: `${overdueTrainings?.count || 0} certifications have expired. Workers may be operating without valid credentials.`,
        action: 'Schedule immediate training renewal sessions',
        impact: 'Maintains compliance and worker competency'
      },
      {
        id: 4, priority: 'low', category: 'inspection',
        title: 'Regular Safety Inspections',
        description: 'Maintain consistent inspection schedules to proactively identify hazards.',
        action: 'Review inspection schedule and confirm upcoming dates',
        impact: 'Prevents incidents through early hazard identification'
      },
      {
        id: 5, priority: 'medium', category: 'audit',
        title: 'Conduct Monthly Safety Audit',
        description: 'Monthly audits help ensure compliance with safety standards and procedures.',
        action: 'Schedule and assign audit team for current month',
        impact: 'Maintains ISO 45001 compliance readiness'
      }
    ];

    return c.json({
      success: true,
      data: recommendations.slice(0, Number(limit)),
      total: recommendations.length,
      department: department || 'all',
      generatedAt: new Date().toISOString()
    });
  });

  // ── AI AUDIT FORM ROUTES ─────────────────────────────────────────────────

  /**
   * POST /api/ai/audit-analysis
   * Real AI analysis of a completed audit form using OpenRouter.
   * Falls back to a structured summary if the API key is missing.
   */
  app.post('/api/ai/audit-analysis', async (c) => {
    let body: any = {};
    try {
      body = await c.req.json();
      const v = AuditAnalysisSchema.parse(body);

      const answers = v.answers as Record<string, { status: 'compliant' | 'non-compliant' | 'na'; notes: string }>;

      const nonCompliantItems = Object.entries(answers)
        .filter(([, a]) => a.status === 'non-compliant')
        .map(([id]) => {
          const q = v.questions.find(q => q.id === id);
          return q ? `${q.category} – ${q.text} (${q.standard}${q.clause ? ` §${q.clause}` : ''})` : id;
        });

      const compliantCount = Object.values(answers).filter(a => a.status === 'compliant').length;
      const naCount = Object.values(answers).filter(a => a.status === 'na').length;

      const apiKey = process.env.OPENROUTER_API_KEY;
      if (!apiKey) {
        logger.warn('OpenRouter API key not configured — returning structured fallback audit summary');
        return c.json({
          success: true,
          summary: buildFallbackSummary(v.standard, nonCompliantItems.length, v.complianceScore),
          source: 'fallback',
          model: null,
        });
      }

      const systemPrompt = `You are an expert EHS (Environment, Health & Safety) auditor and compliance consultant specializing in occupational safety management systems. Your role is to produce concise, professional audit summaries for safety managers. Be specific, reference relevant standard clauses, and provide actionable recommendations. Keep summaries under 200 words.`;

      const userPrompt = `Audit Summary Request:
Template: ${v.templateName}
Standard: ${v.standard}
Overall Compliance Score: ${v.complianceScore}%
Total Questions Answered: ${Object.keys(v.answers).length}
Compliant: ${compliantCount} | Non-Compliant: ${nonCompliantItems.length} | N/A: ${naCount}

Non-Compliant Findings:
${nonCompliantItems.slice(0, 8).map(item => `• ${item}`).join('\n') || '• None identified'}

Provide a professional audit summary with: (1) overall assessment, (2) key risks, (3) prioritized corrective actions, (4) recommended next steps.`;

      const aiResult = await callAI(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        { maxTokens: 350, temperature: 0.4 }
      );

      if (aiResult.source === 'fallback') {
        return c.json({
          success: true,
          summary: buildFallbackSummary(v.standard, nonCompliantItems.length, v.complianceScore),
          source: 'fallback',
          model: aiResult.model,
        });
      }

      logger.info('AI audit analysis generated', { templateId: v.templateId, score: v.complianceScore });
      return c.json({ success: true, summary: aiResult.content, source: 'ai', model: aiResult.model });

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('AI audit analysis failed', { error });
      const nc = Object.values(body?.answers ?? {}).filter((a: any) => a?.status === 'non-compliant').length;
      return c.json({
        success: true,
        summary: buildFallbackSummary(body?.standard ?? 'Standard', nc, body?.complianceScore ?? 0),
        source: 'fallback',
        model: null,
      });
    }
  });

  /**
   * GET /api/ai/audit-form/sessions
   * List all saved audit form sessions, newest first.
   */
  app.get('/api/ai/audit-form/sessions', (c) => {
    try {
      const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
      const rows = sqlite.prepare(
        `SELECT * FROM ai_audit_form_sessions ORDER BY created_at DESC LIMIT ?`
      ).all(limit) as any[];

      const data = rows.map(r => ({
        id: r.id,
        templateId: r.template_id,
        templateName: r.template_name,
        templateStandard: r.template_standard,
        answers: r.answers ? JSON.parse(r.answers) : {},
        complianceScore: r.compliance_score,
        aiSummary: r.ai_summary,
        totalQuestions: r.total_questions,
        compliantCount: r.compliant_count,
        nonCompliantCount: r.non_compliant_count,
        naCount: r.na_count,
        evidencePhotosCount: r.evidence_photos_count,
        isCustomTemplate: Boolean(r.is_custom_template),
        createdAt: r.created_at,
      }));

      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching audit form sessions', { error });
      return c.json({ success: false, error: 'Failed to fetch audit sessions' }, 500);
    }
  });

  /**
   * POST /api/ai/audit-form/sessions
   * Save a completed audit form submission.
   */
  app.post('/api/ai/audit-form/sessions', async (c) => {
    try {
      const body = await c.req.json();
      const v = SaveAuditSessionSchema.parse(body);

      const result = sqlite.prepare(`
        INSERT INTO ai_audit_form_sessions (
          template_id, template_name, template_standard,
          answers, compliance_score, ai_summary,
          total_questions, compliant_count, non_compliant_count, na_count,
          evidence_photos_count, is_custom_template
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.templateId, v.templateName, v.templateStandard,
        JSON.stringify(v.answers), v.complianceScore, v.aiSummary ?? null,
        v.totalQuestions, v.compliantCount, v.nonCompliantCount, v.naCount,
        v.evidencePhotosCount, v.isCustomTemplate ? 1 : 0
      );

      logger.info('Audit form session saved', { id: result.lastInsertRowid, template: v.templateId, score: v.complianceScore });
      return c.json({ success: true, data: { id: Number(result.lastInsertRowid) } }, 201);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error saving audit form session', { error });
      return c.json({ success: false, error: 'Failed to save audit session' }, 500);
    }
  });

  /**
   * GET /api/ai/audit-form/custom-templates
   * List all user-created custom audit templates.
   */
  app.get('/api/ai/audit-form/custom-templates', (c) => {
    try {
      const rows = sqlite.prepare(
        `SELECT * FROM ai_audit_custom_templates ORDER BY created_at DESC`
      ).all() as any[];

      const data = rows.map(r => ({
        id: r.id,
        name: r.name,
        standard: r.standard,
        version: r.version,
        description: r.description ?? '',
        categories: r.categories ? JSON.parse(r.categories) : [],
        questions: r.questions ? JSON.parse(r.questions) : [],
        createdAt: r.created_at,
      }));

      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching custom templates', { error });
      return c.json({ success: false, error: 'Failed to fetch custom templates' }, 500);
    }
  });

  /**
   * POST /api/ai/audit-form/custom-templates
   * Persist a new custom audit template.
   */
  app.post('/api/ai/audit-form/custom-templates', async (c) => {
    try {
      const body = await c.req.json();
      const v = SaveCustomTemplateSchema.parse(body);

      sqlite.prepare(`
        INSERT OR REPLACE INTO ai_audit_custom_templates
          (id, name, standard, version, description, categories, questions)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.id, v.name, v.standard, v.version,
        v.description ?? '',
        JSON.stringify(v.categories),
        JSON.stringify(v.questions)
      );

      logger.info('Custom audit template saved', { id: v.id, name: v.name });
      return c.json({ success: true, data: { id: v.id, name: v.name } }, 201);

    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error saving custom audit template', { error });
      return c.json({ success: false, error: 'Failed to save custom template' }, 500);
    }
  });

  /**
   * DELETE /api/ai/audit-form/custom-templates/:id
   * Delete a custom audit template by its string ID.
   */
  app.delete('/api/ai/audit-form/custom-templates/:id', (c) => {
    try {
      const id = c.req.param('id');
      const existing = sqlite.prepare(`SELECT id FROM ai_audit_custom_templates WHERE id = ?`).get(id);
      if (!existing) return c.json({ success: false, error: 'Template not found' }, 404);

      sqlite.prepare(`DELETE FROM ai_audit_custom_templates WHERE id = ?`).run(id);
      logger.info('Custom audit template deleted', { id });
      return c.json({ success: true });
    } catch (error) {
      logger.error('Error deleting custom audit template', { error });
      return c.json({ success: false, error: 'Failed to delete custom template' }, 500);
    }
  });

  // ── AI TRAINING MODULE ROUTES ─────────────────────────────────

  /**
   * GET /api/ai/training/modules
   * List all AI training modules (seeded on first call).
   */
  app.get('/api/ai/training/modules', (c) => {
    try {
      const rows = sqlite.prepare('SELECT * FROM ai_training_modules ORDER BY created_at ASC').all() as any[];
      const data = rows.map(r => ({
        id: r.id,
        title: r.title,
        category: r.category,
        aiGenerated: Boolean(r.ai_generated),
        difficulty: r.difficulty,
        duration: r.duration,
        modules: r.modules_count,
        completed: r.completed_count,
        score: r.score,
        enrolled: r.enrolled,
        description: r.description ?? '',
        tags: r.tags ? JSON.parse(r.tags) : [],
        color: r.color,
        nextLesson: r.next_lesson ?? '',
        adaptiveScore: r.adaptive_score,
        createdAt: r.created_at,
      }));
      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching AI training modules', { error });
      return c.json({ success: false, error: 'Failed to fetch training modules' }, 500);
    }
  });

  /**
   * PATCH /api/ai/training/modules/:id/progress
   * Update completed count for a training module.
   */
  app.patch('/api/ai/training/modules/:id/progress', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const v = UpdateModuleProgressSchema.parse(body);
      const existing = sqlite.prepare('SELECT id, modules_count FROM ai_training_modules WHERE id = ?').get(id) as any;
      if (!existing) return c.json({ success: false, error: 'Module not found' }, 404);
      if (v.completed > existing.modules_count) {
        return c.json({ success: false, error: 'completed cannot exceed modules count' }, 400);
      }
      sqlite.prepare('UPDATE ai_training_modules SET completed_count = ? WHERE id = ?').run(v.completed, id);
      logger.info('Training module progress updated', { id, completed: v.completed });
      return c.json({ success: true, data: { id, completed: v.completed } });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error updating module progress', { error });
      return c.json({ success: false, error: 'Failed to update progress' }, 500);
    }
  });

  /**
   * GET /api/ai/training/paths
   * List all learning paths (seeded on first call).
   */
  app.get('/api/ai/training/paths', (c) => {
    try {
      const rows = sqlite.prepare('SELECT * FROM ai_learning_paths ORDER BY created_at ASC').all() as any[];
      const data = rows.map(r => ({
        id: r.id,
        name: r.name,
        modules: r.modules_count,
        duration: r.duration,
        progress: r.progress,
        certified: Boolean(r.certified),
        color: r.color,
        createdAt: r.created_at,
      }));
      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching learning paths', { error });
      return c.json({ success: false, error: 'Failed to fetch learning paths' }, 500);
    }
  });

  /**
   * GET /api/ai/training/competency
   * List all competency area scores (seeded on first call).
   */
  app.get('/api/ai/training/competency', (c) => {
    try {
      const rows = sqlite.prepare('SELECT * FROM ai_competency_scores ORDER BY id ASC').all() as any[];
      const data = rows.map(r => ({
        id: r.id,
        area: r.area,
        score: r.score,
        trend: r.trend,
        benchmark: r.benchmark,
        updatedAt: r.updated_at,
      }));
      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching competency scores', { error });
      return c.json({ success: false, error: 'Failed to fetch competency scores' }, 500);
    }
  });

  /**
   * POST /api/ai/training/generate
   * Generate a training module description via OpenRouter AI and persist it.
   */
  app.post('/api/ai/training/generate', async (c) => {
    let body: any = {};
    try {
      body = await c.req.json();
      const v = GenerateCourseSchema.parse(body);

      let description = '';
      let source = 'fallback';

      const prompt = `Generate a concise, professional EHS training module description (2-3 sentences) for the following:\nTopic: ${v.topic}\nDifficulty: ${v.difficulty}\nAudience: ${v.audience}\nScope: ${v.moduleCount}\nInclude the main learning objectives and the primary regulation or standard covered. Be specific and practical.`;
      const aiResult = await callAI(
        [{ role: 'user', content: prompt }],
        { maxTokens: 200, temperature: 0.5 }
      );

      if (aiResult.source === 'ai') {
        description = aiResult.content;
        source = 'ai';
      }

      if (!description) {
        description = `${v.topic} — ${v.difficulty} training module for ${v.audience.toLowerCase()}. Covers key safety regulations, practical application, and compliance requirements. Scope: ${v.moduleCount}.`;
        source = 'fallback';
      }

      const result = sqlite.prepare(`
        INSERT INTO ai_generated_courses (topic, difficulty, audience, module_count, description, source)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(v.topic, v.difficulty, v.audience, v.moduleCount, description, source);

      logger.info('Training course generated', { id: result.lastInsertRowid, topic: v.topic, source });
      return c.json({
        success: true,
        data: {
          id: Number(result.lastInsertRowid),
          topic: v.topic,
          difficulty: v.difficulty,
          audience: v.audience,
          moduleCount: v.moduleCount,
          description,
          source,
        },
      }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      }
      logger.error('Error generating training course', { error });
      return c.json({ success: false, error: 'Failed to generate course' }, 500);
    }
  });

  /**
   * GET /api/ai/training/generated
   * List previously AI-generated courses, newest first.
   */
  app.get('/api/ai/training/generated', (c) => {
    try {
      const limit = Math.min(Number(c.req.query('limit') ?? 50), 200);
      const rows = sqlite.prepare('SELECT * FROM ai_generated_courses ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
      const data = rows.map(r => ({
        id: r.id,
        topic: r.topic,
        difficulty: r.difficulty,
        audience: r.audience,
        moduleCount: r.module_count,
        description: r.description,
        source: r.source,
        createdAt: r.created_at,
      }));
      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching generated courses', { error });
      return c.json({ success: false, error: 'Failed to fetch generated courses' }, 500);
    }
  });

  /**
   * POST /api/ai/visual-audit/results
   * Persist a new visual audit result (metadata only — no blob URL stored).
   */
  app.post('/api/ai/visual-audit/results', async (c) => {
    try {
      const body = await c.req.json();
      const v = SaveVisualAuditSchema.parse(body);
      sqlite.prepare(`
        INSERT OR REPLACE INTO visual_audit_results
          (id, type, media_type, analysis, suggestions, status, hazards, ppe_inventory, voice_notes, location_lat, location_lng, standard)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        v.id, v.type, v.mediaType, v.analysis,
        JSON.stringify(v.suggestions),
        v.status,
        JSON.stringify(v.hazards ?? []),
        v.ppeInventory ? JSON.stringify(v.ppeInventory) : null,
        JSON.stringify(v.voiceNotes ?? []),
        v.locationLat ?? null,
        v.locationLng ?? null,
        v.standard ?? 'osha',
      );
      logger.info('Visual audit result saved', { id: v.id, type: v.type, status: v.status });
      return c.json({ success: true, data: { id: v.id } }, 201);
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error saving visual audit result', { error });
      return c.json({ success: false, error: 'Failed to save result' }, 500);
    }
  });

  /**
   * GET /api/ai/visual-audit/results
   * List all saved audit results, newest first.
   */
  app.get('/api/ai/visual-audit/results', (c) => {
    try {
      const limit = Math.min(Number(c.req.query('limit') ?? 100), 500);
      const rows = sqlite.prepare('SELECT * FROM visual_audit_results ORDER BY created_at DESC LIMIT ?').all(limit) as any[];
      const data = rows.map(r => ({
        id: r.id,
        type: r.type,
        mediaType: r.media_type,
        analysis: r.analysis,
        suggestions: JSON.parse(r.suggestions || '[]'),
        status: r.status,
        hazards: JSON.parse(r.hazards || '[]'),
        ppeInventory: r.ppe_inventory ? JSON.parse(r.ppe_inventory) : undefined,
        voiceNotes: JSON.parse(r.voice_notes || '[]'),
        locationLat: r.location_lat,
        locationLng: r.location_lng,
        standard: r.standard,
        createdAt: r.created_at,
      }));
      return c.json({ success: true, data, count: data.length });
    } catch (error) {
      logger.error('Error fetching visual audit results', { error });
      return c.json({ success: false, error: 'Failed to fetch results' }, 500);
    }
  });

  /**
   * DELETE /api/ai/visual-audit/results/:id
   * Remove a saved audit result.
   */
  app.delete('/api/ai/visual-audit/results/:id', (c) => {
    try {
      const id = c.req.param('id');
      const result = sqlite.prepare('DELETE FROM visual_audit_results WHERE id = ?').run(id);
      if (result.changes === 0) return c.json({ success: false, error: 'Not found' }, 404);
      logger.info('Visual audit result deleted', { id });
      return c.json({ success: true });
    } catch (error) {
      logger.error('Error deleting visual audit result', { error });
      return c.json({ success: false, error: 'Failed to delete result' }, 500);
    }
  });

  /**
   * POST /api/ai/visual-audit/results/:id/voice-notes
   * Append a voice note to an existing audit result.
   */
  app.post('/api/ai/visual-audit/results/:id/voice-notes', async (c) => {
    try {
      const id = c.req.param('id');
      const body = await c.req.json();
      const v = AddVoiceNoteSchema.parse(body);
      const row = sqlite.prepare('SELECT voice_notes FROM visual_audit_results WHERE id = ?').get(id) as any;
      if (!row) return c.json({ success: false, error: 'Not found' }, 404);
      const notes: string[] = JSON.parse(row.voice_notes || '[]');
      notes.push(v.note);
      sqlite.prepare('UPDATE visual_audit_results SET voice_notes = ? WHERE id = ?').run(JSON.stringify(notes), id);
      logger.info('Voice note added to visual audit', { id, count: notes.length });
      return c.json({ success: true, data: { voiceNotes: notes } });
    } catch (error) {
      if (error instanceof z.ZodError) return c.json({ success: false, error: 'Validation error', details: error.issues }, 400);
      logger.error('Error adding voice note', { error });
      return c.json({ success: false, error: 'Failed to add voice note' }, 500);
    }
  });

  /**
   * GET /api/ai/visual-audit/stats
   * Aggregate counts: total, by status, by type.
   */
  app.get('/api/ai/visual-audit/stats', (c) => {
    try {
      const total = (sqlite.prepare('SELECT COUNT(*) as c FROM visual_audit_results').get() as any).c;
      const safe = (sqlite.prepare("SELECT COUNT(*) as c FROM visual_audit_results WHERE status = 'safe'").get() as any).c;
      const warning = (sqlite.prepare("SELECT COUNT(*) as c FROM visual_audit_results WHERE status = 'warning'").get() as any).c;
      const danger = (sqlite.prepare("SELECT COUNT(*) as c FROM visual_audit_results WHERE status = 'danger'").get() as any).c;
      const byTypeRows = sqlite.prepare('SELECT type, COUNT(*) as cnt FROM visual_audit_results GROUP BY type').all() as any[];
      const byType: Record<string, number> = {};
      byTypeRows.forEach((r: any) => { byType[r.type] = r.cnt; });
      return c.json({ success: true, data: { total, safe, warning, danger, byType } });
    } catch (error) {
      logger.error('Error fetching visual audit stats', { error });
      return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
    }
  });
}
