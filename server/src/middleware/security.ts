import type { NextFunction, Request, Response } from 'express';
import { HttpError } from '../utils/http-error';

const parsePositiveInteger = (value: string | undefined, fallback: number) => {
  if (!value) {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    return fallback;
  }

  return parsed;
};

const AUTH_RATE_LIMIT_ENABLED = process.env.AUTH_RATE_LIMIT_ENABLED !== 'false';
const AUTH_RATE_LIMIT_WINDOW_MS = parsePositiveInteger(process.env.AUTH_RATE_LIMIT_WINDOW_MS, 60_000);
const AUTH_RATE_LIMIT_MAX_REQUESTS = parsePositiveInteger(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS, 5);

const SECURITY_HEADERS = {
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'no-referrer',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
} as const;

interface AuthRateLimitBucket {
  count: number;
  resetAt: number;
}

const authRateLimitBuckets = new Map<string, AuthRateLimitBucket>();

const getForwardedClient = (value: string | string[] | undefined) => {
  if (Array.isArray(value)) {
    return value[0]?.split(',')[0]?.trim() || null;
  }

  if (typeof value === 'string') {
    return value.split(',')[0]?.trim() || null;
  }

  return null;
};

const getClientKey = (request: Request) =>
  getForwardedClient(request.headers['x-forwarded-for']) ?? request.ip ?? 'unknown';

const cleanupExpiredBuckets = (now: number) => {
  for (const [key, bucket] of authRateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) {
      authRateLimitBuckets.delete(key);
    }
  }
};

export const securityHeaders = (_request: Request, response: Response, next: NextFunction) => {
  for (const [headerName, value] of Object.entries(SECURITY_HEADERS)) {
    response.setHeader(headerName, value);
  }

  next();
};

export const noStoreResponses = (_request: Request, response: Response, next: NextFunction) => {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('Pragma', 'no-cache');
  next();
};

export const authRateLimiter = (request: Request, response: Response, next: NextFunction) => {
  if (!AUTH_RATE_LIMIT_ENABLED) {
    next();
    return;
  }

  const now = Date.now();
  cleanupExpiredBuckets(now);

  const bucketKey = `${request.method}:${request.baseUrl}${request.path}:${getClientKey(request)}`;
  const currentBucket = authRateLimitBuckets.get(bucketKey);

  if (!currentBucket || currentBucket.resetAt <= now) {
    authRateLimitBuckets.set(bucketKey, {
      count: 1,
      resetAt: now + AUTH_RATE_LIMIT_WINDOW_MS,
    });
    next();
    return;
  }

  if (currentBucket.count >= AUTH_RATE_LIMIT_MAX_REQUESTS) {
    response.setHeader(
      'Retry-After',
      String(Math.max(1, Math.ceil((currentBucket.resetAt - now) / 1000))),
    );
    next(new HttpError(429, 'Too many authentication attempts. Try again later.'));
    return;
  }

  currentBucket.count += 1;
  authRateLimitBuckets.set(bucketKey, currentBucket);
  next();
};

export const resetAuthRateLimitState = () => {
  authRateLimitBuckets.clear();
};
