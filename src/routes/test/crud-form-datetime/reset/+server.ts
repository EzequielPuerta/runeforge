import { json } from '@sveltejs/kit';
import { resetAppointments } from '../store.js';

export function GET() {
	resetAppointments();
	return json({ ok: true });
}
