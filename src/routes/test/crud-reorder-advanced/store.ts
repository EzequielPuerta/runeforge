import type { IIndicator } from './interface.js';

// Two groups of 8 — 16 rows total, one more page than the default `pageSize`
// (10), so tests can exercise the edge-hover page-flip. `order` restarts at
// 0 within each group (like `orden` scoped to a chapter in interno-cfi), so
// the true display order is (`group`, `order`) — the `compare` prop's job.
const GROUP_LABELS = ['A', 'B'];
const PER_GROUP = 8;

const CANONICAL: IIndicator[] = [];
for (let group = 0; group < GROUP_LABELS.length; group++) {
	for (let order = 0; order < PER_GROUP; order++) {
		CANONICAL.push({
			_id: `${group}-${order}`,
			title: `${GROUP_LABELS[group]}${order}`,
			group,
			order
		});
	}
}

// Stored (and returned by `load`, see +page.server.ts) in a deliberately
// different sequence than (group, order) — genuinely exercises `compare`
// instead of piggybacking on data that already happens to arrive sorted.
const STORAGE_SHUFFLE = [8, 3, 12, 0, 15, 6, 9, 1, 11, 4, 14, 2, 7, 10, 5, 13];
const INITIAL: IIndicator[] = STORAGE_SHUFFLE.map((i) => ({ ...CANONICAL[i] }));

export let indicators: IIndicator[] = INITIAL.map((c) => ({ ...c }));
let nextId = INITIAL.length + 1;

export function resetIndicators() {
	indicators = INITIAL.map((c) => ({ ...c }));
	nextId = INITIAL.length + 1;
}

export function addIndicator(title: string): IIndicator {
	const indicator: IIndicator = { _id: String(nextId++), title, group: 0, order: indicators.length };
	indicators.push(indicator);
	return indicator;
}

export function deleteIndicator(id: string): boolean {
	const idx = indicators.findIndex((c) => c._id === id);
	if (idx < 0) return false;
	indicators.splice(idx, 1);
	return true;
}

export function setIndicatorOrder(id: string, order: number): boolean {
	const idx = indicators.findIndex((c) => c._id === id);
	if (idx < 0) return false;
	indicators[idx] = { ...indicators[idx], order };
	return true;
}
