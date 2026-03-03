/**
 * Email Service
 * Service for sending emails using i18n-capable templates
 */

import { supabase } from '../lib/supabase';
import {
  createInvitationEmail,
  createWelcomeEmail,
  InvitationEmailData,
  WelcomeEmailData,
  LanguageCode,
} from '../templates/emails';

export interface SendInvitationParams {
  to: string;
  inviterName: string;
  invitationUrl: string;
  language?: LanguageCode;
  expiresInDays?: number;
}

export interface SendWelcomeParams {
  to: string;
  name: string;
  appUrl: string;
  language?: LanguageCode;
}

export interface EmailResult {
  success: boolean;
  error?: string;
}

/**
 * Send an invitation email to a potential partner
 */
export async function sendInvitationEmail(params: SendInvitationParams): Promise<EmailResult> {
  const {
    to,
    inviterName,
    invitationUrl,
    language = 'en',
    expiresInDays = 7,
  } = params;

  try {
    // Generate the email template
    const emailData: InvitationEmailData = {
      inviterName,
      invitationUrl,
      language,
      expiresInDays,
    };

    const emailTemplate = createInvitationEmail(emailData);

    // Send via Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      },
    });

    if (error) {
      console.error('Error sending invitation email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error sending invitation email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Send a welcome email to a new user
 */
export async function sendWelcomeEmail(params: SendWelcomeParams): Promise<EmailResult> {
  const {
    to,
    name,
    appUrl,
    language = 'en',
  } = params;

  try {
    // Generate the email template
    const emailData: WelcomeEmailData = {
      name,
      appUrl,
      language,
    };

    const emailTemplate = createWelcomeEmail(emailData);

    // Send via Supabase Edge Function
    const { error } = await supabase.functions.invoke('send-email', {
      body: {
        to,
        subject: emailTemplate.subject,
        html: emailTemplate.html,
        text: emailTemplate.text,
      },
    });

    if (error) {
      console.error('Error sending welcome email:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error sending welcome email:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error occurred',
    };
  }
}

/**
 * Generate email template without sending (for preview/debugging)
 */
export function generateInvitationEmailPreview(
  inviterName: string,
  invitationUrl: string,
  language: LanguageCode = 'en',
  expiresInDays: number = 7
): { subject: string; html: string; text: string } {
  const emailData: InvitationEmailData = {
    inviterName,
    invitationUrl,
    language,
    expiresInDays,
  };

  const template = createInvitationEmail(emailData);
  return {
    subject: template.subject,
    html: template.html,
    text: template.text,
  };
}

/**
 * Generate welcome email template without sending (for preview/debugging)
 */
export function generateWelcomeEmailPreview(
  name: string,
  appUrl: string,
  language: LanguageCode = 'en'
): { subject: string; html: string; text: string } {
  const emailData: WelcomeEmailData = {
    name,
    appUrl,
    language,
  };

  const template = createWelcomeEmail(emailData);
  return {
    subject: template.subject,
    html: template.html,
    text: template.text,
  };
}

export default {
  sendInvitationEmail,
  sendWelcomeEmail,
  generateInvitationEmailPreview,
  generateWelcomeEmailPreview,
};
