import type { Request, Response } from 'express';
import { env } from '../config/env';

export const REFRESH_TOKEN_COOKIE_NAME = 'inkwell_refresh_token';

const REFRESH_COOKIE_PATH = '/api/auth';

const parseCookieHeader = (cookieHeader: string) =>
  cookieHeader
    .split(';')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .reduce<Record<string, string>>((cookies, entry) => {
      const separatorIndex = entry.indexOf('=');

      if (separatorIndex === -1) {
        return cookies;
      }

      const key = entry.slice(0, separatorIndex).trim();
      const value = entry.slice(separatorIndex + 1).trim();

      if (!key) {
        return cookies;
      }

      cookies[key] = decodeURIComponent(value);
      return cookies;
    }, {});

const buildRefreshCookieOptions = () => ({
  httpOnly: true,
  maxAge: 1000 * 60 * 60 * 24 * env.REFRESH_TOKEN_TTL_DAYS,
  path: REFRESH_COOKIE_PATH,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
});

const buildRefreshCookieClearOptions = () => ({
  httpOnly: true,
  path: REFRESH_COOKIE_PATH,
  sameSite: 'lax' as const,
  secure: env.NODE_ENV === 'production',
});

export const getRefreshTokenFromRequest = (request: Request) => {
  const cookieHeader = request.headers.cookie;

  if (!cookieHeader) {
    return null;
  }

  return parseCookieHeader(cookieHeader)[REFRESH_TOKEN_COOKIE_NAME] ?? null;
};

export const setRefreshTokenCookie = (response: Response, refreshToken: string) => {
  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, buildRefreshCookieOptions());
};

export const clearRefreshTokenCookie = (response: Response) => {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, buildRefreshCookieClearOptions());
};
