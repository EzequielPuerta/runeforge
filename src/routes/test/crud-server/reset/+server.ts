import { json } from '@sveltejs/kit';
import { resetPeople } from '../store.js';

export function GET() {
	resetPeople();
	return json({ ok: true });
}
