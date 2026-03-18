import { Router } from 'express';
import { createComment, deleteComment } from '../controllers/comment.controller';
import { likePost, unlikePost } from '../controllers/like.controller';
import {
  addBookmark,
  archivePost,
  createPost,
  deletePost,
  getPost,
  listPosts,
  publishPost,
  removeBookmark,
  restorePost,
  updatePost,
} from '../controllers/post.controller';
import { attachUserIfPresent, authenticate } from '../middleware/authenticate';

export const postRouter = Router();

postRouter.get('/', attachUserIfPresent, listPosts);
postRouter.get('/:id', attachUserIfPresent, getPost);
postRouter.post('/', authenticate, createPost);
postRouter.put('/:id', authenticate, updatePost);
postRouter.delete('/:id', authenticate, deletePost);
postRouter.post('/:id/publish', authenticate, publishPost);
postRouter.post('/:id/archive', authenticate, archivePost);
postRouter.post('/:id/restore', authenticate, restorePost);
postRouter.post('/:id/bookmarks', authenticate, addBookmark);
postRouter.delete('/:id/bookmarks', authenticate, removeBookmark);
postRouter.post('/:postId/comments', authenticate, createComment);
postRouter.delete('/comments/:id', authenticate, deleteComment);
postRouter.post('/:postId/likes', authenticate, likePost);
postRouter.delete('/:postId/likes', authenticate, unlikePost);
