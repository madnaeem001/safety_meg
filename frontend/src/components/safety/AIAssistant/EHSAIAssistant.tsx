import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare, Send, Bot, User, Sparkles, AlertTriangle,
  FileText, TrendingUp, Shield, Brain, Lightbulb, X, Minimize2, Maximize2,
  ThumbsUp, ThumbsDown, Copy, RefreshCw, Zap, Globe, Wrench, Beaker, Flame
} from 'lucide-react';

// Pre-defined AI prompts/suggestions - comprehensive EHS coverage
const QUICK_PROMPTS = [
  { id: 'risk', label: 'Analyze Risk Factors', icon: AlertTriangle, category: 'analysis' },
  { id: 'compliance', label: 'Check Compliance Status', icon: Shield, category: 'compliance' },
  { id: 'incident', label: 'Incident Recommendations', icon: FileText, category: 'incidents' },
  { id: 'iso_standards', label: 'ISO Standards (45001/14001)', icon: Globe, category: 'compliance' },
  { id: 'machinery', label: 'Machinery Safety (ISO 12100)', icon: Wrench, category: 'technical' },
  { id: 'osha', label: 'OSHA Requirements', icon: Shield, category: 'compliance' },
  { id: 'chemical', label: 'Chemical Safety (GHS/SDS)', icon: Beaker, category: 'safety' },
  { id: 'fire', label: 'Fire & Life Safety (NFPA)', icon: Flame, category: 'safety' },
  { id: 'jsa', label: 'JSA Best Practices', icon: FileText, category: 'safety' },
  { id: 'ppe', label: 'PPE Selection Guide', icon: Shield, category: 'safety' },
];

