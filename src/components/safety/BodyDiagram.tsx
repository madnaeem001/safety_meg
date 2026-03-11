import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface BodyPart {
  id: string;
  name: string;
  path: string;
  viewBox?: string;
}

// SVG paths for body parts (front view human body)
const FRONT_BODY_PARTS: BodyPart[] = [
  { id: 'head-front', name: 'Head (Front)', path: 'M50,8 C60,8 68,16 68,28 C68,40 60,50 50,50 C40,50 32,40 32,28 C32,16 40,8 50,8 Z' },
  { id: 'neck-front', name: 'Neck (Front)', path: 'M44,50 L56,50 L56,60 L44,60 Z' },
  { id: 'left-shoulder-front', name: 'Left Shoulder (Front)', path: 'M32,60 L44,60 L44,72 L28,72 Z' },
  { id: 'right-shoulder-front', name: 'Right Shoulder (Front)', path: 'M56,60 L68,60 L72,72 L56,72 Z' },
  { id: 'chest', name: 'Chest', path: 'M35,60 L65,60 L68,90 L32,90 Z' },
  { id: 'abdomen', name: 'Abdomen', path: 'M32,90 L68,90 L66,120 L34,120 Z' },
  { id: 'left-arm-front', name: 'Left Upper Arm (Front)', path: 'M22,72 L32,72 L32,105 L22,105 Z' },
  { id: 'right-arm-front', name: 'Right Upper Arm (Front)', path: 'M68,72 L78,72 L78,105 L68,105 Z' },
  { id: 'left-forearm-front', name: 'Left Forearm (Front)', path: 'M18,105 L28,105 L28,140 L18,140 Z' },
  { id: 'right-forearm-front', name: 'Right Forearm (Front)', path: 'M72,105 L82,105 L82,140 L72,140 Z' },
  { id: 'left-hand', name: 'Left Hand', path: 'M14,140 L28,140 L28,158 L14,158 Z' },
  { id: 'right-hand', name: 'Right Hand', path: 'M72,140 L86,140 L86,158 L72,158 Z' },
  { id: 'pelvis-front', name: 'Pelvis/Hip (Front)', path: 'M34,120 L66,120 L68,145 L32,145 Z' },
  { id: 'left-thigh-front', name: 'Left Thigh (Front)', path: 'M32,145 L48,145 L46,195 L30,195 Z' },
  { id: 'right-thigh-front', name: 'Right Thigh (Front)', path: 'M52,145 L68,145 L70,195 L54,195 Z' },
  { id: 'left-knee-front', name: 'Left Knee (Front)', path: 'M30,195 L46,195 L46,210 L30,210 Z' },
  { id: 'right-knee-front', name: 'Right Knee (Front)', path: 'M54,195 L70,195 L70,210 L54,210 Z' },
  { id: 'left-shin', name: 'Left Shin', path: 'M30,210 L46,210 L44,265 L28,265 Z' },
  { id: 'right-shin', name: 'Right Shin', path: 'M54,210 L70,210 L72,265 L56,265 Z' },
  { id: 'left-foot', name: 'Left Foot', path: 'M24,265 L46,265 L46,282 L24,282 Z' },
  { id: 'right-foot', name: 'Right Foot', path: 'M54,265 L76,265 L76,282 L54,282 Z' }
];

