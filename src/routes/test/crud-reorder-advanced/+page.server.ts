import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { indicators, addIndicator, deleteIndicator, setIndicatorOrder } from './store.js';

export const load: PageServerLoad = () => {
	// Deliberately NOT sorted — see store.ts's STORAGE_SHUFFLE — so the e2e
	// suite exercises GenericCRUD's own `compare`-driven default order.
	return { indicators: [...indicators] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		if (!title) return fail(422, { error: 'Title is required' });
		addIndicator(title);
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		deleteIndicator(id);
		return { success: true };
	},

	reorder: async ({ request }) => {
		const data = await request.formData();
		const changes = JSON.parse(String(data.get('changes') ?? '[]')) as {
			id: string;
			value: number;
		}[];
		for (const { id, value } of changes) setIndicatorOrder(id, Number(value));
		return { success: true };
	}
};
