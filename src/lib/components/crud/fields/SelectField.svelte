<script lang="ts" generics="T extends object = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import Select from '$lib/components/form/Select.svelte';
	import type { FieldDefinition } from '$lib/types/crud/fields.js';

	let {
		field,
		record = $bindable({} as Record<string, unknown>),
		parentRecord = undefined,
		error = '',
		readonly = false,
		labelRow,
		errorRow
	}: {
		field: FieldDefinition<T>;
		record?: Record<string, unknown>;
		parentRecord?: Record<string, unknown>;
		error?: string;
		readonly?: boolean;
		labelRow: Snippet;
		errorRow: Snippet;
	} = $props();

	const saved = $derived(record[field.attribute]);
	const displayValue = $derived(saved == null ? '' : String(saved));
	const selectOptions = $derived(
		field.dependentOptions ? field.dependentOptions(record, parentRecord) : (field.options ?? [])
	);
	const fieldDisabled = $derived(field.disabled ? field.disabled(record, parentRecord) : false);

	// A previously-valid selection can fall outside a dependentOptions list
	// that just changed (e.g. its options depend on a sibling/parent field) —
	// clears it instead of silently keeping a value the user can no longer see
	// or re-pick from the dropdown.
	$effect(() => {
		if (!field.dependentOptions) return;
		const current = record[field.attribute];
		if (current && !selectOptions.some((o) => o.value === String(current))) {
			record[field.attribute] = '';
		}
	});
</script>

{@render labelRow()}

{#if readonly}
	<input
		type="text"
		id={field.attribute}
		class="input input-bordered w-full"
		value={selectOptions.find((o) => o.value === String(saved))?.label ?? displayValue}
		disabled
	/>
{:else}
	<Select
		id={field.attribute}
		name={field.attribute}
		bind:value={record[field.attribute] as string}
		options={selectOptions}
		search={field.search}
		placeholder={field.placeholder}
		disabled={fieldDisabled}
		{error}
	/>
{/if}

{@render errorRow()}
