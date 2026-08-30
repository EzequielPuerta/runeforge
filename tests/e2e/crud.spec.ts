import { test, expect } from '@playwright/test';

const URL = '/test/crud';

test.describe('GenericCRUD', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	// ─── List ────────────────────────────────────────────────────────────────────

	test('list: renders all initial tasks', async ({ page }) => {
		await expect(page.locator('tbody tr')).toHaveCount(3);
		await expect(page.locator('tbody')).toContainText('Buy groceries');
		await expect(page.locator('tbody')).toContainText('Write tests');
		await expect(page.locator('tbody')).toContainText('Review PR');
	});

	test('list: row actions are present for each row', async ({ page }) => {
		const firstRow = page.locator('tbody tr:first-child');
		await expect(firstRow.getByRole('button', { name: 'Ver' })).toBeVisible();
		await expect(firstRow.getByRole('button', { name: 'Editar' })).toBeVisible();
		await expect(firstRow.getByRole('button', { name: 'Eliminar' })).toBeVisible();
	});

	// ─── Create ──────────────────────────────────────────────────────────────────

	test('create: navigates to form and back on cancel', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
		await page.getByRole('button', { name: 'Cancelar' }).click();
		await expect(page.locator('tbody tr')).toHaveCount(3);
	});

	test('create: adds a new task and shows it in the list', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Title' }).fill('Deploy to production');
		await page.getByRole('textbox', { name: 'Description' }).fill('Run the deploy script');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('tbody tr')).toHaveCount(4);
		await expect(page.locator('tbody')).toContainText('Deploy to production');
	});

	test('create: shows validation error when title is empty', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('[role="alert"]')).toBeVisible();
		await expect(page.locator('[role="alert"]')).toContainText('Title es requerido');
	});

	test('create: "guardar y continuar" stays on the form', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Title' }).fill('Task A');
		await page.getByRole('button', { name: 'Guardar y continuar' }).click();

		// Form stays visible and title is cleared
		await expect(page.getByRole('textbox', { name: 'Title' })).toBeVisible();
		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('');
	});

	// ─── Read ────────────────────────────────────────────────────────────────────

	test('read: shows task details in readonly fields', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Ver' }).click();
		await page.waitForURL(/\?id=/);

		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Buy groceries');
		await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
			'Milk, eggs, bread'
		);
	});

	test('read: a formatter returning HTML renders as markup, not escaped text', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Ver' }).click();
		await page.waitForURL(/\?id=/);

		const link = page.getByRole('link', { name: 'Open' });
		await expect(link).toBeVisible();
		await expect(link).toHaveAttribute('href', 'https://example.com/groceries');
	});

	test('read: "volver" returns to the list', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Ver' }).click();
		await page.waitForURL(/\?id=/);

		await page.getByRole('button', { name: 'Volver' }).click();
		await expect(page.locator('tbody tr')).toHaveCount(3);
	});

	// ─── Update ──────────────────────────────────────────────────────────────────

	test('edit: pre-fills fields with current values', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Editar' }).click();
		await page.waitForURL(/\?id=.+&view=edit/);

		await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('Buy groceries');
		await expect(page.getByRole('textbox', { name: 'Description' })).toHaveValue(
			'Milk, eggs, bread'
		);
	});

	test('edit: saves changes and reflects them in the list', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Editar' }).click();
		await page.waitForURL(/\?id=.+&view=edit/);

		await page.getByRole('textbox', { name: 'Title' }).fill('Buy organic groceries');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('tbody')).toContainText('Buy organic groceries');
		await expect(page.locator('tbody')).not.toContainText('Buy groceries');
	});

	test('edit: cancel returns to list without saving', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Editar' }).click();
		await page.waitForURL(/\?id=.+&view=edit/);

		await page.getByRole('textbox', { name: 'Title' }).fill('Should not save');
		await page.getByRole('button', { name: 'Cancelar' }).click();

		await expect(page.locator('tbody')).toContainText('Buy groceries');
		await expect(page.locator('tbody')).not.toContainText('Should not save');
	});

	// ─── Delete ──────────────────────────────────────────────────────────────────

	test('delete: row action removes the task', async ({ page }) => {
		await page.locator('tbody tr:first-child').getByRole('button', { name: 'Eliminar' }).click();
		await expect(page.locator('tbody tr')).toHaveCount(2);
		await expect(page.locator('tbody')).not.toContainText('Buy groceries');
	});

	test('delete: bulk delete removes selected tasks', async ({ page }) => {
		await page.locator('tbody tr:nth-child(1) input[type="checkbox"]').click();
		await page.locator('tbody tr:nth-child(2) input[type="checkbox"]').click();

		await page.getByRole('button', { name: /Eliminar \(2\)/ }).click();
		await expect(page.locator('tbody tr')).toHaveCount(1);
	});

	// ─── Custom bulk actions ────────────────────────────────────────────────────

	test('customBulkActions: disabled until at least one row is selected', async ({ page }) => {
		await expect(page.getByRole('button', { name: /^Complete \(/ })).toBeDisabled();
	});

	test('customBulkActions: runs the endpoint once per selected row and refreshes the list', async ({
		page
	}) => {
		await page.locator('tbody tr:nth-child(1) input[type="checkbox"]').click();
		await page.locator('tbody tr:nth-child(2) input[type="checkbox"]').click();

		await page.getByRole('button', { name: /Complete \(2\)/ }).click();

		const completedCells = page.locator('tbody tr td', { hasText: 'Sí' });
		await expect(completedCells).toHaveCount(2);
	});

	test('customBulkActions: selection resets after running', async ({ page }) => {
		await page.locator('tbody tr:nth-child(1) input[type="checkbox"]').click();
		await page.getByRole('button', { name: /Complete \(1\)/ }).click();

		await expect(page.getByRole('button', { name: /^Complete \(/ })).toBeDisabled();
	});

	// ─── Generic search ─────────────────────────────────────────────────────────

	test('search: filters the list by title or description', async ({ page }) => {
		// The toolbar also renders an `aria-hidden` off-screen clone of itself
		// (used to measure whether it should collapse), so scope by role —
		// which excludes aria-hidden nodes — rather than by placeholder text,
		// which would match both.
		await page.getByRole('searchbox', { name: 'Search tasks...' }).fill('groceries');
		await expect(page.locator('tbody tr')).toHaveCount(1);
		await expect(page.locator('tbody')).toContainText('Buy groceries');
	});

	test('search: clearing the input restores the full list', async ({ page }) => {
		const input = page.getByRole('searchbox', { name: 'Search tasks...' });
		await input.fill('groceries');
		await expect(page.locator('tbody tr')).toHaveCount(1);

		await input.fill('');
		await expect(page.locator('tbody tr')).toHaveCount(3);
	});
});
