import type { AttributeMetadata, AttributeType, SelectOption } from '$lib/types/attribute.js';
import type { FieldDefinition } from '$lib/types/crud.js';

export function resolveOptions(m: AttributeMetadata, d: unknown): SelectOption[] | undefined {
  if (!m.options) return undefined;
  return typeof m.options === 'function' ? m.options(d) : m.options;
}

export function resolveDefault(m: AttributeMetadata, d: unknown): unknown {
  return typeof m.default === 'function' ? m.default(d) : m.default;
}

export function resolveFormatter(m: AttributeMetadata, d: unknown) {
  return m.formatter?.(d);
}

export function inferType(key: string, value: unknown): AttributeType {
  if (typeof value === 'boolean') return 'boolean';
  if (typeof value === 'number') return 'number';
  const k = key.toLowerCase();
  if (k.includes('email')) return 'email';
  if (k.includes('password') || k.includes('hash')) return 'password';
  if (k.includes('description') || k.includes('bio') || k.includes('notes') || k.includes('content')) return 'textarea';
  return 'text';
}

// Shared by GenericCRUD's create/read/update field resolution: they only
// differ in which `excludedFromX` flag gates a field, so any metadata
// property added here is automatically threaded through all three views
// instead of needing to be copied into three near-identical blocks.
export function buildFieldDefinitions<T extends object = Record<string, unknown>>(
  meta: Partial<Record<string, AttributeMetadata>>,
  data: unknown,
  excludedFlag: 'excludedFromCreate' | 'excludedFromRead' | 'excludedFromUpdate',
  excluded: Set<string>
): FieldDefinition<T>[] {
  return (Object.entries(meta) as [string, AttributeMetadata][])
    .filter(([k, m]) => !excluded.has(k) && !m[excludedFlag])
    .map(([k, m]) => ({
      attribute: k as keyof T & string,
      title: m.label,
      type: m.type ?? inferType(k, undefined),
      required: m.required,
      autocomplete: m.autocomplete,
      placeholder: m.placeholder,
      default: resolveDefault(m, data),
      options: resolveOptions(m, data),
      dependentOptions: m.dependentOptions
        ? (record: Record<string, unknown>) => m.dependentOptions!(data, record)
        : undefined,
      search: m.search,
      disabled: m.disabled,
      seed: m.seed,
      groupedAs: m.groupedAs,
      min: m.min,
      max: m.max,
      integer: m.integer,
      minLength: m.minLength,
      maxLength: m.maxLength,
      pattern: m.pattern,
      fields: m.fields
        ? buildFieldDefinitions(m.fields, data, excludedFlag, new Set())
        : undefined,
      itemLabel: m.itemLabel
    }));
}
