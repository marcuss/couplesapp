/**
 * Invitation Email Template — CouplePlan
 *
 * Paleta extraída del screenshot real de la app (dark navy mode):
 *   - Body bg:    #131929  (dark navy profundo)
 *   - Card bg:    #1e2640  (navy ligeramente más claro)
 *   - Input/sec:  #252f4a  (elementos internos)
 *   - Brand:      #f43f5e  (rose-500 — ícono corazón + texto brand)
 *   - Button:     #f43f5e  (sólido, sin gradiente exagerado)
 *   - Text:       #ffffff  (encabezados)
 *   - Muted:      #8b95b0  (texto secundario)
 *   - Border:     #2d3a55  (bordes sutiles)
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
  <!--[if mso]>
  <noscript>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
  </noscript>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#131929;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#131929;min-width:100%;">
    <tr>
      <td align="center" style="padding:40px 16px 40px;background-color:#131929;">

        <!-- Brand header -->
        <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px;">
          <tr>
            <td align="center">
              <!-- Corazón SVG inline — igual al ícono de la app -->
              <div style="margin-bottom:12px;">
                <img src="https://img.icons8.com/ios/50/f43f5e/heart-outline--v1.png" width="40" height="40" alt="💕" style="display:block;margin:0 auto;">
              </div>
              <span style="font-size:22px;font-weight:800;color:#f43f5e;letter-spacing:-0.3px;">CouplePlan</span>
            </td>
          </tr>
        </table>

        <!-- Card principal -->
        <table width="100%" cellpadding="0" cellspacing="0" border="0"
               style="max-width:420px;background-color:#1e2640;border-radius:18px;overflow:hidden;border:1px solid #2d3a55;">

          <!-- Cuerpo -->
          <tr>
            <td style="padding:32px 28px 28px;background-color:#1e2640;">

              <!-- Título -->
              <h2 style="color:#ffffff;font-size:22px;font-weight:700;margin:0 0 10px;line-height:1.3;text-align:center;">
                Welcome Back
              </h2>
              <p style="color:#8b95b0;font-size:14px;line-height:1.6;margin:0 0 28px;text-align:center;">
                <span style="color:#f43f5e;font-weight:600;">${inviterName}</span>
                te invitó a planificar juntos
              </p>

              <!-- Divisor -->
              <div style="height:1px;background-color:#2d3a55;margin-bottom:24px;"></div>

              <!-- Features -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0"
                     style="background-color:#252f4a;border-radius:12px;margin-bottom:24px;border:1px solid #2d3a55;">
                <tr>
                  <td style="padding:16px 20px 12px;">
                    <p style="color:#f43f5e;font-size:10px;font-weight:700;margin:0 0 12px;text-transform:uppercase;letter-spacing:1.2px;">Con CouplePlan pueden:</p>
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td width="50%" style="padding-bottom:8px;color:#c5cce0;font-size:13px;">📅 Calendarios</td>
                        <td width="50%" style="padding-bottom:8px;color:#c5cce0;font-size:13px;">🎯 Metas juntos</td>
                      </tr>
                      <tr>
                        <td width="50%" style="padding-bottom:8px;color:#c5cce0;font-size:13px;">💰 Presupuestos</td>
                        <td width="50%" style="padding-bottom:8px;color:#c5cce0;font-size:13px;">✈️ Viajes</td>
                      </tr>
                      <tr>
                        <td colspan="2" style="color:#c5cce0;font-size:13px;">✅ Tareas compartidas</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button — igual al botón Login de la app -->
              <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:18px;">
                <tr>
                  <td align="center">
                    <a href="${invitationUrl}"
                       style="display:block;background-color:#f43f5e;color:#ffffff;text-decoration:none;padding:16px 24px;border-radius:10px;font-size:16px;font-weight:700;text-align:center;letter-spacing:0.2px;">
                      Aceptar invitación
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Link alternativo -->
              <p style="color:#5a6480;font-size:11px;text-align:center;margin:0 0 4px;">¿No funciona el botón?</p>
              <p style="text-align:center;margin:0;">
                <a href="${invitationUrl}" style="color:#f43f5e;font-size:11px;word-break:break-all;text-decoration:none;">${invitationUrl}</a>
              </p>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:14px 28px;background-color:#161e35;border-top:1px solid #2d3a55;">
              <p style="color:#3d4d6e;font-size:11px;text-align:center;margin:0;">
                CouplePlan &bull; ${currentDate} &bull; Ignora este correo si no lo esperabas
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
