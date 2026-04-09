import { AppDataSource } from '../config/data-source';
import { Bookmark } from '../models/bookmark.entity';
import { Category } from '../models/category.entity';
import { Comment } from '../models/comment.entity';
import { Like } from '../models/like.entity';
import { Post } from '../models/post.entity';
import { PostTag } from '../models/post-tag.entity';
import { RefreshToken } from '../models/refresh-token.entity';
import { Report } from '../models/report.entity';
import { Tag } from '../models/tag.entity';
import { User } from '../models/user.entity';
import { cleanDatabase } from '../scripts/db-utils';
import { DEMO_USER_PASSWORD, baseSeedCounts } from '../scripts/seed-data';
import { seedDatabase } from '../scripts/seed-db';
import { comparePassword } from '../utils/password';

const collectCountsSequentially = async (countReaders: Array<() => Promise<number>>) => {
  const counts: number[] = [];

  for (const readCount of countReaders) {
    counts.push(await readCount());
  }

  return counts;
};

describe('Database seed scripts', () => {
  it('creates a deterministic demo dataset with valid relations', async () => {
    const result = await seedDatabase(AppDataSource);

    expect(result).toEqual(baseSeedCounts);

    const userRepository = AppDataSource.getRepository(User);
    const users = await userRepository.find({
      order: {
        email: 'ASC',
      },
    });

    expect(users.some((user) => user.role === 'admin')).toBe(true);
    expect(users.some((user) => user.role === 'user')).toBe(true);

    const admin = users.find((user) => user.email === 'admin@example.com');
    const user = users.find((user) => user.email === 'user@example.com');

    expect(admin).toBeDefined();
    expect(user).toBeDefined();
    await expect(comparePassword(DEMO_USER_PASSWORD, admin!.passwordHash)).resolves.toBe(true);
    await expect(comparePassword(DEMO_USER_PASSWORD, user!.passwordHash)).resolves.toBe(true);

    const posts = await AppDataSource.getRepository(Post).find({
      relations: {
        author: true,
        category: true,
        comments: {
          author: true,
        },
        likes: {
          user: true,
        },
        bookmarks: {
          user: true,
        },
        postTags: {
          tag: true,
        },
      },
      order: {
        id: 'ASC',
      },
    });

    expect(posts).toHaveLength(baseSeedCounts.posts);
    expect(posts.filter((post) => post.status === 'published')).toHaveLength(3);
    expect(posts.filter((post) => post.status === 'draft')).toHaveLength(1);
    expect(posts.filter((post) => post.status === 'archived')).toHaveLength(1);

    for (const post of posts) {
      expect(post.author.id).toBe(post.authorId);
      expect(post.category?.id ?? null).toBe(post.categoryId);
      for (const comment of post.comments) {
        expect(comment.postId).toBe(post.id);
        expect(comment.author.id).toBe(comment.authorId);
      }
      for (const like of post.likes) {
        expect(like.postId).toBe(post.id);
        expect(like.user.id).toBe(like.userId);
      }
      for (const bookmark of post.bookmarks) {
        expect(bookmark.postId).toBe(post.id);
        expect(bookmark.user.id).toBe(bookmark.userId);
      }
      for (const postTag of post.postTags) {
        expect(postTag.postId).toBe(post.id);
        expect(postTag.tag.id).toBe(postTag.tagId);
      }
    }

    const tableCounts = await collectCountsSequentially([
      () => AppDataSource.getRepository(Category).count(),
      () => AppDataSource.getRepository(Tag).count(),
      () => AppDataSource.getRepository(PostTag).count(),
      () => AppDataSource.getRepository(Comment).count(),
      () => AppDataSource.getRepository(Like).count(),
      () => AppDataSource.getRepository(Bookmark).count(),
      () => AppDataSource.getRepository(Report).count(),
      () => AppDataSource.getRepository(RefreshToken).count(),
    ]);

    expect(tableCounts).toEqual([
      baseSeedCounts.categories,
      baseSeedCounts.tags,
      baseSeedCounts.postTags,
      baseSeedCounts.comments,
      baseSeedCounts.likes,
      baseSeedCounts.bookmarks,
      baseSeedCounts.reports,
      baseSeedCounts.refreshTokens,
    ]);
  });

  it('cleans all application tables without dropping the schema', async () => {
    await seedDatabase(AppDataSource);
    await cleanDatabase(AppDataSource);

    const counts = await collectCountsSequentially([
      () => AppDataSource.getRepository(User).count(),
      () => AppDataSource.getRepository(Post).count(),
      () => AppDataSource.getRepository(Comment).count(),
      () => AppDataSource.getRepository(Like).count(),
      () => AppDataSource.getRepository(Category).count(),
      () => AppDataSource.getRepository(Tag).count(),
      () => AppDataSource.getRepository(PostTag).count(),
      () => AppDataSource.getRepository(Bookmark).count(),
      () => AppDataSource.getRepository(Report).count(),
      () => AppDataSource.getRepository(RefreshToken).count(),
    ]);

    expect(counts).toEqual([0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  });

  it('rejects destructive actions for production-like database names', async () => {
    await expect(
      cleanDatabase(AppDataSource, {
        databaseName: 'inkwell_prod',
      }),
    ).rejects.toThrow(
      'Refusing to modify database "inkwell_prod". Only local/dev/test databases are allowed.',
    );
  });

  it('reseeds deterministically when run more than once', async () => {
    const firstSeed = await seedDatabase(AppDataSource);
    const secondSeed = await seedDatabase(AppDataSource);

    expect(secondSeed).toEqual(firstSeed);

    const counts = await collectCountsSequentially([
      () => AppDataSource.getRepository(User).count(),
      () => AppDataSource.getRepository(Post).count(),
      () => AppDataSource.getRepository(PostTag).count(),
      () => AppDataSource.getRepository(Comment).count(),
      () => AppDataSource.getRepository(Like).count(),
      () => AppDataSource.getRepository(Bookmark).count(),
      () => AppDataSource.getRepository(Report).count(),
      () => AppDataSource.getRepository(RefreshToken).count(),
    ]);

    expect(counts).toEqual([
      baseSeedCounts.users,
      baseSeedCounts.posts,
      baseSeedCounts.postTags,
      baseSeedCounts.comments,
      baseSeedCounts.likes,
      baseSeedCounts.bookmarks,
      baseSeedCounts.reports,
      baseSeedCounts.refreshTokens,
    ]);
  });
});
