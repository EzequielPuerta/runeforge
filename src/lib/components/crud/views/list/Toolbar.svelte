<script lang="ts" generics="T extends object = Record<string, unknown>">
	import Button from '$lib/components/form/Button.svelte';
	import Header from '$lib/components/common/Header.svelte';
	import { downloadCsv, downloadXlsx } from '$lib/components/table/export.js';
	import { getIconSet } from '$lib/icons/context.js';
	import { defaultIconSet } from '$lib/icons/sets/default.js';
	import type {
		ActionConfiguration,
		ColumnDefinition,
		CustomBulkAction,
		ExportConfiguration,
		SearchConfiguration,
		ViewBasedCustomBulkAction
	} from '$lib/types/crud.js';
	import type { ServerPagination, TableQuery } from '$lib/types/table.js';
	import { getStrings } from '$lib/i18n/context.js';
	import SearchInput from '$lib/components/crud/SearchInput.svelte';

	const strings = getStrings();

	function isViewBasedBulkAction<U extends object>(
		action: CustomBulkAction<U>
	): action is ViewBasedCustomBulkAction<U> {
		return action.kind === 'view';
	}

	let {
		labelOne = '',
		labelMany = '',
		icon,
		creation = {} as ActionConfiguration<T>,
		allowCreate,
		allowDelete,
		deleteLabel,
		search = undefined as SearchConfiguration | undefined,
		exportConfig = undefined as ExportConfiguration<T> | undefined,
		bulkActions = [] as CustomBulkAction<T>[],
		columns = [] as ColumnDefinition<T>[],
		pagination = undefined as ServerPagination | undefined,
		visibleRows = [] as T[],
		exportQuery = undefined as TableQuery | undefined,
		selectedCount = 0,
		selectedItems = [] as T[],
		onCreate,
		onDeleteSelected,
		onBulkAction
	}: {
		labelOne?: string;
		labelMany?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon?: any;
		creation?: ActionConfiguration<T>;
		allowCreate: boolean;
		allowDelete: boolean;
		deleteLabel: string;
		search?: SearchConfiguration;
		exportConfig?: ExportConfiguration<T>;
		bulkActions?: CustomBulkAction<T>[];
		columns?: ColumnDefinition<T>[];
		pagination?: ServerPagination;
		visibleRows?: T[];
		exportQuery?: TableQuery;
		selectedCount?: number;
		selectedItems?: T[];
		onCreate?: () => void;
		onDeleteSelected?: () => void;
		onBulkAction?: (action: CustomBulkAction<T>) => void;
	} = $props();

	const icons = $derived(getIconSet() ?? defaultIconSet);
	const entityIcon = $derived(icon ?? icons.folder);
	const enableExport = $derived(!!exportConfig);

	let exportPopoverEl: HTMLElement | undefined = $state();
	let actionsPopoverEl: HTMLElement | undefined = $state();
	const exportId = $props.id();
	const actionsMenuId = `${exportId}-actions`;

	// Collapses export/bulk-actions/delete into a single "Acciones" dropdown
	// once the toolbar no longer fits its available width (small monitor, a
	// browser window not maximized, many bulkActions, ...) — measured against
	// an identical but off-flow, always-uncollapsed clone rather than the
	// visible row itself, since the visible row's own width changes depending
	// on whether it's currently collapsed.
	let toolbarEl: HTMLElement | undefined = $state();
	let toolbarMeasureEl: HTMLElement | undefined = $state();
	let toolbarCollapsed = $state(false);

	$effect(() => {
		if (!toolbarEl || !toolbarMeasureEl) return;
		const el = toolbarEl;
		const measureEl = toolbarMeasureEl;
		const check = () => {
			toolbarCollapsed = measureEl.scrollWidth > el.clientWidth + 1;
		};
		const observer = new ResizeObserver(check);
		observer.observe(el);
		observer.observe(measureEl);
		check();
		return () => observer.disconnect();
	});

	async function resolveExportRows(): Promise<T[]> {
		if (!pagination) return visibleRows;
		if (!exportConfig?.callback || !exportQuery) return visibleRows;
		return exportConfig.callback(exportQuery);
	}

	async function handleExport(format: 'csv' | 'xlsx') {
		exportPopoverEl?.hidePopover();
		const rows = await resolveExportRows();
		const filename = `${labelMany || 'export'}-${new Date().toISOString().slice(0, 10)}`;
		if (format === 'csv') downloadCsv(rows, columns, filename);
		else if (exportConfig?.xlsx) downloadXlsx(rows, columns, filename, exportConfig.xlsx);
	}

	function handleCreate() {
		onCreate?.();
	}

	function handleDelete() {
		onDeleteSelected?.();
	}

	function handleBulkAction(action: CustomBulkAction<T>) {
		onBulkAction?.(action);
	}
</script>

