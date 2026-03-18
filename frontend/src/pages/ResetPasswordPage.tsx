import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Lock, AlertCircle, CheckCircle } from 'lucide-react';
import { SMButton, SMInput, SMCard } from '../components/ui';
import { AuthLayout } from '../layouts';
import { authApiService } from '../api/services/apiService';

export const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();

  // HashRouter stores the full path including query in window.location.hash
  // e.g. "#/reset-password?token=abc123" — parse manually
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    // Parse token from hash-based URL: /#/reset-password?token=VALUE
    const hash = window.location.hash; // e.g. "#/reset-password?token=abc"
    const queryStart = hash.indexOf('?');
    if (queryStart !== -1) {
      const params = new URLSearchParams(hash.slice(queryStart));
      setToken(params.get('token') ?? '');
    }
  }, []);

  const validate = (): string => {
    if (!token) return 'Reset token is missing. Please use the link from your email.';
    if (!newPassword) return 'New password is required';
    if (newPassword.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(newPassword)) return 'Password must contain at least one uppercase letter';
    if (!/[0-9]/.test(newPassword)) return 'Password must contain at least one number';
    if (newPassword !== confirmPassword) return 'Passwords do not match';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    try {
      await authApiService.resetPassword(token, newPassword);
      setSuccess(true);
      // Redirect to login after 3 seconds
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      const msg = err?.response?.data?.error || err?.message || 'Failed to reset password. The link may have expired.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-500/10 border border-brand-500/20 rounded-2xl mb-4">
            <Shield className="w-8 h-8 text-brand-400" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">SafetyMEG</h1>
          <p className="text-sm mt-1 text-text-secondary">AI-Powered EHS Platform</p>
        </div>

        <SMCard className="rounded-2xl p-8 shadow-2xl">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Password updated!</h2>
              <p className="text-text-secondary text-sm mb-6">
                Your password has been reset successfully. Redirecting you to sign in...
              </p>
              <Link
                to="/login"
                className="inline-flex items-center justify-center w-full rounded-xl bg-accent px-4 py-3 font-semibold text-text-onAccent transition-colors hover:bg-accent-600"
              >
                Go to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Set new password</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Choose a strong password for your account.
                </p>
              </div>

              {!token && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 mb-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>No reset token found. Please use the link from your email.</span>
                </motion.div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-start gap-3 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password */}
                <SMInput
                  label="New Password"
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                  placeholder="Min 8 chars, 1 uppercase, 1 number"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="pointer-events-auto text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  autoComplete="new-password"
                  disabled={isLoading || !token}
                />

                {/* Confirm Password */}
                <SMInput
                  label="Confirm New Password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="Re-enter your new password"
                  leftIcon={<Lock className="w-4 h-4" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="pointer-events-auto text-text-muted hover:text-text-primary transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  }
                  autoComplete="new-password"
                  disabled={isLoading || !token}
                />

                <SMButton
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  disabled={!token}
                  className="w-full mt-2"
                >
                  {isLoading ? 'Updating password...' : 'Update password'}
                </SMButton>
              </form>

              <p className="text-center text-text-muted text-sm mt-5">
                Back to{' '}
                <Link to="/login" className="text-accent hover:text-accent-600 font-medium transition-colors">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </SMCard>

        <p className="text-center text-text-muted text-xs mt-6">
          © 2026 SafetyMEG. Enterprise EHS Platform. All rights reserved.
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default ResetPasswordPage;
