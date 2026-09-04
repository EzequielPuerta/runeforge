<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { SvelteSet } from 'svelte/reactivity';
	import TableBody from '$lib/components/table/TableBody.svelte';
	import Paginator from '$lib/components/table/Paginator.svelte';
	import TableHeader from '$lib/components/table/TableHeader.svelte';
	import { SortState, FilterState, snapshotFilter } from '$lib/components/table/state.svelte.js';
	import {
		distinctEntries,
		isFilterable,
		resolveReorderComparator
	} from '$lib/components/table/utils.js';
	import type {
		FilterSnapshot,
		IndexedRow,
		ReorderOptions,
		ServerPagination,
		SortDirection,
		TableQuery
	} from '$lib/types/table.js';
	import { tick, type Snippet } from 'svelte';
	import type { ColumnDefinition } from '$lib/types/crud.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	let {
		data = [] as T[],
		columns = [] as ColumnDefinition<T>[],
		pageSize = 10,
		selectable = true,
		selected = $bindable(new SvelteSet<number>()),
		rowActions = undefined as Snippet<[T]> | undefined,
		actionsLabel = strings.actions,
		pagination = undefined as ServerPagination | undefined,
		initialSort = undefined as { column: string; direction: SortDirection } | undefined,
		initialFilters = undefined as Partial<FilterSnapshot> | undefined,
		onPaginationChange = undefined as ((query: TableQuery) => void) | undefined,
		visibleRows = $bindable<T[]>([]),
		query = $bindable<TableQuery | undefined>(undefined),
		reorder = undefined as ReorderOptions<T> | undefined,
		onReorder = undefined as ((rows: T[]) => void) | undefined
	}: {
		data?: T[];
		columns?: ColumnDefinition<T>[];
		pageSize?: number;
		selectable?: boolean;
		selected?: SvelteSet<number>;
		rowActions?: Snippet<[T]>;
		actionsLabel?: string;
		/** When provided, the table trusts `data` is already the requested page and
		 * defers pagination/sort/filter to `onPaginationChange` instead of computing
		 * them locally. Omit for the original fully-client-side behavior. */
		pagination?: ServerPagination;
		initialSort?: { column: string; direction: SortDirection };
		initialFilters?: Partial<FilterSnapshot>;
		onPaginationChange?: (query: TableQuery) => void;
		/** Filtered + sorted rows before page slicing (client mode), or the
		 * current page's rows as-is (server mode). Read-only for callers. */
		visibleRows?: T[];
		/** Current ordering + filters snapshot, kept in sync for callers that
		 * need to replicate the active query (e.g. exporting server-side). */
		query?: TableQuery;
		/** Turns on drag-to-reorder. Per-column filters are suppressed and row
		 * order is fully owned by `reorder.compare`/`reorder.attribute` while
		 * it's active — ignored entirely in server-pagination mode
		 * (`pagination` set), since the full row set needs to be reachable
		 * client-side for drag positions to be meaningful. */
		reorder?: ReorderOptions<T>;
		/** Fires after a drag settles with the complete reordered row list
		 * (client mode only). The caller decides how to persist it. */
		onReorder?: (rows: T[]) => void;
	} = $props();

	// Intentional one-time hydration of local state from the initial prop
	// values (not a live binding) — `svelte-check`'s state_referenced_locally
	// warning is a false positive here.
	const sort = new SortState(initialSort ?? null);
	const filter = new FilterState(initialFilters ?? null);

	let currentPage = $state(pagination?.page ?? 1);
	let lastKnownPage = pagination?.page ?? 1;

	const serverFilterSampleSize = 5;

	// Server mode: there's no way to know every value a column can take without
	// querying the whole (server-owned) dataset, so this is deliberately just a
	// cosmetic hint — up to `serverFilterSampleSize` distinct values found on
	// the current page, not an exhaustive list. Boolean is the one exception:
	// its two states are always known, so both show up regardless of what the
	// current page happens to contain.
	const distinctValues = $derived(
		pagination
			? {
					...Object.fromEntries(
						Object.entries(
							distinctEntries(
								data,
								columns.filter((c) => isFilterable(c) && c.type !== 'boolean')
							)
						).map(([attribute, entries]) => [attribute, entries.slice(0, serverFilterSampleSize)])
					),
					...Object.fromEntries(
						columns
							.filter((c) => isFilterable(c) && c.type === 'boolean')
							.map((c) => [
								c.attribute,
								[
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									{ key: 'true', label: c.formatter?.(true as any, {} as T), row: {} as T },
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									{ key: 'false', label: c.formatter?.(false as any, {} as T), row: {} as T }
								]
							])
					)
				}
			: distinctEntries(data, columns)
	);

	// Server-pagination mode owns its own full row set server-side, where
	// drag positions can't be reconciled across pages — reorder only makes
	// sense once the whole (client-mode) row set is reachable.
	const reorderActive = $derived(!!reorder && !pagination);

	const indexed = $derived(data.map((row, index): IndexedRow<T> => ({ row, index })));
	// Dragging needs the complete row set reachable, so filters (which would
	// hide rows) are bypassed while reorder is active.
	const filtered = $derived(
		pagination || reorderActive ? indexed : indexed.filter(({ row }) => filter.matches(row, columns))
	);
	const sorted = $derived(pagination || reorderActive ? filtered : sort.apply(filtered, columns));

	// Reorder mode owns ordering outright (column-header sorting is disabled
	// while it's active — see TableHeader), via `reorder.compare` when given
	// (composite orders) or plain ascending by `reorder.attribute`.
	const reorderComparator = $derived(reorder ? resolveReorderComparator(reorder) : undefined);
	const reorderBase = $derived(
		reorderActive ? [...indexed].sort((a, b) => reorderComparator!(a.row, b.row)) : []
	);

	// Local override applied on top of `reorderBase` once the user starts
	// dragging, so the displayed order doesn't snap back on the next reactive
	// update while persistence is in flight — cleared whenever `data` changes
	// reference from anywhere else (e.g. a reload after persisting).
	let manualOrder = $state<IndexedRow<T>[] | null>(null);
	let lastReorderData: T[] | undefined;
	$effect(() => {
		if (data !== lastReorderData) {
			manualOrder = null;
			lastReorderData = data;
		}
	});
	// The full reordered row list (all of it — pagination during reorder mode
	// is a visual window over this, not a slice; see `visibleRange` below).
	const reorderIndexed = $derived(reorderActive ? (manualOrder ?? reorderBase) : []);

	// Escape cancels an in-progress drag — see the `keydown` listener below.
	// SortableJS has no public "abort" API, so cancelling means: let the drag
	// settle normally (wherever the pointer happens to be), then discard that
	// outcome here instead of persisting it.
	let cancelReorder = false;

	async function handleReorderSettled(rows: IndexedRow<T>[]) {
		// TableBody's `onEnd` fires this on every drag that settles, whether or
		// not any row actually moved — the natural place to also clear the
		// dragging/hover-zone state.
		isDragging = false;
		resetHoverZone();
		if (cancelReorder) {
			cancelReorder = false;
			// `manualOrder` was `null` for the whole drag — it's only ever set
			// here, at settle time — while SortableJS was moving the *actual*
			// DOM nodes around live, entirely outside Svelte's own bookkeeping
			// for this keyed each block. So right now Svelte's internal model
			// of "current order" still says the original order, same as what
			// we want to revert to — setting `manualOrder` straight to that is
			// a no-op *to Svelte* (nothing to reconcile from its point of
			// view), leaving the real DOM stuck wherever SortableJS dropped it.
			// Sync to `rows` (where it actually settled) first — a real change
			// Svelte will apply — then revert on the next tick, which is now a
			// real change too.
			manualOrder = rows;
			await tick();
			manualOrder = [...reorderBase];
			return;
		}
		manualOrder = rows;
		onReorder?.(rows.map((e) => e.row));
	}

	const effectivePageSize = $derived(pagination?.pageSize ?? pageSize);
	const totalPages = $derived(
		reorderActive
			? Math.max(1, Math.ceil(reorderIndexed.length / effectivePageSize))
			: (pagination?.totalPages ?? Math.ceil(sorted.length / effectivePageSize))
	);
	const displayPage = $derived(pagination?.page ?? currentPage);
	const pageStart = $derived((displayPage - 1) * effectivePageSize);
	const pageEnd = $derived(pageStart + effectivePageSize);
	// Reorder mode: TableBody gets the *entire* reordered set (so a drag can
	// reach across a page flip without SortableJS losing track of rows), with
	// `visibleRange` telling it which positions are actually on screen.
	const pageData = $derived(
		reorderActive ? reorderIndexed : pagination ? sorted : sorted.slice(pageStart, pageEnd)
	);
	const visiblePageData = $derived(
		reorderActive ? reorderIndexed.slice(pageStart, pageEnd) : pageData
	);
	const visibleRange = $derived(
		reorderActive ? { start: pageStart, end: Math.min(pageEnd, reorderIndexed.length) } : undefined
	);
	const totalCount = $derived(reorderActive ? reorderIndexed.length : (pagination?.total ?? sorted.length));
	const allChecked = $derived(
		visiblePageData.length > 0 && visiblePageData.every((e) => selected.has(e.index))
	);
	const someChecked = $derived(visiblePageData.some((e) => selected.has(e.index)));

	// Client mode only: server mode's totalPages is externally owned, clamping
	// here would fight with URL-driven navigation while a page reload is pending.
	$effect(() => {
		if (!pagination && currentPage > totalPages && totalPages > 0) currentPage = totalPages;
	});

	// Server mode: external (URL/reload) page changes -> sync local state.
	$effect(() => {
		if (pagination && pagination.page !== lastKnownPage) {
			currentPage = pagination.page;
			lastKnownPage = pagination.page;
		}
	});

	// Server mode: local (Paginator click) page changes -> notify caller.
	$effect(() => {
		if (pagination && currentPage !== lastKnownPage) {
			lastKnownPage = currentPage;
			onPaginationChange?.(currentQuery(currentPage));
		}
	});

	// Surface the filtered+sorted rows and current query for callers (e.g.
	// export) — the full set pre-pagination in both regular and reorder mode.
	$effect(() => {
		visibleRows = (reorderActive ? reorderIndexed : sorted).map((e) => e.row);
	});
	$effect(() => {
		query = currentQuery(displayPage);
	});

	function currentQuery(page: number): TableQuery {
		return {
			page,
			ordering: sort.column ? (sort.direction === 'asc' ? sort.column : `-${sort.column}`) : null,
			filters: snapshotFilter(filter)
		};
	}

	function handleHeaderChange() {
		currentPage = 1;
		if (!pagination) return;
		lastKnownPage = 1;
		onPaginationChange?.(currentQuery(1));
	}

	function toggleAll() {
		if (allChecked) visiblePageData.forEach((e) => selected.delete(e.index));
		else visiblePageData.forEach((e) => selected.add(e.index));
	}

	function toggleItem(index: number) {
		if (selected.has(index)) selected.delete(index);
		else selected.add(index);
	}

	const colCount = $derived(
		columns.length + (selectable ? 1 : 0) + (rowActions ? 1 : 0) + (reorderActive ? 1 : 0)
	);

	// ─── Drag-to-reorder: edge hover zones for flipping pages mid-drag ──────
	//
	// Hit-testing is computed from `wrapperEl`'s own layout box, not from the
	// visual zone `<div>`s' rendered (Tailwind-classed) dimensions — the
	// mechanic must keep working even if a consumer's Tailwind setup can't
	// generate those utilities for some reason. The `<div>`s stay purely
	// cosmetic, styled the same way as the rest of the library.

	const ZONE_WIDTH_PX = 56;

	let isDragging = $state(false);
	let wrapperEl: HTMLElement | undefined = $state();
	let leftProgress = $state(0);
	let rightProgress = $state(0);
	let hoverZone: 'left' | 'right' | null = null;
	let hoverStart = 0;
	let hoverTimer: ReturnType<typeof setInterval> | undefined;

	// The "Pág N" label + chevron is positioned via JS (`position: fixed`),
	// not CSS `sticky` — the zone spans the *whole* table, which can be much
	// taller than the viewport, and every sticky-based attempt at keeping the
	// label in view broke down somewhere: `top: 50%` resolves against the
	// containing block's height (the full table), not the viewport, so it
	// doesn't track scroll position at all; a `height: 100vh` sticky trick
	// tracks scroll correctly through the top and middle of the table but
	// still overshoots past the viewport once less than one viewport's worth
	// of table remains below the current scroll position (confirmed with a
	// 1611px table in a 900px viewport: correct at scroll 0 and 300, but the
	// label ended up above the viewport, y=-335, once scrolled near the
	// bottom). Computing the clamped position directly sidesteps all of it.
	let labelCenterY = $state(0);
	let labelLeft = $state(0);
	let labelRight = $state(0);
	// Measured off whichever label is currently mounted, so the clamp below
	// knows the label's actual (responsive) height instead of a guessed
	// constant — `prev`/`next` render identically, so either one will do.
	let prevLabelEl: HTMLElement | undefined = $state();
	let nextLabelEl: HTMLElement | undefined = $state();

	function updateLabelPosition() {
		const box = wrapperEl?.getBoundingClientRect();
		if (!box) return;
		if (box.top >= 0 && box.bottom <= window.innerHeight) {
			// The whole zone already fits on screen — just center the label in
			// it. Nothing to chase the viewport for here, and it keeps the
			// label sitting in the visual middle of the zone instead of
			// pinned to whichever edge the viewport-center math below would
			// clamp it to.
			labelCenterY = (box.top + box.bottom) / 2;
			labelLeft = box.left;
			labelRight = box.right;
			return;
		}
		// The zone is taller than the viewport (or scrolled partly out of
		// it): clamp to the viewport's vertical center, but never past the
		// zone's own top/bottom — so it doesn't float outside the table (or
		// off somewhere odd).
		//
		// That clamp alone only keeps the label's *center* inside the zone —
		// the label itself (chevron + text, `-translate-y-1/2`'d around that
		// center) can still stick out past the top or bottom edge. Pull the
		// clamp in by half the label's own height to keep the whole label
		// inside. When the zone is shorter than the label, full containment
		// is impossible either way — center on the zone so it overflows
		// evenly on both sides rather than being clipped on just one.
		const halfLabel = (prevLabelEl ?? nextLabelEl)?.getBoundingClientRect().height ?? 0;
		const minY = box.top + halfLabel / 2;
		const maxY = box.bottom - halfLabel / 2;
		const target = Math.min(Math.max(window.innerHeight / 2, box.top), box.bottom);
		labelCenterY = minY <= maxY ? Math.min(Math.max(target, minY), maxY) : (box.top + box.bottom) / 2;
		labelLeft = box.left;
		labelRight = box.right;
	}

	const pageFlipThresholdMs = $derived(reorder?.pageFlipThresholdMs ?? 2000);

	function resetHoverZone() {
		if (hoverTimer) {
			clearInterval(hoverTimer);
			hoverTimer = undefined;
		}
		hoverZone = null;
		leftProgress = 0;
		rightProgress = 0;
	}

	function tickHoverZone() {
		if (!hoverZone) return;
		const elapsed = performance.now() - hoverStart;
		const progress = Math.min(1, elapsed / pageFlipThresholdMs);
		if (hoverZone === 'left') leftProgress = progress;
		else rightProgress = progress;
		if (progress >= 1) {
			if (hoverZone === 'left' && currentPage > 1) currentPage--;
			else if (hoverZone === 'right' && currentPage < totalPages) currentPage++;
			// Keep hovering to flip again — dwell time restarts from here.
			hoverStart = performance.now();
		}
	}

	function enterZone(zone: 'left' | 'right') {
		if (hoverZone === zone) return;
		if (hoverTimer) clearInterval(hoverTimer);
		hoverZone = zone;
		hoverStart = performance.now();
		leftProgress = 0;
		rightProgress = 0;
		hoverTimer = setInterval(tickHoverZone, 80);
	}

	function handleDragStart() {
		isDragging = true;
		updateLabelPosition();
		// The label divs aren't mounted yet on this first call (they only
		// render once `isDragging` flips, which Svelte applies to the DOM
		// after this synchronous call returns) — `halfLabel` above falls back
		// to 0 for this one frame. Re-run once they exist so the height-aware
		// clamp kicks in immediately rather than waiting for the next pointer
		// move or scroll.
		tick().then(updateLabelPosition);
	}

	function handleDragMove(clientX: number, clientY: number) {
		const box = wrapperEl?.getBoundingClientRect();
		if (!box || clientY < box.top || clientY > box.bottom) {
			resetHoverZone();
			return;
		}
		if (clientX >= box.left && clientX <= box.left + ZONE_WIDTH_PX) enterZone('left');
		else if (clientX <= box.right && clientX >= box.right - ZONE_WIDTH_PX) enterZone('right');
		else resetHoverZone();
	}

	// SortableJS's own `onMove` is about "should this reordering happen", not
	// general cursor tracking — it doesn't fire once the pointer strays from
	// a valid drop target (e.g. into the edge margin), so the page-flip zones
	// track the raw pointer directly via document-level listeners instead,
	// active only while a drag is in progress. `dragover` (not `mousemove`)
	// is what actually fires during a *native* HTML5 drag — which reorder
	// uses instead of the mouse-simulated fallback whenever `multiDrag` is
	// on — so both are wired up; whichever the current drag mode emits wins.
	$effect(() => {
		if (!isDragging) return;
		function onPointerMove(e: MouseEvent | TouchEvent | DragEvent) {
			updateLabelPosition();
			const point = 'touches' in e ? e.touches[0] : e;
			if (point) handleDragMove(point.clientX, point.clientY);
		}
		// Scrolling without moving the pointer (mouse wheel mid-drag, or the
		// page having scrolled before the pointer ever reaches the zone) needs
		// to reposition the label too — it's visible (at low opacity) for the
		// whole drag, not just while actively hovering a zone.
		function onScroll() {
			updateLabelPosition();
		}
		document.addEventListener('mousemove', onPointerMove);
		document.addEventListener('touchmove', onPointerMove);
		document.addEventListener('dragover', onPointerMove);
		window.addEventListener('scroll', onScroll, { passive: true });
		return () => {
			document.removeEventListener('mousemove', onPointerMove);
			document.removeEventListener('touchmove', onPointerMove);
			document.removeEventListener('dragover', onPointerMove);
			window.removeEventListener('scroll', onScroll);
		};
	});

	$effect(() => () => {
		if (hoverTimer) clearInterval(hoverTimer);
	});

	// Escape cancels the drag in progress. SortableJS only knows how to
	// finish a drag, not abort one, so this ends it the normal way (a real
	// `mouseup` is what its fallback dragging listens for — see sortable.ts)
	// and `handleReorderSettled` discards whatever it settled on instead of
	// persisting it.
	$effect(() => {
		if (!isDragging) return;
		function onKeyDown(e: KeyboardEvent) {
			if (e.key !== 'Escape') return;
			cancelReorder = true;
			// SortableJS listens for `pointerup` when the browser supports Pointer
			// Events (`options.supportPointer`, on by default) and only falls back
			// to plain `mouseup`/`touchend` otherwise — dispatch both so this
			// works regardless of which mode is active.
			document.dispatchEvent(
				new PointerEvent('pointerup', { bubbles: true, cancelable: true, pointerType: 'mouse' })
			);
			document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true, cancelable: true }));
		}
		document.addEventListener('keydown', onKeyDown);
		return () => document.removeEventListener('keydown', onKeyDown);
	});
