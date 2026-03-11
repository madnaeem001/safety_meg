import React, { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Eraser, Check, X, Pen, RotateCcw, Download } from 'lucide-react';

interface SignatureCanvasProps {
  onSignature: (signatureData: string) => void;
  onClear?: () => void;
  width?: number;
  height?: number;
  label?: string;
  required?: boolean;
  signerName?: string;
  signerTitle?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  onSignature,
  onClear,
  width = 400,
  height = 150,
  label = 'Signature',
  required = false,
  signerName = '',
  signerTitle = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const [signatureConfirmed, setSignatureConfirmed] = useState(false);
  const [name, setName] = useState(signerName);
  const [title, setTitle] = useState(signerTitle);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.scale(dpr, dpr);
    
    // Set initial styling
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    // Draw signature line
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
  }, [width, height]);

  const getCoordinates = (e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top
      };
    }
    
    return {
      x: (e as React.MouseEvent).clientX - rect.left,
      y: (e as React.MouseEvent).clientY - rect.top
    };
  };

  const startDrawing = (e: React.TouchEvent | React.MouseEvent) => {
    if (signatureConfirmed) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || signatureConfirmed) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    const dpr = window.devicePixelRatio || 1;
    ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
    
    // Redraw signature line
    ctx.beginPath();
    ctx.setLineDash([5, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.moveTo(20, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    
    setHasSignature(false);
    setSignatureConfirmed(false);
    onClear?.();
  };

  const confirmSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const signatureData = canvas.toDataURL('image/png');
    setSignatureConfirmed(true);
    onSignature(signatureData);
  };

  const downloadSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSignature) return;

    const link = document.createElement('a');
    link.download = `signature_${new Date().toISOString().split('T')[0]}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-surface-200 p-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pen className="w-5 h-5 text-brand-600" />
          <span className="font-semibold text-brand-900">
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </span>
        </div>
        {signatureConfirmed && (
          <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-full flex items-center gap-1">
            <Check className="w-3 h-3" />
            Signed
          </span>
        )}
      </div>

      {/* Signer Info */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-medium text-surface-500">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full Name"
            className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm"
            disabled={signatureConfirmed}
          />
        </div>
        <div>
          <label className="text-xs font-medium text-surface-500">Title/Position</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Job Title"
            className="w-full px-3 py-2 bg-surface-50 border border-surface-200 rounded-lg text-sm"
            disabled={signatureConfirmed}
          />
        </div>
      </div>

      {/* Canvas */}
      <div className={`relative border-2 rounded-xl overflow-hidden ${
        signatureConfirmed ? 'border-emerald-300 bg-emerald-50/30' : 'border-surface-200 bg-white'
      }`}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className={`touch-none ${signatureConfirmed ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
          style={{ width, height }}
        />
        {!hasSignature && !signatureConfirmed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-surface-400 text-sm">Sign here</span>
          </div>
        )}
      </div>

      {/* Timestamp */}
      <div className="flex items-center justify-between text-xs text-surface-500">
        <span>Date: {new Date().toLocaleDateString()}</span>
        <span>Time: {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        {!signatureConfirmed ? (
          <>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex-1 px-4 py-2 bg-surface-100 text-surface-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-surface-200 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Clear
            </button>
            <button
              type="button"
              onClick={confirmSignature}
              disabled={!hasSignature || !name}
              className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" />
              Confirm
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={clearCanvas}
              className="flex-1 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
            >
              <X className="w-4 h-4" />
              Re-sign
            </button>
            <button
              type="button"
              onClick={downloadSignature}
              className="flex-1 px-4 py-2 bg-surface-100 text-surface-600 rounded-xl font-medium text-sm flex items-center justify-center gap-2 hover:bg-surface-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              Download
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
};

// Multi-signature panel for reports requiring multiple signatures
interface MultiSignaturePanelProps {
  signatures: {
    id: string;
    label: string;
    required: boolean;
    role: string;
  }[];
  onSignaturesChange: (signatures: Record<string, { data: string; name: string; title: string; timestamp: string }>) => void;
}

export const MultiSignaturePanel: React.FC<MultiSignaturePanelProps> = ({
  signatures,
  onSignaturesChange
}) => {
  const [signatureData, setSignatureData] = useState<Record<string, { data: string; name: string; title: string; timestamp: string }>>({});

  const handleSignature = (id: string, data: string) => {
    const newData = {
      ...signatureData,
      [id]: {
        data,
        name: '',
        title: '',
        timestamp: new Date().toISOString()
      }
    };
    setSignatureData(newData);
    onSignaturesChange(newData);
  };

  const handleClear = (id: string) => {
    const newData = { ...signatureData };
    delete newData[id];
    setSignatureData(newData);
    onSignaturesChange(newData);
  };

  return (
    <div className="space-y-4">
      <h3 className="font-bold text-brand-900 flex items-center gap-2">
        <Pen className="w-5 h-5 text-brand-600" />
        Required Signatures
      </h3>
      <div className="grid gap-4 md:grid-cols-2">
        {signatures.map(sig => (
          <SignatureCanvas
            key={sig.id}
            label={`${sig.label} (${sig.role})`}
            required={sig.required}
            onSignature={(data) => handleSignature(sig.id, data)}
            onClear={() => handleClear(sig.id)}
            width={350}
            height={120}
          />
        ))}
      </div>
    </div>
  );
};

export default SignatureCanvas;
