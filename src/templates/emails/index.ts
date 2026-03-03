/**
 * Email Templates
 * Central export for all email templates in the CouplePlan application
 */

// Types
export type {
  LanguageCode,
  InvitationEmailData,
  WelcomeEmailData,
  EmailTemplate,
  EmailTranslations,
} from './types';

// Translations
export { invitationTranslations, welcomeTranslations, interpolate } from './translations';

// Templates
export { createInvitationEmail } from './invitation-template';
export { createWelcomeEmail } from './welcome-template';

// Default exports
export { default as createInvitationEmailDefault } from './invitation-template';
export { default as createWelcomeEmailDefault } from './welcome-template';
