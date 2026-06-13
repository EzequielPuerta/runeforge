import { json } from '@sveltejs/kit';
import { resetTasks } from '../store.js';

export function GET() {
	resetTasks();
	return json({ ok: true });
}
