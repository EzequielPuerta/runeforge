<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { SvelteSet } from 'svelte/reactivity';
	import { invalidateAll } from '$app/navigation';
	import Toolbar from '$lib/components/crud/views/list/Toolbar.svelte';
	import Table from '$lib/components/crud/views/list/Table.svelte';
	import Modals from '$lib/components/crud/views/list/Modals.svelte';
	import { computeReorderChanges } from '$lib/components/crud/utils/reorder.js';
	import type {
		ActionConfiguration,
		ColumnDefinition,
		CustomAction,
		CustomBulkAction,
		ListActions,
		ListConfig,
		ViewBasedCustomBulkAction
	} from '$lib/types/crud.js';
	import type {
		FilterSnapshot,
		ServerPagination,
		SortDirection,
		TableQuery
	} from '$lib/types/table.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

	function isViewBasedBulkAction<U extends object>(
		action: CustomBulkAction<U>
	): action is ViewBasedCustomBulkAction<U> {
		return action.kind === 'view';
	}

	let {
		data = [] as T[],
		labelOne = '',
		labelMany = '',
		icon,
		pageSize = 10,
		idKey = '_id',
		creation = {} as ActionConfiguration<T>,
		update = {} as ActionConfiguration<T>,
		read = {} as ActionConfiguration<T>,
		deletion = {} as ActionConfiguration<T>,
		actions = {} as ListActions<T>,
		config = {} as ListConfig<T>,
		columns = [] as ColumnDefinition<T>[],
		pagination = undefined as ServerPagination | undefined,
		initialSort = undefined as { column: string; direction: SortDirection } | undefined,
		initialFilters = undefined as Partial<FilterSnapshot> | undefined,
		onPaginationChange = undefined as ((query: TableQuery) => void) | undefined,
		onCreate,
		onEdit,
		onView,
		onAction,
		onBulkAction
	}: {
		data?: T[];
		labelOne?: string;
		labelMany?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon?: any;
		pageSize?: number;
		idKey?: string;
		creation?: ActionConfiguration<T>;
		update?: ActionConfiguration<T>;
		read?: ActionConfiguration<T>;
		deletion?: ActionConfiguration<T>;
		actions?: ListActions<T>;
		config?: ListConfig<T>;
		columns?: ColumnDefinition<T>[];
		pagination?: ServerPagination;
		initialSort?: { column: string; direction: SortDirection };
		initialFilters?: Partial<FilterSnapshot>;
		onPaginationChange?: (query: TableQuery) => void;
		onCreate?: () => void;
		onEdit?: (item: T) => void;
		onView?: (item: T) => void;
		onAction?: (action: CustomAction<T>, item: T) => void;
		onBulkAction?: (action: ViewBasedCustomBulkAction<T>, items: T[]) => void;
	} = $props();

	const customActions = $derived(actions.custom ?? []);
	const bulkActions = $derived(actions.bulk ?? []);
	const searchConfig = $derived(config.search);
	const exportConfig = $derived(config.export);
	const reorderConfig = $derived(config.reorder);

	const allowRead = $derived(read.enabled ?? true);
	const allowUpdate = $derived(update.enabled ?? true);
	const allowDelete = $derived(deletion.enabled ?? true);
	const allowCreate = $derived(creation.enabled ?? true);
	const deleteLabel = $derived(deletion.label ?? strings.delete);
	const updateLabel = $derived(update.label ?? strings.edit);
	const readLabel = $derived(read.label ?? strings.view);
	const allowSelection = $derived(
		allowDelete || bulkActions.some((action) => !isViewBasedBulkAction(action))
	);

	// SvelteSet is already reactive on its own; passing it through Table's
	// (and PaginatedTable's) own `bind:selected` makes svelte-check's
	// non_reactive_update warning fire here too — a false positive, per the
	// same reasoning as the "intentional one-time hydration" notes elsewhere
	// in this codebase.
	let selected = new SvelteSet<number>();
	let pendingDeletion = $state<T[] | null>(null);
	let pendingBulkAction = $state<{ action: CustomBulkAction<T>; items: T[] } | null>(null);
	const selectedItems = $derived([...selected].map((i) => data[i]));

	let visibleRows = $state<T[]>([]);
	let exportQuery = $state<TableQuery | undefined>(undefined);

	// `selected` holds indices into `data`; if `data` is swapped for a different
	// slice (page/sort/filter change in server mode) stale indices could point
	// at unrelated rows, so clear on any data reference change.
	let lastData: T[] | undefined;
	$effect(() => {
		if (data !== lastData) {
			selected.clear();
			lastData = data;
		}
	});

	async function runEndpointAction(
		endpoint: string,
		items: T[],
		extraFields?: (item: T) => Record<string, string>
	) {
		await Promise.all(
			items.map((item) => {
				const fd = new FormData();
				fd.set('id', String((item as Record<string, unknown>)[idKey] ?? ''));
				for (const [k, v] of Object.entries(extraFields?.(item) ?? {})) fd.set(k, v);
				return fetch(endpoint, { method: 'POST', body: fd });
			})
		);
		await invalidateAll();
	}

	/** One POST for every row that moved, instead of `runEndpointAction`'s one
	 * request per row — a drag that shifts N rows only settles once (on
	 * release), but N rows changing means N *parallel* requests fire at that
	 * moment, which reads a lot like "one per row crossed" from the network
	 * tab. FormData field `changes` carries a JSON array of `{id, value}`
	 * pairs, one per row whose `attribute` changed. */
	async function runBatchEndpointAction(endpoint: string, items: T[], attribute: keyof T & string) {
		const fd = new FormData();
		fd.set(
			'changes',
			JSON.stringify(
				items.map((item) => ({
					id: String((item as Record<string, unknown>)[idKey] ?? ''),
					value: (item as Record<string, unknown>)[attribute]
				}))
			)
		);
		await fetch(endpoint, { method: 'POST', body: fd });
		await invalidateAll();
	}

	async function runDeletion(items: T[]) {
		if (deletion.endpoint) {
			await runEndpointAction(deletion.endpoint, items);
		} else {
			await deletion.callback?.(items);
		}
	}

	function requestDeletion(items: T[]) {
		if (deletion.confirm) {
			pendingDeletion = items;
		} else {
			runDeletion(items);
		}
	}

	function handleDeleteSelected() {
		const items = [...selected].map((i) => data[i]);
		selected.clear();
		requestDeletion(items);
	}

	async function confirmDeletion() {
		if (pendingDeletion) {
			await runDeletion(pendingDeletion);
			pendingDeletion = null;
		}
	}

	async function runBulkAction(action: CustomBulkAction<T>, items: T[]) {
		if (isViewBasedBulkAction(action)) return;
		await runEndpointAction(action.endpoint, items);
	}

	function requestBulkAction(action: CustomBulkAction<T>, items: T[]) {
		if (!isViewBasedBulkAction(action) && action.confirm) {
			pendingBulkAction = { action, items };
		} else {
			runBulkAction(action, items);
		}
	}

	function handleBulkAction(action: CustomBulkAction<T>) {
		const items = selectedItems;
		if (isViewBasedBulkAction(action)) {
			onBulkAction?.(action, items);
			return;
		}
		selected.clear();
		requestBulkAction(action, items);
	}

	async function confirmBulkAction() {
		if (pendingBulkAction) {
			await runBulkAction(pendingBulkAction.action, pendingBulkAction.items);
			pendingBulkAction = null;
		}
	}

	async function handleReorder(rows: T[]) {
		const cfg = reorderConfig;
		if (!cfg) return;
		const changed = computeReorderChanges(rows, cfg.attribute);
		if (changed.length === 0) return;
		if (cfg.endpoint) {
			await runBatchEndpointAction(cfg.endpoint, changed, cfg.attribute);
		} else {
			await cfg.callback?.(changed);
		}
	}
