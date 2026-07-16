import { test, expect } from '@playwright/test';

// DEMO-1 — a user can edit a task's title in place. One describe/test area per
// acceptance criterion, role/label locators, web-first assertions, no sleeps.

// The app keeps a single in-memory task list; start every test from a clean slate.
test.beforeEach(async ({ request }) => {
  const tasks = await (await request.get('/api/tasks')).json();
  for (const t of tasks) await request.delete(`/api/tasks/${t.id}`);
});

async function addTask(page, title: string) {
  await page.getByLabel('New task').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

test.describe('AC1 — a user can edit a task title', () => {
  test('editing a task shows the updated title in the list', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'Buy milkk');

    await page.getByRole('button', { name: 'Edit Buy milkk' }).click();
    const editInput = page.getByTestId('edit-input');
    await expect(editInput).toBeVisible();
    await editInput.fill('Buy milk');
    await page.getByRole('button', { name: 'Save Buy milkk' }).click();

    // Updated title shown; the old title is gone and exactly one row remains.
    await expect(page.getByText('Buy milk', { exact: true })).toBeVisible();
    await expect(page.getByText('Buy milkk', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('task')).toHaveCount(1);
    // Edit control re-exposed with the new accessible name.
    await expect(page.getByRole('button', { name: 'Edit Buy milk' })).toBeVisible();
  });
});

test.describe('AC2 — an empty title is rejected', () => {
  test('saving a whitespace-only title keeps the original and shows a message', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'Keep me');

    await page.getByRole('button', { name: 'Edit Keep me' }).click();
    await page.getByTestId('edit-input').fill('   ');
    await page.getByRole('button', { name: 'Save Keep me' }).click();

    // Rejected: validation message shown and the edit is not committed — the
    // form stays open for correction rather than replacing the title.
    await expect(page.getByRole('alert')).toHaveText(/required/i);
    await expect(page.getByTestId('edit-input')).toBeVisible();

    // Cancelling restores the row: the original title is intact, never lost.
    await page.getByRole('button', { name: 'Cancel editing Keep me' }).click();
    await expect(page.getByText('Keep me', { exact: true })).toBeVisible();
    await expect(page.getByTestId('task')).toHaveCount(1);
  });
});

test.describe('AC3 — editing one task does not change any other', () => {
  test('other tasks keep their titles when one is edited', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'First');
    await addTask(page, 'Second');
    await addTask(page, 'Third');

    await page.getByRole('button', { name: 'Edit Second' }).click();
    await page.getByTestId('edit-input').fill('Second edited');
    await page.getByRole('button', { name: 'Save Second' }).click();

    await expect(page.getByText('Second edited', { exact: true })).toBeVisible();
    await expect(page.getByText('First', { exact: true })).toBeVisible();
    await expect(page.getByText('Third', { exact: true })).toBeVisible();
    await expect(page.getByText('Second', { exact: true })).toHaveCount(0);
    await expect(page.getByTestId('task')).toHaveCount(3);
  });
});
