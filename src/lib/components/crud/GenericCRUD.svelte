<script lang="ts" generics="T extends object = Record<string, unknown>">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import List from '$lib/components/crud/views/List.svelte';
	import Read from '$lib/components/crud/views/Read.svelte';
	import Create from '$lib/components/crud/views/Create.svelte';
	import Update from '$lib/components/crud/views/Update.svelte';
	import { AUTO_EXCLUDED } from '$lib/components/crud/utils/constants.js';
	import {
		resolveFormatter,
		inferType,
		buildFieldDefinitions
	} from '$lib/components/crud/utils/resolution.js';
	import { isFilterable } from '$lib/components/table/utils.js';
	import type { XlsxModule } from '$lib/components/table/export.js';
	import type { AttributeMetadata } from '$lib/types/attribute.js';
	import type {
		ActionConfiguration,
		ColumnDefinition,
		CustomAction,
		CustomBulkAction,
		FieldDefinition,
		SearchConfiguration
	} from '$lib/types/crud.js';
	import type {
		FilterSnapshot,
		PaginatedEnvelope,
		ServerPagination,
		SortDirection,
		TableQuery
	} from '$lib/types/table.js';

	let {
		data = undefined as Record<string, unknown> | undefined,
		dataKey = undefined as string | undefined,
		idKey = '_id',
		labelOne = '',
		labelMany = '',
		icon,
		pageSize = 10,
		creation = {} as ActionConfiguration<T>,
		update = {} as ActionConfiguration<T>,
		read = {} as ActionConfiguration<T>,
		deletion = {} as ActionConfiguration<T>,
		actions = [] as CustomAction<T>[],
		customBulkActions = [] as CustomBulkAction<T>[],
		search = undefined as SearchConfiguration | undefined,
		columns = undefined as ColumnDefinition<T>[] | undefined,
		fields = undefined as FieldDefinition<T>[] | undefined,
		meta = undefined as Partial<Record<string, AttributeMetadata>> | undefined,
		form = null as { error?: string } | null,
		enableExport = false,
		onExport = undefined as ((query: TableQuery) => Promise<T[]>) | undefined,
		xlsx = undefined as XlsxModule | undefined
	}: {
		data?: Record<string, unknown>;
		dataKey?: string;
		idKey?: string;
		labelOne?: string;
		labelMany?: string;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		icon?: any;
		pageSize?: number;
		creation?: ActionConfiguration<T>;
		update?: ActionConfiguration<T>;
		read?: ActionConfiguration<T>;
		deletion?: ActionConfiguration<T>;
		actions?: CustomAction<T>[];
		customBulkActions?: CustomBulkAction<T>[];
		search?: SearchConfiguration;
		columns?: ColumnDefinition<T>[];
		fields?: FieldDefinition<T>[];
		meta?: Partial<Record<string, AttributeMetadata>>;
		form?: { error?: string } | null;
		enableExport?: boolean;
		onExport?: (query: TableQuery) => Promise<T[]>;
		xlsx?: XlsxModule;
	} = $props();

	function isEnvelope(value: unknown): value is PaginatedEnvelope<T> {
		return (
			!!value &&
			typeof value === 'object' &&
			!Array.isArray(value) &&
			Array.isArray((value as Record<string, unknown>).results) &&
			typeof (value as Record<string, unknown>).count === 'number'
		);
	}

	const rawSlice = $derived(data && dataKey ? data[dataKey] : undefined);
	const envelope = $derived(isEnvelope(rawSlice) ? rawSlice : undefined);
	const entityData = $derived<T[]>(
		envelope ? envelope.results : Array.isArray(rawSlice) ? (rawSlice as T[]) : []
	);

	const serverPagination = $derived<ServerPagination | undefined>(
		envelope
			? {
					page: envelope.page,
					pageSize: envelope.pageSize,
					totalPages: Math.max(1, Math.ceil(envelope.count / envelope.pageSize)),
					total: envelope.count
				}
			: undefined
	);

	const viewParam = $derived(page.url.searchParams.get('view'));
	const idParam = $derived(page.url.searchParams.get('id'));

	const creating = $derived(viewParam === 'create');
	const reading = $derived(idParam !== null && viewParam === null);
	const editing = $derived(idParam !== null && viewParam === 'edit');

	const excluded = $derived(new Set([...AUTO_EXCLUDED, idKey]));

	const singleInstance = $derived<T | undefined>(
		Object.values(page.data as Record<string, unknown>).find(
			(v) => v !== null && typeof v === 'object' && !Array.isArray(v) && idKey in (v as object)
		) as T | undefined
	);

	let activeAction = $state<{ action: CustomAction<T>; item: T } | null>(null);

	async function runAction(action: CustomAction<T>, item: T) {
		if (!(action.condition?.(item) ?? true)) return;
		if (action.href) {
			await goto(action.href(item));
			return;
		}
		activeAction = { action, item };
	}

	async function navList() {
		await goto('?');
	}
	async function navCreate() {
		await goto('?view=create');
	}
	async function navRead(item: T) {
		await goto(`?id=${encodeURIComponent(String((item as Record<string, unknown>)[idKey] ?? ''))}`);
	}
	async function navEdit(item: T) {
		await goto(
			`?id=${encodeURIComponent(String((item as Record<string, unknown>)[idKey] ?? ''))}&view=edit`
		);
	}

	const resolvedColumns: ColumnDefinition<T>[] = $derived(
		columns ??
			(meta
				? (Object.entries(meta) as [string, AttributeMetadata][])
						.filter(([, m]) => !m.excludedFromList)
						.map(([k, m]) => ({
							attribute: k as keyof T & string,
							title: m.label ?? k,
							type: m.type,
							formatter: resolveFormatter(m, data),
							component: m.component,
							sortable: m.sortable,
							filterable: m.filterable
						}))
				: entityData.length > 0
					? (Object.keys(entityData[0]) as (keyof T & string)[])
							.filter((k) => !excluded.has(k))
							.map((k) => ({ attribute: k, title: k }))
					: [])
	);

	// Server-pagination mode only: GenericCRUD owns `page`/`ordering`/per-column
	// filter query params the same way it already owns `view`/`id`, so pagination
	// state survives reloads/direct links and `+page.svelte` never has to change.
	const orderingParam = $derived(page.url.searchParams.get('ordering'));
	const initialSort = $derived(
		orderingParam
			? {
					column: orderingParam.startsWith('-') ? orderingParam.slice(1) : orderingParam,
					direction: (orderingParam.startsWith('-') ? 'desc' : 'asc') as SortDirection
				}
			: undefined
	);

	const initialFilters = $derived.by<Partial<FilterSnapshot> | undefined>(() => {
		if (!envelope) return undefined;
		const text: Record<string, string> = {};
		const values: Record<string, string[]> = {};
		const dateRanges: Record<string, { from: string; to: string }> = {};
		for (const col of resolvedColumns) {
			if (!isFilterable(col)) continue;
			const raw = page.url.searchParams.get(col.attribute);
			if (raw != null) {
				if (col.type === 'boolean') values[col.attribute] = raw.split(',').filter(Boolean);
				else text[col.attribute] = raw;
			}
			const from = page.url.searchParams.get(`${col.attribute}_from`);
			const to = page.url.searchParams.get(`${col.attribute}_to`);
			if (from || to) dateRanges[col.attribute] = { from: from ?? '', to: to ?? '' };
		}
		return { text, values, dateRanges };
	});

	async function handlePaginationChange(query: TableQuery) {
		// Local, synchronous query-string builder consumed immediately by goto();
		// not rendered/reactive state, so plain URLSearchParams is correct here.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const params = new URLSearchParams(page.url.searchParams);
		params.delete('view');
		params.delete('id');

		if (query.page > 1) params.set('page', String(query.page));
		else params.delete('page');

		if (query.ordering) params.set('ordering', query.ordering);
		else params.delete('ordering');

		for (const col of resolvedColumns) {
			params.delete(col.attribute);
			params.delete(`${col.attribute}_from`);
			params.delete(`${col.attribute}_to`);
		}
		for (const [k, v] of Object.entries(query.filters.text)) {
			if (v) params.set(k, v);
		}
		for (const [k, vs] of Object.entries(query.filters.values)) {
			if (vs.length) params.set(k, vs.join(','));
		}
		for (const [k, r] of Object.entries(query.filters.dateRanges)) {
			if (r.from) params.set(`${k}_from`, r.from);
			if (r.to) params.set(`${k}_to`, r.to);
		}

		const qs = params.toString();
		await goto(qs ? `?${qs}` : '?', { keepFocus: true, noScroll: true });
	}

	const resolvedFields: FieldDefinition<T>[] = $derived(
		fields ??
			(meta
				? buildFieldDefinitions<T>(meta, data, 'excludedFromCreate', excluded)
				: entityData.length > 0
					? (Object.entries(entityData[0]) as [string, unknown][])
							.filter(([k]) => !excluded.has(k))
							.map(([k, v]) => ({ attribute: k as keyof T & string, type: inferType(k, v) }))
					: [])
	);

	const resolvedReadFields: FieldDefinition<T>[] = $derived(
		fields ??
			(meta
				? buildFieldDefinitions<T>(meta, data, 'excludedFromRead', excluded)
				: entityData.length > 0
					? (Object.entries(entityData[0]) as [string, unknown][])
							.filter(([k]) => !excluded.has(k))
							.map(([k, v]) => ({ attribute: k as keyof T & string, type: inferType(k, v) }))
					: [])
	);

	const resolvedUpdateFields: FieldDefinition<T>[] = $derived(
		fields ??
			(meta
				? buildFieldDefinitions<T>(meta, data, 'excludedFromUpdate', excluded)
				: entityData.length > 0
					? (Object.entries(entityData[0]) as [string, unknown][])
							.filter(([k]) => !excluded.has(k))
							.map(([k, v]) => ({ attribute: k as keyof T & string, type: inferType(k, v) }))
					: [])
	);

	const serverError = $derived(
		creating || reading || editing || activeAction !== null ? (form?.error ?? '') : ''
	);
