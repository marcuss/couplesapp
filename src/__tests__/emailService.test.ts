/**
 * TDD - EmailJS integration tests
 *
 * Verifica que sendInvitationEmail llama a emailjs.send con los parámetros correctos
 * y que maneja errores de forma apropiada.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- Mock de @emailjs/browser con vi.hoisted ----------
const emailMocks = vi.hoisted(() => {
  const send = vi.fn();
  const init = vi.fn();
  return { send, init };
});

vi.mock('@emailjs/browser', () => ({
  default: {
    send: emailMocks.send,
    init: emailMocks.init,
  },
}));

// Mock env vars
vi.stubEnv('VITE_EMAILJS_SERVICE_ID', 'service_tm0ftnk');
vi.stubEnv('VITE_EMAILJS_PUBLIC_KEY', 'REDACTED_EMAILJS_KEY');
vi.stubEnv('VITE_EMAILJS_TEMPLATE_ID', 'template_owgl4oh');

import { sendInvitationEmail, initEmailJS } from '../services/emailService';

describe('EmailJS — sendInvitationEmail', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ----------------------------------------------------------------
  // TEST 1: Envío exitoso — se llama con los parámetros correctos
  // ----------------------------------------------------------------
  it('llama a emailjs.send con service ID, template ID y parámetros correctos', async () => {
    emailMocks.send.mockResolvedValue({ status: 200, text: 'OK' });

    const result = await sendInvitationEmail({
      toEmail: 'partner@example.com',
      inviterName: 'Marcus',
      invitationUrl: 'https://app.example.com/invitation/token-abc123',
    });

    expect(result.success).toBe(true);
    expect(result.error).toBeUndefined();

    // Verificar que emailjs.send fue llamado
    expect(emailMocks.send).toHaveBeenCalledTimes(1);
    const [serviceId, templateId, templateParams, publicKey] = emailMocks.send.mock.calls[0];

    expect(serviceId).toBe('service_tm0ftnk');
    expect(templateId).toBe('template_owgl4oh');
    expect(publicKey).toBe('REDACTED_EMAILJS_KEY');

    // Verificar parámetros del template
    expect(templateParams).toMatchObject({
      to_email: 'partner@example.com',
      inviter_name: 'Marcus',
      invitation_url: 'https://app.example.com/invitation/token-abc123',
    });
  });

  // ----------------------------------------------------------------
  // TEST 2: Manejo de error — emailjs falla
  // ----------------------------------------------------------------
  it('devuelve success=false cuando emailjs.send lanza error', async () => {
    const emailError = new Error('EmailJS: Service unavailable');
    emailMocks.send.mockRejectedValue(emailError);

    const result = await sendInvitationEmail({
      toEmail: 'fail@example.com',
      inviterName: 'Test',
      invitationUrl: 'https://app.example.com/invitation/bad-token',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
    expect(result.error?.message).toContain('EmailJS');
  });

  // ----------------------------------------------------------------
  // TEST 3: initEmailJS llama a emailjs.init con la public key
  // ----------------------------------------------------------------
  it('initEmailJS inicializa emailjs con la public key correcta', () => {
    initEmailJS();
    expect(emailMocks.init).toHaveBeenCalledWith('REDACTED_EMAILJS_KEY');
  });

  // ----------------------------------------------------------------
  // TEST 4: URL de invitación se transmite correctamente
  // ----------------------------------------------------------------
  it('transmite la URL de invitación sin modificar', async () => {
    emailMocks.send.mockResolvedValue({ status: 200, text: 'OK' });

    const invitationUrl = 'https://couples-app.vercel.app/invitation/abc-def-123-xyz';

    await sendInvitationEmail({
      toEmail: 'user@test.com',
      inviterName: 'Ana',
      invitationUrl,
    });

    const [, , templateParams] = emailMocks.send.mock.calls[0];
    expect(templateParams.invitation_url).toBe(invitationUrl);
  });

  // ----------------------------------------------------------------
  // TEST 5: Nombre del invitador se incluye correctamente
  // ----------------------------------------------------------------
  it('usa el nombre del invitador como inviter_name en el template', async () => {
    emailMocks.send.mockResolvedValue({ status: 200, text: 'OK' });

    await sendInvitationEmail({
      toEmail: 'someone@test.com',
      inviterName: 'Carlos García',
      invitationUrl: 'https://app.example.com/invitation/token',
    });

    const [, , templateParams] = emailMocks.send.mock.calls[0];
    expect(templateParams.inviter_name).toBe('Carlos García');
  });

  // ----------------------------------------------------------------
  // TEST 6: Solo se llama send una vez por invitación
  // ----------------------------------------------------------------
  it('emailjs.send se llama exactamente una vez por invitación', async () => {
    emailMocks.send.mockResolvedValue({ status: 200, text: 'OK' });

    await sendInvitationEmail({
      toEmail: 'once@test.com',
      inviterName: 'Test',
      invitationUrl: 'https://app/inv/token',
    });

    expect(emailMocks.send).toHaveBeenCalledTimes(1);
  });
});
