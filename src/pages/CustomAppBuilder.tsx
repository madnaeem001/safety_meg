import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import { useGenerateCustomApp, useCreateCustomApp, useUpdateCustomApp, useDeployCustomApp } from '../api/hooks/useAPIHooks';
import {
  ArrowLeft,
  Plus,
  Search,
  LayoutGrid,
  BarChart3,
  FileText,
  ClipboardCheck,
  Shield,
  AlertTriangle,
  Activity,
  Zap,
  Eye,
  Settings,
  Save,
  Rocket,
  MonitorSmartphone,
  Smartphone,
  Tablet,
  Monitor,
  Layers,
  Blocks,
  Palette,
  Database,
  Workflow,
  ChevronRight,
  X,
  GripVertical,
  Trash2,
  Copy,
  Type,
  Image as ImageIcon,
  CheckSquare,
  Calendar,
  MapPin,
  Camera,
  Signature,
  Clock,
  User,
  Users,
  Bell,
  Lock,
  Globe,
  Code2,
  Sparkles,
  PenLine,
  MoreVertical,
  Undo2,
  Redo2,
  Play,
  MousePointer2,
  RefreshCw
} from 'lucide-react';

/* ================================================================
   CUSTOM APP BUILDER
   A visual drag-and-drop interface for building purpose-built
   safety apps without coding.
   ================================================================ */

type ComponentType = 
  | 'header' 
  | 'text' 
  | 'input' 
  | 'button' 
  | 'chart' 
  | 'list' 
  | 'card' 
  | 'camera' 
  | 'signature' 
  | 'location' 
  | 'checklist';

interface AppElement {
  id: string;
  type: ComponentType;
  label: string;
  props: any;
}

const componentLibrary = [
  { type: 'header', label: 'App Header', icon: LayoutGrid, desc: 'Top navigation and title' },
  { type: 'text', label: 'Text Block', icon: Type, desc: 'Headings and paragraphs' },
  { type: 'input', label: 'Form Input', icon: PenLine, desc: 'Text, number, or email fields' },
  { type: 'checklist', label: 'Checklist', icon: CheckSquare, desc: 'Safety inspection list' },
  { type: 'camera', label: 'Photo Capture', icon: Camera, desc: 'Take and attach photos' },
  { type: 'signature', label: 'Digital Signature', icon: Signature, desc: 'Sign-off and verification' },
  { type: 'location', label: 'GPS Location', icon: MapPin, desc: 'Auto-capture coordinates' },
  { type: 'chart', label: 'Data Chart', icon: BarChart3, desc: 'Visualize safety metrics' },
  { type: 'list', label: 'Data List', icon: Layers, desc: 'Display records or tasks' },
  { type: 'button', label: 'Action Button', icon: Zap, desc: 'Trigger workflows or saves' },
];

const deviceSizes = [
  { id: 'mobile', label: 'Mobile', icon: Smartphone, width: 'w-[320px]', height: 'h-[568px]' },
  { id: 'tablet', label: 'Tablet', icon: Tablet, width: 'w-[600px]', height: 'h-[800px]' },
  { id: 'desktop', label: 'Desktop', icon: Monitor, width: 'w-full', height: 'h-full' },
];

// ── ANIMATION VARIANTS ──────────────────────────────────────────

const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ── MAIN COMPONENT ──────────────────────────────────────────────

