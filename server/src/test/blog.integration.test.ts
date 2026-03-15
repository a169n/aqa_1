import { api, authHeader, createPost, registerUser } from './helpers';

describe('Blog API', () => {
  it('blocks unauthenticated post, comment, and like mutations', async () => {
    const createPostResponse = await api().post('/api/posts').send({
      title: 'Blocked Post',
      content: 'Guests should not create posts.',
    });
    const commentResponse = await api().post('/api/posts/1/comments').send({
      content: 'Guests should not comment.',
    });
    const likeResponse = await api().post('/api/posts/1/likes');

    expect(createPostResponse.status).toBe(401);
    expect(commentResponse.status).toBe(401);
    expect(likeResponse.status).toBe(401);
  });

  it('allows an author to create, update, and delete their own post', async () => {
    const { session } = await registerUser({
      name: 'Author',
      email: 'author@example.com',
    });
    const post = await createPost(session.accessToken, {
      title: 'Original Title',
      content: 'Original content',
    });

    const updateResponse = await api()
      .put(`/api/posts/${post.id}`)
      .set(authHeader(session.accessToken))
      .send({
        title: 'Updated Title',
        content: 'Updated content',
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      id: post.id,
      title: 'Updated Title',
      content: 'Updated content',
    });

    const deleteResponse = await api()
      .delete(`/api/posts/${post.id}`)
      .set(authHeader(session.accessToken));

    expect(deleteResponse.status).toBe(204);

    const getDeletedPostResponse = await api().get(`/api/posts/${post.id}`);
    expect(getDeletedPostResponse.status).toBe(404);
  });

  it('prevents non-authors from managing posts while still allowing admins to moderate them', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Platform Admin',
      email: 'admin@example.com',
    });
    const { session: authorSession } = await registerUser({
      name: 'Author',
      email: 'author@example.com',
    });
    const { session: outsiderSession } = await registerUser({
      name: 'Outsider',
      email: 'outsider@example.com',
    });
    const post = await createPost(authorSession.accessToken, {
      title: 'Protected Post',
      content: 'Only the author or an admin should manage this.',
    });

    const forbiddenUpdateResponse = await api()
      .put(`/api/posts/${post.id}`)
      .set(authHeader(outsiderSession.accessToken))
      .send({
        title: 'Hijacked Title',
        content: 'Hijacked content',
      });

    const forbiddenDeleteResponse = await api()
      .delete(`/api/posts/${post.id}`)
      .set(authHeader(outsiderSession.accessToken));

    expect(forbiddenUpdateResponse.status).toBe(403);
    expect(forbiddenDeleteResponse.status).toBe(403);

    const adminDeleteResponse = await api()
      .delete(`/api/posts/${post.id}`)
      .set(authHeader(adminSession.accessToken));

    expect(adminDeleteResponse.status).toBe(204);
  });

  it('validates comment content and returns 404 for missing comments', async () => {
    const { session } = await registerUser({
      name: 'Commenter',
      email: 'commenter@example.com',
    });
    const post = await createPost(session.accessToken, {
      title: 'Comment Target',
      content: 'Waiting for discussion.',
    });

    const emptyCommentResponse = await api()
      .post(`/api/posts/${post.id}/comments`)
      .set(authHeader(session.accessToken))
      .send({ content: '   ' });

    expect(emptyCommentResponse.status).toBe(400);
    expect(emptyCommentResponse.body.message).toBe('Comment content is required.');

    const validCommentResponse = await api()
      .post(`/api/posts/${post.id}/comments`)
      .set(authHeader(session.accessToken))
      .send({ content: 'A real comment.' });

    expect(validCommentResponse.status).toBe(201);
    expect(validCommentResponse.body.content).toBe('A real comment.');

    const deleteMissingCommentResponse = await api()
      .delete('/api/posts/comments/999')
      .set(authHeader(session.accessToken));

    expect(deleteMissingCommentResponse.status).toBe(404);
    expect(deleteMissingCommentResponse.body.message).toBe('Comment not found.');
  });

  it('prevents duplicate likes and returns 404 when removing a missing like', async () => {
    const { session: authorSession } = await registerUser({
      name: 'Author',
      email: 'like-author@example.com',
    });
    const { session: likerSession } = await registerUser({
      name: 'Liker',
      email: 'liker@example.com',
    });
    const post = await createPost(authorSession.accessToken, {
      title: 'Like Target',
      content: 'Try liking this once.',
    });

    const firstLikeResponse = await api()
      .post(`/api/posts/${post.id}/likes`)
      .set(authHeader(likerSession.accessToken));

    expect(firstLikeResponse.status).toBe(201);

    const duplicateLikeResponse = await api()
      .post(`/api/posts/${post.id}/likes`)
      .set(authHeader(likerSession.accessToken));

    expect(duplicateLikeResponse.status).toBe(409);
    expect(duplicateLikeResponse.body.message).toBe('You have already liked this post.');

    const unlikeResponse = await api()
      .delete(`/api/posts/${post.id}/likes`)
      .set(authHeader(likerSession.accessToken));

    expect(unlikeResponse.status).toBe(204);

    const missingLikeResponse = await api()
      .delete(`/api/posts/${post.id}/likes`)
      .set(authHeader(likerSession.accessToken));

    expect(missingLikeResponse.status).toBe(404);
    expect(missingLikeResponse.body.message).toBe('Like not found.');
  });
});
