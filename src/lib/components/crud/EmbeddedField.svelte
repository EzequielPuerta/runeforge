<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { untrack } from 'svelte';
	import Field from '$lib/components/crud/Field.svelte';
	import Button from '$lib/components/form/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import { emptyRecord, seedField, defaultItemLabel } from '$lib/components/crud/utils/embedded.js';
	import { fieldLabel } from '$lib/components/crud/utils/misc.js';
	import { validateAll } from '$lib/components/crud/utils/validation.js';
	import { groupFields } from '$lib/components/crud/utils/grouping.js';
	import type { FieldDefinition } from '$lib/types/crud/fields.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	let {
		field,
		record = $bindable({} as Record<string, unknown>),
		readonly = false
	}: {
		field: FieldDefinition<T>;
		/** The record that owns this embedded field (the form record for a
		 * top-level embedded field, or the outer item's draft for one nested
		 * inside another embedded field) — passed through to each sub-field's
		 * `hidden`/`disabled`/`required`/`dependentOptions` as their `parent`
		 * argument, and to `field.revalidate` as its own parent argument. */
		record?: Record<string, unknown>;
		readonly?: boolean;
	} = $props();

	const subFields = $derived(field.fields ?? []);
	const subGroups = $derived(groupFields(subFields));
	const items = $derived((record[field.attribute] as Record<string, unknown>[] | undefined) ?? []);

	// Re-derives the embedded list right after `field.dependsOn` changes value
	// on the parent record — e.g. dropping items that no longer apply once a
	// sibling "owner kind" select flips — instead of leaving them stale until
	// the user happens to touch this field again. Scoped to exactly that one
	// parent attribute: reading it is this effect's only tracked dependency,
	// and everything else (including its own write to `record[field.attribute]`)
	// runs inside `untrack` so the effect never re-triggers itself.
	$effect(() => {
		if (!field.dependsOn || !field.revalidate) return;
		// Read (only) to register as this effect's sole tracked dependency —
		// everything that actually acts on it happens inside untrack() below,
		// so the effect reruns exactly when this one value changes and never
		// because of its own write to record[field.attribute].
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const dependencyValue = record[field.dependsOn];
		untrack(() => {
			const current = (record[field.attribute] as Record<string, unknown>[] | undefined) ?? [];
			const next = field.revalidate!(current, record);
			if (next !== current) record[field.attribute] = next;
		});
	});

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
											<Field field={f} bind:record={draft} parentRecord={record} error={draftErrors[f.attribute] ?? ''} class="md:min-w-0 md:flex-1" />
										{/each}
									</div>
								{:else}
									<Field field={row[0]} bind:record={draft} parentRecord={record} error={draftErrors[row[0].attribute] ?? ''} />
								{/if}
							{/each}
						</div>
					</fieldset>
				{:else}
					{#each group.rows as row (row.map((f) => f.attribute).join('|'))}
						{#if row.length > 1}
							<div class="flex flex-col gap-4 md:flex-row">
								{#each row as f (f.attribute)}
									<Field field={f} bind:record={draft} parentRecord={record} error={draftErrors[f.attribute] ?? ''} class="md:min-w-0 md:flex-1" />
								{/each}
							</div>
						{:else}
							<Field field={row[0]} bind:record={draft} parentRecord={record} error={draftErrors[row[0].attribute] ?? ''} />
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
