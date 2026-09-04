import { test, expect, type Page } from '@playwright/test';

const URL = '/test/crud-reorder';

const INITIAL_ORDER = [
	'General',
	'Education',
	'Housing',
	'Energy',
	'Logistics',
	'Tourism',
	'Health',
	'Agriculture',
	'Industry',
	'Environment',
	'Culture',
	'Security'
];
const PAGE_SIZE = 10;

async function rowTitles(page: Page): Promise<string[]> {
	// Columns, left to right: drag handle, selection checkbox, title. `order`
	// is `excludedFromList` (see interface.ts) so it never gets a column.
	// `:visible` matters here — reorder mode keeps every row in the DOM (so a
	// drag can reach across a page flip) and just hides the off-page ones.
	return page.locator('tbody tr:visible td:nth-child(3)').allTextContents();
}

/** Drags from `fromIndex` to `toIndex` without releasing the mouse button —
 * shared by `dragRow` (which drops normally) and the Escape-cancel test
 * (which presses Escape instead). */
async function dragRowWithoutDropping(page: Page, fromIndex: number, toIndex: number) {
	const rows = page.locator('tbody tr:visible');
	const handle = rows.nth(fromIndex).locator('[data-reorder-handle]');
	const direction = toIndex > fromIndex ? 1 : -1;

	const handleBox = await handle.boundingBox();
	if (!handleBox) throw new Error('Could not measure the drag handle');

	await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2);
	await page.mouse.down();
	// A small move past SortableJS's drag-start threshold.
	await page.mouse.move(handleBox.x + handleBox.width / 2, handleBox.y + handleBox.height / 2 + 5);
	await page.waitForTimeout(150);

	// Walk through every intermediate row rather than jumping straight to the
	// final target: a single long interpolated move can skip past a row
	// before SortableJS (forceFallback) registers a swap with it, silently
	// dropping one position short. Re-measuring each row right before moving
	// to it also sidesteps rows having shifted since the drag started.
	for (let i = fromIndex + direction; ; i += direction) {
		const box = await rows.nth(i).boundingBox();
		if (!box) throw new Error(`Could not measure row ${i}`);
		// SortableJS decides "insert before" vs "insert after" a row from
		// which half of it the pointer is over, so approaching from the
		// bottom quarter (moving down) or top quarter (moving up) is what
		// actually lands past that row instead of short of it.
		const y = box.y + box.height * (direction > 0 ? 0.85 : 0.15);
		await page.mouse.move(box.x + box.width / 2, y, { steps: 5 });
		await page.waitForTimeout(150);
		if (i === toIndex) break;
	}
}

async function dragRow(page: Page, fromIndex: number, toIndex: number) {
	await dragRowWithoutDropping(page, fromIndex, toIndex);
	await page.mouse.up();
}

test.describe('GenericCRUD - reorder', () => {
	test.beforeEach(async ({ page, request }) => {
		await request.get(`${URL}/reset`);
		await page.goto(URL);
		await page.waitForLoadState('networkidle');
	});

	test('defaults to ascending order by the reorder attribute, not by storage/id order', async ({
		page
	}) => {
		// The fixture's backend deliberately returns rows in neither insertion
		// nor `_id` order (see store.ts's STORAGE_SHUFFLE) — this only passes
		// if GenericCRUD itself sorts by `order` ascending by default.
		expect(await rowTitles(page)).toEqual(INITIAL_ORDER.slice(0, PAGE_SIZE));
	});

	test('does not render a column for the (excludedFromList) reorder attribute', async ({ page }) => {
		await expect(page.locator('thead th', { hasText: 'Order' })).toHaveCount(0);
	});

	test('shows a drag handle on every row of the current page', async ({ page }) => {
		await expect(page.locator('[data-reorder-handle]:visible')).toHaveCount(PAGE_SIZE);
	});

	test('paginates normally — reorder does not dump the whole list on one page', async ({ page }) => {
		await expect(page.locator('tbody tr:visible')).toHaveCount(PAGE_SIZE);
		await expect(page.getByText(/Mostrando 1.10 de 12/)).toBeVisible();

		await page.getByRole('button', { name: '»' }).click();
		await expect(page.locator('tbody tr:visible')).toHaveCount(2);
		expect(await rowTitles(page)).toEqual(INITIAL_ORDER.slice(PAGE_SIZE));
		// The last page's rows are draggable too.
		await expect(page.locator('[data-reorder-handle]:visible')).toHaveCount(2);
	});

	test('dragging a row within the page reorders the list', async ({ page }) => {
		// Move the first row ("General") down a few spots, all inside page 1.
		await dragRow(page, 0, 5);

		const expected = [...INITIAL_ORDER.slice(1, 6), INITIAL_ORDER[0], ...INITIAL_ORDER.slice(6, 10)];
		await expect(async () => {
			expect(await rowTitles(page)).toEqual(expected);
		}).toPass();
	});

	test('the new order survives a reload (persisted via the endpoint)', async ({ page }) => {
		await dragRow(page, 0, 5);
		const expected = [...INITIAL_ORDER.slice(1, 6), INITIAL_ORDER[0], ...INITIAL_ORDER.slice(6, 10)];
		await expect(async () => {
			expect(await rowTitles(page)).toEqual(expected);
		}).toPass();
		// The DOM already reflects the drop optimistically; give the single
		// endpoint POST it kicks off time to land before reloading, or the
		// reload aborts it mid-flight.
		await page.waitForLoadState('networkidle');

		await page.reload();
		await page.waitForLoadState('networkidle');
		await expect(async () => {
			expect(await rowTitles(page)).toEqual(expected);
		}).toPass();
	});

	test('Escape cancels an in-progress drag — no persist, order reverts', async ({ page }) => {
		let reorderRequests = 0;
		page.on('request', (req) => {
			if (req.url().includes('?/reorder')) reorderRequests++;
		});

		await dragRowWithoutDropping(page, 0, 5);
		// Confirm the drag actually took hold (rows visibly swapped) before
		// cancelling it — otherwise this would trivially "pass" against a
		// drag that never started.
		await expect(async () => {
			expect(await rowTitles(page)).not.toEqual(INITIAL_ORDER.slice(0, PAGE_SIZE));
		}).toPass();

		await page.keyboard.press('Escape');

		await expect(async () => {
			expect(await rowTitles(page)).toEqual(INITIAL_ORDER.slice(0, PAGE_SIZE));
		}).toPass();
		await page.waitForLoadState('networkidle');
		expect(reorderRequests).toBe(0);

		// Reload to also confirm nothing landed server-side.
		await page.reload();
		await page.waitForLoadState('networkidle');
		expect(await rowTitles(page)).toEqual(INITIAL_ORDER.slice(0, PAGE_SIZE));
	});
});
