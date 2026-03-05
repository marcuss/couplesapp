/**
 * Profile Page
 * User profile with partner connection info
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Heart, 
  Mail, 
  Link2, 
  Unlink, 
  Loader2, 
  ArrowLeft,
  CheckCircle,
  X,
  UserPlus,
  MapPin,
  Navigation
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { setManualCity, detectAndUpdateCity, getCachedCity } from '../../lib/cityDetectionService';
import { ThemeToggle } from '../components/ThemeToggle';
import { LanguageSelector } from '../components/LanguageSelector';

interface Invitation {
  id: string;
  token: string;
  inviter_id: string;
  email: string;
  status: string;
  created_at: string;
  inviter_name?: string;
}

export const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, partner, logout } = useAuth();
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [disconnectSuccess, setDisconnectSuccess] = useState(false);
  const [pendingInvitations, setPendingInvitations] = useState<Invitation[]>([]);
  const [, setIsLoadingInvitations] = useState(true);
  const [respondingTo, setRespondingTo] = useState<string | null>(null);

  // City state
  const [city, setCity] = useState<string>(getCachedCity() ?? '');
  const [isSavingCity, setIsSavingCity] = useState(false);
  const [cityEditValue, setCityEditValue] = useState<string>('');
  const [isEditingCity, setIsEditingCity] = useState(false);
  const [isDetectingCity, setIsDetectingCity] = useState(false);

  // Fetch pending invitations for current user
  useEffect(() => {
    const fetchInvitations = async () => {
      if (!user?.email) return;

      try {
        const { data, error } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', user.email.toLowerCase())
          .eq('status', 'pending');

        if (error) {
          console.error('Error fetching invitations:', error);
          return;
        }

        // Get inviter names
        const invitationsWithNames = await Promise.all(
          (data || []).map(async (inv) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name, email')
              .eq('id', inv.inviter_id)
              .single();
            
            return {
              ...inv,
              inviter_name: profile?.name || profile?.email || 'Unknown',
            };
          })
        );

        setPendingInvitations(invitationsWithNames);
      } catch (err) {
        console.error('Error in fetchInvitations:', err);
      } finally {
        setIsLoadingInvitations(false);
      }
    };

    fetchInvitations();
  }, [user?.email]);

  const handleDisconnect = async () => {
    if (!user?.id || !partner?.id) return;

    setIsDisconnecting(true);

    try {
      // Remove partner_id from both users
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: partnerError } = await supabase
        .from('profiles')
        .update({ partner_id: null })
        .eq('id', partner.id);

      if (partnerError) throw partnerError;

      setDisconnectSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Error disconnecting:', err);
      alert('Failed to disconnect. Please try again.');
    } finally {
      setIsDisconnecting(false);
      setShowDisconnectConfirm(false);
    }
  };

  const handleAcceptInvitation = async (invitation: Invitation) => {
    if (!user?.id) return;

    setRespondingTo(invitation.id);

    try {
      // Update invitation status
      const { error: inviteError } = await supabase
        .from('invitations')
        .update({ status: 'accepted' })
        .eq('id', invitation.id);

      if (inviteError) throw inviteError;

      // Update both users' partner_id
      const { error: userError } = await supabase
        .from('profiles')
        .update({ partner_id: invitation.inviter_id })
        .eq('id', user.id);

      if (userError) throw userError;

      const { error: inviterError } = await supabase
        .from('profiles')
        .update({ partner_id: user.id })
        .eq('id', invitation.inviter_id);

      if (inviterError) throw inviterError;

      // Reload page to reflect changes
      window.location.reload();
    } catch (err) {
      console.error('Error accepting invitation:', err);
      alert('Failed to accept invitation. Please try again.');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleRejectInvitation = async (invitationId: string) => {
    setRespondingTo(invitationId);

    try {
      // Update invitation status to rejected
      const { error } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);

      if (error) throw error;

      // Remove from local state
      setPendingInvitations(prev => prev.filter(inv => inv.id !== invitationId));
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      alert('Failed to reject invitation. Please try again.');
    } finally {
      setRespondingTo(null);
    }
  };

  const handleDetectCity = async () => {
    setIsDetectingCity(true);
    try {
      const { city: detected } = await detectAndUpdateCity();
      if (detected) {
        setCity(detected);
        setCityEditValue(detected);
      }
    } catch (err) {
      console.error('Error detecting city:', err);
    } finally {
      setIsDetectingCity(false);
    }
  };

  const handleSaveCity = async () => {
    const trimmed = cityEditValue.trim();
    if (!trimmed) return;
    setIsSavingCity(true);
    try {
      await setManualCity(trimmed);
      setCity(trimmed);
      setIsEditingCity(false);
    } catch (err) {
      console.error('Error saving city:', err);
    } finally {
      setIsSavingCity(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-rose-500" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/dashboard')}
        className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-1" />
        Back to Dashboard
      </button>

      {/* Disconnect Success Message */}
      {disconnectSuccess && (
        <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <p className="text-green-700 dark:text-green-400">
            Disconnected from {partner?.name || partner?.email}
          </p>
        </div>
      )}

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-8 mb-6">
        <div className="flex items-center space-x-4">
          <div className="w-20 h-20 bg-rose-100 dark:bg-rose-900/30 rounded-full flex items-center justify-center">
            <User className="h-10 w-10 text-rose-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {user.name || 'My Profile'}
            </h1>
            <div className="flex items-center text-gray-500 dark:text-gray-400 mt-1">
              <Mail className="h-4 w-4 mr-1" />
              {user.email}
            </div>
          </div>
        </div>
      </div>

      {/* City Card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6" data-testid="city-section">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <MapPin className="h-5 w-5 text-rose-500" />
          Mi Ciudad
        </h2>

        {isEditingCity ? (
          <div className="flex gap-2">
            <input
              type="text"
              value={cityEditValue}
              onChange={(e) => setCityEditValue(e.target.value)}
              placeholder="Ej: Medellín, Bogotá…"
              className="flex-1 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              data-testid="city-input"
              onKeyDown={(e) => e.key === 'Enter' && handleSaveCity()}
            />
            <button
              onClick={handleSaveCity}
              disabled={isSavingCity || !cityEditValue.trim()}
              className="px-4 py-2 bg-rose-500 text-white text-sm rounded-lg hover:bg-rose-600 disabled:opacity-50"
              data-testid="save-city-btn"
            >
              {isSavingCity ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
            </button>
            <button
              onClick={() => { setIsEditingCity(false); setCityEditValue(city); }}
              className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              Cancelar
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-gray-700 dark:text-gray-300 text-sm">
              {city || <span className="text-gray-400 italic">No configurada</span>}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => { setIsEditingCity(true); setCityEditValue(city); }}
                className="text-sm text-rose-500 hover:text-rose-600"
                data-testid="edit-city-btn"
              >
                Editar
              </button>
              <button
                onClick={handleDetectCity}
                disabled={isDetectingCity}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                data-testid="detect-city-btn"
              >
                {isDetectingCity ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Navigation className="h-3.5 w-3.5" />
                )}
                Detectar
              </button>
            </div>
          </div>
        )}
        <p className="mt-2 text-xs text-gray-400">
          Usamos tu ciudad para mostrar ideas de citas personalizadas cada día.
        </p>
      </div>

      {/* Pending Invitations */}
      {pendingInvitations.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <Heart className="h-5 w-5 text-rose-500 mr-2" />
            Pending Invitations ({pendingInvitations.length})
          </h2>
          <div className="space-y-3">
            {pendingInvitations.map((invitation) => (
              <div
                key={invitation.id}
                className="flex items-center justify-between p-4 bg-rose-50 dark:bg-rose-900/20 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {invitation.inviter_name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    wants to connect with you
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleRejectInvitation(invitation.id)}
                    disabled={respondingTo === invitation.id}
                    className="px-3 py-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                  >
                    {respondingTo === invitation.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <X className="h-5 w-5" />
                    )}
                  </button>
                  <button
                    onClick={() => handleAcceptInvitation(invitation)}
                    disabled={respondingTo === invitation.id}
                    className="px-3 py-2 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    {respondingTo === invitation.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      'Accept'
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Partner Connection */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Heart className="h-5 w-5 text-rose-500 mr-2" />
          Partner Connection
        </h2>

        {partner ? (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Link2 className="h-6 w-6 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900 dark:text-white">
                  Connected
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {partner.name || partner.email}
                </p>
              </div>
              <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-sm rounded-full">
                Active
              </span>
            </div>

            <button
              onClick={() => setShowDisconnectConfirm(true)}
              className="w-full py-3 px-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors flex items-center justify-center"
            >
              <Unlink className="h-5 w-5 mr-2" />
              Disconnect Partner
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <Unlink className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  Not Connected
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Invite your partner to start planning together
                </p>
              </div>
            </div>

            <button
              onClick={() => navigate('/invite')}
              className="w-full py-3 px-4 bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors flex items-center justify-center"
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Invite My Partner
            </button>
          </div>
        )}
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Disconnect Partner?
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to disconnect from{' '}
              <strong>{partner?.name || partner?.email}</strong>? You'll need to send a new invitation to reconnect.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDisconnectConfirm(false)}
                className="flex-1 py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="flex-1 py-3 px-4 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 transition-colors"
              >
                {isDisconnecting ? (
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                ) : (
                  'Disconnect'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preferences / Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm p-6 mb-6" data-testid="preferences-section">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Preferencias
        </h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Modo oscuro</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-700 dark:text-gray-300">Idioma</span>
            <LanguageSelector />
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={logout}
        className="w-full py-3 px-4 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      >
        Log Out
      </button>
    </div>
  );
};

export default ProfilePage;
