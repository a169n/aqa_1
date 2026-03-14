import type { UserRole } from '../constants/roles';
import type { Comment } from '../models/comment.entity';
import type { Like } from '../models/like.entity';
import type { Post } from '../models/post.entity';
import type { User } from '../models/user.entity';
import type { AuthenticatedUser } from '../types/auth';

export const serializeUser = (user: User | AuthenticatedUser) => ({
  id: user.id,
  email: user.email,
  name: user.name,
  role: user.role as UserRole,
  avatarUrl: user.avatarUrl ?? null,
});

export const serializeComment = (comment: Comment) => ({
  id: comment.id,
  content: comment.content,
  postId: comment.postId,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  author: serializeUser(comment.author),
});

export const serializeLike = (like: Like) => ({
  id: like.id,
  postId: like.postId,
  createdAt: like.createdAt,
  user: serializeUser(like.user),
});

export const serializePost = (
  post: Post,
  viewer?: AuthenticatedUser | null,
  options?: { includeComments?: boolean },
) => {
  const sortedComments = [...(post.comments ?? [])].sort(
    (left, right) => left.createdAt.getTime() - right.createdAt.getTime(),
  );
  const likes = post.likes ?? [];
  const viewerLike = viewer ? likes.find((like) => like.userId === viewer.id) : null;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    authorId: post.authorId,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: serializeUser(post.author),
    commentsCount: sortedComments.length,
    likesCount: likes.length,
    viewerHasLiked: Boolean(viewerLike),
    viewerLikeId: viewerLike?.id ?? null,
    comments: options?.includeComments ? sortedComments.map(serializeComment) : undefined,
  };
};

