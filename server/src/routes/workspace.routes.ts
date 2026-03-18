import { Router } from 'express';
import { listWorkspacePosts } from '../controllers/post.controller';
import { authenticate } from '../middleware/authenticate';

export const workspaceRouter = Router();

workspaceRouter.use(authenticate);
workspaceRouter.get('/posts', listWorkspacePosts);
