<script lang="ts" generics="T extends object = Record<string, unknown>">
  import { SvelteSet } from 'svelte/reactivity';
  import { invalidateAll } from '$app/navigation';
  import Button from '$lib/components/form/Button.svelte';
  import Header from '$lib/components/common/Header.svelte';
  import PaginatedTable from '$lib/components/table/PaginatedTable.svelte';
  import { getIconSet } from '$lib/icons/context.js';
  import { defaultIconSet } from '$lib/icons/sets/default.js';
  import type {
    ActionConfiguration,
    ColumnDefinition,
    CustomAction,
    RowAction
  } from '$lib/types/crud.js';
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
    columns = [] as ColumnDefinition<T>[],
    onCreate,
    onEdit,
    onView,
    onAction,
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
    columns?: ColumnDefinition<T>[];
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

  let selected = new SvelteSet<number>();

  async function runEndpointAction(endpoint: string, items: T[]) {
    await Promise.all(items.map((item) => {
      const fd = new FormData();
      fd.set('id', String((item as Record<string, unknown>)[idKey] ?? ''));
      return fetch(endpoint, { method: 'POST', body: fd });
    }));
    await invalidateAll();
  }

  async function runDeletion(items: T[]) {
    if (deletion.endpoint) {
      await runEndpointAction(deletion.endpoint, items);
    } else {
      await deletion.callback?.(items);
    }
  }

  function handleCreate() { onCreate?.(); }

  async function handleDelete() {
    const items = [...selected].map(i => data[i]);
    selected.clear();
    await runDeletion(items);
  }

  const rowActions = $derived<RowAction<T>[]>([
    ...actions.map((action) => ({
      label: action.label,
      icon: action.icon,
      condition: action.condition,
      run: (item: T) => onAction?.(action, item),
    })),
    ...(allowRead ? [{ label: readLabel, icon: icons.view, run: (item: T) => onView?.(item) }] : []),
    ...(allowUpdate ? [{ label: updateLabel, icon: icons.edit, run: (item: T) => onEdit?.(item) }] : []),
    ...(allowDelete ? [{ label: deleteLabel, icon: icons.delete, class: 'text-error', run: (item: T) => runDeletion([item]) }] : []),
  ]);
</script>

{#snippet actionsCell(item: T)}
  <div class="flex justify-end gap-1">
    {#each rowActions as action (action.label)}
      {#if action.condition?.(item) ?? true}
        {@const Icon = action.icon}
        <Button
          variant="ghost"
          class={['btn-xs', action.class]}
          title={action.label}
          aria-label={action.label}
          onclick={(e) => { e.stopPropagation(); action.run(item); }}
        >
          <Icon class="size-4" />
        </Button>
      {/if}
    {/each}
  </div>
{/snippet}

<div class="flex flex-col gap-6">

  <Header
    admin
    title={labelMany}
    breadcrumbs={[
      { label: labelMany, icon: entityIcon, link: { href: '#' }, prominent: true },
    ]}
  >
    {#snippet buttons()}
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
      <Button
        variant="primary"
        onclick={handleCreate}
      >
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
      selectable={allowDelete}
      {selected}
      rowActions={showRowActions ? actionsCell : undefined}
    />
  </div>
</div>

<style>
  .table-wrapper {
    width: 100%;
    max-width: var(--runeforge-crud-max-width);
    margin-inline: auto;
  }
</style>
