<script lang="ts" generics="T extends object = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import MultiSelect from '$lib/components/form/MultiSelect.svelte';
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
	const selectOptions = $derived(
		field.dependentOptions ? field.dependentOptions(record, parentRecord) : (field.options ?? [])
	);
	const fieldDisabled = $derived(field.disabled ? field.disabled(record, parentRecord) : false);

	// See SelectField's equivalent effect — same idea, but pruning the array
	// down to values still present in the (possibly just-changed) options
	// instead of clearing a single scalar value outright.
	$effect(() => {
		if (!field.dependentOptions) return;
		const current = record[field.attribute];
		if (!Array.isArray(current)) return;
		const validValues = new Set(selectOptions.map((o) => o.value));
		const pruned = current.filter((v) => validValues.has(String(v)));
		if (pruned.length !== current.length) {
			record[field.attribute] = pruned;
		}
	});
</script>

{@render labelRow()}

{#if readonly}
	<input
		type="text"
		id={field.attribute}
		class="input input-bordered w-full"
		value={(Array.isArray(saved) ? saved : [])
			.map((v) => selectOptions.find((o) => o.value === String(v))?.label ?? String(v))
			.join(', ')}
		disabled
	/>
{:else}
	<MultiSelect
		id={field.attribute}
		name={field.attribute}
		bind:value={record[field.attribute] as string[]}
		options={selectOptions}
		search={field.search}
		placeholder={field.placeholder}
		disabled={fieldDisabled}
		{error}
	/>
{/if}

{@render errorRow()}
