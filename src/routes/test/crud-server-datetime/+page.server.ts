import type { PageServerLoad } from './$types';
import { events } from './store.js';

const PAGE_SIZE = 10;

export const load: PageServerLoad = ({ url }) => {
	let rows = [...events];

	const from = url.searchParams.get('joined_from');
	if (from) rows = rows.filter((e) => e.joined.slice(0, 10) >= from);

	const to = url.searchParams.get('joined_to');
	if (to) rows = rows.filter((e) => e.joined.slice(0, 10) <= to);

	const count = rows.length;
	const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
	const start = (page - 1) * PAGE_SIZE;
	const results = rows.slice(start, start + PAGE_SIZE);

	return { events: { results, count, page, pageSize: PAGE_SIZE } };
};
