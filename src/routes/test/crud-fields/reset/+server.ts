import { json } from '@sveltejs/kit';
import { resetWidgets } from '../store.js';

export function GET() {
	resetWidgets();
	return json({ ok: true });
}
