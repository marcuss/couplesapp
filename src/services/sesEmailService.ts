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

  const htmlBody = `
    <!DOCTYPE html>
    <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #f43f5e;">💑 CouplePlan</h1>
        </div>
        <h2>¡Tienes una invitación de ${inviterName}!</h2>
        <p>${inviterName} te ha invitado a unirte a CouplePlan para planificar juntos su año.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${invitationUrl}"
             style="background-color: #f43f5e; color: white; padding: 14px 28px;
                    text-decoration: none; border-radius: 8px; font-size: 16px;">
            Aceptar invitación
          </a>
        </div>
        <p style="color: #666; font-size: 14px;">
          Si no esperabas esta invitación, puedes ignorar este correo.
        </p>
        <p style="color: #666; font-size: 14px;">
          O copia este enlace: <a href="${invitationUrl}">${invitationUrl}</a>
        </p>
      </body>
    </html>
  `;

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
            Data: `${inviterName} te invita a CouplePlan`,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: htmlBody,
              Charset: 'UTF-8',
            },
            Text: {
              Data: `${inviterName} te ha invitado a CouplePlan. Acepta aquí: ${invitationUrl}`,
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