</script>

{#if creating}
	<Create
		{labelOne}
		{labelMany}
		{icon}
		fields={resolvedFields}
		{creation}
		{serverError}
		onCancel={navList}
		onSuccess={navList}
	/>
{:else if reading}
	<Read
		{labelOne}
		{labelMany}
		{icon}
		{idKey}
		fields={resolvedReadFields}
		instance={singleInstance ?? ({} as T)}
		{read}
		onCancel={navList}
	/>
{:else if editing}
	<Update
		{labelOne}
		{labelMany}
		{icon}
		{idKey}
		fields={resolvedUpdateFields}
		instance={singleInstance ?? ({} as T)}
		{update}
		{serverError}
		onCancel={navList}
		onSuccess={navList}
	/>
{:else}
	<List
		data={entityData}
		{labelOne}
		{labelMany}
		{icon}
		{pageSize}
		{idKey}
		{creation}
		{update}
		{read}
		{deletion}
		{actions}
		{customBulkActions}
		{search}
		columns={resolvedColumns}
		pagination={serverPagination}
		{initialSort}
		{initialFilters}
		onPaginationChange={handlePaginationChange}
		{enableExport}
		{onExport}
		{xlsx}
		onCreate={navCreate}
		onEdit={navEdit}
		onView={navRead}
		onAction={runAction}
	/>
{/if}

{#if activeAction !== null}
	{@const ActionView = activeAction.action.view}
	<ActionView
		instance={activeAction.item}
		label={activeAction.action.label}
		endpoint={activeAction.action.endpoint}
		{serverError}
		onCancel={() => (activeAction = null)}
		onSuccess={() => (activeAction = null)}
	/>
{/if}
