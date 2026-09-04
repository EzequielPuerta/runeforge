import { describe, it, expect } from 'vitest';
import {
	formatBoolean,
	formatDatetime,
	formatInstance
} from '$lib/components/crud/utils/formatters.js';

describe('formatBoolean', () => {
	it('uses "Sí" / "No" as defaults', () => {
		const fmt = formatBoolean()();
		expect(fmt(true)).toBe('Sí');
		expect(fmt(false)).toBe('No');
	});
	it('accepts custom labels', () => {
		const fmt = formatBoolean('Yes', 'No')();
		expect(fmt(true)).toBe('Yes');
		expect(fmt(false)).toBe('No');
	});
});

describe('formatDatetime', () => {
	it('uses dd/mm/YYYY HH:MM as default format', () => {
		const fmt = formatDatetime()();
		expect(fmt(new Date(2024, 5, 1, 8, 30))).toBe('01/06/2024 08:30');
	});
	it('formats with a custom pattern', () => {
		const fmt = formatDatetime('dd/mm/YYYY')();
		expect(fmt(new Date(2024, 2, 15))).toBe('15/03/2024');
	});
	it('pads single-digit day and month', () => {
		const fmt = formatDatetime('dd/mm/YYYY')();
		expect(fmt(new Date(2024, 0, 5))).toBe('05/01/2024');
	});
	it('returns empty string for an invalid date', () => {
		const fmt = formatDatetime('dd/mm/YYYY')();
		expect(fmt(new Date('not-a-date'))).toBe('');
	});
	it('returns empty string for null/undefined/empty instead of epoch 0', () => {
		const fmt = formatDatetime('dd/mm/YYYY')();
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(fmt(null as any)).toBe('');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(fmt(undefined as any)).toBe('');
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect(fmt('' as any)).toBe('');
	});
	it('includes time tokens', () => {
		const fmt = formatDatetime('HH:MM:ss')();
		const d = new Date(2024, 0, 1, 14, 5, 9);
		expect(fmt(d)).toBe('14:05:09');
	});
});

describe('formatInstance', () => {
	type Item = { _id: string; name: string };
	const instances: Item[] = [
		{ _id: '1', name: 'Alpha' },
		{ _id: '2', name: 'Beta & Co.' }
	];
	const fmt = formatInstance<Item>('name', instances, '/items');

	it('renders a link with label for a known id', () => {
		const html = fmt('1');
		expect(html).toContain('href="/items?id=1"');
		expect(html).toContain('Alpha');
	});
	it('escapes HTML in label', () => {
		const html = fmt('2');
		expect(html).toContain('Beta &amp; Co.');
		expect(html).not.toContain('Beta & Co.');
	});
	it('falls back to raw id for unknown entries', () => {
		const html = fmt('99');
		expect(html).toContain('99');
	});
});