{#snippet toolbarButtons(measuring: boolean)}
	{#if search}
		<SearchInput config={search} />
	{/if}

	{#if enableExport}
		{@const ExportIcon = icons.download}
		<Button
			variant="ghost"
			class="btn-square"
			popovertarget={measuring ? undefined : `export-menu-${exportId}`}
			style={measuring ? undefined : `anchor-name:--export-anchor-${exportId}`}
			aria-label={strings.export}
			title={strings.export}
		>
			<ExportIcon class="size-4" />
		</Button>
		{#if !measuring}
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
				{#if exportConfig?.xlsx}
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
	{/if}

	{#each bulkActions as bulkAction, i (i)}
		{#if bulkAction.condition?.(selectedItems) ?? true}
			{@const BulkIcon = bulkAction.icon}
			{@const isView = isViewBasedBulkAction(bulkAction)}
			<Button
				variant={bulkAction.variant ?? 'ghost'}
				class="btn-outline"
				disabled={!isView && selectedCount === 0}
				title={bulkAction.tooltip ?? bulkAction.label}
				aria-label={bulkAction.label ? undefined : bulkAction.tooltip}
				onclick={measuring ? undefined : () => handleBulkAction(bulkAction)}
			>
				<BulkIcon class="size-4" />
				{#if bulkAction.label}
					{bulkAction.label}{#if !isView}
						&nbsp;({selectedCount})
					{/if}
				{/if}
			</Button>
		{/if}
	{/each}

	{#if allowDelete}
		{@const DeleteIcon = icons.delete}
		<Button
			variant="error"
			class="btn-outline"
			disabled={selectedCount === 0}
			onclick={measuring ? undefined : handleDelete}
		>
			<DeleteIcon class="size-4" />
			{deleteLabel} ({selectedCount})
		</Button>
	{/if}

	{#if allowCreate}
		{@const CreateIcon = icons.create}
		<Button variant="primary" onclick={measuring ? undefined : handleCreate}>
			<CreateIcon class="size-5" />
			{#if creation.label}
				<span>{creation.label}</span>
			{:else}
				<span>{strings.create}<span class="hidden sm:inline">&nbsp;{labelOne}</span></span>
			{/if}
		</Button>
	{/if}
{/snippet}

<Header
	title={labelMany}
	breadcrumbs={[{ label: labelMany, icon: entityIcon, link: { href: '#' }, prominent: true }]}
>
	{#snippet buttons()}
		<div bind:this={toolbarEl} class="flex min-w-0 flex-wrap items-center gap-2 overflow-hidden">
			{#if toolbarCollapsed}
				{#if search}
					<SearchInput config={search} />
				{/if}

				<Button
					variant="ghost"
					class="btn-square"
					popovertarget="actions-menu-{actionsMenuId}"
					style="anchor-name:--actions-anchor-{actionsMenuId}"
					aria-label={strings.actions}
					title={strings.actions}
				>
					<span class="text-lg leading-none" aria-hidden="true">⋯</span>
				</Button>
				<div
					popover="auto"
					id="actions-menu-{actionsMenuId}"
					style="position-anchor:--actions-anchor-{actionsMenuId}"
					class="dropdown dropdown-end w-56 rounded-box border border-base-content/10 bg-base-100 p-1 shadow-lg"
					bind:this={actionsPopoverEl}
				>
					{#if allowCreate}
						{@const CreateIcon = icons.create}
						<Button
							variant="ghost"
							class="btn-sm w-full justify-start"
							onclick={() => {
								actionsPopoverEl?.hidePopover();
								handleCreate();
							}}
						>
							<CreateIcon class="size-4" />
							{creation.label || `${strings.create} ${labelOne}`}
						</Button>
					{/if}

					{#if allowDelete}
						<Button
							variant="ghost"
							class="btn-sm w-full justify-start text-error"
							disabled={selectedCount === 0}
							onclick={() => {
								actionsPopoverEl?.hidePopover();
								handleDelete();
							}}
						>
							{deleteLabel} ({selectedCount})
						</Button>
					{/if}

					{#if enableExport}
						<Button
							variant="ghost"
							class="btn-sm w-full justify-start"
							onclick={() => {
								actionsPopoverEl?.hidePopover();
								handleExport('csv');
							}}
						>
							{strings.exportCsv}
						</Button>
						{#if exportConfig?.xlsx}
							<Button
								variant="ghost"
								class="btn-sm w-full justify-start"
								onclick={() => {
									actionsPopoverEl?.hidePopover();
									handleExport('xlsx');
								}}
							>
								{strings.exportExcel}
							</Button>
						{/if}
					{/if}

					{#each bulkActions as bulkAction, i (i)}
						{#if bulkAction.condition?.(selectedItems) ?? true}
							{@const BulkIcon = bulkAction.icon}
							{@const isView = isViewBasedBulkAction(bulkAction)}
							<Button
								variant="ghost"
								class="btn-sm w-full justify-start"
								disabled={!isView && selectedCount === 0}
								title={bulkAction.tooltip}
								onclick={() => {
									actionsPopoverEl?.hidePopover();
									handleBulkAction(bulkAction);
								}}
							>
								<BulkIcon class="size-4" />
								{bulkAction.label ?? bulkAction.tooltip}{#if !isView}
									&nbsp;({selectedCount})
								{/if}
							</Button>
						{/if}
					{/each}
				</div>
			{:else}
				{@render toolbarButtons(false)}
			{/if}
		</div>

		<div
			bind:this={toolbarMeasureEl}
			class="pointer-events-none invisible fixed flex items-center gap-2 whitespace-nowrap"
			style="left:-9999px; top:-9999px; width:max-content;"
			aria-hidden="true"
		>
			{@render toolbarButtons(true)}
		</div>
	{/snippet}
</Header>
