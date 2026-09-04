import { test, expect, type Page } from '@playwright/test';

const URL = '/test/crud-reorder-advanced';
const PAGE_SIZE = 10;
// (group, order) composite display order — group "A" (8 items) then "B" (8 items).
const COMPOSITE_ORDER = [
	'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7',
	'B0', 'B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7'
];

async function rowTitles(page: Page): Promise<string[]> {
	// Columns: drag handle, selection checkbox, title (`group`/`order` are
	// both `excludedFromList`).
	return page.locator('tbody tr:visible td:nth-child(3)').allTextContents();
}

test.describe('GenericCRUD - reorder (compare / multiDrag / page-flip)', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	test('orders by the composite `compare` (group, then order), not by storage order', async ({
		page
	}) => {
		// The fixture's backend deliberately returns rows shuffled (see
		// store.ts's STORAGE_SHUFFLE) — this only passes if `compare` is what's
		// actually driving the displayed order.
		expect(await rowTitles(page)).toEqual(COMPOSITE_ORDER.slice(0, PAGE_SIZE));
	});

	test('multiDrag: checking rows mirrors them into SortableJS as multi-drag-selected', async ({
		page
	}) => {
		// This is as far as this suite can reliably verify multiDrag by
		// automation — see the PR/session notes: SortableJS's MultiDrag plugin
		// didn't register a completed group move under either forceFallback or
		// Playwright's synthetic native-DnD in this harness (oldIndicies came
		// back equal to newIndicies every time), despite the selection sync
		// below working correctly. The actual drag behavior needs a manual
		// pass with a real pointer.
		const rows = page.locator('tbody tr:visible');
		await rows.nth(0).locator('input[type="checkbox"]').check();
		await rows.nth(2).locator('input[type="checkbox"]').check();

		await expect(rows.nth(0)).toHaveClass(/bg-primary\/10/);
		await expect(rows.nth(2)).toHaveClass(/bg-primary\/10/);
		await expect(rows.nth(1)).not.toHaveClass(/bg-primary\/10/);

		await rows.nth(0).locator('input[type="checkbox"]').uncheck();
		await expect(rows.nth(0)).not.toHaveClass(/bg-primary\/10/);
	});

	test('page-flip: hovering the edge zone during a drag advances to the next page', async ({
		page
	}) => {
		const rows = page.locator('tbody tr:visible');
		const handle = rows.nth(0).locator('[data-reorder-handle]');
		const handleBox = await handle.boundingBox();
		if (!handleBox) throw new Error('Could not measure the drag handle');

		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
		await page.mouse.down();
		await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 5);
		await page.waitForTimeout(150);

		await expect(page.locator('[data-reorder-page-zone="next"]')).toBeAttached();
		// Hit-testing is computed from the table wrapper's own box (not the
		// purely-cosmetic zone `<div>`'s rendered size), so target a point well
		// inside its right edge margin directly.
		const wrapperBox = await page.locator('table').locator('xpath=..').boundingBox();
		if (!wrapperBox) throw new Error('Could not measure the table wrapper');

		// Hover near the right edge — the fixture sets `pageFlipThresholdMs: 300`.
		await page.mouse.move(wrapperBox.x + wrapperBox.width - 20, wrapperBox.y + wrapperBox.height / 2, {
			steps: 3
		});
		await expect(page.getByText(/Mostrando 11.16 de 16/)).toBeVisible({ timeout: 3000 });

		// Drop back inside the table — position doesn't matter for this test.
		const tableBox = await page.locator('table').boundingBox();
		if (tableBox) {
			await page.mouse.move(tableBox.x + tableBox.width / 2, tableBox.y + tableBox.height / 2, {
				steps: 3
			});
		}
		await page.mouse.up();
	});
});
