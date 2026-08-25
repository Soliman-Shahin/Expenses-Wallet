/**
 * User Model
 *
 * User entity with role, plan, and permissions
 */

import { UserRole } from './role.model';
import { PlanSlug, Permission } from '../../shared/models/plan.model';

export interface User {
  _id: string;
  email: string;
  username?: string;
  fullName?: string;
  image?: string;
  role: UserRole;
  plan: PlanSlug;
  planExpiresAt?: Date | null;
  planStartedAt?: Date | null;
  customPermissions: Permission[];
  permissions?: Permission[]; // Computed permissions from backend
  emailVerified: boolean;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthResponse {
  success: boolean;
  data: {
    user: User;
    token: string;
    refreshToken?: string;
  };
  message?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  fullName?: string;
  username?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  username?: string;
  image?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}
