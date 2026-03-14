import { randomUUID } from 'node:crypto';
import { AppDataSource } from '../config/data-source';
import { env } from '../config/env';
import { USER_ROLES } from '../constants/roles';
import { RefreshToken } from '../models/refresh-token.entity';
import { User } from '../models/user.entity';
import type { AuthenticatedUser } from '../types/auth';
import { comparePassword, hashPassword } from '../utils/password';
import { serializeUser } from '../utils/serializers';
import { HttpError } from '../utils/http-error';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../utils/tokens';

const userRepository = () => AppDataSource.getRepository(User);
const refreshTokenRepository = () => AppDataSource.getRepository(RefreshToken);

const createSession = async (user: User) => {
  const tokenId = randomUUID();
  const accessToken = signAccessToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
  });
  const refreshToken = signRefreshToken({
    sub: String(user.id),
    email: user.email,
    role: user.role,
    tokenId,
  });

  const refreshTokenEntity = refreshTokenRepository().create({
    tokenId,
    userId: user.id,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * env.REFRESH_TOKEN_TTL_DAYS),
    revokedAt: null,
  });

  await refreshTokenRepository().save(refreshTokenEntity);

  return {
    accessToken,
    refreshToken,
    user: serializeUser(user),
  };
};

const getUserById = (userId: number) =>
  userRepository().findOneBy({
    id: userId,
  });

export const authService = {
  async register(input: { email: string; password: string; name?: string }) {
    const email = input.email.trim().toLowerCase();
    const password = input.password.trim();

    if (!email || !password) {
      throw new HttpError(400, 'Email and password are required.');
    }

    const existingUser = await userRepository().findOneBy({ email });

    if (existingUser) {
      throw new HttpError(409, 'A user with this email already exists.');
    }

    const totalUsers = await userRepository().count();
    const user = userRepository().create({
      email,
      passwordHash: await hashPassword(password),
      name: input.name?.trim() || email.split('@')[0],
      role: totalUsers === 0 ? USER_ROLES.ADMIN : USER_ROLES.USER,
      avatarUrl: null,
    });

    const savedUser = await userRepository().save(user);
    return createSession(savedUser);
  },

  async login(input: { email: string; password: string }) {
    const email = input.email.trim().toLowerCase();
    const user = await userRepository().findOneBy({ email });

    if (!user) {
      throw new HttpError(401, 'Invalid credentials.');
    }

    const matches = await comparePassword(input.password, user.passwordHash);

    if (!matches) {
      throw new HttpError(401, 'Invalid credentials.');
    }

    return createSession(user);
  },

  async refresh(refreshToken: string) {
    if (!refreshToken) {
      throw new HttpError(400, 'Refresh token is required.');
    }

    const payload = verifyRefreshToken(refreshToken);
    const tokenRecord = await refreshTokenRepository().findOne({
      where: { tokenId: payload.tokenId },
      relations: {
        user: true,
      },
    });

    if (
      !tokenRecord ||
      tokenRecord.revokedAt ||
      tokenRecord.expiresAt.getTime() < Date.now()
    ) {
      throw new HttpError(401, 'Refresh token is invalid or expired.');
    }

    tokenRecord.revokedAt = new Date();
    await refreshTokenRepository().save(tokenRecord);

    return createSession(tokenRecord.user);
  },

  async logout(refreshToken: string) {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = verifyRefreshToken(refreshToken);
      const tokenRecord = await refreshTokenRepository().findOneBy({ tokenId: payload.tokenId });

      if (!tokenRecord) {
        return;
      }

      tokenRecord.revokedAt = new Date();
      await refreshTokenRepository().save(tokenRecord);
    } catch {
      return;
    }
  },

  async me(user: AuthenticatedUser) {
    const fullUser = await getUserById(user.id);

    if (!fullUser) {
      throw new HttpError(404, 'User not found.');
    }

    return serializeUser(fullUser);
  },
};
