<script lang="ts" generics="T extends object = Record<string, unknown>">
	import type { Snippet } from 'svelte';
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

	const name = $derived(readonly ? undefined : field.attribute);
	const saved = $derived(record[field.attribute]);
	const displayValue = $derived(saved == null ? '' : String(saved));
	const formattedValue = $derived(
		readonly && field.formatter ? field.formatter(saved, record) : displayValue
	);
	const fieldDisabled = $derived(field.disabled ? field.disabled(record, parentRecord) : false);
</script>

{@render labelRow()}

{#if readonly}
	<textarea
		id={field.attribute}
		rows={field.rows}
		class="textarea textarea-bordered bg-base-100 w-full"
		value={formattedValue}
		disabled
	></textarea>
{:else}
	<textarea
		id={field.attribute}
		{name}
		rows={field.rows}
		placeholder={field.placeholder ?? ''}
		bind:value={record[field.attribute]}
		class="textarea textarea-bordered bg-base-100 w-full"
		class:textarea-error={!!error}
		disabled={fieldDisabled}
	></textarea>
{/if}

{@render errorRow()}
