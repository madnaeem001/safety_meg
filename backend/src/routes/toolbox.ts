import { Hono } from 'hono';
import Database from 'better-sqlite3';
import { z } from 'zod';
import path from 'path';
import { fileURLToPath } from 'url';
import { callAI } from '../services/aiService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProdRoute = process.env.NODE_ENV === 'production' || !!process.env.RAILWAY_ENVIRONMENT;
const DB_PATH = isProdRoute ? '/data/local.sqlite' : path.join(__dirname, '../../local.sqlite');

function getDb() {
  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = OFF');
  return db;
}

function nowMs() { return Date.now(); }

function safeJson(val: any) {
  if (!val) return [];
  try { return JSON.parse(val); } catch { return []; }
}

function mapTalk(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    title: row.title,
    topic: row.topic,
    description: row.description,
    duration: row.duration,
    conductor: row.conductor,
    conductedDate: row.conducted_date,
    location: row.location,
    department: row.department,
    keyPoints: safeJson(row.key_points),
    attachments: safeJson(row.attachments),
    status: row.status,
    createdAt: row.created_at,
  };
}

function mapAttendee(row: any) {
  if (!row) return null;
  return {
    id: row.id,
    talkId: row.talk_id,
    employeeName: row.employee_name,
    employeeId: row.employee_id,
    department: row.department,
    signature: row.signature === 1,
    attendedAt: row.attended_at,
  };
}

const CreateTalkSchema = z.object({
  title: z.string().min(1),
  topic: z.enum(['safety','health','environment','emergency','general']),
  description: z.string().optional(),
  duration: z.number().int().positive().optional(),
  conductor: z.string().optional(),
  conductedDate: z.number().optional(),
  location: z.string().optional(),
  department: z.string().optional(),
  keyPoints: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional(),
  status: z.enum(['scheduled','completed','cancelled']).optional(),
});

const AttendanceSchema = z.object({
  attendees: z.array(z.object({
    employeeName: z.string().min(1),
    employeeId: z.string().optional(),
    department: z.string().optional(),
    signature: z.boolean().optional(),
  })).min(1),
});

const GenerateToolboxTalkSchema = z.object({
  industry: z.string().min(1),
  category: z.string().optional(),
  topic: z.string().min(1),
});

function buildFallbackToolboxTalk(industry: string, topic: string) {
  return {
    content: `# ${topic}\n\n## Why This Matters\n${topic} is a practical risk topic for ${industry} teams. A short pre-task briefing improves hazard awareness, aligns controls before work starts, and reinforces stop-work expectations when conditions change.\n\n## Talk Track\nWalk through where ${topic.toLowerCase()} hazards can show up, what controls must be in place before work begins, and what workers should do if something feels unsafe or incomplete. Keep the message direct and site-specific.\n\n## Key Points\n- Identify the main hazards before starting the task\n- Confirm required controls, permits, and PPE are in place\n- Pause work immediately if conditions change\n- Report near misses and unsafe conditions without delay\n\n## Safety Tips\n- Use a short pre-task scan before starting work\n- Keep communication clear between team members\n- Escalate missing controls before the task proceeds\n\n## Discussion Questions\n- Where could these hazards appear in today’s work?\n- What would make us stop the job immediately?\n- Who needs to be informed if site conditions change?`,
    keyPoints: [
      'Identify the main hazards before work starts',
      'Review controls, PPE, and permit requirements',
      'Stop work if conditions change or controls fail',
      'Escalate unsafe conditions immediately',
    ],
    safetyTips: [
      'Pause for a pre-task check before starting',
      'Use direct communication when handoffs occur',
      'Resolve missing controls before the job proceeds',
    ],
    discussionQuestions: [
      'What hazards are most likely in today’s task?',
      'What control failures would force a stop-work decision?',
      'How should the team escalate unexpected site changes?',
    ],
  };
}

function parseSection(text: string, heading: string) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`##\\s+${escaped}\\s*([\\s\\S]*?)(?=\\n##\\s+|$)`, 'i');
  return text.match(regex)?.[1]?.trim() ?? '';
}

function parseBullets(section: string) {
  return section
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*•]\s+/.test(line) || /^\d+\.\s+/.test(line))
    .map(line => line.replace(/^[-*•]\s+/, '').replace(/^\d+\.\s+/, '').trim())
    .filter(Boolean);
}

