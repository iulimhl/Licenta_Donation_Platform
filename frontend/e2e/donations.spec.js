import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';
import { Buffer } from 'node:buffer';

const apiURL = 'http://127.0.0.1:8001';
const password = 'DonationBrowser123!';
const photo = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=',
  'base64',
);

async function createAccount(request, name) {
  const email = `e2e-${randomUUID()}@example.invalid`;
  const response = await request.post(`${apiURL}/auth/register`, {
    data: { email, password, name, user_type: 'user', phone: '0700000000' },
  });
  expect(response.ok()).toBeTruthy();
  return { ...await response.json(), email, password };
}

async function login(page, account) {
  await page.addInitScript(() => localStorage.setItem('language', 'en'));
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill(account.email);
  await page.getByLabel('Password', { exact: true }).fill(account.password);
  await page.getByRole('button', { name: 'Log in', exact: true }).click();
  await expect(page).toHaveURL('/');
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
}

test('user can log in, reload the page and log out', async ({ page, request }) => {
  const account = await createAccount(request, 'Browser donor');

  await login(page, account);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Logout', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await expect(page).toHaveURL('/login');
  await page.goto('/postdonation');
  await expect(page).toHaveURL('/login');
});

test('donor can publish a donation with a photo', async ({ page, request }) => {
  const account = await createAccount(request, 'Publishing donor');
  const title = `Carti pentru copii ${randomUUID().slice(0, 8)}`;
  await login(page, account);
  await page.goto('/postdonation');
  await page.getByLabel('Title *', { exact: true }).fill(title);
  await page.getByLabel('Location *', { exact: true }).fill('Iasi, Copou');
  await page.getByLabel('Category *', { exact: true }).selectOption('education');
  await page.getByLabel('Description', { exact: true }).fill('Carti in stare buna, pentru copii.');
  await page.getByLabel('Item Photos *', { exact: true }).setInputFiles({
    name: 'donation.png', mimeType: 'image/png', buffer: photo,
  });
  await expect(page.getByAltText('Preview 0')).toBeVisible();

  const createdResponse = page.waitForResponse(response =>
    response.url() === `${apiURL}/donations/` && response.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Post Donation', exact: true }).click();
  const response = await createdResponse;

  expect(response.ok()).toBeTruthy();
  const donation = await response.json();
  await expect(page).toHaveURL('/donations');
  await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
  const saved = await request.get(`${apiURL}/donations/${donation.id}`);
  expect(saved.ok()).toBeTruthy();
  expect(await saved.json()).toMatchObject({ title, category: 'education', owner_email: account.email });
});

test('another user can reserve and cancel a donation', async ({ page, request }) => {
  const donor = await createAccount(request, 'Reservation donor');
  const recipient = await createAccount(request, 'Reservation recipient');
  const created = await request.post(`${apiURL}/donations/`, {
    headers: { Authorization: `Bearer ${donor.auth_token}` },
    data: {
      title: 'Haine pentru copii', location: 'Iasi', category: 'clothes',
      image: JSON.stringify([`data:image/png;base64,${photo.toString('base64')}`]),
    },
  });
  expect(created.ok()).toBeTruthy();
  const donation = await created.json();
  await login(page, recipient);
  await page.goto(`/donation/${donation.id}`);

  await page.getByRole('button', { name: 'Reserve item', exact: true }).click();

  await expect(page.getByRole('button', { name: 'Cancel reservation', exact: true })).toBeVisible();
  const reserved = await request.get(`${apiURL}/donations/${donation.id}`);
  expect(await reserved.json()).toMatchObject({ status: 'reserved', reserved_by_email: recipient.email });
  await page.reload();
  await page.getByRole('button', { name: 'Cancel reservation', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Reserve item', exact: true })).toBeVisible();
  const available = await request.get(`${apiURL}/donations/${donation.id}`);
  expect(await available.json()).toMatchObject({ status: 'available', reserved_by_email: null });
});
