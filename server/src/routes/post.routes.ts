import { Router } from 'express';
import { createComment, deleteComment } from '../controllers/comment.controller';
import { likePost, unlikePost } from '../controllers/like.controller';
import {
  createPost,
  deletePost,
  getPost,
  listPosts,
  updatePost,
} from '../controllers/post.controller';
import { attachUserIfPresent, authenticate } from '../middleware/authenticate';

export const postRouter = Router();

postRouter.get('/', attachUserIfPresent, listPosts);
postRouter.get('/:id', attachUserIfPresent, getPost);
postRouter.post('/', authenticate, createPost);
postRouter.put('/:id', authenticate, updatePost);
postRouter.delete('/:id', authenticate, deletePost);
postRouter.post('/:postId/comments', authenticate, createComment);
postRouter.delete('/comments/:id', authenticate, deleteComment);
postRouter.post('/:postId/likes', authenticate, likePost);
postRouter.delete('/:postId/likes', authenticate, unlikePost);

