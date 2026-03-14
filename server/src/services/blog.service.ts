import { AppDataSource } from '../config/data-source';
import { USER_ROLES } from '../constants/roles';
import { Comment } from '../models/comment.entity';
import { Like } from '../models/like.entity';
import { Post } from '../models/post.entity';
import type { AuthenticatedUser } from '../types/auth';
import { HttpError } from '../utils/http-error';
import { serializeComment, serializeLike, serializePost } from '../utils/serializers';

const postRepository = () => AppDataSource.getRepository(Post);
const commentRepository = () => AppDataSource.getRepository(Comment);
const likeRepository = () => AppDataSource.getRepository(Like);

const postRelations = {
  author: true,
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

export const blogService = {
  async listPosts(viewer?: AuthenticatedUser) {
    const posts = await postRepository().find({
      relations: postRelations,
      order: {
        createdAt: 'DESC',
      },
    });

    return posts.map((post) => serializePost(post, viewer));
  },

  async getPost(postId: number, viewer?: AuthenticatedUser) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    return serializePost(post, viewer, { includeComments: true });
  },

  async createPost(actor: AuthenticatedUser, input: { title: string; content: string }) {
    const title = input.title.trim();
    const content = input.content.trim();

    if (!title || !content) {
      throw new HttpError(400, 'Title and content are required.');
    }

    const post = postRepository().create({
      title,
      content,
      authorId: actor.id,
    });

    const savedPost = await postRepository().save(post);
    const completePost = await findPost(savedPost.id);

    if (!completePost) {
      throw new HttpError(500, 'Post was created but could not be loaded.');
    }

    return serializePost(completePost, actor, { includeComments: true });
  },

  async updatePost(
    postId: number,
    actor: AuthenticatedUser,
    input: { title: string; content: string },
  ) {
    const post = await findPost(postId);

    if (!post) {
      throw new HttpError(404, 'Post not found.');
    }

    if (!canManagePost(post, actor)) {
      throw new HttpError(403, 'You do not have permission to update this post.');
    }

    post.title = input.title.trim() || post.title;
    post.content = input.content.trim() || post.content;
    await postRepository().save(post);

    const updatedPost = await findPost(postId);

    if (!updatedPost) {
      throw new HttpError(500, 'Updated post could not be loaded.');
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

  async listComments() {
    const comments = await commentRepository().find({
      relations: {
        author: true,
        post: {
          author: true,
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
