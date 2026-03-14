import type { NextFunction, Request, Response } from 'express';
import { AppDataSource } from '../config/data-source';
import { User } from '../models/user.entity';
import { serializeUser } from '../utils/serializers';
import { verifyAccessToken } from '../utils/tokens';

const getTokenFromRequest = (request: Request) => {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith('Bearer ')) {
    return null;
  }

  return authorization.slice('Bearer '.length);
};

const resolveUser = async (request: Request) => {
  const token = getTokenFromRequest(request);

  if (!token) {
    return null;
  }

  const payload = verifyAccessToken(token);
  const userRepository = AppDataSource.getRepository(User);
  const user = await userRepository.findOneBy({ id: Number(payload.sub) });

  return user ? serializeUser(user) : null;
};

export const attachUserIfPresent = async (
  request: Request,
  _response: Response,
  next: NextFunction,
) => {
  try {
    request.user = (await resolveUser(request)) ?? undefined;
    next();
  } catch {
    request.user = undefined;
    next();
  }
};

export const authenticate = async (request: Request, response: Response, next: NextFunction) => {
  try {
    const user = await resolveUser(request);

    if (!user) {
      response.status(401).json({ message: 'Authentication required.' });
      return;
    }

    request.user = user;
    next();
  } catch {
    response.status(401).json({ message: 'Invalid or expired access token.' });
  }
};

export const requireAdmin = (request: Request, response: Response, next: NextFunction) => {
  if (!request.user || request.user.role !== 'admin') {
    response.status(403).json({ message: 'Admin access required.' });
    return;
  }

  next();
};
