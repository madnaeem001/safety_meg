import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calculator, Scale, AlertTriangle, CheckCircle2, Info,
  ChevronDown, ChevronUp, HelpCircle, Ruler, RefreshCw, ArrowLeft
} from 'lucide-react';

// Sling angle factors
const SLING_ANGLE_FACTORS: Record<number, number> = {
  90: 1.000,
  85: 1.004,
  80: 1.015,
  75: 1.035,
  70: 1.064,
  65: 1.104,
  60: 1.155,
  55: 1.221,
  50: 1.305,
  45: 1.414,
  40: 1.556,
  35: 1.743,
  30: 2.000,
};

// Sling types with working load limits (WLL) per material
const SLING_TYPES = [
  {
    id: 'wire-rope',
    label: 'Wire Rope Sling',
    materials: [
      { id: '6x19', label: '6x19 Classification', factor: 1.0 },
      { id: '6x37', label: '6x37 Classification', factor: 0.95 },
      { id: 'IWRC', label: 'IWRC Core', factor: 1.1 },
    ],
    diameters: [
      { size: '3/8"', baseSLL: 2800 },
      { size: '1/2"', baseSLL: 4900 },
      { size: '5/8"', baseSLL: 7700 },
      { size: '3/4"', baseSLL: 11100 },
      { size: '7/8"', baseSLL: 15000 },
      { size: '1"', baseSLL: 19600 },
      { size: '1-1/8"', baseSLL: 24800 },
      { size: '1-1/4"', baseSLL: 30600 },
    ],
  },
  {
    id: 'chain',
    label: 'Chain Sling (Grade 80)',
    materials: [
      { id: 'grade80', label: 'Grade 80', factor: 1.0 },
      { id: 'grade100', label: 'Grade 100', factor: 1.25 },
    ],
    diameters: [
      { size: '5/16"', baseSLL: 4500 },
      { size: '3/8"', baseSLL: 7100 },
      { size: '1/2"', baseSLL: 12000 },
      { size: '5/8"', baseSLL: 18100 },
      { size: '3/4"', baseSLL: 28300 },
      { size: '7/8"', baseSLL: 34200 },
      { size: '1"', baseSLL: 47700 },
    ],
  },
  {
    id: 'synthetic-web',
    label: 'Synthetic Web Sling',
    materials: [
      { id: 'nylon', label: 'Nylon', factor: 1.0 },
      { id: 'polyester', label: 'Polyester', factor: 0.9 },
    ],
    diameters: [
      { size: '1" x 1-ply', baseSLL: 1600 },
      { size: '2" x 1-ply', baseSLL: 3200 },
      { size: '3" x 1-ply', baseSLL: 4800 },
      { size: '4" x 1-ply', baseSLL: 6400 },
      { size: '4" x 2-ply', baseSLL: 12800 },
      { size: '6" x 2-ply', baseSLL: 19200 },
    ],
  },
  {
    id: 'synthetic-round',
    label: 'Synthetic Round Sling',
    materials: [
      { id: 'standard', label: 'Standard', factor: 1.0 },
      { id: 'high-performance', label: 'High Performance', factor: 1.2 },
    ],
    diameters: [
      { size: 'Purple (2,600 lbs)', baseSLL: 2600 },
      { size: 'Green (5,300 lbs)', baseSLL: 5300 },
      { size: 'Yellow (8,400 lbs)', baseSLL: 8400 },
      { size: 'Tan (10,600 lbs)', baseSLL: 10600 },
      { size: 'Red (13,200 lbs)', baseSLL: 13200 },
      { size: 'White (16,800 lbs)', baseSLL: 16800 },
      { size: 'Blue (21,200 lbs)', baseSLL: 21200 },
      { size: 'Orange (31,000 lbs)', baseSLL: 31000 },
    ],
  },
];

// Hitch types with efficiency factors
const HITCH_TYPES = [
  { id: 'vertical', label: 'Vertical (Single Leg)', factor: 1.0, description: 'Load supported by single vertical sling' },
  { id: 'choker', label: 'Choker Hitch', factor: 0.75, description: 'Sling wrapped around load' },
  { id: 'basket', label: 'Basket Hitch', factor: 2.0, description: 'Both eyes attached to hook, load in bight' },
  { id: 'double-wrap-choker', label: 'Double Wrap Choker', factor: 0.80, description: 'Increased surface contact' },
];

