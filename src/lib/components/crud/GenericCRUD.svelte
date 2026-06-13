<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { page } from '$app/state';
  import { goto } from '$app/navigation';
  import List from '$lib/components/crud/views/List.svelte';
  import Read from '$lib/components/crud/views/Read.svelte';
  import Create from '$lib/components/crud/views/Create.svelte';
  import Update from '$lib/components/crud/views/Update.svelte';
  import { AUTO_EXCLUDED } from '$lib/components/crud/utils/constants.js';
  import { resolveOptions, resolveFormatter, inferType } from '$lib/components/crud/utils/resolution.js';
  import type { AttributeMetadata } from '$lib/types/attribute.js';
  import type {
    ActionConfiguration,
    ColumnDefinition,
    CustomAction,
    FieldDefinition,
  } from '$lib/types/crud.js';

  let {
    data = undefined as Record<string, unknown> | undefined,
    dataKey = undefined as string | undefined,
    labelOne = '',
    labelMany = '',
    icon,
    pageSize = 10,
    creation = {} as ActionConfiguration<T>,
    update = {} as ActionConfiguration<T>,
    read = {} as ActionConfiguration<T>,
    deletion = {} as ActionConfiguration<T>,
    actions = [] as CustomAction<T>[],
    columns = undefined as ColumnDefinition<T>[] | undefined,
    fields = undefined as FieldDefinition<T>[] | undefined,
    meta = undefined as Partial<Record<string, AttributeMetadata>> | undefined,
    form = null as { error?: string } | null,
  }: {
    data?: Record<string, unknown>;
    dataKey?: string;
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
    columns?: ColumnDefinition<T>[];
    fields?: FieldDefinition<T>[];
    meta?: Partial<Record<string, AttributeMetadata>>;
    form?: { error?: string } | null;
  } = $props();

  const entityData = $derived<T[]>(
    data && dataKey ? (data[dataKey] as T[] ?? []) : []
  );

  const viewParam = $derived(page.url.searchParams.get('view'));
  const idParam   = $derived(page.url.searchParams.get('id'));

  const creating = $derived(viewParam === 'create');
  const reading  = $derived(idParam !== null && viewParam === null);
  const editing  = $derived(idParam !== null && viewParam === 'edit');

  const singleInstance = $derived<T | undefined>(
    (Object.values(page.data as Record<string, unknown>).find(
      (v) => v !== null && typeof v === 'object' && !Array.isArray(v) && '_id' in (v as object)
    ) as T | undefined)
  );

  let activeAction = $state<{ action: CustomAction<T>; item: T } | null>(null);

  async function navList()      { await goto('?'); }
  async function navCreate()    { await goto('?view=create'); }
  async function navRead(item: T) {
    await goto(`?id=${encodeURIComponent(String((item as Record<string, unknown>)._id ?? ''))}`);
  }
  async function navEdit(item: T) {
    await goto(`?id=${encodeURIComponent(String((item as Record<string, unknown>)._id ?? ''))}&view=edit`);
  }

  const resolvedColumns: ColumnDefinition<T>[] = $derived(
    columns ?? (meta
      ? (Object.entries(meta) as [string, AttributeMetadata][])
          .filter(([, m]) => !m.excludedFromList)
          .map(([k, m]) => ({
            attribute: k as keyof T & string,
            title: m.label ?? k,
            type: m.type,
            formatter: resolveFormatter(m, data),
            component: m.component,
            sortable: m.sortable,
            filterable: m.filterable,
          }))
      : entityData.length > 0
        ? (Object.keys(entityData[0]) as (keyof T & string)[])
            .filter((k) => k !== '_id')
            .map((k) => ({ attribute: k, title: k }))
        : [])
  );

  const resolvedFields: FieldDefinition<T>[] = $derived(
    fields ?? (meta
      ? (Object.entries(meta) as [string, AttributeMetadata][])
          .filter(([k, m]) => !AUTO_EXCLUDED.has(k) && !m.excludedFromCreate)
          .map(([k, m]) => ({
            attribute: k as keyof T & string,
            title: m.label,
            type: m.type ?? inferType(k, undefined),
            required: m.required,
            autocomplete: m.autocomplete,
            placeholder: m.placeholder,
            default: m.default,
            options: resolveOptions(m, data),
          }))
      : entityData.length > 0
        ? (Object.entries(entityData[0]) as [string, unknown][])
            .filter(([k]) => !AUTO_EXCLUDED.has(k))
            .map(([k, v]) => ({ attribute: k as keyof T & string, type: inferType(k, v) }))
        : [])
  );

  const resolvedReadFields: FieldDefinition<T>[] = $derived(
    fields ?? (meta
      ? (Object.entries(meta) as [string, AttributeMetadata][])
          .filter(([k, m]) => !AUTO_EXCLUDED.has(k) && !m.excludedFromRead)
          .map(([k, m]) => ({
            attribute: k as keyof T & string,
            title: m.label,
            type: m.type ?? inferType(k, undefined),
            required: m.required,
            autocomplete: m.autocomplete,
            placeholder: m.placeholder,
            default: m.default,
            options: resolveOptions(m, data),
          }))
      : entityData.length > 0
        ? (Object.entries(entityData[0]) as [string, unknown][])
            .filter(([k]) => !AUTO_EXCLUDED.has(k))
            .map(([k, v]) => ({ attribute: k as keyof T & string, type: inferType(k, v) }))
        : [])
  );

  const resolvedUpdateFields: FieldDefinition<T>[] = $derived(
    fields ?? (meta
      ? (Object.entries(meta) as [string, AttributeMetadata][])
          .filter(([k, m]) => !AUTO_EXCLUDED.has(k) && !m.excludedFromUpdate)
          .map(([k, m]) => ({
            attribute: k as keyof T & string,
            title: m.label,
            type: m.type ?? inferType(k, undefined),
            required: m.required,
            autocomplete: m.autocomplete,
            placeholder: m.placeholder,
            default: m.default,
            options: resolveOptions(m, data),
          }))
      : entityData.length > 0
        ? (Object.entries(entityData[0]) as [string, unknown][])
            .filter(([k]) => !AUTO_EXCLUDED.has(k))
            .map(([k, v]) => ({ attribute: k as keyof T & string, type: inferType(k, v) }))
        : [])
  );

  const serverError = $derived(
    creating || reading || editing || activeAction !== null
      ? (form?.error ?? '')
      : ''
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
    fields={resolvedReadFields}
    instance={singleInstance ?? {} as T}
    {read}
    onCancel={navList}
  />
{:else if editing}
  <Update
    {labelOne}
    {labelMany}
    {icon}
    fields={resolvedUpdateFields}
    instance={singleInstance ?? {} as T}
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
    {creation}
    {update}
    {read}
    {deletion}
    {actions}
    columns={resolvedColumns}
    onCreate={navCreate}
    onEdit={navEdit}
    onView={navRead}
    onAction={(action, item) => {
      if (action.condition?.(item) ?? true) activeAction = { action, item };
    }}
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
