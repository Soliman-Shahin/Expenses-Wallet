export interface User {
  _id?: string;
  socialId?: string;
  signupType?: 'normal' | 'facebook' | 'google';
  email?: string;
  username?: string;
  image?: string;
  emailVerified?: boolean;
  sessions?: [token: string, expiresAt: number];
  roles?: string[];
  permissions?: string[];
  createdAt?: string;
  updatedAt?: string;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}