// Mock AI responses based on context - expanded with more detailed responses
const AI_RESPONSES: Record<string, string[]> = {
  greeting: [
    "Hello! I'm your EHS AI Assistant, powered by advanced safety analytics. I can help you with:\n\n🔍 **Risk Analysis** - Identify hazards and mitigation strategies\n📋 **Compliance** - OSHA, ISO 45001, EPA requirements\n⚙️ **Technical Safety** - Machinery (ISO 12100), Robotics (ISO 10218)\n🧪 **Chemical Safety** - GHS classification and SDS management\n🔥 **Fire Safety** - NFPA 70, 10, 101 codes\n📊 **Analytics** - Incident trends and predictive insights\n\nWhat would you like to explore today?",
  ],
  risk: [
    "**🔍 Comprehensive Risk Analysis Report**\n\nBased on your facility's incident data and industry benchmarks:\n\n**CRITICAL RISKS (Immediate Action Required):**\n1. **Powered Industrial Trucks** - TRIR 2.3 vs industry avg 1.1\n   - 12 incidents YTD, 3 involving pedestrians\n   - Root causes: Blind spots, speed, inadequate training\n   - **Action:** Install proximity sensors, blue lights\n\n2. **Fall Hazards (Working at Height)** - 8 near-misses\n   - Locations: Mezzanine, roof access\n   - **Action:** Audit guardrails, 100% tie-off policy\n\n**HIGH RISKS:**\n3. **Chemical Exposure** - 4 exposure events\n   - PPE compliance only 78%\n   - **Action:** Enhanced ventilation, buddy system\n\n**📈 Predictive Insight:** Expect 15% increase in slip/fall during Q1 wet weather.",
  ],
  compliance: [
    "**📋 Compliance Dashboard**\n\n**OSHA Compliance (29 CFR 1910):**\n✅ Form 300 Log - Current\n✅ Form 300A - Posted\n⚠️ ITA submission - Due March 2, 2026\n✅ Emergency Action Plan - Reviewed\n⚠️ HazCom - 3 SDSs need updating\n❌ **LOTO Program Review** - Overdue 15 days\n\n**EPA Compliance:**\n✅ SWPPP Inspections - Current\n⚠️ Air Permit - Renewal due Feb 28\n\n**ISO 45001:**\n✅ Management Review - Complete\n⚠️ Internal Audit - Due this month\n\n**Compliance Score: 94%** (Target: 98%)\n\n**Priority:** Complete LOTO review immediately (avg. penalty $15,625).",
  ],
  iso_standards: [
    "**🏆 Global Management Standards (ISO)**\n\n**ISO 45001:2018** (Occupational Health & Safety)\n- Focus: Proactive hazard identification and risk mitigation.\n- Status: 85% readiness for recertification.\n\n**ISO 45003** (Psychological Health)\n- Focus: Psychosocial risks (workload, bullying, isolation).\n- Recommendation: Implement mental health first aid training.\n\n**ISO 14001:2015** (Environmental)\n- Focus: Resource efficiency and waste reduction.\n- Status: Emissions tracking active for all sites.\n\n**ISO 22000** (Food Safety)\n- Focus: Food safety management across the supply chain.\n- Status: Compliant for cafeteria and onsite catering.",
  ],
  machinery: [
    "**⚙️ Technical & Machinery Safety (ISO/IEC/ANSI)**\n\n**ISO 12100** (General Principles for Design)\n- Requirement: Conduct risk assessment during the design phase.\n- Status: All new equipment purchases require ISO 12100 certification.\n\n**IEC 60204-1** (Electrical Equipment of Machines)\n- Requirement: Safety of electrical, electronic, and programmable systems.\n- Status: Annual electrical safety audit scheduled for March.\n\n**ISO 13849** (Safety-related parts of control systems)\n- Requirement: Performance Level (PL) calculation for safety functions.\n- Status: PL 'd' achieved for all robotic cell interlocks.\n\n**ISO 10218** (Industrial Robots)\n- Requirement: Collaborative robot safety and safeguarding.\n- Status: 4 new cobots installed with speed and separation monitoring.",
  ],
  osha: [
    "**⚖️ OSHA Regulatory Intelligence**\n\n**Key Mandates:**\n• **29 CFR 1910.147 (LOTO)**: Control of hazardous energy.\n• **29 CFR 1910.134 (Respiratory)**: Fit testing and medical evals.\n• **29 CFR 1926.501 (Fall Protection)**: Required for heights > 6ft.\n• **29 CFR 1910.212 (Machine Guarding)**: Point of operation guarding.\n\n**Citation Risk:**\n| Hazard | Status | Risk | Penalty |\n|--------|--------|------|---------|\n| LOTO | Overdue | HIGH | $15,625 |\n| Fall | Compliant | LOW | $15,625 |\n| HazCom | 3 gaps | MED | $15,625 |\n\n**Recommendation:** Schedule mock OSHA audit within 30 days.",
  ],
  chemical: [
    "**🧪 Chemical Safety & Labeling (GHS)**\n\n**Globally Harmonized System (GHS):**\n- **Physical Hazards**: Flammables, explosives, pressurized gases.\n- **Health Hazards**: Acute toxicity, carcinogens, skin corrosion.\n- **Environmental Hazards**: Aquatic toxicity.\n\n**SDS Management (16-Section Standard):**\n1. Identification\n2. Hazard ID (Pictograms)\n4. First-Aid Measures\n8. Exposure Controls/PPE\n\n**Your Inventory:**\n- 452 active chemicals\n- 12 'Highly Hazardous' substances\n- 3 SDSs missing GHS Rev. 7 updates.",
  ],
  fire: [
    "**🔥 Fire and Life Safety (NFPA)**\n\n**NFPA 70 (National Electrical Code):**\n- Focus: Safe electrical installation and maintenance.\n- Status: Arc flash study completed for Substation A.\n\n**NFPA 10 (Portable Fire Extinguishers):**\n- Requirement: Monthly inspection, annual maintenance.\n- Status: 47 extinguishers inspected Jan 2026.\n\n**NFPA 101 (Life Safety Code):**\n- Focus: Egress, fire protection, and occupancy features.\n- Status: Evacuation routes updated for Warehouse B expansion.\n\n**Action:** Replace 3 expired extinguishers in the Maintenance shop.",
  ],
  jsa: [
    "**📝 Job Safety Analysis Best Practices**\n\n**JSA Development Framework:**\n\n**Step 1: Job Selection**\n- Highest incident history\n- New/modified tasks\n- High-consequence activities\n\n**Step 2: Task Breakdown**\n- 10-15 discrete steps max\n- Use action verbs\n- Include preparation/cleanup\n\n**Step 3: Hazard ID (PEME Method)**\n• **P**eople - Who could be harmed?\n• **E**quipment - What can fail?\n• **M**aterials - What are we handling?\n• **E**nvironment - What conditions?\n\n**Step 4: Control Hierarchy**\n1. Elimination\n2. Substitution\n3. Engineering\n4. Administrative\n5. PPE\n\n**Your Stats:** 147 active JSAs, 23 due for review",
  ],
  ppe: [
    "**🦺 PPE Selection Guide**\n\n**Head Protection (29 CFR 1910.135):**\n- Type I: Top impact\n- Type II: Top and side\n- Class E: Electrical (20kV)\n\n**Eye/Face (29 CFR 1910.133):**\n| Hazard | PPE Required |\n|--------|-------------|\n| Particles | Safety glasses |\n| Chemical | Goggles |\n| Welding | Shade lens + shield |\n\n**Hand Protection:**\n- Chemical: Nitrile, Butyl, Viton\n- Cut: ANSI A2-A4\n- Heat: Aluminized, Kevlar\n\n**Your Compliance:**\n- Eye: 96% ✅\n- Hand: 89% ⚠️\n- Hearing: 92% ✅\n- Respiratory: 100% ✅\n\n**Action:** Investigate hand protection gap in Assembly",
  ],
};

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  feedback?: 'positive' | 'negative';
}

