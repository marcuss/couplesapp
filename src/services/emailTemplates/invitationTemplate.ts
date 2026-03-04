/**
 * Invitation Email Template — CouplePlan
 *
 * Diseño alineado con el look & feel de la app:
 * - Dark mode: gray-900 (#111827), gray-800 (#1f2937), gray-700 (#374151)
 * - Acento: rose-500 (#f43f5e) → pink-500 (#ec4899) gradiente
 * - Cards: gray-800 con border-radius 16px y sombra
 * - Tipografía: system-ui / -apple-system
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
<body style="margin:0;padding:0;background-color:#111827;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <!-- Wrapper -->
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
    <tr>
      <td align="center" style="padding:32px 16px;">

        <!-- Card principal -->
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;background:#1f2937;border-radius:20px;overflow:hidden;box-shadow:0 25px 50px rgba(0,0,0,0.5);">

          <!-- Header con gradiente rose → pink -->
          <tr>
            <td style="background:linear-gradient(135deg,#f43f5e 0%,#ec4899 100%);padding:40px 32px 36px;text-align:center;">
              <!-- Ícono -->
              <div style="width:72px;height:72px;background:rgba(255,255,255,0.2);border-radius:20px;margin:0 auto 20px;display:block;line-height:72px;font-size:38px;text-align:center;">
                💕
              </div>
              <!-- Logo -->
              <h1 style="color:#ffffff;font-size:28px;font-weight:800;margin:0 0 6px;letter-spacing:-0.5px;">CouplePlan</h1>
              <p style="color:rgba(255,255,255,0.85);font-size:14px;margin:0;font-weight:400;">Planifica tu futuro juntos</p>
            </td>
          </tr>

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px 32px 24px;">

              <!-- Saludo -->
              <p style="color:#f9fafb;font-size:18px;font-weight:700;margin:0 0 8px;">¡Tienes una invitación! 🎉</p>
              <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 28px;">
                <span style="color:#f43f5e;font-weight:600;">${inviterName}</span>
                te ha invitado a unirte a <strong style="color:#f9fafb;">CouplePlan</strong>
                para planificar juntos metas, eventos, presupuestos y viajes.
              </p>

              <!-- Features card -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
                     style="background:#111827;border-radius:14px;border:1px solid #374151;margin-bottom:28px;">
                <tr>
                  <td style="padding:20px 24px 16px;">
                    <p style="color:#f43f5e;font-size:11px;font-weight:700;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">
                      Con CouplePlan pueden:
                    </p>
                    <!-- Feature rows -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:10px;color:#d1d5db;font-size:14px;">📅 Calendarios compartidos</td>
                        <td width="50%" style="padding-bottom:10px;color:#d1d5db;font-size:14px;">🎯 Metas anuales</td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom:10px;color:#d1d5db;font-size:14px;">💰 Presupuestos</td>
                        <td width="50%" style="padding-bottom:10px;color:#d1d5db;font-size:14px;">✈️ Viajes juntos</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="color:#d1d5db;font-size:14px;">✅ División de tareas</td>
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
                       style="display:inline-block;background:linear-gradient(135deg,#f43f5e 0%,#ec4899 100%);color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:12px;font-size:16px;font-weight:700;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(244,63,94,0.4);">
                      Aceptar Invitación 💕
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <p style="color:#6b7280;font-size:12px;text-align:center;margin:0 0 6px;">¿No funciona el botón? Copia este enlace:</p>
              <p style="text-align:center;margin:0;">
                <a href="${invitationUrl}"
                   style="color:#f43f5e;font-size:12px;word-break:break-all;text-decoration:none;">
                  ${invitationUrl}
                </a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#0d1117;padding:20px 32px;border-top:1px solid #374151;">
              <p style="color:#4b5563;font-size:12px;text-align:center;margin:0 0 4px;">
                <strong style="color:#f43f5e;">CouplePlan</strong> &bull; ${currentDate}
              </p>
              <p style="color:#374151;font-size:11px;text-align:center;margin:0;">
                Si no esperabas esta invitación, puedes ignorar este correo.
              </p>
            </td>
          </tr>

        </table>
        <!-- /Card principal -->

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
