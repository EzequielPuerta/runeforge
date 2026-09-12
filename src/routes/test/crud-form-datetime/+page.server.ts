import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types.js';
import { appointments, addAppointment, updateAppointment } from './store.js';

export const load: PageServerLoad = ({ url }) => {
	const id = url.searchParams.get('id');
	const appointment = id ? appointments.find((a) => a.id === id) : undefined;
	return { appointments, appointment };
};

function appointmentFromFormData(data: FormData) {
	return {
		title: String(data.get('title') ?? '').trim(),
		scheduled: String(data.get('scheduled') ?? '').trim(),
		followUp: String(data.get('followUp') ?? '').trim()
	};
}

export const actions: Actions = {
	create: async ({ request }) => {
		const data = await request.formData();
		const appointment = appointmentFromFormData(data);
		if (!appointment.title) return fail(422, { error: 'Title is required' });
		addAppointment(appointment);
		return { success: true };
	},

	update: async ({ request }) => {
		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const appointment = appointmentFromFormData(data);
		if (!appointment.title) return fail(422, { error: 'Title is required' });
		const ok = updateAppointment(id, appointment);
		if (!ok) return fail(404, { error: 'Appointment not found' });
		return { success: true };
	}
};
