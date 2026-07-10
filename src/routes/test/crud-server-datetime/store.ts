import type { IEvent } from './interface.js';

const today = new Date();

const INITIAL: IEvent[] = Array.from({ length: 25 }, (_, i) => ({
	id: i + 1,
	name: `Row ${i + 1}`,
	joined: new Date(today.getFullYear(), today.getMonth(), i + 1).toISOString(),
}));

export let events: IEvent[] = INITIAL.map((e) => ({ ...e }));

export function resetEvents() {
	events = INITIAL.map((e) => ({ ...e }));
}
