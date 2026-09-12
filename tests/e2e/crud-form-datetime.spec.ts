import { test, expect } from '@playwright/test';

const URL = '/test/crud-form-datetime';

test.describe('GenericCRUD - datetime field masked text input', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	test('update: pre-fills the date as dd/mm/yyyy and the time separately', async ({ page }) => {
		await page
			.locator('tbody tr', { hasText: 'Kickoff' })
			.getByRole('button', { name: 'Editar' })
			.click();
		await page.waitForURL(/\?id=.+&view=edit/);

		await expect(page.getByRole('textbox', { name: 'Scheduled' })).toHaveValue('15/03/2026');
		// `.first()`: the fixture now has a second datetime field (Follow-up,
		// used by the cross-field `validate` tests below), so this generic
		// selector matches two time inputs — Scheduled renders first.
		await expect(page.locator('input[type="time"]').first()).toHaveValue('09:30');
	});

	test('update: typing a masked date updates and persists the value', async ({ page }) => {
		await page
			.locator('tbody tr', { hasText: 'Kickoff' })
			.getByRole('button', { name: 'Editar' })
			.click();
		await page.waitForURL(/\?id=.+&view=edit/);

		const dateInput = page.getByRole('textbox', { name: 'Scheduled' });
		await dateInput.fill('');
		await dateInput.pressSequentially('20032026');
		await expect(dateInput).toHaveValue('20/03/2026');

		await page.getByRole('button', { name: 'Guardar', exact: true }).click();
		await expect(page.locator('tbody tr', { hasText: 'Kickoff' })).toContainText('20/03/2026');
	});

	test('create: an invalid typed date is discarded on blur', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();

		const dateInput = page.getByRole('textbox', { name: 'Scheduled' });
		await dateInput.pressSequentially('31022026'); // Feb 31 doesn't exist
		await dateInput.blur();

		await expect(dateInput).toHaveValue('');
	});

	test('create: typing a masked date and time saves and renders formatted', async ({ page }) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Title' }).fill('Standup');

		const dateInput = page.getByRole('textbox', { name: 'Scheduled' });
		await dateInput.pressSequentially('01062026');
		await expect(dateInput).toHaveValue('01/06/2026');
		await page.locator('input[type="time"]').first().fill('08:15');

		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		const row = page.locator('tbody tr', { hasText: 'Standup' });
		await expect(row).toContainText('01/06/2026 08:15');
	});

	test('update: the calendar popover still picks a date into the text input', async ({ page }) => {
		await page
			.locator('tbody tr', { hasText: 'Kickoff' })
			.getByRole('button', { name: 'Editar' })
			.click();
		await page.waitForURL(/\?id=.+&view=edit/);

		await page.getByRole('button', { name: 'Elegir fecha en el calendario' }).first().click();
		const popover = page.locator('[popover]').first();
		await expect(popover).toBeVisible();
		await popover.getByRole('button', { name: 'March 20' }).click();

		await expect(page.getByRole('textbox', { name: 'Scheduled' })).toHaveValue('20/03/2026');
	});

	test('update: retyping over an already-filled date (without clearing first) replaces it correctly', async ({
		page
	}) => {
		await page
			.locator('tbody tr', { hasText: 'Kickoff' })
			.getByRole('button', { name: 'Editar' })
			.click();
		await page.waitForURL(/\?id=.+&view=edit/);

		const dateInput = page.getByRole('textbox', { name: 'Scheduled' });
		await expect(dateInput).toHaveValue('15/03/2026');

		// Selects the existing text and types over it in one motion — unlike
		// `fill('')` followed by typing, this never routes through an empty
		// intermediate value, so `datePart` stays at its old truthy value for
		// the whole first half of the edit.
		await dateInput.click();
		await dateInput.press('ControlOrMeta+A');
		await dateInput.pressSequentially('25122026');

		await expect(dateInput).toHaveValue('25/12/2026');
	});

	test('update: clearing the date disables the time input again', async ({ page }) => {
		await page
			.locator('tbody tr', { hasText: 'Kickoff' })
			.getByRole('button', { name: 'Editar' })
			.click();
		await page.waitForURL(/\?id=.+&view=edit/);

		const dateInput = page.getByRole('textbox', { name: 'Scheduled' });
		await dateInput.fill('');
		await dateInput.blur();

		await expect(dateInput).toHaveValue('');
		await expect(page.locator('input[type="time"]').first()).toBeDisabled();
	});

	test('create: a custom cross-field `validate` rejects a follow-up date not later than scheduled', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Title' }).fill('Review');

		await page.getByRole('textbox', { name: 'Scheduled' }).pressSequentially('15062026');
		await page.locator('input[type="time"]').first().fill('10:00');

		await page.getByRole('textbox', { name: 'Follow-up' }).pressSequentially('10062026');
		await page.locator('input[type="time"]').last().fill('09:00');

		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('[role="alert"]')).toContainText(
			'Follow-up must be later than the scheduled date'
		);
	});

	test('create: a custom cross-field `validate` accepts a follow-up date later than scheduled', async ({
		page
	}) => {
		await page.getByRole('button', { name: /Crear/ }).click();
		await page.getByRole('textbox', { name: 'Title' }).fill('Review');

		await page.getByRole('textbox', { name: 'Scheduled' }).pressSequentially('15062026');
		await page.locator('input[type="time"]').first().fill('10:00');

		await page.getByRole('textbox', { name: 'Follow-up' }).pressSequentially('20062026');
		await page.locator('input[type="time"]').last().fill('09:00');

		await page.getByRole('button', { name: 'Guardar', exact: true }).click();

		await expect(page.locator('tbody tr', { hasText: 'Review' })).toContainText('20/06/2026');
	});
});
