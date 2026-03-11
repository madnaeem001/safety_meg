import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  Smartphone,
  X,
  CheckCircle2,
  Share2,
  Plus,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  Shield,
  Zap,
  Monitor,
  Tablet,
  ArrowDownToLine
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: 'accepted' | 'dismissed', platform: string }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    'beforeinstallprompt': BeforeInstallPromptEvent;
  }
}

interface PWAInstallerProps {
  onInstallSuccess?: () => void;
  onInstallDismiss?: () => void;
}

type Platform = 'ios' | 'android' | 'desktop' | 'unknown';

// Detect platform
const detectPlatform = (): Platform => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else if (!/mobile|tablet/.test(userAgent)) {
    return 'desktop';
  }
  return 'unknown';
};

// Check if already installed as PWA
const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches 
    || (navigator as any).standalone === true
    || document.referrer.includes('android-app://');
};

export const PWAInstaller: React.FC<PWAInstallerProps> = ({
  onInstallSuccess,
  onInstallDismiss
}) => {
  const [showBanner, setShowBanner] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>('unknown');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [installStep, setInstallStep] = useState(0);

  // Listen for install prompt
  useEffect(() => {
    const detectedPlatform = detectPlatform();
    setPlatform(detectedPlatform);
    setIsInstalled(isStandalone());

    // Check if user dismissed the banner before
    const dismissed = localStorage.getItem('pwa_banner_dismissed');
    const dismissedTime = dismissed ? parseInt(dismissed) : 0;
    const oneWeek = 7 * 24 * 60 * 60 * 1000;

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Show banner if not dismissed recently and not installed
      if (!isStandalone() && (Date.now() - dismissedTime > oneWeek)) {
        setTimeout(() => setShowBanner(true), 2000);
      }
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setShowBanner(false);
      setShowModal(false);
      setDeferredPrompt(null);
      onInstallSuccess?.();
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    // For iOS, show banner anyway as they need manual instructions
    if (detectedPlatform === 'ios' && !isStandalone() && (Date.now() - dismissedTime > oneWeek)) {
      setTimeout(() => setShowBanner(true), 2000);
    }

    // Online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onInstallSuccess]);

  // Handle install button click
  const handleInstall = async () => {
    if (platform === 'ios') {
      setShowModal(true);
      return;
    }

    if (!deferredPrompt) {
      setShowModal(true);
      return;
    }

    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setIsInstalled(true);
        onInstallSuccess?.();
      } else {
        onInstallDismiss?.();
      }
      
      setDeferredPrompt(null);
      setShowBanner(false);
    } catch (error) {
      console.error('Install error:', error);
    }
  };

  // Dismiss banner
  const dismissBanner = () => {
    setShowBanner(false);
    localStorage.setItem('pwa_banner_dismissed', Date.now().toString());
    onInstallDismiss?.();
  };

  // Get platform-specific icon
  const getPlatformIcon = () => {
    switch (platform) {
      case 'ios':
      case 'android':
        return Smartphone;
      case 'desktop':
        return Monitor;
      default:
        return Tablet;
    }
  };

  const PlatformIcon = getPlatformIcon();

  // App features list
  const features = [
    { icon: WifiOff, title: 'Works Offline', desc: 'Access forms and data without internet' },
    { icon: Zap, title: 'Lightning Fast', desc: 'Native-like performance' },
    { icon: Bell, title: 'Push Notifications', desc: 'Stay updated on safety alerts' },
    { icon: Shield, title: 'Secure Access', desc: 'Biometric authentication supported' }
  ];

  if (isInstalled) {
    return null;
  }

  return (
    <>
      {/* Install Banner */}
      <AnimatePresence>
        {showBanner && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 md:left-auto md:right-6 md:max-w-sm"
          >
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 
                          dark:border-slate-700 overflow-hidden">
              {/* Gradient header */}
              <div className="bg-gradient-to-r from-brand-500 to-brand-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/20 rounded-xl">
                      <Download className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold">Install safetyMEG</h3>
                      <p className="text-xs text-white/80">Access anytime, even offline</p>
                    </div>
                  </div>
                  <button
                    onClick={dismissBanner}
                    className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="p-4">
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 mb-4">
                  <PlatformIcon className="w-4 h-4" />
                  <span>Add to your {platform === 'ios' ? 'iPhone' : platform === 'android' ? 'Android' : 'device'}</span>
                </div>
                
                <div className="flex gap-3">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium 
                             rounded-xl flex items-center justify-center gap-2"
                  >
                    <ArrowDownToLine className="w-4 h-4" />
                    Install Now
                  </motion.button>
                  <button
                    onClick={() => setShowModal(true)}
                    className="px-4 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 
                             dark:hover:bg-slate-600 rounded-xl text-slate-600 dark:text-slate-300"
                  >
                    Learn More
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Install Instructions Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end md:items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white dark:bg-slate-800 rounded-t-3xl md:rounded-2xl w-full max-w-md 
                       max-h-[90vh] overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 p-6 text-white relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
                <div className="absolute -bottom-5 -left-5 w-20 h-20 bg-white/10 rounded-full" />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-white/20 rounded-2xl">
                      <Shield className="w-8 h-8" />
                    </div>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <h2 className="text-2xl font-bold mb-1">Install safetyMEG</h2>
                  <p className="text-white/80 text-sm">
                    Get the full mobile experience with our PWA
                  </p>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 overflow-y-auto max-h-[50vh]">
                {/* Features */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {features.map((feature, i) => (
                    <motion.div
                      key={feature.title}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl"
                    >
                      <feature.icon className="w-5 h-5 text-brand-600 mb-2" />
                      <p className="font-medium text-sm text-slate-900 dark:text-white">
                        {feature.title}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {feature.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* Platform-specific instructions */}
                {platform === 'ios' ? (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <Smartphone className="w-4 h-4" />
                      iOS Installation Steps
                    </h3>
                    <div className="space-y-3">
                      {[
                        { step: 1, text: 'Tap the Share button', icon: Share2 },
                        { step: 2, text: 'Scroll down and tap "Add to Home Screen"', icon: Plus },
                        { step: 3, text: 'Tap "Add" to confirm', icon: CheckCircle2 }
                      ].map((item, i) => (
                        <motion.div
                          key={item.step}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.3 + i * 0.1 }}
                          className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            installStep === i 
                              ? 'bg-brand-50 dark:bg-brand-900/20 border-2 border-brand-500' 
                              : 'bg-slate-50 dark:bg-slate-700/50'
                          }`}
                          onClick={() => setInstallStep(i)}
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                            installStep === i 
                              ? 'bg-brand-500 text-white' 
                              : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300'
                          }`}>
                            {item.step}
                          </div>
                          <span className="flex-1 text-sm text-slate-700 dark:text-slate-300">
                            {item.text}
                          </span>
                          <item.icon className={`w-5 h-5 ${
                            installStep === i ? 'text-brand-600' : 'text-slate-400'
                          }`} />
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                      <PlatformIcon className="w-4 h-4" />
                      {platform === 'android' ? 'Android' : 'Desktop'} Installation
                    </h3>
                    {deferredPrompt ? (
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Click the button below to install the app directly to your device.
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          Look for the install icon in your browser's address bar, or:
                        </p>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl text-sm text-slate-600 dark:text-slate-300">
                          <p className="mb-2"><strong>Chrome:</strong> Menu → Install app</p>
                          <p className="mb-2"><strong>Edge:</strong> Menu → Apps → Install</p>
                          <p><strong>Safari:</strong> Use the Share menu</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                {deferredPrompt && platform !== 'ios' ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleInstall}
                    className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium 
                             rounded-xl flex items-center justify-center gap-2"
                  >
                    <ArrowDownToLine className="w-5 h-5" />
                    Install Now
                  </motion.button>
                ) : (
                  <button
                    onClick={() => setShowModal(false)}
                    className="w-full py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 
                             dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 
                             font-medium rounded-xl"
                  >
                    Got It
                  </button>
                )}
                
                {/* Online status indicator */}
                <div className="flex items-center justify-center gap-2 mt-3 text-xs text-slate-500">
                  {isOnline ? (
                    <>
                      <Wifi className="w-3 h-3 text-emerald-500" />
                      <span>Online - Ready to install</span>
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-3 h-3 text-amber-500" />
                      <span>Offline - Connect to install</span>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// Mini install button for header/toolbar
export const PWAInstallButton: React.FC<{ className?: string }> = ({ className = '' }) => {
  const [canInstall, setCanInstall] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (isStandalone()) return;

    const handleBeforeInstall = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    
    // For iOS, always show
    if (detectPlatform() === 'ios') {
      setCanInstall(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setCanInstall(false);
    }
  };

  if (!canInstall) return null;

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleInstall}
      className={`p-2 bg-brand-100 dark:bg-brand-900/30 hover:bg-brand-200 
               dark:hover:bg-brand-800/50 rounded-xl text-brand-600 transition-colors ${className}`}
      title="Install App"
    >
      <Download className="w-5 h-5" />
    </motion.button>
  );
};

export default PWAInstaller;