// SVG paths for body parts (back view human body)
const BACK_BODY_PARTS: BodyPart[] = [
  { id: 'head-back', name: 'Head (Back)', path: 'M50,8 C60,8 68,16 68,28 C68,40 60,50 50,50 C40,50 32,40 32,28 C32,16 40,8 50,8 Z' },
  { id: 'neck-back', name: 'Neck (Back)', path: 'M44,50 L56,50 L56,60 L44,60 Z' },
  { id: 'left-shoulder-back', name: 'Left Shoulder (Back)', path: 'M32,60 L44,60 L44,72 L28,72 Z' },
  { id: 'right-shoulder-back', name: 'Right Shoulder (Back)', path: 'M56,60 L68,60 L72,72 L56,72 Z' },
  { id: 'upper-back', name: 'Upper Back', path: 'M35,60 L65,60 L66,90 L34,90 Z' },
  { id: 'lower-back', name: 'Lower Back', path: 'M34,90 L66,90 L66,115 L34,115 Z' },
  { id: 'left-arm-back', name: 'Left Upper Arm (Back)', path: 'M22,72 L32,72 L32,105 L22,105 Z' },
  { id: 'right-arm-back', name: 'Right Upper Arm (Back)', path: 'M68,72 L78,72 L78,105 L68,105 Z' },
  { id: 'left-forearm-back', name: 'Left Forearm (Back)', path: 'M18,105 L28,105 L28,140 L18,140 Z' },
  { id: 'right-forearm-back', name: 'Right Forearm (Back)', path: 'M72,105 L82,105 L82,140 L72,140 Z' },
  { id: 'left-elbow', name: 'Left Elbow', path: 'M20,100 L30,100 L30,112 L20,112 Z' },
  { id: 'right-elbow', name: 'Right Elbow', path: 'M70,100 L80,100 L80,112 L70,112 Z' },
  { id: 'buttocks', name: 'Buttocks', path: 'M34,115 L66,115 L68,145 L32,145 Z' },
  { id: 'left-thigh-back', name: 'Left Thigh (Back)', path: 'M32,145 L48,145 L46,195 L30,195 Z' },
  { id: 'right-thigh-back', name: 'Right Thigh (Back)', path: 'M52,145 L68,145 L70,195 L54,195 Z' },
  { id: 'left-knee-back', name: 'Left Knee (Back)', path: 'M30,195 L46,195 L46,210 L30,210 Z' },
  { id: 'right-knee-back', name: 'Right Knee (Back)', path: 'M54,195 L70,195 L70,210 L54,210 Z' },
  { id: 'left-calf', name: 'Left Calf', path: 'M30,210 L46,210 L44,265 L28,265 Z' },
  { id: 'right-calf', name: 'Right Calf', path: 'M54,210 L70,210 L72,265 L56,265 Z' },
  { id: 'left-heel', name: 'Left Heel', path: 'M24,265 L46,265 L46,282 L24,282 Z' },
  { id: 'right-heel', name: 'Right Heel', path: 'M54,265 L76,265 L76,282 L54,282 Z' }
];

