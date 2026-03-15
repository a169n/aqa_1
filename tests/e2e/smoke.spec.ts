import { expect, test, type Page } from '@playwright/test';

const adminUser = {
  name: 'QA Admin',
  email: 'qa-admin@example.com',
  password: 'Password123!',
};

const smokePost = {
  title: `Smoke Test Story ${Date.now()}`,
  content:
    'This post is created by the Playwright smoke suite to validate the critical publishing flow.',
};

const loginAsAdmin = async (page: Page) => {
  await page.goto('/login');
  await page.locator('#login-email').fill(adminUser.email);
  await page.locator('#login-password').fill(adminUser.password);
  await page.getByRole('button', { name: 'Login' }).click();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
};

test.describe('Inkwell smoke flows', () => {
  test.describe.configure({ mode: 'serial' });

  test('registers the first user and reaches the authenticated state', async ({ page }) => {
    await page.goto('/register');

    await page.locator('#register-name').fill(adminUser.name);
    await page.locator('#register-email').fill(adminUser.email);
    await page.locator('#register-password').fill(adminUser.password);
    await page.getByRole('button', { name: 'Register' }).click();

    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Admin' })).toBeVisible();
    await expect(page.getByText(adminUser.email)).toBeVisible();
  });

  test('creates a post and shows it in both the detail view and feed', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Write', exact: true }).click();
    await page.getByLabel('Title').fill(smokePost.title);
    await page.getByLabel('Content').fill(smokePost.content);
    await page.getByRole('button', { name: 'Publish post' }).click();

    await expect(page.getByRole('heading', { name: smokePost.title })).toBeVisible();
    await expect(page.getByText(smokePost.content)).toBeVisible();

    await page.getByRole('link', { name: 'Feed' }).click();
    await expect(page.getByText(smokePost.title)).toBeVisible();
  });

  test('opens the admin dashboard for the admin user', async ({ page }) => {
    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Admin' }).click();

    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByText('Moderate the whole platform from one screen.')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'User management' })).toBeVisible();
  });
});