</script>

<div class="flex flex-col gap-6">
	<div bind:this={wrapperEl} class="relative min-w-0 overflow-x-auto rounded-box border border-base-content/10">
		{#if reorderActive && isDragging && totalPages > 1}
			{#if currentPage > 1}
				<div
					data-reorder-page-zone="prev"
					class="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-primary transition-opacity duration-150 sm:w-14"
					style="opacity: {0.35 + leftProgress * 0.55}"
					aria-hidden="true"
				></div>
				<!-- Positioned via JS (`labelCenterY`/`labelLeft`, computed in
					`updateLabelPosition`), not CSS `sticky` — see that function's
					comment for why: nothing sticky-based reliably stayed within the
					viewport across the whole scroll range of a table taller than it. -->
				<div
					bind:this={prevLabelEl}
					data-reorder-page-label="prev"
					class="pointer-events-none fixed z-20 flex w-12 -translate-y-1/2 flex-col items-center
						gap-1 text-primary-content sm:w-14"
					style="top: {labelCenterY}px; left: {labelLeft}px;"
					aria-hidden="true"
				>
					<span class="text-lg leading-none drop-shadow-sm sm:text-xl">‹</span>
					<span class="text-center text-[10px] leading-tight font-semibold drop-shadow-sm sm:text-xs">
						{strings.reorderPage(currentPage - 1)}
					</span>
				</div>
			{/if}
			{#if currentPage < totalPages}
				<div
					data-reorder-page-zone="next"
					class="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-primary transition-opacity duration-150 sm:w-14"
					style="opacity: {0.35 + rightProgress * 0.55}"
					aria-hidden="true"
				></div>
				<div
					bind:this={nextLabelEl}
					data-reorder-page-label="next"
					class="pointer-events-none fixed z-20 flex w-12 -translate-y-1/2 flex-col items-center
						gap-1 text-primary-content sm:w-14"
					style="top: {labelCenterY}px; left: {labelRight - ZONE_WIDTH_PX}px;"
					aria-hidden="true"
				>
					<span class="text-lg leading-none drop-shadow-sm sm:text-xl">›</span>
					<span class="text-center text-[10px] leading-tight font-semibold drop-shadow-sm sm:text-xs">
						{strings.reorderPage(currentPage + 1)}
					</span>
				</div>
			{/if}
		{/if}
		<table class="table table-zebra table-xs w-full text-xs sm:table-md sm:text-base">
			<TableHeader
				{columns}
				{selectable}
				{allChecked}
				{someChecked}
				onToggleAll={toggleAll}
				{sort}
				{filter}
				{distinctValues}
				hasRowActions={!!rowActions}
				{actionsLabel}
				{reorderActive}
				onchange={handleHeaderChange}
			/>
			<TableBody
				{columns}
				rows={pageData}
				{selectable}
				{selected}
				onToggle={toggleItem}
				{colCount}
				{rowActions}
				reorder={reorderActive ? reorder : undefined}
				{visibleRange}
				onDragStart={handleDragStart}
				onReorder={handleReorderSettled}
			/>
		</table>
	</div>

	<Paginator
		bind:page={currentPage}
		{totalPages}
		{pageStart}
		pageSize={effectivePageSize}
		total={totalCount}
	/>
</div>
