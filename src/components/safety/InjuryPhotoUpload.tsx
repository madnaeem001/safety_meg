import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Camera, 
  Upload, 
  X, 
  Image as ImageIcon, 
  ZoomIn, 
  RotateCw,
  Trash2,
  Plus,
  Check,
  AlertCircle
} from 'lucide-react';

export interface InjuryPhoto {
  id: string;
  file: File;
  preview: string;
  caption: string;
  timestamp: string;
  bodyPart?: string;
}

interface InjuryPhotoUploadProps {
  photos: InjuryPhoto[];
  onPhotosChange: (photos: InjuryPhoto[]) => void;
  maxPhotos?: number;
  bodyParts?: string[];
}

export const InjuryPhotoUpload: React.FC<InjuryPhotoUploadProps> = ({
  photos,
  onPhotosChange,
  maxPhotos = 10,
  bodyParts = []
}) => {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<InjuryPhoto | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateId = () => `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  }, []);

  const processFiles = useCallback((files: FileList | null) => {
    if (!files) return;

    const newPhotos: InjuryPhoto[] = [];
    const remainingSlots = maxPhotos - photos.length;

    Array.from(files).slice(0, remainingSlots).forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newPhoto: InjuryPhoto = {
            id: generateId(),
            file,
            preview: e.target?.result as string,
            caption: '',
            timestamp: new Date().toISOString(),
            bodyPart: bodyParts.length > 0 ? bodyParts[0] : undefined
          };
          onPhotosChange([...photos, ...newPhotos, newPhoto]);
        };
        reader.readAsDataURL(file);
      }
    });
  }, [photos, maxPhotos, bodyParts, onPhotosChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    processFiles(e.dataTransfer.files);
  }, [processFiles]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processFiles(e.target.files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const startCamera = async () => {
    try {
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setShowCamera(true);
    } catch (err) {
      setCameraError('Unable to access camera. Please check permissions.');
      console.error('Camera error:', err);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const file = new File([blob], `injury-photo-${Date.now()}.jpg`, { type: 'image/jpeg' });
          const newPhoto: InjuryPhoto = {
            id: generateId(),
            file,
            preview: canvas.toDataURL('image/jpeg'),
            caption: '',
            timestamp: new Date().toISOString(),
            bodyPart: bodyParts.length > 0 ? bodyParts[0] : undefined
          };
          onPhotosChange([...photos, newPhoto]);
        }
      }, 'image/jpeg', 0.9);
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
  };

  const removePhoto = (photoId: string) => {
    onPhotosChange(photos.filter(p => p.id !== photoId));
    if (selectedPhoto?.id === photoId) {
      setSelectedPhoto(null);
    }
  };

  const updatePhotoCaption = (photoId: string, caption: string) => {
    onPhotosChange(photos.map(p => 
      p.id === photoId ? { ...p, caption } : p
    ));
  };

  const updatePhotoBodyPart = (photoId: string, bodyPart: string) => {
    onPhotosChange(photos.map(p => 
      p.id === photoId ? { ...p, bodyPart } : p
    ));
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
          isDragActive 
            ? 'border-brand-500 bg-brand-500/10' 
            : 'border-slate-600 hover:border-slate-500 bg-slate-800/50'
        } ${photos.length >= maxPhotos ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="space-y-4">
          <div className="flex justify-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-semibold transition-colors"
            >
              <Upload className="w-5 h-5" />
              Upload Photos
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startCamera}
              className="flex items-center gap-2 px-6 py-3 bg-brand-600 hover:bg-brand-500 rounded-xl text-white font-semibold transition-colors"
            >
              <Camera className="w-5 h-5" />
              Take Photo
            </motion.button>
          </div>
          <p className="text-sm text-slate-400">
            Drag and drop images here, or click to select • Max {maxPhotos} photos
          </p>
          <p className="text-xs text-slate-500">
            {photos.length} / {maxPhotos} photos uploaded
          </p>
        </div>

        {cameraError && (
          <div className="mt-4 flex items-center gap-2 text-red-400 text-sm justify-center">
            <AlertCircle className="w-4 h-4" />
            {cameraError}
          </div>
        )}
      </div>

      {/* Camera Modal */}
      <AnimatePresence>
        {showCamera && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          >
            <div className="relative max-w-2xl w-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-2xl"
              />
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={capturePhoto}
                  className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-xl"
                >
                  <div className="w-12 h-12 bg-brand-500 rounded-full" />
                </motion.button>
              </div>
              <button
                onClick={stopCamera}
                className="absolute top-4 right-4 w-10 h-10 bg-slate-800/80 rounded-full flex items-center justify-center text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <motion.div
              key={photo.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="group relative aspect-square rounded-xl overflow-hidden bg-slate-800 border border-slate-700"
            >
              <img
                src={photo.preview}
                alt={photo.caption || 'Injury photo'}
                className="w-full h-full object-cover"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="absolute bottom-0 left-0 right-0 p-3">
                  <input
                    type="text"
                    value={photo.caption}
                    onChange={(e) => updatePhotoCaption(photo.id, e.target.value)}
                    placeholder="Add caption..."
                    className="w-full text-xs bg-slate-900/80 border border-slate-600 rounded-lg px-2 py-1.5 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setSelectedPhoto(photo)}
                  className="w-8 h-8 bg-slate-900/80 rounded-lg flex items-center justify-center text-white hover:bg-slate-800"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removePhoto(photo.id)}
                  className="w-8 h-8 bg-red-600/80 rounded-lg flex items-center justify-center text-white hover:bg-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Body Part Tag */}
              {photo.bodyPart && (
                <div className="absolute top-2 left-2 px-2 py-1 bg-brand-600/90 rounded-lg text-xs font-medium text-white">
                  {photo.bodyPart}
                </div>
              )}
            </motion.div>
          ))}

          {/* Add More Button */}
          {photos.length < maxPhotos && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => fileInputRef.current?.click()}
              className="aspect-square rounded-xl border-2 border-dashed border-slate-600 hover:border-brand-500 flex flex-col items-center justify-center gap-2 text-slate-400 hover:text-brand-400 transition-colors"
            >
              <Plus className="w-8 h-8" />
              <span className="text-sm font-medium">Add Photo</span>
            </motion.button>
          )}
        </div>
      )}

      {/* Photo Preview Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.preview}
                alt={selectedPhoto.caption || 'Injury photo'}
                className="w-full h-full object-contain rounded-2xl"
              />
              
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 rounded-b-2xl">
                <input
                  type="text"
                  value={selectedPhoto.caption}
                  onChange={(e) => updatePhotoCaption(selectedPhoto.id, e.target.value)}
                  placeholder="Add caption..."
                  className="w-full text-lg bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 mb-3"
                />
                
                {bodyParts.length > 0 && (
                  <select
                    value={selectedPhoto.bodyPart || ''}
                    onChange={(e) => updatePhotoBodyPart(selectedPhoto.id, e.target.value)}
                    className="w-full bg-slate-900/80 border border-slate-600 rounded-xl px-4 py-2.5 text-white"
                  >
                    <option value="">Select body part...</option>
                    {bodyParts.map(part => (
                      <option key={part} value={part}>{part}</option>
                    ))}
                  </select>
                )}
                
                <p className="text-xs text-slate-400 mt-2">
                  Captured: {new Date(selectedPhoto.timestamp).toLocaleString()}
                </p>
              </div>

              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 w-12 h-12 bg-slate-800/80 rounded-full flex items-center justify-center text-white hover:bg-slate-700 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default InjuryPhotoUpload;