interface EHSAIAssistantProps {
  isFloating?: boolean;
  onClose?: () => void;
  initialPrompt?: string;
}

export const EHSAIAssistant: React.FC<EHSAIAssistantProps> = ({
  isFloating = false,
  onClose,
  initialPrompt
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: AI_RESPONSES.greeting[0],
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text: string = inputValue) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      let responseContent = "I'm sorry, I don't have specific information on that topic yet. Would you like to speak with a safety specialist?";
      
      const lowerText = text.toLowerCase();
      if (lowerText.includes('risk') || lowerText.includes('hazard')) responseContent = AI_RESPONSES.risk[0];
      else if (lowerText.includes('compliance') || lowerText.includes('legal')) responseContent = AI_RESPONSES.compliance[0];
      else if (lowerText.includes('incident') || lowerText.includes('injury')) responseContent = AI_RESPONSES.incident[0];
      else if (lowerText.includes('trend') || lowerText.includes('analytics')) responseContent = AI_RESPONSES.trends[0];
      else if (lowerText.includes('training') || lowerText.includes('cert')) responseContent = AI_RESPONSES.training[0];
      else if (lowerText.includes('osha')) responseContent = AI_RESPONSES.osha[0];
      else if (lowerText.includes('jsa') || lowerText.includes('jha')) responseContent = AI_RESPONSES.jsa[0];
      else if (lowerText.includes('ppe') || lowerText.includes('protection')) responseContent = AI_RESPONSES.ppe[0];
      else if (lowerText.includes('emergency') || lowerText.includes('fire')) responseContent = AI_RESPONSES.emergency[0];
      else if (lowerText.includes('iso 45001') || lowerText.includes('iso standards')) responseContent = AI_RESPONSES.iso_standards[0];
      else if (lowerText.includes('machinery') || lowerText.includes('iso 12100')) responseContent = AI_RESPONSES.machinery[0];
      else if (lowerText.includes('chemical') || lowerText.includes('ghs') || lowerText.includes('sds')) responseContent = AI_RESPONSES.chemical[0];
      else if (lowerText.includes('nfpa')) responseContent = AI_RESPONSES.fire[0];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1000);
  };

  return (
    <div className={`ai-purple-theme flex flex-col h-full ${isFloating ? 'bg-slate-800' : ''}`}>
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar min-h-[300px]">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'assistant' ? 'bg-brand-500 text-white' : 'bg-slate-700 text-slate-300'
              }`}>
                {msg.role === 'assistant' ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
              </div>
              <div className={`p-3 rounded-2xl text-sm ${
                msg.role === 'assistant' 
                  ? 'bg-slate-700 text-slate-100 rounded-tl-none' 
                  : 'bg-brand-600 text-white rounded-tr-none'
              }`}>
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.content}
                </div>
                <div className={`text-[10px] mt-2 opacity-50 ${msg.role === 'user' ? 'text-right' : ''}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-700 p-3 rounded-2xl rounded-tl-none flex gap-1">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div className="p-4 border-t border-slate-700">
        <div className="flex overflow-x-auto gap-2 pb-2 no-scrollbar">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt.id}
              onClick={() => handleSend(prompt.label)}
              className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-full text-xs whitespace-nowrap transition-colors border border-slate-600"
            >
              <prompt.icon className="w-3 h-3" />
              {prompt.label}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask anything about EHS standards..."
            className="flex-1 bg-slate-900 border border-slate-700 text-white rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim()}
            className="w-10 h-10 bg-brand-600 text-white rounded-xl flex items-center justify-center hover:bg-brand-700 disabled:opacity-50 transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
