import { POST_STATUSES } from '../constants/post-status';
import { REPORT_STATUSES } from '../constants/report-status';
import { USER_ROLES } from '../constants/roles';

export const DEMO_USER_PASSWORD = 'Password123!';

export const seedUsers = [
  {
    key: 'admin',
    email: 'admin@example.com',
    name: 'Platform Admin',
    role: USER_ROLES.ADMIN,
  },
  {
    key: 'user',
    email: 'user@example.com',
    name: 'Demo User',
    role: USER_ROLES.USER,
  },
  {
    key: 'editor',
    email: 'editor@example.com',
    name: 'Editorial Contributor',
    role: USER_ROLES.USER,
  },
  {
    key: 'reader',
    email: 'reader@example.com',
    name: 'Avid Reader',
    role: USER_ROLES.USER,
  },
] as const;

export const seedCategories = [
  { key: 'engineering', name: 'Engineering', slug: 'engineering' },
  { key: 'product', name: 'Product', slug: 'product' },
  { key: 'community', name: 'Community', slug: 'community' },
] as const;

export const seedTags = [
  { key: 'typescript', name: 'TypeScript', slug: 'typescript' },
  { key: 'backend', name: 'Backend', slug: 'backend' },
  { key: 'frontend', name: 'Frontend', slug: 'frontend' },
  { key: 'testing', name: 'Testing', slug: 'testing' },
  { key: 'culture', name: 'Culture', slug: 'culture' },
] as const;

export const seedPosts = [
  {
    key: 'release-pipeline',
    title: 'Shipping Smaller Releases With Better Signals',
    content:
      'We tightened the deployment loop by pairing incremental rollouts with clearer observability. Smaller changes made post-release debugging faster and incident scope smaller.',
    excerpt: 'How the team moved from risky bulk releases to a calmer shipping cadence.',
    status: POST_STATUSES.PUBLISHED,
    authorKey: 'admin',
    categoryKey: 'engineering',
    tagKeys: ['typescript', 'backend', 'testing'],
    publishedAt: '2026-01-12T09:00:00.000Z',
    archivedAt: null,
  },
  {
    key: 'research-handbook',
    title: 'A Practical Research Handbook For Product Decisions',
    content:
      'Short discovery cycles and visible assumptions helped us move faster without pretending every question needed a long-form study. The team documented hypotheses before building.',
    excerpt: 'A lightweight process for collecting evidence before product bets harden.',
    status: POST_STATUSES.PUBLISHED,
    authorKey: 'user',
    categoryKey: 'product',
    tagKeys: ['frontend', 'testing'],
    publishedAt: '2026-01-17T11:30:00.000Z',
    archivedAt: null,
  },
  {
    key: 'editorial-calendar',
    title: 'Running An Editorial Calendar Without Burning Out The Team',
    content:
      'A stable publishing rhythm came from fewer priorities, clearer ownership, and earlier draft reviews. We now treat review load as a planning input instead of an afterthought.',
    excerpt: 'Lessons from balancing cadence, review quality, and contributor energy.',
    status: POST_STATUSES.PUBLISHED,
    authorKey: 'editor',
    categoryKey: 'community',
    tagKeys: ['culture', 'frontend'],
    publishedAt: '2026-01-24T08:15:00.000Z',
    archivedAt: null,
  },
  {
    key: 'draft-observability',
    title: 'Draft: Observability Notes For The Next API Iteration',
    content:
      'This draft captures open questions around tracing, latency budgets, and alert ownership before the next backend refactor begins.',
    excerpt: 'Open working notes for the next observability pass.',
    status: POST_STATUSES.DRAFT,
    authorKey: 'admin',
    categoryKey: 'engineering',
    tagKeys: ['backend', 'testing'],
    publishedAt: null,
    archivedAt: null,
  },
  {
    key: 'archived-retrospective',
    title: 'Archived: What Our First Community Launch Taught Us',
    content:
      'The original launch plan was ambitious but uneven. This archived post is still useful as a record of what worked, what created confusion, and what the team changed afterwards.',
    excerpt: 'A historical look at the first community launch and its follow-up fixes.',
    status: POST_STATUSES.ARCHIVED,
    authorKey: 'reader',
    categoryKey: 'community',
    tagKeys: ['culture'],
    publishedAt: '2025-12-15T10:00:00.000Z',
    archivedAt: '2026-02-03T16:45:00.000Z',
  },
] as const;

