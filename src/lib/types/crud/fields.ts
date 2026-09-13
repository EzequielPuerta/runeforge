import type { FullAutoFill } from 'svelte/elements';
import type {
	AttributeType,
	SearchResolver,
	RequiredResolver,
	DisabledResolver,
	HiddenResolver,
	EmbeddedRevalidateResolver,
	SelectOption,
	FieldButtonAction
} from '$lib/types/attribute.js';

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
	/** Resolved form of `AttributeMetadata.dependentOptions` — `data` is
	 * already baked in by `buildFieldDefinitions`, so only `record`/`parent`
	 * remain live parameters. */
	dependentOptions?: (
		record: Record<string, unknown>,
		parent?: Record<string, unknown>
	) => SelectOption[];
	search?: SearchResolver;
	disabled?: DisabledResolver;
	hidden?: boolean | HiddenResolver;
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
	/** See `AttributeMetadata.validate`. */
	validate?: (value: unknown, record: Record<string, unknown>) => string | undefined;
	/** Textarea fields only: the HTML `rows` attribute, controlling height. */
	rows?: number;
	/** Embedded fields only: sub-field definitions for each item, built from
	 * the metadata's `fields`. */
	fields?: FieldDefinition<Record<string, unknown>>[];
	/** Embedded fields only: short label for an item in the list. */
	itemLabel?: (item: Record<string, unknown>) => string;
	/** Embedded fields only: see `AttributeMetadata.revalidate`. */
	revalidate?: EmbeddedRevalidateResolver;
	/** Embedded fields only: see `AttributeMetadata.dependsOn`. */
	dependsOn?: string;
	/** Tree fields only: whether parent nodes start expanded. Defaults to `true`. */
	defaultExpanded?: boolean;
	/** Fields sharing the same `row` string render side by side. */
	row?: string;
	/** See `AttributeMetadata.actions`. */
	actions?: FieldButtonAction[];
}
