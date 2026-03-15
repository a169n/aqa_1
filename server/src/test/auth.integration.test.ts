import { api, authHeader, registerUser } from './helpers';

describe('Auth API', () => {
  it('promotes the first registered user to admin and returns a valid session', async () => {
    const { session } = await registerUser({
      name: 'Admin User',
      email: 'admin@example.com',
    });

    expect(session.user.role).toBe('admin');
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshToken).toBeTruthy();

    const meResponse = await api().get('/api/auth/me').set(authHeader(session.accessToken));

    expect(meResponse.status).toBe(200);
    expect(meResponse.body).toMatchObject({
      email: 'admin@example.com',
      role: 'admin',
    });
  });

  it('rejects duplicate registration attempts with 409', async () => {
    await registerUser({
      name: 'Repeat User',
      email: 'duplicate@example.com',
    });

    const duplicateResponse = await api().post('/api/auth/register').send({
      name: 'Repeat User',
      email: 'duplicate@example.com',
      password: 'Password123!',
    });

    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toContain('already exists');
  });

  it('rejects invalid login credentials with 401', async () => {
    await registerUser({
      name: 'Login User',
      email: 'login@example.com',
      password: 'Password123!',
    });

    const response = await api().post('/api/auth/login').send({
      email: 'login@example.com',
      password: 'wrong-password',
    });

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Invalid credentials.');
  });

  it('rotates refresh tokens and rejects reuse of a revoked token', async () => {
    const { session } = await registerUser({
      name: 'Refresh User',
      email: 'refresh@example.com',
    });

    const refreshResponse = await api().post('/api/auth/refresh').send({
      refreshToken: session.refreshToken,
    });

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.refreshToken).not.toBe(session.refreshToken);
    expect(refreshResponse.body.accessToken).toBeTruthy();

    const reusedTokenResponse = await api().post('/api/auth/refresh').send({
      refreshToken: session.refreshToken,
    });

    expect(reusedTokenResponse.status).toBe(401);
    expect(reusedTokenResponse.body.message).toContain('invalid or expired');
  });

  it('requires a valid access token for /auth/me', async () => {
    const missingTokenResponse = await api().get('/api/auth/me');
    expect(missingTokenResponse.status).toBe(401);
    expect(missingTokenResponse.body.message).toBe('Authentication required.');

    const invalidTokenResponse = await api()
      .get('/api/auth/me')
      .set(authHeader('not-a-real-token'));

    expect(invalidTokenResponse.status).toBe(401);
    expect(invalidTokenResponse.body.message).toBe('Invalid or expired access token.');
  });

  it('revokes refresh tokens during logout', async () => {
    const { session } = await registerUser({
      name: 'Logout User',
      email: 'logout@example.com',
    });

    const logoutResponse = await api().post('/api/auth/logout').send({
      refreshToken: session.refreshToken,
    });

    expect(logoutResponse.status).toBe(204);

    const refreshAfterLogoutResponse = await api().post('/api/auth/refresh').send({
      refreshToken: session.refreshToken,
    });

    expect(refreshAfterLogoutResponse.status).toBe(401);
    expect(refreshAfterLogoutResponse.body.message).toContain('invalid or expired');
  });
});
