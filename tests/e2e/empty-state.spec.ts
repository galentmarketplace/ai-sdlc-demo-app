import { test, expect } from '@playwright/test';

// DEMO-2 — friendly empty state for the task list. One describe/test area per
// acceptance criterion, role/label + data-testid locators, web-first assertions,
// no arbitrary sleeps.

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

test.describe('AC1 — empty list shows the empty-state message', () => {
  test('with no tasks, a visible empty-state element with friendly copy is shown', async ({ page }) => {
    await page.goto('/');

    const emptyState = page.getByTestId('empty-state');
    await expect(emptyState).toBeVisible();
    await expect(emptyState).toHaveText(/no tasks yet/i);
    // Sanity: the list really is empty.
    await expect(page.getByTestId('task')).toHaveCount(0);
  });
});

test.describe('AC2 — empty-state hidden once a task exists', () => {
  test('adding a task hides the empty-state message', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('empty-state')).toBeVisible();

    await addTask(page, 'Buy milk');

    await expect(page.getByTestId('empty-state')).toBeHidden();
    await expect(page.getByTestId('task')).toHaveCount(1);
  });
});

test.describe('AC3 — deleting the last task brings the empty-state back', () => {
  test('empty-state reappears after the last remaining task is deleted', async ({ page }) => {
    await page.goto('/');
    await addTask(page, 'Only task');
    await expect(page.getByTestId('empty-state')).toBeHidden();

    await page.getByRole('button', { name: 'Delete Only task' }).click();

    await expect(page.getByTestId('task')).toHaveCount(0);
    await expect(page.getByTestId('empty-state')).toBeVisible();
  });
});
