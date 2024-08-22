export interface User {
  userId?: string;
  socialId?: string;
  signupType?: 'normal' | 'facebook' | 'google';
  email?: string;
  username?: string;
  image?: string;
  emailVerified?: boolean;
  sessions?: [token: string, expiresAt: number];
}
