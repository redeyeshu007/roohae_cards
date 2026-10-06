/**
 * FILE PURPOSE:
 * Zod validation schemas for authentication and user account operations.
 *
 * MAIN RESPONSIBILITY:
 * Enforces validation rules for login, user registration, token refreshing,
 * password updates, and user profile edits.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/auth/ (validates incoming HTTP request bodies)
 * - apps/admin & apps/user (validates frontend forms in login and registration pages)
 */

import { z } from 'zod';

// VALIDATION SCHEMA: LOGIN
// Validates credentials on POST /api/auth/login.
export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// VALIDATION SCHEMA: REGISTER
// Validates user input on POST /api/auth/register.
export const registerSchema = z.object({
  name: z.string().min(2, 'Name is too short').max(80),
  email: z.string().email('Enter a valid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128)
    .regex(/[a-z]/, 'Include a lowercase letter')
    .regex(/[A-Z]/, 'Include an uppercase letter')
    .regex(/[0-9]/, 'Include a number'),
});

// VALIDATION SCHEMA: REFRESH TOKEN
// Validates token payload on POST /api/auth/refresh.
export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// VALIDATION SCHEMA: CHANGE PASSWORD
// Validates password change requests on POST /api/auth/change-password.
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: registerSchema.shape.password,
});

// VALIDATION SCHEMA: UPDATE PROFILE
// Validates profile modifications on PATCH /api/users/profile.
export const updateProfileSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
