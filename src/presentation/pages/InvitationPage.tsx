/**
 * Invitation Page
 * Page for accepting partner invitations
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, CheckCircle, XCircle, Loader2, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface InvitationData {
  id: string;
  token: string;
  inviter_id: string;
  email: string;
  status: string;
  inviter_name?: string;
  inviter_email?: string;
}

export const InvitationPage: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  // const [searchParams] = useSearchParams(); // Available for future use
  // const emailFromUrl = searchParams.get('email');
  const navigate = useNavigate();
  const { user, acceptInvitation } = useAuth();
  
  const [status, setStatus] = useState<'loading' | 'valid' | 'invalid' | 'accepted' | 'error' | 'register'>('loading');
  const [isProcessing, setIsProcessing] = useState(false);
  const [invitation, setInvitation] = useState<InvitationData | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  // Registration form state (for new users)
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStatus('invalid');
        return;
      }

      try {
        // Fetch invitation from database
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('token', token)
          .single();

        if (error || !data) {
          setStatus('invalid');
          return;
        }

        // Check if invitation is pending
        if (data.status !== 'pending') {
          setStatus('invalid');
          setErrorMessage('This invitation has already been used or expired.');
          return;
        }

        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setStatus('invalid');
          setErrorMessage('This invitation has expired.');
          return;
        }

        // Get inviter info
        const { data: inviterProfile } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', data.inviter_id)
          .single();

        setInvitation({
          ...data,
          inviter_name: inviterProfile?.name,
          inviter_email: inviterProfile?.email,
        });

        setStatus('valid');
      } catch (err) {
        console.error('Error validating invitation:', err);
        setStatus('invalid');
      }
    };

    validateToken();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // User needs to register/login first
      setStatus('register');
      return;
    }

    if (!invitation) return;

    setIsProcessing(true);

    try {
      // Check if user email matches invitation email
      if (user.email?.toLowerCase() !== invitation.email.toLowerCase()) {
        setErrorMessage('This invitation was sent to a different email address.');
        setStatus('error');
        setIsProcessing(false);
        return;
      }

      // Update invitation status
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      // Update current user's partner_id
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: invitation.inviter_id })
        .eq('id', user.id);

      if (userError) throw userError;

      // Update inviter's partner_id
      const { error: inviterError } = await supabase
        .from('profiles')
        .update({ partner_id: user.id })
        .eq('id', invitation.inviter_id);

      if (inviterError) throw inviterError;

      setStatus('accepted');
    } catch (err) {
      console.error('Error accepting invitation:', err);
      setErrorMessage('Failed to accept invitation. Please try again.');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    if (!invitation) {
      navigate('/');
      return;
    }

    try {
      // Update invitation status to rejected
      await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitation.id);
    } catch (err) {
      console.error('Error declining invitation:', err);
    }

    navigate('/');
  };

  const handleRegisterAndAccept = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!invitation) return;

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters');
      return;
    }

    setIsProcessing(true);
    setErrorMessage('');

    try {
      const { error } = await acceptInvitation(token!, password, name);

      if (error) {
        setErrorMessage(error.message);
        setStatus('error');
      } else {
        setStatus('accepted');
      }
    } catch (err) {
      console.error('Error in registration:', err);
      setErrorMessage('Failed to create account. Please try again.');
      setStatus('error');
    } finally {
      setIsProcessing(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-center">
          <Loader2 className="h-12 w-12 text-rose-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invalid Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {errorMessage || 'This invitation link is invalid or has expired. Please ask your partner to send a new invitation.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-md">
          <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Oops!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{errorMessage}</p>
          <button
            onClick={() => setStatus('valid')}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (status === 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="text-center max-w-md">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Invitation Accepted!
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You are now connected with {invitation?.inviter_name || invitation?.inviter_email || 'your partner'}. 
            Start planning your future together!
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center mx-auto"
          >
            Go to Dashboard
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        </div>
      </div>
    );
  }

  if (status === 'register') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
        <div className="w-full max-w-md">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
            <div className="text-center mb-6">
              <Heart className="h-12 w-12 text-rose-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Create Your Account
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {invitation?.inviter_name || invitation?.inviter_email} invited you to join CouplePlan!
              </p>
            </div>

            {errorMessage && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{errorMessage}</p>
              </div>
            )}

            <form onSubmit={handleRegisterAndAccept} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={invitation?.email || ''}
                  disabled
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-600 text-gray-500 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email is linked to the invitation
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                  minLength={6}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-rose-500 focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account & Accept'
                )}
              </button>
            </form>

            <button
              onClick={handleDecline}
              className="w-full mt-4 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Decline Invitation
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <div className="w-full max-w-md">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          <Heart className="h-16 w-16 text-rose-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Partner Invitation
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            You've been invited by
          </p>
          <p className="text-lg font-semibold text-rose-600 dark:text-rose-400 mb-6">
            {invitation?.inviter_name || invitation?.inviter_email}
          </p>

          <div className="bg-rose-50 dark:bg-rose-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-rose-700 dark:text-rose-300 mb-2">
              By accepting this invitation, you'll be able to:
            </p>
            <ul className="text-sm text-rose-600 dark:text-rose-400 text-left space-y-1">
              <li>• Share and track goals together</li>
              <li>• Manage budgets as a couple</li>
              <li>• Plan events and special dates</li>
              <li>• Collaborate on tasks</li>
            </ul>
          </div>

          {user && user.email?.toLowerCase() !== invitation?.email.toLowerCase() && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                <strong>Note:</strong> This invitation was sent to <strong>{invitation?.email}</strong>, 
                but you're logged in as <strong>{user.email}</strong>. 
                Please log out and use the correct email address.
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleDecline}
              className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={isProcessing || (user?.email?.toLowerCase() !== invitation?.email.toLowerCase() && !!user)}
              className="flex-1 py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Processing...
                </>
              ) : (
                'Accept Invitation'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationPage;
