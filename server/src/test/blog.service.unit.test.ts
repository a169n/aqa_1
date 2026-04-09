import { POST_STATUSES } from '../constants/post-status';
import { resolvePostVisibilityScope } from '../services/blog.service';
import type { AuthenticatedUser } from '../types/auth';

const regularUser: AuthenticatedUser = {
  avatarUrl: null,
  email: 'reader@example.com',
  id: 7,
  name: 'Reader',
  role: 'user',
};

describe('blog.service unit logic', () => {
  it('falls back to published-only scope when a non-admin requests draft posts for another author', () => {
    const scope = resolvePostVisibilityScope(
      {
        authorId: '99',
        status: POST_STATUSES.DRAFT,
      },
      regularUser,
    );

    expect(scope).toEqual({
      authorId: 99,
      status: POST_STATUSES.PUBLISHED,
    });
  });
});
