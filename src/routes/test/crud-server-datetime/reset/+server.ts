import { json } from '@sveltejs/kit';
import { resetEvents } from '../store.js';

export function GET() {
	resetEvents();
	return json({ ok: true });
}
