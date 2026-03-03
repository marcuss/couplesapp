/**
 * Email Template Types
 * Type definitions for i18n-capable email templates
 */

export type LanguageCode = 'en' | 'es' | 'fr' | 'nl' | 'zh' | 'ko' | 'it';

export interface InvitationEmailData {
  inviterName: string;
  invitationUrl: string;
  language: LanguageCode;
  expiresInDays?: number;
}

export interface WelcomeEmailData {
  name: string;
  appUrl: string;
  language: LanguageCode;
}

export interface EmailTemplate<T> {
  subject: string;
  html: string;
  text: string;
  data: T;
}

export interface EmailTranslations {
  subject: string;
  greeting: string;
  message: string;
  buttonText: string;
  expiresText: string;
  footer: string;
  welcomeMessage: string;
  features: string[];
  getStarted: string;
}
