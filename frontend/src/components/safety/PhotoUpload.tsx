import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Image, Maximize2, Trash2, Plus, CheckCircle2, AlertCircle, FileImage, Film } from 'lucide-react';

export interface UploadedFile {
  id: string;
  file: File;
  preview: string;
  name: string;
  size: string;
  type: 'image' | 'video';
  uploadProgress: number;
  status: 'uploading' | 'complete' | 'error';
  aiAnalysis?: {
    hazards: string[];
    confidence: number;
    tags: string[];
  };
}

interface PhotoUploadProps {
  title?: string;
  description?: string;
  maxFiles?: number;
  acceptVideo?: boolean;
  onFilesChange?: (files: UploadedFile[]) => void;
  compact?: boolean;
  showAIAnalysis?: boolean;
  darkMode?: boolean;
}

export const PhotoUpload: React.FC<PhotoUploadProps> = ({
  title = 'Photo & Media Upload',
  description = 'Drag and drop files or click to browse. Supports images and videos.',
  maxFiles = 20,
  acceptVideo = true,
  onFilesChange,
  compact = false,
  showAIAnalysis = true,
  darkMode = true,
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [previewFile, setPreviewFile] = useState<UploadedFile | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const generateId = () => `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const simulateAIAnalysis = (): UploadedFile['aiAnalysis'] => {
    const hazardPool = [
      'PPE Non-Compliance Detected', 'Wet Floor Hazard', 'Blocked Emergency Exit',
      'Missing Safety Signage', 'Electrical Hazard', 'Chemical Spill Risk',
      'Fall Protection Missing', 'Machine Guard Absent', 'Ergonomic Risk',
      'Fire Extinguisher Obstructed', 'No Hazards Detected', 'Trip Hazard Present'
    ];
    const tagPool = [
      'workplace', 'safety', 'audit', 'inspection', 'PPE', 'machinery',
      'chemical', 'electrical', 'construction', 'warehouse', 'office', 'outdoor'
    ];
    const numHazards = Math.floor(Math.random() * 3);
    const hazards = numHazards === 0
      ? ['No Hazards Detected']
      : Array.from({ length: numHazards }, () => hazardPool[Math.floor(Math.random() * (hazardPool.length - 1))]);
    const tags = Array.from({ length: 3 + Math.floor(Math.random() * 3) }, () => tagPool[Math.floor(Math.random() * tagPool.length)]);
    return {
      hazards: [...new Set(hazards)],
      confidence: 85 + Math.random() * 14,
      tags: [...new Set(tags)],
    };
  };

  const processFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const allowedTypes = acceptVideo
      ? ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/webm', 'video/quicktime']
      : ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    const validFiles = fileArray.filter(f => allowedTypes.includes(f.type)).slice(0, maxFiles - files.length);

    const uploads: UploadedFile[] = validFiles.map(file => ({
      id: generateId(),
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: formatFileSize(file.size),
      type: file.type.startsWith('video') ? 'video' : 'image',
      uploadProgress: 0,
      status: 'uploading' as const,
    }));

    setFiles(prev => {
      const updated = [...prev, ...uploads];
      onFilesChange?.(updated);
      return updated;
    });

    // Simulate upload progress + AI analysis
    uploads.forEach((upload) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30 + 10;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          setFiles(prev => {
            const updated = prev.map(f =>
              f.id === upload.id
                ? { ...f, uploadProgress: 100, status: 'complete' as const, aiAnalysis: showAIAnalysis ? simulateAIAnalysis() : undefined }
                : f
            );
            onFilesChange?.(updated);
            return updated;
          });
        } else {
          setFiles(prev => prev.map(f => f.id === upload.id ? { ...f, uploadProgress: Math.min(progress, 99) } : f));
        }
      }, 200 + Math.random() * 300);
    });
  }, [files.length, maxFiles, acceptVideo, onFilesChange, showAIAnalysis]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const removeFile = (id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file) URL.revokeObjectURL(file.preview);
      const updated = prev.filter(f => f.id !== id);
      onFilesChange?.(updated);
      return updated;
    });
  };

  const runAIBatchAnalysis = () => {
    setIsAnalyzing(true);
    setTimeout(() => {
      setFiles(prev => prev.map(f => ({
        ...f,
        aiAnalysis: simulateAIAnalysis(),
      })));
      setIsAnalyzing(false);
    }, 2000);
  };

  const bgClass = 'bg-surface-raised border-surface-border';
  const textClass = 'text-text-primary';
  const subtextClass = 'text-text-muted';
  const cardBg = 'bg-surface-overlay border-surface-border';

  return (
    <div className="space-y-4">
      {!compact && (
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-bold ${textClass}`}>{title}</h3>
            <p className={`text-sm ${subtextClass}`}>{description}</p>
          </div>
          <div className="flex items-center gap-2">
            {showAIAnalysis && files.length > 0 && (
              <button
                onClick={runAIBatchAnalysis}
                disabled={isAnalyzing}
                className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold rounded-xl hover:opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isAnalyzing ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full" /> : <Camera className="w-4 h-4" />}
                {isAnalyzing ? 'Analyzing...' : 'AI Scan All'}
              </button>
            )}
            <span className={`text-xs font-mono ${subtextClass}`}>{files.length}/{maxFiles}</span>
          </div>
        </div>
      )}

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragOver
            ? 'border-accent bg-accent/10 scale-[1.01]'
            : 'border-surface-border hover:border-accent/50 bg-surface-sunken'
        } ${compact ? 'p-4' : 'p-8'}`}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${isDragOver ? 'bg-accent/20' : 'bg-surface-overlay'}`}>
            <Upload className={`w-7 h-7 ${isDragOver ? 'text-accent' : 'text-text-muted'}`} />
          </div>
          {!compact && (
            <>
              <p className={`text-sm font-semibold ${textClass}`}>Drop files here or click to upload</p>
              <p className={`text-xs ${subtextClass}`}>JPG, PNG, WebP{acceptVideo ? ', MP4, WebM' : ''} • Max {maxFiles} files</p>
            </>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptVideo ? 'image/*,video/*' : 'image/*'}
          onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }}
          className="hidden"
        />
      </div>

      {/* Camera Capture Button (Mobile) */}
      <div className="flex gap-2">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            'bg-surface-raised text-text-primary hover:bg-surface-overlay border border-surface-border'
          }`}
        >
          <Camera className="w-4 h-4" />
          Take Photo
        </button>
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={(e) => { if (e.target.files) processFiles(e.target.files); e.target.value = ''; }} className="hidden" />
        <button
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
            'bg-accent text-text-onAccent hover:bg-accent/90 border border-accent/30'
          }`}
        >
          <Plus className="w-4 h-4" />
          Browse Files
        </button>
      </div>

      {/* File Grid */}
      {files.length > 0 && (
        <div className={`grid ${compact ? 'grid-cols-3 gap-2' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'}`}>
          <AnimatePresence>
            {files.map((file) => (
              <motion.div
                key={file.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`relative rounded-xl overflow-hidden border ${cardBg} group`}
              >
                {/* Preview */}
                <div className="relative aspect-square">
                  {file.type === 'image' ? (
                    <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-sunken flex items-center justify-center">
                      <Film className="w-8 h-8 text-text-muted" />
                    </div>
                  )}

                  {/* Upload Progress Overlay */}
                  {file.status === 'uploading' && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-3 border-cyan-500/30 border-t-cyan-400 animate-spin mb-2" />
                      <span className="text-xs font-bold text-white">{Math.round(file.uploadProgress)}%</span>
                    </div>
                  )}

                  {/* AI Analysis Badge */}
                  {file.aiAnalysis && file.status === 'complete' && (
                    <div className="absolute top-2 left-2">
                      {file.aiAnalysis.hazards[0] === 'No Hazards Detected' ? (
                        <div className="flex items-center gap-1 bg-emerald-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                          <CheckCircle2 className="w-3 h-3" /> SAFE
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 bg-red-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-1 rounded-lg">
                          <AlertCircle className="w-3 h-3" /> {file.aiAnalysis.hazards.length} HAZARD{file.aiAnalysis.hazards.length > 1 ? 'S' : ''}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => { e.stopPropagation(); setPreviewFile(file); }}
                      className="w-7 h-7 rounded-lg bg-black/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/80"
                    >
                      <Maximize2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); removeFile(file.id); }}
                      className="w-7 h-7 rounded-lg bg-red-500/60 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/80"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* File Info */}
                {!compact && (
                  <div className="p-2">
                    <p className="text-[10px] font-semibold truncate text-text-primary">{file.name}</p>
                    <p className={`text-[9px] ${subtextClass}`}>{file.size}</p>
                    {file.aiAnalysis && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {file.aiAnalysis.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-[8px] px-1.5 py-0.5 bg-accent/10 text-accent rounded-md font-medium">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Full Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4"
            onClick={() => setPreviewFile(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="max-w-4xl w-full max-h-[90vh] relative"
              onClick={e => e.stopPropagation()}
            >
              <button
                onClick={() => setPreviewFile(null)}
                className="absolute -top-12 right-0 w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </button>
              {previewFile.type === 'image' ? (
                <img src={previewFile.preview} alt={previewFile.name} className="w-full max-h-[80vh] object-contain rounded-2xl" />
              ) : (
                <video src={previewFile.preview} controls className="w-full max-h-[80vh] rounded-2xl" />
              )}
              {previewFile.aiAnalysis && (
                <div className="mt-4 bg-surface-raised/90 backdrop-blur-sm rounded-xl p-4 border border-surface-border">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-bold text-text-primary flex items-center gap-2">
                      <Camera className="w-4 h-4 text-accent" /> AI Analysis
                    </h4>
                    <span className="text-xs font-mono text-accent">{previewFile.aiAnalysis.confidence.toFixed(1)}% confidence</span>
                  </div>
                  <div className="space-y-2">
                    {previewFile.aiAnalysis.hazards.map((hazard, i) => (
                      <div key={i} className={`flex items-center gap-2 text-sm ${hazard === 'No Hazards Detected' ? 'text-emerald-400' : 'text-red-400'}`}>
                        {hazard === 'No Hazards Detected' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                        {hazard}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {previewFile.aiAnalysis.tags.map(tag => (
                      <span key={tag} className="text-xs px-2 py-1 bg-accent/10 text-accent rounded-lg">{tag}</span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PhotoUpload;
