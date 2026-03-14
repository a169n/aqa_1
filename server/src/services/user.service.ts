import { AppDataSource } from '../config/data-source';
import { USER_ROLES, type UserRole } from '../constants/roles';
import { User } from '../models/user.entity';
import type { AuthenticatedUser } from '../types/auth';
import { HttpError } from '../utils/http-error';
import { serializeComment, serializePost, serializeUser } from '../utils/serializers';

const userRepository = () => AppDataSource.getRepository(User);

export const userService = {
  async getProfile(userId: number) {
    const user = await userRepository().findOne({
      where: { id: userId },
      relations: {
        posts: {
          author: true,
          comments: {
            author: true,
          },
          likes: {
            user: true,
          },
        },
        comments: {
          author: true,
          post: {
            author: true,
          },
        },
      },
      order: {
        posts: {
          createdAt: 'DESC',
        },
        comments: {
          createdAt: 'DESC',
        },
      },
    });

    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    return {
      ...serializeUser(user),
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      posts: user.posts.map((post) =>
        serializePost(post, serializeUser(user), { includeComments: true }),
      ),
      comments: user.comments.map((comment) => ({
        ...serializeComment(comment),
        post: {
          id: comment.post.id,
          title: comment.post.title,
        },
      })),
    };
  },

  async updateProfile(actor: AuthenticatedUser, input: { name: string; email: string }) {
    const user = await userRepository().findOneBy({ id: actor.id });

    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    const email = input.email.trim().toLowerCase();
    const name = input.name.trim();

    if (!email || !name) {
      throw new HttpError(400, 'Name and email are required.');
    }

    const existingUser = await userRepository().findOneBy({ email });

    if (existingUser && existingUser.id !== user.id) {
      throw new HttpError(409, 'Another user already uses this email.');
    }

    user.email = email;
    user.name = name;
    await userRepository().save(user);

    return serializeUser(user);
  },

  async updateAvatar(actor: AuthenticatedUser, avatarUrl: string) {
    const user = await userRepository().findOneBy({ id: actor.id });

    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    user.avatarUrl = avatarUrl;
    await userRepository().save(user);

    return serializeUser(user);
  },

  async listUsers() {
    const users = await userRepository().find({
      relations: {
        posts: true,
        comments: true,
        likes: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => ({
      ...serializeUser(user),
      createdAt: user.createdAt,
      postsCount: user.posts.length,
      commentsCount: user.comments.length,
      likesCount: user.likes.length,
    }));
  },

  async updateRole(userId: number, role: UserRole) {
    const user = await userRepository().findOneBy({ id: userId });

    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    if (!Object.values(USER_ROLES).includes(role)) {
      throw new HttpError(400, 'Invalid role.');
    }

    if (user.role === USER_ROLES.ADMIN && role !== USER_ROLES.ADMIN) {
      const adminCount = await userRepository().countBy({ role: USER_ROLES.ADMIN });

      if (adminCount === 1) {
        throw new HttpError(400, 'The last admin cannot be demoted.');
      }
    }

    user.role = role;
    await userRepository().save(user);

    return serializeUser(user);
  },

  async deleteUser(userId: number) {
    const user = await userRepository().findOneBy({ id: userId });

    if (!user) {
      throw new HttpError(404, 'User not found.');
    }

    if (user.role === USER_ROLES.ADMIN) {
      const adminCount = await userRepository().countBy({ role: USER_ROLES.ADMIN });

      if (adminCount === 1) {
        throw new HttpError(400, 'The last admin cannot be deleted.');
      }
    }

    await userRepository().remove(user);
  },
};
