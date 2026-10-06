/**
 * FILE PURPOSE:
 * Authentication business logic, credential hashing, and JWT token lifecycle service.
 *
 * MAIN RESPONSIBILITY:
 * Handles bcrypt password hashing/verification, user registration, login credential checks,
 * JWT access/refresh token signing, token revocation via tokenVersion bumps, and profile updates.
 *
 * CONNECTED SYSTEMS:
 * - apps/api/src/modules/auth/auth.controller.ts (calls AuthService methods)
 * - apps/api/src/modules/users/user.repository.ts (reads and writes User documents in MongoDB)
 * - apps/api/src/lib/tokens.ts (signs and verifies JWT tokens)
 */

import bcrypt from 'bcryptjs';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  Role,
  UpdateProfileInput,
} from '@roohae/shared';
import { ApiError } from '../../lib/errors';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../lib/tokens';
import { userRepository } from '../users/user.repository';
import type { UserDocument } from '../users/user.model';
import { activityService } from '../activity/activity.service';


const BCRYPT_ROUNDS = 12;

function issueTokens(user: UserDocument) {
  return {
    accessToken: signAccessToken(user.id, user.email, user.role, user.permissions),
    refreshToken: signRefreshToken(user.id, user.role, user.tokenVersion ?? 0),
  };
}

export class AuthService {
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw ApiError.conflict('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      role: 'user',
    });

    await activityService.log(user.id, 'user', 'auth.register', 'user', user.id);
    const tokens = issueTokens(user);
    return { user: user.toJSON(), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async login(input: LoginInput) {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw ApiError.unauthorized('Invalid email or password');
    }
    if (!user.isActive) throw ApiError.forbidden('This account has been deactivated');

    user.lastLoginAt = new Date();
    await user.save();

    await activityService.log(user.id, user.role, 'auth.login', 'user', user.id);
    const tokens = issueTokens(user);
    return { user: user.toJSON(), accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    const user = await userRepository.findByIdWithSecrets(payload.sub);
    if (!user || !user.isActive) throw ApiError.unauthorized('Account unavailable');
    if ((user.tokenVersion ?? 0) !== payload.tv) {
      throw ApiError.unauthorized('Session has been revoked');
    }
    const tokens = issueTokens(user);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }

  async me(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User');
    return user.toJSON();
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    const user = await userRepository.findById(userId);
    if (!user) throw ApiError.notFound('User');
    if (input.name !== undefined) user.name = input.name;
    if (input.avatarUrl !== undefined) user.avatarUrl = input.avatarUrl || undefined;
    await user.save();
    return user.toJSON();
  }

  async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await userRepository.findByIdWithSecrets(userId);
    if (!user) throw ApiError.notFound('User');
    if (!(await bcrypt.compare(input.currentPassword, user.passwordHash))) {
      throw ApiError.badRequest('Current password is incorrect');
    }
    user.passwordHash = await bcrypt.hash(input.newPassword, BCRYPT_ROUNDS);
    user.tokenVersion = (user.tokenVersion ?? 0) + 1; // revoke existing sessions
    await user.save();
    const tokens = issueTokens(user);
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken };
  }
}

export const authService = new AuthService();
