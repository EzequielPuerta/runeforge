<script lang="ts" generics="T extends object = Record<string, unknown>">
	import Button from '$lib/components/form/Button.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import type { CustomBulkAction } from '$lib/types/crud.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	let {
		deleteLabel = '',
		pendingDeletion = null as T[] | null,
		pendingBulkAction = null as { action: CustomBulkAction<T>; items: T[] } | null,
		onCancelDeletion,
		onConfirmDeletion,
		onCancelBulkAction,
		onConfirmBulkAction
	}: {
		deleteLabel?: string;
		pendingDeletion?: T[] | null;
		pendingBulkAction?: { action: CustomBulkAction<T>; items: T[] } | null;
		onCancelDeletion?: () => void;
		onConfirmDeletion?: () => void;
		onCancelBulkAction?: () => void;
		onConfirmBulkAction?: () => void;
	} = $props();
</script>

{#if pendingDeletion !== null}
	<Modal title={deleteLabel} onClose={onCancelDeletion}>
		<p>{strings.deleteConfirm(pendingDeletion.length, deleteLabel)}</p>
		<div class="flex justify-end gap-2 mt-4">
			<Button variant="ghost" onclick={onCancelDeletion}>
				{strings.cancel}
			</Button>
			<Button variant="error" onclick={onConfirmDeletion}>
				{strings.confirm}
			</Button>
		</div>
	</Modal>
{/if}

{#if pendingBulkAction !== null}
	{@const pendingActionLabel =
		pendingBulkAction.action.label ?? pendingBulkAction.action.tooltip ?? strings.actions}
	<Modal title={pendingActionLabel} onClose={onCancelBulkAction}>
		<p>{strings.deleteConfirm(pendingBulkAction.items.length, pendingActionLabel)}</p>
		<div class="flex justify-end gap-2 mt-4">
			<Button variant="ghost" onclick={onCancelBulkAction}>
				{strings.cancel}
			</Button>
			<Button variant={pendingBulkAction.action.variant ?? 'primary'} onclick={onConfirmBulkAction}>
				{strings.confirm}
			</Button>
		</div>
	</Modal>
{/if}
