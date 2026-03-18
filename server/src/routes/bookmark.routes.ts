import { Router } from 'express';
import { listBookmarks } from '../controllers/post.controller';
import { authenticate } from '../middleware/authenticate';

export const bookmarkRouter = Router();

bookmarkRouter.use(authenticate);
bookmarkRouter.get('/', listBookmarks);
