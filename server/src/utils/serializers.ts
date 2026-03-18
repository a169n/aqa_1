import type { UserRole } from '../constants/roles';
import type { Comment } from '../models/comment.entity';
import type { Like } from '../models/like.entity';
import type { Post } from '../models/post.entity';
import type { Report } from '../models/report.entity';
import type { Tag } from '../models/tag.entity';
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

export const serializeTag = (tag: Tag) => ({
  id: tag.id,
  name: tag.name,
  slug: tag.slug,
  createdAt: tag.createdAt,
  updatedAt: tag.updatedAt,
});

export const serializeReport = (report: Report) => ({
  id: report.id,
  reason: report.reason,
  status: report.status,
  reporterId: report.reporterId,
  postId: report.postId,
  commentId: report.commentId,
  resolutionNote: report.resolutionNote,
  resolvedAt: report.resolvedAt,
  createdAt: report.createdAt,
  updatedAt: report.updatedAt,
  reporter: serializeUser(report.reporter),
  resolvedBy: report.resolvedBy ? serializeUser(report.resolvedBy) : null,
  post: report.post
    ? {
        id: report.post.id,
        title: report.post.title,
        status: report.post.status,
      }
    : null,
  comment: report.comment
    ? {
        id: report.comment.id,
        content: report.comment.content,
      }
    : null,
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
  const tags = (post.postTags ?? []).map((postTag) => postTag.tag).filter(Boolean);
  const bookmarks = post.bookmarks ?? [];
  const viewerLike = viewer ? likes.find((like) => like.userId === viewer.id) : null;
  const isBookmarked = viewer ? bookmarks.some((bookmark) => bookmark.userId === viewer.id) : false;

  return {
    id: post.id,
    title: post.title,
    content: post.content,
    status: post.status,
    excerpt: post.excerpt,
    authorId: post.authorId,
    publishedAt: post.publishedAt,
    archivedAt: post.archivedAt,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: serializeUser(post.author),
    category: post.category
      ? {
          id: post.category.id,
          name: post.category.name,
          slug: post.category.slug,
        }
      : null,
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
    })),
    isBookmarked,
    commentsCount: sortedComments.length,
    likesCount: likes.length,
    viewerHasLiked: Boolean(viewerLike),
    viewerLikeId: viewerLike?.id ?? null,
    comments: options?.includeComments ? sortedComments.map(serializeComment) : undefined,
  };
};
