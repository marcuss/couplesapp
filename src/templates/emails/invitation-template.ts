/**
 * Invitation Email Template
 * Beautiful HTML email template for partner invitations with i18n support
 * Matches the app's rose/pink romantic theme
 */

import { InvitationEmailData, EmailTemplate } from './types';
import { invitationTranslations, interpolate } from './translations';

/**
 * Generate the HTML email template
 */
function generateHtml(data: InvitationEmailData): string {
  const t = invitationTranslations[data.language];
  const expiresInDays = data.expiresInDays || 7;

  const message = interpolate(t.message, { inviterName: data.inviterName });
  const expiresText = interpolate(t.expiresText, { expiresInDays });

  return `<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${t.subject}</title>
  <style>
    @media only screen and (max-width: 600px) {
      .container { width: 100% !important; padding: 20px !important; }
      .content { padding: 30px 20px !important; }
      .button { width: 100% !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background: linear-gradient(135deg, #fff1f2 0%, #fce7f3 100%); font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <!-- Main Container -->
        <table role="presentation" class="container" cellspacing="0" cellpadding="0" border="0" width="600" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 24px; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15); overflow: hidden;">
          
          <!-- Header with Gradient -->
          <tr>
            <td style="background: linear-gradient(135deg, #f43f5e 0%, #ec4899 50%, #f472b6 100%); padding: 50px 40px; text-align: center;">
              <!-- Logo/Heart Icon -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
                <tr>
                  <td style="width: 80px; height: 80px; background: rgba(255, 255, 255, 0.2); border-radius: 50%; text-align: center; vertical-align: middle;">
                    <span style="font-size: 40px; line-height: 80px;">💕</span>
                  </td>
                </tr>
              </table>
              <h1 style="margin: 24px 0 0 0; color: #ffffff; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
                CouplePlan
              </h1>
              <p style="margin: 8px 0 0 0; color: rgba(255, 255, 255, 0.9); font-size: 16px; font-weight: 400;">
                Plan your life together
              </p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td class="content" style="padding: 48px 40px; background: #ffffff;">
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; font-weight: 600; line-height: 1.5;">
                ${t.greeting}
              </p>
              
              <!-- Message -->
              <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                ${message}
              </p>
              
              <!-- Feature Highlights -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px 0; background: #fff1f2; border-radius: 16px; padding: 24px;">
                <tr>
                  <td>
                    <p style="margin: 0 0 16px 0; color: #be185d; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px;">
                      ${data.language === 'en' ? 'What you can do together:' : 
                        data.language === 'es' ? 'Lo que pueden hacer juntos:' :
                        data.language === 'fr' ? 'Ce que vous pouvez faire ensemble :' :
                        data.language === 'nl' ? 'Wat je samen kunt doen:' :
                        data.language === 'zh' ? '你们可以一起做的事情：' :
                        data.language === 'ko' ? '함께 할 수 있는 것:' :
                        'Cosa potete fare insieme:'}
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                      ${getFeaturesList(data.language)}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.invitationUrl}" class="button" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4); transition: all 0.3s ease;">
                      ${t.buttonText}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- URL Fallback -->
              <p style="margin: 0 0 24px 0; color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; word-break: break-all;">
                ${data.language === 'en' ? "Or copy and paste this link:" : 
                  data.language === 'es' ? "O copia y pega este enlace:" :
                  data.language === 'fr' ? "Ou copiez et collez ce lien :" :
                  data.language === 'nl' ? "Of kopieer en plak deze link:" :
                  data.language === 'zh' ? "或复制粘贴此链接：" :
                  data.language === 'ko' ? "또는 이 링크를 복사하여 붙여넣기:" :
                  "O copia e incolla questo link:"}
                <br>
                <a href="${data.invitationUrl}" style="color: #ec4899; text-decoration: underline;">${data.invitationUrl}</a>
              </p>
              
              <!-- Expiration Notice -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0;">
                <tr>
                  <td style="background: #fef3c7; border-radius: 8px; padding: 12px 16px; text-align: center;">
                    <p style="margin: 0; color: #92400e; font-size: 13px; font-weight: 500;">
                      ⏰ ${expiresText}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 32px 40px; background: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="margin: 0 0 16px 0; color: #9ca3af; font-size: 14px; line-height: 1.6; white-space: pre-line;">
                ${t.footer}
              </p>
              <p style="margin: 0; color: #d1d5db; font-size: 12px;">
                © ${new Date().getFullYear()} CouplePlan. ${data.language === 'en' ? 'All rights reserved.' : 
                  data.language === 'es' ? 'Todos los derechos reservados.' :
                  data.language === 'fr' ? 'Tous droits réservés.' :
                  data.language === 'nl' ? 'Alle rechten voorbehouden.' :
                  data.language === 'zh' ? '版权所有。' :
                  data.language === 'ko' ? '모든 권리 보유.' :
                  'Tutti i diritti riservati.'}
              </p>
            </td>
          </tr>
          
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Generate the plain text version of the email
 */
function generateText(data: InvitationEmailData): string {
  const t = invitationTranslations[data.language];
  const expiresInDays = data.expiresInDays || 7;

  const message = interpolate(t.message, { inviterName: data.inviterName });
  const expiresText = interpolate(t.expiresText, { expiresInDays });

  return `${t.greeting}

${message}

${data.language === 'en' ? 'Click the link below to accept the invitation:' : 
  data.language === 'es' ? 'Haz clic en el enlace de abajo para aceptar la invitación:' :
  data.language === 'fr' ? 'Cliquez sur le lien ci-dessous pour accepter l\'invitation :' :
  data.language === 'nl' ? 'Klik op de onderstaande link om de uitnodiging te accepteren:' :
  data.language === 'zh' ? '点击以下链接接受邀请：' :
  data.language === 'ko' ? '초대를 수락하려면 아래 링크를 클릭하세요:' :
  'Clicca sul link qui sotto per accettare l\'invito:'}

${data.invitationUrl}

${expiresText}

---
${t.footer}`;
}

/**
 * Get the subject line for the email
 */
function getSubject(data: InvitationEmailData): string {
  return invitationTranslations[data.language].subject;
}

/**
 * Generate feature list HTML based on language
 */
function getFeaturesList(language: string): string {
  const features: Record<string, string[]> = {
    en: ['📅 Plan events together', '🎯 Set shared goals', '💰 Manage budgets', '✅ Track tasks'],
    es: ['📅 Planificar eventos juntos', '🎯 Establecer metas compartidas', '💰 Gestionar presupuestos', '✅ Seguir tareas'],
    fr: ['📅 Planifiez des événements ensemble', '🎯 Définissez des objectifs communs', '💰 Gérez les budgets', '✅ Suivez les tâches'],
    nl: ['📅 Plan evenementen samen', '🎯 Stel gedeelde doelen', '💰 Beheer budgetten', '✅ Volg taken'],
    zh: ['📅 一起规划活动', '🎯 设定共同目标', '💰 管理预算', '✅ 跟踪任务'],
    ko: ['📅 함께 이벤트 계획', '🎯 공동 목표 설정', '💰 예산 관리', '✅ 작업 추적'],
    it: ['📅 Pianifica eventi insieme', '🎯 Imposta obiettivi condivisi', '💰 Gestisci i budget', '✅ Tieni traccia delle attività'],
  };

  const list = features[language] || features.en;
  return list.map(feature => `
    <tr>
      <td style="padding: 6px 0; color: #881337; font-size: 14px;">
        ${feature}
      </td>
    </tr>
  `).join('');
}

/**
 * Normalize a language code to its base form (e.g. 'en-US' → 'en').
 * Falls back to 'en' if the normalized code is not in the translations.
 */
function normalizeLanguage(lang: string): LanguageCode {
  const base = lang.split('-')[0] as LanguageCode;
  return invitationTranslations[base] ? base : 'en';
}

/**
 * Create the complete invitation email template
 */
export function createInvitationEmail(data: InvitationEmailData): EmailTemplate<InvitationEmailData> {
  const normalizedData = { ...data, language: normalizeLanguage(data.language) };
  return {
    subject: getSubject(normalizedData),
    html: generateHtml(normalizedData),
    text: generateText(normalizedData),
    data: normalizedData,
  };
}

export default createInvitationEmail;
