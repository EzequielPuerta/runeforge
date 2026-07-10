import { test, expect } from '@playwright/test';

test.describe('PaginatedTable datetime filter', () => {
	test.beforeEach(async ({ page }) => {
		await page.goto('/test/paginated-table-datetime');
		await page.waitForLoadState('networkidle');
	});

	function rows(page: import('@playwright/test').Page) {
		return page.getByTestId('paginated-table-body').locator('tr');
	}

	test('renders the first page with 10 rows', async ({ page }) => {
		await expect(rows(page)).toHaveCount(10);
	});

	test('filters rows by a datetime range picked on the calendar', async ({ page }) => {
		const popover = page.locator('#filter-pop-joined');
		await page.getByRole('button', { name: 'Filtrar Joined' }).click();

		const today = new Date();
		const from = new Date(today.getFullYear(), today.getMonth(), 10);
		const to = new Date(today.getFullYear(), today.getMonth(), 12);
		const label = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
		await popover.getByRole('button', { name: label(from) }).click();
		await popover.getByRole('button', { name: label(to) }).click();

		await expect(rows(page)).toHaveCount(3);
		await expect(rows(page).first()).toContainText('Row 10');
		await expect(rows(page).last()).toContainText('Row 12');
	});

	test('clearing the datetime filter restores all rows', async ({ page }) => {
		const popover = page.locator('#filter-pop-joined');
		await page.getByRole('button', { name: 'Filtrar Joined' }).click();

		const today = new Date();
		const from = new Date(today.getFullYear(), today.getMonth(), 10);
		const to = new Date(today.getFullYear(), today.getMonth(), 12);
		const label = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
		await popover.getByRole('button', { name: label(from) }).click();
		await popover.getByRole('button', { name: label(to) }).click();
		await expect(rows(page)).toHaveCount(3);

		await popover.getByRole('button', { name: 'Limpiar filtro' }).click();
		await expect(rows(page)).toHaveCount(10);
	});
});
