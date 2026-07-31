<script lang="ts" generics="T extends object = Record<string, unknown>">
	import Field from '$lib/components/crud/Field.svelte';
	import Button from '$lib/components/form/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { emptyRecord, seedField, defaultItemLabel } from '$lib/components/crud/utils/embedded.js';
	import { fieldLabel } from '$lib/components/crud/utils/misc.js';
	import { validateAll } from '$lib/components/crud/utils/validation.js';
	import { groupFields } from '$lib/components/crud/utils/grouping.js';
	import type { FieldDefinition } from '$lib/types/crud.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	let {
		field,
		record = $bindable({} as Record<string, unknown>),
		readonly = false
	}: {
		field: FieldDefinition<T>;
		record?: Record<string, unknown>;
		readonly?: boolean;
	} = $props();

	const subFields = $derived(field.fields ?? []);
	const subGroups = $derived(groupFields(subFields));
	const items = $derived((record[field.attribute] as Record<string, unknown>[] | undefined) ?? []);

	let modalOpen = $state(false);
	// null while adding a new item; the item's index while editing an existing
	// one, so saveItem knows whether to append or replace in place.
	let editingIndex = $state<number | null>(null);
	let draft = $state<Record<string, unknown>>({});
	let draftErrors = $state<Record<string, string>>({});

	function openCreateModal() {
		editingIndex = null;
		draft = emptyRecord(subFields);
		draftErrors = {};
		modalOpen = true;
	}

	function openEditModal(index: number) {
		const item = items[index];
		editingIndex = index;
		draft = Object.fromEntries(
			subFields.map((f) => [f.attribute, seedField(f, f.seed ? f.seed(item) : item[f.attribute])])
		);
		draftErrors = {};
		modalOpen = true;
	}

	function closeModal() {
		modalOpen = false;
	}

	function coerce(f: FieldDefinition, raw: unknown): unknown {
		if (f.type === 'number') return raw === '' || raw == null ? null : Number(raw);
		return raw;
	}

	function saveItem() {
		const fd = new FormData();
		for (const f of subFields) fd.set(f.attribute, String(draft[f.attribute] ?? ''));
		const errs = validateAll(subFields, fd, strings);
		if (Object.keys(errs).length > 0) {
			draftErrors = errs;
			return;
		}
		const item = Object.fromEntries(
			subFields.map((f) => [f.attribute, coerce(f, draft[f.attribute])])
		);
		record[field.attribute] =
			editingIndex == null
				? [...items, item]
				: items.map((existing, i) => (i === editingIndex ? item : existing));
		modalOpen = false;
	}

	function removeItem(index: number) {
		record[field.attribute] = items.filter((_, i) => i !== index);
	}

	function itemLabel(item: Record<string, unknown>): string {
		return field.itemLabel ? field.itemLabel(item) : defaultItemLabel(subFields, item);
	}
</script>

<div class="flex flex-col gap-2">
	{#if !readonly}
		<input type="hidden" name={field.attribute} value={JSON.stringify(items)} />
	{/if}

	{#if items.length === 0}
		<p class="text-sm text-base-content/50">{strings.noItems}</p>
	{:else}
		<ul class="flex flex-col gap-1">
			{#each items as item, i (i)}
				<li
					class="flex items-center justify-between gap-2 rounded-box border border-base-300 px-3 py-2 text-sm"
				>
					{#if readonly}
						<span>{itemLabel(item)}</span>
					{:else}
						<button
							type="button"
							class="flex-1 text-left hover:underline"
							onclick={() => openEditModal(i)}
						>
							{itemLabel(item)}
						</button>
						<Button
							variant="ghost"
							class="btn-xs btn-circle"
							aria-label={strings.remove}
							onclick={() => removeItem(i)}
						>
							✕
						</Button>
					{/if}
				</li>
			{/each}
		</ul>
	{/if}

	{#if !readonly}
		<Button variant="outline" class="btn-sm self-start" onclick={openCreateModal}>
			+ {strings.add}
		</Button>
	{/if}
</div>

{#if modalOpen}
	<Modal title={fieldLabel(field)} onClose={closeModal}>
		<div class="flex flex-col gap-4">
			{#each subGroups as group, i (group.title ?? `_ungrouped_${i}`)}
				{#if group.title}
					<fieldset class="fieldset border border-base-300 rounded-box p-4">
						<legend class="fieldset-legend px-2">{group.title}</legend>
						<div class="flex flex-col gap-4">
							{#each group.rows as row (row.map((f) => f.attribute).join('|'))}
								{#if row.length > 1}
									<div class="flex flex-col gap-4 md:flex-row">
										{#each row as f (f.attribute)}
											<Field field={f} bind:record={draft} error={draftErrors[f.attribute] ?? ''} class="md:min-w-0 md:flex-1" />
										{/each}
									</div>
								{:else}
									<Field field={row[0]} bind:record={draft} error={draftErrors[row[0].attribute] ?? ''} />
								{/if}
							{/each}
						</div>
					</fieldset>
				{:else}
					{#each group.rows as row (row.map((f) => f.attribute).join('|'))}
						{#if row.length > 1}
							<div class="flex flex-col gap-4 md:flex-row">
								{#each row as f (f.attribute)}
									<Field field={f} bind:record={draft} error={draftErrors[f.attribute] ?? ''} class="md:min-w-0 md:flex-1" />
								{/each}
							</div>
						{:else}
							<Field field={row[0]} bind:record={draft} error={draftErrors[row[0].attribute] ?? ''} />
						{/if}
					{/each}
				{/if}
			{/each}
			<div class="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
				<Button variant="ghost" onclick={closeModal}>{strings.cancel}</Button>
				<Button variant="primary" onclick={saveItem}>
					{editingIndex == null ? strings.add : strings.edit}
				</Button>
			</div>
		</div>
	</Modal>
{/if}
