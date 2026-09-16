<script lang="ts" generics="T extends object = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import Tree from '$lib/components/form/Tree.svelte';
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

	const saved = $derived(record[field.attribute]);
	const selectOptions = $derived(
		field.dependentOptions ? field.dependentOptions(record, parentRecord) : (field.options ?? [])
	);
	const fieldDisabled = $derived(field.disabled ? field.disabled(record, parentRecord) : false);

	// See SelectField's equivalent effect.
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
	<Tree
		name={field.attribute}
		bind:value={record[field.attribute] as string[]}
		options={selectOptions}
		disabled={fieldDisabled}
		defaultExpanded={field.defaultExpanded ?? true}
		searchable={field.searchable ?? true}
	/>
{/if}

{@render errorRow()}
