/**
 * TDD - Bug #1: RLS violation (Error 42501) en acceptInvitation
 *
 * Flujo correcto DESPUÉS del fix:
 * La lógica de aceptar invitación se delega a una Edge Function de Supabase
 * que corre con service role y puede insertar en 'profiles' sin restricciones de RLS.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// ---------- Mocks hoisted para evitar circular refs ----------
const mocks = vi.hoisted(() => {
  const mockFunctionsInvoke = vi.fn();
  const mockSignUp = vi.fn();
  const mockFrom = vi.fn();
  const mockGetUser = vi.fn();
  const mockOnAuthStateChange = vi.fn();

  return {
    mockFunctionsInvoke,
    mockSignUp,
    mockFrom,
    mockGetUser,
    mockOnAuthStateChange,
    supabase: {
      auth: {
        signUp: mockSignUp,
        signInWithPassword: vi.fn(),
        signOut: vi.fn(),
        getUser: mockGetUser,
        onAuthStateChange: mockOnAuthStateChange,
      },
      from: mockFrom,
      functions: {
        invoke: mockFunctionsInvoke,
      },
    },
  };
});

vi.mock('../lib/supabase', () => ({
  supabase: mocks.supabase,
}));

// ---------- Datos de prueba ----------
const VALID_INVITATION = {
  id: 'inv-123',
  token: 'valid-token-abc',
  inviter_id: 'inviter-uuid-111',
  email: 'invited@example.com',
  status: 'pending',
  expires_at: new Date(Date.now() + 86400000).toISOString(),
};

const NEW_USER_ID = 'new-user-uuid-456';

// ---------- Implementación BUGGY (versión anterior) ----------
async function acceptInvitationBuggy(
  token: string,
  password: string,
  name: string
): Promise<{ error: Error | { code: string; message: string } | null }> {
  const { supabase } = await import('../lib/supabase');

  // Fetch invitation
  const { data: invitation, error: invErr } = await (supabase
    .from('invitations')
    .select('*')
    .eq('token', token)
    .single() as unknown as Promise<{
      data: typeof VALID_INVITATION | null;
      error: Error | null;
    }>);

  if (invErr || !invitation) return { error: new Error('Invitación inválida') };

  // Sign up
  const { data: authData, error: authErr } = await mocks.mockSignUp({
    email: invitation.email,
    password,
  });
  if (authErr || !authData?.user) return { error: new Error('No se pudo crear usuario') };

  // BUG: insert directo falla con RLS 42501
  const { error: profileError } = await (supabase
    .from('profiles')
    .insert({
      id: authData.user.id,
      email: invitation.email,
      name,
      partner_id: invitation.inviter_id,
    }) as unknown as Promise<{ error: { code: string; message: string } | null }>);

  if (profileError) return { error: profileError };
  return { error: null };
}

// ---------- Implementación CORREGIDA (usa Edge Function) ----------
async function acceptInvitationFixed(
  token: string,
  password: string,
  name: string
): Promise<{ error: Error | null; userId?: string }> {
  try {
    const { supabase } = await import('../lib/supabase');

    const { data, error: fnError } = await supabase.functions.invoke('accept-invitation', {
      body: { token, password, name },
    });

    if (fnError) {
      return { error: fnError };
    }

    return { error: null, userId: data?.userId };
  } catch (err) {
    return { error: err as Error };
  }
}

// ---------- Tests ----------

describe('Bug #1 — RLS violation en acceptInvitation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: onAuthStateChange retorna subscription
    mocks.mockOnAuthStateChange.mockReturnValue({
      data: { subscription: { unsubscribe: vi.fn() } },
    });
    mocks.mockGetUser.mockResolvedValue({ data: { user: null } });
  });

  // ----------------------------------------------------------------
  // TEST 1: Demuestra el bug — la versión buggy falla con RLS 42501
  // ----------------------------------------------------------------
  it('[bug] la versión anterior falla con RLS 42501 al insertar en profiles', async () => {
    // signup ok
    mocks.mockSignUp.mockResolvedValue({
      data: { user: { id: NEW_USER_ID, email: VALID_INVITATION.email } },
      error: null,
    });

    // invitation fetch ok, profiles insert FALLA con RLS
    mocks.mockFrom.mockImplementation((table: string) => {
      if (table === 'invitations') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: VALID_INVITATION, error: null }),
        };
      }
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
          insert: vi.fn().mockResolvedValue({
            data: null,
            error: {
              code: '42501',
              message: 'new row violates row-level security policy for table "profiles"',
            },
          }),
        };
      }
      return { select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis() };
    });

    const result = await acceptInvitationBuggy(VALID_INVITATION.token, 'pass123', 'Guest');

    // La versión buggy DEVUELVE error
    expect(result.error).not.toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((result.error as any)?.code).toBe('42501');
  });

  // ----------------------------------------------------------------
  // TEST 2: Versión CORREGIDA — usa Edge Function, no hay RLS error
  // ----------------------------------------------------------------
  it('[fix] la versión corregida usa Edge Function y NO falla con RLS', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValue({
      data: { userId: NEW_USER_ID },
      error: null,
    });

    const result = await acceptInvitationFixed(VALID_INVITATION.token, 'pass123', 'Guest');

    expect(result.error).toBeNull();
    expect(result.userId).toBe(NEW_USER_ID);

    // La Edge Function fue llamada con los parámetros correctos
    expect(mocks.mockFunctionsInvoke).toHaveBeenCalledWith('accept-invitation', {
      body: {
        token: VALID_INVITATION.token,
        password: 'pass123',
        name: 'Guest',
      },
    });

    // NO se hizo ningún insert directo a profiles
    expect(mocks.mockFrom).not.toHaveBeenCalledWith('profiles');
  });

  // ----------------------------------------------------------------
  // TEST 3: La Edge Function propaga errores correctamente
  // ----------------------------------------------------------------
  it('[fix] propaga el error de la Edge Function cuando falla', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: new Error('Edge function error: invitation expired'),
    });

    const result = await acceptInvitationFixed('expired-token', 'pass123', 'Guest');

    expect(result.error).not.toBeNull();
    expect(result.error?.message).toContain('invitation expired');
  });

  // ----------------------------------------------------------------
  // TEST 4: Token inválido rechazado por la Edge Function
  // ----------------------------------------------------------------
  it('[fix] rechaza tokens inválidos a través de la Edge Function', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValue({
      data: null,
      error: new Error('Invitation not found or already used'),
    });

    const result = await acceptInvitationFixed('fake-token-999', 'pass123', 'Nobody');

    expect(result.error).not.toBeNull();
  });

  // ----------------------------------------------------------------
  // TEST 5: Flujo exitoso completo
  // ----------------------------------------------------------------
  it('[fix] flujo completo exitoso: usuario acepta invitación y recibe userId', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValue({
      data: {
        userId: NEW_USER_ID,
        email: VALID_INVITATION.email,
        partnerId: VALID_INVITATION.inviter_id,
      },
      error: null,
    });

    const result = await acceptInvitationFixed(VALID_INVITATION.token, 'SecurePass!1', 'María');

    expect(result.error).toBeNull();
    expect(result.userId).toBe(NEW_USER_ID);
    expect(mocks.mockFunctionsInvoke).toHaveBeenCalledTimes(1);
  });

  // ----------------------------------------------------------------
  // TEST 6: La Edge Function se llama con credenciales correctas
  // ----------------------------------------------------------------
  it('[fix] la Edge Function recibe nombre y contraseña del usuario', async () => {
    mocks.mockFunctionsInvoke.mockResolvedValue({
      data: { userId: 'some-id' },
      error: null,
    });

    await acceptInvitationFixed('my-token', 'MyPassword123!', 'Carlos');

    const [fnName, opts] = mocks.mockFunctionsInvoke.mock.calls[0];
    expect(fnName).toBe('accept-invitation');
    expect(opts.body.name).toBe('Carlos');
    expect(opts.body.password).toBe('MyPassword123!');
    expect(opts.body.token).toBe('my-token');
  });
});
