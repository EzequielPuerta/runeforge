import { json } from '@sveltejs/kit';
import { resetChapters } from '../store.js';

export function GET() {
	resetChapters();
	return json({ ok: true });
}
