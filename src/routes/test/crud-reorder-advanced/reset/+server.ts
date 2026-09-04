import { json } from '@sveltejs/kit';
import { resetIndicators } from '../store.js';

export function GET() {
	resetIndicators();
	return json({ ok: true });
}