export const seedComments = [
  {
    key: 'comment-release-admin',
    postKey: 'release-pipeline',
    authorKey: 'user',
    content: 'The rollout checklist example is useful. We should reuse that in onboarding.',
  },
  {
    key: 'comment-release-editor',
    postKey: 'release-pipeline',
    authorKey: 'editor',
    content: 'Smaller releases also made content updates easier to coordinate with engineering.',
  },
  {
    key: 'comment-research-reader',
    postKey: 'research-handbook',
    authorKey: 'reader',
    content: 'Documenting assumptions up front would have saved us several rounds of rework.',
  },
  {
    key: 'comment-research-admin',
    postKey: 'research-handbook',
    authorKey: 'admin',
    content: 'The framework feels good because it is small enough to repeat every sprint.',
  },
  {
    key: 'comment-calendar-user',
    postKey: 'editorial-calendar',
    authorKey: 'user',
    content: 'The point about review load being a planning input is exactly right.',
  },
  {
    key: 'comment-calendar-reader',
    postKey: 'editorial-calendar',
    authorKey: 'reader',
    content: 'Weekly drafts with early review would help our side projects too.',
  },
] as const;

export const seedLikes = [
  { postKey: 'release-pipeline', userKey: 'user' },
  { postKey: 'release-pipeline', userKey: 'editor' },
  { postKey: 'research-handbook', userKey: 'admin' },
  { postKey: 'research-handbook', userKey: 'reader' },
  { postKey: 'editorial-calendar', userKey: 'admin' },
  { postKey: 'editorial-calendar', userKey: 'user' },
  { postKey: 'archived-retrospective', userKey: 'admin' },
] as const;

export const seedBookmarks = [
  { postKey: 'release-pipeline', userKey: 'reader' },
  { postKey: 'research-handbook', userKey: 'editor' },
  { postKey: 'editorial-calendar', userKey: 'user' },
] as const;

export const seedReports = [
  {
    reporterKey: 'reader',
    commentKey: 'comment-release-editor',
    reason: 'The example mentions an internal process that should stay private.',
    status: REPORT_STATUSES.OPEN,
    resolutionNote: null,
    resolvedByKey: null,
    resolvedAt: null,
  },
] as const;

export const seedRefreshTokens = [
  {
    userKey: 'admin',
    tokenId: 'seed-admin-token',
    expiresAt: '2026-12-31T23:59:59.000Z',
    revokedAt: null,
  },
  {
    userKey: 'user',
    tokenId: 'seed-user-token',
    expiresAt: '2026-12-31T23:59:59.000Z',
    revokedAt: null,
  },
  {
    userKey: 'editor',
    tokenId: 'seed-editor-token',
    expiresAt: '2026-10-01T08:00:00.000Z',
    revokedAt: '2026-02-15T12:00:00.000Z',
  },
  {
    userKey: 'reader',
    tokenId: 'seed-reader-token',
    expiresAt: '2026-11-15T09:30:00.000Z',
    revokedAt: null,
  },
] as const;

export const baseSeedCounts = {
  users: seedUsers.length,
  categories: seedCategories.length,
  tags: seedTags.length,
  posts: seedPosts.length,
  postTags: seedPosts.reduce((total, post) => total + post.tagKeys.length, 0),
  comments: seedComments.length,
  likes: seedLikes.length,
  bookmarks: seedBookmarks.length,
  reports: seedReports.length,
  refreshTokens: seedRefreshTokens.length,
} as const;
