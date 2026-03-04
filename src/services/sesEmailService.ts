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

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  const htmlBody = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a CouplePlan</title>
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background-color:#0f0f0f;">

  <div style="max-width:480px;margin:0 auto;background:#18181b;border-radius:0;">

    <!-- Header gradient -->
    <div style="background:linear-gradient(135deg,#be123c 0%,#f43f5e 40%,#ec4899 70%,#8b5cf6 100%);padding:36px 24px 32px;text-align:center;">
      <div style="width:64px;height:64px;background:rgba(255,255,255,0.15);border-radius:18px;margin:0 auto 16px;display:inline-block;line-height:64px;font-size:34px;">💕</div>
      <h1 style="color:#ffffff;font-size:26px;font-weight:800;margin:0 0 4px;letter-spacing:-0.5px;">CouplePlan</h1>
      <p style="color:rgba(255,255,255,0.75);font-size:13px;margin:0;font-weight:400;">Planifica tu futuro juntos</p>
    </div>

    <!-- Body -->
    <div style="padding:28px 24px 20px;">

      <p style="color:#f4f4f5;font-size:17px;font-weight:600;margin:0 0 6px;">¡Hola! 👋</p>
      <p style="color:#a1a1aa;font-size:14px;line-height:1.65;margin:0 0 24px;">
        <span style="color:#f43f5e;font-weight:600;">${inviterName}</span> te ha invitado a unirte a <strong style="color:#f4f4f5;">CouplePlan</strong> para planificar juntos su año.
      </p>

      <!-- Features card -->
      <div style="background:#27272a;border-radius:14px;padding:20px 20px 14px;margin-bottom:26px;border:1px solid #3f3f46;">
        <p style="color:#f43f5e;font-size:11px;font-weight:700;margin:0 0 14px;text-transform:uppercase;letter-spacing:0.8px;">Con CouplePlan pueden:</p>
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="padding:0 8px 10px 0;width:50%;vertical-align:top;">
              <span style="font-size:13px;color:#d4d4d8;">📅 Calendarios compartidos</span>
            </td>
            <td style="padding:0 0 10px 8px;width:50%;vertical-align:top;">
              <span style="font-size:13px;color:#d4d4d8;">🎯 Metas anuales</span>
            </td>
          </tr>
          <tr>
            <td style="padding:0 8px 10px 0;vertical-align:top;">
              <span style="font-size:13px;color:#d4d4d8;">💰 Presupuestos</span>
            </td>
            <td style="padding:0 0 10px 8px;vertical-align:top;">
              <span style="font-size:13px;color:#d4d4d8;">✈️ Viajes juntos</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:0;vertical-align:top;">
              <span style="font-size:13px;color:#d4d4d8;">✅ División de tareas</span>
            </td>
          </tr>
        </table>
      </div>

      <!-- CTA -->
      <a href="${invitationUrl}"
         style="display:block;background:linear-gradient(135deg,#f43f5e 0%,#ec4899 100%);color:#ffffff;text-decoration:none;padding:17px 24px;border-radius:12px;font-size:16px;font-weight:700;text-align:center;letter-spacing:0.2px;margin-bottom:16px;">
        Aceptar Invitación 💕
      </a>

      <!-- Fallback link -->
      <p style="color:#71717a;font-size:11px;text-align:center;margin:0 0 6px;">¿No funciona el botón? Copia este enlace:</p>
      <p style="text-align:center;margin:0;">
        <a href="${invitationUrl}" style="color:#f43f5e;font-size:11px;word-break:break-all;text-decoration:none;">${invitationUrl}</a>
      </p>

    </div>

    <!-- Footer -->
    <div style="background:#09090b;padding:18px 24px;text-align:center;border-top:1px solid #27272a;">
      <p style="color:#52525b;font-size:11px;margin:0 0 4px;">
        <strong style="color:#f43f5e;">CouplePlan</strong> • ${currentDate}
      </p>
      <p style="color:#3f3f46;font-size:10px;margin:0;">
        Si no esperabas esta invitación, ignórala.
      </p>
    </div>

  </div>

</body>
</html>`;

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
