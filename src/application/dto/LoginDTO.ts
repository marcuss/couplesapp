/**
 * Login DTO (Data Transfer Object)
 */

export interface LoginDTO {
  email: string;
  password: string;
}

export interface LoginResult {
  user: {
    id: string;
    email: string;
    name: string;
    hasPartner: boolean;
  };
  session: {
    accessToken: string;
    refreshToken: string;
    expiresAt: number;
  };
}
