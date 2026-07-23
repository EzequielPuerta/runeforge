import type { IWidget } from './interface.js';

const INITIAL: IWidget[] = [
	{
		_id: '1',
		name: 'Widget A',
		code: 'ABC123',
		unlimited: false,
		quantity: 10,
		notes: 'Initial stock',
		owner: ''
	},
	{
		_id: '2',
		name: 'Widget B',
		code: 'XYZ789',
		unlimited: true,
		quantity: 1,
		notes: 'No cap on stock',
		owner: ''
	}
];

export interface IOwner {
	id: string;
	name: string;
}

// A "database" of owners much bigger than what any page prefetches — mirrors
// a real app where a select field can't just list every possible option.
const OWNERS: IOwner[] = [
	{ id: '1', name: 'Ada Lovelace' },
	{ id: '2', name: 'Alan Turing' },
	{ id: '3', name: 'Grace Hopper' },
	{ id: '4', name: 'Katherine Johnson' },
	{ id: '5', name: 'Margaret Hamilton' },
	// Deliberately excluded from PREFETCHED_OWNERS below: only reachable
	// through `searchOwners`, exercising the async-search path.
	{ id: '6', name: 'Nadia Wide' }
];

export const PREFETCHED_OWNERS = OWNERS.slice(0, 5);

export function searchOwners(query: string): IOwner[] {
	const q = query.trim().toLowerCase();
	if (!q) return [];
	return OWNERS.filter((o) => o.name.toLowerCase().includes(q));
}

export let widgets: IWidget[] = INITIAL.map((w) => ({ ...w }));
let nextId = 3;

export function resetWidgets() {
	widgets = INITIAL.map((w) => ({ ...w }));
	nextId = 3;
}

export function addWidget(widget: Omit<IWidget, '_id'>): IWidget {
	const created: IWidget = { _id: String(nextId++), ...widget };
	widgets.push(created);
	return created;
}

export function updateWidget(id: string, widget: Omit<IWidget, '_id'>): boolean {
	const idx = widgets.findIndex((w) => w._id === id);
	if (idx < 0) return false;
	widgets[idx] = { _id: id, ...widget };
	return true;
}

export function deleteWidget(id: string): boolean {
	const idx = widgets.findIndex((w) => w._id === id);
	if (idx < 0) return false;
	widgets.splice(idx, 1);
	return true;
}
