import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Shield,
  Eye,
  EyeOff,
  Mail,
  Lock,
  User,
  Building2,
  AlertCircle,
} from 'lucide-react';
import { SMButton, SMInput, SMSelect, SMCard } from '../components/ui';
import { AuthLayout } from '../layouts';
import { useAuthStore, type RegisterPayload } from '../store/authStore';

const ROLES = [
  { value: 'worker', label: 'Worker / Field Staff' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'manager', label: 'Manager' },
  { value: 'safety_officer', label: 'Safety Officer' },
  { value: 'admin', label: 'Administrator' },
] as const;

export const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { register, isLoading, error, clearError, isAuthenticated } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<RegisterPayload['role']>('worker');
  const [department, setDepartment] = useState('');
  const [organization, setOrganization] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Redirect if already logged in
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  React.useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const validate = (): boolean => {
    if (!fullName.trim()) {
      setLocalError('Full name is required');
      return false;
    }
    if (!email.trim()) {
      setLocalError('Email is required');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setLocalError('Enter a valid email address');
      return false;
    }
    if (password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setLocalError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (!validate()) return;

    const payload: RegisterPayload = {
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      role,
      department: department.trim() || undefined,
      organization: organization.trim() || undefined,
    };

    const success = await register(payload);
    if (success) {
      localStorage.setItem('safetymeg_show_onboarding', 'true');
      navigate('/');
    }
  };

  const clearFieldError = () => {
    setLocalError('');
  };

  const displayError = localError || error;

  return (
    <AuthLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full py-8"
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
          <h2 className="text-xl font-semibold text-text-primary mb-6">Create your account</h2>

          {displayError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 p-3 mb-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{displayError}</span>
            </motion.div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <SMInput
              label="Full Name"
              type="text"
              value={fullName}
              onChange={(e) => { setFullName(e.target.value); clearFieldError(); }}
              placeholder="John Smith"
              leftIcon={<User className="w-4 h-4" />}
              autoComplete="name"
              disabled={isLoading}
            />

            {/* Email */}
            <SMInput
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); clearFieldError(); }}
              placeholder="you@company.com"
              leftIcon={<Mail className="w-4 h-4" />}
              autoComplete="email"
              disabled={isLoading}
            />

            {/* Role */}
            <SMSelect
              label="Role"
              value={role}
              onChange={(e) => setRole(e.target.value as RegisterPayload['role'])}
              options={ROLES.map((r) => ({ value: r.value, label: r.label }))}
              disabled={isLoading}
            />

            {/* Department & Organization row */}
            <div className="grid grid-cols-2 gap-3">
              <SMInput
                label="Department (optional)"
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Operations"
                leftIcon={<Building2 className="w-4 h-4" />}
                disabled={isLoading}
              />
              <SMInput
                label="Organization (optional)"
                type="text"
                value={organization}
                onChange={(e) => setOrganization(e.target.value)}
                placeholder="e.g. SafetyMEG"
                disabled={isLoading}
              />
            </div>

            {/* Password */}
            <div>
              <SMInput
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); clearFieldError(); }}
                placeholder="Min. 8 characters"
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
                disabled={isLoading}
              />
              {password && (
                <div className="mt-2 flex gap-1">
                  {[...Array(4)].map((_, i) => {
                    const strength = (password.length >= 8 ? 1 : 0)
                      + (password.length >= 12 ? 1 : 0)
                      + (/[A-Z]/.test(password) && /[0-9]/.test(password) ? 1 : 0)
                      + (/[^a-zA-Z0-9]/.test(password) ? 1 : 0);
                    return (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${
                          i < strength
                            ? strength <= 1 ? 'bg-red-500'
                            : strength === 2 ? 'bg-amber-500'
                            : strength === 3 ? 'bg-brand-500'
                            : 'bg-emerald-500'
                            : 'bg-surface-border'
                        }`}
                      />
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <SMInput
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError(); }}
              placeholder="Re-enter password"
              error={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : undefined}
              leftIcon={<Lock className="w-4 h-4" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  className="pointer-events-auto text-text-muted hover:text-text-primary transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              }
              autoComplete="new-password"
              disabled={isLoading}
            />

            {/* Submit */}
            <SMButton
              type="submit"
              variant="primary"
              loading={isLoading}
              className="w-full mt-2"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </SMButton>
          </form>

          {/* Sign in link */}
          <p className="text-center text-text-muted text-sm mt-5">
            Already have an account?{' '}
            <Link to="/login" className="text-accent hover:text-accent-600 font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </SMCard>

        {/* Footer */}
        <p className="text-center text-text-muted text-xs mt-6">
          © 2025 SafetyMEG. Enterprise EHS Platform. All rights reserved.
        </p>
      </motion.div>
    </AuthLayout>
  );
};

export default RegisterPage;
