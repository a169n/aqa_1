import { AppDataSource } from '../config/data-source';
import { RefreshToken } from '../models/refresh-token.entity';
import { api, authHeader, registerUser } from './helpers';

describe('Auth API', () => {
  it('promotes the first registered user to admin and returns a valid session', async () => {
    const { session } = await registerUser({
      name: 'Admin User',
      email: 'admin@example.com',
    });

    expect(session.user.role).toBe('admin');
    expect(session.accessToken).toBeTruthy();
    expect(session.refreshCookie).toContain('inkwell_refresh_token=');

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

    const refreshResponse = await api()
      .post('/api/auth/refresh')
      .set('Cookie', session.refreshCookie);

    expect(refreshResponse.status).toBe(200);
    expect(refreshResponse.body.accessToken).toBeTruthy();
    expect(refreshResponse.body.refreshToken).toBeUndefined();
    const rotatedRefreshCookie = refreshResponse.headers['set-cookie']?.find((cookie: string) =>
      cookie.startsWith('inkwell_refresh_token='),
    );

    expect(rotatedRefreshCookie).toBeTruthy();
    expect(rotatedRefreshCookie).not.toBe(session.refreshCookie);

    const reusedTokenResponse = await api()
      .post('/api/auth/refresh')
      .set('Cookie', session.refreshCookie);

    expect(reusedTokenResponse.status).toBe(401);
    expect(reusedTokenResponse.body.message).toContain('invalid or expired');
  });

  it('rejects refresh requests without a refresh cookie', async () => {
    const response = await api().post('/api/auth/refresh');

    expect(response.status).toBe(400);
    expect(response.body.message).toBe('Refresh token is required.');
  });

  it('rejects expired refresh tokens with 401', async () => {
    const { session } = await registerUser({
      name: 'Expired Refresh User',
      email: 'expired-refresh@example.com',
    });
    const refreshTokenRepository = AppDataSource.getRepository(RefreshToken);
    const refreshToken = await refreshTokenRepository.findOneByOrFail({
      userId: session.user.id,
    });

    refreshToken.expiresAt = new Date(Date.now() - 60_000);
    await refreshTokenRepository.save(refreshToken);

    const response = await api().post('/api/auth/refresh').set('Cookie', session.refreshCookie);

    expect(response.status).toBe(401);
    expect(response.body.message).toBe('Refresh token is invalid or expired.');
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

    const logoutResponse = await api()
      .post('/api/auth/logout')
      .set('Cookie', session.refreshCookie);

    expect(logoutResponse.status).toBe(204);
    expect(logoutResponse.headers['set-cookie']?.[0]).toContain('inkwell_refresh_token=;');

    const refreshAfterLogoutResponse = await api()
      .post('/api/auth/refresh')
      .set('Cookie', session.refreshCookie);

    expect(refreshAfterLogoutResponse.status).toBe(401);
    expect(refreshAfterLogoutResponse.body.message).toContain('invalid or expired');
  });
});
