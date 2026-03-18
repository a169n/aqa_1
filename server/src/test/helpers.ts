import request from 'supertest';
import { expect } from 'vitest';
import { app } from '../app';

export interface TestUser {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin';
  avatarUrl: string | null;
}

export interface TestSession {
  accessToken: string;
  refreshToken: string;
  user: TestUser;
}

export interface TestPost {
  id: number;
  title: string;
  content: string;
  status: 'draft' | 'published' | 'archived';
  excerpt: string | null;
  authorId: number;
  category: { id: number; name: string; slug: string } | null;
  tags: Array<{ id: number; name: string; slug: string }>;
  isBookmarked: boolean;
  publishedAt: string | null;
  archivedAt: string | null;
  commentsCount: number;
  likesCount: number;
}

let emailCounter = 0;

const nextEmail = () => `user-${Date.now()}-${emailCounter++}@example.com`;

export const api = () => request(app);

export const authHeader = (accessToken: string) => ({
  Authorization: `Bearer ${accessToken}`,
});

export const registerUser = async (
  overrides: Partial<{ name: string; email: string; password: string }> = {},
) => {
  const payload = {
    name: overrides.name ?? 'Test User',
    email: overrides.email ?? nextEmail(),
    password: overrides.password ?? 'Password123!',
  };

  const response = await api().post('/api/auth/register').send(payload);

  expect(response.status).toBe(201);

  return {
    payload,
    session: response.body as TestSession,
  };
};

export const loginUser = async (payload: { email: string; password: string }) => {
  const response = await api().post('/api/auth/login').send(payload);

  expect(response.status).toBe(200);

  return response.body as TestSession;
};

export const createPost = async (
  accessToken: string,
  overrides: Partial<{
    title: string;
    content: string;
    excerpt: string;
    categoryId: number | null;
    tagIds: number[];
    publish: boolean;
  }> = {},
) => {
  const payload = {
    title: overrides.title ?? 'Integration Test Post',
    content: overrides.content ?? 'This is a post created by the integration suite.',
    excerpt: overrides.excerpt,
    categoryId: overrides.categoryId,
    tagIds: overrides.tagIds,
  };

  const response = await api().post('/api/posts').set(authHeader(accessToken)).send(payload);

  expect(response.status).toBe(201);

  const createdPost = response.body as TestPost;

  if (overrides.publish === false) {
    return createdPost;
  }

  const publishResponse = await api()
    .post(`/api/posts/${createdPost.id}/publish`)
    .set(authHeader(accessToken));

  expect(publishResponse.status).toBe(200);

  return publishResponse.body as TestPost;
};
