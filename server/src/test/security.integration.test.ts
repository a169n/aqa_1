import { api, registerUser } from './helpers';

describe('Security middleware', () => {
  it('adds hardened response headers and omits x-powered-by', async () => {
    const response = await api().get('/api/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['referrer-policy']).toBe('no-referrer');
    expect(response.headers['permissions-policy']).toBe('camera=(), geolocation=(), microphone=()');
    expect(response.headers['x-powered-by']).toBeUndefined();
  });

  it('marks auth responses as non-cacheable', async () => {
    await registerUser({
      name: 'Cached User',
      email: 'cached-user@example.com',
      password: 'Password123!',
    });

    const response = await api().post('/api/auth/login').send({
      email: 'cached-user@example.com',
      password: 'Password123!',
    });

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.headers.pragma).toBe('no-cache');
    expect(response.body.refreshToken).toBeUndefined();
  });

  it('throttles repeated auth attempts per client while keeping other clients unaffected', async () => {
    await registerUser({
      name: 'Rate Limited User',
      email: 'rate-limit@example.com',
      password: 'Password123!',
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await api()
        .post('/api/auth/login')
        .set('x-forwarded-for', '198.51.100.10')
        .send({
          email: 'rate-limit@example.com',
          password: 'wrong-password',
        });

      expect(response.status).toBe(401);
    }

    const throttledResponse = await api()
      .post('/api/auth/login')
      .set('x-forwarded-for', '198.51.100.10')
      .send({
        email: 'rate-limit@example.com',
        password: 'wrong-password',
      });

    expect(throttledResponse.status).toBe(429);
    expect(throttledResponse.body.message).toBe(
      'Too many authentication attempts. Try again later.',
    );
    expect(throttledResponse.headers['retry-after']).toBeTruthy();

    const otherClientResponse = await api()
      .post('/api/auth/login')
      .set('x-forwarded-for', '198.51.100.11')
      .send({
        email: 'rate-limit@example.com',
        password: 'wrong-password',
      });

    expect(otherClientResponse.status).toBe(401);
  });
});
