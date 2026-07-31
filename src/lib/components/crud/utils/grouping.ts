import type { FieldDefinition } from '$lib/types/crud.js';

export type FieldRow<T extends object = Record<string, unknown>> = FieldDefinition<T>[];

export type FieldGroup<T extends object = Record<string, unknown>> = {
	title?: string;
	rows: FieldRow<T>[];
};

// Partitions a flat field list into visual groups for create/update/read
// views, based on `groupedAs`, and each group's fields into rows, based on
// `row`. A field without `groupedAs` renders as its own single-field group
// (unchanged from today's flat layout) unless it shares a `row` with another
// ungrouped field, in which case they share that anonymous group. Fields
// sharing a `groupedAs` are collected together at the position of their first
// occurrence, preserving overall order; within that group, fields sharing a
// `row` are collected into the same row. A `row` never merges fields across
// two different `groupedAs` groups.
export function groupFields<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[]
): FieldGroup<T>[] {
	const groups: FieldGroup<T>[] = [];
	const byTitle = new Map<string, FieldGroup<T>>();
	const byUngroupedRow = new Map<string, FieldGroup<T>>();

	for (const field of fields) {
		let group: FieldGroup<T> | undefined;

		if (field.groupedAs) {
			group = byTitle.get(field.groupedAs);
			if (!group) {
				group = { title: field.groupedAs, rows: [] };
				byTitle.set(field.groupedAs, group);
				groups.push(group);
			}
		} else if (field.row) {
			group = byUngroupedRow.get(field.row);
			if (!group) {
				group = { rows: [] };
				byUngroupedRow.set(field.row, group);
				groups.push(group);
			}
		} else {
			group = { rows: [] };
			groups.push(group);
		}

		const existingRow = field.row ? group.rows.find((r) => r[0]?.row === field.row) : undefined;
		if (existingRow) {
			existingRow.push(field);
		} else {
			group.rows.push([field]);
		}
	}

	return groups;
}
