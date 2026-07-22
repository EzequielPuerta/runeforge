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
  | 'datetime';

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
} as const satisfies Record<AttributeType, AttributeType>;

export type InterfaceMetadata<T> = Partial<Record<keyof T, AttributeMetadata>>;

export type SelectOption = { value: string; label: string };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type OptionsResolver = SelectOption[] | ((data: any) => SelectOption[]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type FormatterResolver = (data?: any) => CellFormatter<any, any>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DependentOptionsResolver = (data: any, record: Record<string, unknown>) => SelectOption[];
export type DisabledResolver = (record: Record<string, unknown>) => boolean;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SeedResolver = (instance: any) => unknown;

export type AttributeMetadata = {
  label?: string;
  type?: AttributeType;
  options?: OptionsResolver;
  dependentOptions?: DependentOptionsResolver;
  disabled?: DisabledResolver;
  seed?: SeedResolver;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  component?: CellComponent<any, any>;
  formatter?: FormatterResolver;
  required?: boolean;
  autocomplete?: FullAutoFill;
  placeholder?: string;
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
};
