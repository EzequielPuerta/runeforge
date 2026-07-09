import { test, expect } from '@playwright/test';

const URL = '/test/crud-server';

test.describe('GenericCRUD (server pagination)', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	test('renders only the requested page, not the full 25-row dataset', async ({ page }) => {
		await expect(page.locator('tbody tr')).toHaveCount(5);
		await expect(page.locator('tbody')).toContainText('Alice 1');
		await expect(page.locator('tbody')).not.toContainText('Eve 25');
	});

	test('paginator navigates via the URL and shows the next page', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();

		await expect(page).toHaveURL(/page=2/);
		await expect(page.locator('tbody tr')).toHaveCount(5);
		await expect(page.locator('tbody')).toContainText('Alice 6');
		await expect(page.locator('tbody')).not.toContainText('Alice 1');
	});

	test('back/forward navigation restores the right page', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();
		await expect(page).toHaveURL(/page=2/);
		await pager.getByRole('button', { name: '3' }).click();
		await expect(page).toHaveURL(/page=3/);

		await page.goBack();
		await expect(page).toHaveURL(/page=2/);
		await expect(page.locator('tbody')).toContainText('Alice 6');

		await page.goForward();
		await expect(page).toHaveURL(/page=3/);
	});

	test('sorting writes ?ordering= and resets to page 1', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();
		await expect(page).toHaveURL(/page=2/);

		// First click sorts descending (SortState.cycle starts at 'desc').
		await page.locator('thead').getByRole('button', { name: 'Age', exact: true }).click();

		await expect(page).toHaveURL(/ordering=-age/);
		await expect(page).not.toHaveURL(/page=2/);
		await expect(page.locator('tbody tr:first-child')).toContainText('Eve 25');
	});

	test('filtering a column narrows results via the backend and resets to page 1', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();
		await expect(page).toHaveURL(/page=2/);

		await page.getByRole('button', { name: 'Filtrar City' }).click();
		await page.locator('#filter-pop-city').getByPlaceholder('Filtrar…').fill('Córdoba');

		await page.waitForURL(/city=/);
		await expect(page).not.toHaveURL(/page=2/);
		await expect(page.locator('tbody tr')).toHaveCount(5);
		const rows = page.locator('tbody tr');
		for (const row of await rows.all()) {
			await expect(row).toContainText('Bob');
		}
	});

	test('selection is cleared when navigating to a different page', async ({ page }) => {
		await page.locator('tbody tr:first-child input[type="checkbox"]').click();
		await expect(page.getByRole('button', { name: /Eliminar \(1\)/ })).toBeVisible();

		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();
		await expect(page).toHaveURL(/page=2/);

		await expect(page.getByRole('button', { name: /Eliminar \(0\)/ })).toBeVisible();
		await expect(page.locator('tbody tr input[type="checkbox"]:checked')).toHaveCount(0);
	});
});
