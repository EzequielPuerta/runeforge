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
