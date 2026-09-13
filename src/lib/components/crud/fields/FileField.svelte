<script lang="ts" generics="T extends object = Record<string, unknown>">
	import type { Snippet } from 'svelte';
	import Avatar from '$lib/components/Avatar.svelte';
	import { fieldLabel, initials } from '$lib/components/crud/utils/misc.js';
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
	const labelText = $derived(fieldLabel(field));
	const avatarInitials = $derived(initials(record.firstName as string, record.lastName as string));
	const fieldDisabled = $derived(field.disabled ? field.disabled(record, parentRecord) : false);

	let filePreview = $state<string | null>(null);
	const preview = $derived(filePreview ?? (typeof saved === 'string' && saved ? saved : null));

	function onFileChange(e: Event & { currentTarget: HTMLInputElement }) {
		const file = e.currentTarget.files?.[0];
		if (filePreview) URL.revokeObjectURL(filePreview);
		filePreview = file && file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
	}

	$effect(() => () => {
		if (filePreview) URL.revokeObjectURL(filePreview);
	});
</script>

<div class="flex justify-center">
	<Avatar
		src={preview}
		text={avatarInitials}
		alt={labelText}
		class="w-20 rounded-full"
		textClass="text-xl"
	/>
</div>

{@render labelRow()}

{#if !readonly}
	<input
		type="file"
		id={field.attribute}
		{name}
		class="file-input file-input-bordered w-full"
		class:file-input-error={!!error}
		disabled={fieldDisabled}
		onchange={onFileChange}
	/>
{/if}
<!-- read-only file value is shown as the avatar above -->

{@render errorRow()}
