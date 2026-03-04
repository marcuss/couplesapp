/**
 * Register Page
 * User registration page
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Heart, Mail, Lock, Eye, EyeOff, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { LanguageSelector } from '../components/LanguageSelector';
import { ThemeToggle } from '../components/ThemeToggle';

export const RegisterPage: React.FC = () => {
  const { t } = useTranslation();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'));
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await register(email, password, name);
      if (error) {
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

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        {/* Top Right Actions */}
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
            {t('auth.registerSuccess')}
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
      {/* Top Right Actions */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <LanguageSelector />
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-3">
            <Heart className="h-12 w-12 text-rose-500" />
            <span className="text-3xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">
              {t('common.appName')}
            </span>
          </div>
        </div>

        {/* Register Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-2">
            {t('auth.registerTitle')}
          </h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-6">
            {t('auth.registerSubtitle')}
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                  placeholder={t('auth.name')}
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
                  placeholder="you@example.com"
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
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                  placeholder="••••••••"
                  data-testid="register-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
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
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-semibold rounded-lg hover:from-rose-600 hover:to-pink-600 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              data-testid="register-submit"
            >
              {isLoading ? t('common.loading') : t('auth.register')}
            </button>
          </form>

          {/* Login Link */}
          <p className="mt-6 text-center text-gray-600 dark:text-gray-400">
            {t('auth.hasAccount')}{' '}
            <Link
              to="/login"
              className="text-rose-500 hover:text-rose-600 font-medium"
            >
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
