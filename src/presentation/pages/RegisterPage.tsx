/**
 * Register Page
 * User registration page with password strength indicator and OAuth options
 */

import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Mail, Lock, Eye, EyeOff, User, Check, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';
import { OAuthButton } from '../components/OAuthButton';
import { validatePasswordRules } from '../../domain/value-objects/Password';

// ─── Password strength colours ───────────────────────────────────────────────

const strengthConfig = {
  weak: { label: 'Weak', color: 'bg-red-500', textColor: 'text-red-600', width: 'w-1/4' },
  fair: { label: 'Fair', color: 'bg-yellow-500', textColor: 'text-yellow-600', width: 'w-2/4' },
  strong: { label: 'Strong', color: 'bg-green-500', textColor: 'text-green-600', width: 'w-3/4' },
  'very-strong': { label: 'Very Strong', color: 'bg-emerald-600', textColor: 'text-emerald-700', width: 'w-full' },
} as const;

// ─── Password Requirements List ───────────────────────────────────────────────

interface RequirementProps {
  met: boolean;
  label: string;
}

const Requirement: React.FC<RequirementProps> = ({ met, label }) => (
  <li className="flex items-center gap-2 text-sm" data-testid={`requirement-${label.replace(/\s+/g, '-').toLowerCase()}`}>
    {met ? (
      <Check className="h-4 w-4 text-green-500 flex-shrink-0" data-testid="req-check" />
    ) : (
      <X className="h-4 w-4 text-gray-400 flex-shrink-0" data-testid="req-x" />
    )}
    <span className={met ? 'text-green-700 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
      {label}
    </span>
  </li>
);

// ─── Main Component ───────────────────────────────────────────────────────────

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, signInWithGoogle, signInWithApple } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);

  // Live password validation
  const passwordValidation = validatePasswordRules(password);
  const isPasswordValid = passwordValidation.isValid;
  const strengthInfo = password.length > 0 ? strengthConfig[passwordValidation.strength] : null;

  const isFormValid = isPasswordValid && password === confirmPassword && name.trim().length >= 2 && email.length > 0;

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setPasswordTouched(true);
  }, []);

  const handleGoogleLogin = async () => {
    setError(null);
    setIsGoogleLoading(true);
    try {
      const { error: oauthError } = await signInWithGoogle();
      if (oauthError) setError('No se pudo registrar con Google. Verificá que esté configurado.');
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError(null);
    setIsAppleLoading(true);
    try {
      const { error: oauthError } = await signInWithApple();
      if (oauthError) setError('No se pudo registrar con Apple. Verificá que esté configurado.');
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsAppleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (!isPasswordValid) {
      setError(passwordValidation.errors[0]);
      return;
    }

    setIsLoading(true);

    try {
      const { error: registerError } = await register(email, password, name);
      if (registerError) {
        setError(t('auth.registerError'));
      } else {
        setSuccess(true);
      }
    } catch {
      setError(t('errors.generic'));
    } finally {
      setIsLoading(false);
    }
  };

  // Navigate away after successful registration (unused for now — success screen shown instead)
  void navigate;

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <LanguageSelector />
          <ThemeToggle />
        </div>
        <div className="w-full max-w-md text-center">
          <Heart className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('success')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.checkEmail')}
          </p>
          <Link
            to="/login"
            className="inline-block py-3 px-6 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 transition-all"
          >
            {t('auth.login')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <Heart className="h-12 w-12 text-rose-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('auth.register')}</h1>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400 text-sm" data-testid="register-error">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" data-testid="register-form">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.name')}
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder={t('auth.namePlaceholder')}
                  data-testid="register-name"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.email')}
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder={t('auth.emailPlaceholder')}
                  data-testid="register-email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.password')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  required
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  data-testid="toggle-password-visibility"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>

              {/* Strength bar */}
              {strengthInfo && (
                <div className="mt-2" data-testid="password-strength-bar">
                  <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all ${strengthInfo.color} ${strengthInfo.width}`} />
                  </div>
                  <p className={`text-xs mt-1 ${strengthInfo.textColor}`} data-testid="password-strength-label">
                    {strengthInfo.label}
                  </p>
                </div>
              )}

              {/* Requirements */}
              {passwordTouched && (
                <ul className="mt-2 space-y-1" data-testid="password-requirements">
                  <Requirement met={passwordValidation.rules.minLength} label="At least 8 characters" />
                  <Requirement met={passwordValidation.rules.hasUppercase} label="One uppercase letter" />
                  <Requirement met={passwordValidation.rules.hasLowercase} label="One lowercase letter" />
                  <Requirement met={passwordValidation.rules.hasNumber} label="One number" />
                  <Requirement met={passwordValidation.rules.hasSpecial} label="One special character" />
                </ul>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {t('auth.confirmPassword')}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  data-testid="register-confirm-password"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !isFormValid}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="register-submit"
            >
              {isLoading ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          {/* OAuth Divider */}
          <div className="mt-6 relative" data-testid="register-oauth-divider">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-600" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="bg-white dark:bg-gray-800 px-3 text-gray-500 dark:text-gray-400">
                O registrarse con
              </span>
            </div>
          </div>

          {/* OAuth Buttons */}
          <div className="mt-4 space-y-3" data-testid="register-oauth-buttons">
            <OAuthButton
              provider="google"
              onClick={handleGoogleLogin}
              isLoading={isGoogleLoading}
              disabled={isLoading || isAppleLoading}
            />
            <OAuthButton
              provider="apple"
              onClick={handleAppleLogin}
              isLoading={isAppleLoading}
              disabled={isLoading || isGoogleLoading}
            />
          </div>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-rose-500 hover:text-rose-600 font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
