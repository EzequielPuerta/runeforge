import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { chapters, addChapter, deleteChapter, setChapterOrder } from './store.js';

export const load: PageServerLoad = () => {
	// Deliberately NOT sorted by `order` — see store.ts's STORAGE_SHUFFLE —
	// so the e2e suite exercises GenericCRUD's own default sort-by-reorder-
	// attribute instead of relying on the backend having already sorted it.
	return { chapters: [...chapters] };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		if (!title) return fail(422, { error: 'Title is required' });
		addChapter(title);
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		deleteChapter(id);
		return { success: true };
	},

	reorder: async ({ request }) => {
		const data = await request.formData();
		const changes = JSON.parse(String(data.get('changes') ?? '[]')) as {
			id: string;
			value: number;
		}[];
		for (const { id, value } of changes) setChapterOrder(id, Number(value));
		return { success: true };
	}
};
