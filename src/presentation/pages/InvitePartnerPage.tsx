/**
 * Invite Partner Page
 * Page for sending partner invitations with i18n email support
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Heart, Send, Loader2, CheckCircle, ArrowLeft, Globe } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createInvitationEmail, LanguageCode } from '../../templates/emails';
import { availableLanguages } from '../../i18n';

export const InvitePartnerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();
  const [email, setEmail] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>((i18n.language?.split('-')[0] as LanguageCode) || 'en');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setError('Please enter an email address');
      return;
    }

    if (!user) {
      setError('You must be logged in to invite a partner');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Generate a unique id (used as token in invitation URL)
      const id = crypto.randomUUID();
      
      // Create invitation in database
      const { error: inviteError } = await supabase
        .from('invitations')
        .insert({
          id,
          from_user_id: user.id,
          to_email: email.trim().toLowerCase(),
          status: 'pending',
        });

      if (inviteError) {
        throw inviteError;
      }

      // Get the base URL from environment variable or fallback
      const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
      const invitationUrl = `${baseUrl}/invitation/${id}`;

      // Generate the email template with i18n support
      const emailTemplate = createInvitationEmail({
        inviterName: user.name || user.email,
        invitationUrl,
        language: selectedLanguage,
        expiresInDays: 7,
      });

      // Send invitation email via Supabase Edge Function
      const { error: emailError } = await supabase.functions.invoke('send-email', {
        body: {
          to: email.trim().toLowerCase(),
          subject: emailTemplate.subject,
          html: emailTemplate.html,
          text: emailTemplate.text,
        },
      });

      if (emailError) {
        console.error('Error sending email:', emailError);
        // Don't throw - invitation was created, email might fail silently
      }

      setSuccess(true);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invitation Sent!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent an invitation to <strong>{email}</strong>. They'll receive an email with instructions to connect with you.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>

          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-rose-100 dark:bg-rose-900/30 rounded-full mb-4">
              <Heart className="h-8 w-8 text-rose-500" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invite Your Partner
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Send an invitation to your partner to start planning together
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Input */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Partner's Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="partner@example.com"
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                disabled={isLoading}
              />
            </div>

            {/* Language Selector */}
            <div>
              <label 
                htmlFor="language" 
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                <Globe className="inline-block h-4 w-4 mr-1" />
                Email Language
              </label>
              <select
                id="language"
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as LanguageCode)}
                className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                disabled={isLoading}
              >
                {availableLanguages.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Select the language for the invitation email your partner will receive.
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email.trim()}
              className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Sending Invitation...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5 mr-2" />
                  Send Invitation
                </>
              )}
            </button>
          </form>

          {/* Info */}
          <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
            <p className="text-sm text-rose-700 dark:text-rose-300">
              Your partner will receive a beautifully designed email with a link to accept your invitation. 
              The invitation will expire in 7 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitePartnerPage;
