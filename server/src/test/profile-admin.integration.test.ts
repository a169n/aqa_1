import { existsSync } from 'node:fs';
import path from 'node:path';
import { api, authHeader, createPost, registerUser } from './helpers';

describe('Profile and admin API', () => {
  it('requires authentication and admin privileges for admin routes', async () => {
    await registerUser({
      name: 'Admin User',
      email: 'admin@example.com',
    });
    const { session: userSession } = await registerUser({
      name: 'Regular User',
      email: 'user@example.com',
    });

    const unauthenticatedResponse = await api().get('/api/admin/users');
    expect(unauthenticatedResponse.status).toBe(401);

    const forbiddenResponse = await api()
      .get('/api/admin/users')
      .set(authHeader(userSession.accessToken));

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.message).toBe('Admin access required.');
  });

  it('rejects duplicate emails during profile updates', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Admin User',
      email: 'admin@example.com',
    });
    await registerUser({
      name: 'Existing User',
      email: 'existing@example.com',
    });

    const response = await api()
      .put('/api/user/profile')
      .set(authHeader(adminSession.accessToken))
      .send({
        name: 'Admin User',
        email: 'existing@example.com',
      });

    expect(response.status).toBe(409);
    expect(response.body.message).toBe('Another user already uses this email.');
  });

  it('returns a profile summary and accepts a unique profile update', async () => {
    const { session } = await registerUser({
      name: 'Profile Owner',
      email: 'profile-owner@example.com',
    });
    const post = await createPost(session.accessToken, {
      title: 'Profile Post',
      content: 'Content attached to the profile summary.',
    });

    const commentResponse = await api()
      .post(`/api/posts/${post.id}/comments`)
      .set(authHeader(session.accessToken))
      .send({ content: 'Profile comment' });

    expect(commentResponse.status).toBe(201);

    const getProfileResponse = await api()
      .get('/api/user/profile')
      .set(authHeader(session.accessToken));

    expect(getProfileResponse.status).toBe(200);
    expect(getProfileResponse.body.posts).toHaveLength(1);
    expect(getProfileResponse.body.comments).toHaveLength(1);

    const updateProfileResponse = await api()
      .put('/api/user/profile')
      .set(authHeader(session.accessToken))
      .send({
        name: 'Profile Owner Updated',
        email: 'profile-owner-updated@example.com',
      });

    expect(updateProfileResponse.status).toBe(200);
    expect(updateProfileResponse.body).toMatchObject({
      name: 'Profile Owner Updated',
      email: 'profile-owner-updated@example.com',
    });
  });

  it('uploads a valid avatar and persists the returned file path', async () => {
    const { session } = await registerUser({
      name: 'Avatar User',
      email: 'avatar@example.com',
    });
    const avatarBuffer = Buffer.from('avatar-image');

    const response = await api()
      .post('/api/user/profile/avatar')
      .set(authHeader(session.accessToken))
      .attach('avatar', avatarBuffer, {
        filename: 'avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(200);
    expect(response.body.avatarUrl).toMatch(/^\/uploads\/avatars\/.+\.png$/);

    const avatarFileName = path.basename(response.body.avatarUrl);
    const avatarFilePath = path.resolve(
      process.cwd(),
      process.env.UPLOAD_DIR!,
      'avatars',
      avatarFileName,
    );

    expect(existsSync(avatarFilePath)).toBe(true);
  });

  it('rejects avatar uploads with unsupported mime types', async () => {
    const { session } = await registerUser({
      name: 'Unsupported Avatar User',
      email: 'unsupported-avatar@example.com',
    });

    const response = await api()
      .post('/api/user/profile/avatar')
      .set(authHeader(session.accessToken))
      .attach('avatar', Buffer.from('plain-text-avatar'), {
        filename: 'avatar.txt',
        contentType: 'text/plain',
      });

    expect(response.status).toBe(415);
    expect(response.body.message).toBe('Avatar image must be a PNG, JPEG, GIF, or WebP file.');
  });

  it('rejects avatar uploads when no file is attached', async () => {
    const { session } = await registerUser({
      name: 'Missing Avatar User',
      email: 'missing-avatar@example.com',
    });

    const response = await api()
      .post('/api/user/profile/avatar')
      .set(authHeader(session.accessToken));

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Avatar image is required.');
  });

  it('rejects avatar uploads larger than 5MB', async () => {
    const { session } = await registerUser({
      name: 'Large Avatar User',
      email: 'large-avatar@example.com',
    });
    const oversizedBuffer = Buffer.alloc(5 * 1024 * 1024 + 1, 1);

    const response = await api()
      .post('/api/user/profile/avatar')
      .set(authHeader(session.accessToken))
      .attach('avatar', oversizedBuffer, {
        filename: 'large-avatar.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(413);
    expect(response.body.message).toBe('Avatar image must be 5MB or smaller.');
  });

  it('lets admins inspect moderation data, update roles, and delete like records', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Admin User',
      email: 'admin-moderation@example.com',
    });
    const { session: memberSession } = await registerUser({
      name: 'Member User',
      email: 'member-moderation@example.com',
    });
    const post = await createPost(memberSession.accessToken, {
      title: 'Moderation Target',
      content: 'This post feeds the moderation dashboards.',
    });
    const commentResponse = await api()
      .post(`/api/posts/${post.id}/comments`)
      .set(authHeader(memberSession.accessToken))
      .send({ content: 'Moderation comment' });
    const likeResponse = await api()
      .post(`/api/posts/${post.id}/likes`)
      .set(authHeader(adminSession.accessToken));

    expect(commentResponse.status).toBe(201);
    expect(likeResponse.status).toBe(201);

    const usersResponse = await api()
      .get('/api/admin/users')
      .set(authHeader(adminSession.accessToken));
    const postsResponse = await api()
      .get('/api/admin/posts')
      .set(authHeader(adminSession.accessToken));
    const commentsResponse = await api()
      .get('/api/admin/comments')
      .set(authHeader(adminSession.accessToken));
    const likesResponse = await api()
      .get('/api/admin/likes')
      .set(authHeader(adminSession.accessToken));

    expect(usersResponse.status).toBe(200);
    expect(postsResponse.status).toBe(200);
    expect(commentsResponse.status).toBe(200);
    expect(likesResponse.status).toBe(200);
    expect(usersResponse.body).toHaveLength(2);
    expect(postsResponse.body).toHaveLength(1);
    expect(commentsResponse.body).toHaveLength(1);
    expect(likesResponse.body).toHaveLength(1);

    const roleUpdateResponse = await api()
      .put(`/api/admin/users/${memberSession.user.id}/role`)
      .set(authHeader(adminSession.accessToken))
      .send({ role: 'admin' });

    expect(roleUpdateResponse.status).toBe(200);
    expect(roleUpdateResponse.body.role).toBe('admin');

    const deleteLikeResponse = await api()
      .delete(`/api/admin/likes/${likesResponse.body[0].id}`)
      .set(authHeader(adminSession.accessToken));

    expect(deleteLikeResponse.status).toBe(204);
  });

  it('prevents deleting or demoting the last admin account', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Last Admin',
      email: 'last-admin@example.com',
    });
    await registerUser({
      name: 'Regular User',
      email: 'member@example.com',
    });

    const demotionResponse = await api()
      .put(`/api/admin/users/${adminSession.user.id}/role`)
      .set(authHeader(adminSession.accessToken))
      .send({ role: 'user' });

    const deleteResponse = await api()
      .delete(`/api/admin/users/${adminSession.user.id}`)
      .set(authHeader(adminSession.accessToken));

    expect(demotionResponse.status).toBe(400);
    expect(demotionResponse.body.message).toBe('The last admin cannot be demoted.');
    expect(deleteResponse.status).toBe(400);
    expect(deleteResponse.body.message).toBe('The last admin cannot be deleted.');
  });

  it('allows admins to delete a non-admin user account', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Admin User',
      email: 'admin-delete@example.com',
    });
    const { session: memberSession } = await registerUser({
      name: 'Member User',
      email: 'member-delete@example.com',
    });

    const deleteResponse = await api()
      .delete(`/api/admin/users/${memberSession.user.id}`)
      .set(authHeader(adminSession.accessToken));

    expect(deleteResponse.status).toBe(204);

    const usersResponse = await api()
      .get('/api/admin/users')
      .set(authHeader(adminSession.accessToken));

    expect(usersResponse.status).toBe(200);
    expect(usersResponse.body).toHaveLength(1);
  });
});
