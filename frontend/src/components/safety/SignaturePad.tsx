import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Trash2, Check, X, Edit2 } from 'lucide-react';

interface SignaturePadProps {
  value?: string;
  onChange: (signature: string) => void;
  label?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  value,
  onChange,
  label = 'Signature',
  name = '',
  required = false,
  disabled = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);
  const [isEditing, setIsEditing] = useState(!value);
  const [lastPoint, setLastPoint] = useState<{ x: number; y: number } | null>(null);

  // Initialize canvas with existing signature
  useEffect(() => {
    if (value && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const img = new Image();
        img.onload = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          setHasSignature(true);
          setIsEditing(false);
        };
        img.src = value;
      }
    }
  }, [value]);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    // Set drawing styles
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // If there's an existing signature, redraw it
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = value;
    }
  }, [isEditing]);

  const getCoordinates = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      if (e.touches.length === 0) return null;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }, []);

  const startDrawing = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (disabled || !isEditing) return;
    e.preventDefault();
    
    const coords = getCoordinates(e);
    if (!coords) return;

    setIsDrawing(true);
    setLastPoint(coords);
    setHasSignature(true);
  }, [disabled, isEditing, getCoordinates]);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isDrawing || disabled || !isEditing) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    if (!coords || !lastPoint) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    ctx.beginPath();
    ctx.moveTo(lastPoint.x, lastPoint.y);
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();

    setLastPoint(coords);
  }, [isDrawing, disabled, isEditing, getCoordinates, lastPoint]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      setLastPoint(null);
    }
  }, [isDrawing]);

  const clearSignature = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  }, [onChange]);

  const saveSignature = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
    setIsEditing(false);
  }, [onChange]);

  const editSignature = useCallback(() => {
    setIsEditing(true);
  }, []);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-surface-400 uppercase tracking-widest">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        {name && (
          <span className="text-sm text-surface-600 font-medium">{name}</span>
        )}
      </div>

      <div className={`relative border-2 rounded-xl overflow-hidden ${
        isEditing && !disabled 
          ? 'border-brand-300 bg-white' 
          : 'border-surface-200 bg-surface-50'
      }`}>
        <canvas
          ref={canvasRef}
          className={`w-full h-32 touch-none ${disabled ? 'opacity-50' : ''}`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {/* Placeholder text */}
        {!hasSignature && isEditing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-surface-400 text-sm">Sign here</p>
          </div>
        )}

        {/* Signature line */}
        <div className="absolute bottom-4 left-4 right-4 border-b-2 border-dashed border-surface-300" />
      </div>

      {/* Action buttons */}
      <div className="flex justify-end gap-2">
        {isEditing ? (
          <>
            <motion.button
              type="button"
              onClick={clearSignature}
              disabled={disabled || !hasSignature}
              className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              whileTap={{ scale: 0.95 }}
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </motion.button>
            <motion.button
              type="button"
              onClick={saveSignature}
              disabled={disabled || !hasSignature}
              className="px-3 py-1.5 text-sm font-medium text-white bg-brand-600 rounded-lg hover:bg-brand-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
              whileTap={{ scale: 0.95 }}
            >
              <Check className="w-4 h-4" />
              Accept Signature
            </motion.button>
          </>
        ) : (
          <motion.button
            type="button"
            onClick={editSignature}
            disabled={disabled}
            className="px-3 py-1.5 text-sm font-medium text-brand-600 bg-brand-50 rounded-lg hover:bg-brand-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
            whileTap={{ scale: 0.95 }}
          >
            <Edit2 className="w-4 h-4" />
            Edit Signature
          </motion.button>
        )}
      </div>
    </div>
  );
};

// Multi-signature component for JSA approvals
interface SignatureEntry {
  id: string;
  role: string;
  name: string;
  signature: string;
  date: string;
}

interface MultiSignaturePadProps {
  signatures: SignatureEntry[];
  onSignaturesChange: (signatures: SignatureEntry[]) => void;
  roles: { id: string; label: string }[];
  disabled?: boolean;
}

export const MultiSignaturePad: React.FC<MultiSignaturePadProps> = ({
  signatures,
  onSignaturesChange,
  roles,
  disabled = false,
}) => {
  const updateSignature = (roleId: string, signature: string) => {
    const existingIndex = signatures.findIndex(s => s.role === roleId);
    const role = roles.find(r => r.id === roleId);
    
    if (existingIndex >= 0) {
      const updated = [...signatures];
      updated[existingIndex] = {
        ...updated[existingIndex],
        signature,
        date: new Date().toISOString(),
      };
      onSignaturesChange(updated);
    } else {
      onSignaturesChange([
        ...signatures,
        {
          id: `sig-${Date.now()}`,
          role: roleId,
          name: '',
          signature,
          date: new Date().toISOString(),
        },
      ]);
    }
  };

  const updateName = (roleId: string, name: string) => {
    const existingIndex = signatures.findIndex(s => s.role === roleId);
    if (existingIndex >= 0) {
      const updated = [...signatures];
      updated[existingIndex] = { ...updated[existingIndex], name };
      onSignaturesChange(updated);
    } else {
      onSignaturesChange([
        ...signatures,
        {
          id: `sig-${Date.now()}`,
          role: roleId,
          name,
          signature: '',
          date: '',
        },
      ]);
    }
  };

  return (
    <div className="space-y-6">
      {roles.map(role => {
        const sig = signatures.find(s => s.role === role.id);
        const signedDate = sig?.date ? new Date(sig.date) : null;
        
        return (
          <div key={role.id} className="bg-white p-4 rounded-xl border border-surface-100 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-surface-800">{role.label}</h4>
              {sig?.signature && signedDate && (
                <div className="flex flex-col items-end">
                  <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Signed
                  </span>
                  <span className="text-[10px] text-surface-500">
                    {signedDate.toLocaleDateString()} at {signedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-surface-400 uppercase">Print Name</label>
              <input
                type="text"
                placeholder="Enter your full name"
                value={sig?.name || ''}
                onChange={(e) => updateName(role.id, e.target.value)}
                disabled={disabled}
                className="w-full px-3 py-2 bg-surface-50 border border-surface-100 rounded-xl text-sm disabled:opacity-50"
              />
            </div>

            <SignaturePad
              value={sig?.signature || ''}
              onChange={(signature) => updateSignature(role.id, signature)}
              label="Signature"
              name={sig?.name}
              disabled={disabled}
            />

            {/* Timestamp display when signed */}
            {sig?.signature && signedDate && (
              <div className="pt-2 border-t border-surface-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-surface-400">Timestamp:</span>
                  <span className="font-mono text-surface-600 bg-surface-50 px-2 py-1 rounded">
                    {signedDate.toISOString()}
                  </span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