export const CustomAppBuilder: React.FC = () => {
  const navigate = useNavigate();
  const [appName, setAppName] = useState('New Safety App');
  const [activeDevice, setActiveDevice] = useState('mobile');
  const [elements, setElements] = useState<AppElement[]>([
    { id: 'el-1', type: 'header', label: 'App Header', props: { title: 'Safety Inspection' } },
    { id: 'el-2', type: 'text', label: 'Instructions', props: { content: 'Please complete all fields below before submitting.' } },
  ]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'components' | 'layers' | 'theme'>('components');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [savedAppId, setSavedAppId] = useState<number | null>(null);

  const generateApp = useGenerateCustomApp();
  const createApp = useCreateCustomApp();
  const updateApp = useUpdateCustomApp();
  const deployApp = useDeployCustomApp();

  const addElement = (type: ComponentType, label: string) => {
    const newElement: AppElement = {
      id: `el-${Date.now()}`,
      type,
      label,
      props: {},
    };
    setElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const handleAIGenerate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const result = await generateApp.mutate(aiPrompt);
      if (result) {
        setElements(result.elements as AppElement[]);
        setAppName(result.appName);
      }
    } finally {
      setIsGenerating(false);
      setAiPrompt('');
    }
  };

  const removeElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleSaveDraft = async () => {
    const payload = { appName, elements, devicePreference: activeDevice, status: 'draft' as const };
    if (savedAppId) {
      await updateApp.mutate({ id: savedAppId, data: payload });
    } else {
      const result = await createApp.mutate(payload);
      if (result?.id) setSavedAppId(result.id);
    }
  };

  const handleDeploy = async () => {
    let id = savedAppId;
    if (!id) {
      const result = await createApp.mutate({ appName, elements, devicePreference: activeDevice, status: 'draft' as const });
      if (result?.id) { id = result.id; setSavedAppId(id); }
    } else {
      await updateApp.mutate({ id, data: { appName, elements, devicePreference: activeDevice } });
    }
    if (id) await deployApp.mutate(id);
  };

  const selectedElement = elements.find(el => el.id === selectedElementId);

  return (
    <div className="flex flex-col h-screen bg-surface-950 text-white overflow-hidden">
      {/* ── TOP NAV ─────────────────────────────────────── */}
      <header className="h-14 border-b border-surface-800 bg-surface-900 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/self-admin')}
            className="p-2 hover:bg-surface-800 rounded-lg text-surface-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="h-6 w-px bg-surface-800" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="SafetyMEG" className="w-6 h-6 object-contain" />
            </div>
            <input 
              type="text" 
              value={appName}
              onChange={(e) => setAppName(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-bold text-sm w-48"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex bg-surface-800 rounded-lg p-1 mr-4">
            {deviceSizes.map(d => (
              <button
                key={d.id}
                onClick={() => setActiveDevice(d.id)}
                className={`p-1.5 rounded-md transition-colors ${activeDevice === d.id ? 'bg-surface-700 text-brand-400' : 'text-surface-500 hover:text-surface-300'}`}
                title={d.label}
              >
                <d.icon className="w-4 h-4" />
              </button>
            ))}
          </div>
          
          <div className="flex items-center gap-1 mr-4">
            <button className="p-2 hover:bg-surface-800 rounded-lg text-surface-400" title="Undo"><Undo2 className="w-4 h-4" /></button>
            <button className="p-2 hover:bg-surface-800 rounded-lg text-surface-400" title="Redo"><Redo2 className="w-4 h-4" /></button>
          </div>

          <button className="flex items-center gap-2 px-3 py-1.5 hover:bg-surface-800 rounded-lg text-sm font-medium text-surface-300 transition-colors">
            <Eye className="w-4 h-4" />
            Preview
          </button>
          <button
            onClick={handleDeploy}
            className="flex items-center gap-2 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 rounded-lg text-sm font-bold text-white transition-colors shadow-lg shadow-brand-600/20">
            <Rocket className="w-4 h-4" />
            Deploy App
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── LEFT SIDEBAR: COMPONENTS ────────────────────── */}
        <aside className="w-72 border-r border-surface-800 bg-surface-900 flex flex-col shrink-0">
          <div className="flex border-b border-surface-800">
            {(['components', 'layers', 'theme'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-3 text-[11px] font-bold uppercase tracking-wider transition-colors ${activeTab === tab ? 'text-brand-400 border-b-2 border-brand-500' : 'text-surface-500 hover:text-surface-300'}`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {activeTab === 'components' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-3">Basic Elements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {componentLibrary.slice(0, 4).map(comp => (
                      <button
                        key={comp.type}
                        onClick={() => addElement(comp.type as ComponentType, comp.label)}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-brand-500/50 hover:bg-surface-800 transition-all group"
                      >
                        <comp.icon className="w-5 h-5 text-surface-400 group-hover:text-brand-400 mb-2" />
                        <span className="text-[10px] font-medium text-surface-300">{comp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h3 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest mb-3">Safety Features</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {componentLibrary.slice(4).map(comp => (
                      <button
                        key={comp.type}
                        onClick={() => addElement(comp.type as ComponentType, comp.label)}
                        className="flex flex-col items-center justify-center p-3 rounded-xl bg-surface-800/50 border border-surface-700/50 hover:border-brand-500/50 hover:bg-surface-800 transition-all group"
                      >
                        <comp.icon className="w-5 h-5 text-surface-400 group-hover:text-brand-400 mb-2" />
                        <span className="text-[10px] font-medium text-surface-300">{comp.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-brand-400" />
                    <span className="text-xs font-bold text-brand-400">AI App Generator</span>
                  </div>
                  <p className="text-[10px] text-surface-400 leading-relaxed mb-3">
                    Describe your app and let AI build the initial structure for you.
                  </p>
                  <textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="e.g. Forklift Daily Inspection App"
                    className="w-full bg-surface-800 border border-surface-700 rounded-lg px-2 py-1.5 text-[10px] text-white outline-none focus:border-brand-500 mb-2 resize-none"
                    rows={2}
                  />
                  <button 
                    onClick={handleAIGenerate}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="w-full py-2 bg-brand-600/20 hover:bg-brand-600/30 disabled:opacity-50 text-brand-400 text-[10px] font-bold rounded-lg transition-colors border border-brand-500/30 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <RefreshCw className="w-3 h-3 animate-spin" />
                        GENERATING...
                      </>
                    ) : (
                      'GENERATE WITH AI'
                    )}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'layers' && (
              <Reorder.Group axis="y" values={elements} onReorder={setElements} className="space-y-1">
                {elements.map(el => (
                  <Reorder.Item
                    key={el.id}
                    value={el}
                    className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${selectedElementId === el.id ? 'bg-brand-500/10 border border-brand-500/30' : 'hover:bg-surface-800 border border-transparent'}`}
                    onClick={() => setSelectedElementId(el.id)}
                  >
                    <GripVertical className="w-3 h-3 text-surface-600 shrink-0" />
                    <span className="text-xs text-surface-300 flex-1 truncate">{el.label}</span>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                      className="p-1 hover:text-red-400 text-surface-600 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </Reorder.Item>
                ))}
              </Reorder.Group>
            )}
          </div>
        </aside>

        {/* ── CANVAS: APP PREVIEW ────────────────────────── */}
        <main className="flex-1 bg-surface-950 p-8 flex items-center justify-center overflow-auto relative">
          <div className="absolute inset-0 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:24px_24px] opacity-20" />
          
          <motion.div 
            layout
            className={`bg-white rounded-[40px] border-[12px] border-surface-800 shadow-2xl overflow-hidden relative transition-all duration-500 ${deviceSizes.find(d => d.id === activeDevice)?.width} ${deviceSizes.find(d => d.id === activeDevice)?.height}`}
          >
            {/* Phone Notch */}
            {activeDevice === 'mobile' && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-surface-800 rounded-b-2xl z-20" />
            )}

            <div className="h-full w-full bg-slate-50 overflow-y-auto custom-scrollbar pt-8 pb-4">
              <Reorder.Group axis="y" values={elements} onReorder={setElements} className="px-4 space-y-4">
                {elements.map(el => (
                  <Reorder.Item
                    key={el.id}
                    value={el}
                    onClick={() => setSelectedElementId(el.id)}
                    className={`relative group cursor-pointer rounded-xl transition-all ${selectedElementId === el.id ? 'ring-2 ring-brand-500 ring-offset-2 ring-offset-slate-50' : 'hover:ring-1 hover:ring-brand-500/30'}`}
                  >
                    <CanvasElement element={el} />
                    
                    {/* Element Overlay */}
                    <div className={`absolute -top-3 -right-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ${selectedElementId === el.id ? 'opacity-100' : ''}`}>
                      <button className="p-1.5 bg-white shadow-lg rounded-lg text-surface-600 hover:text-brand-500 border border-surface-100"><Copy className="w-3 h-3" /></button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeElement(el.id); }}
                        className="p-1.5 bg-white shadow-lg rounded-lg text-surface-600 hover:text-red-500 border border-surface-100"
                      ><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </Reorder.Item>
                ))}
              </Reorder.Group>

              {elements.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
                    <Plus className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Drag components here to start building your app</p>
                </div>
              )}
            </div>
          </motion.div>
        </main>

        {/* ── RIGHT SIDEBAR: PROPERTIES ───────────────────── */}
        <aside className="w-80 border-l border-surface-800 bg-surface-900 flex flex-col shrink-0">
          <div className="p-4 border-b border-surface-800">
            <h3 className="text-xs font-bold text-white flex items-center gap-2">
              <Settings className="w-4 h-4 text-surface-400" />
              Properties
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
            {selectedElement ? (
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-surface-800/50 border border-surface-700/50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold text-brand-400 uppercase tracking-wider">Element Type</span>
                  </div>
                  <div className="text-sm font-bold text-white">{selectedElement.label}</div>
                  <div className="text-[10px] text-surface-500 mt-1">ID: {selectedElement.id}</div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-[10px] font-bold text-surface-500 uppercase tracking-widest">Configuration</h4>
                  
                  {selectedElement.type === 'header' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-surface-400">Header Title</label>
                        <input 
                          type="text" 
                          value={selectedElement.props.title || ''}
                          onChange={(e) => {
                            const newElements = [...elements];
                            const idx = newElements.findIndex(el => el.id === selectedElement.id);
                            newElements[idx].props.title = e.target.value;
                            setElements(newElements);
                          }}
                          className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500"
                        />
                      </div>
                    </div>
                  )}

                  {selectedElement.type === 'text' && (
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <label className="text-[11px] text-surface-400">Content</label>
                        <textarea 
                          rows={4}
                          value={selectedElement.props.content || ''}
                          onChange={(e) => {
                            const newElements = [...elements];
                            const idx = newElements.findIndex(el => el.id === selectedElement.id);
                            newElements[idx].props.content = e.target.value;
                            setElements(newElements);
                          }}
                          className="w-full bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 text-sm text-white outline-none focus:border-brand-500 resize-none"
                        />
                      </div>
                    </div>
                  )}

                  {/* Generic Props */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-surface-400">Visible on Mobile</label>
                      <div className="w-8 h-4 bg-brand-600 rounded-full relative cursor-pointer">
                        <div className="absolute right-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] text-surface-400">Required Field</label>
                      <div className="w-8 h-4 bg-surface-700 rounded-full relative cursor-pointer">
                        <div className="absolute left-0.5 top-0.5 w-3 h-3 bg-white rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6">
                <div className="w-12 h-12 rounded-xl bg-surface-800 flex items-center justify-center mb-4">
                  <MousePointer2 className="w-6 h-6 text-surface-600" />
                </div>
                <p className="text-surface-500 text-xs">Select an element on the canvas to edit its properties</p>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-surface-800 bg-surface-900/50">
            <button
              onClick={handleSaveDraft}
              className="w-full py-2.5 bg-surface-800 hover:bg-surface-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 border border-surface-700">
              <Save className="w-3.5 h-3.5" />
              Save Draft
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
};

// ── CANVAS ELEMENT RENDERER ─────────────────────────────────────

const CanvasElement: React.FC<{ element: AppElement }> = ({ element }) => {
  switch (element.type) {
    case 'header':
      return (
        <div className="bg-white border-b border-slate-100 p-4 flex items-center justify-between rounded-t-xl">
          <h2 className="text-lg font-bold text-slate-800">{element.props.title || 'App Header'}</h2>
          <div className="w-8 h-8 rounded-full bg-slate-100" />
        </div>
      );
    case 'text':
      return (
        <div className="p-2">
          <p className="text-sm text-slate-600 leading-relaxed">
            {element.props.content || 'Click to edit this text block.'}
          </p>
        </div>
      );
    case 'input':
      return (
        <div className="space-y-1.5 p-2">
          <label className="text-xs font-bold text-slate-700">Field Label</label>
          <div className="w-full h-10 bg-white border border-slate-200 rounded-lg px-3 flex items-center text-slate-400 text-sm">
            Enter value...
          </div>
        </div>
      );
    case 'checklist':
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-sm">
          <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Inspection Checklist</h4>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0">
              <div className="w-5 h-5 rounded border border-slate-300" />
              <span className="text-sm text-slate-600">Safety Check Item {i}</span>
            </div>
          ))}
        </div>
      );
    case 'camera':
      return (
        <div className="p-2">
          <div className="w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400">
            <Camera className="w-8 h-8" />
            <span className="text-xs font-medium">Tap to capture photo</span>
          </div>
        </div>
      );
    case 'signature':
      return (
        <div className="space-y-1.5 p-2">
          <label className="text-xs font-bold text-slate-700">Sign-off</label>
          <div className="w-full h-24 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-300 italic text-sm">
            Sign here
          </div>
        </div>
      );
    case 'location':
      return (
        <div className="p-2">
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-xs font-bold text-blue-900">GPS Location</div>
              <div className="text-[10px] text-blue-700">Auto-capturing coordinates...</div>
            </div>
          </div>
        </div>
      );
    case 'chart':
      return (
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xs font-bold text-slate-800">Safety Trends</h4>
            <BarChart3 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="flex items-end gap-2 h-24">
            {[40, 70, 45, 90, 65, 80].map((h, i) => (
              <div key={i} className="flex-1 bg-brand-500/20 rounded-t-sm relative group">
                <div className="absolute bottom-0 left-0 right-0 bg-brand-500 rounded-t-sm transition-all" style={{ height: `${h}%` }} />
              </div>
            ))}
          </div>
        </div>
      );
    case 'list':
      return (
        <div className="space-y-2 p-2">
          <h4 className="text-xs font-bold text-slate-800">Recent Records</h4>
          {[1, 2].map(i => (
            <div key={i} className="bg-white border border-slate-100 rounded-lg p-3 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-slate-50 flex items-center justify-center">
                  <FileText className="w-4 h-4 text-slate-400" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">Record #{1024 + i}</div>
                  <div className="text-[10px] text-slate-500">Feb 07, 2026</div>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-slate-300" />
            </div>
          ))}
        </div>
      );
    case 'button':
      return (
        <div className="p-2">
          <button className="w-full py-3 bg-brand-600 text-white font-bold rounded-xl shadow-lg shadow-brand-600/20">
            Submit Report
          </button>
        </div>
      );
    default:
      return null;
  }
};

export default CustomAppBuilder;
