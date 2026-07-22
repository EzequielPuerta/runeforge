import type { IWidget } from './interface.js';

const INITIAL: IWidget[] = [
	{
		_id: '1',
		name: 'Widget A',
		code: 'ABC123',
		unlimited: false,
		quantity: 10,
		notes: 'Initial stock'
	},
	{
		_id: '2',
		name: 'Widget B',
		code: 'XYZ789',
		unlimited: true,
		quantity: 1,
		notes: 'No cap on stock'
	}
];

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
