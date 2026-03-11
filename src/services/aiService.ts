/* ================================================================
   AI SERVICE
   Centralized service for handling AI SDK calls, risk forecasting,
   and safety intelligence.
   ================================================================ */

export interface AIResponse {
  content: string;
  suggestions?: string[];
  metadata?: any;
}

export interface RiskForecast {
  overallRisk: 'Low' | 'Medium' | 'High' | 'Critical';
  topThreats: Array<{ threat: string; probability: number; impact: string }>;
  recommendations: string[];
  forecastDate: string;
  confidence: number;
  trendData: Array<{ date: string; riskLevel: number }>;
}

// Conversation history for multi-turn context
interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/** Parse SUGGESTIONS: "A", "B" from the end of the AI response */
function parseSuggestionsFromText(text: string): { clean: string; suggestions: string[] } {
  const match = text.match(/SUGGESTIONS:\s*((?:"[^"]+",?\s*)+)\s*$/im);
  if (!match) return { clean: text, suggestions: [] };

  const raw = match[1];
  const suggestions = [...raw.matchAll(/"([^"]+)"/g)].map(m => m[1]);
  const clean = text.slice(0, match.index).trimEnd();
  return { clean, suggestions };
}

const getApiBase = () => {
  const base = (import.meta as any).env?.VITE_API_BASE_URL?.trim();
  return base && base.length > 0 ? base : '/api';
};

class AIService {
  private conversationHistory: ChatMessage[] = [];
  private userMemory: Record<string, string> = {};

  private static SESSION_KEY = 'safetymeg_session_history';
  private static MEMORY_KEY  = 'safetymeg_user_memory';

  constructor() {
    // Session memory: restore conversation so page-refresh doesn't lose chat
    try {
      const s = sessionStorage.getItem(AIService.SESSION_KEY);
      if (s) this.conversationHistory = JSON.parse(s);
    } catch { /* noop */ }
    // User memory: restore facts learned about the user across sessions
    try {
      const u = localStorage.getItem(AIService.MEMORY_KEY);
      if (u) this.userMemory = JSON.parse(u);
    } catch { /* noop */ }
  }

  private saveSession() {
    try { sessionStorage.setItem(AIService.SESSION_KEY, JSON.stringify(this.conversationHistory)); } catch { /* noop */ }
  }

  private saveUserMemory() {
    try { localStorage.setItem(AIService.MEMORY_KEY, JSON.stringify(this.userMemory)); } catch { /* noop */ }
  }

  /** Extract basic facts from user messages and persist them */
  private extractFacts(msg: string) {
    const rules: Array<[RegExp, string]> = [
      [/my name is ([A-Za-z]+(?: [A-Za-z]+)*)/i, 'name'],
      [/(?:I am|I'm|call me) ([A-Za-z]+(?: [A-Za-z]+){0,2})/i, 'name'],
      [/(?:mera naam|mera name) ([A-Za-z]+(?: [A-Za-z]+)*)/i, 'name'],
      [/I(?:'m| am| work as) (?:a |an )?(.{3,50}?(?:safety|manager|engineer|officer|supervisor|inspector|coordinator|specialist)\b)/i, 'role'],
      [/I(?:'m| am) from ([A-Z][A-Za-z\s]{2,30}?)(?:\.|,|$)/i, 'location'],
      [/(?:I work at|I work for|my company is) ([A-Za-z0-9\s&]{2,40}?)(?:\.|,|$)/i, 'company'],
      [/\b(construction|manufacturing|oil and gas|chemical|mining|healthcare|logistics|warehouse|utilities|energy)\s*industry\b/i, 'industry'],
    ];
    let updated = false;
    for (const [regex, key] of rules) {
      if (this.userMemory[key]) continue;
      const m = msg.match(regex);
      if (m) { this.userMemory[key] = (m[1] || m[0]).trim().slice(0, 60); updated = true; }
    }
    if (updated) this.saveUserMemory();
  }

  private buildMemoryContext(): string {
    const e = Object.entries(this.userMemory);
    if (e.length === 0) return '';
    return e.map(([k, v]) => `${k}: ${v}`).join(' | ');
  }

  /** Read user memory (for UI display) */
  getUserMemory(): Record<string, string> { return { ...this.userMemory }; }
  /** Manually set a user memory fact */
  setUserMemoryFact(key: string, value: string) { this.userMemory[key] = value; this.saveUserMemory(); }
  /** Wipe all learned user facts */
  clearUserMemory() { this.userMemory = {}; try { localStorage.removeItem(AIService.MEMORY_KEY); } catch { /* noop */ } }

  /**
   * Sends a message to the SafetyMEG AI (OpenRouter via backend) and returns a full response.
   * Supports multi-turn conversation with history.
   */
  async chat(message: string, _context?: any): Promise<AIResponse> {
    this.extractFacts(message);
    this.conversationHistory.push({ role: 'user', content: message });

    try {
      const response = await fetch(`${getApiBase()}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.conversationHistory,
          userMemory: this.buildMemoryContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      // Collect streaming text
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        fullText += decoder.decode(value, { stream: true });
      }

      // Parse suggestions out of the response
      const { clean, suggestions } = parseSuggestionsFromText(fullText.trim());

      // Add assistant reply to history (without the SUGGESTIONS part)
      this.conversationHistory.push({ role: 'assistant', content: clean });

      // Keep history bounded (last 20 turns = 40 messages)
      if (this.conversationHistory.length > 40) {
        this.conversationHistory = this.conversationHistory.slice(-40);
      }
      this.saveSession();

      return {
        content: clean,
        suggestions: suggestions.length > 0 ? suggestions : undefined,
      };

    } catch (error) {
      console.error('[AIService] chat error:', error);

      // Graceful fallback so the UI never breaks
      return {
        content: "I'm having trouble connecting to the AI service right now. Please check your connection and try again.",
        suggestions: ['Retry', 'Report Incident', 'View Dashboard'],
      };
    }
  }

  /**
   * Streams a chat response word-by-word.
   * @param message - user's message
   * @param onChunk - called with each new text fragment as it arrives
   * @param onDone  - called once streaming is complete with final suggestions
   */
  async chatStream(
    message: string,
    onChunk: (chunk: string) => void,
    onDone: (suggestions: string[]) => void,
  ): Promise<void> {
    this.extractFacts(message);
    this.conversationHistory.push({ role: 'user', content: message });

    try {
      const response = await fetch(`${getApiBase()}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: this.conversationHistory,
          userMemory: this.buildMemoryContext(),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI service responded with ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        fullText += chunk;
        onChunk(chunk);
      }

      const { clean, suggestions } = parseSuggestionsFromText(fullText.trim());

      // Trim the SUGGESTIONS trailer from what was already streamed
      const trailer = fullText.trim().slice(clean.length);
      if (trailer.trim()) {
        // Signal caller to remove the suggestions suffix from displayed text
        onChunk('__TRIM__' + trailer);
      }

      this.conversationHistory.push({ role: 'assistant', content: clean });
      if (this.conversationHistory.length > 40) {
        this.conversationHistory = this.conversationHistory.slice(-40);
      }
      this.saveSession();

      onDone(suggestions);
    } catch (error) {
      console.error('[AIService] chatStream error:', error);
      onChunk("I'm having trouble connecting right now. Please try again.");
      onDone([]);
    }
  }

  /** Reset current session (clears chat history + sessionStorage). User memory is preserved. */
  resetConversation() {
    this.conversationHistory = [];
    try { sessionStorage.removeItem(AIService.SESSION_KEY); } catch { /* noop */ }
  }

  /**
   * Generates a risk forecast based on platform data
   */
  async generateRiskForecast(data: any): Promise<RiskForecast> {
    if (this.isSDKEnabled) {
      // Real AI SDK call for predictive analysis
      // const analysis = await ai_sdk.analyzeData(data, { task: 'risk-forecasting' });
      // return analysis;
    }

    // Fallback to simulated forecasting
    await new Promise(resolve => setTimeout(resolve, 2000));

    return {
      overallRisk: 'Medium',
      topThreats: [
        { threat: 'Heat Stress', probability: 0.75, impact: 'High' },
        { threat: 'Equipment Failure', probability: 0.45, impact: 'Critical' },
        { threat: 'PPE Non-compliance', probability: 0.30, impact: 'Medium' }
      ],
      recommendations: [
        'Increase hydration breaks for outdoor crews',
        'Schedule preventative maintenance for Crane 4',
        'Conduct spot PPE audits in Warehouse B'
      ],
      forecastDate: new Date().toISOString(),
      confidence: 0.88,
      trendData: [
        { date: '2026-01-01', riskLevel: 20 },
        { date: '2026-01-02', riskLevel: 35 },
        { date: '2026-01-03', riskLevel: 45 },
        { date: '2026-01-04', riskLevel: 40 },
        { date: '2026-01-05', riskLevel: 55 },
        { date: '2026-01-06', riskLevel: 50 },
        { date: '2026-01-07', riskLevel: 65 }
      ]
    };
  }

  /**
   * Analyzes an image for safety hazards
   */
  async analyzeImage(imageUrl: string, type: string = 'environment', standard: string = 'osha'): Promise<AIResponse> {
    // Fallback to simulated intelligence
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    let standardRef = '';
    switch (standard) {
      case 'osha': standardRef = 'OSHA 1910.132'; break;
      case 'epa': standardRef = 'EPA 40 CFR 68'; break;
      case 'niosh': standardRef = 'NIOSH Pocket Guide'; break;
      case 'iso': standardRef = 'ISO 45001:2018'; break;
      case 'ilo': standardRef = 'ILO-OSH 2001'; break;
      case 'ncr': standardRef = 'NCR-2026-004'; break;
      case 'sds': standardRef = 'SDS-GHS-V3'; break;
      case 'asme': standardRef = 'ASME B30.5'; break;
      case 'api': standardRef = 'API RP 54'; break;
      case 'robotics': standardRef = 'ANSI/RIA R15.06 / ISO 10218'; break;
      case 'nfpa': standardRef = 'NFPA 70E / NFPA 1'; break;
      case 'eu_machinery': standardRef = 'EU Machinery Directive 2006/42/EC'; break;
      case 'cal_osha': standardRef = 'Cal/OSHA Title 8 CCR §3203'; break;
      case 'bsee': standardRef = 'BSEE 30 CFR 250'; break;
      case 'ansi': standardRef = 'ANSI Z10-2019 / ANSI Z359.1'; break;
      case 'eu_framework': standardRef = 'EU Framework Directive 89/391/EEC'; break;
      case 'msha': standardRef = 'MSHA 30 CFR Parts 46-48'; break;
      case 'imo': standardRef = 'IMO SOLAS Ch. III / ISM Code'; break;
      case 'iata': standardRef = 'IATA/ICAO SMS Annex 19'; break;
      case 'who': standardRef = 'WHO/JCI Patient Safety Goals'; break;
      case 'haccp': standardRef = 'HACCP / FDA 21 CFR 117'; break;
      case 'dot': standardRef = 'DOT 49 CFR / FMCSA 395'; break;
      case 'csa': standardRef = 'CSA Z1000-14 / CSA Z462'; break;
      case 'asnzs': standardRef = 'AS/NZS ISO 45001:2018 / WHS Act 2011'; break;
      case 'nebosh': standardRef = 'UK HSE HSWA 1974 / NEBOSH NGC'; break;
      case 'gcc': standardRef = 'GCC OSHAD SF / UAE OSHMS'; break;
      default: standardRef = 'International Standards';
    }

    const responses: Record<string, AIResponse> = {
      robotics: {
        content: `[${standardRef}] Robotics safety audit complete. Analysis against ANSI/RIA R15.06-2012 and ISO 10218-1/2 identified that the collaborative robot (cobot) in Cell 3 is operating within ISO/TS 15066 force limits. However, the perimeter guarding for the industrial robot in Cell 1 lacks the required interlock verification per OSHA General Duty Clause.`,
        suggestions: [
          "Verify interlock functionality on Cell 1 perimeter gate",
          "Conduct mandatory Risk Assessment for new cobot deployment per ISO 10218-2",
          "Ensure UL 3100 compliance for automated mobile platforms in the vicinity",
          "Update safety signage to reflect collaborative workspace boundaries"
        ]
      },
      environment: {
        content: `[${standardRef}] Environment scan complete. Identified potential trip hazard near the loading dock (OSHA 1910.22) and insufficient lighting in the stairwell (ISO 45001 Clause 8.1).`,
        suggestions: [
          "Clear debris from loading dock area per OSHA guidelines",
          "Install high-intensity LED fixtures in stairwell for ISO compliance",
          "Update floor markings for pedestrian paths"
        ]
      },
      employee: {
        content: `[${standardRef}] PPE compliance check complete. 3 workers detected: 2 fully compliant, 1 missing eye protection (OSHA 1910.133).`,
        suggestions: [
          "Issue immediate verbal warning to worker in Zone B",
          "Restock safety glasses at the entrance station",
          "Conduct 5-minute toolbox talk on eye safety per NIOSH recommendations"
        ]
      },
      machine: {
        content: `[${standardRef}] Machine guarding audit complete. Guard on Press #4 is slightly misaligned (OSHA 1910.212). Emergency stop button on Lathe #2 is obstructed (ISO 13850).`,
        suggestions: [
          "Re-align safety guard on Press #4",
          "Clear area around Lathe #2 emergency stop",
          "Schedule preventative maintenance for all guarding systems"
        ]
      },
      hazard: {
        content: `[${standardRef}] General hazard detection complete. Unlabeled chemical container found in storage room (EPA 40 CFR 262). Fire extinguisher in Hallway C is past its inspection date (NFPA 10).`,
        suggestions: [
          "Label all chemical containers immediately per EPA requirements",
          "Replace or inspect fire extinguisher in Hallway C",
          "Conduct a full sweep of the storage facility"
        ]
      },
      comparison: {
        content: `[${standardRef}] Visual comparison analysis complete. Side-by-side evaluation reveals 3 notable changes since last inspection: improved floor markings (+15% visibility), corrected chemical labeling in Storage Room B, and new safety signage installed at Loading Dock C. One regression detected: fire extinguisher access blocked in Corridor 2.`,
        suggestions: [
          "Clear obstruction from fire extinguisher in Corridor 2 immediately",
          "Document improvements for compliance audit trail",
          "Schedule follow-up comparison in 14 days to verify regression fix"
        ]
      }
    };

    // Defensive fallback - guarantees every type gets a valid response
    const response = responses[type];
    if (response) return response;

    return {
      content: `[${standardRef} Compliant Analysis] The visual scan of the ${type} indicates high compliance with ${standard.toUpperCase()} safety protocols. No immediate hazards detected.`,
      suggestions: [
        `Maintain current ${standardRef} documentation`,
        `Schedule next ${standard.toUpperCase()} visual audit in 30 days`,
        "Ensure all workers are briefed on recent findings"
      ]
    };
  }

  /**
   * Analyzes a video for safety hazards and behavioral compliance
   */
  async analyzeVideo(videoUrl: string, type: string = 'environment', standard: string = 'osha'): Promise<AIResponse> {
    // Fallback to simulated intelligence
    await new Promise(resolve => setTimeout(resolve, 4000));
    
    let standardRef = '';
    switch (standard) {
      case 'osha': standardRef = 'OSHA 1910.147'; break;
      case 'epa': standardRef = 'EPA 40 CFR 112'; break;
      case 'niosh': standardRef = 'NIOSH Lifting Equation'; break;
      case 'iso': standardRef = 'ISO 45001 Clause 8.1.2'; break;
      case 'asme': standardRef = 'ASME B30.5-2021'; break;
      case 'api': standardRef = 'API RP 54 4th Ed'; break;
      case 'robotics': standardRef = 'ANSI/RIA R15.06 / ISO 10218'; break;
      case 'nfpa': standardRef = 'NFPA 70E / NFPA 1'; break;
      case 'eu_machinery': standardRef = 'EU Machinery Directive 2006/42/EC'; break;
      case 'cal_osha': standardRef = 'Cal/OSHA Title 8 CCR §5189'; break;
      case 'bsee': standardRef = 'BSEE 30 CFR 250.880'; break;
      case 'ansi': standardRef = 'ANSI Z10-2019 / ANSI Z359.1'; break;
      case 'eu_framework': standardRef = 'EU Framework Directive 89/391/EEC'; break;
      case 'msha': standardRef = 'MSHA 30 CFR Parts 46-48'; break;
      case 'imo': standardRef = 'IMO SOLAS Ch. III / ISM Code'; break;
      case 'iata': standardRef = 'IATA/ICAO SMS Annex 19'; break;
      case 'who': standardRef = 'WHO/JCI Patient Safety Goals'; break;
      case 'haccp': standardRef = 'HACCP / FDA 21 CFR 117'; break;
      case 'dot': standardRef = 'DOT 49 CFR / FMCSA 395'; break;
      case 'csa': standardRef = 'CSA Z1000-14 / CSA Z462'; break;
      case 'asnzs': standardRef = 'AS/NZS ISO 45001:2018 / WHS Act 2011'; break;
      case 'nebosh': standardRef = 'UK HSE HSWA 1974 / NEBOSH NGC'; break;
      case 'gcc': standardRef = 'GCC OSHAD SF / UAE OSHMS'; break;
      default: standardRef = 'International Safety Standards';
    }

    const responses: Record<string, AIResponse> = {
      robotics: {
        content: `[${standardRef}] Robotics video analysis complete. Collaborative robot (cobot) speed exceeds ISO/TS 15066 limits during human proximity. Industrial robot Cell 2 shows intermittent light curtain triggering without proper stop sequence.`,
        suggestions: [
          "Recalibrate cobot speed-and-separation monitoring (SSM) sensors",
          "Inspect light curtain alignment and response time in Cell 2",
          "Verify UL 3100 safety protocols for mobile robots in the workspace",
          "Review robot program for ANSI/RIA R15.06 compliance"
        ]
      },
      environment: {
        content: `[${standardRef}] Video analysis identified dynamic hazards. Forklift speed in Zone A exceeds safety limits (OSHA 1910.178). Pedestrian-vehicle separation protocols are being bypassed.`,
        suggestions: [
          "Enforce forklift speed limiters in Zone A",
          "Install physical barriers for pedestrian walkways",
          "Review traffic management plan per ISO 45001"
        ]
      },
      employee: {
        content: `[${standardRef}] Behavioral safety audit complete. Worker observed performing improper lifting technique (NIOSH Lifting Equation violation). Repetitive motion hazards detected in Line 3.`,
        suggestions: [
          "Provide ergonomic lifting training to Line 3 crew",
          "Implement mechanical lifting aids for loads > 50lbs",
          "Schedule job rotation to reduce repetitive strain"
        ]
      },
      machine: {
        content: `[${standardRef}] Dynamic machine audit complete. Conveyor belt #2 shows irregular vibration patterns. Lockout/Tagout (LOTO) procedure was not fully followed during recent jam clearing.`,
        suggestions: [
          "Audit LOTO compliance for all maintenance tasks",
          "Replace worn bearings on Conveyor #2",
          "Update LOTO training per OSHA 1910.147"
        ]
      },
      hazard: {
        content: `[${standardRef}] Video-based hazard analysis complete. Detected recurring near-miss events near Forklift Zone D — pedestrian workers entering without checking mirror. Chemical spill response drill in Lab 2 showed 45-second delay exceeding the 30-second SOP target.`,
        suggestions: [
          "Install proximity warning system in Forklift Zone D",
          "Retrain Lab 2 staff on spill response SOP",
          "Add convex mirrors at blind intersections"
        ]
      },
      comparison: {
        content: `[${standardRef}] Video comparison analysis complete. Frame-by-frame delta analysis shows improved traffic flow after new lane markings were installed in Zone A. However, worker ergonomics worsened on Assembly Line 3 — bending frequency increased 22% since last observation period.`,
        suggestions: [
          "Investigate ergonomic regression on Assembly Line 3",
          "Document Zone A traffic improvement for best-practice sharing",
          "Schedule ergonomic assessment for Assembly Line 3 workers"
        ]
      }
    };

    // Defensive fallback - guarantees every type gets a valid video response
    const response = responses[type];
    if (response) return response;

    return {
      content: `[${standardRef}] Video analysis indicates high behavioral compliance. No unsafe acts or dynamic hazards detected during the observation period.`,
      suggestions: [
        "Continue regular behavioral safety observations",
        "Recognize team for maintaining safe work practices",
        "Sync video data with monthly safety performance report"
      ]
    };
  }

  /**
   * Generates a safety training module
   */
  async generateTrainingModule(topic: string, level: string): Promise<any> {
    if (this.isSDKEnabled) {
      // Real AI SDK call for training generation
    }

    await new Promise(resolve => setTimeout(resolve, 3500));

    return {
      title: `${topic} - Safety Mastery`,
      duration: '20 mins',
      level: level.charAt(0).toUpperCase() + level.slice(1),
      modules: [
        { 
          title: 'Hazard Identification', 
          content: `In-depth analysis of potential risks when performing ${topic}. Focus on environmental factors and human error.`,
          keyPoints: ['Recognize early warning signs', 'Assess impact severity', 'Identify elimination methods']
        },
        { 
          title: 'Control Strategies', 
          content: 'Implementing the Hierarchy of Controls: Elimination, Substitution, Engineering, Administrative, and PPE.',
          keyPoints: ['Engineering vs Administrative controls', 'Proper PPE selection', 'Substitution of hazardous materials']
        },
        { 
          title: 'Emergency Response', 
          content: 'Immediate actions to take in the event of an incident. Communication protocols and first aid basics.',
          keyPoints: ['Emergency shutdown procedures', 'Evacuation routes', 'Incident reporting chain']
        }
      ],
      quiz: [
        { 
          question: `What is the first step in the Hierarchy of Controls for ${topic}?`, 
          options: ['PPE', 'Engineering Controls', 'Elimination', 'Administrative Controls'], 
          answer: 2 
        },
        { 
          question: `Which factor is most critical for ${topic} safety?`, 
          options: ['Speed', 'Situational Awareness', 'Cost', 'Tool Quality'], 
          answer: 1 
        },
        {
          question: 'When should an incident be reported?',
          options: ['End of shift', 'Next day', 'Immediately', 'Only if serious'],
          answer: 2
        }
      ],
      resources: [
        { name: 'Standard Operating Procedure (SOP)', type: 'PDF' },
        { name: 'Safety Data Sheet (SDS)', type: 'Link' },
        { name: 'Emergency Contact List', type: 'PDF' }
      ],
      certificateEnabled: true
    };
  }
}

export const aiService = new AIService();
