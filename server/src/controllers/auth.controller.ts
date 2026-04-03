import type { Request, Response } from 'express';
import { authService } from '../services/auth.service';
import { asyncHandler } from '../utils/async-handler';
import {
  clearRefreshTokenCookie,
  getRefreshTokenFromRequest,
  setRefreshTokenCookie,
} from '../utils/refresh-cookie';

const toClientSession = (session: Awaited<ReturnType<typeof authService.login>>) => ({
  accessToken: session.accessToken,
  user: session.user,
});

export const register = asyncHandler(async (request: Request, response: Response) => {
  const session = await authService.register(request.body);
  setRefreshTokenCookie(response, session.refreshToken);
  response.status(201).json(toClientSession(session));
});

export const login = asyncHandler(async (request: Request, response: Response) => {
  const session = await authService.login(request.body);
  setRefreshTokenCookie(response, session.refreshToken);
  response.json(toClientSession(session));
});

export const refresh = asyncHandler(async (request: Request, response: Response) => {
  const session = await authService.refresh(getRefreshTokenFromRequest(request) ?? '');
  setRefreshTokenCookie(response, session.refreshToken);
  response.json(toClientSession(session));
});

export const logout = asyncHandler(async (request: Request, response: Response) => {
  await authService.logout(getRefreshTokenFromRequest(request) ?? '');
  clearRefreshTokenCookie(response);
  response.status(204).send();
});

export const me = asyncHandler(async (request: Request, response: Response) => {
  response.json(await authService.me(request.user!));
});
