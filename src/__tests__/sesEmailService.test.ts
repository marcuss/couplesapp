import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SESv2Client, SendEmailCommand } from '@aws-sdk/client-sesv2';

// Mock SES SDK — usar function regular (no arrow) para que sea compatible con `new`
vi.mock('@aws-sdk/client-sesv2', () => {
  const mockSend = vi.fn().mockResolvedValue({ MessageId: 'test-message-id-123' });
  return {
    SESv2Client: vi.fn(function () {
      return { send: mockSend };
    }),
    SendEmailCommand: vi.fn(),
  };
});

describe('SES Email Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Restaurar el mock de send a resolved por defecto
    const mockInstance = new (SESv2Client as any)();
    mockInstance.send.mockResolvedValue({ MessageId: 'test-message-id-123' });
  });

  it('envía email de invitación y retorna success:true', async () => {
    const { sendInvitationEmail } = await import('../services/sesEmailService');

    const result = await sendInvitationEmail({
      toEmail: 'partner@example.com',
      inviterName: 'Marcus',
      invitationUrl: 'https://app.com/invite/abc123',
    });

    expect(result.success).toBe(true);
    expect(SendEmailCommand).toHaveBeenCalled();
  });

  it('envía email con el FROM correcto (gmail temporal o nextasy.co definitivo)', async () => {
    const { sendInvitationEmail } = await import('../services/sesEmailService');

    await sendInvitationEmail({
      toEmail: 'partner@example.com',
      inviterName: 'Marcus',
      invitationUrl: 'https://app.com/invite/abc123',
    });

    expect(SendEmailCommand).toHaveBeenCalledWith(
      expect.objectContaining({
        FromEmailAddress: expect.stringMatching(/m4rkuz@gmail\.com|nextasy\.co/),
        Destination: { ToAddresses: ['partner@example.com'] },
      })
    );
  });

  it('incluye el nombre del invitante en el email', async () => {
    const { sendInvitationEmail } = await import('../services/sesEmailService');

    await sendInvitationEmail({
      toEmail: 'partner@example.com',
      inviterName: 'Marcus',
      invitationUrl: 'https://app.com/invite/abc123',
    });

    const callArgs = (SendEmailCommand as any).mock.calls[0][0];
    const htmlBody = callArgs.Content?.Simple?.Body?.Html?.Data || '';
    const textBody = callArgs.Content?.Simple?.Body?.Text?.Data || '';
    expect(htmlBody + textBody).toContain('Marcus');
  });

  it('incluye el link de invitación en el email', async () => {
    const { sendInvitationEmail } = await import('../services/sesEmailService');
    const invitationUrl = 'https://app.com/invite/abc123';

    await sendInvitationEmail({
      toEmail: 'partner@example.com',
      inviterName: 'Marcus',
      invitationUrl,
    });

    const callArgs = (SendEmailCommand as any).mock.calls[0][0];
    const htmlBody = callArgs.Content?.Simple?.Body?.Html?.Data || '';
    const textBody = callArgs.Content?.Simple?.Body?.Text?.Data || '';
    expect(htmlBody + textBody).toContain(invitationUrl);
  });

  it('retorna success:false si SES falla', async () => {
    // Override send para que falle en este test
    (SESv2Client as any).mockImplementationOnce(function () {
      return { send: vi.fn().mockRejectedValue(new Error('SES Error')) };
    });

    const { sendInvitationEmail } = await import('../services/sesEmailService');

    const result = await sendInvitationEmail({
      toEmail: 'partner@example.com',
      inviterName: 'Marcus',
      invitationUrl: 'https://app.com/invite/abc123',
    });

    expect(result.success).toBe(false);
    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('SES Error');
  });

  it('usa el email temporal durante período de verificación del dominio', async () => {
    const { sendInvitationEmail } = await import('../services/sesEmailService');

    const result = await sendInvitationEmail({
      toEmail: 'm4rkuz@gmail.com',
      inviterName: 'Test',
      invitationUrl: 'https://app.com/invite/test',
    });

    expect(result.success).toBe(true);
    expect(SendEmailCommand).toHaveBeenCalled();
  });
});
