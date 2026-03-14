import { Router } from 'express';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { postRouter } from './post.routes';
import { profileRouter } from './profile.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/user', profileRouter);
apiRouter.use('/admin', adminRouter);

