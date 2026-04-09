import { AppDataSource } from '../config/data-source';
import { In } from 'typeorm';
import { POST_STATUSES, type PostStatus } from '../constants/post-status';
import { USER_ROLES } from '../constants/roles';
import { Bookmark } from '../models/bookmark.entity';
import { Category } from '../models/category.entity';
import { Comment } from '../models/comment.entity';
import { Like } from '../models/like.entity';
import { Post } from '../models/post.entity';
import { PostTag } from '../models/post-tag.entity';
import { Tag } from '../models/tag.entity';
import type { AuthenticatedUser } from '../types/auth';
import { HttpError } from '../utils/http-error';
import { serializeComment, serializeLike, serializePost } from '../utils/serializers';

const postRepository = () => AppDataSource.getRepository(Post);
const categoryRepository = () => AppDataSource.getRepository(Category);
const tagRepository = () => AppDataSource.getRepository(Tag);
const postTagRepository = () => AppDataSource.getRepository(PostTag);
const bookmarkRepository = () => AppDataSource.getRepository(Bookmark);
const commentRepository = () => AppDataSource.getRepository(Comment);
const likeRepository = () => AppDataSource.getRepository(Like);

const postRelations = {
  author: true,
  category: true,
  postTags: {
    tag: true,
  },
  bookmarks: true,
  comments: {
    author: true,
  },
  likes: {
    user: true,
  },
} as const;

const findPost = (postId: number) =>
  postRepository().findOne({
    where: { id: postId },
    relations: postRelations,
  });

const canManagePost = (post: Post, actor: AuthenticatedUser) =>
  actor.role === USER_ROLES.ADMIN || actor.id === post.authorId;

const canManageComment = (comment: Comment, actor: AuthenticatedUser) =>
  actor.role === USER_ROLES.ADMIN || actor.id === comment.authorId;

const normalizeTagIds = (tagIds?: number[]) =>
  Array.from(
    new Set(
      (tagIds ?? [])
        .map((value) => Number(value))
        .filter((value) => Number.isInteger(value) && value > 0),
    ),
  );

const syncPostTags = async (postId: number, tagIds: number[]) => {
  await postTagRepository().delete({ postId });

  if (!tagIds.length) {
    return;
  }

  await postTagRepository().insert(
    tagIds.map((tagId) => ({
      postId,
      tagId,
    })),
  );
};

const ensureCategoryExists = async (categoryId: number | null) => {
  if (!categoryId) {
    return;
  }

  const category = await categoryRepository().findOneBy({ id: categoryId });

  if (!category) {
    throw new HttpError(400, 'Selected category does not exist.');
  }
};

const ensureTagsExist = async (tagIds: number[]) => {
  if (!tagIds.length) {
    return;
  }

  const tags = await tagRepository().findBy({
    id: In(tagIds),
  });

  if (tags.length !== tagIds.length) {
    throw new HttpError(400, 'One or more selected tags do not exist.');
  }
};

const ensureVisiblePost = (post: Post, viewer?: AuthenticatedUser) => {
  if (post.status === POST_STATUSES.PUBLISHED) {
    return;
  }

  if (viewer && canManagePost(post, viewer)) {
    return;
  }

  throw new HttpError(404, 'Post not found.');
};

const ensurePublishedForReaderAction = (post: Post, actor: AuthenticatedUser) => {
  if (post.status === POST_STATUSES.PUBLISHED) {
    return;
  }

  if (canManagePost(post, actor)) {
    return;
  }

  throw new HttpError(403, 'This action is available only for published posts.');
};

const basePostQuery = () =>
  postRepository()
    .createQueryBuilder('post')
    .leftJoinAndSelect('post.author', 'author')
    .leftJoinAndSelect('post.category', 'category')
    .leftJoinAndSelect('post.postTags', 'postTag')
    .leftJoinAndSelect('postTag.tag', 'tag')
    .leftJoinAndSelect('post.bookmarks', 'bookmark')
    .leftJoinAndSelect('post.comments', 'comment')
    .leftJoinAndSelect('comment.author', 'commentAuthor')
    .leftJoinAndSelect('post.likes', 'like')
    .leftJoinAndSelect('like.user', 'likeUser');

