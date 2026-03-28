import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Eye, EyeOff, Mail, Lock, CheckCircle } from 'lucide-react';
import { SMButton, SMInput, SMCard } from '../components/ui';
import { AuthLayout } from '../layouts';
import { useAuthStore } from '../store/authStore';
import { useToast } from '../hooks/useToast';

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  React.useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!email.trim()) {
      toast.error('Email is required');
      return;
    }
    if (!password) {
      toast.error('Password is required');
      return;
    }

    const success = await login(email.trim(), password);
    if (success) {
      toast.success('Signed in successfully.');
      navigate('/', { replace: true });
    }
  };

  const fillDemoCredentials = () => {
    setEmail('admin@safetymeg.com');
    setPassword('Admin@SafetyMEG2025');
    clearError();
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

        {/* Card */}
        <SMCard className="rounded-2xl p-8 shadow-2xl">
          <h2 className="text-xl font-semibold text-text-primary mb-6">Sign in to your account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <SMInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearError(); }}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              disabled={isLoading}
            />

            {/* Password */}
            <div>
              <SMInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearError(); }}
                placeholder="Enter your password"
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
                autoComplete="current-password"
                disabled={isLoading}
              />
              <div className="flex justify-end mt-1.5">
                <Link
                  to="/forgot-password"
                  className="text-xs text-accent hover:text-accent-600 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            {/* Submit */}
            <SMButton
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </SMButton>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-surface-border" />
            <span className="text-text-muted text-xs">or</span>
            <div className="flex-1 h-px bg-surface-border" />
          </div>

          {/* Demo login */}
          <SMButton
            type="button"
            variant="secondary"
            onClick={fillDemoCredentials}
            leftIcon={<CheckCircle className="w-4 h-4 text-success" />}
            className="w-full"
          >
            Use demo credentials (Admin)
          </SMButton>

          {/* Register link */}
          <p className="text-center text-text-muted text-sm mt-5">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-accent-600 font-medium transition-colors">
              Create account
            </Link>
          </p>
        </SMCard>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-6">
          © 2026 SafetyMEG. Enterprise EHS Platform. All rights reserved.
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default LoginPage;
