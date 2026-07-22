import type { FieldDefinition } from '$lib/types/crud.js';
import { fieldLabel } from './misc.js';
import type { RuneforgeStrings } from '$lib/i18n/types.js';

// Shared by Create.svelte/Update.svelte's client-side pre-submit check. Errors
// are surfaced through the same `fieldErrors` mechanism already used for
// `required`, not native HTML5 constraint validation, so every message is
// styled consistently regardless of which rule failed.
export function validateAll<T extends object = Record<string, unknown>>(
	fields: FieldDefinition<T>[],
	formData: FormData,
	strings: RuneforgeStrings
): Record<string, string> {
	const errors: Record<string, string> = {};

	for (const field of fields) {
		const val = String(formData.get(field.attribute) ?? '').trim();

		if (field.required && !val) {
			errors[field.attribute] = strings.required(fieldLabel(field));
			continue;
		}
		if (!val) continue;

		if (field.type === 'number') {
			const num = Number(val);
			if (Number.isNaN(num)) {
				errors[field.attribute] = strings.invalidNumber(fieldLabel(field));
			} else if (field.integer && !Number.isInteger(num)) {
				errors[field.attribute] = strings.integer(fieldLabel(field));
			} else if (field.min != null && num < field.min) {
				errors[field.attribute] = strings.min(fieldLabel(field), field.min);
			} else if (field.max != null && num > field.max) {
				errors[field.attribute] = strings.max(fieldLabel(field), field.max);
			}
		} else {
			if (field.minLength != null && val.length < field.minLength) {
				errors[field.attribute] = strings.minLength(fieldLabel(field), field.minLength);
			} else if (field.maxLength != null && val.length > field.maxLength) {
				errors[field.attribute] = strings.maxLength(fieldLabel(field), field.maxLength);
			} else if (field.pattern && !new RegExp(field.pattern).test(val)) {
				errors[field.attribute] = strings.pattern(fieldLabel(field));
			}
		}
	}

	return errors;
}
