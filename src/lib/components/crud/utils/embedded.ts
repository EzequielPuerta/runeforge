import type { FieldDefinition } from '$lib/types/crud.js';
import { fieldLabel } from './misc.js';

// Shared by emptyRecord/Update.svelte's seedFromInstance/EmbeddedField's edit
// mode: converts one raw stored value into its editable draft form, using the
// same convention everywhere — booleans and embedded arrays keep their real
// type (Field.svelte's checkbox/list binds them directly), everything else
// becomes a string since Field.svelte's other inputs bind as strings.
export function seedField<T extends object = Record<string, unknown>>(
	f: FieldDefinition<T>,
	raw: unknown
): unknown {
	if (f.type === 'boolean') return !!raw;
	if (f.type === 'file') return raw ?? null;
	if (f.type === 'embedded') return Array.isArray(raw) ? raw : [];
	if (f.type === 'multiselect' || f.type === 'tree')
		// Selected values are matched against SelectOption.value (always a
		// string), so a stored array of raw ids (e.g. numbers from JSON) must
		// be stringified the same way a scalar select's value is below —
		// otherwise `Set.has`/`Array.includes` silently never match.
		return Array.isArray(raw) ? raw.map((v) => String(v)) : [];
	return String(raw ?? '');
}

// Shared by Create.svelte and EmbeddedField.svelte: both need an empty draft
// record seeded with each field's default, keyed the same way regardless of
// whether it ends up serialized as a top-level form or as one item inside an
// embedded list.
export function emptyRecord<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[]
): Record<string, unknown> {
	return Object.fromEntries(fields.map((f) => [f.attribute, seedField(f, f.default)]));
}

// Shared by Update.svelte (loading the instance being edited) and Create.svelte
// (pre-filling a new record from a duplicated instance): builds a draft record
// from an arbitrary source object, running each field's `seed` resolver
// (falling back to the source's raw value) through the same seedField
// normalization as emptyRecord.
export function seedRecord<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[],
	source: Record<string, unknown>
): Record<string, unknown> {
	const seeded: Record<string, unknown> = { ...source };
	for (const f of fields) {
		const raw = f.seed ? f.seed(source) : source[f.attribute];
		seeded[f.attribute] = seedField(f, raw);
	}
	return seeded;
}

// Shared by Update.svelte and Create.svelte's "Duplicate" handling: returns a
// copy of the just-saved record with `omit`-listed attributes reset to their
// field default, so the new draft doesn't inherit values that only made sense
// for the original instance (e.g. a publication date).
export function applyDuplicateOmit<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[],
	record: Record<string, unknown>,
	omit: string[] = []
): Record<string, unknown> {
	if (!omit.length) return record;
	const result = { ...record };
	for (const f of fields) {
		if (omit.includes(f.attribute)) result[f.attribute] = seedField(f, f.default);
	}
	return result;
}

// Shared by defaultItemLabel and the CSV/XLSX export column expansion: renders
// one sub-field's raw stored value as display text, resolving a select's
// option label instead of its stored value. Booleans are left to the caller
// since the item-label summary and an export cell want different renderings
// (omit-when-false vs. an explicit true/false column).
export function formatEmbeddedFieldValue<T extends object = Record<string, unknown>>(
	f: FieldDefinition<T>,
	raw: unknown
): string {
	if (raw == null || raw === '') return '';
	if (f.type === 'select') return f.options?.find((o) => o.value === String(raw))?.label ?? String(raw);
	return String(raw);
}

// Default summary shown per item in an embedded list when the field has no
// `itemLabel`: joins each sub-field's resolved display value so the list is
// at least readable out of the box.
export function defaultItemLabel<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[],
	item: Record<string, unknown>
): string {
	return fields
		.map((f) => {
			const raw = item[f.attribute];
			if (f.type === 'boolean') return raw ? fieldLabel(f) : null;
			return formatEmbeddedFieldValue(f, raw) || null;
		})
		.filter((v): v is string => !!v)
		.join(' · ');
}
