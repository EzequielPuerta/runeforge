import type { Actions, PageServerLoad } from './$types';
import { compare } from '$lib/components/table/utils.js';
import { people, deletePerson } from './store.js';

// Simulates a paginated backend (DRF-style: page/ordering/per-column query
// params) so server-mode GenericCRUD can be exercised without a real API.
const PAGE_SIZE = 5;

export const load: PageServerLoad = ({ url }) => {
	let rows = [...people];

	const name = url.searchParams.get('name');
	if (name) rows = rows.filter((p) => p.name.toLowerCase().includes(name.toLowerCase()));

	const city = url.searchParams.get('city');
	if (city) rows = rows.filter((p) => p.city.toLowerCase().includes(city.toLowerCase()));

	const active = url.searchParams.get('active');
	if (active) {
		const wanted = new Set(active.split(','));
		rows = rows.filter((p) => wanted.has(String(p.active)));
	}

	const ordering = url.searchParams.get('ordering');
	if (ordering) {
		const desc = ordering.startsWith('-');
		const field = (desc ? ordering.slice(1) : ordering) as keyof (typeof rows)[number];
		rows = [...rows].sort((a, b) => (desc ? -1 : 1) * compare(a[field], b[field]));
	}

	const count = rows.length;
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const start = (page - 1) * PAGE_SIZE;
	const results = rows.slice(start, start + PAGE_SIZE);

	return { people: { results, count, page, pageSize: PAGE_SIZE } };
};

export const actions: Actions = {
	delete: async ({ request }) => {
		const data = await request.formData();
		const id = Number(data.get('id') ?? '');
		deletePerson(id);
		return { success: true };
	},
};
