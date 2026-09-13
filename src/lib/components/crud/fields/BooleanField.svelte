<script lang="ts" generics="T extends object = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import type { FieldDefinition } from '$lib/types/crud/fields.js';

	let {
		field,
		record = $bindable({} as Record<string, unknown>),
		parentRecord = undefined,
		readonly = false,
		labelRow,
		errorRow
	}: {
		field: FieldDefinition<T>;
		record?: Record<string, unknown>;
		parentRecord?: Record<string, unknown>;
		readonly?: boolean;
		labelRow: Snippet;
		errorRow: Snippet;
	} = $props();

	const name = $derived(readonly ? undefined : field.attribute);
	const saved = $derived(record[field.attribute]);
	const fieldDisabled = $derived(field.disabled ? field.disabled(record, parentRecord) : false);
</script>

{@render labelRow()}
<input
	type="checkbox"
	id={field.attribute}
	{name}
	class="toggle toggle-primary"
	checked={!!saved}
	disabled={readonly || fieldDisabled}
	onchange={(e) => {
		record[field.attribute] = (e.currentTarget as HTMLInputElement).checked;
	}}
/>
{@render errorRow()}
