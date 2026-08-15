<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { SvelteSet } from 'svelte/reactivity';
	import { invalidateAll } from '$app/navigation';
	import Button from '$lib/components/form/Button.svelte';
	import Header from '$lib/components/common/Header.svelte';
	import Modal from '$lib/components/Modal.svelte';
	import PaginatedTable from '$lib/components/table/PaginatedTable.svelte';
	import SearchInput from '$lib/components/crud/SearchInput.svelte';
	import { downloadCsv, downloadXlsx, type XlsxModule } from '$lib/components/table/export.js';
	import { getIconSet } from '$lib/icons/context.js';
	import { defaultIconSet } from '$lib/icons/sets/default.js';
	import type {
		ActionConfiguration,
		ColumnDefinition,
		CustomAction,
		CustomBulkAction,
		RowAction,
		SearchConfiguration
	} from '$lib/types/crud.js';
	import type {
		FilterSnapshot,
		ServerPagination,
		SortDirection,
		TableQuery
	} from '$lib/types/table.js';
	import { getStrings } from '$lib/i18n/context.js';

	const strings = getStrings();

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
		actions = [] as CustomAction<T>[],
		customBulkActions = [] as CustomBulkAction<T>[],
		search = undefined as SearchConfiguration | undefined,
		columns = [] as ColumnDefinition<T>[],
		pagination = undefined as ServerPagination | undefined,
		initialSort = undefined as { column: string; direction: SortDirection } | undefined,
		initialFilters = undefined as Partial<FilterSnapshot> | undefined,
		onPaginationChange = undefined as ((query: TableQuery) => void) | undefined,
		enableExport = false,
		onExport = undefined as ((query: TableQuery) => Promise<T[]>) | undefined,
		xlsx = undefined as XlsxModule | undefined,
		onCreate,
		onEdit,
		onView,
		onAction
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
		actions?: CustomAction<T>[];
		customBulkActions?: CustomBulkAction<T>[];
		search?: SearchConfiguration;
		columns?: ColumnDefinition<T>[];
		pagination?: ServerPagination;
		initialSort?: { column: string; direction: SortDirection };
		initialFilters?: Partial<FilterSnapshot>;
		onPaginationChange?: (query: TableQuery) => void;
		/** Shows an icon-only export button (CSV, and Excel if `xlsx` is provided). */
		enableExport?: boolean;
		/** Server-pagination mode only: fetch all rows matching the current query
		 * (unpaginated) for export. Without it, export falls back to the loaded page. */
		onExport?: (query: TableQuery) => Promise<T[]>;
		/** Resolved `xlsx` (SheetJS) module, e.g. `import * as xlsx from 'xlsx'`.
		 * Enables the "Export as Excel" option; omit to only offer CSV. */
		xlsx?: XlsxModule;
		onCreate?: () => void;
		onEdit?: (item: T) => void;
		onView?: (item: T) => void;
		onAction?: (action: CustomAction<T>, item: T) => void;
	} = $props();

	const icons = $derived(getIconSet() ?? defaultIconSet);
	const entityIcon = $derived(icon ?? icons.folder);

	const allowRead = $derived(read.enabled ?? true);
	const allowUpdate = $derived(update.enabled ?? true);
	const allowDelete = $derived(deletion.enabled ?? true);
	const deleteLabel = $derived(deletion.label ?? strings.delete);
	const updateLabel = $derived(update.label ?? strings.edit);
	const readLabel = $derived(read.label ?? strings.view);
	const showRowActions = $derived(allowRead || allowUpdate || allowDelete || actions.length > 0);
	const allowSelection = $derived(allowDelete || customBulkActions.length > 0);

	let selected = new SvelteSet<number>();
	let pendingDeletion = $state<T[] | null>(null);
	let pendingBulkAction = $state<{ action: CustomBulkAction<T>; items: T[] } | null>(null);
	const selectedItems = $derived([...selected].map((i) => data[i]));

	let visibleRows = $state<T[]>([]);
	let exportQuery = $state<TableQuery | undefined>(undefined);
	let exportPopoverEl: HTMLElement | undefined = $state();
	const exportId = $props.id();

	async function resolveExportRows(): Promise<T[]> {
		if (!pagination) return visibleRows;
		if (!onExport || !exportQuery) return data;
		return onExport(exportQuery);
	}

	async function handleExport(format: 'csv' | 'xlsx') {
		exportPopoverEl?.hidePopover();
		const rows = await resolveExportRows();
		const filename = `${labelMany || 'export'}-${new Date().toISOString().slice(0, 10)}`;
		if (format === 'csv') downloadCsv(rows, columns, filename);
		else if (xlsx) downloadXlsx(rows, columns, filename, xlsx);
	}

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

	async function runEndpointAction(endpoint: string, items: T[]) {
		await Promise.all(
			items.map((item) => {
				const fd = new FormData();
				fd.set('id', String((item as Record<string, unknown>)[idKey] ?? ''));
				return fetch(endpoint, { method: 'POST', body: fd });
			})
		);
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

	function handleCreate() {
		onCreate?.();
	}

	function handleDelete() {
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
		await runEndpointAction(action.endpoint, items);
	}

	function requestBulkAction(action: CustomBulkAction<T>, items: T[]) {
		if (action.confirm) {
			pendingBulkAction = { action, items };
		} else {
			runBulkAction(action, items);
		}
	}

	function handleBulkAction(action: CustomBulkAction<T>) {
		const items = selectedItems;
		selected.clear();
		requestBulkAction(action, items);
	}

	async function confirmBulkAction() {
		if (pendingBulkAction) {
			await runBulkAction(pendingBulkAction.action, pendingBulkAction.items);
			pendingBulkAction = null;
		}
	}

	const rowActions = $derived<RowAction<T>[]>([
		...actions.map((action) => ({
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
						run: (item: T) => requestDeletion([item])
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

<div class="flex flex-col gap-6">
	<Header
		title={labelMany}
		breadcrumbs={[{ label: labelMany, icon: entityIcon, link: { href: '#' }, prominent: true }]}
	>
		{#snippet buttons()}
			{#if search}
				<SearchInput config={search} />
			{/if}

			{#if enableExport}
				{@const ExportIcon = icons.download}
				<Button
					variant="ghost"
					class="btn-square"
					popovertarget="export-menu-{exportId}"
					style="anchor-name:--export-anchor-{exportId}"
					aria-label={strings.export}
					title={strings.export}
				>
					<ExportIcon class="size-4" />
				</Button>
				<div
					popover="auto"
					id="export-menu-{exportId}"
					style="position-anchor:--export-anchor-{exportId}"
					class="dropdown dropdown-end w-40 rounded-box border border-base-content/10 bg-base-100 p-1 shadow-lg"
					bind:this={exportPopoverEl}
				>
					<Button
						variant="ghost"
						class="btn-sm w-full justify-start"
						onclick={() => handleExport('csv')}
					>
						{strings.exportCsv}
					</Button>
					{#if xlsx}
						<Button
							variant="ghost"
							class="btn-sm w-full justify-start"
							onclick={() => handleExport('xlsx')}
						>
							{strings.exportExcel}
						</Button>
					{/if}
				</div>
			{/if}

			{#each customBulkActions as bulkAction (bulkAction.label)}
				{#if bulkAction.condition?.(selectedItems) ?? true}
					{@const BulkIcon = bulkAction.icon}
					<Button
						variant={bulkAction.variant ?? 'ghost'}
						class="btn-outline"
						disabled={selected.size === 0}
						onclick={() => handleBulkAction(bulkAction)}
					>
						<BulkIcon class="size-4" />
						{bulkAction.label} ({selected.size})
					</Button>
				{/if}
			{/each}

			{#if allowDelete}
				{@const DeleteIcon = icons.delete}
				<Button
					variant="error"
					class="btn-outline"
					disabled={selected.size === 0}
					onclick={handleDelete}
				>
					<DeleteIcon class="size-4" />
					{deleteLabel} ({selected.size})
				</Button>
			{/if}

			{@const CreateIcon = icons.create}
			<Button variant="primary" onclick={handleCreate}>
				<CreateIcon class="size-5" />
				{#if creation.label}
					<span>{creation.label}</span>
				{:else}
					<span>{strings.create}<span class="hidden sm:inline">&nbsp;{labelOne}</span></span>
				{/if}
			</Button>
		{/snippet}
	</Header>

	<div class="table-wrapper">
		<PaginatedTable
			{data}
			{columns}
			{pageSize}
			selectable={allowSelection}
			{selected}
			rowActions={showRowActions ? actionsCell : undefined}
			{pagination}
			{initialSort}
			{initialFilters}
			{onPaginationChange}
			bind:visibleRows
			bind:query={exportQuery}
		/>
	</div>
</div>

{#if pendingDeletion !== null}
	<Modal title={deleteLabel} onClose={() => (pendingDeletion = null)}>
		<p>{strings.deleteConfirm(pendingDeletion.length, deleteLabel)}</p>
		<div class="flex justify-end gap-2 mt-4">
			<Button variant="ghost" onclick={() => (pendingDeletion = null)}>
				{strings.cancel}
			</Button>
			<Button variant="error" onclick={confirmDeletion}>
				{strings.confirm}
			</Button>
		</div>
	</Modal>
{/if}

{#if pendingBulkAction !== null}
	<Modal title={pendingBulkAction.action.label} onClose={() => (pendingBulkAction = null)}>
		<p>{strings.deleteConfirm(pendingBulkAction.items.length, pendingBulkAction.action.label)}</p>
		<div class="flex justify-end gap-2 mt-4">
			<Button variant="ghost" onclick={() => (pendingBulkAction = null)}>
				{strings.cancel}
			</Button>
			<Button variant={pendingBulkAction.action.variant ?? 'primary'} onclick={confirmBulkAction}>
				{strings.confirm}
			</Button>
		</div>
	</Modal>
{/if}

<style>
	.table-wrapper {
		width: 100%;
		max-width: var(--runeforge-crud-max-width);
		margin-inline: auto;
	}
</style>
