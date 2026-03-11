import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Fingerprint,
  ScanFace,
  Shield,
  ShieldCheck,
  Key,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RefreshCw,
  Settings,
  Info,
  X
} from 'lucide-react';

// WebAuthn credential interface
interface BiometricCredential {
  id: string;
  type: 'fingerprint' | 'face' | 'pin' | 'pattern';
  name: string;
  createdAt: Date;
  lastUsed: Date;
  deviceName: string;
}

interface BiometricAuthProps {
  onAuthSuccess?: (method: string) => void;
  onAuthFailure?: (error: string) => void;
  mode?: 'register' | 'authenticate' | 'manage';
}

// Check if WebAuthn is supported
const isWebAuthnSupported = (): boolean => {
  return !!(window.PublicKeyCredential && navigator.credentials);
};

// Check if platform authenticator (biometrics) is available
const isPlatformAuthenticatorAvailable = async (): Promise<boolean> => {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
};

export const BiometricAuth: React.FC<BiometricAuthProps> = ({
  onAuthSuccess,
  onAuthFailure,
  mode = 'authenticate'
}) => {
  const [isSupported, setIsSupported] = useState(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [credentials, setCredentials] = useState<BiometricCredential[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<'fingerprint' | 'face' | 'pin'>('fingerprint');
  const [biometricEnabled, setBiometricEnabled] = useState(true);
  const [autoLockTime, setAutoLockTime] = useState(5);

  // Check biometric support on mount
  useEffect(() => {
    const checkSupport = async () => {
      setIsSupported(isWebAuthnSupported());
      const platformAuth = await isPlatformAuthenticatorAvailable();
      setHasPlatformAuth(platformAuth);

      // Load saved credentials from localStorage
      const savedCredentials = localStorage.getItem('biometric_credentials');
      if (savedCredentials) {
        setCredentials(JSON.parse(savedCredentials));
      }
    };
    checkSupport();
  }, []);

  // Generate a random challenge for WebAuthn
  const generateChallenge = (): Uint8Array => {
    const challenge = new Uint8Array(32);
    crypto.getRandomValues(challenge);
    return challenge;
  };

  // Convert ArrayBuffer to Base64
  const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    bytes.forEach(b => binary += String.fromCharCode(b));
    return btoa(binary);
  };

  // Register new biometric credential
  const registerBiometric = async () => {
    if (!isSupported || !hasPlatformAuth) {
      setErrorMessage('Biometric authentication is not supported on this device');
      setAuthStatus('error');
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus('idle');
    setErrorMessage('');

    try {
      const challenge = generateChallenge();
      
      const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
        challenge,
        rp: {
          name: 'safetyMEG EHS Platform',
          id: window.location.hostname
        },
        user: {
          id: new Uint8Array(16),
          name: 'user@safetymeg.com',
          displayName: 'EHS User'
        },
        pubKeyCredParams: [
          { alg: -7, type: 'public-key' }, // ES256
          { alg: -257, type: 'public-key' } // RS256
        ],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
          residentKey: 'preferred'
        },
        timeout: 60000,
        attestation: 'none'
      };

      const credential = await navigator.credentials.create({
        publicKey: publicKeyCredentialCreationOptions
      }) as PublicKeyCredential;

      if (credential) {
        const newCredential: BiometricCredential = {
          id: arrayBufferToBase64(credential.rawId),
          type: selectedMethod,
          name: `${selectedMethod.charAt(0).toUpperCase() + selectedMethod.slice(1)} - ${new Date().toLocaleDateString()}`,
          createdAt: new Date(),
          lastUsed: new Date(),
          deviceName: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop'
        };

        const updatedCredentials = [...credentials, newCredential];
        setCredentials(updatedCredentials);
        localStorage.setItem('biometric_credentials', JSON.stringify(updatedCredentials));
        
        setAuthStatus('success');
        onAuthSuccess?.('biometric_registered');
      }
    } catch (error: any) {
      console.error('Biometric registration error:', error);
      setErrorMessage(error.message || 'Failed to register biometric credential');
      setAuthStatus('error');
      onAuthFailure?.(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Authenticate with biometric
  const authenticateBiometric = async () => {
    if (!isSupported) {
      setErrorMessage('Biometric authentication is not supported');
      setAuthStatus('error');
      return;
    }

    setIsAuthenticating(true);
    setAuthStatus('idle');
    setErrorMessage('');

    try {
      const challenge = generateChallenge();
      
      const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
        challenge,
        rpId: window.location.hostname,
        timeout: 60000,
        userVerification: 'required',
        allowCredentials: credentials.map(c => ({
          id: Uint8Array.from(atob(c.id), char => char.charCodeAt(0)),
          type: 'public-key' as const,
          transports: ['internal'] as AuthenticatorTransport[]
        }))
      };

      const assertion = await navigator.credentials.get({
        publicKey: publicKeyCredentialRequestOptions
      }) as PublicKeyCredential;

      if (assertion) {
        // Update last used timestamp
        const credentialId = arrayBufferToBase64(assertion.rawId);
        const updatedCredentials = credentials.map(c => 
          c.id === credentialId ? { ...c, lastUsed: new Date() } : c
        );
        setCredentials(updatedCredentials);
        localStorage.setItem('biometric_credentials', JSON.stringify(updatedCredentials));

        setAuthStatus('success');
        onAuthSuccess?.('biometric_authenticated');
      }
    } catch (error: any) {
      console.error('Biometric authentication error:', error);
      
      if (error.name === 'NotAllowedError') {
        setErrorMessage('Authentication was cancelled or timed out');
      } else if (error.name === 'InvalidStateError') {
        setErrorMessage('No credentials registered. Please register first.');
      } else {
        setErrorMessage(error.message || 'Authentication failed');
      }
      
      setAuthStatus('error');
      onAuthFailure?.(error.message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Remove credential
  const removeCredential = (id: string) => {
    const updatedCredentials = credentials.filter(c => c.id !== id);
    setCredentials(updatedCredentials);
    localStorage.setItem('biometric_credentials', JSON.stringify(updatedCredentials));
  };

  // Auth method icons
  const getMethodIcon = (method: 'fingerprint' | 'face' | 'pin') => {
    switch (method) {
      case 'fingerprint':
        return Fingerprint;
      case 'face':
        return ScanFace;
      case 'pin':
        return Key;
      default:
        return Shield;
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
            <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
              <Shield className="w-6 h-6 text-brand-600" />
            </div>
            Biometric Security
          </h2>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Secure your account with fingerprint or face recognition
          </p>
        </div>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Settings className="w-5 h-5 text-slate-500" />
        </button>
      </div>

      {/* Support Status */}
      <div className={`p-4 rounded-xl mb-6 flex items-center gap-3 ${
        isSupported && hasPlatformAuth
          ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
          : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
      }`}>
        {isSupported && hasPlatformAuth ? (
          <>
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <span className="text-emerald-700 dark:text-emerald-300 font-medium">
              Biometric authentication is available on this device
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-amber-700 dark:text-amber-300 font-medium">
              {!isSupported 
                ? 'WebAuthn is not supported in this browser'
                : 'No platform authenticator (biometrics) available'}
            </span>
          </>
        )}
      </div>

      {/* Authentication Method Selection */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
          Authentication Method
        </h3>
        <div className="grid grid-cols-3 gap-3">
          {(['fingerprint', 'face', 'pin'] as const).map((method) => {
            const Icon = getMethodIcon(method);
            const isSelected = selectedMethod === method;
            return (
              <motion.button
                key={method}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedMethod(method)}
                className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20'
                    : 'border-slate-200 dark:border-slate-700 hover:border-brand-300'
                }`}
              >
                <div className={`p-3 rounded-full ${
                  isSelected 
                    ? 'bg-brand-100 dark:bg-brand-800' 
                    : 'bg-slate-100 dark:bg-slate-800'
                }`}>
                  <Icon className={`w-6 h-6 ${
                    isSelected ? 'text-brand-600' : 'text-slate-500'
                  }`} />
                </div>
                <span className={`text-sm font-medium capitalize ${
                  isSelected ? 'text-brand-600' : 'text-slate-600 dark:text-slate-400'
                }`}>
                  {method === 'pin' ? 'PIN Code' : method}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Main Auth Action */}
      <div className="relative mb-8">
        <motion.div
          className={`relative p-8 rounded-2xl border-2 flex flex-col items-center ${
            isAuthenticating
              ? 'border-brand-400 bg-brand-50/50 dark:bg-brand-900/10'
              : authStatus === 'success'
              ? 'border-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10'
              : authStatus === 'error'
              ? 'border-red-400 bg-red-50/50 dark:bg-red-900/10'
              : 'border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50'
          }`}
        >
          {/* Animated fingerprint/face icon */}
          <motion.div
            animate={isAuthenticating ? {
              scale: [1, 1.1, 1],
              opacity: [1, 0.7, 1]
            } : {}}
            transition={{ duration: 1.5, repeat: isAuthenticating ? Infinity : 0 }}
            className={`relative p-6 rounded-full mb-6 ${
              authStatus === 'success'
                ? 'bg-emerald-100 dark:bg-emerald-900/30'
                : authStatus === 'error'
                ? 'bg-red-100 dark:bg-red-900/30'
                : 'bg-brand-100 dark:bg-brand-900/30'
            }`}
          >
            {authStatus === 'success' ? (
              <ShieldCheck className="w-16 h-16 text-emerald-600" />
            ) : authStatus === 'error' ? (
              <AlertCircle className="w-16 h-16 text-red-600" />
            ) : (
              React.createElement(getMethodIcon(selectedMethod), {
                className: `w-16 h-16 ${isAuthenticating ? 'text-brand-500' : 'text-brand-600'}`
              })
            )}
            
            {/* Pulse animation ring */}
            {isAuthenticating && (
              <motion.div
                animate={{ scale: [1, 1.5], opacity: [0.5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute inset-0 rounded-full border-2 border-brand-500"
              />
            )}
          </motion.div>

          {/* Status text */}
          <div className="text-center mb-6">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
              {isAuthenticating
                ? 'Verifying...'
                : authStatus === 'success'
                ? 'Authentication Successful'
                : authStatus === 'error'
                ? 'Authentication Failed'
                : mode === 'register'
                ? 'Register Biometric'
                : 'Authenticate'}
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAuthenticating
                ? `Please ${selectedMethod === 'face' ? 'look at your device' : 'touch the sensor'}`
                : authStatus === 'success'
                ? 'Your identity has been verified'
                : authStatus === 'error'
                ? errorMessage
                : `Use your ${selectedMethod} to ${mode === 'register' ? 'set up' : 'verify'} your identity`}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-3">
            {mode === 'register' || credentials.length === 0 ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={registerBiometric}
                disabled={isAuthenticating || !isSupported || !hasPlatformAuth}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Fingerprint className="w-5 h-5" />
                )}
                {isAuthenticating ? 'Registering...' : 'Register Biometric'}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={authenticateBiometric}
                disabled={isAuthenticating}
                className="px-6 py-3 bg-brand-600 hover:bg-brand-700 text-white font-medium rounded-xl
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isAuthenticating ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
                {isAuthenticating ? 'Verifying...' : 'Authenticate'}
              </motion.button>
            )}
            
            {authStatus !== 'idle' && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setAuthStatus('idle');
                  setErrorMessage('');
                }}
                className="px-6 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 
                         dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 
                         font-medium rounded-xl flex items-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Try Again
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>

      {/* Registered Credentials */}
      {credentials.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
            Registered Credentials ({credentials.length})
          </h3>
          <div className="space-y-3">
            {credentials.map((credential) => {
              const Icon = getMethodIcon(credential.type);
              return (
                <motion.div
                  key={credential.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 
                           dark:border-slate-700 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-brand-100 dark:bg-brand-900/30 rounded-lg">
                      <Icon className="w-5 h-5 text-brand-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {credential.name}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <Smartphone className="w-3 h-3" />
                          {credential.deviceName}
                        </span>
                        <span>•</span>
                        <span>Last used: {new Date(credential.lastUsed).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeCredential(credential.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 
                             dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Security Settings
              </h3>
              
              <div className="space-y-4">
                {/* Enable/Disable Biometric */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Biometric Authentication
                      </p>
                      <p className="text-xs text-slate-500">
                        Require biometric to access sensitive features
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setBiometricEnabled(!biometricEnabled)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${
                      biometricEnabled ? 'bg-brand-500' : 'bg-slate-300 dark:bg-slate-600'
                    }`}
                  >
                    <motion.div
                      animate={{ x: biometricEnabled ? 24 : 2 }}
                      className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </div>

                {/* Auto-lock timeout */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-slate-500" />
                    <div>
                      <p className="font-medium text-slate-700 dark:text-slate-300">
                        Auto-lock Timeout
                      </p>
                      <p className="text-xs text-slate-500">
                        Lock app after inactivity
                      </p>
                    </div>
                  </div>
                  <select
                    value={autoLockTime}
                    onChange={(e) => setAutoLockTime(Number(e.target.value))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 
                             dark:border-slate-600 rounded-lg text-sm"
                  >
                    <option value={1}>1 minute</option>
                    <option value={5}>5 minutes</option>
                    <option value={15}>15 minutes</option>
                    <option value={30}>30 minutes</option>
                    <option value={0}>Never</option>
                  </select>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info Section */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-700 dark:text-blue-300">
            <p className="font-medium mb-1">About Biometric Security</p>
            <p>
              Your biometric data never leaves your device. We use WebAuthn technology 
              that creates a secure key pair where your private key stays on your device, 
              protected by your biometrics.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BiometricAuth;
