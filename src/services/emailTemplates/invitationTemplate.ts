/**
 * Invitation Email Template — CouplePlan
 *
 * Diseñado para light mode (default en clientes de email móvil).
 * Paleta alineada con el look & feel de la app en light mode:
 *   - Fondo: rose-50 muy sutil (#fdf2f8) — mismo que el login
 *   - Card: blanco con sombra y border-radius generoso
 *   - Franja top: gradiente rose-500 → pink-500 (4px sutil)
 *   - Acento: rose-500 (#f43f5e) SOLO como franja/botón, no como fondo masivo
 *   - Texto: gray-900 / gray-600 — legible y elegante
 */

export interface InvitationTemplateParams {
  inviterName: string;
  invitationUrl: string;
}

export function buildInvitationHtml(params: InvitationTemplateParams): string {
  const { inviterName, invitationUrl } = params;

  const currentDate = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a CouplePlan</title>
</head>
<body style="margin:0;padding:0;background-color:#fdf2f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background-color:#fdf2f8;">
    <tr>
      <td align="center" style="padding:40px 16px 32px;">

        <!-- Logo / Brand -->
        <table cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px;">
          <tr>
            <td align="center">
              <div style="width:48px;height:48px;background:#fff0f3;border-radius:14px;display:inline-block;line-height:48px;font-size:26px;text-align:center;margin-bottom:10px;">💕</div>
              <br>
              <span style="font-size:20px;font-weight:800;color:#111827;letter-spacing:-0.5px;">CouplePlan</span>
            </td>
          </tr>
        </table>

        <!-- Card principal -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:460px;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);border:1px solid #fce7f3;">

          <!-- Franja de color top — sutil, no agresiva -->
          <tr>
            <td style="height:4px;background:linear-gradient(90deg,#f43f5e,#ec4899);font-size:0;line-height:0;">&nbsp;</td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px 32px 28px;">

              <!-- Saludo -->
              <h2 style="color:#111827;font-size:20px;font-weight:700;margin:0 0 12px;line-height:1.3;">
                ¡Tienes una invitación!
              </h2>
              <p style="color:#4b5563;font-size:15px;line-height:1.7;margin:0 0 28px;">
                <span style="color:#f43f5e;font-weight:600;">${inviterName}</span>
                te invitó a unirte a <strong style="color:#111827;">CouplePlan</strong>
                para planificar juntos metas, eventos, presupuestos y viajes.
              </p>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#fdf2f8;border-radius:12px;border:1px solid #fce7f3;margin-bottom:28px;">
                <tr>
                  <td style="padding:18px 20px 14px;">
                    <p style="color:#9f1239;font-size:10px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1.2px;">Con CouplePlan pueden:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:8px;color:#374151;font-size:13px;">📅 Calendarios compartidos</td>
                        <td width="50%" style="padding-bottom:8px;color:#374151;font-size:13px;">🎯 Metas anuales</td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom:8px;color:#374151;font-size:13px;">💰 Presupuestos</td>
                        <td width="50%" style="padding-bottom:8px;color:#374151;font-size:13px;">✈️ Viajes juntos</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="color:#374151;font-size:13px;">✅ División de tareas</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding-bottom:20px;">
                    <a href="${invitationUrl}"
                       style="display:inline-block;background:#f43f5e;color:#ffffff;text-decoration:none;padding:15px 36px;border-radius:10px;font-size:15px;font-weight:700;letter-spacing:0.2px;">
                      Aceptar invitación →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0 0 4px;">¿No funciona el botón? Copia este enlace:</p>
              <p style="text-align:center;margin:0;">
                <a href="${invitationUrl}" style="color:#f43f5e;font-size:11px;word-break:break-all;text-decoration:none;">${invitationUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer de la card -->
          <tr>
            <td style="padding:16px 32px;background:#fafafa;border-top:1px solid #f3f4f6;">
              <p style="color:#9ca3af;font-size:11px;text-align:center;margin:0;">
                <strong style="color:#f43f5e;">CouplePlan</strong> &bull; ${currentDate}
                &bull; Si no esperabas esta invitación, ignórala.
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

export function buildInvitationText(params: InvitationTemplateParams): string {
  const { inviterName, invitationUrl } = params;
  return `¡Hola!

${inviterName} te ha invitado a unirte a CouplePlan para planificar juntos su año.

Con CouplePlan pueden:
- 📅 Calendarios compartidos
- 🎯 Metas anuales
- 💰 Presupuestos compartidos
- ✈️ Planificación de viajes
- ✅ División de tareas

Acepta la invitación aquí:
${invitationUrl}

Si no esperabas esta invitación, ignora este correo.

— CouplePlan`;
}
