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
			if (raw == null || raw === '') return null;
			if (f.type === 'select')
				return f.options?.find((o) => o.value === String(raw))?.label ?? String(raw);
			if (f.type === 'boolean') return raw ? fieldLabel(f) : null;
			return String(raw);
		})
		.filter((v): v is string => !!v)
		.join(' · ');
}
