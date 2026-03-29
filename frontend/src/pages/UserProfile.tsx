import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Cropper, { Area } from 'react-easy-crop';
import { 
  ArrowLeft, User, Mail, Phone, Building2, Briefcase,
  Calendar, Award, Edit2, Save, X, Camera, Check, Upload, Crop, ZoomIn, ZoomOut,
  Sun, Moon, Monitor, Palette, Shield
} from 'lucide-react';
import { UserProfile as UserProfileType, loadUserProfile, saveUserProfile, DEFAULT_USER_PROFILE } from '../data/mockNavigation';
import { useTheme } from '../components/ThemeProvider';
import { useRBAC } from '../hooks/useRBAC';
import { UserRole } from '../services/rbacService';
import { useAuthStore } from '../store/authStore';

// Accent color options
const ACCENT_COLORS = [
  { id: 'teal', label: 'Teal', value: '#14b8a6' },
  { id: 'blue', label: 'Blue', value: '#3b82f6' },
  { id: 'purple', label: 'Purple', value: '#8b5cf6' },
  { id: 'pink', label: 'Pink', value: '#ec4899' },
  { id: 'orange', label: 'Orange', value: '#f97316' },
  { id: 'emerald', label: 'Emerald', value: '#10b981' },
];

export const UserProfile: React.FC = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { role, setRole } = useRBAC();
  const { user, updateProfile } = useAuthStore();
  // Build initial profile from auth user; fall back to stored prefs, then empty defaults
  const initialProfile = (): UserProfileType => {
    const stored = loadUserProfile();
    if (user) {
      const nameParts = (user.fullName || '').split(' ');
      return {
        ...DEFAULT_USER_PROFILE,
        ...stored,
        id: String(user.id ?? stored.id),
        firstName: nameParts[0] || stored.firstName,
        lastName: nameParts.slice(1).join(' ') || stored.lastName,
        email: user.email || stored.email,
        role: user.role || stored.role,
        department: user.department || stored.department,
      };
    }
    return stored;
  };
  const [profile, setProfile] = useState<UserProfileType>(initialProfile);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<UserProfileType>(profile);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('safetymeg_accent_color') || 'teal';
  });

  // Cropping state
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  useEffect(() => {
    const stored = loadUserProfile();
    // Overlay real auth user data on top of any stored preferences
    if (user) {
      const nameParts = (user.fullName || '').split(' ');
      const patched: UserProfileType = {
        ...DEFAULT_USER_PROFILE,
        ...stored,
        id: String(user.id ?? stored.id),
        firstName: nameParts[0] || stored.firstName,
        lastName: nameParts.slice(1).join(' ') || stored.lastName,
        email: user.email || stored.email,
        role: user.role || stored.role,
        department: user.department || stored.department,
      };
      setProfile(patched);
      setEditedProfile(patched);
    } else {
      setProfile(stored);
      setEditedProfile(stored);
    }
  }, [user]);

  // Handle accent color change
  const handleAccentColorChange = (colorId: string) => {
    setAccentColor(colorId);
    localStorage.setItem('safetymeg_accent_color', colorId);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setRole(newRole);
  };

  const handleSave = async () => {
    saveUserProfile(editedProfile);
    setProfile(editedProfile);
    // Also sync to backend auth profile
    const fullName = `${editedProfile.firstName} ${editedProfile.lastName}`.trim();
    await updateProfile({ fullName, department: editedProfile.department }).catch(() => {});
    setIsEditing(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2000);
  };

  const handleCancel = () => {
    setEditedProfile(profile);
    setIsEditing(false);
  };

  const handleChange = (field: keyof UserProfileType, value: string) => {
    setEditedProfile(prev => ({ ...prev, [field]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getInitials = () => {
    return `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  };

  // File input ref for avatar upload
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    if (isEditing && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      // Convert to base64 and open cropper
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setTempImage(base64);
        setShowCropper(true);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      };
      reader.readAsDataURL(file);
    }
  };

  // Crop completion handler
  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Create cropped image
  const createCroppedImage = async (imageSrc: string, pixelCrop: Area): Promise<string> => {
    const image = new Image();
    image.src = imageSrc;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No 2d context');

    // Set canvas size to the desired crop size
    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    // Draw the cropped image
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    // Return as base64
    return canvas.toDataURL('image/jpeg', 0.9);
  };

  // Apply crop
  const handleApplyCrop = async () => {
    if (tempImage && croppedAreaPixels) {
      try {
        const croppedImage = await createCroppedImage(tempImage, croppedAreaPixels);
        setEditedProfile(prev => ({ ...prev, avatar: croppedImage }));
        setShowCropper(false);
        setTempImage(null);
      } catch (error) {
        console.error('Error cropping image:', error);
        alert('Error cropping image. Please try again.');
      }
    }
  };

  // Cancel crop
  const handleCancelCrop = () => {
    setShowCropper(false);
    setTempImage(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const removeAvatar = () => {
    setEditedProfile(prev => ({ ...prev, avatar: undefined }));
  };

  return (
    <div className="page-wrapper transition-colors duration-300">

      
      {/* Header */}
      <div className="sticky top-14 z-30 bg-surface-raised backdrop-blur-xl border-b border-surface-border/60 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-xl hover:bg-surface-overlay transition-colors touch-target"
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5 text-text-secondary" />
            </button>
            <h1 className="page-title flex-1">Profile</h1>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="p-2 rounded-xl hover:bg-surface-overlay transition-colors touch-target"
                aria-label="Edit profile"
              >
                <Edit2 className="w-5 h-5 text-brand-500" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="p-2 rounded-xl hover:bg-surface-overlay transition-colors touch-target"
                  aria-label="Cancel editing"
                >
                  <X className="w-5 h-5 text-surface-500" />
                </button>
                <button
                  onClick={handleSave}
                  className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 transition-colors touch-target"
                  aria-label="Save changes"
                >
                  <Save className="w-5 h-5 text-white" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Success Toast */}
      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 bg-emerald-500 text-white rounded-full shadow-lg flex items-center gap-2"
        >
          <Check className="w-4 h-4" />
          <span className="text-sm font-medium">Profile saved</span>
        </motion.div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface-raised rounded-3xl border border-surface-200/60 dark:border-surface-border shadow-sm overflow-hidden"
        >
          {/* Avatar Section */}
          <div className="relative h-32 bg-gradient-to-br from-brand-500 to-brand-600">
            <div className="absolute -bottom-12 left-6">
              <div className="relative">
                {/* Hidden file input */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  className="hidden"
                />
                
                {/* Avatar display */}
                <div 
                  onClick={handleAvatarClick}
                  className={`w-24 h-24 rounded-2xl bg-white shadow-lg flex items-center justify-center text-2xl font-bold text-brand-600 dark:text-brand-400 border-4 border-white dark:border-surface-border overflow-hidden ${isEditing ? 'cursor-pointer' : ''}`}
                >
                  {(isEditing ? editedProfile.avatar : profile.avatar) ? (
                    <img 
                      src={isEditing ? editedProfile.avatar : profile.avatar} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getInitials()
                  )}
                </div>
                
                {/* Edit avatar overlay */}
                {isEditing && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <button 
                      onClick={handleAvatarClick}
                      className="absolute bottom-0 right-0 p-1.5 bg-brand-500 rounded-lg shadow-sm hover:bg-brand-600 transition-colors"
                    >
                      <Camera className="w-4 h-4 text-white" />
                    </button>
                    {(isEditing && editedProfile.avatar) && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); removeAvatar(); }}
                        className="absolute -top-1 -right-1 p-1 bg-red-500 rounded-full shadow-sm hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Profile Info */}
          <div className="pt-16 px-6 pb-6">
            {/* Name & Role */}
            <div className="mb-6">
              {isEditing ? (
                <div className="flex gap-3 mb-2">
                  <input
                    type="text"
                    value={editedProfile.firstName}
                    onChange={(e) => handleChange('firstName', e.target.value)}
                    placeholder="First name"
                    className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 dark:border-surface-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                  <input
                    type="text"
                    value={editedProfile.lastName}
                    onChange={(e) => handleChange('lastName', e.target.value)}
                    placeholder="Last name"
                    className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 dark:border-surface-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              ) : (
                <h2 className="text-xl font-semibold text-text-primary">
                  {profile.firstName} {profile.lastName}
                </h2>
              )}
              {isEditing ? (
                <input
                  type="text"
                  value={editedProfile.role}
                  onChange={(e) => handleChange('role', e.target.value)}
                  placeholder="Role"
                  className="w-full px-3 py-2 bg-surface-50 border border-surface-200 dark:border-surface-border rounded-xl text-surface-600 dark:text-surface-300 focus:outline-none focus:ring-2 focus:ring-brand-500 mt-2"
                />
              ) : (
                <p className="text-surface-500 dark:text-surface-400">{profile.role}</p>
              )}
            </div>

            {/* Info Fields */}
            <div className="space-y-4">
              {/* Email */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                {isEditing ? (
                  <input
                    type="email"
                    value={editedProfile.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    placeholder="Email"
                    className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 dark:border-surface-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ) : (
                  <div className="flex-1">
                    <p className="text-xs text-surface-400 dark:text-surface-500">Email</p>
                    <p className="text-sm text-text-primary">{profile.email}</p>
                  </div>
                )}
              </div>

              {/* Phone */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <Phone className="w-5 h-5 text-emerald-500" />
                </div>
                {isEditing ? (
                  <input
                    type="tel"
                    value={editedProfile.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    placeholder="Phone"
                    className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 dark:border-surface-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ) : (
                  <div className="flex-1">
                    <p className="text-xs text-surface-400 dark:text-surface-500">Phone</p>
                    <p className="text-sm text-text-primary">{profile.phone}</p>
                  </div>
                )}
              </div>

              {/* Department */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-purple-500" />
                </div>
                {isEditing ? (
                  <input
                    type="text"
                    value={editedProfile.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    placeholder="Department"
                    className="flex-1 px-3 py-2 bg-surface-50 border border-surface-200 dark:border-surface-border rounded-xl text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                ) : (
                  <div className="flex-1">
                    <p className="text-xs text-surface-400 dark:text-surface-500">Department</p>
                    <p className="text-sm text-text-primary">{profile.department}</p>
                  </div>
                )}
              </div>

              {/* Join Date (readonly) */}
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-surface-400 dark:text-surface-500">Member Since</p>
                  <p className="text-sm text-text-primary">{formatDate(profile.joinDate)}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Certifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6 bg-surface-raised rounded-2xl border border-surface-200/60 dark:border-surface-border shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Award className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-text-primary">Certifications</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {profile.certifications.map((cert, index) => (
              <span
                key={index}
                className="px-3 py-1.5 bg-brand-50 dark:bg-brand-900/20 text-brand-600 dark:text-brand-400 rounded-full text-sm font-medium"
              >
                {cert}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-6 grid grid-cols-2 gap-3"
        >
          <button
            onClick={() => navigate('/training')}
            className="flex items-center gap-3 p-4 bg-surface-raised rounded-2xl border border-surface-200/60 dark:border-surface-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Training</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">View courses</p>
            </div>
          </button>
          <button
            onClick={() => navigate('/notifications')}
            className="flex items-center gap-3 p-4 bg-surface-raised rounded-2xl border border-surface-200/60 dark:border-surface-border shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-text-primary">Settings</p>
              <p className="text-xs text-surface-500 dark:text-surface-400">Preferences</p>
            </div>
          </button>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-surface-raised rounded-2xl border border-surface-200/60 dark:border-surface-border shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-text-primary">Role & Permissions</h3>
          </div>
          
          <div className="mb-6">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">Current Role (RBAC Demo)</p>
            <div className="flex flex-wrap gap-2">
              {(['admin', 'manager', 'worker', 'auditor'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  onClick={() => handleRoleChange(r)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    role === r
                      ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                      : 'bg-surface-100 dark:bg-surface-700 text-surface-600 dark:text-surface-400 hover:bg-surface-200 dark:hover:bg-surface-600'
                  }`}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-2">
              Switch roles to test access control across the application.
            </p>
          </div>
        </motion.div>

        {/* Theme Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-6 bg-surface-raised rounded-2xl border border-surface-200/60 dark:border-surface-border shadow-sm p-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-brand-500" />
            <h3 className="font-semibold text-text-primary">Theme Settings</h3>
          </div>
          
          {/* Theme Mode */}
          <div className="mb-6">
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">Appearance</p>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setTheme('light')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'light' 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                    : 'border-surface-200 dark:border-surface-border hover:border-surface-300 dark:hover:border-surface-border'
                }`}
              >
                <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-brand-500' : 'text-surface-400'}`} />
                <span className={`text-xs font-medium ${theme === 'light' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-500'}`}>Light</span>
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'dark' 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                    : 'border-surface-200 dark:border-surface-border hover:border-surface-300 dark:hover:border-surface-border'
                }`}
              >
                <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-brand-500' : 'text-surface-400'}`} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-500'}`}>Dark</span>
              </button>
              <button
                onClick={() => setTheme('system')}
                className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                  theme === 'system' 
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' 
                    : 'border-surface-200 dark:border-surface-border hover:border-surface-300 dark:hover:border-surface-border'
                }`}
              >
                <Monitor className={`w-5 h-5 ${theme === 'system' ? 'text-brand-500' : 'text-surface-400'}`} />
                <span className={`text-xs font-medium ${theme === 'system' ? 'text-brand-600 dark:text-brand-400' : 'text-surface-500'}`}>System</span>
              </button>
            </div>
          </div>

          {/* Accent Color */}
          <div>
            <p className="text-xs text-surface-500 dark:text-surface-400 mb-3">Accent Color</p>
            <div className="flex flex-wrap gap-2">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.id}
                  onClick={() => handleAccentColorChange(color.id)}
                  className={`w-10 h-10 rounded-xl transition-all ${
                    accentColor === color.id 
                      ? 'ring-2 ring-offset-2 ring-offset-white dark:ring-offset-surface-raised ring-text-primary scale-110' 
                      : 'hover:scale-105'
                  }`}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                />
              ))}
            </div>
            <p className="text-xs text-surface-400 mt-2">
              Selected: {ACCENT_COLORS.find(c => c.id === accentColor)?.label || 'Teal'}
            </p>
          </div>
        </motion.div>
      </main>



      {/* Avatar Cropper Modal */}
      <AnimatePresence>
        {showCropper && tempImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black/50">
              <button
                onClick={handleCancelCrop}
                className="p-2 rounded-xl hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6 text-white" />
              </button>
              <h3 className="text-white font-medium flex items-center gap-2">
                <Crop className="w-5 h-5" />
                Crop Photo
              </h3>
              <button
                onClick={handleApplyCrop}
                className="p-2 rounded-xl bg-brand-500 hover:bg-brand-600 transition-colors"
              >
                <Check className="w-6 h-6 text-white" />
              </button>
            </div>

            {/* Cropper Area */}
            <div className="relative flex-1">
              <Cropper
                image={tempImage}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                showGrid={false}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
              />
            </div>

            {/* Zoom Controls */}
            <div className="p-4 bg-black/50">
              <div className="flex items-center justify-center gap-4 max-w-xs mx-auto">
                <button
                  onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <ZoomOut className="w-5 h-5 text-white" />
                </button>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-1 bg-white/20 rounded-full appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:cursor-pointer"
                />
                <button
                  onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  className="p-2 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <ZoomIn className="w-5 h-5 text-white" />
                </button>
              </div>
              <p className="text-center text-white/60 text-xs mt-2">
                Pinch or use slider to zoom
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default UserProfile;