const toNullableNumber = (value?: string) => {
  if (!value) {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

interface PostListFilters {
  status?: string;
  categoryId?: string;
  tag?: string;
  search?: string;
  authorId?: string;
}

export interface PostVisibilityScope {
  authorId: number | null;
  status: PostStatus;
}

export const resolvePostVisibilityScope = (
  filters: PostListFilters,
  viewer?: AuthenticatedUser,
): PostVisibilityScope => {
  const requestedStatus = filters.status as PostStatus | undefined;
  const authorId = toNullableNumber(filters.authorId);

  if (!requestedStatus || requestedStatus === POST_STATUSES.PUBLISHED) {
    return {
      authorId,
      status: POST_STATUSES.PUBLISHED,
    };
  }

  if (viewer?.role === USER_ROLES.ADMIN) {
    return {
      authorId,
      status: requestedStatus,
    };
  }

  if (viewer) {
    const scopedAuthorId = authorId ?? viewer.id;

    if (scopedAuthorId !== viewer.id) {
      return {
        authorId,
        status: POST_STATUSES.PUBLISHED,
      };
    }

    return {
      authorId: viewer.id,
      status: requestedStatus,
    };
  }

  return {
    authorId,
    status: POST_STATUSES.PUBLISHED,
  };
};

const applyPostFilters = (
  query: ReturnType<typeof basePostQuery>,
  filters: PostListFilters,
  viewer?: AuthenticatedUser,
) => {
  const visibilityScope = resolvePostVisibilityScope(filters, viewer);

  query.andWhere('post.status = :status', { status: visibilityScope.status });

  if (visibilityScope.authorId) {
    query.andWhere('post.author_id = :authorId', { authorId: visibilityScope.authorId });
  }

  const categoryId = toNullableNumber(filters.categoryId);

  if (categoryId) {
    query.andWhere('post.category_id = :categoryId', { categoryId });
  }

  if (filters.tag?.trim()) {
    const tagValue = filters.tag.trim().toLowerCase();
    query.andWhere('(LOWER(tag.slug) = :tagValue OR LOWER(tag.name) = :tagValue)', { tagValue });
  }

  if (filters.search?.trim()) {
    const search = `%${filters.search.trim().toLowerCase()}%`;
    query.andWhere(
      '(LOWER(post.title) LIKE :search OR LOWER(post.content) LIKE :search OR LOWER(author.name) LIKE :search)',
      { search },
    );
  }
};

export const blogService = {
  async listPosts(viewer?: AuthenticatedUser, filters: PostListFilters = {}) {
    const query = basePostQuery();

    applyPostFilters(query, filters, viewer);
    query.orderBy('post.published_at', 'DESC', 'NULLS LAST').addOrderBy('post.created_at', 'DESC');

    const posts = await query.getMany();

    return posts.map((post) => serializePost(post, viewer));
  },

  async listPostsForAdmin(viewer: AuthenticatedUser) {
    const posts = await postRepository().find({
      relations: postRelations,
      order: {
        createdAt: 'DESC',
      },
    });

    return posts.map((post) => serializePost(post, viewer));
  },

  async listWorkspacePosts(actor: AuthenticatedUser, filters: { status?: string }) {
    const query = basePostQuery().andWhere('post.author_id = :authorId', { authorId: actor.id });

    if (filters.status && Object.values(POST_STATUSES).includes(filters.status as PostStatus)) {
      query.andWhere('post.status = :status', { status: filters.status });
    }

    query.orderBy('post.updated_at', 'DESC');
    const posts = await query.getMany();

    return posts.map((post) => serializePost(post, actor));
  },

  async getPost(postId: number, viewer?: AuthenticatedUser) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    ensureVisiblePost(post, viewer);

    return serializePost(post, viewer, { includeComments: true });
  },

  async createPost(
    actor: AuthenticatedUser,
    input: {
      title: string;
      content: string;
      excerpt?: string;
      categoryId?: number | null;
      tagIds?: number[];
    },
  ) {
    const title = input.title?.trim();
    const content = input.content?.trim();

    if (!title || !content) {
      throw new HttpError(400, 'Title and content are required.');
    }

    const excerpt = input.excerpt?.trim() || null;
    const categoryId = input.categoryId ? Number(input.categoryId) : null;
    const tagIds = normalizeTagIds(input.tagIds);

    await ensureCategoryExists(categoryId);
    await ensureTagsExist(tagIds);

    const post = postRepository().create({
      title,
      content,
      excerpt,
      categoryId,
      status: POST_STATUSES.DRAFT,
      authorId: actor.id,
      publishedAt: null,
      archivedAt: null,
    });

    const savedPost = await postRepository().save(post);
    await syncPostTags(savedPost.id, tagIds);

    const completePost = await findPost(savedPost.id);

    if (!completePost) {
      throw new HttpError(500, 'Post was created but could not be loaded.');
    }

    return serializePost(completePost, actor, { includeComments: true });
  },

  async updatePost(
    postId: number,
    actor: AuthenticatedUser,
    input: {
      title?: string;
      content?: string;
      excerpt?: string;
      categoryId?: number | null;
      tagIds?: number[];
    },
  ) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    if (!canManagePost(post, actor)) {
      throw new HttpError(403, 'You do not have permission to update this post.');
    }

    const title = input.title?.trim();
    const content = input.content?.trim();

    if (typeof input.title === 'string' && !title) {
      throw new HttpError(400, 'Title cannot be empty.');
    }

    if (typeof input.content === 'string' && !content) {
      throw new HttpError(400, 'Content cannot be empty.');
    }

    if (title) {
      post.title = title;
    }

    if (content) {
      post.content = content;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'excerpt')) {
      post.excerpt = input.excerpt?.trim() || null;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'categoryId')) {
      const categoryId = input.categoryId ? Number(input.categoryId) : null;
      await ensureCategoryExists(categoryId);
      post.categoryId = categoryId;
    }

    if (Object.prototype.hasOwnProperty.call(input, 'tagIds')) {
      const tagIds = normalizeTagIds(input.tagIds);
      await ensureTagsExist(tagIds);
      await syncPostTags(postId, tagIds);
    }

    await postRepository().save(post);

    const updatedPost = await findPost(postId);

    if (!updatedPost) {
      throw new HttpError(500, 'Updated post could not be loaded.');
    }

    return serializePost(updatedPost, actor, { includeComments: true });
  },

  async publishPost(postId: number, actor: AuthenticatedUser) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    if (!canManagePost(post, actor)) {
      throw new HttpError(403, 'You do not have permission to publish this post.');
    }

    post.status = POST_STATUSES.PUBLISHED;
    post.publishedAt = new Date();
    post.archivedAt = null;
    await postRepository().save(post);

    const updatedPost = await findPost(postId);

    if (!updatedPost) {
      throw new HttpError(500, 'Published post could not be loaded.');
    }

    return serializePost(updatedPost, actor, { includeComments: true });
  },

  async archivePost(postId: number, actor: AuthenticatedUser) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    if (!canManagePost(post, actor)) {
      throw new HttpError(403, 'You do not have permission to archive this post.');
    }

    post.status = POST_STATUSES.ARCHIVED;
    post.archivedAt = new Date();
    await postRepository().save(post);

    const updatedPost = await findPost(postId);

    if (!updatedPost) {
      throw new HttpError(500, 'Archived post could not be loaded.');
    }

    return serializePost(updatedPost, actor, { includeComments: true });
  },

  async restorePost(postId: number, actor: AuthenticatedUser) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    if (!canManagePost(post, actor)) {
      throw new HttpError(403, 'You do not have permission to restore this post.');
    }

    post.status = POST_STATUSES.DRAFT;
    post.archivedAt = null;
    await postRepository().save(post);

    const updatedPost = await findPost(postId);

    if (!updatedPost) {
      throw new HttpError(500, 'Restored post could not be loaded.');
    }

    return serializePost(updatedPost, actor, { includeComments: true });
  },

  async deletePost(postId: number, actor: AuthenticatedUser) {
    const post = await postRepository().findOneBy({ id: postId });

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    if (!canManagePost(post, actor)) {
      throw new HttpError(403, 'You do not have permission to delete this post.');
    }

    await postRepository().remove(post);
  },

  async addComment(postId: number, actor: AuthenticatedUser, input: { content: string }) {
    const post = await postRepository().findOneBy({ id: postId });

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    ensurePublishedForReaderAction(post, actor);

    const content = input.content.trim();

    if (!content) {
      throw new HttpError(400, 'Comment content is required.');
    }

    const comment = commentRepository().create({
      content,
      postId,
      authorId: actor.id,
    });

    const savedComment = await commentRepository().save(comment);
    const fullComment = await commentRepository().findOne({
      where: { id: savedComment.id },
      relations: {
        author: true,
        post: true,
      },
    });

    if (!fullComment) {
      throw new HttpError(500, 'Comment was created but could not be loaded.');
    }

    return serializeComment(fullComment);
  },

  async deleteComment(commentId: number, actor: AuthenticatedUser) {
    const comment = await commentRepository().findOneBy({ id: commentId });

    if (!comment) {
      throw new HttpError(404, 'Comment not found.');
    }

    if (!canManageComment(comment, actor)) {
      throw new HttpError(403, 'You do not have permission to delete this comment.');
    }

    await commentRepository().remove(comment);
  },

  async likePost(postId: number, actor: AuthenticatedUser) {
    const post = await postRepository().findOneBy({ id: postId });

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    ensurePublishedForReaderAction(post, actor);

    const existingLike = await likeRepository().findOneBy({
      postId,
      userId: actor.id,
    });

    if (existingLike) {
      throw new HttpError(409, 'You have already liked this post.');
    }

    const like = likeRepository().create({
      postId,
      userId: actor.id,
    });

    const savedLike = await likeRepository().save(like);
    const fullLike = await likeRepository().findOne({
      where: { id: savedLike.id },
      relations: {
        user: true,
        post: true,
      },
    });

    if (!fullLike) {
      throw new HttpError(500, 'Like was created but could not be loaded.');
    }

    return serializeLike(fullLike);
  },

  async unlikePost(postId: number, actor: AuthenticatedUser) {
    const like = await likeRepository().findOneBy({
      postId,
      userId: actor.id,
    });

    if (!like) {
      throw new HttpError(404, 'Like not found.');
    }

    await likeRepository().remove(like);
  },

  async listBookmarks(actor: AuthenticatedUser) {
    const bookmarks = await bookmarkRepository().find({
      where: {
        userId: actor.id,
      },
      relations: {
        post: {
          author: true,
          category: true,
          postTags: {
            tag: true,
          },
          bookmarks: true,
          comments: {
            author: true,
          },
          likes: {
            user: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return bookmarks
      .filter((bookmark) => bookmark.post?.status === POST_STATUSES.PUBLISHED)
      .map((bookmark) => ({
        id: bookmark.id,
        createdAt: bookmark.createdAt,
        post: serializePost(bookmark.post, actor),
      }));
  },

  async addBookmark(postId: number, actor: AuthenticatedUser) {
    const post = await postRepository().findOneBy({ id: postId });

    if (!post || post.status !== POST_STATUSES.PUBLISHED) {
      throw new HttpError(404, 'Published post not found.');
    }

    const existingBookmark = await bookmarkRepository().findOneBy({
      postId,
      userId: actor.id,
    });

    if (existingBookmark) {
      return {
        id: existingBookmark.id,
        postId,
        userId: actor.id,
        createdAt: existingBookmark.createdAt,
      };
    }

    const bookmark = bookmarkRepository().create({
      postId,
      userId: actor.id,
    });

    const savedBookmark = await bookmarkRepository().save(bookmark);

    return {
      id: savedBookmark.id,
      postId,
      userId: actor.id,
      createdAt: savedBookmark.createdAt,
    };
  },

  async removeBookmark(postId: number, actor: AuthenticatedUser) {
    const bookmark = await bookmarkRepository().findOneBy({
      postId,
      userId: actor.id,
    });

    if (!bookmark) {
      throw new HttpError(404, 'Bookmark not found.');
    }

    await bookmarkRepository().remove(bookmark);
  },

  async listComments() {
    const comments = await commentRepository().find({
      relations: {
        author: true,
        post: {
          author: true,
          category: true,
          postTags: {
            tag: true,
          },
          bookmarks: true,
          comments: true,
          likes: {
            user: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return comments.map((comment) => ({
      ...serializeComment(comment),
      post: {
        id: comment.post.id,
        title: comment.post.title,
      },
    }));
  },

  async listLikes() {
    const likes = await likeRepository().find({
      relations: {
        user: true,
        post: {
          author: true,
          category: true,
          postTags: {
            tag: true,
          },
          bookmarks: true,
          comments: true,
          likes: {
            user: true,
          },
        },
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return likes.map((like) => ({
      ...serializeLike(like),
      post: {
        id: like.post.id,
        title: like.post.title,
      },
    }));
  },

  async deleteLike(likeId: number) {
    const like = await likeRepository().findOneBy({ id: likeId });

    if (!like) {
      throw new HttpError(404, 'Like not found.');
    }

    await likeRepository().remove(like);
  },
};
