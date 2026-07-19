import type { Request, Response } from 'express';
import { asyncHandler, created, ok } from '../../lib/http';
import { authService } from './auth.service';

export const register = asyncHandler(async (req: Request, res: Response) => {
  created(res, await authService.register(req.body));
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await authService.login(req.body));
});


export const refresh = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await authService.refresh(req.body.refreshToken));
});

export const me = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await authService.me(req.auth!.userId));
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await authService.updateProfile(req.auth!.userId, req.body));
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
  ok(res, await authService.changePassword(req.auth!.userId, req.body));
});
