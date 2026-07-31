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
		await page.locator('[popover]:popover-open').getByPlaceholder('Buscar...').fill('Nadia');

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
		await page.locator('[popover]:popover-open').getByPlaceholder('Buscar...').fill('Nadia');

		await expect(page.getByRole('button', { name: 'Nadia Wide' })).toBeVisible();
		await expect(page.getByRole('button', { name: 'Ada Lovelace' })).toHaveCount(0);
	});

	// ─── Embedded field: "+" modal add/remove ───────────────────────────────────

	test('create: adding an item through the embedded field\'s "+" modal lists it', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: '+ Agregar' }).click();

		const modal = page.locator('dialog.modal');
		await expect(modal).toBeVisible();
		await modal.getByRole('button', { name: 'Seleccioná una opción' }).click();
		await modal.getByRole('button', { name: 'Bonus' }).click();
		await modal.getByRole('spinbutton', { name: 'Amount' }).fill('5');
		await modal.getByRole('button', { name: 'Agregar', exact: true }).click();

		await expect(modal).toHaveCount(0);
		await expect(page.getByText('Bonus: 5')).toBeVisible();
	});

	test('create: the embedded modal enforces required sub-fields before adding', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: '+ Agregar' }).click();

		const modal = page.locator('dialog.modal');
		await modal.getByRole('button', { name: 'Agregar', exact: true }).click();

		await expect(modal).toContainText('Kind es requerido');
		await expect(modal).toContainText('Amount es requerido');
	});

	test('create: fields sharing a `row` render side by side inside the embedded modal too', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: '+ Agregar' }).click();

		const modal = page.locator('dialog.modal');
		// Same row container wraps both fields, exactly like a top-level
		// Create/Update form — `md:flex-row` is what puts them side by side.
		const row = modal.locator('.md\\:flex-row', {
			has: page.getByRole('button', { name: 'Seleccioná una opción' })
		});
		await expect(row).toContainText('Kind');
		await expect(row.getByRole('spinbutton', { name: 'Amount' })).toBeVisible();
	});

	test('create: removing an added embedded item takes it out of the list', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: '+ Agregar' }).click();

		const modal = page.locator('dialog.modal');
		await modal.getByRole('button', { name: 'Seleccioná una opción' }).click();
		await modal.getByRole('button', { name: 'Penalty' }).click();
		await modal.getByRole('spinbutton', { name: 'Amount' }).fill('2');
		await modal.getByRole('button', { name: 'Agregar', exact: true }).click();
		await expect(page.getByText('Penalty: 2')).toBeVisible();

		await page.getByRole('button', { name: 'Quitar' }).click();

		await expect(page.getByText('Penalty: 2')).toHaveCount(0);
		await expect(page.getByText('Sin elementos agregados')).toBeVisible();
	});

	test('create: an embedded item can be added and edited again before the parent itself is saved', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('button', { name: '+ Agregar' }).click();

		const modal = page.locator('dialog.modal');
		await modal.getByRole('button', { name: 'Seleccioná una opción' }).click();
		await modal.getByRole('button', { name: 'Bonus' }).click();
		await modal.getByRole('spinbutton', { name: 'Amount' }).fill('5');
		await modal.getByRole('button', { name: 'Agregar', exact: true }).click();
		await expect(page.getByText('Bonus: 5')).toBeVisible();

		// Still on the create form — the parent widget has not been submitted yet.
		await expect(page.getByRole('button', { name: 'Guardar', exact: true })).toBeVisible();

		await page.getByRole('button', { name: 'Bonus: 5' }).click();
		await expect(modal).toBeVisible();
		await expect(modal.getByRole('button', { name: 'Bonus' })).toBeVisible();
		await expect(modal.getByRole('spinbutton', { name: 'Amount' })).toHaveValue('5');

		await modal.getByRole('spinbutton', { name: 'Amount' }).fill('9');
		await modal.getByRole('button', { name: 'Editar', exact: true }).click();

		await expect(page.getByText('Bonus: 9')).toBeVisible();
		await expect(page.getByText('Bonus: 5')).toHaveCount(0);
		// The parent widget is still unsaved — the edit only touched local draft state,
		// and completing the form now still creates it with the edited item included.
		await page.getByRole('textbox', { name: 'Name' }).fill('Widget E');
		await page.getByRole('textbox', { name: 'Code' }).fill('GHI789');
		await page.getByRole('spinbutton', { name: 'Quantity' }).fill('1');
		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('tbody')).toContainText('Widget E');
		await page
			.locator('tbody tr', { hasText: 'Widget E' })
			.getByRole('button', { name: 'Ver' })
			.click();
		await expect(page.getByText('Bonus: 9')).toBeVisible();
	});

	test('update: an existing embedded item can be edited and persists', async ({ page }) => {
		await page
			.locator('tbody tr', { hasText: 'Widget A' })
			.getByRole('button', { name: 'Editar' })
			.click();
		await page.waitForURL(/\?id=.+&view=edit/);
		await expect(page.getByText('Bonus: 5')).toBeVisible();

		await page.getByRole('button', { name: 'Bonus: 5' }).click();
		const modal = page.locator('dialog.modal');
		await expect(modal.getByRole('button', { name: 'Bonus' })).toBeVisible();
		await expect(modal.getByRole('spinbutton', { name: 'Amount' })).toHaveValue('5');

		await modal.getByRole('spinbutton', { name: 'Amount' }).fill('7');
		await modal.getByRole('button', { name: 'Editar', exact: true }).click();
		await expect(page.getByText('Bonus: 7')).toBeVisible();

		await page.getByRole('button', { name: 'Guardar', exact: true }).click();
		await expect(page.locator('tbody')).toContainText('Widget A');

		await page
			.locator('tbody tr', { hasText: 'Widget A' })
			.getByRole('button', { name: 'Ver' })
			.click();
		await expect(page.getByText('Bonus: 7')).toBeVisible();
	});

	test('create: a widget with an embedded adjustment is created and shown on read', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Name' }).fill('Widget D');
		await page.getByRole('textbox', { name: 'Code' }).fill('DEF456');
		await page.getByRole('spinbutton', { name: 'Quantity' }).fill('5');

		await page.getByRole('button', { name: '+ Agregar' }).click();
		const modal = page.locator('dialog.modal');
		await modal.getByRole('button', { name: 'Seleccioná una opción' }).click();
		await modal.getByRole('button', { name: 'Penalty' }).click();
		await modal.getByRole('spinbutton', { name: 'Amount' }).fill('2');
		await modal.getByRole('button', { name: 'Agregar', exact: true }).click();

		await page.getByRole('button', { name: 'Guardar', exact: true }).click();
		await expect(page.locator('tbody')).toContainText('Widget D');

		await page
			.locator('tbody tr', { hasText: 'Widget D' })
			.getByRole('button', { name: 'Ver' })
			.click();
		await expect(page.getByText('Penalty: 2')).toBeVisible();
	});

	// ─── Conditional hidden field ────────────────────────────────────────────────

	test('create: internal note only appears once visibility is set to advanced', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();

		await expect(page.getByRole('textbox', { name: 'Internal note' })).toHaveCount(0);

		await page.getByRole('button', { name: 'Basic' }).click();
		await page.getByRole('button', { name: 'Advanced', exact: true }).click();

		await expect(page.getByRole('textbox', { name: 'Internal note' })).toBeVisible();

		await page.getByRole('button', { name: 'Advanced', exact: true }).click();
		await page.getByRole('button', { name: 'Basic', exact: true }).click();

		await expect(page.getByRole('textbox', { name: 'Internal note' })).toHaveCount(0);
	});

	// ─── Multiselect field ───────────────────────────────────────────────────────

	test('create: multiselect toggles options without closing, and shows a selected count', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();

		await page.getByRole('button', { name: 'Seleccioná una opción' }).first().click();
		const dropdown = page.locator('ul').filter({ hasText: 'Fragile' });
		await dropdown.getByRole('button', { name: 'Fragile' }).click();
		await dropdown.getByRole('button', { name: 'Oversized' }).click();

		// Popover stays open after each pick (unlike single select).
		await expect(dropdown.getByRole('button', { name: 'Perishable' })).toBeVisible();

		await page.keyboard.press('Escape');
		await expect(page.getByRole('button', { name: '2 seleccionados' })).toBeVisible();
	});

	// ─── Tree field ──────────────────────────────────────────────────────────────

	test('create: checking a parent node in the tree cascades to its descendants', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();

		const hardwareRow = page.getByRole('checkbox', { name: 'Hardware', exact: true });
		const toolsRow = page.getByRole('checkbox', { name: 'Tools', exact: true });
		const powerToolsRow = page.getByRole('checkbox', { name: 'Power tools', exact: true });
		const fastenersRow = page.getByRole('checkbox', { name: 'Fasteners', exact: true });

		await expect(toolsRow).not.toBeChecked();
		await hardwareRow.check();

		await expect(hardwareRow).toBeChecked();
		await expect(toolsRow).toBeChecked();
		await expect(powerToolsRow).toBeChecked();
		await expect(fastenersRow).toBeChecked();

		await hardwareRow.uncheck();
		await expect(toolsRow).not.toBeChecked();
		await expect(powerToolsRow).not.toBeChecked();
	});

	// ─── Custom action: href-based redirect ─────────────────────────────────────

	test('list: href custom action navigates away instead of opening a modal', async ({ page }) => {
		await page.getByRole('button', { name: 'Find in tasks' }).first().click();

		await expect(page).toHaveURL(/\/test\/crud\?search=Widget/);
		await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();
	});
});
