import { AppDataSource } from '../config/data-source';
import type { DataSource } from 'typeorm';
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
import { hashPassword } from '../utils/password';
import { assertSafeDevelopmentDatabaseName, cleanDatabase } from './db-utils';
import {
  DEMO_USER_PASSWORD,
  baseSeedCounts,
  seedBookmarks,
  seedCategories,
  seedComments,
  seedLikes,
  seedPosts,
  seedRefreshTokens,
  seedReports,
  seedTags,
  seedUsers,
} from './seed-data';

export interface SeedDatabaseResult {
  users: number;
  categories: number;
  tags: number;
  posts: number;
  postTags: number;
  comments: number;
  likes: number;
  bookmarks: number;
  reports: number;
  refreshTokens: number;
}

const requireEntity = <T>(value: T | undefined, label: string): T => {
  if (value) {
    return value;
  }

  throw new Error(`Missing seed dependency: ${label}`);
};

export const seedDatabase = async (dataSource: DataSource): Promise<SeedDatabaseResult> => {
  const databaseName =
    typeof dataSource.options.database === 'string' ? dataSource.options.database : '';

  assertSafeDevelopmentDatabaseName(databaseName);
  await dataSource.runMigrations();
  await cleanDatabase(dataSource, { skipSafetyCheck: true });

  const userRepository = dataSource.getRepository(User);
  const categoryRepository = dataSource.getRepository(Category);
  const tagRepository = dataSource.getRepository(Tag);
  const postRepository = dataSource.getRepository(Post);
  const commentRepository = dataSource.getRepository(Comment);
  const likeRepository = dataSource.getRepository(Like);
  const bookmarkRepository = dataSource.getRepository(Bookmark);
  const refreshTokenRepository = dataSource.getRepository(RefreshToken);
  const reportRepository = dataSource.getRepository(Report);
  const postTagRepository = dataSource.getRepository(PostTag);

  const savedUsers = await userRepository.save(
    await Promise.all(
      seedUsers.map(async (user) =>
        userRepository.create({
          email: user.email,
          name: user.name,
          role: user.role,
          avatarUrl: null,
          passwordHash: await hashPassword(DEMO_USER_PASSWORD),
        }),
      ),
    ),
  );
  const usersByKey = new Map(savedUsers.map((user, index) => [seedUsers[index]!.key, user]));

  const savedCategories = await categoryRepository.save(
    seedCategories.map((category) =>
      categoryRepository.create({
        name: category.name,
        slug: category.slug,
      }),
    ),
  );
  const categoriesByKey = new Map(
    savedCategories.map((category, index) => [seedCategories[index]!.key, category]),
  );

  const savedTags = await tagRepository.save(
    seedTags.map((tag) =>
      tagRepository.create({
        name: tag.name,
        slug: tag.slug,
      }),
    ),
  );
  const tagsByKey = new Map(savedTags.map((tag, index) => [seedTags[index]!.key, tag]));

  const savedPosts = await postRepository.save(
    seedPosts.map((post) =>
      postRepository.create({
        title: post.title,
        content: post.content,
        excerpt: post.excerpt,
        status: post.status,
        authorId: requireEntity(usersByKey.get(post.authorKey), `user:${post.authorKey}`).id,
        categoryId: requireEntity(
          categoriesByKey.get(post.categoryKey),
          `category:${post.categoryKey}`,
        ).id,
        publishedAt: post.publishedAt ? new Date(post.publishedAt) : null,
        archivedAt: post.archivedAt ? new Date(post.archivedAt) : null,
      }),
    ),
  );
  const postsByKey = new Map(savedPosts.map((post, index) => [seedPosts[index]!.key, post]));

  await postTagRepository.save(
    seedPosts.flatMap((post) =>
      post.tagKeys.map((tagKey) =>
        postTagRepository.create({
          postId: requireEntity(postsByKey.get(post.key), `post:${post.key}`).id,
          tagId: requireEntity(tagsByKey.get(tagKey), `tag:${tagKey}`).id,
        }),
      ),
    ),
  );

  const savedComments = await commentRepository.save(
    seedComments.map((comment) =>
      commentRepository.create({
        content: comment.content,
        postId: requireEntity(postsByKey.get(comment.postKey), `post:${comment.postKey}`).id,
        authorId: requireEntity(usersByKey.get(comment.authorKey), `user:${comment.authorKey}`).id,
      }),
    ),
  );
  const commentsByKey = new Map(
    savedComments.map((comment, index) => [seedComments[index]!.key, comment]),
  );

  await likeRepository.save(
    seedLikes.map((like) =>
      likeRepository.create({
        postId: requireEntity(postsByKey.get(like.postKey), `post:${like.postKey}`).id,
        userId: requireEntity(usersByKey.get(like.userKey), `user:${like.userKey}`).id,
      }),
    ),
  );

  await bookmarkRepository.save(
    seedBookmarks.map((bookmark) =>
      bookmarkRepository.create({
        postId: requireEntity(postsByKey.get(bookmark.postKey), `post:${bookmark.postKey}`).id,
        userId: requireEntity(usersByKey.get(bookmark.userKey), `user:${bookmark.userKey}`).id,
      }),
    ),
  );

  await refreshTokenRepository.save(
    seedRefreshTokens.map((refreshToken) =>
      refreshTokenRepository.create({
        tokenId: refreshToken.tokenId,
        userId: requireEntity(usersByKey.get(refreshToken.userKey), `user:${refreshToken.userKey}`)
          .id,
        expiresAt: new Date(refreshToken.expiresAt),
        revokedAt: refreshToken.revokedAt ? new Date(refreshToken.revokedAt) : null,
      }),
    ),
  );

  await reportRepository.save(
    seedReports.map((report) =>
      reportRepository.create({
        reporterId: requireEntity(usersByKey.get(report.reporterKey), `user:${report.reporterKey}`)
          .id,
        postId: null,
        commentId: requireEntity(
          commentsByKey.get(report.commentKey),
          `comment:${report.commentKey}`,
        ).id,
        reason: report.reason,
        status: report.status,
        resolutionNote: report.resolutionNote,
        resolvedById: report.resolvedByKey
          ? requireEntity(usersByKey.get(report.resolvedByKey), `user:${report.resolvedByKey}`).id
          : null,
        resolvedAt: report.resolvedAt ? new Date(report.resolvedAt) : null,
      }),
    ),
  );

  return {
    ...baseSeedCounts,
  };
};

const main = async () => {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }

  const result = await seedDatabase(AppDataSource);

  console.log(`Seeded database: ${AppDataSource.options.database}`);
  console.log(`Admin login: admin@example.com / ${DEMO_USER_PASSWORD}`);
  console.log(`User login: user@example.com / ${DEMO_USER_PASSWORD}`);
  console.log(
    `Created users=${result.users}, categories=${result.categories}, tags=${result.tags}, posts=${result.posts}, postTags=${result.postTags}, comments=${result.comments}, likes=${result.likes}, bookmarks=${result.bookmarks}, reports=${result.reports}, refreshTokens=${result.refreshTokens}`,
  );
};

void main()
  .catch((error) => {
    console.error('Failed to seed the database.', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  });
