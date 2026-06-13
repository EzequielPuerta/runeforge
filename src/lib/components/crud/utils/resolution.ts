import type { AttributeMetadata, AttributeType, SelectOption } from '$lib/types/attribute.js';

export function resolveOptions(m: AttributeMetadata, d: unknown): SelectOption[] | undefined {
  if (!m.options) return undefined;
  return typeof m.options === 'function' ? m.options(d) : m.options;
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
