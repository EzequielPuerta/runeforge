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
});
