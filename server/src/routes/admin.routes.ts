import { Router } from 'express';
import {
  deleteAdminComment,
  deleteAdminLike,
  deleteAdminPost,
  deleteAdminUser,
  listAdminComments,
  listAdminLikes,
  listAdminPosts,
  listAdminUsers,
  updateAdminPost,
  updateAdminUserRole,
} from '../controllers/admin.controller';
import { authenticate, requireAdmin } from '../middleware/authenticate';

export const adminRouter = Router();

adminRouter.use(authenticate, requireAdmin);
adminRouter.get('/posts', listAdminPosts);
adminRouter.put('/posts/:id', updateAdminPost);
adminRouter.delete('/posts/:id', deleteAdminPost);
adminRouter.get('/users', listAdminUsers);
adminRouter.put('/users/:id/role', updateAdminUserRole);
adminRouter.delete('/users/:id', deleteAdminUser);
adminRouter.get('/comments', listAdminComments);
adminRouter.delete('/comments/:id', deleteAdminComment);
adminRouter.get('/likes', listAdminLikes);
adminRouter.delete('/likes/:id', deleteAdminLike);
