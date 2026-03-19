import { expect, test, type Page } from '@playwright/test';

const adminUser = {
  name: 'QA Admin',
  email: 'qa-admin@example.com',
  password: 'Password123!',
};

const readerUser = {
  name: 'QA Reader',
  email: 'qa-reader@example.com',
  password: 'Password123!',
};

const smokePost = {
  title: `Editorial Flow Story ${Date.now()}`,
  content: 'This post validates draft/publish/archive/restore and moderation flows.',
  excerpt: 'Playwright editorial workflow validation.',
};

const register = async (page: Page, user: typeof adminUser) => {
  await page.goto('/register');
  await page.locator('#register-name').fill(user.name);
  await page.locator('#register-email').fill(user.email);
  await page.locator('#register-password').fill(user.password);
  await page.getByRole('button', { name: 'Register' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
};

const login = async (page: Page, user: typeof adminUser) => {
  await page.goto('/login');
  await page.locator('#login-email').fill(user.email);
  await page.locator('#login-password').fill(user.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
};

const logout = async (page: Page) => {
  await page.goto('/');
  const signOutButton = page.getByRole('button', { name: 'Sign out' });
  const signOutVisible = await signOutButton
    .first()
    .isVisible()
    .catch(() => false);

  if (signOutVisible) {
    await signOutButton.first().click();
  }

  await page.context().clearCookies();
  await page.evaluate(() => localStorage.clear());
  await expect(page.getByRole('link', { name: 'Login' }).first()).toBeVisible();
};

test.describe('Inkwell editorial smoke flows', () => {
  test.describe.configure({ mode: 'serial' });

  test('registers admin and creates category/tag in taxonomy', async ({ page }) => {
    await register(page, adminUser);
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();

    await page.goto('/admin/taxonomy');
    await page.getByPlaceholder('New category').fill('Playwright Category');
    await page.getByRole('button', { name: 'Add' }).first().click();
    await expect(page.getByText('Playwright Category')).toBeVisible();

    await page.getByPlaceholder('New tag').fill('Playwright Tag');
    await page.getByRole('button', { name: 'Add' }).nth(1).click();
    await expect(page.getByText('Playwright Tag')).toBeVisible();
  });

  test('creates draft then publish/archive/restore from workspace', async ({ page }) => {
    await login(page, adminUser);

    await page.goto('/posts/new');
    await page.getByLabel('Title').fill(smokePost.title);
    await page.getByLabel('Excerpt').fill(smokePost.excerpt);
    await page.getByLabel('Content').fill(smokePost.content);
    await page.getByRole('button', { name: 'Save draft' }).click();

    await expect(page.getByRole('heading', { name: smokePost.title })).toBeVisible();
    await expect(page.getByText('draft', { exact: true })).toBeVisible();

    await page.goto('/workspace');
    await page.getByRole('button', { name: 'Publish' }).first().click();
    await expect(page.getByRole('button', { name: 'Archive' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Archive' }).first().click();
    await expect(page.getByRole('button', { name: 'Restore to draft' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Restore to draft' }).first().click();
    await expect(page.getByRole('button', { name: 'Publish' }).first()).toBeVisible();

    await page.getByRole('button', { name: 'Publish' }).first().click();
    await page.goto('/');
    await expect(page.getByText(smokePost.title)).toBeVisible();
  });

  test('reader can bookmark and report post/comment', async ({ page }) => {
    await logout(page);
    await register(page, readerUser);

    await page.goto('/');
    await page.getByRole('link', { name: 'Read' }).first().click();

    await expect(page.getByRole('button', { name: 'Bookmark' })).toBeVisible();
    await page.getByRole('button', { name: 'Bookmark' }).click();
    await page.getByRole('button', { name: 'Report' }).click();

    await page.getByPlaceholder('Add your comment').fill('Playwright moderation comment');
    await page.getByRole('button', { name: 'Post comment' }).click();
    await page
      .locator('button')
      .filter({ has: page.locator('svg.lucide-flag') })
      .first()
      .click();

    await page.goto('/bookmarks');
    await expect(page.getByText(smokePost.title)).toBeVisible();
  });

  test('admin can review reports queue', async ({ page }) => {
    await logout(page);
    await login(page, adminUser);

    await page.goto('/admin/reports');
    await expect(page.getByText('Report queue')).toBeVisible();
    await expect(page.getByRole('table').getByText('open', { exact: true })).toBeVisible();
    const resolveButtons = page.getByRole('button', { name: 'Resolve' });
    const resolveCountBefore = await resolveButtons.count();
    expect(resolveCountBefore).toBeGreaterThan(0);

    await page.getByRole('button', { name: 'Resolve' }).first().click();
    await expect(resolveButtons).toHaveCount(resolveCountBefore - 1);
  });
});
