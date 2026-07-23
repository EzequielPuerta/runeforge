import type { Component } from 'svelte';
import type { FullAutoFill } from 'svelte/elements';
import type { AttributeType, SearchResolver, RequiredResolver } from '$lib/types/attribute.js';
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
	options?: { value: string; label: string }[];
	dependentOptions?: (record: Record<string, unknown>) => { value: string; label: string }[];
	search?: SearchResolver;
	disabled?: (record: Record<string, unknown>) => boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	seed?: (instance: any) => unknown;
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
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon: any;
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
	icon: any;
	class?: string;
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
