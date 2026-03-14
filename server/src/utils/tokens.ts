import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import type { UserRole } from '../constants/roles';

interface BaseUserTokenPayload {
  sub: string;
  email: string;
  role: UserRole;
}

export type AccessTokenPayload = JwtPayload &
  BaseUserTokenPayload & {
    sub: string;
  };

export type RefreshTokenPayload = JwtPayload &
  BaseUserTokenPayload & {
    sub: string;
    tokenId: string;
    type: 'refresh';
  };

export const signAccessToken = (payload: BaseUserTokenPayload) =>
  jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as SignOptions['expiresIn'],
  } satisfies SignOptions);

export const signRefreshToken = (payload: BaseUserTokenPayload & { tokenId: string }) =>
  jwt.sign(
    {
      ...payload,
      type: 'refresh',
    },
    env.JWT_REFRESH_SECRET,
    {
      expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as SignOptions['expiresIn'],
    },
  );

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.JWT_REFRESH_SECRET) as RefreshTokenPayload;
