<script lang="ts" generics="T extends object = Record<string, unknown>">
	import Button from '$lib/components/form/Button.svelte';
	import Label from '$lib/components/form/Label.svelte';
	import EmbeddedField from '$lib/components/crud/EmbeddedField.svelte';
	import BooleanField from '$lib/components/crud/fields/BooleanField.svelte';
	import FileField from '$lib/components/crud/fields/FileField.svelte';
	import SelectField from '$lib/components/crud/fields/SelectField.svelte';
	import MultiSelectField from '$lib/components/crud/fields/MultiSelectField.svelte';
	import TreeField from '$lib/components/crud/fields/TreeField.svelte';
	import DatetimeField from '$lib/components/crud/fields/DatetimeField.svelte';
	import TextareaField from '$lib/components/crud/fields/TextareaField.svelte';
	import DefaultField from '$lib/components/crud/fields/DefaultField.svelte';
	import { fieldLabel } from '$lib/components/crud/utils/misc.js';
	import type { FieldDefinition } from '$lib/types/crud/fields.js';

	let {
		field,
		record = $bindable({} as Record<string, unknown>),
		parentRecord = undefined,
		error = '',
		readonly = false,
		class: className = ''
	}: {
		field: FieldDefinition<T>;
		record?: Record<string, unknown>;
		/** Set only when this Field renders a sub-field of an `embedded` field
		 * — the outer form's own record, passed through to `hidden`/`disabled`/
		 * `required`/`dependentOptions` as their second argument. */
		parentRecord?: Record<string, unknown>;
		error?: string;
		readonly?: boolean;
		class?: string;
	} = $props();

	const labelText = $derived(fieldLabel(field));
	const fieldRequired = $derived(
		typeof field.required === 'function' ? field.required(record, parentRecord) : !!field.required
	);
	const fieldHidden = $derived(
		typeof field.hidden === 'function' ? field.hidden(record, parentRecord) : !!field.hidden
	);
	const fieldActions = $derived(
		(field.actions ?? []).filter((action) => action.condition?.(record) ?? true)
	);
</script>

<!-- Shared by every field type below, always rendered in the same spot
     (right after an optional type-specific lead-in, e.g. FileField's avatar
     preview) so each type-specific component just brackets its own markup
     with these two instead of re-declaring the label/error chrome itself. -->
{#snippet labelRow()}
	<div class="flex items-center justify-between gap-2">
		<Label
			text={labelText}
			for={field.attribute}
			capitalize={true}
			required={fieldRequired && !readonly}
		/>
		{#if !readonly && fieldActions.length > 0}
			<div class="flex items-center gap-1">
				{#each fieldActions as action (action.label)}
					<Button
						type="button"
						variant="ghost"
						class={['btn-xs', action.class]}
						title={action.label}
						onclick={() =>
							action.run(record[field.attribute], record, (attribute, value) => {
								record[attribute] = value;
							})}
					>
						{#if action.icon}
							{@const Icon = action.icon}
							<Icon class="size-4" />
						{/if}
						{action.label}
					</Button>
				{/each}
			</div>
		{/if}
	</div>
{/snippet}

{#snippet errorRow()}
	{#if error}
		<span class="text-error text-xs">{error}</span>
	{/if}
{/snippet}

{#if !fieldHidden}
	<div class="flex flex-col gap-1 {className}">
		{#if field.type === 'boolean'}
			<BooleanField {field} bind:record {parentRecord} {readonly} {labelRow} {errorRow} />
		{:else if field.type === 'file'}
			<FileField {field} bind:record {parentRecord} {error} {readonly} {labelRow} {errorRow} />
		{:else if field.type === 'select'}
			<SelectField {field} bind:record {parentRecord} {error} {readonly} {labelRow} {errorRow} />
		{:else if field.type === 'datetime'}
			<DatetimeField {field} bind:record {parentRecord} {error} {readonly} {labelRow} {errorRow} />
		{:else if field.type === 'textarea'}
			<TextareaField {field} bind:record {parentRecord} {error} {readonly} {labelRow} {errorRow} />
		{:else if field.type === 'embedded'}
			{@render labelRow()}
			<EmbeddedField {field} bind:record {readonly} />
			{@render errorRow()}
		{:else if field.type === 'multiselect'}
			<MultiSelectField
				{field}
				bind:record
				{parentRecord}
				{error}
				{readonly}
				{labelRow}
				{errorRow}
			/>
		{:else if field.type === 'tree'}
			<TreeField {field} bind:record {parentRecord} {readonly} {labelRow} {errorRow} />
		{:else}
			<DefaultField {field} bind:record {parentRecord} {error} {readonly} {labelRow} {errorRow} />
		{/if}
	</div>
{/if}
