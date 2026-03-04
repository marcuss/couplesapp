/**
 * AWS SES Email Service
 * Reemplaza EmailJS para el envío de invitaciones
 *
 * FROM temporal (testing):  m4rkuz@gmail.com
 * FROM definitivo:          couplesapp-noreply@nextasy.co (cuando el dominio esté verificado)
 *
 * Variables de entorno requeridas:
 *   VITE_AWS_SES_ACCESS_KEY_ID
 *   VITE_AWS_SES_SECRET_ACCESS_KEY
 *   VITE_AWS_REGION        (default: us-east-1)
 *   VITE_SES_FROM_EMAIL    (default: m4rkuz@gmail.com)
 */
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';
import { buildInvitationHtml, buildInvitationText } from './emailTemplates/invitationTemplate';

// Interfaz compatible con el emailService anterior (drop-in replacement)
export interface InvitationEmailParams {
  toEmail: string;
  inviterName: string;
  invitationUrl: string;
}

export interface EmailResult {
  success: boolean;
  error?: Error;
}

/**
 * Crea el cliente SES con la configuración actual de env vars.
 * Se crea dentro de la función para facilitar el testing con mocks.
 */
function createSESClient(): SESv2Client {
  return new SESv2Client({
    region: import.meta.env.VITE_AWS_REGION || 'us-east-1',
    credentials: {
      accessKeyId: import.meta.env.VITE_AWS_SES_ACCESS_KEY_ID || '',
      secretAccessKey: import.meta.env.VITE_AWS_SES_SECRET_ACCESS_KEY || '',
    }
  });
}

/**
 * Envía un email de invitación a la pareja via AWS SES.
 * Drop-in replacement de EmailJS con la misma interfaz.
 *
 * @param params - Parámetros del email
 * @returns { success: boolean, error?: Error }
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
  const { toEmail, inviterName, invitationUrl } = params;

  // Durante testing: usar m4rkuz@gmail.com como FROM temporal
  // Cuando el dominio nextasy.co esté verificado: cambiar a couplesapp-noreply@nextasy.co
  const fromEmail = import.meta.env.VITE_SES_FROM_EMAIL || 'm4rkuz@gmail.com';

  const htmlBody = buildInvitationHtml({ inviterName, invitationUrl });
  const textBody = buildInvitationText({ inviterName, invitationUrl });

  try {
    const client = createSESClient();

    const command = new SendEmailCommand({
      FromEmailAddress: `CouplePlan <${fromEmail}>`,
      Destination: {
        ToAddresses: [toEmail],
      },
      Content: {
        Simple: {
          Subject: {
            Data: `${inviterName} te invita a CouplePlan 💕`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: textBody,
              Charset: 'UTF-8',
            },
          },
        },
      },
    });

    await client.send(command);
    return { success: true };
  } catch (error) {
    console.error('AWS SES error:', error);
    return { success: false, error: error as Error };
  }
}
