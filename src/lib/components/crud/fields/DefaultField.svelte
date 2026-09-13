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
	{#if field.formatter}
		<div
			id={field.attribute}
			class="input input-bordered w-full bg-base-200 border-base-200 text-base-content/40 shadow-none cursor-not-allowed"
		>
			<!-- eslint-disable-next-line svelte/no-at-html-tags -->
			{@html formattedValue}
		</div>
	{:else}
		<input
			type={field.type ?? 'text'}
			id={field.attribute}
			class="input input-bordered w-full"
			value={formattedValue}
			disabled
		/>
	{/if}
{:else}
	<input
		type={field.type ?? 'text'}
		id={field.attribute}
		{name}
		placeholder={field.placeholder ?? ''}
		bind:value={record[field.attribute]}
		autocomplete={field.autocomplete}
		step={field.type === 'number' ? 'any' : undefined}
		class="input input-bordered w-full"
		class:input-error={!!error}
		disabled={fieldDisabled}
	/>
{/if}

{@render errorRow()}