// Legacy parts for backward compatibility
const LEGACY_BODY_PARTS: BodyPart[] = [
  { id: 'head', name: 'Head', path: 'M50,8 C60,8 68,16 68,28 C68,40 60,50 50,50 C40,50 32,40 32,28 C32,16 40,8 50,8 Z' },
  { id: 'neck', name: 'Neck', path: 'M44,50 L56,50 L56,60 L44,60 Z' },
  { id: 'left-shoulder', name: 'Left Shoulder', path: 'M32,60 L44,60 L44,72 L28,72 Z' },
  { id: 'right-shoulder', name: 'Right Shoulder', path: 'M56,60 L68,60 L72,72 L56,72 Z' },
  { id: 'chest', name: 'Chest', path: 'M35,60 L65,60 L68,90 L32,90 Z' },
  { id: 'abdomen', name: 'Abdomen', path: 'M32,90 L68,90 L66,120 L34,120 Z' },
  { id: 'left-arm', name: 'Left Upper Arm', path: 'M22,72 L32,72 L32,105 L22,105 Z' },
  { id: 'right-arm', name: 'Right Upper Arm', path: 'M68,72 L78,72 L78,105 L68,105 Z' },
  { id: 'left-forearm', name: 'Left Forearm', path: 'M18,105 L28,105 L28,140 L18,140 Z' },
  { id: 'right-forearm', name: 'Right Forearm', path: 'M72,105 L82,105 L82,140 L72,140 Z' },
  { id: 'left-hand', name: 'Left Hand', path: 'M14,140 L28,140 L28,158 L14,158 Z' },
  { id: 'right-hand', name: 'Right Hand', path: 'M72,140 L86,140 L86,158 L72,158 Z' },
  { id: 'pelvis', name: 'Pelvis/Hip', path: 'M34,120 L66,120 L68,145 L32,145 Z' },
  { id: 'left-thigh', name: 'Left Thigh', path: 'M32,145 L48,145 L46,195 L30,195 Z' },
  { id: 'right-thigh', name: 'Right Thigh', path: 'M52,145 L68,145 L70,195 L54,195 Z' },
  { id: 'left-knee', name: 'Left Knee', path: 'M30,195 L46,195 L46,210 L30,210 Z' },
  { id: 'right-knee', name: 'Right Knee', path: 'M54,195 L70,195 L70,210 L54,210 Z' },
  { id: 'left-shin', name: 'Left Shin', path: 'M30,210 L46,210 L44,265 L28,265 Z' },
  { id: 'right-shin', name: 'Right Shin', path: 'M54,210 L70,210 L72,265 L56,265 Z' },
  { id: 'left-foot', name: 'Left Foot', path: 'M24,265 L46,265 L46,282 L24,282 Z' },
  { id: 'right-foot', name: 'Right Foot', path: 'M54,265 L76,265 L76,282 L54,282 Z' }
];

// All body parts combined for lookup
const ALL_BODY_PARTS = [...FRONT_BODY_PARTS, ...BACK_BODY_PARTS, ...LEGACY_BODY_PARTS];

interface BodyDiagramProps {
  selectedParts: string[];
  onPartClick: (partId: string) => void;
  multiSelect?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showBothViews?: boolean;
}

const SingleBodyView: React.FC<{
  parts: BodyPart[];
  selectedParts: string[];
  onPartClick: (partId: string) => void;
  size: 'sm' | 'md' | 'lg';
  label: string;
}> = ({ parts, selectedParts, onPartClick, size, label }) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  
  const dimensions = {
    sm: { width: 100, height: 280 },
    md: { width: 150, height: 420 },
    lg: { width: 200, height: 560 }
  };

  const { width, height } = dimensions[size];

  return (
    <div className="flex flex-col items-center gap-2">
      <span className="text-xs font-bold text-surface-500 uppercase tracking-wider">{label}</span>
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 290"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id={`bodyGradient-${label}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f4f3" />
            <stop offset="100%" stopColor="#e5ebe8" />
          </linearGradient>
          <filter id={`glow-${label}`}>
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {parts.map((part) => {
          const isSelected = selectedParts.includes(part.id);
          const isHovered = hoveredPart === part.id;
          
          return (
            <motion.path
              key={part.id}
              d={part.path}
              fill={isSelected ? '#ef4444' : isHovered ? '#5a8069' : '#d1d9d5'}
              stroke={isSelected ? '#dc2626' : isHovered ? '#4a6d58' : '#a8b5af'}
              strokeWidth={isHovered || isSelected ? 1.5 : 0.8}
              className="cursor-pointer transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPartClick(part.id)}
              onMouseEnter={() => setHoveredPart(part.id)}
              onMouseLeave={() => setHoveredPart(null)}
              filter={isSelected ? `url(#glow-${label})` : undefined}
              initial={false}
              animate={{
                fill: isSelected ? '#ef4444' : isHovered ? '#5a8069' : '#d1d9d5',
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.8
              }}
            />
          );
        })}
      </svg>
      
      {hoveredPart && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] font-semibold text-brand-700 bg-white px-2 py-0.5 rounded-lg shadow-soft border border-surface-100"
        >
          {parts.find(p => p.id === hoveredPart)?.name}
        </motion.div>
      )}
    </div>
  );
};