</script>

<div class="flex flex-col gap-6">
	<Toolbar
		{labelOne}
		{labelMany}
		{icon}
		{creation}
		{allowCreate}
		{allowDelete}
		{deleteLabel}
		search={searchConfig}
		{exportConfig}
		{bulkActions}
		{columns}
		{pagination}
		{visibleRows}
		{exportQuery}
		selectedCount={selected.size}
		{selectedItems}
		{onCreate}
		onDeleteSelected={handleDeleteSelected}
		onBulkAction={handleBulkAction}
	/>

	<Table
		{data}
		{columns}
		{pageSize}
		selectable={allowSelection}
		bind:selected
		{pagination}
		{initialSort}
		{initialFilters}
		{onPaginationChange}
		bind:visibleRows
		bind:query={exportQuery}
		{customActions}
		{allowRead}
		{allowUpdate}
		{allowDelete}
		{readLabel}
		{updateLabel}
		{deleteLabel}
		reorder={reorderConfig}
		{onView}
		{onEdit}
		{onAction}
		onRequestDeletion={(item) => requestDeletion([item])}
		onReorder={handleReorder}
	/>
</div>

<Modals
	{deleteLabel}
	{pendingDeletion}
	{pendingBulkAction}
	onCancelDeletion={() => (pendingDeletion = null)}
	onConfirmDeletion={confirmDeletion}
	onCancelBulkAction={() => (pendingBulkAction = null)}
	onConfirmBulkAction={confirmBulkAction}
/>
