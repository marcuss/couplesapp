/**
 * Welcome Email Template
 * Beautiful HTML email template for new users with i18n support
 * Matches the app's rose/pink romantic theme
 */

import { WelcomeEmailData, EmailTemplate } from './types';
import { welcomeTranslations, interpolate } from './translations';

/**
 * Generate the HTML email template
 */
function generateHtml(data: WelcomeEmailData): string {
  const t = welcomeTranslations[data.language];

  const greeting = interpolate(t.greeting, { name: data.name });

  return `<!DOCTYPE html>
<html lang="${data.language}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.language === 'en' ? 'Welcome to CouplePlan!' : 
    data.language === 'es' ? '¡Bienvenido a CouplePlan!' :
    data.language === 'fr' ? 'Bienvenue sur CouplePlan !' :
    data.language === 'nl' ? 'Welkom bij CouplePlan!' :
    data.language === 'zh' ? '欢迎使用 CouplePlan！' :
    data.language === 'ko' ? 'CouplePlan에 오신 것을 환영합니다!' :
    'Benvenuto su CouplePlan!'}</title>
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
              <!-- Welcome Message -->
              <p style="margin: 0 0 16px 0; color: #374151; font-size: 24px; font-weight: 700; line-height: 1.3;">
                ${data.language === 'en' ? 'Welcome! 🎉' : 
                  data.language === 'es' ? '¡Bienvenido! 🎉' :
                  data.language === 'fr' ? 'Bienvenue ! 🎉' :
                  data.language === 'nl' ? 'Welkom! 🎉' :
                  data.language === 'zh' ? '欢迎！🎉' :
                  data.language === 'ko' ? '환영합니다! 🎉' :
                  'Benvenuto! 🎉'}
              </p>
              
              <!-- Greeting -->
              <p style="margin: 0 0 24px 0; color: #374151; font-size: 18px; font-weight: 600; line-height: 1.5;">
                ${greeting}
              </p>
              
              <!-- Message -->
              <p style="margin: 0 0 32px 0; color: #4b5563; font-size: 16px; line-height: 1.7;">
                ${t.message}
              </p>
              
              <!-- Features Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px 0; background: linear-gradient(135deg, #fff1f2 0%, #fdf2f8 100%); border-radius: 16px; padding: 28px; border: 1px solid #fce7f3;">
                <tr>
                  <td>
                    <p style="margin: 0 0 20px 0; color: #be185d; font-size: 15px; font-weight: 600;">
                      ${t.welcomeMessage}
                    </p>
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      ${t.features.map((feature, index) => `
                        <tr>
                          <td style="padding: 10px 0; border-bottom: ${index < t.features.length - 1 ? '1px solid #fbcfe8' : 'none'};">
                            <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                              <tr>
                                <td style="width: 28px; vertical-align: top;">
                                  <span style="display: inline-block; width: 22px; height: 22px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); border-radius: 50%; text-align: center; line-height: 22px; color: #ffffff; font-size: 12px; font-weight: 700;">✓</span>
                                </td>
                                <td style="vertical-align: middle;">
                                  <span style="color: #881337; font-size: 14px; font-weight: 500;">${feature}</span>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      `).join('')}
                    </table>
                  </td>
                </tr>
              </table>
              
              <!-- CTA Button -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0 0 32px 0;">
                <tr>
                  <td align="center">
                    <a href="${data.appUrl}" class="button" style="display: inline-block; padding: 18px 48px; background: linear-gradient(135deg, #f43f5e 0%, #ec4899 100%); color: #ffffff; text-decoration: none; border-radius: 12px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 14px rgba(244, 63, 94, 0.4); transition: all 0.3s ease;">
                      ${t.getStarted}
                    </a>
                  </td>
                </tr>
              </table>
              
              <!-- Tips Section -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin: 0; background: #fefce8; border-radius: 12px; padding: 20px; border-left: 4px solid #eab308;">
                <tr>
                  <td>
                    <p style="margin: 0 0 12px 0; color: #854d0e; font-size: 14px; font-weight: 600;">
                      💡 ${data.language === 'en' ? 'Pro Tip' : 
                        data.language === 'es' ? 'Consejo Pro' :
                        data.language === 'fr' ? 'Conseil Pro' :
                        data.language === 'nl' ? 'Pro Tip' :
                        data.language === 'zh' ? '专业提示' :
                        data.language === 'ko' ? '프로 팁' :
                        'Consiglio Pro'}
                    </p>
                    <p style="margin: 0; color: #a16207; font-size: 13px; line-height: 1.6;">
                      ${data.language === 'en' ? "Invite your partner to join you! Go to your Profile and click 'Invite Partner' to send them an invitation." : 
                        data.language === 'es' ? "¡Invita a tu pareja a unirse! Ve a tu Perfil y haz clic en 'Invitar Pareja' para enviarle una invitación." :
                        data.language === 'fr' ? "Invitez votre partenaire à vous rejoindre ! Allez dans votre Profil et cliquez sur 'Inviter un Partenaire' pour lui envoyer une invitation." :
                        data.language === 'nl' ? "Nodig je partner uit om mee te doen! Ga naar je Profiel en klik op 'Partner Uitnodigen' om een uitnodiging te sturen." :
                        data.language === 'zh' ? "邀请您的伴侣加入！前往您的个人资料，点击'邀请伴侣'向他们发送邀请。" :
                        data.language === 'ko' ? "파트너를 초대하세요! 프로필로 가서 '파트너 초대'를 클릭하여 초대장을 별내세요." :
                        "Invita il tuo partner a unirsi a te! Vai al tuo Profilo e clicca su 'Invita Partner' per inviargli un invito."}
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
function generateText(data: WelcomeEmailData): string {
  const t = welcomeTranslations[data.language];

  const greeting = interpolate(t.greeting, { name: data.name });

  return `${greeting}

${t.message}

${t.welcomeMessage}
${t.features.map(f => `- ${f}`).join('\n')}

${t.getStarted}: ${data.appUrl}

---
${t.footer}`;
}

/**
 * Get the subject line for the email
 */
function getSubject(data: WelcomeEmailData): string {
  const subjects: Record<string, string> = {
    en: 'Welcome to CouplePlan! 💕',
    es: '¡Bienvenido a CouplePlan! 💕',
    fr: 'Bienvenue sur CouplePlan ! 💕',
    nl: 'Welkom bij CouplePlan! 💕',
    zh: '欢迎使用 CouplePlan！💕',
    ko: 'CouplePlan에 오신 것을 환영합니다! 💕',
    it: 'Benvenuto su CouplePlan! 💕',
  };
  return subjects[data.language] || subjects.en;
}

/**
 * Create the complete welcome email template
 */
export function createWelcomeEmail(data: WelcomeEmailData): EmailTemplate<WelcomeEmailData> {
  return {
    subject: getSubject(data),
    html: generateHtml(data),
    text: generateText(data),
    data,
  };
}

export default createWelcomeEmail;