export const BodyDiagram: React.FC<BodyDiagramProps> = ({
  selectedParts,
  onPartClick,
  multiSelect = false,
  size = 'md',
  showBothViews = false
}) => {
  const [hoveredPart, setHoveredPart] = useState<string | null>(null);
  
  const dimensions = {
    sm: { width: 120, height: 340 },
    md: { width: 180, height: 510 },
    lg: { width: 240, height: 680 }
  };

  const { width, height } = dimensions[size];

  // If showing both views, render side by side
  if (showBothViews) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="flex gap-6 items-start">
          <SingleBodyView
            parts={FRONT_BODY_PARTS}
            selectedParts={selectedParts}
            onPartClick={onPartClick}
            size={size}
            label="Front"
          />
          <SingleBodyView
            parts={BACK_BODY_PARTS}
            selectedParts={selectedParts}
            onPartClick={onPartClick}
            size={size}
            label="Back"
          />
        </div>
        
        {/* Selected Parts List */}
        {selectedParts.length > 0 && (
          <div className="flex flex-wrap gap-1 justify-center max-w-[400px]">
            {selectedParts.map(partId => {
              const part = ALL_BODY_PARTS.find(p => p.id === partId);
              return part ? (
                <span
                  key={partId}
                  className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full"
                >
                  {part.name}
                </span>
              ) : null;
            })}
          </div>
        )}
      </div>
    );
  }

  // Single view (legacy behavior using LEGACY_BODY_PARTS for backward compatibility)
  return (
    <div className="flex flex-col items-center gap-4">
      <svg
        width={width}
        height={height}
        viewBox="0 0 100 290"
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0f4f3" />
            <stop offset="100%" stopColor="#e5ebe8" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {LEGACY_BODY_PARTS.map((part) => {
          const isSelected = selectedParts.includes(part.id);
          const isHovered = hoveredPart === part.id;
          
          return (
            <motion.path
              key={part.id}
              d={part.path}
              fill={isSelected ? '#ef4444' : isHovered ? '#5a8069' : '#d1d9d5'}
              stroke={isSelected ? '#dc2626' : isHovered ? '#4a6d58' : '#a8b5af'}
              strokeWidth={isHovered || isSelected ? 1.5 : 0.8}
              className="cursor-pointer transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onPartClick(part.id)}
              onMouseEnter={() => setHoveredPart(part.id)}
              onMouseLeave={() => setHoveredPart(null)}
              filter={isSelected ? 'url(#glow)' : undefined}
              initial={false}
              animate={{
                fill: isSelected ? '#ef4444' : isHovered ? '#5a8069' : '#d1d9d5',
                opacity: isSelected ? 1 : isHovered ? 0.9 : 0.8
              }}
            />
          );
        })}
      </svg>
      
      {/* Hover Label */}
      {hoveredPart && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-semibold text-brand-700 bg-white px-3 py-1 rounded-lg shadow-soft border border-surface-100"
        >
          {LEGACY_BODY_PARTS.find(p => p.id === hoveredPart)?.name}
        </motion.div>
      )}
      
      {/* Selected Parts List */}
      {selectedParts.length > 0 && (
        <div className="flex flex-wrap gap-1 justify-center max-w-[200px]">
          {selectedParts.map(partId => {
            const part = ALL_BODY_PARTS.find(p => p.id === partId);
            return part ? (
              <span
                key={partId}
                className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold rounded-full"
              >
                {part.name}
              </span>
            ) : null;
          })}
        </div>
      )}
    </div>
  );
};

// Helper to get body part name by ID
export const getBodyPartName = (id: string): string => {
  return ALL_BODY_PARTS.find(p => p.id === id)?.name || id;
};

// Export body parts for reference
export const BODY_PARTS = LEGACY_BODY_PARTS;
export { FRONT_BODY_PARTS, BACK_BODY_PARTS, ALL_BODY_PARTS };

export default BodyDiagram;
