import type { Component } from 'svelte';
import type { FullAutoFill } from 'svelte/elements';
import type {
	AttributeType,
	SearchResolver,
	RequiredResolver,
	SelectOption
} from '$lib/types/attribute.js';
import type { CellComponent, CellFormatter } from '$lib/types/table.js';

export type ColumnDefinition<T extends object = Record<string, unknown>> = {
	[K in keyof T & string]: {
		attribute: K;
		title?: string;
		type?: AttributeType;
		component?: CellComponent<T, T[K]>;
		formatter?: CellFormatter<T, T[K]>;
		sortable?: boolean;
		filterable?: boolean;
		/** Embedded columns only: sub-field definitions for each item, used to
		 * render a default cell summary and to expand the column into one
		 * sub-column per field on CSV/XLSX export. */
		fields?: FieldDefinition<Record<string, unknown>>[];
		/** Embedded columns only: short label for an item, reused from the form
		 * field's `itemLabel` for the default cell summary. */
		itemLabel?: (item: Record<string, unknown>) => string;
	};
}[keyof T & string];

export interface FieldDefinition<T extends object = Record<string, unknown>> {
	attribute: keyof T & string;
	title?: string;
	type?: AttributeType;
	required?: boolean | RequiredResolver;
	autocomplete?: FullAutoFill;
	placeholder?: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	default?: any;
	options?: SelectOption[];
	dependentOptions?: (record: Record<string, unknown>) => SelectOption[];
	search?: SearchResolver;
	disabled?: (record: Record<string, unknown>) => boolean;
	hidden?: boolean | ((record: Record<string, unknown>) => boolean);
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (instance: any) => unknown;
	/** Read-only rendering only (the Read view, and any other readonly Field) */
	formatter?: (value: unknown, record: Record<string, unknown>) => string;
	groupedAs?: string;
	min?: number;
	max?: number;
	integer?: boolean;
	minLength?: number;
	maxLength?: number;
	pattern?: string;
	/** Embedded fields only: sub-field definitions for each item, built from
	 * the metadata's `fields`. */
	fields?: FieldDefinition<Record<string, unknown>>[];
	/** Embedded fields only: short label for an item in the list. */
	itemLabel?: (item: Record<string, unknown>) => string;
	/** Tree fields only: whether parent nodes start expanded. Defaults to `true`. */
	defaultExpanded?: boolean;
	/** Fields sharing the same `row` string render side by side. */
	row?: string;
}

export interface ActionConfiguration<T extends object = Record<string, unknown>> {
	enabled?: boolean;
	label?: string;
	endpoint?: string;
	confirm?: boolean;
	callback?: (items: T[]) => void | Promise<void>;
}

export interface CustomAction<T extends object = Record<string, unknown>> {
	label: string;
	/** Required unless `toggle` is set, which renders the action as a switch
	 * instead of an icon button. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	/** Renders the row action as a real daisyUI toggle switch reflecting the
	 * item's current on/off state, instead of an icon button. Takes
	 * precedence over `icon` when both are set.
	 *
	 * The switch is controlled, not editable directly: clicking it never
	 * flips its own checked state, it still just calls `run` (opening `view`
	 * or navigating via `href`) like any other action. It only visually
	 * flips once the underlying item's data actually changes — e.g. after
	 * the action's modal confirms and the list reloads. */
	toggle?: (item: T) => boolean;
	/** Extra class(es) on the row action's button/switch — e.g. to color a
	 * `toggle` by the item's own state (`toggle-success`/`toggle-error`).
	 * Pass a function to resolve it per item; a plain string applies to
	 * every row alike. */
	class?: string | ((item: T) => string);
	endpoint?: string;
	condition?: (item: T) => boolean;
	/** Renders as a modal-like panel when the action runs. Mutually exclusive
	 * with `href` — provide exactly one of the two. */
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	view?: Component<any>;
	/** Navigates to the given URL instead of opening `view`. Takes priority
	 * over `view` if both are somehow set. */
	href?: (item: T) => string;
}

export interface RowAction<T extends object = Record<string, unknown>> {
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	/** See `CustomAction.toggle` — same controlled-switch rendering. */
	toggle?: (item: T) => boolean;
	/** See `CustomAction.class`. */
	class?: string | ((item: T) => string);
	condition?: (item: T) => boolean;
	run: (item: T) => void;
}

export interface CustomBulkAction<T extends object = Record<string, unknown>> {
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
	endpoint: string;
	variant?: string;
	confirm?: boolean;
	condition?: (items: T[]) => boolean;
}

export interface SearchConfiguration {
	param?: string;
	placeholder?: string;
	debounceMs?: number;
}
