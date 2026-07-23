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
  datetime: 'datetime',
  embedded: 'embedded',
} as const satisfies Record<AttributeType, AttributeType>;

export type InterfaceMetadata<T> = Partial<Record<keyof T, AttributeMetadata>>;

export type SelectOption = { value: string; label: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OptionsResolver = SelectOption[] | ((data: any) => SelectOption[]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormatterResolver = (data?: any) => CellFormatter<any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DependentOptionsResolver = (data: any, record: Record<string, unknown>) => SelectOption[];
export type SearchResolver = (query: string) => Promise<SelectOption[]>;
export type DisabledResolver = (record: Record<string, unknown>) => boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SeedResolver = (instance: any) => unknown;
/** Embedded fields only: renders a short summary for one item in the list.
 * Falls back to a dash-joined summary of the item's sub-field values. */
export type EmbeddedItemLabelResolver = (item: Record<string, unknown>) => string;

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
  seed?: SeedResolver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: CellComponent<any, any>;
  formatter?: FormatterResolver;
  required?: boolean;
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
  groupedAs?: string;
  min?: number;
  max?: number;
  integer?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  /** Embedded fields only: schema for each item added through the "+" modal. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fields?: InterfaceMetadata<any>;
  /** Embedded fields only: short label for an item in the list. */
  itemLabel?: EmbeddedItemLabelResolver;
};
