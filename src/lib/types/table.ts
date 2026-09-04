import type { Component } from 'svelte';

export type SortDirection = 'asc' | 'desc';
export type IndexedRow<T> = { row: T; index: number };
/** `key` is the actual filter value (matched against row data, and sent
 * server-side as-is) — `label` is only what's displayed for it, falling back
 * to `key` when absent. They diverge for a formatted value whose match token
 * isn't human text, e.g. a boolean column's `key: 'true'` paired with
 * `label: 'Sí'` from the column's formatter. */
export type DistinctEntry<T> = { key: string; label?: string; row: T };

export interface CellProps<T extends object = Record<string, unknown>, V = unknown> {
	value: V;
	row: T;
}

export type CellComponent<T extends object = Record<string, unknown>, V = unknown> = Component<
	CellProps<T, V>
>;

export type CellFormatter<T extends object = Record<string, unknown>, V = unknown> = (
	value: CellProps<T, V>['value'],
	row: CellProps<T, V>['row']
) => string;

export interface PaginatedEnvelope<T> {
	results: T[];
	count: number;
	page: number;
	pageSize: number;
}

export interface ServerPagination {
	page: number;
	totalPages: number;
	total: number;
	pageSize: number;
}

export interface FilterSnapshot {
	text: Record<string, string>;
	values: Record<string, string[]>;
	dateRanges: Record<string, { from: string; to: string }>;
}

export interface TableQuery {
	page: number;
	ordering: string | null;
	filters: FilterSnapshot;
}

/** An instance created by `SortableModule.create()` — the only bit of it
 * runeforge ever touches directly. */
export interface SortableInstance {
	destroy(): void;
}

/** Programmatic selection API SortableJS's `MultiDrag` plugin exposes as
 * `Sortable.utils` — used to mirror this table's own row-selection
 * (checkboxes) into the plugin's selection state, so `multiDrag` drags
 * whatever's currently checked instead of relying on its own click/modifier
 * based selection UX. */
export interface SortableUtils {
	select(element: HTMLElement): void;
	deselect(element: HTMLElement): void;
}

/** Minimal duck-typed subset of the `sortablejs` module API used to drive
 * drag-to-reorder. Runeforge never imports `sortablejs` itself — install it
 * separately and pass the resolved default export in via `reorder.sortable`
 * (or `ReorderConfiguration.sortable` on `GenericCRUD`), so the dependency
 * stays fully optional, mirroring `xlsx` for export. Pass `MultiDrag`
 * pre-mounted (`Sortable.mount(new MultiDrag())`) on the module you hand in
 * if you're using `multiDrag`. */
export interface SortableModule {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	create(element: HTMLElement, options?: Record<string, any>): SortableInstance;
	utils?: SortableUtils;
}

/** Enables the drag-to-reorder row layer on `PaginatedTable`/`TableBody`.
 * Presence of this object is what turns dragging on — per-column filtering
 * is suppressed while it's active (dragging needs the full, unfiltered row
 * set reachable), and row order is fully owned by `compare`/`attribute`
 * rather than column-header sorting. Pagination stays on; crossing a page
 * boundary mid-drag is done via the edge hover zones (see
 * `pageFlipThresholdMs`), not by disabling pagination. */
export interface ReorderOptions<T extends object = Record<string, unknown>> {
	/** The attribute establishing the default ascending order, used when
	 * `compare` is not provided. */
	attribute: keyof T & string;
	/** Resolved `sortablejs` module — see the interface doc above. */
	sortable: SortableModule;
	/** Overrides the plain `attribute`-ascending order for cases where the
	 * true resting order depends on more than the row's own attribute (e.g.
	 * a parent's order first, then this row's own order within it). Takes
	 * full ownership of row order while reorder is active. */
	compare?: (a: T, b: T) => number;
	/** Drag-handle icon shown at the start of each row. Falls back to the
	 * active icon set's `grip` icon. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	/** Lets dragging one row of the current checkbox selection move the
	 * whole selection together, via SortableJS's `MultiDrag` plugin (must be
	 * mounted on the `sortable` module you pass in). Off by default. */
	multiDrag?: boolean;
	/** While dragging, hovering the pointer over the narrow zone at either
	 * edge of the table for this long flips to the previous/next page —
	 * lets a row travel across pages without an unwieldy long drag. Repeated
	 * hovering (without leaving the zone) keeps flipping. Default `2000`. */
	pageFlipThresholdMs?: number;
}
