import { Router } from 'express';
import { login, logout, me, refresh, register } from '../controllers/auth.controller';
import { authenticate } from '../middleware/authenticate';
import { authRateLimiter, noStoreResponses } from '../middleware/security';

export const authRouter = Router();

authRouter.use(noStoreResponses);
authRouter.post('/register', authRateLimiter, register);
authRouter.post('/login', authRateLimiter, login);
authRouter.post('/refresh', authRateLimiter, refresh);
authRouter.post('/logout', logout);
authRouter.get('/me', authenticate, me);
