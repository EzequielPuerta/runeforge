import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import {
	widgets,
	addWidget,
	updateWidget,
	deleteWidget,
	PREFETCHED_OWNERS,
	searchOwners
} from './store.js';

export const load: PageServerLoad = ({ url }) => {
	const id = url.searchParams.get('id');
	const widget = id ? widgets.find((w) => w._id === id) : undefined;
	return { widgets, widget, owners: PREFETCHED_OWNERS };
};

function widgetFromFormData(data: FormData) {
	let adjustments: { kind: string; amount: number }[];
	try {
		adjustments = JSON.parse(String(data.get('adjustments') ?? '[]'));
	} catch {
		adjustments = [];
	}
	let tags: string[];
	try {
		tags = JSON.parse(String(data.get('tags') ?? '[]'));
	} catch {
		tags = [];
	}
	let categories: string[];
	try {
		categories = JSON.parse(String(data.get('categories') ?? '[]'));
	} catch {
		categories = [];
	}

	return {
		name: String(data.get('name') ?? '').trim(),
		code: String(data.get('code') ?? '').trim(),
		unlimited: data.has('unlimited'),
		quantity: Number(data.get('quantity') ?? 0),
		notes: String(data.get('notes') ?? '').trim(),
		owner: String(data.get('owner') ?? '').trim(),
		adjustments,
		visibility: String(data.get('visibility') ?? 'basic').trim(),
		internalNote: String(data.get('internalNote') ?? '').trim(),
		tags,
		categories
	};
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const widget = widgetFromFormData(data);
		if (!widget.name) return fail(422, { error: 'Name is required' });
		addWidget(widget);
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const widget = widgetFromFormData(data);
		if (!widget.name) return fail(422, { error: 'Name is required' });
		const ok = updateWidget(id, widget);
		if (!ok) return fail(404, { error: 'Widget not found' });
		return { success: true };
	},

	delete: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		deleteWidget(id);
		return { success: true };
	},

	searchOwners: async ({ request }) => {
		const data = await request.formData();
		const query = String(data.get('query') ?? '');
		return { owners: searchOwners(query) };
	}
};
