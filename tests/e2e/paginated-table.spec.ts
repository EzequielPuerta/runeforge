import { test, expect } from '@playwright/test';

test.describe('PaginatedTable', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test/paginated-table');
		await page.waitForLoadState('networkidle');
	});

	test('renders the first page with 10 rows', async ({ page }) => {
		await expect(page.locator('table')).toBeVisible();
		await expect(page.locator('tbody tr')).toHaveCount(10);
	});

	test('navigates to page 2', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();
		await expect(pager.getByRole('button', { name: '2' })).toHaveClass(/btn-active/);
		await expect(page.locator('tbody tr:first-child td:first-child')).toHaveText('Alice 11');
	});

	test('last page has fewer rows', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '3' }).click();
		await expect(pager.getByRole('button', { name: '3' })).toHaveClass(/btn-active/);
		await expect(page.locator('tbody tr')).toHaveCount(5);
	});

	test('sorts a column descending then ascending', async ({ page }) => {
		// getByRole name is a substring match — use exact to avoid hitting the filter button
		const sortBtn = page.locator('thead').getByRole('button', { name: 'Name', exact: true });

		await sortBtn.click();
		await expect(page.locator('tbody tr:first-child td:first-child')).toHaveText('Eve 25');

		await sortBtn.click();
		await expect(page.locator('tbody tr:first-child td:first-child')).toHaveText('Alice 1');
	});

	test('resets to page 1 after sorting', async ({ page }) => {
		const pager = page.locator('div.join');
		await pager.getByRole('button', { name: '2' }).click();
		await expect(pager.getByRole('button', { name: '2' })).toHaveClass(/btn-active/);

		await page.locator('thead').getByRole('button', { name: 'Name', exact: true }).click();
		await expect(pager.getByRole('button', { name: '1' })).toHaveClass(/btn-active/);
		await expect(page.locator('tbody tr')).toHaveCount(10);
	});

	test('filters rows by text', async ({ page }) => {
		// All column filter popovers share the same placeholder — scope to the Name one by id
		await page.getByRole('button', { name: 'Filtrar Name' }).click();
		await page.locator('#filter-pop-name').getByPlaceholder('Filtrar…').fill('Alice');

		await expect(page.locator('tbody tr')).toHaveCount(5);
		const cells = page.locator('tbody td:first-child');
		for (const cell of await cells.all()) {
			await expect(cell).toContainText('Alice');
		}
	});

	test('clearing the filter restores all rows', async ({ page }) => {
		await page.getByRole('button', { name: 'Filtrar Name' }).click();
		await page.locator('#filter-pop-name').getByPlaceholder('Filtrar…').fill('Alice');
		await expect(page.locator('tbody tr')).toHaveCount(5);

		await page.getByRole('button', { name: 'Limpiar filtro' }).click();
		await expect(page.locator('tbody tr')).toHaveCount(10);
	});
});
