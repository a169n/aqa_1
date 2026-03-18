import { api, authHeader, createPost, registerUser } from './helpers';
import { describe, expect, it } from 'vitest';

describe('Editorial workspace API', () => {
  it('supports draft -> publish -> archive -> restore workflow', async () => {
    const { session } = await registerUser({
      name: 'Author',
      email: 'workspace-author@example.com',
    });

    const draft = await createPost(session.accessToken, {
      title: 'Workflow post',
      content: 'Draft lifecycle.',
      publish: false,
    });

    expect(draft.status).toBe('draft');

    const publishResponse = await api()
      .post(`/api/posts/${draft.id}/publish`)
      .set(authHeader(session.accessToken));
    expect(publishResponse.status).toBe(200);
    expect(publishResponse.body.status).toBe('published');

    const archiveResponse = await api()
      .post(`/api/posts/${draft.id}/archive`)
      .set(authHeader(session.accessToken));
    expect(archiveResponse.status).toBe(200);
    expect(archiveResponse.body.status).toBe('archived');

    const restoreResponse = await api()
      .post(`/api/posts/${draft.id}/restore`)
      .set(authHeader(session.accessToken));
    expect(restoreResponse.status).toBe(200);
    expect(restoreResponse.body.status).toBe('draft');
  });

  it('returns only published posts in the public feed and supports filters', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Admin',
      email: 'taxonomy-admin@example.com',
    });
    const { session: authorSession } = await registerUser({
      name: 'Filter Author',
      email: 'filter-author@example.com',
    });

    const categoryResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Engineering' });
    const tagResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'TypeScript' });

    expect(categoryResponse.status).toBe(201);
    expect(tagResponse.status).toBe(201);

    const publishedPost = await createPost(authorSession.accessToken, {
      title: 'Type-safe design',
      content: 'Published filter target.',
      categoryId: categoryResponse.body.id,
      tagIds: [tagResponse.body.id],
    });

    await createPost(authorSession.accessToken, {
      title: 'Hidden draft',
      content: 'This should not be public.',
      publish: false,
    });

    const publicFeedResponse = await api().get('/api/posts');
    expect(publicFeedResponse.status).toBe(200);
    expect(publicFeedResponse.body).toHaveLength(1);
    expect(publicFeedResponse.body[0].id).toBe(publishedPost.id);

    const filteredResponse = await api().get(
      `/api/posts?search=type-safe&categoryId=${categoryResponse.body.id}&tag=${tagResponse.body.slug}&authorId=${authorSession.user.id}`,
    );
    expect(filteredResponse.status).toBe(200);
    expect(filteredResponse.body).toHaveLength(1);
  });

  it('allows authenticated users to bookmark and report published content', async () => {
    const { session: authorSession } = await registerUser({
      name: 'Author',
      email: 'report-author@example.com',
    });
    const { session: readerSession } = await registerUser({
      name: 'Reader',
      email: 'report-reader@example.com',
    });

    const post = await createPost(authorSession.accessToken, {
      title: 'Reader target',
      content: 'Post to bookmark and report.',
    });

    const bookmarkResponse = await api()
      .post(`/api/posts/${post.id}/bookmarks`)
      .set(authHeader(readerSession.accessToken));
    expect(bookmarkResponse.status).toBe(201);

    const listBookmarksResponse = await api()
      .get('/api/bookmarks')
      .set(authHeader(readerSession.accessToken));
    expect(listBookmarksResponse.status).toBe(200);
    expect(listBookmarksResponse.body).toHaveLength(1);

    const commentResponse = await api()
      .post(`/api/posts/${post.id}/comments`)
      .set(authHeader(readerSession.accessToken))
      .send({ content: 'Needs moderation review.' });
    expect(commentResponse.status).toBe(201);

    const reportPostResponse = await api()
      .post('/api/reports')
      .set(authHeader(readerSession.accessToken))
      .send({ postId: post.id, reason: 'Post report test' });
    expect(reportPostResponse.status).toBe(201);

    const reportCommentResponse = await api()
      .post('/api/reports')
      .set(authHeader(readerSession.accessToken))
      .send({ commentId: commentResponse.body.id, reason: 'Comment report test' });
    expect(reportCommentResponse.status).toBe(201);
  });

  it('lets admins moderate reports and taxonomy records', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Admin',
      email: 'reports-admin@example.com',
    });
    const { session: authorSession } = await registerUser({
      name: 'Author',
      email: 'reports-author@example.com',
    });

    const categoryResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Culture' });
    const tagResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Essay' });

    expect(categoryResponse.status).toBe(201);
    expect(tagResponse.status).toBe(201);

    const post = await createPost(authorSession.accessToken, {
      title: 'Moderation target',
      content: 'Moderation review content.',
    });

    const reportResponse = await api()
      .post('/api/reports')
      .set(authHeader(authorSession.accessToken))
      .send({ postId: post.id, reason: 'Moderation queue test' });
    expect(reportResponse.status).toBe(201);

    const queueResponse = await api()
      .get('/api/admin/reports')
      .set(authHeader(adminSession.accessToken));
    expect(queueResponse.status).toBe(200);
    expect(queueResponse.body).toHaveLength(1);

    const resolveResponse = await api()
      .patch(`/api/admin/reports/${queueResponse.body[0].id}`)
      .set(authHeader(adminSession.accessToken))
      .send({ status: 'resolved', resolutionNote: 'Handled in moderation.' });
    expect(resolveResponse.status).toBe(200);
    expect(resolveResponse.body.status).toBe('resolved');

    const deleteCategoryResponse = await api()
      .delete(`/api/admin/categories/${categoryResponse.body.id}`)
      .set(authHeader(adminSession.accessToken));
    const deleteTagResponse = await api()
      .delete(`/api/admin/tags/${tagResponse.body.id}`)
      .set(authHeader(adminSession.accessToken));

    expect(deleteCategoryResponse.status).toBe(204);
    expect(deleteTagResponse.status).toBe(204);
  });
});
