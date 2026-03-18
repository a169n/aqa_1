export const POST_STATUSES = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export type PostStatus = (typeof POST_STATUSES)[keyof typeof POST_STATUSES];
