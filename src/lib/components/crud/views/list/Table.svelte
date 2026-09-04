<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { SvelteSet } from 'svelte/reactivity';
	import Button from '$lib/components/form/Button.svelte';
	import PaginatedTable from '$lib/components/table/PaginatedTable.svelte';
	import { getIconSet } from '$lib/icons/context.js';
	import { defaultIconSet } from '$lib/icons/sets/default.js';
	import type {
		ColumnDefinition,
		CustomAction,
		ReorderConfiguration,
		RowAction
	} from '$lib/types/crud.js';
	import type {
		FilterSnapshot,
		ServerPagination,
		SortDirection,
		TableQuery
	} from '$lib/types/table.js';

	const icons = $derived(getIconSet() ?? defaultIconSet);

	let {
		data = [] as T[],
		columns = [] as ColumnDefinition<T>[],
		pageSize = 10,
		selectable = true,
		selected = $bindable(new SvelteSet<number>()),
		pagination = undefined as ServerPagination | undefined,
		initialSort = undefined as { column: string; direction: SortDirection } | undefined,
		initialFilters = undefined as Partial<FilterSnapshot> | undefined,
		onPaginationChange = undefined as ((query: TableQuery) => void) | undefined,
		visibleRows = $bindable<T[]>([]),
		query = $bindable<TableQuery | undefined>(undefined),
		customActions = [] as CustomAction<T>[],
		allowRead = true,
		allowUpdate = true,
		allowDelete = true,
		readLabel = '',
		updateLabel = '',
		deleteLabel = '',
		reorder = undefined as ReorderConfiguration<T> | undefined,
		onView,
		onEdit,
		onAction,
		onRequestDeletion,
		onReorder
	}: {
		data?: T[];
		columns?: ColumnDefinition<T>[];
		pageSize?: number;
		selectable?: boolean;
		selected?: SvelteSet<number>;
		pagination?: ServerPagination;
		initialSort?: { column: string; direction: SortDirection };
		initialFilters?: Partial<FilterSnapshot>;
		onPaginationChange?: (query: TableQuery) => void;
		visibleRows?: T[];
		query?: TableQuery;
		customActions?: CustomAction<T>[];
		allowRead?: boolean;
		allowUpdate?: boolean;
		allowDelete?: boolean;
		readLabel?: string;
		updateLabel?: string;
		deleteLabel?: string;
		/** Drag-to-reorder configuration — see `ReorderConfiguration`. Ignored
		 * in server-pagination mode (`pagination` set). */
		reorder?: ReorderConfiguration<T>;
		onView?: (item: T) => void;
		onEdit?: (item: T) => void;
		onAction?: (action: CustomAction<T>, item: T) => void;
		onRequestDeletion?: (item: T) => void;
		/** Fires with the complete reordered row list after a drag; the caller
		 * (the list orchestrator) owns persisting it. */
		onReorder?: (rows: T[]) => void;
	} = $props();

	const reorderActive = $derived(!!reorder && reorder.enabled !== false && !pagination);

	const showRowActions = $derived(
		allowRead || allowUpdate || allowDelete || customActions.length > 0
	);

	const rowActions = $derived<RowAction<T>[]>([
		...customActions.map((action) => ({
			label: action.label,
			icon: action.icon,
			toggle: action.toggle,
			class: action.class,
			condition: action.condition,
			run: (item: T) => onAction?.(action, item)
		})),
		...(allowRead
			? [{ label: readLabel, icon: icons.view, run: (item: T) => onView?.(item) }]
			: []),
		...(allowUpdate
			? [{ label: updateLabel, icon: icons.edit, run: (item: T) => onEdit?.(item) }]
			: []),
		...(allowDelete
			? [
					{
						label: deleteLabel,
						icon: icons.delete,
						class: 'text-error',
						run: (item: T) => onRequestDeletion?.(item)
					}
				]
			: [])
	]);
</script>

{#snippet actionsCell(item: T)}
	<div class="flex justify-end items-center gap-1">
		{#each rowActions as action (action.label)}
			{#if action.condition?.(item) ?? true}
				{@const resolvedClass =
					typeof action.class === 'function' ? action.class(item) : action.class}
				{#if action.toggle}
					<input
						type="checkbox"
						class={['toggle toggle-sm', resolvedClass]}
						title={action.label}
						aria-label={action.label}
						checked={action.toggle(item)}
						onclick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							action.run(item);
						}}
					/>
				{:else}
					{@const Icon = action.icon}
					<Button
						variant="ghost"
						class={['btn-xs', resolvedClass]}
						title={action.label}
						aria-label={action.label}
						onclick={(e) => {
							e.stopPropagation();
							action.run(item);
						}}
					>
						<Icon class="size-4" />
					</Button>
				{/if}
			{/if}
		{/each}
	</div>
{/snippet}

<div class="table-wrapper">
	<PaginatedTable
		{data}
		{columns}
		{pageSize}
		{selectable}
		bind:selected
		rowActions={showRowActions ? actionsCell : undefined}
		{pagination}
		{initialSort}
		{initialFilters}
		{onPaginationChange}
		bind:visibleRows
		bind:query
		reorder={reorderActive ? reorder : undefined}
		{onReorder}
	/>
</div>

<style>
	.table-wrapper {
		width: 100%;
		max-width: var(--runeforge-crud-max-width);
		margin-inline: auto;
	}
</style>
