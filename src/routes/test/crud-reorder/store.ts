import type { IChapter } from './interface.js';

// 12 rows — one more than the default `pageSize` (10) — so tests can verify
// reorder mode shows the whole list unpaginated, not just the first page.
const TITLES = [
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
// Stored (and returned by `load`, see +page.server.ts) in a deliberately
// different sequence than `order` — neither insertion order nor `_id` line
// up with it — so tests genuinely exercise the client's own default sort by
// the reorder attribute, rather than piggybacking on data that already
// happens to arrive pre-sorted.
const STORAGE_SHUFFLE = [3, 7, 0, 10, 1, 5, 9, 2, 11, 4, 8, 6];
const INITIAL: IChapter[] = STORAGE_SHUFFLE.map((order, i) => ({
	_id: String(i + 1),
	title: TITLES[order],
	order
}));

export let chapters: IChapter[] = INITIAL.map((c) => ({ ...c }));
let nextId = TITLES.length + 1;

export function resetChapters() {
	chapters = INITIAL.map((c) => ({ ...c }));
	nextId = TITLES.length + 1;
}

export function addChapter(title: string): IChapter {
	const chapter: IChapter = { _id: String(nextId++), title, order: chapters.length };
	chapters.push(chapter);
	return chapter;
}

export function deleteChapter(id: string): boolean {
	const idx = chapters.findIndex((c) => c._id === id);
	if (idx < 0) return false;
	chapters.splice(idx, 1);
	return true;
}

export function setChapterOrder(id: string, order: number): boolean {
	const idx = chapters.findIndex((c) => c._id === id);
	if (idx < 0) return false;
	chapters[idx] = { ...chapters[idx], order };
	return true;
}