// Number of legs options
const LEG_OPTIONS = [
  { id: 1, label: '1 Leg', factor: 1 },
  { id: 2, label: '2 Legs', factor: 2 },
  { id: 3, label: '3 Legs', factor: 2.5 },
  { id: 4, label: '4 Legs', factor: 3 },
];

interface RiggingCalculatorProps {
  onNavigate?: (route: string) => void;
  onBack?: () => void;
}

export const RiggingCalculator: React.FC<RiggingCalculatorProps> = ({ onBack }) => {
  const [slingType, setSlingType] = useState<string>('wire-rope');
  const [material, setMaterial] = useState<string>('');
  const [diameter, setDiameter] = useState<string>('');
  const [hitchType, setHitchType] = useState<string>('vertical');
  const [numLegs, setNumLegs] = useState<number>(1);
  const [slingAngle, setSlingAngle] = useState<number>(60);
  const [loadWeight, setLoadWeight] = useState<string>('');
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [safetyFactor, setSafetyFactor] = useState<number>(5);

  // Get current sling type data
  const currentSlingType = useMemo(() => {
    return SLING_TYPES.find(s => s.id === slingType);
  }, [slingType]);

  // Get current material factor
  const currentMaterialFactor = useMemo(() => {
    if (!currentSlingType || !material) return 1;
    const mat = currentSlingType.materials.find(m => m.id === material);
    return mat?.factor || 1;
  }, [currentSlingType, material]);

  // Get base sling load limit
  const baseSLL = useMemo(() => {
    if (!currentSlingType || !diameter) return 0;
    const dia = currentSlingType.diameters.find(d => d.size === diameter);
    return dia?.baseSLL || 0;
  }, [currentSlingType, diameter]);

  // Get hitch factor
  const hitchFactor = useMemo(() => {
    const hitch = HITCH_TYPES.find(h => h.id === hitchType);
    return hitch?.factor || 1;
  }, [hitchType]);

  // Get angle factor (interpolate if needed)
  const angleFactor = useMemo(() => {
    // Find exact match or interpolate
    if (SLING_ANGLE_FACTORS[slingAngle]) {
      return SLING_ANGLE_FACTORS[slingAngle];
    }
    // Simple linear interpolation
    const angles = Object.keys(SLING_ANGLE_FACTORS).map(Number).sort((a, b) => b - a);
    for (let i = 0; i < angles.length - 1; i++) {
      if (slingAngle < angles[i] && slingAngle > angles[i + 1]) {
        const ratio = (angles[i] - slingAngle) / (angles[i] - angles[i + 1]);
        return SLING_ANGLE_FACTORS[angles[i]] + ratio * (SLING_ANGLE_FACTORS[angles[i + 1]] - SLING_ANGLE_FACTORS[angles[i]]);
      }
    }
    return 1;
  }, [slingAngle]);

  // Get legs factor
  const legsFactor = useMemo(() => {
    const leg = LEG_OPTIONS.find(l => l.id === numLegs);
    return leg?.factor || 1;
  }, [numLegs]);

  // Calculate Working Load Limit (WLL)
  const calculatedWLL = useMemo(() => {
    if (!baseSLL) return 0;
    // WLL = Base SLL × Material Factor × Hitch Factor × Legs Factor ÷ Angle Factor
    return Math.round((baseSLL * currentMaterialFactor * hitchFactor * legsFactor) / angleFactor);
  }, [baseSLL, currentMaterialFactor, hitchFactor, legsFactor, angleFactor]);

  // Calculate capacity utilization
  const capacityUtilization = useMemo(() => {
    const weight = parseFloat(loadWeight) || 0;
    if (!calculatedWLL || !weight) return 0;
    return Math.round((weight / calculatedWLL) * 100);
  }, [loadWeight, calculatedWLL]);

  // Determine safety status
  const safetyStatus = useMemo(() => {
    if (!calculatedWLL || !loadWeight) return 'unknown';
    const weight = parseFloat(loadWeight) || 0;
    if (weight > calculatedWLL) return 'danger';
    if (capacityUtilization > 80) return 'warning';
    return 'safe';
  }, [calculatedWLL, loadWeight, capacityUtilization]);

  const resetCalculator = () => {
    setSlingType('wire-rope');
    setMaterial('');
    setDiameter('');
    setHitchType('vertical');
    setNumLegs(1);
    setSlingAngle(60);
    setLoadWeight('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="p-2 hover:bg-surface-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-surface-600" />
            </button>
          )}
          <div>
            <h2 className="text-xl font-bold text-brand-900 flex items-center gap-2">
              <Calculator className="w-6 h-6 text-brand-500" />
              AI Rigging Load Calculator
            </h2>
            <p className="text-sm text-surface-500">Calculate Working Load Limits for rigging configurations</p>
          </div>
        </div>
        <button
          onClick={resetCalculator}
          className="px-3 py-2 bg-surface-100 text-surface-600 font-medium rounded-xl hover:bg-surface-200 transition-colors flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Important Notice */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <p className="font-semibold mb-1">Critical Safety Information</p>
          <p>This calculator provides estimates only. Always verify with manufacturer load charts and consult a qualified rigger. Never exceed rated capacity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sling Configuration */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft p-6 space-y-4">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <Ruler className="w-5 h-5 text-brand-500" />
              Sling Configuration
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Sling Type</label>
                <select
                  value={slingType}
                  onChange={(e) => {
                    setSlingType(e.target.value);
                    setMaterial('');
                    setDiameter('');
                  }}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  {SLING_TYPES.map(type => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Material / Grade</label>
                <select
                  value={material}
                  onChange={(e) => setMaterial(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="">Select Material</option>
                  {currentSlingType?.materials.map(mat => (
                    <option key={mat.id} value={mat.id}>{mat.label}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Size / Diameter</label>
                <select
                  value={diameter}
                  onChange={(e) => setDiameter(e.target.value)}
                  className="w-full px-3 py-2.5 bg-surface-50 border border-surface-100 rounded-xl text-sm"
                >
                  <option value="">Select Size</option>
                  {currentSlingType?.diameters.map(dia => (
                    <option key={dia.size} value={dia.size}>{dia.size} - {dia.baseSLL.toLocaleString()} lbs base</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-surface-400 uppercase">Number of Legs</label>
                <div className="flex gap-2">
                  {LEG_OPTIONS.map(leg => (
                    <button
                      key={leg.id}
                      type="button"
                      onClick={() => setNumLegs(leg.id)}
                      className={`flex-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        numLegs === leg.id
                          ? 'bg-brand-500 text-white'
                          : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
                      }`}
                    >
                      {leg.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Hitch Configuration */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft p-6 space-y-4">
            <h3 className="font-bold text-brand-900">Hitch Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {HITCH_TYPES.map(hitch => (
                <button
                  key={hitch.id}
                  type="button"
                  onClick={() => setHitchType(hitch.id)}
                  className={`p-3 rounded-xl text-left transition-colors ${
                    hitchType === hitch.id
                      ? 'bg-brand-50 border-2 border-brand-500'
                      : 'bg-surface-50 border border-surface-100 hover:bg-surface-100'
                  }`}
                >
                  <p className="font-semibold text-sm text-surface-800">{hitch.label}</p>
                  <p className="text-xs text-surface-500 mt-1">Factor: {hitch.factor}x</p>
                </button>
              ))}
            </div>
          </div>

          {/* Sling Angle */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-brand-900">Sling Angle</h3>
              <div className="flex items-center gap-2">
                <span className={`text-2xl font-bold ${
                  slingAngle < 30 ? 'text-red-600' : slingAngle < 45 ? 'text-amber-600' : 'text-green-600'
                }`}>
                  {slingAngle}°
                </span>
              </div>
            </div>

            <input
              type="range"
              min="30"
              max="90"
              step="5"
              value={slingAngle}
              onChange={(e) => setSlingAngle(parseInt(e.target.value))}
              className="w-full h-2 bg-gradient-to-r from-red-400 via-amber-400 to-green-400 rounded-lg appearance-none cursor-pointer"
            />

            <div className="flex justify-between text-xs text-surface-500">
              <span>30° (Dangerous)</span>
              <span>45° (Minimum Recommended)</span>
              <span>90° (Optimal)</span>
            </div>

            {slingAngle < 45 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-red-700">
                  <strong>Warning:</strong> Sling angles below 45° significantly increase load on individual legs and hardware. Not recommended.
                </p>
              </div>
            )}
          </div>

          {/* Load Weight Input */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft p-6 space-y-4">
            <h3 className="font-bold text-brand-900 flex items-center gap-2">
              <Scale className="w-5 h-5 text-brand-500" />
              Load Information
            </h3>
            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase">Load Weight (lbs)</label>
              <input
                type="number"
                placeholder="Enter load weight"
                value={loadWeight}
                onChange={(e) => setLoadWeight(e.target.value)}
                className="w-full px-4 py-3 bg-surface-50 border border-surface-100 rounded-xl text-lg font-semibold"
              />
            </div>
          </div>
        </div>

        {/* Results Section */}
        <div className="space-y-4">
          {/* Main Result Card */}
          <div className={`rounded-2xl p-6 border-2 ${
            safetyStatus === 'danger' ? 'bg-red-50 border-red-300' :
            safetyStatus === 'warning' ? 'bg-amber-50 border-amber-300' :
            safetyStatus === 'safe' ? 'bg-green-50 border-green-300' :
            'bg-surface-50 border-surface-200'
          }`}>
            <div className="text-center space-y-4">
              <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center ${
                safetyStatus === 'danger' ? 'bg-red-100' :
                safetyStatus === 'warning' ? 'bg-amber-100' :
                safetyStatus === 'safe' ? 'bg-green-100' :
                'bg-surface-100'
              }`}>
                {safetyStatus === 'danger' ? (
                  <AlertTriangle className="w-8 h-8 text-red-600" />
                ) : safetyStatus === 'safe' ? (
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                ) : (
                  <Scale className="w-8 h-8 text-surface-400" />
                )}
              </div>

              <div>
                <p className="text-sm font-medium text-surface-500 uppercase">Working Load Limit</p>
                <p className={`text-4xl font-bold ${
                  safetyStatus === 'danger' ? 'text-red-700' :
                  safetyStatus === 'warning' ? 'text-amber-700' :
                  safetyStatus === 'safe' ? 'text-green-700' :
                  'text-surface-800'
                }`}>
                  {calculatedWLL.toLocaleString()} <span className="text-lg">lbs</span>
                </p>
              </div>

              {loadWeight && (
                <div className="pt-4 border-t border-surface-200">
                  <p className="text-sm font-medium text-surface-500 mb-2">Capacity Utilization</p>
                  <div className="h-4 bg-surface-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        capacityUtilization > 100 ? 'bg-red-500' :
                        capacityUtilization > 80 ? 'bg-amber-500' :
                        'bg-green-500'
                      }`}
                      style={{ width: `${Math.min(capacityUtilization, 100)}%` }}
                    />
                  </div>
                  <p className={`text-2xl font-bold mt-2 ${
                    capacityUtilization > 100 ? 'text-red-600' :
                    capacityUtilization > 80 ? 'text-amber-600' :
                    'text-green-600'
                  }`}>
                    {capacityUtilization}%
                  </p>
                  {capacityUtilization > 100 && (
                    <p className="text-sm text-red-600 font-semibold mt-2">
                      ⚠️ LOAD EXCEEDS CAPACITY
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Calculation Breakdown */}
          <div className="bg-white rounded-2xl border border-surface-100 shadow-soft p-4 space-y-3">
            <h4 className="font-bold text-surface-800 text-sm">Calculation Breakdown</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-surface-500">Base Sling Rating</span>
                <span className="font-medium">{baseSLL.toLocaleString()} lbs</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Material Factor</span>
                <span className="font-medium">× {currentMaterialFactor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Hitch Factor</span>
                <span className="font-medium">× {hitchFactor.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Legs Factor ({numLegs} leg{numLegs > 1 ? 's' : ''})</span>
                <span className="font-medium">× {legsFactor.toFixed(1)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-surface-500">Angle Factor ({slingAngle}°)</span>
                <span className="font-medium">÷ {angleFactor.toFixed(3)}</span>
              </div>
              <div className="border-t border-surface-100 pt-2 flex justify-between font-bold">
                <span>Working Load Limit</span>
                <span className="text-brand-600">{calculatedWLL.toLocaleString()} lbs</span>
              </div>
            </div>
          </div>

          {/* Quick Reference */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-4">
            <h4 className="font-bold text-blue-800 text-sm flex items-center gap-2 mb-3">
              <Info className="w-4 h-4" />
              Quick Reference
            </h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Never exceed 85% of WLL</li>
              <li>• Minimum sling angle: 45°</li>
              <li>• Inspect rigging before each use</li>
              <li>• Use tag lines for load control</li>
              <li>• Weather can affect safe operations</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RiggingCalculator;
