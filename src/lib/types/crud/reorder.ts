import type { SortableModule } from '$lib/types/table.js';

/** Turns on drag-to-reorder rows in the list view — off by default, enabled
 * by providing this object (`enabled: false` keeps the configuration in
 * place but disables dragging, e.g. temporarily). Not supported alongside
 * [server-side pagination](#server-side-pagination-sorting--filtering): the
 * whole row set needs to be reachable client-side for indices to stay
 * meaningful, so `reorder` is ignored whenever a `PaginatedEnvelope` is used. */
export interface ReorderConfiguration<T extends object = Record<string, unknown>> {
	enabled?: boolean;
	/** The attribute that stores each row's order index. Establishes the
	 * default ascending order (when `compare` is absent) and is written to
	 * its new sequential 0-based value on every row whose position changes
	 * after a drag. */
	attribute: keyof T & string;
	/** Resolved `sortablejs` default export, e.g. `import Sortable from
	 * 'sortablejs'`. Runeforge never bundles `sortablejs` itself — install it
	 * separately and pass it in, so the dependency stays fully optional. */
	sortable: SortableModule;
	/** Overrides the plain `attribute`-ascending order for composite orders
	 * — e.g. a row's true resting position depends first on a related
	 * record's own order, and only then on this row's `attribute`. Takes
	 * full ownership of row order while reorder is active (column-header
	 * sorting is unavailable, same as the plain `attribute` case). */
	compare?: (a: T, b: T) => number;
	/** POSTed once per drag that settles with at least one changed row — a
	 * single request, not one per row — then the list is refreshed. FormData
	 * field `changes` carries a JSON-encoded array of `{ id, value }` pairs,
	 * one per row whose `attribute` changed (`value` being its new
	 * sequential position). Provide this or `callback`. */
	endpoint?: string;
	/** Alternative to `endpoint`: receives the rows whose `attribute` value
	 * changed, already updated to their new index. */
	callback?: (items: T[]) => void | Promise<void>;
	/** Drag-handle icon shown at the start of each row. Falls back to the
	 * active icon set's `grip` icon. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	/** Lets dragging one row of the current checkbox selection move the
	 * whole selection together, via SortableJS's `MultiDrag` plugin (must be
	 * mounted on the `sortable` module you pass in). Off by default. */
	multiDrag?: boolean;
	/** While dragging, hovering over the edge zone for this long flips a
	 * page instead of requiring one long drag across the whole list.
	 * Default `2000`. */
	pageFlipThresholdMs?: number;
}
