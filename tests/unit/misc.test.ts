import { describe, it, expect } from 'vitest';
import { fieldLabel, initials } from '$lib/components/crud/utils/misc.js';

describe('fieldLabel', () => {
	it('returns title when provided', () => {
		expect(fieldLabel({ attribute: 'first_name', title: 'First Name' })).toBe('First Name');
	});
	it('replaces underscores with spaces when no title', () => {
		expect(fieldLabel({ attribute: 'first_name' })).toBe('first name');
	});
	it('returns the attribute as-is when no underscores and no title', () => {
		expect(fieldLabel({ attribute: 'email' })).toBe('email');
	});
});

describe('initials', () => {
	it('returns uppercase initials from first and last name', () => {
		expect(initials('Alice', 'Brown')).toBe('AB');
	});
	it('returns single initial when only one name is provided', () => {
		expect(initials('Alice')).toBe('A');
		expect(initials(undefined, 'Brown')).toBe('B');
	});
	it('returns "?" when both names are absent', () => {
		expect(initials()).toBe('?');
		expect(initials('', '')).toBe('?');
	});
	it('trims whitespace before extracting initials', () => {
		expect(initials('  Alice', '  Brown')).toBe('AB');
	});
});
