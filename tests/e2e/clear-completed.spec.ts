import { test, expect } from '@playwright/test';

// DEMO-2 — clear all completed tasks. One area per acceptance criterion,
// role/label locators, web-first assertions, no arbitrary sleeps.

// The app keeps a single in-memory task list; start every test from a clean slate.
test.beforeEach(async ({ request }) => {
  const tasks = await (await request.get('/api/tasks')).json();
  for (const t of tasks) await request.delete(`/api/tasks/${t.id}`);
});

async function addTask(page, title: string) {
  await page.getByLabel('New task').fill(title);
  await page.getByRole('button', { name: 'Add' }).click();
  // exact match: getByText is a case-insensitive substring match, so a bare
  // getByText('Buy milk') could also collide with other rows/labels.
  await expect(page.getByText(title, { exact: true })).toBeVisible();
}

async function markDone(page, title: string) {
  await page.getByRole('button', { name: `Toggle ${title}` }).click();
  // toggle button relabels to "Undo" once the task is done — confirms the state flip.
  await expect(page.getByRole('button', { name: `Toggle ${title}` })).toHaveText('Undo');
}

test.describe('AC1 — Clear completed control removes all done tasks', () => {
  test('a visible "Clear completed" control clears every done task', async ({ page }) => {
    await page.goto('/');

    // control is present and visible before any interaction
    await expect(page.getByRole('button', { name: 'Clear completed' })).toBeVisible();

    await addTask(page, 'Keep A');
    await addTask(page, 'Done B');
    await addTask(page, 'Done C');
    await markDone(page, 'Done B');
    await markDone(page, 'Done C');

    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(page.getByText('Done B', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Done C', { exact: true })).toHaveCount(0);
  });
});

test.describe('AC2 — not-done tasks remain after clearing', () => {
  test('tasks that are not done are left in the list', async ({ page }) => {
    await page.goto('/');

    await addTask(page, 'Keep A');
    await addTask(page, 'Done B');
    await addTask(page, 'Keep C');
    await markDone(page, 'Done B');

    await page.getByRole('button', { name: 'Clear completed' }).click();

    await expect(page.getByText('Done B', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Keep A', { exact: true })).toBeVisible();
    await expect(page.getByText('Keep C', { exact: true })).toBeVisible();
    await expect(page.getByTestId('task')).toHaveCount(2);
  });
});

test.describe('AC3 — clearing with no completed tasks is a harmless no-op', () => {
  test('clicking Clear completed with nothing done changes nothing and raises no error', async ({ page }) => {
    await page.goto('/');

    await addTask(page, 'Keep A');
    await addTask(page, 'Keep B');

    await page.getByRole('button', { name: 'Clear completed' }).click();

    // list is unchanged and the error region stays empty
    await expect(page.getByTestId('task')).toHaveCount(2);
    await expect(page.getByText('Keep A', { exact: true })).toBeVisible();
    await expect(page.getByText('Keep B', { exact: true })).toBeVisible();
    await expect(page.getByRole('alert')).toHaveText('');
  });
});
