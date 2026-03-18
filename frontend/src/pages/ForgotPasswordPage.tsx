import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { SMButton, SMInput, SMCard } from '../components/ui';
import { AuthLayout } from '../layouts';
import { authApiService } from '../api/services/apiService';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim()) {
      setError('Email address is required');
      return;
    }

    setIsLoading(true);
    try {
      await authApiService.forgotPassword(email.trim());
      setSubmitted(true);
    } catch (err: any) {
      // Always show success to prevent email enumeration
      setSubmitted(true);
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
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl mb-4">
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </div>
              <h2 className="text-xl font-semibold text-text-primary mb-2">Check your email</h2>
              <p className="text-text-secondary text-sm mb-6">
                If an account exists for <span className="text-text-primary font-medium">{email}</span>,
                you'll receive a password reset link within a few minutes.
              </p>
              <p className="text-text-muted text-xs mb-6">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 text-accent hover:text-accent-600 text-sm font-medium transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </Link>
            </motion.div>
          ) : (
            <>
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-text-primary">Reset your password</h2>
                <p className="text-text-secondary text-sm mt-1">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

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
                <SMInput
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  placeholder="you@company.com"
                  leftIcon={<Mail className="w-4 h-4" />}
                  autoComplete="email"
                  disabled={isLoading}
                />

                <SMButton
                  type="submit"
                  variant="primary"
                  loading={isLoading}
                  className="w-full mt-2"
                >
                  {isLoading ? 'Sending reset link...' : 'Send reset link'}
                </SMButton>
              </form>

              <p className="text-center text-text-muted text-sm mt-5">
                Remember your password?{' '}
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

export default ForgotPasswordPage;
