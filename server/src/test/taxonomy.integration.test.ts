import { api, authHeader, registerUser } from './helpers';

describe('Taxonomy API', () => {
  it('lists, creates, updates, and deletes categories through the admin API', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Taxonomy Admin',
      email: 'taxonomy-admin@example.com',
    });

    const publicBeforeResponse = await api().get('/api/categories');
    expect(publicBeforeResponse.status).toBe(200);
    expect(publicBeforeResponse.body).toEqual([]);

    const createResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Quality Engineering' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: 'Quality Engineering',
      slug: 'quality-engineering',
    });

    const publicAfterResponse = await api().get('/api/categories');
    expect(publicAfterResponse.status).toBe(200);
    expect(publicAfterResponse.body).toHaveLength(1);
    expect(publicAfterResponse.body[0]).toMatchObject({
      name: 'Quality Engineering',
      slug: 'quality-engineering',
    });

    const updateResponse = await api()
      .put(`/api/admin/categories/${createResponse.body.id}`)
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Quality Assurance' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      name: 'Quality Assurance',
      slug: 'quality-assurance',
    });

    const deleteResponse = await api()
      .delete(`/api/admin/categories/${createResponse.body.id}`)
      .set(authHeader(adminSession.accessToken));

    expect(deleteResponse.status).toBe(204);
  });

  it('rejects invalid category names, duplicate categories, and missing category records', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Category Guard',
      email: 'category-guard@example.com',
    });

    const emptyNameResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: '   ' });
    expect(emptyNameResponse.status).toBe(400);
    expect(emptyNameResponse.body.message).toBe('Category name is required.');

    const invalidSlugResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: '!!!' });
    expect(invalidSlugResponse.status).toBe(400);
    expect(invalidSlugResponse.body.message).toBe('Category name must include letters or numbers.');

    const firstCategoryResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Duplicate Guard' });
    expect(firstCategoryResponse.status).toBe(201);

    const duplicateResponse = await api()
      .post('/api/admin/categories')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Duplicate Guard' });
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toBe('Category with this name already exists.');

    const missingUpdateResponse = await api()
      .put('/api/admin/categories/9999')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Missing Category' });
    expect(missingUpdateResponse.status).toBe(404);
    expect(missingUpdateResponse.body.message).toBe('Category not found.');

    const missingDeleteResponse = await api()
      .delete('/api/admin/categories/9999')
      .set(authHeader(adminSession.accessToken));
    expect(missingDeleteResponse.status).toBe(404);
    expect(missingDeleteResponse.body.message).toBe('Category not found.');
  });

  it('lists, creates, updates, and deletes tags through the admin API', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Tag Admin',
      email: 'tag-admin@example.com',
    });

    const publicBeforeResponse = await api().get('/api/tags');
    expect(publicBeforeResponse.status).toBe(200);
    expect(publicBeforeResponse.body).toEqual([]);

    const createResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Playwright' });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body).toMatchObject({
      name: 'Playwright',
      slug: 'playwright',
    });

    const publicAfterResponse = await api().get('/api/tags');
    expect(publicAfterResponse.status).toBe(200);
    expect(publicAfterResponse.body).toHaveLength(1);
    expect(publicAfterResponse.body[0]).toMatchObject({
      name: 'Playwright',
      slug: 'playwright',
    });

    const updateResponse = await api()
      .put(`/api/admin/tags/${createResponse.body.id}`)
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Test Automation' });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body).toMatchObject({
      name: 'Test Automation',
      slug: 'test-automation',
    });

    const deleteResponse = await api()
      .delete(`/api/admin/tags/${createResponse.body.id}`)
      .set(authHeader(adminSession.accessToken));

    expect(deleteResponse.status).toBe(204);
  });

  it('rejects invalid tag names, duplicate tags, and missing tag records', async () => {
    const { session: adminSession } = await registerUser({
      name: 'Tag Guard',
      email: 'tag-guard@example.com',
    });

    const emptyNameResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: '   ' });
    expect(emptyNameResponse.status).toBe(400);
    expect(emptyNameResponse.body.message).toBe('Tag name is required.');

    const invalidSlugResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: '!!!' });
    expect(invalidSlugResponse.status).toBe(400);
    expect(invalidSlugResponse.body.message).toBe('Tag name must include letters or numbers.');

    const firstTagResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Automation' });
    expect(firstTagResponse.status).toBe(201);

    const duplicateResponse = await api()
      .post('/api/admin/tags')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Automation' });
    expect(duplicateResponse.status).toBe(409);
    expect(duplicateResponse.body.message).toBe('Tag with this name already exists.');

    const missingUpdateResponse = await api()
      .put('/api/admin/tags/9999')
      .set(authHeader(adminSession.accessToken))
      .send({ name: 'Missing Tag' });
    expect(missingUpdateResponse.status).toBe(404);
    expect(missingUpdateResponse.body.message).toBe('Tag not found.');

    const missingDeleteResponse = await api()
      .delete('/api/admin/tags/9999')
      .set(authHeader(adminSession.accessToken));
    expect(missingDeleteResponse.status).toBe(404);
    expect(missingDeleteResponse.body.message).toBe('Tag not found.');
  });
});
