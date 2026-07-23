import { test, expect } from '@playwright/test';

const URL = '/test/crud-fields';

test.describe('GenericCRUD - grouped fields, conditional disable, validation', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	// ─── List ────────────────────────────────────────────────────────────────────

	test('list: renders all initial widgets', async ({ page }) => {
		await expect(page.locator('tbody tr')).toHaveCount(2);
		await expect(page.locator('tbody')).toContainText('Widget A');
		await expect(page.locator('tbody')).toContainText('Widget B');
	});

	// ─── Grouping ────────────────────────────────────────────────────────────────

	test('create: fields render inside titled fieldsets by groupedAs', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();

		const identification = page.locator('fieldset', {
			has: page.locator('legend', { hasText: 'Identification' })
		});
		await expect(identification.getByRole('textbox', { name: 'Code' })).toBeVisible();

		const quantity = page.locator('fieldset', {
			has: page.locator('legend', { hasText: 'Quantity' })
		});
		await expect(quantity.getByRole('checkbox', { name: 'Unlimited quantity' })).toBeVisible();
		await expect(quantity.getByRole('spinbutton', { name: 'Quantity' })).toBeVisible();

		// Ungrouped fields still render outside any fieldset.
		await expect(page.getByRole('textbox', { name: 'Name' })).toBeVisible();
	});

	// ─── Conditional disable ─────────────────────────────────────────────────────

	test('create: checking "unlimited" disables the quantity field, unchecking re-enables it', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();

		const quantity = page.getByRole('spinbutton', { name: 'Quantity' });
		const unlimited = page.getByRole('checkbox', { name: 'Unlimited quantity' });

		await expect(quantity).toBeEnabled();
		await unlimited.check();
		await expect(quantity).toBeDisabled();
		await unlimited.uncheck();
		await expect(quantity).toBeEnabled();
	});

	// ─── Validation ──────────────────────────────────────────────────────────────
	// Default i18n strings are Spanish (runeforge's `getStrings()` fallback),
	// since this demo route doesn't call `setStrings(en)` — same as /test/crud's
	// own spec asserting Spanish button labels.

	test('create: rejects a quantity above max', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Name' }).fill('Widget C');
		await page.getByRole('textbox', { name: 'Code' }).fill('ABC123');
		await page.getByRole('spinbutton', { name: 'Quantity' }).fill('150');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('[role="alert"]')).toContainText('menor o igual a 100');
		// Submission was blocked client-side: still on the create form, not the list.
		await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
	});

	test('create: rejects a non-integer quantity', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Name' }).fill('Widget C');
		await page.getByRole('textbox', { name: 'Code' }).fill('ABC123');
		await page.getByRole('spinbutton', { name: 'Quantity' }).fill('1.5');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('[role="alert"]')).toContainText('número entero');
		await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
	});

	test('create: rejects a code that does not match the required pattern', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Name' }).fill('Widget C');
		await page.getByRole('textbox', { name: 'Code' }).fill('lowercase');
		await page.getByRole('spinbutton', { name: 'Quantity' }).fill('5');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('[role="alert"]')).toContainText('formato inválido');
		await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();
	});

	test('create: a valid submission creates the widget', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Name' }).fill('Widget C');
		await page.getByRole('textbox', { name: 'Code' }).fill('ABC123');
		await page.getByRole('spinbutton', { name: 'Quantity' }).fill('5');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('tbody tr')).toHaveCount(3);
		await expect(page.locator('tbody')).toContainText('Widget C');
	});

	// ─── Select field: in-memory vs. async search ───────────────────────────────

	test('create: owner select shows the prefetched options with no search function needed', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: 'Choose an owner' }).click();

		const dropdown = page.locator('ul').filter({ hasText: 'Ada Lovelace' });
		await expect(dropdown.getByRole('button', { name: 'Ada Lovelace' })).toBeVisible();
		await expect(dropdown.getByRole('button', { name: 'Grace Hopper' })).toBeVisible();
		// Never part of the prefetched slice, so it must not appear before searching.
		await expect(dropdown.getByRole('button', { name: 'Nadia Wide' })).toHaveCount(0);
	});

	test('create: typing in the owner select fetches matches from the server, including owners outside the prefetched slice', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: 'Choose an owner' }).click();
		await page.getByPlaceholder('Buscar...').fill('Nadia');

		const option = page.getByRole('button', { name: 'Nadia Wide' });
		await expect(option).toBeVisible();
		await option.click();

		// Picked value isn't in the prefetched `options` list, so the closed
		// select must still resolve its label from the search result.
		await expect(page.getByRole('button', { name: 'Nadia Wide' })).toBeVisible();
	});

	test('create: owner search only returns owners matching the query', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: 'Choose an owner' }).click();
		await page.getByPlaceholder('Buscar...').fill('Nadia');

		await expect(page.getByRole('button', { name: 'Nadia Wide' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Ada Lovelace' })).toHaveCount(0);
	});

	// ─── Custom action: href-based redirect ─────────────────────────────────────

	test('list: href custom action navigates away instead of opening a modal', async ({ page }) => {
		await page.getByRole('button', { name: 'Find in tasks' }).first().click();

		await expect(page).toHaveURL(/\/test\/crud\?search=Widget/);
		await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
	});
});
