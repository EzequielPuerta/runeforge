import type { AttributeType, SelectOption } from '$lib/types/attribute.js';
import type { CellComponent, CellFormatter } from '$lib/types/table.js';
import type { FieldDefinition } from './fields.js';

export type ColumnDefinition<T extends object = Record<string, unknown>> = {
	[K in keyof T & string]: {
		attribute: K;
		title?: string;
		type?: AttributeType;
		component?: CellComponent<T, T[K]>;
		formatter?: CellFormatter<T, T[K]>;
		sortable?: boolean;
		filterable?: boolean;
		/** Static, exhaustive filter choices — see `AttributeMetadata.filterOptions`. */
		filterOptions?: SelectOption[];
		/** Embedded columns only: sub-field definitions for each item, used to
		 * render a default cell summary and to expand the column into one
		 * sub-column per field on CSV/XLSX export. */
		fields?: FieldDefinition<Record<string, unknown>>[];
		/** Embedded columns only: short label for an item, reused from the form
		 * field's `itemLabel` for the default cell summary. */
		itemLabel?: (item: Record<string, unknown>) => string;
	};
}[keyof T & string];
