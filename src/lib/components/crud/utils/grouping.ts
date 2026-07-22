import type { FieldDefinition } from '$lib/types/crud.js';

export type FieldGroup<T extends object = Record<string, unknown>> = {
	title?: string;
	fields: FieldDefinition<T>[];
};

// Partitions a flat field list into visual groups for create/update/read
// views, based on `groupedAs`. Fields without a `groupedAs` render as their
// own single-field group (unchanged from today's flat layout). Fields sharing
// a `groupedAs` are collected together at the position of their first
// occurrence, preserving overall order.
export function groupFields<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[]
): FieldGroup<T>[] {
	const groups: FieldGroup<T>[] = [];
	const byTitle = new Map<string, FieldGroup<T>>();

	for (const field of fields) {
		if (!field.groupedAs) {
			groups.push({ fields: [field] });
			continue;
		}
		let group = byTitle.get(field.groupedAs);
		if (!group) {
			group = { title: field.groupedAs, fields: [] };
			byTitle.set(field.groupedAs, group);
			groups.push(group);
		}
		group.fields.push(field);
	}

	return groups;
}
