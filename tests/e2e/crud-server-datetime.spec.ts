import { test, expect } from '@playwright/test';

const URL = '/test/crud-server-datetime';

test.describe('GenericCRUD (server pagination) datetime filter', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	function rows(page: import('@playwright/test').Page) {
		return page.getByTestId('paginated-table-body').locator('tr');
	}

	test('filtering by a datetime range writes joined_from/joined_to and narrows results via the backend', async ({
		page,
	}) => {
		const popover = page.locator('#filter-pop-joined');
		await page.getByRole('button', { name: 'Filtrar Joined' }).click();

		const today = new Date();
		const from = new Date(today.getFullYear(), today.getMonth(), 10);
		const to = new Date(today.getFullYear(), today.getMonth(), 12);
		const label = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
		await popover.getByRole('button', { name: label(from) }).click();
		await popover.getByRole('button', { name: label(to) }).click();

		await page.waitForURL(/joined_from=/);
		await expect(page).toHaveURL(/joined_from=.*joined_to=|joined_to=.*joined_from=/);
		await expect(rows(page)).toHaveCount(3);
		await expect(rows(page).first()).toContainText('Row 10');
		await expect(rows(page).last()).toContainText('Row 12');
	});

	test('clearing the datetime filter restores all rows on the backend', async ({ page }) => {
		const popover = page.locator('#filter-pop-joined');
		await page.getByRole('button', { name: 'Filtrar Joined' }).click();

		const today = new Date();
		const from = new Date(today.getFullYear(), today.getMonth(), 10);
		const to = new Date(today.getFullYear(), today.getMonth(), 12);
		const label = (d: Date) => d.toLocaleDateString('en-US', { day: 'numeric', month: 'long' });
		await popover.getByRole('button', { name: label(from) }).click();
		await popover.getByRole('button', { name: label(to) }).click();
		await page.waitForURL(/joined_from=/);
		await expect(rows(page)).toHaveCount(3);

		await popover.getByRole('button', { name: 'Limpiar filtro' }).click();
		await page.waitForURL((u) => !u.search.includes('joined_from'));
		await expect(rows(page)).toHaveCount(10);
	});
});
