import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { tasks, addTask, updateTask, deleteTask } from './store.js';

export const load: PageServerLoad = ({ url }) => {
	const id = url.searchParams.get('id');
	const task = id ? tasks.find((t) => t._id === id) : undefined;
	return { tasks, task };
};

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const title = String(data.get('title') ?? '').trim();
		if (!title) return fail(422, { error: 'Title is required' });
		addTask(title, String(data.get('description') ?? ''));
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const title = String(data.get('title') ?? '').trim();
		if (!title) return fail(422, { error: 'Title is required' });
		const ok = updateTask(id, title, String(data.get('description') ?? ''));
		if (!ok) return fail(404, { error: 'Task not found' });
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		deleteTask(id);
		return { success: true };
	},
};
