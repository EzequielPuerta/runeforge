import type { FullAutoFill } from 'svelte/elements';
import type { CellComponent, CellFormatter } from '$lib/types/table.js';

export type AttributeType = 'text'
  | 'email'
  | 'password'
  | 'number'
  | 'boolean'
  | 'textarea'
  | 'file'
  | 'select'
  | 'multiselect'
  | 'tree'
  | 'datetime'
  | 'embedded';

export const AttributeType = {
  text: 'text',
  email: 'email',
  password: 'password',
  number: 'number',
  boolean: 'boolean',
  textarea: 'textarea',
  file: 'file',
  select: 'select',
  multiselect: 'multiselect',
  tree: 'tree',
  datetime: 'datetime',
  embedded: 'embedded',
} as const satisfies Record<AttributeType, AttributeType>;

export type InterfaceMetadata<T> = Partial<Record<keyof T, AttributeMetadata>>;

/** `parentValue` is only used by `tree` fields, to link a node to its parent's
 * `value` (or omit/`null` for a root node) — `select`/`multiselect` ignore it. */
export type SelectOption = { value: string; label: string; parentValue?: string | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OptionsResolver = SelectOption[] | ((data: any) => SelectOption[]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormatterResolver = (data?: any) => CellFormatter<any, any>;
/** `parent` is only ever populated for a sub-field nested inside an
 * `embedded` field — the outer form's own record, distinct from `record`
 * (the embedded item's own draft). Undefined for a top-level field. */
export type DependentOptionsResolver = (
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	data: any,
	record: Record<string, unknown>,
	parent?: Record<string, unknown>
) => SelectOption[];
export type SearchResolver = (query: string) => Promise<SelectOption[]>;
/** See `DependentOptionsResolver` re: `parent`. */
export type DisabledResolver = (record: Record<string, unknown>, parent?: Record<string, unknown>) => boolean;
/** See `DependentOptionsResolver` re: `parent`. */
export type HiddenResolver = (record: Record<string, unknown>, parent?: Record<string, unknown>) => boolean;
/** See `DependentOptionsResolver` re: `parent`. */
export type RequiredResolver = (record: Record<string, unknown>, parent?: Record<string, unknown>) => boolean;
/** Embedded fields only: called once right after the parent record's
 * `dependsOn` attribute changes value (not on every parent mutation) —
 * receives the embedded list's current items and the parent record, and
 * returns the list that should replace it. Return the same array reference
 * unchanged when nothing needs to happen; a new array (e.g. `items.filter(…)`)
 * prunes/adjusts now-invalid items instead of leaving them silently stale. */
export type EmbeddedRevalidateResolver = (
	items: Record<string, unknown>[],
	parent: Record<string, unknown>
) => Record<string, unknown>[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SeedResolver = (instance: any) => unknown;
/** Embedded fields only: renders a short summary for one item in the list.
 * Falls back to a dash-joined summary of the item's sub-field values. */
export type EmbeddedItemLabelResolver = (item: Record<string, unknown>) => string;
export type ValidateResolver = (
	value: unknown,
	record: Record<string, unknown>
) => string | undefined;
/** Sets a field's value from within a `FieldButtonAction.run` callback —
 * usually the same field the button sits next to, but any sibling attribute
 * works too. */
export type FieldSetter = (attribute: string, value: unknown) => void;
/** A button rendered next to a field's label that runs entirely client-side
 * — no submit, no request — instead of persisting a model attribute of its
 * own. See `AttributeMetadata.actions`. */
export type FieldButtonAction = {
	label: string;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	icon?: any;
	class?: string;
	/** Hide the button in certain conditions. Re-evaluated live, same as `disabled`. */
	condition?: (record: Record<string, unknown>) => boolean;
	/** Receives the field's current value, the form's full draft record, and a
	 * setter to write back into this field (or a sibling one). */
	run: (value: unknown, record: Record<string, unknown>, setField: FieldSetter) => void;
};

export type AttributeMetadata = {
  label?: string;
  type?: AttributeType;
  options?: OptionsResolver;
  dependentOptions?: DependentOptionsResolver;
  /** Select fields only: fetch options matching what the user typed (e.g. a
   * server-side search) instead of filtering the (possibly partial) `options`
   * list in memory. Leave unset to keep the default in-memory filtering. */
  search?: SearchResolver;
  disabled?: DisabledResolver;
  /** Pass a function to remove a field from the form entirely (not rendered,
   * not validated, not submitted) based on the current draft record — unlike
   * `disabled`, which keeps the input visible but greyed out. Re-evaluated
   * live as sibling fields change, same signature as `disabled`. */
  hidden?: boolean | HiddenResolver;
  seed?: SeedResolver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: CellComponent<any, any>;
  /** Formats the raw value everywhere it's displayed read-only: the list
   * column's cell, the Read view's field, and any other readonly Field. */
  formatter?: FormatterResolver;
  /** List column only: truncates the cell's text to this many characters,
   * appending an ellipsis, applied to `formatter`'s output (or, absent one,
   * the raw stringified value) — the Read view and Create/Update forms
   * always show the untruncated value. Handy for a long free-text column
   * that would otherwise blow out the table's width. */
  truncateUpTo?: number;
  /** Pass a function to require a field only in certain conditions, e.g. a
   * quantity that only applies to some of a select's options. */
  required?: boolean | RequiredResolver;
  autocomplete?: FullAutoFill;
  placeholder?: string;
  /** Initial value on the create form. Pass a plain value, or a function of
   * `data` (e.g. to default a select to an option derived from prefetched
   * data) evaluated once when the create fields are resolved. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default?: any;
  excludedFromList?: boolean;
  excludedFromCreate?: boolean;
  excludedFromUpdate?: boolean;
  excludedFromRead?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  /** List column filter only: a static, exhaustive set of choices shown in
   * the column filter's checkbox list, instead of the values sampled off
   * currently loaded rows. For a bounded, known set (e.g. an enum-like text
   * column) that the loaded page might not fully represent — especially
   * under [server-side pagination](#server-side-pagination-sorting--filtering),
   * where the sample is only a handful of values off the current page. `value`
   * is matched against the rendered cell text (and sent server-side as-is);
   * `label` is only what's displayed, falling back to `value`. */
  filterOptions?: SelectOption[];
  groupedAs?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** Custom validation, run after this field's built-in rules
   * (required/min/max/minLength/maxLength/pattern) pass, and only when none
   * of them already failed. Receives the field's submitted value and the
   * full draft record (including sibling fields currently in the form), so
   * the same hook covers a lone-field rule and a cross-field rule alike —
   * e.g. an `extension_date` that must be later than the record's
   * `submission_date`. Return an error message, or `undefined` when the
   * value is valid. */
  validate?: ValidateResolver;
  /** Textarea fields only: the HTML `rows` attribute, controlling height. */
  rows?: number;
  /** Embedded fields only: schema for each item added through the "+" modal. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: InterfaceMetadata<any>;
  /** Embedded fields only: short label for an item in the list. */
  itemLabel?: EmbeddedItemLabelResolver;
  /** Embedded fields only: re-derives the embedded list whenever the parent
   * record's `dependsOn` attribute changes — see `EmbeddedRevalidateResolver`.
   * Requires `dependsOn`; ignored without it. */
  revalidate?: EmbeddedRevalidateResolver;
  /** Embedded fields only: parent record attribute that `revalidate` reacts
   * to. Only that one attribute is watched — changes to anything else in the
   * parent record don't trigger `revalidate`. */
  dependsOn?: string;
  /** Tree fields only: whether parent nodes start expanded. Defaults to `true`. */
  defaultExpanded?: boolean;
  /** Fields sharing the same `row` string render side by side on desktop and
   * stacked on mobile — see the Field rows section. Only merges fields that
   * are also in the same `groupedAs` bucket (or both ungrouped). */
  row?: string;
  /** Extra buttons rendered next to this field's label — e.g. a "Capitalize"
   * button that transforms the field's own value client-side. See "Field
   * actions" in the README. */
  actions?: FieldButtonAction[];
};
