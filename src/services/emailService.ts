/**
 * EmailJS Service
 * Envío de invitaciones a la pareja vía EmailJS
 *
 * Credenciales (configuradas via variables de entorno):
 * - Service ID: service_tm0ftnk
 * - Public Key: REDACTED_EMAILJS_KEY
 * - Template ID: template_owgl4oh
 *
 * El template recibe:
 *   - to_email: email del invitado
 *   - inviter_name: nombre de quien invita
 *   - invitation_url: URL completa con el token
 */
import emailjs from '@emailjs/browser';

export interface InvitationEmailParams {
  toEmail: string;
  inviterName: string;
  invitationUrl: string;
}

export interface EmailResult {
  success: boolean;
  error?: Error;
}

// Configuración de EmailJS
const EMAIL_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || 'service_tm0ftnk';
const EMAIL_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || 'REDACTED_EMAILJS_KEY';
const EMAIL_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || 'template_owgl4oh';

/**
 * Inicializa EmailJS con la public key.
 * Se llama una vez al cargar la app.
 */
export function initEmailJS(): void {
  emailjs.init(EMAIL_PUBLIC_KEY);
}

/**
 * Envía un email de invitación a la pareja.
 *
 * @param params - Parámetros del email (destinatario, invitador, URL)
 * @returns { success: boolean, error?: Error }
 */
export async function sendInvitationEmail(params: InvitationEmailParams): Promise<EmailResult> {
  try {
    await emailjs.send(
      EMAIL_SERVICE_ID,
      EMAIL_TEMPLATE_ID,
      {
        to_email: params.toEmail,
        inviter_name: params.inviterName,
        invitation_url: params.invitationUrl,
      },
      EMAIL_PUBLIC_KEY
    );

    return { success: true };
  } catch (error) {
    console.error('EmailJS error:', error);
    return { success: false, error: error as Error };
  }
}
