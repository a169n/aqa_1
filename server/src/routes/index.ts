import { Router } from 'express';
import { adminRouter } from './admin.routes';
import { authRouter } from './auth.routes';
import { bookmarkRouter } from './bookmark.routes';
import { postRouter } from './post.routes';
import { profileRouter } from './profile.routes';
import { reportRouter } from './report.routes';
import { adminTaxonomyRouter, taxonomyRouter } from './taxonomy.routes';
import { workspaceRouter } from './workspace.routes';

export const apiRouter = Router();

apiRouter.get('/health', (_request, response) => {
  response.json({ status: 'ok' });
});
apiRouter.use('/auth', authRouter);
apiRouter.use('/posts', postRouter);
apiRouter.use('/user', profileRouter);
apiRouter.use(taxonomyRouter);
apiRouter.use('/workspace', workspaceRouter);
apiRouter.use('/bookmarks', bookmarkRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/admin', adminRouter);
apiRouter.use('/admin', adminTaxonomyRouter);
