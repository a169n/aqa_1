import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';

export const register = asyncHandler(async (request: Request, response: Response) => {
  const session = await authService.register(request.body);
  response.status(201).json(session);
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const session = await authService.login(request.body);
  response.json(session);
});

export const refresh = asyncHandler(async (request: Request, response: Response) => {
  const session = await authService.refresh(request.body.refreshToken);
  response.json(session);
});

export const logout = asyncHandler(async (request: Request, response: Response) => {
  await authService.logout(request.body.refreshToken);
  response.status(204).send();
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  response.json(await authService.me(request.user!));
});

