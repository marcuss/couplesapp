/**
 * Invite Partner Page
 * Two tabs: Send by Email (existing flow) + Share Link (new flow)
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Heart,
  Send,
  Loader2,
  CheckCircle,
  ArrowLeft,
  Globe,
  Link2,
  Copy,
  Check,
  Share2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { createInvitationEmail, LanguageCode } from '../../templates/emails';
import { availableLanguages } from '../../i18n';
import { getInvitationUrl } from '../../lib/appUrl';

// ── CopyLinkButton ────────────────────────────────────────────────────────────

interface CopyLinkButtonProps {
  url: string;
  className?: string;
}

export const CopyLinkButton: React.FC<CopyLinkButtonProps> = ({ url, className = '' }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? 'Copied!' : 'Copy link'}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all
        ${copied
          ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
        } ${className}`}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4" />
          Copied!
        </>
      ) : (
        <>
          <Copy className="h-4 w-4" />
          Copy
        </>
      )}
    </button>
  );
};

// ── InvitationLinkField ───────────────────────────────────────────────────────

interface InvitationLinkFieldProps {
  url: string;
}

const InvitationLinkField: React.FC<InvitationLinkFieldProps> = ({ url }) => {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = async () => {
    try {
      await navigator.share({ title: 'Join me on CouplesApp', url });
    } catch {
      // User cancelled or error
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        Invitation Link
      </label>
      <div className="flex gap-2">
        <input
          type="text"
          readOnly
          value={url}
          onFocus={(e) => e.target.select()}
          className="flex-1 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700/50 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:border-transparent"
        />
        <CopyLinkButton url={url} />
        {canShare && (
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 hover:bg-rose-200 dark:hover:bg-rose-900/50 transition-all"
          >
            <Share2 className="h-4 w-4" />
            Share
          </button>
        )}
      </div>
    </div>
  );
};

// ── Main page ─────────────────────────────────────────────────────────────────

type Tab = 'email' | 'link';

export const InvitePartnerPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { i18n } = useTranslation();

  // Tab
  const [activeTab, setActiveTab] = useState<Tab>('email');

  // Email tab state
  const [email, setEmail] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>(
    (i18n.language as LanguageCode) || 'en'
  );
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailInviteUrl, setEmailInviteUrl] = useState<string | null>(null);

  // Link tab state
  const [isLinkLoading, setIsLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

  // ── Email submit ──────────────────────────────────────────────────────────

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      setEmailError('Please enter an email address');
      return;
    }
    if (!user) {
      setEmailError('You must be logged in to invite a partner');
      return;
    }

    setIsEmailLoading(true);
    setEmailError(null);

    try {
      const token = crypto.randomUUID();

      const { error: inviteError } = await supabase.from('invitations').insert({
        token,
        inviter_id: user.id,
        email: email.trim().toLowerCase(),
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (inviteError) throw inviteError;

      const invitationUrl = getInvitationUrl(token);
      setEmailInviteUrl(invitationUrl);

      const emailTemplate = createInvitationEmail({
        inviterName: user.name || user.email,
        invitationUrl,
        language: selectedLanguage,
        expiresInDays: 7,
      });

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
      }

      setEmailSuccess(true);
    } catch (err) {
      console.error('Error sending invitation:', err);
      setEmailError(err instanceof Error ? err.message : 'Failed to send invitation');
    } finally {
      setIsEmailLoading(false);
    }
  };

  // ── Link generation ───────────────────────────────────────────────────────

  const handleGenerateLink = async () => {
    if (!user) {
      setLinkError('You must be logged in to generate an invitation link');
      return;
    }

    setIsLinkLoading(true);
    setLinkError(null);

    try {
      const token = crypto.randomUUID();

      const { error: inviteError } = await supabase.from('invitations').insert({
        token,
        inviter_id: user.id,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      });

      if (inviteError) throw inviteError;

      setGeneratedUrl(getInvitationUrl(token));
    } catch (err) {
      console.error('Error generating link:', err);
      setLinkError(err instanceof Error ? err.message : 'Failed to generate link');
    } finally {
      setIsLinkLoading(false);
    }
  };

  // ── Success screen (email tab) ────────────────────────────────────────────

  if (emailSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Invitation Sent!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              We've sent an invitation to <strong>{email}</strong>. They'll receive an email with
              instructions to connect with you.
            </p>

            {emailInviteUrl && (
              <div className="mb-6 text-left">
                <InvitationLinkField url={emailInviteUrl} />
              </div>
            )}

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

  // ── Main layout ───────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Back"
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>

          {/* Header */}
          <div className="text-center mb-6">
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

          {/* Tabs */}
          <div role="tablist" className="flex rounded-lg bg-gray-100 dark:bg-gray-700/50 p-1 mb-6">
            <button
              role="tab"
              aria-selected={activeTab === 'email'}
              onClick={() => setActiveTab('email')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'email'
                  ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Send className="h-4 w-4" />
              Send by email
            </button>
            <button
              role="tab"
              aria-selected={activeTab === 'link'}
              onClick={() => setActiveTab('link')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                activeTab === 'link'
                  ? 'bg-white dark:bg-gray-800 text-rose-600 dark:text-rose-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Link2 className="h-4 w-4" />
              Share link
            </button>
          </div>

          {/* ── Tab A: Email ── */}
          {activeTab === 'email' && (
            <>
              {emailError && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{emailError}</p>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-6">
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
                    disabled={isEmailLoading}
                  />
                </div>

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
                    disabled={isEmailLoading}
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
                  disabled={isEmailLoading || !email.trim()}
                  className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isEmailLoading ? (
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

              <div className="mt-6 p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                <p className="text-sm text-rose-700 dark:text-rose-300">
                  Your partner will receive a beautifully designed email with a link to accept your
                  invitation. The invitation will expire in 7 days.
                </p>
              </div>
            </>
          )}

          {/* ── Tab B: Share Link ── */}
          {activeTab === 'link' && (
            <div className="space-y-6">
              {linkError && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-600 dark:text-red-400">{linkError}</p>
                </div>
              )}

              {generatedUrl ? (
                <>
                  <InvitationLinkField url={generatedUrl} />

                  <div className="p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg">
                    <p className="text-sm text-rose-700 dark:text-rose-300">
                      Share this link with your partner. It will expire in 7 days.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setGeneratedUrl(null);
                      setLinkError(null);
                    }}
                    className="w-full py-2 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm"
                  >
                    Generate a new link
                  </button>
                </>
              ) : (
                <>
                  <div className="text-center py-4">
                    <Link2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Generate a unique invitation link to share with your partner via any channel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateLink}
                    disabled={isLinkLoading}
                    aria-label="Generate invitation link"
                    className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                  >
                    {isLinkLoading ? (
                      <>
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Link2 className="h-5 w-5 mr-2" />
                        Generate invitation link
                      </>
                    )}
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvitePartnerPage;