export function toolboxRoutes(app: Hono) {
  app.post('/api/toolbox-talks/ai-generate', async (c) => {
    const body = await c.req.json().catch(() => null);
    const parsed = GenerateToolboxTalkSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ success: false, error: 'Validation failed', details: parsed.error.issues }, 400);
    }

    const { industry, category, topic } = parsed.data;
    const fallback = buildFallbackToolboxTalk(industry, topic);

    try {
      const aiResult = await callAI(
        [
          {
            role: 'system',
            content: [
              'You are a senior EHS trainer writing toolbox talks for frontline teams.',
              'Return concise, field-usable markdown with these exact sections:',
              '## Why This Matters',
              '## Talk Track',
              '## Key Points',
              '## Safety Tips',
              '## Discussion Questions',
              'Use bullet points for Key Points, Safety Tips, and Discussion Questions.',
              'Do not include code fences or filler.',
            ].join(' '),
          },
          {
            role: 'user',
            content: [
              `Industry: ${industry}`,
              `Category: ${category ?? 'general_safety'}`,
              `Topic: ${topic}`,
              'Create a 10-15 minute toolbox talk for a supervisor-led daily safety briefing.',
              'Keep it practical, direct, and relevant to real site work.',
            ].join('\n'),
          },
        ],
        { maxTokens: 900, temperature: 0.5 }
      );

      const content = aiResult.source === 'fallback' ? fallback.content : aiResult.content;
      const keyPoints = parseBullets(parseSection(content, 'Key Points'));
      const safetyTips = parseBullets(parseSection(content, 'Safety Tips'));
      const discussionQuestions = parseBullets(parseSection(content, 'Discussion Questions'));

      return c.json({
        success: true,
        data: {
          topic,
          industry,
          category: category ?? 'general_safety',
          content,
          keyPoints: keyPoints.length > 0 ? keyPoints : fallback.keyPoints,
          safetyTips: safetyTips.length > 0 ? safetyTips : fallback.safetyTips,
          discussionQuestions: discussionQuestions.length > 0 ? discussionQuestions : fallback.discussionQuestions,
          source: aiResult.source,
          model: aiResult.model,
        },
      });
    } catch {
      return c.json({
        success: true,
        data: {
          topic,
          industry,
          category: category ?? 'general_safety',
          content: fallback.content,
          keyPoints: fallback.keyPoints,
          safetyTips: fallback.safetyTips,
          discussionQuestions: fallback.discussionQuestions,
          source: 'fallback',
          model: null,
        },
      });
    }
  });

  // GET /api/toolbox-talks/stats  (static, before /:id)
  app.get('/api/toolbox-talks/stats', (c) => {
    const db = getDb();
    try {
      const total = (db.prepare('SELECT COUNT(*) AS cnt FROM toolbox_talks').get() as any).cnt;
      const byStatus = db.prepare(`SELECT status, COUNT(*) AS count FROM toolbox_talks GROUP BY status`).all();
      const byTopic = db.prepare(`SELECT topic, COUNT(*) AS count FROM toolbox_talks GROUP BY topic`).all();
      const byDept = db.prepare(`
        SELECT department, COUNT(*) AS count FROM toolbox_talks
        WHERE department IS NOT NULL GROUP BY department ORDER BY count DESC LIMIT 10
      `).all();
      const totalAttendees = (db.prepare('SELECT COUNT(*) AS cnt FROM toolbox_attendance').get() as any).cnt;
      const recentTalks = db.prepare(`
        SELECT id, title, topic, conducted_date, department, status FROM toolbox_talks
        ORDER BY conducted_date DESC LIMIT 5
      `).all();
      return c.json({ success: true, data: { total, totalAttendees, byStatus, byTopic, byDept, recentTalks } });
    } finally { db.close(); }
  });

  // GET /api/toolbox-talks
  app.get('/api/toolbox-talks', (c) => {
    const db = getDb();
    try {
      const { status, topic, department, from, to } = c.req.query() as Record<string, string>;
      let sql = 'SELECT * FROM toolbox_talks WHERE 1=1';
      const params: any[] = [];
      if (status) { sql += ' AND status = ?'; params.push(status); }
      if (topic) { sql += ' AND topic = ?'; params.push(topic); }
      if (department) { sql += ' AND department = ?'; params.push(department); }
      if (from) { sql += ' AND conducted_date >= ?'; params.push(Number(from)); }
      if (to) { sql += ' AND conducted_date <= ?'; params.push(Number(to)); }
      sql += ' ORDER BY conducted_date DESC';
      const rows = db.prepare(sql).all(...params);
      // Attach attendee count
      const data = rows.map((r: any) => ({
        ...mapTalk(r),
        attendeeCount: (db.prepare('SELECT COUNT(*) AS cnt FROM toolbox_attendance WHERE talk_id=?').get(r.id) as any).cnt,
      }));
      return c.json({ success: true, data, total: rows.length });
    } finally { db.close(); }
  });

  // POST /api/toolbox-talks
  app.post('/api/toolbox-talks', async (c) => {
    const db = getDb();
    try {
      const body = await c.req.json();
      const parsed = CreateTalkSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      const now = nowMs();
      const result = db.prepare(`
        INSERT INTO toolbox_talks
          (title, topic, description, duration, conductor, conducted_date, location, department, key_points, attachments, status, created_at)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
      `).run(
        d.title, d.topic, d.description ?? null, d.duration ?? null,
        d.conductor ?? null, d.conductedDate ?? now,
        d.location ?? null, d.department ?? null,
        d.keyPoints ? JSON.stringify(d.keyPoints) : null,
        d.attachments ? JSON.stringify(d.attachments) : null,
        d.status ?? 'completed', now
      );
      const row = db.prepare('SELECT * FROM toolbox_talks WHERE id = ?').get(result.lastInsertRowid);
      return c.json({ success: true, data: mapTalk(row) }, 201);
    } finally { db.close(); }
  });

  // GET /api/toolbox-talks/:id/attendance  (static sub-route, before /:id)
  app.get('/api/toolbox-talks/:id/attendance', (c) => {
    const db = getDb();
    try {
      const talk = db.prepare('SELECT * FROM toolbox_talks WHERE id = ?').get(c.req.param('id'));
      if (!talk) return c.json({ error: 'Toolbox talk not found' }, 404);
      const attendees = db.prepare('SELECT * FROM toolbox_attendance WHERE talk_id = ? ORDER BY attended_at ASC').all(c.req.param('id'));
      return c.json({ success: true, data: { talk: mapTalk(talk), attendees: attendees.map(mapAttendee), total: attendees.length } });
    } finally { db.close(); }
  });

  // POST /api/toolbox-talks/:id/attend
  app.post('/api/toolbox-talks/:id/attend', async (c) => {
    const db = getDb();
    try {
      const talk = db.prepare('SELECT id FROM toolbox_talks WHERE id = ?').get(c.req.param('id'));
      if (!talk) return c.json({ error: 'Toolbox talk not found' }, 404);
      const body = await c.req.json();
      const parsed = AttendanceSchema.safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const now = nowMs();
      const inserted = db.transaction(() => {
        const rows = [];
        for (const a of parsed.data.attendees) {
          const result = db.prepare(`
            INSERT INTO toolbox_attendance (talk_id, employee_name, employee_id, department, signature, attended_at)
            VALUES (?,?,?,?,?,?)
          `).run(c.req.param('id'), a.employeeName, a.employeeId ?? null, a.department ?? null, a.signature ? 1 : 0, now);
          rows.push(db.prepare('SELECT * FROM toolbox_attendance WHERE id = ?').get(result.lastInsertRowid));
        }
        return rows;
      })();
      return c.json({ success: true, data: inserted.map(mapAttendee), count: inserted.length }, 201);
    } finally { db.close(); }
  });

  // GET /api/toolbox-talks/:id
  app.get('/api/toolbox-talks/:id', (c) => {
    const db = getDb();
    try {
      const row = db.prepare('SELECT * FROM toolbox_talks WHERE id = ?').get(c.req.param('id'));
      if (!row) return c.json({ error: 'Toolbox talk not found' }, 404);
      const attendees = db.prepare('SELECT * FROM toolbox_attendance WHERE talk_id = ? ORDER BY attended_at ASC').all(c.req.param('id'));
      return c.json({ success: true, data: { ...mapTalk(row), attendees: attendees.map(mapAttendee) } });
    } finally { db.close(); }
  });

  // PUT /api/toolbox-talks/:id
  app.put('/api/toolbox-talks/:id', async (c) => {
    const db = getDb();
    try {
      const existing: any = db.prepare('SELECT * FROM toolbox_talks WHERE id = ?').get(c.req.param('id'));
      if (!existing) return c.json({ error: 'Toolbox talk not found' }, 404);
      const body = await c.req.json();
      const parsed = CreateTalkSchema.partial().safeParse(body);
      if (!parsed.success) return c.json({ error: 'Validation failed', details: parsed.error.issues }, 400);
      const d = parsed.data;
      db.prepare(`
        UPDATE toolbox_talks SET
          title=?, topic=?, description=?, duration=?, conductor=?, conducted_date=?,
          location=?, department=?, key_points=?, attachments=?, status=?
        WHERE id=?
      `).run(
        d.title ?? existing.title, d.topic ?? existing.topic,
        d.description ?? existing.description, d.duration ?? existing.duration,
        d.conductor ?? existing.conductor, d.conductedDate ?? existing.conducted_date,
        d.location ?? existing.location, d.department ?? existing.department,
        d.keyPoints ? JSON.stringify(d.keyPoints) : existing.key_points,
        d.attachments ? JSON.stringify(d.attachments) : existing.attachments,
        d.status ?? existing.status, c.req.param('id')
      );
      const row = db.prepare('SELECT * FROM toolbox_talks WHERE id = ?').get(c.req.param('id'));
      return c.json({ success: true, data: mapTalk(row) });
    } finally { db.close(); }
  });
}
