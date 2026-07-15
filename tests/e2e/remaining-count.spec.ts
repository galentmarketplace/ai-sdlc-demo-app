import { test, expect } from '@playwright/test';

// DEMO-3 — live count of remaining (not-done) tasks, shown above the list.
// One area per acceptance criterion, role/label locators + the stable
// data-testid the feature exposes, web-first assertions, no arbitrary sleeps.

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

async function markDone(page, title: string) {
  await page.getByRole('button', { name: `Toggle ${title}` }).click();
  // toggle button relabels to "Undo" once the task is done — confirms the state flip.
  await expect(page.getByRole('button', { name: `Toggle ${title}` })).toHaveText('Undo');
}

const remaining = (page) => page.getByTestId('remaining-count');

test.describe('AC1 — a remaining count is visible reflecting not-done tasks', () => {
  test('the count element shows the number of not-done tasks', async ({ page }) => {
    await page.goto('/');

    // present and visible before any interaction
    await expect(remaining(page)).toBeVisible();

    await addTask(page, 'Buy milk');
    await addTask(page, 'Walk dog');

    await expect(remaining(page)).toHaveText('2 remaining');
  });
});

test.describe('AC2 — the count updates on add, complete/undo, and delete', () => {
  test('adding, toggling, and deleting keep the count current', async ({ page }) => {
    await page.goto('/');

    // add → 1, then 2
    await addTask(page, 'Buy milk');
    await expect(remaining(page)).toHaveText('1 remaining');
    await addTask(page, 'Walk dog');
    await expect(remaining(page)).toHaveText('2 remaining');

    // complete one → 1 remaining
    await markDone(page, 'Buy milk');
    await expect(remaining(page)).toHaveText('1 remaining');

    // undo it → back to 2 remaining
    await page.getByRole('button', { name: 'Toggle Buy milk' }).click();
    await expect(page.getByRole('button', { name: 'Toggle Buy milk' })).toHaveText('Done');
    await expect(remaining(page)).toHaveText('2 remaining');

    // delete a not-done task → 1 remaining
    await page.getByRole('button', { name: 'Delete Walk dog' }).click();
    await expect(page.getByText('Walk dog', { exact: true })).toHaveCount(0);
    await expect(remaining(page)).toHaveText('1 remaining');
  });
});

test.describe('AC3 — no tasks, or all done, reads "0 remaining"', () => {
  test('empty list reads 0 remaining', async ({ page }) => {
    await page.goto('/');
    await expect(remaining(page)).toHaveText('0 remaining');
  });

  test('all tasks done reads 0 remaining', async ({ page }) => {
    await page.goto('/');

    await addTask(page, 'Buy milk');
    await addTask(page, 'Walk dog');
    await expect(remaining(page)).toHaveText('2 remaining');

    await markDone(page, 'Buy milk');
    await markDone(page, 'Walk dog');

    await expect(remaining(page)).toHaveText('0 remaining');
  });
});
