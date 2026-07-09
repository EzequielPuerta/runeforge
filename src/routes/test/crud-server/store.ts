import type { IPerson } from './interface.js';

const CITIES = ['Buenos Aires', 'Córdoba', 'Rosario', 'Mendoza', 'Tucumán'];
const NAMES = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve'];

const INITIAL: IPerson[] = Array.from({ length: 25 }, (_, i) => ({
	id: i + 1,
	name: `${NAMES[i % 5]} ${i + 1}`,
	age: 20 + (i % 40),
	city: CITIES[i % 5],
	active: i % 3 !== 0,
}));

export let people: IPerson[] = INITIAL.map((p) => ({ ...p }));

export function resetPeople() {
	people = INITIAL.map((p) => ({ ...p }));
}

export function deletePerson(id: number): boolean {
	const idx = people.findIndex((p) => p.id === id);
	if (idx < 0) return false;
	people.splice(idx, 1);
	return true;
}
